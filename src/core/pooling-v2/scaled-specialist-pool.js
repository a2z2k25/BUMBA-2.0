/**
 * Scaled Specialist Pool - Sprint 3
 * Manages 20 specialists with advanced prediction and cross-department collaboration
 * Builds on MultiSpecialistPool foundation
 */

const { EventEmitter } = require('events');
const { SingleSpecialistPool, SpecialistState, MEMORY_BY_STATE } = require('./single-specialist-pool');

/**
 * Department definitions expanded
 */
const Department = {
  BACKEND: 'BACKEND',
  FRONTEND: 'FRONTEND', 
  DATA: 'DATA',
  DEVOPS: 'DEVOPS',
  SECURITY: 'SECURITY'
};

/**
 * Heat levels for usage tracking
 */
const HeatLevel = {
  HOT: 'hot',       // > 0.7 usage score - always keep warm
  WARM: 'warm',     // 0.4-0.7 usage score - warm on demand
  COOL: 'cool',     // 0.2-0.4 usage score - mostly cold
  COLD: 'cold'      // < 0.2 usage score - always cold
};

/**
 * Collaboration patterns
 */
const CollaborationPattern = {
  API_TO_DB: ['api-specialist', 'database-specialist'],
  FRONTEND_TO_API: ['react-specialist', 'api-specialist'],
  ML_PIPELINE: ['data-engineer', 'ml-specialist', 'model-deployer'],
  SECURITY_AUDIT: ['security-scanner', 'vulnerability-analyst'],
  DEPLOYMENT: ['ci-cd-specialist', 'kubernetes-specialist', 'monitoring-specialist']
};

/**
 * Specialist definitions for 20 specialists
 */
const SPECIALIST_DEFINITIONS = [
  // Backend (5)
  { id: 'api-specialist', type: 'api-developer', department: Department.BACKEND },
  { id: 'database-specialist', type: 'database-engineer', department: Department.BACKEND },
  { id: 'microservices-architect', type: 'microservices', department: Department.BACKEND },
  { id: 'graphql-specialist', type: 'graphql-developer', department: Department.BACKEND },
  { id: 'websocket-specialist', type: 'realtime-engineer', department: Department.BACKEND },
  
  // Frontend (5)
  { id: 'react-specialist', type: 'react-developer', department: Department.FRONTEND },
  { id: 'vue-specialist', type: 'vue-developer', department: Department.FRONTEND },
  { id: 'angular-specialist', type: 'angular-developer', department: Department.FRONTEND },
  { id: 'mobile-specialist', type: 'mobile-developer', department: Department.FRONTEND },
  { id: 'ui-ux-specialist', type: 'ui-ux-designer', department: Department.FRONTEND },
  
  // Data (4)
  { id: 'data-engineer', type: 'data-pipeline', department: Department.DATA },
  { id: 'ml-specialist', type: 'machine-learning', department: Department.DATA },
  { id: 'data-analyst', type: 'analytics', department: Department.DATA },
  { id: 'model-deployer', type: 'ml-ops', department: Department.DATA },
  
  // DevOps (3)
  { id: 'ci-cd-specialist', type: 'ci-cd-engineer', department: Department.DEVOPS },
  { id: 'kubernetes-specialist', type: 'k8s-engineer', department: Department.DEVOPS },
  { id: 'monitoring-specialist', type: 'observability', department: Department.DEVOPS },
  
  // Security (3)
  { id: 'security-scanner', type: 'security-engineer', department: Department.SECURITY },
  { id: 'vulnerability-analyst', type: 'vulnerability-assessment', department: Department.SECURITY },
  { id: 'compliance-specialist', type: 'compliance-auditor', department: Department.SECURITY }
];

/**
 * Advanced prediction engine
 */
class PredictionEngine {
  constructor() {
    this.sequenceHistory = [];      // Task sequences
    this.transitionMatrix = {};     // Specialist A → B probabilities
    this.timePatterns = {};          // Time-based patterns
    this.collaborationScores = {};  // Collaboration frequency
    this.maxHistorySize = 100;
  }
  
