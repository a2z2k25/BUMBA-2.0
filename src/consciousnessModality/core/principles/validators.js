const { logger } = require('../../../core/logging/bumba-logger');

/**
 * BUMBA Core Principle Validators
 * Four Pillars of Conscious Coding Implementation
 * Integrates with existing BUMBA quality gates
 */

class EthicalScore {
  constructor(options = {}) {
    this.accessibility = options.accessibility || 0;
    this.privacy = options.privacy || 0;
    this.darkPatterns = options.darkPatterns || 0;
    this.sustainability = options.sustainability || 0;
    this.userEmpowerment = options.userEmpowerment || 0;
    this.overall = this.calculateOverall();
  }

  calculateOverall() {
    const scores = [
      this.accessibility,
      this.privacy,
      this.darkPatterns,
      this.sustainability,
      this.userEmpowerment,
    ];
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  getGrade() {
    if (this.overall >= 90) {return 'A';}
    if (this.overall >= 80) {return 'B';}
    if (this.overall >= 70) {return 'C';}
    if (this.overall >= 60) {return 'D';}
    return 'F';
  }
}

class PurityScore {
  constructor(options = {}) {
    this.readability = options.readability || 0;
    this.maintainability = options.maintainability || 0;
    this.dependencies = options.dependencies || 0;
    this.elegance = options.elegance || 0;
    this.naturalFlow = options.naturalFlow || 0;
    this.overall = this.calculateOverall();
  }

  calculateOverall() {
    const scores = [
      this.readability,
      this.maintainability,
      this.dependencies,
      this.elegance,
      this.naturalFlow,
    ];
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  getItalRating() {
    if (this.overall >= 90) {return 'Pure Ital';}
    if (this.overall >= 80) {return 'Natural';}
    if (this.overall >= 70) {return 'Mostly Clean';}
    if (this.overall >= 60) {return 'Needs Purification';}
    return 'Babylon Patterns';
  }
}

/**
 * Pillar 2: Babylon Rejection (Ethical Technology)
 * Actively resist toxic practices in technology
 */
class BabylonDetector {
  static analyzeCode(code) {
    const score = new EthicalScore();
    const issues = [];

    // Accessibility checks
    score.accessibility = this.checkAccessibility(code, issues);

    // Privacy checks
    score.privacy = this.checkDataCollection(code, issues);

    // Dark pattern detection
    score.darkPatterns = this.identifyManipulation(code, issues);

    // Sustainability assessment
    score.sustainability = this.assessResourceUsage(code, issues);

    // User empowerment check
    score.userEmpowerment = this.checkUserEmpowerment(code, issues);

    return {
      score,
      issues,
      guidance: this.generateBabylonGuidance(score, issues),
    };
  }

  static checkAccessibility(code, issues) {
    let score = 100;

    if (/<img(?![^>]*alt=)/i.test(code)) {
      issues.push({
        type: 'accessibility',
        severity: 'high',
        message: 'Images missing alt text exclude our vision-impaired brethren',
        fix: 'Add descriptive alt attributes to all images',
      });
      score -= 25;
    }

    if (/<button|<input|<select/.test(code) && !/aria-label|aria-labelledby/.test(code)) {
      issues.push({
        type: 'accessibility',
        severity: 'medium',
        message: 'Interactive elements need labels for screen readers',
        fix: 'Add aria-label or aria-labelledby attributes',
      });
      score -= 15;
    }

    if (/color:\s*red|background.*red/i.test(code) && !/text|icon|symbol/.test(code)) {
      issues.push({
        type: 'accessibility',
        severity: 'medium',
        message: 'Color alone cannot convey information to color-blind users',
        fix: 'Add text, icons, or patterns alongside color coding',
      });
      score -= 10;
    }

    return Math.max(0, score);
  }

  static checkDataCollection(code, issues) {
    let score = 100;

    if (/google-analytics|facebook|tracking|analytics/.test(code)) {
      issues.push({
        type: 'privacy',
        severity: 'high',
        message: 'Babylon surveillance systems detected',
        fix: 'Consider privacy-respecting alternatives or explicit user consent',
      });
      score -= 30;
    }

    if (/localStorage|sessionStorage/.test(code) && !/consent|permission/.test(code)) {
      issues.push({
        type: 'privacy',
        severity: 'medium',
        message: 'Data storage without user awareness',
        fix: 'Implement clear consent mechanisms for data storage',
      });
      score -= 20;
    }

    if (/hidden.*input|display:\s*none.*input/.test(code)) {
      issues.push({
        type: 'privacy',
        severity: 'high',
        message: 'Hidden data collection is deceptive practice',
        fix: 'Make all data collection transparent to users',
      });
      score -= 25;
    }

    return Math.max(0, score);
  }

