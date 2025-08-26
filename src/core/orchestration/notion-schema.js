/**
 * BUMBA Notion Workspace Schema
 * Defines the complete database structure for project orchestration
 * @module notion-schema
 */

const { logger } = require('../logging/bumba-logger');

const NotionWorkspaceSchema = {
  /**
   * Master Project Database
   * Tracks all active projects managed by BUMBA
   */
  projects: {
    name: 'BUMBA Projects',
    properties: {
      title: { type: 'title' },
      status: { 
        type: 'select',
        options: ['planning', 'active', 'blocked', 'review', 'completed']
      },
      epic: { type: 'rich_text' },
      owner: { type: 'select', default: 'Product-Strategist' },
      created: { type: 'created_time' },
      deadline: { type: 'date' },
      progress: { type: 'number', format: 'percent' },
      priority: {
        type: 'select',
        options: ['critical', 'high', 'medium', 'low']
      },
      human_operator: { type: 'person' },
      total_sprints: { type: 'number' },
      completed_sprints: { type: 'number' },
      blocked_tasks: { type: 'number' },
      critical_path: { type: 'rich_text' }
    }
  },

  /**
   * Task/Sprint Database
   * Central task management with dependency tracking
   */
  tasks: {
    name: 'Task Board',
    properties: {
      title: { type: 'title' },
      sprint_id: { type: 'rich_text' },
      project: { 
        type: 'relation',
        database: 'projects'
      },
      status: {
        type: 'select',
        options: [
          'backlog',
          'blocked',
          'ready',
          'claimed',
          'in_progress',
          'review',
          'completed'
        ]
      },
      dependencies: {
        type: 'relation',
        database: 'tasks', // Self-referential
        description: 'Tasks that must complete before this one'
      },
      enables: {
        type: 'relation',
        database: 'tasks', // Self-referential
        description: 'Tasks that depend on this one'
      },
      assigned_agent: {
        type: 'select',
        options: [] // Dynamically populated with agent IDs
      },
      agent_type: {
        type: 'select',
        options: [
          'product-strategist',
          'backend-engineer',
          'design-engineer',
          'specialist'
        ]
      },
      required_skills: {
        type: 'multi_select',
        options: [
          'database',
          'api',
          'frontend',
          'ui-design',
          'research',
          'testing',
          'documentation'
        ]
      },
      estimated_duration: { type: 'number' }, // minutes
      actual_duration: { type: 'number' }, // minutes
      priority: { type: 'number' }, // 1-5
      start_after: { type: 'date' }, // Calculated from dependencies
      started_at: { type: 'date' },
      completed_at: { type: 'date' },
      outputs: {
        type: 'files',
        description: 'Artifacts produced by this sprint'
      },
      knowledge_refs: {
        type: 'relation',
        database: 'knowledge_base'
      },
      blocker_reason: { type: 'rich_text' },
      quality_score: { type: 'number' }, // 0-100
      reviewed_by: { type: 'select' } // Manager who reviewed
    }
  },

  /**
   * Agent Registry
   * Tracks all agents and their current status
   */
  agents: {
    name: 'Agent Registry',
    properties: {
      agent_id: { type: 'title' },
      agent_type: {
        type: 'select',
        options: [
          'manager',
          'specialist',
          'researcher',
          'developer',
          'designer'
        ]
      },
      department: {
        type: 'select',
        options: [
          'strategic',
          'technical',
          'experience'
        ]
      },
      status: {
        type: 'select',
        options: [
          'available',
          'busy',
          'blocked',
          'offline'
        ]
      },
      current_task: {
        type: 'relation',
        database: 'tasks'
      },
      skills: {
        type: 'multi_select',
        options: [] // Populated based on agent capabilities
      },
      tasks_completed: { type: 'number' },
      average_duration: { type: 'number' },
      success_rate: { type: 'number', format: 'percent' },
      last_active: { type: 'date' },
      performance_score: { type: 'number' } // 0-100
    }
  },

  /**
   * Knowledge Base
   * Central repository for all project artifacts
   */
  knowledge_base: {
    name: 'Knowledge Base',
    properties: {
      title: { type: 'title' },
      type: {
        options: [
          'research',
          'design',
          'architecture',
          'code',
          'documentation',
          'test_results',
          'decision',
          'insight'
        ]
      },
      project: {
        type: 'relation',
        database: 'projects'
      },
      created_by: {
        type: 'select' // Agent ID
      },
      source_task: {
        type: 'relation',
        database: 'tasks'
      },
      content: { type: 'rich_text' },
      attachments: { type: 'files' },
      tags: {
        type: 'multi_select',
        options: []
      },
      quality_verified: { type: 'checkbox' },
      reviewed_by: { type: 'select' },
      created: { type: 'created_time' },
      references: {
        type: 'relation',
        database: 'knowledge_base' // Link related knowledge
      }
    }
  },

  /**
   * Dependency Matrix
   * Explicit dependency tracking and visualization
   */
  dependencies: {
    name: 'Dependency Matrix',
    properties: {
      dependency_id: { type: 'title' },
      from_task: {
        type: 'relation',
        database: 'tasks'
      },
      to_task: {
        type: 'relation',
        database: 'tasks'
      },
      dependency_type: {
        type: 'select',
        options: [
          'blocks', // Must complete before
          'informs', // Provides input but doesn't block
          'validates' // Reviews/approves output
        ]
      },
      is_critical_path: { type: 'checkbox' },
      status: {
        type: 'select',
        options: ['pending', 'satisfied', 'violated']
      },
      created: { type: 'created_time' }
    }
  },

  /**
   * Milestones
   * Major project checkpoints
   */
  milestones: {
    name: 'Milestones',
    properties: {
      title: { type: 'title' },
      project: {
        type: 'relation',
        database: 'projects'
      },
      target_date: { type: 'date' },
      actual_date: { type: 'date' },
      status: {
        type: 'select',
        options: ['upcoming', 'at_risk', 'achieved', 'missed']
      },
      required_tasks: {
        type: 'relation',
        database: 'tasks'
      },
      progress: { type: 'number', format: 'percent' },
      notes: { type: 'rich_text' }
    }
  },

  /**
   * Communication Log
   * Track agent communications and handoffs
   */
  communications: {
    name: 'Communication Log',
    properties: {
      message_id: { type: 'title' },
      from_agent: { type: 'select' },
      to_agent: { type: 'select' },
      message_type: {
        type: 'select',
        options: [
          'handoff',
          'blocker',
          'update',
          'request',
          'completion'
        ]
      },
      content: { type: 'rich_text' },
      related_task: {
        type: 'relation',
        database: 'tasks'
      },
      timestamp: { type: 'created_time' },
      acknowledged: { type: 'checkbox' }
    }
  }
};

