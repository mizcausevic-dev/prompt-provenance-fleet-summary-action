# Changelog

## v0.1.0 — 2026-05-27

- Initial release: GitHub Action wrapping `prompt-provenance-fleet-summary` for PR gating.
- Inputs: `prompts-dir` (required), `comment-on-pr` (auto/true/false), `fail-on-high` (default true), `github-token`.
- Outputs: `total-prompts`, `high-findings`, `approved-count`, `deprecated-count`.
- Vendored 10-code fleet-summary logic — same findings as the standalone library.
- Posts per-PR Markdown comment when run on `pull_request` events with a valid token.
- Fails the run (exit 1) on any high-severity finding by default.
- Composite Node 20 action with `dist/index.js` committed for SHA/tag pinning.
- 6-document fixture corpus (clean approved, draft root, approved-no-evals, single-reviewer, deprecated-still-passing, failing-on-approved).
- Third in the action family — completes the trio across A2A / MCP / prompts.
- Node 20/22 CI (lint, typecheck, coverage, build, `npm audit`), AGPL-3.0-or-later, Dependabot.
