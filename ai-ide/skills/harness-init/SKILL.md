---
name: harness-init
description: Bootstrap a target repo via /harness-init — ground, read, judge, confirm, apply. The IDE_Agent itself reads, judges, and writes the root-truth files after one confirmation, without requiring Node/npm/npx/tsx.
---

# Harness Init (v2.1.0 — agent-native)

You are the IDE_Agent. `/harness-init` runs in five phases against the user's target repository:

**Phase 1 — Ground → Phase 2 — Read → Phase 3 — Judge & Write Drafts → Phase 4 — Show & Confirm → Phase 5 — Apply**

All five phases are agent-native. Do not require Node.js, npm, npx, tsx, a package manager, or a project-local runtime. You read the project, judge what each Root_Truth_File should say, produce Drafts in working memory, ask for one confirmation, and then write only the confirmed Root_Truth_Files. Nothing lands on disk until the user types `yes` in Phase 4.

If the user supplied a project path argument, use it. Otherwise, use the current working directory.

---

## Targets (Root_Truth_Files)

You write only these Root_Truth_File targets, treated as agent outputs (no template-only bytes):

1. `<target>/AGENTS.md` — project facts
2. `<target>/CLAUDE.md` — collaboration protocol
3. `<target>/DESIGN.md` — product, visual, interaction, brand, content, or DX design system; conditional, see DESIGN gate below
4. `<target>/steering/harness-recommendations.md` — local steering overrides; conditional, see steering gate below
5. **Optional Cursor adapter** (one logical Root_Truth_File, two physical paths) — only when `.cursor/` is already present or the user asks for Cursor rules:
   - `<target>/.cursor/rules/harness.mdc`
   - `<target>/.cursor/commands/harness-init.md`

   **Slash commands in target repos:** this plugin ships `ai-ide/commands/` and `ai-ide/skills/`. In a **target** repo, the user chooses where IDE slash commands live (`ai-ide/commands/`, `commands/`, `.cursor/commands/`, `.claude/commands/`, etc.). Do **not** scaffold duplicate command trees across paths unless the user requests it. Reference the chosen path from `AGENTS.md`; skip the Cursor pair when `.cursor/` is absent and the user keeps commands elsewhere.

You write nothing else. Anything outside this set is forbidden (see Anti-Patterns below). Conditional targets still appear in the Phase 4 summary as `create`, `patch-section`, `overwrite`, or `skip`.

---

## Phase 1 — Ground

Inspect the target repository directly with the IDE/harness tools available to you. Do not call `npx`, `tsx`, `node`, a bundled detector script, or any project install command as a prerequisite for `/harness-init`.

### Grounding checklist

Build a short internal `Grounding_Summary` from repo evidence. It is not a file and must not be written to `.harness/runs/`.

Capture at least:

- `targetPath`
- repo shape: empty / single-package / monorepo / layered / unknown
- detected stacks and package managers, based only on files you saw
- detected frameworks, based only on manifests, configs, README, or source evidence you saw
- detected AI tool traces: `.claude/`, `.claude-plugin/`, `.cursor/`, `.kiro/`, `AGENTS.md`, `CLAUDE.md`, `mcp.json`, etc.
- detected design-surface evidence: UI/frontend/game/documentation site/plugin UI/design system/DX-experience signals, or no such evidence
- existing Root_Truth_Files and whether they contain harness-managed sections
- evidence paths for each claim

If the user asked for detection/grounding only ("just show me what you found"), stop after Phase 1 and report the `Grounding_Summary`. Phases 2–5 are skipped.

### Failure modes

- IF the target path does not exist or cannot be read, stop and report the path or permission problem.
- IF you cannot read any target repo files at all, classify the run as `Grounding_Failure`, stop, and report that no repo evidence was available.
- Do not invent project facts that are not supported by a file path you read or listed.

---

## Phase 2 — Read

Use `Grounding_Summary` as your sanity floor for everything that follows.

### Progress feedback

