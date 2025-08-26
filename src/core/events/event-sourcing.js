/**
 * Event Sourcing System
 * Event-driven state management with time travel
 * Sprint 21-24 - Event System Fix
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../logging/bumba-logger');
const { stateManager } = require('../state/global-state-manager');
const crypto = require('crypto');

class EventStore {
  constructor(options = {}) {
    this.options = {
      storePath: options.storePath || path.join(process.cwd(), '.bumba-events'),
      maxEventsInMemory: options.maxEventsInMemory || 10000,
      snapshotInterval: options.snapshotInterval || 100,
      enablePersistence: options.enablePersistence !== false,
      compressionEnabled: options.compressionEnabled || false
    };
    
    // Event storage
    this.events = [];
    this.snapshots = new Map();
    this.projections = new Map();
    this.eventHandlers = new Map();
    
    // Indexes
    this.streamIndex = new Map(); // aggregateId -> events
    this.typeIndex = new Map();   // eventType -> events
    this.timeIndex = new Map();   // timestamp -> events
    
    // Statistics
    this.stats = {
      eventsStored: 0,
      snapshotsTaken: 0,
      projectionsBuilt: 0,
      eventsReplayed: 0
    };
    
    // Ensure store directory exists
    if (this.options.enablePersistence) {
      this.ensureStoreDirectory();
    }
    
    // Register with state manager
    stateManager.register('eventStore', {
      stats: this.stats,
      eventCount: 0,
      snapshotCount: 0
    });
  }
  
  /**
   * Ensure store directory exists
   */
  ensureStoreDirectory() {
    if (!fs.existsSync(this.options.storePath)) {
      fs.mkdirSync(this.options.storePath, { recursive: true });
    }
  }
  
  /**
   * Append event to store
   */
  async appendEvent(event) {
    // Validate event
    if (!event.aggregateId || !event.type || !event.data) {
      throw new Error('Invalid event: missing required fields');
    }
    
    // Create event envelope
    const envelope = {
      id: this.generateEventId(),
      aggregateId: event.aggregateId,
      type: event.type,
      data: event.data,
      metadata: event.metadata || {},
      version: await this.getNextVersion(event.aggregateId),
      timestamp: Date.now(),
      userId: event.userId || 'system',
      correlationId: event.correlationId || this.generateCorrelationId()
    };
    
    // Store event
    this.events.push(envelope);
    this.stats.eventsStored++;
    
    // Update indexes
    this.indexEvent(envelope);
    
    // Check if snapshot needed
    if (envelope.version % this.options.snapshotInterval === 0) {
      await this.takeSnapshot(event.aggregateId, envelope.version);
    }
    
    // Persist if enabled
    if (this.options.enablePersistence) {
      await this.persistEvent(envelope);
    }
    
    // Update projections
    await this.updateProjections(envelope);
    
    // Trim memory if needed
    if (this.events.length > this.options.maxEventsInMemory) {
      await this.trimMemory();
    }
    
    this.updateState();
    return envelope;
  }
  
  /**
   * Index event for fast retrieval
   */
  indexEvent(event) {
    // Stream index
    if (!this.streamIndex.has(event.aggregateId)) {
      this.streamIndex.set(event.aggregateId, []);
    }
    this.streamIndex.get(event.aggregateId).push(event);
    
    // Type index
    if (!this.typeIndex.has(event.type)) {
      this.typeIndex.set(event.type, []);
    }
    this.typeIndex.get(event.type).push(event);
    
    // Time index (by hour)
    const hourKey = new Date(event.timestamp).toISOString().substr(0, 13);
    if (!this.timeIndex.has(hourKey)) {
      this.timeIndex.set(hourKey, []);
    }
    this.timeIndex.get(hourKey).push(event);
  }
  
  /**
   * Get next version for aggregate
   */
  async getNextVersion(aggregateId) {
    const events = this.streamIndex.get(aggregateId) || [];
    return events.length + 1;
  }
  
  /**
   * Get events for aggregate
   */
  async getEvents(aggregateId, fromVersion = 0, toVersion = Infinity) {
    const events = this.streamIndex.get(aggregateId) || [];
    
    return events.filter(e => 
      e.version > fromVersion && e.version <= toVersion
    );
  }
  
  /**
   * Get events by type
   */
  async getEventsByType(type, limit = 100) {
    const events = this.typeIndex.get(type) || [];
    return events.slice(-limit);
  }
  
  /**
   * Take snapshot of aggregate
   */
  async takeSnapshot(aggregateId, version) {
    const events = await this.getEvents(aggregateId, 0, version);
    
    if (events.length === 0) return;
    
    // Build state from events
    const state = await this.buildState(aggregateId, events);
    
    const snapshot = {
      aggregateId,
      version,
      state,
      timestamp: Date.now()
    };
    
    this.snapshots.set(aggregateId, snapshot);
    this.stats.snapshotsTaken++;
    
    // Persist snapshot
    if (this.options.enablePersistence) {
      await this.persistSnapshot(snapshot);
    }
    
    logger.debug(`Snapshot taken for ${aggregateId} at version ${version}`);
  }
  
  /**
   * Build state from events
   */
  async buildState(aggregateId, events) {
    let state = {};
    
    for (const event of events) {
      const handler = this.eventHandlers.get(event.type);
      if (handler) {
        state = handler(state, event);
      } else {
        // Default handler - merge data
        state = { ...state, ...event.data };
      }
    }
    
    return state;
  }
  
  /**
   * Get current state of aggregate
   */
  async getState(aggregateId) {
    // Check for snapshot
    const snapshot = this.snapshots.get(aggregateId);
    let state = snapshot ? snapshot.state : {};
    let fromVersion = snapshot ? snapshot.version : 0;
    
    // Apply events since snapshot
    const events = await this.getEvents(aggregateId, fromVersion);
    
    for (const event of events) {
      const handler = this.eventHandlers.get(event.type);
      if (handler) {
        state = handler(state, event);
      } else {
        state = { ...state, ...event.data };
      }
    }
    
    return state;
  }
  
  /**
   * Register event handler
   */
  registerEventHandler(eventType, handler) {
    this.eventHandlers.set(eventType, handler);
  }
  
  /**
   * Create projection
   */
  createProjection(name, definition) {
    const projection = {
      name,
      definition,
      state: definition.initialState || {},
      version: 0,
      lastEventId: null
    };
    
    this.projections.set(name, projection);
    this.stats.projectionsBuilt++;
    
    // Build projection from existing events
    this.rebuildProjection(name);
    
    return {
      getState: () => this.projections.get(name).state,
      rebuild: () => this.rebuildProjection(name)
    };
  }
  
  /**
   * Update projections with new event
   */
  async updateProjections(event) {
    for (const [name, projection] of this.projections) {
      const handler = projection.definition.handlers[event.type];
      
      if (handler) {
        try {
          projection.state = await handler(projection.state, event);
          projection.version++;
          projection.lastEventId = event.id;
        } catch (error) {
          logger.error(`Error updating projection ${name}:`, error);
        }
      }
    }
  }
  
  /**
   * Rebuild projection from events
   */
  async rebuildProjection(name) {
    const projection = this.projections.get(name);
    if (!projection) return;
    
    projection.state = projection.definition.initialState || {};
    projection.version = 0;
    
    // Apply all events
    for (const event of this.events) {
      const handler = projection.definition.handlers[event.type];
      if (handler) {
        projection.state = await handler(projection.state, event);
        projection.version++;
      }
    }
    
    logger.info(`Projection ${name} rebuilt with ${projection.version} events`);
  }
  
  /**
   * Time travel - get state at specific time
   */
  async getStateAtTime(aggregateId, timestamp) {
    const events = this.streamIndex.get(aggregateId) || [];
    const eventsBeforeTime = events.filter(e => e.timestamp <= timestamp);
    
    return this.buildState(aggregateId, eventsBeforeTime);
  }
  
  /**
   * Replay events
   */
  async replay(filter = {}, handler) {
    let events = [...this.events];
    
    // Apply filters
    if (filter.aggregateId) {
      events = events.filter(e => e.aggregateId === filter.aggregateId);
    }
    if (filter.type) {
      events = events.filter(e => e.type === filter.type);
    }
    if (filter.from) {
      events = events.filter(e => e.timestamp >= filter.from);
    }
    if (filter.to) {
      events = events.filter(e => e.timestamp <= filter.to);
    }
    
    // Replay events
    for (const event of events) {
      await handler(event);
      this.stats.eventsReplayed++;
    }
    
    return events.length;
  }
  
  /**
   * Persist event to disk
   */
  async persistEvent(event) {
    const filename = `event_${event.id}.json`;
    const filepath = path.join(this.options.storePath, filename);
    
    try {
      fs.writeFileSync(filepath, JSON.stringify(event, null, 2));
    } catch (error) {
      logger.error('Failed to persist event:', error);
    }
  }
  
  /**
   * Persist snapshot to disk
   */
  async persistSnapshot(snapshot) {
    const filename = `snapshot_${snapshot.aggregateId}_v${snapshot.version}.json`;
    const filepath = path.join(this.options.storePath, filename);
    
    try {
      fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));
    } catch (error) {
      logger.error('Failed to persist snapshot:', error);
    }
  }
  
  /**
   * Load events from disk
   */
  async loadEvents() {
    if (!this.options.enablePersistence) return;
    
    try {
      const files = fs.readdirSync(this.options.storePath);
      const eventFiles = files.filter(f => f.startsWith('event_'));
      
      for (const file of eventFiles) {
        const filepath = path.join(this.options.storePath, file);
        const event = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        
        this.events.push(event);
        this.indexEvent(event);
      }
      
      logger.info(`Loaded ${eventFiles.length} events from disk`);
    } catch (error) {
      logger.error('Failed to load events:', error);
    }
  }
  
  /**
   * Load snapshots from disk
   */
  async loadSnapshots() {
    if (!this.options.enablePersistence) return;
    
    try {
      const files = fs.readdirSync(this.options.storePath);
      const snapshotFiles = files.filter(f => f.startsWith('snapshot_'));
      
      for (const file of snapshotFiles) {
        const filepath = path.join(this.options.storePath, file);
        const snapshot = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        
        this.snapshots.set(snapshot.aggregateId, snapshot);
      }
      
      logger.info(`Loaded ${snapshotFiles.length} snapshots from disk`);
    } catch (error) {
      logger.error('Failed to load snapshots:', error);
    }
  }
  
  /**
   * Trim memory by persisting old events
   */
  async trimMemory() {
    const eventsToKeep = Math.floor(this.options.maxEventsInMemory * 0.8);
    const eventsToRemove = this.events.length - eventsToKeep;
    
    if (eventsToRemove <= 0) return;
    
    // Persist events before removing
    if (this.options.enablePersistence) {
      const removedEvents = this.events.slice(0, eventsToRemove);
      for (const event of removedEvents) {
        await this.persistEvent(event);
      }
    }
    
    // Remove from memory
    this.events = this.events.slice(eventsToRemove);
    
    logger.debug(`Trimmed ${eventsToRemove} events from memory`);
  }
  
  /**
   * Generate IDs
   */
  generateEventId() {
    return `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }
  
  generateCorrelationId() {
    return crypto.randomBytes(16).toString('hex');
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      eventsInMemory: this.events.length,
      snapshotsInMemory: this.snapshots.size,
      projections: this.projections.size,
      aggregates: this.streamIndex.size
    };
  }
  
  /**
   * Update state
   */
  updateState() {
    stateManager.set('eventStore', 'stats', this.stats);
    stateManager.set('eventStore', 'eventCount', this.events.length);
    stateManager.set('eventStore', 'snapshotCount', this.snapshots.size);
  }
}

// Aggregate base class
class Aggregate {
  constructor(id, eventStore) {
    this.id = id;
    this.eventStore = eventStore;
    this.uncommittedEvents = [];
  }
  
  async load() {
    this.state = await this.eventStore.getState(this.id);
    return this;
  }
  
  apply(eventType, data, metadata = {}) {
    const event = {
      aggregateId: this.id,
      type: eventType,
      data,
      metadata
    };
    
    this.uncommittedEvents.push(event);
    
    // Apply to local state
    const handler = this.eventStore.eventHandlers.get(eventType);
    if (handler) {
      this.state = handler(this.state, event);
    } else {
      this.state = { ...this.state, ...data };
    }
  }
  
  async save() {
    for (const event of this.uncommittedEvents) {
      await this.eventStore.appendEvent(event);
    }
    this.uncommittedEvents = [];
  }
}

// Singleton instance
let instance = null;

function getEventStore(options) {
  if (!instance) {
    instance = new EventStore(options);
  }
  return instance;
}

module.exports = {
  EventStore,
  Aggregate,
  getEventStore,
  eventStore: getEventStore()
};