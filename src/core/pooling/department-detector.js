/**
 * Department Focus Detector for Intelligent Pooling
 * Detects which department/team focus from prompts and context
 */

const { logger } = require('../logging/bumba-logger');

class DepartmentDetector {
  constructor() {
    // Enhanced department definitions with multi-level keywords
    this.departmentDefinitions = {
      BACKEND: {
        primary: ['api', 'server', 'backend', 'endpoint', 'microservice', 'rest', 'graphql'],
        secondary: ['database', 'sql', 'nosql', 'mongodb', 'postgres', 'redis', 'cache'],
        tertiary: ['auth', 'authentication', 'authorization', 'jwt', 'oauth', 'session'],
        frameworks: ['express', 'fastapi', 'django', 'spring', 'rails', 'nestjs'],
        patterns: ['mvc', 'repository', 'service-layer', 'middleware'],
        specialists: {
          core: ['backend-engineer', 'api-architect', 'database-specialist'],
          support: ['security-specialist', 'cache-specialist', 'integration-engineer'],
          optional: ['microservices-architect', 'graphql-specialist']
        },
        weight: 1.2
      },
      
      FRONTEND: {
        primary: ['ui', 'frontend', 'component', 'interface', 'ux', 'design', 'layout'],
        secondary: ['react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxt', 'gatsby'],
        tertiary: ['css', 'style', 'animation', 'responsive', 'mobile-first', 'accessibility'],
        frameworks: ['tailwind', 'bootstrap', 'material-ui', 'antd', 'chakra'],
        patterns: ['component-driven', 'atomic-design', 'state-management', 'hooks'],
        specialists: {
          core: ['frontend-developer', 'ui-designer', 'ux-researcher'],
          support: ['css-specialist', 'react-specialist', 'vue-specialist'],
          optional: ['animation-specialist', 'accessibility-specialist']
        },
        weight: 1.2
      },
      
      MOBILE: {
        primary: ['mobile', 'app', 'ios', 'android', 'native', 'cross-platform'],
        secondary: ['swift', 'kotlin', 'java', 'objective-c', 'flutter', 'react-native'],
        tertiary: ['xcode', 'android-studio', 'gradle', 'cocoapods', 'expo'],
        frameworks: ['swiftui', 'jetpack-compose', 'xamarin', 'ionic'],
        patterns: ['mvvm', 'mvc', 'viper', 'clean-architecture'],
        specialists: {
          core: ['ios-developer', 'android-developer', 'mobile-architect'],
          support: ['react-native-specialist', 'flutter-specialist', 'mobile-ui-designer'],
          optional: ['mobile-security-specialist', 'app-store-optimizer']
        },
        weight: 1.1
      },
      
      DATA: {
        primary: ['data', 'analytics', 'ml', 'ai', 'machine-learning', 'deep-learning'],
        secondary: ['pipeline', 'etl', 'warehouse', 'lake', 'streaming', 'batch'],
        tertiary: ['pandas', 'numpy', 'tensorflow', 'pytorch', 'scikit-learn', 'spark'],
        frameworks: ['airflow', 'kafka', 'flink', 'beam', 'dbt'],
        patterns: ['feature-engineering', 'model-training', 'data-cleaning', 'visualization'],
        specialists: {
          core: ['data-engineer', 'ml-engineer', 'data-scientist'],
          support: ['data-analyst', 'pipeline-specialist', 'ai-researcher'],
          optional: ['nlp-specialist', 'computer-vision-specialist']
        },
        weight: 1.0
      },
      
      INFRASTRUCTURE: {
        primary: ['devops', 'infrastructure', 'cloud', 'aws', 'azure', 'gcp', 'kubernetes'],
        secondary: ['docker', 'container', 'orchestration', 'deployment', 'ci/cd', 'pipeline'],
        tertiary: ['terraform', 'ansible', 'helm', 'jenkins', 'github-actions', 'gitlab-ci'],
        frameworks: ['eks', 'aks', 'gke', 'fargate', 'lambda', 'cloud-functions'],
        patterns: ['gitops', 'infrastructure-as-code', 'immutable-infrastructure'],
        specialists: {
          core: ['devops-engineer', 'cloud-architect', 'sre-specialist'],
          support: ['infrastructure-engineer', 'kubernetes-specialist', 'security-engineer'],
          optional: ['cost-optimizer', 'disaster-recovery-specialist']
        },
        weight: 1.1
      },
      
      STRATEGIC: {
        primary: ['business', 'strategy', 'product', 'market', 'customer', 'revenue'],
        secondary: ['roadmap', 'planning', 'analysis', 'research', 'competitive', 'stakeholder'],
        tertiary: ['okr', 'kpi', 'metric', 'growth', 'retention', 'acquisition'],
        frameworks: ['lean', 'agile', 'scrum', 'kanban', 'six-sigma'],
        patterns: ['product-market-fit', 'go-to-market', 'user-journey', 'value-proposition'],
        specialists: {
          core: ['product-strategist', 'business-analyst', 'market-researcher'],
          support: ['product-owner', 'project-manager', 'growth-hacker'],
          optional: ['competitive-analyst', 'pricing-strategist']
        },
        weight: 0.9
      },
      
      SECURITY: {
        primary: ['security', 'vulnerability', 'threat', 'exploit', 'penetration', 'audit'],
        secondary: ['encryption', 'ssl', 'tls', 'firewall', 'waf', 'ids', 'ips'],
        tertiary: ['owasp', 'cve', 'compliance', 'gdpr', 'pci', 'hipaa', 'sox'],
        frameworks: ['metasploit', 'burp', 'nmap', 'wireshark', 'snort'],
        patterns: ['zero-trust', 'defense-in-depth', 'least-privilege', 'security-by-design'],
        specialists: {
          core: ['security-specialist', 'security-architect', 'penetration-tester'],
          support: ['compliance-officer', 'security-auditor', 'incident-responder'],
          optional: ['forensics-specialist', 'cryptography-specialist']
        },
        weight: 1.3
      },
      
      QUALITY: {
        primary: ['test', 'qa', 'quality', 'testing', 'automation', 'validation'],
        secondary: ['unit', 'integration', 'e2e', 'acceptance', 'regression', 'performance'],
        tertiary: ['jest', 'mocha', 'cypress', 'selenium', 'playwright', 'junit'],
        frameworks: ['testcafe', 'puppeteer', 'appium', 'jmeter', 'gatling'],
        patterns: ['tdd', 'bdd', 'atdd', 'test-pyramid', 'shift-left'],
        specialists: {
          core: ['qa-engineer', 'test-automation-specialist', 'quality-analyst'],
          support: ['performance-tester', 'accessibility-tester', 'test-architect'],
          optional: ['test-data-engineer', 'chaos-engineer']
        },
        weight: 1.0
      }
    };
    
    // Multi-department combinations
    this.multiDepartmentPatterns = {
      'FULLSTACK': ['BACKEND', 'FRONTEND'],
      'DEVSECOPS': ['INFRASTRUCTURE', 'SECURITY'],
      'DATA_PLATFORM': ['DATA', 'INFRASTRUCTURE'],
      'PRODUCT_ENGINEERING': ['STRATEGIC', 'BACKEND', 'FRONTEND'],
      'MOBILE_PLATFORM': ['MOBILE', 'BACKEND']
    };
    
    // Current detection state
    this.detectionHistory = [];
    this.confidenceThreshold = 0.3;
    
    logger.debug('Department detector initialized with 8 departments');
  }
  
