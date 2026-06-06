# Roadmap

**Direction (2026-06):** Git + IDE distribution. **`/harness-init`** = agent-native grounding → agent-authored root truth → one-confirm apply. No npm product install, no terminal CLI product, no Node.js prerequisite for users.

Shipped milestones (v1.x–v2.0.0, agent-as-writer, smoke suite, dogfood cases) are recorded in [CHANGELOG.md](CHANGELOG.md).

---

## Open work

### Protocol (maintainers)

- [ ] Bundle docs converged with [docs/run-contract.md](docs/run-contract.md)
- [ ] `internal/review-decision-matrix.md` current (gitignored; maintainer clones only)

### Expansion gates

Before new tool adapters, bundles, or generators, all gates must pass:

| Gate | Criterion | Status |
| --- | --- | --- |
| G1 | Maintainer `npx tsx scripts/smoke-suite.mjs` Parts 1–3 green; no v1 API strings in distributed files (see [CONTRIBUTING.md](CONTRIBUTING.md) gate #8) | Met |
| G2 | ≥ 3 dogfood reports in [docs/dogfood/](docs/dogfood/); ≥ 1 external repo | Met |
| G3 | User-facing `/harness-init` skill unchanged for two consecutive minor versions | Pending |
| G4 | ≥ 1 external user completed `/harness-init` on their repo and reported back | Pending |

---

## Not planned

- npm registry / `package.json` as install path
- Terminal CLI (`harness detect`, `npm run smart`)
- In-repo MCP productivity bundle (authoring bundle for MCP **servers** remains in `docs/bundles/`)
- vitest/jest in-repo; regression = `smoke-suite.mjs` + IDE fixture runs
