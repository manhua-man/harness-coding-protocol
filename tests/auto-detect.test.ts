import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { detect } from '../templates/auto-detect/detector';
import { applyPlan, createPlan, install, pruneBackups, rollbackLatestBackup } from '../templates/auto-detect/installer';
import { mergeDocuments } from '../templates/auto-detect/merge-engine';
import { createRunContext, persistRunArtifact, readRunPlan } from '../templates/auto-detect/run-contract';
import { harnessDetect } from '../.claude/commands/harness-detect';
import { harnessSetup } from '../.claude/commands/harness-setup';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const fixturesRoot = path.join(repoRoot, 'templates', 'auto-detect', 'fixtures');

describe('detector fixtures', () => {
  it('does not misclassify the minimal fixture as Node', () => {
    const result = detect({ targetPath: path.join(fixturesRoot, 'minimal-repo') });

    expect(result.report.summary.rootTruth).toBe(true);
    expect(result.report.summary.repoShape).toBe('single-package');
    expect(result.report.summary.stacks).not.toContain('node');
  });

  it('detects Cursor, Node, monorepo, framework, and commands', () => {
    const result = detect({ targetPath: path.join(fixturesRoot, 'cursor-heavy') });

    expect(result.report.summary.cursor).toBe(true);
    expect(result.report.summary.stacks).toContain('node');
    expect(result.report.summary.repoShape).toBe('monorepo');
    expect(result.report.summary.frameworks).toEqual(expect.arrayContaining(['react', 'vite']));
    expect(result.report.summary.commands.map((command) => command.name)).toEqual(
      expect.arrayContaining(['dev', 'build', 'test', 'lint']),
    );
  });

  it('detects Claude Code, MCP, and AI trace directories', () => {
    const result = detect({ targetPath: path.join(fixturesRoot, 'claude-mcp') });

    expect(result.report.summary.claudeCode).toBe(true);
    expect(result.report.summary.mcp).toBe(true);
    expect(result.report.summary.aiTraces).toEqual(
      expect.arrayContaining(['agents', 'hooks', 'memory', 'skills', 'subagents']),
    );
  });
});

describe('merge engine', () => {
  it('creates content when existing content is empty', () => {
    const result = mergeDocuments({ existingContent: '', generatedContent: 'hello\n', strategy: 'incremental' });

    expect(result.mergedContent).toBe('hello\n');
    expect(result.conflict).toBe('none');
  });

  it('replaces only an existing Harness marker block', () => {
    const existing = ['keep', '<!-- HARNESS_DYNAMIC_SECTION_START:TEST -->', 'old', '<!-- HARNESS_DYNAMIC_SECTION_END:TEST -->', 'tail'].join('\n');
    const generated = ['head ignored', '<!-- HARNESS_DYNAMIC_SECTION_START:TEST -->', 'new', '<!-- HARNESS_DYNAMIC_SECTION_END:TEST -->'].join('\n');
    const result = mergeDocuments({ existingContent: existing, generatedContent: generated, strategy: 'incremental', blockName: 'test' });

    expect(result.mergedContent).toContain('keep');
    expect(result.mergedContent).toContain('new');
    expect(result.mergedContent).toContain('tail');
    expect(result.mergedContent).not.toContain('old');
    expect(result.mergedContent).not.toContain('head ignored');
  });

  it('does not apply prompt strategy to user-owned content', () => {
    const result = mergeDocuments({ existingContent: 'user content\n', generatedContent: 'generated\n', strategy: 'prompt' });

    expect(result.action).toBe('prompt');
    expect(result.mergedContent).toBe('user content\n');
  });
});

