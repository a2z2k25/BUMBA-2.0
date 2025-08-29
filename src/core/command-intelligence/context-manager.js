/**
 * BUMBA Context Manager
 * Manages context passing between chained commands
 */

const { logger } = require('../logging/bumba-logger');

class ContextManager {
  constructor() {
    this.globalContext = {};
    this.commandContexts = new Map();
    this.contextStack = [];
    this.maxStackSize = 50;
  }

  /**
   * Create initial context for chain execution
   */
  createChainContext(baseContext = {}) {
    const chainContext = {
      ...this.globalContext,
      ...baseContext,
      chainId: `chain_${Date.now()}`,
      startTime: new Date().toISOString(),
      environment: this.getEnvironmentContext(),
      accumulator: {
        files: [],
        insights: [],
        recommendations: [],
        errors: [],
        departments: new Set()
      }
    };
    
    // Push to stack
    this.pushContext(chainContext);
    
    return chainContext;
  }

  /**
   * Pass context from one command to next
   */
  passContext(fromCommand, toCommand, result, chainContext) {
    logger.info(`📤 Passing context from ${fromCommand.command} to ${toCommand.command}`);
    
    // Create new context based on previous
    const newContext = {
      ...chainContext,
      previousCommand: {
        command: fromCommand.command,
        args: fromCommand.args,
        result: this.extractRelevantResult(result),
        success: result.success
      }
    };
    
    // Handle different passing strategies
    if (toCommand.pipeFrom !== undefined) {
      // Pipe strategy - output becomes input
      newContext.pipedData = this.extractPipeableData(result);
    }
    
    if (toCommand.transform) {
      // Transform strategy - apply transformation
      newContext.transformedData = this.applyTransform(
        result,
        toCommand.transform
      );
    }
    
    // Update accumulator
    this.updateAccumulator(newContext.accumulator, result);
    
    // Store command-specific context
    this.commandContexts.set(
      `${chainContext.chainId}_${toCommand.index}`,
      newContext
    );
    
    return newContext;
  }

  /**
   * Extract relevant result data
   */
  extractRelevantResult(result) {
    return {
      success: result.success,
      file: result.file,
      fileName: result.fileName,
      department: result.department,
      specialists: result.specialists,
      analysis: result.analysis,
      message: result.message
    };
  }

  /**
   * Extract pipeable data from result
   */
  extractPipeableData(result) {
    // Priority order for pipeable data
    if (result.file) {
      return {
        type: 'file',
        path: result.file,
        content: null // Would be loaded if needed
      };
    }
    
    if (result.result && result.result.data) {
      return {
        type: 'data',
        data: result.result.data
      };
    }
    
    if (result.analysis) {
      return {
        type: 'analysis',
        ...result.analysis
      };
    }
    
    if (result.message) {
      return {
        type: 'text',
        text: result.message
      };
    }
    
    return {
      type: 'raw',
      data: result
    };
  }

  /**
   * Apply transformation to data
   */
  applyTransform(result, transform) {
    logger.info(`🔄 Applying transform: ${transform}`);
    
    switch(transform) {
      case 'extract-requirements':
        return this.extractRequirements(result);
        
      case 'extract-api':
        return this.extractAPI(result);
        
      case 'extract-design':
        return this.extractDesign(result);
        
      case 'summarize':
        return this.summarize(result);
        
      case 'format-json':
        return this.formatAsJSON(result);
        
      default:
        return result;
    }
  }

  /**
   * Extract requirements from result
   */
  extractRequirements(result) {
    const requirements = [];
    
    // Look for requirements in various places
    if (result.result && result.result.requirements) {
      requirements.push(...result.result.requirements);
    }
    
    if (result.analysis && result.analysis.requirements) {
      requirements.push(...result.analysis.requirements);
    }
    
    // Extract from text using patterns
    if (result.message) {
      const reqPattern = /(?:requirement|must|should|shall):\s*([^\n]+)/gi;
      const matches = result.message.matchAll(reqPattern);
      for (const match of matches) {
        requirements.push(match[1]);
      }
    }
    
    return {
      type: 'requirements',
      items: [...new Set(requirements)] // Remove duplicates
    };
  }

  /**
   * Extract API specifications
   */
  extractAPI(result) {
    const apis = {
      endpoints: [],
      methods: [],
      schemas: {}
    };
    
    // Extract from result structure
    if (result.result && result.result.apiSpec) {
      return {
        type: 'api',
        ...result.result.apiSpec
      };
    }
    
    // Pattern matching for API definitions
    if (result.message) {
      const endpointPattern = /(?:GET|POST|PUT|DELETE|PATCH)\s+([\/\w\-{}]+)/gi;
      const matches = result.message.matchAll(endpointPattern);
      
      for (const match of matches) {
        apis.endpoints.push({
          method: match[0].split(' ')[0],
          path: match[1]
        });
      }
    }
    
    return {
      type: 'api',
      ...apis
    };
  }

