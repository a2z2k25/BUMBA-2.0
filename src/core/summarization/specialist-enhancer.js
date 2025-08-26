/**
 * Specialist Enhancer - Adds summarization to specialists
 * Phase 1 - Sprint 16-18
 * Non-invasive helper to add context preservation to any specialist
 */

const { SummarizerFactory } = require('./base-summarizer');
const { getInstance: getContextMetrics } = require('../metrics/context-metrics');
const { getInstance: getStorage } = require('../metrics/context-storage');
const { logger } = require('../logging/bumba-logger');

/**
 * Add summarization capability to a specialist
 * @param {Object} specialist - The specialist instance to enhance
 * @param {Object} config - Configuration options
 */
function addSummarization(specialist, config = {}) {
  // Default configuration
  const enhancementConfig = {
    enabled: config.enabled !== false,
    targetReduction: config.targetReduction || 0.8, // 80% reduction target
    maxOutputTokens: config.maxOutputTokens || 500,
    preserveCritical: config.preserveCritical !== false,
    logReductions: config.logReductions || false,
    ...config
  };
  
  // Store original methods
  const originalPerformTask = specialist.performTask?.bind(specialist);
  const originalExecuteTask = specialist.executeTask?.bind(specialist);
  const originalProcessTask = specialist.processTask?.bind(specialist);
  
  // Add summarization capability
  specialist.summarizationConfig = enhancementConfig;
  
  /**
   * Summarize output if needed
   */
  specialist.summarizeIfNeeded = function(output) {
    if (!enhancementConfig.enabled) return output;
    
    // Estimate current size
    const outputTokens = this.estimateTokens(output);
    
    // Check if summarization needed
    if (outputTokens <= enhancementConfig.maxOutputTokens) {
      return output; // Already within budget
    }
    
    // Apply summarization
    const summarized = SummarizerFactory.summarize(output, {
      maxTokens: enhancementConfig.maxOutputTokens,
      preserveKeys: ['error', 'errors', 'critical', 'results', 'summary'],
      priorityKeywords: ['error', 'fail', 'critical', 'security', 'bug']
    });
    
    // Log reduction achieved
    if (enhancementConfig.logReductions) {
      const summarizedTokens = this.estimateTokens(summarized);
      const reduction = 1 - (summarizedTokens / outputTokens);
      logger.info(`📉 ${this.name}: ${Math.round(reduction * 100)}% context reduction achieved`);
    }
    
    return summarized;
  };
  
  // Wrap performTask if it exists
  if (originalPerformTask) {
    specialist.performTask = async function(task, context) {
      const result = await originalPerformTask.call(this, task, context);
      
      // Track metrics
      if (this.contextMetrics?.enabled) {
        this.trackContextMetrics(task, result);
      }
      
      // Apply summarization if configured
      if (enhancementConfig.enabled && result) {
        const summarized = this.summarizeIfNeeded(result);
        
        // Store metrics if reduction achieved
        if (summarized !== result) {
          const metrics = getContextMetrics();
          metrics.trackExecution(this.id, task, summarized);
          
          // Store to database
          const storage = getStorage();
          storage.storeExecution({
            specialistId: this.id,
            specialistName: this.name,
            inputTokens: this.estimateTokens(task),
            outputTokens: this.estimateTokens(summarized),
            reduction: 1 - (this.estimateTokens(summarized) / this.estimateTokens(result)),
            executionTime: Date.now()
          }).catch(err => logger.error('Failed to store metrics:', err));
        }
        
        return summarized;
      }
      
      return result;
    };
  }
  
  // Wrap executeTask if it exists
  if (originalExecuteTask) {
    specialist.executeTask = async function(task, context) {
      const result = await originalExecuteTask.call(this, task, context);
      
      if (enhancementConfig.enabled && result) {
        return this.summarizeIfNeeded(result);
      }
      
      return result;
    };
  }
  
  // Wrap processTask if it exists (many specialists use this)
  if (originalProcessTask) {
    specialist.processTask = async function(task, context) {
      const result = await originalProcessTask.call(this, task, context);
      
      // Track metrics
      if (this.contextMetrics?.enabled) {
        this.trackContextMetrics(task, result);
      }
      
      // Apply summarization if configured
      if (enhancementConfig.enabled && result) {
        const summarized = this.summarizeIfNeeded(result);
        
        // Store metrics if reduction achieved
        if (summarized !== result) {
          const metrics = getContextMetrics();
          metrics.trackExecution(this.id, task, summarized);
          
          // Store to database
          const storage = getStorage();
          storage.storeExecution({
            specialistId: this.id || this.type,
            specialistName: this.displayName || this.name,
            inputTokens: this.estimateTokens(task),
            outputTokens: this.estimateTokens(summarized),
            reduction: 1 - (this.estimateTokens(summarized) / this.estimateTokens(result)),
            executionTime: Date.now()
          }).catch(err => logger.error('Failed to store metrics:', err));
        }
        
        return summarized;
      }
      
      return result;
    };
  }
  
  // Add configuration getter
  specialist.getSummarizationConfig = function() {
    return enhancementConfig;
  };
  
  // Add method to update configuration
  specialist.updateSummarizationConfig = function(newConfig) {
    Object.assign(enhancementConfig, newConfig);
  };
  
  logger.debug(`✨ Added summarization to ${specialist.name || specialist.id}`);
  
  return specialist;
}

/**
 * Enhance multiple specialists at once
 */
function enhanceSpecialists(specialists, config = {}) {
  const enhanced = [];
  
  for (const specialist of specialists) {
    try {
      addSummarization(specialist, config);
      enhanced.push(specialist);
    } catch (error) {
      logger.error(`Failed to enhance specialist ${specialist.id}:`, error);
    }
  }
  
  logger.info(`✨ Enhanced ${enhanced.length} specialists with summarization`);
  return enhanced;
}

/**
 * Test summarization with a specialist
 */
async function testSummarization(specialist, sampleInput) {
  // Create large verbose output
  const verboseOutput = {
    results: Array(100).fill(null).map((_, i) => ({
      id: i,
      status: i < 5 ? 'critical' : i < 20 ? 'warning' : 'ok',
      message: `Test result ${i} with detailed information that takes up space`,
      details: {
        timestamp: new Date().toISOString(),
        metadata: { index: i, category: 'test' }
      }
    })),
    summary: 'Test completed with multiple results',
    errors: ['Critical error 1', 'Critical error 2'],
    statistics: {
      total: 100,
      critical: 5,
      warnings: 15,
      passed: 80
    }
  };
  
  // Test without summarization
  const originalTokens = specialist.estimateTokens(verboseOutput);
  
  // Test with summarization
  const summarized = specialist.summarizeIfNeeded(verboseOutput);
  const summarizedTokens = specialist.estimateTokens(summarized);
  
  const reduction = 1 - (summarizedTokens / originalTokens);
  
  return {
    originalTokens,
    summarizedTokens,
    reduction: Math.round(reduction * 100),
    meetsTarget: reduction >= (specialist.summarizationConfig?.targetReduction || 0.8),
    sample: summarized
  };
}

module.exports = {
  addSummarization,
  enhanceSpecialists,
  testSummarization
};