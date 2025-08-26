/**
 * BUMBA Status Line Connector
 * Robust connection management between status line and framework components
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class StatusLineConnector extends EventEmitter {
  constructor() {
    super();
    
    this.connections = new Map();
    this.statusLine = null;
    this.framework = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectDelay = 1000;
    
    // Event buffer for events before connection
    this.eventBuffer = [];
    this.maxBufferSize = 100;
  }

  /**
   * Connect status line to framework with robust error handling
   */
  async connect(statusLine, framework) {
    if (this.isConnected) {
      logger.warn('Status line already connected');
      return true;
    }
    
    try {
      this.statusLine = statusLine;
      this.framework = framework;
      
      // Validate components
      if (!this.validateComponents()) {
        throw new Error('Invalid status line or framework components');
      }
      
      // Set up bidirectional event binding
      this.setupEventBindings();
      
      // Connect to departments
      await this.connectToDepartments();
      
      // Process buffered events
      this.processEventBuffer();
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      logger.info('🏁 Status line successfully connected to framework');
      this.emit('connected');
      
      return true;
      
    } catch (error) {
      logger.error('Failed to connect status line:', error.message);
      
      // Attempt reconnection
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        return await this.attemptReconnect();
      }
      
      this.emit('connection-failed', error);
      return false;
    }
  }

  /**
   * Validate that components are ready for connection
   */
  validateComponents() {
    if (!this.statusLine) {
      logger.error('Status line is null');
      return false;
    }
    
    if (!this.framework) {
      logger.error('Framework is null');
      return false;
    }
    
    // Check for required methods
    const requiredStatusLineMethods = ['updateTokens', 'getUsageStats'];
    const requiredFrameworkMethods = ['on', 'emit'];
    
    for (const method of requiredStatusLineMethods) {
      if (typeof this.statusLine[method] !== 'function') {
        logger.error(`Status line missing required method: ${method}`);
        return false;
      }
    }
    
    for (const method of requiredFrameworkMethods) {
      if (typeof this.framework[method] !== 'function') {
        logger.error(`Framework missing required method: ${method}`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Set up robust event bindings
   */
  setupEventBindings() {
    // Framework -> Status Line events
    const frameworkEvents = [
      'tokens:used',
      'command-executed',
      'error',
      'activity'
    ];
    
    for (const eventName of frameworkEvents) {
      // Remove existing listeners to prevent duplicates
      this.framework.removeAllListeners(eventName);
      
      // Add new listener with error handling
      this.framework.on(eventName, (...args) => {
        try {
          this.handleFrameworkEvent(eventName, ...args);
        } catch (error) {
          logger.error(`Error handling framework event ${eventName}:`, error);
        }
      });
      
      this.connections.set(`framework:${eventName}`, true);
    }
    
    // Status Line -> Framework events (if needed)
    if (this.statusLine.on) {
      const statusLineEvents = ['update', 'reset'];
      
      for (const eventName of statusLineEvents) {
        this.statusLine.removeAllListeners(eventName);
        
        this.statusLine.on(eventName, (...args) => {
          try {
            this.handleStatusLineEvent(eventName, ...args);
          } catch (error) {
            logger.error(`Error handling status line event ${eventName}:`, error);
          }
        });
        
        this.connections.set(`statusline:${eventName}`, true);
      }
    }
  }

  /**
   * Connect to department managers for token tracking
   */
  async connectToDepartments() {
    if (!this.framework.departments) {
      logger.warn('No departments found in framework');
      return;
    }
    
    let connectedDepartments = 0;
    
    for (const [name, dept] of this.framework.departments) {
      try {
        // Check if department supports events
        if (typeof dept.on === 'function') {
          // Remove existing listeners
          dept.removeAllListeners('tokens:used');
          
          // Add new listener
          dept.on('tokens:used', (count) => {
            if (this.isConnected && this.statusLine) {
              this.statusLine.updateTokens(count);
            } else {
              this.bufferEvent('tokens:used', count);
            }
          });
          
          this.connections.set(`department:${name}`, true);
          connectedDepartments++;
          
          logger.debug(`Connected status line to department: ${name}`);
        }
      } catch (error) {
        logger.warn(`Failed to connect to department ${name}:`, error.message);
      }
    }
    
    if (connectedDepartments > 0) {
      logger.info(`📊 Status line connected to ${connectedDepartments} departments`);
    }
  }

  /**
   * Handle events from framework
   */
  handleFrameworkEvent(eventName, ...args) {
    if (!this.isConnected || !this.statusLine) {
      this.bufferEvent(eventName, ...args);
      return;
    }
    
    switch (eventName) {
      case 'tokens:used':
        const [count] = args;
        this.statusLine.updateTokens(count);
        break;
        
      case 'command-executed':
        const [command] = args;
        if (this.statusLine.onCommandExecuted) {
          this.statusLine.onCommandExecuted(command);
        }
        break;
        
      case 'error':
        if (this.statusLine.onError) {
          this.statusLine.onError(...args);
        }
        break;
        
      case 'activity':
        if (this.statusLine.onActivity) {
          this.statusLine.onActivity();
        }
        break;
    }
  }

  /**
   * Handle events from status line
   */
  handleStatusLineEvent(eventName, ...args) {
    // Forward relevant events to framework
    this.framework.emit(`statusline:${eventName}`, ...args);
  }

  /**
   * Buffer events before connection is established
   */
  bufferEvent(eventName, ...args) {
    if (this.eventBuffer.length >= this.maxBufferSize) {
      this.eventBuffer.shift(); // Remove oldest event
    }
    
    this.eventBuffer.push({
      eventName,
      args,
      timestamp: Date.now()
    });
  }

  /**
   * Process buffered events after connection
   */
  processEventBuffer() {
    if (this.eventBuffer.length === 0) return;
    
    logger.debug(`Processing ${this.eventBuffer.length} buffered events`);
    
    const events = [...this.eventBuffer];
    this.eventBuffer = [];
    
    for (const event of events) {
      // Only process recent events (last 30 seconds)
      if (Date.now() - event.timestamp < 30000) {
        this.handleFrameworkEvent(event.eventName, ...event.args);
      }
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  async attemptReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    logger.info(`Attempting to reconnect status line (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return await this.connect(this.statusLine, this.framework);
  }

  /**
   * Disconnect status line
   */
  disconnect() {
    if (!this.isConnected) return;
    
    // Remove all event listeners
    for (const [key] of this.connections) {
      const [source, eventName] = key.split(':');
      
      if (source === 'framework' && this.framework) {
        this.framework.removeAllListeners(eventName);
      } else if (source === 'statusline' && this.statusLine) {
        this.statusLine.removeAllListeners(eventName);
      } else if (source === 'department' && this.framework?.departments) {
        const dept = this.framework.departments.get(eventName);
        if (dept && dept.removeAllListeners) {
          dept.removeAllListeners('tokens:used');
        }
      }
    }
    
    this.connections.clear();
    this.isConnected = false;
    this.statusLine = null;
    this.framework = null;
    
    logger.info('Status line disconnected');
    this.emit('disconnected');
  }

  /**
   * Check connection health
   */
  isHealthy() {
    if (!this.isConnected) return false;
    
    // Check if components are still valid
    if (!this.validateComponents()) {
      this.isConnected = false;
      return false;
    }
    
    // Check if connections are still active
    const activeConnections = Array.from(this.connections.keys()).filter(key => {
      const [source] = key.split(':');
      if (source === 'framework') return this.framework !== null;
      if (source === 'statusline') return this.statusLine !== null;
      return true;
    });
    
    return activeConnections.length > 0;
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      isHealthy: this.isHealthy(),
      connections: Array.from(this.connections.keys()),
      bufferedEvents: this.eventBuffer.length,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  StatusLineConnector,
  getInstance: () => {
    if (!instance) {
      instance = new StatusLineConnector();
    }
    return instance;
  },
  resetInstance: () => {
    if (instance) {
      instance.disconnect();
    }
    instance = null;
  }
};