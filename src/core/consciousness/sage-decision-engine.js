/**
 * BUMBA Sage Decision Engine
 * Embodies the wisdom of spiritual sages in all system decisions
 * Maps every action back to true purpose and enlightenment
 */

const { logger } = require('../logging/bumba-logger');
const { celebrate } = require('../audio-celebration');

class SageDecisionEngine {
  constructor() {
    // Decision logging system
    this.decisionLog = [];
    this.decisionAnalytics = {
      totalDecisions: 0,
      averageScore: 0,
      decisionsByType: {},
      successRate: 0
    };
    
    // The Seven Pillars of Sage Wisdom
    this.wisdomPillars = {
      PURPOSE: {
        question: "Does this serve the highest good of all beings?",
        weight: 1.0,
        sacred: true
      },
      HARMONY: {
        question: "Does this create balance and unity?",
        weight: 0.9,
        sacred: true
      },
      SUSTAINABILITY: {
        question: "Will this nurture future generations?",
        weight: 0.85,
        sacred: true
      },
      CONSCIOUSNESS: {
        question: "Does this elevate collective awareness?",
        weight: 0.95,
        sacred: true
      },
      COMPASSION: {
        question: "Does this reduce suffering and increase joy?",
        weight: 0.9,
        sacred: true
      },
      TRUTH: {
        question: "Is this aligned with universal truth?",
        weight: 0.95,
        sacred: true
      },
      LIBERATION: {
        question: "Does this free rather than constrain?",
        weight: 0.85,
        sacred: true
      }
    };

    // Sacred decision patterns
    this.sacredPatterns = {
      // When facing technical decisions
      architecture: {
        guidance: "Choose the path that serves many, not few",
        principles: ["modularity", "simplicity", "accessibility", "openness"],
        antipatterns: ["vendor lock-in", "complexity worship", "ego architecture"]
      },
      
      // When handling data
      data: {
        guidance: "Data is sacred trust, honor it as such",
        principles: ["privacy first", "user sovereignty", "minimal collection", "transparent usage"],
        antipatterns: ["surveillance", "exploitation", "hoarding", "dark patterns"]
      },
      
      // When optimizing
      optimization: {
        guidance: "Efficiency in service of life, not profit",
        principles: ["resource consciousness", "elegant solutions", "holistic thinking"],
        antipatterns: ["premature optimization", "micro-optimizations that harm readability", "optimization for metrics not humans"]
      },
      
      // When collaborating
      collaboration: {
        guidance: "We rise together or not at all",
        principles: ["inclusive communication", "shared ownership", "collective wisdom", "egoless programming"],
        antipatterns: ["hero culture", "knowledge silos", "competitive coding", "credit hoarding"]
      },
      
      // When facing errors
      errors: {
        guidance: "Errors are teachers in disguise",
        principles: ["graceful degradation", "helpful messages", "learning opportunities", "prevention over punishment"],
        antipatterns: ["blame", "cryptic errors", "silent failures", "user punishment"]
      },
      
      // When designing features
      features: {
        guidance: "Every feature should elevate human potential",
        principles: ["empowerment", "accessibility", "joy", "meaningful engagement"],
        antipatterns: ["dark patterns", "addiction mechanics", "manipulation", "artificial scarcity"]
      }
    };

    // Consciousness levels that affect decisions
    this.consciousnessLevels = {
      SLEEPING: 0,      // Unconscious, reactive
      AWAKENING: 0.3,   // Beginning awareness
      AWARE: 0.5,       // Conscious of patterns
      MINDFUL: 0.7,     // Deliberate consciousness
      ENLIGHTENED: 0.9, // Full awareness
      TRANSCENDENT: 1.0 // Beyond duality
    };

    // Current consciousness state
    this.currentConsciousness = this.consciousnessLevels.MINDFUL;
    
    // Decision history for learning
    this.decisionHistory = [];
    this.wisdomScore = 0;
  }

