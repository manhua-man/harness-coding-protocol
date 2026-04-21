# Release Notes: Harness Coding Protocol v2.1.0

**Release Date**: 2026-04-21
**Type**: Major Feature Release
**Breaking Changes**: Yes (CLI command structure)

## What's New

### Plan-First Architecture
- Stable Run Contracts: Every command generates unique run artifact
- Plan as Core: plan command is central contract
- Artifact Persistence: Complete audit trail

### New Command Structure
```bash
harness detect [target]
harness plan [target] --from-run <id>
harness apply [target] --plan <id>
harness rollback [target]
harness doctor [target]
harness setup [target]
```

### Simplified Recommendations
- Default: Top 3 only
- Full Report: Written to recommendations.md
- Confidence-Based: Intelligent selection

### Interactive CLI
- @clack/prompts integration
- TTY auto-degradation
- Progress indicators

## Migration Guide

### Breaking Changes
1. CLI command structure changed
2. Artifact location changed to .harness/runs/
3. Recommendation output simplified

### Migration Steps
```bash
# New recommended workflow
harness detect /project
harness plan /project --from-run <run-id>
harness apply /project --plan <run-id> --backup
```

## Support
- Issues: https://github.com/ManHua/harness-coding-protocol/issues
- Documentation: ./docs/

**Enjoy Harness v2.1.0!**
