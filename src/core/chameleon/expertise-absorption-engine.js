/**
 * Expertise Absorption Engine
 * Dynamically loads and configures expertise for Chameleon Managers
 */

const { logger } = require('../logging/bumba-logger');
const fs = require('fs').promises;
const path = require('path');

class ExpertiseAbsorptionEngine {
  constructor(config = {}) {
    this.config = config;
    this.expertiseProfiles = new Map();
    this.contextBuilder = new ContextBuilder();
    this.temperature = config.temperature || 0.3;
    
    // Load expertise profiles on initialization
    this.loadExpertiseProfiles();
  }
  
  /**
   * Load expertise profile for a specialist type
   */
  async load(specialistType, context = {}) {
    try {
      logger.debug(`🧠 Loading expertise for ${specialistType}`);
      
      // Step 1: Get base expertise profile
      const baseProfile = await this.getExpertiseProfile(specialistType);
      
      if (!baseProfile) {
        throw new Error(`No expertise profile found for ${specialistType}`);
      }
      
      // Step 2: Build contextual expertise
      const contextualExpertise = await this.contextBuilder.build({
        baseProfile,
        workContext: context.workContext,
        managerType: context.managerType,
        currentWorkload: context.currentWorkload
      });
      
      // Step 3: Generate expert system prompt
      const systemPrompt = this.generateExpertPrompt(contextualExpertise);
      
      // Step 4: Configure model parameters
      const modelConfig = this.configureModel(contextualExpertise, systemPrompt);
      
      // Step 5: Create expertise package
      const expertise = {
        type: specialistType,
        level: contextualExpertise.level || 'expert',
        capabilities: contextualExpertise.capabilities,
        validationFocus: contextualExpertise.validationFocus,
        commonIssues: contextualExpertise.commonIssues,
        bestPractices: contextualExpertise.bestPractices,
        systemPrompt,
        modelConfig,
        confidence: this.calculateConfidence(contextualExpertise),
        context: contextualExpertise,
        timestamp: Date.now()
      };
      
      logger.info(`✅ Expertise loaded for ${specialistType} with confidence ${expertise.confidence}`);
      
      return expertise;
      
    } catch (error) {
      logger.error(`❌ Failed to load expertise for ${specialistType}:`, error);
      throw error;
    }
  }
  
  /**
   * Get base expertise profile for a specialist
   */
  async getExpertiseProfile(specialistType) {
    // Check if already loaded
    if (this.expertiseProfiles.has(specialistType)) {
      return this.expertiseProfiles.get(specialistType);
    }
    
    // Try to load from profiles
    const profile = EXPERTISE_PROFILES[specialistType];
    if (profile) {
      this.expertiseProfiles.set(specialistType, profile);
      return profile;
    }
    
    // Generate generic profile based on type
    return this.generateGenericProfile(specialistType);
  }
  
  /**
   * Generate expert system prompt
   */
  generateExpertPrompt(expertise) {
    const { domain, level, capabilities, validationFocus, bestPractices } = expertise;
    
    return `You are now a ${level}-level ${domain} expert with deep, comprehensive knowledge.

Your expertise includes:
${capabilities.map(cap => `• ${cap}`).join('\n')}

Best practices you enforce:
${bestPractices.map(practice => `• ${practice}`).join('\n')}

When validating work, you MUST focus on:
${validationFocus.map(focus => `• ${focus}`).join('\n')}

Your validation approach:
1. First, check for critical errors that would cause failures
2. Then, verify best practices and patterns are followed
3. Look for performance implications and optimizations
4. Check security considerations and edge cases
5. Ensure code is maintainable and well-structured

Be specific about issues found. Provide actionable feedback with examples.
Rate confidence in your assessment (0.0-1.0).
If you're not certain about something, state it clearly.

Temperature: ${this.temperature} (low for consistency)`;
  }
  
