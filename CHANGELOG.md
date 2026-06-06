# Changelog

All notable completed changes to this project are recorded here.

## Unreleased

### Added

- `docs/dogfood/` case studies: `case-cursor-heavy.md`, `case-node-monorepo.md`, `case-sindresorhus-is-plain-obj.md` (each documents detect / plan / apply run ids and SHA conclusions).
- `scripts/dogfood-capture.mjs` — maintainer helper to reproduce golden HRP round-trips in tmpdir.
- `scripts/dogfood-oss-roundtrip.mjs` — minimal record+apply on an external clone after detect.
- GitHub Actions workflow `.github/workflows/smoke.yml` — runs `npx tsx scripts/smoke-suite.mjs` on push/PR.
- `claude-mcp` golden HRP fixture; Part 3 now verifies HRP apply round-trips for `minimal-repo`, `cursor-heavy`, `claude-mcp`, and `node-monorepo`.
- `DESIGN.md` support for `/harness-init`: conditional 设 · Design root-truth target plus `templates/DESIGN.md` and skill scaffold for product, visual, interaction, brand, or DX design systems.

### Changed

- `/harness-init` user path is now agent-native: Phase 1 grounds by reading repo files, Phase 5 writes confirmed Drafts directly, and users no longer need Node.js/npm/npx/tsx.
- TypeScript detector / HRP / apply scripts are now documented as maintainer smoke, dogfood, and regression tools rather than user onboarding dependencies.
- `scripts/smoke-suite.mjs` now includes a static guard that fails if the user-facing `harness-init` skill routes onboarding through Node detector/apply scripts again.
- `harness-init` skill now guards real-run UX regressions: no default full Draft dump, no plugin skill leakage into target skill indexes, no generic empty steering file, and no YAML frontmatter in root Markdown files.
- `ROADMAP.md` slimmed to open work and expansion gates; history lives in CHANGELOG.
- `README.md` / `.claude/instructions.md` / `docs/agent-triggering.md`: user path is IDE + SKILL; maintainer-only script wrappers documented in CONTRIBUTING.
- `.claude/commands/harness-init.md` is a thin pointer to `harness-init` SKILL (single source of truth).

### Removed

- `.claude/skills/answer-me/` and `.claude/skills/grill-me/` (retired with v2 Plan Quality Gate; use SKILL Phase 3 self-checks instead).

### Notes

- `scripts/harness-record-plan.mjs` and `scripts/harness-apply.mjs` remain **maintainer convenience** wrappers around `runInitRecordPlan` / `runInitApplyFromPlan` (v2.0.0 removed them as the *product* apply path, not as optional scripts).

## v2.0.0 - 2026-05-27

### Added

- **agent-as-writer rewrite (Phases 1–5)**: The IDE_Agent is now the writer. Phases 2–4 are agent-driven (read, judge, draft); Phase 5 writes the exact bytes the user confirmed via a Hash-Recorded Plan (HRP). No template-only bytes, no machine-built plan, no machine-driven merge.
- `templates/auto-detect/hash-recorded-plan.ts` — HRP types (`HashRecordedPlan`, `HashRecordedEntry`, `SkippedEntry`), `validateHashRecordedPlan`, `computeContentSha256`.
- `templates/auto-detect/apply-from-plan.ts` — `runInitApplyFromPlan`: reads HRP, writes entries verbatim, continues past per-entry failures, persists `result.json`.
- `scripts/harness-detect.mjs` — thin wrapper around `runInitDetect` for Phase 1.
- `scripts/property-generators.mjs` — hand-written seeded generators (`genHashRecordedPlan`, `genTmpdirState`, `genFailureInjector`) for the property suite.
- Nine property tests + five example/static checks in `scripts/smoke-suite.mjs` covering HRP schema invariants, marker-content invariants, apply round-trip, continue-past-failure, backup preservation, no-HRP-no-write, old-run-dir tolerance, detector-free apply path, and no-LLM-vendor imports.
- `.claude/skills/harness-init/scaffolds/` — four style-reference files salvaged from the retired generators.

### Changed

- `.claude/skills/harness-init/SKILL.md` rewritten for the v2 five-phase flow: Detect → Read → Judge & Write Drafts → Show & Confirm → Apply. Includes `Read_Budget` (30 files / 200 KB), `Per_File_Action` decision tree, six-name marker allowlist, `Sanity_Floor` self-check, Anti-Patterns table, and HRP recording contract.
- `templates/auto-detect/run-contract.ts` — `RUN_SCHEMA_VERSION` bumped to `'2.0.0'`; added `ApplyResultV2`, `WrittenEntry`; removed `ExitCode.PLAN_DRIFT_DETECTED` (was 7), `comparePlanChanges`, `summarizePlanDrift`, `PlanDrift`, `PlanComparisonResult`, `PlanDriftKind`.
- `templates/auto-detect/init-pipeline.ts` — exports only `runInitDetect` and `runInitApplyFromPlan`; removed `runInitPlan`, `runInitApply`, `runInitVerifyAndApply`.
- `templates/auto-detect/installer.ts` — slimmed to backup/rollback only (`createBackup`, `pruneBackups`, `rollbackLatestBackup`, `rollbackLastApply`); all plan/apply/install/generator/reporter imports removed.
- `scripts/smoke-suite.mjs` — rewritten as detection-only fixture loop + property/example suite.
- `.claude-plugin/plugin.json` — version `2.0.0`; skills list reduced to `harness-init` only.
- `.claude-plugin/marketplace.json` — version `2.0.0`; description updated for HRP/agent-as-writer flow.

