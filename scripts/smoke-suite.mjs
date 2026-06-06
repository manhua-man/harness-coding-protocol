/**
 * Detection-only smoke suite + property suite for `/harness-init` v2.0.0
 * (agent-as-writer).
 *
 * Three parts:
 *
 *  Part 1 — Detection-only fixture loop. The v2 flow has no machine-built
 *           plan and no machine-driven apply path: Phases 2-4 are
 *           agent-written and Phase 5 reads a Hash_Recorded_Plan that the
 *           agent itself recorded at the user's "yes". The only deterministic
 *           Phase that is testable from outside is Phase 1 (Detect) — that
 *           is what the fixture loop exercises.
 *
 *  Part 2 — Property + example tests (tasks 6.3, 6.4). Nine properties from
 *           design.md §Correctness Properties run with seeded generators
 *           from `scripts/property-generators.mjs` (≥ 100 iterations each
 *           where pragmatic). Seven example/static checks cover SKILL.md and
 *           apply-from-plan.ts shape.
 *
 *  Part 3 — Golden HRP apply round-trip. Pre-built plan.json files for
 *           four representative fixtures are applied to tmpdir copies;
 *           verifies actualSha256 === intendedSha256 and disk bytes match.
 *
 * For each fixture the suite:
 *   1. Snapshots SHA-256 of every file under the fixture (excluding any
 *      `.harness/` directory that may exist from a prior aborted run).
 *   2. Calls `runInitDetect(fixturePath)` and verifies:
 *        - `runId` matches `\d{8}-\d{6}-[a-f0-9]{6}`
 *        - `detection.report.summary` carries the expected `repoShape`,
 *          `stacks`, `frameworks`, and tool sources for the fixture
 *        - `<fixture>/.harness/runs/<runId>/{detection.json, manifest.json}`
 *          exist and are valid JSON
 *   3. Removes the produced `.harness/` directory.
 *   4. Re-snapshots and asserts byte-equality with step 1, so a regression
 *      in the detector that mutates a fixture file fails the suite loudly.
 *
 * Headless: no IDE, no @clack/prompts, no inquirer. Runtime is Node
 * built-ins only (AGENTS.md). Imports a `.ts` library, so launch via:
 *
 *   npx tsx scripts/smoke-suite.mjs                       # all fixtures + properties
 *   npx tsx scripts/smoke-suite.mjs --filter cursor-heavy # one fixture, no properties
 *
 * Exits 0 on success, 1 on first failure.
 */

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runInitDetect, runInitApplyFromPlan } from '../templates/auto-detect/init-pipeline.ts';
import {
  validateHashRecordedPlan,
  computeContentSha256,
} from '../templates/auto-detect/hash-recorded-plan.ts';
import {
  genHashRecordedPlan,
  genTmpdirState,
  cleanupTmpdir,
  genFailureInjector,
  ROOT_TRUTH_TARGETS,
  MUTATE_FIELDS,
} from './property-generators.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixturesRoot = path.join(repoRoot, 'templates', 'auto-detect', 'fixtures');

const RUN_ID_PATTERN = /^\d{8}-\d{6}-[a-f0-9]{6}$/;

/**
 * Each fixture declares the structural facts the detection-only smoke
 * suite asserts about it. Fields are subset checks against
 * `detection.report.summary`; extras are accepted, missing values fail.
 *
 * - `repoShape`: exact match against `summary.repoShape`.
 * - `stacks`:    subset against `summary.stacks`.
 * - `frameworks`: subset against `summary.frameworks`.
 * - `tools`:     subset against `detection.tools[*].source`.
 */
const FIXTURES = [
  {
    name: 'minimal-repo',
    expect: {
      repoShape: 'single-package',
      stacks: [],
      frameworks: [],
      tools: ['rootTruth'],
    },
  },
  {
    name: 'cursor-heavy',
    expect: {
      repoShape: 'monorepo',
      stacks: ['node'],
      frameworks: ['react', 'vite'],
      tools: ['cursor', 'rootTruth'],
    },
  },
  {
    name: 'claude-mcp',
    expect: {
      repoShape: 'single-package',
      stacks: ['node'],
      frameworks: [],
      tools: ['claudeCode', 'mcp', 'rootTruth'],
    },
  },
  {
    name: 'node-monorepo',
    expect: {
      repoShape: 'monorepo',
      stacks: ['node'],
      frameworks: ['express', 'react', 'vite'],
      tools: [],
    },
  },
  {
    name: 'python-fastapi',
    expect: {
      repoShape: 'layered',
      stacks: ['python'],
      frameworks: ['fastapi', 'pytest', 'ruff'],
      tools: [],
    },
  },
  {
    name: 'meta-claude-plugin',
    expect: {
      repoShape: 'single-package',
      stacks: [],
      frameworks: [],
      tools: ['claudeCode'],
    },
  },
];

// ---------------------------------------------------------------------------
// CLI

const args = process.argv.slice(2);
const filter = readOption(args, '--filter');

