# BrowserRAD browser and desktop integration

Reviewed November 8, 2026. Goal: one BrowserRAD.app, one task, optional native desktop control. Functionality is the reason to expand; no speed or token savings are established.

## Repository audit and scope

The development base is `c01896dc1` on `codex/browserrad`. The parent checkout has substantial existing savings, audit, wait, docs and fixture edits. They are preserved there, without stashing, resetting or copying them into this feature branch. The integration branch starts at the committed base; those changes will need a deliberate later merge. Origin is `RaDeleon/BrowserOS`; upstream is `browseros-ai/BrowserOS`. This work does not merge upstream or publish a release.

Read-only inspection of the installed app found bundle ID `com.techinsf.BrowserRAD`. Its resource manifest identifies alpha.3-dev, cockpit 0.2.59, ad-hoc signing and no notarization. That verifies manifest metadata, not executable provenance or current runtime health. Neither installed browser is replaced or reconfigured.

## Capability matrix

“Present” below means source inspected, not a fresh live pass. Graph generation `2026-11-08T22:30:59Z` reported no recorded coverage issues for the listed source; this is best-effort coverage, supplemented by exact file reads. The handoff's uncommitted feature/vision documents were read as working-tree evidence, not included in this branch.

| Capability | agent-browser / agent-desktop | RAD evidence at base | Decision |
| --- | --- | --- | --- |
| CLI and browser sessions | Browser CLI with daemon, profiles and CDP | MCP sessions and run SDK; browser_profiles/browser_target in `tools/mod.rs` | Retain RAD controller; consider a thin CLI client later |
| Compact/interactive snapshots | Browser supports compact, interactive, depth and CSS scope | `tools/snapshot.rs`: full/interactive plus depth; targeted read/grep/evidence via `tools/run.rs` and `rad-runtime.js` | Scoped snapshot export is useful; benchmark payload/quality before adding |
| Browser refs/lifecycle | Browser refs; replacement handling documented by upstream | Guarded browser view and fresh native targets in MCP framework | Keep existing native targeting; do not translate browser refs into desktop refs |
| Annotated images | Browser screenshot annotation | Screenshot tool present; no annotation claim from this audit | Candidate diagnostic addition, after desktop slice |
| Network and console | Browser interception and debugging | `run.rs` explicitly says no network interception; `tools/read.rs` exposes page console warnings/errors; sandbox console capture is separate | Useful developer-tool gap; separate follow-up |
| Traces, recording and sessions | Browser debugging/video; desktop session traces | Central MCP dispatcher plus audit observer; screenshots and browser session history | Reuse RAD audit; full recording parity unverified |
| Security controls | Browser policy/allowlist/boundaries are configurable | Native target checks, trust boundary, cancellation and bounded runtime | Never replace RAD authorization with upstream annotations |
| Native apps/windows/menus/dialogs | Desktop OS accessibility surfaces and semantic actions | Browser window tools operate browser surfaces | Genuine missing functionality: optional desktop adapter |
| Desktop refs and skeleton/drill | Desktop snapshot namespace, qualified refs, skeleton and root drill-down | No native desktop ref namespace in audited browser catalog | Separate task-owned desktop namespace and exact app/process/window target |
| Actions and waits | Desktop semantic actions and bounded waits; physical mode explicit | Existing waits are browser-scoped | Start with semantic click on synthetic fixture; no coordinate/global keyboard fallback |
| Screenshots and sparse AX | Desktop screenshot fallback requires capture permission | Browser screenshots do not establish desktop capture permission | Screen Recording is separately gated; stop if AX is incomplete |
| MCP / C library | Desktop supplies MCP and C ABI | RAD owns its MCP endpoint and audit pipeline | Prototype CLI behind adapter; prefer reviewed sidecar over in-process FFI initially |
| Embedded model/chat | Neither CLI supplies the decision-making model | External agent supplies decisions | Separate product milestone |

Source anchors are relative to `packages/browseros-agent`: `crates/browseros-mcp/src/{framework.rs,tools/mod.rs,tools/snapshot.rs,tools/run.rs,tools/upload.rs}` and `apps/claw-server/src/api/mcp/{dispatch.rs,observers/audit.rs}`. The dispatch path is `ClawMcpService.call_tool → dispatch_tool_call → dispatch_tool_call_with → execute_with_cancellation`; ordered observers produce the existing audit rows. Browser-only execution remains unchanged by this prototype.

## Unified surface and authority design

Proposed production API: `desktop.status`, `desktop.snapshot`, `desktop.act`, and `task.handoff`. The browser route remains the current MCP/SDK. Desktop mode defaults off. A cockpit control grants a task explicit app/process/window/action scope, with a visible active-mode indicator and Stop control. An agent request cannot grant itself that scope, and website text is never authorization. Permission grants are runtime capabilities, revoked on task/session termination.

