import fs from 'node:fs/promises';
import path from 'node:path';
import { detect, type DetectionOptions } from './detector.js';
import { buildRecommendationArtifacts, generateConfigs } from './generators/index.js';
import { hasHarnessMarker, type GeneratorResult, type RiskLevel } from './generators/base-generator.js';
import { renderDiffReport } from './reporters/diff-reporter.js';
import { renderSummaryReport } from './reporters/summary-reporter.js';
import {
  findLatestRun,
  readRunResult,
  type ApplyResult,
  type DetectionResult,
  type ManifestRisk,
  type PlanCounts,
  type PlanResult,
  type RollbackResult,
} from './run-contract.js';

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

export interface PlanOptions {
  targetPath: string;
  detection?: DetectionResult;
  shallow?: boolean;
  maxDepth?: number;
  sourceDetectionRunId?: string;
  fullReportPath?: string;
  diffPath?: string;
}

export interface ApplyPlanOptions {
  plan: HarnessPlanResult | PlanResult;
  mode?: InstallMode;
  backup?: boolean;
  timestamp?: string;
  preserveBackups?: number;
  interactive?: boolean;
  confirmedPaths?: string[];
  sourcePlanRunId?: string;
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
  detection: DetectionResult;
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

export interface HarnessPlanResult extends PlanResult {
  detection: DetectionResult;
  generated: GeneratorResult[];
  changes: InstallChange[];
}

export interface HarnessApplyResult extends ApplyResult {
  applied: InstallChange[];
  skipped: InstallChange[];
}

const DEFAULT_BACKUP_KEEP = 5;

export async function createPlan(options: PlanOptions): Promise<HarnessPlanResult> {
  if (!options?.targetPath) {
    throw new Error('createPlan(options) requires options.targetPath');
  }

  const targetRoot = path.resolve(options.targetPath);
  const detectionOptions: DetectionOptions = {
    targetPath: targetRoot,
    shallow: options.shallow,
    maxDepth: options.maxDepth,
  };
  const detection = options.detection ?? detect(detectionOptions);
  const generated = await generateConfigs({
    detection,
    targetPath: targetRoot,
  });
  const changes = await Promise.all(generated.map((result) => toInstallChange(result)));
  const diff = renderDiffReport({ changes });
  const recommendationArtifacts = await buildRecommendationArtifacts({
    detection,
    targetPath: targetRoot,
    fullReportPath: options.fullReportPath,
  });
  const counts = buildPlanCounts(detection, generated, changes);
  const risk = inferPlanRisk(changes);
  const warnings = collectPlanWarnings(changes);
  const summary = renderPlanSummary({
    targetRoot,
    changes,
    counts,
    risk,
    warnings,
    recommendations: recommendationArtifacts.simplified,
  });

  return {
    targetPath: targetRoot,
    mode: 'plan',
    sourceDetectionRunId: options.sourceDetectionRunId,
    detection,
    generated,
    changes,
    counts,
    risk,
    warnings,
    recommendations: recommendationArtifacts.simplified,
    diff,
    diffPath: options.diffPath,
    summary,
    fullRecommendationReport: recommendationArtifacts.markdown,
  };
}

export async function applyPlan(options: ApplyPlanOptions): Promise<HarnessApplyResult> {
  const plan = options.plan;
  const mode = options.mode ?? 'silent';
  const timestamp = options.timestamp ?? new Date().toISOString().replace(/[:.]/g, '-');
  const keepBackups = options.preserveBackups ?? DEFAULT_BACKUP_KEEP;
  const planned = normalizePlanChanges(plan.changes);
  const applied: InstallChange[] = [];
  let skipped = buildWritePlan(planned, mode).skipped;
  const backups: string[] = [];

  if (mode === 'silent') {
    const writePlan = buildWritePlan(planned, mode);
    skipped = writePlan.skipped;
    for (const change of writePlan.applied) {
      const written = await applyChange(change, {
        backup: Boolean(options.backup),
        keepBackups,
        timestamp,
      });
      if (written.backupPath) {
        backups.push(written.backupPath);
      }
      applied.push(written);
    }
  } else if (mode === 'confirm') {
    const confirmed = await resolveConfirmedChanges(planned, {
      targetPath: plan.targetPath,
      interactive: options.interactive,
      confirmedPaths: options.confirmedPaths,
    });
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
          backups.push(written.backupPath);
        }
        applied.push(written);
      }
    }
  }

  return {
    targetPath: plan.targetPath,
    mode: 'apply',
    sourcePlanRunId: options.sourcePlanRunId,
    applied,
    skipped,
    backups,
    rollbackAvailable: applied.some(canRollbackChange),
    counts: {
      applied: applied.length,
      skipped: skipped.length,
      backedUp: backups.length,
    },
    warnings: collectWarnings(planned, skipped, mode === 'confirm' && applied.length === 0 && planned.some((change) => change.action !== 'skip')),
  };
}

