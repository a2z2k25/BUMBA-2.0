#!/usr/bin/env node

/**
 * BUMBA Command Validation & Integration Check
 * Ensures all commands are properly defined and integrated
 */

const fs = require('fs');
const path = require('path');

// Color helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// All BUMBA commands from command-handler.js
const REGISTERED_COMMANDS = [
  // Product Strategist Commands
  'implement-strategy',
  'prd',
  'requirements',
  'roadmap',
  'research-market',
  'analyze-business',
  'docs-business',
  'improve-strategy',
  
  // Design Engineer Commands
  'implement-design',
  'design',
  'figma',
  'ui',
  'visual',
  'research-design',
  'analyze-ux',
  'docs-design',
  'improve-design',
  'figma-context',
  
  // Backend Engineer Commands
  'implement-technical',
  'api',
  'secure',
  'scan',
  'analyze-technical',
  'devops',
  'research-technical',
  'docs-technical',
  'improve-performance',
  'publish',
  'n8n',
  
  // Collaboration Commands
  'implement-agents',
  'team',
  'collaborate',
  'chain',
  'workflow',
  'checkpoint',
  
  // Global Commands
  'implement',
  'analyze',
  'docs',
  'research',
  'snippets',
  'test',
  'validate',
  'improve',
  
  // Consciousness Commands
  'conscious-analyze',
  'conscious-reason',
  'conscious-wisdom',
  'conscious-purpose',
  
  // Lite Mode Commands
  'lite',
  'lite-analyze',
  'lite-implement',
  
  // System Commands
  'menu',
  'help',
  'settings',
  'orchestrate',
  'memory',
  
  // Monitoring Commands
  'health',
  'metrics',
  'profile',
  'optimize',
  'monitor',
  'status',
  
  // Additional Commands
  'connect',
  'operability',
  'commit',
  'handoff',
  'urgent'
];

// Commands that should be in pooling integration
const POOLING_COMMANDS = {
  // Core commands
  'implement': { type: 'implementation', priority: 'high' },
  'analyze': { type: 'analysis', priority: 'medium' },
  'design': { type: 'design', priority: 'medium' },
  'secure': { type: 'security', priority: 'high' },
  'improve': { type: 'optimization', priority: 'medium' },
  
  // Department-specific
  'api': { type: 'api', department: 'BACKEND', workflow: 'API_DEVELOPMENT' },
  'backend': { department: 'BACKEND', type: 'backend', priority: 'high' },
  'frontend': { department: 'FRONTEND', type: 'frontend', priority: 'high' },
  'mobile': { department: 'MOBILE', type: 'mobile', priority: 'medium' },
  'data': { department: 'DATA_ENGINEERING', type: 'data', priority: 'high' },
  'ml': { department: 'ML_AI', type: 'ml', priority: 'high' },
  'devops': { department: 'DEVOPS', type: 'devops', priority: 'high' },
  'security': { department: 'SECURITY', type: 'security', priority: 'high' },
  'test': { type: 'testing', department: 'TESTING', priority: 'medium' },
  'deploy': { type: 'deployment', department: 'DEVOPS', workflow: 'DEPLOYMENT' }
};

class CommandValidator {
  constructor() {
    this.results = {
      total: REGISTERED_COMMANDS.length,
      documented: 0,
      hasHandler: 0,
      poolingReady: 0,
      issues: []
    };
  }

  async validate() {
    console.log(colorize('\n🔍 BUMBA Command Validation', 'bright'));
    console.log('='.repeat(60));
    
    // Check documentation
    await this.checkDocumentation();
    
    // Check handlers
    await this.checkHandlers();
    
    // Check pooling integration
    await this.checkPoolingIntegration();
    
    // Generate report
    this.generateReport();
  }

  async checkDocumentation() {
    console.log('\n📝 Checking Documentation...');
    
    const templatesDir = path.join(__dirname, '../../templates/commands');
    const existingTemplates = new Set();
    
    try {
      const files = fs.readdirSync(templatesDir);
      files.forEach(file => {
        if (file.endsWith('.md')) {
          existingTemplates.add(file.replace('.md', ''));
        }
      });
    } catch (error) {
      console.log(colorize('🔴 Templates directory not found', 'red'));
      return;
    }
    
    const missingDocs = [];
    
    for (const cmd of REGISTERED_COMMANDS) {
      if (existingTemplates.has(cmd)) {
        this.results.documented++;
      } else {
        missingDocs.push(cmd);
      }
    }
    
    console.log(`🏁 Documented: ${this.results.documented}/${this.results.total}`);
    
    if (missingDocs.length > 0) {
      console.log(colorize(`🟠️ Missing documentation for ${missingDocs.length} commands:`, 'yellow'));
      console.log('   ' + missingDocs.slice(0, 5).join(', '));
      if (missingDocs.length > 5) {
        console.log(`   ... and ${missingDocs.length - 5} more`);
      }
      
      this.results.issues.push({
        type: 'MISSING_DOCS',
        commands: missingDocs
      });
    }
  }

