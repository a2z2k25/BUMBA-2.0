/**
 * BUMBA Interactive Mode - Sprint 2: Real-time Updates & Feedback
 * 
 * Live feedback system with streaming output, progress tracking,
 * status indicators, and operation time estimates
 */

const EventEmitter = require('events');
const { Transform } = require('stream');

/**
 * Real-time Update System for Interactive Mode
 * Provides live feedback during all operations
 */
class InteractiveRealtime extends EventEmitter {
  constructor(ui, config = {}) {
    super();
    
    this.ui = ui;
    
    this.config = {
      // Update intervals
      progressInterval: config.progressInterval || 100, // ms
      statusInterval: config.statusInterval || 500, // ms
      estimateInterval: config.estimateInterval || 1000, // ms
      
      // Buffer settings
      bufferSize: config.bufferSize || 1000,
      flushInterval: config.flushInterval || 50, // ms
      
      // Display settings
      maxOutputLines: config.maxOutputLines || 20,
      showTimestamps: config.showTimestamps !== false,
      showETA: config.showETA !== false,
      
      // Performance
      smoothing: config.smoothing || 0.7 // ETA smoothing factor
    };
    
    // State
    this.operations = new Map();
    this.streams = new Map();
    this.buffers = new Map();
    this.estimates = new Map();
    
    // Metrics
    this.metrics = {
      operationsStarted: 0,
      operationsCompleted: 0,
      averageDuration: 0,
      totalDataProcessed: 0
    };
    
    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Start monitoring intervals
   */
  startMonitoring() {
    // Progress updates
    this.progressInterval = setInterval(() => {
      this.updateAllProgress();
    }, this.config.progressInterval);
    
    // Status updates
    this.statusInterval = setInterval(() => {
      this.updateAllStatus();
    }, this.config.statusInterval);
    
    // ETA calculations
    this.estimateInterval = setInterval(() => {
      this.updateAllEstimates();
    }, this.config.estimateInterval);
  }

  /**
   * Start tracking an operation
   */
  startOperation(id, options = {}) {
    const operation = {
      id,
      name: options.name || id,
      type: options.type || 'generic',
      startTime: Date.now(),
      progress: 0,
      status: 'running',
      data: options.data || {},
      
      // Progress tracking
      totalSteps: options.totalSteps || 100,
      currentStep: 0,
      
      // UI components
      spinner: null,
      progressBar: null,
      
      // Options
      showProgress: options.showProgress !== false,
      showSpinner: options.showSpinner !== false,
      showETA: options.showETA !== false
    };
    
    this.operations.set(id, operation);
    this.metrics.operationsStarted++;
    
    // Create UI components
    if (operation.showSpinner && !operation.showProgress) {
      operation.spinner = this.ui.createSpinner(operation.name, {
        id: `spinner-${id}`,
        prefix: this.ui.config.useEmoji ? '🔄 ' : ''
      });
      operation.spinner.start();
    }
    
    if (operation.showProgress) {
      operation.progressBar = this.ui.createProgressBar(`progress-${id}`, {
        label: operation.name,
        clearOnComplete: false
      });
      operation.progressBar.start(operation.totalSteps, 0);
    }
    
    // Initialize estimate
    if (operation.showETA) {
      this.estimates.set(id, {
        startTime: Date.now(),
        samples: [],
        estimatedTotal: 0,
        estimatedRemaining: 0
      });
    }
    
    this.emit('operation-started', operation);
    
    return operation;
  }

  /**
   * Update operation progress
   */
  updateProgress(id, progress, message = null) {
    const operation = this.operations.get(id);
    if (!operation) return;
    
    operation.currentStep = progress;
    operation.progress = (progress / operation.totalSteps) * 100;
    
    if (message) {
      operation.message = message;
    }
    
    // Update UI components
    if (operation.progressBar) {
      operation.progressBar.update(progress, {
        message: message || ''
      });
    }
    
    if (operation.spinner && message) {
      operation.spinner.text = `${operation.name}: ${message}`;
    }
    
    // Update estimate
    if (operation.showETA) {
      this.updateEstimate(id, progress);
    }
    
    this.emit('progress-updated', {
      id,
      progress: operation.progress,
      message
    });
  }

  /**
   * Complete an operation
   */
  completeOperation(id, result = null) {
    const operation = this.operations.get(id);
    if (!operation) return;
    
    operation.endTime = Date.now();
    operation.duration = operation.endTime - operation.startTime;
    operation.status = 'completed';
    operation.result = result;
    
    // Update metrics
    this.metrics.operationsCompleted++;
    this.updateAverageDuration(operation.duration);
    
    // Update UI
    if (operation.progressBar) {
      operation.progressBar.update(operation.totalSteps);
      operation.progressBar.stop();
    }
    
    if (operation.spinner) {
      operation.spinner.succeed(`${operation.name} completed in ${this.formatDuration(operation.duration)}`);
    }
    
    // Show completion notification
    if (!operation.spinner && !operation.progressBar) {
      this.ui.displayNotification(
        `${operation.name} completed in ${this.formatDuration(operation.duration)}`,
        'success'
      );
    }
    
    this.emit('operation-completed', operation);
    
    // Clean up after delay
    setTimeout(() => {
      this.operations.delete(id);
      this.estimates.delete(id);
    }, 5000);
    
    return operation;
  }

  /**
   * Fail an operation
   */
  failOperation(id, error) {
    const operation = this.operations.get(id);
    if (!operation) return;
    
    operation.endTime = Date.now();
    operation.duration = operation.endTime - operation.startTime;
    operation.status = 'failed';
    operation.error = error;
    
    // Update UI
    if (operation.progressBar) {
      operation.progressBar.stop();
    }
    
    if (operation.spinner) {
      operation.spinner.fail(`${operation.name} failed: ${error.message || error}`);
    } else {
      this.ui.displayNotification(
        `${operation.name} failed: ${error.message || error}`,
        'error'
      );
    }
    
    this.emit('operation-failed', operation);
    
    // Clean up
    setTimeout(() => {
      this.operations.delete(id);
      this.estimates.delete(id);
    }, 5000);
  }

  /**
   * Create streaming output
   */
  createOutputStream(id, options = {}) {
    const buffer = [];
    this.buffers.set(id, buffer);
    
    const stream = new Transform({
      transform: (chunk, encoding, callback) => {
        const lines = chunk.toString().split('\n');
        
        lines.forEach(line => {
          if (line.trim()) {
            buffer.push({
              timestamp: Date.now(),
              content: line,
              type: options.type || 'output'
            });
            
            // Trim buffer if too large
            if (buffer.length > this.config.bufferSize) {
              buffer.shift();
            }
            
            // Display immediately if requested
            if (options.immediate) {
              this.displayStreamLine(id, line);
            }
          }
        });
        
        callback(null, chunk);
      }
    });
    
    this.streams.set(id, stream);
    
    // Set up flush interval
    const flushInterval = setInterval(() => {
      this.flushStream(id);
    }, this.config.flushInterval);
    
    stream.on('end', () => {
      clearInterval(flushInterval);
      this.flushStream(id);
      this.streams.delete(id);
      this.buffers.delete(id);
    });
    
    return stream;
  }

  /**
   * Display stream line
   */
  displayStreamLine(id, line) {
    const timestamp = this.config.showTimestamps ? this.ui.getTimestamp() + ' ' : '';
    const operation = this.operations.get(id);
    const prefix = operation ? `[${operation.name}] ` : '';
    
    console.log(`${timestamp}${this.ui.colors.dim(prefix)}${line}`);
  }

  /**
   * Flush stream buffer
   */
  flushStream(id) {
    const buffer = this.buffers.get(id);
    if (!buffer || buffer.length === 0) return;
    
    const lines = buffer.splice(0, this.config.maxOutputLines);
    
    lines.forEach(entry => {
      this.displayStreamLine(id, entry.content);
    });
  }

  /**
   * Display department status in real-time
   */
  displayDepartmentStatus(departments) {
    // Save cursor position
    this.ui.saveCursor();
    
    // Create status display
    const statusLines = [];
    
    statusLines.push(this.ui.colors.primary('Department Activity:'));
    
    departments.forEach(dept => {
      const bar = this.createDepartmentBar(dept);
      statusLines.push(bar);
    });
    
    // Display status
    statusLines.forEach(line => console.log(line));
    
    // Restore cursor
    this.ui.restoreCursor();
  }

  /**
   * Create department activity bar
   */
  createDepartmentBar(dept) {
    const emoji = this.ui.config.useEmoji ? this.getDepartmentEmoji(dept.name) : '';
    const name = dept.name.padEnd(10);
    const bar = this.ui.createMiniBar(dept.activity || 0, 20);
    const status = dept.currentTask || 'Idle';
    
    return `${emoji} ${this.ui.colors.secondary(name)} ${bar} ${this.ui.colors.dim(status)}`;
  }

  /**
   * Get department emoji
   */
  getDepartmentEmoji(name) {
    const emojis = {
      'Backend': '🔵',
      'Design': '🔴',
      'Product': '📊',
      'Engineering': '🟢️',
      'Marketing': '📢'
    };
    
    return emojis[name] || '📁';
  }

  /**
   * Update estimate for operation
   */
  updateEstimate(id, currentProgress) {
    const estimate = this.estimates.get(id);
    if (!estimate) return;
    
    const operation = this.operations.get(id);
    if (!operation) return;
    
    const elapsed = Date.now() - estimate.startTime;
    const progressRate = currentProgress / elapsed; // steps per ms
    
    // Add sample
    estimate.samples.push({
      progress: currentProgress,
      elapsed,
      rate: progressRate
    });
    
    // Keep only recent samples
    if (estimate.samples.length > 10) {
      estimate.samples.shift();
    }
    
    // Calculate smoothed rate
    const avgRate = estimate.samples.reduce((sum, s) => sum + s.rate, 0) / estimate.samples.length;
    
    // Estimate remaining time
    const remainingSteps = operation.totalSteps - currentProgress;
    const estimatedRemaining = remainingSteps / avgRate;
    
    // Apply smoothing
    if (estimate.estimatedRemaining > 0) {
      estimate.estimatedRemaining = 
        this.config.smoothing * estimate.estimatedRemaining +
        (1 - this.config.smoothing) * estimatedRemaining;
    } else {
      estimate.estimatedRemaining = estimatedRemaining;
    }
    
    // Update display
    if (operation.progressBar && this.config.showETA) {
      const eta = this.formatDuration(estimate.estimatedRemaining);
      operation.progressBar.update(currentProgress, {
        eta: `ETA: ${eta}`
      });
    }
  }

  /**
   * Update all progress bars
   */
  updateAllProgress() {
    this.operations.forEach(operation => {
      if (operation.status === 'running' && operation.showProgress) {
        // Simulate progress if not explicitly updated
        if (Date.now() - operation.startTime > 100) {
          const autoProgress = Math.min(
            operation.currentStep + 1,
            operation.totalSteps
          );
          
          if (autoProgress !== operation.currentStep) {
            // Only auto-update if no manual updates
            const timeSinceStart = Date.now() - operation.startTime;
            if (timeSinceStart > 5000 && operation.currentStep === 0) {
              this.updateProgress(operation.id, autoProgress);
            }
          }
        }
      }
    });
  }

  /**
   * Update all status displays
   */
  updateAllStatus() {
    // Emit status update event
    const status = {
      active: this.operations.size,
      completed: this.metrics.operationsCompleted,
      averageDuration: this.metrics.averageDuration
    };
    
    this.emit('status-update', status);
  }

  /**
   * Update all estimates
   */
  updateAllEstimates() {
    this.estimates.forEach((estimate, id) => {
      const operation = this.operations.get(id);
      if (operation && operation.status === 'running') {
        // Recalculate estimate
        this.updateEstimate(id, operation.currentStep);
      }
    });
  }

  /**
   * Update average duration metric
   */
  updateAverageDuration(duration) {
    const total = this.metrics.averageDuration * (this.metrics.operationsCompleted - 1) + duration;
    this.metrics.averageDuration = total / this.metrics.operationsCompleted;
  }

  /**
   * Format duration for display
   */
  formatDuration(ms) {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  }

  /**
   * Display operation summary
   */
  displaySummary() {
    const table = this.ui.createTable({
      head: ['Operation', 'Status', 'Progress', 'Duration', 'ETA'],
      colWidths: [20, 10, 15, 12, 10]
    });
    
    this.operations.forEach(op => {
      const estimate = this.estimates.get(op.id);
      const eta = estimate && op.status === 'running' ? 
        this.formatDuration(estimate.estimatedRemaining) : '-';
      
      const duration = op.status === 'running' ?
        this.formatDuration(Date.now() - op.startTime) :
        this.formatDuration(op.duration || 0);
      
      table.push([
        op.name,
        this.ui.getStatusIcon(op.status),
        this.ui.createMiniBar(op.progress, 10),
        duration,
        eta
      ]);
    });
    
    console.log(table.toString());
  }

  /**
   * Create live dashboard
   */
  createDashboard() {
    // Clear screen
    this.ui.clear();
    
    // Display header
    this.ui.displayBanner('BUMBA', { font: 'Small' });
    
    // Display metrics
    this.ui.displayHeader('System Metrics', 2);
    this.ui.displayKeyValue({
      'Active Operations': this.operations.size,
      'Completed': this.metrics.operationsCompleted,
      'Average Duration': this.formatDuration(this.metrics.averageDuration),
      'Data Processed': this.formatBytes(this.metrics.totalDataProcessed)
    });
    
    // Display operations
    if (this.operations.size > 0) {
      this.ui.displayHeader('Active Operations', 2);
      this.displaySummary();
    }
    
    // Set up refresh
    return setInterval(() => {
      this.refreshDashboard();
    }, 1000);
  }

  /**
   * Refresh dashboard
   */
  refreshDashboard() {
    // Move to top
    this.ui.moveCursor(0, 0);
    
    // Redraw dashboard
    this.createDashboard();
  }

  /**
   * Format bytes
   */
  formatBytes(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`;
  }

  /**
   * Clean up
   */
  cleanup() {
    // Clear intervals
    if (this.progressInterval) clearInterval(this.progressInterval);
    if (this.statusInterval) clearInterval(this.statusInterval);
    if (this.estimateInterval) clearInterval(this.estimateInterval);
    
    // Complete all operations
    this.operations.forEach(op => {
      if (op.status === 'running') {
        this.completeOperation(op.id);
      }
    });
    
    // Clear streams
    this.streams.clear();
    this.buffers.clear();
    this.estimates.clear();
  }
}

module.exports = InteractiveRealtime;