describe('installer modes and rollback', () => {
  it('creates a plan without writing target files', async () => {
    const target = await makeTempDir('harness-plan-');
    const plan = await createPlan({ targetPath: target });

    expect(plan.changes.length).toBeGreaterThan(0);
    expect(plan.recommendations.mustHave.title).toBeTruthy();
    expect(plan.changes.map((change) => path.basename(change.path))).not.toContain('ai-tool-recommendations.md');
    await expect(fs.access(path.join(target, 'AGENTS.md'))).rejects.toThrow();
  });

  it('plans Cursor rules and command templates when Cursor is detected', async () => {
    const target = await makeTempDir('harness-cursor-plan-');
    await fs.mkdir(path.join(target, '.cursor', 'rules'), { recursive: true });
    await fs.writeFile(path.join(target, '.cursor', 'rules', 'main.mdc'), '---\ndescription: existing\n---\n', 'utf8');

    const plan = await createPlan({ targetPath: target });
    const plannedPaths = plan.changes.map((change) => path.relative(target, change.path).replace(/\\/g, '/'));

    expect(plannedPaths).toEqual(
      expect.arrayContaining([
        '.cursor/rules/harness.mdc',
        '.cursor/commands/harness-detect.md',
        '.cursor/commands/harness-setup.md',
      ]),
    );
    await expect(fs.access(path.join(target, '.cursor', 'commands', 'harness-detect.md'))).rejects.toThrow();
    await expect(fs.access(path.join(target, '.cursor', 'rules', 'harness.mdc'))).rejects.toThrow();
  });

  it('applies an existing plan without recomputing detection', async () => {
    const target = await makeTempDir('harness-apply-plan-');
    const plan = await createPlan({ targetPath: target });
    await fs.writeFile(path.join(target, 'package.json'), '{"scripts":{"test":"vitest"}}\n', 'utf8');

    const result = await applyPlan({ plan, mode: 'silent' });

    expect(result.applied.map((change) => change.path)).toContain(path.join(target, 'AGENTS.md'));
    expect(result.applied.map((change) => change.path)).not.toContain(path.join(target, '.cursor', 'rules', 'harness.mdc'));
    await expect(fs.access(path.join(target, 'AGENTS.md'))).resolves.toBeUndefined();
  });

  it('dry-run does not write files', async () => {
    const target = await makeTempDir('harness-dry-run-');
    const result = await install({ targetPath: target, mode: 'dry-run' });

    expect(result.applied).toHaveLength(0);
    await expect(fs.access(path.join(target, 'AGENTS.md'))).rejects.toThrow();
  });

  it('silent writes low-risk creates', async () => {
    const target = await makeTempDir('harness-silent-');
    const result = await install({ targetPath: target, mode: 'silent' });

    expect(result.applied.length).toBeGreaterThan(0);
    await expect(fs.access(path.join(target, 'AGENTS.md'))).resolves.toBeUndefined();
  });

  it('silent skips user-owned files without Harness markers', async () => {
    const target = await makeTempDir('harness-silent-skip-');
    const agentsPath = path.join(target, 'AGENTS.md');
    await fs.writeFile(agentsPath, 'user owned\n', 'utf8');

    const result = await install({ targetPath: target, mode: 'silent' });

    expect(result.applied.map((change) => change.path)).not.toContain(agentsPath);
    await expect(fs.readFile(agentsPath, 'utf8')).resolves.toBe('user owned\n');
  });

  it('confirm can apply explicitly selected paths without prompting', async () => {
    const target = await makeTempDir('harness-confirm-');
    const agentsPath = path.join(target, 'AGENTS.md');
    const result = await install({
      targetPath: target,
      mode: 'confirm',
      interactive: false,
      confirmedPaths: [agentsPath],
    });

    expect(result.applied.map((change) => change.path)).toContain(agentsPath);
    await expect(fs.access(agentsPath)).resolves.toBeUndefined();
  });

  it('interactive confirm applies paths selected through the prompt', async () => {
    const target = await makeTempDir('harness-interactive-confirm-');
    const inquirer = await import('inquirer');
    const originalPrompt = inquirer.default.prompt;

    let sawCheckedDefault = false;
    (inquirer.default as typeof inquirer.default & { prompt: typeof originalPrompt }).prompt = (async (questions: any[]) => {
      const choices = questions[0].choices as Array<{ value: string; checked?: boolean }>;
      const agentsChoice = choices.find((choice) => choice.value.endsWith('AGENTS.md'));
      sawCheckedDefault = choices.some((choice) => choice.checked === true);

      expect(questions[0].type).toBe('checkbox');
      expect(agentsChoice).toBeDefined();

      return { paths: [agentsChoice!.value] };
    }) as typeof originalPrompt;

    try {
      const result = await install({
        targetPath: target,
        mode: 'confirm',
        interactive: true,
      });

      expect(sawCheckedDefault).toBe(true);
      expect(result.applied.map((change) => change.path)).toContain(path.join(target, 'AGENTS.md'));
      await expect(fs.access(path.join(target, 'AGENTS.md'))).resolves.toBeUndefined();
      await expect(fs.access(path.join(target, 'CLAUDE.md'))).rejects.toThrow();
    } finally {
      (inquirer.default as typeof inquirer.default & { prompt: typeof originalPrompt }).prompt = originalPrompt;
    }
  });

  it('creates backups, prunes old backups, and rolls back latest backup', async () => {
    const target = await makeTempDir('harness-backup-');
    const file = path.join(target, 'AGENTS.md');
    await fs.writeFile(file, 'current\n', 'utf8');

    for (let index = 0; index < 7; index += 1) {
      const backup = `${file}.backup.2026042100000${index}`;
      await fs.writeFile(backup, `backup ${index}\n`, 'utf8');
      const time = new Date(2026, 3, 21, 0, 0, index);
      await fs.utimes(backup, time, time);
    }

    const removed = await pruneBackups(file, 5);
    const backups = (await fs.readdir(target)).filter((entry) => entry.startsWith('AGENTS.md.backup.'));
    expect(removed).toHaveLength(2);
    expect(backups).toHaveLength(5);

    await fs.writeFile(`${file}.backup.20990101000000`, 'restored\n', 'utf8');
    const restoredFrom = await rollbackLatestBackup(file);
    expect(restoredFrom).toContain('20990101000000');
    await expect(fs.readFile(file, 'utf8')).resolves.toBe('restored\n');
  });
});

