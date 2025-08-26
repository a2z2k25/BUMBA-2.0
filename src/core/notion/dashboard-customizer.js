/**
 * BUMBA Dashboard Customizer
 * Intelligent agent-driven dashboard customization engine
 * Analyzes projects and suggests optimal dashboard configurations
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class DashboardCustomizer extends EventEmitter {
  constructor() {
    super();
    
    // Customization rules based on project analysis
    this.customizationRules = {
      projectTypes: {
        'feature': {
          suggestions: ['Velocity Tracking', 'Feature Flags', 'User Stories'],
          priority: 'development-focused'
        },
        'bugfix': {
          suggestions: ['Root Cause Analysis', 'Regression Tests', 'Impact Assessment'],
          priority: 'quality-focused'
        },
        'research': {
          suggestions: ['Hypothesis Tracking', 'Experiment Results', 'Literature Review'],
          priority: 'discovery-focused'
        },
        'client': {
          suggestions: ['Stakeholder Updates', 'Budget Tracking', 'Approval Workflow'],
          priority: 'communication-focused'
        },
        'startup-mvp': {
          suggestions: ['Runway Tracking', 'Pivot Decisions', 'Market Validation'],
          priority: 'speed-focused'
        },
        'enterprise': {
          suggestions: ['Compliance Checklist', 'Change Management', 'Risk Register'],
          priority: 'governance-focused'
        }
      },
      
      complexity: {
        'low': {
          maxSections: 5,
          simplify: true
        },
        'medium': {
          maxSections: 8,
          balanced: true
        },
        'high': {
          maxSections: 12,
          comprehensive: true,
          additionalSections: ['Risk Management', 'Dependencies Map', 'Integration Points']
        }
      },
      
      teamSize: {
        'solo': {
          sections: ['Tasks', 'Progress'],
          skipDepartments: true
        },
        'small': {
          sections: ['Tasks', 'Progress', 'Communication'],
          departments: ['Engineering', 'Design']
        },
        'medium': {
          sections: ['Tasks', 'Progress', 'Departments', 'Milestones'],
          departments: ['Engineering', 'Design', 'Product', 'QA']
        },
        'large': {
          sections: ['Tasks', 'Progress', 'Departments', 'Milestones', 'Resource Allocation'],
          departments: ['Engineering', 'Design', 'Product', 'QA', 'DevOps', 'Data']
        }
      }
    };
  }

  /**
   * Main analysis function - returns customization recommendations
   */
  async analyzeProject(project) {
    logger.info(`🔍 Analyzing project for dashboard customization: ${project.name}`);
    
    const analysis = {
      projectType: this.detectProjectType(project),
      complexity: this.assessComplexity(project),
      teamSize: this.determineTeamSize(project),
      duration: this.estimateDuration(project),
      keyMetrics: this.identifyKeyMetrics(project),
      stakeholders: this.identifyStakeholders(project)
    };

    logger.debug('Project analysis:', analysis);
    
    // Generate customization recommendations
    const customizations = await this.generateCustomizations(analysis, project);
    
    // Let agents add their specific insights
    const agentCustomizations = await this.getAgentSpecificCustomizations(project, analysis);
    
    return this.mergeCustomizations(customizations, agentCustomizations);
  }

  /**
   * Detect project type from context
   */
  detectProjectType(project) {
    const name = project.name.toLowerCase();
    const description = (project.description || '').toLowerCase();
    const combined = name + ' ' + description;

    // Pattern matching for project type
    if (combined.match(/bug|fix|issue|error|crash/)) {
      return 'bugfix';
    }
    if (combined.match(/research|experiment|study|analysis|investigate/)) {
      return 'research';
    }
    if (combined.match(/client|customer|contract|delivery/)) {
      return 'client';
    }
    if (combined.match(/mvp|startup|prototype|poc/)) {
      return 'startup-mvp';
    }
    if (combined.match(/enterprise|migration|compliance|audit/)) {
      return 'enterprise';
    }
    
    // Default to feature development
    return 'feature';
  }

  /**
   * Assess project complexity
   */
  assessComplexity(project) {
    let complexityScore = 0;
    
    // Factors that increase complexity
    if (project.agents && project.agents.length > 3) complexityScore += 2;
    if (project.duration && project.duration > 30) complexityScore += 2;
    if (project.dependencies && project.dependencies.length > 5) complexityScore += 3;
    if (project.integrations && project.integrations.length > 3) complexityScore += 2;
    if (project.type === 'enterprise') complexityScore += 3;
    
    // Determine complexity level
    if (complexityScore >= 7) return 'high';
    if (complexityScore >= 4) return 'medium';
    return 'low';
  }

  /**
   * Determine team size
   */
  determineTeamSize(project) {
    const agentCount = project.agents ? project.agents.length : 1;
    
    if (agentCount === 1) return 'solo';
    if (agentCount <= 3) return 'small';
    if (agentCount <= 6) return 'medium';
    return 'large';
  }

  /**
   * Estimate project duration
   */
  estimateDuration(project) {
    if (project.duration) return project.duration;
    
    // Estimate based on type
    const typeDefaults = {
      'bugfix': 3,
      'research': 14,
      'feature': 21,
      'client': 30,
      'startup-mvp': 60,
      'enterprise': 90
    };
    
    return typeDefaults[project.type] || 14;
  }

  /**
   * Identify key metrics to track
   */
  identifyKeyMetrics(project) {
    const metrics = ['Progress', 'Quality'];
    
    const typeMetrics = {
      'feature': ['Velocity', 'User Stories Completed'],
      'bugfix': ['Defect Density', 'Time to Resolution'],
      'research': ['Experiments Run', 'Findings Documented'],
      'client': ['Milestones Met', 'Client Satisfaction'],
      'startup-mvp': ['Burn Rate', 'User Acquisition'],
      'enterprise': ['Compliance Score', 'Risk Mitigation']
    };
    
    const projectTypeMetrics = typeMetrics[project.type] || [];
    return [...metrics, ...projectTypeMetrics];
  }

  /**
   * Identify stakeholders
   */
  identifyStakeholders(project) {
    const stakeholders = [];
    
    if (project.type === 'client' || project.type === 'enterprise') {
      stakeholders.push('External Stakeholders');
    }
    
    if (project.agents && project.agents.length > 3) {
      stakeholders.push('Team Leads');
    }
    
    stakeholders.push('Product Owner');
    
    return stakeholders;
  }

  /**
   * Generate customization recommendations
   */
  async generateCustomizations(analysis, project) {
    const customizations = [];
    
    // Add type-specific sections
    const typeRules = this.customizationRules.projectTypes[analysis.projectType];
    if (typeRules) {
      typeRules.suggestions.forEach(section => {
        customizations.push({
          section,
          reason: `Recommended for ${analysis.projectType} projects`,
          priority: typeRules.priority,
          agent: 'System'
        });
      });
    }
    
    // Add complexity-specific sections
    const complexityRules = this.customizationRules.complexity[analysis.complexity];
    if (complexityRules && complexityRules.additionalSections) {
      complexityRules.additionalSections.forEach(section => {
        customizations.push({
          section,
          reason: `Required for ${analysis.complexity} complexity projects`,
          priority: 'high',
          agent: 'System'
        });
      });
    }
    
    // Add team-specific sections
    const teamRules = this.customizationRules.teamSize[analysis.teamSize];
    if (teamRules && analysis.teamSize !== 'solo') {
      customizations.push({
        section: 'Team Coordination',
        reason: `${analysis.teamSize} team collaboration`,
        priority: 'medium',
        agent: 'System'
      });
    }
    
    // Add stakeholder sections if needed
    if (analysis.stakeholders.includes('External Stakeholders')) {
      customizations.push({
        section: 'Stakeholder Updates',
        reason: 'External stakeholder communication required',
        priority: 'high',
        agent: 'System'
      });
    }
    
    // Add metric tracking
    customizations.push({
      section: 'Metrics Dashboard',
      reason: `Track: ${analysis.keyMetrics.join(', ')}`,
      priority: 'medium',
      agent: 'System',
      metrics: analysis.keyMetrics
    });
    
    return customizations;
  }

  /**
   * Get agent-specific customizations
   */
  async getAgentSpecificCustomizations(project, analysis) {
    const agentCustomizations = [];
    
    // Product-Strategist additions
    if (project.agents?.includes('Product-Strategist')) {
      agentCustomizations.push({
        section: 'Product Roadmap',
        reason: 'Strategic planning and vision alignment',
        priority: 'medium',
        agent: 'Product-Strategist'
      });
      
      if (analysis.projectType === 'startup-mvp') {
        agentCustomizations.push({
          section: 'Market Validation',
          reason: 'Critical for MVP success',
          priority: 'high',
          agent: 'Product-Strategist'
        });
      }
    }
    
    // Design-Engineer additions
    if (project.agents?.includes('Design-Engineer')) {
      agentCustomizations.push({
        section: 'Design System',
        reason: 'Maintain design consistency',
        priority: 'medium',
        agent: 'Design-Engineer'
      });
      
      if (analysis.complexity === 'high') {
        agentCustomizations.push({
          section: 'User Flow Diagrams',
          reason: 'Complex interactions need visual mapping',
          priority: 'high',
          agent: 'Design-Engineer'
        });
      }
    }
    
    // Backend-Engineer additions
    if (project.agents?.includes('Backend-Engineer')) {
      agentCustomizations.push({
        section: 'API Documentation',
        reason: 'Technical reference and integration guide',
        priority: 'medium',
        agent: 'Backend-Engineer'
      });
      
      if (analysis.complexity === 'high' || analysis.projectType === 'enterprise') {
        agentCustomizations.push({
          section: 'Architecture Decisions',
          reason: 'Document technical choices and trade-offs',
          priority: 'high',
          agent: 'Backend-Engineer'
        });
      }
    }
    
    // QA additions (if present)
    if (project.agents?.includes('QA-Specialist')) {
      agentCustomizations.push({
        section: 'Test Coverage',
        reason: 'Quality assurance tracking',
        priority: 'high',
        agent: 'QA-Specialist'
      });
    }
    
    return agentCustomizations;
  }

  /**
   * Merge and prioritize customizations
   */
  mergeCustomizations(systemCustomizations, agentCustomizations) {
    const merged = [...systemCustomizations, ...agentCustomizations];
    
    // Remove duplicates
    const unique = merged.reduce((acc, curr) => {
      const exists = acc.find(item => item.section === curr.section);
      if (!exists) {
        acc.push(curr);
      } else if (curr.priority === 'high' && exists.priority !== 'high') {
        // Upgrade priority if higher priority duplicate found
        exists.priority = 'high';
      }
      return acc;
    }, []);
    
    // Sort by priority
    const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
    unique.sort((a, b) => 
      (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4)
    );
    
    logger.info(`📊 Generated ${unique.length} dashboard customization recommendations`);
    
    return unique;
  }

  /**
   * Validate customizations don't conflict
   */
  validateCustomizations(customizations) {
    const conflicts = [];
    
    // Check for conflicting sections
    const sectionCounts = {};
    customizations.forEach(c => {
      sectionCounts[c.section] = (sectionCounts[c.section] || 0) + 1;
    });
    
    Object.entries(sectionCounts).forEach(([section, count]) => {
      if (count > 1) {
        conflicts.push(`Duplicate section: ${section}`);
      }
    });
    
    // Check for too many sections
    if (customizations.length > 15) {
      conflicts.push(`Too many sections (${customizations.length}), consider simplifying`);
    }
    
    return {
      valid: conflicts.length === 0,
      conflicts
    };
  }

  /**
   * Apply customizations to dashboard template
   */
  async applyToTemplate(template, customizations) {
    customizations.forEach(customization => {
      template.addSection({
        name: customization.section,
        reason: customization.reason,
        suggestedBy: customization.agent,
        priority: customization.priority,
        config: customization.config || {}
      });
    });
    
    return template;
  }
}

module.exports = {
  DashboardCustomizer
};