/**
 * BUMBA Lazy-Loaded Specialist Registry
 * Loads specialists only when needed to save memory
 */

const path = require('path');
const fs = require('fs');
const { logger } = require('../logging/bumba-logger');

class LazySpecialistRegistry {
  constructor() {
    this.specialistMetadata = new Map(); // Only metadata, not actual classes
    this.loadedSpecialists = new Map();   // Cache for loaded specialists
    this.instanceCache = new Map();       // Cache for specialist instances
    this.performanceMetrics = {
      loadTime: {},
      cacheHits: 0,
      cacheMisses: 0,
      memoryBefore: process.memoryUsage().heapUsed,
      memorySaved: 0
    };
    
    // Initialize only metadata (no actual loading)
    this.initializeMetadata();
    
    // Calculate memory saved
    const memoryAfter = process.memoryUsage().heapUsed;
    this.performanceMetrics.memorySaved = this.performanceMetrics.memoryBefore - memoryAfter;
    
    logger.info(`🟢 Lazy Specialist Registry initialized`);
    logger.info(`   Specialists indexed: ${this.specialistMetadata.size}`);
    logger.info(`   Memory saved: ~${Math.max(0, this.performanceMetrics.memorySaved / 1024 / 1024).toFixed(2)}MB`);
  }

  /**
   * Initialize only metadata without loading actual specialist code
   */
  initializeMetadata() {
    // Store only the metadata for each specialist
    const specialists = [
      // Technical - Languages
      { id: 'javascript-specialist', name: 'JavaScript Specialist', category: 'technical', subcategory: 'languages', path: 'technical/languages/javascript-specialist' },
      { id: 'typescript-specialist', name: 'TypeScript Specialist', category: 'technical', subcategory: 'languages', path: 'technical/languages/typescript-specialist' },
      { id: 'python-specialist', name: 'Python Specialist', category: 'technical', subcategory: 'languages', path: 'technical/languages/python-specialist' },
      { id: 'golang-specialist', name: 'Go Specialist', category: 'technical', subcategory: 'languages', path: 'technical/languages/golang-specialist' },
      { id: 'rust-specialist', name: 'Rust Specialist', category: 'technical', subcategory: 'languages', path: 'technical/languages/rust-specialist' },
      { id: 'java-specialist', name: 'Java Specialist', category: 'technical', subcategory: 'languages', path: 'technical/languages/java-specialist' },
      { id: 'csharp-specialist', name: 'C# Specialist', category: 'technical', subcategory: 'languages', path: 'technical/languages/csharp-specialist' },
      { id: 'ruby-specialist', name: 'Ruby Specialist', category: 'technical', subcategory: 'languages', path: 'technical/languages/ruby-specialist' },
      { id: 'php-specialist', name: 'PHP Specialist', category: 'technical', subcategory: 'languages', path: 'technical/languages/php-specialist' },
      { id: 'swift-specialist', name: 'Swift Specialist', category: 'technical', subcategory: 'languages', path: 'technical/languages/swift-specialist' },
      { id: 'kotlin-specialist', name: 'Kotlin Specialist', category: 'technical', subcategory: 'languages', path: 'technical/languages/kotlin-specialist' },
      { id: 'cpp-specialist', name: 'C++ Specialist', category: 'technical', subcategory: 'languages', path: 'technical/languages/cpp-specialist' },
      { id: 'sql-specialist', name: 'SQL Specialist', category: 'technical', subcategory: 'languages', path: 'technical/languages/sql-specialist' },
      
      // Technical - Databases
      { id: 'postgresql-specialist', name: 'PostgreSQL Specialist', category: 'technical', subcategory: 'databases', path: 'technical/databases/postgresql-specialist' },
      { id: 'mongodb-specialist', name: 'MongoDB Specialist', category: 'technical', subcategory: 'databases', path: 'technical/databases/mongodb-specialist' },
      { id: 'redis-specialist', name: 'Redis Specialist', category: 'technical', subcategory: 'databases', path: 'technical/databases/redis-specialist' },
      { id: 'elasticsearch-specialist', name: 'Elasticsearch Specialist', category: 'technical', subcategory: 'databases', path: 'technical/databases/elasticsearch-specialist' },
      { id: 'dynamodb-specialist', name: 'DynamoDB Specialist', category: 'technical', subcategory: 'databases', path: 'technical/databases/dynamodb-specialist' },
      { id: 'neo4j-specialist', name: 'Neo4j Specialist', category: 'technical', subcategory: 'databases', path: 'technical/databases/neo4j-specialist' },
      { id: 'cassandra-specialist', name: 'Cassandra Specialist', category: 'technical', subcategory: 'databases', path: 'technical/databases/cassandra-specialist' },
      { id: 'mysql-specialist', name: 'MySQL Specialist', category: 'technical', subcategory: 'databases', path: 'technical/databases/mysql-specialist' },
      
      // Technical - DevOps
      { id: 'docker-specialist', name: 'Docker Specialist', category: 'technical', subcategory: 'devops', path: 'technical/devops/docker-specialist' },
      { id: 'kubernetes-specialist', name: 'Kubernetes Specialist', category: 'technical', subcategory: 'devops', path: 'technical/devops/kubernetes-specialist' },
      { id: 'terraform-specialist', name: 'Terraform Specialist', category: 'technical', subcategory: 'devops', path: 'technical/devops/terraform-specialist' },
      { id: 'cicd-specialist', name: 'CI/CD Specialist', category: 'technical', subcategory: 'devops', path: 'technical/devops/cicd-specialist' },
      { id: 'aws-specialist', name: 'AWS Specialist', category: 'technical', subcategory: 'devops', path: 'technical/devops/aws-specialist' },
      { id: 'monitoring-specialist', name: 'Monitoring Specialist', category: 'technical', subcategory: 'devops', path: 'technical/devops/monitoring-specialist' },
      
      // Experience - Frontend
      { id: 'react-specialist', name: 'React Specialist', category: 'experience', subcategory: 'frontend', path: 'experience/react-specialist' },
      { id: 'vue-specialist', name: 'Vue Specialist', category: 'experience', subcategory: 'frontend', path: 'experience/vue-specialist' },
      { id: 'angular-specialist', name: 'Angular Specialist', category: 'experience', subcategory: 'frontend', path: 'experience/angular-specialist' },
      { id: 'css-specialist', name: 'CSS Specialist', category: 'experience', subcategory: 'frontend', path: 'experience/css-specialist' },
      { id: 'shadcn-specialist', name: 'Shadcn Specialist', category: 'experience', subcategory: 'frontend', path: 'experience/shadcn-specialist' },
      
      // Strategic
      { id: 'business-analyst', name: 'Business Analyst', category: 'strategic', subcategory: 'business', path: 'strategic/business-analyst' },
      { id: 'product-manager', name: 'Product Manager', category: 'strategic', subcategory: 'product', path: 'strategic/product-manager' },
      { id: 'market-research-specialist', name: 'Market Research', category: 'strategic', subcategory: 'market', path: 'strategic/market-research-specialist' }
    ];
    
    // Store only metadata, not actual classes
    specialists.forEach(spec => {
      this.specialistMetadata.set(spec.id, spec);
    });
  }

