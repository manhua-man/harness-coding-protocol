# Feature catalogs and current results

## Discover and group

Read the existing documentation index, feature pages, current summary, and only the implementation/tests needed for the requested scope. Identify product capabilities from user journeys, commands, routes, public APIs, or workflows. A source folder, screen, class, endpoint, or test is evidence of structure, not automatically a separate feature or a completed capability.

Reuse the project's grouping and detailed owners. Cross-cutting capabilities have one owner and links from consumers. Separate delivery surfaces when their behavior or validation differs. Do not impose seven groups, mobile-specific fields, or a fixed completion denominator.

For a new catalog, propose groups supported by evidence and list unresolved coverage explicitly. A small project may need only a feature section in its existing README. An empty project without requirements gets no invented feature pages. Requested but unimplemented capabilities must be labelled planned. Partial inspection must not be called a complete inventory.

## Paths and ownership

Prefer an existing docs index and feature directory. Otherwise use `docs/README.md` and `docs/features/<stable-name>.md` when multiple substantial groups justify separate pages. These are defaults, not mandatory paths. Never create a parallel index beside an adequate existing one.

- Index: group name, scope, link to its detailed owner; optional short current summary.
- Feature page: scope, current capability and limitations, implementation/test entry points, actual validation results, known issues and next steps.
- Existing project status page: concise cross-group summary and links; no second detailed test ledger. Do not create a status page merely to complete a template.
- `AGENTS.md`: short route to the catalog and its responsibility, without volatile results.
- `CLAUDE.md`: only the stable maintenance rule, if missing and in the authorized write scope.

Use [feature page](../assets/feature.md) and [catalog section](../assets/feature-index.md) as adaptable shapes. Replace bracketed instructions with grounded content or omit unsupported optional sections. Do not copy example project facts.

## Generate and update

1. Resolve the exact index, affected group owners, summary consumers, and supporting implementation/test paths before drafting. For new pages, list each proposed path and why it needs a separate owner.
2. Preserve existing prose and unrelated sections. With section-scoped edits, add a missing heading without rewriting other sections. Existing documents are not wholly overwriteable merely because they contain a generated section.
3. Write current behavior and outstanding issues at the top. Integrate new findings into these sections instead of only prepending dated audit notes. Preserve material history and user-owned content under the project's existing retention policy; do not delete raw evidence or create archives as a side effect.
4. Record validation date, version/commit/build identity when relevant, environment or data conditions, actual operations, outcome, and limits. Distinguish current-version execution, explicitly inherited historical results, code inference, failure, blocked, and not tested. Never manufacture test results from compilation, class presence, counts, or page loading.
5. Reconcile affected index/summary claims with the detailed owner. A new unresolved failure narrows an older broad success claim. Different versions, environments, or inputs may legitimately have different results; retain that context. Unknown freshness stays unknown, and conflicting evidence remains explicit until resolved.
6. Update the current review date only for the scope actually reviewed; keep original test dates. Use the existing version identity owner rather than copying long hashes into every page. No new proof manifests, status engines, locks, or mandatory CI gates are needed.
7. Repeated runs with unchanged evidence should produce no semantic changes, duplicate headings, duplicate groups, or new files. Do not churn dates merely because the command ran again.

## Validate and deliver

Check changed links (including anchors), implementation locations, group ownership, missing/duplicate groups within inspected scope, and summary consistency. A link to a new page is valid only if that page is also in the write set; after writes, verify it exists. On a partial write failure, report dangling routes and incomplete synchronization rather than claiming success.

Documentation-only work needs document checks, not a build or full regression. Report changed paths, factual corrections, reviewed scope, and remaining uncertainties. Suggested smoke scenarios: new multi-feature repo, existing nonstandard catalog, tiny/empty repo, newer failure against an older success summary, unavailable test evidence, and unchanged repeat execution.
