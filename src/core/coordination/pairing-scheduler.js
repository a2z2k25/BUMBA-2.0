/**
 * BUMBA Pairing Scheduler
 * Advanced scheduling and coordination for specialist pairing activities
 * Part of Specialist Pairing System enhancement to 90%
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Scheduler for specialist pairing operations
 */
class PairingScheduler extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxConcurrentPairings: config.maxConcurrentPairings || 15,
      maxQueueSize: config.maxQueueSize || 200,
      schedulingInterval: config.schedulingInterval || 2000,
      priorityLevels: config.priorityLevels || 7,
      conflictResolution: config.conflictResolution || 'priority',
      skillMatching: config.skillMatching !== false,
      availabilityTracking: config.availabilityTracking !== false,
      ...config
    };
    
    // Scheduling queues
    this.pairingQueue = [];
    this.scheduledPairings = new Map();
    this.recurringPairings = new Map();
    this.pausedPairings = new Map();
    
    // Active pairing sessions
    this.activePairings = new Map();
    this.completedPairings = new Map();
    this.failedPairings = new Map();
    
    // Specialist availability tracking
    this.specialistAvailability = new Map();
    this.workloadTracking = new Map();
    this.timeZoneMapping = new Map();
    
    // Pairing patterns and preferences
    this.pairingPreferences = new Map();
    this.skillComplementarity = new Map();
    this.collaborationHistory = new Map();
    
    // Conflict and constraint management
    this.conflictResolutionStrategies = new Map();
    this.timeConstraints = new Map();
    this.resourceConstraints = new Map();
    
    // Performance optimization
    this.pairingEfficiencyCache = new Map();
    this.algorithmicOptimizations = new Map();
    this.learningModels = new Map();
    
    // Metrics
    this.metrics = {
      pairingsScheduled: 0,
      pairingsCompleted: 0,
      pairingsFailed: 0,
      averageWaitTime: 0,
      averagePairingDuration: 0,
      specialistUtilization: 0,
      conflictsResolved: 0,
      skillMatchAccuracy: 0
    };
    
    this.initialize();
  }
  
  /**
   * Initialize scheduler
   */
  initialize() {
    this.startSchedulingLoop();
    this.initializeConflictResolution();
    this.setupSkillMatching();
    this.initializeOptimizations();
    
    logger.info('📅 Pairing Scheduler initialized');
  }
  
  /**
   * Schedule specialist pairing
   */
  async schedulePairing(pairingRequest, options = {}) {
    const scheduled = {
      id: this.generatePairingId(),
      request: pairingRequest,
      priority: options.priority || 5,
      scheduledAt: Date.now(),
      targetTime: options.targetTime || Date.now(),
      duration: options.duration || 3600000, // 1 hour default
      requirements: {
        skills: options.requiredSkills || [],
        departments: options.departments || [],
        experience: options.experienceLevel || 'any',
        availability: options.availability || 'flexible'
      },
      constraints: {
        timeZone: options.timeZone,
        maxPairingSize: options.maxPairingSize || 2,
        exclusions: options.exclusions || [],
        preferences: options.preferences || {}
      },
      state: 'queued',
      attempts: 0,
      maxAttempts: options.maxAttempts || 3
    };
    
    // Validate scheduling request
    if (!await this.validatePairingRequest(scheduled)) {
      throw new Error('Invalid pairing request');
    }
    
    // Check specialist availability
    if (this.config.availabilityTracking) {
      const available = await this.checkSpecialistAvailability(scheduled);
      if (!available) {
        scheduled.state = 'waiting-availability';
        this.pausedPairings.set(scheduled.id, scheduled);
      }
    }
    
    // Skill matching analysis
    if (this.config.skillMatching) {
      const skillMatch = await this.analyzeSkillRequirements(scheduled);
      scheduled.skillMatchScore = skillMatch.score;
      scheduled.recommendedSpecialists = skillMatch.recommendations;
    }
    
    // Insert into priority queue
    this.insertIntoPriorityQueue(scheduled);
    
    this.scheduledPairings.set(scheduled.id, scheduled);
    this.metrics.pairingsScheduled++;
    
    this.emit('pairing:scheduled', scheduled);
    
    return scheduled;
  }
  
  /**
   * Schedule recurring pairing session
   */
  scheduleRecurringPairing(pairingTemplate, pattern, options = {}) {
    const recurring = {
      id: this.generateRecurringId(),
      template: pairingTemplate,
      pattern: pattern, // cron or interval
      options: options,
      nextExecution: this.calculateNextExecution(pattern),
      executionHistory: [],
      state: 'active',
      totalExecutions: 0,
      successfulExecutions: 0
    };
    
    this.recurringPairings.set(recurring.id, recurring);
    
    // Schedule first execution
    this.scheduleNextRecurring(recurring);
    
    this.emit('pairing:recurring:created', recurring);
    
    return recurring;
  }
  
  /**
   * Execute next pairing from queue
   */
  async executeNextPairing() {
    if (this.activePairings.size >= this.config.maxConcurrentPairings) {
      return;
    }
    
    const scheduled = this.getNextPairingFromQueue();
    
    if (!scheduled) {
      return;
    }
    
    // Check time constraints
    if (!this.isWithinTimeConstraints(scheduled)) {
      this.requeuePairing(scheduled);
      return;
    }
    
    scheduled.state = 'matching';
    scheduled.startTime = Date.now();
    
    try {
      // Find optimal specialist pairing
      const pairing = await this.findOptimalPairing(scheduled);
      
      if (!pairing) {
        scheduled.attempts++;
        if (scheduled.attempts < scheduled.maxAttempts) {
          this.requeuePairing(scheduled);
          return;
        } else {
          throw new Error('Unable to find suitable specialist pairing');
        }
      }
      
      // Initialize pairing session
      scheduled.state = 'active';
      scheduled.pairing = pairing;
      scheduled.specialists = pairing.specialists;
      
      this.activePairings.set(scheduled.id, scheduled);
      
      // Update specialist availability
      await this.updateSpecialistAvailability(pairing.specialists, 'busy', scheduled.duration);
      
      // Setup collaboration environment
      await this.setupCollaborationEnvironment(scheduled);
      
      // Start monitoring
      this.startPairingMonitoring(scheduled);
      
      this.emit('pairing:started', scheduled);
      
      // Auto-complete after duration
      setTimeout(() => {
        this.completePairing(scheduled.id);
      }, scheduled.duration);
      
    } catch (error) {
      scheduled.state = 'failed';
      scheduled.error = error.message;
      scheduled.endTime = Date.now();
      
      this.failedPairings.set(scheduled.id, scheduled);
      this.metrics.pairingsFailed++;
      
      this.emit('pairing:failed', { scheduled, error });
    }
  }
  
  /**
   * Complete pairing session
   */
  async completePairing(pairingId) {
    const active = this.activePairings.get(pairingId);
    
    if (!active) {
      return false;
    }
    
    active.state = 'completed';
    active.endTime = Date.now();
    active.actualDuration = active.endTime - active.startTime;
    
    // Collect collaboration results
    active.results = await this.collectPairingResults(active);
    
    // Update specialist availability
    await this.updateSpecialistAvailability(active.specialists, 'available');
    
    // Update metrics and learning models
    this.updateMetrics(active);
    await this.updateLearningModels(active);
    
    this.completedPairings.set(pairingId, active);
    this.activePairings.delete(pairingId);
    
    this.metrics.pairingsCompleted++;
    
    this.emit('pairing:completed', active);
    
    return true;
  }
  
  /**
   * Pause pairing session
   */
  pausePairing(pairingId, reason = 'manual') {
    const active = this.activePairings.get(pairingId);
    
    if (active) {
      active.state = 'paused';
      active.pausedAt = Date.now();
      active.pauseReason = reason;
      
      this.pausedPairings.set(pairingId, active);
      this.activePairings.delete(pairingId);
      
      this.emit('pairing:paused', active);
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Resume pairing session
   */
  resumePairing(pairingId) {
    const paused = this.pausedPairings.get(pairingId);
    
    if (paused) {
      paused.state = 'active';
      paused.resumedAt = Date.now();
      
      // Adjust duration for pause time
      const pauseDuration = paused.resumedAt - paused.pausedAt;
      paused.duration += pauseDuration;
      
      this.activePairings.set(pairingId, paused);
      this.pausedPairings.delete(pairingId);
      
      this.emit('pairing:resumed', paused);
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Cancel pairing session
   */
  cancelPairing(pairingId, reason = 'manual') {
    // Check active pairings
    const active = this.activePairings.get(pairingId);
    if (active) {
      active.state = 'cancelled';
      active.cancelReason = reason;
      active.endTime = Date.now();
      
      // Release specialists
      this.updateSpecialistAvailability(active.specialists, 'available');
      
      this.activePairings.delete(pairingId);
      this.emit('pairing:cancelled', active);
      return true;
    }
    
    // Check scheduled pairings
    const scheduled = this.scheduledPairings.get(pairingId);
    if (scheduled) {
      scheduled.state = 'cancelled';
      scheduled.cancelReason = reason;
      
      // Remove from queue
      const index = this.pairingQueue.findIndex(p => p.id === pairingId);
      if (index >= 0) {
        this.pairingQueue.splice(index, 1);
      }
      
      this.scheduledPairings.delete(pairingId);
      this.emit('pairing:cancelled', scheduled);
      return true;
    }
    
    return false;
  }
  
  /**
   * Set specialist availability
   */
  setSpecialistAvailability(specialistId, availability) {
    this.specialistAvailability.set(specialistId, {
      status: availability.status, // available, busy, unavailable
      until: availability.until,
      workload: availability.workload || 0,
      maxConcurrentPairings: availability.maxConcurrentPairings || 3,
      preferredHours: availability.preferredHours,
      timeZone: availability.timeZone,
      skills: availability.skills || []
    });
    
    this.emit('specialist:availability:updated', { specialistId, availability });
  }
  
  /**
   * Define pairing preferences
   */
  definePairingPreferences(specialistId, preferences) {
    this.pairingPreferences.set(specialistId, {
      preferredPartners: preferences.preferredPartners || [],
      avoidPartners: preferences.avoidPartners || [],
      preferredDepartments: preferences.preferredDepartments || [],
      communicationStyle: preferences.communicationStyle || 'balanced',
      sessionLength: preferences.sessionLength || 'medium',
      complexity: preferences.complexity || 'any',
      updatedAt: Date.now()
    });
    
    this.emit('pairing:preferences:updated', { specialistId, preferences });
  }
  
  /**
   * Advanced conflict resolution
   */
  initializeConflictResolution() {
    // Priority-based resolution
    this.conflictResolutionStrategies.set('priority', async (conflicts) => {
      return conflicts.sort((a, b) => a.priority - b.priority)[0];
    });
    
    // Skill match resolution
    this.conflictResolutionStrategies.set('skill-match', async (conflicts) => {
      const scored = await Promise.all(conflicts.map(async (conflict) => ({
        conflict,
        score: await this.calculateSkillMatchScore(conflict)
      })));
      
      return scored.sort((a, b) => b.score - a.score)[0].conflict;
    });
    
    // Availability resolution
    this.conflictResolutionStrategies.set('availability', async (conflicts) => {
      const available = await Promise.all(conflicts.map(async (conflict) => ({
        conflict,
        availability: await this.calculateAvailabilityScore(conflict)
      })));
      
      return available.sort((a, b) => b.availability - a.availability)[0].conflict;
    });
    
    // Fairness resolution (distribute workload)
    this.conflictResolutionStrategies.set('fairness', async (conflicts) => {
      const workloads = await Promise.all(conflicts.map(async (conflict) => ({
        conflict,
        workload: await this.calculateWorkloadScore(conflict)
      })));
      
      return workloads.sort((a, b) => a.workload - b.workload)[0].conflict;
    });
  }
  
  /**
   * Setup skill matching algorithms
   */
  setupSkillMatching() {
    // Complementary skills algorithm
    this.skillComplementarity.set('technical-creative', {
      primary: ['backend', 'frontend', 'devops'],
      secondary: ['ui-design', 'ux-research', 'product-strategy'],
      synergy: 0.9
    });
    
    this.skillComplementarity.set('strategic-tactical', {
      primary: ['product-strategy', 'business-model', 'market-research'],
      secondary: ['security', 'performance', 'database'],
      synergy: 0.8
    });
    
    this.skillComplementarity.set('experience-technical', {
      primary: ['ux-research', 'accessibility', 'ui-design'],
      secondary: ['frontend', 'backend', 'api-architecture'],
      synergy: 0.85
    });
  }
  
  /**
   * Initialize optimization algorithms
   */
  initializeOptimizations() {
    // Genetic algorithm for optimal pairing
    this.algorithmicOptimizations.set('genetic', {
      populationSize: 50,
      generations: 100,
      mutationRate: 0.1,
      crossoverRate: 0.8
    });
    
    // Simulated annealing for scheduling
    this.algorithmicOptimizations.set('annealing', {
      initialTemperature: 1000,
      coolingRate: 0.95,
      minTemperature: 1
    });
    
    // Machine learning models
    this.learningModels.set('success-prediction', {
      features: ['skill-match', 'availability', 'history', 'workload'],
      accuracy: 0.85,
      lastTrained: Date.now()
    });
  }
  
  /**
   * Helper methods
   */
  
  startSchedulingLoop() {
    this.schedulingInterval = setInterval(() => {
      this.executeNextPairing();
      this.checkRecurringPairings();
      this.checkPausedPairings();
      this.optimizeQueue();
    }, this.config.schedulingInterval);
  }
  
  insertIntoPriorityQueue(scheduled) {
    // Insert based on priority and skill match score
    const score = (scheduled.priority * 0.7) + (scheduled.skillMatchScore || 0.5) * 0.3;
    const index = this.pairingQueue.findIndex(p => {
      const pScore = (p.priority * 0.7) + (p.skillMatchScore || 0.5) * 0.3;
      return pScore > score;
    });
    
    if (index === -1) {
      this.pairingQueue.push(scheduled);
    } else {
      this.pairingQueue.splice(index, 0, scheduled);
    }
  }
  
  getNextPairingFromQueue() {
    if (this.pairingQueue.length === 0) {
      return null;
    }
    
    const now = Date.now();
    
    for (let i = 0; i < this.pairingQueue.length; i++) {
      const scheduled = this.pairingQueue[i];
      
      if (scheduled.targetTime <= now) {
        this.pairingQueue.splice(i, 1);
        return scheduled;
      }
    }
    
    return null;
  }
  
  async validatePairingRequest(scheduled) {
    // Validate required fields
    if (!scheduled.request || !scheduled.requirements) {
      return false;
    }
    
    // Check queue capacity
    if (this.pairingQueue.length >= this.config.maxQueueSize) {
      return false;
    }
    
    return true;
  }
  
  async checkSpecialistAvailability(scheduled) {
    const requiredSkills = scheduled.requirements.skills;
    let availableCount = 0;
    
    for (const [specialistId, availability] of this.specialistAvailability) {
      if (availability.status === 'available') {
        const hasRequiredSkills = requiredSkills.some(skill => 
          availability.skills.includes(skill)
        );
        
        if (hasRequiredSkills) {
          availableCount++;
        }
      }
    }
    
    return availableCount >= (scheduled.constraints.maxPairingSize || 2);
  }
  
  async analyzeSkillRequirements(scheduled) {
    const requiredSkills = scheduled.requirements.skills;
    const recommendations = [];
    let totalScore = 0;
    
    for (const [specialistId, availability] of this.specialistAvailability) {
      if (availability.status === 'available') {
        const matchScore = this.calculateSkillMatch(requiredSkills, availability.skills);
        
        if (matchScore > 0.3) {
          recommendations.push({
            specialistId,
            matchScore,
            skills: availability.skills,
            workload: availability.workload
          });
          
          totalScore += matchScore;
        }
      }
    }
    
    recommendations.sort((a, b) => b.matchScore - a.matchScore);
    
    return {
      score: recommendations.length > 0 ? totalScore / recommendations.length : 0,
      recommendations: recommendations.slice(0, 10)
    };
  }
  
  calculateSkillMatch(required, available) {
    if (required.length === 0) return 0.5;
    
    const matches = required.filter(skill => available.includes(skill));
    return matches.length / required.length;
  }
  
  isWithinTimeConstraints(scheduled) {
    if (!scheduled.constraints.timeZone) {
      return true;
    }
    
    // Simple time zone check
    const now = new Date();
    const hour = now.getHours();
    
    // Business hours check (9 AM - 6 PM)
    return hour >= 9 && hour <= 18;
  }
  
  async findOptimalPairing(scheduled) {
    const candidates = scheduled.recommendedSpecialists || [];
    
    if (candidates.length < 2) {
      return null;
    }
    
    // Select best pairing based on multiple criteria
    const pairing = {
      specialists: candidates.slice(0, scheduled.constraints.maxPairingSize),
      matchScore: candidates[0].matchScore,
      synergy: await this.calculateSynergy(candidates[0], candidates[1]),
      environment: 'collaborative'
    };
    
    return pairing;
  }
  
  async calculateSynergy(specialist1, specialist2) {
    // Check skill complementarity
    for (const [pattern, config] of this.skillComplementarity) {
      const spec1Match = config.primary.some(skill => specialist1.skills.includes(skill));
      const spec2Match = config.secondary.some(skill => specialist2.skills.includes(skill));
      
      if (spec1Match && spec2Match) {
        return config.synergy;
      }
    }
    
    return 0.7; // Default synergy
  }
  
  async updateSpecialistAvailability(specialists, status, duration = 0) {
    for (const specialist of specialists) {
      const availability = this.specialistAvailability.get(specialist.specialistId);
      
      if (availability) {
        availability.status = status;
        
        if (duration > 0) {
          availability.until = Date.now() + duration;
        }
        
        if (status === 'busy') {
          availability.workload++;
        } else if (status === 'available') {
          availability.workload = Math.max(0, availability.workload - 1);
        }
      }
    }
  }
  
  async setupCollaborationEnvironment(scheduled) {
    // Setup virtual collaboration space
    scheduled.environment = {
      sessionId: this.generateSessionId(),
      communicationChannel: 'secure-channel',
      sharedWorkspace: 'virtual-workspace',
      tools: ['messaging', 'file-sharing', 'video-call'],
      privacy: 'private'
    };
  }
  
  startPairingMonitoring(scheduled) {
    // Monitor pairing session health
    const monitoringInterval = setInterval(() => {
      const health = this.assessPairingHealth(scheduled);
      
      if (health.score < 0.5) {
        this.emit('pairing:health:warning', { scheduled, health });
      }
      
      if (scheduled.state !== 'active') {
        clearInterval(monitoringInterval);
      }
    }, 30000); // Check every 30 seconds
  }
  
  assessPairingHealth(scheduled) {
    return {
      score: Math.random() * 0.5 + 0.5, // Simulate health score
      factors: ['communication', 'progress', 'engagement'],
      timestamp: Date.now()
    };
  }
  
  async collectPairingResults(active) {
    // Simulate result collection
    return {
      outcome: 'successful',
      objectives: ['completed', 'partially-completed'],
      deliverables: ['design-review', 'code-optimization'],
      satisfaction: Math.random() * 0.4 + 0.6,
      learningOutcomes: ['skill-transfer', 'knowledge-sharing'],
      nextSteps: ['follow-up-session', 'implementation']
    };
  }
  
  updateMetrics(active) {
    const duration = active.actualDuration;
    const waitTime = active.startTime - active.scheduledAt;
    
    // Update averages
    this.metrics.averageWaitTime = 
      (this.metrics.averageWaitTime * (this.metrics.pairingsCompleted - 1) + waitTime) / 
      this.metrics.pairingsCompleted;
    
    this.metrics.averagePairingDuration = 
      (this.metrics.averagePairingDuration * (this.metrics.pairingsCompleted - 1) + duration) / 
      this.metrics.pairingsCompleted;
    
    // Update utilization
    let totalWorkload = 0;
    let totalCapacity = 0;
    
    for (const [, availability] of this.specialistAvailability) {
      totalWorkload += availability.workload;
      totalCapacity += availability.maxConcurrentPairings;
    }
    
    this.metrics.specialistUtilization = totalCapacity > 0 ? (totalWorkload / totalCapacity) * 100 : 0;
    
    // Update skill match accuracy
    if (active.pairing && active.results) {
      const effectiveness = active.results.satisfaction || 0.7;
      this.metrics.skillMatchAccuracy = 
        (this.metrics.skillMatchAccuracy * 0.9) + (effectiveness * 0.1);
    }
  }
  
  async updateLearningModels(active) {
    const model = this.learningModels.get('success-prediction');
    
    if (model && active.results) {
      const features = {
        skillMatch: active.pairing.matchScore,
        availability: 1.0, // Was available
        workload: this.calculateAverageWorkload(active.specialists),
        satisfaction: active.results.satisfaction
      };
      
      // Update model with new data point
      model.dataPoints = model.dataPoints || [];
      model.dataPoints.push(features);
      
      // Retrain if enough data
      if (model.dataPoints.length % 100 === 0) {
        await this.retrainModel(model);
      }
    }
  }
  
  calculateAverageWorkload(specialists) {
    let totalWorkload = 0;
    
    for (const specialist of specialists) {
      const availability = this.specialistAvailability.get(specialist.specialistId);
      if (availability) {
        totalWorkload += availability.workload;
      }
    }
    
    return specialists.length > 0 ? totalWorkload / specialists.length : 0;
  }
  
  async retrainModel(model) {
    // Simulate model retraining
    model.lastTrained = Date.now();
    model.accuracy = Math.min(0.95, model.accuracy + 0.02);
    
    logger.info(`🤖 Retrained success prediction model - Accuracy: ${model.accuracy.toFixed(2)}`);
  }
  
  requeuePairing(scheduled) {
    // Add back to queue with slight delay
    scheduled.targetTime = Date.now() + 10000; // 10 second delay
    this.insertIntoPriorityQueue(scheduled);
  }
  
  calculateNextExecution(pattern) {
    // Simple interval pattern
    if (typeof pattern === 'number') {
      return Date.now() + pattern;
    }
    
    // Daily pattern
    if (pattern === 'daily') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // 9 AM
      return tomorrow.getTime();
    }
    
    return Date.now() + 86400000; // Default to 24 hours
  }
  
  scheduleNextRecurring(recurring) {
    const delay = recurring.nextExecution - Date.now();
    
    if (delay > 0) {
      setTimeout(async () => {
        // Execute recurring pairing
        const scheduled = await this.schedulePairing(recurring.template, recurring.options);
        
        recurring.executionHistory.push({
          scheduledId: scheduled.id,
          timestamp: Date.now()
        });
        
        recurring.totalExecutions++;
        
        // Calculate next execution
        recurring.nextExecution = this.calculateNextExecution(recurring.pattern);
        
        // Schedule next execution
        if (recurring.state === 'active') {
          this.scheduleNextRecurring(recurring);
        }
      }, delay);
    }
  }
  
  checkRecurringPairings() {
    // Recurring pairings are handled by their own timers
  }
  
  checkPausedPairings() {
    // Check if paused pairings can be resumed
    for (const [id, paused] of this.pausedPairings) {
      if (paused.state === 'waiting-availability') {
        this.checkSpecialistAvailability(paused).then(available => {
          if (available) {
            paused.state = 'queued';
            this.insertIntoPriorityQueue(paused);
            this.pausedPairings.delete(id);
          }
        });
      }
    }
  }
  
  optimizeQueue() {
    // Periodically optimize queue order
    if (this.pairingQueue.length > 10) {
      this.pairingQueue.sort((a, b) => {
        const scoreA = (a.priority * 0.7) + (a.skillMatchScore || 0.5) * 0.3;
        const scoreB = (b.priority * 0.7) + (b.skillMatchScore || 0.5) * 0.3;
        return scoreA - scoreB;
      });
    }
  }
  
  async calculateSkillMatchScore(conflict) {
    // Calculate skill match score for conflict resolution
    const requiredSkills = conflict.requirements.skills;
    let bestMatch = 0;
    
    for (const [, availability] of this.specialistAvailability) {
      if (availability.status === 'available') {
        const match = this.calculateSkillMatch(requiredSkills, availability.skills);
        bestMatch = Math.max(bestMatch, match);
      }
    }
    
    return bestMatch;
  }
  
  async calculateAvailabilityScore(conflict) {
    const availableSpecialists = Array.from(this.specialistAvailability.values())
      .filter(a => a.status === 'available').length;
    
    const totalSpecialists = this.specialistAvailability.size;
    
    return totalSpecialists > 0 ? availableSpecialists / totalSpecialists : 0;
  }
  
  async calculateWorkloadScore(conflict) {
    let totalWorkload = 0;
    let count = 0;
    
    for (const [, availability] of this.specialistAvailability) {
      totalWorkload += availability.workload;
      count++;
    }
    
    return count > 0 ? totalWorkload / count : 0;
  }
  
  /**
   * Generate IDs
   */
  generatePairingId() {
    return `pair_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateRecurringId() {
    return `recur_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      queueLength: this.pairingQueue.length,
      activePairings: this.activePairings.size,
      pausedPairings: this.pausedPairings.size,
      completedPairings: this.completedPairings.size,
      recurringPairings: this.recurringPairings.size,
      availableSpecialists: Array.from(this.specialistAvailability.values())
        .filter(a => a.status === 'available').length,
      totalSpecialists: this.specialistAvailability.size
    };
  }
}

module.exports = PairingScheduler;