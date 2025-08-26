/**
 * BUMBA Pattern Recognition Models
 * Pre-built ML models for various pattern recognition tasks
 */

const { EventEmitter } = require('events');
const NeuralNetworkEngine = require('./neural-network-engine');
const { logger } = require('../logging/bumba-logger');

class PatternRecognitionModels extends EventEmitter {
  constructor() {
    super();
    
    this.models = new Map();
    this.activeModels = new Map();
    
    // Initialize pre-built models
    this.initializeModels();
  }
  
  /**
   * Initialize all pattern recognition models
   */
  initializeModels() {
    // Time series prediction model
    this.registerModel('timeseries', {
      name: 'Time Series Predictor',
      type: 'regression',
      architecture: {
        inputSize: 10,  // Last 10 time points
        hiddenLayers: [64, 32, 16],
        outputSize: 1,  // Next value prediction
        activation: 'relu',
        outputActivation: 'linear'
      },
      preprocessing: 'normalize',
      useCases: ['Performance metrics', 'Resource usage', 'Traffic patterns']
    });
    
    // Anomaly detection model
    this.registerModel('anomaly', {
      name: 'Anomaly Detector',
      type: 'autoencoder',
      architecture: {
        inputSize: 20,
        hiddenLayers: [16, 8, 4, 8, 16],  // Encoder-decoder architecture
        outputSize: 20,
        activation: 'relu',
        outputActivation: 'sigmoid'
      },
      preprocessing: 'standardize',
      useCases: ['Security threats', 'System failures', 'Data corruption']
    });
    
    // Classification model
    this.registerModel('classifier', {
      name: 'Multi-class Classifier',
      type: 'classification',
      architecture: {
        inputSize: 50,
        hiddenLayers: [128, 64, 32],
        outputSize: 10,  // 10 classes
        activation: 'relu',
        outputActivation: 'softmax'
      },
      preprocessing: 'normalize',
      useCases: ['Error categorization', 'User behavior', 'Request types']
    });
    
    // Clustering model (using neural approach)
    this.registerModel('clustering', {
      name: 'Neural Clustering',
      type: 'clustering',
      architecture: {
        inputSize: 30,
        hiddenLayers: [20, 10, 5],  // Dimensionality reduction
        outputSize: 3,  // Cluster embeddings
        activation: 'tanh',
        outputActivation: 'linear'
      },
      preprocessing: 'standardize',
      useCases: ['User segmentation', 'Pattern grouping', 'Resource allocation']
    });
    
    // Regression model
    this.registerModel('regression', {
      name: 'Performance Regressor',
      type: 'regression',
      architecture: {
        inputSize: 15,
        hiddenLayers: [32, 16],
        outputSize: 1,
        activation: 'leaky_relu',
        outputActivation: 'linear'
      },
      preprocessing: 'standardize',
      useCases: ['Performance prediction', 'Cost estimation', 'Load forecasting']
    });
    
    // Sequence model (for text/command patterns)
    this.registerModel('sequence', {
      name: 'Sequence Analyzer',
      type: 'sequence',
      architecture: {
        inputSize: 100,  // Vocabulary size
        hiddenLayers: [128, 64],
        outputSize: 100,  // Next token prediction
        activation: 'relu',
        outputActivation: 'softmax'
      },
      preprocessing: 'tokenize',
      useCases: ['Command prediction', 'Log analysis', 'Pattern completion']
    });
    
    logger.info(`Initialized ${this.models.size} pattern recognition models`);
  }
  
  /**
   * Register a model configuration
   */
  registerModel(id, config) {
    this.models.set(id, {
      id,
      ...config,
      created: Date.now(),
      trained: false,
      metrics: null
    });
  }
  
