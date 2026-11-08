# BrowserRAD project diary

## Mission

Make browser work feel immediate without making it careless. BrowserRAD should complete independently verified tasks faster than stock Neo using the same or fewer main-agent tokens, while preserving accuracy and reporting every provider's cost.

BrowserOS Neo remains the foundation and the comparison. BrowserRAD gets its own identity so the two can live side by side. BrowserHelm remains a related experiment, not a mandatory extra process in the native fast path.

## Current status

**Alpha.2 is published for Apple Silicon macOS. A local alpha.3-dev app with cockpit 0.2.59 is installed; the November 8 upstream integration is source-only and has not changed that app. Five paired scripted shakedowns and two recovery probes passed; model-driven matched benchmarks, client token usage and total cost remain open.** The fork began at `e35f20e54679936fba79b3a649de34fb17032dd6`; internal build selector `browserclaw` remains to limit merge churn. The installed comparison is Neo 0.52.1.1.

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

## November 3, 2026 — Retire failed packages, preserve fast rebuilds

Removed approximately **1.05 GiB** of obsolete generated output: the failed alpha.1 app/packages, the initial engine-version DMG, the duplicate alpha.2 download-verification files, and disposable README/skill/smoke-test leftovers. Each candidate was checked for active process/mount use; repository candidates were confirmed ignored and untracked before removal. This is allocated file size removed, not a claim about APFS physical free-space recovery.

The current alpha.2 app and release files remain; the ZIP checksum still matches the published value. Chromium source and incremental compiler output, dependency/toolchain caches, prepared resources, the private extension signing key, small patch-recovery backups, and validation evidence were preserved. Cleanup requires no recompilation. No installed browser, release tag, or published asset changed. Visible desktop onboarding and matched end-to-end performance measurements remain the next gates.

## November 3, 2026 — Claude Desktop connects to the running alpha

Added a separate `browserrad` manual MCP entry to Claude Desktop using `mcp-remote@0.16.0`, after privately backing up its configuration. Existing MCP entries and other settings were verified unchanged. With permission to restart Claude, its new server log confirmed a successful connection, MCP initialization and tool discovery. BrowserRAD remains running from the alpha release folder; this did not install an app in Applications or replace Neo.

A client using the exact configured bridge discovered **25 tools** and exercised the existing visible BrowserRAD instance against a synthetic local fixture: shared evidence, a bounded fill/save plan and a separate readback all passed. The test tab and fixture server were cleaned up. These results establish bridge and browser functionality, not Claude model task performance or token savings. A model-driven chat test remains unperformed: the desktop-control tool failed to initialize, and native accessibility inspection did not expose usable chat controls. The next gate is a new Claude chat explicitly selecting BrowserRAD, followed by matched performance measurements.

## November 3, 2026 — First Claude GitHub task reveals measurement gaps

The user supplied Claude Desktop's completed BrowserRAD release/README inspection. Matching local telemetry isolates **15 top-level calls** for the GitHub portion: five navigations, four reads, three waits, one snapshot, and two tab operations. First call through final return took **79,459 ms**; summed tool execution was **30,978 ms**, including **25,012 ms** in waits. Estimated tool input/output were **409 / 7,949 tokens**, not actual Claude usage. Prompt-to-answer time, provider cost and a matched Neo result remain unknown. The result is a reported functional completion with corroborating tool activity, not an independently rescored benchmark.

The run retained GitHub asset-loading failures and recovered through the expanded-assets page. All recorded navigation calls used `snapshot:false`, but there were no `run` calls, so shared-evidence/bounded-plan helper benefits were not exercised. Zero protocol tool errors does not mean zero task-level failures: the failed asset loading and readiness waits still cost time.

Two measurement/debugging issues need follow-up. The same session grouped the earlier example.com task with this GitHub task and added a **300,004 ms idle tail**, making its overall duration unsuitable as task completion time. Claude also reported a user-owned-tab warning when closing the helper tab; the tool log confirms the same session created and closed that tab. The notice code classifies a missing ownership claim as user-owned, but the exact loss/cleanup sequence is not yet verified. No fix or speedup is claimed. Private task-scoped evidence is retained locally; next gates are explicit benchmark task boundaries, ownership-warning diagnosis, and matched Claude/Neo runs with equivalent instructions.

