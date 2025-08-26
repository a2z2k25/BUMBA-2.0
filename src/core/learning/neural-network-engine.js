/**
 * BUMBA Neural Network Engine
 * Real neural network implementation with forward/backward propagation
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class NeuralNetworkEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      inputSize: config.inputSize || 10,
      hiddenLayers: config.hiddenLayers || [64, 32],
      outputSize: config.outputSize || 1,
      activation: config.activation || 'relu',
      outputActivation: config.outputActivation || 'sigmoid',
      weightInit: config.weightInit || 'xavier',
      ...config
    };
    
    // Network structure
    this.layers = [];
    this.weights = [];
    this.biases = [];
    this.activations = [];
    
    // Training state
    this.gradients = [];
    this.velocities = [];
    this.caches = [];
    
    // Initialize network
    this.initializeNetwork();
  }
  
  /**
   * Initialize network layers and weights
   */
  initializeNetwork() {
    const layerSizes = [
      this.config.inputSize,
      ...this.config.hiddenLayers,
      this.config.outputSize
    ];
    
    // Initialize weights and biases for each layer
    for (let i = 0; i < layerSizes.length - 1; i++) {
      const inputDim = layerSizes[i];
      const outputDim = layerSizes[i + 1];
      
      // Initialize weights based on method
      const weights = this.initializeWeights(inputDim, outputDim);
      const biases = this.initializeBiases(outputDim);
      
      this.weights.push(weights);
      this.biases.push(biases);
      
      // Initialize optimizer states
      this.velocities.push({
        weights: this.createZeroMatrix(inputDim, outputDim),
        biases: new Array(outputDim).fill(0)
      });
      
      this.gradients.push({
        weights: this.createZeroMatrix(inputDim, outputDim),
        biases: new Array(outputDim).fill(0)
      });
    }
    
    logger.info(`Neural network initialized with architecture: ${layerSizes.join(' -> ')}`);
  }
  
  /**
   * Initialize weights using specified method
   */
  initializeWeights(inputDim, outputDim) {
    const weights = [];
    let scale;
    
    switch (this.config.weightInit) {
      case 'xavier':
        scale = Math.sqrt(2.0 / (inputDim + outputDim));
        break;
      case 'he':
        scale = Math.sqrt(2.0 / inputDim);
        break;
      case 'lecun':
        scale = Math.sqrt(1.0 / inputDim);
        break;
      default:
        scale = 0.01;
    }
    
    for (let i = 0; i < inputDim; i++) {
      const row = [];
      for (let j = 0; j < outputDim; j++) {
        row.push(this.gaussianRandom() * scale);
      }
      weights.push(row);
    }
    
    return weights;
  }
  
  /**
   * Initialize biases
   */
  initializeBiases(size) {
    return new Array(size).fill(0.01);
  }
  
  /**
   * Forward propagation
   */
  forward(input, training = false) {
    let activation = input;
    this.activations = [activation];
    
    // Forward through each layer
    for (let i = 0; i < this.weights.length; i++) {
      // Linear transformation: z = Wx + b
      const z = this.linearForward(activation, this.weights[i], this.biases[i]);
      
      // Apply activation function
      const isOutputLayer = (i === this.weights.length - 1);
      const activationFn = isOutputLayer ? this.config.outputActivation : this.config.activation;
      activation = this.applyActivation(z, activationFn);
      
      // Store for backpropagation
      if (training) {
        this.activations.push(activation);
        this.caches.push({ z, activation: activation });
      }
    }
    
    return activation;
  }
  
  /**
   * Linear forward: z = Wx + b
   */
  linearForward(input, weights, biases) {
    const output = [];
    
    for (let i = 0; i < weights[0].length; i++) {
      let sum = biases[i];
      for (let j = 0; j < input.length; j++) {
        sum += input[j] * weights[j][i];
      }
      output.push(sum);
    }
    
    return output;
  }
  
  /**
   * Apply activation function
   */
  applyActivation(z, activationType) {
    switch (activationType) {
      case 'relu':
        return z.map(val => Math.max(0, val));
      
      case 'leaky_relu':
        return z.map(val => val > 0 ? val : 0.01 * val);
      
      case 'sigmoid':
        return z.map(val => 1 / (1 + Math.exp(-val)));
      
      case 'tanh':
        return z.map(val => Math.tanh(val));
      
      case 'softmax':
        const maxZ = Math.max(...z);
        const expZ = z.map(val => Math.exp(val - maxZ));
        const sumExpZ = expZ.reduce((a, b) => a + b, 0);
        return expZ.map(val => val / sumExpZ);
      
      case 'linear':
        return z;
      
      default:
        return z;
    }
  }
  
  /**
   * Backward propagation
   */
  backward(input, target, output, lossType = 'mse') {
    const batchSize = 1; // Single sample for now
    
    // Calculate output layer gradient
    let delta = this.calculateOutputGradient(output, target, lossType);
    
    // Backpropagate through layers
    for (let i = this.weights.length - 1; i >= 0; i--) {
      const activation = i > 0 ? this.activations[i] : input;
      
      // Calculate gradients
      this.gradients[i].weights = this.outerProduct(activation, delta);
      this.gradients[i].biases = delta;
      
      // Propagate error to previous layer
      if (i > 0) {
        const prevDelta = this.matrixVectorMultiply(
          this.transpose(this.weights[i]), 
          delta
        );
        
        // Apply activation derivative
        const activationDeriv = this.activationDerivative(
          this.caches[i - 1].z,
          this.config.activation
        );
        
        delta = this.elementwiseMultiply(prevDelta, activationDeriv);
      }
    }
  }
  
  /**
   * Calculate output layer gradient based on loss
   */
  calculateOutputGradient(output, target, lossType) {
    switch (lossType) {
      case 'mse':
        return output.map((o, i) => 2 * (o - target[i]));
      
      case 'cross_entropy':
        return output.map((o, i) => o - target[i]);
      
      case 'binary_cross_entropy':
        return output.map((o, i) => {
          const epsilon = 1e-7;
          return (o - target[i]) / (o * (1 - o) + epsilon);
        });
      
      default:
        return output.map((o, i) => o - target[i]);
    }
  }
  
  /**
   * Calculate activation derivative
   */
  activationDerivative(z, activationType) {
    switch (activationType) {
      case 'relu':
        return z.map(val => val > 0 ? 1 : 0);
      
      case 'leaky_relu':
        return z.map(val => val > 0 ? 1 : 0.01);
      
      case 'sigmoid':
        const sigmoid = z.map(val => 1 / (1 + Math.exp(-val)));
        return sigmoid.map(s => s * (1 - s));
      
      case 'tanh':
        const tanh = z.map(val => Math.tanh(val));
        return tanh.map(t => 1 - t * t);
      
      case 'linear':
        return z.map(() => 1);
      
      default:
        return z.map(() => 1);
    }
  }
  
  /**
   * Update weights using optimizer
   */
  updateWeights(learningRate, optimizer = 'sgd', momentum = 0.9) {
    for (let i = 0; i < this.weights.length; i++) {
      switch (optimizer) {
        case 'sgd':
          this.sgdUpdate(i, learningRate);
          break;
        
        case 'momentum':
          this.momentumUpdate(i, learningRate, momentum);
          break;
        
        case 'adam':
          this.adamUpdate(i, learningRate);
          break;
        
        case 'rmsprop':
          this.rmspropUpdate(i, learningRate);
          break;
        
        default:
          this.sgdUpdate(i, learningRate);
      }
    }
  }
  
  /**
   * SGD weight update
   */
  sgdUpdate(layerIndex, learningRate) {
    const weights = this.weights[layerIndex];
    const biases = this.biases[layerIndex];
    const gradWeights = this.gradients[layerIndex].weights;
    const gradBiases = this.gradients[layerIndex].biases;
    
    // Update weights
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights[i].length; j++) {
        weights[i][j] -= learningRate * gradWeights[i][j];
      }
    }
    
    // Update biases
    for (let i = 0; i < biases.length; i++) {
      biases[i] -= learningRate * gradBiases[i];
    }
  }
  
  /**
   * Momentum weight update
   */
  momentumUpdate(layerIndex, learningRate, momentum) {
    const weights = this.weights[layerIndex];
    const biases = this.biases[layerIndex];
    const gradWeights = this.gradients[layerIndex].weights;
    const gradBiases = this.gradients[layerIndex].biases;
    const velocities = this.velocities[layerIndex];
    
    // Update weight velocities and weights
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights[i].length; j++) {
        velocities.weights[i][j] = momentum * velocities.weights[i][j] - learningRate * gradWeights[i][j];
        weights[i][j] += velocities.weights[i][j];
      }
    }
    
    // Update bias velocities and biases
    for (let i = 0; i < biases.length; i++) {
      velocities.biases[i] = momentum * velocities.biases[i] - learningRate * gradBiases[i];
      biases[i] += velocities.biases[i];
    }
  }
  
  /**
   * Adam optimizer update
   */
  adamUpdate(layerIndex, learningRate, beta1 = 0.9, beta2 = 0.999, epsilon = 1e-8) {
    // Initialize Adam parameters if not exists
    if (!this.adamParams) {
      this.adamParams = {
        m: [], // First moment
        v: [], // Second moment
        t: 0   // Time step
      };
      
      for (let i = 0; i < this.weights.length; i++) {
        this.adamParams.m.push({
          weights: this.createZeroMatrix(this.weights[i].length, this.weights[i][0].length),
          biases: new Array(this.biases[i].length).fill(0)
        });
        this.adamParams.v.push({
          weights: this.createZeroMatrix(this.weights[i].length, this.weights[i][0].length),
          biases: new Array(this.biases[i].length).fill(0)
        });
      }
    }
    
    this.adamParams.t++;
    const t = this.adamParams.t;
    
    const weights = this.weights[layerIndex];
    const biases = this.biases[layerIndex];
    const gradWeights = this.gradients[layerIndex].weights;
    const gradBiases = this.gradients[layerIndex].biases;
    const m = this.adamParams.m[layerIndex];
    const v = this.adamParams.v[layerIndex];
    
    // Bias correction
    const biasCorrection1 = 1 - Math.pow(beta1, t);
    const biasCorrection2 = 1 - Math.pow(beta2, t);
    
    // Update weights
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights[i].length; j++) {
        // Update moments
        m.weights[i][j] = beta1 * m.weights[i][j] + (1 - beta1) * gradWeights[i][j];
        v.weights[i][j] = beta2 * v.weights[i][j] + (1 - beta2) * gradWeights[i][j] * gradWeights[i][j];
        
        // Bias-corrected moments
        const mHat = m.weights[i][j] / biasCorrection1;
        const vHat = v.weights[i][j] / biasCorrection2;
        
        // Update weights
        weights[i][j] -= learningRate * mHat / (Math.sqrt(vHat) + epsilon);
      }
    }
    
    // Update biases
    for (let i = 0; i < biases.length; i++) {
      m.biases[i] = beta1 * m.biases[i] + (1 - beta1) * gradBiases[i];
      v.biases[i] = beta2 * v.biases[i] + (1 - beta2) * gradBiases[i] * gradBiases[i];
      
      const mHat = m.biases[i] / biasCorrection1;
      const vHat = v.biases[i] / biasCorrection2;
      
      biases[i] -= learningRate * mHat / (Math.sqrt(vHat) + epsilon);
    }
  }
  
  /**
   * RMSProp optimizer update
   */
  rmspropUpdate(layerIndex, learningRate, decay = 0.9, epsilon = 1e-8) {
    if (!this.rmspropCache) {
      this.rmspropCache = [];
      for (let i = 0; i < this.weights.length; i++) {
        this.rmspropCache.push({
          weights: this.createZeroMatrix(this.weights[i].length, this.weights[i][0].length),
          biases: new Array(this.biases[i].length).fill(0)
        });
      }
    }
    
    const weights = this.weights[layerIndex];
    const biases = this.biases[layerIndex];
    const gradWeights = this.gradients[layerIndex].weights;
    const gradBiases = this.gradients[layerIndex].biases;
    const cache = this.rmspropCache[layerIndex];
    
    // Update weights
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights[i].length; j++) {
        cache.weights[i][j] = decay * cache.weights[i][j] + (1 - decay) * gradWeights[i][j] * gradWeights[i][j];
        weights[i][j] -= learningRate * gradWeights[i][j] / (Math.sqrt(cache.weights[i][j]) + epsilon);
      }
    }
    
    // Update biases
    for (let i = 0; i < biases.length; i++) {
      cache.biases[i] = decay * cache.biases[i] + (1 - decay) * gradBiases[i] * gradBiases[i];
      biases[i] -= learningRate * gradBiases[i] / (Math.sqrt(cache.biases[i]) + epsilon);
    }
  }
  
  /**
   * Train on batch of data
   */
  trainBatch(inputs, targets, learningRate = 0.01, optimizer = 'adam') {
    let totalLoss = 0;
    
    // Process each sample
    for (let i = 0; i < inputs.length; i++) {
      // Forward pass
      const output = this.forward(inputs[i], true);
      
      // Calculate loss
      const loss = this.calculateLoss(output, targets[i]);
      totalLoss += loss;
      
      // Backward pass
      this.backward(inputs[i], targets[i], output);
      
      // Update weights after each sample (online learning)
      // For mini-batch, accumulate gradients and update after batch
      this.updateWeights(learningRate, optimizer);
    }
    
    return totalLoss / inputs.length;
  }
  
  /**
   * Calculate loss
   */
  calculateLoss(output, target, lossType = 'mse') {
    switch (lossType) {
      case 'mse':
        return output.reduce((sum, o, i) => sum + Math.pow(o - target[i], 2), 0) / output.length;
      
      case 'cross_entropy':
        return -target.reduce((sum, t, i) => {
          const o = Math.max(1e-7, Math.min(1 - 1e-7, output[i]));
          return sum + t * Math.log(o);
        }, 0);
      
      case 'binary_cross_entropy':
        return -target.reduce((sum, t, i) => {
          const o = Math.max(1e-7, Math.min(1 - 1e-7, output[i]));
          return sum + t * Math.log(o) + (1 - t) * Math.log(1 - o);
        }, 0) / output.length;
      
      default:
        return 0;
    }
  }
  
  /**
   * Predict on input
   */
  predict(input) {
    return this.forward(input, false);
  }
  
  /**
   * Evaluate on dataset
   */
  evaluate(inputs, targets, metric = 'accuracy') {
    let correct = 0;
    let totalLoss = 0;
    
    for (let i = 0; i < inputs.length; i++) {
      const output = this.predict(inputs[i]);
      totalLoss += this.calculateLoss(output, targets[i]);
      
      if (metric === 'accuracy') {
        // For classification
        const predicted = output.indexOf(Math.max(...output));
        const actual = targets[i].indexOf(Math.max(...targets[i]));
        if (predicted === actual) correct++;
      }
    }
    
    return {
      loss: totalLoss / inputs.length,
      accuracy: correct / inputs.length
    };
  }
  
  // Matrix operations
  
  createZeroMatrix(rows, cols) {
    const matrix = [];
    for (let i = 0; i < rows; i++) {
      matrix.push(new Array(cols).fill(0));
    }
    return matrix;
  }
  
  outerProduct(vec1, vec2) {
    const result = [];
    for (let i = 0; i < vec1.length; i++) {
      const row = [];
      for (let j = 0; j < vec2.length; j++) {
        row.push(vec1[i] * vec2[j]);
      }
      result.push(row);
    }
    return result;
  }
  
  matrixVectorMultiply(matrix, vector) {
    const result = [];
    for (let i = 0; i < matrix.length; i++) {
      let sum = 0;
      for (let j = 0; j < vector.length; j++) {
        sum += matrix[i][j] * vector[j];
      }
      result.push(sum);
    }
    return result;
  }
  
  transpose(matrix) {
    const result = [];
    for (let j = 0; j < matrix[0].length; j++) {
      const row = [];
      for (let i = 0; i < matrix.length; i++) {
        row.push(matrix[i][j]);
      }
      result.push(row);
    }
    return result;
  }
  
  elementwiseMultiply(vec1, vec2) {
    return vec1.map((v, i) => v * vec2[i]);
  }
  
  gaussianRandom() {
    // Box-Muller transform for Gaussian distribution
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
  
  /**
   * Save network weights
   */
  saveWeights() {
    return {
      weights: this.weights.map(w => w.map(row => [...row])),
      biases: this.biases.map(b => [...b]),
      config: this.config
    };
  }
  
  /**
   * Load network weights
   */
  loadWeights(data) {
    this.weights = data.weights.map(w => w.map(row => [...row]));
    this.biases = data.biases.map(b => [...b]);
    this.config = { ...this.config, ...data.config };
  }
  
  /**
   * Get network summary
   */
  getSummary() {
    const totalParams = this.weights.reduce((sum, w, i) => {
      const weightParams = w.length * w[0].length;
      const biasParams = this.biases[i].length;
      return sum + weightParams + biasParams;
    }, 0);
    
    return {
      architecture: [this.config.inputSize, ...this.config.hiddenLayers, this.config.outputSize],
      totalLayers: this.weights.length,
      totalParameters: totalParams,
      activation: this.config.activation,
      outputActivation: this.config.outputActivation
    };
  }
}

module.exports = NeuralNetworkEngine;