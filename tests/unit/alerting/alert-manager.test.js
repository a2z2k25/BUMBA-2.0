const { AlertManager } = require('../../../src/core/alerting/alert-manager');

describe('AlertManager', () => {
  let manager;
  let consoleSpy;

  beforeEach(() => {
    manager = new AlertManager();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    manager.clear();
    consoleSpy.mockRestore();
  });

  describe('alert creation', () => {
    it('should create and send alerts', () => {
      const eventSpy = jest.fn();
      manager.on('alert-created', eventSpy);

      const alert = manager.alert(
        'TEST_ALERT',
        'This is a test alert',
        { testData: 'value' },
        'medium'
      );

      expect(alert).toMatchObject({
        type: 'TEST_ALERT',
        message: 'This is a test alert',
        severity: 'medium',
        data: { testData: 'value' },
        acknowledged: false
      });
      expect(alert.id).toMatch(/^alert_\d+_[a-z0-9]+$/);
      expect(eventSpy).toHaveBeenCalledWith(alert);
    });

    it('should deduplicate alerts within time window', () => {
      const alert1 = manager.alert('DUPLICATE', 'Same message');
      const alert2 = manager.alert('DUPLICATE', 'Same message');

      expect(alert1).toBeTruthy();
      expect(alert2).toBeNull();
      expect(manager.alerts).toHaveLength(1);
    });

    it('should send alerts to all channels', () => {
      // Mock console channel
      const channelSpy = jest.fn();
      manager.channels.get('console').send = channelSpy;

      manager.alert('TEST', 'Test message', {}, 'high');

      expect(channelSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TEST',
          message: 'Test message',
          severity: 'high'
        })
      );
    });
  });

  describe('acknowledge', () => {
    it('should acknowledge alerts', () => {
      const alert = manager.alert('TEST', 'Test alert');
      const eventSpy = jest.fn();
      manager.on('alert-acknowledged', eventSpy);

      const result = manager.acknowledge(alert.id, 'user123');

      expect(result).toBe(true);
      expect(alert.acknowledged).toBe(true);
      expect(alert.acknowledgedBy).toBe('user123');
      expect(eventSpy).toHaveBeenCalledWith(alert);
    });

    it('should not acknowledge already acknowledged alerts', () => {
      const alert = manager.alert('TEST', 'Test alert');
      manager.acknowledge(alert.id);

      const result = manager.acknowledge(alert.id);
      expect(result).toBe(false);
    });
  });

  describe('getAlerts', () => {
    beforeEach(() => {
      manager.alert('TYPE1', 'Message 1', {}, 'critical');
      manager.alert('TYPE2', 'Message 2', {}, 'medium');
      manager.alert('TYPE1', 'Message 3', {}, 'low');
      
      // Acknowledge one alert
      manager.acknowledge(manager.alerts[1].id);
    });

    it('should filter by severity', () => {
      const critical = manager.getAlerts({ severity: 'critical' });
      expect(critical).toHaveLength(1);
      expect(critical[0].severity).toBe('critical');
    });

    it('should filter by type', () => {
      const type1 = manager.getAlerts({ type: 'TYPE1' });
      expect(type1).toHaveLength(2);
      expect(type1.every(a => a.type === 'TYPE1')).toBe(true);
    });

    it('should filter by acknowledged status', () => {
      const unacknowledged = manager.getAlerts({ acknowledged: false });
      expect(unacknowledged).toHaveLength(2);

      const acknowledged = manager.getAlerts({ acknowledged: true });
      expect(acknowledged).toHaveLength(1);
    });
  });

  describe('getSummary', () => {
    it('should return alert summary', () => {
      manager.alert('ERROR', 'Error 1', {}, 'critical');
      manager.alert('WARNING', 'Warning 1', {}, 'medium');
      manager.alert('ERROR', 'Error 2', {}, 'critical');
      manager.acknowledge(manager.alerts[0].id);

      const summary = manager.getSummary();

      expect(summary).toMatchObject({
        total: 3,
        unacknowledged: 2,
        bySeverity: {
          critical: 2,
          medium: 1
        },
        byType: {
          ERROR: 2,
          WARNING: 1
        }
      });
    });
  });

  describe('cleanup', () => {
    it('should clean up old alerts', () => {
      // Create an old alert
      const oldAlert = manager.alert('OLD', 'Old alert');
      oldAlert.timestamp = new Date(Date.now() - 90000000).toISOString(); // > 24 hours old

      // Create a recent alert
      manager.alert('RECENT', 'Recent alert');

      manager.cleanupOldAlerts();

      expect(manager.alerts).toHaveLength(1);
      expect(manager.alerts[0].type).toBe('RECENT');
    });
  });

  describe('clear', () => {
    it('should clear all alerts', () => {
      manager.alert('TEST1', 'Alert 1');
      manager.alert('TEST2', 'Alert 2');
      expect(manager.alerts).toHaveLength(2);

      const eventSpy = jest.fn();
      manager.on('alerts-cleared', eventSpy);

      manager.clear();

      expect(manager.alerts).toHaveLength(0);
      expect(eventSpy).toHaveBeenCalled();
    });
  });
});