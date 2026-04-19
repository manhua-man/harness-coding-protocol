# Harness Coding Protocol

An **AI coding protocol framework** for Claude Code, Cursor, Codex and other AI coding assistants.

## The Problem

From Andrej Karpathy's observations on LLM coding pitfalls:

> "The models make wrong assumptions on your behalf and just run along with them without checking. They don't manage their confusion, don't seek clarifications, don't surface inconsistencies, don't present tradeoffs, don't push back when they should."

> "They really like to overcomplicate code and APIs, bloat abstractions, don't clean up dead code... implement a bloated construction over 1000 lines when 100 would do."

## The Solution

**Harness Coding Protocol** provides a structured framework to address these issues:

| Concept | File | Purpose |
|---------|------|---------|
| **事 (Facts)** | `AGENTS.md` | Project structure, commands, ports, modules |
| **法 (Protocol)** | `CLAUDE.md` | Decision priorities, RIPER-5, collaboration habits |
| **Steering** | `steering/*.md` | Task-specific rules, local overrides |

**AI reads only `AGENTS` + `CLAUDE` as ground truth.**

## Core Principles

### Karpathy's Four Principles

| Principle | Addresses |
|-----------|-----------|
| **Think Before Coding** | Wrong assumptions, hidden confusion, missing tradeoffs |
| **Simplicity First** | Overcomplication, bloated abstractions |
| **Surgical Changes** | Orthogonal edits, touching code you shouldn't |
| **Goal-Driven Execution** | Tests-first, verifiable success criteria |

### RIPER-5 Protocol

Five modes for structured collaboration:

1. **RESEARCH** — Gather information, understand context
2. **INNOVATE** — Brainstorm approaches, evaluate tradeoffs
3. **PLAN** — Create detailed specifications
4. **EXECUTE** — Implement according to plan
5. **REVIEW** — Verify implementation matches plan

### Decision Priority

1. **Testability** — Can we write reliable automated tests?
2. **Readability** — Is the code clear and intuitive?
3. **Consistency** — Does it follow existing patterns?
4. **Simplicity** — Is it the simplest solution?
5. **Reversibility** — How costly would reversal be?

## Directory Structure

```
harness-coding-protocol/
├── .claude-plugin/          # Claude Code plugin config
│   ├── plugin.json
│   └── marketplace.json
├── templates/                # Template files
│   ├── AGENTS.md           # Facts template
│   ├── CLAUDE.md           # Protocol template
│   ├── examples/           # Complete examples
│   ├── steering/            # Layered rules
│   └── rules/               # Cursor rules (.mdc)
├── scripts/                  # Installation scripts
├── plugin.json              # npm package config
└── README.md
```

## Installation

### For Claude Code Users

Install via Claude Code plugin marketplace, or:

```bash
# Clone the repository
git clone https://github.com/manhua-man/harness-coding-protocol.git

# Copy templates to your project
cp -r templates/AGENTS.md /your/project/
cp -r templates/CLAUDE.md /your/project/
```

### Using Scripts

```bash
# Unix/macOS
bash scripts/apply-template.sh /path/to/project

# Windows PowerShell
powershell scripts/apply-template.ps1 /path/to/project
```

## Customization

After copying templates to your project:

1. **`AGENTS.md`** — Update project description, directories, ports, commands, commit conventions
2. **`CLAUDE.md`** — Update language requirements, decision priorities, RIPER-5 modes
3. **`steering/`** — Add technology-specific rules as needed
4. **`.cursor/rules/`** — Add IDE-specific rules for Cursor

## Supported Tools

| Tool | Support Level |
|------|---------------|
| Claude Code | Full |
| Cursor | Partial (`.cursor/rules/`) |
| Codex | Full |
| Other MCP tools | Extensible |

## License

MIT
