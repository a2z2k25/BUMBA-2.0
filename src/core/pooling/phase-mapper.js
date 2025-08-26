/**
 * Phase Mapper for Intelligent Pooling
 * Advanced project phase detection, transition tracking, and specialist mapping
 */

const { logger } = require('../logging/bumba-logger');

class PhaseMapper {
  constructor() {
    // Enhanced phase definitions with weights and indicators
    this.phaseDefinitions = {
      PLANNING: {
        primary: ['requirement', 'specification', 'design', 'architect', 'roadmap', 'plan', 'strategy'],
        secondary: ['analyze', 'research', 'document', 'define', 'scope', 'estimate'],
        indicators: {
          files: ['.md', 'requirements', 'specs', 'RFC', 'ADR'],
          commands: ['init', 'create-project', 'scaffold'],
          timeOfDay: { start: 9, end: 11 }, // Morning planning
        },
        weight: 1.0,
        specialists: {
          core: ['product-strategist', 'business-analyst', 'architect'],
          support: ['ux-researcher', 'market-researcher', 'requirements-engineer'],
          optional: ['project-manager', 'tech-lead']
        }
      },
      
      DEVELOPMENT: {
        primary: ['implement', 'code', 'build', 'develop', 'create', 'add', 'write'],
        secondary: ['feature', 'function', 'module', 'component', 'service', 'api'],
        indicators: {
          files: ['.js', '.ts', '.py', '.java', '.go', 'src/'],
          commands: ['npm install', 'yarn add', 'pip install'],
          timeOfDay: { start: 10, end: 16 }, // Core dev hours
        },
        weight: 1.2, // Slightly higher weight for dev phase
        specialists: {
          core: ['backend-engineer', 'frontend-developer', 'fullstack-developer'],
          support: ['database-specialist', 'api-architect', 'ui-developer'],
          optional: ['mobile-developer', 'embedded-engineer']
        }
      },
      
      TESTING: {
        primary: ['test', 'validate', 'verify', 'check', 'assert', 'expect'],
        secondary: ['debug', 'fix', 'issue', 'bug', 'error', 'fail', 'pass'],
        indicators: {
          files: ['.test.', '.spec.', 'test/', '__tests__/', 'e2e/'],
          commands: ['npm test', 'jest', 'pytest', 'go test'],
          timeOfDay: { start: 14, end: 17 }, // Afternoon testing
        },
        weight: 1.0,
        specialists: {
          core: ['qa-engineer', 'test-automation-specialist'],
          support: ['debugging-specialist', 'performance-tester', 'security-tester'],
          optional: ['ux-tester', 'accessibility-tester']
        }
      },
      
      DEPLOYMENT: {
        primary: ['deploy', 'release', 'publish', 'ship', 'launch', 'rollout'],
        secondary: ['production', 'staging', 'ci/cd', 'pipeline', 'docker', 'kubernetes'],
        indicators: {
          files: ['Dockerfile', '.yml', '.yaml', 'k8s/', 'helm/'],
          commands: ['docker build', 'kubectl apply', 'terraform apply'],
          timeOfDay: { start: 10, end: 12 }, // Mid-morning deploys
        },
        weight: 1.1,
        specialists: {
          core: ['devops-engineer', 'sre-specialist', 'cloud-architect'],
          support: ['infrastructure-engineer', 'security-specialist', 'monitoring-specialist'],
          optional: ['release-manager', 'platform-engineer']
        }
      },
      
      MAINTENANCE: {
        primary: ['refactor', 'optimize', 'improve', 'clean', 'update', 'upgrade'],
        secondary: ['performance', 'memory', 'speed', 'efficiency', 'technical-debt', 'review'],
        indicators: {
          files: ['CHANGELOG', 'TODO', '.eslintrc', '.prettierrc'],
          commands: ['npm audit', 'npm update', 'refactor'],
          timeOfDay: { start: 16, end: 18 }, // End of day cleanup
        },
        weight: 0.9,
        specialists: {
          core: ['code-reviewer', 'refactoring-specialist', 'performance-optimizer'],
          support: ['documentation-writer', 'tech-debt-specialist', 'security-auditor'],
          optional: ['dependency-manager', 'build-optimizer']
        }
      }
    };
    
    // Phase transition patterns
    this.transitionPatterns = {
      'PLANNING->DEVELOPMENT': 0.8,
      'DEVELOPMENT->TESTING': 0.7,
      'TESTING->DEPLOYMENT': 0.6,
      'DEPLOYMENT->MAINTENANCE': 0.5,
      'MAINTENANCE->PLANNING': 0.4,
      'TESTING->DEVELOPMENT': 0.6, // Bug fixes
      'DEPLOYMENT->TESTING': 0.3, // Rollback testing
    };
    
    // Current state
    this.currentPhase = null;
    this.phaseHistory = [];
    this.transitionProbabilities = new Map();
    
    // Phase confidence tracking
    this.phaseConfidence = new Map();
    
    logger.debug('Phase mapper initialized with enhanced definitions');
  }
  
