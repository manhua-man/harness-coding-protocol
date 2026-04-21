# Run Contract

Every Harness CLI run creates a run directory under the target project:

```text
.harness/
└── runs/
    └── <run-id>/
        ├── manifest.json
        ├── detection.json
        ├── plan.json
        ├── diff.patch
        ├── summary.md
        ├── recommendations.md
        └── result.json
```

Only files relevant to the command are written. For example, `detect` writes `manifest.json` and `detection.json`; `plan` writes planning files; `apply`, `rollback`, and `doctor` write `result.json`.

## Run ID

Run ids are sortable and human-readable:

```text
YYYYMMDD-HHmmss-<6hex>
```

Example:

```text
20260421-091501-7aee7c
```

The timestamp portion is UTC. The random suffix avoids collisions when runs start in the same second.

## Manifest

`manifest.json` is the top-level index for a run:

```ts
interface RunArtifact {
  runId: string;
  schemaVersion: string;
  timestamp: string;
  command: string;
  mode: 'detect' | 'plan' | 'apply' | 'rollback' | 'doctor' | 'setup';
  targetPath: string;
  detection?: DetectionResult;
  plan?: PlanResult;
  result?: ApplyResult | RollbackResult | DoctorResult;
  risk: 'low' | 'medium' | 'high';
  exitCode: number;
  duration: number;
  nextActions: string[];
}
```

The current schema version is `1.0.0`.

## Command Artifacts

| Command | Required artifacts | Notes |
| --- | --- | --- |
| `detect` | `manifest.json`, `detection.json` | Scans project signals only |
| `plan` | `manifest.json`, `detection.json`, `plan.json`, `diff.patch`, `summary.md`, `recommendations.md` | Must not write generated guidance files |
| `apply` | `manifest.json`, `result.json` | Reads a saved `plan.json`; must not redetect |
| `rollback` | `manifest.json`, `result.json` | Uses latest successful apply or explicit backup |
| `doctor` | `manifest.json`, `result.json` | Reports artifact integrity and rollback state |
| `setup` | `manifest.json`, plus plan artifacts and optionally `result.json` | Composition of detect + plan + apply |

## Plan Result

`plan.json` is the machine-readable source of truth for proposed changes:

```ts
interface PlanResult {
  targetPath: string;
  mode: 'plan';
  sourceDetectionRunId?: string;
  changes: unknown[];
  counts: {
    detected: number;
    generated: number;
    planned: number;
    create: number;
    update: number;
    delete: number;
    skip: number;
    conflicted: number;
  };
  risk: 'low' | 'medium' | 'high';
  warnings: string[];
  recommendations: SimplifiedRecommendation;
  diffPath?: string;
}
```

`diff.patch` contains the full preview. `summary.md` contains the short human preview. `recommendations.md` contains the full recommendation report.

## Apply Result

`result.json` for apply records what was actually written:

```ts
interface ApplyResult {
  targetPath: string;
  mode: 'apply';
  sourcePlanRunId?: string;
  applied: unknown[];
  skipped: unknown[];
  backups: string[];
  rollbackAvailable: boolean;
  counts: {
    applied: number;
    skipped: number;
    backedUp: number;
  };
  warnings: string[];
}
```

Rollback uses `backupPath` when available, otherwise it falls back to `previousContent` saved in the applied change.

## Stdout Contract

Default stdout is intentionally small:

```text
Plan ready: 2 create, 1 update (risk: low)
Run ID: 20260421-091501-7aee7c
Preview: .harness/runs/20260421-091501-7aee7c/summary.md
```

`--json` emits one line with:

```json
{"runId":"...","artifactDir":"...","exitCode":0,"counts":{},"risk":"low"}
```

It does not include the full diff or full recommendations.

## Exit Codes

| Code | Meaning |
| --- | --- |
| 0 | success |
| 1 | detection failed |
| 2 | plan failed |
| 3 | apply failed |
| 4 | user cancelled |
| 5 | conflict detected |
| 6 | invalid input |

## Adapter Rule

Claude, Cursor, and other tool integrations should read artifacts. They should not recompute detection, plan, risk, recommendations, or diffs from source files.
