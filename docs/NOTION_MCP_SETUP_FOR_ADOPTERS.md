# BUMBA Notion MCP Integration - Setup Guide for Adopters

## Overview

BUMBA is **pre-configured** to work with Notion MCP but does **NOT** include any personal accounts or API keys. This guide helps future adopters connect their own Notion workspace.

## Current Architecture Status

### ✅ What's Already Built

1. **Notion MCP Bridge** (`src/core/mcp/notion-mcp-bridge.js`)
   - Auto-detects MCP server availability
   - Falls back to API mode if MCP unavailable
   - Falls back to local simulation if neither configured
   - No hardcoded credentials

2. **Integration Config** (`src/core/config/integration-config.js`)
   - Reads from environment variables
   - No default API keys
   - Safe fallback behavior

3. **Unified Dashboard**
   - Ready to publish metrics to Notion
   - Chart generation prepared
   - Event-driven updates ready

4. **Data Flow Pipeline**
   ```
   16 Data Sources → Unified Dashboard → Notion MCP Bridge → Your Notion
   ```

### ⚠️ What's Missing/Needs Improvement

1. **MCP Server Detection** - Currently returns `false` always
2. **Chart Generation** - Component library integration not complete
3. **Auto-setup Wizard** - No interactive configuration tool
4. **Testing Without Credentials** - Limited mock testing

## Setup Instructions for Adopters

### Step 1: Environment Configuration

Create a `.env` file in your BUMBA root directory:

```bash
# Notion Configuration (Add your own credentials)
NOTION_ENABLED=true
NOTION_API_KEY=your_secret_key_here
NOTION_DATABASE_ID=your_database_id_here
NOTION_WORKSPACE_ID=your_workspace_id_here

# Optional: Notion MCP Server
NOTION_MCP_ENABLED=true
NOTION_MCP_SERVER_URL=http://localhost:3000  # If using local MCP server

# Dashboard Publishing Settings
NOTION_AUTO_PUBLISH=true
NOTION_PUBLISH_INTERVAL=3600000  # 1 hour (default)
NOTION_CHART_EMBEDDING=true
```

### Step 2: Notion Workspace Setup

1. **Create Integration**
   ```
   1. Go to: https://www.notion.so/my-integrations
   2. Click "New integration"
   3. Name it: "BUMBA Dashboard"
   4. Select your workspace
   5. Copy the "Internal Integration Token"
   ```

2. **Create Dashboard Database**
   ```
   1. Create new Notion page: "BUMBA Dashboard"
   2. Add a database with these properties:
      - Timestamp (Date)
      - Source (Select)
      - Metric (Title)
      - Value (Number)
      - Category (Select)
      - Status (Select)
   3. Share page with your integration
   4. Copy database ID from URL
   ```

### Step 3: MCP Server Setup (Optional but Recommended)

If you want to use Notion MCP server for better integration:

1. **Install Notion MCP Server**
   ```bash
   npm install -g @modelcontextprotocol/server-notion
   ```

2. **Configure MCP in Claude Desktop**
   ```json
   {
     "mcpServers": {
       "notion": {
         "command": "npx",
         "args": ["@modelcontextprotocol/server-notion"],
         "env": {
           "NOTION_API_KEY": "your_api_key_here"
         }
       }
     }
   }
   ```

3. **BUMBA Will Auto-Detect**
   - The bridge automatically detects MCP availability
   - Falls back to API mode if MCP unavailable

### Step 4: Test Connection

```bash
# Test Notion connection
node -e "
const { NotionMCPBridge } = require('./src/core/mcp/notion-mcp-bridge');
const bridge = new NotionMCPBridge();
bridge.on('ready', (status) => {
  console.log('Notion Status:', status);
  process.exit(0);
});
"

# Test dashboard publishing
node -e "
const { getUnifiedDashboard } = require('./src/core/dashboard/unified-dashboard-manager');
const dashboard = getUnifiedDashboard();
dashboard.initialize().then(() => {
  dashboard.publishToNotion();
});
"
```

## Integration Points

### 1. Dashboard Publishing

The unified dashboard can publish all metrics:

```javascript
// This happens automatically when configured
dashboard.publishToNotion() → {
  - Collects from 16 sources
  - Formats for Notion
  - Creates/updates pages
  - Embeds charts
}
```

### 2. Chart Generation

BUMBA components ready for embedding:
- RunChart → Line graphs
- GaugeChart → Circular gauges  
- ProgressBar → Horizontal bars
- Sparkline → Mini charts
- StatusGrid → Status indicators

### 3. Real-time Updates

```javascript
// Automatic updates every hour (default)
dashboard.on('refresh', async (metrics) => {
  if (config.notion.enabled) {
    await notionBridge.updateDashboard(metrics);
  }
});

// Manual sync on demand
await notionPublisher.manualSync();  // User-triggered update
```

## Security Best Practices

### ✅ DO's
- Store API keys in `.env` file
- Add `.env` to `.gitignore`
- Use environment variables
- Enable MCP server for better security
- Rotate API keys regularly

### ❌ DON'Ts
- Never commit API keys to git
- Don't hardcode credentials
- Don't share integration tokens
- Don't expose database IDs publicly

## Troubleshooting

### Connection Issues

```javascript
// Check connection status
const bridge = new NotionMCPBridge();
console.log(bridge.getStatus());
// Expected: { mcp: 'ready' | 'unavailable', api: 'ready' | 'unavailable', mode: 'mcp' | 'api' | 'local' }
```

### Publishing Failures

```javascript
// Check queued operations
const queued = bridge.getQueuedOperations();
console.log(`${queued.length} operations pending`);
```

### MCP Server Not Detected

1. Verify MCP server is running
2. Check environment variables
3. Test with direct API mode first
4. Review logs in `~/.bumba/logs/`

## Testing Without Notion Account

BUMBA includes simulation mode:

```bash
# Run in simulation mode (no Notion required)
NOTION_ENABLED=false npm start

# Metrics are stored locally in:
# ~/.bumba/simulated-notion/
```

## API Reference

### NotionMCPBridge Methods

```javascript
// Task Management
await bridge.createTask(taskData);
await bridge.updateTask(taskId, updates);
await bridge.findTask(criteria);

// Dashboard Updates
await bridge.updateDashboard(metrics);

// Knowledge Base
await bridge.createKnowledgePage(pageData);
await bridge.findKnowledgeEntry(criteria);

// Status
bridge.getStatus();
bridge.getQueuedOperations();
```

## Roadmap for Full Integration

1. **Phase 1** (Current)
   - ✅ Bridge architecture
   - ✅ Environment configuration
   - ✅ Fallback modes

2. **Phase 2** (Needed)
   - [ ] MCP server auto-detection
   - [ ] Interactive setup wizard
   - [ ] Chart component integration
   - [ ] Batch operations

3. **Phase 3** (Future)
   - [ ] Two-way sync
   - [ ] Webhook support
   - [ ] Custom templates
   - [ ] Multi-workspace support

## Support

For integration help:
1. Check logs: `tail -f ~/.bumba/logs/notion-integration.log`
2. Test mode: `NOTION_DEBUG=true npm start`
3. Report issues: Create issue with `[Notion]` tag

---

**Note**: This framework ships with NO Notion credentials. All API keys and workspace IDs must be provided by adopters using their own Notion accounts.