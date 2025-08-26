/**
 * BUMBA Redis Specialist
 * Expert in Redis caching, data structures, and performance optimization
 */

const UnifiedSpecialistBase = require('../../unified-specialist-base');

class RedisSpecialist extends UnifiedSpecialistBase {
  constructor() {
    super({
      name: 'Redis Specialist',
      expertise: ['Redis', 'Caching', 'Data Structures', 'Performance', 'High Availability'],
      models: ['claude-3-opus-20240229', 'gpt-4'],
      temperature: 0.3,
      systemPrompt: `You are a Redis expert specializing in:
        - Caching strategies and implementation
        - Redis data structures and use cases
        - Performance optimization and tuning
        - Redis Cluster and Sentinel configuration
        - Memory optimization and persistence
        - Pub/Sub messaging patterns
        - Redis modules and extensions
        - Monitoring and troubleshooting
        Always prioritize performance, scalability, and data consistency.`
    });

    this.capabilities = {
      caching: true,
      dataStructures: true,
      clustering: true,
      pubsub: true,
      optimization: true,
      monitoring: true,
      scripting: true,
      security: true
    };
  }

  async designCachingStrategy(context) {
    const analysis = await this.analyze(context);
    
    return {
      strategy: this.selectCachingStrategy(analysis),
      patterns: this.implementCachingPatterns(analysis),
      configuration: this.optimizeConfiguration(analysis),
      monitoring: this.setupMonitoring(analysis)
    };
  }

  selectCachingStrategy(analysis) {
    return `# Redis Caching Strategy for ${analysis.projectName || 'Application'}

## Cache Patterns Selection

### 1. Cache-Aside (Lazy Loading)
**Use for**: User profiles, product details, rarely changing data
**Pros**: Only caches requested data, handles cache misses gracefully
**Cons**: Initial request latency, potential stale data

### 2. Write-Through
**Use for**: Critical data that must be consistent
**Pros**: Data always up-to-date, no cache misses
**Cons**: Write latency, unnecessary caching of unused data

### 3. Write-Behind (Write-Back)
**Use for**: High write volume scenarios, analytics data
**Pros**: Low write latency, batch operations
**Cons**: Data loss risk, complex error handling

### 4. Refresh-Ahead
**Use for**: Predictable access patterns, expensive computations
**Pros**: Low latency for users, proactive updates
**Cons**: Resource overhead, complex implementation

## Data Type Mapping

### Strings
- Session tokens: SET session:token value EX 3600
- Counters: INCR page:views:123
- Feature flags: SET feature:newUI enabled

### Hashes
- User objects: HMSET user:123 name "John" email "john@example.com"
- Product details: HMSET product:456 name "Widget" price 29.99
- Configuration: HMSET config:app debug true timeout 30

### Lists
- Activity feeds: LPUSH feed:user:123 "activity_data"
- Job queues: RPUSH queue:email "job_data"
- Recent items: LPUSH recent:user:123 item_id

### Sets
- Tags: SADD product:123:tags "electronics" "gadget"
- Followers: SADD user:123:followers user:456
- Permissions: SADD user:123:permissions "read" "write"

### Sorted Sets
- Leaderboards: ZADD leaderboard 1500 user:123
- Time series: ZADD metrics:cpu timestamp value
- Priority queues: ZADD tasks priority task_id

### HyperLogLog
- Unique visitors: PFADD visitors:daily user:123
- Unique page views: PFADD pages:unique:123 user:456

### Bitmaps
- User activity: SETBIT activity:20240115 user_id 1
- Feature usage: SETBIT features:used feature_id 1`;
  }

