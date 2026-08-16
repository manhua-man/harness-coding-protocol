# Contributing

Preserve the protocol-first direction: **IDE `/harness-init` in target repos**, agent-native grounding, no terminal CLI product path.

## Must

- One authoritative home per rule (skills > maintainer notes).
- Ship log → [`docs/maintainers/CHANGELOG.md`](docs/maintainers/CHANGELOG.md).
- Future work only → [`docs/maintainers/ROADMAP.md`](docs/maintainers/ROADMAP.md).

## Verify

No `package.json`, no headless smoke. After changing `ai-ide/skills/`, `templates/`, or `ai-ide/commands/`:

1. Reload plugin.
2. `/harness-init` in a **target test repo**.
3. Phase 4: one line per file, wait for `yes`/`no`. Phase 5: write confirmed Drafts only.

Static contract checks before the IDE smoke:

```text
git grep -n -E "^(description:|alwaysApply:)" -- templates/AGENTS.md templates/CLAUDE.md templates/steering
git grep -n "^```markdown$" -- templates/steering
git grep -n -E "Default: RESEARCH|declare mode at response start" -- templates ai-ide
git grep -n -E "^## M5|M5 Engineering Constraints" -- templates/CLAUDE.md ai-ide/skills/harness-init/scaffolds/claude.md
```

All four commands should return no matches. `DESIGN.md` and host-specific rule/skill files may still use YAML frontmatter. M5 remains available under `templates/steering/` as an opt-in reference.

Full maintainer checklist: [`docs/maintainers/README.md`](docs/maintainers/README.md).
