#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { detect } from './detector.js';
import {
  applyPlan,
  createPlan,
  rollbackLastApply,
  rollbackLatestBackup,
  type HarnessPlanResult,
  type InstallChange,
  type InstallMode,
} from './installer.js';
import { hasHarnessMarker } from './generators/base-generator.js';
import {
  createRunContext,
  ExitCode,
  findLatestRun,
  getRunDir,
  listRunManifests,
  persistRunArtifact,
  readRunManifest,
  readRunPlan,
  relativeArtifactPath,
  type ApplyResult,
  type DoctorResult,
  type ManifestRisk,
  type RunArtifact,
} from './run-contract.js';

type CommandName = 'detect' | 'plan' | 'apply' | 'rollback' | 'doctor' | 'setup' | 'install';

interface ParsedArgs {
  command: CommandName;
  targetPath: string;
  mode: InstallMode;
  shallow: boolean;
  backup: boolean;
  json: boolean;
  yes: boolean;
  maxDepth?: number;
  fromRun?: string;
  planRunId?: string;
  rollbackRunId?: string;
}

class CliError extends Error {
  constructor(
    message: string,
    readonly exitCode: ExitCode,
  ) {
    super(message);
  }
}

function usage(): string {
  return [
    'Usage:',
    '  harness detect [target] [--shallow] [--max-depth <n>] [--json]',
    '  harness plan [target] [--from-run <run-id>] [--json]',
    '  harness apply [target] --plan <run-id> [--backup] [--json]',
    '  harness rollback [target] [--run <run-id>] [--json]',
    '  harness doctor [target] [--json]',
    '  harness setup [target] [--mode confirm|silent|dry-run] [--backup] [--yes] [--json]',
    '',
    'If [target] is omitted, current directory is used.',
  ].join('\n');
}

async function main(argv: string[]): Promise<ExitCode> {
  const parsed = parseArgs(argv);
  if (parsed.command === 'detect') return handleDetect(parsed);
  if (parsed.command === 'plan') return handlePlan(parsed);
  if (parsed.command === 'apply') return handleApply(parsed);
  if (parsed.command === 'rollback') return handleRollback(parsed);
  if (parsed.command === 'doctor') return handleDoctor(parsed);
  return handleSetup(parsed);
}

async function handleDetect(parsed: ParsedArgs): Promise<ExitCode> {
  const context = createRunContext({ targetPath: parsed.targetPath, mode: 'detect', command: 'detect' });
  let detection: ReturnType<typeof detect>;
  try {
    detection = detect({
      targetPath: parsed.targetPath,
      shallow: parsed.shallow,
      maxDepth: parsed.maxDepth,
    });
  } catch (error) {
    throw new CliError(error instanceof Error ? error.message : String(error), ExitCode.DETECTION_FAILED);
  }
  const manifest = await persistRunArtifact(context, {
    detection,
    risk: 'low',
    exitCode: ExitCode.SUCCESS,
    nextActions: [`harness plan --from-run ${context.runId}`],
  });

  const counts = {
    tools: detection.tools.length,
    frameworks: detection.frameworks.length,
    commands: detection.commands.length,
  };
  writeOutput(parsed, {
    manifest,
    counts,
    lines: [
      `Detected ${counts.tools} tools, ${counts.frameworks} frameworks`,
      `Run ID: ${context.runId}`,
      `Details: ${relativeArtifactPath(parsed.targetPath, context.runId)}`,
    ],
  });
  return ExitCode.SUCCESS;
}

