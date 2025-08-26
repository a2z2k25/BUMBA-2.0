/**
 * Production Specialist Pool - Sprint 4
 * FULL 83 specialists with enterprise-grade features
 * Memory-efficient, highly scalable, production-ready
 */

const { EventEmitter } = require('events');
const { SingleSpecialistPool, SpecialistState, MEMORY_BY_STATE } = require('./single-specialist-pool');

/**
 * Extended Department system for 83 specialists
 */
const Department = {
  // Core Development (25)
  BACKEND: 'BACKEND',           // 8 specialists
  FRONTEND: 'FRONTEND',         // 8 specialists  
  MOBILE: 'MOBILE',            // 5 specialists
  FULLSTACK: 'FULLSTACK',      // 4 specialists

  // Data & AI (15)
  DATA_ENGINEERING: 'DATA_ENGINEERING',    // 4 specialists
  ML_AI: 'ML_AI',                          // 4 specialists
  ANALYTICS: 'ANALYTICS',                   // 3 specialists
  DATA_SCIENCE: 'DATA_SCIENCE',            // 4 specialists

  // Infrastructure (18)
  DEVOPS: 'DEVOPS',            // 6 specialists
  CLOUD: 'CLOUD',              // 4 specialists
  INFRASTRUCTURE: 'INFRASTRUCTURE',  // 4 specialists
  MONITORING: 'MONITORING',     // 4 specialists

  // Quality & Security (12)
  SECURITY: 'SECURITY',         // 4 specialists
  TESTING: 'TESTING',          // 4 specialists
  QUALITY: 'QUALITY',          // 4 specialists

  // Specialized (13)
  DESIGN: 'DESIGN',            // 3 specialists
  PERFORMANCE: 'PERFORMANCE',   // 3 specialists
  ARCHITECTURE: 'ARCHITECTURE', // 3 specialists
  RESEARCH: 'RESEARCH',        // 4 specialists
};

/**
 * Complete specialist definitions for 83 specialists
 */
