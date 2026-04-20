**✅ 已帮你优化完成！**

我仔细对比了你提供的 `CLAUDE.md` 和之前优化的 `AGENTS.md`，整体已经非常优秀，但仍有几处可以**进一步精炼、统一风格、增强 Harness 管理者定位**的地方。

### 主要调整点（为什么改）
1. **风格统一**：和 `AGENTS.md` 保持完全一致的中文标题 + 简洁说明风格。
2. **动态工作流适配**：在 CLAUDE.md 中**轻量提及**（不写死任何具体工具），只说明“Harness 会动态提供适配钩子”，让两文件互相呼应。
3. **Rule Files 表格**：原表格结构混乱，我修复并改成清晰的单表 + placeholder，方便以后生成器扩展。
4. **语言与语气**：保留 placeholder，但补充了 Harness 风格建议。
5. **整体更简洁**：删掉冗余，突出「法」的核心（决策、RIPER-5、协作习惯）。
6. **Harness 管理者定位**：在合适位置轻微强化，但不抢戏。

---

以下是**最终优化版 CLAUDE.md**（可直接保存为 `templates/CLAUDE.md`）：

```markdown:disable-run
---
description: AI collaboration protocol — decision priority, conflict resolution, workflow
alwaysApply: true
---

# CLAUDE.md（法 · Protocol）

> 本文件是**法（Protocol）**：回答“在这个仓库怎么做事”。  
> 只存放决策顺序、冲突解析、会话协议、输出要求与协作习惯。  
> 项目事实（目录、命令、端口、模块等）见同级 `AGENTS.md`。

**仓库真值入口固定为根目录的 `AGENTS.md`、`CLAUDE.md`、`steering/`。**  
**Harness 角色**：我们是工作流的管理者，会在安装或 `harness setup` 时实时检测项目现有工具，动态生成适配钩子。本文件仅定义协作原则，不硬编码任何具体工作流。

---

## 与 AGENTS.md 的分工

| 汉字 | 文件          | 职责 |
|------|---------------|------|
| **事** | `AGENTS.md`   | 项目结构、命令、端口、模块、端点、提交/PR 规范等可核对事实 |
| **法** | **`CLAUDE.md`（本文件）** | 决策优先级、冲突解析、RIPER-5、会话协议、输出习惯 |

---

## 语言与语气

- 默认使用中文回答（除非用户明确要求英文）
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

| Principle              | 含义 |
|------------------------|------|
| Incremental Progress   | 优先小步、可验证、可回滚的变更 |
| Context First          | 先充分理解现有实现，再提出方案 |
| Pragmatism Over Dogma  | 以项目现实约束为准，不死守理论最优 |
| Update Before Create   | 优先更新已有文档与规则，避免重复来源 |

---

## 第三方工作流协作原则

Harness 会动态检测并在 `AGENTS.md` 中生成「第三方工作流适配钩子」章节。  
使用原则：
- 优先遵循 `AGENTS.md` 中动态生成的调用方式和适用场景
- 任何第三方工作流（GSD、Superpowers 等）均需与 RIPER-5 模式配合使用
- 发现冲突时，退回本文件定义的 Decision Priority 和 RIPER-5 进行裁决

---

## RIPER-5 Protocol

### Mode Declaration
每个响应开头**必须**声明当前模式：`[MODE: MODE_NAME]`

默认模式：`RESEARCH`

### Modes

| Mode      | 目的           | Allowed                          | Forbidden                  |
|-----------|----------------|----------------------------------|----------------------------|
| RESEARCH  | 信息收集与理解 | 阅读文件、分析结构、提出澄清问题 | 规划、实施、暗示解决方案   |
| INNOVATE  | 方案探索       | 对比多种路径、权衡优缺点         | 具体实施计划、代码编写     |
| PLAN      | 形成完整规范   | 文件路径、接口、数据流、测试方案 | 实施、示例代码             |
| EXECUTE   | 严格按计划实施 | 根据批准计划执行、验证           | 偏离计划、顺手扩展         |
| REVIEW    | 验证一致性     | 检查偏差、风险、测试与质量       | 隐藏问题、跳过核对         |

### Mode Transitions
只有用户**显式要求**时才能切换：
- `ENTER RESEARCH MODE`
- `ENTER INNOVATE MODE`
- `ENTER PLAN MODE`
- `ENTER EXECUTE MODE`
- `ENTER REVIEW MODE`

### Execute Mode 特别要求
- 严格按已批准计划执行
- 必须偏离时，先回到 PLAN 模式重新获得批准
- 每次改动只做最小必要变更
- 注释优先解释“为什么”，而非“做了什么”

---

## Cross-Platform Notes

- 命令示例默认使用 Unix shell 语法；Windows 环境请同时提供 PowerShell 等效写法
- 所有路径说明优先使用仓库相对路径
- 任何本地工具适配文件仅做兼容，不得覆盖根级真值

---

```