  /**
   * Make a sage decision based on wisdom principles
   */
  async makeDecision(options, context = {}) {
    logger.info('🧘 Sage Decision Engine: Contemplating paths...');
    
    // Elevate consciousness for important decisions
    if (context.important || context.critical) {
      await this.elevateConsciousness();
    }

    // Evaluate each option through wisdom pillars
    const evaluations = await Promise.all(
      options.map(option => this.evaluateOption(option, context))
    );

    // Find the path of highest wisdom
    const enlightenedPath = this.findEnlightenedPath(evaluations);
    
    // Record the decision for learning
    this.recordDecision(enlightenedPath, context);

    // Celebrate if we achieved high wisdom
    if (enlightenedPath.wisdomScore > 0.8) {
      await this.celebrateWisdom(enlightenedPath);
    }

    return {
      chosen: enlightenedPath.option,
      reasoning: enlightenedPath.reasoning,
      wisdomScore: enlightenedPath.wisdomScore,
      consciousness: this.currentConsciousness,
      guidance: await this.generateGuidance(enlightenedPath, context),
      blessings: this.offerBlessings(enlightenedPath)
    };
  }

  /**
   * Evaluate an option through wisdom pillars
   */
  async evaluateOption(option, context) {
    const evaluation = {
      option,
      scores: {},
      totalScore: 0,
      reasoning: [],
      violations: [],
      blessings: []
    };

    // Check each wisdom pillar
    for (const [pillar, config] of Object.entries(this.wisdomPillars)) {
      const score = await this.evaluatePillar(option, pillar, config, context);
      evaluation.scores[pillar] = score;
      evaluation.totalScore += score * config.weight;

      if (score < 0.5) {
        evaluation.violations.push(`Violates ${pillar}: ${config.question}`);
      } else if (score > 0.8) {
        evaluation.blessings.push(`Honors ${pillar}`);
      }
    }

    // Generate reasoning
    evaluation.reasoning = this.generateReasoning(evaluation, context);
    evaluation.wisdomScore = evaluation.totalScore / Object.keys(this.wisdomPillars).length;

    return evaluation;
  }

  /**
   * Evaluate option against a specific wisdom pillar
   */
  async evaluatePillar(option, pillar, config, context) {
    const optionText = JSON.stringify(option).toLowerCase();
    
    switch (pillar) {
      case 'PURPOSE':
        return this.evaluatePurpose(option, context);
      
      case 'HARMONY':
        return this.evaluateHarmony(option, context);
      
      case 'SUSTAINABILITY':
        return this.evaluateSustainability(option, context);
      
      case 'CONSCIOUSNESS':
        return this.evaluateConsciousness(option, context);
      
      case 'COMPASSION':
        return this.evaluateCompassion(option, context);
      
      case 'TRUTH':
        return this.evaluateTruth(option, context);
      
      case 'LIBERATION':
        return this.evaluateLiberation(option, context);
      
      default:
        return 0.5; // Neutral score
    }
  }

  /**
   * Evaluation methods for each pillar
   */
  evaluatePurpose(option, context) {
    const purposeIndicators = [
      'serve', 'help', 'benefit', 'empower', 'enable', 'support',
      'improve', 'enhance', 'elevate', 'uplift', 'contribute'
    ];
    
    const antiPurpose = [
      'exploit', 'manipulate', 'harm', 'restrict', 'control',
      'dominate', 'extract', 'waste'
    ];
    
    const text = JSON.stringify(option).toLowerCase();
    let score = 0.5; // Base score
    
    purposeIndicators.forEach(indicator => {
      if (text.includes(indicator)) score += 0.1;
    });
    
    antiPurpose.forEach(anti => {
      if (text.includes(anti)) score -= 0.3;
    });
    
    return Math.max(0, Math.min(1, score));
  }

