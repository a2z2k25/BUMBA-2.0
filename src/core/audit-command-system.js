#!/usr/bin/env node

/**
 * BUMBA Command System Audit
 * Comprehensive audit of all command definitions, routing, and operability
 */

const fs = require('fs');
const path = require('path');
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(text) {
  console.log('\n' + '='.repeat(80));
  console.log(colorize(`🔍 ${text}`, 'bright'));
  console.log('='.repeat(80));
}

function printSection(text) {
  console.log('\n' + colorize(`▶ ${text}`, 'cyan'));
  console.log('-'.repeat(60));
}

class CommandSystemAuditor {
  constructor() {
    this.registeredCommands = new Map();
    this.templateCommands = new Map();
    this.poolingCommands = new Map();
    this.issues = [];
    this.stats = {
      total: 0,
      documented: 0,
      registered: 0,
      poolingIntegrated: 0,
      operational: 0,
      orphaned: 0,
      duplicated: 0
    };
  }

  async runAudit() {
    printHeader('BUMBA COMMAND SYSTEM AUDIT');
    
    try {
      // Step 1: Scan registered commands
      await this.scanRegisteredCommands();
      
      // Step 2: Scan template documentation
      await this.scanTemplateCommands();
      
      // Step 3: Check pooling integration
      await this.checkPoolingIntegration();
      
      // Step 4: Verify command routing
      await this.verifyCommandRouting();
      
      // Step 5: Test command operability
      await this.testCommandOperability();
      
      // Step 6: Generate report
      this.generateReport();
      
    } catch (error) {
      console.error(colorize(`🔴 Audit Error: ${error.message}`, 'red'));
      console.error(error.stack);
    }
  }