  implementCachingPatterns(analysis) {
    return `# Redis Implementation Patterns

## 1. Cache-Aside Pattern (Node.js)
\`\`\`javascript
const redis = require('redis');
const client = redis.createClient();

class CacheService {
  async get(key) {
    try {
      const cached = await client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      await client.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key) {
    try {
      await client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
}

// Usage in service layer
class UserService {
  constructor() {
    this.cache = new CacheService();
  }

  async getUser(userId) {
    const cacheKey = \`user:\${userId}\`;
    
    // Try cache first
    let user = await this.cache.get(cacheKey);
    
    if (!user) {
      // Cache miss - fetch from database
      user = await this.database.findUserById(userId);
      
      if (user) {
        // Cache for 1 hour
        await this.cache.set(cacheKey, user, 3600);
      }
    }
    
    return user;
  }

  async updateUser(userId, userData) {
    // Update database
    const user = await this.database.updateUser(userId, userData);
    
    // Invalidate cache
    await this.cache.del(\`user:\${userId}\`);
    
    return user;
  }
}
\`\`\`

## 2. Write-Through Pattern
\`\`\`javascript
class WriteThroughCache {
  async setUser(userId, userData) {
    // Write to database first
    const user = await this.database.saveUser(userId, userData);
    
    // Then update cache
    await this.cache.set(\`user:\${userId}\`, user, 3600);
    
    return user;
  }
}
\`\`\`

## 3. Session Management
\`\`\`javascript
class SessionManager {
  async createSession(userId, sessionData) {
    const sessionId = this.generateSessionId();
    const sessionKey = \`session:\${sessionId}\`;
    
    const session = {
      userId,
      ...sessionData,
      createdAt: new Date(),
      lastAccessed: new Date()
    };
    
    // Store session with 24-hour expiration
    await client.setex(sessionKey, 86400, JSON.stringify(session));
    
    return sessionId;
  }

  async getSession(sessionId) {
    const sessionKey = \`session:\${sessionId}\`;
    const session = await client.get(sessionKey);
    
    if (session) {
      const parsed = JSON.parse(session);
      
      // Update last accessed time
      parsed.lastAccessed = new Date();
      await client.setex(sessionKey, 86400, JSON.stringify(parsed));
      
      return parsed;
    }
    
    return null;
  }

  async destroySession(sessionId) {
    await client.del(\`session:\${sessionId}\`);
  }
}
\`\`\`

## 4. Rate Limiting
\`\`\`javascript
class RateLimiter {
  async checkLimit(key, limit, window) {
    const current = await client.incr(key);
    
    if (current === 1) {
      // First request in window
      await client.expire(key, window);
    }
    
    return {
      allowed: current <= limit,
      count: current,
      remaining: Math.max(0, limit - current),
      resetTime: await client.ttl(key)
    };
  }

  // Sliding window rate limiter
  async slidingWindowLimit(key, limit, windowSize) {
    const now = Date.now();
    const window = now - windowSize * 1000;
    
    // Remove old entries
    await client.zremrangebyscore(key, 0, window);
    
    // Count current requests
    const current = await client.zcard(key);
    
    if (current < limit) {
      // Add current request
      await client.zadd(key, now, now);
      await client.expire(key, windowSize);
      return { allowed: true, remaining: limit - current - 1 };
    }
    
    return { allowed: false, remaining: 0 };
  }
}
\`\`\`

## 5. Pub/Sub Messaging
\`\`\`javascript
class EventService {
  constructor() {
    this.publisher = redis.createClient();
    this.subscriber = redis.createClient();
  }

  async publish(channel, data) {
    await this.publisher.publish(channel, JSON.stringify(data));
  }

  subscribe(channel, callback) {
    this.subscriber.subscribe(channel);
    
    this.subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        try {
          const data = JSON.parse(message);
          callback(data);
        } catch (error) {
          console.error('Message parse error:', error);
        }
      }
    });
  }

  // Pattern subscription
  psubscribe(pattern, callback) {
    this.subscriber.psubscribe(pattern);
    
    this.subscriber.on('pmessage', (pattern, channel, message) => {
      try {
        const data = JSON.parse(message);
        callback(channel, data);
      } catch (error) {
        console.error('Pattern message parse error:', error);
      }
    });
  }
}

// Usage
const events = new EventService();

// Publisher
await events.publish('user:notifications', {
  userId: 123,
  type: 'email',
  message: 'Welcome!'
});

// Subscriber
events.subscribe('user:notifications', (data) => {
  console.log('Notification received:', data);
});
\`\`\`

## 6. Distributed Locking
\`\`\`javascript
class RedisLock {
  async acquireLock(resource, ttl = 10000) {
    const lockKey = \`lock:\${resource}\`;
    const lockValue = this.generateLockValue();
    
    const result = await client.set(
      lockKey, 
      lockValue, 
      'PX', ttl,  // Expire after ttl milliseconds
      'NX'        // Only if not exists
    );
    
    if (result === 'OK') {
      return { locked: true, lockValue };
    }
    
    return { locked: false };
  }

  async releaseLock(resource, lockValue) {
    const lockKey = \`lock:\${resource}\`;
    
    // Lua script for atomic release
    const script = \`
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    \`;
    
    const result = await client.eval(script, 1, lockKey, lockValue);
    return result === 1;
  }

  generateLockValue() {
    return \`\${Date.now()}-\${Math.random()}\`;
  }
}
\`\`\`

## 7. Caching Best Practices
\`\`\`javascript
class OptimizedCache {
  // Cache with compression for large objects
  async setCompressed(key, value, ttl) {
    const compressed = await this.compress(JSON.stringify(value));
    await client.setex(key, ttl, compressed);
  }

  async getCompressed(key) {
    const compressed = await client.get(key);
    if (compressed) {
      const decompressed = await this.decompress(compressed);
      return JSON.parse(decompressed);
    }
    return null;
  }

  // Cache warming
  async warmCache(keys) {
    const pipeline = client.pipeline();
    
    for (const key of keys) {
      const data = await this.fetchFromSource(key);
      pipeline.setex(key, 3600, JSON.stringify(data));
    }
    
    await pipeline.exec();
  }

  // Batch operations
  async mget(keys) {
    const values = await client.mget(keys);
    return values.map(v => v ? JSON.parse(v) : null);
  }

  async mset(keyValuePairs, ttl) {
    const pipeline = client.pipeline();
    
    for (const [key, value] of keyValuePairs) {
      pipeline.setex(key, ttl, JSON.stringify(value));
    }
    
    await pipeline.exec();
  }
}
\`\`\``;
  }

