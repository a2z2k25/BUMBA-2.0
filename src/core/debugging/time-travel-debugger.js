/**
 * BUMBA Time-Travel Debugger
 * Advanced debugging with state snapshots and time manipulation
 */

const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');
const { UnifiedMemorySystem } = require('../memory/unified-memory-system');

class BumbaTimeTravelDebugger extends EventEmitter {
  constructor() {
    super();
    this.sessions = new Map();
    this.snapshots = new Map();
    this.breakpoints = new Map();
    this.watchpoints = new Map();
    this.currentSession = null;
    this.memory = new UnifiedMemorySystem();
    this.config = {
      maxSnapshots: 1000,
      snapshotInterval: 100, // ms
      maxSessionDuration: 3600000, // 1 hour
      compressionEnabled: true
    };
  }

  /**
   * Start a new debugging session
   */
  async startSession(sessionConfig) {
    const sessionId = this.generateSessionId();
    
    const session = {
      id: sessionId,
      name: sessionConfig.name || `Debug Session ${sessionId}`,
      target: sessionConfig.target, // agent, task, or system
      startTime: Date.now(),
      state: 'active',
      timeline: [],
      currentIndex: -1,
      metadata: {
        ...sessionConfig.metadata,
        breakpointHits: 0,
        stepsExecuted: 0,
        snapshotCount: 0
      }
    };

    this.sessions.set(sessionId, session);
    this.snapshots.set(sessionId, []);
    this.currentSession = session;

    logger.info(`⏰ Time-travel debug session started: ${session.name}`);
    
    this.emit('session_started', { sessionId, session });
    
    return sessionId;
  }

  /**
   * Record a state snapshot
   */
  async recordSnapshot(context) {
    if (!this.currentSession || this.currentSession.state !== 'active') {
      return null;
    }

    const snapshot = {
      id: this.generateSnapshotId(),
      sessionId: this.currentSession.id,
      timestamp: Date.now(),
      sequenceNumber: this.currentSession.timeline.length,
      state: await this.captureState(context),
      metadata: {
        agentId: context.agentId,
        action: context.action,
        location: context.location,
        variables: context.variables,
        callStack: context.callStack
      }
    };

    // Compress if enabled
    if (this.config.compressionEnabled) {
      snapshot.state = await this.compressState(snapshot.state);
    }

    // Add to timeline
    this.currentSession.timeline.push({
      type: 'snapshot',
      id: snapshot.id,
      timestamp: snapshot.timestamp,
      summary: this.createSnapshotSummary(snapshot)
    });

    // Store snapshot
    const sessionSnapshots = this.snapshots.get(this.currentSession.id);
    sessionSnapshots.push(snapshot);

    // Maintain snapshot limit
    if (sessionSnapshots.length > this.config.maxSnapshots) {
      sessionSnapshots.shift();
    }

    this.currentSession.metadata.snapshotCount++;
    this.currentSession.currentIndex = this.currentSession.timeline.length - 1;

    logger.debug(`🟢 Snapshot recorded: ${snapshot.id}`);
    
    return snapshot.id;
  }

  /**
   * Travel to a specific point in time
   */
  async travelTo(target) {
    if (!this.currentSession) {
      throw new Error('No active debugging session');
    }

    let targetIndex;
    
    if (typeof target === 'number') {
      // Travel to specific index
      targetIndex = target;
    } else if (typeof target === 'string') {
      // Travel to snapshot ID
      targetIndex = this.currentSession.timeline.findIndex(
        entry => entry.id === target
      );
    } else if (target instanceof Date) {
      // Travel to timestamp
      targetIndex = this.findClosestTimestamp(target.getTime());
    }

    if (targetIndex < 0 || targetIndex >= this.currentSession.timeline.length) {
      throw new Error('Invalid travel target');
    }

    // Get the snapshot
    const timelineEntry = this.currentSession.timeline[targetIndex];
    const snapshot = await this.getSnapshot(timelineEntry.id);

    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    // Restore state
    const restoredState = await this.restoreState(snapshot);

    this.currentSession.currentIndex = targetIndex;

    logger.info(`⏰ Traveled to: ${timelineEntry.summary}`);
    
    this.emit('time_traveled', {
      sessionId: this.currentSession.id,
      targetIndex,
      snapshot: snapshot.id,
      state: restoredState
    });

    return restoredState;
  }

