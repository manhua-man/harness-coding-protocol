# Harness Coding Protocol

让 AI 编码 Agent 用一个 IDE 命令给任意仓库完成协作铺底。

在目标仓库里运行 **`/harness-init`**，Agent 会先读真实项目文件，再起草根级协作文件，最后只在你确认后写入磁盘。

这不是 npm 包，也不是终端 CLI。普通使用者不需要 `npm install`，不需要 `npx`，目标仓库也不需要有 `package.json`。

## 你会得到什么

`/harness-init` 会根据仓库证据决定创建、更新或跳过这些文件：

| 文件 | 作用 | 什么时候生成 |
| --- | --- | --- |
| `AGENTS.md` | 事：项目事实、目录、命令、技术栈、模块 | 默认处理 |
| `CLAUDE.md` | 法：协作协议、决策顺序、冲突处理、工作习惯 | 默认处理 |
| `DESIGN.md` | 设：UI、品牌、产品体验、文案、设计 token、DX 体验 | 有 UI / 产品体验 / 品牌 / 组件库 / 文档站 / 插件界面 / DX 设计证据，或你明确要求时 |
| `steering/harness-recommendations.md` | 局部补充规则 | 有项目特定建议时 |
| `.cursor/rules/`、`.cursor/commands/` | Cursor 规则和 `/harness-init` 镜像 | 检测到 Cursor 配置时 |

如果是纯后端、库、CLI、infra 或数据管线项目，且没有设计面证据，Agent 会在摘要里把 `DESIGN.md` 标为 `skip`，不会生成空泛模板。

## 使用流程

1. 克隆本仓库。

   ```bash
   git clone https://github.com/manhua-man/harness-coding-protocol.git
   ```

2. 在 AI IDE 中把本仓库作为插件或技能来源。

   - Claude Code：通过 `.claude-plugin/` 发现命令。
   - Cursor / Codex / Antigravity / opencode / Hermes：把 [`.claude/skills/harness-init/SKILL.md`](.claude/skills/harness-init/SKILL.md) 作为执行流程交给 Agent。

3. 打开你真正想初始化的目标仓库。

4. 在 IDE 中运行：

   ```text
   /harness-init
   ```

5. Agent 会执行五个阶段：

   1. **Ground**：读取 README、manifest、配置、现有 AI 工具痕迹、项目结构。
   2. **Read**：读取已有 root-truth 文件和必要证据。
   3. **Judge & Draft**：在内存中判断每个文件该 create / patch-section / overwrite / skip。
   4. **Show & Confirm**：只展示一行一个文件的摘要，并问一次 `yes` / `no`。
   5. **Apply**：只有你回复 `yes` 后，才写入确认过的 Draft 字节。

## 安全边界

- 不会在确认前写入 root-truth 文件。
- 不会要求你运行终端 `harness` 命令。
- 不会要求目标仓库安装 Node.js、npm、tsx 或本项目依赖。
- 不会把 `.harness/runs/` 作为用户路径的必要产物。
- `patch-section` 只改目标 `##` section，保留 section 外用户内容。
- `steering/harness-recommendations.md` 和 `DESIGN.md` 都是条件型目标，不会为了凑文件而生成空内容。

## 支持的 Agent

核心流程是 Agent-native：只要 Agent 能读写目标仓库文件，就可以执行。

| Agent | 使用方式 |
| --- | --- |
| Claude Code | 安装为插件，运行 `/harness-init` |
| Cursor | 让 Agent 按 `SKILL.md` 执行 |
| Codex | 同 Cursor |
| Antigravity | 同 Cursor |
| opencode | 同 Cursor |
| Hermes | 同 Cursor |

`.claude-plugin/` 和 `.claude/skills/` 只是 Claude Code 的发现层；协议本身不绑定单一 IDE。

## 什么时候会生成 DESIGN.md

会生成或更新：

- 目标仓库已有 `DESIGN.md`。
- 你明确要求设计系统、UI 规范、品牌规范、产品体验或 DX 设计入口。
- Agent 读到前端 UI、移动端 UI、游戏 UI、文档站、浏览器扩展、IDE/插件界面、设计系统、组件库、Storybook、视觉资源、CSS/theme tokens、截图等证据。

会跳过：

- 纯后端服务。
- 通用库。
- CLI 工具。
- infra / IaC 仓库。
- 数据管线。
- 没有设计面证据的未知项目。

## 维护者验证

普通使用者不需要运行这些命令。维护者修改 detector / HRP / apply 内部实现时，可以运行：

```bash
npx tsx scripts/smoke-suite.mjs
npx tsx scripts/harness-detect.mjs templates/auto-detect/fixtures/node-monorepo
```

当前 smoke suite 覆盖：

- 6 个 fixture 的 detection。
- HRP schema / apply round-trip / failure continuation / backup / no-HRP-no-write 等 property tests。
- `SKILL.md` 静态 guard，包括条件型 `DESIGN.md` 行为。
- golden HRP apply round-trip。

## 文档入口

- [`.claude/skills/harness-init/SKILL.md`](.claude/skills/harness-init/SKILL.md)：用户路径权威。
- [docs/architecture.md](docs/architecture.md)：系统形状。
- [docs/run-contract.md](docs/run-contract.md)：行为契约。
- [docs/capabilities/](docs/capabilities/)：C1 Grounding、C2 Agent Authoring、C3 Apply。
- [CONTRIBUTING.md](CONTRIBUTING.md)：维护者贡献与验证规则。

License: MIT.
