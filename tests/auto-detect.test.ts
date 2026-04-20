import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { detect } from '../templates/auto-detect/detector';
import { install, pruneBackups, rollbackLatestBackup } from '../templates/auto-detect/installer';
import { mergeDocuments } from '../templates/auto-detect/merge-engine';

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

describe('CLI smoke', () => {
  it('detect command runs without writing report files when --no-write is set', async () => {
    const fixture = path.join(fixturesRoot, 'minimal-repo');
    const { stdout } = await runTsx(['templates/auto-detect/cli.ts', 'detect', fixture, '--no-write']);

    expect(stdout).toContain('"rootTruth": true');
  });

  it('setup dry-run does not write files', async () => {
    const target = await makeTempDir('harness-cli-dry-run-');
    const { stdout } = await runTsx(['templates/auto-detect/cli.ts', 'setup', target, '--mode', 'dry-run']);

    expect(stdout).toContain('Mode: dry-run');
    await expect(fs.access(path.join(target, 'AGENTS.md'))).rejects.toThrow();
  });
});

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function runTsx(args: string[]): Promise<{ stdout: string; stderr: string }> {
  const tsxCli = path.join(repoRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  return execFileAsync(process.execPath, [tsxCli, ...args], { cwd: repoRoot });
}
