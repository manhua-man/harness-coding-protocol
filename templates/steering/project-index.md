# Steering Index

> Local override and reference index. Plain `steering/*.md` files state applicability in their heading or opening scope note. Use YAML frontmatter only when a specific host format, such as a Cursor rule, requires it.

| File | Typical scope | Topic |
| --- | --- | --- |
| `harness-recommendations.md` | project-specific | Paths, tools, conventions discovered at init |
| `stateful-operations.md` | opt-in reference | Installers, migrations, caches, build state, resumable jobs, and recovery |
| `m5-engineering-principles.md` | manual reference | Optional engineering decision heuristics; not mandatory protocol |
| `karpathy-examples.md` | manual reference | LLM coding pitfalls and fixes; not mandatory protocol by default |

**Conflict rule:** `AGENTS.md` + `CLAUDE.md` win over steering. `docs/` is human background only.

**Kiro users:** If the project uses `.kiro/steering/` instead of `steering/`, mirror this index there as `project.md`.
