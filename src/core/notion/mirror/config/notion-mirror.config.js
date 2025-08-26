/**
 * Notion Project Dashboard Mirror Configuration
 * 
 * This configuration defines how the Bumba Framework mirrors project state
 * to Notion dashboards without requiring direct MCP connections during development.
 */

module.exports = {
  // Mirror Feature Settings
  mirror: {
    enabled: true,
    mode: process.env.NOTION_MODE || 'mock', // 'mock' | 'mcp' | 'api'
    updateInterval: 30000, // 30 seconds
    batchSize: 10, // Updates per batch
    retryAttempts: 3,
    retryDelay: 5000
  },

  // Template Configuration
  template: {
    id: process.env.NOTION_TEMPLATE_ID || 'mock-template-001',
    version: '1.0.0',
    sections: {
      overview: { id: 'section-overview', order: 1 },
      timeline: { id: 'section-timeline', order: 2 },
      tasks: { id: 'section-tasks', order: 3 },
      visualizations: { id: 'section-viz', order: 4 },
      documents: { id: 'section-docs', order: 5 },
      activity: { id: 'section-activity', order: 6 }
    }
  },

  // Department Mapping
  departments: {
    'Product-Strategist': { 
      notionLabel: 'Strategy',
      color: '#FDB462',
      icon: '🟡'
    },
    'Design-Engineer': {
      notionLabel: 'Design',
      color: '#FB8072',
      icon: '🔴'
    },
    'Backend-Engineer': {
      notionLabel: 'Engineering',
      color: '#80B1D3',
      icon: '🟢️'
    },
    'Frontend-Engineer': {
      notionLabel: 'Engineering',
      color: '#8DD3C7',
      icon: '🖥️'
    },
    'QA-Engineer': {
      notionLabel: 'QA',
      color: '#BEBADA',
      icon: '🏁'
    },
    'DevOps-Engineer': {
      notionLabel: 'DevOps',
      color: '#FFFFB3',
      icon: '🟢'
    }
  },

  // Task Status Mapping
  taskStatuses: {
    'backlog': { label: 'Backlog', color: 'gray', order: 1 },
    'todo': { label: 'To Do', color: 'blue', order: 2 },
    'in_progress': { label: 'In Progress', color: 'yellow', order: 3 },
    'review': { label: 'Review', color: 'orange', order: 4 },
    'blocked': { label: 'Blocked', color: 'red', order: 5 },
    'complete': { label: 'Complete', color: 'green', order: 6 }
  },

  // Priority Levels
  priorities: {
    'P0': { label: 'P0 - Critical', color: 'red', weight: 4 },
    'P1': { label: 'P1 - High', color: 'orange', weight: 3 },
    'P2': { label: 'P2 - Medium', color: 'yellow', weight: 2 },
    'P3': { label: 'P3 - Low', color: 'gray', weight: 1 }
  },

  // Visualization Settings
  visualizations: {
    maxPerSection: 6,
    embedFormat: 'dataURL', // 'dataURL' | 'iframe' | 'svg'
    updateFrequency: {
      realtime: 5000,    // 5 seconds
      frequent: 30000,   // 30 seconds
      standard: 300000,  // 5 minutes
      daily: 86400000    // 24 hours
    },
    components: {
      burndown: { type: 'RunChart', frequency: 'frequent' },
      velocity: { type: 'BarChart', frequency: 'standard' },
      progress: { type: 'Gauge', frequency: 'frequent' },
      timeline: { type: 'Timeline', frequency: 'standard' },
      dependencies: { type: 'Graph', frequency: 'standard' },
      activity: { type: 'Stream', frequency: 'realtime' }
    }
  },

  // Rate Limiting
  rateLimit: {
    notion: {
      requestsPerSecond: 3,
      burstLimit: 10,
      cooldownPeriod: 1000
    }
  },

  // Mock Mode Settings
  mock: {
    logLevel: 'info', // 'debug' | 'info' | 'warn' | 'error'
    simulateLatency: true,
    latencyMs: 100,
    successRate: 0.95,
    outputPath: './logs/notion-mirror-mock.log'
  },

  // MCP Connection Points (for future use)
  mcp: {
    server: process.env.NOTION_MCP_SERVER,
    endpoints: {
      createPage: '/notion/pages',
      updateBlock: '/notion/blocks/{id}',
      appendBlock: '/notion/blocks/{id}/children',
      getPage: '/notion/pages/{id}'
    }
  },

  // Validation Rules
  validation: {
    requireDescription: true,
    maxTitleLength: 100,
    maxDescriptionLength: 2000,
    allowedFileTypes: ['md', 'pdf', 'png', 'jpg', 'svg'],
    maxFileSize: 10485760 // 10MB
  },

  // Agent Protocols
  agentProtocols: {
    updateTriggers: [
      'task:created',
      'task:updated',
      'task:completed',
      'sprint:started',
      'sprint:completed',
      'milestone:reached',
      'blocker:identified',
      'blocker:resolved'
    ],
    autoAssignment: true,
    conflictResolution: 'last-write-wins',
    validationRequired: ['milestone:reached', 'sprint:completed']
  }
};