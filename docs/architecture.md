# 架构

`harness-coding-protocol` 是一个 harness-first 的编码协议，不是 prompt 库。它的职责是：定义一份稳定的行为契约，让 AI 编码 Agent 能在不同的 harness、CLI、编辑器和自动化界面下安全地工作。

本架构文档替代了早期把项目当成"模板集合 / 示例库 / 工具特定笔记"的描述。需要追溯产品方向的维护者可在 `internal/reviews/` 下找到原始评审材料（已 gitignore，不随插件分发）。

## 核心定位

协议只有一个中心：一份持久的、面向 Agent 编码工作的 run contract。

其他文档存在的意义都是让这份契约更易落地：

- `docs/run-contract.md` 定义合规编码运行所必须做的事。
- `docs/tool-adaptation.md` 解释不同 harness 如何把自己的能力映射到契约。
- `docs/run-contract.md` 的附录把契约转化为日常操作准则。
- `docs/references.md` 仅是索引，不构成第二份规则源。
- `docs/bundles/` 提供针对特定环境的可分发打包指南。

项目不应漂移成"巧妙 prompt 的目录"。Prompt、bundle、adapter 都只是落地面，不拥有架构。

## 系统模型

一个合规系统由五层构成：

1. **意图层（Intent Layer）**：捕获用户目标、约束、风险容忍度、期望输出。
2. **协议层（Protocol Layer）**：把工作规范化为计划、执行、验证、汇报四类义务。
3. **Harness 层**：暴露当前环境真实的能力与限制。
4. **工具层（Tool Layer）**：执行文件、shell、浏览器、测试、搜索、集成等操作。
5. **证据层（Evidence Layer）**：记录改了什么、验证了什么、还有哪些不确定。

协议层是稳定的中心。Harness 与工具可以变，但不能弱化以下义务：grounding、用户安全、变更范围控制、验证与诚实汇报。

## 角色边界

各类评审在协议中确立了清晰的关注分工：

- **CEO/产品评审**保护焦点。它问：协议是否有强存在理由？新文档让落地更清晰还是只是更宽泛？
- **设计评审**保护可读性。它问：读者能否看懂系统形状、选对路径、避免不必要的认知负担？
- **工程评审**保护正确性。它问：契约是否可实现、可测试、可版本化、跨 harness 可恢复？
- **DX 评审**保护采纳率。它问：安装、使用、调试、迁移对一线开发者是否显然？

这些不是分立的产品，而是同一份协议的评审视角。

## 架构规则

MUST：

- 保持 run contract 独立于任何单一 AI 厂商、CLI、IDE 或插件。
- 把工具特定文件视为 adapter 或 bundle，而不是协议权威。
- 让每个重要行为都可追溯到契约规则、评审决策或显式实现约束。
- 每个概念只保留一个权威文档。
- 维持从架构 → run contract → 工具适配 → 操作准则的清晰阅读路径。

SHOULD：

- 文档保持足够短，能在落地过程中被实际查阅。
- 仅当示例与特定环境绑定时才搬入 bundle。
- 用评审结论来移除旧材料，而不是制造平行解释。
- 优先服务维护者与实施者，再服务普通读者。

AVOID：

- 跨多份文档重复同一条规则。
- 在评审已否决的方向上把历史行为当作有效备选。
- 让 bundle 特定语言反向渗透回核心协议。
- 把"兼容性"当作保留误导性概念的理由。

## 数据与控制流

一次正常的编码运行流程：

1. 捕获用户意图与显式约束。
2. Agent 在仓库与环境中完成 grounding。
3. Agent 选择与风险/范围匹配的计划。
4. Agent 仅修改必要文件。
5. Agent 用可用的测试或检查验证行为。
6. Agent 汇报变更文件、验证结果、残留风险。

Harness 特性可以增强这一流程，但不能跳过任一步。如果某 harness 缺乏某项能力，adapter 必须记录降级路径与后果。

## 所有权

核心协议拥有概念与义务。Bundle 拥有打包与环境特定指引。评审拥有批评与方向。Changelog 与 Roadmap 拥有项目历史与未来排期。

任何 bundle、示例或 adapter 都不得引入新的行为义务，除非该义务被同步提升到 run contract，或被明确标注为"环境专属"。

## Init 实现（IDE）

Onboarding **只走 `/harness-init`**——不是终端 `harness` CLI 链。

用户路径不要求 Node.js、npm、npx、tsx 或目标项目具备 `package.json`。插件让 Agent 直接读取仓库证据，形成内部 Grounding_Summary，起草 Root_Truth_File，向用户展示一行一个文件的确认摘要，并在 `yes` 后写入确认的 Draft 字节。

`templates/auto-detect/init-pipeline.ts` 仍保留 detector / HRP / apply 库函数，供维护者 smoke、fixture、dogfood 和回归验证使用；它不是普通用户 onboarding 的运行依赖。

分发与验证：见 `README.md` 与 `CONTRIBUTING.md`。

## 已移除的概念

那些把项目说成"模板集合 / 通用 AI 工作流指南 / 工具特定安装手册"的旧表述已不再有效。它们与评审方向冲突，不应被重新引入。

同时移除：npm 包安装路径、`package.json` 作为产品面、终端 `cli.ts`、子进程驱动的 Init、自动化 vitest 套件（由 IDE 验证替代）。
