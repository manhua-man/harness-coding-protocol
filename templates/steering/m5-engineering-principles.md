# M5 Engineering Principles

> Optional engineering-method reference. This file is not mandatory protocol and is not generated automatically by `/harness-init`. Adapt it to real project paths, assets, risks, and invariants only when the user explicitly selects it.

## Principles

| Principle | Review question |
| --- | --- |
| Correctness-Constrained KISS | Is this the simplest standard solution that still preserves correctness, explicit authorization, user-owned data, and current contracts? |
| Counterfactual Deletion | Can deleting the mechanism or using a standard primitive solve the recurrence? |
| Complexity Must Match Observed Value | Which repeated work is removed, and is that value larger than the ongoing cost of new state, locks, caches, receipts, cleanup, and validation? |
| Choose The Boring Solution | Can existing repository capabilities or standard primitives solve the problem directly? |
| YAGNI And Complexity Proof | Is there a current caller and evidence that the simpler design is insufficient? |
| Fix Root Causes And Preserve Invariants | Does the change remove the cause or establish an enforceable invariant instead of adding logs, retries, or defaults? |
| Observability Before Ceremony | Can an operator directly see real process, service, data, and failure state without reconstructing internal tokens or receipts? |
| Named Threat Requirement | For security hardening, who is the attacker, what is the attack mode, which asset is protected, and what evidence makes the mechanism proportionate? |

## Use

- Apply only when the current task or user explicitly opts into M5.
- Replace generic examples with project-specific evidence before relying on them.
- Keep authorization, release gates, and mandatory workflows in `CLAUDE.md`; this reference does not override them.
- Do not promote speculative hardening into always-on protocol. Threat-model work remains opt-in unless the repository has a concrete, current boundary.
- Treat `karpathy-examples.md` as a sibling reference that may be used independently.
