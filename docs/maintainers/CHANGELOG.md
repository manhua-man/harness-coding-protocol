# Changelog

## Unreleased

### Changed

- 2026-10-27 — Register the incremental-maintenance and human-doc commands in the plugin manifest. A native Claude Code session loaded the installed plugin but omitted these two commands from its actual slash-command catalog; the init and steward entries already come from registered skills. Document Claude Code's namespaced invocation to distinguish this plugin from global aliases. Native generation validation is tracked separately from command discovery because the configured default model was unavailable.

- 2026-10-27 — Make `templates/` the single source for root-entry templates and adapters. Init reads it directly; remove the duplicate AGENTS, CLAUDE, and DESIGN scaffolds and move the unique Cursor pair and conditional steering template into it. Preserve source-evidence precedence in the CLAUDE template, replace copied Cursor sample facts with grounding instructions, and align Cursor routing with task-scoped reads. Update both README languages and maintainer ownership/checks. Validation: init skill quick validation, 62 local links, 6 heading anchors, all five static contracts, five registered skill paths, and diff whitespace checks pass. An isolated agent run on a Python CLI with Cursor configuration made no writes before the simulated confirmation, then applied four confirmed drafts with read-back equality; DESIGN, generic steering, and duplicate feature docs were skipped. This is local agent evidence, not installed-plugin discovery or real Cursor/Claude host verification; those probes were not run.

- 2026-10-21 — Establish engineering rule ownership across the default CLAUDE mold, synchronized init scaffold, and generation checks: five core principles with individual subheadings, requirement/simplification gates, completion boundaries, and proportional verification. Move optional detailed methods to the existing M5 reference; scope state/data recovery and Karpathy examples to actual contracts. Adopt core sections for plugin maintenance through CONTRIBUTING and update README, steering index, steward checks, and real-IDE smoke probes. No project-specific migration, auth, or batch-performance policy is installed by default. Validation: both changed skills pass quick validation; 58 local link targets and 3 heading anchors resolve; all five static contracts, plugin skill paths, mold/scaffold required-block parity, and diff whitespace checks pass. Real IDE generation and behavioral probes have not been run; generated behavior remains unverified.

- 2026-10-21 — Add `--audit-corpus` routing across update-docs, documentation-architecture, and public indexes. Retain full-text corpus auditing, bidirectional code/document inventory, completed-plan retirement, and deliverable checks while making coverage, examples, historical retention, approvals, and validation proportional to the requested scope. Distinguish internal configuration preservation from external credential sharing. Integrate upstream plugin skill registrations, dual-axis guidance, and the optional layout checker; document its limitations. Validation: both edited skills pass quick validation; all 45 local links in changed files resolve; all five static contracts, plugin skill paths, and diff whitespace checks pass. Real IDE behavior probes were not run; runtime behavior remains unverified.

- Add evidence-backed feature catalog generation to init, feature/result consistency assessment to steward, and affected-owner synchronization to update-docs. Restore the declared documentation-architecture skill with a shared contract and adaptable catalog/page assets; preserve existing ownership and project-specific evidence retention. Root molds route to detailed feature owners without copying volatile status.

