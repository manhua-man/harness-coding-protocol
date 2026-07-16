---
description: >-
  Sync human docs with implementation: git-anchored discovery of stale markdown
  plus document types, writing layout, and doc-governance rules.
  Does not replace AGENTS.md / CLAUDE.md.
allowed-tools: Read, Write, Edit, Bash
argument-hint: [topic] | --api | --architecture | --sync
---

# Documentation Update

Sync **human** documentation with implementation reality: $ARGUMENTS

**Two jobs:**

1. **Discovery** — By default, infer candidate markdown from recent git changes; when the user names a topic or paths, **follow the user first**.
2. **Writing** — For each file in scope, apply document types, layout, and **doc-governance rules** below.

**Not in scope:** replacing `AGENTS.md` / `CLAUDE.md` (use `/revise-ai-docs` or `/project-ai-docs-steward`). No spec-kit phase percentages or `specs/` trees unless the repo actually uses them.

## Change discovery (default on)

**Priority:** user `$ARGUMENTS` (topic, paths, module names) **over** git inference below.

1. **Git signals** — Recent commits touching `*.md`; unstaged/staged `git diff --name-only` for markdown and for code/config that may invalidate docs.
2. **Direct hits** — Any `.md` already in the diff goes on the candidate list.
3. **Path association** — When code under a directory changed, check human docs that usually describe that area (nearby README, related `docs/` pages, package-level readme). Do **not** blind `find` of every markdown file. An optional local mapping table in the **target repo** (e.g. `steering/docs-path-map.md` or a project copy of this command) may narrow this step — mapping tables stay in the app repo, not in this protocol command.
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
| **Runbook / how-to** | Procedures, deploy, troubleshooting | H1 → one-line goal → steps/checklist → commands; symptom \| cause \| fix tables |
| **Reference** | API, config, env, schemas | Tables, fields, minimal examples |
| **Architecture / module** | Boundaries, data flow | Diagrams/tables; link to reference |
| **Design / ADR** | Decisions | Context → decision → consequences (no filler openers) |
| **README (entry)** | Navigation | Short intro + links; no duplicating large tables |

**Locale:** Match explicit user request, else each file's existing language.

Progress markers only where the file already tracks progress — no decorative status icons.

## Doc-governance rules (norms only — not domain content)

These are **process rules**. Do **not** bake domain field tables, stage roadmaps, or secret inventories into this command. If type/layout guidance conflicts with a rule below, follow the rule.

1. **Single source of truth + split by duty**  
   Define each concept in one place only. Other docs may add one sentence + a **file path** (not section numbers). Do not copy full definition tables/diagrams. Entry/index pages do not paste large tables. One doc owns one duty; if duplicates appear, converge on the source of truth and trim copies — do not patch both sides separately.

2. **Prefer update over create; current line only**  
   Edit existing truth sources and entry indexes first. Do not create parallel topic docs or new directory trees unless the user asks. Keep deprecated flows out of mainline prose; archive docs must state archive/non-authority at the top; conflicts resolve per rule 6.

3. **Align with implementation; keep scope tight**  
   Behavior follows code and `AGENTS.md` (facts). Do not invent doc-only business rules. Change only stale points related to this update — no drive-by full-file rewrites unless the user asked for a cleanup.

4. **Precise and brief**  
   Write what it is, how to do it, and necessary caveats. No preaching, no restating the same idea twice. Expand only when the user says it is unclear / asks for more background.

5. **Do not rewrite existing sensitive config presentation**  
   If a doc already shows credentials or sample secrets, do not delete, mask, or replace them with “do not put secrets in docs” unless the user explicitly asks. Redaction policy is human-owned; default is to follow the file’s existing style.

6. **Conflict resolution order**  
   User request for this turn > code / `AGENTS.md` (facts) > human mainline truth docs > archive/historical docs. When they conflict, converge downstream copies to the winner — do not leave parallel stories.

## Task

1. Build candidate md list from **Change discovery**; user args may narrow or widen.
2. For each candidate: read implementation → update if stale → apply **type, layout, and governance rules**.
3. **Update existing files only** unless the user asks for new docs.
4. Cross-check claims against manifests, configs, and source. If the same concept is defined in multiple places, prefer converging to one truth source and trimming copies.

## Output

1. Files updated (git-inferred and user-directed)
2. Major factual corrections; call out de-duplication / truth-source convergence if any
3. Files reviewed but unchanged (and why), if any
4. Items better handled by `/revise-ai-docs`
