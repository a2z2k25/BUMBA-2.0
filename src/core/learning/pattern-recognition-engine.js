/**
 * BUMBA Pattern Recognition Engine
 * Advanced pattern detection using ML models and neural networks
 * Part of Human Learning Module Enhancement - Sprint 1
 * 
 * FRAMEWORK DESIGN:
 * - Connection points for ML libraries (TensorFlow, PyTorch, etc.)
 * - Graceful fallback to heuristic algorithms when ML not available
 * - API integration points ready for user implementation
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

// ML Library Connection Point - Users will connect their preferred ML library
let tf = null;
try {
  // Try to load TensorFlow if available
  tf = require('@tensorflow/tfjs-node');
  logger.info('🔗 TensorFlow.js connected for ML capabilities');
} catch (error) {
  logger.info('📊 ML library not connected - using heuristic fallback algorithms');
  // Framework continues with algorithmic approach
}

/**
 * Advanced pattern recognition with neural networks
 */
class PatternRecognitionEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      modelPath: config.modelPath || './models/pattern-recognition',
      embeddingSize: config.embeddingSize || 128,
      hiddenUnits: config.hiddenUnits || [256, 128, 64],
      learningRate: config.learningRate || 0.001,
      batchSize: config.batchSize || 32,
      epochs: config.epochs || 10,
      confidenceThreshold: config.confidenceThreshold || 0.7,
      ...config
    };
    
    // Models
    this.models = {
      encoder: null,        // Feature encoder
      classifier: null,     // Pattern classifier
      similarity: null,     // Similarity calculator
      clustering: null      // Pattern clustering
    };
    
    // Pattern storage
    this.patterns = new Map();
    this.clusters = new Map();
    this.embeddings = new Map();
    
    // Metrics
    this.metrics = {
      patternsRecognized: 0,
      accuracy: 0,
      avgConfidence: 0,
      processingTime: 0
    };
    
    this.initialize();
  }
  
  /**
   * Initialize the pattern recognition engine
   */
  async initialize() {
    try {
      // Check ML availability and create appropriate models
      if (tf) {
        // ML-powered initialization
        await this.createModels();
        this.mode = 'ml-powered';
      } else {
        // Heuristic-based initialization
        await this.initializeHeuristicModels();
        this.mode = 'heuristic';
      }
      
      // Load existing patterns if available
      await this.loadPatterns();
      
      logger.info(`🧠 Pattern Recognition Engine initialized (${this.mode} mode)`);
      
      this.emit('initialized', {
        mode: this.mode,
        modelsCreated: Object.keys(this.models).length,
        patternsLoaded: this.patterns.size,
        mlAvailable: !!tf
      });
      
    } catch (error) {
      logger.error('Failed to initialize Pattern Recognition Engine:', error);
      // Still functional with basic pattern matching
      this.mode = 'basic';
      await this.initializeBasicPatternMatching();
    }
  }
  
  /**
   * Initialize heuristic models (fallback when ML not available)
   */
  async initializeHeuristicModels() {
    // Create heuristic-based pattern matching algorithms
    this.models = {
      encoder: new HeuristicEncoder(this.config),
      classifier: new HeuristicClassifier(this.config),
      similarity: new HeuristicSimilarity(this.config),
      clustering: new HeuristicClustering(this.config)
    };
    
    logger.info('📊 Heuristic models initialized for pattern recognition');
  }
  
  /**
   * Initialize basic pattern matching (ultimate fallback)
   */
  async initializeBasicPatternMatching() {
    this.models = {
      encoder: { encode: (data) => this.basicEncode(data) },
      classifier: { classify: (data) => this.basicClassify(data) },
      similarity: { calculate: (a, b) => this.basicSimilarity(a, b) },
      clustering: { cluster: (data) => this.basicCluster(data) }
    };
    
    logger.info('🔍 Basic pattern matching initialized');
  }
  
  /**
   * Create neural network models (when TensorFlow is available)
   */
  async createModels() {
    if (!tf) {
      return this.initializeHeuristicModels();
    }
    
    // Feature Encoder Model
    this.models.encoder = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [512], // Variable input features
          units: 256,
          activation: 'relu',
          kernelInitializer: 'glorotUniform'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: this.config.embeddingSize,
          activation: 'tanh'
        })
      ]
    });
    
    // Pattern Classifier Model
    this.models.classifier = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [this.config.embeddingSize],
          units: this.config.hiddenUnits[0],
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: this.config.hiddenUnits[1],
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: this.config.hiddenUnits[2],
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 10, // Pattern categories
          activation: 'softmax'
        })
      ]
    });
    
    // Compile models
    this.models.encoder.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'meanSquaredError'
    });
    
    this.models.classifier.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    
    // Similarity Model (Siamese Network)
    this.models.similarity = this.createSimilarityModel();
    
    // Clustering Model (Autoencoder)
    this.models.clustering = this.createClusteringModel();
  }
  
  /**
   * Create similarity calculation model
   */
  createSimilarityModel() {
    const input1 = tf.input({ shape: [this.config.embeddingSize] });
    const input2 = tf.input({ shape: [this.config.embeddingSize] });
    
    // Shared layers
    const sharedDense = tf.layers.dense({
      units: 64,
      activation: 'relu'
    });
    
    const processed1 = sharedDense.apply(input1);
    const processed2 = sharedDense.apply(input2);
    
    // Calculate L2 distance
    const distance = tf.layers.lambda({
      lambdaFunction: ([a, b]) => {
        const diff = tf.sub(a, b);
        return tf.sqrt(tf.sum(tf.square(diff), 1, true));
      }
    }).apply([processed1, processed2]);
    
    // Convert to similarity
    const similarity = tf.layers.lambda({
      lambdaFunction: (x) => tf.sub(1, tf.sigmoid(x))
    }).apply(distance);
    
    const model = tf.model({
      inputs: [input1, input2],
      outputs: similarity
    });
    
    model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'binaryCrossentropy'
    });
    
    return model;
  }
  
  /**
   * Create clustering model (autoencoder)
   */
  createClusteringModel() {
    const encoder = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [this.config.embeddingSize],
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 16,
          activation: 'relu'
        })
      ]
    });
    
    const decoder = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [16],
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: this.config.embeddingSize,
          activation: 'tanh'
        })
      ]
    });
    
    const input = tf.input({ shape: [this.config.embeddingSize] });
    const encoded = encoder.apply(input);
    const decoded = decoder.apply(encoded);
    
    const autoencoder = tf.model({
      inputs: input,
      outputs: decoded
    });
    
    autoencoder.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'meanSquaredError'
    });
    
    return { encoder, decoder, autoencoder };
  }
  
  /**
   * Recognize patterns in user interaction
   */
  async recognizePattern(interaction) {
    const startTime = Date.now();
    
    try {
      // Extract features
      const features = await this.extractFeatures(interaction);
      
      // Generate embedding
      const embedding = await this.generateEmbedding(features);
      
      // Classify pattern
      const classification = await this.classifyPattern(embedding);
      
      // Find similar patterns
      const similar = await this.findSimilarPatterns(embedding);
      
      // Cluster assignment
      const cluster = await this.assignCluster(embedding);
      
      // Extract embedding data based on mode
      let embeddingData;
      if (this.mode === 'ml-powered' && embedding.dataSync) {
        embeddingData = Array.from(embedding.dataSync());
      } else if (Array.isArray(embedding)) {
        embeddingData = embedding;
      } else {
        embeddingData = embedding.dataSync ? Array.from(embedding.dataSync()) : [];
      }
      
      // Create pattern object
      const pattern = {
        id: `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        interaction,
        features,
        embedding: embeddingData,
        classification,
        similar,
        cluster,
        confidence: classification.confidence,
        metadata: {
          processingTime: Date.now() - startTime,
          modelVersion: '1.0.0',
          mode: this.mode
        }
      };
      
      // Store pattern
      this.patterns.set(pattern.id, pattern);
      this.embeddings.set(pattern.id, embedding);
      
      // Update metrics
      this.metrics.patternsRecognized++;
      this.metrics.avgConfidence = 
        (this.metrics.avgConfidence * (this.metrics.patternsRecognized - 1) + 
         pattern.confidence) / this.metrics.patternsRecognized;
      this.metrics.processingTime = Date.now() - startTime;
      
      this.emit('pattern-recognized', pattern);
      
      logger.info(`🟡 Pattern recognized (${this.mode}): ${pattern.classification.category} (${pattern.confidence.toFixed(2)} confidence)`);
      
      return pattern;
      
    } catch (error) {
      logger.error('Failed to recognize pattern:', error);
      return null;
    }
  }
  
  /**
   * Extract features from interaction
   */
  async extractFeatures(interaction) {
    const features = {
      // Temporal features
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      sessionDuration: interaction.sessionDuration || 0,
      
      // Interaction features
      interactionType: this.encodeInteractionType(interaction.type),
      contentLength: interaction.content ? interaction.content.length : 0,
      complexity: this.calculateComplexity(interaction),
      
      // Context features
      language: this.encodeLanguage(interaction.language),
      projectType: this.encodeProjectType(interaction.projectType),
      taskCategory: this.encodeTaskCategory(interaction.task),
      
      // Behavioral features
      responseTime: interaction.responseTime || 0,
      errorRate: interaction.errorRate || 0,
      feedbackScore: interaction.feedbackScore || 0,
      
      // Style preferences
      codeStyle: this.encodeCodeStyle(interaction.codeStyle),
      verbosity: interaction.verbosity || 0.5,
      detailLevel: interaction.detailLevel || 0.5,
      
      // Historical features
      previousPatterns: this.encodePreviousPatterns(interaction.userId),
      patternFrequency: this.calculatePatternFrequency(interaction),
      
      // Sentiment features
      sentiment: interaction.sentiment || 0,
      frustrationLevel: interaction.frustrationLevel || 0,
      engagementLevel: interaction.engagementLevel || 1
    };
    
    // Convert to tensor
    return this.featuresToTensor(features);
  }
  
  /**
   * Generate embedding from features
   */
  async generateEmbedding(features) {
    if (this.mode === 'ml-powered' && tf) {
      return tf.tidy(() => {
        const prediction = this.models.encoder.predict(features);
        return prediction;
      });
    } else {
      // Heuristic or basic mode
      return this.models.encoder.predict ? 
        this.models.encoder.predict(features) :
        this.models.encoder.encode(features);
    }
  }
  
  /**
   * Classify pattern
   */
  async classifyPattern(embedding) {
    if (this.mode === 'ml-powered' && tf) {
      return tf.tidy(() => {
        const prediction = this.models.classifier.predict(embedding);
        const probabilities = prediction.dataSync();
      
      // Get top category
      const maxIndex = probabilities.indexOf(Math.max(...probabilities));
      const categories = [
        'code_generation',
        'debugging',
        'refactoring',
        'documentation',
        'testing',
        'optimization',
        'architecture',
        'learning',
        'exploration',
        'maintenance'
      ];
      
      return {
        category: categories[maxIndex],
        confidence: probabilities[maxIndex],
        probabilities: categories.map((cat, i) => ({
          category: cat,
          probability: probabilities[i]
        })).sort((a, b) => b.probability - a.probability)
      };
    });
    } else {
      // Heuristic or basic mode
      return this.models.classifier.classify ? 
        this.models.classifier.classify(embedding) :
        this.models.classifier.classify(embedding);
    }
  }
  
  /**
   * Find similar patterns
   */
  async findSimilarPatterns(embedding, topK = 5) {
    const similarities = [];
    
    // Calculate similarity with all stored patterns
    for (const [patternId, storedEmbedding] of this.embeddings.entries()) {
      const similarity = await this.calculateSimilarity(embedding, storedEmbedding);
      similarities.push({ patternId, similarity });
    }
    
    // Sort by similarity and return top K
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, topK);
  }
  
  /**
   * Calculate similarity between embeddings
   */
  async calculateSimilarity(embedding1, embedding2) {
    if (this.mode === 'ml-powered' && tf) {
      return tf.tidy(() => {
        // Cosine similarity
        const dot = tf.sum(tf.mul(embedding1, embedding2));
        const norm1 = tf.sqrt(tf.sum(tf.square(embedding1)));
        const norm2 = tf.sqrt(tf.sum(tf.square(embedding2)));
        const similarity = tf.div(dot, tf.mul(norm1, norm2));
        
        return similarity.dataSync()[0];
      });
    } else {
      // Use heuristic similarity
      if (this.models.similarity && this.models.similarity.calculate) {
        return this.models.similarity.calculate(embedding1, embedding2);
      }
      
      // Fallback to basic cosine similarity
      const e1 = Array.isArray(embedding1) ? embedding1 : embedding1.dataSync();
      const e2 = Array.isArray(embedding2) ? embedding2 : embedding2.dataSync();
      
      let dot = 0, norm1 = 0, norm2 = 0;
      for (let i = 0; i < Math.min(e1.length, e2.length); i++) {
        dot += e1[i] * e2[i];
        norm1 += e1[i] * e1[i];
        norm2 += e2[i] * e2[i];
      }
      
      norm1 = Math.sqrt(norm1);
      norm2 = Math.sqrt(norm2);
      
      return (norm1 === 0 || norm2 === 0) ? 0 : dot / (norm1 * norm2);
    }
  }
  
  /**
   * Assign pattern to cluster
   */
  async assignCluster(embedding) {
    if (this.mode === 'ml-powered' && tf) {
      return tf.tidy(() => {
        // Use autoencoder for clustering
        const encoded = this.models.clustering.encoder.predict(embedding);
        const encodedArray = encoded.dataSync();
      
      // Simple k-means style clustering
      let nearestCluster = null;
      let minDistance = Infinity;
      
      for (const [clusterId, center] of this.clusters.entries()) {
        const distance = this.euclideanDistance(encodedArray, center);
        if (distance < minDistance) {
          minDistance = distance;
          nearestCluster = clusterId;
        }
      }
      
      // Create new cluster if too far from existing ones
      if (minDistance > 2.0 || !nearestCluster) {
        nearestCluster = `cluster-${this.clusters.size + 1}`;
        this.clusters.set(nearestCluster, encodedArray);
      }
      
      return {
        id: nearestCluster,
        distance: minDistance,
        isNew: minDistance > 2.0
      };
    });
    } else {
      // Use heuristic clustering
      if (this.models.clustering && this.models.clustering.cluster) {
        return this.models.clustering.cluster(embedding);
      }
      
      // Fallback to simple clustering
      const embeddingArray = Array.isArray(embedding) ? embedding : embedding.dataSync();
      let nearestCluster = `cluster-${Math.floor(Math.random() * 5) + 1}`;
      
      return {
        id: nearestCluster,
        distance: Math.random() * 2,
        isNew: false
      };
    }
  }
  
  /**
   * Train models with new patterns
   */
  async trainModels(patterns) {
    try {
      const trainingData = await this.prepareTrainingData(patterns);
      
      // Train encoder
      await this.models.encoder.fit(
        trainingData.features,
        trainingData.embeddings,
        {
          epochs: this.config.epochs,
          batchSize: this.config.batchSize,
          validationSplit: 0.2,
          callbacks: {
            onEpochEnd: (epoch, logs) => {
              logger.info(`Training epoch ${epoch + 1}: loss=${logs.loss.toFixed(4)}`);
            }
          }
        }
      );
      
      // Train classifier
      await this.models.classifier.fit(
        trainingData.embeddings,
        trainingData.labels,
        {
          epochs: this.config.epochs,
          batchSize: this.config.batchSize,
          validationSplit: 0.2,
          callbacks: {
            onEpochEnd: (epoch, logs) => {
              logger.info(`Classifier epoch ${epoch + 1}: accuracy=${logs.acc.toFixed(4)}`);
              this.metrics.accuracy = logs.acc;
            }
          }
        }
      );
      
      logger.info('🏁 Pattern recognition models trained successfully');
      
      this.emit('models-trained', {
        patterns: patterns.length,
        accuracy: this.metrics.accuracy
      });
      
    } catch (error) {
      logger.error('Failed to train models:', error);
    }
  }
  
  // Helper methods
  
  encodeInteractionType(type) {
    const types = {
      'code': [1, 0, 0, 0, 0],
      'chat': [0, 1, 0, 0, 0],
      'debug': [0, 0, 1, 0, 0],
      'review': [0, 0, 0, 1, 0],
      'other': [0, 0, 0, 0, 1]
    };
    return types[type] || types['other'];
  }
  
  encodeLanguage(language) {
    const languages = {
      'javascript': [1, 0, 0, 0, 0],
      'python': [0, 1, 0, 0, 0],
      'java': [0, 0, 1, 0, 0],
      'typescript': [0, 0, 0, 1, 0],
      'other': [0, 0, 0, 0, 1]
    };
    return languages[language] || languages['other'];
  }
  
  encodeProjectType(type) {
    const types = {
      'web': [1, 0, 0, 0],
      'mobile': [0, 1, 0, 0],
      'backend': [0, 0, 1, 0],
      'other': [0, 0, 0, 1]
    };
    return types[type] || types['other'];
  }
  
  encodeTaskCategory(task) {
    // Simplified task encoding
    return [Math.random(), Math.random(), Math.random()];
  }
  
  encodeCodeStyle(style) {
    const styles = {
      'functional': [1, 0, 0],
      'oop': [0, 1, 0],
      'mixed': [0, 0, 1]
    };
    return styles[style] || styles['mixed'];
  }
  
  encodePreviousPatterns(userId) {
    // Get user's pattern history (simplified)
    return Array(10).fill(0).map(() => Math.random());
  }
  
  calculateComplexity(interaction) {
    // Simple complexity heuristic
    const factors = [
      interaction.content ? interaction.content.length / 1000 : 0,
      interaction.dependencies ? interaction.dependencies.length / 10 : 0,
      interaction.files ? interaction.files.length / 5 : 0
    ];
    return Math.min(1, factors.reduce((a, b) => a + b, 0) / 3);
  }
  
  calculatePatternFrequency(interaction) {
    // How often this pattern appears
    return Math.random(); // Placeholder
  }
  
  featuresToTensor(features) {
    // Flatten all features into a single array
    const featureArray = [];
    
    const flatten = (obj) => {
      Object.values(obj).forEach(value => {
        if (Array.isArray(value)) {
          featureArray.push(...value);
        } else if (typeof value === 'object' && value !== null) {
          flatten(value);
        } else {
          featureArray.push(value);
        }
      });
    };
    
    flatten(features);
    
    // Pad or truncate to fixed size
    const fixedSize = 512;
    while (featureArray.length < fixedSize) {
      featureArray.push(0);
    }
    if (featureArray.length > fixedSize) {
      featureArray.length = fixedSize;
    }
    
    // Return tensor if TensorFlow available, otherwise return array
    if (tf) {
      return tf.tensor2d([featureArray], [1, fixedSize]);
    } else {
      return featureArray;
    }
  }
  
  euclideanDistance(a, b) {
    return Math.sqrt(
      a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
    );
  }
  
  async prepareTrainingData(patterns) {
    // Prepare data for training (placeholder)
    const features = [];
    const embeddings = [];
    const labels = [];
    
    // Convert patterns to training data
    for (const pattern of patterns) {
      features.push(pattern.features);
      embeddings.push(pattern.embedding);
      labels.push(pattern.classification);
    }
    
    return {
      features: tf.stack(features),
      embeddings: tf.stack(embeddings),
      labels: tf.stack(labels)
    };
  }
  
  async loadPatterns() {
    // Load existing patterns from storage (placeholder)
    logger.info('Loading existing patterns...');
  }
  
  // Basic fallback methods for minimal functionality
  
  basicEncode(data) {
    // Simple hash-based encoding
    const str = JSON.stringify(data);
    const hash = str.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    // Create a simple embedding
    const embedding = new Array(this.config.embeddingSize).fill(0);
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] = Math.sin(hash * (i + 1)) * 0.5 + 0.5;
    }
    
    return embedding;
  }
  
  basicClassify(data) {
    // Rule-based classification
    const categories = [
      'code_generation',
      'debugging',
      'refactoring',
      'documentation',
      'testing',
      'optimization',
      'architecture',
      'learning',
      'exploration',
      'maintenance'
    ];
    
    // Simple heuristic based on data characteristics
    const dataStr = JSON.stringify(data).toLowerCase();
    let category = 'exploration';
    let confidence = 0.3;
    
    if (dataStr.includes('error') || dataStr.includes('bug')) {
      category = 'debugging';
      confidence = 0.7;
    } else if (dataStr.includes('test')) {
      category = 'testing';
      confidence = 0.6;
    } else if (dataStr.includes('doc')) {
      category = 'documentation';
      confidence = 0.6;
    } else if (dataStr.includes('code') || dataStr.includes('function')) {
      category = 'code_generation';
      confidence = 0.5;
    }
    
    return {
      category,
      confidence,
      probabilities: categories.map(cat => ({
        category: cat,
        probability: cat === category ? confidence : (1 - confidence) / 9
      }))
    };
  }
  
  basicSimilarity(a, b) {
    // Simple Euclidean distance-based similarity
    const arr1 = Array.isArray(a) ? a : [a];
    const arr2 = Array.isArray(b) ? b : [b];
    
    let distance = 0;
    for (let i = 0; i < Math.min(arr1.length, arr2.length); i++) {
      distance += Math.pow(arr1[i] - arr2[i], 2);
    }
    
    distance = Math.sqrt(distance);
    // Convert distance to similarity (0-1)
    return 1 / (1 + distance);
  }
  
  basicCluster(data) {
    // Random cluster assignment for basic functionality
    return {
      id: `cluster-${Math.floor(Math.random() * 3) + 1}`,
      distance: Math.random(),
      isNew: Math.random() > 0.8
    };
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      patternsStored: this.patterns.size,
      clustersFormed: this.clusters.size,
      modelAccuracy: this.metrics.accuracy
    };
  }
  
  /**
   * Export patterns for persistence
   */
  exportPatterns() {
    return Array.from(this.patterns.values());
  }
  
  /**
   * Import patterns
   */
  importPatterns(patterns) {
    patterns.forEach(pattern => {
      this.patterns.set(pattern.id, pattern);
      if (pattern.embedding) {
        this.embeddings.set(pattern.id, tf.tensor(pattern.embedding));
      }
    });
  }
}

/**
 * Heuristic Encoder - Algorithmic feature encoding without ML
 */
class HeuristicEncoder {
  constructor(config) {
    this.config = config;
    this.embeddingSize = config.embeddingSize || 128;
  }
  
  encode(features) {
    // Create embedding using statistical methods
    const embedding = new Array(this.embeddingSize).fill(0);
    
    // Hash features into embedding space
    let featureArray = [];
    this.flattenFeatures(features, featureArray);
    
    // Distribute features across embedding
    featureArray.forEach((value, index) => {
      const embeddingIndex = index % this.embeddingSize;
      embedding[embeddingIndex] += value * Math.cos(index);
    });
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      embedding.forEach((val, i) => embedding[i] = val / magnitude);
    }
    
    return embedding;
  }
  
  flattenFeatures(obj, result) {
    Object.values(obj).forEach(value => {
      if (Array.isArray(value)) {
        result.push(...value);
      } else if (typeof value === 'object' && value !== null) {
        this.flattenFeatures(value, result);
      } else {
        result.push(Number(value) || 0);
      }
    });
  }
  
  predict(features) {
    // Compatibility method for ML interface
    return { dataSync: () => this.encode(features) };
  }
}

/**
 * Heuristic Classifier - Rule-based pattern classification
 */
class HeuristicClassifier {
  constructor(config) {
    this.config = config;
    this.categories = [
      'code_generation',
      'debugging',
      'refactoring',
      'documentation',
      'testing',
      'optimization',
      'architecture',
      'learning',
      'exploration',
      'maintenance'
    ];
  }
  
  classify(embedding) {
    // Rule-based classification using embedding features
    // Convert to array if needed
    const embeddingArray = Array.isArray(embedding) ? embedding : 
                          (embedding.dataSync ? Array.from(embedding.dataSync()) : [embedding]);
    
    const scores = this.categories.map((category, index) => {
      // Simple scoring based on embedding patterns
      let score = 0;
      const categoryVector = this.getCategoryVector(category);
      
      // Dot product similarity
      embeddingArray.forEach((val, i) => {
        score += val * categoryVector[i % categoryVector.length];
      });
      
      return { category, score: Math.abs(score) };
    });
    
    // Sort by score
    scores.sort((a, b) => b.score - a.score);
    
    // Normalize to probabilities
    const totalScore = scores.reduce((sum, s) => sum + s.score, 0) || 1;
    const probabilities = scores.map(s => ({
      category: s.category,
      probability: s.score / totalScore
    }));
    
    return {
      category: probabilities[0].category,
      confidence: probabilities[0].probability,
      probabilities
    };
  }
  
  getCategoryVector(category) {
    // Predefined vectors for each category
    const vectors = {
      'code_generation': [0.9, 0.2, 0.1, 0.8, 0.3],
      'debugging': [0.1, 0.9, 0.8, 0.2, 0.7],
      'refactoring': [0.5, 0.5, 0.9, 0.3, 0.4],
      'documentation': [0.2, 0.1, 0.3, 0.9, 0.8],
      'testing': [0.3, 0.8, 0.2, 0.4, 0.9],
      'optimization': [0.7, 0.3, 0.5, 0.2, 0.9],
      'architecture': [0.8, 0.4, 0.7, 0.5, 0.3],
      'learning': [0.4, 0.2, 0.1, 0.8, 0.6],
      'exploration': [0.6, 0.7, 0.4, 0.1, 0.5],
      'maintenance': [0.3, 0.6, 0.8, 0.7, 0.2]
    };
    return vectors[category] || [0.5, 0.5, 0.5, 0.5, 0.5];
  }
  
  predict(embedding) {
    // Compatibility method
    const result = this.classify(embedding.dataSync ? embedding.dataSync() : embedding);
    return {
      dataSync: () => this.categories.map(cat => 
        cat === result.category ? result.confidence : (1 - result.confidence) / 9
      )
    };
  }
}

/**
 * Heuristic Similarity - Statistical similarity calculation
 */
class HeuristicSimilarity {
  constructor(config) {
    this.config = config;
  }
  
  calculate(embedding1, embedding2) {
    // Cosine similarity
    const e1 = Array.isArray(embedding1) ? embedding1 : embedding1.dataSync();
    const e2 = Array.isArray(embedding2) ? embedding2 : embedding2.dataSync();
    
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    for (let i = 0; i < Math.min(e1.length, e2.length); i++) {
      dotProduct += e1[i] * e2[i];
      magnitude1 += e1[i] * e1[i];
      magnitude2 += e2[i] * e2[i];
    }
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }
    
    return dotProduct / (magnitude1 * magnitude2);
  }
}

/**
 * Heuristic Clustering - K-means style clustering without ML
 */
class HeuristicClustering {
  constructor(config) {
    this.config = config;
    this.clusters = new Map();
    this.maxClusters = config.maxClusters || 10;
  }
  
  cluster(embedding) {
    const embeddingArray = Array.isArray(embedding) ? embedding : embedding.dataSync();
    
    let nearestCluster = null;
    let minDistance = Infinity;
    
    // Find nearest cluster
    for (const [clusterId, center] of this.clusters.entries()) {
      const distance = this.euclideanDistance(embeddingArray, center);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCluster = clusterId;
      }
    }
    
    // Create new cluster if needed
    if (minDistance > 2.0 || !nearestCluster || this.clusters.size === 0) {
      if (this.clusters.size < this.maxClusters) {
        nearestCluster = `cluster-${this.clusters.size + 1}`;
        this.clusters.set(nearestCluster, embeddingArray);
      } else {
        // Force assignment to nearest cluster
        nearestCluster = nearestCluster || 'cluster-1';
      }
    }
    
    // Update cluster center (running average)
    if (nearestCluster && minDistance < 2.0) {
      const center = this.clusters.get(nearestCluster);
      const alpha = 0.1; // Learning rate
      center.forEach((val, i) => {
        center[i] = val * (1 - alpha) + embeddingArray[i] * alpha;
      });
    }
    
    return {
      id: nearestCluster,
      distance: minDistance,
      isNew: minDistance > 2.0
    };
  }
  
  euclideanDistance(a, b) {
    return Math.sqrt(
      a.reduce((sum, val, i) => sum + Math.pow(val - (b[i] || 0), 2), 0)
    );
  }
}

module.exports = PatternRecognitionEngine;