/**
 * Automatic Dashboard Generator for BUMBA
 * Intelligently selects and populates widgets based on available data
 */

const { DynamicWidgets } = require('../widgets/dynamic-widgets');

class AutoDashboardGenerator {
  
  /**
   * Analyze data and automatically choose appropriate widgets
   */
  static analyzeDataAndGenerateWidgets(data) {
    const widgets = [];
    
    // Detect time-series data → Use RunChart
    if (this.isTimeSeries(data)) {
      widgets.push(DynamicWidgets.runChart({
        title: data.title || 'Trend Analysis',
        series: this.extractTimeSeries(data),
        xAxisLabels: this.generateTimeLabels(data)
      }));
    }
    
    // Detect metrics with current values → Use Sparkline
    if (this.hasMetrics(data)) {
      data.metrics.forEach(metric => {
        widgets.push(DynamicWidgets.sparkline({
          title: metric.name,
          currentValue: metric.current,
          minValue: metric.min || 0,
          maxValue: metric.max || 100,
          unit: metric.unit || '',
          color: this.getColorForMetric(metric),
          data: metric.history || []
        }));
      });
    }
    
    // Detect comparative data → Use BarChart
    if (this.hasComparisons(data)) {
      widgets.push(DynamicWidgets.barChart({
        title: data.comparisonTitle || 'Comparison',
        items: this.formatComparisons(data)
      }));
    }
    
    // Detect progress/percentage data → Use Gauge
    if (this.hasProgress(data)) {
      data.progress.forEach(item => {
        widgets.push(DynamicWidgets.gauge({
          title: item.name,
          value: item.current,
          maxValue: item.total,
          label: item.label,
          color: this.getProgressColor(item.current / item.total)
        }));
      });
    }
    
    // Detect tabular data → Use TextBox
    if (this.hasTableData(data)) {
      widgets.push(DynamicWidgets.textBox({
        title: data.tableTitle || 'Data',
        headers: data.headers,
        rows: data.rows
      }));
    }
    
    // Detect KPIs or important values → Use AsciiBox
    if (this.hasKPIs(data)) {
      data.kpis.forEach(kpi => {
        widgets.push(DynamicWidgets.asciiBox({
          title: kpi.name,
          content: this.formatKPI(kpi.value),
          color: this.getKPIColor(kpi),
          fontSize: kpi.important ? '48px' : '36px'
        }));
      });
    }
    
    // Detect status information → Use StatusGrid
    if (this.hasStatusData(data)) {
      widgets.push(DynamicWidgets.statusGrid({
        title: 'System Status',
        items: this.formatStatusItems(data.status)
      }));
    }
    
    return widgets;
  }
  
  /**
   * Data type detection methods
   */
  static isTimeSeries(data) {
    return data.timeSeries || 
           (data.data && Array.isArray(data.data[0]) && data.data[0].length > 5);
  }
  
  static hasMetrics(data) {
    return data.metrics && Array.isArray(data.metrics);
  }
  
  static hasComparisons(data) {
    return data.comparisons || 
           (data.items && data.items.every(i => i.value !== undefined));
  }
  
  static hasProgress(data) {
    return data.progress || 
           (data.items && data.items.some(i => i.percentage !== undefined));
  }
  
  static hasTableData(data) {
    return (data.headers && data.rows) || 
           (data.table && Array.isArray(data.table));
  }
  
  static hasKPIs(data) {
    return data.kpis || data.highlights || data.important;
  }
  
  static hasStatusData(data) {
    return data.status || data.health || data.state;
  }
  
  /**
   * Data formatting methods
   */
  static extractTimeSeries(data) {
    if (data.series) return data.series;
    
    // Auto-detect series from data structure
    return Object.keys(data.data).map((key, i) => ({
      label: key,
      color: this.getColorByIndex(i),
      data: data.data[key]
    }));
  }
  
  static generateTimeLabels(data) {
    if (data.labels) return data.labels;
    
    // Generate time labels based on data length
    const now = new Date();
    const count = data.dataPoints || 10;
    return Array(count).fill(0).map((_, i) => {
      const time = new Date(now - (count - i) * 60000);
      return time.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    });
  }
  
  static formatComparisons(data) {
    return data.comparisons || data.items.map(item => ({
      label: item.name,
      value: item.value,
      maxValue: item.max || Math.max(...data.items.map(i => i.value)),
      color: this.getColorByValue(item.value, item.max),
      displayText: `${item.value}${item.unit || ''}`
    }));
  }
  
