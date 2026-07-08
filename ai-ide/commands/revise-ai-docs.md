---
description: >-
  Write session learnings back into AI entry docs (AGENTS.md, CLAUDE.md, steering).
  Lightweight incremental companion to /project-ai-docs-steward.
allowed-tools: Read, Edit, Glob
---

Review this session for durable learnings about working with AI in **the current target repository**. Update the **minimal set** of files so future sessions load correct context.

Follow the layer model in [`../skills/project-ai-docs-steward/SKILL.md`](../skills/project-ai-docs-steward/SKILL.md).

**事 = `AGENTS.md` (Facts)** · **法 = `CLAUDE.md` (Protocol)** — `docs/` remains human background unless fixing a link from entry docs.

## Step 1: Reflect

What would have helped earlier? (commands, ports, test patterns, module boundaries, tool quirks)

## Step 2: Find target files

| Kind | Path |
|------|------|
| Facts | `./AGENTS.md` |
| Protocol | `./CLAUDE.md` |
| Personal (gitignored) | `./.claude.local.md` if appropriate |
| Scoped rules | `steering/*.md` or `.kiro/steering/*.md` |

One line per durable learning. Do not paste session logs.

## Step 3: Route

- Commands / layout / ports → `AGENTS.md`
- Collaboration norms → `CLAUDE.md`
- Narrow technical convention → matching steering file
- Unsure → brief bullet under `CLAUDE.md` **Session notes** (still minimal)

**Locale:** If the user explicitly requests a language change, apply it. Otherwise match the existing body language of each file you edit; do not switch locale silently.

## Step 4: Show proposed diffs

For each file: **Why** (one line) + minimal diff.

## Step 5: Apply with approval

Edit only what the user approves. If steering folder is missing, report gap; suggest `/harness-init` or minimal index file — do not invent a full steering tree.