## November 3, 2026 — Original Neo wins the first observed timing comparison

Matched the user-supplied original Neo GitHub inspection to its isolated telemetry session. Neo made **18 top-level calls**, spanning **50,593 ms** from first call through last tool return; BrowserRAD made **15 calls** over **79,459 ms**. Summed tool execution was **7,310 / 30,978 ms** for Neo/BrowserRAD. BrowserRAD included **25,012 ms** in readiness waits; Neo recovered the asset list by collapsing/reopening it. Neo's observed tool-call span was **36.3% shorter** in this pair.

Estimated tool input/output were **457 / 32,725** for Neo and **409 / 7,949** for BrowserRAD. BrowserRAD's estimated output was **75.7% smaller**; compact navigation was used there while Neo returned full snapshots. These are local payload estimates, not client-reported Claude tokens or measured cost. Both runs used granular tools rather than `run`, so neither establishes the new shared-evidence or bounded-plan helper benefit.

Both Claude reports completed the requested extraction and reported asset-loading failures plus the incorrect helper-tab ownership warning. The latter therefore also occurs in original Neo. Zero protocol errors in both runs does not erase page-level failures. No browser was modified during this observation. The private comparison excludes unrelated activity.

This is one observational pair with different recovery paths, connector wrappers, browser state and starting tabs; Claude model/settings parity was not independently verified. BrowserRAD began the GitHub portion in its existing test tab, while Neo opened the repository home. Prompt-to-final-answer time, actual client usage, cost and independently rescored accuracy remain unknown. This pair supports smaller returned payloads but **does not establish a BrowserRAD speed advantage**. Next gate: equal starting state, explicit task boundaries, matched model/settings, repeated alternating runs and a separate helper-enabled comparison.

### Comparison clarification — same model and effort

The user confirmed that **both GitHub runs used Claude Opus 5.5 High**. Model and effort therefore match by user confirmation, resolving that uncertainty in the initial comparison. The recorded timings and payload estimates are unchanged. One run per browser, different starting state/recovery paths/connector wrappers, unknown actual client tokens/cost and missing submission-to-final-answer timings remain limitations.

## November 3, 2026 — Fix the first observed BrowserRAD issues

Implemented the first corrections from the matched Claude tests. A successful tab close no longer emits an ownership notice after its claim has already been removed; ordinary reads still label genuinely unclaimed tabs. Task-duration projections now run from first tool start through last completion rather than session shutdown. Efficiency estimator version 5 and task token totals exclude nested payloads already represented by their parent call. Historical version 4 efficiency rows are retained rather than silently rewritten.

Readiness outcomes now preserve the boolean `matched` in bounded audit metadata, so an unsuccessful wait can be counted separately from protocol errors. Updated initialize/tool/skill guidance names shared evidence and bounded plans, encourages one run for related reads, and asks agents to inspect an explicitly failed component and change recovery strategy after an unsuccessful wait. This is guidance, not automatic site clicking or a guarantee that Claude will batch. The bundled skill stays within its existing line budget. The new read-only `summarize_run.py` requires explicit session and dispatch-ID bounds and leaves actual client tokens, total cost and independently verified end-to-end completion unknown.

Validation: **1,010 server tests passed, 7 ignored; 235 MCP tests passed**, with two separate ignored integration cases; strict Clippy and formatting passed. The synthetic run-summary regression passed and the new reporter reproduced the previous GitHub run's 15 calls / 79,459 ms without importing the example.com activity. Existing legacy waits correctly report missing outcome metadata. Regression fixtures were updated for estimator version 5 and the skill-size limit; no failing assertion was bypassed.

Built an optimized server and staged a separate **0.0.1-alpha.3-dev** app candidate using the already-compiled Chromium engine. Ad-hoc signing and signature verification passed. Its real MCP test in a temporary home/profile/state passed shared evidence, bounded form fill/save, independent readback, absence of the false close-tab warning, recovery guidance, and persistence of an unmatched wait outcome. The first smoke assertion incorrectly expected structured wait fields in the client response; the final test checks the text-only reply, catalog guidance and audit metadata at their actual boundaries. Raw local evidence remains ignored.

