/**
 * BUMBA Widget System - Main Module
 * Consolidates all widget functionality in one place
 * 
 * Features:
 * - 7 sampler-style widget types
 * - Dynamic data binding
 * - Automatic widget selection
 * - Notion embedding support
 */

// Core widget implementations
const SamplerExact = require('../notion/sampler-exact');
const { DynamicWidgets } = require('./dynamic-widgets');
const { AutoDashboardGenerator } = require('../notion/auto-dashboard-generator');

class BumbaWidgets {
  constructor() {
    this.staticWidgets = SamplerExact;
    this.dynamicWidgets = DynamicWidgets;
    this.autoGenerator = AutoDashboardGenerator;
  }

  /**
   * Get all available widget types
   */
  getWidgetTypes() {
    return [
      'runchart',      // Line graph with dotted lines
      'sparkline',     // Vertical bar chart
      'barchart',      // Horizontal progress bars
      'gauge',         // Progress indicator
      'textbox',       // Data table
      'asciibox',      // Large display (time/text)
      'statusgrid'     // Key-value status grid
    ];
  }

  /**
   * Generate a widget with dynamic data
   */
  generateWidget(type, config = {}) {
    switch(type.toLowerCase()) {
      case 'runchart':
        return config.series ? 
          DynamicWidgets.runChart(config) : 
          SamplerExact.runChart();
          
      case 'sparkline':
        return (config.data || config.value || config.currentValue) ? 
          DynamicWidgets.sparkline(config) :
          SamplerExact.sparkline(config.title || 'Metric', config.color || '#FFD700');
          
      case 'barchart':
        return config.items ? 
          DynamicWidgets.barChart(config) :
          SamplerExact.barChart();
          
      case 'gauge':
        return DynamicWidgets.gauge(config);
        
      case 'textbox':
        return config.rows ? 
          DynamicWidgets.textBox(config) :
          SamplerExact.dockerStats();
          
      case 'asciibox':
        return config.content ?
          DynamicWidgets.asciiBox(config) :
          SamplerExact.asciiTime();
          
      case 'statusgrid':
        return DynamicWidgets.statusGrid(config);
        
      default:
        throw new Error(`Unknown widget type: ${type}`);
    }
  }

  /**
   * Automatically generate widgets from data
   */
  generateFromData(data) {
    return this.autoGenerator.analyzeDataAndGenerateWidgets(data);
  }

  /**
   * Export widgets for Notion embedding
   */
  async exportForNotion(outputDir, config = {}) {
    const fs = require('fs').promises;
    const path = require('path');
    
    await fs.mkdir(outputDir, { recursive: true });
    
    const widgets = config.data ? 
      this.generateFromData(config.data) :
      this.getDefaultWidgets();
    
    const exported = [];
    for (let i = 0; i < widgets.length; i++) {
      const filename = `widget-${i + 1}.html`;
      const filepath = path.join(outputDir, filename);
      await fs.writeFile(filepath, widgets[i]);
      exported.push({
        path: filepath,
        size: widgets[i].length,
        valid: widgets[i].length <= 1500
      });
    }
    
    return exported;
  }

  /**
   * Get default example widgets
   */
  getDefaultWidgets() {
    return [
      this.generateWidget('runchart'),
      this.generateWidget('sparkline', { title: 'CPU Usage', color: '#FF00FF' }),
      this.generateWidget('sparkline', { title: 'Memory', color: '#FFD700' }),
      this.generateWidget('barchart'),
      this.generateWidget('gauge', { title: 'Progress', value: 75, label: '75%' }),
      this.generateWidget('textbox'),
      this.generateWidget('asciibox'),
      this.generateWidget('statusgrid', {
        items: [
          { emoji: '🟢', label: 'Status', value: 'Online', color: '#7FFF00' },
          { emoji: '🟡', label: 'Queue', value: '127', color: '#FFD700' },
          { emoji: '🟠', label: 'Memory', value: '78%', color: '#FFA500' },
          { emoji: '🔴', label: 'Errors', value: '3', color: '#FF0000' }
        ]
      })
    ];
  }

  /**
   * Create a complete dashboard from project data
   */
  createDashboard(projectData) {
    const widgets = [];
    
    // Analyze project data and generate appropriate widgets
    if (projectData.metrics) {
      projectData.metrics.forEach(metric => {
        widgets.push(this.generateWidget('sparkline', {
          title: metric.name,
          currentValue: metric.value,
          data: metric.history,
          color: this.getMetricColor(metric)
        }));
      });
    }
    
    if (projectData.progress) {
      widgets.push(this.generateWidget('gauge', {
        title: projectData.progress.title,
        value: projectData.progress.current,
        maxValue: projectData.progress.total,
        label: projectData.progress.label
      }));
    }
    
    if (projectData.status) {
      widgets.push(this.generateWidget('statusgrid', {
        items: this.formatStatusItems(projectData.status)
      }));
    }
    
    if (projectData.timeSeries) {
      widgets.push(this.generateWidget('runchart', {
        title: projectData.timeSeries.title,
        series: projectData.timeSeries.data
      }));
    }
    
    return {
      widgets,
      html: this.renderDashboard(widgets),
      notionReady: widgets.every(w => w.length <= 1500)
    };
  }

  /**
   * Render complete dashboard HTML
   */
  renderDashboard(widgets) {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>BUMBA Dashboard</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;color:#fff;font:11px monospace;padding:20px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));gap:20px}
.widget{background:#000;border:1px solid #333;min-height:150px}
iframe{width:100%;border:none}
</style>
</head>
<body>
<div class="grid">
${widgets.map((w, i) => `<div class="widget">${w}</div>`).join('\n')}
</div>
</body>
</html>`;
  }

  /**
   * Helper methods
   */
  getMetricColor(metric) {
    if (metric.critical) return '#FF0000';
    if (metric.warning) return '#FFA500';
    if (metric.good) return '#7FFF00';
    return '#FFD700';
  }

  formatStatusItems(status) {
    if (Array.isArray(status)) return status;
    
    return Object.entries(status).map(([key, value]) => ({
      emoji: this.getStatusEmoji(value),
      label: key,
      value: String(value),
      color: this.getStatusColor(value)
    }));
  }

  getStatusEmoji(value) {
    const str = String(value).toLowerCase();
    if (str.includes('error') || str.includes('fail')) return '🔴';
    if (str.includes('warning')) return '🟠';
    if (str.includes('success') || str.includes('online')) return '🟢';
    return '🟡';
  }

  getStatusColor(value) {
    const str = String(value).toLowerCase();
    if (str.includes('error') || str.includes('fail')) return '#FF0000';
    if (str.includes('warning')) return '#FFA500';
    if (str.includes('success') || str.includes('online')) return '#7FFF00';
    return '#FFD700';
  }
}

// Export unified interface
module.exports = {
  BumbaWidgets,
  getInstance: () => new BumbaWidgets(),
  
  // Direct access to widget generators
  widgets: {
    runChart: (config) => new BumbaWidgets().generateWidget('runchart', config),
    sparkline: (config) => new BumbaWidgets().generateWidget('sparkline', config),
    barChart: (config) => new BumbaWidgets().generateWidget('barchart', config),
    gauge: (config) => new BumbaWidgets().generateWidget('gauge', config),
    textBox: (config) => new BumbaWidgets().generateWidget('textbox', config),
    asciiBox: (config) => new BumbaWidgets().generateWidget('asciibox', config),
    statusGrid: (config) => new BumbaWidgets().generateWidget('statusgrid', config)
  }
};