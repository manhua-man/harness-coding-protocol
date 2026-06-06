# Dogfood Report: node-monorepo fixture @ 2026-05-27

## Your setup

- IDE: Maintainer workflow (headless round-trip + v2 pipeline)
- Plugin version: v2.0.0 (local)
- Target repo: `templates/auto-detect/fixtures/node-monorepo` (pnpm + turborepo monorepo fixture)
- Target repo commit: same as plugin repo `main` at report date

## Run artifacts (trust loop)

Captured in a **tmpdir copy** of the fixture.

| Phase | Run ID |
| --- | --- |
| Phase 1 — Detect | `20260526-223525-43aa90` |
| Phase 4 — Record Plan (HRP) | `20260526-223525-471c83` |
| Phase 5 — Apply | `20260526-223525-facefa` |

Reproduce:

```bash
npx tsx scripts/dogfood-capture.mjs node-monorepo
```

## What happened

### Detection

- Repo shape detected: `monorepo`
- Stacks / frameworks: `node`; `express`, `react`, `vite`
- Commands surfaced: `dev`, `build`, `test`, `lint`, `typecheck` (from root `package.json` / workspace)
- AI tool traces: none (no `.claude/`, `.cursor/`, MCP config)
- Was detection accurate? **Y** — consistent with fixture README expectations.

### Agent drafting

- Files proposed: `AGENTS.md`, `CLAUDE.md`, `steering/harness-recommendations.md`
- Actions chosen: **create** on all three (no existing root truth)
- Cursor pair: **skip** — no Cursor detection signal
- Did drafts match expectations? **Y** for smoke/golden purposes (scaffold-level root truth, not full monorepo prose).

### Confirmation

- One yes/no? **Y** (simulated for golden round-trip)
- Summary sufficient? **Y**

### Apply

- Did apply succeed? **Y** — `applied: 3`, `failed: 0`
- SHA-256 divergences? **N** — three entries, all `actualSha256 === intendedSha256`
- Disk bytes matched HRP? **Y**

## What worked well

- Clean **create-only** path when `rootTruth: false` in detection summary.
- No spurious Cursor files without tool traces.

## What was confusing or wrong

- Golden content is intentionally short; a real IDE agent should expand AGENTS.md with workspace layout from `pnpm-workspace.yaml` / `turbo.json` under Read_Budget.

## Suggestions

- Dogfood next on a real turborepo OSS repo to stress command tables and package boundaries.
