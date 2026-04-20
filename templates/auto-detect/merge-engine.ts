import {
  buildMergePreview,
  countNonEmptyLines,
  ensureTrailingNewline,
  getContentRisk,
  hasHarnessMarker,
  normalizeNewlines,
  splitLines,
  type ConflictLevel,
  type GeneratorAction,
  type MergeStrategy,
  type RiskLevel,
} from './generators/base-generator.js';

export interface MergeEngineInput {
  existingContent?: string;
  generatedContent: string;
  strategy?: MergeStrategy;
  blockName?: string;
  preserveUserContent?: boolean;
}

export interface MergeEngineResult {
  action: GeneratorAction;
  strategy: MergeStrategy;
  conflict: ConflictLevel;
  risk: RiskLevel;
  mergedContent: string;
  preview: ReturnType<typeof buildMergePreview>;
  notes: string[];
}

function findBlock(content: string, blockName?: string): { start: number; end: number } | null {
  if (!blockName) {
    return null;
  }
  const upper = blockName.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  const startMarker = `<!-- HARNESS_DYNAMIC_SECTION_START:${upper} -->`;
  const endMarker = `<!-- HARNESS_DYNAMIC_SECTION_END:${upper} -->`;
  const startIndex = content.indexOf(startMarker);
  if (startIndex < 0) {
    return null;
  }
  const endIndex = content.indexOf(endMarker, startIndex + startMarker.length);
  if (endIndex < 0) {
    return null;
  }
  return { start: startIndex, end: endIndex + endMarker.length };
}

function mergeIncrementally(existingContent: string, generatedContent: string, blockName?: string): { mergedContent: string; notes: string[] } {
  const existing = normalizeNewlines(existingContent);
  const generated = ensureTrailingNewline(generatedContent).trimEnd();
  const block = findBlock(existing, blockName);
  const generatedBlock = findBlock(generated, blockName);
  const replacement = generatedBlock ? generated.slice(generatedBlock.start, generatedBlock.end) : generated;

  if (!existing.trim()) {
    return { mergedContent: ensureTrailingNewline(generated), notes: ['existing content empty, created from generated content'] };
  }

  if (block) {
    const mergedContent = `${existing.slice(0, block.start)}${replacement}${existing.slice(block.end)}`;
    return { mergedContent: ensureTrailingNewline(mergedContent), notes: ['replaced existing harness block in place'] };
  }

  const separator = existing.endsWith('\n\n') ? '' : existing.endsWith('\n') ? '\n' : '\n\n';
  return {
    mergedContent: ensureTrailingNewline(`${existing}${separator}${replacement}`),
    notes: ['appended generated block without touching user-owned content'],
  };
}

function mergeOverwrite(existingContent: string, generatedContent: string): { mergedContent: string; notes: string[] } {
  const hasExisting = countNonEmptyLines(existingContent) > 0;
  return {
    mergedContent: ensureTrailingNewline(generatedContent),
    notes: hasExisting ? ['overwrite requested, replaced previous content'] : ['overwrite requested on empty content'],
  };
}

function mergePrompt(existingContent: string, generatedContent: string): { mergedContent: string; notes: string[] } {
  const previewOnly = buildMergePreview(existingContent, generatedContent, 'prompt');
  const previewLines = previewOnly.lines.slice(0, 18).map((line) => {
    if (line.kind === 'add') return `+ ${line.text}`;
    if (line.kind === 'remove') return `- ${line.text}`;
    return `  ${line.text}`;
  });
  return {
    mergedContent: ensureTrailingNewline(existingContent),
    notes: [
      'prompt strategy selected, no changes applied',
      previewLines.length ? previewLines.join('\n') : 'no preview lines available',
    ],
  };
}

export function mergeDocuments(input: MergeEngineInput): MergeEngineResult {
  const strategy = input.strategy ?? 'incremental';
  const existingContent = input.existingContent ?? '';
  const generatedContent = ensureTrailingNewline(input.generatedContent);

  let merged: { mergedContent: string; notes: string[] };
  let action: GeneratorAction = strategy === 'prompt' ? 'prompt' : strategy === 'overwrite' ? 'merge' : 'merge';

  if (strategy === 'overwrite') {
    merged = mergeOverwrite(existingContent, generatedContent);
  } else if (strategy === 'prompt') {
    merged = mergePrompt(existingContent, generatedContent);
    action = 'prompt';
  } else {
    merged = mergeIncrementally(existingContent, generatedContent, input.blockName);
  }

  const riskProfile = getContentRisk(existingContent, merged.mergedContent, strategy);
  const preview = {
    ...buildMergePreview(existingContent, merged.mergedContent, strategy),
    conflict: riskProfile.conflict,
    risk: riskProfile.risk,
  };

  return {
    action,
    strategy,
    conflict: riskProfile.conflict,
    risk: riskProfile.risk,
    mergedContent: merged.mergedContent,
    preview,
    notes: merged.notes,
  };
}

export function buildHarnessSafeDiff(existingContent: string, generatedContent: string): string {
  const preview = buildMergePreview(existingContent, generatedContent, 'incremental');
  const formatted = preview.lines.map((line) => {
    if (line.kind === 'add') return `+ ${line.text}`;
    if (line.kind === 'remove') return `- ${line.text}`;
    return `  ${line.text}`;
  });
  return ensureTrailingNewline([`strategy: ${preview.strategy}`, `conflict: ${preview.conflict}`, `risk: ${preview.risk}`, ...formatted].join('\n'));
}

export function shouldKeepExistingContent(existingContent?: string): boolean {
  return countNonEmptyLines(existingContent ?? '') > 0 && hasHarnessMarker(existingContent);
}

export function mergeWithFallback(existingContent: string | undefined, generatedContent: string, blockName?: string): MergeEngineResult {
  return mergeDocuments({
    existingContent,
    generatedContent,
    blockName,
    strategy: shouldKeepExistingContent(existingContent) ? 'incremental' : 'prompt',
  });
}
