import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type DetectionOptions = {
  targetPath: string;
  shallow?: boolean;
  maxDepth?: number;
};

type Evidence = {
  path: string;
  note?: string;
};

type DetectionItem = {
  id: string;
  category: string;
  label: string;
  matched: string[];
  evidence: Evidence[];
  count: number;
  sourceKey: string;
};

type DetectionReport = {
  targetPath: string;
  scannedAt: string;
  shallow: boolean;
  maxDepth: number;
  summary: {
    rootTruth: boolean;
    claudeCode: boolean;
    cursor: boolean;
    mcp: boolean;
    repoShape: string;
    stacks: string[];
    frameworks: string[];
    commands: DetectionCommand[];
    aiTraces: string[];
    /**
     * Meta-ecosystem signal: this repository's product is itself an
     * AI configuration / plugin / extension. Added in N-2.
     * Falsy means the recommender uses its framework-driven default branch.
     */
    metaEcosystem?: MetaEcosystemFinding;
  };
  findings: DetectionItem[];
  stats: {
    filesScanned: number;
    directoriesScanned: number;
    skippedDirectories: string[];
  };
};

type MetaEcosystem =
  | 'meta-claude-plugin'
  | 'meta-mcp'
  | 'meta-vscode-extension';

type MetaEcosystemFinding = {
  ecosystem: MetaEcosystem;
  /** 0..1, used by the recommender to demote against framework signals. */
  confidence: number;
  /** Relative paths inside the target that justified this signal. */
  evidence: string[];
  /** One-sentence reason; flows into the narration headline. */
  reason: string;
};

type DetectedTool = {
  tool: string;
  label: string;
  category: string;
  source: string;
  evidence: string[];
};

type DetectionCommand = {
  name: string;
  command: string;
  source: string;
};

type FilesAndDirs = {
  files: string[];
  dirs: string[];
};

type PatternsConfig = {
  ignoredDirectories: string[];
  rootTruth: FilesAndDirs;
  claudeCode: FilesAndDirs;
  cursor: FilesAndDirs;
  mcp: {
    files: string[];
    packageDependencyNames: string[];
    packageNameHints: string[];
  };
  techStacks: Record<string, { files: string[] }>;
  repoShape: {
    monorepoIndicators: string[];
    layeredIndicators: string[];
    packageJsonWorkspaceKeys: string[];
  };
  aiTraces: {
    directories: string[];
  };
};

type MapperEntry = {
  tool: string;
  label: string;
  category: string;
};

type MappersConfig = {
  rootTruth: Record<string, MapperEntry>;
  claudeCode: Record<string, MapperEntry>;
  cursor: Record<string, MapperEntry>;
  mcp: Record<string, MapperEntry>;
  techStacks: Record<string, MapperEntry>;
  repoShape: Record<string, MapperEntry>;
  aiTraces: Record<string, MapperEntry>;
};

