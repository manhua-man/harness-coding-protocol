# Dogfood Reports

This directory contains public case studies from running `/harness-init` against real repositories. Each report documents what happened, what worked, and what was confusing.

## What is dogfooding?

Dogfooding means running `/harness-init` on a real repo (not a synthetic fixture) to verify that grounding, drafting, confirmation, and apply produce sensible results in the wild. It answers: "Does the agent make good judgements about what to write?"

## How to run your own

1. Pick a repo you know well (ideally one you maintain).
2. Run `/harness-init` in your AI IDE (Claude Code or Cursor).
3. Walk through the five phases: Ground → Read & Judge → Draft & Confirm → Confirm Write Set → Apply.
4. Fill out a report using [template.md](template.md).
5. Submit it as a PR to this directory, or keep it local for your own reference.

## What to look for

- **Grounding accuracy**: Did the agent identify the right stacks, frameworks, and AI tool traces from repo evidence?
- **Draft quality**: Are the proposed AGENTS.md / CLAUDE.md / conditional DESIGN.md / steering files what a thoughtful maintainer would write?
- **Confirmation UX**: Was one yes/no enough? Did the summary give you enough info?
- **Apply safety**: Did `actualSha256 === intendedSha256` for every entry? Were there surprises?

## Reports

| Repo | Date | Key finding |
| --- | --- | --- |
| [minimal-repo (example)](example-minimal-repo.md) | 2026-05-27 | Baseline create/overwrite on empty-ish fixture |
| [cursor-heavy](case-cursor-heavy.md) | 2026-05-27 | Historical maintainer HRP round-trip: Cursor monorepo; overwrite + Cursor pair |
| [node-monorepo](case-node-monorepo.md) | 2026-05-27 | Historical maintainer HRP round-trip: pnpm/turbo; create-only root truth |
| [sindresorhus/is-plain-obj](case-sindresorhus-is-plain-obj.md) | 2026-05-27 | Historical maintainer HRP round-trip: external OSS, 3/3 SHA match |
