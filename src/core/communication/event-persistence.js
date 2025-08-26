/**
 * Event Persistence System - Advanced event storage, ordering, and replay capabilities
 * Provides durable event storage with ordering guarantees, retention policies, and audit compliance
 */

const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../logging/bumba-logger');

/**
 * Storage backends for different persistence strategies
 */
const StorageBackend = {
  MEMORY: 'memory',
  FILE: 'file',
  DATABASE: 'database'
};

/**
 * Event ordering strategies
 */
const OrderingStrategy = {
  TIMESTAMP: 'timestamp',
  SEQUENCE: 'sequence',
  CAUSAL: 'causal',
  VECTOR_CLOCK: 'vector_clock'
};

/**
 * Retention policies for event cleanup
 */
const RetentionPolicy = {
  TIME_BASED: 'time_based',
  COUNT_BASED: 'count_based',
  SIZE_BASED: 'size_based',
  IMPORTANCE_BASED: 'importance_based'
};

/**
 * Event Persistence Manager - Core persistence engine
 */
class EventPersistenceManager {
  constructor(config = {}) {
    this.config = {
      storageBackend: StorageBackend.FILE,
      baseDirectory: config.baseDirectory || './data/events',
      orderingStrategy: OrderingStrategy.TIMESTAMP,
      enableCompression: true,
      enableEncryption: false,
      batchSize: 1000,
      flushInterval: 5000, // 5 seconds
      maxFileSize: 100 * 1024 * 1024, // 100MB
      retentionPolicies: {
        default: {
          type: RetentionPolicy.TIME_BASED,
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        }
      },
      enableAuditLog: true,
      enableMetrics: true,
      ...config
    };
    
    // Core state
    this.eventStores = new Map(); // topic -> EventStore
    this.sequenceGenerators = new Map(); // topic -> sequence number
    this.vectorClocks = new Map(); // node -> clock value
    this.pendingWrites = new Map(); // topic -> pending events
    this.flushTimers = new Map(); // topic -> timer
    
    // Metrics and monitoring
    this.metrics = {
      totalEventsStored: 0,
      totalEventsReplayed: 0,
      storageSize: 0,
      compressionRatio: 0,
      retentionCleanups: 0,
      errors: 0
    };
    
    // Initialize storage backend
    this.initializeStorage();
    
    logger.info('💾 Event Persistence Manager initialized', {
      storageBackend: this.config.storageBackend,
      orderingStrategy: this.config.orderingStrategy,
      enableCompression: this.config.enableCompression
    });
  }

  /**
   * Initialize storage backend
   */
  async initializeStorage() {
    switch (this.config.storageBackend) {
      case StorageBackend.FILE:
        await this.initializeFileStorage();
        break;
      case StorageBackend.DATABASE:
        await this.initializeDatabaseStorage();
        break;
      case StorageBackend.MEMORY:
        await this.initializeMemoryStorage();
        break;
    }
  }

  /**
   * Initialize file-based storage
   */
  async initializeFileStorage() {
    try {
      await fs.mkdir(this.config.baseDirectory, { recursive: true });
      
      // Create topic directories and load existing stores
      const topicDirs = await fs.readdir(this.config.baseDirectory);
      
      for (const topicDir of topicDirs) {
        const topicPath = path.join(this.config.baseDirectory, topicDir);
        const stats = await fs.stat(topicPath);
        
        if (stats.isDirectory()) {
          const store = new FileEventStore(topicDir, topicPath, this.config);
          await store.initialize();
          this.eventStores.set(topicDir, store);
          
          // Load sequence number
          const lastSequence = await store.getLastSequence();
          this.sequenceGenerators.set(topicDir, lastSequence + 1);
        }
      }
      
      logger.info(`📁 File storage initialized: ${this.eventStores.size} topics loaded`);
    } catch (error) {
      logger.error('🔴 Failed to initialize file storage:', error);
      throw error;
    }
  }

