# 🟢️ BUMBA Mode Command

## Purpose
Switch between different operational modes of BUMBA to optimize for different scenarios.

## Available Modes

### 🟢 Full Mode (Default)
- **All 23 specialists** active
- **Complete feature set**
- **Maximum capabilities**
- **Best for**: Production workloads, complex projects

### 🟢 Lite Mode
- **Only 3 core agents** (Designer, Engineer, Strategist)
- **Simplified validation**
- **Reduced memory footprint** (94% less)
- **Best for**: Quick prototypes, demos, learning

### 🟢️ Turbo Mode
- **Parallel execution** enabled
- **Aggressive caching**
- **Speed-optimized**
- **Best for**: Time-critical tasks, high throughput

### 🟢 Eco Mode
- **Resource-conscious** operation
- **CPU throttling** (50%)
- **Memory limited** (256MB)
- **Best for**: Raspberry Pi, containers, limited environments

## Usage

```bash
# Check current mode
/bumba:mode

# Switch to a specific mode
/bumba:mode lite
/bumba:mode turbo
/bumba:mode eco
/bumba:mode full

# Get mode recommendation
/bumba:mode recommend "quick prototype"

# View all modes
/bumba:mode list
```

## Examples

### Quick Prototype in Lite Mode
```bash
# Switch to lite mode for faster startup
/bumba:mode lite

# Develop quickly with reduced overhead
/bumba:develop "create a todo app"

# Switch back to full mode
/bumba:mode full
```

### Performance-Critical Task
```bash
# Enable turbo mode
/bumba:mode turbo

# Process large dataset with parallel execution
/bumba:implement "analyze 10000 user records"

# Mode automatically optimizes for speed
```

### Resource-Constrained Environment
```bash
# Running on Raspberry Pi
/bumba:mode eco

# BUMBA adapts to limited resources
/bumba:develop "IoT sensor dashboard"
```

## Mode Comparison

| Feature | Full | Lite | Turbo | Eco |
|---------|------|------|-------|-----|
| Agents | 23 | 3 | 23 | 15 |
| Memory | 500MB | 30MB | 600MB | 256MB |
| Startup | 3s | 0.1s | 2s | 1s |
| Features | All | Core | Most | Essential |
| Speed | Normal | Fast | Blazing | Throttled |

## Auto-Mode Selection

BUMBA can automatically switch modes based on:
- **Memory pressure**: Switches to eco mode if > 80% memory
- **Task complexity**: Uses lite mode for simple tasks
- **Time constraints**: Activates turbo for urgent deadlines

Enable auto-mode:
```bash
/bumba:settings set auto_mode true
```

## Mode Persistence

Modes persist across sessions by default. To make a mode change temporary:

```bash
# Temporary mode switch (resets on restart)
/bumba:mode lite --temporary
```

## Advanced Options

```bash
# Lite mode with custom settings
/bumba:mode lite --max-agents=2 --mock-responses=true

# Turbo mode with concurrency limit
/bumba:mode turbo --max-concurrency=20

# Eco mode with custom memory limit
/bumba:mode eco --max-memory=128
```

## Integration with Other Commands

Mode affects all BUMBA operations:
```bash
# In lite mode, this uses only 3 agents
/bumba:implement-agents "build feature"

# In turbo mode, this runs parallel analysis
/bumba:analyze "codebase"

# In eco mode, this uses minimal resources
/bumba:team coordinate
```

## Monitoring Mode Performance

```bash
# View mode-specific metrics
/bumba:metrics mode

# Compare mode performance
/bumba:benchmark modes
```

---

🟢 **Pro Tip**: Start in lite mode for exploration, switch to full mode for production work!