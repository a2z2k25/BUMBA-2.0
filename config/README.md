# BUMBA Configuration Files

This directory contains environment-specific configuration files for different deployment scenarios.

## Configuration Structure

### Environment Configs
- `development.config.js` - Development environment settings
- `production.config.js` - Production environment settings  
- `testing.config.js` - Test environment settings

### Service Configs
- `mcp-servers.config.js` - MCP server configurations
- `ai-providers.config.js` - AI provider settings
- `security.config.js` - Security and auth configurations

## Usage

Configurations are loaded based on NODE_ENV:

```bash
NODE_ENV=production  # Loads production.config.js
NODE_ENV=development # Loads development.config.js
NODE_ENV=test        # Loads testing.config.js
```

## Configuration Priority

1. Environment variables (highest priority)
2. Environment-specific config files
3. Main bumba.config.js (default fallback)

## Adding Configurations

When adding new configurations:
1. Create environment-specific variants
2. Document required environment variables
3. Provide sensible defaults
4. Validate configurations at startup