"""Bounded local MCP client used only for the runner's disposable RAD process."""
import json
import re
import urllib.request
from threading import Event

from session import DesktopError


class Mcp:
    def __init__(self, port, audit, *, cancelled=None):
        self.cancelled = cancelled if cancelled is not None else Event()
        if not isinstance(port, int) or not 0 < port < 65536:
            raise DesktopError('invalid owned MCP port')
        self.endpoint = f'http://127.0.0.1:{port}/mcp'
        self.session = None
        self.number = 0
        self.audit = audit
        # Do not send loopback traffic through inherited HTTP proxy settings.
        self.http = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        self.rpc('initialize', {'protocolVersion': '2025-03-26', 'capabilities': {},
                 'clientInfo': {'name': 'browserrad-desktop-probe', 'version': '1'}})
        self.rpc('notifications/initialized', {}, notification=True)

    def rpc(self, method, params, notification=False):
        if self.cancelled.is_set():
            raise DesktopError('cancelled before browser dispatch')
        self.number += 1
        request = dict(jsonrpc='2.0', method=method, params=params)
        if not notification:
            request['id'] = self.number
        headers = {'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream',
                   'MCP-Protocol-Version': '2025-03-26'}
        if self.session:
            headers['Mcp-Session-Id'] = self.session
        with self.http.open(urllib.request.Request(self.endpoint,
                data=json.dumps(request).encode(), headers=headers), timeout=35) as response:
            if response.headers.get('Mcp-Session-Id'):
                self.session = response.headers['Mcp-Session-Id']
            raw = response.read(512 * 1024 + 1)
        if self.cancelled.is_set():
            raise DesktopError('cancelled after browser dispatch; inspect before recovery')
        if len(raw) > 512 * 1024:
            raise DesktopError('MCP output exceeded bound')
        if notification:
            return None
        message = decode_response(raw, self.number)
        if not message or 'error' in message:
            raise DesktopError('owned RAD MCP request failed; no fallback')
        return message['result']

    def tool(self, name, args):
        self.audit('browser_' + name, 'admitted')
        try:
            result = self.rpc('tools/call', {'name': name, 'arguments': args})
            if result.get('isError'):
                raise DesktopError('RAD tool failed; inspect before recovery')
            self.audit('browser_' + name, 'returned')
            return result
        except Exception:
            self.audit('browser_' + name, 'failed')
            raise

    def run(self, code):
        result = self.tool('run', {'code': code, 'maxChars': 4000})
        value = result.get('structuredContent')
        if value is None:
            text = '\n'.join(item.get('text', '') for item in result.get('content', []))
            value = json.loads(text)
        if value.get('ok') is False:
            raise DesktopError('RAD script failed')
        return value.get('value', value)


def decode_response(raw, request_id):
    if raw.lstrip().startswith(b'{'):
        messages = [json.loads(raw)]
    else:
        messages = []
        for event in re.split(r'\r?\n\r?\n', raw.decode()):
            data = '\n'.join(line[5:].lstrip() for line in event.splitlines()
                             if line.startswith('data:')).strip()
            if data and data != '[DONE]':
                messages.append(json.loads(data))
    return next((item for item in messages if item.get('id') == request_id), None)
