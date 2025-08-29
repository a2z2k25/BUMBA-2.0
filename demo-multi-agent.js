#!/usr/bin/env node

/**
 * BUMBA Multi-Agent Demo Runner
 * No API keys required - pure simulation
 */

const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const Table = require('cli-table3');

// Mock agent system that simulates real BUMBA behavior
class MockAgentSystem {
  constructor() {
    this.agents = new Map();
    this.results = [];
    this.startTime = Date.now();
  }

  async runCommand(command, args) {
    console.clear();
    this.printHeader();
    
    console.log(chalk.cyan(`\n📋 Command: ${command} ${args.join(' ')}\n`));
    console.log(chalk.gray('─'.repeat(60) + '\n'));

    // Route to department
    const department = this.routeToDepartment(command);
    console.log(chalk.yellow(`🔀 Routing to ${department.name} department...\n`));
    await this.sleep(500);

    // Select specialists
    const specialists = await this.selectSpecialists(command, department);
    
    // Parallel execution
    await this.executeParallel(specialists, command, args);
    
    // Show results
    this.showResults();
  }

  printHeader() {
    console.log(chalk.cyan.bold('╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║        BUMBA Multi-Agent System - Demo Mode               ║'));
    console.log(chalk.cyan.bold('║          No API Keys Required - Pure Simulation           ║'));
    console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════╝'));
  }

  routeToDepartment(command) {
    const routing = {
      'prd': { name: 'Product', color: 'yellow', icon: '🟡', manager: 'Product Manager' },
      'design': { name: 'Design', color: 'red', icon: '🔴', manager: 'Design Lead' },
      'api': { name: 'Backend', color: 'green', icon: '🟢', manager: 'Tech Lead' },
      'implement': { name: 'Engineering', color: 'blue', icon: '🔵', manager: 'Engineering Manager' },
      'test': { name: 'QA', color: 'magenta', icon: '🟣', manager: 'QA Lead' }
    };

    return routing[command] || routing['implement'];
  }

  async selectSpecialists(command, department) {
    console.log(chalk.cyan('🎯 Selecting optimal specialists...\n'));

    const specialistPools = {
      'Product': [
        { name: 'product-manager', skill: 'Strategic planning', load: 30 },
        { name: 'business-analyst', skill: 'Requirements analysis', load: 45 },
        { name: 'market-researcher', skill: 'Market analysis', load: 20 }
      ],
      'Design': [
        { name: 'ui-designer', skill: 'Visual design', load: 35 },
        { name: 'ux-researcher', skill: 'User research', load: 40 },
        { name: 'interaction-designer', skill: 'Interaction patterns', load: 25 }
      ],
      'Backend': [
        { name: 'backend-engineer', skill: 'API development', load: 50 },
        { name: 'database-architect', skill: 'Data modeling', load: 30 },
        { name: 'api-specialist', skill: 'REST design', load: 35 }
      ],
      'Engineering': [
        { name: 'full-stack-developer', skill: 'Full implementation', load: 60 },
        { name: 'frontend-engineer', skill: 'UI implementation', load: 40 },
        { name: 'devops-engineer', skill: 'Infrastructure', load: 30 }
      ],
      'QA': [
        { name: 'test-engineer', skill: 'Test automation', load: 45 },
        { name: 'security-specialist', skill: 'Security validation', load: 35 },
        { name: 'performance-analyst', skill: 'Performance testing', load: 30 }
      ]
    };

    const pool = specialistPools[department.name] || specialistPools['Engineering'];
    
    // Simulate selection algorithm
    const selected = pool.filter(s => s.load < 50).slice(0, 3);
    
    for (const specialist of selected) {
      const spinner = ora({
        text: `Activating ${specialist.name} (${specialist.skill})`,
        prefixText: department.icon
      }).start();
      
      await this.sleep(300);
      spinner.succeed(chalk[department.color](`✓ ${specialist.name} activated`));
      
      this.agents.set(specialist.name, {
        ...specialist,
        department: department.name,
        status: 'active'
      });
    }

    console.log(chalk.green(`\n✨ ${selected.length} specialists activated\n`));
    return selected;
  }

