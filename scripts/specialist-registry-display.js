#!/usr/bin/env node

/**
 * BUMBA Specialist Registry Display
 * Shows all specialists with department colors and branding
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// Department configurations with brand colors
const departments = {
  strategic: {
    color: chalk.yellow,
    emoji: '🟡',
    manager: 'Product-Strategist',
    description: 'Strategy, Planning & Business Analysis'
  },
  technical: {
    color: chalk.green,
    emoji: '🟢',
    manager: 'Backend-Engineer',
    description: 'Backend, APIs & Infrastructure'
  },
  experience: {
    color: chalk.red,
    emoji: '🔴',
    manager: 'Design-Engineer',
    description: 'UI/UX, Frontend & User Experience'
  }
};

// Specialist mappings (from specialist-spawner.js)
const specialistRegistry = {
  strategic: [
    { name: 'market-research-specialist', capabilities: ['market analysis', 'competitor research', 'trend analysis'] },
    { name: 'product-owner', capabilities: ['roadmap', 'user stories', 'prioritization'] },
    { name: 'business-analyst', capabilities: ['requirements', 'process analysis', 'documentation'] },
    { name: 'technical-writer', capabilities: ['documentation', 'api docs', 'user guides'] },
    { name: 'project-manager', capabilities: ['timeline', 'sprint planning', 'resource allocation'] },
    { name: 'stakeholder-comms', capabilities: ['communication', 'presentations', 'stakeholder management'] },
    { name: 'competitive-analysis', capabilities: ['competitor analysis', 'benchmarking', 'market positioning'] },
    { name: 'business-model', capabilities: ['revenue modeling', 'monetization', 'pricing strategy'] },
    { name: 'roi-analysis', capabilities: ['cost-benefit', 'investment analysis', 'financial planning'] }
  ],
  technical: [
    { name: 'security-specialist', capabilities: ['security audit', 'vulnerability assessment', 'encryption'] },
    { name: 'database-specialist', capabilities: ['sql', 'optimization', 'schema design'] },
    { name: 'devops-engineer', capabilities: ['ci/cd', 'docker', 'kubernetes'] },
    { name: 'backend-developer', capabilities: ['api design', 'microservices', 'backend logic'] },
    { name: 'api-specialist', capabilities: ['rest', 'graphql', 'api optimization'] },
    { name: 'javascript-specialist', capabilities: ['node.js', 'typescript', 'react'] },
    { name: 'python-specialist', capabilities: ['django', 'flask', 'fastapi'] },
    { name: 'golang-specialist', capabilities: ['go modules', 'concurrency', 'microservices'] },
    { name: 'rust-specialist', capabilities: ['memory safety', 'performance', 'systems programming'] }
  ],
  experience: [
    { name: 'ux-research-specialist', capabilities: ['user research', 'usability testing', 'personas'] },
    { name: 'ui-designer', capabilities: ['visual design', 'mockups', 'prototypes'] },
    { name: 'frontend-specialist', capabilities: ['react', 'vue', 'component development'] },
    { name: 'accessibility-specialist', capabilities: ['a11y', 'wcag', 'audit'] },
    { name: 'react-specialist', capabilities: ['react', 'hooks', 'state management'] },
    { name: 'vue-specialist', capabilities: ['vue.js', 'vuex', 'composition api'] },
    { name: 'css-specialist', capabilities: ['css', 'animations', 'responsive design'] },
    { name: 'figma-specialist', capabilities: ['figma', 'design systems', 'prototyping'] }
  ]
};

function displayHeader() {
  console.log('\n' + chalk.white('═'.repeat(80)));
  console.log(chalk.bold.white('                    🟡 BUMBA SPECIALIST REGISTRY 🟡'));
  console.log(chalk.white('═'.repeat(80)));
  console.log(chalk.gray('Brand-compliant specialist directory with department mapping'));
  console.log(chalk.white('═'.repeat(80)) + '\n');
}

function displayDepartment(deptKey, deptConfig, specialists) {
  const { color, emoji, manager, description } = deptConfig;
  
  // Department header
  console.log(color('━'.repeat(80)));
  console.log(color(`${emoji} ${deptKey.toUpperCase()} DEPARTMENT`));
  console.log(color(`Manager: ${manager} | ${description}`));
  console.log(color('━'.repeat(80)));
  
  // Display specialists
  specialists.forEach((specialist, index) => {
    const num = String(index + 1).padStart(2, '0');
    console.log(color(`  ${num}. ${specialist.name}`));
    console.log(chalk.gray(`      Capabilities: ${specialist.capabilities.join(', ')}`));
  });
  
  console.log(color(`  Total: ${specialists.length} specialists\n`));
}

function displaySummary() {
  const totalSpecialists = 
    specialistRegistry.strategic.length + 
    specialistRegistry.technical.length + 
    specialistRegistry.experience.length;

  console.log(chalk.white('═'.repeat(80)));
  console.log(chalk.bold.white('SUMMARY'));
  console.log(chalk.white('═'.repeat(80)));
  
  console.log(chalk.yellow(`🟡 Strategic Department: ${specialistRegistry.strategic.length} specialists`));
  console.log(chalk.green(`🟢 Technical Department: ${specialistRegistry.technical.length} specialists`));
  console.log(chalk.red(`🔴 Experience Department: ${specialistRegistry.experience.length} specialists`));
  console.log(chalk.white('─'.repeat(80)));
  console.log(chalk.bold.white(`Total Specialists: ${totalSpecialists}`));
  console.log(chalk.white('═'.repeat(80)));
}

function displayBrandCompliance() {
  console.log('\n' + chalk.white('═'.repeat(80)));
  console.log(chalk.bold.white('BRAND COMPLIANCE'));
  console.log(chalk.white('═'.repeat(80)));
  
  console.log(chalk.white('Approved Emojis:'));
  console.log(chalk.yellow('  🟡 Strategic/Product (Yellow)'));
  console.log(chalk.green('  🟢 Technical/Backend (Green)'));
  console.log(chalk.red('  🔴 Experience/Design (Red)'));
  console.log(chalk.rgb(255, 165, 0)('  🟠 Testing/QA (Orange)'));
  console.log(chalk.white('  🏁 Completion/Success (Checkered Flag)'));
  
  console.log(chalk.white('\nColor Assignments:'));
  console.log(chalk.yellow('  Yellow (#FFD700): Strategic planning & product management'));
  console.log(chalk.green('  Green (#00FF00): Backend development & technical infrastructure'));
  console.log(chalk.red('  Red (#FF0000): Frontend design & user experience'));
  console.log(chalk.rgb(255, 165, 0)('  Orange (#FFA500): Testing & quality assurance'));
  
  console.log(chalk.white('\nUsage Guidelines:'));
  console.log(chalk.gray('  • Use department colors for all spawn messages'));
  console.log(chalk.gray('  • Apply emojis consistently across all outputs'));
  console.log(chalk.gray('  • Maintain color-emoji pairing at all times'));
  console.log(chalk.gray('  • Use white for primary text, gray for accents'));
  
  console.log(chalk.white('═'.repeat(80)));
}

function generateMarkdownReport() {
  let markdown = '# BUMBA Specialist Registry\n\n';
  markdown += '## Overview\n';
  markdown += 'Complete registry of all BUMBA Framework specialists organized by department.\n\n';
  
  markdown += '## Departments\n\n';
  
  // Strategic Department
  markdown += '### 🟡 Strategic Department\n';
  markdown += '**Manager:** Product-Strategist\n';
  markdown += '**Focus:** Strategy, Planning & Business Analysis\n\n';
  markdown += '| Specialist | Capabilities |\n';
  markdown += '|------------|-------------|\n';
  specialistRegistry.strategic.forEach(s => {
    markdown += `| ${s.name} | ${s.capabilities.join(', ')} |\n`;
  });
  markdown += '\n';
  
  // Technical Department
  markdown += '### 🟢 Technical Department\n';
  markdown += '**Manager:** Backend-Engineer\n';
  markdown += '**Focus:** Backend, APIs & Infrastructure\n\n';
  markdown += '| Specialist | Capabilities |\n';
  markdown += '|------------|-------------|\n';
  specialistRegistry.technical.forEach(s => {
    markdown += `| ${s.name} | ${s.capabilities.join(', ')} |\n`;
  });
  markdown += '\n';
  
  // Experience Department
  markdown += '### 🔴 Experience Department\n';
  markdown += '**Manager:** Design-Engineer\n';
  markdown += '**Focus:** UI/UX, Frontend & User Experience\n\n';
  markdown += '| Specialist | Capabilities |\n';
  markdown += '|------------|-------------|\n';
  specialistRegistry.experience.forEach(s => {
    markdown += `| ${s.name} | ${s.capabilities.join(', ')} |\n`;
  });
  markdown += '\n';
  
  // Summary
  const total = specialistRegistry.strategic.length + 
                specialistRegistry.technical.length + 
                specialistRegistry.experience.length;
  
  markdown += '## Summary\n\n';
  markdown += `- **Total Specialists:** ${total}\n`;
  markdown += `- **Strategic:** ${specialistRegistry.strategic.length}\n`;
  markdown += `- **Technical:** ${specialistRegistry.technical.length}\n`;
  markdown += `- **Experience:** ${specialistRegistry.experience.length}\n\n`;
  
  markdown += '## Brand Guidelines\n\n';
  markdown += '### Approved Emojis\n';
  markdown += '- 🟡 Strategic/Product\n';
  markdown += '- 🟢 Technical/Backend\n';
  markdown += '- 🔴 Experience/Design\n';
  markdown += '- 🟠 Testing/QA\n';
  markdown += '- 🏁 Completion/Success\n\n';
  
  markdown += '### Color Codes\n';
  markdown += '- Yellow: #FFD700\n';
  markdown += '- Green: #00FF00\n';
  markdown += '- Red: #FF0000\n';
  markdown += '- Orange: #FFA500\n';
  
  return markdown;
}

// Main execution
function main() {
  displayHeader();
  
  // Display each department
  displayDepartment('strategic', departments.strategic, specialistRegistry.strategic);
  displayDepartment('technical', departments.technical, specialistRegistry.technical);
  displayDepartment('experience', departments.experience, specialistRegistry.experience);
  
  displaySummary();
  displayBrandCompliance();
  
  // Generate markdown report
  const reportPath = path.join(__dirname, '../docs/SPECIALIST_REGISTRY.md');
  const markdown = generateMarkdownReport();
  
  // Create docs directory if it doesn't exist
  const docsDir = path.dirname(reportPath);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, markdown);
  console.log(chalk.green(`\n🏁 Markdown report saved to: ${reportPath}\n`));
}

// Run the display
main();