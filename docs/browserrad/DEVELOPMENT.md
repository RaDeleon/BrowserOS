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

### Resume a configured native build

Once resources, patches and GN configuration have succeeded, resume at compilation instead of rerunning preparation:

```sh
uv run browseros build --preset release --product browserclaw --chromium-src /path/to/BrowserRAD-chromium/src --resource-mode source --provision none --no-clean --no-sign --no-upload --from compile
```

Use the same toolchain, environment, checkout and output directory as the original build. Inspect with `--show-plan` first: the remaining steps should be `compile` and `package_macos`. The patch step expects a pristine pinned tree and is not idempotent. Reapplying it over a prepared checkout can fail on modified or newly created files; do not use broad cleanup commands that remove Chromium dependencies or incremental output.

On this macOS setup, native shader compilation also required Apple's Metal Toolchain component. `xcrun metal --version` verifies its availability; `xcodebuild -downloadComponent MetalToolchain` installed the missing component after dependency setup was authorized.

## Alpha packaging

`tools/browserrad/release.json` owns the fork's release version separately from inherited Chromium/BrowserOS engine versions. The requested “0.01 alpha” uses the `0.0.1-alpha.N` series. The current candidate is `0.0.1-alpha.2`; alpha.1 remains a superseded draft after packaging validation failures. Do not renumber Chromium's framework or change the pinned engine to label a BrowserRAD release.

After the native build finishes, from the repository root:

```sh
uv run --project packages/browseros python tools/browserrad/package_alpha.py --app /path/to/BrowserRAD-chromium/src/out/Default_browserclaw_arm64/BrowserRAD.app --chromium-src /path/to/BrowserRAD-chromium/src
```

The packager requires clean committed source at the declared release tag, the declared Chromium pin, the BrowserRAD identity and Apple Silicon architecture. It rejects executable-source changes since the declared build checkpoint, unexpected private-state files and symlinks escaping the app. It copies the app into ignored `tools/browserrad/results/releases/`, stamps only the outer app's release version, signs nested components ad hoc with the existing entitlement templates, checks signature integrity and builds a ZIP plus checksum/provenance files. It refuses to overwrite an existing output directory. It never installs, tags, uploads or publishes anything.

Ad-hoc signing is not Developer ID signing or notarization. The preview omits hardened runtime and library validation, which require a Developer ID team to load this app’s bundled frameworks. The ZIP avoids FinderInfo metadata introduced by the HFS DMG path. This alpha's GitHub release stays a draft until a real packaged-app launch and coexistence check pass. Record those results in the manifest and release notes, regenerate the checksum if the manifest changes, then publish as a prerelease with only the reviewed ZIP, `SHA256SUMS` and `release-manifest.json`. Do not attach the entire local output directory, build logs or private signing material. Never move a published release tag to hide a fix; issue another alpha version when executable source changes.

## Fork and branch workflow

`origin` is our repository, `RaDeleon/BrowserOS`. `upstream` is the original `browseros-ai/BrowserOS`. Each remote has its own `main`; they do not need to stay identical.

The initial BrowserRAD implementation lives on `codex/browserrad`, including its README, agent instructions and diary. Keep it separate until native packaging and coexistence checks pass. Then open a pull request **inside our fork**, from `codex/browserrad` into `RaDeleon/BrowserOS:main`. Merging makes BrowserRAD the fork's main code and README. It does not change the original BrowserOS repository or install an app.

After that initial merge, use our `main` for the stable BrowserRAD line and create short feature branches such as `codex/shared-evidence` for new work. Commit and push those branches to `origin`; review and merge them through pull requests targeting our fork. No new fork or copied repository is needed for each feature.

For upstream updates, check official release records before source integration. Accept an upstream change only after it is on official `main` and included in a published Neo browser, Claw server or Neo extension version. Verify the release tag or versioned maintenance assets, their source/promotion commit, and the ancestry from the last adopted release cutoff. Do not merge ordinary newer `main` commits merely because they are available. Integrate through the release boundary on a dedicated branch; review conflicts, preserve RAD identities and rerun relevant checks. Prefer corrective commits over rebasing published shared history. Never force-sync the fork by discarding its custom commits.

## Upstream maintenance

Keep `origin` on the fork and `upstream` on BrowserOS. The current adopted official source cutoff is `e35f20e` (Neo 0.52.1.1 maintenance promotion). The later `9e07439` main merge was reversed because it had no newer published version. That merge remains in Git history: when a later official version ships, inspect effective file changes and use a reviewed replay or selective application rather than assuming a plain merge will restore the reverted code. Re-run identity/coexistence, patch integrity, API and benchmark checks after changes to the browser or execution layer. Do not enable upstream binary feeds as a substitute for merging source.

## Local installation and Spotlight

After validating a BrowserRAD candidate and confirming no BrowserRAD task is active, install the tested app at `/Applications/BrowserRAD.app` and launch that path for normal use. Preserve the existing BrowserRAD profile, settings, and extension identity. Keep the Chromium checkout and `out/Default_browserclaw_arm64/BrowserRAD.app` for incremental builds; it is a build output, not the app to select in Spotlight. Generated candidates belong in ignored `tools/browserrad/results/` only until validation and installation; remove obsolete copies after the installed app is verified. Release ZIPs and checksums are separate artifacts, and a local install does not publish a GitHub release.

Before signing and installing a candidate, verify that each bundled CRX manifest version agrees with its `bundled_extensions.json` `external_version` and the local provenance metadata. A newer CRX with an older catalog version will not upgrade an existing profile. Re-sign and verify after any package-resource correction, then confirm the active profile actually loaded the new extension version.
