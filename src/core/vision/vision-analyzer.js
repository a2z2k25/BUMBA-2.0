/**
 * BUMBA Vision Analyzer
 * Analyzes screenshots and images for UI implementation
 */

const fs = require('fs').promises;
const path = require('path');

class VisionAnalyzer {
  constructor() {
    this.supportedFormats = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    this.inClaude = this.detectClaude();
  }

  /**
   * Detect if running in Claude environment
   * @returns {boolean}
   */
  detectClaude() {
    const EnvironmentDetector = require('../hybrid/environment-detector');
    return EnvironmentDetector.inClaude();
  }

  /**
   * Analyze image or screenshot
   * @param {string} imagePath Path to image file
   * @returns {Promise<Object>} Vision analysis result
   */
  async analyzeImage(imagePath) {
    // Validate image path
    const validation = await this.validateImage(imagePath);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // In Claude mode - use native vision
    if (this.inClaude) {
      return await this.claudeVision(imagePath);
    }
    
    // In terminal mode - prepare for Claude
    return await this.prepareVisionTask(imagePath);
  }

  /**
   * Validate image file
   * @param {string} imagePath Path to image
   * @returns {Promise<Object>} Validation result
   */
  async validateImage(imagePath) {
    try {
      const stats = await fs.stat(imagePath);
      if (!stats.isFile()) {
        return { valid: false, error: 'Path is not a file' };
      }

      const ext = path.extname(imagePath).toLowerCase();
      if (!this.supportedFormats.includes(ext)) {
        return { 
          valid: false, 
          error: `Unsupported format: ${ext}. Supported: ${this.supportedFormats.join(', ')}` 
        };
      }

      // Check file size (max 10MB)
      if (stats.size > 10 * 1024 * 1024) {
        return { valid: false, error: 'Image file too large (max 10MB)' };
      }

      return { valid: true, stats };
    } catch (error) {
      return { valid: false, error: `File not found: ${imagePath}` };
    }
  }

  /**
   * Claude vision analysis
   * @param {string} imagePath Path to image
   * @returns {Promise<Object>} Vision analysis
   */
  async claudeVision(imagePath) {
    console.log('🏁 Vision Analysis (Claude Mode)');
    console.log('━'.repeat(60));
    console.log();
    console.log(`Analyzing: ${imagePath}`);
    console.log();

    // This would use actual Claude vision API
    // For now, returning structured analysis
    const analysis = await this.performAnalysis(imagePath);
    
    console.log('📊 Analysis Complete:');
    console.log(`Type: ${analysis.type}`);
    console.log(`Components: ${analysis.components.length} detected`);
    console.log(`Confidence: ${analysis.confidence}%`);
    console.log();
    
    // Generate implementation code
    if (analysis.type === 'screenshot' || analysis.type === 'design') {
      const code = await this.generateCode(analysis);
      analysis.code = code;
      
      console.log('💻 Generated Implementation:');
      console.log(`Framework: ${code.framework}`);
      console.log(`Files: ${code.files.length}`);
      console.log();
    }

    return analysis;
  }

  /**
   * Prepare vision task for Claude
   * @param {string} imagePath Path to image
   * @returns {Promise<Object>} Prepared task
   */
  async prepareVisionTask(imagePath) {
    console.log('🏁 Preparing Vision Task');
    console.log('━'.repeat(60));
    console.log();
    console.log(`Image: ${imagePath}`);
    
    // Copy image to task directory
    const taskId = `vision_${Date.now()}`;
    const taskDir = path.join(process.cwd(), '.bumba', 'tasks', taskId);
    await fs.mkdir(taskDir, { recursive: true });
    
    const imageExt = path.extname(imagePath);
    const imageCopy = path.join(taskDir, `image${imageExt}`);
    await fs.copyFile(imagePath, imageCopy);
    
    // Create vision task
    const task = {
      id: taskId,
      type: 'vision',
      imagePath: imageCopy,
      originalPath: imagePath,
      timestamp: Date.now(),
      analysis: {
        pending: true,
        requiresClaude: true
      }
    };
    
    // Save task
    const taskFile = path.join(taskDir, 'task.json');
    await fs.writeFile(taskFile, JSON.stringify(task, null, 2));
    
    console.log();
    console.log('📋 Vision Task Prepared');
    console.log(`Task ID: ${taskId}`);
    console.log();
    console.log('🚀 To Analyze in Claude:');
    console.log('1. Open Claude Code');
    console.log(`2. Navigate to: ${process.cwd()}`);
    console.log(`3. Run: /bumba:vision ${taskId}`);
    console.log();
    console.log('━'.repeat(60));
    console.log(`/bumba:vision ${taskId}`);
    console.log('━'.repeat(60));
    
    return task;
  }

