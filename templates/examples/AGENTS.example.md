# AGENTS.md 示例（游戏项目）

> 已填好的 `AGENTS.md` 实例，来自实际 monorepo 项目。可直接复制后按需替换。

---

## Project Overview

Full-stack game membership and payment system built with NestJS backend, Colyseus game server, React admin panels, PostgreSQL, and Redis. PNPM monorepo workspace with TypeScript throughout.

---

## Workspace Layout

PNPM workspace (see `pnpm-workspace.yaml`):

- `packages/nestjs-server/` - NestJS API server; modules in `src/modules/`, migrations in `src/migrations/`, scripts in `src/scripts/`
- `packages/colyseus-server/` - Colyseus realtime game server; rooms in `src/rooms/`, state in `src/state/`
- `packages/shared-types/` - Shared DTOs and enums; import instead of redefining shapes
- `game-operations-admin/` - Game operations React admin (Vite + React)
- `member-business-admin/` - Member management React admin (Vite + React, dev port 7374, Docker 测试 API: `http://localhost:13001/api/v1`)
- `infrastructure/` - Docker configs, environment templates, monitoring
- `test/` - Integration, E2E, and contract tests
- `docs/` - Project documentation organized by category
- `scripts/` - Repo-root ops helpers (e.g. [`scripts/manual-membership-grant.sql`](scripts/manual-membership-grant.sql) for manual membership grant after paid-but-not-fulfilled cases; read the file header SOP before running on production)

---

## Key Technologies

- **Backend**: NestJS, TypeORM, Bull (job queues), PostgreSQL, Redis
- **Frontend**: React 18, Vite, TypeScript
- **Realtime**: Colyseus game server
- **Auth**: JWT, Passport (JWT + Local strategies), bcrypt
- **Testing**: Jest, Supertest
- **DevOps**: Docker Compose, Prometheus, Grafana, Nginx

---

## Module Architecture

### Core Business Modules (`packages/nestjs-server/src/modules/`)

- `user/` - User management
- `auth/` - Authentication & authorization
- `membership/` - Membership management
- `activation-code/` - Activation code management
- `gift-code/` - Gift code management
- `payment/` - Payment system
- `order/` - Order management
- `games/` - Game business logic
- `questions/` - Question bank
- `leaderboard/` - Leaderboard
- `friendship/` - Social features

### Admin Modules (`packages/nestjs-server/src/modules/admin/`)

- `admin-core/` - Core admin functionality
- `admin-user-module/` - User management
- `admin-promotion-module/` - Promotion management
- `admin-content-module/` - Content management
- `admin-analytics-module/` - Analytics
- `admin-payment-module/` - Payment management

---

## Service Ports

| Service                           | Port     | Notes |
| --------------------------------- | -------- | ----- |
| NestJS API                        | 3000     |       |
| NestJS（Docker 测试栈宿主机映射） | **13001**| 容器内 3000；避免 Windows 保留 **3001** 导致无法 bind |
| Colyseus game server              | 2567     |       |
| Member business admin             | 7374     |       |
| Game operations admin             | 7777     |       |

---

## Build, Test & Development Commands

Use Node 18+ and PNPM 8+.

- `pnpm dev:full` - NestJS + Colyseus in watch mode
- `pnpm build` - Build all packages (`pnpm -r run build`)
- `pnpm test:ci` - Jest suite with coverage
- `pnpm test:mock` - Fast unit test loops
- `pnpm test:postgres` - Tests touching TypeORM queries
- `pnpm test:e2e` - End-to-end tests
- `pnpm test:coverage` - Coverage report
- `pnpm lint:check` - ESLint check
- `pnpm docker:dev` / `pnpm docker:stop` - Docker stack management
- `pnpm docker:refresh-nestjs` - 本地 `build:nestjs` 后 **强制重建容器**（不 `--build` 镜像；`dist` 变更常用）。测试栈内 Nest 从挂载文件读取配置：**容器路径** `/app/infrastructure/config/environments/test.env`（对应宿主机 `infrastructure/config/environments/test.env`）；**改该文件后需 recreate Nest 容器**进程才会重读
- `pnpm docker:rebuild-nestjs:test` - 先 `docker compose ... build nestjs-server` 再 refresh（改 **Dockerfile / lock / 依赖** 时用）
- `pnpm docker:refresh-nestjs:prod` - 重建 `game-nestjs:latest` 镜像并 `up -d --force-recreate` **生产 compose** 中的 Nest 容器

