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
