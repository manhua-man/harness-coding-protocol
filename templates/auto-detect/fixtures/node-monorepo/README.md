# node-monorepo (fixture)

Fixture for maintainer detector smoke and agent-native grounding against a pnpm + turborepo monorepo.

Expected detector signals:
- `repoShape: monorepo` (pnpm-workspace.yaml + workspaces field + multiple package.json + turbo.json)
- `stacks: [node]`
- `frameworks: [react, vite, express]`
- `commands` includes `dev`, `build`, `test`, `lint`, `typecheck` from the root package via `pnpm`
- No existing AI tool traces (`.claude/`, `.cursor/`, MCP)
- No existing root truth (`AGENTS.md` / `CLAUDE.md` / `DESIGN.md` / `steering/`) — Plan should propose `AGENTS.md` / `CLAUDE.md`, propose or skip `DESIGN.md` based on concrete UI/design evidence, and create steering only when useful

Use this directory for maintainer detector smoke checks, or run `/harness-init` in the IDE to exercise the agent-native grounding flow. See repo root [CONTRIBUTING.md](../../../../CONTRIBUTING.md).
