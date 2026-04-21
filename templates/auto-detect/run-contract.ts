import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { detect } from './detector.js';

export const RUN_SCHEMA_VERSION = '1.0.0';

export enum ExitCode {
  SUCCESS = 0,
  DETECTION_FAILED = 1,
  PLAN_FAILED = 2,
  APPLY_FAILED = 3,
  USER_CANCELLED = 4,
  CONFLICT_DETECTED = 5,
  INVALID_INPUT = 6,
}

export type RunMode = 'detect' | 'plan' | 'apply' | 'rollback' | 'doctor' | 'setup';
export type ManifestRisk = 'low' | 'medium' | 'high';
export type DetectionResult = ReturnType<typeof detect>;

export interface RecommendationSummaryItem {
  id: string;
  title: string;
  why: string;
  confidence: number;
}

export interface SimplifiedRecommendation {
  mustHave: RecommendationSummaryItem;
  suggested: RecommendationSummaryItem;
  warning: string;
  fullReport: string;
}

export interface PlanCounts {
  detected: number;
  generated: number;
  planned: number;
  create: number;
  update: number;
  delete: number;
  skip: number;
  conflicted: number;
}

export interface PlanResult {
  targetPath: string;
  mode: 'plan';
  sourceDetectionRunId?: string;
  detection: DetectionResult;
  changes: unknown[];
  counts: PlanCounts;
  risk: ManifestRisk;
  warnings: string[];
  recommendations: SimplifiedRecommendation;
  diff: string;
  diffPath?: string;
  summary: string;
  fullRecommendationReport: string;
}

export interface ApplyResult {
  targetPath: string;
  mode: 'apply';
  sourcePlanRunId?: string;
  applied: unknown[];
  skipped: unknown[];
  backups: string[];
  rollbackAvailable: boolean;
  counts: {
    applied: number;
    skipped: number;
    backedUp: number;
  };
  warnings: string[];
}

export interface RollbackResult {
  targetPath: string;
  mode: 'rollback';
  sourceApplyRunId?: string;
  restored: string[];
  deleted: string[];
  skipped: string[];
  counts: {
    restored: number;
    deleted: number;
    skipped: number;
  };
}

export interface DoctorResult {
  targetPath: string;
  mode: 'doctor';
  runs: number;
  issues: string[];
  latestApplyRunId?: string;
  rollbackAvailable: boolean;
}

export interface RunArtifact {
  runId: string;
  schemaVersion: string;
  timestamp: string;
  command: string;
  mode: RunMode;
  targetPath: string;
  detection?: DetectionResult;
  plan?: PlanResult;
  result?: ApplyResult | RollbackResult | DoctorResult;
  risk: ManifestRisk;
  exitCode: ExitCode;
  duration: number;
  nextActions: string[];
}

export interface RunContext {
  runId: string;
  schemaVersion: string;
  timestamp: string;
  command: string;
  mode: RunMode;
  targetPath: string;
  runDir: string;
  startedAt: number;
}

export interface PersistRunInput {
  detection?: DetectionResult;
  plan?: PlanResult;
  result?: ApplyResult | RollbackResult | DoctorResult;
  risk?: ManifestRisk;
  exitCode?: ExitCode;
  nextActions?: string[];
  summary?: string;
  diff?: string;
  recommendations?: string;
}

export function createRunContext(input: { targetPath: string; mode: RunMode; command: string; runId?: string; timestamp?: string }): RunContext {
  const targetPath = path.resolve(input.targetPath);
  const timestamp = input.timestamp ?? new Date().toISOString();
  const runId = input.runId ?? createRunId(new Date(timestamp));
  return {
    runId,
    schemaVersion: RUN_SCHEMA_VERSION,
    timestamp,
    command: input.command,
    mode: input.mode,
    targetPath,
    runDir: getRunDir(targetPath, runId),
    startedAt: Date.now(),
  };
}

