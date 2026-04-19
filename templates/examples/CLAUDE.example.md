# CLAUDE.md 示例（游戏项目）

> 已填好的 `CLAUDE.md` 实例，来自实际 monorepo 项目。可直接复制后按需替换。

---

## 语言与语气

- 使用中文回答
- 保持乐观心态，鼓励用户
- **禁用表情符号输出**（除非用户明确要求）

## 项目事实从哪里读（事）

项目概览、端口、脚本与模块表详见 `AGENTS.md`（仓库根目录），本文件**不重复**罗列。

---

## Decision Priority

1. **可测试性 (Testability)** — 方案是否易于编写可靠的自动化测试？
2. **可读性 (Readability)** — 代码是否清晰直观？
3. **一致性 (Consistency)** — 是否遵循项目现有模式？
4. **简洁性 (Simplicity)** — 是否是最简单的解决方案？
5. **可逆性 (Reversibility)** — 撤销成本有多高？

---

## Development Principles

详细示例见 `steering/karpathy-examples.md`。

| 原则 | 核心含义 |
|------|---------|
| **Incremental Progress** | 优先小步迭代、可测试、可回滚的变更，避免一次性大改。 |
| **Context First** | 先理解现有代码、目录结构和既有模式，再开始设计或实现。 |
| **Pragmatism Over Dogma** | 以项目现实约束为准，选择最有效方案，而非追求"理论最优"。 |
| **Update Before Create** | 文档优先更新已有内容，必要时再新建，避免重复文档。 |

---

## Karpathy 编码原则

源自 Andrej Karpathy 的 LLM 编码观察。详细示例见 `steering/karpathy-examples.md`。

| 原则 | 解决的问题 |
|------|-----------|
| **Think Before Coding** | 错误假设、隐藏困惑、缺失权衡 |
| **Simplicity First** | 过度复杂、臃肿抽象 |
| **Surgical Changes** | 正交编辑、触碰不该改的代码 |
| **Goal-Driven Execution** | 测试优先、可验证成功标准 |

**权衡说明：** 这些原则偏向**谨慎而非速度**。琐碎任务（typo修复、明显单行修改）用判断力；目标是减少非平凡工作中的高成本错误。

---

## Rule Files

| Topic | File |
|-------|------|
| Project overview, ports, scripts, coding style & commits | `AGENTS.md` |
| Karpathy 编码原则（详细示例） | `steering/karpathy-examples.md` |
| TypeScript / Jest / TDD | `.kiro/steering/typeserver.md` |
| Docker & database ops | `.kiro/steering/ops-docker-database.md` |
| Domain knowledge (payment, membership, cloud) | `.kiro/steering/domain-knowledge.md` |

---

## RIPER-5 Protocol

### Mode Declaration

每个响应开头必须声明当前模式：`[MODE: MODE_NAME]`

默认模式：RESEARCH

### Modes

| Mode | Purpose | Allowed | Forbidden |
|------|---------|---------|-----------|
| RESEARCH | 信息收集和理解 | 阅读文件、提问、分析架构 | 建议、实施、规划 |
| INNOVATE | 头脑风暴方案 | 讨论方案、评估利弊 | 具体规划、代码编写 |
| PLAN | 创建技术规范 | 详细计划、文件路径、函数签名 | 任何实施或代码 |
| EXECUTE | 实施已批准计划 | 严格按计划执行 | 偏离计划、创造性添加 |
| REVIEW | 验证实施符合计划 | 逐行比较、标记偏差 | — |

### Mode Transitions

只有明确信号才能转换：
- `ENTER RESEARCH MODE`
- `ENTER INNOVATE MODE`
- `ENTER PLAN MODE`
- `ENTER EXECUTE MODE`
- `ENTER REVIEW MODE`

### Execute Mode Rules
- 100% 忠实遵循计划
- 按编号清单顺序执行
- 发现需要偏离时，返回 PLAN 模式
- 代码质量：只注释"为什么"，适当错误处理，标准化命名

---

## Cross-Platform Notes

- Shell 命令示例基于 Unix/Linux，Windows 环境使用 PowerShell 等效命令
- 禁用表情符号输出（除非特别要求）