const selected = filter ? FIXTURES.filter((f) => f.name === filter) : FIXTURES;
if (selected.length === 0) {
  console.error(
    `No fixture matched --filter ${filter}. Available: ${FIXTURES.map((f) => f.name).join(', ')}`,
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Run loop

let passed = 0;
let failed = 0;
const startedAt = Date.now();

for (const fixture of selected) {
  const fixturePath = path.join(fixturesRoot, fixture.name);
  let snapshotBefore;
  try {
    snapshotBefore = await snapshotDir(fixturePath);
    await runFixture(fixture, fixturePath);
    await fs.rm(path.join(fixturePath, '.harness'), { recursive: true, force: true });
    await assertSnapshotEqual(fixture.name, fixturePath, snapshotBefore);
    console.log(`✓ ${fixture.name}`);
    passed += 1;
  } catch (error) {
    console.error(`✗ ${fixture.name}: ${error?.message ?? String(error)}`);
    failed += 1;
    // Best-effort cleanup so a failure does not leave `.harness/` behind to
    // poison the next run.
    await fs
      .rm(path.join(fixturePath, '.harness'), { recursive: true, force: true })
      .catch(() => {});
  }
}

const elapsed = ((Date.now() - startedAt) / 1000).toFixed(2);
const total = selected.length;
console.log(`\n${passed}/${total} fixtures passed (${elapsed}s)`);

// ===========================================================================
// Part 2 — Property + example tests
//
// Skip when --filter narrows to a single fixture (the suite is then a quick
// dev-iteration loop). Run the full property battery on the all-fixtures
// invocation.
// ===========================================================================

if (filter || failed > 0) {
  if (failed > 0) process.exit(1);
  process.exit(0);
}

let propPassed = 0;
let propFailed = 0;
const propStartedAt = Date.now();

const PROPERTY_TESTS = [
  ['Property 1: HRP schema invariants', testProperty1HrpSchema],
  ['Property 2: Apply round-trip', testProperty3ApplyRoundTrip],
  ['Property 3: Apply continues past per-entry failure', testProperty4ContinuesPastFailure],
  ['Property 4: Backup preserves prior bytes', testProperty5BackupPreservesBytes],
  ['Property 5: No-HRP, no-write', testProperty6InvalidHrpNoWrite],
  ['Property 6: Old run-dir tolerance', testProperty7OldRunDirTolerance],
  ['Property 7: Apply path is detector-free and plan-free', testProperty8ApplyPathStaticGuard],
  ['Property 8: No LLM-vendor imports', testProperty9NoLlmVendorImports],
];

const EXAMPLE_TESTS = [
  ['SKILL.md contains Read_Budget', testExampleSkillReadBudget],
  ['SKILL.md has no LLM-vendor strings on import lines', testExampleSkillNoLlmStrings],
  ['SKILL.md does not require Node detector/apply scripts', testExampleSkillNoNodeUserPath],
  ['SKILL.md guards observed agent-native UX regressions', testExampleSkillUxRegressionGuards],
  ['SKILL.md supports conditional DESIGN.md', testExampleSkillConditionalDesign],
  ['apply-from-plan.ts has no detector / generators imports', testExampleApplyNoDetectorImport],
  ['runInitApplyFromPlan source has no detect( call', testExampleNoDetectCall],
];

for (const [name, fn] of PROPERTY_TESTS) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    propPassed += 1;
  } catch (error) {
    console.error(`✗ ${name}: ${error?.message ?? String(error)}`);
    if (process.env.SMOKE_DEBUG) console.error(error?.stack ?? '');
    propFailed += 1;
  }
}

for (const [name, fn] of EXAMPLE_TESTS) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    propPassed += 1;
  } catch (error) {
    console.error(`✗ ${name}: ${error?.message ?? String(error)}`);
    if (process.env.SMOKE_DEBUG) console.error(error?.stack ?? '');
    propFailed += 1;
  }
}

const propElapsed = ((Date.now() - propStartedAt) / 1000).toFixed(2);
const propTotal = PROPERTY_TESTS.length + EXAMPLE_TESTS.length;
console.log(`\n${propPassed}/${propTotal} property + example tests passed (${propElapsed}s)`);

if (failed > 0 || propFailed > 0) {
  process.exit(1);
}

// ===========================================================================
// Part 3 — Golden HRP apply round-trip
// ===========================================================================

let goldenPassed = 0;
let goldenFailed = 0;
const goldenStartedAt = Date.now();

const GOLDEN_FIXTURES = ['minimal-repo', 'cursor-heavy', 'claude-mcp', 'node-monorepo'];

for (const fixtureName of GOLDEN_FIXTURES) {
  try {
    await testGoldenHrpApply(fixtureName);
    console.log(`✓ Golden HRP: ${fixtureName}`);
    goldenPassed += 1;
  } catch (error) {
    console.error(`✗ Golden HRP: ${fixtureName}: ${error?.message ?? String(error)}`);
    if (process.env.SMOKE_DEBUG) console.error(error?.stack ?? '');
    goldenFailed += 1;
  }
}