---

## Coding Style & Naming Conventions

- TypeScript-first; two-space indent, single quotes, semicolons (Prettier)
- Strict types: explicit return types on functions, avoid `any` unless necessary
- NestJS artifacts: PascalCase suffixes (`UserModule`, `GiftCodeService`)
- NestJS patterns: Controllers → routing, Services → business logic; always constructor DI, never `new Class()`
- Error handling: `HttpException` + custom `ExceptionFilter`; DTOs with `class-validator`
- Folders: kebab-case (`admin-payment-module`)
- Private fields: `m_PascalCase`; local variables: `t_PascalCase`
- Path aliases: `@shared/types`, `@modules/*`
- Lint rules in `.eslintrc.js`; fix warnings or document suppressions

---

## Commit & PR Guidelines

- Conventional Commits: `type(scope): subject` (under 72 chars)
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- PRs: link issue, describe risk, list test commands, include screenshots for UI

---

## Configuration & Secrets

- Never commit secrets; use `infrastructure/config/templates/*.env.template`
- `pnpm config:setup` to copy templates, `pnpm config:verify` before shipping
- Test env: `infrastructure/config/environments/test.env`
- Production env: `infrastructure/config/environments/production.env`

---

## Runtime Context & Integration Notes

- NestJS stack: PostgreSQL, Redis, JWT auth, WebSocket realtime; DI, thin controllers, service-layer business logic
- Auth/UOS entrypoints: `/api/v1/auth/uos/login`, `/api/v1/auth/membership/me`, `/api/v1/auth/refresh`, `/api/v1/inbox/send-welcome`（客户端）, `/api/v1/inbox/send-custom`（**管理员 JWT**）
- Key files: `auth-uos.controller.ts`, `auth.service.ts`, `uos.service.ts` (in `packages/nestjs-server/src/modules/`)
- User identity: prefer UOS user API data > client persona displayName > generated username; `originalIdentifier + productSource` is the unique key
- Logging: functional logs only, no emojis
- WeChat SDK (wechatpay-node-v3 ^2.2.1): `client.query` supports both `transaction_id` and `out_trade_no`

---

## Quick Reference

### API Endpoints

- Swagger (Game): `http://localhost:3000/api/docs/game`
- Swagger (Admin): `http://localhost:3000/api/docs/admin`
- Game login: `POST /api/v1/auth/login`
- Admin login: `POST /api/v1/admin/auth/login`
- Health check: `http://localhost:3000/health`

### Test Accounts

- Game user: `test@example.com` / `Password123!`
- Admin user: `admin@company.com` / `Password123!`

### Monitoring

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:9003` (admin/admin123)
- AlertManager: `http://localhost:9093`

### Documentation Locations

| Topic | Path |
|-------|------|
| Architecture | `docs/02-项目架构/` |
| Development guides | `docs/04-开发指南/` |
| Deployment | `docs/05-运维部署/` |
| Problem solving | `docs/04-开发指南/问题排查/` |

---

## Docker Environment Strategy

Always use **test environment** for development (`docker-compose.test.yml`):

- Test DB: `game_server_test` on port **5433**
- Test Redis: port **6380**
- Isolated from production data, safe for data resets

Production environment (`docker-compose.yml`) only for deployment.

### Local Docker vs production SSH (how to choose)

