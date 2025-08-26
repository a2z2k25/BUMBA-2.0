/**
 * Simplified Health Check Test to verify test infrastructure
 */

// Mock dependencies before imports
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

describe('Simple HealthCheckSystem Tests', () => {
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

  test('should create health check instance', () => {
    expect(healthCheck).toBeDefined();
    expect(healthCheck.status).toBe('initializing');
  });

  test('should register a check', () => {
    healthCheck.registerCheck('test', async () => ({ healthy: true }));
    expect(healthCheck.checks.has('test')).toBe(true);
  });

  test('should get status', () => {
    const status = healthCheck.getStatus();
    expect(status).toBeDefined();
    expect(status.status).toBe('initializing');
    expect(status.lastCheck).toBeNull();
  });

  test('should check if healthy', () => {
    expect(healthCheck.isHealthy()).toBe(false);
    healthCheck.status = 'healthy';
    expect(healthCheck.isHealthy()).toBe(true);
  });

  test('should run a simple check', async () => {
    const mockCheck = jest.fn().mockResolvedValue({ healthy: true });
    healthCheck.registerCheck('simple', mockCheck);
    
    const result = await healthCheck.runCheck('simple');
    
    expect(mockCheck).toHaveBeenCalled();
    expect(result.status).toBe('healthy');
  });

  test('should handle check failure', async () => {
    const mockCheck = jest.fn().mockRejectedValue(new Error('Check failed'));
    healthCheck.registerCheck('failing', mockCheck);
    
    const result = await healthCheck.runCheck('failing');
    
    expect(result.status).toBe('unhealthy');
    expect(result.error).toBe('Check failed');
  });

  test('should cleanup resources', () => {
    healthCheck.registerCheck('test', async () => ({ healthy: true }));
    expect(healthCheck.checks.size).toBe(1);
    
    healthCheck.cleanup();
    
    expect(healthCheck.checks.size).toBe(0);
  });
});