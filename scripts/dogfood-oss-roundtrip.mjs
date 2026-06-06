import path from 'node:path';
import {
  runInitRecordPlan,
  runInitApplyFromPlan,
} from '../templates/auto-detect/init-pipeline.ts';

const repoPath = process.argv[2];
const detectRunId = process.argv[3];
if (!repoPath || !detectRunId) {
  console.error('Usage: dogfood-oss-roundtrip.mjs <repoPath> <detectRunId>');
  process.exit(1);
}

const abs = path.resolve(repoPath);
const agents = `# AGENTS.md (Harness dogfood)\n\n> Facts for ${path.basename(abs)} — single-package Node library.\n\n## Project Overview\n\nSmall npm package; see upstream README.\n\n## Build, Test & Development Commands\n\n| Name | Command | Source |\n| --- | --- | --- |\n| test | \`npm run test\` | package.json |\n`;

const claude = `# CLAUDE.md (Harness dogfood)\n\n> Protocol stub from /harness-init dogfood on external OSS repo.\n`;

const steering = `# steering/harness-recommendations.md\n\n> Local overrides (empty scaffold).\n`;

const record = await runInitRecordPlan({
  targetPath: abs,
  detectRunId,
  entries: [
    {
      path: path.join(abs, 'AGENTS.md'),
      action: 'create',
      content: agents,
      evidenceReason: 'No root AGENTS.md; detection reported rootTruth: false',
    },
    {
      path: path.join(abs, 'CLAUDE.md'),
      action: 'create',
      content: claude,
      evidenceReason: 'No root CLAUDE.md; create protocol scaffold',
    },
    {
      path: path.join(abs, 'steering', 'harness-recommendations.md'),
      action: 'create',
      content: steering,
      evidenceReason: 'No steering harness file; create empty scaffold',
    },
  ],
  skipped: [
    {
      path: path.join(abs, '.cursor', 'rules', 'harness.mdc'),
      reason: 'Cursor not detected in detection.json',
    },
    {
      path: path.join(abs, '.cursor', 'commands', 'harness-init.md'),
      reason: 'Cursor not detected in detection.json',
    },
  ],
  summary: [
    `${path.join(abs, 'AGENTS.md')} | create | evidence: no root AGENTS.md`,
    `${path.join(abs, 'CLAUDE.md')} | create | evidence: no root CLAUDE.md`,
    `${path.join(abs, 'steering', 'harness-recommendations.md')} | create | evidence: no steering file`,
  ].join('\n'),
});

const apply = await runInitApplyFromPlan(abs, record.runId);
const shaOk = apply.result.writtenEntries.every(
  (w) => w.success && w.actualSha256 === w.intendedSha256,
);

console.log(
  JSON.stringify(
    {
      planRunId: record.runId,
      applyRunId: apply.runId,
      counts: apply.result.counts,
      shaAllMatch: shaOk,
    },
    null,
    2,
  ),
);
