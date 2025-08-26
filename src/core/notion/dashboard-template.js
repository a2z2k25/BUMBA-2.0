/**
 * BUMBA Dashboard Template
 * Flexible template system based on screenshot patterns
 * Provides structure while allowing agent creativity
 */

const { logger } = require('../logging/bumba-logger');

class DashboardTemplate {
  constructor() {
    // Core structure from screenshots
    this.coreStructure = {
      header: {
        title: '[{projectName}] - Dashboard',
        icon: '🏁',
        theme: 'dark'
      },
      
      // Required sections (from screenshots)
      coreSections: [
        {
          name: 'Project Overview',
          icon: '📊',
          required: true,
          fields: {
            Status: {
              type: 'select',
              options: ['🟢 Planning', '🟡 In Progress', '🔴 Complete'],
              default: '🟢 Planning'
            },
            Timeline: {
              type: 'dateRange',
              format: 'MMM DD, YYYY - MMM DD, YYYY (X days)'
            },
            Priority: {
              type: 'select',
              options: ['🔴 High', '🟡 Medium', '🟢 Low'],
              default: '🟡 Medium'
            },
            LastUpdated: {
              type: 'timestamp',
              icon: '🟡',
              auto: true
            }
          }
        },
        
        {
          name: 'Project Tasks',
          icon: '📋',
          required: true,
          type: 'database',
          views: [
            { name: 'Table View', type: 'table', default: true },
            { name: 'Board View', type: 'board', groupBy: 'Status' },
            { name: 'Timeline', type: 'timeline' },
            { name: 'Department View', type: 'board', groupBy: 'Department' }
          ],
          properties: this.getTaskProperties()
        },
        
        {
          name: 'Data Visualization [Embeds]',
          icon: '📊',
          required: true,
          type: 'embedGrid',
          layout: '2x3',
          placeholders: 6
        },
        
        {
          name: 'Project Documents',
          icon: '📄',
          required: true,
          type: 'database',
          inline: true
        }
      ],
      
      // Department color scheme from screenshots
      departments: {
        '🟡 Strategy': { color: '#FFD700', emoji: '🟡' },
        '🔴 Design': { color: '#FF0000', emoji: '🔴' },
        '🟢 Engineering': { color: '#00FF00', emoji: '🟢' },
        '🟠 Testing QA': { color: '#FFA500', emoji: '🟠' }
      }
    };
    
    // Additional sections by project type
    this.additionalSections = {
      feature: [],
      bugfix: [],
      research: [],
      default: []
    };
    
    // Flexible sections that can be added
    this.flexibleSections = new Map();
  }

  /**
   * Get standard task properties from screenshots
   */
  getTaskProperties() {
    return {
      Name: { type: 'title', required: true },
      Priority: {
        type: 'select',
        options: ['P0 - Critical', 'P1 - High', 'P2 - Medium'],
        default: 'P2 - Medium'
      },
      Department: {
        type: 'select',
        options: ['🟡 Strategy', '🔴 Design', '🟢 Engineering', '🟠 Testing QA'],
        colors: true
      },
      Status: {
        type: 'select',
        options: ['To Do', 'In Progress', 'Blocked', 'Completed', 'Backlog'],
        default: 'To Do'
      },
      Assignee: { type: 'person', multi: false },
      Dependencies: { type: 'relation', self: true },
      Progress: { 
        type: 'number',
        format: 'percent',
        visualBar: true
      },
      Description: { type: 'text', long: true },
      RelatedDocuments: { type: 'files', multi: true }
    };
  }

  /**
   * Generate dashboard structure with customizations
   */
  generateStructure(project, customizations = []) {
    logger.info(`🏗️ Generating dashboard structure for: ${project.name}`);
    
    const structure = {
      ...this.coreStructure,
      projectName: project.name,
      projectType: project.type,
      customSections: [],
      tasks: [],
      departments: this.coreStructure.departments
    };
    
    // Add core sections
    structure.sections = [...this.coreStructure.coreSections];
    
    // Add customized sections
    customizations.forEach(custom => {
      const section = this.createCustomSection(custom);
      if (section) {
        structure.customSections.push(section);
        structure.sections.push(section);
      }
    });
    
    // Add initial tasks based on project type
    structure.tasks = this.generateInitialTasks(project, customizations);
    
    // Add custom views if needed
    structure.views = this.generateViews(project, customizations);
    
    // Calculate structure complexity
    structure.complexity = {
      sections: structure.sections.length,
      customSections: structure.customSections.length,
      tasks: structure.tasks.length,
      views: structure.views.length
    };
    
    return structure;
  }

