# /bumba:commit - Lightweight Git Commit

## 🏁 Quick Team Checkpoint System

**Purpose**: Fast, token-efficient commits for team collaboration and adopter publishing workflows.

**Usage Examples**:

```bash
/bumba:commit                           # Auto-generated timestamp commit
/bumba:commit "Fix authentication bug"  # Custom commit message
/bumba:commit file1.js file2.py         # Commit specific files only
/bumba:commit "Add feature" src/main.js # Custom message + specific files
```

---

## **Token-Optimized Workflow**

### **1. Parse Arguments**

```bash
# Determine commit scope and message from context
ARGUMENTS="$ARGUMENTS"

# Check if arguments contain file paths
if [[ "$ARGUMENTS" =~ \.(js|py|md|json|sh|css|html)$ ]]; then
    FILES_SPECIFIED=true
    FILES=$(echo "$ARGUMENTS" | grep -oE '[^\s]*\.[a-zA-Z0-9]+')
    MESSAGE=$(echo "$ARGUMENTS" | sed -E 's/[^\s]*\.[a-zA-Z0-9]+//g' | xargs)
else
    FILES_SPECIFIED=false
    MESSAGE="$ARGUMENTS"
fi
```

### **2. Quick Status Check**

```bash
# Minimal git status for efficiency
CHANGED_FILES=$(git status --porcelain | wc -l)
if [ $CHANGED_FILES -eq 0 ]; then
    echo "🏁 No changes to commit"
    exit 0
fi

echo "🏁 Committing $CHANGED_FILES changed files..."
```

### **3. Smart Commit Process**

```bash
# Stage files based on arguments
if [ "$FILES_SPECIFIED" = true ]; then
    git add $FILES
    echo "🏁 Staged specified files: $FILES"
else
    git add -A
    echo "🏁 Staged all changes"
fi

# Generate commit message
if [ -z "$MESSAGE" ]; then
    COMMIT_MSG="Quick checkpoint: $(date '+%Y-%m-%d %H:%M')"
else
    COMMIT_MSG="$MESSAGE"
fi

# Create commit
git commit -m "$COMMIT_MSG" || {
    echo "🏁 Commit failed"
    exit 1
}

echo "🏁 Committed: $COMMIT_MSG"
```

### **4. Confirm Success**

```bash
# Show latest commit
echo "🏁 Latest commit:"
git log -1 --oneline

# Optional: Ask about push
echo ""
echo "Push to remote? Use: /bumba:publish"
```

---

## **Team Collaboration Features**

### **Agent Context Integration**

- **Lightweight checkpoints** for agent handoffs
- **File-specific commits** for focused collaboration
- **Timestamp tracking** for team coordination
- **Minimal token usage** for efficiency

### **Quality Gate Integration**

- Integrates with existing BUMBA quality hooks
- Preserves pre-commit validation
- Maintains code quality standards
- Supports team review processes

### **Adopter Publishing Support**

- Prepares commits for GitHub publishing
- Maintains professional commit history
- Supports collaborative development workflows
- Enables version control best practices

---

**🏁 Pro Tip**: Use `/bumba:commit` for quick saves during agent collaboration, `/bumba:checkpoint` for comprehensive analysis commits.
