/**
 * BUMBA Interactive State Explorer
 * Real-time state inspection and manipulation for debugging
 */

const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');

class BumbaInteractiveStateExplorer extends EventEmitter {
  constructor() {
    super();
    this.explorerSessions = new Map();
    this.stateTree = new Map();
    this.filters = new Map();
    this.watchers = new Map();
    this.customViews = new Map();
    this.queryEngine = new StateQueryEngine();
    this.visualizer = new StateVisualizer();
  }

  /**
   * Create a new explorer session
   */
  async createExplorerSession(config) {
    const sessionId = this.generateSessionId();
    
    const session = {
      id: sessionId,
      name: config.name || `Explorer ${sessionId}`,
      target: config.target, // agent, memory, system
      mode: config.mode || 'readonly',
      createdAt: Date.now(),
      currentPath: [],
      history: [],
      bookmarks: [],
      settings: {
        autoRefresh: config.autoRefresh !== false,
        refreshInterval: config.refreshInterval || 1000,
        maxDepth: config.maxDepth || 10,
        expandAll: config.expandAll || false
      }
    };

    this.explorerSessions.set(sessionId, session);
    
    // Initialize state tree
    await this.initializeStateTree(session);
    
    // Start auto-refresh if enabled
    if (session.settings.autoRefresh) {
      this.startAutoRefresh(session);
    }

    logger.info(`🟢 State explorer session created: ${session.name}`);
    
    this.emit('session_created', { sessionId, session });
    
    return sessionId;
  }

  /**
   * Navigate to a specific state path
   */
  async navigateTo(sessionId, path) {
    const session = this.explorerSessions.get(sessionId);
    if (!session) {
      throw new Error('Explorer session not found');
    }

    // Validate path
    const validatedPath = await this.validatePath(session, path);
    
    // Add to history
    session.history.push({
      path: session.currentPath,
      timestamp: Date.now()
    });
    
    // Update current path
    session.currentPath = validatedPath;
    
    // Get state at path
    const state = await this.getStateAtPath(session, validatedPath);
    
    logger.debug(`🟢 Navigated to: ${validatedPath.join('.')}`);
    
    this.emit('navigation', {
      sessionId,
      path: validatedPath,
      state
    });
    
    return {
      path: validatedPath,
      state,
      metadata: this.getStateMetadata(state)
    };
  }

  /**
   * Search for specific values or patterns in state
   */
  async search(sessionId, query) {
    const session = this.explorerSessions.get(sessionId);
    if (!session) {
      throw new Error('Explorer session not found');
    }

    logger.info(`🟢 Searching for: ${JSON.stringify(query)}`);
    
    const results = await this.queryEngine.search(
      this.stateTree.get(sessionId),
      query
    );
    
    // Enhance results with paths and context
    const enhancedResults = results.map(result => ({
      ...result,
      path: this.getPathToNode(result.node),
      context: this.getNodeContext(result.node),
      preview: this.createPreview(result.value)
    }));
    
    logger.info(`🟢 Found ${enhancedResults.length} results`);
    
    return enhancedResults;
  }

  /**
   * Filter state tree based on criteria
   */
  async applyFilter(sessionId, filterConfig) {
    const session = this.explorerSessions.get(sessionId);
    if (!session) {
      throw new Error('Explorer session not found');
    }

    const filter = {
      id: this.generateFilterId(),
      name: filterConfig.name || 'Custom Filter',
      criteria: filterConfig.criteria,
      active: true,
      createdAt: Date.now()
    };

    // Store filter
    if (!this.filters.has(sessionId)) {
      this.filters.set(sessionId, new Map());
    }
    this.filters.get(sessionId).set(filter.id, filter);
    
    // Apply filter to state tree
    await this.refreshStateTree(session);
    
    logger.debug(`🟢 Filter applied: ${filter.name}`);
    
    this.emit('filter_applied', { sessionId, filter });
    
    return filter.id;
  }

