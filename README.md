# Harness Coding Protocol

适用于 Claude Code、Cursor、Codex 等 AI 编码助手的**编码协议框架**。

## 安装

### Claude Code 插件（推荐）

```bash
claude code plugin install manhua-man/harness-coding-protocol
```

或运行 `/plugin install manhua-man/harness-coding-protocol`

### 手动安装

```bash
git clone https://github.com/manhua-man/harness-coding-protocol.git
cp -r templates/AGENTS.md /your/project/
cp -r templates/CLAUDE.md /your/project/
```

## 目录结构

```text
harness-coding-protocol/
├── .claude-plugin/          # Claude Code 插件配置
├── templates/               # 模板文件
│   ├── AGENTS.md          # 事 · Facts 模板
│   ├── CLAUDE.md          # 法 · Protocol 模板
│   ├── examples/          # 完整示例
│   ├── steering/          # 分层规则
│   └── rules/             # Cursor 规则
└── scripts/               # 安装脚本
```

## 核心概念：事 / 法 / steering

| 文件 | 汉字 | 回答什么问题 |
| ---- | ---- | ------------ |
| `AGENTS.md` | **事** | 「这个仓库是什么样」— 结构、命令、端口、模块 |
| `CLAUDE.md` | **法** | 「在这个仓库怎么做事」— 决策优先级、RIPER-5、协作习惯 |
| `steering/*.md` | 局部 override | 本路径或本任务才需要的细则 |

**AI 侧真值只认 `AGENTS` + `CLAUDE` 两份入口。**

详见 `templates/CLAUDE.md` 开头与 `templates/AGENTS.md` 开头的完整说明。

## 使用方法

### 方式一：复制到项目（推荐）

1. 复制 `templates/AGENTS.md` → 项目根目录 `AGENTS.md`，按项目填空
2. 复制 `templates/CLAUDE.md` → 项目根目录 `CLAUDE.md`，按项目填空
3. 参考 `templates/examples/` 中的完整示例

### 方式二：使用脚本

```bash
# Unix/macOS
bash scripts/apply-template.sh /path/to/project

# Windows PowerShell
powershell scripts/apply-template.ps1 /path/to/project
```

### 方式三：直接引用部分模板

只想要某个规则？直接复制对应文件即可。

## 核心原则

- **Karpathy 编码四原则**：Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven Execution
- **RIPER-5 协议**：RESEARCH → INNOVATE → PLAN → EXECUTE → REVIEW
- **决策优先级**：可测试性 > 可读性 > 一致性 > 简洁性 > 可逆性

## 自定义

复制模板后根据项目需求修改：

1. **`AGENTS.md`** — 更新项目描述、目录、端口、命令、提交规范
2. **`CLAUDE.md`** — 更新语言要求、决策优先级、RIPER-5 模式
3. **`steering/`** — 根据项目技术栈补充专题规则
4. **`.cursor/rules/`** — 根据使用的 IDE 补充规则

## 适用工具

| 工具 | 支持情况 |
| ---- | -------- |
| Claude Code | 完全支持 |
| Cursor | 部分支持（`.cursor/rules/`） |
| Codex | 完全支持 |
| 其他 MCP 工具 | 可扩展 |
