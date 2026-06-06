---
description: AI collaboration protocol — decision priority, conflict resolution, workflow
alwaysApply: true
---


# CLAUDE.md（法 · Protocol）

> 本文件是法（Protocol）：回答"在这个仓库怎么做事"。

## Language & Tone

- 默认使用中文回答，除非用户明确要求英文。
- 风格直接、基于事实、友好但不使用表情符号。
- 检测摘要：languages=javascript, typescript | runtimes=node | frameworks=react, vite | commands=dev, build, test, lint | tools=root-truth, claudeCode, mcp, node, monorepo, ai-traces


## Conflict Resolution

| Priority | Source |
| --- | --- |
| 1 | 用户当次明确指令 |
| 2 | 根目录 AGENTS.md |
| 3 | 根目录 CLAUDE.md |
| 4 | 匹配的 steering/*.md |
| 5 | 工具适配文件 |


## Decision Priority

| Order | Principle |
| --- | --- |
| 1 | Testability |
| 2 | Readability |
| 3 | Consistency |
| 4 | Simplicity |
| 5 | Reversibility |


## Development Principles

| Principle | Meaning |
| --- | --- |
| Incremental Progress | 优先小步、可验证、可回滚的变更 |
| Context First | 先理解现有实现，再给方案 |
| Pragmatism Over Dogma | 以项目现实约束为准 |
| Update Before Create | 优先更新已有文档与规则 |


## Harness Collaboration

> HARNESS 协作原则区块
优先遵循用户当次明确指令。
根级 AGENTS.md 提供事实，CLAUDE.md 提供协议。
任何第三方工作流都只做识别、映射、建议，不替代真值层。
