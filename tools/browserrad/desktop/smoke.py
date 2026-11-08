#!/usr/bin/env python3
"""Isolated development probe; not BrowserRAD's production Desktop mode."""
import argparse
from contextlib import ExitStack
import hashlib
import http.server
import json
import os
from pathlib import Path
import re
import signal
import subprocess
import tempfile
import threading
import time
from uuid import uuid4

from backend import CliBackend, NativeError
from mcp import Mcp
from session import DesktopError, Target, TaskSession

HELPER_SHA256 = '4a795a40ba7fc93b726b0834342f0225779c30d83e28f1f219db479860c38a78'
BINARY_SHA256 = 'dec75e0bba0d1f9b589bdb88188770ad1a199cde9e02cf0a5b94175491f738e9'
FIXTURE_SOURCE = Path(__file__).with_name('fixture.swift')


def stop(proc):
    if proc.poll() is None:
        os.killpg(proc.pid, signal.SIGTERM)
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            os.killpg(proc.pid, signal.SIGKILL)
            proc.wait()


def build_fixture(directory):
    app = directory / 'RAD Desktop Fixture.app'
    contents = app / 'Contents'
    executable = contents / 'MacOS' / 'RAD Desktop Fixture'
    executable.parent.mkdir(parents=True)
    import plistlib
    with (contents / 'Info.plist').open('wb') as stream:
        plistlib.dump(dict(CFBundleExecutable=executable.name,
                          CFBundleName='RAD Desktop Fixture',
                          CFBundleIdentifier='com.techinsf.browserrad.desktop-fixture',
                          CFBundlePackageType='APPL', CFBundleVersion='1'), stream)
    subprocess.run(['xcrun', 'swiftc', '-module-cache-path', str(directory / 'swift-cache'),
                    str(FIXTURE_SOURCE), '-o', str(executable)],
                   check=True, timeout=60)
    return executable


class PageHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        content = b'''<!doctype html><meta charset="utf-8"><title>RAD desktop handoff</title>
<h1>Synthetic desktop receipt</h1><label>Receipt file <input type="file" aria-label="Receipt file"></label>
<pre id="result">No receipt</pre><script>
document.querySelector('input').onchange = async e => {
 document.querySelector('#result').textContent = await e.target.files[0].text();
};</script>'''
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def log_message(self, *args):
        pass


def receipt_matches(text, token, url):
    lines = text.strip().splitlines()
    if len(lines) < 3:
        return False
    header = re.match(r'\[UNTRUSTED_PAGE_CONTENT nonce=([a-f0-9]{16}) origin=([^\]]+)\]', lines[0])
    return bool(header and header.group(2) == url
                and lines[-1] == '[END_UNTRUSTED_PAGE_CONTENT nonce=' + header.group(1) + ']'
                and '\n'.join(lines[1:-1]).strip() == token)