The candidate is a local development build, not a published alpha.3 release or an installed update. The existing BrowserRAD session remains untouched pending approval to activate it. Next gates: activate the fixed candidate, verify Claude reconnects, and repeat matched Claude Opus 5.5 High tasks. No new task-speed or actual-token/cost advantage is claimed.

### Alpha.3-dev activated with user approval

The user approved switching to the fixed candidate. BrowserRAD was already stopped at activation time, so no browser process needed to be terminated. Launched the signed `tools/browserrad/results/fixes-candidate/BrowserRAD.app` with its normal existing profile. Verified the app and server executable paths, alpha.3-dev bundle label, unchanged MCP endpoint, and live updated initialize guidance. A fresh connection using Claude's exact existing configuration passed shared evidence, bounded fill/save, independent readback and helper-tab cleanup without the incorrect ownership warning. The original Neo process and Claude configuration were preserved.

Claude's pre-existing bridge had exhausted reconnection attempts while BrowserRAD was stopped. A Claude Desktop restart was requested separately to reload the live connection and updated guidance; that restart is not yet confirmed. This remains a local development candidate, not a newly published release or an Applications installation.

## November 4, 2026 — A savings page that shows its evidence

Replaced the small Details dialog with a full **Your savings** route. The dashboard now includes recorded sessions, calls and estimated tool traffic, plus separate screenshot-model and BrowserOS Neo comparison lines. The expanded page provides eight metrics, all-time/30-day/7-day controls, comparison bars, overlapping-period totals, paginated session evidence with audit links, loading/error/empty states, refresh, methodology disclosures and an aggregate-only JSON export. Session evidence is excluded from product capture; exports omit session names and page content.

Corrected the original labels: accumulated session duration is **browser work recorded**, not established human time saved. The Claude/Codex alternative is a fixed screenshot model, not observed client usage. Negative differences remain visible as extra tokens. Actual client tokens, cost savings and human time saved remain unknown. Neo is explicitly **not calibrated**: our single observational pair cannot supply a credible multiplier for arbitrary BrowserRAD history. No inferred Neo savings are added to totals. Historical estimator differences and the distinction between sessions and independently verified tasks are explained in the UI.

Validation: **74 focused cockpit/savings tests passed**, including period selection, empty data, regressions, navigation and aggregate-export privacy. TypeScript, scoped Biome, production WXT build and `git diff --check` passed. A synthetic, clearly labeled local preview passed Home → Details → period switching in BrowserRAD; the 7-day regression fixture showed 25K extra estimated tokens / 16.7% more. Desktop and a 390px iframe viewport were visually checked; the narrow view had no document overflow or captured runtime errors.

Built cockpit **0.2.57**, packaged it with the existing BrowserRAD extension identity and staged a separate `tools/browserrad/results/savings-candidate/BrowserRAD.app`, retaining the alpha.3-dev native engine and server. Ad-hoc signing and deep/strict signature verification passed; no Chromium recompilation was needed. The packaged candidate then passed a fresh-home/profile/state native test: its bundled extension installed, the savings route and actual local stats API loaded, the empty state and uncalibrated Neo labels appeared, and no JavaScript exception or page overflow was found. Initial smoke attempts failed because the agent API could not read the internal target and because navigation raced first-time extension installation. The final test waits for extension installation and inspects the owned isolated candidate through CDP; those unsuccessful harness attempts are retained in the work record.

The user's BrowserRAD process stopped during packaging; the regular profile and Claude were not restarted. This is built and tested source plus a local signed candidate, **not an activated update or published release**. Next gate: explicit approval to activate the savings candidate with the existing BrowserRAD profile, then verify its upgraded cockpit. Repeated matched Neo benchmarks and actual client usage remain separate measurement work.

### Savings dashboard activated with user approval

The user approved activation. BrowserRAD was stopped, so no running browser task needed termination. Launched the signed savings candidate with the existing BrowserRAD profile. Verified the running app/server paths, the unchanged MCP endpoint responding to the client, and the existing profile's enabled cockpit extension upgraded to **0.2.57** without disable reasons. A macOS window capture confirmed the real **Your savings** page visible with loaded historical metrics and the new controls. It remains open for review. The virtual new-tab address hides the internal route from AppleScript, so URL-only verification was insufficient; the visual check established the actual page.

