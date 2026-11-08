#!/usr/bin/env python3
"""Score normalized screenshot points against private ScreenSpot boxes."""
import argparse
import json
import math
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--answer-key", required=True, type=Path)
    parser.add_argument("--predictions", required=True, type=Path)
    args = parser.parse_args()
    tasks = json.loads(args.answer_key.read_text())["tasks"]
    predictions = json.loads(args.predictions.read_text())
    rows = []
    for task in tasks:
        point = predictions.get(task["id"])
        valid = (isinstance(point, list) and len(point) == 2 and
                 all(isinstance(v, (float, int)) and not isinstance(v, bool) and math.isfinite(v) and 0 <= v <= 1 for v in point))
        box = task["bbox"]
        passed = None if point is None else bool(valid and box[0] <= point[0] <= box[2] and box[1] <= point[1] <= box[3])
        rows.append({"id": task["id"], "kind": task["kind"], "result": passed})
    scored = [row for row in rows if row["result"] is not None]
    print(json.dumps({"scored": len(scored), "passed": sum(row["result"] for row in scored),
                      "unanswered": len(rows) - len(scored), "rows": rows,
                      "note": "Tiny mirror-backed adapter check, not the official ScreenSpot score."}, indent=2))


if __name__ == "__main__":
    main()
