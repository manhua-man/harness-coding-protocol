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

**Entry docs are task-scoped, not a pre-read checklist.** Use root `AGENTS.md` and `CLAUDE.md` as the authority for facts and protocol. Read only what the current task needs — do not load the full doc stack, repo map, or unrelated skills before a small reversible change. If only one entry file is injected, read the other when the task needs facts or protocol you do not already have. Do not infer commands or protocol from `docs/` alone.

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

---

## Communication

- **Conclusion first** — State the answer, decision, or outcome before background detail when the user asked for action or a judgment.
- **Paragraphs over decoration** — Prefer clear prose. Use lists or tables only when comparing options, enumerating paths, or ranking rules — not as default formatting.
- **Honest delivery** — Say what was done, what was verified, and what remains limited. Do not stop at capability acknowledgment or a plan when the user asked for execution.
- **Direct disagreement** — If a user suggestion conflicts with correctness, scope, or repository contracts, say so and propose a better path. Do not agree for politeness.
- **No hypothetical disclaimers** — Do not add warnings for risks outside the current task scope unless they are concrete and actionable.

---

## Where to Read Project Facts

All verifiable overview, layout, ports, scripts, and module tables use root `AGENTS.md` as sole truth. This file does not repeat them. Visual, interaction, brand, content tone, and experience anti-patterns belong in `DESIGN.md`, not here.

---

## Conflict Resolution

When rules conflict, resolve in this order:

1. User's explicit instruction for the current session
2. Root `AGENTS.md` (事 — verifiable facts)
3. Root `CLAUDE.md` (法 — collaboration protocol)
4. Matching repository-owned skill or command — only when the user invoked it or the task clearly matches its narrow scope; skills do not override 事/法 on facts or global protocol
5. Matching `steering/*.md` (scoped overrides)
6. Root `DESIGN.md` (design and experience questions only)
7. Human `docs/**` — background only; **never overrides** 事/法/steering
8. Tool adaptation files (compatibility only; do not override truth)

If a skill or steering file causes unnecessary pauses, approval loops, or incomplete work, name the file, quote the relevant instruction, and explain how it applies before stopping.

---

## Decision Priority

1. **Correctness, explicit authorization, and user-owned data** — Does it preserve current contracts, the user's chosen scope, and data the user owns?
2. **Testability and verifiability** — Can reliable evidence prove the behavior?
3. **Consistency** — Does it follow current repository and product truth?
4. **Simplicity and readability** — Is it the clearest maintainable solution for current needs?
5. **Reversibility** — If direction is wrong, how costly is rollback?

---

## Development Principles

- **Incremental Progress** — Prefer small, verifiable, reversible changes.
- **Task-Scoped Context** — Read code, configs, and docs that the current task actually needs. Do not pre-read the whole repository, full doc tree, or unrelated skills before small reversible work.
- **Pragmatism Over Dogma** — Real project constraints win over abstract rules.
- **Update Before Create** — Update existing docs and rules before introducing duplicate sources.
- **Complexity Must Be Earned** — Prefer deletion and standard primitives. Add permanent state, locks, hashes, receipts, caches, wrappers, or gates only when observed recurring work justifies their ongoing cost.
- **Scoped Ownership** — Parallel work uses one writer per module or file set; do not lock an entire repository when write scopes are disjoint.
- Optional engineering methods such as M5 and Karpathy examples belong in explicitly selected, reference-only `steering/` files rather than mandatory protocol.

---

## Completion and Decision Boundaries

**Completion.** When the user asks for action, carry the authorized scope to a reviewable result. Do not stop at capability acknowledgment, a plan only, or a partial solution unless the user asked to stop there. If the task includes implementation, verification, and fixing failures caused by the change, treat that as one scope unless the user narrows it.

**Reversible work first.** For work that is reversible, read-only, local, or already authorized by context, proceed without re-asking at each step. Ask before irreversible, production, deploy, merge, publish, or externally visible actions — or when authorization is genuinely unclear.

**Intentional safeguards vs accidental friction.** Preserve explicit approval requirements for high-risk boundaries (auth, secrets, user data, payments, migrations, production, destructive operations). Remove or narrow blanket "always ask", "always read everything first", or "always run the full test suite" rules that apply to routine low-risk work.

**Testing proportionality.** Run verification appropriate to the change and stated risk. Do not add broad test sweeps for trivial reversible edits; expand testing when the change, failures, or unresolved concerns justify it. Prefer `AGENTS.md` targeted validation routes over repeating test policy here.

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
2. **Invariants** — state what data, compatibility, current contract, and authorization boundaries must remain true.
3. **Plan** — define the minimal write scope, owner, verification, and rollback or failure handling.
4. **Execute** — implement only the confirmed scope and preserve user changes.
5. **Review** — inspect the actual diff and verify invariants with tests, builds, logs, or runtime evidence.

Use the full gate for auth, secrets, user data, migrations, payments, deploys, destructive actions, explicit threat-model work, or cross-boundary contracts. Use `understand → implement → verify` for low-risk reversible work. Do not turn generic safety/security concerns into work without a concrete boundary or request. Do not require `[MODE: ...]` declarations.

---

## Cross-Platform Notes

- Command examples default to Unix shell; on Windows also provide PowerShell equivalents
- Prefer repo-relative paths in path descriptions
- Local tool adaptation files are compatibility only; they must not override root truth

---

## Specialized Tool Gates (Protocol examples)

List **when** a tool is mandatory — not "before every delivery." Prefer a three-column table; route product-specific paths in **`AGENTS.md`**.

| Scenario | When required | Entry |
| --- | --- | --- |
| Code/architecture review | High-risk paths (payments, auth, migrations, cross-boundary contracts) or user asks for review — **not** typos/docs-only | e.g. `/code-review-linus` |
| AI entry doc refactor | Layering or steering scope changes across multiple files | `/revise-ai-docs` or steward skill |
| Single-line fact fix | Port, command, or link correction | Edit `AGENTS.md` / `CLAUDE.md` directly |
| Human `docs/` sync | API/ops docs drift from implementation or user asks | `/update-docs` |
| Test-pattern review | Large `*.spec.ts` / Jest config churn | Named test reviewer agent |

If a row would apply to **all** code changes, narrow it or move detail to a risk-tiered skill.

---

## Maintenance Commands

When the harness-coding-protocol plugin is installed, keep entry docs accurate from **this repository**:

| Command | When |
| --- | --- |
| `/revise-ai-docs` | End of session — learnings back to AGENTS / CLAUDE / steering |
| `/project-ai-docs-steward` | Periodic audit — report before edits |
| `/update-docs` | Sync human `docs/` and README (not AI truth) |
