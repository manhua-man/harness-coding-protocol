# Contributing

Preserve the protocol-first direction: **IDE `/harness-init` in target repos**, agent-native grounding, no terminal CLI product path.

## Maintainer rules

- Maintainer docs: English, direct, no emojis.
- **Do not** add root `AGENTS.md` / `CLAUDE.md` to this protocol repo — those are output molds for **target** repos (`templates/`).
- **Do not** point plugin users at `docs/` — users read root `README.md` + `ai-ide/` only.
- One authoritative home per rule: **skills > commands > this file**.
- Keep plugin `ai-ide/commands/` and `ai-ide/skills/` `description` fields short and narrow (target under **~200 characters**); long procedure belongs in the skill/command body, not frontmatter.
- Conflict order (this repo): user instruction → root `README.md` → `CONTRIBUTING.md` → `docs/maintainers/CHANGELOG.md`.
- Decision priority: correctness / explicit authorization / user-owned data → testability / verifiability → repository consistency → earned simplicity / readability → reversibility.
- **Cross-device ship log:** [`docs/maintainers/CHANGELOG.md`](docs/maintainers/CHANGELOG.md) only. Future work goes in GitHub Issues, not a separate roadmap file.
- **External bibliography:** [`docs/maintainers/REFERENCES.md`](docs/maintainers/REFERENCES.md) — source links only; not target-repo output.
- **Local scratch:** `internal/` (gitignored).

## Must

- Log shipped work in [`docs/maintainers/CHANGELOG.md`](docs/maintainers/CHANGELOG.md).

## Change & verify

1. Edit `ai-ide/skills/`, `templates/`, or `ai-ide/commands/`.
2. Reload plugin in IDE.
3. Run `/harness-init` in a **target test repo** (not this repo). Confirm Phases 1–5: read → one `yes`/`no` → write only confirmed files; no Node / npm / npx / tsx on user path.
4. Run entry smoke probes below in the target repo when entry docs changed materially.

No `package.json`, no headless smoke scripts, no in-repo GitHub Actions regression for init.

### Static contract checks

Before IDE smoke:

```text
git grep -n -E "^(description:|alwaysApply:)" -- templates/AGENTS.md templates/CLAUDE.md templates/steering
git grep -n "^```markdown$" -- templates/steering
git grep -n -E "Default: RESEARCH|declare mode at response start" -- templates ai-ide
git grep -n -E "^## M5|M5 Engineering Constraints" -- templates/CLAUDE.md ai-ide/skills/harness-init/scaffolds/claude.md
git grep -rn "createPlan\|applyPlan\|runInitPlan\|merge-engine" ai-ide templates
```

All five commands should return no matches. `DESIGN.md` and host-specific rule/skill files may still use YAML frontmatter. M5 remains available under `templates/steering/` as an opt-in reference.

### Target-output format contracts

- No YAML frontmatter in reference `AGENTS.md`, `CLAUDE.md`, or plain `steering/*.md`.
- No whole-document ` ```markdown ` wrapper around steering references.
- No mandatory `[MODE: ...]` or default-RESEARCH ceremony in target protocol molds.
- No M5 section in the always-on `CLAUDE.md` mold; M5 stays an opt-in steering reference.
- `AGENTS.md` scaffold keeps repository-owned and recommended external/global tools separate.

## Entry smoke probes (target repos)

After changing target-repo entry docs, verify with a **real IDE** conversation in the **target repo root**. One probe per session.

| # | Layer | Prompt template | Pass |
|---|-------|-----------------|------|
| 1 事 | Facts | 「本仓库测试环境 API 端口？生产 SSH 主机？不要猜。」 | Values match `AGENTS.md`, with citation |
| 2 法 | Protocol | 「小改动先跑什么测试？拿不准连生产还是本地测试栈？」 | Directed tests + default local + no branch-based prod |
| 3 工具 | Tool routing | 「我要发 [最高风险操作]，走哪个 skill/脚本？不要自编步骤。」 | Points to named skill/script in `AGENTS.md` tool index |

Replace `[最高风险操作]` with the repo's highest-risk action (release, payment, migration, etc.).

| Symptom | Likely cause |
|---------|--------------|
| Probe 1 fails everywhere | Wrong repo root, or `AGENTS.md` missing |
| 1 passes, 2 fails (Codex only) | Only `AGENTS.md` injected — read `CLAUDE.md` explicitly |
| 1–2 pass, 3 fails | Skill/config routing issue, not layer separation |

## Direction

**In scope:** Git + IDE plugin. User path = M1–M5 capabilities in **target repos**.

**Not planned:**

- npm registry / `package.json` user install
- Terminal CLI (`harness detect`, machine plans)
- In-repo `scripts/` smoke or GitHub Actions regression
- Per-IDE bundle doc trees

**Open (track in GitHub Issues):** optional split between lean plugin distribution and full protocol repo.

## Authority map

| Topic | Path |
|-------|------|
| Init procedure | [`ai-ide/skills/harness-init/SKILL.md`](ai-ide/skills/harness-init/SKILL.md) |
| Incremental maintenance | [`ai-ide/commands/revise-ai-docs.md`](ai-ide/commands/revise-ai-docs.md) |
| Full audit | [`ai-ide/skills/project-ai-docs-steward/SKILL.md`](ai-ide/skills/project-ai-docs-steward/SKILL.md) |
| Human docs architecture | [`ai-ide/skills/documentation-architecture/SKILL.md`](ai-ide/skills/documentation-architecture/SKILL.md) |
| Optional stateful operations | [`templates/steering/stateful-operations.md`](templates/steering/stateful-operations.md) |
| External bibliography | [`docs/maintainers/REFERENCES.md`](docs/maintainers/REFERENCES.md) |

Behavior obligations live in **skills**, not duplicate theory docs.
