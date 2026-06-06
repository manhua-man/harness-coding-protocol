# Dogfood Report: cursor-heavy fixture @ 2026-05-27

## Your setup

- IDE: Maintainer workflow (headless round-trip + v2 pipeline; equivalent to Claude Code `/harness-init`)
- Plugin version: v2.0.0 (local `harness-coding-protocol`)
- Target repo: `templates/auto-detect/fixtures/cursor-heavy` (in-repo fixture; models Cursor-heavy monorepo)
- Target repo commit: same as plugin repo `main` at report date

## Run artifacts (trust loop)

Captured in a **tmpdir copy** of the fixture (source tree not modified). Artifacts live under `<tmpdir>/.harness/runs/<run-id>/`.

| Phase | Run ID |
| --- | --- |
| Phase 1 — Detect | `20260526-223525-60c347` |
| Phase 4 — Record Plan (HRP) | `20260526-223525-e4cd6b` |
| Phase 5 — Apply | `20260526-223525-21c688` |

Reproduce IDs (golden HRP + `runInitRecordPlan` / `runInitApplyFromPlan`):

```bash
npx tsx scripts/dogfood-capture.mjs cursor-heavy
```

## What happened

### Detection

- Repo shape detected: `monorepo`
- Stacks / frameworks: `node`; `react`, `vite`
- AI tool traces: `cursor`, existing thin `rootTruth` (minimal `AGENTS.md` / `CLAUDE.md`)
- Was detection accurate? **Y** — matches fixture layout (workspaces, Vite app, `.cursor/rules/main.mdc`, `.cursorrules`).

### Agent drafting

- Files proposed: `AGENTS.md`, `CLAUDE.md`, `steering/harness-recommendations.md`, `.cursor/rules/harness.mdc`, `.cursor/commands/harness-init.md`
- Actions chosen: **overwrite** on existing root truth (no harness-managed sections yet), **create** on steering + Cursor pair
- **patch-section vs overwrite**: This fixture has **no** harness-managed `##` sections in root files, so v2 rules allow **overwrite** (not `patch-section`). User-owned `.cursor/rules/main.mdc` is outside the four Root_Truth targets and was not touched. A **second** init after sections exist should prefer `patch-section` inside those sections only.

### Confirmation

- Were you asked only one yes/no? **Y** (simulated: golden summary applied after single consent)
- Did the summary give you enough info? **Y** — one line per path with action + evidence

### Apply

- Did apply succeed? **Y** — `applied: 5`, `failed: 0`, `backedUp: 0`
- Any SHA-256 divergences? **N** — all five `writtenEntries` had `actualSha256 === intendedSha256`
- Were final files expected? **Y** — verbatim golden HRP bytes on disk

## What worked well

- Cursor pair created only when Cursor traces are present (detector signal `cursor`).
- Phase 5 did not re-run detection or rebuild the plan; run ids above chain detect → plan → apply.

## What was confusing or wrong

- First-time init on thin root files feels like “overwrite” even though the product story emphasizes `patch-section`; the Per_File_Action table is correct but worth stating in the summary line.

## Suggestions

- In Phase 4 summary, add one clause when action is `overwrite` because harness-managed sections are absent (“first harness init on this file”).
