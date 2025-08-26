/**
 * Notion Native Components Mapper
 * 
 * Prioritizes native Notion components over embedded visualizations
 * Falls back to embeds only when native components can't represent the data
 */

class NotionNativeComponents {
  constructor() {
    // Define which visualizations can use native components first
    this.nativeCompatibility = {
      'timeline': true,      // Use native timeline database view
      'kanban': true,        // Use native board view
      'progress': true,      // Use native progress property
      'burndown': false,     // Requires embed
      'velocity': false,     // Requires embed
      'dependency': false,   // Requires embed
      'riskMatrix': false,   // Requires embed
      'statusGrid': true,    // Can use native table/gallery
      'taskList': true,      // Use native database
      'sprintPlan': true,    // Use native timeline
      'calendar': true,      // Use native calendar view
      'metrics': true        // Can use native callouts/tables
    };
    
    // Map data types to native Notion components
    this.componentMap = {
      'timeline': this.createNativeTimeline.bind(this),
      'progress': this.createNativeProgress.bind(this),
      'kanban': this.createNativeKanban.bind(this),
      'table': this.createNativeTable.bind(this),
      'calendar': this.createNativeCalendar.bind(this),
      'gallery': this.createNativeGallery.bind(this),
      'list': this.createNativeList,
      'toggle': this.createNativeToggle.bind(this),
      'callout': this.createNativeCallout.bind(this),
      'quote': this.createNativeQuote,
      'divider': this.createNativeDivider,
      'bulletList': this.createNativeBulletList,
      'numberedList': this.createNativeNumberedList,
      'checkbox': this.createNativeCheckbox
    };
  }

  /**
   * Determine if native component can be used
   */
  canUseNative(visualizationType, data) {
    // Check if type is natively compatible
    if (!this.nativeCompatibility[visualizationType]) {
      return false;
    }
    
    // Check data complexity
    if (this.isDataTooComplex(visualizationType, data)) {
      return false;
    }
    
    return true;
  }

  /**
   * Convert visualization to best Notion representation
   */
  async convertToNotion(visualizationType, data, fallbackEmbed = null) {
    // Try native first
    if (this.canUseNative(visualizationType, data)) {
      console.log(`[Native] Using native Notion component for ${visualizationType}`);
      return await this.createNativeComponent(visualizationType, data);
    }
    
    // Fall back to embed if provided
    if (fallbackEmbed) {
      console.log(`[Native] Falling back to embed for ${visualizationType}`);
      return this.wrapEmbed(fallbackEmbed);
    }
    
    // Default to structured data representation
    console.log(`[Native] Creating structured representation for ${visualizationType}`);
    return this.createStructuredData(visualizationType, data);
  }

  /**
   * Create native Notion timeline (using database timeline view)
   */
  createNativeTimeline(data) {
    return {
      type: 'database',
      database: {
        title: [{ text: { content: data.title || 'Project Timeline' } }],
        properties: {
          'Name': { title: {} },
          'Status': {
            select: {
              options: [
                { name: 'Not Started', color: 'gray' },
                { name: 'In Progress', color: 'yellow' },
                { name: 'Complete', color: 'green' },
                { name: 'Blocked', color: 'red' }
              ]
            }
          },
          'Date Range': {
            date: {}
          },
          'Assignee': {
            people: {}
          },
          'Department': {
            select: {
              options: [
                { name: 'Engineering', color: 'blue' },
                { name: 'Design', color: 'purple' },
                { name: 'Strategy', color: 'orange' },
                { name: 'QA', color: 'green' }
              ]
            }
          },
          'Dependencies': {
            relation: {
              database_id: 'self',
              type: 'dual_property',
              dual_property: {
                synced_property_name: 'Blocks',
                synced_property_id: 'blocks_id'
              }
            }
          },
          'Progress': {
            number: {
              format: 'percent'
            }
          }
        },
        // Default to timeline view
        default_view: 'timeline',
        views: [
          {
            type: 'timeline',
            name: 'Timeline View',
            timeline: {
              show_title: true,
              show_date_range: true,
              group_by: 'Department'
            }
          },
          {
            type: 'table',
            name: 'Table View'
          },
          {
            type: 'board',
            name: 'Kanban View',
            board: {
              group_by: 'Status'
            }
          }
        ]
      },
      // Initial data for the timeline
      initial_rows: data.tasks ? data.tasks.map(task => ({
        'Name': task.title,
        'Status': task.status,
        'Date Range': {
          start: task.startDate,
          end: task.endDate
        },
        'Assignee': task.assignee,
        'Department': task.department,
        'Progress': task.progress / 100
      })) : []
    };
  }

