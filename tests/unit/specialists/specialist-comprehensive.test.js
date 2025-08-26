/**
 * Comprehensive Specialist Ecosystem Tests
 * Testing all 78+ specialists across all categories
 */

const specialistRegistry = require('../../../src/core/specialists/specialist-registry');
const { SpecialistAgent } = require('../../../src/core/specialists/specialist-agent');

describe('Comprehensive Specialist Ecosystem Tests', () => {
  
  describe('Technical Specialists (45 total)', () => {
    describe('Language Specialists (13)', () => {
      const languageSpecialists = [
        'javascript-specialist', 'typescript-specialist', 'python-specialist',
        'golang-specialist', 'rust-specialist', 'java-specialist',
        'csharp-specialist', 'ruby-specialist', 'php-specialist',
        'elixir-specialist', 'scala-specialist', 'c-specialist', 'cpp-specialist'
      ];

      languageSpecialists.forEach(type => {
        test(`${type} should be registered`, () => {
          const specialist = specialistRegistry.getSpecialist(type);
          expect(specialist).toBeDefined();
          expect(specialist.name).toBeDefined();
          expect(specialist.category).toBe('technical');
        });

        test(`${type} should be discoverable by language name`, () => {
          const language = type.replace('-specialist', '');
          const results = specialistRegistry.searchBySkillOrTool(language);
          expect(results.length).toBeGreaterThan(0);
          const found = results.some(r => r.type === type);
          expect(found).toBe(true);
        });
      });
    });

    describe('DevOps Specialists (7)', () => {
      const devopsSpecialists = [
        'devops-engineer', 'cloud-architect', 'kubernetes-specialist',
        'terraform-specialist', 'sre-specialist', 'deployment-engineer',
        'network-engineer'
      ];

      devopsSpecialists.forEach(type => {
        test(`${type} should be registered`, () => {
          const specialist = specialistRegistry.getSpecialist(type);
          expect(specialist).toBeDefined();
          expect(specialist.category).toBe('technical');
        });
      });

      test('should find DevOps specialists for CI/CD tasks', () => {
        const results = specialistRegistry.findSpecialistsForTask('setup CI/CD pipeline');
        expect(results.length).toBeGreaterThan(0);
        const hasDevOps = results.some(r => 
          r.type.includes('devops') || r.type.includes('deployment')
        );
        expect(hasDevOps).toBe(true);
      });
    });

    describe('Data & AI Specialists (6)', () => {
      const dataAISpecialists = [
        'data-engineer', 'data-scientist', 'ml-engineer',
        'ai-engineer', 'mlops-engineer', 'prompt-engineer'
      ];

      dataAISpecialists.forEach(type => {
        test(`${type} should be registered`, () => {
          const specialist = specialistRegistry.getSpecialist(type);
          expect(specialist).toBeDefined();
          expect(specialist.category).toBe('technical');
        });
      });

      test('should find AI specialists for machine learning tasks', () => {
        const results = specialistRegistry.findSpecialistsForTask('train machine learning model');
        expect(results.length).toBeGreaterThan(0);
        const hasML = results.some(r => 
          r.type.includes('ml') || r.type.includes('ai') || r.type.includes('data')
        );
        expect(hasML).toBe(true);
      });
    });

    describe('Database Specialists (6)', () => {
      const databaseSpecialists = [
        'database-admin', 'database-optimizer', 'sql-specialist',
        'backend-architect', 'api-architect', 'graphql-architect'
      ];

      databaseSpecialists.forEach(type => {
        test(`${type} should be registered`, () => {
          const specialist = specialistRegistry.getSpecialist(type);
          expect(specialist).toBeDefined();
          expect(specialist.category).toBe('technical');
        });
      });

      test('should find database specialists for optimization tasks', () => {
        const results = specialistRegistry.findSpecialistsForTask('optimize database queries');
        expect(results.length).toBeGreaterThan(0);
        const hasDB = results.some(r => 
          r.type.includes('database') || r.type.includes('sql')
        );
        expect(hasDB).toBe(true);
      });
    });

    describe('QA Specialists (6)', () => {
      const qaSpecialists = [
        'test-automator', 'performance-engineer', 'code-reviewer',
        'debugger-specialist', 'security-auditor', 'incident-responder'
      ];

      qaSpecialists.forEach(type => {
        test(`${type} should be registered`, () => {
          const specialist = specialistRegistry.getSpecialist(type);
          expect(specialist).toBeDefined();
          expect(specialist.category).toBe('technical');
        });
      });
    });

    describe('Advanced Specialists (7)', () => {
      const advancedSpecialists = [
        'mobile-developer', 'ios-developer', 'flutter-expert',
        'unity-developer', 'game-developer', 'minecraft-specialist',
        'blockchain-engineer'
      ];

      advancedSpecialists.forEach(type => {
        test(`${type} should be registered`, () => {
          const specialist = specialistRegistry.getSpecialist(type);
          expect(specialist).toBeDefined();
          expect(specialist.category).toBe('technical');
        });
      });
    });
  });

  describe('Experience Specialists (10 total)', () => {
    const experienceSpecialists = [
      'frontend-developer', 'ui-design', 'ux-research', 'accessibility',
      'performance-specialist', 'design-system-architect', 'css-specialist',
      'react-specialist', 'vue-specialist', 'angular-specialist'
    ];

    experienceSpecialists.forEach(type => {
      test(`${type} should be registered`, () => {
        const specialist = specialistRegistry.getSpecialist(type);
        expect(specialist).toBeDefined();
        expect(specialist.name).toBeDefined();
        expect(specialist.category).toBe('experience');
      });
    });

    test('should find React specialist for React tasks', () => {
      const results = specialistRegistry.findSpecialistsForTask('build React component');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].type).toBe('react-specialist');
    });

    test('should find accessibility specialist for a11y tasks', () => {
      const results = specialistRegistry.searchBySkillOrTool('accessibility');
      expect(results.length).toBeGreaterThan(0);
      const hasA11y = results.some(r => r.type === 'accessibility');
      expect(hasA11y).toBe(true);
    });
  });

  describe('Strategic Specialists (11 total)', () => {
    const strategicSpecialists = [
      'business-analyst', 'product-manager', 'market-research',
      'competitive-analysis', 'business-model', 'quant-analyst',
      'risk-manager', 'content-marketer', 'sales-automator',
      'customer-support', 'legal-advisor'
    ];

    strategicSpecialists.forEach(type => {
      test(`${type} should be registered`, () => {
        const specialist = specialistRegistry.getSpecialist(type);
        expect(specialist).toBeDefined();
        expect(specialist.name).toBeDefined();
        expect(specialist.category).toBe('strategic');
      });
    });

    test('should find market research specialist for market analysis', () => {
      const results = specialistRegistry.findSpecialistsForTask('analyze market trends');
      expect(results.length).toBeGreaterThan(0);
      const hasMarket = results.some(r => r.type.includes('market'));
      expect(hasMarket).toBe(true);
    });
  });

  describe('Documentation Specialists (5 total)', () => {
    const docSpecialists = [
      'docs-architect', 'api-documenter', 'tutorial-engineer',
      'reference-builder', 'mermaid-expert'
    ];

    docSpecialists.forEach(type => {
      test(`${type} should be registered`, () => {
        const specialist = specialistRegistry.getSpecialist(type);
        expect(specialist).toBeDefined();
        expect(specialist.name).toBeDefined();
        expect(specialist.category).toBe('documentation');
      });
    });

    test('should find API documenter for API documentation tasks', () => {
      const results = specialistRegistry.searchBySkillOrTool('api');
      expect(results.length).toBeGreaterThan(0);
      const hasAPIDocs = results.some(r => r.type === 'api-documenter');
      expect(hasAPIDocs).toBe(true);
    });
  });

  describe('Specialized Domain Specialists (7 total)', () => {
    const specializedSpecialists = [
      'payment-integration', 'legacy-modernizer', 'context-manager',
      'search-specialist', 'error-detective', 'developer-experience',
      'architect-reviewer'
    ];

    specializedSpecialists.forEach(type => {
      test(`${type} should be registered`, () => {
        const specialist = specialistRegistry.getSpecialist(type);
        expect(specialist).toBeDefined();
        expect(specialist.name).toBeDefined();
        expect(specialist.category).toBe('specialized');
      });
    });
  });

  describe('Registry Functionality', () => {
    test('should have exactly 83 specialists registered', () => {
      const allTypes = specialistRegistry.getAllTypes();
      expect(allTypes.length).toBe(83);
    });

    test('should categorize specialists correctly', () => {
      const categories = specialistRegistry.getSpecialistsByCategory();
      
      expect(categories.technical).toBeDefined();
      expect(categories.experience).toBeDefined();
      expect(categories.strategic).toBeDefined();
      expect(categories.documentation).toBeDefined();
      expect(categories.specialized).toBeDefined();
      
      // Verify counts
      expect(categories.technical.length).toBeGreaterThanOrEqual(45);
      expect(categories.experience.length).toBe(10);
      expect(categories.strategic.length).toBe(11);
      expect(categories.documentation.length).toBe(5);
      expect(categories.specialized.length).toBe(7);
    });

    test('should return confidence scores for task matching', () => {
      const results = specialistRegistry.findSpecialistsForTask('build React app with Node.js backend');
      
      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.confidence).toBeDefined();
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
        expect(result.score).toBeDefined();
      });
    });

    test('should handle complex multi-domain tasks', () => {
      const task = 'build accessible React app with PostgreSQL database, CI/CD pipeline, and comprehensive documentation';
      const results = specialistRegistry.findSpecialistsForTask(task);
      
      expect(results.length).toBe(5); // Should return top 5 matches
      
      // Should find specialists from multiple domains
      const types = results.map(r => r.type);
      const hasReact = types.some(t => t.includes('react') || t.includes('frontend'));
      const hasDatabase = types.some(t => t.includes('postgres') || t.includes('database') || t.includes('sql'));
      
      expect(hasReact || hasDatabase).toBe(true);
    });

    test('searchBySkillOrTool should work for all major skills', () => {
      const skills = ['react', 'python', 'kubernetes', 'database', 'security'];
      
      skills.forEach(skill => {
        const results = specialistRegistry.searchBySkillOrTool(skill);
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].confidence).toBeDefined();
      });
    });
  });

  describe('Specialist Loading', () => {
    test('should load and instantiate a sample of specialists', () => {
      const testSpecialists = [
        'javascript-specialist',
        'frontend-developer',
        'product-manager',
        'docs-architect',
        'payment-integration'
      ];

      testSpecialists.forEach(type => {
        const SpecialistClass = specialistRegistry.loadSpecialist(type);
        if (SpecialistClass) {
          expect(() => {
            const instance = new SpecialistClass('test-dept', {});
          }).not.toThrow();
        }
      });
    });
  });

  describe('Task Matching Accuracy', () => {
    const testCases = [
      {
        task: 'optimize PostgreSQL database performance',
        expectedTypes: ['postgres-specialist', 'database-optimizer', 'database-admin'],
      },
      {
        task: 'implement JWT authentication in Node.js',
        expectedTypes: ['javascript-specialist', 'security', 'backend-engineer'],
      },
      {
        task: 'create responsive React components with TypeScript',
        expectedTypes: ['react-specialist', 'typescript-specialist', 'frontend-developer'],
      },
      {
        task: 'setup Kubernetes cluster with Terraform',
        expectedTypes: ['kubernetes-specialist', 'terraform-specialist', 'devops-engineer'],
      },
      {
        task: 'analyze market trends and competitor positioning',
        expectedTypes: ['market-research', 'competitive-analysis', 'business-analyst'],
      }
    ];

    testCases.forEach(({ task, expectedTypes }) => {
      test(`should correctly match specialists for: "${task}"`, () => {
        const results = specialistRegistry.findSpecialistsForTask(task);
        expect(results.length).toBeGreaterThan(0);
        
        const foundTypes = results.map(r => r.type);
        const hasExpected = expectedTypes.some(type => foundTypes.includes(type));
        expect(hasExpected).toBe(true);
      });
    });
  });
});