/**
 * Output Validation for Notion Schema
 * Validates Notion API responses and schema compliance
 */
const NotionSchemaValidator = {
  /**
   * Validates Notion database output
   */
  validateDatabaseOutput(output) {
    try {
      const validation = {
        valid: true,
        errors: [],
        sanitized: null
      };

      if (!output || typeof output !== 'object') {
        validation.valid = false;
        validation.errors.push('Output must be a valid object');
        return validation;
      }

      // Validate required fields
      if (output.object && output.object !== 'database') {
        validation.valid = false;
        validation.errors.push('Invalid database object type');
      }

      // Sanitize properties
      validation.sanitized = this.sanitizeNotionOutput(output);
      
      return validation;
    } catch (error) {
      logger.error(`🔴 Notion schema validation error: ${error.message}`);
      return {
        valid: false,
        errors: [`Validation error: ${error.message}`],
        sanitized: null
      };
    }
  },

  /**
   * Sanitizes Notion API output
   */
  sanitizeNotionOutput(output) {
    if (!output) return null;
    
    const sanitized = { ...output };
    
    // Remove sensitive fields
    delete sanitized.secret;
    delete sanitized.token;
    delete sanitized.internal_id;
    
    // Sanitize text fields
    if (sanitized.title) {
      sanitized.title = this.sanitizeText(sanitized.title);
    }
    
    if (sanitized.properties) {
      Object.keys(sanitized.properties).forEach(key => {
        if (sanitized.properties[key].rich_text) {
          sanitized.properties[key].rich_text = this.sanitizeText(
            sanitized.properties[key].rich_text
          );
        }
      });
    }
    
    return sanitized;
  },

  /**
   * Sanitizes text content
   */
  sanitizeText(text) {
    if (typeof text !== 'string') return text;
    
    return text
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  },

  /**
   * Validates schema structure
   */
  validateSchemaStructure(schema) {
    const validation = {
      valid: true,
      errors: []
    };

    if (!schema || typeof schema !== 'object') {
      validation.valid = false;
      validation.errors.push('Schema must be a valid object');
      return validation;
    }

    // Validate schema properties
    const requiredSchemas = ['projects', 'tasks', 'agents', 'departments'];
    for (const schemaName of requiredSchemas) {
      if (!schema[schemaName]) {
        validation.valid = false;
        validation.errors.push(`Missing required schema: ${schemaName}`);
      }
    }

    return validation;
  }
};