  /**
   * Create a custom section based on customization
   */
  createCustomSection(customization) {
    const sectionTemplates = {
      'Velocity Tracking': {
        icon: '📈',
        type: 'chart',
        dataSource: 'tasks',
        metric: 'completion_rate'
      },
      'Risk Register': {
        icon: '⚠️',
        type: 'database',
        properties: {
          Risk: 'title',
          Impact: 'select',
          Likelihood: 'select',
          Mitigation: 'text',
          Owner: 'person'
        }
      },
      'Sprint Planning': {
        icon: '🏃',
        type: 'calendar',
        views: ['Sprint View', 'Backlog', 'Retrospective']
      },
      'Stakeholder Updates': {
        icon: '👥',
        type: 'timeline',
        properties: {
          Update: 'title',
          Date: 'date',
          Stakeholder: 'select',
          Status: 'select',
          Notes: 'text'
        }
      },
      'Market Validation': {
        icon: '🎯',
        type: 'database',
        properties: {
          Hypothesis: 'title',
          Experiment: 'text',
          Result: 'select',
          Learning: 'text',
          NextStep: 'text'
        }
      },
      'Architecture Decisions': {
        icon: '🏗️',
        type: 'database',
        properties: {
          Decision: 'title',
          Context: 'text',
          Options: 'text',
          Choice: 'text',
          Consequences: 'text',
          Date: 'date'
        }
      }
    };
    
    const template = sectionTemplates[customization.section];
    
    if (!template) {
      // Create generic section if no template
      return {
        name: customization.section,
        icon: '📌',
        type: 'text',
        reason: customization.reason,
        addedBy: customization.agent,
        custom: true
      };
    }
    
    return {
      name: customization.section,
      ...template,
      reason: customization.reason,
      addedBy: customization.agent,
      priority: customization.priority,
      custom: true
    };
  }

  /**
   * Generate initial tasks based on project
   */
  generateInitialTasks(project, customizations) {
    const tasks = [];
    
    // Default tasks for all projects
    tasks.push({
      name: `Initialize ${project.name}`,
      department: '🟡 Strategy',
      status: 'In Progress',
      priority: 'P1 - High',
      progress: 25,
      description: 'Set up project structure and initial planning'
    });
    
    // Department-specific tasks
    if (project.agents?.includes('Product-Strategist')) {
      tasks.push({
        name: 'Define Requirements',
        department: '🟡 Strategy',
        status: 'To Do',
        priority: 'P0 - Critical',
        progress: 0,
        description: 'Gather and document project requirements'
      });
    }
    
    if (project.agents?.includes('Design-Engineer')) {
      tasks.push({
        name: 'Create Design Mockups',
        department: '🔴 Design',
        status: 'To Do',
        priority: 'P1 - High',
        progress: 0,
        description: 'Design initial UI/UX mockups'
      });
    }
    
    if (project.agents?.includes('Backend-Engineer')) {
      tasks.push({
        name: 'Set Up Development Environment',
        department: '🟢 Engineering',
        status: 'To Do',
        priority: 'P1 - High',
        progress: 0,
        description: 'Configure development tools and repositories'
      });
    }
    
    // Add tasks from customizations
    customizations.forEach(custom => {
      if (custom.section === 'Risk Register') {
        tasks.push({
          name: 'Identify Initial Risks',
          department: '🟡 Strategy',
          status: 'To Do',
          priority: 'P2 - Medium',
          progress: 0,
          description: 'Document project risks and mitigation strategies'
        });
      }
    });
    
    return tasks;
  }

