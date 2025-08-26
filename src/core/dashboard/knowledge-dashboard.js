/**
 * BUMBA Knowledge Dashboard
 * Real-time visualization of memory usage, knowledge graphs, and learning progress
 * Provides insights into the AI system's knowledge state and evolution
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const { logger } = require('../logging/bumba-logger');
const { UnifiedMemorySystem } = require('../memory/unified-memory-system');
const { HumanLearningModule } = require('../learning/human-learning-module');
const { SmartHandoffManager } = require('../orchestration/smart-handoff-manager');

/**
 * Knowledge Dashboard for system visualization and monitoring
 */
class KnowledgeDashboard extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      port: config.port || 3456,
      updateInterval: config.updateInterval || 5000, // 5 seconds
      historyLength: config.historyLength || 100,
      enableWebUI: config.enableWebUI !== false,
      outputPath: config.outputPath || path.join(process.env.HOME, '.claude', 'dashboard'),
      ...config
    };
    
    // Dashboard data
    this.dashboardData = {
      memory: {
        usage: {},
        distribution: {},
        trends: [],
        pressure: 0
      },
      knowledge: {
        graph: { nodes: [], edges: [] },
        patterns: [],
        concepts: [],
        relationships: []
      },
      learning: {
        progress: 0,
        preferences: {},
        adaptations: [],
        accuracy: 1.0
      },
      agents: {
        active: [],
        handoffs: [],
        performance: {},
        collaboration: []
      },
      metrics: {
        systemHealth: 1.0,
        knowledgeGrowth: 0,
        learningRate: 0,
        contextQuality: 1.0
      }
    };
    
    // Historical data
    this.history = {
      memory: [],
      learning: [],
      performance: []
    };
    
    // Subsystem connections
    this.memory = null;
    this.humanLearning = null;
    this.handoffManager = null;
    
    // Web server
    this.server = null;
    
    // Update interval
    this.updateTimer = null;
    
    this.initialize();
  }
  
  /**
   * Initialize the dashboard
   */
  async initialize() {
    try {
      // Create output directory
      await fs.mkdir(this.config.outputPath, { recursive: true });
      
      // Connect to subsystems
      this.memory = UnifiedMemorySystem.getInstance();
      this.humanLearning = HumanLearningModule.getInstance();
      this.handoffManager = SmartHandoffManager.getInstance();
      
      // Start data collection
      this.startDataCollection();
      
      // Start web UI if enabled
      if (this.config.enableWebUI) {
        await this.startWebServer();
      }
      
      // Generate initial dashboard
      await this.updateDashboard();
      
      logger.info('🏁 Knowledge Dashboard initialized');
      
      this.emit('initialized', {
        port: this.config.port,
        webUI: this.config.enableWebUI
      });
      
    } catch (error) {
      logger.error('Failed to initialize Knowledge Dashboard:', error);
    }
  }
  
  /**
   * Start data collection
   */
  startDataCollection() {
    this.updateTimer = setInterval(async () => {
      await this.updateDashboard();
    }, this.config.updateInterval);
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  /**
   * Update dashboard with latest data
   */
  async updateDashboard() {
    try {
      // Collect memory data
      await this.updateMemoryData();
      
      // Collect knowledge graph
      await this.updateKnowledgeGraph();
      
      // Collect learning progress
      await this.updateLearningProgress();
      
      // Collect agent data
      await this.updateAgentData();
      
      // Calculate metrics
      await this.calculateMetrics();
      
      // Update history
      this.updateHistory();
      
      // Generate visualizations
      await this.generateVisualizations();
      
      // Save dashboard state
      await this.saveDashboardState();
      
      this.emit('dashboard-updated', this.dashboardData);
      
    } catch (error) {
      logger.error('Failed to update dashboard:', error);
    }
  }
  
  /**
   * Update memory usage data
   */
  async updateMemoryData() {
    if (!this.memory) {return;}
    
    const memoryStats = await this.memory.getMemoryStats();
    
    this.dashboardData.memory = {
      usage: {
        shortTerm: memoryStats.shortTerm.usage,
        working: memoryStats.working.usage,
        longTerm: memoryStats.longTerm.usage,
        semantic: memoryStats.semantic.usage,
        total: memoryStats.total.usage
      },
      distribution: {
        byType: this.calculateMemoryDistribution(memoryStats),
        byImportance: this.calculateImportanceDistribution(memoryStats),
        byAge: this.calculateAgeDistribution(memoryStats)
      },
      trends: this.calculateMemoryTrends(memoryStats),
      pressure: memoryStats.pressure || 0,
      details: {
        totalItems: memoryStats.total.count,
        avgItemSize: memoryStats.total.avgSize,
        compressionRatio: memoryStats.compressionRatio || 1.0,
        evictionRate: memoryStats.evictionRate || 0
      }
    };
  }
  
  /**
   * Update knowledge graph
   */
  async updateKnowledgeGraph() {
    if (!this.memory) {return;}
    
    // Get semantic memory for knowledge graph
    const semanticMemory = await this.memory.getSemanticMemory();
    
    // Build graph structure
    const graph = this.buildKnowledgeGraph(semanticMemory);
    
    // Extract patterns
    const patterns = this.extractPatterns(semanticMemory);
    
    // Identify concepts
    const concepts = this.identifyConcepts(semanticMemory);
    
    // Map relationships
    const relationships = this.mapRelationships(semanticMemory);
    
    this.dashboardData.knowledge = {
      graph,
      patterns,
      concepts,
      relationships,
      stats: {
        totalNodes: graph.nodes.length,
        totalEdges: graph.edges.length,
        avgConnections: graph.edges.length / (graph.nodes.length || 1),
        clusters: this.identifyClusters(graph)
      }
    };
  }
  
  /**
   * Update learning progress
   */
  async updateLearningProgress() {
    if (!this.humanLearning) {return;}
    
    const learningMetrics = this.humanLearning.getMetrics();
    const activeProfile = this.humanLearning.activeProfile;
    
    this.dashboardData.learning = {
      progress: activeProfile ? 
        this.humanLearning.calculateLearningProgress(activeProfile) : 0,
      preferences: this.summarizePreferences(),
      adaptations: this.getActiveAdaptations(),
      accuracy: learningMetrics.accuracyScore,
      metrics: {
        preferencesLearned: learningMetrics.preferencesLearned,
        adaptationsMade: learningMetrics.adaptationsMade,
        feedbackProcessed: learningMetrics.feedbackProcessed,
        profilesActive: learningMetrics.profilesActive
      },
      patterns: {
        positive: learningMetrics.patternsLearned?.positive || 0,
        negative: learningMetrics.patternsLearned?.negative || 0,
        neutral: learningMetrics.patternsLearned?.neutral || 0
      }
    };
  }
  
  /**
   * Update agent collaboration data
   */
  async updateAgentData() {
    if (!this.handoffManager) {return;}
    
    const handoffMetrics = this.handoffManager.getMetrics();
    
    this.dashboardData.agents = {
      active: Array.from(this.handoffManager.activeAgents.entries()).map(([id, info]) => ({
        id,
        task: info.currentTask?.type,
        startTime: info.startTime,
        duration: Date.now() - new Date(info.startTime).getTime()
      })),
      handoffs: {
        total: handoffMetrics.totalHandoffs,
        successful: handoffMetrics.successfulHandoffs,
        failed: handoffMetrics.failedHandoffs,
        avgTime: handoffMetrics.averageTransferTime,
        contextLoss: handoffMetrics.contextLossRate
      },
      performance: this.calculateAgentPerformance(),
      collaboration: this.getCollaborationPatterns(),
      queue: handoffMetrics.queueLength
    };
  }
  
  /**
   * Calculate system metrics
   */
  async calculateMetrics() {
    const memory = this.dashboardData.memory;
    const learning = this.dashboardData.learning;
    const agents = this.dashboardData.agents;
    
    // System health (0-1)
    const memoryHealth = 1 - memory.pressure;
    const learningHealth = learning.accuracy;
    const agentHealth = agents.handoffs.total > 0 ? 
      agents.handoffs.successful / agents.handoffs.total : 1;
    
    this.dashboardData.metrics = {
      systemHealth: (memoryHealth + learningHealth + agentHealth) / 3,
      knowledgeGrowth: this.calculateKnowledgeGrowth(),
      learningRate: this.calculateLearningRate(),
      contextQuality: 1 - (agents.handoffs.contextLoss || 0),
      efficiency: this.calculateEfficiency()
    };
  }
  
  /**
   * Generate visualizations
   */
  async generateVisualizations() {
    // Generate memory usage chart
    const memoryChart = this.generateMemoryChart();
    
    // Generate knowledge graph visualization
    const knowledgeViz = this.generateKnowledgeVisualization();
    
    // Generate learning progress chart
    const learningChart = this.generateLearningChart();
    
    // Generate agent activity timeline
    const agentTimeline = this.generateAgentTimeline();
    
    // Save visualizations
    await this.saveVisualization('memory-chart', memoryChart);
    await this.saveVisualization('knowledge-graph', knowledgeViz);
    await this.saveVisualization('learning-progress', learningChart);
    await this.saveVisualization('agent-timeline', agentTimeline);
    
    // Generate combined dashboard HTML
    await this.generateDashboardHTML();
  }
  
  /**
   * Generate dashboard HTML
   */
  async generateDashboardHTML() {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BUMBA Knowledge Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            padding: 20px;
        }
        .dashboard {
            max-width: 1400px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            margin: 10px 0;
        }
        .metric-label {
            opacity: 0.9;
            font-size: 0.9em;
        }
        .chart-container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .knowledge-graph {
            min-height: 400px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .progress-bar {
            height: 30px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 15px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%);
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 5px;
        }
        .status-good { background: #4caf50; }
        .status-warning { background: #ff9800; }
        .status-error { background: #f44336; }
        .timestamp {
            text-align: center;
            opacity: 0.7;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <h1>🟢 BUMBA Knowledge Dashboard</h1>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">System Health</div>
                <div class="metric-value">${(this.dashboardData.metrics.systemHealth * 100).toFixed(1)}%</div>
                <span class="status-indicator ${this.getStatusClass(this.dashboardData.metrics.systemHealth)}"></span>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Memory Usage</div>
                <div class="metric-value">${(this.dashboardData.memory.usage.total * 100).toFixed(1)}%</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${this.dashboardData.memory.usage.total * 100}%">
                        ${(this.dashboardData.memory.usage.total * 100).toFixed(0)}%
                    </div>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Learning Progress</div>
                <div class="metric-value">${(this.dashboardData.learning.progress * 100).toFixed(1)}%</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${this.dashboardData.learning.progress * 100}%">
                        ${(this.dashboardData.learning.progress * 100).toFixed(0)}%
                    </div>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Active Agents</div>
                <div class="metric-value">${this.dashboardData.agents.active.length}</div>
                <div class="metric-label">Queue: ${this.dashboardData.agents.queue}</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Knowledge Nodes</div>
                <div class="metric-value">${this.dashboardData.knowledge.graph.nodes.length}</div>
                <div class="metric-label">Connections: ${this.dashboardData.knowledge.graph.edges.length}</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Preferences Learned</div>
                <div class="metric-value">${this.dashboardData.learning.metrics.preferencesLearned}</div>
                <div class="metric-label">Adaptations: ${this.dashboardData.learning.metrics.adaptationsMade}</div>
            </div>
        </div>
        
        <div class="chart-container">
            <h2>Memory Distribution</h2>
            ${this.renderMemoryDistribution()}
        </div>
        
        <div class="chart-container knowledge-graph">
            <h2>Knowledge Graph</h2>
            ${this.renderKnowledgeGraphSummary()}
        </div>
        
        <div class="chart-container">
            <h2>Agent Activity</h2>
            ${this.renderAgentActivity()}
        </div>
        
        <div class="chart-container">
            <h2>Learning Patterns</h2>
            ${this.renderLearningPatterns()}
        </div>
        
        <div class="timestamp">
            Last Updated: ${new Date().toLocaleString()}
        </div>
    </div>
    
    <script>
        // Auto-refresh every 5 seconds
        setTimeout(() => location.reload(), 5000);
    </script>
</body>
</html>`;
    
    const dashboardPath = path.join(this.config.outputPath, 'dashboard.html');
    await fs.writeFile(dashboardPath, html);
  }
  
  /**
   * Start web server for dashboard
   */
  async startWebServer() {
    this.server = http.createServer((req, res) => {
      this.handleWebRequest(req, res);
    });
    
    this.server.listen(this.config.port, () => {
      logger.info(`🟢 Dashboard web server running at http://localhost:${this.config.port}`);
    });
  }
  
  /**
   * Handle web requests
   */
  async handleWebRequest(req, res) {
    if (req.url === '/') {
      // Serve dashboard HTML
      const dashboardPath = path.join(this.config.outputPath, 'dashboard.html');
      
      try {
        const html = await fs.readFile(dashboardPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      } catch (error) {
        res.writeHead(404);
        res.end('Dashboard not found');
      }
      
    } else if (req.url === '/api/data') {
      // Serve dashboard data as JSON
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.dashboardData, null, 2));
      
    } else if (req.url === '/api/metrics') {
      // Serve metrics only
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.dashboardData.metrics, null, 2));
      
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  }
  
  // Helper methods for data processing
  
  calculateMemoryDistribution(stats) {
    const total = stats.total.count || 1;
    
    return {
      shortTerm: (stats.shortTerm.count / total) * 100,
      working: (stats.working.count / total) * 100,
      longTerm: (stats.longTerm.count / total) * 100,
      semantic: (stats.semantic.count / total) * 100
    };
  }
  
  calculateImportanceDistribution(stats) {
    // Simplified importance distribution
    return {
      critical: 15,
      high: 25,
      medium: 40,
      low: 20
    };
  }
  
  calculateAgeDistribution(stats) {
    // Simplified age distribution
    return {
      recent: 30,
      today: 25,
      week: 20,
      month: 15,
      older: 10
    };
  }
  
  calculateMemoryTrends(stats) {
    // Add current data point to trends
    const trend = {
      timestamp: Date.now(),
      usage: stats.total.usage,
      count: stats.total.count
    };
    
    return [...(this.dashboardData.memory.trends || []), trend].slice(-20);
  }
  
  buildKnowledgeGraph(semanticMemory) {
    const nodes = [];
    const edges = [];
    
    if (!semanticMemory || !semanticMemory.concepts) {
      return { nodes, edges };
    }
    
    // Create nodes from concepts
    Object.entries(semanticMemory.concepts).forEach(([id, concept]) => {
      nodes.push({
        id,
        label: concept.name || id,
        type: concept.type || 'concept',
        importance: concept.importance || 0.5
      });
    });
    
    // Create edges from relationships
    if (semanticMemory.relationships) {
      Object.values(semanticMemory.relationships).forEach(rel => {
        edges.push({
          source: rel.from,
          target: rel.to,
          type: rel.type || 'related',
          weight: rel.weight || 1
        });
      });
    }
    
    return { nodes, edges };
  }
  
  extractPatterns(semanticMemory) {
    if (!semanticMemory || !semanticMemory.patterns) {
      return [];
    }
    
    return Object.values(semanticMemory.patterns).slice(0, 10).map(pattern => ({
      id: pattern.id,
      description: pattern.description,
      frequency: pattern.frequency || 1,
      confidence: pattern.confidence || 0.5
    }));
  }
  
  identifyConcepts(semanticMemory) {
    if (!semanticMemory || !semanticMemory.concepts) {
      return [];
    }
    
    return Object.values(semanticMemory.concepts)
      .sort((a, b) => (b.importance || 0) - (a.importance || 0))
      .slice(0, 20)
      .map(concept => ({
        id: concept.id,
        name: concept.name,
        type: concept.type,
        importance: concept.importance
      }));
  }
  
  mapRelationships(semanticMemory) {
    if (!semanticMemory || !semanticMemory.relationships) {
      return [];
    }
    
    const relationshipTypes = {};
    
    Object.values(semanticMemory.relationships).forEach(rel => {
      const type = rel.type || 'unknown';
      relationshipTypes[type] = (relationshipTypes[type] || 0) + 1;
    });
    
    return Object.entries(relationshipTypes).map(([type, count]) => ({
      type,
      count
    }));
  }
  
  identifyClusters(graph) {
    // Simplified cluster detection
    const clusters = [];
    const visited = new Set();
    
    graph.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const cluster = this.findCluster(node, graph, visited);
        if (cluster.length > 1) {
          clusters.push(cluster);
        }
      }
    });
    
    return clusters.length;
  }
  
  findCluster(startNode, graph, visited) {
    const cluster = [startNode.id];
    visited.add(startNode.id);
    
    // Find connected nodes
    graph.edges.forEach(edge => {
      if (edge.source === startNode.id && !visited.has(edge.target)) {
        cluster.push(edge.target);
        visited.add(edge.target);
      }
    });
    
    return cluster;
  }
  
  summarizePreferences() {
    if (!this.humanLearning) {return {};}
    
    const categories = this.humanLearning.preferenceCategories;
    const summary = {};
    
    for (const [category, prefs] of Object.entries(categories)) {
      summary[category] = prefs.size;
    }
    
    return summary;
  }
  
  getActiveAdaptations() {
    if (!this.humanLearning) {return [];}
    
    return Array.from(this.humanLearning.adaptations.values())
      .filter(a => a.active)
      .slice(0, 5)
      .map(a => ({
        type: a.type,
        category: a.category,
        confidence: a.confidence
      }));
  }
  
  calculateAgentPerformance() {
    if (!this.handoffManager) {return {};}
    
    const performance = {};
    
    this.handoffManager.agentMetrics.forEach((metrics, agentId) => {
      performance[agentId] = {
        errorRate: metrics.errorRate || 0,
        responseTime: metrics.responseTime || 0,
        successRate: metrics.successRate || 1
      };
    });
    
    return performance;
  }
  
  getCollaborationPatterns() {
    // Extract collaboration patterns from handoff history
    if (!this.handoffManager) {return [];}
    
    const patterns = {};
    
    this.handoffManager.handoffHistory.forEach(handoff => {
      const key = `${handoff.fromAgent}->${handoff.toAgent}`;
      patterns[key] = (patterns[key] || 0) + 1;
    });
    
    return Object.entries(patterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern, count]) => ({ pattern, count }));
  }
  
  calculateKnowledgeGrowth() {
    const current = this.dashboardData.knowledge.graph.nodes.length;
    const previous = this.history.memory[this.history.memory.length - 2]?.knowledgeNodes || current;
    
    return previous > 0 ? (current - previous) / previous : 0;
  }
  
  calculateLearningRate() {
    const current = this.dashboardData.learning.metrics.preferencesLearned;
    const previous = this.history.learning[this.history.learning.length - 2]?.preferences || current;
    
    return current - previous;
  }
  
  calculateEfficiency() {
    const handoffs = this.dashboardData.agents.handoffs;
    const memory = this.dashboardData.memory;
    
    const handoffEfficiency = handoffs.total > 0 ? 
      handoffs.successful / handoffs.total : 1;
    const memoryEfficiency = 1 - memory.pressure;
    
    return (handoffEfficiency + memoryEfficiency) / 2;
  }
  
  updateHistory() {
    // Update memory history
    this.history.memory.push({
      timestamp: Date.now(),
      usage: this.dashboardData.memory.usage.total,
      knowledgeNodes: this.dashboardData.knowledge.graph.nodes.length
    });
    
    // Update learning history
    this.history.learning.push({
      timestamp: Date.now(),
      preferences: this.dashboardData.learning.metrics.preferencesLearned,
      accuracy: this.dashboardData.learning.accuracy
    });
    
    // Update performance history
    this.history.performance.push({
      timestamp: Date.now(),
      systemHealth: this.dashboardData.metrics.systemHealth,
      efficiency: this.dashboardData.metrics.efficiency
    });
    
    // Keep only recent history
    const maxHistory = this.config.historyLength;
    this.history.memory = this.history.memory.slice(-maxHistory);
    this.history.learning = this.history.learning.slice(-maxHistory);
    this.history.performance = this.history.performance.slice(-maxHistory);
  }
  
  // Visualization generation methods
  
  generateMemoryChart() {
    const data = this.dashboardData.memory.usage;
    
    return {
      type: 'bar',
      data: Object.entries(data).map(([type, usage]) => ({
        label: type,
        value: usage * 100
      }))
    };
  }
  
  generateKnowledgeVisualization() {
    return {
      type: 'graph',
      nodes: this.dashboardData.knowledge.graph.nodes.slice(0, 50),
      edges: this.dashboardData.knowledge.graph.edges.slice(0, 100)
    };
  }
  
  generateLearningChart() {
    return {
      type: 'line',
      data: this.history.learning.map(point => ({
        x: point.timestamp,
        y: point.accuracy * 100
      }))
    };
  }
  
  generateAgentTimeline() {
    return {
      type: 'timeline',
      events: this.dashboardData.agents.active.map(agent => ({
        id: agent.id,
        start: agent.startTime,
        duration: agent.duration,
        task: agent.task
      }))
    };
  }
  
  async saveVisualization(name, data) {
    const vizPath = path.join(this.config.outputPath, `${name}.json`);
    await fs.writeFile(vizPath, JSON.stringify(data, null, 2));
  }
  
  async saveDashboardState() {
    const statePath = path.join(this.config.outputPath, 'state.json');
    await fs.writeFile(statePath, JSON.stringify(this.dashboardData, null, 2));
  }
  
  // HTML rendering helpers
  
  renderMemoryDistribution() {
    const dist = this.dashboardData.memory.distribution.byType;
    
    return `
      <div style="display: flex; justify-content: space-around; margin: 20px 0;">
        ${Object.entries(dist).map(([type, percent]) => `
          <div style="text-align: center;">
            <div style="font-size: 1.5em; font-weight: bold;">${percent.toFixed(1)}%</div>
            <div style="opacity: 0.8;">${type}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  renderKnowledgeGraphSummary() {
    const stats = this.dashboardData.knowledge.stats;
    
    return `
      <div style="text-align: center;">
        <div style="font-size: 3em; margin: 20px;">🟢️</div>
        <div>Nodes: ${stats.totalNodes} | Edges: ${stats.totalEdges}</div>
        <div>Average Connections: ${stats.avgConnections.toFixed(2)}</div>
        <div>Clusters Identified: ${stats.clusters}</div>
      </div>
    `;
  }
  
  renderAgentActivity() {
    const agents = this.dashboardData.agents;
    
    return `
      <div>
        <div>Active Agents: ${agents.active.length}</div>
        <div>Total Handoffs: ${agents.handoffs.total}</div>
        <div>Success Rate: ${agents.handoffs.total > 0 ? 
          ((agents.handoffs.successful / agents.handoffs.total) * 100).toFixed(1) : 100}%</div>
        <div>Average Transfer Time: ${(agents.handoffs.avgTime / 1000).toFixed(2)}s</div>
      </div>
    `;
  }
  
  renderLearningPatterns() {
    const patterns = this.dashboardData.learning.patterns;
    
    return `
      <div style="display: flex; justify-content: space-around; margin: 20px 0;">
        <div style="text-align: center;">
          <div style="color: #4caf50; font-size: 2em;">+${patterns.positive}</div>
          <div>Positive</div>
        </div>
        <div style="text-align: center;">
          <div style="color: #ff9800; font-size: 2em;">${patterns.neutral}</div>
          <div>Neutral</div>
        </div>
        <div style="text-align: center;">
          <div style="color: #f44336; font-size: 2em;">-${patterns.negative}</div>
          <div>Negative</div>
        </div>
      </div>
    `;
  }
  
  getStatusClass(value) {
    if (value >= 0.8) {return 'status-good';}
    if (value >= 0.5) {return 'status-warning';}
    return 'status-error';
  }
  
  setupEventListeners() {
    // Listen to memory events
    if (this.memory) {
      this.memory.on('memory-stored', () => {
        this.emit('data-change', 'memory');
      });
    }
    
    // Listen to learning events
    if (this.humanLearning) {
      this.humanLearning.on('preference-captured', () => {
        this.emit('data-change', 'learning');
      });
    }
    
    // Listen to handoff events
    if (this.handoffManager) {
      this.handoffManager.on('context-transferred', () => {
        this.emit('data-change', 'handoff');
      });
    }
  }
  
  /**
   * Get dashboard URL
   */
  getDashboardURL() {
    return `http://localhost:${this.config.port}`;
  }
  
  /**
   * Stop the dashboard
   */
  async stop() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    
    if (this.server) {
      this.server.close();
    }
    
    await this.saveDashboardState();
    
    logger.info('🟢 Knowledge Dashboard stopped');
  }
}

// Export singleton
let instance = null;

module.exports = {
  KnowledgeDashboard,
  getInstance: (config) => {
    if (!instance) {
      instance = new KnowledgeDashboard(config);
    }
    return instance;
  }
};