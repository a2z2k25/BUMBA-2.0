/**
 * Tests for BUMBA Health Check System
 */

// Mock dependencies
jest.mock('../../../src/core/logging/bumba-logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn()
  }
}));

jest.mock('../../../src/core/monitoring/performance-metrics', () => ({
  performanceMetrics: {
    startTimer: jest.fn(() => jest.fn()),
    endTimer: jest.fn(),
    setGauge: jest.fn(),
    incrementCounter: jest.fn()
  }
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  promises: {
    writeFile: jest.fn(),
    unlink: jest.fn()
  }
}));

jest.mock('os', () => ({
  homedir: jest.fn(() => '/home/user'),
  hostname: jest.fn(() => 'test-host'),
  platform: jest.fn(() => 'linux'),
  arch: jest.fn(() => 'x64'),
  cpus: jest.fn(() => [1, 2, 3, 4]),
  totalmem: jest.fn(() => 8 * 1024 * 1024 * 1024),
  freemem: jest.fn(() => 4 * 1024 * 1024 * 1024),
  loadavg: jest.fn(() => [1.5, 1.2, 1.0])
}));

const fs = require('fs');
const { HealthCheckSystem } = require('../../../src/core/monitoring/health-check');

describe('HealthCheckSystem', () => {
  let healthCheck;
  let originalSetInterval;
  let originalSetImmediate;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock setInterval to prevent actual periodic checks
    originalSetInterval = global.setInterval;
    originalSetImmediate = global.setImmediate;
    
    // Mock file system operations
    fs.existsSync.mockReturnValue(true);
    fs.promises.writeFile.mockResolvedValue();
    fs.promises.unlink.mockResolvedValue();
    
    // Mock process methods
    process.memoryUsage = jest.fn(() => ({
      heapUsed: 100 * 1024 * 1024, // 100MB
      heapTotal: 200 * 1024 * 1024,
      rss: 300 * 1024 * 1024,
      external: 10 * 1024 * 1024,
      arrayBuffers: 5 * 1024 * 1024
    }));
    
    process.cpuUsage = jest.fn(() => ({
      user: 1000000,
      system: 500000
    }));
    
    process.uptime = jest.fn(() => 3600);
    
    healthCheck = new HealthCheckSystem();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    
    // Clean up health check resources
    if (healthCheck) {
      healthCheck.cleanup();
    }
  });

  describe('Initialization', () => {
    test('should register default health checks', async () => {
      healthCheck.registerDefaultChecks();
      expect(healthCheck.checks.has('memory')).toBe(true);
      expect(healthCheck.checks.has('cpu')).toBe(true);
      expect(healthCheck.checks.has('eventLoop')).toBe(true);
      expect(healthCheck.checks.has('filesystem')).toBe(true);
    });

    test('should start health monitoring', async () => {
      healthCheck.startPeriodicChecks();
      expect(healthCheck.checkInterval).toBeDefined();
    });
  });

  describe('Health Checks', () => {
    test('should run memory health check', async () => {
      healthCheck.registerDefaultChecks();
      const results = await healthCheck.runAllChecks();
      
      expect(results.checks.memory).toBeDefined();
      expect(results.checks.memory.status).toBe('healthy');
    });

    test('should detect unhealthy memory when usage is high', async () => {
      healthCheck.registerDefaultChecks();
      process.memoryUsage.mockReturnValueOnce({
        heapUsed: 600 * 1024 * 1024, // 600MB - above threshold
        heapTotal: 700 * 1024 * 1024,
        rss: 800 * 1024 * 1024
      });
      
      const results = await healthCheck.runAllChecks();
      
      expect(results.checks.memory.status).toBe('unhealthy');
    });

    test('should run filesystem health check', async () => {
      healthCheck.registerDefaultChecks();
      const results = await healthCheck.runAllChecks();
      
      expect(results.checks.filesystem).toBeDefined();
      expect(results.checks.filesystem.status).toBe('healthy');
      expect(fs.promises.writeFile).toHaveBeenCalled();
      expect(fs.promises.unlink).toHaveBeenCalled();
    });

    test('should detect filesystem issues', async () => {
      healthCheck.registerDefaultChecks();
      fs.promises.writeFile.mockRejectedValueOnce(new Error('Permission denied'));
      
      const results = await healthCheck.runAllChecks();
      
      expect(results.checks.filesystem.status).toBe('unhealthy');
      expect(results.checks.filesystem.error).toContain('Permission denied');
    });

    test('should check CPU usage', async () => {
      healthCheck.registerDefaultChecks();
      const results = await healthCheck.runAllChecks();
      
      expect(results.checks.cpu).toBeDefined();
      expect(results.checks.cpu.status).toBe('healthy');
    });

    test('should check event loop', async () => {
      healthCheck.registerDefaultChecks();
      const results = await healthCheck.runAllChecks();
      
      expect(results.checks.eventLoop).toBeDefined();
      // Event loop check depends on setImmediate behavior
    });
  });

  describe('Custom Health Checks', () => {
    test('should register custom health check', async () => {
      const customCheck = jest.fn(async () => ({
        healthy: true,
        details: { custom: 'data' }
      }));
      
      healthCheck.registerCheck('custom', customCheck);
      
      expect(healthCheck.checks.has('custom')).toBe(true);
      
      const results = await healthCheck.runHealthChecks();
      expect(customCheck).toHaveBeenCalled();
      expect(results.checks.custom.details.custom).toBe('data');
    });

    test('should handle failing custom check', async () => {
      const failingCheck = jest.fn(async () => {
        throw new Error('Custom check failed');
      });
      
      healthCheck.registerCheck('failing', failingCheck);
      
      const results = await healthCheck.runHealthChecks();
      
      expect(results.checks.failing.healthy).toBe(false);
      expect(results.checks.failing.error).toBe('Custom check failed');
    });
  });

  describe('Health Status', () => {
    test('should get current health status', async () => {
      const health = healthCheck.getHealth();
      
      expect(health.status).toBe('unknown');
      expect(health.lastCheck).toBeNull();
      expect(health.checks).toEqual({});
    });

    test('should update health status after checks', async () => {
      await healthCheck.runHealthChecks();
      
      const health = healthCheck.getHealth();
      
      expect(health.status).toBe('healthy');
      expect(health.lastCheck).toBeDefined();
      expect(health.summary.total).toBeGreaterThan(0);
    });

    test('should provide health summary', async () => {
      await healthCheck.runHealthChecks();
      
      const summary = healthCheck.getHealthSummary();
      
      expect(summary.total).toBe(4); // Default checks
      expect(summary.healthy).toBeGreaterThanOrEqual(0);
      expect(summary.unhealthy).toBeGreaterThanOrEqual(0);
      expect(summary.percentage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Health Report', () => {
    test('should create comprehensive health report', async () => {
      const report = await healthCheck.createHealthReport();
      
      expect(report.report).toBeDefined();
      expect(report.report.title).toBe('BUMBA Framework Health Report');
      expect(report.report.generated).toBeDefined();
      expect(report.report.system).toBeDefined();
      expect(report.report.system.hostname).toBe('test-host');
    });
  });

  describe('HTTP Endpoints', () => {
    test('should provide health endpoint handler', async () => {
      await healthCheck.runHealthChecks();
      
      const handler = healthCheck.getHealthEndpoint();
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      await handler({}, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy'
        })
      );
    });

    test('should return 503 for unhealthy status', async () => {
      // Force unhealthy state
      process.memoryUsage.mockReturnValueOnce({
        heapUsed: 500 * 1024 * 1024, // Above threshold
        heapTotal: 600 * 1024 * 1024,
        rss: 700 * 1024 * 1024
      });
      
      await healthCheck.runHealthChecks();
      
      const handler = healthCheck.getHealthEndpoint();
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      await handler({}, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(503);
    });

    test('should provide liveness endpoint', async () => {
      const handler = healthCheck.getLivenessEndpoint();
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      handler({}, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'alive'
        })
      );
    });

    test('should provide readiness endpoint', async () => {
      const handler = healthCheck.getReadinessEndpoint();
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      await handler({}, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ready: true
        })
      );
    });
  });

  describe('Monitoring Control', () => {
    test('should stop health monitoring', async () => {
      healthCheck.monitorInterval = 123;
      healthCheck.stopHealthMonitoring();
      
      expect(healthCheck.monitorInterval).toBeNull();
    });
  });

  describe('Events', () => {
    test('should emit health check complete event', async () => {
      const listener = jest.fn();
      healthCheck.on('health-check-complete', listener);
      
      await healthCheck.runHealthChecks();
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          results: expect.any(Object),
          timestamp: expect.any(Number)
        })
      );
    });
  });
});