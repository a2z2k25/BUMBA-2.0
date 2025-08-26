/**
 * BUMBA 2.0 Backend-Engineer Department Manager - OPTIMIZED
 * Lazy loading, reduced logging, faster startup
 */

const ModelAwareDepartmentManager = require('./model-aware-department-manager');
const { logger } = require('../logging/bumba-logger');

class BackendEngineerManagerOptimized extends ModelAwareDepartmentManager {
  constructor() {
    super('Backend-Engineer', 'technical', []);
    
    // Lazy-loaded specialist registry (not instantiated until needed)
    this.specialistRegistry = new Map([
      // Core development languages
      ['javascript-specialist', '../specialists/technical/languages/javascript-specialist'],
      ['python-specialist', '../specialists/technical/languages/python-specialist'],
      ['golang-specialist', '../specialists/technical/languages/golang-specialist'],
      ['rust-specialist', '../specialists/technical/languages/rust-specialist'],
      
      // Quality assurance
      ['code-reviewer', '../specialists/technical/qa/code-reviewer'],
      ['test-automator', '../specialists/technical/qa/test-automator'],
      ['debugger-specialist', '../specialists/technical/qa/debugger-specialist'],
      
      // DevOps
      ['devops-engineer', '../specialists/technical/devops/devops-engineer'],
      ['cloud-architect', '../specialists/technical/devops/cloud-architect'],
      ['sre-specialist', '../specialists/technical/devops/sre-specialist'],
      
      // Data & AI
      ['data-engineer', '../specialists/technical/data-ai/data-engineer'],
      ['ml-engineer', '../specialists/technical/data-ai/ml-engineer'],
      
      // Database & API
      ['database-admin', '../specialists/technical/database/database-admin'],
      ['api-architect', '../specialists/technical/database/api-architect']
    ]);
    
    // Loaded specialists cache
    this.loadedSpecialists = new Map();
    
    // Skip heavy orchestration initialization
    this.skipOrchestration = process.env.BUMBA_FAST_START === 'true';
    
    // Initialize expertise
    this.initializeExpertise();
    
    // Only log in debug mode
    if (process.env.LOG_LEVEL === 'DEBUG') {
      logger.info('Backend-Engineer Manager initialized (optimized)');
    }
  }
  
  /**
   * Lazy load a specialist only when needed
   */
  getSpecialist(type) {
    // Check cache first
    if (this.loadedSpecialists.has(type)) {
      return this.loadedSpecialists.get(type);
    }
    
    // Get path from registry
    const path = this.specialistRegistry.get(type);
    if (!path) {
      return null;
    }
    
    // Lazy load the specialist
    try {
      const SpecialistClass = require(path);
      const instance = new SpecialistClass(this.department);
      this.loadedSpecialists.set(type, instance);
      return instance;
    } catch (error) {
      if (process.env.LOG_LEVEL === 'DEBUG') {
        logger.error(`Failed to load specialist ${type}:`, error);
      }
      return null;
    }
  }
  
  /**
   * Override to use lazy loading
   */
  async assignSpecialist(task) {
    const bestMatch = this.selectBestSpecialist(task);
    if (!bestMatch) {
      return null;
    }
    
    // Lazy load only the needed specialist
    return this.getSpecialist(bestMatch.type);
  }
  
  /**
   * Select best specialist without loading them
   */
  selectBestSpecialist(task) {
    // Simple keyword matching without instantiation
    const taskStr = JSON.stringify(task).toLowerCase();
    
    if (taskStr.includes('python')) return { type: 'python-specialist' };
    if (taskStr.includes('javascript') || taskStr.includes('js')) return { type: 'javascript-specialist' };
    if (taskStr.includes('go') || taskStr.includes('golang')) return { type: 'golang-specialist' };
    if (taskStr.includes('rust')) return { type: 'rust-specialist' };
    if (taskStr.includes('review')) return { type: 'code-reviewer' };
    if (taskStr.includes('test')) return { type: 'test-automator' };
    if (taskStr.includes('debug')) return { type: 'debugger-specialist' };
    if (taskStr.includes('deploy') || taskStr.includes('devops')) return { type: 'devops-engineer' };
    if (taskStr.includes('cloud')) return { type: 'cloud-architect' };
    if (taskStr.includes('database') || taskStr.includes('sql')) return { type: 'database-admin' };
    if (taskStr.includes('api')) return { type: 'api-architect' };
    
    // Default to JavaScript specialist
    return { type: 'javascript-specialist' };
  }
  
  initializeExpertise() {
    this.expertise = {
      // Core competencies
      backend_architecture: true,
      api_design: true,
      database_management: true,
      microservices: true,
      cloud_infrastructure: true,
      devops: true,
      testing: true,
      security: true,
      performance_optimization: true,
      data_processing: true
    };
  }
  
  /**
   * Simplified task processing
   */
  async processTask(task, context) {
    // Skip sprint planning in fast mode
    if (this.skipOrchestration || context?.skipSprintPlanning) {
      return this.directTaskExecution(task, context);
    }
    
    // Normal sprint-based processing
    return super.processTask(task, context);
  }
  
  /**
   * Direct execution without heavy planning
   */
  async directTaskExecution(task, context) {
    const specialist = await this.assignSpecialist(task);
    if (!specialist) {
      return { error: 'No suitable specialist found' };
    }
    
    // Execute task
    if (specialist.processTask) {
      return specialist.processTask(task, context);
    }
    
    return { error: 'Specialist cannot process task' };
  }
  
  /**
   * Get status without loading all specialists
   */
  getStatus() {
    return {
      department: this.department,
      type: this.type,
      totalSpecialists: this.specialistRegistry.size,
      loadedSpecialists: this.loadedSpecialists.size,
      memoryEfficient: true
    };
  }
}

module.exports = { BackendEngineerManagerOptimized };