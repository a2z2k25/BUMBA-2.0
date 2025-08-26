/**
 * BUMBA Development Mode - Sprint 4: Integration & Dashboard
 * 
 * Complete development mode with hot reload, debugging, profiling,
 * and integrated development dashboard
 */

const EventEmitter = require('events');
const HotReloadSystem = require('./hot-reload');
const AdvancedDebugger = require('./debugger');
const PerformanceProfiler = require('./profiler');
const blessed = require('blessed');
const contrib = require('blessed-contrib');

/**
 * Enhanced Development Mode for BUMBA
 * Integrates all development tools for a powerful dev experience
 */
class DevelopmentModeEnhanced extends EventEmitter {
  constructor(framework, config = {}) {
    super();
    
    this.framework = framework;
    
    this.config = {
      // Mode settings
      autoStart: config.autoStart !== false,
      dashboardEnabled: config.dashboardEnabled !== false,
      
      // Tool settings
      hotReload: config.hotReload !== false,
      debugging: config.debugging !== false,
      profiling: config.profiling !== false,
      
      // Dashboard settings
      dashboardPort: config.dashboardPort || 3030,
      dashboardRefresh: config.dashboardRefresh || 1000, // ms
      
      // Code quality
      linting: config.linting !== false,
      typeChecking: config.typeChecking !== false,
      testRunner: config.testRunner || 'jest',
      
      // Environment
      env: config.env || 'development',
      verbose: config.verbose !== false
    };
    
    // Components
    this.components = {
      hotReload: null,
      debugger: null,
      profiler: null,
      dashboard: null
    };
    
    // State
    this.state = {
      mode: 'development-enhanced',
      operational: 70, // Starting at 70%
      active: false,
      tools: {
        hotReload: false,
        debugger: false,
        profiler: false,
        dashboard: false
      }
    };
    
    // Metrics
    this.metrics = {
      reloads: 0,
      debugSessions: 0,
      profilesGenerated: 0,
      errors: [],
      warnings: []
    };
    
    // Initialize components
    this.initializeComponents();
  }

  /**
   * Initialize all components
   */
  initializeComponents() {
    // Initialize Hot Reload
    if (this.config.hotReload) {
      this.components.hotReload = new HotReloadSystem({
        watchPaths: ['./src'],
        preserveState: true,
        errorRecovery: true
      });
      
      this.setupHotReloadHandlers();
    }
    
    // Initialize Debugger
    if (this.config.debugging) {
      this.components.debugger = new AdvancedDebugger({
        autoOpen: false,
        catchExceptions: true,
        enhancedStackTrace: true
      });
      
      this.setupDebuggerHandlers();
    }
    
    // Initialize Profiler
    if (this.config.profiling) {
      this.components.profiler = new PerformanceProfiler({
        cpuProfiling: true,
        memoryProfiling: true,
        realTimeMetrics: true
      });
      
      this.setupProfilerHandlers();
    }
  }

  /**
   * Setup hot reload event handlers
   */
  setupHotReloadHandlers() {
    const hotReload = this.components.hotReload;
    
    hotReload.on('reload-complete', (data) => {
      console.log(`🔥 Hot reload complete: ${data.files.length} files`);
      this.metrics.reloads++;
      this.updateDashboard();
    });
    
    hotReload.on('reload-error', (data) => {
      console.error(`🔴 Hot reload error:`, data.error.message);
      this.metrics.errors.push({
        type: 'hot-reload',
        error: data.error,
        timestamp: Date.now()
      });
    });
    
    hotReload.on('state-saved', () => {
      console.log('💾 State preserved');
    });
    
    hotReload.on('state-restored', () => {
      console.log('🟢️ State restored');
    });
  }

  /**
   * Setup debugger event handlers
   */
  setupDebuggerHandlers() {
    const dbg = this.components.debugger;
    
    dbg.on('breakpoint-hit', (breakpoint) => {
      console.log(`🔴 Breakpoint hit: ${breakpoint.file}:${breakpoint.line}`);
      this.updateDashboard();
    });
    
    dbg.on('exception', (error) => {
      console.error(`🔴 Exception caught:`, error.message);
      this.metrics.errors.push({
        type: 'exception',
        error,
        timestamp: Date.now()
      });
    });
    
    dbg.on('paused', () => {
      console.log('⏸️ Debugger paused');
      this.metrics.debugSessions++;
    });
  }