### Removed

- **BREAKING**: `runInitPlan`, `runInitApply`, `runInitVerifyAndApply`, `PlanDriftError` from `init-pipeline.ts`.
- **BREAKING**: `createPlan`, `applyPlan`, `install`, all generator/reporter/merge-engine symbols from `installer.ts`.
- `templates/auto-detect/generators/` directory (all generators: `agents.generator.ts`, `claude.generator.ts`, `steering.generator.ts`, `cursor.generator.ts`, `base-generator.ts`, `index.ts`, `recommendations.ts`).
- `templates/auto-detect/merge-engine.ts`.
- `templates/auto-detect/reporters/` directory (`diff-reporter.ts`, `summary-reporter.ts`).
- `scripts/harness-apply.mjs`, `scripts/harness-dry-run.mjs`.
- `ExitCode.PLAN_DRIFT_DETECTED` (exit code 7).

### Migration

- Existing `.harness/runs/<old-id>/` directories are ignored by the new flow; they remain on disk for audit but are not consumed.
- Existing marker pairs (`WORKFLOW_HOOKS`, `SKILL_INDEX`, etc.) are honoured by the agent's `patch-section` action.
- Re-run `/harness-init` to migrate to the v2 flow. No data migration is needed.

### Added

- **M2 — Plan narration**: `runInitPlan` now produces a structured `PlanNarration` (headline + signals + per-change evidence) on `PlanResult` and persists it in `plan.json` and `summary.md`. The IDE Agent uses the headline as the first line of the Phase 3 Confirm prompt so the user sees *why* changes are proposed without exposing the file-by-file plan. `RecommendationSummaryItem.evidence` now carries the detection signals that triggered each bundle recommendation.
- **M3 — Run contract versioning**: `docs/run-contract.md` now carries an explicit `Run Contract Version: 1.0` header, distinct from the `RUN_SCHEMA_VERSION` artifact-shape constant. Every bundle pins the run contract version it implements.
- **M3 — Phase Capability Matrix**: `docs/bundles/{claude-code,codex-cli,cursor,gemini-cli,opencode}.md` each carry a per-phase coverage table (grounding / planning / implementation / verification / reporting), distinct from the existing tool capability table.

### Changed

- `RUN_SCHEMA_VERSION` bumped from `1.0.0` to `1.1.0` (added `narration` field to plan artifacts; existing readers ignore the new field safely).
- `docs/bundles/README.md` distinguishes *Phase Capability Matrix* (behavior coverage) from *Tool Capability Matrix* (underlying tools available); standard bundle shape now requires both, plus a pinned run-contract version.
- `.claude/commands/harness-init.md` Phase 3 prompt allows an optional one-line narration sourced verbatim from `plan.narration.headline` while keeping the file-by-file plan hidden by default.
- `.claude/skills/harness-init-plan/SKILL.md` Confirm context shape now carries a `Narration:` field.
- Maintainer-only documentation moved out of the distributed `docs/` tree into `internal/` (gitignored, not bundled with the plugin): `reviews/`, `review-alignment.md`, `review-decision-matrix.md`, `documentation-convergence-checklist.md`, `documentation-inventory.md`. The `docs/` tree now contains only contract-surface documentation that the plugin distribution should carry.
- `docs/references.md`, `docs/architecture.md`, `docs/run-contract.md`, `docs/best-practices.md`, `CONTRIBUTING.md` updated to point at the new `internal/` location and to flag that internal materials are maintainer-only.
- `OpenSpec/plugin-init-ai-driven.md` and `OpenSpec/architecture-4-role-memory-loop.md` reference paths updated to `internal/reviews/...`.

### Removed

- Stale build/cache artifacts checked into the workspace: `coverage/` (vitest output), `detected-report.json`, `detected-tools.json` (legacy detector outputs, now produced under `.harness/runs/`), `templates/auto-detect/fixtures/minimal-repo/.harness/` (smoke-init leftover), empty `tests/` directory.
- `scripts/accept-init.mjs` — fixture-only acceptance script, superseded by `scripts/harness-apply.mjs`.

## v1.0.1 - 2026-05-22

### Added

- `scripts/harness-apply.mjs` — full detect/plan/apply pipeline runner for an arbitrary target repo. `/harness-init` Phase 4 now has a clean public entrypoint instead of fixture-only `accept-init.mjs`.
- `.claude/skills/{harness-init-plan,answer-me,grill-me}/SKILL.md` are now tracked in version control. The C2.5 Plan quality gate is part of the v1.0 distribution.

### Changed