- **Primary rule: follow the task, not the Git branch.** Local test stack is for anything that can be done safely on copies of data; production SSH is only when the live host or production data/config is required.
- **Use local test stack** (`docker-compose.test.yml`, API `http://localhost:13001`, DB **5433**, Redis **6380**): feature work, `pnpm test:*`, TypeORM migrations against test DB, admin UI against test API, debugging without touching prod.
- **Use SSH to production** (`114.55.236.170`): deploy or server-only ops, inspect/fix **production** DB, production logs, TLS/certs, cron/backup on the host, or other tasks that explicitly name production.

**Optional mnemonic (imperfect):** some people use *"on `main` I might SSH for release/ops; on any other branch default to local"* as a memory aid. It is **not** a safe automatic rule: you can be on `main` and still only use local Docker until you intentionally deploy or operate prod; conversely hotfixes on a branch might still need SSH. When unsure, default to **local** and confirm before SSH.

### Production server (SSH + PostgreSQL)

- Host: `114.55.236.170`
- SSH: `ssh -i ~/.ssh/game_server_key root@114.55.236.170` (Windows: use your key path, e.g. `C:/Users/<you>/.ssh/game_server_key`)
- After login, interactive DB shell: `docker exec -it game_postgres_dev psql -U gameserver -d game_server_dev`

More context: `infrastructure/README.md` (cloud DB init), `docs/05-运维部署/`.

Standard startup:

```
cd E:\project\servers
docker-compose -f infrastructure/docker-compose.test.yml up -d
cd member-business-admin && npm run dev   # Frontend on port 7374
docker ps && curl http://localhost:13001/api/v1/health
```

---

## AI 助手工具索引

### OpenSpec 变更管理（CLI + Claude Code Skill）

| 场景 | 命令 |
| -------------------- | ----------------------------------------- |
| 初始化项目           | `openspec init`                           |
| 创建新变更           | `openspec new change <name>`              |
| 查看变更列表         | `openspec list`                           |
| 查看变更状态         | `openspec status --change <name>`         |
| 查看 schema          | `openspec schemas`                        |
| 探索需求（思考伙伴） | Claude Code 中使用 `/opsx:explore`        |
| 开始实现             | Claude Code 中使用 `/opsx:apply`          |
| 归档完成变更         | Claude Code 中使用 `/opsx:archive`        |
| 快速创建完整提案     | Claude Code 中使用 `/opsx:propose <描述>` |

### GStack 技能（Claude Code Skill）

| 场景            | 命令                  | 用途                                |
| --------------- | --------------------- | ----------------------------------- |
| YC 风格产品讨论 | `/office-hours`       | 六问 forcing questions 探索产品想法 |
| 系统性 Bug 调试 | `/investigate <问题>` | 根因分析，分四阶段调查              |
| 发版流程        | `/ship`               | 检测、合并、测试、review、发版      |
| PR 代码审查     | `/review`             | diff 审查、SQL 安全、测试覆盖       |
| 性能基准测试    | `/benchmark`          | 性能回归检测                        |
| 浏览器 QA       | `/browse` 或 `/qa`    | 真实页面交互测试                    |
| 设计评审        | `/design-review`      | 视觉一致性、间距、层级检查          |
| 架构评审        | `/plan-eng-review`    | 架构与测试验证                      |
| CEO/产品评审    | `/plan-ceo-review`    | 战略与 scope 重新思考               |
| 保存检查点      | `/checkpoint`         | 保存工作状态用于恢复                |

---

## Detailed Rule Files

For specific operational guidelines, see the steering files in `.kiro/steering/`:

| Topic                               | File                     | Scope |
| ----------------------------------- | ------------------------ | ----- |
| TypeScript / Jest / TDD conventions | `typeserver.md`          | always |
| Docker & database operations        | `ops-docker-database.md` | always |
| Domain knowledge (payment, membership, cloud) | `domain-knowledge.md` | manual |
| Development philosophy              | `generalbeliefs.md`      | manual |
| Chat summary (manual)               | `after_each_chat.md`     | manual |
