# BrowserRAD for Claude Code

Read and follow [AGENTS.md](AGENTS.md), the shared source of project rules. Then read [the project diary](docs/browserrad/PROJECT.md) and [development guide](docs/browserrad/DEVELOPMENT.md) before making changes.

This is the BrowserRAD fork, built on BrowserOS Neo. Its mission is faster independently verified tasks at equal or lower main-agent tokens and total cost. Keep the installed Neo intact for work and matched comparisons.

The Chromium overlay/build lives in `packages/browseros`; the Rust server, MCP primitives, cockpit, and developer tools live in `packages/browseros-agent`. The new deterministic helpers live beside `crates/browseros-mcp/src/tools/run.rs` in `rad-runtime.js`. Internal package names are intentionally retained.

Read nested `CLAUDE.md` and contributor guides when entering a package. Finish with an evidence-based diary update. Report what changed, which checks passed, any failed/blocked checks, and whether an artifact was actually built or installed. Do not call source changes an installed release.
