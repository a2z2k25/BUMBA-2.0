// BUMBA Network Resilience Utilities
// Handles network failures and implements smart retry logic
// Enhanced with advanced performance optimizations

const { logger } = require('../core/logging/bumba-logger');
const { secureExecutor } = require('../core/security/secure-executor');
const { promisify } = require('util');

// Import advanced resilience components
let AdvancedRetryMechanism, AdvancedLoadBalancer, AutoHealingSystem;
let CollaborationPerformanceOptimizer;

try {
  const resilience = require('../core/resilience');
  AdvancedRetryMechanism = resilience.AdvancedRetryMechanism;
  AdvancedLoadBalancer = resilience.AdvancedLoadBalancer;
  AutoHealingSystem = resilience.AutoHealingSystem;
} catch (error) {
  // Fallback if advanced modules not available
  logger.warn('Advanced resilience modules not available, using basic implementation');
}

try {
  const perf = require('../core/performance/collaboration-performance-optimizer');
  CollaborationPerformanceOptimizer = perf.CollaborationPerformanceOptimizer;
} catch (error) {
  // Fallback if performance optimizer not available
  logger.warn('Performance optimizer not available, using basic implementation');
}

class NetworkResilience {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 10000;
    this.backoffFactor = options.backoffFactor || 2;
    
    // Initialize advanced components if available
    this.advancedRetry = AdvancedRetryMechanism ? new AdvancedRetryMechanism({
      policy: { maxRetries: this.maxRetries, initialDelay: this.baseDelay, maxDelay: this.maxDelay }
    }) : null;
    
    this.loadBalancer = AdvancedLoadBalancer ? new AdvancedLoadBalancer() : null;
    this.autoHealing = AutoHealingSystem ? new AutoHealingSystem() : null;
    this.performanceOptimizer = CollaborationPerformanceOptimizer ? 
      new CollaborationPerformanceOptimizer() : null;
    
