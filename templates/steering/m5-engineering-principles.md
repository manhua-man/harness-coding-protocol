# M5 Engineering Principles

> Optional engineering-method reference. This file is not mandatory protocol and is not generated automatically by `/harness-init`. Adapt it to real project paths, assets, risks, and invariants only when the user explicitly selects it.

## Principles

| Principle | Review question |
| --- | --- |
| Correctness-Constrained KISS | Is this the simplest standard solution that still preserves correctness, safety, and current contracts? |
| Complexity Must Match Asset Value And Proven Risk | What asset is protected, which proven risk is addressed, and how is the benefit verified? |
| Choose The Boring Solution | Can existing repository capabilities or standard primitives solve the problem directly? |
| YAGNI And Complexity Proof | Is there a current caller and evidence that the simpler design is insufficient? |
| Fix Root Causes And Preserve Invariants | Does the change remove the cause or establish an enforceable invariant instead of adding logs, retries, or defaults? |

## Use

- Apply only when the current task or user explicitly opts into M5.
- Replace generic examples with project-specific evidence before relying on them.
- Keep authorization, release gates, and mandatory workflows in `CLAUDE.md`; this reference does not override them.
- Treat `karpathy-examples.md` as a sibling reference that may be used independently.