  /**
   * Generate custom views based on project needs
   */
  generateViews(project, customizations) {
    const views = [...this.coreStructure.coreSections[1].views];
    
    // Add custom views based on customizations
    customizations.forEach(custom => {
      if (custom.section === 'Sprint Planning') {
        views.push({
          name: 'Sprint Board',
          type: 'board',
          groupBy: 'Sprint'
        });
      }
      
      if (custom.section === 'Risk Register') {
        views.push({
          name: 'Risk Matrix',
          type: 'matrix',
          xAxis: 'Impact',
          yAxis: 'Likelihood'
        });
      }
    });
    
    return views;
  }

  /**
   * Add a flexible section
   */
  addSection(sectionConfig) {
    const section = {
      name: sectionConfig.name,
      icon: sectionConfig.icon || '📌',
      type: sectionConfig.type || 'text',
      reason: sectionConfig.reason,
      suggestedBy: sectionConfig.suggestedBy,
      priority: sectionConfig.priority,
      config: sectionConfig.config || {},
      custom: true,
      timestamp: Date.now()
    };
    
    this.flexibleSections.set(section.name, section);
    logger.info(`➕ Added flexible section: ${section.name}`);
    
    return section;
  }

  /**
   * Convert to Notion-compatible format
   */
  toNotionFormat(structure) {
    return {
      object: 'page',
      properties: {
        title: [{
          text: {
            content: structure.header.title.replace('{projectName}', structure.projectName)
          }
        }]
      },
      icon: {
        emoji: structure.header.icon
      },
      children: this.convertSectionsToBlocks(structure.sections)
    };
  }

  /**
   * Convert sections to Notion blocks
   */
  convertSectionsToBlocks(sections) {
    const blocks = [];
    
    sections.forEach(section => {
      // Add section header
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{
            text: {
              content: `${section.icon} ${section.name}`
            }
          }]
        }
      });
      
      // Add section content based on type
      if (section.type === 'database') {
        blocks.push({
          object: 'block',
          type: 'child_database',
          child_database: {
            title: section.name,
            properties: this.convertPropertiesToNotion(section.properties)
          }
        });
      } else if (section.type === 'embedGrid') {
        // Add embed placeholders
        for (let i = 0; i < section.placeholders; i++) {
          blocks.push({
            object: 'block',
            type: 'embed',
            embed: {
              url: `https://bumba-charts.vercel.app/placeholder/${i + 1}`
            }
          });
        }
      } else {
        // Add text block for other types
        blocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{
              text: {
                content: section.reason || 'Section content will be added here'
              }
            }]
          }
        });
      }
      
      // Add divider between sections
      blocks.push({
        object: 'block',
        type: 'divider',
        divider: {}
      });
    });
    
    return blocks;
  }

  /**
   * Convert properties to Notion format
   */
  convertPropertiesToNotion(properties) {
    const notionProperties = {};
    
    Object.entries(properties).forEach(([key, config]) => {
      const type = config.type || 'text';
      
      switch (type) {
        case 'title':
          notionProperties[key] = { title: {} };
          break;
        case 'select':
          notionProperties[key] = {
            select: {
              options: (config.options || []).map(opt => ({ name: opt }))
            }
          };
          break;
        case 'number':
          notionProperties[key] = {
            number: {
              format: config.format || 'number'
            }
          };
          break;
        case 'person':
          notionProperties[key] = { people: {} };
          break;
        case 'relation':
          notionProperties[key] = {
            relation: {
              database_id: config.databaseId || 'self',
              single_property: !config.multi
            }
          };
          break;
        case 'files':
          notionProperties[key] = { files: {} };
          break;
        default:
          notionProperties[key] = { rich_text: {} };
      }
    });
    
    return notionProperties;
  }
  
  /**
   * Get sections based on project type
   */
  getSections(projectType = 'default') {
    const sections = [...this.coreStructure.coreSections];
    
    // Add specific sections based on project type
    const additionalSections = this.additionalSections[projectType] || this.additionalSections.default;
    
    if (additionalSections) {
      sections.push(...additionalSections.filter(s => 
        !sections.find(existing => existing.name === s.name)
      ));
    }
    
    return sections;
  }
}

module.exports = {
  DashboardTemplate
};