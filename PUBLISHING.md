# Publishing Guide

This guide explains how to publish Harness Coding Protocol to various platforms.

## Pre-Publishing Steps

1. Complete RELEASE_CHECKLIST.md
2. Update version in package.json
3. Update CHANGELOG.md with release date
4. Run final tests

## Publishing to GitHub

```bash
git add .
git commit -m "chore: prepare v2.1.0 release"
git tag -a v2.1.0 -m "Release v2.1.0"
git push origin master
git push origin v2.1.0
```

Then create GitHub Release via web interface.

## Publishing to npm

```bash
npm login
npm publish --dry-run
npm publish
npm info harness-coding-protocol
```

## Publishing to Claude Code Marketplace

1. Verify .claude-plugin/marketplace.json
2. Submit via marketplace portal
3. Wait for review

## Post-Publishing

1. Test installation: `npm install -g harness-coding-protocol@latest`
2. Verify CLI works: `harness --help`
3. Announce release
