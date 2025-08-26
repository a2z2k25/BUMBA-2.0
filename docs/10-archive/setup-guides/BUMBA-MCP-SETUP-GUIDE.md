# BUMBA MCP Server Setup Guide

## Prerequisites
1. Claude Desktop installed
2. Node.js (v16+) installed
3. Python (for Semgrep MCP)
4. API keys for various services

## Step-by-Step Setup

### 1. Install Node.js (if needed)
```bash
# macOS with Homebrew
brew install node

# Or download from nodejs.org
```

### 2. Copy MCP Configuration
```bash
# Find your Claude config file
open ~/Library/Application\ Support/Claude/

# Copy the example configuration
cp ~/bumba-mcp-setup.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### 3. Get Required API Keys

#### GitHub Token
1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes: repo, read:org
4. Copy token to config

#### Figma Token
1. Go to Figma > Account Settings
2. Personal access tokens
3. Create new token
4. Copy to config

#### Notion API Key
1. Go to https://www.notion.so/my-integrations
2. Create new integration
3. Copy the secret key

#### Pinecone API Key
1. Sign up at https://www.pinecone.io
2. Go to API Keys
3. Copy your key and environment

#### Other Services
- Semgrep: https://semgrep.dev/orgs/-/settings/tokens
- Airtable: https://airtable.com/account
- Exa: https://exa.ai/api-keys

### 4. Test MCP Servers

After updating the config:
1. Restart Claude Desktop
2. Open developer console (Cmd+Option+I on Mac)
3. Look for MCP server connections
4. Test with commands like:
   - "Check my GitHub repositories"
   - "Search documentation for React hooks"
   - "Analyze this code for security issues"

### 5. BUMBA Integration

Once MCP servers are connected, BUMBA commands will automatically use them:

```bash
# These commands now leverage MCP servers:
/bumba:implement-strategy   # Uses Notion for PRDs
/bumba:secure              # Uses Semgrep for scanning
/bumba:figma               # Uses Figma MCP
/bumba:research            # Uses Exa for AI search
/bumba:snippets            # Uses Pieces for code management
```

## Troubleshooting

### Server Not Connecting
1. Check API keys are correct
2. Ensure Node.js is in PATH
3. Check Claude logs: `~/Library/Logs/Claude/`

### Permission Issues
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

### Python MCP Servers
```bash
# Install Python MCP dependencies
pip install semgrep-mcp-server
```

## Optional: Local Development

For custom MCP servers:
```bash
# Clone and develop locally
git clone https://github.com/modelcontextprotocol/servers
cd servers/src/memory
npm install
npm run build

# Update config to use local path
"memory": {
  "command": "node",
  "args": ["/path/to/local/server/dist/index.js"]
}
```

## Verification

Run these BUMBA commands to verify MCP integration:
- `/bumba:status` - Check MCP connections
- `/bumba:memory store test` - Test memory MCP
- `/bumba:github list repos` - Test GitHub MCP
- `/bumba:figma connect` - Test Figma MCP

## Security Notes

1. Never commit API keys to git
2. Use environment variables for production
3. Rotate tokens regularly
4. Limit token permissions to minimum required

## Advanced Configuration

### Environment Variables
```bash
# .env file for BUMBA
export GITHUB_TOKEN="your_github_token_here..."
export FIGMA_TOKEN="fig_..."
export NOTION_KEY="secret_..."

# Source in your shell
source ~/.env
```

### Multiple Workspaces
Create separate configs:
- `claude_desktop_config_personal.json`
- `claude_desktop_config_work.json`

Switch by renaming active config.

---

For more help: https://modelcontextprotocol.io/docs