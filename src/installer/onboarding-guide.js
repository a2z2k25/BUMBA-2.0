/**
 * BUMBA Post-Install Onboarding Guide
 * Interactive tutorial for new users
 */

const inquirer = require('inquirer');
const { colors, createBox } = require('./display');
const ora = require('ora');

/**
 * Onboarding flows for different user types
 */
const ONBOARDING_FLOWS = {
  beginner: {
    title: '🟢 Welcome to BUMBA - Beginner\'s Journey',
    steps: [
      {
        instruction: 'Let\'s start by exploring what BUMBA can do',
        command: '/bumba:menu',
        description: 'This opens an interactive menu showing all 58 commands',
        tip: '🟢 Use arrow keys to navigate, ENTER to select'
      },
      {
        title: 'Step 2: Get Help',
        instruction: 'Learn how to get help anytime',
        command: '/bumba:help',
        description: 'Context-aware help system',
        tip: '🟢 Add a command name for specific help: /bumba:help implement'
      },
      {
        title: 'Step 3: Your First Implementation',
        instruction: 'Try creating something simple',
        command: '/bumba:implement "create a hello world API"',
        description: 'BUMBA will auto-route to the best agent',
        tip: '🟢 Watch how BUMBA analyzes and implements your request'
      }
    ]
  },
  intermediate: {
    title: '🟢 BUMBA Power User Training',
    steps: [
      {
        instruction: 'Leverage the full agent team',
        command: '/bumba:implement-agents "user authentication system"',
        description: 'All 3 departments work in parallel',
        tip: '🟢 Product, Design, and Backend agents collaborate'
      },
      {
        title: 'Security Analysis',
        instruction: 'Run enterprise-grade security checks',
        command: '/bumba:analyze security',
        description: 'Comprehensive vulnerability scanning',
        tip: '🟢 Includes OWASP Top 10 and AI-specific checks'
      },
      {
        title: 'Parallel Orchestration',
        instruction: 'Execute complex tasks in parallel',
        command: '/bumba:orchestrate "database migration with API updates"',
        description: 'Wave-based execution for maximum speed',
        tip: '🟢 Tasks run concurrently where possible'
      }
    ]
  },
  expert: {
    title: '🟢 BUMBA Expert Mode',
    steps: [
      {
        instruction: 'Chain multiple operations',
        command: '/bumba:chain "analyze performance, optimize code, run tests"',
        description: 'Sequential workflow automation',
        tip: '🟢 Each step feeds into the next'
      },
      {
        title: 'Consciousness Mode',
        instruction: 'Enable Four Pillars validation',
        command: '/bumba:conscious-analyze',
        description: 'Deep wisdom-guided analysis',
        tip: '🟢 Applies Knowledge, Purpose, Reason, and Wisdom'
      },
      {
        title: 'Lite Mode',
        instruction: 'Resource-efficient execution',
        command: '/bumba:lite-implement "quick prototype"',
        description: 'Fast mode with minimal resource usage',
        tip: '🟢 Perfect for rapid iterations'
      }
    ]
  }
};

/**
 * Interactive onboarding walkthrough
 */
async function runOnboarding(experience = 'intermediate') {
  const flow = ONBOARDING_FLOWS[experience] || ONBOARDING_FLOWS.intermediate;
  
  console.log('\n' + createBox(
    colors.yellow.bold(flow.title) + '\n' +
    '\n' +
    colors.white('Let\'s get you productive with BUMBA!')
    , 55));

  console.log('\n' + colors.yellowGreen('This quick tutorial will show you the essentials.\n'));

  for (let i = 0; i < flow.steps.length; i++) {
    const step = flow.steps[i];
    
    console.log(colors.yellow.bold(`\n${step.title}`));
    console.log(colors.gray('━'.repeat(50)));
    console.log(colors.white(step.instruction));
    console.log('\n' + colors.green('Try this command:'));
    console.log(colors.yellow(`  ${step.command}`));
    console.log('\n' + colors.gray(step.description));
    console.log(colors.yellowGreen(step.tip));

    if (i < flow.steps.length - 1) {
      const { ready } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'ready',
          message: 'Ready for the next step?',
          default: true
        }
      ]);

      if (!ready) {
        console.log(colors.yellow('\nFeel free to practice! Resume anytime with /bumba:help'));
        break;
      }
    }
  }

  // Completion celebration
  console.log('\n' + createBox(
    colors.green.bold('🏁 Onboarding Complete!') + '\n' +
    '\n' +
    colors.white('You\'re ready to accelerate development') + '\n' +
    colors.white('with BUMBA\'s AI agent system!')
    , 50));

  // Show personalized next steps
  displayNextSteps(experience);
}

