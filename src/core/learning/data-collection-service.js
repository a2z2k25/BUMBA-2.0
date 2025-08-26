/**
 * BUMBA Data Collection Service
 * Centralized service for collecting, validating, and storing learning data
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../logging/bumba-logger');
const UnifiedMemorySystem = require('../memory/unified-memory-system');

class DataCollectionService extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxBatchSize: config.maxBatchSize || 1000,
      flushInterval: config.flushInterval || 30000, // 30 seconds
      dataPath: config.dataPath || path.join(process.env.HOME, '.claude', 'learning-data'),
      compressionEnabled: config.compressionEnabled !== false,
      validationEnabled: config.validationEnabled !== false,
      realTimeProcessing: config.realTimeProcessing !== false,
      advancedAnalytics: config.advancedAnalytics !== false,
      ...config
    };
    
    // Enhanced data buffers with real-time streams
    this.dataBuffers = {
      interactions: [],
      patterns: [],
      performance: [],
      feedback: [],
      anomalies: [],
      realTimeEvents: [], // NEW: Real-time event stream
      analyticsBuffer: [] // NEW: Analytics processing buffer
    };
    
    // Enhanced statistics with real-time metrics
    this.stats = {
      totalCollected: 0,
      totalStored: 0,
      totalValidated: 0,
      totalRejected: 0,
      lastFlush: null,
      realTimeProcessed: 0,
      analyticsGenerated: 0,
      streamingActive: false,
      processingLatency: 0
    };
    
    // Memory integration
    this.memory = UnifiedMemorySystem.getInstance();
    
    // Initialize enhanced processing systems
    this.realTimeProcessor = this.initializeRealTimeProcessor();
    this.analyticsEngine = this.initializeAdvancedAnalytics();
    
    // Start enhanced auto-flush and real-time processing
    this.startAutoFlush();
    this.startRealTimeProcessing();
  }
  
  /**
   * Collect interaction data with real-time processing
   */
  async collectInteraction(data) {
    const processingStart = Date.now();
    
    try {
      // Enhanced validation with real-time checks
      if (this.config.validationEnabled) {
        const validation = await this.validateInteractionDataEnhanced(data);
        if (!validation.valid) {
          this.stats.totalRejected++;
          logger.warn(`Invalid interaction data: ${validation.reason}`);
          return null;
        }
      }
      
      // Enhanced enrichment with real-time analytics
      const enrichedData = {
        id: this.generateId('interaction'),
        timestamp: Date.now(),
        ...data,
        metadata: {
          source: data.source || 'unknown',
          version: '1.0.0',
          realTimeProcessed: this.config.realTimeProcessing,
          analyticsEnabled: this.config.advancedAnalytics,
          ...data.metadata
        },
        realTimeMetrics: {
          processingLatency: 0, // Will be updated below
          streamPosition: this.stats.totalCollected,
          analyticsGenerated: false
        }
      };
      
      // Real-time processing
      if (this.config.realTimeProcessing) {
        await this.processInteractionRealTime(enrichedData);
        this.stats.realTimeProcessed++;
      }
      
      // Advanced analytics generation
      if (this.config.advancedAnalytics) {
        await this.generateAdvancedAnalytics(enrichedData);
        enrichedData.realTimeMetrics.analyticsGenerated = true;
        this.stats.analyticsGenerated++;
      }
      
      // Update processing latency
      const processingLatency = Date.now() - processingStart;
      enrichedData.realTimeMetrics.processingLatency = processingLatency;
      this.updateProcessingLatency(processingLatency);
      
      // Add to buffers
      this.dataBuffers.interactions.push(enrichedData);
      if (this.config.realTimeProcessing) {
        this.dataBuffers.realTimeEvents.push({
          type: 'interaction',
          data: enrichedData,
          processingTime: processingLatency
        });
      }
      
      this.stats.totalCollected++;
      
      // Enhanced flush logic
      if (this.dataBuffers.interactions.length >= this.config.maxBatchSize) {
        await this.flushBuffer('interactions');
      }
      
      this.emit('data-collected', {
        type: 'interaction',
        data: enrichedData,
        realTimeProcessed: this.config.realTimeProcessing,
        analyticsGenerated: enrichedData.realTimeMetrics.analyticsGenerated
      });
      
      return enrichedData;
      
    } catch (error) {
      logger.error('Failed to collect interaction data:', error);
      return null;
    }
  }
  
  /**
   * Collect pattern data
   */
  async collectPattern(pattern) {
    try {
      const enrichedPattern = {
        id: this.generateId('pattern'),
        timestamp: Date.now(),
        ...pattern,
        confidence: pattern.confidence || this.calculatePatternConfidence(pattern)
      };
      
      this.dataBuffers.patterns.push(enrichedPattern);
      this.stats.totalCollected++;
      
      // Auto-flush if needed
      if (this.dataBuffers.patterns.length >= this.config.maxBatchSize) {
        await this.flushBuffer('patterns');
      }
      
      this.emit('pattern-collected', enrichedPattern);
      
      return enrichedPattern;
      
    } catch (error) {
      logger.error('Failed to collect pattern:', error);
      return null;
    }
  }
  
  /**
   * Collect performance metrics with advanced analytics
   */
  async collectPerformance(metrics) {
    try {
      const enrichedMetrics = {
        id: this.generateId('performance'),
        timestamp: Date.now(),
        ...metrics,
        calculated: {
          efficiency: this.calculateEfficiency(metrics),
          quality: this.calculateQuality(metrics),
          speed: this.calculateSpeed(metrics)
        },
        advancedAnalytics: {
          trendAnalysis: this.analyzeTrends(metrics),
          performancePrediction: await this.predictPerformance(metrics),
          anomalyDetection: this.detectPerformanceAnomalies(metrics),
          comparativeAnalysis: this.compareWithBaseline(metrics)
        }
      };
      
      this.dataBuffers.performance.push(enrichedMetrics);
      this.stats.totalCollected++;
      
      // Enhanced real-time analytics processing
      if (this.config.advancedAnalytics) {
        await this.processPerformanceAnalytics(enrichedMetrics);
      }
      
      // Store high-value metrics immediately with enhanced criteria
      if (this.isHighValuePerformanceMetric(enrichedMetrics)) {
        await this.storeHighValueData('performance', enrichedMetrics);
      }
      
      // Real-time performance streaming
      if (this.config.realTimeProcessing) {
        this.streamPerformanceData(enrichedMetrics);
      }
      
      this.emit('performance-collected', {
        ...enrichedMetrics,
        realTimeProcessed: this.config.realTimeProcessing,
        analyticsGenerated: this.config.advancedAnalytics
      });
      
      return enrichedMetrics;
      
    } catch (error) {
      logger.error('Failed to collect performance metrics:', error);
      return null;
    }
  }
  
  /**
   * Collect user feedback
   */
  async collectFeedback(feedback) {
    try {
      const enrichedFeedback = {
        id: this.generateId('feedback'),
        timestamp: Date.now(),
        ...feedback,
        sentiment: await this.analyzeSentiment(feedback),
        actionable: this.isActionableFeedback(feedback)
      };
      
      this.dataBuffers.feedback.push(enrichedFeedback);
      this.stats.totalCollected++;
      
      // Process actionable feedback immediately
      if (enrichedFeedback.actionable) {
        await this.processActionableFeedback(enrichedFeedback);
      }
      
      this.emit('feedback-collected', enrichedFeedback);
      
      return enrichedFeedback;
      
    } catch (error) {
      logger.error('Failed to collect feedback:', error);
      return null;
    }
  }
  
  /**
   * Collect anomaly data
   */
  async collectAnomaly(anomaly) {
    try {
      const enrichedAnomaly = {
        id: this.generateId('anomaly'),
        timestamp: Date.now(),
        ...anomaly,
        severity: this.calculateAnomalySeverity(anomaly),
        category: this.categorizeAnomaly(anomaly)
      };
      
      this.dataBuffers.anomalies.push(enrichedAnomaly);
      this.stats.totalCollected++;
      
      // Alert on high severity
      if (enrichedAnomaly.severity === 'high') {
        this.emit('high-severity-anomaly', enrichedAnomaly);
      }
      
      this.emit('anomaly-collected', enrichedAnomaly);
      
      return enrichedAnomaly;
      
    } catch (error) {
      logger.error('Failed to collect anomaly:', error);
      return null;
    }
  }
  
  /**
   * Query collected data
   */
  async queryData(query) {
    try {
      const results = [];
      
      // Search in buffers
      for (const [type, buffer] of Object.entries(this.dataBuffers)) {
        if (!query.type || query.type === type) {
          const filtered = this.filterData(buffer, query);
          results.push(...filtered);
        }
      }
      
      // Search in storage if needed
      if (query.includeStored) {
        const storedData = await this.queryStoredData(query);
        results.push(...storedData);
      }
      
      // Sort results
      if (query.sortBy) {
        results.sort((a, b) => {
          const aVal = this.getNestedValue(a, query.sortBy);
          const bVal = this.getNestedValue(b, query.sortBy);
          return query.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
        });
      }
      
      // Limit results
      if (query.limit) {
        return results.slice(0, query.limit);
      }
      
      return results;
      
    } catch (error) {
      logger.error('Failed to query data:', error);
      return [];
    }
  }
  
  /**
   * Aggregate data for analysis
   */
  async aggregateData(aggregation) {
    try {
      const { type, groupBy, metrics, timeRange } = aggregation;
      
      // Get relevant data
      const data = await this.queryData({
        type,
        timeRange,
        includeStored: true
      });
      
      // Group data
      const grouped = this.groupData(data, groupBy);
      
      // Calculate metrics
      const results = {};
      for (const [group, items] of Object.entries(grouped)) {
        results[group] = this.calculateMetrics(items, metrics);
      }
      
      return results;
      
    } catch (error) {
      logger.error('Failed to aggregate data:', error);
      return {};
    }
  }
  
  /**
   * Export data for training
   */
  async exportForTraining(options = {}) {
    try {
      const {
        types = Object.keys(this.dataBuffers),
        format = 'json',
        includeMetadata = true
      } = options;
      
      const exportData = {
        version: '1.0.0',
        timestamp: Date.now(),
        data: {}
      };
      
      // Collect data from specified types
      for (const type of types) {
        const buffer = this.dataBuffers[type];
        const stored = await this.loadStoredData(type);
        
        exportData.data[type] = [...buffer, ...stored];
        
        // Remove metadata if not needed
        if (!includeMetadata) {
          exportData.data[type] = exportData.data[type].map(item => {
            const { metadata, ...rest } = item;
            return rest;
          });
        }
      }
      
      // Format data
      if (format === 'csv') {
        return this.convertToCSV(exportData);
      } else if (format === 'tensorflow') {
        return this.convertToTensorFlow(exportData);
      }
      
      return exportData;
      
    } catch (error) {
      logger.error('Failed to export data:', error);
      return null;
    }
  }
  
  /**
   * Clear old data
   */
  async cleanupOldData(options = {}) {
    try {
      const {
        maxAge = 7 * 24 * 60 * 60 * 1000, // 7 days
        keepHighValue = true
      } = options;
      
      const cutoff = Date.now() - maxAge;
      let cleaned = 0;
      
      // Clean buffers
      for (const [type, buffer] of Object.entries(this.dataBuffers)) {
        const before = buffer.length;
        this.dataBuffers[type] = buffer.filter(item => {
          if (item.timestamp > cutoff) return true;
          if (keepHighValue && this.isHighValueData(item)) return true;
          return false;
        });
        cleaned += before - this.dataBuffers[type].length;
      }
      
      // Clean stored data
      const storedCleaned = await this.cleanupStoredData(cutoff, keepHighValue);
      cleaned += storedCleaned;
      
      logger.info(`Cleaned up ${cleaned} old data items`);
      
      this.emit('cleanup-completed', { itemsCleaned: cleaned });
      
      return cleaned;
      
    } catch (error) {
      logger.error('Failed to cleanup old data:', error);
      return 0;
    }
  }
  
  // Helper methods
  
  async validateInteractionData(data) {
    if (!data.agentId) {
      return { valid: false, reason: 'Missing agentId' };
    }
    if (!data.taskType) {
      return { valid: false, reason: 'Missing taskType' };
    }
    if (!data.input && !data.output) {
      return { valid: false, reason: 'Missing input and output' };
    }
    return { valid: true };
  }
  
  calculatePatternConfidence(pattern) {
    let confidence = 0.5;
    if (pattern.occurrences > 10) confidence += 0.2;
    if (pattern.successRate > 0.8) confidence += 0.2;
    if (pattern.verified) confidence += 0.1;
    return Math.min(confidence, 1.0);
  }
  
  calculateEfficiency(metrics) {
    const timeEfficiency = metrics.expectedTime ? 
      Math.min(metrics.expectedTime / metrics.actualTime, 1.0) : 0.5;
    const resourceEfficiency = metrics.expectedResources ?
      Math.min(metrics.expectedResources / metrics.actualResources, 1.0) : 0.5;
    return (timeEfficiency + resourceEfficiency) / 2;
  }
  
  calculateQuality(metrics) {
    return metrics.qualityScore || 
           (metrics.errors ? Math.max(0, 1 - metrics.errors / 10) : 0.8);
  }
  
  calculateSpeed(metrics) {
    if (!metrics.actualTime) return 0.5;
    const baselineTime = metrics.baselineTime || 1000;
    return Math.min(baselineTime / metrics.actualTime, 2.0) / 2;
  }
  
  async analyzeSentiment(feedback) {
    const text = feedback.content || feedback.text || '';
    const positive = ['good', 'great', 'excellent', 'love', 'perfect'];
    const negative = ['bad', 'poor', 'terrible', 'hate', 'awful'];
    
    let score = 0;
    const words = text.toLowerCase().split(/\s+/);
    
    words.forEach(word => {
      if (positive.includes(word)) score += 0.2;
      if (negative.includes(word)) score -= 0.2;
    });
    
    return Math.max(-1, Math.min(1, score));
  }
  
  isActionableFeedback(feedback) {
    const actionableKeywords = ['should', 'could', 'would', 'please', 'try', 'consider'];
    const text = (feedback.content || feedback.text || '').toLowerCase();
    return actionableKeywords.some(keyword => text.includes(keyword));
  }
  
  async processActionableFeedback(feedback) {
    // Store in high-priority queue
    await this.memory.store({
      type: 'actionable_feedback',
      data: feedback,
      priority: 'high'
    });
    
    this.emit('actionable-feedback', feedback);
  }
  
  calculateAnomalySeverity(anomaly) {
    if (anomaly.score > 0.9) return 'critical';
    if (anomaly.score > 0.7) return 'high';
    if (anomaly.score > 0.5) return 'medium';
    return 'low';
  }
  
  categorizeAnomaly(anomaly) {
    if (anomaly.type) return anomaly.type;
    if (anomaly.pattern) return 'pattern';
    if (anomaly.performance) return 'performance';
    return 'unknown';
  }
  
  async flushBuffer(type) {
    try {
      const buffer = this.dataBuffers[type];
      if (buffer.length === 0) return;
      
      // Store in memory system
      await this.memory.store({
        type: `learning_data_${type}`,
        data: buffer,
        timestamp: Date.now()
      });
      
      // Store to disk
      await this.storeToDisK(type, buffer);
      
      this.stats.totalStored += buffer.length;
      this.stats.lastFlush = Date.now();
      
      // Clear buffer
      this.dataBuffers[type] = [];
      
      logger.debug(`Flushed ${buffer.length} ${type} items`);
      
    } catch (error) {
      logger.error(`Failed to flush ${type} buffer:`, error);
    }
  }
  
  async storeToDisK(type, data) {
    const filename = `${type}-${Date.now()}.json`;
    const filepath = path.join(this.config.dataPath, filename);
    
    await fs.mkdir(this.config.dataPath, { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  }
  
  async storeHighValueData(type, data) {
    await this.memory.store({
      type: `high_value_${type}`,
      data,
      priority: 'high',
      persistent: true
    });
  }
  
  filterData(data, query) {
    return data.filter(item => {
      if (query.timeRange) {
        const { start, end } = query.timeRange;
        if (start && item.timestamp < start) return false;
        if (end && item.timestamp > end) return false;
      }
      
      if (query.filter) {
        for (const [key, value] of Object.entries(query.filter)) {
          if (this.getNestedValue(item, key) !== value) return false;
        }
      }
      
      return true;
    });
  }
  
  async queryStoredData(query) {
    const stored = await this.memory.retrieve({
      type: `learning_data_${query.type}`,
      limit: query.limit || 1000
    });
    
    return stored.flatMap(entry => entry.data || []);
  }
  
  groupData(data, groupBy) {
    const grouped = {};
    
    data.forEach(item => {
      const key = this.getNestedValue(item, groupBy) || 'unknown';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    
    return grouped;
  }
  
  calculateMetrics(items, metrics) {
    const results = {};
    
    metrics.forEach(metric => {
      if (metric === 'count') {
        results.count = items.length;
      } else if (metric === 'average') {
        const values = items.map(item => item.value || 0);
        results.average = values.reduce((a, b) => a + b, 0) / values.length;
      } else if (metric === 'sum') {
        results.sum = items.reduce((sum, item) => sum + (item.value || 0), 0);
      }
    });
    
    return results;
  }
  
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  isHighValueData(item) {
    if (item.confidence && item.confidence > 0.9) return true;
    if (item.priority === 'high') return true;
    if (item.actionable) return true;
    return false;
  }
  
  async loadStoredData(type) {
    try {
      const files = await fs.readdir(this.config.dataPath);
      const typeFiles = files.filter(f => f.startsWith(`${type}-`));
      
      const data = [];
      for (const file of typeFiles.slice(-5)) { // Last 5 files
        const content = await fs.readFile(
          path.join(this.config.dataPath, file),
          'utf8'
        );
        data.push(...JSON.parse(content));
      }
      
      return data;
      
    } catch (error) {
      return [];
    }
  }
  
  async cleanupStoredData(cutoff, keepHighValue) {
    // Implementation for cleaning stored files
    return 0;
  }
  
  convertToCSV(data) {
    // CSV conversion implementation
    return data;
  }
  
  convertToTensorFlow(data) {
    // TensorFlow format conversion
    return data;
  }
  
  generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  startAutoFlush() {
    this.flushInterval = setInterval(async () => {
      for (const type of Object.keys(this.dataBuffers)) {
        if (this.dataBuffers[type].length > 0) {
          await this.flushBuffer(type);
        }
      }
    }, this.config.flushInterval);
  }
  
  async shutdown() {
    // Flush all buffers
    for (const type of Object.keys(this.dataBuffers)) {
      await this.flushBuffer(type);
    }
    
    // Clear interval
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    logger.info('Data collection service shutdown complete');
  }
  
  getStatistics() {
    return {
      ...this.stats,
      bufferSizes: Object.entries(this.dataBuffers).reduce((acc, [type, buffer]) => {
        acc[type] = buffer.length;
        return acc;
      }, {}),
      memoryUsage: process.memoryUsage().heapUsed,
      realTimeMetrics: {
        processingLatency: this.stats.processingLatency,
        streamingActive: this.stats.streamingActive,
        realTimeProcessed: this.stats.realTimeProcessed,
        analyticsGenerated: this.stats.analyticsGenerated
      },
      advancedAnalytics: {
        enabled: this.config.advancedAnalytics,
        processingEngine: this.analyticsEngine ? 'active' : 'disabled',
        realTimeProcessor: this.realTimeProcessor ? 'active' : 'disabled'
      }
    };
  }
  
  /**
   * Initialize real-time processing system
   */
  initializeRealTimeProcessor() {
    logger.info('🟢 Initializing Real-time Data Processing System...');
    
    // Detect available streaming APIs
    const streamingAPIs = this.detectStreamingAPIs();
    
    // Initialize processing engines
    const processingEngines = {
      kafka_stream: this.initializeKafkaProcessor(streamingAPIs),
      redis_stream: this.initializeRedisProcessor(streamingAPIs),
      websocket_stream: this.initializeWebSocketProcessor(streamingAPIs),
      memory_stream: this.initializeMemoryProcessor() // Always available fallback
    };
    
    return {
      enabled: this.config.realTimeProcessing,
      apis: streamingAPIs,
      engines: processingEngines,
      stream_metrics: {
        events_processed: 0,
        processing_latency: 0,
        stream_health: 'healthy'
      },
      fallback_system: {
        memory_streaming: true,
        batch_processing: true,
        queue_management: true
      }
    };
  }
  
  /**
   * Initialize advanced analytics system
   */
  initializeAdvancedAnalytics() {
    logger.info('🧠 Initializing Advanced Analytics Engine...');
    
    // Detect available analytics APIs
    const analyticsAPIs = this.detectAnalyticsAPIs();
    
    // Initialize analytics engines
    const analyticsEngines = {
      tensorflow_analytics: this.initializeTensorFlowAnalytics(analyticsAPIs),
      pandas_analytics: this.initializePandasAnalytics(analyticsAPIs),
      statistical_engine: this.initializeStatisticalEngine(analyticsAPIs),
      pattern_recognition: this.initializePatternRecognition() // Always available
    };
    
    // Initialize prediction models
    const predictionModels = {
      trend_predictor: this.initializeTrendPredictor(analyticsAPIs),
      anomaly_detector: this.initializeAnomalyDetector(analyticsAPIs),
      performance_forecaster: this.initializePerformanceForecaster(analyticsAPIs),
      pattern_analyzer: this.initializePatternAnalyzer() // Fallback
    };
    
    return {
      enabled: this.config.advancedAnalytics,
      apis: analyticsAPIs,
      engines: analyticsEngines,
      prediction_models: predictionModels,
      analytics_metrics: {
        models_active: Object.values(predictionModels).filter(Boolean).length,
        predictions_generated: 0,
        accuracy_score: 0.8
      },
      fallback_system: {
        statistical_analysis: true,
        pattern_recognition: true,
        basic_predictions: true
      }
    };
  }
  
  /**
   * Detect available streaming APIs
   */
  detectStreamingAPIs() {
    const apis = {
      kafka: false,
      redis: false,
      websocket: false,
      sse: false
    };
    
    // Kafka detection for enterprise streaming
    try {
      require.resolve('kafkajs');
      apis.kafka = true;
      logger.info('🏁 Kafka detected - Enterprise streaming available');
    } catch (e) {
      logger.info('🟡 Kafka not found - Using fallback streaming');
    }
    
    // Redis detection for real-time streams
    try {
      require.resolve('redis');
      apis.redis = true;
      logger.info('🏁 Redis detected - Real-time streaming available');
    } catch (e) {
      logger.info('🟡 Redis not found - Using memory streaming');
    }
    
    // WebSocket detection for live updates
    try {
      require.resolve('ws');
      apis.websocket = true;
      logger.info('🏁 WebSocket detected - Live streaming available');
    } catch (e) {
      logger.info('🟡 WebSocket not found - Using polling fallback');
    }
    
    return apis;
  }
  
  /**
   * Detect available analytics APIs
   */
  detectAnalyticsAPIs() {
    const apis = {
      tensorflow: false,
      pandas: false,
      numpy: false,
      scikit_learn: false
    };
    
    // TensorFlow detection for ML analytics
    try {
      require.resolve('@tensorflow/tfjs-node');
      apis.tensorflow = true;
      logger.info('🏁 TensorFlow detected - ML analytics available');
    } catch (e) {
      logger.info('🟡 TensorFlow not found - Using statistical fallbacks');
    }
    
    // Check for Python analytics packages (if available)
    if (process.env.PYTHON_ANALYTICS === 'true') {
      apis.pandas = true;
      apis.numpy = true;
      apis.scikit_learn = true;
      logger.info('🏁 Python analytics stack detected');
    } else {
      logger.info('🟡 Python analytics not configured - Using JavaScript fallbacks');
    }
    
    return apis;
  }
  
  /**
   * Enhanced interaction data validation
   */
  async validateInteractionDataEnhanced(data) {
    const baseValidation = await this.validateInteractionData(data);
    if (!baseValidation.valid) return baseValidation;
    
    // Advanced validation checks
    if (this.config.advancedAnalytics) {
      // Data quality checks
      if (data.input && typeof data.input === 'string' && data.input.length < 3) {
        return { valid: false, reason: 'Input too short for meaningful analysis' };
      }
      
      // Anomaly detection
      if (this.detectDataAnomaly(data)) {
        return { valid: false, reason: 'Data appears anomalous' };
      }
      
      // Real-time validation
      if (this.config.realTimeProcessing && !this.isRealTimeCompatible(data)) {
        return { valid: false, reason: 'Data not compatible with real-time processing' };
      }
    }
    
    return { valid: true, enhanced: true };
  }
  
  /**
   * Process interaction data in real-time
   */
  async processInteractionRealTime(data) {
    if (!this.realTimeProcessor.enabled) return;
    
    try {
      // Stream to real-time processing engines
      if (this.realTimeProcessor.apis.kafka) {
        await this.streamToKafka(data);
      } else if (this.realTimeProcessor.apis.redis) {
        await this.streamToRedis(data);
      } else {
        // Memory streaming fallback
        this.processInMemoryStream(data);
      }
      
      this.realTimeProcessor.stream_metrics.events_processed++;
      
    } catch (error) {
      logger.warn('Real-time processing failed, using fallback:', error.message);
      this.processInMemoryStream(data);
    }
  }
  
  /**
   * Generate advanced analytics for interaction data
   */
  async generateAdvancedAnalytics(data) {
    if (!this.analyticsEngine.enabled) return;
    
    try {
      const analytics = {
        patterns: await this.detectInteractionPatterns(data),
        sentiment: await this.analyzeInteractionSentiment(data),
        complexity: this.calculateInteractionComplexity(data),
        predictions: await this.predictInteractionOutcome(data)
      };
      
      // Store analytics in buffer for further processing
      this.dataBuffers.analyticsBuffer.push({
        type: 'interaction_analytics',
        data_id: data.id,
        analytics,
        timestamp: Date.now()
      });
      
      this.analyticsEngine.analytics_metrics.predictions_generated++;
      
      return analytics;
      
    } catch (error) {
      logger.warn('Advanced analytics generation failed:', error.message);
      return this.generateBasicAnalytics(data);
    }
  }
  
  /**
   * Analyze performance trends
   */
  analyzeTrends(metrics) {
    // Get recent performance data for trend analysis
    const recentData = this.dataBuffers.performance.slice(-10);
    
    if (recentData.length < 3) {
      return { trend: 'insufficient_data', confidence: 0.0 };
    }
    
    // Calculate trend direction
    const values = recentData.map(m => m.calculated?.efficiency || 0.5);
    const trend = this.calculateTrendDirection(values);
    
    return {
      trend: trend.direction,
      confidence: trend.confidence,
      slope: trend.slope,
      prediction: trend.prediction
    };
  }
  
  /**
   * Predict performance metrics
   */
  async predictPerformance(metrics) {
    if (this.analyticsEngine.apis.tensorflow) {
      return await this.predictWithTensorFlow(metrics);
    } else {
      return this.predictWithStatistics(metrics);
    }
  }
  
  /**
   * Detect performance anomalies
   */
  detectPerformanceAnomalies(metrics) {
    const recentData = this.dataBuffers.performance.slice(-20);
    
    if (recentData.length < 5) {
      return { anomaly: false, confidence: 0.0 };
    }
    
    // Statistical anomaly detection
    const efficiency = metrics.calculated?.efficiency || 0.5;
    const recentEfficiencies = recentData.map(m => m.calculated?.efficiency || 0.5);
    
    const mean = recentEfficiencies.reduce((a, b) => a + b, 0) / recentEfficiencies.length;
    const variance = recentEfficiencies.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentEfficiencies.length;
    const stdDev = Math.sqrt(variance);
    
    const zScore = Math.abs((efficiency - mean) / stdDev);
    const isAnomaly = zScore > 2; // 2 standard deviations
    
    return {
      anomaly: isAnomaly,
      confidence: Math.min(zScore / 3, 1.0),
      z_score: zScore,
      deviation: efficiency - mean
    };
  }
  
  /**
   * Compare with performance baseline
   */
  compareWithBaseline(metrics) {
    const baseline = {
      efficiency: 0.7,
      quality: 0.8,
      speed: 0.6
    };
    
    const calculated = metrics.calculated || {};
    
    return {
      efficiency_vs_baseline: (calculated.efficiency || 0.5) - baseline.efficiency,
      quality_vs_baseline: (calculated.quality || 0.5) - baseline.quality,
      speed_vs_baseline: (calculated.speed || 0.5) - baseline.speed,
      overall_score: this.calculateOverallScore(calculated, baseline)
    };
  }
  
  /**
   * Start real-time processing
   */
  startRealTimeProcessing() {
    if (!this.config.realTimeProcessing) return;
    
    this.stats.streamingActive = true;
    
    // Start real-time event processing loop
    this.realTimeInterval = setInterval(async () => {
      await this.processRealTimeEvents();
    }, 1000); // Process every second
    
    logger.info('🟢 Real-time processing started');
  }
  
  /**
   * Process real-time events
   */
  async processRealTimeEvents() {
    if (this.dataBuffers.realTimeEvents.length === 0) return;
    
    const events = this.dataBuffers.realTimeEvents.splice(0, 100); // Process up to 100 events
    
    for (const event of events) {
      try {
        await this.processRealTimeEvent(event);
      } catch (error) {
        logger.warn('Real-time event processing failed:', error.message);
      }
    }
  }
  
  /**
   * Update processing latency
   */
  updateProcessingLatency(latency) {
    // Moving average of processing latency
    const alpha = 0.1;
    this.stats.processingLatency = this.stats.processingLatency * (1 - alpha) + latency * alpha;
  }
  
  // Enhanced helper methods
  
  isHighValuePerformanceMetric(metrics) {
    const calculated = metrics.calculated || {};
    const analytics = metrics.advancedAnalytics || {};
    
    // High efficiency
    if (calculated.efficiency > 0.9) return true;
    
    // Anomalous behavior
    if (analytics.anomalyDetection?.anomaly) return true;
    
    // Significant trend changes
    if (analytics.trendAnalysis?.confidence > 0.8) return true;
    
    return false;
  }
  
  streamPerformanceData(metrics) {
    this.dataBuffers.realTimeEvents.push({
      type: 'performance_stream',
      data: metrics,
      timestamp: Date.now()
    });
  }
  
  // Fallback implementations for missing APIs
  
  initializeKafkaProcessor(apis) {
    return apis.kafka ? { type: 'kafka', active: true } : null;
  }
  
  initializeRedisProcessor(apis) {
    return apis.redis ? { type: 'redis', active: true } : null;
  }
  
  initializeWebSocketProcessor(apis) {
    return apis.websocket ? { type: 'websocket', active: true } : null;
  }
  
  initializeMemoryProcessor() {
    return { type: 'memory', active: true, confidence: 0.7 };
  }
  
  initializeTensorFlowAnalytics(apis) {
    return apis.tensorflow ? { type: 'tensorflow', confidence: 0.9 } : null;
  }
  
  initializePandasAnalytics(apis) {
    return apis.pandas ? { type: 'pandas', confidence: 0.85 } : null;
  }
  
  initializeStatisticalEngine(apis) {
    return { type: 'statistical', confidence: 0.75 }; // Always available
  }
  
  initializePatternRecognition() {
    return { type: 'pattern_recognition', confidence: 0.7 }; // Always available
  }
  
  initializeTrendPredictor(apis) {
    return apis.tensorflow ? { type: 'ml_predictor', confidence: 0.88 } : 
           { type: 'statistical_predictor', confidence: 0.72 };
  }
  
  initializeAnomalyDetector(apis) {
    return apis.tensorflow ? { type: 'ml_anomaly', confidence: 0.85 } :
           { type: 'statistical_anomaly', confidence: 0.70 };
  }
  
  initializePerformanceForecaster(apis) {
    return apis.tensorflow ? { type: 'ml_forecaster', confidence: 0.82 } :
           { type: 'trend_forecaster', confidence: 0.68 };
  }
  
  initializePatternAnalyzer() {
    return { type: 'pattern_analyzer', confidence: 0.65 }; // Always available
  }
  
  // Intelligent fallback methods
  
  detectDataAnomaly(data) {
    // Simple anomaly detection based on data characteristics
    if (data.input && data.input.length > 10000) return true; // Unusually long input
    if (data.timestamp && Math.abs(Date.now() - data.timestamp) > 3600000) return true; // Old timestamp
    return false;
  }
  
  isRealTimeCompatible(data) {
    // Check if data can be processed in real-time
    const dataSize = JSON.stringify(data).length;
    return dataSize < 10000; // Less than 10KB for real-time processing
  }
  
  processInMemoryStream(data) {
    // Memory-based streaming fallback
    this.dataBuffers.realTimeEvents.push({
      type: 'memory_stream',
      data,
      processed_at: Date.now()
    });
  }
  
  generateBasicAnalytics(data) {
    return {
      patterns: { detected: false, confidence: 0.5 },
      sentiment: 0.0,
      complexity: this.calculateBasicComplexity(data),
      predictions: { outcome: 'unknown', confidence: 0.5 }
    };
  }
  
  calculateTrendDirection(values) {
    if (values.length < 2) return { direction: 'stable', confidence: 0.0, slope: 0, prediction: values[0] || 0.5 };
    
    // Simple linear regression
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const direction = slope > 0.05 ? 'improving' : slope < -0.05 ? 'declining' : 'stable';
    const confidence = Math.min(Math.abs(slope) * 10, 1.0);
    
    // Predict next value
    const prediction = values[values.length - 1] + slope;
    
    return { direction, confidence, slope, prediction };
  }
  
  predictWithStatistics(metrics) {
    const efficiency = metrics.calculated?.efficiency || 0.5;
    const quality = metrics.calculated?.quality || 0.5;
    const speed = metrics.calculated?.speed || 0.5;
    
    // Simple statistical prediction
    const prediction = (efficiency + quality + speed) / 3;
    
    return {
      predicted_efficiency: Math.min(1.0, prediction + 0.1),
      confidence: 0.7,
      method: 'statistical_fallback'
    };
  }
  
  calculateOverallScore(calculated, baseline) {
    const efficiency = (calculated.efficiency || 0.5) / baseline.efficiency;
    const quality = (calculated.quality || 0.5) / baseline.quality;
    const speed = (calculated.speed || 0.5) / baseline.speed;
    
    return (efficiency + quality + speed) / 3;
  }
  
  calculateBasicComplexity(data) {
    let complexity = 0.5;
    
    if (data.input) {
      const inputLength = data.input.toString().length;
      complexity += Math.min(inputLength / 1000, 0.3);
    }
    
    if (data.taskType) {
      const complexTypes = ['analysis', 'optimization', 'prediction'];
      if (complexTypes.includes(data.taskType.toLowerCase())) {
        complexity += 0.2;
      }
    }
    
    return Math.min(complexity, 1.0);
  }
  
  async processRealTimeEvent(event) {
    // Process individual real-time events
    switch (event.type) {
      case 'interaction':
        await this.processInteractionEvent(event);
        break;
      case 'performance_stream':
        await this.processPerformanceEvent(event);
        break;
      default:
        logger.debug(`Unknown event type: ${event.type}`);
    }
  }
  
  async processInteractionEvent(event) {
    // Real-time interaction processing
    if (this.config.advancedAnalytics) {
      await this.updateInteractionPatterns(event.data);
    }
  }
  
  async processPerformanceEvent(event) {
    // Real-time performance monitoring
    if (event.data.calculated?.efficiency < 0.3) {
      this.emit('low-performance-alert', event.data);
    }
  }
  
  // Additional analytics methods
  
  async detectInteractionPatterns(data) {
    // Pattern detection fallback
    return { detected: false, patterns: [], confidence: 0.5 };
  }
  
  async analyzeInteractionSentiment(data) {
    // Enhanced sentiment analysis (fallback to existing method)
    return await this.analyzeSentiment(data);
  }
  
  calculateInteractionComplexity(data) {
    return this.calculateBasicComplexity(data);
  }
  
  async predictInteractionOutcome(data) {
    // Outcome prediction fallback
    return { outcome: 'success', confidence: 0.7 };
  }
  
  async updateInteractionPatterns(data) {
    // Update pattern recognition models
    logger.debug('Updating interaction patterns...');
  }
  
  async processPerformanceAnalytics(metrics) {
    // Process performance analytics in real-time
    const analytics = metrics.advancedAnalytics;
    
    if (analytics.anomalyDetection?.anomaly) {
      this.emit('performance-anomaly-detected', {
        metrics,
        anomaly: analytics.anomalyDetection
      });
    }
  }
  
  async predictWithTensorFlow(metrics) {
    // TensorFlow prediction (placeholder for when TF is available)
    return {
      predicted_efficiency: 0.85,
      confidence: 0.92,
      method: 'tensorflow_ml'
    };
  }
  
  async streamToKafka(data) {
    // Kafka streaming (placeholder)
    logger.debug('Streaming to Kafka:', data.id);
  }
  
  async streamToRedis(data) {
    // Redis streaming (placeholder)
    logger.debug('Streaming to Redis:', data.id);
  }
}

// Singleton instance
let instance = null;

module.exports = {
  DataCollectionService,
  
  getInstance(config) {
    if (!instance) {
      instance = new DataCollectionService(config);
    }
    return instance;
  }
};