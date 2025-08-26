# BUMBA Status Line - User Guide

## 🟢 Quick Start

The BUMBA Status Line works **automatically** for any Claude Code user. No configuration or API keys required!

### Enable Status Line
```bash
node src/core/status enable
```

### Check Status
```bash
node src/core/status status
```

## 📊 Features

### Automatic Token Tracking
- Monitors Claude API calls automatically
- No manual configuration needed
- Works with any Claude model (Opus, Sonnet, Haiku)
- Persists usage data between sessions

### Display Formats

#### Default Format
```
BUMBA Claude | 1.5K tokens
```

#### Minimal Format
```
BUMBA | 1.5K tokens
```

#### Detailed Format
```
BUMBA Claude | Session: 1.5K (5m) | Total: 45.2K | ~$0.14
```

## 🟢️ Configuration

### Option 1: Configuration File
Create `~/.bumba/config.json`:

```json
{
  "statusLine": {
    "enabled": true,
    "format": "default",
    "colors": true,
    "showTokens": true,
    "showModel": true,
    "showCost": false,
    "updateInterval": 1000
  }
}
```

### Option 2: Environment Variables
```bash
export BUMBA_STATUS_LINE=true
export BUMBA_STATUS_FORMAT=detailed
export BUMBA_NO_COLOR=false
```

### Option 3: Programmatic Configuration
```javascript
const { configure } = require('./src/core/status');

configure({
  format: 'detailed',
  showCost: true,
  colors: true
});
```

## 🔴 Customization

### Custom Format Function
```javascript
const { configure } = require('./src/core/status');

configure({
  format: 'custom',
  customFormat: (usage, model) => {
    return `🤖 ${model.name} | 💬 ${usage.messages} messages | 🪙 ${usage.tokens} tokens`;
  }
});
```

### Available Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | true | Enable/disable status line |
| `format` | string | 'default' | Display format (minimal/default/detailed/custom) |
| `colors` | boolean | true | Use colored output |
| `showTokens` | boolean | true | Show token count |
| `showModel` | boolean | true | Show model name |
| `showCost` | boolean | false | Show estimated cost |
| `updateInterval` | number | 1000 | Update frequency (ms) |
| `persistUsage` | boolean | true | Save usage data |
| `dataDir` | string | ~/.bumba | Data directory path |

## 💾 Data Persistence

Usage data is automatically saved to:
- **Mac/Linux**: `~/.bumba/token-usage.json`
- **Windows**: `%USERPROFILE%\.bumba\token-usage.json`

### Data Structure
```json
{
  "tokens": 45234,
  "messages": 128,
  "session": {
    "tokens": 1523,
    "messages": 5,
    "startTime": 1699123456789
  }
}
```

## 🔧 API Reference

### Core Methods

```javascript
const statusLine = require('./src/core/status');

// Enable/disable
statusLine.enable();
statusLine.disable();

// Configure
statusLine.configure({
  format: 'detailed',
  showCost: true
});

// Get statistics
const stats = statusLine.getStats();
console.log(stats);

// Manual token tracking (for testing)
statusLine.trackTokens(1500);

// Reset session
statusLine.resetSession();

// Show status
statusLine.showStatus();
```

## 🧪 Testing

Test the status line with sample data:
```bash
node src/core/status test
```

## 🤝 Integration with BUMBA Framework

The status line integrates automatically with the BUMBA framework:

```javascript
const bumba = require('./src');

// Status line is automatically initialized
// It will track all token usage from framework operations

// You can still control it manually
bumba.statusLine.enable();
bumba.statusLine.configure({ format: 'detailed' });
```

## 🔍 How It Works

1. **Auto-Detection**: Detects Claude model from environment
2. **Token Tracking**: Monitors API calls and console output
3. **Persistence**: Saves usage data locally
4. **Display**: Updates status line in real-time
5. **No Dependencies**: Works standalone or with framework

## 📝 Examples

### Basic Usage
```javascript
// Just require the module - it auto-initializes
require('./src/core/status');
// Status line is now active and tracking!
```

### With Framework
```javascript
const bumba = require('./src');

// Framework operations automatically tracked
await bumba.execute('implement feature');
// Token usage is automatically recorded
```

### Custom Integration
```javascript
const { getStatusLine } = require('./src/core/status');
const statusLine = getStatusLine();

// Hook into your own API calls
myApiCall().then(response => {
  if (response.tokens) {
    statusLine.updateTokens(response.tokens);
  }
});
```

## 🔴 Privacy & Security

- **No credentials stored**: Works without API keys
- **Local data only**: Usage data never leaves your machine
- **User control**: Can be disabled at any time
- **Open source**: Full transparency in implementation

## 🐛 Troubleshooting

### Status line not showing?
```bash
# Check if enabled
node src/core/status status

# Force enable
export BUMBA_STATUS_LINE=true
node src/core/status enable
```

### Tokens not tracking?
- The status line monitors standard Claude API patterns
- For custom integrations, use `trackTokens()` manually

### Colors not working?
```bash
# Disable colors
export BUMBA_NO_COLOR=true
```

## 📈 Roadmap

- [ ] Web dashboard for usage analytics
- [ ] Multi-user support
- [ ] Cost alerts and budgets
- [ ] Export usage reports
- [ ] Integration with more AI models

## 📄 License

MIT - Use freely in your projects!

---

*BUMBA Status Line - Track your AI usage effortlessly!*