  /**
   * Watch specific state values for changes
   */
  async watchValue(sessionId, watchConfig) {
    const session = this.explorerSessions.get(sessionId);
    if (!session) {
      throw new Error('Explorer session not found');
    }

    const watcher = {
      id: this.generateWatcherId(),
      path: watchConfig.path,
      expression: watchConfig.expression,
      callback: watchConfig.callback,
      interval: watchConfig.interval || 100,
      previousValue: null,
      active: true,
      changeCount: 0
    };

    // Store watcher
    if (!this.watchers.has(sessionId)) {
      this.watchers.set(sessionId, new Map());
    }
    this.watchers.get(sessionId).set(watcher.id, watcher);
    
    // Start watching
    this.startWatcher(session, watcher);
    
    logger.debug(`🟢️ Watching: ${watcher.path.join('.')}`);
    
    return watcher.id;
  }

  /**
   * Modify state value (if session mode allows)
   */
  async modifyState(sessionId, path, newValue) {
    const session = this.explorerSessions.get(sessionId);
    if (!session) {
      throw new Error('Explorer session not found');
    }

    if (session.mode !== 'readwrite') {
      throw new Error('Session is in readonly mode');
    }

    logger.warn(`🟢️ Modifying state at: ${path.join('.')}`);
    
    // Create backup
    const backup = await this.createStateBackup(session, path);
    
    try {
      // Apply modification
      const result = await this.applyStateModification(
        session,
        path,
        newValue
      );
      
      // Record modification
      session.history.push({
        type: 'modification',
        path,
        oldValue: backup.value,
        newValue,
        timestamp: Date.now()
      });
      
      logger.info('🟢️ State modified successfully');
      
      this.emit('state_modified', {
        sessionId,
        path,
        oldValue: backup.value,
        newValue,
        result
      });
      
      return result;
      
    } catch (error) {
      // Restore from backup on error
      await this.restoreFromBackup(session, backup);
      throw error;
    }
  }

  /**
   * Create custom view of state
   */
  async createCustomView(sessionId, viewConfig) {
    const view = {
      id: this.generateViewId(),
      name: viewConfig.name,
      type: viewConfig.type || 'tree', // tree, table, graph, json
      query: viewConfig.query,
      transform: viewConfig.transform,
      settings: viewConfig.settings || {},
      createdAt: Date.now()
    };

    // Store custom view
    if (!this.customViews.has(sessionId)) {
      this.customViews.set(sessionId, new Map());
    }
    this.customViews.get(sessionId).set(view.id, view);
    
    // Generate view data
    const viewData = await this.generateViewData(sessionId, view);
    
    logger.info(`🟢 Custom view created: ${view.name}`);
    
    return {
      viewId: view.id,
      data: viewData,
      visualization: this.visualizer.render(viewData, view.type)
    };
  }

  /**
   * Compare two state snapshots
   */
  async compareStates(sessionId, state1, state2, options = {}) {
    const comparison = {
      added: [],
      modified: [],
      removed: [],
      unchanged: []
    };

    // Deep comparison with path tracking
    await this.deepCompare(
      state1,
      state2,
      [],
      comparison,
      options
    );

    // Generate visual diff
    const visualDiff = this.visualizer.createDiff(comparison);
    
    return {
      comparison,
      visualDiff,
      summary: {
        totalChanges: comparison.added.length + 
                     comparison.modified.length + 
                     comparison.removed.length,
        added: comparison.added.length,
        modified: comparison.modified.length,
        removed: comparison.removed.length
      }
    };
  }

