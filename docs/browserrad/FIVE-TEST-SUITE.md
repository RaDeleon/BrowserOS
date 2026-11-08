# Five matched BrowserRAD / Neo task sets

This is a runnable **workload specification**, not benchmark results. Use `tools/browserrad/fixtures/comparison-suite.html` served on `127.0.0.1:8769` for sets 1–4. Set 5 uses the public GitHub release. Never send live account data to a fixture. Compare **direct BrowserOS Neo** and **direct BrowserRAD** in fresh, separate Claude/Codex chats using the same model, effort, prompt, tool exposure, and client usage reporting. The current Codex connection may not expose both routes; verify both before beginning. Do not substitute BrowserHelm for either route.

## Run rules

1. Serve `tools/browserrad/fixtures` on loopback only: `python3 -m http.server 8769 --bind 127.0.0.1 --directory tools/browserrad/fixtures`. Each trial gets its own `nonce=SET-REPETITION-BROWSER` on the URL; record the nonce, browser build, client/model/effort, start state, exposed tool names and chat ID. Do not put result tokens or screenshots in this public repo.
2. Alternate browser order (RAD/Neo, Neo/RAD). Start both from one ordinary new tab, no pre-open fixture, same viewport and comparable cache/login state. Start timing at prompt submission; stop after the independent postcondition check, including any recovery and final response. Close only trial-owned tabs. Record first run, warm run, and learned repeat separately; never average them together.
3. The matched comparison uses common capabilities and the identical prompt. The agent may choose its own call pattern, including `run` batching. Record that choice rather than forcing one browser to imitate the other. After the five common tasks, run the **mandatory RAD feature cells** in [FEATURE-COVERAGE.md](FEATURE-COVERAGE.md) and the visual cells in [VISION-BENCHMARKS.md](VISION-BENCHMARKS.md). Keep feature-on/off ablations separate and clearly mark any capability Neo lacks. Do not treat an uninvoked feature as a tested feature.
4. Run each browser **once per set as a shakedown**, inspect every failure, then aim for at least **30 paired trials per set** before interpreting median/p95 or a savings ratio. A single 5×2 pass checks function and exposes blind spots; it does not establish general speed or token economics.

## Set 1 — Dense read, shared evidence, output discipline

**Prompt:** “Open `http://127.0.0.1:8769/comparison-suite.html?nonce={NONCE}`. Report the stock and price of RAD-042 and RAD-317, the delivery window, and whether backorders are available. Cite only the exact fixture text. Leave the page open.”

**Oracle:** RAD-042 = 17 / $23; RAD-317 = 0 / $14; 3 business days; no backorders. Check the returned answer against the page independently. Record captures, read/grep/evidence calls, bytes and estimated output tokens. This tests four questions from one page and whether batching actually happens.

## Set 2 — Delayed content, bounded wait and recovery

**Prompt:** “On the same fixture with a fresh nonce, load the delayed order and reveal its total. Report the total only after the page confirms it. If a wait fails, inspect the current state before changing approach. Leave the page open.”

**Oracle:** `Order ready`, then `Total: $54`. Capture wait selectors, durations, `matched`/timeout metadata, retries, and any false success. Run an additional fault-injection trial with a deliberately wrong expected selector and record how the agent recovers; mark it as a separate cell, not a normal successful timing.

## Set 3 — Write, independent readback, uncertain outcome

**Prompt:** “On the fixture with nonce `{NONCE}`, save the project name `Project-{NONCE}` once. Reload or revisit the page and confirm the saved value persists. Do not submit it a second time just because the first response is unclear. Report the confirmed value.”

**Oracle:** localStorage state reads `Saved: Project-{NONCE}` after reload, with one Save action. Record each action, whether a bounded plan ran, postcondition checks, duplicates and recovery. In a separate fault-injection cell, drop the client response *after* Save but before the agent receives acknowledgment; check persisted state before any retry. A UI-only run without that injected fault does **not** validate uncertain-write handling.

## Set 4 — Iframe, shadow DOM, visual fallback

**Prompt:** “On the fixture with a fresh nonce, report the shipping code from the embedded frame, the shadow code, and the visual code revealed by the orange leaf-shaped control. Verify each from the page. Leave the page open.”

**Oracle:** FRAME-29, SHADOW-73, LEAF-82. Record DOM/frame reads, screenshot or vision calls, pointer actions, vision-provider usage, and final evidence. The leaf control intentionally has no semantic name; if the agent cannot safely identify it, a reported limitation counts as a failed task, not a zero-cost skip.

## Set 5 — Real site, multi-tab, asset fallback and cleanup

**Prompt:** “Open the [BrowserRAD alpha.2 GitHub release](https://github.com/RaDeleon/BrowserOS/releases/tag/v0.0.1-alpha.2) in one new tab. Find the tag, platform, asset count and exact downloadable binary name. Open the `codex/browserrad` branch README in a second new tab and report its three main changes. If the release asset list fails, use one evidenced recovery. Close only the helper tab; leave the release tab open. Report every page-loading issue.”

**Oracle:** Compare against GitHub live state at run time, not hard-coded historical text. Confirm the remaining release tab and helper-tab closure independently. Record requests, navigation, asset-list failures, fallbacks, ownership warnings, waits, and final answer accuracy. Browser state and GitHub rendering can diverge; preserve both traces and do not compare this set as if it were a controlled fixture.

## Mandatory per-trial evidence record

Store locally and ignored (`tools/browserrad/results/` or `.local-analysis/`). One row per **top-level tool call**, plus nested calls linked by `parent_dispatch_id`: sequence, name, arguments *shape* (not secrets or page contents), start/end/duration, result status, wait outcome, page/tab IDs, page origin, snapshot/screenshot counts, input/output byte counts, estimated payload tokens and estimator version, and postcondition evidence. Include session ID and explicit first/last dispatch IDs so `tools/browserrad/summarize_run.py` can produce a bounded summary. Capture client-reported prompt/completion/cache tokens separately; mark unavailable as `null`. Capture provider/vision/memory usage and actual or assumed cost separately. Retain failed attempts and retries.

The summary row must include: set, browser/build, run order, cold/warm/learned cell, client/model/effort, submission-to-verified-completion time, first-tool-to-last-return time, sum of tool execution and wait time, main-agent turns, actual client tokens, estimated tool tokens, provider tokens/cost, independent success, exact failed postconditions and recovery. BrowserRAD's dashboard estimate is **not** a Neo measurement or a client bill. The first six observed sessions in an aggregate are not six independently verified tasks.

A matched result should report success rate first, then median and p95 time, client tokens and total cost **per verified task**. Declare every unknown. A feature-on RAD trial can establish a mechanism; only the matched trials can support a RAD-versus-Neo claim.
