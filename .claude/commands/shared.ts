import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import type { ApplyResult, DetectionResult, PlanResult } from '../../templates/auto-detect/run-contract.js';

const execFileAsync = promisify(execFile);

export interface HarnessRunJson {
  runId: string;
  artifactDir: string;
  exitCode: number;
  counts?: Record<string, unknown>;
  risk?: string;
}

export interface ClaudeHarnessOptions {
  targetPath?: string;
  cwd?: string;
  harnessCommand?: string;
  runner?: (args: string[], cwd: string) => Promise<string>;
}

export interface ClaudeHarnessResult {
  message: string;
  artifacts: string;
  runId: string;
  artifactDir: string;
  detection?: DetectionResult;
  plan?: PlanResult;
  applyResult?: ApplyResult;
  summary?: string;
}

export async function runHarnessJson(args: string[], options: ClaudeHarnessOptions = {}): Promise<HarnessRunJson> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const stdout = options.runner ? await options.runner([...args, '--json'], cwd) : await execHarness([...args, '--json'], cwd, options.harnessCommand);
  return JSON.parse(stdout.trim()) as HarnessRunJson;
}

export async function readArtifactJson<T>(artifactDir: string, fileName: string, cwd = process.cwd()): Promise<T> {
  return JSON.parse(await fs.readFile(resolveArtifactPath(artifactDir, cwd, fileName), 'utf8')) as T;
}

export async function readArtifactText(artifactDir: string, fileName: string, cwd = process.cwd()): Promise<string> {
  return fs.readFile(resolveArtifactPath(artifactDir, cwd, fileName), 'utf8');
}

export function resolveArtifactPath(artifactDir: string, cwd: string, fileName?: string): string {
  const dir = path.isAbsolute(artifactDir) ? artifactDir : path.resolve(cwd, artifactDir);
  return fileName ? path.join(dir, fileName) : dir;
}

export function targetArgs(targetPath?: string): string[] {
  return targetPath ? [targetPath] : [];
}

export function formatDetectionForClaude(run: HarnessRunJson, detection: DetectionResult): string {
  const frameworks = detection.frameworks.length ? detection.frameworks.join(', ') : 'none';
  const commands = detection.commands.length ? detection.commands.map((item) => item.name).join(', ') : 'none';
  return [
    `Harness detection complete.`,
    `Detected ${detection.tools.length} tools and ${detection.frameworks.length} frameworks.`,
    `Frameworks: ${frameworks}.`,
    `Commands: ${commands}.`,
    `Run ID: ${run.runId}.`,
  ].join('\n');
}

export function formatSetupPreviewForClaude(run: HarnessRunJson, summary: string): string {
  return [`Harness plan ready.`, `Run ID: ${run.runId}.`, '', summary.trim()].join('\n');
}

export function formatApplyForClaude(planRun: HarnessRunJson, applyRun: HarnessRunJson, result: ApplyResult): string {
  return [
    `Harness apply complete.`,
    `Plan Run ID: ${planRun.runId}.`,
    `Apply Run ID: ${applyRun.runId}.`,
    `Applied ${result.counts.applied} changes, skipped ${result.counts.skipped}.`,
  ].join('\n');
}

async function execHarness(args: string[], cwd: string, harnessCommand = 'harness'): Promise<string> {
  const { stdout } = await execFileAsync(harnessCommand, args, { cwd });
  return stdout;
}
