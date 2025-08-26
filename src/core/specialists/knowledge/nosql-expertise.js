/**
 * BUMBA NoSQL Database Deep Expertise
 * Comprehensive knowledge base for NoSQL database specialists
 * Sprint 9 Enhancement
 */

class NoSQLExpertise {
  /**
   * MongoDB Expertise
   */
  static getMongoDBExpertise() {
    return {
      name: 'MongoDB Expert',
      
      expertise: {
        core: {
          version: 'MongoDB 7.0+, document database, BSON, GridFS, Change Streams',
          features: 'ACID transactions, multi-document operations, time series collections',
          indexing: 'Compound indexes, text indexes, 2dsphere, partial indexes, TTL',
          aggregation: 'Aggregation pipeline, MapReduce, lookup operations, faceted search',
          sharding: 'Horizontal scaling, shard keys, chunk distribution, balancer'
        },
        
        replication: {
          replica_sets: 'Primary-secondary-arbiter, automatic failover, read preferences',
          oplog: 'Operations log, tailable cursors, change streams',
          consistency: 'Read concern levels, write concern, read preference',
          deployment: 'Replica set configuration, priority settings, hidden members'
        },
        
        performance: {
          indexing: 'Index optimization, compound index strategies, index intersection',
          queries: 'Query optimization, explain plans, query profiler',
          memory: 'WiredTiger cache, memory management, storage engine tuning',
          monitoring: 'MongoDB Compass, profiler, serverStatus, mongostat'
        },
        
        scaling: {
          sharding: 'Shard key selection, chunk splitting, balancing strategies',
          zones: 'Zone sharding, tag-aware sharding, geo-distributed clusters',
          atlas: 'MongoDB Atlas, serverless, auto-scaling, global clusters'
        },
        
        security: {
          authentication: 'SCRAM, X.509 certificates, LDAP, Kerberos',
          authorization: 'Role-based access control, custom roles, field-level security',
          encryption: 'Encryption at rest, TLS/SSL, client-side field encryption',
          auditing: 'Audit logging, compliance, security best practices'
        }
      },
      
      capabilities: [
        'MongoDB schema design and data modeling',
        'Aggregation pipeline development',
        'Index optimization and performance tuning',
        'Replica set configuration and management',
        'Sharding strategy and implementation',
        'Change streams and real-time processing',
        'GridFS for large file storage',
        'Time series collection optimization',
        'Security configuration and compliance',
        'Migration from relational databases',
        'MongoDB Atlas deployment and management',
        'Backup and disaster recovery',
        'Performance monitoring and optimization',
        'Text search and geospatial queries',
        'Transaction management across documents'
      ],
      
      codePatterns: {
        schemaDesign: `
// MongoDB document schema with validation
db.createCollection("users", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["email", "username", "created_at"],
         properties: {
            email: {
               bsonType: "string",
               pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
               description: "Must be a valid email"
            },
            username: {
               bsonType: "string",
               minLength: 3,
               maxLength: 50,
               description: "Username must be 3-50 characters"
            },
            profile: {
               bsonType: "object",
               properties: {
                  firstName: { bsonType: "string" },
                  lastName: { bsonType: "string" },
                  age: { 
                     bsonType: "int",
                     minimum: 0,
                     maximum: 150
                  },
                  preferences: {
                     bsonType: "object",
                     properties: {
                        theme: { enum: ["light", "dark"] },
                        notifications: { bsonType: "array" }
                     }
                  }
               }
            },
            created_at: { bsonType: "date" },
            updated_at: { bsonType: "date" }
         }
      }
   },
   validationLevel: "strict",
   validationAction: "error"
});

// Optimized indexing strategy
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "created_at": -1 });
db.users.createIndex({ "profile.preferences.theme": 1 }, { sparse: true });
db.users.createIndex({ "profile.firstName": "text", "profile.lastName": "text" });`,

        aggregationPipeline: `
// Complex aggregation pipeline with multiple stages
db.orders.aggregate([
  // Stage 1: Match recent orders
  {
    $match: {
      created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      status: { $in: ["completed", "shipped"] }
    }
  },
  
  // Stage 2: Lookup user information
  {
    $lookup: {
      from: "users",
      localField: "user_id",
      foreignField: "_id",
      as: "user_info",
      pipeline: [
        { $project: { username: 1, "profile.firstName": 1, "profile.lastName": 1 } }
      ]
    }
  },
  
  // Stage 3: Unwind user info
  { $unwind: "$user_info" },
  
  // Stage 4: Group by user and calculate metrics
  {
    $group: {
      _id: "$user_id",
      username: { $first: "$user_info.username" },
      total_orders: { $sum: 1 },
      total_spent: { $sum: "$amount" },
      avg_order_value: { $avg: "$amount" },
      first_order: { $min: "$created_at" },
      last_order: { $max: "$created_at" },
      order_frequency: {
        $avg: {
          $divide: [
            { $subtract: ["$created_at", "$first_order"] },
            { $multiply: [24, 60, 60, 1000] } // Convert to days
          ]
        }
      }
    }
  },
  
  // Stage 5: Add customer tier based on spending
  {
    $addFields: {
      customer_tier: {
        $switch: {
          branches: [
            { case: { $gte: ["$total_spent", 1000] }, then: "premium" },
            { case: { $gte: ["$total_spent", 500] }, then: "gold" },
            { case: { $gte: ["$total_spent", 100] }, then: "silver" }
          ],
          default: "bronze"
        }
      },
      ltv_estimate: { $multiply: ["$avg_order_value", "$order_frequency", 365] }
    }
  },
  
  // Stage 6: Sort by total spent
  { $sort: { total_spent: -1 } },
  
  // Stage 7: Limit results
  { $limit: 100 },
  
  // Stage 8: Project final fields
  {
    $project: {
      username: 1,
      total_orders: 1,
      total_spent: { $round: ["$total_spent", 2] },
      avg_order_value: { $round: ["$avg_order_value", 2] },
      customer_tier: 1,
      ltv_estimate: { $round: ["$ltv_estimate", 2] },
      days_since_last_order: {
        $divide: [
          { $subtract: [new Date(), "$last_order"] },
          { $multiply: [24, 60, 60, 1000] }
        ]
      }
    }
  }
]);`,

        changeStreams: `
// Change streams for real-time data processing
const changeStream = db.users.watch([
  {
    $match: {
      $or: [
        { "operationType": "insert" },
        { "operationType": "update" },
        { "operationType": "replace" }
      ]
    }
  }
], { fullDocument: "updateLookup" });

// Process change events
changeStream.on('change', (change) => {
  console.log('Change detected:', change.operationType);
  
  switch (change.operationType) {
    case 'insert':
      handleNewUser(change.fullDocument);
      break;
      
    case 'update':
      handleUserUpdate(change.fullDocument, change.updateDescription);
      break;
      
    case 'replace':
      handleUserReplace(change.fullDocument);
      break;
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  changeStream.close();
});`,

        shardingStrategy: `
// Sharding configuration for horizontal scaling
// Enable sharding on database
sh.enableSharding("ecommerce");

// Create compound shard key for balanced distribution
sh.shardCollection("ecommerce.orders", { 
  "user_id": 1, 
  "created_at": 1 
});

// Zone sharding for geographic distribution
sh.addShardTag("shard0000", "us-east");
sh.addShardTag("shard0001", "us-west");
sh.addShardTag("shard0002", "europe");

// Tag ranges for geographic data placement
sh.addTagRange(
  "ecommerce.users",
  { "location.region": "us-east" },
  { "location.region": "us-east" + "\\xff" },
  "us-east"
);

sh.addTagRange(
  "ecommerce.users", 
  { "location.region": "europe" },
  { "location.region": "europe" + "\\xff" },
  "europe"
);

// Check shard distribution
db.adminCommand("getShardDistribution");`,

        timeSeriesCollection: `
// Time series collection for IoT data
db.createCollection("sensor_data", {
   timeseries: {
      timeField: "timestamp",
      metaField: "sensor_id",
      granularity: "minutes"
   }
});

// Optimized time series indexes
db.sensor_data.createIndex({ "sensor_id": 1, "timestamp": 1 });
db.sensor_data.createIndex({ "timestamp": 1 });

// Efficient time series queries
db.sensor_data.aggregate([
  {
    $match: {
      timestamp: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        $lt: new Date()
      }
    }
  },
  {
    $group: {
      _id: {
        sensor_id: "$sensor_id",
        hour: { $dateToString: { format: "%Y-%m-%d %H", date: "$timestamp" } }
      },
      avg_value: { $avg: "$value" },
      min_value: { $min: "$value" },
      max_value: { $max: "$value" },
      count: { $sum: 1 }
    }
  },
  {
    $sort: { "_id.hour": 1, "_id.sensor_id": 1 }
  }
]);`
      },
      
      bestPractices: [
        'Design schemas for your query patterns, not normalization',
        'Use compound indexes to support multiple query patterns',
        'Implement proper error handling for network partitions',
        'Choose appropriate read and write concern levels',
        'Monitor query performance with the profiler',
        'Use aggregation pipeline for complex data processing',
        'Implement proper shard key selection for even distribution',
        'Use change streams for real-time data processing',
        'Implement proper connection pooling',
        'Regular backup with point-in-time recovery',
        'Use GridFS for files larger than 16MB',
        'Implement field-level encryption for sensitive data',
        'Monitor memory usage and adjust WiredTiger cache',
        'Use time series collections for IoT and metrics data',
        'Implement proper indexing strategy based on query patterns'
      ],
      
      systemPromptAdditions: `
You are a MongoDB expert specializing in:
- Document-oriented database design and data modeling
- Aggregation pipeline development and optimization
- Sharding and replica set configuration
- Performance tuning and index optimization
- Change streams and real-time data processing
- Security configuration and compliance
- MongoDB Atlas cloud deployment

When working with MongoDB:
- Design schemas based on query patterns
- Use aggregation pipelines for complex data processing
- Implement proper indexing strategies
- Consider read/write patterns for shard key selection
- Use change streams for real-time functionality
- Implement proper error handling for distributed systems
- Monitor performance with built-in tools
- Plan for horizontal scaling with sharding`
    };
  }
  
