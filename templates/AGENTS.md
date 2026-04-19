---
description: AI entry document — project facts, commands, ports, conventions
alwaysApply: true
---

# AGENTS.md（事 · Facts）

> 本文件是**事（Facts）**：*「这个仓库是什么样」* — 结构、命令、端口、模块、API 端点、可核对规范。**法（Protocol）**见同级的 `CLAUDE.md`。

**AI 侧真值只认 `AGENTS`（事）+ `CLAUDE`（法）两份入口。**

---

## 与 CLAUDE.md 的分工

| 汉字 | 文件 | 职责 |
|------|------|------|
| **事** | **`AGENTS.md`（本文件）** | 布局、命令、端口、模块、端点、提交/PR 规范；用表格索引 `docs/` 与 steering。 |
| **法** | `CLAUDE.md` | 决策优先级、RIPER-5、会话协议、输出习惯；**不**复制本文件的事实表。 |

---

## Project Overview

<!-- 简述项目是什么、技术栈。两三句话即可。-->

## Workspace Layout

<!-- 目录与各目录职责。示例：
- `src/` - 主源码
- `tests/` - 测试
- `docs/` - 文档（人类阅读，AI 参考非真值）
-->

## Key Technologies

<!-- 核心技术栈列表。示例：
- Backend: Node.js, NestJS
- Database: PostgreSQL, Redis
-->

## Module Architecture

<!-- 模块列表及各自职责。-->

## Service Ports

| Service | Port | Notes |
|---------|------|-------|
|         |      |       |

## Build, Test & Development Commands

<!-- 可直接复制的命令，与 package.json / CI 保持一致。示例：
- `pnpm dev` - 开发模式
- `pnpm test` - 运行测试
-->

## Coding Style & Naming Conventions

<!-- 可在仓库侧核对的写法规范：Prettier/ESLint 配置、命名约定等。示例：
- TypeScript: strict types, explicit return types
- 文件命名: kebab-case
-->

## Commit & PR Guidelines

<!-- 提交格式、PR 要求。示例：
- Conventional Commits: `type(scope): subject`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
-->

## Configuration & Secrets

<!-- 配置管理、敏感信息处理方式。示例：
- 环境变量模板: `.env.template`
- 禁止提交 secrets
-->

## Quick Reference

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
|          |        |             |

### Documentation Locations

| Topic | Path |
|-------|------|
|       |      |

## Detailed Rule Files

> steering = 局部 override：只写「本路径或本任务才需要」的细则；**不**重复抄写全局事/法。

| Topic | File | Scope |
|-------|------|-------|
| <!-- 例：TS 规范 --> | <!-- `.kiro/steering/…` --> | <!-- always / file-match / manual --> |
