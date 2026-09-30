#!/usr/bin/env node
/**
 * verify-docs-layout.mjs
 * Cross-platform verification script for repository documentation architecture & links.
 * Part of harness-coding-protocol / doc-governance.
 *
 * Usage:
 *   node verify-docs-layout.mjs [path-to-docs-dir]
 */

import fs from 'node:fs';
import path from 'node:path';

const docsDir = path.resolve(process.argv[2] || 'docs');

if (!fs.existsSync(docsDir)) {
  console.error(`[ERROR] Docs directory not found: ${docsDir}`);
  process.exit(1);
}

console.log(`[INFO] Verifying documentation architecture at: ${docsDir}`);

let errorCount = 0;
let warningCount = 0;

function reportError(msg) {
  console.error(`  [FAIL] ${msg}`);
  errorCount++;
}

function reportWarning(msg) {
  console.warn(`  [WARN] ${msg}`);
  warningCount++;
}

function reportPass(msg) {
  console.log(`  [PASS] ${msg}`);
}

// 1. Check entry README.md
const readmePath = path.join(docsDir, 'README.md');
if (!fs.existsSync(readmePath)) {
  reportError('docs/README.md is missing. An entry navigator is required.');
} else {
  reportPass('docs/README.md entry navigator exists.');
}

// 2. Check forbidden directories (Anti-patterns: archive, old, temp)
const forbiddenPatterns = [/archive/i, /backup/i, /old/i, /temp/i, /tmp/i];
const entries = fs.readdirSync(docsDir, { withFileTypes: true });

for (const entry of entries) {
  if (entry.isDirectory()) {
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(entry.name)) {
        reportError(`Forbidden directory detected: docs/${entry.name}. Dead docs should be deleted via git rm, not archived.`);
      }
    }
  }
}

// 3. Scan all markdown files and verify internal relative links
function getAllMarkdownFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(getAllMarkdownFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

const mdFiles = getAllMarkdownFiles(docsDir);
console.log(`[INFO] Auditing links across ${mdFiles.length} markdown documents...`);

const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

for (const file of mdFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const rawTarget = match[2].trim();
    // Skip external URLs, mailto, anchor-only links
    if (/^(https?:|mailto:|ftp:|#)/i.test(rawTarget)) {
      continue;
    }

    // Split target into file path and anchor
    const [targetFilePath, anchor] = rawTarget.split('#');
    if (!targetFilePath && anchor) {
      continue; // local anchor in same file
    }

    // Resolve relative path against current file's directory
    const resolvedPath = path.resolve(path.dirname(file), targetFilePath);
    if (!fs.existsSync(resolvedPath)) {
      const relSource = path.relative(process.cwd(), file);
      reportError(`Broken link in ${relSource}: "${rawTarget}" -> target does not exist on disk.`);
    }
  }
}

// 4. Summary
console.log('\n--- Verification Summary ---');
console.log(`Audited: ${mdFiles.length} files`);
console.log(`Errors:  ${errorCount}`);
console.log(`Warnings: ${warningCount}`);

if (errorCount > 0) {
  console.error('\nDocumentation verification FAILED. Please resolve errors above.');
  process.exit(1);
} else {
  console.log('\nDocumentation verification PASSED. Architecture and links are sound.');
  process.exit(0);
}
