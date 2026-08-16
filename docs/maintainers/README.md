# Maintainer Index

**Plugin users:** root [`README.md`](../../README.md) + [`ai-ide/`](../../ai-ide/) (AI IDE) only.

## This repo (protocol factory)

| Piece | Path |
| --- | --- |
| User entry | [`README.md`](../../README.md) |
| AI IDE surface | `ai-ide/commands/` + `ai-ide/skills/` |
| Target-repo molds | `templates/` |
| Plugin metadata | `.claude-plugin/` |

**No root `AGENTS.md` / `CLAUDE.md` here** — those are output molds for **target** repos.

```
harness-coding-protocol/
├── README.md
├── ai-ide/           ← AI IDE: commands + skills
├── templates/
└── docs/maintainers/
```

**Cross-device:** `docs/maintainers/` is git-tracked. **Local scratch:** `internal/` (gitignored).

## Maintainer rules

- Maintainer docs: English, direct, no emojis.
- **Do not** add root `AGENTS`/`CLAUDE` to this protocol repo.
- **Do not** point plugin users at `docs/` — only README + `ai-ide/`.
- Conflict order (this repo): user instruction → root `README.md` → `docs/maintainers/` → `CONTRIBUTING.md`.
- Decision priority: Correctness/safety/authorization → testability/verifiability → repository consistency → simplicity/readability → reversibility.

## Change & verify

1. Edit `ai-ide/skills/`, `templates/`, or `ai-ide/commands/`.
2. Reload plugin in IDE.
3. Run `/harness-init` in a **target test repo** (not this repo). Confirm Phases 1–5: read → one yes/no → write only confirmed files; no Node/npm/npx/tsx on user path.
4. Log shipped work in [`CHANGELOG.md`](CHANGELOG.md). Future-only items in [`ROADMAP.md`](ROADMAP.md).

`grep -rn "createPlan\|applyPlan\|runInitPlan\|merge-engine" ai-ide templates` must stay clean before release.

Target-output format contracts must also stay clean:

- no YAML frontmatter in reference `AGENTS.md`, `CLAUDE.md`, or plain `steering/*.md`;
- no whole-document ````markdown` wrapper around steering references;
- no mandatory `[MODE: ...]` or default-RESEARCH ceremony in target protocol molds;
- no M5 section in the always-on CLAUDE mold; M5 stays an opt-in steering reference;
- `AGENTS.md` scaffold keeps repository-owned and recommended external/global tools separate.

## Capability docs (kept minimal)

| Topic | Path |
| --- | --- |
| C5 maintenance lifecycle | [`capabilities/maintenance.md`](capabilities/maintenance.md) |
| IDE entry smoke probes (target repos) | [`capabilities/entry-smoke-probes.md`](capabilities/entry-smoke-probes.md) |
| Init authority | [`ai-ide/skills/harness-init/SKILL.md`](../../ai-ide/skills/harness-init/SKILL.md) |

Behavior obligations live in **skills**, not duplicate maintainer theory docs.
