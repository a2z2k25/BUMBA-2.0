/**
 * BUMBA Review & Validation Router
 * Ensures all review and validation tasks are routed to Claude Max managers
 * Implements quality control through manager oversight
 */

const { getInstance: getClaudeMaxManager } = require('./claude-max-account-manager');
const { logger } = require('../logging/bumba-logger');

class ReviewValidationRouter {
  constructor(config = {}) {
    this.config = config;
    this.claudeMaxManager = getClaudeMaxManager(config);
    
    // Review/validation task patterns
    this.reviewPatterns = {
      // Code review patterns
      codeReview: {
        keywords: ['review code', 'code review', 'pull request', 'pr review', 'merge request'],
        priority: 'high',
        manager: 'backend-engineer-manager',
        requiresContext: true
      },
      
      // Design review patterns
      designReview: {
        keywords: ['design review', 'ui review', 'ux review', 'mockup review', 'prototype review'],
        priority: 'high',
        manager: 'design-engineer-manager',
        requiresContext: true
      },
      
      // Architecture review
      architectureReview: {
        keywords: ['architecture review', 'system design review', 'technical review'],
        priority: 'critical',
        manager: 'product-strategist',
        requiresContext: true
      },
      
      // Security review
      securityReview: {
        keywords: ['security review', 'security audit', 'vulnerability assessment'],
        priority: 'critical',
        manager: 'backend-engineer-manager',
        requiresContext: true
      },
      
      // Quality validation
      qualityValidation: {
        keywords: ['validate', 'verify', 'check quality', 'ensure quality', 'quality assurance'],
        priority: 'high',
        manager: 'product-strategist',
        requiresContext: false
      },
      
      // Approval requests
      approval: {
        keywords: ['approve', 'approval', 'sign off', 'authorize', 'confirm'],
        priority: 'high',
        manager: 'product-strategist',
        requiresContext: true
      },
      
      // Test validation
      testValidation: {
        keywords: ['test results', 'test validation', 'verify tests', 'test coverage'],
        priority: 'normal',
        manager: 'backend-engineer-manager',
        requiresContext: true
      }
    };
    
    // Manager expertise mapping
    this.managerExpertise = {
      'product-strategist': {
        domains: ['business', 'strategy', 'product', 'cross-domain'],
        canReview: ['architecture', 'requirements', 'roadmap', 'priorities']
      },
      'backend-engineer-manager': {
        domains: ['backend', 'api', 'database', 'security', 'infrastructure'],
        canReview: ['code', 'architecture', 'performance', 'security']
      },
      'design-engineer-manager': {
        domains: ['frontend', 'ui', 'ux', 'design', 'accessibility'],
        canReview: ['design', 'ui-code', 'user-experience', 'styling']
      }
    };
    
    // Review queue for batch processing
    this.reviewQueue = [];
    this.batchSize = config.reviewBatchSize || 5;
    this.batchTimeout = config.reviewBatchTimeout || 5000; // 5 seconds
    this.batchTimer = null;
  }
  
  /**
   * Route review/validation task to appropriate manager
   */
  async routeReviewTask(task) {
    const { type, description, context, priority, domain } = task;
    
    // Step 1: Identify review type
    const reviewType = this.identifyReviewType(description, type);
    
    if (!reviewType) {
      logger.warn('🟡 Could not identify review type, defaulting to product-strategist');
      return this.assignToManager('product-strategist', task, 'default-review');
    }
    
    // Step 2: Determine appropriate manager
    const manager = this.selectReviewManager(reviewType, domain);
    
    // Step 3: Check if we can batch this review
    if (this.canBatchReview(reviewType, priority)) {
      return this.queueForBatchReview(task, manager, reviewType);
    }
    
    // Step 4: Route immediately for high-priority reviews
    return await this.assignToManager(manager, task, reviewType);
  }
  
  /**
   * Identify the type of review from task description
   */
  identifyReviewType(description, taskType) {
    const desc = (description || '').toLowerCase();
    
    for (const [key, pattern] of Object.entries(this.reviewPatterns)) {
      const hasKeyword = pattern.keywords.some(keyword => 
        desc.includes(keyword)
      );
      
      if (hasKeyword || taskType === key) {
        return key;
      }
    }
    
    // Check for generic review/validation terms
    if (desc.match(/\b(review|validate|verify|check|approve|audit)\b/)) {
      return 'qualityValidation';
    }
    
    return null;
  }
  
