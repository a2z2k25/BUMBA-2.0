/**
 * BUMBA Task Decomposition Engine
 * Breaks down complex tasks into manageable subtasks
 * Optimizes task distribution across agents
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Task Types
 */
const TaskType = {
  ATOMIC: 'atomic', // Cannot be broken down further
  COMPOSITE: 'composite', // Can be decomposed
  SEQUENTIAL: 'sequential', // Must be done in order
  PARALLEL: 'parallel', // Can be done simultaneously
  CONDITIONAL: 'conditional', // Depends on conditions
  ITERATIVE: 'iterative' // Requires multiple iterations
};

/**
 * Task Complexity Levels
 */
const ComplexityLevel = {
  TRIVIAL: 1,
  SIMPLE: 2,
  MODERATE: 3,
  COMPLEX: 4,
  VERY_COMPLEX: 5
};

/**
 * Decomposition Strategies
 */
const DecompositionStrategy = {
  FUNCTIONAL: 'functional', // Break by function/feature
  TECHNICAL: 'technical', // Break by technical layers
  TEMPORAL: 'temporal', // Break by time/phases
  RESOURCE: 'resource', // Break by resource requirements
  HYBRID: 'hybrid' // Combination of strategies
};

/**
 * Task Decomposition Engine
 */
class TaskDecompositionEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxDecompositionDepth: config.maxDecompositionDepth || 5,
      minTaskSize: config.minTaskSize || 1,
      maxTaskSize: config.maxTaskSize || 10,
      parallelizationThreshold: config.parallelizationThreshold || 0.7,
      strategy: config.strategy || DecompositionStrategy.HYBRID,
      autoDecompose: config.autoDecompose !== false,
      optimizeForCost: config.optimizeForCost !== false,
      optimizeForSpeed: config.optimizeForSpeed !== false,
      ...config
    };
    
    // Task patterns and templates
    this.taskPatterns = new Map();
    this.decompositionTemplates = new Map();
    
    // Decomposition history
    this.decompositionHistory = [];
    
    // Statistics
    this.stats = {
      totalDecompositions: 0,
      totalSubtasks: 0,
      averageDecompositionDepth: 0,
      averageSubtasksPerTask: 0,
      parallelizationRate: 0
    };
    
    // Initialize patterns
    this.initializePatterns();
  }
  
  /**
   * Initialize task patterns
   */
  initializePatterns() {
    // Common task patterns
    this.taskPatterns.set('api_development', {
      type: TaskType.COMPOSITE,
      subtasks: [
        { name: 'design_schema', type: TaskType.ATOMIC, complexity: 2 },
        { name: 'implement_endpoints', type: TaskType.COMPOSITE, complexity: 3 },
        { name: 'add_validation', type: TaskType.ATOMIC, complexity: 2 },
        { name: 'write_tests', type: TaskType.PARALLEL, complexity: 2 },
        { name: 'document_api', type: TaskType.ATOMIC, complexity: 1 }
      ],
      dependencies: ['design_schema -> implement_endpoints', 'implement_endpoints -> add_validation']
    });
    
    this.taskPatterns.set('ui_component', {
      type: TaskType.COMPOSITE,
      subtasks: [
        { name: 'design_component', type: TaskType.ATOMIC, complexity: 2 },
        { name: 'implement_logic', type: TaskType.ATOMIC, complexity: 3 },
        { name: 'add_styling', type: TaskType.ATOMIC, complexity: 2 },
        { name: 'add_tests', type: TaskType.ATOMIC, complexity: 2 }
      ],
      dependencies: ['design_component -> implement_logic', 'implement_logic -> add_styling']
    });
    
    this.taskPatterns.set('database_optimization', {
      type: TaskType.SEQUENTIAL,
      subtasks: [
        { name: 'analyze_queries', type: TaskType.ATOMIC, complexity: 2 },
        { name: 'identify_bottlenecks', type: TaskType.ATOMIC, complexity: 3 },
        { name: 'create_indexes', type: TaskType.ATOMIC, complexity: 2 },
        { name: 'optimize_queries', type: TaskType.ATOMIC, complexity: 3 },
        { name: 'verify_performance', type: TaskType.ATOMIC, complexity: 2 }
      ],
      dependencies: 'sequential'
    });
    
    this.taskPatterns.set('security_audit', {
      type: TaskType.PARALLEL,
      subtasks: [
        { name: 'scan_vulnerabilities', type: TaskType.ATOMIC, complexity: 3 },
        { name: 'review_auth', type: TaskType.ATOMIC, complexity: 3 },
        { name: 'check_dependencies', type: TaskType.ATOMIC, complexity: 2 },
        { name: 'test_penetration', type: TaskType.ATOMIC, complexity: 4 },
        { name: 'generate_report', type: TaskType.ATOMIC, complexity: 2 }
      ],
      dependencies: ['all -> generate_report']
    });
  }
  
  /**
   * Decompose task
   */
  async decomposeTask(task, options = {}) {
    const decomposition = {
      id: this.generateDecompositionId(),
      originalTask: task,
      strategy: options.strategy || this.config.strategy,
      timestamp: Date.now(),
      subtasks: [],
      dependencies: [],
      metadata: {}
    };
    
    logger.info(`🟢 Decomposing task: ${task.name || task.description}`);
    
    try {
      // Analyze task
      const analysis = this.analyzeTask(task);
      decomposition.analysis = analysis;
      
      // Check if decomposition is needed
      if (!this.needsDecomposition(analysis)) {
        decomposition.subtasks = [task];
        decomposition.metadata.reason = 'Task is atomic';
      } else {
        // Apply decomposition strategy
        const result = await this.applyDecompositionStrategy(
          task, 
          analysis, 
          decomposition.strategy
        );
        
        decomposition.subtasks = result.subtasks;
        decomposition.dependencies = result.dependencies;
        decomposition.metadata = result.metadata;
      }
      
      // Optimize decomposition
      if (options.optimize !== false) {
        this.optimizeDecomposition(decomposition);
      }
      
      // Validate decomposition
      this.validateDecomposition(decomposition);
      
      // Calculate metrics
      this.calculateMetrics(decomposition);
      
      // Store in history
      this.decompositionHistory.push(decomposition);
      this.updateStatistics(decomposition);
      
      // Emit decomposition event
      this.emit('task:decomposed', decomposition);
      
      logger.info(`🏁 Task decomposed into ${decomposition.subtasks.length} subtasks`);
      
      return decomposition;
      
    } catch (error) {
      logger.error(`🔴 Task decomposition failed: ${error.message}`);
      decomposition.error = error.message;
      throw error;
    }
  }
  
  /**
   * Analyze task
   */
  analyzeTask(task) {
    const analysis = {
      type: this.detectTaskType(task),
      complexity: this.calculateComplexity(task),
      estimatedDuration: this.estimateDuration(task),
      requiredCapabilities: this.identifyCapabilities(task),
      parallelizable: this.checkParallelizable(task),
      pattern: this.matchPattern(task)
    };
    
    return analysis;
  }
  
  /**
   * Detect task type
   */
  detectTaskType(task) {
    if (task.type) {return task.type;}
    
    const description = (task.name + ' ' + task.description).toLowerCase();
    
    if (description.includes('implement') || description.includes('build')) {
      return TaskType.COMPOSITE;
    }
    if (description.includes('sequence') || description.includes('step')) {
      return TaskType.SEQUENTIAL;
    }
    if (description.includes('parallel') || description.includes('concurrent')) {
      return TaskType.PARALLEL;
    }
    if (description.includes('if') || description.includes('when')) {
      return TaskType.CONDITIONAL;
    }
    if (description.includes('iterate') || description.includes('repeat')) {
      return TaskType.ITERATIVE;
    }
    
    return TaskType.ATOMIC;
  }
  
  /**
   * Calculate complexity
   */
  calculateComplexity(task) {
    if (task.complexity) {return task.complexity;}
    
    let complexity = ComplexityLevel.SIMPLE;
    
    const description = (task.name + ' ' + task.description).toLowerCase();
    
    // Increase complexity for certain keywords
    const complexityFactors = {
      'architect': 2,
      'design': 1,
      'implement': 1,
      'integrate': 2,
      'optimize': 2,
      'refactor': 2,
      'security': 2,
      'performance': 2,
      'distributed': 3,
      'machine learning': 3,
      'ai': 3
    };
    
    Object.entries(complexityFactors).forEach(([keyword, factor]) => {
      if (description.includes(keyword)) {
        complexity = Math.min(complexity + factor, ComplexityLevel.VERY_COMPLEX);
      }
    });
    
    return complexity;
  }
  
  /**
   * Estimate duration
   */
  estimateDuration(task) {
    const complexity = this.calculateComplexity(task);
    
    // Base duration in minutes
    const baseDurations = {
      [ComplexityLevel.TRIVIAL]: 5,
      [ComplexityLevel.SIMPLE]: 15,
      [ComplexityLevel.MODERATE]: 60,
      [ComplexityLevel.COMPLEX]: 240,
      [ComplexityLevel.VERY_COMPLEX]: 480
    };
    
    return baseDurations[complexity] || 30;
  }
  
  /**
   * Identify required capabilities
   */
  identifyCapabilities(task) {
    const capabilities = [];
    const description = (task.name + ' ' + task.description).toLowerCase();
    
    const capabilityMap = {
      'api': ['api-development', 'rest', 'backend'],
      'database': ['database', 'sql', 'query-optimization'],
      'frontend': ['frontend', 'ui', 'react', 'vue'],
      'backend': ['backend', 'server', 'api'],
      'security': ['security', 'authentication', 'encryption'],
      'test': ['testing', 'qa', 'automation'],
      'deploy': ['deployment', 'ci-cd', 'devops']
    };
    
    Object.entries(capabilityMap).forEach(([keyword, caps]) => {
      if (description.includes(keyword)) {
        capabilities.push(...caps);
      }
    });
    
    return [...new Set(capabilities)];
  }
  
  /**
   * Check if parallelizable
   */
  checkParallelizable(task) {
    const type = this.detectTaskType(task);
    
    if (type === TaskType.PARALLEL) {return true;}
    if (type === TaskType.SEQUENTIAL) {return false;}
    
    // Check for dependencies
    if (task.dependencies && task.dependencies.length > 0) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Match pattern
   */
  matchPattern(task) {
    const description = (task.name + ' ' + task.description).toLowerCase();
    
    for (const [patternName, pattern] of this.taskPatterns) {
      const keywords = patternName.split('_');
      
      if (keywords.every(keyword => description.includes(keyword))) {
        return { name: patternName, pattern };
      }
    }
    
    return null;
  }
  
  /**
   * Check if needs decomposition
   */
  needsDecomposition(analysis) {
    // Don't decompose atomic tasks
    if (analysis.type === TaskType.ATOMIC) {return false;}
    
    // Don't decompose simple tasks
    if (analysis.complexity <= ComplexityLevel.SIMPLE) {return false;}
    
    // Decompose if estimated duration is too long
    if (analysis.estimatedDuration > 120) {return true;}
    
    // Decompose composite tasks
    if (analysis.type === TaskType.COMPOSITE) {return true;}
    
    return false;
  }
  
  /**
   * Apply decomposition strategy
   */
  async applyDecompositionStrategy(task, analysis, strategy) {
    switch (strategy) {
      case DecompositionStrategy.FUNCTIONAL:
        return this.functionalDecomposition(task, analysis);
        
      case DecompositionStrategy.TECHNICAL:
        return this.technicalDecomposition(task, analysis);
        
      case DecompositionStrategy.TEMPORAL:
        return this.temporalDecomposition(task, analysis);
        
      case DecompositionStrategy.RESOURCE:
        return this.resourceDecomposition(task, analysis);
        
      case DecompositionStrategy.HYBRID:
      default:
        return this.hybridDecomposition(task, analysis);
    }
  }
  
  /**
   * Functional decomposition
   */
  functionalDecomposition(task, analysis) {
    const subtasks = [];
    const dependencies = [];
    
    // If pattern matched, use template
    if (analysis.pattern) {
      const template = analysis.pattern.pattern;
      
      template.subtasks.forEach((subtaskTemplate, index) => {
        subtasks.push({
          id: `${task.id || 'task'}-${index}`,
          name: subtaskTemplate.name,
          type: subtaskTemplate.type,
          complexity: subtaskTemplate.complexity,
          parent: task.id,
          capabilities: this.identifyCapabilities({ name: subtaskTemplate.name })
        });
      });
      
      if (template.dependencies === 'sequential') {
        for (let i = 0; i < subtasks.length - 1; i++) {
          dependencies.push({
            from: subtasks[i].id,
            to: subtasks[i + 1].id,
            type: 'sequential'
          });
        }
      } else if (Array.isArray(template.dependencies)) {
        template.dependencies.forEach(dep => {
          const [from, to] = dep.split(' -> ');
          const fromTask = subtasks.find(t => t.name === from);
          const toTask = subtasks.find(t => t.name === to);
          
          if (fromTask && toTask) {
            dependencies.push({
              from: fromTask.id,
              to: toTask.id,
              type: 'dependency'
            });
          }
        });
      }
    } else {
      // Generic functional breakdown
      const functions = this.identifyFunctions(task);
      
      functions.forEach((func, index) => {
        subtasks.push({
          id: `${task.id || 'task'}-${index}`,
          name: func,
          type: TaskType.ATOMIC,
          complexity: ComplexityLevel.SIMPLE,
          parent: task.id,
          capabilities: this.identifyCapabilities({ name: func })
        });
      });
    }
    
    return {
      subtasks,
      dependencies,
      metadata: { strategy: 'functional' }
    };
  }
  
  /**
   * Technical decomposition
   */
  technicalDecomposition(task, analysis) {
    const subtasks = [];
    const layers = ['frontend', 'backend', 'database', 'infrastructure'];
    
    layers.forEach((layer, index) => {
      if (this.taskInvolvesLayer(task, layer)) {
        subtasks.push({
          id: `${task.id || 'task'}-${layer}`,
          name: `${task.name}_${layer}`,
          type: TaskType.ATOMIC,
          complexity: Math.ceil(analysis.complexity / layers.length),
          layer,
          parent: task.id,
          capabilities: [layer]
        });
      }
    });
    
    // Add dependencies based on layers
    const dependencies = [];
    if (subtasks.find(t => t.layer === 'database') && subtasks.find(t => t.layer === 'backend')) {
      dependencies.push({
        from: subtasks.find(t => t.layer === 'database').id,
        to: subtasks.find(t => t.layer === 'backend').id,
        type: 'dependency'
      });
    }
    
    return {
      subtasks,
      dependencies,
      metadata: { strategy: 'technical' }
    };
  }
  
  /**
   * Temporal decomposition
   */
  temporalDecomposition(task, analysis) {
    const subtasks = [];
    const phases = ['planning', 'implementation', 'testing', 'deployment'];
    
    const phaseDuration = analysis.estimatedDuration / phases.length;
    
    phases.forEach((phase, index) => {
      subtasks.push({
        id: `${task.id || 'task'}-${phase}`,
        name: `${task.name}_${phase}`,
        type: TaskType.ATOMIC,
        complexity: Math.ceil(analysis.complexity / phases.length),
        phase,
        parent: task.id,
        estimatedDuration: phaseDuration,
        order: index
      });
    });
    
    // Sequential dependencies
    const dependencies = [];
    for (let i = 0; i < subtasks.length - 1; i++) {
      dependencies.push({
        from: subtasks[i].id,
        to: subtasks[i + 1].id,
        type: 'sequential'
      });
    }
    
    return {
      subtasks,
      dependencies,
      metadata: { strategy: 'temporal' }
    };
  }
  
  /**
   * Resource decomposition
   */
  resourceDecomposition(task, analysis) {
    const subtasks = [];
    const requiredCapabilities = analysis.requiredCapabilities;
    
    // Group by capability
    const capabilityGroups = this.groupCapabilities(requiredCapabilities);
    
    capabilityGroups.forEach((group, index) => {
      subtasks.push({
        id: `${task.id || 'task'}-group${index}`,
        name: `${task.name}_${group.name}`,
        type: TaskType.ATOMIC,
        complexity: Math.ceil(analysis.complexity / capabilityGroups.length),
        capabilities: group.capabilities,
        parent: task.id
      });
    });
    
    // Dependencies based on capability relationships
    const dependencies = this.inferCapabilityDependencies(subtasks);
    
    return {
      subtasks,
      dependencies,
      metadata: { strategy: 'resource' }
    };
  }
  
  /**
   * Hybrid decomposition
   */
  hybridDecomposition(task, analysis) {
    // Combine strategies based on task characteristics
    
    if (analysis.pattern) {
      // Use pattern-based decomposition
      return this.functionalDecomposition(task, analysis);
    }
    
    if (analysis.complexity >= ComplexityLevel.COMPLEX) {
      // Use technical layers for complex tasks
      return this.technicalDecomposition(task, analysis);
    }
    
    if (analysis.estimatedDuration > 240) {
      // Use temporal for long tasks
      return this.temporalDecomposition(task, analysis);
    }
    
    // Default to functional
    return this.functionalDecomposition(task, analysis);
  }
  
  /**
   * Identify functions
   */
  identifyFunctions(task) {
    const functions = [];
    const description = (task.name + ' ' + task.description).toLowerCase();
    
    const functionKeywords = [
      'create', 'read', 'update', 'delete',
      'validate', 'authenticate', 'authorize',
      'fetch', 'process', 'transform',
      'render', 'display', 'style'
    ];
    
    functionKeywords.forEach(keyword => {
      if (description.includes(keyword)) {
        functions.push(keyword);
      }
    });
    
    // If no specific functions found, create generic ones
    if (functions.length === 0) {
      functions.push('prepare', 'execute', 'verify');
    }
    
    return functions;
  }
  
  /**
   * Check if task involves layer
   */
  taskInvolvesLayer(task, layer) {
    const description = (task.name + ' ' + task.description).toLowerCase();
    
    const layerKeywords = {
      'frontend': ['ui', 'interface', 'component', 'view', 'react', 'vue'],
      'backend': ['api', 'server', 'endpoint', 'service', 'logic'],
      'database': ['database', 'query', 'schema', 'migration', 'sql'],
      'infrastructure': ['deploy', 'docker', 'kubernetes', 'aws', 'server']
    };
    
    return layerKeywords[layer]?.some(keyword => description.includes(keyword)) || false;
  }
  
  /**
   * Group capabilities
   */
  groupCapabilities(capabilities) {
    const groups = [];
    
    const groupings = {
      'frontend': ['frontend', 'ui', 'react', 'vue', 'styling'],
      'backend': ['backend', 'api', 'server', 'rest'],
      'data': ['database', 'sql', 'query-optimization'],
      'devops': ['deployment', 'ci-cd', 'devops', 'docker']
    };
    
    Object.entries(groupings).forEach(([name, keywords]) => {
      const matched = capabilities.filter(cap => 
        keywords.some(keyword => cap.includes(keyword))
      );
      
      if (matched.length > 0) {
        groups.push({ name, capabilities: matched });
      }
    });
    
    // Add ungrouped capabilities
    const grouped = groups.flatMap(g => g.capabilities);
    const ungrouped = capabilities.filter(cap => !grouped.includes(cap));
    
    if (ungrouped.length > 0) {
      groups.push({ name: 'general', capabilities: ungrouped });
    }
    
    return groups;
  }
  
  /**
   * Infer capability dependencies
   */
  inferCapabilityDependencies(subtasks) {
    const dependencies = [];
    
    // Database tasks should come before backend
    const dbTask = subtasks.find(t => t.capabilities?.includes('database'));
    const backendTask = subtasks.find(t => t.capabilities?.includes('backend'));
    
    if (dbTask && backendTask) {
      dependencies.push({
        from: dbTask.id,
        to: backendTask.id,
        type: 'dependency'
      });
    }
    
    // Backend before frontend
    const frontendTask = subtasks.find(t => t.capabilities?.includes('frontend'));
    
    if (backendTask && frontendTask) {
      dependencies.push({
        from: backendTask.id,
        to: frontendTask.id,
        type: 'dependency'
      });
    }
    
    return dependencies;
  }
  
  /**
   * Optimize decomposition
   */
  optimizeDecomposition(decomposition) {
    // Optimize for cost
    if (this.config.optimizeForCost) {
      this.optimizeForCost(decomposition);
    }
    
    // Optimize for speed
    if (this.config.optimizeForSpeed) {
      this.optimizeForSpeed(decomposition);
    }
    
    // Balance task sizes
    this.balanceTaskSizes(decomposition);
    
    // Identify parallelization opportunities
    this.identifyParallelization(decomposition);
  }
  
  /**
   * Optimize for cost
   */
  optimizeForCost(decomposition) {
    // Merge small tasks to reduce overhead
    const smallTasks = decomposition.subtasks.filter(t => 
      t.complexity <= ComplexityLevel.SIMPLE
    );
    
    if (smallTasks.length > 2) {
      // Merge pairs of small tasks
      const merged = [];
      
      for (let i = 0; i < smallTasks.length; i += 2) {
        if (i + 1 < smallTasks.length) {
          merged.push({
            id: `merged-${i}`,
            name: `${smallTasks[i].name}_and_${smallTasks[i + 1].name}`,
            type: TaskType.COMPOSITE,
            complexity: smallTasks[i].complexity + smallTasks[i + 1].complexity,
            subtasks: [smallTasks[i], smallTasks[i + 1]]
          });
        } else {
          merged.push(smallTasks[i]);
        }
      }
      
      // Replace small tasks with merged ones
      decomposition.subtasks = decomposition.subtasks
        .filter(t => !smallTasks.includes(t))
        .concat(merged);
      
      decomposition.metadata.costOptimized = true;
    }
  }
  
  /**
   * Optimize for speed
   */
  optimizeForSpeed(decomposition) {
    // Identify tasks that can be parallelized
    const independentTasks = decomposition.subtasks.filter(task => {
      // Check if task has incoming dependencies
      const hasIncoming = decomposition.dependencies.some(dep => dep.to === task.id);
      return !hasIncoming;
    });
    
    if (independentTasks.length > 1) {
      decomposition.metadata.parallelTasks = independentTasks.map(t => t.id);
      decomposition.metadata.speedOptimized = true;
    }
  }
  
  /**
   * Balance task sizes
   */
  balanceTaskSizes(decomposition) {
    const avgComplexity = decomposition.subtasks.reduce((sum, t) => 
      sum + t.complexity, 0
    ) / decomposition.subtasks.length;
    
    decomposition.subtasks.forEach(task => {
      // Split very complex tasks
      if (task.complexity > avgComplexity * 2) {
        // Mark for further decomposition
        task.needsFurtherDecomposition = true;
      }
    });
  }
  
  /**
   * Identify parallelization opportunities
   */
  identifyParallelization(decomposition) {
    const parallelGroups = [];
    const visited = new Set();
    
    decomposition.subtasks.forEach(task => {
      if (visited.has(task.id)) {return;}
      
      // Find tasks at the same dependency level
      const level = this.getDependencyLevel(task.id, decomposition.dependencies);
      const sameLevelTasks = decomposition.subtasks.filter(t => 
        this.getDependencyLevel(t.id, decomposition.dependencies) === level &&
        !visited.has(t.id)
      );
      
      if (sameLevelTasks.length > 1) {
        parallelGroups.push({
          level,
          tasks: sameLevelTasks.map(t => t.id)
        });
        
        sameLevelTasks.forEach(t => visited.add(t.id));
      }
    });
    
    if (parallelGroups.length > 0) {
      decomposition.metadata.parallelGroups = parallelGroups;
      decomposition.metadata.parallelizationPotential = 
        parallelGroups.reduce((sum, g) => sum + g.tasks.length, 0) / 
        decomposition.subtasks.length;
    }
  }
  
  /**
   * Get dependency level
   */
  getDependencyLevel(taskId, dependencies) {
    const incoming = dependencies.filter(dep => dep.to === taskId);
    
    if (incoming.length === 0) {return 0;}
    
    const parentLevels = incoming.map(dep => 
      this.getDependencyLevel(dep.from, dependencies)
    );
    
    return Math.max(...parentLevels) + 1;
  }
  
  /**
   * Validate decomposition
   */
  validateDecomposition(decomposition) {
    const errors = [];
    
    // Check for circular dependencies
    if (this.hasCircularDependencies(decomposition.dependencies)) {
      errors.push('Circular dependencies detected');
    }
    
    // Check task sizes
    decomposition.subtasks.forEach(task => {
      if (task.complexity > this.config.maxTaskSize) {
        errors.push(`Task ${task.id} exceeds maximum size`);
      }
      if (task.complexity < this.config.minTaskSize) {
        errors.push(`Task ${task.id} below minimum size`);
      }
    });
    
    // Check decomposition depth
    if (decomposition.subtasks.length > Math.pow(2, this.config.maxDecompositionDepth)) {
      errors.push('Decomposition depth exceeded');
    }
    
    if (errors.length > 0) {
      throw new Error(`Decomposition validation failed: ${errors.join(', ')}`);
    }
  }
  
  /**
   * Check for circular dependencies
   */
  hasCircularDependencies(dependencies) {
    const visited = new Set();
    const recursionStack = new Set();
    
    const hasCycle = (node) => {
      visited.add(node);
      recursionStack.add(node);
      
      const neighbors = dependencies
        .filter(dep => dep.from === node)
        .map(dep => dep.to);
      
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) {return true;}
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }
      
      recursionStack.delete(node);
      return false;
    };
    
    const nodes = new Set();
    dependencies.forEach(dep => {
      nodes.add(dep.from);
      nodes.add(dep.to);
    });
    
    for (const node of nodes) {
      if (!visited.has(node)) {
        if (hasCycle(node)) {return true;}
      }
    }
    
    return false;
  }
  
  /**
   * Calculate metrics
   */
  calculateMetrics(decomposition) {
    decomposition.metrics = {
      subtaskCount: decomposition.subtasks.length,
      totalComplexity: decomposition.subtasks.reduce((sum, t) => sum + t.complexity, 0),
      averageComplexity: decomposition.subtasks.reduce((sum, t) => sum + t.complexity, 0) / 
                         decomposition.subtasks.length,
      dependencyCount: decomposition.dependencies.length,
      parallelizationPotential: decomposition.metadata.parallelizationPotential || 0,
      estimatedDuration: decomposition.subtasks.reduce((sum, t) => 
        sum + (t.estimatedDuration || this.estimateDuration(t)), 0
      )
    };
  }
  
  /**
   * Update statistics
   */
  updateStatistics(decomposition) {
    this.stats.totalDecompositions++;
    this.stats.totalSubtasks += decomposition.subtasks.length;
    
    // Update averages
    const totalDepth = this.stats.averageDecompositionDepth * (this.stats.totalDecompositions - 1);
    this.stats.averageDecompositionDepth = (totalDepth + decomposition.subtasks.length) / 
                                           this.stats.totalDecompositions;
    
    this.stats.averageSubtasksPerTask = this.stats.totalSubtasks / this.stats.totalDecompositions;
    
    // Update parallelization rate
    if (decomposition.metadata.parallelizationPotential) {
      const totalParallel = this.stats.parallelizationRate * (this.stats.totalDecompositions - 1);
      this.stats.parallelizationRate = (totalParallel + decomposition.metadata.parallelizationPotential) / 
                                       this.stats.totalDecompositions;
    }
  }
  
  /**
   * Generate decomposition ID
   */
  generateDecompositionId() {
    return `decomp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      patternsAvailable: this.taskPatterns.size,
      recentDecompositions: this.decompositionHistory.slice(-10).map(d => ({
        id: d.id,
        taskName: d.originalTask.name,
        subtaskCount: d.subtasks.length,
        strategy: d.strategy,
        timestamp: d.timestamp
      }))
    };
  }
}

// Export
module.exports = {
  TaskDecompositionEngine,
  TaskType,
  ComplexityLevel,
  DecompositionStrategy
};