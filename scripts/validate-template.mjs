import fs from 'node:fs';
import path from 'node:path';

function usage() {
  console.log('Usage: node scripts/validate-template.mjs <target>');
}

const args = process.argv.slice(2);
if (args.length === 0) {
  usage();
  process.exit(1);
}

const targetArg = args[0];

for (let i = 1; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--help' || arg === '-h') {
    usage();
    process.exit(0);
  }
  console.error(`Unknown option: ${arg}`);
  process.exit(1);
}

const targetRoot = path.resolve(process.cwd(), targetArg);

if (!fs.existsSync(targetRoot) || !fs.statSync(targetRoot).isDirectory()) {
  console.error(`ERROR: target directory does not exist: ${targetRoot}`);
  process.exit(1);
}

const results = [];
const sourceTemplateRoot = path.join(targetRoot, 'templates');
const validatesRepositorySource =
  fs.existsSync(path.join(sourceTemplateRoot, 'AGENTS.md'))
  && fs.existsSync(path.join(sourceTemplateRoot, 'CLAUDE.md'))
  && fs.existsSync(path.join(sourceTemplateRoot, 'steering'))
  && !fs.existsSync(path.join(targetRoot, 'AGENTS.md'));

function report(level, message) {
  results.push({ level, message });
}

function listRelativeEntries(rootDir) {
  const entries = [];

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = path.join(currentDir, entry.name);
      const relativePath = path.relative(rootDir, absolutePath).replace(/\\/g, '/');
      entries.push(relativePath + (entry.isDirectory() ? '/' : ''));
      if (entry.isDirectory()) {
        walk(absolutePath);
      }
    }
  }

  walk(rootDir);
  return entries;
}

const targetEntries = listRelativeEntries(targetRoot);

function existsLocalToken(token, fileDir) {
  if (validatesRepositorySource) {
    const sourceTokenPath = resolveRepositorySourceToken(token);
    if (sourceTokenPath) {
      if (token.includes('*')) {
        const pattern = path.relative(targetRoot, sourceTokenPath).replace(/\\/g, '/');
        const regex = new RegExp(
          `^${pattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '.')}${token.endsWith('/') ? '/' : ''}$`
        );
        return targetEntries.some((entry) => regex.test(entry));
      }
      if (token.endsWith('/')) {
        return fs.existsSync(sourceTokenPath) && fs.statSync(sourceTokenPath).isDirectory();
      }
      return fs.existsSync(sourceTokenPath);
    }
  }

  const resolved = path.resolve(fileDir, token);
  if (!resolved.startsWith(targetRoot)) {
    return true;
  }

  if (token.includes('*')) {
    const pattern = path.relative(targetRoot, resolved).replace(/\\/g, '/');
    const regex = new RegExp(
      `^${pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '.')}${token.endsWith('/') ? '/' : ''}$`
    );
    return targetEntries.some((entry) => regex.test(entry));
  }

  if (token.endsWith('/')) {
    return fs.existsSync(resolved) && fs.statSync(resolved).isDirectory();
  }

  return fs.existsSync(resolved);
}

