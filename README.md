# Harness Coding Protocol

让 AI 编码助手在你的仓库里先读对，再动手。

Harness Coding Protocol 是一个 **Repository AI Governance Starter Kit**：  
用一套最小但完整的根级规则，把 `AGENTS.md`、`CLAUDE.md`、`steering/` 变成 AI 协作的统一入口。

适用于 Claude Code、Codex、Cursor、Kiro 和其他 MCP-compatible 工具。

## 一句话价值

不要再把 AI 规则散落在 README、IDE 私有目录和临时说明里。  
把仓库真值收敛到根目录，让人类、AI、IDE 对“该读什么、听谁的、装完长什么样”有同一套答案。

## 你会得到什么

- 一个清晰的根级真值层：`AGENTS.md` + `CLAUDE.md` + `steering/`
- 一套可安装的 starter kit，而不是零散模板
- Cursor / Kiro 可选 adapter 镜像，但不污染规范真值
- 一条安装命令和一条校验命令，形成完整闭环
- `minimal` / `complete` 两个可直接参考的成品示例

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

工具私有目录不是规范真值层。  
`.cursor/rules/`、`.kiro/steering/` 仅作为兼容镜像，由安装脚本按需生成。

## 30 秒上手

```bash
bash scripts/apply-template.sh /your/project --with-cursor --with-kiro --example complete
node scripts/validate-template.mjs /your/project
```

装完后的仓库真值固定是：

```text
AGENTS.md
CLAUDE.md
steering/
```

## 仓库结构

```text
harness-coding-protocol/
├── .claude-plugin/
├── docs/
├── examples/
│   ├── complete/
│   └── minimal/
├── scripts/
│   ├── apply-template.ps1
│   ├── apply-template.sh
│   └── validate-template.mjs
└── templates/
    ├── adapters/
    │   ├── codex/
    │   ├── cursor/
    │   └── kiro/
    ├── root/
    │   ├── AGENTS.md
    │   └── CLAUDE.md
    └── steering/
```

## 5 分钟上手

### 方案 A：推荐安装

```bash
bash scripts/apply-template.sh /your/project --with-cursor --with-kiro --example complete
```

Windows PowerShell：

```powershell
powershell -File scripts/apply-template.ps1 C:\your\project --with-cursor --with-kiro --example complete
```

默认策略是 `--skip-existing`。如需覆盖或备份，可改用 `--overwrite` 或 `--backup`。

### 方案 B：手动复制

```bash
cp templates/root/AGENTS.md /your/project/AGENTS.md
cp templates/root/CLAUDE.md /your/project/CLAUDE.md
cp -R templates/steering /your/project/steering
```

### 方案 C：安装后校验

```bash
node scripts/validate-template.mjs /your/project
```

## 安装后会得到什么

```text
your-project/
├── AGENTS.md
├── CLAUDE.md
├── steering/
│   ├── backend.md
│   ├── frontend.md
│   ├── karpathy-examples.md
│   ├── project.md
│   └── testing.md
├── .cursor/              # 可选
│   └── rules/
└── .kiro/                # 可选
    └── steering/
```

## 规则优先级

1. User instruction
2. Repository root `AGENTS.md`
3. Repository root `CLAUDE.md`
4. Matching `steering/*.md`
5. Tool adapter files

## 支持的工具

| 工具 | 读取根级真值 | 是否需要镜像 |
|------|--------------|--------------|
| Claude Code | 是 | 否 |
| Codex | 是 | 否 |
| Cursor | 是 | 可选 |
| Kiro | 是 | 可选 |
| 其他 MCP-compatible tools | 通常是 | 视工具而定 |

## 示例项目

- `examples/minimal/`：最小可用，只展示根级双文件和一个最小 `steering/`
- `examples/complete/`：完整范式，展示根级真值、多个 steering 文件以及可选 adapter 镜像

## 设计文档

- `docs/design-principles.md`：v2 设计原则
- `docs/migration-guide-v1-to-v2.md`：从 v1 升级到 v2 的迁移说明
- `docs/compatibility-matrix.md`：工具兼容矩阵与元数据职责

## 发布元数据

- 根级 `plugin.json`：仓库分发与脚本入口元数据
- `.claude-plugin/plugin.json`：Claude Code 插件描述文件

## 许可

MIT
