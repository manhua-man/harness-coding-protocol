/**
 * /harness-init — Phase 1 (Ground) wrapper.
 *
 * Thin wrapper around `runInitDetect` from templates/auto-detect/init-pipeline.ts.
 * Runs the deterministic detector once and persists detection.json + manifest.json
 * under `.harness/runs/<detect-run-id>/`. Prints the detect run id on stdout in
 * the exact format the harness-init SKILL.md grep can capture.
 *
 * Usage:
 *   npx tsx scripts/harness-detect.mjs [target-path]
 *
 *   target-path defaults to process.cwd() if omitted.
 *
 * Output (success):
 *   stdout: Detect run: <run-id>
 *   exit:   0
 *
 * Output (failure):
 *   stderr: <error message verbatim>
 *   exit:   1
 *
 * Node built-ins only; no external dependencies.
 */
import { runInitDetect } from '../templates/auto-detect/init-pipeline.ts';

const target = process.argv[2];

if (!target) {
  process.stderr.write(`Detect run target: ${process.cwd()}\n`);
}

try {
  const { runId } = await runInitDetect(target);
  process.stdout.write(`Detect run: ${runId}\n`);
  process.exit(0);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
