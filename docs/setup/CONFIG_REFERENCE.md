# BUMBA Configuration Reference

## Overview
BUMBA uses a centralized configuration system with a clear priority order:
1. **Defaults** - Built-in safe defaults
2. **Config File** - `bumba.config.json` or `.bumba.json`
3. **Environment Variables** - Runtime overrides
4. **Command Line** - Highest priority

## Configuration File Location
BUMBA looks for configuration in these locations (in order):
- `./bumba.config.json`
- `./.bumba.json`
- `./config/bumba.json`

## Core Configuration Options

### Framework Settings
| Option | Default | Description |
|--------|---------|-------------|
| `framework.name` | `BUMBA` | Framework name |
| `framework.version` | `2.0.0` | Framework version |
| `framework.mode` | `production` | Operating mode: development, production |
| `framework.debug` | `false` | Enable debug logging |

### Timeouts (milliseconds)
| Option | Default | Range | Description |
|--------|---------|-------|-------------|
| `timeouts.default` | `30000` | 1000-300000 | Default operation timeout |
| `timeouts.command` | `60000` | 5000-300000 | Command execution timeout |
| `timeouts.api` | `10000` | 1000-60000 | API call timeout |
| `timeouts.agent` | `30000` | 5000-120000 | Agent operation timeout |
| `timeouts.network` | `5000` | 1000-30000 | Network request timeout |

### Resource Limits
| Option | Default | Range | Description |
|--------|---------|-------|-------------|
| `limits.maxActiveAgents` | `10` | 1-100 | Maximum concurrent agents |
| `limits.maxMemoryMB` | `512` | 128-4096 | Memory limit in MB |
| `limits.maxCacheSize` | `1000` | 100-10000 | Maximum cache entries |
| `limits.maxFileSize` | `10MB` | - | Maximum file size for processing |
| `limits.maxConcurrentOperations` | `5` | 1-20 | Maximum parallel operations |

### Performance Thresholds
| Option | Default | Description |
|--------|---------|-------------|
| `thresholds.complexity.low` | `0.3` | Low complexity threshold |
| `thresholds.complexity.medium` | `0.6` | Medium complexity threshold |
| `thresholds.complexity.high` | `0.8` | High complexity threshold |
| `thresholds.performance.responseTime` | `2000` | Slow response warning (ms) |
| `thresholds.performance.errorRate` | `0.05` | Error rate alert threshold |
| `thresholds.performance.memoryUsage` | `0.8` | Memory usage warning (ratio) |

### Retry Configuration
| Option | Default | Description |
|--------|---------|-------------|
| `retry.maxAttempts` | `3` | Maximum retry attempts |
| `retry.initialDelay` | `1000` | Initial retry delay (ms) |
| `retry.maxDelay` | `30000` | Maximum retry delay (ms) |
| `retry.backoffFactor` | `2` | Exponential backoff multiplier |

### Feature Flags
| Option | Default | Description |
|--------|---------|-------------|
| `features.audioEnabled` | `true` | Enable audio feedback |
| `features.monitoringEnabled` | `true` | Enable system monitoring |
| `features.cachingEnabled` | `true` | Enable response caching |
| `features.compressionEnabled` | `true` | Enable data compression |
| `features.telemetryEnabled` | `false` | Enable telemetry collection |
| `features.experimentalFeatures` | `false` | Enable experimental features |

### Logging Configuration
| Option | Default | Options | Description |
|--------|---------|---------|-------------|
| `logging.level` | `info` | error, warn, info, debug | Log verbosity level |
| `logging.format` | `json` | json, text | Log output format |
| `logging.colorize` | `true` | - | Colorize console output |
| `logging.timestamp` | `true` | - | Include timestamps |
| `logging.maxFiles` | `5` | - | Maximum log files to keep |

### Cache Configuration
| Option | Default | Description |
|--------|---------|-------------|
| `cache.memory.maxSize` | `1000` | Maximum items in memory cache |
| `cache.memory.ttl` | `3600000` | Cache TTL (1 hour) |
| `cache.memory.checkPeriod` | `600000` | Cache cleanup interval (10 min) |
| `cache.file.enabled` | `false` | Enable file-based caching |
| `cache.file.maxSize` | `100MB` | Maximum file cache size |

### Monitoring Configuration
| Option | Default | Description |
|--------|---------|-------------|
| `monitoring.enabled` | `true` | Enable monitoring |
| `monitoring.interval` | `30000` | Metrics collection interval (ms) |
| `monitoring.metrics.cpu` | `true` | Monitor CPU usage |
| `monitoring.metrics.memory` | `true` | Monitor memory usage |
| `monitoring.metrics.responseTime` | `true` | Monitor response times |
| `monitoring.alerts.enabled` | `true` | Enable alerting |

## Environment Variables

All configuration options can be overridden using environment variables:

