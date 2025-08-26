// Mock logger
jest.mock('../../../src/core/logging/bumba-logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock performance before requiring the module
const mockPerformanceNow = jest.fn();
jest.mock('perf_hooks', () => ({
  performance: {
    now: mockPerformanceNow
  }
}));

const { PerformanceBenchmark } = require('../../../src/core/performance/benchmark');
const { logger } = require('../../../src/core/logging/bumba-logger');

describe('PerformanceBenchmark', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  let benchmark;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock for each test
    mockPerformanceNow.mockReset();
    mockPerformanceNow.mockImplementation(() => Date.now());
    
    benchmark = new PerformanceBenchmark();
  });

  describe('benchmarkSync', () => {
    it('should measure sync function performance', () => {
      // Mock performance.now to return consistent values
      mockPerformanceNow
        .mockReturnValueOnce(1000) // start
        .mockReturnValueOnce(1005); // end (5ms later)
      
      const testFn = () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };

      const { result, metrics } = benchmark.benchmarkSync('test-operation', testFn);

      expect(result).toBe(499500);
      expect(metrics).toHaveProperty('operation', 'test-operation');
      expect(metrics).toHaveProperty('duration');
      expect(metrics.duration).toBe(5);
      expect(metrics).toHaveProperty('memoryDelta');
      expect(metrics).toHaveProperty('timestamp');
    });

    it('should handle errors in sync functions', () => {
      const testFn = () => {
        throw new Error('Test error');
      };

      expect(() => benchmark.benchmarkSync('test-operation', testFn)).toThrow('Test error');
    });
  });

  describe('benchmarkAsync', () => {
    it('should measure async function performance', async () => {
      // Mock performance.now to return consistent values
      mockPerformanceNow
        .mockReturnValueOnce(1000) // start
        .mockReturnValueOnce(1015); // end (15ms later)
      
      const testFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async result';
      };

      const { result, metrics } = await benchmark.benchmarkAsync('async-operation', testFn);

      expect(result).toBe('async result');
      expect(metrics).toHaveProperty('operation', 'async-operation');
      expect(metrics).toHaveProperty('duration');
      expect(metrics.duration).toBe(15);
      expect(metrics).toHaveProperty('memoryDelta');
    });

    it('should handle errors in async functions', async () => {
      const testFn = async () => {
        throw new Error('Async test error');
      };

      await expect(benchmark.benchmarkAsync('async-operation', testFn)).rejects.toThrow('Async test error');
    });
  });

  describe('threshold warnings', () => {
    it('should warn when operation exceeds threshold', () => {
      jest.clearAllMocks();
      
      // Set up performance.now mock to simulate timing
      mockPerformanceNow
        .mockReturnValueOnce(1000) // start time
        .mockReturnValueOnce(1010); // end time (10ms later)
      
      // Create a new benchmark instance
      const testBenchmark = new PerformanceBenchmark();
      testBenchmark.thresholds.test_operation = 5; // 5ms threshold
      
      testBenchmark.start('test_operation');
      testBenchmark.end('test_operation');

      expect(logger.warn).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Performance warning: test_operation')
      );
    });
  });

  describe('getReport', () => {
    it('should return system performance report', () => {
      const report = benchmark.getReport();

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('memory');
      expect(report.memory).toHaveProperty('heapUsed');
      expect(report.memory).toHaveProperty('heapTotal');
      expect(report).toHaveProperty('cpu');
      expect(report).toHaveProperty('uptime');
      expect(report.uptime).toBeGreaterThan(0);
    });
  });
});