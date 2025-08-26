# BUMBA Framework API Setup Guide

## Quick Start (Free Tier)

The BUMBA Framework is designed to work primarily with **FREE AI models**. You can run the entire system without spending any money!

### Step 1: Get Your Free API Keys

#### 🆓 Google Gemini (Recommended - Start Here!)
- **Free Quota**: 1 million tokens per day
- **Get Key**: https://makersuite.google.com/app/apikey
- **Setup Time**: 2 minutes
- **No Credit Card**: Required 🏁

```bash
export GOOGLE_API_KEY="your_gemini_key_here"
```

#### 🆓 OpenRouter (For DeepSeek & Qwen)
- **Free Quota**: Limited free tier for testing
- **Get Key**: https://openrouter.ai/keys
- **Models Available**:
  - DeepSeek R1 (reasoning)
  - Qwen 2.5 Coder (coding)
- **Setup Time**: 3 minutes

```bash
export OPENROUTER_API_KEY="your_openrouter_key_here"
```

### Step 2: Configure Environment

Create a `.env` file in your project root:

```bash
# Copy the example file
cp .env.example .env

# Edit with your keys
nano .env
```

### Step 3: Test Your Setup

```bash
# Test free tier system
node test-free-tier.js

# Run integration tests
node test-integration.js
```

## Free Tier Limits & Strategy

### Daily Limits
| Provider | Model | Daily Limit | Best For |
|----------|-------|------------|----------|
| Google | Gemini Pro | 1M tokens | General tasks |
| DeepSeek | R1 | 500K tokens | Complex reasoning |
| Qwen | 2.5 Coder | 500K tokens | Code generation |

### Smart Usage Strategy
1. **Simple Tasks** → Gemini (largest quota)
2. **Reasoning Tasks** → DeepSeek R1
3. **Coding Tasks** → Qwen Coder
4. **Critical Tasks** → Claude (paid, last resort)

## Optional: Paid APIs

Only configure these if you need them:

### Anthropic Claude
```bash
# Premium model - $15/million tokens
export ANTHROPIC_API_KEY="sk-ant-..."
```

### OpenAI GPT-4
```bash
# Fallback option - $10/million tokens
export OPENAI_API_KEY="sk-..."
```

## Notion Integration (Optional)

### Step 1: Create Notion Integration
1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Name it "BUMBA Framework"
4. Copy the API key

### Step 2: Share Database
1. Open your Notion database
2. Click "Share"
3. Invite your integration

### Step 3: Configure
```bash
export NOTION_API_KEY="secret_..."
export NOTION_DATABASE_ID="..."
```

## Cost Optimization

The framework automatically:
- 🏁 Uses free models first
- 🏁 Tracks daily usage
- 🏁 Falls back to paid only when necessary
- 🏁 Implements mutex locks for Claude Max
- 🏁 Queues requests to prevent overuse

### Expected Costs
- **Free Tier Only**: $0/month
- **Light Usage**: <$1/month
- **Heavy Usage**: $5-10/month

## Troubleshooting

### "No API key found"
```bash
# Check your environment
echo $GOOGLE_API_KEY

# Source your .env file
source .env
```

### "Quota exceeded"
- Free tier exhausted for the day
- Wait until midnight UTC for reset
- Or configure a paid fallback

### "Model not available"
- Check OpenRouter credits
- Verify API key is correct
- Try a different model

## Model Selection Matrix

| Task Type | Priority | Model Selected |
|-----------|----------|---------------|
| Simple + Low | Any | Gemini Pro |
| Simple + High | Any | Gemini Pro |
| Medium + Low | Any | DeepSeek R1 |
| Medium + High | Coding | Qwen Coder |
| Complex + Low | Any | DeepSeek R1 |
| Complex + High | Critical | Claude (paid) |

## Security Best Practices

1. **Never commit API keys**
   ```bash
   # Add to .gitignore
   echo ".env" >> .gitignore
   ```

2. **Use environment variables**
   ```javascript
   const apiKey = process.env.GOOGLE_API_KEY;
   ```

3. **Rotate keys regularly**
   - Monthly for production
   - After any suspected breach

4. **Set spending limits**
   - Configure in provider dashboards
   - Use DAILY_BUDGET_LIMIT in .env

## Monitoring Usage

### Check Current Usage
```javascript
const { FreeTierManager } = require('./src/core/agents/free-tier-manager');
const manager = new FreeTierManager();
manager.logCurrentUsage();
```

### View Daily Report
```bash
cat .bumba-usage.json
```

### Reset Usage (Testing)
```bash
rm .bumba-usage.json
node -e "console.log('Usage reset')"
```

## Next Steps

1. 🏁 Get free API keys (5 minutes)
2. 🏁 Configure .env file (2 minutes)
3. 🏁 Run tests (1 minute)
4. 🟢 Start using BUMBA Framework!

## Support

- GitHub Issues: https://github.com/bumba/framework/issues
- Documentation: /docs
- Community: Discord (coming soon)

---

**Remember**: You can run BUMBA completely FREE with the Gemini, DeepSeek, and Qwen models!