type PackageJsonLike = {
  name?: string;
  workspaces?: unknown;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

const DEFAULT_MAX_DEPTH = 5;
const SHALLOW_MAX_DEPTH = 2;

// Lazy-loaded detector config.
//
// The previous implementation read patterns.json / mappers.json at module load
// time, which made every importer of this module crash at import time if the
// config was missing or malformed. We now defer the read until the first
// `detect()` call so callers can wrap initialization in their own try/catch.
let cachedPatterns: PatternsConfig | undefined;
let cachedMappers: MappersConfig | undefined;
let cachedConfigDir: string | undefined;

function getConfigDir(): string {
  if (cachedConfigDir) {
    return cachedConfigDir;
  }
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  cachedConfigDir = resolveConfigDir(moduleDir);
  return cachedConfigDir;
}

function getPatterns(): PatternsConfig {
  if (!cachedPatterns) {
    cachedPatterns = readJson<PatternsConfig>(path.join(getConfigDir(), 'patterns.json'), validatePatternsConfig);
  }
  return cachedPatterns;
}

function getMappers(): MappersConfig {
  if (!cachedMappers) {
    cachedMappers = readJson<MappersConfig>(path.join(getConfigDir(), 'mappers.json'), validateMappersConfig);
  }
  return cachedMappers;
}

export function detect(options: DetectionOptions): { report: DetectionReport; tools: DetectedTool[]; frameworks: string[]; commands: DetectionCommand[] } {
  if (!options?.targetPath) {
    throw new Error('detect(options) requires options.targetPath');
  }

  const targetRoot = path.resolve(options.targetPath);
  if (!fs.existsSync(targetRoot) || !fs.statSync(targetRoot).isDirectory()) {
    throw new Error(`Target path does not exist or is not a directory: ${targetRoot}`);
  }

  const patterns = getPatterns();
  const shallow = Boolean(options.shallow);
  const maxDepth = Math.max(0, options.maxDepth ?? (shallow ? SHALLOW_MAX_DEPTH : DEFAULT_MAX_DEPTH));
  const state = createState(targetRoot, patterns);

  walk(targetRoot, 0, maxDepth, state);

  const findings: DetectionItem[] = [];
  const tools: DetectedTool[] = [];

  // Static "files + dirs" detectors share the same shape; one helper covers all.
  const staticDetectors: Array<{ sourceKey: string; category: string; label: string; config: FilesAndDirs }> = [
    { sourceKey: 'rootTruth', category: 'truth', label: 'Root truth', config: patterns.rootTruth },
    { sourceKey: 'claudeCode', category: 'editor', label: 'Claude Code', config: patterns.claudeCode },
    { sourceKey: 'cursor', category: 'editor', label: 'Cursor', config: patterns.cursor },
  ];

  for (const detector of staticDetectors) {
    const item = detectByPattern(targetRoot, detector.sourceKey, detector.category, detector.label, detector.config);
    if (item) {
      findings.push(item);
      tools.push(...toTools(item));
    }
  }

  const mcp = detectMcp(targetRoot, state);
  if (mcp) {
    findings.push(mcp);
    tools.push(...toTools(mcp));
  }

  const stacks = detectTechStacks(targetRoot, state);
  findings.push(...stacks);
  for (const stack of stacks) {
    tools.push(...toTools(stack));
  }

  const repoShape = detectRepoShape(targetRoot, state);
  if (repoShape) {
    findings.push(repoShape);
    tools.push(...toTools(repoShape));
  }

  const aiTraces = detectAiTraces(state);
  findings.push(...aiTraces);
  for (const trace of aiTraces) {
    tools.push(...toTools(trace));
  }

  const frameworks = detectFrameworks(targetRoot, state);
  const commands = detectCommands(targetRoot, state, frameworks);

  // D-1 fix: detection.tools occasionally surfaces duplicate entries (most
  // commonly two `ai-traces` rows when both `agents/` and `hooks/` matched)
  // because `toTools` falls back to a category-level label when a specific
  // mapper entry is missing. Collapse duplicates on (category, tool, label)
  // so consumers can trust `tools.length` and the array stays compact in
  // narration / reports.
  const dedupedTools = dedupeTools(tools);

  // N-2: detect "this repo's product is an AI configuration / plugin /
  // extension" so the recommender can pick an authoring bundle instead
  // of mistaking template / fixture frameworks for the repo's identity.
  const metaEcosystem = detectMetaEcosystem(targetRoot, state) ?? undefined;

  const report: DetectionReport = {
    targetPath: targetRoot,
    scannedAt: new Date().toISOString(),
    shallow,
    maxDepth,
    summary: {
      rootTruth: Boolean(findings.find((f) => f.sourceKey === 'rootTruth' || f.id === 'rootTruth')),
      claudeCode: Boolean(findings.find((f) => f.sourceKey === 'claudeCode' || f.id === 'claudeCode')),
      cursor: Boolean(findings.find((f) => f.sourceKey === 'cursor' || f.id === 'cursor')),
      mcp: Boolean(mcp),
      repoShape: repoShape?.id ?? 'unknown',
      stacks: stacks.map((item) => item.id),
      frameworks,
      commands,
      aiTraces: aiTraces.map((item) => item.id),
      metaEcosystem,
    },
    findings,
    stats: {
      filesScanned: state.filesScanned,
      directoriesScanned: state.directoriesScanned,
      skippedDirectories: [...state.skippedDirectories].sort()
    }
  };

  return { report, tools: dedupedTools, frameworks, commands };
}

interface DetectorState {
  targetRoot: string;
  filesScanned: number;
  directoriesScanned: number;
  skippedDirectories: Set<string>;
  relativeEntries: Map<string, { type: 'file' | 'dir'; abs: string }>;
  packageJsonFiles: string[];
  packageJsonData: Map<string, PackageJsonLike>;
  ignoredDirectories: Set<string>;
}

function createState(targetRoot: string, patterns: PatternsConfig): DetectorState {
  return {
    targetRoot,
    filesScanned: 0,
    directoriesScanned: 0,
    skippedDirectories: new Set<string>(),
    relativeEntries: new Map(),
    packageJsonFiles: [],
    packageJsonData: new Map(),
    ignoredDirectories: new Set(patterns.ignoredDirectories),
  };
}

function walk(currentDir: string, depth: number, maxDepth: number, state: DetectorState) {
  state.directoriesScanned += 1;

  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    const absPath = path.join(currentDir, entry.name);
    const relative = path.relative(state.targetRoot, absPath).replace(/\\/g, '/');

    if (shouldSkipEntry(entry.name, relative, state.ignoredDirectories)) {
      state.skippedDirectories.add(findIgnoredDirectoryName(relative, entry.name, state.ignoredDirectories));
      continue;
    }

    if (entry.isDirectory()) {
      state.relativeEntries.set(relative, { type: 'dir', abs: absPath });
      if (depth < maxDepth) {
        walk(absPath, depth + 1, maxDepth, state);
      }
      continue;
    }

    state.filesScanned += 1;
    state.relativeEntries.set(relative, { type: 'file', abs: absPath });

    if (entry.name === 'package.json') {
      state.packageJsonFiles.push(absPath);
      try {
        // package.json shapes vary widely across repos; structural validation
        // happens as we read individual fields below, not at parse time.
        state.packageJsonData.set(absPath, readJson<PackageJsonLike>(absPath));
      } catch {
        // A malformed package.json should not abort the entire scan.
        // We simply omit it from the state and continue.
      }
    }
  }
}

