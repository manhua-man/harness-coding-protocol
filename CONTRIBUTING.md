# Contributing

Preserve the protocol-first direction: **IDE `/harness-init` in target repos**, agent-native grounding, no terminal CLI product path.

## Maintainer rules

- Maintainer docs: English, direct, no emojis.
- **Do not** add root `AGENTS.md` / `CLAUDE.md` to this protocol repo — those are output molds for **target** repos (`templates/`).
- **Do not** point plugin users at `docs/` — users read root `README.md` + `ai-ide/` only.
- Root-entry templates and adapters live only in `templates/`. Skills own workflow and generation checks; commands delegate to skills; this file owns maintainer guidance.
- Keep plugin `ai-ide/commands/` and `ai-ide/skills/` `description` fields short and narrow (target under **~200 characters**); long procedure belongs in the skill/command body, not frontmatter.
- Conflict order (this repo): user instruction → root `README.md` → `CONTRIBUTING.md` → `docs/maintainers/CHANGELOG.md`.
- Decision priority: correctness / explicit authorization / user-owned data → testability / verifiability → repository consistency → earned simplicity / readability → reversibility.
- **Cross-device ship log:** [`docs/maintainers/CHANGELOG.md`](docs/maintainers/CHANGELOG.md) only. Future work goes in GitHub Issues, not a separate roadmap file.
- **External bibliography:** [`docs/maintainers/REFERENCES.md`](docs/maintainers/REFERENCES.md) — source links only; not target-repo output.
- **Local scratch:** `internal/` (gitignored).

## Engineering Rule Ownership

For maintenance of this plugin, apply [Core Engineering Principles](templates/CLAUDE.md#core-engineering-principles), [Requirement Boundary Gate](templates/CLAUDE.md#requirement-boundary-gate), and its [Simplification Consistency Gate](templates/CLAUDE.md#simplification-consistency-gate) as repository rules. Those sections are the single full definitions; the rest of the target-repo template is not this repository's environment or tool configuration. The maintainer conflict order and decision priority above remain authoritative here.

| Content | Authoritative home | Generation or maintenance companion |
| --- | --- | --- |
| Root-entry structure and reusable rules | [`templates/`](templates/) | Init reads these templates directly; do not maintain a second scaffold body |
| Core principles, requirements, simplification, completion, verification | [CLAUDE template](templates/CLAUDE.md) | Init checks required concept coverage; full definitions stay in this template |
| Real paths, commands, validation entry points | Target repository `AGENTS.md` | Generate from inspected manifests and project evidence |
| Complexity proof, ablation, asset assessment methods | [M5 methods reference](templates/steering/m5-engineering-principles.md) | Selected when useful; does not redefine root principles |
| State contracts, data lifecycle, recovery | [Stateful reference](templates/steering/stateful-operations.md) | Adapt only for evidenced stateful owners |
| Coding illustrations | [Karpathy examples](templates/steering/karpathy-examples.md) | Follow root requirement and approval boundaries |
| Operational workflows | Applicable project skill | Root files route to existing entries rather than copy recipes |

Do not copy `servers`-specific Redis, NestJS, database migration, authentication, or batch-performance policies into default protocol. Target projects retain their own concrete contracts. Optional references supplement default principles; they do not make those principles optional.

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
git grep -n -E "^## M5|M5 Engineering Constraints" -- templates/CLAUDE.md
git grep -rn "createPlan\|applyPlan\|runInitPlan\|merge-engine" ai-ide templates
```

All five commands should return no matches. `DESIGN.md` and host-specific rule/skill files may still use YAML frontmatter. Detailed engineering methods remain available under `templates/steering/` as opt-in references; the five core principles and requirement gates belong to default protocol.

### Target-output format contracts

- No YAML frontmatter in reference `AGENTS.md`, `CLAUDE.md`, or plain `steering/*.md`.
- No whole-document ` ```markdown ` wrapper around steering references.
- No mandatory `[MODE: ...]` or default-RESEARCH ceremony in target protocol molds.
- No M5 methods section in the always-on `CLAUDE.md` mold; core principles and requirement gates are mandatory, while detailed methods stay in opt-in steering references.
- `AGENTS.md` template keeps repository-owned and recommended external/global tools separate.
- Init template links resolve within the installed plugin, including `templates/`; no standalone scaffold copies are distributed. Generated links resolve within the target repo.

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

## Engineering Boundary Smoke Probes

In an isolated real IDE target session, check that a new root protocol has five individually addressable core-principle subheadings and the requirement/simplification gates in the resolved locale. Probe these decisions as well as file structure:

| Request | Expected behavior |
| --- | --- |
| A speculative feature is justified only by a newly written failing test | Ask for the requirement anchor; do not implement it as an authorized product change |
| Remove an obsolete mechanism | Identify and remove the withdrawn structure; justify any retained compatibility contract |
| Make a small reversible edit | Use relevant evidence and targeted checks without blanket full-suite tests or repeated approval |
| Initialize a stateless project | Generate core requirements without inventing stateful machinery or copying optional reference files |
| An authorized resumable job meets expected partial state | Use the existing safe entry; distinguish resumability from adding an automatic recovery service |

Static heading/link checks do not establish these behavioral results. Record real-session evidence and any unverified behavior.

## Feature documentation smoke probes

Use isolated target repos in real IDE sessions; do not run these against a user's live project as a side effect of plugin maintenance. Exercise the shared feature documentation contract through init, update-docs, and steward:

| Scenario | Expected behavior |
| --- | --- |
| New repo with two evidenced workflows | Init lists concrete catalog/page paths in its confirmation; no writes before approval; landed links resolve |
| Existing catalog under nonstandard paths | Reuse owners and paths; preserve unrelated sections; no parallel `docs/features` tree |
| Tiny repo or empty repo without requirements | Use an existing README section when useful, or skip; no invented groups or passing results |
| New failure against an older passing summary | Update the detailed current limitation and affected summary; preserve version-qualified historical result |
| Missing execution evidence | Mark inferred or untested; do not turn source/test presence into a runtime pass |
| Identical repeat run | No duplicate files, groups, headings, or date-only churn |
| User declines init / one write fails | No writes on decline; report partial apply and broken routes on failure |

Static checks do not establish these behavioral passes. Record actual IDE results and limitations when performing them.

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
| Human docs sync & routing | [`ai-ide/commands/update-docs.md`](ai-ide/commands/update-docs.md) |
| Human docs architecture | [`ai-ide/skills/documentation-architecture/SKILL.md`](ai-ide/skills/documentation-architecture/SKILL.md) |
| Corpus doc governance (block audit, code-to-doc check, build-plan retirement, black-box deliverables) | [`ai-ide/skills/doc-governance/SKILL.md`](ai-ide/skills/doc-governance/SKILL.md) |
| Media & generation pipeline quality audit (detect, repair, retry, fallback, quarantine) | [`ai-ide/skills/pipeline-quality-audit/SKILL.md`](ai-ide/skills/pipeline-quality-audit/SKILL.md) |
| Optional stateful operations | [`templates/steering/stateful-operations.md`](templates/steering/stateful-operations.md) |
| External bibliography | [`docs/maintainers/REFERENCES.md`](docs/maintainers/REFERENCES.md) |

Behavior obligations live in **skills**, not duplicate theory docs.
