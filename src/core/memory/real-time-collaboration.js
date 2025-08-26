/**
 * BUMBA Real-Time Collaboration System
 * Low-latency synchronization and conflict resolution for multi-agent collaboration
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');
const { logger } = require('../logging/bumba-logger');

class RealTimeCollaborationSystem extends EventEmitter {
  constructor(memoryLayer) {
    super();
    
    this.memory = memoryLayer;
    
    // Track intervals and timeouts for cleanup
    this.intervals = new Set();
    this.timeouts = new Map(); // Map of lockId to timeout
    
    // Collaboration components
    this.syncEngine = new SyncEngine();
    this.conflictManager = new ConflictManager();
    this.deltaSync = new DeltaSync();
    this.lockManager = new DistributedLockManager();
    this.priorityLanes = new PriorityLanes();
    
    // Active collaborations
    this.sessions = new Map();
    this.participants = new Map();
    this.locks = new Map();
    
    // Configuration
    this.config = {
      syncInterval: 100, // 100ms for real-time
      deltaThreshold: 1024, // 1KB - send deltas for larger changes
      lockTimeout: 5000, // 5 seconds
      conflictStrategy: 'operational-transform',
      maxQueueSize: 1000,
      compressionThreshold: 512 // bytes
    };
    
    // Metrics
    this.metrics = {
      syncOperations: 0,
      conflicts: 0,
      deltaSyncs: 0,
      fullSyncs: 0,
      avgSyncLatency: 0
    };
    
    this.initialize();
  }

  async initialize() {
    // Start sync engine
    this.syncEngine.on('sync-needed', async (data) => {
      await this.performSync(data);
    });
    
    // Start conflict monitoring
    this.conflictManager.on('conflict-detected', async (conflict) => {
      await this.handleConflict(conflict);
    });
    
    // Start real-time sync
    this.startRealTimeSync();
    
    logger.info('🟢 Real-Time Collaboration System initialized');
  }

  /**
   * Create collaboration session
   */
  async createSession(sessionId, context = {}) {
    const session = {
      id: sessionId,
      created: Date.now(),
      participants: new Set(),
      context: context,
      state: new CollaborativeState(),
      syncQueue: new SyncQueue(this.config.maxQueueSize),
      locks: new Map(),
      version: 0,
      checkpoints: []
    };

    this.sessions.set(sessionId, session);
    
    // Create checkpoint
    await this.createCheckpoint(session);
    
    this.emit('session-created', { sessionId, context });
    
    return sessionId;
  }

  /**
   * Join collaboration session
   */
  async joinSession(sessionId, participantId, role = 'contributor') {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const participant = {
      id: participantId,
      sessionId: sessionId,
      role: role,
      joined: Date.now(),
      lastSeen: Date.now(),
      syncCursor: session.version,
      pendingOps: [],
      bandwidth: 'high' // Can be adjusted based on connection
    };

    session.participants.add(participantId);
    this.participants.set(participantId, participant);
    
    // Send current state to participant
    await this.sendStateSnapshot(participant, session);
    
    this.emit('participant-joined', { sessionId, participantId, role });
    
    return {
      sessionId,
      participantId,
      currentVersion: session.version,
      state: session.state.getSnapshot()
    };
  }

  /**
   * Submit operation with priority
   */
  async submitOperation(participantId, operation, priority = 'normal') {
    const participant = this.participants.get(participantId);
    if (!participant) {
      throw new Error('Participant not found');
    }

    const session = this.sessions.get(participant.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const op = {
      id: this.generateOperationId(),
      participantId: participantId,
      timestamp: Date.now(),
      version: session.version,
      priority: priority,
      operation: operation,
      status: 'pending'
    };

    // Check if operation requires lock
    if (this.requiresLock(operation)) {
      const lock = await this.acquireLock(session, operation.target, participantId);
      if (!lock) {
        return { success: false, reason: 'lock_unavailable' };
      }
      op.lockId = lock.id;
    }

    // Add to priority queue
    await this.priorityLanes.enqueue(op);
    
    // Process immediately for high priority
    if (priority === 'critical' || priority === 'high') {
      await this.processOperation(op, session);
    }
    
    return { success: true, operationId: op.id };
  }

  /**
   * Process operation with conflict detection
   */
  async processOperation(op, session) {
    const startTime = Date.now();
    
    try {
      // Check for conflicts
      const conflicts = await this.detectConflicts(op, session);
      
      if (conflicts.length > 0) {
        this.metrics.conflicts++;
        
        // Resolve conflicts
        const resolved = await this.conflictManager.resolve(op, conflicts, session);
        
        if (!resolved.success) {
          op.status = 'rejected';
          op.reason = resolved.reason;
          return;
        }
        
        // Update operation with resolution
        op.operation = resolved.operation;
      }
      
      // Apply operation
      const result = await session.state.apply(op.operation);
      
      if (result.success) {
        op.status = 'applied';
        session.version++;
        
        // Create delta
        const delta = await this.deltaSync.createDelta(result.changes);
        
        // Queue for sync
        session.syncQueue.add({
          type: 'delta',
          operation: op,
          delta: delta,
          version: session.version
        });
        
        // Update metrics
        this.metrics.syncOperations++;
        this.updateLatencyMetric(Date.now() - startTime);
      } else {
        op.status = 'failed';
        op.reason = result.reason;
      }
      
    } finally {
      // Release lock if held
      if (op.lockId) {
        await this.releaseLock(session, op.lockId);
      }
    }
  }

  /**
   * Detect conflicts with concurrent operations
   */
  async detectConflicts(operation, session) {
    const conflicts = [];
    
    // Get concurrent operations
    const concurrent = session.syncQueue.getConcurrent(operation.version);
    
    for (const otherOp of concurrent) {
      if (otherOp.participantId === operation.participantId) {continue;}
      
      const conflict = this.conflictManager.checkConflict(operation, otherOp);
      if (conflict) {
        conflicts.push({
          type: conflict.type,
          severity: conflict.severity,
          operation1: operation,
          operation2: otherOp,
          details: conflict.details
        });
      }
    }
    
    return conflicts;
  }

  /**
   * Real-time synchronization
   */
  async performSync(session) {
    const participants = Array.from(session.participants)
      .map(id => this.participants.get(id))
      .filter(p => p && Date.now() - p.lastSeen < 30000); // Active in last 30s

    if (participants.length === 0) {return;}

    // Get sync items
    const syncItems = session.syncQueue.getReady();
    if (syncItems.length === 0) {return;}

    // Group by type
    const deltas = syncItems.filter(item => item.type === 'delta');
    const fulls = syncItems.filter(item => item.type === 'full');
    
    // Send appropriate updates
    for (const participant of participants) {
      try {
        // Determine what to send
        const toSend = this.determineSyncPayload(participant, deltas, fulls);
        
        if (toSend.length > 0) {
          await this.sendSync(participant, toSend);
          participant.syncCursor = session.version;
        }
      } catch (error) {
        logger.error(`Sync failed for participant ${participant.id}:`, error);
      }
    }
    
    // Clear processed items
    session.syncQueue.clearProcessed(syncItems);
  }

  /**
   * Determine optimal sync payload
   */
  determineSyncPayload(participant, deltas, fulls) {
    const payload = [];
    const bandwidth = participant.bandwidth;
    
    // Check if participant is too far behind
    const deltaCount = deltas.filter(d => d.version > participant.syncCursor).length;
    
    if (deltaCount > 50 || bandwidth === 'low') {
      // Send full sync
      const latestFull = fulls[fulls.length - 1];
      if (latestFull) {
        payload.push(latestFull);
        this.metrics.fullSyncs++;
      }
    } else {
      // Send deltas
      const relevantDeltas = deltas.filter(d => d.version > participant.syncCursor);
      
      // Compress if needed
      if (relevantDeltas.length > 10) {
        const compressed = this.compressDeltas(relevantDeltas);
        payload.push(...compressed);
      } else {
        payload.push(...relevantDeltas);
      }
      
      this.metrics.deltaSyncs += relevantDeltas.length;
    }
    
    return payload;
  }

  /**
   * Compress multiple deltas into one
   */
  compressDeltas(deltas) {
    const compressed = [];
    let current = null;
    
    for (const delta of deltas) {
      if (!current || !this.canMergeDeltas(current, delta)) {
        if (current) {compressed.push(current);}
        current = delta;
      } else {
        current = this.mergeDeltas(current, delta);
      }
    }
    
    if (current) {compressed.push(current);}
    
    return compressed;
  }

  /**
   * Distributed lock management
   */
  async acquireLock(session, resource, participantId) {
    const lockId = `lock_${resource}_${Date.now()}`;
    const existingLock = session.locks.get(resource);
    
    if (existingLock && Date.now() - existingLock.acquired < this.config.lockTimeout) {
      // Lock held by another
      if (existingLock.owner !== participantId) {
        return null;
      }
      // Extend own lock
      existingLock.acquired = Date.now();
      return existingLock;
    }
    
    const lock = {
      id: lockId,
      resource: resource,
      owner: participantId,
      acquired: Date.now(),
      timeout: this.config.lockTimeout
    };
    
    session.locks.set(resource, lock);
    this.locks.set(lockId, lock);
    
    // Set timeout and track it
    const timeout = setTimeout(() => {
      this.releaseLock(session, lockId);
      this.timeouts.delete(lockId);
    }, this.config.lockTimeout);
    this.timeouts.set(lockId, timeout);
    
    return lock;
  }

  async releaseLock(session, lockId) {
    const lock = this.locks.get(lockId);
    if (!lock) {return;}
    
    session.locks.delete(lock.resource);
    this.locks.delete(lockId);
    
    // Clear timeout if it exists
    const timeout = this.timeouts.get(lockId);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(lockId);
    }
  }

  /**
   * Priority lane management
   */
  startRealTimeSync() {
    // High-frequency sync for real-time collaboration
    const syncInterval = setInterval(async () => {
      // Process priority queues
      const critical = await this.priorityLanes.processCritical();
      const high = await this.priorityLanes.processHigh();
      
      // Sync active sessions
      for (const [sessionId, session] of this.sessions) {
        if (session.syncQueue.hasItems()) {
          await this.performSync(session);
        }
      }
    }, this.config.syncInterval);
    this.intervals.add(syncInterval);
    
    // Checkpoint creation
    const checkpointInterval = setInterval(async () => {
      for (const [sessionId, session] of this.sessions) {
        await this.createCheckpoint(session);
      }
    }, 60000); // Every minute
    this.intervals.add(checkpointInterval);
  }

  /**
   * Create session checkpoint
   */
  async createCheckpoint(session) {
    const checkpoint = {
      id: `checkpoint_${session.version}_${Date.now()}`,
      version: session.version,
      timestamp: Date.now(),
      state: await session.state.serialize(),
      participants: Array.from(session.participants)
    };
    
    session.checkpoints.push(checkpoint);
    
    // Keep only recent checkpoints
    if (session.checkpoints.length > 10) {
      session.checkpoints.shift();
    }
    
    // Persist checkpoint
    await this.memory.store(`checkpoint_${session.id}_${checkpoint.id}`, checkpoint, {
      ttl: 3600000, // 1 hour
      compressed: true
    });
  }

  /**
   * Utility methods
   */
  generateOperationId() {
    return `op_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  requiresLock(operation) {
    // Operations that modify structure require locks
    const lockRequired = ['delete', 'move', 'restructure', 'merge'];
    return lockRequired.includes(operation.type);
  }

  updateLatencyMetric(latency) {
    const alpha = 0.1; // Smoothing factor
    this.metrics.avgSyncLatency = alpha * latency + (1 - alpha) * this.metrics.avgSyncLatency;
  }

  canMergeDeltas(delta1, delta2) {
    // Can merge if they affect different paths
    return !this.hasOverlappingPaths(delta1.operation, delta2.operation);
  }

  hasOverlappingPaths(op1, op2) {
    const paths1 = this.extractPaths(op1);
    const paths2 = this.extractPaths(op2);
    
    return paths1.some(p1 => paths2.some(p2 => 
      p1.startsWith(p2) || p2.startsWith(p1)
    ));
  }

  extractPaths(operation) {
    // Extract affected paths from operation
    if (operation.path) {return [operation.path];}
    if (operation.paths) {return operation.paths;}
    return [];
  }

  getMetrics() {
    return {
      ...this.metrics,
      activeSessions: this.sessions.size,
      activeParticipants: this.participants.size,
      activeLocks: this.locks.size
    };
  }
  
  /**
   * Clean up resources and stop all intervals
   */
  async cleanup() {
    // Clear all intervals
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.clear();
    
    // Clear all lock timeouts
    for (const [lockId, lock] of this.locks) {
      // Lock timeouts are handled internally by setTimeout
    }
    
    // Remove all event listeners
    this.removeAllListeners();
    
    // Clear all sessions
    this.sessions.clear();
    this.participants.clear();
    this.locks.clear();
    
    logger.info('🟢 Real-time collaboration system cleaned up');
  }
}

/**
 * Collaborative State Management
 */
class CollaborativeState {
  constructor() {
    this.data = {};
    this.metadata = {};
    this.operations = [];
  }

  async apply(operation) {
    try {
      const result = await this.applyOperation(operation);
      
      if (result.success) {
        this.operations.push({
          ...operation,
          applied: Date.now()
        });
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        reason: error.message
      };
    }
  }

  async applyOperation(op) {
    switch (op.type) {
      case 'set':
        return this.setValue(op.path, op.value);
      case 'delete':
        return this.deleteValue(op.path);
      case 'insert':
        return this.insertValue(op.path, op.index, op.value);
      case 'move':
        return this.moveValue(op.from, op.to);
      case 'transform':
        return this.transformValue(op.path, op.transform);
      default:
        throw new Error(`Unknown operation type: ${op.type}`);
    }
  }

  setValue(path, value) {
    const oldValue = this.getByPath(path);
    this.setByPath(path, value);
    
    return {
      success: true,
      changes: [{
        type: 'set',
        path: path,
        oldValue: oldValue,
        newValue: value
      }]
    };
  }

  getByPath(path) {
    const parts = path.split('.');
    let current = this.data;
    
    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  setByPath(path, value) {
    const parts = path.split('.');
    let current = this.data;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
  }

  async serialize() {
    return {
      data: JSON.parse(JSON.stringify(this.data)),
      metadata: this.metadata,
      operationCount: this.operations.length
    };
  }

  getSnapshot() {
    return JSON.parse(JSON.stringify(this.data));
  }
}

/**
 * Sync Queue with prioritization
 */
class SyncQueue {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.items = [];
    this.processed = new Set();
  }

  add(item) {
    if (this.items.length >= this.maxSize) {
      // Remove oldest non-critical items
      this.items = this.items.filter(i => 
        i.operation?.priority === 'critical' || 
        i.operation?.priority === 'high'
      );
    }
    
    this.items.push(item);
  }

  getReady() {
    return this.items.filter(item => !this.processed.has(item));
  }

  getConcurrent(version) {
    return this.items
      .filter(item => item.version >= version && item.operation)
      .map(item => item.operation);
  }

  clearProcessed(items) {
    items.forEach(item => this.processed.add(item));
    
    // Clean up old processed items
    if (this.processed.size > 1000) {
      this.items = this.items.filter(item => !this.processed.has(item));
      this.processed.clear();
    }
  }

  hasItems() {
    return this.items.length > this.processed.size;
  }
}

/**
 * Delta Synchronization
 */
class DeltaSync {
  async createDelta(changes) {
    const delta = {
      changes: changes,
      timestamp: Date.now(),
      size: JSON.stringify(changes).length
    };
    
    // Compress if large
    if (delta.size > 1024) {
      delta.compressed = true;
      delta.changes = await this.compress(changes);
    }
    
    return delta;
  }

  async compress(data) {
    // Simple compression - in production use proper compression
    return {
      type: 'compressed',
      data: JSON.stringify(data)
    };
  }
}

/**
 * Priority Lane System
 */
class PriorityLanes {
  constructor() {
    this.lanes = {
      critical: [],
      high: [],
      normal: [],
      low: []
    };
  }

  async enqueue(operation) {
    const lane = this.lanes[operation.priority] || this.lanes.normal;
    lane.push(operation);
  }

  async processCritical() {
    const ops = this.lanes.critical.splice(0, 10); // Process up to 10
    return ops;
  }

  async processHigh() {
    const ops = this.lanes.high.splice(0, 5); // Process up to 5
    return ops;
  }

  async processNormal() {
    const ops = this.lanes.normal.splice(0, 3); // Process up to 3
    return ops;
  }
}

/**
 * Distributed Lock Manager
 */
class DistributedLockManager {
  constructor() {
    this.locks = new Map();
    this.waitQueues = new Map();
  }

  async acquire(resource, owner, timeout = 5000) {
    const existing = this.locks.get(resource);
    
    if (existing && Date.now() - existing.acquired < existing.timeout) {
      // Add to wait queue
      if (!this.waitQueues.has(resource)) {
        this.waitQueues.set(resource, []);
      }
      
      return new Promise((resolve) => {
        this.waitQueues.get(resource).push({
          owner: owner,
          resolve: resolve,
          requested: Date.now()
        });
      });
    }
    
    const lock = {
      resource: resource,
      owner: owner,
      acquired: Date.now(),
      timeout: timeout
    };
    
    this.locks.set(resource, lock);
    
    // Auto-release
    setTimeout(() => this.release(resource, owner), timeout);
    
    return lock;
  }

  async release(resource, owner) {
    const lock = this.locks.get(resource);
    if (!lock || lock.owner !== owner) {return;}
    
    this.locks.delete(resource);
    
    // Process wait queue
    const queue = this.waitQueues.get(resource);
    if (queue && queue.length > 0) {
      const next = queue.shift();
      const newLock = await this.acquire(resource, next.owner);
      next.resolve(newLock);
    }
  }
}

/**
 * Conflict Manager with operational transformation
 */
class ConflictManager extends EventEmitter {
  checkConflict(op1, op2) {
    // Check if operations conflict
    if (op1.type === 'set' && op2.type === 'set') {
      if (op1.path === op2.path) {
        return {
          type: 'concurrent-update',
          severity: 'high',
          details: { path: op1.path }
        };
      }
    }
    
    if (op1.type === 'delete' && op2.type === 'set') {
      if (op1.path === op2.path || op2.path.startsWith(op1.path + '.')) {
        return {
          type: 'delete-update',
          severity: 'critical',
          details: { deletePath: op1.path, updatePath: op2.path }
        };
      }
    }
    
    return null;
  }

  async resolve(operation, conflicts, session) {
    // Sort conflicts by severity
    conflicts.sort((a, b) => 
      this.getSeverityValue(b.severity) - this.getSeverityValue(a.severity)
    );
    
    let resolved = operation;
    
    for (const conflict of conflicts) {
      const resolution = await this.resolveConflict(resolved, conflict, session);
      
      if (!resolution.success) {
        return resolution;
      }
      
      resolved = resolution.operation;
    }
    
    return { success: true, operation: resolved };
  }

  async resolveConflict(operation, conflict, session) {
    switch (conflict.type) {
      case 'concurrent-update':
        return this.resolveConcurrentUpdate(operation, conflict);
      case 'delete-update':
        return this.resolveDeleteUpdate(operation, conflict);
      default:
        return { success: false, reason: 'unknown_conflict_type' };
    }
  }

  resolveConcurrentUpdate(operation, conflict) {
    // Transform operation to handle concurrent update
    const transformed = {
      ...operation,
      value: this.mergeValues(operation.value, conflict.operation2.value)
    };
    
    return { success: true, operation: transformed };
  }

  resolveDeleteUpdate(operation, conflict) {
    // Update wins over delete in this strategy
    if (operation.type === 'set') {
      return { success: true, operation: operation };
    }
    
    // Delete loses
    return { success: false, reason: 'delete_blocked_by_update' };
  }

  mergeValues(value1, value2) {
    // Simple merge strategy - can be enhanced
    if (typeof value1 === 'object' && typeof value2 === 'object') {
      return { ...value2, ...value1 }; // Last write wins for properties
    }
    
    return value1; // First write wins for primitives
  }

  getSeverityValue(severity) {
    const values = { low: 1, medium: 2, high: 3, critical: 4 };
    return values[severity] || 2;
  }
}

/**
 * Sync Engine
 */
class SyncEngine extends EventEmitter {
  constructor() {
    super();
    this.syncTasks = new Map();
  }

  scheduleSync(session, immediate = false) {
    if (immediate) {
      this.emit('sync-needed', session);
    } else {
      // Debounce sync requests
      if (this.syncTasks.has(session.id)) {
        clearTimeout(this.syncTasks.get(session.id));
      }
      
      const timeout = setTimeout(() => {
        this.emit('sync-needed', session);
        this.syncTasks.delete(session.id);
      }, 100);
      
      this.syncTasks.set(session.id, timeout);
    }
  }
}

// Export singleton
let instance = null;

module.exports = {
  RealTimeCollaborationSystem,
  
  getInstance(memoryLayer) {
    if (!instance) {
      instance = new RealTimeCollaborationSystem(memoryLayer);
    }
    return instance;
  }
};