#!/usr/bin/env node

/**
 * BUMBA Multi-Agent Demo - Simple Version
 * Shows multiple agents working in parallel without API keys
 */

const chalk = require('chalk');

class MultiAgentDemo {
  constructor() {
    this.agents = [];
    this.departments = {
      product: { color: 'yellow', icon: '🟡', name: 'Product' },
      design: { color: 'red', icon: '🔴', name: 'Design' },
      backend: { color: 'green', icon: '🟢', name: 'Backend' },
      qa: { color: 'blue', icon: '🔵', name: 'QA' }
    };
  }

  async run(command = 'implement user authentication') {
    console.clear();
    this.printHeader();
    
    console.log(chalk.cyan(`\n📋 Task: "${command}"\n`));
    console.log(chalk.gray('═'.repeat(60) + '\n'));

    // Phase 1: Initialize Agents
    console.log(chalk.magenta.bold('PHASE 1: INITIALIZING AGENTS\n'));
    await this.initializeAgents();
    await this.sleep(1000);

    // Phase 2: Parallel Analysis
    console.log(chalk.magenta.bold('\nPHASE 2: PARALLEL ANALYSIS\n'));
    await this.parallelAnalysis();
    await this.sleep(1000);

    // Phase 3: Collaborative Work
    console.log(chalk.magenta.bold('\nPHASE 3: COLLABORATIVE WORK\n'));
    await this.collaborativeWork();
    await this.sleep(1000);

    // Phase 4: Integration
    console.log(chalk.magenta.bold('\nPHASE 4: INTEGRATION\n'));
    await this.integration();
    
    // Show Results
    this.showResults();
  }

  printHeader() {
    console.log(chalk.cyan.bold('╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║        BUMBA Multi-Agent System - Live Demo               ║'));
    console.log(chalk.cyan.bold('║          No API Keys Required - Pure Simulation           ║'));
    console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════╝'));
  }

  async initializeAgents() {
    const agentGroups = [
      {
        dept: 'product',
        agents: ['Product Manager', 'Business Analyst', 'Requirements Analyst']
      },
      {
        dept: 'design',
        agents: ['UI Designer', 'UX Researcher', 'Interaction Designer']
      },
      {
        dept: 'backend',
        agents: ['Backend Engineer', 'Database Architect', 'API Specialist']
      },
      {
        dept: 'qa',
        agents: ['Test Engineer', 'Security Specialist', 'Performance Analyst']
      }
    ];

    for (const group of agentGroups) {
      const dept = this.departments[group.dept];
      console.log(chalk[dept.color](`${dept.icon} Initializing ${dept.name} Department...`));
      
      for (const agentName of group.agents) {
        await this.sleep(100);
        console.log(chalk.gray(`   ✓ ${agentName} ready`));
        this.agents.push({
          name: agentName,
          department: group.dept,
          status: 'ready',
          tasks: []
        });
      }
    }
    
    console.log(chalk.green(`\n✅ ${this.agents.length} agents initialized and ready!`));
  }

  async parallelAnalysis() {
    const analyses = [
      { dept: 'product', agent: 'Product Manager', task: 'Analyzing requirements', time: 800 },
      { dept: 'design', agent: 'UI Designer', task: 'Creating wireframes', time: 1200 },
      { dept: 'backend', agent: 'Backend Engineer', task: 'Designing API architecture', time: 1000 },
      { dept: 'qa', agent: 'Test Engineer', task: 'Planning test scenarios', time: 900 }
    ];

    console.log(chalk.cyan('🔄 Starting parallel analysis...\n'));
    
    // Start all analyses simultaneously
    const startTime = Date.now();
    const promises = analyses.map(async (analysis) => {
      const dept = this.departments[analysis.dept];
      console.log(chalk[dept.color](`${dept.icon} ${analysis.agent}: ${analysis.task}...`));
      
      await this.sleep(analysis.time);
      
      console.log(chalk.green(`   ✓ ${analysis.agent}: Analysis complete (${analysis.time}ms)`));
      return analysis;
    });

    await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    console.log(chalk.green.bold(`\n✨ All analyses completed in ${totalTime}ms!`));
    console.log(chalk.yellow(`   Sequential time would have been: ${analyses.reduce((sum, a) => sum + a.time, 0)}ms`));
    console.log(chalk.green(`   Time saved: ${analyses.reduce((sum, a) => sum + a.time, 0) - totalTime}ms`));
  }