function shouldSkipEntry(name: string, relativePath: string, ignored: Set<string>) {
  if (!relativePath) {
    return false;
  }
  const segments = relativePath.split('/');
  return segments.some((segment) => ignored.has(segment) || ignored.has(name));
}

function findIgnoredDirectoryName(relativePath: string, fallback: string, ignored: Set<string>) {
  const segments = relativePath.split('/');
  return segments.find((segment) => ignored.has(segment)) ?? fallback;
}

/**
 * Detect a "this kind of tool is present" signal from a static list of files
 * and directories. Replaces the duplicated `detectRootTruth` / `detectClaudeCode`
 * / `detectCursor` functions; adding a new same-shaped detector now means
 * appending one entry to the `staticDetectors` array in `detect()`.
 */
function detectByPattern(
  targetRoot: string,
  sourceKey: string,
  category: string,
  label: string,
  config: FilesAndDirs,
): DetectionItem | null {
  const matched: string[] = [];
  const evidence: Evidence[] = [];

  for (const fileName of config.files) {
    if (isFile(path.join(targetRoot, fileName))) {
      matched.push(fileName);
      evidence.push({ path: fileName });
    }
  }

  for (const dirName of config.dirs) {
    if (isDirectory(path.join(targetRoot, dirName))) {
      matched.push(`${dirName}/`);
      evidence.push({ path: `${dirName}/` });
    }
  }

  if (matched.length === 0) {
    return null;
  }

  return buildFinding(sourceKey, category, label, matched, evidence);
}

function detectMcp(targetRoot: string, state: DetectorState) {  const patterns = getPatterns();
  const matched: string[] = [];
  const evidence: Evidence[] = [];

  for (const fileName of patterns.mcp.files) {
    const abs = path.join(targetRoot, fileName);
    if (isFile(abs)) {
      matched.push(fileName);
      evidence.push({ path: fileName });
    }
  }

  for (const packageJsonPath of state.packageJsonFiles) {
    const data = state.packageJsonData.get(packageJsonPath);
    if (!data) {
      continue;
    }

    const dependencyNames = collectDependencyNames(data);
    const hasMcpDependency = dependencyNames.some((dependency) => matchesAnyHint(dependency, patterns.mcp.packageDependencyNames, patterns.mcp.packageNameHints));

    if (hasMcpDependency) {
      matched.push('package.json');
      evidence.push({ path: relativeFromTarget(targetRoot, packageJsonPath), note: 'MCP dependency present' });
    }
  }

  if (matched.length === 0) {
    return null;
  }

  return buildFinding('mcp', 'integration', 'Model Context Protocol', unique(matched), evidence);
}

/**
 * Detect tech stacks by walking every file the scanner already touched, not
 * just the target root. The previous implementation only inspected
 * `targetRoot`, which was asymmetric with `detectFrameworks` (which walks
 * every package.json the scanner finds). The asymmetry produced narrations
 * like "next + react monorepo with empty stack" on repos that keep
 * package.json under a sub-directory only.
 *
 * D-2 dogfood fix (internal/dogfood/summary-2026-05-22.md). Evidence paths
 * are reported relative to the target root so downstream artifacts stay
 * portable.
 */
function detectTechStacks(targetRoot: string, state: DetectorState) {
  const patterns = getPatterns();
  const mappers = getMappers();
  const findings: DetectionItem[] = [];

  for (const [stackName, config] of Object.entries(patterns.techStacks)) {
    const matched: string[] = [];
    const evidence: Evidence[] = [];
    const seenPaths = new Set<string>();

    // 1) Root-level fast path so behavior on simple single-package repos
    //    does not depend on what the scanner happened to enumerate.
    for (const fileName of config.files) {
      const abs = path.join(targetRoot, fileName);
      if (isFile(abs)) {
        if (!seenPaths.has(fileName)) {
          matched.push(fileName);
          evidence.push({ path: fileName });
          seenPaths.add(fileName);
        }
      }
    }

    // 2) Anywhere else under the scanned tree. We match on basename so a
    //    sub-directory hit like `claude-config-composer/package.json`
    //    counts the same way the root-level `package.json` would.
    const fileBaseNames = new Set(config.files.filter((name) => !name.includes('/') && !name.includes('\\')));
    if (fileBaseNames.size > 0) {
      for (const [relativePath, entry] of state.relativeEntries.entries()) {
        if (entry.type !== 'file') continue;
        if (!relativePath || relativePath === '.') continue;
        const baseName = relativePath.split('/').pop() ?? '';
        if (!fileBaseNames.has(baseName)) continue;
        if (seenPaths.has(relativePath)) continue;
        // Skip the root-level entry; already covered by the fast path.
        if (relativePath === baseName && config.files.includes(baseName)) continue;
        matched.push(baseName);
        evidence.push({ path: relativePath, note: relativePath !== baseName ? 'nested location' : undefined });
        seenPaths.add(relativePath);
      }
    }

    if (matched.length > 0) {
      findings.push(buildFinding(stackName, 'stack', mappers.techStacks[stackName]?.label ?? stackName, unique(matched), evidence));
    }
  }

  return findings;
}