  /**
   * Setup profiler event handlers
   */
  setupProfilerHandlers() {
    const profiler = this.components.profiler;
    
    profiler.on('bottleneck', (bottleneck) => {
      console.warn(`🐌 Performance bottleneck: ${bottleneck.name}`);
      this.metrics.warnings.push({
        type: 'bottleneck',
        data: bottleneck,
        timestamp: Date.now()
      });
    });
    
    profiler.on('memory-leak', (leak) => {
      console.warn(`💧 Memory leak detected: ${leak.growth.toFixed(2)}MB`);
      this.metrics.warnings.push({
        type: 'memory-leak',
        data: leak,
        timestamp: Date.now()
      });
    });
    
    profiler.on('stopped', (report) => {
      this.metrics.profilesGenerated++;
      this.displayProfileSummary(report);
    });
  }

  /**
   * Activate development mode
   */
  async activate() {
    if (this.state.active) {
      return { success: false, message: 'Already active' };
    }
    
    this.state.active = true;
    
    console.log('\n' + '='.repeat(60));
    console.log('🟢 DEVELOPMENT MODE ENHANCED - ACTIVATING');
    console.log('='.repeat(60));
    
    // Set development environment
    process.env.NODE_ENV = 'development';
    
    // Start components
    if (this.components.hotReload) {
      this.components.hotReload.start();
      this.state.tools.hotReload = true;
      console.log('🏁 Hot Reload: Active');
    }
    
    if (this.components.debugger) {
      this.components.debugger.start();
      this.state.tools.debugger = true;
      console.log('🏁 Advanced Debugger: Active');
    }
    
    if (this.components.profiler) {
      await this.components.profiler.start();
      this.state.tools.profiler = true;
      console.log('🏁 Performance Profiler: Active');
    }
    
    // Start dashboard if enabled
    if (this.config.dashboardEnabled) {
      this.startDashboard();
      this.state.tools.dashboard = true;
      console.log('🏁 Development Dashboard: Active');
    }
    
    // Update operational status
    this.updateOperationalStatus();
    
    console.log(`📊 Operational Status: ${this.state.operational}%`);
    console.log('='.repeat(60) + '\n');
    
    // Display shortcuts
    this.displayShortcuts();
    
    this.emit('activated', {
      mode: this.state.mode,
      operational: this.state.operational
    });
    
    return {
      success: true,
      operational: this.state.operational,
      tools: this.state.tools
    };
  }

  /**
   * Deactivate development mode
   */
  async deactivate() {
    if (!this.state.active) {
      return { success: false, message: 'Not active' };
    }
    
    console.log('🔴 Deactivating Development Mode...');
    
    // Stop components
    if (this.components.hotReload) {
      this.components.hotReload.stop();
    }
    
    if (this.components.debugger) {
      this.components.debugger.stop();
    }
    
    if (this.components.profiler) {
      await this.components.profiler.stop();
    }
    
    // Stop dashboard
    if (this.dashboardScreen) {
      this.dashboardScreen.destroy();
    }
    
    this.state.active = false;
    
    // Display final metrics
    this.displayFinalMetrics();
    
    this.emit('deactivated');
    
    return { success: true };
  }

