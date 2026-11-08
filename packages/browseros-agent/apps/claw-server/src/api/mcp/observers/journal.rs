//! Keeps the agent's `run` scripts in the session's run journal while ultrafast skills are on,
//! so saving the session as a skill can compile it. Flow runs and scripts that may hold secrets
//! are never kept.

use crate::{
    api::mcp::dispatch::ToolObserverContext,
    clock::now_epoch_ms,
    services::flow::{
        compose::is_flow_script,
        journal::{self as run_journal, JournalEntry, RETENTION},
    },
};
use futures_util::future::BoxFuture;
use serde_json::Value;
use std::sync::atomic::{AtomicBool, AtomicI64, Ordering};

const SWEEP_EVERY_MS: i64 = 60 * 60 * 1000;
static LAST_SWEEP_MS: AtomicI64 = AtomicI64::new(0);
static SWEEP_RUNNING: AtomicBool = AtomicBool::new(false);

struct SweepGuard;
impl Drop for SweepGuard {
    fn drop(&mut self) {
        SWEEP_RUNNING.store(false, Ordering::Release);
    }
}

pub fn apply(context: ToolObserverContext<'_>) -> BoxFuture<'_, anyhow::Result<()>> {
    Box::pin(async move {
        let call = context.call;
        if call.tool().name != "run" || context.cancelled || call.identity.is_none() {
            return Ok(());
        }
        // Hosted servers never offer ultrafast skills, so their scripts have no reason to be kept.
        if !crate::services::flow::ULTRAFAST_ENABLED || call.state.config.mode.is_hosted() {
            return Ok(());
        }
        let Some(code) = call.raw_args.get("code").and_then(Value::as_str) else {
            return Ok(());
        };
        if is_flow_script(code) || browseros_mcp::tools::sensitive::source_may_hold_secrets(code) {
            return Ok(());
        }
        let dir = call.state.config.browserclaw_dir.clone();
        let entry = JournalEntry::from_run(
            call.dispatch_id.to_string(),
            now_epoch_ms(),
            context.duration_ms,
            code,
            context
                .result
                .structured_content
                .as_ref()
                .unwrap_or(&Value::Null),
            context.result.is_error,
        );
        let session = call.session_id.as_str().to_string();
        let sweep_dir = dir.clone();
        tokio::task::spawn_blocking(move || run_journal::append(&dir, &session, &entry)).await??;
        let now = now_epoch_ms();
        if now.saturating_sub(LAST_SWEEP_MS.load(Ordering::Acquire)) > SWEEP_EVERY_MS
            && SWEEP_RUNNING
                .compare_exchange(false, true, Ordering::AcqRel, Ordering::Relaxed)
                .is_ok()
        {
            tokio::task::spawn_blocking(move || {
                let _guard = SweepGuard;
                // Recheck after admission: another sweep may have just finished.
                if now.saturating_sub(LAST_SWEEP_MS.load(Ordering::Acquire)) > SWEEP_EVERY_MS {
                    run_journal::sweep(&sweep_dir, RETENTION);
                    LAST_SWEEP_MS.store(now, Ordering::Release);
                }
            });
        }
        Ok(())
    })
}
