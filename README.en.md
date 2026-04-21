# Harness Coding Protocol

Make AI coding environments understand a repository before generating the smallest useful configuration.

Harness Coding Protocol is a **root-truth-first AI coding ecosystem adapter**. It now provides two paths:

- **Static mode:** copy `AGENTS.md`, `CLAUDE.md`, and `steering/` into a project.
- **Smart mode:** detect the target repository, generate recommendations, show a diff preview, and write only according to the selected mode.

Smart mode does not auto-install third-party tools and does not overwrite user configuration by default. The default posture is detect, recommend, preview, incrementally merge, and keep rollback practical.

## Core Model

| Layer | Path | Role |
|------|------|------|
| Facts | `AGENTS.md` | Verifiable repository facts: structure, commands, ports, endpoints, conventions |
| Protocol | `CLAUDE.md` | Decision priority, conflict handling, collaboration rules |
| Local overrides | `steering/*.md` | Extra guidance for specific paths, stacks, or tasks |

Tool-private folders can mirror these rules, but they do not define repository truth.

## Quick Start

Install dependencies:

```bash
npm install
```

Build the packaged CLI:

```bash
npm run build
```

Static install:

```bash
bash scripts/apply-template.sh /your/project
```

Windows PowerShell:

```powershell
powershell -File scripts/apply-template.ps1 C:\your\project
```

Smart preview with no writes:

```bash
npm run detect -- /your/project
npm run plan -- /your/project --from-run <run-id>
```

Equivalent CLI:

```bash
harness detect /your/project
harness plan /your/project --from-run <run-id>
```

Apply a saved plan:

```bash
harness apply /your/project --plan <run-id> --backup
```

Use smart mode through the installer script:

```bash
bash scripts/apply-template.sh /your/project --smart --mode dry-run
```

PowerShell:

```powershell
powershell -File scripts/apply-template.ps1 C:\your\project --smart --mode dry-run
```

Apply only low-risk, conflict-free changes:

```bash
npm run smart -- /your/project --mode silent --backup
```

Rollback one file to its latest backup:

```bash
harness rollback /your/project
```

Validate this repository's templates:

```bash
npm run validate -- .
```

Detect a target repository:

```bash
npm run detect -- /your/project --json
```

## CLI Contract

Core commands:

```text
harness detect [target]
harness plan [target] [--from-run <run-id>]
harness apply [target] --plan <run-id> [--backup]
harness rollback [target]
harness doctor [target]
harness setup [target] [--mode confirm|silent|dry-run] [--yes]
```

Every command writes `.harness/runs/<run-id>/`. Default stdout is concise; details live in `summary.md`, `plan.json`, `diff.patch`, `recommendations.md`, and `result.json`. Use `--json` for one-line machine-readable output. `setup --mode confirm` uses interactive confirmation and change selection in a TTY; non-TTY runs must pass `--yes` or use `--mode silent`.

Stable exit codes:

| Code | Meaning |
| --- | --- |
| 0 | success |
| 1 | detection failed |
| 2 | plan failed |
| 3 | apply failed |
| 4 | user cancelled |
| 5 | conflict detected |
| 6 | invalid input |

## Claude Code Adapter

The repository includes a thin Claude adapter:

```text
.claude/commands/harness-detect.ts
.claude/commands/harness-setup.ts
```

The adapter only:

- calls `harness detect/plan/apply --json`
- reads `.harness/runs/<run-id>/summary.md` and `plan.json`
- translates saved artifacts into short Claude-facing messages

It does not recompute detection, plan, risk, or diff. Applying changes is controlled by the caller through `confirmApply`; without confirmation it returns the preview only.

## Cursor Adapter

The Cursor adapter follows Cursor's own surfaces:

```text
.cursor/rules/harness-artifacts.mdc
.cursor/commands/harness-detect.md
.cursor/commands/harness-setup.md
```

These files only guide Cursor to call `harness detect/plan/apply --json` and read `.harness/runs/<run-id>/` artifacts. Cursor does not recompute detection, plan, risk, recommendations, or diff.

Static install with Cursor mirrors:

```bash
bash scripts/apply-template.sh /your/project --with-cursor
```

When smart mode detects Cursor, it also plans `.cursor/rules/harness.mdc` and `.cursor/commands/harness-*.md` as saved `plan.json` and `diff.patch` changes. They are applied only after the user confirms.

## What Smart Mode Does

1. Scans root truth, Claude Code, Cursor, MCP, stack markers, and AI tooling traces.
2. Detects frameworks and commands such as React, Next, Vite, NestJS, Express, pytest, FastAPI, Django, and Go test.
3. Generates `plan.json`, `summary.md`, `diff.patch`, and concise recommendations.
4. Applies only a saved plan, according to the selected mode.
5. Creates `result.json`, supports rollback, and keeps runs diagnosable.
6. In `silent` mode, writes only low-risk, conflict-free changes.

## Repository Layout

```text
harness-coding-protocol/
├── .claude-plugin/
├── docs/
│   ├── architecture.md
│   ├── best-practices.md
│   ├── references.md
│   ├── run-contract.md
│   ├── tool-adaptation.md
│   └── bundles/
├── scripts/
│   ├── apply-template.ps1
│   ├── apply-template.sh
│   └── validate-template.mjs
├── templates/
│   ├── AGENTS.md
│   ├── CLAUDE.md
│   ├── adapters/
│   ├── steering/
│   └── auto-detect/
├── package.json
└── plugin.json
```

## Bundles

`docs/bundles/` documents five recommendation packs:

- Planning / Review
- MCP Productivity
- Frontend Excellence
- TDD + Quality
- Browser / Web Verification

Bundles are recommendation packs, not automatic third-party installs.

## References And Attribution

`docs/references.md` tracks verified / partial status for community reference projects. Harness currently copies no external project code; future implementation reuse requires license review and implementation-site attribution.

## More Documentation

- `docs/architecture.md`: architecture, command responsibilities, and adapter boundaries
- `docs/run-contract.md`: run artifact layout, manifest, plan/result schema, stdout, and exit codes
- `docs/tool-adaptation.md`: Claude, Cursor, Kiro, and other tool adaptation boundaries

## Rule Priority

1. User instruction
2. Repository root `AGENTS.md`
3. Repository root `CLAUDE.md`
4. Matching `steering/*.md`
5. Tool adapter files and mirrors

## License

MIT
