export interface DiffReporterInput {
  diff?: unknown;
  changes?: unknown;
  applied?: unknown;
  skipped?: unknown;
  title?: string;
}

export function renderDiffReport(input: DiffReporterInput): string {
  const title = input.title ?? 'Installer Diff';
  const raw = asString(input.diff) ?? extractText(input.diff);
  if (raw) {
    return [title, repeat('=', title.length), normalizeDiff(raw)].join('\n').trim();
  }

  const changes = normalizeChanges(input.changes ?? input.diff);
  const rendered = changes.map((change) => renderChange(change));

  return [title, repeat('=', title.length), ...rendered].join('\n\n').trim();
}

export default renderDiffReport;

interface ChangeLike {
  path: string;
  action: string;
  content?: string;
  previousContent?: string;
  risk: string;
  conflict: boolean;
  reason?: string;
  skipReason?: string;
}

function renderChange(change: ChangeLike): string {
  const header = `${change.action.toUpperCase()} ${change.path}${change.conflict ? ' [conflict]' : ''}${change.risk ? ` [risk:${change.risk}]` : ''}`;
  const detail: string[] = [header];

  if (change.reason) {
    detail.push(`Reason: ${change.reason}`);
  }

  if (change.skipReason) {
    detail.push(`Skip: ${change.skipReason}`);
  }

  if (change.action === 'delete') {
    detail.push(renderDelete(change.previousContent ?? ''));
    return detail.join('\n');
  }

  if (!change.previousContent && change.content) {
    detail.push(renderCreate(change.content));
    return detail.join('\n');
  }

  detail.push(renderUpdate(change.previousContent ?? '', change.content ?? ''));
  return detail.join('\n');
}

function renderCreate(content: string): string {
  return ['--- /dev/null', '+++ new file', ...prefixLines(content, '+')].join('\n');
}

function renderDelete(content: string): string {
  return ['--- old file', '+++ /dev/null', ...prefixLines(content, '-')].join('\n');
}

function renderUpdate(before: string, after: string): string {
  const diffLines = computeLineDiff(before, after);
  return ['--- before', '+++ after', ...diffLines].join('\n');
}

function computeLineDiff(before: string, after: string): string[] {
  const beforeLines = splitLines(before);
  const afterLines = splitLines(after);

  if (beforeLines.length === 0 && afterLines.length === 0) {
    return ['(empty)'];
  }

  if (beforeLines.join('\n') === afterLines.join('\n')) {
    return ['(no content change)'];
  }

  const prefix = commonPrefix(beforeLines, afterLines);
  const suffix = commonSuffix(beforeLines.slice(prefix), afterLines.slice(prefix));
  const beforeMiddle = beforeLines.slice(prefix, beforeLines.length - suffix);
  const afterMiddle = afterLines.slice(prefix, afterLines.length - suffix);
  const lines: string[] = [];

  if (prefix > 0) {
    lines.push('@@ context @@');
    lines.push(...beforeLines.slice(0, prefix).map((line) => ` ${line}`));
  }

  for (const line of beforeMiddle) {
    lines.push(`- ${line}`);
  }
  for (const line of afterMiddle) {
    lines.push(`+ ${line}`);
  }

  if (suffix > 0) {
    lines.push('@@ context @@');
    lines.push(...beforeLines.slice(beforeLines.length - suffix).map((line) => ` ${line}`));
  }

  return lines;
}

function commonPrefix(left: string[], right: string[]): number {
  let index = 0;
  while (index < left.length && index < right.length && left[index] === right[index]) {
    index += 1;
  }
  return index;
}

function commonSuffix(left: string[], right: string[]): number {
  let index = 0;
  while (
    index < left.length &&
    index < right.length &&
    left[left.length - 1 - index] === right[right.length - 1 - index]
  ) {
    index += 1;
  }
  return index;
}

function prefixLines(content: string, sign: '+' | '-'): string[] {
  return splitLines(content).map((line) => `${sign} ${line}`);
}

function splitLines(content: string): string[] {
  if (!content) {
    return [];
  }
  return content.replace(/\r\n/g, '\n').split('\n');
}

function normalizeDiff(value: string): string {
  return value.replace(/\r\n/g, '\n').trim();
}

function normalizeChanges(value: unknown): ChangeLike[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(normalizeChange).filter((item): item is ChangeLike => Boolean(item.path));
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['changes', 'files', 'outputs', 'items', 'planned', 'writes']) {
      const candidate = record[key];
      if (Array.isArray(candidate)) {
        return candidate.map(normalizeChange).filter((item): item is ChangeLike => Boolean(item.path));
      }
    }

    if (record.path || record.filePath || record.filename) {
      return [normalizeChange(record)];
    }
  }

  return [];
}

function normalizeChange(value: unknown): ChangeLike {
  if (typeof value === 'string') {
    return {
      path: value,
      action: 'update',
      risk: 'unknown',
      conflict: false,
    };
  }

  const record = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  return {
    path: String(record.path ?? record.filePath ?? record.filename ?? record.name ?? '').trim(),
    action: String(record.action ?? record.operation ?? 'update'),
    content: asString(record.content ?? record.value ?? record.generated ?? record.after ?? record.text),
    previousContent: asString(record.previousContent ?? record.before ?? record.original ?? record.existing ?? record.oldContent),
    risk: String(record.risk ?? record.severity ?? 'unknown'),
    conflict: toBoolean(record.conflict ?? record.hasConflict ?? record.conflicted),
    reason: asString(record.reason ?? record.message ?? record.description ?? record.note),
    skipReason: asString(record.skipReason),
  };
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function extractText(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  for (const key of ['diff', 'patch', 'text', 'markdown', 'output']) {
    const candidate = record[key];
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }

  return undefined;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return false;
}

function repeat(char: string, count: number): string {
  return Array.from({ length: count }, () => char).join('');
}
