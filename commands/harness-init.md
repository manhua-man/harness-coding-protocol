---
description: Bootstrap a target repo via /harness-init — ground, read, judge, confirm, apply. The IDE_Agent itself reads, judges, and writes the root-truth files after one confirmation.
argument-hint: <project-path>
---

# /harness-init

**Canonical procedure:** read and follow [`../.claude/skills/harness-init/SKILL.md`](../.claude/skills/harness-init/SKILL.md) from start to finish. Do not shorten or skip phases.

- If `$ARGUMENTS` supplies a project path, use it as `<project-path>` in the skill.
- Otherwise use the current working directory.

$ARGUMENTS

All phases are agent-native: ground by reading repo files, draft in memory, ask one yes/no confirmation, then write only confirmed Root_Truth_Files. Do not require Node.js, npm, npx, tsx, or the TypeScript maintainer scripts for user onboarding.
