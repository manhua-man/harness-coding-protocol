---
name: documentation-architecture
description: Generate and maintain project feature catalogs and human docs from implementation evidence. Use for feature grouping, documentation setup, or stale capability and validation summaries.
---

# Documentation Architecture

Maintain human documentation with one detailed owner per topic. Documentation describes implementation and verified behavior; it cannot override source evidence, user decisions, or project collaboration boundaries.

## Route by task

| Task | Route |
| --- | --- |
| Feature catalog generation, feature results, or summary drift | Read [feature-documentation.md](references/feature-documentation.md). In domain-driven projects, use the existing feature owner (for example `docs/03-功能模块/` or `docs/features/`). Use its assets only for missing documents; preserve existing paths and language. |
| Ordinary incremental API, architecture, or runbook updates | Follow [update-docs](../../commands/update-docs.md), scoped to the requested topic and directly affected links. |
| Full-corpus or block-by-block doc audit (`--audit-corpus`), code-to-doc bidirectional inventory, duplicate consolidation, completed build-plan retirement, or client deliverable black-box convergence | Route to [doc-governance](../doc-governance/SKILL.md). |
| Root facts/protocol changes (`AGENTS.md` / `CLAUDE.md`) | Use `/revise-ai-docs` or `/project-ai-docs-steward`. `/harness-init` can draft the initial feature catalog together with root entry routes. |

The invoking command owns its write scope and confirmation flow. Reading this skill does not add another approval step, authorize unrelated changes, or authorize tests, deployment, deletion, or publication.