export async function install(options: InstallOptions): Promise<InstallResult> {
  if (!options?.targetPath) {
    throw new Error('install(options) requires options.targetPath');
  }

  const mode = options.mode ?? 'confirm';
  const plan = await createPlan({
    targetPath: options.targetPath,
    shallow: options.shallow,
    maxDepth: options.maxDepth,
  });
  const applyResult =
    mode === 'dry-run'
      ? emptyApplyResult(plan, 'dry-run')
      : await applyPlan({
          plan,
          mode,
          backup: options.backup,
          timestamp: options.timestamp,
          preserveBackups: options.preserveBackups,
          interactive: options.interactive,
          confirmedPaths: options.confirmedPaths,
        });
  const requiresConfirmation = mode === 'confirm' && applyResult.applied.length === 0 && plan.changes.some((change) => change.action !== 'skip');
  const report = buildReport({
    mode,
    detection: plan.detection,
    generated: plan.generated,
    planned: plan.changes,
    applied: applyResult.applied,
    skipped: applyResult.skipped,
    backedUp: applyResult.backups,
    requiresConfirmation,
  });

  return {
    mode,
    detection: plan.detection,
    generated: plan.generated,
    planned: plan.changes,
    applied: mode === 'silent' || mode === 'confirm' ? applyResult.applied : [],
    skipped: applyResult.skipped,
    backedUp: mode === 'silent' || mode === 'confirm' ? applyResult.backups : [],
    requiresConfirmation,
    report,
    summary: report.summary,
    diff: report.diff,
  };
}

