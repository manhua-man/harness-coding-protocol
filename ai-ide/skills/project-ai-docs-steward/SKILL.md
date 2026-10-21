---
name: project-ai-docs-steward
description: Audit project entry docs, feature catalogs, and current-result summaries for missing owners, stale claims, and friction. Report before scoped edits.
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Project AI Docs Steward

Maintain **structured entry documentation** so every AI tool reading the target repo gets a consistent stack.

**事 = `AGENTS.md` (Facts)** · **法 = `CLAUDE.md` (Protocol)** — both are mandatory for AI context. Missing 法 → codes without collaboration rules; missing 事 → reasons without correct facts.

**This skill edits target-repo entry markdown and scoped feature documentation only after a quality report and explicit user approval.** Files created by a confirmed `/harness-init` run may still be untracked and remain eligible; unknown untracked files are user-owned and out of scope unless the user names them. Prefer updating existing files over duplicates (`Update Before Create`).

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
- Existing feature catalog, detailed feature owners, and current status summary; resolve existing paths before considering new ones
- Repository-owned skills/commands: `**/*SKILL.md`, `.claude/commands/`, `.cursor/commands/`, `ai-ide/commands/`, `.agents/skills/` (as present)

Record: path, tier, exists/missing, broken links from cursor rules, skill description length and overlap.

### Phase 2: Quality assessment

Score each file (adapt claude-md-improver rubric):

- **AGENTS.md:** commands vs manifests (`package.json`, `Cargo.toml`, …), ports, module paths, steering index, honest AI Assistant Tool Index (repository-owned vs external), **routing-not-recipes** (no step-by-step workflows or blanket pre-read/test rules), targeted validation by risk when present
- **CLAUDE.md:** decision priority once; links to AGENTS; preserves the 法/事/设 division and layered model; no duplicate fact tables; **no blanket "read everything first" or "always run full suite"** unless risk-tiered
- **Engineering ownership:** root protocol owns core principles, requirement/simplification boundaries, completion, and verification; steering adds scenario methods, `AGENTS.md` owns concrete entry points, and skills own workflows. For newly generated protocol, check separately addressable principle headings; preserve equivalent approved structures in existing projects. Tests cannot create requirements, optional methods cannot disable core obligations, and resumability does not authorize new automatic machinery.
- **Steering:** inclusion scope (`always` / `fileMatch` / `manual`); overlap with AGENTS/CLAUDE; broken frontmatter; large `always` files that should be `manual` or `fileMatch`
- **Skills/commands:** short narrow descriptions (target **under ~200 characters**, flag over **~300**); progressive disclosure (router root → deeper docs); overlapping "pick me" descriptions; recipe-style itineraries in root `SKILL.md`; contradictions with AGENTS/CLAUDE on autonomy, approval, reading, testing, or completion
- **Rule value:** each durable rule has current evidence, an owner/caller, demonstrated recurrence or future decision value, and lower ongoing cost than the problem it prevents
- **Cursor rules:** index table paths resolvable

**Grades:** A–F (90+ = A).

### Feature documentation assessment

When a catalog exists or the user requests one, read [the feature documentation contract](../documentation-architecture/references/feature-documentation.md). Check coverage against inspected product surfaces, duplicate/missing owners, source/test entry links, result provenance, review dates, and current summaries. Specifically check whether a newer issue is only prepended above an obsolete success claim. Include exact paths, conflicting claims, and inspected coverage in the quality report; unknown or historical results cannot become current passes through documentation edits.

Missing pages may be proposed with concrete paths and evidence; do not force a new tree onto existing adequate documentation. Use the shared assets for approved new pages.

### Phase 2b: Autonomy & friction audit (mandatory)

Audit instructions that may cause unnecessary stops, extra confirmations, incomplete work, over-reading, or over-testing. For each finding:

