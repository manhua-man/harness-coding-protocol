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
npm run smart -- /your/project --mode dry-run
```

Equivalent CLI:

```bash
harness setup /your/project --mode dry-run
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
harness rollback /your/project/AGENTS.md
```

Validate this repository's templates:

```bash
npm run validate -- .
```

Detect a target repository:

```bash
npm run detect -- /your/project --no-write
```

## What Smart Mode Does

1. Scans root truth, Claude Code, Cursor, MCP, stack markers, and AI tooling traces.
2. Detects frameworks and commands such as React, Next, Vite, NestJS, Express, pytest, FastAPI, Django, and Go test.
3. Generates candidate `AGENTS.md`, `CLAUDE.md`, `steering/harness-recommendations.md`, and optional compatibility files.
4. Generates `docs/ai-tool-recommendations.md`.
5. Shows diff, risk, and conflict status.
6. In `silent` mode, writes only low-risk, conflict-free changes.

## Repository Layout

```text
harness-coding-protocol/
├── .claude-plugin/
├── docs/
│   ├── architecture.md
│   ├── best-practices.md
│   ├── references.md
│   ├── tool-adaptation.md
│   └── bundles/
├── scripts/
│   ├── apply-template.ps1
│   ├── apply-template.sh
│   └── validate-template.mjs
├── templates/
│   ├── AGENTS.md
│   ├── CLAUDE.md
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

## Rule Priority

1. User instruction
2. Repository root `AGENTS.md`
3. Repository root `CLAUDE.md`
4. Matching `steering/*.md`
5. Tool adapter files and mirrors

## License

MIT
