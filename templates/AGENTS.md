---
description: AI entry document — project facts, commands, ports, conventions
alwaysApply: true
---

# AGENTS.md（事 · Facts）

> 本文件是**事（Facts）**：回答“这个仓库是什么样”。  
> 只存放可核对的项目事实（目录结构、命令、端口、模块、接口、提交规范等）。  
> 协作方法、决策优先级、工作流规则见同级的 `CLAUDE.md`。

**仓库真值入口固定为根目录的 `AGENTS.md`、`CLAUDE.md`、`steering/`。如项目包含 UI、品牌、体验或 DX 设计约束，使用 `DESIGN.md` 记录“设”。**
**Harness 角色**：Harness 是 IDE 插件 + AI 编排的根级铺底协议。在目标仓库内运行 `/harness-init`，由 Agent 检测项目现状、生成最少但更正确的真值文件，并在用户最小确认后落盘——不是终端 CLI，也不发布 npm 包。

---

## 与 CLAUDE.md / DESIGN.md 的分工

| 汉字 | 文件          | 职责 |
|------|---------------|------|
| **事** | **`AGENTS.md`（本文件）** | 布局、命令、端口、模块、端点、提交/PR 规范；索引 `steering/` 与其他文档 |
| **法** | `CLAUDE.md`   | 决策优先级、冲突解析、RIPER-5、协作习惯与输出要求 |
| **设** | `DESIGN.md`（按需） | 产品气质、视觉 token、布局、组件、动效、文案、品牌与体验反模式 |

---

## Project Overview

<!-- 用 2-3 句话简述项目目标、主要用户和技术边界（由生成器或用户填写） -->

## Workspace Layout

<!-- 只列真实存在、对协作有用的目录（由生成器自动检测并填充） -->

## Key Technologies

<!-- 自动识别到的技术栈（由 Agent Grounding 填充） -->

## Module Architecture

<!-- 主要模块及各自职责（可手动补充或由生成器填充） -->

## Service Ports

| Service | Port | Notes |
|---------|------|-------|
|         |      |       |

## Build, Test & Development Commands

<!-- 可直接复制执行的命令，保持与 `package.json` / Makefile / CI 一致（由生成器同步） -->

## Coding Style & Naming Conventions

<!-- 仓库侧可核对的约束（缩进、命名法、lint/formatter、类型约束等） -->

## Commit & PR Guidelines

<!-- 示例：
- Conventional Commits: `type(scope): subject`
- PR 需包含风险说明、测试结果、截图（如适用）
-->

## Configuration & Secrets

<!-- 环境变量模板、secrets 保护规则、本地与生产配置差异等 -->

## Quick Reference

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
|          |        |             |

### Documentation Locations

| Topic                  | Path                          |
|------------------------|-------------------------------|
| Project governance     | `CLAUDE.md`                   |
| Design system          | `DESIGN.md`                   |
| Steering rules index   | `steering/`                   |
| Karpathy coding examples | `steering/karpathy-examples.md` |

---

## 第三方 AI 工具适配建议（动态生成）

> 本章节由 `/harness-init` 的 **Agent Grounding** 阶段基于项目现有技术栈、AI 工具痕迹和根级真值生成。
> Harness 不默认安装第三方工具，仅负责读取、推荐、解释并给出可审查的适配钩子。

_Agent 在 Phase 2–3 基于 Grounding_Summary 和已读证据在此插入工作流推荐表格。_

**想引入新的工作流？**  
请先在 IDE 中运行 `/harness-init` 查看检测、计划与推荐 diff，再决定是否把建议合并到根级真值或工具兼容层。

---

## Detailed Rule Files

> `steering/` 只存放**局部 override**：仅针对特定路径或任务的补充规则，不重复根级事实或协议。

| Topic                          | File                          | Scope                  |
|--------------------------------|-------------------------------|------------------------|
| Karpathy coding examples       | `steering/karpathy-examples.md` | always               |

---
