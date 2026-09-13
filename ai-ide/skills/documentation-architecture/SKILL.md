---
name: documentation-architecture
description: Generate and maintain project feature catalogs and human docs from implementation evidence. Use for feature grouping, documentation setup, or stale capability and validation summaries.
---

# Documentation Architecture

Maintain human documentation with one detailed owner per topic. Documentation describes implementation and verified behavior; it cannot override source evidence, user decisions, or project collaboration boundaries.

## Route by task

- For feature catalog generation, feature results, or summary drift, read [feature-documentation.md](references/feature-documentation.md). Use its assets only for missing documents; preserve existing paths and language.
- For ordinary API, architecture, or runbook updates, follow [update-docs](../../commands/update-docs.md), scoped to the requested topic and directly affected links.
- Root facts/protocol changes belong to `/revise-ai-docs` or `/project-ai-docs-steward`. `/harness-init` can draft the initial feature catalog together with root entry routes.

The invoking command owns its write scope and confirmation flow. Reading this skill does not add another approval step, authorize unrelated changes, or authorize tests, deployment, deletion, or publication.
