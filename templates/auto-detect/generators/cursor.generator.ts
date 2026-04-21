import {
  buildGeneratorResult,
  buildDetectionsSummary,
  pickBestStrategy,
  renderDocument,
  renderFrontmatter,
  renderHarnessBlock,
  renderMarkdownTable,
  renderSection,
  type GeneratorContext,
  type GeneratorResult,
} from './base-generator.js';
import { mergeDocuments } from '../merge-engine.js';

function buildCursorBody(context: GeneratorContext): string {
  const summary = buildDetectionsSummary(context);
  const ruleBlock = renderHarnessBlock(
    'cursor-editing-guidance',
    [
      '先读取根级 AGENTS.md / CLAUDE.md，再考虑 Cursor 私有规则。',
      'Harness 相关操作必须优先调用 CLI，并读取 .harness/runs/<run-id>/ artifact。',
      'Cursor 只翻译 detection.json、plan.json、summary.md、diff.patch、recommendations.md、result.json，不重新计算 detection、plan、risk 或 diff。',
      '应用变更前必须先展示 summary.md，并等待用户确认。',
      '默认采用增量合并，避免覆盖用户已有内容。',
    ].join('\n'),
    'HARNESS Cursor 适配区块',
  );

  return renderDocument([
    renderFrontmatter('Cursor rule pack generated from Harness detection'),
    '# Cursor Harness Rules',
    '> Cursor 私有规则只负责兼容与补充，不替代根级真值。',
    renderSection(
      'Detection Summary',
      `- ${summary}`,
    ),
    renderSection(
      'Recommended Files',
      renderMarkdownTable(
        ['Path', 'Purpose'],
        [
          ['AGENTS.md', '仓库事实层'],
          ['CLAUDE.md', '协作协议层'],
          ['steering/*.md', '局部覆盖层'],
          ['.harness/runs/<run-id>/', 'CLI 运行产物，供 Cursor 只读消费'],
          ['.cursor/commands/harness-*.md', 'Cursor 命令入口，只编排 CLI'],
        ],
      ),
    ),
    renderSection('Harness Cursor Guidance', ruleBlock),
  ]);
}

function buildCursorDetectCommandBody(context: GeneratorContext): string {
  const summary = buildDetectionsSummary(context);
  const commandBlock = renderHarnessBlock(
    'cursor-detect-command',
    [
      'Run `harness detect <target> --json`.',
      'Parse only the returned JSON for `runId`, `artifactDir`, `exitCode`, counts, and risk.',
      'Read `.harness/runs/<run-id>/manifest.json` and `detection.json`.',
      'Summarize detected tools, frameworks, commands, and next actions from the artifacts.',
      'Do not recompute project detection inside Cursor.',
    ].join('\n'),
    'HARNESS Cursor detect command',
  );

  return renderDocument([
    '# Harness Detect',
    `Target project: \`${context.projectName ?? 'current workspace'}\`.`,
    renderSection('Detected Context', `- ${summary}`),
    renderSection('Cursor Command Contract', commandBlock),
    renderSection(
      'Output Shape',
      [
        '- Short user-facing summary',
        '- Run ID',
        '- Artifact directory',
        '- Suggested next command: `harness plan <target> --from-run <run-id>`',
      ].join('\n'),
    ),
  ]);
}

function buildCursorSetupCommandBody(context: GeneratorContext): string {
  const summary = buildDetectionsSummary(context);
  const commandBlock = renderHarnessBlock(
    'cursor-setup-command',
    [
      'Run `harness detect <target> --json`.',
      'Run `harness plan <target> --from-run <detect-run-id> --json`.',
      'Read `.harness/runs/<plan-run-id>/summary.md` and `plan.json`.',
      'Show the summary and top-level counts to the user, then ask for confirmation.',
      'Only after confirmation, run `harness apply <target> --plan <plan-run-id> --backup`.',
      'Read `.harness/runs/<apply-run-id>/result.json` for the final status.',
      'Do not recompute detection, plan, risk, recommendations, or diff inside Cursor.',
    ].join('\n'),
    'HARNESS Cursor setup command',
  );

  return renderDocument([
    '# Harness Setup',
    `Target project: \`${context.projectName ?? 'current workspace'}\`.`,
    renderSection('Detected Context', `- ${summary}`),
    renderSection('Cursor Command Contract', commandBlock),
    renderSection(
      'Confirmation Rule',
      'Apply only after the user explicitly confirms the plan preview. If the user declines, leave target configuration files unchanged.',
    ),
  ]);
}

