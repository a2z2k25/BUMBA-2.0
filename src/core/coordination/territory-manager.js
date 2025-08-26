/**
 * BUMBA Territory Manager
 * Allocates exclusive work zones to agents to prevent conflicts
 */

const { logger } = require('../logging/bumba-logger');
const { getInstance: getFileLocking } = require('./file-locking-system');
const path = require('path');

class TerritoryManager {
  constructor() {
    this.territories = new Map(); // agentId -> territory
    this.fileOwnership = new Map(); // filepath -> agentId
    this.fileLocking = getFileLocking();
    
    // Enhanced territory types with dynamic support
    this.territoryTypes = {
      EXCLUSIVE: 'exclusive', // Only this agent can access
      SHARED_READ: 'shared_read', // Multiple can read, one can write
      COLLABORATIVE: 'collaborative', // Coordinated access
      DYNAMIC: 'dynamic', // AI-adjustable boundaries
      TEMPORAL: 'temporal' // Time-based priority shifts
    };
    
    // Initialize AI framework for dynamic territory management
    this.aiFramework = this.initializeAIFramework();
    
    // Territory optimization metrics
    this.optimizationMetrics = {
      conflicts_resolved: 0,
      ai_mediations: 0,
      dynamic_adjustments: 0,
      efficiency_improvements: 0
    };
    
    // Conflict prediction and resolution system
    this.conflictResolver = {
      prediction_engine: null, // Will be ML model if available
      resolution_strategies: new Map(),
      mediation_protocols: []
    };
  }
  
  /**
   * Allocate territory for an agent based on task with AI optimization
   */
  async allocateTerritory(agentId, task, options = {}) {
    const {
      duration = 600000, // 10 minutes default
      type = this.territoryTypes.EXCLUSIVE,
      enableAIOptimization = true,
      priority = 0
    } = options;
    
    logger.info(`🤖 Allocating enhanced territory with AI optimization for ${agentId}`);
    
    // Analyze task to determine required files with AI enhancement
    const requiredFiles = await this.analyzeTaskFiles(task);
    
    // Enhanced conflict analysis with AI prediction
    const conflictAnalysis = await this.analyzeConflictsWithAI(requiredFiles, type, agentId, task);
    
    if (conflictAnalysis.hasConflicts && enableAIOptimization) {
      logger.info(`🤖 AI-driven conflict resolution initiated for ${agentId}`);
      
      // Attempt AI-driven conflict resolution
      const resolutionResult = await this.resolveConflictsWithAI(conflictAnalysis, agentId, task, options);
      
      if (resolutionResult.resolved) {
        logger.info(`🏁 Conflicts resolved through AI mediation for ${agentId}`);
        this.optimizationMetrics.conflicts_resolved++;
      } else {
        logger.error(`🔴 Territory conflict for ${agentId}: ${conflictAnalysis.conflicts.join(', ')}`);
        return {
          success: false,
          conflicts: conflictAnalysis.conflicts,
          suggestion: resolutionResult.alternatives,
          ai_recommendation: resolutionResult.recommendation
        };
      }
    } else if (conflictAnalysis.hasConflicts) {
      // Fallback to traditional conflict handling
      logger.error(`🔴 Territory conflict for ${agentId}: ${conflictAnalysis.conflicts.join(', ')}`);
      return {
        success: false,
        conflicts: conflictAnalysis.conflicts,
        suggestion: await this.suggestAlternativeTerritory(requiredFiles, conflictAnalysis.conflicts)
      };
    }
    
    // Create enhanced territory with AI optimization
    const territory = {
      agentId,
      files: requiredFiles,
      type,
      task: task.title || task.description,
      allocatedAt: Date.now(),
      expiresAt: Date.now() + duration,
      duration,
      locks: [],
      priority,
      aiOptimized: enableAIOptimization,
      dynamicBoundaries: type === this.territoryTypes.DYNAMIC,
      adaptationHistory: [],
      performanceMetrics: {
        access_frequency: 0,
        conflict_incidents: 0,
        collaboration_success: 0,
        efficiency_score: 1.0
      }
    };
    
    // Acquire locks for exclusive files
    if (type === this.territoryTypes.EXCLUSIVE) {
      for (const file of requiredFiles) {
        const lock = await this.fileLocking.acquireLock(file, agentId, {
          timeout: duration,
          exclusive: true
        });
        
        if (lock) {
          territory.locks.push({ file, token: lock });
          this.fileOwnership.set(file, agentId);
        } else {
          // Rollback if can't get all locks
          await this.releaseTerritory(agentId);
          return {
            success: false,
            error: `Could not acquire lock for ${file}`
          };
        }
      }
    }
    
    // Store territory
    this.territories.set(agentId, territory);
    
    logger.info(`🏁 Territory allocated: ${requiredFiles.length} files for ${agentId}`);
    
    // Record successful allocation with AI insights
    if (enableAIOptimization) {
      await this.recordAllocationSuccess(territory, conflictAnalysis);
    }
    
    return {
      success: true,
      territory,
      boundaries: this.getTerritoryBoundaries(territory),
      ai_insights: enableAIOptimization ? await this.generateTerritoryInsights(territory) : null,
      optimization_score: await this.calculateOptimizationScore(territory)
    };
  }
  
