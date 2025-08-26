/**
 * BUMBA Interactive Installation Wizard
 * Progressive disclosure pattern for smooth onboarding
 */

const inquirer = require('inquirer');
const { colors } = require('./display');

/**
 * Installation profiles for different user types
 */
const INSTALLATION_PROFILES = {
  quick: {
    name: '🟢 Quick Start',
    description: 'Recommended setup with smart defaults',
    features: ['core', 'commands', 'agents', 'quality']
  },
  custom: {
    name: '🟢  Custom',
    description: 'Choose exactly what you need',
    features: []
  },
  full: {
    name: '🟢 Full Installation',
    description: 'Everything including all integrations',
    features: ['core', 'commands', 'agents', 'quality', 'mcp', 'notion', 'figma', 'github']
  }
};

/**
 * Feature descriptions for clear understanding
 */
const FEATURES = {
  core: {
    name: '🟢 Core Framework',
    description: 'BUMBA command system and routing',
    required: true
  },
  commands: {
    name: '🟢 58 Commands',
    description: 'Full command suite for development',
    required: true
  },
  agents: {
    name: '🟢 Multi-Agent System',
    description: '3 departments, 33 specialists',
    required: true
  },
  quality: {
    name: '🏁 Quality Gates',
    description: 'Automated testing and validation',
    default: true
  },
  mcp: {
    name: '🟢 MCP Servers',
    description: '25+ integration servers',
    default: false
  },
  notion: {
    name: '🟢 Notion Integration',
    description: 'Project management sync',
    default: false
  },
  figma: {
    name: '🟢 Figma Integration',
    description: 'Design-to-code workflows',
    default: false
  },
  github: {
    name: '🟢 GitHub Integration',
    description: 'PR creation and management',
    default: false
  }
};

/**
 * Run the interactive installation wizard
 */
async function runWizard() {
  console.log('\n' + colors.yellow.bold('🟢 Welcome to BUMBA Interactive Setup'));
  console.log(colors.gray('Let\'s customize your installation\n'));

  // Step 1: Installation profile
  const { profile } = await inquirer.prompt([
    {
      type: 'list',
      name: 'profile',
      message: 'Choose your installation profile:',
      choices: Object.entries(INSTALLATION_PROFILES).map(([key, prof]) => ({
        name: `${prof.name} - ${prof.description}`,
        value: key
      })),
      default: 'quick'
    }
  ]);

  let selectedFeatures = INSTALLATION_PROFILES[profile].features;

  // Step 2: Custom feature selection (progressive disclosure)
  if (profile === 'custom') {
    const { features } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select features to install:',
        choices: Object.entries(FEATURES)
          .filter(([key, feat]) => !feat.required)
          .map(([key, feat]) => ({
            name: `${feat.name} - ${feat.description}`,
            value: key,
            checked: feat.default
          })),
        pageSize: 10
      }
    ]);
    
    // Add required features
    selectedFeatures = ['core', 'commands', 'agents', ...features];
  }

  // Step 3: Environment detection
  const { environment } = await inquirer.prompt([
    {
      type: 'list',
      name: 'environment',
      message: 'What\'s your primary development environment?',
      choices: [
        { name: '🟢 VS Code', value: 'vscode' },
        { name: '🟢️  Terminal/CLI', value: 'terminal' },
        { name: '🟢️  Cloud IDE', value: 'cloud' },
        { name: '🟢 Other/Mixed', value: 'other' }
      ],
      default: 'vscode'
    }
  ]);

  // Step 4: Experience level (for tailored onboarding)
  const { experience } = await inquirer.prompt([
    {
      type: 'list',
      name: 'experience',
      message: 'How familiar are you with AI development tools?',
      choices: [
        { name: '🟢 New to AI tools', value: 'beginner' },
        { name: '🟢 Some experience', value: 'intermediate' },
        { name: '🟢 Expert user', value: 'expert' }
      ],
      default: 'intermediate'
    }
  ]);

  // Step 5: Optional integrations setup
  let integrationSettings = {};
  
  if (selectedFeatures.includes('notion')) {
    const { setupNotion } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'setupNotion',
        message: 'Would you like to configure Notion integration now?',
        default: false
      }
    ]);

    if (setupNotion) {
      const { notionKey } = await inquirer.prompt([
        {
          type: 'password',
          name: 'notionKey',
          message: 'Enter your Notion API key (or skip for later):',
          mask: '*'
        }
      ]);
      if (notionKey) {
        integrationSettings.notion = notionKey;
      }
    }
  }

  // Confirmation
  console.log('\n' + colors.yellowGreen.bold('🟢 Installation Summary:'));
  console.log(colors.white('━'.repeat(50)));
  
  console.log(colors.white('Profile:'), colors.yellow(INSTALLATION_PROFILES[profile].name));
  console.log(colors.white('Environment:'), colors.yellow(environment));
  console.log(colors.white('Experience:'), colors.yellow(experience));
  
  console.log(colors.white('\nFeatures to install:'));
  selectedFeatures.forEach(feat => {
    const feature = FEATURES[feat];
    if (feature) {
      console.log(colors.green('  🏁'), colors.white(feature.name));
    }
  });

  console.log(colors.white('━'.repeat(50)));

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Ready to install BUMBA with these settings?',
      default: true
    }
  ]);

  if (!confirm) {
    console.log(colors.yellow('\n🟢 Installation cancelled'));
    return null;
  }

  return {
    profile,
    features: selectedFeatures,
    environment,
    experience,
    integrations: integrationSettings
  };
}

/**
 * Get quick start recommendations based on experience
 */
function getQuickStartGuide(experience) {
  const guides = {
    beginner: [
      { cmd: '/bumba:menu', desc: 'Explore all available commands' },
      { cmd: '/bumba:help', desc: 'Get contextual help' },
      { cmd: '/bumba:implement "hello world API"', desc: 'Try your first implementation' }
    ],
    intermediate: [
      { cmd: '/bumba:implement-agents "user auth system"', desc: 'Multi-agent collaboration' },
      { cmd: '/bumba:analyze security', desc: 'Run security analysis' },
      { cmd: '/bumba:orchestrate "database migration"', desc: 'Parallel task execution' }
    ],
    expert: [
      { cmd: '/bumba:chain "analyze, optimize, test"', desc: 'Command chaining' },
      { cmd: '/bumba:conscious-analyze', desc: 'Four Pillars validation' },
      { cmd: '/bumba:lite-implement', desc: 'Resource-efficient mode' }
    ]
  };

  return guides[experience] || guides.intermediate;
}

module.exports = {
  runWizard,
  getQuickStartGuide,
  INSTALLATION_PROFILES,
  FEATURES
};