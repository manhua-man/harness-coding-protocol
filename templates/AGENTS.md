---
description: AI entry document — project facts, commands, ports, conventions
alwaysApply: true
---

# AGENTS.md（事 · Facts）

> 本文件是**事（Facts）**：回答“这个仓库是什么样”。  
> 只存放可核对的项目事实（目录结构、命令、端口、模块、接口、提交规范等）。  
> 协作方法、决策优先级、工作流规则见同级的 `CLAUDE.md`。

**仓库真值入口固定为根目录的 `AGENTS.md`、`CLAUDE.md`、`steering/`。**  
**Harness 角色**：我们是工作流的管理者与智能适配器，会在安装或 `harness setup` 时**实时检测**项目现有工具和工作流，动态生成适配钩子，不硬编码任何具体工作流。

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
| Steering rules index   | `steering/project.md`         |
| Karpathy coding examples | `steering/karpathy-examples.md` |

---

## 第三方工作流适配钩子（动态生成）

> 本章节由 **Harness Detection Engine** 在安装或 `harness setup` 时**实时扫描**项目现有工具和工作流后自动生成。  
> Harness 不提供工作流，仅负责检测、适配并给出调用方式、适用场景及与 RIPER-5 的协作指引。

<!-- HARNESS_DYNAMIC_WORKFLOW_HOOKS_START -->
<!-- 此处由 templates/auto-detect/generators/workflow-hooks.generator.ts 动态插入具体工作流表格 -->
<!-- 生成器会根据 detected-tools.json 自动填充 GSD、Superpowers、G-Talk、OpenSpec、GStack 等已检测到的工具 -->
<!-- HARNESS_DYNAMIC_WORKFLOW_HOOKS_END -->

**想引入新的工作流？**  
请在运行 `harness setup --bundle <name>` 时选择，或手动在 `.kiro/steering/` 下放置对应规则文件后重新执行检测。

---

## Detailed Rule Files

> `steering/` 只存放**局部 override**：仅针对特定路径或任务的补充规则，不重复根级事实或协议。

| Topic                          | File                          | Scope                  |
|--------------------------------|-------------------------------|------------------------|
| Karpathy coding examples       | `steering/karpathy-examples.md` | always               |

---
