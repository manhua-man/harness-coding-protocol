# Changelog

All notable changes to Harness Coding Protocol will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-04-21

### Added

- **Reference Audit**: New `docs/references.md` documenting all reference projects with verification status
- **CLI Commands**: 
  - `harness detect <target>` - Detect project characteristics
  - `harness setup <target>` - Smart installation with multiple modes
  - `harness rollback <file>` - Rollback to previous backup
- **Detection Enhancement**:
  - New `frameworks` field in detection output
  - New `commands` field extracting npm/yarn/pnpm scripts
  - Enhanced framework detection (React, Next.js, Vite, NestJS, FastAPI, Django, etc.)
- **Testing Infrastructure**:
  - Vitest test framework integration
  - `npm run test` and `npm run test:watch` scripts
  - Test fixtures for minimal, cursor-heavy, and claude-mcp repositories
- **Build System**:
  - `npm run build` for TypeScript compilation
  - Package bin entry point for CLI
  - Source maps for debugging
- **Interactive Confirmation**: TTY-aware interactive mode for `confirm` setup

### Changed

- Updated marketplace description to emphasize "root-truth-first adapter"
- Improved detection engine performance with shallow scan mode
- Enhanced diff reporter output format
- Refined merge strategy defaults (incremental over overwrite)

### Fixed

- Script path references now align with actual directory structure
- Validation logic consistency across all templates
- PowerShell and Bash script behavior parity

### Documentation

- Added `docs/references.md` with attribution rules
- Updated `ROADMAP.md` with v2.1.0 tasks and status
- Clarified reference project usage (product reference only, no code copying)

## [2.0.0] - 2026-04-20

### Added

- **Phase 0: Baseline Alignment**
  - Fixed directory structure references in scripts
  - Unified documentation across README, ROADMAP, and scripts
  - Self-validation capability
- **Phase 1: Detection Engine**
  - `templates/auto-detect/detector.ts` - Core detection engine
  - `config/patterns.json` - Detection pattern configuration
  - `config/mappers.json` - Tool mapping configuration
  - Support for shallow scan and configurable max depth
  - Detection of root truth, Claude Code, Cursor, MCP, tech stacks, repo shape, and AI traces
- **Phase 2: Generators + Full-Stack Recommendation**
  - Base generator abstraction
  - AGENTS.md generator
  - CLAUDE.md generator
  - Steering generator
  - Cursor adapter generator
  - Ecosystem recommender generator
  - Merge engine with incremental/overwrite/prompt strategies
  - Conflict detection and risk-level classification
- **Phase 3: Installer Orchestration**
  - `installer.ts` - Main installation orchestrator
  - Three interaction modes: silent, confirm, dry-run
  - Backup mechanism with configurable retention
  - Rollback helpers
  - Diff and summary reporters
- **Phase 4: Marketplace + Docs + Bundles**
  - `docs/architecture.md` - System architecture documentation
  - `docs/best-practices.md` - Best practices guide
  - `docs/tool-adaptation.md` - Tool adaptation guide
  - Five recommendation bundles:
    - Planning / Review bundle
    - MCP Productivity bundle
    - Frontend Excellence bundle
    - TDD + Quality bundle
    - Browser / Web Verification bundle
  - Updated marketplace.json with accurate capability descriptions

### Core Features

- **Root Truth Layer**: AGENTS.md, CLAUDE.md, steering/ as canonical sources
- **Smart Adaptation**: Auto-detect project characteristics and generate tailored configurations
- **Safe Merge**: Incremental merge with dry-run preview and backup
- **Rollback Support**: Backup and restore capabilities
- **Cross-Tool Compatible**: Works with Claude Code, Cursor, and other MCP-compatible tools

### Initial Release

- Static template mode with bash and PowerShell installation scripts
- Validation script for template integrity
- RIPER-5 protocol integration
- Root truth prioritization design
- Plugin configuration for Claude Code marketplace

## [1.0.0] - 2026-04-19

### Initial Commit

- Project structure setup
- Basic template files (AGENTS.md, CLAUDE.md, steering/)
- Installation scripts (apply-template.sh, apply-template.ps1)
- Validation script (validate-template.mjs)
- README and documentation

---

## Upgrade Guide

### From 2.0.0 to 2.1.0

1. **Install CLI globally** (optional):
   ```bash
   npm install -g harness-coding-protocol
   ```

2. **Use new CLI commands**:
   ```bash
   # Old way
   npm run detect -- .
   
   # New way
   harness detect .
   ```

3. **Review reference documentation**:
   - Check `docs/references.md` for attribution clarity
   - Understand that Harness uses reference projects as product inspiration only

4. **Run tests**:
   ```bash
   npm test
   ```

### From 1.x to 2.0.0

This is a major version with significant architectural changes:

1. **Backup your existing configuration** before upgrading
2. **Review the new smart mode**: `--smart` flag enables auto-detection
3. **Test with dry-run first**: `--mode dry-run` to preview changes
4. **Read the new documentation** in `docs/` directory

---

## Links

- [GitHub Repository](https://github.com/yourusername/harness-coding-protocol)
- [Documentation](./docs/)
- [Issue Tracker](https://github.com/yourusername/harness-coding-protocol/issues)
