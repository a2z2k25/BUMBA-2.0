# 🟢 BUMBA MCP Server Setup Guide

> Complete guide for setting up 15 MCP servers with the BUMBA framework

## 🏁 Prerequisites

- [ ] Claude Desktop installed
- [ ] Node.js (v16+) installed
- [ ] Python (for Semgrep MCP)
- [ ] API keys ready

## 🟢 Quick Setup Steps

### 1️⃣ Install Node.js
```bash
brew install node  # macOS
# Or download from nodejs.org
```

### 2️⃣ Configure MCP Servers
```bash
# Copy configuration
cp ~/bumba-mcp-setup.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### 3️⃣ API Key Setup

| Service | How to Get Key | Required Scopes |
|---------|---------------|-----------------|
| **GitHub** | [github.com/settings/tokens](https://github.com/settings/tokens) | repo, read:org |
| **Figma** | Account Settings → Personal access tokens | Full access |
| **Notion** | [notion.so/my-integrations](https://www.notion.so/my-integrations) | Read/Write |
| **Pinecone** | [pinecone.io](https://www.pinecone.io) → API Keys | All |
| **Semgrep** | [semgrep.dev/orgs/-/settings/tokens](https://semgrep.dev/orgs/-/settings/tokens) | All |
| **Airtable** | [airtable.com/account](https://airtable.com/account) | All bases |
| **Exa** | [exa.ai/api-keys](https://exa.ai/api-keys) | Search access |

## 🟢 MCP Server List

### Core Servers (Free)
- 🏁 **Memory** - Context persistence
- 🏁 **Filesystem** - File operations
- 🏁 **Fetch** - Web requests
- 🏁 **Sequential Thinking** - Complex reasoning
- 🏁 **Ref** - Documentation search

### Integration Servers (API Key Required)
- 🟢 **GitHub** - Repository management
- 🟢 **Figma** - Design-to-code
- 🟢 **Notion** - Documentation
- 🟢 **Pinecone** - Vector search
- 🟢 **Semgrep** - Security scanning
- 🟢 **Pieces** - Code snippets
- 🟢 **Airtable** - Project tracking
- 🟢 **Exa** - AI search
- 🟢 **Playwright** - Testing
- 🟢 **Magic UI** - Components

## 🟢 BUMBA Integration

Once configured, these commands automatically use MCP servers:

| Command | MCP Server Used | Purpose |
|---------|----------------|---------|
| `/bumba:implement-strategy` | Notion | PRD creation |
| `/bumba:secure` | Semgrep | Security scanning |
| `/bumba:figma` | Figma | Design sync |
| `/bumba:research` | Exa | AI research |
| `/bumba:snippets` | Pieces | Code management |
| `/bumba:test` | Playwright | Automation |

## 🟢 Troubleshooting

### Common Issues

**Server Not Connecting**
```bash
# Check logs
tail -f ~/Library/Logs/Claude/*.log

# Verify Node.js
which node
node --version
```

**Permission Errors**
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

**Python MCP Issues**
```bash
pip install semgrep-mcp-server
```

## 🟢 Security Best Practices

1. **Never commit API keys**
   ```bash
   # Add to .gitignore
   .env
   *_token.txt
   ```

2. **Use environment variables**
   ```bash
   export GITHUB_TOKEN="your_github_token_here..."
   export FIGMA_TOKEN="fig_..."
   ```

3. **Rotate tokens regularly**
   - Set calendar reminders
   - Use minimal permissions

## 🏁 Verification Commands

Test your setup:
```bash
/bumba:status          # Check connections
/bumba:memory store    # Test memory
/bumba:github list     # Test GitHub
/bumba:figma connect   # Test Figma
```

## 🟢 Resources

- [MCP Documentation](https://modelcontextprotocol.io/docs)
- [BUMBA Framework](https://github.com/a2z2k25/bumba)
- [Claude Desktop Help](https://claude.ai/help)

---

*Last updated: August 2025*