  /**
   * Configure model for expertise
   */
  configureModel(expertise, systemPrompt) {
    return {
      model: 'claude-3-opus-20240229', // Claude Max
      temperature: this.temperature,
      maxTokens: 4096,
      systemPrompt,
      // Expertise-specific parameters
      validationMode: true,
      requireExplanation: true,
      outputFormat: 'structured',
      confidenceThreshold: 0.7,
      // Sampling parameters for consistency
      topP: 0.9,
      topK: 40,
      repetitionPenalty: 1.1
    };
  }
  
  /**
   * Calculate confidence in expertise
   */
  calculateConfidence(expertise) {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on completeness
    if (expertise.capabilities?.length > 5) confidence += 0.1;
    if (expertise.bestPractices?.length > 3) confidence += 0.1;
    if (expertise.commonIssues?.length > 3) confidence += 0.1;
    if (expertise.validationRules?.length > 5) confidence += 0.1;
    if (expertise.level === 'expert' || expertise.level === 'senior') confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }
  
  /**
   * Generate generic profile for unknown specialist types
   */
  generateGenericProfile(specialistType) {
    // Extract domain from specialist type (e.g., "python-specialist" -> "python")
    const domain = specialistType.replace('-specialist', '').replace('-', ' ');
    
    return {
      domain,
      expertise: [
        `${domain} best practices`,
        'Code quality and maintainability',
        'Performance optimization',
        'Error handling',
        'Testing practices',
        'Documentation standards'
      ],
      validationFocus: ['correctness', 'quality', 'performance', 'security'],
      commonIssues: ['bugs', 'performance issues', 'security vulnerabilities'],
      bestPractices: [
        'Clean, readable code',
        'Proper error handling',
        'Comprehensive testing',
        'Good documentation'
      ]
    };
  }
  
  /**
   * Load all expertise profiles
   */
  async loadExpertiseProfiles() {
    // Load from the expertise profiles definition
    Object.entries(EXPERTISE_PROFILES).forEach(([key, profile]) => {
      this.expertiseProfiles.set(key, profile);
    });
    
    logger.info(`📚 Loaded ${this.expertiseProfiles.size} expertise profiles`);
  }
}

/**
 * Context Builder - Builds contextual expertise based on current situation
 */
class ContextBuilder {
  build({ baseProfile, workContext, managerType, currentWorkload }) {
    const context = { ...baseProfile };
    
    // Enhance based on work context
    if (workContext) {
      if (workContext.critical) {
        context.level = 'senior';
        context.validationFocus = (context.validationFocus || []).concat(['critical-path', 'failure-modes']);
      }
      
      if (workContext.type === 'security') {
        context.validationFocus = ['security'].concat(context.validationFocus || []);
        context.capabilities = (context.capabilities || []).concat(['Security auditing', 'Vulnerability detection']);
      }
    }
    
    // Adjust based on manager type
    if (managerType === 'backend') {
      context.validationFocus = (context.validationFocus || []).concat(['scalability', 'data-integrity']);
    } else if (managerType === 'design') {
      context.validationFocus = (context.validationFocus || []).concat(['user-experience', 'accessibility']);
    } else if (managerType === 'product') {
      context.validationFocus = (context.validationFocus || []).concat(['business-value', 'user-needs']);
    }
    
    // Consider current workload
    if (currentWorkload === 'high') {
      context.validationDepth = 'focused'; // More targeted validation when busy
    }
    
    return context;
  }
}

/**
 * Expertise Profiles - Detailed knowledge for each specialist type
 */
