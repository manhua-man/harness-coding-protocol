/**
 * Hash_Recorded_Plan (HRP) — v2.0.0 Phase 4 artifact contract.
 *
 * The HRP is the contract between Phase 4 (the agent-rendered "show & confirm"
 * step) and Phase 5 (`runInitApplyFromPlan`). At the moment the user types
 * `yes`, the agent records the bytes it intends to write together with their
 * SHA-256. Phase 5 writes those exact bytes verbatim and records what landed
 * in `result.json` — no re-detection, no plan recomputation.
 *
 * See `.kiro/specs/agent-as-writer/design.md` §Data Models for the full
 * shape, and §Correctness Properties (Property 1) for the invariants the
 * validator enforces.
 *
 * Node built-ins only — AGENTS.md mandates the runtime stays free of
 * external dependencies.
 */

import crypto from 'node:crypto';

/**
 * The Phase 4 artifact persisted at `.harness/runs/<plan-run-id>/plan.json`.
 *
 * See design.md §Data Models for the per-field contract; see Property 1 in
 * §Correctness Properties for the invariants `validateHashRecordedPlan`
 * enforces.
 */
export interface HashRecordedPlan {
  /** Run id, format `\d{8}-\d{6}-[a-f0-9]{6}`. Matches `RUN_ID_PATTERN`. */
  runId: string;
  /** Schema version of the HRP contract. v2.0.0 only. */
  schemaVersion: '2.0.0';
  /** ISO-8601 timestamp recorded at the user's `yes`. */
  timestamp: string;
  /** Absolute target path the run was scoped to. */
  targetPath: string;
  /** Run id of the upstream `detection.json` produced in Phase 1. */
  detectRunId: string;
  /** One entry per non-skip Root_Truth_File. */
  entries: HashRecordedEntry[];
  /** Skipped Root_Truth_Files, recorded for audit. */
  skipped: SkippedEntry[];
  /** Verbatim of `summary.md` rendered in Phase 4. */
  summary: string;
}

/**
 * One non-skip entry inside a {@link HashRecordedPlan}.
 *
 * See design.md §Data Models. Property 1 guarantees:
 *   - `action` is one of the three allowed values
 *   - `evidenceReason` is non-empty after trim
 *   - `contentSha256 === computeContentSha256(content)`
 *   - `path` ends with one of {@link ROOT_TRUTH_TARGETS}
 */
export interface HashRecordedEntry {
  /** Absolute path to the Root_Truth_File the entry will write. */
  path: string;
  /** Per_File_Action chosen by the agent in Phase 3. */
  action: 'create' | 'overwrite' | 'patch-section';
  /** Intended bytes for `path`, exactly as they will land on disk. */
  content: string;
  /** SHA-256 of `content`, lowercase hex, 64 chars. */
  contentSha256: string;
  /** One-line, non-empty evidence reason from Phase 3. */
  evidenceReason: string;
}

/**
 * One skipped Root_Truth_File entry inside a {@link HashRecordedPlan}.
 *
 * See design.md §Data Models. The `reason` field is required and must be
 * non-empty after trim per Requirement 3.5.
 */
export interface SkippedEntry {
  /** Absolute path of the skipped Root_Truth_File. Ends with one of {@link ROOT_TRUTH_TARGETS}. */
  path: string;
  /** One-line reason the agent chose `skip`. Non-empty after trim. */
  reason: string;
}

/**
 * The six physical Root_Truth_File path tails. The Cursor pair counts as
 * two physical paths (one Per_File_Action per physical file per
 * design.md §Risk Register). HRP path validation uses `endsWith` so callers
 * may supply absolute paths.
 *
 * See requirements.md Glossary "Root_Truth_File" and design.md §Data Models.
 */
export const ROOT_TRUTH_TARGETS = [
  'AGENTS.md',
  'CLAUDE.md',
  'DESIGN.md',
  'steering/harness-recommendations.md',
  '.cursor/rules/harness.mdc',
  '.cursor/commands/harness-init.md',
] as const;

