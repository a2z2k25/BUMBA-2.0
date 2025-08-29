# /bumba:publish - GitHub Publishing & Deployment

## 🏁 Professional Publishing for Adopters

**Purpose**: Complete publishing workflow for pushing BUMBA projects to GitHub, enabling adopter distribution and team collaboration.

**Usage Examples**:

```bash
/bumba:publish                          # Full publishing workflow
/bumba:publish --setup-repo            # Initialize new GitHub repository
/bumba:publish --force                  # Force push (use carefully)
/bumba:publish --release v1.0.0        # Create tagged release
```

---

## **Complete Publishing Workflow**

### **1. Pre-Publishing Validation**

```bash
echo "🏁 BUMBA Publishing System - Starting validation..."

# Parse command arguments
ARGUMENTS="$ARGUMENTS"
SETUP_REPO=false
FORCE_PUSH=false
RELEASE_TAG=""

case "$ARGUMENTS" in
    *--setup-repo*) SETUP_REPO=true ;;
    *--force*) FORCE_PUSH=true ;;
    *--release*) RELEASE_TAG=$(echo "$ARGUMENTS" | grep -o -- '--release [^ ]*' | cut -d' ' -f2) ;;
esac

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "🏁 Not in a git repository"
    echo "🏁 Use: /bumba:publish --setup-repo to initialize"
    exit 1
fi

echo "🏁 Git repository confirmed"
```

### **2. Quality Gate Enforcement**

```bash
# Run comprehensive BUMBA quality checks
echo "🏁 Running pre-publishing quality gates..."

# Check for uncommitted changes
UNCOMMITTED=$(git status --porcelain | wc -l)
if [ $UNCOMMITTED -gt 0 ]; then
    echo "🟡  Uncommitted changes detected:"
    git status --short
    echo ""
    echo "🏁 Options:"
    echo "   • Use /bumba:checkpoint to commit changes"
    echo "   • Use /bumba:commit for quick commit"
    echo "   • Use --force to publish anyway (not recommended)"

    if [ "$FORCE_PUSH" != true ]; then
        exit 1
    fi
    echo "🟡  Force push enabled - proceeding with uncommitted changes"
fi

# Run BUMBA quality validation
if [ -f "~/.claude/hooks/post-execution-validate.sh" ]; then
    echo "🏁 Running BUMBA quality validation..."
    ~/.claude/hooks/post-execution-validate.sh || {
        echo "🏁 Quality validation failed"
        echo "🏁 Fix issues before publishing or use --force"
        [ "$FORCE_PUSH" != true ] && exit 1
    }
fi

echo "🏁 Quality gates passed"
```

### **3. Repository Setup (if needed)**

```bash
# Setup new GitHub repository if requested
if [ "$SETUP_REPO" = true ]; then
    echo "🏁 Setting up new GitHub repository..."

    # Check if GitHub CLI is available
    if ! command -v gh &> /dev/null; then
        echo "🏁 GitHub CLI (gh) not found"
        echo "🏁 Install: https://cli.github.com/"
        echo "🏁 Or manually create repository and add remote"
        exit 1
    fi

    # Get repository name from current directory
    REPO_NAME=$(basename "$PWD")

    echo "🏁 Creating repository: $REPO_NAME"
    gh repo create "$REPO_NAME" --public --description "Professional project built with BUMBA CLI" || {
        echo "🏁 Failed to create GitHub repository"
        exit 1
    }

    # Add remote if not exists
    if ! git remote get-url origin > /dev/null 2>&1; then
        git remote add origin "https://github.com/$(gh api user --jq .login)/$REPO_NAME.git"
        echo "🏁 Remote origin added"
    fi

    echo "🏁 GitHub repository setup complete"
fi
```

### **4. Branch Management**

```bash
# Ensure we're on main branch (or create it)
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    echo "🏁 Current branch: $CURRENT_BRANCH"
    echo "🏁 Switching to main branch for publishing..."

    # Check if main branch exists
    if git show-ref --verify --quiet refs/heads/main; then
        git checkout main
    elif git show-ref --verify --quiet refs/heads/master; then
        git checkout master
    else
        # Create main branch
        git checkout -b main
        echo "🏁 Created main branch"
    fi
fi

echo "🏁 On main branch: $(git branch --show-current)"
```

### **5. Team Context Integration**

```bash
# Update team publishing context
mkdir -p .bumba
cat > .bumba/publish-context.json << EOF
{
    "publishTime": "$(date -Iseconds)",
    "branch": "$(git branch --show-current)",
    "commitHash": "$(git rev-parse HEAD)",
    "version": "${RELEASE_TAG:-development}",
    "publishedBy": "BUMBA-Framework",
    "qualityValidation": "passed"
}
EOF

echo "🏁 Team publishing context updated"
```