async function handlePlan(parsed: ParsedArgs): Promise<ExitCode> {
  const source = parsed.fromRun ? await loadDetectionRun(parsed.targetPath, parsed.fromRun) : undefined;
  const targetPath = source?.targetPath ?? parsed.targetPath;
  const context = createRunContext({ targetPath, mode: 'plan', command: 'plan' });
  let plan: HarnessPlanResult;
  try {
    plan = await createPlan({
      targetPath,
      detection: source?.detection,
      shallow: parsed.shallow,
      maxDepth: parsed.maxDepth,
      sourceDetectionRunId: parsed.fromRun,
      fullReportPath: relativeArtifactPath(targetPath, context.runId, 'recommendations.md'),
      diffPath: relativeArtifactPath(targetPath, context.runId, 'diff.patch'),
    });
  } catch (error) {
    throw new CliError(error instanceof Error ? error.message : String(error), ExitCode.PLAN_FAILED);
  }
  const manifest = await persistRunArtifact(context, {
    detection: plan.detection,
    plan,
    risk: plan.risk,
    exitCode: ExitCode.SUCCESS,
    nextActions: [`harness apply --plan ${context.runId}`],
  });

  writeOutput(parsed, {
    manifest,
    counts: plan.counts,
    lines: [
      `Plan ready: ${plan.counts.create} create, ${plan.counts.update} update (risk: ${plan.risk})`,
      `Run ID: ${context.runId}`,
      `Preview: ${relativeArtifactPath(targetPath, context.runId, 'summary.md')}`,
    ],
  });
  return ExitCode.SUCCESS;
}

async function handleApply(parsed: ParsedArgs): Promise<ExitCode> {
  if (!parsed.planRunId) {
    throw new CliError('Missing required --plan <run-id>', ExitCode.INVALID_INPUT);
  }

  const plan = await readRunPlan(parsed.targetPath, parsed.planRunId).catch(() => {
    throw new CliError(`Plan run not found: ${parsed.planRunId}`, ExitCode.INVALID_INPUT);
  });
  const context = createRunContext({ targetPath: plan.targetPath, mode: 'apply', command: 'apply' });
  const result = await applyPlan({
    plan,
    mode: parsed.mode,
    backup: parsed.backup,
    sourcePlanRunId: parsed.planRunId,
  }).catch((error) => {
    throw new CliError(error instanceof Error ? error.message : String(error), ExitCode.APPLY_FAILED);
  });
  const exitCode = plan.counts.conflicted > 0 ? ExitCode.CONFLICT_DETECTED : ExitCode.SUCCESS;
  const manifest = await persistRunArtifact(context, {
    result,
    risk: exitCode === ExitCode.SUCCESS ? plan.risk : 'high',
    exitCode,
    nextActions: result.rollbackAvailable ? ['harness rollback'] : [],
  });

  writeOutput(parsed, {
    manifest,
    counts: result.counts,
    lines: [
      `Applied ${result.counts.applied} changes`,
      `Backup: ${result.counts.backedUp > 0 ? `${result.counts.backedUp} files` : 'none'}`,
      `Run ID: ${context.runId}`,
      `Details: ${relativeArtifactPath(plan.targetPath, context.runId)}`,
    ],
  });
  return exitCode;
}

async function handleRollback(parsed: ParsedArgs): Promise<ExitCode> {
  const stat = await statIfExists(parsed.targetPath);
  if (stat?.isFile()) {
    const context = createRunContext({ targetPath: path.dirname(parsed.targetPath), mode: 'rollback', command: 'rollback' });
    const restoredFrom = await rollbackLatestBackup(parsed.targetPath);
    const result = {
      targetPath: path.dirname(parsed.targetPath),
      mode: 'rollback' as const,
      restored: restoredFrom ? [parsed.targetPath] : [],
      deleted: [],
      skipped: restoredFrom ? [] : [parsed.targetPath],
      counts: {
        restored: restoredFrom ? 1 : 0,
        deleted: 0,
        skipped: restoredFrom ? 0 : 1,
      },
    };
    const manifest = await persistRunArtifact(context, {
      result,
      exitCode: ExitCode.SUCCESS,
      nextActions: [],
    });
    writeOutput(parsed, {
      manifest,
      counts: result.counts,
      lines: [
        restoredFrom ? `Restored 1 file` : 'No backup found',
        `Run ID: ${context.runId}`,
        `Details: ${relativeArtifactPath(path.dirname(parsed.targetPath), context.runId)}`,
      ],
    });
    return ExitCode.SUCCESS;
  }

  const context = createRunContext({ targetPath: parsed.targetPath, mode: 'rollback', command: 'rollback' });
  const result = await rollbackLastApply(parsed.targetPath, parsed.rollbackRunId);
  const manifest = await persistRunArtifact(context, {
    result,
    exitCode: ExitCode.SUCCESS,
    nextActions: [],
  });
  writeOutput(parsed, {
    manifest,
    counts: result.counts,
    lines: [
      `Rollback complete: ${result.counts.restored} restored, ${result.counts.deleted} deleted`,
      `Run ID: ${context.runId}`,
      `Details: ${relativeArtifactPath(parsed.targetPath, context.runId)}`,
    ],
  });
  return ExitCode.SUCCESS;
}

