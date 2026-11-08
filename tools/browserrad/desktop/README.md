# BrowserRAD desktop handoff probe

An experimental, opt-in macOS integration slice. This is a development runner, not a shipping Desktop mode, MCP endpoint or embedded chat. It keeps RAD's existing browser controller and delegates one synthetic native control to agent-desktop. See [the capability matrix and production design](../../../docs/browserrad/DESKTOP-INTEGRATION.md).

## Implemented

- One task/session spans browser and desktop; scope is a test-owned app PID, process incarnation and exact window.
- Desktop mode defaults off. Only semantic snapshot/click is exposed; no arbitrary shell, global keyboard, clipboard, physical fallback or generic app control API.
- Snapshot refs are task-local, retired on a new snapshot and consumed before a click. After any click attempt, additional writes are locked out until the task ends; only observation and independent browser-return verification are allowed.
- CLI subprocesses have output/deadline bounds and cancellation. Browser calls check cancellation before dispatch and after return. Cancellation cannot undo already delivered input; no write is replayed.
- Metadata-only ordered task events cover both surfaces. This log is local and **not yet integrated into the cockpit**.
- The Swift fixture writes a new synthetic receipt once. RAD uploads it to a loopback page, then reads its exact content in a separate call. Origin and paired trust markers are checked; a click acknowledgment is never completion proof.

## Run

Requires Apple Silicon macOS, Python 3.10+, Xcode command-line tools, and a BrowserRAD.app. No Python dependencies or new Chromium compilation are needed. The runner compiles a temporary fixture and launches the supplied RAD executable in a new disposable profile/state directory with hosted mode and mock Keychain. It does not install an app, copy a personal profile, modify MCP connections or stop another browser.

From repository root, download the official pinned release into ignored results:

```sh
mkdir -p tools/browserrad/results/desktop-deps
gh release download v1.2.0 --repo vercel-labs/agent-desktop \
  --pattern agent-desktop-v1.2.0-aarch64-apple-darwin.tar.gz \
  --pattern checksums.txt --dir tools/browserrad/results/desktop-deps
cd tools/browserrad/results/desktop-deps
shasum -a 256 agent-desktop-v1.2.0-aarch64-apple-darwin.tar.gz
# Expected: 219813428bb1ad8decae172faed05c5964a2415170df402e2786ccfa6452ba82
# Confirm it also matches the official checksums.txt before extracting.
tar -xzf agent-desktop-v1.2.0-aarch64-apple-darwin.tar.gz
cd ../../../..
```

The runner also checks the extracted binary and macOS helper against the reviewed hashes. Keep the helper beside the binary. Do not substitute a global CLI or regenerate these hashes without reviewing the new release. Nothing from that archive is committed.

First verify default-off behavior (no native process executes):

```sh
python3 tools/browserrad/desktop/smoke.py \
  --output tools/browserrad/results/desktop-disabled-01
```

Then run the cross-surface task with explicit opt-in:

```sh
python3 tools/browserrad/desktop/smoke.py --enable-desktop \
  --agent-desktop tools/browserrad/results/desktop-deps/agent-desktop \
  --browser-app /Applications/BrowserRAD.app \
  --output tools/browserrad/results/desktop-live-01
```

Output directories must be new and inside ignored `tools/browserrad/results/`. `summary.json` contains status and whole-probe wall time; `events.jsonl` contains bounded task metadata. Failures also retain a local stack trace. Preserve failed directories and use a new output directory for a new task. Receipts, native snapshots, app/profile/state directories and browser logs are temporary. Raw snapshots are not persisted. Do not upload the results folder.

The probe requires Accessibility permission already granted to the launching app. It does not request or alter TCC permissions. Screen Recording is not used by this slice. A sandbox can report denied permissions even when the macOS host grants them: do a read-only `agent-desktop status` check in the intended execution context. Never treat that distinction as permission to self-grant, change tools or target another app.

SIGINT/SIGTERM cancel the task; the host stops its owned subprocess groups. HTTP calls are bounded but cannot retract a delivered browser action. The runner cleans only its own processes and temporary directories. A successful `return` event has `phase: complete`; failed/uncertain tasks must not be counted as completed.

## Checks

```sh
python3 -m unittest discover -s tools/browserrad/desktop -p 'test_*.py' -v
python3 -m compileall -q tools/browserrad/desktop
# With repository-pinned Bun 1.4.2 and the workspace dependency links available:
bun test tools/browserrad/runtime.test.ts \
  packages/browseros-agent/scripts/build/agent-pointer.test.ts
git diff --check
```

The Python suite uses fake adapters/processes for permissions, output bounds, deadlines, stale refs, process replacement, cancellation, uncertain writes, failed return, audit failure, SSE framing and exact readback. These tests do not establish live fault-injection coverage. A fresh worktree needs its local `@browseros/agent-cursor` workspace link for the pointer test; no changes to that package are required.

## November 8, 2026 evidence

- 27 Python tests passed; Python compilation passed.
- 35 existing browser helper/pointer tests passed, 3,304 assertions, Bun 1.4.2.
- Native fixture compiled to arm64. The initial sandbox build could not write the default Swift module cache; the runner now uses a temporary local cache.
- Disabled mode passed with zero native dispatches.
- Two fresh live tasks passed browser → native semantic click → browser receipt upload/readback. The final full probe took 6,553 ms, including fixture compilation, process startup and cleanup. This is one development smoke timing, not an agent benchmark or performance comparison. Actual client tokens and provider cost remain null.
- Failures retained locally: sandbox permission denial; fixture startup discovery; empty MCP SSE heartbeat; and a completed single native click whose final check initially rejected RAD's trust envelope. Fixes use bounded observation, correct SSE framing and exact text-envelope checking. The failed write task was never replayed; subsequent attempts used new apps, profiles and receipt tokens.
- Final process inventory found no remaining fixture, temporary-profile or downloaded helper process. Neither installed app was replaced/reconfigured; this feature work did not edit the parent checkout.

## Open gates

Server-owned grants and routing; cockpit opt-in/Stop/events UI; native file-dialog and broader app/menu/window capabilities; live permission revocation, wrong-window and uncertain-delivery fault injection; browser-target changes during return; reviewed helper bundle/signing/entitlements; candidate app coexistence and distribution review. Real account tasks and incomplete-accessibility visual fallback are untested. No Chromium app was built, installed or released by this work.

Repository drift at handoff: while this isolated work ran, `codex/browserrad` advanced independently to `4a01c3b1a` (savings report and validation coverage) and became clean. This feature branch remains based on `c01896dc1`; integration with that newer commit is an open gate. No parent files were committed by this desktop work.