  static formatKPI(value) {
    if (typeof value === 'number') {
      if (value > 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value > 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toFixed(1);
    }
    return String(value);
  }
  
  static formatStatusItems(status) {
    if (Array.isArray(status)) return status;
    
    // Convert object to status items
    return Object.entries(status).map(([key, value]) => ({
      emoji: this.getStatusEmoji(value),
      label: key,
      value: String(value),
      color: this.getStatusColor(value)
    }));
  }
  
  /**
   * Color selection methods
   */
  static getColorByIndex(index) {
    const colors = ['#FFD700', '#00FFFF', '#FF1493', '#7FFF00', '#FF00FF'];
    return colors[index % colors.length];
  }
  
  static getColorByValue(value, max) {
    const ratio = value / max;
    if (ratio > 0.8) return '#FF0000';
    if (ratio > 0.6) return '#FFA500';
    if (ratio > 0.4) return '#FFD700';
    return '#7FFF00';
  }
  
  static getColorForMetric(metric) {
    if (metric.critical) return '#FF0000';
    if (metric.warning) return '#FFA500';
    if (metric.value > metric.threshold) return '#FFD700';
    return '#7FFF00';
  }
  
  static getProgressColor(ratio) {
    if (ratio > 0.9) return '#7FFF00';
    if (ratio > 0.7) return '#FFD700';
    if (ratio > 0.5) return '#FFA500';
    return '#FF0000';
  }
  
  static getKPIColor(kpi) {
    if (kpi.status === 'good') return '#7FFF00';
    if (kpi.status === 'warning') return '#FFD700';
    if (kpi.status === 'critical') return '#FF0000';
    return '#00FFFF';
  }
  
  static getStatusColor(value) {
    const str = String(value).toLowerCase();
    if (str.includes('error') || str.includes('fail')) return '#FF0000';
    if (str.includes('warning') || str.includes('pending')) return '#FFA500';
    if (str.includes('success') || str.includes('online')) return '#7FFF00';
    return '#00FFFF';
  }
  
  static getStatusEmoji(value) {
    const str = String(value).toLowerCase();
    if (str.includes('error') || str.includes('fail')) return '🔴';
    if (str.includes('warning') || str.includes('pending')) return '🟠';
    if (str.includes('success') || str.includes('online')) return '🟢';
    return '🟡';
  }
}

/**
 * Example: Automatically generate dashboard from API response
 */
class APIMonitorDashboard {
  static async generateFromEndpoint(endpoint) {
    // Fetch data from API
    const response = await fetch(endpoint);
    const data = await response.json();
    
    // Automatically analyze and generate appropriate widgets
    const widgets = AutoDashboardGenerator.analyzeDataAndGenerateWidgets({
      title: 'API Performance',
      
      // Time series data → RunChart
      timeSeries: true,
      data: {
        'Response Time': data.responseTimes,
        'Error Rate': data.errorRates,
        'Request Count': data.requestCounts
      },
      
      // Current metrics → Sparklines
      metrics: [
        {
          name: 'Current Load',
          current: data.currentLoad,
          max: 1000,
          unit: ' req/s',
          history: data.loadHistory
        },
        {
          name: 'Active Connections',
          current: data.activeConnections,
          max: 5000,
          history: data.connectionHistory
        }
      ],
      
      // Endpoint comparisons → BarChart
      comparisons: data.endpoints.map(ep => ({
        name: ep.path,
        value: ep.avgResponseTime,
        max: 1000,
        unit: 'ms'
      })),
      
      // Progress indicators → Gauges
      progress: [
        {
          name: 'Uptime',
          current: data.uptimeHours,
          total: 720, // 30 days
          label: `${(data.uptimeHours / 720 * 100).toFixed(1)}%`
        }
      ],
      
      // Recent errors → TextBox
      headers: ['Time', 'Endpoint', 'Error', 'Count'],
      rows: data.recentErrors,
      
      // KPIs → AsciiBox
      kpis: [
        {
          name: 'Total Requests Today',
          value: data.totalRequests,
          important: true
        }
      ],
      
      // System status → StatusGrid
      status: {
        'Database': data.dbStatus,
        'Cache': data.cacheStatus,
        'Queue': data.queueDepth,
        'Memory': `${data.memoryUsage}%`
      }
    });
    
    return widgets;
  }
}

module.exports = {
  AutoDashboardGenerator,
  APIMonitorDashboard
};