const ALLOWED_ACTIONS = new Set<HashRecordedEntry['action']>([
  'create',
  'overwrite',
  'patch-section',
]);
const RUN_ID_PATTERN = /^\d{8}-\d{6}-[a-f0-9]{6}$/;
const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/;

/**
 * Compute SHA-256 of a UTF-8 string, returned as lowercase hex (64 chars).
 *
 * Used to populate {@link HashRecordedEntry.contentSha256} in Phase 4 and to
 * verify byte-identity of writes in Phase 5.
 *
 * Sanity check: `computeContentSha256('test')` returns
 * `9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08`.
 */
export function computeContentSha256(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Assert that `data` is a well-formed {@link HashRecordedPlan}.
 *
 * Enforces Property 1 from design.md §Correctness Properties:
 *  (a) every entry's `action` is one of `create | overwrite | patch-section`
 *  (b) `entries[].path` and `skipped[].path` partition the canonical
 *      Root_Truth_File targets — every path tail must match one of
 *      {@link ROOT_TRUTH_TARGETS}, and no path appears in both lists
 *  (c) every `evidenceReason` and `skipped[].reason` is non-empty after trim
 *  (d) every `entries[].path` tail is in {@link ROOT_TRUTH_TARGETS}
 *      (subsumed by (b))
 *  (e) `contentSha256 === computeContentSha256(content)` for every entry
 *
 * Plus structural checks: `schemaVersion === '2.0.0'`, `runId` matches
 * `RUN_ID_PATTERN`, `timestamp` / `targetPath` / `detectRunId` are non-empty
 * strings, and `entries` / `skipped` are arrays.
 *
 * On any failure, throws an `Error` whose message names the first failed
 * invariant and (when relevant) the offending entry index, path, or value.
 */
export function validateHashRecordedPlan(
  data: unknown,
): asserts data is HashRecordedPlan {
  if (!isPlainObject(data)) {
    throw new Error(
      `HashRecordedPlan: expected plain object, got ${describe(data)}`,
    );
  }

  const obj = data as Record<string, unknown>;

  // schemaVersion
  if (obj.schemaVersion !== '2.0.0') {
    throw new Error(
      `HashRecordedPlan.schemaVersion: expected '2.0.0', got ${describe(obj.schemaVersion)}`,
    );
  }

  // runId
  if (typeof obj.runId !== 'string' || !RUN_ID_PATTERN.test(obj.runId)) {
    throw new Error(
      `HashRecordedPlan.runId: expected string matching ${RUN_ID_PATTERN}, got ${describe(obj.runId)}`,
    );
  }

  // timestamp / targetPath / detectRunId
  assertNonEmptyString(obj.timestamp, 'HashRecordedPlan.timestamp');
  assertNonEmptyString(obj.targetPath, 'HashRecordedPlan.targetPath');
  assertNonEmptyString(obj.detectRunId, 'HashRecordedPlan.detectRunId');

  // summary
  if (typeof obj.summary !== 'string') {
    throw new Error(
      `HashRecordedPlan.summary: expected string, got ${describe(obj.summary)}`,
    );
  }

  // entries / skipped
  if (!Array.isArray(obj.entries)) {
    throw new Error(
      `HashRecordedPlan.entries: expected array, got ${describe(obj.entries)}`,
    );
  }
  if (!Array.isArray(obj.skipped)) {
    throw new Error(
      `HashRecordedPlan.skipped: expected array, got ${describe(obj.skipped)}`,
    );
  }

  // entries[*]
  const seenPaths = new Set<string>();
  for (let i = 0; i < obj.entries.length; i += 1) {
    const entry = obj.entries[i];
    validateEntry(entry, i);
    // (b) partition: path uniqueness across entries
    const entryPath = (entry as HashRecordedEntry).path;
    if (seenPaths.has(entryPath)) {
      throw new Error(
        `HashRecordedPlan.entries[${i}].path: duplicate path ${describe(entryPath)} (paths must partition Root_Truth_Targets)`,
      );
    }
    seenPaths.add(entryPath);
  }

  // skipped[*]
  for (let i = 0; i < obj.skipped.length; i += 1) {
    const skipped = obj.skipped[i];
    validateSkipped(skipped, i);
    const skippedPath = (skipped as SkippedEntry).path;
    // (b) partition: a skipped path must not also appear in entries
    if (seenPaths.has(skippedPath)) {
      throw new Error(
        `HashRecordedPlan.skipped[${i}].path: ${describe(skippedPath)} also appears in entries[] (paths must partition Root_Truth_Targets)`,
      );
    }
    seenPaths.add(skippedPath);
  }
}

function validateEntry(value: unknown, index: number): void {
  const ctx = `HashRecordedPlan.entries[${index}]`;
  if (!isPlainObject(value)) {
    throw new Error(`${ctx}: expected plain object, got ${describe(value)}`);
  }
  const entry = value as Record<string, unknown>;

  // path + (d) Root_Truth_Targets membership
  assertNonEmptyString(entry.path, `${ctx}.path`);
  if (!endsWithRootTruthTarget(entry.path as string)) {
    throw new Error(
      `${ctx}.path: ${describe(entry.path)} does not end with any Root_Truth_Target (${ROOT_TRUTH_TARGETS.join(', ')})`,
    );
  }

  // (a) action set
  if (
    typeof entry.action !== 'string' ||
    !ALLOWED_ACTIONS.has(entry.action as HashRecordedEntry['action'])
  ) {
    throw new Error(
      `${ctx}.action: expected one of create|overwrite|patch-section, got ${describe(entry.action)}`,
    );
  }

  // content
  if (typeof entry.content !== 'string') {
    throw new Error(
      `${ctx}.content: expected string, got ${describe(entry.content)}`,
    );
  }

  // contentSha256: format + (e) hash-matches-content
  if (
    typeof entry.contentSha256 !== 'string' ||
    !SHA256_HEX_PATTERN.test(entry.contentSha256)
  ) {
    throw new Error(
      `${ctx}.contentSha256: expected 64-char lowercase hex, got ${describe(entry.contentSha256)}`,
    );
  }
  const expectedHash = computeContentSha256(entry.content);
  if (entry.contentSha256 !== expectedHash) {
    throw new Error(
      `${ctx}.contentSha256: hash mismatch for path ${describe(entry.path)} (expected ${expectedHash}, got ${entry.contentSha256})`,
    );
  }

  // (c) evidenceReason non-empty
  if (typeof entry.evidenceReason !== 'string' || entry.evidenceReason.trim() === '') {
    throw new Error(
      `${ctx}.evidenceReason: expected non-empty string, got ${describe(entry.evidenceReason)}`,
    );
  }
}

function validateSkipped(value: unknown, index: number): void {
  const ctx = `HashRecordedPlan.skipped[${index}]`;
  if (!isPlainObject(value)) {
    throw new Error(`${ctx}: expected plain object, got ${describe(value)}`);
  }
  const skipped = value as Record<string, unknown>;
  assertNonEmptyString(skipped.path, `${ctx}.path`);
  if (!endsWithRootTruthTarget(skipped.path as string)) {
    throw new Error(
      `${ctx}.path: ${describe(skipped.path)} does not end with any Root_Truth_Target (${ROOT_TRUTH_TARGETS.join(', ')})`,
    );
  }
  // (c) reason non-empty after trim
  if (typeof skipped.reason !== 'string' || skipped.reason.trim() === '') {
    throw new Error(
      `${ctx}.reason: expected non-empty string, got ${describe(skipped.reason)}`,
    );
  }
}

function endsWithRootTruthTarget(value: string): boolean {
  // Normalise Windows backslashes so absolute paths on either OS validate
  // identically against the POSIX-style tails in ROOT_TRUTH_TARGETS.
  const normalised = value.replace(/\\/g, '/');
  for (const tail of ROOT_TRUTH_TARGETS) {
    if (normalised.endsWith(tail)) return true;
  }
  return false;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertNonEmptyString(value: unknown, ctx: string): void {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${ctx}: expected non-empty string, got ${describe(value)}`);
  }
}

function describe(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'string') return JSON.stringify(value);
  return typeof value;
}
