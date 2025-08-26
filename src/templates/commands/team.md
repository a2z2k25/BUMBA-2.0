# /bumba:team - Team Collaboration Status

## 🏁 Multi-Agent Team Coordination

**Purpose**: View and manage BUMBA multi-agent team collaboration, handoffs, and quality checkpoints.

**Usage Examples**:

```bash
/bumba:team                           # Show team status
/bumba:team status                    # Detailed team status
/bumba:team handoffs                  # View pending handoffs
/bumba:team history                   # Show collaboration history
/bumba:team metrics                   # Show collaboration quality metrics
/bumba:team cleanup                   # Clean old collaboration data
```

---

## **Team Status Overview**

### **1. Current Team Status**

```bash
# Initialize team collaboration system
~/.claude/hooks/team-collaboration.sh init

# Show comprehensive team status
~/.claude/hooks/team-collaboration.sh status
```

### **2. Agent Activity Monitoring**

```bash
# Check which agents are active
echo "🏁 BUMBA Agent Activity:"
echo "======================"

# Show recent agent activities from team context
if [ -f ~/.claude/team/context.json ]; then
    echo "🏁 Active Agents:"
    jq -r '.agents | to_entries[] |
        if .value.lastActive then
            "  🏁 \(.key): \(.value.lastActivity // "active") (\(.value.lastActive))"
        else
            "  🟢 \(.key): inactive"
        end' ~/.claude/team/context.json
else
    echo "  🟢 Team collaboration not initialized"
    echo "  🏁 Run: /bumba:implement-agents to start team collaboration"
fi
```

### **3. Pending Handoffs Management**

```bash
# Show pending handoffs for each agent
echo ""
echo "🟢 Pending Handoffs:"
echo "==================="

if [ -f ~/.claude/team/collaboration.json ]; then
    PENDING_COUNT=$(jq -r '.pendingHandoffs | length' ~/.claude/team/collaboration.json)

    if [ "$PENDING_COUNT" -gt 0 ]; then
        echo "🏁 $PENDING_COUNT pending handoff(s):"
        jq -r '.pendingHandoffs[] |
            "  • \(.from) → \(.to): \(.context) (Priority: \(.priority))"' \
            ~/.claude/team/collaboration.json

        echo ""
        echo "🏁 To accept a handoff:"
        echo "   ~/.claude/hooks/team-collaboration.sh accept <handoff_id> <agent_name>"
    else
        echo "  🏁 No pending handoffs"
    fi
else
    echo "  🟢 No collaboration data available"
fi
```

### **4. Quality Checkpoints Summary**

```bash
# Show recent quality checkpoints
echo ""
echo "🏁 Quality Checkpoints:"
echo "======================"

if [ -f ~/.claude/team/collaboration.json ]; then
    CHECKPOINT_COUNT=$(jq -r '.qualityCheckpoints | length' ~/.claude/team/collaboration.json)

    if [ "$CHECKPOINT_COUNT" -gt 0 ]; then
        echo "🏁 Recent checkpoints (last 5):"
        jq -r '.qualityCheckpoints | sort_by(.timestamp) | reverse | .[0:5][] |
            "  🏁 \(.agent): \(.type) - \(.results) (\(.timestamp | strftime("%Y-%m-%d %H:%M")))"' \
            ~/.claude/team/collaboration.json
    else
        echo "  🟢 No quality checkpoints recorded"
    fi
else
    echo "  🟢 No collaboration data available"
fi
```

---

## **Team Management Commands**

### **Handoff Management**

```bash
# Create a handoff between agents
create_handoff() {
    local from_agent="$1"
    local to_agent="$2"
    local context="$3"
    local priority="${4:-normal}"

    echo "🟢 Creating handoff: $from_agent → $to_agent"

    HANDOFF_ID=$(~/.claude/hooks/team-collaboration.sh handoff "$from_agent" "$to_agent" "$context" "$priority")

    if [ $? -eq 0 ]; then
        echo "🏁 Handoff created: $HANDOFF_ID"
        echo "🏁 $to_agent can accept with:"
        echo "   ~/.claude/hooks/team-collaboration.sh accept $HANDOFF_ID $to_agent"
    else
        echo "🏁 Failed to create handoff"
    fi
}

# Accept a pending handoff
accept_handoff() {
    local handoff_id="$1"
    local agent_name="$2"

    echo "🟢 Accepting handoff: $handoff_id"

    ~/.claude/hooks/team-collaboration.sh accept "$handoff_id" "$agent_name"

    if [ $? -eq 0 ]; then
        echo "🏁 Handoff accepted by $agent_name"
    else
        echo "🏁 Failed to accept handoff"
    fi
}
```

### **Quality Checkpoint Creation**

```bash
# Add quality checkpoint
add_checkpoint() {
    local agent_name="$1"
    local checkpoint_type="$2"
    local results="$3"

    echo "🏁 Adding quality checkpoint: $checkpoint_type"

    ~/.claude/hooks/team-collaboration.sh checkpoint "$agent_name" "$checkpoint_type" "$results"

    if [ $? -eq 0 ]; then
        echo "🏁 Quality checkpoint added by $agent_name"
    else
        echo "🏁 Failed to add checkpoint"
    fi
}
```

### **Team History and Analytics**