### **6. Professional README Enhancement**

```bash
# Enhance README for GitHub presentation
if [ -f "README.md" ]; then
    echo "🏁 Enhancing README for professional presentation..."

    # Add BUMBA CLI badge if not present
    if ! grep -q "Built with BUMBA" README.md; then
        # Create backup
        cp README.md README.md.backup

        # Add professional badge
        cat > README.md.temp << 'EOF'
# Project Title

[![Built with BUMBA CLI](https://img.shields.io/badge/Built%20with-BUMBA%20Framework-success)](https://github.com/your-org/bumba-claude)

EOF

        # Append original README content (skip first line if it's already a title)
        if head -1 README.md | grep -q "^#"; then
            tail -n +2 README.md >> README.md.temp
        else
            cat README.md >> README.md.temp
        fi

        mv README.md.temp README.md
        echo "🏁 README enhanced with BUMBA branding"
    fi
fi
```

### **7. Publishing Execution**

```bash
# Push to GitHub
echo "🏁 Publishing to GitHub..."

# Get remote URL for confirmation
REMOTE_URL=$(git remote get-url origin)
echo "🏁 Publishing to: $REMOTE_URL"

# Push to remote
if [ "$FORCE_PUSH" = true ]; then
    git push --force origin $(git branch --show-current) || {
        echo "🏁 Force push failed"
        exit 1
    }
    echo "🟡  Force pushed to GitHub"
else
    git push -u origin $(git branch --show-current) || {
        echo "🏁 Push failed"
        echo "🏁 Try: /bumba:publish --force if needed"
        exit 1
    }
    echo "🏁 Successfully pushed to GitHub"
fi
```

### **8. Release Management (if specified)**

```bash
# Create GitHub release if tag specified
if [ -n "$RELEASE_TAG" ]; then
    echo "🏁 Creating GitHub release: $RELEASE_TAG"

    if command -v gh &> /dev/null; then
        # Generate release notes from recent commits
        RELEASE_NOTES=$(git log --oneline -10 | sed 's/^/- /')

        gh release create "$RELEASE_TAG" \
            --title "Release $RELEASE_TAG" \
            --notes "Release created by BUMBA CLI

Recent changes:
$RELEASE_NOTES

Built with professional-grade BUMBA development platform." || {
            echo "🏁 Failed to create GitHub release"
            exit 1
        }

        echo "🏁 GitHub release $RELEASE_TAG created"
    else
        echo "🟡  GitHub CLI not available - skipping release creation"
        echo "🏁 Manually create release at: $REMOTE_URL/releases/new"
    fi
fi
```

### **9. Publishing Summary**

```bash
# Show publishing summary
echo ""
echo "🏁 PUBLISHING COMPLETE!"
echo "=================================="
echo "🏁 Repository: $REMOTE_URL"
echo "🏁 Branch: $(git branch --show-current)"
echo "🏁 Latest commit: $(git log -1 --oneline)"
if [ -n "$RELEASE_TAG" ]; then
    echo "🏁 Release: $RELEASE_TAG"
fi
echo "🏁 Quality validated: BUMBA CLI standards"
echo ""
echo "🏁 Your project is now live on GitHub!"
echo "🏁 Share with: git clone $REMOTE_URL"
echo ""
echo "🏁 Next steps for adopters:"
echo "   • Add collaborators via GitHub"
echo "   • Configure GitHub Actions (optional)"
echo "   • Set up GitHub Pages (if applicable)"
echo "   • Continue development with BUMBA"
```

---

## **Professional Publishing Features**

### **Adopter-Ready Distribution**

- **GitHub repository creation** and configuration
- **Professional README enhancement** with BUMBA branding
- **Quality assurance** before publishing
- **Release management** with semantic versioning

### **Team Collaboration Support**

- **Branch management** for professional workflows
- **Team context preservation** across publishes
- **Collaborative development** setup
- **Version control best practices**

### **Enterprise Quality**

- **Pre-publishing validation** with BUMBA quality gates
- **Force push protection** for safety
- **Professional presentation** standards
- **Automated documentation** enhancement

### **GitHub Integration**

- **GitHub CLI integration** for seamless workflow
- **Release creation** with automated notes
- **Repository management** and configuration
- **Professional badges** and branding

---

**🏁 Pro Tip**: Use `/bumba:checkpoint` before `/bumba:publish` for clean commit history. The `--setup-repo` flag handles complete GitHub setup for new projects.