async function handleDoctor(parsed: ParsedArgs): Promise<ExitCode> {
  const context = createRunContext({ targetPath: parsed.targetPath, mode: 'doctor', command: 'doctor' });
  const result = await diagnoseProject(parsed.targetPath);
  const risk: ManifestRisk = result.issues.length > 0 ? 'medium' : 'low';
  const manifest = await persistRunArtifact(context, {
    result,
    risk,
    exitCode: ExitCode.SUCCESS,
    nextActions: result.rollbackAvailable ? ['harness rollback'] : [],
  });
  writeOutput(parsed, {
    manifest,
    counts: { runs: result.runs, issues: result.issues.length },
    lines: [
      `Doctor checked ${result.runs} runs`,
      `Issues: ${result.issues.length}`,
      `Run ID: ${context.runId}`,
      `Details: ${relativeArtifactPath(parsed.targetPath, context.runId)}`,
    ],
  });
  return ExitCode.SUCCESS;
}

async function handleSetup(parsed: ParsedArgs): Promise<ExitCode> {
  const context = createRunContext({ targetPath: parsed.targetPath, mode: 'setup', command: 'setup' });
  const plan = await runWithSpinner(
    parsed,
    'Detecting project and preparing plan...',
    () =>
      createPlan({
        targetPath: parsed.targetPath,
        shallow: parsed.shallow,
        maxDepth: parsed.maxDepth,
        fullReportPath: relativeArtifactPath(parsed.targetPath, context.runId, 'recommendations.md'),
        diffPath: relativeArtifactPath(parsed.targetPath, context.runId, 'diff.patch'),
      }),
    'Plan ready',
  ).catch((error) => {
    throw new CliError(error instanceof Error ? error.message : String(error), ExitCode.PLAN_FAILED);
  });

  let applyMode = parsed.mode;
  let confirmedPaths: string[] | undefined;
  if (parsed.mode === 'confirm' && !parsed.yes && !canUseInteractivePrompts(parsed)) {
    const manifest = await persistRunArtifact(context, {
      detection: plan.detection,
      plan,
      risk: plan.risk,
      exitCode: ExitCode.USER_CANCELLED,
      nextActions: [`harness setup ${parsed.targetPath} --yes`, `harness apply --plan ${context.runId}`],
    });
    writeOutput(parsed, {
      manifest,
      counts: plan.counts,
      lines: [
        'Setup needs confirmation in non-TTY mode',
        'Re-run with --yes or --mode silent',
        `Run ID: ${context.runId}`,
        `Preview: ${relativeArtifactPath(parsed.targetPath, context.runId, 'summary.md')}`,
      ],
    });
    return ExitCode.USER_CANCELLED;
  }

  if (parsed.mode === 'confirm' && parsed.yes) {
    applyMode = 'silent';
  } else if (parsed.mode === 'confirm') {
    const selection = await promptForSetupConfirmation(plan);
    if (selection.cancelled) {
      const manifest = await persistRunArtifact(context, {
        detection: plan.detection,
        plan,
        risk: plan.risk,
        exitCode: ExitCode.USER_CANCELLED,
        nextActions: [`harness apply --plan ${context.runId}`],
      });
      writeOutput(parsed, {
        manifest,
        counts: plan.counts,
        lines: [
          'Setup cancelled',
          `Run ID: ${context.runId}`,
          `Preview: ${relativeArtifactPath(parsed.targetPath, context.runId, 'summary.md')}`,
        ],
      });
      return ExitCode.USER_CANCELLED;
    }
    confirmedPaths = selection.paths;
  }

  const result =
    parsed.mode === 'dry-run'
      ? undefined
      : await runWithSpinner(
          parsed,
          'Applying selected changes...',
          () =>
            applyPlan({
              plan,
              mode: applyMode,
              backup: parsed.backup,
              confirmedPaths,
              interactive: false,
            }),
          'Changes applied',
        ).catch((error) => {
          throw new CliError(error instanceof Error ? error.message : String(error), ExitCode.APPLY_FAILED);
        });
  const risk = result && plan.counts.conflicted > 0 ? 'high' : plan.risk;
  const exitCode = result && plan.counts.conflicted > 0 ? ExitCode.CONFLICT_DETECTED : ExitCode.SUCCESS;
  const manifest = await persistRunArtifact(context, {
    detection: plan.detection,
    plan,
    result,
    risk,
    exitCode,
    nextActions: result?.rollbackAvailable ? ['harness rollback'] : [`harness apply --plan ${context.runId}`],
  });

  const applied = result?.counts.applied ?? 0;
  writeOutput(parsed, {
    manifest,
    counts: result?.counts ?? plan.counts,
    lines:
      parsed.mode === 'dry-run'
        ? [
            `Plan ready: ${plan.counts.create} create, ${plan.counts.update} update (risk: ${plan.risk})`,
            `Run ID: ${context.runId}`,
            `Preview: ${relativeArtifactPath(parsed.targetPath, context.runId, 'summary.md')}`,
          ]
        : [
            `Setup complete: ${applied} applied, ${result?.counts.skipped ?? 0} skipped`,
            `Run ID: ${context.runId}`,
            `Details: ${relativeArtifactPath(parsed.targetPath, context.runId)}`,
          ],
  });
  return exitCode;
}

