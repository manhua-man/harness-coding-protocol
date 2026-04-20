import fs from 'node:fs/promises';
import path from 'node:path';
import { detect, type DetectionOptions } from './detector.js';
import { generateConfigs } from './generators/index.js';
import { hasHarnessMarker, type GeneratorResult, type RiskLevel } from './generators/base-generator.js';
import { renderDiffReport } from './reporters/diff-reporter.js';
import { renderSummaryReport } from './reporters/summary-reporter.js';

export type InstallMode = 'silent' | 'confirm' | 'dry-run';
export type ChangeAction = 'create' | 'update' | 'delete' | 'skip';

export interface InstallOptions {
  targetPath: string;
  mode?: InstallMode;
  backup?: boolean;
  shallow?: boolean;
  maxDepth?: number;
  timestamp?: string;
  preserveBackups?: number;
  interactive?: boolean;
  confirmedPaths?: string[];
}

export interface InstallChange {
  path: string;
  action: ChangeAction;
  content: string;
  previousContent: string;
  risk: RiskLevel;
  conflict: boolean;
  reason: string;
  skipReason?: string;
  backupPath?: string;
}

export interface InstallReport {
  summary: string;
  diff: string;
  markdown: string;
  counts: {
    detected: number;
    generated: number;
    planned: number;
    applied: number;
    skipped: number;
    conflicted: number;
    backedUp: number;
  };
  warnings: string[];
}

export interface InstallResult {
  mode: InstallMode;
  detection: ReturnType<typeof detect>;
  generated: GeneratorResult[];
  planned: InstallChange[];
  applied: InstallChange[];
  skipped: InstallChange[];
  backedUp: string[];
  requiresConfirmation: boolean;
  report: InstallReport;
  summary: string;
  diff: string;
}

const DEFAULT_BACKUP_KEEP = 5;

export async function install(options: InstallOptions): Promise<InstallResult> {
  if (!options?.targetPath) {
    throw new Error('install(options) requires options.targetPath');
  }

  const targetRoot = path.resolve(options.targetPath);
  const mode = options.mode ?? 'confirm';
  const timestamp = options.timestamp ?? new Date().toISOString().replace(/[:.]/g, '-');
  const keepBackups = options.preserveBackups ?? DEFAULT_BACKUP_KEEP;

  const detectionOptions: DetectionOptions = {
    targetPath: targetRoot,
    shallow: options.shallow,
    maxDepth: options.maxDepth,
  };
  const detection = detect(detectionOptions);
  const generated = await generateConfigs({
    detection,
    targetPath: targetRoot,
  });

  const planned = await Promise.all(generated.map((result) => toInstallChange(result)));
  const writePlan = buildWritePlan(planned, mode);
  const applied: InstallChange[] = [];
  let skipped = writePlan.skipped;
  const backedUp: string[] = [];

  if (mode === 'silent') {
    for (const change of writePlan.applied) {
      const written = await applyChange(change, {
        backup: Boolean(options.backup),
        keepBackups,
        timestamp,
      });
      if (written.backupPath) {
        backedUp.push(written.backupPath);
      }
      applied.push(written);
    }
  } else if (mode === 'confirm') {
    const confirmed = await resolveConfirmedChanges(planned, options);
    if (confirmed !== undefined) {
      const selected = new Set(confirmed);
      skipped = planned
        .filter((change) => !selected.has(change.path))
        .map((change) => ({
          ...change,
          skipReason: 'not-confirmed',
        }));

      for (const change of planned.filter((item) => selected.has(item.path) && item.action !== 'skip')) {
        const written = await applyChange(change, {
          backup: Boolean(options.backup),
          keepBackups,
          timestamp,
        });
        if (written.backupPath) {
          backedUp.push(written.backupPath);
        }
        applied.push(written);
      }
    }
  }

  const requiresConfirmation = mode === 'confirm' && applied.length === 0 && planned.some((change) => change.action !== 'skip');
  const report = buildReport({
    mode,
    detection,
    generated,
    planned,
    applied,
    skipped,
    backedUp,
    requiresConfirmation,
  });

  return {
    mode,
    detection,
    generated,
    planned,
    applied: mode === 'silent' || mode === 'confirm' ? applied : [],
    skipped,
    backedUp: mode === 'silent' || mode === 'confirm' ? backedUp : [],
    requiresConfirmation,
    report,
    summary: report.summary,
    diff: report.diff,
  };
}