  /**
   * Detect department focus from context
   */
  detectDepartment(context = {}) {
    const { prompt = '', recentTasks = [], technologies = [], files = [] } = context;
    
    // Combine all text
    const allText = [
      prompt,
      ...recentTasks,
      ...technologies,
      ...files.map(f => f.toLowerCase())
    ].join(' ').toLowerCase();
    
    const scores = {};
    
    // Score each department
    for (const [dept, definition] of Object.entries(this.departmentDefinitions)) {
      let score = 0;
      
      // Primary keywords (highest weight)
      score += this.scoreKeywords(allText, definition.primary, 3.0 * definition.weight);
      
      // Secondary keywords
      score += this.scoreKeywords(allText, definition.secondary, 2.0 * definition.weight);
      
      // Tertiary keywords
      score += this.scoreKeywords(allText, definition.tertiary, 1.0 * definition.weight);
      
      // Framework mentions
      score += this.scoreKeywords(allText, definition.frameworks, 2.5 * definition.weight);
      
      // Pattern mentions
      score += this.scoreKeywords(allText, definition.patterns, 1.5 * definition.weight);
      
      // File extension bonus
      score += this.scoreFileExtensions(files, dept);
      
      scores[dept] = score;
    }
    
    // Detect multi-department scenarios
    const multiDept = this.detectMultiDepartment(scores);
    
    // Get primary department
    const sorted = Object.entries(scores)
      .sort((a, b) => b[1] - a[1]);
    
    const primary = sorted[0];
    const secondary = sorted[1];
    
    // Calculate confidence
    const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
    const confidence = totalScore > 0 ? primary[1] / totalScore : 0;
    
    // Build result
    const result = {
      primary: primary[0],
      primaryScore: primary[1],
      confidence,
      secondary: confidence < 0.6 && secondary[1] > primary[1] * 0.5 ? secondary[0] : null,
      multiDepartment: multiDept,
      allScores: scores,
      specialists: this.getDepartmentSpecialists(primary[0], multiDept)
    };
    
    // Update history
    this.updateDetectionHistory(result);
    
    logger.debug(`Department detected: ${result.primary} (confidence: ${confidence.toFixed(2)})`);
    
    return result;
  }
  
  /**
   * Score keywords with weight
   */
  scoreKeywords(text, keywords, weight) {
    let score = 0;
    
    for (const keyword of keywords) {
      // Exact word match gets full weight
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = (text.match(regex) || []).length;
      score += matches * weight;
      
      // Partial match gets half weight
      if (matches === 0 && text.includes(keyword)) {
        score += weight * 0.5;
      }
    }
    
    return score;
  }
  
