#!/usr/bin/env node

/**
 * Add compatibility layer for hook systems
 */

const fs = require('fs');
const path = require('path');

const files = [
  'src/core/agents/agent-lifecycle-state-machine.js',
  'src/core/agents/claude-max-account-manager.js',
  'src/core/api/api-connection-manager.js',
  'src/core/coordination/department-protocols.js',
  'src/core/departments/department-manager.js',
  'src/core/deprecation/agent-deprecation-manager.js',
  'src/core/dynamic-agent-lifecycle-orchestrator.js',
  'src/core/knowledge/knowledge-transfer-protocol.js',
  'src/core/spawning/dynamic-spawning-controller.js'
];

const compatCode = `
    
    // Add compatibility layer for different hook APIs
    if (!this.hooks.executeHooks && this.hooks.trigger) {
      this.hooks.executeHooks = this.hooks.trigger.bind(this.hooks);
    }
    if (!this.hooks.getRegisteredHooks && this.hooks.hookRegistry) {
      this.hooks.getRegisteredHooks = () => {
        const hooks = {};
        this.hooks.hookRegistry.forEach((config, name) => {
          hooks[name] = config;
        });
        return hooks;
      };
    }`;

files.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if already has compatibility layer
    if (content.includes('Add compatibility layer')) {
      console.log(`🏁 ${filePath} already has compatibility layer`);
      return;
    }
    
    // Add after BumbaUniversalHookSystem initialization
    const pattern = /this\.hooks = new BumbaUniversalHookSystem\(\);/g;
    
    if (content.match(pattern)) {
      content = content.replace(pattern, 
        'this.hooks = new BumbaUniversalHookSystem();' + compatCode);
      
      fs.writeFileSync(filePath, content);
      console.log(`🏁 Added compatibility layer to ${filePath}`);
    } else {
      console.log(`🟡  No hook initialization found in ${filePath}`);
    }
  } catch (error) {
    console.error(`🔴 Error processing ${filePath}:`, error.message);
  }
});

console.log('\n🏁 Hook compatibility layer added to all files!');