/**
 * BUMBA Commands Configuration Module
 */

module.exports = {
  load(customCommands = {}) {
    return {
      // Product Strategy Commands
      product: {
        analyze: {
          description: 'Analyze market and product opportunities',
          department: 'product-strategist',
          priority: 1
        },
        strategy: {
          description: 'Develop product strategy',
          department: 'product-strategist',
          priority: 1
        },
        roadmap: {
          description: 'Create product roadmap',
          department: 'product-strategist',
          priority: 2
        },
        metrics: {
          description: 'Define and track metrics',
          department: 'product-strategist',
          priority: 2
        },
        research: {
          description: 'Conduct market research',
          department: 'product-strategist',
          priority: 3
        },
        compete: {
          description: 'Competitive analysis',
          department: 'product-strategist',
          priority: 3
        },
        validate: {
          description: 'Validate product ideas',
          department: 'product-strategist',
          priority: 2
        },
        prioritize: {
          description: 'Prioritize features',
          department: 'product-strategist',
          priority: 1
        }
      },
      
      // Design Engineering Commands
      design: {
        ui: {
          description: 'Design user interface',
          department: 'design-engineer',
          priority: 1
        },
        ux: {
          description: 'Design user experience',
          department: 'design-engineer',
          priority: 1
        },
        prototype: {
          description: 'Create prototypes',
          department: 'design-engineer',
          priority: 2
        },
        components: {
          description: 'Design components',
          department: 'design-engineer',
          priority: 2
        },
        system: {
          description: 'Design system creation',
          department: 'design-engineer',
          priority: 1
        },
        mockup: {
          description: 'Create mockups',
          department: 'design-engineer',
          priority: 3
        },
        animate: {
          description: 'Create animations',
          department: 'design-engineer',
          priority: 3
        },
        accessibility: {
          description: 'Ensure accessibility',
          department: 'design-engineer',
          priority: 1
        },
        responsive: {
          description: 'Responsive design',
          department: 'design-engineer',
          priority: 2
        },
        figma: {
          description: 'Figma integration',
          department: 'design-engineer',
          priority: 2
        }
      },
      
      // Backend Engineering Commands
      backend: {
        api: {
          description: 'Develop APIs',
          department: 'backend-engineer',
          priority: 1
        },
        database: {
          description: 'Database design',
          department: 'backend-engineer',
          priority: 1
        },
        security: {
          description: 'Security implementation',
          department: 'backend-engineer',
          priority: 1
        },
        architecture: {
          description: 'System architecture',
          department: 'backend-engineer',
          priority: 1
        },
        microservices: {
          description: 'Microservices design',
          department: 'backend-engineer',
          priority: 2
        },
        optimization: {
          description: 'Performance optimization',
          department: 'backend-engineer',
          priority: 2
        },
        scaling: {
          description: 'Scaling solutions',
          department: 'backend-engineer',
          priority: 2
        },
        integration: {
          description: 'System integration',
          department: 'backend-engineer',
          priority: 2
        },
        testing: {
          description: 'Testing implementation',
          department: 'backend-engineer',
          priority: 1
        },
        deployment: {
          description: 'Deployment setup',
          department: 'backend-engineer',
          priority: 2
        },
        monitoring: {
          description: 'Monitoring setup',
          department: 'backend-engineer',
          priority: 2
        }
      },
      
      // Collaboration Commands
      collaboration: {
        coordinate: {
          description: 'Coordinate between departments',
          priority: 1,
          multi: true
        },
        sync: {
          description: 'Synchronize work',
          priority: 2,
          multi: true
        },
        review: {
          description: 'Review work',
          priority: 1,
          multi: true
        },
        plan: {
          description: 'Plan collaboration',
          priority: 2,
          multi: true
        },
        handoff: {
          description: 'Handoff between teams',
          priority: 2,
          multi: true
        },
        retrospective: {
          description: 'Team retrospective',
          priority: 3,
          multi: true
        }
      },
      
      // System Commands
      system: {
        status: {
          description: 'System status',
          priority: 1,
          global: true
        },
        health: {
          description: 'Health check',
          priority: 1,
          global: true
        },
        metrics: {
          description: 'System metrics',
          priority: 2,
          global: true
        },
        config: {
          description: 'Configuration',
          priority: 2,
          global: true
        },
        logs: {
          description: 'View logs',
          priority: 3,
          global: true
        },
        debug: {
          description: 'Debug mode',
          priority: 3,
          global: true
        },
        restart: {
          description: 'Restart system',
          priority: 1,
          global: true
        },
        shutdown: {
          description: 'Shutdown system',
          priority: 1,
          global: true
        },
        update: {
          description: 'Update system',
          priority: 2,
          global: true
        },
        backup: {
          description: 'Backup system',
          priority: 2,
          global: true
        },
        restore: {
          description: 'Restore system',
          priority: 2,
          global: true
        }
      },
      
      // Custom commands override
      ...customCommands
    };
  }
};