#!/usr/bin/env bash
set -e

echo "🚀 Publishing Harness Coding Protocol v2.1.0"
echo "============================================="
echo ""

# Step 1: Pre-publish check
echo "Step 1: Running pre-publish checks..."
bash scripts/pre-publish-check.sh
echo ""

# Step 2: Build
echo "Step 2: Building project..."
npm run build
echo "✓ Build complete"
echo ""

# Step 3: Pack and test
echo "Step 3: Creating package tarball..."
npm pack
echo "✓ Tarball created: harness-coding-protocol-2.1.0.tgz"
echo ""

# Step 4: Dry run
echo "Step 4: Running npm publish dry-run..."
npm publish --dry-run
echo "✓ Dry run complete"
echo ""

# Step 5: Confirm
echo "Ready to publish to npm?"
echo "This will:"
echo "  - Publish harness-coding-protocol@2.1.0 to npm"
echo "  - Make it publicly available"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Publish cancelled"
  exit 1
fi

# Step 6: Publish
echo ""
echo "Step 5: Publishing to npm..."
npm publish
echo "✓ Published to npm"
echo ""

# Step 7: Verify
echo "Step 6: Verifying publication..."
npm view harness-coding-protocol@2.1.0
echo ""

echo "✅ Publication complete!"
echo ""
echo "Next steps:"
echo "  1. Create git tag: git tag -a v2.1.0 -m 'Release v2.1.0'"
echo "  2. Push tag: git push origin v2.1.0"
echo "  3. Create GitHub Release with RELEASE_NOTES_v2.1.0.md"
echo ""
