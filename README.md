# Harness Coding Protocol

IDE 插件：在**你的业务仓库**里铺底并维护 AI 协作入口（`AGENTS.md` / `CLAUDE.md`）。

**[中文](#中文)** · **[English](#english)**

---

## 中文

### 这是什么

一套 **M1–M5 能力模块**，让 AI 在**目标仓库**（例如 `servers`）里读懂现状、写出分层入口文档、并在你确认后写入。

**不是** npm 包，**不是**终端 `harness` CLI。目标仓不需要 `package.json`，也不需要为插件单独 `npm install`。

### 五个能力模块

| 模块 | 做什么 | 用户入口 |
|------|--------|----------|
| **M1 分层契约** | 规定目标仓 AI 真值怎么分层、什么可常驻、什么按需读、冲突怎么裁决；含路由非菜谱、风险分级验证、自主性边界 | 铺底与维护命令共同遵守；模具见 `templates/` |
| **M2 铺底** | 首次或大重置：读证据 → 起草 → **一次确认** → 只写确认过的文件 | `/harness-init` |
| **M3 增量维护** | 会话结束：把一条可复用经验写回事/法/steering | `/revise-ai-docs` |
| **M4 全量审计** | 定期体检：**先报告**（含自主性/摩擦审计），确认后再改 | `/project-ai-docs-steward` |
| **M5 人类文档** | 同步 `docs/`、`README` 与实现（增量同步或 `--audit-corpus` 存量全盘收敛）；**不改** AI 真值层 | `/update-docs` |

**M1 在目标仓落地的分层：**

```text
法 (CLAUDE.md) → 事 (AGENTS.md) → steering/ → docs/（人类长文，非 AI 真值）
```

| 层级 | 文件 | 写什么 |
|------|------|--------|
| 法 | `CLAUDE.md` | 协作方式、决策优先级、冲突裁决、风险分级 RIPER、完成度与批准边界 |
| 事 | `AGENTS.md` | 端口、命令、目录、模块、工具索引、按风险分级的验证入口（路由，非菜谱） |
| 设 | `DESIGN.md` | 有 UI/体验证据或你要求时才写 |
| 局部 | `steering/` | 路径/任务级补丁；仅在有项目证据时条件生成 |
| 人类 | `docs/` | 背景资料；**不能压过**事/法 |

五条核心工程原则、需求边界及简化一致性门禁属于默认 `CLAUDE.md`，每条核心原则有独立三级标题。复杂度五问、消融方法放在 [M5 方法参考](templates/steering/m5-engineering-principles.md)，状态与数据恢复放在 [stateful operations](templates/steering/stateful-operations.md)，编码示例放在 Karpathy 参考；这些详细方法按需选择，不自动生成或改变授权范围。外部阅读来源见维护者 [`docs/maintainers/REFERENCES.md`](docs/maintainers/REFERENCES.md)。

**M1 常驻约束（摘要）：**

- 事 = 路由 + 可核对事实；法 = 边界 + 优先级；不重复同一主题
- 按任务读入口文档，不要求每次改 typo 前读完整文档栈
- 有意保障（支付、生产、迁移等）保留；意外摩擦（全盘预读、全量测试、步步确认）应删减或收窄
- skill 描述要短、触发要窄；根文件做路由器，细节渐进披露

### 两个仓库，别搞混

| | **本仓库**（harness-coding-protocol） | **目标业务仓**（你的项目） |
|---|---|---|
| 你是谁 | 装插件的人 | 日常写代码的人 |
| 该读什么 | **本 README** | 根目录 `AGENTS.md` + `CLAUDE.md` |
| AI 真值 | 无（本仓不铺根 `AGENTS`/`CLAUDE`） | `AGENTS.md` + `CLAUDE.md` |
| 人类长文档 | 无（维护者见 `CONTRIBUTING.md`） | `docs/`（背景资料，**不能压过**事/法） |

### 三步上手

```text
① 全机安装插件（一次）  →  ② 打开业务仓跑 /harness-init  →  ③ 日常用 M3–M5 维护命令
```

**① 安装（全机一次，Cursor / Grok / Codex / Claude Code 共用）**

```text
/plugin marketplace add manhua-man/harness-coding-protocol
/plugin install harness-coding-protocol@harness-coding-protocol
```

不在 Anthropic 默认市场，需手动添加上述 GitHub 源。  
验证：`claude plugin list` 有 `harness-coding-protocol@harness-coding-protocol`；任意已接入 IDE 里 `/` 能补全四条命令。

**② 在业务仓铺底（M2）**

1. 用 IDE 打开**目标仓库**（不是本协议仓）
2. 首次或大重置时运行 `/harness-init`，看摘要后回复 `yes` / `no`
3. 已有 `AGENTS.md` + `CLAUDE.md` 的仓：**跳过** init，直接用 M3–M5

**`/harness-init` 五阶段：**

| 阶段 | 做什么 |
|------|--------|
| 1 Ground | 读 README、manifest、现有入口、工具痕迹，形成项目画像 |
| 2 Read | 在预算内继续读证据文件 |
| 3 Draft | 在内存里起草 M1 分层文件 |
| 4 Confirm | 展示每个文件打算怎么改，等你回复 `yes` / `no` |
| 5 Apply | **只写**你确认过的内容；不偷偷覆盖 |

**③ 日常维护（M3–M5）**

| 命令 | 何时用 |
| --- | --- |
| `/revise-ai-docs` | 会话结束，把经验写回 AI 入口 |
| `/project-ai-docs-steward` | 定期体检（先报告，确认后再改） |
| `/update-docs` | 人类 `docs/`、`README` 落后或需 `--audit-corpus` 存量盘点收敛时（**不改** AI 真值层） |

小改用 `/revise-ai-docs`，**不要**为改几个字反复 `plugin install`。偶尔升级插件：

```text
/plugin marketplace update harness-coding-protocol
/plugin update harness-coding-protocol@harness-coding-protocol
```

### 功能目录与文档维护

`/harness-init` 可根据实际功能生成目录索引和功能组文档，并放入同一次确认的写入清单。已有分组和路径优先复用；小项目可只增加 README 功能章节，空项目不虚构功能。

每组文档维护当前能力、实现与测试入口、实际验证结果、已知问题和下一步。`/update-docs` 默认按 git 变更增量同步受影响功能及摘要；当传入 `--audit-corpus` 或要求存量全盘梳理时，路由至 [`doc-governance`](ai-ide/skills/doc-governance/SKILL.md) 执行分块全文精读审计（冗余/缺失/整合）、代码全集反向对账、过程施工计划退役与对外交付目录黑盒收敛。`/project-ai-docs-steward` 检查分组遗漏、重复所有者、历史结果冒充本版通过，以及新问题与旧摘要冲突。根入口只保留路由。

模板与规则见[功能文档契约](ai-ide/skills/documentation-architecture/references/feature-documentation.md)。分组数量、版本标识和证据保留方式按项目确定。针对生成式/媒体管线输出质量审计与恢复，可按需调用 [`pipeline-quality-audit`](ai-ide/skills/pipeline-quality-audit/SKILL.md)。

### 深入阅读

| 目的 | 文件 |
| --- | --- |
| M2 铺底流程真值 | [`ai-ide/skills/harness-init/SKILL.md`](ai-ide/skills/harness-init/SKILL.md) |
| M2 命令入口 | [`ai-ide/commands/harness-init.md`](ai-ide/commands/harness-init.md) |
| M3 增量维护 | [`ai-ide/commands/revise-ai-docs.md`](ai-ide/commands/revise-ai-docs.md) |
| M4 全量审计 | [`ai-ide/skills/project-ai-docs-steward/SKILL.md`](ai-ide/skills/project-ai-docs-steward/SKILL.md) |
| M5 人类文档命令 | [`ai-ide/commands/update-docs.md`](ai-ide/commands/update-docs.md) |
| M5 人类文档架构 | [`ai-ide/skills/documentation-architecture/SKILL.md`](ai-ide/skills/documentation-architecture/SKILL.md) |
| M5 存量文档治理与双向对账 | [`ai-ide/skills/doc-governance/SKILL.md`](ai-ide/skills/doc-governance/SKILL.md) |
| 管线产物质量审计与恢复 | [`ai-ide/skills/pipeline-quality-audit/SKILL.md`](ai-ide/skills/pipeline-quality-audit/SKILL.md) |

### 注意

- 写入前会展示摘要，必须你确认
- M3–M5 **不替代**业务仓自己的领域 skill（发版、支付等）
- 改协议仓本身：见 [`CONTRIBUTING.md`](CONTRIBUTING.md)

MIT License.

---

## English

### What this is

An IDE plugin that delivers **five capability modules (M1–M5)** to bootstrap and maintain AI entry docs in **your target repository**.

Not an npm package. Not a terminal CLI. The target repo does not need `package.json`.

### Five capability modules

| Module | What it does | User entry |
|--------|--------------|------------|
| **M1 Layer contract** | Defines AI truth layering, what may stay always-on vs task-scoped, conflict resolution, routing-not-recipes, risk-tiered validation, and autonomy boundaries | Shared by bootstrap + maintenance; molds in `templates/` |
| **M2 Bootstrap** | First setup or major reset: read evidence → draft → **one confirmation** → write confirmed files only | `/harness-init` |
| **M3 Incremental maintenance** | End of session: write one reusable learning back to facts/protocol/steering | `/revise-ai-docs` |
| **M4 Full audit** | Periodic health check: **report first** (includes autonomy/friction audit), edit only after confirmation | `/project-ai-docs-steward` |
| **M5 Human docs** | Sync `docs/` and `README` with implementation (incremental sync or `--audit-corpus` full-corpus convergence); **does not** change AI truth | `/update-docs` |

**M1 layer stack in the target repo:**

```text
Protocol (CLAUDE.md) → Facts (AGENTS.md) → steering/ → docs/ (human only)
```

| Layer | File | Content |
|-------|------|---------|
| Protocol | `CLAUDE.md` | Collaboration, decision priority, conflict resolution, risk-tiered RIPER, completion and approval boundaries |
| Facts | `AGENTS.md` | Ports, commands, layout, modules, tool index, risk-tiered validation routes — routing, not recipes |
| Design | `DESIGN.md` | Only when UI/experience evidence exists or you request it |
| Local | `steering/` | Path/task-scoped patches; created only from project evidence |
| Human | `docs/` | Background; **must not override** facts/protocol |

The five core engineering principles, requirement boundary, and simplification gate belong to default `CLAUDE.md`, with a separate third-level heading for each principle. Detailed complexity and ablation methods live in the [M5 methods reference](templates/steering/m5-engineering-principles.md); state/data recovery lives in [stateful operations](templates/steering/stateful-operations.md); coding illustrations live in the Karpathy reference. These methods are selected on demand and never auto-generated or treated as new authorization. Maintainer bibliography: [`docs/maintainers/REFERENCES.md`](docs/maintainers/REFERENCES.md).

**M1 always-on constraints (summary):**

- Facts = routes + verifiable truth; Protocol = boundaries + priorities; one owner per topic
- Read entry docs as the task requires; no full doc-stack pre-read before trivial edits
- Keep intentional safeguards (payments, production, migrations); narrow accidental friction (blanket pre-read, full-suite tests, per-step approval)
- Skill descriptions stay short and narrow; root skill files route; details use progressive disclosure

### Two repos — do not mix them up

| | **This repo** (harness-coding-protocol) | **Your app repo** |
|---|---|---|
| Audience | Plugin installer | Daily development |
| Read | **This README** | Root `AGENTS.md` + `CLAUDE.md` |
| AI truth | None at protocol root | `AGENTS.md` + `CLAUDE.md` |
| Long docs | None (maintainers: `CONTRIBUTING.md`) | `docs/` (human background, not AI truth) |

### Quick start

```text
① Install plugin once  →  ② /harness-init in your app repo  →  ③ M3–M5 maintenance commands
```

**① Install once (shared across Cursor, Grok, Codex, Claude Code)**

```text
/plugin marketplace add manhua-man/harness-coding-protocol
/plugin install harness-coding-protocol@harness-coding-protocol
```

Verify: `claude plugin list` shows the plugin; `/` completes all four commands in any connected IDE.

**② Bootstrap (M2)**

Open your **app repo** (not this protocol repo). Run `/harness-init` on first setup or major reset; confirm `yes` / `no`. If `AGENTS.md` and `CLAUDE.md` already exist, skip init and use M3–M5 only.

**`/harness-init` five phases:**

| Phase | Action |
|-------|--------|
| 1 Ground | Read README, manifests, existing entry docs, tool traces |
| 2 Read | Gather more evidence within budget |
| 3 Draft | Prepare M1 layer files in memory |
| 4 Confirm | Show per-file plan; wait for `yes` / `no` |
| 5 Apply | Write **only** confirmed files |

**③ Day to day (M3–M5)**

| Command | When |
| --- | --- |
| `/revise-ai-docs` | End of session — write learnings back |
| `/project-ai-docs-steward` | Periodic audit (report first) |
| `/update-docs` | Sync human `docs/` and README, or run `--audit-corpus` full-corpus convergence (not AI truth) |

Occasional upgrade: `/plugin marketplace update harness-coding-protocol` then `/plugin update harness-coding-protocol@harness-coding-protocol`.

### Feature catalogs and documentation

`/harness-init` can draft evidence-backed feature groups and their index in the same confirmed write set. Existing owners and paths are reused; small projects may use a README section, and empty projects get no invented capabilities.

Feature pages own current behavior, implementation/test routes, actual validation results, issues, and next steps. `/update-docs` synchronizes affected owners and summaries incrementally by default, or routes `--audit-corpus` full-corpus audits to [`doc-governance`](ai-ide/skills/doc-governance/SKILL.md) for block-by-block full-text audit (redundancy, missing, consolidation), code-to-doc bidirectional inventory, completed build-plan retirement, and self-contained black-box deliverable convergence; `/project-ai-docs-steward` checks missing groups, duplicate owners, stale summaries, and historical results presented as current passes. Root entries keep short routes only.

See the [feature documentation contract and templates](ai-ide/skills/documentation-architecture/references/feature-documentation.md). Group counts, version identifiers, and evidence retention are project-specific. For media or generation pipeline output verification and recovery, use [`pipeline-quality-audit`](ai-ide/skills/pipeline-quality-audit/SKILL.md).

### Go deeper

| Need | Path |
| --- | --- |
| M2 init procedure | [`ai-ide/skills/harness-init/SKILL.md`](ai-ide/skills/harness-init/SKILL.md) |
| M2 command entry | [`ai-ide/commands/harness-init.md`](ai-ide/commands/harness-init.md) |
| M3 incremental maintenance | [`ai-ide/commands/revise-ai-docs.md`](ai-ide/commands/revise-ai-docs.md) |
| M4 full audit | [`ai-ide/skills/project-ai-docs-steward/SKILL.md`](ai-ide/skills/project-ai-docs-steward/SKILL.md) |
| M5 human docs command | [`ai-ide/commands/update-docs.md`](ai-ide/commands/update-docs.md) |
| M5 human docs architecture | [`ai-ide/skills/documentation-architecture/SKILL.md`](ai-ide/skills/documentation-architecture/SKILL.md) |
| M5 corpus doc governance & bidirectional inventory | [`ai-ide/skills/doc-governance/SKILL.md`](ai-ide/skills/doc-governance/SKILL.md) |
| Pipeline output quality audit & recovery | [`ai-ide/skills/pipeline-quality-audit/SKILL.md`](ai-ide/skills/pipeline-quality-audit/SKILL.md) |

### Maintainers

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

MIT License.