    // Performance metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      throughput: 0
    };
  }

  async executeWithRetry(command, options = {}) {
    const startTime = Date.now();
    this.metrics.totalRequests++;
    
    // Use advanced retry mechanism if available
    if (this.advancedRetry && options.useAdvanced !== false) {
      try {
        const result = await this.advancedRetry.executeWithRetry(
          async () => {
            // Optimize if performance optimizer available
            if (this.performanceOptimizer) {
              return await this.performanceOptimizer.optimizeRealTimeResponse(
                async () => secureExecutor.executeCommand(command, {
                  ...options,
                  timeout: options.timeout || 30000,
                  validateCommand: true
                }),
                { service: options.service || 'network' }
              );
            }
            
            return await secureExecutor.executeCommand(command, {
              ...options,
              timeout: options.timeout || 30000,
              validateCommand: true
            });
          },
          { service: options.service || 'network', maxRetries: this.maxRetries }
        );
        
        this.updateMetrics(Date.now() - startTime, true);
        return result;
      } catch (error) {
        this.updateMetrics(Date.now() - startTime, false);
        throw error;
      }
    }
    
    // Fallback to basic retry logic
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Use secure executor with timeout
        const result = await secureExecutor.executeCommand(command, {
          ...options,
          timeout: options.timeout || 30000,
          validateCommand: true
        });

        this.updateMetrics(Date.now() - startTime, true);
        return result;
      } catch (error) {
        lastError = error;

        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          this.updateMetrics(Date.now() - startTime, false);
          throw error;
        }

        // Log attempt for debugging
        if (options.verbose) {
          logger.info(`Attempt ${attempt}/${this.maxRetries} failed: ${error.message}`);
        }

        // Don't wait after the last attempt
        if (attempt < this.maxRetries) {
          const delay = Math.min(
            this.baseDelay * Math.pow(this.backoffFactor, attempt - 1),
            this.maxDelay
          );

          if (options.verbose) {
            logger.info(`Waiting ${delay}ms before retry...`);
          }

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    this.updateMetrics(Date.now() - startTime, false);
    throw lastError;
  }
  
  async executeWithOptimizedThroughput(commands, options = {}) {
    if (!this.performanceOptimizer) {
      // Fallback to sequential execution
      const results = [];
      for (const command of commands) {
        results.push(await this.executeWithRetry(command, options));
      }
      return results;
    }
    
    // Use performance optimizer for batch processing
    return await this.performanceOptimizer.optimizeThroughput(
      commands.map(cmd => async () => this.executeWithRetry(cmd, options)),
      { service: options.service || 'network' }
    );
  }
  
  async executeWithMinimalLatency(command, options = {}) {
    if (!this.performanceOptimizer) {
      return await this.executeWithRetry(command, options);
    }
    
    // Use performance optimizer for minimal latency
    return await this.performanceOptimizer.optimizeLatency(
      async () => this.executeWithRetry(command, { ...options, useAdvanced: false }),
      { service: options.service || 'network' }
    );
  }
  
  updateMetrics(responseTime, success) {
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
    
    // Update average response time
    const total = this.metrics.successfulRequests + this.metrics.failedRequests;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (total - 1) + responseTime) / total;
    
    // Calculate throughput (requests per second)
    this.metrics.throughput = (this.metrics.successfulRequests / (Date.now() / 1000));
  }

  isNonRetryableError(error) {
    const nonRetryableMessages = [
      'command not found',
      'permission denied',
      'no such file or directory',
      'authentication failed',
      'invalid credentials'
    ];

    return nonRetryableMessages.some(msg => error.message.toLowerCase().includes(msg));
  }

  async checkConnectivity() {
    try {
      // Quick connectivity check
      await this.executeWithRetry('ping -c 1 8.8.8.8', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  async checkClaudeCodeAvailability() {
    try {
      await this.executeWithRetry('claude --version', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  async preflightChecks() {
    const checks = {
      network: await this.checkConnectivity(),
      claudeCode: await this.checkClaudeCodeAvailability(),
      npmAccess: true // Will be checked below
    };

    try {
      await this.executeWithRetry('npm --version', { timeout: 5000 });
    } catch (error) {
      checks.npmAccess = false;
    }

    return checks;
  }
  
  getPerformanceStats() {
    const stats = {
      metrics: { ...this.metrics },
      successRate: this.metrics.totalRequests > 0 
        ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2) + '%'
        : '0%'
    };
    
    // Add advanced component stats if available
    if (this.advancedRetry) {
      stats.advancedRetry = this.advancedRetry.getStats();
    }
    
    if (this.loadBalancer) {
      stats.loadBalancer = this.loadBalancer.getStats();
    }
    
    if (this.autoHealing) {
      stats.autoHealing = this.autoHealing.getStats();
    }
    
    if (this.performanceOptimizer) {
      stats.performanceOptimizer = this.performanceOptimizer.getStats();
    }
    
    return stats;
  }
  
  async enableAutoHealing(serviceId, serviceConfig = {}) {
    if (!this.autoHealing) {
      logger.warn('Auto-healing system not available');
      return false;
    }
    
    this.autoHealing.registerService(serviceId, {
      name: serviceConfig.name || serviceId,
      type: 'network-service',
      criticality: serviceConfig.criticality || 'normal',
      healthEndpoint: serviceConfig.healthEndpoint
    });
    
    logger.info(`Auto-healing enabled for service: ${serviceId}`);
    return true;
  }
  
  async registerLoadBalancerNode(nodeId, nodeConfig = {}) {
    if (!this.loadBalancer) {
      logger.warn('Load balancer not available');
      return false;
    }
    
    this.loadBalancer.registerNode(nodeId, {
      endpoint: nodeConfig.endpoint,
      weight: nodeConfig.weight || 1,
      capacity: nodeConfig.capacity || 100,
      region: nodeConfig.region
    });
    
    logger.info(`Node registered with load balancer: ${nodeId}`);
    return true;
  }
}

module.exports = NetworkResilience;