export async function persistRunArtifact(context: RunContext, input: PersistRunInput = {}): Promise<RunArtifact> {
  await fs.mkdir(context.runDir, { recursive: true });

  if (input.detection) {
    await writeJsonAtomic(path.join(context.runDir, 'detection.json'), input.detection);
  }
  if (input.plan) {
    await writeJsonAtomic(path.join(context.runDir, 'plan.json'), input.plan);
  }
  if (input.result) {
    await writeJsonAtomic(path.join(context.runDir, 'result.json'), input.result);
  }
  if (input.diff !== undefined || input.plan?.diff !== undefined) {
    await writeTextAtomic(path.join(context.runDir, 'diff.patch'), input.diff ?? input.plan?.diff ?? '');
  }
  if (input.summary !== undefined || input.plan?.summary !== undefined) {
    await writeTextAtomic(path.join(context.runDir, 'summary.md'), input.summary ?? input.plan?.summary ?? '');
  }
  if (input.recommendations !== undefined || input.plan?.fullRecommendationReport !== undefined) {
    await writeTextAtomic(
      path.join(context.runDir, 'recommendations.md'),
      input.recommendations ?? input.plan?.fullRecommendationReport ?? '',
    );
  }

  const manifest: RunArtifact = {
    runId: context.runId,
    schemaVersion: context.schemaVersion,
    timestamp: context.timestamp,
    command: context.command,
    mode: context.mode,
    targetPath: context.targetPath,
    detection: input.detection,
    plan: input.plan,
    result: input.result,
    risk: input.risk ?? input.plan?.risk ?? 'low',
    exitCode: input.exitCode ?? ExitCode.SUCCESS,
    duration: Date.now() - context.startedAt,
    nextActions: input.nextActions ?? [],
  };

  await writeJsonAtomic(path.join(context.runDir, 'manifest.json'), manifest);
  return manifest;
}

export function getRunsDir(targetPath: string): string {
  return path.join(path.resolve(targetPath), '.harness', 'runs');
}

export function getRunDir(targetPath: string, runId: string): string {
  return path.join(getRunsDir(targetPath), runId);
}

export async function readRunManifest(targetPath: string, runId: string): Promise<RunArtifact> {
  return readJson<RunArtifact>(path.join(getRunDir(targetPath, runId), 'manifest.json'));
}

export async function readRunPlan(targetPath: string, runId: string): Promise<PlanResult> {
  return readJson<PlanResult>(path.join(getRunDir(targetPath, runId), 'plan.json'));
}

export async function readRunResult<T = ApplyResult | RollbackResult | DoctorResult>(targetPath: string, runId: string): Promise<T> {
  return readJson<T>(path.join(getRunDir(targetPath, runId), 'result.json'));
}

export async function listRunManifests(targetPath: string): Promise<RunArtifact[]> {
  const runsDir = getRunsDir(targetPath);
  let entries: string[];
  try {
    entries = await fs.readdir(runsDir);
  } catch {
    return [];
  }

  const manifests: RunArtifact[] = [];
  for (const entry of entries.sort()) {
    try {
      manifests.push(await readRunManifest(targetPath, entry));
    } catch {
      // Ignore malformed run directories; doctor reports them separately.
    }
  }
  return manifests;
}

export async function findLatestRun(
  targetPath: string,
  predicate: (manifest: RunArtifact) => boolean,
): Promise<RunArtifact | undefined> {
  const manifests = await listRunManifests(targetPath);
  return manifests.filter(predicate).sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
}

export function relativeArtifactPath(targetPath: string, runId: string, fileName?: string): string {
  const relative = path.relative(process.cwd(), fileName ? path.join(getRunDir(targetPath, runId), fileName) : getRunDir(targetPath, runId));
  return relative && !relative.startsWith('..') ? relative.replace(/\\/g, '/') : path.join(getRunDir(targetPath, runId), fileName ?? '').replace(/\\/g, '/');
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, 'utf8')) as T;
}

async function writeJsonAtomic(filePath: string, value: unknown): Promise<void> {
  await writeTextAtomic(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeTextAtomic(filePath: string, value: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tempPath, value, 'utf8');
  await fs.rename(tempPath, filePath);
}

function createRunId(date: Date): string {
  const stamp = [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    '-',
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
  ].join('');
  return `${stamp}-${crypto.randomBytes(3).toString('hex')}`;
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}
