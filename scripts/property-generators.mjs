/**
 * scripts/property-generators.mjs
 *
 * Hand-written property generators for the agent-as-writer smoke + property
 * suite. Used by the nine property tests defined in
 * `.kiro/specs/agent-as-writer/design.md` §"Correctness Properties" and
 * wired into `scripts/smoke-suite.mjs` by tasks 6.1 / 6.3.
 *
 * Exports
 *   - genHashRecordedPlan({ wellFormed?, mutateField?, seed? })
 *       Builds a JSON-serialisable Hash_Recorded_Plan. With the default
 *       `wellFormed: true, mutateField: null`, the result passes the
 *       canonical `validateHashRecordedPlan` from
 *       `templates/auto-detect/hash-recorded-plan.ts`. Setting
 *       `mutateField` deliberately violates one Property 1 / Property 2
 *       invariant.
 *   - genTmpdirState({ priorFiles?, seed? })
 *       Allocates a fresh `os.tmpdir()/harness-prop-<hex>/` and writes a
 *       small set of pre-existing files. Returns the tmpdir plus per-file
 *       metadata so tests can assert "untouched on disk after dry-run /
 *       matches backup after apply".
 *   - cleanupTmpdir(tmpdir)
 *       Best-effort `fs.rm(tmpdir, { recursive, force })` for callers to
 *       use between iterations.
 *   - genFailureInjector({ failPattern, seed? })
 *       Pure decision function returning `{ shouldFail, decision }`. Used
 *       by Property 4 to wrap the file writer / inject thrown errors.
 *
 * Determinism
 *   Every generator is seeded via the `seed: number` argument. The same
 *   seed produces the same sequence. The PRNG is a small `mulberry32`
 *   over a 32-bit seed (single hot path, no external dependencies).
 *
 * Constraints
 *   Node built-ins only — no `fast-check`, no third-party packages.
 *   AGENTS.md mandates this for runtime artifacts; we apply the same
 *   constraint to the test scaffold so smoke stays self-contained.
 */

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import url from 'node:url';

// ---------------------------------------------------------------------------
// Constants — kept in sync with templates/auto-detect/hash-recorded-plan.ts
// ---------------------------------------------------------------------------

/**
 * The six physical Root_Truth_File path tails. Mirrors
 * `ROOT_TRUTH_TARGETS` in `templates/auto-detect/hash-recorded-plan.ts`.
 * The Cursor pair is two physical files (rules + commands).
 */
export const ROOT_TRUTH_TARGETS = Object.freeze([
  'AGENTS.md',
  'CLAUDE.md',
  'DESIGN.md',
  'steering/harness-recommendations.md',
  '.cursor/rules/harness.mdc',
  '.cursor/commands/harness-init.md',
]);

/** The three valid `HashRecordedEntry.action` values. */
export const ALLOWED_ACTIONS = Object.freeze(['create', 'overwrite', 'patch-section']);

/** Field names accepted by `genHashRecordedPlan({ mutateField })`. */
export const MUTATE_FIELDS = Object.freeze([
  'schemaVersion',
  'action',
  'contentSha256',
  'targetPartition',
]);

// ---------------------------------------------------------------------------
// Seeded PRNG — single hot path used by every generator
// ---------------------------------------------------------------------------

/**
 * mulberry32(seed) — deterministic 32-bit PRNG. Returns a function that
 * yields a fresh `[0, 1)` float on every call. The same `seed` produces
 * the same sequence indefinitely.
 *
 * Sourced from the public-domain `mulberry32` reference; no attribution
 * is required, but we vendor it here rather than reach for a package.
 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build a seeded RNG. Accepts any 32-bit integer; non-integer or
 * out-of-range values are coerced via `>>> 0`. Defaults to `1` so
 * generators called without a `seed` are still reproducible.
 */
function seededRng(seed = 1) {
  return mulberry32(Number(seed) >>> 0);
}

