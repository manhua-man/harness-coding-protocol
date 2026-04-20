export type GeneratorAction = 'create' | 'merge' | 'skip' | 'prompt';
export type MergeStrategy = 'incremental' | 'overwrite' | 'prompt';
export type ConflictLevel = 'none' | 'low' | 'medium' | 'high';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface DetectedSignal {
  name: string;
  confidence?: number;
  source?: string;
}

export interface DetectedStack {
  languages: string[];
  runtimes: string[];
  packageManagers: string[];
  frameworks: string[];
  commands: Array<{ name: string; command: string; source: string }>;
  tools: string[];
  files: string[];
  signals: DetectedSignal[];
  notes: string[];
}

export interface GeneratorContext {
  projectName?: string;
  projectRoot?: string;
  targetPath: string;
  existingContent?: string;
  existingFiles?: string[];
  detected: DetectedStack;
  preferredStrategy?: MergeStrategy;
}

export interface HarnessMarkerBlock {
  name: string;
  start: string;
  end: string;
  content: string;
}

export interface DiffLine {
  kind: 'context' | 'add' | 'remove';
  text: string;
}

export interface MergePreview {
  strategy: MergeStrategy;
  conflict: ConflictLevel;
  risk: RiskLevel;
  lines: DiffLine[];
  summary: string;
}

export interface GeneratorResult {
  filePath: string;
  action: GeneratorAction;
  strategy: MergeStrategy;
  conflict: ConflictLevel;
  risk: RiskLevel;
  reason: string;
  content: string;
  preview: MergePreview;
  markers: HarnessMarkerBlock[];
  notes: string[];
}

export interface RecommendationItem {
  id: string;
  title: string;
  why: string;
  tips: string[];
  hookCode: string;
  confidence: number;
}

export interface EcosystemRecommendation {
  ecosystem: 'node' | 'python' | 'go' | 'generic';
  score: number;
  reason: string;
  recommendations: RecommendationItem[];
}

export interface GeneratedSection {
  title: string;
  body: string;
  markerName?: string;
}

const DEFAULT_MARKER_PREFIX = 'HARNESS_DYNAMIC';

