const { ErrorTracker } = require('../../../src/core/error-handling/error-tracker');

describe('ErrorTracker', () => {
  let tracker;
  let consoleSpy;

  beforeEach(() => {
    tracker = new ErrorTracker();
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('track', () => {
    it('should track errors with proper categorization', () => {
      const error = new Error('Network connection failed');
      error.message = 'ECONNREFUSED: Connection refused';
      
      const record = tracker.track(error, {
        operation: 'api-call',
        severity: 'warning'
      });

      expect(record).toMatchObject({
        message: 'ECONNREFUSED: Connection refused',
        severity: 'warning',
        category: 'network',
        operation: 'api-call'
      });
      expect(record.id).toMatch(/^err_\d+_[a-z0-9]+$/);
      expect(tracker.errors).toHaveLength(1);
    });

    it('should auto-determine severity for critical errors', () => {
      const error = new Error('ENOMEM: Out of memory');
      const record = tracker.track(error);

      expect(record.severity).toBe('critical');
    });

    it('should update statistics correctly', () => {
      tracker.track(new Error('Test error 1'), { severity: 'error', category: 'general' });
      tracker.track(new Error('Test error 2'), { severity: 'critical', category: 'network' });
      tracker.track(new Error('Test error 3'), { severity: 'warning', category: 'general' });

      expect(tracker.stats).toEqual({
        total: 3,
        critical: 1,
        warning: 1,
        info: 0,
        byCategory: {
          general: 2,
          network: 1
        },
        byOperation: {}
      });
    });
  });

  describe('pattern detection', () => {
    it('should detect repeated errors', () => {
      const alertSpy = jest.fn();
      tracker.on('alert', alertSpy);

      // Track the same error 3 times
      for (let i = 0; i < 3; i++) {
        tracker.track(new Error('Repeated error message'));
      }

      expect(alertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'REPEATED_ERROR',
          data: expect.objectContaining({
            count: 3,
            threshold: 3
          })
        })
      );
    });
  });

  describe('alerts', () => {
    it('should alert on critical error spike', () => {
      const alertSpy = jest.fn();
      tracker.on('alert', alertSpy);

      // Track 5 critical errors
      for (let i = 0; i < 5; i++) {
        tracker.track(new Error('Critical error'), { severity: 'critical' });
      }

      expect(alertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CRITICAL_ERROR_SPIKE'
        })
      );
    });
  });

  describe('error filtering', () => {
    beforeEach(() => {
      tracker.track(new Error('Error 1'), { severity: 'critical', operation: 'op1' });
      tracker.track(new Error('Error 2'), { severity: 'warning', operation: 'op2' });
      tracker.track(new Error('Error 3'), { severity: 'error', operation: 'op1' });
    });

    it('should filter by severity', () => {
      const critical = tracker.getErrors({ severity: 'critical' });
      expect(critical).toHaveLength(1);
      expect(critical[0].severity).toBe('critical');
    });

    it('should filter by operation', () => {
      const op1Errors = tracker.getErrors({ operation: 'op1' });
      expect(op1Errors).toHaveLength(2);
      expect(op1Errors.every(e => e.operation === 'op1')).toBe(true);
    });
  });

  describe('getSummary', () => {
    it('should return comprehensive error summary', () => {
      tracker.track(new Error('Error 1'), { severity: 'critical' });
      tracker.track(new Error('Error 2'), { severity: 'warning' });
      tracker.track(new Error('Error 1'), { severity: 'critical' }); // Repeated

      const summary = tracker.getSummary();

      expect(summary).toHaveProperty('stats');
      expect(summary.stats.total).toBe(3);
      expect(summary.stats.critical).toBe(2);
      expect(summary).toHaveProperty('topErrors');
      expect(summary.topErrors[0]).toMatchObject({
        error: 'Error_Error 1',
        count: 2
      });
    });
  });

  describe('clear', () => {
    it('should clear all error data', () => {
      tracker.track(new Error('Test error'));
      expect(tracker.errors).toHaveLength(1);

      tracker.clear();

      expect(tracker.errors).toHaveLength(0);
      expect(tracker.errorPatterns.size).toBe(0);
      expect(tracker.stats.total).toBe(0);
    });
  });
});