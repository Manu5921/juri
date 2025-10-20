#!/bin/bash

# 🔍 DIFF-BASED REVIEW GENERATOR - V5.2
#
# Generates a concise patch file for efficient code review (10× faster than full files)
#
# Philosophy:
# - Review CHANGES, not entire codebase
# - 50 lines patch vs 1000+ lines files = -95% tokens
# - Human/AI supervisor focuses on what matters
#
# Usage:
#   ./scripts/generate-review-patch.sh [checkpoint-number]
#
# Output:
#   changes-for-review-TX.patch (where X = checkpoint number)

set -e

# ============================================
# CONFIGURATION
# ============================================

CHECKPOINT_NUM="${1:-000}"
OUTPUT_DIR="reviews"
PATCH_FILE="${OUTPUT_DIR}/changes-for-review-T${CHECKPOINT_NUM}.patch"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# FUNCTIONS
# ============================================

print_header() {
    echo -e "${BLUE}=================================================${NC}"
    echo -e "${BLUE}🔍 Diff-Based Review Generator - V5.2${NC}"
    echo -e "${BLUE}=================================================${NC}"
    echo ""
}

# ============================================
# MAIN
# ============================================

print_header

# Create reviews directory if not exists
mkdir -p "$OUTPUT_DIR"

# Check if git is initialized
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Git not initialized - initializing now...${NC}"
    git init
    git add .
    git commit -m "chore: initial commit for diff tracking" --no-verify || true
    echo ""
fi

# Stage all current changes
echo -e "${YELLOW}▶ Staging current changes...${NC}"
git add .
echo -e "${GREEN}✅ Changes staged${NC}"
echo ""

# Generate diff patch
echo -e "${YELLOW}▶ Generating diff patch...${NC}"
git diff --staged > "$PATCH_FILE"

# Calculate stats
LINES_CHANGED=$(wc -l < "$PATCH_FILE" | tr -d ' ')
FILES_CHANGED=$(git diff --staged --name-only | wc -l | tr -d ' ')

echo -e "${GREEN}✅ Patch generated successfully!${NC}"
echo ""

# Display summary
echo -e "${BLUE}📊 Summary:${NC}"
echo "   - Files changed: $FILES_CHANGED"
echo "   - Lines in patch: $LINES_CHANGED"
echo "   - Output: $PATCH_FILE"
echo ""

# Preview patch (first 20 lines)
echo -e "${BLUE}📄 Patch Preview (first 20 lines):${NC}"
echo -e "${BLUE}=================================================${NC}"
head -20 "$PATCH_FILE"
echo -e "${BLUE}=================================================${NC}"
echo ""

# Generate review summary
SUMMARY_FILE="${OUTPUT_DIR}/review-summary-T${CHECKPOINT_NUM}.md"

cat > "$SUMMARY_FILE" << EOF
# Code Review - Checkpoint T${CHECKPOINT_NUM}

**Generated:** $(date)
**Files Changed:** $FILES_CHANGED
**Lines Changed:** $LINES_CHANGED

## Review Instructions

1. **Read the patch:** \`$PATCH_FILE\`
2. **Focus on:**
   - Logic correctness
   - Security issues
   - Code quality (TypeScript strict, no \`any\`)
   - Design token usage (no hardcoded colors)
   - Memory documentation (significant decisions)

3. **Validation:**
   - Run \`./validate.sh --strict\` for automated checks
   - Review MCP tool usage (Context7, ESLint calls)
   - Verify task tracking updated

## Patch File

\`\`\`diff
$(cat "$PATCH_FILE")
\`\`\`

## Next Steps

- [ ] Review approved → Continue implementation
- [ ] Issues found → Document + Fix + Re-generate patch
- [ ] Critical issues → STOP + Escalate

---

**V5.2 Diff-Based Review System** - 10× faster than full file review
EOF

echo -e "${GREEN}✅ Review summary generated: $SUMMARY_FILE${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "   1. Review patch: cat $PATCH_FILE"
echo "   2. Review summary: cat $SUMMARY_FILE"
echo "   3. Approve → Continue implementation"
echo "   4. Reject → Fix issues + Re-run"
echo ""
