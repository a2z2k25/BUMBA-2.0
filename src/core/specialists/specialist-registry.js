/**
 * BUMBA Specialist Registry
 * Central registry for all 78+ specialists in the ecosystem
 * NOW WITH LAZY LOADING for memory optimization
 */

// Feature flag for lazy loading
const USE_LAZY_LOADING = process.env.DISABLE_LAZY_LOADING !== 'true';

// Use wrapper if lazy loading is enabled
if (USE_LAZY_LOADING) {
  module.exports = require('./specialist-registry-wrapper');
} else {
  // Original implementation below (for rollback if needed)
  const path = require('path');
  const fs = require('fs');
class SpecialistRegistry {
  constructor() {
    this.specialists = new Map();
    this.specialistsByCategory = new Map();
    this.taskMappings = new Map();
    this.initialized = false;
    
    // Performance features
    this.loadedSpecialists = new Map(); // Cache for loaded specialist classes
    this.instanceCache = new Map(); // Cache for specialist instances
    this.searchCache = new Map(); // Cache for search results
    this.taskMatchCache = new Map(); // Cache for task matching results
    this.cacheTimeout = 5 * 60 * 1000; // 5 minute cache
    this.lastCacheClear = Date.now();
    this.performanceMetrics = {
      loadTime: {},
      searchTime: {},
      cacheHits: 0,
      cacheMisses: 0
    };
    
    this.initializeRegistry();
  }

  initializeRegistry() {
    // Technical Specialists - Languages (13)
    this.registerSpecialist('javascript-specialist', {
      name: 'JavaScript Specialist',
      category: 'technical',
      subcategory: 'languages',
      path: 'technical/languages/javascript-specialist',
      keywords: ['javascript', 'js', 'node', 'nodejs', 'ecmascript'],
      expertise: ['es6+', 'async/await', 'promises', 'node.js', 'npm']
    });

    this.registerSpecialist('typescript-specialist', {
      name: 'TypeScript Specialist',
      category: 'technical',
      subcategory: 'languages',
      path: 'technical/languages/typescript-specialist',
      keywords: ['typescript', 'ts', 'types', 'interfaces', 'generics'],
      expertise: ['type systems', 'interfaces', 'generics', 'decorators']
    });

    this.registerSpecialist('python-specialist', {
      name: 'Python Specialist',
      category: 'technical',
      subcategory: 'languages',
      path: 'technical/languages/python-specialist',
      keywords: ['python', 'py', 'pip', 'django', 'flask'],
      expertise: ['python3', 'async', 'data science', 'web frameworks']
    });

    this.registerSpecialist('golang-specialist', {
      name: 'Go Specialist',
      category: 'technical',
      subcategory: 'languages',
      path: 'technical/languages/golang-specialist',
      keywords: ['go', 'golang', 'goroutines', 'channels'],
      expertise: ['concurrency', 'goroutines', 'channels', 'interfaces']
    });

    this.registerSpecialist('rust-specialist', {
      name: 'Rust Specialist',
      category: 'technical',
      subcategory: 'languages',
      path: 'technical/languages/rust-specialist',
      keywords: ['rust', 'cargo', 'ownership', 'borrowing'],
      expertise: ['memory safety', 'ownership', 'traits', 'async']
    });

    this.registerSpecialist('java-specialist', {
      name: 'Java Specialist',
      category: 'technical',
      subcategory: 'languages',
      path: 'technical/languages/java-specialist',
      keywords: ['java', 'jvm', 'spring', 'maven', 'gradle'],
      expertise: ['spring', 'jvm', 'enterprise', 'microservices']
    });

    this.registerSpecialist('csharp-specialist', {
      name: 'C# Specialist',
      category: 'technical',
      subcategory: 'languages',
      path: 'technical/languages/csharp-specialist',
      keywords: ['c#', 'csharp', 'dotnet', '.net', 'asp.net'],
      expertise: ['.net', 'asp.net', 'linq', 'entity framework']
    });

    this.registerSpecialist('ruby-specialist', {
      name: 'Ruby Specialist',
      category: 'technical',
      subcategory: 'languages',
      path: 'technical/languages/ruby-specialist',
      keywords: ['ruby', 'rails', 'gem', 'bundler'],
      expertise: ['rails', 'sinatra', 'gems', 'metaprogramming']
    });

    this.registerSpecialist('php-specialist', {
      name: 'PHP Specialist',
      category: 'technical',
      subcategory: 'languages',
      path: 'technical/languages/php-specialist',
      keywords: ['php', 'laravel', 'symfony', 'composer'],
      expertise: ['laravel', 'symfony', 'wordpress', 'composer']
    });

    this.registerSpecialist('elixir-specialist', {
      name: 'Elixir Specialist',
      category: 'technical',
      subcategory: 'languages',
      path: 'technical/languages/elixir-specialist',
      keywords: ['elixir', 'phoenix', 'erlang', 'otp'],
      expertise: ['phoenix', 'otp', 'genserver', 'fault tolerance']
    });

    this.registerSpecialist('scala-specialist', {
      name: 'Scala Specialist',
      category: 'technical',
      subcategory: 'languages',
      path: 'technical/languages/scala-specialist',
      keywords: ['scala', 'akka', 'play', 'sbt'],
      expertise: ['functional', 'akka', 'play', 'spark']
    });

    this.registerSpecialist('c-specialist', {
      name: 'C Specialist',
      category: 'technical',
      subcategory: 'languages',
      path: 'technical/languages/c-specialist',
      keywords: ['c', 'systems', 'embedded', 'low-level'],
      expertise: ['systems programming', 'embedded', 'memory management']
    });

    this.registerSpecialist('cpp-specialist', {
      name: 'C++ Specialist',
      category: 'technical',
      subcategory: 'languages',
      path: 'technical/languages/cpp-specialist',
      keywords: ['c++', 'cpp', 'stl', 'templates'],
      expertise: ['stl', 'templates', 'modern c++', 'performance']
    });

    // Technical Specialists - DevOps (7)
    this.registerSpecialist('devops-engineer', {
      name: 'DevOps Engineer',
      category: 'technical',
      subcategory: 'devops',
      path: 'technical/devops/devops-engineer',
      keywords: ['devops', 'ci/cd', 'automation', 'infrastructure'],
      expertise: ['ci/cd', 'automation', 'monitoring', 'deployment']
    });

    this.registerSpecialist('cloud-architect', {
      name: 'Cloud Architect',
      category: 'technical',
      subcategory: 'devops',
      path: 'technical/devops/cloud-architect',
      keywords: ['cloud', 'aws', 'azure', 'gcp', 'architecture'],
      expertise: ['aws', 'azure', 'gcp', 'cloud design']
    });

    this.registerSpecialist('kubernetes-specialist', {
      name: 'Kubernetes Specialist',
      category: 'technical',
      subcategory: 'devops',
      path: 'technical/devops/kubernetes-specialist',
      keywords: ['kubernetes', 'k8s', 'containers', 'orchestration'],
      expertise: ['k8s', 'helm', 'operators', 'service mesh']
    });

    this.registerSpecialist('terraform-specialist', {
      name: 'Terraform Specialist',
      category: 'technical',
      subcategory: 'devops',
      path: 'technical/devops/terraform-specialist',
      keywords: ['terraform', 'iac', 'infrastructure as code'],
      expertise: ['hcl', 'modules', 'providers', 'state management']
    });

    this.registerSpecialist('sre-specialist', {
      name: 'SRE Specialist',
      category: 'technical',
      subcategory: 'devops',
      path: 'technical/devops/sre-specialist',
      keywords: ['sre', 'reliability', 'monitoring', 'sla', 'slo'],
      expertise: ['monitoring', 'incident response', 'sla/slo', 'reliability']
    });

    this.registerSpecialist('deployment-engineer', {
      name: 'Deployment Engineer',
      category: 'technical',
      subcategory: 'devops',
      path: 'technical/devops/deployment-engineer',
      keywords: ['deployment', 'release', 'rollout', 'blue-green'],
      expertise: ['deployment strategies', 'rollback', 'canary', 'blue-green']
    });

    this.registerSpecialist('network-engineer', {
      name: 'Network Engineer',
      category: 'technical',
      subcategory: 'devops',
      path: 'technical/devops/network-engineer',
      keywords: ['network', 'tcp/ip', 'dns', 'load balancing'],
      expertise: ['networking', 'security', 'load balancing', 'cdn']
    });

    // Technical Specialists - Data & AI (6)
    this.registerSpecialist('data-engineer', {
      name: 'Data Engineer',
      category: 'technical',
      subcategory: 'data-ai',
      path: 'technical/data-ai/data-engineer',
      keywords: ['data', 'etl', 'pipeline', 'warehouse'],
      expertise: ['etl', 'data pipelines', 'spark', 'data warehouse']
    });

    this.registerSpecialist('data-scientist', {
      name: 'Data Scientist',
      category: 'technical',
      subcategory: 'data-ai',
      path: 'technical/data-ai/data-scientist',
      keywords: ['data science', 'statistics', 'analysis', 'visualization'],
      expertise: ['statistics', 'ml', 'visualization', 'analysis']
    });

    this.registerSpecialist('ml-engineer', {
      name: 'ML Engineer',
      category: 'technical',
      subcategory: 'data-ai',
      path: 'technical/data-ai/ml-engineer',
      keywords: ['machine learning', 'ml', 'models', 'training'],
      expertise: ['model training', 'deployment', 'optimization', 'mlops']
    });

    this.registerSpecialist('ai-engineer', {
      name: 'AI Engineer',
      category: 'technical',
      subcategory: 'data-ai',
      path: 'technical/data-ai/ai-engineer',
      keywords: ['ai', 'artificial intelligence', 'deep learning', 'neural'],
      expertise: ['deep learning', 'neural networks', 'nlp', 'computer vision']
    });

    this.registerSpecialist('mlops-engineer', {
      name: 'MLOps Engineer',
      category: 'technical',
      subcategory: 'data-ai',
      path: 'technical/data-ai/mlops-engineer',
      keywords: ['mlops', 'ml operations', 'model deployment'],
      expertise: ['ml pipelines', 'model serving', 'monitoring', 'versioning']
    });

    this.registerSpecialist('prompt-engineer', {
      name: 'Prompt Engineer',
      category: 'technical',
      subcategory: 'data-ai',
      path: 'technical/data-ai/prompt-engineer',
      keywords: ['prompt', 'llm', 'gpt', 'ai prompts'],
      expertise: ['prompt design', 'llm optimization', 'few-shot learning']
    });

    // Technical Specialists - Database (6)
    this.registerSpecialist('database-admin', {
      name: 'Database Administrator',
      category: 'technical',
      subcategory: 'database',
      path: 'technical/database/database-admin',
      keywords: ['database', 'dba', 'administration', 'maintenance'],
      expertise: ['administration', 'backup', 'recovery', 'security']
    });

    this.registerSpecialist('database-optimizer', {
      name: 'Database Optimizer',
      category: 'technical',
      subcategory: 'database',
      path: 'technical/database/database-optimizer',
      keywords: ['optimization', 'performance', 'query', 'index'],
      expertise: ['query optimization', 'indexing', 'performance tuning']
    });

    this.registerSpecialist('sql-specialist', {
      name: 'SQL Specialist',
      category: 'technical',
      subcategory: 'database',
      path: 'technical/database/sql-specialist',
      keywords: ['sql', 'query', 'stored procedures', 'triggers'],
      expertise: ['complex queries', 'stored procedures', 'optimization']
    });

    this.registerSpecialist('backend-architect', {
      name: 'Backend Architect',
      category: 'technical',
      subcategory: 'database',
      path: 'technical/database/backend-architect',
      keywords: ['backend', 'architecture', 'design', 'scalability'],
      expertise: ['system design', 'scalability', 'microservices']
    });

    this.registerSpecialist('api-architect', {
      name: 'API Architect',
      category: 'technical',
      subcategory: 'database',
      path: 'technical/database/api-architect',
      keywords: ['api', 'rest', 'graphql', 'design'],
      expertise: ['api design', 'rest', 'graphql', 'versioning']
    });

    this.registerSpecialist('graphql-architect', {
      name: 'GraphQL Architect',
      category: 'technical',
      subcategory: 'database',
      path: 'technical/database/graphql-architect',
      keywords: ['graphql', 'schema', 'resolvers', 'federation'],
      expertise: ['schema design', 'resolvers', 'federation', 'performance']
    });

    // Technical Specialists - QA (6)
    this.registerSpecialist('test-automator', {
      name: 'Test Automator',
      category: 'technical',
      subcategory: 'qa',
      path: 'technical/qa/test-automator',
      keywords: ['testing', 'automation', 'selenium', 'cypress'],
      expertise: ['test automation', 'ci integration', 'frameworks']
    });

    this.registerSpecialist('performance-engineer', {
      name: 'Performance Engineer',
      category: 'technical',
      subcategory: 'qa',
      path: 'technical/qa/performance-engineer',
      keywords: ['performance', 'load testing', 'stress', 'benchmark'],
      expertise: ['load testing', 'profiling', 'optimization', 'metrics']
    });

    this.registerSpecialist('code-reviewer', {
      name: 'Code Reviewer',
      category: 'technical',
      subcategory: 'qa',
      path: 'technical/qa/code-reviewer',
      keywords: ['code review', 'quality', 'standards', 'best practices'],
      expertise: ['code quality', 'standards', 'refactoring', 'patterns']
    });

    this.registerSpecialist('debugger-specialist', {
      name: 'Debugger Specialist',
      category: 'technical',
      subcategory: 'qa',
      path: 'technical/qa/debugger-specialist',
      keywords: ['debug', 'troubleshoot', 'fix', 'diagnose'],
      expertise: ['debugging', 'profiling', 'tracing', 'root cause']
    });

    this.registerSpecialist('security-auditor', {
      name: 'Security Auditor',
      category: 'technical',
      subcategory: 'qa',
      path: 'technical/qa/security-auditor',
      keywords: ['security', 'audit', 'vulnerability', 'penetration'],
      expertise: ['security audit', 'vulnerability assessment', 'compliance']
    });

    this.registerSpecialist('incident-responder', {
      name: 'Incident Responder',
      category: 'technical',
      subcategory: 'qa',
      path: 'technical/qa/incident-responder',
      keywords: ['incident', 'response', 'outage', 'emergency'],
      expertise: ['incident response', 'root cause', 'recovery', 'postmortem']
    });

    // Technical Specialists - Advanced (7)
    this.registerSpecialist('mobile-developer', {
      name: 'Mobile Developer',
      category: 'technical',
      subcategory: 'advanced',
      path: 'technical/advanced/mobile-developer',
      keywords: ['mobile', 'app', 'android', 'ios'],
      expertise: ['mobile development', 'cross-platform', 'native']
    });

    this.registerSpecialist('ios-developer', {
      name: 'iOS Developer',
      category: 'technical',
      subcategory: 'advanced',
      path: 'technical/advanced/ios-developer',
      keywords: ['ios', 'swift', 'objective-c', 'xcode'],
      expertise: ['swift', 'swiftui', 'uikit', 'app store']
    });

    this.registerSpecialist('flutter-expert', {
      name: 'Flutter Expert',
      category: 'technical',
      subcategory: 'advanced',
      path: 'technical/advanced/flutter-expert',
      keywords: ['flutter', 'dart', 'cross-platform', 'mobile'],
      expertise: ['flutter', 'dart', 'widgets', 'state management']
    });

    this.registerSpecialist('unity-developer', {
      name: 'Unity Developer',
      category: 'technical',
      subcategory: 'advanced',
      path: 'technical/advanced/unity-developer',
      keywords: ['unity', '3d', 'game', 'c#'],
      expertise: ['unity3d', 'game development', 'physics', 'rendering']
    });

    this.registerSpecialist('game-developer', {
      name: 'Game Developer',
      category: 'technical',
      subcategory: 'advanced',
      path: 'technical/advanced/game-developer',
      keywords: ['game', 'gamedev', 'engine', 'graphics'],
      expertise: ['game design', 'engines', 'graphics', 'gameplay']
    });

    this.registerSpecialist('blockchain-engineer', {
      name: 'Blockchain Engineer',
      category: 'technical',
      subcategory: 'advanced',
      path: 'technical/advanced/blockchain-engineer',
      keywords: ['blockchain', 'crypto', 'smart contract', 'web3'],
      expertise: ['smart contracts', 'defi', 'consensus', 'web3']
    });

    // Experience Specialists (10)
    this.registerSpecialist('frontend-developer', {
      name: 'Frontend Developer',
      category: 'experience',
      path: 'experience/frontend-developer',
      keywords: ['frontend', 'ui', 'web', 'spa'],
      expertise: ['html/css', 'javascript', 'frameworks', 'responsive']
    });

    this.registerSpecialist('ui-design', {
      name: 'UI Designer',
      category: 'experience',
      path: 'experience/ui-design',
      keywords: ['ui', 'design', 'interface', 'visual'],
      expertise: ['visual design', 'components', 'styling', 'branding']
    });

    this.registerSpecialist('ux-research', {
      name: 'UX Researcher',
      category: 'experience',
      path: 'experience/ux-research',
      keywords: ['ux', 'user experience', 'research', 'usability'],
      expertise: ['user research', 'usability', 'testing', 'personas']
    });

    this.registerSpecialist('accessibility', {
      name: 'Accessibility Specialist',
      category: 'experience',
      path: 'experience/accessibility',
      keywords: ['accessibility', 'a11y', 'wcag', 'screen reader'],
      expertise: ['wcag', 'aria', 'screen readers', 'inclusive design']
    });

    this.registerSpecialist('performance-specialist', {
      name: 'Performance Specialist',
      category: 'experience',
      path: 'experience/performance-specialist',
      keywords: ['performance', 'optimization', 'speed', 'metrics'],
      expertise: ['web performance', 'optimization', 'metrics', 'profiling']
    });

    this.registerSpecialist('design-system-architect', {
      name: 'Design System Architect',
      category: 'experience',
      path: 'experience/design-system-architect',
      keywords: ['design system', 'components', 'patterns', 'tokens'],
      expertise: ['design systems', 'component libraries', 'patterns']
    });

    this.registerSpecialist('css-specialist', {
      name: 'CSS Specialist',
      category: 'experience',
      path: 'experience/css-specialist',
      keywords: ['css', 'sass', 'styling', 'animations'],
      expertise: ['css3', 'sass/less', 'animations', 'responsive']
    });

    this.registerSpecialist('react-specialist', {
      name: 'React Specialist',
      category: 'experience',
      path: 'experience/react-specialist',
      keywords: ['react', 'hooks', 'jsx', 'components'],
      expertise: ['react', 'hooks', 'state management', 'performance']
    });

    this.registerSpecialist('vue-specialist', {
      name: 'Vue Specialist',
      category: 'experience',
      path: 'experience/vue-specialist',
      keywords: ['vue', 'vuex', 'composition api', 'sfc'],
      expertise: ['vue3', 'composition api', 'vuex', 'nuxt']
    });

    this.registerSpecialist('angular-specialist', {
      name: 'Angular Specialist',
      category: 'experience',
      path: 'experience/angular-specialist',
      keywords: ['angular', 'rxjs', 'typescript', 'components'],
      expertise: ['angular', 'rxjs', 'ngrx', 'material']
    });

    // Strategic Specialists (11)
    this.registerSpecialist('business-analyst', {
      name: 'Business Analyst',
      category: 'strategic',
      path: 'strategic/business-analyst',
      keywords: ['business', 'analysis', 'requirements', 'process'],
      expertise: ['requirements', 'process analysis', 'documentation']
    });

    this.registerSpecialist('product-manager', {
      name: 'Product Manager',
      category: 'strategic',
      path: 'strategic/product-manager',
      keywords: ['product', 'roadmap', 'features', 'prioritization'],
      expertise: ['product strategy', 'roadmapping', 'user stories']
    });

    this.registerSpecialist('market-research', {
      name: 'Market Research Specialist',
      category: 'strategic',
      path: 'strategic/market-research',
      keywords: ['market', 'research', 'analysis', 'trends'],
      expertise: ['market analysis', 'trends', 'competitive analysis']
    });

    this.registerSpecialist('competitive-analysis', {
      name: 'Competitive Analysis Specialist',
      category: 'strategic',
      path: 'strategic/competitive-analysis',
      keywords: ['competitive', 'analysis', 'competitor', 'strategy'],
      expertise: ['competitive intelligence', 'swot', 'positioning']
    });

    this.registerSpecialist('business-model', {
      name: 'Business Model Specialist',
      category: 'strategic',
      path: 'strategic/business-model',
      keywords: ['business model', 'revenue', 'monetization', 'canvas'],
      expertise: ['business models', 'revenue streams', 'value proposition']
    });

    this.registerSpecialist('quant-analyst', {
      name: 'Quantitative Analyst',
      category: 'strategic',
      path: 'strategic/quant-analyst',
      keywords: ['quant', 'quantitative', 'analytics', 'metrics'],
      expertise: ['quantitative analysis', 'metrics', 'modeling']
    });

    this.registerSpecialist('risk-manager', {
      name: 'Risk Manager',
      category: 'strategic',
      path: 'strategic/risk-manager',
      keywords: ['risk', 'management', 'mitigation', 'assessment'],
      expertise: ['risk assessment', 'mitigation', 'compliance']
    });

    this.registerSpecialist('content-marketer', {
      name: 'Content Marketer',
      category: 'strategic',
      path: 'strategic/content-marketer',
      keywords: ['content', 'marketing', 'seo', 'copywriting'],
      expertise: ['content strategy', 'seo', 'copywriting', 'social']
    });

    this.registerSpecialist('sales-automator', {
      name: 'Sales Automator',
      category: 'strategic',
      path: 'strategic/sales-automator',
      keywords: ['sales', 'automation', 'crm', 'pipeline'],
      expertise: ['sales automation', 'crm', 'pipeline', 'conversion']
    });

    this.registerSpecialist('customer-support', {
      name: 'Customer Support Specialist',
      category: 'strategic',
      path: 'strategic/customer-support',
      keywords: ['customer', 'support', 'service', 'help'],
      expertise: ['customer service', 'ticketing', 'knowledge base']
    });

    this.registerSpecialist('legal-advisor', {
      name: 'Legal Advisor',
      category: 'strategic',
      path: 'strategic/legal-advisor',
      keywords: ['legal', 'compliance', 'contracts', 'terms'],
      expertise: ['legal compliance', 'contracts', 'privacy', 'terms']
    });

    // Documentation Specialists (5)
    this.registerSpecialist('docs-architect', {
      name: 'Documentation Architect',
      category: 'documentation',
      path: 'documentation/docs-architect',
      keywords: ['documentation', 'architecture', 'structure', 'organization'],
      expertise: ['doc architecture', 'information structure', 'navigation']
    });

    this.registerSpecialist('api-documenter', {
      name: 'API Documenter',
      category: 'documentation',
      path: 'documentation/api-documenter',
      keywords: ['api', 'documentation', 'openapi', 'swagger'],
      expertise: ['api docs', 'openapi', 'examples', 'references']
    });

    this.registerSpecialist('tutorial-engineer', {
      name: 'Tutorial Engineer',
      category: 'documentation',
      path: 'documentation/tutorial-engineer',
      keywords: ['tutorial', 'guide', 'how-to', 'walkthrough'],
      expertise: ['tutorials', 'guides', 'examples', 'learning paths']
    });

    this.registerSpecialist('reference-builder', {
      name: 'Reference Builder',
      category: 'documentation',
      path: 'documentation/reference-builder',
      keywords: ['reference', 'api reference', 'documentation', 'specs'],
      expertise: ['reference docs', 'api specs', 'technical writing']
    });

    this.registerSpecialist('mermaid-expert', {
      name: 'Mermaid Diagram Expert',
      category: 'documentation',
      path: 'documentation/mermaid-expert',
      keywords: ['mermaid', 'diagram', 'flowchart', 'visualization'],
      expertise: ['mermaid diagrams', 'flowcharts', 'uml', 'visualization']
    });

    // Specialized Domain Specialists (7)
    this.registerSpecialist('payment-integration', {
      name: 'Payment Integration Specialist',
      category: 'specialized',
      path: 'specialized/payment-integration',
      keywords: ['payment', 'stripe', 'paypal', 'billing'],
      expertise: ['payment gateways', 'pci compliance', 'subscriptions']
    });

    this.registerSpecialist('legacy-modernizer', {
      name: 'Legacy Modernizer',
      category: 'specialized',
      path: 'specialized/legacy-modernizer',
      keywords: ['legacy', 'modernization', 'migration', 'refactor'],
      expertise: ['legacy systems', 'modernization', 'migration strategies']
    });

    this.registerSpecialist('context-manager', {
      name: 'Context Manager',
      category: 'specialized',
      path: 'specialized/context-manager',
      keywords: ['context', 'state', 'memory', 'session'],
      expertise: ['context management', 'state persistence', 'memory']
    });

    this.registerSpecialist('search-specialist', {
      name: 'Search Specialist',
      category: 'specialized',
      path: 'specialized/search-specialist',
      keywords: ['search', 'elasticsearch', 'solr', 'indexing'],
      expertise: ['search engines', 'indexing', 'relevance', 'facets']
    });

    this.registerSpecialist('error-detective', {
      name: 'Error Detective',
      category: 'specialized',
      path: 'specialized/error-detective',
      keywords: ['error', 'debugging', 'troubleshooting', 'diagnosis'],
      expertise: ['error analysis', 'root cause', 'debugging', 'logs']
    });

    this.registerSpecialist('developer-experience', {
      name: 'Developer Experience Specialist',
      category: 'specialized',
      path: 'specialized/developer-experience',
      keywords: ['dx', 'developer experience', 'tooling', 'workflow'],
      expertise: ['developer tools', 'workflow', 'productivity', 'dx']
    });

    this.registerSpecialist('architect-reviewer', {
      name: 'Architecture Reviewer',
      category: 'specialized',
      path: 'specialized/architect-reviewer',
      keywords: ['architecture', 'review', 'design', 'patterns'],
      expertise: ['architecture review', 'patterns', 'best practices']
    });

    // Additional mappings for backward compatibility
    this.registerSpecialist('backend-engineer', {
      name: 'Backend Engineer',
      type: 'generalist',
      category: 'technical',
      path: 'technical/backend-engineer',
      keywords: ['backend', 'server', 'api', 'database'],
      expertise: ['backend development', 'apis', 'databases']
    });

    this.registerSpecialist('postgres-specialist', {
      name: 'PostgreSQL Database Specialist',
      category: 'technical',
      subcategory: 'database',
      path: 'technical/database/postgresql-specialist',
      keywords: ['postgres', 'postgresql', 'sql', 'database'],
      expertise: ['postgresql', 'performance', 'replication']
    });

    this.registerSpecialist('security', {
      name: 'Security Specialist',
      category: 'technical',
      path: 'technical/security-specialist',
      keywords: ['security', 'vulnerability', 'penetration', 'audit'],
      expertise: ['security', 'vulnerability assessment', 'compliance']
    });

    this.registerSpecialist('ux-research-specialist', {
      name: 'UX Research Specialist',
      category: 'experience',
      path: 'experience/ux-research-specialist',
      keywords: ['ux', 'research', 'user', 'usability'],
      expertise: ['user research', 'testing', 'analysis']
    });

    this.registerSpecialist('market-research-specialist', {
      name: 'Market Research Specialist',
      category: 'strategic',
      path: 'strategic/market-research-specialist',
      keywords: ['market', 'research', 'analysis'],
      expertise: ['market research', 'analysis', 'trends']
    });

    this.initialized = true;
  }

  registerSpecialist(type, config) {
    this.specialists.set(type, config);
    
    // Add to category mapping
    if (!this.specialistsByCategory.has(config.category)) {
      this.specialistsByCategory.set(config.category, []);
    }
    this.specialistsByCategory.get(config.category).push(type);
    
    // Add keyword mappings for task discovery
    if (config.keywords) {
      config.keywords.forEach(keyword => {
        if (!this.taskMappings.has(keyword)) {
          this.taskMappings.set(keyword, []);
        }
        this.taskMappings.get(keyword).push(type);
      });
    }
  }

  getAllTypes() {
    return Array.from(this.specialists.keys());
  }

  getSpecialist(type) {
    const config = this.specialists.get(type);
    if (!config) {
      // Return generalist for unknown types
      return {
        name: 'Generalist',
        type: 'generalist',
        category: 'general',
        expertise: ['general development']
      };
    }
    
    // Add type to config for consistency
    return { ...config, type };
  }

  findSpecialistsForTask(taskDescription) {
    const startTime = Date.now();
    
    // Check cache first
    this.clearExpiredCache();
    if (this.taskMatchCache.has(taskDescription)) {
      this.performanceMetrics.cacheHits++;
      return this.taskMatchCache.get(taskDescription);
    }
    this.performanceMetrics.cacheMisses++;
    
    const description = taskDescription.toLowerCase();
    const matches = [];
    const scores = new Map();
    
    // Check each keyword
    this.taskMappings.forEach((specialists, keyword) => {
      if (description.includes(keyword)) {
        specialists.forEach(specialist => {
          const currentScore = scores.get(specialist) || 0;
          scores.set(specialist, currentScore + 1);
        });
      }
    });
    
    // Sort by score and return top matches with confidence
    const sortedMatches = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, score]) => {
        const config = this.getSpecialist(type);
        const maxScore = Math.max(...Array.from(scores.values()));
        const confidence = maxScore > 0 ? score / maxScore : 0;
        return {
          type,
          ...config,
          score,
          confidence
        };
      });
    
    const result = sortedMatches.length > 0 ? sortedMatches : [{
      ...this.getSpecialist('backend-engineer'),
      score: 0,
      confidence: 0.5
    }];
    
    // Cache the result
    this.taskMatchCache.set(taskDescription, result);
    
    // Track performance
    this.performanceMetrics.searchTime[taskDescription] = Date.now() - startTime;
    
    return result;
  }

  getSpecialistsByCategory(category) {
    if (!category) {
      // Return all categories
      const categories = {};
      this.specialistsByCategory.forEach((specialists, cat) => {
        categories[cat] = specialists;
      });
      return categories;
    }
    return this.specialistsByCategory.get(category) || [];
  }

  searchBySkillOrTool(query) {
    const searchTerm = query.toLowerCase();
    const results = [];
    
    // Search through all specialists
    this.specialists.forEach((config, type) => {
      let score = 0;
      
      // Check keywords
      if (config.keywords) {
        config.keywords.forEach(keyword => {
          if (keyword.includes(searchTerm) || searchTerm.includes(keyword)) {
            score += 2;
          }
        });
      }
      
      // Check expertise
      if (config.expertise) {
        config.expertise.forEach(skill => {
          if (skill.toLowerCase().includes(searchTerm) || searchTerm.includes(skill.toLowerCase())) {
            score += 1;
          }
        });
      }
      
      // Check name
      if (config.name && config.name.toLowerCase().includes(searchTerm)) {
        score += 1;
      }
      
      if (score > 0) {
        results.push({
          type,
          ...config,
          score,
          confidence: Math.min(score / 5, 1.0)
        });
      }
    });
    
    // Sort by score
    return results.sort((a, b) => b.score - a.score);
  }

  loadSpecialist(type) {
    const startTime = Date.now();
    
    // Check cache first
    if (this.loadedSpecialists.has(type)) {
      this.performanceMetrics.cacheHits++;
      return this.loadedSpecialists.get(type);
    }
    this.performanceMetrics.cacheMisses++;
    
    const config = this.getSpecialist(type);
    if (!config || config.type === 'generalist') {
      return null;
    }
    
    try {
      const specialistPath = path.join(__dirname, config.path);
      
      // Try different file extensions and naming patterns
      const possiblePaths = [
        `${specialistPath}.js`,
        `${specialistPath}-specialist.js`,
        specialistPath
      ];
      
      for (const tryPath of possiblePaths) {
        if (fs.existsSync(tryPath)) {
          const SpecialistClass = require(tryPath);
          
          // Cache the loaded class
          this.loadedSpecialists.set(type, SpecialistClass);
          
          // Track performance
          this.performanceMetrics.loadTime[type] = Date.now() - startTime;
          
          return SpecialistClass;
        }
      }
      
      console.warn(`Specialist file not found for ${type} at ${specialistPath}`);
      return null;
    } catch (error) {
      console.error(`Error loading specialist ${type}:`, error.message);
      return null;
    }
  }
  
  // Get or create a specialist instance with caching
  getSpecialistInstance(type, department = 'default', context = {}) {
    const cacheKey = `${type}-${department}`;
    
    // Check instance cache
    if (this.instanceCache.has(cacheKey)) {
      this.performanceMetrics.cacheHits++;
      return this.instanceCache.get(cacheKey);
    }
    
    const SpecialistClass = this.loadSpecialist(type);
    if (!SpecialistClass) {
      return null;
    }
    
    try {
      const instance = new SpecialistClass(department, context);
      this.instanceCache.set(cacheKey, instance);
      return instance;
    } catch (error) {
      console.error(`Error instantiating specialist ${type}:`, error.message);
      return null;
    }
  }
  
  // Clear expired cache entries
  clearExpiredCache() {
    const now = Date.now();
    if (now - this.lastCacheClear > this.cacheTimeout) {
      this.searchCache.clear();
      this.taskMatchCache.clear();
      this.lastCacheClear = now;
    }
  }
  
  // Get performance metrics
  getPerformanceMetrics() {
    const avgLoadTime = Object.values(this.performanceMetrics.loadTime).reduce((a, b) => a + b, 0) / 
                       (Object.keys(this.performanceMetrics.loadTime).length || 1);
    const avgSearchTime = Object.values(this.performanceMetrics.searchTime).reduce((a, b) => a + b, 0) / 
                         (Object.keys(this.performanceMetrics.searchTime).length || 1);
    
    return {
      ...this.performanceMetrics,
      averageLoadTime: avgLoadTime,
      averageSearchTime: avgSearchTime,
      cacheHitRate: this.performanceMetrics.cacheHits / 
                    (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses || 1)
    };
  }
  
  // Clear all caches
  clearAllCaches() {
    this.loadedSpecialists.clear();
    this.instanceCache.clear();
    this.searchCache.clear();
    this.taskMatchCache.clear();
    this.lastCacheClear = Date.now();
  }

  isSpecialistAvailable(type) {
    return this.specialists.has(type);
  }

  getSpecialistCount() {
    return this.specialists.size;
  }

  getSpecialistCapabilities(type) {
    const config = this.getSpecialist(type);
    return config ? config.expertise : [];
  }
}

// Export singleton instance
const specialistRegistry = new SpecialistRegistry();

// Primary export is the instance for backward compatibility
  module.exports = specialistRegistry;

  // Also attach class and named exports
  module.exports.SpecialistRegistry = SpecialistRegistry;
  module.exports.registry = specialistRegistry;
} // End of else block for non-lazy loading