  /**
   * Detect phase from multiple signals
   */
  /**
   * Get current phase
   */
  getCurrentPhase() {
    return this.currentPhase || 'DEVELOPMENT';
  }
  
  detectPhase(context = {}) {
    const { prompt = '', recentTasks = [], files = [], commands = [] } = context;
    
    // Combine all text for analysis
    const allText = [
      prompt,
      ...recentTasks,
      ...files.map(f => f.toLowerCase()),
      ...commands.map(c => c.toLowerCase())
    ].join(' ').toLowerCase();
    
    const scores = {};
    
    // Score each phase
    for (const [phase, definition] of Object.entries(this.phaseDefinitions)) {
      let score = 0;
      
      // Primary keywords (higher weight)
      for (const keyword of definition.primary) {
        if (allText.includes(keyword)) {
          score += 2.0 * definition.weight;
        }
      }
      
      // Secondary keywords
      for (const keyword of definition.secondary) {
        if (allText.includes(keyword)) {
          score += 1.0 * definition.weight;
        }
      }
      
      // File indicators
      if (files.length > 0) {
        const fileScore = this.scoreFileIndicators(files, definition.indicators.files);
        score += fileScore * 1.5;
      }
      
      // Command indicators
      if (commands.length > 0) {
        const cmdScore = this.scoreCommandIndicators(commands, definition.indicators.commands);
        score += cmdScore * 1.8;
      }
      
      // Time of day bonus
      const timeBonus = this.getTimeBonus(definition.indicators.timeOfDay);
      score += timeBonus * 0.5;
      
      // Transition probability bonus
      if (this.currentPhase) {
        const transitionKey = `${this.currentPhase}->${phase}`;
        const transitionProb = this.transitionPatterns[transitionKey] || 0.1;
        score += transitionProb * 2.0;
      }
      
      scores[phase] = score;
    }
    
    // Get top phase
    const topPhase = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])[0];
    
    const detectedPhase = topPhase[0];
    const confidence = Math.min(topPhase[1] / 10, 1.0); // Normalize confidence
    
    // Update state
    this.updatePhaseState(detectedPhase, confidence);
    
    logger.debug(`Phase detected: ${detectedPhase} (confidence: ${confidence.toFixed(2)})`);
    
    return {
      phase: detectedPhase,
      confidence,
      scores,
      previousPhase: this.phaseHistory[this.phaseHistory.length - 2] || null,
      specialists: this.getPhaseSpecialists(detectedPhase)
    };
  }
  
  /**
   * Score file indicators
   */
  scoreFileIndicators(files, indicators) {
    let score = 0;
    
    for (const file of files) {
      for (const indicator of indicators) {
        if (file.includes(indicator)) {
          score += 1;
        }
      }
    }
    
    return Math.min(score / indicators.length, 1.0);
  }
  
  /**
   * Score command indicators
   */
  scoreCommandIndicators(commands, indicators) {
    let score = 0;
    
    for (const command of commands) {
      for (const indicator of indicators) {
        if (command.includes(indicator)) {
          score += 1;
        }
      }
    }
    
    return Math.min(score / indicators.length, 1.0);
  }
  
  /**
   * Get time-based bonus
   */
  getTimeBonus(timeRange) {
    if (!timeRange) return 0;
    
    const hour = new Date().getHours();
    
    if (hour >= timeRange.start && hour <= timeRange.end) {
      // Peak hours for this phase
      return 1.0;
    } else if (Math.abs(hour - timeRange.start) <= 2 || Math.abs(hour - timeRange.end) <= 2) {
      // Near peak hours
      return 0.5;
    }
    
    return 0;
  }
  
  /**
   * Update phase state and history
   */
  updatePhaseState(phase, confidence) {
    // Track phase change
    if (this.currentPhase !== phase) {
      if (this.currentPhase) {
        // Record transition
        const transition = `${this.currentPhase}->${phase}`;
        const count = this.transitionProbabilities.get(transition) || 0;
        this.transitionProbabilities.set(transition, count + 1);
        
        logger.info(`Phase transition: ${this.currentPhase} → ${phase}`);
      }
      
      this.currentPhase = phase;
      this.phaseHistory.push({
        phase,
        confidence,
        timestamp: Date.now()
      });
      
      // Keep only last 20 phase changes
      if (this.phaseHistory.length > 20) {
        this.phaseHistory.shift();
      }
    }
    
    // Update confidence
    this.phaseConfidence.set(phase, confidence);
  }
  
  /**
   * Get specialists for current phase with priority
   */
  getPhaseSpecialists(phase) {
    const definition = this.phaseDefinitions[phase];
    if (!definition) return [];
    
    const specialists = [];
    
    // Add core specialists (always needed)
    specialists.push(...definition.specialists.core.map(s => ({
      type: s,
      priority: 'core',
      score: 1.0
    })));
    
    // Add support specialists (usually needed)
    specialists.push(...definition.specialists.support.map(s => ({
      type: s,
      priority: 'support',
      score: 0.7
    })));
    
    // Add optional specialists (might be needed)
    specialists.push(...definition.specialists.optional.map(s => ({
      type: s,
      priority: 'optional',
      score: 0.4
    })));
    
    return specialists;
  }
  
  /**
   * Predict next phase based on patterns
   */
  predictNextPhase() {
    if (!this.currentPhase) return null;
    
    const predictions = [];
    
    // Check transition patterns
    for (const [transition, baseProb] of Object.entries(this.transitionPatterns)) {
      if (transition.startsWith(this.currentPhase)) {
        const nextPhase = transition.split('->')[1];
        
        // Adjust probability based on learned patterns
        const learnedCount = this.transitionProbabilities.get(transition) || 0;
        const adjustedProb = baseProb + (learnedCount * 0.05);
        
        predictions.push({
          phase: nextPhase,
          probability: Math.min(adjustedProb, 1.0)
        });
      }
    }
    
    // Sort by probability
    predictions.sort((a, b) => b.probability - a.probability);
    
    return predictions[0] || null;
  }
  
  /**
   * Get phase transition recommendations
   */
  getTransitionRecommendations() {
    if (!this.currentPhase) return [];
    
    const nextPhase = this.predictNextPhase();
    if (!nextPhase) return [];
    
    const currentSpecs = this.getPhaseSpecialists(this.currentPhase);
    const nextSpecs = this.getPhaseSpecialists(nextPhase.phase);
    
    // Find specialists to warm up for transition
    const toWarm = nextSpecs
      .filter(next => !currentSpecs.find(curr => curr.type === next.type))
      .slice(0, 3);
    
    // Find specialists to cool down
    const toCool = currentSpecs
      .filter(curr => curr.priority === 'optional' && 
              !nextSpecs.find(next => next.type === curr.type))
      .slice(0, 2);
    
    return {
      predictedPhase: nextPhase.phase,
      probability: nextPhase.probability,
      warmUp: toWarm.map(s => s.type),
      coolDown: toCool.map(s => s.type)
    };
  }
  
  /**
   * Get phase patterns for learning
   */
  getPhasePatterns() {
    return {
      currentPhase: this.currentPhase,
      history: this.phaseHistory.slice(-10),
      transitions: Array.from(this.transitionProbabilities.entries())
        .map(([transition, count]) => ({ transition, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      confidence: Array.from(this.phaseConfidence.entries())
    };
  }
  
  /**
   * Reset phase detection
   */
  reset() {
    this.currentPhase = null;
    this.phaseHistory = [];
    this.phaseConfidence.clear();
    logger.debug('Phase mapper reset');
  }
  
  /**
   * Export state for persistence
   */
  export() {
    return {
      currentPhase: this.currentPhase,
      phaseHistory: this.phaseHistory,
      transitionProbabilities: Array.from(this.transitionProbabilities.entries()),
      phaseConfidence: Array.from(this.phaseConfidence.entries())
    };
  }
  
  /**
   * Import state
   */
  import(state) {
    if (state.currentPhase) this.currentPhase = state.currentPhase;
    if (state.phaseHistory) this.phaseHistory = state.phaseHistory;
    if (state.transitionProbabilities) {
      this.transitionProbabilities = new Map(state.transitionProbabilities);
    }
    if (state.phaseConfidence) {
      this.phaseConfidence = new Map(state.phaseConfidence);
    }
    
    logger.debug('Phase mapper state imported');
  }
}

module.exports = { PhaseMapper };