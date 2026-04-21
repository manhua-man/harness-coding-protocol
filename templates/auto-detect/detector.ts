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
  };
  findings: DetectionItem[];
  stats: {
    filesScanned: number;
    directoriesScanned: number;
    skippedDirectories: string[];
  };
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

type PatternsConfig = {
  ignoredDirectories: string[];
  rootTruth: {
    files: string[];
    dirs: string[];
  };
  claudeCode: {
    files: string[];
    dirs: string[];
  };
  cursor: {
    files: string[];
    dirs: string[];
  };
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
    filePatterns: string[];
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

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const configDir = resolveConfigDir(moduleDir);
const patterns = readJson<PatternsConfig>(path.join(configDir, 'patterns.json'));
const mappers = readJson<MappersConfig>(path.join(configDir, 'mappers.json'));

const DEFAULT_MAX_DEPTH = 5;
const SHALLOW_MAX_DEPTH = 2;

export type { DetectionCommand, DetectionOptions, DetectionReport, DetectedTool };

export function detect(options: DetectionOptions): { report: DetectionReport; tools: DetectedTool[]; frameworks: string[]; commands: DetectionCommand[] } {
  if (!options?.targetPath) {
    throw new Error('detect(options) requires options.targetPath');
  }

  const targetRoot = path.resolve(options.targetPath);
  if (!fs.existsSync(targetRoot) || !fs.statSync(targetRoot).isDirectory()) {
    throw new Error(`Target path does not exist or is not a directory: ${targetRoot}`);
  }

  const shallow = Boolean(options.shallow);
  const maxDepth = Math.max(0, options.maxDepth ?? (shallow ? SHALLOW_MAX_DEPTH : DEFAULT_MAX_DEPTH));
  const state = createState(targetRoot);

  walk(targetRoot, 0, maxDepth, state);

  const findings: DetectionItem[] = [];
  const tools: DetectedTool[] = [];

  const rootTruth = detectRootTruth(targetRoot, state);
  if (rootTruth) {
    findings.push(rootTruth);
    tools.push(...toTools(rootTruth));
  }

  const claudeCode = detectClaudeCode(targetRoot, state);
  if (claudeCode) {
    findings.push(claudeCode);
    tools.push(...toTools(claudeCode));
  }

  const cursor = detectCursor(targetRoot, state);
  if (cursor) {
    findings.push(cursor);
    tools.push(...toTools(cursor));
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

  const repoShape = detectRepoShape(targetRoot, state, stacks);
  if (repoShape) {
    findings.push(repoShape);
    tools.push(...toTools(repoShape));
  }

  const aiTraces = detectAiTraces(targetRoot, state);
  findings.push(...aiTraces);
  for (const trace of aiTraces) {
    tools.push(...toTools(trace));
  }

  const frameworks = detectFrameworks(targetRoot, state);
  const commands = detectCommands(targetRoot, state, frameworks);

  const report: DetectionReport = {
    targetPath: targetRoot,
    scannedAt: new Date().toISOString(),
    shallow,
    maxDepth,
    summary: {
      rootTruth: Boolean(rootTruth),
      claudeCode: Boolean(claudeCode),
      cursor: Boolean(cursor),
      mcp: Boolean(mcp),
      repoShape: repoShape?.id ?? 'unknown',
      stacks: stacks.map((item) => item.id),
      frameworks,
      commands,
      aiTraces: aiTraces.map((item) => item.id)
    },
    findings,
    stats: {
      filesScanned: state.filesScanned,
      directoriesScanned: state.directoriesScanned,
      skippedDirectories: [...state.skippedDirectories].sort()
    }
  };

  return { report, tools, frameworks, commands };
}

function createState(targetRoot: string) {
  return {
    targetRoot,
    filesScanned: 0,
    directoriesScanned: 0,
    skippedDirectories: new Set<string>(),
    relativeEntries: new Map<string, { type: 'file' | 'dir'; abs: string }>(),
    packageJsonFiles: [] as string[],
    packageJsonData: new Map<string, PackageJsonLike>()
  };
}

function walk(currentDir: string, depth: number, maxDepth: number, state: ReturnType<typeof createState>) {
  state.directoriesScanned += 1;

  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    const absPath = path.join(currentDir, entry.name);
    const relative = path.relative(state.targetRoot, absPath).replace(/\\/g, '/');

    if (shouldSkipEntry(entry.name, relative)) {
      state.skippedDirectories.add(findIgnoredDirectoryName(relative, entry.name));
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
      state.packageJsonData.set(absPath, readJson<PackageJsonLike>(absPath));
    }
  }
}

function shouldSkipEntry(name: string, relativePath: string) {
  if (!relativePath) {
    return false;
  }
  const segments = relativePath.split('/');
  return segments.some((segment) => patterns.ignoredDirectories.includes(segment) || patterns.ignoredDirectories.includes(name));
}

function findIgnoredDirectoryName(relativePath: string, fallback: string) {
  const segments = relativePath.split('/');
  return segments.find((segment) => patterns.ignoredDirectories.includes(segment)) ?? fallback;
}

function detectRootTruth(targetRoot: string, state: ReturnType<typeof createState>) {
  const matched: string[] = [];
  const evidence: Evidence[] = [];

  for (const fileName of patterns.rootTruth.files) {
    const abs = path.join(targetRoot, fileName);
    if (isFile(abs)) {
      matched.push(fileName);
      evidence.push({ path: fileName });
    }
  }

  for (const dirName of patterns.rootTruth.dirs) {
    const abs = path.join(targetRoot, dirName);
    if (isDirectory(abs)) {
      matched.push(`${dirName}/`);
      evidence.push({ path: `${dirName}/` });
    }
  }

  if (matched.length === 0) {
    return null;
  }

  return buildFinding('rootTruth', 'truth', 'Root truth', matched, evidence);
}

function detectClaudeCode(targetRoot: string, state: ReturnType<typeof createState>) {
  const matched: string[] = [];
  const evidence: Evidence[] = [];

  for (const fileName of patterns.claudeCode.files) {
    const abs = path.join(targetRoot, fileName);
    if (isFile(abs)) {
      matched.push(fileName);
      evidence.push({ path: fileName });
    }
  }

  for (const dirName of patterns.claudeCode.dirs) {
    const abs = path.join(targetRoot, dirName);
    if (isDirectory(abs)) {
      matched.push(`${dirName}/`);
      evidence.push({ path: `${dirName}/` });
    }
  }

  if (matched.length === 0) {
    return null;
  }

  return buildFinding('claudeCode', 'editor', 'Claude Code', matched, evidence);
}

function detectCursor(targetRoot: string, state: ReturnType<typeof createState>) {
  const matched: string[] = [];
  const evidence: Evidence[] = [];

  for (const fileName of patterns.cursor.files) {
    const abs = path.join(targetRoot, fileName);
    if (isFile(abs)) {
      matched.push(fileName);
      evidence.push({ path: fileName });
    }
  }

  for (const dirName of patterns.cursor.dirs) {
    const abs = path.join(targetRoot, dirName);
    if (isDirectory(abs)) {
      matched.push(`${dirName}/`);
      evidence.push({ path: `${dirName}/` });
    }
  }

  if (matched.length === 0) {
    return null;
  }

  return buildFinding('cursor', 'editor', 'Cursor', matched, evidence);
}

function detectMcp(targetRoot: string, state: ReturnType<typeof createState>) {
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

function detectTechStacks(targetRoot: string, state: ReturnType<typeof createState>) {
  const findings: DetectionItem[] = [];

  for (const [stackName, config] of Object.entries(patterns.techStacks)) {
    const matched: string[] = [];
    const evidence: Evidence[] = [];

    for (const fileName of config.files) {
      const abs = path.join(targetRoot, fileName);
      if (isFile(abs)) {
        matched.push(fileName);
        evidence.push({ path: fileName });
      }
    }

    if (matched.length > 0) {
      findings.push(buildFinding(stackName, 'stack', mappers.techStacks[stackName]?.label ?? stackName, matched, evidence));
    }
  }

  return findings;
}

function detectRepoShape(targetRoot: string, state: ReturnType<typeof createState>, stacks: DetectionItem[]) {
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

function detectAiTraces(targetRoot: string, state: ReturnType<typeof createState>) {
  const findings: DetectionItem[] = [];
  const seen = new Set<string>();

  for (const [relativePath, entry] of state.relativeEntries.entries()) {
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

function detectFrameworks(targetRoot: string, state: ReturnType<typeof createState>): string[] {
  const frameworks = new Set<string>();

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

function detectCommands(targetRoot: string, state: ReturnType<typeof createState>, frameworks: string[]): DetectionCommand[] {
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
  const mapperGroup = getMapperGroup(item.id, item.category);
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

function getMapperGroup(id: string, category: string): Record<string, MapperEntry> | undefined {
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

function dedupeCommands(commands: DetectionCommand[]): DetectionCommand[] {
  const seen = new Set<string>();
  return commands.filter((item) => {
    const key = `${item.name}\0${item.command}\0${item.source}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function matchesAnyHint(name: string, dependencyNames: string[], packageNameHints: string[]) {
  return dependencyNames.some((pattern) => name === pattern || name.includes(pattern)) || packageNameHints.some((hint) => name.includes(hint));
}

function hasWorkspaces(data: PackageJsonLike | undefined) {
  if (!data) return false;
  return Array.isArray(data.workspaces) || Boolean((data.workspaces as { packages?: unknown } | undefined)?.packages);
}

function getTopLevelDirs(state: ReturnType<typeof createState>) {
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

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')) as T;
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