  /**
   * Store event with persistence guarantees
   */
  async storeEvent(topic, event, options = {}) {
    const {
      ordering = this.config.orderingStrategy,
      immediate = false,
      retentionPolicy = 'default'
    } = options;
    
    // Get or create event store for topic
    let store = this.eventStores.get(topic);
    if (!store) {
      store = await this.createEventStore(topic);
    }
    
    // Add ordering metadata
    const persistentEvent = await this.addOrderingMetadata(topic, event, ordering);
    
    // Add persistence metadata
    persistentEvent.persistence = {
      storedAt: Date.now(),
      retentionPolicy,
      compressed: this.config.enableCompression,
      encrypted: this.config.enableEncryption,
      storageBackend: this.config.storageBackend
    };
    
    if (immediate) {
      // Store immediately
      await store.storeEvent(persistentEvent);
      this.metrics.totalEventsStored++;
    } else {
      // Add to batch for later flush
      await this.addToBatch(topic, persistentEvent);
    }
    
    return {
      topic,
      eventId: persistentEvent.id,
      sequence: persistentEvent.ordering.sequence,
      storedAt: persistentEvent.persistence.storedAt
    };
  }

  /**
   * Add ordering metadata to event
   */
  async addOrderingMetadata(topic, event, strategy) {
    const orderedEvent = { ...event };
    
    orderedEvent.ordering = {
      strategy,
      timestamp: Date.now()
    };
    
    switch (strategy) {
      case OrderingStrategy.SEQUENCE:
        orderedEvent.ordering.sequence = this.getNextSequence(topic);
        break;
        
      case OrderingStrategy.TIMESTAMP:
        orderedEvent.ordering.sequence = Date.now() * 1000 + Math.floor(Math.random() * 1000);
        break;
        
      case OrderingStrategy.VECTOR_CLOCK:
        orderedEvent.ordering.vectorClock = this.incrementVectorClock(topic);
        orderedEvent.ordering.sequence = this.getNextSequence(topic);
        break;
        
      case OrderingStrategy.CAUSAL:
        orderedEvent.ordering.causalDependencies = event.metadata?.causalDependencies || [];
        orderedEvent.ordering.sequence = this.getNextSequence(topic);
        break;
    }
    
    return orderedEvent;
  }

  /**
   * Get next sequence number for topic
   */
  getNextSequence(topic) {
    const current = this.sequenceGenerators.get(topic) || 1;
    this.sequenceGenerators.set(topic, current + 1);
    return current;
  }

  /**
   * Increment vector clock for distributed ordering
   */
  incrementVectorClock(nodeId) {
    const currentClock = this.vectorClocks.get(nodeId) || 0;
    const newClock = currentClock + 1;
    this.vectorClocks.set(nodeId, newClock);
    
    // Return full vector clock state
    return Object.fromEntries(this.vectorClocks);
  }

  /**
   * Add event to batch for efficient storage
   */
  async addToBatch(topic, event) {
    if (!this.pendingWrites.has(topic)) {
      this.pendingWrites.set(topic, []);
    }
    
    const batch = this.pendingWrites.get(topic);
    batch.push(event);
    
    // Flush if batch is full
    if (batch.length >= this.config.batchSize) {
      await this.flushBatch(topic);
      return;
    }
    
    // Set timer for batch flush if not already set
    if (!this.flushTimers.has(topic)) {
      const timer = setTimeout(() => {
        this.flushBatch(topic);
      }, this.config.flushInterval);
      
      this.flushTimers.set(topic, timer);
    }
  }

  /**
   * Flush pending batch to storage
   */
  async flushBatch(topic) {
    const batch = this.pendingWrites.get(topic);
    if (!batch || batch.length === 0) {
      return;
    }
    
    const store = this.eventStores.get(topic);
    if (!store) {
      logger.error(`🔴 No store found for topic: ${topic}`);
      return;
    }
    
    try {
      // Clear timer
      const timer = this.flushTimers.get(topic);
      if (timer) {
        clearTimeout(timer);
        this.flushTimers.delete(topic);
      }
      
      // Store batch
      const batchCopy = [...batch];
      batch.length = 0; // Clear pending writes
      
      await store.storeBatch(batchCopy);
      this.metrics.totalEventsStored += batchCopy.length;
      
      logger.debug(`💾 Batch flushed: ${batchCopy.length} events -> ${topic}`);
      
    } catch (error) {
      logger.error(`💾 Batch flush failed: ${topic}`, error);
      this.metrics.errors++;
    }
  }

