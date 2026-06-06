# 应用能力（C3 Apply）

## 目的

`/harness-init` Phase 5：在用户对 Phase 4 摘要回答 `yes` 之后，把 Agent 在内存中确认的 Draft 字节写入仓库。

- 每条写入的字节来自用户确认前已经起草好的 Draft，不重新 grounding、不重新规划。
- 只写 Root_Truth_File 允许列表中的路径，包括条件型 `DESIGN.md`、条件型 steering、以及检测到 Cursor 时的 Cursor pair。
- 写后尽量 re-read，确认落盘文本与确认 Draft 一致。
- 单条写入失败时继续处理后续条目，并在最终报告中列出失败路径。

## 实现

- `.claude/skills/harness-init/SKILL.md` — 用户路径权威：Agent 在 Phase 5 写 confirmed Drafts
- `templates/auto-detect/apply-from-plan.ts`、`hash-recorded-plan.ts`、`run-contract.ts` — 维护者 HRP / golden round-trip 回归工具，非用户 onboarding 依赖

## 产物

- 用户路径：目标 Root_Truth_Files 本身，以及最终聊天报告中的 `applied / skipped / failed`。
- 维护者脚本路径：可继续使用 `.harness/runs/<run-id>/` artifact 验证 detector/apply internals。

## Agent 使用方式

1. 在 Phase 4 用户回答 `yes` 后，冻结 `Confirmed_Write_Set`。
2. 校验所有 entry path 都属于允许的 Root_Truth_File。
3. 写入每个 confirmed Draft；不要在 `yes` 后重新生成内容。
4. 写后尽量 re-read，发现 mismatch 就报告。
5. 完成后向用户汇报 `applied / skipped / failed` 和写入路径。

不存在用户需要运行的终端 apply 命令。维护者脚本只用于 smoke、dogfood、调试和回归。