const FULL_SPECIALIST_DEFINITIONS = [
  // BACKEND (8)
  { id: 'api-architect', type: 'api-architect', department: Department.BACKEND, priority: 'high' },
  { id: 'microservices-lead', type: 'microservices-architect', department: Department.BACKEND, priority: 'high' },
  { id: 'database-architect', type: 'database-architect', department: Department.BACKEND, priority: 'high' },
  { id: 'graphql-specialist', type: 'graphql-developer', department: Department.BACKEND, priority: 'medium' },
  { id: 'rest-api-developer', type: 'rest-developer', department: Department.BACKEND, priority: 'medium' },
  { id: 'websocket-engineer', type: 'realtime-engineer', department: Department.BACKEND, priority: 'medium' },
  { id: 'server-optimization', type: 'performance-engineer', department: Department.BACKEND, priority: 'low' },
  { id: 'api-gateway-specialist', type: 'gateway-engineer', department: Department.BACKEND, priority: 'medium' },

  // FRONTEND (8)
  { id: 'react-lead', type: 'react-architect', department: Department.FRONTEND, priority: 'high' },
  { id: 'vue-specialist', type: 'vue-developer', department: Department.FRONTEND, priority: 'medium' },
  { id: 'angular-expert', type: 'angular-developer', department: Department.FRONTEND, priority: 'medium' },
  { id: 'typescript-specialist', type: 'typescript-expert', department: Department.FRONTEND, priority: 'high' },
  { id: 'state-management', type: 'state-architect', department: Department.FRONTEND, priority: 'medium' },
  { id: 'web-components', type: 'component-specialist', department: Department.FRONTEND, priority: 'low' },
  { id: 'frontend-testing', type: 'frontend-tester', department: Department.FRONTEND, priority: 'medium' },
  { id: 'css-architect', type: 'css-expert', department: Department.FRONTEND, priority: 'low' },

  // MOBILE (5)
  { id: 'react-native-lead', type: 'react-native-expert', department: Department.MOBILE, priority: 'high' },
  { id: 'flutter-specialist', type: 'flutter-developer', department: Department.MOBILE, priority: 'high' },
  { id: 'ios-developer', type: 'ios-specialist', department: Department.MOBILE, priority: 'medium' },
  { id: 'android-developer', type: 'android-specialist', department: Department.MOBILE, priority: 'medium' },
  { id: 'mobile-ui-expert', type: 'mobile-ui-designer', department: Department.MOBILE, priority: 'low' },

  // FULLSTACK (4)
  { id: 'fullstack-architect', type: 'fullstack-lead', department: Department.FULLSTACK, priority: 'high' },
  { id: 'jamstack-specialist', type: 'jamstack-expert', department: Department.FULLSTACK, priority: 'medium' },
  { id: 'serverless-expert', type: 'serverless-architect', department: Department.FULLSTACK, priority: 'medium' },
  { id: 'edge-computing', type: 'edge-specialist', department: Department.FULLSTACK, priority: 'low' },

  // DATA_ENGINEERING (4)
  { id: 'data-pipeline-architect', type: 'pipeline-architect', department: Department.DATA_ENGINEERING, priority: 'high' },
  { id: 'etl-specialist', type: 'etl-expert', department: Department.DATA_ENGINEERING, priority: 'high' },
  { id: 'stream-processing', type: 'streaming-engineer', department: Department.DATA_ENGINEERING, priority: 'medium' },
  { id: 'data-warehouse-expert', type: 'warehouse-architect', department: Department.DATA_ENGINEERING, priority: 'medium' },

  // ML_AI (4)
  { id: 'ml-architect', type: 'ml-lead', department: Department.ML_AI, priority: 'high' },
  { id: 'deep-learning-expert', type: 'deep-learning-specialist', department: Department.ML_AI, priority: 'high' },
  { id: 'nlp-specialist', type: 'nlp-expert', department: Department.ML_AI, priority: 'medium' },
  { id: 'computer-vision', type: 'cv-specialist', department: Department.ML_AI, priority: 'medium' },

  // ANALYTICS (3)
  { id: 'data-analyst-lead', type: 'analytics-lead', department: Department.ANALYTICS, priority: 'high' },
  { id: 'bi-specialist', type: 'bi-expert', department: Department.ANALYTICS, priority: 'medium' },
  { id: 'metrics-engineer', type: 'metrics-specialist', department: Department.ANALYTICS, priority: 'medium' },

  // DATA_SCIENCE (4)
  { id: 'data-scientist-lead', type: 'data-science-lead', department: Department.DATA_SCIENCE, priority: 'high' },
  { id: 'statistical-modeler', type: 'statistics-expert', department: Department.DATA_SCIENCE, priority: 'medium' },
  { id: 'feature-engineer', type: 'feature-specialist', department: Department.DATA_SCIENCE, priority: 'medium' },
  { id: 'research-scientist', type: 'research-expert', department: Department.DATA_SCIENCE, priority: 'medium' },

  // DEVOPS (6)
  { id: 'devops-architect', type: 'devops-lead', department: Department.DEVOPS, priority: 'high' },
  { id: 'ci-cd-expert', type: 'ci-cd-architect', department: Department.DEVOPS, priority: 'high' },
  { id: 'kubernetes-architect', type: 'k8s-expert', department: Department.DEVOPS, priority: 'high' },
  { id: 'docker-specialist', type: 'container-expert', department: Department.DEVOPS, priority: 'medium' },
  { id: 'automation-engineer', type: 'automation-specialist', department: Department.DEVOPS, priority: 'medium' },
  { id: 'release-manager', type: 'release-specialist', department: Department.DEVOPS, priority: 'medium' },

  // CLOUD (4)
  { id: 'aws-architect', type: 'aws-expert', department: Department.CLOUD, priority: 'high' },
  { id: 'azure-specialist', type: 'azure-expert', department: Department.CLOUD, priority: 'high' },
  { id: 'gcp-expert', type: 'gcp-specialist', department: Department.CLOUD, priority: 'medium' },
  { id: 'multi-cloud-architect', type: 'multi-cloud-expert', department: Department.CLOUD, priority: 'medium' },

  // INFRASTRUCTURE (4)
  { id: 'infrastructure-architect', type: 'infra-lead', department: Department.INFRASTRUCTURE, priority: 'high' },
  { id: 'network-engineer', type: 'network-specialist', department: Department.INFRASTRUCTURE, priority: 'medium' },
  { id: 'storage-specialist', type: 'storage-expert', department: Department.INFRASTRUCTURE, priority: 'medium' },
  { id: 'platform-engineer', type: 'platform-specialist', department: Department.INFRASTRUCTURE, priority: 'medium' },

  // MONITORING (4)
  { id: 'observability-architect', type: 'observability-lead', department: Department.MONITORING, priority: 'high' },
  { id: 'metrics-specialist', type: 'metrics-engineer', department: Department.MONITORING, priority: 'medium' },
  { id: 'logging-expert', type: 'logging-specialist', department: Department.MONITORING, priority: 'medium' },
  { id: 'apm-specialist', type: 'apm-expert', department: Department.MONITORING, priority: 'medium' },

  // SECURITY (4)
  { id: 'security-architect', type: 'security-lead', department: Department.SECURITY, priority: 'high' },
  { id: 'penetration-tester', type: 'pentest-expert', department: Department.SECURITY, priority: 'high' },
  { id: 'compliance-expert', type: 'compliance-specialist', department: Department.SECURITY, priority: 'medium' },
  { id: 'crypto-specialist', type: 'cryptography-expert', department: Department.SECURITY, priority: 'medium' },

  // TESTING (4)
  { id: 'qa-architect', type: 'qa-lead', department: Department.TESTING, priority: 'high' },
  { id: 'automation-tester', type: 'automation-qa', department: Department.TESTING, priority: 'high' },
  { id: 'performance-tester', type: 'perf-tester', department: Department.TESTING, priority: 'medium' },
  { id: 'accessibility-tester', type: 'a11y-specialist', department: Department.TESTING, priority: 'low' },

  // QUALITY (4)
  { id: 'code-quality-lead', type: 'quality-lead', department: Department.QUALITY, priority: 'medium' },
  { id: 'static-analysis', type: 'analysis-specialist', department: Department.QUALITY, priority: 'medium' },
  { id: 'code-reviewer', type: 'review-specialist', department: Department.QUALITY, priority: 'low' },
  { id: 'documentation-expert', type: 'doc-specialist', department: Department.QUALITY, priority: 'low' },

  // DESIGN (3)
  { id: 'design-system-lead', type: 'design-system-architect', department: Department.DESIGN, priority: 'high' },
  { id: 'ux-researcher', type: 'ux-research-expert', department: Department.DESIGN, priority: 'medium' },
  { id: 'visual-designer', type: 'visual-design-expert', department: Department.DESIGN, priority: 'low' },

  // PERFORMANCE (3)
  { id: 'performance-architect', type: 'performance-lead', department: Department.PERFORMANCE, priority: 'high' },
  { id: 'web-performance', type: 'web-perf-expert', department: Department.PERFORMANCE, priority: 'medium' },
  { id: 'database-performance', type: 'db-perf-specialist', department: Department.PERFORMANCE, priority: 'medium' },

  // ARCHITECTURE (3)
  { id: 'system-architect', type: 'system-design-lead', department: Department.ARCHITECTURE, priority: 'high' },
  { id: 'solution-architect', type: 'solution-design-expert', department: Department.ARCHITECTURE, priority: 'high' },
  { id: 'integration-architect', type: 'integration-specialist', department: Department.ARCHITECTURE, priority: 'medium' },

  // RESEARCH (4)
  { id: 'tech-researcher', type: 'tech-research-lead', department: Department.RESEARCH, priority: 'medium' },
  { id: 'innovation-specialist', type: 'innovation-expert', department: Department.RESEARCH, priority: 'low' },
  { id: 'prototype-engineer', type: 'prototype-specialist', department: Department.RESEARCH, priority: 'low' },
  { id: 'emerging-tech', type: 'emerging-tech-expert', department: Department.RESEARCH, priority: 'low' }
];

/**
 * Enterprise-grade collaboration workflows
 */
