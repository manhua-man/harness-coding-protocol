# Tool Adaptation

## What Adaptation Means Here

Adaptation means mapping a repository's root truth to the tooling around it without letting tool-private files become the canonical source.

## Current Pattern

| Tool or surface | Role | Boundary |
|------------------|------|----------|
| Claude Code | Reads root truth and protocol | Do not treat its private files as the repository source of truth |
| Codex | Reads root truth and steering guidance | Keep generated recommendations previewable |
| Cursor | Uses root truth plus optional rules and command mirrors | Rules and commands must call the CLI and read artifacts, not recompute Harness logic |
| Kiro | Uses root truth plus optional mirrors | Mirrors are compatibility surfaces only |
| MCP tools | Provide integrations and context | Do not imply full lifecycle automation unless verified |

## Adaptation Rules

1. Start from root truth.
2. Detect tool-specific signals only after the root files are understood.
3. Recommend the smallest useful compatibility layer.
4. Keep the resulting change reversible.
5. Avoid automatic overwrite unless the user has explicitly chosen that path.

## What The Smart Layer Produces

- A detection summary
- A recommended bundle set
- A generated draft for the relevant files
- A clear diff or preview
- A merge decision that can be accepted, declined, or deferred
- Cursor command drafts for `harness detect` and `harness setup` when Cursor is detected

## Boundary Notes

- Auto-detect is implemented as a local first pass, not a promise to fully manage every third-party lifecycle
- Third-party workflows should be described as recommended options, not hidden dependencies
- If a tool only works via mirror files, that mirror still sits below root truth
- If a compatibility path is uncertain, the docs should say so instead of smoothing it over
- Cursor adapter files are a thin orchestration layer: they call `harness detect/plan/apply --json`, read `.harness/runs/<run-id>/`, and present saved artifacts to the user
