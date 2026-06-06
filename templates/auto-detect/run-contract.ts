import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { detect } from './detector.js';

export const RUN_SCHEMA_VERSION = '2.0.0';

export enum ExitCode {
  SUCCESS = 0,
  DETECTION_FAILED = 1,
  PLAN_FAILED = 2,
  APPLY_FAILED = 3,
  USER_CANCELLED = 4,
  CONFLICT_DETECTED = 5,
  INVALID_INPUT = 6,
  // 7 was PLAN_DRIFT_DETECTED, retired in v2.0.0
}

export type RunMode = 'detect' | 'plan' | 'apply' | 'rollback';
export type ManifestRisk = 'low' | 'medium' | 'high';
export type DetectionResult = ReturnType<typeof detect>;

// ---------------------------------------------------------------------------
// v2.0.0 apply contract.
//
// `runInitApplyFromPlan` reads a Hash_Recorded_Plan (see
// `hash-recorded-plan.ts`), writes each entry's bytes verbatim, and persists
// the per-entry outcome here. The actualSha256/intendedSha256 pair lets the
// agent surface SHA-256 divergences without retroactively deleting files
// (Requirement 6.7).
// ---------------------------------------------------------------------------

export interface WrittenEntry {
  path: string;
  action: 'create' | 'overwrite' | 'patch-section';
  intendedSha256: string;
  actualSha256?: string;
  success: boolean;
  backupPath?: string;
  error?: string;
}

export interface ApplyResultV2 {
  runId: string;
  schemaVersion: '2.0.0';
  timestamp: string;
  targetPath: string;
  sourcePlanRunId: string;
  writtenEntries: WrittenEntry[];
  counts: { applied: number; skipped: number; failed: number; backedUp: number };
  rollbackAvailable: boolean;
}

// ---------------------------------------------------------------------------
// Rollback result shape used by `installer.ts` (`rollbackLastApply`).
// ---------------------------------------------------------------------------

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

export interface RunArtifact {
  runId: string;
  schemaVersion: string;
  timestamp: string;
  command: string;
  mode: RunMode;
  targetPath: string;
  detection?: DetectionResult;
  result?: ApplyResultV2 | RollbackResult;
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
  result?: ApplyResultV2 | RollbackResult;
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
  if (input.result) {
    await writeJsonAtomic(path.join(context.runDir, 'result.json'), input.result);
  }
  if (input.diff !== undefined) {
    await writeTextAtomic(path.join(context.runDir, 'diff.patch'), input.diff);
  }
  if (input.summary !== undefined) {
    await writeTextAtomic(path.join(context.runDir, 'summary.md'), input.summary);
  }
  if (input.recommendations !== undefined) {
    await writeTextAtomic(path.join(context.runDir, 'recommendations.md'), input.recommendations);
  }

  const manifest: RunArtifact = {
    runId: context.runId,
    schemaVersion: context.schemaVersion,
    timestamp: context.timestamp,
    command: context.command,
    mode: context.mode,
    targetPath: context.targetPath,
    detection: input.detection,
    result: input.result,
    risk: input.risk ?? 'low',
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
  return readJson<RunArtifact>(
    path.join(getRunDir(targetPath, runId), 'manifest.json'),
    validateRunArtifact,
  );
}

export async function readRunResult<T = ApplyResultV2 | RollbackResult>(targetPath: string, runId: string): Promise<T> {
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

async function readJson<T>(
  filePath: string,
  validate?: (data: unknown, filePath: string) => asserts data is T,
): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf8');
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON in ${filePath}: ${message}`);
  }
  if (validate) {
    validate(data, filePath);
    return data as T;
  }
  return data as T;
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

// ---------------------------------------------------------------------------
// Lightweight structural validators applied at the I/O boundary so that a
// missing or wrong-shaped artifact field surfaces as a precise error instead
// of crashing deep inside the call site. AGENTS.md requires the runtime to
// use Node built-ins only, so we do not pull in zod/ajv.
// ---------------------------------------------------------------------------

const MANIFEST_RISK_LEVELS = new Set(['low', 'medium', 'high']);

function validateRunArtifact(data: unknown, filePath: string): asserts data is RunArtifact {
  const ctx = `manifest.json (${filePath})`;
  assertObject(data, ctx);
  const obj = data as Record<string, unknown>;
  assertString(obj.runId, `${ctx}.runId`);
  assertString(obj.schemaVersion, `${ctx}.schemaVersion`);
  if (obj.schemaVersion !== '2.0.0') {
    throw new Error(`${ctx}.schemaVersion: expected schemaVersion 2.0.0, got ${describe(obj.schemaVersion)}`);
  }
  assertString(obj.timestamp, `${ctx}.timestamp`);
  assertString(obj.command, `${ctx}.command`);
  assertString(obj.mode, `${ctx}.mode`);
  assertString(obj.targetPath, `${ctx}.targetPath`);
  if (obj.risk !== undefined && !MANIFEST_RISK_LEVELS.has(obj.risk as string)) {
    throw new Error(`${ctx}.risk: expected one of low|medium|high, got ${describe(obj.risk)}`);
  }
  if (typeof obj.exitCode !== 'number') {
    throw new Error(`${ctx}.exitCode: expected number, got ${describe(obj.exitCode)}`);
  }
}

function assertObject(value: unknown, ctx: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${ctx}: expected object, got ${describe(value)}`);
  }
}

function assertString(value: unknown, ctx: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(`${ctx}: expected string, got ${describe(value)}`);
  }
}

function describe(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}