1. Quote the exact instruction and name the file
2. Explain the likely behavioral effect
3. Label **`intentional safeguard`** (keep) vs **`accidental friction`** (narrow or remove)
4. Propose a minimal edit; flag any edit that **expands agent permissions**

Check these axes:

| Axis | Look for | Typical fix |
|------|----------|-------------|
| **Reading** | "read X before every edit", full repo map pre-read, session-wide doc stack | Task-scoped reading; link routes in AGENTS |
| **Testing** | blanket "always run CI/full suite" for all edits | Risk-tiered targeted validation in AGENTS |
| **Approval** | blanket "ask before continuing" for reversible/local work | Ask only before irreversible/production/external actions |
| **Completion** | stop after plan/partial implementation; RIPER/mode ceremony pulling early stop | Define done in CLAUDE; keep RIPER risk-tiered only |
| **Skills** | long descriptions, overlapping triggers, recipe-style itineraries | Short when-to-use (under ~200 chars); router root; move detail downstream; merge overlapping skills |
| **Gates** | review/audit tools listed as mandatory for all commits; flat skill table | Three tiers: mandatory fail-closed / user-invoked ops / on-demand; match `CLAUDE.md` trigger table |
| **Duplication** | same topic in AGENTS, CLAUDE, always steering, and skills | One owner per topic; merge or delete duplicates |

Prioritize fixes with the largest practical impact. Do not remove intentional production, payment, migration, auth, or destructive-action safeguards.

Optional bibliography: [`docs/maintainers/REFERENCES.md`](../../../docs/maintainers/REFERENCES.md).

### Phase 3: Quality report (mandatory before edits)

Summary + per-file table (scores, issues, recommended fixes) + **Autonomy & friction findings** table (file, quote, effect, intentional vs accidental, proposed fix). No silent writes.

### Phase 4: Proposed diffs

Per change: target file, one-line **why**, minimal diff.

### Phase 5: Apply

Edit only within the approved scope; existing explicit authorization for these edits satisfies confirmation. Validate changed links, section preservation, and detailed-owner/summary consistency. Stable repository facts belong in **AGENTS**; volatile feature results belong in their detailed feature owners, with short entry routes.

## Routing learnings (quick reference)

| Learning type | Target |
|---------------|--------|
| Commands, ports, layout | `AGENTS.md` |
| Repository-owned and recommended external tool routing | `AGENTS.md` tool index, with ownership labels |
| Collaboration, modes, priorities | `CLAUDE.md` |
| Stack-specific conventions | Matching steering file |
| Domain (payment, infra, …) | `manual` steering file |
| Feature capability, validation, issues | Resolved feature owner; sync affected catalog/status summary |
| Long narratives | `docs/` + link from AGENTS |

## Common issues

1. **Missing steering index** — rules point to `project.md` that does not exist
2. **Duplicate content** — same port list in AGENTS and CLAUDE
3. **Stale scripts** — manifest scripts drift vs AGENTS
4. **Always-on steering bloat** — large `inclusion: always` files; prefer `fileMatch`
5. **Broken frontmatter** — invalid YAML on steering files
6. **Incident promotion** — a one-off failure, temporary workaround, or uncertain note became durable protocol without recurrence evidence
7. **Governance overgrowth** — a rule adds more permanent state, gates, hashes, receipts, or maintenance than the observed problem
8. **Accidental friction** — blanket pre-read, over-test, over-ask, or early-stop wording left over from older models
9. **Skill pollution** — too many skills, long descriptions, overlapping triggers, or recipe-style skill bodies
10. **Completion gaps** — protocol stops at plans/partials where the user expects end-to-end delivery

When recommending removal or consolidation, identify the simpler counterfactual and the rule owner that becomes unnecessary. Do not retain a rule merely because it once had a plausible rationale.

## Related commands

- **`/revise-ai-docs`** — session incremental write-back (lighter than full audit)
- **`/update-docs`** — sync human `docs/` with implementation (not AI truth)
- **`/harness-init`** — first-time or major bootstrap of root truth
