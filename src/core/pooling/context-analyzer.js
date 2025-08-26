/**
 * Context Analyzer for Intelligent Pooling
 * Detects project phase, department focus, and returns appropriate specialists
 */

const { logger } = require('../logging/bumba-logger');
const { PhaseMapper } = require('./phase-mapper');
const { DepartmentDetector } = require('./department-detector');

class ContextAnalyzer {
  constructor() {
    // Initialize phase mapper for advanced phase detection
    this.phaseMapper = new PhaseMapper();
    
    // Initialize department detector for enhanced department analysis
    this.departmentDetector = new DepartmentDetector();
    
    // Project phase patterns (simplified, main logic in PhaseMapper)
    this.phasePatterns = {
      PLANNING: {
        keywords: ['plan', 'design', 'architect', 'requirement', 'roadmap', 'strategy', 'analyze', 'research'],
        specialists: [
          'product-strategist',
          'market-researcher',
          'business-analyst',
          'ux-researcher',
          'requirements-engineer'
        ]
      },
      DEVELOPMENT: {
        keywords: ['implement', 'code', 'build', 'create', 'develop', 'write', 'add', 'feature'],
        specialists: [
          'backend-engineer',
          'frontend-developer',
          'database-specialist',
          'api-architect',
          'fullstack-developer'
        ]
      },
      TESTING: {
        keywords: ['test', 'validate', 'debug', 'fix', 'verify', 'check', 'qa', 'quality'],
        specialists: [
          'qa-engineer',
          'test-automation-specialist',
          'security-specialist',
          'performance-tester',
          'debugging-specialist'
        ]
      },
      DEPLOYMENT: {
        keywords: ['deploy', 'release', 'publish', 'ship', 'launch', 'production', 'ci/cd'],
        specialists: [
          'devops-engineer',
          'sre-specialist',
          'cloud-architect',
          'infrastructure-engineer',
          'security-specialist'
        ]
      },
      MAINTENANCE: {
        keywords: ['refactor', 'optimize', 'improve', 'document', 'review', 'maintain', 'update'],
        specialists: [
          'code-reviewer',
          'refactoring-specialist',
          'documentation-writer',
          'performance-optimizer',
          'tech-debt-specialist'
        ]
      }
    };
    
    // Department patterns
    this.departmentPatterns = {
      BACKEND: {
        keywords: ['api', 'server', 'database', 'backend', 'microservice', 'endpoint', 'auth'],
        specialists: [
          'backend-engineer',
          'database-specialist',
          'api-architect',
          'security-specialist',
          'devops-engineer'
        ]
      },
      FRONTEND: {
        keywords: ['ui', 'component', 'react', 'vue', 'angular', 'frontend', 'design', 'ux'],
        specialists: [
          'frontend-developer',
          'ui-designer',
          'ux-researcher',
          'css-specialist',
          'react-specialist'
        ]
      },
      MOBILE: {
        keywords: ['ios', 'android', 'mobile', 'app', 'swift', 'kotlin', 'react-native'],
        specialists: [
          'ios-developer',
          'android-developer',
          'mobile-architect',
          'react-native-specialist',
          'mobile-ui-designer'
        ]
      },
      DATA: {
        keywords: ['data', 'analytics', 'ml', 'ai', 'pipeline', 'etl', 'warehouse'],
        specialists: [
          'data-engineer',
          'ml-engineer',
          'data-analyst',
          'data-scientist',
          'pipeline-specialist'
        ]
      },
      STRATEGIC: {
        keywords: ['business', 'market', 'strategy', 'product', 'roadmap', 'stakeholder'],
        specialists: [
          'product-strategist',
          'market-researcher',
          'business-analyst',
          'product-owner',
          'project-manager'
        ]
      }
    };
    
    // Current detected context
    this.currentContext = {
      phase: null,
      department: null,
      confidence: 0
    };
    
    logger.debug('Context analyzer initialized');
  }
  
  /**
   * Analyze context from prompt/task
   */
  analyzeContext(prompt, recentTasks = [], additionalContext = {}) {
    const text = this.combineContext(prompt, recentTasks);
    
    // Use PhaseMapper for advanced phase detection
    const phaseResult = this.phaseMapper.detectPhase({
      prompt,
      recentTasks,
      files: additionalContext.files || [],
      commands: additionalContext.commands || []
    });
    
    // Use DepartmentDetector for enhanced department detection
    const departmentResult = this.departmentDetector.detectDepartment({
      prompt,
      recentTasks,
      technologies: additionalContext.technologies || [],
      files: additionalContext.files || []
    });
    
    // Get transition recommendations
    const transitions = this.phaseMapper.getTransitionRecommendations();
    
    // Combine specialists from phase and department
    const combinedSpecialists = this.combineSpecialistRecommendations(
      phaseResult.specialists,
      departmentResult.specialists
    );
    
    // Update current context
    this.currentContext = {
      phase: phaseResult.phase,
      department: departmentResult.primary,
      secondaryDepartment: departmentResult.secondary,
      multiDepartment: departmentResult.multiDepartment,
      confidence: (phaseResult.confidence + departmentResult.confidence) / 2,
      timestamp: Date.now(),
      transitions,
      phaseScores: phaseResult.scores,
      departmentScores: departmentResult.allScores,
      recommendedSpecialists: combinedSpecialists
    };
    
    logger.debug(`Context detected - Phase: ${phaseResult.phase} (${phaseResult.confidence.toFixed(2)}), Department: ${departmentResult.primary} (${departmentResult.confidence.toFixed(2)})`);
    
    return this.currentContext;
  }
  
