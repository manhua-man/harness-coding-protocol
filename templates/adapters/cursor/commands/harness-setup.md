# Harness Setup

Create a Harness plan for the current workspace or the target path named by the user, preview it, and apply only after confirmation.

<!-- HARNESS_DYNAMIC_SECTION_START:CURSOR_SETUP_COMMAND -->
> HARNESS Cursor setup command
1. Run `harness detect <target> --json`.
2. Run `harness plan <target> --from-run <detect-run-id> --json`.
3. Read `.harness/runs/<plan-run-id>/summary.md` and `plan.json`.
4. Show the saved summary and top-level counts to the user.
5. Ask for explicit confirmation before applying.
6. If confirmed, run `harness apply <target> --plan <plan-run-id> --backup`.
7. Read `.harness/runs/<apply-run-id>/result.json` for the final status.
8. Do not recompute detection, plan, risk, recommendations, or diff inside Cursor.
<!-- HARNESS_DYNAMIC_SECTION_END:CURSOR_SETUP_COMMAND -->

If the user declines the preview, leave target configuration files unchanged and report the plan Run ID.