/**
 * Database Views Configuration
 * Different views for different purposes
 */
const NotionViews = {
  tasks: {
    kanban: {
      name: 'Task Board',
      type: 'board',
      group_by: 'status',
      sort: [{ property: 'priority', direction: 'descending' }]
    },
    timeline: {
      name: 'Sprint Timeline',
      type: 'timeline',
      start_date: 'start_after',
      end_date: 'completed_at'
    },
    dependencies: {
      name: 'Dependency Graph',
      type: 'gallery',
      filter: { property: 'dependencies', is_not_empty: true }
    },
    ready_tasks: {
      name: 'Ready for Pickup',
      type: 'table',
      filter: { property: 'status', equals: 'ready' },
      sort: [{ property: 'priority', direction: 'descending' }]
    }
  },
  
  agents: {
    availability: {
      name: 'Agent Availability',
      type: 'board',
      group_by: 'status'
    },
    performance: {
      name: 'Agent Performance',
      type: 'table',
      sort: [{ property: 'performance_score', direction: 'descending' }]
    }
  },
  
  knowledge_base: {
    by_type: {
      name: 'Knowledge by Type',
      type: 'board',
      group_by: 'type'
    },
    recent: {
      name: 'Recent Additions',
      type: 'table',
      sort: [{ property: 'created', direction: 'descending' }]
    }
  }
};

/**
 * Page Templates
 * Pre-configured page structures for projects
 */
const PageTemplates = {
  project_dashboard: {
    blocks: [
      { type: 'heading_1', text: 'Project Dashboard' },
      { type: 'callout', text: 'Project Overview', icon: '🟢' },
      { type: 'database_view', database: 'tasks', view: 'kanban' },
      { type: 'divider' },
      { type: 'heading_2', text: 'Progress Metrics' },
      { type: 'database_view', database: 'milestones', view: 'timeline' },
      { type: 'divider' },
      { type: 'heading_2', text: 'Team Status' },
      { type: 'database_view', database: 'agents', view: 'availability' },
      { type: 'divider' },
      { type: 'heading_2', text: 'Recent Knowledge' },
      { type: 'database_view', database: 'knowledge_base', view: 'recent' }
    ]
  },
  
  agent_workspace: {
    blocks: [
      { type: 'heading_1', text: 'Agent Workspace' },
      { type: 'heading_2', text: 'My Current Task' },
      { type: 'database_view', database: 'tasks', view: 'current_agent_task' },
      { type: 'heading_2', text: 'Available Tasks' },
      { type: 'database_view', database: 'tasks', view: 'ready_tasks' },
      { type: 'heading_2', text: 'Knowledge Resources' },
      { type: 'database_view', database: 'knowledge_base', view: 'by_type' }
    ]
  }
};

module.exports = {
  NotionWorkspaceSchema,
  NotionViews,
  PageTemplates,
  NotionSchemaValidator
};