describe('run artifact contract', () => {
  it('persists a manifest with stable schema fields', async () => {
    const target = await makeTempDir('harness-run-contract-');
    const detection = detect({ targetPath: target });
    const context = createRunContext({
      targetPath: target,
      mode: 'detect',
      command: 'detect',
      runId: '20260421-010203-abcdef',
      timestamp: '2026-04-21T01:02:03.000Z',
    });

    const manifest = await persistRunArtifact(context, {
      detection,
      nextActions: ['harness plan --from-run 20260421-010203-abcdef'],
    });

    expect(manifest.runId).toBe('20260421-010203-abcdef');
    expect(manifest.schemaVersion).toBe('1.0.0');
    expect(manifest.mode).toBe('detect');
    await expect(fs.access(path.join(target, '.harness', 'runs', manifest.runId, 'manifest.json'))).resolves.toBeUndefined();
    await expect(fs.access(path.join(target, '.harness', 'runs', manifest.runId, 'detection.json'))).resolves.toBeUndefined();
  });
});

describe('CLI smoke', () => {
  it('detect command writes run artifacts and keeps stdout concise', async () => {
    const target = await makeTempDir('harness-cli-detect-');
    await fs.writeFile(path.join(target, 'AGENTS.md'), 'facts\n', 'utf8');
    const { stdout } = await runTsx(['templates/auto-detect/cli.ts', 'detect', target]);
    const runId = extractRunId(stdout);

    expect(lineCount(stdout)).toBeLessThanOrEqual(5);
    await expect(fs.access(path.join(target, '.harness', 'runs', runId, 'manifest.json'))).resolves.toBeUndefined();
    await expect(fs.access(path.join(target, '.harness', 'runs', runId, 'detection.json'))).resolves.toBeUndefined();
  });

  it('setup dry-run does not write files', async () => {
    const target = await makeTempDir('harness-cli-dry-run-');
    const { stdout } = await runTsx(['templates/auto-detect/cli.ts', 'setup', target, '--mode', 'dry-run']);

    expect(stdout).toContain('Plan ready:');
    expect(lineCount(stdout)).toBeLessThanOrEqual(5);
    await expect(fs.access(path.join(target, 'AGENTS.md'))).rejects.toThrow();
    await expect(fs.access(path.join(target, '.harness'))).resolves.toBeUndefined();
  });

  it('setup confirm safely exits in non-TTY unless --yes is provided', async () => {
    const target = await makeTempDir('harness-cli-non-tty-');
    const cancelled = await runTsxFailure(['templates/auto-detect/cli.ts', 'setup', target]);

    expect(cancelled.code).toBe(4);
    expect(cancelled.stdout).toContain('Setup needs confirmation in non-TTY mode');
    await expect(fs.access(path.join(target, 'AGENTS.md'))).rejects.toThrow();
    await expect(fs.access(path.join(target, '.harness'))).resolves.toBeUndefined();
  });

  it('setup --yes applies low-risk changes in non-TTY mode', async () => {
    const target = await makeTempDir('harness-cli-yes-');
    const { stdout } = await runTsx(['templates/auto-detect/cli.ts', 'setup', target, '--yes']);

    expect(stdout).toContain('Setup complete:');
    expect(lineCount(stdout)).toBeLessThanOrEqual(5);
    await expect(fs.access(path.join(target, 'AGENTS.md'))).resolves.toBeUndefined();
  });

  it('plans from a detection run and applies the saved plan', async () => {
    const target = await makeTempDir('harness-cli-plan-apply-');
    const detectOutput = await runTsx(['templates/auto-detect/cli.ts', 'detect', target, '--json']);
    const detectJson = JSON.parse(detectOutput.stdout);
    const planOutput = await runTsx(['templates/auto-detect/cli.ts', 'plan', target, '--from-run', detectJson.runId, '--json']);
    const planJson = JSON.parse(planOutput.stdout);

    expect(lineCount(planOutput.stdout)).toBe(1);
    await expect(fs.access(path.join(target, 'AGENTS.md'))).rejects.toThrow();
    await expect(fs.access(path.join(target, '.harness', 'runs', planJson.runId, 'plan.json'))).resolves.toBeUndefined();
    await expect(fs.access(path.join(target, '.harness', 'runs', planJson.runId, 'diff.patch'))).resolves.toBeUndefined();
    await expect(fs.access(path.join(target, '.harness', 'runs', planJson.runId, 'summary.md'))).resolves.toBeUndefined();
    await expect(fs.access(path.join(target, '.harness', 'runs', planJson.runId, 'recommendations.md'))).resolves.toBeUndefined();

    const savedPlan = await readRunPlan(target, planJson.runId);
    expect(savedPlan.sourceDetectionRunId).toBe(detectJson.runId);

    const applyOutput = await runTsx(['templates/auto-detect/cli.ts', 'apply', target, '--plan', planJson.runId, '--backup']);
    const applyRunId = extractRunId(applyOutput.stdout);

    expect(lineCount(applyOutput.stdout)).toBeLessThanOrEqual(5);
    await expect(fs.access(path.join(target, 'AGENTS.md'))).resolves.toBeUndefined();
    await expect(fs.access(path.join(target, '.harness', 'runs', applyRunId, 'result.json'))).resolves.toBeUndefined();
  });

  it('rolls back the latest successful apply run', async () => {
    const target = await makeTempDir('harness-cli-rollback-');
    const planOutput = await runTsx(['templates/auto-detect/cli.ts', 'plan', target, '--json']);
    const planJson = JSON.parse(planOutput.stdout);
    await runTsx(['templates/auto-detect/cli.ts', 'apply', target, '--plan', planJson.runId, '--backup']);

    await expect(fs.access(path.join(target, 'AGENTS.md'))).resolves.toBeUndefined();

    const rollbackOutput = await runTsx(['templates/auto-detect/cli.ts', 'rollback', target]);
    const rollbackRunId = extractRunId(rollbackOutput.stdout);
    const rollbackResult = JSON.parse(await fs.readFile(path.join(target, '.harness', 'runs', rollbackRunId, 'result.json'), 'utf8'));

    expect(lineCount(rollbackOutput.stdout)).toBeLessThanOrEqual(5);
    expect(rollbackResult.counts.deleted).toBeGreaterThan(0);
    await expect(fs.access(path.join(target, 'AGENTS.md'))).rejects.toThrow();
  });

  it('doctor reports artifact integrity issues without failing the command', async () => {
    const target = await makeTempDir('harness-cli-doctor-');
    const planOutput = await runTsx(['templates/auto-detect/cli.ts', 'plan', target, '--json']);
    const planJson = JSON.parse(planOutput.stdout);
    await fs.rm(path.join(target, '.harness', 'runs', planJson.runId, 'plan.json'), { force: true });

    const doctorOutput = await runTsx(['templates/auto-detect/cli.ts', 'doctor', target, '--json']);
    const doctorJson = JSON.parse(doctorOutput.stdout);
    const doctorResult = JSON.parse(await fs.readFile(path.join(target, '.harness', 'runs', doctorJson.runId, 'result.json'), 'utf8'));

    expect(lineCount(doctorOutput.stdout)).toBe(1);
    expect(doctorJson.exitCode).toBe(0);
    expect(doctorJson.counts.issues).toBeGreaterThan(0);
    expect(doctorResult.issues.join('\n')).toContain(`Missing plan.json for run ${planJson.runId}`);
  });

  it('returns stable exit codes for invalid input and conflicts', async () => {
    const missingTarget = path.join(os.tmpdir(), `harness-missing-${Date.now()}`);
    const invalidDetect = await runTsxFailure(['templates/auto-detect/cli.ts', 'detect', missingTarget]);
    expect(invalidDetect.code).toBe(1);

    const target = await makeTempDir('harness-cli-conflict-');
    const missingPlan = await runTsxFailure(['templates/auto-detect/cli.ts', 'apply', target, '--plan', 'missing']);
    expect(missingPlan.code).toBe(6);

    await fs.writeFile(path.join(target, 'AGENTS.md'), 'user owned\n', 'utf8');
    const planOutput = await runTsx(['templates/auto-detect/cli.ts', 'plan', target, '--json']);
    const planJson = JSON.parse(planOutput.stdout);
    const planPath = path.join(target, '.harness', 'runs', planJson.runId, 'plan.json');
    const savedPlan = JSON.parse(await fs.readFile(planPath, 'utf8'));
    savedPlan.counts.conflicted = 1;
    savedPlan.risk = 'medium';
    savedPlan.changes[0].conflict = true;
    await fs.writeFile(planPath, `${JSON.stringify(savedPlan, null, 2)}\n`, 'utf8');
    const conflictApply = await runTsxFailure(['templates/auto-detect/cli.ts', 'apply', target, '--plan', planJson.runId]);
    expect(conflictApply.code).toBe(5);
  });
});