  async collaborativeWork() {
    const collaborations = [
      {
        agents: ['Product Manager', 'UI Designer'],
        task: 'Reviewing user flow',
        dept: ['product', 'design']
      },
      {
        agents: ['Backend Engineer', 'Database Architect'],
        task: 'Optimizing data structure',
        dept: ['backend', 'backend']
      },
      {
        agents: ['UI Designer', 'Backend Engineer'],
        task: 'Defining API contract',
        dept: ['design', 'backend']
      },
      {
        agents: ['Test Engineer', 'Security Specialist'],
        task: 'Security test planning',
        dept: ['qa', 'qa']
      }
    ];

    console.log(chalk.cyan('🤝 Starting collaborative sessions...\n'));

    for (const collab of collaborations) {
      const icons = collab.dept.map(d => this.departments[d].icon).join(' + ');
      const isCrossDept = collab.dept[0] !== collab.dept[1];
      
      if (isCrossDept) {
        console.log(chalk.magenta(`${icons} Cross-department collaboration:`));
      } else {
        console.log(chalk.cyan(`${icons} Department collaboration:`));
      }
      
      console.log(chalk.white(`   ${collab.agents.join(' & ')}: ${collab.task}`));
      await this.sleep(500);
      console.log(chalk.green(`   ✓ Collaboration complete`));
    }
  }

  async integration() {
    const steps = [
      { task: 'Merging design assets', icon: '🎨', time: 300 },
      { task: 'Integrating API endpoints', icon: '🔧', time: 400 },
      { task: 'Running automated tests', icon: '🧪', time: 500 },
      { task: 'Validating security', icon: '🔒', time: 300 },
      { task: 'Generating documentation', icon: '📚', time: 200 }
    ];

    console.log(chalk.cyan('🔧 Integrating all components...\n'));

    for (const step of steps) {
      console.log(chalk.white(`${step.icon} ${step.task}...`));
      await this.sleep(step.time);
      console.log(chalk.green(`   ✓ ${step.task} complete`));
    }
  }

  showResults() {
    console.log(chalk.green.bold('\n\n✅ MULTI-AGENT COLLABORATION COMPLETE!\n'));
    console.log(chalk.gray('═'.repeat(60)));
    
    // Summary by department
    console.log(chalk.cyan.bold('\n📊 Department Summary:\n'));
    
    for (const [key, dept] of Object.entries(this.departments)) {
      const deptAgents = this.agents.filter(a => a.department === key);
      console.log(chalk[dept.color](`${dept.icon} ${dept.name} Department:`));
      console.log(chalk.white(`   Agents: ${deptAgents.length}`));
      console.log(chalk.gray(`   ${deptAgents.map(a => a.name).join(', ')}`));
      console.log();
    }

    // Mock outputs
    console.log(chalk.cyan.bold('📁 Generated Outputs (Simulated):\n'));
    const outputs = [
      { file: 'output/prd/user-auth-requirements.md', dept: 'product' },
      { file: 'output/design/auth-wireframes.fig', dept: 'design' },
      { file: 'output/api/auth-endpoints.yaml', dept: 'backend' },
      { file: 'output/tests/auth-test-suite.js', dept: 'qa' }
    ];

    for (const output of outputs) {
      const dept = this.departments[output.dept];
      console.log(chalk[dept.color](`${dept.icon} ${output.file}`));
    }

    // Performance metrics
    console.log(chalk.cyan.bold('\n⚡ Performance Metrics:\n'));
    console.log(chalk.white(`Total Agents: ${this.agents.length}`));
    console.log(chalk.white(`Departments: ${Object.keys(this.departments).length}`));
    console.log(chalk.white(`Parallel Tasks: 8`));
    console.log(chalk.white(`Cross-dept Collaborations: 2`));
    console.log(chalk.green(`Efficiency Gain: 65% faster than sequential`));
    
    console.log(chalk.gray('\n' + '═'.repeat(60)));
    console.log(chalk.yellow.bold('\n🎉 Demo Complete!'));
    console.log(chalk.gray('This demonstrates how BUMBA agents work in parallel.'));
    console.log(chalk.gray('In production, real AI models generate actual content.\n'));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run demo with command line arguments
async function main() {
  const args = process.argv.slice(2);
  const command = args.join(' ') || 'implement user authentication';
  
  const demo = new MultiAgentDemo();
  await demo.run(command);
  
  // Show how to run with different commands
  console.log(chalk.cyan('\nTry running with different commands:'));
  console.log(chalk.gray('  node demo-agents.js create payment system'));
  console.log(chalk.gray('  node demo-agents.js design dashboard'));
  console.log(chalk.gray('  node demo-agents.js build chat feature\n'));
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = MultiAgentDemo;