  /**
   * Get specialist (lazy load if needed)
   */
  getSpecialist(type) {
    const metadata = this.specialistMetadata.get(type);
    if (!metadata) {
      return null;
    }
    
    // Check if already loaded
    if (this.loadedSpecialists.has(type)) {
      this.performanceMetrics.cacheHits++;
      return this.loadedSpecialists.get(type);
    }
    
    // Lazy load the specialist
    this.performanceMetrics.cacheMisses++;
    return this.lazyLoadSpecialist(type, metadata);
  }
  
  /**
   * Lazy load a specialist when needed
   */
  lazyLoadSpecialist(type, metadata) {
    const startTime = Date.now();
    const memoryBefore = process.memoryUsage().heapUsed;
    
    try {
      const specialistPath = path.join(__dirname, metadata.path);
      
      // Try different file patterns
      const possiblePaths = [
        `${specialistPath}.js`,
        specialistPath
      ];
      
      for (const tryPath of possiblePaths) {
        if (fs.existsSync(tryPath)) {
          const SpecialistClass = require(tryPath);
          
          // Cache the loaded class
          this.loadedSpecialists.set(type, SpecialistClass);
          
          // Track performance
          const loadTime = Date.now() - startTime;
          const memoryAfter = process.memoryUsage().heapUsed;
          const memoryUsed = (memoryAfter - memoryBefore) / 1024 / 1024;
          
          this.performanceMetrics.loadTime[type] = loadTime;
          
          logger.debug(`🟢 Lazy loaded ${type} in ${loadTime}ms using ${memoryUsed.toFixed(2)}MB`);
          
          return SpecialistClass;
        }
      }
      
      logger.warn(`Specialist file not found for ${type}`);
      return null;
    } catch (error) {
      logger.error(`Error lazy loading specialist ${type}:`, error.message);
      return null;
    }
  }
  
