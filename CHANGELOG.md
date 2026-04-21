# Changelog

All notable changes to Harness Coding Protocol will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-04-21

### 🎯 Major Architecture Overhaul: Plan-First Design

This release transforms Harness from a template copier into a **plan-first, contract-driven AI coding adapter**. The new architecture prioritizes the `plan` layer as the stable contract between detection, generation, and execution.

### ✨ Core Architecture Changes

#### **Phase 1: Core Contract Layer**

- **Run Contract System** (`run-contract.ts`):
  - Every command generates a unique `run-id` with complete artifact persistence
  - Stable schema version (`1.0.0`) for machine-readable contracts
  - Artifacts stored in `.harness/runs/<run-id>/`:
    - `manifest.json` - Run metadata and exit status
    - `detection.json` - Project detection results
    - `plan.json` - Complete plan with changes and risk assessment
    - `diff.patch` - Full diff preview
    - `summary.md` - Human-readable summary
    - `recommendations.md` - Detailed tool recommendations
  - Stable exit codes (0-6) for CI/CD integration

- **Plan-First Command Structure**:
  - `harness detect [target]` - Detect project characteristics, output run artifact
  - `harness plan [target] [--from-run <id>]` - **Core command**: Generate plan from detection
  - `harness apply [target] --plan <id>` - Execute a specific plan with backup support
  - `harness rollback [target]` - Rollback last apply or specific file
  - `harness doctor [target]` - Diagnose run artifacts and project health
  - `harness setup [target]` - Composite command (detect + plan + apply)

- **Simplified Recommendation Engine**:
  - Default output: **top 3 only** (mustHave + suggested + warning)
  - Full recommendations written to `recommendations.md`
  - Confidence-based sorting and intelligent selection
  - Ecosystem-aware recommendations (Node.js, Python, Go, generic)
  - Bundle recommendations (Frontend Excellence, MCP Productivity, TDD+Quality, Browser Verification)

- **Stdout Layering**:
  - Terminal output: ≤5 lines (concise summary + run-id + artifact path)
  - Detailed information: written to `.harness/runs/<run-id>/`
  - `--json` flag: single-line machine-readable output for CI/CD

#### **Phase 2: Interactive CLI**

- **@clack/prompts Integration**:
  - Interactive confirmation flow for `setup --mode confirm`
  - Multi-select interface for choosing which changes to apply
  - Spinner progress indicators for long-running operations
  - Graceful Ctrl+C handling with `isCancel` detection

- **Non-TTY Auto-Degradation**:
  - Automatic detection of TTY environment
  - Clear error messages when confirmation needed in non-TTY
  - `--yes` flag for automated environments
  - `--mode silent` for unattended execution

#### **Phase 3: Claude Code Adapter (Thin Layer)**

- **Minimal Adapter Design** (≤200 lines total):
  - `.claude/commands/harness-detect.ts` - Wraps `harness detect --json`
  - `.claude/commands/harness-setup.ts` - Orchestrates detect → plan → confirm → apply
  - `.claude/commands/shared.ts` - Utility functions for artifact reading

- **Adapter Principles**:
  - Only calls CLI commands, never reimplements logic
  - Only reads artifacts, never recalculates
  - Only translates output, never makes decisions
  - Supports custom `confirmApply` callback for user interaction

#### **Phase 4: Cursor Adapter (Generator-Based)**

- **Cursor Integration**:
  - Generates `.cursor/rules/harness.mdc` when Cursor detected
  - Generates `.cursor/commands/harness-detect.md` command
  - Generates `.cursor/commands/harness-setup.md` command
  - No separate command entry point (follows "thin adapter" principle)

### 🚀 New Features

- **Reference Audit**: `docs/references.md` documenting all reference projects with verification status
- **Testing Infrastructure**:
  - Vitest test framework integration
  - `npm run test` and `npm run test:watch` scripts
  - Test fixtures for minimal, cursor-heavy, and claude-mcp repositories
- **Build System**:
  - `npm run build` for TypeScript compilation
  - Package bin entry point: `dist/templates/auto-detect/cli.js`
  - Source maps for debugging

### 📊 Detection Enhancements

- New `frameworks` field in detection output
- New `commands` field extracting npm/yarn/pnpm scripts
- Enhanced framework detection (React, Next.js, Vite, NestJS, FastAPI, Django, etc.)
- Shallow scan mode (`--shallow`) for large repositories
- Configurable max depth (`--max-depth <n>`)

### 🔧 Changed

- **Command Structure**: `plan` is now the core command, `setup` is a composite
- **Recommendation Output**: Default shows top 3, full report in file
- **Merge Strategy**: Defaults to incremental over overwrite
- **Diff Reporter**: Enhanced output format with context preservation
- **Marketplace Description**: Updated to emphasize "plan-first contract-driven adapter"

### 🐛 Fixed

- Script path references now align with actual directory structure
- Validation logic consistency across all templates
- PowerShell and Bash script behavior parity
- Non-TTY environment handling

### 📚 Documentation

- Added `docs/references.md` with attribution rules
- Updated `ROADMAP.md` with Phase 1-4 completion status
- Updated `README.md` with new CLI contract and architecture
- Clarified reference project usage (product reference only, no code copying)

### 🎓 Migration Guide

#### From 2.0.0 to 2.1.0

**Breaking Changes**:
- CLI command structure changed: `plan` is now separate from `setup`
- Recommendation output format changed: default shows top 3 instead of full list
- Artifact location changed: now in `.harness/runs/<run-id>/` instead of project root

**Migration Steps**:

1. **Update CLI usage**:
   ```bash
   # Old way (2.0.0)
   harness setup /your/project --mode dry-run
   
   # New way (2.1.0) - recommended workflow
   harness detect /your/project
   harness plan /your/project --from-run <run-id>
   # Review .harness/runs/<run-id>/summary.md
   harness apply /your/project --plan <run-id> --backup
   
   # Or use composite command
   harness setup /your/project --mode confirm
   ```

2. **Update scripts and CI/CD**:
   ```bash
   # Use --json for machine-readable output
   harness detect /your/project --json
   
   # Check exit codes
   # 0 = success, 1 = detection failed, 2 = plan failed, 
   # 3 = apply failed, 4 = user cancelled, 5 = conflict detected, 6 = invalid input
   ```

3. **Update Claude Code integration**:
   - Old commands still work but use new artifact structure
   - Check `.harness/runs/<run-id>/` for detailed output
   - Use `--json` flag for programmatic access

4. **Clean up old artifacts** (optional):
   ```bash
   # Old artifacts were in project root
   rm -f detected-report.json detected-tools.json
   
   # New artifacts are in .harness/runs/
   # Use `harness doctor` to check artifact health
   ```

### 🔗 Links

- [GitHub Repository](https://github.com/ManHua/harness-coding-protocol)
- [Documentation](./docs/)
- [Issue Tracker](https://github.com/ManHua/harness-coding-protocol/issues)

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
