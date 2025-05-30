# MCP Server Configuration Reference

## Configured MCP Servers for FitForge Project

All servers use absolute paths to globally installed binaries. No reinstallation needed - using existing global instances.

### ✅ Core Servers (Working)
- **sequential-thinking**: `/home/ender/.npm-global/bin/mcp-server-sequential-thinking`
- **context7**: `/home/ender/.npm-global/bin/context7-mcp`
- **browser-tools-mcp**: `/home/ender/.npm-global/bin/browser-tools-mcp`

### 🔑 Authenticated Servers (Ready with API Keys)
- **brave-search**: Web search capabilities
- **firecrawl**: Web scraping and content extraction
- **figma**: Design file access and manipulation
- **gdrive**: Google Drive integration
- **dart**: Project management

### 📋 Development Servers (Need API Keys)
- **github**: Repository integration (needs GITHUB_PERSONAL_ACCESS_TOKEN)
- **slack**: Team communication (needs SLACK_BOT_TOKEN, SLACK_APP_TOKEN)
- **postgres**: Database integration (needs POSTGRES_CONNECTION_STRING)
- **notion**: Workspace integration (needs NOTION_API_KEY)
- **exa**: Enhanced search (needs EXA_API_KEY)

### 🌐 Browser Automation Servers
- **puppeteer**: Chrome automation via Puppeteer
- **playwright**: Cross-browser automation
- **browsermcp**: Browser control and interaction

### 📊 Content & Analysis Servers
- **memory**: Persistent memory across sessions
- **youtube-transcript**: Video transcript extraction
- **everything**: System-wide file search

## Quick Commands

```bash
# Check status
claude mcp list

# View with debug info
claude --mcp-debug

# Remove server
claude mcp remove servername

# Add server with config
claude mcp add-json servername '{"command":"path","env":{"KEY":"value"}}'
```

## API Key Configuration

### Environment Variables Needed:
```bash
# GitHub Integration
GITHUB_PERSONAL_ACCESS_TOKEN="your_token_here"

# Slack Integration  
SLACK_BOT_TOKEN="xoxb-your-bot-token"
SLACK_APP_TOKEN="xapp-your-app-token"

# Database
POSTGRES_CONNECTION_STRING="postgresql://user:pass@host:port/db"

# Notion
NOTION_API_KEY="secret_your_key"

# Exa Search
EXA_API_KEY="your_exa_key"
```

### Already Configured:
- **BRAVE_API_KEY**: `BSAKL***` (configured in MCP)
- **FIRECRAWL_API_KEY**: `fc-***` (configured in MCP)
- **FIGMA_ACCESS_TOKEN**: `figd_***` (configured in MCP)
- **GOOGLE_CLIENT_ID**: `273451161971-***` (configured in MCP)
- **GOOGLE_CLIENT_SECRET**: `GOCSPX-***` (configured in MCP)
- **DART_TOKEN**: `dsa_***` (configured in MCP)

## Troubleshooting

### Common Issues:
1. **Server Failed**: Check if binary exists at path
2. **Connection Timeout**: Try removing and re-adding with absolute path
3. **Auth Errors**: Verify API keys in environment configuration

### Debug Commands:
```bash
# Check binary exists
ls -la /home/ender/.npm-global/bin/servername

# Test server directly
/home/ender/.npm-global/bin/servername --help

# MCP debug mode
claude --mcp-debug mcp list
```

## Server Capabilities Summary

| Server | Purpose | Auth Required | Status |
|--------|---------|---------------|--------|
| sequential-thinking | Structured reasoning | No | ✅ |
| context7 | Context management | No | ✅ |
| browser-tools-mcp | Browser automation | No | ✅ |
| brave-search | Web search | API Key | ✅ |
| firecrawl | Web scraping | API Key | ✅ |
| figma | Design access | Token | ✅ |
| gdrive | Google Drive | OAuth | ✅ |
| dart | Project management | Token | ✅ |
| memory | Persistent storage | No | ✅ |
| puppeteer | Chrome automation | No | ✅ |
| playwright | Browser testing | No | ✅ |
| browsermcp | Browser control | No | ✅ |
| youtube-transcript | Video transcripts | No | ✅ |
| everything | File search | No | ✅ |
| github | Repository access | Token | ⚠️ |
| slack | Team communication | Tokens | ⚠️ |
| postgres | Database access | Connection | ⚠️ |
| notion | Workspace access | API Key | ⚠️ |
| exa | Enhanced search | API Key | ⚠️ |

**Legend:**
- ✅ Ready to use
- ⚠️ Needs API key configuration