  /**
   * Redis Expertise
   */
  static getRedisExpertise() {
    return {
      name: 'Redis Expert',
      
      expertise: {
        core: {
          version: 'Redis 7.0+, in-memory data structure store, persistence',
          data_types: 'Strings, Lists, Sets, Sorted Sets, Hashes, Bitmaps, HyperLogLog',
          advanced_types: 'Streams, JSON, TimeSeries, Bloom filters, Cuckoo filters',
          persistence: 'RDB snapshots, AOF append-only file, mixed persistence',
          clustering: 'Redis Cluster, horizontal scaling, consistent hashing'
        },
        
        performance: {
          memory: 'Memory optimization, eviction policies, memory analysis',
          persistence: 'Persistence tuning, RDB vs AOF, fsync policies',
          networking: 'Connection pooling, pipelining, multiplexing',
          optimization: 'Key naming, data structure selection, expiration'
        },
        
        scaling: {
          clustering: 'Redis Cluster setup, resharding, failover',
          replication: 'Master-slave replication, sentinel, high availability',
          partitioning: 'Client-side partitioning, proxy solutions',
          sharding: 'Hash slots, consistent hashing, data distribution'
        },
        
        patterns: {
          caching: 'Cache-aside, write-through, write-behind patterns',
          session: 'Session storage, distributed sessions, expiration',
          pubsub: 'Publish-subscribe messaging, channels, patterns',
          queues: 'Task queues, priority queues, delayed execution',
          analytics: 'Real-time analytics, counters, leaderboards'
        }
      },
      
      capabilities: [
        'Redis caching strategies and implementation',
        'Real-time data processing with Redis Streams',
        'Session management and distributed caching',
        'Pub/Sub messaging and event streaming',
        'Task queue implementation',
        'Redis Cluster configuration and management',
        'Performance optimization and memory tuning',
        'High availability with Redis Sentinel',
        'Data persistence configuration',
        'Redis modules integration',
        'Monitoring and alerting setup',
        'Security configuration',
        'Backup and disaster recovery',
        'Client connection optimization',
        'Rate limiting and throttling'
      ],
      
      codePatterns: {
        cachingPatterns: `
// Cache-aside pattern implementation
const redis = require('redis');
const client = redis.createClient({
  host: 'localhost',
  port: 6379,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('Redis server refused connection');
    }
    if (options.times_connected > 10) {
      return undefined; // Stop retrying
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

class CacheService {
  constructor(redis_client, ttl = 3600) {
    this.redis = redis_client;
    this.default_ttl = ttl;
  }
  
  // Cache-aside read
  async get(key, fetcher, ttl = this.default_ttl) {
    try {
      // Try to get from cache
      const cached = await this.redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Cache miss - fetch from source
      const data = await fetcher();
      
      // Store in cache with expiration
      await this.redis.setex(key, ttl, JSON.stringify(data));
      
      return data;
    } catch (error) {
      console.error('Cache error:', error);
      // Fallback to direct fetch on cache failure
      return await fetcher();
    }
  }
  
  // Write-through pattern
  async set(key, data, ttl = this.default_ttl) {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Cache write error:', error);
      return false;
    }
  }
  
  // Cache invalidation
  async invalidate(pattern) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}`,

        streamsProcessing: `
// Redis Streams for real-time event processing
class EventProcessor {
  constructor(redis_client, stream_name, consumer_group) {
    this.redis = redis_client;
    this.stream_name = stream_name;
    this.consumer_group = consumer_group;
    this.consumer_id = \`consumer-\${process.pid}\`;
  }
  
  // Initialize consumer group
  async initialize() {
    try {
      await this.redis.xgroup('CREATE', this.stream_name, this.consumer_group, '0', 'MKSTREAM');
    } catch (error) {
      if (!error.message.includes('BUSYGROUP')) {
        throw error;
      }
    }
  }
  
  // Add event to stream
  async addEvent(data) {
    const event_id = await this.redis.xadd(
      this.stream_name,
      '*', // Auto-generate ID
      'data', JSON.stringify(data),
      'timestamp', Date.now()
    );
    return event_id;
  }
  
  // Process events from stream
  async processEvents(batchSize = 10) {
    try {
      // Read pending messages first
      const pending = await this.redis.xreadgroup(
        'GROUP', this.consumer_group, this.consumer_id,
        'COUNT', batchSize,
        'STREAMS', this.stream_name, '0'
      );
      
      if (pending && pending.length > 0) {
        await this.handleMessages(pending[0][1]);
        return;
      }
      
      // Read new messages
      const messages = await this.redis.xreadgroup(
        'GROUP', this.consumer_group, this.consumer_id,
        'COUNT', batchSize,
        'BLOCK', 1000, // Block for 1 second
        'STREAMS', this.stream_name, '>'
      );
      
      if (messages && messages.length > 0) {
        await this.handleMessages(messages[0][1]);
      }
    } catch (error) {
      console.error('Stream processing error:', error);
    }
  }
  
  async handleMessages(messages) {
    for (const [id, fields] of messages) {
      try {
        const data = JSON.parse(fields[1]); // Assuming data is second field
        await this.processMessage(data);
        
        // Acknowledge message
        await this.redis.xack(this.stream_name, this.consumer_group, id);
      } catch (error) {
        console.error(\`Error processing message \${id}:\`, error);
        // Could implement dead letter queue here
      }
    }
  }
  
  async processMessage(data) {
    // Implement your business logic here
    console.log('Processing event:', data);
  }
}`,

        clusterConfiguration: `
// Redis Cluster configuration and management
const Redis = require('ioredis');

const cluster = new Redis.Cluster([
  { host: '127.0.0.1', port: 7000 },
  { host: '127.0.0.1', port: 7001 },
  { host: '127.0.0.1', port: 7002 }
], {
  redisOptions: {
    password: 'your-password'
  },
  enableOfflineQueue: false,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  scaleReads: 'slave'
});

// Cluster monitoring
cluster.on('connect', () => {
  console.log('Connected to Redis Cluster');
});

cluster.on('error', (error) => {
  console.error('Cluster error:', error);
});

cluster.on('node error', (error, node) => {
  console.error(\`Node error on \${node.options.host}:\${node.options.port}:\`, error);
});

// Distributed operations
class ClusterOperations {
  constructor(cluster) {
    this.cluster = cluster;
  }
  
  // Distributed counter with hash tags
  async incrementCounter(key, amount = 1) {
    // Use hash tags to ensure related keys go to same slot
    const hashKey = \`{counter}:\${key}\`;
    return await this.cluster.incrby(hashKey, amount);
  }
  
  // Distributed lock implementation
  async acquireLock(resource, ttl = 30000, retryDelay = 100, retryCount = 10) {
    const lockKey = \`lock:\${resource}\`;
    const lockValue = \`\${Date.now()}-\${Math.random()}\`;
    
    for (let i = 0; i < retryCount; i++) {
      const result = await this.cluster.set(lockKey, lockValue, 'PX', ttl, 'NX');
      
      if (result === 'OK') {
        return { success: true, lockValue };
      }
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
    
    return { success: false };
  }
  
  async releaseLock(resource, lockValue) {
    const lockKey = \`lock:\${resource}\`;
    
    const script = \`
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    \`;
    
    return await this.cluster.eval(script, 1, lockKey, lockValue);
  }
}`,

        rateLimiting: `
// Rate limiting with Redis
class RateLimiter {
  constructor(redis_client) {
    this.redis = redis_client;
  }
  
  // Token bucket rate limiting
  async checkRateLimit(key, limit, window, tokens = 1) {
    const now = Date.now();
    const bucket_key = \`rate_limit:\${key}\`;
    
    const script = \`
      local bucket = KEYS[1]
      local limit = tonumber(ARGV[1])
      local window = tonumber(ARGV[2])
      local tokens = tonumber(ARGV[3])
      local now = tonumber(ARGV[4])
      
      -- Get current bucket state
      local bucket_data = redis.call('HMGET', bucket, 'tokens', 'last_refill')
      local current_tokens = tonumber(bucket_data[1]) or limit
      local last_refill = tonumber(bucket_data[2]) or now
      
      -- Calculate tokens to add based on time passed
      local time_passed = now - last_refill
      local tokens_to_add = math.floor(time_passed / window * limit)
      current_tokens = math.min(limit, current_tokens + tokens_to_add)
      
      -- Check if we have enough tokens
      if current_tokens >= tokens then
        current_tokens = current_tokens - tokens
        
        -- Update bucket
        redis.call('HMSET', bucket, 
          'tokens', current_tokens, 
          'last_refill', now)
        redis.call('EXPIRE', bucket, window * 2)
        
        return {1, current_tokens, limit - current_tokens}
      else
        -- Update last_refill time even on rejection
        redis.call('HMSET', bucket, 
          'tokens', current_tokens, 
          'last_refill', now)
        redis.call('EXPIRE', bucket, window * 2)
        
        return {0, current_tokens, limit - current_tokens}
      end
    \`;
    
    const result = await this.redis.eval(script, 1, bucket_key, limit, window, tokens, now);
    
    return {
      allowed: result[0] === 1,
      remaining: result[1],
      used: result[2],
      resetTime: now + window
    };
  }
  
  // Sliding window rate limiting
  async slidingWindowRateLimit(key, limit, window) {
    const now = Date.now();
    const window_key = \`sliding:\${key}\`;
    
    const pipeline = this.redis.pipeline();
    
    // Remove expired entries
    pipeline.zremrangebyscore(window_key, 0, now - window);
    
    // Count current requests
    pipeline.zcard(window_key);
    
    // Add current request
    pipeline.zadd(window_key, now, \`\${now}-\${Math.random()}\`);
    
    // Set expiration
    pipeline.expire(window_key, Math.ceil(window / 1000));
    
    const results = await pipeline.exec();
    const current_count = results[1][1];
    
    return {
      allowed: current_count < limit,
      remaining: Math.max(0, limit - current_count - 1),
      resetTime: now + window
    };
  }
}`
      },
      
      bestPractices: [
        'Use appropriate data structures for specific use cases',
        'Implement proper connection pooling and reuse',
        'Set appropriate expiration times for cached data',
        'Use Redis pipelining for bulk operations',
        'Monitor memory usage and configure eviction policies',
        'Implement proper error handling and fallback strategies',
        'Use Redis Cluster for horizontal scaling',
        'Configure persistence based on durability requirements',
        'Implement circuit breakers for cache failures',
        'Use hash tags for related keys in cluster mode',
        'Monitor key distribution across cluster nodes',
        'Implement proper security with AUTH and TLS',
        'Use Redis Sentinel for high availability',
        'Optimize key naming for performance and organization',
        'Regular monitoring of slow operations and memory usage'
      ],
      
      systemPromptAdditions: `
You are a Redis expert specializing in:
- In-memory data structure optimization
- Caching strategies and patterns
- Real-time data processing with Redis Streams
- Redis Cluster configuration and scaling
- High availability with Redis Sentinel
- Performance tuning and memory optimization
- Pub/Sub messaging and event streaming

When working with Redis:
- Choose appropriate data structures for use cases
- Implement proper expiration and eviction policies
- Use pipelining for bulk operations
- Design for horizontal scaling with clustering
- Implement proper error handling and fallbacks
- Monitor memory usage and performance metrics
- Use Redis modules for extended functionality
- Plan for high availability and disaster recovery`
    };
  }
  