  /**
   * Step forward in time
   */
  async stepForward(steps = 1) {
    if (!this.currentSession) {
      throw new Error('No active debugging session');
    }

    const newIndex = Math.min(
      this.currentSession.currentIndex + steps,
      this.currentSession.timeline.length - 1
    );

    if (newIndex === this.currentSession.currentIndex) {
      return null; // Already at the end
    }

    return await this.travelTo(newIndex);
  }

  /**
   * Step backward in time
   */
  async stepBackward(steps = 1) {
    if (!this.currentSession) {
      throw new Error('No active debugging session');
    }

    const newIndex = Math.max(
      this.currentSession.currentIndex - steps,
      0
    );

    if (newIndex === this.currentSession.currentIndex) {
      return null; // Already at the beginning
    }

    return await this.travelTo(newIndex);
  }

  /**
   * Set a temporal breakpoint
   */
  async setBreakpoint(breakpointConfig) {
    const breakpoint = {
      id: this.generateBreakpointId(),
      sessionId: this.currentSession?.id,
      type: breakpointConfig.type || 'conditional',
      condition: breakpointConfig.condition,
      location: breakpointConfig.location,
      enabled: true,
      hitCount: 0,
      actions: breakpointConfig.actions || []
    };

    this.breakpoints.set(breakpoint.id, breakpoint);

    logger.debug(`🔴 Breakpoint set: ${breakpoint.id}`);
    
    this.emit('breakpoint_set', { breakpoint });
    
    return breakpoint.id;
  }

  /**
   * Check and handle breakpoints
   */
  async checkBreakpoints(context) {
    if (!this.currentSession || this.currentSession.state !== 'active') {
      return false;
    }

    for (const [id, breakpoint] of this.breakpoints) {
      if (!breakpoint.enabled) {continue;}
      
      if (await this.evaluateBreakpoint(breakpoint, context)) {
        breakpoint.hitCount++;
        this.currentSession.metadata.breakpointHits++;

        logger.info(`🔴 Breakpoint hit: ${breakpoint.id}`);
        
        // Execute breakpoint actions
        for (const action of breakpoint.actions) {
          await this.executeBreakpointAction(action, context);
        }

        // Record snapshot at breakpoint
        await this.recordSnapshot({
          ...context,
          breakpoint: breakpoint.id
        });

        this.emit('breakpoint_hit', {
          breakpoint,
          context,
          sessionId: this.currentSession.id
        });

        return true;
      }
    }

    return false;
  }

  /**
   * Set a watchpoint on state changes
   */
  async setWatchpoint(watchpointConfig) {
    const watchpoint = {
      id: this.generateWatchpointId(),
      expression: watchpointConfig.expression,
      callback: watchpointConfig.callback,
      enabled: true,
      previousValue: null,
      hitCount: 0
    };

    this.watchpoints.set(watchpoint.id, watchpoint);

    logger.debug(`🟢️ Watchpoint set: ${watchpoint.id}`);
    
    return watchpoint.id;
  }

  /**
   * Compare two states (diff)
   */
  async compareStates(snapshotId1, snapshotId2) {
    const snapshot1 = await this.getSnapshot(snapshotId1);
    const snapshot2 = await this.getSnapshot(snapshotId2);

    if (!snapshot1 || !snapshot2) {
      throw new Error('Snapshots not found');
    }

    const state1 = await this.decompressState(snapshot1.state);
    const state2 = await this.decompressState(snapshot2.state);

    const diff = this.calculateStateDiff(state1, state2);

    return {
      snapshot1: {
        id: snapshot1.id,
        timestamp: snapshot1.timestamp,
        summary: this.createSnapshotSummary(snapshot1)
      },
      snapshot2: {
        id: snapshot2.id,
        timestamp: snapshot2.timestamp,
        summary: this.createSnapshotSummary(snapshot2)
      },
      diff,
      summary: this.createDiffSummary(diff)
    };
  }

