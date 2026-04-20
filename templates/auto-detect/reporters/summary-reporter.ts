export interface SummaryReporterInput {
  mode?: string;
  detected?: unknown;
  generated?: unknown;
  planned?: unknown;
  applied?: unknown;
  skipped?: unknown;
  backedUp?: unknown;
  confirmRequired?: boolean;
  title?: string;
}

export function renderSummaryReport(input: SummaryReporterInput): string {
  const title = input.title ?? 'Installer Summary';
  const mode = input.mode ?? 'confirm';
  const detected = count(input.detected);
  const generated = count(input.generated);
  const planned = count(input.planned);
  const applied = count(input.applied);
  const skipped = count(input.skipped);
  const backedUp = count(input.backedUp);
  const confirmRequired = input.confirmRequired ?? mode === 'confirm';

  const lines = [
    title,
    repeat('=', title.length),
    `Mode: ${mode}`,
    `Detected: ${detected}`,
    `Generated: ${generated}`,
    `Planned changes: ${planned}`,
    `Applied: ${applied}`,
    `Skipped: ${skipped}`,
    `Backups created: ${backedUp}`,
    `Confirmation required: ${confirmRequired ? 'yes' : 'no'}`,
  ];

  return lines.join('\n').trim();
}

export default renderSummaryReport;

function count(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['items', 'files', 'outputs', 'changes', 'generated', 'planned', 'applied', 'skipped']) {
      const candidate = record[key];
      if (Array.isArray(candidate)) {
        return candidate.length;
      }
    }
  }

  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? (value ? 1 : 0) : 0;
}

function repeat(char: string, count: number): string {
  return Array.from({ length: count }, () => char).join('');
}
