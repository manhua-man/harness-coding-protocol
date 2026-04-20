---
description: AI entry document — project facts, commands, ports, conventions
alwaysApply: true
---

# AGENTS.md（事 · Facts）

> 本文件是**事（Facts）**：回答“这个仓库是什么样”。  
> 只存放可核对的项目事实（目录结构、命令、端口、模块、接口、提交规范等）。  
> 协作方法、决策优先级、工作流规则见同级的 `CLAUDE.md`。

**仓库真值入口固定为根目录的 `AGENTS.md`、`CLAUDE.md`、`steering/`。**  
**Harness 角色**：Harness 是 AI 编码环境的全栈生态适配器，会在安装或 setup 阶段检测项目现状，生成最少但更正确的配置建议，不把工具私有目录提升为真值源。

---

## 与 CLAUDE.md 的分工

| 汉字 | 文件          | 职责 |
|------|---------------|------|
| **事** | **`AGENTS.md`（本文件）** | 布局、命令、端口、模块、端点、提交/PR 规范；索引 `steering/` 与其他文档 |
| **法** | `CLAUDE.md`   | 决策优先级、冲突解析、RIPER-5、协作习惯与输出要求 |

---

## Project Overview

<!-- 用 2-3 句话简述项目目标、主要用户和技术边界（由生成器或用户填写） -->

## Workspace Layout

<!-- 只列真实存在、对协作有用的目录（由生成器自动检测并填充） -->

## Key Technologies

<!-- 自动检测到的技术栈（由 Detection Engine 填充） -->

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
| Steering rules index   | `steering/`                   |
| Karpathy coding examples | `steering/karpathy-examples.md` |

---

## 第三方 AI 工具适配建议（动态生成）

> 本章节由 **Harness Detection Engine** 在智能 setup 时扫描项目现有技术栈、AI 工具痕迹和根级真值后生成。
> Harness 不默认安装第三方工具，仅负责检测、推荐、解释并给出可审查的适配钩子。

<!-- HARNESS_DYNAMIC_WORKFLOW_HOOKS_START -->
<!-- 此处由 templates/auto-detect/generators/ecosystem-recommender.generator.ts 动态插入推荐表格 -->
<!-- 生成器会根据 detected-tools.json 推荐 Workflows、Skills、Hooks、Subagents、MCP、Plugins、Memory 等能力 -->
<!-- HARNESS_DYNAMIC_WORKFLOW_HOOKS_END -->

**想引入新的工作流？**  
请先运行智能检测查看推荐理由和 diff，再决定是否把建议合并到根级真值或工具兼容层。

---

## Detailed Rule Files

> `steering/` 只存放**局部 override**：仅针对特定路径或任务的补充规则，不重复根级事实或协议。

| Topic                          | File                          | Scope                  |
|--------------------------------|-------------------------------|------------------------|
| Karpathy coding examples       | `steering/karpathy-examples.md` | always               |

---
