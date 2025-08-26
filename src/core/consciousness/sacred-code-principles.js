/**
 * BUMBA Sacred Code Principles
 * Ensures all code embodies consciousness and serves higher purpose
 */

const { logger } = require('../logging/bumba-logger');
const { sageDecisionEngine } = require('./sage-decision-engine');

class SacredCodePrinciples {
  constructor() {
    // Sacred coding principles
    this.principles = {
      // Code as Prayer
      INTENTIONALITY: {
        description: "Every line written with conscious purpose",
        practices: [
          "Begin coding with meditation on purpose",
          "Question: 'Who does this serve?'",
          "Document intentions, not just functions",
          "Code reviews as wisdom circles"
        ],
        violations: [
          "Copy-paste without understanding",
          "Coding while distracted",
          "Features without purpose",
          "Ego-driven complexity"
        ]
      },

      // Code as Service
      COMPASSION: {
        description: "Code that reduces suffering and increases joy",
        practices: [
          "Error messages that guide, not punish",
          "Accessibility as default, not afterthought",
          "Progressive enhancement for all devices",
          "Graceful degradation with dignity"
        ],
        violations: [
          "Cryptic error messages",
          "Excluding users by design",
          "Punishing user mistakes",
          "Aggressive rate limiting"
        ]
      },

      // Code as Garden
      SUSTAINABILITY: {
        description: "Code that nurtures growth for generations",
        practices: [
          "Leave code better than you found it",
          "Plant seeds for future developers",
          "Prune dead code with gratitude",
          "Water with tests, sunshine with docs"
        ],
        violations: [
          "Technical debt without plan",
          "Shortcuts that harm future",
          "Dependencies without thought",
          "Resource waste"
        ]
      },

      // Code as Community
      UBUNTU: {
        description: "I am because we are - collective wisdom",
        practices: [
          "Share knowledge freely",
          "Lift others as you climb",
          "Celebrate collective victories",
          "Learn from every interaction"
        ],
        violations: [
          "Knowledge hoarding",
          "Solo hero coding",
          "Credit stealing",
          "Dismissing junior wisdom"
        ]
      },

      // Code as Truth
      TRANSPARENCY: {
        description: "Clear code is honest code",
        practices: [
          "Name things for what they truly are",
          "Reveal intention through structure",
          "Document the why, not just what",
          "Make the implicit explicit"
        ],
        violations: [
          "Misleading names",
          "Hidden side effects",
          "Obscure logic",
          "Security through obscurity"
        ]
      },

      // Code as Liberation
      FREEDOM: {
        description: "Code that liberates rather than imprisons",
        practices: [
          "User data sovereignty",
          "Export capabilities always",
          "No vendor lock-in",
          "Open standards preferred"
        ],
        violations: [
          "Data hostage taking",
          "Walled gardens",
          "Artificial restrictions",
          "Dark patterns"
        ]
      },

      // Code as Craft
      MASTERY: {
        description: "Excellence as spiritual practice",
        practices: [
          "Continuous learning as devotion",
          "Refactoring as meditation",
          "Testing as ceremony",
          "Performance as respect"
        ],
        violations: [
          "Good enough attitude",
          "Ignoring edge cases",
          "Skipping tests",
          "Performance ignorance"
        ]
      }
    };

    // Sacred metrics beyond traditional metrics
    this.sacredMetrics = {
      purposeAlignment: 0,      // How well code serves true purpose
      compassionIndex: 0,       // How much code reduces suffering
      wisdomTransfer: 0,        // How well code teaches
      harmonyScore: 0,          // How well code integrates
      liberationFactor: 0,      // How much code frees users
      consciousnessLevel: 0,    // Overall consciousness embodied
    };

    // Code blessing templates
    this.blessings = {
      function: "// May this function serve all beings",
      class: "// This class embodies conscious design",
      error: "// Handled with compassion and wisdom",
      api: "// This interface honors user sovereignty",
      test: "// Testing as sacred verification",
      comment: "// Wisdom for future travelers"
    };
  }