Desktop-control initialization was blocked by the unrelated OpenRagnar workspace symlink, and BrowserRAD's agent surface does not expose the internal dashboard target. Used macOS app/window inspection instead; no automation security setting was changed. The existing profile was preserved, original Neo was untouched, and Claude Desktop was not restarted. This activates the local alpha.3-dev candidate with cockpit 0.2.57; it does not publish a release or install a separate Applications copy.

### Home savings summary — restore the original visual hierarchy

After user screenshot feedback, restored the thin full-width savings bar and compact headline row with a divider, inline percentage and quieter Details link. Session/call/usage counts sit below the bar; screenshot-model and Neo comparisons use two short right-aligned lines that stack on narrow screens. Detailed caveats remain on Your savings. The bar describes the modeled token reduction and does not render a positive saving for unknown or regressed periods. Three focused component tests, TypeScript, scoped lint and production build passed. A synthetic BrowserRAD preview was rendered for visual review. Source/build updated; the running app still has the previous packaged cockpit pending this UI patch's packaging and activation.

Packaged this refinement as cockpit **0.2.58** in the separate `savings-polish-candidate/BrowserRAD.app`. Existing extension identity retained; ad-hoc signature verification passed. Added an explicit regression assertion for the comparison bar and its 75% fixture width; the component tests passed. The running 0.2.57 cockpit has not been interrupted; activation requires a BrowserRAD restart.

### Refined home summary activated

After the user's explicit instruction to restart BrowserRAD, gracefully quit the previous candidate and launched `savings-polish-candidate/BrowserRAD.app` with the existing profile. Verified the running executable path and enabled cockpit **0.2.58** with no disable reasons. Claude Desktop and original Neo were left untouched. The initial attempt was rejected by automatic approval review because design approval did not clearly authorize a restart; it was retried only after explicit restart approval arrived. This remains a local development candidate, not a published release.

## November 4, 2026 — Five matched browser-comparison sets prepared

Added `docs/browserrad/FIVE-TEST-SUITE.md` and a synthetic `comparison-suite.html` fixture. The five sets cover multi-question evidence, delayed readiness and failed waits, persisted writes and uncertain acknowledgment, iframe/shadow/visual fallback, and a real GitHub multi-tab task with asset-loading recovery and ownership cleanup. Every set has an exact prompt, independent oracle, failure condition and required per-call telemetry. Normal matched comparisons and feature-only ablations are separate; 30 paired trials per cell are needed before interpreting median/tail differences. The fixture HTML and JavaScript syntax passed static validation. At this point, **no Neo/RAD trials had been run for this suite; no speed, token or cost result was claimed.** Next gates: expose both direct connectors in identical fresh client chats, gather client-reported usage, run shakedowns, then collect repeated alternating trials.

## November 5, 2026 — Both browsers complete the five-set shakedown

Ran each core set once through direct Neo 0.52.1.1 and the running local BrowserRAD alpha.3-dev candidate (cockpit 0.2.58). All ten synthetic/public-page tasks passed their independent oracles: dense inventory extraction, delayed total confirmation, saved value after reload, embedded/shadow/visual codes, and the public GitHub release plus branch README. For the GitHub case, both browsers saw the inline asset list stuck on “Loading,” used GitHub’s expanded assets page, closed the helper tab and retained the release tab.

The embedded frame was readable from page text. Neither app’s ordinary text read exposed the open shadow-root code, so a screenshot supplied that evidence. Both clicked the unnamed orange leaf control and confirmed its revealed code. A second BrowserRAD Set 4 attempt was required because the first tool output was truncated in this chat; both attempts remain in private evidence. A deliberately wrong 350 ms wait timed out in both apps; after inspecting the page, both recovered and confirmed the correct total. In a separate save probe, the orchestrator withheld the save response from this assistant; each app’s persisted value was confirmed after reload without a second Save. This is a simulation of a lost acknowledgment, not proof of transport-level loss handling.

