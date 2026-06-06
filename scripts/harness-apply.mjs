#!/usr/bin/env node
/**
 * Phase 5 apply wrapper — writes HRP bytes verbatim to disk.
 *
 * Usage:
 *   npx tsx scripts/harness-apply.mjs <target-path> <plan-run-id>
 *
 * Reads .harness/runs/<plan-run-id>/plan.json, writes each entry verbatim,
 * records result.json with SHA-256 round-trip verification.
 *
 * Output (success):
 *   stdout: JSON with { runId, counts, writtenEntries }
 *   exit:   0
 *
 * Output (failure):
 *   stderr: <error message>
 *   exit:   1
 */

import { runInitApplyFromPlan } from '../templates/auto-detect/init-pipeline.ts';

const target = process.argv[2];
const planRunId = process.argv[3];

if (!target || !planRunId) {
  process.stderr.write(
    'Usage: npx tsx scripts/harness-apply.mjs <target-path> <plan-run-id>\n',
  );
  process.exit(1);
}

try {
  const { runId, result } = await runInitApplyFromPlan(target, planRunId);
  process.stdout.write(
    `${JSON.stringify({ runId, counts: result.counts, writtenEntries: result.writtenEntries }, null, 2)}\n`,
  );
  process.exit(result.counts.failed === 0 ? 0 : 1);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