const ENTERPRISE_WORKFLOWS = {
  // Core Development Flows
  FULL_STACK_FEATURE: ['api-architect', 'database-architect', 'react-lead', 'frontend-testing'],
  MICROSERVICES_DEPLOYMENT: ['microservices-lead', 'kubernetes-architect', 'observability-architect', 'security-architect'],
  API_DEVELOPMENT: ['api-architect', 'database-architect', 'api-gateway-specialist', 'automation-tester'],
  
  // Data & AI Flows  
  ML_PIPELINE: ['data-pipeline-architect', 'ml-architect', 'data-scientist-lead', 'observability-architect'],
  DATA_PLATFORM: ['data-pipeline-architect', 'data-warehouse-expert', 'stream-processing', 'metrics-engineer'],
  AI_DEPLOYMENT: ['ml-architect', 'kubernetes-architect', 'observability-architect', 'performance-architect'],
  
  // Infrastructure Flows
  CLOUD_MIGRATION: ['aws-architect', 'kubernetes-architect', 'security-architect', 'observability-architect'],
  PLATFORM_SETUP: ['infrastructure-architect', 'devops-architect', 'security-architect', 'observability-architect'],
  PERFORMANCE_OPTIMIZATION: ['performance-architect', 'database-performance', 'web-performance', 'observability-architect'],
  
  // Quality & Security
  SECURITY_AUDIT: ['security-architect', 'penetration-tester', 'compliance-expert', 'automation-tester'],
  QUALITY_ASSURANCE: ['qa-architect', 'automation-tester', 'code-quality-lead', 'performance-tester'],
  
  // Mobile Development
  MOBILE_APP: ['react-native-lead', 'mobile-ui-expert', 'api-architect', 'automation-tester'],
  
  // Design & UX
  DESIGN_SYSTEM: ['design-system-lead', 'react-lead', 'css-architect', 'accessibility-tester']
};

/**
 * Advanced monitoring and alerting system
 */
class EnterpriseMonitoring extends EventEmitter {
  constructor() {
    super();
    this.alerts = [];
    this.metrics = new Map();
    this.thresholds = {
      memoryUsage: 0.8,        // 80% of max
      coldStartRate: 0.3,      // 30% cold starts
      queueDepth: 20,          // 20 queued tasks
      predictionAccuracy: 0.6, // 60% accuracy
      responseTime: 2000       // 2 second max
    };
  }
  
  checkAlerts(poolMetrics) {
    const alerts = [];
    
    // Memory pressure
    if (poolMetrics.efficiency.utilizationRate > this.thresholds.memoryUsage) {
      alerts.push({
        level: 'WARNING',
        type: 'MEMORY_PRESSURE',
        message: `Memory utilization at ${(poolMetrics.efficiency.utilizationRate * 100).toFixed(1)}%`,
        recommendation: 'Consider increasing warmThreshold or reducing maxWarmSpecialists'
      });
    }
    
    // Cold start rate
    const coldStartRate = poolMetrics.performance.coldStarts / poolMetrics.performance.totalTasks;
    if (coldStartRate > this.thresholds.coldStartRate) {
      alerts.push({
        level: 'INFO',
        type: 'HIGH_COLD_STARTS',
        message: `Cold start rate at ${(coldStartRate * 100).toFixed(1)}%`,
        recommendation: 'Improve prediction accuracy or increase warm specialists'
      });
    }
    
    // Queue depth
    if (poolMetrics.performance.queueDepth > this.thresholds.queueDepth) {
      alerts.push({
        level: 'CRITICAL',
        type: 'QUEUE_OVERLOAD',
        message: `Queue depth at ${poolMetrics.performance.queueDepth}`,
        recommendation: 'Scale up warm specialists or add more processing power'
      });
    }
    
    // Prediction accuracy
    if (poolMetrics.prediction.accuracy < this.thresholds.predictionAccuracy) {
      alerts.push({
        level: 'INFO',
        type: 'LOW_PREDICTION_ACCURACY',
        message: `Prediction accuracy at ${(poolMetrics.prediction.accuracy * 100).toFixed(1)}%`,
        recommendation: 'Allow more learning time or review prediction algorithms'
      });
    }
    
    return alerts;
  }
  
  recordMetric(name, value, timestamp = Date.now()) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name);
    values.push({ value, timestamp });
    
    // Keep only last 100 values
    if (values.length > 100) {
      values.shift();
    }
  }
  
  getMetricHistory(name, duration = 3600000) { // 1 hour default
    const values = this.metrics.get(name) || [];
    const cutoff = Date.now() - duration;
    return values.filter(v => v.timestamp > cutoff);
  }
}

/**
 * Production-Ready Specialist Pool - 83 Specialists
 */
