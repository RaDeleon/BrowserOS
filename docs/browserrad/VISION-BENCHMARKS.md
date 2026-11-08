# BrowserRAD browser-vision evaluation

This is a vision workload, distinct from the five common browser tasks and from claims about BrowserRAD's native speed. Compare the **same vision model** and prompt under screenshot-only BrowserRAD and Neo routes, then compare DOM-first/vision-on-demand separately. Record task success and image/provider cost as well as tokens and time.

## Source benchmarks

- [VisualWebBench](https://visualwebbench.github.io/) supplies seven screenshot task types: webpage captioning, web QA, heading OCR, element OCR, element grounding, action prediction and action grounding. Its [dataset](https://huggingface.co/datasets/visualwebbench/VisualWebBench) is the source for this repo's small local sample pack. The pack is an adapter smoke test, **not** an official full benchmark score.
- [ScreenSpot](https://github.com/njucckevin/SeeClick) tests grounding of text and icon/widget controls across web, mobile and desktop. A prediction is a target location checked against an annotated bounding box. Use its **web** split for browser comparisons and report text and icon results separately.
- [ScreenSpot-Pro](https://github.com/likaixin2000/ScreenSpot-Pro-GUI-Grounding) stresses high-resolution professional interfaces. It is a harder image grounding test, useful for crop/resolution and point accuracy, but its desktop applications are not live browser tasks. Report this as a vision-model-only cell, not a BrowserRAD end-to-end browser success.
- [VisualWebArena](https://github.com/web-arena-x/visualwebarena) provides multi-step, visually grounded web tasks with execution-based evaluation. The official environment needs self-hosted sites, resets and model configuration. Its full task success cannot be inferred from our screenshot sample pack.
- [BrowserGym](https://github.com/ServiceNow/BrowserGym) can expose MiniWoB++, WebArena and VisualWebArena tasks behind a shared evaluation interface. Use its official evaluator and reset state if we install those environments; do not mix its score with our local fixture score.

## Runnable local sample pack

Run from the fork root:

```sh
python3 tools/browserrad/prepare-vision-benchmark.py --per-config 1
python3 -m http.server 8770 --bind 127.0.0.1 --directory tools/browserrad/results/vision-suite
```

The preparer downloads one official VisualWebBench test image per category plus its annotation, creates seven screenshot viewers and writes `answer-key.json` under gitignored `tools/browserrad/results/vision-suite/`. It uses only the dataset's HTTPS image host, rejects unexpected formats/oversized images and does not copy dataset material into the public repo. Increase `--per-config` and rotate `--offset` for a larger, held-out sample. Never show `answer-key.json` or the source row to the agent being scored.

For each viewer URL, give the agent only the page's visible task instruction and a BrowserRAD screenshot. Do not call `read`, `snapshot`, `grep`, `evaluateInPage` or fetch the image/answer key in the screenshot-only cell. Capture one final answer per task in a local JSON map such as `{"action_ground_1":"C"}`, then score:

```sh
python3 tools/browserrad/score-vision-benchmark.py \
  --answer-key tools/browserrad/results/vision-suite/answer-key.json \
  --predictions tools/browserrad/results/vision-suite/predictions.json
```

The local scorer checks labeled options and normalized exact answers. Captioning is left for blinded human or specified rubric judging. A seven-image sample is an integration check, not a reliable model ranking. Do not score a task blind if the answer was exposed while preparing it.

The `action_prediction` category has text choices separate from its image. The viewer now displays those choices with A–H labels. The first held-out row was left unanswered when the old viewer omitted them; use `--config action_prediction --offset N` to prepare a fresh row rather than retroactively treating that incomplete screenshot as a model failure or success.

## ScreenSpot web grounding sample

The [SeeClick authors' ScreenSpot](https://github.com/njucckevin/SeeClick) asks for a click point inside an annotated target. This adapter uses the [bevaya Hugging Face mirror](https://huggingface.co/datasets/bevaya/ScreenSpot), whose normalized boxes are kept only in the ignored answer key. The web-only text and icon sample indices below are an integration check, not an official ScreenSpot score:

```sh
python3 tools/browserrad/prepare-screenspot.py 836 837
python3 -m http.server 8772 --bind 127.0.0.1 --directory tools/browserrad/results/screenspot-web
```

Open each viewer HTML in the browser and return a point `[x,y]` normalized to the **original image**, excluding the fixed 74 CSS-pixel instruction header. Do not inspect the answer key, DOM or image data in a screenshot-only trial. Record points in ignored `predictions.json`, then run:

```sh
python3 tools/browserrad/score-screenspot.py \
  --answer-key tools/browserrad/results/screenspot-web/answer-key.json \
  --predictions tools/browserrad/results/screenspot-web/predictions.json
```

Report text and icon targets separately. A point inside the hidden box passes; wrong or malformed points fail. The mirror's sample boxes are already normalized to `[left, top, right, bottom]`; do not mix them with the authors' original width/height box format.

## Additional browser-specific visual cells

1. **Unlabeled icon:** From the synthetic comparison fixture, choose the orange leaf by screenshot and click it. Score the revealed code, not just the click coordinate.
2. **Distractor icons and dense layout:** Open `http://127.0.0.1:8769/vision-stress.html?nonce={NONCE}` at a fixed viewport. Click the orange leaf with two veins using screenshot evidence only. Its position changes with the nonce. The independent page result must be `Correct: ICON-24`; any other selection fails. Save the screenshot and click coordinates privately.
3. **Image-only text:** On that page, read the code drawn in the canvas from a screenshot. The answer is `PIXEL-47`; no DOM, canvas pixel extraction or source read is allowed in this vision cell.
4. **Dynamic visual state:** On that page, press “Show delayed target,” wait for a fresh screenshot showing the orange leaf, then click it. The independent page result must be `Correct: LATE-18`. A click before readiness or a coordinate reused from an earlier screenshot fails.
5. **Multi-step VisualWebArena cell:** When its official sites are installed, run a seeded task with environment reset and the official evaluator. Keep failures and recovery in the denominator.

For cells 2–4, serve `tools/browserrad/fixtures` on loopback as in the five-set suite. Use new nonces for at least 10 position variants and identical viewport/scaling on Neo and RAD. These are controlled visual checks, not official ScreenSpot or VisualWebArena scores.

## Fair scoring

Record source dataset/revision/sample IDs and licensing, model identifier and effort, prompt, viewport, image size and transforms, screenshot count, visual input tokens, provider usage/cost, agent turns, elapsed time through independently verified completion, success, and errors. Use the same tasks and model for Neo and RAD. Report screenshot-only, DOM-first and mixed strategies in separate cells. No vision-provider cost is assumed zero when the client does not expose it.