| Environment Variable | Config Path | Type |
|---------------------|-------------|------|
| `NODE_ENV` | `framework.mode` | string |
| `BUMBA_DEBUG` | `framework.debug` | boolean |
| `BUMBA_MAX_MEMORY` | `limits.maxMemoryMB` | number |
| `BUMBA_MAX_AGENTS` | `limits.maxActiveAgents` | number |
| `BUMBA_TIMEOUT` | `timeouts.default` | number |
| `BUMBA_LOG_LEVEL` | `logging.level` | string |
| `BUMBA_DISABLE_AUDIO` | `features.audioEnabled` | boolean |
| `BUMBA_DISABLE_MONITORING` | `features.monitoringEnabled` | boolean |
| `BUMBA_INSTALL_DIR` | `paths.installation` | string |
| `BUMBA_API_URL` | `api.baseUrl` | string |

### API Keys (Required for Operation)
| Environment Variable | Description |
|---------------------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key (primary) |
| `OPENAI_API_KEY` | OpenAI API key (fallback) |
| `GOOGLE_API_KEY` | Google Gemini API key (fallback) |
| `NOTION_API_KEY` | Notion integration |
| `GITHUB_TOKEN` | GitHub integration |

## Configuration File Example

```json
{
  "framework": {
    "mode": "production",
    "debug": false
  },
  "timeouts": {
    "default": 45000,
    "api": 15000
  },
  "limits": {
    "maxActiveAgents": 20,
    "maxMemoryMB": 1024
  },
  "features": {
    "audioEnabled": true,
    "experimentalFeatures": false
  },
  "logging": {
    "level": "info",
    "format": "json"
  }
}
```

## Safe Ranges and Recommendations

### Production Settings
```json
{
  "framework.mode": "production",
  "framework.debug": false,
  "timeouts.default": 30000,
  "limits.maxActiveAgents": 10,
  "limits.maxMemoryMB": 512,
  "retry.maxAttempts": 3,
  "features.experimentalFeatures": false,
  "logging.level": "info"
}
```

### Development Settings
```json
{
  "framework.mode": "development",
  "framework.debug": true,
  "timeouts.default": 60000,
  "limits.maxActiveAgents": 5,
  "limits.maxMemoryMB": 256,
  "retry.maxAttempts": 1,
  "features.experimentalFeatures": true,
  "logging.level": "debug"
}
```

### High Performance Settings
```json
{
  "limits.maxActiveAgents": 20,
  "limits.maxMemoryMB": 2048,
  "cache.memory.maxSize": 5000,
  "features.cachingEnabled": true,
  "features.compressionEnabled": true,
  "monitoring.interval": 60000
}
```

### Low Resource Settings
```json
{
  "limits.maxActiveAgents": 3,
  "limits.maxMemoryMB": 256,
  "cache.memory.maxSize": 500,
  "features.monitoringEnabled": false,
  "features.cachingEnabled": false,
  "monitoring.interval": 300000
}
```

## Configuration Commands

### View Current Configuration
```bash
/bumba:config show           # Show all configuration
/bumba:config show timeouts  # Show specific section
/bumba:config explain limits.maxMemoryMB  # Explain option
```

### Validate Configuration
```bash
/bumba:config validate       # Check for errors
/bumba:config test          # Test with current settings
```

### Export Configuration
```bash
/bumba:config export         # Export to bumba.config.json
/bumba:config export --env   # Export as environment variables
```

## Troubleshooting

### Common Issues

1. **"Configuration validation failed"**
   - Check that numeric values are within valid ranges
   - Ensure required fields are present
   - Verify file paths exist and are writable

2. **"Cannot find configuration file"**
   - Place config in one of the expected locations
   - Use `BUMBA_CONFIG_PATH` to specify custom location
   - Run `/bumba:config init` to create default config

3. **"Environment variable not working"**
   - Ensure variable is exported: `export BUMBA_DEBUG=true`
   - Check variable name matches exactly (case-sensitive)
   - Restart BUMBA after changing environment

4. **"Feature not working despite configuration"**
   - Some features require API keys to function
   - Check `/bumba:status` for capability report
   - Verify feature dependencies are met

## Best Practices

1. **Use config files for static settings** - Things that rarely change
2. **Use environment variables for secrets** - API keys, tokens
3. **Use command line for temporary overrides** - Testing, debugging
4. **Version control your config file** - But not your .env file
5. **Start with defaults** - Only override what you need
6. **Monitor resource usage** - Adjust limits based on actual usage
7. **Test configuration changes** - Use `/bumba:config test` before deploying

## Configuration Priority

When the same option is set in multiple places, the priority is:
1. Command line arguments (highest)
2. Environment variables
3. Configuration file
4. Default values (lowest)

Example:
- Default: `logging.level = "info"`
- Config file: `logging.level = "warn"`
- Environment: `BUMBA_LOG_LEVEL=debug`
- Result: `logging.level = "debug"` (environment wins)

## Getting Help

- Run `/bumba:config help` for configuration commands
- Run `/bumba:config explain <path>` for option details
- Check logs for configuration warnings
- File issues at: https://github.com/bumba/issues