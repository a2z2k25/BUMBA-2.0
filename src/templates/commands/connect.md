# Connect Command - Interactive Integration Setup

## Purpose
Guide users through connecting MCP servers and API integrations to achieve full operability.

## Usage
```
/bumba:connect [integration]
```

## Examples
- `/bumba:connect` - Launch interactive connection wizard
- `/bumba:connect anthropic` - Connect Anthropic API
- `/bumba:connect notion` - Connect Notion MCP server

## Features
- Interactive wizard for easy setup
- Step-by-step connection instructions
- Automatic detection of installed packages
- Progress tracking with achievements
- Smart suggestions based on usage patterns

## Process Flow
1. **Scan Current State**
   - Check connected integrations
   - Calculate operability score
   - Identify missing connections

2. **Prioritize Suggestions**
   - Required integrations first
   - High-impact connections next
   - Optional enhancements last

3. **Guide Connection**
   - Provide specific instructions
   - Show API key sources
   - Validate configuration
   - Test connection

4. **Celebrate Progress**
   - Show achievement unlocks
   - Display new capabilities
   - Update operability score

## Integration Categories

### Core MCP (30% weight) - Required
- memory - Context preservation
- filesystem - File operations
- sequential-thinking - Complex reasoning

### AI Models (25% weight) - Required
- anthropic - Claude API
- openai - GPT-4 API
- google - Gemini API

### Productivity MCP (15% weight)
- notion - Project management
- github - Version control
- airtable - Database

### Database MCP (10% weight)
- postgres - SQL database
- mongodb - NoSQL database
- supabase - Backend-as-a-service

### Design MCP (10% weight)
- figma-devmode - Design to code
- figma-context - Layout analysis
- magic-ui - Component generation

### Quality MCP (10% weight)
- semgrep - Security scanning
- ref - Documentation lookup
- pieces - Code snippets
- exa - Semantic search

## Achievement Levels
- 0% - Initialization 🔴
- 20% - Getting Started 🟠
- 40% - Making Progress 🟡
- 60% - Well Connected 🟢
- 80% - Highly Operational ✅ (Quiet mode)
- 95% - Production Ready 🚀
- 100% - Fully Operational 🏆

## Tips
- Connect core integrations first for maximum impact
- API keys are never stored in the framework
- Use environment variables for sensitive data
- Test connections after configuration
- Restart framework to detect new connections