  /**
   * Export state or subset
   */
  async exportState(sessionId, exportConfig = {}) {
    const session = this.explorerSessions.get(sessionId);
    if (!session) {
      throw new Error('Explorer session not found');
    }

    const stateToExport = exportConfig.path 
      ? await this.getStateAtPath(session, exportConfig.path)
      : this.stateTree.get(sessionId);

    const format = exportConfig.format || 'json';
    
    let exportData;
    switch (format) {
      case 'json':
        exportData = JSON.stringify(stateToExport, null, 2);
        break;
      case 'yaml':
        exportData = this.convertToYAML(stateToExport);
        break;
      case 'csv':
        exportData = this.convertToCSV(stateToExport);
        break;
      case 'dot':
        exportData = this.visualizer.toDot(stateToExport);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return {
      format,
      data: exportData,
      metadata: {
        sessionId,
        exportedAt: Date.now(),
        path: exportConfig.path || []
      }
    };
  }

  /**
   * Get state statistics
   */
  async getStateStats(sessionId) {
    const session = this.explorerSessions.get(sessionId);
    if (!session) {
      throw new Error('Explorer session not found');
    }

    const state = this.stateTree.get(sessionId);
    
    return {
      nodeCount: this.countNodes(state),
      depth: this.calculateDepth(state),
      size: this.calculateSize(state),
      types: this.analyzeTypes(state),
      complexity: this.calculateComplexity(state),
      largestNodes: this.findLargestNodes(state, 10)
    };
  }

  /**
   * Create bookmark for current location
   */
  async createBookmark(sessionId, name) {
    const session = this.explorerSessions.get(sessionId);
    if (!session) {
      throw new Error('Explorer session not found');
    }

    const bookmark = {
      id: this.generateBookmarkId(),
      name,
      path: [...session.currentPath],
      createdAt: Date.now()
    };

    session.bookmarks.push(bookmark);
    
    logger.debug(`🟢 Bookmark created: ${name}`);
    
    return bookmark.id;
  }

  // Helper methods

  async initializeStateTree(session) {
    const state = await this.fetchTargetState(session.target);
    this.stateTree.set(session.id, state);
  }

  async fetchTargetState(target) {
    // Fetch state based on target type
    // This would integrate with actual BUMBA systems
    return {
      type: 'root',
      target,
      data: {},
      timestamp: Date.now()
    };
  }

  startAutoRefresh(session) {
    const intervalId = setInterval(async () => {
      try {
        await this.refreshStateTree(session);
        
        // Check watchers
        const sessionWatchers = this.watchers.get(session.id);
        if (sessionWatchers) {
          for (const watcher of sessionWatchers.values()) {
            if (watcher.active) {
              await this.checkWatcher(session, watcher);
            }
          }
        }
        
      } catch (error) {
        logger.error('Auto-refresh error:', error);
      }
    }, session.settings.refreshInterval);

    session.refreshIntervalId = intervalId;
  }

  async refreshStateTree(session) {
    const newState = await this.fetchTargetState(session.target);
    
    // Apply active filters
    const sessionFilters = this.filters.get(session.id);
    if (sessionFilters) {
      for (const filter of sessionFilters.values()) {
        if (filter.active) {
          newState = await this.applyFilterToState(newState, filter);
        }
      }
    }
    
    this.stateTree.set(session.id, newState);
    
    this.emit('state_refreshed', { sessionId: session.id });
  }

  async validatePath(session, path) {
    const state = this.stateTree.get(session.id);
    let current = state;
    
    for (const segment of path) {
      if (!current || typeof current !== 'object') {
        throw new Error(`Invalid path: ${path.join('.')}`);
      }
      
      if (!(segment in current)) {
        throw new Error(`Path segment not found: ${segment}`);
      }
      
      current = current[segment];
    }
    
    return path;
  }

  async getStateAtPath(session, path) {
    const state = this.stateTree.get(session.id);
    let current = state;
    
    for (const segment of path) {
      current = current[segment];
    }
    
    return current;
  }

  getStateMetadata(state) {
    return {
      type: this.getType(state),
      size: this.calculateSize(state),
      childCount: this.getChildCount(state),
      isExpandable: this.isExpandable(state)
    };
  }

  getType(value) {
    if (value === null) {return 'null';}
    if (Array.isArray(value)) {return 'array';}
    return typeof value;
  }

  calculateSize(obj) {
    // Rough size estimation
    return JSON.stringify(obj).length;
  }

  getChildCount(obj) {
    if (typeof obj !== 'object' || obj === null) {return 0;}
    if (Array.isArray(obj)) {return obj.length;}
    return Object.keys(obj).length;
  }

  isExpandable(value) {
    return typeof value === 'object' && value !== null;
  }

  getPathToNode(node) {
    // Implementation would track path during tree traversal
    return [];
  }

  getNodeContext(node) {
    // Get surrounding context for search results
    return {};
  }

  createPreview(value, maxLength = 100) {
    const str = JSON.stringify(value);
    if (str.length <= maxLength) {return str;}
    return str.substring(0, maxLength) + '...';
  }

  startWatcher(session, watcher) {
    const checkInterval = setInterval(async () => {
      if (!watcher.active) {
        clearInterval(checkInterval);
        return;
      }
      
      await this.checkWatcher(session, watcher);
    }, watcher.interval);
    
    watcher.intervalId = checkInterval;
  }

  async checkWatcher(session, watcher) {
    try {
      const currentValue = await this.getStateAtPath(session, watcher.path);
      
      if (JSON.stringify(currentValue) !== JSON.stringify(watcher.previousValue)) {
        watcher.changeCount++;
        
        if (watcher.callback) {
          await watcher.callback({
            path: watcher.path,
            oldValue: watcher.previousValue,
            newValue: currentValue,
            changeCount: watcher.changeCount
          });
        }
        
        this.emit('watched_value_changed', {
          sessionId: session.id,
          watcherId: watcher.id,
          change: {
            path: watcher.path,
            oldValue: watcher.previousValue,
            newValue: currentValue
          }
        });
        
        watcher.previousValue = currentValue;
      }
    } catch (error) {
      logger.error(`Watcher error: ${error.message}`);
    }
  }

  async createStateBackup(session, path) {
    const value = await this.getStateAtPath(session, path);
    return {
      path,
      value: JSON.parse(JSON.stringify(value)), // Deep clone
      timestamp: Date.now()
    };
  }

  async applyStateModification(session, path, newValue) {
    // This would integrate with actual state management
    const state = this.stateTree.get(session.id);
    let current = state;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    const lastSegment = path[path.length - 1];
    current[lastSegment] = newValue;
    
    return { success: true };
  }

  async restoreFromBackup(session, backup) {
    await this.applyStateModification(session, backup.path, backup.value);
  }

  async applyFilterToState(state, filter) {
    // Apply filter criteria to state
    // This is a simplified implementation
    return state;
  }

  async generateViewData(sessionId, view) {
    const session = this.explorerSessions.get(sessionId);
    const state = this.stateTree.get(sessionId);
    
    // Apply query if specified
    let data = view.query 
      ? await this.queryEngine.query(state, view.query)
      : state;
    
    // Apply transform if specified
    if (view.transform && typeof view.transform === 'function') {
      data = view.transform(data);
    }
    
    return data;
  }

  async deepCompare(obj1, obj2, path, comparison, options) {
    const type1 = this.getType(obj1);
    const type2 = this.getType(obj2);
    
    if (type1 !== type2) {
      comparison.modified.push({
        path,
        oldType: type1,
        newType: type2,
        oldValue: obj1,
        newValue: obj2
      });
      return;
    }
    
    if (type1 === 'object') {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      const allKeys = new Set([...keys1, ...keys2]);
      
      for (const key of allKeys) {
        const newPath = [...path, key];
        
        if (!(key in obj1)) {
          comparison.added.push({
            path: newPath,
            value: obj2[key]
          });
        } else if (!(key in obj2)) {
          comparison.removed.push({
            path: newPath,
            value: obj1[key]
          });
        } else {
          await this.deepCompare(
            obj1[key],
            obj2[key],
            newPath,
            comparison,
            options
          );
        }
      }
    } else if (type1 === 'array') {
      // Array comparison logic
      const maxLength = Math.max(obj1.length, obj2.length);
      
      for (let i = 0; i < maxLength; i++) {
        const newPath = [...path, i];
        
        if (i >= obj1.length) {
          comparison.added.push({
            path: newPath,
            value: obj2[i]
          });
        } else if (i >= obj2.length) {
          comparison.removed.push({
            path: newPath,
            value: obj1[i]
          });
        } else {
          await this.deepCompare(
            obj1[i],
            obj2[i],
            newPath,
            comparison,
            options
          );
        }
      }
    } else {
      // Primitive comparison
      if (obj1 !== obj2) {
        comparison.modified.push({
          path,
          oldValue: obj1,
          newValue: obj2
        });
      } else if (options.includeUnchanged) {
        comparison.unchanged.push({
          path,
          value: obj1
        });
      }
    }
  }

  convertToYAML(state) {
    // Simple YAML conversion
    return JSON.stringify(state, null, 2)
      .replace(/"/g, '')
      .replace(/,$/gm, '')
      .replace(/{/g, '')
      .replace(/}/g, '');
  }

  convertToCSV(state) {
    // Convert to CSV for tabular data
    if (Array.isArray(state) && state.length > 0) {
      const headers = Object.keys(state[0]);
      const rows = state.map(item => 
        headers.map(h => JSON.stringify(item[h] || '')).join(',')
      );
      return [headers.join(','), ...rows].join('\n');
    }
    return 'data\n' + JSON.stringify(state);
  }

  countNodes(obj, count = 0) {
    if (typeof obj !== 'object' || obj === null) {return count + 1;}
    
    count++;
    for (const value of Object.values(obj)) {
      count = this.countNodes(value, count);
    }
    
    return count;
  }

  calculateDepth(obj, currentDepth = 0) {
    if (typeof obj !== 'object' || obj === null) {return currentDepth;}
    
    let maxDepth = currentDepth;
    
    for (const value of Object.values(obj)) {
      const depth = this.calculateDepth(value, currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
    }
    
    return maxDepth;
  }

  analyzeTypes(obj, types = {}) {
    const type = this.getType(obj);
    types[type] = (types[type] || 0) + 1;
    
    if (typeof obj === 'object' && obj !== null) {
      for (const value of Object.values(obj)) {
        this.analyzeTypes(value, types);
      }
    }
    
    return types;
  }

  calculateComplexity(obj) {
    // Simple complexity metric
    const nodeCount = this.countNodes(obj);
    const depth = this.calculateDepth(obj);
    const typeCount = Object.keys(this.analyzeTypes(obj)).length;
    
    return {
      score: nodeCount * depth * typeCount,
      factors: { nodeCount, depth, typeCount }
    };
  }

  findLargestNodes(obj, limit = 10) {
    const nodes = [];
    
    const traverse = (value, path) => {
      const size = this.calculateSize(value);
      nodes.push({ path, size, preview: this.createPreview(value) });
      
      if (typeof value === 'object' && value !== null) {
        for (const [key, child] of Object.entries(value)) {
          traverse(child, [...path, key]);
        }
      }
    };
    
    traverse(obj, []);
    
    return nodes
      .sort((a, b) => b.size - a.size)
      .slice(0, limit);
  }

  // ID generators
  generateSessionId() {
    return `explorer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateFilterId() {
    return `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateWatcherId() {
    return `watcher-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateViewId() {
    return `view-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateBookmarkId() {
    return `bookmark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * State Query Engine
 */
class StateQueryEngine {
  async search(state, query) {
    const results = [];
    
    const traverse = (obj, path = []) => {
      if (this.matches(obj, query)) {
        results.push({
          node: obj,
          path,
          value: obj,
          score: this.calculateMatchScore(obj, query)
        });
      }
      
      if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          traverse(value, [...path, key]);
        }
      }
    };
    
    traverse(state);
    
    return results.sort((a, b) => b.score - a.score);
  }

  async query(state, queryExpression) {
    // Simple query language implementation
    // Would support more complex queries in production
    return state;
  }

  matches(value, query) {
    if (typeof query === 'string') {
      const valueStr = JSON.stringify(value).toLowerCase();
      return valueStr.includes(query.toLowerCase());
    }
    
    if (query.type && typeof value !== query.type) {
      return false;
    }
    
    if (query.value !== undefined && value !== query.value) {
      return false;
    }
    
    if (query.pattern && !query.pattern.test(String(value))) {
      return false;
    }
    
    return true;
  }

  calculateMatchScore(value, query) {
    // Simple scoring based on match quality
    return 1.0;
  }
}

/**
 * State Visualizer
 */
class StateVisualizer {
  render(data, type) {
    switch (type) {
      case 'tree':
        return this.renderTree(data);
      case 'table':
        return this.renderTable(data);
      case 'graph':
        return this.renderGraph(data);
      case 'json':
        return this.renderJSON(data);
      default:
        return this.renderTree(data);
    }
  }

  renderTree(data) {
    // ASCII tree representation
    const lines = [];
    
    const renderNode = (obj, prefix = '', isLast = true) => {
      if (typeof obj !== 'object' || obj === null) {
        lines.push(prefix + '└── ' + JSON.stringify(obj));
        return;
      }
      
      const entries = Object.entries(obj);
      entries.forEach(([key, value], index) => {
        const isLastEntry = index === entries.length - 1;
        const connector = isLastEntry ? '└── ' : '├── ';
        const extension = isLastEntry ? '    ' : '│   ';
        
        lines.push(prefix + connector + key);
        
        if (typeof value === 'object' && value !== null) {
          renderNode(value, prefix + extension, isLastEntry);
        } else {
          lines.push(prefix + extension + '└── ' + JSON.stringify(value));
        }
      });
    };
    
    renderNode(data);
    return lines.join('\n');
  }

  renderTable(data) {
    // Simple table representation
    if (!Array.isArray(data)) {
      return 'Not tabular data';
    }
    
    if (data.length === 0) {
      return 'Empty table';
    }
    
    const headers = Object.keys(data[0]);
    const rows = [
      headers.join(' | '),
      headers.map(() => '---').join(' | '),
      ...data.map(row => 
        headers.map(h => String(row[h] || '')).join(' | ')
      )
    ];
    
    return rows.join('\n');
  }

  renderGraph(data) {
    // DOT graph notation
    return this.toDot(data);
  }

  renderJSON(data) {
    return JSON.stringify(data, null, 2);
  }

  createDiff(comparison) {
    const lines = [];
    
    lines.push('=== State Diff ===');
    lines.push('');
    
    if (comparison.added.length > 0) {
      lines.push('Added:');
      comparison.added.forEach(item => {
        lines.push(`+ ${item.path.join('.')}: ${JSON.stringify(item.value)}`);
      });
      lines.push('');
    }
    
    if (comparison.modified.length > 0) {
      lines.push('Modified:');
      comparison.modified.forEach(item => {
        lines.push(`~ ${item.path.join('.')}: ${JSON.stringify(item.oldValue)} → ${JSON.stringify(item.newValue)}`);
      });
      lines.push('');
    }
    
    if (comparison.removed.length > 0) {
      lines.push('Removed:');
      comparison.removed.forEach(item => {
        lines.push(`- ${item.path.join('.')}: ${JSON.stringify(item.value)}`);
      });
    }
    
    return lines.join('\n');
  }

  toDot(data) {
    const lines = ['digraph State {'];
    let nodeId = 0;
    
    const addNode = (obj, parentId = null) => {
      const currentId = nodeId++;
      const label = typeof obj === 'object' ? 'Object' : String(obj);
      
      lines.push(`  node${currentId} [label="${label}"];`);
      
      if (parentId !== null) {
        lines.push(`  node${parentId} -> node${currentId};`);
      }
      
      if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          const childId = nodeId++;
          lines.push(`  node${childId} [label="${key}"];`);
          lines.push(`  node${currentId} -> node${childId};`);
          
          if (typeof value === 'object') {
            addNode(value, childId);
          } else {
            const valueId = nodeId++;
            lines.push(`  node${valueId} [label="${String(value)}"];`);
            lines.push(`  node${childId} -> node${valueId};`);
          }
        }
      }
      
      return currentId;
    };
    
    addNode(data);
    lines.push('}');
    
    return lines.join('\n');
  }
}

module.exports = { 
  BumbaInteractiveStateExplorer,
  StateQueryEngine,
  StateVisualizer
};