/**
 * Display personalized next steps
 */
function displayNextSteps(experience) {
  console.log('\n' + colors.yellow.bold('🟢 Your Personalized Next Steps:'));
  console.log(colors.gray('━'.repeat(50)));

  const nextSteps = {
    beginner: [
      { action: 'Explore design tools', cmd: '/bumba:design' },
      { action: 'Try the API builder', cmd: '/bumba:api' },
      { action: 'Create documentation', cmd: '/bumba:docs generate' }
    ],
    intermediate: [
      { action: 'Set up Notion integration', cmd: '/bumba:notion-setup' },
      { action: 'Configure GitHub workflows', cmd: '/bumba:github-setup' },
      { action: 'Optimize performance', cmd: '/bumba:improve-performance' }
    ],
    expert: [
      { action: 'Create custom workflows', cmd: '/bumba:workflow create' },
      { action: 'Configure executive mode', cmd: '/bumba:role executive' },
      { action: 'Set up monitoring', cmd: '/bumba:monitor' }
    ]
  };

  const steps = nextSteps[experience] || nextSteps.intermediate;
  steps.forEach((step, i) => {
    console.log(colors.white(`${i + 1}. ${step.action}`));
    console.log(colors.gray(`   Command: ${colors.green(step.cmd)}`));
  });
}

/**
 * Quick reference card
 */
function displayQuickReference() {
  console.log('\n' + colors.yellow.bold('🟢 Quick Reference Card'));
  console.log(colors.gray('━'.repeat(60)));

  const categories = [
    {
      name: '🟢 Core Commands',
      commands: [
        { cmd: '/bumba:implement', desc: 'Smart auto-routing' },
        { cmd: '/bumba:analyze', desc: 'Multi-dimensional analysis' },
        { cmd: '/bumba:test', desc: 'Automated testing' }
      ]
    },
    {
      name: '🟢 Collaboration',
      commands: [
        { cmd: '/bumba:implement-agents', desc: 'Full team collaboration' },
        { cmd: '/bumba:orchestrate', desc: 'Parallel execution' },
        { cmd: '/bumba:chain', desc: 'Sequential workflows' }
      ]
    },
    {
      name: '🟢 Configuration',
      commands: [
        { cmd: '/bumba:settings', desc: 'Framework config' },
        { cmd: '/bumba:notion-setup', desc: 'Notion integration' },
        { cmd: '/bumba:figma-setup', desc: 'Figma integration' }
      ]
    }
  ];

  categories.forEach(cat => {
    console.log('\n' + colors.yellowGreen(cat.name));
    cat.commands.forEach(cmd => {
      console.log(
        colors.green(cmd.cmd.padEnd(25)) +
        colors.gray(cmd.desc)
      );
    });
  });

  console.log('\n' + colors.gray('━'.repeat(60)));
  console.log(colors.yellow('🟢 Tip: ') + colors.white('Use /bumba:menu for interactive command browser'));
}

/**
 * Integration setup helper
 */
async function setupIntegrations() {
  console.log('\n' + colors.yellow.bold('🟢 Optional Integration Setup'));
  console.log(colors.gray('━'.repeat(50)));
  console.log(colors.white('Set up integrations to unlock more features:\n'));

  const integrations = [
    {
      name: '🟢 Notion',
      value: 'notion',
      description: 'Project management and documentation'
    },
    {
      name: '🟢 Figma',
      value: 'figma',
      description: 'Design-to-code workflows'
    },
    {
      name: '🟢 GitHub',
      value: 'github',
      description: 'Version control and PRs'
    },
    {
      name: '🟢 OpenRouter',
      value: 'openrouter',
      description: 'Multi-model AI access'
    }
  ];

  const { selected } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selected',
      message: 'Which integrations would you like to set up?',
      choices: integrations.map(int => ({
        name: `${int.name} - ${int.description}`,
        value: int.value
      }))
    }
  ]);

  if (selected.length > 0) {
    console.log('\n' + colors.yellowGreen('Setup commands for selected integrations:'));
    selected.forEach(int => {
      console.log(colors.green(`  /bumba:${int}-setup`));
    });
  } else {
    console.log(colors.gray('\nYou can set up integrations anytime using the setup commands.'));
  }
}

module.exports = {
  runOnboarding,
  displayQuickReference,
  displayNextSteps,
  setupIntegrations,
  ONBOARDING_FLOWS
};