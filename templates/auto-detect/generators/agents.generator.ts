import {
  buildGeneratorResult,
  buildDetectionsSummary,
  pickBestStrategy,
  renderBulletList,
  renderDocument,
  renderFrontmatter,
  renderHarnessBlock,
  renderMarkdownTable,
  renderSection,
  type GeneratorContext,
  type GeneratorResult,
} from './base-generator.js';
import { mergeDocuments } from '../merge-engine.js';

function buildAgentsBody(context: GeneratorContext): string {
  const summary = buildDetectionsSummary(context);
  const hooks = renderHarnessBlock(
    'workflow-hooks',
    [
      '由 Harness Detection Engine 在安装或 setup 时动态生成。',
      '默认采用增量合并，不覆盖用户已有内容。',
      '仅在检测到明确工具信号时才写入具体适配建议。',
    ].join('\n'),
    'HARNESS_DYNAMIC 运行时工作流适配钩子区块',
  );

  const sections = [
    renderSection(
      'Project Overview',
      [
        '<!-- 用 2-3 句话概述项目目标、用户与技术边界 -->',
        `- 检测摘要：${summary}`,
      ].join('\n'),
    ),
    renderSection(
      'Workspace Layout',
      '<!-- 只列真实存在且对协作有用的目录，由检测器填充 -->',
    ),
    renderSection(
      'Key Technologies',
      renderBulletList([
        '<!-- 自动检测到的技术栈由 Detection Engine 填充 -->',
        ...(context.detected.languages.length ? [`languages: ${context.detected.languages.join(', ')}`] : []),
        ...(context.detected.frameworks.length ? [`frameworks: ${context.detected.frameworks.join(', ')}`] : []),
      ]),
    ),
    renderSection(
      'Build, Test & Development Commands',
      context.detected.commands.length
        ? renderMarkdownTable(
            ['Name', 'Command', 'Source'],
            context.detected.commands.map((command) => [command.name, `\`${command.command}\``, command.source]),
          )
        : '<!-- 命令应与 package.json / Makefile / CI 保持一致 -->',
    ),
    renderSection(
      'Quick Reference',
      renderMarkdownTable(
        ['Topic', 'Path'],
        [
          ['Project governance', 'CLAUDE.md'],
          ['Steering rules index', 'steering/'],
          ['Harness recommendations', 'steering/harness-recommendations.md'],
        ],
      ),
    ),
    renderSection('Dynamic Workflow Hooks', hooks),
    renderSection(
      'Detailed Rule Files',
      renderMarkdownTable(
        ['Topic', 'File', 'Scope'],
        [['Harness recommendations', 'steering/harness-recommendations.md', 'project']],
      ),
    ),
  ];

  return renderDocument([
    renderFrontmatter('AI entry document — project facts, commands, ports, conventions'),
    '# AGENTS.md（事 · Facts）',
    '> 本文件是事（Facts）：回答“这个仓库是什么样”。只存放可核对的项目事实。',
    sections.join('\n\n'),
  ]);
}

export function generateAgentsTemplate(context: GeneratorContext): GeneratorResult {
  const existingContent = context.existingContent ?? '';
  const strategy = pickBestStrategy(context, existingContent.trim().length > 0);
  const content = buildAgentsBody(context);
  const merged = mergeDocuments({
    existingContent,
    generatedContent: content,
    strategy,
    blockName: 'workflow-hooks',
  });

  const normalizedExisting = existingContent.trim() ? existingContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim() : '';
  const normalizedMerged = merged.mergedContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const action = !normalizedExisting ? 'create' : normalizedExisting === normalizedMerged ? 'skip' : merged.action === 'prompt' ? 'prompt' : 'merge';
  return buildGeneratorResult({
    filePath: context.targetPath,
    action,
    strategy,
    reason: existingContent.trim() ? 'AGENTS.md already exists, merge only the Harness-managed sections' : 'new AGENTS.md generated from detection results',
    content: merged.mergedContent,
    existingContent,
    markers: [
      {
        name: 'workflow-hooks',
        start: '<!-- HARNESS_DYNAMIC_SECTION_START:WORKFLOW_HOOKS -->',
        end: '<!-- HARNESS_DYNAMIC_SECTION_END:WORKFLOW_HOOKS -->',
        content: 'dynamic workflow hooks',
      },
    ],
    notes: merged.notes,
  });
}

export default generateAgentsTemplate;