describe('Claude adapter', () => {
  it('detects through the CLI and reads detection artifacts', async () => {
    const target = await makeTempDir('harness-claude-detect-');
    await fs.writeFile(path.join(target, 'AGENTS.md'), 'facts\n', 'utf8');

    const result = await harnessDetect({
      targetPath: target,
      cwd: repoRoot,
      runner: runHarnessForAdapter,
    });

    expect(result.message).toContain('Harness detection complete');
    expect(result.detection?.report.summary.rootTruth).toBe(true);
    await expect(fs.access(path.join(target, '.harness', 'runs', result.runId, 'detection.json'))).resolves.toBeUndefined();
  });

  it('previews setup artifacts and applies only after confirmation', async () => {
    const target = await makeTempDir('harness-claude-setup-');
    const preview = await harnessSetup({
      targetPath: target,
      cwd: repoRoot,
      runner: runHarnessForAdapter,
    });

    expect(preview.message).toContain('Harness plan ready');
    expect(preview.plan?.changes.length).toBeGreaterThan(0);
    await expect(fs.access(path.join(target, 'AGENTS.md'))).rejects.toThrow();

    const applied = await harnessSetup({
      targetPath: target,
      cwd: repoRoot,
      runner: runHarnessForAdapter,
      confirmApply: () => true,
    });

    expect(applied.message).toContain('Harness apply complete');
    expect(applied.applyResult?.counts.applied).toBeGreaterThan(0);
    await expect(fs.access(path.join(target, 'AGENTS.md'))).resolves.toBeUndefined();
  });
});

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function runTsx(args: string[]): Promise<{ stdout: string; stderr: string }> {
  const tsxCli = path.join(repoRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  return execFileAsync(process.execPath, [tsxCli, ...args], { cwd: repoRoot });
}

async function runHarnessForAdapter(args: string[], cwd: string): Promise<string> {
  const tsxCli = path.join(repoRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const { stdout } = await execFileAsync(process.execPath, [tsxCli, 'templates/auto-detect/cli.ts', ...args], { cwd });
  return stdout;
}

async function runTsxFailure(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  try {
    await runTsx(args);
  } catch (error: any) {
    return {
      code: Number(error.code),
      stdout: String(error.stdout ?? ''),
      stderr: String(error.stderr ?? ''),
    };
  }
  throw new Error('Expected command to fail');
}

function extractRunId(stdout: string): string {
  const match = stdout.match(/Run ID:\s*(\S+)/);
  if (!match) {
    throw new Error(`Run ID not found in stdout: ${stdout}`);
  }
  return match[1];
}

function lineCount(stdout: string): number {
  return stdout.trim().split(/\r?\n/).filter(Boolean).length;
}
