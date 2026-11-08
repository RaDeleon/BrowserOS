import json
from pathlib import Path
import sys
import tempfile
from threading import Event
import unittest

from smoke import receipt_matches
from mcp import Mcp, decode_response
from backend import CliBackend
from session import DesktopError, Target, TaskSession

TARGET = Target('RAD Fixture', 123, 'process-123-start-1', 'window-1')


class FakeBackend:
    def __init__(self):
        self.calls = []
        self.serial = 0
        self.fail_click = False
        self.fail_target = False
        self.complete = True
        self.cancel_during = None

    def preflight(self, target, cancel):
        self.calls.append('preflight')
        if self.fail_target:
            raise DesktopError('wrong window/process')

    def snapshot(self, target, cancel):
        self.preflight(target, cancel)
        self.calls.append('snapshot')
        self.serial += 1
        return dict(complete=self.complete, snapshot_id=f's{self.serial}',
                    tree=dict(ref_id=f'@s{self.serial}:e1', children=[]))

    def click(self, target, ref, cancel):
        self.preflight(target, cancel)
        self.calls.append('click')
        if self.cancel_during:
            self.cancel_during.set()
        if self.fail_click:
            raise DesktopError('response lost after action')
        return {'disposition': {'delivery': 'delivered_unverified', 'retry': 'unsafe'}}


class SessionTests(unittest.TestCase):
    def setUp(self):
        self.backend = FakeBackend()
        self.events = []
        self.task = TaskSession(self.backend, self.events.append, enabled=True)

    def active(self):
        self.task.handoff(TARGET)
        self.task.snapshot()
        return '@s1:e1'

    def test_off_by_default_has_no_native_calls(self):
        task = TaskSession(self.backend, self.events.append)
        with self.assertRaises(DesktopError):
            task.handoff(TARGET)
        self.assertEqual(self.backend.calls, [])

    def test_scope_required(self):
        with self.assertRaises(DesktopError):
            self.task.handoff(Target('App', 0, '', ''))
        self.assertEqual(self.backend.calls, [])

    def test_permission_or_target_failure_stays_in_browser(self):
        self.backend.fail_target = True
        with self.assertRaises(DesktopError):
            self.task.handoff(TARGET)
        self.assertIsNone(self.task.target)
        self.assertEqual(self.task.phase, 'browser')

    def test_double_handoff_refused(self):
        self.active()
        with self.assertRaises(DesktopError):
            self.task.handoff(TARGET)

    def test_stale_ref_after_new_snapshot(self):
        old = self.active()
        self.task.snapshot()
        with self.assertRaises(DesktopError):
            self.task.click(old)
        self.assertNotIn('click', self.backend.calls)

    def test_foreign_session_ref(self):
        self.active()
        with self.assertRaises(DesktopError):
            self.task.click('@foreign:e1')
        self.assertNotIn('click', self.backend.calls)

    def test_incomplete_snapshot_invalidates_previous_refs(self):
        old = self.active()
        self.backend.complete = False
        with self.assertRaises(DesktopError):
            self.task.snapshot()
        with self.assertRaises(DesktopError):
            self.task.click(old)

    def test_wrong_window_or_replaced_process_stops_before_click(self):
        ref = self.active()
        self.backend.fail_target = True
        with self.assertRaises(DesktopError):
            self.task.click(ref)
        self.assertNotIn('click', self.backend.calls)

    def test_successful_click_still_requires_independent_readback(self):
        self.task.click(self.active())
        self.assertEqual(self.task.phase, 'uncertain')
        with self.assertRaises(DesktopError):
            self.task.return_to_browser(lambda: False)
        self.assertNotEqual(self.task.phase, 'complete')
        self.task.return_to_browser(lambda: True)
        self.assertEqual(self.task.phase, 'complete')

    def test_uncertain_write_not_replayed_even_with_fresh_snapshot(self):
        ref = self.active()
        self.backend.fail_click = True
        with self.assertRaises(DesktopError):
            self.task.click(ref)
        self.task.snapshot()
        with self.assertRaises(DesktopError):
            self.task.click('@s2:e1')
        self.assertEqual(self.backend.calls.count('click'), 1)
        self.task.return_to_browser(lambda: True)

    def test_cancel_before_dispatch(self):
        ref = self.active()
        self.task.cancel()
        with self.assertRaises(DesktopError):
            self.task.click(ref)
        self.assertNotIn('click', self.backend.calls)

    def test_cancel_during_write_never_completes(self):
        ref = self.active()
        self.backend.cancel_during = self.task.cancelled
        with self.assertRaises(DesktopError):
            self.task.click(ref)
        with self.assertRaises(DesktopError):
            self.task.return_to_browser(lambda: True)
        self.assertEqual(self.task.phase, 'cancelled')

    def test_failed_return_can_be_observed_and_recovered_without_replay(self):
        self.task.click(self.active())
        with self.assertRaises(OSError):
            self.task.return_to_browser(lambda: (_ for _ in ()).throw(OSError()))
        self.task.snapshot()
        self.task.return_to_browser(lambda: True)
        self.assertEqual(self.backend.calls.count('click'), 1)

    def test_audit_contains_no_raw_content(self):
        self.task.click(self.active())
        self.task.return_to_browser(lambda: True)
        self.assertNotIn(TARGET.app, json.dumps(self.events))
        self.assertEqual([e['sequence'] for e in self.events], list(range(1, len(self.events) + 1)))
        self.assertEqual({e['task_id'] for e in self.events}, {self.task.id})

    def test_audit_failure_prevents_write(self):
        ref = self.active()
        self.task.audit = lambda event: (_ for _ in ()).throw(OSError('disk full'))
        with self.assertRaises(OSError):
            self.task.click(ref)
        self.assertNotIn('click', self.backend.calls)


