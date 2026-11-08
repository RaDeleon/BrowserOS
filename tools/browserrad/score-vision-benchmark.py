#!/usr/bin/env python3
"""Score objective VisualWebBench sample answers; keep caption tasks for human review."""
import argparse
import json
import re
import string
from pathlib import Path


def normalize(value):
    return " ".join(re.findall(r"[a-z0-9]+", str(value).lower()))


def score(task, prediction):
    kind = task["taskType"]
    expected = task["answer"]
    if kind in {"action_ground", "action_prediction", "element_ground"}:
        raw = str(prediction).strip().upper()
        if len(raw) == 1 and raw in string.ascii_uppercase:
            actual = string.ascii_uppercase.index(raw)
        elif raw.isdecimal():
            actual = int(raw)
        else:
            return False
        return actual == expected
    if kind == "web_caption":
        return None
    if isinstance(expected, list):
        return any(normalize(prediction) == normalize(x) for x in expected)
    return normalize(prediction) == normalize(expected)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--answer-key", type=Path, required=True)
    parser.add_argument("--predictions", type=Path, required=True)
    args = parser.parse_args()
    tasks = json.loads(args.answer_key.read_text())["tasks"]
    predictions = json.loads(args.predictions.read_text())
    rows = []
    for task in tasks:
        answer = predictions.get(task["id"])
        result = None if answer is None else score(task, answer)
        rows.append({"id": task["id"], "taskType": task["taskType"], "result": result})
    scored = [r for r in rows if r["result"] is not None]
    print(json.dumps({
        "scored": len(scored),
        "passed": sum(r["result"] for r in scored),
        "unansweredOrHumanJudged": len(rows) - len(scored),
        "rows": rows,
        "note": "Small adapter smoke score, not the official benchmark score.",
    }, indent=2))


if __name__ == "__main__":
    main()
