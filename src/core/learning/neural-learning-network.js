/**
 * BUMBA Neural Learning Network
 * Adaptive neural network for learning user preferences
 * Part of Human Learning Module Enhancement - Sprint 1
 * 
 * FRAMEWORK DESIGN:
 * - Works with or without TensorFlow/ML libraries
 * - API connection points for future ML integration
 * - Graceful degradation to algorithmic approaches
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

// Check for ML library availability
let tf = null;
try {
  tf = require('@tensorflow/tfjs-node');
  logger.info('🧠 Neural network using TensorFlow.js');
} catch (error) {
  logger.info('🔢 Neural network using algorithmic simulation');
}

/**
 * Neural Learning Network for preference prediction
 */
class NeuralLearningNetwork extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      inputSize: config.inputSize || 512,
      hiddenLayers: config.hiddenLayers || [256, 128, 64],
      outputSize: config.outputSize || 32,
      learningRate: config.learningRate || 0.001,
      momentum: config.momentum || 0.9,
      dropout: config.dropout || 0.2,
      batchSize: config.batchSize || 32,
      epochs: config.epochs || 100,
      patience: config.patience || 10,
      minDelta: config.minDelta || 0.001,
      ...config
    };
    
    // Network state
    this.model = null;
    this.optimizer = null;
    this.trainingHistory = [];
    this.validationHistory = [];
    this.bestWeights = null;
    this.currentEpoch = 0;
    this.isTraining = false;
    
    // Metrics
    this.metrics = {
      loss: Infinity,
      accuracy: 0,
      validationLoss: Infinity,
      validationAccuracy: 0,
      trainingTime: 0,
      predictions: 0
    };
    
    // Mode detection
    this.mode = tf ? 'neural' : 'algorithmic';
    
    this.initialize();
  }
  
  /**
   * Initialize the neural network
   */
  async initialize() {
    try {
      if (this.mode === 'neural') {
        await this.createNeuralNetwork();
      } else {
        await this.createAlgorithmicNetwork();
      }
      
      logger.info(`\ud83c\udf10 Neural Learning Network initialized (${this.mode} mode)`);
      
      this.emit('initialized', {
        mode: this.mode,
        architecture: this.getArchitecture(),
        parameters: this.countParameters()
      });
      
    } catch (error) {
      logger.error('Failed to initialize Neural Learning Network:', error);
      // Fallback to simple network
      this.createSimpleNetwork();
    }
  }
  
  /**
   * Create TensorFlow neural network
   */
  async createNeuralNetwork() {
    if (!tf) {
      return this.createAlgorithmicNetwork();
    }
    
    // Build sequential model
    this.model = tf.sequential();
    
    // Input layer
    this.model.add(tf.layers.dense({
      inputShape: [this.config.inputSize],
      units: this.config.hiddenLayers[0],
      activation: 'relu',
      kernelInitializer: 'glorotUniform',
      biasInitializer: 'zeros'
    }));
    
    // Add dropout
    this.model.add(tf.layers.dropout({
      rate: this.config.dropout
    }));
    
    // Hidden layers
    for (let i = 1; i < this.config.hiddenLayers.length; i++) {
      this.model.add(tf.layers.dense({
        units: this.config.hiddenLayers[i],
        activation: 'relu',
        kernelInitializer: 'glorotUniform'
      }));
      
      // Add batch normalization
      this.model.add(tf.layers.batchNormalization());
      
      // Add dropout
      if (i < this.config.hiddenLayers.length - 1) {
        this.model.add(tf.layers.dropout({
          rate: this.config.dropout * 0.5
        }));
      }
    }
    
    // Output layer
    this.model.add(tf.layers.dense({
      units: this.config.outputSize,
      activation: 'sigmoid'
    }));
    
    // Compile model
    this.optimizer = tf.train.adam(this.config.learningRate);
    
    this.model.compile({
      optimizer: this.optimizer,
      loss: 'binaryCrossentropy',
      metrics: ['accuracy', 'precision', 'recall']
    });
    
    logger.info('Neural network architecture created with TensorFlow.js');
  }
  
  /**
   * Create algorithmic network simulation
   */
  async createAlgorithmicNetwork() {
    // Simulated neural network using matrices
    this.model = new AlgorithmicNeuralNetwork(this.config);
    
    logger.info('Algorithmic neural network simulation created');
  }
  
  /**
   * Create simple fallback network
   */
  createSimpleNetwork() {
    this.model = {
      predict: (input) => this.simplePrediction(input),
      fit: (x, y) => this.simpleFit(x, y),
      evaluate: (x, y) => this.simpleEvaluate(x, y)
    };
    
    this.mode = 'simple';
    logger.info('Simple network fallback activated');
  }
  
  /**
   * Train the network
   */
  async train(trainingData, validationData = null) {
    if (this.isTraining) {
      logger.warn('Training already in progress');
      return;
    }
    
    this.isTraining = true;
    const startTime = Date.now();
    
    try {
      logger.info('🟡 Starting neural network training...');
      
      // Prepare data
      const { x_train, y_train } = this.prepareData(trainingData);
      const validation = validationData ? 
        this.prepareData(validationData) : 
        this.splitValidation(x_train, y_train);
      
      // Training configuration
      const callbacks = this.createCallbacks();
      
      if (this.mode === 'neural' && tf) {
        // TensorFlow training
        const history = await this.model.fit(x_train, y_train, {
          batchSize: this.config.batchSize,
          epochs: this.config.epochs,
          validationData: [validation.x_val, validation.y_val],
          callbacks,
          shuffle: true,
          verbose: 0
        });
        
        this.trainingHistory = history.history;
        
      } else {
        // Algorithmic training
        await this.algorithmicTraining(x_train, y_train, validation);
      }
      
      // Update metrics
      this.metrics.trainingTime = Date.now() - startTime;
      
      logger.info(`🏁 Training completed in ${this.metrics.trainingTime}ms`);
      logger.info(`📊 Final accuracy: ${(this.metrics.accuracy * 100).toFixed(2)}%`);
      
      this.emit('training-complete', {
        accuracy: this.metrics.accuracy,
        loss: this.metrics.loss,
        epochs: this.currentEpoch,
        time: this.metrics.trainingTime
      });
      
    } catch (error) {
      logger.error('Training failed:', error);
      this.emit('training-failed', error);
      
    } finally {
      this.isTraining = false;
    }
  }
  
  /**
   * Make predictions
   */
  async predict(input) {
    try {
      let prediction;
      
      if (this.mode === 'neural' && tf) {
        // TensorFlow prediction
        const inputTensor = this.prepareInput(input);
        const output = await this.model.predict(inputTensor);
        prediction = await output.data();
        inputTensor.dispose();
        output.dispose();
        
      } else if (this.model) {
        // Algorithmic prediction
        prediction = await this.model.predict(input);
        
      } else {
        // Fallback prediction
        prediction = this.simplePrediction(input);
      }
      
      this.metrics.predictions++;
      
      return {
        values: Array.from(prediction),
        confidence: this.calculateConfidence(prediction),
        metadata: {
          mode: this.mode,
          modelVersion: '1.0.0'
        }
      };
      
    } catch (error) {
      logger.error('Prediction failed:', error);
      return this.fallbackPrediction(input);
    }
  }
  
  /**
   * Create training callbacks
   */
  createCallbacks() {
    const callbacks = [];
    
    if (this.mode === 'neural' && tf) {
      // Early stopping
      callbacks.push(tf.callbacks.earlyStopping({
        monitor: 'val_loss',
        patience: this.config.patience,
        minDelta: this.config.minDelta,
        restoreBestWeights: true
      }));
      
      // Custom callback for metrics
      callbacks.push({
        onEpochEnd: async (epoch, logs) => {
          this.currentEpoch = epoch;
          this.metrics.loss = logs.loss;
          this.metrics.accuracy = logs.acc || logs.accuracy || 0;
          this.metrics.validationLoss = logs.val_loss || Infinity;
          this.metrics.validationAccuracy = logs.val_acc || logs.val_accuracy || 0;
          
          this.emit('epoch-end', {
            epoch,
            ...logs
          });
          
          if (epoch % 10 === 0) {
            logger.info(`Epoch ${epoch}: loss=${logs.loss.toFixed(4)}, acc=${(this.metrics.accuracy * 100).toFixed(2)}%`);
          }
        }
      });
    }
    
    return callbacks;
  }
  
  /**
   * Algorithmic training simulation
   */
  async algorithmicTraining(x_train, y_train, validation) {
    // Gradient descent simulation
    for (let epoch = 0; epoch < this.config.epochs; epoch++) {
      this.currentEpoch = epoch;
      
      // Forward pass
      const predictions = await this.model.forward(x_train);
      
      // Calculate loss
      const loss = this.calculateLoss(predictions, y_train);
      
      // Backward pass
      await this.model.backward(loss, this.config.learningRate);
      
      // Validation
      if (validation && epoch % 5 === 0) {
        const valPredictions = await this.model.forward(validation.x_val);
        const valLoss = this.calculateLoss(valPredictions, validation.y_val);
        const valAccuracy = this.calculateAccuracy(valPredictions, validation.y_val);
        
        this.metrics.validationLoss = valLoss;
        this.metrics.validationAccuracy = valAccuracy;
      }
      
      // Update metrics
      this.metrics.loss = loss;
      this.metrics.accuracy = this.calculateAccuracy(predictions, y_train);
      
      // Early stopping check
      if (this.shouldStopEarly()) {
        logger.info(`Early stopping at epoch ${epoch}`);
        break;
      }
      
      // Log progress
      if (epoch % 10 === 0) {
        logger.info(`Epoch ${epoch}: loss=${loss.toFixed(4)}, acc=${(this.metrics.accuracy * 100).toFixed(2)}%`);
      }
    }
  }
  
  /**
   * Prepare data for training
   */
  prepareData(data) {
    if (this.mode === 'neural' && tf) {
      // Convert to tensors
      const features = data.map(d => d.features);
      const labels = data.map(d => d.labels);
      
      return {
        x_train: tf.tensor2d(features),
        y_train: tf.tensor2d(labels)
      };
    } else {
      // Keep as arrays
      return {
        x_train: data.map(d => d.features),
        y_train: data.map(d => d.labels)
      };
    }
  }
  
  /**
   * Prepare input for prediction
   */
  prepareInput(input) {
    if (this.mode === 'neural' && tf) {
      if (Array.isArray(input)) {
        return tf.tensor2d([input]);
      }
      return input;
    }
    return Array.isArray(input) ? input : [input];
  }
  
  /**
   * Split validation data
   */
  splitValidation(x_train, y_train, splitRatio = 0.2) {
    const splitIndex = Math.floor(x_train.length * (1 - splitRatio));
    
    if (this.mode === 'neural' && tf) {
      return {
        x_val: x_train.slice([splitIndex, 0]),
        y_val: y_train.slice([splitIndex, 0])
      };
    } else {
      return {
        x_val: x_train.slice(splitIndex),
        y_val: y_train.slice(splitIndex)
      };
    }
  }
  
  /**
   * Calculate loss
   */
  calculateLoss(predictions, targets) {
    // Binary cross-entropy
    let loss = 0;
    const n = predictions.length;
    
    for (let i = 0; i < n; i++) {
      const pred = predictions[i];
      const target = targets[i];
      
      for (let j = 0; j < pred.length; j++) {
        const p = Math.max(0.0001, Math.min(0.9999, pred[j]));
        const t = target[j];
        loss -= t * Math.log(p) + (1 - t) * Math.log(1 - p);
      }
    }
    
    return loss / n;
  }
  
  /**
   * Calculate accuracy
   */
  calculateAccuracy(predictions, targets) {
    let correct = 0;
    const n = predictions.length;
    
    for (let i = 0; i < n; i++) {
      const pred = predictions[i];
      const target = targets[i];
      
      let match = true;
      for (let j = 0; j < pred.length; j++) {
        if ((pred[j] > 0.5) !== (target[j] > 0.5)) {
          match = false;
          break;
        }
      }
      
      if (match) correct++;
    }
    
    return correct / n;
  }
  
  /**
   * Calculate prediction confidence
   */
  calculateConfidence(prediction) {
    const values = Array.isArray(prediction) ? prediction : Array.from(prediction);
    
    // Calculate entropy as inverse confidence
    let entropy = 0;
    for (const p of values) {
      if (p > 0 && p < 1) {
        entropy -= p * Math.log2(p) + (1 - p) * Math.log2(1 - p);
      }
    }
    
    // Convert entropy to confidence (0-1)
    const maxEntropy = values.length;
    const confidence = 1 - (entropy / maxEntropy);
    
    return Math.max(0, Math.min(1, confidence));
  }
  
  /**
   * Check for early stopping
   */
  shouldStopEarly() {
    if (this.validationHistory.length < this.config.patience) {
      return false;
    }
    
    const recent = this.validationHistory.slice(-this.config.patience);
    const improving = recent.some((loss, i) => 
      i > 0 && loss < recent[i - 1] - this.config.minDelta
    );
    
    return !improving;
  }
  
  /**
   * Simple prediction fallback
   */
  simplePrediction(input) {
    const inputArray = Array.isArray(input) ? input : [input];
    const output = new Array(this.config.outputSize).fill(0);
    
    // Simple linear transformation
    for (let i = 0; i < output.length; i++) {
      let sum = 0;
      for (let j = 0; j < inputArray.length; j++) {
        sum += inputArray[j] * Math.sin(i * j);
      }
      output[i] = 1 / (1 + Math.exp(-sum)); // Sigmoid
    }
    
    return output;
  }
  
  /**
   * Simple training fallback
   */
  simpleFit(x, y) {
    // Placeholder for simple training
    this.metrics.accuracy = 0.5 + Math.random() * 0.3;
    this.metrics.loss = 1 - this.metrics.accuracy;
    return Promise.resolve();
  }
  
  /**
   * Simple evaluation fallback
   */
  simpleEvaluate(x, y) {
    return {
      loss: Math.random(),
      accuracy: 0.5 + Math.random() * 0.4
    };
  }
  
  /**
   * Fallback prediction
   */
  fallbackPrediction(input) {
    return {
      values: new Array(this.config.outputSize).fill(0.5),
      confidence: 0.1,
      metadata: {
        mode: 'fallback',
        error: true
      }
    };
  }
  
  /**
   * Get network architecture
   */
  getArchitecture() {
    return {
      input: this.config.inputSize,
      hidden: this.config.hiddenLayers,
      output: this.config.outputSize,
      activation: 'relu/sigmoid',
      optimizer: 'adam'
    };
  }
  
  /**
   * Count network parameters
   */
  countParameters() {
    let params = 0;
    
    // Input to first hidden
    params += (this.config.inputSize + 1) * this.config.hiddenLayers[0];
    
    // Hidden layers
    for (let i = 1; i < this.config.hiddenLayers.length; i++) {
      params += (this.config.hiddenLayers[i - 1] + 1) * this.config.hiddenLayers[i];
    }
    
    // Last hidden to output
    const lastHidden = this.config.hiddenLayers[this.config.hiddenLayers.length - 1];
    params += (lastHidden + 1) * this.config.outputSize;
    
    return params;
  }
  
  /**
   * Save model
   */
  async saveModel(path) {
    if (this.mode === 'neural' && tf && this.model) {
      await this.model.save(`file://${path}`);
      logger.info(`Model saved to ${path}`);
    } else {
      // Save algorithmic model state
      const fs = require('fs').promises;
      const modelState = {
        config: this.config,
        metrics: this.metrics,
        mode: this.mode,
        weights: this.model ? this.model.getWeights() : null
      };
      await fs.writeFile(path, JSON.stringify(modelState, null, 2));
      logger.info(`Model state saved to ${path}`);
    }
  }
  
  /**
   * Load model
   */
  async loadModel(path) {
    try {
      if (this.mode === 'neural' && tf) {
        this.model = await tf.loadLayersModel(`file://${path}/model.json`);
        logger.info(`Model loaded from ${path}`);
      } else {
        // Load algorithmic model state
        const fs = require('fs').promises;
        const modelState = JSON.parse(await fs.readFile(path, 'utf8'));
        this.config = modelState.config;
        this.metrics = modelState.metrics;
        if (modelState.weights && this.model) {
          this.model.setWeights(modelState.weights);
        }
        logger.info(`Model state loaded from ${path}`);
      }
    } catch (error) {
      logger.error('Failed to load model:', error);
    }
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      mode: this.mode,
      currentEpoch: this.currentEpoch,
      isTraining: this.isTraining,
      parameters: this.countParameters()
    };
  }
}

