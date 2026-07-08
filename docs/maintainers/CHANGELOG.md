# Changelog

## 2.4.0 — 2026-07-08

Lean plugin layout: user path is README + `ai-ide/` (AI IDE); maintainer notes live under `docs/maintainers/` only.

### Removed

- `scripts/`, `.github/workflows/`, `tsconfig.json`, `templates/auto-detect/`
- Root `AGENTS.md` / `CLAUDE.md` (output molds stay in `templates/`)
- Root `commands/` — merged into `ai-ide/commands/` (AI IDE folder)
- Renamed `.claude/` → `ai-ide/` (vendor-neutral AI IDE surface)
- Maintainer theory tree: `bundles/`, `run-contract.md`, `architecture.md`, and related indexes
- `docs/maintainers/dogfood/`, `benchmarks/`, redundant capability stubs

### Changed

- README: two-repo clarity, shared IDE install, bilingual
- Templates: 事/法 stack aligned with target-repo best practice
- Maintainer hub: `docs/maintainers/README.md` + `maintenance.md` + `entry-smoke-probes.md`
- `/harness-init`: optional Cursor adapter only; target repos choose command path
- Verification: IDE `/harness-init` on a target repo (see `CONTRIBUTING.md`)

## Earlier versions

Pre-2.4.0 release notes were dropped during this cleanup. For archaeology, see git history before the v2.4.0 squash commit.
