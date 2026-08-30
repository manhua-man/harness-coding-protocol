<!-- Style scaffold extracted from claude.generator.ts during agent-as-writer task 3.1. Reference material — final bytes are agent-written. -->
# CLAUDE.md (Protocol · 法)

> This file is **Protocol (法)**: it answers "how do we work in this repository?"
> Store decision order, conflict resolution, session protocol, output requirements, and collaboration habits only.
> Project facts live in sibling `AGENTS.md`. Product, visual, interaction, and developer-experience design live in sibling `DESIGN.md` when the project needs them.

**Repo truth entry is fixed at root `AGENTS.md`, `CLAUDE.md`, and scoped `steering/`. Design system entry is `DESIGN.md` on demand.**

## Layered Model (法 → 事 → steering → docs)

```text
法 (this file)   — how to collaborate; how to read and update 事
  → 事 (AGENTS.md) — what the repository is
  → steering/      — scoped local patches or reference cases
  → docs/          — human long-form background (NOT AI truth)
```

**Read both 事 and 法 every session.** If only one is injected, actively read the other. Layering describes responsibilities; verifiable source/manifests/runtime evidence wins factual conflicts and `AGENTS.md` must then be corrected.

## Division of Labor with AGENTS.md / DESIGN.md

| Character | File | Responsibility |
| --- | --- | --- |
| Facts (事) | `AGENTS.md` | Verifiable layout, commands, ports, modules, APIs, and repository conventions |
| Protocol (法) | `CLAUDE.md` | Decision priority, conflict resolution, risk-tiered RIPER Gate, collaboration, and output habits |
| Design (设) | `DESIGN.md` on demand | Product tone, visual tokens, layout, components, motion, copy, brand, and experience anti-patterns |

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

1. Correctness, explicit authorization, and user-owned data
2. Testability and verifiability
3. Consistency with repository and product truth
4. Simplicity, readability, and maintainability
5. Reversibility and minimal necessary change

## Development Principles

- **Incremental Progress** — Prefer small, verifiable, reversible changes.
- **Context First** — Understand the existing implementation before proposing.
- **Pragmatism Over Dogma** — Real project constraints win over abstract rules.
- **Update Before Create** — Update existing docs and rules before introducing duplicate sources.
- **Complexity Must Be Earned** — Prefer deletion and standard primitives. Add permanent state, locks, hashes, receipts, caches, wrappers, or gates only when observed recurring work justifies their ongoing cost.
- **Scoped Ownership** — Parallel work uses one writer per module or file set; do not lock the whole repository when write scopes are disjoint.
- Optional engineering methods such as M5 and Karpathy examples belong in explicitly selected, reference-only `steering/` files rather than mandatory protocol.

## Risk-Tiered RIPER Gate

RIPER is a reasoning gate for high-risk tasks, not a mandatory response-mode ceremony.

1. **Research** — verify source, call paths, data flow, tests, and current truth.
2. **Invariants** — state what data, compatibility, current contract, and authorization boundaries must remain true.
3. **Plan** — define the minimal write scope, owner, verification, and rollback or failure handling.
4. **Execute** — implement only the confirmed scope and preserve user changes.
5. **Review** — inspect the actual diff and verify invariants with tests, builds, logs, or runtime evidence.

Use the full gate for auth, secrets, user data, migrations, payments, deploys, destructive actions, explicit threat-model work, or cross-boundary contracts. Use `understand → implement → verify` for low-risk reversible work. Do not turn generic safety/security concerns into work without a concrete boundary or request. Do not require `[MODE: ...]` declarations.

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