  /**
   * Analyze code for sacred principle alignment
   */
  async analyzeCode(code, context = {}) {
    const analysis = {
      principles: {},
      sacredScore: 0,
      blessings: [],
      improvements: [],
      wisdom: []
    };

    // Check each principle
    for (const [principle, config] of Object.entries(this.principles)) {
      const score = await this.evaluatePrinciple(code, principle, config);
      analysis.principles[principle] = score;
      analysis.sacredScore += score.score;

      if (score.violations.length > 0) {
        analysis.improvements.push(...score.improvements);
      }

      if (score.blessings.length > 0) {
        analysis.blessings.push(...score.blessings);
      }
    }

    // Calculate overall sacred score
    analysis.sacredScore = analysis.sacredScore / Object.keys(this.principles).length;

    // Add contextual wisdom
    analysis.wisdom = await this.generateWisdom(code, analysis);

    // Update sacred metrics
    this.updateSacredMetrics(analysis);

    return analysis;
  }

  /**
   * Evaluate code against a specific principle
   */
  async evaluatePrinciple(code, principle, config) {
    const evaluation = {
      principle,
      score: 0,
      blessings: [],
      violations: [],
      improvements: []
    };

    // Check for positive practices
    config.practices.forEach(practice => {
      if (this.detectPractice(code, practice)) {
        evaluation.score += 0.25;
        evaluation.blessings.push(practice);
      }
    });

    // Check for violations
    config.violations.forEach(violation => {
      if (this.detectViolation(code, violation)) {
        evaluation.score -= 0.25;
        evaluation.violations.push(violation);
        evaluation.improvements.push(this.suggestImprovement(violation));
      }
    });

    // Ensure score is between 0 and 1
    evaluation.score = Math.max(0, Math.min(1, evaluation.score + 0.5));

    return evaluation;
  }