const goldenElapsed = ((Date.now() - goldenStartedAt) / 1000).toFixed(2);
console.log(`\n${goldenPassed}/${GOLDEN_FIXTURES.length} golden HRP apply tests passed (${goldenElapsed}s)`);

if (goldenFailed > 0) {
  process.exit(1);
}
process.exit(0);

// ---------------------------------------------------------------------------
// Per-fixture detect verification

async function runFixture(fixture, fixturePath) {
  const detect = await runInitDetect(fixturePath);

  if (!detect.runId || !RUN_ID_PATTERN.test(detect.runId)) {
    throw new Error(
      `runId "${detect.runId}" does not match ${RUN_ID_PATTERN}`,
    );
  }

  const summary = detect.detection.report?.summary;
  if (!summary) {
    throw new Error('detection.report.summary is missing');
  }

  if (typeof summary.repoShape !== 'string') {
    throw new Error(`summary.repoShape: expected string, got ${typeof summary.repoShape}`);
  }
  if (!Array.isArray(summary.stacks)) {
    throw new Error(`summary.stacks: expected array, got ${typeof summary.stacks}`);
  }
  if (!Array.isArray(summary.frameworks)) {
    throw new Error(`summary.frameworks: expected array, got ${typeof summary.frameworks}`);
  }

  if (summary.repoShape !== fixture.expect.repoShape) {
    throw new Error(
      `repoShape: expected "${fixture.expect.repoShape}", got "${summary.repoShape}"`,
    );
  }
  assertSubset(summary.stacks, fixture.expect.stacks ?? [], 'stacks');
  assertSubset(summary.frameworks, fixture.expect.frameworks ?? [], 'frameworks');

  const toolSources = (detect.detection.tools ?? []).map((tool) => tool.source);
  assertSubset(toolSources, fixture.expect.tools ?? [], 'tools');

  // Artifact files
  const runDir = path.join(fixturePath, '.harness', 'runs', detect.runId);
  await assertJsonFile(path.join(runDir, 'detection.json'));
  await assertJsonFile(path.join(runDir, 'manifest.json'));
}

// ---------------------------------------------------------------------------
// Snapshot guard

/**
 * Walk `dir` recursively, ignoring any directory whose name is in `ignore`,
 * and return a Map<absolutePath, sha256-hex>. Files are read in full; this
 * is fine because the fixture trees are small (max few hundred KB each).
 */
async function snapshotDir(dir, ignore = ['.harness']) {
  const out = new Map();
  await walk(dir);
  return out;

  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (ignore.includes(entry.name)) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        const buf = await fs.readFile(full);
        out.set(full, crypto.createHash('sha256').update(buf).digest('hex'));
      }
    }
  }
}