function detectRepoShape(targetRoot: string, state: DetectorState) {
  const patterns = getPatterns();
  const mappers = getMappers();
  const matched: string[] = [];
  const evidence: Evidence[] = [];

  const packageJsonWithWorkspaces = state.packageJsonFiles.find((file) => hasWorkspaces(state.packageJsonData.get(file)));
  if (packageJsonWithWorkspaces) {
    matched.push('monorepo');
    evidence.push({ path: relativeFromTarget(targetRoot, packageJsonWithWorkspaces), note: 'workspaces field present' });
  }

  if (state.packageJsonFiles.length > 1) {
    matched.push('monorepo');
    evidence.push({ path: `package.json x${state.packageJsonFiles.length}`, note: 'multiple package.json files found' });
  }

  for (const fileName of patterns.repoShape.monorepoIndicators) {
    const abs = path.join(targetRoot, fileName);
    if (isFile(abs) || isDirectory(abs)) {
      matched.push('monorepo');
      evidence.push({ path: fileName });
    }
  }

  const topLevelDirs = getTopLevelDirs(state);
  const layeredHits = topLevelDirs.filter((dirName) => patterns.repoShape.layeredIndicators.includes(dirName));
  if (layeredHits.length > 0) {
    matched.push('layered');
    for (const dirName of layeredHits) {
      evidence.push({ path: `${dirName}/` });
    }
  }

  if (!matched.includes('monorepo') && !matched.includes('layered')) {
    matched.push('single-package');
    evidence.push({ path: '.', note: 'no split indicators found' });
  }

  const uniqueMatched = unique(matched);
  let repoShape = 'single-package';
  if (uniqueMatched.includes('monorepo')) {
    repoShape = 'monorepo';
  } else if (uniqueMatched.includes('layered')) {
    repoShape = 'layered';
  }

  return buildFinding(repoShape, 'shape', mappers.repoShape[repoShape]?.label ?? repoShape, uniqueMatched, evidence);
}

function detectAiTraces(state: DetectorState) {
  const patterns = getPatterns();
  const mappers = getMappers();
  const findings: DetectionItem[] = [];
  const seen = new Set<string>();

  for (const [relativePath] of state.relativeEntries.entries()) {
    const normalized = relativePath.replace(/\\/g, '/');
    const segments = normalized.split('/');
    for (const segment of segments) {
      if (patterns.aiTraces.directories.includes(segment) && !seen.has(segment)) {
        seen.add(segment);
        findings.push(
          buildFinding(
            segment,
            'automation',
            mappers.aiTraces[segment]?.label ?? segment,
            [segment],
            [{ path: normalized }]
          )
        );
      }
    }
  }

  return findings;
}

/**
 * N-2: identify meta-ecosystem signals — repos whose product is
 * itself an AI configuration / plugin / extension. When this returns
 * non-null, the recommender uses authoring-bundle output instead of
 * the framework-driven default branch (which would otherwise key on
 * incidental React / Node signals from templates and fixtures).
 *
 * Priority order on multi-match: claude-plugin > mcp > vscode-extension.
 * Confidence is calibrated against the spec's "two independent signals"
 * rule: a single weak signal scores around 0.55, two scores 0.85+.
 */
