# AI Docs Maintenance (Harness Protocol)

Capability **C5** — keep root truth accurate after `/harness-init`.

## Lifecycle

```text
/harness-init          → bootstrap AGENTS.md, CLAUDE.md, steering/, Cursor pair
        ↓
Day-to-day development
        ↓
/revise-ai-docs        → session incremental: one learning back to entry
/project-ai-docs-steward → periodic audit: Discovery → report → edit after confirm
/update-docs           → human docs/, README sync with implementation
```

## Commands

| Command | Skill | Writes | Confirm before write |
|---------|-------|--------|----------------------|
| `/harness-init` | `harness-init` | Root truth bootstrap | Yes (one yes/no) |
| `/revise-ai-docs` | — (uses steward layer model) | AGENTS, CLAUDE, steering | Yes (per diff) |
| `/project-ai-docs-steward` | `project-ai-docs-steward` | Same + quality report | Yes (mandatory report first) |
| `/update-docs` | — | Human docs: git discovery + writing layout | Per user practice |

## Layer model (recap)

| Character | File | Role |
|------|------|------|
| 事 (Facts) | `AGENTS.md` | Facts: commands, layout, ports |
| 法 (Protocol) | `CLAUDE.md` | Protocol: priorities, modes, tone |
| Local | `steering/` or `.kiro/steering/` | Scoped overrides |
| Human | `docs/` | Background; not AI truth |

## Locale

- **`/harness-init`:** Draft locale in `ai-ide/skills/harness-init/SKILL.md` § Draft locale (explicit user instruction overrides inferred repo language).
- **C5 commands:** preserve each file's existing locale unless the user explicitly requests a switch; `/update-docs` matches the target `docs/` or `README` file's historical language.

## Distribution

Commands and skills ship under **`ai-ide/`** (AI IDE) — `commands/` + `skills/`.

In **target repos**, the user chooses where slash commands live — e.g. `ai-ide/commands/`, `commands/`, `.cursor/commands/`, or `.claude/commands/` — and may extend `update-docs.md` locally with an optional code-path → doc-path mapping table.

`ai-ide/skills/project-ai-docs-steward/` holds the audit workflow authority.

## Non-goals

- Does not replace domain-specific skills in business repos (deploy, payment, …)
- Does not auto-run on every session — user invokes explicitly
