# Agent-Native Init Benchmark

This benchmark evaluates the user-facing `/harness-init` experience after the v2.1 agent-native shift. It is separate from maintainer smoke scripts: the benchmark measures whether an IDE agent can ground, draft, confirm, and apply without requiring Node.js, npm, npx, tsx, or TypeScript helper scripts.

## What This Measures

Primary question:

> Can a normal user run `/harness-init` in an AI IDE and get useful root-truth files with one confirmation and no runtime setup?

The benchmark scores:

- Agent grounding quality.
- Draft quality for `AGENTS.md`, `CLAUDE.md`, conditional `DESIGN.md`, conditional `steering/harness-recommendations.md`, and Cursor mirror files when applicable.
- User decision load.
- Write safety.
- Reporting clarity.
- Resistance to old detector / HRP / Node paths.

## Hard Fail Gates

Any item below fails the whole run, regardless of score:

| Gate | Failure |
| --- | --- |
| Runtime setup | Agent asks the user to install Node.js, npm, npx, tsx, or run a package install before `/harness-init`. |
| Old user path | Agent calls `scripts/harness-detect.mjs`, `runInitDetect`, `runInitRecordPlan`, or `runInitApplyFromPlan` during user onboarding. |
| Pre-confirm write | Agent writes any Root_Truth_File before the user answers `yes`. |
| Out-of-scope write | Agent writes any file outside the allowed Root_Truth_File set. |
| Unsupported claim | Final Draft asserts a stack, framework, package manager, repo shape, or AI tool trace with no evidence path. |
| User-content damage | `patch-section` changes bytes outside the target `##` section. |
| Draft flood | Agent prints complete Draft files before the user asks to inspect them. |
| False skill index | Agent lists plugin-provided `harness-init` as a target-repo skill when it is not physically present in the target repository. |
| Empty steering file | Agent creates `steering/harness-recommendations.md` with only generic placeholder content. |
| Empty design file | Agent creates `DESIGN.md` without existing design file, explicit user request, or UI / product experience / brand / DX evidence. |
| Root frontmatter | Agent writes YAML frontmatter to `AGENTS.md`, `CLAUDE.md`, or `steering/*.md`. |

## Benchmark Set

Run at least these six fixture cases:

| Case | Target | Main Risk |
| --- | --- | --- |
| Minimal repo | `templates/auto-detect/fixtures/minimal-repo` | Does the agent avoid inventing structure? |
| Cursor-heavy | `templates/auto-detect/fixtures/cursor-heavy` | Does it generate Cursor mirror files only when evidence supports Cursor? |
| Claude MCP | `templates/auto-detect/fixtures/claude-mcp` | Does it identify Claude Code and MCP traces without over-prescribing tooling? |
| Node monorepo | `templates/auto-detect/fixtures/node-monorepo` | Does it infer monorepo commands and package managers from manifests? |
| Python FastAPI | `templates/auto-detect/fixtures/python-fastapi` | Does it avoid Node-centric assumptions? |
| Meta Claude plugin | `templates/auto-detect/fixtures/meta-claude-plugin` | Does it recognize plugin authoring from metadata alone? |

Add at least two real repositories before claiming external readiness:

| Case | Selection Rule |
| --- | --- |
| Known repo | A repo maintained by the evaluator, so draft quality can be judged. |
| External OSS repo | A public repo the evaluator does not own, so grounding must rely on repo evidence. |

## Run Protocol

For each case:

1. Copy the target repo to a clean temporary directory.
2. Open that copy in the IDE.
3. Disable or avoid any project install step. Do not run `npm install`, `npx`, `tsx`, or project build commands before `/harness-init`.
4. Run `/harness-init`.
5. Let the agent proceed until the Phase 4 confirmation summary.
6. Record the summary exactly as shown.
7. Answer `no`; confirm no Root_Truth_File changed.
8. Run `/harness-init` again on a fresh copy.
9. At Phase 4, answer `yes`.
10. Record final files, changed paths, and the final report.