- `templates/CLAUDE.md` and init scaffold: add **Precise and Relaxed** (精准且宽松) — scope read/review/test/edit to task risk; precise on contracts/invariants/implementation detail; relaxed on unrelated pre-read and full-suite tests; consolidate Completion friction/testing bullets under it.
- Add `Communication` section to `templates/CLAUDE.md` and init scaffold (conclusion-first, direct disagreement, no hypothetical disclaimers); soften default list/table preference.
- Gate tiering in `templates/AGENTS.md` (mandatory / user-invoked ops / on-demand); `templates/CLAUDE.md` Specialized Tool Gates example table; init anti-bloat for frozen planning prose in AGENTS; steward Gates audit axis.
- `harness-init`: skill discovery quality contract, subtraction signals for existing root truth, communication habits in required conceptual blocks.
- M4 steward: skill description budget (~200 target, ~300 flag); plugin command/skill descriptions shortened; CONTRIBUTING dogfood rule for short frontmatter.
- `REFERENCES.md`: community practice section for subtract-first and skill description diet.
- M1 contract: task-scoped entry reading, routing-not-recipes `AGENTS.md`, completion/approval boundaries and skill precedence in `CLAUDE.md`; remove blanket "read both every session" and "Context First".
- M4 steward: mandatory autonomy & friction audit (reading, testing, approval, completion, skills, duplication); discovery includes repository-owned skills/commands.
- M3 `/revise-ai-docs`: dedupe/merge/delete before add; route safe autonomous zones and targeted validation to AGENTS.
- README M1/M4 descriptions updated for always-on constraints and friction audit.
- Add `docs/maintainers/REFERENCES.md` (external source bibliography only; with CHANGELOG in `docs/maintainers/`).
- Rewrite root `README.md` around M1–M5 capability modules instead of repository directory structure.
- Collapse `docs/maintainers/` to `CHANGELOG.md` only; merge maintainer rules, smoke probes, roadmap, and capability notes into `CONTRIBUTING.md`.
- Add Ablation Verification (消融推演) to the opt-in M5 mold as the operating procedure for Counterfactual Deletion: after a first draft, inline or delete the extra layer if core logic and tests still hold and there is no real polymorphism.
- Rewrite `pipeline-quality-audit` around detect → repair/retry/fallback → quarantine/diagnose → terminal non-delivery, removing project incident dumps and generic hard-rejection doctrine.
- Make always-on protocol prioritize correctness, explicit authorization, user-owned data, and complexity that is justified by observed recurring work.
- Add opt-in stateful-operation guidance for idempotent install, path-independent artifact identity, short recoverable units, cancellation, clean, automatic GC, and scoped writers; `/harness-init` suggests it only from repository evidence.
- Require `/revise-ai-docs` and the docs steward to prove recurrence, future decision value, and net simplicity before promoting a learning into durable rules.
- Preserve the full Facts (事) / Protocol (法) / Design (设) division and layered model as required `/harness-init` output concepts rather than optional style hints.
- Split `AGENTS.md` tool routing into repository-owned tools and explicitly labelled recommended external/global tools.
- Move M5 to an opt-in, reference-only steering mold at the same level as Karpathy examples; replace mandatory RIPER mode declarations with a risk-tiered RIPER Gate in core protocol.
- Keep `templates/` as full human-readable reference molds while removing plain-Markdown frontmatter conflicts and the whole-document fence around `karpathy-examples.md`.
- Allow the docs steward to maintain confirmed `/harness-init` outputs before their first git commit while preserving unknown untracked files.
- Rename the docs steward skill metadata key from `tools` to the valid `allowed-tools` field.
- Allow `/revise-ai-docs` to create an explicitly approved, project-adapted, reference-only steering file without auto-copying generic examples.
- Move duplicated inline scaffold bodies out of `harness-init/SKILL.md`; the skill now routes to the standalone scaffold files.
- Add the `documentation-architecture` skill for lifecycle-aware human-doc inventory, ownership convergence, migration, and relative-link validation without imposing a preset directory tree.

## 2.5.0 — 2026-07-16

### Changed

- `/update-docs` (`ai-ide/commands/update-docs.md`): add **doc-governance rules** (generic norms only):
  1. single source of truth + split by duty  
  2. prefer update over create; current line only  
  3. align with implementation; tight scope  
  4. precise and brief (no preach / no double restatement)  
  5. do not rewrite existing sensitive config presentation without user request  
  6. conflict order: user turn > code/`AGENTS.md` > mainline human truth > archive  
- Writing layout table tightened; task/output mention governance and de-duplication.
- Path-association note: optional mapping tables stay in the **target repo**, not in this protocol command.

### Not included

- Domain-specific truth sources (identity fields, project path maps, stage roadmaps) — those belong in each app repo’s `docs/` / steering.

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