  /**
   * Score based on file extensions
   */
  scoreFileExtensions(files, department) {
    const extensionMap = {
      BACKEND: ['.js', '.ts', '.py', '.java', '.go', '.rb', '.php'],
      FRONTEND: ['.jsx', '.tsx', '.vue', '.html', '.css', '.scss'],
      MOBILE: ['.swift', '.kt', '.dart', '.m', '.mm'],
      DATA: ['.ipynb', '.py', '.r', '.scala', '.parquet'],
      INFRASTRUCTURE: ['.yml', '.yaml', '.tf', '.sh', 'Dockerfile'],
      SECURITY: ['.pem', '.key', '.crt', '.sec'],
      QUALITY: ['.test.', '.spec.', '.e2e.']
    };
    
    const extensions = extensionMap[department] || [];
    let score = 0;
    
    for (const file of files) {
      for (const ext of extensions) {
        if (file.includes(ext)) {
          score += 2;
        }
      }
    }
    
    return Math.min(score, 10); // Cap at 10
  }
  
  /**
   * Detect multi-department scenarios
   */
  detectMultiDepartment(scores) {
    const threshold = 0.4; // Departments must have at least 40% of top score
    const topScore = Math.max(...Object.values(scores));
    
    const activeDepartments = Object.entries(scores)
      .filter(([_, score]) => score >= topScore * threshold)
      .map(([dept]) => dept);
    
    // Check for known patterns
    for (const [pattern, depts] of Object.entries(this.multiDepartmentPatterns)) {
      if (depts.every(d => activeDepartments.includes(d))) {
        return {
          pattern,
          departments: depts,
          detected: true
        };
      }
    }
    
    // Return custom multi-department if multiple high scores
    if (activeDepartments.length > 1) {
      return {
        pattern: 'CUSTOM',
        departments: activeDepartments.slice(0, 3), // Max 3 departments
        detected: true
      };
    }
    
    return null;
  }
  
  /**
   * Get specialists for department(s)
   */
  getDepartmentSpecialists(department, multiDept = null) {
    const specialists = [];
    
    if (multiDept && multiDept.detected) {
      // Combine specialists from multiple departments
      for (const dept of multiDept.departments) {
        const definition = this.departmentDefinitions[dept];
        if (definition) {
          specialists.push(...definition.specialists.core.map(s => ({
            type: s,
            department: dept,
            priority: 'core'
          })));
        }
      }
    } else {
      // Single department
      const definition = this.departmentDefinitions[department];
      if (definition) {
        // Add core specialists
        specialists.push(...definition.specialists.core.map(s => ({
          type: s,
          department,
          priority: 'core'
        })));
        
        // Add support specialists
        specialists.push(...definition.specialists.support.map(s => ({
          type: s,
          department,
          priority: 'support'
        })));
      }
    }
    
    // Remove duplicates
    const unique = new Map();
    for (const spec of specialists) {
      if (!unique.has(spec.type) || spec.priority === 'core') {
        unique.set(spec.type, spec);
      }
    }
    
    return Array.from(unique.values());
  }
  
  /**
   * Update detection history
   */
  updateDetectionHistory(result) {
    this.detectionHistory.push({
      ...result,
      timestamp: Date.now()
    });
    
    // Keep only last 20 detections
    if (this.detectionHistory.length > 20) {
      this.detectionHistory.shift();
    }
  }
  
  /**
   * Get department trends
   */
  getDepartmentTrends() {
    const trends = {};
    
    // Count occurrences in history
    for (const detection of this.detectionHistory) {
      const dept = detection.primary;
      trends[dept] = (trends[dept] || 0) + 1;
    }
    
    // Calculate percentages
    const total = this.detectionHistory.length;
    for (const dept in trends) {
      trends[dept] = {
        count: trends[dept],
        percentage: (trends[dept] / total * 100).toFixed(1)
      };
    }
    
    return trends;
  }
  
  /**
   * Get recommended departments based on time
   */
  getTimeBasedDepartments() {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    // Weekday patterns
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      if (hour >= 9 && hour <= 11) {
        // Morning: Planning and architecture
        return ['STRATEGIC', 'BACKEND'];
      } else if (hour >= 11 && hour <= 15) {
        // Core development hours
        return ['BACKEND', 'FRONTEND', 'MOBILE'];
      } else if (hour >= 15 && hour <= 17) {
        // Testing and quality
        return ['QUALITY', 'SECURITY'];
      } else if (hour >= 17 && hour <= 19) {
        // Deployment and infrastructure
        return ['INFRASTRUCTURE', 'DEVOPS'];
      }
    }
    
    // Weekend patterns
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // More experimental work
      return ['DATA', 'MOBILE', 'FRONTEND'];
    }
    
    return [];
  }
  
  /**
   * Export state for persistence
   */
  export() {
    return {
      detectionHistory: this.detectionHistory,
      confidenceThreshold: this.confidenceThreshold
    };
  }
  
  /**
   * Import state
   */
  import(state) {
    if (state.detectionHistory) this.detectionHistory = state.detectionHistory;
    if (state.confidenceThreshold) this.confidenceThreshold = state.confidenceThreshold;
    
    logger.debug('Department detector state imported');
  }
}

module.exports = { DepartmentDetector };