---
description: Bootstrap project entry docs and conditional feature catalogs from repository evidence, with one confirmation.
argument-hint: <project-path>
---

# /harness-init

**Canonical procedure:** read and follow [`../skills/harness-init/SKILL.md`](../skills/harness-init/SKILL.md) from start to finish. Do not shorten or skip phases.

- If `$ARGUMENTS` supplies a project path, use it as `<project-path>` in the skill.
- Otherwise use the current working directory.

$ARGUMENTS

All phases are agent-native: ground by reading repo files, draft in memory, ask one yes/no confirmation, then write only confirmed root entry and resolved feature documentation paths. Do not require Node.js, npm, npx, tsx, or the TypeScript maintainer scripts for user onboarding.
