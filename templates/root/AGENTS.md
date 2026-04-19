---
description: AI entry document — project facts, commands, ports, conventions
alwaysApply: true
---

# AGENTS.md（事 · Facts）

> 本文件是**事（Facts）**：回答“这个仓库是什么样”。只放可核对的项目事实，例如目录、命令、端口、模块、接口、提交规范。协作方法与决策顺序见同级的 `CLAUDE.md`。

**仓库真值入口固定为根目录的 `AGENTS.md`、`CLAUDE.md`、`steering/`。**

---

## 与 CLAUDE.md 的分工

| 汉字 | 文件 | 职责 |
|------|------|------|
| **事** | **`AGENTS.md`（本文件）** | 布局、命令、端口、模块、端点、提交/PR 规范；索引 `steering/` 与其他文档。 |
| **法** | `CLAUDE.md` | 决策优先级、冲突解析、RIPER-5、协作习惯与输出要求。 |

---

## Project Overview

<!-- 用两三句话描述项目目标、主要用户和技术边界。 -->

## Workspace Layout

<!-- 只列真实存在、对协作有用的目录。示例：
- `apps/web/` - 前端应用
- `packages/api/` - 后端服务
- `tests/` - 自动化测试
- `steering/` - 只在局部场景生效的补充规则
-->

## Key Technologies

<!-- 示例：
- Frontend: React 19, Next.js 15, TypeScript
- Backend: Node.js, NestJS, PostgreSQL
-->

## Module Architecture

<!-- 列出主要模块及各自职责。 -->

## Service Ports

| Service | Port | Notes |
|---------|------|-------|
|         |      |       |

## Build, Test & Development Commands

<!-- 提供可直接复制执行的命令，保持与 package.json / Makefile / CI 一致。 -->

## Coding Style & Naming Conventions

<!-- 只写仓库侧可核对的约束，例如缩进、命名法、lint/formatter、类型约束。 -->

## Commit & PR Guidelines

<!-- 示例：
- Conventional Commits: `type(scope): subject`
- PR 需包含风险说明、测试结果、截图（如适用）
-->

## Configuration & Secrets

<!-- 示例：
- 环境变量模板位置
- 绝不提交 secrets
- 本地开发与生产配置的差异
-->

## Quick Reference

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
|          |        |             |

### Documentation Locations

| Topic | Path |
|-------|------|
| Project governance | `CLAUDE.md` |
| Shared examples | `steering/karpathy-examples.md` |
| Project-specific rules | `steering/project.md` |

## Detailed Rule Files

> `steering/` 只放局部 override：只写“本路径或本任务才需要”的补充规则，不重复抄写根级事实或协议。

| Topic | File | Scope |
|-------|------|-------|
| Project-level local context | `steering/project.md` | manual |
| Frontend implementation guidance | `steering/frontend.md` | file-match / manual |
| Backend implementation guidance | `steering/backend.md` | file-match / manual |
| Testing expectations | `steering/testing.md` | always / manual |
| Karpathy coding examples | `steering/karpathy-examples.md` | always |