  /**
   * Scan registered commands from command-handler.js
   */
  async scanRegisteredCommands() {
    printSection('Scanning Registered Commands');
    
    try {
      const handlerPath = path.join(__dirname, 'command-handler.js');
      const content = fs.readFileSync(handlerPath, 'utf8');
      
      // Extract registerCommand calls
      const registerPattern = /this\.registerCommand\(['"]([^'"]+)['"]/g;
      let match;
      
      while ((match = registerPattern.exec(content)) !== null) {
        const command = match[1];
        const handler = this.extractHandler(content, command);
        
        this.registeredCommands.set(command, {
          name: command,
          handler,
          department: this.getDepartmentFromHandler(handler),
          category: this.getCategoryFromCommand(command)
        });
      }
      
      console.log(`🏁 Found ${this.registeredCommands.size} registered commands`);
      this.stats.registered = this.registeredCommands.size;
      
      // List categories
      const categories = new Map();
      for (const [cmd, info] of this.registeredCommands) {
        const cat = info.category;
        categories.set(cat, (categories.get(cat) || 0) + 1);
      }
      
      console.log('\n📊 Commands by Category:');
      for (const [cat, count] of categories) {
        console.log(`   ${cat.padEnd(20)} : ${count} commands`);
      }
      
    } catch (error) {
      this.issues.push({
        type: 'SCAN_ERROR',
        message: `Failed to scan registered commands: ${error.message}`
      });
    }
  }

  /**
   * Scan template command documentation
   */
  async scanTemplateCommands() {
    printSection('Scanning Template Documentation');
    
    try {
      const templatesDir = path.join(__dirname, '../../templates/commands');
      const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.md'));
      
      for (const file of files) {
        const command = file.replace('.md', '');
        const filePath = path.join(templatesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Extract metadata from template
        const metadata = this.extractTemplateMetadata(content);
        
        this.templateCommands.set(command, {
          name: command,
          file,
          hasDescription: content.includes('## Description') || content.includes('# '),
          hasUsage: content.includes('## Usage') || content.includes('### Usage'),
          hasExamples: content.includes('## Example') || content.includes('### Example'),
          ...metadata
        });
      }
      
      console.log(`🏁 Found ${this.templateCommands.size} documented commands`);
      this.stats.documented = this.templateCommands.size;
      
      // Check documentation quality
      let wellDocumented = 0;
      for (const [cmd, info] of this.templateCommands) {
        if (info.hasDescription && info.hasUsage && info.hasExamples) {
          wellDocumented++;
        }
      }
      
      console.log(`📝 Well-documented: ${wellDocumented}/${this.templateCommands.size}`);
      
    } catch (error) {
      this.issues.push({
        type: 'TEMPLATE_ERROR',
        message: `Failed to scan templates: ${error.message}`
      });
    }
  }

  /**
   * Check pooling integration
   */
  async checkPoolingIntegration() {
    printSection('Checking Pooling Integration');
    
    try {
      // Load BUMBA command mapping
      const { BUMBA_COMMAND_MAPPING } = require('./pooling-v2/bumba-integration-bridge');
      
      for (const [cmd, mapping] of Object.entries(BUMBA_COMMAND_MAPPING)) {
        const commandName = cmd.replace('/bumba:', '');
        this.poolingCommands.set(commandName, {
          name: commandName,
          mapping,
          hasDepartment: !!mapping.department,
          hasType: !!mapping.type,
          hasPriority: !!mapping.priority,
          hasWorkflow: !!mapping.workflow
        });
      }
      
      console.log(`🏁 Found ${this.poolingCommands.size} pooling-integrated commands`);
      this.stats.poolingIntegrated = this.poolingCommands.size;
      
      // Analyze integration quality
      let fullyIntegrated = 0;
      for (const [cmd, info] of this.poolingCommands) {
        if ((info.hasDepartment || info.hasType) && info.hasPriority) {
          fullyIntegrated++;
        }
      }
      
      console.log(`🔗 Fully integrated: ${fullyIntegrated}/${this.poolingCommands.size}`);
      
    } catch (error) {
      this.issues.push({
        type: 'POOLING_ERROR',
        message: `Failed to check pooling integration: ${error.message}`
      });
    }
  }

  /**
   * Verify command routing
   */
  async verifyCommandRouting() {
    printSection('Verifying Command Routing');
    
    const routingIssues = [];
    
    // Check for orphaned commands (documented but not registered)
    for (const [cmd] of this.templateCommands) {
      if (!this.registeredCommands.has(cmd)) {
        routingIssues.push({
          command: cmd,
          issue: 'ORPHANED',
          message: 'Documented but not registered'
        });
        this.stats.orphaned++;
      }
    }
    
    // Check for undocumented commands (registered but not documented)
    for (const [cmd] of this.registeredCommands) {
      if (!this.templateCommands.has(cmd)) {
        routingIssues.push({
          command: cmd,
          issue: 'UNDOCUMENTED',
          message: 'Registered but not documented'
        });
      }
    }
    
    // Check for pooling gaps
    for (const [cmd] of this.registeredCommands) {
      const bumbaCmdName = cmd.replace(/-/g, ':');
      if (!this.poolingCommands.has(bumbaCmdName) && 
          !this.poolingCommands.has(cmd) &&
          !cmd.startsWith('notion-') &&
          !cmd.startsWith('conscious-') &&
          !cmd.startsWith('lite-')) {
        routingIssues.push({
          command: cmd,
          issue: 'NO_POOLING',
          message: 'Not integrated with pooling system'
        });
      }
    }
    
    if (routingIssues.length > 0) {
      console.log(colorize(`🟠️ Found ${routingIssues.length} routing issues:`, 'yellow'));
      for (const issue of routingIssues.slice(0, 10)) {
        console.log(`   ${issue.command.padEnd(25)} : ${issue.message}`);
      }
      if (routingIssues.length > 10) {
        console.log(`   ... and ${routingIssues.length - 10} more`);
      }
    } else {
      console.log(colorize('🏁 All command routing verified', 'green'));
    }
    
    this.issues.push(...routingIssues);
  }

  /**
   * Test command operability
   */
  async testCommandOperability() {
    printSection('Testing Command Operability');
    
    try {
      const BumbaCommandHandler = require('./command-handler');
      const handler = new BumbaCommandHandler();
      
      // Test sample commands from each category
      const testCommands = [
        'menu',
        'help',
        'analyze',
        'implement',
        'design',
        'api',
        'status'
      ];
      
      let operational = 0;
      let failed = 0;
      
      for (const cmd of testCommands) {
        try {
          // Check if handler exists
          if (handler.handlers.has(cmd)) {
            operational++;
            console.log(`🏁 ${cmd.padEnd(20)} : Operational`);
          } else {
            failed++;
            console.log(`🔴 ${cmd.padEnd(20)} : Handler not found`);
          }
        } catch (error) {
          failed++;
          console.log(`🔴 ${cmd.padEnd(20)} : ${error.message}`);
        }
      }
      
      console.log(`\n📊 Operability: ${operational}/${testCommands.length} tested commands working`);
      
      // Estimate total operability
      const registeredCount = this.registeredCommands.size;
      if (registeredCount > 0) {
        const operabilityRate = operational / testCommands.length;
        this.stats.operational = Math.floor(registeredCount * operabilityRate);
      }
      
    } catch (error) {
      this.issues.push({
        type: 'OPERABILITY_ERROR',
        message: `Failed to test operability: ${error.message}`
      });
    }
  }

  /**
   * Generate comprehensive audit report
   */
  generateReport() {
    printHeader('AUDIT REPORT');
    
    // Calculate totals
    const allCommands = new Set([
      ...this.registeredCommands.keys(),
      ...this.templateCommands.keys()
    ]);
    this.stats.total = allCommands.size;
    
    // Summary Statistics
    console.log('\n📊 Command System Statistics:');
    console.log(`   Total Commands:        ${this.stats.total}`);
    console.log(`   Registered:            ${this.stats.registered} (${this.getPercentage(this.stats.registered, this.stats.total)}%)`);
    console.log(`   Documented:            ${this.stats.documented} (${this.getPercentage(this.stats.documented, this.stats.total)}%)`);
    console.log(`   Pooling Integrated:    ${this.stats.poolingIntegrated} (${this.getPercentage(this.stats.poolingIntegrated, this.stats.registered)}%)`);
    console.log(`   Estimated Operational: ${this.stats.operational} (${this.getPercentage(this.stats.operational, this.stats.registered)}%)`);
    console.log(`   Orphaned:              ${this.stats.orphaned}`);
    
    // Issue Summary
    console.log('\n🟠️ Issues Summary:');
    const issueTypes = new Map();
    for (const issue of this.issues) {
      const type = issue.issue || issue.type;
      issueTypes.set(type, (issueTypes.get(type) || 0) + 1);
    }
    
    if (issueTypes.size > 0) {
      for (const [type, count] of issueTypes) {
        console.log(`   ${type.padEnd(20)} : ${count} issues`);
      }
    } else {
      console.log('   No critical issues found');
    }
    
    // Command List by Department
    console.log('\n🟢 Commands by Department:');
    const departments = new Map();
    
    for (const [cmd, info] of this.registeredCommands) {
      const dept = info.department || 'GLOBAL';
      if (!departments.has(dept)) {
        departments.set(dept, []);
      }
      departments.get(dept).push(cmd);
    }
    
    for (const [dept, commands] of departments) {
      console.log(`\n   ${colorize(dept, 'magenta')} (${commands.length} commands):`);
      const displayCommands = commands.slice(0, 5);
      for (const cmd of displayCommands) {
        const hasDoc = this.templateCommands.has(cmd) ? '📝' : '  ';
        const hasPooling = this.checkPoolingIntegration(cmd) ? '🔗' : '  ';
        console.log(`     ${hasDoc}${hasPooling} ${cmd}`);
      }
      if (commands.length > 5) {
        console.log(`     ... and ${commands.length - 5} more`);
      }
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    
    if (this.stats.orphaned > 0) {
      console.log(`   • Register ${this.stats.orphaned} orphaned commands in command-handler.js`);
    }
    
    const undocumented = this.stats.registered - this.stats.documented;
    if (undocumented > 0) {
      console.log(`   • Create documentation for ${Math.abs(undocumented)} commands`);
    }
    
    const notPooled = this.stats.registered - this.stats.poolingIntegrated;
    if (notPooled > 15) { // Allow some system commands to not be pooled
      console.log(`   • Integrate ${notPooled - 15} more commands with pooling system`);
    }
    
    if (this.stats.operational < this.stats.registered * 0.9) {
      console.log(`   • Fix non-operational commands to reach 90% operability`);
    }
    
    // Overall Health Score
    const healthScore = this.calculateHealthScore();
    console.log('\n' + '='.repeat(80));
    console.log(colorize(`🏁 Overall Command System Health: ${healthScore}%`, healthScore >= 80 ? 'green' : healthScore >= 60 ? 'yellow' : 'red'));
    
    if (healthScore >= 80) {
      console.log(colorize('🟡 Command system is healthy and well-maintained!', 'green'));
    } else if (healthScore >= 60) {
      console.log(colorize('🟠️ Command system needs some attention', 'yellow'));
    } else {
      console.log(colorize('🔴 Command system requires immediate maintenance', 'red'));
    }
    
    console.log('='.repeat(80) + '\n');
  }

  // Helper methods
  extractHandler(content, command) {
    const pattern = new RegExp(`registerCommand\\(['"]${command}['"],\\s*this\\.(\\w+)\\.bind`);
    const match = content.match(pattern);
    return match ? match[1] : 'unknown';
  }

  getDepartmentFromHandler(handler) {
    const mapping = {
      'handleProductCommand': 'PRODUCT',
      'handleDesignCommand': 'DESIGN',
      'handleBackendCommand': 'BACKEND',
      'handleDevOpsCommand': 'DEVOPS',
      'handleCollaborationCommand': 'COLLABORATION',
      'handleGlobalCommand': 'GLOBAL',
      'handleSystemCommand': 'SYSTEM',
      'handleMonitoringCommand': 'MONITORING',
      'handleConsciousnessCommand': 'CONSCIOUSNESS',
      'handleLiteCommand': 'LITE'
    };
    return mapping[handler] || 'UNKNOWN';
  }

  getCategoryFromCommand(command) {
    if (command.includes('implement')) return 'Implementation';
    if (command.includes('analyze')) return 'Analysis';
    if (command.includes('design') || command.includes('ui') || command.includes('figma')) return 'Design';
    if (command.includes('research')) return 'Research';
    if (command.includes('docs')) return 'Documentation';
    if (command.includes('test') || command.includes('validate')) return 'Testing';
    if (command.includes('improve') || command.includes('optimize')) return 'Optimization';
    if (command.includes('conscious')) return 'Consciousness';
    if (command.includes('lite')) return 'Lite Mode';
    if (command.includes('notion')) return 'Notion Integration';
    if (['menu', 'help', 'settings', 'status'].includes(command)) return 'System';
    return 'General';
  }

  extractTemplateMetadata(content) {
    const metadata = {};
    
    // Try to extract department
    const deptMatch = content.match(/Department:\s*(\w+)/i);
    if (deptMatch) metadata.department = deptMatch[1];
    
    // Try to extract priority
    const priorityMatch = content.match(/Priority:\s*(\w+)/i);
    if (priorityMatch) metadata.priority = priorityMatch[1];
    
    // Try to extract aliases
    const aliasMatch = content.match(/Aliases?:\s*([^\n]+)/i);
    if (aliasMatch) metadata.aliases = aliasMatch[1].split(',').map(a => a.trim());
    
    return metadata;
  }

  checkPoolingIntegration(command) {
    if (!command) return false;
    // Check various formats
    return this.poolingCommands.has(command) ||
           this.poolingCommands.has(command.replace(/-/g, ':')) ||
           this.poolingCommands.has(command.replace(/-/g, '_'));
  }

  getPercentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  calculateHealthScore() {
    let score = 0;
    const weights = {
      registered: 25,
      documented: 25,
      poolingIntegrated: 20,
      operational: 20,
      noOrphans: 10
    };
    
    // Registration score
    if (this.stats.total > 0) {
      score += weights.registered * (this.stats.registered / this.stats.total);
    }
    
    // Documentation score
    if (this.stats.total > 0) {
      score += weights.documented * (this.stats.documented / this.stats.total);
    }
    
    // Pooling integration score (excluding special commands)
    const poolingExpected = Math.max(0, this.stats.registered - 15); // Allow 15 system commands
    if (poolingExpected > 0) {
      score += weights.poolingIntegrated * Math.min(1, this.stats.poolingIntegrated / poolingExpected);
    } else {
      score += weights.poolingIntegrated;
    }
    
    // Operational score
    if (this.stats.registered > 0) {
      score += weights.operational * (this.stats.operational / this.stats.registered);
    }
    
    // No orphans bonus
    if (this.stats.orphaned === 0) {
      score += weights.noOrphans;
    }
    
    return Math.round(score);
  }
}

// Run audit if executed directly
if (require.main === module) {
  const auditor = new CommandSystemAuditor();
  auditor.runAudit().catch(console.error);
}

module.exports = CommandSystemAuditor;