  async executeParallel(specialists, command, args) {
    console.log(chalk.cyan('⚡ Executing in parallel mode...\n'));

    const tasks = specialists.map(specialist => ({
      specialist,
      tasks: this.generateTasks(specialist, command, args)
    }));

    // Create progress bars for each specialist
    const spinners = new Map();
    
    for (const { specialist, tasks: specialistTasks } of tasks) {
      const taskList = specialistTasks.map(t => t.name).join(', ');
      const spinner = ora({
        text: `${specialist.name}: ${taskList}`,
        color: 'cyan'
      }).start();
      
      spinners.set(specialist.name, { spinner, tasks: specialistTasks });
    }

    // Simulate parallel execution
    const completionPromises = [];
    
    for (const [name, { spinner, tasks: specialistTasks }] of spinners) {
      const promise = this.simulateWork(name, spinner, specialistTasks);
      completionPromises.push(promise);
    }

    // Wait for all to complete
    const results = await Promise.all(completionPromises);
    
    // Store results
    this.results = results;
    
    console.log(chalk.green.bold('\n✅ All specialists completed their tasks!\n'));
  }

  generateTasks(specialist, command, args) {
    const taskTemplates = {
      'product-manager': [
        { name: 'Define requirements', time: 1000 },
        { name: 'Create user stories', time: 800 },
        { name: 'Set success metrics', time: 600 }
      ],
      'ui-designer': [
        { name: 'Create wireframes', time: 1200 },
        { name: 'Design components', time: 900 },
        { name: 'Build style guide', time: 700 }
      ],
      'backend-engineer': [
        { name: 'Design API schema', time: 1100 },
        { name: 'Implement endpoints', time: 1500 },
        { name: 'Write documentation', time: 500 }
      ],
      'test-engineer': [
        { name: 'Create test plan', time: 800 },
        { name: 'Write test cases', time: 1000 },
        { name: 'Setup automation', time: 900 }
      ]
    };

    return taskTemplates[specialist.name] || [
      { name: 'Analyze requirements', time: 800 },
      { name: 'Execute task', time: 1200 },
      { name: 'Validate results', time: 600 }
    ];
  }

  async simulateWork(specialistName, spinner, tasks) {
    const results = [];
    
    for (const task of tasks) {
      spinner.text = `${specialistName}: Working on "${task.name}"...`;
      await this.sleep(task.time);
      
      results.push({
        specialist: specialistName,
        task: task.name,
        duration: task.time,
        status: 'completed'
      });
    }
    
    spinner.succeed(chalk.green(`✓ ${specialistName}: All tasks completed`));
    
    return {
      specialist: specialistName,
      tasks: results,
      totalTime: results.reduce((sum, r) => sum + r.duration, 0)
    };
  }

