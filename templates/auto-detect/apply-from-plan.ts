/**
 * Phase 5 of `/harness-init` — the HRP-driven writer.
 *
 * `runInitApplyFromPlan` reads a Hash_Recorded_Plan persisted under
 * `<targetPath>/.harness/runs/<planRunId>/plan.json`, writes each entry's
 * bytes verbatim, records what landed in `result.json`, and returns an
 * {@link ApplyResultV2}. Per design.md §Phase 5 and Property 8, this module
 * is detector-free and plan-free: it does not import the deleted detection,
 * generator, merge-engine, or reporter modules, and it does not call any
 * plan-construction symbol; the apply path no longer recomputes detection
 * or rebuilds a plan.
 *
 * Failure surface (Requirements 6.3, 6.4, 6.5, 6.6, 6.7, 7.7, 9.1, 9.2,
 * 9.3):
 *  - missing `plan.json`, malformed JSON, or HRP schema mismatch ⇒ `Error`
 *    with message `Invalid input: <reason>`. The caller (init-pipeline.ts)
 *    wraps these as {@link ExitCode.INVALID_INPUT} (6).
 *  - per-entry write failure is captured into `WrittenEntry.error` and the
 *    loop continues to the next entry; apply does not abort early
 *    (Requirement 7.7).
 *  - `ApplyResultV2.counts.failed > 0` ⇒ exit code
 *    {@link ExitCode.CONFLICT_DETECTED} (5); otherwise
 *    {@link ExitCode.SUCCESS} (0).
 *
 * Node built-ins only — AGENTS.md mandates the runtime stays free of
 * external dependencies.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import {
  computeContentSha256,
  validateHashRecordedPlan,
  type HashRecordedPlan,
} from './hash-recorded-plan.js';
import {
  ExitCode,
  createRunContext,
  persistRunArtifact,
  type ApplyResultV2,
  type WrittenEntry,
} from './run-contract.js';
import { createBackup } from './installer.js';

/**
 * Read the HRP at `<targetPath>/.harness/runs/<planRunId>/plan.json`, write
 * each entry's bytes verbatim, and persist `result.json` /
 * `manifest.json` under a fresh `<apply-run-id>`.
 *
 * Returns the {@link ApplyResultV2} the caller can use to render the Phase 5
 * report (applied / skipped / failed / backedUp).
 *
 * @throws Error with message `Invalid input: <reason>` when the HRP is
 *   missing, malformed JSON, or fails {@link validateHashRecordedPlan}. No
 *   files on the target tree are created, modified, or deleted in this
 *   case (Property 6).
 */
export async function runInitApplyFromPlan(
  targetPath: string,
  planRunId: string,
): Promise<ApplyResultV2> {
  const plan = await loadAndValidatePlan(targetPath, planRunId);

  const runContext = createRunContext({
    targetPath,
    mode: 'apply',
    command: 'init',
  });

  const writtenEntries: WrittenEntry[] = [];

  for (const entry of plan.entries) {
    const absPath = path.isAbsolute(entry.path)
      ? entry.path
      : path.resolve(runContext.targetPath, entry.path);

    let backupPath: string | undefined;
    try {
      // Create a backup if the file already exists on disk. createBackup
      // returns undefined for not-yet-existing files (handles the `create`
      // action) so we capture whatever it returns.
      try {
        await fs.access(absPath);
        backupPath = await createBackup(absPath, runContext.timestamp);
      } catch {
        // File does not exist; no backup needed.
      }

      // Make sure the parent directory exists, then write the intended
      // bytes verbatim. Read the file back so `actualSha256` reflects what
      // landed on disk (handles atomic-write or filesystem-normalisation
      // semantics where the post-write bytes might differ from the
      // requested bytes — we don't expect any divergence in practice).
      await fs.mkdir(path.dirname(absPath), { recursive: true });
      await fs.writeFile(absPath, entry.content, 'utf8');
      const actualBytes = await fs.readFile(absPath, 'utf8');
      const actualSha256 = computeContentSha256(actualBytes);

      writtenEntries.push({
        path: absPath,
        action: entry.action,
        intendedSha256: entry.contentSha256,
        actualSha256,
        success: true,
        ...(backupPath !== undefined ? { backupPath } : {}),
      });
    } catch (error) {
      // Per Requirement 7.7: capture the failure, continue to the next
      // entry, and do not abort the loop early.
      const message = error instanceof Error ? error.message : String(error);
      writtenEntries.push({
        path: absPath,
        action: entry.action,
        intendedSha256: entry.contentSha256,
        success: false,
        error: message,
        ...(backupPath !== undefined ? { backupPath } : {}),
      });
    }
  }

  const applied = writtenEntries.filter((entry) => entry.success).length;
  // v2 keeps the field for shape compatibility; skip-action entries live in
  // `plan.skipped`, never in `plan.entries`, so apply never observes them.
  const skipped = 0;
  const failed = writtenEntries.length - applied;
  const backedUp = writtenEntries.filter(
    (entry) => entry.backupPath !== undefined,
  ).length;

  const result: ApplyResultV2 = {
    runId: runContext.runId,
    schemaVersion: '2.0.0',
    timestamp: runContext.timestamp,
    targetPath: runContext.targetPath,
    sourcePlanRunId: planRunId,
    writtenEntries,
    counts: { applied, skipped, failed, backedUp },
    rollbackAvailable: backedUp > 0,
  };

  await persistRunArtifact(runContext, {
    result,
    exitCode: failed === 0 ? ExitCode.SUCCESS : ExitCode.CONFLICT_DETECTED,
  });

  return result;
}

async function loadAndValidatePlan(
  targetPath: string,
  planRunId: string,
): Promise<HashRecordedPlan> {
  const planPath = path.join(
    path.resolve(targetPath),
    '.harness',
    'runs',
    planRunId,
    'plan.json',
  );

  let raw: string;
  try {
    raw = await fs.readFile(planPath, 'utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid input: cannot read ${planPath}: ${message}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid input: malformed JSON in ${planPath}: ${message}`);
  }

  try {
    validateHashRecordedPlan(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid input: ${message}`);
  }

  return parsed;
}
