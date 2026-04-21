# Harness Coding Protocol

让 AI 编码环境先理解仓库，再生成最少但更正确的配置。

Harness Coding Protocol 是一个 **根级真值优先的 AI 编码生态适配器**。它现在同时提供两条路径：

- **静态模式**：复制 `AGENTS.md`、`CLAUDE.md`、`steering/`，快速建立仓库真值。
- **智能模式**：检测目标仓库，生成配置建议、推荐报告和 diff 预览，再按模式决定是否写入。

智能模式不会自动安装第三方工具，也不会默认覆盖用户配置；它的默认姿态是检测、推荐、预览、增量合并和可回滚。

## 核心模型

| 层级 | 路径 | 作用 |
|------|------|------|
| 事实层 | `AGENTS.md` | 项目结构、命令、端口、端点、约定等可核对事实 |
| 协议层 | `CLAUDE.md` | 决策优先级、冲突处理、协作规则 |
| 局部覆盖 | `steering/*.md` | 针对路径、技术栈或任务的补充规则 |

工具私有目录可以做兼容镜像，但不能反过来成为仓库真值源。

## 快速开始

### 安装 Harness

#### 方式 1：通过 Claude Code Plugin 安装（推荐）

在 Claude Code 中执行：

```bash
/plugin marketplace add ManHua/harness-coding-protocol
/plugin install harness-coding-protocol
```

安装后可直接使用 CLI 命令：

```bash
harness setup /your/project --mode dry-run
```

#### 方式 2：从源码安装（开发者）

```bash
git clone https://github.com/ManHua/harness-coding-protocol.git
cd harness-coding-protocol
npm install
npm run build
```

### 推荐：智能预览模式（先看后决定）

```bash
# 检测项目并预览建议，不写入任何文件
harness detect /your/project
harness plan /your/project --from-run <run-id>
```

这会输出：
- 简洁的终端摘要
- `.harness/runs/<run-id>/summary.md`
- `.harness/runs/<run-id>/plan.json`
- `.harness/runs/<run-id>/diff.patch`
- `.harness/runs/<run-id>/recommendations.md`

确认后执行：

```bash
harness apply /your/project --plan <run-id> --backup
```

### 其他使用场景

#### 场景 1：快速复制模板（静态模式）

```bash
bash scripts/apply-template.sh /your/project
```

#### 场景 2：智能模式 + 交互确认

```bash
harness setup /your/project --mode confirm
```

#### 场景 3：自动写入低风险变更

```bash
harness setup /your/project --mode silent --backup
```

#### 场景 4：只检测不生成

```bash
harness detect /your/project
```

#### 场景 5：回滚到备份

```bash
harness rollback /your/project
```

#### 场景 6：诊断 run artifact

```bash
harness doctor /your/project
```

## CLI 契约

核心命令是：

```text
harness detect [target]
harness plan [target] [--from-run <run-id>]
harness apply [target] --plan <run-id> [--backup]
harness rollback [target]
harness doctor [target]
harness setup [target] [--mode confirm|silent|dry-run] [--yes]
```

每次运行都会写入 `.harness/runs/<run-id>/`。默认 stdout 保持简洁，详细内容写入 artifact；`--json` 输出单行机器可读摘要。`setup --mode confirm` 在 TTY 里会显示交互式确认和变更多选；非 TTY 环境需要传 `--yes` 或改用 `--mode silent`。

稳定 exit codes：

| Code | Meaning |
| --- | --- |
| 0 | success |
| 1 | detection failed |
| 2 | plan failed |
| 3 | apply failed |
| 4 | user cancelled |
| 5 | conflict detected |
| 6 | invalid input |

## Claude Code Adapter

仓库提供薄 Claude 适配层：

```text
.claude/commands/harness-detect.ts
.claude/commands/harness-setup.ts
```

适配层只做三件事：

- 调用 `harness detect/plan/apply --json`
- 读取 `.harness/runs/<run-id>/summary.md` 和 `plan.json`
- 把 artifact 翻译成 Claude 可展示的简短消息

它不会重新计算 detection、plan、risk 或 diff。确认应用由调用方传入 `confirmApply` 决定；未确认时只返回预览。

## Cursor Adapter

Cursor 适配层按 Cursor 的习惯提供规则和命令模板：

```text
.cursor/rules/harness-artifacts.mdc
.cursor/commands/harness-detect.md
.cursor/commands/harness-setup.md
```

这些文件只负责引导 Cursor 调用 `harness detect/plan/apply --json`，再读取 `.harness/runs/<run-id>/` 里的 artifact。Cursor 不重新计算 detection、plan、risk、recommendations 或 diff。

静态安装时可使用：

```bash
bash scripts/apply-template.sh /your/project --with-cursor
```

智能模式检测到 Cursor 后，也会把 `.cursor/rules/harness.mdc` 和 `.cursor/commands/harness-*.md` 作为 plan 变更写入 `plan.json` 与 `diff.patch`，等待用户确认后再 apply。

### Windows 用户

将上述命令中的 `bash scripts/apply-template.sh` 替换为：

```powershell
powershell -File scripts/apply-template.ps1
```

## 智能模式工作流程

1. **检测**：扫描根级真值、技术栈（React/Next/NestJS/FastAPI 等）、AI 工具痕迹
2. **计划**：创建 `plan.json`、`summary.md`、`diff.patch` 和精简推荐摘要
3. **应用**：只读取已保存的 `plan.json`，根据模式决定写入策略（dry-run/confirm/silent）
4. **回滚/诊断**：通过 `result.json` 和 `doctor` 检查最近运行状态

## 仓库结构

```text
harness-coding-protocol/
├── .claude-plugin/
├── docs/
│   ├── architecture.md
│   ├── best-practices.md
│   ├── references.md
│   ├── run-contract.md
│   ├── tool-adaptation.md
│   └── bundles/
├── scripts/
│   ├── apply-template.ps1
│   ├── apply-template.sh
│   └── validate-template.mjs
├── templates/
│   ├── AGENTS.md
│   ├── CLAUDE.md
│   ├── adapters/
│   ├── steering/
│   └── auto-detect/
├── package.json
└── plugin.json
```

## 推荐 Bundles

`docs/bundles/` 里提供 5 个推荐包：

- Planning / Review
- MCP Productivity
- Frontend Excellence
- TDD + Quality
- Browser / Web Verification

这些 bundle 是推荐组合，不是自动安装清单。

## 参考与归因

`docs/references.md` 记录社区参考项目的 verified / partial 状态。Harness 当前没有复用外部项目代码；如果未来引入具体实现，需要先做许可审查并在实现处署名。

## 更多文档

- `docs/architecture.md`：整体架构、命令职责和 adapter 边界
- `docs/run-contract.md`：run artifact 目录、manifest、plan/result schema、stdout 和 exit code 契约
- `docs/tool-adaptation.md`：Claude、Cursor、Kiro 等工具适配边界

## 规则优先级

1. 用户当次明确指令
2. 仓库根目录 `AGENTS.md`
3. 仓库根目录 `CLAUDE.md`
4. 匹配的 `steering/*.md`
5. 工具适配文件和镜像

## License

MIT
