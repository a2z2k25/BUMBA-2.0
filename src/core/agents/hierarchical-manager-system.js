/**
 * BUMBA Hierarchical Manager System
 * Ensures manager agents use Claude for domain-specific and cross-domain requests
 */

const { SupervisedParallelSystem } = require('./supervised-parallel-system');
const { logger } = require('../logging/bumba-logger');
const { getInstance: getClaudeMaxManager } = require('./claude-max-account-manager');
const { getInstance: getFreeTierManager } = require('./free-tier-manager');

class HierarchicalManagerSystem extends SupervisedParallelSystem {
  constructor(config = {}) {
    super(config);
    
    // Initialize Claude Max and Free Tier managers
    this.claudeMaxManager = getClaudeMaxManager(config);
    this.freeTierManager = getFreeTierManager(config);
    
    // Manager hierarchy configuration
    this.hierarchy = {
      // Executive level (always Claude Max)
      executive: {
        'product-strategist-executive': {
          model: 'claude-max',
          requiresClaudeMax: true,
          priority: 1,
          domains: ['strategy', 'business', 'product', 'roadmap'],
          role: 'CEO-level decision making'
        }
      },
      
      // Manager level (Claude Max for single manager, free tier for parallel managers)
      managers: {
        'product-strategist': {
          model: 'claude-max',
          requiresClaudeMax: true,
          priority: 2,
          domains: ['strategy', 'business', 'requirements'],
          subordinates: ['business-analyst', 'market-researcher']
        },
        'design-engineer-manager': {
          model: 'claude-max',
          requiresClaudeMax: true,
          priority: 2,
          domains: ['design', 'ui', 'ux', 'frontend'],
          subordinates: ['ui-designer', 'ux-researcher', 'frontend-dev']
        },
        'backend-engineer-manager': {
          model: 'claude-max',
          requiresClaudeMax: true,
          priority: 2,
          domains: ['backend', 'api', 'security', 'infrastructure'],
          subordinates: ['backend-dev', 'security-engineer', 'devops']
        }
      },
      
      // Worker level (use free tier models based on domain)
      workers: {
        'business-analyst': { model: 'dynamic', preferredModel: 'deepseek', domains: ['analysis', 'reasoning'] },
        'market-researcher': { model: 'dynamic', preferredModel: 'gemini', domains: ['research', 'general'] },
        'ui-designer': { model: 'dynamic', preferredModel: 'gemini', domains: ['ui', 'design'] },
        'ux-researcher': { model: 'dynamic', preferredModel: 'gemini', domains: ['ux', 'research'] },
        'frontend-dev': { model: 'dynamic', preferredModel: 'qwen', domains: ['frontend', 'coding'] },
        'backend-dev': { model: 'dynamic', preferredModel: 'qwen', domains: ['backend', 'coding'] },
        'security-engineer': { model: 'dynamic', preferredModel: 'deepseek', domains: ['security', 'reasoning'] },
        'devops': { model: 'dynamic', preferredModel: 'qwen', domains: ['infrastructure', 'coding'] }
      }
    };
    
    this.domainOwnership = {};
    this.initializeDomainOwnership();
  }
  
  /**
   * Initialize domain ownership mapping
   */
  initializeDomainOwnership() {
    // Map domains to their managing agents
    Object.entries(this.hierarchy.managers).forEach(([manager, config]) => {
      config.domains.forEach(domain => {
        this.domainOwnership[domain] = manager;
      });
    });
  }
  