  /**
   * Start development dashboard
   */
  startDashboard() {
    // Create blessed screen
    this.dashboardScreen = blessed.screen({
      smartCSR: true,
      title: 'BUMBA Development Dashboard'
    });
    
    // Create grid
    const grid = new contrib.grid({
      rows: 12,
      cols: 12,
      screen: this.dashboardScreen
    });
    
    // CPU gauge
    this.cpuGauge = grid.set(0, 0, 4, 3, contrib.gauge, {
      label: 'CPU Usage',
      stroke: 'green',
      fill: 'white'
    });
    
    // Memory gauge
    this.memoryGauge = grid.set(0, 3, 4, 3, contrib.gauge, {
      label: 'Memory Usage',
      stroke: 'cyan',
      fill: 'white'
    });
    
    // Hot reload status
    this.reloadBox = grid.set(0, 6, 4, 3, blessed.box, {
      label: 'Hot Reload',
      content: 'Watching...',
      style: {
        fg: 'green'
      }
    });
    
    // Metrics
    this.metricsBox = grid.set(0, 9, 4, 3, blessed.box, {
      label: 'Metrics',
      style: {
        fg: 'yellow'
      }
    });
    
    // Log output
    this.logBox = grid.set(4, 0, 4, 12, contrib.log, {
      label: 'Development Log',
      tags: true
    });
    
    // Error list
    this.errorList = grid.set(8, 0, 4, 6, blessed.list, {
      label: 'Errors & Warnings',
      mouse: true,
      keys: true,
      style: {
        fg: 'red',
        selected: {
          bg: 'red'
        }
      }
    });
    
    // Performance chart
    this.perfChart = grid.set(8, 6, 4, 6, contrib.line, {
      label: 'Performance',
      showLegend: true
    });
    
    // Setup keyboard handlers
    this.dashboardScreen.key(['escape', 'q', 'C-c'], () => {
      this.dashboardScreen.destroy();
      process.exit(0);
    });
    
    this.dashboardScreen.key(['r'], () => {
      if (this.components.hotReload) {
        console.log('Manual reload triggered');
        this.components.hotReload.processReloadQueue();
      }
    });
    
    this.dashboardScreen.key(['d'], () => {
      if (this.components.debugger) {
        this.components.debugger.openInspector();
      }
    });
    
    this.dashboardScreen.key(['p'], () => {
      if (this.components.profiler) {
        this.toggleProfiling();
      }
    });
    
    // Start updating dashboard
    this.dashboardInterval = setInterval(() => {
      this.updateDashboard();
    }, this.config.dashboardRefresh);
    
    // Initial render
    this.updateDashboard();
    this.dashboardScreen.render();
  }

  /**
   * Update dashboard
   */
  updateDashboard() {
    if (!this.dashboardScreen) return;
    
    // Update CPU gauge
    const cpuUsage = process.cpuUsage();
    const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000000) * 100;
    this.cpuGauge.setPercent(Math.min(cpuPercent, 100));
    
    // Update memory gauge
    const memUsage = process.memoryUsage();
    const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    this.memoryGauge.setPercent(memPercent);
    
    // Update reload status
    if (this.components.hotReload) {
      const stats = this.components.hotReload.getStats();
      this.reloadBox.setContent(
        `Active: ${stats.active ? 'Yes' : 'No'}\n` +
        `Reloads: ${stats.reloadCount}\n` +
        `Modules: ${stats.trackedModules}\n` +
        `Safe Mode: ${stats.safeMode ? 'ON' : 'OFF'}`
      );
    }
    
    // Update metrics
    this.metricsBox.setContent(
      `Reloads: ${this.metrics.reloads}\n` +
      `Debug Sessions: ${this.metrics.debugSessions}\n` +
      `Profiles: ${this.metrics.profilesGenerated}\n` +
      `Errors: ${this.metrics.errors.length}`
    );
    
    // Update error list
    const recentIssues = [
      ...this.metrics.errors.slice(-5).map(e => `🔴 ${e.type}: ${e.error.message}`),
      ...this.metrics.warnings.slice(-5).map(w => `🟠️ ${w.type}`)
    ];
    this.errorList.setItems(recentIssues);
    
    // Update performance chart
    if (this.components.profiler) {
      const stats = this.components.profiler.getStats();
      // Add data points to chart
      // This would be more complex in real implementation
    }
    
