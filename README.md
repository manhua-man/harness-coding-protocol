# Harness Coding Protocol

让 AI 编码助手在你的仓库里先读对，再动手。

Harness Coding Protocol 是一个 **Repository AI Governance Starter Kit**：
用一套最小但完整的根级规则，把 `AGENTS.md`、`CLAUDE.md`、`steering/` 变成 AI 协作的统一入口。

适用于 Claude Code、Codex、Cursor、Kiro 和其他 MCP-compatible 工具。

## 一句话价值

不要再把 AI 规则散落在 README、IDE 私有目录和临时说明里。
把仓库真值收敛到根目录，让人类、AI、IDE 对"该读什么、听谁的、装完长什么样"有同一套答案。

## 你会得到什么

- 一个清晰的根级真值层：`AGENTS.md` + `CLAUDE.md` + `steering/`
- 一套可安装的 starter kit，而不是零散模板
- 一条安装命令和一条校验命令，形成完整闭环
- 内置 `karpathy-examples.md` 等通用 steering 示例

## 它解决什么问题

- AI 不清楚仓库事实应该从哪里读取
- AI 容易在多工具环境里被分散规则误导
- README、模板、安装脚本一旦口径不一致，就会造成使用漂移

## 适合什么场景

- 你想给仓库加一套 AI 协作规则，但不想引入复杂框架
- 你已经在同时使用 Claude Code、Codex、Cursor 或 Kiro
- 你希望根级规范和工具兼容层分开维护
- 你希望新项目 10 分钟内装好，老项目也能逐步接入

## 核心模型

| 层级 | 路径 | 作用 |
|------|------|------|
| 事实层 | `AGENTS.md` | 记录项目结构、命令、接口、端口、提交规范等可核对事实 |
| 协议层 | `CLAUDE.md` | 记录决策优先级、冲突解析、RIPER-5、协作方式 |
| 局部覆盖 | `steering/*.md` | 为特定路径、技术栈或任务补充局部规则 |

## 30 秒上手

### 安装插件（推荐）

在 Claude Code 中运行：

```
/plugin install manhua-man/harness-coding-protocol
```

安装后运行校验：

```bash
node scripts/validate-template.mjs /your/project
```

装完后的仓库真值固定是：

```
AGENTS.md
CLAUDE.md
steering/
```

### 手动安装（不使用插件）

```bash
bash scripts/apply-template.sh /your/project
```

Windows PowerShell：

```powershell
powershell -File scripts/apply-template.ps1 C:\your\project
```

默认策略是 `--skip-existing`。如需覆盖或备份，可改用 `--overwrite` 或 `--backup`。

## 仓库结构

```
harness-coding-protocol/
├── .claude-plugin/        # Claude Code 插件配置
├── .gitignore
├── LICENSE
├── README.md
├── ROADMAP.md
├── plugin.json            # 仓库分发与脚本入口元数据
├── scripts/               # 安装脚本
│   ├── apply-template.sh
│   ├── apply-template.ps1
│   └── validate-template.mjs
└── templates/
    ├── AGENTS.md          # 事实层模板
    ├── CLAUDE.md          # 协议层模板
    └── steering/
        └── karpathy-examples.md   # Karpathy 风格编码示例
```

## 安装后会得到什么

```
your-project/
├── AGENTS.md
├── CLAUDE.md
└── steering/
    └── karpathy-examples.md   # 可按需补充 project.md、frontend.md 等
```

## 规则优先级

1. 用户当次明确指令
2. 仓库根目录 `AGENTS.md`
3. 仓库根目录 `CLAUDE.md`
4. 匹配的 `steering/*.md`
5. 工具适配文件（仅做兼容，不覆盖真值）

## 支持的工具

| 工具 | 读取根级真值 |
|------|-------------|
| Claude Code | 是 |
| Codex | 是 |
| Cursor | 是 |
| Kiro | 是 |
| 其他 MCP-compatible tools | 通常是 |

## 许可

MIT
