<!-- Style scaffold extracted from claude.generator.ts during agent-as-writer task 3.1. Reference material — final bytes are agent-written. -->
# CLAUDE.md (Protocol · 法)

> Project protocol: this file answers "how do we do things in this repository?"

## Layered Model (法 → 事 → steering → docs)

```text
法 (this file) → 事 (AGENTS.md) → steering/ → docs/ (human background, NOT AI truth)
```

**Read both 事 and 法 every session.** Layering describes the stack; on factual conflict **`AGENTS.md` wins over this file** after your explicit instruction (see Conflict Resolution).

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
2. Root-level `AGENTS.md` (事)
3. Root-level `CLAUDE.md` (法)
4. Root-level `DESIGN.md` for design and experience decisions
5. Matching `steering/*.md`
6. Human `docs/**` — background only; never overrides 事/法/steering
7. Tool adapter files

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

## Collaboration

Follow the user's explicit instruction in the current turn first.
Root `AGENTS.md` provides facts; this file provides protocol.
`DESIGN.md` covers design and experience only when the project has a visible/product/DX surface.
Third-party workflows only identify, map, and suggest — they never replace the truth layer.

## Maintenance Commands

| Command | When |
| --- | --- |
| `/revise-ai-docs` | Session end — learnings to AGENTS / CLAUDE / steering |
| `/project-ai-docs-steward` | Periodic audit — report before edits |
| `/update-docs` | Sync human `docs/` and README (not AI truth) |
