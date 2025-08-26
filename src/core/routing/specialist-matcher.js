/**
 * Specialist Matcher for TTL-Based Routing
 * Matches specialists to tasks based on capabilities, availability, and TTL requirements
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Specialist Capability Definitions
 */
const SPECIALIST_CAPABILITIES = {
  'backend-engineer': {
    skills: ['api', 'database', 'server', 'microservices', 'rest', 'graphql'],
    complexity: { min: 0.3, max: 0.9 },
    ttlTiers: ['FAST', 'STANDARD', 'EXTENDED'],
    departments: ['BACKEND', 'INFRASTRUCTURE'],
    performance: { avgResponseTime: 2000, successRate: 0.92 }
  },
  'frontend-developer': {
    skills: ['ui', 'react', 'vue', 'angular', 'css', 'html', 'javascript'],
    complexity: { min: 0.2, max: 0.8 },
    ttlTiers: ['ULTRA_FAST', 'FAST', 'STANDARD'],
    departments: ['FRONTEND', 'MOBILE'],
    performance: { avgResponseTime: 1500, successRate: 0.94 }
  },
  'database-specialist': {
    skills: ['sql', 'nosql', 'mongodb', 'postgres', 'optimization', 'indexing'],
    complexity: { min: 0.4, max: 1.0 },
    ttlTiers: ['STANDARD', 'EXTENDED'],
    departments: ['BACKEND', 'DATA'],
    performance: { avgResponseTime: 3000, successRate: 0.90 }
  },
  'devops-engineer': {
    skills: ['docker', 'kubernetes', 'ci/cd', 'deployment', 'monitoring', 'aws'],
    complexity: { min: 0.5, max: 0.95 },
    ttlTiers: ['FAST', 'STANDARD', 'EXTENDED'],
    departments: ['INFRASTRUCTURE', 'SECURITY'],
    performance: { avgResponseTime: 2500, successRate: 0.91 }
  },
  'security-specialist': {
    skills: ['security', 'authentication', 'encryption', 'audit', 'compliance'],
    complexity: { min: 0.6, max: 1.0 },
    ttlTiers: ['STANDARD', 'EXTENDED'],
    departments: ['SECURITY', 'INFRASTRUCTURE'],
    performance: { avgResponseTime: 3500, successRate: 0.88 }
  },
  'qa-engineer': {
    skills: ['testing', 'automation', 'quality', 'validation', 'test'],
    complexity: { min: 0.3, max: 0.7 },
    ttlTiers: ['FAST', 'STANDARD'],
    departments: ['QUALITY', 'BACKEND', 'FRONTEND'],
    performance: { avgResponseTime: 2000, successRate: 0.93 }
  }
};

/**
 * Match Score Structure
 */
class MatchScore {
  constructor(specialist, score, factors) {
    this.specialist = specialist;
    this.score = score;
    this.factors = factors;
    this.timestamp = Date.now();
  }
  
  getWeightedScore() {
    return Object.entries(this.factors).reduce((total, [factor, value]) => {
      const weight = SCORING_WEIGHTS[factor] || 0.1;
      return total + (value * weight);
    }, 0);
  }
}

/**
 * Scoring Weights
 */
const SCORING_WEIGHTS = {
  skillMatch: 0.25,
  complexityFit: 0.20,
  availability: 0.20,
  performance: 0.15,
  ttlCompatibility: 0.10,
  departmentMatch: 0.10
};

/**
 * Specialist Pool (Mock)
 */
class SpecialistPool {
  constructor() {
    this.specialists = new Map();
    this.availability = new Map();
    this.performance = new Map();
    
    // Initialize mock specialists
    this.initializeSpecialists();
  }
  
  initializeSpecialists() {
    for (const [type, capabilities] of Object.entries(SPECIALIST_CAPABILITIES)) {
      // Create 3 instances of each type
      for (let i = 1; i <= 3; i++) {
        const id = `${type}-${i}`;
        this.specialists.set(id, {
          id,
          type,
          capabilities,
          state: 'available',
          load: Math.random() * 0.5,
          lastActive: Date.now() - Math.random() * 10000
        });
        
        this.availability.set(id, {
          available: Math.random() > 0.3,
          nextAvailable: Date.now() + Math.random() * 5000,
          currentTasks: Math.floor(Math.random() * 3)
        });
        
        this.performance.set(id, {
          avgResponseTime: capabilities.performance.avgResponseTime * (0.8 + Math.random() * 0.4),
          successRate: capabilities.performance.successRate * (0.9 + Math.random() * 0.1),
          tasksCompleted: Math.floor(Math.random() * 100)
        });
      }
    }
  }
  