function resolveRepositorySourceToken(token) {
  const generatedTargetPaths = new Set([
    'steering/harness-recommendations.md',
    'docs/ai-tool-recommendations.md',
    '.cursor/rules/harness.mdc'
  ]);
  const optionalCompatibilityTargetPaths = new Set([
    '.cursor/rules/',
    './.cursor/rules/',
    '.cursor/commands/',
    './.cursor/commands/',
    '.kiro/steering/',
    './.kiro/steering/'
  ]);
  if (generatedTargetPaths.has(token)) {
    return path.join(targetRoot, 'package.json');
  }
  if (optionalCompatibilityTargetPaths.has(token)) {
    return sourceTemplateRoot;
  }
  if (token === '.cursor/rules/harness-artifacts.mdc' || token === './.cursor/rules/harness-artifacts.mdc') {
    return path.join(targetRoot, 'templates/adapters/cursor/rules/harness-artifacts.mdc');
  }
  if (token.startsWith('.cursor/commands/') || token.startsWith('./.cursor/commands/')) {
    const normalizedToken = token.replace(/^\.\//, '');
    return path.join(targetRoot, 'templates/adapters/cursor/commands', path.basename(normalizedToken));
  }
  if (token === 'AGENTS.md' || token === './AGENTS.md') {
    return path.join(sourceTemplateRoot, 'AGENTS.md');
  }
  if (token === 'CLAUDE.md' || token === './CLAUDE.md') {
    return path.join(sourceTemplateRoot, 'CLAUDE.md');
  }
  if (token === 'steering/' || token === './steering/') {
    return path.join(sourceTemplateRoot, 'steering');
  }
  if (token.startsWith('steering/')) {
    return path.join(sourceTemplateRoot, token);
  }
  return undefined;
}

function normalizeToken(token) {
  return token.trim().replace(/^['"`]+|['"`.,;:]+$/g, '');
}

function shouldCheckToken(token) {
  if (!token) {
    return false;
  }
  if (token.startsWith('http://') || token.startsWith('https://') || token.startsWith('mailto:') || token.startsWith('#')) {
    return false;
  }
  if (token.includes('<') || token.includes('>') || token.includes('<!--')) {
    return false;
  }
  if (/\s/.test(token)) {
    return false;
  }
  if (/^\[MODE:/.test(token)) {
    return false;
  }
  return /(^|\/)(AGENTS\.md|CLAUDE\.md|README(?:\.en)?\.md|plugin\.json|marketplace\.json)$/.test(token)
    || /^(\.\/|\.\.\/|\.claude-plugin\/|docs\/|examples\/|scripts\/|steering\/|templates\/|\.cursor\/rules\/|\.cursor\/commands\/|\.kiro\/steering\/)/.test(token)
    || token.includes('*');
}

function extractPathCandidates(text) {
  const candidates = new Set();
  const patterns = [
    /`([^`\n]+)`/g,
    /\[[^\]]+\]\(([^)]+)\)/g,
    /\b(?:\.claude-plugin|docs|examples|scripts|steering|templates)(?:\/[A-Za-z0-9._*:-]+)+/g,
    /\.cursor\/rules\/[A-Za-z0-9._*-]+/g,
    /\.cursor\/commands\/[A-Za-z0-9._*-]+/g,
    /\.kiro\/steering\/[A-Za-z0-9._*-]+/g,
    /\b(?:AGENTS\.md|CLAUDE\.md|README(?:\.en)?\.md|plugin\.json|marketplace\.json)\b/g
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const value = normalizeToken(match[1] ?? match[0]);
      if (shouldCheckToken(value)) {
        candidates.add(value);
      }
    }
  }

  return [...candidates];
}

function validatePathReferences(fileName) {
  const filePath = path.join(targetRoot, fileName);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    if (fileName === 'README.md') {
      report('WARN', 'README.md not found, skipping README path validation');
    }
    return;
  }

  const text = fs.readFileSync(filePath, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const fileDir = path.dirname(filePath);
  const candidates = extractPathCandidates(text);

  for (const token of candidates) {
    if (!existsLocalToken(token, fileDir)) {
      report('ERROR', `${fileName} references missing path: ${token}`);
    }
  }
}

function validateRequiredRoot(rootDir = targetRoot, label = 'root') {
  const requiredFiles = ['AGENTS.md', 'CLAUDE.md'];
  for (const fileName of requiredFiles) {
    const filePath = path.join(rootDir, fileName);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const relative = path.relative(targetRoot, filePath).replace(/\\/g, '/');
      report('OK', `${label} file exists: ${relative}`);
    } else {
      report('ERROR', `missing ${label} file: ${path.relative(targetRoot, filePath).replace(/\\/g, '/')}`);
    }
  }

  const steeringDir = path.join(rootDir, 'steering');
  if (fs.existsSync(steeringDir) && fs.statSync(steeringDir).isDirectory()) {
    const relative = path.relative(targetRoot, steeringDir).replace(/\\/g, '/');
    report('OK', `${label} directory exists: ${relative}/`);
  } else {
    report('ERROR', `missing ${label} directory: ${path.relative(targetRoot, steeringDir).replace(/\\/g, '/')}/`);
  }
}

function validateOptionalMirrors() {
  const hasCursorMirror = fs.existsSync(path.join(targetRoot, '.cursor', 'rules'));
  const hasKiroMirror = fs.existsSync(path.join(targetRoot, '.kiro', 'steering'));

  if (hasCursorMirror) {
    const rulesDir = path.join(targetRoot, '.cursor', 'rules');
    const rules = fs.readdirSync(rulesDir).filter((entry) => entry.endsWith('.mdc'));
    if (rules.length > 0) {
      report('OK', 'cursor mirror contains .mdc files');
    } else {
      report('WARN', 'cursor mirror exists but contains no .mdc files');
    }
  }

  if (hasKiroMirror) {
    const steeringRoot = path.join(targetRoot, 'steering');
    const kiroMirrorRoot = path.join(targetRoot, '.kiro', 'steering');
    if (fs.existsSync(steeringRoot) && fs.existsSync(kiroMirrorRoot)) {
      const rootFiles = listRelativeEntries(steeringRoot).filter((entry) => !entry.endsWith('/'));
      const mirrorFiles = new Set(listRelativeEntries(kiroMirrorRoot).filter((entry) => !entry.endsWith('/')));
      for (const relativeFile of rootFiles) {
        if (!mirrorFiles.has(relativeFile)) {
          report('ERROR', `.kiro/steering is missing mirror file: ${relativeFile}`);
        }
      }
      report('OK', 'kiro mirror checked against root steering/');
    }
  }
}

if (validatesRepositorySource) {
  validateRequiredRoot(sourceTemplateRoot, 'template');
} else {
  validateRequiredRoot();
  validatePathReferences('AGENTS.md');
  validatePathReferences('CLAUDE.md');
}
validatePathReferences('README.md');
validatePathReferences('README.en.md');
validatePathReferences('ROADMAP.md');
validateOptionalMirrors();

for (const result of results) {
  console.log(`${result.level}: ${result.message}`);
}

const hasError = results.some((result) => result.level === 'ERROR');
process.exit(hasError ? 1 : 0);