function detectMetaEcosystem(targetRoot: string, state: DetectorState): MetaEcosystemFinding | null {
  const candidates: MetaEcosystemFinding[] = [];

  // -- meta-claude-plugin -------------------------------------------------
  {
    const evidence: string[] = [];
    const pluginManifest = path.join(targetRoot, '.claude-plugin', 'plugin.json');
    const marketplaceManifest = path.join(targetRoot, '.claude-plugin', 'marketplace.json');
    const pluginDir = path.join(targetRoot, '.claude-plugin');
    if (isFile(pluginManifest)) {
      evidence.push('.claude-plugin/plugin.json');
    }
    if (isFile(marketplaceManifest)) {
      evidence.push('.claude-plugin/marketplace.json');
    }
    if (evidence.length === 0 && isDirectory(pluginDir)) {
      evidence.push('.claude-plugin/');
    }
    if (evidence.length > 0) {
      // Two-of-two manifests = high confidence; one manifest = strong;
      // dir without manifests = mid (still better than nothing because
      // .claude-plugin is a Claude-Code-specific directory name).
      const confidence = evidence.length >= 2 ? 0.95 : evidence.length === 1 ? 0.85 : 0.6;
      candidates.push({
        ecosystem: 'meta-claude-plugin',
        confidence,
        evidence,
        reason: 'Repository ships a Claude Code plugin manifest in .claude-plugin/.',
      });
    }
  }

  // -- meta-mcp -----------------------------------------------------------
  // Spec §4 calls for two independent signals before flagging meta-mcp,
  // and they must point at the *same* package — otherwise a config-kit
  // repo (a `configurations/mcp-servers/foo/package.json` template plus
  // a `bin` entry in some unrelated child package) trips the detector.
  // We scan each package.json in isolation and only emit when one
  // package carries both signals, or the package with the SDK dep
  // sits alongside a top-level mcp-config-example.json.
  {
    const evidence: string[] = [];
    const hasMcpExample = state.relativeEntries.has('mcp-config-example.json');
    let bestConfidence = 0;
    let bestRel = '';
    let bestHasBin = false;

    for (const packageJsonPath of state.packageJsonFiles) {
      const data = state.packageJsonData.get(packageJsonPath);
      if (!data) continue;
      const deps = collectDependencyNames(data);
      const hasMcp = deps.some((dep) => dep === '@modelcontextprotocol/sdk' || dep === '@anthropic-ai/mcp');
      if (!hasMcp) continue;
      const rel = relativeFromTarget(targetRoot, packageJsonPath);

      // Skip packages whose location strongly suggests they are
      // *templates* of MCP servers (the product of the parent repo),
      // not the repo's own product. claude-code-configs has
      // `configurations/mcp-servers/memory-mcp-server/package.json`
      // and the recommender mis-fired meta-mcp on the parent repo
      // before this guard.
      if (/configurations?[\\/]|templates?[\\/]|examples?[\\/]/i.test(rel)) continue;

      const binField = (data as Record<string, unknown>).bin;
      const hasBin = (typeof binField === 'string' && binField.length > 0)
        || (binField !== null && typeof binField === 'object' && Object.keys(binField as Record<string, unknown>).length > 0);

      let confidence = 0;
      if (hasBin) confidence = 0.9;
      else if (hasMcpExample) confidence = 0.85;
      // SDK dep with no bin and no example file is too weak to claim the
      // repo is an MCP server author. The ordinary recommender still
      // surfaces MCP via tools/integration.
      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestRel = rel;
        bestHasBin = Boolean(hasBin);
      }
    }

    if (bestConfidence > 0) {
      evidence.push(`${bestRel} dependency: @modelcontextprotocol/sdk`);
      if (bestHasBin) evidence.push(`${bestRel} bin entry`);
      if (hasMcpExample) evidence.push('mcp-config-example.json');
      candidates.push({
        ecosystem: 'meta-mcp',
        confidence: bestConfidence,
        evidence,
        reason: 'Repository depends on @modelcontextprotocol/sdk and ships a server entry; product is an MCP server.',
      });
    }
  }

  // -- meta-vscode-extension ---------------------------------------------
  {
    const evidence: string[] = [];
    let hasVscodeEngine = false;
    let hasVscodeTypes = false;
    let pkgRel = '';

    for (const packageJsonPath of state.packageJsonFiles) {
      const data = state.packageJsonData.get(packageJsonPath);
      if (!data) continue;
      const rel = relativeFromTarget(targetRoot, packageJsonPath);
      const enginesField = (data as Record<string, unknown>).engines;
      if (enginesField && typeof enginesField === 'object' && (enginesField as Record<string, unknown>).vscode) {
        hasVscodeEngine = true;
        pkgRel = pkgRel || rel;
      }
      const deps = collectDependencyNames(data);
      if (deps.includes('@types/vscode')) {
        hasVscodeTypes = true;
        pkgRel = pkgRel || rel;
      }
    }

    if (hasVscodeEngine || hasVscodeTypes) {
      if (hasVscodeEngine) evidence.push(`${pkgRel} engines.vscode`);
      if (hasVscodeTypes) evidence.push(`${pkgRel} dev dependency: @types/vscode`);
      const confidence = hasVscodeEngine && hasVscodeTypes ? 0.92 : hasVscodeEngine ? 0.8 : 0.65;
      candidates.push({
        ecosystem: 'meta-vscode-extension',
        confidence,
        evidence,
        reason: 'Repository declares a VS Code extension contract (engines.vscode or @types/vscode).',
      });
    }
  }

  if (candidates.length === 0) return null;

  // Priority + confidence: claude-plugin first (most specific), then mcp,
  // then vscode-extension. Within the chosen tier, pick highest confidence.
  const priority: MetaEcosystem[] = ['meta-claude-plugin', 'meta-mcp', 'meta-vscode-extension'];
  candidates.sort((a, b) => {
    const pa = priority.indexOf(a.ecosystem);
    const pb = priority.indexOf(b.ecosystem);
    if (pa !== pb) return pa - pb;
    return b.confidence - a.confidence;
  });
  return candidates[0];
}

