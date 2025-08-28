/**
 * BUMBA Hybrid Mode Integration Tests
 */

const { 
  EnvironmentDetector, 
  ModeManager, 
  ConfigBridge 
} = require('../src/core/hybrid');

const VisionAnalyzer = require('../src/core/vision/vision-analyzer');
const fs = require('fs').promises;
const path = require('path');

describe('BUMBA 3.0 Hybrid Mode', () => {
  let modeManager;
  let configBridge;

  beforeEach(async () => {
    configBridge = new ConfigBridge();
    modeManager = new ModeManager();
  });

  describe('Environment Detection', () => {
    test('detects terminal environment correctly', () => {
      const env = EnvironmentDetector.detect();
      expect(env.mode).toBeDefined();
      expect(['terminal', 'claude', 'vscode']).toContain(env.mode);
    });

    test('returns correct capabilities for terminal mode', () => {
      const env = EnvironmentDetector.detect();
      if (env.mode === 'terminal') {
        expect(env.capabilities.taskPreparation).toBe(true);
        expect(env.capabilities.vision).toBe(false);
        expect(env.capabilities.ai).toBe(false);
      }
    });

    test('generates unique session ID', () => {
      const env1 = EnvironmentDetector.detect();
      const env2 = EnvironmentDetector.detect();
      expect(env1.context.sessionId).not.toBe(env2.context.sessionId);
    });
  });

  describe('Mode Manager', () => {
    test('initializes correct mode based on environment', () => {
      const mode = modeManager.getCurrentMode();
      expect(mode).toBeDefined();
      expect(mode.initialized).toBe(true);
    });

    test('provides mode capabilities', () => {
      const capabilities = modeManager.getCapabilities();
      expect(capabilities).toBeDefined();
      expect(typeof capabilities.filesystem).toBe('boolean');
      expect(typeof capabilities.vision).toBe('boolean');
    });

    test('checks individual capabilities', () => {
      const hasFilesystem = modeManager.hasCapability('filesystem');
      expect(typeof hasFilesystem).toBe('boolean');
      expect(hasFilesystem).toBe(true); // filesystem always available
    });
  });

  describe('Task Preparation (Bridge Mode)', () => {
    test('prepares task with context', async () => {
      if (!modeManager.hasCapability('taskPreparation')) {
        return; // Skip in non-terminal modes
      }

      const task = await modeManager.prepareTask({
        type: 'implementation',
        description: 'user authentication system'
      });

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.context).toBeDefined();
    });

    test('saves task to filesystem', async () => {
      const mode = modeManager.getCurrentMode();
      const taskId = mode.generateTaskId();
      
      await mode.saveTask({
        id: taskId,
        type: 'test',
        description: 'test task'
      });

      const loadedTask = await mode.loadTask(taskId);
      expect(loadedTask.id).toBe(taskId);
      expect(loadedTask.type).toBe('test');
    });
  });

  describe('Configuration Bridge', () => {
    test('loads default configuration', async () => {
      const config = await configBridge.load();
      expect(config.version).toBeDefined();
      expect(config.modes).toBeDefined();
    });

    test('gets configuration values', async () => {
      await configBridge.load();
      const version = configBridge.get('version', '0.0.0');
      expect(version).toBeDefined();
    });

    test('sets configuration values', async () => {
      await configBridge.load();
      configBridge.set('test.value', 'test123');
      const value = configBridge.get('test.value');
      expect(value).toBe('test123');
    });

    test('validates configuration', async () => {
      await configBridge.load();
      const validation = configBridge.validate(configBridge.config);
      expect(validation.valid).toBeDefined();
      expect(Array.isArray(validation.errors)).toBe(true);
    });
  });

  describe('Vision Capabilities', () => {
    test('validates image files correctly', async () => {
      const analyzer = new VisionAnalyzer();
      
      // Test with non-existent file
      const validation = await analyzer.validateImage('non-existent.png');
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('not found');
    });

    test('prepares vision task in terminal mode', async () => {
      if (modeManager.hasCapability('vision')) {
        return; // Skip in Claude mode
      }

      const analyzer = new VisionAnalyzer();
      
      // Create a test image file
      const testImagePath = path.join(process.cwd(), 'test-image.png');
      await fs.writeFile(testImagePath, Buffer.from('fake-image-data'));
      
      try {
        const task = await analyzer.prepareVisionTask(testImagePath);
        expect(task.id).toBeDefined();
        expect(task.type).toBe('vision');
        expect(task.analysis.requiresClaude).toBe(true);
      } finally {
        // Clean up
        await fs.unlink(testImagePath).catch(() => {});
      }
    });
  });

  describe('Cross-Mode Handoff', () => {
    test('generates handoff instructions', async () => {
      const HandoffGenerator = require('../src/core/hybrid/bridge/handoff-generator');
      const generator = new HandoffGenerator();
      
      const task = {
        id: 'test_123',
        type: 'implementation',
        description: 'test task',
        context: { type: 'node', stack: ['react'] }
      };
      
      const handoff = generator.generate(task);
      expect(handoff.quickStart).toContain('/bumba:execute');
      expect(handoff.quickStart).toContain(task.id);
      expect(handoff.taskFile).toBeDefined();
    });
  });

  describe('Mode Status', () => {
    test('displays correct status information', () => {
      const status = modeManager.getStatus();
      expect(status.mode).toBeDefined();
      expect(status.initialized).toBe(true);
      expect(status.capabilities).toBeDefined();
      expect(status.context).toBeDefined();
      expect(status.platform).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('handles missing task gracefully', async () => {
      const mode = modeManager.getCurrentMode();
      
      await expect(mode.loadTask('non-existent-task'))
        .rejects
        .toThrow('Task not found');
    });

    test('handles invalid commands gracefully', async () => {
      await expect(modeManager.execute('invalid-command'))
        .rejects
        .toThrow('not available');
    });
  });
});

// Run tests if executed directly
if (require.main === module) {
  const jest = require('jest');
  jest.run(['--testPathPattern=hybrid-mode.test.js']);
}