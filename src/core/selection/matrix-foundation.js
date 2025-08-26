/**
 * Selection Matrix Foundation
 * Core foundation for the multi-dimensional selection matrix system
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Matrix Dimensions
 */
const DIMENSIONS = {
  TASK: {
    name: 'task',
    factors: ['type', 'complexity', 'priority', 'urgency', 'department', 'ttl']
  },
  SPECIALIST: {
    name: 'specialist',
    factors: ['skills', 'experience', 'availability', 'performance', 'workload', 'state']
  },
  CONTEXT: {
    name: 'context',
    factors: ['systemLoad', 'timeOfDay', 'projectPhase', 'resourceBudget', 'deadline']
  },
  QUALITY: {
    name: 'quality',
    factors: ['accuracy', 'speed', 'reliability', 'costEfficiency', 'scalability']
  }
};

/**
 * Matrix Cell
 */
class MatrixCell {
  constructor(coordinates, value = 0) {
    this.coordinates = coordinates; // {task: {...}, specialist: {...}, context: {...}}
    this.value = value;
    this.confidence = 0;
    this.samples = 0;
    this.lastUpdated = Date.now();
    this.metadata = {};
  }
  
  update(newValue, weight = 1.0) {
    // Weighted average update
    const totalWeight = this.samples + weight;
    this.value = (this.value * this.samples + newValue * weight) / totalWeight;
    this.samples += weight;
    this.confidence = Math.min(1, this.samples / 10); // Confidence grows with samples
    this.lastUpdated = Date.now();
  }
  
  decay(factor = 0.95) {
    // Apply time decay to reduce influence of old data
    this.value *= factor;
    this.confidence *= factor;
  }
  
  serialize() {
    return {
      coordinates: this.coordinates,
      value: this.value,
      confidence: this.confidence,
      samples: this.samples,
      lastUpdated: this.lastUpdated
    };
  }
  
  static deserialize(data) {
    const cell = new MatrixCell(data.coordinates, data.value);
    cell.confidence = data.confidence;
    cell.samples = data.samples;
    cell.lastUpdated = data.lastUpdated;
    return cell;
  }
}

/**
 * Matrix Layer
 */
class MatrixLayer {
  constructor(name, dimensions) {
    this.name = name;
    this.dimensions = dimensions;
    this.cells = new Map(); // Sparse matrix storage
    this.indices = new Map(); // Fast lookup indices
    this.stats = {
      totalCells: 0,
      activeCells: 0,
      averageValue: 0,
      averageConfidence: 0
    };
  }
  
  getCellKey(coordinates) {
    // Generate unique key for cell based on coordinates
    const keys = [];
    for (const [dim, coords] of Object.entries(coordinates)) {
      const sortedCoords = Object.keys(coords).sort().map(k => `${k}:${coords[k]}`).join(',');
      keys.push(`${dim}[${sortedCoords}]`);
    }
    return keys.join('|');
  }
  
  getCell(coordinates) {
    const key = this.getCellKey(coordinates);
    return this.cells.get(key);
  }
  
  setCell(coordinates, value, confidence = 0.1) {
    const key = this.getCellKey(coordinates);
    let cell = this.cells.get(key);
    
    if (!cell) {
      cell = new MatrixCell(coordinates, value);
      cell.confidence = confidence > 0 ? confidence : 0.1;  // Start with minimum confidence
      cell.samples = 1;  // Has at least one sample
      this.cells.set(key, cell);
      this.stats.totalCells++;
      this.updateIndices(coordinates, key);
    } else {
      cell.update(value);
    }
    
    this.updateStats();
    return cell;
  }
  
  updateIndices(coordinates, key) {
    // Update dimension indices for fast lookups
    for (const [dim, coords] of Object.entries(coordinates)) {
      for (const [factor, value] of Object.entries(coords)) {
        const indexKey = `${dim}:${factor}:${value}`;
        if (!this.indices.has(indexKey)) {
          this.indices.set(indexKey, new Set());
        }
        this.indices.get(indexKey).add(key);
      }
    }
  }
  
