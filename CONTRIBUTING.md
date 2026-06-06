# Contributing

Contributions must preserve the review-approved protocol-first direction of `harness-coding-protocol`.

This project is not a place for generic prompt advice, broad AI workflow essays, or separate tool-specific protocols. Contributions should strengthen the core run contract, improve adapter clarity, or make bundle adoption easier without duplicating the protocol.

## Before Changing Documentation

Maintainers with access to the source repository should consult the internal review-alignment, review-decision, and documentation-convergence materials under `internal/` (gitignored, not distributed with the plugin).

Identify which kind of change you are making:

- Protocol authority.
- Adapter or bundle note.
- Review or decision record.
- Future work.
- Completed history.
- Maintenance checklist.

If the change does not fit one of those categories, put it in an existing document or delete it.

## Documentation Rules

MUST:

- Keep one authoritative home for each rule.
- Delete or rewrite legacy framing that conflicts with review direction.
- Update `internal/review-decision-matrix.md` when introducing a new decision (maintainers only).
- Update `CHANGELOG.md` for completed documentation changes.
- Update `ROADMAP.md` only for future work.

SHOULD:

- Prefer concise, operational writing.
- Link to the authority instead of copying rules.
- Keep bundle content environment-specific.
- Make degraded behavior explicit when a tool lacks a capability.

AVOID:

- Describing the project as a prompt library or template pack.
- Adding examples before the run contract and adapter behavior are clear.
- Preserving rejected ideas as historical notes.
- Letting bundles define their own protocol.

## Verification (this repository)

There is **no** `package.json` and **no** vitest/jest test runner. User onboarding is agent-native and does not require Node.js. After changing `.claude/skills/harness-init/`:

1. Reload the plugin from this repo in your IDE.
2. Run `/harness-init` against a fixture under `templates/auto-detect/fixtures/`.
3. Confirm:
   - Phase 1 grounds itself by reading repo files; it does not ask the user to install Node/npm/npx/tsx.
   - Phase 4 summary has one line per Root_Truth_File with `path / action / evidence`; user is not interrupted before Phase 4.
   - No Root_Truth_File is written before confirmation.
   - After `yes`: only confirmed Root_Truth_Files are written.
   - Phase 5 does not re-ground or regenerate Drafts after confirmation.
   - For release-quality changes, score the run with [docs/benchmarks/agent-native-init.md](docs/benchmarks/agent-native-init.md).
4. If the change touches TypeScript under `templates/auto-detect/` or maintainer wrappers, run the headless smoke suite before opening a PR:

   ```bash
   npx tsx scripts/smoke-suite.mjs               # full suite (Parts 1–3)
   npx tsx scripts/smoke-suite.mjs --filter cursor-heavy  # one fixture (Part 1 only)
   ```

   Maintainer detector smoke can be exercised against any path with:

   ```bash
   npx tsx scripts/harness-detect.mjs <path>
   ```

   Minimal maintainer E2E in a tmpdir (detect → record → apply): `npx tsx scripts/smoke-init.mjs`.

### Maintainer script wrappers (not user onboarding)

| Script | Maps to |
| --- | --- |
| `scripts/harness-detect.mjs` | `runInitDetect` |
| `scripts/harness-record-plan.mjs` | `runInitRecordPlan` (stdin or `--file`) |
| `scripts/harness-apply.mjs` | `runInitApplyFromPlan` |

Agents following [`.claude/skills/harness-init/SKILL.md`](.claude/skills/harness-init/SKILL.md) should not require the TypeScript API, Node.js, npm, npx, or tsx for user onboarding. The `.mjs` files exist for smoke, dogfood, and manual debugging.

Fixture trees under `templates/auto-detect/fixtures/*/`: use `/harness-init` in the IDE for the user path, or `harness-detect.mjs` for maintainer detector-only checks.

Distribution is **Git + IDE**; any AI agent with file read/write + shell can run the flow. Do not document `npm install` for end users.

PRs touching `init-pipeline.ts`, `apply-from-plan.ts`, or `hash-recorded-plan.ts` must run the full `smoke-suite.mjs` (Parts 1–3).

### v2 E2E 检查表（发布门禁）

| # | 检查项 | 验证方式 |
| --- | --- | --- |
| 1 | Phase 1 agent grounding 不要求 Node/npm/npx/tsx | IDE fixture run |
| 2 | Phase 3 agent draft 通过 Sanity_Floor / Section_Boundary / Empty_Draft | SKILL.md 内置检查 |
| 3 | Phase 4 只展示一行一个文件的摘要并等待 `yes/no` | IDE fixture run |
| 4 | Phase 5 只写 confirmed Root_Truth_Files | IDE fixture run |
| 5 | Phase 5 写后 re-read，发现 mismatch 必须报告 | IDE fixture run / manual check |
| 6 | 维护者 HRP golden round-trip：4 个 fixture 的 plan.json → apply → 磁盘字节一致 | Part 3 |
| 7 | 维护者 Property suite 通过 | Part 2 |
| 8 | 分布式文件（排除 `internal/` 和 `CHANGELOG.md`）无 v1 残留 | `grep -rn "createPlan\|applyPlan\|runInitPlan\|merge-engine\|generators/"` |
| 9 | `runInitApplyFromPlan` 源码无 `detect()` 调用、无 generators 导入 | Property 8 |

## Code And Tooling Changes

Code changes must preserve the same run-contract principles:

- Ground in the repository before editing.
- Keep changes scoped.
- Preserve unrelated user work.
- Verify with the strongest practical checks.
- Report skipped checks honestly.

If a code or tooling change creates a new behavior obligation, update `docs/run-contract.md` or `docs/tool-adaptation.md` in the same change.

## Review Checklist

Before considering a contribution complete:

- The change passes the standards in `internal/review-alignment.md` (maintainers only).
- The change passes `internal/documentation-convergence-checklist.md` (maintainers only).
- Any new bundle has a capability matrix.
- Any removed legacy concept is not reintroduced elsewhere.
- `CHANGELOG.md` and `ROADMAP.md` are not mixed.

If shell or link-check tooling is unavailable, record that limitation in the final report.