  /**
   * Select the best manager for a review type
   */
  selectReviewManager(reviewType, domain) {
    const reviewConfig = this.reviewPatterns[reviewType];
    
    // Use configured manager for this review type
    if (reviewConfig?.manager) {
      return reviewConfig.manager;
    }
    
    // Select based on domain expertise
    if (domain) {
      for (const [manager, expertise] of Object.entries(this.managerExpertise)) {
        if (expertise.domains.includes(domain)) {
          return manager;
        }
      }
    }
    
    // Default to product strategist for cross-domain reviews
    return 'product-strategist';
  }
  
  /**
   * Assign review task to manager with Claude Max
   */
  async assignToManager(managerName, task, reviewType) {
    try {
      // Acquire Claude Max lock for manager
      const lockAcquired = await this.claudeMaxManager.acquireLock(
        managerName,
        reviewType === 'approval' ? 'review-validation' : 'manager',
        this.reviewPatterns[reviewType]?.priority === 'critical' ? 1 : 3
      );
      
      if (!lockAcquired) {
        // Queue if can't acquire lock immediately
        return this.queueForLater(managerName, task, reviewType);
      }
      
      // Get Claude Max configuration
      const modelConfig = this.claudeMaxManager.getClaudeMaxConfig();
      
      logger.info(`🏁 Review task assigned to ${managerName} with Claude Max`);
      
      return {
        success: true,
        agent: managerName,
        agentType: 'manager',
        model: modelConfig.model,
        modelConfig,
        usingClaudeMax: true,
        reviewType,
        priority: this.reviewPatterns[reviewType]?.priority || 'normal',
        prompt: this.buildReviewPrompt(task, managerName, reviewType),
        metadata: {
          reviewType,
          manager: managerName,
          requiresClaudeMax: true,
          timestamp: Date.now()
        }
      };
      
    } catch (error) {
      logger.error(`Failed to assign review to manager: ${error.message}`);
      
      // Return error state
      return {
        success: false,
        error: error.message,
        requiresRetry: true,
        manager: managerName,
        reviewType
      };
    }
  }
  
  /**
   * Build review prompt for manager
   */
  buildReviewPrompt(task, managerName, reviewType) {
    const expertise = this.managerExpertise[managerName];
    const reviewConfig = this.reviewPatterns[reviewType];
    
    let prompt = `As ${managerName}, perform a ${reviewType} with your expertise in ${expertise.domains.join(', ')}.\n\n`;
    
    // Add task description
    prompt += `Task: ${task.description || task.prompt}\n\n`;
    
    // Add context if available and required
    if (reviewConfig?.requiresContext && task.context) {
      prompt += `Context:\n${JSON.stringify(task.context, null, 2)}\n\n`;
    }
    
    // Add specific review criteria based on type
    prompt += this.getReviewCriteria(reviewType);
    
    // Add output format
    prompt += `\n\nProvide your review in the following format:
    
REVIEW_STATUS: [approved/needs-changes/rejected]
FINDINGS:
- [List key findings]

RECOMMENDATIONS:
- [List specific recommendations]

RISKS:
- [Identify any risks or concerns]

FINAL_DECISION: [Your decision and reasoning]`;
    
    return prompt;
  }
  
  /**
   * Get specific review criteria based on type
   */
  getReviewCriteria(reviewType) {
    const criteria = {
      codeReview: `Review criteria:
- Code quality and maintainability
- Performance implications
- Security vulnerabilities
- Test coverage
- Documentation completeness`,
      
      designReview: `Review criteria:
- User experience quality
- Visual consistency
- Accessibility compliance
- Responsive design
- Performance impact`,
      
      architectureReview: `Review criteria:
- System scalability
- Component coupling
- Security architecture
- Performance bottlenecks
- Technology choices`,
      
      securityReview: `Review criteria:
- Vulnerability assessment
- Authentication/authorization
- Data protection
- Input validation
- Security best practices`,
      
      qualityValidation: `Review criteria:
- Requirements compliance
- Quality standards
- Edge cases handling
- Error management
- User impact`,
      
      approval: `Review criteria:
- Business requirements met
- Technical feasibility
- Risk assessment
- Resource implications
- Timeline impact`,
      
      testValidation: `Review criteria:
- Test coverage adequacy
- Edge cases covered
- Performance tests
- Integration tests
- Test reliability`
    };
    
    return criteria[reviewType] || 'Perform a thorough review based on best practices.';
  }
  
