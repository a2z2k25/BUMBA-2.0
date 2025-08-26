const { PerformanceMonitor } = require('../../../src/core/monitoring/performance-monitor');

describe('PerformanceMonitor', () => {
  let monitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    jest.useFakeTimers();
  });

  afterEach(() => {
    monitor.stop();
    jest.useRealTimers();
  });

  describe('monitoring lifecycle', () => {
    it('should start and stop monitoring', () => {
      expect(monitor.isMonitoring).toBe(false);
      
      monitor.start();
      expect(monitor.isMonitoring).toBe(true);
      
      monitor.stop();
      expect(monitor.isMonitoring).toBe(false);
    });

    it('should not start if already monitoring', () => {
      monitor.start();
      const intervalId = monitor.monitoringInterval;
      
      monitor.start();
      expect(monitor.monitoringInterval).toBe(intervalId);
    });
  });

  describe('recordOperation', () => {
    it('should record operation metrics', () => {
      const metric = {
        operation: 'test-op',
        duration: 100,
        timestamp: new Date().toISOString()
      };

      monitor.recordOperation(metric);

      expect(monitor.metrics).toHaveLength(1);
      expect(monitor.metrics[0]).toEqual(metric);
      expect(monitor.stats.totalOperations).toBe(1);
      expect(monitor.stats.totalDuration).toBe(100);
    });

    it('should track failed operations', () => {
      const metric = {
        operation: 'test-op',
        error: 'Test error',
        timestamp: new Date().toISOString()
      };

      monitor.recordOperation(metric);

      expect(monitor.stats.failedOperations).toBe(1);
    });

    it('should trim metrics history', () => {
      monitor.config.maxMetricsHistory = 5;

      for (let i = 0; i < 10; i++) {
        monitor.recordOperation({
          operation: `op-${i}`,
          duration: i * 10
        });
      }

      expect(monitor.metrics).toHaveLength(5);
      expect(monitor.metrics[0].operation).toBe('op-5');
    });
  });

  describe('alerts', () => {
    it('should create alert for slow response', () => {
      const alertSpy = jest.fn();
      monitor.on('alert', alertSpy);

      monitor.recordOperation({
        operation: 'slow-op',
        duration: 2000 // 2 seconds
      });

      expect(alertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SLOW_RESPONSE',
          data: expect.objectContaining({
            operation: 'slow-op',
            duration: 2000,
            threshold: 1000
          })
        })
      );
    });

    it('should create alert for high error rate', () => {
      const alertSpy = jest.fn();
      monitor.on('alert', alertSpy);

      // Record 10 operations, 2 failed (20% error rate)
      for (let i = 0; i < 8; i++) {
        monitor.recordOperation({ operation: 'op', duration: 50 });
      }
      for (let i = 0; i < 2; i++) {
        monitor.recordOperation({ operation: 'op', error: 'Failed' });
      }

      expect(alertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'HIGH_ERROR_RATE',
          data: expect.objectContaining({
            errorRate: 0.2,
            threshold: 0.05
          })
        })
      );
    });
  });

  describe('collectMetrics', () => {
    it('should collect system metrics periodically', () => {
      monitor.start();
      expect(monitor.metrics).toHaveLength(0);

      jest.advanceTimersByTime(30000);
      expect(monitor.metrics.length).toBeGreaterThan(0);
      
      const systemMetric = monitor.metrics.find(m => m.type === 'system');
      expect(systemMetric).toBeDefined();
      expect(systemMetric).toHaveProperty('memory');
      expect(systemMetric).toHaveProperty('cpu');
      expect(systemMetric).toHaveProperty('uptime');
    });
  });

  describe('getSummary', () => {
    it('should return performance summary', () => {
      // Record some metrics
      monitor.recordOperation({ operation: 'op1', duration: 100 });
      monitor.recordOperation({ operation: 'op2', duration: 200 });
      monitor.recordOperation({ operation: 'op3', error: 'Failed' });

      const summary = monitor.getSummary();

      expect(summary).toHaveProperty('totalOperations', 3);
      expect(summary).toHaveProperty('failedOperations', 1);
      expect(summary).toHaveProperty('errorRate', 1/3);
      expect(summary).toHaveProperty('averageResponseTime', 150);
      expect(summary).toHaveProperty('recentAlerts');
      expect(summary).toHaveProperty('currentMemoryUsage');
      expect(summary).toHaveProperty('uptime');
    });

    it('should handle empty metrics', () => {
      const summary = monitor.getSummary();

      expect(summary.totalOperations).toBe(0);
      expect(summary.errorRate).toBe(0);
      expect(summary.averageResponseTime).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all metrics and stats', () => {
      monitor.recordOperation({ operation: 'op', duration: 100 });
      monitor.createAlert('TEST_ALERT', {});

      monitor.clear();

      expect(monitor.metrics).toHaveLength(0);
      expect(monitor.alerts).toHaveLength(0);
      expect(monitor.stats).toEqual({
        totalOperations: 0,
        failedOperations: 0,
        totalDuration: 0
      });
    });
  });
});