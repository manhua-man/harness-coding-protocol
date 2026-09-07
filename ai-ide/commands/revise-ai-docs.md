---
description: Write session learnings to AGENTS/CLAUDE/steering. Merge or delete before add. Lighter than full steward audit.
allowed-tools: Read, Edit, Write, Glob
---

Review this session for durable learnings about working with AI in **the current target repository**. Update the **minimal set** of files so future sessions load correct context.

Follow the layer model in [`../skills/project-ai-docs-steward/SKILL.md`](../skills/project-ai-docs-steward/SKILL.md).

**事 = `AGENTS.md` (Facts)** · **法 = `CLAUDE.md` (Protocol)** — `docs/` remains human background unless fixing a link from entry docs.

## Step 1: Reflect

What would have changed a future decision? (commands, ports, test patterns, module boundaries, recurring tool behavior)

Before persisting a learning, require all three:

- **Recurrence** — evidence that the situation can recur, not merely that it happened once.
- **Future decision value** — a future agent would choose differently because this rule exists.
- **Net simplicity** — the rule removes more repeated discovery or error than the permanent documentation, state, and maintenance it adds.

Prefer deleting or simplifying a stale rule over adding another exception. One-off incidents, temporary workarounds, speculative governance, and rules with no current caller are not durable learnings.

**Before adding**, search `AGENTS.md`, `CLAUDE.md`, steering, and repository-owned skills for the same topic (reading, testing, approval, completion, tool routing). If a rule already exists:

- **Merge** into the existing owner instead of adding a duplicate
- **Narrow** scope if the old rule is too broad (accidental friction)
- **Delete** the stale rule if the new learning supersedes it

Subtraction counts as a durable learning when it removes recurrence cost or conflicting instructions.

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
- Tool routing → `AGENTS.md` § AI Assistant Tool Index; separate repository-owned tools from recommended external/global tools
- Collaboration norms, completion boundaries, approval policy → `CLAUDE.md` (risk-tiered; do not add blanket always-read / always-test / always-ask rules)
- Safe autonomous zones and targeted validation commands → `AGENTS.md` (facts and routes only)
- Narrow technical convention or optional reference rule → matching steering file; keep reference-only material clearly labelled and do not silently promote it into mandatory protocol
- Create a new `steering/*.md` reference only when the user explicitly asks for it or explicitly approves a proposed project-specific casebook. Adapt examples to real project paths and invariants; never copy a generic template verbatim.
- Unsure → do not persist it. Keep uncertainty in the current response and gather evidence in a later session if it recurs.

**Locale:** If the user explicitly requests a language change, apply it. Otherwise match the existing body language of each file you edit; do not switch locale silently.

## Step 4: Show proposed diffs

For each file: **Why** (one line) + minimal diff.

## Step 5: Apply with approval

Edit or create only what the user approves. For a new steering reference, show its full proposed path, purpose, and content before writing. If the steering folder is missing, report the gap and suggest `/harness-init` or one minimal approved file — do not invent a full steering tree.
