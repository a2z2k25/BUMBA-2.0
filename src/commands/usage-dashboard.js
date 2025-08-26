#!/usr/bin/env node

/**
 * BUMBA Free Tier Usage Dashboard
 * Real-time monitoring of free tier usage and cost optimization
 */

const chalk = require('chalk');
const { getInstance: getFreeTierManager } = require('../core/agents/free-tier-manager');
const { getInstance: getOrchestrator } = require('../core/agents/cost-optimized-orchestrator');
const { ParallelAgentSystem } = require('../core/agents/parallel-agent-system');

class UsageDashboard {
  constructor() {
    this.freeTierManager = getFreeTierManager();
    this.orchestrator = getOrchestrator();
    this.parallelSystem = new ParallelAgentSystem();
  }

  /**
   * Display main dashboard
   */
  async display() {
    console.clear();
    console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║         BUMBA FREE TIER USAGE DASHBOARD                   ║'));
    console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════╝\n'));

    // Get current usage
    const usage = this.freeTierManager.getUsageSummary();

    // Display FREE tier status
    this.displayFreeTiers(usage);

    // Display usage bars
    this.displayUsageBars(usage);

    // Display recommendations
    this.displayRecommendations();

    // Display cost savings
    this.displayCostSavings();

    // Display strategy guide
    this.displayStrategyGuide();
  }

  /**
   * Display free tier status
   */
  displayFreeTiers(usage) {
    console.log(chalk.green.bold('🆓 FREE TIER STATUS'));
    console.log(chalk.gray('─'.repeat(60)));

    // Gemini (Google)
    if (usage.gemini) {
      this.displayTierStatus('Gemini Pro', usage.gemini, '🏁');
    }

    // DeepSeek R1
    if (usage.deepseek) {
      this.displayTierStatus('DeepSeek R1', usage.deepseek, '🟢');
    }

    // Qwen Coder
    if (usage.qwen) {
      this.displayTierStatus('Qwen Coder', usage.qwen, '🟢');
    }

    console.log();
  }

  /**
   * Display individual tier status
   */
  displayTierStatus(name, data, emoji) {
    const status = data.usage.exhausted ? chalk.red('🔴 EXHAUSTED') : chalk.green('🏁 AVAILABLE');
    const tokensUsed = parseInt(data.usage.percentUsed.tokens);
    const requestsUsed = parseInt(data.usage.percentUsed.requests);

    console.log(`\n${emoji} ${chalk.white.bold(name)} ${status}`);
    console.log(chalk.gray(`   Provider: ${data.provider}`));
    console.log(chalk.gray(`   Tokens:   ${this.formatNumber(data.usage.tokens)} / ${this.formatNumber(data.usage.tokens + data.usage.tokensRemaining)} (${tokensUsed}%)`));
    console.log(chalk.gray(`   Requests: ${data.usage.requests} / ${data.usage.requests + data.usage.requestsRemaining} (${requestsUsed}%)`));
    console.log(chalk.gray(`   Cost:     ${chalk.green('$0.00')} (FREE!)`));
  }

  /**
   * Display usage bars
   */
  displayUsageBars(usage) {
    console.log(chalk.yellow.bold('🟢 USAGE VISUALIZATION'));
    console.log(chalk.gray('─'.repeat(60)));

    for (const [key, data] of Object.entries(usage)) {
      if (data.isFree) {
        const percent = parseInt(data.usage.percentUsed.tokens);
        this.displayProgressBar(key.toUpperCase(), percent);
      }
    }

    console.log();
  }

