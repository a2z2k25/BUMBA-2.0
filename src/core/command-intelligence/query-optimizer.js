/**
 * BUMBA Query Optimizer
 * Optimizes data queries and retrieval patterns
 */

const { logger } = require('../logging/bumba-logger');
const { getInstance: getCacheManager } = require('./cache-manager');

class QueryOptimizer {
  constructor() {
    this.cacheManager = getCacheManager();
    
    this.queryPatterns = new Map();
    this.indexedData = new Map();
    this.queryStats = {
      totalQueries: 0,
      optimizedQueries: 0,
      cacheHits: 0,
      averageTime: 0
    };
    
    // Query optimization strategies
    this.strategies = {
      'batch': this.batchQueries.bind(this),
      'cache': this.cacheQuery.bind(this),
      'index': this.useIndex.bind(this),
      'parallel': this.parallelQuery.bind(this),
      'lazy': this.lazyLoad.bind(this)
    };
    
    this.initializeIndexes();
  }

  /**
   * Initialize common indexes
   */
  initializeIndexes() {
    // Command indexes
    this.indexedData.set('commands_by_type', new Map());
    this.indexedData.set('commands_by_department', new Map());
    this.indexedData.set('specialists_by_skill', new Map());
    this.indexedData.set('files_by_extension', new Map());
  }

  /**
   * Optimize query execution
   */
  async optimizeQuery(query, context = {}) {
    const startTime = Date.now();
    this.queryStats.totalQueries++;
    
    // Check cache first
    const cacheKey = this.generateQueryKey(query);
    const cached = this.cacheManager.get(cacheKey);
    if (cached) {
      this.queryStats.cacheHits++;
      return cached;
    }
    
    // Analyze query pattern
    const pattern = this.analyzeQueryPattern(query);
    
    // Select optimization strategy
    const strategy = this.selectStrategy(pattern, context);
    
    // Execute optimized query
    const result = await this.executeOptimized(query, strategy, context);
    
    // Cache result if appropriate
    if (this.shouldCache(pattern, result)) {
      this.cacheManager.set(cacheKey, result, this.getQueryTTL(pattern));
    }
    
    // Update statistics
    const duration = Date.now() - startTime;
    this.updateStats(pattern, duration);
    
    return result;
  }

  /**
   * Analyze query pattern
   */
  analyzeQueryPattern(query) {
    const pattern = {
      type: this.detectQueryType(query),
      complexity: this.calculateComplexity(query),
      dataSize: this.estimateDataSize(query),
      frequency: this.getQueryFrequency(query),
      cacheable: true,
      indexable: false
    };
    
    // Check if query can use indexes
    if (query.field && this.hasIndex(query.field)) {
      pattern.indexable = true;
    }
    
    // Check if query should be cached
    if (pattern.type === 'realtime' || pattern.complexity === 'volatile') {
      pattern.cacheable = false;
    }
    
    return pattern;
  }

  /**
   * Detect query type
   */
  detectQueryType(query) {
    if (query.command) return 'command';
    if (query.specialist) return 'specialist';
    if (query.file) return 'file';
    if (query.aggregate) return 'aggregate';
    if (query.search) return 'search';
    return 'general';
  }

  /**
   * Calculate query complexity
   */
  calculateComplexity(query) {
    let complexity = 0;
    
    if (query.join) complexity += 2;
    if (query.aggregate) complexity += 3;
    if (query.sort) complexity += 1;
    if (query.filter && Object.keys(query.filter).length > 3) complexity += 2;
    if (query.nested) complexity += query.nested.depth || 1;
    
    if (complexity <= 1) return 'simple';
    if (complexity <= 3) return 'moderate';
    return 'complex';
  }

  /**
   * Estimate data size
   */
  estimateDataSize(query) {
    if (query.limit && query.limit < 10) return 'small';
    if (query.limit && query.limit < 100) return 'medium';
    if (query.all || !query.limit) return 'large';
    return 'medium';
  }

  /**
   * Get query frequency
   */
  getQueryFrequency(query) {
    const key = this.generateQueryKey(query);
    const pattern = this.queryPatterns.get(key) || { count: 0 };
    return pattern.count;
  }

