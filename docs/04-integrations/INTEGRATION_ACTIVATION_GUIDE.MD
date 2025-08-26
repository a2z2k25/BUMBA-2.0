# BUMBA Integration Activation System

## Overview

The BUMBA framework includes a sophisticated **Integration Activation System** that ensures the framework works seamlessly whether you have API keys configured or not. This system automatically:

- 🏁 Detects available API keys and integrations
- 🏁 Switches between mock and live providers transparently
- 🏁 Falls back to mock mode when APIs fail
- 🏁 Progressively enables features as integrations become available
- 🏁 Provides clear setup guidance for missing integrations

## How It Works

### 1. Automatic Detection

When BUMBA starts, it automatically scans for configured integrations:

```javascript
// The system checks for these environment variables
NOTION_API_KEY      // Notion integration
OPENAI_API_KEY      // OpenAI integration  
ANTHROPIC_API_KEY   // Anthropic integration
GITHUB_TOKEN        // GitHub integration
MCP_SERVER_PATH     // MCP server integration
DATABASE_URL        // Database connection
```

### 2. Operating Modes

Based on available integrations, BUMBA operates in one of four modes:

| Mode | Description | Integration Status |
|------|-------------|-------------------|
| **Development** | No API keys configured | 0% - All mock providers |
| **Partial** | Some API keys present | 1-49% - Mix of mock and live |
| **Hybrid** | Most APIs configured | 50-99% - Mostly live providers |
| **Production** | Fully configured | 100% - All live providers |

### 3. Seamless Provider Switching

The framework automatically switches between providers without code changes:

```javascript
// Your code remains the same regardless of provider type
const notion = bumba.getIntegration('notion');

// This works with both mock and live providers
const database = await notion.databases.create({
  title: 'My Database',
  properties: { ... }
});

// The system tells you which provider is active
console.log(notion.isMock()); // true in development, false with API key
```

### 4. Progressive Feature Enablement

Features are automatically enabled as their required integrations become available:

| Feature | Required Integrations | 
|---------|---------------------|
| **Full Dashboard** | Notion + Database |
| **AI Orchestration** | OpenAI + Anthropic |
| **Collaborative Development** | GitHub + Notion |
| **Intelligent Memory** | MCP + Database |
| **Production Deployment** | All integrations |

## Setting Up Integrations

### Quick Setup

1. **Check current status:**
   ```bash
   bumba integrations status
   ```

2. **View setup guide:**
   ```bash
   bumba integrations guide
   ```

3. **Test integrations:**
   ```bash
   bumba integrations test
   ```

### Integration Setup Guides

#### Notion
1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Copy the Internal Integration Token
4. Add to `.env`:
   ```
   NOTION_API_KEY=secret_...
   ```
5. Install package:
   ```bash
   npm install @notionhq/client
   ```

#### OpenAI
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add to `.env`:
   ```
   OPENAI_API_KEY=sk-...
   ```
4. Install package:
   ```bash
   npm install openai
   ```