The host owns a task ID and browser return binding. Desktop refs remain tied to that task, snapshot, process incarnation and window; no global “frontmost app” fallback. A new observation retires old refs. Incomplete accessibility coverage is an explicit error. Wrong-window/process replacement, cancellation or failed return binding stop the handoff. A delivered or possibly delivered action requires independent observation; an uncertain write cannot be replayed. Recovery can observe and return to the browser, but cannot assert completion from a successful click response.

Production events should use existing RAD dispatch IDs and the conversation/session identity. Add `surface`, `phase`, `scope`, `delivery`, `verification` and `parent_dispatch_id` through contracts/codegen when adding API fields. Do not reuse browser page IDs as native window IDs. Audit only bounded metadata by default; private snapshots and screenshots are excluded. The current dispatcher requires a captured browser view and has browser-specific effects: desktop routing needs a separate admitted execution branch while retaining cancellation and the audit observer. Do not expose a second unrestricted desktop MCP endpoint to bypass that host.

macOS Accessibility is required for AX reads/actions. Screen Recording is required only when enabling desktop capture. Never modify TCC or self-grant permissions. Handle denial, revocation, incomplete AX and unsupported surfaces without switching tools. One-app distribution needs a reviewed, pinned helper, resource manifest, signature/entitlement/privacy checks and per-app permission UX. A source prototype does not satisfy those packaging gates.

## First vertical slice

`tools/browserrad/desktop/` is an experimental host probe, outside the shipping server. It uses an explicitly supplied agent-desktop binary and isolated state. Its scope is one owned AppKit fixture process and window, with semantic observation/click only. A native button writes a synthetic receipt. A disposable RAD profile opens a loopback page; desktop mode clicks the fixture; RAD selects the receipt through its existing upload tool and reads the page's independently displayed contents. The runner uses a shared metadata-only task event log. This log is **not yet the cockpit audit trail**.

Run instructions and exact evidence are maintained in [the probe README](../../tools/browserrad/desktop/README.md). Desktop mode is off without `--enable-desktop`. The probe never controls arbitrary existing apps, prompts for permissions automatically, imports profiles, installs globally, or replaces either browser. It uses a test-owned synthetic app instead of a native file dialog because existing RAD uploads already handle file inputs without operating a desktop dialog.

## Gates after the probe

1. Independently verified browser → native app → browser task, including permission-denied, wrong target, stale refs, cancellation, uncertain delivery and failed-return tests.
2. Server-owned opt-in grants and desktop routing; metadata-only events visible in the existing cockpit, with revocation and Stop UX.
3. Native file-dialog handoff and broader app/menu/window interactions, with process/window checks at the action boundary; no silent physical fallback.
4. Pinned helper packaging, signing and isolated candidate-app coexistence checks. Installation and release require separate review.
5. Add scoped/annotated browser debugging functionality from measured gaps. Keep matched completion/quality, elapsed time, client tokens and provider costs separate; unavailable usage stays null.

## Primary sources reviewed

- [agent-browser overview](https://agent-browser.dev/), [snapshots and ref lifecycle](https://agent-browser.dev/snapshots), [debugging](https://agent-browser.dev/debugging), [security](https://agent-browser.dev/security), [source](https://github.com/vercel-labs/agent-browser).
- [agent-desktop overview](https://agent-browser.dev/desktop), [app/window control](https://agent-browser.dev/desktop/commands/app-window), [semantic interactions](https://agent-browser.dev/desktop/commands/interaction), [snapshots](https://agent-browser.dev/desktop/snapshots-and-refs), [sessions](https://agent-browser.dev/desktop/sessions), [macOS](https://agent-browser.dev/desktop/platforms/macos), [traces](https://agent-browser.dev/desktop/guides/traces), [MCP](https://agent-browser.dev/desktop/guides/mcp), [C ABI](https://agent-browser.dev/desktop/ffi), [source](https://github.com/vercel-labs/agent-desktop).

The live documentation can move ahead of releases. The executable probe pins **agent-desktop v1.2.0**, not whichever CLI a global PATH happens to contain. CLI compatibility must be checked against that executable, not inferred from current docs.

## November 8 implementation outcome

The isolated CLI probe is implemented and passed two fresh live cross-surface tasks. The final run completed one semantic native click and independently checked the receipt in RAD, with a metadata-only task log ending in `phase: complete`. Default-off behavior made zero native dispatches. Twenty-seven Python tests and 35 existing Bun browser tests passed; the Swift arm64 fixture compiled. The last whole-probe time was 6,553 ms including compilation/startup/cleanup; client tokens and cost are unknown. This demonstrates a synthetic functionality path, not a speed claim.

The first sandbox permission result was denied, but a read-only host-context check found existing grants. No permissions were changed. Failed startup, SSE and final-readback attempts remain in ignored local evidence. No shipping server, cockpit UI, Chromium source or installed app was modified. The next implementation gate is server-owned grants/routing with events and revocation in the cockpit; bundling and installation remain separate.

Repository drift at handoff: while this isolated work ran, `codex/browserrad` advanced independently to `4a01c3b1a` (savings report and validation coverage) and became clean. This feature branch remains based on `c01896dc1`; integration with that newer commit is an open gate. No parent files were committed by this desktop work.
