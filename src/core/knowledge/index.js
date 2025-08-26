/**
 * BUMBA Knowledge Systems
 * Central export for all knowledge management components
 */

const { KnowledgeBase, getInstance: getKnowledgeBase } = require('./knowledge-base');
const { ContextManager, getInstance: getContextManager } = require('./context-manager');
const { ReferenceSystem, getInstance: getReferenceSystem } = require('./reference-system');
const { KnowledgeTransferSystem, getInstance: getKnowledgeTransfer } = require('./knowledge-transfer-system');

// Singleton instances
let knowledgeBase = null;
let contextManager = null;
let referenceSystem = null;
let knowledgeTransfer = null;

/**
 * Initialize all knowledge systems
 */
async function initializeKnowledgeSystems(config = {}) {
  try {
    // Initialize Knowledge Base
    knowledgeBase = getKnowledgeBase(config.knowledgeBase);
    await knowledgeBase.initialize();
    
    // Initialize Context Manager
    contextManager = getContextManager(config.contextManager);
    await contextManager.initialize();
    
    // Initialize Reference System
    referenceSystem = getReferenceSystem(config.referenceSystem);
    await referenceSystem.initialize();
    
    // Initialize Knowledge Transfer
    knowledgeTransfer = getKnowledgeTransfer(config.knowledgeTransfer);
    await knowledgeTransfer.initialize();
    
    // Wire up integrations
    wireIntegrations();
    
    return {
      knowledgeBase,
      contextManager,
      referenceSystem,
      knowledgeTransfer
    };
    
  } catch (error) {
    console.error('Failed to initialize knowledge systems:', error);
    throw error;
  }
}

/**
 * Wire up integrations between systems
 */
function wireIntegrations() {
  // Context Manager can save to Knowledge Base
  contextManager.on('context:created', async (context) => {
    await knowledgeBase.add({
      title: `Context: ${context.type}`,
      content: JSON.stringify(context),
      category: 'context',
      type: 'context',
      tags: ['context', context.type],
      metadata: { contextId: context.id }
    });
  });
  
  // Reference System can save to Knowledge Base
  referenceSystem.on('reference:created', async (reference) => {
    await knowledgeBase.add({
      title: reference.name,
      content: JSON.stringify(reference),
      category: 'reference',
      type: reference.type,
      tags: reference.metadata?.tags || [],
      metadata: { referenceId: reference.id }
    });
  });
  
  // Knowledge Transfer can use Context Manager
  knowledgeTransfer.on('knowledge:transferred', async (knowledge) => {
    await contextManager.createContext({
      type: 'knowledge-transfer',
      data: knowledge,
      metadata: { knowledgeId: knowledge.id }
    });
  });
}

/**
 * Get all knowledge systems
 */
function getKnowledgeSystems() {
  return {
    knowledgeBase: knowledgeBase || getKnowledgeBase(),
    contextManager: contextManager || getContextManager(),
    referenceSystem: referenceSystem || getReferenceSystem(),
    knowledgeTransfer: knowledgeTransfer || getKnowledgeTransfer()
  };
}

/**
 * Destroy all knowledge systems
 */
function destroyKnowledgeSystems() {
  if (knowledgeBase) {
    knowledgeBase.destroy();
    knowledgeBase = null;
  }
  
  if (contextManager) {
    contextManager.destroy();
    contextManager = null;
  }
  
  if (referenceSystem) {
    referenceSystem.destroy();
    referenceSystem = null;
  }
  
  if (knowledgeTransfer) {
    knowledgeTransfer = null;
  }
}

module.exports = {
  // Classes
  KnowledgeBase,
  ContextManager,
  ReferenceSystem,
  KnowledgeTransferSystem,
  
  // Singleton getters
  getKnowledgeBase,
  getContextManager,
  getReferenceSystem,
  getKnowledgeTransfer,
  
  // System management
  initializeKnowledgeSystems,
  getKnowledgeSystems,
  destroyKnowledgeSystems,
  
  // Direct access to instances
  get knowledgeBase() { return knowledgeBase || getKnowledgeBase(); },
  get contextManager() { return contextManager || getContextManager(); },
  get referenceSystem() { return referenceSystem || getReferenceSystem(); },
  get knowledgeTransfer() { return knowledgeTransfer || getKnowledgeTransfer(); }
};