  async checkHandlers() {
    console.log('\n🔧 Checking Command Handlers...');
    
    try {
      const handlerPath = path.join(__dirname, 'command-handler.js');
      const content = fs.readFileSync(handlerPath, 'utf8');
      
      for (const cmd of REGISTERED_COMMANDS) {
        if (content.includes(`registerCommand('${cmd}'`)) {
          this.results.hasHandler++;
        }
      }
      
      console.log(`🏁 Has handler: ${this.results.hasHandler}/${this.results.total}`);
      
    } catch (error) {
      console.log(colorize('🔴 Error checking handlers: ' + error.message, 'red'));
    }
  }

  async checkPoolingIntegration() {
    console.log('\n🔗 Checking Pooling Integration...');
    
    const needsPooling = [];
    
    for (const cmd of REGISTERED_COMMANDS) {
      // Skip system/meta commands
      if (['menu', 'help', 'settings', 'status', 'memory', 'orchestrate'].includes(cmd)) {
        continue;
      }
      
      // Skip consciousness and lite commands (they have their own handling)
      if (cmd.startsWith('conscious-') || cmd.startsWith('lite-')) {
        continue;
      }
      
      // Check if command should have pooling
      const baseCmd = cmd.replace(/^(implement-|analyze-|docs-|improve-|research-)/, '');
      
      if (POOLING_COMMANDS[baseCmd] || POOLING_COMMANDS[cmd]) {
        this.results.poolingReady++;
      } else {
        needsPooling.push(cmd);
      }
    }
    
    console.log(`🏁 Pooling ready: ${this.results.poolingReady}/${this.results.total - 12}`);
    
    if (needsPooling.length > 0) {
      console.log(colorize(`🟠️ Needs pooling integration: ${needsPooling.length} commands`, 'yellow'));
      
      this.results.issues.push({
        type: 'NEEDS_POOLING',
        commands: needsPooling
      });
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log(colorize('📊 VALIDATION REPORT', 'bright'));
    console.log('='.repeat(60));
    
    const score = Math.round(
      ((this.results.documented / this.results.total) * 33) +
      ((this.results.hasHandler / this.results.total) * 33) +
      ((this.results.poolingReady / (this.results.total - 12)) * 34)
    );
    
    console.log(`\nTotal Commands: ${this.results.total}`);
    console.log(`Documented:     ${this.results.documented} (${Math.round(this.results.documented / this.results.total * 100)}%)`);
    console.log(`Has Handler:    ${this.results.hasHandler} (${Math.round(this.results.hasHandler / this.results.total * 100)}%)`);
    console.log(`Pooling Ready:  ${this.results.poolingReady} (${Math.round(this.results.poolingReady / (this.results.total - 12) * 100)}%)`);
    
    console.log(`\nHealth Score: ${score}%`);
    
    if (score >= 80) {
      console.log(colorize('🏁 Command system is healthy!', 'green'));
    } else if (score >= 60) {
      console.log(colorize('🟠️ Command system needs improvement', 'yellow'));
    } else {
      console.log(colorize('🔴 Command system needs attention', 'red'));
    }
    
    // Generate pooling integration snippet
    if (this.results.issues.some(i => i.type === 'NEEDS_POOLING')) {
      console.log('\n💡 Suggested Pooling Integration:');
      console.log('Add to bumba-integration-bridge.js:\n');
      
      const needsPooling = this.results.issues.find(i => i.type === 'NEEDS_POOLING').commands;
      
      for (const cmd of needsPooling.slice(0, 5)) {
        const dept = this.guessDepartment(cmd);
        const type = this.guessType(cmd);
        const priority = cmd.includes('implement') || cmd.includes('urgent') ? 'high' : 'medium';
        
        console.log(`  '/bumba:${cmd}': { department: '${dept}', type: '${type}', priority: '${priority}' },`);
      }
      
      if (needsPooling.length > 5) {
        console.log(`  // ... and ${needsPooling.length - 5} more commands`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
  }

  guessDepartment(cmd) {
    if (cmd.includes('design') || cmd.includes('ui') || cmd.includes('figma') || cmd.includes('visual')) return 'FRONTEND';
    if (cmd.includes('api') || cmd.includes('backend') || cmd.includes('secure') || cmd.includes('technical')) return 'BACKEND';
    if (cmd.includes('strategy') || cmd.includes('prd') || cmd.includes('requirements') || cmd.includes('roadmap')) return 'PRODUCT';
    if (cmd.includes('devops') || cmd.includes('deploy') || cmd.includes('publish')) return 'DEVOPS';
    if (cmd.includes('data') || cmd.includes('ml') || cmd.includes('ai')) return 'DATA_ENGINEERING';
    if (cmd.includes('test') || cmd.includes('validate')) return 'TESTING';
    if (cmd.includes('monitor') || cmd.includes('metrics') || cmd.includes('health')) return 'MONITORING';
    return 'GENERAL';
  }

  guessType(cmd) {
    if (cmd.includes('implement')) return 'implementation';
    if (cmd.includes('analyze')) return 'analysis';
    if (cmd.includes('design')) return 'design';
    if (cmd.includes('research')) return 'research';
    if (cmd.includes('docs')) return 'documentation';
    if (cmd.includes('improve') || cmd.includes('optimize')) return 'optimization';
    if (cmd.includes('test') || cmd.includes('validate')) return 'testing';
    if (cmd.includes('api')) return 'api';
    if (cmd.includes('secure')) return 'security';
    return 'general';
  }
}

// Run validation
if (require.main === module) {
  const validator = new CommandValidator();
  validator.validate().catch(console.error);
}

module.exports = CommandValidator;