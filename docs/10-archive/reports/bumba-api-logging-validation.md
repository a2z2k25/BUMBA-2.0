# BUMBA API Call Logging & Validation 🟢

## Complete Solution for Tracking Parallel Execution

You now have a comprehensive API call logging system that tracks and validates parallel execution in real-time!

## Features

### 1. **Automatic Logging**
Every API call is automatically logged with:
- Execution ID (links parallel calls together)
- Agent name and model used
- Timestamp and duration
- Token usage and cost
- Success/failure status
- Parallel vs sequential execution

### 2. **Log Files Created**
```
bumba-logs/
├── api-calls-2024-08-09T10-30-45.json   # Detailed JSON log
└── api-calls-summary.txt                # Human-readable summary
```

### 3. **Real-Time Console Output**
When running BUMBA commands, you'll see:
```
🟢 PARALLEL EXECUTION STARTED [exec_1234567_abc]
   Tasks: 4 agents executing in parallel
   - architect (claude)
   - developer (claude)
   - reviewer (claude)
   - tester (claude)

🏁 PARALLEL EXECUTION COMPLETE [exec_1234567_abc]
   Success: 4/4
   Duration: 3250ms
   Cost: $0.0450
```

## How to Use

### View Logs Commands

```bash
# View summary of current session
npm run logs:summary

# List all available log files
npm run logs:list

# Analyze a specific log file
npm run logs analyze api-calls-2024-08-09T10-30-45.json

# Watch logs in real-time
npm run logs:watch
```

### Example Log Output

#### Summary Report
```
=====================================
BUMBA API CALL SUMMARY REPORT
=====================================

Session ID: session_1723456789_x7y8z9
Start Time: 2024-08-09T10:30:45.123Z
Duration: 45.3 seconds

API CALLS:
----------
Total API Calls: 23
Parallel Groups: 5
Sequential Calls: 3

PARALLEL EXECUTION:
------------------
Total Parallel Executions: 5
Average Parallel Size: 4.2 agents
Maximum Parallel Size: 5 agents

MODEL USAGE:
-----------
Claude: 23 calls
GPT-4: 0 calls
Gemini: 0 calls

LOG FILES:
----------
Detailed Log: bumba-logs/api-calls-2024-08-09T10-30-45.json
Summary File: bumba-logs/api-calls-summary.txt
=====================================
```

#### Detailed JSON Log Entry
```json
{
  "type": "PARALLEL_EXECUTION_START",
  "executionId": "exec_1723456789_abc123",
  "timestamp": "2024-08-09T10:30:45.123Z",
  "taskCount": 4,
  "tasks": [
    {
      "agent": "architect",
      "model": "claude",
      "preview": "Design the authentication system with..."
    },
    {
      "agent": "developer",
      "model": "claude",
      "preview": "Implement the authentication system using..."
    },
    {
      "agent": "reviewer",
      "model": "claude",
      "preview": "Review the authentication implementation for..."
    },
    {
      "agent": "tester",
      "model": "claude",
      "preview": "Test the authentication system for..."
    }
  ]
}
```

## Validation Points

### 🏁 Confirming Parallel Execution

Look for these indicators in your logs:

1. **Multiple agents with same executionId**
   - All parallel agents share the same execution ID
   - Sequential calls have different IDs

2. **Timing overlap**
   - Parallel calls have overlapping timestamps
   - Duration should be roughly the same as slowest call

3. **PARALLEL_EXECUTION_START entries**
   - Shows exactly which agents ran together
   - Lists the number of parallel tasks

4. **Cost aggregation**
   - Total cost equals sum of all parallel calls
   - Shows you're paying for multiple simultaneous calls

### Example Validation

```bash
# Run a parallel command
/bumba:orchestrate build authentication

# Check the logs
npm run logs:summary

# You should see:
# - PARALLEL_EXECUTION_START with 4 agents
# - 4 API_CALL entries with same executionId
# - PARALLEL_EXECUTION_COMPLETE showing success
```

## Log File Structure

### JSON Log Format
```json
{
  "session": "session_1723456789_abc",
  "startTime": "2024-08-09T10:30:00.000Z",
  "entries": [
    {
      "type": "PARALLEL_EXECUTION_START",
      "executionId": "exec_123",
      "tasks": [...]
    },
    {
      "type": "API_CALL",
      "executionId": "exec_123",
      "agent": "architect",
      "parallel": true,
      "duration": 3250,
      "tokens": 1500,
      "cost": 0.0125
    },
    {
      "type": "API_CALL",
      "executionId": "exec_123",
      "agent": "developer",
      "parallel": true,
      "duration": 3180,
      "tokens": 1400,
      "cost": 0.0115
    },
    {
      "type": "PARALLEL_EXECUTION_COMPLETE",
      "executionId": "exec_123",
      "successCount": 4,
      "totalDuration": 3250,
      "totalCost": 0.0450
    }
  ]
}
```

## Mode-Specific Logging

### Parallel Modes (Logged)
- **Orchestrate**: 4 waves of parallel agents
- **Swarm**: 5 parallel perspectives
- **Adversarial**: 4 parallel debaters
- **Turbo**: 5 parallel executors
- **Team**: 3 parallel departments

### Sequential Mode (Logged Differently)
- **LITE Mode**: Single API call, marked as sequential
- Shows `"parallel": false` in logs
- No PARALLEL_EXECUTION_START entries

## Implementation Details

### Files Created

1. **`api-call-logger.js`** - Core logging system
   - Tracks all API calls
   - Groups parallel executions
   - Generates reports

2. **`api-log-viewer.js`** - CLI tool for viewing logs
   - Summary command
   - List command
   - Analyze command
   - Watch command

3. **Integration Points**
   - `parallel-agent-system.js` - Logs all parallel calls
   - `package.json` - NPM scripts for easy access

## Benefits

1. **Transparency** - See exactly what's happening
2. **Validation** - Confirm parallel execution works
3. **Cost Tracking** - Monitor API spending
4. **Debugging** - Identify failed calls
5. **Performance** - Measure execution times
6. **Audit Trail** - Complete history of API usage

## Quick Test

```bash
# 1. Run a parallel command
/bumba:swarm optimize database

# 2. Check the logs immediately
npm run logs:summary

# 3. You'll see:
# - 5 agents executed in parallel
# - Same execution ID for all
# - Total duration ≈ longest individual call
# - Cost breakdown per agent
```

## Troubleshooting

### No Logs Appearing?
- Check `bumba-logs/` directory exists
- Ensure write permissions
- Verify API logger is initialized

### Want Real-Time Monitoring?
```bash
# Terminal 1: Watch logs
npm run logs:watch

# Terminal 2: Run BUMBA commands
/bumba:orchestrate feature
```

### Need More Detail?
```bash
# Get the latest log file
npm run logs:list

# Analyze it
npm run logs analyze [filename]
```

## Summary

You now have **complete visibility** into BUMBA's parallel execution:
- Every API call is logged
- Parallel groups are clearly identified
- Real-time console output shows progress
- Historical logs for analysis
- Cost tracking built-in
- Easy CLI commands to view logs

This validates that **parallel execution is real** - you can see multiple Claude agents executing simultaneously with shared execution IDs and overlapping timestamps!

---

*BUMBA API Call Logging - Complete Transparency for Parallel Execution*