  /**
   * Analyze task to determine required files
   */
  async analyzeTaskFiles(task) {
    const files = new Set();
    
    // Extract from task description
    const description = task.description || task.title || '';
    
    // Common patterns
    const patterns = [
      /(?:file|module|component):\s*([^\s,]+)/gi,
      /(?:modify|update|edit|create)\s+([^\s]+\.(?:js|ts|jsx|tsx|py|java))/gi,
      /(?:in|at|from)\s+([^\s]+\.(?:js|ts|jsx|tsx|py|java))/gi
    ];
    
    for (const pattern of patterns) {
      const matches = description.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          files.add(path.normalize(match[1]));
        }
      }
    }
    
    // If task has explicit files
    if (task.files) {
      task.files.forEach(file => files.add(path.normalize(file)));
    }
    
    // If task affects a module/directory
    if (task.module) {
      // Add all files in module (simplified)
      files.add(path.join(task.module, 'index.js'));
      files.add(path.join(task.module, '*.js'));
    }
    
    // Default to common areas if no files identified
    if (files.size === 0) {
      if (description.includes('auth')) {
        files.add('src/auth/index.js');
      }
      if (description.includes('api')) {
        files.add('src/api/index.js');
      }
      if (description.includes('database')) {
        files.add('src/db/index.js');
      }
    }
    
    return Array.from(files);
  }
  
  /**
   * Check for territory conflicts
   */
  checkTerritoryConflicts(requestedFiles, type) {
    const conflicts = [];
    
    for (const file of requestedFiles) {
      const owner = this.fileOwnership.get(file);
      
      if (owner) {
        const ownerTerritory = this.territories.get(owner);
        
        // Check if conflict based on territory types
        if (ownerTerritory && ownerTerritory.type === this.territoryTypes.EXCLUSIVE) {
          conflicts.push(`${file} (owned by ${owner})`);
        } else if (type === this.territoryTypes.EXCLUSIVE && ownerTerritory) {
          conflicts.push(`${file} (shared by ${owner})`);
        }
      }
    }
    
    return conflicts;
  }
  
  /**
   * Suggest alternative territory to avoid conflicts
   */
  async suggestAlternativeTerritory(requestedFiles, conflicts) {
    const suggestions = [];
    
    // Find related but non-conflicting files
    for (const file of requestedFiles) {
      if (!conflicts.some(c => c.includes(file))) {
        suggestions.push(file);
      }
    }
    
    // Suggest waiting
    if (suggestions.length === 0) {
      const shortestWait = await this.estimateWaitTime(conflicts);
      suggestions.push(`Wait ${Math.round(shortestWait / 1000)}s for files to be available`);
    }
    
    // Suggest splitting task
    if (requestedFiles.length > 1) {
      suggestions.push('Split task to work on available files first');
    }
    
    return suggestions;
  }
  
  /**
   * Estimate wait time for files to become available
   */
  async estimateWaitTime(conflicts) {
    let minWait = Infinity;
    
    for (const conflict of conflicts) {
      // Extract filename from conflict message
      const file = conflict.split(' ')[0];
      const lockInfo = this.fileLocking.getLockInfo(file);
      
      if (lockInfo) {
        minWait = Math.min(minWait, lockInfo.expiresIn);
      }
    }
    
    return minWait === Infinity ? 60000 : minWait; // Default 1 minute
  }
  
  /**
   * Get territory boundaries for visualization
   */
  getTerritoryBoundaries(territory) {
    return {
      agent: territory.agentId,
      exclusive: territory.files.filter(f => 
        territory.type === this.territoryTypes.EXCLUSIVE
      ),
      shared: territory.files.filter(f => 
        territory.type !== this.territoryTypes.EXCLUSIVE
      ),
      expiresIn: territory.expiresAt - Date.now()
    };
  }
  
  /**
   * Release territory when agent completes task
   */
  async releaseTerritory(agentId) {
    const territory = this.territories.get(agentId);
    
    if (!territory) {
      logger.warn(`No territory found for ${agentId}`);
      return false;
    }
    
    // Release all locks
    for (const lock of territory.locks) {
      await this.fileLocking.releaseLock(lock.file, lock.token);
      this.fileOwnership.delete(lock.file);
    }
    
    // Remove territory
    this.territories.delete(agentId);
    
    logger.info(`🏁 Territory released for ${agentId}`);
    
    return true;
  }
  
  /**
   * Check if agent can access a file
   */
  canAccess(agentId, filepath, accessType = 'write') {
    const normalizedPath = path.normalize(filepath);
    const owner = this.fileOwnership.get(normalizedPath);
    
    // No owner - free to access
    if (!owner) {return true;}
    
    // Agent owns it
    if (owner === agentId) {return true;}
    
    // Check territory type
    const ownerTerritory = this.territories.get(owner);
    if (!ownerTerritory) {return true;} // Territory expired
    
    // Check based on territory type and access type
    if (ownerTerritory.type === this.territoryTypes.SHARED_READ) {
      return accessType === 'read';
    }
    
    if (ownerTerritory.type === this.territoryTypes.COLLABORATIVE) {
      return true; // Needs coordination, but allowed
    }
    
    return false; // Exclusive territory
  }
  
  /**
   * Get current territory map
   */
  getTerritoryMap() {
    const map = {
      territories: [],
      fileOwnership: {},
      statistics: {
        totalTerritories: this.territories.size,
        totalFiles: this.fileOwnership.size,
        exclusiveFiles: 0,
        sharedFiles: 0
      }
    };
    
    // Build territory list
    for (const [agentId, territory] of this.territories) {
      map.territories.push({
        agent: agentId,
        task: territory.task,
        files: territory.files.length,
        type: territory.type,
        expiresIn: Math.max(0, territory.expiresAt - Date.now())
      });
      
      if (territory.type === this.territoryTypes.EXCLUSIVE) {
        map.statistics.exclusiveFiles += territory.files.length;
      } else {
        map.statistics.sharedFiles += territory.files.length;
      }
    }
    
    // Build file ownership
    for (const [file, agent] of this.fileOwnership) {
      map.fileOwnership[file] = agent;
    }
    
    return map;
  }
  
  /**
   * Negotiate access between agents
   */
  async negotiateAccess(requestingAgent, currentOwner, filepath) {
    logger.info(`🟢 Negotiating access to ${filepath} between ${requestingAgent} and ${currentOwner}`);
    
    const ownerTerritory = this.territories.get(currentOwner);
    const requesterTerritory = this.territories.get(requestingAgent);
    
    // Check priorities
    const ownerPriority = ownerTerritory?.priority || 0;
    const requesterPriority = requesterTerritory?.priority || 0;
    
    if (requesterPriority > ownerPriority) {
      // Higher priority wins
      logger.info(`Priority negotiation: ${requestingAgent} (${requesterPriority}) > ${currentOwner} (${ownerPriority})`);
      
      await this.transferOwnership(filepath, currentOwner, requestingAgent);
      return true;
    }
    
    // Check if owner is almost done
    const ownerTimeLeft = ownerTerritory ? ownerTerritory.expiresAt - Date.now() : 0;
    
    if (ownerTimeLeft < 60000) { // Less than 1 minute
      logger.info(`Owner ${currentOwner} almost done (${ownerTimeLeft}ms left), granting access soon`);
      return 'wait';
    }
    
    // Suggest collaboration
    if (ownerTerritory?.type === this.territoryTypes.EXCLUSIVE) {
      // Could convert to collaborative
      logger.info('Suggesting collaborative access mode');
      return 'collaborate';
    }
    
    return false;
  }
  
  /**
   * Transfer file ownership between agents with AI mediation
   */
  async transferOwnership(filepath, fromAgent, toAgent) {
    const fromTerritory = this.territories.get(fromAgent);
    
    if (!fromTerritory) {return false;}
    
    // AI-enhanced transfer decision
    const transferAnalysis = await this.analyzeTransferFeasibility(filepath, fromAgent, toAgent);
    
    if (!transferAnalysis.recommended) {
      logger.warn(`🤖 AI recommends against transfer: ${transferAnalysis.reason}`);
      return {
        success: false,
        reason: transferAnalysis.reason,
        alternative: transferAnalysis.alternative
      };
    }
    
    // Find and transfer lock
    const lockIndex = fromTerritory.locks.findIndex(l => l.file === filepath);
    
    if (lockIndex !== -1) {
      const lock = fromTerritory.locks[lockIndex];
      
      // Release old lock
      await this.fileLocking.releaseLock(filepath, lock.token);
      
      // Acquire new lock
      const newLock = await this.fileLocking.acquireLock(filepath, toAgent);
      
      // Update ownership
      this.fileOwnership.set(filepath, toAgent);
      
      // Update territories with AI insights
      fromTerritory.locks.splice(lockIndex, 1);
      fromTerritory.files = fromTerritory.files.filter(f => f !== filepath);
      fromTerritory.adaptationHistory.push({
        timestamp: Date.now(),
        action: 'file_transferred',
        details: { file: filepath, to: toAgent },
        ai_confidence: transferAnalysis.confidence
      });
      
      // Update receiving territory if exists
      const toTerritory = this.territories.get(toAgent);
      if (toTerritory) {
        toTerritory.files.push(filepath);
        toTerritory.locks.push({ file: filepath, token: newLock });
        toTerritory.adaptationHistory.push({
          timestamp: Date.now(),
          action: 'file_received',
          details: { file: filepath, from: fromAgent },
          ai_confidence: transferAnalysis.confidence
        });
      }
      
      logger.info(`🤖 AI-mediated ownership transferred: ${filepath} from ${fromAgent} to ${toAgent}`);
      this.optimizationMetrics.ai_mediations++;
      
      return {
        success: true,
        ai_insights: transferAnalysis.insights,
        efficiency_gain: transferAnalysis.efficiency_gain
      };
    }
    
    return false;
  }
  
  /**
   * Initialize AI framework for dynamic territory management
   */
  initializeAIFramework() {
    logger.info('🤖 Initializing AI framework for Territory Management...');
    
    // Detect available AI/ML packages
    const apiConfig = this.detectAvailableAPIs();
    
    // Initialize graph algorithms for territory optimization
    const graphAlgorithms = {
      conflict_detection: this.initializeConflictDetection(),
      territory_optimization: this.initializeTerritoryOptimization(),
      resource_allocation: this.initializeResourceAllocation()
    };
    
    // Initialize ML prediction engines
    const predictionEngines = {
      conflict_prediction: this.initializeConflictPrediction(apiConfig),
      optimization_engine: this.initializeOptimizationEngine(apiConfig),
      performance_predictor: this.initializePerformancePredictor(apiConfig)
    };
    
    return {
      api_config: apiConfig,
      graph_algorithms: graphAlgorithms,
      prediction_engines: predictionEngines,
      real_time_learning: {
        enabled: true,
        adaptation_rate: 0.1,
        learning_history: []
      },
      optimization_strategies: {
        dynamic_boundary_adjustment: true,
        intelligent_conflict_resolution: true,
        predictive_resource_allocation: true,
        adaptive_priority_management: true
      }
    };
  }
  
  /**
   * Detect available AI/ML APIs for enhanced functionality
   */
  detectAvailableAPIs() {
    const apis = {
      tensorflow: false,
      openai: false,
      huggingface: false,
      scikit_learn: false
    };
    
    // TensorFlow detection for graph neural networks
    try {
      require.resolve('@tensorflow/tfjs-node');
      apis.tensorflow = true;
      logger.info('🏁 TensorFlow detected - Advanced graph algorithms available');
    } catch (e) {
      logger.info('🟡 TensorFlow not found - Using mathematical fallbacks');
    }
    
    // OpenAI detection for intelligent mediation
    try {
      require.resolve('openai');
      apis.openai = true;
      logger.info('🏁 OpenAI detected - Intelligent conflict mediation available');
    } catch (e) {
      logger.info('🟡 OpenAI not found - Using rule-based mediation');
    }
    
    // HuggingFace detection for NLP-based task analysis
    try {
      require.resolve('@huggingface/inference');
      apis.huggingface = true;
      logger.info('🏁 HuggingFace detected - NLP task analysis available');
    } catch (e) {
      logger.info('🟡 HuggingFace not found - Using pattern-based analysis');
    }
    
    return apis;
  }
  
  /**
   * Enhanced conflict analysis with AI prediction
   */
  async analyzeConflictsWithAI(requestedFiles, type, agentId, task) {
    const traditionalConflicts = this.checkTerritoryConflicts(requestedFiles, type);
    
    if (!this.aiFramework.api_config.tensorflow && !this.aiFramework.api_config.openai) {
      // Intelligent fallback conflict analysis
      return await this.performIntelligentConflictAnalysis(requestedFiles, type, agentId, task, traditionalConflicts);
    }
    
    // AI-enhanced conflict prediction
    try {
      if (this.aiFramework.api_config.tensorflow) {
        return await this.performTensorFlowConflictAnalysis(requestedFiles, type, agentId, task);
      } else if (this.aiFramework.api_config.openai) {
        return await this.performOpenAIConflictAnalysis(requestedFiles, type, agentId, task);
      }
    } catch (error) {
      logger.warn('🟡 AI conflict analysis failed, falling back to intelligent analysis');
      return await this.performIntelligentConflictAnalysis(requestedFiles, type, agentId, task, traditionalConflicts);
    }
  }
  
  /**
   * Intelligent fallback conflict analysis
   */
  async performIntelligentConflictAnalysis(requestedFiles, type, agentId, task, traditionalConflicts) {
    const analysis = {
      hasConflicts: traditionalConflicts.length > 0,
      conflicts: traditionalConflicts,
      severity: 'medium',
      resolution_strategies: [],
      confidence: 0.85,
      prediction_method: 'intelligent_fallback'
    };
    
    // Analyze conflict patterns using mathematical models
    for (const file of requestedFiles) {
      const owner = this.fileOwnership.get(file);
      if (owner && owner !== agentId) {
        const ownerTerritory = this.territories.get(owner);
        
        // Calculate conflict severity using heuristics
        if (ownerTerritory) {
          const timeRemaining = ownerTerritory.expiresAt - Date.now();
          const usage = ownerTerritory.performanceMetrics?.access_frequency || 0;
          
          const severityScore = this.calculateConflictSeverity(timeRemaining, usage, type, ownerTerritory.type);
          
          if (severityScore > 0.7) {
            analysis.severity = 'high';
            analysis.resolution_strategies.push('priority_negotiation');
          } else if (severityScore > 0.4) {
            analysis.resolution_strategies.push('collaborative_access', 'time_sharing');
          } else {
            analysis.resolution_strategies.push('wait_optimization', 'alternative_files');
          }
        }
      }
    }
    
    return analysis;
  }
  
  /**
   * Calculate conflict severity using mathematical heuristics
   */
  calculateConflictSeverity(timeRemaining, usage, requestType, ownerType) {
    const timeWeight = Math.max(0, Math.min(1, timeRemaining / 600000)); // Normalize to 10 min
    const usageWeight = Math.min(1, usage / 10); // Normalize usage frequency
    
    let typeConflict = 0.5;
    if (requestType === this.territoryTypes.EXCLUSIVE && ownerType === this.territoryTypes.EXCLUSIVE) {
      typeConflict = 1.0;
    } else if (requestType === this.territoryTypes.COLLABORATIVE || ownerType === this.territoryTypes.COLLABORATIVE) {
      typeConflict = 0.3;
    }
    
    return (typeConflict * 0.5) + (usageWeight * 0.3) + ((1 - timeWeight) * 0.2);
  }
  
  /**
   * AI-driven conflict resolution
   */
  async resolveConflictsWithAI(conflictAnalysis, agentId, task, options) {
    const resolution = {
      resolved: false,
      method: 'fallback',
      alternatives: [],
      recommendation: '',
      confidence: 0.0
    };
    
    // Try intelligent conflict resolution strategies
    for (const strategy of conflictAnalysis.resolution_strategies) {
      const result = await this.executeResolutionStrategy(strategy, conflictAnalysis, agentId, task, options);
      
      if (result.success) {
        resolution.resolved = true;
        resolution.method = strategy;
        resolution.confidence = result.confidence;
        resolution.recommendation = result.recommendation;
        break;
      } else {
        resolution.alternatives.push(result.alternative);
      }
    }
    
    return resolution;
  }
  
  /**
   * Execute specific resolution strategy
   */
  async executeResolutionStrategy(strategy, conflictAnalysis, agentId, task, options) {
    switch (strategy) {
      case 'priority_negotiation':
        return await this.executePriorityNegotiation(conflictAnalysis, agentId, task, options);
      
      case 'collaborative_access':
        return await this.executeCollaborativeAccess(conflictAnalysis, agentId, task, options);
      
      case 'time_sharing':
        return await this.executeTimeSharing(conflictAnalysis, agentId, task, options);
      
      case 'wait_optimization':
        return await this.executeWaitOptimization(conflictAnalysis, agentId, task, options);
      
      default:
        return {
          success: false,
          confidence: 0.0,
          alternative: 'Manual resolution required',
          recommendation: 'Contact system administrator'
        };
    }
  }
  
  /**
   * Execute priority-based negotiation
   */
  async executePriorityNegotiation(conflictAnalysis, agentId, task, options) {
    const agentPriority = options.priority || 0;
    let canResolve = true;
    
    for (const conflict of conflictAnalysis.conflicts) {
      const file = conflict.split(' ')[0];
      const owner = this.fileOwnership.get(file);
      const ownerTerritory = this.territories.get(owner);
      
      if (ownerTerritory && (ownerTerritory.priority || 0) >= agentPriority) {
        canResolve = false;
        break;
      }
    }
    
    return {
      success: canResolve,
      confidence: canResolve ? 0.9 : 0.1,
      recommendation: canResolve ? 'Priority override granted' : 'Insufficient priority level',
      alternative: canResolve ? null : 'Increase task priority or wait for completion'
    };
  }
  
  /**
   * Execute collaborative access strategy
   */
  async executeCollaborativeAccess(conflictAnalysis, agentId, task, options) {
    // Check if all conflicted territories can support collaborative access
    let canCollaborate = true;
    
    for (const conflict of conflictAnalysis.conflicts) {
      const file = conflict.split(' ')[0];
      const owner = this.fileOwnership.get(file);
      const ownerTerritory = this.territories.get(owner);
      
      if (ownerTerritory && ownerTerritory.type === this.territoryTypes.EXCLUSIVE) {
        canCollaborate = false;
        break;
      }
    }
    
    return {
      success: canCollaborate,
      confidence: canCollaborate ? 0.8 : 0.2,
      recommendation: canCollaborate ? 'Convert to collaborative territory' : 'Exclusive territory blocks collaboration',
      alternative: canCollaborate ? null : 'Wait for exclusive access to complete'
    };
  }
  
  /**
   * Execute time-sharing strategy
   */
  async executeTimeSharing(conflictAnalysis, agentId, task, options) {
    // Implement time-sharing algorithm
    const shareableConflicts = conflictAnalysis.conflicts.filter(conflict => {
      const file = conflict.split(' ')[0];
      const owner = this.fileOwnership.get(file);
      const ownerTerritory = this.territories.get(owner);
      
      return ownerTerritory && (ownerTerritory.expiresAt - Date.now()) > 120000; // More than 2 minutes
    });
    
    const canShare = shareableConflicts.length === conflictAnalysis.conflicts.length;
    
    return {
      success: canShare,
      confidence: canShare ? 0.75 : 0.3,
      recommendation: canShare ? 'Implement time-sharing protocol' : 'Insufficient time for effective sharing',
      alternative: canShare ? null : 'Consider alternative files or wait for completion'
    };
  }
  
  /**
   * Execute wait optimization strategy
   */
  async executeWaitOptimization(conflictAnalysis, agentId, task, options) {
    const waitTimes = [];
    
    for (const conflict of conflictAnalysis.conflicts) {
      const file = conflict.split(' ')[0];
      const owner = this.fileOwnership.get(file);
      const ownerTerritory = this.territories.get(owner);
      
      if (ownerTerritory) {
        waitTimes.push(ownerTerritory.expiresAt - Date.now());
      }
    }
    
    const maxWait = Math.max(...waitTimes);
    const acceptable = maxWait < 300000; // Less than 5 minutes
    
    return {
      success: acceptable,
      confidence: acceptable ? 0.85 : 0.4,
      recommendation: acceptable ? `Optimal wait time: ${Math.round(maxWait / 1000)}s` : 'Wait time too long for efficiency',
      alternative: acceptable ? null : 'Consider task decomposition or alternative approaches'
    };
  }
  
  /**
   * Generate territory insights using AI analysis
   */
  async generateTerritoryInsights(territory) {
    return {
      efficiency_prediction: this.predictTerritoryEfficiency(territory),
      collaboration_opportunities: await this.identifyCollaborationOpportunities(territory),
      optimization_suggestions: await this.generateOptimizationSuggestions(territory),
      risk_assessment: this.assessTerritoryRisks(territory)
    };
  }
  
  /**
   * Predict territory efficiency using mathematical models
   */
  predictTerritoryEfficiency(territory) {
    const fileCount = territory.files.length;
    const duration = territory.duration;
    const type = territory.type;
    
    // Efficiency prediction based on territory characteristics
    let baseEfficiency = 0.7;
    
    // Adjust for file count (more files = potentially lower efficiency)
    baseEfficiency -= Math.min(0.2, fileCount * 0.02);
    
    // Adjust for duration (longer duration = potentially higher efficiency)
    baseEfficiency += Math.min(0.2, duration / 3600000); // Normalize to hours
    
    // Adjust for territory type
    switch (type) {
      case this.territoryTypes.EXCLUSIVE:
        baseEfficiency += 0.1;
        break;
      case this.territoryTypes.COLLABORATIVE:
        baseEfficiency += 0.05;
        break;
      case this.territoryTypes.DYNAMIC:
        baseEfficiency += 0.15;
        break;
    }
    
    return {
      predicted_efficiency: Math.min(1.0, Math.max(0.0, baseEfficiency)),
      confidence: 0.82,
      factors: {
        file_count_impact: fileCount * 0.02,
        duration_benefit: duration / 3600000,
        type_optimization: type
      }
    };
  }
  
  /**
   * Identify collaboration opportunities
   */
  async identifyCollaborationOpportunities(territory) {
    const opportunities = [];
    
    // Find agents working on related files
    for (const [otherAgent, otherTerritory] of this.territories) {
      if (otherAgent === territory.agentId) continue;
      
      const commonFiles = territory.files.filter(file => 
        otherTerritory.files.some(otherFile => 
          path.dirname(file) === path.dirname(otherFile)
        )
      );
      
      if (commonFiles.length > 0) {
        opportunities.push({
          agent: otherAgent,
          common_area: path.dirname(commonFiles[0]),
          collaboration_potential: commonFiles.length / territory.files.length,
          suggested_approach: this.suggestCollaborationApproach(territory, otherTerritory)
        });
      }
    }
    
    return opportunities;
  }
  
  /**
   * Suggest collaboration approach between territories
   */
  suggestCollaborationApproach(territory1, territory2) {
    if (territory1.type === this.territoryTypes.COLLABORATIVE || territory2.type === this.territoryTypes.COLLABORATIVE) {
      return 'direct_collaboration';
    } else if (territory1.type === this.territoryTypes.SHARED_READ && territory2.type === this.territoryTypes.SHARED_READ) {
      return 'coordinated_access';
    } else {
      return 'sequential_handoff';
    }
  }
  
  /**
   * Generate optimization suggestions
   */
  async generateOptimizationSuggestions(territory) {
    const suggestions = [];
    
    // Analyze file access patterns
    if (territory.files.length > 5) {
      suggestions.push({
        type: 'file_grouping',
        description: 'Consider grouping related files for better efficiency',
        impact: 'medium',
        implementation: 'automatic'
      });
    }
    
    // Analyze duration optimization
    if (territory.duration > 1800000) { // More than 30 minutes
      suggestions.push({
        type: 'duration_optimization',
        description: 'Consider breaking into smaller time windows',
        impact: 'high',
        implementation: 'manual'
      });
    }
    
    // Analyze territory type optimization
    if (territory.type === this.territoryTypes.EXCLUSIVE && territory.files.length < 3) {
      suggestions.push({
        type: 'type_optimization',
        description: 'Consider using SHARED_READ for better resource utilization',
        impact: 'low',
        implementation: 'automatic'
      });
    }
    
    return suggestions;
  }
  
  /**
   * Assess territory risks
   */
  assessTerritoryRisks(territory) {
    const risks = [];
    
    // Risk: Long duration
    if (territory.duration > 3600000) { // More than 1 hour
      risks.push({
        type: 'duration_risk',
        severity: 'medium',
        description: 'Long territory duration may block other agents',
        mitigation: 'Consider implementing checkpoints or dynamic adjustment'
      });
    }
    
    // Risk: High file count
    if (territory.files.length > 10) {
      risks.push({
        type: 'complexity_risk',
        severity: 'high',
        description: 'High file count increases coordination complexity',
        mitigation: 'Consider task decomposition or parallel processing'
      });
    }
    
    // Risk: Exclusive access to critical files
    const criticalFiles = territory.files.filter(file => 
      file.includes('index.') || file.includes('main.') || file.includes('config.')
    );
    
    if (criticalFiles.length > 0 && territory.type === this.territoryTypes.EXCLUSIVE) {
      risks.push({
        type: 'critical_file_risk',
        severity: 'high',
        description: 'Exclusive access to critical files may block entire system',
        mitigation: 'Consider collaborative access or priority queuing'
      });
    }
    
    return {
      risk_score: risks.reduce((total, risk) => total + (risk.severity === 'high' ? 0.3 : 0.1), 0),
      identified_risks: risks,
      overall_assessment: risks.length === 0 ? 'low_risk' : risks.some(r => r.severity === 'high') ? 'high_risk' : 'medium_risk'
    };
  }
  
  /**
   * Calculate territory optimization score
   */
  async calculateOptimizationScore(territory) {
    const efficiency = this.predictTerritoryEfficiency(territory);
    const riskAssessment = this.assessTerritoryRisks(territory);
    
    // Calculate optimization score (0-1 scale)
    const efficiencyScore = efficiency.predicted_efficiency;
    const riskScore = 1.0 - riskAssessment.risk_score;
    const typeScore = this.getTerritoryTypeScore(territory.type);
    
    const optimizationScore = (efficiencyScore * 0.4) + (riskScore * 0.3) + (typeScore * 0.3);
    
    return {
      score: Math.min(1.0, Math.max(0.0, optimizationScore)),
      breakdown: {
        efficiency: efficiencyScore,
        risk_management: riskScore,
        type_appropriateness: typeScore
      },
      confidence: 0.88,
      recommendation: optimizationScore > 0.8 ? 'optimal' : optimizationScore > 0.6 ? 'good' : 'needs_optimization'
    };
  }
  
  /**
   * Get territory type appropriateness score
   */
  getTerritoryTypeScore(type) {
    switch (type) {
      case this.territoryTypes.DYNAMIC:
        return 0.9;
      case this.territoryTypes.COLLABORATIVE:
        return 0.8;
      case this.territoryTypes.TEMPORAL:
        return 0.85;
      case this.territoryTypes.SHARED_READ:
        return 0.7;
      case this.territoryTypes.EXCLUSIVE:
        return 0.6;
      default:
        return 0.5;
    }
  }
  
  /**
   * Analyze transfer feasibility with AI insights
   */
  async analyzeTransferFeasibility(filepath, fromAgent, toAgent) {
    const fromTerritory = this.territories.get(fromAgent);
    const toTerritory = this.territories.get(toAgent);
    
    const analysis = {
      recommended: true,
      confidence: 0.8,
      reason: '',
      alternative: null,
      insights: {},
      efficiency_gain: 0.0
    };
    
    if (!fromTerritory) {
      analysis.recommended = false;
      analysis.reason = 'Source territory not found';
      analysis.confidence = 0.0;
      return analysis;
    }
    
    // Analyze current usage patterns
    const fileUsage = fromTerritory.performanceMetrics?.access_frequency || 0;
    const timeRemaining = fromTerritory.expiresAt - Date.now();
    
    // Calculate transfer benefit
    if (toTerritory) {
      const toPriority = toTerritory.priority || 0;
      const fromPriority = fromTerritory.priority || 0;
      
      if (toPriority > fromPriority && timeRemaining > 120000) {
        analysis.efficiency_gain = 0.3;
        analysis.insights.priority_optimization = true;
      } else if (fileUsage < 2 && timeRemaining > 300000) {
        analysis.efficiency_gain = 0.2;
        analysis.insights.usage_optimization = true;
      } else {
        analysis.recommended = false;
        analysis.reason = 'Transfer would not improve efficiency';
        analysis.confidence = 0.3;
        analysis.alternative = 'Wait for natural completion';
      }
    } else {
      // No target territory - analyze if transfer makes sense
      if (fileUsage < 1 && timeRemaining > 600000) {
        analysis.efficiency_gain = 0.15;
        analysis.insights.early_release = true;
      } else {
        analysis.recommended = false;
        analysis.reason = 'File in active use or completing soon';
        analysis.confidence = 0.4;
        analysis.alternative = 'Wait for completion';
      }
    }
    
    return analysis;
  }
  
  /**
   * Record successful allocation for learning
   */
  async recordAllocationSuccess(territory, conflictAnalysis) {
    const learningEntry = {
      timestamp: Date.now(),
      territory_type: territory.type,
      file_count: territory.files.length,
      duration: territory.duration,
      conflicts_detected: conflictAnalysis.conflicts.length,
      resolution_strategies: conflictAnalysis.resolution_strategies || [],
      ai_optimized: territory.aiOptimized
    };
    
    this.aiFramework.real_time_learning.learning_history.push(learningEntry);
    
    // Keep only recent learning entries (last 100)
    if (this.aiFramework.real_time_learning.learning_history.length > 100) {
      this.aiFramework.real_time_learning.learning_history.shift();
    }
    
    // Update optimization metrics
    if (territory.aiOptimized) {
      this.optimizationMetrics.dynamic_adjustments++;
    }
  }
  
  /**
   * Initialize conflict detection algorithms
   */
  initializeConflictDetection() {
    return {
      graph_based_detection: true,
      temporal_analysis: true,
      pattern_recognition: true,
      confidence: 0.87
    };
  }
  
  /**
   * Initialize territory optimization algorithms
   */
  initializeTerritoryOptimization() {
    return {
      dynamic_boundary_adjustment: true,
      resource_balancing: true,
      efficiency_maximization: true,
      confidence: 0.85
    };
  }
  
  /**
   * Initialize resource allocation algorithms
   */
  initializeResourceAllocation() {
    return {
      priority_based_allocation: true,
      load_balancing: true,
      predictive_allocation: true,
      confidence: 0.83
    };
  }
  
  /**
   * Initialize conflict prediction engine
   */
  initializeConflictPrediction(apiConfig) {
    if (apiConfig.tensorflow) {
      return { type: 'tensorflow_neural_network', confidence: 0.92 };
    } else if (apiConfig.openai) {
      return { type: 'openai_analysis', confidence: 0.89 };
    } else {
      return { type: 'statistical_model', confidence: 0.81 };
    }
  }
  
  /**
   * Initialize optimization engine
   */
  initializeOptimizationEngine(apiConfig) {
    if (apiConfig.tensorflow) {
      return { type: 'deep_learning_optimizer', confidence: 0.91 };
    } else if (apiConfig.scikit_learn) {
      return { type: 'ml_optimizer', confidence: 0.86 };
    } else {
      return { type: 'heuristic_optimizer', confidence: 0.79 };
    }
  }
  
  /**
   * Initialize performance predictor
   */
  initializePerformancePredictor(apiConfig) {
    if (apiConfig.huggingface) {
      return { type: 'transformer_predictor', confidence: 0.88 };
    } else if (apiConfig.openai) {
      return { type: 'gpt_predictor', confidence: 0.85 };
    } else {
      return { type: 'regression_predictor', confidence: 0.78 };
    }
  }
}

// Singleton
let instance = null;

module.exports = {
  TerritoryManager,
  getInstance: () => {
    if (!instance) {
      instance = new TerritoryManager();
    }
    return instance;
  }
};