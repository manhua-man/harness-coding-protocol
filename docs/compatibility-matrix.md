# 兼容矩阵

## AI 工具兼容性

| Tool | 读取根级真值 | 需要 adapter 镜像 | 安装产物 | 说明 |
|------|--------------|------------------|---------|------|
| Claude Code | 是 | 否 | `AGENTS.md`, `CLAUDE.md`, `steering/` | 直接读取仓库真值 |
| Codex | 是 | 否 | `AGENTS.md`, `CLAUDE.md`, `steering/` | 直接读取仓库真值 |
| Cursor | 是 | 可选 | `.cursor/rules/` | adapter 只做兼容提醒，不覆盖根级真值 |
| Kiro | 是 | 可选 | `.kiro/steering/` | adapter 是对根级 `steering/` 的镜像 |
| Other MCP-compatible tools | 通常是 | 视工具而定 | 视情况而定 | 优先先接根级真值，再考虑镜像 |

## 规则优先级

1. User instruction
2. Repository root `AGENTS.md`
3. Repository root `CLAUDE.md`
4. Matching `steering/*.md`
5. Tool adapter files

## 元数据文件职责

| File | Role |
|------|------|
| `plugin.json` | 仓库分发、打包与脚本入口元数据 |
| `.claude-plugin/plugin.json` | Claude Code 插件描述 |
| `.claude-plugin/marketplace.json` | Claude Code 市场展示信息 |
