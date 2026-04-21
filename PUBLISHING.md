# Publishing Guide for Harness Coding Protocol v2.1.0

## Pre-Publishing Checklist

### 1. Code Quality
- [x] TypeScript compiles without errors
- [x] All tests pass
- [ ] Manual CLI testing complete

### 2. Documentation
- [x] CHANGELOG.md updated
- [x] README.md updated
- [x] marketplace.json updated

### 3. Package Configuration
- [x] package.json version is 2.1.0
- [x] bin entry points to dist/templates/auto-detect/cli.js

## Publishing Steps

### Step 1: Final Build
```bash
npm run build
```

### Step 2: Test Locally
```bash
npm pack
```

### Step 3: Git Tag
```bash
git tag -a v2.1.0 -m "Release v2.1.0: Plan-first architecture"
git push origin v2.1.0
```

### Step 4: Publish to npm
```bash
npm login
npm publish --dry-run
npm publish
```

### Step 5: Verify
```bash
npm view harness-coding-protocol@2.1.0
```

---
**Version**: 2.1.0
**Status**: Ready
