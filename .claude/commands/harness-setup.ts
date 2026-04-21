import type { ApplyResult, PlanResult } from '../../templates/auto-detect/run-contract.js';
import {
  formatApplyForClaude,
  formatSetupPreviewForClaude,
  readArtifactJson,
  readArtifactText,
  runHarnessJson,
  targetArgs,
  type ClaudeHarnessOptions,
  type ClaudeHarnessResult,
} from './shared.js';

export interface ClaudeHarnessSetupOptions extends ClaudeHarnessOptions {
  confirmApply?: (input: { summary: string; plan: PlanResult; runId: string; artifactDir: string }) => boolean | Promise<boolean>;
  backup?: boolean;
}

export async function harnessSetup(options: ClaudeHarnessSetupOptions = {}): Promise<ClaudeHarnessResult> {
  const cwd = options.cwd ?? process.cwd();
  const detectRun = await runHarnessJson(['detect', ...targetArgs(options.targetPath)], options);
  const planRun = await runHarnessJson(['plan', ...targetArgs(options.targetPath), '--from-run', detectRun.runId], options);
  const summary = await readArtifactText(planRun.artifactDir, 'summary.md', cwd);
  const plan = await readArtifactJson<PlanResult>(planRun.artifactDir, 'plan.json', cwd);

  const confirmed = options.confirmApply
    ? await options.confirmApply({ summary, plan, runId: planRun.runId, artifactDir: planRun.artifactDir })
    : false;

  if (!confirmed) {
    return {
      message: formatSetupPreviewForClaude(planRun, summary),
      artifacts: planRun.runId,
      runId: planRun.runId,
      artifactDir: planRun.artifactDir,
      plan,
      summary,
    };
  }

  const applyArgs = ['apply', ...targetArgs(options.targetPath), '--plan', planRun.runId];
  if (options.backup) {
    applyArgs.push('--backup');
  }
  const applyRun = await runHarnessJson(applyArgs, options);
  const applyResult = await readArtifactJson<ApplyResult>(applyRun.artifactDir, 'result.json', cwd);

  return {
    message: formatApplyForClaude(planRun, applyRun, applyResult),
    artifacts: applyRun.runId,
    runId: applyRun.runId,
    artifactDir: applyRun.artifactDir,
    plan,
    applyResult,
    summary,
  };
}

export default harnessSetup;
