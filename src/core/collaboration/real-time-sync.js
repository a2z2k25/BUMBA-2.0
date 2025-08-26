/**
 * Real-time Synchronization Engine - Advanced real-time collaboration features
 * Provides state synchronization, conflict resolution, and presence awareness
 */

const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Synchronization strategies
 */
const SyncStrategy = {
  OPERATIONAL_TRANSFORM: 'operational_transform',
  CONFLICT_FREE_REPLICATED_DATA: 'crdt',
  LAST_WRITER_WINS: 'lww',
  CONSENSUS_BASED: 'consensus',
  HYBRID: 'hybrid'
};

/**
 * Conflict resolution types
 */
const ConflictType = {
  CONCURRENT_EDIT: 'concurrent_edit',
  STRUCTURAL_CHANGE: 'structural_change',
  PERMISSION_CONFLICT: 'permission_conflict',
  VERSION_DIVERGENCE: 'version_divergence',
  RESOURCE_LOCK: 'resource_lock'
};

/**
 * Real-time Synchronization Engine
 */
class RealTimeSyncEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.setMaxListeners(10000);
    
    this.config = {
      syncStrategy: SyncStrategy.HYBRID,
      conflictResolution: 'auto',
      syncInterval: 100, // ms
      batchSize: 50,
      enableOperationalTransform: true,
      enableCRDT: true,
      enableConflictPrediction: true,
      maxSyncHistory: 1000,
      enableRealtimePresence: true,
      presenceHeartbeat: 5000,
      ...config
    };
    
    // Core synchronization state
    this.syncState = {
      localVersion: 0,
      remoteVersion: 0,
      lastSyncTimestamp: Date.now(),
      pendingOperations: [],
      acknowledgedOperations: new Set(),
      conflictQueue: []
    };
    
    // Operational Transform engine
    this.operationalTransform = new OperationalTransformEngine(this.config);
    
    // CRDT manager
    this.crdtManager = new CRDTManager(this.config);
    
    // Conflict resolution engine
    this.conflictResolver = new ConflictResolutionEngine(this.config);
    
    // Presence system
    this.presenceSystem = new PresenceSystem(this.config);
    
    // Active collaborators
    this.collaborators = new Map(); // userId -> collaborator info
    this.activeSessions = new Map(); // sessionId -> session info
    
    // Performance tracking
    this.metrics = {
      operationsProcessed: 0,
      conflictsResolved: 0,
      syncLatency: 0,
      averageSyncTime: 0,
      activeCollaborators: 0,
      operationThroughput: 0
    };
    
    // Start sync engine
    this.startSyncEngine();
    
    logger.info('🔄 Real-time Sync Engine initialized', {
      strategy: this.config.syncStrategy,
      conflictResolution: this.config.conflictResolution,
      operationalTransform: this.config.enableOperationalTransform
    });
  }

  /**
   * Start synchronization engine
   */
  startSyncEngine() {
    // Start sync loop
    this.syncInterval = setInterval(() => {
      this.performSyncCycle();
    }, this.config.syncInterval);
    
    // Start presence heartbeat
    if (this.config.enableRealtimePresence) {
      this.presenceInterval = setInterval(() => {
        this.updatePresence();
      }, this.config.presenceHeartbeat);
    }
    
    // Start metrics collection
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, 10000); // Every 10 seconds
  }

  /**
   * Register collaborative operation
   */
  async registerOperation(operation, context = {}) {
    const syncOperation = {
      id: this.generateOperationId(),
      type: operation.type,
      data: operation.data,
      userId: context.userId,
      sessionId: context.sessionId,
      timestamp: Date.now(),
      localVersion: this.syncState.localVersion++,
      vectorClock: this.generateVectorClock(),
      dependencies: operation.dependencies || [],
      metadata: {
        source: 'local',
        acknowledged: false,
        retryCount: 0,
        ...context.metadata
      }
    };
    
    // Apply operational transform if enabled
    if (this.config.enableOperationalTransform) {
      syncOperation.transformedData = await this.operationalTransform.transform(
        syncOperation,
        this.syncState.pendingOperations
      );
    }
    
    // Add to pending operations
    this.syncState.pendingOperations.push(syncOperation);
    
    // Immediate sync for critical operations
    if (operation.priority === 'high') {
      await this.performImmediateSync(syncOperation);
    }
    
    this.emit('operation:registered', { operation: syncOperation });
    
    return syncOperation.id;
  }

  /**
   * Apply remote operation
   */
  async applyRemoteOperation(remoteOperation) {
    try {
      // Check for conflicts
      const conflicts = await this.detectConflicts(remoteOperation);
      
      if (conflicts.length > 0) {
        return await this.handleConflicts(remoteOperation, conflicts);
      }
      
      // Apply operation transform if needed
      let transformedOperation = remoteOperation;
      if (this.config.enableOperationalTransform) {
        transformedOperation = await this.operationalTransform.transform(
          remoteOperation,
          this.syncState.pendingOperations
        );
      }
      
      // Apply to CRDT if enabled
      if (this.config.enableCRDT) {
        transformedOperation = await this.crdtManager.merge(transformedOperation);
      }
      
      // Update state
      this.syncState.remoteVersion = Math.max(
        this.syncState.remoteVersion,
        remoteOperation.remoteVersion || 0
      );
      
      // Acknowledge operation
      this.acknowledgeOperation(remoteOperation.id);
      
      this.metrics.operationsProcessed++;
      this.emit('operation:applied', { operation: transformedOperation });
      
      return { success: true, operation: transformedOperation };
      
    } catch (error) {
      logger.error(`Failed to apply remote operation: ${remoteOperation.id}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Detect conflicts between operations
   */
  async detectConflicts(incomingOperation) {
    const conflicts = [];
    
    for (const pendingOp of this.syncState.pendingOperations) {
      if (await this.areOperationsConflicting(pendingOp, incomingOperation)) {
        conflicts.push({
          type: this.classifyConflictType(pendingOp, incomingOperation),
          localOperation: pendingOp,
          remoteOperation: incomingOperation,
          severity: this.calculateConflictSeverity(pendingOp, incomingOperation),
          detectedAt: Date.now()
        });
      }
    }
    
    return conflicts;
  }

  /**
   * Check if two operations are conflicting
   */
  async areOperationsConflicting(op1, op2) {
    // Different users editing same resource
    if (op1.data.resourceId === op2.data.resourceId && 
        op1.userId !== op2.userId) {
      return true;
    }
    
    // Overlapping time ranges with incompatible operations
    const timeOverlap = Math.abs(op1.timestamp - op2.timestamp) < 1000; // 1 second
    if (timeOverlap && this.areOperationsIncompatible(op1, op2)) {
      return true;
    }
    
    // Structural conflicts
    if (this.hasStructuralConflict(op1, op2)) {
      return true;
    }
    
    return false;
  }

  /**
   * Handle detected conflicts
   */
  async handleConflicts(remoteOperation, conflicts) {
    const resolutionResults = [];
    
    for (const conflict of conflicts) {
      const resolution = await this.conflictResolver.resolve(conflict, {
        strategy: this.config.conflictResolution,
        context: {
          collaborators: this.collaborators,
          activeSession: this.activeSessions.get(remoteOperation.sessionId)
        }
      });
      
      resolutionResults.push(resolution);
      this.metrics.conflictsResolved++;
      
      this.emit('conflict:resolved', {
        conflict,
        resolution,
        strategy: resolution.strategy
      });
    }
    
    // Apply resolved operations
    const mergedOperation = await this.mergeResolvedOperations(
      remoteOperation,
      resolutionResults
    );
    
    return { success: true, operation: mergedOperation, conflicts: resolutionResults };
  }

  /**
   * Perform synchronization cycle
   */
  async performSyncCycle() {
    const startTime = Date.now();
    
    try {
      // Batch pending operations
      const batchToSync = this.syncState.pendingOperations
        .filter(op => !op.metadata.acknowledged)
        .slice(0, this.config.batchSize);
      
      if (batchToSync.length === 0) {
        return;
      }
      
      // Send to remote
      await this.sendOperationBatch(batchToSync);
      
      // Update sync state
      this.syncState.lastSyncTimestamp = Date.now();
      
      // Calculate sync latency
      const syncLatency = Date.now() - startTime;
      this.updateSyncLatency(syncLatency);
      
      this.emit('sync:completed', {
        operationsCount: batchToSync.length,
        latency: syncLatency,
        timestamp: Date.now()
      });
      
    } catch (error) {
      logger.error('Sync cycle failed:', error);
      this.emit('sync:failed', { error: error.message });
    }
  }

  /**
   * Perform immediate synchronization
   */
  async performImmediateSync(operation) {
    try {
      await this.sendOperationBatch([operation]);
      this.emit('sync:immediate', { operation });
    } catch (error) {
      logger.error(`Immediate sync failed for operation: ${operation.id}`, error);
    }
  }

  /**
   * Add collaborator to session
   */
  addCollaborator(userId, collaboratorInfo) {
    const collaborator = {
      userId,
      joinedAt: Date.now(),
      lastActivity: Date.now(),
      permissions: collaboratorInfo.permissions || ['read'],
      presence: {
        status: 'active',
        cursor: null,
        selection: null,
        lastSeen: Date.now()
      },
      ...collaboratorInfo
    };
    
    this.collaborators.set(userId, collaborator);
    this.metrics.activeCollaborators = this.collaborators.size;
    
    this.emit('collaborator:joined', { collaborator });
    
    return collaborator;
  }

  /**
   * Update collaborator presence
   */
  updateCollaboratorPresence(userId, presenceData) {
    const collaborator = this.collaborators.get(userId);
    if (!collaborator) return false;
    
    collaborator.presence = {
      ...collaborator.presence,
      ...presenceData,
      lastSeen: Date.now()
    };
    
    collaborator.lastActivity = Date.now();
    
    this.emit('presence:updated', {
      userId,
      presence: collaborator.presence
    });
    
    return true;
  }

  /**
   * Update presence for all collaborators
   */
  updatePresence() {
    const now = Date.now();
    const inactiveThreshold = 30000; // 30 seconds
    
    for (const [userId, collaborator] of this.collaborators) {
      if (now - collaborator.lastActivity > inactiveThreshold) {
        collaborator.presence.status = 'idle';
      }
      
      // Clean up very old collaborators
      if (now - collaborator.lastActivity > 300000) { // 5 minutes
        this.removeCollaborator(userId);
      }
    }
    
    this.emit('presence:heartbeat', {
      activeCollaborators: this.collaborators.size,
      timestamp: now
    });
  }

  /**
   * Remove collaborator
   */
  removeCollaborator(userId) {
    const collaborator = this.collaborators.get(userId);
    if (collaborator) {
      this.collaborators.delete(userId);
      this.metrics.activeCollaborators = this.collaborators.size;
      
      this.emit('collaborator:left', { userId, collaborator });
    }
  }

  /**
   * Get real-time collaboration state
   */
  getCollaborationState() {
    return {
      syncState: { ...this.syncState },
      collaborators: Array.from(this.collaborators.values()),
      activeSessions: this.activeSessions.size,
      metrics: { ...this.metrics },
      pendingOperations: this.syncState.pendingOperations.length,
      conflictQueue: this.syncState.conflictQueue.length
    };
  }

  /**
   * Helper methods
   */
  generateOperationId() {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateVectorClock() {
    // Simplified vector clock
    const clock = {};
    for (const [userId] of this.collaborators) {
      clock[userId] = this.syncState.localVersion;
    }
    return clock;
  }

  acknowledgeOperation(operationId) {
    this.syncState.acknowledgedOperations.add(operationId);
    
    // Remove from pending if acknowledged
    this.syncState.pendingOperations = this.syncState.pendingOperations.filter(
      op => op.id !== operationId
    );
  }

  classifyConflictType(op1, op2) {
    if (op1.data.resourceId === op2.data.resourceId) {
      return ConflictType.CONCURRENT_EDIT;
    }
    if (op1.type === 'structure' || op2.type === 'structure') {
      return ConflictType.STRUCTURAL_CHANGE;
    }
    return ConflictType.VERSION_DIVERGENCE;
  }

  calculateConflictSeverity(op1, op2) {
    // Simplified severity calculation
    if (op1.type === 'delete' || op2.type === 'delete') {
      return 'high';
    }
    if (Math.abs(op1.timestamp - op2.timestamp) < 500) {
      return 'medium';
    }
    return 'low';
  }

  areOperationsIncompatible(op1, op2) {
    const incompatiblePairs = [
      ['create', 'delete'],
      ['delete', 'update'],
      ['move', 'delete']
    ];
    
    return incompatiblePairs.some(([type1, type2]) =>
      (op1.type === type1 && op2.type === type2) ||
      (op1.type === type2 && op2.type === type1)
    );
  }

  hasStructuralConflict(op1, op2) {
    return (op1.type === 'structure' || op2.type === 'structure') &&
           op1.data.path?.startsWith(op2.data.path);
  }

  async mergeResolvedOperations(baseOperation, resolutions) {
    // Simplified merge logic
    let mergedOperation = { ...baseOperation };
    
    for (const resolution of resolutions) {
      if (resolution.mergedData) {
        mergedOperation.data = { ...mergedOperation.data, ...resolution.mergedData };
      }
    }
    
    return mergedOperation;
  }

  async sendOperationBatch(operations) {
    // Emit for transport layer to handle
    this.emit('sync:batch_ready', {
      operations,
      batchId: `batch_${Date.now()}`,
      timestamp: Date.now()
    });
    
    // Mark as acknowledged (simplified)
    operations.forEach(op => {
      op.metadata.acknowledged = true;
    });
  }

  updateSyncLatency(latency) {
    this.metrics.syncLatency = latency;
    this.metrics.averageSyncTime = 
      (this.metrics.averageSyncTime * 0.9) + (latency * 0.1);
  }

  updateMetrics() {
    const now = Date.now();
    const timeDiff = now - (this.lastMetricsUpdate || now);
    
    this.metrics.operationThroughput = 
      (this.metrics.operationsProcessed * 1000) / Math.max(timeDiff, 1);
    
    this.lastMetricsUpdate = now;
    
    this.emit('metrics:updated', { ...this.metrics });
  }

  /**
   * Shutdown sync engine
   */
  shutdown() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    if (this.presenceInterval) clearInterval(this.presenceInterval);
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    
    this.emit('sync:shutdown');
    logger.info('🔄 Real-time Sync Engine shut down');
  }
}

/**
 * Operational Transform Engine
 */
class OperationalTransformEngine {
  constructor(config) {
    this.config = config;
  }

  async transform(operation, pendingOperations) {
    // Simplified operational transform
    let transformedData = { ...operation.data };
    
    for (const pendingOp of pendingOperations) {
      if (this.needsTransformation(operation, pendingOp)) {
        transformedData = this.applyTransformation(transformedData, pendingOp);
      }
    }
    
    return transformedData;
  }

  needsTransformation(op1, op2) {
    return op1.data.resourceId === op2.data.resourceId &&
           op1.timestamp > op2.timestamp;
  }

  applyTransformation(data, pendingOp) {
    // Simplified transformation logic
    if (pendingOp.type === 'insert' && data.position > pendingOp.data.position) {
      data.position += pendingOp.data.length || 1;
    }
    return data;
  }
}

/**
 * CRDT Manager
 */
class CRDTManager {
  constructor(config) {
    this.config = config;
    this.state = new Map(); // resourceId -> CRDT state
  }

  async merge(operation) {
    const resourceId = operation.data.resourceId;
    const currentState = this.state.get(resourceId) || { version: 0, data: {} };
    
    // Simple CRDT merge (Last Writer Wins with vector clocks)
    const mergedState = this.mergeStates(currentState, operation);
    this.state.set(resourceId, mergedState);
    
    return { ...operation, data: { ...operation.data, mergedState } };
  }

  mergeStates(current, operation) {
    // Simplified CRDT merge
    return {
      version: Math.max(current.version, operation.localVersion || 0),
      data: { ...current.data, ...operation.data },
      lastModified: Date.now()
    };
  }
}

/**
 * Conflict Resolution Engine
 */
class ConflictResolutionEngine {
  constructor(config) {
    this.config = config;
  }

  async resolve(conflict, context) {
    const { strategy } = context;
    
    switch (strategy) {
      case 'auto':
        return this.autoResolve(conflict);
      case 'manual':
        return this.requestManualResolution(conflict);
      case 'lww':
        return this.lastWriterWins(conflict);
      default:
        return this.autoResolve(conflict);
    }
  }

  autoResolve(conflict) {
    // Timestamp-based resolution
    const winner = conflict.localOperation.timestamp > conflict.remoteOperation.timestamp ?
      conflict.localOperation : conflict.remoteOperation;
    
    return {
      strategy: 'auto_timestamp',
      winner: winner.id,
      mergedData: winner.data,
      resolution: 'automatic'
    };
  }

  lastWriterWins(conflict) {
    const winner = conflict.remoteOperation;
    
    return {
      strategy: 'last_writer_wins',
      winner: winner.id,
      mergedData: winner.data,
      resolution: 'lww'
    };
  }

  requestManualResolution(conflict) {
    return {
      strategy: 'manual_required',
      status: 'pending',
      conflictId: conflict.localOperation.id + '_' + conflict.remoteOperation.id,
      resolution: 'manual'
    };
  }
}

/**
 * Presence System
 */
class PresenceSystem extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.presenceData = new Map();
  }

  updatePresence(userId, data) {
    this.presenceData.set(userId, {
      ...data,
      timestamp: Date.now()
    });
    
    this.emit('presence:changed', { userId, data });
  }

  getPresence(userId) {
    return this.presenceData.get(userId);
  }

  getAllPresence() {
    return Array.from(this.presenceData.entries());
  }
}

module.exports = {
  RealTimeSyncEngine,
  SyncStrategy,
  ConflictType,
  OperationalTransformEngine,
  CRDTManager,
  ConflictResolutionEngine,
  PresenceSystem
};