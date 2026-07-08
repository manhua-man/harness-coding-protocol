# Steering Index

> Local override index. Scope truth lives in each file's YAML frontmatter (`inclusion`, `fileMatchPattern`).

| File | Typical scope | Topic |
|------|---------------|-------|
| `harness-recommendations.md` | project-specific | Paths, tools, conventions discovered at init |
| `karpathy-examples.md` | manual or fileMatch | LLM coding pitfalls and fixes |

**Conflict rule:** `AGENTS.md` + `CLAUDE.md` win over steering. `docs/` is human background only.

**Kiro users:** If the project uses `.kiro/steering/` instead of `steering/`, mirror this index there as `project.md`.