  /**
   * Assign models to agents based on parallel execution context
   */
  async assignModelsForExecution(agents) {
    const managers = agents.filter(a => this.isManager(a.agent));
    const workers = agents.filter(a => !this.isManager(a.agent));
    
    // Single manager scenario - gets Claude Max
    if (managers.length === 1) {
      const manager = managers[0];
      const lockAcquired = await this.claudeMaxManager.acquireLock(
        manager.agent,
        'manager',
        2
      );
      
      if (lockAcquired) {
        manager.modelConfig = this.claudeMaxManager.getClaudeMaxConfig();
        manager.usingClaudeMax = true;
        logger.info(`🏁 Manager ${manager.agent} assigned Claude Max`);
      } else {
        throw new Error(`Failed to acquire Claude Max for manager ${manager.agent}`);
      }
    }
    // Multiple managers - executive gets Claude Max, others get free tier
    else if (managers.length > 1) {
      // Find or create executive
      let executive = managers.find(m => m.agent.includes('executive'));
      
      if (!executive) {
        // Elevate product-strategist to executive
        executive = managers.find(m => m.agent === 'product-strategist');
        if (executive) {
          executive.agent = 'product-strategist-executive';
          executive.elevated = true;
        }
      }
      
      if (executive) {
        const lockAcquired = await this.claudeMaxManager.acquireLock(
          executive.agent,
          'executive',
          1
        );
        
        if (lockAcquired) {
          executive.modelConfig = this.claudeMaxManager.getClaudeMaxConfig();
          executive.usingClaudeMax = true;
          logger.info(`🏁 Executive ${executive.agent} assigned Claude Max`);
        }
      }
      
      // Assign free tier models to other managers
      for (const manager of managers) {
        if (manager !== executive) {
          const model = await this.freeTierManager.getBestAvailableModel({
            taskType: 'reasoning',
            allowPaid: false
          });
          
          manager.modelConfig = model;
          manager.usingClaudeMax = false;
          logger.info(`🟢 Manager ${manager.agent} assigned ${model.model} (free tier)`);
        }
      }
    }
    
    // Assign models to workers based on domain
    for (const worker of workers) {
      const workerConfig = this.hierarchy.workers[worker.agent];
      const taskType = this.getTaskTypeFromDomain(workerConfig?.domains[0]);
      
      const model = await this.freeTierManager.getBestAvailableModel({
        taskType,
        allowPaid: false
      });
      
      worker.modelConfig = model;
      logger.info(`🟢 Worker ${worker.agent} assigned ${model.model} for ${taskType}`);
    }
    
    return { managers, workers };
  }
  
  /**
   * Get task type from domain for model selection
   */
  getTaskTypeFromDomain(domain) {
    const domainMapping = {
      'coding': 'coding',
      'frontend': 'coding',
      'backend': 'coding',
      'infrastructure': 'coding',
      'reasoning': 'reasoning',
      'analysis': 'reasoning',
      'security': 'reasoning',
      'general': 'general',
      'ui': 'general',
      'ux': 'general',
      'research': 'general',
      'design': 'general'
    };
    
    return domainMapping[domain] || 'general';
  }
  
  /**
   * Check if an agent is a manager
   */
  isManager(agentName) {
    return !!(
      this.hierarchy.managers[agentName] ||
      this.hierarchy.executive[agentName] ||
      agentName.includes('manager') ||
      agentName.includes('executive')
    );
  }
  
  /**
   * Determine which agent should handle a task based on domain
   */
  determineResponsibleAgent(task, requestedDomains = []) {
    // Check if multiple operational domains are involved
    const involvedManagers = new Set();
    
    requestedDomains.forEach(domain => {
      const manager = this.domainOwnership[domain];
      if (manager) {
        involvedManagers.add(manager);
      }
    });
    
    // If multiple managers involved, elevate to Product Strategist
    if (involvedManagers.size > 1) {
      logger.info('🟢 Cross-domain request detected - elevating to Product Strategist (Claude)');
      return {
        agent: 'product-strategist',
        model: 'claude',
        reason: 'Cross-domain coordination required',
        involvedDomains: requestedDomains
      };
    }
    
    // Single domain - use domain-specific manager
    if (involvedManagers.size === 1) {
      const manager = Array.from(involvedManagers)[0];
      logger.info(`🟢 Domain-specific request - assigning to ${manager} (Claude)`);
      return {
        agent: manager,
        model: 'claude',
        reason: 'Domain-specific management',
        domain: requestedDomains[0]
      };
    }
    
    // No specific domain - analyze task to determine
    return this.analyzeTaskForAgent(task);
  }
  
  /**
   * Analyze task content to determine responsible agent
   */
  analyzeTaskForAgent(task) {
    const taskStr = (task.description || task.prompt || '').toLowerCase();
    
    // Check for domain keywords
    for (const [domain, manager] of Object.entries(this.domainOwnership)) {
      if (taskStr.includes(domain)) {
        return {
          agent: manager,
          model: 'claude',
          reason: `${domain} domain detected`,
          domain
        };
      }
    }
    
    // Default to worker level with cheaper model
    return {
      agent: 'general-worker',
      model: 'gemini',
      reason: 'General task - using cost-effective model'
    };
  }
  