  getSpecialist(id) {
    return this.specialists.get(id);
  }
  
  getAvailability(id) {
    return this.availability.get(id);
  }
  
  getPerformance(id) {
    return this.performance.get(id);
  }
  
  getAllByType(type) {
    return Array.from(this.specialists.values()).filter(s => s.type === type);
  }
  
  getAllAvailable() {
    return Array.from(this.specialists.values()).filter(s => {
      const availability = this.availability.get(s.id);
      return availability && availability.available;
    });
  }
}

/**
 * Main Specialist Matcher
 */
class SpecialistMatcher extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      // Matching settings
      minMatchScore: config.minMatchScore || 0.5,
      enableFallback: config.enableFallback !== false,
      maxCandidates: config.maxCandidates || 5,
      
      // Availability settings
      requireAvailable: config.requireAvailable || false,
      maxLoadFactor: config.maxLoadFactor || 0.8,
      reserveCapacity: config.reserveCapacity || 0.2,
      
      // Performance settings
      minSuccessRate: config.minSuccessRate || 0.7,
      maxResponseTime: config.maxResponseTime || 10000,
      
      // Learning settings
      enableLearning: config.enableLearning !== false,
      learningRate: config.learningRate || 0.1,
      historySize: config.historySize || 1000
    };
    
    // Matching state
    this.specialistPool = new SpecialistPool();
    this.matchHistory = [];
    this.matchCache = new Map();
    this.performanceTracking = new Map();
    
    // Statistics
    this.statistics = {
      totalMatches: 0,
      successfulMatches: 0,
      fallbackMatches: 0,
      failedMatches: 0,
      avgMatchScore: 0,
      avgMatchTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    logger.info('🟡 Specialist Matcher initialized');
  }
  
  /**
   * Match specialists to task
   */
  async matchSpecialists(task, requirements = {}) {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(task, requirements);
      const cached = this.matchCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 60000) {
        this.statistics.cacheHits++;
        return cached.matches;
      }
      
      this.statistics.cacheMisses++;
      
      // Perform matching
      const candidates = this.findCandidates(task, requirements);
      const scored = this.scoreCandidates(candidates, task, requirements);
      const filtered = this.filterByRequirements(scored, requirements);
      const ranked = this.rankCandidates(filtered);
      
      // Get top matches
      const matches = ranked.slice(0, this.config.maxCandidates);
      
      // Apply fallback if needed
      if (matches.length === 0 && this.config.enableFallback) {
        const fallback = await this.findFallbackSpecialists(task, requirements);
        matches.push(...fallback);
        this.statistics.fallbackMatches++;
      }
      
      // Cache results
      this.matchCache.set(cacheKey, {
        matches,
        timestamp: Date.now()
      });
      
      // Update statistics
      this.updateStatistics(matches, Date.now() - startTime);
      
      // Record match
      this.recordMatch(task, requirements, matches);
      
      // Emit event
      this.emit('match:completed', {
        task: task.id || 'unknown',
        matchCount: matches.length,
        topScore: matches[0]?.score || 0,
        duration: Date.now() - startTime
      });
      
      return matches;
      
    } catch (error) {
      logger.error('Specialist matching failed:', error);
      this.statistics.failedMatches++;
      return [];
    }
  }
  
  /**
   * Find candidate specialists
   */
  findCandidates(task, requirements) {
    const candidates = [];
    
    // Get task characteristics
    const taskType = this.detectTaskType(task);
    const taskComplexity = task.complexity || 0.5;
    const taskDepartment = task.department || requirements.department;
    
    // Find specialists by type if specified
    if (requirements.specialistType) {
      candidates.push(...this.specialistPool.getAllByType(requirements.specialistType));
    } else if (taskType) {
      // Find by detected type
      for (const [type, capabilities] of Object.entries(SPECIALIST_CAPABILITIES)) {
        if (this.typeMatchesTask(type, taskType)) {
          candidates.push(...this.specialistPool.getAllByType(type));
        }
      }
    } else {
      // Get all available specialists
      candidates.push(...this.specialistPool.getAllAvailable());
    }
    
    // Filter by basic criteria
    return candidates.filter(specialist => {
      const capabilities = specialist.capabilities;
      
      // Check complexity range
      if (taskComplexity < capabilities.complexity.min || 
          taskComplexity > capabilities.complexity.max) {
        return false;
      }
      
      // Check department match
      if (taskDepartment && !capabilities.departments.includes(taskDepartment)) {
        return false;
      }
      
      // Check TTL tier compatibility
      if (requirements.ttlTier && !capabilities.ttlTiers.includes(requirements.ttlTier)) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Score candidates
   */
  scoreCandidates(candidates, task, requirements) {
    return candidates.map(specialist => {
      const factors = {};
      
      // Skill match score
      factors.skillMatch = this.calculateSkillMatch(specialist, task);
      
      // Complexity fit score
      factors.complexityFit = this.calculateComplexityFit(specialist, task.complexity || 0.5);
      
      // Availability score
      factors.availability = this.calculateAvailabilityScore(specialist);
      
      // Performance score
      factors.performance = this.calculatePerformanceScore(specialist);
      
      // TTL compatibility score
      factors.ttlCompatibility = this.calculateTTLCompatibility(specialist, requirements.ttlTier);
      
      // Department match score
      factors.departmentMatch = this.calculateDepartmentMatch(specialist, task.department);
      
      // Create match score
      const matchScore = new MatchScore(specialist, 0, factors);
      matchScore.score = matchScore.getWeightedScore();
      
      return matchScore;
    });
  }
  
  /**
   * Calculate skill match
   */
  calculateSkillMatch(specialist, task) {
    const taskDescription = this.getTaskDescription(task);
    const skills = specialist.capabilities.skills || [];
    
    let matches = 0;
    for (const skill of skills) {
      if (taskDescription.includes(skill)) {
        matches++;
      }
    }
    
    return skills.length > 0 ? matches / skills.length : 0;
  }
  
  /**
   * Calculate complexity fit
   */
  calculateComplexityFit(specialist, taskComplexity) {
    const capabilities = specialist.capabilities;
    const { min, max } = capabilities.complexity;
    
    if (taskComplexity < min) {
      // Overqualified
      return 0.7 - (min - taskComplexity);
    } else if (taskComplexity > max) {
      // Underqualified
      return 0.3 - (taskComplexity - max);
    } else {
      // Perfect fit
      const midpoint = (min + max) / 2;
      const distance = Math.abs(taskComplexity - midpoint);
      return 1 - (distance / (max - min));
    }
  }
  
  /**
   * Calculate availability score
   */
  calculateAvailabilityScore(specialist) {
    const availability = this.specialistPool.getAvailability(specialist.id);
    
    if (!availability) return 0;
    
    let score = availability.available ? 1.0 : 0.3;
    
    // Adjust for current load
    const loadPenalty = availability.currentTasks * 0.2;
    score -= loadPenalty;
    
    // Adjust for next available time
    if (!availability.available) {
      const waitTime = availability.nextAvailable - Date.now();
      if (waitTime < 1000) score = 0.8;
      else if (waitTime < 5000) score = 0.5;
      else if (waitTime < 30000) score = 0.3;
      else score = 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Calculate performance score
   */
  calculatePerformanceScore(specialist) {
    const performance = this.specialistPool.getPerformance(specialist.id);
    
    if (!performance) return 0.5;
    
    let score = 0;
    
    // Success rate component (40%)
    score += performance.successRate * 0.4;
    
    // Response time component (30%)
    const responseScore = Math.max(0, 1 - (performance.avgResponseTime / this.config.maxResponseTime));
    score += responseScore * 0.3;
    
    // Experience component (30%)
    const experienceScore = Math.min(1, performance.tasksCompleted / 100);
    score += experienceScore * 0.3;
    
    return score;
  }
  
  /**
   * Calculate TTL compatibility
   */
  calculateTTLCompatibility(specialist, ttlTier) {
    if (!ttlTier) return 1.0;
    
    const capabilities = specialist.capabilities;
    const supportedTiers = capabilities.ttlTiers || [];
    
    if (supportedTiers.includes(ttlTier)) {
      // Check if it's the optimal tier
      const tierPriority = {
        'ULTRA_FAST': 4,
        'FAST': 3,
        'STANDARD': 2,
        'EXTENDED': 1
      };
      
      const priority = tierPriority[ttlTier] || 2;
      const optimalTier = supportedTiers[0];
      const optimalPriority = tierPriority[optimalTier] || 2;
      
      if (priority === optimalPriority) return 1.0;
      else if (Math.abs(priority - optimalPriority) === 1) return 0.8;
      else return 0.6;
    }
    
    return 0;
  }
  
  /**
   * Calculate department match
   */
  calculateDepartmentMatch(specialist, department) {
    if (!department) return 1.0;
    
    const capabilities = specialist.capabilities;
    const departments = capabilities.departments || [];
    
    if (departments.includes(department)) {
      return 1.0;
    } else if (departments.some(d => this.areDepartmentsRelated(d, department))) {
      return 0.7;
    }
    
    return 0.3;
  }
  
  /**
   * Filter by requirements
   */
  filterByRequirements(scored, requirements) {
    return scored.filter(match => {
      // Check minimum score
      if (match.score < this.config.minMatchScore) {
        return false;
      }
      
      // Check availability requirement
      if (this.config.requireAvailable && match.factors.availability < 0.5) {
        return false;
      }
      
      // Check performance requirement
      if (match.factors.performance < this.config.minSuccessRate) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Rank candidates
   */
  rankCandidates(matches) {
    return matches.sort((a, b) => {
      // Primary sort by score
      if (Math.abs(a.score - b.score) > 0.05) {
        return b.score - a.score;
      }
      
      // Secondary sort by availability
      if (Math.abs(a.factors.availability - b.factors.availability) > 0.1) {
        return b.factors.availability - a.factors.availability;
      }
      
      // Tertiary sort by performance
      return b.factors.performance - a.factors.performance;
    });
  }
  
  /**
   * Find fallback specialists
   */
  async findFallbackSpecialists(task, requirements) {
    logger.debug('Attempting fallback specialist matching');
    
    // Relax requirements
    const relaxedRequirements = {
      ...requirements,
      minMatchScore: this.config.minMatchScore * 0.7,
      requireAvailable: false
    };
    
    // Get all specialists
    const allSpecialists = Array.from(this.specialistPool.specialists.values());
    
    // Score with relaxed criteria
    const scored = this.scoreCandidates(allSpecialists, task, relaxedRequirements);
    
    // Get best available
    const sorted = scored.sort((a, b) => b.score - a.score);
    
    return sorted.slice(0, 2).map(match => ({
      ...match,
      isFallback: true
    }));
  }
  
  /**
   * Get cache key
   */
  getCacheKey(task, requirements) {
    const taskKey = task.id || JSON.stringify({
      type: task.type,
      complexity: task.complexity,
      department: task.department
    });
    
    const reqKey = JSON.stringify({
      specialistType: requirements.specialistType,
      ttlTier: requirements.ttlTier,
      department: requirements.department
    });
    
    return `${taskKey}:${reqKey}`;
  }
  
  /**
   * Get task description
   */
  getTaskDescription(task) {
    const parts = [];
    
    if (task.name) parts.push(task.name);
    if (task.description) parts.push(task.description);
    if (task.type) parts.push(task.type);
    if (task.keywords) parts.push(...task.keywords);
    
    return parts.join(' ').toLowerCase();
  }
  
  /**
   * Detect task type
   */
  detectTaskType(task) {
    const description = this.getTaskDescription(task);
    
    const typeKeywords = {
      backend: ['api', 'server', 'database', 'backend'],
      frontend: ['ui', 'react', 'vue', 'frontend', 'css'],
      database: ['sql', 'query', 'database', 'migration'],
      devops: ['deploy', 'docker', 'kubernetes', 'ci/cd'],
      security: ['security', 'auth', 'encryption'],
      qa: ['test', 'quality', 'validation']
    };
    
    for (const [type, keywords] of Object.entries(typeKeywords)) {
      if (keywords.some(keyword => description.includes(keyword))) {
        return type;
      }
    }
    
    return null;
  }
  
  /**
   * Check if type matches task
   */
  typeMatchesTask(specialistType, taskType) {
    if (!taskType) return true;
    
    const typeMap = {
      'backend-engineer': ['backend', 'api', 'server'],
      'frontend-developer': ['frontend', 'ui', 'ux'],
      'database-specialist': ['database', 'data'],
      'devops-engineer': ['devops', 'infrastructure'],
      'security-specialist': ['security'],
      'qa-engineer': ['qa', 'test', 'quality']
    };
    
    const relatedTypes = typeMap[specialistType] || [];
    return relatedTypes.includes(taskType);
  }
  
  /**
   * Check if departments are related
   */
  areDepartmentsRelated(dept1, dept2) {
    const relationships = {
      'BACKEND': ['DATA', 'INFRASTRUCTURE'],
      'FRONTEND': ['MOBILE', 'BACKEND'],
      'INFRASTRUCTURE': ['SECURITY', 'BACKEND'],
      'DATA': ['BACKEND', 'INFRASTRUCTURE'],
      'SECURITY': ['INFRASTRUCTURE', 'BACKEND'],
      'QUALITY': ['BACKEND', 'FRONTEND']
    };
    
    const related = relationships[dept1] || [];
    return related.includes(dept2);
  }
  
  /**
   * Update statistics
   */
  updateStatistics(matches, matchTime) {
    this.statistics.totalMatches++;
    
    if (matches.length > 0) {
      this.statistics.successfulMatches++;
      
      // Update average match score
      const avgScore = matches.reduce((sum, m) => sum + m.score, 0) / matches.length;
      this.statistics.avgMatchScore = 
        (this.statistics.avgMatchScore * (this.statistics.totalMatches - 1) + avgScore) /
        this.statistics.totalMatches;
    } else {
      this.statistics.failedMatches++;
    }
    
    // Update average match time
    this.statistics.avgMatchTime = 
      (this.statistics.avgMatchTime * (this.statistics.totalMatches - 1) + matchTime) /
      this.statistics.totalMatches;
  }
  
  /**
   * Record match for learning
   */
  recordMatch(task, requirements, matches) {
    const record = {
      timestamp: Date.now(),
      task: {
        type: task.type,
        complexity: task.complexity,
        department: task.department
      },
      requirements,
      matches: matches.map(m => ({
        specialist: m.specialist.id,
        score: m.score,
        factors: m.factors
      }))
    };
    
    this.matchHistory.push(record);
    
    // Trim history
    if (this.matchHistory.length > this.config.historySize) {
      this.matchHistory.shift();
    }
    
    // Learn from match if enabled
    if (this.config.enableLearning) {
      this.learnFromMatch(record);
    }
  }
  
  /**
   * Learn from match outcomes
   */
  learnFromMatch(record) {
    // Update performance tracking
    for (const match of record.matches) {
      const specialistId = match.specialist;
      
      if (!this.performanceTracking.has(specialistId)) {
        this.performanceTracking.set(specialistId, {
          matchCount: 0,
          avgScore: 0,
          successRate: 0
        });
      }
      
      const tracking = this.performanceTracking.get(specialistId);
      tracking.matchCount++;
      tracking.avgScore = 
        (tracking.avgScore * (tracking.matchCount - 1) + match.score) / tracking.matchCount;
    }
  }
  
  /**
   * Get matcher status
   */
  getStatus() {
    return {
      statistics: this.statistics,
      specialists: {
        total: this.specialistPool.specialists.size,
        available: this.specialistPool.getAllAvailable().length
      },
      cache: {
        size: this.matchCache.size,
        hitRate: this.statistics.cacheHits / 
                 (this.statistics.cacheHits + this.statistics.cacheMisses) || 0
      },
      performance: {
        avgMatchScore: this.statistics.avgMatchScore,
        avgMatchTime: `${this.statistics.avgMatchTime}ms`,
        successRate: this.statistics.successfulMatches / this.statistics.totalMatches || 0
      },
      config: {
        minMatchScore: this.config.minMatchScore,
        fallback: this.config.enableFallback,
        learning: this.config.enableLearning
      }
    };
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.matchCache.clear();
    logger.info('Match cache cleared');
  }
  
  /**
   * Reset statistics
   */
  resetStatistics() {
    this.statistics = {
      totalMatches: 0,
      successfulMatches: 0,
      fallbackMatches: 0,
      failedMatches: 0,
      avgMatchScore: 0,
      avgMatchTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    logger.info('Statistics reset');
  }
  
  /**
   * Shutdown matcher
   */
  shutdown() {
    logger.info('Shutting down Specialist Matcher...');
    
    this.clearCache();
    this.removeAllListeners();
    
    logger.info('Specialist Matcher shutdown complete');
  }
}

module.exports = {
  SpecialistMatcher,
  SpecialistPool,
  MatchScore,
  SPECIALIST_CAPABILITIES,
  SCORING_WEIGHTS
};