import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function usage() {
  console.log('Usage: node scripts/validate-template.mjs <target> [--require-adapter cursor|kiro|codex]');
}

const args = process.argv.slice(2);
if (args.length === 0) {
  usage();
  process.exit(1);
}

const targetArg = args[0];
const requiredAdapters = [];
const supportedAdapters = new Set(['cursor', 'kiro', 'codex']);

for (let i = 1; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--require-adapter') {
    const value = args[i + 1];
    if (!value) {
      console.error('Missing value for --require-adapter');
      process.exit(1);
    }
    requiredAdapters.push(value);
    i += 1;
    continue;
  }
  if (arg.startsWith('--require-adapter=')) {
    requiredAdapters.push(arg.split('=')[1]);
    continue;
  }
  if (arg === '--help' || arg === '-h') {
    usage();
    process.exit(0);
  }
  console.error(`Unknown option: ${arg}`);
  process.exit(1);
}

for (const adapter of requiredAdapters) {
  if (!supportedAdapters.has(adapter)) {
    console.error(`Unknown adapter: ${adapter}`);
    process.exit(1);
  }
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const targetRoot = path.resolve(process.cwd(), targetArg);

if (!fs.existsSync(targetRoot) || !fs.statSync(targetRoot).isDirectory()) {
  console.error(`ERROR: target directory does not exist: ${targetRoot}`);
  process.exit(1);
}

const results = [];

function report(level, message) {
  results.push({ level, message });
}

function relFromTarget(targetPath) {
  const relative = path.relative(targetRoot, targetPath).replace(/\\/g, '/');
  return relative || '.';
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
  if (/^\[MODE:/.test(token)) {
    return false;
  }
  return /(^|\/)(AGENTS\.md|CLAUDE\.md|README(?:\.en)?\.md|plugin\.json|marketplace\.json)$/.test(token)
    || /^(\.\/|\.\.\/|\.claude-plugin\/|docs\/|examples\/|scripts\/|steering\/|templates\/|\.cursor\/rules\/|\.kiro\/steering\/)/.test(token)
    || token.includes('*');
}

function extractPathCandidates(text) {
  const candidates = new Set();
  const patterns = [
    /`([^`\n]+)`/g,
    /\[[^\]]+\]\(([^)]+)\)/g,
    /\b(?:\.claude-plugin|docs|examples|scripts|steering|templates)(?:\/[A-Za-z0-9._*:-]+)+/g,
    /\.cursor\/rules\/[A-Za-z0-9._*-]+/g,
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

  const text = fs.readFileSync(filePath, 'utf8');
  const fileDir = path.dirname(filePath);
  const candidates = extractPathCandidates(text);

  for (const token of candidates) {
    if (!existsLocalToken(token, fileDir)) {
      report('ERROR', `${fileName} references missing path: ${token}`);
    }
  }
}

function validateRequiredRoot() {
  const requiredFiles = ['AGENTS.md', 'CLAUDE.md'];
  for (const fileName of requiredFiles) {
    const filePath = path.join(targetRoot, fileName);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      report('OK', `root file exists: ${fileName}`);
    } else {
      report('ERROR', `missing root file: ${fileName}`);
    }
  }

  const steeringDir = path.join(targetRoot, 'steering');
  if (fs.existsSync(steeringDir) && fs.statSync(steeringDir).isDirectory()) {
    report('OK', 'root directory exists: steering/');
  } else {
    report('ERROR', 'missing root directory: steering/');
  }
}

function validateAdapterTemplates() {
  const hasCursorMirror = fs.existsSync(path.join(targetRoot, '.cursor', 'rules'));
  const hasKiroMirror = fs.existsSync(path.join(targetRoot, '.kiro', 'steering'));
  const adapterSet = new Set(requiredAdapters);

  if (hasCursorMirror || adapterSet.has('cursor')) {
    const cursorTemplateDir = path.join(repoRoot, 'templates', 'adapters', 'cursor', 'rules');
    if (fs.existsSync(cursorTemplateDir) && fs.readdirSync(cursorTemplateDir).length > 0) {
      report('OK', 'cursor adapter template exists');
    } else {
      report('ERROR', 'cursor adapter template missing');
    }

    if (hasCursorMirror) {
      const rules = fs.readdirSync(path.join(targetRoot, '.cursor', 'rules')).filter((entry) => entry.endsWith('.mdc'));
      if (rules.length > 0) {
        report('OK', 'cursor mirror contains .mdc files');
      } else {
        report('ERROR', 'cursor mirror exists but contains no .mdc files');
      }
    }
  }

  if (hasKiroMirror || adapterSet.has('kiro')) {
    const kiroTemplateReadme = path.join(repoRoot, 'templates', 'adapters', 'kiro', 'README.md');
    if (fs.existsSync(kiroTemplateReadme)) {
      report('OK', 'kiro adapter template exists');
    } else {
      report('ERROR', 'kiro adapter template missing');
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

  if (adapterSet.has('codex')) {
    const codexReadme = path.join(repoRoot, 'templates', 'adapters', 'codex', 'README.md');
    if (fs.existsSync(codexReadme)) {
      report('OK', 'codex adapter documentation exists');
    } else {
      report('ERROR', 'codex adapter documentation missing');
    }
  }
}

validateRequiredRoot();
validatePathReferences('README.md');
validatePathReferences('README.en.md');
validatePathReferences('AGENTS.md');
validatePathReferences('CLAUDE.md');
validateAdapterTemplates();

for (const result of results) {
  console.log(`${result.level}: ${result.message}`);
}

const hasError = results.some((result) => result.level === 'ERROR');
process.exit(hasError ? 1 : 0);
