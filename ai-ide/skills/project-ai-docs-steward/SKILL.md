---
name: project-ai-docs-steward
description: >-
  Audit and improve a target repo's AI entry documentation (AGENTS.md, CLAUDE.md,
  steering, .cursor rules). Use after /harness-init or when AI context drifts.
  Generic harness protocol skill — parameterize paths to the open workspace.
tools: Read, Glob, Grep, Edit
---

# Project AI Docs Steward

Maintain **structured entry documentation** so every AI tool reading the target repo gets a consistent stack.

**事 = `AGENTS.md` (Facts)** · **法 = `CLAUDE.md` (Protocol)** — both are mandatory for AI context. Missing 法 → codes without collaboration rules; missing 事 → reasons without correct facts.

**This skill edits tracked markdown only after a quality report and explicit user approval.** Prefer updating existing files over duplicates (`Update Before Create`).

## Layer model

**Stack:** **法 (`CLAUDE.md`)** → **事 (`AGENTS.md`)** → **steering** (scoped overrides) → **`docs/`** (human prose; **not** an AI truth source).

| Tier | Role | Typical paths |
|------|------|----------------|
| 1 · Entry routing | What to read first | `.cursor/rules/*.mdc` |
| 2 · 法 + 事 | AI truth | `CLAUDE.md`, `AGENTS.md` |
| 3 · Overrides + human docs | Steering; long-form specs | `steering/*.md` or `.kiro/steering/*.md`, `docs/**` |

**Steering path resolution:** If `.kiro/steering/` exists, use it; else `steering/`. If both exist, audit both; index file may be `project.md` or `README.md` inside that folder.

**Conflict rule:** AI truth = **`AGENTS` + `CLAUDE`**; steering patches specific contexts; `docs/` does not override 事/法.

## Locale

Same priority as `/harness-init` Draft locale (`ai-ide/skills/harness-init/SKILL.md` § Draft locale):

1. **Explicit user locale instruction this session** — hard override; switch language when the user asks.
2. Otherwise preserve each file's existing body locale; new bullets match the file being edited and the target repo's entry-doc language.
3. Do not anglicize a Chinese repo or sinicize an English repo unless the user requests it.

## Workflow

### Phase 1: Discovery

Locate entry files in the **target workspace** (Glob preferred):

- `AGENTS.md`, `CLAUDE.md`, `DESIGN.md` (optional), `.claude.local.md`
- `.cursor/rules/*.mdc`
- `steering/**/*.md` and/or `.kiro/steering/**/*.md`
- `packages/**/CLAUDE.md` (monorepo overrides)

Record: path, tier, exists/missing, broken links from cursor rules.

### Phase 2: Quality assessment

Score each file (adapt claude-md-improver rubric):

- **AGENTS.md:** commands vs manifests (`package.json`, `Cargo.toml`, …), ports, module paths, steering index
- **CLAUDE.md:** decision priority once; links to AGENTS; no duplicate fact tables
- **Steering:** inclusion scope (`always` / `fileMatch` / `manual`); overlap with AGENTS; broken frontmatter
- **Cursor rules:** index table paths resolvable

**Grades:** A–F (90+ = A).

### Phase 3: Quality report (mandatory before edits)

Summary + per-file table (scores, issues, recommended fixes). No silent writes.

### Phase 4: Proposed diffs

Per change: target file, one-line **why**, minimal diff.

### Phase 5: Apply

Edit only after user confirmation. Facts belong in **AGENTS** before new top-level docs.

## Routing learnings (quick reference)

| Learning type | Target |
|---------------|--------|
| Commands, ports, layout | `AGENTS.md` |
| Collaboration, modes, priorities | `CLAUDE.md` |
| Stack-specific conventions | Matching steering file |
| Domain (payment, infra, …) | `manual` steering file |
| Long narratives | `docs/` + link from AGENTS |

## Common issues

1. **Missing steering index** — rules point to `project.md` that does not exist
2. **Duplicate content** — same port list in AGENTS and CLAUDE
3. **Stale scripts** — manifest scripts drift vs AGENTS
4. **Always-on steering bloat** — large `inclusion: always` files; prefer `fileMatch`
5. **Broken frontmatter** — invalid YAML on steering files

## Related commands

- **`/revise-ai-docs`** — session incremental write-back (lighter than full audit)
- **`/update-docs`** — sync human `docs/` with implementation (not AI truth)
- **`/harness-init`** — first-time or major bootstrap of root truth
