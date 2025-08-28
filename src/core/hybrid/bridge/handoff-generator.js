/**
 * BUMBA Handoff Generator
 * Generates clear handoff instructions for Claude execution
 */

const chalk = require('chalk');

class HandoffGenerator {
  constructor() {
    this.templates = {
      quickStart: '/bumba:execute {taskId}',
      detailed: this.getDetailedTemplate()
    };
  }

  /**
   * Generate handoff instructions
   * @param {Object} task Task object
   * @returns {Object} Handoff details
   */
  generate(task) {
    const quickCommand = `/bumba:execute ${task.id}`;
    const taskFile = `.bumba/tasks/${task.id}.json`;
    
    const instruction = this.formatInstruction(task);
    const summary = this.summarizeContext(task.context);
    
    return {
      quickStart: quickCommand,
      taskFile,
      instruction,
      summary,
      task
    };
  }

  /**
   * Format detailed instruction
   * @param {Object} task Task object
   * @returns {string} Formatted instruction
   */
  formatInstruction(task) {
    const lines = [
      '',
      '🏁 Task Prepared for Claude Execution',
      '━'.repeat(60),
      '',
      `Task ID: ${task.id}`,
      `Type: ${task.type}`,
      `Priority: ${task.requirements?.priority || 'normal'}`,
      '',
      '📋 Description:',
      task.description,
      '',
      '🎯 Requirements:',
      ...this.formatRequirements(task.requirements),
      '',
      '🤖 Suggested Agents:',
      ...task.suggestedAgents.map(agent => `  • ${agent}`),
      '',
      '📊 Context Summary:',
      this.summarizeContext(task.context),
      '',
      '🚀 To Execute:',
      '1. Open Claude Code (claude.ai)',
      `2. Navigate to: ${process.cwd()}`,
      `3. Run: /bumba:execute ${task.id}`,
      '',
      'Or copy this command:',
      '━'.repeat(60),
      `/bumba:execute ${task.id}`,
      '━'.repeat(60),
      ''
    ];
    
    return lines.join('\n');
  }

  /**
   * Format requirements list
   * @param {Object} requirements Requirements object
   * @returns {Array} Formatted lines
   */
  formatRequirements(requirements) {
    const lines = [];
    
    if (requirements) {
      if (requirements.features?.length > 0) {
        lines.push('  Features:');
        requirements.features.forEach(f => lines.push(`    • ${f}`));
      }
      
      if (requirements.constraints?.length > 0) {
        lines.push('  Constraints:');
        requirements.constraints.forEach(c => lines.push(`    • ${c}`));
      }
      
      if (requirements.technologies?.length > 0) {
        lines.push('  Technologies:');
        lines.push(`    ${requirements.technologies.join(', ')}`);
      }
    }
    
    if (lines.length === 0) {
      lines.push('  • No specific requirements');
    }
    
    return lines;
  }

  /**
   * Summarize context information
   * @param {Object} context Context object
   * @returns {string} Context summary
   */
  summarizeContext(context) {
    if (!context) {
      return 'No context gathered';
    }
    
    const parts = [];
    
    if (context.type) {
      parts.push(`Project: ${context.type}`);
    }
    
    if (context.stack && context.stack.length > 0) {
      parts.push(`Stack: ${context.stack.slice(0, 3).join(', ')}${context.stack.length > 3 ? '...' : ''}`);
    }
    
    if (context.fileCount) {
      parts.push(`Files: ${context.fileCount}`);
    }
    
    if (context.patterns && context.patterns.length > 0) {
      parts.push(`Patterns: ${context.patterns.length} detected`);
    }
    
    if (context.health) {
      parts.push(`Health: ${context.health.score}/100`);
    }
    
    return parts.join(' | ');
  }

  /**
   * Generate execution script
   * @param {Object} task Task object
   * @returns {string} Execution script
   */
  generateExecutionScript(task) {
    return `#!/usr/bin/env node
/**
 * BUMBA Task Execution Script
 * Task: ${task.id}
 * Generated: ${new Date().toISOString()}
 */

// This script is for reference only
// Execute in Claude Code with: /bumba:execute ${task.id}

const task = ${JSON.stringify(task, null, 2)};

console.log('Task prepared for Claude execution');
console.log('Task ID:', task.id);
console.log('Description:', task.description);
console.log('');
console.log('To execute:');
console.log('1. Open Claude Code');
console.log('2. Run: /bumba:execute ' + task.id);
`;
  }

  /**
   * Generate markdown documentation
   * @param {Object} task Task object
   * @returns {string} Markdown documentation
   */
  generateMarkdown(task) {
    return `# BUMBA Task: ${task.id}

## Description
${task.description}

## Task Details
- **Type**: ${task.type}
- **Created**: ${new Date(task.timestamp).toISOString()}
- **Priority**: ${task.requirements?.priority || 'normal'}

## Requirements
${this.formatRequirementsMarkdown(task.requirements)}

## Suggested Agents
${task.suggestedAgents.map(agent => `- ${agent}`).join('\n')}

## Context
- **Project Type**: ${task.context?.type || 'unknown'}
- **Tech Stack**: ${task.context?.stack?.join(', ') || 'not detected'}
- **Files Analyzed**: ${task.context?.fileCount || 0}

## Execution
\`\`\`bash
# Execute in Claude Code
/bumba:execute ${task.id}
\`\`\`

## Task File Location
\`${`.bumba/tasks/${task.id}.json`}\`
`;
  }

  /**
   * Format requirements for markdown
   * @param {Object} requirements Requirements object
   * @returns {string} Markdown formatted requirements
   */
  formatRequirementsMarkdown(requirements) {
    if (!requirements) {
      return '- No specific requirements';
    }
    
    let markdown = '';
    
    if (requirements.features?.length > 0) {
      markdown += '### Features\n';
      requirements.features.forEach(f => {
        markdown += `- ${f}\n`;
      });
    }
    
    if (requirements.constraints?.length > 0) {
      markdown += '\n### Constraints\n';
      requirements.constraints.forEach(c => {
        markdown += `- ${c}\n`;
      });
    }
    
    if (requirements.technologies?.length > 0) {
      markdown += '\n### Technologies\n';
      markdown += requirements.technologies.join(', ');
    }
    
    return markdown || '- No specific requirements';
  }

  /**
   * Get detailed template
   * @returns {string} Template string
   */
  getDetailedTemplate() {
    return `
🏁 BUMBA Task Handoff
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task ID: {taskId}
Type: {taskType}
Description: {description}

📋 Context Gathered:
{contextSummary}

🎯 Requirements:
{requirements}

🤖 Agents:
{agents}

🚀 Execution Command:
/bumba:execute {taskId}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }

  /**
   * Generate visual handoff card
   * @param {Object} task Task object
   * @returns {string} Visual card
   */
  generateVisualCard(task) {
    const width = 60;
    const border = '═'.repeat(width - 2);
    
    return `
╔${border}╗
║ 🏁 BUMBA Task Ready for Claude                        ║
╠${border}╣
║                                                        ║
║ Task: ${task.id.padEnd(47)}║
║ Type: ${task.type.padEnd(47)}║
║                                                        ║
║ 📋 ${task.description.substring(0, 49).padEnd(50)}║
║                                                        ║
║ Agents: ${task.suggestedAgents.length} specialists ready              ║
║ Context: Fully analyzed                               ║
║ Priority: ${(task.requirements?.priority || 'normal').padEnd(43)}║
║                                                        ║
╠${border}╣
║ Execute: /bumba:execute ${task.id.padEnd(28)}║
╚${border}╝
`;
  }
}

module.exports = HandoffGenerator;