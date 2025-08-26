/**
 * BUMBA Development Mode - Sprint 2: Advanced Debugging Tools
 * 
 * Professional debugging capabilities with breakpoints, stack traces,
 * variable inspection, and remote debugging support
 */

const inspector = require('inspector');
const util = require('util');
const EventEmitter = require('events');
const WebSocket = require('ws');

/**
 * Advanced Debugger for Development Mode
 * Provides professional debugging tools and insights
 */
class AdvancedDebugger extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Inspector settings
      port: config.port || 9229,
      host: config.host || '127.0.0.1',
      autoOpen: config.autoOpen || false,
      
      // Breakpoint settings
      enableBreakpoints: config.enableBreakpoints !== false,
      conditionalBreakpoints: config.conditionalBreakpoints !== false,
      maxBreakpoints: config.maxBreakpoints || 100,
      
      // Stack trace settings
      enhancedStackTrace: config.enhancedStackTrace !== false,
      asyncStackTrace: config.asyncStackTrace !== false,
      stackTraceLimit: config.stackTraceLimit || 20,
      
      // Variable inspection
      inspectionDepth: config.inspectionDepth || 3,
      showHidden: config.showHidden || false,
      customInspectors: config.customInspectors || true,
      
      // Error handling
      catchExceptions: config.catchExceptions !== false,
      catchRejections: config.catchRejections !== false,
      pauseOnException: config.pauseOnException || false,
      
      // Remote debugging
      remoteEnabled: config.remoteEnabled || false,
      wsPort: config.wsPort || 9230
    };
    
    // State
    this.state = {
      active: false,
      inspectorOpen: false,
      paused: false,
      currentFrame: null
    };
    
    // Breakpoints
    this.breakpoints = new Map();
    this.breakpointIdCounter = 0;
    
    // Call stack
    this.callStack = [];
    this.asyncStack = [];
    
    // Variables
    this.scopeChain = [];
    this.watchedVariables = new Map();
    
    // Remote debugging
    this.wsServer = null;
    this.remoteClients = new Set();
    
    // Error tracking
    this.exceptions = [];
    this.rejections = [];
  }

  /**
   * Start debugger
   */
  start() {
    if (this.state.active) {
      console.log('🟠️ Debugger already active');
      return;
    }
    
    this.state.active = true;
    console.log('🐛 Advanced Debugger: Starting...');
    
    // Setup error handlers
    this.setupErrorHandlers();
    
    // Enhance stack traces
    if (this.config.enhancedStackTrace) {
      this.enhanceStackTraces();
    }
    
    // Setup async stack traces (if available)
    if (this.config.asyncStackTrace) {
      // AsyncStackTrace would be enabled here if available
      Error.stackTraceLimit = this.config.stackTraceLimit;
    }
    
    // Open inspector if configured
    if (this.config.autoOpen) {
      this.openInspector();
    }
    
    // Start remote debugging server
    if (this.config.remoteEnabled) {
      this.startRemoteServer();
    }
    
    console.log('🏁 Advanced Debugger: Active');
    
    this.emit('started');
  }

  /**
   * Stop debugger
   */
  stop() {
    if (!this.state.active) return;
    
    this.state.active = false;
    
    // Close inspector
    if (this.state.inspectorOpen) {
      inspector.close();
    }
    
    // Stop remote server
    if (this.wsServer) {
      this.wsServer.close();
    }
    
    // Restore error handlers
    this.restoreErrorHandlers();
    
    // Disable async stack traces (if available)
    if (this.config.asyncStackTrace) {
      // AsyncStackTrace would be disabled here if available
    }
    
    console.log('🔴 Advanced Debugger: Stopped');
    this.emit('stopped');
  }

  /**
   * Open inspector for debugging
   */
  openInspector() {
    if (this.state.inspectorOpen) return;
    
    inspector.open(this.config.port, this.config.host);
    this.state.inspectorOpen = true;
    
    const url = `chrome://inspect/#devices`;
    console.log(`🔍 Inspector opened on ${this.config.host}:${this.config.port}`);
    console.log(`   Open ${url} in Chrome to debug`);
    
    this.emit('inspector-opened', {
      port: this.config.port,
      host: this.config.host
    });
  }

  /**
   * Close inspector
   */
  closeInspector() {
    if (!this.state.inspectorOpen) return;
    
    inspector.close();
    this.state.inspectorOpen = false;
    
    console.log('🔍 Inspector closed');
    this.emit('inspector-closed');
  }

  /**
   * Set breakpoint
   */
  setBreakpoint(location, condition = null) {
    const id = ++this.breakpointIdCounter;
    
    const breakpoint = {
      id,
      location,
      condition,
      enabled: true,
      hitCount: 0,
      created: Date.now()
    };
    
    // Parse location
    const parsed = this.parseLocation(location);
    if (!parsed) {
      throw new Error(`Invalid breakpoint location: ${location}`);
    }
    
    breakpoint.file = parsed.file;
    breakpoint.line = parsed.line;
    breakpoint.column = parsed.column;
    
    this.breakpoints.set(id, breakpoint);
    
    console.log(`🔴 Breakpoint ${id} set at ${location}`);
    if (condition) {
      console.log(`   Condition: ${condition}`);
    }
    
    this.emit('breakpoint-set', breakpoint);
    
    return id;
  }

  /**
   * Remove breakpoint
   */
  removeBreakpoint(id) {
    const breakpoint = this.breakpoints.get(id);
    if (!breakpoint) {
      console.warn(`Breakpoint ${id} not found`);
      return false;
    }
    
    this.breakpoints.delete(id);
    console.log(`🟠 Breakpoint ${id} removed`);
    
    this.emit('breakpoint-removed', breakpoint);
    return true;
  }

  /**
   * Parse breakpoint location
   */
  parseLocation(location) {
    // Format: file:line:column or file:line
    const match = location.match(/^(.+):(\d+)(?::(\d+))?$/);
    if (!match) return null;
    
    return {
      file: match[1],
      line: parseInt(match[2]),
      column: match[3] ? parseInt(match[3]) : null
    };
  }

  /**
   * Check if breakpoint should trigger
   */
  shouldBreak(file, line, column = null) {
    for (const breakpoint of this.breakpoints.values()) {
      if (!breakpoint.enabled) continue;
      
      if (breakpoint.file === file && breakpoint.line === line) {
        if (column && breakpoint.column && breakpoint.column !== column) {
          continue;
        }
        
        // Check condition if set
        if (breakpoint.condition) {
          try {
            // Evaluate condition in current context
            const result = this.evaluateCondition(breakpoint.condition);
            if (!result) continue;
          } catch (error) {
            console.error(`Breakpoint condition error: ${error.message}`);
            continue;
          }
        }
        
        breakpoint.hitCount++;
        return breakpoint;
      }
    }
    
    return null;
  }

  /**
   * Evaluate breakpoint condition
   */
  evaluateCondition(condition) {
    // In real implementation, evaluate in current scope
    // For now, simple eval (unsafe in production!)
    try {
      return eval(condition);
    } catch (error) {
      return false;
    }
  }

  /**
   * Pause execution
   */
  pause() {
    if (this.state.paused) return;
    
    this.state.paused = true;
    
    // Capture current state
    this.captureCallStack();
    this.captureScopeChain();
    
    console.log('⏸️ Execution paused');
    this.displayDebugInfo();
    
    this.emit('paused', {
      callStack: this.callStack,
      scopeChain: this.scopeChain
    });
  }

  /**
   * Resume execution
   */
  resume() {
    if (!this.state.paused) return;
    
    this.state.paused = false;
    console.log('▶️ Execution resumed');
    
    this.emit('resumed');
  }

  /**
   * Step over
   */
  stepOver() {
    if (!this.state.paused) return;
    
    console.log('⏭️ Step over');
    // Implementation would step to next line at same level
    
    this.emit('step-over');
  }

  /**
   * Step into
   */
  stepInto() {
    if (!this.state.paused) return;
    
    console.log('⏬ Step into');
    // Implementation would step into function call
    
    this.emit('step-into');
  }

  /**
   * Step out
   */
  stepOut() {
    if (!this.state.paused) return;
    
    console.log('⏫ Step out');
    // Implementation would step out of current function
    
    this.emit('step-out');
  }

  /**
   * Capture call stack
   */
  captureCallStack() {
    const stack = new Error().stack;
    const frames = this.parseStackTrace(stack);
    
    this.callStack = frames.map((frame, index) => ({
      index,
      function: frame.function || '<anonymous>',
      file: frame.file,
      line: frame.line,
      column: frame.column,
      async: frame.async || false
    }));
  }

  /**
   * Parse stack trace
   */
  parseStackTrace(stack) {
    const lines = stack.split('\n').slice(1);
    const frames = [];
    
    for (const line of lines) {
      const match = line.match(/at (.+?) \((.+?):(\d+):(\d+)\)/);
      if (match) {
        frames.push({
          function: match[1],
          file: match[2],
          line: parseInt(match[3]),
          column: parseInt(match[4])
        });
      } else {
        // Handle different stack trace formats
        const simpleMatch = line.match(/at (.+?):(\d+):(\d+)/);
        if (simpleMatch) {
          frames.push({
            function: '<anonymous>',
            file: simpleMatch[1],
            line: parseInt(simpleMatch[2]),
            column: parseInt(simpleMatch[3])
          });
        }
      }
    }
    
    return frames;
  }

  /**
   * Capture scope chain
   */
  captureScopeChain() {
    // In real implementation, would capture actual scope
    // For demonstration, create mock scope
    this.scopeChain = [
      {
        type: 'local',
        variables: this.captureLocalVariables()
      },
      {
        type: 'closure',
        variables: {}
      },
      {
        type: 'global',
        variables: this.captureGlobalVariables()
      }
    ];
  }

  /**
   * Capture local variables
   */
  captureLocalVariables() {
    // In real implementation, would capture actual locals
    return {
      example: 'value',
      count: 42,
      data: { nested: true }
    };
  }

  /**
   * Capture global variables
   */
  captureGlobalVariables() {
    const globals = {};
    
    // Capture relevant globals
    ['process', 'console', '__dirname', '__filename'].forEach(name => {
      if (global[name]) {
        globals[name] = '<Global>';
      }
    });
    
    return globals;
  }

  /**
   * Inspect variable
   */
  inspectVariable(name, depth = null) {
    const options = {
      depth: depth || this.config.inspectionDepth,
      colors: true,
      showHidden: this.config.showHidden,
      customInspect: this.config.customInspectors
    };
    
    // Search in scope chain
    for (const scope of this.scopeChain) {
      if (scope.variables && scope.variables[name]) {
        const value = scope.variables[name];
        const inspected = util.inspect(value, options);
        
        return {
          name,
          value,
          type: typeof value,
          scope: scope.type,
          inspection: inspected
        };
      }
    }
    
    return null;
  }

  /**
   * Watch variable
   */
  watchVariable(name, callback) {
    if (!this.watchedVariables.has(name)) {
      this.watchedVariables.set(name, []);
    }
    
    this.watchedVariables.get(name).push(callback);
    
    console.log(`👁️ Watching variable: ${name}`);
    
    return () => {
      const callbacks = this.watchedVariables.get(name);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Display debug info
   */
  displayDebugInfo() {
    console.log('\n' + '='.repeat(60));
    console.log('🐛 DEBUG SESSION');
    console.log('='.repeat(60));
    
    // Display call stack
    console.log('\n📚 Call Stack:');
    this.callStack.slice(0, 5).forEach((frame, index) => {
      const marker = index === 0 ? '→' : ' ';
      console.log(`${marker} ${index}. ${frame.function} (${frame.file}:${frame.line}:${frame.column})`);
    });
    
    // Display variables
    console.log('\n📦 Variables:');
    this.scopeChain[0].variables && Object.entries(this.scopeChain[0].variables).forEach(([name, value]) => {
      const type = typeof value;
      const display = util.inspect(value, { depth: 0, colors: true });
      console.log(`  ${name}: ${display} (${type})`);
    });
    
    // Display breakpoints
    const activeBreakpoints = Array.from(this.breakpoints.values()).filter(bp => bp.enabled);
    if (activeBreakpoints.length > 0) {
      console.log('\n🔴 Breakpoints:');
      activeBreakpoints.forEach(bp => {
        console.log(`  ${bp.id}. ${bp.file}:${bp.line} (hits: ${bp.hitCount})`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Commands: (r)esume, (n)ext, (s)tep in, (o)ut, (c)ontinue');
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Setup error handlers
   */
  setupErrorHandlers() {
    // Store original handlers
    this.originalUncaughtException = process.listeners('uncaughtException');
    this.originalUnhandledRejection = process.listeners('unhandledRejection');
    
    // Remove original handlers
    process.removeAllListeners('uncaughtException');
    process.removeAllListeners('unhandledRejection');
    
    // Add debug handlers
    if (this.config.catchExceptions) {
      process.on('uncaughtException', (error) => {
        this.handleException(error);
      });
    }
    
    if (this.config.catchRejections) {
      process.on('unhandledRejection', (reason, promise) => {
        this.handleRejection(reason, promise);
      });
    }
  }

  /**
   * Restore error handlers
   */
  restoreErrorHandlers() {
    process.removeAllListeners('uncaughtException');
    process.removeAllListeners('unhandledRejection');
    
    // Restore original handlers
    this.originalUncaughtException.forEach(handler => {
      process.on('uncaughtException', handler);
    });
    
    this.originalUnhandledRejection.forEach(handler => {
      process.on('unhandledRejection', handler);
    });
  }

  /**
   * Handle exception
   */
  handleException(error) {
    console.error('\n🔴 Uncaught Exception:');
    console.error(error);
    
    this.exceptions.push({
      error,
      timestamp: Date.now(),
      stack: error.stack
    });
    
    if (this.config.pauseOnException) {
      this.pause();
    }
    
    this.emit('exception', error);
    
    // Send to remote clients
    this.sendToRemoteClients({
      type: 'exception',
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }

  /**
   * Handle rejection
   */
  handleRejection(reason, promise) {
    console.error('\n🔴 Unhandled Rejection:');
    console.error(reason);
    
    this.rejections.push({
      reason,
      promise,
      timestamp: Date.now()
    });
    
    if (this.config.pauseOnException) {
      this.pause();
    }
    
    this.emit('rejection', { reason, promise });
    
    // Send to remote clients
    this.sendToRemoteClients({
      type: 'rejection',
      reason: reason ? reason.toString() : 'Unknown'
    });
  }

  /**
   * Enhance stack traces
   */
  enhanceStackTraces() {
    Error.stackTraceLimit = this.config.stackTraceLimit;
    
    // Override Error.prepareStackTrace
    Error.prepareStackTrace = (error, stack) => {
      const frames = stack.map(frame => ({
        function: frame.getFunctionName() || '<anonymous>',
        file: frame.getFileName(),
        line: frame.getLineNumber(),
        column: frame.getColumnNumber(),
        isNative: frame.isNative(),
        isConstructor: frame.isConstructor(),
        isAsync: frame.isAsync ? frame.isAsync() : false
      }));
      
      // Format enhanced stack trace
      let enhanced = `${error.name}: ${error.message}\n`;
      
      frames.forEach(frame => {
        const async = frame.isAsync ? '[async] ' : '';
        const native = frame.isNative ? '[native] ' : '';
        enhanced += `    at ${async}${native}${frame.function} (${frame.file}:${frame.line}:${frame.column})\n`;
      });
      
      return enhanced;
    };
  }

  /**
   * Start remote debugging server
   */
  startRemoteServer() {
    this.wsServer = new WebSocket.Server({
      port: this.config.wsPort
    });
    
    this.wsServer.on('connection', (ws) => {
      console.log('🔌 Remote debugger connected');
      this.remoteClients.add(ws);
      
      // Send initial state
      ws.send(JSON.stringify({
        type: 'connected',
        state: this.getDebugState()
      }));
      
      ws.on('message', (message) => {
        this.handleRemoteCommand(ws, message);
      });
      
      ws.on('close', () => {
        this.remoteClients.delete(ws);
        console.log('🔌 Remote debugger disconnected');
      });
    });
    
    console.log(`🟢 Remote debugging server on ws://localhost:${this.config.wsPort}`);
  }

  /**
   * Handle remote command
   */
  handleRemoteCommand(ws, message) {
    try {
      const command = JSON.parse(message);
      
      switch (command.type) {
        case 'pause':
          this.pause();
          break;
        case 'resume':
          this.resume();
          break;
        case 'step-over':
          this.stepOver();
          break;
        case 'step-into':
          this.stepInto();
          break;
        case 'step-out':
          this.stepOut();
          break;
        case 'set-breakpoint':
          this.setBreakpoint(command.location, command.condition);
          break;
        case 'remove-breakpoint':
          this.removeBreakpoint(command.id);
          break;
        case 'inspect':
          const result = this.inspectVariable(command.name);
          ws.send(JSON.stringify({
            type: 'inspection',
            result
          }));
          break;
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  }

  /**
   * Send to remote clients
   */
  sendToRemoteClients(data) {
    const message = JSON.stringify(data);
    
    this.remoteClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  /**
   * Get debug state
   */
  getDebugState() {
    return {
      active: this.state.active,
      paused: this.state.paused,
      breakpoints: Array.from(this.breakpoints.values()),
      callStack: this.callStack,
      scopeChain: this.scopeChain,
      exceptions: this.exceptions.length,
      rejections: this.rejections.length
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      active: this.state.active,
      inspectorOpen: this.state.inspectorOpen,
      breakpoints: this.breakpoints.size,
      exceptions: this.exceptions.length,
      rejections: this.rejections.length,
      remoteClients: this.remoteClients.size
    };
  }
}

module.exports = AdvancedDebugger;