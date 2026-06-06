import fs from 'node:fs/promises';
import path from 'node:path';
import { detect } from './detector.js';
import { runInitApplyFromPlan as runInitApplyFromPlanImpl } from './apply-from-plan.js';
import {
  computeContentSha256,
  validateHashRecordedPlan,
  type HashRecordedPlan,
} from './hash-recorded-plan.js';
import {
  createRunContext,
  ExitCode,
  persistRunArtifact,
  type ApplyResultV2,
  type DetectionResult,
} from './run-contract.js';

export interface InitDetectResult {
  runId: string;
  artifactDir: string;
  detection: DetectionResult;
}

function resolveTarget(targetPath?: string): string {
  return path.resolve(targetPath ?? process.cwd());
}

export function artifactDirRelative(runId: string): string {
  return path.posix.join('.harness', 'runs', runId);
}

export async function runInitDetect(
  targetPath?: string,
  options: { shallow?: boolean; maxDepth?: number } = {},
): Promise<InitDetectResult> {
  const resolved = resolveTarget(targetPath);
  const context = createRunContext({ targetPath: resolved, mode: 'detect', command: 'init' });
  const detection = detect({
    targetPath: resolved,
    shallow: options.shallow,
    maxDepth: options.maxDepth,
  });
  await persistRunArtifact(context, {
    detection,
    risk: 'low',
    exitCode: ExitCode.SUCCESS,
    nextActions: [],
  });
  return {
    runId: context.runId,
    artifactDir: artifactDirRelative(context.runId),
    detection,
  };
}

export async function runInitApplyFromPlan(
  targetPath: string | undefined,
  planRunId: string,
): Promise<{ runId: string; artifactDir: string; result: ApplyResultV2 }> {
  const resolved = resolveTarget(targetPath);
  const result = await runInitApplyFromPlanImpl(resolved, planRunId);
  return {
    runId: result.runId,
    artifactDir: artifactDirRelative(result.runId),
    result,
  };
}

// ---------------------------------------------------------------------------
// Phase 4 — Record Plan
// ---------------------------------------------------------------------------

export interface RecordPlanInput {
  targetPath: string;
  detectRunId: string;
  entries: Array<{
    path: string;
    action: 'create' | 'overwrite' | 'patch-section';
    content: string;
    evidenceReason: string;
  }>;
  skipped: Array<{ path: string; reason: string }>;
  summary: string;
}

export interface RecordPlanResult {
  runId: string;
  artifactDir: string;
  planPath: string;
  entryCount: number;
  skippedCount: number;
}

/**
 * Persist a Hash-Recorded Plan (Phase 4 artifact).
 *
 * The caller supplies content and metadata but NOT contentSha256 — this
 * function computes SHA-256 for every entry, eliminating a class of agent
 * error. The assembled HRP is validated before any file is written
 * (Property 6: no-HRP-no-write).
 */
export async function runInitRecordPlan(
  input: RecordPlanInput,
): Promise<RecordPlanResult> {
  const resolved = path.resolve(input.targetPath);

  const entries: HashRecordedPlan['entries'] = input.entries.map((e) => ({
    path: e.path,
    action: e.action,
    content: e.content,
    contentSha256: computeContentSha256(e.content),
    evidenceReason: e.evidenceReason,
  }));

  const plan: HashRecordedPlan = {
    runId: '', // filled by createRunContext
    schemaVersion: '2.0.0',
    timestamp: new Date().toISOString(),
    targetPath: resolved,
    detectRunId: input.detectRunId,
    entries,
    skipped: input.skipped,
    summary: input.summary,
  };

  const context = createRunContext({
    targetPath: resolved,
    mode: 'plan',
    command: 'init',
  });
  plan.runId = context.runId;

  // Validate before writing anything (Property 6).
  validateHashRecordedPlan(plan);

  // Write plan.json + summary.md.
  await fs.mkdir(context.runDir, { recursive: true });
  const planPath = path.join(context.runDir, 'plan.json');
  await writeFileAtomic(planPath, `${JSON.stringify(plan, null, 2)}\n`);
  await writeFileAtomic(
    path.join(context.runDir, 'summary.md'),
    input.summary,
  );

  // Write manifest.json via the shared persist helper.
  await persistRunArtifact(context, {
    summary: input.summary,
    exitCode: ExitCode.SUCCESS,
  });

  return {
    runId: context.runId,
    artifactDir: artifactDirRelative(context.runId),
    planPath,
    entryCount: entries.length,
    skippedCount: input.skipped.length,
  };
}

async function writeFileAtomic(filePath: string, value: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tempPath, value, 'utf8');
  await fs.rename(tempPath, filePath);
}
