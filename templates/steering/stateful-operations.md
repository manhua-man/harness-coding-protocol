# Stateful Operations and Recovery

> Optional reference for repositories with actual installers, migrations, caches, build artifacts, resumable jobs, or persistent operational state. Adapt only the applicable sections to observed owners and paths. Root `CLAUDE.md` defines requirements and authorization; this reference does not authorize new persistent state, backfills, retries, compensation, or automatic cleanup.

## Primitive and State Contracts

Before changing a lock, token, TTL, idempotency key, or state field, identify the acquisition, extension, consumption, release, and retry invariants that apply. Use the narrowest native operation; extending expiry must not overwrite a value that carries ownership. Verify the relevant lifecycle, including wrong-owner and failure paths, rather than only an isolated helper.

## Data Lifecycle and Authority

For a new field or read model, account for new writes, existing records, NULL meaning, backfill requirements, UI/export behavior, rollback, and deployment order. Determine whether existing contracts already authorize those changes before implementation.

Use the authoritative transactional source for authorization, paid assets, identity repair, and irreversible decisions. Replicas may serve reporting or preflight only when their staleness is acceptable; a final transaction does not by itself establish that a stale preflight is harmless.

## Identity

- Separate input fingerprints from produced artifact identity when both are actually needed.
- Artifact identity may use sorted logical relative paths, bytes, and sizes. Exclude workspace, checkout, run, generation, cache-root, and absolute host paths unless path changes product semantics.
- Record resolved dependency or image versions for observability; do not turn one run's resolution into a permanent pin without a compatibility requirement.

## Idempotent Entry

Prefer one idempotent install or reconcile operation for empty, existing, partial, cancelled, retried, and already-complete states of the same operation. Re-running should converge without duplicate records or manual cleanup. Preserve legitimate business state transitions; this is not a rule to turn order creation or payment processing into an unconditional upsert.

## Transaction and Recovery Units

- Keep network calls, user waits, hashing, and long computation outside database transactions.
- Commit one complete, recoverable logical unit at a time; use a larger unit only when splitting exposes invalid partial state. Multi-step completion relies on re-entry rather than a transaction spanning the whole job.
- When durable progress is already required, commit it with the unit it represents. On cancellation, stop claiming new work and let the current unit commit or roll back.
- Handle expected, classifiable differences and partial states through the same authorized entry. Reconcile a stale or interrupted owner only after the ownership contract establishes it is safe; do not take over a live writer.
- A bounded run may report incomplete work if rerunning the same entry safely continues. Supporting re-entry does not require adding a scheduler, persistent retry ledger, or automatic recovery service.
- Stop the current unit on infrastructure or invariant failure and preserve prior committed units. If the business meaning of a remaining state is undefined, report evidence and request that decision.

## Cleanup and Maintenance

Provide or adapt cleanup for project-owned regenerable caches and scratch state only when the task or existing lifecycle requires it. Automatic deletion of partial, superseded, or abandoned entries needs that same scope and an ownership rule; do not add it merely because this reference mentions cleanup.

Preserve user/business state, databases, formal evidence, and shared global caches unless the command explicitly names them. Cleanup warnings remain observable and do not rewrite an already successful primary outcome.

## Scoped Concurrency

Assign one writer per logical artifact, module, file, or migration contract. Independent artifacts may proceed concurrently; avoid repository-wide locks and long-lived global transactions. Use coordination mechanisms only where real concurrent writers require them.