  optimizeConfiguration(analysis) {
    return `# Redis Configuration Optimization

## redis.conf settings

# Memory optimization
maxmemory ${analysis.maxMemoryGB || 4}gb
maxmemory-policy allkeys-lru  # or volatile-lru, allkeys-lfu
maxmemory-samples 5

# Persistence configuration
# RDB snapshots
save 900 1      # Save if at least 1 key changed in 900 seconds
save 300 10     # Save if at least 10 keys changed in 300 seconds  
save 60 10000   # Save if at least 10000 keys changed in 60 seconds

# AOF (Append Only File)
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec  # or always, no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Network settings
tcp-backlog 511
timeout 0
tcp-keepalive 300
bind 127.0.0.1 192.168.1.100  # Bind to specific interfaces

# Client settings
maxclients 10000
stop-writes-on-bgsave-error yes

# Logging
loglevel notice
logfile "/var/log/redis/redis-server.log"
syslog-enabled yes
syslog-ident redis

# Slow log
slowlog-log-slower-than 10000  # Log queries slower than 10ms
slowlog-max-len 128

# Key expiration
hz 10  # Background task frequency

## Connection pooling (Node.js)
\`\`\`javascript
const redis = require('redis');

const pool = redis.createClient({
  host: 'localhost',
  port: 6379,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('The server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  },
  connect_timeout: 60000,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 1000,
  enableOfflineQueue: false
});
\`\`\`

## Performance tuning
# Linux kernel optimization
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo 1 > /proc/sys/vm/overcommit_memory
sysctl vm.swappiness=1

# File descriptor limits
echo "redis soft nofile 65535" >> /etc/security/limits.conf
echo "redis hard nofile 65535" >> /etc/security/limits.conf`;
  }

