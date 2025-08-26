#!/bin/bash

# BUMBA Brand Consistency Verification Script
# Purpose: Verify that brand standards have been successfully applied

echo "=== BUMBA Brand Consistency Verification ==="
echo ""
echo "Authorized Emojis: 🟡 🟢 🔴 🟠 🏁"
echo ""

# Count authorized emoji usage
echo "📊 Authorized Emoji Usage Statistics:"
echo ""

YELLOW_COUNT=$(grep -r "🟡" --include="*.js" --include="*.jsx" --include="*.md" --exclude-dir="node_modules" --exclude-dir=".git" . 2>/dev/null | wc -l | tr -d ' ')
GREEN_COUNT=$(grep -r "🟢" --include="*.js" --include="*.jsx" --include="*.md" --exclude-dir="node_modules" --exclude-dir=".git" . 2>/dev/null | wc -l | tr -d ' ')
RED_COUNT=$(grep -r "🔴" --include="*.js" --include="*.jsx" --include="*.md" --exclude-dir="node_modules" --exclude-dir=".git" . 2>/dev/null | wc -l | tr -d ' ')
ORANGE_COUNT=$(grep -r "🟠" --include="*.js" --include="*.jsx" --include="*.md" --exclude-dir="node_modules" --exclude-dir=".git" . 2>/dev/null | wc -l | tr -d ' ')
FLAG_COUNT=$(grep -r "🏁" --include="*.js" --include="*.jsx" --include="*.md" --exclude-dir="node_modules" --exclude-dir=".git" . 2>/dev/null | wc -l | tr -d ' ')

echo "  🟡 Strategy (Yellow): $YELLOW_COUNT occurrences"
echo "  🟢 Backend (Green): $GREEN_COUNT occurrences"
echo "  🔴 Frontend (Red): $RED_COUNT occurrences"
echo "  🟠 Testing (Orange): $ORANGE_COUNT occurrences"
echo "  🏁 Completion (Flag): $FLAG_COUNT occurrences"
echo ""

TOTAL_AUTHORIZED=$((YELLOW_COUNT + GREEN_COUNT + RED_COUNT + ORANGE_COUNT + FLAG_COUNT))
echo "  Total Authorized Emojis: $TOTAL_AUTHORIZED"
echo ""

# Check for remaining violations in core files
echo "🔍 Checking Core Files for Violations:"
echo ""

CORE_VIOLATIONS=$(grep -r "[😀-🙏🚀-🛿☀-⛿✀-➿🌀-🏿]" \
  --include="*.js" \
  --exclude-dir="node_modules" \
  --exclude-dir="archived" \
  --exclude-dir="test-repo" \
  src/core 2>/dev/null | \
  grep -v "🟡\|🟢\|🔴\|🟠\|🏁" | wc -l | tr -d ' ')

echo "  Core Framework Violations: $CORE_VIOLATIONS"

if [ "$CORE_VIOLATIONS" -eq 0 ]; then
  echo "  ✓ Core framework is brand compliant!"
else
  echo "  ⚠ Core framework still has violations"
fi

# Check department files
DEPT_VIOLATIONS=$(grep -r "[😀-🙏🚀-🛿☀-⛿✀-➿🌀-🏿]" \
  --include="*.js" \
  src/core/departments 2>/dev/null | \
  grep -v "🟡\|🟢\|🔴\|🟠\|🏁" | wc -l | tr -d ' ')

echo "  Department Files Violations: $DEPT_VIOLATIONS"

if [ "$DEPT_VIOLATIONS" -eq 0 ]; then
  echo "  ✓ Department files are brand compliant!"
else
  echo "  ⚠ Department files still have violations"
fi

# Check specialist files
SPEC_VIOLATIONS=$(grep -r "[😀-🙏🚀-🛿☀-⛿✀-➿🌀-🏿]" \
  --include="*.js" \
  src/core/specialists 2>/dev/null | \
  grep -v "🟡\|🟢\|🔴\|🟠\|🏁" | wc -l | tr -d ' ')

echo "  Specialist Files Violations: $SPEC_VIOLATIONS"

if [ "$SPEC_VIOLATIONS" -eq 0 ]; then
  echo "  ✓ Specialist files are brand compliant!"
else
  echo "  ⚠ Specialist files still have violations"
fi

echo ""
echo "=== Overall Statistics ==="
echo ""

# Total violations
TOTAL_VIOLATIONS=$(grep -r "[😀-🙏🚀-🛿☀-⛿✀-➿🌀-🏿]" \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.md" \
  --exclude-dir="node_modules" \
  --exclude-dir=".git" \
  . 2>/dev/null | \
  grep -v "🟡\|🟢\|🔴\|🟠\|🏁" | wc -l | tr -d ' ')

echo "Total Remaining Violations: $TOTAL_VIOLATIONS"
echo "Previous Violations: 4,285"
REDUCTION=$((4285 - TOTAL_VIOLATIONS))
PERCENTAGE=$((REDUCTION * 100 / 4285))
echo "Violations Reduced: $REDUCTION ($PERCENTAGE%)"
echo ""

# Success determination
if [ "$CORE_VIOLATIONS" -eq 0 ] && [ "$DEPT_VIOLATIONS" -eq 0 ] && [ "$SPEC_VIOLATIONS" -eq 0 ]; then
  echo "🏁 SUCCESS: Core system is fully brand compliant!"
  echo ""
  echo "All critical components are using only the approved emojis:"
  echo "🟡 🟢 🔴 🟠 🏁"
  exit 0
else
  echo "🟠 PARTIAL SUCCESS: Core violations remain but significant progress made"
  echo ""
  echo "Remaining work needed in:"
  [ "$CORE_VIOLATIONS" -gt 0 ] && echo "  - Core framework files"
  [ "$DEPT_VIOLATIONS" -gt 0 ] && echo "  - Department files"
  [ "$SPEC_VIOLATIONS" -gt 0 ] && echo "  - Specialist files"
  exit 1
fi