  static identifyManipulation(code, issues) {
    let score = 100;

    const darkPatterns = [
      {
        pattern: /confirm.*delete|delete.*confirm/i,
        message: 'Deletion should be clearly reversible',
        severity: 'medium',
      },
      {
        pattern: /auto.*subscribe|subscribe.*auto/i,
        message: 'Auto-subscription is manipulative',
        severity: 'high',
      },
      {
        pattern: /limited.*time|hurry.*up|act.*now/i,
        message: 'Artificial urgency pressures users',
        severity: 'medium',
      },
      {
        pattern: /hidden.*fee|surprise.*charge/i,
        message: 'Hidden costs are deceptive',
        severity: 'high',
      },
    ];

    darkPatterns.forEach(({ pattern, message, severity }) => {
      if (pattern.test(code)) {
        issues.push({
          type: 'dark-pattern',
          severity,
          message,
          fix: 'Design transparent and user-respecting interactions',
        });
        score -= severity === 'high' ? 25 : 15;
      }
    });

    return Math.max(0, score);
  }

  static assessResourceUsage(code, issues) {
    let score = 100;

    if (/for.*in.*for.*in|while.*while/.test(code)) {
      issues.push({
        type: 'sustainability',
        severity: 'medium',
        message: 'Nested loops waste energy like Babylon waste resources',
        fix: 'Optimize algorithms to reduce computational waste',
      });
      score -= 20;
    }

    if ((code.match(/document\.createElement|innerHTML/g) || []).length > 10) {
      issues.push({
        type: 'sustainability',
        severity: 'medium',
        message: 'Excessive DOM manipulation drains device batteries',
        fix: 'Use efficient rendering techniques and batch DOM updates',
      });
      score -= 15;
    }

    return Math.max(0, score);
  }

  static checkUserEmpowerment(code, issues) {
    let score = 100;

    if (/settings|preferences|customize/.test(code)) {
      score += 10; // Bonus for user control
    }

    if (/export|download.*data|backup/.test(code)) {
      score += 10; // Bonus for data portability
    }

    if (/proprietary|vendor.*lock|exclusive/.test(code)) {
      issues.push({
        type: 'empowerment',
        severity: 'high',
        message: 'Vendor lock-in prevents user freedom',
        fix: 'Implement open standards and data portability',
      });
      score -= 25;
    }

    return Math.min(100, Math.max(0, score));
  }

  static generateBabylonGuidance(score, issues) {
    const highSeverityIssues = issues.filter(i => i.severity === 'high');

    if (highSeverityIssues.length > 0) {
      return {
        message: 'Babylon patterns detected! These practices oppress rather than liberate users.',
        priority: 'Address high-severity issues immediately',
        wisdom:
          'The path of righteousness in code requires rejecting all forms of digital oppression.',
      };
    }

    if (score.overall < 70) {
      return {
        message: 'The code needs purification from Babylon influences.',
        priority: 'Focus on ethical improvements and user empowerment',
        wisdom: 'Each ethical choice in code brings us closer to digital Zion.',
      };
    }

    return {
      message: 'Good foundation! Continue building ethical technology.',
      priority: 'Maintain vigilance against Babylon patterns',
      wisdom: 'Righteous code serves all people with dignity and respect.',
    };
  }
}

/**
 * Pillar 3: Ital Engineering (Pure, Natural Code)
 * Write clean, unprocessed, natural code that enhances rather than diminishes
 */
class ItalLinter {
  static assessCodePurity(code) {
    const score = new PurityScore();
    const suggestions = [];

    // Readability assessment
    score.readability = this.measureClarity(code, suggestions);

    // Maintainability check
    score.maintainability = this.assessStructure(code, suggestions);

    // Dependencies analysis
    score.dependencies = this.analyzeDependencies(code, suggestions);

    // Elegance measurement
    score.elegance = this.measureEfficiency(code, suggestions);

    // Natural flow assessment
    score.naturalFlow = this.assessNaturalFlow(code, suggestions);

    return {
      score,
      suggestions,
      guidance: this.generateItalGuidance(score, suggestions),
    };
  }