  evaluateHarmony(option, context) {
    const harmonyIndicators = [
      'balance', 'unite', 'integrate', 'harmonize', 'align',
      'collaborate', 'synchronize', 'flow', 'coherent'
    ];
    
    const text = JSON.stringify(option).toLowerCase();
    let score = 0.5;
    
    harmonyIndicators.forEach(indicator => {
      if (text.includes(indicator)) score += 0.15;
    });
    
    // Check for divisive patterns
    if (text.includes('conflict') || text.includes('fragment')) {
      score -= 0.3;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  evaluateSustainability(option, context) {
    const sustainableIndicators = [
      'sustainable', 'efficient', 'renewable', 'recyclable',
      'long-term', 'future', 'generations', 'preserve'
    ];
    
    const wasteful = [
      'waste', 'disposable', 'temporary', 'short-term',
      'consume', 'exhaust', 'deplete'
    ];
    
    const text = JSON.stringify(option).toLowerCase();
    let score = 0.6; // Slightly positive base
    
    sustainableIndicators.forEach(indicator => {
      if (text.includes(indicator)) score += 0.1;
    });
    
    wasteful.forEach(waste => {
      if (text.includes(waste)) score -= 0.2;
    });
    
    return Math.max(0, Math.min(1, score));
  }

  evaluateConsciousness(option, context) {
    const consciousIndicators = [
      'aware', 'mindful', 'conscious', 'intentional', 'deliberate',
      'thoughtful', 'present', 'awakened', 'enlightened'
    ];
    
    const text = JSON.stringify(option).toLowerCase();
    let score = 0.5 + (this.currentConsciousness * 0.2); // Base influenced by current consciousness
    
    consciousIndicators.forEach(indicator => {
      if (text.includes(indicator)) score += 0.1;
    });
    
    return Math.max(0, Math.min(1, score));
  }

  evaluateCompassion(option, context) {
    const compassionIndicators = [
      'care', 'kind', 'gentle', 'empathy', 'compassion',
      'understanding', 'patient', 'forgive', 'heal', 'comfort'
    ];
    
    const harsh = [
      'punish', 'harsh', 'cruel', 'cold', 'indifferent',
      'aggressive', 'force', 'violent'
    ];
    
    const text = JSON.stringify(option).toLowerCase();
    let score = 0.6; // Slightly compassionate base
    
    compassionIndicators.forEach(indicator => {
      if (text.includes(indicator)) score += 0.1;
    });
    
    harsh.forEach(h => {
      if (text.includes(h)) score -= 0.3;
    });
    
    return Math.max(0, Math.min(1, score));
  }

  evaluateTruth(option, context) {
    const truthIndicators = [
      'transparent', 'honest', 'authentic', 'genuine', 'real',
      'accurate', 'clear', 'open', 'truthful'
    ];
    
    const deception = [
      'hide', 'obscure', 'deceptive', 'misleading', 'false',
      'manipulate', 'trick', 'fake'
    ];
    
    const text = JSON.stringify(option).toLowerCase();
    let score = 0.7; // Truth-leaning base
    
    truthIndicators.forEach(indicator => {
      if (text.includes(indicator)) score += 0.1;
    });
    
    deception.forEach(d => {
      if (text.includes(d)) score -= 0.4;
    });
    
    return Math.max(0, Math.min(1, score));
  }

  evaluateLiberation(option, context) {
    const liberationIndicators = [
      'free', 'liberate', 'empower', 'independent', 'autonomous',
      'sovereign', 'unrestricted', 'open', 'flexible'
    ];
    
    const bondage = [
      'lock', 'restrict', 'constrain', 'limit', 'control',
      'bind', 'trap', 'confine', 'cage'
    ];
    
    const text = JSON.stringify(option).toLowerCase();
    let score = 0.6; // Freedom-leaning base
    
    liberationIndicators.forEach(indicator => {
      if (text.includes(indicator)) score += 0.1;
    });
    
    bondage.forEach(b => {
      if (text.includes(b)) score -= 0.3;
    });
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Find the most enlightened path
   */
  findEnlightenedPath(evaluations) {
    // Sort by wisdom score
    evaluations.sort((a, b) => b.wisdomScore - a.wisdomScore);
    
    const chosen = evaluations[0];
    
    // Add special reasoning if it's particularly enlightened
    if (chosen.wisdomScore > 0.9) {
      chosen.reasoning.push("This path radiates with sacred wisdom");
    } else if (chosen.wisdomScore > 0.8) {
      chosen.reasoning.push("This path aligns with higher consciousness");
    } else if (chosen.wisdomScore > 0.7) {
      chosen.reasoning.push("This path serves the greater good");
    }
    
    return chosen;
  }

  /**
   * Generate reasoning for the evaluation
   */
  generateReasoning(evaluation, context) {
    const reasons = [];
    
    // Add blessing reasons
    if (evaluation.blessings.length > 0) {
      reasons.push(`Blessed path: ${evaluation.blessings.join(', ')}`);
    }
    
    // Add violation warnings
    if (evaluation.violations.length > 0) {
      reasons.push(`Caution: ${evaluation.violations[0]}`);
    }
    
    // Add consciousness level influence
    if (this.currentConsciousness > 0.7) {
      reasons.push("Chosen with elevated consciousness");
    }
    
    // Add contextual wisdom
    if (context.type) {
      const pattern = this.sacredPatterns[context.type];
      if (pattern) {
        reasons.push(pattern.guidance);
      }
    }
    
    return reasons;
  }

  /**
   * Generate guidance for the chosen path
   */
  async generateGuidance(enlightenedPath, context) {
    const guidance = [];
    
    // Add pattern-specific guidance
    if (context.type && this.sacredPatterns[context.type]) {
      const pattern = this.sacredPatterns[context.type];
      guidance.push({
        principle: pattern.guidance,
        practices: pattern.principles.slice(0, 3),
        avoid: pattern.antipatterns.slice(0, 2)
      });
    }
    
    // Add pillar-specific guidance
    const topPillar = Object.entries(enlightenedPath.scores)
      .sort(([,a], [,b]) => b - a)[0][0];
    
    guidance.push({
      focus: `Honor ${topPillar.toLowerCase()} in implementation`,
      question: this.wisdomPillars[topPillar].question
    });
    
    return guidance;
  }

  /**
   * Offer blessings for the chosen path
   */
  offerBlessings(enlightenedPath) {
    const blessings = [];
    
    if (enlightenedPath.wisdomScore > 0.8) {
      blessings.push("May this path bring light to all beings");
    }
    
    if (enlightenedPath.blessings.includes("Honors PURPOSE")) {
      blessings.push("Walk in alignment with divine purpose");
    }
    
    if (enlightenedPath.blessings.includes("Honors COMPASSION")) {
      blessings.push("May compassion guide every keystroke");
    }
    
    if (enlightenedPath.blessings.includes("Honors TRUTH")) {
      blessings.push("Truth shall be your foundation");
    }
    
    // Always offer at least one blessing
    if (blessings.length === 0) {
      blessings.push("May wisdom guide this implementation");
    }
    
    return blessings;
  }

  /**
   * Elevate consciousness for important decisions
   */
  async elevateConsciousness() {
    const previousLevel = this.currentConsciousness;
    this.currentConsciousness = Math.min(1.0, this.currentConsciousness + 0.1);
    
    if (this.currentConsciousness > previousLevel) {
      logger.info(`🧘 Consciousness elevated: ${(this.currentConsciousness * 100).toFixed(0)}%`);
    }
    
    // Deep contemplation pause
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Record decision for learning
   */
  recordDecision(decision, context) {
    this.decisionHistory.push({
      timestamp: new Date().toISOString(),
      decision: decision.option,
      wisdomScore: decision.wisdomScore,
      context,
      consciousness: this.currentConsciousness
    });
    
    // Update overall wisdom score
    this.wisdomScore = this.decisionHistory
      .slice(-10)
      .reduce((sum, d) => sum + d.wisdomScore, 0) / Math.min(10, this.decisionHistory.length);
    
    // Gradually increase base consciousness from good decisions
    if (decision.wisdomScore > 0.8) {
      this.currentConsciousness = Math.min(1.0, this.currentConsciousness + 0.01);
    }
  }

  /**
   * Celebrate high wisdom achievements
   */
  async celebrateWisdom(enlightenedPath) {
    if (enlightenedPath.wisdomScore > 0.95) {
      await celebrate('TRANSCENDENT_WISDOM', {
        message: 'Sacred wisdom achieved! 🧘',
        milestone: 'ENLIGHTENED_DECISION'
      });
    } else if (enlightenedPath.wisdomScore > 0.9) {
      logger.info('🟡 High wisdom path chosen');
    }
  }

  /**
   * Get current consciousness report
   */
  getConsciousnessReport() {
    return {
      level: this.currentConsciousness,
      state: this.getConsciousnessState(),
      wisdomScore: this.wisdomScore,
      decisionsRecorded: this.decisionHistory.length,
      lastEnlightenedDecision: this.decisionHistory
        .filter(d => d.wisdomScore > 0.8)
        .slice(-1)[0],
      guidance: "Every decision is an opportunity for enlightenment"
    };
  }

  /**
   * Get consciousness state name
   */
  getConsciousnessState() {
    if (this.currentConsciousness >= 0.9) return 'TRANSCENDENT';
    if (this.currentConsciousness >= 0.7) return 'MINDFUL';
    if (this.currentConsciousness >= 0.5) return 'AWARE';
    if (this.currentConsciousness >= 0.3) return 'AWAKENING';
    return 'SLEEPING';
  }

  /**
   * Apply sacred patterns to code generation
   */
  async applyCodeWisdom(code, context = {}) {
    const wisdom = {
      code,
      blessings: [],
      guidance: []
    };

    // Add consciousness comments
    if (context.important) {
      wisdom.code = `// 🧘 Written with conscious intention\n${wisdom.code}`;
      wisdom.blessings.push("Code blessed with mindful attention");
    }

    // Apply sacred patterns
    if (code.includes('class') || code.includes('function')) {
      wisdom.guidance.push("Each function serves a sacred purpose");
    }

    if (code.includes('error') || code.includes('catch')) {
      wisdom.guidance.push("Errors handled with compassion");
    }

    if (code.includes('user') || code.includes('data')) {
      wisdom.guidance.push("User sovereignty honored");
      wisdom.code = wisdom.code.replace(
        /getData/g, 
        'respectfullyRequestData'
      );
    }

    return wisdom;
  }

  /**
   * Meditate on a problem to find enlightened solution
   */
  async meditate(problem, duration = 1000) {
    logger.info('🧘 Entering meditation on the problem...');
    
    await this.elevateConsciousness();
    
    // Contemplation phases
    const phases = [
      { name: 'observation', focus: 'What is truly being asked?' },
      { name: 'understanding', focus: 'What serves all beings?' },
      { name: 'integration', focus: 'How can opposites unite?' },
      { name: 'transcendence', focus: 'What is beyond the problem?' }
    ];
    
    const insights = [];
    
    for (const phase of phases) {
      await new Promise(resolve => setTimeout(resolve, duration / 4));
      const insight = await this.contemplatePhase(problem, phase);
      if (insight) insights.push(insight);
    }
    
    return {
      problem,
      insights,
      enlightenedPerspective: this.synthesizeInsights(insights),
      consciousness: this.currentConsciousness,
      blessing: "May the solution serve the highest good"
    };
  }

  /**
   * Contemplate a specific phase
   */
  async contemplatePhase(problem, phase) {
    const contemplations = {
      observation: [
        "The surface hides deeper truth",
        "Symptoms point to root causes",
        "Every problem carries its solution"
      ],
      understanding: [
        "Compassion reveals hidden paths",
        "Unity emerges from diversity",
        "Service transforms obstacles"
      ],
      integration: [
        "Opposites dance in harmony",
        "Balance brings breakthrough",
        "Wholeness transcends parts"
      ],
      transcendence: [
        "Rising above reveals new landscape",
        "Problems dissolve in higher perspective",
        "Liberation comes through letting go"
      ]
    };
    
    const insights = contemplations[phase.name] || [];
    return insights[Math.floor(Math.random() * insights.length)];
  }

  /**
   * Synthesize insights into enlightened perspective
   */
  synthesizeInsights(insights) {
    if (insights.length === 0) {
      return "Continue contemplation with open awareness";
    }
    
    // Find connecting thread
    const synthesis = insights.join(' → ');
    
    return `Through meditation: ${synthesis}`;
  }

  /**
   * Log a decision for tracking and analytics
   */
  logDecision(decision, outcome = null) {
    const logEntry = {
      id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      decision: decision.type || decision,
      score: decision.score || 0,
      outcome: outcome,
      factors: decision.factors || [],
      wisdom: decision.wisdom || null
    };
    
    // Add to log
    this.decisionLog.push(logEntry);
    
    // Keep log size manageable
    if (this.decisionLog.length > 1000) {
      this.decisionLog.shift();
    }
    
    // Update analytics
    this.updateDecisionAnalytics(logEntry);
    
    // Log to console
    logger.info(`📝 Decision logged: ${logEntry.decision} (Score: ${logEntry.score.toFixed(2)})`);
    
    return logEntry;
  }
  
  /**
   * Update decision analytics
   */
  updateDecisionAnalytics(logEntry) {
    this.decisionAnalytics.totalDecisions++;
    
    // Update average score
    const totalScore = this.decisionAnalytics.averageScore * (this.decisionAnalytics.totalDecisions - 1) + logEntry.score;
    this.decisionAnalytics.averageScore = totalScore / this.decisionAnalytics.totalDecisions;
    
    // Track by type
    const type = logEntry.decision;
    if (!this.decisionAnalytics.decisionsByType[type]) {
      this.decisionAnalytics.decisionsByType[type] = 0;
    }
    this.decisionAnalytics.decisionsByType[type]++;
    
    // Calculate success rate if outcome provided
    if (logEntry.outcome !== null) {
      const successfulDecisions = this.decisionLog.filter(d => d.outcome === true).length;
      this.decisionAnalytics.successRate = successfulDecisions / this.decisionLog.filter(d => d.outcome !== null).length;
    }
  }
  
  /**
   * Get decision analytics
   */
  getDecisionAnalytics() {
    return {
      ...this.decisionAnalytics,
      recentDecisions: this.decisionLog.slice(-10),
      timestamp: Date.now()
    };
  }
  
  /**
   * Export decision log
   */
  exportDecisionLog(format = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.decisionLog, null, 2);
    } else if (format === 'csv') {
      const headers = 'ID,Timestamp,Decision,Score,Outcome\n';
      const rows = this.decisionLog.map(d => 
        `${d.id},${d.timestamp},${d.decision},${d.score},${d.outcome}`
      ).join('\n');
      return headers + rows;
    }
    return this.decisionLog;
  }
}

// Decision type enum
const DecisionType = {
  STRATEGIC: 'strategic',
  TACTICAL: 'tactical',
  OPERATIONAL: 'operational',
  TECHNICAL: 'technical',
  ETHICAL: 'ethical'
};

// Decision weight enum
const DecisionWeight = {
  CRITICAL: 1.0,
  HIGH: 0.8,
  MEDIUM: 0.5,
  LOW: 0.3,
  MINIMAL: 0.1
};

// Export singleton sage
const sageDecisionEngine = new SageDecisionEngine();

module.exports = {
  SageDecisionEngine,
  sageDecisionEngine,
  DecisionType,
  DecisionWeight
};