#!/usr/bin/env python3
"""Cache a small, official VisualWebBench sample locally for BrowserRAD screenshot trials.

All downloaded images, answers, and HTML viewers stay under ignored results/.
The viewer contains the prompt and image but never the answer.
"""
import argparse
import html
import json
import urllib.parse
import urllib.request
from pathlib import Path

DATASET = "visualwebbench/VisualWebBench"
CONFIGS = (
    "action_ground",
    "action_prediction",
    "element_ground",
    "element_ocr",
    "heading_ocr",
    "web_caption",
    "webqa",
)
MAX_IMAGE_BYTES = 8_000_000


def load_rows(config: str, offset: int, length: int):
    params = urllib.parse.urlencode(
        {"dataset": DATASET, "config": config, "split": "test", "offset": offset, "length": length}
    )
    with urllib.request.urlopen(
        f"https://datasets-server.huggingface.co/rows?{params}", timeout=30
    ) as response:
        return json.load(response)["rows"]


def download_image(src: str) -> bytes:
    url = urllib.parse.urlparse(src)
    if url.scheme != "https" or url.hostname != "datasets-server.huggingface.co":
        raise ValueError("unexpected image host")
    with urllib.request.urlopen(src, timeout=30) as response:
        data = response.read(MAX_IMAGE_BYTES + 1)
    if len(data) > MAX_IMAGE_BYTES:
        raise ValueError("image is too large")
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return data, "png"
    if data.startswith(b"\xff\xd8\xff"):
        return data, "jpg"
    raise ValueError("unsupported image format")


def prompt(row: dict) -> str:
    kind = row["task_type"]
    if kind == "action_ground":
        return f"Which labeled option lets you {row['instruction']}? Answer with one letter."
    if kind == "action_prediction":
        return f"Which labeled option matches this element: {row['elem_desc']}? Answer with one letter."
    if kind == "element_ground":
        return f"Which labeled option is {row['elem_desc']}? Answer with one letter."
    if kind == "element_ocr":
        return f"Read the text inside the marked element: {row['elem_desc']}. Answer with the visible text."
    if kind == "heading_ocr":
        return "Read the marked heading. Answer with its visible text."
    if kind == "web_caption":
        return "Describe the main purpose of this webpage in one sentence."
    if kind == "webqa":
        return f"Answer this question using only the screenshot: {row['question']}"
    raise ValueError(kind)


def viewer(task_id: str, task_prompt: str, extension: str, options=None) -> str:
    choices = ""
    if options and all(isinstance(option, str) for option in options):
        items = "".join(
            f"<li><span>{chr(65 + index)}.</span> {html.escape(option)}</li>"
            for index, option in enumerate(options)
        )
        choices = f'<ol class="options">{items}</ol>'
    return f"""<!doctype html>
<html lang="en"><meta charset="utf-8"><title>Vision trial {html.escape(task_id)}</title>
<style>
body{{margin:0;background:#121820;color:#fff;font:18px system-ui}}
header{{padding:14px 24px;max-width:1280px;margin:auto}}
strong{{font-size:13px;color:#9cc6ff;text-transform:uppercase;letter-spacing:.08em}}
p{{margin:.4em 0}}
.options{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 20px;list-style:none;padding:0;margin:10px 0;font-size:13px}}
.options li span{{color:#9cc6ff;font-weight:700}}
img{{display:block;width:auto;height:auto;max-width:none;margin:0 auto;image-rendering:auto}}
</style>
<header><strong>BrowserRAD vision benchmark · {html.escape(task_id)}</strong>
<p>{html.escape(task_prompt)}</p>{choices}</header>
<img src="{html.escape(task_id)}.{extension}" alt="Benchmark screenshot">
</html>
"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--per-config", type=int, default=1)
    parser.add_argument("--offset", type=int, default=0)
    parser.add_argument("--config", choices=CONFIGS, action="append", help="Prepare only this category; repeat for several")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("tools/browserrad/results/vision-suite"),
    )
    args = parser.parse_args()
    if not 1 <= args.per_config <= 10 or args.offset < 0:
        parser.error("per-config must be 1..10 and offset must be nonnegative")
    output = args.output.resolve()
    allowed = Path("tools/browserrad/results").resolve()
    if output != allowed and allowed not in output.parents:
        parser.error("output must stay under ignored tools/browserrad/results/")
    output.mkdir(parents=True, exist_ok=True)
    records = []
    for config in args.config or CONFIGS:
        for item in load_rows(config, args.offset, args.per_config):
            row = item["row"]
            task_id = row["id"]
            if not task_id.replace("_", "").isalnum():
                raise ValueError("unexpected task id")
            image, extension = download_image(row["image"]["src"])
            (output / f"{task_id}.{extension}").write_bytes(image)
            task_prompt = prompt(row)
            (output / f"{task_id}.html").write_text(
                viewer(task_id, task_prompt, extension, row.get("options") if config == "action_prediction" else None)
            )
            records.append(
                {
                    "id": task_id,
                    "taskType": config,
                    "website": row.get("website"),
                    "prompt": task_prompt,
                    "answer": row["answer"],
                    "imageSize": row["image_size"],
                    "imageFile": f"{task_id}.{extension}",
                    "options": row.get("options"),
                    "source": f"https://huggingface.co/datasets/{DATASET}",
                }
            )
            print(f"prepared {task_id}")
    (output / "answer-key.json").write_text(
        json.dumps({"dataset": DATASET, "split": "test", "tasks": records}, indent=2) + "\n"
    )
    print(f"Prepared {len(records)} tasks in {output}. Answer key remains local.")


if __name__ == "__main__":
    main()
