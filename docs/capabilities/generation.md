# 内容产出能力（C2 Agent-as-Writer）

## 目的

`/harness-init` Phase 2 → 3 → 4 由 IDE_Agent 完成：读项目 → 判断每个 Root_Truth_File 该怎么写 → 自己写 Drafts → 在 Phase 4 让用户做最小确认。任何能读写文件的 AI agent 均可运行。

写入的目标文件：

| 文件                                    | 角色                                |
| --------------------------------------- | ----------------------------------- |
| `AGENTS.md`                             | 事 · Facts                          |
| `CLAUDE.md`                             | 法 · Protocol                       |
| `DESIGN.md`                             | 设 · Design，条件生成               |
| `steering/harness-recommendations.md`   | 局部建议                            |
| `.cursor/rules/harness.mdc`             | 检测到 Cursor 时生成的 Cursor 规则  |
| `.cursor/commands/harness-init.md`      | Cursor 的 `/harness-init` 镜像      |

后两者被视为同一个 Root_Truth_File（Cursor pair），但作为两个物理文件出现在确认摘要和最终写入中。

`DESIGN.md` 是条件型 Root_Truth_File：当目标仓库已有 `DESIGN.md`、用户明确要求设计入口，或 repo 证据显示 UI / 前端 / 游戏 / 文档站 / 插件界面 / 设计系统 / 组件库 / 视觉资源 / DX 体验面时，Agent 可以创建或 patch。纯后端、库、CLI、infra、数据管线或没有设计面证据的未知项目默认 `skip`，不得生成空泛设计模板。

## 实现

- `.claude/skills/harness-init/SKILL.md` —— Phase 2/3/4 的 agent 指令；其中 `## Style Scaffolds` 节嵌入了四份风格脚手架（来自 `.claude/skills/harness-init/scaffolds/`），仅作为参考。最终 Draft 字节由 agent 自己写。
- `templates/auto-detect/hash-recorded-plan.ts`、`run-contract.ts` —— 维护者验证工具，不是用户路径依赖。

不存在 `generators/*.ts`，不存在标记块合并引擎。模板字符串只是脚手架，不是输出。

## AI Assistant Tool Index 节

`AGENTS.md` 内嵌一个 `## AI Assistant Tool Index (技能工具箱)` section，列出目标仓库已安装的 Skills。该 section 由 agent 在 Phase 3 起草时维护。

- 来源（agent 自行扫描）：

  1. `.claude/skills/` — 递归 `**/SKILL.md`
  2. `.cursor/skills/` — 递归 `**/SKILL.md`
  3. `.codex/skills/` — 递归 `**/SKILL.md`
  4. `tools/` — 仅 depth-1 `*/SKILL.md`

**朴素准确**：从每个 `SKILL.md` 的 frontmatter 取 `name` 与 `description`；只做受限 Markdown 转义（`|` → `\|`、行内换行 → 单空格）；不读取用户 home 目录。

**空态**：四个源根全部为空或不存在时，section 内仅输出一行 `<!-- no skills detected -->`，`## AI Assistant Tool Index (技能工具箱)` 标题保留。

## Section 边界（patch-section）

`patch-section` 动作只允许改动目标 `##` heading section 内的字节；heading section 外的字节（包括其他 `##` section、frontmatter、以及首个 `##` heading 之前的内容）必须与磁盘上的现有内容逐字一致。

## Per_File_Action 决策

每个 Root_Truth_File 的动作只可能是 `create`、`overwrite`、`patch-section`、`skip` 之一。

- 文件不存在 ⇒ `create`
- 文件存在但不含任何 harness 拥有的 `##` section ⇒ `patch-section` 或 `skip`，**不允许** `overwrite`
- 文件存在且已含 harness `##` section ⇒ 四种动作都可

每条非 `skip` 动作都要在确认摘要里给出一条 `evidenceReason` 单行说明。

`DESIGN.md` 允许用于 design tokens 的 YAML frontmatter；`AGENTS.md`、`CLAUDE.md`、`steering/*.md` 不允许 frontmatter。

## 不在范围内

- 未确认即静默覆盖用户文件
- 用工具私有目录替代根级真值
- 默认要求用户逐文件评审 Draft
