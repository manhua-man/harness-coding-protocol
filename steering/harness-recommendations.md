---
description: Local steering overrides for project-specific behavior
alwaysApply: true
---


# steering/harness-recommendations.md

> steering/ 只存放局部 override：仅针对特定路径或任务的补充规则。

## Scope

- 适用范围：project:harness-coding-protocol
- 检测摘要：languages=javascript, typescript | runtimes=node | frameworks=react, vite | commands=dev, build, test, lint | tools=root-truth, claudeCode, mcp, node, monorepo, ai-traces
- 优先级低于根级 AGENTS.md 和 CLAUDE.md。


## Recommended Patterns

- 按路径或语言拆分，不要写成仓库全局说明书。
- 如果规则会影响生成内容，说明应保留哪些用户内容。
- 对可选工具只写建议，不写强依赖。


## Harness Override Guidance

> HARNESS 局部覆盖区块
steering/ 只存放局部 override，不重复根级事实或协议。
优先解释"适用范围"，避免把仓库事实写散到多个文件。
新增规则前先检查是否已有同类文件可复用。
