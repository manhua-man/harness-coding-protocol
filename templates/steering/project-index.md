# Steering Index

> Local override and reference index. Plain `steering/*.md` files state applicability in their heading or opening scope note. Use YAML frontmatter only when a specific host format, such as a Cursor rule, requires it.

| File | Typical scope | Topic |
| --- | --- | --- |
| `harness-recommendations.md` | project-specific | Paths, tools, conventions discovered at init |
| `stateful-operations.md` | opt-in reference | Primitive/state contracts, data lifecycle, authoritative reads, and recovery for existing stateful operations |
| `m5-engineering-principles.md` | manual reference | Complexity five questions, ablation, and asset assessment methods; core requirements live in CLAUDE.md |
| `karpathy-examples.md` | manual reference | LLM coding pitfalls and fixes; not mandatory protocol by default |

**Conflict rule:** `AGENTS.md` + `CLAUDE.md` win over steering. `docs/` is human background only.

**Kiro users:** If the project uses `.kiro/steering/` instead of `steering/`, mirror this index there as `project.md`.