  setupClustering(analysis) {
    return `# Redis Cluster Configuration

## Cluster Setup (6 nodes: 3 masters, 3 slaves)

### Node configuration files
# redis-7000.conf (Master 1)
port 7000
cluster-enabled yes
cluster-config-file nodes-7000.conf
cluster-node-timeout 15000
appendonly yes
bind 127.0.0.1

# redis-7001.conf (Master 2)  
port 7001
cluster-enabled yes
cluster-config-file nodes-7001.conf
cluster-node-timeout 15000
appendonly yes
bind 127.0.0.1

# ... (similar for 7002, 7003, 7004, 7005)

### Cluster initialization
#!/bin/bash
# start_cluster.sh

# Start all Redis instances
for port in {7000..7005}; do
  redis-server redis-$port.conf &
done

# Wait for instances to start
sleep 5

# Create cluster
redis-cli --cluster create \\
  127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 \\
  127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 \\
  --cluster-replicas 1

### Client configuration (Node.js)
\`\`\`javascript
const Redis = require('ioredis');

const cluster = new Redis.Cluster([
  { host: '127.0.0.1', port: 7000 },
  { host: '127.0.0.1', port: 7001 },
  { host: '127.0.0.1', port: 7002 }
], {
  redisOptions: {
    password: 'your_password'
  },
  enableOfflineQueue: false,
  retryDelayOnFailover: 1000,
  maxRetriesPerRequest: 3
});

// Handle cluster events
cluster.on('connect', () => {
  console.log('Cluster connected');
});

cluster.on('error', (err) => {
  console.error('Cluster error:', err);
});

cluster.on('node error', (err, node) => {
  console.error(\`Node \${node.options.host}:\${node.options.port} error:\`, err);
});
\`\`\`

### Cluster operations
# Check cluster status
redis-cli --cluster check 127.0.0.1:7000

# Rebalance cluster
redis-cli --cluster rebalance 127.0.0.1:7000

# Add new node
redis-cli --cluster add-node 127.0.0.1:7006 127.0.0.1:7000

# Remove node
redis-cli --cluster del-node 127.0.0.1:7000 <node-id>

# Reshard cluster
redis-cli --cluster reshard 127.0.0.1:7000

### Hash tags for multi-key operations
\`\`\`javascript
// Keys with same hash tag go to same slot
await cluster.mset(
  'user:{123}:profile', profileData,
  'user:{123}:settings', settingsData,
  'user:{123}:preferences', preferencesData
);

// This works because all keys have {123} hash tag
await cluster.del('user:{123}:profile', 'user:{123}:settings');
\`\`\`

## Redis Sentinel for High Availability

### Sentinel configuration
# sentinel.conf
port 26379
sentinel monitor mymaster 127.0.0.1 6379 2
sentinel auth-pass mymaster your_password
sentinel down-after-milliseconds mymaster 30000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 180000
sentinel deny-scripts-reconfig yes

### Client with Sentinel
\`\`\`javascript
const Redis = require('ioredis');

const redis = new Redis({
  sentinels: [
    { host: '127.0.0.1', port: 26379 },
    { host: '127.0.0.1', port: 26380 },
    { host: '127.0.0.1', port: 26381 }
  ],
  name: 'mymaster',
  role: 'master',
  retryDelayOnFailover: 1000,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3
});
\`\`\``;
  }

