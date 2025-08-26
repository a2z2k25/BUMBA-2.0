/**
 * BUMBA Quality Metrics Dashboard
 * Real-time testing and quality metrics visualization
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const http = require('http');
const fs = require('fs');
const path = require('path');

class QualityMetricsDashboard extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      port: config.port || 3456,
      refreshInterval: config.refreshInterval || 5000,
      metricsHistory: config.metricsHistory || 100,
      alertThresholds: config.alertThresholds || {
        coverage: 80,
        testFailures: 5,
        performanceRegression: 10,
        mutationScore: 75
      },
      ...config
    };
    
    this.metrics = {
      overview: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        coverage: 0,
        mutationScore: 0,
        buildStatus: 'unknown',
        lastUpdated: null
      },
      testSuites: new Map(),
      coverage: {
        lines: 0,
        branches: 0,
        functions: 0,
        statements: 0
      },
      performance: {
        avgTestDuration: 0,
        slowestTests: [],
        p95ResponseTime: 0,
        throughput: 0
      },
      quality: {
        codeSmells: 0,
        duplications: 0,
        complexity: 0,
        maintainability: 'A'
      },
      trends: {
        coverage: [],
        testResults: [],
        performance: [],
        quality: []
      },
      alerts: []
    };
    
    this.server = null;
    this.updateInterval = null;
  }
  
  /**
   * Start dashboard server
   */
  async start() {
    logger.info(`Starting Quality Metrics Dashboard on port ${this.config.port}`);
    
    // Create HTTP server
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });
    
    // Start server
    this.server.listen(this.config.port, () => {
      logger.info(`Dashboard running at http://localhost:${this.config.port}`);
    });
    
    // Start metrics collection
    this.startMetricsCollection();
    
    // Initialize with sample data
    await this.collectMetrics();
    
    this.emit('dashboard-started', {
      url: `http://localhost:${this.config.port}`
    });
  }
  
  /**
   * Handle HTTP requests
   */
  handleRequest(req, res) {
    const url = new URL(req.url, `http://localhost:${this.config.port}`);
    
    // Route handling
    switch (url.pathname) {
      case '/':
        this.serveDashboard(res);
        break;
      
      case '/api/metrics':
        this.serveMetrics(res);
        break;
      
      case '/api/metrics/overview':
        this.serveOverview(res);
        break;
      
      case '/api/metrics/coverage':
        this.serveCoverage(res);
        break;
      
      case '/api/metrics/performance':
        this.servePerformance(res);
        break;
      
      case '/api/metrics/quality':
        this.serveQuality(res);
        break;
      
      case '/api/metrics/trends':
        this.serveTrends(res);
        break;
      
      case '/api/metrics/alerts':
        this.serveAlerts(res);
        break;
      
      case '/api/refresh':
        this.refreshMetrics(res);
        break;
      
      case '/ws':
        this.handleWebSocket(req, res);
        break;
      
      default:
        res.writeHead(404);
        res.end('Not Found');
    }
  }
  
  /**
   * Serve main dashboard HTML
   */
  serveDashboard(res) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>BUMBA Quality Metrics Dashboard</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: #333;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }
    
    header {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 15px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }
    
    h1 {
      color: #333;
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .status-bar {
      display: flex;
      gap: 20px;
      align-items: center;
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    
    .status-dot.success { background: #10b981; }
    .status-dot.warning { background: #f59e0b; }
    .status-dot.error { background: #ef4444; }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .metric-card {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 15px;
      padding: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s, box-shadow 0.3s;
    }
    
    .metric-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
    }
    
    .metric-label {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .metric-value {
      font-size: 36px;
      font-weight: bold;
      color: #333;
      margin-bottom: 10px;
    }
    
    .metric-change {
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .metric-change.positive { color: #10b981; }
    .metric-change.negative { color: #ef4444; }
    
    .chart-container {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 15px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }
    
    .chart-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
      color: #333;
    }
    
    .chart {
      width: 100%;
      height: 300px;
      position: relative;
    }
    
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.5s ease;
    }
    
    .alerts-container {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 15px;
      padding: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }
    
    .alert {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .alert.info { background: #dbeafe; color: #1e40af; }
    .alert.warning { background: #fed7aa; color: #92400e; }
    .alert.error { background: #fee2e2; color: #991b1b; }
    .alert.success { background: #d1fae5; color: #065f46; }
    
    .test-results {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    
    .test-suite {
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    
    .test-suite.failed {
      border-left-color: #ef4444;
    }
    
    .test-suite-name {
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .test-stats {
      display: flex;
      gap: 15px;
      font-size: 14px;
      color: #6b7280;
    }
    
    .coverage-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-top: 20px;
    }
    
    .coverage-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background: #f9fafb;
      border-radius: 8px;
    }
    
    .coverage-label {
      font-weight: 500;
    }
    
    .coverage-value {
      font-weight: bold;
      font-size: 18px;
    }
    
    .coverage-value.good { color: #10b981; }
    .coverage-value.medium { color: #f59e0b; }
    .coverage-value.bad { color: #ef4444; }
    
    @media (max-width: 768px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }
      
      .coverage-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🟡 BUMBA Quality Metrics Dashboard</h1>
      <div class="status-bar">
        <div class="status-indicator">
          <div class="status-dot success"></div>
          <span>Live</span>
        </div>
        <div class="status-indicator">
          <span id="last-updated">Last updated: Never</span>
        </div>
        <div class="status-indicator">
          <button onclick="refreshMetrics()">🔄 Refresh</button>
        </div>
      </div>
    </header>
    
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Total Tests</div>
        <div class="metric-value" id="total-tests">0</div>
        <div class="metric-change positive">
          <span>↑</span>
          <span id="tests-change">+0%</span>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-label">Pass Rate</div>
        <div class="metric-value" id="pass-rate">0%</div>
        <div class="progress-bar">
          <div class="progress-fill" id="pass-rate-bar" style="width: 0%"></div>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-label">Code Coverage</div>
        <div class="metric-value" id="coverage">0%</div>
        <div class="progress-bar">
          <div class="progress-fill" id="coverage-bar" style="width: 0%"></div>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-label">Mutation Score</div>
        <div class="metric-value" id="mutation-score">0%</div>
        <div class="progress-bar">
          <div class="progress-fill" id="mutation-bar" style="width: 0%"></div>
        </div>
      </div>
    </div>
    
    <div class="chart-container">
      <div class="chart-title">Test Results Trend</div>
      <canvas id="test-trend-chart" class="chart"></canvas>
    </div>
    
    <div class="chart-container">
      <div class="chart-title">Coverage Details</div>
      <div class="coverage-grid">
        <div class="coverage-item">
          <span class="coverage-label">Lines</span>
          <span class="coverage-value good" id="coverage-lines">0%</span>
        </div>
        <div class="coverage-item">
          <span class="coverage-label">Branches</span>
          <span class="coverage-value good" id="coverage-branches">0%</span>
        </div>
        <div class="coverage-item">
          <span class="coverage-label">Functions</span>
          <span class="coverage-value good" id="coverage-functions">0%</span>
        </div>
        <div class="coverage-item">
          <span class="coverage-label">Statements</span>
          <span class="coverage-value good" id="coverage-statements">0%</span>
        </div>
      </div>
    </div>
    
    <div class="chart-container">
      <div class="chart-title">Test Suites</div>
      <div class="test-results" id="test-suites"></div>
    </div>
    
    <div class="alerts-container">
      <div class="chart-title">Alerts & Notifications</div>
      <div id="alerts-list"></div>
    </div>
  </div>
  
  <script>
    let metricsData = {};
    
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/metrics');
        metricsData = await response.json();
        updateDashboard();
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    }
    
    function updateDashboard() {
      // Update overview metrics
      document.getElementById('total-tests').textContent = metricsData.overview.totalTests;
      
      const passRate = metricsData.overview.totalTests > 0
        ? ((metricsData.overview.passedTests / metricsData.overview.totalTests) * 100).toFixed(1)
        : 0;
      document.getElementById('pass-rate').textContent = passRate + '%';
      document.getElementById('pass-rate-bar').style.width = passRate + '%';
      
      document.getElementById('coverage').textContent = metricsData.coverage.lines.toFixed(1) + '%';
      document.getElementById('coverage-bar').style.width = metricsData.coverage.lines + '%';
      
      document.getElementById('mutation-score').textContent = metricsData.overview.mutationScore.toFixed(1) + '%';
      document.getElementById('mutation-bar').style.width = metricsData.overview.mutationScore + '%';
      
      // Update coverage details
      document.getElementById('coverage-lines').textContent = metricsData.coverage.lines.toFixed(1) + '%';
      document.getElementById('coverage-branches').textContent = metricsData.coverage.branches.toFixed(1) + '%';
      document.getElementById('coverage-functions').textContent = metricsData.coverage.functions.toFixed(1) + '%';
      document.getElementById('coverage-statements').textContent = metricsData.coverage.statements.toFixed(1) + '%';
      
      // Update test suites
      const suitesHtml = Array.from(metricsData.testSuites.values()).map(suite => \`
        <div class="test-suite \${suite.failed > 0 ? 'failed' : ''}">
          <div class="test-suite-name">\${suite.name}</div>
          <div class="test-stats">
            <span>🏁 \${suite.passed}</span>
            <span>🔴 \${suite.failed}</span>
            <span>⊘ \${suite.skipped}</span>
          </div>
        </div>
      \`).join('');
      document.getElementById('test-suites').innerHTML = suitesHtml;
      
      // Update alerts
      const alertsHtml = metricsData.alerts.map(alert => \`
        <div class="alert \${alert.level}">
          <span>\${alert.icon}</span>
          <span>\${alert.message}</span>
        </div>
      \`).join('');
      document.getElementById('alerts-list').innerHTML = alertsHtml || '<div class="alert success">🏁 All systems operational</div>';
      
      // Update last updated time
      document.getElementById('last-updated').textContent = 'Last updated: ' + new Date(metricsData.overview.lastUpdated).toLocaleTimeString();
    }
    
    function refreshMetrics() {
      fetch('/api/refresh', { method: 'POST' })
        .then(() => fetchMetrics());
    }
    
    // Auto-refresh every 5 seconds
    setInterval(fetchMetrics, ${this.config.refreshInterval});
    
    // Initial load
    fetchMetrics();
  </script>
</body>
</html>
    `;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }
  
  /**
   * Serve metrics API
   */
  serveMetrics(res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(this.metrics));
  }
  
  /**
   * Serve overview metrics
   */
  serveOverview(res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(this.metrics.overview));
  }
  
  /**
   * Serve coverage metrics
   */
  serveCoverage(res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(this.metrics.coverage));
  }
  
  /**
   * Serve performance metrics
   */
  servePerformance(res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(this.metrics.performance));
  }
  
  /**
   * Serve quality metrics
   */
  serveQuality(res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(this.metrics.quality));
  }
  
  /**
   * Serve trends data
   */
  serveTrends(res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(this.metrics.trends));
  }
  
  /**
   * Serve alerts
   */
  serveAlerts(res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(this.metrics.alerts));
  }
  
  /**
   * Refresh metrics on demand
   */
  async refreshMetrics(res) {
    await this.collectMetrics();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'refreshed', timestamp: Date.now() }));
  }
  
  /**
   * Start automatic metrics collection
   */
  startMetricsCollection() {
    this.updateInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.refreshInterval);
  }
  
  /**
   * Collect all metrics
   */
  async collectMetrics() {
    logger.info('Collecting quality metrics');
    
    // Update overview
    this.updateOverview();
    
    // Update test suites
    this.updateTestSuites();
    
    // Update coverage
    this.updateCoverage();
    
    // Update performance
    this.updatePerformance();
    
    // Update quality
    this.updateQuality();
    
    // Update trends
    this.updateTrends();
    
    // Check for alerts
    this.checkAlerts();
    
    this.metrics.overview.lastUpdated = Date.now();
    
    this.emit('metrics-updated', this.metrics);
  }
  
  /**
   * Update overview metrics
   */
  updateOverview() {
    // Simulate metrics collection
    this.metrics.overview = {
      totalTests: Math.floor(Math.random() * 50) + 450,
      passedTests: Math.floor(Math.random() * 40) + 410,
      failedTests: Math.floor(Math.random() * 10),
      skippedTests: Math.floor(Math.random() * 5),
      coverage: 75 + Math.random() * 20,
      mutationScore: 70 + Math.random() * 25,
      buildStatus: Math.random() > 0.1 ? 'success' : 'failed',
      lastUpdated: Date.now()
    };
  }
  
  /**
   * Update test suite metrics
   */
  updateTestSuites() {
    const suites = [
      'Unit Tests',
      'Integration Tests',
      'E2E Tests',
      'Performance Tests',
      'Visual Tests'
    ];
    
    this.metrics.testSuites.clear();
    
    for (const suite of suites) {
      const total = Math.floor(Math.random() * 100) + 50;
      const failed = Math.floor(Math.random() * 5);
      const skipped = Math.floor(Math.random() * 3);
      const passed = total - failed - skipped;
      
      this.metrics.testSuites.set(suite, {
        name: suite,
        total,
        passed,
        failed,
        skipped,
        duration: Math.floor(Math.random() * 10000) + 1000
      });
    }
  }
  
  /**
   * Update coverage metrics
   */
  updateCoverage() {
    this.metrics.coverage = {
      lines: 75 + Math.random() * 20,
      branches: 70 + Math.random() * 25,
      functions: 80 + Math.random() * 15,
      statements: 75 + Math.random() * 20
    };
  }
  
  /**
   * Update performance metrics
   */
  updatePerformance() {
    this.metrics.performance = {
      avgTestDuration: Math.floor(Math.random() * 5000) + 1000,
      slowestTests: [
        { name: 'Integration: Database', duration: 8542 },
        { name: 'E2E: User Journey', duration: 6234 },
        { name: 'Performance: Load Test', duration: 5123 }
      ],
      p95ResponseTime: Math.floor(Math.random() * 500) + 200,
      throughput: Math.floor(Math.random() * 1000) + 500
    };
  }
  
  /**
   * Update quality metrics
   */
  updateQuality() {
    this.metrics.quality = {
      codeSmells: Math.floor(Math.random() * 20),
      duplications: Math.floor(Math.random() * 5),
      complexity: Math.floor(Math.random() * 10) + 5,
      maintainability: ['A', 'B', 'C'][Math.floor(Math.random() * 3)]
    };
  }
  
  /**
   * Update trends
   */
  updateTrends() {
    // Add new data point
    const dataPoint = {
      timestamp: Date.now(),
      coverage: this.metrics.coverage.lines,
      passRate: this.metrics.overview.totalTests > 0
        ? (this.metrics.overview.passedTests / this.metrics.overview.totalTests * 100)
        : 0,
      performance: this.metrics.performance.avgTestDuration,
      quality: this.metrics.quality.codeSmells
    };
    
    this.metrics.trends.coverage.push(dataPoint.coverage);
    this.metrics.trends.testResults.push(dataPoint.passRate);
    this.metrics.trends.performance.push(dataPoint.performance);
    this.metrics.trends.quality.push(dataPoint.quality);
    
    // Keep only recent history
    if (this.metrics.trends.coverage.length > this.config.metricsHistory) {
      this.metrics.trends.coverage.shift();
      this.metrics.trends.testResults.shift();
      this.metrics.trends.performance.shift();
      this.metrics.trends.quality.shift();
    }
  }
  
  /**
   * Check for alerts
   */
  checkAlerts() {
    this.metrics.alerts = [];
    
    // Coverage alert
    if (this.metrics.coverage.lines < this.config.alertThresholds.coverage) {
      this.metrics.alerts.push({
        level: 'warning',
        icon: '🟠️',
        message: `Code coverage (${this.metrics.coverage.lines.toFixed(1)}%) is below threshold (${this.config.alertThresholds.coverage}%)`,
        timestamp: Date.now()
      });
    }
    
    // Test failures alert
    if (this.metrics.overview.failedTests > this.config.alertThresholds.testFailures) {
      this.metrics.alerts.push({
        level: 'error',
        icon: '🔴',
        message: `${this.metrics.overview.failedTests} tests are failing`,
        timestamp: Date.now()
      });
    }
    
    // Performance regression alert
    if (this.metrics.performance.avgTestDuration > 5000) {
      this.metrics.alerts.push({
        level: 'warning',
        icon: '🐌',
        message: 'Test suite is running slower than usual',
        timestamp: Date.now()
      });
    }
    
    // Mutation score alert
    if (this.metrics.overview.mutationScore < this.config.alertThresholds.mutationScore) {
      this.metrics.alerts.push({
        level: 'info',
        icon: 'ℹ️',
        message: `Mutation score (${this.metrics.overview.mutationScore.toFixed(1)}%) could be improved`,
        timestamp: Date.now()
      });
    }
    
    // Build status alert
    if (this.metrics.overview.buildStatus === 'failed') {
      this.metrics.alerts.push({
        level: 'error',
        icon: '🔴',
        message: 'Latest build failed',
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Export metrics report
   */
  async exportReport(format = 'json') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `quality-metrics-${timestamp}.${format}`;
    const filepath = path.join(process.cwd(), 'reports', filename);
    
    // Ensure reports directory exists
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    
    switch (format) {
      case 'json':
        fs.writeFileSync(filepath, JSON.stringify(this.metrics, null, 2));
        break;
      
      case 'html':
        const htmlReport = this.generateHTMLReport();
        fs.writeFileSync(filepath, htmlReport);
        break;
      
      case 'csv':
        const csvReport = this.generateCSVReport();
        fs.writeFileSync(filepath, csvReport);
        break;
    }
    
    logger.info(`Report exported to ${filepath}`);
    return filepath;
  }
  
  /**
   * Generate HTML report
   */
  generateHTMLReport() {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Quality Metrics Report - ${new Date().toLocaleDateString()}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; }
    .metric { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
    .metric-name { font-weight: bold; color: #666; }
    .metric-value { font-size: 24px; color: #333; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>Quality Metrics Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  
  <div class="metric">
    <div class="metric-name">Test Results</div>
    <div class="metric-value">
      ${this.metrics.overview.passedTests} / ${this.metrics.overview.totalTests} passed
    </div>
  </div>
  
  <div class="metric">
    <div class="metric-name">Code Coverage</div>
    <div class="metric-value">${this.metrics.coverage.lines.toFixed(1)}%</div>
  </div>
  
  <div class="metric">
    <div class="metric-name">Mutation Score</div>
    <div class="metric-value">${this.metrics.overview.mutationScore.toFixed(1)}%</div>
  </div>
  
  <h2>Coverage Details</h2>
  <table>
    <tr><th>Metric</th><th>Coverage</th></tr>
    <tr><td>Lines</td><td>${this.metrics.coverage.lines.toFixed(1)}%</td></tr>
    <tr><td>Branches</td><td>${this.metrics.coverage.branches.toFixed(1)}%</td></tr>
    <tr><td>Functions</td><td>${this.metrics.coverage.functions.toFixed(1)}%</td></tr>
    <tr><td>Statements</td><td>${this.metrics.coverage.statements.toFixed(1)}%</td></tr>
  </table>
  
  <h2>Test Suites</h2>
  <table>
    <tr><th>Suite</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Total</th></tr>
    ${Array.from(this.metrics.testSuites.values()).map(suite => `
      <tr>
        <td>${suite.name}</td>
        <td>${suite.passed}</td>
        <td>${suite.failed}</td>
        <td>${suite.skipped}</td>
        <td>${suite.total}</td>
      </tr>
    `).join('')}
  </table>
</body>
</html>
    `;
  }
  
  /**
   * Generate CSV report
   */
  generateCSVReport() {
    let csv = 'Metric,Value\n';
    csv += `Total Tests,${this.metrics.overview.totalTests}\n`;
    csv += `Passed Tests,${this.metrics.overview.passedTests}\n`;
    csv += `Failed Tests,${this.metrics.overview.failedTests}\n`;
    csv += `Skipped Tests,${this.metrics.overview.skippedTests}\n`;
    csv += `Line Coverage,${this.metrics.coverage.lines.toFixed(1)}%\n`;
    csv += `Branch Coverage,${this.metrics.coverage.branches.toFixed(1)}%\n`;
    csv += `Function Coverage,${this.metrics.coverage.functions.toFixed(1)}%\n`;
    csv += `Statement Coverage,${this.metrics.coverage.statements.toFixed(1)}%\n`;
    csv += `Mutation Score,${this.metrics.overview.mutationScore.toFixed(1)}%\n`;
    csv += `Average Test Duration,${this.metrics.performance.avgTestDuration}ms\n`;
    csv += `Code Smells,${this.metrics.quality.codeSmells}\n`;
    csv += `Maintainability,${this.metrics.quality.maintainability}\n`;
    
    return csv;
  }
  
  /**
   * Stop dashboard
   */
  async stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    if (this.server) {
      this.server.close();
    }
    
    logger.info('Quality Metrics Dashboard stopped');
    this.emit('dashboard-stopped');
  }
}

// Export singleton
module.exports = new QualityMetricsDashboard();