export async function pruneBackups(filePath: string, keep = DEFAULT_BACKUP_KEEP): Promise<string[]> {
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

async function toInstallChange(result: GeneratorResult): Promise<InstallChange> {
  const previousContent = await readTextIfExists(result.filePath);
  const noContentChange = normalizeNewlines(previousContent).trim() === normalizeNewlines(result.content).trim();
  const action: ChangeAction =
    noContentChange || result.action === 'skip' ? 'skip' : result.action === 'create' ? 'create' : 'update';

  return {
    path: result.filePath,
    action,
    content: result.content,
    previousContent,
    risk: result.risk,
    conflict: action === 'skip' ? false : result.conflict === 'high' || result.conflict === 'medium',
    reason: result.reason,
  };
}

function buildWritePlan(changes: InstallChange[], mode: InstallMode): { applied: InstallChange[]; skipped: InstallChange[] } {
  if (mode !== 'silent') {
    return {
      applied: [],
      skipped: changes.map((change) => ({
        ...change,
        skipReason: mode === 'dry-run' ? 'dry-run' : 'requires-confirmation',
      })),
    };
  }

  const applied: InstallChange[] = [];
  const skipped: InstallChange[] = [];
  for (const change of changes) {
    if (isSafeAutoWrite(change)) {
      applied.push(change);
    } else {
      skipped.push({
        ...change,
        skipReason: inferSkipReason(change),
      });
    }
  }
  return { applied, skipped };
}

async function resolveConfirmedChanges(changes: InstallChange[], options: InstallOptions): Promise<string[] | undefined> {
  const writable = changes.filter((change) => change.action !== 'skip');
  if (writable.length === 0) {
    return [];
  }

  if (options.confirmedPaths) {
    const confirmed = new Set(options.confirmedPaths.map((item) => path.resolve(item)));
    return writable.filter((change) => confirmed.has(path.resolve(change.path))).map((change) => change.path);
  }

  const shouldPrompt = options.interactive ?? process.stdin.isTTY;
  if (!shouldPrompt) {
    return undefined;
  }

  const inquirerModule = 'inquirer';
  const inquirer = (await import(inquirerModule)) as {
    default: {
      prompt: (questions: unknown[]) => Promise<{ paths: string[] }>;
    };
  };
  const defaultSelected = writable.filter(isDefaultConfirmed).map((change) => change.path);
  const answer = (await inquirer.default.prompt([
    {
      type: 'checkbox',
      name: 'paths',
      message: 'Select Harness changes to apply',
      choices: writable.map((change) => ({
        name: renderConfirmChoice(change),
        value: change.path,
        checked: defaultSelected.includes(change.path),
      })),
    },
  ])) as { paths: string[] };
  return answer.paths;
}

function isDefaultConfirmed(change: InstallChange): boolean {
  if (change.conflict || change.risk !== 'low') {
    return false;
  }
  if (change.action === 'create') {
    return true;
  }
  return change.action === 'update' && hasHarnessMarker(change.previousContent);
}

function renderConfirmChoice(change: InstallChange): string {
  const group = change.conflict ? 'conflict' : change.action;
  return `[${group}] [risk:${change.risk}] ${change.path} - ${change.reason}`;
}

function isSafeAutoWrite(change: InstallChange): boolean {
  if (change.action === 'skip' || change.action === 'delete') {
    return false;
  }
  return !change.conflict && change.risk === 'low';
}

function inferSkipReason(change: InstallChange): string {
  if (change.action === 'skip') return 'no-change';
  if (change.conflict) return 'conflict';
  if (change.risk !== 'low') return `risk:${change.risk}`;
  if (change.action === 'delete') return 'delete-not-auto-applied';
  return 'requires-confirmation';
}

async function applyChange(
  change: InstallChange,
  context: { backup: boolean; keepBackups: number; timestamp: string },
): Promise<InstallChange> {
  const resolvedPath = path.resolve(change.path);
  await fs.mkdir(path.dirname(resolvedPath), { recursive: true });

  const backupPath = context.backup ? await createBackup(resolvedPath, context.timestamp, context.keepBackups) : undefined;
  await fs.writeFile(resolvedPath, change.content, 'utf8');

  return {
    ...change,
    path: resolvedPath,
    backupPath,
  };
}

async function createBackup(filePath: string, timestamp: string, keep: number): Promise<string | undefined> {
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

function buildReport(input: {
  mode: InstallMode;
  detection: ReturnType<typeof detect>;
  generated: GeneratorResult[];
  planned: InstallChange[];
  applied: InstallChange[];
  skipped: InstallChange[];
  backedUp: string[];
  requiresConfirmation: boolean;
}): InstallReport {
  const summary = renderSummaryReport({
    mode: input.mode,
    detected: input.detection.tools,
    generated: input.generated,
    planned: input.planned,
    applied: input.applied,
    skipped: input.skipped,
    backedUp: input.backedUp,
    confirmRequired: input.requiresConfirmation,
  });
  const diff = renderDiffReport({
    changes: input.planned,
  });
  const warnings = collectWarnings(input.planned, input.skipped, input.requiresConfirmation);
  const counts = {
    detected: input.detection.tools.length,
    generated: input.generated.length,
    planned: input.planned.length,
    applied: input.applied.length,
    skipped: input.skipped.length,
    conflicted: input.planned.filter((item) => item.conflict).length,
    backedUp: input.backedUp.length,
  };

  return {
    summary,
    diff,
    markdown: [summary, '', diff].join('\n').trim(),
    counts,
    warnings,
  };
}

function collectWarnings(planned: InstallChange[], skipped: InstallChange[], confirmRequired: boolean): string[] {
  const warnings: string[] = [];
  if (confirmRequired) {
    warnings.push('Confirmation required before writing changes.');
  }
  if (planned.some((item) => item.conflict)) {
    warnings.push('One or more planned changes contain conflicts.');
  }
  if (planned.some((item) => item.risk === 'high' || item.risk === 'critical')) {
    warnings.push('High-risk planned changes detected.');
  }
  if (skipped.length > 0) {
    warnings.push(`Skipped ${skipped.length} changes in the current mode.`);
  }
  return warnings;
}

async function readTextIfExists(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return '';
  }
}

function normalizeNewlines(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export default install;
