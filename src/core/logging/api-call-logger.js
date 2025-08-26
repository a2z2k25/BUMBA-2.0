/**
 * BUMBA API Call Logger
 * Tracks and logs all API calls for validation of parallel execution
 * Provides clear visibility into what's happening under the hood
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class APICallLogger extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Log file configuration
    this.logDir = config.logDir || path.join(process.cwd(), 'bumba-logs');
    this.logFile = path.join(this.logDir, `api-calls-${this.getTimestamp()}.json`);
    this.summaryFile = path.join(this.logDir, 'api-calls-summary.txt');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    // Current session tracking
    this.session = {
      id: this.generateSessionId(),
      startTime: new Date().toISOString(),
      calls: [],
      parallelExecutions: [],
      totalCalls: 0,
      parallelGroups: 0
    };
    
    // Real-time metrics
    this.metrics = {
      totalApiCalls: 0,
      parallelExecutions: 0,
      sequentialExecutions: 0,
      averageParallelSize: 0,
      maxParallelSize: 0,
      modelUsage: {
        claude: 0,
        gpt4: 0,
        gemini: 0
      }
    };
    
    // Initialize log file
    this.initializeLogFile();
  }
  
  /**
   * Initialize the log file with session header
   */
  initializeLogFile() {
    const header = {
      session: this.session.id,
      startTime: this.session.startTime,
      logFile: this.logFile,
      description: 'BUMBA API Call Log - Validates parallel execution'
    };
    
    fs.writeFileSync(this.logFile, JSON.stringify(header, null, 2) + '\n\n');
    
    // Also create/update summary file
    const summaryHeader = `
========================================
BUMBA API CALL TRACKING
Session: ${this.session.id}
Started: ${this.session.startTime}
========================================\n\n`;
    
    fs.writeFileSync(this.summaryFile, summaryHeader);
  }
  
  /**
   * Log the start of a parallel execution group
   */
  logParallelExecutionStart(tasks, metadata = {}) {
    const executionId = this.generateExecutionId();
    const timestamp = new Date().toISOString();
    
    const parallelGroup = {
      type: 'PARALLEL_EXECUTION_START',
      executionId,
      timestamp,
      taskCount: tasks.length,
      tasks: tasks.map(t => ({
        agent: t.agent,
        model: t.model || 'claude',
        preview: t.prompt?.substring(0, 100) + '...'
      })),
      metadata
    };
    
    // Log to file
    this.appendToLogFile(parallelGroup);
    
    // Log to console for real-time visibility
    console.log(`\n🟢 PARALLEL EXECUTION STARTED [${executionId}]`);
    console.log(`   Tasks: ${tasks.length} agents executing in parallel`);
    tasks.forEach(t => {
      console.log(`   - ${t.agent} (${t.model || 'claude'})`);
    });
    
    // Track in session
    this.session.parallelGroups++;
    
    return executionId;
  }
  
  /**
   * Log an individual API call
   */
  logAPICall(callData) {
    const timestamp = new Date().toISOString();
    
    const apiCall = {
      type: 'API_CALL',
      timestamp,
      id: this.generateCallId(),
      agent: callData.agent,
      model: callData.model || 'claude',
      executionId: callData.executionId,
      parallel: callData.parallel || false,
      duration: callData.duration,
      tokens: callData.tokens,
      cost: callData.cost,
      success: callData.success,
      error: callData.error
    };
    
    // Log to file
    this.appendToLogFile(apiCall);
    
    // Update metrics
    this.metrics.totalApiCalls++;
    if (callData.model) {
      this.metrics.modelUsage[callData.model] = 
        (this.metrics.modelUsage[callData.model] || 0) + 1;
    }
    
    // Track in session
    this.session.calls.push(apiCall);
    this.session.totalCalls++;
    
    // Emit event for real-time monitoring
    this.emit('api:call', apiCall);
    
    return apiCall.id;
  }
  
  /**
   * Log the completion of a parallel execution group
   */
  logParallelExecutionComplete(executionId, results, metadata = {}) {
    const timestamp = new Date().toISOString();
    
    const parallelComplete = {
      type: 'PARALLEL_EXECUTION_COMPLETE',
      executionId,
      timestamp,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
      totalDuration: metadata.duration,
      totalCost: metadata.cost,
      results: results.map(r => ({
        agent: r.agent,
        success: r.success,
        duration: r.executionTime,
        tokens: r.tokens
      }))
    };
    
    // Log to file
    this.appendToLogFile(parallelComplete);
    
    // Log to console
    console.log(`\n🏁 PARALLEL EXECUTION COMPLETE [${executionId}]`);
    console.log(`   Success: ${parallelComplete.successCount}/${results.length}`);
    console.log(`   Duration: ${metadata.duration}ms`);
    console.log(`   Cost: $${metadata.cost || 0}`);
    
    // Update metrics
    this.metrics.parallelExecutions++;
    const parallelSize = results.length;
    this.metrics.maxParallelSize = Math.max(this.metrics.maxParallelSize, parallelSize);
    this.metrics.averageParallelSize = 
      (this.metrics.averageParallelSize * (this.metrics.parallelExecutions - 1) + parallelSize) / 
      this.metrics.parallelExecutions;
    
    // Track in session
    this.session.parallelExecutions.push(parallelComplete);
    
    return parallelComplete;
  }
  
  /**
   * Log a sequential (non-parallel) execution
   */
  logSequentialExecution(callData) {
    const timestamp = new Date().toISOString();
    
    const sequentialCall = {
      type: 'SEQUENTIAL_EXECUTION',
      timestamp,
      ...callData,
      parallel: false
    };
    
    // Log to file
    this.appendToLogFile(sequentialCall);
    
    // Log to console
    console.log('\n🟢 SEQUENTIAL EXECUTION');
    console.log(`   Agent: ${callData.agent}`);
    console.log(`   Model: ${callData.model || 'claude'}`);
    
    // Update metrics
    this.metrics.sequentialExecutions++;
    
    return this.logAPICall({ ...callData, parallel: false });
  }
  
  /**
   * Get current session summary
   */
  getSessionSummary() {
    const summary = {
      sessionId: this.session.id,
      startTime: this.session.startTime,
      duration: Date.now() - new Date(this.session.startTime).getTime(),
      totalAPICalls: this.session.totalCalls,
      parallelGroups: this.session.parallelGroups,
      parallelExecutions: this.metrics.parallelExecutions,
      sequentialExecutions: this.metrics.sequentialExecutions,
      averageParallelSize: this.metrics.averageParallelSize.toFixed(1),
      maxParallelSize: this.metrics.maxParallelSize,
      modelUsage: this.metrics.modelUsage,
      logFile: this.logFile,
      summaryFile: this.summaryFile
    };
    
    return summary;
  }
  
  /**
   * Generate a human-readable summary report
   */
  generateSummaryReport() {
    const summary = this.getSessionSummary();
    
    const report = `
=====================================
BUMBA API CALL SUMMARY REPORT
=====================================

Session ID: ${summary.sessionId}
Start Time: ${summary.startTime}
Duration: ${(summary.duration / 1000).toFixed(1)} seconds

API CALLS:
----------
Total API Calls: ${summary.totalAPICalls}
Parallel Groups: ${summary.parallelGroups}
Sequential Calls: ${summary.sequentialExecutions}

PARALLEL EXECUTION:
------------------
Total Parallel Executions: ${summary.parallelExecutions}
Average Parallel Size: ${summary.averageParallelSize} agents
Maximum Parallel Size: ${summary.maxParallelSize} agents

MODEL USAGE:
-----------
Claude: ${summary.modelUsage.claude} calls
GPT-4: ${summary.modelUsage.gpt4 || 0} calls
Gemini: ${summary.modelUsage.gemini || 0} calls

LOG FILES:
----------
Detailed Log: ${summary.logFile}
Summary File: ${summary.summaryFile}

=====================================
`;
    
    // Write to summary file
    fs.appendFileSync(this.summaryFile, report);
    
    // Also return for display
    return report;
  }
  
  /**
   * Append entry to log file
   */
  appendToLogFile(entry) {
    const logEntry = JSON.stringify(entry, null, 2) + ',\n';
    fs.appendFileSync(this.logFile, logEntry);
  }
  
  /**
   * Utility: Generate session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
  
  /**
   * Utility: Generate execution ID
   */
  generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
  
  /**
   * Utility: Generate call ID
   */
  generateCallId() {
    return `call_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
  
  /**
   * Utility: Get timestamp for filename
   */
  getTimestamp() {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
  }
  
  /**
   * Clean shutdown
   */
  shutdown() {
    const report = this.generateSummaryReport();
    console.log(report);
    
    // Close log file properly
    fs.appendFileSync(this.logFile, '\n]\n');
    
    console.log('\n🟢 API Call logs saved to:');
    console.log(`   ${this.logFile}`);
    console.log(`   ${this.summaryFile}`);
    
    this.removeAllListeners();
  }

  // Standard API logging methods for compatibility
  logRequest(req, metadata = {}) {
    const requestData = {
      type: 'request',
      method: req.method || 'GET',
      url: req.url || req.path,
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString(),
      ...metadata
    };
    
    this.logAPICall({
      endpoint: requestData.url,
      method: requestData.method,
      ...requestData
    });
    
    return requestData;
  }

  logResponse(res, requestId, metadata = {}) {
    const responseData = {
      type: 'response',
      requestId: requestId,
      status: res.status || res.statusCode,
      headers: res.headers,
      data: res.data || res.body,
      timestamp: new Date().toISOString(),
      ...metadata
    };
    
    this.logAPICall({
      endpoint: requestId,
      status: responseData.status,
      ...responseData
    });
    
    return responseData;
  }

  logError(error, context = {}) {
    const errorData = {
      type: 'error',
      message: error.message,
      stack: error.stack,
      code: error.code,
      context: context,
      timestamp: new Date().toISOString()
    };
    
    this.logAPICall({
      endpoint: context.endpoint || 'unknown',
      error: true,
      ...errorData
    });
    
    this.emit('error', errorData);
    return errorData;
  }

  // Express/Connect middleware
  middleware() {
    const logger = this;
    
    return function(req, res, next) {
      const requestId = logger.generateCallId();
      const startTime = Date.now();
      
      // Log request
      logger.logRequest(req, { requestId });
      
      // Capture response
      const originalSend = res.send;
      res.send = function(data) {
        const duration = Date.now() - startTime;
        
        // Log response
        logger.logResponse({
          status: res.statusCode,
          data: data
        }, requestId, { duration });
        
        // Call original send
        originalSend.call(this, data);
      };
      
      next();
    };
  }

  // Get stored logs
  getLogs(filter = {}) {
    const logs = [...this.session.calls];
    
    // Apply filters
    if (filter.type) {
      return logs.filter(log => log.type === filter.type);
    }
    
    if (filter.startTime && filter.endTime) {
      return logs.filter(log => {
        const timestamp = new Date(log.timestamp);
        return timestamp >= new Date(filter.startTime) && 
               timestamp <= new Date(filter.endTime);
      });
    }
    
    if (filter.limit) {
      return logs.slice(-filter.limit);
    }
    
    return logs;
  }

  // Clear stored logs
  clearLogs() {
    const previousCount = this.session.calls.length;
    
    this.session.calls = [];
    this.session.totalCalls = 0;
    this.session.parallelExecutions = [];
    this.session.parallelGroups = 0;
    
    // Reset metrics
    this.metrics = {
      totalApiCalls: 0,
      parallelExecutions: 0,
      sequentialExecutions: 0,
      averageParallelSize: 0,
      maxParallelSize: 0,
      modelUsage: {
        claude: 0,
        gpt4: 0,
        gemini: 0
      }
    };
    
    this.emit('logsCleared', { previousCount });
    
    return { cleared: previousCount };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  APICallLogger,
  getInstance: (config) => {
    if (!instance) {
      instance = new APICallLogger(config);
    }
    return instance;
  }
};