export function generateCursorTemplate(context: GeneratorContext): GeneratorResult {
  const existingContent = context.existingContent ?? '';
  const strategy = pickBestStrategy(context, existingContent.trim().length > 0);
  const content = buildCursorBody(context);
  const merged = mergeDocuments({
    existingContent,
    generatedContent: content,
    strategy,
    blockName: 'cursor-editing-guidance',
  });

  const normalizedExisting = existingContent.trim() ? existingContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim() : '';
  const normalizedMerged = merged.mergedContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const action = !normalizedExisting ? 'create' : normalizedExisting === normalizedMerged ? 'skip' : merged.action === 'prompt' ? 'prompt' : 'merge';
  return buildGeneratorResult({
    filePath: context.targetPath,
    action,
    strategy,
    reason: existingContent.trim() ? 'existing Cursor guidance detected, merge only the Harness section' : 'new Cursor rule pack generated',
    content: merged.mergedContent,
    existingContent,
    markers: [
      {
        name: 'cursor-editing-guidance',
        start: '<!-- HARNESS_DYNAMIC_SECTION_START:CURSOR_EDITING_GUIDANCE -->',
        end: '<!-- HARNESS_DYNAMIC_SECTION_END:CURSOR_EDITING_GUIDANCE -->',
        content: 'cursor editing guidance',
      },
    ],
    notes: merged.notes,
  });
}

export function generateCursorDetectCommandTemplate(context: GeneratorContext): GeneratorResult {
  return generateCursorCommandTemplate({
    context,
    content: buildCursorDetectCommandBody(context),
    blockName: 'cursor-detect-command',
    markerContent: 'cursor detect command',
    reason: context.existingContent?.trim()
      ? 'existing Cursor detect command detected, merge only the Harness section'
      : 'new Cursor detect command generated',
  });
}

export function generateCursorSetupCommandTemplate(context: GeneratorContext): GeneratorResult {
  return generateCursorCommandTemplate({
    context,
    content: buildCursorSetupCommandBody(context),
    blockName: 'cursor-setup-command',
    markerContent: 'cursor setup command',
    reason: context.existingContent?.trim()
      ? 'existing Cursor setup command detected, merge only the Harness section'
      : 'new Cursor setup command generated',
  });
}

function generateCursorCommandTemplate(input: {
  context: GeneratorContext;
  content: string;
  blockName: string;
  markerContent: string;
  reason: string;
}): GeneratorResult {
  const existingContent = input.context.existingContent ?? '';
  const strategy = pickBestStrategy(input.context, existingContent.trim().length > 0);
  const merged = mergeDocuments({
    existingContent,
    generatedContent: input.content,
    strategy,
    blockName: input.blockName,
  });

  const normalizedExisting = existingContent.trim() ? existingContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim() : '';
  const normalizedMerged = merged.mergedContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const action = !normalizedExisting ? 'create' : normalizedExisting === normalizedMerged ? 'skip' : merged.action === 'prompt' ? 'prompt' : 'merge';
  const markerName = input.blockName.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  return buildGeneratorResult({
    filePath: input.context.targetPath,
    action,
    strategy,
    reason: input.reason,
    content: merged.mergedContent,
    existingContent,
    markers: [
      {
        name: input.blockName,
        start: `<!-- HARNESS_DYNAMIC_SECTION_START:${markerName} -->`,
        end: `<!-- HARNESS_DYNAMIC_SECTION_END:${markerName} -->`,
        content: input.markerContent,
      },
    ],
    notes: merged.notes,
  });
}

export default generateCursorTemplate;
