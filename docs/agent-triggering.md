# Agent 触发

> 工作从哪里开始、规则在哪里、冲突如何解决。

## Onboarding（主路径）

| 场景       | 入口            | 说明                                                                                                |
| ---------- | --------------- | --------------------------------------------------------------------------------------------------- |
| 仓库铺底   | `/harness-init` | 在 AI IDE 内运行。Agent 编排 grounding → 读判 → 起草确认 → 应用。                                |

仓库铺底是**唯一**面向用户的 onboarding 入口。

终端用户**不需要** CLI、**不需要** `npm install`、本仓库也**没有** `package.json`。

用户路径实现权威：`.claude/skills/harness-init/SKILL.md`。分发方式见 `README.md`。

## 可选（非 onboarding）

| 场景             | 入口                       | 说明                                                                       |
| ---------------- | -------------------------- | -------------------------------------------------------------------------- |
| 仅检测           | `scripts/harness-detect.mjs` | `runInitDetect` 薄壳；维护者 / smoke，非用户 onboarding。                    |
| 查看维护者 run 产物 | `.harness/runs/<run-id>/`  | `detection.json`、`plan.json`、`result.json`、`summary.md`，仅来自维护者脚本。 |
| HRP round-trip  | `init-pipeline.ts` API     | 维护者验证 detector/apply internals；可选 `harness-record-plan.mjs` / `harness-apply.mjs` 见 CONTRIBUTING。 |

## 规则收口

```text
root/
├── AGENTS.md          # 事 · Facts
├── CLAUDE.md          # 法 · Protocol
├── DESIGN.md          # 设 · Design，按 UI / 体验证据或用户要求生成
└── steering/          # 局部 override
```

| 工具        | 触发方式                                              | 规则来源                          |
| ----------- | ----------------------------------------------------- | --------------------------------- |
| Claude Code | `/harness-init` + `commands/harness-init.md`          | `AGENTS.md` / `CLAUDE.md` / `DESIGN.md` |
| Cursor      | `/harness-init` + `.cursor/commands/harness-init.md`  | 根级真值 + 命令镜像               |

Bundle 导航在 `references.md`。MCP productivity bundle **已弃用**，不在维护清单中。

## 冲突解决顺序

1. 用户当次明确指令
2. `AGENTS.md`
3. `CLAUDE.md`
4. `DESIGN.md`（仅设计与体验问题）
5. `steering/*.md`
6. 工具适配文件（仅作兼容）