const EXPERTISE_PROFILES = {
  'python-specialist': {
    domain: 'Python',
    level: 'expert',
    expertise: [
      'Python 3.8+ advanced features',
      'PEP 8 and beyond - modern Python style',
      'Type hints and static typing with mypy',
      'Async/await and asyncio patterns',
      'Performance optimization and profiling',
      'Memory management and garbage collection',
      'Testing with pytest and test-driven development',
      'Package management and virtual environments'
    ],
    capabilities: [
      'Detect Python-specific bugs and anti-patterns',
      'Optimize Python code for performance',
      'Ensure proper exception handling',
      'Validate type hints and annotations',
      'Check for memory leaks and circular references',
      'Review async code for race conditions',
      'Verify test coverage and quality'
    ],
    validationFocus: ['pythonic-code', 'type-safety', 'performance', 'testing', 'async-safety'],
    commonIssues: [
      'Mutable default arguments',
      'Circular imports',
      'Memory leaks from circular references',
      'Incorrect exception handling',
      'Race conditions in async code',
      'Missing type hints',
      'Inefficient list comprehensions'
    ],
    bestPractices: [
      'Use type hints for all public APIs',
      'Follow PEP 8 style guide',
      'Write comprehensive docstrings',
      'Use context managers for resource management',
      'Prefer composition over inheritance',
      'Write unit tests for all functions',
      'Use virtual environments for dependencies'
    ],
    validationRules: [
      'No mutable default arguments',
      'All functions have type hints',
      'Docstrings for public functions',
      'No bare except clauses',
      'Proper async/await usage',
      'No global state mutation'
    ]
  },
  
  'javascript-specialist': {
    domain: 'JavaScript',
    level: 'expert',
    expertise: [
      'ES2022+ features and syntax',
      'JavaScript engine internals and optimization',
      'Async patterns: Promises, async/await',
      'Functional programming in JavaScript',
      'Object-oriented patterns and prototypes',
      'Module systems: CommonJS, ES Modules',
      'Performance optimization and profiling',
      'Testing with Jest, Mocha, or Vitest'
    ],
    capabilities: [
      'Detect JavaScript-specific bugs',
      'Identify memory leaks and performance issues',
      'Validate async code patterns',
      'Check for security vulnerabilities',
      'Review code for browser compatibility',
      'Ensure proper error handling',
      'Optimize bundle size and load time'
    ],
    validationFocus: ['async-patterns', 'performance', 'security', 'compatibility', 'best-practices'],
    commonIssues: [
      'Callback hell and promise chains',
      'Memory leaks from event listeners',
      'Improper error handling in promises',
      'Type coercion bugs',
      'Closure-related memory leaks',
      'Race conditions',
      'Prototype pollution'
    ],
    bestPractices: [
      'Use async/await over promise chains',
      'Proper error handling for all async operations',
      'Avoid global variables',
      'Use strict mode',
      'Prefer const and let over var',
      'Clean up event listeners',
      'Use TypeScript or JSDoc for type safety'
    ]
  },
  
  'react-specialist': {
    domain: 'React',
    level: 'expert',
    expertise: [
      'React 18+ features and patterns',
      'Hooks best practices and custom hooks',
      'Performance optimization and React DevTools',
      'State management patterns',
      'Server-side rendering and hydration',
      'Component composition and design patterns',
      'Testing with React Testing Library',
      'Accessibility in React applications'
    ],
    capabilities: [
      'Detect React-specific anti-patterns',
      'Optimize component rendering',
      'Validate hook usage and dependencies',
      'Check accessibility compliance',
      'Review state management approach',
      'Identify performance bottlenecks',
      'Ensure proper testing coverage'
    ],
    validationFocus: ['hooks', 'performance', 'accessibility', 'patterns', 'testing'],
    commonIssues: [
      'Missing effect dependencies',
      'Unnecessary re-renders',
      'Memory leaks from effects',
      'Improper key usage in lists',
      'Direct state mutations',
      'Missing cleanup in effects',
      'Accessibility violations'
    ],
    bestPractices: [
      'Use functional components with hooks',
      'Memoize expensive computations',
      'Clean up effects properly',
      'Use proper key props',
      'Follow accessibility guidelines',
      'Write comprehensive tests',
      'Use React DevTools for profiling'
    ],
    validationRules: [
      'All effects have proper dependencies',
      'No direct state mutations',
      'Components are accessible',
      'Proper error boundaries',
      'Memoization where appropriate',
      'Clean effect cleanup'
    ]
  },
  
  'golang-specialist': {
    domain: 'Go',
    level: 'expert',
    expertise: [
      'Go idioms and best practices',
      'Concurrency with goroutines and channels',
      'Memory management and garbage collection',
      'Error handling patterns',
      'Testing and benchmarking',
      'Module management',
      'Performance optimization',
      'Building microservices'
    ],
    capabilities: [
      'Detect race conditions and deadlocks',
      'Validate error handling',
      'Check for goroutine leaks',
      'Review concurrency patterns',
      'Ensure proper resource cleanup',
      'Validate test coverage',
      'Optimize performance'
    ],
    validationFocus: ['concurrency', 'error-handling', 'performance', 'testing', 'idioms'],
    commonIssues: [
      'Race conditions',
      'Goroutine leaks',
      'Improper error handling',
      'Channel deadlocks',
      'Memory leaks',
      'Inefficient algorithms',
      'Missing defer statements'
    ],
    bestPractices: [
      'Handle all errors explicitly',
      'Use defer for cleanup',
      'Avoid naked returns',
      'Use channels for goroutine communication',
      'Write table-driven tests',
      'Use context for cancellation',
      'Follow effective Go guidelines'
    ]
  },
  
  'database-specialist': {
    domain: 'Database',
    level: 'expert',
    expertise: [
      'SQL optimization and query planning',
      'Database design and normalization',
      'Indexing strategies',
      'Transaction management and ACID',
      'NoSQL patterns and use cases',
      'Database security and encryption',
      'Backup and recovery strategies',
      'Performance tuning and monitoring'
    ],
    capabilities: [
      'Optimize slow queries',
      'Design efficient schemas',
      'Identify indexing opportunities',
      'Detect N+1 query problems',
      'Validate transaction boundaries',
      'Check for SQL injection vulnerabilities',
      'Review backup strategies'
    ],
    validationFocus: ['performance', 'security', 'data-integrity', 'scalability', 'optimization'],
    commonIssues: [
      'N+1 queries',
      'Missing indexes',
      'SQL injection vulnerabilities',
      'Deadlocks',
      'Data inconsistencies',
      'Inefficient joins',
      'Transaction scope issues'
    ],
    bestPractices: [
      'Use parameterized queries',
      'Create appropriate indexes',
      'Normalize data appropriately',
      'Use transactions properly',
      'Implement proper backup strategy',
      'Monitor query performance',
      'Use connection pooling'
    ]
  },
  
  'security-specialist': {
    domain: 'Security',
    level: 'expert',
    expertise: [
      'OWASP Top 10 vulnerabilities',
      'Authentication and authorization',
      'Encryption and cryptography',
      'Security testing and auditing',
      'Secure coding practices',
      'Network security',
      'Compliance and regulations',
      'Incident response'
    ],
    capabilities: [
      'Identify security vulnerabilities',
      'Review authentication mechanisms',
      'Validate input sanitization',
      'Check encryption implementation',
      'Audit access controls',
      'Detect injection attacks',
      'Review security headers'
    ],
    validationFocus: ['vulnerabilities', 'authentication', 'encryption', 'access-control', 'compliance'],
    commonIssues: [
      'SQL injection',
      'Cross-site scripting (XSS)',
      'Insecure authentication',
      'Sensitive data exposure',
      'Broken access control',
      'Security misconfiguration',
      'Insufficient logging'
    ],
    bestPractices: [
      'Validate all input',
      'Use parameterized queries',
      'Implement proper authentication',
      'Encrypt sensitive data',
      'Follow principle of least privilege',
      'Keep dependencies updated',
      'Implement security logging'
    ]
  },
  
  'devops-engineer': {
    domain: 'DevOps',
    level: 'expert',
    expertise: [
      'CI/CD pipeline design',
      'Container orchestration (Kubernetes)',
      'Infrastructure as Code (Terraform)',
      'Monitoring and observability',
      'Cloud platforms (AWS, GCP, Azure)',
      'Configuration management',
      'Security and compliance automation',
      'Performance optimization'
    ],
    capabilities: [
      'Design efficient CI/CD pipelines',
      'Optimize container deployments',
      'Review infrastructure code',
      'Validate monitoring coverage',
      'Check security configurations',
      'Optimize cloud costs',
      'Ensure high availability'
    ],
    validationFocus: ['automation', 'security', 'scalability', 'monitoring', 'cost-optimization'],
    commonIssues: [
      'Inefficient pipelines',
      'Security misconfigurations',
      'Missing monitoring',
      'Cost overruns',
      'Single points of failure',
      'Poor secret management',
      'Inadequate backup strategy'
    ],
    bestPractices: [
      'Automate everything possible',
      'Implement proper monitoring',
      'Use Infrastructure as Code',
      'Follow security best practices',
      'Implement disaster recovery',
      'Optimize for cost',
      'Document everything'
    ]
  },
  
  'api-architect': {
    domain: 'API Design',
    level: 'expert',
    expertise: [
      'RESTful API design principles',
      'GraphQL schema design',
      'API versioning strategies',
      'Authentication and authorization',
      'Rate limiting and throttling',
      'API documentation (OpenAPI)',
      'Microservices communication',
      'API performance optimization'
    ],
    capabilities: [
      'Review API design consistency',
      'Validate REST principles',
      'Check authentication implementation',
      'Review error handling',
      'Validate documentation completeness',
      'Optimize API performance',
      'Ensure backward compatibility'
    ],
    validationFocus: ['design-consistency', 'security', 'performance', 'documentation', 'versioning'],
    commonIssues: [
      'Inconsistent API design',
      'Missing authentication',
      'Poor error handling',
      'Lack of versioning',
      'Incomplete documentation',
      'N+1 query problems',
      'Breaking changes'
    ],
    bestPractices: [
      'Follow REST principles',
      'Version APIs properly',
      'Implement proper authentication',
      'Return consistent responses',
      'Document all endpoints',
      'Handle errors gracefully',
      'Implement rate limiting'
    ]
  },
  
  'ui-design': {
    domain: 'UI/UX Design',
    level: 'expert',
    expertise: [
      'User interface design principles',
      'Accessibility standards (WCAG)',
      'Responsive design patterns',
      'Design systems and components',
      'User experience best practices',
      'Performance optimization',
      'Cross-browser compatibility',
      'Animation and interactions'
    ],
    capabilities: [
      'Review design consistency',
      'Validate accessibility compliance',
      'Check responsive behavior',
      'Review user interactions',
      'Validate performance impact',
      'Ensure cross-browser support',
      'Check animation performance'
    ],
    validationFocus: ['accessibility', 'responsiveness', 'consistency', 'performance', 'usability'],
    commonIssues: [
      'Accessibility violations',
      'Inconsistent design',
      'Poor mobile experience',
      'Performance issues',
      'Browser incompatibilities',
      'Poor contrast ratios',
      'Missing focus states'
    ],
    bestPractices: [
      'Follow WCAG guidelines',
      'Design mobile-first',
      'Use consistent design system',
      'Optimize images and assets',
      'Test across browsers',
      'Provide keyboard navigation',
      'Use semantic HTML'
    ]
  },
  
  'ml-engineer': {
    domain: 'Machine Learning',
    level: 'expert',
    expertise: [
      'Machine learning algorithms',
      'Deep learning architectures',
      'Model training and optimization',
      'Feature engineering',
      'Model evaluation and metrics',
      'MLOps and deployment',
      'Data preprocessing',
      'Model interpretability'
    ],
    capabilities: [
      'Review model architecture',
      'Validate training approach',
      'Check data preprocessing',
      'Review evaluation metrics',
      'Validate deployment strategy',
      'Check for data leakage',
      'Review model performance'
    ],
    validationFocus: ['model-quality', 'data-integrity', 'performance', 'deployment', 'interpretability'],
    commonIssues: [
      'Data leakage',
      'Overfitting',
      'Inadequate validation',
      'Poor feature engineering',
      'Inefficient training',
      'Model drift',
      'Lack of interpretability'
    ],
    bestPractices: [
      'Prevent data leakage',
      'Use proper validation splits',
      'Monitor model performance',
      'Document model decisions',
      'Version models and data',
      'Implement proper testing',
      'Consider interpretability'
    ]
  }
};

module.exports = ExpertiseAbsorptionEngine;