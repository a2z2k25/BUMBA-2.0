/**
 * BUMBA Product Strategist Department Manager (Lazy Loading Version)
 * Memory-optimized version with on-demand specialist loading
 */

const LazyDepartmentManager = require('./lazy-department-manager');
const { logger } = require('../logging/bumba-logger');

class ProductStrategistManagerLazy extends LazyDepartmentManager {
  constructor() {
    super('Product-Strategy');
    
    // Register all specialists with metadata (no loading yet)
    this.registerProductSpecialists();
    
    // Department-specific configuration
    this.config = {
      maxConcurrentTasks: 3,
      defaultTimeout: 35000,
      retryAttempts: 2,
      priorityQueue: true,
      analysisCache: true,
      insightAggregation: true
    };
    
    logger.info('📊 Product Strategist Department Manager (Lazy) initialized');
  }

  /**
   * Register all product strategy specialists without loading them
   */
  registerProductSpecialists() {
    // Core product specialists
    this.registerSpecialist('ProductManager', {
      path: '../specialists/strategic/product-manager',
      description: 'Product management and roadmap planning',
      capabilities: ['product-strategy', 'roadmap', 'prioritization', 'metrics'],
      priority: 'high',
      memoryEstimate: 'medium'
    });

    this.registerSpecialist('BusinessAnalyst', {
      path: '../specialists/strategic/business-analyst',
      description: 'Business analysis and requirements',
      capabilities: ['requirements', 'analysis', 'stakeholder-management', 'documentation'],
      priority: 'high',
      memoryEstimate: 'low'
    });

    this.registerSpecialist('MarketResearch', {
      path: '../specialists/strategic/market-research',
      description: 'Market research and competitive analysis',
      capabilities: ['market-analysis', 'competitor-research', 'trends', 'positioning'],
      priority: 'medium',
      memoryEstimate: 'medium'
    });

    // Business strategy specialists
    this.registerSpecialist('BusinessModel', {
      path: '../specialists/strategic/business-model',
      description: 'Business model design and validation',
      capabilities: ['business-model', 'revenue', 'cost-structure', 'value-proposition'],
      priority: 'medium',
      memoryEstimate: 'low'
    });

    this.registerSpecialist('CompetitiveAnalysis', {
      path: '../specialists/strategic/competitive-analysis',
      description: 'Competitive intelligence and analysis',
      capabilities: ['competitor-analysis', 'swot', 'market-positioning', 'benchmarking'],
      priority: 'medium',
      memoryEstimate: 'medium'
    });

    // Customer and marketing specialists
    this.registerSpecialist('CustomerSupport', {
      path: '../specialists/strategic/customer-support',
      description: 'Customer support strategy and processes',
      capabilities: ['support-strategy', 'customer-success', 'feedback', 'retention'],
      priority: 'medium',
      memoryEstimate: 'low'
    });

    this.registerSpecialist('ContentMarketer', {
      path: '../specialists/strategic/content-marketer',
      description: 'Content marketing and strategy',
      capabilities: ['content-strategy', 'seo', 'copywriting', 'campaigns'],
      priority: 'low',
      memoryEstimate: 'low'
    });

    this.registerSpecialist('SalesAutomator', {
      path: '../specialists/strategic/sales-automator',
      description: 'Sales automation and CRM strategy',
      capabilities: ['sales-automation', 'crm', 'lead-generation', 'funnel-optimization'],
      priority: 'low',
      memoryEstimate: 'medium'
    });

    // Risk and compliance specialists
    this.registerSpecialist('RiskManager', {
      path: '../specialists/strategic/risk-manager',
      description: 'Risk assessment and management',
      capabilities: ['risk-assessment', 'mitigation', 'compliance', 'governance'],
      priority: 'medium',
      memoryEstimate: 'low'
    });

    this.registerSpecialist('LegalAdvisor', {
      path: '../specialists/strategic/legal-advisor',
      description: 'Legal compliance and advisory',
      capabilities: ['legal-compliance', 'contracts', 'ip', 'regulations'],
      priority: 'low',
      memoryEstimate: 'low'
    });

    // Analytics specialists
    this.registerSpecialist('QuantAnalyst', {
      path: '../specialists/strategic/quant-analyst',
      description: 'Quantitative analysis and modeling',
      capabilities: ['quantitative-analysis', 'modeling', 'statistics', 'forecasting'],
      priority: 'medium',
      memoryEstimate: 'high'
    });

    // Data and AI specialists
    this.registerSpecialist('DataScientist', {
      path: '../specialists/technical/data-ai/data-scientist',
      description: 'Data science and analytics',
      capabilities: ['data-science', 'ml', 'analytics', 'insights'],
      priority: 'medium',
      memoryEstimate: 'high'
    });

    this.registerSpecialist('AIEngineer', {
      path: '../specialists/technical/data-ai/ai-engineer',
      description: 'AI strategy and implementation',
      capabilities: ['ai-strategy', 'ml-models', 'automation', 'nlp'],
      priority: 'low',
      memoryEstimate: 'high'
    });

    logger.debug(`📋 Registered ${this.specialistMetadata.size} product strategy specialists (not loaded)`);
  }

  /**
   * Intelligent task routing with lazy loading
   */
  async routeTask(task) {
    logger.info(`🔄 Routing product strategy task: ${task.type || 'general'}`);
    
    // Determine which specialist to load based on task
    const specialistName = this.selectSpecialist(task);
    
    if (!specialistName) {
      throw new Error(`No specialist found for task type: ${task.type}`);
    }

    // Lazy load the specialist
    const specialist = await this.getSpecialist(specialistName);
    
    // Execute task
    const result = await this.executeWithSpecialist(specialist, task);
    
    return {
      specialist: specialistName,
      result,
      cached: this.loadedSpecialists.has(specialistName)
    };
  }

