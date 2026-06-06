# python-fastapi (fixture)

Fixture for maintainer detector smoke and agent-native grounding against a Poetry-managed FastAPI project
that uses ruff + black + pytest.

Expected detector signals:
- `repoShape: layered` (top-level `app/` and `tests/`)
- `stacks: [python]`
- `frameworks` includes `fastapi`, `pytest`, `ruff`, `black`, `poetry`
- `commands` includes `test: pytest`, `lint: ruff check .`, `format: black .`
- No existing AI tool traces (`.claude/`, `.cursor/`, MCP)
- No existing root truth (`AGENTS.md` / `CLAUDE.md` / `DESIGN.md` / `steering/`) — Plan should propose `AGENTS.md` / `CLAUDE.md`, skip `DESIGN.md` unless concrete UI/design evidence exists, and create steering only when useful

Use this directory for maintainer detector smoke checks, or run `/harness-init` in the IDE to exercise the agent-native grounding flow. See repo root [CONTRIBUTING.md](../../../../CONTRIBUTING.md).
