/**
 * BUMBA Integrations - Main Export
 * Unified access point for all integrations
 */

const { 
  UnifiedIntegrationManager, 
  getInstance, 
  IntegrationHelpers,
  INTEGRATION_REGISTRY 
} = require('./unified-integration-manager');

// Create and export singleton
const integrationManager = getInstance();

// Export everything needed
module.exports = {
  // Main class
  UnifiedIntegrationManager,
  
  // Singleton instance
  integrationManager,
  getInstance,
  
  // Helper functions for quick access
  ...IntegrationHelpers,
  
  // Registry for reference
  INTEGRATION_REGISTRY,
  
  // Convenience methods
  get: async (key) => integrationManager.get(key),
  execute: async (key, method, ...args) => integrationManager.execute(key, method, ...args),
  configure: async (key, config) => integrationManager.configure(key, config),
  getStatus: (key) => integrationManager.getStatus(key),
  getAllStatuses: () => integrationManager.getAllStatuses(),
  getByCategory: (category) => integrationManager.getByCategory(category),
  reload: async (key) => integrationManager.reload(key),
  
  // Category-specific helpers
  databases: {
    postgres: async () => integrationManager.get('postgres'),
    mongodb: async () => integrationManager.get('mongodb'),
    redis: async () => integrationManager.get('redis'),
    execute: async (db, method, ...args) => integrationManager.execute(db, method, ...args)
  },
  
  ai: {
    openrouter: async () => integrationManager.get('openrouter'),
    pinecone: async () => integrationManager.get('pinecone'),
    serena: async () => integrationManager.get('serena'),
    kimi: async () => integrationManager.get('kimi_k2')
  },
  
  devops: {
    docker: async () => integrationManager.get('docker'),
    kubernetes: async () => integrationManager.get('kubernetes'),
    k8s: async () => integrationManager.get('kubernetes')
  },
  
  productivity: {
    notion: async () => integrationManager.get('notion_master'),
    notionWorkflow: async () => integrationManager.get('notion_workflow'),
    notionDashboard: async () => integrationManager.get('notion_dashboard_builder')
  },
  
  communication: {
    discord: async () => integrationManager.get('discord'),
    discordScheduler: async () => integrationManager.get('discord_scheduler')
  },
  
  development: {
    github: async () => integrationManager.get('github_mcp'),
    figma: async () => integrationManager.get('figma'),
    shadcn: async () => integrationManager.get('shadcn_mcp')
  }
};