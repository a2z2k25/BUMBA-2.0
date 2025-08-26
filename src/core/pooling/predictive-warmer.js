/**
 * Predictive Warmer for Intelligent Pooling
 * Learns workflow patterns and predicts next specialists needed
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class PredictiveWarmer extends EventEmitter {
  constructor() {
    super();
    // Workflow sequence tracking
    this.sequenceBuffer = [];
    this.maxSequenceLength = 10;
    
    // Transition matrix: specialist -> specialist -> count
    this.transitionMatrix = new Map();
    
    // Pattern recognition
    this.workflowPatterns = new Map();
    this.patternConfidence = new Map();
    
    // Common workflow templates
    this.workflowTemplates = {
      'API_DEVELOPMENT': [
        'product-strategist',
        'api-architect',
        'backend-engineer',
        'database-specialist',
        'qa-engineer',
        'devops-engineer'
      ],
      'UI_FEATURE': [
        'ux-researcher',
        'ui-designer',
        'frontend-developer',
        'css-specialist',
        'accessibility-tester',
        'qa-engineer'
      ],
      'DATA_PIPELINE': [
        'data-engineer',
        'pipeline-specialist',
        'database-specialist',
        'ml-engineer',
        'monitoring-specialist'
      ],
      'SECURITY_AUDIT': [
        'security-specialist',
        'penetration-tester',
        'security-auditor',
        'compliance-officer',
        'documentation-writer'
      ],
      'DEPLOYMENT': [
        'devops-engineer',
        'cloud-architect',
        'security-specialist',
        'monitoring-specialist',
        'sre-specialist'
      ],
      'BUG_FIX': [
        'debugging-specialist',
        'backend-engineer',
        'frontend-developer',
        'qa-engineer',
        'code-reviewer'
      ],
      'REFACTORING': [
        'code-reviewer',
        'refactoring-specialist',
        'performance-optimizer',
        'test-automation-specialist',
        'documentation-writer'
      ]
    };
    
    // Contextual patterns
    this.contextualPatterns = {
      'morning_standup': ['product-strategist', 'project-manager', 'tech-lead'],
      'code_review': ['code-reviewer', 'security-specialist', 'performance-optimizer'],
      'sprint_planning': ['product-owner', 'business-analyst', 'tech-lead'],
      'incident_response': ['sre-specialist', 'debugging-specialist', 'security-specialist'],
      'release_prep': ['qa-engineer', 'devops-engineer', 'product-manager']
    };
    
    // Prediction cache
    this.predictionCache = new Map();
    this.cacheTimeout = 60000; // 1 minute
    
    // Learning parameters
    this.learningRate = 0.1;
    this.confidenceThreshold = 0.3;
    this.minPatternOccurrences = 3;
    
    logger.debug('Predictive warmer initialized with workflow learning');
  }
  
  /**
   * Learn from specialist sequence
   */
  learnSequence(fromSpecialist, toSpecialist, context = {}) {
    // Update transition matrix
    const key = `${fromSpecialist}->${toSpecialist}`;
    const count = this.transitionMatrix.get(key) || 0;
    this.transitionMatrix.set(key, count + 1);
    
    // Update sequence buffer
    this.sequenceBuffer.push({
      from: fromSpecialist,
      to: toSpecialist,
      context,
      timestamp: Date.now()
    });
    
    // Trim buffer if too long
    if (this.sequenceBuffer.length > this.maxSequenceLength) {
      this.sequenceBuffer.shift();
    }
    
    // Detect patterns
    this.detectPatterns();
    
    // Update pattern confidence
    this.updateConfidence(key);
    
    logger.debug(`Learned transition: ${fromSpecialist} → ${toSpecialist}`);
  }
  
  /**
   * Predict next specialists
   */
  predictNext(currentSpecialist, context = {}) {
    // Check cache first
    const cacheKey = `${currentSpecialist}-${JSON.stringify(context)}`;
    const cached = this.predictionCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.predictions;
    }
    
    const predictions = [];
    
    // 1. Transition-based predictions
    const transitionPredictions = this.getTransitionPredictions(currentSpecialist);
    predictions.push(...transitionPredictions);
    
    // 2. Pattern-based predictions
    const patternPredictions = this.getPatternPredictions();
    predictions.push(...patternPredictions);
    
    // 3. Context-based predictions
    const contextPredictions = this.getContextPredictions(context);
    predictions.push(...contextPredictions);
    
    // 4. Template-based predictions
    const templatePredictions = this.getTemplatePredictions(currentSpecialist);
    predictions.push(...templatePredictions);
    
    // Combine and rank predictions
    const ranked = this.rankPredictions(predictions);
    
    // Cache results
    this.predictionCache.set(cacheKey, {
      predictions: ranked,
      timestamp: Date.now()
    });
    
    return ranked;
  }
  
  /**
   * Get transition-based predictions
   */
  getTransitionPredictions(currentSpecialist) {
    const predictions = [];
    
    for (const [transition, count] of this.transitionMatrix) {
      if (transition.startsWith(`${currentSpecialist}->`)) {
        const nextSpecialist = transition.split('->')[1];
        const confidence = this.calculateTransitionConfidence(currentSpecialist, nextSpecialist);
        
        if (confidence >= this.confidenceThreshold) {
          predictions.push({
            specialist: nextSpecialist,
            confidence,
            source: 'transition',
            count
          });
        }
      }
    }
    
    return predictions;
  }
  
  /**
   * Calculate transition confidence
   */
  calculateTransitionConfidence(from, to) {
    const key = `${from}->${to}`;
    const count = this.transitionMatrix.get(key) || 0;
    
    // Get total transitions from this specialist
    let totalTransitions = 0;
    for (const [transition, c] of this.transitionMatrix) {
      if (transition.startsWith(`${from}->`)) {
        totalTransitions += c;
      }
    }
    
    if (totalTransitions === 0) return 0;
    
    // Base confidence on frequency
    const frequency = count / totalTransitions;
    
    // Boost for recent usage
    const recentBoost = this.getRecentUsageBoost(from, to);
    
    return Math.min(frequency + recentBoost, 1.0);
  }
  
  /**
   * Get recent usage boost
   */
  getRecentUsageBoost(from, to) {
    const recentWindow = Date.now() - 300000; // Last 5 minutes
    let recentCount = 0;
    
    for (const seq of this.sequenceBuffer) {
      if (seq.from === from && seq.to === to && seq.timestamp > recentWindow) {
        recentCount++;
      }
    }
    
    return Math.min(recentCount * 0.1, 0.3);
  }
  
  /**
   * Detect workflow patterns
   */
  detectPatterns() {
    if (this.sequenceBuffer.length < 3) return;
    
    // Look for repeated sequences
    for (let length = 3; length <= Math.min(5, this.sequenceBuffer.length); length++) {
      const sequence = this.sequenceBuffer
        .slice(-length)
        .map(s => s.to)
        .join('->');
      
      const count = this.workflowPatterns.get(sequence) || 0;
      this.workflowPatterns.set(sequence, count + 1);
      
      // Mark as significant pattern if repeated enough
      if (count + 1 >= this.minPatternOccurrences) {
        this.patternConfidence.set(sequence, (count + 1) / 10);
      }
    }
  }
  
  /**
   * Get pattern-based predictions
   */
  getPatternPredictions() {
    const predictions = [];
    
    if (this.sequenceBuffer.length < 2) return predictions;
    
    // Get recent sequence
    const recentSequence = this.sequenceBuffer
      .slice(-2)
      .map(s => s.to)
      .join('->');
    
    // Find patterns that start with recent sequence
    for (const [pattern, count] of this.workflowPatterns) {
      if (pattern.startsWith(recentSequence) && pattern !== recentSequence) {
        const remaining = pattern.substring(recentSequence.length + 2);
        const nextSpecialist = remaining.split('->')[0];
        
        if (nextSpecialist) {
          const confidence = this.patternConfidence.get(pattern) || 0.3;
          predictions.push({
            specialist: nextSpecialist,
            confidence,
            source: 'pattern',
            pattern
          });
        }
      }
    }
    
    return predictions;
  }
  
  /**
   * Get context-based predictions
   */
  getContextPredictions(context) {
    const predictions = [];
    
    // Time-based patterns
    const hour = new Date().getHours();
    const timeContext = this.getTimeContext(hour);
    
    if (timeContext && this.contextualPatterns[timeContext]) {
      const specialists = this.contextualPatterns[timeContext];
      specialists.forEach((specialist, index) => {
        predictions.push({
          specialist,
          confidence: 0.5 - (index * 0.1),
          source: 'context',
          context: timeContext
        });
      });
    }
    
    // Phase-based predictions
    if (context.phase) {
      const phaseSpecialists = this.getPhaseSpecialists(context.phase);
      phaseSpecialists.forEach(specialist => {
        predictions.push({
          specialist,
          confidence: 0.4,
          source: 'phase',
          phase: context.phase
        });
      });
    }
    
    return predictions;
  }
  
  /**
   * Get time context
   */
  getTimeContext(hour) {
    if (hour >= 9 && hour <= 10) return 'morning_standup';
    if (hour >= 14 && hour <= 15) return 'code_review';
    if (hour >= 10 && hour <= 11 && new Date().getDay() === 1) return 'sprint_planning';
    if (hour >= 11 && hour <= 13 && new Date().getDay() === 5) return 'release_prep';
    return null;
  }
  
  /**
   * Get phase-specific specialists
   */
  getPhaseSpecialists(phase) {
    const phaseMap = {
      'PLANNING': ['product-strategist', 'business-analyst', 'architect'],
      'DEVELOPMENT': ['backend-engineer', 'frontend-developer', 'database-specialist'],
      'TESTING': ['qa-engineer', 'test-automation-specialist', 'performance-tester'],
      'DEPLOYMENT': ['devops-engineer', 'cloud-architect', 'sre-specialist'],
      'MAINTENANCE': ['code-reviewer', 'refactoring-specialist', 'documentation-writer']
    };
    
    return phaseMap[phase] || [];
  }
  
  /**
   * Get template-based predictions
   */
  getTemplatePredictions(currentSpecialist) {
    const predictions = [];
    
    // Find templates containing current specialist
    for (const [templateName, specialists] of Object.entries(this.workflowTemplates)) {
      const index = specialists.indexOf(currentSpecialist);
      
      if (index >= 0 && index < specialists.length - 1) {
        // Suggest next specialists in template
        for (let i = 1; i <= Math.min(3, specialists.length - index - 1); i++) {
          predictions.push({
            specialist: specialists[index + i],
            confidence: 0.6 - (i * 0.15),
            source: 'template',
            template: templateName
          });
        }
      }
    }
    
    return predictions;
  }
  
  /**
   * Rank and combine predictions
   */
  rankPredictions(predictions) {
    // Combine predictions by specialist
    const combined = new Map();
    
    for (const pred of predictions) {
      const existing = combined.get(pred.specialist);
      
      if (!existing || pred.confidence > existing.confidence) {
        combined.set(pred.specialist, pred);
      } else {
        // Boost confidence if multiple sources agree
        existing.confidence = Math.min(
          existing.confidence + pred.confidence * 0.3,
          1.0
        );
        existing.sources = existing.sources || [existing.source];
        existing.sources.push(pred.source);
      }
    }
    
    // Sort by confidence and return top predictions
    return Array.from(combined.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map(pred => pred.specialist);
  }
  
  /**
   * Update confidence scores
   */
  updateConfidence(transition) {
    const current = this.patternConfidence.get(transition) || 0;
    const count = this.transitionMatrix.get(transition) || 0;
    
    // Update with learning rate
    const newConfidence = current + this.learningRate * (count / 10 - current);
    this.patternConfidence.set(transition, Math.min(newConfidence, 1.0));
  }
  
  /**
   * Get workflow insights
   */
  getWorkflowInsights() {
    // Most common transitions
    const topTransitions = Array.from(this.transitionMatrix.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([transition, count]) => ({ transition, count }));
    
    // Detected patterns
    const topPatterns = Array.from(this.workflowPatterns.entries())
      .filter(([_, count]) => count >= this.minPatternOccurrences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern, count]) => ({ pattern, count }));
    
    // Pattern confidence
    const confidentPatterns = Array.from(this.patternConfidence.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    return {
      topTransitions,
      topPatterns,
      confidentPatterns,
      sequenceLength: this.sequenceBuffer.length,
      totalTransitions: this.transitionMatrix.size,
      totalPatterns: this.workflowPatterns.size
    };
  }
  
  /**
   * Clear prediction cache
   */
  clearCache() {
    this.predictionCache.clear();
    logger.debug('Prediction cache cleared');
  }
  
  /**
   * Export state for persistence
   */
  export() {
    return {
      sequenceBuffer: this.sequenceBuffer,
      transitionMatrix: Array.from(this.transitionMatrix.entries()),
      workflowPatterns: Array.from(this.workflowPatterns.entries()),
      patternConfidence: Array.from(this.patternConfidence.entries())
    };
  }
  
  /**
   * Import state
   */
  import(state) {
    if (state.sequenceBuffer) this.sequenceBuffer = state.sequenceBuffer;
    if (state.transitionMatrix) {
      this.transitionMatrix = new Map(state.transitionMatrix);
    }
    if (state.workflowPatterns) {
      this.workflowPatterns = new Map(state.workflowPatterns);
    }
    if (state.patternConfidence) {
      this.patternConfidence = new Map(state.patternConfidence);
    }
    
    logger.debug('Predictive warmer state imported');
  }
}

module.exports = { PredictiveWarmer };