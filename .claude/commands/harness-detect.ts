import type { DetectionResult } from '../../templates/auto-detect/run-contract.js';
import {
  formatDetectionForClaude,
  readArtifactJson,
  runHarnessJson,
  targetArgs,
  type ClaudeHarnessOptions,
  type ClaudeHarnessResult,
} from './shared.js';

export async function harnessDetect(options: ClaudeHarnessOptions = {}): Promise<ClaudeHarnessResult> {
  const cwd = options.cwd ?? process.cwd();
  const run = await runHarnessJson(['detect', ...targetArgs(options.targetPath)], options);
  const detection = await readArtifactJson<DetectionResult>(run.artifactDir, 'detection.json', cwd);

  return {
    message: formatDetectionForClaude(run, detection),
    artifacts: run.runId,
    runId: run.runId,
    artifactDir: run.artifactDir,
    detection,
  };
}

export default harnessDetect;
