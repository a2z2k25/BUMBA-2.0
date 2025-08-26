/**
 * BUMBA Integrations Configuration Module
 */

module.exports = {
  load(customIntegrations = {}) {
    return {
      // MCP Servers
      mcp: {
        enabled: customIntegrations.mcp?.enabled !== false,
        servers: {
          memory: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-memory'],
            enabled: true
          },
          github: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
            env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN },
            enabled: !!process.env.GITHUB_TOKEN
          },
          notion: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-notion'],
            env: { NOTION_API_KEY: process.env.NOTION_API_KEY },
            enabled: !!process.env.NOTION_API_KEY
          },
          sequential_thinking: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
            enabled: true
          },
          ...customIntegrations.mcp?.servers
        }
      },
      
      // Databases
      databases: {
        postgres: {
          enabled: !!process.env.PG_HOST,
          config: {
            host: process.env.PG_HOST || 'localhost',
            port: process.env.PG_PORT || 5432,
            database: process.env.PG_DATABASE,
            user: process.env.PG_USER,
            password: process.env.PG_PASSWORD
          }
        },
        mongodb: {
          enabled: !!process.env.MONGODB_URI,
          config: {
            uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
            database: process.env.MONGODB_DATABASE
          }
        },
        redis: {
          enabled: !!process.env.REDIS_HOST,
          config: {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD
          }
        },
        ...customIntegrations.databases
      },
      
      // External Services
      external: {
        discord: {
          enabled: !!process.env.DISCORD_TOKEN,
          config: {
            token: process.env.DISCORD_TOKEN,
            clientId: process.env.DISCORD_CLIENT_ID,
            guildId: process.env.DISCORD_GUILD_ID
          }
        },
        notion: {
          enabled: !!process.env.NOTION_API_KEY,
          config: {
            apiKey: process.env.NOTION_API_KEY,
            version: '2022-06-28'
          }
        },
        github: {
          enabled: !!process.env.GITHUB_TOKEN,
          config: {
            token: process.env.GITHUB_TOKEN,
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO
          }
        },
        figma: {
          enabled: !!process.env.FIGMA_TOKEN,
          config: {
            token: process.env.FIGMA_TOKEN
          }
        },
        ...customIntegrations.external
      },
      
      // AI Services
      ai: {
        openai: {
          enabled: !!process.env.OPENAI_API_KEY,
          config: {
            apiKey: process.env.OPENAI_API_KEY,
            organization: process.env.OPENAI_ORG
          }
        },
        anthropic: {
          enabled: !!process.env.ANTHROPIC_API_KEY,
          config: {
            apiKey: process.env.ANTHROPIC_API_KEY
          }
        },
        openrouter: {
          enabled: !!process.env.OPENROUTER_API_KEY,
          config: {
            apiKey: process.env.OPENROUTER_API_KEY
          }
        },
        pinecone: {
          enabled: !!process.env.PINECONE_API_KEY,
          config: {
            apiKey: process.env.PINECONE_API_KEY,
            environment: process.env.PINECONE_ENV
          }
        },
        ...customIntegrations.ai
      },
      
      // DevOps
      devops: {
        docker: {
          enabled: true,
          config: {
            socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock'
          }
        },
        kubernetes: {
          enabled: !!process.env.KUBECONFIG,
          config: {
            configPath: process.env.KUBECONFIG || '~/.kube/config',
            namespace: process.env.K8S_NAMESPACE || 'default'
          }
        },
        ...customIntegrations.devops
      },
      
      // Integration settings
      settings: {
        autoLoad: customIntegrations.settings?.autoLoad !== false,
        lazyLoad: customIntegrations.settings?.lazyLoad !== false,
        validateOnStartup: customIntegrations.settings?.validateOnStartup !== false,
        retryFailedIntegrations: customIntegrations.settings?.retryFailedIntegrations !== false,
        maxRetries: customIntegrations.settings?.maxRetries || 3,
        retryDelay: customIntegrations.settings?.retryDelay || 5000
      }
    };
  }
};