These are **scripted browser-tool shakedowns**, not independent model-driven tasks. One assistant chose the browser operations, and the two routes used different call patterns in the GitHub case. There is one core sample per app/set, no submission-to-final-answer timing, no client-reported tokens, and no measured provider/vision or total cost. Browser audit estimates are payload proxies only. The results establish functional coverage and recovery paths, not a BrowserRAD speed or token advantage. The detailed scoped audit record is local and gitignored at `tools/browserrad/results/five-test-shakedown-2026-11-05.json`; the sanitized summary is in [BENCHMARKS.md](BENCHMARKS.md). Next: fresh matched model-driven chats, alternating browser order, actual client usage, first/warm/learned cells, and feature-on/off ablations.

## November 5, 2026 — Feature coverage and browser vision added

The five common tasks had left BrowserRAD-specific paths uninvoked. Added a mandatory feature matrix and exercised the running local candidate directly: shared evidence, bounded plan success, safe stop on missing target/stale origin, uncertain postcondition after a possible write, saved helper replay with route invalidation, same-origin GET and cross-origin rejection, WebMCP unsupported handling and an authorized synthetic tool call, pointer hover/click and visual readback. A focused journal-retention race test and 21 deterministic helper tests passed. Actual native WebMCP support, live journal sweep latency and a disposable fast-path-off browser trial remain open; the synthetic WebMCP API must not be reported as native support.

Added a local-only VisualWebBench sample preparer and scorer with one official image from each of its seven task categories. The public source contains only the harness; images, answer keys and predictions remain ignored. A separate held-out action-grounding sample was answered from a BrowserRAD screenshot and scored 1/1. This validates the screenshot/answer/scorer path, not a reliable vision-model accuracy rate. ScreenSpot, ScreenSpot-Pro and VisualWebArena are documented as next benchmark integrations with their own scoring and environment limits. No new speed, client-token or cost claim follows.

Added a controlled visual stress page for screenshot-only icon discrimination, canvas text recognition and a target that appears after a delay. Each has an independent result, and the icon order changes with the trial nonce. Its JavaScript syntax passed a static check. These cells are ready for paired RAD/Neo runs; they are not yet a measured model accuracy result.

### Human hours saved, separately reported

The dashboard and Your savings page now show **Human hours saved** from user-logged completed tasks. Each entry records an estimated manual duration and the user's active supervision duration; the difference is summed by the selected time window. Browser activity duration remains a separate metric, and an empty log displays an unknown value rather than invented savings. Records contain date and minute counts only and live in the local BrowserRAD profile. Seven focused UI/calculation tests, TypeScript, formatting and the production cockpit build passed. The new cockpit is **0.2.59**; it is staged in a separate ignored `human-time-candidate/BrowserRAD.app` with the same extension identity and a verified ad-hoc signature. The active BrowserRAD remains on cockpit 0.2.58 pending an explicitly authorized restart. This is a local development build, not a tagged or published release.

### Expanded tests actually run

Ran source regressions again: 21 BrowserRAD helper tests, seven dashboard tests, one Rust journal race test, the audit-summary test, Python compilation and TypeScript checking passed. Launched the signed 0.2.59-cockpit candidate with a disposable profile and used its local MCP endpoint because this chat lacked the BrowserRAD connector; the ordinary profile was not replaced. Neo and RAD each completed the five common task sets once. The BrowserRAD-specific evidence, plan, helper, fetch and synthetic WebMCP paths passed, as did a real feature-off process check. The first visual icon attempt failed because our fixture's narrow distractor was too close to the target; after correcting the fixture, both apps passed a fresh icon and delayed-target attempt. The failed first attempt remains counted.

Held-out VisualWebBench and ScreenSpot web screenshots checked the vision pipeline. A missing options list in the initial action-prediction viewer left that row unanswered; after fixing the viewer, a fresh row passed. Across mixed routes, six objective VisualWebBench samples and two ScreenSpot web points passed; these tiny, heterogeneous samples are not a model ranking. Browser-specific outcomes, source links, unresolved gates and measurement limits are in [BENCHMARKS.md](BENCHMARKS.md). The active BrowserRAD app/profile still has not been updated to 0.2.59.

