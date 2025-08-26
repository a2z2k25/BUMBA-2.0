/**
 * BUMBA Claude Supervisor System
 * Claude acts as the primary model that reviews, validates, and improves
 * outputs from ancillary models (Gemini, GPT-4, etc.)
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class ClaudeSupervisor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Supervision strategies
      strategy: config.strategy || 'review-and-merge', // 'review-and-merge', 'real-time', 'branching'
      
      // Quality thresholds
      minQualityScore: config.minQualityScore || 0.7,
      requireClaudeForCritical: config.requireClaudeForCritical !== false,
      
      // Cost optimization
      maxClaudeCallsPerSession: config.maxClaudeCallsPerSession || 10,
      claudeBudgetPercentage: config.claudeBudgetPercentage || 0.3, // 30% of budget for Claude
      
      // Review triggers
      reviewTriggers: config.reviewTriggers || [
        'security-critical',
        'architecture-decision',
        'user-facing',
        'database-modification',
        'authentication'
      ]
    };
    
    this.metrics = {
      totalReviews: 0,
      approvals: 0,
      rejections: 0,
      improvements: 0,
      costSaved: 0
    };
    
    this.claudeClient = null;
    this.reviewQueue = [];
  }
  
  /**
   * Initialize Claude client for supervision
   */
  async initialize(anthropicKey) {
    if (!anthropicKey) {
      logger.warn('🟡 Claude Supervisor: No Anthropic key, supervision disabled');
      return false;
    }
    
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      this.claudeClient = new Anthropic({ apiKey: anthropicKey });
      logger.info('🏁 Claude Supervisor initialized');
      return true;
    } catch (error) {
      logger.error('🔴 Failed to initialize Claude Supervisor:', error);
      return false;
    }
  }
  
  /**
   * Main supervision method - reviews outputs from other models
   */
  async supervise(task, ancillaryResults, strategy = null) {
    const supervisionStrategy = strategy || this.config.strategy;
    
    switch (supervisionStrategy) {
      case 'review-and-merge':
        return await this.reviewAndMerge(task, ancillaryResults);
        
      case 'real-time':
        return await this.realTimeModeration(task, ancillaryResults);
        
      case 'branching':
        return await this.branchingReview(task, ancillaryResults);
        
      default:
        return await this.reviewAndMerge(task, ancillaryResults);
    }
  }
  
  /**
   * Strategy 1: Review and Merge
   * Claude reviews all outputs and creates an improved merged version
   */
  async reviewAndMerge(task, ancillaryResults) {
    logger.info('🟢 Claude Supervisor: Review and Merge strategy');
    
    // Step 1: Ancillary models work in parallel
    const validResults = ancillaryResults.filter(r => r.success);
    
    if (validResults.length === 0) {
      logger.error('🔴 No valid results to review');
      return { success: false, error: 'No valid ancillary results' };
    }
    
    // Step 2: Determine if Claude review is needed
    if (!this.needsClaudeReview(task, validResults)) {
      logger.info('🏁 Ancillary results sufficient, skipping Claude review');
      return this.selectBestResult(validResults);
    }
    
    // Step 3: Claude reviews and merges
    const reviewPrompt = this.buildReviewPrompt(task, validResults);
    
    try {
      const claudeReview = await this.callClaude(reviewPrompt, 'review-merge');
      
      this.metrics.totalReviews++;
      
      // Parse Claude's response
      const review = this.parseReviewResponse(claudeReview);
      
      if (review.approved) {
        this.metrics.approvals++;
        logger.info('🏁 Claude approved with improvements');
        
        return {
          success: true,
          strategy: 'review-and-merge',
          originalResults: validResults,
          claudeReview: review,
          finalOutput: review.improvedVersion || review.selectedBest,
          metadata: {
            reviewed: true,
            improvements: review.improvements,
            confidence: review.confidence
          }
        };
      } else {
        this.metrics.rejections++;
        logger.warn('🟡 Claude rejected ancillary outputs, providing new solution');
        
        // Claude provides its own solution
        return await this.claudeDirectSolution(task, validResults);
      }
      
    } catch (error) {
      logger.error('🔴 Claude review failed:', error);
      // Fallback to best ancillary result
      return this.selectBestResult(validResults);
    }
  }
  
  /**
   * Strategy 2: Real-Time Moderation
   * Claude monitors execution in real-time and intervenes when needed
   */
  async realTimeModeration(task, ancillaryStream) {
    logger.info('🟢️ Claude Supervisor: Real-Time Moderation strategy');
    
    const moderationResults = [];
    const interventions = [];
    
    for (const result of ancillaryStream) {
      // Check if intervention needed
      const needsIntervention = await this.checkIntervention(result);
      
      if (needsIntervention) {
        logger.warn('🟡 Claude intervention triggered');
        
        const intervention = await this.intervene(result);
        interventions.push(intervention);
        
        if (intervention.stopExecution) {
          logger.error('🔴 Claude stopped execution');
          break;
        }
        
        // Apply Claude's corrections
        result.corrected = intervention.correction;
        result.claudeModerated = true;
      }
      
      moderationResults.push(result);
    }
    
    return {
      success: true,
      strategy: 'real-time',
      results: moderationResults,
      interventions,
      metadata: {
        totalInterventions: interventions.length,
        executionStopped: interventions.some(i => i.stopExecution)
      }
    };
  }
  
  /**
   * Strategy 3: Branching Review
   * Create branches for different approaches, Claude selects best
   */
  async branchingReview(task, ancillaryResults) {
    logger.info('🟢 Claude Supervisor: Branching Review strategy');
    
    // Step 1: Create branches from ancillary results
    const branches = this.createBranches(ancillaryResults);
    
    // Step 2: Let each branch develop further
    const developedBranches = await this.developBranches(branches);
    
    // Step 3: Claude evaluates all branches
    const evaluationPrompt = this.buildBranchEvaluationPrompt(task, developedBranches);
    
    try {
      const claudeEvaluation = await this.callClaude(evaluationPrompt, 'branch-evaluation');
      
      const evaluation = this.parseBranchEvaluation(claudeEvaluation);
      
      // Step 4: Merge best branch or create new one
      if (evaluation.selectedBranch) {
        logger.info(`🏁 Claude selected branch: ${evaluation.selectedBranch}`);
        
        const selectedBranch = developedBranches[evaluation.selectedBranch];
        
        // Apply Claude's improvements to selected branch
        if (evaluation.improvements) {
          selectedBranch.improved = await this.applyImprovements(
            selectedBranch,
            evaluation.improvements
          );
        }
        
        return {
          success: true,
          strategy: 'branching',
          branches: developedBranches,
          selectedBranch: evaluation.selectedBranch,
          finalOutput: selectedBranch.improved || selectedBranch.content,
          metadata: {
            branchCount: branches.length,
            selectionReason: evaluation.reason,
            improvements: evaluation.improvements
          }
        };
      } else {
        // Claude creates new branch
        logger.info('🟢 Claude creating new branch');
        return await this.createClaudeBranch(task, developedBranches);
      }
      
    } catch (error) {
      logger.error('🔴 Branch evaluation failed:', error);
      return this.selectBestBranch(developedBranches);
    }
  }
  
  /**
   * Determine if Claude review is needed based on task criticality
   */
  needsClaudeReview(task, results) {
    // Always review critical tasks
    if (this.config.reviewTriggers.some(trigger => 
      task.description?.toLowerCase().includes(trigger) ||
      task.type?.toLowerCase().includes(trigger)
    )) {
      return true;
    }
    
    // Review if results disagree significantly
    if (this.detectDisagreement(results)) {
      return true;
    }
    
    // Review randomly for quality control (10% sample)
    if (Math.random() < 0.1) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Build review prompt for Claude
   */
  buildReviewPrompt(task, results) {
    const hasKnowledge = task.knowledgePackage && 
      (task.knowledgePackage.history?.length > 0 || 
       task.knowledgePackage.previousDecisions?.length > 0);
    
    const knowledgeContext = hasKnowledge ? `
### Relevant Context from Knowledge Base:
${task.knowledgePackage.history?.slice(0, 3).map(h => 
  `- ${h.type}: ${h.entry.task || h.entry.description}`
).join('\n') || ''}

### Previous Claude Decisions on Similar Tasks:
${task.knowledgePackage.previousDecisions?.slice(0, 2).map(d => 
  `- Decision: ${d.decision || 'N/A'}\n  Reasoning: ${d.reasoning || 'N/A'}`
).join('\n') || ''}

### Patterns Identified:
${task.knowledgePackage.patterns?.slice(0, 3).map(p => 
  `- ${p.type}: ${p.content?.substring(0, 100)}...`
).join('\n') || ''}

### Concerns Requiring Attention:
${task.knowledgePackage.concerns?.map(c => 
  `- ${c.type}: ${c.reason}`
).join('\n') || 'None identified'}
` : '';
    
    return {
      system: `You are a senior technical reviewer. Review the following outputs from junior models and:
1. Identify strengths and weaknesses
2. Merge the best parts into an improved solution
3. Correct any errors or security issues
4. Provide a confidence score (0-1)
5. Explain your improvements
${hasKnowledge ? '\n6. Consider the historical context and previous decisions when making your review' : ''}

Be constructive but thorough. If the solutions are fundamentally flawed, provide your own.`,
      
      user: `Task: ${task.description || task}
${knowledgeContext}

Outputs to review:
${results.map((r, i) => `
### Output ${i + 1} from ${r.agent || r.model}:
${r.result || r.content}
`).join('\n')}

Provide your review in this format:
APPROVED: [yes/no]
CONFIDENCE: [0-1]
IMPROVEMENTS: [list key improvements]
CORRECTIONS: [list specific corrections made]
DECISION: [your final decision]
MERGED_SOLUTION: [your improved version]
EXPLANATION: [why you made these changes]`
    };
  }
  
  /**
   * Call Claude API for supervision
   */
  async callClaude(prompt, purpose) {
    if (!this.claudeClient) {
      throw new Error('Claude client not initialized');
    }
    
    const startTime = Date.now();
    
    const message = await this.claudeClient.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4000,
      temperature: 0.3, // Lower temperature for review tasks
      system: prompt.system,
      messages: [
        {
          role: 'user',
          content: prompt.user || prompt
        }
      ]
    });
    
    const duration = Date.now() - startTime;
    
    logger.info(`🏁 Claude ${purpose} completed in ${duration}ms`);
    
    // Track costs
    const cost = (message.usage?.input_tokens * 0.000015) + 
                 (message.usage?.output_tokens * 0.000075);
    
    this.emit('claude:review', {
      purpose,
      duration,
      cost,
      tokens: message.usage
    });
    
    return message.content[0].text;
  }
  
  /**
   * Parse Claude's review response
   */
  parseReviewResponse(response) {
    // Parse structured response
    const approved = response.includes('APPROVED: yes');
    const confidenceMatch = response.match(/CONFIDENCE: ([\d.]+)/);
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;
    
    const improvementsMatch = response.match(/IMPROVEMENTS: (.+?)(?=CORRECTIONS:|DECISION:|MERGED_SOLUTION:|$)/s);
    const improvements = improvementsMatch ? improvementsMatch[1].trim().split('\n').filter(i => i.trim()) : [];
    
    const correctionsMatch = response.match(/CORRECTIONS: (.+?)(?=DECISION:|MERGED_SOLUTION:|$)/s);
    const corrections = correctionsMatch ? correctionsMatch[1].trim().split('\n').filter(c => c.trim()) : [];
    
    const decisionMatch = response.match(/DECISION: (.+?)(?=MERGED_SOLUTION:|$)/s);
    const decision = decisionMatch ? decisionMatch[1].trim() : '';
    
    const mergedMatch = response.match(/MERGED_SOLUTION: (.+?)(?=EXPLANATION:|$)/s);
    const improvedVersion = mergedMatch ? mergedMatch[1].trim() : null;
    
    const explanationMatch = response.match(/EXPLANATION: (.+?)$/s);
    const explanation = explanationMatch ? explanationMatch[1].trim() : '';
    
    return {
      approved,
      confidence,
      improvements,
      corrections,
      decision,
      improvedVersion,
      explanation,
      reasoning: explanation // Alias for knowledge transfer
    };
  }
  
  /**
   * Create branches from ancillary results
   */
  createBranches(results) {
    return results.map((result, index) => ({
      id: `branch-${index}`,
      source: result.agent || result.model,
      content: result.result || result.content,
      metadata: result.metadata || {},
      timestamp: Date.now()
    }));
  }
  
  /**
   * Detect significant disagreement between results
   */
  detectDisagreement(results) {
    // Simple heuristic: check if results are very different in length or content
    const lengths = results.map(r => (r.result || r.content || '').length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.map(l => Math.pow(l - avgLength, 2)).reduce((a, b) => a + b, 0) / lengths.length;
    
    // High variance indicates disagreement
    return variance > (avgLength * 0.5);
  }
  
  /**
   * Select best result from ancillary models
   */
  selectBestResult(results) {
    // Simple selection: choose longest response (more detailed)
    const best = results.reduce((best, current) => {
      const currentLength = (current.result || current.content || '').length;
      const bestLength = (best.result || best.content || '').length;
      return currentLength > bestLength ? current : best;
    });
    
    return {
      success: true,
      strategy: 'best-selection',
      selectedResult: best,
      metadata: {
        reviewed: false,
        selectionCriteria: 'length'
      }
    };
  }
  
  /**
   * Get supervision metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      approvalRate: this.metrics.totalReviews > 0 
        ? (this.metrics.approvals / this.metrics.totalReviews) 
        : 0,
      improvementRate: this.metrics.totalReviews > 0
        ? (this.metrics.improvements / this.metrics.totalReviews)
        : 0
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  ClaudeSupervisor,
  getInstance: (config) => {
    if (!instance) {
      instance = new ClaudeSupervisor(config);
    }
    return instance;
  }
};