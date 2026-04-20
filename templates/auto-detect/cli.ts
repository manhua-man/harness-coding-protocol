#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { detect } from './detector.js';
import { install, rollbackLatestBackup, type InstallMode } from './installer.js';

type CommandName = 'detect' | 'setup' | 'install' | 'rollback';

interface ParsedArgs {
  command: CommandName;
  targetPath: string;
  mode: InstallMode;
  shallow: boolean;
  backup: boolean;
  maxDepth?: number;
  write: boolean;
}

function usage(): string {
  return [
    'Usage:',
    '  harness detect <target> [--shallow] [--max-depth <n>] [--no-write]',
    '  harness setup <target> [--mode confirm|silent|dry-run] [--backup] [--shallow]',
    '  harness rollback <file>',
  ].join('\n');
}

async function main(argv: string[]): Promise<void> {
  const parsed = parseArgs(argv);

  if (parsed.command === 'detect') {
    const result = detect({
      targetPath: parsed.targetPath,
      shallow: parsed.shallow,
      maxDepth: parsed.maxDepth,
    });

    if (parsed.write) {
      await writeJson(path.join(parsed.targetPath, 'detected-report.json'), result.report);
      await writeJson(path.join(parsed.targetPath, 'detected-tools.json'), result.tools);
    }

    console.log(JSON.stringify(result.report.summary, null, 2));
    return;
  }

  if (parsed.command === 'rollback') {
    const restoredFrom = await rollbackLatestBackup(parsed.targetPath);
    if (restoredFrom) {
      console.log(`Restored ${parsed.targetPath} from ${restoredFrom}`);
    } else {
      console.log(`No backup found for ${parsed.targetPath}`);
    }
    return;
  }

  const result = await install({
    targetPath: parsed.targetPath,
    mode: parsed.mode,
    backup: parsed.backup,
    shallow: parsed.shallow,
    maxDepth: parsed.maxDepth,
  });

  console.log(result.report.markdown);
  if (result.requiresConfirmation) {
    console.log('\nNo files were written. Re-run with --mode silent to apply low-risk changes automatically.');
  }
}

function parseArgs(argv: string[]): ParsedArgs {
  const command = argv[0] as CommandName | undefined;
  if (!command || !['detect', 'setup', 'install', 'rollback'].includes(command)) {
    throw new Error(usage());
  }

  const targetPath = argv[1];
  if (!targetPath || targetPath === '--help' || targetPath === '-h') {
    throw new Error(usage());
  }

  const parsed: ParsedArgs = {
    command,
    targetPath: path.resolve(targetPath),
    mode: command === 'setup' || command === 'install' ? 'confirm' : 'dry-run',
    shallow: false,
    backup: false,
    write: command === 'detect',
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      throw new Error(usage());
    }
    if (arg === '--shallow') {
      parsed.shallow = true;
      continue;
    }
    if (arg === '--backup') {
      parsed.backup = true;
      continue;
    }
    if (arg === '--no-write') {
      parsed.write = false;
      continue;
    }
    if (arg === '--mode') {
      const value = argv[index + 1];
      if (!isInstallMode(value)) {
        throw new Error('Missing or invalid value for --mode');
      }
      parsed.mode = value;
      index += 1;
      continue;
    }
    if (arg.startsWith('--mode=')) {
      const value = arg.slice('--mode='.length);
      if (!isInstallMode(value)) {
        throw new Error(`Invalid mode: ${value}`);
      }
      parsed.mode = value;
      continue;
    }
    if (arg === '--max-depth') {
      const value = Number(argv[index + 1]);
      if (!Number.isInteger(value) || value < 0) {
        throw new Error('Missing or invalid value for --max-depth');
      }
      parsed.maxDepth = value;
      index += 1;
      continue;
    }
    if (arg.startsWith('--max-depth=')) {
      const value = Number(arg.slice('--max-depth='.length));
      if (!Number.isInteger(value) || value < 0) {
        throw new Error(`Invalid max depth: ${arg}`);
      }
      parsed.maxDepth = value;
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  return parsed;
}

function isInstallMode(value: unknown): value is InstallMode {
  return value === 'silent' || value === 'confirm' || value === 'dry-run';
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