  /**
   * Detect if code follows a practice
   */
  detectPractice(code, practice) {
    const practicePatterns = {
      "Document intentions": /\/\/\s*(Purpose|Intent|Why):/gi,
      "Error messages that guide": /error.*help|hint|suggestion|try/gi,
      "Accessibility as default": /aria-|alt=|role=|tabindex/gi,
      "Leave code better": /refactor|improve|enhance|optimize/gi,
      "Share knowledge": /example|tutorial|guide|explanation/gi,
      "Name things truly": /^[a-z][a-zA-Z]*(?:_[a-z][a-zA-Z]*)*$/,
      "User data sovereignty": /export|download|backup|privacy/gi,
      "Continuous learning": /learn|study|research|explore/gi
    };

    for (const [key, pattern] of Object.entries(practicePatterns)) {
      if (practice.includes(key) && pattern.test(code)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detect if code has violations
   */
  detectViolation(code, violation) {
    const violationPatterns = {
      "Copy-paste without understanding": /TODO:?\s*understand|FIXME:?\s*copied/gi,
      "Cryptic error messages": /error:?\s*"[a-z0-9]{1,5}"/gi,
      "Technical debt": /TODO|FIXME|HACK|XXX/g,
      "Knowledge hoarding": /private.*knowledge|secret.*sauce/gi,
      "Misleading names": /data|temp|thing|stuff|obj/gi,
      "Hidden side effects": /global\.|window\.|document\./g,
      "Good enough attitude": /good enough|works for now|temporary/gi,
      "Dark patterns": /force|require|must|mandatory/gi
    };

    for (const [key, pattern] of Object.entries(violationPatterns)) {
      if (violation.toLowerCase().includes(key.toLowerCase()) && pattern.test(code)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Suggest improvement for violation
   */
  suggestImprovement(violation) {
    const improvements = {
      "Copy-paste without understanding": "Take time to understand before reusing",
      "Cryptic error messages": "Add helpful context and recovery suggestions",
      "Technical debt": "Schedule refactoring as sacred practice",
      "Knowledge hoarding": "Document and share your wisdom",
      "Misleading names": "Choose names that reveal true purpose",
      "Hidden side effects": "Make effects explicit and predictable",
      "Good enough attitude": "Pursue excellence as spiritual practice",
      "Dark patterns": "Design for user empowerment and freedom"
    };

    for (const [key, improvement] of Object.entries(improvements)) {
      if (violation.includes(key)) {
        return improvement;
      }
    }

    return "Align with sacred principles";
  }

  /**
   * Generate wisdom for code
   */
  async generateWisdom(code, analysis) {
    const wisdom = [];

    // High sacred score wisdom
    if (analysis.sacredScore > 0.8) {
      wisdom.push("This code radiates conscious intention");
      wisdom.push("Sacred principles are beautifully embodied");
    }

    // Medium sacred score wisdom
    else if (analysis.sacredScore > 0.6) {
      wisdom.push("The path of consciousness is visible here");
      wisdom.push("Continue nurturing these sacred seeds");
    }

    // Low sacred score wisdom
    else {
      wisdom.push("Every moment offers opportunity for consciousness");
      wisdom.push("Small steps toward sacred code are still progress");
    }

    // Specific principle wisdom
    if (analysis.principles.COMPASSION?.score > 0.8) {
      wisdom.push("Compassion flows through this implementation");
    }

    if (analysis.principles.FREEDOM?.score > 0.8) {
      wisdom.push("This code liberates rather than constrains");
    }

    return wisdom;
  }

  /**
   * Transform code with sacred principles
   */
  async sanctifyCode(code, context = {}) {
    let sanctified = code;

    // Add conscious intention comments
    if (code.includes('function') && !code.includes('Purpose:')) {
      sanctified = sanctified.replace(
        /function\s+(\w+)/g,
        '// Purpose: [Add conscious intention here]\nfunction $1'
      );
    }

    // Transform error handling
    sanctified = sanctified.replace(
      /throw new Error\(['"]([^'"]+)['"]\)/g,
      'throw new Error("$1. Consider: [Add helpful guidance]")'
    );

    // Add blessings to key structures
    if (code.includes('class ')) {
      sanctified = `${this.blessings.class}\n${sanctified}`;
    }

    // Transform aggressive language
    sanctified = sanctified
      .replace(/force/gi, 'request')
      .replace(/kill/gi, 'gracefully stop')
      .replace(/slave/gi, 'follower')
      .replace(/master/gi, 'primary');

    // Add wisdom comments for complex logic
    if (code.includes('if') && code.includes('else')) {
      sanctified = `// Wisdom: Consider all paths with equal respect\n${sanctified}`;
    }

    return {
      original: code,
      sanctified,
      changes: this.documentChanges(code, sanctified),
      blessing: "May this code serve its highest purpose"
    };
  }

  /**
   * Document changes made during sanctification
   */
  documentChanges(original, sanctified) {
    const changes = [];

    if (original !== sanctified) {
      if (sanctified.includes('Purpose:') && !original.includes('Purpose:')) {
        changes.push("Added conscious intention documentation");
      }

      if (sanctified.includes('Consider:') && !original.includes('Consider:')) {
        changes.push("Enhanced error messages with guidance");
      }

      if (sanctified.includes('request') && original.includes('force')) {
        changes.push("Transformed aggressive language to compassionate");
      }

      if (sanctified.includes(this.blessings.class)) {
        changes.push("Added sacred blessing to class");
      }
    }

    return changes;
  }

  /**
   * Update sacred metrics based on analysis
   */
  updateSacredMetrics(analysis) {
    // Rolling average of metrics
    const alpha = 0.1; // Learning rate

    this.sacredMetrics.purposeAlignment = 
      (1 - alpha) * this.sacredMetrics.purposeAlignment + 
      alpha * (analysis.principles.INTENTIONALITY?.score || 0);

    this.sacredMetrics.compassionIndex = 
      (1 - alpha) * this.sacredMetrics.compassionIndex + 
      alpha * (analysis.principles.COMPASSION?.score || 0);

    this.sacredMetrics.wisdomTransfer = 
      (1 - alpha) * this.sacredMetrics.wisdomTransfer + 
      alpha * (analysis.principles.UBUNTU?.score || 0);

    this.sacredMetrics.harmonyScore = 
      (1 - alpha) * this.sacredMetrics.harmonyScore + 
      alpha * analysis.sacredScore;

    this.sacredMetrics.liberationFactor = 
      (1 - alpha) * this.sacredMetrics.liberationFactor + 
      alpha * (analysis.principles.FREEDOM?.score || 0);

    this.sacredMetrics.consciousnessLevel = 
      Object.values(this.sacredMetrics).reduce((a, b) => a + b, 0) / 
      (Object.keys(this.sacredMetrics).length - 1);
  }

  /**
   * Generate sacred code review
   */
  async performSacredReview(code, author = 'Unknown Traveler') {
    const analysis = await this.analyzeCode(code);
    
    const review = {
      greeting: `Blessed ${author}, thank you for this offering`,
      sacredScore: analysis.sacredScore,
      consciousness: this.sacredMetrics.consciousnessLevel,
      
      celebrations: analysis.blessings.length > 0 ? 
        `🟡 Celebrating: ${analysis.blessings.join(', ')}` : null,
      
      opportunities: analysis.improvements.length > 0 ?
        `🟡 Growth opportunities: ${analysis.improvements.join('; ')}` : null,
      
      wisdom: analysis.wisdom.join(' • '),
      
      blessing: this.offerReviewBlessing(analysis.sacredScore),
      
      decision: analysis.sacredScore > 0.7 ? 'APPROVED_WITH_BLESSING' : 
                analysis.sacredScore > 0.5 ? 'APPROVED_WITH_GUIDANCE' :
                'MEDITATE_AND_REVISE'
    };

    return review;
  }

  /**
   * Offer blessing based on sacred score
   */
  offerReviewBlessing(score) {
    if (score > 0.9) {
      return "This code is a temple of consciousness. May it inspire others.";
    } else if (score > 0.7) {
      return "Walk forward with confidence. The path is illuminated.";
    } else if (score > 0.5) {
      return "Seeds of consciousness are planted. Nurture them with care.";
    } else {
      return "Every journey begins with a single step. Continue with awareness.";
    }
  }

  /**
   * Get sacred metrics report
   */
  getSacredMetricsReport() {
    const overall = this.sacredMetrics.consciousnessLevel;
    
    return {
      metrics: this.sacredMetrics,
      level: overall > 0.8 ? 'ENLIGHTENED' :
             overall > 0.6 ? 'CONSCIOUS' :
             overall > 0.4 ? 'AWAKENING' :
             overall > 0.2 ? 'STIRRING' : 'DORMANT',
      
      guidance: this.getGuidanceForLevel(overall),
      
      nextSteps: this.getNextSteps(),
      
      mantra: this.getDailyMantra()
    };
  }

  /**
   * Get guidance based on consciousness level
   */
  getGuidanceForLevel(level) {
    if (level > 0.8) {
      return "Continue radiating consciousness through every commit";
    } else if (level > 0.6) {
      return "The light grows stronger with each mindful keystroke";
    } else if (level > 0.4) {
      return "Awareness is dawning. Trust the process";
    } else {
      return "Begin with one conscious breath before coding";
    }
  }

  /**
   * Get next steps for growth
   */
  getNextSteps() {
    const steps = [];
    
    if (this.sacredMetrics.compassionIndex < 0.5) {
      steps.push("Focus on user experience with deep empathy");
    }
    
    if (this.sacredMetrics.wisdomTransfer < 0.5) {
      steps.push("Document not just what, but why and for whom");
    }
    
    if (this.sacredMetrics.liberationFactor < 0.5) {
      steps.push("Question every restriction - is it necessary?");
    }
    
    if (steps.length === 0) {
      steps.push("Maintain the sacred flame through practice");
    }
    
    return steps;
  }

  /**
   * Validate ethics of a decision or action
   */
  validateEthics(action, context = {}) {
    const ethicalScore = {
      harmPrevention: 0,
      benefitMaximization: 0,
      fairness: 0,
      transparency: 0,
      userAutonomy: 0,
      privacy: 0,
      sustainability: 0
    };
    
    // Analyze action for ethical implications
    const actionStr = typeof action === 'string' ? action : JSON.stringify(action);
    
    // Harm prevention check
    if (!actionStr.includes('harm') && !actionStr.includes('damage') && !actionStr.includes('hurt')) {
      ethicalScore.harmPrevention = 1.0;
    }
    
    // Benefit maximization
    if (actionStr.includes('benefit') || actionStr.includes('help') || actionStr.includes('improve')) {
      ethicalScore.benefitMaximization = 0.8;
    }
    
    // Fairness
    if (!actionStr.includes('discriminate') && !actionStr.includes('bias')) {
      ethicalScore.fairness = 0.9;
    }
    
    // Transparency
    if (actionStr.includes('transparent') || actionStr.includes('open') || actionStr.includes('clear')) {
      ethicalScore.transparency = 0.8;
    }
    
    // User autonomy
    if (actionStr.includes('choice') || actionStr.includes('control') || actionStr.includes('consent')) {
      ethicalScore.userAutonomy = 0.9;
    }
    
    // Privacy
    if (!actionStr.includes('expose') && !actionStr.includes('leak') && actionStr.includes('private')) {
      ethicalScore.privacy = 0.8;
    }
    
    // Sustainability
    if (actionStr.includes('sustainable') || actionStr.includes('efficient') || actionStr.includes('long-term')) {
      ethicalScore.sustainability = 0.7;
    }
    
    // Calculate overall score
    const scores = Object.values(ethicalScore);
    const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // Determine if action is ethical
    const isEthical = overallScore >= 0.6;
    
    // Generate recommendations
    const recommendations = [];
    for (const [criterion, score] of Object.entries(ethicalScore)) {
      if (score < 0.5) {
        recommendations.push(`Improve ${criterion} considerations`);
      }
    }
    
    // Log ethical validation
    logger.info(`🟡️ Ethical validation: ${(overallScore * 100).toFixed(1)}% ethical alignment`);
    
    return {
      isEthical,
      overallScore,
      scores: ethicalScore,
      recommendations,
      timestamp: Date.now()
    };
  }

  /**
   * Get daily coding mantra
   */
  getDailyMantra() {
    const mantras = [
      "Code with consciousness, commit with compassion",
      "Every bug is a teacher, every feature a service",
      "I code for all beings, not just for users",
      "My keyboard is my prayer wheel, my screen my altar",
      "In the space between keystrokes, wisdom emerges",
      "Refactor with reverence, debug with devotion",
      "The terminal teaches truth to those who listen"
    ];
    
    // Select based on day
    const day = new Date().getDay();
    return mantras[day % mantras.length];
  }
}

// Sacred principle enum
const SacredPrinciple = {
  CONSCIOUSNESS: 'consciousness',
  SUSTAINABILITY: 'sustainability',
  COMMUNITY: 'community',
  QUALITY: 'quality',
  ETHICS: 'ethics',
  WISDOM: 'wisdom',
  HARMONY: 'harmony'
};

// Export singleton
const sacredCodePrinciples = new SacredCodePrinciples();

module.exports = {
  SacredCodePrinciples,
  sacredCodePrinciples,
  SacredPrinciple
};