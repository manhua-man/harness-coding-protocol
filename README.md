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
harness setup /your/project --mode dry-run
```

这会输出：
- 检测到的技术栈和工具
- 建议生成的配置文件 diff
- AI 工具推荐报告
- 风险等级和冲突状态

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
harness rollback /your/project/AGENTS.md
```

### Windows 用户

将上述命令中的 `bash scripts/apply-template.sh` 替换为：

```powershell
powershell -File scripts/apply-template.ps1
```

## 智能模式工作流程

1. **检测**：扫描根级真值、技术栈（React/Next/NestJS/FastAPI 等）、AI 工具痕迹
2. **生成**：创建 `AGENTS.md`、`CLAUDE.md`、`steering/` 建议和 AI 工具推荐报告
3. **预览**：输出 diff、风险等级、冲突状态
4. **应用**：根据模式决定写入策略（dry-run/confirm/silent）

## 仓库结构

```text
harness-coding-protocol/
├── .claude-plugin/
├── docs/
│   ├── architecture.md
│   ├── best-practices.md
│   ├── references.md
│   ├── tool-adaptation.md
│   └── bundles/
├── scripts/
│   ├── apply-template.ps1
│   ├── apply-template.sh
│   └── validate-template.mjs
├── templates/
│   ├── AGENTS.md
│   ├── CLAUDE.md
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

## 规则优先级

1. 用户当次明确指令
2. 仓库根目录 `AGENTS.md`
3. 仓库根目录 `CLAUDE.md`
4. 匹配的 `steering/*.md`
5. 工具适配文件和镜像

## License

MIT
