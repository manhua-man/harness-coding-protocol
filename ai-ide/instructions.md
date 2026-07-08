# Harness Coding Protocol — Plugin Instructions

## Install

Add this repository as a Claude Code plugin (`source: ./` in `.claude-plugin/marketplace.json`). **Do not** use `npm install`.

## First step in a target repo

Run **`/harness-init`** in the AI IDE.

Do **not** tell the user to run terminal commands (`harness setup`, `npm run smart`, `harness detect`, `npm install`).

## What `/harness-init` does

1. **Grounding** — read repo files to establish stacks, frameworks, existing AI tool traces
2. **Read & Judge** — read Root_Truth_Files, apply Sanity_Floor / Section_Boundary / Empty_Draft checks
3. **Draft & Confirm** — prepare drafts, present summary, ask one yes/no
4. **Confirm Write Set** — on `yes`, freeze the exact Draft bytes
5. **Apply** — write confirmed Root_Truth_Files only; no re-grounding, no plan recomputation

Implementation authority for user onboarding: `ai-ide/skills/harness-init/SKILL.md`. Do not require Node.js, npm, npx, tsx, or the TypeScript maintainer scripts.

## After init: maintain AI entry docs

| Command | Skill / doc |
|---------|-------------|
| `/revise-ai-docs` | Session write-back — `ai-ide/commands/revise-ai-docs.md` |
| `/project-ai-docs-steward` | Full audit — `ai-ide/skills/project-ai-docs-steward/SKILL.md` |
| `/update-docs` | Human docs sync — `ai-ide/commands/update-docs.md` |

`harness-setup` is a deprecated alias. To verify plugin changes, run `/harness-init` in a target test repo (see CONTRIBUTING).

## Contributing

Verification checklist and release gate: `CONTRIBUTING.md`