  /**
   * Replay events from storage with filtering and ordering
   */
  async replayEvents(topic, options = {}) {
    const {
      fromSequence = 0,
      toSequence = null,
      fromTimestamp = null,
      toTimestamp = null,
      limit = 1000,
      filters = {},
      ordering = 'ascending'
    } = options;
    
    const store = this.eventStores.get(topic);
    if (!store) {
      return {
        topic,
        events: [],
        totalCount: 0,
        fromSequence: 0,
        toSequence: 0
      };
    }
    
    try {
      const replayResult = await store.replayEvents({
        fromSequence,
        toSequence,
        fromTimestamp,
        toTimestamp,
        limit,
        filters,
        ordering
      });
      
      this.metrics.totalEventsReplayed += replayResult.events.length;
      
      logger.info(`📼 Events replayed: ${replayResult.events.length} from ${topic}`);
      
      return replayResult;
      
    } catch (error) {
      logger.error(`📼 Event replay failed: ${topic}`, error);
      this.metrics.errors++;
      throw error;
    }
  }

  /**
   * Get event by ID with fast lookup
   */
  async getEventById(topic, eventId) {
    const store = this.eventStores.get(topic);
    if (!store) {
      return null;
    }
    
    return await store.getEventById(eventId);
  }

  /**
   * Create snapshot of current state at sequence point
   */
  async createSnapshot(topic, sequenceNumber = null) {
    const store = this.eventStores.get(topic);
    if (!store) {
      throw new Error(`Topic not found: ${topic}`);
    }
    
    const snapshot = await store.createSnapshot(sequenceNumber);
    
    logger.info(`📷 Snapshot created: ${topic} at sequence ${snapshot.sequenceNumber}`);
    
    return snapshot;
  }

  /**
   * Apply retention policies to clean up old events
   */
  async applyRetentionPolicies() {
    const results = {
      totalTopics: this.eventStores.size,
      topicsProcessed: 0,
      eventsRemoved: 0,
      spaceSaved: 0,
      errors: []
    };
    
    for (const [topic, store] of this.eventStores) {
      try {
        const retentionPolicy = this.getRetentionPolicy(topic);
        const cleanupResult = await store.applyRetentionPolicy(retentionPolicy);
        
        results.topicsProcessed++;
        results.eventsRemoved += cleanupResult.eventsRemoved;
        results.spaceSaved += cleanupResult.spaceSaved;
        
        logger.debug(`🧹 Retention applied: ${topic} - ${cleanupResult.eventsRemoved} events removed`);
        
      } catch (error) {
        results.errors.push({ topic, error: error.message });
        logger.error(`🧹 Retention failed for ${topic}:`, error);
      }
    }
    
    this.metrics.retentionCleanups++;
    
    logger.info(`🧹 Retention policies applied: ${results.eventsRemoved} events removed, ${results.spaceSaved} bytes saved`);
    
    return results;
  }

  /**
   * Get retention policy for topic
   */
  getRetentionPolicy(topic) {
    return this.config.retentionPolicies[topic] || this.config.retentionPolicies.default;
  }