Use a fresh copy for the `no` and `yes` passes so cancellation and apply are evaluated independently.

## Scorecard

Total: 100 points.

| Area | Points | Scoring Rule |
| --- | ---: | --- |
| Runtime-free UX | 15 | Full points if no Node/npm/npx/tsx or install command is requested or used. |
| Grounding accuracy | 20 | Correct repo shape, stacks, frameworks, package managers, commands, and AI traces. Deduct for unsupported or missed major facts. |
| Evidence discipline | 10 | Every important claim has a concrete file path or absence reason. |
| Draft usefulness | 20 | Files are concise, project-specific, and useful to a future coding agent. Deduct for generic protocol prose. |
| Decision load | 10 | User gets one confirmation question, with one-line-per-file summary. Deduct for unnecessary questions before Phase 4. |
| Write safety | 15 | No pre-confirm writes, no out-of-scope writes, correct `patch-section` preservation, post-write re-read when possible. |
| Reporting | 10 | Final report includes applied/skipped/failed, changed paths, and any uncertainty. |

Passing thresholds:

- `>= 90`: release-quality for that case.
- `80-89`: acceptable with noted issues.
- `< 80`: not release-ready.
- Any hard fail gate: fail, even if the numeric score is high.

Project-level readiness:

- All six fixtures must score `>= 85` with no hard fails.
- At least two real repositories must score `>= 80` with no hard fails.
- At least one real repository must be completed by someone other than the maintainer or author of the current change.

## Expected Evidence By Case

Use these as scoring oracles, not as strings the agent must copy.

| Case | Expected Grounding |
| --- | --- |
| Minimal repo | Little structure; should not invent frameworks or commands. Existing root-truth files should be preserved or patched carefully. |
| Cursor-heavy | Node stack, React/Vite evidence, Cursor traces, Cursor pair should be proposed; `DESIGN.md` may be proposed if the agent finds concrete UI/design evidence. |
| Claude MCP | Claude Code traces, MCP evidence, Node package evidence where present. |
| Node monorepo | Monorepo shape, pnpm/turbo evidence, React/Vite/Express evidence, workspace commands. |
| Python FastAPI | Python stack, FastAPI, pytest, ruff/black/Poetry evidence, no Node assumptions unless files support them. |
| Meta Claude plugin | Claude plugin metadata, minimal framework claims, plugin-authoring recommendation. |

## Report Template

````markdown
# Agent-Native Init Benchmark: <case> @ <date>

## Setup

- IDE:
- Plugin commit:
- Target:
- Evaluator:
- Pass type: cancellation / apply

## Hard Gates

| Gate | Pass? | Evidence |
| --- | --- | --- |
| No runtime setup requested |  |  |
| No old detector / HRP user path |  |  |
| No pre-confirm write |  |  |
| No out-of-scope write |  |  |
| No unsupported project claims |  |  |
| Patch-section preserved user bytes |  |  |
| No default full Draft dump |  |  |
| No plugin skill listed as target skill |  |  |
| No empty generic steering file |  |  |
| No root Markdown frontmatter |  |  |

## Phase 4 Summary

```text
<paste exact summary>
```

## Score

| Area | Points | Notes |
| --- | ---: | --- |
| Runtime-free UX | /15 |  |
| Grounding accuracy | /20 |  |
| Evidence discipline | /10 |  |
| Draft usefulness | /20 |  |
| Decision load | /10 |  |
| Write safety | /15 |  |
| Reporting | /10 |  |

Total: /100

## Final Files

- ...

## Issues

- ...
````

## Recommended First Run

Start with two cases:

1. `python-fastapi`: catches Node-centric bias immediately.
2. `cursor-heavy`: catches whether Cursor mirror files are gated by evidence and whether summary/apply scope stays tight.

If either case hard-fails, fix the skill before running the full benchmark.
