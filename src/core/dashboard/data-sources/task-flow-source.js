/**
 * BUMBA Task Flow Data Source
 * Connects task tracing metrics to unified dashboard
 * 
 * Sprint 8: Connect Task Flow Registry
 */

const { DataSourceInterface, MetricCollection, MetricTypes } = require('../dashboard-interfaces');
const { logger } = require('../../logging/bumba-logger');

/**
 * Task Flow data source implementation
 */
class TaskFlowSource extends DataSourceInterface {
  constructor(taskFlowRegistry) {
    super('task-flow', 'observability');
    this.registry = taskFlowRegistry;
  }
  
  /**
   * Connect to the data source
   */
  async connect() {
    try {
      if (!this.registry) {
        throw new Error('Task flow registry not provided');
      }
      
      this.connected = true;
      this.lastUpdate = Date.now();
      
      logger.debug('Task flow data source connected');
      return true;
    } catch (error) {
      this.errorCount++;
      logger.error('Failed to connect task flow source:', error);
      throw error;
    }
  }
  
  /**
   * Collect current metrics from task flow registry
   */
  async collect() {
    try {
      if (!this.connected) {
        await this.connect();
      }
      
      // Get task flow statistics
      const stats = this.registry.getStatistics();
      
      // Analyze active flows for bottlenecks
      const bottlenecks = this.analyzeBottlenecks(stats.activeFlows);
      
      // Calculate flow metrics
      const flowMetrics = this.calculateFlowMetrics(stats);
      
      // Get flow health
      const healthScore = this.calculateHealthScore(stats, bottlenecks);
      
      this.lastUpdate = Date.now();
      
      return {
        stats,
        bottlenecks,
        flowMetrics,
        healthScore
      };
    } catch (error) {
      this.errorCount++;
      logger.error('Failed to collect task flow metrics:', error);
      throw error;
    }
  }
  
  /**
   * Transform data to standard metric format
   */
  transform(data) {
    const collection = new MetricCollection('taskFlow');
    
    // Core task flow metrics
    collection.add('active', data.stats.activeCount, MetricTypes.GAUGE, {
      unit: 'flows',
      description: 'Currently active task flows',
      severity: data.stats.activeCount > 50 ? 'warning' : 'info'
    });
    
    collection.add('completed', data.stats.completedCount, MetricTypes.COUNTER, {
      unit: 'flows',
      description: 'Completed task flows',
      severity: 'info'
    });
    
    collection.add('total', data.stats.totalCount, MetricTypes.COUNTER, {
      unit: 'flows',
      description: 'Total task flows tracked',
      severity: 'info'
    });
    
    // Flow performance metrics
    collection.add('avgDuration', data.flowMetrics.avgDuration, MetricTypes.GAUGE, {
      unit: 'ms',
      description: 'Average flow duration',
      severity: data.flowMetrics.avgDuration > 5000 ? 'warning' : 'info'
    });
    
    collection.add('avgSteps', data.flowMetrics.avgSteps, MetricTypes.GAUGE, {
      unit: 'steps',
      description: 'Average steps per flow',
      severity: 'info'
    });
    
    collection.add('successRate', data.flowMetrics.successRate, MetricTypes.PERCENTAGE, {
      unit: '%',
      description: 'Task flow success rate',
      severity: data.flowMetrics.successRate < 90 ? 'warning' : 'info'
    });
    
    // Bottleneck detection
    collection.add('bottleneckCount', data.bottlenecks.length, MetricTypes.GAUGE, {
      unit: 'bottlenecks',
      description: 'Detected performance bottlenecks',
      severity: data.bottlenecks.length > 3 ? 'warning' : 'info'
    });
    
    collection.add('bottlenecks', data.bottlenecks, MetricTypes.LIST, {
      description: 'Current performance bottlenecks',
      severity: data.bottlenecks.length > 0 ? 'warning' : 'info'
    });
    
    // Flow health score
    collection.add('healthScore', data.healthScore, MetricTypes.PERCENTAGE, {
      unit: '%',
      description: 'Overall flow health',
      severity: data.healthScore < 70 ? 'critical' : data.healthScore < 85 ? 'warning' : 'info'
    });
    
    // Active flow details
    const longRunning = data.stats.activeFlows.filter(f => f.duration > 10000);
    collection.add('longRunningFlows', longRunning.length, MetricTypes.GAUGE, {
      unit: 'flows',
      description: 'Long-running active flows (>10s)',
      severity: longRunning.length > 5 ? 'warning' : 'info'
    });
    
    // Recent flow performance
    if (data.stats.recentCompleted.length > 0) {
      const recent = data.stats.recentCompleted;
      const avgRecentDuration = recent.reduce((sum, f) => sum + f.totalDuration, 0) / recent.length;
      const avgRecentErrors = recent.reduce((sum, f) => sum + f.errorCount, 0) / recent.length;
      
      collection.add('recentAvgDuration', Math.round(avgRecentDuration), MetricTypes.GAUGE, {
        unit: 'ms',
        description: 'Recent average duration',
        severity: 'info'
      });
      
      collection.add('recentAvgErrors', avgRecentErrors.toFixed(2), MetricTypes.GAUGE, {
        unit: 'errors',
        description: 'Recent average errors per flow',
        severity: avgRecentErrors > 1 ? 'warning' : 'info'
      });
    }
    
    // Health status
    const isHealthy = data.stats.activeCount < 100 && 
                     data.bottlenecks.length < 5 && 
                     data.healthScore > 70;
    
    collection.add('systemHealthy', isHealthy, MetricTypes.STATUS, {
      description: 'Task flow system health',
      severity: isHealthy ? 'info' : 'warning'
    });
    
    return collection;
  }
  