function parseArgs(argv: string[]): ParsedArgs {
  const command = argv[0] as CommandName | undefined;
  if (!command || !['detect', 'plan', 'apply', 'rollback', 'doctor', 'setup', 'install'].includes(command)) {
    throw new CliError(usage(), ExitCode.INVALID_INPUT);
  }

  const parsed: ParsedArgs = {
    command,
    targetPath: process.cwd(),
    mode: command === 'apply' ? 'silent' : command === 'setup' || command === 'install' ? 'confirm' : 'dry-run',
    shallow: false,
    backup: false,
    json: false,
    yes: false,
  };
  let sawTarget = false;

  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      throw new CliError(usage(), ExitCode.SUCCESS);
    }
    if (arg === '--json') {
      parsed.json = true;
      continue;
    }
    if (arg === '--yes' || arg === '-y') {
      parsed.yes = true;
      continue;
    }
    if (arg === '--shallow') {
      parsed.shallow = true;
      continue;
    }
    if (arg === '--backup') {
      parsed.backup = true;
      continue;
    }
    if (arg === '--no-write') {
      continue;
    }
    if (arg === '--mode') {
      const value = argv[index + 1];
      if (!isInstallMode(value)) {
        throw new CliError('Missing or invalid value for --mode', ExitCode.INVALID_INPUT);
      }
      parsed.mode = value;
      index += 1;
      continue;
    }
    if (arg.startsWith('--mode=')) {
      const value = arg.slice('--mode='.length);
      if (!isInstallMode(value)) {
        throw new CliError(`Invalid mode: ${value}`, ExitCode.INVALID_INPUT);
      }
      parsed.mode = value;
      continue;
    }
    if (arg === '--max-depth') {
      const value = Number(argv[index + 1]);
      if (!Number.isInteger(value) || value < 0) {
        throw new CliError('Missing or invalid value for --max-depth', ExitCode.INVALID_INPUT);
      }
      parsed.maxDepth = value;
      index += 1;
      continue;
    }
    if (arg.startsWith('--max-depth=')) {
      const value = Number(arg.slice('--max-depth='.length));
      if (!Number.isInteger(value) || value < 0) {
        throw new CliError(`Invalid max depth: ${arg}`, ExitCode.INVALID_INPUT);
      }
      parsed.maxDepth = value;
      continue;
    }
    if (arg === '--from-run') {
      parsed.fromRun = requireNext(argv, index, '--from-run');
      index += 1;
      continue;
    }
    if (arg.startsWith('--from-run=')) {
      parsed.fromRun = arg.slice('--from-run='.length);
      continue;
    }
    if (arg === '--plan') {
      parsed.planRunId = requireNext(argv, index, '--plan');
      index += 1;
      continue;
    }
    if (arg.startsWith('--plan=')) {
      parsed.planRunId = arg.slice('--plan='.length);
      continue;
    }
    if (arg === '--run') {
      parsed.rollbackRunId = requireNext(argv, index, '--run');
      index += 1;
      continue;
    }
    if (arg.startsWith('--run=')) {
      parsed.rollbackRunId = arg.slice('--run='.length);
      continue;
    }
    if (!sawTarget && !arg.startsWith('--')) {
      parsed.targetPath = path.resolve(arg);
      sawTarget = true;
      continue;
    }
    throw new CliError(`Unknown option: ${arg}`, ExitCode.INVALID_INPUT);
  }

  return parsed;
}

