# BrowserRAD development guide

BrowserRAD is a source preview based on BrowserOS Neo. The native product still uses `--product browserclaw` internally; the macOS app/executable becomes `BrowserRAD`. Keeping that build selector avoids a broad upstream refactor.

## Coexistence contract

| Surface | Stock Neo | BrowserRAD |
| --- | --- | --- |
| App and executable | BrowserOS neo | BrowserRAD |
| Cockpit extension ID | pjimfkbpehlcllblajnpfamdfjhhlgkc | efdbmkebmplcaefnjkgfnnbmgdjndifl |
| Release bundle ID | com.browseros.BrowserClaw | com.techinsf.BrowserRAD |
| macOS profile directory | BrowserClaw | BrowserRAD |
| State directory | ~/.browserclaw | ~/.browserrad |
| State override | BROWSERCLAW_DIR | BROWSERRAD_DIR |
| MCP / managed skill | browseros-neo | browserrad |
| Saved skill prefix | neo- | rad- |
| Keychain service | BrowserClaw Safe Storage | BrowserRAD Safe Storage |
| Updater | Upstream feeds | Preview updates disabled |

BrowserRAD must not migrate or disconnect stock Neo entries. The developer launcher fails at BrowserRAD's path when no fork is installed; it must not fall back to launching a stock app. The separate Claude Desktop `.mcpb` has not been published; the fork refuses to install Neo's bundle. Manual MCP setup is the preview route.

macOS is the initial packaging target. Linux and Windows installation coexistence remain unverified; do not publish installers for them from this preview. Internal server binary/resource directory names remain upstream-compatible.

## Toolchain and checks

Follow the package contributor guides. Bun's version is pinned in `packages/browseros-agent/package.json`; the first environment had Bun 1.4.4, while the project pins 1.4.2. Record the actual runtime in validation results. Dependencies can be installed with the frozen lockfile; lifecycle hooks are not required for inspection.

```sh
# Repository root: deterministic helper and pointer behavior
bun test tools/browserrad/runtime.test.ts packages/browseros-agent/scripts/build/agent-pointer.test.ts

cd packages/browseros-agent
cargo test --locked -p browseros-core -p browseros-mcp -p claw-server -j 4
cargo fmt --all --check
cargo clippy --workspace --all-targets -- -D warnings
bun run check
bun run test

cd ../browseros
uv sync --locked
uv run browseros product doctor browserclaw
```

The fork operating guide is `skills/browserrad/SKILL.md`; keep it aligned with the bundled `packages/browseros-agent/resources/skills/browserclaw/SKILL.md`. The upstream Neo manual guide remains available separately. An explicit Neo or BrowserHelm selection must never be redirected to BrowserRAD.

Do not hand-edit generated API DTOs. New runtime helpers live in `crates/browseros-mcp/src/tools/rad-runtime.js`, injected by `run.rs`; they compose the existing guarded SDK rather than bypassing native input, ownership or cancellation.

## Switches

- Set `BROWSERRAD_FAST_PATH=0` on the server process to omit the extra SDK methods and skip parsing their runtime. The default is enabled. This is a process setting, not a live cockpit switch.
- Use the existing behavior-file mechanism, `BROWSERCLAW_CONFIG_FILE`, with `[performance] instant_pointer = false` to restore animated travel. The env name is retained for build compatibility. Restart only the isolated fork test server to change it.
- `navigate` keeps full snapshot readback by default. Set `snapshot:false` when the next operation is a known targeted read; URL, HTTP status and navigation errors remain.
- The same-origin fetch and WebMCP methods run only when explicitly invoked. They do not enable browser flags, copy cookies, call providers, or change client routing.

Shared evidence defaults to a 6,000-character total excerpt budget, fairly divided across up to eight queries. `maxChars` accepts 256–16,000; counts and truncation remain explicit. This is a payload mechanism, not a measured token guarantee.

## Bounded plans and reuse

```js
return await page.executePlan({
  origin: 'https://example.com',
  steps: [
    { kind: 'fill', target: { role: 'textbox', name: 'Search' }, value: 'rad', authorized: true },
    { kind: 'click', target: { role: 'button', name: 'Search' }, authorized: true,
      expect: { kind: 'selector', value: '#results' } },
    { kind: 'read', selector: '#results' },
  ],
  expect: { kind: 'text', value: 'Results' },
});
```

Each action acquires fresh refs and requires a unique role/name match. Incomplete frames or unexpected origins stop execution. An exception after input may mean the action happened; return `uncertain` and verify before recovery. `authorized:true` is the caller's declaration of existing authorization, not an approval bypass or a fact supplied by the website.

Use existing local saved helpers/verified flows to reuse a procedure after independent success. Do not persist credentials or bake transient refs into a replay. A repeat is a new live execution with current preconditions and postconditions. Keep stale-route misses, failures, and repair costs in benchmark results. The native plan path does not introduce a second LLM or automatically call vision; the main planner decides how to recover.

## Experimental retrieval and site tools

`fetchRead` uses the current page's same-origin browser context, GET only, no-store cache policy, rejects redirects, aborts after five seconds, and bounds response bytes. It returns raw content, not rendered DOM. It is observable by the website and GET alone does not prove an endpoint is harmless. Invoke only for an authorized URL; use normal page reads when content parity is uncertain.

WebMCP uses the current `document.modelContext.getTools/executeTool` API, checks origin, limits discovery, and requires an explicit postcondition after a call. No cross-origin tool discovery is attempted. Unsupported browsers return an unsupported result. A cancellation signal cannot guarantee a site stopped its side effects; timeout is uncertain, never an automatic retry. [Current Chrome API documentation](https://developer.chrome.com/docs/ai/webmcp/imperative-api).

## Native build

A sidecar or extension build is not a new Chromium executable. The repository pins Chromium 155.0.8059.26 and documents roughly 100 GB and hours for a fresh source build. Provision a dedicated checkout with the build system's `source ensure`; never point reset/clean commands at an unrelated checkout.

```sh
cd packages/browseros
uv run browseros source ensure --root /path/to/BrowserRAD-chromium --strategy shallow
uv run browseros build --preset release --product browserclaw --chromium-src /path/to/BrowserRAD-chromium/src --resource-mode source --provision none --no-clean --no-sign --no-upload --show-plan
```

Source mode requires a clean tracked checkout so artifacts can be attributed to a commit. Create a local reviewed checkpoint before building; pushing is not required. The cockpit needs the fork's private extension signing key in `BROWSERRAD_EXTENSION_KEY`, supplied locally without logging it. Its public identity is recorded in `extension-identity.json` and the WXT manifest. Never use Neo's signing key, commit a private key, or regenerate the fork key casually: a different key changes the extension ID. `VITE_CLAW_POSTHOG_KEY` is optional for this fork, so a telemetry account is not a build prerequisite.

Inspect the plan before running it. Source resource mode is essential: the default published mode would bundle upstream components instead of the edited fork. Debug naming is `BrowserRAD Dev`; release naming is `BrowserRAD`. Preview signing must not use upstream's Apple team or provisioning profiles. Native packaging, separate-profile launch, signature inspection, and matched benchmarks are required before calling the fork installable. Do not replace anything in `/Applications` as part of a test build.

## Upstream maintenance

Keep `origin` on the fork and `upstream` on BrowserOS. Fetch and review changes on a separate branch; merge or rebase only with a clean, understood working tree. Re-run identity/coexistence, patch integrity, API, and benchmark checks after changes to the browser or execution layer. Do not enable upstream binary feeds as a substitute for merging source.