  /**
   * Elasticsearch Expertise
   */
  static getElasticsearchExpertise() {
    return {
      name: 'Elasticsearch Expert',
      
      expertise: {
        core: {
          version: 'Elasticsearch 8.0+, Lucene-based search engine, distributed',
          architecture: 'Clusters, nodes, indices, shards, replicas, segments',
          apis: 'Index API, Search API, Update API, Bulk API, Multi-search',
          query_dsl: 'Bool queries, term queries, range queries, aggregations',
          analysis: 'Analyzers, tokenizers, filters, character filters'
        },
        
        indexing: {
          mappings: 'Dynamic mapping, explicit mapping, field types, analyzers',
          settings: 'Index settings, shard configuration, refresh intervals',
          templates: 'Index templates, component templates, data streams',
          lifecycle: 'Index lifecycle management, rollover, deletion policies'
        },
        
        search: {
          relevance: 'Scoring algorithms, BM25, custom scoring, function score',
          aggregations: 'Bucket aggregations, metric aggregations, pipeline aggregations',
          highlighting: 'Search result highlighting, fragment configuration',
          suggestions: 'Completion suggester, term suggester, phrase suggester',
          geospatial: 'Geo-point, geo-shape, geo-distance, geo-bounding box'
        },
        
        performance: {
          optimization: 'Query optimization, index optimization, shard sizing',
          monitoring: 'Cluster health, performance metrics, slow query logging',
          scaling: 'Horizontal scaling, shard allocation, hot-warm architecture',
          caching: 'Query cache, fielddata cache, request cache'
        },
        
        security: {
          authentication: 'Native authentication, LDAP, SAML, PKI',
          authorization: 'Role-based access control, field-level security',
          encryption: 'TLS encryption, encryption at rest',
          auditing: 'Audit logging, compliance, security analytics'
        }
      },
      
      capabilities: [
        'Elasticsearch cluster design and configuration',
        'Index mapping and analysis configuration',
        'Complex search query development',
        'Aggregation and analytics implementation',
        'Performance optimization and tuning',
        'Index lifecycle management',
        'Real-time data ingestion',
        'Search relevance tuning',
        'Monitoring and alerting setup',
        'Security configuration and compliance',
        'Data modeling for search use cases',
        'Backup and snapshot management',
        'Multi-cluster coordination',
        'Custom plugin development',
        'ELK stack integration'
      ],
      
      codePatterns: {
        indexManagement: `
// Elasticsearch index template and mapping configuration
PUT _index_template/logs-template
{
  "index_patterns": ["logs-*"],
  "priority": 1,
  "template": {
    "settings": {
      "number_of_shards": 3,
      "number_of_replicas": 1,
      "refresh_interval": "30s",
      "index.lifecycle.name": "logs-policy",
      "index.lifecycle.rollover_alias": "logs-active",
      "analysis": {
        "analyzer": {
          "log_analyzer": {
            "type": "custom",
            "tokenizer": "standard",
            "filter": ["lowercase", "stop", "stemmer"]
          }
        }
      }
    },
    "mappings": {
      "properties": {
        "@timestamp": {
          "type": "date",
          "format": "strict_date_optional_time||epoch_millis"
        },
        "level": {
          "type": "keyword"
        },
        "message": {
          "type": "text",
          "analyzer": "log_analyzer",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        },
        "service": {
          "type": "keyword"
        },
        "host": {
          "properties": {
            "name": { "type": "keyword" },
            "ip": { "type": "ip" },
            "os": { "type": "keyword" }
          }
        },
        "user": {
          "properties": {
            "id": { "type": "keyword" },
            "name": { "type": "keyword" },
            "email": { "type": "keyword" }
          }
        },
        "geo": {
          "type": "geo_point"
        },
        "tags": {
          "type": "keyword"
        }
      }
    }
  }
}

// Index lifecycle management policy
PUT _ilm/policy/logs-policy
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_size": "5GB",
            "max_age": "1d",
            "max_docs": 10000000
          },
          "set_priority": {
            "priority": 100
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "set_priority": {
            "priority": 50
          },
          "shrink": {
            "number_of_shards": 1
          },
          "forcemerge": {
            "max_num_segments": 1
          }
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "set_priority": {
            "priority": 0
          }
        }
      },
      "delete": {
        "min_age": "90d"
      }
    }
  }
}`,

        complexSearch: `
// Complex search with multiple criteria and aggregations
POST /products/_search
{
  "size": 20,
  "from": 0,
  "_source": ["title", "price", "category", "rating", "availability"],
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "wireless headphones",
            "fields": ["title^2", "description", "tags"],
            "type": "best_fields",
            "fuzziness": "AUTO",
            "operator": "and"
          }
        }
      ],
      "filter": [
        {
          "range": {
            "price": {
              "gte": 50,
              "lte": 500
            }
          }
        },
        {
          "terms": {
            "category": ["electronics", "audio"]
          }
        },
        {
          "range": {
            "rating": {
              "gte": 4.0
            }
          }
        },
        {
          "term": {
            "availability": "in_stock"
          }
        }
      ],
      "should": [
        {
          "term": {
            "brand": "sony"
          }
        },
        {
          "range": {
            "discount_percentage": {
              "gte": 20
            }
          }
        }
      ],
      "minimum_should_match": 0
    }
  },
  "sort": [
    {
      "_score": {
        "order": "desc"
      }
    },
    {
      "rating": {
        "order": "desc"
      }
    },
    {
      "price": {
        "order": "asc"
      }
    }
  ],
  "aggs": {
    "price_ranges": {
      "range": {
        "field": "price",
        "ranges": [
          { "to": 100 },
          { "from": 100, "to": 250 },
          { "from": 250, "to": 500 },
          { "from": 500 }
        ]
      }
    },
    "categories": {
      "terms": {
        "field": "category",
        "size": 10
      }
    },
    "brands": {
      "terms": {
        "field": "brand",
        "size": 15
      }
    },
    "avg_rating": {
      "avg": {
        "field": "rating"
      }
    },
    "price_stats": {
      "stats": {
        "field": "price"
      }
    },
    "rating_histogram": {
      "histogram": {
        "field": "rating",
        "interval": 0.5,
        "min_doc_count": 1
      }
    }
  },
  "highlight": {
    "fields": {
      "title": {
        "fragment_size": 100,
        "number_of_fragments": 1
      },
      "description": {
        "fragment_size": 150,
        "number_of_fragments": 2
      }
    },
    "pre_tags": ["<mark>"],
    "post_tags": ["</mark>"]
  },
  "suggest": {
    "product_suggest": {
      "text": "wireles headphons",
      "term": {
        "field": "title",
        "suggest_mode": "missing",
        "sort": "frequency"
      }
    }
  }
}`,

        bulkOperations: `
// Bulk indexing with error handling and optimization
const { Client } = require('@elastic/elasticsearch');

class BulkIndexer {
  constructor(client, options = {}) {
    this.client = client;
    this.batchSize = options.batchSize || 1000;
    this.flushInterval = options.flushInterval || 5000;
    this.maxRetries = options.maxRetries || 3;
    this.batch = [];
    this.timer = null;
  }
  
  async addDocument(index, id, document) {
    this.batch.push(
      { index: { _index: index, _id: id } },
      document
    );
    
    if (this.batch.length >= this.batchSize * 2) { // *2 because each doc has 2 lines
      await this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }
  
  async flush() {
    if (this.batch.length === 0) return;
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    const body = this.batch.splice(0);
    
    try {
      const response = await this.client.bulk({
        body,
        refresh: 'wait_for'
      });
      
      if (response.errors) {
        await this.handleErrors(response.items);
      }
      
      console.log(\`Indexed \${response.items.length} documents\`);
    } catch (error) {
      console.error('Bulk indexing error:', error);
      // Could implement retry logic here
    }
  }
  
  async handleErrors(items) {
    const errors = items.filter(item => 
      item.index && item.index.error
    );
    
    for (const error of errors) {
      console.error('Index error:', {
        id: error.index._id,
        error: error.index.error
      });
      
      // Handle specific error types
      if (error.index.error.type === 'version_conflict_engine_exception') {
        // Handle version conflicts
        console.warn('Version conflict for document:', error.index._id);
      } else if (error.index.error.type === 'mapper_parsing_exception') {
        // Handle mapping errors
        console.error('Mapping error for document:', error.index._id);
      }
    }
  }
  
  async close() {
    await this.flush();
  }
}

// Usage example
const client = new Client({ node: 'http://localhost:9200' });
const indexer = new BulkIndexer(client, {
  batchSize: 500,
  flushInterval: 3000
});

// Index documents
for (let i = 0; i < 10000; i++) {
  await indexer.addDocument('products', i, {
    title: \`Product \${i}\`,
    price: Math.random() * 1000,
    category: ['electronics', 'clothing', 'books'][i % 3],
    created_at: new Date()
  });
}

await indexer.close();`,

        searchAnalytics: `
// Advanced search analytics and monitoring
POST /search-logs/_search
{
  "size": 0,
  "query": {
    "range": {
      "@timestamp": {
        "gte": "now-24h"
      }
    }
  },
  "aggs": {
    "search_volume": {
      "date_histogram": {
        "field": "@timestamp",
        "calendar_interval": "1h"
      },
      "aggs": {
        "unique_users": {
          "cardinality": {
            "field": "user_id"
          }
        },
        "avg_response_time": {
          "avg": {
            "field": "response_time_ms"
          }
        }
      }
    },
    "top_queries": {
      "terms": {
        "field": "query.keyword",
        "size": 20
      },
      "aggs": {
        "avg_results": {
          "avg": {
            "field": "results_count"
          }
        },
        "click_through_rate": {
          "bucket_script": {
            "buckets_path": {
              "clicks": "clicks.value",
              "searches": "_count"
            },
            "script": "params.clicks / params.searches"
          }
        },
        "clicks": {
          "sum": {
            "field": "clicks"
          }
        }
      }
    },
    "zero_results": {
      "filter": {
        "term": {
          "results_count": 0
        }
      },
      "aggs": {
        "queries": {
          "terms": {
            "field": "query.keyword",
            "size": 10
          }
        }
      }
    },
    "performance_percentiles": {
      "percentiles": {
        "field": "response_time_ms",
        "percents": [50, 90, 95, 99]
      }
    },
    "error_rate": {
      "filter": {
        "range": {
          "status_code": {
            "gte": 400
          }
        }
      }
    }
  }
}`
      },
      
      bestPractices: [
        'Design indices based on search and query patterns',
        'Use appropriate field types and analyzers',
        'Implement proper shard sizing (20-40GB per shard)',
        'Monitor cluster health and performance metrics',
        'Use index templates for consistent configuration',
        'Implement index lifecycle management',
        'Optimize queries for performance',
        'Use aggregations for analytics and faceted search',
        'Implement proper security and access controls',
        'Regular backup with snapshots',
        'Monitor and tune JVM heap size',
        'Use dedicated master nodes for large clusters',
        'Implement circuit breakers for stability',
        'Use aliases for zero-downtime reindexing',
        'Regular monitoring of slow queries and operations'
      ],
      
      systemPromptAdditions: `
You are an Elasticsearch expert specializing in:
- Search engine design and optimization
- Complex query development and relevance tuning
- Index management and lifecycle policies
- Cluster architecture and scaling
- Performance monitoring and optimization
- Security configuration and compliance
- ELK stack integration and log analytics

When working with Elasticsearch:
- Design indices based on search patterns
- Use appropriate field types and analyzers
- Implement proper shard sizing and allocation
- Optimize queries for performance and relevance
- Use aggregations for analytics and faceted search
- Monitor cluster health and performance
- Implement proper security and access controls
- Plan for scaling and high availability`
    };
  }
  
