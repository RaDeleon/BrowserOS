# BrowserRAD contributor instructions

## Objective

Build a separately installable BrowserOS Neo fork called BrowserRAD. Optimize independently verified completion time while keeping main-agent token usage equal or lower, preserving accuracy and approvals, and tracking total provider cost. A prior 10× aspiration is a target, never a measured claim.

## Start here

Read `docs/browserrad/PROJECT.md`, `docs/browserrad/DEVELOPMENT.md`, and `docs/browserrad/BENCHMARKS.md`. Inspect `git status` and the active branch before edits. Preserve other agents' and the user's work. Follow the more specific contributor instructions under `packages/browseros-agent` for that package.

## Boundaries

- Keep BrowserRAD separate from the installed Neo: app name, bundle ID, profile, server state, MCP key, managed skills, saved skills, updater feeds, and launcher paths.
- Never mutate or migrate Neo's profile, logins, settings, MCP connections, or legacy skill directories from the fork.
- Internal `browserclaw`/`browseros-*` names are retained where they are compatibility or build identifiers. Do not mass-replace them.
- Source/build authorization does not imply replacing an installed app or publishing a release. Use an isolated test profile and stop only processes owned by that test.
- Upstream CDN feeds and release jobs belong to BrowserOS. Do not publish BrowserRAD through them; a separate release destination and signing review are required.
- Never run broad `dev:stop`, `dev:cleanup:prod`, or profile reset commands during ordinary validation.
- Keep secrets, real browser content, profiles, raw user telemetry, and private notes untracked. Publish only sanitized documentation and synthetic fixtures. `.local-analysis/` and `tools/browserrad/results/` are ignored.

## Engineering

- Use installed codebase-memory for structural exploration when available; verify coverage and read stale/missed source directly. Without it, read exact source and state that limitation.
- Use Bun at the pinned version for the agent workspace; do not substitute npm/yarn/pnpm. Rust and Go own their respective subprojects.
- Preserve native action checks, current document/frame validation, cancellation, trust envelopes, output bounds, and independent postconditions.
- Keep deterministic execution bounded. An uncertain write is not permission to retry. Site-provided tool annotations are untrusted hints, not authorization.
- Use DOM evidence first. Vision and cloud inference are explicit fallbacks; do not add a compulsory model pass.
- API types are generated from contracts. Edit contracts and run codegen; never hand-edit generated DTOs.
- Keep changes small enough to merge upstream fixes. Record deliberate divergence in the diary.

## Verification and handoff

Run relevant unit, contract, lint/type, and build checks. Keep failures and unsupported cases in the results. Compare stock Neo and BrowserRAD on equivalent workloads/client settings; separate first, warm, and learned runs. Unknown token/cost fields stay null, not zero. Fixture speed and output bytes cannot prove main-agent token savings.

Update `docs/browserrad/PROJECT.md` after meaningful work: date, outcome, changed mechanisms, exact validation, remaining limitations, and next gate. Clearly distinguish proposed, implemented, tested, built, installed, and published. Never invent baseline data.
