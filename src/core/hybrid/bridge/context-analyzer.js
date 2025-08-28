/**
 * BUMBA Context Analyzer
 * Analyzes project structure and gathers context for Claude
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class ContextAnalyzer {
  constructor() {
    this.filePatterns = {
      javascript: /\.(js|jsx|mjs|cjs)$/,
      typescript: /\.(ts|tsx)$/,
      python: /\.py$/,
      react: /\.(jsx|tsx)$/,
      vue: /\.vue$/,
      config: /\.(json|yaml|yml|toml|ini)$/,
      test: /\.(test|spec)\.(js|ts|jsx|tsx)$/
    };
    
    this.techStack = new Set();
    this.patterns = new Set();
    this.projectType = 'unknown';
  }

  /**
   * Analyze the entire project
   * @returns {Promise<Object>} Project analysis
   */
  async analyzeProject() {
    const projectRoot = process.cwd();
    
    // Detect project type
    this.projectType = await this.detectProjectType(projectRoot);
    
    // Map project structure
    const structure = await this.mapStructure(projectRoot);
    
    // Identify tech stack
    await this.identifyTechStack(projectRoot);
    
    // Detect patterns
    await this.detectPatterns(structure);
    
    // Assess project health
    const health = await this.assessHealth(projectRoot);
    
    return {
      type: this.projectType,
      structure,
      patterns: Array.from(this.patterns),
      stack: Array.from(this.techStack),
      health,
      fileCount: structure.totalFiles,
      timestamp: Date.now()
    };
  }

  /**
   * Detect project type
   * @param {string} root Project root
   * @returns {Promise<string>} Project type
   */
  async detectProjectType(root) {
    const files = await fs.readdir(root);
    
    // Check for common project files
    if (files.includes('package.json')) {
      const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
      
      if (pkg.dependencies?.react || pkg.devDependencies?.react) {
        return 'react';
      }
      if (pkg.dependencies?.vue || pkg.devDependencies?.vue) {
        return 'vue';
      }
      if (pkg.dependencies?.angular || pkg.devDependencies?.angular) {
        return 'angular';
      }
      if (pkg.dependencies?.express || pkg.dependencies?.fastify) {
        return 'node-backend';
      }
      return 'node';
    }
    
    if (files.includes('requirements.txt') || files.includes('setup.py')) {
      return 'python';
    }
    
    if (files.includes('Cargo.toml')) {
      return 'rust';
    }
    
    if (files.includes('go.mod')) {
      return 'go';
    }
    
    return 'unknown';
  }

  /**
   * Map project structure
   * @param {string} root Project root
   * @returns {Promise<Object>} Structure map
   */
  async mapStructure(root, depth = 0, maxDepth = 3) {
    const structure = {
      type: 'directory',
      name: path.basename(root),
      children: [],
      totalFiles: 0,
      totalDirs: 0
    };
    
    if (depth >= maxDepth) {
      return structure;
    }
    
    try {
      const items = await fs.readdir(root);
      
      for (const item of items) {
        // Skip common ignored directories
        if (this.shouldIgnore(item)) continue;
        
        const itemPath = path.join(root, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          const subStructure = await this.mapStructure(itemPath, depth + 1, maxDepth);
          structure.children.push(subStructure);
          structure.totalDirs++;
          structure.totalFiles += subStructure.totalFiles;
        } else {
          structure.children.push({
            type: 'file',
            name: item,
            ext: path.extname(item)
          });
          structure.totalFiles++;
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
    
    return structure;
  }

  /**
   * Identify technology stack
   * @param {string} root Project root
   * @returns {Promise<void>}
   */
  async identifyTechStack(root) {
    const files = await fs.readdir(root);
    
    // Check package.json
    if (files.includes('package.json')) {
      try {
        const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        
        // Common frameworks/libraries
        if (deps.react) this.techStack.add('React');
        if (deps.vue) this.techStack.add('Vue');
        if (deps.angular) this.techStack.add('Angular');
        if (deps.express) this.techStack.add('Express');
        if (deps.fastify) this.techStack.add('Fastify');
        if (deps.next) this.techStack.add('Next.js');
        if (deps.nuxt) this.techStack.add('Nuxt');
        if (deps.typescript) this.techStack.add('TypeScript');
        if (deps.jest) this.techStack.add('Jest');
        if (deps.vitest) this.techStack.add('Vitest');
        if (deps.webpack) this.techStack.add('Webpack');
        if (deps.vite) this.techStack.add('Vite');
        if (deps.tailwindcss) this.techStack.add('Tailwind CSS');
      } catch (error) {
        // Ignore parse errors
      }
    }
    
    // Check for other stack indicators
    if (files.includes('requirements.txt')) {
      this.techStack.add('Python');
      try {
        const reqs = await fs.readFile(path.join(root, 'requirements.txt'), 'utf8');
        if (reqs.includes('django')) this.techStack.add('Django');
        if (reqs.includes('flask')) this.techStack.add('Flask');
        if (reqs.includes('fastapi')) this.techStack.add('FastAPI');
      } catch (error) {
        // Ignore read errors
      }
    }
    
    if (files.includes('Cargo.toml')) this.techStack.add('Rust');
    if (files.includes('go.mod')) this.techStack.add('Go');
    if (files.includes('composer.json')) this.techStack.add('PHP');
    if (files.includes('Gemfile')) this.techStack.add('Ruby');
  }

  /**
   * Detect architectural patterns
   * @param {Object} structure Project structure
   * @returns {Promise<void>}
   */
  async detectPatterns(structure) {
    const hasDir = (name) => this.findDirectory(structure, name);
    const hasFile = (name) => this.findFile(structure, name);
    
    // Common patterns
    if (hasDir('components')) this.patterns.add('Component-based architecture');
    if (hasDir('pages') || hasDir('views')) this.patterns.add('Page-based routing');
    if (hasDir('api') || hasDir('routes')) this.patterns.add('API endpoints');
    if (hasDir('models')) this.patterns.add('MVC pattern');
    if (hasDir('services')) this.patterns.add('Service layer');
    if (hasDir('utils') || hasDir('helpers')) this.patterns.add('Utility functions');
    if (hasDir('tests') || hasDir('__tests__')) this.patterns.add('Test structure');
    if (hasDir('docs')) this.patterns.add('Documentation');
    if (hasFile('.env')) this.patterns.add('Environment configuration');
    if (hasFile('docker-compose')) this.patterns.add('Docker containerization');
  }

  /**
   * Assess project health
   * @param {string} root Project root
   * @returns {Promise<Object>} Health metrics
   */
  async assessHealth(root) {
    let score = 100;
    const issues = [];
    const recommendations = [];
    
    // Check for essential files
    const files = await fs.readdir(root);
    
    if (!files.includes('README.md')) {
      score -= 5;
      issues.push('Missing README.md');
      recommendations.push('Add project documentation');
    }
    
    if (!files.includes('.gitignore')) {
      score -= 5;
      issues.push('Missing .gitignore');
      recommendations.push('Add .gitignore file');
    }
    
    // Check for tests
    const hasTests = await this.hasTestFiles(root);
    if (!hasTests) {
      score -= 10;
      issues.push('No test files found');
      recommendations.push('Add unit tests');
    }
    
    // Check for linting configuration
    const hasLinting = files.some(f => 
      f.includes('eslint') || f.includes('prettier') || f.includes('lint')
    );
    if (!hasLinting) {
      score -= 5;
      issues.push('No linting configuration');
      recommendations.push('Add code linting');
    }
    
    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  /**
   * Prepare context for Claude
   * @returns {Promise<Object>} Claude-ready context
   */
  async prepareForClaude() {
    const analysis = await this.analyzeProject();
    
    // Find relevant files
    const relevantFiles = await this.findRelevantFiles(process.cwd());
    
    // Generate summary
    const summary = this.generateSummary(analysis);
    
    // Generate suggestions
    const suggestions = this.generateSuggestions(analysis);
    
    return {
      summary,
      relevantFiles,
      suggestions,
      analysis
    };
  }

  /**
   * Find relevant files for context
   * @param {string} root Project root
   * @returns {Promise<Array>} List of relevant files
   */
  async findRelevantFiles(root, files = [], depth = 0, maxDepth = 3) {
    if (depth >= maxDepth) return files;
    
    try {
      const items = await fs.readdir(root);
      
      for (const item of items) {
        if (this.shouldIgnore(item)) continue;
        
        const itemPath = path.join(root, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          await this.findRelevantFiles(itemPath, files, depth + 1, maxDepth);
        } else if (this.isRelevantFile(item)) {
          files.push(path.relative(process.cwd(), itemPath));
        }
      }
    } catch (error) {
      // Ignore errors
    }
    
    return files;
  }

  /**
   * Check if file is relevant
   * @param {string} filename File name
   * @returns {boolean}
   */
  isRelevantFile(filename) {
    const relevantExtensions = [
      '.js', '.jsx', '.ts', '.tsx',
      '.py', '.go', '.rs', '.rb',
      '.html', '.css', '.scss', '.sass',
      '.json', '.yaml', '.yml',
      '.md', '.txt'
    ];
    
    return relevantExtensions.some(ext => filename.endsWith(ext));
  }

  /**
   * Check if should ignore path
   * @param {string} name Path name
   * @returns {boolean}
   */
  shouldIgnore(name) {
    const ignorePaths = [
      'node_modules', '.git', '.next', '.nuxt',
      'dist', 'build', 'out', 'coverage',
      '.cache', '.parcel-cache', '.vscode',
      '__pycache__', '.pytest_cache', 'venv',
      'target', '.idea', '.DS_Store'
    ];
    
    return ignorePaths.includes(name) || name.startsWith('.');
  }

  /**
   * Check for test files
   * @param {string} root Project root
   * @returns {Promise<boolean>}
   */
  async hasTestFiles(root) {
    try {
      const { stdout } = await execAsync(
        `find "${root}" -type f \\( -name "*.test.*" -o -name "*.spec.*" \\) | head -1`,
        { timeout: 5000 }
      );
      return !!stdout.trim();
    } catch {
      return false;
    }
  }

  /**
   * Find directory in structure
   * @param {Object} structure Structure object
   * @param {string} name Directory name
   * @returns {boolean}
   */
  findDirectory(structure, name) {
    if (structure.type === 'directory') {
      if (structure.name === name) return true;
      if (structure.children) {
        return structure.children.some(child => this.findDirectory(child, name));
      }
    }
    return false;
  }

  /**
   * Find file in structure
   * @param {Object} structure Structure object
   * @param {string} name File name pattern
   * @returns {boolean}
   */
  findFile(structure, name) {
    if (structure.type === 'file') {
      return structure.name.includes(name);
    }
    if (structure.children) {
      return structure.children.some(child => this.findFile(child, name));
    }
    return false;
  }

  /**
   * Generate project summary
   * @param {Object} analysis Analysis data
   * @returns {string} Summary text
   */
  generateSummary(analysis) {
    return `Project Type: ${analysis.type}
Tech Stack: ${analysis.stack.join(', ')}
Architecture: ${analysis.patterns.join(', ')}
Files: ${analysis.fileCount}
Health Score: ${analysis.health.score}/100`;
  }

  /**
   * Generate suggestions
   * @param {Object} analysis Analysis data
   * @returns {Array} Suggestions
   */
  generateSuggestions(analysis) {
    const suggestions = [...analysis.health.recommendations];
    
    // Add stack-specific suggestions
    if (analysis.type === 'react' && !analysis.stack.includes('TypeScript')) {
      suggestions.push('Consider adding TypeScript for type safety');
    }
    
    if (!analysis.patterns.includes('Test structure')) {
      suggestions.push('Add comprehensive test coverage');
    }
    
    return suggestions;
  }
}

module.exports = ContextAnalyzer;