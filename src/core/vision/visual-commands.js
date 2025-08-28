/**
 * BUMBA Visual Commands
 * Handles vision-based implementation commands
 */

const VisionAnalyzer = require('./vision-analyzer');
const fs = require('fs').promises;
const path = require('path');

class VisualCommands {
  constructor() {
    this.visionAnalyzer = new VisionAnalyzer();
  }

  /**
   * Implement UI from image
   * @param {string} imagePath Path to image file
   * @param {Object} options Implementation options
   * @returns {Promise<Object>} Implementation result
   */
  async implementFromImage(imagePath, options = {}) {
    console.log('🏁 Visual Implementation');
    console.log('━'.repeat(60));
    console.log();
    
    // Analyze the image
    console.log('🔍 Analyzing image...');
    const analysis = await this.visionAnalyzer.analyzeImage(imagePath);
    
    if (analysis.pending) {
      // Terminal mode - task prepared
      return {
        status: 'prepared',
        task: analysis,
        message: 'Vision task prepared for Claude execution'
      };
    }
    
    // Generate implementation plan
    console.log('📋 Creating implementation plan...');
    const plan = this.createPlan(analysis);
    
    // Execute implementation
    console.log('🚀 Implementing components...');
    const result = await this.implementVisual(plan, options);
    
    // Generate report
    const report = this.generateReport(analysis, plan, result);
    
    console.log();
    console.log('✅ Implementation complete!');
    console.log(`Files created: ${result.files.length}`);
    console.log(`Components: ${result.components.length}`);
    
    return {
      status: 'completed',
      analysis,
      plan,
      result,
      report
    };
  }

  /**
   * Create implementation plan
   * @param {Object} analysis Vision analysis
   * @returns {Object} Implementation plan
   */
  createPlan(analysis) {
    const plan = {
      framework: analysis.code?.framework || 'react',
      components: [],
      styling: {
        approach: 'css-modules',
        colors: analysis.colors,
        responsive: true
      },
      layout: {
        type: analysis.layout.type,
        breakpoints: analysis.layout.breakpoints
      },
      interactions: [],
      phases: []
    };
    
    // Plan component creation
    analysis.components.forEach(component => {
      plan.components.push({
        name: component.name,
        type: component.type,
        priority: this.getPriority(component),
        dependencies: this.getDependencies(component.type),
        implementation: {
          framework: plan.framework,
          props: this.getDefaultProps(component.type),
          state: this.getDefaultState(component.type)
        }
      });
    });
    
    // Plan interactions
    plan.interactions = this.planInteractions(analysis);
    
    // Define implementation phases
    plan.phases = [
      {
        name: 'Structure',
        tasks: ['Create component files', 'Set up folder structure'],
        duration: '15 min'
      },
      {
        name: 'Components',
        tasks: plan.components.map(c => `Implement ${c.name}`),
        duration: '45 min'
      },
      {
        name: 'Styling',
        tasks: ['Apply color scheme', 'Add responsive design', 'Polish UI'],
        duration: '30 min'
      },
      {
        name: 'Integration',
        tasks: ['Connect components', 'Add interactions', 'Test functionality'],
        duration: '30 min'
      }
    ];
    
    return plan;
  }

