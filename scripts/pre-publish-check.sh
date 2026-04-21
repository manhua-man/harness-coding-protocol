#!/usr/bin/env bash
set -e

echo "🔍 Pre-Publish Check for Harness Coding Protocol v2.1.0"
echo "========================================================"
echo ""

# Check 1: Build
echo "✓ Checking build..."
if [ ! -f "dist/templates/auto-detect/cli.js" ]; then
  echo "❌ Build artifacts missing. Run: npm run build"
  exit 1
fi
echo "  ✓ Build artifacts present"

# Check 2: Package version
echo "✓ Checking package version..."
VERSION=$(node -p "require('./package.json').version")
if [ "$VERSION" != "2.1.0" ]; then
  echo "❌ Version mismatch. Expected 2.1.0, got $VERSION"
  exit 1
fi
echo "  ✓ Version is 2.1.0"

# Check 3: Bin entry
echo "✓ Checking bin entry..."
BIN=$(node -p "require('./package.json').bin.harness")
if [ "$BIN" != "dist/templates/auto-detect/cli.js" ]; then
  echo "❌ Bin entry incorrect: $BIN"
  exit 1
fi
echo "  ✓ Bin entry correct"

# Check 4: Files field
echo "✓ Checking files field..."
FILES=$(node -p "JSON.stringify(require('./package.json').files)")
if [[ ! "$FILES" =~ "dist/" ]] || [[ ! "$FILES" =~ "templates/" ]]; then
  echo "❌ Files field missing required entries"
  exit 1
fi
echo "  ✓ Files field includes dist/ and templates/"

# Check 5: CHANGELOG
echo "✓ Checking CHANGELOG..."
if ! grep -q "## \[2.1.0\]" CHANGELOG.md; then
  echo "❌ CHANGELOG.md missing v2.1.0 entry"
  exit 1
fi
echo "  ✓ CHANGELOG.md has v2.1.0 entry"

# Check 6: marketplace.json
echo "✓ Checking marketplace.json..."
if ! grep -q '"version": "2.1.0"' .claude-plugin/marketplace.json; then
  echo "❌ marketplace.json version mismatch"
  exit 1
fi
echo "  ✓ marketplace.json version is 2.1.0"

# Check 7: Git status
echo "✓ Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  Warning: Uncommitted changes detected"
  git status --short
else
  echo "  ✓ Working directory clean"
fi

echo ""
echo "✅ All checks passed!"
echo ""
echo "Next steps:"
echo "  1. npm run build"
echo "  2. npm pack"
echo "  3. Test the tarball"
echo "  4. git tag -a v2.1.0 -m 'Release v2.1.0'"
echo "  5. npm publish"
