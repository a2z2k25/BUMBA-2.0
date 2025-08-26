
describe('Monitoring Systems', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  test('health monitor should provide status', async () => {
    const { bumbaHealthMonitor } = require('../../../src/core/monitoring/health-monitor');
    const status = await bumbaHealthMonitor.getHealthStatus();
    expect(status).toBeDefined();
    expect(status.overall_status).toBeDefined();
  });

  test('performance metrics should collect data', async () => {
    const { bumbaMetrics } = require('../../../src/core/monitoring/performance-metrics');
    bumbaMetrics.recordCommand('test', 100, true);
    const metrics = await bumbaMetrics.collectMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.commandReliability).toBeGreaterThanOrEqual(0);
  });
});