  /**
   * Record task transition
   */
  recordTransition(fromSpecialist, toSpecialist, timestamp) {
    const key = `${fromSpecialist}→${toSpecialist}`;
    this.transitionMatrix[key] = (this.transitionMatrix[key] || 0) + 1;
    
    // Record time pattern
    const hour = new Date(timestamp).getHours();
    const timeKey = `${toSpecialist}@${hour}`;
    this.timePatterns[timeKey] = (this.timePatterns[timeKey] || 0) + 1;
    
    // Update sequence
    this.sequenceHistory.push({
      from: fromSpecialist,
      to: toSpecialist,
      timestamp
    });
    
    // Trim history
    if (this.sequenceHistory.length > this.maxHistorySize) {
      this.sequenceHistory.shift();
    }
  }
  
  /**
   * Predict next specialists (returns top N)
   */
  predictNext(currentSpecialist, topN = 3) {
    const predictions = [];
    
    // Get transition probabilities
    for (const [key, count] of Object.entries(this.transitionMatrix)) {
      if (key.startsWith(`${currentSpecialist}→`)) {
        const nextSpecialist = key.split('→')[1];
        predictions.push({
          specialist: nextSpecialist,
          probability: count,
          reason: 'transition_pattern'
        });
      }
    }
    
    // Sort by probability and return top N
    predictions.sort((a, b) => b.probability - a.probability);
    return predictions.slice(0, topN);
  }
  
  /**
   * Detect collaboration patterns
   */
  detectCollaboration(recentTasks) {
    const patterns = [];
    
    for (const [name, sequence] of Object.entries(CollaborationPattern)) {
      let matchCount = 0;
      
      // Check if recent tasks match this pattern
      for (let i = 0; i < recentTasks.length - sequence.length + 1; i++) {
        const taskSlice = recentTasks.slice(i, i + sequence.length);
        const specialists = taskSlice.map(t => t.specialistId);
        
        if (this.sequenceMatches(specialists, sequence)) {
          matchCount++;
        }
      }
      
      if (matchCount > 0) {
        patterns.push({
          pattern: name,
          matches: matchCount,
          nextLikely: sequence
        });
      }
    }
    
    return patterns;
  }
  
  /**
   * Check if sequence matches pattern
   */
  sequenceMatches(actual, pattern) {
    if (actual.length !== pattern.length) return false;
    
    for (let i = 0; i < pattern.length; i++) {
      if (actual[i] !== pattern[i]) return false;
    }
    return true;
  }
  
  /**
   * Get time-based predictions
   */
  getTimeBasedPredictions(currentHour) {
    const predictions = [];
    
    for (const [key, count] of Object.entries(this.timePatterns)) {
      const [specialist, hour] = key.split('@');
      if (parseInt(hour) === currentHour) {
        predictions.push({
          specialist,
          score: count,
          reason: 'time_pattern'
        });
      }
    }
    
    return predictions.sort((a, b) => b.score - a.score);
  }
}

/**
 * Scaled Specialist Pool - Manages 20 specialists
 */
