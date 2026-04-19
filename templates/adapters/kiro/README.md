# Kiro Adapter

Kiro compatibility is implemented as a **mirror**, not a new source of truth.

## Canonical Paths

- Root truth: `AGENTS.md`
- Root protocol: `CLAUDE.md`
- Local overrides: `steering/`

## Mirrored Output

When users install with `--with-kiro`, the installer mirrors every file from `steering/` into `.kiro/steering/`.

## Rule Priority

If `.kiro/steering/` and root files ever disagree, follow the root files:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `steering/*.md`
4. `.kiro/steering/*`