  findCells(query) {
    // Find cells matching query criteria
    const matchingSets = [];
    
    for (const [dim, constraints] of Object.entries(query)) {
      for (const [factor, value] of Object.entries(constraints)) {
        const indexKey = `${dim}:${factor}:${value}`;
        const cellKeys = this.indices.get(indexKey);
        if (cellKeys) {
          matchingSets.push(cellKeys);
        }
      }
    }
    
    if (matchingSets.length === 0) return [];
    
    // Find intersection of all matching sets
    const intersection = matchingSets.reduce((acc, set) => {
      return new Set([...acc].filter(x => set.has(x)));
    });
    
    return Array.from(intersection).map(key => this.cells.get(key));
  }
  
  updateStats() {
    const cells = Array.from(this.cells.values());
    this.stats.activeCells = cells.filter(c => c.confidence > 0.1).length;
    
    if (cells.length > 0) {
      this.stats.averageValue = cells.reduce((sum, c) => sum + c.value, 0) / cells.length;
      this.stats.averageConfidence = cells.reduce((sum, c) => sum + c.confidence, 0) / cells.length;
    }
  }
  
  applyDecay(factor = 0.95) {
    for (const cell of this.cells.values()) {
      cell.decay(factor);
    }
    this.updateStats();
  }
  
  prune(minConfidence = 0.01) {
    // Remove cells with very low confidence
    const keysToRemove = [];
    
    for (const [key, cell] of this.cells) {
      if (cell.confidence < minConfidence) {
        keysToRemove.push(key);
      }
    }
    
    for (const key of keysToRemove) {
      this.cells.delete(key);
    }
    
    this.stats.totalCells -= keysToRemove.length;
    this.updateStats();
    
    return keysToRemove.length;
  }
}

/**
 * Main Selection Matrix
 */
