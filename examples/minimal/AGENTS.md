---
description: AI entry document — project facts, commands, ports, conventions
alwaysApply: true
---

# AGENTS.md

## Project Overview

Minimal example for a small TypeScript service that wants a clean AI governance entry point.

## Workspace Layout

- `src/` - application source code
- `tests/` - automated tests
- `steering/` - local override rules

## Key Technologies

- Node.js
- TypeScript
- Vitest

## Build, Test & Development Commands

- `pnpm dev` - start development mode
- `pnpm test` - run tests
- `pnpm lint` - run lint checks

## Coding Style & Naming Conventions

- Prefer small modules with explicit inputs and outputs
- Keep file names in kebab-case
- Use strict TypeScript settings

## Documentation Locations

| Topic | Path |
|-------|------|
| Collaboration protocol | `CLAUDE.md` |
| Shared coding examples | `steering/karpathy-examples.md` |

## Detailed Rule Files

| Topic | File | Scope |
|-------|------|-------|
| Shared coding examples | `steering/karpathy-examples.md` | always |