  /**
   * Get or create specialist instance (with lazy loading)
   */
  getSpecialistInstance(type, department = 'default', context = {}) {
    const cacheKey = `${type}-${department}`;
    
    // Check instance cache
    if (this.instanceCache.has(cacheKey)) {
      this.performanceMetrics.cacheHits++;
      return this.instanceCache.get(cacheKey);
    }
    
    // Lazy load the specialist class
    const SpecialistClass = this.getSpecialist(type);
    if (!SpecialistClass) {
      return null;
    }
    
    try {
      const instance = new SpecialistClass(department, context);
      this.instanceCache.set(cacheKey, instance);
      return instance;
    } catch (error) {
      logger.error(`Error creating specialist instance ${type}:`, error.message);
      return null;
    }
  }
  
  /**
   * Get all specialist types (metadata only)
   */
  getAllSpecialists() {
    return Array.from(this.specialistMetadata.keys());
  }
  
  /**
   * Get specialists by category (metadata only)
   */
  getSpecialistsByCategory(category) {
    const results = [];
    for (const [id, metadata] of this.specialistMetadata) {
      if (metadata.category === category) {
        results.push(id);
      }
    }
    return results;
  }
  
  /**
   * Check if specialist exists (without loading)
   */
  hasSpecialist(type) {
    return this.specialistMetadata.has(type);
  }
  
  /**
   * Get registry statistics
   */
  getStats() {
    return {
      totalSpecialists: this.specialistMetadata.size,
      loadedSpecialists: this.loadedSpecialists.size,
      cachedInstances: this.instanceCache.size,
      cacheHits: this.performanceMetrics.cacheHits,
      cacheMisses: this.performanceMetrics.cacheMisses,
      cacheHitRate: this.performanceMetrics.cacheHits / 
                    (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) || 0,
      memorySaved: `~${Math.max(0, this.performanceMetrics.memorySaved / 1024 / 1024).toFixed(2)}MB`
    };
  }
  
  /**
   * Clear caches (for memory management)
   */
  clearCaches() {
    const freedInstances = this.instanceCache.size;
    this.instanceCache.clear();
    
    // Optionally clear loaded classes too (more aggressive)
    // this.loadedSpecialists.clear();
    
    logger.info(`🧹 Cleared ${freedInstances} cached specialist instances`);
  }
  
  /**
   * Preload specific specialists (for critical ones)
   */
  preloadSpecialists(types = []) {
    const results = [];
    for (const type of types) {
      const specialist = this.getSpecialist(type);
      results.push({
        type,
        loaded: !!specialist
      });
    }
    return results;
  }
}

// Export singleton instance
let instance = null;

module.exports = {
  LazySpecialistRegistry,
  getInstance: () => {
    if (!instance) {
      instance = new LazySpecialistRegistry();
    }
    return instance;
  }
};