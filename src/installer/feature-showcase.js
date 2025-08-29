/**
 * BUMBA Feature Showcase Module
 * Displays framework capabilities and benefits
 */

const { colors, createBox } = require('./display');
const Table = require('cli-table3');

/**
 * Display the feature showcase banner
 */
function displayFeatureShowcase() {
  console.log('\n\n'); // Add extra padding
  console.log('🏁 BUMBA CLI Capabilities 🏁');
  console.log(colors.gray('━'.repeat(60)));

  // Core capabilities with brand-approved emojis only
  const capabilities = [
    {
      category: '🟢 Multi-Agent Intelligence',
      features: [
        '3 Department Managers (Product, Design, Backend)',
        '33 Specialized Agents with domain expertise',
        'Parallel execution for 3-5x faster development',
        'Smart task routing to best-fit specialists'
      ]
    },
    {
      category: '🟡 58 Intelligent Commands',
      features: [
        'Auto-routing with /bumba:implement',
        'Department-specific commands for precision',
        'Chain commands for complex workflows',
        'Consciousness-driven development mode'
      ]
    },
    {
      category: '🔴 25+ Integrations',
      features: [
        'MCP server ecosystem',
        'Notion for project management',
        'Figma for design-to-code',
        'GitHub for version control'
      ]
    },
    {
      category: '🟠 Enterprise Quality',
      features: [
        'Pre/post execution quality gates',
        'Security scanning and validation',
        'Performance monitoring (<1s response)',
        '98% test coverage standards'
      ]
    }
  ];

  capabilities.forEach(cap => {
    console.log('\n' + cap.category); // No bold coloring, let emoji provide the color context
    cap.features.forEach(feat => {
      console.log('  • ' + feat); // Simple bullet point, no color
    });
  });

  console.log('\n' + colors.gray('━'.repeat(60)) + '\n'); // Add padding after
}

/**
 * Display comparison table showing BUMBA advantages
 */
function displayComparisonTable() {
  console.log('\n'); // Add padding
  
  const table = new Table({
    head: [
      'Feature',
      colors.gray('Without BUMBA'),
      'With BUMBA'
    ],
    style: {
      head: [],
      border: []
    },
    colWidths: [25, 25, 25],
    wordWrap: true
  });

  const comparisons = [
    [
      'Development Speed',
      'Sequential tasks',
      '🟢 3-5x faster parallel'
    ],
    [
      'Code Quality',
      'Manual review',
      '🏁 Automated gates'
    ],
    [
      'AI Coordination',
      'Single context',
      '🟢 Multi-agent swarm'
    ],
    [
      'Designer Tools',
      'Basic support',
      '🔴 Figma integration'
    ],
    [
      'Project Management',
      'Manual tracking',
      '🟡 Notion sync'
    ]
  ];

  comparisons.forEach(row => {
    table.push(row.map((cell, i) => 
      i === 1 ? colors.gray(cell) : cell // Only gray for 'Without BUMBA' column
    ));
  });

  console.log('\n' + '🏁 Why Choose BUMBA?');
  console.log(table.toString());
}

/**
 * Display capability detection results
 */
function displayCapabilityDetection(analysis) {
  console.log('\n\n'); // Add extra padding
  console.log('🟡 System Capability Detection');
  console.log(colors.gray('━'.repeat(60)));
  console.log(); // Add space after header

  const capabilities = [
    {
      name: 'Node.js Runtime',
      status: process.version ? '🏁 READY' : '🟠 SETUP REQUIRED',
      detail: process.version || 'Node.js 14+ required'
    },
    {
      name: 'Claude Code',
      status: analysis.hasClaudeDir ? '🏁 READY' : '🟠 SETUP REQUIRED',
      detail: analysis.hasClaudeDir ? 'Installation detected' : 'Visit claude.ai/code'
    },
    {
      name: 'Git Version Control',
      status: '🏁 READY',
      detail: 'Repository management enabled'
    },
    {
      name: 'VS Code Integration',
      status: process.env.VSCODE_CLI ? '🏁 READY' : '🟡 OPTIONAL',
      detail: 'Enhanced IDE features available'
    }
  ];

  capabilities.forEach(cap => {
    console.log(
      cap.status.padEnd(20) +
      cap.name.padEnd(25) +
      colors.gray(cap.detail) // Only gray for details
    );
  });

  // Integration opportunities (never show as failures)
  console.log('\n\n'); // Add extra spacing
  console.log('🟢 Integration Opportunities:');
  console.log(); // Add space after header
  
  const integrations = [
    { name: 'Notion API', status: '🟡 SETUP AVAILABLE', guide: '/bumba:notion-setup' },
    { name: 'Figma Dev Mode', status: '🔴 SETUP AVAILABLE', guide: '/bumba:figma-setup' },
    { name: 'GitHub Token', status: '🟢 SETUP AVAILABLE', guide: '/bumba:github-setup' },
    { name: 'OpenRouter', status: '🟠 SETUP AVAILABLE', guide: '/bumba:openrouter-setup' }
  ];

  integrations.forEach(int => {
    console.log(
      int.status.padEnd(20) +
      int.name.padEnd(25) +
      colors.gray('Guide: ' + int.guide) // Only gray for guide text
    );
  });

  console.log('\n' + colors.gray('All integrations are optional. Setup when needed.'));
}

/**
 * Display success metrics
 */
function displaySuccessMetrics() {
  const metricsBox = createBox(
    '🏁 BUMBA Success Metrics' + '\n' +
    '\n' +
    '• 3-5x faster development cycles' + '\n' +
    '• 98% code quality standards' + '\n' +
    '• <1s average response time' + '\n' +
    '• 33 specialized AI agents' + '\n' +
    '• 25+ integration servers' + '\n' +
    '• Zero-config quick start'
    , 50);

  console.log('\n' + metricsBox);
}

/**
 * Display testimonial-style benefits
 */
function displayBenefits() {
  console.log('\n\n'); // Add extra padding
  console.log('🏁 What BUMBA Enables:');
  console.log(colors.gray('━'.repeat(60)));
  console.log(); // Add space after header

  const benefits = [
    { icon: '🟢', text: 'Ship features 3-5x faster with parallel agents' },
    { icon: '🟠', text: 'Enterprise-grade security built into every command' },
    { icon: '🔴', text: 'Designer-first workflows with Figma integration' },
    { icon: '🟡', text: 'Real-time project tracking with Notion sync' },
    { icon: '🟢', text: 'AI swarm intelligence for complex problems' },
    { icon: '🏁', text: 'Automated quality gates catch issues early' }
  ];

  benefits.forEach(benefit => {
    console.log(`  ${benefit.icon}  ${benefit.text}`); // No white coloring needed
  });

  console.log('\n' + colors.gray('━'.repeat(60)) + '\n'); // Add padding after
}

module.exports = {
  displayFeatureShowcase,
  displayComparisonTable,
  displayCapabilityDetection,
  displaySuccessMetrics,
  displayBenefits
};