/**
 * BUMBA Error Handling System - Main Export
 * Exports the unified error management system
 */

const { UnifiedErrorManager, getInstance, handleError, wrap, getMetrics } = require('./unified-error-manager');
const { BumbaError } = require('./bumba-error-system');

// Create singleton instance
const errorManager = getInstance();

// Export unified system
module.exports = {
  // Main class
  UnifiedErrorManager,
  
  // Core error class
  BumbaError,
  
  // Singleton instance
  errorManager,
  getInstance,
  
  // Convenience methods
  handleError,
  wrap,
  getMetrics
};