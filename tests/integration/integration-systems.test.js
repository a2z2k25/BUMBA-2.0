/**
 * BUMBA Integration Systems Test Suite
 * Comprehensive testing for all integration components
 */

const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');
const path = require('path');

// Import all integrations
const { FigmaIntegration } = require('../../src/core/integrations/figma-integration');
const { PostgresIntegration } = require('../../src/core/integrations/postgres-integration');
const { MongoDBIntegration } = require('../../src/core/integrations/mongodb-integration');
const { RedisIntegration } = require('../../src/core/integrations/redis-integration');
const { DockerIntegration } = require('../../src/core/integrations/docker-integration');
const { KubernetesIntegration } = require('../../src/core/integrations/kubernetes-integration');
const { SlackIntegration } = require('../../src/core/integrations/slack-integration');
const { DiscordIntegration } = require('../../src/core/integrations/discord-integration');
const { OpenRouterIntegration } = require('../../src/core/integrations/openrouter-integration');
const { ContextMCPIntegration } = require('../../src/core/integrations/context-mcp-integration');
const { IntegrationConfig } = require('../../src/core/config/integration-config');
const { CircuitBreaker, MCPResilienceSystem } = require('../../src/core/mcp/circuit-breaker');

describe('Integration Systems Test Suite', () => {
  
  describe('Configuration System', () => {
    let config;
    
    beforeAll(() => {
      config = new IntegrationConfig();
    });
    
    test('should load configuration', () => {
      expect(config).toBeDefined();
      expect(config.config).toBeDefined();
      expect(config.config.global).toBeDefined();
    });
    
    test('should parse environment variables', () => {
      const result = config.parseJsonEnv('TEST_JSON', { default: true });
      expect(result).toEqual({ default: true });
    });
    
    test('should get integration config', () => {
      const notionConfig = config.getIntegrationConfig('mcp', 'notion');
      expect(notionConfig).toBeDefined();
      expect(notionConfig.enabled).toBeDefined();
    });
    
    test('should check if integration is enabled', () => {
      const isEnabled = config.isEnabled('mcp', 'notion');
      expect(typeof isEnabled).toBe('boolean');
    });
    
    test('should get all enabled integrations', () => {
      const enabled = config.getEnabledIntegrations();
      expect(enabled).toBeDefined();
      expect(enabled.mcp).toBeInstanceOf(Array);
      expect(enabled.databases).toBeInstanceOf(Array);
      expect(enabled.services).toBeInstanceOf(Array);
    });
    
    test('should generate .env.example', () => {
      const envExample = config.generateEnvExample();
      expect(envExample).toContain('BUMBA Integration Configuration');
      expect(envExample).toContain('NOTION_ENABLED');
      expect(envExample).toContain('POSTGRES_ENABLED');
      expect(envExample).toContain('DOCKER_ENABLED');
    });
  });
  
  describe('Circuit Breaker System', () => {
    let circuitBreaker;
    let resilienceSystem;
    
    beforeAll(() => {
      circuitBreaker = new CircuitBreaker({
        threshold: 3,
        timeout: 1000,
        resetTimeout: 5000
      });
      
      resilienceSystem = new MCPResilienceSystem();
    });
    
    test('should create circuit breaker', () => {
      expect(circuitBreaker).toBeDefined();
      expect(circuitBreaker.state).toBe('CLOSED');
    });
    
    test('should handle successful execution', async () => {
      const result = await circuitBreaker.execute(async () => 'success');
      expect(result).toBe('success');
      expect(circuitBreaker.state).toBe('CLOSED');
    });
    
    test('should trip circuit after failures', async () => {
      const failingFn = async () => {
        throw new Error('Test failure');
      };
      
      // Fail multiple times
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFn);
        } catch (e) {
          // Expected
        }
      }
      
      expect(circuitBreaker.state).toBe('OPEN');
    });
    
    test('should use fallback when circuit is open', async () => {
      circuitBreaker.tripCircuit();
      
      const result = await circuitBreaker.execute(
        async () => 'main',
        async () => 'fallback'
      );
      
      expect(result).toBe('fallback');
    });
    
    test('should register MCP server fallback', () => {
      resilienceSystem.registerFallback('test-server', async () => 'fallback-result');
      expect(resilienceSystem.fallbacks.has('test-server')).toBe(true);
    });
    
    test('should get circuit breaker stats', () => {
      const stats = circuitBreaker.getStats();
      expect(stats).toBeDefined();
      expect(stats.totalRequests).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeDefined();
      expect(stats.failureRate).toBeDefined();
    });
  });
  
  describe('Figma Integration', () => {
    let figma;
    
    beforeAll(() => {
      figma = new FigmaIntegration({
        accessToken: 'test-token'
      });
    });
    
    test('should create Figma integration', () => {
      expect(figma).toBeDefined();
      expect(figma.config.devMode).toBe(true);
    });
    
    test('should convert to PascalCase', () => {
      const result = figma.toPascalCase('my-component-name');
      expect(result).toBe('MyComponentName');
    });
    
    test('should convert to kebab-case', () => {
      const result = figma.toKebabCase('MyComponentName');
      expect(result).toBe('my-component-name');
    });
    
    test('should generate React component', () => {
      const node = {
        name: 'TestButton',
        children: [
          { name: 'Label' },
          { name: 'Icon' }
        ]
      };
      
      const code = figma.generateReactComponent(node);
      expect(code).toContain('const TestButton');
      expect(code).toContain('className="test-button"');
      expect(code).toContain('export default TestButton');
    });
    
    test('should generate Vue component', () => {
      const node = { name: 'TestCard' };
      const code = figma.generateVueComponent(node);
      expect(code).toContain('<template>');
      expect(code).toContain('name: \'TestCard\'');
    });
    
    test('should get status', () => {
      const status = figma.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.devMode).toBe(true);
      expect(status.metrics).toBeDefined();
    });
  });
  
  describe('Database Integrations', () => {
    describe('PostgreSQL', () => {
      let postgres;
      
      beforeAll(() => {
        postgres = new PostgresIntegration();
      });
      
      test('should create PostgreSQL integration', () => {
        expect(postgres).toBeDefined();
        expect(postgres.config.pool).toBeDefined();
      });
      
      test('should mock query execution', async () => {
        const result = await postgres.mockQuery('SELECT NOW()');
        expect(result.rows).toBeDefined();
        expect(result.rows[0].now).toBeDefined();
      });
      
      test('should get status', () => {
        const status = postgres.getStatus();
        expect(status.connected).toBeDefined();
        expect(status.metrics).toBeDefined();
      });
    });
    
    describe('MongoDB', () => {
      let mongodb;
      
      beforeAll(() => {
        mongodb = new MongoDBIntegration();
      });
      
      test('should create MongoDB integration', () => {
        expect(mongodb).toBeDefined();
        expect(mongodb.config.options).toBeDefined();
      });
      
      test('should mock database operations', () => {
        const db = mongodb.mockDatabase('test');
        expect(db).toBeDefined();
        expect(db.collection).toBeDefined();
      });
      
      test('should get status', () => {
        const status = mongodb.getStatus();
        expect(status.connected).toBeDefined();
        expect(status.metrics).toBeDefined();
      });
    });
    
    describe('Redis', () => {
      let redis;
      
      beforeAll(() => {
        redis = new RedisIntegration();
      });
      
      test('should create Redis integration', () => {
        expect(redis).toBeDefined();
        expect(redis.config.cache).toBeDefined();
      });
      
      test('should serialize and deserialize values', () => {
        const obj = { test: 'value' };
        const serialized = redis.serialize(obj);
        const deserialized = redis.deserialize(serialized);
        expect(deserialized).toEqual(obj);
      });
      
      test('should prefix cache keys', () => {
        const key = redis.prefixKey('test');
        expect(key).toBe('cache:test');
      });
      
      test('should get cache statistics', () => {
        const stats = redis.getCacheStats();
        expect(stats.hitRate).toBeDefined();
        expect(stats.hits).toBeDefined();
        expect(stats.misses).toBeDefined();
      });
    });
  });
  
  describe('DevOps Integrations', () => {
    describe('Docker', () => {
      let docker;
      
      beforeAll(() => {
        docker = new DockerIntegration();
      });
      
      test('should create Docker integration', () => {
        expect(docker).toBeDefined();
        expect(docker.config.build).toBeDefined();
      });
      
      test('should generate Dockerfile', async () => {
        const dockerfile = await docker.generateDockerfile({
          baseImage: 'node:18',
          port: 3000,
          context: '/tmp'
        });
        expect(dockerfile).toBeDefined();
      });
      
      test('should get status', () => {
        const status = docker.getStatus();
        expect(status.available).toBeDefined();
        expect(status.metrics).toBeDefined();
      });
    });
    
    describe('Kubernetes', () => {
      let k8s;
      
      beforeAll(() => {
        k8s = new KubernetesIntegration();
      });
      
      test('should create Kubernetes integration', () => {
        expect(k8s).toBeDefined();
        expect(k8s.config.deployment).toBeDefined();
      });
      
      test('should format environment variables', () => {
        const env = { NODE_ENV: 'test', PORT: 3000 };
        const formatted = k8s.formatEnvVars(env);
        expect(formatted).toEqual([
          { name: 'NODE_ENV', value: 'test' },
          { name: 'PORT', value: '3000' }
        ]);
      });
      
      test('should get kubectl flags', () => {
        k8s.config.namespace = 'test';
        const flags = k8s.getKubectlFlags();
        expect(flags).toContain('-n test');
      });
    });
  });
  
  describe('Context MCP Integration', () => {
    let contextMCP;
    
    beforeAll(() => {
      contextMCP = new ContextMCPIntegration({
        storagePath: '/tmp/test-context',
        autoSave: false
      });
    });
    
    test('should create Context MCP integration', () => {
      expect(contextMCP).toBeDefined();
      expect(contextMCP.config.maxContextSize).toBe(200000);
      expect(contextMCP.config.preservationStrategy).toBe('intelligent');
    });
    
    test('should create new context', () => {
      const contextId = contextMCP.createContext('test-context', {
        type: 'conversation',
        metadata: { test: true }
      });
      
      expect(contextId).toBeDefined();
      expect(contextId).toMatch(/^ctx_/);
      expect(contextMCP.contexts.has(contextId)).toBe(true);
    });
    
    test('should add content to context', () => {
      const contextId = contextMCP.createContext('test-add');
      
      contextMCP.addToContext(contextId, 'Test message', {
        type: 'message',
        role: 'user'
      });
      
      const context = contextMCP.getContext(contextId);
      expect(context.messages).toHaveLength(1);
      expect(context.messages[0].content).toBe('Test message');
      expect(context.messages[0].role).toBe('user');
    });
    
    test('should search across contexts', () => {
      const ctx1 = contextMCP.createContext('search-test-1');
      const ctx2 = contextMCP.createContext('search-test-2');
      
      contextMCP.addToContext(ctx1, 'Important information about testing');
      contextMCP.addToContext(ctx2, 'Other content');
      
      const results = contextMCP.searchContexts('important');
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].contextId).toBe(ctx1);
    });
    
    test('should estimate tokens correctly', () => {
      const tokens = contextMCP.estimateTokens('This is a test message');
      expect(tokens).toBe(6); // ~22 chars / 4 = 5.5, rounded up to 6
    });
    
    test('should calculate message importance', () => {
      const importantMsg = {
        role: 'system',
        content: 'IMPORTANT: This contains TODO items and code ```js```'
      };
      
      const normalMsg = {
        role: 'user',
        content: 'Hello'
      };
      
      const score1 = contextMCP.calculateImportance(importantMsg, 0, [importantMsg]);
      const score2 = contextMCP.calculateImportance(normalMsg, 0, [normalMsg]);
      
      expect(score1).toBeGreaterThan(score2);
    });
    
    test('should merge contexts', () => {
      const ctx1 = contextMCP.createContext('merge-1');
      const ctx2 = contextMCP.createContext('merge-2');
      
      contextMCP.addToContext(ctx1, 'Message 1');
      contextMCP.addToContext(ctx2, 'Message 2');
      
      const mergedId = contextMCP.mergeContexts([ctx1, ctx2], 'merged-context', {
        type: 'project'
      });
      
      const merged = contextMCP.getContext(mergedId);
      expect(merged.messages).toHaveLength(2);
      expect(merged.type).toBe('project');
    });
    
    test('should export context in different formats', () => {
      const ctxId = contextMCP.createContext('export-test');
      contextMCP.addToContext(ctxId, 'Test content');
      
      const jsonExport = contextMCP.exportContext(ctxId, 'json');
      expect(JSON.parse(jsonExport)).toBeDefined();
      
      const claudeExport = contextMCP.exportContext(ctxId, 'claude');
      expect(claudeExport).toContain('<context');
      expect(claudeExport).toContain('</context>');
    });
    
    test('should serialize and deserialize context', () => {
      const ctx = {
        id: 'test-123',
        name: 'Test',
        content: {
          messages: [{ role: 'user', content: 'Test' }],
          files: new Set(['file1.js']),
          references: new Map([['key1', 'value1']])
        },
        relationships: {
          children: new Set(['child1']),
          related: new Set(['related1'])
        }
      };
      
      const serialized = contextMCP.serializeContext(ctx);
      const deserialized = contextMCP.deserializeContext(serialized);
      
      expect(deserialized.id).toBe('test-123');
      expect(deserialized.content.files).toBeInstanceOf(Set);
      expect(deserialized.content.references).toBeInstanceOf(Map);
    });
    
    test('should get status', () => {
      const status = contextMCP.getStatus();
      expect(status.contextsLoaded).toBeGreaterThanOrEqual(0);
      expect(status.storage).toBeDefined();
      expect(status.features).toBeDefined();
      expect(status.metrics).toBeDefined();
    });
  });

  describe('Communication Services', () => {
    describe('Slack', () => {
      let slack;
      
      beforeAll(() => {
        slack = new SlackIntegration();
      });
      
      test('should create Slack integration', () => {
        expect(slack).toBeDefined();
        expect(slack.config.defaultChannel).toBe('#general');
      });
      
      test('should create rich message blocks', () => {
        const blocks = slack.createRichMessage('Test Title', [
          { type: 'text', content: 'Test content' },
          { type: 'fields', fields: [
            { title: 'Field 1', value: 'Value 1' }
          ]}
        ]);
        
        expect(blocks).toBeInstanceOf(Array);
        expect(blocks[0].type).toBe('header');
        expect(blocks.length).toBeGreaterThan(1);
      });
    });
    
    describe('Discord', () => {
      let discord;
      
      beforeAll(() => {
        discord = new DiscordIntegration();
      });
      
      test('should create Discord integration', () => {
        expect(discord).toBeDefined();
        expect(discord.config.bot.prefix).toBe('!');
      });
      
      test('should create embed message', () => {
        const embed = discord.createEmbed('Test', 'Description', {
          color: 0xff0000,
          fields: [{ name: 'Field', value: 'Value' }]
        });
        
        expect(embed.title).toBe('Test');
        expect(embed.color).toBe(0xff0000);
        expect(embed.timestamp).toBeDefined();
      });
    });
  });
  
  describe('Integration Loading', () => {
    test('should load all integration files', () => {
      const integrations = [
        'figma-integration',
        'postgres-integration',
        'mongodb-integration',
        'redis-integration',
        'docker-integration',
        'kubernetes-integration',
        'slack-integration',
        'discord-integration',
        'openrouter-integration',
        'pinecone-integration',
        'serena-integration',
        'kimi-k2-integration'
      ];
      
      integrations.forEach(name => {
        const filePath = path.join(__dirname, '../../src/core/integrations', `${name}.js`);
        expect(() => require(filePath)).not.toThrow();
      });
    });
  });
  
  describe('Integration Metrics', () => {
    test('should track Figma metrics', () => {
      const figma = new FigmaIntegration();
      expect(figma.metrics.apiCalls).toBe(0);
      expect(figma.metrics.componentsExtracted).toBe(0);
    });
    
    test('should track database metrics', () => {
      const postgres = new PostgresIntegration();
      expect(postgres.metrics.totalQueries).toBe(0);
      expect(postgres.metrics.successfulQueries).toBe(0);
    });
    
    test('should track Redis cache metrics', () => {
      const redis = new RedisIntegration();
      expect(redis.metrics.hits).toBe(0);
      expect(redis.metrics.misses).toBe(0);
    });
  });
});

// Run minimal validation test
describe('Quick Validation', () => {
  test('all integrations should export expected classes', () => {
    expect(FigmaIntegration).toBeDefined();
    expect(PostgresIntegration).toBeDefined();
    expect(MongoDBIntegration).toBeDefined();
    expect(RedisIntegration).toBeDefined();
    expect(DockerIntegration).toBeDefined();
    expect(KubernetesIntegration).toBeDefined();
    expect(SlackIntegration).toBeDefined();
    expect(DiscordIntegration).toBeDefined();
    expect(IntegrationConfig).toBeDefined();
    expect(CircuitBreaker).toBeDefined();
    expect(MCPResilienceSystem).toBeDefined();
  });
});