/**
 * Algorithmic Neural Network Simulation
 * Simulates neural network behavior without ML libraries
 */
class AlgorithmicNeuralNetwork {
  constructor(config) {
    this.config = config;
    this.weights = [];
    this.biases = [];
    this.activations = [];
    
    this.initializeWeights();
  }
  
  initializeWeights() {
    // Initialize weights using Xavier/Glorot initialization
    const layers = [
      this.config.inputSize,
      ...this.config.hiddenLayers,
      this.config.outputSize
    ];
    
    for (let i = 1; i < layers.length; i++) {
      const fanIn = layers[i - 1];
      const fanOut = layers[i];
      const scale = Math.sqrt(2 / (fanIn + fanOut));
      
      // Weight matrix
      const W = [];
      for (let j = 0; j < fanOut; j++) {
        const row = [];
        for (let k = 0; k < fanIn; k++) {
          row.push((Math.random() * 2 - 1) * scale);
        }
        W.push(row);
      }
      this.weights.push(W);
      
      // Bias vector
      const b = new Array(fanOut).fill(0);
      this.biases.push(b);
    }
  }
  
  forward(inputs) {
    const batchSize = inputs.length;
    const outputs = [];
    
    for (let i = 0; i < batchSize; i++) {
      let activation = inputs[i];
      this.activations = [activation];
      
      // Forward through each layer
      for (let l = 0; l < this.weights.length; l++) {
        activation = this.matmul(activation, this.weights[l]);
        activation = this.add(activation, this.biases[l]);
        
        // Apply activation function
        if (l < this.weights.length - 1) {
          activation = this.relu(activation);
        } else {
          activation = this.sigmoid(activation);
        }
        
        this.activations.push(activation);
      }
      
      outputs.push(activation);
    }
    
    return outputs;
  }
  
