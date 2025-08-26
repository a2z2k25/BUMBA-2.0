/**
 * Specialist Spawner
 * Maps routing decisions to actual specialist instances
 * Ensures correct model assignment for each specialist
 */

const { AgentLifecycleManager } = require('./agent-lifecycle-manager');
const chalk = require('chalk');
const { DomainModelRouter } = require('../agents/domain-model-router');
const { logger } = require('../logging/bumba-logger');

/**
 * Custom Security Error for input validation failures
 */
class SecurityError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'SecurityError';
    this.details = details;
    this.timestamp = Date.now();
  }
}

class SpecialistSpawner {
  constructor(config = {}) {
    this.config = config;
    
    // Initialize lifecycle manager
    this.lifecycleManager = new AgentLifecycleManager(true); // Enable pooling
    
    // Initialize domain router for model assignment
    this.domainRouter = new DomainModelRouter(config);
    
    // Specialist type to implementation mapping
    this.specialistMappings = this.buildSpecialistMappings();
    
    // Active specialists tracking
    this.activeSpecialists = new Map();
    
    // Metrics
    this.metrics = {
      totalSpawned: 0,
      byType: {},
      byDepartment: {},
      modelAssignments: {}
    };
  }
  
  /**
   * Build mappings from specialist names to implementations
   */
  buildSpecialistMappings() {
    return {
      // Strategic specialists
      'market-research-specialist': {
        department: 'strategic',
        type: 'market-research',
        taskType: 'reasoning',
        capabilities: ['market analysis', 'competitor research', 'trend analysis']
      },
      'product-owner': {
        department: 'strategic', 
        type: 'product-strategy',
        taskType: 'reasoning',
        capabilities: ['roadmap', 'user stories', 'prioritization']
      },
      'business-analyst': {
        department: 'strategic',
        type: 'business-model',
        taskType: 'reasoning',
        capabilities: ['requirements', 'process analysis', 'documentation']
      },
      'technical-writer': {
        department: 'strategic',
        type: 'requirements-engineering',
        taskType: 'general',
        capabilities: ['documentation', 'api docs', 'user guides']
      },
      
      // Experience specialists
      'ux-research-specialist': {
        department: 'experience',
        type: 'ux-research',
        taskType: 'reasoning',
        capabilities: ['user research', 'usability testing', 'personas']
      },
      'ui-designer': {
        department: 'experience',
        type: 'ui-design',
        taskType: 'general',
        capabilities: ['visual design', 'mockups', 'prototypes']
      },
      'frontend-specialist': {
        department: 'experience',
        type: 'frontend-architecture',
        taskType: 'coding',
        capabilities: ['react', 'vue', 'component development']
      },
      'accessibility-specialist': {
        department: 'experience',
        type: 'accessibility',
        taskType: 'reasoning',
        capabilities: ['a11y', 'wcag', 'audit']
      },
      
      // Technical specialists
      'security-specialist': {
        department: 'technical',
        type: 'security',
        taskType: 'reasoning',
        capabilities: ['security audit', 'vulnerability assessment', 'encryption']
      },
      'database-specialist': {
        department: 'technical',
        type: 'database',
        taskType: 'coding',
        capabilities: ['sql', 'optimization', 'schema design']
      },
      'devops-engineer': {
        department: 'technical',
        type: 'devops',
        taskType: 'coding',
        capabilities: ['ci/cd', 'docker', 'kubernetes']
      },
      'backend-developer': {
        department: 'technical',
        type: 'api-architecture',
        taskType: 'coding',
        capabilities: ['api design', 'microservices', 'backend logic']
      },
      'api-specialist': {
        department: 'technical',
        type: 'api-architecture',
        taskType: 'coding',
        capabilities: ['rest', 'graphql', 'api optimization']
      },
      
      // Language specialists
      'javascript-specialist': {
        department: 'technical',
        type: 'frontend-architecture',
        taskType: 'coding',
        language: 'javascript',
        capabilities: ['node.js', 'typescript', 'react']
      },
      'python-specialist': {
        department: 'technical',
        type: 'api-architecture',
        taskType: 'coding',
        language: 'python',
        capabilities: ['django', 'flask', 'fastapi']
      },
      'golang-specialist': {
        department: 'technical',
        type: 'api-architecture',
        taskType: 'coding',
        language: 'golang',
        capabilities: ['go modules', 'concurrency', 'microservices']
      },
      'rust-specialist': {
        department: 'technical',
        type: 'performance-engineering',
        taskType: 'coding',
        language: 'rust',
        capabilities: ['memory safety', 'performance', 'systems programming']
      }
    };
  }
  
