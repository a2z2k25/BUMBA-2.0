/**
 * BUMBA Health Endpoint
 * Unified health check for all system components
 * 
 * Sprint 17: Health Endpoint
 */

const { getUnifiedDashboard } = require('./unified-dashboard-manager');
const { logger } = require('../logging/bumba-logger');

/**
 * Health status levels
 */
const HealthStatus = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy'
};

/**
 * Get comprehensive health status
 */
async function getHealth() {
  try {
    const dashboard = getUnifiedDashboard();
    
    // Ensure dashboard is initialized
    if (!dashboard.state.initialized) {
      await dashboard.initialize();
    }
    
    // Trigger fresh data collection
    await dashboard.refresh();
    
    // Get current metrics
    const metrics = dashboard.getMetrics();
    const status = dashboard.getStatus();
    
    // Calculate overall health
    const health = calculateOverallHealth(metrics, status);
    
    return {
      status: health.status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      
      // System health scores
      scores: {
        overall: health.score,
        resources: health.resourceScore,
        operations: health.operationsScore,
        resilience: health.resilienceScore
      },
      
      // Component status
      components: {
        dataSources: {
          connected: status.sources,
          total: 16,
          percentage: Math.round((status.sources / 16) * 100),
          status: status.sources > 0 ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY
        },
        
        timers: getTimerHealth(metrics.resources?.timers),
        specialists: getSpecialistHealth(metrics.specialists),
        failures: getFailureHealth(metrics.errors),
        circuitBreakers: getCircuitBreakerHealth(metrics.resources?.circuitBreakers),
        taskFlow: getTaskFlowHealth(metrics.operations?.taskFlow)
      },
      
      // Critical alerts
      alerts: generateAlerts(metrics, health),
      
      // Performance metrics
      performance: {
        avgUpdateTime: status.stats.avgUpdateTime,
        lastUpdateDuration: status.stats.lastUpdateDuration,
        cacheHitRate: calculateCacheHitRate(status.stats),
        updates: status.stats.updates
      },
      
      // Detailed metrics (optional)
      metrics: process.env.INCLUDE_DETAILED_METRICS === 'true' ? metrics : undefined
    };
  } catch (error) {
    logger.error('Health check failed:', error);
    return {
      status: HealthStatus.UNHEALTHY,
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: process.uptime()
    };
  }
}

/**
 * Calculate overall health score and status
 */
function calculateOverallHealth(metrics, status) {
  let score = 100;
  let resourceScore = 100;
  let operationsScore = 100;
  let resilienceScore = 100;
  
  // Resource health (timers, memory)
  if (metrics.resources?.timers) {
    const timerRisk = metrics.resources.timers.leakRisk?.value || 0;
    resourceScore -= timerRisk / 2;
  }
  
  // Operations health (task flows)
  if (metrics.operations?.taskFlow) {
    const taskHealth = metrics.operations.taskFlow.healthScore?.value || 100;
    operationsScore = taskHealth;
  }
  
  // Resilience health (failures, circuit breakers)
  if (metrics.errors) {
    const failureHealth = metrics.errors.healthScore?.value || 100;
    resilienceScore = Math.min(resilienceScore, failureHealth);
  }
  
  if (metrics.resources?.circuitBreakers) {
    const circuitHealth = metrics.resources.circuitBreakers.resilienceScore?.value || 100;
    resilienceScore = Math.min(resilienceScore, circuitHealth);
  }
  
  // Calculate overall score
  score = Math.round((resourceScore + operationsScore + resilienceScore) / 3);
  
  // Determine status
  let healthStatus;
  if (score >= 85) {
    healthStatus = HealthStatus.HEALTHY;
  } else if (score >= 70) {
    healthStatus = HealthStatus.DEGRADED;
  } else {
    healthStatus = HealthStatus.UNHEALTHY;
  }
  
  return {
    status: healthStatus,
    score,
    resourceScore,
    operationsScore,
    resilienceScore
  };
}

/**
 * Get timer system health
 */
function getTimerHealth(timerMetrics) {
  if (!timerMetrics) {
    return { status: HealthStatus.HEALTHY, message: 'No data' };
  }
  
  const leakRisk = timerMetrics.leakRisk?.value || 0;
  const active = timerMetrics.active?.value || 0;
  
  return {
    status: leakRisk > 50 ? HealthStatus.UNHEALTHY : 
            leakRisk > 25 ? HealthStatus.DEGRADED : 
            HealthStatus.HEALTHY,
    active,
    leakRisk,
    cleanupRatio: timerMetrics.cleanupRatio?.value
  };
}