Before reading, tell the user what you are about to do:

> Phase 2: reading existing root-truth files and project evidence...

### Read_Budget

Optional reads from the target repo are capped at **30 files / 200 KB total**. Mandatory reads (always read, may exceed the cap if needed):

- existing `AGENTS.md`, `CLAUDE.md`, `DESIGN.md` at the repo root (if any exist)
- `<target>/steering/harness-recommendations.md` and any other `steering/*.md` (depth 1, max 10 files)
- existing `.cursor/rules/*` and `.cursor/commands/*` (depth 1)
- existing `.kiro/steering/*` (depth 1)
- the top `README` of the repo (`README.md`, `README.*`, or whatever the repo uses)
- every package manifest or config found during Phase 1 — root and any monorepo workspace roots (`package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, etc.)
- files that directly support `Grounding_Summary` claims, including design-surface claims

Optional reads (grep / read of source, fixtures, internal docs) count against the 30-file / 200 KB cap. Track your own reads.

### Failure modes

- IF you reach the Read_Budget cap before optional evidence-gathering is complete, stop reading and proceed to Phase 3 with what you have.
- IF you read **zero files** in Phase 2 (mandatory list empty AND no optional reads), classify the run as `Read_Phase_Failure`, stop before Phase 3, and report that no evidence was gathered.

---

## Phase 3 — Judge & Write Drafts

For each Root_Truth_File target (Cursor pair counted as one logical target), produce a Draft in working memory unless its action is `skip`. Nothing goes to disk yet.

### Progress feedback

Before drafting, tell the user:

> Phase 3: judging actions and drafting root-truth files...

Keep Draft contents internal during Phase 3. Do not print complete `AGENTS.md`, `CLAUDE.md`, `DESIGN.md`, `steering/harness-recommendations.md`, or Cursor file Drafts by default. You may print a compact action decision list (`path / action / evidence`) before Phase 4, but full Draft text or diffs are shown only if the user explicitly asks to inspect them.

### Per_File_Action decision tree

Pick exactly one action per Root_Truth_File:

| File state | Allowed actions |
| --- | --- |
| File does not exist on disk | `create` |
| File exists, no harness-managed `##` sections | `patch-section` or `skip` (NEVER `overwrite`) |
| File exists, has harness-managed `##` sections | `create` (n/a — file already exists), `overwrite`, `patch-section`, or `skip` |

Rules:

- `patch-section`: write only within the target `##` heading section. Bytes outside that section (including other `##` sections, optional YAML frontmatter if present, and any content above the first `##` heading) MUST be preserved verbatim from the prior file.
- `skip`: record a one-sentence reason. No Draft is produced.
- For every non-skip file: record a one-line evidence reason naming what supports the chosen action.
- `DESIGN.md`: create or patch only when at least one condition is true:
  - the target already has root `DESIGN.md`;
  - the user explicitly asked for a design entry, UI guidance, brand guidance, product experience guidance, or DX design guidance;
  - repo evidence shows a user-facing surface such as frontend UI, mobile UI, game UI, documentation site, browser extension, IDE/plugin UI, design system, component library, storybook, visual assets, CSS/theme tokens, or substantial screenshots.
- If the target is a pure backend service, library, CLI, infrastructure repo, data pipeline, or unknown project with no design-surface evidence, choose `skip` for `DESIGN.md` with a concrete reason. Do not create generic design boilerplate.
- `steering/harness-recommendations.md`: do not create this file solely because it is part of the Harness structure. Create it only when there are project-specific recommendations or local overrides that do not belong in `AGENTS.md` or `CLAUDE.md`. If it would be empty or generic, choose `skip`. Never create placeholder text such as `(no harness-managed overrides for this project yet)`.

- **AI trace disambiguation** (read evidence paths before naming `AGENTS.md` sections):
  - `hooks` under `lib/hooks/`, `src/hooks/`, `hooks/`, or React/Next component source → label as **Code Hooks (React)** (or equivalent factual heading). These are application hooks, not Harness workflow adapters.
  - `hooks` under `.claude/hooks/`, `.codex/hooks/`, or explicit IDE/tool hook config → workflow/IDE hooks; only then use workflow-adapter wording.
  - `skills` → use heading `## AI Assistant Tool Index`; list only skills that physically exist under the target repo (for example `.codex/skills/`, `.claude/skills/`, `.agents/skills/`). Never list plugin-provided `harness-init` unless the target repo contains its own copy.
  - If a trace is ambiguous, prefer a factual path-based description over inventing adapter terminology.

- **Cursor pair contract**: `.cursor/rules/harness.mdc` and `.cursor/commands/harness-init.md` must describe the agent-native five-phase flow. They must **not** instruct users or agents to require Node/npm/npx/tsx or `.harness/runs/` for onboarding.

The Cursor pair is one logical Root_Truth_File but two physical paths; both files carry the same Per_File_Action and surface as two summary/write entries.

### Draft locale

Resolve one **resolved locale** for body prose before drafting.

**Priority — explicit user locale instruction is a hard override (overrides 2–4):**

1. **Explicit user locale instruction this session** — e.g. "write AGENTS in Japanese", "switch all entry docs to English". Applies even when existing `AGENTS.md` / `CLAUDE.md` use another language.
2. Primary language of existing root `AGENTS.md`, `CLAUDE.md`, or `DESIGN.md` body prose (when the user did not specify).
3. Evidence from `README`, `docs/`, source comments, commit/PR/issue samples you read in Phase 2.
4. Language of the current `/harness-init` conversation.
5. Still unclear → ask the user once before Phase 4; **do not silently default** to Chinese or English.

**Hard constraints:**

- Within this run, body prose in `AGENTS.md`, `CLAUDE.md`, conditional `DESIGN.md`, and `steering/harness-recommendations.md` must use the **same** resolved locale.
- Table labels **事 / 法 / 设** remain Harness layer notation regardless of body locale.
- `patch-section`: preserve bytes outside the target `##` section verbatim; new or rewritten bytes inside follow the resolved locale (priority 1 wins over legacy section language).

### Sanity_Floor self-check

For every Draft, cross-reference it against `Grounding_Summary` and the evidence paths you read. The Draft's claims about declared languages, frameworks, package managers, repo shape, detected AI-tool traces, and design-surface evidence MUST be supported by those repo facts. If a Draft contradicts grounded evidence, either patch the Draft to match or classify the run as `Sanity_Floor_Violation`, stop before Phase 4, and report which file and which fact diverged.

### Empty_Draft_Failure

If any Root_Truth_File whose Per_File_Action is `create`, `overwrite`, or `patch-section` produces an empty or zero-length Draft, classify the run as `Empty_Draft_Failure`, stop before Phase 4, and report the empty Draft list. Do not present empty Drafts for confirmation.

### Root_Frontmatter_Failure

If any protocol/facts Markdown Draft (`AGENTS.md`, `CLAUDE.md`, or `steering/*.md`) starts with YAML frontmatter (`---`, `description:`, `alwaysApply:`), classify the run as `Root_Frontmatter_Failure`, strip the frontmatter, and rerun Sanity_Floor before Phase 4. Frontmatter is allowed only for `DESIGN.md` design tokens and `.cursor/rules/*.mdc`.

---

## Phase 4 — Show & Confirm

Render a per-file summary, ask for one yes/no, and only on `yes` apply the confirmed Drafts.

### Progress feedback

Before rendering the summary:

> Phase 4: rendering summary for your review...

### Summary template

One line per Root_Truth_File path (the Cursor pair surfaces as two lines). Use absolute paths. The format is:

```text
<absolute-path> | action: <create|overwrite|patch-section|skip> | evidence: <one sentence>
```

For `skip` entries, set `evidence:` to the one-sentence reason. The summary does NOT include full Draft contents or full diffs by default. If the user asks to inspect a specific Draft or diff, provide it on demand.

After the summary, ask exactly one question:

> Apply these changes? Reply **yes** or **no**.

If the user replies anything other than `yes`, treat the run as cancelled and write nothing.

### On `yes` — confirm the write set

Before writing, create an internal `Confirmed_Write_Set` from the exact Draft bytes:

```text
entries: [ { path, action, content, evidenceReason } ]
skipped: [ { path, reason } ]
summary: <summary-string shown to the user>
```

Validate internally that every entry path is one of the allowed Root_Truth_File targets and that every non-skip content value is non-empty. If validation fails, write nothing.

After validation passes, tell the user you are entering Phase 5.

---

## Phase 5 — Apply

Write only the entries in `Confirmed_Write_Set`. No re-grounding and no recomputation of Drafts after the user's `yes`.

Behaviour:

- For each entry: if the file already exists, preserve the prior bytes in memory long enough to restore on immediate failure when the harness supports it.
- Create parent directories only for confirmed entry paths.
- Write `entry.content` verbatim.
- Re-read each written file when possible and verify that the landed text matches `entry.content`.
- Continue past per-entry write failures and report each failed path.

After the function returns, report to the user:

- counts: `applied`, `skipped`, `failed`
- written paths
- any per-entry failures: each path and its error
- any post-write mismatch where re-read content differs from the confirmed Draft

### Rollback

If the user says "undo", "revert", "rollback", or similar after a successful apply, restore from the pre-write bytes you captured when the harness still has them in context. If the current session no longer has recoverable pre-write bytes, say so and ask before making any destructive change. Never run a broad git reset.

---

## Failure summary

| Failure | Detected at | Action |
| --- | --- | --- |
| `Grounding_Failure` | end of Phase 1 | report unreadable target or zero repo evidence, stop |
| `Read_Phase_Failure` (zero reads) | start of Phase 3 | report, write nothing, stop |
| `Sanity_Floor_Violation` | end of Phase 3 | name file + diverging fact, write nothing, stop |
| `Empty_Draft_Failure` | end of Phase 3 | report empty Drafts, write nothing, stop |
| `Root_Frontmatter_Failure` | end of Phase 3 | remove root Markdown frontmatter, rerun checks, no write until fixed |
| User declines | Phase 4 | write nothing |
| Per-entry write failure | inside Phase 5 | apply continues, reported after |
| Post-write mismatch | Phase 5 post-write | report path and mismatch |

---

## Anti-Patterns (read once, internalise)

These rules override everything else. Stop and report if you find yourself doing any of them.

| # | Anti-Pattern | Why it is wrong |
| --- | --- | --- |
| 1 | Hand-editing or hand-creating any file under `.harness/runs/` (via `Write`, `Edit`, `mkdir`, shell `echo >`, etc.) | `/harness-init` no longer needs user-facing run artifacts. Hand-built artifacts produce fake evidence and break the contract. |
| 2 | Writing any file outside the allowed Root_Truth_File targets (including conditional `DESIGN.md`, conditional steering, and the Cursor pair when Cursor is detected) | Out-of-target writes are not authorised by `/harness-init`. The Confirmed_Write_Set enumerates exactly which paths land. |
| 3 | Calling a third-party LLM API or external service during the run | The IDE_Agent IS the LLM and does the writing in-process. No `openai`, `anthropic`, `claude`, `gpt`, or `llm` clients. |
| 4 | Synthesising `detection.json` from gathered evidence | User-facing `/harness-init` does not use `detection.json`. Use `Grounding_Summary` internally instead of fabricating detector output. |
| 5 | Writing any Root_Truth_File before the user answers `yes` in Phase 4 | The write set is confirmed before apply. Pre-yes writes bypass user consent. |
| 6 | Touching bytes outside the target `##` heading section when the action is `patch-section` | `patch-section` is the safe boundary between user-owned and harness-owned content. Preserves all content outside the target section verbatim. |
| 7 | Running Node/npm/npx/tsx as a required user onboarding step | `/harness-init` must work through agent file inspection and file writes. Maintainer smoke scripts are separate from the user path. |
| 8 | Treating plugin-provided skills as target-repo installed skills | Tool indexes describe the target repository only. The `harness-init` skill from this plugin is not a target skill unless the target repo actually contains it under its own `.claude/skills/`. |
| 9 | Adding helper files like `.gitkeep`, supplementary docs, or "integration markers" to round out the apply | The Confirmed_Write_Set is the contract. Anything not in it does not get written. |
| 10 | Writing Node/script onboarding steps into Cursor pair or user-facing docs | User path is agent-native writes after one `yes`; no npx/tsx prerequisite |
| 11 | Mislabeling React `lib/hooks` as "Dynamic Workflow Hooks" | Read the evidence path. Application code hooks are not Harness workflow adapters. |
| 12 | Creating empty or placeholder `steering/harness-recommendations.md` | Steering is conditional. Skip until there is project-specific override content. |

Reporting an anti-pattern that you considered but did not attempt is allowed and does not stop the run.

---

## Markdown layout (root truth files)

Root-level `AGENTS.md`, `CLAUDE.md`, and `steering/*.md` are plain Markdown for agents and human preview — **not** Cursor rule files. `DESIGN.md` may include YAML frontmatter when used for design tokens.

- **Do not** add YAML frontmatter (`---` / `description` / `alwaysApply`) to `AGENTS.md`, `CLAUDE.md`, or `steering/*.md`. Reserve frontmatter for `DESIGN.md` design tokens and `.cursor/rules/*.mdc` only. Leading `---` blocks confuse many previews when they are unrelated to repo truth.
- **Tables:** Use only when rows are short. Put a blank line before the table. Separator row must use spaced pipes: `| --- | --- |`, never tight `|---|---|`.
- **Prefer lists** for Quick Reference, skill indexes, conflict/decision priority, and any cell with long Chinese prose. Ordered lists for ranked rules; bullet lists for paths and tools.

## Style Scaffolds

These are stylistic references, not output. Final bytes are agent-written.

The scaffolds below live alongside this file under `ai-ide/skills/harness-init/scaffolds/`. They show the canonical heading structure and tone — your Drafts should feel similar but reflect this project's actual facts, protocol, and design evidence. Do not paste these verbatim.

<!-- file: ai-ide/skills/harness-init/scaffolds/agents.md -->

```markdown
<!-- Style scaffold extracted from agents.generator.ts during agent-as-writer task 3.1. Reference material — final bytes are agent-written. -->
# AGENTS.md (Facts)

> Project facts: this file answers "what does this repository look like?" Only verifiable facts go here.

## Project Overview

`acme-web` is a typescript / javascript monorepo project. Primary frameworks: react, vite, express.

## Workspace Layout

- `apps/`
- `packages/`
- `scripts/`
- `docs/`

## Key Technologies

- Languages: typescript, javascript
- Runtimes: node
- Frameworks: react, vite, express
- Package managers: pnpm

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
- **Steering rules index:** `steering/`
- **Harness recommendations:** `steering/harness-recommendations.md`

## AI Assistant Tool Index

> HARNESS_DYNAMIC skill index block

### .claude/skills/

- `example-skill` — Include only if this skill physically exists under the target repository's `.claude/skills/`.

Do not list plugin-provided `harness-init` here.

## Code Hooks (React) — or skip this section

> HARNESS_DYNAMIC code-hooks block
Use this heading when grounding finds React/application hooks (for example `lib/hooks/`).
Describe the actual path and purpose. Do not call them workflow adapters.

If grounding finds IDE/tool hooks instead (for example `.claude/hooks/`), use a factual heading such as `IDE Workflow Hooks` and cite the config path.

If no hook evidence exists, omit this section entirely.

## Detailed Rule Files

- **Harness recommendations:** `steering/harness-recommendations.md` (only when that file exists with real overrides)
- **Design system:** `DESIGN.md` (conditional; product, visual, interaction, brand, content, or DX design)
```

<!-- file: ai-ide/skills/harness-init/scaffolds/claude.md -->

```markdown
<!-- Style scaffold extracted from claude.generator.ts during agent-as-writer task 3.1. Reference material — final bytes are agent-written. -->
# CLAUDE.md (Protocol)

> Project protocol: this file answers "how do we do things in this repository?"

## Language & Tone

Resolved locale for this file and sibling AI entry docs — **#1 is a hard override**:

1. Explicit user locale instruction this session — overrides 2–4 even when existing entry docs use another language.
2. Primary language of existing root `AGENTS.md`, `CLAUDE.md`, or `DESIGN.md` body prose.
3. Evidence from `README`, `docs/`, comments, and commit samples the agent read.
4. Language of the current `/harness-init` conversation.
5. If still unclear — ask once; do not silently default to Chinese or English.

Within one `/harness-init` run, `AGENTS.md`, `CLAUDE.md`, conditional `DESIGN.md`, and `steering/harness-recommendations.md` body prose share the same resolved locale.

- Be direct, fact-based, friendly without emoji.

## Conflict Resolution

1. Explicit user instruction in the current turn
2. Root-level `AGENTS.md`
3. Root-level `CLAUDE.md`
4. Root-level `DESIGN.md` for design and experience decisions
5. Matching `steering/*.md`
6. Tool adapter files

## Decision Priority

1. Testability
2. Readability
3. Consistency
4. Simplicity
5. Reversibility

## Development Principles

- **Incremental Progress** — Prefer small, verifiable, reversible changes
- **Context First** — Understand the existing implementation before proposing
- **Pragmatism Over Dogma** — Real project constraints win over abstract rules
- **Update Before Create** — Update existing docs and rules before introducing new ones

## Harness Collaboration

> HARNESS collaboration-principles block
Follow the user's explicit instruction in the current turn first.
Root AGENTS.md provides facts; CLAUDE.md provides protocol.
DESIGN.md provides design and experience direction only when the project has a visible/product/DX surface.
Third-party workflows only identify, map, and suggest — they never replace the truth layer.
Harness is initialized only via `/harness-init` inside the IDE; never instruct the user to run terminal `harness`, `npm install`, or maintainer TypeScript scripts.
On user `yes`, write only the confirmed Draft bytes directly; do not require Node/npm/npx/tsx or `.harness/runs/` artifacts for onboarding.
Default to incremental merge (`patch-section`) so existing user content is preserved.
```

<!-- file: ai-ide/skills/harness-init/scaffolds/design.md -->

```markdown
<!-- Style scaffold for conditional DESIGN.md. Reference material — final bytes are agent-written. -->
# DESIGN.md (Design)

> Product and experience design: this file answers "what should this product, UI, brand, content, or DX feel like?"
> Project facts belong in `AGENTS.md`; collaboration protocol belongs in `CLAUDE.md`.

## Design Intent

- **Audience:** users of this project's visible or experiential surface.
- **Primary experience:** describe the actual work surface, gameplay, documentation flow, plugin UI, or developer workflow.
- **Not this:** name the visual or UX direction the project should avoid.

## Color

- Background:
- Surface:
- Text:
- Accent:
- Status colors:

## Typography

- UI text:
- Code, paths, IDs:
- Headings:
- Dense surfaces:

## Layout

- First screen:
- Primary navigation:
- Main work surface:
- Responsive behavior:
- Stable fixed-format elements:

## Components

| Component | Usage | Notes |
| --- | --- | --- |
| Primary action | Key progress, save, confirm | High contrast |
| Secondary action | Cancel, back, lightweight toggle | Lower weight |
| Feedback | Save, error, loading, empty state | Short and actionable |

## Motion

- Use motion for feedback and state changes.
- Avoid decorative motion unrelated to product state.

## Voice

- UI copy:
- Error copy:
- Empty states:

## Brand & Assets

- Brand signals:
- Primary assets:
- Icon style:
- Asset source of truth:

## Accessibility

- Keyboard:
- Focus:
- Contrast:
- Touch/mobile:

## Anti-patterns

- Do not create a generic landing page when the product needs a usable work surface.
- Do not add decorative gradients, orbs, bokeh, or glass effects without product meaning.
- Do not compress long text into buttons, cards, table cells, or fixed tiles.
- Do not commit `.od/` runtime data.

## Change Log

| Date | Change | Notes |
| --- | --- | --- |
| YYYY-MM-DD | Initial design entry | Based on repo evidence. |
```

<!-- file: ai-ide/skills/harness-init/scaffolds/steering-harness-recommendations.md -->

```markdown
<!-- Style scaffold — SKIP unless you have real project-specific overrides. No frontmatter. -->
# steering/harness-recommendations.md

> Local overrides for project-specific behaviour only.
> If you have nothing concrete to add, choose `skip` for this file instead of creating it.

## Scope

- Applies to: `<path-or-area>`
- Does not replace AGENTS.md or CLAUDE.md.

## Override: <topic>

- Rule that belongs here because it is path-specific or task-specific.
- Evidence: `<file or directory that triggered this override>`
```

<!-- file: ai-ide/skills/harness-init/scaffolds/cursor-pair.md -->

```markdown
<!-- Style scaffold extracted from cursor.generator.ts during agent-as-writer task 3.1. Reference material — final bytes are agent-written. -->

<!-- file: .cursor/rules/harness.mdc -->
---
description: Cursor rule pack generated from Harness grounding
alwaysApply: true
---

# Cursor Harness Rules

> Cursor-private rules complement the root truth layer; they do not replace it.

## Grounding Summary

- shape: monorepo · languages: typescript, javascript · frameworks: react, vite, express · commands: dev, build, test, lint

## Recommended Files

| Path | Purpose |
| --- | --- |
| AGENTS.md | Project facts |
| CLAUDE.md | Collaboration protocol |
| DESIGN.md | Conditional design system when UI/product/DX evidence exists |
| steering/*.md | Local overrides |
| .cursor/commands/harness-init.md | The single Cursor entry point: `/harness-init` |

## Harness Cursor Guidance

> HARNESS Cursor adapter block
Read the root-level AGENTS.md / CLAUDE.md / DESIGN.md before applying any Cursor-private rule.
Harness is initialized only via `/harness-init` inside the IDE; never instruct the user to run terminal `harness` commands.
The agent orchestrates grounding, read, judge & draft, one yes/no confirm, and apply. It does not require Node/npm/npx/tsx or `.harness/runs/` artifacts for user onboarding.
On user `yes`, freeze the Confirmed_Write_Set and write only those files.
Default to incremental merge so existing user content is preserved.

<!-- file: .cursor/commands/harness-init.md -->
# Harness Init

Target project: `acme-web`.

## Detected Context

- shape: monorepo · languages: typescript, javascript · frameworks: react, vite, express · commands: dev, build, test, lint

## Cursor Command Contract

> HARNESS Cursor init command
This is the only Harness onboarding command. Do not ask the user to run terminal `harness`, `npm install`, or `npm run smart`.
Step 1 — Grounding: establish stacks, frameworks, and AI tool traces from repo inspection.
Step 2 — Read & Judge: read Root_Truth_Files, apply Sanity_Floor / Section_Boundary / Empty_Draft checks.
Step 3 — Draft & Confirm: prepare drafts, present summary, ask one yes/no.
Step 4 — Confirm Write Set: on `yes`, freeze the exact Draft bytes.
Step 5 — Apply: write confirmed files only — no re-grounding, no plan recomputation.
Do not require `.harness/runs/` artifacts or TypeScript maintainer scripts for this command.

## Confirmation Rule

Apply only after the user explicitly confirms in chat. Do not show file-level Plan internals unless the user asks. If the user declines, leave target configuration files unchanged.
```