async function assertSnapshotEqual(name, fixturePath, before) {
  const after = await snapshotDir(fixturePath);

  // Set of paths must match (no files created or deleted under the fixture
  // outside of `.harness/`, which both walks ignore).
  for (const [filePath] of before) {
    if (!after.has(filePath)) {
      throw new Error(
        `${name}: file disappeared during run: ${path.relative(fixturePath, filePath)}`,
      );
    }
  }
  for (const [filePath] of after) {
    if (!before.has(filePath)) {
      throw new Error(
        `${name}: stray file appeared during run: ${path.relative(fixturePath, filePath)}`,
      );
    }
  }

  // Per-file byte equality.
  for (const [filePath, hashBefore] of before) {
    const hashAfter = after.get(filePath);
    if (hashAfter !== hashBefore) {
      throw new Error(
        `${name}: file mutated by run: ${path.relative(fixturePath, filePath)}\n` +
          `  before sha256=${hashBefore}\n  after  sha256=${hashAfter}`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers

async function assertJsonFile(filePath) {
  let raw;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error(`artifact missing: ${filePath}`);
    }
    throw error;
  }
  if (raw.length === 0) {
    throw new Error(`artifact empty: ${filePath}`);
  }
  try {
    JSON.parse(raw);
  } catch (error) {
    throw new Error(`artifact not valid JSON: ${filePath} (${error?.message ?? error})`);
  }
}

function assertSubset(actualValues, expected, label) {
  const have = new Set(actualValues ?? []);
  const missing = expected.filter((value) => !have.has(value));
  if (missing.length > 0) {
    throw new Error(
      `${label}: missing ${JSON.stringify(missing)}; actual was ${JSON.stringify([...have])}`,
    );
  }
}

function readOption(argv, name) {
  const idx = argv.indexOf(name);
  if (idx === -1) return undefined;
  return argv[idx + 1];
}

// ===========================================================================
// Part 2 — Property test implementations (task 6.3)
//
// Each test runs ≥ 100 iterations using the seeded generators from
// `scripts/property-generators.mjs`. Tagged per design.md §Correctness
// Properties.
// ===========================================================================

// Feature: agent-as-writer, Property 1: HRP schema invariants
// Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.4,
//            4.5, 4.6, 6.1, 6.2, 7.5, 10.2, 11.1
async function testProperty1HrpSchema() {
  const ITERATIONS = 100;

  // Part A: well-formed plans MUST pass validation.
  for (let seed = 1; seed <= ITERATIONS; seed += 1) {
    const { plan } = genHashRecordedPlan({ wellFormed: true, seed });
    try {
      validateHashRecordedPlan(plan);
    } catch (error) {
      throw new Error(
        `Property 1A failed at seed=${seed}: well-formed plan rejected: ${error?.message}`,
      );
    }
  }

  // Part B: each mutation field MUST cause rejection.
  for (const mutateField of MUTATE_FIELDS) {
    for (let seed = 1; seed <= 20; seed += 1) {
      const { plan } = genHashRecordedPlan({ wellFormed: false, mutateField, seed });
      let threw = false;
      try {
        validateHashRecordedPlan(plan);
      } catch {
        threw = true;
      }
      if (!threw) {
        throw new Error(
          `Property 1B failed: mutateField=${mutateField}, seed=${seed} was NOT rejected`,
        );
      }
    }
  }
}

// Feature: agent-as-writer, Property 2: Apply round-trip (renumbered from 3)
// Validates: Requirements 6.3, 6.6, 6.7, 9.2
async function testProperty3ApplyRoundTrip() {
  const ITERATIONS = 100;

  for (let seed = 1; seed <= ITERATIONS; seed += 1) {
    const { plan } = genHashRecordedPlan({ wellFormed: true, seed });
    // Set up a tmpdir as the target, write plan.json, then call apply.
    const tmpdir = path.join(
      os.tmpdir(),
      `harness-prop3-${crypto.randomBytes(6).toString('hex')}`,
    );
    try {
      const runDir = path.join(tmpdir, '.harness', 'runs', plan.runId);
      await fs.mkdir(runDir, { recursive: true });
      // Rewrite plan paths to point into tmpdir, preserving the
      // ROOT_TRUTH_TARGET tail so the validator accepts them.
      const rewrittenPlan = {
        ...plan,
        targetPath: tmpdir,
        entries: plan.entries.map((e) => ({
          ...e,
          path: path.join(tmpdir, extractRootTruthTail(e.path)),
        })),
        skipped: plan.skipped.map((s) => ({
          ...s,
          path: path.join(tmpdir, extractRootTruthTail(s.path)),
        })),
      };
      await fs.writeFile(
        path.join(runDir, 'plan.json'),
        JSON.stringify(rewrittenPlan, null, 2),
        'utf8',
      );

      const result = await runInitApplyFromPlan(tmpdir, plan.runId);
      const applyResult = result.result;

      // Every entry should succeed (no injected failures).
      if (applyResult.counts.failed !== 0) {
        throw new Error(
          `Property 3 failed at seed=${seed}: expected 0 failures, got ${applyResult.counts.failed}`,
        );
      }

      // Verify round-trip: on-disk bytes match intended content.
      for (const written of applyResult.writtenEntries) {
        if (!written.success) continue;
        if (written.actualSha256 !== written.intendedSha256) {
          throw new Error(
            `Property 3 failed at seed=${seed}: SHA mismatch for ${written.path}`,
          );
        }
      }
    } finally {
      await fs.rm(tmpdir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

// Feature: agent-as-writer, Property 4: Apply continues past per-entry failure
// Validates: Requirements 7.7
async function testProperty4ContinuesPastFailure() {
  const ITERATIONS = 100;

  for (let seed = 1; seed <= ITERATIONS; seed += 1) {
    const { plan } = genHashRecordedPlan({ wellFormed: true, seed });
    if (plan.entries.length < 2) continue; // need at least 2 entries

    const tmpdir = path.join(
      os.tmpdir(),
      `harness-prop4-${crypto.randomBytes(6).toString('hex')}`,
    );
    try {
      const runDir = path.join(tmpdir, '.harness', 'runs', plan.runId);
      await fs.mkdir(runDir, { recursive: true });

      // Rewrite paths preserving ROOT_TRUTH_TARGET tails, but nest each
      // entry under a unique subdirectory so we can block one independently.
      const rewrittenEntries = plan.entries.map((e, i) => ({
        ...e,
        path: path.join(tmpdir, `target-${i}`, extractRootTruthTail(e.path)),
      }));
      const rewrittenPlan = {
        ...plan,
        targetPath: tmpdir,
        entries: rewrittenEntries,
        skipped: plan.skipped.map((s) => ({
          ...s,
          path: path.join(tmpdir, extractRootTruthTail(s.path)),
        })),
      };
      await fs.writeFile(
        path.join(runDir, 'plan.json'),
        JSON.stringify(rewrittenPlan, null, 2),
        'utf8',
      );

      // Block the first entry by writing a regular file where a needed
      // parent directory should be. We find the deepest directory segment
      // that needs to be created and place a file there.
      const firstEntryPath = rewrittenEntries[0].path;
      const firstEntryDir = path.dirname(firstEntryPath);
      // Create the grandparent, then write a file at the parent path.
      await fs.mkdir(path.dirname(firstEntryDir), { recursive: true });
      await fs.writeFile(firstEntryDir, 'blocker', 'utf8');

      const result = await runInitApplyFromPlan(tmpdir, plan.runId);
      const applyResult = result.result;

      // The first entry should have failed.
      const firstWritten = applyResult.writtenEntries[0];
      if (firstWritten.success !== false) {
        throw new Error(
          `Property 4 failed at seed=${seed}: first entry should have failed`,
        );
      }

      // At least one subsequent entry should have succeeded (apply continued).
      const anySuccess = applyResult.writtenEntries.slice(1).some((w) => w.success);
      if (!anySuccess) {
        throw new Error(
          `Property 4 failed at seed=${seed}: no subsequent entries succeeded after first failure`,
        );
      }
    } finally {
      await fs.rm(tmpdir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

// Feature: agent-as-writer, Property 5: Backup preserves prior bytes
// Validates: Requirements 9.1, 9.3
async function testProperty5BackupPreservesBytes() {
  const ITERATIONS = 100;

  for (let seed = 1; seed <= ITERATIONS; seed += 1) {
    const { plan } = genHashRecordedPlan({ wellFormed: true, seed });
    const tmpdir = path.join(
      os.tmpdir(),
      `harness-prop5-${crypto.randomBytes(6).toString('hex')}`,
    );
    try {
      const runDir = path.join(tmpdir, '.harness', 'runs', plan.runId);
      await fs.mkdir(runDir, { recursive: true });

      // Rewrite paths preserving ROOT_TRUTH_TARGET tails.
      const rewrittenEntries = plan.entries.map((e) => ({
        ...e,
        path: path.join(tmpdir, extractRootTruthTail(e.path)),
      }));

      // Pre-create some files so backups are triggered.
      const priorContents = new Map();
      const halfCount = Math.max(1, Math.floor(rewrittenEntries.length / 2));
      for (let i = 0; i < halfCount; i += 1) {
        const prior = `prior-content-seed-${seed}-idx-${i}\n`;
        await fs.mkdir(path.dirname(rewrittenEntries[i].path), { recursive: true });
        await fs.writeFile(rewrittenEntries[i].path, prior, 'utf8');
        priorContents.set(rewrittenEntries[i].path, prior);
      }

      const rewrittenPlan = {
        ...plan,
        targetPath: tmpdir,
        entries: rewrittenEntries,
        skipped: plan.skipped.map((s) => ({
          ...s,
          path: path.join(tmpdir, extractRootTruthTail(s.path)),
        })),
      };
      await fs.writeFile(
        path.join(runDir, 'plan.json'),
        JSON.stringify(rewrittenPlan, null, 2),
        'utf8',
      );

      const result = await runInitApplyFromPlan(tmpdir, plan.runId);
      const applyResult = result.result;

      // For entries that had prior content, verify backup bytes match.
      for (const written of applyResult.writtenEntries) {
        if (!written.success || !written.backupPath) continue;
        const priorExpected = priorContents.get(written.path);
        if (!priorExpected) continue;
        const backupBytes = await fs.readFile(written.backupPath, 'utf8');
        if (backupBytes !== priorExpected) {
          throw new Error(
            `Property 5 failed at seed=${seed}: backup for ${written.path} ` +
              `does not match prior content`,
          );
        }
      }
    } finally {
      await fs.rm(tmpdir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

// Feature: agent-as-writer, Property 6: No-HRP, no-write
// Validates: Requirements 5.6, 7.1, 7.2, 7.3, 7.4, 7.6, 10.5
async function testProperty6InvalidHrpNoWrite() {
  const ITERATIONS = 100;

  for (let seed = 1; seed <= ITERATIONS; seed += 1) {
    const tmpdir = path.join(
      os.tmpdir(),
      `harness-prop6-${crypto.randomBytes(6).toString('hex')}`,
    );
    try {
      await fs.mkdir(tmpdir, { recursive: true });

      // Scenario A: plan.json does not exist at all.
      const fakeRunId = `20260101-000000-${seed.toString(16).padStart(6, '0').slice(-6)}`;
      let threw = false;
      try {
        await runInitApplyFromPlan(tmpdir, fakeRunId);
      } catch (error) {
        threw = true;
        if (!error?.message?.includes('Invalid input')) {
          throw new Error(
            `Property 6A failed at seed=${seed}: expected 'Invalid input' error, got: ${error?.message}`,
          );
        }
      }
      if (!threw) {
        throw new Error(
          `Property 6A failed at seed=${seed}: missing plan.json did not throw`,
        );
      }

      // Scenario B: plan.json exists but is invalid (mutated schema).
      const mutateField = MUTATE_FIELDS[seed % MUTATE_FIELDS.length];
      const { plan } = genHashRecordedPlan({ wellFormed: false, mutateField, seed });
      const runDir = path.join(tmpdir, '.harness', 'runs', plan.runId);
      await fs.mkdir(runDir, { recursive: true });
      await fs.writeFile(
        path.join(runDir, 'plan.json'),
        JSON.stringify(plan, null, 2),
        'utf8',
      );

      // Snapshot the tmpdir (excluding .harness) before the call.
      const before = await snapshotDir(tmpdir, ['.harness']);

      threw = false;
      try {
        await runInitApplyFromPlan(tmpdir, plan.runId);
      } catch (error) {
        threw = true;
        if (!error?.message?.includes('Invalid input')) {
          throw new Error(
            `Property 6B failed at seed=${seed}, mutateField=${mutateField}: ` +
              `expected 'Invalid input' error, got: ${error?.message}`,
          );
        }
      }
      if (!threw) {
        throw new Error(
          `Property 6B failed at seed=${seed}, mutateField=${mutateField}: ` +
            `invalid plan did not throw`,
        );
      }

      // Verify no files were written outside .harness.
      const after = await snapshotDir(tmpdir, ['.harness']);
      for (const [filePath] of after) {
        if (!before.has(filePath)) {
          throw new Error(
            `Property 6B failed at seed=${seed}: stray file created: ${filePath}`,
          );
        }
      }
    } finally {
      await fs.rm(tmpdir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

// Feature: agent-as-writer, Property 7: Old run-dir tolerance
// Validates: Requirements 8.1, 8.2, 8.3
async function testProperty7OldRunDirTolerance() {
  const ITERATIONS = 100;

  for (let seed = 1; seed <= ITERATIONS; seed += 1) {
    const tmpdir = path.join(
      os.tmpdir(),
      `harness-prop7-${crypto.randomBytes(6).toString('hex')}`,
    );
    try {
      // Create a fake "old" run directory with a v1.x-style manifest.
      const oldRunId = `20240101-120000-aabb${(seed % 100).toString().padStart(2, '0')}`;
      const oldRunDir = path.join(tmpdir, '.harness', 'runs', oldRunId);
      await fs.mkdir(oldRunDir, { recursive: true });
      await fs.writeFile(
        path.join(oldRunDir, 'manifest.json'),
        JSON.stringify({ schemaVersion: '1.1.0', runId: oldRunId, mode: 'plan' }),
        'utf8',
      );

      // Now run detection — it should succeed without crashing on the old dir.
      const detect = await runInitDetect(tmpdir);
      if (!detect.runId || !RUN_ID_PATTERN.test(detect.runId)) {
        throw new Error(
          `Property 7 failed at seed=${seed}: detection runId invalid: ${detect.runId}`,
        );
      }

      // Verify the old run dir is still intact (not deleted or modified).
      const oldManifest = await fs.readFile(
        path.join(oldRunDir, 'manifest.json'),
        'utf8',
      );
      const parsed = JSON.parse(oldManifest);
      if (parsed.schemaVersion !== '1.1.0') {
        throw new Error(
          `Property 7 failed at seed=${seed}: old manifest was modified`,
        );
      }
    } finally {
      await fs.rm(tmpdir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

// Feature: agent-as-writer, Property 8: Apply path is detector-free and plan-free
// Validates: Requirements 6.4, 6.5
async function testProperty8ApplyPathStaticGuard() {
  const applySource = await fs.readFile(
    path.join(repoRoot, 'templates', 'auto-detect', 'apply-from-plan.ts'),
    'utf8',
  );

  // Must not import detector or generators.
  const forbiddenImports = [
    /from\s+['"]\.\/detector/,
    /from\s+['"]\.\/generators/,
    /from\s+['"]\.\.\/generators/,
  ];
  for (const pattern of forbiddenImports) {
    if (pattern.test(applySource)) {
      throw new Error(
        `Property 8 failed: apply-from-plan.ts imports a forbidden module matching ${pattern}`,
      );
    }
  }

  // Must not call detect().
  if (/\bdetect\s*\(/.test(applySource)) {
    throw new Error(
      `Property 8 failed: apply-from-plan.ts contains a detect() call`,
    );
  }

  // Must not import or call createPlan / applyPlan / runInitPlan.
  const planSymbols = ['createPlan', 'applyPlan', 'runInitPlan', 'buildWritePlan'];
  for (const sym of planSymbols) {
    if (applySource.includes(sym)) {
      throw new Error(
        `Property 8 failed: apply-from-plan.ts references plan symbol '${sym}'`,
      );
    }
  }
}

// Feature: agent-as-writer, Property 9: No LLM-vendor imports
// Validates: Requirements 10.3
async function testProperty9NoLlmVendorImports() {
  const LLM_PATTERN = /(openai|anthropic|llm|claude|gpt)/i;
  const IMPORT_LINE = /^\s*(import|from|require)\s/;

  // Check all .ts files under templates/auto-detect/ (excluding fixtures).
  const autoDetectDir = path.join(repoRoot, 'templates', 'auto-detect');
  const tsFiles = await collectFiles(autoDetectDir, '.ts', ['fixtures']);

  for (const filePath of tsFiles) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (IMPORT_LINE.test(line) && LLM_PATTERN.test(line)) {
        throw new Error(
          `Property 9 failed: ${path.relative(repoRoot, filePath)} line ${i + 1} ` +
            `contains LLM-vendor import: ${line.trim()}`,
        );
      }
    }
  }

  // Also check the SKILL.md for LLM-vendor import-style lines.
  const skillPath = path.join(repoRoot, '.claude', 'skills', 'harness-init', 'SKILL.md');
  const skillContent = await fs.readFile(skillPath, 'utf8');
  const skillLines = skillContent.split('\n');
  for (let i = 0; i < skillLines.length; i += 1) {
    const line = skillLines[i];
    if (IMPORT_LINE.test(line) && LLM_PATTERN.test(line)) {
      throw new Error(
        `Property 9 failed: SKILL.md line ${i + 1} contains LLM-vendor import: ${line.trim()}`,
      );
    }
  }
}

// ===========================================================================
// Part 2 — Example test implementations (task 6.4)
// ===========================================================================

// Example: SKILL.md contains Read_Budget (and the 30 / 200 KB numerics)
async function testExampleSkillReadBudget() {
  const skillPath = path.join(repoRoot, '.claude', 'skills', 'harness-init', 'SKILL.md');
  const content = await fs.readFile(skillPath, 'utf8');

  if (!content.includes('Read_Budget')) {
    throw new Error('SKILL.md does not contain "Read_Budget"');
  }
  if (!content.includes('30')) {
    throw new Error('SKILL.md does not contain the numeric "30" (file cap)');
  }
  if (!content.includes('200 KB')) {
    throw new Error('SKILL.md does not contain "200 KB" (size cap)');
  }
}

// Example: SKILL.md has no LLM-vendor strings on any import-style line
async function testExampleSkillNoLlmStrings() {
  const skillPath = path.join(repoRoot, '.claude', 'skills', 'harness-init', 'SKILL.md');
  const content = await fs.readFile(skillPath, 'utf8');
  // Only flag actual import/require lines — prose mentioning vendor names
  // in the Anti-Patterns table is expected and acceptable.
  const IMPORT_LINE = /^\s*(import|from|require)\s/;
  const LLM_PATTERN = /\b(openai|anthropic)\b/i;

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    if (IMPORT_LINE.test(lines[i]) && LLM_PATTERN.test(lines[i])) {
      throw new Error(
        `SKILL.md line ${i + 1} contains LLM-vendor import: ${lines[i].trim()}`,
      );
    }
  }
}

// Example: user-facing SKILL.md must stay agent-native and not route
// onboarding through the maintainer TypeScript scripts.
async function testExampleSkillNoNodeUserPath() {
  const skillPath = path.join(repoRoot, '.claude', 'skills', 'harness-init', 'SKILL.md');
  const content = await fs.readFile(skillPath, 'utf8');
  const forbidden = [
    'npx tsx',
    'scripts/harness-detect.mjs',
    'runInitDetect',
    'runInitRecordPlan',
    'runInitApplyFromPlan',
  ];

  for (const needle of forbidden) {
    if (content.includes(needle)) {
      throw new Error(`SKILL.md user path still references ${needle}`);
    }
  }
}

// Example: guards against regressions observed in real /harness-init runs.
async function testExampleSkillUxRegressionGuards() {
  const skillPath = path.join(repoRoot, '.claude', 'skills', 'harness-init', 'SKILL.md');
  const content = await fs.readFile(skillPath, 'utf8');

  const required = [
    'Keep Draft contents internal during Phase 3',
    'full Draft text or diffs are shown only if the user explicitly asks',
    'do not create this file solely because it is part of the Harness structure',
    'Root_Frontmatter_Failure',
    'Treating plugin-provided skills as target-repo installed skills',
    "physically exists under the target repository's `.claude/skills/`",
  ];

  for (const needle of required) {
    if (!content.includes(needle)) {
      throw new Error(`SKILL.md is missing UX regression guard: ${needle}`);
    }
  }

  const forbiddenScaffoldLine =
    '`harness-init` — Read the project, judge each Root_Truth_File, write Drafts, confirm with the user, apply.';
  if (content.includes(forbiddenScaffoldLine)) {
    throw new Error('SKILL.md scaffold still lists plugin harness-init as target repo skill');
  }
}

// Example: DESIGN.md is a conditional root-truth target, not generic boilerplate.
async function testExampleSkillConditionalDesign() {
  const skillPath = path.join(repoRoot, '.claude', 'skills', 'harness-init', 'SKILL.md');
  const content = await fs.readFile(skillPath, 'utf8');

  const required = [
    '`DESIGN.md`: create or patch only when at least one condition is true',
    'the target already has root `DESIGN.md`',
    'repo evidence shows a user-facing surface',
    'pure backend service, library, CLI, infrastructure repo, data pipeline',
    'Do not create generic design boilerplate',
    'Frontmatter is allowed only for `DESIGN.md` design tokens',
  ];

  for (const needle of required) {
    if (!content.includes(needle)) {
      throw new Error(`SKILL.md is missing conditional DESIGN.md guard: ${needle}`);
    }
  }
}

// Example: apply-from-plan.ts has no detector / generators imports
async function testExampleApplyNoDetectorImport() {
  const applyPath = path.join(
    repoRoot,
    'templates',
    'auto-detect',
    'apply-from-plan.ts',
  );
  const content = await fs.readFile(applyPath, 'utf8');

  if (/from\s+['"]\.\/detector/.test(content)) {
    throw new Error('apply-from-plan.ts imports ./detector');
  }
  if (/from\s+['"]\.\/generators/.test(content)) {
    throw new Error('apply-from-plan.ts imports ./generators');
  }
  if (/from\s+['"]\.\.\/generators/.test(content)) {
    throw new Error('apply-from-plan.ts imports ../generators');
  }
}

// Example: runInitApplyFromPlan source contains no detect( call
async function testExampleNoDetectCall() {
  const applyPath = path.join(
    repoRoot,
    'templates',
    'auto-detect',
    'apply-from-plan.ts',
  );
  const content = await fs.readFile(applyPath, 'utf8');

  if (/\bdetect\s*\(/.test(content)) {
    throw new Error('apply-from-plan.ts contains a detect() call');
  }
}

// ---------------------------------------------------------------------------
// Part 3 — Golden HRP apply round-trip
// ---------------------------------------------------------------------------

async function testGoldenHrpApply(fixtureName) {
  const fixturePath = path.join(fixturesRoot, fixtureName);
  const goldenPath = path.join(fixturePath, '_golden-hrp', 'plan.json');

  const raw = await fs.readFile(goldenPath, 'utf8');
  const goldenPlan = JSON.parse(raw);

  // Copy fixture to tmpdir.
  const tmpdir = path.join(
    os.tmpdir(),
    `harness-golden-${crypto.randomBytes(6).toString('hex')}`,
  );
  await fs.cp(fixturePath, tmpdir, { recursive: true });

  try {
    // Rewrite paths from /TARGET to tmpdir.
    const rewritten = JSON.parse(JSON.stringify(goldenPlan));
    rewritten.targetPath = tmpdir;
    for (const entry of rewritten.entries) {
      entry.path = entry.path.replace('/TARGET', tmpdir.replace(/\\/g, '/'));
    }
    for (const skipped of rewritten.skipped) {
      skipped.path = skipped.path.replace('/TARGET', tmpdir.replace(/\\/g, '/'));
    }

    // Write plan.json into .harness/runs/<runId>/.
    const runDir = path.join(tmpdir, '.harness', 'runs', goldenPlan.runId);
    await fs.mkdir(runDir, { recursive: true });
    await fs.writeFile(
      path.join(runDir, 'plan.json'),
      `${JSON.stringify(rewritten, null, 2)}\n`,
      'utf8',
    );

    // Apply.
    const result = await runInitApplyFromPlan(tmpdir, goldenPlan.runId);

    // Verify no failures.
    if (result.result.counts.failed !== 0) {
      throw new Error(
        `Expected 0 failures, got ${result.result.counts.failed}`,
      );
    }

    // Verify SHA-256 match and disk bytes match.
    for (const entry of result.result.writtenEntries) {
      if (entry.actualSha256 !== entry.intendedSha256) {
        throw new Error(
          `SHA mismatch for ${entry.path}: ${entry.actualSha256} !== ${entry.intendedSha256}`,
        );
      }
      const diskBytes = await fs.readFile(entry.path, 'utf8');
      const goldenEntry = rewritten.entries.find(
        (e) => e.path === entry.path || e.path.replace(/\//g, '\\') === entry.path,
      );
      if (!goldenEntry) {
        throw new Error(`No golden entry for written path ${entry.path}`);
      }
      if (diskBytes !== goldenEntry.content) {
        throw new Error(`Content mismatch for ${entry.path}`);
      }
    }
  } finally {
    await fs.rm(tmpdir, { recursive: true, force: true }).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Utility: collect files recursively by extension, excluding named dirs.
// ---------------------------------------------------------------------------

async function collectFiles(dir, ext, excludeDirs = []) {
  const results = [];
  await walkCollect(dir);
  return results;

  async function walkCollect(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (excludeDirs.includes(entry.name)) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walkCollect(full);
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        results.push(full);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Utility: extract the ROOT_TRUTH_TARGET tail from a generated plan path.
//
// The generator produces paths like `/tmp/harness-prop-xxxx/AGENTS.md` or
// `/tmp/harness-prop-xxxx/steering/harness-recommendations.md`. We need to
// preserve the tail that the validator checks against ROOT_TRUTH_TARGETS.
// ---------------------------------------------------------------------------

function extractRootTruthTail(absPath) {
  const normalised = absPath.replace(/\\/g, '/');
  for (const tail of ROOT_TRUTH_TARGETS) {
    if (normalised.endsWith(tail)) return tail;
  }
  // Fallback: use basename (should not happen with well-formed generators).
  return path.basename(absPath);
}