  /**
   * Select optimization strategy
   */
  selectStrategy(pattern, context) {
    // Use cache for frequent, simple queries
    if (pattern.frequency > 5 && pattern.complexity === 'simple') {
      return 'cache';
    }
    
    // Use index for indexable queries
    if (pattern.indexable) {
      return 'index';
    }
    
    // Use parallel for complex aggregations
    if (pattern.complexity === 'complex' && pattern.type === 'aggregate') {
      return 'parallel';
    }
    
    // Use batch for multiple similar queries
    if (context.batch && context.batch.length > 1) {
      return 'batch';
    }
    
    // Use lazy loading for large datasets
    if (pattern.dataSize === 'large' && !context.immediate) {
      return 'lazy';
    }
    
    return 'default';
  }

  /**
   * Execute optimized query
   */
  async executeOptimized(query, strategy, context) {
    logger.debug(`🔍 Executing query with strategy: ${strategy}`);
    
    if (this.strategies[strategy]) {
      this.queryStats.optimizedQueries++;
      return await this.strategies[strategy](query, context);
    }
    
    // Default execution
    return await this.executeDefault(query, context);
  }

  /**
   * Batch multiple queries
   */
  async batchQueries(queries, context) {
    logger.info('📦 Batching queries for efficiency');
    
    // Group similar queries
    const groups = this.groupQueries(queries);
    
    // Execute groups in parallel
    const results = await Promise.all(
      groups.map(group => this.executeBatch(group, context))
    );
    
    // Flatten and return
    return results.flat();
  }

  /**
   * Cache query result
   */
  async cacheQuery(query, context) {
    const key = this.generateQueryKey(query);
    const result = await this.executeDefault(query, context);
    
    // Cache with appropriate TTL
    const ttl = this.getQueryTTL(this.analyzeQueryPattern(query));
    this.cacheManager.set(key, result, ttl);
    
    return result;
  }

  /**
   * Use indexed data
   */
  async useIndex(query, context) {
    logger.debug('🗂️ Using index for query');
    
    const indexName = this.getIndexName(query);
    const index = this.indexedData.get(indexName);
    
    if (index && index.has(query.value)) {
      return index.get(query.value);
    }
    
    // Build index if not exists
    await this.buildIndex(indexName, query.field);
    
    return this.executeDefault(query, context);
  }

  /**
   * Execute queries in parallel
   */
  async parallelQuery(query, context) {
    logger.info('⚡ Executing parallel query');
    
    // Split complex query into sub-queries
    const subQueries = this.splitQuery(query);
    
    // Execute in parallel
    const results = await Promise.all(
      subQueries.map(sq => this.executeDefault(sq, context))
    );
    
    // Combine results
    return this.combineResults(results, query);
  }

  /**
   * Lazy load data
   */
  async lazyLoad(query, context) {
    logger.debug('💤 Lazy loading data');
    
    // Return a generator or cursor
    return {
      cursor: 0,
      pageSize: query.limit || 100,
      hasMore: true,
      
      async next() {
        const page = await this.loadPage(query, this.cursor, this.pageSize);
        this.cursor += page.length;
        this.hasMore = page.length === this.pageSize;
        return page;
      },
      
      async all() {
        const results = [];
        while (this.hasMore) {
          results.push(...await this.next());
        }
        return results;
      }
    };
  }

  /**
   * Execute default query
   */
  async executeDefault(query, context) {
    // This would normally execute the actual query
    // For now, return a mock result
    return {
      data: [],
      query: query,
      context: context,
      timestamp: Date.now()
    };
  }