  /**
   * Select appropriate specialist based on task
   */
  selectSpecialist(task) {
    const taskType = (task.type || '').toLowerCase();
    const keywords = (task.description || '').toLowerCase();
    
    // Map task types to specialists
    const specialistMap = {
      'product': 'ProductManager',
      'roadmap': 'ProductManager',
      'business': 'BusinessAnalyst',
      'requirements': 'BusinessAnalyst',
      'market': 'MarketResearch',
      'competitor': 'CompetitiveAnalysis',
      'competition': 'CompetitiveAnalysis',
      'business-model': 'BusinessModel',
      'revenue': 'BusinessModel',
      'customer': 'CustomerSupport',
      'support': 'CustomerSupport',
      'content': 'ContentMarketer',
      'marketing': 'ContentMarketer',
      'sales': 'SalesAutomator',
      'crm': 'SalesAutomator',
      'risk': 'RiskManager',
      'compliance': 'RiskManager',
      'legal': 'LegalAdvisor',
      'quant': 'QuantAnalyst',
      'analytics': 'DataScientist',
      'data': 'DataScientist',
      'ai': 'AIEngineer',
      'ml': 'AIEngineer'
    };

    // Check direct mapping
    if (specialistMap[taskType]) {
      return specialistMap[taskType];
    }

    // Check keywords in description
    for (const [keyword, specialist] of Object.entries(specialistMap)) {
      if (keywords.includes(keyword)) {
        return specialist;
      }
    }

    // Default to Product Manager for general strategy tasks
    return 'ProductManager';
  }

  /**
   * Execute task with specialist
   */
  async executeWithSpecialist(specialist, task) {
    try {
      // Check if specialist has execute method
      if (typeof specialist.execute === 'function') {
        return await specialist.execute(task);
      }
      
      // Fallback to process method
      if (typeof specialist.process === 'function') {
        return await specialist.process(task);
      }
      
      // Generic execution
      return {
        success: true,
        message: `Task processed by ${specialist.constructor.name}`,
        task
      };
      
    } catch (error) {
      logger.error(`Specialist execution failed:`, error);
      throw error;
    }
  }

  /**
   * Preload commonly used specialists
   */
  async warmupCache() {
    const commonSpecialists = [
      'ProductManager',
      'BusinessAnalyst',
      'MarketResearch'
    ];

    logger.info('🔥 Warming up product strategy specialist cache...');
    
    const result = await this.preloadSpecialists(commonSpecialists);
    
    logger.info(`✅ Cache warmed: ${result.loaded} loaded, ${result.failed} failed`);
    
    return result;
  }

  /**
   * Handle product strategy-specific operations
   */
  async handleStrategyOperation(operation, params) {
    switch (operation) {
      case 'roadmap-planning':
        const pm = await this.getSpecialist('ProductManager');
        return await pm.planRoadmap(params);
        
      case 'market-analysis':
        const market = await this.getSpecialist('MarketResearch');
        return await market.analyze(params);
        
      case 'competitor-analysis':
        const competitor = await this.getSpecialist('CompetitiveAnalysis');
        return await competitor.analyze(params);
        
      case 'business-requirements':
        const ba = await this.getSpecialist('BusinessAnalyst');
        return await ba.gatherRequirements(params);
        
      case 'risk-assessment':
        const risk = await this.getSpecialist('RiskManager');
        return await risk.assess(params);
        
      case 'data-insights':
        const data = await this.getSpecialist('DataScientist');
        return await data.generateInsights(params);
        
      default:
        throw new Error(`Unknown strategy operation: ${operation}`);
    }
  }

  /**
   * Aggregate insights from multiple specialists
   */
  async aggregateInsights(topic) {
    const insights = [];
    
    // Collect insights from relevant specialists
    const relevantSpecialists = this.getRelevantSpecialists(topic);
    
    for (const specialistName of relevantSpecialists) {
      try {
        const specialist = await this.getSpecialist(specialistName);
        if (typeof specialist.getInsights === 'function') {
          const specialistInsights = await specialist.getInsights(topic);
          insights.push({
            source: specialistName,
            insights: specialistInsights
          });
        }
      } catch (error) {
        logger.warn(`Failed to get insights from ${specialistName}:`, error.message);
      }
    }
    
    return {
      topic,
      timestamp: new Date().toISOString(),
      sources: insights.length,
      insights
    };
  }

  /**
   * Get relevant specialists for a topic
   */
  getRelevantSpecialists(topic) {
    const topicLower = topic.toLowerCase();
    const relevant = [];
    
    // Map topics to specialist groups
    const topicMap = {
      'product': ['ProductManager', 'BusinessAnalyst', 'MarketResearch'],
      'market': ['MarketResearch', 'CompetitiveAnalysis', 'DataScientist'],
      'customer': ['CustomerSupport', 'ProductManager', 'DataScientist'],
      'business': ['BusinessModel', 'BusinessAnalyst', 'RiskManager'],
      'growth': ['ContentMarketer', 'SalesAutomator', 'DataScientist']
    };
    
    for (const [key, specialists] of Object.entries(topicMap)) {
      if (topicLower.includes(key)) {
        relevant.push(...specialists);
      }
    }
    
    // Return unique specialists
    return [...new Set(relevant)];
  }

  /**
   * Get department status including memory stats
   */
  getStatus() {
    const memoryStats = this.getMemoryStats();
    
    return {
      department: 'Product Strategy',
      status: 'active',
      specialists: memoryStats.specialists,
      performance: memoryStats.performance,
      memory: memoryStats.memory,
      config: this.config
    };
  }
}

module.exports = ProductStrategistManagerLazy;