  /**
   * Display progress bar
   */
  displayProgressBar(name, percent) {
    const barLength = 40;
    const filled = Math.round((percent / 100) * barLength);
    const empty = barLength - filled;

    let bar = '';
    let color = chalk.green;

    if (percent >= 80) {
      color = chalk.red;
    } else if (percent >= 60) {
      color = chalk.yellow;
    }

    bar = color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));

    console.log(`\n${name.padEnd(12)} [${bar}] ${percent}%`);
  }

  /**
   * Display recommendations
   */
  displayRecommendations() {
    console.log(chalk.cyan.bold('🟢 OPTIMIZATION RECOMMENDATIONS'));
    console.log(chalk.gray('─'.repeat(60)));

    const recommendations = this.freeTierManager.getUsageRecommendation();

    if (recommendations.length === 0) {
      console.log(chalk.gray('   No recommendations at this time'));
    } else {
      recommendations.forEach(rec => {
        console.log(`   ${rec}`);
      });
    }

    // Add orchestrator recommendations
    const orchRecs = this.orchestrator.getOptimizationRecommendations();
    orchRecs.forEach(rec => {
      console.log(`   ${rec}`);
    });

    console.log();
  }

  /**
   * Display cost savings
   */
  displayCostSavings() {
    const metrics = this.orchestrator.metrics;

    console.log(chalk.green.bold('🟢 COST SAVINGS'));
    console.log(chalk.gray('─'.repeat(60)));

    console.log(`   Total Executions:  ${metrics.totalExecutions}`);
    console.log(`   Free Executions:   ${metrics.freeExecutions} (${this.calculatePercent(metrics.freeExecutions, metrics.totalExecutions)}%)`);
    console.log(`   Paid Executions:   ${metrics.paidExecutions}`);
    console.log(`   Total Cost:        ${chalk.yellow(`$${metrics.totalCost.toFixed(4)}`)}`);
    console.log(`   Total Saved:       ${chalk.green(`$${metrics.totalSaved.toFixed(2)}`)}`);

    // Calculate daily savings
    const dailySavings = metrics.totalSaved / Math.max(1, Math.ceil(metrics.totalExecutions / 100));
    console.log(`   Est. Daily Saving: ${chalk.green(`$${dailySavings.toFixed(2)}`)}`);
    console.log(`   Est. Monthly:      ${chalk.green(`$${(dailySavings * 30).toFixed(2)}`)}`);

    console.log();
  }

  /**
   * Display strategy guide
   */
  displayStrategyGuide() {
    console.log(chalk.magenta.bold('🟢 EXECUTION STRATEGIES'));
    console.log(chalk.gray('─'.repeat(60)));

    const strategies = [
      {
        name: 'free-only',
        desc: 'Use ONLY free models (fails if exhausted)',
        when: 'Development, testing, non-critical tasks'
      },
      {
        name: 'free-first',
        desc: 'Prioritize free, fallback to paid',
        when: 'Default - best for most use cases'
      },
      {
        name: 'balanced',
        desc: 'Mix free/paid for optimal performance',
        when: 'Production workloads'
      },
      {
        name: 'quality-first',
        desc: 'Use best models regardless of cost',
        when: 'Critical tasks requiring highest quality'
      }
    ];

    strategies.forEach(strategy => {
      console.log(`\n   ${chalk.yellow(strategy.name)}`);
      console.log(chalk.gray(`   ${strategy.desc}`));
      console.log(chalk.gray(`   Use when: ${strategy.when}`));
    });

    console.log();
  }

  /**
   * Display real-time updates (if running)
   */
  async displayLive() {
    // Initial display
    await this.display();

    // Set up live updates
    setInterval(async () => {
      await this.display();
    }, 5000); // Update every 5 seconds

    console.log(chalk.gray('\nPress Ctrl+C to exit dashboard\n'));
  }

  /**
   * Format large numbers
   */
  formatNumber(num) {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }

  /**
   * Calculate percentage
   */
  calculatePercent(part, whole) {
    if (whole === 0) {return 0;}
    return Math.round((part / whole) * 100);
  }

  /**
   * Test execution with different strategies
   */
  async testStrategies() {
    console.log(chalk.cyan.bold('\n🟢 TESTING EXECUTION STRATEGIES\n'));

    // Sample tasks
    const testTasks = [
      { agent: 'architect', prompt: 'Design a caching system' },
      { agent: 'developer', prompt: 'Implement user authentication' },
      { agent: 'reviewer', prompt: 'Review code for security issues' },
      { agent: 'tester', prompt: 'Write unit tests' }
    ];

    // Test each strategy
    for (const strategy of ['free-only', 'free-first', 'balanced']) {
      console.log(chalk.yellow(`\nTesting ${strategy} strategy...`));

      try {
        const result = await this.orchestrator.execute(testTasks, strategy);

        if (result.success) {
          console.log(chalk.green('🏁 Success'));
          if (result.metadata) {
            console.log(`   Free tasks: ${result.metadata.freeTaskCount || 0}`);
            console.log(`   Paid tasks: ${result.metadata.paidTaskCount || 0}`);
            console.log(`   Cost: $${(result.metadata.totalCost || 0).toFixed(4)}`);
          }
        }
      } catch (error) {
        console.log(chalk.red(`🔴 Failed: ${error.message}`));
      }
    }
  }
}

// CLI execution
if (require.main === module) {
  const dashboard = new UsageDashboard();

  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'live') {
    // Live dashboard
    dashboard.displayLive().catch(console.error);
  } else if (command === 'test') {
    // Test strategies
    dashboard.testStrategies().catch(console.error);
  } else {
    // Single display
    dashboard.display().catch(console.error);
  }
}

module.exports = { UsageDashboard };
