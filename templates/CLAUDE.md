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

For factual conflicts, verifiable source, manifests, and current runtime evidence take precedence over stale entry documentation; correct `AGENTS.md` accordingly. This does not authorize changing the user's requirements or collaboration rules.

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

## Development Practices

- Prefer small, verifiable, reversible changes; preserve existing user edits and keep dependencies explicit.
- Read the code and contracts relevant to the task. Verify that copied feedback refers to the current workspace before acting on it.
- Update existing documents and rules before creating duplicate sources. Route facts and commands through `AGENTS.md`, scoped engineering methods through steering, and operational workflows through their skills.
- Parallel work uses one writer per module or file set; independent write scopes do not require a repository-wide lock.

## Core Engineering Principles

### Correctness-Constrained KISS

Minimize concepts, state, branches, configuration, and dependencies while preserving correctness, safety, and current contracts. Keep data flow direct, readable, and testable; do not add machinery for theoretical completeness or hypothetical requirements.

### Complexity Must Match Asset Value And Proven Risk

Match security layers, locking, and derived data to the protected asset, demonstrated threats, and failure impact. Name the concrete attack path and benefit before adding protection. Preserve visibility of non-secret operational state for authorized operators; credentials, personal data, and payment secrets still require appropriate protection.

### Choose The Boring Solution

Prefer language, database, and existing infrastructure primitives. Add custom state, scripts, wrappers, or frameworks only when the simpler standard solution cannot preserve the required contract. Preserve ownership tokens, lock release, idempotency, and transaction invariants.

### YAGNI And Complexity Proof

Implement confirmed current needs. Before adding an abstraction, compatibility path, configuration, or extension point, identify its current runtime caller, why the simpler solution is insufficient, and the added maintenance and failure cost. A helper used only by its own tests is not a runtime consumer. A requirement to implement X correctly does not establish a requirement to introduce X.

### Fix Root Causes And Preserve Invariants

Remove the cause or establish an enforceable correctness constraint, using transactions, atomic operations, conditional updates, unique constraints, or idempotency as appropriate. Catching errors, logging, defaults, retries, and compensation cannot replace a fix the system can enforce. Preserve historical data meaning and existing callers; report any remaining workaround honestly.

## Requirement Boundary Gate

- Requirements come from the user's request, an approved plan or acceptance criteria, or an applicable current contract. Existing code and tests establish behavior to preserve; they do not independently authorize new product behavior.
- Before non-trivial implementation or its first failing test, briefly state the observable change, semantics to preserve, and expected persistent-state, API, or configuration impact. A conversation note is enough; do not require a new planning document.
- New business state, historical-data semantics, backfills, compensation, dual writes, automatic jobs, compatibility paths, and configuration must trace to that requirement. If support is missing, pause the dependent work, explain the proposed expansion, and continue independent authorized work.
- Tests verify confirmed requirements. A failing test authored by the implementer cannot create a requirement. Review the final diff against the requirement and remove unsupported fields, states, branches, tests, and documentation. Necessary mechanical work within the authorized scope does not need repeated approval.

### Simplification Consistency Gate

For a task to simplify, remove, or withdraw behavior, name the dependencies, state, configuration, branches, and tests to remove, and the single authoritative path that remains. Do not replace deletion with optional dependencies, silent skips, fallbacks, or permanent old/new paths.

Any added structure needs an existing caller or mandatory contract and an explanation of why it cannot be removed. Judge structural reduction rather than line count. Report what was removed and where behavior converged; do not claim simplification when the withdrawn structure remains.

## Completion and Decision Boundaries

**Completion.** When the user asks for action, carry the authorized scope to a reviewable result. Do not stop at capability acknowledgment, a plan only, or a partial solution unless the user asked to stop there. If the task includes implementation, verification, and fixing failures caused by the change, treat that as one scope unless the user narrows it.

**Reversible work first.** For work that is reversible, read-only, local, or already authorized by context, proceed without re-asking at each step. Obtain authorization before irreversible, production, deploy, merge, publish, or externally visible actions; existing explicit authorization satisfies this boundary.

**Scope.** Apply **Precise and Relaxed** (next section). Preserve explicit approval for high-risk boundaries (auth, secrets, user data, payments, migrations, production, destructive operations). Prefer `AGENTS.md` targeted validation routes over repeating test policy here.

**Human decides direction, program owns completion.** Before a destructive or production job, establish the target, authorization, authoritative source, and required writer preconditions. Once authorized, handle expected and classifiable partial states through the same idempotent entry. Stop the current unit on an invariant or infrastructure failure while preserving committed progress. Ask for a business decision only when the remaining meaning is undefined; this does not authorize a new automatic-retry framework.

---

## Precise and Relaxed

Align read, review, test, and edit scope with **task risk and blast radius**.

- **Precise:** When contracts, invariants, registered alignment rules, or high-risk anchors (funds, auth/session, etc.) apply, verify the right implementation details — not directory or path names alone.
- **Relaxed:** Do not pre-read unrelated modules, default to full-suite tests, or drive-by sweeps; reversible small fixes need no ceremonial review.
- **Both hold:** Relaxed reduces friction; it is not permission to skip boundaries that apply.

Product repos may add concrete protocols under this principle (e.g. cross-product reuse or alignment checklists in product `CLAUDE.md`).

---

## Verification Principles

Verify observable behavior with evidence proportional to task risk. Prefer targeted checks; broaden for shared contracts, persistence, authorization, funds, or demonstrated failures. Do not introduce production abstractions solely to make tests easier.

Keep concrete commands and working directories in `AGENTS.md` or the product entry. Pure documentation or reversible low-impact changes do not automatically require new tests or a full regression. Distinguish current execution, historical results, inference, and checks not run.

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

## Feature Documentation Maintenance

When the project maintains feature documents, update the affected detailed owner after implementation or validation changes and reconcile linked summaries. Distinguish current execution, historical results, code inference, and untested behavior; a newly discovered failure must narrow an older success claim. Follow the project’s evidence retention policy. Documentation updates alone do not require a build or full regression.

## Maintenance Commands

When the harness-coding-protocol plugin is installed, keep entry docs accurate from **this repository**:

| Command | When |
| --- | --- |
| `/revise-ai-docs` | End of session — learnings back to AGENTS / CLAUDE / steering |
| `/project-ai-docs-steward` | Periodic audit — report before edits |
| `/update-docs` | Sync human `docs/` and README (not AI truth) |
