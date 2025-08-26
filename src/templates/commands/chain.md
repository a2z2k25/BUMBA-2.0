# /bumba:chain - Intelligent Command Chaining

---

allowed-tools: all
description: Start and manage intelligent command chains for multi-step workflows

---

# 🏁 /bumba:chain $ARGUMENTS$

**Intelligent Command Chaining for Complex Workflows**

## Mission

Automate complex multi-step workflows by chaining optimized commands across Product-Strategist, Design-Engineer, and Backend-Engineer agents for maximum efficiency and collaboration.

## Phase 1: Chain Initialization & Planning

```bash
# Parse arguments for chain type and feature
CHAIN_TYPE="${1:-full_development}"
FEATURE_DESC="${*:2}"

if [ -z "$FEATURE_DESC" ]; then
    FEATURE_DESC="$ARGUMENTS$"
fi

echo "🏁 BUMBA Intelligent Command Chain"
echo "==================================="
echo "Chain Type: $CHAIN_TYPE"
echo "Feature: $FEATURE_DESC"
echo ""

# Initialize command chaining system
if [ -f ~/.claude/hooks/command-chain.sh ]; then
    echo "🏁 Starting intelligent command chain..."
    CHAIN_ID=$(~/.claude/hooks/command-chain.sh start "$CHAIN_TYPE" "$FEATURE_DESC")
    echo "Chain ID: $CHAIN_ID"
    echo ""
else
    echo "🏁 Command chaining system not available"
    echo "🏁 Falling back to manual workflow guidance..."
fi
```

**Available Chain Types:**

```
🏁 full_development
   Strategy → Design → Technical Implementation
   Perfect for: New features, complete product development

🏁 design_system_creation
   Design Planning → Component Library → Frontend Architecture
   Perfect for: UI systems, component libraries

🏁 security_focused
   Security Assessment → Vulnerability Remediation → Compliance
   Perfect for: Security audits, compliance projects

🏁 rapid_prototype
   Quick Requirements → Rapid Prototyping → MVP Development
   Perfect for: Proof of concepts, quick iterations
```

## Phase 2: Intelligent Workflow Execution

```bash
# Show workflow optimization if available
if [ -f ~/.claude/hooks/intelligent-router.sh ]; then
    echo "🏁 Workflow Optimization Analysis:"
    ~/.claude/hooks/intelligent-router.sh workflow "$CHAIN_TYPE"
    echo ""
fi

# Display current chain status
if [ -f ~/.claude/hooks/command-chain.sh ] && [ -n "$CHAIN_ID" ]; then
    echo "🏁 Chain Status:"
    ~/.claude/hooks/command-chain.sh status "$CHAIN_ID"
    echo ""
fi

# Execute first step in chain
echo "🏁 Executing first step in workflow chain..."
if [ -f ~/.claude/hooks/command-chain.sh ] && [ -n "$CHAIN_ID" ]; then
    ~/.claude/hooks/command-chain.sh next "$CHAIN_ID"
else
    echo "🏁 Manual execution required - see workflow guidance below"
fi
```

**Chain Execution Flow:**

```
For automatic chain execution:
1. 🏁 Chain analyzes feature requirements
2. 🟢 Routes to optimal starting agent
3. 🏁 Executes agent-specific optimized commands
4. 🟢 Manages handoffs between agents automatically
5. 🏁 Validates quality gates at each step
6. 🏁 Tracks progress and collaboration metrics
7. 🏁 Completes with production-ready deliverable
```

## Phase 3: Manual Workflow Guidance (Fallback)

