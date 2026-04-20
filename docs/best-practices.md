# Best Practices

## Use Root Truth Sparingly

- Keep `AGENTS.md` factual and current
- Keep `CLAUDE.md` concise and policy-focused
- Put scoped exceptions in `steering/*.md`
- Avoid copying the same rule into multiple places unless there is a clear compatibility reason

## Prefer Safe Changes

- Use preview or dry-run output before writing
- Prefer incremental merge over overwrite
- Keep backups or rollback paths available when changes touch user-owned configuration
- Treat third-party installs as opt-in recommendations, not default behavior

## Keep Tool Boundaries Clear

- Root truth is the source of record
- Tool-private mirrors are compatibility surfaces
- Recommendation bundles describe good combinations, not mandatory dependencies
- Any smart-mode feature should be explained as bounded and reversible

## Document What the Repo Already Knows

- Capture actual repository structure, commands, and conventions in the root truth files
- Document supported tool signals in `docs/tool-adaptation.md`
- Document the architecture in `docs/architecture.md`
- Keep bundle definitions focused on outcomes and boundaries, not hype

## Operational Habits

- Update docs when the repository layout changes
- Remove stale wording when a capability moves from planned to shipped
- Keep the public narrative aligned with the implementation boundary
- If a feature is only available in a downstream integration, say so directly

