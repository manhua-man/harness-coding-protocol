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
  changes?: Array<{ action: string; path: string }>;
}

export function renderSummaryReport(input: SummaryReporterInput): string {
  const mode = input.mode ?? 'confirm';
  const applied = count(input.applied);
  const skipped = count(input.skipped);
  const changes = input.changes ?? [];

  // Count actual changes (not skips)
  const creates = changes.filter(c => c.action === 'create').length;
  const updates = changes.filter(c => c.action === 'update').length;
  const skips = changes.filter(c => c.action === 'skip').length;

  // If everything is skipped and up to date, show success message
  if (skips === changes.length && creates === 0 && updates === 0) {
    return '✓ Your project is already configured with Harness!\n\nNo changes needed. All files are up to date.';
  }

  // If in dry-run mode with actual changes
  if (mode === 'dry-run' && (creates > 0 || updates > 0)) {
    const lines = ['📝 Changes proposed:\n'];

    changes.forEach(change => {
      if (change.action === 'create') {
        lines.push(`  + ${change.path} (new file)`);
      } else if (change.action === 'update') {
        lines.push(`  ~ ${change.path} (update)`);
      }
    });

    lines.push('\nRun with --mode confirm to review and apply changes.');
    return lines.join('\n');
  }

  // If changes were applied
  if (applied > 0) {
    return `✓ Successfully applied ${applied} change${applied > 1 ? 's' : ''}!`;
  }

  // Default fallback
  const title = input.title ?? 'Summary';
  const detected = count(input.detected);
  const generated = count(input.generated);
  const planned = count(input.planned);
  const backedUp = count(input.backedUp);
  const confirmRequired = input.confirmRequired ?? mode === 'confirm';

  const lines = [
    title,
    repeat('=', title.length),
    `Mode: ${mode}`,
    `Detected: ${detected}`,
    `Generated: ${generated}`,
    `Planned: ${planned}`,
    `Applied: ${applied}`,
    `Skipped: ${skipped}`,
    `Backups: ${backedUp}`,
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