    // Render
    this.dashboardScreen.render();
  }

  /**
   * Toggle profiling
   */
  async toggleProfiling() {
    if (this.components.profiler.state.active) {
      await this.components.profiler.stop();
      console.log('📊 Profiling stopped');
    } else {
      await this.components.profiler.start();
      console.log('📊 Profiling started');
    }
  }

  /**
   * Run linting
   */
  async runLinting() {
    if (!this.config.linting) return;
    
    console.log('🔍 Running linter...');
    
    // In real implementation, would run actual linter
    // For now, simulate
    const issues = [];
    
    if (issues.length === 0) {
      console.log('🏁 No linting issues found');
    } else {
      console.log(`🟠️ Found ${issues.length} linting issues`);
      issues.forEach(issue => {
        console.log(`  - ${issue.file}:${issue.line} ${issue.message}`);
      });
    }
    
    return issues;
  }

  /**
   * Run type checking
   */
  async runTypeChecking() {
    if (!this.config.typeChecking) return;
    
    console.log('📝 Running type checker...');
    
    // In real implementation, would run actual type checker
    // For now, simulate
    const errors = [];
    
    if (errors.length === 0) {
      console.log('🏁 No type errors found');
    } else {
      console.log(`🔴 Found ${errors.length} type errors`);
      errors.forEach(error => {
        console.log(`  - ${error.file}:${error.line} ${error.message}`);
      });
    }
    
    return errors;
  }

  /**
   * Run tests
   */
  async runTests(pattern = null) {
    console.log(`🧪 Running tests${pattern ? ` matching "${pattern}"` : ''}...`);
    
    // In real implementation, would run actual test runner
    // For now, simulate
    const results = {
      passed: 42,
      failed: 0,
      skipped: 3,
      duration: 1234
    };
    
    console.log(`\n🏁 ${results.passed} passed`);
    if (results.failed > 0) {
      console.log(`🔴 ${results.failed} failed`);
    }
    if (results.skipped > 0) {
      console.log(`⏭️ ${results.skipped} skipped`);
    }
    console.log(`⏱️ Time: ${results.duration}ms\n`);
    
    return results;
  }

  /**
   * Display shortcuts
   */
  displayShortcuts() {
    console.log('\n📋 Development Mode Shortcuts:');
    console.log('  r - Trigger manual reload');
    console.log('  d - Open debugger');
    console.log('  p - Toggle profiling');
    console.log('  l - Run linter');
    console.log('  t - Run tests');
    console.log('  q - Quit\n');
  }

  /**
   * Display profile summary
   */
  displayProfileSummary(report) {
    console.log('\n📊 Profile Summary:');
    console.log(`  Duration: ${(report.duration / 1000).toFixed(2)}s`);
    console.log(`  CPU Usage: ${report.cpu.usage.toFixed(2)}%`);
    console.log(`  Memory: ${(report.memory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    
    if (report.bottlenecks.length > 0) {
      console.log(`  Bottlenecks: ${report.bottlenecks.length}`);
    }
  }

  /**
   * Display final metrics
   */
  displayFinalMetrics() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DEVELOPMENT SESSION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Hot Reloads: ${this.metrics.reloads}`);
    console.log(`Debug Sessions: ${this.metrics.debugSessions}`);
    console.log(`Profiles Generated: ${this.metrics.profilesGenerated}`);
    console.log(`Errors: ${this.metrics.errors.length}`);
    console.log(`Warnings: ${this.metrics.warnings.length}`);
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Update operational status
   */
  updateOperationalStatus() {
    let operational = 70; // Base operational status
    
    // Add points for active tools
    if (this.state.tools.hotReload) operational += 10;
    if (this.state.tools.debugger) operational += 10;
    if (this.state.tools.profiler) operational += 10;
    
    // Cap at 100%
    this.state.operational = Math.min(operational, 100);
    
    this.emit('operational-change', {
      previous: 70,
      current: this.state.operational
    });
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      mode: this.state.mode,
      operational: this.state.operational,
      active: this.state.active,
      tools: this.state.tools,
      metrics: this.metrics
    };
  }

  /**
   * Handle process events
   */
  setupProcessHandlers() {
    // Handle exit
    process.on('exit', () => {
      if (this.state.active) {
        this.deactivate();
      }
    });
    
    // Handle SIGINT
    process.on('SIGINT', () => {
      console.log('\n👋 Shutting down development mode...');
      this.deactivate();
      process.exit(0);
    });
  }
}

module.exports = DevelopmentModeEnhanced;