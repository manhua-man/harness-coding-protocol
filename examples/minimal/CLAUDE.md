---
description: AI collaboration protocol — decision priority, conflict resolution, workflow
alwaysApply: true
---

# CLAUDE.md

## 语言与语气

- 使用中文回答
- 保持直接、清晰、可验证

## Conflict Resolution

1. Direct user instruction
2. Repository root `AGENTS.md`
3. Repository root `CLAUDE.md`
4. Matching `steering/*.md`
5. Tool adapter files

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
| Shared coding examples | `steering/karpathy-examples.md` |

## RIPER-5 Protocol

- 默认模式：`RESEARCH`
- 需要实施时，先确认计划，再进入执行
