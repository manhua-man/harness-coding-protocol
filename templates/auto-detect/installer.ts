/**
 * Backup and rollback utilities for the v2.0.0 apply path.
 *
 * Per design.md §Components and Interfaces, this module exposes only the
 * four backup/rollback helpers that survive the agent-as-writer rewrite:
 *
 *   - {@link createBackup}        — capture a timestamped copy before apply
 *   - {@link pruneBackups}        — keep at most N rotations per file
 *   - {@link rollbackLatestBackup} — restore the newest backup of one file
 *   - {@link rollbackLastApply}   — restore the most recent v2 apply run
 *
 * The v1.x plan/apply/install pipeline (`createPlan`, `applyPlan`, `install`,
 * generators, merge engine, reporters) was retired in task 2.x of the
 * agent-as-writer spec; the apply contract is now driven by the
 * Hash_Recorded_Plan in `apply-from-plan.ts`. `rollbackLastApply` consumes
 * the v2 {@link ApplyResultV2} `writtenEntries` array, so it stays
 * compatible with the new artifact shape.
 *
 * Node built-ins only — AGENTS.md mandates the runtime stays free of
 * external dependencies.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import {
  findLatestRun,
  readRunResult,
  type ApplyResultV2,
  type RollbackResult,
  type WrittenEntry,
} from './run-contract.js';

const DEFAULT_BACKUP_KEEP = 5;

/**
 * Copy `filePath` to `<filePath>.backup.<timestamp>` if the file exists,
 * then prune older backups so at most `keep` rotations remain.
 *
 * Returns the backup path on success, or `undefined` when `filePath` did
 * not exist (the caller's `create` action does not need a backup).
 */
export async function createBackup(
  filePath: string,
  timestamp: string,
  keep: number = DEFAULT_BACKUP_KEEP,
): Promise<string | undefined> {
  try {
    await fs.access(filePath);
  } catch {
    return undefined;
  }

  const backupPath = `${filePath}.backup.${timestamp}`;
  await fs.copyFile(filePath, backupPath);
  await pruneBackups(filePath, keep);
  return backupPath;
}

/**
 * Remove all but the most recent `keep` backup rotations of `filePath`.
 *
 * Backups are matched by the `<basename>.backup.` prefix in `filePath`'s
 * directory and ranked by mtime so the most recent rotations survive
 * regardless of timestamp string formatting. Returns the absolute paths of
 * backups that were removed.
 */
export async function pruneBackups(
  filePath: string,
  keep: number = DEFAULT_BACKUP_KEEP,
): Promise<string[]> {
  const dir = path.dirname(filePath);
  const prefix = `${path.basename(filePath)}.backup.`;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const backups: Array<{ file: string; mtimeMs: number }> = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.startsWith(prefix)) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    const stats = await fs.stat(fullPath);
    backups.push({ file: fullPath, mtimeMs: stats.mtimeMs });
  }

  backups.sort((a, b) => b.mtimeMs - a.mtimeMs);

  const removed: string[] = [];
  for (const item of backups.slice(keep)) {
    await fs.rm(item.file, { force: true });
    removed.push(item.file);
  }
  return removed;
}

/**
 * Restore the newest `<filePath>.backup.*` rotation in place over
 * `filePath`. Returns the absolute path of the backup that was restored,
 * or `undefined` when no backup exists.
 */
export async function rollbackLatestBackup(filePath: string): Promise<string | undefined> {
  const resolved = path.resolve(filePath);
  const dir = path.dirname(resolved);
  const prefix = `${path.basename(resolved)}.backup.`;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const backups: Array<{ file: string; mtimeMs: number }> = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.startsWith(prefix)) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    const stats = await fs.stat(fullPath);
    backups.push({ file: fullPath, mtimeMs: stats.mtimeMs });
  }

  backups.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const latest = backups[0];
  if (!latest) {
    return undefined;
  }

  await fs.copyFile(latest.file, resolved);
  return latest.file;
}

/**
 * Roll back the most recent successful v2 apply run for `targetPath`, or
 * the run identified by `runId` when supplied. Reads the run's
 * `result.json` ({@link ApplyResultV2}) and walks `writtenEntries` in
 * reverse:
 *
 *  - entry has a `backupPath` ⇒ copy backup over the file (restored).
 *  - entry has `action === 'create'` and no backup ⇒ delete the file
 *    (deleted; the file did not exist pre-apply).
 *  - entry failed to write or has no recoverable prior state ⇒ skipped.
 *
 * Returns a {@link RollbackResult} with the per-category file lists. When
 * no apply run is found and no `runId` is supplied, returns a result with
 * empty lists so callers can render "nothing to roll back".
 */
export async function rollbackLastApply(
  targetPath: string,
  runId?: string,
): Promise<RollbackResult> {
  const targetRoot = path.resolve(targetPath);
  const applyRun = runId
    ? { runId }
    : await findLatestRun(
        targetRoot,
        (manifest) =>
          manifest.mode === 'apply' && manifest.exitCode === 0 && Boolean(manifest.result),
      );

  if (!applyRun) {
    return {
      targetPath: targetRoot,
      mode: 'rollback',
      restored: [],
      deleted: [],
      skipped: [],
      counts: { restored: 0, deleted: 0, skipped: 0 },
    };
  }

  const result = await readRunResult<ApplyResultV2>(targetRoot, applyRun.runId);
  const restored: string[] = [];
  const deleted: string[] = [];
  const skipped: string[] = [];

  const writtenEntries: WrittenEntry[] = Array.isArray(result.writtenEntries)
    ? [...result.writtenEntries].reverse()
    : [];

  for (const entry of writtenEntries) {
    const filePath = path.resolve(entry.path);

    if (!entry.success) {
      skipped.push(filePath);
      continue;
    }

    if (entry.backupPath && (await exists(entry.backupPath))) {
      await fs.copyFile(entry.backupPath, filePath);
      restored.push(filePath);
      continue;
    }

    if (entry.action === 'create') {
      // No backup ⇒ the file did not exist before apply; remove it to
      // restore pre-apply state.
      await fs.rm(filePath, { force: true });
      deleted.push(filePath);
      continue;
    }

    skipped.push(filePath);
  }

  return {
    targetPath: targetRoot,
    mode: 'rollback',
    sourceApplyRunId: applyRun.runId,
    restored,
    deleted,
    skipped,
    counts: {
      restored: restored.length,
      deleted: deleted.length,
      skipped: skipped.length,
    },
  };
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
