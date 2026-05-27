# prompt-provenance-fleet-summary-action

[![CI](https://github.com/mizcausevic-dev/prompt-provenance-fleet-summary-action/actions/workflows/ci.yml/badge.svg)](https://github.com/mizcausevic-dev/prompt-provenance-fleet-summary-action/actions/workflows/ci.yml)
[![License: AGPL-3.0-or-later](https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg)](LICENSE)

GitHub Action that walks a directory of **prompt-provenance** documents, counts by approval state, surfaces governance gaps, posts a Markdown summary as a PR comment, and **fails the build** when any high-severity finding is present.

Wraps [`prompt-provenance-fleet-summary`](https://github.com/mizcausevic-dev/prompt-provenance-fleet-summary) — same finding logic, vendored into the action for self-contained execution.

Third in the action family (completes a trio for the per-protocol fleet-summaries):

- [`agent-card-fleet-summary-action`](https://github.com/mizcausevic-dev/agent-card-fleet-summary-action) — A2A AgentCards
- [`mcp-tool-card-fleet-summary-action`](https://github.com/mizcausevic-dev/mcp-tool-card-fleet-summary-action) — MCP Tool Cards
- **`prompt-provenance-fleet-summary-action`** — prompt-provenance docs

Part of the [Kinetic Gain Suite](https://suite.kineticgain.com/).

---

## Usage

```yaml
name: Prompt registry governance
on:
  pull_request:
    paths: ["prompts/**"]

jobs:
  fleet-summary:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: mizcausevic-dev/prompt-provenance-fleet-summary-action@v0.1-shipped
        with:
          prompts-dir: prompts/
          fail-on-high: true   # default
```

## Inputs

| input            | required | default       | description |
|---|---|---|---|
| `prompts-dir`    | ✓        | —             | Directory containing `*.json` prompt-provenance documents. |
| `comment-on-pr`  |          | `auto`        | `auto` posts only on `pull_request` events; `true`/`false` force the behavior. |
| `fail-on-high`   |          | `true`        | Fail the run when any high-severity finding is present. |
| `github-token`   |          | `${{ github.token }}` | Token used to post the PR comment. |

## Outputs

| output              | description |
|---|---|
| `total-prompts`     | Number of provenance documents analyzed. |
| `high-findings`     | Count of high-severity findings. |
| `approved-count`    | Number of approved prompts in the fleet. |
| `deprecated-count`  | Number of deprecated prompts in the fleet. |

## What it flags

| Code | Severity | Rule |
|---|---|---|
| `approved-without-evaluations` | 🔴 | Approved prompt has no evaluations recorded. |
| `approved-without-reviewer` | 🔴 | Approved prompt has no reviewers in `authorship.reviewed_by`. |
| `evaluation-failing-on-approved` | 🔴 | Approved prompt has at least one failing evaluation. |
| `missing-out-of-scope-on-approved` | 🟠 | Approved prompt declares no `intent.out_of_scope` items. |
| `approved-without-policy` | 🟠 | Approved prompt has no `approval.policy_uri`. |
| `single-reviewer` | 🟠 | Approved prompt has only one reviewer. |
| `deprecated-still-referenced` | 🟠 | Deprecated prompt still has passing evals — consumers haven't migrated. |
| `weak-eval-coverage` | 🟡 | Only one evaluation suite — recommend ≥ 2 independent suites. |
| `missing-models-supported` | 🟡 | Approved prompt declares no `intent.models_supported`. |
| `missing-content-uri` | ℹ️ | `prompt.content_uri` is not set. |

## Composes with

- [**`prompt-provenance-fleet-summary`**](https://github.com/mizcausevic-dev/prompt-provenance-fleet-summary) — the library this wraps.
- [**`prompt-provenance-spec`**](https://github.com/mizcausevic-dev/prompt-provenance-spec) — the schema this reads.
- [**`prompt-provenance-stamp`**](https://github.com/mizcausevic-dev/prompt-provenance-stamp) · [**`prompt-provenance-diff`**](https://github.com/mizcausevic-dev/prompt-provenance-diff) · [**`prompt-provenance-readme-generator`**](https://github.com/mizcausevic-dev/prompt-provenance-readme-generator) · [**`prompt-provenance-graph`**](https://github.com/mizcausevic-dev/prompt-provenance-graph) — full prompt-provenance tool family.
- [**`agent-card-fleet-summary-action`**](https://github.com/mizcausevic-dev/agent-card-fleet-summary-action) · [**`mcp-tool-card-fleet-summary-action`**](https://github.com/mizcausevic-dev/mcp-tool-card-fleet-summary-action) — sibling Actions.

## License

[AGPL-3.0-or-later](LICENSE)