  /**
   * Create native progress indicator using Notion properties
   */
  createNativeProgress(data) {
    // Use a combination of native elements for progress
    return {
      type: 'compound',
      children: [
        // Heading with title
        {
          type: 'heading_3',
          heading_3: {
            rich_text: [{ text: { content: data.title || 'Progress' } }]
          }
        },
        // Callout with progress bar (using emoji indicators)
        {
          type: 'callout',
          callout: {
            icon: { emoji: this.getProgressEmoji(data.value) },
            color: this.getProgressColor(data.value),
            rich_text: [
              { 
                text: { 
                  content: `${data.value}% Complete\n${this.createTextProgressBar(data.value)}`
                }
              }
            ]
          }
        },
        // Bullet list with details
        {
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { text: { content: data.subtitle || `${data.completed || 0} of ${data.total || 0} tasks` } }
            ]
          }
        }
      ]
    };
  }

  /**
   * Create native Kanban board (database board view)
   */
  createNativeKanban(data) {
    return {
      type: 'database',
      database: {
        title: [{ text: { content: data.title || 'Task Board' } }],
        properties: {
          'Task': { title: {} },
          'Status': {
            select: {
              options: [
                { name: 'Backlog', color: 'gray' },
                { name: 'To Do', color: 'blue' },
                { name: 'In Progress', color: 'yellow' },
                { name: 'Review', color: 'orange' },
                { name: 'Blocked', color: 'red' },
                { name: 'Complete', color: 'green' }
              ]
            }
          },
          'Priority': {
            select: {
              options: [
                { name: 'P0 - Critical', color: 'red' },
                { name: 'P1 - High', color: 'orange' },
                { name: 'P2 - Medium', color: 'yellow' },
                { name: 'P3 - Low', color: 'gray' }
              ]
            }
          },
          'Story Points': {
            number: {}
          },
          'Assignee': {
            people: {}
          },
          'Sprint': {
            select: {}
          },
          'Labels': {
            multi_select: {
              options: [
                { name: 'Bug', color: 'red' },
                { name: 'Feature', color: 'blue' },
                { name: 'Enhancement', color: 'green' },
                { name: 'Documentation', color: 'gray' }
              ]
            }
          }
        },
        default_view: 'board',
        views: [
          {
            type: 'board',
            name: 'Kanban Board',
            board: {
              group_by: 'Status',
              hide_completed_tasks: false
            }
          },
          {
            type: 'table',
            name: 'All Tasks'
          },
          {
            type: 'calendar',
            name: 'Sprint Calendar',
            calendar: {
              property: 'Due Date'
            }
          }
        ]
      },
      initial_rows: data.tasks || []
    };
  }

  /**
   * Create native table for structured data
   */
  createNativeTable(data) {
    return {
      type: 'table',
      table: {
        has_column_header: true,
        has_row_header: false,
        table_width: data.columns ? data.columns.length : 3,
        children: [
          // Header row
          {
            type: 'table_row',
            table_row: {
              cells: data.headers ? data.headers.map(header => [
                { text: { content: header, bold: true } }
              ]) : []
            }
          },
          // Data rows
          ...(data.rows || []).map(row => ({
            type: 'table_row',
            table_row: {
              cells: row.map(cell => [
                { text: { content: String(cell) } }
              ])
            }
          }))
        ]
      }
    };
  }

  /**
   * Create native callout for metrics/KPIs
   */
  createNativeCallout(data) {
    return {
      type: 'callout',
      callout: {
        icon: { emoji: data.icon || '📊' },
        color: data.color || 'gray_background',
        rich_text: [
          {
            text: {
              content: data.content || '',
              bold: data.bold || false
            }
          }
        ]
      }
    };
  }

  /**
   * Create native toggle list for expandable content
   */
  createNativeToggle(data) {
    return {
      type: 'toggle',
      toggle: {
        rich_text: [{ text: { content: data.title || 'Details' } }],
        children: data.children || []
      }
    };
  }

  /**
   * Create metrics dashboard using native components
   */
  createMetricsDashboard(metrics) {
    return {
      type: 'compound',
      children: [
        // Header
        {
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: '📊 Key Metrics' } }]
          }
        },
        // Metrics grid using columns
        {
          type: 'column_list',
          column_list: {
            children: [
              {
                type: 'column',
                column: {
                  children: [
                    this.createMetricCard('Progress', `${metrics.progress}%`, '📈', 'blue_background'),
                    this.createMetricCard('Velocity', `${metrics.velocity} pts/sprint`, '🟢', 'green_background')
                  ]
                }
              },
              {
                type: 'column',
                column: {
                  children: [
                    this.createMetricCard('Blocked Tasks', metrics.blocked, '🔴', 'red_background'),
                    this.createMetricCard('Team Health', metrics.health, '💚', 'green_background')
                  ]
                }
              }
            ]
          }
        }
      ]
    };
  }

  /**
   * Create a metric card using native callout
   */
  createMetricCard(title, value, emoji, color) {
    return {
      type: 'callout',
      callout: {
        icon: { emoji: emoji },
        color: color,
        rich_text: [
          {
            text: {
              content: `${title}\n`,
              bold: true
            }
          },
          {
            text: {
              content: String(value),
              bold: false
            }
          }
        ]
      }
    };
  }

  /**
   * Create native calendar view
   */
  createNativeCalendar(data) {
    return {
      type: 'database',
      database: {
        title: [{ text: { content: data.title || 'Sprint Calendar' } }],
        properties: {
          'Event': { title: {} },
          'Date': { date: {} },
          'Type': {
            select: {
              options: [
                { name: 'Sprint Start', color: 'green' },
                { name: 'Sprint End', color: 'red' },
                { name: 'Milestone', color: 'blue' },
                { name: 'Review', color: 'orange' },
                { name: 'Deadline', color: 'red' }
              ]
            }
          }
        },
        default_view: 'calendar',
        views: [
          {
            type: 'calendar',
            name: 'Calendar View',
            calendar: {
              property: 'Date'
            }
          }
        ]
      }
    };
  }

  /**
   * Create native gallery view for visual content
   */
  createNativeGallery(data) {
    return {
      type: 'database',
      database: {
        title: [{ text: { content: data.title || 'Project Gallery' } }],
        properties: {
          'Name': { title: {} },
          'Type': { select: {} },
          'Status': { select: {} },
          'Cover': { files: {} }
        },
        default_view: 'gallery',
        views: [
          {
            type: 'gallery',
            name: 'Gallery View',
            gallery: {
              cover: 'Cover',
              cover_size: 'large'
            }
          }
        ]
      }
    };
  }

  /**
   * Create status grid using native table
   */
  createStatusGrid(data) {
    const departments = data.departments || [];
    
    return {
      type: 'table',
      table: {
        has_column_header: true,
        table_width: 4,
        children: [
          // Header
          {
            type: 'table_row',
            table_row: {
              cells: [
                [{ text: { content: 'Department', bold: true } }],
                [{ text: { content: 'Status', bold: true } }],
                [{ text: { content: 'Tasks', bold: true } }],
                [{ text: { content: 'Load', bold: true } }]
              ]
            }
          },
          // Department rows
          ...departments.map(dept => ({
            type: 'table_row',
            table_row: {
              cells: [
                [{ text: { content: dept.name } }],
                [{ text: { content: this.getStatusEmoji(dept.status) + ' ' + dept.status } }],
                [{ text: { content: String(dept.taskCount || 0) } }],
                [{ text: { content: `${dept.load || 0}%` } }]
              ]
            }
          }))
        ]
      }
    };
  }

  /**
   * Helper: Create text-based progress bar
   */
  createTextProgressBar(percentage) {
    const filled = Math.floor(percentage / 5);
    const empty = 20 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percentage}%`;
  }

  /**
   * Helper: Get progress emoji
   */
  getProgressEmoji(percentage) {
    if (percentage >= 100) return '🏁';
    if (percentage >= 75) return '🔵';
    if (percentage >= 50) return '🟡';
    if (percentage >= 25) return '🟠';
    return '🔴';
  }

  /**
   * Helper: Get progress color
   */
  getProgressColor(percentage) {
    if (percentage >= 100) return 'green_background';
    if (percentage >= 75) return 'blue_background';
    if (percentage >= 50) return 'yellow_background';
    if (percentage >= 25) return 'orange_background';
    return 'red_background';
  }

  /**
   * Helper: Get status emoji
   */
  getStatusEmoji(status) {
    const emojis = {
      'active': '🟢',
      'busy': '🟡',
      'blocked': '🔴',
      'idle': '🟠',
      'complete': '🏁'
    };
    return emojis[status] || '🟠';
  }

  /**
   * Helper: Check if data is too complex for native representation
   */
  isDataTooComplex(type, data) {
    // Timeline: Check if dependencies are too complex
    if (type === 'timeline' && data.dependencies) {
      const depCount = data.tasks?.reduce((sum, t) => 
        sum + (t.dependencies?.length || 0), 0) || 0;
      if (depCount > 20) return true; // Too many dependencies for native
    }
    
    // Progress: Check if multi-dimensional
    if (type === 'progress' && data.dimensions > 1) {
      return true; // Native can only show single progress
    }
    
    // Charts: Check if needs complex visualization
    if (['burndown', 'velocity', 'dependency'].includes(type)) {
      return true; // These always need embeds
    }
    
    return false;
  }

  /**
   * Wrap embed in Notion-compatible structure
   */
  wrapEmbed(embed) {
    return {
      type: 'embed',
      embed: {
        url: embed.dataURL || embed.url,
        caption: embed.title || ''
      }
    };
  }

  /**
   * Create structured data representation when native isn't suitable
   */
  createStructuredData(type, data) {
    return {
      type: 'compound',
      children: [
        {
          type: 'heading_3',
          heading_3: {
            rich_text: [{ text: { content: data.title || type } }]
          }
        },
        {
          type: 'code',
          code: {
            rich_text: [{ text: { content: JSON.stringify(data, null, 2) } }],
            language: 'json'
          }
        }
      ]
    };
  }

  /**
   * Create native component based on type
   */
  async createNativeComponent(type, data) {
    const handler = this.componentMap[type];
    if (handler) {
      return handler(data);
    }
    
    // Default to structured data
    return this.createStructuredData(type, data);
  }

  /**
   * Create native list (bullet or numbered)
   */
  createNativeBulletList(items) {
    return {
      type: 'bulleted_list',
      children: items.map(item => ({
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ text: { content: item } }]
        }
      }))
    };
  }

  /**
   * Create native numbered list
   */
  createNativeNumberedList(items) {
    return {
      type: 'numbered_list',
      children: items.map(item => ({
        type: 'numbered_list_item',
        numbered_list_item: {
          rich_text: [{ text: { content: item } }]
        }
      }))
    };
  }

  /**
   * Create native checkbox list
   */
  createNativeCheckbox(items) {
    return {
      type: 'to_do_list',
      children: items.map(item => ({
        type: 'to_do',
        to_do: {
          rich_text: [{ text: { content: item.text } }],
          checked: item.checked || false
        }
      }))
    };
  }

  /**
   * Create native divider
   */
  createNativeDivider() {
    return {
      type: 'divider',
      divider: {}
    };
  }

  /**
   * Create native quote block
   */
  createNativeQuote(text) {
    return {
      type: 'quote',
      quote: {
        rich_text: [{ text: { content: text } }]
      }
    };
  }
}

module.exports = NotionNativeComponents;