```bash
# Provide manual workflow guidance if chaining is not available
echo "🏁 Manual Workflow Guidance for: $FEATURE_DESC"
echo "=============================================="

case "$CHAIN_TYPE" in
    "full_development")
        echo "1. 🏁 /bumba:implement-strategy \"$FEATURE_DESC\""
        echo "   → Product-Strategist: Requirements and business analysis"
        echo ""
        echo "2. 🏁 /bumba:implement-design \"$FEATURE_DESC\""
        echo "   → Design-Engineer: UX/UI design and frontend planning"
        echo ""
        echo "3. 🏁 /bumba:implement-technical \"$FEATURE_DESC\""
        echo "   → Backend-Engineer: Technical implementation"
        echo ""
        echo "4. 🏁 /bumba:checkpoint \"Feature complete: $FEATURE_DESC\""
        echo "   → Final quality validation and team coordination"
        ;;

    "design_system_creation")
        echo "1. 🏁 /bumba:design \"design system planning\""
        echo "   → Design-Engineer: System architecture and planning"
        echo ""
        echo "2. 🏁 /bumba:ui \"component library\""
        echo "   → Design-Engineer: Component design and documentation"
        echo ""
        echo "3. 🏁 /bumba:implement-technical \"frontend architecture\""
        echo "   → Backend-Engineer: Technical implementation"
        ;;

    "security_focused")
        echo "1. 🟢 /bumba:scan \"security assessment\""
        echo "   → Backend-Engineer: Security vulnerability scanning"
        echo ""
        echo "2. 🟢 /bumba:secure \"vulnerability remediation\""
        echo "   → Backend-Engineer: Fix security issues"
        echo ""
        echo "3. 🏁 /bumba:implement-strategy \"compliance validation\""
        echo "   → Product-Strategist: Compliance and business validation"
        ;;

    "rapid_prototype")
        echo "1. 🏁 /bumba:requirements \"quick analysis\""
        echo "   → Product-Strategist: Rapid requirements gathering"
        echo ""
        echo "2. 🏁 /bumba:figma \"rapid prototyping\""
        echo "   → Design-Engineer: Quick prototype creation"
        echo ""
        echo "3. 🏁 /bumba:implement \"mvp development\""
        echo "   → Backend-Engineer: MVP implementation"
        ;;

    *)
        echo "Custom workflow for: $CHAIN_TYPE"
        echo "1. Start with agent best suited for initial work"
        echo "2. Use intelligent routing: ~/.claude/hooks/intelligent-router.sh route <command> \"$FEATURE_DESC\""
        echo "3. Follow handoff recommendations from team collaboration system"
        ;;
esac
```

## Phase 4: Chain Monitoring & Management

```bash
# Chain monitoring and progress tracking
echo ""
echo "🏁 Chain Monitoring & Management"
echo "================================"

# Show active chains
if [ -f ~/.claude/hooks/command-chain.sh ]; then
    echo "🏁 Active Chains:"
    ~/.claude/hooks/command-chain.sh list
    echo ""
fi

# Show collaboration metrics
if [ -f ~/.claude/hooks/collaboration-metrics.sh ]; then
    echo "🏁 Team Collaboration Metrics:"
    ~/.claude/hooks/collaboration-metrics.sh summary
    echo ""
fi

# Team status for handoff monitoring
echo "🏁 Team Status:"
~/.claude/hooks/team-collaboration.sh status 2>/dev/null || echo "Team collaboration system not initialized"
```

**Chain Management Commands:**

```bash
# Monitor chain progress
/bumba:chain status [chain_id]

# Execute next step in chain
~/.claude/hooks/command-chain.sh next <chain_id>

# Mark step as complete (if manual execution)
~/.claude/hooks/command-chain.sh complete <chain_id> <step> <agent>

# View all active chains
~/.claude/hooks/command-chain.sh list

# Chain workflow optimization
~/.claude/hooks/intelligent-router.sh workflow <chain_type>
```

---

**🏁 Pro Tips for Command Chaining:**

### Chain Selection Guide

- **full_development**: Complete features requiring all three agents
- **design_system_creation**: UI/UX focused projects with component libraries
- **security_focused**: Security audits and compliance projects
- **rapid_prototype**: Quick MVPs and proof of concepts

### Usage Examples

```bash
# Start full development chain
/bumba:chain full_development "user authentication system"

# Create design system chain
/bumba:chain design_system_creation "dashboard component library"

# Security-focused chain
/bumba:chain security_focused "API security audit"

# Rapid prototyping chain
/bumba:chain rapid_prototype "mobile app concept"
```

### Quality Benefits

- **Automated Handoffs**: Seamless agent coordination
- **Optimized Sequences**: Commands executed in optimal order
- **Quality Gates**: Built-in validation at each step
- **Progress Tracking**: Real-time workflow monitoring
- **Context Preservation**: Agent collaboration context maintained

**🏁 Remember**: Command chains automate complex workflows while maintaining the collaborative intelligence of the BUMBA agent triad. Use chains for multi-step processes that benefit from automated coordination.