function detectFrameworks(targetRoot: string, state: DetectorState): string[] {  const frameworks = new Set<string>();

  for (const packageJsonPath of state.packageJsonFiles) {
    const data = state.packageJsonData.get(packageJsonPath);
    if (!data) continue;
    const dependencyNames = collectDependencyNames(data);
    if (dependencyNames.includes('react')) frameworks.add('react');
    if (dependencyNames.includes('next')) frameworks.add('next');
    if (dependencyNames.includes('vite') || hasAnyFile(targetRoot, ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'])) frameworks.add('vite');
    if (dependencyNames.includes('@nestjs/core')) frameworks.add('nestjs');
    if (dependencyNames.includes('express')) frameworks.add('express');
  }

  const pythonTexts = readExistingTextFiles(targetRoot, [
    'pyproject.toml',
    'requirements.txt',
    'requirements-dev.txt',
    'Pipfile',
  ]).join('\n').toLowerCase();
  if (pythonTexts.includes('fastapi')) frameworks.add('fastapi');
  if (pythonTexts.includes('django')) frameworks.add('django');
  if (pythonTexts.includes('pytest')) frameworks.add('pytest');
  if (pythonTexts.includes('ruff')) frameworks.add('ruff');
  if (pythonTexts.includes('black')) frameworks.add('black');
  if (hasAnyFile(targetRoot, ['poetry.lock'])) frameworks.add('poetry');
  if (pythonTexts.includes('uv') || hasAnyFile(targetRoot, ['uv.lock'])) frameworks.add('uv');

  const goModFiles = [...state.relativeEntries.keys()].filter((entry) => entry.endsWith('go.mod'));
  if (goModFiles.length > 1) frameworks.add('go-multi-module');

  return [...frameworks].sort();
}

function detectCommands(targetRoot: string, state: DetectorState, frameworks: string[]): DetectionCommand[] {
  const commands: DetectionCommand[] = [];

  for (const packageJsonPath of state.packageJsonFiles) {
    const data = state.packageJsonData.get(packageJsonPath);
    if (!data?.scripts) continue;
    for (const [name, command] of Object.entries(data.scripts)) {
      if (['dev', 'start', 'build', 'test', 'lint', 'format', 'typecheck'].includes(name)) {
        commands.push({
          name,
          command: packageManagerRunCommand(packageJsonPath, targetRoot, name),
          source: relativeFromTarget(targetRoot, packageJsonPath),
        });
      }
    }
  }

  if (hasAnyFile(targetRoot, ['pyproject.toml', 'requirements.txt', 'requirements-dev.txt'])) {
    if (frameworks.includes('pytest')) commands.push({ name: 'test', command: 'pytest', source: 'python detection' });
    if (frameworks.includes('ruff')) commands.push({ name: 'lint', command: 'ruff check .', source: 'python detection' });
    if (frameworks.includes('black')) commands.push({ name: 'format', command: 'black .', source: 'python detection' });
  }

  if (hasAnyFile(targetRoot, ['go.mod'])) {
    commands.push({ name: 'test', command: 'go test ./...', source: 'go.mod' });
    commands.push({ name: 'format', command: 'gofmt -w .', source: 'go.mod' });
    commands.push({ name: 'vet', command: 'go vet ./...', source: 'go.mod' });
  }

  return dedupeCommands(commands);
}

function buildFinding(id: string, category: string, label: string, matched: string[], evidence: Evidence[]): DetectionItem {
  const uniqueMatched = unique(matched);
  return {
    id,
    category,
    label,
    matched: uniqueMatched,
    evidence,
    count: evidence.length,
    sourceKey: uniqueMatched[0] ?? id
  };
}

function toTools(item: DetectionItem): DetectedTool[] {
  const mappers = getMappers();
  const mapperGroup = getMapperGroup(item.id, item.category, mappers);
  const entry = mapperGroup?.[item.id] ?? mapperGroup?.[item.sourceKey] ?? mapperGroup?.[item.matched[0]];
  if (!entry) {
    return [
      {
        tool: item.id,
        label: item.label,
        category: item.category,
        source: item.id,
        evidence: item.evidence.map((e) => e.path)
      }
    ];
  }

  return [
    {
      tool: entry.tool,
      label: entry.label,
      category: entry.category,
      source: item.id,
      evidence: item.evidence.map((e) => e.path)
    }
  ];
}

function getMapperGroup(id: string, category: string, mappers: MappersConfig): Record<string, MapperEntry> | undefined {
  if (category === 'truth') return mappers.rootTruth;
  if (category === 'editor' && id === 'claudeCode') return mappers.claudeCode;
  if (category === 'editor' && id === 'cursor') return mappers.cursor;
  if (category === 'integration') return mappers.mcp;
  if (category === 'stack') return mappers.techStacks;
  if (category === 'shape') return mappers.repoShape;
  if (category === 'automation') return mappers.aiTraces;
  return undefined;
}

function collectDependencyNames(data: PackageJsonLike) {
  const buckets = [data.dependencies, data.devDependencies, data.peerDependencies, data.optionalDependencies];
  const names = new Set<string>();
  for (const bucket of buckets) {
    if (!bucket) continue;
    for (const name of Object.keys(bucket)) {
      names.add(name);
    }
  }
  return [...names];
}

function packageManagerRunCommand(packageJsonPath: string, targetRoot: string, scriptName: string): string {
  const dir = path.dirname(packageJsonPath);
  const hasPnpm = isFile(path.join(targetRoot, 'pnpm-lock.yaml')) || isFile(path.join(targetRoot, 'pnpm-workspace.yaml'));
  const hasYarn = isFile(path.join(targetRoot, 'yarn.lock'));
  const prefix = path.relative(targetRoot, dir).replace(/\\/g, '/');
  const cwdPrefix = prefix ? `cd ${prefix} && ` : '';
  if (hasPnpm) return `${cwdPrefix}pnpm ${scriptName}`;
  if (hasYarn) return `${cwdPrefix}yarn ${scriptName}`;
  return `${cwdPrefix}npm run ${scriptName}`;
}

function readExistingTextFiles(targetRoot: string, fileNames: string[]): string[] {
  const texts: string[] = [];
  for (const fileName of fileNames) {
    const filePath = path.join(targetRoot, fileName);
    if (isFile(filePath)) {
      texts.push(fs.readFileSync(filePath, 'utf8'));
    }
  }
  return texts;
}

function hasAnyFile(targetRoot: string, fileNames: string[]): boolean {
  return fileNames.some((fileName) => isFile(path.join(targetRoot, fileName)));
}

function dedupeCommands(commands: DetectionCommand[]): DetectionCommand[] {  const seen = new Set<string>();
  return commands.filter((item) => {
    const key = JSON.stringify([item.name, item.command, item.source]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Collapse duplicate DetectedTool rows on a stable key. `toTools` may emit
 * the same `(category, tool)` for two findings whose mapper entries differ
 * only in the human-readable label — most commonly the aiTraces fallback,
 * where both `agents/` and `hooks/` map to `tool: "ai-traces"` with
 * different `label`s. Downstream narration / dogfood reports list `tool`
 * (not `label`), so the duplicates leak into user-visible output. We keep
 * the first occurrence, union the evidence, and merge labels with a `; `
 * separator so provenance is preserved.
 */
function dedupeTools(tools: DetectedTool[]): DetectedTool[] {
  const result: DetectedTool[] = [];
  const indexByKey = new Map<string, number>();
  for (const tool of tools) {
    const key = `${tool.category}::${tool.tool}`;
    const existing = indexByKey.get(key);
    if (existing === undefined) {
      indexByKey.set(key, result.length);
      result.push({ ...tool, evidence: [...tool.evidence] });
      continue;
    }
    const merged = result[existing];
    const evidenceSeen = new Set(merged.evidence);
    for (const path of tool.evidence) {
      if (!evidenceSeen.has(path)) {
        merged.evidence.push(path);
        evidenceSeen.add(path);
      }
    }
    if (tool.label && !merged.label.split('; ').includes(tool.label)) {
      merged.label = `${merged.label}; ${tool.label}`;
    }
  }
  return result;
}

function matchesAnyHint(name: string, dependencyNames: string[], packageNameHints: string[]) {
  return dependencyNames.some((pattern) => name === pattern || name.includes(pattern)) || packageNameHints.some((hint) => name.includes(hint));
}

function hasWorkspaces(data: PackageJsonLike | undefined) {
  if (!data) return false;
  return Array.isArray(data.workspaces) || Boolean((data.workspaces as { packages?: unknown } | undefined)?.packages);
}

function getTopLevelDirs(state: DetectorState) {
  const dirs = new Set<string>();
  for (const [relativePath, entry] of state.relativeEntries.entries()) {
    if (entry.type !== 'dir') continue;
    const topLevel = relativePath.split('/')[0];
    if (topLevel) {
      dirs.add(topLevel);
    }
  }
  return [...dirs];
}

/**
 * Read a JSON file and validate it with the supplied guard. The guard runs at
 * the I/O boundary so a missing or wrong-shaped field surfaces as a precise
 * error here rather than as a confusing "cannot read property X of undefined"
 * deep inside the call site.
 */
function readJson<T>(filePath: string, validate?: (data: unknown, filePath: string) => asserts data is T): T {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON in ${filePath}: ${message}`);
  }
  if (validate) {
    validate(data, filePath);
    return data as T;
  }
  // No guard supplied — fall back to a structural assertion that at least
  // confirms the value is an object. Callers that need stricter checks should
  // pass a guard.
  return data as T;
}

function isFile(filePath: string) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function isDirectory(filePath: string) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isDirectory();
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function relativeFromTarget(targetRoot: string, absPath: string) {
  return path.relative(targetRoot, absPath).replace(/\\/g, '/');
}

function resolveConfigDir(currentModuleDir: string): string {
  const candidates = [
    path.join(currentModuleDir, 'config'),
    path.resolve(currentModuleDir, '..', 'templates', 'auto-detect', 'config'),
    path.resolve(currentModuleDir, '..', '..', '..', 'templates', 'auto-detect', 'config'),
  ];
  const found = candidates.find((candidate) => isFile(path.join(candidate, 'patterns.json')) && isFile(path.join(candidate, 'mappers.json')));
  if (!found) {
    throw new Error(`Unable to locate auto-detect config from ${currentModuleDir}`);
  }
  return found;
}

// ---------------------------------------------------------------------------
// Lightweight structural validators (no third-party deps; AGENTS.md requires
// runtime to use Node built-ins only). Each guard reports which field is wrong
// and at which path — enough to debug a corrupted config file without dragging
// in zod or ajv.
// ---------------------------------------------------------------------------

function validatePatternsConfig(data: unknown, filePath: string): asserts data is PatternsConfig {
  const ctx = `patterns.json (${filePath})`;
  assertObject(data, ctx);
  const obj = data as Record<string, unknown>;
  assertStringArray(obj.ignoredDirectories, `${ctx}.ignoredDirectories`);
  assertFilesAndDirs(obj.rootTruth, `${ctx}.rootTruth`);
  assertFilesAndDirs(obj.claudeCode, `${ctx}.claudeCode`);
  assertFilesAndDirs(obj.cursor, `${ctx}.cursor`);

  assertObject(obj.mcp, `${ctx}.mcp`);
  const mcp = obj.mcp as Record<string, unknown>;
  assertStringArray(mcp.files, `${ctx}.mcp.files`);
  assertStringArray(mcp.packageDependencyNames, `${ctx}.mcp.packageDependencyNames`);
  assertStringArray(mcp.packageNameHints, `${ctx}.mcp.packageNameHints`);

  assertObject(obj.techStacks, `${ctx}.techStacks`);
  for (const [name, stack] of Object.entries(obj.techStacks as Record<string, unknown>)) {
    assertObject(stack, `${ctx}.techStacks.${name}`);
    assertStringArray((stack as Record<string, unknown>).files, `${ctx}.techStacks.${name}.files`);
  }

  assertObject(obj.repoShape, `${ctx}.repoShape`);
  const repoShape = obj.repoShape as Record<string, unknown>;
  assertStringArray(repoShape.monorepoIndicators, `${ctx}.repoShape.monorepoIndicators`);
  assertStringArray(repoShape.layeredIndicators, `${ctx}.repoShape.layeredIndicators`);
  assertStringArray(repoShape.packageJsonWorkspaceKeys, `${ctx}.repoShape.packageJsonWorkspaceKeys`);

  assertObject(obj.aiTraces, `${ctx}.aiTraces`);
  const aiTraces = obj.aiTraces as Record<string, unknown>;
  assertStringArray(aiTraces.directories, `${ctx}.aiTraces.directories`);
}

function validateMappersConfig(data: unknown, filePath: string): asserts data is MappersConfig {
  const ctx = `mappers.json (${filePath})`;
  assertObject(data, ctx);
  const obj = data as Record<string, unknown>;
  for (const key of ['rootTruth', 'claudeCode', 'cursor', 'mcp', 'techStacks', 'repoShape', 'aiTraces']) {
    assertObject(obj[key], `${ctx}.${key}`);
    for (const [entryKey, entry] of Object.entries(obj[key] as Record<string, unknown>)) {
      assertMapperEntry(entry, `${ctx}.${key}.${entryKey}`);
    }
  }
}

function assertObject(value: unknown, ctx: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${ctx}: expected object, got ${describe(value)}`);
  }
}

function assertStringArray(value: unknown, ctx: string): asserts value is string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${ctx}: expected string[], got ${describe(value)}`);
  }
  for (let i = 0; i < value.length; i += 1) {
    if (typeof value[i] !== 'string') {
      throw new Error(`${ctx}[${i}]: expected string, got ${describe(value[i])}`);
    }
  }
}

function assertFilesAndDirs(value: unknown, ctx: string): asserts value is FilesAndDirs {
  assertObject(value, ctx);
  const obj = value as Record<string, unknown>;
  assertStringArray(obj.files, `${ctx}.files`);
  assertStringArray(obj.dirs, `${ctx}.dirs`);
}

function assertMapperEntry(value: unknown, ctx: string): asserts value is MapperEntry {
  assertObject(value, ctx);
  const obj = value as Record<string, unknown>;
  for (const field of ['tool', 'label', 'category']) {
    if (typeof obj[field] !== 'string') {
      throw new Error(`${ctx}.${field}: expected string, got ${describe(obj[field])}`);
    }
  }
}

function describe(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}