#### Anthropic
1. Go to [https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
2. Create a new API key
3. Add to `.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
4. Install package:
   ```bash
   npm install @anthropic-ai/sdk
   ```

#### GitHub
1. Go to [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. Generate new token (classic)
3. Add to `.env`:
   ```
   GITHUB_TOKEN=ghp_...
   ```
4. Install package:
   ```bash
   npm install @octokit/rest
   ```

#### MCP (Model Context Protocol)
1. Install MCP server:
   ```bash
   npm install -g @modelcontextprotocol/server-memory
   ```
2. Add to `.env`:
   ```
   MCP_SERVER_PATH=/usr/local/bin/mcp-server
   ```
3. Install SDK:
   ```bash
   npm install @modelcontextprotocol/sdk
   ```

#### Database
1. Set up your database (PostgreSQL, MySQL, etc.)
2. Add to `.env`:
   ```
   DATABASE_URL=postgresql://user:pass@localhost/db
   DATABASE_TYPE=postgres
   ```
3. Install packages:
   ```bash
   npm install typeorm pg
   ```

## Mock Providers

When API keys are not configured, BUMBA uses intelligent mock providers that:

- 🔴 Simulate real API responses
- 💾 Store data in memory during development
- 🔄 Maintain state between calls
- 📊 Provide realistic response times
- 🐛 Enable full development without API costs

### Mock Provider Features

| Integration | Mock Capabilities |
|------------|------------------|
| **Notion** | Create/read databases, pages, blocks |
| **OpenAI** | Generate mock completions and embeddings |
| **Anthropic** | Simulate Claude responses |
| **GitHub** | Mock repos, issues, PRs |
| **MCP** | Memory storage and tool execution |
| **Database** | In-memory data persistence |

## Automatic Fallback

If a live API fails, the system automatically falls back to mock:

```javascript
// Automatic fallback chain
Live API → Mock Provider → Error Handler

// You can monitor switches
bumba.on('provider:switched', (event) => {
  console.log(`${event.integration}: ${event.from} → ${event.to}`);
});
```

## Monitoring Integration Health

### Dashboard View

```bash
bumba integrations dashboard
```

Shows real-time status:
```
╔══════════════════════════════════════════════════════════════╗
║          BUMBA Integration Status Dashboard                 ║
╚══════════════════════════════════════════════════════════════╝

Operating Mode: HYBRID
Integration Status: 3/6 Active (50%)

Integration Status:
┌───────────────┬────────────┬────────────┬─────────────────────────┬────────────────────┐
│ Integration   │ Status     │ Provider   │ Features                │ Configuration      │
├───────────────┼────────────┼────────────┼─────────────────────────┼────────────────────┤
│ 🟢 notion     │ LIVE       │ Live API   │ dashboard, docs         │ 🏁 Configured       │
│ 🟡 openai     │ MOCK       │ Mock       │ ai-agents, generation   │ 🔴 Missing Keys     │
│ 🟢 github     │ LIVE       │ Live API   │ version-control, ci-cd  │ 🏁 Configured       │
└───────────────┴────────────┴────────────┴─────────────────────────┴────────────────────┘
```

### Programmatic Access

```javascript
const status = bumba.integrations.getStatus();

console.log(status);
// {
//   mode: 'hybrid',
//   summary: { total: 6, active: 3, mock: 3, percentage: 50 },
//   integrations: { ... },
//   features: { ... }
// }
```

## Best Practices

### 1. Start with Mock Mode
- Develop without API keys initially
- No costs during development
- Faster iteration cycles

### 2. Progressive Integration
- Add API keys one at a time
- Test each integration thoroughly
- Monitor the dashboard for issues

### 3. Use Environment Files
```bash
# .env.development (git-ignored)
# Empty or minimal keys

# .env.production (git-ignored)
NOTION_API_KEY=secret_...
OPENAI_API_KEY=sk-...
# ... all production keys
```

### 4. Handle Both Modes
```javascript
const notion = bumba.getIntegration('notion');

if (notion.isMock()) {
  console.log('Using mock Notion provider');
  // Optional: Add mock-specific behavior
}

// Core functionality works regardless
const result = await notion.databases.create({ ... });
```

## Troubleshooting

### Integration Not Activating

1. **Check environment variables:**
   ```bash
   bumba integrations check
   ```

2. **Validate API key format:**
   - Notion: `secret_` prefix
   - OpenAI: `sk-` prefix
   - Anthropic: `sk-ant-` prefix
   - GitHub: `ghp_` or `ghs_` prefix

3. **Test the integration:**
   ```bash
   bumba integrations test notion
   ```

### Provider Switching Issues

1. **View switch history:**
   ```bash
   bumba integrations history
   ```

2. **Force a specific provider:**
   ```javascript
   bumba.integrations.forceProvider('notion', 'mock');
   ```

3. **Clear provider cache:**
   ```bash
   bumba integrations clear-cache
   ```

## Advanced Configuration

### Custom Mock Providers

Create your own mock provider:

```javascript
// my-mock-provider.js
class MyMockProvider {
  async getData() {
    return { mock: true, data: 'test' };
  }
  
  async exportData() {
    // Export for migration to live
    return this.storage;
  }
}

// Register it
bumba.integrations.registerProvider('custom', {
  mock: () => new MyMockProvider(),
  live: () => new RealProvider()
});
```

### Integration Webhooks

Monitor integration changes:

```javascript
bumba.integrations.on('changed', (status) => {
  console.log('Integration status changed:', status);
});

bumba.integrations.on('activated', (integration) => {
  console.log(`${integration} is now live!`);
});

bumba.integrations.on('fallback', (integration) => {
  console.log(`${integration} fell back to mock`);
});
```

## Summary

The BUMBA Integration Activation System ensures that:

1. **Zero Configuration Start** - Works immediately without any API keys
2. **Progressive Enhancement** - Features enable as integrations are added
3. **Automatic Optimization** - Uses best available provider automatically
4. **Seamless Fallback** - Continues working even when APIs fail
5. **Clear Guidance** - Shows exactly what's needed for full functionality

This means you can:
- 🟢 Start developing immediately
- 💰 Avoid API costs during development
- 🔄 Seamlessly transition to production
- 🟡️ Maintain reliability with automatic fallbacks
- 📊 Monitor integration health in real-time

The framework handles all the complexity, letting you focus on building your application!