export async function rollbackLastApply(targetPath: string, runId?: string): Promise<RollbackResult> {
  const targetRoot = path.resolve(targetPath);
  const applyRun = runId
    ? { runId }
    : await findLatestRun(targetRoot, (manifest) => manifest.mode === 'apply' && manifest.exitCode === 0 && Boolean(manifest.result));
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

  const result = await readRunResult<ApplyResult>(targetRoot, applyRun.runId);
  const restored: string[] = [];
  const deleted: string[] = [];
  const skipped: string[] = [];

  for (const change of normalizePlanChanges(result.applied).reverse()) {
    const filePath = path.resolve(change.path);
    if (change.backupPath && (await exists(change.backupPath))) {
      await fs.copyFile(change.backupPath, filePath);
      restored.push(filePath);
      continue;
    }
    if (change.action === 'create' && change.previousContent.length === 0) {
      await fs.rm(filePath, { force: true });
      deleted.push(filePath);
      continue;
    }
    if (change.action === 'update' || change.previousContent.length > 0) {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, change.previousContent, 'utf8');
      restored.push(filePath);
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
  detection: DetectionResult;
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
    changes: input.planned.map((change) => ({ action: change.action, path: change.path })),
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

  const parts = [summary];
  if (diff.trim().length > 0) {
    parts.push('', diff);
  }

  return {
    summary,
    diff,
    markdown: parts.join('\n').trim(),
    counts,
    warnings,
  };
}

function buildPlanCounts(detection: DetectionResult, generated: GeneratorResult[], changes: InstallChange[]): PlanCounts {
  return {
    detected: detection.tools.length,
    generated: generated.length,
    planned: changes.length,
    create: changes.filter((item) => item.action === 'create').length,
    update: changes.filter((item) => item.action === 'update').length,
    delete: changes.filter((item) => item.action === 'delete').length,
    skip: changes.filter((item) => item.action === 'skip').length,
    conflicted: changes.filter((item) => item.conflict).length,
  };
}

function inferPlanRisk(changes: InstallChange[]): ManifestRisk {
  if (changes.some((item) => item.risk === 'high' || item.risk === 'critical')) {
    return 'high';
  }
  if (changes.some((item) => item.risk === 'medium' || item.conflict)) {
    return 'medium';
  }
  return 'low';
}

function collectPlanWarnings(planned: InstallChange[]): string[] {
  const warnings: string[] = [];
  if (planned.some((item) => item.conflict)) {
    warnings.push('One or more planned changes contain conflicts.');
  }
  if (planned.some((item) => item.risk === 'high' || item.risk === 'critical')) {
    warnings.push('High-risk planned changes detected.');
  }
  return warnings;
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

function renderPlanSummary(input: {
  targetRoot: string;
  changes: InstallChange[];
  counts: PlanCounts;
  risk: ManifestRisk;
  warnings: string[];
  recommendations: HarnessPlanResult['recommendations'];
}): string {
  const lines = [
    '# Harness Plan Summary',
    '',
    `Target: ${input.targetRoot}`,
    `Changes: ${input.counts.create} create, ${input.counts.update} update, ${input.counts.skip} skip`,
    `Risk: ${input.risk}`,
    '',
    '## Recommendations',
    '',
    `- Must: ${input.recommendations.mustHave.title}`,
    `- Suggested: ${input.recommendations.suggested.title}`,
    `- Warning: ${input.recommendations.warning}`,
  ];

  const writable = input.changes.filter((change) => change.action !== 'skip');
  if (writable.length > 0) {
    lines.push('', '## Planned Changes', '');
    for (const change of writable) {
      lines.push(`- ${change.action}: ${change.path} (${change.risk}${change.conflict ? ', conflict' : ''})`);
    }
  }

  if (input.warnings.length > 0) {
    lines.push('', '## Warnings', '', ...input.warnings.map((warning) => `- ${warning}`));
  }

  return `${lines.join('\n')}\n`;
}

function emptyApplyResult(plan: HarnessPlanResult, mode: InstallMode): HarnessApplyResult {
  const skipped = buildWritePlan(plan.changes, mode).skipped;
  return {
    targetPath: plan.targetPath,
    mode: 'apply',
    applied: [],
    skipped,
    backups: [],
    rollbackAvailable: false,
    counts: {
      applied: 0,
      skipped: skipped.length,
      backedUp: 0,
    },
    warnings: collectWarnings(plan.changes, skipped, false),
  };
}

function normalizePlanChanges(changes: unknown[]): InstallChange[] {
  return changes.map((item) => {
    const record = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    return {
      path: String(record.path ?? ''),
      action: normalizeAction(record.action),
      content: String(record.content ?? ''),
      previousContent: String(record.previousContent ?? ''),
      risk: normalizeRisk(record.risk),
      conflict: Boolean(record.conflict),
      reason: String(record.reason ?? ''),
      skipReason: typeof record.skipReason === 'string' ? record.skipReason : undefined,
      backupPath: typeof record.backupPath === 'string' ? record.backupPath : undefined,
    };
  });
}

function normalizeAction(value: unknown): ChangeAction {
  return value === 'create' || value === 'update' || value === 'delete' || value === 'skip' ? value : 'skip';
}

function normalizeRisk(value: unknown): RiskLevel {
  return value === 'low' || value === 'medium' || value === 'high' || value === 'critical' ? value : 'low';
}

function canRollbackChange(change: InstallChange): boolean {
  return Boolean(change.backupPath) || change.action === 'create' || change.action === 'update' || change.previousContent.length > 0;
}

async function readTextIfExists(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return '';
  }
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function normalizeNewlines(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export default install;
