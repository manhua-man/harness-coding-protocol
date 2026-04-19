---
description: AI collaboration protocol — decision priority, conflict resolution, workflow
alwaysApply: true
---

# CLAUDE.md（法 · Protocol）

> 本文件是**法（Protocol）**：回答“在这个仓库怎么做事”。只放决策顺序、冲突解析、会话协议、输出要求与协作习惯。项目事实见同级 `AGENTS.md`。

**仓库真值入口固定为根目录的 `AGENTS.md`、`CLAUDE.md`、`steering/`。**

---

## 与 AGENTS.md 的分工

| 汉字 | 文件 | 职责 |
|------|------|------|
| **事** | `AGENTS.md` | 项目结构、命令、端口、模块、接口、提交/PR 规范等可核对事实。 |
| **法** | **`CLAUDE.md`（本文件）** | 决策优先级、冲突解析、RIPER-5、会话协议、输出习惯。 |

---

## 语言与语气

<!-- 示例：
- 默认使用中文回答
- 禁用表情符号（除非用户明确要求）
- 风格直接、友好、基于事实
-->

## 项目事实从哪里读（事）

项目概览、目录、端口、脚本、模块表与仓库约束详见根级 `AGENTS.md`，本文件不重复罗列。

---

## Conflict Resolution

When rules conflict, resolve them in this order:

1. Direct user instruction
2. Repository root `AGENTS.md`
3. Repository root `CLAUDE.md`
4. Matching `steering/*.md`
5. Tool adapter files

Tool adapter files may mirror or reformat repository rules for compatibility, but they do not replace repository truth unless the repository explicitly says so.

---

## Decision Priority

1. **可测试性 (Testability)** — 是否易于编写可靠的自动化测试？
2. **可读性 (Readability)** — 是否便于其他开发者快速理解？
3. **一致性 (Consistency)** — 是否遵循项目现有模式与约定？
4. **简洁性 (Simplicity)** — 是否是满足当前需求的最简单方案？
5. **可逆性 (Reversibility)** — 如果方向错了，回滚成本高不高？

---

## Development Principles

详细示例见 `steering/karpathy-examples.md`。

| Principle | Meaning |
|-----------|---------|
| **Incremental Progress** | 优先小步、可验证、可回滚的变更，而不是一次性大改。 |
| **Context First** | 先理解现有实现，再提出方案或开始修改。 |
| **Pragmatism Over Dogma** | 以项目现实约束为准，不为“理论最优”牺牲交付与可维护性。 |
| **Update Before Create** | 优先更新已有文档与规则，避免重复来源。 |

---

## Rule Files

| Topic | File |
|-------|------|
| Repository facts, commands, ports, coding style & commits | `AGENTS.md` |
| Repository-local context and exceptions | `steering/project.md` |
| Frontend implementation guidance | `steering/frontend.md` |
| Backend implementation guidance | `steering/backend.md` |
| Testing expectations | `steering/testing.md` |
| Karpathy coding examples | `steering/karpathy-examples.md` |

> `.cursor/rules/`、`.kiro/steering/` 等工具目录是适配镜像，不是规范真值层。

---

## RIPER-5 Protocol

### Mode Declaration

每个响应开头必须声明当前模式：`[MODE: MODE_NAME]`

默认模式：`RESEARCH`

### Modes

| Mode | Purpose | Allowed | Forbidden |
|------|---------|---------|-----------|
| `RESEARCH` | 信息收集与理解 | 阅读文件、分析结构、提出澄清问题 | 规划、实施、暗示解决方案 |
| `INNOVATE` | 方案探索 | 对比多种路径、权衡优缺点 | 具体实施计划、代码编写 |
| `PLAN` | 形成完整技术规范 | 文件路径、接口、数据流、测试方案 | 实施、示例代码 |
| `EXECUTE` | 严格按计划实施 | 根据批准的计划执行、验证 | 偏离计划、顺手扩展范围 |
| `REVIEW` | 验证实施与计划一致 | 检查偏差、风险、测试与质量 | 隐藏问题、跳过核对 |

### Mode Transitions

只有在用户显式要求切换模式时才切换：

- `ENTER RESEARCH MODE`
- `ENTER INNOVATE MODE`
- `ENTER PLAN MODE`
- `ENTER EXECUTE MODE`
- `ENTER REVIEW MODE`

### Execute Mode Rules

- 严格按已批准计划执行
- 发现必须偏离时，先回到 `PLAN`
- 代码与文档只做与当前任务直接相关的最小改动
- 注释优先解释“为什么”，而不是“做了什么”

---

## Cross-Platform Notes

- 命令示例默认以 Unix shell 表达；Windows 环境请提供 PowerShell 等效写法
- 任何依赖本地路径的说明，都应优先使用仓库相对路径而不是工具私有路径
