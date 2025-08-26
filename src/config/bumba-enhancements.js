/**
 * BUMBA Enhancement Configuration
 * Optional features inspired by Claude-Flow that can be enabled/disabled
 * These DO NOT alter core BUMBA functionality
 */

module.exports = {
  // Memory System - Learn from past validations
  memory: {
    enabled: false, // Disabled by default - opt-in only
    dbPath: '.bumba/memory.db',
    consultBeforeValidation: true,
    recordValidations: true,
    learnPatterns: true,
    ttlDays: 30
  },
  
  // Consensus Validation - Multiple managers vote (FUTURE)
  consensus: {
    enabled: false,
    minManagers: 3,
    requiredAgreement: 0.75,
    byzantineTolerance: 0.33
  },
  
  // Work Stealing - Redistribute tasks (FUTURE)
  workStealing: {
    enabled: false,
    checkInterval: 5000,
    maxWorkloadDifference: 2
  },
  
  // Hive Mind Mode - Queen-led coordination (FUTURE)
  hiveMind: {
    enabled: false,
    queenRole: 'Product-Strategist',
    hierarchicalDecomposition: true
  },
  
  // Feature flags for gradual rollout
  features: {
    useMemoryHints: false,        // Use memory for hints
    useMemoryLearning: false,     // Learn from patterns
    useConsensusValidation: false, // Multi-manager validation
    useWorkStealing: false,        // Dynamic task redistribution
    useHiveMindMode: false        // Queen-worker pattern
  },
  
  // Get enhancement status
  getStatus() {
    return {
      memory: this.memory.enabled ? 'enabled' : 'disabled',
      consensus: this.consensus.enabled ? 'planned' : 'not implemented',
      workStealing: this.workStealing.enabled ? 'planned' : 'not implemented',
      hiveMind: this.hiveMind.enabled ? 'planned' : 'not implemented'
    };
  },
  
  // Enable memory enhancement
  enableMemory() {
    this.memory.enabled = true;
    this.features.useMemoryHints = true;
    this.features.useMemoryLearning = true;
    console.log('💾 Memory enhancement enabled');
  },
  
  // Disable memory enhancement
  disableMemory() {
    this.memory.enabled = false;
    this.features.useMemoryHints = false;
    this.features.useMemoryLearning = false;
    console.log('💾 Memory enhancement disabled');
  }
};