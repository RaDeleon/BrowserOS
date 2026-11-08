"""Narrow agent-desktop 1.2.0 CLI adapter; no shell or physical fallback."""
import json
import os
from pathlib import Path
import selectors
import signal
import subprocess
import time

from session import DesktopError

MAX_OUTPUT = 256 * 1024


class NativeError(DesktopError):
    def __init__(self, command, code):
        # Keep only bounded protocol identifiers, not native message/content.
        self.code = code if isinstance(code, str) and code.isupper() and len(code) <= 64 else 'UNKNOWN'
        super().__init__(f'native {command} refused ({self.code}); no automatic retry')


class CliBackend:
    def __init__(self, executable, state_root, session):
        self.executable = Path(executable).resolve(strict=True)
        self.state_root = Path(state_root).resolve()
        self.state_root.mkdir(mode=0o700, parents=True, exist_ok=False)
        self.session = session
        # Prevent inherited desktop session, tracing or helper configuration.
        self.env = {key: value for key, value in os.environ.items()
                    if not key.startswith('AGENT_DESKTOP_')}
        self.env['AGENT_DESKTOP_HOME'] = str(self.state_root)

    def command(self, args, cancelled, timeout=8):
        if cancelled.is_set():
            raise DesktopError('cancelled before native dispatch')
        argv = [str(self.executable), '--session', self.session, *args]
        proc = subprocess.Popen(argv, env=self.env, stdin=subprocess.DEVNULL,
                                stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                                start_new_session=True)
        output = bytearray()
        deadline = time.monotonic() + timeout
        try:
            with selectors.DefaultSelector() as selector:
                selector.register(proc.stdout, selectors.EVENT_READ)
                while selector.get_map():
                    if cancelled.is_set() or time.monotonic() >= deadline:
                        raise DesktopError('native command cancelled or deadline exceeded')
                    for key, _ in selector.select(timeout=0.025):
                        block = os.read(key.fileobj.fileno(), 8192)
                        if not block:
                            selector.unregister(key.fileobj)
                        output.extend(block)
                        if len(output) > MAX_OUTPUT:
                            raise DesktopError('native command output exceeded bound')
            remaining = max(0.001, deadline - time.monotonic())
            proc.wait(timeout=remaining)
            envelope = json.loads(output)
            if not isinstance(envelope, dict) or envelope.get('ok') is not True or proc.returncode:
                raise NativeError(args[0], envelope.get('error', {}).get('code') if isinstance(envelope, dict) else None)
            if envelope.get('command') != args[0] or envelope.get('version') != '2.6':
                raise DesktopError('unexpected native protocol')
            return envelope['data']
        except (ValueError, KeyError, subprocess.TimeoutExpired) as exc:
            raise DesktopError('invalid/uncertain native response') from exc
        finally:
            if proc.poll() is None:
                os.killpg(proc.pid, signal.SIGKILL)
            proc.wait()
            proc.stdout.close()

    def status(self, cancelled):
        data = self.command(['status'], cancelled)
        if data.get('version') != '1.2.0' or data.get('platform') != 'macos':
            raise DesktopError('requires reviewed agent-desktop 1.2.0 for macOS')
        return data

    def permissions(self, cancelled):
        status = self.status(cancelled)
        if status.get('permissions', {}).get('accessibility', {}).get('state') != 'granted':
            raise DesktopError('macOS Accessibility permission is not granted')
        return status

    def windows(self, app, cancelled):
        self.permissions(cancelled)
        return self.command(['list-windows', '--app', app], cancelled)

    def preflight(self, target, cancelled):
        windows = self.windows(target.app, cancelled)
        matches = [window for window in windows
                   if window.get('id') == target.window
                   and window.get('pid') == target.pid
                   and window.get('process_instance') == target.process_instance
                   and window.get('accessible') is True]
        if len(matches) != 1:
            raise DesktopError('authorized process/window is no longer accessible')

    def snapshot(self, target, cancelled):
        self.preflight(target, cancelled)
        return self.command(['snapshot', '--app', target.app, '--window-id', target.window,
                             '--max-depth', '10', '--timeout-ms', '3000'], cancelled)

    def click(self, target, ref, cancelled):
        self.preflight(target, cancelled)
        # Ref resolution inside agent-desktop pins process/window identity again.
        # No --headed, no coordinate fallback, no retry in either layer.
        return self.command(['click', ref], cancelled)