class SelectionMatrix extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      // Matrix settings
      dimensions: config.dimensions || DIMENSIONS,
      maxCells: config.maxCells || 10000,
      
      // Update settings
      learningRate: config.learningRate || 0.1,
      decayFactor: config.decayFactor || 0.95,
      decayInterval: config.decayInterval || 3600000, // 1 hour
      
      // Pruning settings
      pruneInterval: config.pruneInterval || 86400000, // 24 hours
      minConfidence: config.minConfidence || 0.01,
      
      // Persistence settings
      enablePersistence: config.enablePersistence !== false,
      saveInterval: config.saveInterval || 300000 // 5 minutes
    };
    
    // Matrix layers
    this.layers = new Map();
    
    // Initialize primary layers
    this.initializeLayers();
    
    // Statistics
    this.statistics = {
      totalLookups: 0,
      totalUpdates: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageConfidence: 0,
      lastDecay: Date.now(),
      lastPrune: Date.now()
    };
    
    // Lookup cache
    this.lookupCache = new Map();
    this.cacheSize = 100;
    
    // Start maintenance processes
    this.startMaintenance();
    
    logger.info('🔲 Selection Matrix Foundation initialized');
  }
  
  /**
   * Initialize matrix layers
   */
  initializeLayers() {
    // Primary selection layer
    this.addLayer('primary', ['task', 'specialist']);
    
    // Context-aware layer
    this.addLayer('contextual', ['task', 'specialist', 'context']);
    
    // Quality optimization layer
    this.addLayer('quality', ['task', 'specialist', 'quality']);
    
    // Full dimensional layer
    this.addLayer('full', Object.keys(this.config.dimensions));
    
    logger.debug(`Initialized ${this.layers.size} matrix layers`);
  }
  
  /**
   * Add matrix layer
   */
  addLayer(name, dimensions) {
    const layer = new MatrixLayer(name, dimensions);
    this.layers.set(name, layer);
    return layer;
  }
  
  /**
   * Get layer
   */
  getLayer(name) {
    return this.layers.get(name);
  }
  
  /**
   * Lookup value in matrix
   */
  lookup(coordinates, layerName = 'primary') {
    this.statistics.totalLookups++;
    
    // Check cache
    const cacheKey = this.getCacheKey(coordinates, layerName);
    const cached = this.lookupCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 60000) {
      this.statistics.cacheHits++;
      return cached.value;
    }
    
    this.statistics.cacheMisses++;
    
    // Lookup in specified layer
    const layer = this.layers.get(layerName);
    if (!layer) {
      logger.error(`Layer ${layerName} not found`);
      return null;
    }
    
    // Try exact match
    let cell = layer.getCell(coordinates);
    
    // If no exact match, try fuzzy matching
    if (!cell) {
      cell = this.fuzzyLookup(coordinates, layer);
    }
    
    const result = cell ? {
      value: cell.value,
      confidence: cell.confidence,
      samples: cell.samples
    } : null;
    
    // Cache result
    this.cacheResult(cacheKey, result);
    
    return result;
  }
  
  /**
   * Fuzzy lookup for approximate matches
   */
  fuzzyLookup(coordinates, layer) {
    // Find cells with partial matches
    const partialQuery = {};
    
    // Use only the most important factors for fuzzy matching
    for (const [dim, coords] of Object.entries(coordinates)) {
      if (dim === 'task') {
        partialQuery[dim] = { type: coords.type };
      } else if (dim === 'specialist') {
        partialQuery[dim] = { type: coords.type };
      }
    }
    
    const matches = layer.findCells(partialQuery);
    
    if (matches.length === 0) return null;
    
    // Return best match based on confidence
    return matches.reduce((best, cell) => {
      return cell.confidence > best.confidence ? cell : best;
    });
  }
  
  /**
   * Update matrix with new data
   */
  update(coordinates, value, layerName = 'primary', weight = 1.0) {
    this.statistics.totalUpdates++;
    
    const layer = this.layers.get(layerName);
    if (!layer) {
      logger.error(`Layer ${layerName} not found`);
      return false;
    }
    
    // Get or create cell
    let cell = layer.getCell(coordinates);
    if (!cell) {
      cell = layer.setCell(coordinates, value);
    } else {
      // Update existing cell
      cell.update(value, weight);
    }
    
    // Clear cache for affected coordinates
    this.clearCacheForCoordinates(coordinates, layerName);
    
    // Emit update event
    this.emit('matrix:updated', {
      layer: layerName,
      coordinates,
      value: cell.value,
      confidence: cell.confidence
    });
    
    // Check if pruning needed
    if (layer.stats.totalCells > this.config.maxCells) {
      this.pruneLayers();
    }
    
    return true;
  }
  
  /**
   * Batch update matrix
   */
  batchUpdate(updates, layerName = 'primary') {
    const layer = this.layers.get(layerName);
    if (!layer) {
      logger.error(`Layer ${layerName} not found`);
      return 0;
    }
    
    let successCount = 0;
    
    for (const update of updates) {
      if (this.update(update.coordinates, update.value, layerName, update.weight)) {
        successCount++;
      }
    }
    
    logger.info(`Batch updated ${successCount} cells in layer ${layerName}`);
    
    return successCount;
  }
  
  /**
   * Get cache key
   */
  getCacheKey(coordinates, layerName) {
    const coordStr = JSON.stringify(coordinates);
    return `${layerName}:${coordStr}`;
  }
  
  /**
   * Cache lookup result
   */
  cacheResult(key, value) {
    this.lookupCache.set(key, {
      value,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.lookupCache.size > this.cacheSize) {
      const firstKey = this.lookupCache.keys().next().value;
      this.lookupCache.delete(firstKey);
    }
  }
  
  /**
   * Clear cache for coordinates
   */
  clearCacheForCoordinates(coordinates, layerName) {
    const keysToDelete = [];
    
    for (const key of this.lookupCache.keys()) {
      if (key.startsWith(layerName) && key.includes(JSON.stringify(coordinates))) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      this.lookupCache.delete(key);
    }
  }
  
  /**
   * Apply decay to all layers
   */
  applyDecay() {
    for (const layer of this.layers.values()) {
      layer.applyDecay(this.config.decayFactor);
    }
    
    // Clear cache since values have changed
    this.lookupCache.clear();
    
    this.statistics.lastDecay = Date.now();
    
    logger.debug('Applied decay to all matrix layers');
  }
  
  /**
   * Prune low-confidence cells
   */
  pruneLayers() {
    let totalPruned = 0;
    
    for (const [name, layer] of this.layers) {
      const pruned = layer.prune(this.config.minConfidence);
      totalPruned += pruned;
      
      if (pruned > 0) {
        logger.debug(`Pruned ${pruned} cells from layer ${name}`);
      }
    }
    
    this.statistics.lastPrune = Date.now();
    
    if (totalPruned > 0) {
      this.emit('matrix:pruned', { totalPruned });
    }
    
    return totalPruned;
  }
  
  /**
   * Start maintenance processes
   */
  startMaintenance() {
    // Decay interval
    this.decayInterval = setInterval(() => {
      this.applyDecay();
    }, this.config.decayInterval);
    
    // Prune interval
    this.pruneInterval = setInterval(() => {
      this.pruneLayers();
    }, this.config.pruneInterval);
    
    // Save interval
    if (this.config.enablePersistence) {
      this.saveInterval = setInterval(() => {
        this.save();
      }, this.config.saveInterval);
    }
    
    logger.debug('Matrix maintenance processes started');
  }
  
  /**
   * Stop maintenance processes
   */
  stopMaintenance() {
    if (this.decayInterval) clearInterval(this.decayInterval);
    if (this.pruneInterval) clearInterval(this.pruneInterval);
    if (this.saveInterval) clearInterval(this.saveInterval);
    
    logger.debug('Matrix maintenance processes stopped');
  }
  
  /**
   * Get matrix status
   */
  getStatus() {
    const status = {
      layers: {},
      statistics: this.statistics,
      cache: {
        size: this.lookupCache.size,
        hitRate: this.statistics.cacheHits / 
                 (this.statistics.cacheHits + this.statistics.cacheMisses) || 0
      }
    };
    
    for (const [name, layer] of this.layers) {
      status.layers[name] = layer.stats;
    }
    
    return status;
  }
  
  /**
   * Export matrix data
   */
  export() {
    const data = {
      timestamp: Date.now(),
      config: this.config,
      layers: {},
      statistics: this.statistics
    };
    
    for (const [name, layer] of this.layers) {
      data.layers[name] = {
        dimensions: layer.dimensions,
        cells: Array.from(layer.cells.values()).map(cell => cell.serialize()),
        stats: layer.stats
      };
    }
    
    return data;
  }
  
  /**
   * Import matrix data
   */
  import(data) {
    try {
      // Import layers
      for (const [name, layerData] of Object.entries(data.layers)) {
        const layer = this.addLayer(name, layerData.dimensions);
        
        for (const cellData of layerData.cells) {
          const cell = MatrixCell.deserialize(cellData);
          layer.cells.set(layer.getCellKey(cell.coordinates), cell);
        }
        
        layer.updateStats();
      }
      
      // Import statistics
      if (data.statistics) {
        this.statistics = { ...this.statistics, ...data.statistics };
      }
      
      logger.info('Matrix data imported successfully');
      return true;
      
    } catch (error) {
      logger.error('Failed to import matrix data:', error);
      return false;
    }
  }
  
  /**
   * Save matrix to persistent storage
   */
  async save() {
    // This would integrate with actual persistence layer
    const data = this.export();
    
    this.emit('matrix:saved', {
      timestamp: data.timestamp,
      layers: Object.keys(data.layers).length,
      totalCells: Object.values(data.layers).reduce((sum, l) => sum + l.cells.length, 0)
    });
    
    return true;
  }
  
  /**
   * Clear all matrix data
   */
  clear() {
    for (const layer of this.layers.values()) {
      layer.cells.clear();
      layer.indices.clear();
      layer.updateStats();
    }
    
    this.lookupCache.clear();
    
    this.statistics = {
      totalLookups: 0,
      totalUpdates: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageConfidence: 0,
      lastDecay: Date.now(),
      lastPrune: Date.now()
    };
    
    logger.info('Matrix cleared');
  }
  
  /**
   * Shutdown matrix
   */
  shutdown() {
    logger.info('Shutting down Selection Matrix...');
    
    this.stopMaintenance();
    
    if (this.config.enablePersistence) {
      this.save();
    }
    
    this.removeAllListeners();
    
    logger.info('Selection Matrix shutdown complete');
  }
}

module.exports = {
  SelectionMatrix,
  MatrixLayer,
  MatrixCell,
  DIMENSIONS
};