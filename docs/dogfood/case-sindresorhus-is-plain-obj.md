# Dogfood Report: sindresorhus/is-plain-obj @ 2026-05-27

## Your setup

- IDE: Maintainer workflow (detect + HRP record + apply on shallow clone)
- Plugin version: v2.0.0 (local)
- Target repo: https://github.com/sindresorhus/is-plain-obj (external OSS; maintainer does not own)
- Target repo commit: `97f38e8836f86a642cce98fc6ab3058bc36df181` (at clone time)

## Run artifacts (trust loop)

Clone path (ephemeral): `%TEMP%/harness-dogfood-oss-*`. Artifacts under `.harness/runs/` in that clone.

| Phase | Run ID |
| --- | --- |
| Phase 1 — Detect | `20260526-223535-697919` |
| Phase 4 — Record Plan (HRP) | `20260526-223553-9ddc0c` |
| Phase 5 — Apply | `20260526-223553-4abcb1` |

Phase 1:

```bash
git clone --depth 1 https://github.com/sindresorhus/is-plain-obj <tmpdir>
npx tsx scripts/harness-detect.mjs <tmpdir>
```

Phases 4–5 used maintainer script `scripts/dogfood-oss-roundtrip.mjs` with agent-style **create** drafts (not a full IDE read/judge pass). Re-run apply verification:

```bash
npx tsx scripts/dogfood-oss-roundtrip.mjs <tmpdir> <detect-run-id>
```

## What happened

### Detection

- Repo shape: `single-package`
- Stacks: `node`
- Frameworks: (none)
- Commands: `test` → `npm run test`
- AI tool traces: none; `rootTruth: false`
- Accurate? **Y** for this tiny library repo.

### Agent drafting

- Proposed: create `AGENTS.md`, `CLAUDE.md`, `steering/harness-recommendations.md`
- Skipped: Cursor pair (no Cursor trace)
- Full Phase 2 Read_Budget pass was **not** executed in this capture — drafts are minimal dogfood scaffolds aligned with detection facts only.

### Confirmation

- One yes/no? **Y** (maintainer consent before record/apply)
- Summary: three create lines with evidence tied to `rootTruth: false`

### Apply

- Success? **Y** — `applied: 3`, `failed: 0`
- SHA-256 divergences? **N** — `shaAllMatch: true` on all entries

## What worked well

- External repo with no existing harness files: detect → HRP → apply chain works without fixture sugar.
- Confirms G2 requirement: evidence outside owned fixtures.

## What was confusing or wrong

- This run is **not** a substitute for a full IDE `/harness-init` with Read → Judge → Draft; prose quality was not evaluated.

## Suggestions

- Repeat on the same repo inside Claude Code with Read_Budget and compare draft depth to this minimal scaffold.
