# CLAUDE.md (Protocol · 法)

> This file is **Protocol (法)**: it answers "how do we work in this repository?"  
> Store decision order, conflict resolution, session protocol, output requirements, and collaboration habits only.  
> Project facts (layout, commands, ports, modules, etc.) live in sibling `AGENTS.md`.
> Product, visual, interaction, and developer-experience design live in sibling `DESIGN.md` when the project needs them.

**Repo truth entry is fixed at root `AGENTS.md`, `CLAUDE.md`, and `steering/`. Design system entry is `DESIGN.md` (use on demand).**

---

## Layered Model (法 → 事 → steering → docs)

```text
法 (this file)  — how to collaborate; how to read and update 事
  → 事 (AGENTS.md) — what the repository is (ports, commands, modules)
  → steering/      — scoped local patches for paths or tasks
  → docs/          — human long-form specs (NOT an AI truth source)
```

**Read both 事 and 法 every session.** If only one file is injected, actively use the other — do not infer commands or protocol from `docs/` alone.

**Layering vs conflict:** the arrow above is the **documentation stack** (法 frames how to work with 事). When the **same topic** appears in multiple layers and they disagree, use **Conflict Resolution** below — **`AGENTS.md` (事) wins over this file (法)** on verifiable facts; your explicit instruction always wins first.

---

## Division of Labor with AGENTS.md / DESIGN.md

| Character | File | Responsibility |
| --- | --- | --- |
| **Facts (事)** | `AGENTS.md` | Verifiable structure, commands, ports, modules, endpoints, commit/PR conventions |
| **Protocol (法)** | **`CLAUDE.md` (this file)** | Decision priority, conflict resolution, risk-tiered RIPER Gate, session protocol, output habits |
| **Design (设)** | `DESIGN.md` (on demand) | Product tone, visual tokens, layout, components, motion, copy, brand, experience anti-patterns |

---

## Language & Tone

Resolved locale for this file and sibling AI entry docs follows this priority — **#1 is a hard override**:

1. **Explicit user locale instruction this session** — overrides priorities 2–4 even when existing entry docs use another language.
2. Primary language of existing root `AGENTS.md`, `CLAUDE.md`, or `DESIGN.md` body prose (when the user did not specify).
3. Evidence from `README`, `docs/`, source comments, and commit/PR/issue samples the agent read.
4. Language of the current `/harness-init` conversation.
5. If still unclear — ask the user once; do not silently default to Chinese or English.

Within a single `/harness-init` run, body prose in `AGENTS.md`, `CLAUDE.md`, conditional `DESIGN.md`, and `steering/harness-recommendations.md` must use the same resolved locale. Table labels **事 / 法 / 设** remain layer notation.

- Direct, fact-based, friendly, no emojis
- Prefer tables, lists, and clear separation for AI and developer readability

---

## Where to Read Project Facts

All verifiable overview, layout, ports, scripts, and module tables use root `AGENTS.md` as sole truth. This file does not repeat them. Visual, interaction, brand, content tone, and experience anti-patterns belong in `DESIGN.md`, not here.

---

## Conflict Resolution

When rules conflict, resolve in this order:

1. User's explicit instruction for the current session
2. Root `AGENTS.md` (事 — verifiable facts)
3. Root `CLAUDE.md` (法 — collaboration protocol)
4. Matching `steering/*.md` (scoped overrides)
5. Root `DESIGN.md` (design and experience questions only)
6. Human `docs/**` — background only; **never overrides** 事/法/steering
7. Tool adaptation files (compatibility only; do not override truth)

---

## Decision Priority

1. **Correctness, safety, and authorization** — Does it preserve user data, security boundaries, and current contracts?
2. **Testability and verifiability** — Can reliable evidence prove the behavior?
3. **Consistency** — Does it follow current repository and product truth?
4. **Simplicity and readability** — Is it the clearest maintainable solution for current needs?
5. **Reversibility** — If direction is wrong, how costly is rollback?

---

## Development Principles

- **Incremental Progress** — Prefer small, verifiable, reversible changes.
- **Context First** — Understand the existing implementation before proposing.
- **Pragmatism Over Dogma** — Real project constraints win over abstract rules.
- **Update Before Create** — Update existing docs and rules before introducing duplicate sources.
- Optional engineering methods such as M5 and Karpathy examples belong in explicitly selected, reference-only `steering/` files rather than mandatory protocol.

---

## Third-Party Workflow Collaboration

Tool and workflow suggestions may appear in `AGENTS.md` §AI Assistant Tool Index from `/harness-init` grounding. Usage principles:

- Route through this repo's root truth and conflict resolution order
- Third-party workflows identify, map, and suggest — they do not replace 事/法
- On conflict, fall back to Decision Priority and the risk-tiered RIPER Gate in this file

---

## Risk-Tiered RIPER Gate

RIPER is a reasoning gate for high-risk tasks, not a mandatory response-mode ceremony.

1. **Research** — verify source, call paths, data flow, tests, and current truth.
2. **Invariants** — state what safety, data, compatibility, and authorization boundaries must remain true.
3. **Plan** — define the minimal write scope, owner, verification, and rollback or failure handling.
4. **Execute** — implement only the confirmed scope and preserve user changes.
5. **Review** — inspect the actual diff and verify invariants with tests, builds, logs, or runtime evidence.

Use the full gate for auth, secrets, user data, migrations, payments, deploys, destructive actions, or cross-boundary contracts. Use `understand → implement → verify` for low-risk reversible work. Do not require `[MODE: ...]` declarations.

---

## Cross-Platform Notes

- Command examples default to Unix shell; on Windows also provide PowerShell equivalents
- Prefer repo-relative paths in path descriptions
- Local tool adaptation files are compatibility only; they must not override root truth

---

## Maintenance Commands

When the harness-coding-protocol plugin is installed, keep entry docs accurate from **this repository**:

| Command | When |
| --- | --- |
| `/revise-ai-docs` | End of session — learnings back to AGENTS / CLAUDE / steering |
| `/project-ai-docs-steward` | Periodic audit — report before edits |
| `/update-docs` | Sync human `docs/` and README (not AI truth) |
