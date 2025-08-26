# BUMBA Troubleshooting Guide
## 🏁 Common Issues & Solutions

### Installation Issues

#### MCP Servers Show "🏁 SETUP NEEDED"
**This is normal!** The framework works perfectly - these servers just need configuration.

**Solution:**
1. Core BUMBA works immediately
2. Configure additional servers anytime with API keys
3. See [SETUP-GUIDE.md](../SETUP-GUIDE.md) for specific instructions

#### Commands Not Working After Install
**Cause:** Claude Code needs to be restarted to load the new framework.

**Solution:**
1. Completely close Claude Code
2. Reopen Claude Code
3. Try `/bumba:menu` to verify activation

#### Installation Fails with Permission Errors
**Solution:**
```bash
# Try with explicit npm permissions
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
npx bumba-claude@latest
```

### Command Issues

#### `/bumba:` Commands Not Found
**Cause:** Framework not properly activated or Claude Code needs restart.

**Solution:**
1. Check installation: `/bumba:status`
2. If not found, restart Claude Code completely
3. If still not working, reinstall: `npx bumba-claude@latest`

#### Figma Integration Not Working
**Two integration paths:**

**For Figma Dev Mode MCP (Recommended):**
1. Ensure Figma Desktop App is running
2. Check Figma → Preferences → Enable Dev Mode MCP Server  
3. Restart Figma Desktop App

**For Figma Context API:**
1. Set environment variable: `export FIGMA_API_KEY="your-key"`
2. Get API key from Figma → Settings → Personal Access Tokens
3. Restart terminal and Claude Code

#### Quality Gates Failing
**Solution:**
```bash
# Install qlty manually if needed
curl -fsSL https://qlty.sh | bash

# Check status
/bumba:settings show
```

### Performance Issues

#### Commands Running Slowly
**Cause:** Too many MCP servers active or network issues.

**Solution:**
1. Check internet connection
2. Use `/bumba:status` to see active servers
3. Consider configuring only needed servers

#### High Memory Usage
**Solution:**
1. Use `/bumba:memory clear` to clear old context
2. Restart Claude Code periodically
3. Configure only essential MCP servers

### Configuration Issues

#### Environment Variables Not Working
**Solution:**
```bash
# Check if variables are set
echo $FIGMA_API_KEY
echo $NOTION_API_KEY

# Set permanently in shell profile
echo 'export FIGMA_API_KEY="your-key"' >> ~/.zshrc
source ~/.zshrc

# Restart Claude Code after setting variables
```

#### Server Status Shows Mixed Results
**This is normal!** Different servers have different requirements.

**Understanding Status:**
- 🏁 ACTIVE = Working perfectly
- 🏁 CONFIGURED = Already set up  
- 🏁 SETUP NEEDED = Needs API keys (optional)

### Framework Issues

#### Audio System Not Working
**Cause:** Missing audio dependencies or permissions.

**Solution:**
```bash
# Check audio system status  
./src/templates/hooks/vintage-game-audio.sh status

# Install MP3 support (Linux)
./src/templates/hooks/vintage-game-audio.sh install-mp3

# Audio is optional - framework works without it
```

#### Hooks Not Executing
**Solution:**
1. Check hook permissions: `ls -la ~/.claude/hooks/`
2. Make executable: `chmod +x ~/.claude/hooks/*.sh`
3. Check hook configuration in settings.json

### Getting Help

#### Built-in Help System
```bash
/bumba:help                 # General help
/bumba:help [command]       # Command-specific help
/bumba:status              # System health check
/bumba:settings show       # View configuration
/bumba:menu               # Interactive command discovery
```

#### Common Diagnostic Commands
```bash
# Check overall system
/bumba:status

# Test specific functionality  
/bumba:help test

# View current configuration
/bumba:settings show

# Clear cache if issues persist
/bumba:memory clear
```

#### When to Reinstall
**Reinstall if:**
- Multiple commands failing
- Framework not activating after restart
- Configuration seems corrupted

```bash
# Clean reinstall
npx bumba-claude@latest
```

### Contact & Support

#### Self-Help Resources
1. **Interactive Help**: `/bumba:help [topic]`
2. **Status Check**: `/bumba:status`  
3. **Documentation**: [SETUP-GUIDE.md](../SETUP-GUIDE.md)
4. **Commands Reference**: [COMMANDS.md](../COMMANDS.md)

#### Community Support
- **GitHub Issues**: Report bugs and get help
- **Documentation**: Complete guides in docs folder
- **Interactive Discovery**: Use `/bumba:menu` to explore

---

**Most issues resolve with a simple Claude Code restart!**

🏁 **Pro Tip**: Use `/bumba:status` first - it often shows exactly what needs attention.