  /**
   * Group similar queries
   */
  groupQueries(queries) {
    const groups = new Map();
    
    for (const query of queries) {
      const key = `${query.type}_${query.field}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(query);
    }
    
    return Array.from(groups.values());
  }

  /**
   * Execute batch of queries
   */
  async executeBatch(batch, context) {
    // Execute batch as single optimized query
    const batchQuery = {
      type: batch[0].type,
      field: batch[0].field,
      values: batch.map(q => q.value),
      batch: true
    };
    
    return this.executeDefault(batchQuery, context);
  }

  /**
   * Split complex query
   */
  splitQuery(query) {
    const subQueries = [];
    
    // Split aggregations
    if (query.aggregate) {
      for (const agg of query.aggregate) {
        subQueries.push({
          ...query,
          aggregate: [agg]
        });
      }
    }
    
    // Split joins
    if (query.join && query.join.length > 2) {
      // Split into smaller joins
      for (let i = 0; i < query.join.length; i += 2) {
        subQueries.push({
          ...query,
          join: query.join.slice(i, i + 2)
        });
      }
    }
    
    return subQueries.length > 0 ? subQueries : [query];
  }

  /**
   * Combine parallel results
   */
  combineResults(results, originalQuery) {
    if (originalQuery.aggregate) {
      // Combine aggregation results
      return results.reduce((acc, r) => ({ ...acc, ...r }), {});
    }
    
    if (originalQuery.join) {
      // Combine join results
      return results.flat();
    }
    
    return results;
  }

  /**
   * Build index for field
   */
  async buildIndex(indexName, field) {
    logger.info(`📇 Building index: ${indexName}`);
    
    const index = new Map();
    // Would normally scan data and build index
    // For now, just create empty index
    
    this.indexedData.set(indexName, index);
  }

  /**
   * Check if index exists
   */
  hasIndex(field) {
    const indexName = `index_${field}`;
    return this.indexedData.has(indexName);
  }

  /**
   * Get index name for query
   */
  getIndexName(query) {
    if (query.command) return 'commands_by_type';
    if (query.department) return 'commands_by_department';
    if (query.specialist) return 'specialists_by_skill';
    if (query.file) return 'files_by_extension';
    return `index_${query.field}`;
  }

  /**
   * Should cache result
   */
  shouldCache(pattern, result) {
    // Don't cache empty results
    if (!result || (result.data && result.data.length === 0)) {
      return false;
    }
    
    // Don't cache volatile data
    if (pattern.type === 'realtime' || pattern.cacheable === false) {
      return false;
    }
    
    // Don't cache large results
    const size = JSON.stringify(result).length;
    if (size > 1024 * 1024) { // 1MB
      return false;
    }
    
    return true;
  }

  /**
   * Get TTL for query pattern
   */
  getQueryTTL(pattern) {
    // Longer TTL for stable data
    if (pattern.type === 'command' || pattern.type === 'specialist') {
      return 600000; // 10 minutes
    }
    
    // Shorter TTL for dynamic data
    if (pattern.type === 'file' || pattern.type === 'search') {
      return 60000; // 1 minute
    }
    
    // Medium TTL for aggregations
    if (pattern.type === 'aggregate') {
      return 300000; // 5 minutes
    }
    
    return 120000; // 2 minutes default
  }

  /**
   * Generate query key
   */
  generateQueryKey(query) {
    return `query_${JSON.stringify(query)}`;
  }

  /**
   * Update query statistics
   */
  updateStats(pattern, duration) {
    // Update pattern frequency
    const key = `${pattern.type}_${pattern.complexity}`;
    const stats = this.queryPatterns.get(key) || { count: 0, totalTime: 0 };
    stats.count++;
    stats.totalTime += duration;
    this.queryPatterns.set(key, stats);
    
    // Update overall stats
    this.queryStats.averageTime = 
      (this.queryStats.averageTime * (this.queryStats.totalQueries - 1) + duration) / 
      this.queryStats.totalQueries;
  }

  /**
   * Get optimization statistics
   */
  getStats() {
    const patterns = Array.from(this.queryPatterns.entries()).map(([key, stats]) => ({
      pattern: key,
      count: stats.count,
      averageTime: (stats.totalTime / stats.count).toFixed(2)
    }));
    
    return {
      totalQueries: this.queryStats.totalQueries,
      optimizedQueries: this.queryStats.optimizedQueries,
      optimizationRate: `${((this.queryStats.optimizedQueries / this.queryStats.totalQueries) * 100).toFixed(1)}%`,
      cacheHits: this.queryStats.cacheHits,
      cacheHitRate: `${((this.queryStats.cacheHits / this.queryStats.totalQueries) * 100).toFixed(1)}%`,
      averageTime: `${this.queryStats.averageTime.toFixed(2)}ms`,
      patterns: patterns.slice(0, 5), // Top 5 patterns
      indexes: Array.from(this.indexedData.keys())
    };
  }

  /**
   * Clear query optimizer
   */
  clear() {
    this.queryPatterns.clear();
    this.indexedData.forEach(index => index.clear());
    this.queryStats = {
      totalQueries: 0,
      optimizedQueries: 0,
      cacheHits: 0,
      averageTime: 0
    };
    
    logger.info('🧹 Query optimizer cleared');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  QueryOptimizer,
  getInstance: () => {
    if (!instance) {
      instance = new QueryOptimizer();
    }
    return instance;
  }
};