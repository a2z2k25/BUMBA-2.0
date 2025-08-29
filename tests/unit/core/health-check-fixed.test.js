/**
 * Fixed Health Check Tests
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

const { HealthCheckSystem } = require('../../../src/core/monitoring/health-check');

describe('HealthCheckSystem', () => {
  let healthCheck;

  beforeEach(() => {
    jest.clearAllMocks();
    healthCheck = new HealthCheckSystem();
  });

  afterEach(() => {
    if (healthCheck) {
      healthCheck.cleanup();
    }
  });

  describe('Initialization', () => {
    test('should initialize with correct defaults', () => {
      expect(healthCheck.status).toBe('initializing');
      expect(healthCheck.lastCheck).toBeNull();
      expect(healthCheck.checks).toBeDefined();
    });

    test('should register default health checks', () => {
      healthCheck.registerDefaultChecks();
      expect(healthCheck.checks.has('memory')).toBe(true);
      expect(healthCheck.checks.has('cpu')).toBe(true);
      expect(healthCheck.checks.has('eventLoop')).toBe(true);
      expect(healthCheck.checks.has('filesystem')).toBe(true);
    });
  });

  describe('Check Registration', () => {
    test('should register custom health check', () => {
      const customCheck = jest.fn();
      healthCheck.registerCheck('custom', customCheck);
      
      expect(healthCheck.checks.has('custom')).toBe(true);
      const check = healthCheck.checks.get('custom');
      expect(check.name).toBe('custom');
      expect(check.check).toBe(customCheck);
    });

    test('should register check with options', () => {
      const customCheck = jest.fn();
      healthCheck.registerCheck('critical', customCheck, {
        critical: true,
        timeout: 10000,
        retries: 5
      });
      
      const check = healthCheck.checks.get('critical');
      expect(check.options.critical).toBe(true);
      expect(check.options.timeout).toBe(10000);
      expect(check.options.retries).toBe(5);
    });
  });

  describe('Health Status', () => {
    test('should get current health status', () => {
      const status = healthCheck.getStatus();
      
      expect(status.status).toBe('initializing');
      expect(status.lastCheck).toBeNull();
      expect(status.checks).toEqual([]);
    });

    test('should check if system is healthy', () => {
      expect(healthCheck.isHealthy()).toBe(false);
      
      healthCheck.status = 'healthy';
      expect(healthCheck.isHealthy()).toBe(true);
      
      healthCheck.status = 'unhealthy';
      expect(healthCheck.isHealthy()).toBe(false);
    });

    test('should provide health summary', () => {
      healthCheck.registerCheck('check1', jest.fn());
      healthCheck.registerCheck('check2', jest.fn());
      
      const summary = healthCheck.getHealthSummary();
      
      expect(summary.total).toBe(2);
      expect(summary.healthy).toBe(0);
      expect(summary.unhealthy).toBe(0);
      expect(summary.percentage).toBe(0);
    });
  });

  describe('Single Check Execution', () => {
    test('should run successful health check', async () => {
      const mockCheck = jest.fn().mockResolvedValue({ data: 'ok' });
      healthCheck.registerCheck('test', mockCheck);
      
      const result = await healthCheck.runCheck('test');
      
      expect(mockCheck).toHaveBeenCalled();
      expect(result.name).toBe('test');
      expect(result.status).toBe('healthy');
      expect(result.result).toEqual({ data: 'ok' });
    });

    test('should handle failing health check', async () => {
      const mockCheck = jest.fn().mockRejectedValue(new Error('Check failed'));
      healthCheck.registerCheck('failing', mockCheck);
      
      const result = await healthCheck.runCheck('failing');
      
      expect(result.name).toBe('failing');
      expect(result.status).toBe('unhealthy');
      expect(result.error).toBe('Check failed');
    });

    test('should handle critical check failure', async () => {
      const mockCheck = jest.fn().mockRejectedValue(new Error('Critical failure'));
      healthCheck.registerCheck('critical', mockCheck, { critical: true });
      
      await healthCheck.runCheck('critical');
      
      expect(healthCheck.status).toBe('unhealthy');
    });

    test('should throw error for non-existent check', async () => {
      await expect(healthCheck.runCheck('nonexistent')).rejects.toThrow('Health check nonexistent not found');
    });
  });

  describe('All Checks Execution', () => {
    test('should run all health checks', async () => {
      const check1 = jest.fn().mockResolvedValue({ data: 'ok1' });
      const check2 = jest.fn().mockResolvedValue({ data: 'ok2' });
      
      healthCheck.registerCheck('check1', check1);
      healthCheck.registerCheck('check2', check2);
      
      const results = await healthCheck.runAllChecks();
      
      expect(check1).toHaveBeenCalled();
      expect(check2).toHaveBeenCalled();
      expect(results.status).toBe('healthy');
      expect(results.checks.check1.status).toBe('healthy');
      expect(results.checks.check2.status).toBe('healthy');
    });

    test('should mark unhealthy if critical check fails', async () => {
      const check1 = jest.fn().mockResolvedValue({ data: 'ok' });
      const check2 = jest.fn().mockRejectedValue(new Error('Critical error'));
      
      healthCheck.registerCheck('normal', check1);
      healthCheck.registerCheck('critical', check2, { critical: true });
      
      const results = await healthCheck.runAllChecks();
      
      expect(results.status).toBe('unhealthy');
      expect(results.checks.normal.status).toBe('healthy');
      expect(results.checks.critical.status).toBe('unhealthy');
    });
  });

  describe('Periodic Checks', () => {
    test('should start periodic health checks', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      
      healthCheck.startPeriodicChecks(5000);
      
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 5000);
      expect(healthCheck.checkInterval).toBeDefined();
      
      setIntervalSpy.mockRestore();
    });

    test('should stop periodic health checks', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      healthCheck.checkInterval = 123;
      
      healthCheck.stopPeriodicChecks();
      
      expect(clearIntervalSpy).toHaveBeenCalledWith(123);
      expect(healthCheck.checkInterval).toBeNull();
      
      clearIntervalSpy.mockRestore();
    });
  });

  describe('HTTP Endpoints', () => {
    test('should provide health endpoint handler', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const handler = healthCheck.getHealthEndpoint();
      await handler({}, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(503); // unhealthy by default
      expect(mockRes.json).toHaveBeenCalled();
    });

    test('should provide liveness endpoint', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const handler = healthCheck.getLivenessEndpoint();
      handler({}, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'alive'
        })
      );
    });

    test('should provide readiness endpoint', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const handler = healthCheck.getReadinessEndpoint();
      await handler({}, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ready: false // Not healthy yet
        })
      );
    });
  });

  describe('Health Report', () => {
    test('should create health report', async () => {
      const mockCheck = jest.fn().mockResolvedValue({ data: 'ok' });
      healthCheck.registerCheck('test', mockCheck);
      
      const report = await healthCheck.createHealthReport();
      
      expect(report.report).toBeDefined();
      expect(report.report.title).toBe('BUMBA CLI Health Report');
      expect(report.report.generated).toBeDefined();
      expect(report.report.system).toBeDefined();
      expect(report.report.health).toBeDefined();
      expect(report.report.summary).toBeDefined();
    });
  });

  describe('Events', () => {
    test('should emit check-passed event', async () => {
      const listener = jest.fn();
      healthCheck.on('check-passed', listener);
      
      const mockCheck = jest.fn().mockResolvedValue({ data: 'ok' });
      healthCheck.registerCheck('test', mockCheck);
      
      await healthCheck.runCheck('test');
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test',
          result: { data: 'ok' }
        })
      );
    });

    test('should emit check-failed event', async () => {
      const listener = jest.fn();
      healthCheck.on('check-failed', listener);
      
      const mockCheck = jest.fn().mockRejectedValue(new Error('Failed'));
      healthCheck.registerCheck('test', mockCheck);
      
      await healthCheck.runCheck('test');
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test',
          error: 'Failed'
        })
      );
    });

    test('should emit health-check-complete event', async () => {
      const listener = jest.fn();
      healthCheck.on('health-check-complete', listener);
      
      const mockCheck = jest.fn().mockResolvedValue({ data: 'ok' });
      healthCheck.registerCheck('test', mockCheck);
      
      await healthCheck.runAllChecks();
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          checks: expect.any(Object),
          timestamp: expect.any(Number)
        })
      );
    });
  });

  describe('Cleanup', () => {
    test('should cleanup resources', () => {
      const removeAllListenersSpy = jest.spyOn(healthCheck, 'removeAllListeners');
      
      healthCheck.registerCheck('test', jest.fn());
      healthCheck.checkInterval = 123;
      
      healthCheck.cleanup();
      
      expect(healthCheck.checks.size).toBe(0);
      expect(healthCheck.checkInterval).toBeNull();
      expect(removeAllListenersSpy).toHaveBeenCalled();
    });
  });
});