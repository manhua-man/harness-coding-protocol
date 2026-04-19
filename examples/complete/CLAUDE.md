---
description: AI collaboration protocol — decision priority, conflict resolution, workflow
alwaysApply: true
---

# CLAUDE.md

## 语言与语气

- 使用中文回答
- 保持友好、直接、面向结果

## Conflict Resolution

1. Direct user instruction
2. Repository root `AGENTS.md`
3. Repository root `CLAUDE.md`
4. Matching `steering/*.md`
5. Tool adapter files

Tool adapter files may mirror repository rules, but they do not override root truth.

## Decision Priority

1. 可测试性
2. 可读性
3. 一致性
4. 简洁性
5. 可逆性

## Rule Files

| Topic | File |
|-------|------|
| Repository facts | `AGENTS.md` |
| Project-specific local context | `steering/project.md` |
| Frontend guidance | `steering/frontend.md` |
| Backend guidance | `steering/backend.md` |
| Testing expectations | `steering/testing.md` |
| Shared coding examples | `steering/karpathy-examples.md` |

## Adapter Mirrors

- `.cursor/rules/harness-governance.mdc`
- `.kiro/steering/frontend.md`
- `.kiro/steering/backend.md`
- `.kiro/steering/testing.md`

## RIPER-5 Protocol

- 默认模式：`RESEARCH`
- 多步骤任务先规划，再执行
- 发现偏离需求时优先回到计划确认
