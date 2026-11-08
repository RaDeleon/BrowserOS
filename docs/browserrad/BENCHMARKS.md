# BrowserRAD measurement protocol

BrowserRAD succeeds when an independently verified task finishes faster with the same or fewer main-agent tokens, while accuracy and total cost remain equal or better. Measure all three; never infer one from another.

## Baseline recorded November 2, 2026

Source reference: `e35f20e54679936fba79b3a649de34fb17032dd6`. Installed comparison: BrowserOS Neo 0.52.1.1. The installed release is identified independently; it is not assumed to equal the checkout commit. Machine: macOS 27.0.1, arm64. Fixture: `tools/browserrad/fixtures/index.html`. The browser stayed in the background.

Five sequential warmed repetitions, no learning. `tools/browserrad/baseline-run.js` runs in the Neo `run` tool. Each iteration acquires a fresh snapshot, reads inventory, fills a synthetic value, clicks Save, waits for the expected text, and reads it back. A separate call confirmed the final `Saved: RAD-4` result.

Browser execution durations: **412, 400, 392, 383, 392 ms**. Median **392 ms**, observed maximum **412 ms**, 5/5 fixture checks passed. Snapshot durations: 42, 34, 34, 32, 25 ms. The whole five-iteration MCP batch took 2003 ms at the tool caller. First-page open plus capture took 258 ms in a separate call. No user-facing foreground animation was measured by these background-tab samples.

[Machine-readable samples](baseline-2026-11-02.json) retain every attempt. These are smoke-baseline observations, not statistically established p95, end-to-end model timings, or token savings. Client tokens, provider usage, and total task cost were unavailable and remain unknown.

## Reproduce the fixture

From repository root, serve only the synthetic fixtures:

```sh
python3 -m http.server 8769 --bind 127.0.0.1 --directory tools/browserrad/fixtures
```

Open `http://127.0.0.1:8769/` in an agent-owned background tab. Run the saved script with the desired connector; independently inspect the final result, then close the test tab and stop the fixture server you started. Do not run the server from the repository root or expose it on the LAN.

## Acceptance workload

Include static extraction, dynamic form fill, multiple questions on one page, delayed hydration, continuously changing banners, iframe and shadow-DOM targets, ambiguous names, changed routes, dialogs, stale procedures, canvas/icon controls, and a write whose response is lost. Use synthetic data for repeatable runs. Include visible-page pointer comparisons separately from hidden-page runs.

For every change compare stock Neo, BrowserRAD with that change disabled, and BrowserRAD enabled. Use the same client/model/effort, tool exposure, browser state, workload and verification. Rotate order to reduce warm-cache bias. Record at least 30 observations per cell before treating median/tail differences as meaningful. Retain failed tasks and recovery time. Separate first-run, warm-run and learned-repeat cells.

Measure task submission through independent completion. Capture success rate, median/p95, main-agent turns, input/output/cached tokens as reported by the client, decision/vision tokens, memory cost, provider pricing assumptions, and total cost. Also capture phase spans for acquisition, input, readiness, verification and response observers. Treat text bytes, approximate tokens, API usage, subscription allowance, and money as different units.

## Result policy

A smaller payload or avoided capture proves that mechanism. A fixture test proves only the tested behavior. Neither proves a user task is faster or cheaper. Publish failures and unknowns alongside wins. Never silently drop stale-cache misses or write-recovery attempts from the denominator.

## Shared-evidence prototype — November 2, 2026

The new JavaScript helper was injected into stock Neo's `run` sandbox on the synthetic fixture. This exercised the mechanism without installing a fork or changing Neo's configuration. `bun tools/browserrad/prepare-evidence-benchmark.ts` emits a `run` input using the current helper source. Serve the fixture first, then submit its `code` through the direct Neo connector. It creates and closes its own background tab. The recorded run used the pre-budget version; save new repetitions separately. Ten paired warmed repetitions alternated order: three separate grep calls versus three questions answered from one snapshot. All 20 checks passed.

| Browser-execution measurement | Three separate captures | One shared capture |
| --- | ---: | ---: |
| Median | 11 ms | 3 ms |
| Observed maximum | 13 ms | 8 ms |
| Samples | 10 | 10 |

[Every sample](evidence-prototype-2026-11-02.json) is retained. This small local prototype is not a native BrowserRAD result, a statistically established tail estimate, or an agent-level speed multiplier. The helper was subsequently tightened to a default 6,000-character total excerpt budget; these short fixture results fit within that limit. Tool-description overhead is additional and has not been measured as client tokens, so net token savings remain unproven.

A separate live compatibility check filled and saved `RAD-live-verified` through a bounded plan; a second MCP call independently read that value back. A same-origin GET returned the synthetic fixture with HTTP 200. WebMCP discovery reported unsupported in installed Neo; actual site-tool invocation remains unverified outside unit mocks.

## Native alpha smoke checks — November 3, 2026

The alpha.2 ZIP-extracted BrowserRAD app passed a JavaScript DOM check in a temporary headless profile. Its packaged MCP server also passed shared-evidence queries, a bounded fill/save plan and a separate readback on the synthetic fixture. The tests used hosted mode, temporary state and a mock Keychain while the existing Neo process remained running. The test-created BrowserRAD skill guide was removed during cleanup.

These are functional checks, not a matched performance benchmark: no client token/cost measurement or comparable task latency was captured. Visible desktop onboarding remains unverified. The native compile and initial package took 252 minutes 48 seconds with four compiler jobs; alpha.2's packaging corrections reused that compiled code. Distribution failures in alpha.1 (HFS metadata and ad-hoc library-validation incompatibility) were retained in the diary rather than counted as successful attempts.

## Explicit run boundaries and corrected telemetry

