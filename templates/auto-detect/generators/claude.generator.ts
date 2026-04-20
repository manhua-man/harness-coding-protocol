import {
  buildGeneratorResult,
  buildDetectionsSummary,
  ensureTrailingNewline,
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

function buildClaudeBody(context: GeneratorContext): string {
  const summary = buildDetectionsSummary(context);
  const governance = renderHarnessBlock(
    'governance-notes',
    [
      '优先遵循用户当次明确指令。',
      '根级 AGENTS.md 提供事实，CLAUDE.md 提供协议。',
      '任何第三方工作流都只做识别、映射、建议，不替代真值层。',
    ].join('\n'),
    'HARNESS 协作原则区块',
  );

  return renderDocument([
    renderFrontmatter('AI collaboration protocol — decision priority, conflict resolution, workflow'),
    '# CLAUDE.md（法 · Protocol）',
    '> 本文件是法（Protocol）：回答“在这个仓库怎么做事”。',
    renderSection(
      'Language & Tone',
      renderBulletList([
        '默认使用中文回答，除非用户明确要求英文。',
        '风格直接、基于事实、友好但不使用表情符号。',
        `检测摘要：${summary}`,
      ]),
    ),
    renderSection(
      'Conflict Resolution',
      renderMarkdownTable(
        ['Priority', 'Source'],
        [
          ['1', '用户当次明确指令'],
          ['2', '根目录 AGENTS.md'],
          ['3', '根目录 CLAUDE.md'],
          ['4', '匹配的 steering/*.md'],
          ['5', '工具适配文件'],
        ],
      ),
    ),
    renderSection(
      'Decision Priority',
      renderMarkdownTable(
        ['Order', 'Principle'],
        [
          ['1', 'Testability'],
          ['2', 'Readability'],
          ['3', 'Consistency'],
          ['4', 'Simplicity'],
          ['5', 'Reversibility'],
        ],
      ),
    ),
    renderSection(
      'Development Principles',
      renderMarkdownTable(
        ['Principle', 'Meaning'],
        [
          ['Incremental Progress', '优先小步、可验证、可回滚的变更'],
          ['Context First', '先理解现有实现，再给方案'],
          ['Pragmatism Over Dogma', '以项目现实约束为准'],
          ['Update Before Create', '优先更新已有文档与规则'],
        ],
      ),
    ),
    renderSection('Harness Collaboration', governance),
  ]);
}

export function generateClaudeTemplate(context: GeneratorContext): GeneratorResult {
  const existingContent = context.existingContent ?? '';
  const strategy = pickBestStrategy(context, existingContent.trim().length > 0);
  const content = buildClaudeBody(context);
  const merged = mergeDocuments({
    existingContent,
    generatedContent: content,
    strategy,
    blockName: 'governance-notes',
  });

  const normalizedExisting = existingContent.trim() ? existingContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim() : '';
  const normalizedMerged = merged.mergedContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const action = !normalizedExisting ? 'create' : normalizedExisting === normalizedMerged ? 'skip' : merged.action === 'prompt' ? 'prompt' : 'merge';
  return buildGeneratorResult({
    filePath: context.targetPath,
    action,
    strategy,
    reason: existingContent.trim() ? 'CLAUDE.md already exists, preserve user content and refresh Harness-managed guidance' : 'new CLAUDE.md generated from detection results',
    content: merged.mergedContent,
    existingContent,
    markers: [
      {
        name: 'governance-notes',
        start: '<!-- HARNESS_DYNAMIC_SECTION_START:GOVERNANCE_NOTES -->',
        end: '<!-- HARNESS_DYNAMIC_SECTION_END:GOVERNANCE_NOTES -->',
        content: 'governance notes',
      },
    ],
    notes: merged.notes,
  });
}

export default generateClaudeTemplate;
