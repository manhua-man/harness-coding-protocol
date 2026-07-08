---
description: >-
  Sync human docs with implementation: git-anchored discovery of stale markdown
  plus document types and writing layout. Does not replace AGENTS.md / CLAUDE.md.
allowed-tools: Read, Write, Edit, Bash
argument-hint: [topic] | --api | --architecture | --sync
---

# Documentation Update

Sync **human** documentation with implementation reality: $ARGUMENTS

**Two jobs:**

1. **Discovery** — By default, infer candidate markdown from recent git changes; when the user names a topic or paths, **follow the user first**.
2. **Writing** — For each file in scope, apply document types and layout discipline below.

**Not in scope:** replacing `AGENTS.md` / `CLAUDE.md` (use `/revise-ai-docs` or `/project-ai-docs-steward`). No spec-kit phase percentages or `specs/` trees unless the repo actually uses them.

## Change discovery (default on)

**Priority:** user `$ARGUMENTS` (topic, paths, module names) **over** git inference below.

1. **Git signals** — Recent commits touching `*.md`; unstaged/staged `git diff --name-only` for markdown and for code/config that may invalidate docs.
2. **Direct hits** — Any `.md` already in the diff goes on the candidate list.
3. **Path association** — When code under a directory changed, check human docs that usually describe that area (nearby README, related `docs/` pages, package-level readme). Do **not** blind `find` of every markdown file. An optional local mapping table in your repo's copy of this command (e.g. `ai-ide/commands/update-docs.md`, `commands/update-docs.md`, `.cursor/commands/update-docs.md`, or `.claude/commands/update-docs.md`) may narrow this step.
4. **Keyword search (narrow)** — From changed files, extract module names, endpoints, env vars, script names; search **only** `docs/**` and mapped doc paths with `rg`/`grep`. Skip repo-wide sweeps when the user narrowed scope.
5. **Fact check** — Commands, ports, paths against `AGENTS.md` and the live tree; human docs do not override AI truth.

If the user named specific files or a topic, skip broadening search beyond that scope plus obvious cross-links.

Human `docs/**` and `README.md` are background; they do not override `AGENTS.md` / `CLAUDE.md`.

## Doc layers (typical repo — skip missing paths)

| Layer | Common path | Role |
| --- | --- | --- |
| AI truth · Facts | `AGENTS.md` | Facts; one-line link only when adding a new entry point |
| AI truth · Protocol | `CLAUDE.md` | Protocol; not bulk-edited here |
| Scoped overrides | `steering/**`, `.kiro/steering/**`, etc. | When present |
| Human long-form | `docs/**` | Architecture, modules, runbooks |
| Entry | `README.md` | Navigation; no duplicating `AGENTS.md` tables |

## Human doc types (what to write)

| Type | Use for | Layout |
| --- | --- | --- |
| **Runbook / how-to** | Procedures, deploy, troubleshooting | H1 → one-line goal → steps/checklist → commands |
| **Reference** | API, config, env, schemas | Tables, fields, minimal examples |
| **Architecture / module** | Boundaries, data flow | Diagrams/tables; link to reference |
| **Design / ADR** | Decisions | Context → decision → consequences |
| **README (entry)** | Navigation | Short intro + links; no duplicating `AGENTS.md` command tables |

## Writing discipline

**Action first.** Shorten before you add: drop meta preambles, merge duplicate nav, use symptom | cause | fix tables.

**Locale:** Match explicit user request, else each file's existing language.

Progress markers (done/todo) only where the file already tracks progress — do not sprinkle decorative status icons.

## Task

1. Build candidate md list from **Change discovery**; user args may narrow or widen.
2. For each candidate: read implementation → update if stale → apply correct **type and layout**.
3. **Update existing files only** unless the user asks for new docs.
4. Cross-check claims against manifests, configs, and source.

## Output

1. Files updated (git-inferred and user-directed)
2. Major factual corrections
3. Files reviewed but unchanged (and why), if any
4. Items better handled by `/revise-ai-docs`
