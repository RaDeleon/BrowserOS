#!/usr/bin/env python3
"""Prepare a tiny ScreenSpot web grounding pack under ignored local results."""
import argparse
import html
import json
import urllib.parse
import urllib.request
from pathlib import Path

DATASET = "bevaya/ScreenSpot"  # Hugging Face mirror of the SeeClick authors' benchmark.
MAX_IMAGE_BYTES = 8_000_000


def row_at(index):
    query = urllib.parse.urlencode(
        {"dataset": DATASET, "config": "default", "split": "test", "offset": index, "length": 1}
    )
    with urllib.request.urlopen(f"https://datasets-server.huggingface.co/rows?{query}", timeout=30) as response:
        item = json.load(response)["rows"][0]
    if item["row_idx"] != index:
        raise ValueError("dataset row index changed")
    return item["row"]


def image_bytes(src):
    url = urllib.parse.urlparse(src)
    if url.scheme != "https" or url.hostname != "datasets-server.huggingface.co":
        raise ValueError("unexpected image host")
    with urllib.request.urlopen(src, timeout=30) as response:
        data = response.read(MAX_IMAGE_BYTES + 1)
    if len(data) > MAX_IMAGE_BYTES:
        raise ValueError("oversized image")
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return data, "png"
    if data.startswith(b"\xff\xd8\xff"):
        return data, "jpg"
    raise ValueError("unsupported image format")


def viewer(task_id, instruction, extension, width, height):
    return f"""<!doctype html><html lang="en"><meta charset="utf-8">
<title>ScreenSpot web {html.escape(task_id)}</title>
<style>body{{margin:0;background:#111820;color:white;font:16px system-ui}}
header{{box-sizing:border-box;height:74px;padding:8px 16px;overflow:hidden}}
strong{{font-size:12px;color:#9cc6ff}}p{{margin:2px 0}}
img{{display:block;width:{width}px;height:{height}px;max-width:none}}</style>
<header><strong>SCREENSPOT WEB · {html.escape(task_id)}</strong>
<p>Point to the element that would: {html.escape(instruction)}</p></header>
<img src="{html.escape(task_id)}.{extension}" alt="Web interface screenshot">
</html>"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("indices", nargs="+", type=int, help="Dataset row indices; choose web rows")
    parser.add_argument("--output", type=Path, default=Path("tools/browserrad/results/screenspot-web"))
    args = parser.parse_args()
    output = args.output.resolve()
    allowed = Path("tools/browserrad/results").resolve()
    if allowed not in output.parents:
        parser.error("output must stay under ignored tools/browserrad/results/")
    output.mkdir(parents=True, exist_ok=True)
    tasks = []
    for index in args.indices:
        row = row_at(index)
        if row["data_source"] not in {"gitlab", "shop", "forum", "tool"}:
            raise ValueError(f"row {index} is not a web sample")
        kind = row["data_type"]
        if kind not in {"text", "icon"}:
            raise ValueError("unsupported target type")
        bbox = row["bbox"]
        if len(bbox) != 4 or not (0 <= bbox[0] < bbox[2] <= 1 and 0 <= bbox[1] < bbox[3] <= 1):
            raise ValueError("invalid normalized bounding box")
        width, height = row["image"]["width"], row["image"]["height"]
        if not (100 <= width <= 4096 and 100 <= height <= 4096):
            raise ValueError("invalid image dimensions")
        image, extension = image_bytes(row["image"]["src"])
        task_id = f"screenspot_web_{kind}_{index}"
        (output / f"{task_id}.{extension}").write_bytes(image)
        (output / f"{task_id}.html").write_text(viewer(task_id, row["instruction"], extension, width, height))
        tasks.append({"id": task_id, "index": index, "kind": kind, "instruction": row["instruction"],
                      "bbox": bbox, "imageSize": [width, height], "source": f"https://huggingface.co/datasets/{DATASET}"})
        print(f"prepared {task_id}")
    (output / "answer-key.json").write_text(json.dumps({"tasks": tasks}, indent=2) + "\n")
    print(f"Prepared {len(tasks)} tasks; answer key remains local.")


if __name__ == "__main__":
    main()
