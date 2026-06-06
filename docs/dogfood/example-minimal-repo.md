# Dogfood Report: minimal-repo @ 2026-05-27

## Your setup

- IDE: Claude Code
- Plugin version: v2.0.0 (local)
- Target repo: `templates/auto-detect/fixtures/minimal-repo` (synthetic fixture)
- Target repo commit: N/A (fixture in this repo)

## Run artifacts (trust loop)

Example fixture run (tmpdir round-trip; reproduce with `npx tsx scripts/dogfood-capture.mjs minimal-repo` when golden HRP exists). For a narrative-only pass without captured IDs, see the three linked cases in [README.md](README.md).

## What happened

### Detection

- Repo shape detected: `single-package`
- Stacks/frameworks detected: (none)
- AI tool traces detected: (none)
- Was detection accurate? Y -- the fixture has no package.json, no frameworks, just two markdown files.

### Agent drafting

- Files proposed: AGENTS.md (overwrite), CLAUDE.md (overwrite), DESIGN.md (skip), steering/harness-recommendations.md (create)
- Actions chosen: overwrite, overwrite, skip, create
- Did the agent's drafts match what you'd expect? Y -- scaffold content is appropriate for a minimal repo.

### Confirmation

- Were you asked only one yes/no? Y
- Did the summary give you enough info to decide? Y -- three lines, one per file, with action and evidence.

### Apply

- Did apply succeed? Y
- Any SHA-256 divergences reported? N -- all `actualSha256 === intendedSha256`.
- Were the final files on disk what you expected? Y

## What worked well

- Skipping DESIGN.md is the right default for a minimal repo with no UI, product-experience, brand, or DX design evidence.
- The summary format is scannable and honest.

## What was confusing or wrong

- Nothing on this fixture. A real repo would stress detection more.

## Suggestions

- None for this fixture. The value comes from testing on real repos with actual stacks and frameworks.
