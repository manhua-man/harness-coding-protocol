# Claude Plugin Authoring Bundle

Target environment: a repository whose product is itself a Claude Code plugin (`.claude-plugin/plugin.json` + `marketplace.json`).

**Supported Run Contract:** 1.0 (see `../run-contract.md`).

**Onboarding:** install the harness-coding-protocol plugin from Git, then run **`/harness-init`** in the IDE.

This bundle inherits its authorities, required mapping, and bundle rule from `./README.md`. Only environment-specific deltas appear below. It is the authoring counterpart of the consumer bundles — it expects you are *building* a plugin, not consuming one.

## Phase Capability Matrix

| Phase           | Coverage | Notes                                                                              |
| --------------- | -------- | ---------------------------------------------------------------------------------- |
| Grounding       | Full     | Read `.claude-plugin/`, command and skill manifests, hook config, lifecycle docs.  |
| Planning        | Full     | Plan changes per author surface (manifest / hooks / skills / commands / docs).     |
| Implementation  | Full     | Edit plugin sources directly; manifests are the product, never auto-rewritten.    |
| Verification    | Partial  | Plugin self-test depends on the Claude Code IDE; recommend an in-IDE smoke run.    |
| Reporting       | Full     | Report manifest version bumps, command/skill changes, marketplace impact.          |

## Tool Capability Matrix

| Capability         | Support  | Notes                                                                |
| ------------------ | -------- | -------------------------------------------------------------------- |
| File read          | Yes      | Read `.claude-plugin/`, `.claude/`, hooks/skill/agent directories.   |
| File edit          | Yes      | Prefer patch-style edits to manifests; review semver before publishing. |
| Shell commands     | Partial  | Used for `git`, version bumps, packaging steps.                      |
| Browser automation | Partial  | Only when verifying marketplace listing screenshots.                 |
| Network access     | Partial  | Required for marketplace publication, otherwise local.               |
| Tests/builds       | Partial  | Plugins typically lack a Node test runner; rely on Claude Code in-IDE. |
| User confirmation  | Yes      | Always confirm before bumping plugin version or publishing.          |
| Background work    | None     | Plugin authoring is interactive.                                     |

## Authoring Mapping (replaces consumer Required Mapping)

- **Manifest as product**: treat `.claude-plugin/plugin.json` and `marketplace.json` as source files. Never auto-rewrite without explicit user approval; never include them in incremental merge blocks.
- **Hooks / skills / agents / commands**: each is an authoring surface with its own activation lifecycle. Document them in AGENTS.md so consumers know what they are getting.
- **Compatibility window**: pin a `Supported Claude Code` version range and surface it in CLAUDE.md.
- **Marketplace install command**: surface the `claude /plugin marketplace add ...` invocation in AGENTS.md and README so first-time users do not have to guess.

## Degraded Behavior

- No Claude Code IDE available: report that runtime plugin behaviour was not verified and stop short of the publish step.
- No marketplace credentials: produce a dry-run plan summarising what *would* be published; do not attempt to push.
- Pre-existing `.claude-plugin/plugin.json` modifications: stop before any merge — plugin manifests are not Harness-managed surfaces.