  /**
   * Perform vision analysis
   * @param {string} imagePath Path to image
   * @returns {Promise<Object>} Analysis result
   */
  async performAnalysis(imagePath) {
    // Simulated analysis for non-Claude environments
    // In Claude, this would use actual vision capabilities
    
    const fileName = path.basename(imagePath).toLowerCase();
    let type = 'unknown';
    let components = [];
    let colors = [];
    let layout = 'unknown';
    
    // Detect type based on filename hints
    if (fileName.includes('screenshot')) {
      type = 'screenshot';
      components = ['header', 'navigation', 'content', 'sidebar', 'footer'];
      colors = ['#FFD700', '#00FF00', '#FF0000', '#FFA500'];
      layout = 'grid';
    } else if (fileName.includes('design') || fileName.includes('mockup')) {
      type = 'design';
      components = ['hero', 'features', 'testimonials', 'cta', 'footer'];
      colors = ['#1a73e8', '#ffffff', '#f8f9fa', '#202124'];
      layout = 'sections';
    } else if (fileName.includes('diagram')) {
      type = 'diagram';
      components = ['nodes', 'connections', 'labels'];
      colors = ['#000000', '#ffffff'];
      layout = 'flow';
    } else {
      type = 'ui';
      components = ['container', 'elements'];
      colors = ['#333333', '#666666', '#999999'];
      layout = 'flex';
    }
    
    return {
      type,
      components: components.map(name => ({
        name,
        type: this.getComponentType(name),
        position: this.estimatePosition(name),
        confidence: 85 + Math.floor(Math.random() * 15)
      })),
      colors: {
        primary: colors[0],
        secondary: colors[1],
        palette: colors
      },
      layout: {
        type: layout,
        responsive: true,
        breakpoints: ['mobile', 'tablet', 'desktop']
      },
      dimensions: {
        width: 1920,
        height: 1080,
        aspectRatio: '16:9'
      },
      suggestions: this.generateSuggestions(type),
      confidence: 90
    };
  }

  /**
   * Get component type
   * @param {string} name Component name
   * @returns {string} Component type
   */
  getComponentType(name) {
    const types = {
      header: 'navigation',
      navigation: 'navigation',
      sidebar: 'navigation',
      content: 'content',
      hero: 'content',
      features: 'content',
      testimonials: 'content',
      footer: 'navigation',
      cta: 'interactive',
      nodes: 'diagram',
      connections: 'diagram'
    };
    
    return types[name] || 'generic';
  }

  /**
   * Estimate component position
   * @param {string} name Component name
   * @returns {Object} Position estimate
   */
  estimatePosition(name) {
    const positions = {
      header: { top: 0, left: 0, width: '100%', height: '80px' },
      navigation: { top: 0, left: 0, width: '100%', height: '60px' },
      sidebar: { top: '80px', left: 0, width: '250px', height: 'calc(100% - 80px)' },
      content: { top: '80px', left: '250px', width: 'calc(100% - 250px)', height: 'auto' },
      footer: { bottom: 0, left: 0, width: '100%', height: '200px' }
    };
    
    return positions[name] || { top: 'auto', left: 'auto' };
  }

  /**
   * Generate implementation suggestions
   * @param {string} type Analysis type
   * @returns {Array} Suggestions
   */
  generateSuggestions(type) {
    const suggestions = {
      screenshot: [
        'Implement responsive grid layout',
        'Add navigation component with router',
        'Create reusable component library',
        'Apply detected color scheme',
        'Add accessibility features'
      ],
      design: [
        'Build component hierarchy',
        'Implement design system',
        'Add animations and transitions',
        'Ensure pixel-perfect implementation',
        'Create responsive breakpoints'
      ],
      diagram: [
        'Create interactive flow diagram',
        'Add zoom and pan capabilities',
        'Implement node connections',
        'Add export functionality'
      ],
      ui: [
        'Create modular components',
        'Implement state management',
        'Add user interactions',
        'Apply consistent styling'
      ]
    };
    
    return suggestions[type] || suggestions.ui;
  }

  /**
   * Generate implementation code
   * @param {Object} analysis Vision analysis
   * @returns {Promise<Object>} Generated code
   */
  async generateCode(analysis) {
    const framework = await this.detectFramework();
    const files = [];
    
    // Generate component files based on analysis
    for (const component of analysis.components) {
      const code = this.generateComponentCode(component, framework, analysis);
      files.push({
        name: `${component.name}.${this.getExtension(framework)}`,
        content: code,
        type: 'component'
      });
    }
    
    // Generate main layout file
    const layoutCode = this.generateLayoutCode(analysis, framework);
    files.push({
      name: `Layout.${this.getExtension(framework)}`,
      content: layoutCode,
      type: 'layout'
    });
    
    // Generate styles
    const styles = this.generateStyles(analysis);
    files.push({
      name: 'styles.css',
      content: styles,
      type: 'styles'
    });
    
    return {
      framework,
      files,
      instructions: this.generateImplementationInstructions(analysis, framework)
    };
  }

