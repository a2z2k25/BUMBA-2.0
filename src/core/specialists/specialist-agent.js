/**
 * Specialist Agent Compatibility Layer
 * 
 * This file provides backward compatibility for specialists that were
 * importing the non-existent 'specialist-agent' module.
 * 
 * All specialists should use UnifiedSpecialistBase, but this shim
 * prevents breaking changes during migration.
 * 
 * @deprecated Use UnifiedSpecialistBase directly instead
 */

const UnifiedSpecialistBase = require('./unified-specialist-base');
const { logger } = require('../logging/bumba-logger');

// Log deprecation warning once
let warningShown = false;

/**
 * SpecialistAgent - Alias for UnifiedSpecialistBase
 * Maintains backward compatibility
 */
class SpecialistAgent extends UnifiedSpecialistBase {
  constructor(config = {}) {
    super(config);
    
    // Show deprecation warning only once
    if (!warningShown && process.env.NODE_ENV !== 'production') {
      warningShown = true;
      logger.debug('⚠️  SpecialistAgent is deprecated. Use UnifiedSpecialistBase directly.');
    }
  }
}

// Export both the class and as a named export for compatibility
module.exports = SpecialistAgent;
module.exports.SpecialistAgent = SpecialistAgent;

// Also export UnifiedSpecialistBase for gradual migration
module.exports.UnifiedSpecialistBase = UnifiedSpecialistBase;