async function loadDetectionRun(targetPath: string, runId: string): Promise<{ targetPath: string; detection: ReturnType<typeof detect> }> {
  const manifest = await readRunManifest(targetPath, runId).catch(() => {
    throw new CliError(`Detection run not found: ${runId}`, ExitCode.INVALID_INPUT);
  });
  if (!manifest.detection) {
    throw new CliError(`Run does not include detection data: ${runId}`, ExitCode.INVALID_INPUT);
  }
  return {
    targetPath: manifest.targetPath,
    detection: manifest.detection,
  };
}

async function diagnoseProject(targetPath: string): Promise<DoctorResult> {
  const manifests = await listRunManifests(targetPath);
  const issues: string[] = [];
  for (const manifest of manifests) {
    const runDir = getRunDir(targetPath, manifest.runId);
    if (!(await fileExists(path.join(runDir, 'manifest.json')))) {
      issues.push(`Missing manifest for run ${manifest.runId}`);
    }
    if (manifest.mode === 'plan' && !(await fileExists(path.join(runDir, 'plan.json')))) {
      issues.push(`Missing plan.json for run ${manifest.runId}`);
    }
    if ((manifest.mode === 'apply' || manifest.mode === 'rollback' || manifest.mode === 'doctor') && !(await fileExists(path.join(runDir, 'result.json')))) {
      issues.push(`Missing result.json for run ${manifest.runId}`);
    }
    if (manifest.exitCode !== ExitCode.SUCCESS) {
      issues.push(`Run ${manifest.runId} exited with ${manifest.exitCode}`);
    }
  }

  const latestApply = await findLatestRun(targetPath, (manifest) => manifest.mode === 'apply' && manifest.exitCode === ExitCode.SUCCESS);
  return {
    targetPath: path.resolve(targetPath),
    mode: 'doctor',
    runs: manifests.length,
    issues,
    latestApplyRunId: latestApply?.runId,
    rollbackAvailable: Boolean((latestApply?.result as ApplyResult | undefined)?.rollbackAvailable),
  };
}