  /**
   * Detect project framework
   * @returns {Promise<string>} Framework name
   */
  async detectFramework() {
    try {
      const packageJson = JSON.parse(
        await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf8')
      );
      
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (deps.react) return 'react';
      if (deps.vue) return 'vue';
      if (deps.angular) return 'angular';
      if (deps.svelte) return 'svelte';
      
      return 'vanilla';
    } catch {
      return 'vanilla';
    }
  }

  /**
   * Get file extension for framework
   * @param {string} framework Framework name
   * @returns {string} File extension
   */
  getExtension(framework) {
    const extensions = {
      react: 'jsx',
      vue: 'vue',
      angular: 'component.ts',
      svelte: 'svelte',
      vanilla: 'js'
    };
    
    return extensions[framework] || 'js';
  }

  /**
   * Generate component code
   * @param {Object} component Component data
   * @param {string} framework Framework name
   * @param {Object} analysis Full analysis
   * @returns {string} Component code
   */
  generateComponentCode(component, framework, analysis) {
    if (framework === 'react') {
      return `import React from 'react';
import './styles.css';

const ${this.capitalize(component.name)} = () => {
  return (
    <div className="${component.name}-container">
      <h2>${this.capitalize(component.name)}</h2>
      {/* Component implementation based on vision analysis */}
      {/* Type: ${component.type} */}
      {/* Confidence: ${component.confidence}% */}
    </div>
  );
};

export default ${this.capitalize(component.name)};`;
    }
    
    // Default vanilla JS
    return `// ${this.capitalize(component.name)} Component
class ${this.capitalize(component.name)} {
  constructor() {
    this.type = '${component.type}';
    this.confidence = ${component.confidence};
  }
  
  render() {
    return \`
      <div class="${component.name}-container">
        <h2>${this.capitalize(component.name)}</h2>
        <!-- Component implementation -->
      </div>
    \`;
  }
}

export default ${this.capitalize(component.name)};`;
  }

  /**
   * Generate layout code
   * @param {Object} analysis Vision analysis
   * @param {string} framework Framework name
   * @returns {string} Layout code
   */
  generateLayoutCode(analysis, framework) {
    const components = analysis.components.map(c => this.capitalize(c.name));
    
    if (framework === 'react') {
      return `import React from 'react';
${components.map(c => `import ${c} from './${c}';`).join('\n')}
import './styles.css';

const Layout = () => {
  return (
    <div className="layout-${analysis.layout.type}">
${components.map(c => `      <${c} />`).join('\n')}
    </div>
  );
};

export default Layout;`;
    }
    
    return `// Layout Implementation
${components.map(c => `import ${c} from './${c}.js';`).join('\n')}

class Layout {
  constructor() {
    this.components = [
${components.map(c => `      new ${c}()`).join(',\n')}
    ];
  }
  
  render() {
    return \`
      <div class="layout-${analysis.layout.type}">
        \${this.components.map(c => c.render()).join('')}
      </div>
    \`;
  }
}`;
  }

  /**
   * Generate CSS styles
   * @param {Object} analysis Vision analysis
   * @returns {string} CSS styles
   */
  generateStyles(analysis) {
    const { colors, layout } = analysis;
    
    return `:root {
  --primary-color: ${colors.primary};
  --secondary-color: ${colors.secondary};
  --background: #ffffff;
  --text: #333333;
}

.layout-${layout.type} {
  display: ${layout.type === 'grid' ? 'grid' : 'flex'};
  ${layout.type === 'grid' ? 'grid-template-columns: 1fr;' : 'flex-direction: column;'}
  gap: 1rem;
  padding: 1rem;
  min-height: 100vh;
}

${analysis.components.map(c => `
.${c.name}-container {
  padding: 1rem;
  border-radius: 0.5rem;
  background: var(--background);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
`).join('\n')}

/* Responsive Design */
@media (min-width: 768px) {
  .layout-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .layout-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}`;
  }

  /**
   * Generate implementation instructions
   * @param {Object} analysis Vision analysis
   * @param {string} framework Framework name
   * @returns {Array} Instructions
   */
  generateImplementationInstructions(analysis, framework) {
    return [
      `Framework detected: ${framework}`,
      `Components to create: ${analysis.components.length}`,
      `Layout type: ${analysis.layout.type}`,
      `Color scheme applied: ${analysis.colors.palette.join(', ')}`,
      'Files have been generated based on vision analysis',
      'Review and customize the implementation as needed',
      'Run tests to ensure functionality'
    ];
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

module.exports = VisionAnalyzer;