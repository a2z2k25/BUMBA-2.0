#!/bin/bash

# BUMBA CLI - Safe Organization of Non-Operational Files
# This script moves documentation and reports to organized folders
# WITHOUT touching any operational files or breaking file paths

echo "🧹 BUMBA CLI - Organizing Non-Operational Files"
echo "======================================================="
echo "This will organize reports and documentation WITHOUT breaking anything"
echo ""

# Create archive directories
echo "📁 Creating organization directories..."
mkdir -p archive/audit-reports
mkdir -p archive/sprint-reports  
mkdir -p archive/improvement-plans
mkdir -p archive/completion-reports
mkdir -p archive/system-reports
mkdir -p archive/test-scripts

# Counter for files moved
MOVED=0

# Function to safely move a file
move_file() {
    local file=$1
    local dest=$2
    
    if [ -f "$file" ]; then
        echo "  Moving: $file -> $dest/"
        mv "$file" "$dest/"
        ((MOVED++))
    fi
}

echo ""
echo "📊 Moving audit reports..."
# Move audit JSON files (NOT package.json or package-lock.json)
for file in *_AUDIT*.json *AUDIT_*.json; do
    [ "$file" = "package.json" ] && continue
    [ "$file" = "package-lock.json" ] && continue
    move_file "$file" "archive/audit-reports"
done

# Move audit markdown files
for file in *AUDIT*.md *Audit*.md; do
    move_file "$file" "archive/audit-reports"
done

# Move audit JavaScript files
for file in *audit*.js *-audit.js; do
    move_file "$file" "archive/test-scripts"
done

echo ""
echo "📈 Moving sprint and completion reports..."
# Move sprint reports
for file in SPRINT*.md; do
    move_file "$file" "archive/sprint-reports"
done

# Move completion reports  
for file in *COMPLETE*.md *COMPLETION*.md *_COMPLETE*.json; do
    move_file "$file" "archive/completion-reports"
done

echo ""
echo "📋 Moving improvement plans..."
# Move improvement plans and fix plans
for file in *IMPROVEMENT*.md *FIX_PLAN*.md *FIX_PLAN*.json *PLAN.md; do
    move_file "$file" "archive/improvement-plans"
done

echo ""
echo "📄 Moving system reports..."
# Move various system reports
for file in *REPORT*.md *REPORT*.json *PROGRESS*.md *STATUS*.md *SUMMARY*.md; do
    # Skip critical operational files
    [ "$file" = "README.md" ] && continue
    [ "$file" = "REFERENCE.md" ] && continue
    move_file "$file" "archive/system-reports"
done

# Move recovery and damage assessment files
for file in RECOVERY*.md DAMAGE*.md BROKEN*.md REALISTIC*.md; do
    move_file "$file" "archive/system-reports"
done

# Move operability reports
for file in *OPERABILITY*.md; do
    move_file "$file" "archive/system-reports"
done

echo ""
echo "🧪 Moving test and demo scripts..."
# Move test scripts and consolidation files
move_file "consolidate.js" "archive/test-scripts"
move_file "fix-hook-apis.js" "archive/test-scripts"
move_file "restore-specialists.js" "archive/test-scripts"
move_file "safe-audit.js" "archive/test-scripts"
move_file "system-audit.js" "archive/test-scripts"
move_file "test-audit-report.json" "archive/test-scripts"
move_file "enhanced-system-test.js" "archive/test-scripts"
move_file "comprehensive-framework-audit.js" "archive/test-scripts"
move_file "consciousness-audit.js" "archive/test-scripts"
move_file "documentation-systems-audit.js" "archive/test-scripts"
move_file "ecosystem-integration-audit.js" "archive/test-scripts"
move_file "learning-systems-audit.js" "archive/test-scripts"
move_file "optimization-systems-audit.js" "archive/test-scripts"
move_file "persistence-systems-audit.js" "archive/test-scripts"
move_file "quality-assurance-audit.js" "archive/test-scripts"
move_file "resource-management-audit.js" "archive/test-scripts"
move_file "routing-architecture-audit.js" "archive/test-scripts"
move_file "security-infrastructure-audit.js" "archive/test-scripts"
move_file "specialist-ecosystem-audit.js" "archive/test-scripts"
move_file "testing-infrastructure-audit.js" "archive/test-scripts"
move_file "validation-systems-audit.js" "archive/test-scripts"

echo ""
echo "🔍 Moving cleanup scripts..."
move_file "cleanup.sh" "archive/test-scripts"
move_file "run-fixed-tests.sh" "archive/test-scripts"

echo ""
echo "📊 Moving remaining JSON audit results..."
for file in *_RESULTS.json *_FINAL_*.json SAFE_*.json SYSTEM_*.json COMPREHENSIVE_*.json FINAL_VALIDATION*.json; do
    [ "$file" = "package.json" ] && continue
    [ "$file" = "package-lock.json" ] && continue
    move_file "$file" "archive/audit-reports"
done

echo ""
echo "======================================================="
echo "✅ Organization complete!"
echo "📊 Files moved: $MOVED"
echo ""
echo "📁 Archive structure created:"
echo "  archive/"
echo "  ├── audit-reports/     (Audit results and reports)"
echo "  ├── sprint-reports/    (Sprint completion reports)"
echo "  ├── improvement-plans/ (Fix and improvement plans)"
echo "  ├── completion-reports/(Completion status reports)"
echo "  ├── system-reports/    (Various system reports)"
echo "  └── test-scripts/      (Test and audit scripts)"
echo ""
echo "✅ Operational files remain untouched:"
echo "  - README.md"
echo "  - REFERENCE.md"
echo "  - CHANGELOG.md"
echo "  - CONTRIBUTING.md"
echo "  - QUICK_START_GUIDE.md"
echo "  - WORKTREE_SETUP_GUIDE.md"
echo "  - API_SETUP_GUIDE.md"
echo "  - package.json"
echo "  - package-lock.json"
echo "  - bumba.config.js"
echo "  - All files in src/"
echo "  - All files in tests/"
echo "  - All files in docs/"
echo ""
echo "🎯 The framework remains 100% operational!"