  setupMonitoring(analysis) {
    return `# Redis Monitoring and Alerting

## Metrics to Monitor

### Performance Metrics
- Operations per second
- Memory usage
- CPU usage
- Network I/O
- Slow queries
- Client connections

### Health Metrics
- Cluster/replication status
- Key expiration rate
- Cache hit ratio
- Error rates

## Monitoring with Redis CLI
\`\`\`bash
# Real-time monitoring
redis-cli --latency-history -i 1

# Memory usage
redis-cli info memory

# Slow query log
redis-cli slowlog get 10

# Client connections
redis-cli client list

# Continuous stats
redis-cli --stat
\`\`\`

## Prometheus Integration
\`\`\`yaml
# docker-compose.yml
version: '3.8'
services:
  redis-exporter:
    image: oliver006/redis_exporter
    environment:
      REDIS_ADDR: "redis://redis:6379"
    ports:
      - "9121:9121"
    depends_on:
      - redis

  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
\`\`\`

## Custom Monitoring Script
\`\`\`javascript
const Redis = require('ioredis');
const redis = new Redis();

class RedisMonitor {
  async collectMetrics() {
    const info = await redis.info();
    const metrics = this.parseInfo(info);
    
    return {
      memory: {
        used: metrics.used_memory,
        peak: metrics.used_memory_peak,
        fragmentation: metrics.mem_fragmentation_ratio
      },
      stats: {
        ops_per_sec: metrics.instantaneous_ops_per_sec,
        keyspace_hits: metrics.keyspace_hits,
        keyspace_misses: metrics.keyspace_misses,
        connected_clients: metrics.connected_clients
      },
      replication: {
        role: metrics.role,
        connected_slaves: metrics.connected_slaves || 0,
        repl_backlog_size: metrics.repl_backlog_size
      }
    };
  }

  async checkHealth() {
    try {
      const start = Date.now();
      await redis.ping();
      const latency = Date.now() - start;
      
      const metrics = await this.collectMetrics();
      
      return {
        status: 'healthy',
        latency,
        metrics
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  parseInfo(info) {
    const lines = info.split('\\r\\n');
    const metrics = {};
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        metrics[key] = isNaN(value) ? value : Number(value);
      }
    }
    
    return metrics;
  }
}

// Usage
const monitor = new RedisMonitor();
setInterval(async () => {
  const health = await monitor.checkHealth();
  console.log('Redis Health:', health);
}, 30000); // Check every 30 seconds
\`\`\`

## Alerting Rules
\`\`\`yaml
# prometheus-alerts.yml
groups:
  - name: redis
    rules:
      - alert: RedisDown
        expr: redis_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Redis instance is down"

      - alert: RedisHighMemoryUsage
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Redis memory usage is above 90%"

      - alert: RedisSlowQueries
        expr: increase(redis_slowlog_length[5m]) > 0
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Redis slow queries detected"

      - alert: RedisHighClientConnections
        expr: redis_connected_clients > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Redis has too many client connections"
\`\`\``;
  }

  async troubleshoot(issue) {
    const solutions = {
      high_memory_usage: [
        'Check memory usage with INFO memory command',
        'Identify large keys with redis-cli --bigkeys',
        'Review maxmemory policy settings',
        'Implement proper key expiration strategies',
        'Consider data compression or archival'
      ],
      slow_performance: [
        'Analyze slow queries with SLOWLOG command',
        'Check for blocking operations',
        'Review data structures and access patterns',
        'Monitor network latency',
        'Consider using pipelining for bulk operations'
      ],
      connection_issues: [
        'Check Redis service status and logs',
        'Verify network connectivity and firewall rules',
        'Review maxclients configuration',
        'Check for connection pool exhaustion',
        'Monitor TCP connection states'
      ],
      cluster_issues: [
        'Check cluster status with CLUSTER INFO',
        'Verify all nodes are accessible',
        'Review hash slot distribution',
        'Check for network partitions',
        'Monitor cross-slot operations'
      ]
    };
    
    return solutions[issue.type] || ['Review Redis logs and documentation'];
  }
}

module.exports = RedisSpecialist;