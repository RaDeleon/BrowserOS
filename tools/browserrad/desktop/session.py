"""Experimental host authority for one browser/native/browser handoff.

Not a shipping MCP tool. The host supplies scope, cancellation and the audit sink;
page content cannot enable Desktop mode or authorize an action.
"""
from dataclasses import dataclass
from threading import Event
from uuid import uuid4
import time


class DesktopError(RuntimeError):
    pass


@dataclass(frozen=True)
class Target:
    app: str
    pid: int
    process_instance: str
    window: str


class TaskSession:
    def __init__(self, backend, audit, *, enabled=False, cancelled=None):
        self.started = time.monotonic()
        self.id = 'rad-' + uuid4().hex
        self.backend = backend
        self.audit = audit
        self.enabled = enabled
        self.cancelled = cancelled if cancelled is not None else Event()
        self.phase = 'browser'
        self.target = None
        self.refs = set()
        self.snapshot_id = None
        self.sequence = 0
        self._emit('task', 'created')

    def _emit(self, operation, outcome):
        self.sequence += 1
        # No app titles, text, refs, arguments, paths, images or raw tool errors.
        self.audit(dict(task_id=self.id, sequence=self.sequence,
                        elapsed_ms=round((time.monotonic() - self.started) * 1000),
                        surface='browser' if operation.startswith('browser_') or not self.target else 'desktop',
                        operation=operation, outcome=outcome, phase=self.phase))

    def _check(self, *, desktop=False):
        if self.cancelled.is_set():
            self.phase = 'cancelled'
            self.refs.clear()
            self._emit('task', 'cancelled')
            raise DesktopError('cancelled; inspect live state before recovery')
        if desktop and (not self.enabled or self.target is None):
            raise DesktopError('Desktop mode is off or has no authorized target')

    def handoff(self, target):
        self._check()
        if not self.enabled:
            self._emit('handoff', 'disabled')
            raise DesktopError('Desktop mode is off')
        if self.phase != 'browser' or self.target is not None:
            raise DesktopError('handoff already active')
        if not target.app or target.pid <= 0 or not target.process_instance or not target.window:
            raise DesktopError('exact app/process/window scope required')
        self.target = target
        try:
            self.backend.preflight(target, self.cancelled)
            self._check()
        except Exception:
            self.target = None
            self._emit('handoff', 'blocked')
            raise
        self.phase = 'desktop'
        self._emit('handoff', 'admitted')

    def snapshot(self):
        self._check(desktop=True)
        self.refs.clear()
        try:
            data = self.backend.snapshot(self.target, self.cancelled)
            self._check(desktop=True)
            if data.get('complete') is not True:
                raise DesktopError('incomplete accessibility tree')
            sid = data.get('snapshot_id')
            if not isinstance(sid, str) or not sid or len(sid) > 128:
                raise DesktopError('invalid snapshot identity')
            refs = set()
            def collect(node, depth=0):
                if depth > 100 or not isinstance(node, dict):
                    raise DesktopError('invalid accessibility tree')
                ref = node.get('ref_id')
                if ref is not None:
                    if not isinstance(ref, str) or not ref.startswith('@' + sid + ':e'):
                        raise DesktopError('foreign snapshot ref')
                    refs.add(ref)
                for child in node.get('children', []):
                    collect(child, depth + 1)
            collect(data['tree'])
            self.refs = refs
            self.snapshot_id = sid
        except Exception:
            self._emit('snapshot', 'failed')
            raise
        self._emit('snapshot', 'observed')
        return data

    def click(self, ref):
        self._check(desktop=True)
        if self.phase != 'desktop' or ref not in self.refs:
            self._emit('click', 'refused')
            raise DesktopError('stale/foreign ref or unresolved previous action')
        # Audit admission must succeed before dispatch. Consume refs even if the
        # child times out, is cancelled or returns malformed output after input.
        self.phase = 'uncertain'
        self.refs.clear()
        self._emit('click', 'admitted')
        try:
            report = self.backend.click(self.target, ref, self.cancelled)
            self._check(desktop=True)
        except Exception:
            self._emit('click', 'uncertain')
            raise
        self._emit('click', 'requires_readback')
        return report

    def return_to_browser(self, verify):
        self._check(desktop=True)
        # verify is trusted host code: fresh browser binding and independent
        # receipt/page read, never an assertion from native action output.
        try:
            if verify() is not True:
                raise DesktopError('browser return/postcondition failed')
            self._check(desktop=True)
        except Exception:
            self._emit('return', 'failed')
            raise
        self.refs.clear()
        self.phase = 'complete'
        try:
            self._emit('return', 'verified')
        except Exception:
            self.phase = 'uncertain'
            raise
        self.target = None

    def cancel(self):
        self.cancelled.set()
        self.refs.clear()
