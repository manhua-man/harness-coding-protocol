# Harness Detect

Run Harness detection for the current workspace or the target path named by the user.

<!-- HARNESS_DYNAMIC_SECTION_START:CURSOR_DETECT_COMMAND -->
> HARNESS Cursor detect command
1. Run `harness detect <target> --json`.
2. Parse the returned single-line JSON for `runId`, `artifactDir`, `exitCode`, counts, and risk.
3. Read `.harness/runs/<run-id>/manifest.json` and `detection.json`.
4. Summarize detected tools, frameworks, commands, and next actions from the artifacts.
5. Do not recompute project detection inside Cursor.
<!-- HARNESS_DYNAMIC_SECTION_END:CURSOR_DETECT_COMMAND -->

Return a short message with the Run ID, artifact directory, and suggested next command.