## November 5, 2026 — One canonical BrowserRAD app

Spotlight exposed multiple development packages and stale test registrations. Installed the latest tested local candidate at `/Applications/BrowserRAD.app`, preserving the existing BrowserRAD profile and leaving Neo untouched. The first install check found the bundled cockpit CRX at 0.2.59 while `bundled_extensions.json` still advertised 0.2.58.0, so the normal profile stayed on 0.2.58. Corrected the catalog to 0.2.59.0 and the local provenance metadata, re-signed all app components ad hoc, and passed deep, strict signature verification. The active `Profile 1` then upgraded to cockpit 0.2.59; the installed process runs from `/Applications`, and a direct MCP initialize call returned the BrowserRAD server identity. Claude Desktop tool discovery was not rechecked.

Removed five obsolete, ignored packaged app bundles after the verified install, including the extracted alpha.2 app. Kept the published alpha.2 ZIP and the Chromium checkout, objects, dependencies, and build-output app needed for fast incremental builds. Spotlight now finds two physical bundles: the installed app and the compiled development output. Use `/Applications/BrowserRAD.app` for normal work; the build-output bundle is not the installed app. This is still `0.0.1-alpha.3-dev`, not a newly tagged or published release. No new speed or token claim follows from this cleanup.

## November 8, 2026 — Browser-agent landscape, research only

Chose AgentRAD as a working name for a separate browser-plus-desktop product; no desktop feature is being added to BrowserRAD in this branch. Reviewed ten prominent browser-agent products and REA from their official public documentation. The curated [landscape report](BROWSER-AGENT-LANDSCAPE-2026-11-08.md) distinguishes documented mechanisms from private implementation and identifies network diagnostics, saved read workflows and human takeover as candidates, not shipped features. REA was reviewed but not installed or run.

The compact status-aware snapshot prototype was committed before the request changed to research only. It was removed from the active BrowserRAD source in a follow-up commit; the report now lists it as a candidate for later evaluation. No competitor-derived feature was installed or released. Next: decide which proposal merits a measured trial, then compare it against existing BrowserRAD behavior before implementation.

## November 8, 2026 — Bring Neo upstream forward without replacing RAD

Fetched official `browseros-ai/BrowserOS` main at `9e07439a919ded1acbd03c03d3c47b054ee8f05f`, 11 commits beyond the previous shared base. Merged it on a dedicated integration branch from BrowserRAD's current source. The incoming work adds remotely readable saved MCP outputs, configurable run wall-clock limits, larger but bounded inline output, shorter session handles, flow verification and edit protection, CDP session recovery, safer hosted analytics defaults, click preparation and one-shot fallback, development watcher ownership, and Neo Docker changes. These are upstream source changes, not proof of a BrowserRAD speed or token gain.

Resolved seven direct conflicts while preserving the BrowserRAD README, the RAD profile-scoped development state default, the instant-pointer setting, and its separate skill namespace. Kept our contributor/reference docs instead of accepting an upstream Neo-only rewrite. Adapted upstream's new flow tests to RAD's `rad-` skill names and corrected the MCP session hint to say `browserrad`. The existing bundle, extension, profile, MCP, update-feed and release identities were not edited by this merge.

Validation completed before promotion: the affected Rust package tests, strict Clippy, Rust formatting, Go dev-tool tests, the repository-wide Bun test suite and TypeScript check pipeline, six MCP fixture/client tests and twelve Docker entrypoint tests passed. A disposable BrowserRAD profile with the merged server passed 62 click-recovery contracts, ten saved-output contracts and two run-budget contracts. The browser-dependent Rust tests that require separate CDP or credential fixtures remained ignored. The Bun suite's first pass found an outdated cockpit assertion for the earlier savings wording; after updating only that assertion, the full suite passed.

The upstream click fallback can activate a still-valid element behind a covering overlay or modal; its result reports the fallback and avoids uncertain write retries, but this changes low-level click behavior. Review that behavior against BrowserRAD's guarded-task policy before packaging another app. The installed `/Applications/BrowserRAD.app`, the user's profile, Neo, Claude connection and published alpha remain unchanged. Matched end-to-end performance and client-reported token measurements remain open.
