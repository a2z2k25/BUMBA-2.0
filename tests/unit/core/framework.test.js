/**
 * Unit tests for Core Framework
 */

describe('BUMBA Core Framework', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('Configuration', () => {
    test('should load bumba.config.js', async () => {
      const config = require('../../../bumba.config.js');
      
      expect(config).toBeDefined();
      expect(config).toHaveProperty('framework');
      expect(config).toHaveProperty('installation');
      expect(config).toHaveProperty('commands');
      expect(config.framework.name).toBe('BUMBA CLI');
    });
  });

  describe('Audio System', () => {
    test('should initialize audio celebration', async () => {
      const { audioCelebration } = require('../../../src/core/audio-celebration');
      
      expect(audioCelebration).toBeDefined();
      expect(audioCelebration.audioFile).toBe('/Users/az/Code/bumba/assets/audio/bumba-horn.mp3');
      expect(audioCelebration.celebrationCount).toBeDefined();
    });

    test('should have audio fallback system', async () => {
      const { audioFallbackSystem } = require('../../../src/core/audio-fallback-system');
      
      expect(audioFallbackSystem).toBeDefined();
      expect(audioFallbackSystem.audioEnabled).toBe(true);
      expect(audioFallbackSystem.currentStrategy).toBeDefined();
    });
  });

  describe('Logging System', () => {
    test('should have logger configured', async () => {
      const { logger } = require('../../../src/core/logging/bumba-logger');
      
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should have global error boundary', async () => {
      const globalErrorBoundary = require('../../../src/core/error-handling/global-error-boundary');
      
      expect(globalErrorBoundary).toBeDefined();
      expect(globalErrorBoundary.GlobalErrorBoundary).toBeDefined();
    });

    test('should have error system', async () => {
      const errorSystem = require('../../../src/core/error-handling/bumba-error-system');
      
      expect(errorSystem).toBeDefined();
      expect(errorSystem.BumbaError).toBeDefined();
    });
  });

  describe('Command System', () => {
    test('should have command handler', async () => {
      const commandHandler = require('../../../src/core/command-handler');
      
      expect(commandHandler).toBeDefined();
      expect(commandHandler.BumbaCommandHandler).toBeDefined();
    });
  });

  describe('Hook System', () => {
    test('should have hook system', async () => {
      const hookSystem = require('../../../src/core/hooks/bumba-hook-system');
      
      expect(hookSystem).toBeDefined();
      expect(hookSystem.BumbaHookSystem).toBeDefined();
    });
  });

  describe('Integration System', () => {
    test('should have integration activation manager', async () => {
      const IntegrationActivationManager = require('../../../src/core/integration/integration-activation-manager');
      
      expect(IntegrationActivationManager).toBeDefined();
      expect(IntegrationActivationManager.IntegrationActivationManager).toBeDefined();
    });

    test('should have mock providers', async () => {
      const notionMock = require('../../../src/core/integration/mocks/notion-mock-provider');
      
      expect(notionMock).toBeDefined();
      expect(notionMock.NotionMockProvider).toBeDefined();
    });
  });

  describe('Resource Management', () => {
    test('should have memory manager', async () => {
      const memoryManager = require('../../../src/core/resource-management/memory-manager');
      
      expect(memoryManager).toBeDefined();
      expect(memoryManager.MemoryManager).toBeDefined();
    });

    test('should have resource manager', async () => {
      const resourceManager = require('../../../src/core/resource-management/resource-manager');
      
      expect(resourceManager).toBeDefined();
      expect(resourceManager.ResourceManager).toBeDefined();
    });
  });

  describe('Security', () => {
    test('should have command validator', async () => {
      const { CommandValidator } = require('../../../src/core/security/command-validator');
      
      expect(CommandValidator).toBeDefined();
      const validator = new CommandValidator();
      expect(validator.validateCommand).toBeDefined();
    });

    test('should have secure executor', async () => {
      const { SecureExecutor } = require('../../../src/core/security/secure-executor');
      
      expect(SecureExecutor).toBeDefined();
      const executor = new SecureExecutor();
      expect(executor.execute).toBeDefined();
    });
  });
});