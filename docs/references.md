# 文档索引

本文件是导航索引，不定义任何协议行为。

## 权威文档

- `docs/architecture.md`：系统形状、所有权边界、评审支撑的架构。
- `docs/run-contract.md`：合规编码运行所要求的行为；末尾的"操作准则附录"把契约转化为日常动作。
- `docs/tool-adaptation.md`：harness 与工具的能力映射与降级规则。
- `docs/agent-triggering.md`：onboarding 入口、规则收口与冲突解决顺序。
- `docs/capabilities/detection.md`、`docs/capabilities/generation.md`、`docs/capabilities/apply.md`：C1–C3 能力契约。

## 分发面

- `docs/bundles/README.md`：bundle 职责、共享权威与映射、能力矩阵模板。
- `docs/bundles/claude-code.md`：Claude Code 风格的仓库代理。
- `docs/bundles/codex-cli.md`：Codex 风格的 CLI 或桌面编码代理。
- `docs/bundles/cursor.md`：Cursor 或 Cursor 风格的 IDE 代理。
- `docs/bundles/gemini-cli.md`：Gemini CLI 或 Gemini 风格的终端编码代理。
- `docs/bundles/opencode.md`：OpenCode 或 OpenCode 风格的编码代理。
- `docs/bundles/scenarios.md`：工作流场景包（TDD + 质量、计划 + 评审、前端打磨、浏览器/Web 验证）。
- `docs/benchmarks/agent-native-init.md`：agent-native `/harness-init` 的体验与质量 benchmark。
- `CONTRIBUTING.md`：保持评审一致与协议行为的贡献规则。
- `CHANGELOG.md`：仅收录已完成变更。

## 模板面

- `templates/AGENTS.md`：事 · Facts 模板。
- `templates/CLAUDE.md`：法 · Protocol 模板。
- `templates/DESIGN.md`：设 · Design 模板，用于产品、视觉、交互、品牌或 DX 设计入口。

## 阅读路径

新维护者建议按此顺序：

1. `README.md`
2. `docs/architecture.md`
3. `docs/run-contract.md`（包括"操作准则附录"）
4. `docs/tool-adaptation.md`
5. `docs/agent-triggering.md`
6. `docs/bundles/README.md`
7. `CHANGELOG.md`

## 仅维护者材料

评审、决策矩阵、收敛清单与文档清册位于 `internal/`，已 gitignore，不随插件发布。它们指导内部文档工作，不构成插件用户的契约面。

## 新增文档前请先判断

新增文档前，先确认它属于以下哪一类：

- 协议权威。
- adapter 或 bundle 笔记。
- 模板。
- 评审或决策记录。
- 项目历史。
- 未来工作。
- 维护清单。

如果都不符合，那它通常应该写进某个已有文档里。
