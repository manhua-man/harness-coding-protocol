import {
  buildGeneratorResult,
  buildDetectionsSummary,
  pickBestStrategy,
  renderBulletList,
  renderDocument,
  renderFrontmatter,
  renderHarnessBlock,
  renderSection,
  type GeneratorContext,
  type GeneratorResult,
} from './base-generator.js';
import { mergeDocuments } from '../merge-engine.js';

function buildSteeringBody(context: GeneratorContext): string {
  const summary = buildDetectionsSummary(context);
  const scope = context.projectName ? `project:${context.projectName}` : 'project:generic';
  const overrideBlock = renderHarnessBlock(
    'local-override-guidance',
    [
      'steering/ 只存放局部 override，不重复根级事实或协议。',
      '优先解释“适用范围”，避免把仓库事实写散到多个文件。',
      '新增规则前先检查是否已有同类文件可复用。',
    ].join('\n'),
    'HARNESS 局部覆盖区块',
  );

  return renderDocument([
    renderFrontmatter('Local steering overrides for project-specific behavior'),
    `# steering/${context.targetPath.split(/[\\/]/).pop() ?? 'project.md'}`,
    '> steering/ 只存放局部 override：仅针对特定路径或任务的补充规则。',
    renderSection(
      'Scope',
      renderBulletList([
        `适用范围：${scope}`,
        `检测摘要：${summary}`,
        '优先级低于根级 AGENTS.md 和 CLAUDE.md。',
      ]),
    ),
    renderSection(
      'Recommended Patterns',
      renderBulletList([
        '按路径或语言拆分，不要写成仓库全局说明书。',
        '如果规则会影响生成内容，说明应保留哪些用户内容。',
        '对可选工具只写建议，不写强依赖。',
      ]),
    ),
    renderSection('Harness Override Guidance', overrideBlock),
  ]);
}

export function generateSteeringTemplate(context: GeneratorContext): GeneratorResult {
  const existingContent = context.existingContent ?? '';
  const strategy = pickBestStrategy(context, existingContent.trim().length > 0);
  const content = buildSteeringBody(context);
  const merged = mergeDocuments({
    existingContent,
    generatedContent: content,
    strategy,
    blockName: 'local-override-guidance',
  });

  const normalizedExisting = existingContent.trim() ? existingContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim() : '';
  const normalizedMerged = merged.mergedContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const action = !normalizedExisting ? 'create' : normalizedExisting === normalizedMerged ? 'skip' : merged.action === 'prompt' ? 'prompt' : 'merge';
  return buildGeneratorResult({
    filePath: context.targetPath,
    action,
    strategy,
    reason: existingContent.trim() ? 'existing steering file detected, only patch Harness-managed guidance' : 'new steering override generated',
    content: merged.mergedContent,
    existingContent,
    markers: [
      {
        name: 'local-override-guidance',
        start: '<!-- HARNESS_DYNAMIC_SECTION_START:LOCAL_OVERRIDE_GUIDANCE -->',
        end: '<!-- HARNESS_DYNAMIC_SECTION_END:LOCAL_OVERRIDE_GUIDANCE -->',
        content: 'local override guidance',
      },
    ],
    notes: merged.notes,
  });
}

export default generateSteeringTemplate;
