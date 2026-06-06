<!-- Style scaffold extracted from claude.generator.ts during agent-as-writer task 3.1. Reference material — final bytes are agent-written. -->
# CLAUDE.md (Protocol)

> Project protocol: this file answers "how do we do things in this repository?"

## Language & Tone

- Match the language the user uses — including code-mixed messages, follow the most recent user turn.
- Be direct, fact-based, friendly without emoji.

## Conflict Resolution

1. Explicit user instruction in the current turn
2. Root-level `AGENTS.md`
3. Root-level `CLAUDE.md`
4. Root-level `DESIGN.md` for design and experience decisions
5. Matching `steering/*.md`
6. Tool adapter files

## Decision Priority

1. Testability
2. Readability
3. Consistency
4. Simplicity
5. Reversibility

## Development Principles

- **Incremental Progress** — Prefer small, verifiable, reversible changes
- **Context First** — Understand the existing implementation before proposing
- **Pragmatism Over Dogma** — Real project constraints win over abstract rules
- **Update Before Create** — Update existing docs and rules before introducing new ones

## Harness Collaboration

> HARNESS collaboration-principles block
Follow the user's explicit instruction in the current turn first.
Root AGENTS.md provides facts; CLAUDE.md provides protocol.
DESIGN.md provides design and experience direction only when the project has a visible/product/DX surface.
Third-party workflows only identify, map, and suggest — they never replace the truth layer.