  /**
   * Analyze flows for bottlenecks
   */
  analyzeBottlenecks(activeFlows) {
    const bottlenecks = [];
    
    activeFlows.forEach(flow => {
      if (flow.duration > 5000) {
        bottlenecks.push({
          taskId: flow.taskId,
          taskName: flow.taskName,
          duration: flow.duration,
          stepCount: flow.stepCount,
          avgStepTime: Math.round(flow.duration / (flow.stepCount || 1))
        });
      }
    });
    
    return bottlenecks.sort((a, b) => b.duration - a.duration).slice(0, 5);
  }
  
  /**
   * Calculate flow metrics
   */
  calculateFlowMetrics(stats) {
    const allFlows = [...stats.activeFlows.map(f => ({
      ...f,
      completed: false
    })), ...stats.recentCompleted.map(f => ({
      ...f,
      duration: f.totalDuration,
      completed: true
    }))];
    
    if (allFlows.length === 0) {
      return {
        avgDuration: 0,
        avgSteps: 0,
        successRate: 100
      };
    }
    
    const totalDuration = allFlows.reduce((sum, f) => sum + (f.duration || 0), 0);
    const totalSteps = allFlows.reduce((sum, f) => sum + (f.stepCount || 0), 0);
    const successfulFlows = stats.recentCompleted.filter(f => 
      f.errorCount === 0 || (f.successRate && parseFloat(f.successRate) > 80)
    );
    
    return {
      avgDuration: Math.round(totalDuration / allFlows.length),
      avgSteps: Math.round(totalSteps / allFlows.length),
      successRate: stats.recentCompleted.length > 0 
        ? Math.round((successfulFlows.length / stats.recentCompleted.length) * 100)
        : 100
    };
  }
  
  /**
   * Calculate overall health score
   */
  calculateHealthScore(stats, bottlenecks) {
    let score = 100;
    
    // Deduct for too many active flows
    if (stats.activeCount > 50) score -= 10;
    if (stats.activeCount > 100) score -= 20;
    
    // Deduct for bottlenecks
    score -= bottlenecks.length * 5;
    
    // Deduct for errors in recent flows
    const recentErrorRate = stats.recentCompleted.reduce((sum, f) => {
      const errorRate = f.errorCount / (f.stepCount || 1);
      return sum + errorRate;
    }, 0) / (stats.recentCompleted.length || 1);
    
    score -= Math.round(recentErrorRate * 50);
    
    // Deduct for long-running flows
    const longRunning = stats.activeFlows.filter(f => f.duration > 30000).length;
    score -= longRunning * 3;
    
    return Math.max(0, Math.min(100, score));
  }
}

module.exports = TaskFlowSource;