  /**
   * Check if review can be batched
   */
  canBatchReview(reviewType, priority) {
    // Don't batch critical reviews
    if (priority === 'critical') {return false;}
    
    // Don't batch approvals
    if (reviewType === 'approval') {return false;}
    
    // Allow batching for normal reviews
    return this.config.enableBatchReviews !== false;
  }
  
  /**
   * Queue review for batch processing
   */
  queueForBatchReview(task, manager, reviewType) {
    this.reviewQueue.push({
      task,
      manager,
      reviewType,
      queuedAt: Date.now()
    });
    
    // Start batch timer if not already running
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatchReviews();
      }, this.batchTimeout);
    }
    
    // Process immediately if batch is full
    if (this.reviewQueue.length >= this.batchSize) {
      clearTimeout(this.batchTimer);
      this.processBatchReviews();
    }
    
    logger.info(`🟢 Review queued for batch processing (${this.reviewQueue.length}/${this.batchSize})`);
    
    return {
      success: true,
      queued: true,
      position: this.reviewQueue.length,
      estimatedProcessing: this.batchTimeout,
      manager,
      reviewType
    };
  }
  
  /**
   * Process batch of reviews
   */
  async processBatchReviews() {
    if (this.reviewQueue.length === 0) {return;}
    
    const batch = this.reviewQueue.splice(0, this.batchSize);
    this.batchTimer = null;
    
    logger.info(`🟢 Processing batch of ${batch.length} reviews`);
    
    // Group by manager
    const groupedReviews = {};
    batch.forEach(item => {
      if (!groupedReviews[item.manager]) {
        groupedReviews[item.manager] = [];
      }
      groupedReviews[item.manager].push(item);
    });
    
    // Process each manager's reviews
    const results = [];
    for (const [manager, reviews] of Object.entries(groupedReviews)) {
      const result = await this.procesManagerBatch(manager, reviews);
      results.push(result);
    }
    
    return results;
  }
  
  /**
   * Process batch of reviews for a single manager
   */
  async procesManagerBatch(manager, reviews) {
    try {
      // Acquire Claude Max lock once for the batch
      const lockAcquired = await this.claudeMaxManager.acquireLock(
        manager,
        'batch-review',
        2
      );
      
      if (!lockAcquired) {
        // Re-queue if can't acquire lock
        reviews.forEach(r => this.reviewQueue.push(r));
        return { success: false, requeued: true };
      }
      
      // Process all reviews
      const results = [];
      for (const review of reviews) {
        const prompt = this.buildReviewPrompt(
          review.task,
          manager,
          review.reviewType
        );
        
        results.push({
          ...review,
          prompt,
          modelConfig: this.claudeMaxManager.getClaudeMaxConfig()
        });
      }
      
      // Release lock after batch
      await this.claudeMaxManager.releaseLock(manager);
      
      return {
        success: true,
        manager,
        reviews: results
      };
      
    } catch (error) {
      logger.error(`Batch review failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        manager
      };
    }
  }
  
  /**
   * Queue task for later when lock unavailable
   */
  queueForLater(manager, task, reviewType) {
    const position = this.claudeMaxManager.getQueuePosition(manager) || 
                    this.reviewQueue.length + 1;
    
    return {
      success: false,
      queued: true,
      waitingForLock: true,
      position,
      manager,
      reviewType,
      message: `Review queued. Position ${position} for Claude Max access.`
    };
  }
  
  /**
   * Get review routing statistics
   */
  getRoutingStats() {
    return {
      queueLength: this.reviewQueue.length,
      batchSize: this.batchSize,
      claudeMaxStatus: this.claudeMaxManager.getStatus(),
      reviewPatterns: Object.keys(this.reviewPatterns).length,
      managers: Object.keys(this.managerExpertise)
    };
  }
  
  /**
   * Clear review queue (emergency)
   */
  clearQueue() {
    const cleared = this.reviewQueue.length;
    this.reviewQueue = [];
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    logger.warn(`🟢 Cleared ${cleared} reviews from queue`);
    
    return cleared;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  ReviewValidationRouter,
  getInstance: (config) => {
    if (!instance) {
      instance = new ReviewValidationRouter(config);
    }
    return instance;
  }
};