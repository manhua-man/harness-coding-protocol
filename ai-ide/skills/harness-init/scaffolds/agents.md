<!-- Style scaffold extracted from agents.generator.ts during agent-as-writer task 3.1. Reference material — final bytes are agent-written. -->
# AGENTS.md (Facts · 事)

> Project facts: this file answers "what does this repository look like?" Only verifiable facts go here.

## AI Entry Documentation (Division of Labor)

**事 (Facts) vs 法 (Protocol).** This file is **事**; sibling **`CLAUDE.md`** is **法**. **Every AI tool must load both.** If only one is injected, the model tends to write without protocol or reason without facts.

**Conceptual stack:**

```text
法 (CLAUDE.md) → 事 (AGENTS.md) → steering/ → docs/ (human background, NOT AI truth)
```

**AI truth sources:** **`AGENTS.md` + `CLAUDE.md` only.** `docs/` is human long-form — do not treat it as authority over 事/法.

## Project Overview

`acme-web` is a typescript / javascript monorepo project. Primary frameworks: react, vite, express.

## Workspace Layout

- `apps/`
- `packages/`
- `scripts/`
- `docs/`

## Key Technologies

- **Languages:** typescript, javascript
- **Runtimes:** node
- **Frameworks:** react, vite, express
- **Package managers:** pnpm

## Build, Test & Development Commands

| Name | Command | Source |
| --- | --- | --- |
| dev | `pnpm dev` | package.json |
| build | `pnpm build` | package.json |
| test | `pnpm test` | package.json |
| lint | `pnpm lint` | package.json |

## Quick Reference

- **Project governance:** `CLAUDE.md`
- **Design system:** `DESIGN.md` when UI/product/DX design evidence exists
- **Steering rules index:** `steering/` (only when real overrides exist)
- **Human docs:** `docs/` (background only)

## AI Assistant Tool Index

> HARNESS_DYNAMIC skill index block

### .claude/skills/

- `example-skill` — Include only if this skill physically exists under the target repository's `.claude/skills/`.

Do not list plugin-provided `harness-init` here.

## Code Hooks (React) — or skip this section

> HARNESS_DYNAMIC code-hooks block
Use when grounding finds React/application hooks (for example `lib/hooks/`).
Describe the actual path and purpose. Do not call them workflow adapters.

## Detailed Rule Files

- **Steering index:** `steering/project-index.md` or `.kiro/steering/project.md` when present
- **Design system:** `DESIGN.md` (conditional)
