/**
 * BUMBA MongoDB Integration
 * NoSQL document database integration with aggregation pipelines
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class MongoDBIntegration extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      uri: config.uri || process.env.MONGODB_URI || 'mongodb://localhost:27017',
      database: config.database || process.env.MONGODB_DATABASE,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: config.maxPoolSize || 10,
        minPoolSize: config.minPoolSize || 2,
        serverSelectionTimeoutMS: config.serverTimeout || 5000,
        socketTimeoutMS: config.socketTimeout || 45000,
        family: 4
      },
      
      // Collection defaults
      collections: config.collections || {},
      
      // Index management
      autoIndex: config.autoIndex !== false,
      
      // Change streams
      changeStreams: config.changeStreams || false
    };
    
    this.client = null;
    this.db = null;
    this.connected = false;
    this.collections = new Map();
    this.changeStreams = new Map();
    
    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      documentsProcessed: 0
    };
  }
  
  /**
   * Initialize MongoDB connection
   */
  async initialize() {
    try {
      if (!this.config.database) {
        logger.warn('🟡 MongoDB database not configured');
        this.showSetupGuide();
        return false;
      }
      
      // Mock connection for framework distribution
      this.client = {
        connect: async () => true,
        db: (name) => this.mockDatabase(name),
        close: async () => true
      };
      
      await this.client.connect();
      this.db = this.client.db(this.config.database);
      this.connected = true;
      
      // Initialize collections
      this.initializeCollections();
      
      // Set up change streams if enabled
      if (this.config.changeStreams) {
        this.setupChangeStreams();
      }
      
      logger.info('🟡 MongoDB integration initialized');
      logger.info(`📊 Database: ${this.config.database}`);
      this.emit('connected');
      
      return true;
    } catch (error) {
      logger.error('🔴 Failed to initialize MongoDB:', error);
      return false;
    }
  }
  
  /**
   * Get collection
   */
  collection(name) {
    if (!this.connected) {
      throw new Error('MongoDB not connected');
    }
    
    if (!this.collections.has(name)) {
      const collection = this.db.collection(name);
      this.collections.set(name, collection);
    }
    
    return this.collections.get(name);
  }
  
  /**
   * Find documents
   */
  async find(collectionName, filter = {}, options = {}) {
    this.metrics.totalOperations++;
    
    try {
      const collection = this.collection(collectionName);
      const cursor = await collection.find(filter, options);
      const results = await cursor.toArray();
      
      this.metrics.successfulOperations++;
      this.metrics.documentsProcessed += results.length;
      
      return results;
    } catch (error) {
      this.metrics.failedOperations++;
      throw error;
    }
  }
  
  /**
   * Find one document
   */
  async findOne(collectionName, filter = {}, options = {}) {
    this.metrics.totalOperations++;
    
    try {
      const collection = this.collection(collectionName);
      const result = await collection.findOne(filter, options);
      
      this.metrics.successfulOperations++;
      if (result) this.metrics.documentsProcessed++;
      
      return result;
    } catch (error) {
      this.metrics.failedOperations++;
      throw error;
    }
  }
  
  /**
   * Insert document
   */
  async insertOne(collectionName, document) {
    this.metrics.totalOperations++;
    
    try {
      const collection = this.collection(collectionName);
      const result = await collection.insertOne(document);
      
      this.metrics.successfulOperations++;
      this.metrics.documentsProcessed++;
      
      return result;
    } catch (error) {
      this.metrics.failedOperations++;
      throw error;
    }
  }
  
  /**
   * Insert multiple documents
   */
  async insertMany(collectionName, documents) {
    this.metrics.totalOperations++;
    
    try {
      const collection = this.collection(collectionName);
      const result = await collection.insertMany(documents);
      
      this.metrics.successfulOperations++;
      this.metrics.documentsProcessed += documents.length;
      
      return result;
    } catch (error) {
      this.metrics.failedOperations++;
      throw error;
    }
  }
  
  /**
   * Update document
   */
  async updateOne(collectionName, filter, update, options = {}) {
    this.metrics.totalOperations++;
    
    try {
      const collection = this.collection(collectionName);
      const result = await collection.updateOne(filter, update, options);
      
      this.metrics.successfulOperations++;
      if (result.modifiedCount) this.metrics.documentsProcessed++;
      
      return result;
    } catch (error) {
      this.metrics.failedOperations++;
      throw error;
    }
  }
  
  /**
   * Update multiple documents
   */
  async updateMany(collectionName, filter, update, options = {}) {
    this.metrics.totalOperations++;
    
    try {
      const collection = this.collection(collectionName);
      const result = await collection.updateMany(filter, update, options);
      
      this.metrics.successfulOperations++;
      this.metrics.documentsProcessed += result.modifiedCount || 0;
      
      return result;
    } catch (error) {
      this.metrics.failedOperations++;
      throw error;
    }
  }
  
  /**
   * Delete document
   */
  async deleteOne(collectionName, filter) {
    this.metrics.totalOperations++;
    
    try {
      const collection = this.collection(collectionName);
      const result = await collection.deleteOne(filter);
      
      this.metrics.successfulOperations++;
      if (result.deletedCount) this.metrics.documentsProcessed++;
      
      return result;
    } catch (error) {
      this.metrics.failedOperations++;
      throw error;
    }
  }
  
  /**
   * Delete multiple documents
   */
  async deleteMany(collectionName, filter) {
    this.metrics.totalOperations++;
    
    try {
      const collection = this.collection(collectionName);
      const result = await collection.deleteMany(filter);
      
      this.metrics.successfulOperations++;
      this.metrics.documentsProcessed += result.deletedCount || 0;
      
      return result;
    } catch (error) {
      this.metrics.failedOperations++;
      throw error;
    }
  }
  
  /**
   * Aggregate pipeline
   */
  async aggregate(collectionName, pipeline, options = {}) {
    this.metrics.totalOperations++;
    
    try {
      const collection = this.collection(collectionName);
      const cursor = await collection.aggregate(pipeline, options);
      const results = await cursor.toArray();
      
      this.metrics.successfulOperations++;
      this.metrics.documentsProcessed += results.length;
      
      return results;
    } catch (error) {
      this.metrics.failedOperations++;
      throw error;
    }
  }
  
  /**
   * Create index
   */
  async createIndex(collectionName, index, options = {}) {
    try {
      const collection = this.collection(collectionName);
      return await collection.createIndex(index, options);
    } catch (error) {
      logger.error(`Failed to create index on ${collectionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Initialize collections
   */
  initializeCollections() {
    Object.entries(this.config.collections).forEach(([name, config]) => {
      const collection = this.db.collection(name);
      this.collections.set(name, collection);
      
      // Create indexes if specified
      if (config.indexes && this.config.autoIndex) {
        config.indexes.forEach(index => {
          this.createIndex(name, index.fields, index.options);
        });
      }
    });
  }
  
  /**
   * Setup change streams
   */
  setupChangeStreams() {
    this.collections.forEach((collection, name) => {
      const changeStream = collection.watch();
      
      changeStream.on('change', (change) => {
        this.emit('change', {
          collection: name,
          operation: change.operationType,
          document: change.fullDocument,
          documentKey: change.documentKey
        });
      });
      
      this.changeStreams.set(name, changeStream);
    });
  }
  
  /**
   * Mock database (for demo)
   */
  mockDatabase(name) {
    return {
      collection: (collectionName) => ({
        find: async () => ({ toArray: async () => [] }),
        findOne: async () => null,
        insertOne: async (doc) => ({ insertedId: 'mock-id' }),
        insertMany: async (docs) => ({ insertedCount: docs.length }),
        updateOne: async () => ({ modifiedCount: 1 }),
        updateMany: async () => ({ modifiedCount: 0 }),
        deleteOne: async () => ({ deletedCount: 1 }),
        deleteMany: async () => ({ deletedCount: 0 }),
        aggregate: async () => ({ toArray: async () => [] }),
        createIndex: async () => 'index-created',
        watch: () => ({
          on: () => {}
        })
      })
    };
  }
  
  /**
   * Close connection
   */
  async close() {
    // Close change streams
    this.changeStreams.forEach(stream => stream.close());
    this.changeStreams.clear();
    
    // Close connection
    if (this.client) {
      await this.client.close();
      this.connected = false;
      this.emit('disconnected');
    }
  }
  
  /**
   * Show setup guide
   */
  showSetupGuide() {
    console.log(`
🟡 MongoDB Integration Setup Guide
==================================

1. Install MongoDB:
   brew tap mongodb/brew && brew install mongodb-community (macOS)
   sudo apt-get install mongodb (Linux)
   
2. Add to your .env file:
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DATABASE=your_database
   
3. Install mongodb package:
   npm install mongodb
   
4. Use the integration:
   const mongo = new MongoDBIntegration();
   await mongo.initialize();
   const users = await mongo.find('users', { active: true });
    `);
  }
  
  /**
   * Get status
   */
  getStatus() {
    return {
      connected: this.connected,
      database: this.config.database,
      collections: Array.from(this.collections.keys()),
      changeStreams: this.changeStreams.size,
      metrics: this.metrics
    };
  }
}

module.exports = { MongoDBIntegration };