class ScaledSpecialistPool extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      maxSpecialists: config.maxSpecialists || 20,
      maxWarmSpecialists: config.maxWarmSpecialists || 4,  // 20% warm
      cooldownTime: config.cooldownTime || 30000,
      usageDecayRate: config.usageDecayRate || 0.05,      // Slower decay for more specialists
      warmThreshold: config.warmThreshold || 0.35,        // Slightly lower threshold
      predictionWindow: config.predictionWindow || 10,    // Larger window
      collaborationDetection: config.collaborationDetection !== false,
      adaptiveWarming: config.adaptiveWarming !== false,
      verbose: config.verbose !== false
    };
    
    // Specialist pools
    this.specialists = new Map();
    this.specialistTypes = new Map();
    
    // Usage tracking
    this.usageScores = new Map();
    this.usageHistory = [];
    this.departmentUsage = new Map();
    this.lastAccessTime = new Map();
    
    // Heat tracking
    this.heatLevels = new Map();
    this.heatHistory = new Map(); // Track heat changes over time
    
    // Prediction
    this.predictionEngine = new PredictionEngine();
    this.lastPredictions = [];
    this.predictionAccuracy = { correct: 0, total: 0 };
    
    // Performance optimization
    this.taskQueue = [];
    this.processingTask = false;
    this.warmingQueue = new Set();
    
    // Metrics
    this.metrics = {
      totalTasks: 0,
      warmHits: 0,
      coldStarts: 0,
      collaborationDetected: 0,
      predictionsUsed: 0,
      queueDepth: 0,
      averageQueueTime: 0,
      peakMemoryUsage: 0,
      currentMemoryUsage: 0
    };
    
    // Initialize
    this.initializeSpecialists();
    this.startDecayTimer();
    this.startAdaptiveWarming();
    
    this.log(`🟢 ScaledSpecialistPool initialized with ${this.config.maxSpecialists} specialists`);
  }
  
  /**
   * Initialize all 20 specialists
   */
  initializeSpecialists() {
    const specialistsToCreate = SPECIALIST_DEFINITIONS.slice(0, this.config.maxSpecialists);
    
    for (const spec of specialistsToCreate) {
      const pool = new SingleSpecialistPool({
        specialistType: spec.type,
        department: spec.department,
        cooldownTime: this.config.cooldownTime,
        verbose: false
      });
      
      // Listen to state changes
      pool.on('stateChanged', (event) => {
        this.handleSpecialistStateChange(spec.id, event);
      });
      
      this.specialists.set(spec.id, pool);
      this.specialistTypes.set(spec.id, {
        type: spec.type,
        department: spec.department
      });
      
      // Initialize tracking
      this.usageScores.set(spec.id, 0);
      this.heatLevels.set(spec.id, HeatLevel.COLD);
      this.lastAccessTime.set(spec.id, 0);
      this.heatHistory.set(spec.id, []);
    }
    
    // Initialize department usage
    for (const dept of Object.values(Department)) {
      this.departmentUsage.set(dept, 0);
    }
    
    this.log(`  Initialized ${specialistsToCreate.length} specialists across ${Object.keys(Department).length} departments`);
  }
  
  /**
   * Handle specialist state change
   */
  handleSpecialistStateChange(specialistId, event) {
    this.emit('specialist:stateChanged', {
      specialistId,
      ...event
    });
    
    this.updateMemoryUsage();
  }
  
  /**
   * Update memory usage metrics
   */
  updateMemoryUsage() {
    let totalMemory = 0;
    for (const [id, pool] of this.specialists) {
      totalMemory += pool.metrics.memoryUsage;
    }
    
    this.metrics.currentMemoryUsage = totalMemory;
    if (totalMemory > this.metrics.peakMemoryUsage) {
      this.metrics.peakMemoryUsage = totalMemory;
    }
  }
  
  /**
   * Execute task with intelligent routing and prediction
   */
  async executeTask(task) {
    const startTime = Date.now();
    this.metrics.totalTasks++;
    
    // Add to queue if processing
    if (this.processingTask && this.taskQueue.length < 10) {
      return this.queueTask(task);
    }
    
    this.processingTask = true;
    
    try {
      // Select specialist
      const selectedId = await this.selectSpecialist(task);
      
      if (!selectedId) {
        throw new Error(`No specialist available for task type: ${task.type || 'generic'}`);
      }
      
      const specialist = this.specialists.get(selectedId);
      const specialistInfo = this.specialistTypes.get(selectedId);
      
      if (!specialist) {
        throw new Error(`Specialist not found: ${selectedId}`);
      }
      
      this.log(`\n📋 Task: ${task.type || 'generic'} → ${selectedId}`);
      
      // Check warm status
      const currentState = specialist.getState();
      const wasWarm = currentState === SpecialistState.WARM || 
                      currentState === SpecialistState.ACTIVE;
      
      // Track for predictions
      if (this.lastAccessTime.get(selectedId) > 0) {
        const lastSpecialist = this.getLastUsedSpecialist();
        if (lastSpecialist && lastSpecialist !== selectedId) {
          this.predictionEngine.recordTransition(lastSpecialist, selectedId, Date.now());
        }
      }
      
      // Execute task
      const result = await specialist.executeTask(task);
      
      // Update tracking
      this.updateUsageScore(selectedId, 0.5); // Moderate increment
      this.recordUsage(selectedId, task);
      this.lastAccessTime.set(selectedId, Date.now());
      
      // Update department usage
      this.departmentUsage.set(
        specialistInfo.department,
        (this.departmentUsage.get(specialistInfo.department) || 0) + 1
      );
      
      // Track metrics
      if (wasWarm) {
        this.metrics.warmHits++;
      } else {
        this.metrics.coldStarts++;
      }
      
      // Check predictions
      this.evaluatePredictions(selectedId);
      
      // Detect collaboration patterns
      if (this.config.collaborationDetection) {
        const patterns = this.predictionEngine.detectCollaboration(
          this.usageHistory.slice(-10)
        );
        if (patterns.length > 0) {
          this.metrics.collaborationDetected++;
          await this.preWarmCollaborators(patterns[0]);
        }
      }
      
      // Make new predictions
      const predictions = this.predictionEngine.predictNext(selectedId, 3);
      this.lastPredictions = predictions;
      
      // Apply warming strategy
      await this.applyIntelligentWarming();
      
      // Process queue if any
      if (this.taskQueue.length > 0) {
        const nextTask = this.taskQueue.shift();
        setImmediate(() => this.executeTask(nextTask));
      } else {
        this.processingTask = false;
      }
      
      return {
        ...result,
        poolStats: {
          selectedSpecialist: selectedId,
          wasWarm,
          totalMemory: this.metrics.currentMemoryUsage,
          warmCount: this.getWarmCount(),
          queueDepth: this.taskQueue.length,
          predictions: predictions.map(p => p.specialist)
        }
      };
      
    } catch (error) {
      this.processingTask = false;
      throw error;
    }
  }
  
  /**
   * Queue task for later processing
   */
  async queueTask(task) {
    return new Promise((resolve) => {
      this.taskQueue.push({ task, resolve, queueTime: Date.now() });
      this.metrics.queueDepth = this.taskQueue.length;
      this.log(`  ⏳ Task queued (depth: ${this.taskQueue.length})`);
    });
  }
  
  /**
   * Select specialist with advanced logic
   */
  async selectSpecialist(task) {
    // Priority 1: Explicit specialist request
    if (task.specialistId) {
      return task.specialistId;
    }
    
    // Priority 2: Department-based selection
    if (task.department) {
      const departmentSpecialists = [];
      for (const [id, info] of this.specialistTypes) {
        if (info.department === task.department) {
          departmentSpecialists.push(id);
        }
      }
      
      if (departmentSpecialists.length > 0) {
        // Select warmest specialist in department
        return this.selectWarmest(departmentSpecialists);
      }
    }
    
    // Priority 3: Type-based mapping
    if (task.type) {
      const mappedId = this.mapTaskTypeToSpecialist(task.type);
      if (mappedId) return mappedId;
    }
    
    // Priority 4: Use predictions if available
    if (this.lastPredictions.length > 0) {
      const predicted = this.lastPredictions[0].specialist;
      if (this.specialists.has(predicted)) {
        this.metrics.predictionsUsed++;
        return predicted;
      }
    }
    
    // Priority 5: Select least recently used
    return this.selectLeastRecentlyUsed();
  }
  
  /**
   * Select warmest specialist from list
   */
  selectWarmest(specialistIds) {
    let warmestId = specialistIds[0];
    let warmestState = SpecialistState.COLD;
    
    for (const id of specialistIds) {
      const pool = this.specialists.get(id);
      const state = pool.getState();
      
      if (state === SpecialistState.WARM || state === SpecialistState.ACTIVE) {
        return id; // Return immediately if warm
      }
      
      if (state === SpecialistState.WARMING && warmestState === SpecialistState.COLD) {
        warmestId = id;
        warmestState = state;
      }
    }
    
    return warmestId;
  }
  
  /**
   * Map task type to specialist
   */
  mapTaskTypeToSpecialist(taskType) {
    const typeMap = {
      // Backend
      'api': 'api-specialist',
      'rest': 'api-specialist',
      'database': 'database-specialist',
      'sql': 'database-specialist',
      'microservice': 'microservices-architect',
      'graphql': 'graphql-specialist',
      'websocket': 'websocket-specialist',
      'realtime': 'websocket-specialist',
      
      // Frontend
      'react': 'react-specialist',
      'vue': 'vue-specialist',
      'angular': 'angular-specialist',
      'mobile': 'mobile-specialist',
      'ui': 'ui-ux-specialist',
      'ux': 'ui-ux-specialist',
      
      // Data
      'etl': 'data-engineer',
      'pipeline': 'data-engineer',
      'ml': 'ml-specialist',
      'ai': 'ml-specialist',
      'analytics': 'data-analyst',
      'mlops': 'model-deployer',
      
      // DevOps
      'ci': 'ci-cd-specialist',
      'cd': 'ci-cd-specialist',
      'kubernetes': 'kubernetes-specialist',
      'k8s': 'kubernetes-specialist',
      'monitoring': 'monitoring-specialist',
      'observability': 'monitoring-specialist',
      
      // Security
      'security': 'security-scanner',
      'vulnerability': 'vulnerability-analyst',
      'compliance': 'compliance-specialist',
      'audit': 'compliance-specialist'
    };
    
    const mappedId = typeMap[taskType.toLowerCase()];
    // Check if the mapped specialist actually exists
    if (mappedId && this.specialists.has(mappedId)) {
      return mappedId;
    }
    return null;
  }
  
  /**
   * Select least recently used specialist
   */
  selectLeastRecentlyUsed() {
    let oldestId = null;
    let oldestTime = Infinity;
    
    for (const [id, time] of this.lastAccessTime) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestId = id;
      }
    }
    
    // If no specialist found, return the first available one
    if (!oldestId && this.specialists.size > 0) {
      oldestId = this.specialists.keys().next().value;
    }
    
    return oldestId;
  }
  
  /**
   * Get last used specialist
   */
  getLastUsedSpecialist() {
    let latestId = null;
    let latestTime = 0;
    
    for (const [id, time] of this.lastAccessTime) {
      if (time > latestTime) {
        latestTime = time;
        latestId = id;
      }
    }
    
    return latestId;
  }
  
  /**
   * Update usage score with bounds
   */
  updateUsageScore(specialistId, increment) {
    const currentScore = this.usageScores.get(specialistId) || 0;
    const newScore = Math.min(1.0, currentScore + increment);
    this.usageScores.set(specialistId, newScore);
    
    // Update heat level
    this.updateHeatLevel(specialistId);
  }
  
  /**
   * Update heat level
   */
  updateHeatLevel(specialistId) {
    const score = this.usageScores.get(specialistId) || 0;
    let heatLevel;
    
    if (score > 0.7) {
      heatLevel = HeatLevel.HOT;
    } else if (score > 0.4) {
      heatLevel = HeatLevel.WARM;
    } else if (score > 0.2) {
      heatLevel = HeatLevel.COOL;
    } else {
      heatLevel = HeatLevel.COLD;
    }
    
    const previousLevel = this.heatLevels.get(specialistId);
    if (previousLevel !== heatLevel) {
      this.heatLevels.set(specialistId, heatLevel);
      
      // Track heat history
      const history = this.heatHistory.get(specialistId) || [];
      history.push({ level: heatLevel, timestamp: Date.now() });
      if (history.length > 10) history.shift();
      this.heatHistory.set(specialistId, history);
      
      this.log(`  🟠️ ${specialistId}: ${previousLevel} → ${heatLevel} (${score.toFixed(2)})`)
    }
  }
  
  /**
   * Record usage
   */
  recordUsage(specialistId, task) {
    const record = {
      timestamp: Date.now(),
      specialistId,
      task: task.type || 'unknown',
      department: this.specialistTypes.get(specialistId).department
    };
    
    this.usageHistory.push(record);
    
    // Keep bounded history
    if (this.usageHistory.length > 100) {
      this.usageHistory.shift();
    }
  }
  
  /**
   * Evaluate prediction accuracy
   */
  evaluatePredictions(actualSpecialist) {
    if (this.lastPredictions.length > 0) {
      this.predictionAccuracy.total++;
      
      const predicted = this.lastPredictions.map(p => p.specialist);
      if (predicted.includes(actualSpecialist)) {
        this.predictionAccuracy.correct++;
      }
    }
  }
  
  /**
   * Pre-warm collaborators
   */
  async preWarmCollaborators(pattern) {
    this.log(`  🤝 Collaboration detected: ${pattern.pattern}`);
    
    for (const specialistId of pattern.nextLikely) {
      if (this.specialists.has(specialistId)) {
        const pool = this.specialists.get(specialistId);
        const state = pool.getState();
        
        if (state === SpecialistState.COLD && !this.warmingQueue.has(specialistId)) {
          this.warmingQueue.add(specialistId);
          this.log(`    Pre-warming collaborator: ${specialistId}`);
          
          // Warm asynchronously
          setImmediate(async () => {
            try {
              await pool.transitionTo(SpecialistState.WARMING, 'collaboration pre-warming');
              this.warmingQueue.delete(specialistId);
            } catch (error) {
              this.warmingQueue.delete(specialistId);
            }
          });
        }
      }
    }
  }
  
  /**
   * Apply intelligent warming strategy
   */
  async applyIntelligentWarming() {
    // Get current warm count
    const warmCount = this.getWarmCount();
    
    // Sort specialists by heat
    const specialistsByHeat = Array.from(this.specialists.keys()).sort((a, b) => {
      const scoreA = this.usageScores.get(a) || 0;
      const scoreB = this.usageScores.get(b) || 0;
      return scoreB - scoreA;
    });
    
    // Determine who should be warm
    const shouldBeWarm = specialistsByHeat
      .filter(id => {
        const score = this.usageScores.get(id) || 0;
        return score >= this.config.warmThreshold;
      })
      .slice(0, this.config.maxWarmSpecialists);
    
    // Add predicted specialists if room
    if (shouldBeWarm.length < this.config.maxWarmSpecialists && this.lastPredictions.length > 0) {
      for (const prediction of this.lastPredictions) {
        if (!shouldBeWarm.includes(prediction.specialist) && 
            shouldBeWarm.length < this.config.maxWarmSpecialists) {
          shouldBeWarm.push(prediction.specialist);
        }
      }
    }
    
    // Warm up hot specialists
    for (const id of shouldBeWarm) {
      const pool = this.specialists.get(id);
      const state = pool.getState();
      
      if (state === SpecialistState.COLD && !this.warmingQueue.has(id)) {
        this.warmingQueue.add(id);
        
        setImmediate(async () => {
          try {
            await pool.transitionTo(SpecialistState.WARMING, 'intelligent warming');
            this.warmingQueue.delete(id);
          } catch (error) {
            this.warmingQueue.delete(id);
          }
        });
      }
    }
  }
  
  /**
   * Apply usage decay
   */
  applyUsageDecay() {
    const now = Date.now();
    
    for (const [id, score] of this.usageScores) {
      if (score > 0) {
        // Decay based on time since last access
        const lastAccess = this.lastAccessTime.get(id) || 0;
        const timeSinceAccess = now - lastAccess;
        const decayFactor = Math.min(1, timeSinceAccess / 60000); // Max decay after 1 minute
        
        const decayAmount = this.config.usageDecayRate * decayFactor;
        const newScore = Math.max(0, score - decayAmount);
        this.usageScores.set(id, newScore);
      }
    }
    
    // Update all heat levels
    for (const [id] of this.specialists) {
      this.updateHeatLevel(id);
    }
  }
  
  /**
   * Start decay timer
   */
  startDecayTimer() {
    this.decayInterval = setInterval(() => {
      this.applyUsageDecay();
    }, 30000); // Every 30 seconds for 20 specialists
  }
  
  /**
   * Start adaptive warming
   */
  startAdaptiveWarming() {
    if (!this.config.adaptiveWarming) return;
    
    this.adaptiveInterval = setInterval(() => {
      // Adjust warming threshold based on memory pressure
      const memoryUsage = this.metrics.currentMemoryUsage;
      const maxMemory = this.config.maxSpecialists * MEMORY_BY_STATE.warm;
      const memoryPressure = memoryUsage / maxMemory;
      
      if (memoryPressure > 0.7) {
        // High memory pressure - raise threshold
        this.config.warmThreshold = Math.min(0.6, this.config.warmThreshold + 0.05);
        this.config.maxWarmSpecialists = Math.max(2, this.config.maxWarmSpecialists - 1);
      } else if (memoryPressure < 0.3) {
        // Low memory pressure - lower threshold
        this.config.warmThreshold = Math.max(0.25, this.config.warmThreshold - 0.05);
        this.config.maxWarmSpecialists = Math.min(6, this.config.maxWarmSpecialists + 1);
      }
    }, 60000); // Every minute
  }
  
  /**
   * Get warm count
   */
  getWarmCount() {
    let count = 0;
    for (const [id, pool] of this.specialists) {
      const state = pool.getState();
      if (state === SpecialistState.WARM || 
          state === SpecialistState.ACTIVE ||
          state === SpecialistState.WARMING) {
        count++;
      }
    }
    return count;
  }
  
  /**
   * Get comprehensive metrics
   */
  getMetrics() {
    const warmCount = this.getWarmCount();
    const warmRate = this.metrics.totalTasks > 0 
      ? this.metrics.warmHits / this.metrics.totalTasks 
      : 0;
    
    const predictionRate = this.predictionAccuracy.total > 0
      ? this.predictionAccuracy.correct / this.predictionAccuracy.total
      : 0;
    
    // Calculate department distribution
    const departmentDistribution = {};
    for (const [dept, count] of this.departmentUsage) {
      departmentDistribution[dept] = count;
    }
    
    // Get heat distribution
    const heatDistribution = {
      [HeatLevel.HOT]: 0,
      [HeatLevel.WARM]: 0,
      [HeatLevel.COOL]: 0,
      [HeatLevel.COLD]: 0
    };
    
    for (const [id, level] of this.heatLevels) {
      heatDistribution[level]++;
    }
    
    return {
      pool: {
        totalSpecialists: this.specialists.size,
        warmCount,
        maxWarm: this.config.maxWarmSpecialists,
        currentMemory: this.metrics.currentMemoryUsage,
        peakMemory: this.metrics.peakMemoryUsage,
        warmThreshold: this.config.warmThreshold
      },
      performance: {
        totalTasks: this.metrics.totalTasks,
        warmHits: this.metrics.warmHits,
        coldStarts: this.metrics.coldStarts,
        warmHitRate: warmRate,
        queueDepth: this.taskQueue.length,
        averageQueueTime: this.metrics.averageQueueTime
      },
      prediction: {
        accuracy: predictionRate,
        totalPredictions: this.predictionAccuracy.total,
        correctPredictions: this.predictionAccuracy.correct,
        predictionsUsed: this.metrics.predictionsUsed,
        collaborationDetected: this.metrics.collaborationDetected
      },
      usage: {
        departmentDistribution,
        heatDistribution,
        topSpecialists: this.getTopSpecialists(5)
      },
      efficiency: {
        memoryVsAlwaysWarm: this.calculateMemoryEfficiency(),
        utilizationRate: warmCount / this.specialists.size
      }
    };
  }
  
  /**
   * Get top specialists by usage
   */
  getTopSpecialists(n) {
    const sorted = Array.from(this.usageScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n);
    
    return sorted.map(([id, score]) => ({
      id,
      score,
      heat: this.heatLevels.get(id),
      department: this.specialistTypes.get(id).department
    }));
  }
  
  /**
   * Calculate memory efficiency
   */
  calculateMemoryEfficiency() {
    const alwaysWarmMemory = this.specialists.size * MEMORY_BY_STATE.warm;
    const currentMemory = this.metrics.currentMemoryUsage;
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
   * Logging helper
   */
  log(message) {
    if (this.config.verbose) {
      console.log(`[ScaledPool] ${message}`);
    }
  }
  
  /**
   * Cleanup
   */
  destroy() {
    clearInterval(this.decayInterval);
    clearInterval(this.adaptiveInterval);
    
    for (const [id, pool] of this.specialists) {
      pool.destroy();
    }
    
    this.removeAllListeners();
    this.log('🔴 ScaledSpecialistPool destroyed');
  }
}

module.exports = { 
  ScaledSpecialistPool, 
  Department, 
  HeatLevel,
  CollaborationPattern,
  SPECIALIST_DEFINITIONS 
};