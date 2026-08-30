# Stateful Operations and Recovery

> Optional steering reference for repositories that actually own installers, migrations, caches, build artifacts, resumable jobs, or other persistent operational state. Adapt it to observed project owners and paths; do not generate it for stateless repositories.

## Identity

- Separate input fingerprints from produced artifact identity.
- Artifact identity may use sorted logical relative paths, bytes, and sizes. Exclude workspace, checkout, run, generation, cache-root, and absolute host paths unless path changes product semantics.
- Record resolved dependency or image versions for observability; do not turn one run's resolution into a permanent pin without a compatibility requirement.

## Idempotent install

- Prefer one idempotent `install` or reconcile operation over separate install/update implementations.
- Define empty, existing, partial, cancelled, retried, and already-complete states.
- Re-running converges to the same target state without duplicate records or user cleanup.

## Transaction and recovery units

- Keep network calls, user waits, hashing, and long computation outside database transactions.
- Commit one recoverable logical artifact at a time; use a larger unit only when splitting it would expose invalid partial state.
- Checkpoint progress with the artifact it represents. On cancellation, stop claiming new work and let the current small unit commit or roll back.
- A stale or interrupted owner is reconciled automatically before new work starts.

## Clean and automatic maintenance

- Provide an explicit clean operation for project-owned, regenerable caches and scratch state.
- Automatically remove invalid, partial, superseded, or abandoned cache entries during normal operation.
- Preserve user/business state, databases, formal evidence, and shared global caches unless the command explicitly names them.
- Cleanup warnings stay observable but do not rewrite an already successful primary outcome.

## Scoped concurrency

- Assign one writer per logical artifact, module, file, or migration contract.
- Independent artifacts may proceed concurrently; avoid repository-wide locks and long-lived global transactions.
