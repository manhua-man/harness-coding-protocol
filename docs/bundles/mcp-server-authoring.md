# MCP Server Authoring Bundle

Target environment: a repository whose product is itself an MCP server (`@modelcontextprotocol/sdk` dependency, server bin entry, MCP example configs).

**Supported Run Contract:** 1.0 (see `../run-contract.md`).

**Onboarding:** install the harness-coding-protocol plugin from Git, then run **`/harness-init`** in the IDE.

This bundle inherits its authorities, required mapping, and bundle rule from `./README.md`. Only environment-specific deltas appear below. It is the authoring counterpart of `mcp-productivity` (consumer-facing MCP integration), now retired.

## Phase Capability Matrix

| Phase           | Coverage | Notes                                                                              |
| --------------- | -------- | ---------------------------------------------------------------------------------- |
| Grounding       | Full     | Read MCP SDK usage, transport (stdio / sse / http), tool registration code.       |
| Planning        | Full     | Plan changes per server surface (transport / tool list / config example).         |
| Implementation  | Full     | Edit server source directly; example configs are docs, never auto-merged.         |
| Verification    | Partial  | Recommend running `npx @modelcontextprotocol/inspector` against the server bin.   |
| Reporting       | Full     | Report public tool surface diffs, transport changes, breaking SDK upgrades.       |

## Tool Capability Matrix

| Capability         | Support  | Notes                                                                |
| ------------------ | -------- | -------------------------------------------------------------------- |
| File read          | Yes      | Read server source, config examples, transport setup.                |
| File edit          | Yes      | Prefer patch-style edits; servers ship as a single bin entry.        |
| Shell commands     | Yes      | Used for `npm run build`, MCP inspector, integration tests.          |
| Browser automation | None     | MCP servers are non-browser; do not assume.                          |
| Network access     | Partial  | Required only for SSE / HTTP transport tests.                        |
| Tests/builds       | Yes      | Standard Node toolchain (vitest / tsc / build).                      |
| User confirmation  | Yes      | Stop before bumping public tool list (consumers may break).          |
| Background work    | Partial  | Long-running inspector sessions can be backgrounded.                 |

## Authoring Mapping (replaces consumer Required Mapping)

- **Tool registration as public API**: treat the MCP `Server.setRequestHandler` registrations as the public surface. Document each tool in AGENTS.md.
- **Transport choice**: surface the transport (stdio / sse / http) in CLAUDE.md so consumers know how to wire it. stdio is the default; non-stdio choices need an explicit reason.
- **Example configs (`mcp-config-example.json`, `mcp-config.json`)**: docs artefacts, never the product. Keep them out of incremental merge blocks.
- **SDK version pinning**: pin `@modelcontextprotocol/sdk` to a tested range; surface it in AGENTS.md so downstreams can plan upgrades.

## Degraded Behavior

- No `@modelcontextprotocol/inspector` available: skip the live tool-list verification and report it.
- No transport tests available: report that transport behaviour was not verified — stdio assumptions can hide regressions.
- Pre-existing example config files modified: stop before merge — example configs are documentation, not Harness-managed surfaces.