def probe(args, event_sink):
    cancelled = threading.Event()
    if not args.enable_desktop:
        # No executable lookup, subprocess, profile, app or OS observation.
        task = TaskSession(None, event_sink)
        try:
            task.handoff(Target('fixture', 1, 'disabled', 'disabled'))
        except DesktopError:
            return dict(status='disabled', native_dispatches=0)
    with tempfile.TemporaryDirectory(prefix='browserrad-desktop-') as temporary, ExitStack() as stack:
        directory = Path(temporary)
        executable = Path(args.agent_desktop).resolve(strict=True)
        if hashlib.sha256(executable.read_bytes()).hexdigest() != BINARY_SHA256:
            raise DesktopError('agent-desktop executable does not match reviewed v1.2.0 binary')
        helper = executable.with_name('agent-desktop-macos-helper')
        if hashlib.sha256(helper.read_bytes()).hexdigest() != HELPER_SHA256:
            raise DesktopError('agent-desktop helper does not match reviewed v1.2.0 helper')
        backend = CliBackend(executable, directory / 'desktop-state', 'rad-' + uuid4().hex)
        task = TaskSession(backend, event_sink, enabled=True, cancelled=cancelled)
        for sig in (signal.SIGINT, signal.SIGTERM):
            previous = signal.getsignal(sig)
            signal.signal(sig, lambda *_: cancelled.set())
            stack.callback(signal.signal, sig, previous)
        # Stop on denied permissions before compiling/launching either app.
        try:
            backend.permissions(cancelled)
        except DesktopError:
            task._emit('preflight', 'blocked')
            raise
        fixture = build_fixture(directory)
        token = 'RAD-DESKTOP-' + uuid4().hex
        receipt = directory / 'receipt.txt'
        native = subprocess.Popen([str(fixture), str(receipt), token], start_new_session=True,
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        stack.callback(stop, native)
        deadline = time.monotonic() + 8
        windows = []
        while time.monotonic() < deadline and native.poll() is None and not cancelled.is_set():
            try:
                windows = [window for window in backend.windows('RAD Desktop Fixture', cancelled)
                           if window.get('pid') == native.pid]
            except NativeError as error:
                if error.code not in ('APP_NOT_FOUND', 'WINDOW_NOT_FOUND'):
                    raise
                windows = []
            if len(windows) == 1:
                break
            cancelled.wait(0.1)  # Bounded process/window startup, not UI readiness.
        if len(windows) != 1:
            raise DesktopError('owned fixture window did not become uniquely accessible')
        window = windows[0]
        target = Target('RAD Desktop Fixture', native.pid, window['process_instance'], window['id'])
        server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), PageHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        stack.callback(server.server_close)
        stack.callback(server.shutdown)
        browser = Path(args.browser_app).resolve(strict=True)
        import plistlib
        with (browser / 'Contents/Info.plist').open('rb') as stream:
            if plistlib.load(stream).get('CFBundleIdentifier') != 'com.techinsf.BrowserRAD':
                raise DesktopError('refusing non-RAD browser bundle')
        env = os.environ.copy()
        env.update(BROWSERRAD_DIR=str(directory / 'rad-state'), BROWSERCLAW_HOSTED_MODE='1')
        (directory / 'rad-state').mkdir()
        (directory / 'rad-state/first-run-connect.json').write_text('{"firstRunConnectDone":true}')
        log_path = directory / 'rad.log'
        log = stack.enter_context(log_path.open('w'))
        rad = subprocess.Popen([str(browser / 'Contents/MacOS/BrowserRAD'), '--headless=new',
                '--no-first-run', '--no-default-browser-check', '--use-mock-keychain',
                '--disable-background-networking', '--disable-component-update', '--disable-sync',
                '--user-data-dir=' + str(directory / 'profile'), 'about:blank'],
                env=env, start_new_session=True, stdout=log, stderr=log)
        stack.callback(stop, rad)
        deadline = time.monotonic() + 25
        match = None
        while time.monotonic() < deadline and rad.poll() is None and not cancelled.is_set():
            match = re.search(r'claw-server listening bound=127\.0\.0\.1:(\d+)', log_path.read_text())
            if match:
                break
            cancelled.wait(0.1)
        if not match:
            raise DesktopError('owned RAD MCP endpoint did not start')
        mcp = Mcp(int(match.group(1)), lambda op, status: task._emit(op, status), cancelled=cancelled)
        url = f'http://127.0.0.1:{server.server_port}/'
        page = mcp.run('const p=await browser.open(' + json.dumps(url) + ');return {page:p.id};')['page']
        task.handoff(target)
        snapshot = task.snapshot()
        matches = []
        def buttons(node):
            if node.get('name') == 'Create synthetic receipt' and node.get('ref_id'):
                matches.append(node['ref_id'])
            for child in node.get('children', []):
                buttons(child)
        buttons(snapshot['tree'])
        if len(matches) != 1:
            raise DesktopError('native receipt button is missing/ambiguous')
        task.click(matches[0])
        task.snapshot()  # Fresh native observation, not an acknowledgment as proof.

        def verify():
            if not receipt.is_file() or receipt.read_text() != token + '\n':
                return False
            # Re-derive the browser binding, never send the receipt to a changed page.
            pages = mcp.run('return await browser.pages.list();')
            if not any(p['pageId'] == page and p['url'] == url and p['ownership'] == 'mine' for p in pages):
                return False
            result = mcp.run('const p=browser.page(' + str(page) + ');'
                'const s=await p.snapshot();return {text:s.text,partial:s.partial,url:s.url};')
            if result.get('partial') or result.get('url') != url:
                return False
            lines = [line for line in result['text'].splitlines() if 'Receipt file' in line and '[ref=' in line]
            if len(lines) != 1:
                return False
            ref = re.search(r'\[ref=(e\d+)\]', lines[0])
            if not ref:
                return False
            mcp.tool('upload', dict(page=page, ref=ref.group(1), files=[str(receipt)]))
            verified = mcp.run('const p=browser.page(' + str(page) + ');'
                'await p.waitForText(' + json.dumps(token) + ',{timeout:3000});'
                'return {text:await p.read("#result",{format:"text"})};')
            return receipt_matches(verified['text'], token, url)
        task.return_to_browser(verify)
        return dict(status='verified', task_id=task.id, native_clicks=1,
                    browser_return='independent receipt and page readback',
                    cockpit_integration=False, client_tokens=None, provider_cost=None)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--enable-desktop', action='store_true')
    parser.add_argument('--agent-desktop')
    parser.add_argument('--browser-app', default='/Applications/BrowserRAD.app')
    parser.add_argument('--output', type=Path, required=True,
                        help='New ignored local results directory (never published)')
    args = parser.parse_args()
    if args.enable_desktop and not args.agent_desktop:
        parser.error('--enable-desktop requires --agent-desktop')
    # Restrict artifacts to this repo's ignored results directory.
    results_root = Path(__file__).resolve().parents[1] / 'results'
    output = args.output.resolve()
    if not output.is_relative_to(results_root.resolve()):
        parser.error('--output must be within tools/browserrad/results/')
    output.mkdir(parents=True, mode=0o700, exist_ok=False)
    events = output / 'events.jsonl'
    with events.open('x', encoding='utf-8') as stream:
        events.chmod(0o600)
        def audit(event):
            stream.write(json.dumps(event) + '\n')
            stream.flush()
        started = time.monotonic()
        try:
            summary = probe(args, audit)
            exit_code = 0
        except Exception as error:
            import traceback
            (output / 'failure.txt').write_text(traceback.format_exc())
            # Fixed error class only; raw CLI/page/process output stays private.
            summary = dict(status='blocked', reason=type(error).__name__,
                           client_tokens=None, provider_cost=None)
            if isinstance(error, DesktopError):
                summary['detail'] = str(error)
            exit_code = 2
    summary['wall_time_ms'] = round((time.monotonic() - started) * 1000)
    summary['timing_scope'] = 'whole probe including startup, fixture compilation and cleanup'
    (output / 'summary.json').write_text(json.dumps(summary, indent=2) + '\n')
    print(json.dumps(summary, indent=2))
    return exit_code


if __name__ == '__main__':
    raise SystemExit(main())