Use `tools/browserrad/summarize_run.py` to select one session and an inclusive dispatch-ID range. It opens the audit database read-only and emits metadata only; redirect results into ignored `tools/browserrad/results/` or `.local-analysis/`.

```sh
python3 tools/browserrad/summarize_run.py --db /path/to/browserclaw.sqlite \
  --session SESSION --first-id FIRST --last-id LAST
```

The reporter counts top-level calls, keeps nested calls separately, includes failures and waits, and measures the first tool start through the latest tool completion. It excludes session startup and shutdown/idle tails. This span includes gaps between calls and excludes prompt submission and final-answer generation. Explicit boundaries are required: a transport session may contain several user tasks. Tool payload estimates exclude Claude's reasoning and conversation context; actual client usage, cost and independently verified completion stay unknown until supplied by the evaluator.

New server efficiency projections use estimator version 5: top-level payloads only, first-tool-to-last-return duration, and no idle shutdown tail. Existing version 4 projections remain historical; they are not silently rewritten or suitable for comparison with corrected timing. Audit rows retain nested operations for debugging. New wait metadata preserves `matched:false`; the reporter separately counts unmatched waits and legacy waits whose outcomes were not recorded. Protocol error counts alone never establish task success.

## Five-set scripted shakedown — November 5, 2026

Original Neo 0.52.1.1 and the running BrowserRAD alpha.3-dev candidate with cockpit 0.2.58 each passed one run of all five sets in [FIVE-TEST-SUITE.md](FIVE-TEST-SUITE.md). The additional wrong-wait and withheld-save-response probes passed in both apps. Asset loading on GitHub failed in both and was recovered through the expanded assets page. The Set 4 shadow code required a screenshot in both. BrowserRAD Set 4 had an additional complete attempt because its first result was truncated at the test caller; neither attempt was discarded.

The following are **browser audit execution times and estimated returned tool payload tokens**, not submission-to-answer latency or actual client tokens. Set 4 reports the second BrowserRAD attempt for a like-for-like functional row; its first attempt remains in the private record.

| Set | Neo result | RAD result | Neo tool execution | RAD tool execution | Neo output proxy | RAD output proxy |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| 1: dense read | Pass | Pass | 278 ms | 651 ms | 134 | 173 |
| 2: delayed total | Pass | Pass | 1,582 ms | 1,571 ms | 26 | 66 |
| 3: persisted write | Pass | Pass | 897 ms | 853 ms | 29 | 67 |
| 4: frame/shadow/visual | Pass | Pass | 629 ms | 551 ms | 2,364 | 1,776 |
| 5: GitHub/asset fallback | Pass | Pass | 4,223 ms | 4,391 ms | 1,086 | 126 |

All ten core rows show zero protocol errors. The 350 ms wrong-text wait returned a timeout in each browser; inspection and recovery then reached the $54 oracle. The withheld-response probe confirmed saved values after reload without repeating Save. That probe suppressed the result at the test orchestrator, so it does **not** reproduce a broken MCP transport.

One assistant scripted these calls from a single chat; there was no pair of independent Claude/Codex agents following the exact prompts. Per-set call patterns varied, the public site state was uncontrolled, and tool execution omits model planning, final response, setup, gaps, client usage and cost. The tool proxy figures include screenshot payload estimates and cannot be read as model token savings. No median, p95, speed ratio, token-savings ratio or cost conclusion follows from this shakedown. Raw dispatch bounds, extra attempts, and null usage/cost fields are retained only in ignored `tools/browserrad/results/five-test-shakedown-2026-11-05.json`.

## Expanded feature and vision shakedown — November 5, 2026

The current signed BrowserRAD alpha.3-dev candidate with cockpit 0.2.59 ran in a disposable profile while installed Neo used its direct connector. BrowserRAD's connector was absent from this chat, so its local MCP endpoint was used directly. Both browsers passed **one functional attempt in each of the five common sets**. This time GitHub's release asset name loaded in both; each closed only its helper tab and retained the release tab. The run also exercised BrowserRAD's shared evidence, bounded save/reload plan, missing-target stop, same-origin GET/cross-origin rejection, fresh saved-helper replay, unsupported WebMCP handling and a guarded synthetic WebMCP call. A second disposable RAD process with `BROWSERRAD_FAST_PATH=0` retained the base read path while `page.evidence` was unavailable.

The first screenshot-only icon attempt in RAD selected a distractor: the original fixture contained two nearly identical orange leaves. That failure remains in the private record. After the narrow distractor was made visually distinct, fresh-nonce icon targeting and delayed-target clicks passed in both browsers. The canvas OCR code was visible in screenshots, but it was known from fixture source and is **not** a blind vision score.

For a tiny held-out [VisualWebBench](VISION-BENCHMARKS.md) adapter check, six objective answers were scored and all six passed: one BrowserRAD screenshot from the earlier probe and five Neo screenshots, including a fresh action-prediction row after its missing choices were added to the viewer. One earlier action-prediction row remains unanswered because the old viewer omitted its choices. Captioning awaits human review. Two web-only [ScreenSpot](VISION-BENCHMARKS.md) points, one text and one icon, fell inside their private boxes through Neo. These are individual pipeline checks, **not** official benchmark scores or a paired model comparison.

The ignored `tools/browserrad/results/live-feature-suite-2026-11-05.json` retains bounded dispatch metadata and the failed attempt. Client-reported prompt/completion/cache tokens, vision-provider usage, full task latency and total cost were unavailable. The audit spans different call patterns, setup and screenshot counts; its token estimates are tool-payload proxies only. Native WebMCP on an actual supported site, live journal sweep latency, and a repeated matched feature-off workload remain open. No speed or savings claim follows.