  /**
   * Search through timeline
   */
  async searchTimeline(query) {
    if (!this.currentSession) {
      return [];
    }

    const results = [];
    const sessionSnapshots = this.snapshots.get(this.currentSession.id) || [];

    for (const snapshot of sessionSnapshots) {
      if (await this.matchesQuery(snapshot, query)) {
        results.push({
          snapshotId: snapshot.id,
          timestamp: snapshot.timestamp,
          summary: this.createSnapshotSummary(snapshot),
          relevance: await this.calculateRelevance(snapshot, query)
        });
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Export debugging session
   */
  async exportSession(sessionId, format = 'json') {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const sessionSnapshots = this.snapshots.get(sessionId) || [];
    
    const exportData = {
      session: {
        ...session,
        snapshotCount: sessionSnapshots.length
      },
      timeline: session.timeline,
      snapshots: format === 'full' ? sessionSnapshots : undefined,
      breakpoints: Array.from(this.breakpoints.values()).filter(
        bp => bp.sessionId === sessionId
      ),
      metadata: {
        exportedAt: Date.now(),
        format,
        version: '1.0'
      }
    };

    if (format === 'compressed') {
      return await this.compressExport(exportData);
    }

    return exportData;
  }

  /**
   * Import debugging session
   */
  async importSession(exportData) {
    const sessionData = typeof exportData === 'string' 
      ? JSON.parse(exportData)
      : exportData;

    // Create new session from import
    const sessionId = sessionData.session.id || this.generateSessionId();
    
    const session = {
      ...sessionData.session,
      id: sessionId,
      state: 'imported',
      importedAt: Date.now()
    };

    this.sessions.set(sessionId, session);
    
    // Import snapshots if available
    if (sessionData.snapshots) {
      this.snapshots.set(sessionId, sessionData.snapshots);
    }

    // Import breakpoints
    if (sessionData.breakpoints) {
      for (const bp of sessionData.breakpoints) {
        bp.sessionId = sessionId;
        this.breakpoints.set(bp.id, bp);
      }
    }

    logger.info(`🟢 Session imported: ${session.name}`);
    
    return sessionId;
  }

  /**
   * Replay a sequence of events
   */
  async replay(startIndex, endIndex, options = {}) {
    if (!this.currentSession) {
      throw new Error('No active debugging session');
    }

    const speed = options.speed || 1.0;
    const stepCallback = options.onStep;
    
    logger.info(`▶️ Starting replay from ${startIndex} to ${endIndex}`);
    
    this.emit('replay_started', {
      sessionId: this.currentSession.id,
      startIndex,
      endIndex,
      speed
    });

    for (let i = startIndex; i <= endIndex; i++) {
      // Travel to each point
      const state = await this.travelTo(i);
      
      if (stepCallback) {
        await stepCallback(i, state);
      }

      // Delay based on speed
      if (i < endIndex && speed < 10) {
        const delay = 100 / speed;
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Check if replay was cancelled
      if (this.replayCancelled) {
        this.replayCancelled = false;
        break;
      }
    }

    logger.info('⏹️ Replay completed');
    
    this.emit('replay_completed', {
      sessionId: this.currentSession.id
    });
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const snapshots = this.snapshots.get(sessionId) || [];
    const duration = Date.now() - session.startTime;

    return {
      sessionId,
      name: session.name,
      duration,
      snapshotCount: snapshots.length,
      timelineLength: session.timeline.length,
      breakpointHits: session.metadata.breakpointHits,
      currentPosition: session.currentIndex,
      memoryUsage: this.calculateMemoryUsage(snapshots),
      compressionRatio: this.calculateCompressionRatio(snapshots)
    };
  }

  // Helper methods

  async captureState(context) {
    return {
      agents: context.agents || {},
      memory: context.memory || {},
      variables: context.variables || {},
      environment: context.environment || {},
      timestamp: Date.now()
    };
  }

  async compressState(state) {
    // Simple compression - in production would use proper compression
    return {
      compressed: true,
      data: JSON.stringify(state)
    };
  }

  async decompressState(state) {
    if (state.compressed) {
      return JSON.parse(state.data);
    }
    return state;
  }

  async restoreState(snapshot) {
    const state = await this.decompressState(snapshot.state);
    
    // Emit state restoration event
    this.emit('state_restored', {
      snapshotId: snapshot.id,
      state
    });

    return state;
  }

  async getSnapshot(snapshotId) {
    const sessionSnapshots = this.snapshots.get(this.currentSession?.id);
    if (!sessionSnapshots) {return null;}

    return sessionSnapshots.find(s => s.id === snapshotId);
  }

  findClosestTimestamp(timestamp) {
    if (!this.currentSession) {return -1;}

    let closestIndex = 0;
    let closestDiff = Math.abs(
      this.currentSession.timeline[0].timestamp - timestamp
    );

    for (let i = 1; i < this.currentSession.timeline.length; i++) {
      const diff = Math.abs(
        this.currentSession.timeline[i].timestamp - timestamp
      );
      
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = i;
      }
    }

    return closestIndex;
  }

  createSnapshotSummary(snapshot) {
    const action = snapshot.metadata.action || 'state_capture';
    const agent = snapshot.metadata.agentId || 'system';
    const time = new Date(snapshot.timestamp).toISOString();
    
    return `${action} by ${agent} at ${time}`;
  }

  async evaluateBreakpoint(breakpoint, context) {
    // Evaluate breakpoint condition
    try {
      if (breakpoint.type === 'conditional') {
        return await this.evaluateCondition(breakpoint.condition, context);
      } else if (breakpoint.type === 'location') {
        return context.location === breakpoint.location;
      }
      
      return false;
    } catch (error) {
      logger.error('Breakpoint evaluation error:', error);
      return false;
    }
  }

  async evaluateCondition(condition, context) {
    // Safe evaluation of conditions
    // In production, use a proper expression evaluator
    try {
      const fn = new Function('context', `return ${condition}`);
      return fn(context);
    } catch (error) {
      return false;
    }
  }

  async executeBreakpointAction(action, context) {
    switch (action.type) {
      case 'log':
        logger.info(`Breakpoint: ${action.message}`, context);
        break;
      case 'snapshot':
        await this.recordSnapshot(context);
        break;
      case 'callback':
        if (typeof action.callback === 'function') {
          await action.callback(context);
        }
        break;
    }
  }

  calculateStateDiff(state1, state2) {
    const diff = {
      added: {},
      modified: {},
      removed: {}
    };

    // Find added and modified
    for (const [key, value] of Object.entries(state2)) {
      if (!(key in state1)) {
        diff.added[key] = value;
      } else if (JSON.stringify(state1[key]) !== JSON.stringify(value)) {
        diff.modified[key] = {
          old: state1[key],
          new: value
        };
      }
    }

    // Find removed
    for (const key of Object.keys(state1)) {
      if (!(key in state2)) {
        diff.removed[key] = state1[key];
      }
    }

    return diff;
  }

  createDiffSummary(diff) {
    const counts = {
      added: Object.keys(diff.added).length,
      modified: Object.keys(diff.modified).length,
      removed: Object.keys(diff.removed).length
    };

    return `${counts.added} added, ${counts.modified} modified, ${counts.removed} removed`;
  }

  async matchesQuery(snapshot, query) {
    const searchableText = JSON.stringify(snapshot).toLowerCase();
    
    if (typeof query === 'string') {
      return searchableText.includes(query.toLowerCase());
    } else if (query.agentId) {
      return snapshot.metadata.agentId === query.agentId;
    } else if (query.timeRange) {
      return snapshot.timestamp >= query.timeRange.start &&
             snapshot.timestamp <= query.timeRange.end;
    }
    
    return false;
  }

  async calculateRelevance(snapshot, query) {
    // Simple relevance scoring
    let score = 0;
    
    if (typeof query === 'string') {
      const searchableText = JSON.stringify(snapshot).toLowerCase();
      const queryLower = query.toLowerCase();
      const matches = (searchableText.match(new RegExp(queryLower, 'g')) || []).length;
      score = matches / (searchableText.length / 100);
    }
    
    return Math.min(score, 1.0);
  }

  async compressExport(exportData) {
    // Simple compression for export
    return JSON.stringify(exportData);
  }

  calculateMemoryUsage(snapshots) {
    let totalSize = 0;
    
    for (const snapshot of snapshots) {
      totalSize += JSON.stringify(snapshot).length;
    }
    
    return totalSize;
  }

  calculateCompressionRatio(snapshots) {
    if (snapshots.length === 0) {return 1.0;}
    
    const compressed = snapshots.filter(s => s.state.compressed).length;
    return compressed / snapshots.length;
  }

  generateSessionId() {
    return `debug-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSnapshotId() {
    return `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateBreakpointId() {
    return `bp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateWatchpointId() {
    return `wp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * End debugging session
   */
  async endSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.state = 'ended';
    session.endTime = Date.now();

    // Store session in memory for later retrieval
    await this.memory.store({
      type: 'debug_session',
      session,
      snapshots: this.snapshots.get(sessionId)
    });

    logger.info(`⏰ Debug session ended: ${session.name}`);
    
    this.emit('session_ended', { sessionId, session });

    // Clean up if not the current session
    if (this.currentSession?.id === sessionId) {
      this.currentSession = null;
    }
  }
}

module.exports = { BumbaTimeTravelDebugger };