  /**
   * Execute with hierarchical management
   */
  async executeHierarchical(tasks, options = {}) {
    const startTime = Date.now();
    
    logger.info('🟢 Hierarchical Execution Starting');
    
    // Step 1: Analyze task domains
    const domains = this.extractDomains(tasks, options);
    logger.info(`🟢 Detected domains: ${domains.join(', ')}`);
    
    // Step 2: Determine managing agent
    const manager = this.determineResponsibleAgent(tasks[0], domains);
    logger.info(`🟢 Manager assigned: ${manager.agent}`);
    
    // Step 3: Prepare agents for model assignment
    const agents = [{
      agent: manager.agent,
      type: 'management',
      domains: manager.involvedDomains || [manager.domain]
    }];
    
    // Step 4: Assign models based on parallel context
    const { managers, workers } = await this.assignModelsForExecution(agents);
    const assignedManager = managers[0];
    
    // Step 5: Create management task with assigned model
    const managementTask = {
      agent: assignedManager.agent,
      model: assignedManager.modelConfig.model,
      modelConfig: assignedManager.modelConfig,
      usingClaudeMax: assignedManager.usingClaudeMax,
      prompt: this.buildManagementPrompt(tasks, manager, options),
      type: 'management',
      metadata: {
        involvedDomains: domains,
        originalTasks: tasks.length,
        managementReason: manager.reason
      }
    };
    
    // Step 6: Execute management phase
    logger.info(`🟢 Phase 1: Management Planning (${assignedManager.usingClaudeMax ? 'Claude Max' : assignedManager.modelConfig.model})`);
    
    let managementResult;
    try {
      managementResult = await this.executeParallel([managementTask]);
      
      if (!managementResult.success) {
        throw new Error('Management phase failed');
      }
    } catch (error) {
      // Release Claude Max lock if acquired
      if (assignedManager.usingClaudeMax) {
        await this.claudeMaxManager.releaseLock(assignedManager.agent);
      }
      
      return {
        success: false,
        error: error.message,
        details: managementResult
      };
    } finally {
      // Release Claude Max lock after management phase
      if (assignedManager.usingClaudeMax) {
        await this.claudeMaxManager.releaseLock(assignedManager.agent);
      }
    }
    
    // Step 5: Parse management decisions
    const workPlan = this.parseWorkPlan(managementResult.results[0]);
    
    // Step 6: Delegate to workers (cheaper models)
    logger.info('🟢 Phase 2: Worker Execution (Gemini/GPT)');
    const workerTasks = this.createWorkerTasks(workPlan, tasks);
    
    // Use supervised execution for quality control
    const executionResult = await this.executeWithSupervision(workerTasks, {
      ...options,
      description: `Hierarchical execution: ${manager.agent} managing ${workerTasks.length} tasks`,
      requireSupervision: domains.includes('security') || domains.includes('production')
    });
    
    // Step 7: Manager review of results
    if (executionResult.success && manager.model === 'claude') {
      logger.info('🏁 Phase 3: Manager Review (Claude)');
      
      const reviewTask = {
        agent: manager.agent,
        model: 'claude',
        prompt: this.buildReviewPrompt(executionResult, workPlan, manager),
        type: 'review'
      };
      
      const reviewResult = await this.executeParallel([reviewTask]);
      
      return {
        success: true,
        executionType: 'hierarchical',
        manager: manager.agent,
        managementPhase: managementResult,
        executionPhase: executionResult,
        reviewPhase: reviewResult,
        metadata: {
          totalTime: Date.now() - startTime,
          hierarchy: {
            workers: workerTasks.map(t => t.agent),
            domains: domains
          },
          modelUsage: {
            claude: domains.length > 1 ? 'cross-domain-coordination' : 'domain-management',
            gemini: 'worker-execution'
          }
        }
      };
    }
    
    return executionResult;
  }
  
  /**
   * Extract domains from tasks
   */
  extractDomains(tasks, options) {
    const domains = new Set();
    
    // Check explicit domains in options
    if (options.domains) {
      options.domains.forEach(d => domains.add(d));
    }
    
    // Analyze task content
    tasks.forEach(task => {
      const taskStr = (task.description || task.prompt || '').toLowerCase();
      
      // Check all known domains
      Object.keys(this.domainOwnership).forEach(domain => {
        if (taskStr.includes(domain)) {
          domains.add(domain);
        }
      });
      
      // Check task type
      if (task.type) {
        domains.add(task.type.toLowerCase());
      }
    });
    
    return Array.from(domains);
  }
  
  /**
   * Build management prompt for Claude manager
   */
  buildManagementPrompt(tasks, manager, options) {
    const taskList = tasks.map((t, i) => 
      `${i + 1}. ${t.description || t.prompt}`
    ).join('\n');
    
    return `As ${manager.agent} (${manager.reason}), create a detailed work plan for:

Tasks:
${taskList}

Context:
- Domains involved: ${manager.involvedDomains?.join(', ') || manager.domain || 'general'}
- Priority: ${options.priority || 'normal'}
- Constraints: ${options.constraints || 'none'}

Provide a structured work plan including:
1. Task breakdown and dependencies
2. Resource allocation (which workers to assign)
3. Quality criteria
4. Risk assessment
5. Timeline estimate

Format your response as:
WORK_PLAN:
- Task 1: [description] -> [assigned worker]
- Task 2: [description] -> [assigned worker]
...

DEPENDENCIES:
[List any task dependencies]

RISKS:
[Identify potential issues]

SUCCESS_CRITERIA:
[Define what success looks like]`;
  }
  
