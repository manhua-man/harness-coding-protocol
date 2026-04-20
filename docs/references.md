# References And Attribution

Harness uses the projects below as product and architecture references only. No external project code has been copied into this repository. If a future implementation reuses code or closely ports a concrete algorithm, that change must go through license review and add attribution at the implementation site.

| Reference | Status | What Was Verified | How Harness Uses It |
|-----------|--------|-------------------|---------------------|
| [Matt-Dionis/claude-code-configs](https://github.com/Matt-Dionis/claude-code-configs) | verified | Public repository exists and describes Claude Code configuration composition, generation, dry-run, backup, and merge-oriented flows. | Product reference for config composition, dry-run previews, backups, and merge-first setup. |
| [alirezarezvani/ClaudeForge](https://github.com/alirezarezvani/ClaudeForge) | verified | Public repository exists and presents ClaudeForge as a CLAUDE.md generation and maintenance tool. | Product reference for keeping `CLAUDE.md` maintainable from repository analysis. |
| Agent Provisioner | partial | Public descriptions mention repo analysis, generated `.claude/` configuration, scoring, and PR-style workflows. No source repository was verified. | Concept reference for local analysis plus optional remote/LLM recommendation. Harness does not implement remote provisioning. |
| [ALvinCode/cursor-rules-generators](https://github.com/ALvinCode/cursor-rules-generators) | verified | Public repository exists and describes automatic Cursor rule generation. | Product reference for treating Cursor rules as generated compatibility surfaces. |
| [drewipson/claude-code-config](https://github.com/drewipson/claude-code-config) | partial | Public repository exists as a Claude Code configuration project. The current audit did not verify the previous VS Code extension wording. | General reference for user-visible configuration management; VS Code lifecycle claims should stay downgraded unless separately verified. |

## Current Harness Implementation Mapping

- Implemented: local detection, rule-driven generation, recommendation report, dry-run diff, low-risk silent writes, backups, rollback helper.
- Partially implemented: interactive confirmation, framework-aware bundle recommendations, packaged CLI.
- Not implemented: remote LLM recommendation, PR creation, third-party tool installation, copied external code.

## Attribution Rule

- Documentation can cite these projects as references only when the verified status is clear.
- Code comments should mention a reference only when Harness directly ports a specific implementation idea.
- Marketplace copy should describe Harness capabilities, not imply endorsement by or dependency on these projects.