```bash
# Show collaboration history
show_history() {
    echo "🏁 Team Collaboration History:"
    echo "=============================="

    if [ -f ~/.claude/team/agent-history.json ]; then
        echo "Recent team activities:"
        jq -r '.sessions | sort_by(.timestamp) | reverse | .[0:10][] |
            if .type then
                "  \(.timestamp | strftime("%m-%d %H:%M")): \(.type) - \(.agent // "system")"
            else
                "  \(.timestamp | strftime("%m-%d %H:%M")): \(.activity) - \(.agent)"
            end' ~/.claude/team/agent-history.json 2>/dev/null || echo "  🟢 No history available"
    else
        echo "  🟢 No collaboration history found"
    fi
}
```

---

## **Advanced Team Features**

### **Agent Performance Metrics**

```bash
# Calculate agent collaboration metrics
calculate_metrics() {
    echo "🏁 Agent Collaboration Metrics:"
    echo "==============================="

    if [ -f ~/.claude/team/collaboration.json ]; then
        # Count checkpoints per agent
        echo "Quality checkpoint contributions:"
        jq -r '.qualityCheckpoints | group_by(.agent) | .[] |
            "\(.length) checkpoints: \(.[0].agent)"' \
            ~/.claude/team/collaboration.json | sort -nr

        echo ""

        # Show handoff patterns
        echo "Handoff patterns:"
        if [ -f ~/.claude/team/agent-history.json ]; then
            jq -r '.sessions[] | select(.type == "handoff_created") |
                "\(.from) → \(.to)"' ~/.claude/team/agent-history.json |
                sort | uniq -c | sort -nr | head -5
        fi
    else
        echo "  🟢 No collaboration data for metrics"
    fi
}
```

### **Team Workflow Optimization**

```bash
# Suggest workflow improvements
suggest_optimizations() {
    echo "🏁 Team Workflow Suggestions:"
    echo "============================="

    if [ -f ~/.claude/team/collaboration.json ]; then
        local pending_handoffs=$(jq -r '.pendingHandoffs | length' ~/.claude/team/collaboration.json)
        local total_checkpoints=$(jq -r '.qualityCheckpoints | length' ~/.claude/team/collaboration.json)

        if [ "$pending_handoffs" -gt 3 ]; then
            echo "  🟡  High number of pending handoffs ($pending_handoffs)"
            echo "     Consider accepting handoffs to improve team flow"
        fi

        if [ "$total_checkpoints" -lt 5 ]; then
            echo "  🏁 Consider adding more quality checkpoints"
            echo "     Use: ~/.claude/hooks/team-collaboration.sh checkpoint"
        fi

        echo "  🏁 Use /bumba:implement-agents for optimal team collaboration"
        echo "  🏁 Regular /bumba:checkpoint commands maintain team context"
        echo "  🏁 /bumba:publish integrates team work for deployment"
    else
        echo "  🏁 Initialize team collaboration with /bumba:implement-agents"
    fi
}
```

### **Team Data Management**

```bash
# Clean up old collaboration data
cleanup_data() {
    local days="${1:-30}"

    echo "🟢 Cleaning up team data older than $days days..."

    ~/.claude/hooks/team-collaboration.sh cleanup "$days"

    if [ $? -eq 0 ]; then
        echo "🏁 Team data cleanup complete"
    else
        echo "🏁 Cleanup failed"
    fi
}
```

### **Collaboration Metrics & Analytics**

```bash
# Show detailed collaboration metrics
show_collaboration_metrics() {
    echo "🏁 BUMBA Collaboration Quality Metrics"
    echo "======================================"

    if [ -f ~/.claude/hooks/collaboration-metrics.sh ]; then
        ~/.claude/hooks/collaboration-metrics.sh calculate
    else
        echo "  🟢 Collaboration metrics not available"
        echo "  🏁 Install metrics hook to enable detailed analytics"
    fi
}

# Quick metrics summary
metrics_summary() {
    echo "🏁 Quick Metrics Summary:"
    echo "========================"

    if [ -f ~/.claude/hooks/collaboration-metrics.sh ]; then
        ~/.claude/hooks/collaboration-metrics.sh summary
    else
        echo "  🟢 Metrics not available"
    fi
}

# Generate metrics report
generate_metrics_report() {
    echo "🏁 Generating collaboration metrics report..."

    if [ -f ~/.claude/hooks/collaboration-metrics.sh ]; then
        ~/.claude/hooks/collaboration-metrics.sh report
        echo "🏁 Report generated in ~/.claude/team/metrics-report.txt"
    else
        echo "🏁 Metrics hook not available"
    fi
}
```

---

## **Team Collaboration Workflow**

### **Typical Multi-Agent Session**

```bash
# 1. Start team session
/bumba:implement-agents "new user dashboard"

# 2. Monitor team progress
/bumba:team status

# 3. Handle any pending handoffs
/bumba:team handoffs

# 4. Create team checkpoint
/bumba:checkpoint "Dashboard implementation complete"

# 5. View team metrics
/bumba:team history
```

### **Agent Handoff Pattern**

```bash
# Product-Strategist completes requirements
~/.claude/hooks/team-collaboration.sh checkpoint "Product-Strategist" "requirements_complete" "User stories and acceptance criteria defined"

# Handoff to Design-Engineer
~/.claude/hooks/team-collaboration.sh handoff "Product-Strategist" "Design-Engineer" "Dashboard requirements ready for UI design"

# Design-Engineer accepts and continues
~/.claude/hooks/team-collaboration.sh accept <handoff_id> "Design-Engineer"
```

---

**🏁 Pro Tip**: Use `/bumba:team status` regularly to monitor agent collaboration and ensure smooth handoffs between Product-Strategist, Design-Engineer, and Backend-Engineer.