  /**
   * Parse work plan from management result
   */
  parseWorkPlan(managementResult) {
    const content = managementResult.result || managementResult.content || '';
    
    // Extract work plan sections
    const workPlanMatch = content.match(/WORK_PLAN:([\s\S]*?)(?=DEPENDENCIES:|RISKS:|SUCCESS_CRITERIA:|$)/);
    const dependenciesMatch = content.match(/DEPENDENCIES:([\s\S]*?)(?=RISKS:|SUCCESS_CRITERIA:|$)/);
    const risksMatch = content.match(/RISKS:([\s\S]*?)(?=SUCCESS_CRITERIA:|$)/);
    const criteriaMatch = content.match(/SUCCESS_CRITERIA:([\s\S]*?)$/);
    
    return {
      tasks: workPlanMatch ? this.parseTaskAssignments(workPlanMatch[1]) : [],
      dependencies: dependenciesMatch ? dependenciesMatch[1].trim() : '',
      risks: risksMatch ? risksMatch[1].trim() : '',
      criteria: criteriaMatch ? criteriaMatch[1].trim() : ''
    };
  }
  
  /**
   * Parse task assignments from work plan
   */
  parseTaskAssignments(workPlanText) {
    const lines = workPlanText.split('\n').filter(l => l.trim());
    const assignments = [];
    
    lines.forEach(line => {
      const match = line.match(/Task \d+: (.+?) -> (.+)/);
      if (match) {
        assignments.push({
          description: match[1].trim(),
          worker: match[2].trim()
        });
      }
    });
    
    return assignments;
  }
  
  /**
   * Create worker tasks based on work plan
   */
  createWorkerTasks(workPlan, originalTasks) {
    const workerTasks = [];
    
    workPlan.tasks.forEach((assignment, index) => {
      // Determine worker model (cheaper for non-critical)
      const workerConfig = this.hierarchy.workers[assignment.worker] || 
                          { model: 'gemini', domains: [] };
      
      workerTasks.push({
        agent: assignment.worker,
        model: workerConfig.model,
        prompt: assignment.description,
        type: workerConfig.domains[0] || 'general',
        metadata: {
          managedTask: true,
          originalTask: originalTasks[index] || null
        }
      });
    });
    
    return workerTasks;
  }
  
  /**
   * Build review prompt for manager
   */
  buildReviewPrompt(executionResult, workPlan, manager) {
    const results = executionResult.finalOutput || executionResult.primaryResults;
    
    return `As ${manager.agent}, review the execution results:

Original Work Plan:
${JSON.stringify(workPlan, null, 2)}

Execution Results:
${JSON.stringify(results, null, 2)}

Success Criteria:
${workPlan.criteria}

Provide your management review:
1. Did the execution meet success criteria?
2. What improvements are needed?
3. Are there any risks that materialized?
4. Final approval status

Format as:
APPROVAL: [yes/no]
IMPROVEMENTS: [list]
RISKS_REALIZED: [list]
FINAL_DECISION: [your decision]`;
  }
  
  /**
   * Get hierarchy metrics
   */
  getHierarchyMetrics() {
    return {
      ...this.getSupervisionMetrics(),
      hierarchy: {
        managers: Object.keys(this.hierarchy.managers).length,
        workers: Object.keys(this.hierarchy.workers).length,
        domains: Object.keys(this.domainOwnership).length
      },
      modelDistribution: {
        claudeManagers: Object.values(this.hierarchy.managers)
          .filter(m => m.model === 'claude').length,
        geminiWorkers: Object.values(this.hierarchy.workers)
          .filter(w => w.model === 'gemini').length
      }
    };
  }
}

// Export patterns for different scenarios
class HierarchicalPatterns {
  /**
   * Single domain pattern - one manager, multiple workers
   */
  static singleDomainPattern() {
    return {
      supervisionStrategy: 'review-and-merge',
      useSupervisionFor: ['critical'],
      primaryModel: 'gemini',
      managerModel: 'claude'
    };
  }
  
  /**
   * Cross-domain pattern - product strategist coordinates
   */
  static crossDomainPattern() {
    return {
      supervisionStrategy: 'branching',
      useSupervisionFor: ['architecture', 'security'],
      primaryModel: 'gemini',
      executiveModel: 'claude',
      alwaysElevate: true
    };
  }
  
  /**
   * Executive pattern - CEO-level decisions
   */
  static executivePattern() {
    return {
      supervisionStrategy: 'real-time',
      useSupervisionFor: ['strategic', 'business-critical'],
      executiveModel: 'claude',
      requireExecutiveApproval: true
    };
  }
}

module.exports = {
  HierarchicalManagerSystem,
  HierarchicalPatterns
};