/**
 * Get specialist system health
 */
function getSpecialistHealth(specialistMetrics) {
  if (!specialistMetrics) {
    return { status: HealthStatus.HEALTHY, message: 'No data' };
  }
  
  const verificationRate = specialistMetrics.verificationRate?.value || 0;
  const failed = specialistMetrics.failed?.value || 0;
  
  return {
    status: failed > 5 ? HealthStatus.UNHEALTHY :
            verificationRate < 80 ? HealthStatus.DEGRADED :
            HealthStatus.HEALTHY,
    total: specialistMetrics.total?.value,
    verified: specialistMetrics.verified?.value,
    failed,
    verificationRate
  };
}

/**
 * Get failure system health
 */
function getFailureHealth(failureMetrics) {
  if (!failureMetrics) {
    return { status: HealthStatus.HEALTHY, message: 'No failures' };
  }
  
  const active = failureMetrics.active?.value || 0;
  const healthScore = failureMetrics.healthScore?.value || 100;
  
  return {
    status: active > 10 ? HealthStatus.UNHEALTHY :
            active > 5 ? HealthStatus.DEGRADED :
            HealthStatus.HEALTHY,
    active,
    total: failureMetrics.total?.value,
    healthScore,
    failureRate: failureMetrics.failureRate?.value
  };
}

/**
 * Get circuit breaker health
 */
function getCircuitBreakerHealth(circuitMetrics) {
  if (!circuitMetrics) {
    return { status: HealthStatus.HEALTHY, message: 'No data' };
  }
  
  const open = circuitMetrics.open?.value || 0;
  const cascadeRisk = circuitMetrics.cascadeRisk?.value || 0;
  
  return {
    status: open > 2 ? HealthStatus.UNHEALTHY :
            open > 0 ? HealthStatus.DEGRADED :
            HealthStatus.HEALTHY,
    total: circuitMetrics.total?.value,
    open,
    cascadeRisk,
    resilienceScore: circuitMetrics.resilienceScore?.value
  };
}

/**
 * Get task flow health
 */
function getTaskFlowHealth(taskFlowMetrics) {
  if (!taskFlowMetrics) {
    return { status: HealthStatus.HEALTHY, message: 'No data' };
  }
  
  const active = taskFlowMetrics.active?.value || 0;
  const bottlenecks = taskFlowMetrics.bottleneckCount?.value || 0;
  
  return {
    status: active > 100 ? HealthStatus.UNHEALTHY :
            bottlenecks > 5 ? HealthStatus.DEGRADED :
            HealthStatus.HEALTHY,
    active,
    completed: taskFlowMetrics.completed?.value,
    bottlenecks,
    successRate: taskFlowMetrics.successRate?.value
  };
}

/**
 * Generate critical alerts
 */
function generateAlerts(metrics, health) {
  const alerts = [];
  
  // Check overall health
  if (health.status === HealthStatus.UNHEALTHY) {
    alerts.push({
      level: 'critical',
      message: 'System health is critical',
      score: health.score
    });
  }
  
  // Check circuit breakers
  if (metrics.resources?.circuitBreakers?.open?.value > 0) {
    alerts.push({
      level: 'warning',
      message: `${metrics.resources.circuitBreakers.open.value} circuit(s) open`,
      component: 'circuitBreakers'
    });
  }
  
  // Check failures
  if (metrics.errors?.active?.value > 5) {
    alerts.push({
      level: 'warning',
      message: `${metrics.errors.active.value} active failures`,
      component: 'failures'
    });
  }
  
  // Check timer leaks
  if (metrics.resources?.timers?.leakRisk?.value > 50) {
    alerts.push({
      level: 'warning',
      message: `Timer leak risk: ${metrics.resources.timers.leakRisk.value}%`,
      component: 'timers'
    });
  }
  
  return alerts;
}

/**
 * Calculate cache hit rate
 */
function calculateCacheHitRate(stats) {
  const hits = stats.cacheHits || 0;
  const misses = stats.cacheMisses || 0;
  const total = hits + misses;
  
  if (total === 0) return 0;
  return Math.round((hits / total) * 100);
}

/**
 * Express/HTTP endpoint handler
 */
async function healthCheckHandler(req, res) {
  try {
    const health = await getHealth();
    const statusCode = health.status === HealthStatus.HEALTHY ? 200 :
                       health.status === HealthStatus.DEGRADED ? 206 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: HealthStatus.UNHEALTHY,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getHealth,
  healthCheckHandler,
  HealthStatus
};