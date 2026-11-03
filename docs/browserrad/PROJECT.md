# BrowserRAD project diary

## Mission

Make browser work feel immediate without making it careless. BrowserRAD should complete independently verified tasks faster than stock Neo using the same or fewer main-agent tokens, while preserving accuracy and reporting every provider's cost.

BrowserOS Neo remains the foundation and the comparison. BrowserRAD gets its own identity so the two can live side by side. BrowserHelm remains a related experiment, not a mandatory extra process in the native fast path.

## Current status

**Source implementation and validation in progress. No BrowserRAD app installed or published.** The fork is based on `e35f20e54679936fba79b3a649de34fb17032dd6`; internal build selector `browserclaw` remains to limit merge churn. The installed comparison is Neo 0.52.1.1.

| Workstream | Status | Next evidence |
| --- | --- | --- |
| Separate BrowserRAD identity | Source implemented | Native bundle, profile and connection coexistence test |
| Pointer and journal latency | Relevant Rust tests pass; debug phase timings added | Visible/background matched trials |
| Shared observation and bounded plans | 21 helper tests, 2 embedded-engine tests, live synthetic plan pass | Broader dynamic-page and matched native verification |
| Local procedure reuse | Upstream saved-flow machinery retained | Stale route, partial write and learned-repeat trials |
| Same-origin retrieval / WebMCP | Retrieval works on fixture; unsupported WebMCP reported honestly | Real supported-site invocation and cancellation |
| README / Claude / Codex guidance | Original hero visually inspected; local links and SVG validated | Keep docs synchronized with build status |
| Baseline | Five synthetic Neo runs recorded | Larger matched client-reported workload |
| Toolchain / packaging | Release server and cockpit built; 422 native patches applied; compilation running | Native app artifact and coexistence verification |

## November 2, 2026 — Give the experiment its own front door

The first tempting change was a name. The useful change was an identity. Renaming an app bundle alone would leave the fork sharing Neo's state and agent integrations. BrowserRAD instead gets its own bundle identifier, profile directory, state directory, MCP key and skill namespace. Upstream update paths are disabled for the preview so an update cannot quietly turn it back into Neo. The upstream Git remote remains available for deliberate source merges.

The first stopwatch reading is modest and useful: five warmed background-tab tasks passed, with a **392 ms median browser execution time**. That is a starting point, not a victory lap. We have no matched BrowserRAD measurements or client-reported token baseline yet. [Protocol and raw data](BENCHMARKS.md).

The first implementation removes work that buys the agent nothing: animated cursor travel and journal retention scans on the response path. Target checks remain. Journal append remains awaited. The next layer asks several questions of one capture and lets a short procedure resolve fresh targets itself. If the page changes, a target becomes ambiguous, or a write may already have happened, it stops and gives the planner evidence.

Competitive research supplied patterns, not a new stack to embed. Stagehand reinforced bounded work and scoped observations; Browser Use reinforced selective vision; Skyvern reinforced deterministic reuse with fallback. Browserless reinforced persistent sessions. WebMCP and same-origin retrieval are optional experiments because support and content parity vary.

Dependency installation and builds were explicitly authorized during this session. Neo has not been restarted, replaced or reconfigured. Native Chromium compilation is a separate gate from compiling the sidecar and cockpit.

## Decision ledger

- Product name: **BrowserRAD**. Repo URL remains `RaDeleon/BrowserOS` unless separately renamed.
- macOS bundle ID: `com.techinsf.BrowserRAD`; dev ID: `com.techinsf.dev.BrowserRAD`.
- Browser profile: `BrowserRAD`; server state: `.browserrad`; MCP/managed skill: `browserrad`; saved skills: `rad-*`.
- Preserve upstream internal package names. No copying competitor code or cloud service dependency.
- No mandatory extra model/vision/reflection pass. No retry of an uncertain write.
- No performance multiplier until matched, independently verified measurements justify it.

## Release gates

1. Pass relevant tests, type/lint checks and product/patch validation; resolve any failures.
2. Build sidecar and cockpit, then a separately branded Chromium app from the pinned source.
3. Inspect the actual bundle identity, profile/state paths, update behavior and code signature.
4. Run stock Neo and BrowserRAD together using isolated test data; verify no connection/profile interference.
5. Run matched benchmarks with client-reported tokens and cost accounting.
6. Install or publish only when separately authorized, with accurate preview/signing/notarization status.

## How to continue the diary

Append a dated entry for each meaningful milestone. Say what changed, what the evidence proves, what failed, and what comes next. Update the status table to the current state. Keep raw personal telemetry private and link only sanitized summaries here.

## November 2, 2026 — The first savings are in the work, not the claim

Three questions no longer need three captures. On the small fixture, the paired prototype moved the median browser execution from 11 ms to 3 ms, with all 20 checks passing. That is useful evidence for sharing a capture. It says nothing yet about an entire agent task or its bill. The native comparison and client-reported usage remain open.

