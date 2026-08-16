# Documentation lifecycle model

Use this model to reason about responsibilities. Do not require every repository to create all five categories or use these names as directories.

## The five classes

| Class | Question answered | Typical content | Update trigger |
|---|---|---|---|
| Current truth | What is true now? | Architecture, product surface, contracts, current status | Implementation or accepted state changes |
| Operational knowledge | How do I do or diagnose it? | Runbooks, setup, deployment, testing, troubleshooting | Workflow, command, or environment changes |
| Executed work | What happened and what was proved? | Completed plans, migrations, audits, postmortems, historical acceptance | A bounded effort closes or its evidence is superseded |
| Future direction | What might or will happen next? | Roadmaps, proposals, backlogs, unresolved gaps | Priority or commitment changes |
| Machine evidence | What artifact directly supports a claim? | Manifests, reports, screenshots, generated JSON, receipts | Owning producer runs |

The classes are a time-and-responsibility model, not a mandatory directory template. A small library may need only a README, reference docs, and generated API output. A regulated system may need separate audit, runbook, and evidence areas.

## Authority fields

For each document, identify:

1. **Unique question:** the question for which this file is the first authority.
2. **Audience:** user, operator, contributor, maintainer, auditor, or agent.
3. **Mutability:** current and frequently edited, append-only, frozen, or generated.
4. **Update trigger:** the event that makes the file stale.
5. **Adjacent owner:** the file that owns closely related but different knowledge.
6. **Retention need:** current utility, audit value, decision rationale, or Git history only.

If two documents have the same answers, they probably overlap. Choose one owner and reduce the other to navigation or remove it.

## Boundary decisions

### Current truth versus executed work

Keep a concise current conclusion and current evidence pointer in the truth document. Move chronological debugging notes, superseded measurements, and completed package narratives to executed work when they retain audit value.

### Current truth versus future direction

Only a selected, owned work package belongs on a current board. Unselected ideas and incomplete parity claims belong in future direction or known gaps.

### Operational knowledge versus current truth

Architecture says what exists and where responsibility lives. A guide says how to operate it. Avoid copying the same commands and behavior tables into both.

### Executed work versus archive

Do not create an archive merely because content is old. Retain it only when it provides reusable diagnosis, compliance evidence, decision rationale, or acceptance history that Git alone does not make discoverable.

### Human prose versus machine evidence

Human documents interpret evidence and link to it. Generators own evidence paths and bytes. Directory cleanup must not silently rewrite or relocate evidence without updating and exercising the producer.

## Minimal indexes

A root docs index should route by reader question, identify authoritative files, and state maintenance rules. It should not repeat full architecture, command, status, or historical tables.

Add a nested README only when one of these is true:

- the area contains several documents with non-obvious roles;
- readers need a prescribed sequence;
- the directory is an independently maintained subsystem;
- generated and human materials need an explicit local boundary.

Do not add READMEs for visual symmetry.

## Migration decision table

| Finding | Default action |
|---|---|
| Exact duplicate | Keep the authority; delete or reduce the copy to a link |
| Same topic, different lifecycle | Split current conclusion from history or future work |
| Mixed procedure and architecture | Keep responsibility description in architecture; move steps to a guide |
| Obsolete conflicting specification | Delete if Git is sufficient; archive only with independent audit value |
| Generated artifact in a confusing location | Prefer documentation around the stable path; move only with producer validation |
| Empty or one-file category | Flatten unless the boundary itself has durable value |
| Reference repository has a neat tree | Extract its rules; design a new tree from the target repository's content |

## Review questions

- Can a new reader find current status without reading history?
- Can an operator find a procedure without reading architecture prose?
- Can an auditor distinguish current evidence from superseded runs?
- Can a planner see candidates without mistaking them for commitments?
- Does every important concept have exactly one first authority?
- Would deleting a folder README remove information, or only redundant navigation?
- Do generated artifacts remain consumable through their owning tools?