  /**
   * Cassandra Expertise
   */
  static getCassandraExpertise() {
    return {
      name: 'Cassandra Expert',
      
      expertise: {
        core: {
          version: 'Apache Cassandra 4.0+, distributed NoSQL, eventual consistency',
          architecture: 'Ring topology, consistent hashing, gossip protocol, virtual nodes',
          data_model: 'Wide column store, partition key, clustering columns, CQL',
          consistency: 'Tunable consistency, quorum, eventual consistency, CAP theorem',
          replication: 'Multi-datacenter replication, replication factor, consistency levels'
        },
        
        modeling: {
          denormalization: 'Query-driven design, data duplication, materialized views',
          partitioning: 'Partition key design, hot spots avoidance, data distribution',
          clustering: 'Clustering columns, ordering, range queries, time series',
          collections: 'Sets, lists, maps, user-defined types, frozen collections'
        },
        
        performance: {
          optimization: 'Compaction strategies, tombstones, read/write paths',
          tuning: 'Memory tuning, disk optimization, network configuration',
          monitoring: 'JMX metrics, nodetool, performance monitoring',
          troubleshooting: 'Query performance, cluster health, repair operations'
        },
        
        operations: {
          deployment: 'Cluster deployment, multi-datacenter setup, cloud deployment',
          maintenance: 'Repairs, compaction, backups, node operations',
          scaling: 'Adding nodes, removing nodes, token management',
          migration: 'Data migration, schema changes, version upgrades'
        }
      },
      
      capabilities: [
        'Cassandra data modeling and schema design',
        'Query optimization and performance tuning',
        'Multi-datacenter cluster configuration',
        'Replication and consistency management',
        'Backup and disaster recovery',
        'Monitoring and alerting setup',
        'Performance troubleshooting',
        'Scaling and capacity planning',
        'Security configuration',
        'Migration and upgrade planning',
        'Time series data modeling',
        'Batch processing with Spark',
        'Driver integration and optimization',
        'Repair and maintenance operations',
        'Cloud deployment optimization'
      ],
      
      codePatterns: {
        dataModeling: `
-- Cassandra data modeling for time series and user data
-- Users table with proper partitioning
CREATE TABLE users (
    user_id UUID,
    email TEXT,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP,
    last_login TIMESTAMP,
    preferences MAP<TEXT, TEXT>,
    tags SET<TEXT>,
    PRIMARY KEY (user_id)
) WITH default_time_to_live = 0
   AND gc_grace_seconds = 864000
   AND compaction = {
     'class': 'SizeTieredCompactionStrategy',
     'max_threshold': 32,
     'min_threshold': 4
   };

-- Time series table for sensor data
CREATE TABLE sensor_readings (
    sensor_id UUID,
    reading_date DATE,
    reading_time TIMESTAMP,
    temperature DECIMAL,
    humidity DECIMAL,
    pressure DECIMAL,
    metadata MAP<TEXT, TEXT>,
    PRIMARY KEY ((sensor_id, reading_date), reading_time)
) WITH CLUSTERING ORDER BY (reading_time DESC)
   AND default_time_to_live = 2592000  -- 30 days
   AND compaction = {
     'class': 'TimeWindowCompactionStrategy',
     'compaction_window_unit': 'DAYS',
     'compaction_window_size': 1
   };

-- Event log table with proper partitioning
CREATE TABLE event_logs (
    event_type TEXT,
    event_date DATE,
    event_id TIMEUUID,
    user_id UUID,
    session_id UUID,
    event_data TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP,
    PRIMARY KEY ((event_type, event_date), event_id)
) WITH CLUSTERING ORDER BY (event_id DESC)
   AND default_time_to_live = 7776000  -- 90 days
   AND comment = 'Event logging table partitioned by type and date';

-- User-defined type for complex data
CREATE TYPE address (
    street TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT
);

-- Table using UDT and collections
CREATE TABLE user_profiles (
    user_id UUID,
    addresses LIST<FROZEN<address>>,
    phone_numbers SET<TEXT>,
    social_links MAP<TEXT, TEXT>,
    preferences FROZEN<MAP<TEXT, TEXT>>,
    PRIMARY KEY (user_id)
);`,

        performanceOptimization: `
-- Performance optimization queries and operations
-- Efficient range query on time series data
SELECT sensor_id, reading_time, temperature, humidity
FROM sensor_readings
WHERE sensor_id = 123e4567-e89b-12d3-a456-426614174000
  AND reading_date = '2024-01-15'
  AND reading_time >= '2024-01-15 10:00:00'
  AND reading_time <= '2024-01-15 11:00:00'
ORDER BY reading_time DESC
LIMIT 100;

-- Batch insert for better performance
BEGIN BATCH
INSERT INTO users (user_id, email, username, created_at)
VALUES (uuid(), 'user1@example.com', 'user1', toTimestamp(now()));

INSERT INTO user_profiles (user_id, phone_numbers, preferences)
VALUES (uuid(), {'555-1234', '555-5678'}, {'theme': 'dark', 'lang': 'en'});

INSERT INTO event_logs (event_type, event_date, event_id, user_id, event_data)
VALUES ('login', '2024-01-15', now(), uuid(), '{"success": true}');
APPLY BATCH;

-- Materialized view for different query patterns
CREATE MATERIALIZED VIEW users_by_email AS
SELECT user_id, email, username, created_at
FROM users
WHERE email IS NOT NULL
PRIMARY KEY (email, user_id);

-- Counter table for analytics
CREATE TABLE user_stats (
    user_id UUID,
    stat_type TEXT,
    count COUNTER,
    PRIMARY KEY (user_id, stat_type)
);

-- Increment counters
UPDATE user_stats SET count = count + 1
WHERE user_id = 123e4567-e89b-12d3-a456-426614174000
  AND stat_type = 'login';`,

        clusterOperations: `
// Cassandra cluster management and operations
const cassandra = require('cassandra-driver');

// Production cluster configuration
const client = new cassandra.Client({
  contactPoints: ['node1.cassandra.com', 'node2.cassandra.com', 'node3.cassandra.com'],
  localDataCenter: 'datacenter1',
  keyspace: 'production',
  authProvider: new cassandra.auth.PlainTextAuthProvider('username', 'password'),
  sslOptions: {
    // SSL configuration for production
  },
  pooling: {
    maxRequestsPerConnection: 32768,
    coreConnectionsPerHost: {
      [cassandra.types.distance.local]: 2,
      [cassandra.types.distance.remote]: 1
    }
  },
  queryOptions: {
    consistency: cassandra.types.consistencies.localQuorum,
    serialConsistency: cassandra.types.consistencies.localSerial
  },
  policies: {
    loadBalancing: new cassandra.policies.loadBalancing.TokenAwarePolicy(
      new cassandra.policies.loadBalancing.DCAwareRoundRobinPolicy('datacenter1')
    ),
    retry: new cassandra.policies.retry.RetryPolicy(),
    reconnection: new cassandra.policies.reconnection.ExponentialReconnectionPolicy(1000, 10 * 60 * 1000)
  }
});

class CassandraService {
  constructor(client) {
    this.client = client;
  }
  
  // Prepared statements for better performance
  async initialize() {
    this.insertUserStmt = await this.client.prepare(
      'INSERT INTO users (user_id, email, username, created_at) VALUES (?, ?, ?, ?)'
    );
    
    this.getUserStmt = await this.client.prepare(
      'SELECT * FROM users WHERE user_id = ?'
    );
    
    this.insertEventStmt = await this.client.prepare(
      'INSERT INTO event_logs (event_type, event_date, event_id, user_id, event_data) VALUES (?, ?, ?, ?, ?)'
    );
  }
  
  // Efficient batch operations
  async createUserWithEvents(userData, events) {
    const batch = [];
    const userId = cassandra.types.Uuid.random();
    const now = new Date();
    
    // Add user insert to batch
    batch.push({
      query: this.insertUserStmt,
      params: [userId, userData.email, userData.username, now]
    });
    
    // Add events to batch
    for (const event of events) {
      batch.push({
        query: this.insertEventStmt,
        params: [
          event.type,
          cassandra.types.LocalDate.fromDate(now),
          cassandra.types.TimeUuid.now(),
          userId,
          JSON.stringify(event.data)
        ]
      });
    }
    
    // Execute batch with proper consistency
    await this.client.batch(batch, {
      consistency: cassandra.types.consistencies.localQuorum
    });
    
    return userId;
  }
  
  // Paging for large result sets
  async getEventsPaged(eventType, eventDate, pageSize = 100, pageState = null) {
    const query = \`
      SELECT event_id, user_id, event_data, created_at
      FROM event_logs
      WHERE event_type = ? AND event_date = ?
      ORDER BY event_id DESC
    \`;
    
    const options = {
      prepare: true,
      fetchSize: pageSize,
      consistency: cassandra.types.consistencies.localQuorum
    };
    
    if (pageState) {
      options.pageState = pageState;
    }
    
    const result = await this.client.execute(query, [eventType, eventDate], options);
    
    return {
      rows: result.rows,
      pageState: result.pageState,
      hasMore: !!result.pageState
    };
  }
  
  // Async iterator for streaming large datasets
  async* streamSensorData(sensorId, startDate, endDate) {
    let pageState = null;
    
    do {
      const query = \`
        SELECT reading_time, temperature, humidity, pressure
        FROM sensor_readings
        WHERE sensor_id = ? AND reading_date >= ? AND reading_date <= ?
        ORDER BY reading_date ASC, reading_time ASC
      \`;
      
      const result = await this.client.execute(query, [sensorId, startDate, endDate], {
        prepare: true,
        fetchSize: 1000,
        pageState,
        consistency: cassandra.types.consistencies.localQuorum
      });
      
      for (const row of result.rows) {
        yield row;
      }
      
      pageState = result.pageState;
    } while (pageState);
  }
}`,

        monitoring: `
-- Cassandra monitoring and maintenance queries
-- Check cluster status
SELECT peer, data_center, rack, release_version, tokens
FROM system.peers;

-- Monitor table statistics
SELECT keyspace_name, table_name, bloom_filter_false_positives,
       bloom_filter_false_ratio, compacted_partition_maximum_bytes,
       compacted_partition_mean_bytes, compression_ratio
FROM system_schema.tables
WHERE keyspace_name = 'production';

-- Check replication status
SELECT keyspace_name, replication
FROM system_schema.keyspaces
WHERE keyspace_name = 'production';

-- Monitor pending tasks
SELECT * FROM system.compaction_history
WHERE keyspace_name = 'production'
ORDER BY compacted_at DESC
LIMIT 10;

-- Check token ranges
SELECT token(partition_key), partition_key, data_size
FROM production.large_table
LIMIT 100;`
      },
      
      bestPractices: [
        'Design data models based on query patterns, not normalization',
        'Choose partition keys to ensure even data distribution',
        'Avoid large partitions and wide rows',
        'Use appropriate consistency levels for your use case',
        'Implement proper error handling and retry logic',
        'Monitor cluster health and performance metrics',
        'Use prepared statements for better performance',
        'Implement proper backup and restore procedures',
        'Plan for multi-datacenter deployments',
        'Use batch operations sparingly and correctly',
        'Monitor and manage tombstones and compaction',
        'Size clusters appropriately for your workload',
        'Use time-to-live (TTL) for data that expires',
        'Implement proper security and access controls',
        'Regular maintenance and repair operations'
      ],
      
      systemPromptAdditions: `
You are a Cassandra expert specializing in:
- Distributed NoSQL database design and architecture
- Data modeling for high-scale applications
- Multi-datacenter cluster configuration
- Performance optimization and troubleshooting
- Consistency and replication management
- Time series and analytics data patterns
- Operations and maintenance procedures

When working with Cassandra:
- Design data models based on query patterns
- Choose partition keys for even distribution
- Use appropriate consistency levels
- Plan for eventual consistency scenarios
- Implement proper error handling and retries
- Monitor cluster health and performance
- Use prepared statements and batch operations correctly
- Plan for multi-datacenter deployments and scaling`
    };
  }
}

module.exports = NoSQLExpertise;