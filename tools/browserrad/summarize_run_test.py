import importlib.util
import sqlite3
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('summarize_run', Path(__file__).with_name('summarize_run.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class RunSummaryTests(unittest.TestCase):
    def test_boundaries_nested_calls_wait_failures_and_unknown_usage(self):
        with tempfile.TemporaryDirectory() as directory:
            db = Path(directory) / 'audit.sqlite'
            with sqlite3.connect(db) as c:
                c.execute('CREATE TABLE tool_dispatches (id INTEGER, session_id TEXT, created_at INTEGER, duration_ms INTEGER, tool_name TEXT, parent_dispatch_id TEXT, tool_input_token_estimate INTEGER, tool_output_token_estimate INTEGER, token_estimator_version INTEGER, result_meta TEXT)')
                c.executemany('INSERT INTO tool_dispatches VALUES (?,?,?,?,?,?,?,?,?,?)', [
                    (1, 's', 0, 100, 'run', None, 10, 20, 1, '{}'),
                    (2, 's', 1, 90, 'read', 'outer', 900, 900, 0, '{}'),
                    (3, 's', 200, 50, 'wait', None, 2, 3, 1, '{"matched":false}'),
                    (4, 's', 9999, 10, 'read', None, 500, 500, 1, '{}'),
                    (3, 'other', 99999, 100, 'read', None, 999, 999, 1, '{}'),
                ])
            r = module.summarize(db, 's', 1, 3)
            self.assertEqual(r['top_level_calls'], 2)
            self.assertEqual(r['nested_calls'], 1)
            self.assertEqual(r['first_call_to_last_return_ms'], 250)
            self.assertEqual(r['estimated_tool_output_tokens'], 23)
            self.assertEqual(r['unmatched_waits'], 1)
            self.assertIsNone(r['actual_client_tokens'])
            with sqlite3.connect(db) as c:
                c.execute('UPDATE tool_dispatches SET token_estimator_version=0 WHERE id=1')
            self.assertIsNone(module.summarize(db, 's', 1, 3)['estimated_tool_output_tokens'])
            with self.assertRaises(ValueError):
                module.summarize(db, 'missing', 1, 3)


if __name__ == '__main__':
    unittest.main()
