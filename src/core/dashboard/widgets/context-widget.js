/**
 * Context Preservation Widget for Dashboard
 * Phase 1 - Sprint 6-7
 */

const { getInstance: getContextMetrics } = require('../../metrics/context-metrics');
const { getInstance: getStorage } = require('../../metrics/context-storage');
const { EventEmitter } = require('events');

class ContextPreservationWidget extends EventEmitter {
  constructor() {
    super();
    this.metrics = getContextMetrics();
    this.storage = getStorage();
    this.data = {
      title: 'Context Preservation',
      type: 'metrics',
      priority: 1,
      realtime: true
    };
    
    // Subscribe to real-time updates
    this.metrics.on('execution-tracked', (data) => {
      this.emit('update', this.getData());
    });
  }
  
  /**
   * Get widget data for dashboard display
   */
  async getData() {
    const summary = this.metrics.getDashboardSummary();
    const aggregated = await this.storage.getAggregatedMetrics().catch(() => []);
    
    return {
      ...this.data,
      current: {
        tokensSaved: summary.totalTokensSaved,
        reductionPercent: summary.totalReductionPercent,
        averageReduction: summary.averageReductionPercent,
        specialistsTracked: summary.specialistsTracked,
        executions: summary.totalExecutions
      },
      topPerformers: aggregated.slice(0, 5).map(s => ({
        name: s.specialist_id,
        reduction: Math.round((s.avg_reduction || 0) * 100),
        saved: s.tokens_saved || 0
      })),
      trend: {
        hourly: await this.getHourlyTrend(),
        target: 80, // Target 80% reduction
        current: summary.averageReductionPercent
      }
    };
  }
  
  /**
   * Get hourly trend data
   */
  async getHourlyTrend() {
    // Simple in-memory trend for now
    const history = this.metrics.globalMetrics.specialistMetrics;
    const hourlyData = [];
    
    for (const [_, specialist] of history) {
      if (specialist.history && specialist.history.length > 0) {
        const recent = specialist.history.slice(-10);
        for (const entry of recent) {
          hourlyData.push({
            time: entry.timestamp,
            reduction: Math.round(entry.reduction * 100)
          });
        }
      }
    }
    
    return hourlyData.slice(-20); // Last 20 data points
  }
  
  /**
   * Get widget configuration
   */
  getConfig() {
    return {
      id: 'context-preservation',
      name: 'Context Preservation Metrics',
      position: { row: 1, col: 3, width: 2, height: 2 },
      refreshInterval: 5000,
      chartType: 'line',
      displayFormat: 'percentage'
    };
  }
}

module.exports = ContextPreservationWidget;