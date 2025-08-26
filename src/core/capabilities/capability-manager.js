/**
 * BUMBA Capability Manager
 * Honest assessment of what actually works
 * 
 * SOLVES: "Works without API keys" is technically true but useless
 * RESULT: Clear, honest capability reporting
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { logger } = require('../logging/bumba-logger');

/**
 * API Detection
 */
class APIDetector {
  constructor() {
    this.apis = {
      anthropic: {
        key: process.env.ANTHROPIC_API_KEY,
        name: 'Claude (Anthropic)',
        required: true,
        capabilities: ['code-generation', 'review', 'analysis', 'chat']
      },
      openai: {
        key: process.env.OPENAI_API_KEY,
        name: 'OpenAI GPT',
        required: false,
        capabilities: ['code-generation', 'review', 'fallback']
      },
      google: {
        key: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
        name: 'Google Gemini',
        required: false,
        capabilities: ['code-generation', 'review', 'fallback']
      },
      notion: {
        key: process.env.NOTION_API_KEY,
        name: 'Notion Integration',
        required: false,
        capabilities: ['documentation', 'project-management']
      },
      github: {
        key: process.env.GITHUB_TOKEN,
        name: 'GitHub Integration',
        required: false,
        capabilities: ['version-control', 'collaboration']
      }
    };
  }
  
  detect() {
    const available = {};
    const missing = [];
    
    Object.entries(this.apis).forEach(([id, api]) => {
      if (api.key && api.key.length > 0) {
        available[id] = api;
      } else if (api.required) {
        missing.push(api);
      }
    });
    
    return { available, missing };
  }
  
  hasMinimumAPIs() {
    const { available } = this.detect();
    // At minimum, need one LLM API
    return available.anthropic || available.openai || available.google;
  }
}

/**
 * Capability Assessment
 */
class CapabilityManager {
  constructor() {
    this.detector = new APIDetector();
    this.capabilities = this.assess();
  }
  
  /**
   * Assess actual capabilities based on available APIs
   */
  assess() {
    const { available, missing } = this.detector.detect();
    const hasLLM = this.detector.hasMinimumAPIs();
    
    return {
      withFullAPI: hasLLM ? [
        'Generate production code',
        'Review and validate code',
        'Fix bugs with context',
        'Create comprehensive documentation',
        'Refactor complex systems',
        'Design system architectures',
        'Optimize performance',
        'Implement security best practices'
      ] : [],
      
      withPartialAPI: hasLLM ? [
        'Basic code templates',
        'Simple syntax checking',
        'Code formatting',
        'Basic error detection'
      ] : [],
      
      withoutAPI: [
        'File organization',
        'Project structure setup',
        'Command routing (but nowhere to route)',
        'Timer management',
        'Configuration management',
        'Basic file operations'
      ],
      
      limitations: hasLLM ? [] : [
        'Cannot generate code without LLM API',
        'Cannot review or validate code',
        'Cannot provide intelligent suggestions',
        'Specialists cannot function',
        'Managers have nothing to manage'
      ],
      
      honest: hasLLM ? 
        'Full capabilities available with API keys' :
        '⚠️  You really need API keys for this to be useful',
        
      available,
      missing
    };
  }
  
  /**
   * Get available capabilities
   */
  getAvailableCapabilities() {
    return this.capabilities;
  }
  
  /**
   * Check if system is operational
   */
  isOperational() {
    return this.detector.hasMinimumAPIs();
  }
  