The helper also completed a live form procedure, and a separate read confirmed the saved value. Retrieval returned the original HTML; WebMCP said unsupported. Both are useful outcomes: an optional path must describe what it can actually do on the current browser.

The optimized Rust server (`browseros-claw-server-rs`, version 0.0.93) and the 12.40 MB cockpit extension now build locally. Neither is a BrowserRAD Chromium application. The dedicated pinned Chromium checkout and dependencies are now ready; the installed Neo has stayed untouched.

### Validation ledger

- Relevant Rust full suite after identity and retention changes: **1,726 passed, 10 ignored, zero failures** across 30 suite reports. After the later changes, 33 dispatch tests, 17 pointer tests, 2 new embedded-JavaScript tests, and the server unit suite (1,006 passed, 7 ignored) passed. Background retention now rechecks expiration under the append lock so a stale scan candidate cannot delete fresh evidence.
- Strict Clippy passed for `browseros-core`, `browseros-mcp`, and `claw-server`; formatting checked. Native C++ compilation remains pending.
- Repository-isolated Bun suite: **2,295 passed, 3 skipped, zero failures**, using pinned Bun **1.4.2** in the final rerun (the earlier pass used 1.4.4). An initial direct `bun test` invocation failed because of cross-file global mock collisions; the repository's supported `bun run test` isolates those suites and passed. That failed invocation remains in the local logs.
- Pinned Bun **1.4.2**: lint, type checks, and the configured check pipeline passed. Fallow reported 491 warnings at the repository's configured warning level; this is not a zero-warning claim. The final cockpit build also used 1.4.2.
- Deterministic helper tests: **21 passed, 61 assertions** with pinned Bun; pointer behavior tests also passed.
- Go browser/process/watch suites passed. Python product/context/resolver checks: **39 passed**; macOS signing tests: **37 passed** after updating fork-specific assumptions.
- Nine edited Chromium patch files parse successfully; applicability to the full pinned checkout is still pending. Documentation local links and hero SVG XML validate; the hero was inspected in Neo.

Native packaging, actual app signature/profile isolation, full matched task timing, and client/provider token/cost accounting remain release gates. No BrowserRAD app was installed or published, and no source was pushed.

### Packaging discovery: the cockpit needs its own identity too

The first source-packaging pass exposed another upstream assumption: the cockpit expected Neo's private CRX signing key and required its analytics write key. BrowserRAD now has its own extension identity (`efdbmkebmplcaefnjkgfnnbmgdjndifl`) and a locally generated private key kept outside version control with mode 0600. Only the public key and ID are source. The packager rejects extension update feeds for the preview, and analytics credentials are optional. This closes a real build/coexistence gap rather than borrowing upstream signing material.

The source build also requires a clean tracked commit for provenance. A local checkpoint will bind the build to reviewed source; it does not publish anything to GitHub.

### Clean-checkpoint validation

The final pre-build rerun passed **1,726 Rust tests** (10 ignored), **2,295 Bun tests** (3 skipped, pinned Bun 1.4.2), and **1,326 Python build-system tests** (4 skipped). Strict Clippy and the configured lint/type/check pipeline passed; the existing Fallow warnings remain. The 35 focused JavaScript helper/pointer tests passed 3,304 assertions. The upstream feed snapshots were preserved as historical Neo fixtures, and BrowserRAD explicitly rejects published-mode extension packaging.

Chromium 155.0.8059.26 and its dependencies are prepared at commit `16c3e55476d3564bea713314b2fff638749ce3e6`. The original source transfer stalled; the official GitHub mirror supplied the same verified commit. The native build is configured for four compiler jobs at reduced scheduling priority, unsigned and without uploads or external notifications. CRX packing uses an isolated temporary Chrome profile. Source and dependency preparation are complete; the native executable is still a separate verification gate.

## November 2, 2026 — From source preview to the native compiler

The implementation is now captured in local commit `29e425d71a067d5c8ad47884120866dd963be1b3`. Source-mode packaging built the fork's server and cockpit, signed the CRX with its separate local extension key, and recorded that source SHA in the prepared-resource manifest. This checkpoint has not been pushed.

All **422 Chromium patches applied**, and GN generated **35,908 targets**. The first compile stopped because Apple's Metal compiler was missing. Installing the Metal Toolchain resolved that prerequisite; `xcrun metal --version` reports Apple metal 32023.922. A subsequent full-pipeline retry exposed the non-idempotent patch step. Generated patch targets were backed up and restored selectively; dependencies, incremental output and unrelated files were preserved. All 422 patches then applied again with zero failures.

Compilation is running with four compiler jobs at reduced scheduling priority. This entry records the start, not completion: no final BrowserRAD executable, package signature, profile coexistence result or native benchmark is claimed yet. Future compiler retries use `--from compile`, whose inspected plan contains only compilation and macOS packaging. The installed Neo has not been restarted or replaced.
