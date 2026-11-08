# BrowserRAD feature coverage gates

The five common Neo/RAD tasks in [FIVE-TEST-SUITE.md](FIVE-TEST-SUITE.md) measure ordinary browser work. A pass there does **not** exercise every BrowserRAD optimization. Run these mandatory RAD-specific cells separately. Do not mix their time or tokens into a matched Neo result.

| Gate | Exact invocation or observation | Pass condition | Current evidence |
| --- | --- | --- | --- |
| Identity and coexistence | Launch Neo and RAD together; query both direct connectors and compare bundle/profile/state identifiers | Distinct processes, profiles, MCP names and state; neither changes the other's test data | Neo direct connector and RAD local MCP passed concurrently with separate profiles on Nov 5; RAD connector was unavailable in this chat, so client exposure still needs recheck |
| Shared evidence | `page.evidence({over:'content',selector:'#extract',queries:[...]})` | One fresh acquisition answers all inventory questions with bounded excerpts | Passed on live RAD, Nov 5 |
| Bounded action plan | `page.executePlan` with fill, Save, authorized targets and postcondition; separate reload | Verified status, two steps, one Save, persisted value | Passed on live RAD, Nov 5 |
| Safe plan stop | `page.executePlan` with a missing/ambiguous target, stale origin and failed postcondition in separate cells | Stops or reports uncertain, `retry:false`, no duplicate write | Missing target, stale origin and uncertain postcondition passed; ambiguous-name unit test passed |
| Saved helper and learned repeat | `page.saveHelper`, `listHelpers`, `readHelper`, then `helpers[name](browser,page)` on fresh page | Fresh replay returns correct values; stale/changed route invalidates rather than silently succeeding | Save/list/read/replay passed; guarded helper rejected stale route |
| Same-origin browser GET | `page.fetchRead({url,origin,authorized:true})` and cross-origin rejection | Raw content is labeled unrendered; same-origin 200; cross-origin blocked | Passed on live RAD, Nov 5 |
| WebMCP discovery and call | `page.siteTools` and `page.callSiteTool` | Unsupported site returns explicit unsupported/no invocation; synthetic API calls one authorized tool and verifies page | Unsupported and synthetic shim passed; actual native supported site pending |
| Visual fallback | `screenshot` for unnamed control/shadow content, then `clickAt` or ref action and independent postcondition | Visual evidence and correct result; model/provider usage recorded | Paired Set 4 and corrected icon/delayed fixture passed in both browsers Nov 5; initial RAD icon miss retained; provider usage unavailable |
| Pointer feedback | `hoverAt` and `clickAt` on the synthetic leaf | Action returns and page confirms LEAF-82; compare visible latency against Neo separately | Functional path passed; matched visible latency pending |
| Journal cleanup | Exercise audited calls while retention sweep runs; inspect persistence and phase timing; run focused Rust race regression | Fresh journal survives sweep; response path has no retention scan | Focused Rust race regression passed Nov 5; live sweep/latency cell pending |
| Ownership cleanup | Create and close helper tab, retain result tab; inspect tab groups and notices | Only owned helper closes, no false ownership warning | Passed in five-set shakedown |
| Fast-path off | Start a **separate disposable** RAD process with `BROWSERRAD_FAST_PATH=0`; repeat common tasks | Optional helpers unavailable while base SDK still passes | Native disposable app passed Nov 5: base read worked and `page.evidence` was unavailable; broader matched off-mode workload pending |
| Telemetry | Query only bounded audit dispatch IDs and client/provider records | Every invocation, failure, retry and cost category recorded; unknown stays null | Browser audit present; client usage/provider cost pending |

A cell is **not covered** merely because source code exists or a generic browser task passed. The Nov 5 feature probes used a real running BrowserRAD browser against loopback fixtures; the later 0.2.59-cockpit run used a disposable profile and the app's local MCP endpoint because this chat did not expose the BrowserRAD connector. `webmcp-shim.html` implements a synthetic page API, so its success verifies BrowserRAD's guarded call path but **not** that native WebMCP is enabled on a real site. The saved helper `rad-benchmark-inventory` remains in the normal RAD profile for repeat testing on the loopback host.

## Required execution record

For each gate, record the exact MCP method and `run` source shape, tool and nested dispatch IDs, browser build, fixture nonce, feature flag, return status, independent readback, screenshots, vision model/provider/usage, main-agent turns and client-reported usage. Keep raw images, answers, tokens and audit records under ignored `tools/browserrad/results/`. Preserve failed attempts. Run a first attempt, a warmed repeat, and a learned repeat where relevant; pair with Neo only for a common-capability cell. A successful script proves the mechanism, not model-driven speed or cost.

## Visual model tests

Use [VISION-BENCHMARKS.md](VISION-BENCHMARKS.md) alongside the feature cells. It adds screenshot-only OCR, question answering, labeled-target grounding, action choice, icon targeting and multi-step visual navigation. The vision agent must receive the screenshot and task prompt, with DOM/AX/read access disabled for that cell. Score against an answer key held outside the agent's page; report image dimensions, crop/scale, vision calls, image tokens, latency and cost. A DOM-assisted pass is a separate cell, never a vision score.