  /**
   * Combine prompt with recent tasks for better context
   */
  combineContext(prompt, recentTasks) {
    const texts = [prompt];
    
    // Add recent tasks with decreasing weight
    recentTasks.slice(-5).forEach((task, index) => {
      texts.push(task);
    });
    
    return texts.join(' ').toLowerCase();
  }
  
  /**
   * Detect project phase from text
   */
  detectPhase(text) {
    const scores = {};
    
    for (const [phase, config] of Object.entries(this.phasePatterns)) {
      scores[phase] = this.calculateKeywordScore(text, config.keywords);
    }
    
    // Get highest scoring phase
    const topPhase = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])[0];
    
    return {
      name: topPhase[0],
      confidence: Math.min(topPhase[1], 1.0),
      scores
    };
  }
  
  /**
   * Detect department focus from text
   */
  detectDepartment(text) {
    const scores = {};
    
    for (const [dept, config] of Object.entries(this.departmentPatterns)) {
      scores[dept] = this.calculateKeywordScore(text, config.keywords);
    }
    
    // Get highest scoring department
    const topDept = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])[0];
    
    return {
      name: topDept[0],
      confidence: Math.min(topDept[1], 1.0),
      scores
    };
  }
  
  /**
   * Calculate keyword score
   */
  calculateKeywordScore(text, keywords) {
    let score = 0;
    let matches = 0;
    
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        matches++;
        // Give more weight to exact word matches
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        const exactMatches = (text.match(regex) || []).length;
        score += 0.1 + (exactMatches * 0.2);
      }
    }
    
    // Normalize score
    return Math.min(score, 1.0);
  }
  
  /**
   * Get specialists for detected phase
   */
  getSpecialistsForPhase(phase) {
    const config = this.phasePatterns[phase];
    return config ? config.specialists : [];
  }
  
  /**
   * Get specialists for detected department
   */
  getSpecialistsForDepartment(department) {
    const config = this.departmentPatterns[department];
    return config ? config.specialists : [];
  }
  
  /**
   * Get recommended specialists based on current context
   */
  getRecommendedSpecialists(limit = 10) {
    const specialists = new Map();
    
    // Add phase specialists
    if (this.currentContext.phase) {
      const phaseSpecs = this.getSpecialistsForPhase(this.currentContext.phase);
      phaseSpecs.forEach(spec => {
        const score = specialists.get(spec) || 0;
        specialists.set(spec, score + this.currentContext.confidence);
      });
    }
    
    // Add department specialists
    if (this.currentContext.department) {
      const deptSpecs = this.getSpecialistsForDepartment(this.currentContext.department);
      deptSpecs.forEach(spec => {
        const score = specialists.get(spec) || 0;
        specialists.set(spec, score + this.currentContext.confidence);
      });
    }
    
    // Sort by score and return top N
    return Array.from(specialists.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([spec]) => spec);
  }
  
  /**
   * Get context patterns for learning
   */
  getContextPatterns() {
    return {
      phases: Object.keys(this.phasePatterns),
      departments: Object.keys(this.departmentPatterns),
      current: this.currentContext
    };
  }
  
  /**
   * Update patterns based on feedback
   */
  updatePatterns(feedback) {
    // This could be extended to learn new patterns
    // For now, just log the feedback
    logger.debug(`Context feedback received: ${JSON.stringify(feedback)}`);
  }
  
  /**
   * Get detailed context analysis
   */
  getDetailedAnalysis(text) {
    const phase = this.detectPhase(text);
    const department = this.detectDepartment(text);
    
    return {
      phase: {
        detected: phase.name,
        confidence: phase.confidence,
        allScores: phase.scores,
        specialists: this.getSpecialistsForPhase(phase.name)
      },
      department: {
        detected: department.name,
        confidence: department.confidence,
        allScores: department.scores,
        specialists: this.getSpecialistsForDepartment(department.name)
      },
      recommended: this.getRecommendedSpecialists(),
      timestamp: Date.now()
    };
  }
  
  /**
   * Combine specialist recommendations from phase and department
   */
  combineSpecialistRecommendations(phaseSpecialists = [], departmentSpecialists = []) {
    const combined = new Map();
    
    // Add phase specialists with scores
    for (const spec of phaseSpecialists) {
      const key = typeof spec === 'string' ? spec : spec.type;
      const score = typeof spec === 'object' ? spec.score : 0.5;
      combined.set(key, score);
    }
    
    // Add/boost department specialists
    for (const spec of departmentSpecialists) {
      const key = typeof spec === 'string' ? spec : spec.type;
      const score = typeof spec === 'object' ? (spec.priority === 'core' ? 0.8 : 0.5) : 0.5;
      const existing = combined.get(key) || 0;
      combined.set(key, Math.min(existing + score, 1.0));
    }
    
    // Sort by combined score and return top specialists
    return Array.from(combined.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([specialist, score]) => ({
        type: specialist,
        score,
        source: 'combined'
      }));
  }
  
  /**
   * Clear current context
   */
  clearContext() {
    this.currentContext = {
      phase: null,
      department: null,
      confidence: 0
    };
    logger.debug('Context cleared');
  }
}

module.exports = { ContextAnalyzer };