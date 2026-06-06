# Bundles

Bundle 把协议打包给特定的 harness、CLI、编辑器与自动化环境。它是分发面，不是协议权威。

**任何环境的 onboarding：** 从 Git 安装 [harness-coding-protocol](https://github.com/) 插件，然后在 IDE 里跑 **`/harness-init`** —— 不是 `npm install`，也不是终端 `harness` 命令。

如果某个 bundle 与 `docs/architecture.md`、`docs/run-contract.md`、`docs/tool-adaptation.md` 冲突，那么是 bundle 错了，需要重写。

每个 bundle **必须**钉一个 **支持的 Run Contract** 版本（当前 `1.0`），让用户一眼看出该 bundle 实现的是哪个行为契约。版本定义见 `docs/run-contract.md`。

## 维护中的 Bundle

工具 bundle（每个环境一份）：

- `claude-code.md`：Claude Code 风格的仓库代理。
- `codex-cli.md`：Codex 风格的 CLI 或桌面编码代理。
- `cursor.md`：Cursor 或 Cursor 风格的 IDE 代理。
- `gemini-cli.md`：Gemini CLI 或 Gemini 风格的终端编码代理。
- `opencode.md`：OpenCode 或 OpenCode 风格的编码代理。

工作流 bundle（每个任务场景一份）：

- `scenarios.md`：TDD + 质量、计划 + 评审、前端打磨、浏览器/Web 验证。

Authoring bundle（识别仓库自身是 AI 配置工厂时使用）：

- `claude-plugin-authoring.md`：仓库本身是 Claude Code 插件作者。
- `mcp-server-authoring.md`：仓库本身是 MCP server 作者。

## Bundle 契约

每个 bundle **必须**：

- 声明目标环境。
- 钉支持的 Run Contract 版本。
- 链回本 README 以引用共享权威与规则。
- 声明阶段覆盖（*Phase Capability Matrix*）。
- 声明工具能力与降级方案（*Tool Capability Matrix*）。
- 保留用户确认与安全边界。
- 不重新定义协议行为。

每个 bundle **应**：

- 提供最短可行安装路径。
- 仅给出环境特定示例。
- 沿用 run contract 的阶段名：grounding、planning、implementation、verification、reporting。
- 把限制写在安装说明附近，可见。

每个 bundle **不得**：

- 自称为独立协议。
- 整本复刻 run contract。
- 保留 prompt 库式旧表述。
- 用模糊的"通用兼容"措辞遮盖降级行为。

## 共享权威（适用于所有工具 bundle）

- `../architecture.md`
- `../run-contract.md`（含"操作准则附录"）
- `../tool-adaptation.md`

工具 bundle 通过引用本 README 继承上述权威，不需要重复列举。

## 共享必要映射（适用于所有工具 bundle）

- **Grounding**：决策前先核查仓库。
- **Planning**：计划与风险匹配；范围较广时显式展示计划。
- **Implementation**：精准编辑；保留无关用户改动。
- **Verification**：跑当前可用的最强检查；点名跳过的检查。
- **Reporting**：收尾给出变更文件、验证结果、残留风险。

工具 bundle 仅需记录"环境与该映射偏离的部分"（一般写在 *降级行为* 一节）。

## 共享 Bundle Rule

工具特定指引可解释如何使用 harness，但不得弱化 run contract，也不得整本复制。如果某 bundle 需要新的行为规则，请先把它提升到 `docs/run-contract.md`。

## Phase Capability Matrix 模板

新建或重写 bundle 时使用此表。它按 run contract 阶段声明：bundle 是完整、降级还是无法支持。

| 阶段 | 覆盖 | 说明 |
| --- | --- | --- |
| Grounding | Full / Partial / None | 编辑前读取了什么。 |
| Planning | Full / Partial / None | 何时把计划展示给用户。 |
| Implementation | Full / Partial / None | 编辑是如何应用的、保留了哪些既有模式。 |
| Verification | Full / Partial / None | 跑了哪些检查、跳过了哪些。 |
| Reporting | Full / Partial / None | 收尾汇报包含了什么。 |

`Full` 表示阶段完全按 `docs/run-contract.md` 执行。`Partial` 表示阶段执行但有显式降级（如因无 shell 而跳过测试）。`None` 表示 bundle 无法支撑该阶段，需要升级处理。

## Tool Capability Matrix 模板

此表记录 bundle 暴露给 Agent 的底层能力。它是 Phase Capability Matrix 的补充——前者描述**行为**，本表描述**支撑这些行为的工具**。

| 能力 | 支持 | 说明 |
| --- | --- | --- |
| 文件读 | Yes/No/Partial | 标明限制。 |
| 文件写 | Yes/No/Partial | 标明最安全的编辑路径。 |
| Shell 命令 | Yes/No/Partial | 含沙箱或审批限制。 |
| 浏览器自动化 | Yes/No/Partial | 含截屏/交互支持情况。 |
| 网络访问 | Yes/No/Partial | 含来源限制。 |
| 测试/构建 | Yes/No/Partial | 写出项目原生命令路径。 |
| 用户确认 | Yes/No/Partial | 解释危险动作如何停下等待确认。 |
| 后台作业 | Yes/No/Partial | 是否支持长任务。 |

## 标准工具 Bundle 形态

完成本次收敛后，工具 bundle 文件只保留环境特定的差异：

1. 标题 + 目标环境 + 支持的 Run Contract 版本 + onboarding 指针。
2. Phase Capability Matrix。
3. Tool Capability Matrix。
4. 降级行为（仅写出与共享映射不同的部分）。

权威列表、必要映射、Bundle Rule 都住在本 README。

## 评审对齐

评审方向很硬：bundle 应让采纳更容易，而不是把项目重新变回 prompt 包。如果某个 bundle 还在带旧战略、旧角色定义或重复规则，请删掉它们，并改为链接到权威文档。
