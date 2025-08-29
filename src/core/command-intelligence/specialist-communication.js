/**
 * BUMBA Specialist Communication Protocol
 * Handles communication between managers and specialists
 */

const { logger } = require('../logging/bumba-logger');
const { getInstance: getSelector } = require('./specialist-selector');

class SpecialistCommunication {
  constructor() {
    this.selector = getSelector();
    this.messageQueue = new Map();
    this.responses = new Map();
  }

  /**
   * Manager requests specialist analysis
   */
  async requestSpecialistAnalysis(managerDept, command, args, context, specialists) {
    logger.info(`🔄 Manager ${managerDept} requesting analysis from ${specialists.length} specialists`);
    
    const request = {
      id: `req_${Date.now()}`,
      from: managerDept,
      command,
      args,
      context,
      timestamp: new Date().toISOString()
    };
    
    const analyses = [];
    
    for (const specialist of specialists) {
      const analysis = await this.getSpecialistAnalysis(specialist, request);
      analyses.push(analysis);
    }
    
    return this.synthesizeAnalyses(analyses);
  }

  /**
   * Get analysis from a specific specialist
   */
  async getSpecialistAnalysis(specialist, request) {
    logger.info(`🧠 ${specialist.type} analyzing: ${request.command}`);
    
    // Simulate specialist processing based on type
    const analysis = {
      specialist: specialist.type,
      command: request.command,
      timestamp: new Date().toISOString(),
      insights: [],
      recommendations: [],
      concerns: [],
      requirements: []
    };
    
    // Generate specialist-specific insights
    switch(specialist.type) {
      case 'requirements-analyst':
        analysis.insights = [
          `Feature "${request.args.join(' ')}" requires clear acceptance criteria`,
          'User stories should cover all stakeholder perspectives',
          'Non-functional requirements need explicit definition'
        ];
        analysis.requirements = [
          'User authentication and authorization',
          'Data validation and error handling',
          'Performance metrics and SLAs'
        ];
        break;
        
      case 'ui-designer':
        analysis.insights = [
          'Interface should follow established design system',
          'Mobile-first responsive design required',
          'Accessibility standards (WCAG 2.1 AA) must be met'
        ];
        analysis.recommendations = [
          'Use component-based architecture',
          'Implement progressive enhancement',
          'Include loading states and error feedback'
        ];
        break;
        
      case 'backend-architect':
        analysis.insights = [
          'RESTful API design with proper versioning',
          'Implement caching strategy for performance',
          'Consider microservices architecture for scalability'
        ];
        analysis.concerns = [
          'Database connection pooling needed',
          'Rate limiting and throttling required',
          'API security and authentication critical'
        ];
        break;
        
      case 'security-engineer':
        analysis.insights = [
          'Implement OAuth 2.0 / JWT for authentication',
          'Data encryption at rest and in transit',
          'Regular security audits and penetration testing'
        ];
        analysis.concerns = [
          'SQL injection prevention',
          'XSS and CSRF protection',
          'Secure secret management'
        ];
        break;
        
      default:
        analysis.insights = [
          `General analysis for ${request.command}`,
          'Standard best practices should be followed',
          'Consider scalability and maintainability'
        ];
    }
    
    return analysis;
  }

  /**
   * Synthesize multiple specialist analyses
   */
  synthesizeAnalyses(analyses) {
    const synthesis = {
      totalSpecialists: analyses.length,
      timestamp: new Date().toISOString(),
      insights: [],
      recommendations: [],
      concerns: [],
      requirements: [],
      consensus: {}
    };
    
    // Combine all insights
    for (const analysis of analyses) {
      synthesis.insights.push(...(analysis.insights || []));
      synthesis.recommendations.push(...(analysis.recommendations || []));
      synthesis.concerns.push(...(analysis.concerns || []));
      synthesis.requirements.push(...(analysis.requirements || []));
    }
    
    // Remove duplicates
    synthesis.insights = [...new Set(synthesis.insights)];
    synthesis.recommendations = [...new Set(synthesis.recommendations)];
    synthesis.concerns = [...new Set(synthesis.concerns)];
    synthesis.requirements = [...new Set(synthesis.requirements)];
    
    // Determine consensus areas
    synthesis.consensus = {
      priority: this.determinePriority(analyses),
      complexity: this.determineComplexity(analyses),
      timeline: this.estimateTimeline(analyses)
    };
    
    return synthesis;
  }

  /**
   * Determine priority from analyses
   */
  determinePriority(analyses) {
    const hasSecurity = analyses.some(a => a.specialist === 'security-engineer');
    const hasRequirements = analyses.some(a => a.requirements && a.requirements.length > 0);
    
    if (hasSecurity && analyses.find(a => a.specialist === 'security-engineer').concerns.length > 0) {
      return 'critical';
    }
    if (hasRequirements && analyses.length > 3) {
      return 'high';
    }
    return 'medium';
  }

  /**
   * Determine complexity from analyses
   */
  determineComplexity(analyses) {
    const totalConcerns = analyses.reduce((sum, a) => sum + (a.concerns?.length || 0), 0);
    const totalRequirements = analyses.reduce((sum, a) => sum + (a.requirements?.length || 0), 0);
    
    if (totalConcerns > 5 || totalRequirements > 8) return 'high';
    if (totalConcerns > 2 || totalRequirements > 4) return 'medium';
    return 'low';
  }

  /**
   * Estimate timeline from analyses
   */
  estimateTimeline(analyses) {
    const complexity = this.determineComplexity(analyses);
    const specialistCount = analyses.length;
    
    if (complexity === 'high' || specialistCount > 4) {
      return '4-6 weeks';
    }
    if (complexity === 'medium' || specialistCount > 2) {
      return '2-3 weeks';
    }
    return '1-2 weeks';
  }

  /**
   * Manager sends directive to specialists
   */
  async sendDirective(managerDept, specialists, directive) {
    logger.info(`📢 Manager ${managerDept} sending directive to specialists`);
    
    const message = {
      id: `dir_${Date.now()}`,
      from: managerDept,
      to: specialists.map(s => s.type),
      directive,
      timestamp: new Date().toISOString()
    };
    
    this.messageQueue.set(message.id, message);
    
    // Process directive responses
    const responses = [];
    for (const specialist of specialists) {
      responses.push({
        specialist: specialist.type,
        acknowledged: true,
        readyToExecute: true
      });
    }
    
    return responses;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  SpecialistCommunication,
  getInstance: () => {
    if (!instance) {
      instance = new SpecialistCommunication();
    }
    return instance;
  }
};