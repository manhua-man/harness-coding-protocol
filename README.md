# Harness Coding Protocol

IDE 插件：在**你的业务仓库**里铺底并维护 AI 协作入口（`AGENTS.md` / `CLAUDE.md`）。

**[中文](#中文)** · **[English](#english)**

---

## 中文

### 这是什么

一条命令流，让 AI 在**目标仓库**（例如 `servers`）里：

1. 读懂项目现状  
2. 生成或更新根目录 **事/法** 入口文件  
3. 经你确认后写入  

**不是** npm 包，**不是**终端 `harness` CLI。目标仓不需要 `package.json`，也不需要为插件单独 `npm install`。

### 两个仓库，别搞混

| | **本仓库**（harness-coding-protocol） | **目标业务仓**（你的项目） |
|---|---|---|
| 你是谁 | 装插件的人 | 日常写代码的人 |
| 该读什么 | **本 README** | 根目录 `AGENTS.md` + `CLAUDE.md` |
| AI 真值 | 无（本仓不铺根 `AGENTS`/`CLAUDE`） | `AGENTS.md` + `CLAUDE.md` |
| 人类长文档 | `docs/maintainers/`（维护者用，**插件用户不必读**） | `docs/`（背景资料，**不能压过**事/法） |

本仓库提供：**`ai-ide/`（AI IDE 插件目录）**、**`templates/` 参考模具**。模具保留法/事/设分层和风险分级 RIPER 等核心协议，并把 M5、stateful operations、Karpathy 等方法放在 opt-in steering 参考层；`/harness-init` 会根据目标仓证据改写，不会逐字复制占位内容。模具描述的是**目标仓**里的文件，不是本仓库自己的根真值。

### 三步上手

```text
① 全机安装插件（一次）  →  ② 打开业务仓跑 /harness-init  →  ③ 日常用维护命令
```

**① 安装（全机一次，Cursor / Grok / Codex / Claude Code 共用）**

在 Claude Code 执行：

```text
/plugin marketplace add manhua-man/harness-coding-protocol
/plugin install harness-coding-protocol@harness-coding-protocol
```

不在 Anthropic 默认市场，需手动添加上述 GitHub 源。  
验证：`claude plugin list` 有 `harness-coding-protocol@harness-coding-protocol`；任意已接入 IDE 里 `/` 能补全下面四条命令。

**② 在业务仓铺底**

1. 用 IDE 打开**目标仓库**（不是本协议仓）  
2. 首次或大重置时运行 `/harness-init`，看摘要后回复 `yes` / `no`  
3. 已有 `AGENTS.md` + `CLAUDE.md` 的仓：**跳过** init，直接用维护命令  

**③ 日常维护**

| 命令 | 何时用 |
| --- | --- |
| `/revise-ai-docs` | 会话结束，把经验写回 AI 入口 |
| `/project-ai-docs-steward` | 定期体检（先报告，确认后再改） |
| `/update-docs` | 人类 `docs/`、`README` 落后时（**不改** AI 真值层） |

小改用 `/revise-ai-docs`，**不要**为改几个字反复 `plugin install`。偶尔升级插件：

```text
/plugin marketplace update harness-coding-protocol
/plugin update harness-coding-protocol@harness-coding-protocol
```

### `/harness-init` 会写什么

| 文件 | 角色 |
| --- | --- |
| `AGENTS.md` | **事** — 端口、命令、目录、模块等可核对事实 |
| `CLAUDE.md` | **法** — 协作方式、决策优先级、冲突裁决 |
| `DESIGN.md` | **设** — 有 UI/体验证据或你要求时才写 |
| `steering/` | 局部规则（路径/任务级补丁） |
| `.cursor/rules/`、`.cursor/commands/` | 检测到 Cursor 时的镜像 |

铺底后的分层（在**目标仓**）：

```text
法 (CLAUDE.md) → 事 (AGENTS.md) → steering/ → docs/（人类长文，非 AI 真值）
```

纯后端 / CLI / 库且无 UI 证据时，默认**跳过** `DESIGN.md`。

### `/harness-init` 做什么

在**业务仓库**里跑的一条铺底命令（不是改本协议仓）：

| 阶段 | 做什么 |
|------|--------|
| 1 Ground | 读 README、manifest、现有 `AGENTS`/`CLAUDE`、工具痕迹，形成项目画像 |
| 2 Read | 在预算内继续读证据文件 |
| 3 Draft | 在内存里起草 `AGENTS.md`（事）、`CLAUDE.md`（法）等 |
| 4 Confirm | 展示「每个文件打算怎么改」，等你回复 `yes` / `no` |
| 5 Apply | **只写**你确认过的内容；不偷偷覆盖 |

可选输出：`DESIGN.md`（有 UI 证据时）、`steering/`、Cursor 适配（已有 `.cursor/` 时）。**写入前必须你确认。**

`/harness-init` 在 `steering/` 下只会按项目证据条件式生成 `harness-recommendations.md`。`templates/steering/m5-engineering-principles.md`、`stateful-operations.md`、`karpathy-examples.md` 等是供用户选择和改写的参考规则，不会自动变成目标仓的强制协议。只有检测到真实 installer、migration、cache/build state 或 resumable job 时，才会建议 stateful operations 规则。

### 命令放在哪

**本插件仓库：** 用户面在 [`ai-ide/`](ai-ide/)（AI IDE）— `commands/` + `skills/`。

**业务仓：** slash command 放哪由你定 — `ai-ide/commands/`、`commands/`、`.cursor/commands/`、`.claude/commands/` 等，按你的 IDE 发现路径选一处。

### 需要点进看的文件

| 目的 | 文件 |
| --- | --- |
| 铺底流程真值 | [`ai-ide/skills/harness-init/SKILL.md`](ai-ide/skills/harness-init/SKILL.md) |
| 铺底命令入口 | [`ai-ide/commands/harness-init.md`](ai-ide/commands/harness-init.md) |
| 增量维护 | [`ai-ide/commands/revise-ai-docs.md`](ai-ide/commands/revise-ai-docs.md) |
| 全量审计 | [`ai-ide/skills/project-ai-docs-steward/SKILL.md`](ai-ide/skills/project-ai-docs-steward/SKILL.md) |
| 人类文档架构收敛 | [`ai-ide/skills/documentation-architecture/SKILL.md`](ai-ide/skills/documentation-architecture/SKILL.md) |

### 注意

- 写入前会展示摘要，必须你确认  
- 维护命令**不替代**业务仓自己的领域 skill（发版、支付等）  
- 改协议仓本身：clone 本仓库，维护者入口见下  

### 维护本仓库

<details>
<summary>协议仓维护者（点击展开）</summary>

| 入口 | 路径 |
| --- | --- |
| 维护者索引 | [`docs/maintainers/README.md`](docs/maintainers/README.md) |
| 贡献约定 | [`CONTRIBUTING.md`](CONTRIBUTING.md) |

```bash
改协议仓前：在**目标测试仓**跑一遍 `/harness-init`（见 CONTRIBUTING）。
```

</details>

MIT License.

---

## English

### What this is

An IDE plugin that bootstraps and maintains AI entry docs in **your target repository** — root `AGENTS.md` (facts) and `CLAUDE.md` (protocol).

Not an npm package. Not a terminal CLI. The target repo does not need `package.json`.

### Two repos — do not mix them up

| | **This repo** (harness-coding-protocol) | **Your app repo** |
|---|---|---|
| Audience | Plugin installer | Daily development |
| Read | **This README** | Root `AGENTS.md` + `CLAUDE.md` |
| AI truth | None at protocol root | `AGENTS.md` + `CLAUDE.md` |
| Long docs | `docs/maintainers/` (maintainers only) | `docs/` (human background, not AI truth) |

This repo ships the **`ai-ide/`** (AI IDE) plugin surface — commands + skills — and `templates/` reference molds. The molds preserve the full Facts/Protocol/Design model and optional steering references; `/harness-init` adapts them from target-repo evidence instead of copying placeholder bytes. They describe files produced **in your app repo**, not extra root truth files here.

### Quick start

```text
① Install plugin once  →  ② /harness-init in your app repo  →  ③ Maintenance commands
```

**① Install once (shared across Cursor, Grok, Codex, Claude Code)**

```text
/plugin marketplace add manhua-man/harness-coding-protocol
/plugin install harness-coding-protocol@harness-coding-protocol
```

Verify: `claude plugin list` shows the plugin; `/` completes all four commands in any connected IDE.

**② Bootstrap the target repo**

Open your **app repo** (not this protocol repo). Run `/harness-init` on first setup or major reset; confirm `yes` / `no`. If `AGENTS.md` and `CLAUDE.md` already exist, skip init and use maintenance commands only.

**③ Day to day**

| Command | When |
| --- | --- |
| `/revise-ai-docs` | End of session — write learnings back |
| `/project-ai-docs-steward` | Periodic audit (report first) |
| `/update-docs` | Sync human `docs/` and README (not AI truth) |

Occasional upgrade: `/plugin marketplace update harness-coding-protocol` then `/plugin update harness-coding-protocol@harness-coding-protocol`.

### What `/harness-init` does

Run in your **app repo** (not this protocol repo):

| Phase | Action |
|-------|--------|
| 1 Ground | Read README, manifests, existing entry docs, tool traces |
| 2 Read | Gather more evidence within budget |
| 3 Draft | Prepare `AGENTS.md` (facts) and `CLAUDE.md` (protocol) in memory |
| 4 Confirm | Show per-file plan; wait for `yes` / `no` |
| 5 Apply | Write **only** confirmed files |

Optional: `DESIGN.md`, `steering/`, Cursor adapters when `.cursor/` exists. **Nothing writes without your confirmation.**

Under `steering/`, `/harness-init` conditionally writes only `harness-recommendations.md` from project evidence. References such as `templates/steering/m5-engineering-principles.md`, `stateful-operations.md`, and `karpathy-examples.md` are opt-in material for users to adapt; they do not automatically become mandatory target-repo protocol. Stateful-operation guidance is suggested only when the target actually owns an installer, migration, cache/build lifecycle, resumable job, or persistent service state.

### What `/harness-init` writes

| File | Role |
| --- | --- |
| `AGENTS.md` | Facts — ports, commands, layout, modules |
| `CLAUDE.md` | Protocol — collaboration and conflict rules |
| `DESIGN.md` | Design — conditional |
| `steering/` | Scoped overrides |
| `.cursor/*` | Cursor mirror when detected |

Layer stack in the **target repo**:

```text
Protocol (CLAUDE.md) → Facts (AGENTS.md) → steering/ → docs/ (human only)
```

### Where commands live

**This plugin repo:** user surface is [`ai-ide/`](ai-ide/) — `commands/` + `skills/`.

**Your app repo:** pick one path your IDE discovers — `ai-ide/commands/`, `commands/`, `.cursor/commands/`, `.claude/commands/`, etc.

### Go deeper

| Need | Path |
| --- | --- |
| Init procedure | [`ai-ide/skills/harness-init/SKILL.md`](ai-ide/skills/harness-init/SKILL.md) |
| Init command entry | [`ai-ide/commands/harness-init.md`](ai-ide/commands/harness-init.md) |
| Incremental maintenance | [`ai-ide/commands/revise-ai-docs.md`](ai-ide/commands/revise-ai-docs.md) |
| Full audit | [`ai-ide/skills/project-ai-docs-steward/SKILL.md`](ai-ide/skills/project-ai-docs-steward/SKILL.md) |
| Human docs architecture convergence | [`ai-ide/skills/documentation-architecture/SKILL.md`](ai-ide/skills/documentation-architecture/SKILL.md) |

### Maintainers

<details>
<summary>Expand</summary>

| Entry | Path |
| --- | --- |
| Maintainer index | [`docs/maintainers/README.md`](docs/maintainers/README.md) |
| Contributing | [`CONTRIBUTING.md`](CONTRIBUTING.md) |

</details>

MIT License.