/** Pick a uniformly-random element from `arr`. */
function pickFrom(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

/** Inclusive-inclusive integer in `[min, max]`. */
function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Lowercase hex string of `bytes` random bytes (seeded). */
function randHex(rng, bytes) {
  let out = '';
  for (let i = 0; i < bytes; i += 1) {
    out += Math.floor(rng() * 256).toString(16).padStart(2, '0');
  }
  return out;
}

/** Fisher-Yates shuffle; mutates `arr` and returns it. */
function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

// ---------------------------------------------------------------------------
// SHA-256 helper
// ---------------------------------------------------------------------------

/**
 * Compute SHA-256 of a UTF-8 string, lowercase hex (64 chars). Matches
 * `computeContentSha256` in `templates/auto-detect/hash-recorded-plan.ts`
 * exactly so generated `contentSha256` fields satisfy invariant (g) of
 * Property 1.
 */
function sha256Hex(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

// ---------------------------------------------------------------------------
// Run-id / timestamp helpers
// ---------------------------------------------------------------------------

/**
 * Build a run-id matching the canonical pattern `\d{8}-\d{6}-[a-f0-9]{6}`.
 * The numeric prefix is rendered from a seeded clock so generated plans
 * are stable across runs with the same seed.
 */
function genRunId(rng) {
  // Pick a date in 2024-2026 so the prefix is plausible.
  const year = randInt(rng, 2024, 2026);
  const month = String(randInt(rng, 1, 12)).padStart(2, '0');
  const day = String(randInt(rng, 1, 28)).padStart(2, '0');
  const hour = String(randInt(rng, 0, 23)).padStart(2, '0');
  const minute = String(randInt(rng, 0, 59)).padStart(2, '0');
  const second = String(randInt(rng, 0, 59)).padStart(2, '0');
  const tail = randHex(rng, 3); // 6 hex chars
  return `${year}${month}${day}-${hour}${minute}${second}-${tail}`;
}

/** ISO-8601 timestamp; seeded so the same seed produces the same value. */
function genTimestamp(rng) {
  const year = randInt(rng, 2024, 2026);
  const month = String(randInt(rng, 1, 12)).padStart(2, '0');
  const day = String(randInt(rng, 1, 28)).padStart(2, '0');
  const hour = String(randInt(rng, 0, 23)).padStart(2, '0');
  const minute = String(randInt(rng, 0, 59)).padStart(2, '0');
  const second = String(randInt(rng, 0, 59)).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
}

// ---------------------------------------------------------------------------
// Content helpers
// ---------------------------------------------------------------------------

/**
 * Build the `content` bytes for an HRP entry. The string contains a
 * deterministic header and a `##` heading section with random body lines.
 * For `patch-section`, the heading section is the part the agent would
 * patch; bytes outside the heading are header text that must be preserved.
 */
function genEntryContent(rng, targetTail) {
  const header = [
    `# Generated for property test`,
    `target: ${targetTail}`,
    `seed-fingerprint: ${randHex(rng, 4)}`,
    '',
  ].join('\n');
  const sectionLines = randInt(rng, 1, 3);
  const sectionBody = [];
  for (let i = 0; i < sectionLines; i += 1) {
    sectionBody.push(`generated-line-${randHex(rng, 4)}`);
  }
  return `${header}\n## Dynamic Section\n\n${sectionBody.join('\n')}\n`;
}

/** Sample a non-empty evidence reason. */
function genEvidenceReason(rng) {
  const reasons = [
    'detection.json reports no prior AGENTS.md',
    'overwrite — prior file is harness-managed',
    'create — fresh repo with no Root_Truth_File',
    'skip — user opted out via summary',
    'patch-section — only the heading section needs refresh',
  ];
  return pickFrom(reasons, rng);
}

/** Sample a non-empty skip reason. */
function genSkipReason(rng) {
  const reasons = [
    'agent had no evidence to populate this file',
    'user already maintains this file by hand',
    'cursor not detected; skipping cursor pair',
    'steering directory does not exist; skipping',
  ];
  return pickFrom(reasons, rng);
}

// ---------------------------------------------------------------------------
// genHashRecordedPlan
// ---------------------------------------------------------------------------

/**
 * Build a Hash_Recorded_Plan suitable for property tests.
 *
 * Returns `{ plan, meta }`. `plan` is the JSON-serialisable HRP object
 * that should be passed to `validateHashRecordedPlan`. `meta` carries
 * the generator settings for debugging (intentionally a sibling so it
 * does not pollute the HRP shape).
 *
 * Options
 *   wellFormed (default true)
 *     When true and `mutateField` is null, the result MUST pass
 *     `validateHashRecordedPlan`.
 *   mutateField (default null)
 *     When set, deliberately mutates the named field to violate one
 *     Property 1 invariant. Valid values:
 *       'schemaVersion'                       — sets a wrong version
 *       'action'                              — uses an invalid action
 *       'contentSha256'                       — mismatched hash
 *       'targetPartition'                     — writes a path tail outside
 *                                               ROOT_TRUTH_TARGETS
 *   seed (default 1)
 *     32-bit seed for the deterministic PRNG. Same seed ⇒ same plan.
 */
export function genHashRecordedPlan(options = {}) {
  const { wellFormed = true, mutateField = null, seed = 1 } = options;
  if (mutateField !== null && !MUTATE_FIELDS.includes(mutateField)) {
    throw new Error(
      `genHashRecordedPlan: unknown mutateField ${JSON.stringify(mutateField)}. ` +
        `Valid: ${MUTATE_FIELDS.join(', ')}`,
    );
  }
  const rng = seededRng(seed);

  const targetRoot = `/tmp/harness-prop-${randHex(rng, 4)}`;

  // Pick at least 3 distinct entries (mix of actions) plus 1 skipped.
  // The target set has six physical paths; we always pick all six
  // and partition them across entries vs. skipped.
  const allTails = [...ROOT_TRUTH_TARGETS];
  shuffle(allTails, rng);
  const skippedCount = 1; // exactly one skipped (per task spec "1 skippedEntries")
  const entryTails = allTails.slice(0, allTails.length - skippedCount);
  const skippedTails = allTails.slice(allTails.length - skippedCount);

  // Force at least one of each action across the entries. With four entry
  // tails available, we guarantee a `create`, `overwrite`, and
  // `patch-section`; the fourth gets a seeded random pick.
  const actionAssignments = ['create', 'overwrite', 'patch-section'];
  while (actionAssignments.length < entryTails.length) {
    actionAssignments.push(pickFrom(ALLOWED_ACTIONS, rng));
  }
  shuffle(actionAssignments, rng);

  const entries = entryTails.map((tail, i) => {
    const action = actionAssignments[i];
    const content = genEntryContent(rng, tail);
    return {
      path: `${targetRoot}/${tail}`,
      action,
      content,
      contentSha256: sha256Hex(content),
      evidenceReason: genEvidenceReason(rng),
    };
  });

  const skipped = skippedTails.map((tail) => ({
    path: `${targetRoot}/${tail}`,
    reason: genSkipReason(rng),
  }));

  /** @type {Record<string, unknown>} */
  const plan = {
    runId: genRunId(rng),
    schemaVersion: '2.0.0',
    timestamp: genTimestamp(rng),
    targetPath: targetRoot,
    detectRunId: genRunId(rng),
    entries,
    skipped,
    summary: `Generated by genHashRecordedPlan(seed=${seed})`,
  };

  // Apply the requested mutation, if any.
  if (mutateField !== null) {
    applyMutation(plan, mutateField, rng);
  }

  return {
    plan,
    meta: { wellFormed: wellFormed && mutateField === null, mutateField, seed },
  };
}

/**
 * Mutate a well-formed plan so it violates one specific invariant.
 * Each branch picks a representative violation; tests assert the
 * validator rejects the mutated plan with a message naming the field.
 */
function applyMutation(plan, mutateField, rng) {
  switch (mutateField) {
    case 'schemaVersion':
      // (Property 1) — schemaVersion must be the literal '2.0.0'.
      plan.schemaVersion = '1.1.0';
      return;

    case 'action': {
      // (Property 1, invariant a) — action ∉ {create, overwrite, patch-section}.
      const idx = randInt(rng, 0, plan.entries.length - 1);
      plan.entries[idx].action = 'rewrite';
      return;
    }

    case 'contentSha256': {
      // (Property 1, invariant g) — contentSha256 ≠ sha256(content).
      const idx = randInt(rng, 0, plan.entries.length - 1);
      // Flip one nibble of the existing hash so the format stays valid
      // (64-char lowercase hex) but the value diverges from the content.
      const original = plan.entries[idx].contentSha256;
      const firstChar = original[0] === '0' ? '1' : '0';
      plan.entries[idx].contentSha256 = firstChar + original.slice(1);
      return;
    }

    case 'targetPartition': {
      // (Property 1, invariant b/f) — path tail outside ROOT_TRUTH_TARGETS.
      const idx = randInt(rng, 0, plan.entries.length - 1);
      plan.entries[idx].path = `${plan.targetPath}/not/a/root_truth/file.md`;
      return;
    }

    default:
      // Unreachable — the constructor guards against unknown values.
      throw new Error(`applyMutation: unhandled mutateField ${mutateField}`);
  }
}

// ---------------------------------------------------------------------------
// genTmpdirState
// ---------------------------------------------------------------------------

/**
 * Allocate a fresh `os.tmpdir()/harness-prop-<hex>/` and write a small
 * set of pre-existing files inside it. Returns metadata so tests can
 * later assert "untouched on disk after dry-run" or "matches backup
 * after apply".
 *
 * Options
 *   priorFiles (default 'random')
 *     Number (exact count, 0..5) or `'random'` (seeded 0..5 inclusive).
 *   seed (default 1)
 *     32-bit seed. Same seed ⇒ same prior files (modulo the random
 *     hex in the tmpdir name, which is intentionally crypto-random
 *     so concurrent test workers do not collide on disk).
 *
 * Returns
 *   {
 *     tmpdir,                             // absolute path
 *     files: [
 *       { path, originalContent }
 *     ],
 *   }
 *
 * Caller must invoke `cleanupTmpdir(tmpdir)` between iterations.
 */
export async function genTmpdirState(options = {}) {
  const { priorFiles = 'random', seed = 1 } = options;
  const rng = seededRng(seed);

  // The tmpdir name uses crypto.randomBytes (NOT the seeded PRNG) so two
  // generators called with the same seed in parallel do not allocate the
  // same path. The file count and contents remain seed-deterministic.
  const tmpdir = path.join(os.tmpdir(), `harness-prop-${crypto.randomBytes(6).toString('hex')}`);
  await fs.mkdir(tmpdir, { recursive: true });

  const fileCount = priorFiles === 'random' ? randInt(rng, 0, 5) : Number(priorFiles);
  if (!Number.isInteger(fileCount) || fileCount < 0) {
    throw new Error(
      `genTmpdirState: priorFiles must be 'random' or a non-negative integer; got ${JSON.stringify(priorFiles)}`,
    );
  }

  const tailPool = [
    'AGENTS.md',
    'CLAUDE.md',
    'DESIGN.md',
    'steering/harness-recommendations.md',
    '.cursor/rules/harness.mdc',
    '.cursor/commands/harness-init.md',
  ];
  const chosen = shuffle([...tailPool], rng).slice(0, fileCount);

  const files = [];
  for (const tail of chosen) {
    const abs = path.join(tmpdir, tail);
    await fs.mkdir(path.dirname(abs), { recursive: true });

    const header = `# Pre-existing file at ${tail}\nseed-fingerprint: ${randHex(rng, 4)}\n\n`;
    const body = `## Dynamic Section\n\nplain user content ${randHex(rng, 4)}`;
    const content = `${header}\n${body}\n`;

    await fs.writeFile(abs, content, 'utf8');
    files.push({ path: abs, originalContent: content });
  }

  return { tmpdir, files };
}

/**
 * Best-effort tmpdir teardown. Swallows ENOENT and similar so callers
 * can invoke unconditionally between property iterations.
 */
export async function cleanupTmpdir(tmpdir) {
  if (typeof tmpdir !== 'string' || tmpdir.length === 0) return;
  try {
    await fs.rm(tmpdir, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup; never surface as a test failure.
  }
}

// ---------------------------------------------------------------------------
// genFailureInjector
// ---------------------------------------------------------------------------

/**
 * Build a pure decision function that decides which paths the file
 * writer should "fail" on. Used by Property 4 (apply continues past
 * per-entry write failure).
 *
 * Options
 *   failPattern (required)
 *     'all'    — every observed path returns true.
 *     'first'  — the first observed path returns true; every later one
 *                returns false. Re-observing the same first path keeps
 *                returning true (idempotent per-path decision).
 *     'random' — each unique path gets a seeded coin flip on first
 *                observation; the decision is cached so repeated
 *                queries against the same path return the same answer.
 *   seed (default 1)
 *     32-bit seed. Same seed + same path-observation order ⇒ same
 *     decision table.
 *
 * Returns
 *   {
 *     shouldFail: (path: string) => boolean,
 *     decision:   Map<string, boolean>,  // recorded per-path verdicts
 *   }
 *
 * The function is pure with respect to the cached `decision` map: tests
 * can audit the map after the run to assert which paths were chosen
 * to fail (e.g. for cross-checking against `result.json.writtenEntries`).
 */
export function genFailureInjector(options = {}) {
  const { failPattern, seed = 1 } = options;
  const valid = ['all', 'random', 'first'];
  if (!valid.includes(failPattern)) {
    throw new Error(
      `genFailureInjector: failPattern must be one of ${valid.join('|')}; got ${JSON.stringify(failPattern)}`,
    );
  }
  const rng = seededRng(seed);
  /** @type {Map<string, boolean>} */
  const decision = new Map();
  let firstSeen = null;

  function shouldFail(p) {
    if (typeof p !== 'string') {
      throw new Error(`shouldFail: path must be a string; got ${typeof p}`);
    }
    if (decision.has(p)) return decision.get(p);

    let verdict;
    switch (failPattern) {
      case 'all':
        verdict = true;
        break;
      case 'first':
        if (firstSeen === null) {
          firstSeen = p;
          verdict = true;
        } else {
          verdict = false;
        }
        break;
      case 'random':
        verdict = rng() < 0.5;
        break;
      default:
        // Unreachable — guarded above.
        verdict = false;
    }
    decision.set(p, verdict);
    return verdict;
  }

  return { shouldFail, decision };
}

// ---------------------------------------------------------------------------
// Self-test (only when invoked directly via `node`)
// ---------------------------------------------------------------------------

/**
 * Self-test: confirms that a single seed=42 wellFormed call produces an
 * object that round-trips through `JSON.stringify` and that all three
 * generators run without throwing on default options.
 *
 * The canonical `validateHashRecordedPlan` lives in
 * `templates/auto-detect/hash-recorded-plan.ts` and requires `tsx` to
 * import; we intentionally do not pull it in here so this script stays
 * dep-free. The integration check belongs to `scripts/smoke-suite.mjs`.
 */
async function selfTest() {
  const { plan, meta } = genHashRecordedPlan({ seed: 42, wellFormed: true });
  if (meta.seed !== 42 || meta.wellFormed !== true || meta.mutateField !== null) {
    throw new Error(`selfTest: unexpected meta ${JSON.stringify(meta)}`);
  }
  if (plan.schemaVersion !== '2.0.0') {
    throw new Error(`selfTest: expected schemaVersion 2.0.0, got ${plan.schemaVersion}`);
  }
  if (!Array.isArray(plan.entries) || plan.entries.length < 3) {
    throw new Error(`selfTest: expected ≥3 entries, got ${plan.entries?.length}`);
  }
  if (!Array.isArray(plan.skipped) || plan.skipped.length < 1) {
    throw new Error(`selfTest: expected ≥1 skipped, got ${plan.skipped?.length}`);
  }
  // Round-trip through JSON to confirm the plan is JSON-serialisable.
  const round = JSON.parse(JSON.stringify(plan));
  if (round.entries.length !== plan.entries.length) {
    throw new Error(`selfTest: JSON round-trip lost entries`);
  }
  // Smoke-check each generator on default options.
  const tmp = await genTmpdirState({ priorFiles: 2, seed: 42 });
  await cleanupTmpdir(tmp.tmpdir);
  const inj = genFailureInjector({ failPattern: 'first', seed: 42 });
  if (inj.shouldFail('/a') !== true) throw new Error(`selfTest: 'first' pattern broken`);
  if (inj.shouldFail('/b') !== false) throw new Error(`selfTest: 'first' pattern not isolating`);
  if (inj.shouldFail('/a') !== true) throw new Error(`selfTest: per-path cache broken`);
  process.stdout.write('ok\n');
}

if (import.meta.url === url.pathToFileURL(process.argv[1] ?? '').href) {
  selfTest().catch((err) => {
    process.stderr.write(`${err?.stack ?? err}\n`);
    process.exit(1);
  });
}
