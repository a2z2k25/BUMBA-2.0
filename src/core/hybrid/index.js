/**
 * BUMBA Hybrid Intelligence Framework
 * Main export for hybrid mode components
 */

const EnvironmentDetector = require('./environment-detector');
const ModeManager = require('./mode-manager');
const ConfigBridge = require('./config-bridge');

// Modes
const BridgeMode = require('./modes/bridge-mode');
const EnhancementMode = require('./modes/enhancement-mode');
const HybridMode = require('./modes/hybrid-mode');

// Bridge components
const ContextAnalyzer = require('./bridge/context-analyzer');
const TaskPreparer = require('./bridge/task-preparer');
const HandoffGenerator = require('./bridge/handoff-generator');

/**
 * Initialize BUMBA Hybrid Framework
 * @param {Object} options Initialization options
 * @returns {Promise<Object>} Initialized framework
 */
async function initialize(options = {}) {
  // Load configuration
  const configBridge = new ConfigBridge();
  const config = await configBridge.load();
  
  // Create mode manager
  const modeManager = new ModeManager({
    config,
    ...options
  });
  
  // Display initialization message
  const env = EnvironmentDetector.detect();
  console.log('🏁 BUMBA CLI 1.0 Hybrid Intelligence Framework');
  console.log('━'.repeat(60));
  console.log();
  console.log(`Mode: ${env.mode.toUpperCase()}`);
  console.log(`Capabilities: ${Object.keys(env.capabilities).filter(k => env.capabilities[k]).join(', ')}`);
  console.log();
  
  return {
    modeManager,
    configBridge,
    environment: env,
    version: '3.0.0'
  };
}

/**
 * Quick start function for CLI
 * @returns {Promise<ModeManager>} Mode manager instance
 */
async function quickStart() {
  const configBridge = new ConfigBridge();
  await configBridge.load().catch(() => {
    // Use defaults if config doesn't exist
  });
  
  return new ModeManager();
}

module.exports = {
  // Main initialization
  initialize,
  quickStart,
  
  // Core classes
  EnvironmentDetector,
  ModeManager,
  ConfigBridge,
  
  // Modes
  BridgeMode,
  EnhancementMode,
  HybridMode,
  
  // Bridge components
  ContextAnalyzer,
  TaskPreparer,
  HandoffGenerator,
  
  // Version
  version: '3.0.0'
};