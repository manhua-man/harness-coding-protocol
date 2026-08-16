<!-- Style scaffold extracted from agents.generator.ts during agent-as-writer task 3.1. Reference material — final bytes are agent-written. -->
# AGENTS.md (Facts · 事)

> This file is **Facts (事)**: it answers "what is this repository?"
> Store only verifiable project facts. Collaboration methods and decision rules live in sibling `CLAUDE.md`.

## AI Entry Documentation (Division of Labor)

**事 (Facts) vs 法 (Protocol).** This file is **事**; sibling **`CLAUDE.md`** is **法**. **Every AI tool must load both.** They are not alternative entry files.

**Conceptual stack:**

```text
法 (CLAUDE.md) → 事 (AGENTS.md) → steering/ → docs/ (human background, NOT AI truth)
```

**AI truth entry:** root `AGENTS.md` + `CLAUDE.md`, with scoped supplements in `steering/`. `docs/` is human long-form — do not treat it as authority over verifiable source evidence or 事/法.

| Character | File | Responsibility |
| --- | --- | --- |
| Facts (事) | `AGENTS.md` | Verifiable layout, commands, ports, modules, APIs, and repository conventions |
| Protocol (法) | `CLAUDE.md` | Decision priority, conflict resolution, risk-tiered RIPER Gate, collaboration, and output requirements |
| Design (设) | `DESIGN.md` on demand | Product tone, visual tokens, layout, components, motion, copy, brand, and experience anti-patterns |

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

### Repository-owned tools

- `example-skill` — Include only when the skill physically exists in this repository or is declared by its manifests/ops docs.

If none exist, state that explicitly.

### Recommended external / global tools

- `example-external-skill` — Include only when selected by the user, routed by authoritative project docs, or intentionally preserved from the active IDE catalog.

Label this subsection as not bundled and availability-dependent. Do not claim external tools are installed project dependencies.

## Code Hooks (React) — or skip this section

> HARNESS_DYNAMIC code-hooks block
Use when grounding finds React/application hooks (for example `lib/hooks/`).
Describe the actual path and purpose. Do not call them workflow adapters.

## Detailed Rule Files

- **Steering index:** `steering/project-index.md` or `.kiro/steering/project.md` when present
- **Design system:** `DESIGN.md` (conditional)
