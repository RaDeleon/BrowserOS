# BrowserRAD project diary

## Mission

Make browser work feel immediate without making it careless. BrowserRAD should complete independently verified tasks faster than stock Neo using the same or fewer main-agent tokens, while preserving accuracy and reporting every provider's cost.

BrowserOS Neo remains the foundation and the comparison. BrowserRAD gets its own identity so the two can live side by side. BrowserHelm remains a related experiment, not a mandatory extra process in the native fast path.

## Current status

**Alpha.2 is published for Apple Silicon macOS. No app has been installed locally. Visible desktop acceptance and matched benchmarks remain open.** The fork is based on `e35f20e54679936fba79b3a649de34fb17032dd6`; internal build selector `browserclaw` remains to limit merge churn. The installed comparison is Neo 0.52.1.1.

| Workstream | Status | Next evidence |
| --- | --- | --- |
| Separate BrowserRAD identity | Source implemented | Native bundle, profile and connection coexistence test |
| Pointer and journal latency | Relevant Rust tests pass; debug phase timings added | Visible/background matched trials |
| Shared observation and bounded plans | 21 helper tests, 2 embedded-engine tests, live synthetic plan pass | Broader dynamic-page and matched native verification |
| Local procedure reuse | Upstream saved-flow machinery retained | Stale route, partial write and learned-repeat trials |
| Same-origin retrieval / WebMCP | Retrieval works on fixture; unsupported WebMCP reported honestly | Real supported-site invocation and cancellation |
| README / Claude / Codex guidance | Original hero visually inspected; local links and SVG validated | Keep docs synchronized with build status |
| Baseline | Five synthetic Neo runs recorded | Larger matched client-reported workload |
| Toolchain / packaging | Alpha.2 ZIP published; signatures and native MCP smoke verified | Native app artifact and coexistence verification |

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

## November 2, 2026 — A fork with its own working branch

