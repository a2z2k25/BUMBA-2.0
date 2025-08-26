#!/bin/bash

# BUMBA Emoji Audit Script
# Purpose: Find and report all emoji usage in the codebase
# Authorized emojis: 🟡 🟢 🔴 🟠 🏁

echo "=== BUMBA Emoji Audit ==="
echo ""
echo "Authorized Emojis: 🟡 🟢 🔴 🟠 🏁"
echo ""
echo "Starting comprehensive emoji scan..."
echo ""

# Create output files
AUDIT_FILE="emoji_audit.txt"
VIOLATIONS_FILE="emoji_violations.txt"
SUMMARY_FILE="emoji_summary.txt"

# Clear existing files
> "$AUDIT_FILE"
> "$VIOLATIONS_FILE"
> "$SUMMARY_FILE"

# Find all files with emojis (excluding node_modules and test files)
echo "Scanning for all emoji usage..."
grep -r "[😀-🙏🚀-🛿☀-⛿✀-➿🌀-🏿]" \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.md" \
  --include="*.json" \
  --exclude-dir="node_modules" \
  --exclude-dir="bumba-logs" \
  --exclude-dir=".git" \
  . 2>/dev/null > "$AUDIT_FILE" || true

# Count total files with emojis
TOTAL_FILES=$(cat "$AUDIT_FILE" | cut -d: -f1 | sort -u | wc -l | tr -d ' ')
echo "Files containing emojis: $TOTAL_FILES"
echo ""

# Find unauthorized emoji usage
echo "Identifying unauthorized emoji usage..."
grep -r "[😀-🙏🚀-🛿☀-⛿✀-➿🌀-🏿]" \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.md" \
  --include="*.json" \
  --exclude-dir="node_modules" \
  --exclude-dir="bumba-logs" \
  --exclude-dir=".git" \
  . 2>/dev/null | \
  grep -v "🟡\|🟢\|🔴\|🟠\|🏁" > "$VIOLATIONS_FILE" || true

# Count violations
VIOLATION_COUNT=$(cat "$VIOLATIONS_FILE" | wc -l | tr -d ' ')
echo "Unauthorized emoji violations found: $VIOLATION_COUNT"
echo ""

# Generate summary
echo "=== EMOJI AUDIT SUMMARY ===" > "$SUMMARY_FILE"
echo "Date: $(date)" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"
echo "Authorized Emojis: 🟡 🟢 🔴 🟠 🏁" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"
echo "Statistics:" >> "$SUMMARY_FILE"
echo "- Total files scanned: $(find . -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.md" -o -name "*.json" \) -not -path "./node_modules/*" -not -path "./.git/*" | wc -l | tr -d ' ')" >> "$SUMMARY_FILE"
echo "- Files with emojis: $TOTAL_FILES" >> "$SUMMARY_FILE"
echo "- Violations found: $VIOLATION_COUNT" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"

# List specific unauthorized emojis found
echo "Unauthorized emojis detected:" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"

# Extract unique unauthorized emojis
cat "$VIOLATIONS_FILE" | \
  grep -o "[😀-🙏🚀-🛿☀-⛿✀-➿🌀-🏿]" | \
  sort -u | \
  while read emoji; do
    COUNT=$(grep -F "$emoji" "$VIOLATIONS_FILE" | wc -l | tr -d ' ')
    echo "  $emoji - $COUNT occurrences" >> "$SUMMARY_FILE"
  done

echo "" >> "$SUMMARY_FILE"
echo "Top 10 files with violations:" >> "$SUMMARY_FILE"
cat "$VIOLATIONS_FILE" | cut -d: -f1 | sort | uniq -c | sort -rn | head -10 >> "$SUMMARY_FILE"

# Display summary
echo "=== TOP VIOLATIONS ==="
echo ""
echo "Top 10 files with unauthorized emojis:"
cat "$VIOLATIONS_FILE" | cut -d: -f1 | sort | uniq -c | sort -rn | head -10
echo ""

echo "=== AUDIT COMPLETE ==="
echo ""
echo "Results saved to:"
echo "  - Full audit: $AUDIT_FILE"
echo "  - Violations only: $VIOLATIONS_FILE"
echo "  - Summary report: $SUMMARY_FILE"
echo ""
echo "Next step: Review violations and create replacement mapping"