export function normalizeNewlines(input: string | undefined | null): string {
  return (input ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export function ensureTrailingNewline(input: string): string {
  const normalized = normalizeNewlines(input);
  if (!normalized) {
    return '';
  }
  return normalized.endsWith('\n') ? normalized : `${normalized}\n`;
}

export function splitLines(input: string): string[] {
  const normalized = normalizeNewlines(input);
  return normalized ? normalized.split('\n') : [];
}

export function uniqueStrings(values: Array<string | undefined | null>): string[] {
  const seen = new Set<string>();
  for (const value of values) {
    const trimmed = (value ?? '').trim();
    if (trimmed) {
      seen.add(trimmed);
    }
  }
  return Array.from(seen);
}

export function countNonEmptyLines(input: string | undefined | null): number {
  return splitLines(input ?? '').filter((line) => line.trim().length > 0).length;
}

export function hasHarnessMarker(content: string | undefined | null): boolean {
  return normalizeNewlines(content).includes(`${DEFAULT_MARKER_PREFIX}_SECTION_START`);
}

export function renderHarnessBlock(name: string, content: string, label?: string): string {
  const normalizedName = name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  const start = `<!-- ${DEFAULT_MARKER_PREFIX}_SECTION_START:${normalizedName} -->`;
  const end = `<!-- ${DEFAULT_MARKER_PREFIX}_SECTION_END:${normalizedName} -->`;
  const inner = ensureTrailingNewline(content).trimEnd();
  const header = label ? `\n> ${label}\n` : '\n';
  return `${start}${header}${inner}\n${end}`;
}

export function renderHarnessBlocks(blocks: Array<{ name: string; content: string; label?: string }>): string {
  return blocks.map((block) => renderHarnessBlock(block.name, block.content, block.label)).join('\n\n');
}

export function renderFrontmatter(description: string, extraLines: string[] = []): string {
  const lines = ['---', `description: ${description}`, 'alwaysApply: true', ...extraLines, '---'];
  return `${lines.join('\n')}\n`;
}

export function renderMarkdownTable(headers: string[], rows: string[][]): string {
  const headerRow = `| ${headers.join(' | ')} |`;
  const separator = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${row.join(' | ')} |`).join('\n');
  return body ? `${headerRow}\n${separator}\n${body}` : `${headerRow}\n${separator}`;
}

export function renderBulletList(items: string[]): string {
  return items.filter(Boolean).map((item) => `- ${item}`).join('\n');
}

export function renderSection(title: string, body: string): string {
  return `## ${title}\n\n${body.trim()}\n`;
}

export function renderDocument(parts: string[]): string {
  return ensureTrailingNewline(parts.filter(Boolean).join('\n\n'));
}

export function renderSectionedDocument(sections: GeneratedSection[]): string {
  return renderDocument(sections.map((section) => renderSection(section.title, section.body)));
}

export function pickBestStrategy(context: GeneratorContext, hasUserContent: boolean): MergeStrategy {
  if (context.preferredStrategy) {
    return context.preferredStrategy;
  }
  if (!hasUserContent) {
    return 'incremental';
  }
  if (hasHarnessMarker(context.existingContent)) {
    return 'incremental';
  }
  return 'prompt';
}

export function buildDetectionsSummary(context: GeneratorContext): string {
  const detected = context.detected;
  const parts = [
    detected.languages.length ? `languages=${detected.languages.join(', ')}` : '',
    detected.runtimes.length ? `runtimes=${detected.runtimes.join(', ')}` : '',
    detected.packageManagers.length ? `packageManagers=${detected.packageManagers.join(', ')}` : '',
    detected.frameworks.length ? `frameworks=${detected.frameworks.join(', ')}` : '',
    detected.commands.length ? `commands=${detected.commands.map((command) => command.name).join(', ')}` : '',
    detected.tools.length ? `tools=${detected.tools.join(', ')}` : '',
  ].filter(Boolean);
  return parts.join(' | ') || 'no-detections';
}

export function buildMergePreview(existingContent: string, nextContent: string, strategy: MergeStrategy): MergePreview {
  const existingLines = splitLines(existingContent);
  const nextLines = splitLines(nextContent);
  const lines: DiffLine[] = [];
  const max = Math.max(existingLines.length, nextLines.length);
  const limit = Math.min(max, 60);

  for (let index = 0; index < limit; index += 1) {
    const before = existingLines[index];
    const after = nextLines[index];
    if (before === after) {
      if (before !== undefined && lines.length < 12) {
        lines.push({ kind: 'context', text: before });
      }
      continue;
    }
    if (before !== undefined) {
      lines.push({ kind: 'remove', text: before });
    }
    if (after !== undefined) {
      lines.push({ kind: 'add', text: after });
    }
  }

  if (existingLines.length > limit || nextLines.length > limit) {
    lines.push({ kind: 'context', text: '… diff truncated …' });
  }

  const identical = normalizeNewlines(existingContent) === normalizeNewlines(nextContent);
  const summary = identical ? 'No content changes detected.' : `Preview prepared with ${lines.length} diff lines.`;
  return {
    strategy,
    conflict: identical ? 'none' : 'low',
    risk: identical ? 'low' : 'medium',
    lines,
    summary,
  };
}

export function getContentRisk(existingContent: string, nextContent: string, strategy: MergeStrategy): { conflict: ConflictLevel; risk: RiskLevel } {
  const hasExisting = countNonEmptyLines(existingContent) > 0;
  const hasNext = countNonEmptyLines(nextContent) > 0;

  if (!hasExisting && hasNext) {
    return { conflict: 'none', risk: 'low' };
  }

  if (strategy === 'overwrite') {
    return hasExisting ? { conflict: 'high', risk: 'high' } : { conflict: 'low', risk: 'medium' };
  }

  if (strategy === 'prompt') {
    return { conflict: hasExisting ? 'medium' : 'low', risk: 'low' };
  }

  if (hasHarnessMarker(existingContent)) {
    return { conflict: 'low', risk: 'low' };
  }

  return hasExisting ? { conflict: 'medium', risk: 'medium' } : { conflict: 'low', risk: 'low' };
}

export function buildGeneratorResult(params: {
  filePath: string;
  action: GeneratorAction;
  strategy: MergeStrategy;
  reason: string;
  content: string;
  existingContent?: string;
  markers?: HarnessMarkerBlock[];
  notes?: string[];
}): GeneratorResult {
  const existingContent = params.existingContent ?? '';
  const riskProfile = getContentRisk(existingContent, params.content, params.strategy);
  const preview = buildMergePreview(existingContent, params.content, params.strategy);
  return {
    filePath: params.filePath,
    action: params.action,
    strategy: params.strategy,
    conflict: riskProfile.conflict,
    risk: riskProfile.risk,
    reason: params.reason,
    content: ensureTrailingNewline(params.content),
    preview: {
      ...preview,
      conflict: riskProfile.conflict,
      risk: riskProfile.risk,
    },
    markers: params.markers ?? [],
    notes: params.notes ?? [],
  };
}

export function inferEcosystem(context: GeneratorContext): EcosystemRecommendation['ecosystem'] {
  const languages = context.detected.languages.map((value) => value.toLowerCase());
  const files = context.detected.files.map((value) => value.toLowerCase());

  if (languages.includes('go') || files.some((file) => file.endsWith('go.mod'))) {
    return 'go';
  }
  if (languages.includes('python') || files.some((file) => file.endsWith('pyproject.toml') || file.endsWith('requirements.txt'))) {
    return 'python';
  }
  if (languages.includes('javascript') || languages.includes('typescript') || files.some((file) => file.endsWith('package.json'))) {
    return 'node';
  }
  return 'generic';
}

export function buildHookSnippet(language: 'node' | 'python' | 'go', contextName: string): string {
  if (language === 'node') {
    return `export function apply${contextName}Harness(ctx) {\n  return {\n    action: ctx.existingContent ? 'merge' : 'create',\n    markers: ['HARNESS_DYNAMIC_SECTION_START', 'HARNESS_DYNAMIC_SECTION_END'],\n  };\n}`;
  }
  if (language === 'python') {
    return `def apply_${contextName.toLowerCase()}_harness(context):\n    return {\n        "action": "merge" if context.get("existing_content") else "create",\n        "markers": ["HARNESS_DYNAMIC_SECTION_START", "HARNESS_DYNAMIC_SECTION_END"],\n    }`;
  }
  return `func Apply${contextName}Harness(ctx map[string]string) map[string]any {\n\tresult := map[string]any{}\n\tif ctx["existing_content"] != "" {\n\t\tresult["action"] = "merge"\n\t} else {\n\t\tresult["action"] = "create"\n\t}\n\tresult["markers"] = []string{"HARNESS_DYNAMIC_SECTION_START", "HARNESS_DYNAMIC_SECTION_END"}\n\treturn result\n}`;
}

export function dedupeRecommendations(items: RecommendationItem[]): RecommendationItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}
