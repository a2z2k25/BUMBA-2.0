/**
 * Multi-Specialist Pool - Sprint 2
 * Manages multiple specialists with intelligent warming based on usage patterns
 * Builds on SingleSpecialistPool foundation
 */

const { EventEmitter } = require('events');
const { SingleSpecialistPool, SpecialistState, MEMORY_BY_STATE } = require('./single-specialist-pool');

/**
 * Heat levels for usage tracking
 */
const HeatLevel = {
  HOT: 'hot',       // > 0.7 usage score - keep warm
  WARM: 'warm',     // 0.4-0.7 usage score - warm on demand
  COOL: 'cool',     // 0.2-0.4 usage score - mostly cold
  COLD: 'cold'      // < 0.2 usage score - always cold
};

/**
 * Department types
 */
const Department = {
  BACKEND: 'BACKEND',
  FRONTEND: 'FRONTEND', 
  DATA: 'DATA'
};

/**
 * Multi-Specialist Pool
 */
class MultiSpecialistPool extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      maxSpecialists: config.maxSpecialists || 3,
      maxWarmSpecialists: config.maxWarmSpecialists || 1, // Only keep 1 warm at a time
      cooldownTime: config.cooldownTime || 30000,         // 30 seconds
      usageDecayRate: config.usageDecayRate || 0.1,       // Decay factor per minute
      warmThreshold: config.warmThreshold || 0.4,         // Min score to keep warm
      predictionWindow: config.predictionWindow || 5,     // Look at last 5 tasks
      verbose: config.verbose !== false
    };
    
    // Specialist pools
    this.specialists = new Map(); // id -> SingleSpecialistPool
    this.specialistTypes = new Map(); // id -> { type, department }
    
    // Usage tracking
    this.usageScores = new Map(); // id -> score (0-1)
    this.usageHistory = [];       // Array of { timestamp, specialistId, task }
    this.departmentUsage = new Map(); // department -> usage count
    
    // Heat tracking
    this.heatLevels = new Map(); // id -> HeatLevel
    
    // Prediction state
    this.lastDepartment = null;
    this.taskPatterns = [];
    
    // Metrics
    this.metrics = {
      totalTasks: 0,
      warmHits: 0,
      coldStarts: 0,
      predictedCorrectly: 0,
      predictedIncorrectly: 0,
      totalMemoryUsage: 0,
      peakMemoryUsage: 0,
      averageWarmCount: 0
    };
    
    // Initialize specialists
    this.initializeSpecialists();
    
    // Start decay timer
    this.startUsageDecay();
    
    this.log(`🟢 MultiSpecialistPool initialized with ${this.config.maxSpecialists} specialists`);
  }
  
  /**
   * Initialize specialist pools
   */
  initializeSpecialists() {
    // Create 3 specialists with different types
    const specialists = [
      { 
        id: 'backend-1', 
        type: 'backend-engineer', 
        department: Department.BACKEND 
      },
      { 
        id: 'frontend-1', 
        type: 'frontend-developer', 
        department: Department.FRONTEND 
      },
      { 
        id: 'data-1', 
        type: 'data-scientist', 
        department: Department.DATA 
      }
    ];
    
    for (const spec of specialists.slice(0, this.config.maxSpecialists)) {
      const pool = new SingleSpecialistPool({
        specialistType: spec.type,
        department: spec.department,
        cooldownTime: this.config.cooldownTime,
        verbose: false // We'll handle logging
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
      
      // Initialize usage score
      this.usageScores.set(spec.id, 0);
      this.heatLevels.set(spec.id, HeatLevel.COLD);
      
      // Initialize department usage
      if (!this.departmentUsage.has(spec.department)) {
        this.departmentUsage.set(spec.department, 0);
      }
    }
    
    this.log(`  Initialized: ${specialists.map(s => s.id).join(', ')}`);
  }
  
  /**
   * Handle specialist state change
   */
  handleSpecialistStateChange(specialistId, event) {
    this.emit('specialist:stateChanged', {
      specialistId,
      ...event
    });
    
    // Update total memory usage
    this.updateTotalMemoryUsage();
  }
  
  /**
   * Update total memory usage
   */
  updateTotalMemoryUsage() {
    let totalMemory = 0;
    for (const [id, pool] of this.specialists) {
      totalMemory += pool.metrics.memoryUsage;
    }
    
    this.metrics.totalMemoryUsage = totalMemory;
    if (totalMemory > this.metrics.peakMemoryUsage) {
      this.metrics.peakMemoryUsage = totalMemory;
    }
  }
  
  /**
   * Execute task with intelligent specialist selection
   */
  async executeTask(task) {
    const startTime = Date.now();
    this.metrics.totalTasks++;
    
    // Determine best specialist for task
    const selectedId = this.selectSpecialist(task);
    const specialist = this.specialists.get(selectedId);
    const specialistInfo = this.specialistTypes.get(selectedId);
    
    this.log(`\n📋 Task: ${task.type || 'generic'} → Selected: ${selectedId}`);
    
    // Check if we predicted correctly (was it warm?)
    const wasWarm = specialist.getState() === SpecialistState.WARM || 
                    specialist.getState() === SpecialistState.ACTIVE;
    
    // Execute task
    const result = await specialist.executeTask(task);
    
    // Update usage tracking
    this.updateUsageScore(selectedId, 1.0); // Full point for usage
    this.recordUsage(selectedId, task);
    
    // Update department usage
    this.departmentUsage.set(
      specialistInfo.department,
      (this.departmentUsage.get(specialistInfo.department) || 0) + 1
    );
    
    // Track prediction accuracy
    if (wasWarm) {
      this.metrics.warmHits++;
      this.metrics.predictedCorrectly++;
    } else {
      this.metrics.coldStarts++;
      if (this.shouldHaveBeenWarm(selectedId)) {
        this.metrics.predictedIncorrectly++;
      }
    }
    
    // Update heat levels
    this.updateHeatLevels();
    
    // Apply warming strategy
    await this.applyWarmingStrategy();
    
    // Add pool-level info to result
    return {
      ...result,
      poolStats: {
        selectedSpecialist: selectedId,
        wasWarm,
        totalMemory: this.metrics.totalMemoryUsage,
        warmCount: this.getWarmCount()
      }
    };
  }
  
  /**
   * Select best specialist for task
   */
  selectSpecialist(task) {
    // Simple strategy: match by department/type if specified
    if (task.department) {
      for (const [id, info] of this.specialistTypes) {
        if (info.department === task.department) {
          return id;
        }
      }
    }
    
    if (task.type) {
      // Map task types to specialists
      const typeMapping = {
        'api': 'backend-1',
        'backend': 'backend-1',
        'ui': 'frontend-1',
        'frontend': 'frontend-1',
        'data': 'data-1',
        'ml': 'data-1'
      };
      
      const mappedId = typeMapping[task.type.toLowerCase()];
      if (mappedId && this.specialists.has(mappedId)) {
        return mappedId;
      }
    }
    
    // Fallback: select least recently used
    let selectedId = null;
    let lowestScore = Infinity;
    
    for (const [id, score] of this.usageScores) {
      if (score < lowestScore) {
        lowestScore = score;
        selectedId = id;
      }
    }
    
    return selectedId || 'backend-1'; // Default fallback
  }
  
  /**
   * Update usage score with exponential decay
   */
  updateUsageScore(specialistId, points) {
    const currentScore = this.usageScores.get(specialistId) || 0;
    const newScore = Math.min(1.0, currentScore + points);
    this.usageScores.set(specialistId, newScore);
    
    // Update heat level
    this.updateHeatLevel(specialistId);
  }
  
  /**
   * Update heat level based on usage score
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
      this.log(`  🟠️ Heat level changed: ${specialistId} ${previousLevel} → ${heatLevel} (score: ${score.toFixed(2)})`);
    }
  }
  
  /**
   * Update all heat levels
   */
  updateHeatLevels() {
    for (const [id] of this.specialists) {
      this.updateHeatLevel(id);
    }
  }
  
  /**
   * Record usage for pattern analysis
   */
  recordUsage(specialistId, task) {
    const record = {
      timestamp: Date.now(),
      specialistId,
      task: task.type || 'unknown',
      department: this.specialistTypes.get(specialistId).department
    };
    
    this.usageHistory.push(record);
    
    // Keep only recent history
    const cutoff = Date.now() - 300000; // 5 minutes
    this.usageHistory = this.usageHistory.filter(r => r.timestamp > cutoff);
    
    // Update patterns
    this.taskPatterns.push(record.department);
    if (this.taskPatterns.length > this.config.predictionWindow) {
      this.taskPatterns.shift();
    }
    
    this.lastDepartment = record.department;
  }
  
  /**
   * Apply intelligent warming strategy
   */
  async applyWarmingStrategy() {
    // Get current warm count
    const warmSpecialists = [];
    const coldSpecialists = [];
    
    for (const [id, pool] of this.specialists) {
      const state = pool.getState();
      if (state === SpecialistState.WARM || state === SpecialistState.ACTIVE) {
        warmSpecialists.push(id);
      } else if (state === SpecialistState.COLD) {
        coldSpecialists.push(id);
      }
    }
    
    // Sort specialists by heat level
    const specialistsByHeat = Array.from(this.specialists.keys()).sort((a, b) => {
      const scoreA = this.usageScores.get(a) || 0;
      const scoreB = this.usageScores.get(b) || 0;
      return scoreB - scoreA; // Highest score first
    });
    
    // Determine who should be warm
    const shouldBeWarm = specialistsByHeat
      .filter(id => {
        const score = this.usageScores.get(id) || 0;
        return score >= this.config.warmThreshold;
      })
      .slice(0, this.config.maxWarmSpecialists);
    
    // Warm up hot specialists if needed
    for (const id of shouldBeWarm) {
      const pool = this.specialists.get(id);
      const state = pool.getState();
      
      if (state === SpecialistState.COLD) {
        this.log(`  🔥 Pre-warming HOT specialist: ${id}`);
        await pool.transitionTo(SpecialistState.WARMING, 'heat-based warming');
      }
    }
    
    // Let cool/cold specialists cool down naturally
    // (they have their own cooldown timers)
  }
  
  /**
   * Predict next specialist needed
   */
  predictNextSpecialist() {
    if (this.taskPatterns.length < 2) {
      return null;
    }
    
    // Simple pattern: if last 2 tasks were same department, predict same
    const recent = this.taskPatterns.slice(-2);
    if (recent[0] === recent[1]) {
      for (const [id, info] of this.specialistTypes) {
        if (info.department === recent[0]) {
          return id;
        }
      }
    }
    
    // Otherwise predict based on most common in window
    const counts = {};
    for (const dept of this.taskPatterns) {
      counts[dept] = (counts[dept] || 0) + 1;
    }
    
    let maxDept = null;
    let maxCount = 0;
    for (const [dept, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        maxDept = dept;
      }
    }
    
    if (maxDept) {
      for (const [id, info] of this.specialistTypes) {
        if (info.department === maxDept) {
          return id;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Check if specialist should have been warm
   */
  shouldHaveBeenWarm(specialistId) {
    const score = this.usageScores.get(specialistId) || 0;
    return score >= this.config.warmThreshold;
  }
  
  /**
   * Apply usage decay over time
   */
  applyUsageDecay() {
    for (const [id, score] of this.usageScores) {
      if (score > 0) {
        const decayedScore = Math.max(0, score - this.config.usageDecayRate);
        this.usageScores.set(id, decayedScore);
      }
    }
    
    this.updateHeatLevels();
  }
  
  /**
   * Start usage decay timer
   */
  startUsageDecay() {
    // Apply decay every minute
    this.decayInterval = setInterval(() => {
      this.applyUsageDecay();
    }, 60000);
  }
  
  /**
   * Get warm specialist count
   */
  getWarmCount() {
    let count = 0;
    for (const [id, pool] of this.specialists) {
      const state = pool.getState();
      if (state === SpecialistState.WARM || state === SpecialistState.ACTIVE) {
        count++;
      }
    }
    return count;
  }
  
  /**
   * Get comprehensive metrics
   */
  getMetrics() {
    const individualMetrics = {};
    for (const [id, pool] of this.specialists) {
      individualMetrics[id] = pool.getMetrics();
    }
    
    const warmCount = this.getWarmCount();
    const warmRate = this.metrics.totalTasks > 0 
      ? this.metrics.warmHits / this.metrics.totalTasks 
      : 0;
    
    return {
      pool: {
        totalSpecialists: this.specialists.size,
        warmCount,
        maxWarm: this.config.maxWarmSpecialists,
        currentMemory: this.metrics.totalMemoryUsage,
        peakMemory: this.metrics.peakMemoryUsage
      },
      performance: {
        totalTasks: this.metrics.totalTasks,
        warmHits: this.metrics.warmHits,
        coldStarts: this.metrics.coldStarts,
        warmHitRate: warmRate,
        predictionAccuracy: this.metrics.totalTasks > 0
          ? this.metrics.predictedCorrectly / this.metrics.totalTasks
          : 0
      },
      usage: {
        scores: Object.fromEntries(this.usageScores),
        heatLevels: Object.fromEntries(this.heatLevels),
        departmentUsage: Object.fromEntries(this.departmentUsage)
      },
      specialists: individualMetrics,
      efficiency: {
        memoryVsAlwaysWarm: this.calculateMemoryEfficiency(),
        averageWarmCount: warmCount
      }
    };
  }
  
  /**
   * Calculate memory efficiency vs always-warm strategy
   */
  calculateMemoryEfficiency() {
    const alwaysWarmMemory = this.specialists.size * MEMORY_BY_STATE.warm;
    const currentMemory = this.metrics.totalMemoryUsage;
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
      console.log(`[MultiPool] ${message}`);
    }
  }
  
  /**
   * Cleanup
   */
  destroy() {
    clearInterval(this.decayInterval);
    
    for (const [id, pool] of this.specialists) {
      pool.destroy();
    }
    
    this.removeAllListeners();
    this.log('🔴 MultiSpecialistPool destroyed');
  }
}

module.exports = { MultiSpecialistPool, HeatLevel, Department };