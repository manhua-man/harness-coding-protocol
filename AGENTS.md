---
description: Project facts — directory structure, modules, conventions
alwaysApply: true
---

# AGENTS.md（事 · Facts）

> 本文件记录可核对的**事实**。协作协议见 `templates/CLAUDE.md` 及目标仓库根级 `CLAUDE.md`。

---

## Project Overview

- **Name**: harness-coding-protocol
- **Version**: 2.1.0
- **Type**: TypeScript (ESM), Node built-ins only at runtime
- **License**: MIT
- **Distribution**: **Git 仓库 + IDE 插件**（无 npm 包、无终端 CLI）
- **Description**: AI-driven harness protocol plugin — IDE `/harness-init` runs agent-native grounding, agent-as-writer drafting, one-confirm apply for root-truth files.
- **Product center**: Plugin + **C1 Grounding** + **C2 Agent Authoring** + **C3 Apply**
- **Onboarding**: **唯一**用户入口 = IDE **`/harness-init`**（`.claude/commands/harness-init.md` → `.claude/skills/harness-init/SKILL.md`）

---

## Capabilities

| ID | Module | Path |
|----|--------|------|
| C1 Grounding | SKILL.md (repo inspection → Grounding_Summary) | `.claude/skills/harness-init/` |
| C2 Agent Authoring | SKILL.md (Read → Judge → Draft) | `.claude/skills/harness-init/` |
| C3 Apply | SKILL.md (confirmed Draft writes) | `.claude/skills/harness-init/` |
| C4 Maintainer HRP | `runInitRecordPlan` / `runInitApplyFromPlan` | `templates/auto-detect/init-pipeline.ts` |
| C0 Plugin | commands + instructions | `.claude/commands/`, `.claude-plugin/` |

Docs: `docs/capabilities/detection.md`, `generation.md`, `apply.md`.

---

## Workspace Layout

```
harness-coding-protocol/
├── .claude-plugin/                     # 插件元数据（marketplace）
├── commands/
│   └── harness-init.md                 # 插件 slash command 入口
├── .claude/commands/
│   └── harness-init.md                 # 仓库内兼容入口
├── .claude/skills/
│   └── harness-init/                   # v2 agent-native skill
├── templates/
│   ├── AGENTS.md                       # 事 · Facts 模板
│   ├── CLAUDE.md                       # 法 · Protocol 模板
│   ├── DESIGN.md                       # 设 · Design 模板（按需）
│   └── auto-detect/
│       ├── init-pipeline.ts            # maintainer detect / recordPlan / applyFromPlan
│       ├── hash-recorded-plan.ts       # maintainer HRP 类型 + 校验
│       ├── apply-from-plan.ts          # maintainer HRP 字节级写入
│       ├── detector.ts
│       ├── installer.ts
│       ├── run-contract.ts
│       └── fixtures/                   # 6 fixture repos + golden HRP
└── docs/capabilities/
```

---

## Module Architecture

| Module | File | 职责 |
|--------|------|------|
| Init skill | `.claude/skills/harness-init/SKILL.md` | 用户路径：ground / read / draft / confirm / apply |
| Init pipeline | `init-pipeline.ts` | 维护者 API：`runInitDetect` / `runInitRecordPlan` / `runInitApplyFromPlan` |
| HRP contract | `hash-recorded-plan.ts` | 维护者 `HashRecordedPlan` 类型 + `validateHashRecordedPlan` |
| Apply writer | `apply-from-plan.ts` | 维护者 HRP 字节级写入，detector-free |
| Init command | `commands/harness-init.md` | 插件 `/harness-init` 指向 skill |
| Detector | `detector.ts` | 维护者 smoke：技术栈、框架、AI 工具痕迹 |
| Installer | `installer.ts` | 备份、回滚 |
| Run contract | `run-contract.ts` | `.harness/runs/` 产物、`createRunContext` / `persistRunArtifact` |

---

## Commands（用户）

- `/harness-init` — 仓库铺底（插件内，非终端）
- 仅检测（维护者）— `npx tsx scripts/harness-detect.mjs <path>`，无独立 slash 命令

---

## Verification

无 `package.json` / 无 vitest 测试套件。Headless smoke suite：`npx tsx scripts/smoke-suite.mjs`（6 fixture detect + property/example tests + golden HRP apply）。详见 `CONTRIBUTING.md`。

---

## Commit Guidelines

```
<type>(<scope>): <subject>
Scope: plugin | detect | apply | record-plan | installer | docs
```

---

## Documentation

| Topic | Path |
|-------|------|
| 入口 | `README.md` |
| Run contract | `docs/run-contract.md` |
| ROADMAP | `ROADMAP.md` |
