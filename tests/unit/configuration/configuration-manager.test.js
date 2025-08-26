/**
 * Tests for BUMBA Configuration Manager
 */

jest.mock('../../../src/core/logging/bumba-logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn()
}));

jest.mock('os', () => ({
  homedir: jest.fn(() => '/home/user')
}));

const fs = require('fs');
const { ConfigurationManager } = require('../../../src/core/configuration/configuration-manager');

describe('ConfigurationManager', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  let configManager;

  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(false); // Default: no config file exists
    configManager = new ConfigurationManager();
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', async () => {
      expect(configManager.config.framework.version).toBe('1.0.0');
      expect(configManager.config.departments.strategic.enabled).toBe(true);
      expect(configManager.config.performance.maxMemoryMB).toBe(512);
      expect(configManager.config.security.validateCommands).toBe(true);
    });

    test('should set correct paths', async () => {
      expect(configManager.config.paths.home).toBe('/home/user/.claude');
      expect(configManager.config.paths.logs).toBe('/home/user/.claude/logs');
      expect(configManager.config.paths.cache).toBe('/home/user/.claude/cache');
      expect(configManager.config.paths.config).toBe('/home/user/.claude/config');
    });

    test('should load configuration from file if exists', async () => {
      const fileConfig = {
        framework: { version: '2.0.0' },
        performance: { maxMemoryMB: 1024 }
      };
      
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(fileConfig));
      
      const newManager = new ConfigurationManager();
      
      expect(newManager.config.framework.version).toBe('2.0.0');
      expect(newManager.config.performance.maxMemoryMB).toBe(1024);
    });

    test('should handle invalid config file gracefully', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json');
      
      expect(() => new ConfigurationManager()).not.toThrow();
    });
  });

  describe('Get Configuration', () => {
    test('should get configuration value by path', async () => {
      expect(configManager.get('framework.version')).toBe('1.0.0');
      expect(configManager.get('departments.technical.maxSpecialists')).toBe(10);
      expect(configManager.get('security.validateCommands')).toBe(true);
    });

    test('should return default value for non-existent path', async () => {
      expect(configManager.get('non.existent.path', 'default')).toBe('default');
    });

    test('should return undefined for non-existent path without default', async () => {
      expect(configManager.get('non.existent.path')).toBeUndefined();
    });
  });

  describe('Set Configuration', () => {
    test('should set configuration value by path', async () => {
      configManager.set('framework.version', '2.0.0');
      
      expect(configManager.get('framework.version')).toBe('2.0.0');
    });

    test('should create nested path if not exists', async () => {
      configManager.set('new.nested.value', 'test');
      
      expect(configManager.get('new.nested.value')).toBe('test');
    });

    test('should emit config changed event', async () => {
      const listener = jest.fn();
      configManager.on('config:changed', listener);
      
      configManager.set('framework.mode', 'development');
      
      expect(listener).toHaveBeenCalledWith({
        path: 'framework.mode',
        oldValue: 'production',
        newValue: 'development'
      });
    });
  });

  describe('Save Configuration', () => {
    test('should save configuration to file', async () => {
      configManager.saveConfiguration();
      
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        '/home/user/.claude/config',
        { recursive: true }
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/home/user/.claude/config/bumba.config.json',
        expect.any(String)
      );
    });

    test('should emit config saved event', async () => {
      const listener = jest.fn();
      configManager.on('config:saved', listener);
      
      configManager.saveConfiguration();
      
      expect(listener).toHaveBeenCalledWith(configManager.config);
    });

    test('should handle save errors gracefully', async () => {
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      expect(() => configManager.saveConfiguration()).not.toThrow();
    });
  });

  describe('Merge Configuration', () => {
    test('should merge new configuration', async () => {
      const newConfig = {
        framework: { mode: 'development' },
        performance: { maxAgents: 20 }
      };
      
      configManager.mergeConfig(newConfig);
      
      expect(configManager.get('framework.mode')).toBe('development');
      expect(configManager.get('performance.maxAgents')).toBe(20);
      expect(configManager.get('framework.version')).toBe('1.0.0'); // Unchanged
    });

    test('should emit config merged event', async () => {
      const listener = jest.fn();
      configManager.on('config:merged', listener);
      
      configManager.mergeConfig({ test: true });
      
      expect(listener).toHaveBeenCalledWith(configManager.config);
    });
  });

  describe('Reset Configuration', () => {
    test('should reset to default configuration', async () => {
      configManager.set('framework.version', '2.0.0');
      configManager.reset();
      
      expect(configManager.get('framework.version')).toBe('1.0.0');
    });

    test('should emit config reset event', async () => {
      const listener = jest.fn();
      configManager.on('config:reset', listener);
      
      configManager.reset();
      
      expect(listener).toHaveBeenCalledWith(configManager.config);
    });
  });

  describe('Validation', () => {
    test('should validate valid configuration', async () => {
      const result = configManager.validate();
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should detect missing home path', async () => {
      delete configManager.config.paths.home;
      
      const result = configManager.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required path: home');
    });

    test('should detect invalid memory limit', async () => {
      configManager.set('performance.maxMemoryMB', 64);
      
      const result = configManager.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('maxMemoryMB must be at least 128');
    });

    test('should detect invalid agent limit', async () => {
      configManager.set('performance.maxAgents', 0);
      
      const result = configManager.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('maxAgents must be at least 1');
    });

    test('should detect missing framework version', async () => {
      delete configManager.config.framework.version;
      
      const result = configManager.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing framework version');
    });
  });

  describe('Export/Import', () => {
    test('should export configuration as JSON', async () => {
      const exported = configManager.export();
      const parsed = JSON.parse(exported);
      
      expect(parsed.framework.version).toBe('1.0.0');
    });

    test('should import valid configuration', async () => {
      const newConfig = {
        framework: { version: '3.0.0' }
      };
      
      const result = configManager.import(JSON.stringify(newConfig));
      
      expect(result.success).toBe(true);
      expect(configManager.get('framework.version')).toBe('3.0.0');
    });

    test('should handle import errors', async () => {
      const result = configManager.import('invalid json');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Deep Merge Utility', () => {
    test('should deep merge objects correctly', async () => {
      const target = {
        a: { b: 1, c: 2 },
        d: 3
      };
      
      const source = {
        a: { b: 10, e: 4 },
        f: 5
      };
      
      const result = configManager.deepMerge(target, source);
      
      expect(result.a.b).toBe(10);
      expect(result.a.c).toBe(2);
      expect(result.a.e).toBe(4);
      expect(result.d).toBe(3);
      expect(result.f).toBe(5);
    });

    test('should handle arrays and non-objects', async () => {
      const target = { a: [1, 2], b: 'string' };
      const source = { a: [3, 4], b: 'new string' };
      
      const result = configManager.deepMerge(target, source);
      
      expect(result.a).toEqual([3, 4]);
      expect(result.b).toBe('new string');
    });
  });
});