async function runWithSpinner<T>(
  parsed: ParsedArgs,
  message: string,
  task: () => Promise<T>,
  doneMessage: string,
): Promise<T> {
  if (!canUseInteractivePrompts(parsed)) {
    return task();
  }

  const { spinner } = await import('@clack/prompts');
  const progress = spinner();
  progress.start(message);
  try {
    const result = await task();
    progress.stop(doneMessage);
    return result;
  } catch (error) {
    progress.error('Failed');
    throw error;
  }
}

async function promptForSetupConfirmation(plan: HarnessPlanResult): Promise<{ cancelled: boolean; paths?: string[] }> {
  const { cancel, confirm, isCancel, multiselect } = await import('@clack/prompts');
  const writable = plan.changes.filter((change) => change.action !== 'skip');
  const shouldApply = await confirm({
    message: `Apply ${writable.length} planned change${writable.length === 1 ? '' : 's'}?`,
    initialValue: false,
  });

  if (isCancel(shouldApply) || shouldApply !== true) {
    cancel('Setup cancelled');
    return { cancelled: true };
  }

  if (writable.length === 0) {
    return { cancelled: false, paths: [] };
  }

  const defaultPaths = writable.filter(isDefaultConfirmedChange).map((change) => change.path);
  const selected = await multiselect({
    message: 'Select changes to apply',
    options: writable.map((change) => ({
      value: change.path,
      label: renderPromptChangeLabel(plan.targetPath, change),
      hint: change.conflict ? 'conflict' : `risk:${change.risk}`,
    })),
    initialValues: defaultPaths,
    required: false,
  });

  if (isCancel(selected)) {
    cancel('Setup cancelled');
    return { cancelled: true };
  }

  return { cancelled: false, paths: selected };
}

function canUseInteractivePrompts(parsed: ParsedArgs): boolean {
  return !parsed.json && Boolean(process.stdin.isTTY) && Boolean(process.stdout.isTTY);
}

function isDefaultConfirmedChange(change: InstallChange): boolean {
  if (change.conflict || change.risk !== 'low') {
    return false;
  }
  if (change.action === 'create') {
    return true;
  }
  return change.action === 'update' && hasHarnessMarker(change.previousContent);
}

function renderPromptChangeLabel(targetPath: string, change: InstallChange): string {
  const relative = path.relative(targetPath, change.path).replace(/\\/g, '/') || change.path;
  return `${change.action} ${relative}`;
}

function writeOutput(
  parsed: ParsedArgs,
  input: { manifest: RunArtifact; counts: unknown; lines: string[] },
): void {
  if (parsed.json) {
    console.log(
      JSON.stringify({
        runId: input.manifest.runId,
        artifactDir: relativeArtifactPath(input.manifest.targetPath, input.manifest.runId),
        exitCode: input.manifest.exitCode,
        counts: input.counts,
        risk: input.manifest.risk,
      }),
    );
    return;
  }

  console.log(input.lines.slice(0, 5).join('\n'));
}

function requireNext(argv: string[], index: number, option: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new CliError(`Missing value for ${option}`, ExitCode.INVALID_INPUT);
  }
  return value;
}

function isInstallMode(value: unknown): value is InstallMode {
  return value === 'silent' || value === 'confirm' || value === 'dry-run';
}

async function statIfExists(filePath: string): Promise<{ isFile: () => boolean } | undefined> {
  try {
    return await fs.stat(filePath);
  } catch {
    return undefined;
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

main(process.argv.slice(2))
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error: unknown) => {
    const exitCode = error instanceof CliError ? error.exitCode : ExitCode.INVALID_INPUT;
    const message = error instanceof Error ? error.message : String(error);
    if (message) {
      console.error(message);
    }
    process.exit(exitCode);
  });