  showResults() {
    console.log(chalk.cyan.bold('📊 Execution Summary\n'));

    // Create summary table
    const table = new Table({
      head: ['Specialist', 'Tasks Completed', 'Time (ms)', 'Status'],
      colWidths: [25, 30, 15, 12],
      style: {
        head: ['cyan']
      }
    });

    let totalTasks = 0;
    let totalTime = 0;

    for (const result of this.results) {
      const taskNames = result.tasks.map(t => t.task).join('\n');
      table.push([
        chalk.yellow(result.specialist),
        taskNames,
        result.totalTime.toString(),
        chalk.green('✓ Complete')
      ]);
      
      totalTasks += result.tasks.length;
      totalTime = Math.max(totalTime, result.totalTime);
    }

    console.log(table.toString());

    // Performance metrics
    console.log(chalk.cyan.bold('\n⚡ Performance Metrics:\n'));
    
    const sequentialTime = this.results.reduce((sum, r) => sum + r.totalTime, 0);
    const parallelTime = totalTime;
    const efficiency = ((sequentialTime - parallelTime) / sequentialTime * 100).toFixed(1);
    
    console.log(`  ${chalk.white('Parallel Execution Time:')} ${parallelTime}ms`);
    console.log(`  ${chalk.white('Sequential Time (theoretical):')} ${sequentialTime}ms`);
    console.log(`  ${chalk.green('Time Saved:')} ${sequentialTime - parallelTime}ms`);
    console.log(`  ${chalk.yellow('Efficiency Gain:')} ${efficiency}%`);
    console.log(`  ${chalk.cyan('Total Tasks:')} ${totalTasks}`);
    console.log(`  ${chalk.magenta('Active Agents:')} ${this.agents.size}`);

    // Mock output files
    console.log(chalk.cyan.bold('\n📁 Generated Outputs (Simulated):\n'));
    
    const outputs = [
      `  📄 output/prd/feature-requirements.md`,
      `  🎨 output/design/wireframes.fig`,
      `  🔧 output/api/endpoints.yaml`,
      `  🧪 output/tests/test-suite.js`
    ];
    
    outputs.forEach(output => console.log(chalk.gray(output)));
    
    console.log(chalk.gray('\n' + '─'.repeat(60)));
    console.log(chalk.yellow.bold('\n✨ Demo complete! This is how BUMBA agents work in parallel.'));
    console.log(chalk.gray('In production, real AI models would generate actual content.\n'));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main demo interface
async function main() {
  console.clear();
  
  console.log(chalk.cyan.bold(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     🤖 BUMBA Multi-Agent Demo - No API Keys Required      ║
║                                                            ║
║     Experience parallel AI agents without setup!          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `));

  const { mode } = await inquirer.prompt([
    {
      type: 'list',
      name: 'mode',
      message: 'Select demo mode:',
      choices: [
        { name: '⚡ Quick Demo - See agents in action', value: 'quick' },
        { name: '🎯 Interactive - Choose your command', value: 'interactive' },
        { name: '🎨 Visual Demo - Real-time agent activity', value: 'visual' },
        { name: '📊 Benchmark - Performance comparison', value: 'benchmark' }
      ]
    }
  ]);

  const system = new MockAgentSystem();

  switch (mode) {
    case 'quick':
      await system.runCommand('implement', ['user', 'authentication']);
      break;
      
    case 'interactive':
      const { command } = await inquirer.prompt([
        {
          type: 'list',
          name: 'command',
          message: 'Choose a command to simulate:',
          choices: [
            { name: 'PRD - Product Requirements Document', value: 'prd' },
            { name: 'Design - UI/UX Design', value: 'design' },
            { name: 'API - Backend API Development', value: 'api' },
            { name: 'Implement - Full Implementation', value: 'implement' },
            { name: 'Test - Testing Suite', value: 'test' }
          ]
        }
      ]);
      
      const { feature } = await inquirer.prompt([
        {
          type: 'input',
          name: 'feature',
          message: 'Enter feature name:',
          default: 'dashboard'
        }
      ]);
      
      await system.runCommand(command, [feature]);
      break;
      
    case 'visual':
      // Run the visual simulation
      const { AgentSimulator } = require('./demo/multi-agent-simulation');
      const simulator = new AgentSimulator();
      await simulator.simulateMultiAgentWork('build amazing feature');
      break;
      
    case 'benchmark':
      console.log(chalk.cyan('\n📊 Running performance benchmark...\n'));
      
      const commands = ['prd', 'design', 'api', 'implement', 'test'];
      for (const cmd of commands) {
        console.log(chalk.yellow(`\nBenchmarking: ${cmd}`));
        await system.runCommand(cmd, ['benchmark', 'test']);
        await system.sleep(1000);
      }
      break;
  }

  // Ask to run again
  const { again } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'again',
      message: 'Run another demo?',
      default: true
    }
  ]);

  if (again) {
    await main();
  } else {
    console.log(chalk.cyan('\nThank you for trying BUMBA! 🚀\n'));
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { MockAgentSystem };