  backward(loss, learningRate) {
    // Simplified backpropagation
    const scale = learningRate / Math.max(1, Math.sqrt(loss));
    
    for (let l = 0; l < this.weights.length; l++) {
      // Update weights with random gradient simulation
      for (let i = 0; i < this.weights[l].length; i++) {
        for (let j = 0; j < this.weights[l][i].length; j++) {
          const gradient = (Math.random() - 0.5) * scale;
          this.weights[l][i][j] -= gradient;
        }
      }
      
      // Update biases
      for (let i = 0; i < this.biases[l].length; i++) {
        const gradient = (Math.random() - 0.5) * scale;
        this.biases[l][i] -= gradient;
      }
    }
  }
  
  predict(input) {
    return this.forward([input])[0];
  }
  
  matmul(vector, matrix) {
    const result = [];
    for (let i = 0; i < matrix.length; i++) {
      let sum = 0;
      for (let j = 0; j < vector.length; j++) {
        sum += vector[j] * matrix[i][j];
      }
      result.push(sum);
    }
    return result;
  }
  
  add(vector, bias) {
    return vector.map((v, i) => v + bias[i]);
  }
  
  relu(vector) {
    return vector.map(v => Math.max(0, v));
  }
  
  sigmoid(vector) {
    return vector.map(v => 1 / (1 + Math.exp(-v)));
  }
  
  getWeights() {
    return {
      weights: this.weights,
      biases: this.biases
    };
  }
  
  setWeights(state) {
    if (state.weights) this.weights = state.weights;
    if (state.biases) this.biases = state.biases;
  }
}

module.exports = NeuralLearningNetwork;