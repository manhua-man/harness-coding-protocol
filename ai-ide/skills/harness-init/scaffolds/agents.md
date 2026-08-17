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

<!-- Add only evidence-supported conditional sections when they help an unfamiliar Agent:
Module Architecture, Architecture Contract, Runtime Boundaries, Storage and Truth Boundaries,
Service Ports, Deployment Boundaries, Targeted Validation, Current Trusted Baseline,
Data Scale, Configuration and Secrets, or UI/DX Design Surface.
Do not emit empty headings or generic placeholders. -->

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

## Tool and Documentation Routing

The routing below should let an unfamiliar Agent choose the correct project entry without confusing bundled and external capabilities.

### AI Assistant Tool Index

> HARNESS_DYNAMIC skill index block

#### Repository-native commands and scripts

- `pnpm test` — Include commands/scripts declared by manifests, CI, or authoritative ops docs, with their task and evidence source.

#### Repository-owned AI skills and commands

- `example-skill` — Include only when the Skill/command/workflow physically exists in this repository.

If none exist, state that explicitly.

#### Recommended external / global tools

- `example-external-skill` — Include only when selected by the user, routed by authoritative project docs, or intentionally preserved from the active IDE catalog.

Label this subsection as not bundled and availability-dependent. Do not claim external tools are installed project dependencies.

### Documentation Routes

- Link only documents an unfamiliar Agent needs as an authority or navigation entry.
- Label each link as current truth, target design, or historical material when that distinction matters.
- Omit long-form material that is not needed for navigation; never copy iteration logs, large test output, stale snapshots, or sensitive credentials into `AGENTS.md`.

<!-- Conditional example: if grounding finds React/application hooks under lib/hooks/ or src/hooks/,
add a factual Code Hooks (React) section. Do not call application hooks workflow adapters. -->