class BackendTests(unittest.TestCase):
    def command(self, source, *, timeout=1, cancelled=None):
        with tempfile.TemporaryDirectory() as directory:
            executable = Path(directory) / 'fake-desktop'
            executable.write_text('#!' + sys.executable + '\n' + source)
            executable.chmod(0o700)
            backend = CliBackend(executable, Path(directory) / 'state', 'rad-test')
            return backend.command(['status'], cancelled or Event(), timeout)

    def test_valid_envelope(self):
        result = self.command('print(\'{"version":"2.6","command":"status","ok":true,"data":{"test":true}}\')')
        self.assertEqual(result, {'test': True})

    def test_output_bound(self):
        with self.assertRaisesRegex(DesktopError, 'bound'):
            self.command('print("x" * 300000)')

    def test_timeout(self):
        with self.assertRaisesRegex(DesktopError, 'deadline'):
            self.command('import time; time.sleep(2)', timeout=0.05)

    def test_cancellation_before_child(self):
        cancel = Event()
        cancel.set()
        with self.assertRaisesRegex(DesktopError, 'cancelled'):
            self.command('raise Exception()', cancelled=cancel)

    def test_malformed_response(self):
        with self.assertRaises(DesktopError):
            self.command('print("not JSON")')

    def test_wrong_protocol_or_command(self):
        for output in [dict(version='2.5', command='status', ok=True, data={}),
                       dict(version='2.6', command='click', ok=True, data={}),
                       dict(version='2.6', command='status', ok=False, error={})]:
            with self.subTest(output=output), self.assertRaises(DesktopError):
                self.command('print(' + repr(json.dumps(output)) + ')')

    def test_process_incarnation_and_window_scope(self):
        with tempfile.TemporaryDirectory() as directory:
            backend = CliBackend(sys.executable, Path(directory) / 'state', 'test')
            backend.windows = lambda app, cancel: [dict(id='window-1', pid=123,
                process_instance='process-123-start-2', accessible=True)]
            with self.assertRaises(DesktopError):
                backend.preflight(TARGET, Event())

    def test_denied_permission_never_lists_windows(self):
        with tempfile.TemporaryDirectory() as directory:
            backend = CliBackend(sys.executable, Path(directory) / 'state', 'test')
            calls = []
            def command(args, cancel):
                calls.append(args[0])
                return dict(platform='macos', version='1.2.0', permissions={
                    'accessibility': {'state': 'denied'}})
            backend.command = command
            with self.assertRaisesRegex(DesktopError, 'Accessibility'):
                backend.windows('RAD Fixture', Event())
            self.assertEqual(calls, ['status'])


class ReadbackTests(unittest.TestCase):
    def test_exact_receipt_with_paired_trust_envelope(self):
        text = '[UNTRUSTED_PAGE_CONTENT nonce=0123456789abcdef origin=http://127.0.0.1/] data\nRAD-DESKTOP-test\n[END_UNTRUSTED_PAGE_CONTENT nonce=0123456789abcdef]'
        self.assertTrue(receipt_matches(text, 'RAD-DESKTOP-test', 'http://127.0.0.1/'))
        self.assertFalse(receipt_matches(text, 'RAD-DESKTOP-wrong', 'http://127.0.0.1/'))
        self.assertFalse(receipt_matches(text, 'RAD-DESKTOP-test', 'http://other/'))
        self.assertFalse(receipt_matches(text.replace('\nRAD-DESKTOP-test', '\nextra\nRAD-DESKTOP-test'), 'RAD-DESKTOP-test', 'http://127.0.0.1/'))


class McpTests(unittest.TestCase):
    def test_cancel_prevents_browser_request(self):
        client = Mcp.__new__(Mcp)
        client.cancelled = Event()
        client.cancelled.set()
        with self.assertRaisesRegex(DesktopError, 'cancelled'):
            client.rpc('tools/call', {})

    def test_sse_empty_heartbeat_and_multiline_data(self):
        raw = b'data: \n\n: keepalive\n\ndata: {"id": 7,\ndata: "result": {"ok": true}}\n\n'
        self.assertEqual(decode_response(raw, 7)['result'], {'ok': True})

    def test_json_response_and_unrelated_notification(self):
        self.assertIsNone(decode_response(b'{"method":"notification"}', 7))
        self.assertEqual(decode_response(b'{"id":7,"result":{}}', 7)['result'], {})


if __name__ == '__main__':
    unittest.main()