  static measureClarity(code, suggestions) {
    let score = 100;

    // Check for meaningful variable names
    const variables = code.match(/(?:var|let|const)\s+(\w+)/g) || [];
    const badNames = variables.filter(v => /^[a-z]$|^temp|^data|^item/.test(v));

    if (badNames.length > 0) {
      suggestions.push({
        type: 'clarity',
        message: 'Use descriptive names that reveal intention',
        example: 'Instead of "data", use "userProfile" or "apiResponse"',
        wisdom: 'Names should speak truth about their purpose',
      });
      score -= badNames.length * 10;
    }

    // Check for comments explaining "what" instead of "why"
    const comments = code.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || [];
    const obviousComments = comments.filter(
      c => /increment|add|set|get/.test(c) && !/why|because|due to/.test(c)
    );

    if (obviousComments.length > 0) {
      suggestions.push({
        type: 'clarity',
        message: 'Comments should explain "why", not "what"',
        example: '// Increment counter -> // Increment to handle edge case in API pagination',
        wisdom: 'Code should be self-documenting; comments add deeper understanding',
      });
      score -= obviousComments.length * 5;
    }

    return Math.max(0, score);
  }

  static assessStructure(code, suggestions) {
    let score = 100;

    // Check function length
    const functions = code.match(/function\s+\w+[^}]+\{[^}]*\}/g) || [];
    const longFunctions = functions.filter(f => f.split('\n').length > 20);

    if (longFunctions.length > 0) {
      suggestions.push({
        type: 'structure',
        message: 'Functions should do one thing well, like focused meditation',
        example: 'Break large functions into smaller, single-purpose functions',
        wisdom: 'Simple functions are like clear thoughts - easy to understand and test',
      });
      score -= longFunctions.length * 15;
    }

    // Check for deeply nested code
    const nestingLevel = this.calculateMaxNesting(code);
    if (nestingLevel > 4) {
      suggestions.push({
        type: 'structure',
        message: 'Deep nesting complicates understanding like Babylon confusion',
        example: 'Use early returns and guard clauses to reduce nesting',
        wisdom: 'Flat structure flows like natural water finding its path',
      });
      score -= (nestingLevel - 4) * 10;
    }

    return Math.max(0, score);
  }

  static analyzeDependencies(code, suggestions) {
    let score = 100;

    // Check for excessive imports
    const imports = code.match(/import.*from|require\(/g) || [];
    if (imports.length > 10) {
      suggestions.push({
        type: 'dependencies',
        message: 'Too many dependencies create heavy burden',
        example: 'Consider if all imports are truly necessary',
        wisdom: 'Ital living means using only what you need',
      });
      score -= Math.min(30, (imports.length - 10) * 3);
    }

    // Check for unused imports
    const importNames = (code.match(/import\s+\{?([^}]+)\}?/g) || [])
      .map(imp => imp.replace(/import\s+\{?([^}]+)\}?.*/, '$1').split(','))
      .flat()
      .map(name => name.trim());

    const unusedImports = importNames.filter(name => {
      // Escape special regex characters in the name
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return !new RegExp(`\\b${escapedName}\\b`).test(code.replace(/import.*from.*;/g, ''));
    });

    if (unusedImports.length > 0) {
      suggestions.push({
        type: 'dependencies',
        message: 'Remove unused imports like weeds from the garden',
        example: `Unused: ${unusedImports.slice(0, 3).join(', ')}`,
        wisdom: 'Clean imports keep the codebase pure and fast',
      });
      score -= unusedImports.length * 5;
    }