The initial implementation and documentation are now pushed to [our fork's `codex/browserrad` branch](https://github.com/RaDeleon/BrowserOS/tree/codex/browserrad). The branch was renamed from `codex/browserhelm-integration` to match the product. Its first verified remote checkpoint is `ad7950ebc008b4d0873f625051c97b50acf14c8a`; the implementation checkpoint remains `29e425d71a067d5c8ad47884120866dd963be1b3`.

Our fork's `main` remains at the original base, and upstream is unchanged. The new README is visible on the BrowserRAD branch. After native packaging and coexistence checks pass, a pull request inside our fork can promote this work to our main branch and repository front page. Later changes use focused branches, while upstream improvements arrive through reviewed integration branches.

The outgoing implementation commits were checked for excluded artifacts, private key markers, recognizable credential patterns and local personal paths. No findings were reported by that targeted check; it is not a guarantee or an audit of all inherited upstream history. The local extension signing key remains ignored and untracked. This milestone publishes source only: compilation is still running, with app packaging, isolated launch and matched native measurements outstanding.

## November 2, 2026 — Name the first alpha, keep the evidence honest

The first BrowserRAD release is being prepared as **0.0.1-alpha.1** (`v0.0.1-alpha.1`), the machine-readable form of the requested “0.01 alpha.” It remains on `codex/browserrad`; main is not being merged for this milestone. Release versioning is separate from the inherited engine numbers.

This Mac has no valid Developer ID signing identity. The alpha packaging path therefore uses explicit ad-hoc signatures, preserves the existing component entitlements, omits Apple-certificate requirements and secure timestamps for that mode, and verifies signature integrity. Developer ID behavior remains covered separately. The planned release is not notarized and must say so.

The native executable is still compiling. A new packager stages a separate copy, checks identity/architecture/source provenance, stamps the outer release version, and prepares the DMG and checksums. It cannot publish an unverified build. The GitHub prerelease remains a draft until the actual executable, isolated launch and coexistence gates pass. Setup is not a claim that a download is ready.

Alpha-preparation checks passed: 39 macOS signing tests and 7 packaging guard tests. A disposable arm64 native fixture was ad-hoc signed, passed strict signature verification and executed successfully. This verifies the signing mechanism, not the full BrowserRAD app.

## November 3, 2026 — Chromium is built; distribution gets its own test

The complete native pipeline succeeded in **252 minutes 48 seconds**, including compilation and initial DMG packaging, with four compiler jobs. BrowserRAD.app exists and all 422 patches compiled. The alpha checks then caught two distribution failures that unit tests and compilation could not establish: HFS hybrid packaging added FinderInfo to a nested executable, and hardened-runtime library validation rejected the ad-hoc framework because it has no Developer ID team.

The corrected candidate is **0.0.1-alpha.2**. Its ZIP preserves the signed app, and its explicit preview signing omits hardened runtime/library validation while retaining the component entitlement templates. Developer ID behavior remains separate. This is an ad-hoc, unnotarized alpha, not production signing. No Chromium recompilation is needed; the native implementation checkpoint remains unchanged. The published alpha.1 source tag is preserved, and its GitHub release remains a superseded draft with no binaries.

The actual packaged-app launch and coexistence checks are still required before publishing alpha.2. Nothing has been installed over Neo.

## November 3, 2026 — The first runnable alpha is published

[BrowserRAD 0.0.1-alpha.2](https://github.com/RaDeleon/BrowserOS/releases/tag/v0.0.1-alpha.2) is now a public GitHub prerelease, built from implementation checkpoint `29e425d71a067d5c8ad47884120866dd963be1b3` with packaging source/tag commit `abb0fcc0dea960cb981e97e2b511324123b37129`. The published files are the Apple Silicon app ZIP, `SHA256SUMS` and a sanitized `release-manifest.json`. All three were downloaded from GitHub and checked against their expected hashes before publication.

The actual ZIP-extracted app passed strict nested-signature verification and an isolated headless JavaScript test. Its own MCP server then answered shared evidence queries and completed a bounded fill/save procedure; a separate MCP call independently confirmed the result. Neo stayed running, and the checked Claude/Codex configuration files were unchanged. The app's test-created global BrowserRAD skill guide was moved out during cleanup. Test browser processes and synthetic servers were stopped.

The alpha is ad-hoc signed, without hardened runtime, and not notarized. Visible desktop onboarding, managed Apple capabilities, broad site coverage and matched task speed/token/cost trials remain unverified. These successful smoke tests establish a runnable experimental artifact, not production readiness or an efficiency multiplier. Main remains unmerged, the alpha.1 tag is preserved with a superseded draft, and nothing was installed over Neo.

The ZIP is 183,543,578 bytes. Its SHA-256 is `da81ce6665d0fe021e3b001413c6c3b120f247a695e4cea90c70d9af13d419bd`.


## November 8, 2026 — First browser/native/browser development slice

The goal now includes one optional desktop mode inside BrowserRAD.app. This is a functionality expansion; adding a second controller is not evidence of speed or token savings. The [capability matrix and design](DESKTOP-INTEGRATION.md) preserve RAD's browser controller and identify native accessibility control as the first gap to address.

Work began on an isolated `codex/browserrad-desktop` worktree from `c01896dc1`, preserving the existing uncommitted savings/server/benchmark work in the parent checkout. The installed resource manifest identifies alpha.3-dev with cockpit 0.2.59; neither installed browser was replaced or reconfigured.

Implemented an experimental Python host adapter around the pinned agent-desktop 1.2.0 macOS CLI, a synthetic Swift AppKit fixture and a disposable-profile RAD MCP runner. Desktop mode is off by default; the probe scopes actions to the owned app/process incarnation/window, retires refs, locks out writes after possible delivery, checks cancellation, bounds subprocess output/time, and emits a shared metadata-only task log. The host does not expose a general desktop shell, physical fallback or unrestricted second MCP endpoint.

**Verified:** 27 Python tests; Python compilation; 35 existing helper/pointer tests with 3,304 assertions on Bun 1.4.2; arm64 fixture compilation; default-off with zero native dispatches; two fresh live browser → native click → browser receipt-upload/readback tasks. The last full probe took 6,553 ms including fixture compilation, startup and cleanup. Actual client tokens and provider cost remain null. Final process inventory found no remaining owned fixture/profile/helper processes.

**Failures retained:** sandbox permission denial (host grants already existed), fixture startup discovery, empty MCP SSE heartbeat, and a native action followed by a failed final check because the host initially compared RAD's wrapped content directly. Corrected the startup observation, SSE parser, local Swift cache and trust-envelope readback. The uncertain write was not replayed; later attempts used new synthetic tokens/profiles/apps. Initial pointer tests lacked a workspace dependency link; the final test run passed after adding the ignored local link.

**Limitations / next gate:** this is a development probe outside the shipping server. Its task log is not the cockpit audit trail. Server-owned Desktop grants, opt-in/Stop UI, unified cockpit events, native dialogs/broader apps, live adversarial fault injection, helper bundling/signing and candidate-app coexistence remain open. No new Chromium build, installed app, release or embedded chat is claimed. [Reproduction and evidence](../../tools/browserrad/desktop/README.md).

Repository drift at handoff: while this isolated work ran, `codex/browserrad` advanced independently to `4a01c3b1a` (savings report and validation coverage) and became clean. This feature branch remains based on `c01896dc1`; integration with that newer commit is an open gate. No parent files were committed by this desktop work.
