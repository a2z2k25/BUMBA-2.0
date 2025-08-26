/**
 * Widget System Test Suite
 * Comprehensive tests for BUMBA's Notion-embeddable widgets
 */

const { BumbaWidgets, widgets } = require('../../../src/core/widgets');
const SamplerCore = require('../../../src/core/widgets/sampler-core');
const { DynamicWidgets } = require('../../../src/core/widgets/dynamic-widgets');
const { AutoDashboardGenerator } = require('../../../src/core/notion/auto-dashboard-generator');

describe('BUMBA Widget System', () => {
  let bumbaWidgets;

  beforeEach(() => {
    bumbaWidgets = new BumbaWidgets();
  });

  describe('Widget Types', () => {
    test('should support all 7 sampler widget types', () => {
      const types = bumbaWidgets.getWidgetTypes();
      expect(types).toHaveLength(7);
      expect(types).toEqual([
        'runchart',
        'sparkline',
        'barchart',
        'gauge',
        'textbox',
        'asciibox',
        'statusgrid'
      ]);
    });
  });

  describe('Widget Generation', () => {
    test('should generate widgets under 1500 character limit', () => {
      const types = bumbaWidgets.getWidgetTypes();
      types.forEach(type => {
        const widget = bumbaWidgets.generateWidget(type);
        expect(widget.length).toBeLessThanOrEqual(1500);
      });
    });

    test('should generate runchart with custom data', () => {
      const widget = bumbaWidgets.generateWidget('runchart', {
        title: 'API Performance',
        series: [
          { label: 'Response Time', color: '#FFD700', data: [100, 120, 95, 110] },
          { label: 'Error Rate', color: '#FF0000', data: [2, 3, 1, 2] }
        ]
      });
      expect(widget).toContain('API Performance');
      expect(widget).toContain('#FFD700');
      expect(widget.length).toBeLessThanOrEqual(1500);
    });

    test('should generate sparkline with metrics', () => {
      const widget = bumbaWidgets.generateWidget('sparkline', {
        title: 'CPU Usage',
        value: '78%',
        color: '#FF00FF'
      });
      expect(widget).toContain('CPU Usage');
      expect(widget).toContain('78%');
      expect(widget).toContain('#FF00FF');
    });

    test('should generate gauge with progress', () => {
      const widget = bumbaWidgets.generateWidget('gauge', {
        title: 'Build Progress',
        value: 85,
        label: '17 of 20 tests'
      });
      expect(widget).toContain('Build Progress');
      expect(widget).toContain('17 of 20 tests');
    });

    test('should generate statusgrid with items', () => {
      const widget = bumbaWidgets.generateWidget('statusgrid', {
        items: [
          { emoji: '🟢', label: 'API', value: 'Online', color: '#7FFF00' },
          { emoji: '🔴', label: 'Errors', value: '3', color: '#FF0000' }
        ]
      });
      expect(widget).toContain('🟢');
      expect(widget).toContain('API');
      expect(widget).toContain('Online');
    });
  });

  describe('ASCII Number Generation', () => {
    test('should generate legible block numbers', () => {
      const blockNum = SamplerCore.generateBlockNumber('12:34');
      expect(blockNum).toContain('█');
      expect(blockNum.split('\\n')).toHaveLength(5); // 5 lines tall
    });
  });

  describe('Automatic Dashboard Generation', () => {
    test('should automatically select widgets based on data type', () => {
      const testData = {
        metrics: [
          { name: 'CPU', current: 78, history: [70, 72, 75, 78] },
          { name: 'Memory', current: 4096, history: [3800, 3900, 4000, 4096] }
        ],
        progress: [
          { name: 'Build', current: 85, total: 100 }
        ],
        status: {
          'API': 'Online',
          'Database': 'Connected'
        }
      };

      const widgets = bumbaWidgets.generateFromData(testData);
      expect(widgets.length).toBeGreaterThan(0);
      
      // Each widget should be under Notion limit
      widgets.forEach(widget => {
        expect(widget.length).toBeLessThanOrEqual(1500);
      });
    });

    test('should detect time series data', () => {
      const hasTimeSeries = AutoDashboardGenerator.isTimeSeries({
        timeSeries: true,
        data: [[1, 2, 3, 4, 5, 6, 7, 8]]
      });
      expect(hasTimeSeries).toBe(true);
    });

    test('should format KPI values correctly', () => {
      expect(AutoDashboardGenerator.formatKPI(1234567)).toBe('1.2M');
      expect(AutoDashboardGenerator.formatKPI(5432)).toBe('5.4K');
      expect(AutoDashboardGenerator.formatKPI(99)).toBe('99.0');
    });
  });

  describe('Dashboard Creation', () => {
    test('should create complete dashboard from project data', () => {
      const projectData = {
        metrics: [
          { name: 'Response Time', value: 120, history: [100, 110, 115, 120] }
        ],
        progress: {
          title: 'Sprint Progress',
          current: 14,
          total: 21,
          label: 'Day 14 of 21'
        },
        status: {
          'API': 'Online',
          'Cache': 'Active'
        }
      };

      const dashboard = bumbaWidgets.createDashboard(projectData);
      
      expect(dashboard.widgets).toBeDefined();
      expect(dashboard.widgets.length).toBeGreaterThan(0);
      expect(dashboard.html).toBeDefined();
      expect(dashboard.notionReady).toBe(true); // All widgets under 1500 chars
    });
  });

  describe('Direct Widget Functions', () => {
    test('should provide direct access to widget generators', () => {
      const sparkline = widgets.sparkline({ title: 'Test', value: '100' });
      expect(sparkline).toContain('Test');
      expect(sparkline).toContain('100');
      
      const gauge = widgets.gauge({ title: 'Progress', value: 50 });
      expect(gauge).toContain('Progress');
      expect(gauge).toContain('50%');
    });
  });

  describe('Color Selection', () => {
    test('should use sampler color palette', () => {
      const colors = ['#FFD700', '#00FFFF', '#FF1493', '#7FFF00', '#FF00FF'];
      
      colors.forEach((color, index) => {
        const selected = AutoDashboardGenerator.getColorByIndex(index);
        expect(selected).toBe(color);
      });
    });

    test('should select colors based on metric status', () => {
      const critical = AutoDashboardGenerator.getColorForMetric({ critical: true });
      expect(critical).toBe('#FF0000');
      
      const warning = AutoDashboardGenerator.getColorForMetric({ warning: true });
      expect(warning).toBe('#FFA500');
      
      const good = AutoDashboardGenerator.getColorForMetric({ value: 50, threshold: 80 });
      expect(good).toBe('#7FFF00');
    });
  });

  describe('Export Functionality', () => {
    const fs = require('fs').promises;
    const path = require('path');
    const testDir = './test-widget-export';

    afterEach(async () => {
      // Clean up test directory
      try {
        await fs.rm(testDir, { recursive: true, force: true });
      } catch (e) {
        // Directory might not exist
      }
    });

    test('should export widgets for Notion embedding', async () => {
      const testData = {
        metrics: [{ name: 'Test', current: 100, history: [] }]
      };

      const exported = await bumbaWidgets.exportForNotion(testDir, { data: testData });
      
      expect(exported.length).toBeGreaterThan(0);
      
      // Verify each exported file
      for (const file of exported) {
        expect(file.valid).toBe(true); // Under 1500 chars
        expect(file.size).toBeLessThanOrEqual(1500);
        
        // Verify file exists
        const exists = await fs.access(file.path).then(() => true).catch(() => false);
        expect(exists).toBe(true);
      }
    });
  });

  describe('Responsive Design', () => {
    test('should include responsive CSS', () => {
      const widget = bumbaWidgets.generateWidget('sparkline');
      
      // Check for responsive units
      expect(widget).toMatch(/width:\s*100%/i);
      
      // Check for flexible layouts
      const hasFlexOrGrid = widget.includes('flex') || widget.includes('grid');
      expect(hasFlexOrGrid).toBe(true);
    });
  });

  describe('Data Flexibility', () => {
    test('runchart should handle various data types', () => {
      const datasets = [
        { title: 'Stock Prices', series: [{ data: [100, 102, 98, 105] }] },
        { title: 'Temperature', series: [{ data: [72, 75, 71, 74] }] },
        { title: 'API Metrics', series: [{ data: [200, 210, 195, 205] }] }
      ];

      datasets.forEach(data => {
        const widget = bumbaWidgets.generateWidget('runchart', data);
        expect(widget).toContain(data.title);
        expect(widget.length).toBeLessThanOrEqual(1500);
      });
    });

    test('statusgrid should handle various status types', () => {
      const statuses = [
        { items: [{ label: 'Health', value: 'Good' }] },
        { items: [{ label: 'Queue', value: '127' }] },
        { items: [{ label: 'Version', value: '1.0.0' }] }
      ];

      statuses.forEach(status => {
        const widget = bumbaWidgets.generateWidget('statusgrid', status);
        expect(widget).toContain(status.items[0].label);
        expect(widget).toContain(status.items[0].value);
      });
    });
  });
});