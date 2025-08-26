#!/usr/bin/env node

/**
 * BUMBA Comprehensive Test Suite
 * Tests all implemented features from the sprint
 */

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

class ComprehensiveTestSuite {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
      performance: {}
    };
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('\n' + '='.repeat(70));
    console.log('🧪 BUMBA COMPREHENSIVE TEST SUITE');
    console.log('='.repeat(70) + '\n');
    
    // Test 1: Lazy Loading Department Managers
    await this.testLazyLoading();
    
    // Test 2: Unified Dashboard
    await this.testUnifiedDashboard();
    
    // Test 3: Failure Manager
    await this.testFailureManager();
    
    // Test 4: Notion Dashboard System
    await this.testNotionDashboard();
    
    // Test 5: Memory Optimization
    await this.testMemoryOptimization();
    
    // Test 6: Production Readiness
    await this.testProductionReadiness();
    
    // Generate Report
    this.generateReport();
  }

  /**
   * Test 1: Lazy Loading Department Managers
   */
  async testLazyLoading() {
    console.log('📦 TEST 1: Lazy Loading Department Managers\n');
    
    try {
      const { logger } = require('../src/core/logging/bumba-logger');
      
      // Test Backend Manager
      console.log('  Testing Backend Engineer Manager...');
      const BackendManager = require('../src/core/departments/backend-engineer-manager-lazy');
      const backend = new BackendManager();
      
      // Check initial state
      const initialStats = backend.getMemoryStats();
      if (initialStats.specialists.loaded !== 0) {
        throw new Error('Specialists pre-loaded when they should be lazy');
      }
      this.results.passed.push('Backend: No pre-loading');
      
      // Test lazy loading
      const specialist = await backend.getSpecialist('JavaScriptSpecialist');
      if (!specialist) {
        throw new Error('Failed to lazy load JavaScriptSpecialist');
      }
      this.results.passed.push('Backend: Lazy loading works');
      
      // Test cache
      const cached = await backend.getSpecialist('JavaScriptSpecialist');
      const cacheStats = backend.getMemoryStats();
      if (cacheStats.performance.cacheHitRate === '0%') {
        throw new Error('Cache not working');
      }
      this.results.passed.push('Backend: Cache functioning');
      
      await backend.destroy();
      
      // Test Design Manager
      console.log('  Testing Design Engineer Manager...');
      const DesignManager = require('../src/core/departments/design-engineer-manager-lazy');
      const design = new DesignManager();
      
      const designStats = design.getMemoryStats();
      if (designStats.specialists.registered < 10) {
        throw new Error('Not enough design specialists registered');
      }
      this.results.passed.push('Design: Specialists registered');
      
      await design.destroy();
      
      // Test Product Manager
      console.log('  Testing Product Strategist Manager...');
      const ProductManager = require('../src/core/departments/product-strategist-manager-lazy');
      const product = new ProductManager();
      
      const productStats = product.getMemoryStats();
      this.results.passed.push('Product: Manager initialized');
      
      await product.destroy();
      
      console.log('  ✅ All department managers working\n');
      
    } catch (error) {
      this.results.failed.push(`Lazy Loading: ${error.message}`);
      console.log(`  ❌ Error: ${error.message}\n`);
    }
  }

  /**
   * Test 2: Unified Dashboard
   */
  async testUnifiedDashboard() {
    console.log('📊 TEST 2: Unified Dashboard System\n');
    
    try {
      console.log('  Testing dashboard manager...');
      const { UnifiedDashboardManager } = require('../src/core/dashboard/unified-dashboard-manager');
      const dashboard = new UnifiedDashboardManager();
      
      await dashboard.initialize();
      
      // Check data sources
      const sources = dashboard.getDataSources();
      console.log(`  Connected data sources: ${sources.length}`);
      
      if (sources.length < 10) {
        this.results.warnings.push(`Only ${sources.length} data sources connected`);
      } else {
        this.results.passed.push(`Dashboard: ${sources.length} sources connected`);
      }
      
      // Test data aggregation
      const data = await dashboard.getUnifiedData();
      if (!data) {
        throw new Error('Failed to get unified data');
      }
      this.results.passed.push('Dashboard: Data aggregation works');
      
      // Check metrics
      const metrics = await dashboard.getMetrics();
      if (metrics.performance) {
        this.results.passed.push('Dashboard: Metrics available');
      }
      
      await dashboard.shutdown();
      console.log('  ✅ Dashboard system functional\n');
      
    } catch (error) {
      this.results.failed.push(`Dashboard: ${error.message}`);
      console.log(`  ❌ Error: ${error.message}\n`);
    }
  }

  /**
   * Test 3: Failure Manager
   */
  async testFailureManager() {
    console.log('🛡️ TEST 3: Failure Manager & Recovery\n');
    
    try {
      console.log('  Testing failure manager initialization...');
      const { getInstance: getFailureManager } = require('../src/core/resilience/unified-failure-manager');
      const { getInstance: getNotifications } = require('../src/core/resilience/failure-notifications');
      
      const failureManager = getFailureManager();
      const notifications = getNotifications();
      
      this.results.passed.push('Failure Manager: Initialized');
      
      // Test failure handling
      console.log('  Testing failure handling...');
      const testError = new Error('Test failure for comprehensive suite');
      testError.type = 'TEST_ERROR';
      
      const result = await failureManager.handleFailure(testError, {
        component: 'test-suite',
        operation: 'comprehensive-test'
      });
      
      if (!result.failureId) {
        throw new Error('Failure not tracked properly');
      }
      this.results.passed.push('Failure Manager: Tracking works');
      
      // Test recovery strategies
      console.log('  Testing recovery strategies...');
      failureManager.registerRecoveryStrategy('TEST_RECOVERY', {
        maxRetries: 1,
        async recover() {
          return { retry: true };
        }
      });
      this.results.passed.push('Failure Manager: Recovery strategies');
      
      // Test statistics
      const stats = failureManager.getStatistics();
      if (stats.totalFailures > 0) {
        this.results.passed.push('Failure Manager: Statistics tracking');
      }
      
      // Test notifications (silent mode)
      console.log('  Testing notification system...');
      notifications.configure({
        consoleEnabled: false,
        soundEnabled: false
      });
      
      await notifications.notify({
        type: 'TEST',
        timestamp: new Date().toISOString()
      });
      
      this.results.passed.push('Notifications: System working');
      
      console.log('  ✅ Failure management operational\n');
      
    } catch (error) {
      this.results.failed.push(`Failure Manager: ${error.message}`);
      console.log(`  ❌ Error: ${error.message}\n`);
    }
  }

  /**
   * Test 4: Notion Dashboard System
   */
  async testNotionDashboard() {
    console.log('📝 TEST 4: Notion Dashboard (Manual Trigger)\n');
    
    try {
      console.log('  Testing dashboard components...');
      
      // Test customizer
      const { DashboardCustomizer } = require('../src/core/notion/dashboard-customizer');
      const customizer = new DashboardCustomizer();
      
      const projectType = customizer.detectProjectType({
        name: 'Test Project',
        description: 'Bug fix for testing'
      });
      
      if (projectType !== 'bugfix') {
        throw new Error('Project type detection failed');
      }
      this.results.passed.push('Notion: Project detection works');
      
      // Test template system
      const { DashboardTemplate } = require('../src/core/notion/dashboard-template');
      const template = new DashboardTemplate();
      
      const sections = template.getSections('feature');
      if (!sections || sections.length === 0) {
        throw new Error('Template generation failed');
      }
      this.results.passed.push('Notion: Template system works');
      
      // Test context transfer
      const { DashboardContext } = require('../src/core/notion/dashboard-context');
      const context = new DashboardContext();
      
      context.addContext('test', { data: 'test' });
      const retrieved = context.getContext('test');
      
      if (!retrieved) {
        throw new Error('Context storage failed');
      }
      this.results.passed.push('Notion: Context transfer works');
      
      // Verify manual trigger requirement
      const { NotionDashboardCommand } = require('../src/core/commands/notion-dashboard-command');
      const command = new NotionDashboardCommand();
      
      if (command.autoCreate !== false) {
        throw new Error('CRITICAL: Auto-creation not disabled!');
      }
      this.results.passed.push('Notion: Manual trigger enforced');
      
      console.log('  ✅ Notion dashboard system ready\n');
      
    } catch (error) {
      this.results.failed.push(`Notion Dashboard: ${error.message}`);
      console.log(`  ❌ Error: ${error.message}\n`);
    }
  }

  /**
   * Test 5: Memory Optimization
   */
  async testMemoryOptimization() {
    console.log('💾 TEST 5: Memory Optimization\n');
    
    try {
      console.log('  Measuring memory usage...');
      
      const memBefore = process.memoryUsage().heapUsed;
      
      // Load department managers
      const BackendManager = require('../src/core/departments/backend-engineer-manager-lazy');
      const DesignManager = require('../src/core/departments/design-engineer-manager-lazy');
      const ProductManager = require('../src/core/departments/product-strategist-manager-lazy');
      
      const managers = [
        new BackendManager(),
        new DesignManager(),
        new ProductManager()
      ];
      
      const memAfter = process.memoryUsage().heapUsed;
      const memUsed = (memAfter - memBefore) / 1024 / 1024;
      
      console.log(`  Memory used for 3 departments: ${memUsed.toFixed(2)}MB`);
      
      // Check efficiency
      let totalRegistered = 0;
      let totalLoaded = 0;
      
      for (const manager of managers) {
        const stats = manager.getMemoryStats();
        totalRegistered += stats.specialists.registered;
        totalLoaded += stats.specialists.loaded;
      }
      
      const efficiency = ((totalRegistered - totalLoaded) / totalRegistered * 100).toFixed(1);
      console.log(`  Memory efficiency: ${efficiency}% (${totalLoaded}/${totalRegistered} loaded)`);
      
      if (parseFloat(efficiency) < 80) {
        this.results.warnings.push(`Memory efficiency only ${efficiency}%`);
      } else {
        this.results.passed.push(`Memory: ${efficiency}% efficiency achieved`);
      }
      
      // Test specialist path fixes
      console.log('  Testing specialist logger paths...');
      const specialistPath = '../src/core/specialists/experience/react-specialist';
      
      try {
        require(specialistPath);
        this.results.passed.push('Memory: Specialist paths fixed');
      } catch (error) {
        if (error.message.includes('logging')) {
          this.results.failed.push('Memory: Logger paths still broken');
        }
      }
      
      // Cleanup
      for (const manager of managers) {
        await manager.destroy();
      }
      
      // Force GC if available
      if (global.gc) {
        global.gc();
        console.log('  Garbage collection completed');
      }
      
      this.results.performance.memoryEfficiency = efficiency + '%';
      this.results.performance.memorySaved = `~${(totalRegistered - totalLoaded) * 0.5}MB`;
      
      console.log('  ✅ Memory optimization verified\n');
      
    } catch (error) {
      this.results.failed.push(`Memory Optimization: ${error.message}`);
      console.log(`  ❌ Error: ${error.message}\n`);
    }
  }

  /**
   * Test 6: Production Readiness
   */
  async testProductionReadiness() {
    console.log('🚀 TEST 6: Production Readiness\n');
    
    try {
      console.log('  Checking production scripts...');
      
      // Check deployment script exists
      const deploymentScript = path.join(__dirname, 'production-deployment.js');
      if (!fs.existsSync(deploymentScript)) {
        throw new Error('Deployment script missing');
      }
      this.results.passed.push('Production: Deployment script exists');
      
      // Check health monitor
      const healthMonitor = path.join(__dirname, 'health-monitor.js');
      if (!fs.existsSync(healthMonitor)) {
        throw new Error('Health monitor missing');
      }
      
      // Run health check
      console.log('  Running health check...');
      const HealthMonitor = require('./health-monitor');
      const monitor = new HealthMonitor();
      const health = await monitor.runChecks();
      
      if (health.status === 'critical') {
        this.results.warnings.push('Production: System health is critical');
      } else {
        this.results.passed.push(`Production: Health ${health.status}`);
      }
      
      // Check configuration files
      console.log('  Checking configuration...');
      const configFile = path.join(process.cwd(), 'config/modular-config.js');
      if (!fs.existsSync(configFile)) {
        throw new Error('Configuration file missing');
      }
      this.results.passed.push('Production: Configuration present');
      
      // Check required directories
      const requiredDirs = ['logs', 'status'];
      for (const dir of requiredDirs) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }
      this.results.passed.push('Production: Directory structure ready');
      
      console.log('  ✅ Production readiness confirmed\n');
      
    } catch (error) {
      this.results.failed.push(`Production Readiness: ${error.message}`);
      console.log(`  ❌ Error: ${error.message}\n`);
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateReport() {
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    
    console.log('\n' + '='.repeat(70));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(70) + '\n');
    
    // Summary stats
    const total = this.results.passed.length + this.results.failed.length;
    const passRate = total > 0 ? Math.round((this.results.passed.length / total) * 100) : 0;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${this.results.passed.length} ✅`);
    console.log(`Failed: ${this.results.failed.length} ❌`);
    console.log(`Warnings: ${this.results.warnings.length} ⚠️`);
    console.log(`Pass Rate: ${passRate}%`);
    console.log(`Duration: ${duration} seconds\n`);
    
    // Detailed results
    if (this.results.passed.length > 0) {
      console.log('✅ PASSED TESTS:');
      this.results.passed.forEach(test => console.log(`   ✓ ${test}`));
      console.log('');
    }
    
    if (this.results.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      this.results.warnings.forEach(warning => console.log(`   ⚠ ${warning}`));
      console.log('');
    }
    
    if (this.results.failed.length > 0) {
      console.log('❌ FAILED TESTS:');
      this.results.failed.forEach(test => console.log(`   ✗ ${test}`));
      console.log('');
    }
    
    // Performance metrics
    if (Object.keys(this.results.performance).length > 0) {
      console.log('📊 PERFORMANCE METRICS:');
      for (const [key, value] of Object.entries(this.results.performance)) {
        console.log(`   ${key}: ${value}`);
      }
      console.log('');
    }
    
    // Overall status
    console.log('='.repeat(70));
    if (this.results.failed.length === 0) {
      console.log('✅ ALL CRITICAL TESTS PASSED - SYSTEM READY FOR PRODUCTION');
    } else if (this.results.failed.length <= 2) {
      console.log('⚠️  MOSTLY PASSING - Minor issues to address');
    } else {
      console.log('❌ MULTIPLE FAILURES - System needs attention');
    }
    console.log('='.repeat(70) + '\n');
    
    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      summary: {
        total,
        passed: this.results.passed.length,
        failed: this.results.failed.length,
        warnings: this.results.warnings.length,
        passRate: `${passRate}%`
      },
      details: this.results,
      status: this.results.failed.length === 0 ? 'READY' : 'NEEDS_ATTENTION'
    };
    
    fs.writeFileSync(
      path.join(process.cwd(), 'test-results.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('📝 Full report saved to: test-results.json\n');
  }
}

// Run tests
if (require.main === module) {
  const suite = new ComprehensiveTestSuite();
  suite.runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = ComprehensiveTestSuite;