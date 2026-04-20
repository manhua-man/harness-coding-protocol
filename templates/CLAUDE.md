---
description: AI collaboration protocol — decision priority, conflict resolution, workflow
alwaysApply: true
---

# CLAUDE.md（法 · Protocol）

> 本文件是**法（Protocol）**：回答“在这个仓库怎么做事”。  
> 只存放决策顺序、冲突解析、会话协议、输出要求与协作习惯。  
> 项目事实（目录、命令、端口、模块等）见同级 `AGENTS.md`。

**仓库真值入口固定为根目录的 `AGENTS.md`、`CLAUDE.md`、`steering/`。**  
**Harness 角色**：Harness 在安装或 setup 阶段检测项目现状，生成最少但更正确的 AI 编码配置建议。本文件只定义协作原则，不把任何第三方工作流写成唯一事实源。

---

## 与 AGENTS.md 的分工

| 汉字 | 文件 | 职责 |
|------|------|------|
| **事** | `AGENTS.md` | 项目结构、命令、端口、模块、端点、提交/PR 规范等可核对事实 |
| **法** | **`CLAUDE.md`（本文件）** | 决策优先级、冲突解析、RIPER-5、会话协议、输出习惯 |

---

## 语言与语气

- 默认使用中文回答，除非用户明确要求英文
- 风格直接、基于事实、友好但不使用表情符号
- 优先使用表格、列表和清晰分隔，便于 AI 与开发者阅读

---

## 项目事实从哪里读（事）

所有项目概览、目录结构、端口、脚本、模块表等可核对事实，均以根级 `AGENTS.md` 为唯一真值。本文件不重复罗列。

---

## Conflict Resolution（冲突解决顺序）

当规则发生冲突时，按以下优先级处理：

1. 用户当次明确指令
2. 仓库根目录 `AGENTS.md`
3. 仓库根目录 `CLAUDE.md`
4. 匹配的 `steering/*.md`
5. 工具适配文件（仅做兼容，不覆盖真值）

---

## Decision Priority（决策优先级）

1. **可测试性 (Testability)** — 是否易于编写可靠的自动化测试？
2. **可读性 (Readability)** — 是否便于其他开发者快速理解？
3. **一致性 (Consistency)** — 是否遵循项目现有模式与约定？
4. **简洁性 (Simplicity)** — 是否是满足当前需求的最简单方案？
5. **可逆性 (Reversibility)** — 如果方向错了，回滚成本高不高？

---

## Development Principles（开发原则）

详细示例见 `steering/karpathy-examples.md`。

| Principle | 含义 |
|-----------|------|
| Incremental Progress | 优先小步、可验证、可回滚的变更 |
| Context First | 先充分理解现有实现，再提出方案 |
| Pragmatism Over Dogma | 以项目现实约束为准，不死守理论最优 |
| Update Before Create | 优先更新已有文档与规则，避免重复来源 |

---

## 第三方工作流协作原则

Harness 可以根据检测结果在 `AGENTS.md` 或报告中生成第三方工作流适配建议。使用原则：

- 优先遵循 `AGENTS.md` 中动态生成的调用方式和适用场景
- 任何第三方工作流都必须服从本仓库的根级真值与冲突解决顺序
- 发现冲突时，退回本文件定义的 Decision Priority 和 RIPER-5 进行裁决

---

## RIPER-5 Protocol

### Mode Declaration

复杂任务建议在响应开头声明当前模式：`[MODE: MODE_NAME]`。默认模式：`RESEARCH`。

### Modes

| Mode | 目的 | Allowed | Forbidden |
|------|------|---------|-----------|
| RESEARCH | 信息收集与理解 | 阅读文件、分析结构、提出澄清问题 | 规划、实施、暗示解决方案 |
| INNOVATE | 方案探索 | 对比多种路径、权衡优缺点 | 具体实施计划、代码编写 |
| PLAN | 形成完整规范 | 文件路径、接口、数据流、测试方案 | 实施、示例代码 |
| EXECUTE | 按计划实施 | 根据批准计划执行、验证 | 偏离计划、顺手扩展 |
| REVIEW | 验证一致性 | 检查偏差、风险、测试与质量 | 隐藏问题、跳过核对 |

### Execute Mode 特别要求

- 每次改动只做最小必要变更
- 必须偏离计划时，先说明原因和影响
- 注释优先解释“为什么”，而非“做了什么”

---

## Cross-Platform Notes

- 命令示例默认使用 Unix shell 语法；Windows 环境请同时提供 PowerShell 等效写法
- 所有路径说明优先使用仓库相对路径
- 任何本地工具适配文件仅做兼容，不得覆盖根级真值
