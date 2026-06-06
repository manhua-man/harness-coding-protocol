#!/usr/bin/env node
/**
 * Thin CLI wrapper for runInitRecordPlan.
 *
 * Usage:
 *   npx tsx scripts/harness-record-plan.mjs < input.json
 *   npx tsx scripts/harness-record-plan.mjs --file plan-input.json
 *
 * Input:  RecordPlanInput JSON (targetPath, detectRunId, entries, skipped, summary)
 * Output: RecordPlanResult JSON to stdout
 */

import fs from 'node:fs/promises';
import { runInitRecordPlan } from '../templates/auto-detect/init-pipeline.ts';

async function main() {
  let raw;

  const fileFlag = process.argv.indexOf('--file');
  if (fileFlag !== -1 && process.argv[fileFlag + 1]) {
    raw = await fs.readFile(process.argv[fileFlag + 1], 'utf8');
  } else if (!process.stdin.isTTY) {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    raw = Buffer.concat(chunks).toString('utf8');
  } else {
    process.stderr.write(
      'Usage: harness-record-plan.mjs < input.json\n' +
        '       harness-record-plan.mjs --file plan-input.json\n',
    );
    process.exit(1);
  }

  let input;
  try {
    input = JSON.parse(raw);
  } catch (err) {
    process.stderr.write(`Invalid JSON: ${err.message}\n`);
    process.exit(1);
  }

  const result = await runInitRecordPlan(input);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((err) => {
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
});
