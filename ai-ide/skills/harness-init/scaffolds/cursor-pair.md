<!-- Style scaffold extracted from cursor.generator.ts during agent-as-writer task 3.1. Reference material — final bytes are agent-written. -->

<!-- file: .cursor/rules/harness.mdc -->
---
description: Cursor rule pack generated from Harness grounding
alwaysApply: true
---

# Cursor Harness Rules

> Cursor-private rules complement the root truth layer; they do not replace it.

## Grounding Summary

- shape: monorepo · languages: typescript, javascript · frameworks: react, vite, express · commands: dev, build, test, lint

## Recommended Files

| Path | Purpose |
| --- | --- |
| AGENTS.md | Project facts |
| CLAUDE.md | Collaboration protocol |
| DESIGN.md | Conditional design system when UI/product/DX evidence exists |
| steering/*.md | Local overrides |
| .cursor/commands/harness-init.md | The single Cursor entry point: `/harness-init` |

## Harness Cursor Guidance

> HARNESS Cursor adapter block
Read the root-level AGENTS.md / CLAUDE.md / DESIGN.md before applying any Cursor-private rule.
Harness is initialized only via `/harness-init` inside the IDE; never instruct the user to run terminal `harness` commands.
The agent orchestrates grounding, read, judge & draft, one yes/no confirm, and apply. It does not require Node/npm/npx/tsx or `.harness/runs/` artifacts for user onboarding.
On user `yes`, freeze the Confirmed_Write_Set and write only those files.
Default to incremental merge so existing user content is preserved.

<!-- file: .cursor/commands/harness-init.md -->
# Harness Init

Target project: `acme-web`.

## Detected Context

- shape: monorepo · languages: typescript, javascript · frameworks: react, vite, express · commands: dev, build, test, lint

## Cursor Command Contract

> HARNESS Cursor init command
This is the only Harness onboarding command. Do not ask the user to run terminal `harness`, `npm install`, or `npm run smart`.
Step 1 — Grounding: establish stacks, frameworks, and AI tool traces from repo inspection.
Step 2 — Read & Judge: read Root_Truth_Files, apply Sanity_Floor / Section_Boundary / Empty_Draft checks.
Step 3 — Draft & Confirm: prepare drafts, present summary, ask one yes/no.
Step 4 — Confirm Write Set: on `yes`, freeze the exact Draft bytes.
Step 5 — Apply: write confirmed files only — no re-grounding, no plan recomputation.
Do not require `.harness/runs/` artifacts or TypeScript maintainer scripts for this command.

## Confirmation Rule

Apply only after the user explicitly confirms in chat. Do not show file-level Plan internals unless the user asks. If the user declines, leave target configuration files unchanged.
