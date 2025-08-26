# Quick Start Guide

Get BUMBA up and running in 5 minutes.

## Prerequisites

- Node.js 14+ and npm
- Git
- Text editor (VS Code recommended)

## Installation

### 1. Clone and Install

```bash
git clone https://github.com/bumba-ai/bumba.git
cd bumba
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your API keys:
```env
# Required for full functionality
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Optional integrations
NOTION_API_KEY=your_notion_key
GITHUB_TOKEN=your_github_token
```

### 3. Start BUMBA

```bash
npm start
```

## Your First Command

### Basic Implementation
```bash
/bumba:implement create a REST API with user authentication
```

BUMBA will:
1. Analyze your request
2. Route to the appropriate specialist
3. Generate implementation plan
4. Execute with quality checks

### Quick Analysis
```bash
/bumba:analyze security vulnerabilities in my codebase
```

### Get Help
```bash
/bumba:help
/bumba:menu  # Interactive command browser
```

## Essential Commands

| Command | Purpose | Example |
|---------|---------|---------|
| `implement` | Build features | `/bumba:implement user dashboard` |
| `analyze` | Code analysis | `/bumba:analyze performance` |
| `test` | Run tests | `/bumba:test integration` |
| `docs` | Documentation | `/bumba:docs api` |
| `health` | System check | `/bumba:health` |

## Configuration Options

### Modes

```javascript
// bumba.config.js
module.exports = {
  mode: 'executive'  // Choose your mode:
  // 'executive' - Strategic planning focus
  // 'collaborative' - Team coordination
  // 'specialized' - Deep technical work
};
```

### Department Routing

```javascript
department: 'auto'  // Or specify:
// 'product' - Business strategy
// 'design' - UI/UX focus
// 'backend' - Technical implementation
```

## Working with Agents

### Auto-Routing
```bash
/bumba:implement [any request]
# Automatically routes to best agent
```

### Direct Department Access
```bash
/bumba:implement-strategy [business feature]
/bumba:implement-design [UI component]
/bumba:implement-technical [system feature]
```

### Parallel Execution
```bash
/bumba:orchestrate complex multi-part task
# Spawns multiple agents working in parallel
```

## Integration Setup

### Notion (Optional)
1. Get API key from Notion settings
2. Add to `.env`: `NOTION_API_KEY=secret_xxx`
3. Run: `/bumba:notion-status`

### GitHub (Optional)
1. Create personal access token
2. Add to `.env`: `GITHUB_TOKEN=ghp_xxx`
3. Test: `/bumba:pr create "Feature update"`

## Troubleshooting

### Common Issues

**Command not recognized**
- Check syntax: `/bumba:command` (with colon)
- Run `/bumba:menu` to see all commands

**Agent not responding**
- Check health: `/bumba:health`
- Verify API keys in `.env`

**Performance issues**
- Run diagnostics: `/bumba:profile`
- Check memory: `/bumba:metrics`

## Next Steps

- Explore [all 58 commands](REFERENCE.md)
- Read [Architecture docs](docs/ARCHITECTURE.md)
- Join [Discord community](https://discord.gg/bumba)

---

Need help? Run `/bumba:help` or visit [bumba-ai.com](https://bumba-ai.com)