# 🚀 BUMBA Complete Setup Guide
*For absolute beginners - no technical knowledge required!*

## 📋 Table of Contents
1. [Super Quick Start (5 minutes)](#super-quick-start)
2. [API Keys Setup (Step by Step)](#api-keys-setup)
3. [MCP Servers Setup](#mcp-servers-setup)
4. [Verify Everything Works](#verify-everything-works)
5. [Troubleshooting](#troubleshooting)

---

## 🎯 Super Quick Start

**Just want to get running? Follow these 3 steps:**

### Step 1: Install BUMBA
```bash
# In your terminal, run:
npm install
npm run install
```

### Step 2: Get ONE Free API Key
Go to: https://makersuite.google.com/app/apikey
- Click "Create API Key"
- Copy the key that starts with `AIza...`

### Step 3: Add Your Key
Create a file called `.env` in your BUMBA folder and add:
```
GOOGLE_API_KEY=AIza_your_key_here
```

**That's it! You can now use BUMBA!** 🎉

---

## 🔑 API Keys Setup (Detailed)

### Understanding API Keys
Think of API keys like passwords that let BUMBA talk to AI services. You need at least ONE, but more keys = more capabilities.

### 🆓 FREE API Keys (Start Here!)

#### 1. Google Gemini (EASIEST - Recommended First Key)
**What it does:** Powers most AI features for free
**Cost:** FREE - 1 million tokens per day
**Time to setup:** 2 minutes

**Step-by-step:**
1. Open your web browser
2. Go to: https://makersuite.google.com/app/apikey
3. Sign in with your Google account (same as Gmail)
4. Click the blue "Create API Key" button
5. Copy the key (looks like: `AIzaSyB...`)
6. Save it somewhere safe!

**Add to BUMBA:**
```
GOOGLE_API_KEY=paste_your_key_here
```

#### 2. OpenRouter (For Advanced Models)
**What it does:** Access to DeepSeek, Qwen, and other models
**Cost:** FREE tier available, pay-as-you-go after
**Time to setup:** 5 minutes

**Step-by-step:**
1. Go to: https://openrouter.ai
2. Click "Sign Up" (you can use Google account)
3. Once logged in, click your profile icon (top right)
4. Click "API Keys"
5. Click "Create New Key"
6. Name it "BUMBA" and click Create
7. Copy the key (starts with `sk-or-...`)

**Add to BUMBA:**
```
OPENROUTER_API_KEY=sk-or-your_key_here
```

#### 3. Hugging Face (For Open Source Models)
**What it does:** Access to thousands of free AI models
**Cost:** FREE
**Time to setup:** 3 minutes

**Step-by-step:**
1. Go to: https://huggingface.co/join
2. Create a free account
3. Click your profile picture → Settings
4. Click "Access Tokens" in left menu
5. Click "New token"
6. Name it "BUMBA", select "Read" access
7. Click "Generate token"
8. Copy the token (starts with `hf_...`)

**Add to BUMBA:**
```
HUGGINGFACE_API_KEY=hf_your_token_here
```

### 💰 PAID API Keys (Optional - More Power)

#### 1. OpenAI (ChatGPT Models)
**What it does:** Access to GPT-4, GPT-3.5
**Cost:** Pay per use (GPT-3.5 is very cheap)
**Minimum:** $5 credit purchase

**Step-by-step:**
1. Go to: https://platform.openai.com
2. Sign up or sign in
3. Click "API Keys" in left sidebar
4. Click "Create new secret key"
5. Name it "BUMBA"
6. Copy the key (starts with `sk-...`)
7. Add payment method: Billing → Payment methods

**Add to BUMBA:**
```
OPENAI_API_KEY=sk-your_key_here
```

#### 2. Anthropic (Claude Models)
**What it does:** Access to Claude 3 models
**Cost:** Pay per use
**Minimum:** $5 credit purchase

**Step-by-step:**
1. Go to: https://console.anthropic.com
2. Create account
3. Go to "API Keys"
4. Click "Create Key"
5. Name it "BUMBA"
6. Copy the key (starts with `sk-ant-...`)

**Add to BUMBA:**
```
ANTHROPIC_API_KEY=sk-ant-your_key_here
```

---

## 🔌 MCP Servers Setup

MCP (Model Context Protocol) servers give BUMBA superpowers like file access, web browsing, and memory.

### What You Need First
- Claude Desktop app installed (https://claude.ai/download)
- BUMBA framework installed

### Step 1: Find Your Claude Config File

**On Mac:**
1. Open Finder
2. Press `Cmd + Shift + G`
3. Paste: `~/Library/Application Support/Claude/`
4. Look for `claude_desktop_config.json`

**On Windows:**
1. Press `Windows + R`
2. Type: `%APPDATA%\Claude`
3. Press Enter
4. Look for `claude_desktop_config.json`

### Step 2: Install MCP Servers

Run this command in your BUMBA folder:
```bash
npm run mcp:install
```

This installs:
- 📁 **Filesystem** - Read/write files
- 🌐 **Fetch** - Browse the web
- 🧠 **Memory** - Remember things between sessions
- 📝 **Notion** - Connect to Notion (optional)

### Step 3: Configure MCP Servers

The installer will create a config for you, but here's what it looks like:

**Edit `claude_desktop_config.json`:**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/YOUR_USERNAME/Code"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

**Important:** Replace `/Users/YOUR_USERNAME/Code` with your actual folder path!

### Step 4: Restart Claude Desktop
1. Quit Claude Desktop completely
2. Start it again
3. You should see MCP indicators when you start a new chat

### Optional: Notion Integration

**Only if you use Notion:**

1. Get your Notion API key:
   - Go to https://www.notion.so/my-integrations
   - Click "New integration"
   - Name it "BUMBA"
   - Click Submit
   - Copy the secret key

2. Add to your `.env` file:
```
NOTION_API_KEY=secret_your_key_here
```

3. Add to MCP config:
```json
"notion": {
  "command": "npx",
  "args": ["-y", "mcp-server-notion"],
  "env": {
    "NOTION_API_KEY": "secret_your_key_here"
  }
}
```

---

## ✅ Verify Everything Works

### Test Your API Keys

Run this command:
```bash
node scripts/validation/validate-setup.js
```

You should see:
```
✅ Google API Key: Valid
✅ OpenRouter API Key: Valid
✅ Framework: Initialized
✅ MCP Servers: Connected
```

### Test BUMBA Commands

Try these commands:
```bash
# Test basic functionality
bumba

# Should show menu
/bumba:menu

# Should show help
/bumba:help
```

---

## 🔧 Troubleshooting

### "API Key Invalid"
- **Check:** Did you copy the ENTIRE key?
- **Check:** No extra spaces before/after the key
- **Fix:** Get a new key and try again

### "Cannot find module"
- **Fix:** Run `npm install` again
- **Fix:** Delete `node_modules` folder and run `npm install`

### "Permission denied"
- **Mac/Linux Fix:** Run with `sudo npm install`
- **Windows Fix:** Run terminal as Administrator

### "MCP not working"
- **Check:** Is Claude Desktop running?
- **Check:** Did you restart Claude after adding MCP config?
- **Fix:** Check the config file has valid JSON (no extra commas!)

### "Out of quota"
- **Google:** Wait until tomorrow (resets daily)
- **OpenRouter:** Add payment method for more credits
- **Fix:** Use a different API key

---

## 📊 What Each API Enables

| API Key | What You Can Do | Cost |
|---------|----------------|------|
| Google Gemini | Most BUMBA features, general AI tasks | FREE |
| OpenRouter | Advanced reasoning, specialized models | FREE tier + paid |
| Hugging Face | Sentiment analysis, embeddings | FREE |
| OpenAI | GPT-4 power features, DALL-E images | Paid |
| Anthropic | Claude integration, advanced analysis | Paid |

---

## 🎯 Recommended Setup Progression

### Level 1: Beginner (FREE)
- ✅ Google Gemini API only
- Perfect for learning BUMBA

### Level 2: Intermediate (FREE)
- ✅ Google Gemini API
- ✅ OpenRouter (free tier)
- ✅ Hugging Face
- Access to multiple models

### Level 3: Power User ($10-20/month)
- ✅ All free APIs
- ✅ OpenAI with $10 credit
- ✅ MCP servers configured
- Full BUMBA capabilities

### Level 4: Professional ($50+/month)
- ✅ All APIs configured
- ✅ Anthropic for Claude
- ✅ Higher rate limits
- ✅ Notion integration
- Enterprise-ready

---

## 🆘 Still Need Help?

1. **Check the docs:** `/docs/01-getting-started/`
2. **Run diagnostics:** `npm run diagnose`
3. **Ask BUMBA:** `/bumba:help setup`
4. **Community:** Open an issue on GitHub

---

## 🎉 Success Checklist

- [ ] At least ONE API key in `.env` file
- [ ] Ran `npm install` successfully
- [ ] Can run `bumba` command
- [ ] (Optional) MCP servers configured
- [ ] (Optional) Multiple API keys for redundancy

**Congratulations! You're ready to use BUMBA!** 🚀

---

*Remember: You only need ONE free API key to start. Don't feel pressured to set up everything at once. Start simple, add more as you need it!*