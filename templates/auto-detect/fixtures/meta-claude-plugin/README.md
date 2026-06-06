# meta-claude-plugin (fixture)

Fixture for the N-2 meta-ecosystem detector. The repo carries a
Claude Code plugin manifest in `.claude-plugin/`, but otherwise has
no Node / Python / framework signals. The recommender should pick
`meta-claude-plugin` and surface "Claude plugin authoring".

Expected detector signals:

- `metaEcosystem.ecosystem: meta-claude-plugin`
- `metaEcosystem.confidence >= 0.85`
- `metaEcosystem.evidence` includes `.claude-plugin/plugin.json`
- `tools` includes `claude-plugin`
- `frameworks: []` (no React / Vite / etc. — repo is purely a manifest)

Use this directory for maintainer detector smoke checks, or run `/harness-init` in the IDE to exercise the agent-native grounding flow. See repo root [CONTRIBUTING.md](../../../../CONTRIBUTING.md).
