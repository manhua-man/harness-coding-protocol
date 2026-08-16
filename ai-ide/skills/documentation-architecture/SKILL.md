---
name: documentation-architecture
description: Audit and converge a repository's human documentation architecture by assigning one owner per concept, separating current truth, operational knowledge, executed work, future direction, and machine evidence, then migrating files and validating links without imposing a preset directory tree. Use when docs feel duplicated, mixed with history, hard to navigate, over-archived, organized by arbitrary numbered folders, or need a reusable docs structure, responsibility map, cleanup, or migration plan.
---

# Documentation Architecture

Converge project documentation around responsibilities and knowledge lifecycle. Reuse the model, not another repository's folder names.

## Establish the mode

Infer the narrowest authorized mode from the request:

- **Audit:** inspect and report; do not edit.
- **Design:** propose owners, lifecycle classes, and a target tree; do not edit.
- **Converge:** migrate, merge, delete, and validate within the authorized repository.

Treat existing dirty-worktree changes as user-owned. Preserve them and avoid overlapping edits unless they are necessary for the requested convergence.

## 1. Ground in the repository

Read repository instructions and entry docs before judging `docs/`:

- `AGENTS.md`, `CLAUDE.md`, `DESIGN.md`, root `README.md` when present;
- documentation indexes, manifests, generators, validation scripts, and Git status;
- a bounded Markdown inventory, using `scripts/inventory_docs.py` when Python is available.

Read [references/lifecycle-model.md](references/lifecycle-model.md) before designing or applying a new structure. Do not infer authority from a folder name alone; confirm it from content, links, producers, and current callers.

Inventory metadata before loading bodies. On the first pass, fully read only a small, evidence-selected set: the root index, declared truth owners, generator/validation contracts, and files flagged by duplicate titles, mixed lifecycle signals, broken links, or suspicious size. Expand the set only to resolve a named ownership collision. Do not stream every Markdown file into context or enforce a universal numeric cap.

## 2. Build a responsibility map

For every meaningful document, record:

- the question it uniquely answers;
- lifecycle class: current truth, operational knowledge, executed work, future direction, or machine evidence;
- authority and adjacent owner;
- audience and update trigger;
- generated versus hand-maintained status;
- current inbound links and producer paths;
- keep, merge, split, move, archive, or delete decision.

Flag these collisions:

- the same fact or procedure has multiple authorities;
- current truth contains dated execution logs;
- future plans are presented as current commitments;
- an index duplicates full topic content;
- historical material is mixed with product reference;
- generated evidence is treated as prose or moved without its producer;
- directories or READMEs exist only for symmetry.

Exact duplicate detection is supporting evidence only. Semantic ownership requires reading the documents.
The inventory script's lifecycle signals are search leads, not automatic classifications.

## 3. Design the smallest useful structure

Apply these constraints:

1. Assign one authoritative home per concept. Other files link with a short explanation.
2. Keep current truth easy to reach from the root docs index.
3. Separate already-executed work from future candidates.
4. Keep operational guides near the workflows they support.
5. Preserve stable machine-evidence paths unless changing the owning producer is explicitly in scope.
6. Create a directory only when it holds multiple documents or enforces a real responsibility boundary.
7. Create a nested README only when a complex area needs secondary navigation.
8. Match the repository's language and naming conventions.
9. Do not copy a reference repository's numbered folders, depth, icons, or labels without project-specific evidence.

Present a compact before/after tree and migration table. Explain why each boundary exists. In Audit or Design mode, stop after the report.

## 4. Apply a convergence safely

In Converge mode:

1. Freeze the intended write set and protected evidence paths.
2. Create or revise one root documentation index that routes by user question and responsibility.
3. Move current, operational, historical, future, and evidence material to their chosen owners.
4. Split mixed documents only at clear responsibility boundaries.
5. Delete obsolete duplicates when Git history is sufficient; retain an archive only when it has independent audit or decision value.
6. Update inbound links, repository entry docs, generators, manifests, and checks in the same change.
7. Add a lightweight structure/link regression when the repository benefits from guarding the new boundary.

Never hand-edit generated hashes, verdicts, screenshots, or reports to make a migration appear valid.

## 5. Validate direct outcomes

Run the smallest applicable checks:

```text
python <skill-dir>/scripts/check_doc_links.py <repo-root>
python <skill-dir>/scripts/inventory_docs.py <repo-root>
```

Then verify:

- every documented entry path exists and is readable;
- moved generated artifacts are still emitted to the documented path;
- old paths and retired parallel owners no longer have callers;
- protected machine evidence is byte-unchanged unless explicitly migrated;
- current-truth docs no longer contain the execution history moved out of them;
- repository-native docs checks and `git diff --check` pass.

For user-visible convergence, use the host's outcome-verification contract before claiming completion. Structure tests are supporting evidence; direct readability, link resolution, producer alignment, and protected-evidence checks establish the result.

## 6. Report

State:

- the lifecycle and ownership model actually chosen;
- files merged, split, moved, deleted, or intentionally left in place;
- protected/generated paths preserved or deliberately migrated;
- validations run and their results;
- unresolved ambiguity or follow-up candidates.

Do not describe the result as universal merely because the lifecycle model is reusable. The chosen tree is project-specific.