  /**
   * Execute visual implementation
   * @param {Object} plan Implementation plan
   * @param {Object} options Options
   * @returns {Promise<Object>} Implementation result
   */
  async implementVisual(plan, options = {}) {
    const result = {
      files: [],
      components: [],
      styles: [],
      tests: []
    };
    
    const outputDir = options.outputDir || path.join(process.cwd(), 'src', 'components', 'generated');
    
    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });
    
    // Implement each component
    for (const component of plan.components) {
      console.log(`  • Creating ${component.name}...`);
      
      const componentResult = await this.implementComponent(component, plan, outputDir);
      result.components.push(componentResult);
      result.files.push(...componentResult.files);
    }
    
    // Create layout file
    console.log('  • Creating layout...');
    const layoutFile = await this.createLayout(plan, result.components, outputDir);
    result.files.push(layoutFile);
    
    // Create styles
    console.log('  • Generating styles...');
    const styleFiles = await this.createStyles(plan, outputDir);
    result.styles.push(...styleFiles);
    result.files.push(...styleFiles);
    
    // Create tests if enabled
    if (options.generateTests) {
      console.log('  • Generating tests...');
      const testFiles = await this.createTests(result.components, outputDir);
      result.tests.push(...testFiles);
      result.files.push(...testFiles);
    }
    
    return result;
  }

  /**
   * Implement a single component
   * @param {Object} component Component specification
   * @param {Object} plan Full plan
   * @param {string} outputDir Output directory
   * @returns {Promise<Object>} Component result
   */
  async implementComponent(component, plan, outputDir) {
    const fileName = this.getComponentFileName(component.name, plan.framework);
    const filePath = path.join(outputDir, fileName);
    
    let code = '';
    
    if (plan.framework === 'react') {
      code = this.generateReactComponent(component);
    } else if (plan.framework === 'vue') {
      code = this.generateVueComponent(component);
    } else {
      code = this.generateVanillaComponent(component);
    }
    
    await fs.writeFile(filePath, code);
    
    return {
      name: component.name,
      type: component.type,
      files: [{
        path: filePath,
        type: 'component',
        framework: plan.framework
      }]
    };
  }

  /**
   * Generate React component code
   * @param {Object} component Component spec
   * @returns {string} React component code
   */
  generateReactComponent(component) {
    const name = this.capitalize(component.name);
    const props = component.implementation?.props || [];
    const state = component.implementation?.state || [];
    
    return `import React${state.length > 0 ? ', { useState }' : ''} from 'react';
import styles from './${component.name}.module.css';

const ${name} = ({ ${props.join(', ')} }) => {
${state.map(s => `  const [${s.name}, set${this.capitalize(s.name)}] = useState(${JSON.stringify(s.default)});`).join('\n')}

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        {/* ${name} Component */}
        {/* Type: ${component.type} */}
        {/* Auto-generated from vision analysis */}
        
        ${this.getComponentContent(component)}
      </div>
    </div>
  );
};

export default ${name};`;
  }

  /**
   * Generate Vue component code
   * @param {Object} component Component spec
   * @returns {string} Vue component code
   */
  generateVueComponent(component) {
    return `<template>
  <div :class="$style.container">
    <div :class="$style.inner">
      <!-- ${this.capitalize(component.name)} Component -->
      <!-- Type: ${component.type} -->
      ${this.getComponentContent(component)}
    </div>
  </div>
</template>

<script>
export default {
  name: '${this.capitalize(component.name)}',
  props: ${JSON.stringify(component.implementation?.props || [])},
  data() {
    return ${JSON.stringify(component.implementation?.state || {})};
  }
};
</script>

<style module>
.container {
  padding: 1rem;
}

.inner {
  background: white;
  border-radius: 0.5rem;
}
</style>`;
  }

  /**
   * Generate vanilla JS component
   * @param {Object} component Component spec
   * @returns {string} Vanilla JS code
   */
  generateVanillaComponent(component) {
    return `// ${this.capitalize(component.name)} Component
export class ${this.capitalize(component.name)} {
  constructor(props = {}) {
    this.props = props;
    this.state = ${JSON.stringify(component.implementation?.state || {})};
    this.element = null;
  }
  
  render() {
    const container = document.createElement('div');
    container.className = '${component.name}-container';
    
    container.innerHTML = \`
      <div class="${component.name}-inner">
        ${this.getComponentContent(component)}
      </div>
    \`;
    
    this.element = container;
    return container;
  }
  
  mount(target) {
    if (typeof target === 'string') {
      target = document.querySelector(target);
    }
    target.appendChild(this.render());
  }
}`;
  }

  /**
   * Get component content based on type
   * @param {Object} component Component spec
   * @returns {string} Component content
   */
  getComponentContent(component) {
    const contents = {
      header: '<h1>Site Title</h1>\n        <nav>Navigation Menu</nav>',
      navigation: '<ul>\n          <li>Home</li>\n          <li>About</li>\n          <li>Contact</li>\n        </ul>',
      content: '<h2>Content Area</h2>\n        <p>Main content goes here</p>',
      sidebar: '<h3>Sidebar</h3>\n        <ul>\n          <li>Link 1</li>\n          <li>Link 2</li>\n        </ul>',
      footer: '<p>&copy; 2024 Your Company</p>\n        <nav>Footer Links</nav>',
      hero: '<h1>Welcome</h1>\n        <p>Hero section content</p>\n        <button>Call to Action</button>',
      features: '<h2>Features</h2>\n        <div>Feature Grid</div>',
      cta: '<button>Get Started</button>'
    };
    
    return contents[component.name] || '<div>Component Content</div>';
  }

  /**
   * Create layout file
   * @param {Object} plan Implementation plan
   * @param {Array} components Created components
   * @param {string} outputDir Output directory
   * @returns {Promise<Object>} Layout file info
   */
  async createLayout(plan, components, outputDir) {
    const fileName = plan.framework === 'react' ? 'Layout.jsx' : 'Layout.js';
    const filePath = path.join(outputDir, fileName);
    
    let code = '';
    
    if (plan.framework === 'react') {
      const imports = components.map(c => 
        `import ${this.capitalize(c.name)} from './${this.getComponentFileName(c.name, 'react')}';`
      ).join('\n');
      
      const componentTags = components.map(c => 
        `      <${this.capitalize(c.name)} />`
      ).join('\n');
      
      code = `import React from 'react';
${imports}
import styles from './Layout.module.css';

const Layout = () => {
  return (
    <div className={styles.layout}>
${componentTags}
    </div>
  );
};

export default Layout;`;
    }
    
    await fs.writeFile(filePath, code);
    
    return {
      path: filePath,
      type: 'layout',
      framework: plan.framework
    };
  }

  /**
   * Create style files
   * @param {Object} plan Implementation plan
   * @param {string} outputDir Output directory
   * @returns {Promise<Array>} Style files
   */
  async createStyles(plan, outputDir) {
    const files = [];
    
    // Main layout styles
    const layoutStyles = `:root {
  --primary: ${plan.styling.colors.primary};
  --secondary: ${plan.styling.colors.secondary};
  --background: #ffffff;
  --text: #333333;
}

.layout {
  display: ${plan.layout.type === 'grid' ? 'grid' : 'flex'};
  ${plan.layout.type === 'grid' ? 'grid-template-areas:\n    "header header"\n    "sidebar content"\n    "footer footer";' : ''}
  gap: 1rem;
  min-height: 100vh;
  background: var(--background);
  color: var(--text);
}

@media (max-width: 768px) {
  .layout {
    ${plan.layout.type === 'grid' ? 'grid-template-areas:\n      "header"\n      "content"\n      "sidebar"\n      "footer";' : 'flex-direction: column;'}
  }
}`;
    
    const layoutStylePath = path.join(outputDir, 'Layout.module.css');
    await fs.writeFile(layoutStylePath, layoutStyles);
    files.push({ path: layoutStylePath, type: 'styles' });
    
    // Component styles
    for (const component of plan.components) {
      const componentStyles = `.container {
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.inner {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}`;
      
      const stylePath = path.join(outputDir, `${component.name}.module.css`);
      await fs.writeFile(stylePath, componentStyles);
      files.push({ path: stylePath, type: 'styles' });
    }
    
    return files;
  }

  /**
   * Create test files
   * @param {Array} components Components to test
   * @param {string} outputDir Output directory
   * @returns {Promise<Array>} Test files
   */
  async createTests(components, outputDir) {
    const files = [];
    const testDir = path.join(outputDir, '__tests__');
    await fs.mkdir(testDir, { recursive: true });
    
    for (const component of components) {
      const testCode = `import React from 'react';
import { render, screen } from '@testing-library/react';
import ${this.capitalize(component.name)} from '../${this.getComponentFileName(component.name, 'react')}';

describe('${this.capitalize(component.name)}', () => {
  it('renders without crashing', () => {
    render(<${this.capitalize(component.name)} />);
    expect(screen.getByRole('${component.type === 'navigation' ? 'navigation' : 'region'}')).toBeInTheDocument();
  });
  
  it('has correct structure', () => {
    const { container } = render(<${this.capitalize(component.name)} />);
    expect(container.firstChild).toHaveClass('container');
  });
});`;
      
      const testPath = path.join(testDir, `${component.name}.test.jsx`);
      await fs.writeFile(testPath, testCode);
      files.push({ path: testPath, type: 'test' });
    }
    
    return files;
  }

  /**
   * Compare implementation with image
   * @param {string} imagePath Path to reference image
   * @param {string} implementationPath Path to implementation
   * @returns {Promise<Object>} Comparison result
   */
  async compareImplementation(imagePath, implementationPath) {
    console.log('🏁 Visual Comparison');
    console.log('━'.repeat(60));
    console.log();
    
    // Analyze reference image
    const target = await this.visionAnalyzer.analyzeImage(imagePath);
    
    // Analyze current implementation
    // This would involve rendering and capturing the implementation
    const current = {
      components: [],
      layout: {},
      colors: {}
    };
    
    // Calculate match percentage
    const match = this.calculateMatch(target, current);
    
    // Find differences
    const differences = this.findDifferences(target, current);
    
    // Generate improvement suggestions
    const suggestions = this.generateSuggestions(target, current, differences);
    
    console.log(`Match Score: ${match}%`);
    console.log();
    
    if (differences.length > 0) {
      console.log('Differences Found:');
      differences.forEach(diff => console.log(`  • ${diff}`));
      console.log();
    }
    
    if (suggestions.length > 0) {
      console.log('Suggestions:');
      suggestions.forEach(sug => console.log(`  • ${sug}`));
    }
    
    return {
      match,
      differences,
      suggestions,
      target,
      current
    };
  }

  /**
   * Calculate match percentage
   * @param {Object} target Target analysis
   * @param {Object} current Current analysis
   * @returns {number} Match percentage
   */
  calculateMatch(target, current) {
    let score = 0;
    let total = 0;
    
    // Compare components
    if (target.components && current.components) {
      const targetComponents = new Set(target.components.map(c => c.name));
      const currentComponents = new Set(current.components.map(c => c.name));
      
      for (const comp of targetComponents) {
        total += 1;
        if (currentComponents.has(comp)) score += 1;
      }
    }
    
    // Compare layout
    if (target.layout?.type === current.layout?.type) {
      score += 5;
    }
    total += 5;
    
    // Compare colors
    if (target.colors?.primary === current.colors?.primary) {
      score += 3;
    }
    total += 3;
    
    return Math.round((score / total) * 100);
  }

  /**
   * Find differences between target and current
   * @param {Object} target Target analysis
   * @param {Object} current Current analysis
   * @returns {Array} List of differences
   */
  findDifferences(target, current) {
    const differences = [];
    
    // Component differences
    const targetComps = new Set(target.components?.map(c => c.name) || []);
    const currentComps = new Set(current.components?.map(c => c.name) || []);
    
    for (const comp of targetComps) {
      if (!currentComps.has(comp)) {
        differences.push(`Missing component: ${comp}`);
      }
    }
    
    for (const comp of currentComps) {
      if (!targetComps.has(comp)) {
        differences.push(`Extra component: ${comp}`);
      }
    }
    
    // Layout differences
    if (target.layout?.type !== current.layout?.type) {
      differences.push(`Layout mismatch: expected ${target.layout?.type}, got ${current.layout?.type}`);
    }
    
    // Color differences
    if (target.colors?.primary !== current.colors?.primary) {
      differences.push(`Color mismatch: primary color differs`);
    }
    
    return differences;
  }

  /**
   * Generate improvement suggestions
   * @param {Object} target Target analysis
   * @param {Object} current Current analysis
   * @param {Array} differences Found differences
   * @returns {Array} Suggestions
   */
  generateSuggestions(target, current, differences) {
    const suggestions = [];
    
    if (differences.some(d => d.includes('Missing component'))) {
      suggestions.push('Add missing components to match the reference');
    }
    
    if (differences.some(d => d.includes('Layout mismatch'))) {
      suggestions.push(`Change layout to ${target.layout?.type} to match reference`);
    }
    
    if (differences.some(d => d.includes('Color mismatch'))) {
      suggestions.push('Update color scheme to match reference image');
    }
    
    if (target.layout?.responsive && !current.layout?.responsive) {
      suggestions.push('Add responsive breakpoints for mobile/tablet views');
    }
    
    return suggestions;
  }

  /**
   * Generate implementation report
   * @param {Object} analysis Vision analysis
   * @param {Object} plan Implementation plan
   * @param {Object} result Implementation result
   * @returns {Object} Report
   */
  generateReport(analysis, plan, result) {
    return {
      summary: {
        imageAnalyzed: true,
        componentsDetected: analysis.components.length,
        componentsCreated: result.components.length,
        filesGenerated: result.files.length,
        framework: plan.framework,
        confidence: analysis.confidence
      },
      components: result.components.map(c => ({
        name: c.name,
        type: c.type,
        files: c.files.length,
        status: 'created'
      })),
      files: result.files.map(f => ({
        path: f.path,
        type: f.type,
        framework: f.framework
      })),
      nextSteps: [
        'Review generated components',
        'Customize styling and content',
        'Add business logic and state management',
        'Connect to backend APIs',
        'Test functionality',
        'Optimize for production'
      ]
    };
  }

  // Helper methods
  
  /**
   * Get component priority
   * @param {Object} component Component data
   * @returns {number} Priority (1-5)
   */
  getPriority(component) {
    const priorities = {
      header: 1,
      navigation: 1,
      hero: 2,
      content: 3,
      sidebar: 4,
      footer: 5
    };
    
    return priorities[component.name] || 3;
  }

  /**
   * Get component dependencies
   * @param {string} type Component type
   * @returns {Array} Dependencies
   */
  getDependencies(type) {
    const deps = {
      navigation: ['react-router-dom'],
      interactive: ['react-hook-form'],
      content: [],
      diagram: ['d3']
    };
    
    return deps[type] || [];
  }

  /**
   * Get default props for component type
   * @param {string} type Component type
   * @returns {Array} Default props
   */
  getDefaultProps(type) {
    const props = {
      navigation: ['items', 'activeItem', 'onItemClick'],
      content: ['title', 'content', 'className'],
      interactive: ['onSubmit', 'disabled']
    };
    
    return props[type] || [];
  }

  /**
   * Get default state for component type
   * @param {string} type Component type
   * @returns {Array} Default state
   */
  getDefaultState(type) {
    const state = {
      navigation: [{ name: 'activeIndex', default: 0 }],
      interactive: [{ name: 'loading', default: false }],
      content: []
    };
    
    return state[type] || [];
  }

  /**
   * Plan interactions based on analysis
   * @param {Object} analysis Vision analysis
   * @returns {Array} Planned interactions
   */
  planInteractions(analysis) {
    const interactions = [];
    
    analysis.components.forEach(component => {
      if (component.type === 'navigation') {
        interactions.push({
          component: component.name,
          type: 'click',
          action: 'navigate'
        });
      }
      
      if (component.type === 'interactive') {
        interactions.push({
          component: component.name,
          type: 'submit',
          action: 'form-submit'
        });
      }
    });
    
    return interactions;
  }

  /**
   * Get component file name
   * @param {string} name Component name
   * @param {string} framework Framework
   * @returns {string} File name
   */
  getComponentFileName(name, framework) {
    const extensions = {
      react: '.jsx',
      vue: '.vue',
      angular: '.component.ts',
      svelte: '.svelte'
    };
    
    const ext = extensions[framework] || '.js';
    return `${this.capitalize(name)}${ext}`;
  }

  /**
   * Capitalize string
   * @param {string} str String to capitalize
   * @returns {string} Capitalized string
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

module.exports = VisualCommands;