  /**
   * Create and train a specific model
   */
  async trainModel(modelId, trainingData, options = {}) {
    const modelConfig = this.models.get(modelId);
    if (!modelConfig) {
      throw new Error(`Model ${modelId} not found`);
    }
    
    try {
      logger.info(`Training ${modelConfig.name} model`);
      
      // Preprocess data
      const processedData = await this.preprocessData(
        trainingData,
        modelConfig.preprocessing
      );
      
      // Create neural network
      const network = new NeuralNetworkEngine(modelConfig.architecture);
      
      // Training configuration
      const trainConfig = {
        epochs: options.epochs || 100,
        batchSize: options.batchSize || 32,
        learningRate: options.learningRate || 0.001,
        validationSplit: options.validationSplit || 0.2,
        earlyStoppingPatience: options.earlyStoppingPatience || 10,
        optimizer: options.optimizer || 'adam',
        ...options
      };
      
      // Split data
      const { train, validation } = this.splitData(processedData, trainConfig.validationSplit);
      
      // Training loop
      const history = {
        loss: [],
        valLoss: [],
        accuracy: [],
        valAccuracy: []
      };
      
      let bestValLoss = Infinity;
      let patience = 0;
      let bestWeights = null;
      
      for (let epoch = 0; epoch < trainConfig.epochs; epoch++) {
        // Train one epoch
        const trainMetrics = await this.trainEpoch(
          network,
          train,
          trainConfig,
          modelConfig.type
        );
        
        // Validate
        const valMetrics = network.evaluate(
          validation.inputs,
          validation.targets
        );
        
        // Record history
        history.loss.push(trainMetrics.loss);
        history.accuracy.push(trainMetrics.accuracy);
        history.valLoss.push(valMetrics.loss);
        history.valAccuracy.push(valMetrics.accuracy);
        
        // Early stopping
        if (valMetrics.loss < bestValLoss) {
          bestValLoss = valMetrics.loss;
          bestWeights = network.saveWeights();
          patience = 0;
        } else {
          patience++;
          if (patience >= trainConfig.earlyStoppingPatience) {
            logger.info(`Early stopping at epoch ${epoch}`);
            break;
          }
        }
        
        // Emit progress
        this.emit('training-progress', {
          modelId,
          epoch,
          loss: trainMetrics.loss,
          accuracy: trainMetrics.accuracy,
          valLoss: valMetrics.loss,
          valAccuracy: valMetrics.accuracy
        });
        
        // Log every 10 epochs
        if (epoch % 10 === 0) {
          logger.info(`Epoch ${epoch}: loss=${trainMetrics.loss.toFixed(4)}, val_loss=${valMetrics.loss.toFixed(4)}`);
        }
      }
      
      // Restore best weights
      if (bestWeights) {
        network.loadWeights(bestWeights);
      }
      
      // Final evaluation
      const finalMetrics = network.evaluate(validation.inputs, validation.targets);
      
      // Store trained model
      this.activeModels.set(modelId, {
        network,
        config: modelConfig,
        trainConfig,
        history,
        metrics: finalMetrics,
        trained: Date.now()
      });
      
      // Update model status
      modelConfig.trained = true;
      modelConfig.metrics = finalMetrics;
      
      logger.info(`Model ${modelConfig.name} trained successfully: accuracy=${finalMetrics.accuracy.toFixed(4)}`);
      
      return {
        modelId,
        metrics: finalMetrics,
        history,
        success: true
      };
      
    } catch (error) {
      logger.error(`Training failed for ${modelConfig.name}:`, error);
      return {
        modelId,
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Train one epoch
   */
  async trainEpoch(network, data, config, modelType) {
    const { inputs, targets } = data;
    const batchSize = config.batchSize;
    
    // Shuffle data
    const indices = this.shuffleIndices(inputs.length);
    
    let totalLoss = 0;
    let totalCorrect = 0;
    
    // Process mini-batches
    for (let i = 0; i < indices.length; i += batchSize) {
      const batchIndices = indices.slice(i, Math.min(i + batchSize, indices.length));
      const batchInputs = batchIndices.map(idx => inputs[idx]);
      const batchTargets = batchIndices.map(idx => targets[idx]);
      
      // Train on batch
      const batchLoss = network.trainBatch(
        batchInputs,
        batchTargets,
        config.learningRate,
        config.optimizer
      );
      
      totalLoss += batchLoss * batchInputs.length;
      
      // Calculate accuracy for classification
      if (modelType === 'classification') {
        for (let j = 0; j < batchInputs.length; j++) {
          const output = network.predict(batchInputs[j]);
          const predicted = output.indexOf(Math.max(...output));
          const actual = batchTargets[j].indexOf(Math.max(...batchTargets[j]));
          if (predicted === actual) totalCorrect++;
        }
      }
    }
    
    return {
      loss: totalLoss / inputs.length,
      accuracy: modelType === 'classification' ? totalCorrect / inputs.length : 0
    };
  }
  
  /**
   * Use a trained model for prediction
   */
  async predict(modelId, input, options = {}) {
    const activeModel = this.activeModels.get(modelId);
    if (!activeModel) {
      throw new Error(`Model ${modelId} not trained or loaded`);
    }
    
    try {
      // Preprocess input
      const processed = await this.preprocessInput(
        input,
        activeModel.config.preprocessing,
        options
      );
      
      // Make prediction
      const output = activeModel.network.predict(processed);
      
      // Post-process output
      const result = this.postprocessOutput(
        output,
        activeModel.config.type,
        options
      );
      
      return {
        modelId,
        prediction: result,
        confidence: this.calculateConfidence(output, activeModel.config.type),
        raw: output,
        success: true
      };
      
    } catch (error) {
      logger.error(`Prediction failed for model ${modelId}:`, error);
      return {
        modelId,
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Batch prediction
   */
  async predictBatch(modelId, inputs, options = {}) {
    const results = [];
    
    for (const input of inputs) {
      const result = await this.predict(modelId, input, options);
      results.push(result);
    }
    
    return results;
  }
  
  /**
   * Detect anomalies using autoencoder
   */
  async detectAnomalies(data, threshold = 0.1) {
    const modelId = 'anomaly';
    
    // Ensure model is trained
    if (!this.activeModels.has(modelId)) {
      // Train on normal data if not trained
      await this.trainModel(modelId, data.normalData || data);
    }
    
    const activeModel = this.activeModels.get(modelId);
    const anomalies = [];
    
    for (let i = 0; i < data.length; i++) {
      const input = data[i];
      const processed = await this.preprocessInput(input, 'standardize');
      
      // Get reconstruction
      const output = activeModel.network.predict(processed);
      
      // Calculate reconstruction error
      const error = this.calculateReconstructionError(processed, output);
      
      if (error > threshold) {
        anomalies.push({
          index: i,
          data: input,
          error,
          severity: this.calculateAnomalySeverity(error, threshold)
        });
      }
    }
    
    return {
      anomalies,
      totalChecked: data.length,
      anomalyRate: anomalies.length / data.length
    };
  }
  
  /**
   * Predict time series
   */
  async predictTimeSeries(history, steps = 1) {
    const modelId = 'timeseries';
    const predictions = [];
    let currentHistory = [...history];
    
    for (let step = 0; step < steps; step++) {
      // Use last N points as input
      const input = currentHistory.slice(-10);
      
      const result = await this.predict(modelId, input);
      if (result.success) {
        predictions.push(result.prediction);
        
        // Update history for next prediction
        currentHistory.push(result.prediction);
        currentHistory.shift();
      } else {
        break;
      }
    }
    
    return {
      predictions,
      confidence: predictions.length > 0 ? 
        predictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / predictions.length : 0,
      horizon: steps
    };
  }
  
  /**
   * Classify input into categories
   */
  async classify(input, topK = 3) {
    const modelId = 'classifier';
    const result = await this.predict(modelId, input);
    
    if (!result.success) {
      return result;
    }
    
    // Get top K predictions
    const scores = result.raw;
    const classes = scores.map((score, index) => ({
      class: index,
      probability: score
    })).sort((a, b) => b.probability - a.probability);
    
    return {
      topPrediction: classes[0],
      topK: classes.slice(0, topK),
      distribution: scores,
      success: true
    };
  }
  
  /**
   * Cluster data points
   */
  async clusterData(data, numClusters = 3) {
    const modelId = 'clustering';
    
    // Train clustering model if needed
    if (!this.activeModels.has(modelId)) {
      await this.trainModel(modelId, data);
    }
    
    const clusters = [];
    const activeModel = this.activeModels.get(modelId);
    
    // Get embeddings for all data points
    for (const point of data) {
      const processed = await this.preprocessInput(point, 'standardize');
      const embedding = activeModel.network.predict(processed);
      
      // Assign to nearest cluster
      const clusterId = this.assignToCluster(embedding, numClusters);
      
      clusters.push({
        data: point,
        cluster: clusterId,
        embedding
      });
    }
    
    // Calculate cluster statistics
    const clusterStats = this.calculateClusterStats(clusters);
    
    return {
      clusters,
      numClusters,
      stats: clusterStats,
      success: true
    };
  }
  
  // Data preprocessing methods
  
  async preprocessData(data, method) {
    switch (method) {
      case 'normalize':
        return this.normalizeData(data);
      
      case 'standardize':
        return this.standardizeData(data);
      
      case 'tokenize':
        return this.tokenizeData(data);
      
      default:
        return data;
    }
  }
  
  normalizeData(data) {
    // Min-max normalization
    const inputs = data.inputs || data;
    const min = Math.min(...inputs.flat());
    const max = Math.max(...inputs.flat());
    const range = max - min || 1;
    
    return {
      inputs: inputs.map(row => 
        row.map(val => (val - min) / range)
      ),
      targets: data.targets || inputs,
      min,
      max
    };
  }
  
  standardizeData(data) {
    // Z-score standardization
    const inputs = data.inputs || data;
    const flat = inputs.flat();
    const mean = flat.reduce((a, b) => a + b, 0) / flat.length;
    const std = Math.sqrt(
      flat.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / flat.length
    );
    
    return {
      inputs: inputs.map(row => 
        row.map(val => (val - mean) / (std || 1))
      ),
      targets: data.targets || inputs,
      mean,
      std
    };
  }
  
  tokenizeData(data) {
    // Simple tokenization for sequences
    const vocabulary = new Map();
    let vocabIndex = 0;
    
    const tokenized = data.map(sequence => {
      return sequence.map(token => {
        if (!vocabulary.has(token)) {
          vocabulary.set(token, vocabIndex++);
        }
        return vocabulary.get(token);
      });
    });
    
    return {
      inputs: tokenized,
      targets: tokenized,
      vocabulary
    };
  }
  
  async preprocessInput(input, method, options = {}) {
    switch (method) {
      case 'normalize':
        const { min = 0, max = 1 } = options;
        return input.map(val => (val - min) / (max - min || 1));
      
      case 'standardize':
        const { mean = 0, std = 1 } = options;
        return input.map(val => (val - mean) / std);
      
      case 'tokenize':
        const { vocabulary = new Map() } = options;
        return input.map(token => vocabulary.get(token) || 0);
      
      default:
        return input;
    }
  }
  
  postprocessOutput(output, modelType, options = {}) {
    switch (modelType) {
      case 'classification':
        const classIndex = output.indexOf(Math.max(...output));
        return {
          class: classIndex,
          probability: output[classIndex],
          distribution: output
        };
      
      case 'regression':
        return {
          value: output[0],
          confidence: 1 - Math.abs(output[0] - (options.expected || 0))
        };
      
      case 'autoencoder':
        return {
          reconstruction: output,
          error: this.calculateReconstructionError(options.input || [], output)
        };
      
      case 'clustering':
        return {
          embedding: output
        };
      
      case 'sequence':
        const nextToken = output.indexOf(Math.max(...output));
        return {
          nextToken,
          probability: output[nextToken],
          alternatives: output.map((p, i) => ({ token: i, probability: p }))
            .sort((a, b) => b.probability - a.probability)
            .slice(0, 5)
        };
      
      default:
        return output;
    }
  }
  
  calculateConfidence(output, modelType) {
    switch (modelType) {
      case 'classification':
      case 'sequence':
        // Entropy-based confidence
        const entropy = -output.reduce((sum, p) => {
          const pSafe = Math.max(1e-7, p);
          return sum + pSafe * Math.log(pSafe);
        }, 0);
        return 1 - (entropy / Math.log(output.length));
      
      case 'regression':
        // Based on output magnitude
        return 1 / (1 + Math.abs(output[0]));
      
      default:
        return 0.5;
    }
  }
  
  calculateReconstructionError(input, output) {
    let error = 0;
    for (let i = 0; i < input.length; i++) {
      error += Math.pow(input[i] - output[i], 2);
    }
    return Math.sqrt(error / input.length);
  }
  
  calculateAnomalySeverity(error, threshold) {
    const ratio = error / threshold;
    if (ratio < 1.5) return 'low';
    if (ratio < 2.5) return 'medium';
    if (ratio < 4) return 'high';
    return 'critical';
  }
  
  assignToCluster(embedding, numClusters) {
    // Simple k-means style assignment
    const sum = embedding.reduce((a, b) => a + Math.abs(b), 0);
    return Math.floor((sum * numClusters) % numClusters);
  }
  
  calculateClusterStats(clusters) {
    const stats = {};
    
    // Group by cluster
    const grouped = {};
    for (const item of clusters) {
      if (!grouped[item.cluster]) {
        grouped[item.cluster] = [];
      }
      grouped[item.cluster].push(item);
    }
    
    // Calculate stats for each cluster
    for (const [clusterId, items] of Object.entries(grouped)) {
      stats[clusterId] = {
        size: items.length,
        percentage: items.length / clusters.length,
        centroid: this.calculateCentroid(items.map(i => i.embedding))
      };
    }
    
    return stats;
  }
  
  calculateCentroid(embeddings) {
    const dims = embeddings[0].length;
    const centroid = new Array(dims).fill(0);
    
    for (const embedding of embeddings) {
      for (let i = 0; i < dims; i++) {
        centroid[i] += embedding[i];
      }
    }
    
    return centroid.map(val => val / embeddings.length);
  }
  
  splitData(data, validationSplit) {
    const { inputs, targets } = data;
    const splitIndex = Math.floor(inputs.length * (1 - validationSplit));
    
    // Shuffle before splitting
    const indices = this.shuffleIndices(inputs.length);
    const shuffledInputs = indices.map(i => inputs[i]);
    const shuffledTargets = indices.map(i => targets[i]);
    
    return {
      train: {
        inputs: shuffledInputs.slice(0, splitIndex),
        targets: shuffledTargets.slice(0, splitIndex)
      },
      validation: {
        inputs: shuffledInputs.slice(splitIndex),
        targets: shuffledTargets.slice(splitIndex)
      }
    };
  }
  
  shuffleIndices(length) {
    const indices = Array.from({ length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }
  
  /**
   * Get model information
   */
  getModelInfo(modelId) {
    const config = this.models.get(modelId);
    const active = this.activeModels.get(modelId);
    
    if (!config) {
      return null;
    }
    
    return {
      ...config,
      trained: !!active,
      metrics: active?.metrics,
      lastTrained: active?.trained,
      summary: active?.network?.getSummary()
    };
  }
  
  /**
   * List all available models
   */
  listModels() {
    return Array.from(this.models.values()).map(model => ({
      id: model.id,
      name: model.name,
      type: model.type,
      trained: model.trained,
      useCases: model.useCases,
      metrics: model.metrics
    }));
  }
  
  /**
   * Export trained model
   */
  exportModel(modelId) {
    const active = this.activeModels.get(modelId);
    if (!active) {
      throw new Error(`Model ${modelId} not trained`);
    }
    
    return {
      modelId,
      config: active.config,
      weights: active.network.saveWeights(),
      metrics: active.metrics,
      history: active.history,
      exported: Date.now()
    };
  }
  
  /**
   * Import trained model
   */
  importModel(data) {
    const { modelId, config, weights, metrics, history } = data;
    
    // Create network and load weights
    const network = new NeuralNetworkEngine(config.architecture);
    network.loadWeights(weights);
    
    // Store as active model
    this.activeModels.set(modelId, {
      network,
      config,
      metrics,
      history,
      trained: data.exported || Date.now()
    });
    
    // Update model registry
    this.models.set(modelId, {
      ...config,
      trained: true,
      metrics
    });
    
    logger.info(`Imported model ${modelId}`);
    
    return { modelId, success: true };
  }
}

// Export singleton
module.exports = new PatternRecognitionModels();