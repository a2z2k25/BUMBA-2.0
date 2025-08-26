/**
 * BUMBA Command System - Consolidated Exports
 * Single source of truth for command system components
 * 
 * This file ensures all parts of the system use the correct implementations
 */

// Active implementations (use these)
const SpecialistFactory = require('./specialist-factory-sprint3');
const CommandExecutionBridge = require('./command-execution-bridge-v2');
const CommandCatalog = require('./command-catalog');
const CommandSchemas = require('./command-schemas');
const CommandValidator = require('./enhanced-command-validator');

// Core command utilities
const CommandAuditLogger = require('./command-audit-logger');
const CommandPermissionSystem = require('./command-permission-system');
const CommandRateLimiter = require('./command-rate-limiter');

// Specialized commands
const GuardianCommands = require('./guardian-commands');
const NotionDashboardCommand = require('./notion-dashboard-command');
const NotionSyncCommand = require('./notion-sync-command');

// Export consolidated interface
module.exports = {
  // Core components
  SpecialistFactory,
  CommandExecutionBridge,
  CommandCatalog,
  CommandSchemas,
  CommandValidator,
  
  // Utilities
  CommandAuditLogger,
  CommandPermissionSystem,
  CommandRateLimiter,
  
  // Specialized
  GuardianCommands,
  NotionDashboardCommand,
  NotionSyncCommand,
  
  // Convenience factory methods
  createCommandBridge: (config) => new CommandExecutionBridge(config),
  createSpecialistFactory: (config) => new SpecialistFactory(config),
  
  // Version info
  version: '2.0',
  deprecated: [
    'specialist-factory.js',
    'specialist-factory-sprint2.js', 
    'command-execution-bridge.js'
  ]
};