  /**
   * Extract design elements
   */
  extractDesign(result) {
    const design = {
      components: [],
      styles: {},
      layouts: []
    };
    
    if (result.result && result.result.design) {
      return {
        type: 'design',
        ...result.result.design
      };
    }
    
    // Extract component names
    if (result.message) {
      const componentPattern = /component[:\s]+([A-Z][a-zA-Z]+)/gi;
      const matches = result.message.matchAll(componentPattern);
      
      for (const match of matches) {
        design.components.push(match[1]);
      }
    }
    
    return {
      type: 'design',
      ...design
    };
  }

  /**
   * Summarize result
   */
  summarize(result) {
    const summary = {
      type: 'summary',
      success: result.success,
      keyPoints: []
    };
    
    if (result.department) {
      summary.keyPoints.push(`Processed by ${result.department} department`);
    }
    
    if (result.specialists && result.specialists.length > 0) {
      summary.keyPoints.push(`Analyzed by ${result.specialists.length} specialists`);
    }
    
    if (result.file) {
      summary.keyPoints.push(`Generated file: ${result.fileName || result.file}`);
    }
    
    if (result.analysis) {
      summary.keyPoints.push(`Priority: ${result.analysis.priority || 'normal'}`);
      summary.keyPoints.push(`Complexity: ${result.analysis.complexity || 'medium'}`);
    }
    
    return summary;
  }

  /**
   * Format as JSON
   */
  formatAsJSON(result) {
    return {
      type: 'json',
      data: JSON.stringify(result, null, 2)
    };
  }

  /**
   * Update accumulator with new data
   */
  updateAccumulator(accumulator, result) {
    // Accumulate files
    if (result.file) {
      accumulator.files.push({
        path: result.file,
        name: result.fileName,
        timestamp: new Date().toISOString()
      });
    }
    
    // Accumulate insights
    if (result.result && result.result.insights) {
      accumulator.insights.push(...result.result.insights);
    }
    
    // Accumulate recommendations
    if (result.result && result.result.recommendations) {
      accumulator.recommendations.push(...result.result.recommendations);
    }
    
    // Accumulate errors
    if (!result.success && result.error) {
      accumulator.errors.push({
        error: result.error,
        command: result.command,
        timestamp: new Date().toISOString()
      });
    }
    
    // Track departments
    if (result.department) {
      accumulator.departments.add(result.department);
    }
  }

  /**
   * Get environment context
   */
  getEnvironmentContext() {
    return {
      platform: process.platform,
      nodeVersion: process.version,
      cwd: process.cwd(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Push context to stack
   */
  pushContext(context) {
    this.contextStack.push(context);
    
    // Limit stack size
    if (this.contextStack.length > this.maxStackSize) {
      this.contextStack.shift();
    }
  }

  /**
   * Pop context from stack
   */
  popContext() {
    return this.contextStack.pop();
  }

  /**
   * Get current context
   */
  getCurrentContext() {
    return this.contextStack[this.contextStack.length - 1] || {};
  }

  /**
   * Merge contexts
   */
  mergeContexts(...contexts) {
    const merged = {};
    
    for (const context of contexts) {
      Object.assign(merged, context);
      
      // Special handling for accumulators
      if (context.accumulator) {
        if (!merged.accumulator) {
          merged.accumulator = {
            files: [],
            insights: [],
            recommendations: [],
            errors: [],
            departments: new Set()
          };
        }
        
        merged.accumulator.files.push(...(context.accumulator.files || []));
        merged.accumulator.insights.push(...(context.accumulator.insights || []));
        merged.accumulator.recommendations.push(...(context.accumulator.recommendations || []));
        merged.accumulator.errors.push(...(context.accumulator.errors || []));
        
        if (context.accumulator.departments) {
          context.accumulator.departments.forEach(d => 
            merged.accumulator.departments.add(d)
          );
        }
      }
    }
    
    return merged;
  }

  /**
   * Clear all contexts
   */
  clearAll() {
    this.commandContexts.clear();
    this.contextStack = [];
    logger.info('🧹 Cleared all contexts');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  ContextManager,
  getInstance: () => {
    if (!instance) {
      instance = new ContextManager();
    }
    return instance;
  }
};