- `.claude/commands/harness-init.md` Phase 1 now uses `npx tsx scripts/harness-dry-run.mjs` (bare `node` fails because `init-pipeline.ts` re-exports TypeScript modules).
- `.claude/commands/harness-init.md` Phase 4 now invokes `scripts/harness-apply.mjs` instead of asking the Agent to apply files manually from `plan.json`.
- `templates/AGENTS.md` and `templates/CLAUDE.md` updated to describe Harness as an IDE plugin + `/harness-init`, replacing residual "智能 setup" / "安装或 setup 阶段" wording from the npm/CLI era.

### Removed

- `templates/adapters/cursor/**` (rules + commands) — static Cursor adapter files that still referenced terminal `harness detect/plan/apply`. The Cursor mirror is generated dynamically by `templates/auto-detect/generators/cursor.generator.ts` into `.cursor/commands/harness-init.md` when Cursor is detected.
- `generateCursorDetectCommandTemplate` and `generateCursorSetupCommandTemplate` (cursor.generator.ts) — dead exports referencing the removed terminal CLI.

## v1.0.0 - 2026-05-22

### Added

- Plan quality gate skills: `harness-init-plan`, `answer-me`, and `grill-me`. The Agent resolves Plan doubts internally before minimal user confirmation.
- `OpenSpec/plugin-init-ai-driven.md` and `docs/capabilities/{detection,generation,apply}.md`.
- `.claude/commands/harness-init.md`; Cursor generator emits `harness-init.md` instead of the detect+setup pair as primary onboarding.
- Optional `scripts/smoke-init.mjs` (run via `npx tsx`, not part of an npm package).

### Changed

- Plugin skill registration now explicitly lists `.claude/skills/*` instead of the broad `./templates` path.
- `/harness-init` docs make Plan details internal by default and keep Confirm as the user-visible authorization gate.
- Root `AGENTS.md` facts updated for the C2.5 Plan quality gate and current command/skill paths.
- Cursor init generation uses the internal Plan quality gate in generated command/rule text.
- Product narrative: **AI-driven IDE init** via `/harness-init` (detection + generation + confirmed apply).
- **Init zero CLI**: `init-pipeline.ts` calls detector/installer directly; `/harness-init` needs no `npm run build` and there is no `dist/`.

### Removed

- **BREAKING**: npm package surface (`package.json`, `package-lock.json`, `.npmignore`) and terminal CLI (`cli.ts`). Distribution is Git + IDE plugin only; see OpenSpec §7–§8.
- `tests/` (vitest); verification is IDE `/harness-init` on fixtures.
- Installer: removed terminal inquirer prompts; apply confirmation is IDE/chat only.
- MCP productivity bundle and MCP recommender branch from user onboarding docs.
- `OpenSpec/architecture-4-role-memory-loop.md` marked as out of product scope.

### Documentation

- OpenSpec §4.1–4.2 documents the old subprocess CLI vs `init-pipeline`, and clarifies that `dist/`/`node_modules/` are optional local dirs (gitignored, safe to delete).

## Pre-1.0 documentation rebuild

### Changed

- Reoriented protocol-first documentation (`docs/run-contract.md`, architecture).
- Cancelled `OpenSpec/feature-add-detector-langchain.md` per architecture direction lock.
- Added `README.md` as the root entry point for the review-approved protocol-first direction.
- Rebuilt `CONTRIBUTING.md` so contribution rules enforce review alignment, convergence checks, and protocol-first boundaries.
- Rebuilt the documentation system around the review-approved protocol-first direction.
- Added `docs/review-alignment.md` to turn CEO/Product, Design, Engineering, and DX review direction into explicit documentation pass/fail standards.
- Rewrote `docs/architecture.md` to define `harness-coding-protocol` as a harness-first coding protocol rather than a prompt collection.
- Rewrote `docs/run-contract.md` as the authoritative behavior contract for grounding, planning, implementation, verification, and reporting.
- Rewrote `docs/tool-adaptation.md` to define adapter capability mapping and explicit degradation rules.
- Rewrote `docs/best-practices.md` as concise MUST/SHOULD/AVOID operating rules.
- Rewrote `docs/references.md` as a navigation index rather than a duplicate source of rules.
- Added `docs/review-decision-matrix.md` to trace review findings into documentation changes.
- Added `docs/reviews/README.md` to define how CEO/Product, Design, Engineering, and DX review lenses become documentation changes.
- Added `docs/documentation-convergence-checklist.md` to make future convergence passes auditable.
- Added `docs/documentation-inventory.md` to track rebuilt docs, probed missing paths, and remaining filesystem enumeration work.
- Rebuilt `docs/bundles/README.md` to define bundle responsibilities, maintained bundle docs, capability matrix expectations, and deletion rules for stale bundle content.
- Added standard bundle docs for Claude Code, Codex CLI, Cursor, Gemini CLI, and OpenCode.
- Rebuilt `ROADMAP.md` as future work only, with review-driven sequencing.

### Removed

- Legacy documentation framing that treated the project as a generic prompt library, template collection, or tool-specific guide.
- Compatibility-style preservation of concepts that conflict with the review direction.