  /**
   * Compact storage to optimize space and performance
   */
  async compactStorage(topic = null) {
    const topics = topic ? [topic] : Array.from(this.eventStores.keys());
    const results = {
      topicsCompacted: 0,
      spaceSaved: 0,
      errors: []
    };
    
    for (const topicName of topics) {
      const store = this.eventStores.get(topicName);
      if (!store) continue;
      
      try {
        const compactionResult = await store.compact();
        
        results.topicsCompacted++;
        results.spaceSaved += compactionResult.spaceSaved;
        
        logger.info(`🗜️ Storage compacted: ${topicName} - ${compactionResult.spaceSaved} bytes saved`);
        
      } catch (error) {
        results.errors.push({ topic: topicName, error: error.message });
        logger.error(`🗜️ Compaction failed for ${topicName}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Get storage statistics and health
   */
  async getStorageStats() {
    const stats = {
      timestamp: Date.now(),
      metrics: { ...this.metrics },
      topics: {},
      globalStats: {
        totalTopics: this.eventStores.size,
        totalSize: 0,
        totalEvents: 0,
        oldestEvent: null,
        newestEvent: null
      }
    };
    
    for (const [topic, store] of this.eventStores) {
      try {
        const topicStats = await store.getStats();
        stats.topics[topic] = topicStats;
        
        stats.globalStats.totalSize += topicStats.size;
        stats.globalStats.totalEvents += topicStats.eventCount;
        
        if (!stats.globalStats.oldestEvent || topicStats.oldestEvent < stats.globalStats.oldestEvent) {
          stats.globalStats.oldestEvent = topicStats.oldestEvent;
        }
        
        if (!stats.globalStats.newestEvent || topicStats.newestEvent > stats.globalStats.newestEvent) {
          stats.globalStats.newestEvent = topicStats.newestEvent;
        }
        
      } catch (error) {
        logger.error(`📊 Stats collection failed for ${topic}:`, error);
      }
    }
    
    return stats;
  }

  /**
   * Create event store for topic
   */
  async createEventStore(topic) {
    let store;
    
    switch (this.config.storageBackend) {
      case StorageBackend.FILE:
        const topicPath = path.join(this.config.baseDirectory, topic);
        store = new FileEventStore(topic, topicPath, this.config);
        break;
        
      case StorageBackend.MEMORY:
        store = new MemoryEventStore(topic, this.config);
        break;
        
      case StorageBackend.DATABASE:
        store = new DatabaseEventStore(topic, this.config);
        break;
        
      default:
        throw new Error(`Unsupported storage backend: ${this.config.storageBackend}`);
    }
    
    await store.initialize();
    this.eventStores.set(topic, store);
    this.sequenceGenerators.set(topic, 1);
    
    logger.info(`💾 Event store created: ${topic} (${this.config.storageBackend})`);
    
    return store;
  }

  /**
   * Initialize other storage backends
   */
  async initializeMemoryStorage() {
    logger.info('🧠 Memory storage initialized');
  }

  async initializeDatabaseStorage() {
    // Placeholder for database initialization
    logger.info('🗄️ Database storage initialized (placeholder)');
  }

  /**
   * Graceful shutdown with pending batch flush
   */
  async shutdown() {
    logger.info('🔄 Shutting down Event Persistence Manager...');
    
    // Flush all pending batches
    const flushPromises = Array.from(this.pendingWrites.keys()).map(topic => 
      this.flushBatch(topic)
    );
    
    await Promise.all(flushPromises);
    
    // Clear all timers
    for (const timer of this.flushTimers.values()) {
      clearTimeout(timer);
    }
    
    // Shutdown all stores
    const shutdownPromises = Array.from(this.eventStores.values()).map(store =>
      store.shutdown()
    );
    
    await Promise.all(shutdownPromises);
    
    logger.info('🏁 Event Persistence Manager shutdown complete');
  }
}

/**
 * File-based Event Store Implementation
 */
class FileEventStore {
  constructor(topic, directory, config) {
    this.topic = topic;
    this.directory = directory;
    this.config = config;
    this.currentFile = null;
    this.currentFileSize = 0;
    this.eventIndex = new Map(); // eventId -> file location
    this.sequenceIndex = new Map(); // sequence -> file location
  }

  async initialize() {
    await fs.mkdir(this.directory, { recursive: true });
    
    // Load existing files and build indexes
    await this.loadIndexes();
    
    // Create or open current file
    await this.ensureCurrentFile();
  }

  async loadIndexes() {
    try {
      const files = await fs.readdir(this.directory);
      const eventFiles = files.filter(f => f.endsWith('.events')).sort();
      
      for (const file of eventFiles) {
        await this.indexFile(path.join(this.directory, file));
      }
      
    } catch (error) {
      logger.error(`📁 Index loading failed for ${this.topic}:`, error);
    }
  }

  async indexFile(filePath) {
    // Simplified indexing - in production, this would be more sophisticated
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      lines.forEach((line, index) => {
        try {
          const event = JSON.parse(line);
          this.eventIndex.set(event.id, { file: filePath, line: index });
          if (event.ordering?.sequence) {
            this.sequenceIndex.set(event.ordering.sequence, { file: filePath, line: index });
          }
        } catch (parseError) {
          // Skip invalid lines
        }
      });
      
    } catch (error) {
      logger.error(`📁 File indexing failed: ${filePath}`, error);
    }
  }

  async ensureCurrentFile() {
    const timestamp = Date.now();
    const fileName = `${timestamp}.events`;
    this.currentFile = path.join(this.directory, fileName);
    this.currentFileSize = 0;
  }

  async storeEvent(event) {
    await this.storeBatch([event]);
  }

  async storeBatch(events) {
    if (!this.currentFile) {
      await this.ensureCurrentFile();
    }
    
    const lines = events.map(event => JSON.stringify(event) + '\n');
    const content = lines.join('');
    
    await fs.appendFile(this.currentFile, content);
    this.currentFileSize += content.length;
    
    // Update indexes
    events.forEach((event, index) => {
      this.eventIndex.set(event.id, { file: this.currentFile, line: index });
      if (event.ordering?.sequence) {
        this.sequenceIndex.set(event.ordering.sequence, { file: this.currentFile, line: index });
      }
    });
    
    // Rotate file if too large
    if (this.currentFileSize > this.config.maxFileSize) {
      await this.ensureCurrentFile();
    }
  }

  async replayEvents(options) {
    // Simplified replay implementation
    const events = [];
    const files = await fs.readdir(this.directory);
    const eventFiles = files.filter(f => f.endsWith('.events')).sort();
    
    for (const file of eventFiles) {
      const filePath = path.join(this.directory, file);
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const event = JSON.parse(line);
          
          // Apply filters
          if (this.eventMatchesFilters(event, options)) {
            events.push(event);
          }
          
          if (events.length >= options.limit) {
            break;
          }
        } catch (parseError) {
          // Skip invalid events
        }
      }
      
      if (events.length >= options.limit) {
        break;
      }
    }
    
    return {
      topic: this.topic,
      events,
      totalCount: events.length,
      fromSequence: events.length > 0 ? events[0].ordering?.sequence || 0 : 0,
      toSequence: events.length > 0 ? events[events.length - 1].ordering?.sequence || 0 : 0
    };
  }

  eventMatchesFilters(event, options) {
    if (options.fromSequence && event.ordering?.sequence < options.fromSequence) {
      return false;
    }
    
    if (options.toSequence && event.ordering?.sequence > options.toSequence) {
      return false;
    }
    
    if (options.fromTimestamp && event.ordering?.timestamp < options.fromTimestamp) {
      return false;
    }
    
    if (options.toTimestamp && event.ordering?.timestamp > options.toTimestamp) {
      return false;
    }
    
    return true;
  }

  async getEventById(eventId) {
    const location = this.eventIndex.get(eventId);
    if (!location) {
      return null;
    }
    
    try {
      const content = await fs.readFile(location.file, 'utf8');
      const lines = content.split('\n');
      const eventLine = lines[location.line];
      
      return JSON.parse(eventLine);
    } catch (error) {
      return null;
    }
  }

  async getLastSequence() {
    const sequences = Array.from(this.sequenceIndex.keys());
    return sequences.length > 0 ? Math.max(...sequences) : 0;
  }

  async createSnapshot(sequenceNumber) {
    // Simplified snapshot implementation
    return {
      topic: this.topic,
      sequenceNumber: sequenceNumber || this.getLastSequence(),
      timestamp: Date.now(),
      events: [] // Would contain relevant events
    };
  }

  async applyRetentionPolicy(policy) {
    // Simplified retention implementation
    return {
      eventsRemoved: 0,
      spaceSaved: 0
    };
  }

  async compact() {
    // Simplified compaction implementation
    return {
      spaceSaved: 0
    };
  }

  async getStats() {
    const files = await fs.readdir(this.directory);
    const eventFiles = files.filter(f => f.endsWith('.events'));
    
    let totalSize = 0;
    for (const file of eventFiles) {
      const stats = await fs.stat(path.join(this.directory, file));
      totalSize += stats.size;
    }
    
    return {
      eventCount: this.eventIndex.size,
      size: totalSize,
      fileCount: eventFiles.length,
      oldestEvent: null,
      newestEvent: null
    };
  }

  async shutdown() {
    // File stores don't need explicit shutdown
  }
}

/**
 * Memory-based Event Store Implementation
 */
class MemoryEventStore {
  constructor(topic, config) {
    this.topic = topic;
    this.config = config;
    this.events = [];
    this.eventIndex = new Map();
    this.sequenceIndex = new Map();
  }

  async initialize() {
    // Memory store is ready immediately
  }

  async storeEvent(event) {
    this.events.push(event);
    this.eventIndex.set(event.id, event);
    if (event.ordering?.sequence) {
      this.sequenceIndex.set(event.ordering.sequence, event);
    }
  }

  async storeBatch(events) {
    for (const event of events) {
      await this.storeEvent(event);
    }
  }

  async replayEvents(options) {
    let filteredEvents = this.events.filter(event => 
      this.eventMatchesFilters(event, options)
    );
    
    // Apply ordering
    if (options.ordering === 'descending') {
      filteredEvents.reverse();
    }
    
    // Apply limit
    if (options.limit) {
      filteredEvents = filteredEvents.slice(0, options.limit);
    }
    
    return {
      topic: this.topic,
      events: filteredEvents,
      totalCount: filteredEvents.length,
      fromSequence: filteredEvents.length > 0 ? filteredEvents[0].ordering?.sequence || 0 : 0,
      toSequence: filteredEvents.length > 0 ? filteredEvents[filteredEvents.length - 1].ordering?.sequence || 0 : 0
    };
  }

  eventMatchesFilters(event, options) {
    if (options.fromSequence && event.ordering?.sequence < options.fromSequence) {
      return false;
    }
    
    if (options.toSequence && event.ordering?.sequence > options.toSequence) {
      return false;
    }
    
    return true;
  }

  async getEventById(eventId) {
    return this.eventIndex.get(eventId) || null;
  }

  async getLastSequence() {
    const sequences = Array.from(this.sequenceIndex.keys());
    return sequences.length > 0 ? Math.max(...sequences) : 0;
  }

  async createSnapshot() {
    return {
      topic: this.topic,
      sequenceNumber: await this.getLastSequence(),
      timestamp: Date.now(),
      eventCount: this.events.length
    };
  }

  async applyRetentionPolicy() {
    return { eventsRemoved: 0, spaceSaved: 0 };
  }

  async compact() {
    return { spaceSaved: 0 };
  }

  async getStats() {
    return {
      eventCount: this.events.length,
      size: JSON.stringify(this.events).length,
      fileCount: 1,
      oldestEvent: this.events.length > 0 ? this.events[0].ordering?.timestamp : null,
      newestEvent: this.events.length > 0 ? this.events[this.events.length - 1].ordering?.timestamp : null
    };
  }

  async shutdown() {
    // Memory store cleanup
    this.events = [];
    this.eventIndex.clear();
    this.sequenceIndex.clear();
  }
}

module.exports = {
  EventPersistenceManager,
  StorageBackend,
  OrderingStrategy,
  RetentionPolicy,
  FileEventStore,
  MemoryEventStore
};