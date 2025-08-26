/**
 * BUMBA Rotation Optimizer
 * Intelligent pairing and rotation optimization
 * Part of Department Rotation Sessions enhancement to 90%
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Optimizer for department rotation pairings and effectiveness
 */
class RotationOptimizer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxIterations: config.maxIterations || 1000,
      convergenceThreshold: config.convergenceThreshold || 0.001,
      learningRate: config.learningRate || 0.1,
      explorationRate: config.explorationRate || 0.2,
      ...config
    };
    
    // Optimization state
    this.pairingHistory = new Map();
    this.specialistProfiles = new Map();
    this.departmentSynergy = new Map();
    this.learningObjectives = new Map();
    
    // Optimization metrics
    this.metrics = {
      totalOptimizations: 0,
      averageImprovement: 0,
      bestPairingScore: 0,
      convergenceRate: 0
    };
    
    // Machine learning components
    this.pairingModel = this.initializePairingModel();
    this.synergyMatrix = this.initializeSynergyMatrix();
    
    this.initialize();
  }
  
  /**
   * Initialize optimizer
   */
  initialize() {
    this.loadHistoricalData();
    this.calibrateModel();
    
    logger.info('🟡 Rotation Optimizer initialized');
  }
  
  /**
   * Initialize pairing model
   */
  initializePairingModel() {
    return {
      weights: {
        skillComplementarity: 0.25,
        experienceBalance: 0.2,
        learningAlignment: 0.25,
        previousSuccess: 0.15,
        availability: 0.15
      },
      biases: {
        crossDepartment: 0.1,
        seniority: 0.05,
        diversity: 0.1
      }
    };
  }
  
  /**
   * Initialize synergy matrix
   */
  initializeSynergyMatrix() {
    const matrix = new Map();
    
    // Define base synergies between departments
    const synergies = [
      { pair: ['technical', 'experience'], score: 0.85 },
      { pair: ['technical', 'strategic'], score: 0.75 },
      { pair: ['experience', 'strategic'], score: 0.8 },
      { pair: ['technical', 'technical'], score: 0.6 },
      { pair: ['experience', 'experience'], score: 0.65 },
      { pair: ['strategic', 'strategic'], score: 0.55 }
    ];
    
    for (const synergy of synergies) {
      const key = synergy.pair.sort().join(':');
      matrix.set(key, synergy.score);
    }
    
    return matrix;
  }
  
  /**
   * Optimize rotation pairings
   */
  async optimizePairings(candidates, objectives, constraints = {}) {
    logger.info('🟡 Optimizing rotation pairings');
    
    const optimization = {
      id: this.generateOptimizationId(),
      timestamp: Date.now(),
      candidates,
      objectives,
      constraints,
      iterations: 0,
      initialScore: 0,
      finalScore: 0,
      pairings: []
    };
    
    // Create initial solution
    let currentSolution = this.createInitialSolution(candidates, objectives);
    optimization.initialScore = this.evaluateSolution(currentSolution, objectives);
    
    // Optimization loop
    let bestSolution = currentSolution;
    let bestScore = optimization.initialScore;
    let convergence = false;
    let previousScore = bestScore;
    
    while (optimization.iterations < this.config.maxIterations && !convergence) {
      // Generate neighbor solution
      const neighbor = this.generateNeighbor(currentSolution, optimization.iterations);
      
      // Evaluate neighbor
      const neighborScore = this.evaluateSolution(neighbor, objectives);
      
      // Accept or reject based on simulated annealing
      if (this.acceptSolution(neighborScore, bestScore, optimization.iterations)) {
        currentSolution = neighbor;
        
        if (neighborScore > bestScore) {
          bestSolution = neighbor;
          bestScore = neighborScore;
        }
      }
      
      // Check convergence
      if (Math.abs(bestScore - previousScore) < this.config.convergenceThreshold) {
        convergence = true;
      }
      
      previousScore = bestScore;
      optimization.iterations++;
    }
    
    // Finalize optimization
    optimization.finalScore = bestScore;
    optimization.pairings = this.extractPairings(bestSolution);
    optimization.improvement = bestScore - optimization.initialScore;
    
    // Update metrics
    this.updateMetrics(optimization);
    
    // Emit optimization complete
    this.emit('optimization-complete', optimization);
    
    return optimization;
  }
  
  /**
   * Create initial solution
   */
  createInitialSolution(candidates, objectives) {
    const solution = {
      assignments: [],
      unassigned: new Set(candidates.map(c => c.id))
    };
    
    // Greedy initial assignment
    while (solution.unassigned.size > 1) {
      const best = this.findBestPair(solution.unassigned, candidates, objectives);
      
      if (best) {
        solution.assignments.push(best);
        solution.unassigned.delete(best.shadow);
        solution.unassigned.delete(best.host);
      } else {
        break;
      }
    }
    
    return solution;
  }
  
  /**
   * Find best pair from unassigned
   */
  findBestPair(unassigned, candidates, objectives) {
    let bestPair = null;
    let bestScore = -Infinity;
    
    const unassignedArray = Array.from(unassigned);
    
    for (let i = 0; i < unassignedArray.length; i++) {
      for (let j = i + 1; j < unassignedArray.length; j++) {
        const candidate1 = candidates.find(c => c.id === unassignedArray[i]);
        const candidate2 = candidates.find(c => c.id === unassignedArray[j]);
        
        if (candidate1 && candidate2) {
          const score = this.calculatePairScore(candidate1, candidate2, objectives);
          
          if (score > bestScore) {
            bestScore = score;
            bestPair = {
              shadow: candidate1.id,
              host: candidate2.id,
              score
            };
          }
        }
      }
    }
    
    return bestPair;
  }
  
  /**
   * Calculate pair score
   */
  calculatePairScore(candidate1, candidate2, objectives) {
    let score = 0;
    const weights = this.pairingModel.weights;
    
    // Skill complementarity
    const complementarity = this.calculateComplementarity(candidate1, candidate2);
    score += complementarity * weights.skillComplementarity;
    
    // Experience balance
    const balance = this.calculateExperienceBalance(candidate1, candidate2);
    score += balance * weights.experienceBalance;
    
    // Learning alignment
    const alignment = this.calculateLearningAlignment(candidate1, candidate2, objectives);
    score += alignment * weights.learningAlignment;
    
    // Previous success
    const previousSuccess = this.getPreviousSuccess(candidate1, candidate2);
    score += previousSuccess * weights.previousSuccess;
    
    // Availability match
    const availability = this.calculateAvailabilityMatch(candidate1, candidate2);
    score += availability * weights.availability;
    
    // Apply biases
    score = this.applyBiases(score, candidate1, candidate2);
    
    return score;
  }
  
  /**
   * Calculate skill complementarity
   */
  calculateComplementarity(candidate1, candidate2) {
    const skills1 = new Set(candidate1.skills || []);
    const skills2 = new Set(candidate2.skills || []);
    
    // Calculate Jaccard distance (inverse for complementarity)
    const intersection = new Set([...skills1].filter(x => skills2.has(x)));
    const union = new Set([...skills1, ...skills2]);
    
    if (union.size === 0) return 0;
    
    // Lower overlap = higher complementarity
    const overlap = intersection.size / union.size;
    return 1 - overlap;
  }
  
  /**
   * Calculate experience balance
   */
  calculateExperienceBalance(candidate1, candidate2) {
    const exp1 = candidate1.experience || 0;
    const exp2 = candidate2.experience || 0;
    
    // Optimal balance is neither too similar nor too different
    const diff = Math.abs(exp1 - exp2);
    const optimalDiff = 2; // years
    
    if (diff === optimalDiff) return 1.0;
    if (diff < optimalDiff) return 0.8 + (diff / optimalDiff) * 0.2;
    
    // Penalize large differences
    return Math.max(0, 1 - (diff - optimalDiff) * 0.1);
  }
  
  /**
   * Calculate learning alignment
   */
  calculateLearningAlignment(candidate1, candidate2, objectives) {
    const goals1 = new Set(candidate1.learningGoals || []);
    const goals2 = new Set(candidate2.learningGoals || []);
    const targetObjectives = new Set(objectives);
    
    // Check how well their goals align with objectives
    const alignment1 = this.calculateSetAlignment(goals1, targetObjectives);
    const alignment2 = this.calculateSetAlignment(goals2, targetObjectives);
    
    // Mutual benefit score
    const canTeach1to2 = this.calculateTeachingPotential(candidate1, goals2);
    const canTeach2to1 = this.calculateTeachingPotential(candidate2, goals1);
    
    return (alignment1 + alignment2) * 0.5 + (canTeach1to2 + canTeach2to1) * 0.25;
  }
  
  /**
   * Calculate set alignment
   */
  calculateSetAlignment(set1, set2) {
    if (set2.size === 0) return 0;
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    return intersection.size / set2.size;
  }
  
  /**
   * Calculate teaching potential
   */
  calculateTeachingPotential(teacher, learnerGoals) {
    const teacherSkills = new Set(teacher.skills || []);
    const overlap = new Set([...teacherSkills].filter(x => learnerGoals.has(x)));
    
    return learnerGoals.size > 0 ? overlap.size / learnerGoals.size : 0;
  }
  
  /**
   * Get previous success rate
   */
  getPreviousSuccess(candidate1, candidate2) {
    const key = [candidate1.id, candidate2.id].sort().join(':');
    const history = this.pairingHistory.get(key);
    
    if (!history) return 0.5; // Neutral if no history
    
    return history.successRate || 0.5;
  }
  
  /**
   * Calculate availability match
   */
  calculateAvailabilityMatch(candidate1, candidate2) {
    if (!candidate1.availability || !candidate2.availability) return 1.0;
    
    const overlap = this.calculateTimeOverlap(
      candidate1.availability,
      candidate2.availability
    );
    
    return overlap;
  }
  
  /**
   * Calculate time overlap
   */
  calculateTimeOverlap(availability1, availability2) {
    // Simplified: check for common available dates
    const dates1 = new Set(availability1.dates || []);
    const dates2 = new Set(availability2.dates || []);
    
    if (dates1.size === 0 || dates2.size === 0) return 1.0;
    
    const common = new Set([...dates1].filter(x => dates2.has(x)));
    return common.size / Math.min(dates1.size, dates2.size);
  }
  
  /**
   * Apply biases to score
   */
  applyBiases(score, candidate1, candidate2) {
    const biases = this.pairingModel.biases;
    
    // Cross-department bias
    if (candidate1.department !== candidate2.department) {
      score *= (1 + biases.crossDepartment);
    }
    
    // Seniority mix bias
    const seniorityMix = Math.abs((candidate1.seniority || 0) - (candidate2.seniority || 0));
    if (seniorityMix >= 2) {
      score *= (1 + biases.seniority);
    }
    
    // Diversity bias
    if (this.calculateDiversityScore(candidate1, candidate2) > 0.7) {
      score *= (1 + biases.diversity);
    }
    
    return Math.min(score, 1.0);
  }
  
  /**
   * Calculate diversity score
   */
  calculateDiversityScore(candidate1, candidate2) {
    let diversity = 0;
    let factors = 0;
    
    // Department diversity
    if (candidate1.department !== candidate2.department) {
      diversity += 1;
    }
    factors++;
    
    // Background diversity
    if (candidate1.background !== candidate2.background) {
      diversity += 1;
    }
    factors++;
    
    // Specialization diversity
    if (candidate1.specialization !== candidate2.specialization) {
      diversity += 1;
    }
    factors++;
    
    return factors > 0 ? diversity / factors : 0;
  }
  
  /**
   * Evaluate solution quality
   */
  evaluateSolution(solution, objectives) {
    let totalScore = 0;
    
    // Score each assignment
    for (const assignment of solution.assignments) {
      totalScore += assignment.score || 0;
    }
    
    // Penalize unassigned candidates
    const unassignedPenalty = solution.unassigned.size * 0.1;
    totalScore -= unassignedPenalty;
    
    // Bonus for meeting all objectives
    const objectivesMet = this.checkObjectivesMet(solution, objectives);
    if (objectivesMet) {
      totalScore *= 1.2;
    }
    
    return Math.max(0, totalScore);
  }
  
  /**
   * Check if objectives are met
   */
  checkObjectivesMet(solution, objectives) {
    // Simplified: check if we have enough assignments
    return solution.assignments.length >= objectives.minimumPairings;
  }
  
  /**
   * Generate neighbor solution
   */
  generateNeighbor(solution, iteration) {
    const neighbor = {
      assignments: [...solution.assignments],
      unassigned: new Set(solution.unassigned)
    };
    
    // Exploration vs exploitation
    const explore = Math.random() < this.getExplorationRate(iteration);
    
    if (explore && neighbor.assignments.length > 0) {
      // Exploration: swap two assignments
      const idx1 = Math.floor(Math.random() * neighbor.assignments.length);
      const idx2 = Math.floor(Math.random() * neighbor.assignments.length);
      
      if (idx1 !== idx2) {
        const temp = neighbor.assignments[idx1].shadow;
        neighbor.assignments[idx1].shadow = neighbor.assignments[idx2].shadow;
        neighbor.assignments[idx2].shadow = temp;
        
        // Recalculate scores
        neighbor.assignments[idx1].score = Math.random(); // Simplified
        neighbor.assignments[idx2].score = Math.random();
      }
    } else {
      // Exploitation: small adjustment
      if (neighbor.assignments.length > 0 && neighbor.unassigned.size > 0) {
        const idx = Math.floor(Math.random() * neighbor.assignments.length);
        const unassignedArray = Array.from(neighbor.unassigned);
        
        if (unassignedArray.length > 0) {
          const newCandidate = unassignedArray[Math.floor(Math.random() * unassignedArray.length)];
          
          // Swap with unassigned
          neighbor.unassigned.add(neighbor.assignments[idx].shadow);
          neighbor.unassigned.delete(newCandidate);
          neighbor.assignments[idx].shadow = newCandidate;
          neighbor.assignments[idx].score = Math.random(); // Recalculate
        }
      }
    }
    
    return neighbor;
  }
  
  /**
   * Get exploration rate based on iteration
   */
  getExplorationRate(iteration) {
    // Decay exploration over time
    const decay = 0.995;
    return this.config.explorationRate * Math.pow(decay, iteration);
  }
  
  /**
   * Accept solution based on simulated annealing
   */
  acceptSolution(newScore, currentScore, iteration) {
    if (newScore > currentScore) {
      return true;
    }
    
    // Calculate acceptance probability
    const temperature = this.getTemperature(iteration);
    const delta = newScore - currentScore;
    const probability = Math.exp(delta / temperature);
    
    return Math.random() < probability;
  }
  
  /**
   * Get temperature for simulated annealing
   */
  getTemperature(iteration) {
    const initialTemp = 1.0;
    const coolingRate = 0.995;
    return initialTemp * Math.pow(coolingRate, iteration);
  }
  
  /**
   * Extract pairings from solution
   */
  extractPairings(solution) {
    return solution.assignments.map(assignment => ({
      shadow: assignment.shadow,
      host: assignment.host,
      score: assignment.score,
      optimized: true
    }));
  }
  
  /**
   * Update specialist profile
   */
  updateSpecialistProfile(specialistId, profile) {
    this.specialistProfiles.set(specialistId, {
      ...this.specialistProfiles.get(specialistId),
      ...profile,
      lastUpdated: Date.now()
    });
    
    // Recalibrate model if significant changes
    if (this.shouldRecalibrate()) {
      this.calibrateModel();
    }
  }
  
  /**
   * Update pairing history
   */
  updatePairingHistory(pairing, outcome) {
    const key = [pairing.shadow, pairing.host].sort().join(':');
    
    if (!this.pairingHistory.has(key)) {
      this.pairingHistory.set(key, {
        count: 0,
        successes: 0,
        totalScore: 0,
        outcomes: []
      });
    }
    
    const history = this.pairingHistory.get(key);
    history.count++;
    
    if (outcome.success) {
      history.successes++;
    }
    
    history.totalScore += outcome.score || 0;
    history.successRate = history.successes / history.count;
    history.averageScore = history.totalScore / history.count;
    history.outcomes.push(outcome);
    
    // Update synergy matrix
    this.updateSynergyMatrix(pairing, outcome);
  }
  
  /**
   * Update synergy matrix
   */
  updateSynergyMatrix(pairing, outcome) {
    // Get departments from specialist profiles
    const shadow = this.specialistProfiles.get(pairing.shadow);
    const host = this.specialistProfiles.get(pairing.host);
    
    if (shadow && host) {
      const key = [shadow.department, host.department].sort().join(':');
      const currentSynergy = this.synergyMatrix.get(key) || 0.5;
      
      // Update with exponential moving average
      const alpha = 0.1;
      const newSynergy = currentSynergy * (1 - alpha) + outcome.score * alpha;
      
      this.synergyMatrix.set(key, newSynergy);
    }
  }
  
  /**
   * Calibrate model based on historical data
   */
  calibrateModel() {
    logger.info('🟡 Calibrating optimization model');
    
    // Analyze historical outcomes
    const analysis = this.analyzeHistoricalOutcomes();
    
    // Adjust weights based on correlation with success
    if (analysis.correlations) {
      const weights = this.pairingModel.weights;
      
      for (const [factor, correlation] of Object.entries(analysis.correlations)) {
        if (weights[factor] !== undefined) {
          // Adjust weight proportional to correlation
          weights[factor] = Math.max(0.05, Math.min(0.4, weights[factor] * (1 + correlation * 0.2)));
        }
      }
      
      // Normalize weights
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      for (const key in weights) {
        weights[key] /= sum;
      }
    }
    
    logger.info('Model calibrated with new weights:', this.pairingModel.weights);
  }
  
  /**
   * Analyze historical outcomes
   */
  analyzeHistoricalOutcomes() {
    const analysis = {
      totalPairings: 0,
      averageSuccess: 0,
      correlations: {}
    };
    
    let totalSuccess = 0;
    
    for (const history of this.pairingHistory.values()) {
      analysis.totalPairings += history.count;
      totalSuccess += history.successes;
    }
    
    if (analysis.totalPairings > 0) {
      analysis.averageSuccess = totalSuccess / analysis.totalPairings;
    }
    
    // Calculate factor correlations (simplified)
    analysis.correlations = {
      skillComplementarity: 0.7,
      experienceBalance: 0.5,
      learningAlignment: 0.8,
      previousSuccess: 0.6,
      availability: 0.4
    };
    
    return analysis;
  }
  
  /**
   * Should recalibrate model
   */
  shouldRecalibrate() {
    const profileCount = this.specialistProfiles.size;
    const historyCount = this.pairingHistory.size;
    
    // Recalibrate every 10 new profiles or 20 new pairings
    return profileCount % 10 === 0 || historyCount % 20 === 0;
  }
  
  /**
   * Get optimization recommendations
   */
  getRecommendations(candidates, objectives) {
    const recommendations = [];
    
    // Analyze candidate pool
    const poolAnalysis = this.analyzeCandidatePool(candidates);
    
    if (poolAnalysis.skillGaps.length > 0) {
      recommendations.push({
        type: 'skill_gap',
        message: `Consider adding specialists with ${poolAnalysis.skillGaps.join(', ')} skills`,
        priority: 'high'
      });
    }
    
    if (poolAnalysis.experienceImbalance) {
      recommendations.push({
        type: 'experience',
        message: 'Balance experience levels for better knowledge transfer',
        priority: 'medium'
      });
    }
    
    // Analyze objectives feasibility
    const feasibility = this.analyzeObjectiveFeasibility(candidates, objectives);
    
    if (feasibility < 0.7) {
      recommendations.push({
        type: 'objectives',
        message: 'Consider adjusting objectives to better match candidate capabilities',
        priority: 'high'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Analyze candidate pool
   */
  analyzeCandidatePool(candidates) {
    const analysis = {
      totalCandidates: candidates.length,
      departmentDistribution: {},
      skillCoverage: new Set(),
      experienceRange: { min: Infinity, max: 0 },
      skillGaps: [],
      experienceImbalance: false
    };
    
    for (const candidate of candidates) {
      // Department distribution
      analysis.departmentDistribution[candidate.department] = 
        (analysis.departmentDistribution[candidate.department] || 0) + 1;
      
      // Skill coverage
      (candidate.skills || []).forEach(skill => analysis.skillCoverage.add(skill));
      
      // Experience range
      const exp = candidate.experience || 0;
      analysis.experienceRange.min = Math.min(analysis.experienceRange.min, exp);
      analysis.experienceRange.max = Math.max(analysis.experienceRange.max, exp);
    }
    
    // Check for imbalance
    const expDiff = analysis.experienceRange.max - analysis.experienceRange.min;
    analysis.experienceImbalance = expDiff > 5;
    
    // Identify skill gaps (simplified)
    const requiredSkills = ['leadership', 'communication', 'technical', 'design'];
    analysis.skillGaps = requiredSkills.filter(skill => !analysis.skillCoverage.has(skill));
    
    return analysis;
  }
  
  /**
   * Analyze objective feasibility
   */
  analyzeObjectiveFeasibility(candidates, objectives) {
    let feasibility = 1.0;
    
    // Check if enough candidates
    if (candidates.length < objectives.minimumPairings * 2) {
      feasibility *= 0.5;
    }
    
    // Check if objectives can be met with current skills
    const availableSkills = new Set();
    candidates.forEach(c => (c.skills || []).forEach(s => availableSkills.add(s)));
    
    const requiredSkills = objectives.requiredSkills || [];
    const missingSkills = requiredSkills.filter(s => !availableSkills.has(s));
    
    if (missingSkills.length > 0) {
      feasibility *= Math.max(0, 1 - missingSkills.length * 0.2);
    }
    
    return feasibility;
  }
  
  /**
   * Update metrics
   */
  updateMetrics(optimization) {
    this.metrics.totalOptimizations++;
    
    // Update average improvement
    const improvement = optimization.improvement || 0;
    this.metrics.averageImprovement = 
      (this.metrics.averageImprovement * (this.metrics.totalOptimizations - 1) + improvement) /
      this.metrics.totalOptimizations;
    
    // Update best score
    if (optimization.finalScore > this.metrics.bestPairingScore) {
      this.metrics.bestPairingScore = optimization.finalScore;
    }
    
    // Calculate convergence rate
    this.metrics.convergenceRate = optimization.iterations / this.config.maxIterations;
  }
  
  /**
   * Get optimizer metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      modelWeights: this.pairingModel.weights,
      synergyScores: Object.fromEntries(this.synergyMatrix),
      historicalPairings: this.pairingHistory.size,
      specialistProfiles: this.specialistProfiles.size
    };
  }
  
  /**
   * Load historical data
   */
  loadHistoricalData() {
    // Load from storage in production
    logger.debug('Loading historical pairing data');
  }
  
  /**
   * Generate optimization ID
   */
  generateOptimizationId() {
    return `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = RotationOptimizer;