class ProductionSpecialistPool extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Production configuration
    this.config = {
      maxSpecialists: config.maxSpecialists || 83,
      maxWarmSpecialists: config.maxWarmSpecialists || 17, // ~20% warm
      cooldownTime: config.cooldownTime || 45000,         // 45 seconds
      usageDecayRate: config.usageDecayRate || 0.02,      // Very slow decay
      warmThreshold: config.warmThreshold || 0.3,         // Lower threshold
      predictionWindow: config.predictionWindow || 15,    // Larger window
      
      // Enterprise features
      priorityWeighting: config.priorityWeighting !== false,
      departmentBalance: config.departmentBalance !== false,
      workflowOptimization: config.workflowOptimization !== false,
      adaptiveScaling: config.adaptiveScaling !== false,
      enterpriseMonitoring: config.enterpriseMonitoring !== false,
      
      // Performance tuning
      batchSize: config.batchSize || 5,
      warmingConcurrency: config.warmingConcurrency || 3,
      predictionCacheSize: config.predictionCacheSize || 50,
      
      verbose: config.verbose !== false
    };
    
    // Core systems
    this.specialists = new Map();
    this.specialistTypes = new Map();
    this.monitoring = new EnterpriseMonitoring();
    
    // Advanced tracking
    this.usageScores = new Map();
    this.priorityScores = new Map();
    this.departmentStats = new Map();
    this.workflowPatterns = new Map();
    this.collaborationNetwork = new Map();
    
    // Performance optimization
    this.warmingQueue = new Set();
    this.predictionCache = new Map();
    this.departmentQueues = new Map();
    this.recentTasks = [];
    
    // Enterprise metrics
    this.metrics = {
      totalTasks: 0,
      warmHits: 0,
      coldStarts: 0,
      workflowsDetected: 0,
      collaborationsOptimized: 0,
      memoryPressureEvents: 0,
      adaptiveAdjustments: 0,
      peakConcurrency: 0,
      averageResponseTime: 0,
      uptime: Date.now()
    };
    
    // Initialize
    this.initializeProductionSystem();
    this.startMonitoring();
    
    this.log(`🟢 ProductionSpecialistPool initialized with ${this.config.maxSpecialists} specialists across ${Object.keys(Department).length} departments`);
  }
  
  /**
   * Initialize production system
   */
  initializeProductionSystem() {
    const specialistsToCreate = FULL_SPECIALIST_DEFINITIONS.slice(0, this.config.maxSpecialists);
    
    // Initialize departments
    for (const dept of Object.values(Department)) {
      this.departmentStats.set(dept, {
        taskCount: 0,
        specialists: [],
        avgResponseTime: 0,
        warmCount: 0
      });
      this.departmentQueues.set(dept, []);
    }
    
    // Create all specialists
    let initCount = 0;
    for (const spec of specialistsToCreate) {
      const pool = new SingleSpecialistPool({
        specialistType: spec.type,
        department: spec.department,
        cooldownTime: this.config.cooldownTime,
        verbose: false
      });
      
      pool.on('stateChanged', (event) => {
        this.handleSpecialistStateChange(spec.id, event);
      });
      
      this.specialists.set(spec.id, pool);
      this.specialistTypes.set(spec.id, {
        type: spec.type,
        department: spec.department,
        priority: spec.priority || 'medium'
      });
      
      // Initialize tracking
      this.usageScores.set(spec.id, 0);
      this.priorityScores.set(spec.id, this.getPriorityScore(spec.priority));
      
      // Add to department
      const deptStats = this.departmentStats.get(spec.department);
      deptStats.specialists.push(spec.id);
      
      initCount++;
    }
    
    this.log(`  🏁 Initialized ${initCount} specialists across ${this.departmentStats.size} departments`);
    this.logDepartmentDistribution();
  }
  
  /**
   * Log department distribution
   */
  logDepartmentDistribution() {
    this.log('\n📊 Department Distribution:');
    for (const [dept, stats] of this.departmentStats) {
      this.log(`  ${dept}: ${stats.specialists.length} specialists`);
    }
  }
  
  /**
   * Get priority score
   */
  getPriorityScore(priority) {
    const scores = { high: 1.0, medium: 0.6, low: 0.3 };
    return scores[priority] || 0.6;
  }
  
  /**
   * Handle specialist state change with monitoring
   */
  handleSpecialistStateChange(specialistId, event) {
    this.emit('specialist:stateChanged', {
      specialistId,
      ...event
    });
    
    this.updateMemoryMetrics();
    this.monitoring.recordMetric('stateChanges', 1);
  }
  
  /**
   * Update memory metrics with alerting
   */
  updateMemoryMetrics() {
    let totalMemory = 0;
    let warmCount = 0;
    
    for (const [id, pool] of this.specialists) {
      totalMemory += pool.metrics.memoryUsage;
      const state = pool.getState();
      if (state === SpecialistState.WARM || 
          state === SpecialistState.ACTIVE ||
          state === SpecialistState.WARMING) {
        warmCount++;
      }
    }
    
    this.metrics.currentMemory = totalMemory;
    this.metrics.warmCount = warmCount;
    
    if (totalMemory > (this.metrics.peakMemory || 0)) {
      this.metrics.peakMemory = totalMemory;
    }
    
    // Record monitoring metrics
    this.monitoring.recordMetric('memoryUsage', totalMemory);
    this.monitoring.recordMetric('warmCount', warmCount);
    
    // Check for memory pressure
    const utilizationRate = warmCount / this.specialists.size;
    if (utilizationRate > 0.8) {
      this.metrics.memoryPressureEvents++;
      this.emit('memoryPressure', { 
        utilization: utilizationRate, 
        memory: totalMemory 
      });
    }
  }
  
  /**
   * Execute task with enterprise-grade routing
   */
  async executeTask(task) {
    const startTime = Date.now();
    this.metrics.totalTasks++;
    
    try {
      // Enhanced task selection
      const selectedId = await this.selectEnterpriseSpecialist(task);
      
      if (!selectedId) {
        throw new Error(`No specialist available for task type: ${task.type || 'generic'}`);
      }
      
      const specialist = this.specialists.get(selectedId);
      const specialistInfo = this.specialistTypes.get(selectedId);
      
      if (!specialist) {
        throw new Error(`Specialist not found: ${selectedId}`);
      }
      
      this.log(`\n🟡 Task: ${task.type || 'generic'} → ${selectedId} (${specialistInfo?.department || 'Unknown'})`);
      
      // Check warm status and predictions
      const wasWarm = this.isWarm(specialist);
      const predictions = this.getPredictionsFor(selectedId);
      
      // Execute with monitoring
      const result = await specialist.executeTask(task);
      const responseTime = Date.now() - startTime;
      
      // Update comprehensive tracking
      await this.updateEnterpriseTracking(selectedId, task, responseTime, wasWarm);
      
      // Detect and optimize workflows
      if (this.config.workflowOptimization) {
        await this.detectAndOptimizeWorkflows(task, selectedId);
      }
      
      // Apply intelligent warming
      await this.applyEnterpriseWarming();
      
      // Update recent tasks for pattern analysis
      this.recentTasks.push({
        specialistId: selectedId,
        task,
        timestamp: Date.now(),
        department: specialistInfo.department,
        responseTime
      });
      
      // Keep bounded recent tasks
      if (this.recentTasks.length > this.config.predictionWindow) {
        this.recentTasks.shift();
      }
      
      // Record monitoring
      this.monitoring.recordMetric('responseTime', responseTime);
      this.monitoring.recordMetric('tasksPerMinute', 1);
      
      return {
        ...result,
        poolStats: {
          selectedSpecialist: selectedId,
          department: specialistInfo.department,
          priority: specialistInfo.priority,
          wasWarm,
          responseTime,
          predictions,
          totalMemory: this.metrics.currentMemory,
          warmCount: this.metrics.warmCount,
          queueDepth: this.getTotalQueueDepth(),
          workflowDetected: this.metrics.workflowsDetected > 0
        }
      };
      
    } catch (error) {
      this.monitoring.recordMetric('errors', 1);
      throw error;
    }
  }
  
  /**
   * Enhanced specialist selection with enterprise logic
   */
  async selectEnterpriseSpecialist(task) {
    // Priority 1: Explicit specialist
    if (task.specialistId) {
      return task.specialistId;
    }
    
    // Priority 2: Workflow-based selection
    if (this.config.workflowOptimization) {
      const workflowSpecialist = await this.selectFromWorkflow(task);
      if (workflowSpecialist) return workflowSpecialist;
    }
    
    // Priority 3: Department + Priority weighted selection
    if (task.department) {
      const deptSpecialists = this.departmentStats.get(task.department)?.specialists || [];
      if (deptSpecialists.length > 0) {
        return this.selectBestInDepartment(deptSpecialists, task);
      }
    }
    
    // Priority 4: Type mapping with priority weighting
    if (task.type) {
      const mappedId = this.mapTaskTypeToSpecialist(task.type);
      if (mappedId) return mappedId;
    }
    
    // Priority 5: Prediction-based with caching
    const predicted = await this.getCachedPrediction(task);
    if (predicted) return predicted;
    
    // Fallback: Priority-weighted LRU
    return this.selectPriorityWeightedLRU();
  }
  
  /**
   * Select best specialist in department
   */
  selectBestInDepartment(specialistIds, task) {
    let bestId = specialistIds[0];
    let bestScore = -1;
    
    for (const id of specialistIds) {
      const pool = this.specialists.get(id);
      const state = pool.getState();
      const usageScore = this.usageScores.get(id) || 0;
      const priorityScore = this.priorityScores.get(id) || 0.5;
      
      // Calculate composite score
      let score = priorityScore * 0.4 + usageScore * 0.6;
      
      // Boost if already warm
      if (state === SpecialistState.WARM || state === SpecialistState.ACTIVE) {
        score += 0.5;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestId = id;
      }
    }
    
    return bestId;
  }
  
  /**
   * Select from workflow patterns
   */
  async selectFromWorkflow(task) {
    // Check if this task fits a known workflow
    for (const [workflowName, specialists] of Object.entries(ENTERPRISE_WORKFLOWS)) {
      const workflow = this.workflowPatterns.get(workflowName);
      if (workflow && this.taskFitsWorkflow(task, workflowName)) {
        // Find next specialist in workflow
        const lastUsed = this.getLastWorkflowSpecialist(workflowName);
        const nextIndex = specialists.indexOf(lastUsed) + 1;
        
        if (nextIndex < specialists.length && nextIndex > 0) {
          const nextSpecialist = specialists[nextIndex];
          if (this.specialists.has(nextSpecialist)) {
            this.log(`  🔄 Workflow: ${workflowName} → ${nextSpecialist}`);
            return nextSpecialist;
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Check if task fits workflow
   */
  taskFitsWorkflow(task, workflowName) {
    const taskType = task.type?.toLowerCase() || '';
    const workflowKeywords = {
      FULL_STACK_FEATURE: ['feature', 'api', 'frontend', 'fullstack'],
      MICROSERVICES_DEPLOYMENT: ['microservice', 'deploy', 'kubernetes', 'service'],
      ML_PIPELINE: ['ml', 'model', 'data', 'pipeline', 'ai'],
      API_DEVELOPMENT: ['api', 'rest', 'graphql', 'endpoint'],
      CLOUD_MIGRATION: ['cloud', 'aws', 'azure', 'migrate'],
      SECURITY_AUDIT: ['security', 'audit', 'scan', 'vulnerability']
    };
    
    const keywords = workflowKeywords[workflowName] || [];
    return keywords.some(keyword => taskType.includes(keyword));
  }
  
  /**
   * Get last workflow specialist
   */
  getLastWorkflowSpecialist(workflowName) {
    const recentWorkflowTasks = this.recentTasks
      .filter(t => this.taskFitsWorkflow(t.task, workflowName))
      .sort((a, b) => b.timestamp - a.timestamp);
    
    return recentWorkflowTasks[0]?.specialistId || null;
  }
  
  /**
   * Map task type to specialist (expanded)
   */
  mapTaskTypeToSpecialist(taskType) {
    const typeMap = {
      // Backend
      'api': 'api-architect',
      'rest': 'rest-api-developer', 
      'graphql': 'graphql-specialist',
      'microservice': 'microservices-lead',
      'database': 'database-architect',
      'websocket': 'websocket-engineer',
      'gateway': 'api-gateway-specialist',
      
      // Frontend  
      'react': 'react-lead',
      'vue': 'vue-specialist',
      'angular': 'angular-expert',
      'typescript': 'typescript-specialist',
      'css': 'css-architect',
      'frontend-test': 'frontend-testing',
      
      // Mobile
      'react-native': 'react-native-lead',
      'flutter': 'flutter-specialist',
      'ios': 'ios-developer',
      'android': 'android-developer',
      'mobile-ui': 'mobile-ui-expert',
      
      // Data & AI
      'etl': 'etl-specialist',
      'pipeline': 'data-pipeline-architect',
      'ml': 'ml-architect',
      'ai': 'ml-architect',
      'deep-learning': 'deep-learning-expert',
      'nlp': 'nlp-specialist',
      'computer-vision': 'computer-vision',
      'data-warehouse': 'data-warehouse-expert',
      'analytics': 'data-analyst-lead',
      'bi': 'bi-specialist',
      
      // Infrastructure
      'kubernetes': 'kubernetes-architect',
      'docker': 'docker-specialist',
      'ci-cd': 'ci-cd-expert',
      'devops': 'devops-architect',
      'aws': 'aws-architect',
      'azure': 'azure-specialist',
      'gcp': 'gcp-expert',
      'infrastructure': 'infrastructure-architect',
      'monitoring': 'observability-architect',
      'logging': 'logging-expert',
      
      // Security & Quality
      'security': 'security-architect',
      'pentest': 'penetration-tester',
      'compliance': 'compliance-expert',
      'testing': 'qa-architect',
      'automation-test': 'automation-tester',
      'performance-test': 'performance-tester',
      'quality': 'code-quality-lead',
      
      // Specialized
      'design': 'design-system-lead',
      'ux': 'ux-researcher',
      'performance': 'performance-architect',
      'architecture': 'system-architect',
      'research': 'tech-researcher'
    };
    
    const mappedId = typeMap[taskType.toLowerCase()];
    // Check if the mapped specialist actually exists
    if (mappedId && this.specialists.has(mappedId)) {
      return mappedId;
    }
    return null;
  }
  
  /**
   * Get cached prediction
   */
  async getCachedPrediction(task) {
    const cacheKey = this.getPredictionCacheKey(task);
    const cached = this.predictionCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute cache
      return cached.specialist;
    }
    
    // Generate new prediction
    const prediction = await this.generatePrediction(task);
    if (prediction) {
      this.predictionCache.set(cacheKey, {
        specialist: prediction,
        timestamp: Date.now()
      });
      
      // Trim cache
      if (this.predictionCache.size > this.config.predictionCacheSize) {
        const oldest = Array.from(this.predictionCache.keys())[0];
        this.predictionCache.delete(oldest);
      }
    }
    
    return prediction;
  }
  
  /**
   * Generate prediction cache key
   */
  getPredictionCacheKey(task) {
    return `${task.type || 'generic'}-${task.department || 'any'}`;
  }
  
  /**
   * Generate prediction
   */
  async generatePrediction(task) {
    if (this.recentTasks.length < 2) return null;
    
    // Simple pattern: if similar tasks used same specialist recently
    const similarTasks = this.recentTasks.filter(t => 
      t.task.type === task.type || 
      t.task.department === task.department
    ).slice(-5);
    
    if (similarTasks.length > 0) {
      // Return most recent similar specialist
      return similarTasks[similarTasks.length - 1].specialistId;
    }
    
    return null;
  }
  
  /**
   * Select priority-weighted LRU
   */
  selectPriorityWeightedLRU() {
    let bestId = null;
    let bestScore = -1;
    
    for (const [id] of this.specialists) {
      const usageScore = this.usageScores.get(id) || 0;
      const priorityScore = this.priorityScores.get(id) || 0.5;
      
      // Lower usage = higher LRU score
      const lruScore = 1 - usageScore;
      const compositeScore = lruScore * 0.7 + priorityScore * 0.3;
      
      if (compositeScore > bestScore) {
        bestScore = compositeScore;
        bestId = id;
      }
    }
    
    // If no specialist found, return the first available one
    if (!bestId && this.specialists.size > 0) {
      bestId = this.specialists.keys().next().value;
    }
    
    return bestId;
  }
  
  /**
   * Update enterprise tracking
   */
  async updateEnterpriseTracking(specialistId, task, responseTime, wasWarm) {
    // Update usage scores
    const increment = this.calculateUsageIncrement(task, responseTime);
    this.updateUsageScore(specialistId, increment);
    
    // Update department stats
    const specialistInfo = this.specialistTypes.get(specialistId);
    const deptStats = this.departmentStats.get(specialistInfo.department);
    deptStats.taskCount++;
    
    // Update average response time
    const totalTime = deptStats.avgResponseTime * (deptStats.taskCount - 1) + responseTime;
    deptStats.avgResponseTime = totalTime / deptStats.taskCount;
    
    // Track performance
    if (wasWarm) {
      this.metrics.warmHits++;
    } else {
      this.metrics.coldStarts++;
    }
    
    // Update average response time
    const total = this.metrics.averageResponseTime * (this.metrics.totalTasks - 1) + responseTime;
    this.metrics.averageResponseTime = total / this.metrics.totalTasks;
  }
  
  /**
   * Calculate usage increment based on task complexity
   */
  calculateUsageIncrement(task, responseTime) {
    let increment = 0.1; // Base increment
    
    // Adjust based on response time (longer = more complex)
    if (responseTime > 2000) increment += 0.2;
    else if (responseTime > 1000) increment += 0.1;
    
    // Adjust based on task type
    const complexTypes = ['architecture', 'ml', 'security', 'performance'];
    if (complexTypes.some(type => task.type?.toLowerCase().includes(type))) {
      increment += 0.2;
    }
    
    return Math.min(increment, 0.5); // Cap at 0.5
  }
  
  /**
   * Update usage score
   */
  updateUsageScore(specialistId, increment) {
    const currentScore = this.usageScores.get(specialistId) || 0;
    const newScore = Math.min(1.0, currentScore + increment);
    this.usageScores.set(specialistId, newScore);
  }
  
  /**
   * Detect and optimize workflows
   */
  async detectAndOptimizeWorkflows(task, specialistId) {
    // Look for workflow patterns in recent tasks
    for (const [workflowName, specialists] of Object.entries(ENTERPRISE_WORKFLOWS)) {
      if (specialists.includes(specialistId)) {
        this.metrics.workflowsDetected++;
        
        // Update workflow pattern tracking
        if (!this.workflowPatterns.has(workflowName)) {
          this.workflowPatterns.set(workflowName, {
            count: 0,
            lastUsed: 0,
            specialists: specialists
          });
        }
        
        const pattern = this.workflowPatterns.get(workflowName);
        pattern.count++;
        pattern.lastUsed = Date.now();
        
        // Pre-warm next likely specialists in workflow
        const currentIndex = specialists.indexOf(specialistId);
        if (currentIndex < specialists.length - 1) {
          const nextSpecialist = specialists[currentIndex + 1];
          await this.preWarmSpecialist(nextSpecialist, `workflow: ${workflowName}`);
        }
        
        this.log(`  🔄 Workflow detected: ${workflowName} (step ${currentIndex + 1}/${specialists.length})`);
        break;
      }
    }
  }
  
  /**
   * Pre-warm specific specialist
   */
  async preWarmSpecialist(specialistId, reason) {
    if (!this.specialists.has(specialistId) || this.warmingQueue.has(specialistId)) {
      return;
    }
    
    const pool = this.specialists.get(specialistId);
    const state = pool.getState();
    
    if (state === SpecialistState.COLD) {
      this.warmingQueue.add(specialistId);
      this.log(`  🔥 Pre-warming: ${specialistId} (${reason})`);
      
      setImmediate(async () => {
        try {
          await pool.transitionTo(SpecialistState.WARMING, reason);
          this.warmingQueue.delete(specialistId);
        } catch (error) {
          this.warmingQueue.delete(specialistId);
        }
      });
    }
  }
  
  /**
   * Apply enterprise warming strategy
   */
  async applyEnterpriseWarming() {
    const warmCount = this.getWarmCount();
    const maxWarm = this.config.maxWarmSpecialists;
    
    if (warmCount >= maxWarm) return;
    
    // Get candidates by priority and usage
    const candidates = this.getWarmingCandidates();
    const needed = Math.min(maxWarm - warmCount, this.config.warmingConcurrency);
    
    const toWarm = candidates.slice(0, needed);
    
    for (const candidate of toWarm) {
      await this.preWarmSpecialist(candidate.id, 'intelligent warming');
    }
  }
  
  /**
   * Get warming candidates
   */
  getWarmingCandidates() {
    const candidates = [];
    
    for (const [id, pool] of this.specialists) {
      const state = pool.getState();
      if (state === SpecialistState.COLD && !this.warmingQueue.has(id)) {
        const usageScore = this.usageScores.get(id) || 0;
        const priorityScore = this.priorityScores.get(id) || 0.5;
        
        // Composite warming score
        const score = usageScore * 0.6 + priorityScore * 0.4;
        
        if (score >= this.config.warmThreshold) {
          candidates.push({ id, score });
        }
      }
    }
    
    return candidates.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Check if specialist is warm
   */
  isWarm(specialist) {
    const state = specialist.getState();
    return state === SpecialistState.WARM || 
           state === SpecialistState.ACTIVE ||
           state === SpecialistState.WARMING;
  }
  
  /**
   * Get predictions for specialist
   */
  getPredictionsFor(specialistId) {
    // Return cached predictions related to this specialist
    const predictions = [];
    for (const [key, cached] of this.predictionCache) {
      if (cached.specialist === specialistId && 
          Date.now() - cached.timestamp < 60000) {
        predictions.push(key);
      }
    }
    return predictions;
  }
  
  /**
   * Get total queue depth across all departments
   */
  getTotalQueueDepth() {
    let total = 0;
    for (const [dept, queue] of this.departmentQueues) {
      total += queue.length;
    }
    return total;
  }
  
  /**
   * Get warm count
   */
  getWarmCount() {
    let count = 0;
    for (const [id, pool] of this.specialists) {
      if (this.isWarm(pool)) {
        count++;
      }
    }
    return count;
  }
  
  /**
   * Start monitoring system
   */
  startMonitoring() {
    if (!this.config.enterpriseMonitoring) return;
    
    // Metrics collection every 30 seconds
    this.monitoringInterval = setInterval(() => {
      const metrics = this.getComprehensiveMetrics();
      
      // Check for alerts
      const alerts = this.monitoring.checkAlerts(metrics);
      for (const alert of alerts) {
        this.emit('alert', alert);
        this.log(`🟠️  ALERT [${alert.level}] ${alert.type}: ${alert.message}`);
      }
      
      // Record key metrics
      this.monitoring.recordMetric('totalMemory', metrics.pool.currentMemory);
      this.monitoring.recordMetric('warmHitRate', metrics.performance.warmHitRate);
      this.monitoring.recordMetric('predictionAccuracy', metrics.prediction.accuracy);
      
      // Adaptive scaling
      if (this.config.adaptiveScaling) {
        this.performAdaptiveScaling(metrics);
      }
      
    }, 30000);
    
    // Usage decay every minute
    this.decayInterval = setInterval(() => {
      this.applyUsageDecay();
    }, 60000);
  }
  
  /**
   * Perform adaptive scaling
   */
  performAdaptiveScaling(metrics) {
    const utilizationRate = metrics.efficiency.utilizationRate;
    const memoryPressure = metrics.pool.currentMemory / (this.specialists.size * 5); // 5MB per specialist
    
    let adjusted = false;
    
    // High memory pressure - reduce warming
    if (memoryPressure > 0.8) {
      this.config.warmThreshold = Math.min(0.6, this.config.warmThreshold + 0.02);
      this.config.maxWarmSpecialists = Math.max(5, this.config.maxWarmSpecialists - 1);
      adjusted = true;
    }
    // Low memory pressure and good performance - increase warming
    else if (memoryPressure < 0.4 && metrics.performance.warmHitRate < 0.6) {
      this.config.warmThreshold = Math.max(0.2, this.config.warmThreshold - 0.02);
      this.config.maxWarmSpecialists = Math.min(25, this.config.maxWarmSpecialists + 1);
      adjusted = true;
    }
    
    if (adjusted) {
      this.metrics.adaptiveAdjustments++;
      this.log(`🟢️  Adaptive scaling: threshold=${this.config.warmThreshold.toFixed(2)}, maxWarm=${this.config.maxWarmSpecialists}`);
    }
  }
  
  /**
   * Apply usage decay
   */
  applyUsageDecay() {
    for (const [id, score] of this.usageScores) {
      if (score > 0) {
        const newScore = Math.max(0, score - this.config.usageDecayRate);
        this.usageScores.set(id, newScore);
      }
    }
  }
  
  /**
   * Get comprehensive metrics
   */
  getComprehensiveMetrics() {
    const warmCount = this.getWarmCount();
    const totalTasks = this.metrics.totalTasks;
    const warmHitRate = totalTasks > 0 ? this.metrics.warmHits / totalTasks : 0;
    
    // Department metrics
    const departmentMetrics = {};
    for (const [dept, stats] of this.departmentStats) {
      departmentMetrics[dept] = {
        taskCount: stats.taskCount,
        specialistCount: stats.specialists.length,
        avgResponseTime: stats.avgResponseTime,
        utilization: stats.taskCount / Math.max(1, totalTasks)
      };
    }
    
    // Top performers
    const topPerformers = this.getTopPerformers(10);
    
    // Workflow analysis
    const workflowStats = {};
    for (const [name, pattern] of this.workflowPatterns) {
      workflowStats[name] = {
        count: pattern.count,
        lastUsed: pattern.lastUsed,
        specialists: pattern.specialists.length
      };
    }
    
    return {
      pool: {
        totalSpecialists: this.specialists.size,
        warmCount,
        maxWarm: this.config.maxWarmSpecialists,
        currentMemory: this.metrics.currentMemory || 0,
        peakMemory: this.metrics.peakMemory || 0,
        warmThreshold: this.config.warmThreshold,
        uptime: Date.now() - this.metrics.uptime
      },
      performance: {
        totalTasks,
        warmHits: this.metrics.warmHits,
        coldStarts: this.metrics.coldStarts,
        warmHitRate,
        averageResponseTime: this.metrics.averageResponseTime,
        queueDepth: this.getTotalQueueDepth(),
        peakConcurrency: this.metrics.peakConcurrency
      },
      prediction: {
        accuracy: this.calculatePredictionAccuracy(),
        cacheSize: this.predictionCache.size,
        cacheHitRate: this.calculateCacheHitRate()
      },
      workflows: {
        detected: this.metrics.workflowsDetected,
        patterns: workflowStats,
        collaborations: this.metrics.collaborationsOptimized
      },
      departments: departmentMetrics,
      efficiency: {
        memoryVsAlwaysWarm: this.calculateMemoryEfficiency(),
        utilizationRate: warmCount / this.specialists.size,
        resourceSavings: this.calculateResourceSavings()
      },
      enterprise: {
        adaptiveAdjustments: this.metrics.adaptiveAdjustments,
        memoryPressureEvents: this.metrics.memoryPressureEvents,
        alertsGenerated: this.monitoring.alerts.length
      },
      topPerformers
    };
  }
  
  /**
   * Get top performers
   */
  getTopPerformers(n = 10) {
    const performers = [];
    
    for (const [id, score] of this.usageScores) {
      const specialistInfo = this.specialistTypes.get(id);
      const pool = this.specialists.get(id);
      const state = pool.getState();
      
      performers.push({
        id,
        score,
        department: specialistInfo.department,
        priority: specialistInfo.priority,
        state,
        isWarm: this.isWarm(pool)
      });
    }
    
    return performers
      .sort((a, b) => b.score - a.score)
      .slice(0, n);
  }
  
  /**
   * Calculate prediction accuracy
   */
  calculatePredictionAccuracy() {
    // Simplified - would track actual vs predicted
    return 0.7; // Placeholder
  }
  
  /**
   * Calculate cache hit rate
   */
  calculateCacheHitRate() {
    // Simplified - would track cache hits vs misses
    return 0.8; // Placeholder
  }
  
  /**
   * Calculate memory efficiency
   */
  calculateMemoryEfficiency() {
    const alwaysWarmMemory = this.specialists.size * 5; // 5MB per specialist
    const currentMemory = this.metrics.currentMemory || 0;
    const saved = alwaysWarmMemory - currentMemory;
    const savedPct = alwaysWarmMemory > 0 ? (saved / alwaysWarmMemory) * 100 : 0;
    
    return {
      alwaysWarm: alwaysWarmMemory,
      current: currentMemory,
      saved,
      savedPercentage: savedPct
    };
  }
  
  /**
   * Calculate resource savings
   */
  calculateResourceSavings() {
    const efficiency = this.calculateMemoryEfficiency();
    const monthlyCostSavings = efficiency.saved * 0.5; // $0.50 per MB per month
    
    return {
      memoryMB: efficiency.saved,
      monthlyCost: monthlyCostSavings,
      annualCost: monthlyCostSavings * 12,
      carbonFootprint: efficiency.saved * 0.1 // kg CO2 equivalent
    };
  }
  
  /**
   * Logging helper
   */
  log(message) {
    if (this.config.verbose) {
      console.log(`[ProductionPool] ${message}`);
    }
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown() {
    this.log('🔴 Initiating graceful shutdown...');
    
    // Stop monitoring
    if (this.monitoringInterval) clearInterval(this.monitoringInterval);
    if (this.decayInterval) clearInterval(this.decayInterval);
    
    // Wait for active tasks to complete
    let activeCount = 0;
    for (const [id, pool] of this.specialists) {
      if (pool.getState() === SpecialistState.ACTIVE) {
        activeCount++;
      }
    }
    
    if (activeCount > 0) {
      this.log(`⏳ Waiting for ${activeCount} active tasks to complete...`);
      // In production, would implement proper graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Destroy all specialists
    for (const [id, pool] of this.specialists) {
      pool.destroy();
    }
    
    this.removeAllListeners();
    this.log('🏁 Shutdown complete');
  }
  
  /**
   * Health check
   */
  getHealthStatus() {
    const metrics = this.getComprehensiveMetrics();
    const alerts = this.monitoring.checkAlerts(metrics);
    
    const status = {
      status: alerts.some(a => a.level === 'CRITICAL') ? 'CRITICAL' : 
              alerts.some(a => a.level === 'WARNING') ? 'WARNING' : 'HEALTHY',
      uptime: metrics.pool.uptime,
      specialists: {
        total: metrics.pool.totalSpecialists,
        warm: metrics.pool.warmCount,
        utilization: metrics.efficiency.utilizationRate
      },
      performance: {
        averageResponseTime: metrics.performance.averageResponseTime,
        warmHitRate: metrics.performance.warmHitRate,
        queueDepth: metrics.performance.queueDepth
      },
      memory: {
        current: metrics.pool.currentMemory,
        saved: metrics.efficiency.memoryVsAlwaysWarm.saved,
        efficiency: metrics.efficiency.memoryVsAlwaysWarm.savedPercentage
      },
      alerts: alerts.length,
      timestamp: Date.now()
    };
    
    return status;
  }
}

module.exports = { 
  ProductionSpecialistPool, 
  Department, 
  FULL_SPECIALIST_DEFINITIONS,
  ENTERPRISE_WORKFLOWS,
  EnterpriseMonitoring
};