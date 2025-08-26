/**
 * BUMBA Similarity Calculator
 * Advanced similarity metrics for pattern matching
 * Part of Human Learning Module Enhancement - Sprint 1
 * 
 * FRAMEWORK DESIGN:
 * - Multiple similarity algorithms (cosine, euclidean, jaccard, etc.)
 * - Works with or without ML libraries
 * - Extensible for custom similarity metrics
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

// Check for ML library availability
let tf = null;
try {
  tf = require('@tensorflow/tfjs-node');
  logger.info('🔗 TensorFlow.js available for similarity calculations');
} catch (error) {
  logger.info('📐 Using mathematical similarity algorithms');
}

/**
 * Similarity Calculator for comparing patterns and contexts
 */
class SimilarityCalculator extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      defaultMetric: config.defaultMetric || 'cosine',
      threshold: config.threshold || 0.7,
      cacheSize: config.cacheSize || 1000,
      weights: config.weights || {},
      ...config
    };
    
    // Similarity cache for performance
    this.cache = new Map();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    
    // Metrics
    this.metrics = {
      calculations: 0,
      avgSimilarity: 0,
      avgProcessingTime: 0
    };
    
    this.initialize();
  }
  
  /**
   * Initialize similarity calculator
   */
  async initialize() {
    try {
      // Initialize metric functions
      this.initializeMetrics();
      
      logger.info('📏 Similarity Calculator initialized');
      
      this.emit('initialized', {
        metrics: Object.keys(this.metrics),
        tfAvailable: !!tf
      });
      
    } catch (error) {
      logger.error('Failed to initialize Similarity Calculator:', error);
    }
  }
  
  /**
   * Initialize similarity metric functions
   */
  initializeMetrics() {
    this.metricFunctions = {
      cosine: this.cosineSimilarity.bind(this),
      euclidean: this.euclideanSimilarity.bind(this),
      manhattan: this.manhattanSimilarity.bind(this),
      jaccard: this.jaccardSimilarity.bind(this),
      pearson: this.pearsonCorrelation.bind(this),
      hamming: this.hammingSimilarity.bind(this),
      levenshtein: this.levenshteinSimilarity.bind(this),
      semantic: this.semanticSimilarity.bind(this),
      structural: this.structuralSimilarity.bind(this),
      contextual: this.contextualSimilarity.bind(this),
      weighted: this.weightedSimilarity.bind(this),
      hybrid: this.hybridSimilarity.bind(this)
    };
  }
  
  /**
   * Calculate similarity between two items
   */
  async calculate(item1, item2, metric = null) {
    const startTime = Date.now();
    
    try {
      // Use specified metric or default
      metric = metric || this.config.defaultMetric;
      
      // Check cache
      const cacheKey = this.getCacheKey(item1, item2, metric);
      if (this.cache.has(cacheKey)) {
        this.cacheHits++;
        return this.cache.get(cacheKey);
      }
      this.cacheMisses++;
      
      // Get metric function
      const metricFn = this.metricFunctions[metric];
      if (!metricFn) {
        throw new Error(`Unknown similarity metric: ${metric}`);
      }
      
      // Calculate similarity
      const similarity = await metricFn(item1, item2);
      
      // Cache result
      this.addToCache(cacheKey, similarity);
      
      // Update metrics
      this.updateMetrics(similarity, Date.now() - startTime);
      
      return similarity;
      
    } catch (error) {
      logger.error(`Similarity calculation failed (${metric}):`, error);
      return 0;
    }
  }
  
  /**
   * Calculate multiple similarities
   */
  async calculateMultiple(item, items, metric = null) {
    const similarities = [];
    
    for (const otherItem of items) {
      const similarity = await this.calculate(item, otherItem, metric);
      similarities.push({
        item: otherItem,
        similarity,
        metric: metric || this.config.defaultMetric
      });
    }
    
    // Sort by similarity
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    return similarities;
  }
  
  /**
   * Find most similar items
   */
  async findMostSimilar(item, items, topK = 5, metric = null) {
    const similarities = await this.calculateMultiple(item, items, metric);
    return similarities.slice(0, topK);
  }
  
  /**
   * Cosine similarity
   */
  async cosineSimilarity(vec1, vec2) {
    const v1 = this.toVector(vec1);
    const v2 = this.toVector(vec2);
    
    if (tf) {
      // TensorFlow implementation
      return tf.tidy(() => {
        const a = tf.tensor1d(v1);
        const b = tf.tensor1d(v2);
        
        const dotProduct = tf.sum(tf.mul(a, b));
        const normA = tf.sqrt(tf.sum(tf.square(a)));
        const normB = tf.sqrt(tf.sum(tf.square(b)));
        
        const similarity = tf.div(dotProduct, tf.mul(normA, normB));
        return similarity.dataSync()[0];
      });
    } else {
      // Mathematical implementation
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      
      for (let i = 0; i < Math.min(v1.length, v2.length); i++) {
        dotProduct += v1[i] * v2[i];
        normA += v1[i] * v1[i];
        normB += v2[i] * v2[i];
      }
      
      normA = Math.sqrt(normA);
      normB = Math.sqrt(normB);
      
      if (normA === 0 || normB === 0) return 0;
      
      return dotProduct / (normA * normB);
    }
  }
  
  /**
   * Euclidean similarity (converted from distance)
   */
  async euclideanSimilarity(vec1, vec2) {
    const v1 = this.toVector(vec1);
    const v2 = this.toVector(vec2);
    
    let distance = 0;
    for (let i = 0; i < Math.min(v1.length, v2.length); i++) {
      distance += Math.pow(v1[i] - v2[i], 2);
    }
    
    distance = Math.sqrt(distance);
    
    // Convert distance to similarity (0-1)
    return 1 / (1 + distance);
  }
  
  /**
   * Manhattan similarity (converted from distance)
   */
  async manhattanSimilarity(vec1, vec2) {
    const v1 = this.toVector(vec1);
    const v2 = this.toVector(vec2);
    
    let distance = 0;
    for (let i = 0; i < Math.min(v1.length, v2.length); i++) {
      distance += Math.abs(v1[i] - v2[i]);
    }
    
    // Convert distance to similarity
    return 1 / (1 + distance);
  }
  
  /**
   * Jaccard similarity (for sets/binary vectors)
   */
  async jaccardSimilarity(set1, set2) {
    const s1 = new Set(Array.isArray(set1) ? set1 : this.toVector(set1));
    const s2 = new Set(Array.isArray(set2) ? set2 : this.toVector(set2));
    
    const intersection = new Set([...s1].filter(x => s2.has(x)));
    const union = new Set([...s1, ...s2]);
    
    if (union.size === 0) return 0;
    
    return intersection.size / union.size;
  }
  
  /**
   * Pearson correlation coefficient
   */
  async pearsonCorrelation(vec1, vec2) {
    const v1 = this.toVector(vec1);
    const v2 = this.toVector(vec2);
    
    const n = Math.min(v1.length, v2.length);
    if (n === 0) return 0;
    
    // Calculate means
    const mean1 = v1.reduce((sum, val) => sum + val, 0) / n;
    const mean2 = v2.reduce((sum, val) => sum + val, 0) / n;
    
    // Calculate correlation
    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;
    
    for (let i = 0; i < n; i++) {
      const diff1 = v1[i] - mean1;
      const diff2 = v2[i] - mean2;
      
      numerator += diff1 * diff2;
      denominator1 += diff1 * diff1;
      denominator2 += diff2 * diff2;
    }
    
    const denominator = Math.sqrt(denominator1 * denominator2);
    
    if (denominator === 0) return 0;
    
    // Normalize to 0-1 range
    return (numerator / denominator + 1) / 2;
  }
  
  /**
   * Hamming similarity (for binary/categorical data)
   */
  async hammingSimilarity(vec1, vec2) {
    const v1 = this.toVector(vec1);
    const v2 = this.toVector(vec2);
    
    const length = Math.min(v1.length, v2.length);
    if (length === 0) return 0;
    
    let matches = 0;
    for (let i = 0; i < length; i++) {
      if (v1[i] === v2[i]) matches++;
    }
    
    return matches / length;
  }
  
  /**
   * Levenshtein similarity (for strings)
   */
  async levenshteinSimilarity(str1, str2) {
    const s1 = typeof str1 === 'string' ? str1 : JSON.stringify(str1);
    const s2 = typeof str2 === 'string' ? str2 : JSON.stringify(str2);
    
    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    
    if (maxLength === 0) return 1;
    
    return 1 - (distance / maxLength);
  }
  
  /**
   * Semantic similarity (content-based)
   */
  async semanticSimilarity(item1, item2) {
    // Extract semantic features
    const features1 = this.extractSemanticFeatures(item1);
    const features2 = this.extractSemanticFeatures(item2);
    
    // Calculate cosine similarity of semantic features
    return this.cosineSimilarity(features1, features2);
  }
  
  /**
   * Structural similarity (for structured data)
   */
  async structuralSimilarity(item1, item2) {
    // Compare structure
    const struct1 = this.extractStructure(item1);
    const struct2 = this.extractStructure(item2);
    
    // Calculate similarity based on shared structure
    return this.compareStructures(struct1, struct2);
  }
  
  /**
   * Contextual similarity (context-aware)
   */
  async contextualSimilarity(item1, item2) {
    // Extract context
    const context1 = this.extractContext(item1);
    const context2 = this.extractContext(item2);
    
    // Multi-dimensional similarity
    const similarities = {
      temporal: await this.cosineSimilarity(context1.temporal, context2.temporal),
      semantic: await this.cosineSimilarity(context1.semantic, context2.semantic),
      behavioral: await this.cosineSimilarity(context1.behavioral, context2.behavioral)
    };
    
    // Weighted average
    const weights = this.config.weights.contextual || {
      temporal: 0.2,
      semantic: 0.5,
      behavioral: 0.3
    };
    
    return Object.entries(similarities).reduce((sum, [key, sim]) => 
      sum + sim * (weights[key] || 0.33), 0
    );
  }
  
  /**
   * Weighted similarity (custom weights for features)
   */
  async weightedSimilarity(item1, item2) {
    const features1 = this.extractFeatures(item1);
    const features2 = this.extractFeatures(item2);
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const [feature, weight] of Object.entries(this.config.weights)) {
      if (features1[feature] !== undefined && features2[feature] !== undefined) {
        const sim = await this.calculateFeatureSimilarity(
          features1[feature],
          features2[feature]
        );
        weightedSum += sim * weight;
        totalWeight += weight;
      }
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
  
  /**
   * Hybrid similarity (combination of multiple metrics)
   */
  async hybridSimilarity(item1, item2) {
    const metrics = ['cosine', 'euclidean', 'jaccard'];
    const similarities = [];
    
    for (const metric of metrics) {
      const similarity = await this.calculate(item1, item2, metric);
      similarities.push(similarity);
    }
    
    // Return average of all metrics
    return similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
  }
  
  /**
   * Find clusters based on similarity
   */
  async findClusters(items, threshold = null) {
    threshold = threshold || this.config.threshold;
    const clusters = [];
    const assigned = new Set();
    
    for (let i = 0; i < items.length; i++) {
      if (assigned.has(i)) continue;
      
      const cluster = [items[i]];
      assigned.add(i);
      
      for (let j = i + 1; j < items.length; j++) {
        if (assigned.has(j)) continue;
        
        const similarity = await this.calculate(items[i], items[j]);
        if (similarity >= threshold) {
          cluster.push(items[j]);
          assigned.add(j);
        }
      }
      
      clusters.push(cluster);
    }
    
    return clusters;
  }
  
  /**
   * Calculate similarity matrix
   */
  async calculateMatrix(items, metric = null) {
    const n = items.length;
    const matrix = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      matrix[i][i] = 1; // Self-similarity
      
      for (let j = i + 1; j < n; j++) {
        const similarity = await this.calculate(items[i], items[j], metric);
        matrix[i][j] = similarity;
        matrix[j][i] = similarity; // Symmetric
      }
    }
    
    return matrix;
  }
  
  // Helper methods
  
  toVector(item) {
    if (Array.isArray(item)) return item;
    
    if (typeof item === 'object' && item !== null) {
      // Extract numeric values from object
      const vector = [];
      const extractValues = (obj) => {
        Object.values(obj).forEach(value => {
          if (typeof value === 'number') {
            vector.push(value);
          } else if (typeof value === 'boolean') {
            vector.push(value ? 1 : 0);
          } else if (typeof value === 'object' && value !== null) {
            extractValues(value);
          }
        });
      };
      extractValues(item);
      return vector;
    }
    
    // Convert string to character codes
    if (typeof item === 'string') {
      return item.split('').map(char => char.charCodeAt(0));
    }
    
    return [item];
  }
  
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  extractSemanticFeatures(item) {
    // Extract semantic features from item
    const features = [];
    
    if (typeof item === 'string') {
      // Word frequency features
      const words = item.toLowerCase().split(/\s+/);
      const wordFreq = {};
      words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });
      
      // Convert to feature vector
      const commonWords = ['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an'];
      commonWords.forEach(word => {
        features.push(wordFreq[word] || 0);
      });
    } else if (typeof item === 'object') {
      // Extract features from object properties
      const props = ['type', 'category', 'value', 'score', 'confidence'];
      props.forEach(prop => {
        if (item[prop] !== undefined) {
          if (typeof item[prop] === 'number') {
            features.push(item[prop]);
          } else {
            features.push(item[prop] ? 1 : 0);
          }
        } else {
          features.push(0);
        }
      });
    }
    
    // Pad or truncate to fixed size
    const targetSize = 20;
    while (features.length < targetSize) features.push(0);
    if (features.length > targetSize) features.length = targetSize;
    
    return features;
  }
  
  extractStructure(item) {
    const structure = {
      type: typeof item,
      depth: 0,
      properties: [],
      arrayLength: 0
    };
    
    if (Array.isArray(item)) {
      structure.type = 'array';
      structure.arrayLength = item.length;
      if (item.length > 0) {
        structure.elementType = typeof item[0];
      }
    } else if (typeof item === 'object' && item !== null) {
      structure.properties = Object.keys(item).sort();
      structure.depth = this.getObjectDepth(item);
    }
    
    return structure;
  }
  
  getObjectDepth(obj, currentDepth = 0) {
    if (typeof obj !== 'object' || obj === null) return currentDepth;
    
    let maxDepth = currentDepth;
    Object.values(obj).forEach(value => {
      if (typeof value === 'object' && value !== null) {
        const depth = this.getObjectDepth(value, currentDepth + 1);
        maxDepth = Math.max(maxDepth, depth);
      }
    });
    
    return maxDepth;
  }
  
  compareStructures(struct1, struct2) {
    let similarity = 0;
    let factors = 0;
    
    // Type similarity
    if (struct1.type === struct2.type) {
      similarity += 1;
    }
    factors++;
    
    // Property similarity (for objects)
    if (struct1.properties && struct2.properties) {
      const props1 = new Set(struct1.properties);
      const props2 = new Set(struct2.properties);
      const intersection = new Set([...props1].filter(x => props2.has(x)));
      const union = new Set([...props1, ...props2]);
      
      if (union.size > 0) {
        similarity += intersection.size / union.size;
        factors++;
      }
    }
    
    // Depth similarity
    if (struct1.depth !== undefined && struct2.depth !== undefined) {
      const maxDepth = Math.max(struct1.depth, struct2.depth);
      if (maxDepth > 0) {
        similarity += 1 - Math.abs(struct1.depth - struct2.depth) / maxDepth;
        factors++;
      }
    }
    
    // Array length similarity
    if (struct1.arrayLength !== undefined && struct2.arrayLength !== undefined) {
      const maxLength = Math.max(struct1.arrayLength, struct2.arrayLength);
      if (maxLength > 0) {
        similarity += 1 - Math.abs(struct1.arrayLength - struct2.arrayLength) / maxLength;
        factors++;
      }
    }
    
    return factors > 0 ? similarity / factors : 0;
  }
  
  extractContext(item) {
    return {
      temporal: item.temporal || item.timestamp || [Date.now()],
      semantic: item.semantic || item.content || [],
      behavioral: item.behavioral || item.behavior || []
    };
  }
  
  extractFeatures(item) {
    const features = {};
    
    if (typeof item === 'object' && item !== null) {
      // Extract all numeric and boolean features
      const extract = (obj, prefix = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          const featureKey = prefix ? `${prefix}.${key}` : key;
          
          if (typeof value === 'number' || typeof value === 'boolean') {
            features[featureKey] = value;
          } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            extract(value, featureKey);
          }
        });
      };
      
      extract(item);
    }
    
    return features;
  }
  
  calculateFeatureSimilarity(feature1, feature2) {
    if (typeof feature1 === 'number' && typeof feature2 === 'number') {
      // Numeric similarity
      const diff = Math.abs(feature1 - feature2);
      const max = Math.max(Math.abs(feature1), Math.abs(feature2));
      return max === 0 ? 1 : 1 - (diff / max);
    }
    
    if (typeof feature1 === 'boolean' && typeof feature2 === 'boolean') {
      // Boolean similarity
      return feature1 === feature2 ? 1 : 0;
    }
    
    // String similarity
    return this.levenshteinSimilarity(String(feature1), String(feature2));
  }
  
  getCacheKey(item1, item2, metric) {
    const hash1 = this.hashItem(item1);
    const hash2 = this.hashItem(item2);
    
    // Ensure consistent ordering
    const [h1, h2] = hash1 < hash2 ? [hash1, hash2] : [hash2, hash1];
    
    return `${h1}-${h2}-${metric}`;
  }
  
  hashItem(item) {
    const str = JSON.stringify(item);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(36);
  }
  
  addToCache(key, value) {
    // Limit cache size
    if (this.cache.size >= this.config.cacheSize) {
      // Remove oldest entry (FIFO)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, value);
  }
  
  updateMetrics(similarity, processingTime) {
    this.metrics.calculations++;
    
    // Update average similarity
    this.metrics.avgSimilarity = 
      (this.metrics.avgSimilarity * (this.metrics.calculations - 1) + similarity) / 
      this.metrics.calculations;
    
    // Update average processing time
    this.metrics.avgProcessingTime = 
      (this.metrics.avgProcessingTime * (this.metrics.calculations - 1) + processingTime) / 
      this.metrics.calculations;
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      cacheHitRate: this.cacheHits / Math.max(1, this.cacheHits + this.cacheMisses),
      availableMetrics: Object.keys(this.metricFunctions)
    };
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    logger.info('Similarity cache cleared');
  }
  
  /**
   * Set default metric
   */
  setDefaultMetric(metric) {
    if (!this.metricFunctions[metric]) {
      throw new Error(`Unknown metric: ${metric}`);
    }
    
    this.config.defaultMetric = metric;
    logger.info(`Default similarity metric set to: ${metric}`);
  }
  
  /**
   * Add custom metric
   */
  addCustomMetric(name, fn) {
    if (typeof fn !== 'function') {
      throw new Error('Metric must be a function');
    }
    
    this.metricFunctions[name] = fn.bind(this);
    logger.info(`Custom similarity metric added: ${name}`);
  }
}

module.exports = SimilarityCalculator;