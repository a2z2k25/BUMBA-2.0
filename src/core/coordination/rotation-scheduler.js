/**
 * BUMBA Rotation Scheduler
 * Advanced scheduling algorithms for department rotations
 * Part of Department Rotation Sessions enhancement to 90%
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Advanced scheduler for department rotation sessions
 */
class RotationScheduler extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxRotationsPerMonth: config.maxRotationsPerMonth || 12,
      minRestDays: config.minRestDays || 7,
      maxParticipantsPerRotation: config.maxParticipantsPerRotation || 6,
      balanceThreshold: config.balanceThreshold || 0.8,
      learningVelocity: config.learningVelocity || 1.0,
      ...config
    };
    
    // Scheduling state
    this.schedules = new Map();
    this.participantHistory = new Map();
    this.departmentCapacity = new Map();
    this.blackoutDates = new Set();
    this.preferences = new Map();
    
    // Optimization metrics
    this.metrics = {
      schedulingConflicts: 0,
      rescheduledRotations: 0,
      participantSatisfaction: 1.0,
      departmentBalance: 1.0,
      learningEfficiency: 1.0
    };
    
    this.initialize();
  }
  
  /**
   * Initialize scheduler
   */
  initialize() {
    this.initializeDepartmentCapacity();
    this.loadHistoricalData();
    
    logger.info('📅 Rotation Scheduler initialized');
  }
  
  /**
   * Initialize department capacity
   */
  initializeDepartmentCapacity() {
    const departments = ['technical', 'experience', 'strategic'];
    
    for (const dept of departments) {
      this.departmentCapacity.set(dept, {
        maxHosting: 4, // Max rotations to host per month
        maxShadowing: 4, // Max rotations to shadow per month
        currentHosting: 0,
        currentShadowing: 0,
        specialists: this.getDepartmentSpecialists(dept)
      });
    }
  }
  
  /**
   * Get department specialists
   */
  getDepartmentSpecialists(department) {
    const specialists = {
      technical: ['backend', 'frontend', 'database', 'security', 'devops', 'api'],
      experience: ['ux-research', 'ui-design', 'accessibility', 'performance', 'interaction'],
      strategic: ['product', 'market-research', 'business-model', 'competitive', 'roi']
    };
    
    return specialists[department] || [];
  }
  
  /**
   * Create optimal schedule for time period
   */
  async createOptimalSchedule(startDate, endDate, rotationPairings) {
    logger.info('📅 Creating optimal rotation schedule');
    
    const schedule = {
      id: this.generateScheduleId(),
      period: { start: startDate, end: endDate },
      rotations: [],
      optimization: {
        score: 0,
        iterations: 0,
        constraints: []
      }
    };
    
    // Generate candidate dates
    const candidateDates = this.generateCandidateDates(startDate, endDate);
    
    // Optimize rotation assignments
    const optimizedRotations = await this.optimizeRotationAssignments(
      rotationPairings,
      candidateDates
    );
    
    // Validate and finalize schedule
    schedule.rotations = this.validateSchedule(optimizedRotations);
    
    // Calculate optimization score
    schedule.optimization.score = this.calculateScheduleScore(schedule);
    
    // Store schedule
    this.schedules.set(schedule.id, schedule);
    
    // Emit schedule created event
    this.emit('schedule-created', schedule);
    
    return schedule;
  }
  
  /**
   * Generate candidate dates for rotations
   */
  generateCandidateDates(startDate, endDate) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);
    
    while (current <= end) {
      // Skip weekends and blackout dates
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        const dateStr = current.toISOString().split('T')[0];
        
        if (!this.blackoutDates.has(dateStr)) {
          dates.push({
            date: new Date(current),
            availability: this.calculateDateAvailability(current),
            capacity: this.calculateDateCapacity(current)
          });
        }
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }
  
  /**
   * Calculate date availability score
   */
  calculateDateAvailability(date) {
    let score = 1.0;
    
    // Check for holidays
    if (this.isHoliday(date)) {
      score *= 0.3;
    }
    
    // Check for peak work periods (end of month/quarter)
    const dayOfMonth = date.getDate();
    if (dayOfMonth >= 25 || dayOfMonth <= 5) {
      score *= 0.7;
    }
    
    // Check for existing rotations
    const dateStr = date.toISOString().split('T')[0];
    const existingCount = this.countExistingRotations(dateStr);
    score *= Math.max(0, 1 - (existingCount * 0.2));
    
    return score;
  }
  
  /**
   * Calculate date capacity
   */
  calculateDateCapacity(date) {
    const dateStr = date.toISOString().split('T')[0];
    let totalCapacity = 0;
    
    for (const [dept, capacity] of this.departmentCapacity) {
      const used = this.getUsedCapacity(dept, dateStr);
      const available = Math.max(0, capacity.maxHosting - used);
      totalCapacity += available;
    }
    
    return totalCapacity;
  }
  
  /**
   * Optimize rotation assignments using genetic algorithm
   */
  async optimizeRotationAssignments(pairings, candidateDates) {
    const population = [];
    const populationSize = 50;
    const generations = 100;
    
    // Create initial population
    for (let i = 0; i < populationSize; i++) {
      population.push(this.createRandomSchedule(pairings, candidateDates));
    }
    
    // Evolve population
    for (let gen = 0; gen < generations; gen++) {
      // Evaluate fitness
      for (const individual of population) {
        individual.fitness = this.evaluateFitness(individual);
      }
      
      // Sort by fitness
      population.sort((a, b) => b.fitness - a.fitness);
      
      // Keep top performers
      const survivors = population.slice(0, populationSize / 2);
      
      // Create new generation
      while (survivors.length < populationSize) {
        const parent1 = this.selectParent(survivors);
        const parent2 = this.selectParent(survivors);
        const child = this.crossover(parent1, parent2);
        
        // Mutation
        if (Math.random() < 0.1) {
          this.mutate(child);
        }
        
        survivors.push(child);
      }
      
      population.length = 0;
      population.push(...survivors);
    }
    
    // Return best solution
    return population[0].rotations;
  }
  
  /**
   * Create random schedule
   */
  createRandomSchedule(pairings, candidateDates) {
    const schedule = {
      rotations: [],
      fitness: 0
    };
    
    for (const pairing of pairings) {
      const availableDates = candidateDates.filter(d => d.availability > 0.5);
      
      if (availableDates.length > 0) {
        const randomDate = availableDates[Math.floor(Math.random() * availableDates.length)];
        
        schedule.rotations.push({
          pairing,
          date: randomDate.date,
          participants: this.selectOptimalParticipants(pairing, randomDate.date)
        });
      }
    }
    
    return schedule;
  }
  
  /**
   * Evaluate fitness of schedule
   */
  evaluateFitness(schedule) {
    let fitness = 0;
    
    // Factor 1: Date availability
    const availabilityScore = schedule.rotations.reduce((sum, r) => {
      return sum + this.calculateDateAvailability(r.date);
    }, 0) / schedule.rotations.length;
    fitness += availabilityScore * 0.3;
    
    // Factor 2: Department balance
    const balanceScore = this.calculateDepartmentBalance(schedule);
    fitness += balanceScore * 0.3;
    
    // Factor 3: Participant distribution
    const distributionScore = this.calculateParticipantDistribution(schedule);
    fitness += distributionScore * 0.2;
    
    // Factor 4: Learning path optimization
    const learningScore = this.calculateLearningPathScore(schedule);
    fitness += learningScore * 0.2;
    
    return fitness;
  }
  
  /**
   * Calculate department balance
   */
  calculateDepartmentBalance(schedule) {
    const deptCounts = new Map();
    
    for (const rotation of schedule.rotations) {
      const shadow = rotation.pairing.shadow.department;
      const host = rotation.pairing.host.department;
      
      deptCounts.set(shadow, (deptCounts.get(shadow) || 0) + 1);
      deptCounts.set(host, (deptCounts.get(host) || 0) + 1);
    }
    
    // Calculate variance
    const counts = Array.from(deptCounts.values());
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / counts.length;
    
    // Lower variance = better balance
    return Math.max(0, 1 - (variance / mean));
  }
  
  /**
   * Calculate participant distribution
   */
  calculateParticipantDistribution(schedule) {
    const participantCounts = new Map();
    
    for (const rotation of schedule.rotations) {
      for (const participant of rotation.participants) {
        const count = participantCounts.get(participant.id) || 0;
        participantCounts.set(participant.id, count + 1);
      }
    }
    
    // Penalize if same participant in too many rotations
    const overloadedCount = Array.from(participantCounts.values())
      .filter(c => c > 2).length;
    
    return Math.max(0, 1 - (overloadedCount * 0.2));
  }
  
  /**
   * Calculate learning path score
   */
  calculateLearningPathScore(schedule) {
    let score = 1.0;
    
    for (const rotation of schedule.rotations) {
      // Check if prerequisites are met
      const prereqScore = this.checkPrerequisites(rotation);
      score *= prereqScore;
      
      // Check learning progression
      const progressionScore = this.checkLearningProgression(rotation);
      score *= progressionScore;
    }
    
    return score;
  }
  
  /**
   * Select parent for genetic algorithm
   */
  selectParent(population) {
    // Tournament selection
    const tournamentSize = 3;
    const tournament = [];
    
    for (let i = 0; i < tournamentSize; i++) {
      tournament.push(population[Math.floor(Math.random() * population.length)]);
    }
    
    return tournament.reduce((best, current) => 
      current.fitness > best.fitness ? current : best
    );
  }
  
  /**
   * Crossover two parent schedules
   */
  crossover(parent1, parent2) {
    const child = {
      rotations: [],
      fitness: 0
    };
    
    // Take first half from parent1, second half from parent2
    const midpoint = Math.floor(parent1.rotations.length / 2);
    
    child.rotations.push(...parent1.rotations.slice(0, midpoint));
    child.rotations.push(...parent2.rotations.slice(midpoint));
    
    return child;
  }
  
  /**
   * Mutate schedule
   */
  mutate(schedule) {
    if (schedule.rotations.length === 0) return;
    
    // Random mutation: change date of random rotation
    const index = Math.floor(Math.random() * schedule.rotations.length);
    const rotation = schedule.rotations[index];
    
    // Shift date by 1-3 days
    const shift = (Math.random() < 0.5 ? -1 : 1) * (Math.floor(Math.random() * 3) + 1);
    const newDate = new Date(rotation.date);
    newDate.setDate(newDate.getDate() + shift);
    
    rotation.date = newDate;
  }
  
  /**
   * Validate schedule against constraints
   */
  validateSchedule(rotations) {
    const validated = [];
    
    for (const rotation of rotations) {
      if (this.validateRotation(rotation)) {
        validated.push(rotation);
      } else {
        // Try to reschedule
        const rescheduled = this.rescheduleRotation(rotation);
        if (rescheduled) {
          validated.push(rescheduled);
          this.metrics.rescheduledRotations++;
        } else {
          this.metrics.schedulingConflicts++;
          logger.warn('Could not schedule rotation', rotation);
        }
      }
    }
    
    return validated;
  }
  
  /**
   * Validate single rotation
   */
  validateRotation(rotation) {
    // Check department capacity
    if (!this.checkDepartmentCapacity(rotation)) {
      return false;
    }
    
    // Check participant availability
    if (!this.checkParticipantAvailability(rotation)) {
      return false;
    }
    
    // Check minimum rest period
    if (!this.checkRestPeriod(rotation)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Check department capacity
   */
  checkDepartmentCapacity(rotation) {
    const shadow = rotation.pairing.shadow.department;
    const host = rotation.pairing.host.department;
    const dateStr = rotation.date.toISOString().split('T')[0];
    
    const shadowCapacity = this.departmentCapacity.get(shadow);
    const hostCapacity = this.departmentCapacity.get(host);
    
    const shadowUsed = this.getUsedCapacity(shadow, dateStr);
    const hostUsed = this.getUsedCapacity(host, dateStr);
    
    return shadowUsed < shadowCapacity.maxShadowing && 
           hostUsed < hostCapacity.maxHosting;
  }
  
  /**
   * Check participant availability
   */
  checkParticipantAvailability(rotation) {
    for (const participant of rotation.participants) {
      if (!this.isParticipantAvailable(participant, rotation.date)) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * Check rest period between rotations
   */
  checkRestPeriod(rotation) {
    for (const participant of rotation.participants) {
      const lastRotation = this.getLastRotationDate(participant.id);
      
      if (lastRotation) {
        const daysDiff = Math.abs(rotation.date - lastRotation) / (1000 * 60 * 60 * 24);
        if (daysDiff < this.config.minRestDays) {
          return false;
        }
      }
    }
    return true;
  }
  
  /**
   * Reschedule rotation to next available date
   */
  rescheduleRotation(rotation) {
    const maxAttempts = 30;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const newDate = new Date(rotation.date);
      newDate.setDate(newDate.getDate() + attempts + 1);
      
      const rescheduled = {
        ...rotation,
        date: newDate,
        rescheduled: true
      };
      
      if (this.validateRotation(rescheduled)) {
        return rescheduled;
      }
      
      attempts++;
    }
    
    return null;
  }
  
  /**
   * Select optimal participants for rotation
   */
  selectOptimalParticipants(pairing, date) {
    const participants = [];
    const shadowDept = pairing.shadow.department;
    const hostDept = pairing.host.department;
    
    // Get available specialists
    const shadowSpecialists = this.getAvailableSpecialists(shadowDept, date);
    const hostSpecialists = this.getAvailableSpecialists(hostDept, date);
    
    // Select optimal pairs based on learning objectives
    const optimalPairs = this.findOptimalPairs(
      shadowSpecialists,
      hostSpecialists,
      pairing.learning_focus
    );
    
    // Create participant list
    for (const pair of optimalPairs) {
      participants.push({
        id: `${shadowDept}-${pair.shadow}-${Date.now()}`,
        specialist: pair.shadow,
        department: shadowDept,
        role: 'shadow'
      });
      
      participants.push({
        id: `${hostDept}-${pair.host}-${Date.now()}`,
        specialist: pair.host,
        department: hostDept,
        role: 'host'
      });
    }
    
    return participants.slice(0, this.config.maxParticipantsPerRotation);
  }
  
  /**
   * Find optimal specialist pairs
   */
  findOptimalPairs(shadowSpecialists, hostSpecialists, learningFocus) {
    const pairs = [];
    
    // Score all possible pairs
    for (const shadow of shadowSpecialists) {
      for (const host of hostSpecialists) {
        const score = this.calculatePairScore(shadow, host, learningFocus);
        pairs.push({ shadow, host, score });
      }
    }
    
    // Sort by score and return top pairs
    pairs.sort((a, b) => b.score - a.score);
    return pairs.slice(0, 3);
  }
  
  /**
   * Calculate pair compatibility score
   */
  calculatePairScore(shadow, host, learningFocus) {
    let score = 0.5; // Base score
    
    // Check for complementary skills
    if (this.areSkillsComplementary(shadow, host)) {
      score += 0.2;
    }
    
    // Check for learning path alignment
    if (this.isLearningPathAligned(shadow, learningFocus)) {
      score += 0.2;
    }
    
    // Check for previous successful pairings
    const history = this.getPairingHistory(shadow, host);
    if (history.success) {
      score += 0.1;
    }
    
    return score;
  }
  
  /**
   * Check if skills are complementary
   */
  areSkillsComplementary(specialist1, specialist2) {
    const complementary = {
      'backend': ['ui-design', 'ux-research'],
      'ui-design': ['backend', 'api'],
      'security': ['product', 'ux-research'],
      'product': ['backend', 'ui-design']
    };
    
    return complementary[specialist1]?.includes(specialist2) || false;
  }
  
  /**
   * Set participant preferences
   */
  setParticipantPreferences(participantId, preferences) {
    this.preferences.set(participantId, {
      preferredDepartments: preferences.departments || [],
      preferredDates: preferences.dates || [],
      blockedDates: preferences.blockedDates || [],
      learningGoals: preferences.learningGoals || []
    });
  }
  
  /**
   * Add blackout date
   */
  addBlackoutDate(date) {
    const dateStr = new Date(date).toISOString().split('T')[0];
    this.blackoutDates.add(dateStr);
  }
  
  /**
   * Get schedule metrics
   */
  getScheduleMetrics() {
    return {
      ...this.metrics,
      totalScheduled: this.schedules.size,
      upcomingRotations: this.countUpcomingRotations(),
      participantCoverage: this.calculateParticipantCoverage(),
      departmentUtilization: this.calculateDepartmentUtilization()
    };
  }
  
  // Helper methods
  
  loadHistoricalData() {
    // Load from storage in production
    logger.debug('Loading historical rotation data');
  }
  
  isHoliday(date) {
    // Check against holiday calendar
    return false;
  }
  
  countExistingRotations(dateStr) {
    let count = 0;
    for (const schedule of this.schedules.values()) {
      count += schedule.rotations.filter(r => 
        r.date.toISOString().split('T')[0] === dateStr
      ).length;
    }
    return count;
  }
  
  getUsedCapacity(department, dateStr) {
    // Count rotations for department on date
    return 0; // Simplified
  }
  
  getAvailableSpecialists(department, date) {
    const capacity = this.departmentCapacity.get(department);
    return capacity?.specialists || [];
  }
  
  isParticipantAvailable(participant, date) {
    const prefs = this.preferences.get(participant.id);
    if (!prefs) return true;
    
    const dateStr = date.toISOString().split('T')[0];
    return !prefs.blockedDates.includes(dateStr);
  }
  
  getLastRotationDate(participantId) {
    const history = this.participantHistory.get(participantId);
    return history?.lastRotation || null;
  }
  
  checkPrerequisites(rotation) {
    // Check if learning prerequisites are met
    return 1.0;
  }
  
  checkLearningProgression(rotation) {
    // Check if rotation follows logical progression
    return 1.0;
  }
  
  isLearningPathAligned(specialist, learningFocus) {
    // Check if specialist benefits from learning focus
    return true;
  }
  
  getPairingHistory(specialist1, specialist2) {
    // Get historical pairing data
    return { success: false };
  }
  
  calculateScheduleScore(schedule) {
    return this.evaluateFitness({ rotations: schedule.rotations, fitness: 0 });
  }
  
  countUpcomingRotations() {
    const now = Date.now();
    let count = 0;
    
    for (const schedule of this.schedules.values()) {
      count += schedule.rotations.filter(r => r.date.getTime() > now).length;
    }
    
    return count;
  }
  
  calculateParticipantCoverage() {
    const uniqueParticipants = new Set();
    
    for (const schedule of this.schedules.values()) {
      for (const rotation of schedule.rotations) {
        for (const participant of rotation.participants) {
          uniqueParticipants.add(participant.id);
        }
      }
    }
    
    return uniqueParticipants.size;
  }
  
  calculateDepartmentUtilization() {
    const utilization = {};
    
    for (const [dept, capacity] of this.departmentCapacity) {
      const used = capacity.currentHosting + capacity.currentShadowing;
      const max = capacity.maxHosting + capacity.maxShadowing;
      utilization[dept] = max > 0 ? used / max : 0;
    }
    
    return utilization;
  }
  
  generateScheduleId() {
    return `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = RotationScheduler;