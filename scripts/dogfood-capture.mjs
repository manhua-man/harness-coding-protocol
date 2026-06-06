/**
 * Capture detect / plan / apply run ids for dogfood reports (tmpdir, no fixture pollution).
 */
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runInitDetect,
  runInitRecordPlan,
  runInitApplyFromPlan,
} from '../templates/auto-detect/init-pipeline.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixturesRoot = path.join(root, 'templates', 'auto-detect', 'fixtures');

async function capture(fixtureName) {
  const fixturePath = path.join(fixturesRoot, fixtureName);
  const goldenPath = path.join(fixturePath, '_golden-hrp', 'plan.json');
  const goldenPlan = JSON.parse(await fs.readFile(goldenPath, 'utf8'));

  const tmpdir = path.join(
    os.tmpdir(),
    `harness-dogfood-${fixtureName}-${crypto.randomBytes(4).toString('hex')}`,
  );
  await fs.cp(fixturePath, tmpdir, { recursive: true });
  // Drop copied _golden-hrp from tmp if present
  await fs.rm(path.join(tmpdir, '_golden-hrp'), { recursive: true, force: true }).catch(() => {});
  await fs.rm(path.join(tmpdir, '.harness'), { recursive: true, force: true }).catch(() => {});

  const detect = await runInitDetect(tmpdir);
  const abs = (p) => p.replace('/TARGET', tmpdir.replace(/\\/g, '/'));

  const entries = goldenPlan.entries.map((e) => ({
    path: abs(e.path),
    action: e.action,
    content: e.content,
    evidenceReason: e.evidenceReason,
  }));

  const skipped = (goldenPlan.skipped ?? []).map((s) => ({
    path: abs(s.path),
    reason: s.reason,
  }));

  const record = await runInitRecordPlan({
    targetPath: tmpdir,
    detectRunId: detect.runId,
    entries,
    skipped,
    summary: goldenPlan.summary.replace(/\/TARGET/g, tmpdir.replace(/\\/g, '/')),
  });

  const apply = await runInitApplyFromPlan(tmpdir, record.runId);

  const shaOk = apply.result.writtenEntries.every(
    (w) => w.success && w.actualSha256 === w.intendedSha256,
  );

  const out = {
    fixture: fixtureName,
    tmpdir,
    detectRunId: detect.runId,
    planRunId: record.runId,
    applyRunId: apply.runId,
    counts: apply.result.counts,
    shaAllMatch: shaOk,
    written: apply.result.writtenEntries.map((w) => ({
      path: w.path,
      success: w.success,
      intendedSha256: w.intendedSha256,
      actualSha256: w.actualSha256,
      match: w.actualSha256 === w.intendedSha256,
    })),
  };

  await fs.rm(tmpdir, { recursive: true, force: true }).catch(() => {});
  return out;
}

const names = process.argv.slice(2);
const list = names.length ? names : ['cursor-heavy', 'node-monorepo'];

for (const name of list) {
  const result = await capture(name);
  console.log(JSON.stringify(result, null, 2));
}
