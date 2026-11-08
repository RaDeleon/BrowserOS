#!/usr/bin/env python3
"""Summarize an explicitly bounded browser run without exporting browser content."""
import argparse
import json
import sqlite3
from pathlib import Path


def summarize(db: Path, session: str, first_id: int, last_id: int) -> dict:
    if first_id > last_id:
        raise ValueError('first-id must not exceed last-id')
    with sqlite3.connect(db.resolve().as_uri() + '?mode=ro', uri=True) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            'SELECT created_at, duration_ms, tool_name, parent_dispatch_id, '
            'tool_input_token_estimate, tool_output_token_estimate, token_estimator_version, '
            'result_meta FROM tool_dispatches WHERE session_id=? AND id BETWEEN ? AND ?',
            (session, first_id, last_id),
        ).fetchall()
    top = [r for r in rows if r['parent_dispatch_id'] is None]
    if not top:
        raise ValueError('No top-level calls in the selected session/range')
    measured = all(r['token_estimator_version'] == 1 for r in top)
    durations = [max(0, r['duration_ms'] or 0) for r in top]
    metadata = [json.loads(r['result_meta'] or '{}') for r in top]
    waits = [m for r, m in zip(top, metadata) if r['tool_name'] == 'wait']
    return {
        'schema': 1, 'boundary': {'session': session, 'first_id': first_id, 'last_id': last_id},
        'top_level_calls': len(top), 'nested_calls': len(rows) - len(top),
        'first_call_to_last_return_ms': max(r['created_at'] + d for r, d in zip(top, durations)) - min(r['created_at'] for r in top),
        'summed_tool_execution_ms': sum(durations),
        'wait_execution_ms': sum(d for r, d in zip(top, durations) if r['tool_name'] == 'wait'),
        'protocol_errors': sum(m.get('isError') is True for m in metadata),
        'unmatched_waits': sum(m.get('matched') is False for m in waits),
        'waits_without_outcome_metadata': sum('matched' not in m for m in waits),
        'estimated_tool_input_tokens': sum(max(0, r['tool_input_token_estimate']) for r in top) if measured else None,
        'estimated_tool_output_tokens': sum(max(0, r['tool_output_token_estimate']) for r in top) if measured else None,
        'actual_client_tokens': None, 'submission_to_verified_completion_ms': None, 'total_cost': None,
        'limitations': ['Tool-call span includes gaps between calls; excludes final answer generation.',
                        'Summed execution can overlap; tool estimates exclude client reasoning/context.',
                        'Task boundaries and independent success must be supplied by the evaluator.'],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--db', type=Path, required=True)
    parser.add_argument('--session', required=True)
    parser.add_argument('--first-id', type=int, required=True)
    parser.add_argument('--last-id', type=int, required=True)
    args = parser.parse_args()
    print(json.dumps(summarize(args.db, args.session, args.first_id, args.last_id), indent=2))


if __name__ == '__main__':
    main()