    return Math.max(0, score);
  }

  static measureEfficiency(code, suggestions) {
    let score = 100;

    // Check for inefficient patterns
    if (/\.indexOf.*>\s*-1/.test(code)) {
      suggestions.push({
        type: 'efficiency',
        message: 'Use .includes() instead of .indexOf() > -1',
        example: 'array.includes(item) is more natural than array.indexOf(item) > -1',
        wisdom: 'Express intention clearly and directly',
      });
      score -= 10;
    }

    // Check for unnecessary array iterations
    const chainedIterations = (code.match(/\.(map|filter|reduce).*\.(map|filter|reduce)/g) || [])
      .length;
    if (chainedIterations > 2) {
      suggestions.push({
        type: 'efficiency',
        message: 'Multiple array iterations can be combined',
        example: 'Use single reduce() instead of chaining map().filter().map()',
        wisdom: 'Elegant code flows in one smooth movement',
      });
      score -= chainedIterations * 5;
    }

    return Math.max(0, score);
  }

  static assessNaturalFlow(code, suggestions) {
    let score = 100;

    // Check for guard clauses vs nested if statements
    const nestedIfs = (code.match(/if\s*\([^)]+\)\s*\{[^}]*if\s*\(/g) || []).length;
    if (nestedIfs > 2) {
      suggestions.push({
        type: 'flow',
        message: 'Use guard clauses for natural flow',
        example: 'if (!condition) return; // instead of nested if (condition) { ... }',
        wisdom: 'Code should flow like a river - clear path, no obstacles',
      });
      score -= nestedIfs * 10;
    }

    // Check for positive condition flow
    const negativeConditions = (code.match(/if\s*\(\s*!/g) || []).length;
    if (negativeConditions > 3) {
      suggestions.push({
        type: 'flow',
        message: 'Prefer positive conditions when possible',
        example: 'if (isValid) rather than if (!isInvalid)',
        wisdom: 'Positive thinking creates positive code',
      });
      score -= negativeConditions * 3;
    }

    return Math.max(0, score);
  }

  static calculateMaxNesting(code) {
    let maxNesting = 0;
    let currentNesting = 0;

    for (let char of code) {
      if (char === '{') {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (char === '}') {
        currentNesting--;
      }
    }

    return maxNesting;
  }

  static generateItalGuidance(score, suggestions) {
    if (score.overall >= 90) {
      return {
        message: 'Pure Ital code! Clean, natural, and life-giving.',
        priority: 'Maintain this beautiful standard',
        wisdom: 'Your code flows like spring water - clear, pure, and nourishing.',
      };
    }

    if (score.overall >= 70) {
      return {
        message: 'Good foundation with room for purification.',
        priority: 'Focus on the suggestions to reach Ital standard',
        wisdom: 'Each improvement brings more natural harmony to your code.',
      };
    }

    return {
      message: 'Code needs significant purification from complexity.',
      priority: 'Start with the highest-impact suggestions first',
      wisdom: "Like clearing a garden, remove what doesn't serve and nurture what remains.",
    };
  }
}

/**
 * Pillar 4: Purpose Alignment Validator
 * Ensure every feature serves higher good and meaningful work
 */
class PurposeChecker {
  static validate(code, projectContext = {}) {
    const analysis = {
      purposeClarity: this.assessPurposeClarity(code, projectContext),
      userBenefit: this.evaluateUserBenefit(code),
      ethicalAlignment: this.checkEthicalAlignment(code),
      meaningfulWork: this.assessMeaningfulness(code, projectContext),
    };

    const overallScore = Object.values(analysis).reduce((sum, score) => sum + score, 0) / 4;

    return {
      analysis,
      overallScore,
      guidance: this.generatePurposeGuidance(analysis, overallScore),
    };
  }

  static assessPurposeClarity(code, projectContext) {
    let score = 50; // Start neutral

    // Check for clear documentation of purpose
    if (/purpose|goal|mission|why/.test(code) || projectContext.mission) {
      score += 25;
    }

    // Check for user-focused language
    if (/user|customer|person|people|community/.test(code)) {
      score += 15;
    }

    // Check for problem-solving indicators
    if (/solve|fix|improve|help|support/.test(code)) {
      score += 10;
    }

    return Math.min(100, score);
  }

  static evaluateUserBenefit(code) {
    let score = 50;

    // Look for empowerment patterns
    const empowermentPatterns = [
      /empower|enable|facilitate/,
      /accessibility|inclusive|universal/,
      /privacy|security|safe/,
      /efficient|fast|simple/,
      /customize|control|choice/,
    ];

    empowermentPatterns.forEach(pattern => {
      if (pattern.test(code)) {score += 10;}
    });

    // Detect exploitation patterns
    const exploitationPatterns = [
      /addict|hook|engage.*compulsive/,
      /monetize.*attention|harvest.*data/,
      /manipulate|trick|deceive/,
    ];

    exploitationPatterns.forEach(pattern => {
      if (pattern.test(code)) {score -= 20;}
    });

    return Math.max(0, Math.min(100, score));
  }

  static checkEthicalAlignment(code) {
    let score = 70; // Start with good faith

    // Positive ethical indicators
    if (/consent|permission|opt.*in/.test(code)) {score += 10;}
    if (/transparent|open.*source|audit/.test(code)) {score += 10;}
    if (/fair|equal|just|equitable/.test(code)) {score += 10;}

    // Negative ethical indicators
    if (/track.*without|collect.*secretly/.test(code)) {score -= 30;}
    if (/lock.*in|monopoly|exclusive/.test(code)) {score -= 20;}
    if (/manipulate|exploit|addict/.test(code)) {score -= 25;}

    return Math.max(0, Math.min(100, score));
  }

  static assessMeaningfulness(code, projectContext) {
    let score = 60; // Neutral starting point

    // Check for connection to higher purpose
    const meaningfulDomains = [
      'education',
      'health',
      'environment',
      'community',
      'accessibility',
      'creativity',
      'connection',
      'growth',
      'sustainability',
      'justice',
    ];

    meaningfulDomains.forEach(domain => {
      if (new RegExp(domain, 'i').test(code + (projectContext.description || ''))) {
        score += 8;
      }
    });

    // Check for shallow commercial patterns
    if (/increase.*sales|maximize.*profit|boost.*revenue/.test(code)) {
      score -= 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  static generatePurposeGuidance(analysis, overallScore) {
    if (overallScore >= 80) {
      return {
        message: 'Blessed work! This code serves higher purpose.',
        priority: 'Continue this righteous path',
        wisdom: 'When code serves humanity with love, it becomes a prayer in action.',
      };
    }

    if (overallScore >= 60) {
      return {
        message: 'Good intention with room for deeper purpose.',
        priority: 'Clarify how this serves users and community',
        wisdom: "Ask not just 'Does it work?' but 'Does it serve?'",
      };
    }

    return {
      message: 'Purpose unclear or potentially harmful.',
      priority: "Re-examine the fundamental 'why' of this code",
      wisdom:
        'Code without righteous purpose serves only Babylon. Seek the path that lifts up all people.',
    };
  }
}

// Integration with existing BUMBA framework
class BumbaPrincipleIntegrator {
  constructor(bumbaFramework) {
    this.babylonDetector = BabylonDetector;
    this.italLinter = ItalLinter;
    this.purposeChecker = PurposeChecker;
    this.bumbaFramework = bumbaFramework;
  }

  analyzeCode(code, context = {}) {
    logger.info('🏁🏁 BUMBA Consciousness Principle Analysis Starting...');

    const results = {
      babylonAnalysis: this.babylonDetector.analyzeCode(code),
      italAssessment: this.italLinter.assessCodePurity(code),
      purposeValidation: this.purposeChecker.validate(code, context),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };

    // Integration with existing BUMBA quality gates
    if (this.bumbaFramework?.hooks?.PreToolUse) {
      this.integrateWithQualityGates(results);
    }

    logger.info('🏁 BUMBA Consciousness Principle Analysis Complete');
    return results;
  }

  integrateWithQualityGates(results) {
    // Create summary for BUMBA quality system
    const summary = {
      ethicalScore: results.babylonAnalysis.score.overall,
      purityScore: results.italAssessment.score.overall,
      purposeScore: results.purposeValidation.overallScore,
      overallGrade: this.calculateOverallGrade(results),
    };

    // Log for BUMBA system
    logger.info(`🏁️ Babylon Resistance: ${summary.ethicalScore}/100`);
    logger.info(`🏁🏁 Ital Purity: ${summary.purityScore}/100`);
    logger.info(`🏁 Purpose Alignment: ${summary.purposeScore}/100`);
    logger.info(`🏁 Overall Grade: ${summary.overallGrade}`);

    return summary;
  }

  calculateOverallGrade(results) {
    const avgScore =
      (results.babylonAnalysis.score.overall +
        results.italAssessment.score.overall +
        results.purposeValidation.overallScore) /
      3;

    if (avgScore >= 90) {return 'A - Blessed Code';}
    if (avgScore >= 80) {return 'B - Righteous Path';}
    if (avgScore >= 70) {return 'C - Good Foundation';}
    if (avgScore >= 60) {return 'D - Needs Guidance';}
    return 'F - Babylon Influence';
  }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validators: {  // Standard export as expected
      BabylonDetector,
      ItalLinter,
      PurposeChecker,
      EthicalScore,
      PurityScore,
      BumbaPrincipleIntegrator
    },
    // Also export individually for backward compatibility
    BabylonDetector,
    ItalLinter,
    PurposeChecker,
    EthicalScore,
    PurityScore,
    BumbaPrincipleIntegrator
  };
} else if (typeof window !== 'undefined') {
  globalThis.BumbaPrinciples = {
    BabylonDetector,
    ItalLinter,
    PurposeChecker,
    EthicalScore,
    PurityScore,
    BumbaPrincipleIntegrator,
  };
}