  /**
   * Spawn specialists based on routing plan
   */
  async spawnSpecialistsForPlan(routingPlan) {
    const { execution } = routingPlan;
    const specialists = [];
    
    logger.info('🟢 Spawning specialists for routing plan:', {
      agentCount: execution.agents.length,
      agents: execution.agents.map(a => a.name)
    });
    
    for (const agentConfig of execution.agents) {
      if (agentConfig.role === 'specialist') {
        const specialist = await this.spawnSpecialist(agentConfig);
        if (specialist) {
          specialists.push(specialist);
        }
      }
    }
    
    return specialists;
  }
  
  /**
   * Spawn individual specialist
   */
  async spawnSpecialist(agentConfig) {
    const { name, model, usingClaudeMax } = agentConfig;
    
    // Get specialist mapping
    const mapping = this.specialistMappings[name];
    if (!mapping) {
      logger.warn(`🟡 No mapping found for specialist: ${name}`);
      return null;
    }
    
    try {
      // Prepare context with model assignment
      const context = {
        model: model || await this.assignModel(mapping),
        usingClaudeMax,
        taskType: mapping.taskType,
        capabilities: mapping.capabilities,
        language: mapping.language
      };
      
      // Spawn through lifecycle manager
      const specialist = await this.lifecycleManager.spawnSpecialist(
        mapping.department,
        mapping.type,
        context,
        null, // Manager will be set later
        2 // Normal priority
      );
      
      // Track specialist
      this.trackSpecialist(specialist, name, context.model);
      
      
      // Get department color for spawn message
      const deptColor = mapping.department === 'strategic' ? chalk.yellow :
                       mapping.department === 'technical' ? chalk.green :
                       mapping.department === 'experience' ? chalk.red :
                       chalk.white;
      const deptEmoji = mapping.department === 'strategic' ? '🟡' :
                       mapping.department === 'technical' ? '🟢' :
                       mapping.department === 'experience' ? '🔴' :
                       '🏁';
      
      logger.info(deptColor(`${deptEmoji} Spawned ${name} with model ${context.model}`));;
      
      return specialist;
      
    } catch (error) {
      logger.error(`🔴 Failed to spawn ${name}: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Assign model to specialist based on task type
   */
  async assignModel(mapping) {
    // Use domain router to get optimal model
    const task = {
      taskType: mapping.taskType,
      language: mapping.language,
      department: mapping.department
    };
    
    const modelConfig = await this.domainRouter.assignModelToWorker(task);
    return modelConfig.model;
  }
  
  /**
   * Track spawned specialist
   */
  trackSpecialist(specialist, name, model) {
    // Store in active map
    this.activeSpecialists.set(specialist.id, {
      specialist,
      name,
      model,
      spawnedAt: Date.now()
    });
    
    // Update metrics
    this.metrics.totalSpawned++;
    this.metrics.byType[name] = (this.metrics.byType[name] || 0) + 1;
    this.metrics.byDepartment[specialist.department] = 
      (this.metrics.byDepartment[specialist.department] || 0) + 1;
    this.metrics.modelAssignments[model] = 
      (this.metrics.modelAssignments[model] || 0) + 1;
  }
  
  /**
   * Get specialist by ID
   */
  getSpecialist(id) {
    const entry = this.activeSpecialists.get(id);
    return entry ? entry.specialist : null;
  }
  
  /**
   * Dissolve specialist
   */
  async dissolveSpecialist(id, reason = 'task_completed') {
    const entry = this.activeSpecialists.get(id);
    if (!entry) {
      logger.warn(`🟡 Specialist ${id} not found`);
      return false;
    }
    
    try {
      await this.lifecycleManager.dissolveSpecialist(entry.specialist, reason);
      this.activeSpecialists.delete(id);
      
      logger.info(`🏁 Dissolved specialist ${entry.name}`);
      return true;
      
    } catch (error) {
      logger.error(`🔴 Failed to dissolve specialist: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Dissolve all specialists
   */
  async dissolveAll(reason = 'cleanup') {
    const ids = Array.from(this.activeSpecialists.keys());
    const results = await Promise.all(
      ids.map(id => this.dissolveSpecialist(id, reason))
    );
    
    return results.every(r => r === true);
  }
  
  /**
   * Configure specialist with specific settings
   */
  async configureSpecialist(specialistId, configuration) {
    try {
      const specialist = this.activeSpecialists.get(specialistId);
      if (!specialist) {
        throw new Error(`Specialist not found: ${specialistId}`);
      }

      // Apply configuration
      if (configuration.model) {
        specialist.model = configuration.model;
      }
      if (configuration.context) {
        Object.assign(specialist.context, configuration.context);
      }
      if (configuration.capabilities) {
        specialist.capabilities = [...new Set([...specialist.capabilities, ...configuration.capabilities])];
      }

      specialist.lastConfigured = Date.now();
      specialist.configuration = { ...specialist.configuration, ...configuration };

      logger.info(`🔧 Specialist configured: ${specialistId}`, configuration);
      return specialist;
    } catch (error) {
      logger.error(`Failed to configure specialist ${specialistId}:`, error);
      throw error;
    }
  }

  /**
   * Security validation framework for specialist spawning
   */
  async validateSecurityInput(agentConfig) {
    const errors = [];
    
    // Input type validation
    if (typeof agentConfig !== 'object' || agentConfig === null) {
      throw new SecurityError('Agent config must be a valid object');
    }
    
    // Specialist type validation
    if (agentConfig.specialistType) {
      // Check for injection patterns
      const sqlPatterns = /['";\\x00\\n\\r\\x1a]/g;
      const cmdPatterns = /[;&|`$(){}[\]]/g;
      const xssPatterns = /<script[^>]*>.*?<\/script>/gi;
      
      if (sqlPatterns.test(agentConfig.specialistType)) {
        errors.push('SQL injection attempt detected in specialistType');
      }
      if (cmdPatterns.test(agentConfig.specialistType)) {
        errors.push('Command injection attempt detected in specialistType');
      }
      if (xssPatterns.test(agentConfig.specialistType)) {
        errors.push('XSS attempt detected in specialistType');
      }
      
      // Length validation
      if (agentConfig.specialistType.length > 100) {
        errors.push('Specialist type exceeds maximum length (100 chars)');
      }
      
      // Whitelist validation
      if (!this.specialistMappings[agentConfig.specialistType]) {
        errors.push(`Unknown specialist type: ${agentConfig.specialistType}`);
      }
    }
    
    // Department validation
    if (agentConfig.department) {
      const allowedDepartments = ['strategic', 'experience', 'technical'];
      if (!allowedDepartments.includes(agentConfig.department)) {
        errors.push(`Invalid department: ${agentConfig.department}`);
      }
    }
    
    // Resource limits validation
    if (agentConfig.resources) {
      if (agentConfig.resources.memory && agentConfig.resources.memory > 8192) {
        errors.push('Memory request exceeds security limits (8GB max)');
      }
      if (agentConfig.resources.cpu && agentConfig.resources.cpu > 16) {
        errors.push('CPU request exceeds security limits (16 cores max)');
      }
    }
    
    // Context security validation
    if (agentConfig.context) {
      const sensitivePatterns = /password|token|key|secret|credential|api[_-]?key/i;
      for (const [key, value] of Object.entries(agentConfig.context)) {
        if (sensitivePatterns.test(key)) {
          errors.push(`Sensitive field detected in context: ${key}`);
        }
        if (typeof value === 'string' && sensitivePatterns.test(value)) {
          errors.push('Sensitive data detected in context values');
        }
      }
    }
    
    // Rate limiting per specialist type
    const rateLimitKey = `spawn_${agentConfig.specialistType}`;
    if (!this.rateLimits) {
      this.rateLimits = new Map();
    }
    
    const now = Date.now();
    const windowSize = 60000; // 1 minute
    const maxSpawns = 50; // Max 50 spawns per minute per type
    
    if (!this.rateLimits.has(rateLimitKey)) {
      this.rateLimits.set(rateLimitKey, []);
    }
    
    const spawns = this.rateLimits.get(rateLimitKey);
    const recentSpawns = spawns.filter(time => now - time < windowSize);
    
    if (recentSpawns.length >= maxSpawns) {
      errors.push(`Rate limit exceeded for ${agentConfig.specialistType}: ${recentSpawns.length}/${maxSpawns} spawns`);
    }
    
    recentSpawns.push(now);
    this.rateLimits.set(rateLimitKey, recentSpawns);
    
    if (errors.length > 0) {
      const securityError = new SecurityError('Security validation failed', {
        errors,
        agentConfig: this.sanitizeAgentConfig(agentConfig)
      });
      
      logger.error('🔒 Specialist security validation failed:', {
        errors,
        timestamp: now,
        agentConfig: this.sanitizeAgentConfig(agentConfig)
      });
      
      throw securityError;
    }
    
    return true;
  }

  /**
   * Sanitize agent config for safe logging
   */
  sanitizeAgentConfig(agentConfig) {
    const sanitized = { ...agentConfig };
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'credential'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    if (sanitized.context) {
      sanitized.context = { ...sanitized.context };
      for (const [key, value] of Object.entries(sanitized.context)) {
        if (sensitiveFields.some(s => key.toLowerCase().includes(s))) {
          sanitized.context[key] = '[REDACTED]';
        }
      }
    }
    
    return sanitized;
  }

  /**
   * Validate specialist before spawning
   */
  async validateSpecialist(agentConfig) {
    const errors = [];

    // Security validation first
    try {
      await this.validateSecurityInput(agentConfig);
    } catch (securityError) {
      errors.push(`Security validation failed: ${securityError.message}`);
    }

    // Validate required fields
    if (!agentConfig.specialistType) {
      errors.push('Specialist type is required');
    }

    if (!agentConfig.department) {
      errors.push('Department is required');
    }

    // Validate specialist type exists
    if (agentConfig.specialistType && !this.specialistMappings[agentConfig.specialistType]) {
      errors.push(`Unknown specialist type: ${agentConfig.specialistType}`);
    }

    // Validate department compatibility
    const mapping = this.specialistMappings[agentConfig.specialistType];
    if (mapping && agentConfig.department !== mapping.department) {
      errors.push(`Specialist ${agentConfig.specialistType} cannot be assigned to department ${agentConfig.department}`);
    }

    // Validate context if provided
    if (agentConfig.context) {
      if (typeof agentConfig.context !== 'object') {
        errors.push('Context must be an object');
      }
    }

    // Validate resource requirements
    if (agentConfig.resources) {
      if (agentConfig.resources.memory && agentConfig.resources.memory > 4000) {
        errors.push('Memory requirement exceeds system limits (4GB max)');
      }
      if (agentConfig.resources.cpu && agentConfig.resources.cpu > 8) {
        errors.push('CPU requirement exceeds system limits (8 cores max)');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    return true;
  }

  /**
   * Allocate resources for specialist
   */
  async allocateResources(specialistConfig) {
    const resources = {
      memory: specialistConfig.resources?.memory || 512, // MB
      cpu: specialistConfig.resources?.cpu || 1, // cores
      storage: specialistConfig.resources?.storage || 100, // MB
      network: specialistConfig.resources?.network || 'standard',
      allocated: true,
      timestamp: Date.now()
    };

    // Check resource availability
    const available = await this.checkResourceAvailability(resources);
    if (!available) {
      throw new Error('Insufficient resources available');
    }

    // Allocate resources
    const allocation = {
      id: `alloc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      specialistType: specialistConfig.specialistType,
      resources,
      allocated: Date.now(),
      status: 'allocated'
    };

    logger.info(`💾 Resources allocated for ${specialistConfig.specialistType}:`, resources);
    return allocation;
  }

  /**
   * Cleanup specialist resources
   */
  async cleanupSpecialist(specialistId, reason = 'task_completed') {
    try {
      const specialist = this.activeSpecialists.get(specialistId);
      if (!specialist) {
        logger.warn(`Cleanup requested for unknown specialist: ${specialistId}`);
        return false;
      }

      // Release resources
      if (specialist.resources) {
        await this.releaseResources(specialist.resources);
      }

      // Clear context and sensitive data
      specialist.context = {};
      specialist.memory = null;
      specialist.activeConnections = [];

      // Remove from active specialists
      this.activeSpecialists.delete(specialistId);

      // Update metrics
      const type = specialist.type || 'unknown';
      if (this.metrics.byType[type]) {
        this.metrics.byType[type]--;
      }

      logger.info(`🧹 Specialist cleaned up: ${specialistId} (${reason})`);
      return true;
    } catch (error) {
      logger.error(`Failed to cleanup specialist ${specialistId}:`, error);
      throw error;
    }
  }

  /**
   * Get specialist status and information
   */
  getSpecialistStatus(specialistId) {
    const specialist = this.activeSpecialists.get(specialistId);
    if (!specialist) {
      return null;
    }

    return {
      id: specialistId,
      type: specialist.type,
      department: specialist.department,
      model: specialist.model,
      status: specialist.status || 'active',
      spawnedAt: specialist.spawnedAt,
      lastActivity: specialist.lastActivity,
      taskCount: specialist.taskCount || 0,
      uptime: Date.now() - specialist.spawnedAt,
      resources: specialist.resources,
      capabilities: specialist.capabilities,
      configuration: specialist.configuration || {}
    };
  }

  /**
   * Spawn multiple specialists in batch with optimized performance
   */
  async batchSpawn(agentConfigs, options = {}) {
    const results = [];
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.info(`🟢 Starting optimized batch spawn: ${agentConfigs.length} specialists (${batchId})`);
      
      const concurrency = options.concurrency || 5; // Increased default concurrency
      const maxBatchSize = options.maxBatchSize || 10;
      
      // Pre-validate all configs in parallel
      const validationPromises = agentConfigs.map(config => 
        this.validateSpecialist(config).then(() => ({ valid: true, config }))
          .catch(error => ({ valid: false, config, error: error.message }))
      );
      
      const validationResults = await Promise.allSettled(validationPromises);
      const validConfigs = validationResults
        .filter(result => result.status === 'fulfilled' && result.value.valid)
        .map(result => result.value.config);
      
      const invalidConfigs = validationResults
        .filter(result => result.status === 'fulfilled' && !result.value.valid)
        .map(result => result.value);
      
      // Log validation results
      if (invalidConfigs.length > 0) {
        logger.warn(`🟠️ ${invalidConfigs.length} configs failed validation`);
      }
      
      // Process valid configs in optimized batches
      const batches = [];
      for (let i = 0; i < validConfigs.length; i += Math.min(concurrency, maxBatchSize)) {
        batches.push(validConfigs.slice(i, i + Math.min(concurrency, maxBatchSize)));
      }
      
      // Process all batches with controlled concurrency
      const batchPromises = batches.map(async (batch, batchIndex) => {
        const batchStartTime = Date.now();
        
        const batchResults = await Promise.allSettled(
          batch.map(async (config, index) => {
            const startTime = Date.now();
            try {
              // Allocate resources first (faster than on-demand)
              const resources = await this.allocateResources(config);
              
              const specialist = await this.spawnSpecialist({
                ...config,
                batchId,
                batchIndex,
                globalIndex: batchIndex * concurrency + index,
                resources
              });
              
              const duration = Date.now() - startTime;
              return { 
                success: true, 
                specialist, 
                config, 
                duration,
                resources: resources.id 
              };
            } catch (error) {
              const duration = Date.now() - startTime;
              return { 
                success: false, 
                error: error.message, 
                config, 
                duration 
              };
            }
          })
        );
        
        const batchDuration = Date.now() - batchStartTime;
        const batchSuccessful = batchResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
        
        logger.info(`📦 Batch ${batchIndex + 1}/${batches.length}: ${batchSuccessful}/${batch.length} successful (${batchDuration}ms)`);
        
        return batchResults.map(r => r.status === 'fulfilled' ? r.value : { 
          success: false, 
          error: r.reason.message 
        });
      });
      
      // Wait for all batches to complete
      const allBatchResults = await Promise.all(batchPromises);
      results.push(...allBatchResults.flat());
      
      // Add invalid configs to results
      invalidConfigs.forEach(invalid => {
        results.push({
          success: false,
          error: `Validation failed: ${invalid.error}`,
          config: invalid.config
        });
      });
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      const avgDuration = results
        .filter(r => r.duration)
        .reduce((sum, r) => sum + r.duration, 0) / Math.max(successful, 1);
      
      logger.info(`🏁 Optimized batch spawn complete: ${successful} successful, ${failed} failed, ${Math.round(avgDuration)}ms avg (${batchId})`);
      
      return {
        batchId,
        total: agentConfigs.length,
        successful,
        failed,
        averageDuration: Math.round(avgDuration),
        results,
        performance: {
          validationTime: validationResults.length > 0 ? 'parallel' : 'none',
          batchCount: batches.length,
          concurrency
        }
      };
    } catch (error) {
      logger.error(`Optimized batch spawn failed (${batchId}):`, error);
      throw error;
    }
  }

  // Helper methods for resource management

  async checkResourceAvailability(required) {
    // Simple availability check - in production this would query actual system resources
    const systemResources = {
      memory: 8192, // 8GB available
      cpu: 8, // 8 cores available
      storage: 10240 // 10GB available
    };

    const currentUsage = this.calculateCurrentUsage();
    
    return (
      (currentUsage.memory + required.memory) <= systemResources.memory &&
      (currentUsage.cpu + required.cpu) <= systemResources.cpu &&
      (currentUsage.storage + required.storage) <= systemResources.storage
    );
  }

  calculateCurrentUsage() {
    let totalMemory = 0;
    let totalCpu = 0;
    let totalStorage = 0;

    for (const specialist of this.activeSpecialists.values()) {
      if (specialist.resources) {
        totalMemory += specialist.resources.memory || 512;
        totalCpu += specialist.resources.cpu || 1;
        totalStorage += specialist.resources.storage || 100;
      }
    }

    return { memory: totalMemory, cpu: totalCpu, storage: totalStorage };
  }

  async releaseResources(resources) {
    // In production, this would actually release system resources
    logger.debug('Resources released:', resources);
    return true;
  }

  /**
   * Get spawner metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      currentlyActive: this.activeSpecialists.size,
      specialists: Array.from(this.activeSpecialists.values()).map(e => ({
        name: e.name,
        model: e.model,
        age: Date.now() - e.spawnedAt
      }))
    };
  }
  
  /**
   * Check if specialist type is available
   */
  isSpecialistAvailable(name) {
    return this.specialistMappings.hasOwnProperty(name);
  }
  
  /**
   * Get available specialist types
   */
  getAvailableSpecialists() {
    return Object.keys(this.specialistMappings);
  }
  
  /**
   * Get specialist capabilities
   */
  getSpecialistCapabilities(name) {
    const mapping = this.specialistMappings[name];
    return mapping ? mapping.capabilities : [];
  }
}

// Singleton instance
let instance = null;

module.exports = {
  SpecialistSpawner,
  getInstance: (config) => {
    if (!instance) {
      instance = new SpecialistSpawner(config);
    }
    return instance;
  }
};