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
      '默认采用增量合并，避免覆盖用户已有内容。',
      '生成规则时保留可逆性、预览和冲突分级。',
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
        ],
      ),
    ),
    renderSection('Harness Cursor Guidance', ruleBlock),
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

export default generateCursorTemplate;
