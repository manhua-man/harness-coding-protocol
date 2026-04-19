---
description: AI entry document — project facts, commands, ports, conventions
alwaysApply: true
---

# AGENTS.md

## Project Overview

Complete example for a product repository using root truth files plus optional tool adapters.

## Workspace Layout

- `apps/web/` - frontend application
- `apps/api/` - backend service
- `tests/` - automated tests
- `steering/` - canonical local override rules
- `.cursor/rules/` - optional Cursor mirror
- `.kiro/steering/` - optional Kiro mirror

## Key Technologies

- React
- Node.js
- TypeScript
- Playwright

## Build, Test & Development Commands

- `pnpm dev:web` - run the frontend app
- `pnpm dev:api` - run the backend service
- `pnpm test` - run the full automated test suite
- `pnpm test:e2e` - run Playwright tests

## Coding Style & Naming Conventions

- Keep components and services focused on one responsibility
- Prefer explicit dependency injection in backend code
- Keep test names behavior-oriented

## Documentation Locations

| Topic | Path |
|-------|------|
| Collaboration protocol | `CLAUDE.md` |
| Project-specific local context | `steering/project.md` |
| Frontend guidance | `steering/frontend.md` |
| Backend guidance | `steering/backend.md` |
| Testing expectations | `steering/testing.md` |

## Detailed Rule Files

| Topic | File | Scope |
|-------|------|-------|
| Project-specific context | `steering/project.md` | manual |
| Frontend implementation guidance | `steering/frontend.md` | file-match / manual |
| Backend implementation guidance | `steering/backend.md` | file-match / manual |
| Testing expectations | `steering/testing.md` | always |
| Shared coding examples | `steering/karpathy-examples.md` | always |

## Adapter Mirrors

Adapter mirrors exist for compatibility only:

- `.cursor/rules/harness-governance.mdc`
- `.kiro/steering/*.md`

If an adapter mirror disagrees with root files, follow the root files.
