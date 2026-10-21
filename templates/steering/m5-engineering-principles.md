# Engineering Decision Methods (M5 Reference)

> Optional methods for a current complexity or design decision. Core obligations are defined by the target repository's `CLAUDE.md`; selecting or omitting this reference does not switch those obligations on or off. Adapt the methods to the actual task, and do not generate this file automatically.

## Complexity Proof Questions

When evaluating an added abstraction or mechanism, answer the relevant questions with concrete evidence. A brief explanation is enough; no fixed report is required for routine edits.

1. What current, observable requirement does it satisfy?
2. What is the simplest standard solution, and why is it insufficient?
3. Which asset, invariant, or measured limit justifies the extra complexity?
4. What state, configuration, dependencies, failure modes, migrations, and tests does it add?
5. Which real runtime caller uses it now? If the consumer is outside the approved scope, defer the helper with its consumer.

## Ablation Verification (消融推演)

After a design or implementation exists, name an added abstraction, wrapper, or intermediate transform. Assume it is removed or inlined, then check whether the remaining behavior and relevant tests still satisfy the requirement. If so, and no current contract or runtime variation needs the layer, remove it. This is a reasoning method, not a requirement to build an alternate implementation or run unrelated tests.

## Asset and Observability Questions

Classify the asset before selecting protection: authority-bearing credential, payment asset, regulated personal data, public identifier, or ordinary business identifier. An identifier is not automatically a secret. Name the actual attacker, authority gained, and current requirement before introducing hashing, key rotation, encrypted lookup, or candidate fallback.

Check whether the proposed mechanism hides non-secret logs, cache state, health, or repair progress from authorized operators without a concrete benefit. Keep real secrets protected; operational visibility does not justify exposing credentials.

## Use

Read only the method relevant to the current decision. Root authorization, requirement, and simplification gates remain authoritative. Stateful recovery methods belong in `stateful-operations.md`; coding examples belong in `karpathy-examples.md`. Availability of a reference does not authorize new infrastructure or make it a pre-read for every change.