  /**
   * Generate startup message
   */
  getStartupMessage() {
    const caps = this.capabilities;
    const hasAPIs = this.isOperational();
    
    let message = '';
    
    if (hasAPIs) {
      message += chalk.green.bold('\n✅ BUMBA READY - Full Capabilities Available\n\n');
      
      message += chalk.cyan('Available APIs:\n');
      Object.entries(caps.available).forEach(([id, api]) => {
        message += chalk.green(`  ✓ ${api.name}\n`);
      });
      
      message += chalk.cyan('\nCapabilities:\n');
      caps.withFullAPI.slice(0, 5).forEach(cap => {
        message += chalk.gray(`  • ${cap}\n`);
      });
      
    } else {
      message += chalk.yellow.bold('\n⚠️  BUMBA LIMITED MODE - No API Keys Detected\n\n');
      
      message += chalk.red('Missing Required APIs:\n');
      caps.missing.forEach(api => {
        message += chalk.red(`  ✗ ${api.name} (${api.required ? 'REQUIRED' : 'optional'})\n`);
      });
      
      message += chalk.yellow('\nLimited Capabilities:\n');
      caps.withoutAPI.forEach(cap => {
        message += chalk.gray(`  • ${cap}\n`);
      });
      
      message += chalk.yellow.bold('\n' + caps.honest + '\n');
      
      message += chalk.cyan('\nTo enable full capabilities:\n');
      message += chalk.gray('  1. Add your API keys to .env file:\n');
      message += chalk.gray('     ANTHROPIC_API_KEY=your-key-here\n');
      message += chalk.gray('     OPENAI_API_KEY=your-key-here (optional)\n');
      message += chalk.gray('  2. Restart BUMBA\n');
    }
    
    return message;
  }
  
  /**
   * Generate capability report
   */
  generateReport() {
    const caps = this.capabilities;
    const hasAPIs = this.isOperational();
    
    const report = {
      timestamp: new Date().toISOString(),
      operational: hasAPIs,
      apis: {
        available: Object.keys(caps.available),
        missing: caps.missing.map(m => m.name),
        minimum_met: hasAPIs
      },
      capabilities: {
        full: caps.withFullAPI,
        partial: caps.withPartialAPI,
        limited: caps.withoutAPI
      },
      limitations: caps.limitations,
      recommendation: caps.honest
    };
    
    return report;
  }
  
  /**
   * CLI display
   */
  displayStatus() {
    console.log(this.getStartupMessage());
    
    if (!this.isOperational()) {
      console.log(chalk.gray('\nTip: Run "npm run setup" for guided API key configuration\n'));
    }
  }
  
  /**
   * Check specific capability
   */
  hasCapability(capability) {
    const caps = this.capabilities;
    return caps.withFullAPI.includes(capability) || 
           caps.withPartialAPI.includes(capability) ||
           caps.withoutAPI.includes(capability);
  }
  
  /**
   * Get setup instructions
   */
  getSetupInstructions() {
    const instructions = [];
    const { missing } = this.detector.detect();
    
    if (missing.length > 0) {
      instructions.push('# BUMBA Setup Instructions\n');
      instructions.push('## Required API Keys:\n');
      
      missing.forEach(api => {
        if (api.name === 'Claude (Anthropic)') {
          instructions.push('### Anthropic Claude API');
          instructions.push('1. Visit: https://console.anthropic.com/');
          instructions.push('2. Create an account or sign in');
          instructions.push('3. Generate an API key');
          instructions.push('4. Add to .env: ANTHROPIC_API_KEY=your-key\n');
        }
        
        if (api.name === 'OpenAI GPT') {
          instructions.push('### OpenAI (Optional - for fallback)');
          instructions.push('1. Visit: https://platform.openai.com/');
          instructions.push('2. Create an account or sign in');
          instructions.push('3. Generate an API key');
          instructions.push('4. Add to .env: OPENAI_API_KEY=your-key\n');
        }
      });
      
      instructions.push('## After adding keys:');
      instructions.push('1. Save your .env file');
      instructions.push('2. Restart BUMBA');
      instructions.push('3. Run: /bumba:status to verify\n');
    }
    
    return instructions.join('\n');
  }
}

/**
 * Singleton instance
 */
let instance = null;

function getCapabilityManager() {
  if (!instance) {
    instance = new CapabilityManager();
  }
  return instance;
}

module.exports = {
  CapabilityManager,
  APIDetector,
  getCapabilityManager
};