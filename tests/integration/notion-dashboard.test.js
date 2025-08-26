/**
 * BUMBA Notion Dashboard Integration Test
 * Tests the Notion Project Dashboard functionality
 */

const { NotionProjectDashboard } = require('../../src/core/integrations/notion-project-dashboard');
const ProductStrategistManager = require('../../src/core/departments/product-strategist-manager');
const BumbaCommandHandler = require('../../src/core/command-handler');
const { logger } = require('../../src/core/logging/bumba-logger');

// Color codes for test output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class NotionDashboardTest {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0
    };
  }

  // Test: NotionProjectDashboard class initialization
  async testDashboardInitialization() {
    console.log(`${colors.cyan}Testing NotionProjectDashboard initialization...${colors.reset}`);
    
    try {
      const dashboard = new NotionProjectDashboard({
        autoSync: true,
        syncInterval: 60000
      });
      
      await dashboard.initialize({
        name: 'Test Project',
        team: ['Product-Strategist', 'Design-Engineer', 'Backend-Engineer']
      });
      
      if (dashboard.initialized && dashboard.projectData.name === 'Test Project') {
        console.log(`${colors.green}🏁 Dashboard initialization successful${colors.reset}`);
        return { passed: true };
      } else {
        throw new Error('Dashboard not properly initialized');
      }
      
    } catch (error) {
      console.log(`${colors.red}🔴 Dashboard initialization failed: ${error.message}${colors.reset}`);
      return { passed: false, error: error.message };
    }
  }

  // Test: Dashboard component creation
  async testDashboardComponents() {
    console.log(`${colors.cyan}Testing dashboard component creation...${colors.reset}`);
    
    try {
      const dashboard = new NotionProjectDashboard();
      await dashboard.initialize();
      
      // Test creating individual components
      const components = [
        await dashboard.createProjectOverview('test-parent'),
        await dashboard.createTimeline('test-parent'),
        await dashboard.createKanbanBoard('test-parent'),
        await dashboard.createTaskDatabase('test-parent'),
        await dashboard.createTeamAllocationView('test-parent'),
        await dashboard.createMilestonesTracker('test-parent'),
        await dashboard.createProjectRepository('test-parent'),
        await dashboard.createMetricsDashboard('test-parent')
      ];
      
      const allComponentsCreated = components.every(comp => comp && comp.type);
      
      if (allComponentsCreated) {
        console.log(`${colors.green}🏁 All dashboard components created successfully${colors.reset}`);
        console.log(`  - Created ${components.length} components`);
        return { passed: true, components: components.length };
      } else {
        throw new Error('Some components failed to create');
      }
      
    } catch (error) {
      console.log(`${colors.red}🔴 Component creation failed: ${error.message}${colors.reset}`);
      return { passed: false, error: error.message };
    }
  }

  // Test: Product Strategist integration
  async testProductStrategistIntegration() {
    console.log(`${colors.cyan}Testing Product Strategist dashboard integration...${colors.reset}`);
    
    try {
      const productStrategist = new ProductStrategistManager();
      
      // Test dashboard creation through Product Strategist
      const result = await productStrategist.createNotionDashboard({
        name: 'Strategic Test Project',
        description: 'Testing Product Strategist Notion integration',
        startDate: new Date(),
        team: ['Product-Strategist', 'Design-Engineer', 'Backend-Engineer']
      });
      
      if (result.success) {
        console.log(`${colors.green}🏁 Product Strategist dashboard integration successful${colors.reset}`);
        console.log(`  - Dashboard URL: ${result.url}`);
        console.log(`  - Features: ${result.features.length} features enabled`);
        return { passed: true, url: result.url };
      } else {
        throw new Error(result.error || 'Dashboard creation failed');
      }
      
    } catch (error) {
      console.log(`${colors.red}🔴 Product Strategist integration failed: ${error.message}${colors.reset}`);
      return { passed: false, error: error.message };
    }
  }

  // Test: Command handler integration
  async testCommandHandlerIntegration() {
    console.log(`${colors.cyan}Testing command handler integration...${colors.reset}`);
    
    try {
      const commandHandler = new BumbaCommandHandler();
      
      // Test notion-dashboard command
      const statusResult = await commandHandler.handleNotionDashboard(['status'], {});
      
      if (statusResult && statusResult.configured !== undefined) {
        console.log(`${colors.green}🏁 Command handler integration successful${colors.reset}`);
        console.log(`  - Dashboard configured: ${statusResult.configured}`);
        console.log(`  - Features available: ${statusResult.features?.length || 0}`);
        return { passed: true, configured: statusResult.configured };
      } else {
        throw new Error('Command handler did not return expected result');
      }
      
    } catch (error) {
      console.log(`${colors.red}🔴 Command handler integration failed: ${error.message}${colors.reset}`);
      return { passed: false, error: error.message };
    }
  }

  // Test: Task synchronization
  async testTaskSynchronization() {
    console.log(`${colors.cyan}Testing task synchronization...${colors.reset}`);
    
    try {
      const dashboard = new NotionProjectDashboard();
      await dashboard.initialize();
      
      // Add test tasks
      dashboard.projectData.tasks = [
        {
          id: 'task-1',
          title: 'Implement user authentication',
          status: 'In Progress',
          assignedTo: 'Backend-Engineer',
          priority: 'High'
        },
        {
          id: 'task-2',
          title: 'Design login UI',
          status: 'Backlog',
          assignedTo: 'Design-Engineer',
          priority: 'Medium'
        },
        {
          id: 'task-3',
          title: 'Create product roadmap',
          status: 'Completed',
          assignedTo: 'Product-Strategist',
          priority: 'High'
        }
      ];
      
      // Test task formatting
      const formattedTasks = dashboard.projectData.tasks.map(task => 
        dashboard.convertTaskToNotionFormat(task)
      );
      
      const allTasksFormatted = formattedTasks.every(task => 
        task.properties && task.properties.Task && task.properties.Status
      );
      
      if (allTasksFormatted) {
        console.log(`${colors.green}🏁 Task synchronization successful${colors.reset}`);
        console.log(`  - Formatted ${formattedTasks.length} tasks`);
        console.log(`  - All tasks have required properties`);
        return { passed: true, taskCount: formattedTasks.length };
      } else {
        throw new Error('Task formatting failed');
      }
      
    } catch (error) {
      console.log(`${colors.red}🔴 Task synchronization failed: ${error.message}${colors.reset}`);
      return { passed: false, error: error.message };
    }
  }

  // Test: Metrics calculation
  async testMetricsCalculation() {
    console.log(`${colors.cyan}Testing metrics calculation...${colors.reset}`);
    
    try {
      const dashboard = new NotionProjectDashboard();
      await dashboard.initialize();
      
      // Set up test data
      dashboard.projectData.tasks = [
        { status: 'Completed' },
        { status: 'Completed' },
        { status: 'In Progress' },
        { status: 'Backlog' },
        { status: 'Done' }
      ];
      
      const progress = dashboard.calculateOverallProgress();
      const burndown = dashboard.generateBurndownData();
      const distribution = dashboard.generateTaskDistribution();
      const velocity = dashboard.generateVelocityData();
      
      const metricsValid = 
        progress >= 0 && progress <= 100 &&
        burndown.ideal && burndown.actual &&
        Array.isArray(distribution) &&
        Array.isArray(velocity);
      
      if (metricsValid) {
        console.log(`${colors.green}🏁 Metrics calculation successful${colors.reset}`);
        console.log(`  - Overall progress: ${progress}%`);
        console.log(`  - Burndown data points: ${burndown.ideal.length}`);
        console.log(`  - Task distribution categories: ${distribution.length}`);
        console.log(`  - Velocity data points: ${velocity.length}`);
        return { passed: true, progress };
      } else {
        throw new Error('Metrics calculation invalid');
      }
      
    } catch (error) {
      console.log(`${colors.red}🔴 Metrics calculation failed: ${error.message}${colors.reset}`);
      return { passed: false, error: error.message };
    }
  }

  // Test: Auto-sync functionality
  async testAutoSync() {
    console.log(`${colors.cyan}Testing auto-sync functionality...${colors.reset}`);
    
    try {
      const dashboard = new NotionProjectDashboard({
        autoUpdate: true,
        syncInterval: 1000 // 1 second for testing
      });
      
      await dashboard.initialize();
      
      // Start auto-sync
      dashboard.startAutoSync();
      
      // Verify sync timer is set
      const syncTimerSet = dashboard.syncTimer !== null;
      
      // Stop auto-sync
      dashboard.stopAutoSync();
      
      // Verify sync timer is cleared
      const syncTimerCleared = dashboard.syncTimer === null;
      
      if (syncTimerSet && syncTimerCleared) {
        console.log(`${colors.green}🏁 Auto-sync functionality working${colors.reset}`);
        console.log(`  - Sync timer started successfully`);
        console.log(`  - Sync timer stopped successfully`);
        return { passed: true };
      } else {
        throw new Error('Auto-sync timer management failed');
      }
      
    } catch (error) {
      console.log(`${colors.red}🔴 Auto-sync test failed: ${error.message}${colors.reset}`);
      return { passed: false, error: error.message };
    }
  }

  // Run all tests
  async runAllTests() {
    console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.blue}BUMBA Notion Dashboard Integration Tests${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
    
    const tests = [
      { name: 'Dashboard Initialization', fn: () => this.testDashboardInitialization() },
      { name: 'Dashboard Components', fn: () => this.testDashboardComponents() },
      { name: 'Product Strategist Integration', fn: () => this.testProductStrategistIntegration() },
      { name: 'Command Handler Integration', fn: () => this.testCommandHandlerIntegration() },
      { name: 'Task Synchronization', fn: () => this.testTaskSynchronization() },
      { name: 'Metrics Calculation', fn: () => this.testMetricsCalculation() },
      { name: 'Auto-sync Functionality', fn: () => this.testAutoSync() }
    ];
    
    for (const test of tests) {
      console.log(`\n🟢 ${test.name}`);
      console.log('-'.repeat(40));
      
      try {
        const result = await test.fn();
        
        if (result.passed) {
          this.results.passed++;
        } else {
          this.results.failed++;
        }
        
        this.tests.push({
          name: test.name,
          ...result
        });
        
      } catch (error) {
        console.log(`${colors.red}🔴 Test crashed: ${error.message}${colors.reset}`);
        this.results.failed++;
        this.tests.push({
          name: test.name,
          passed: false,
          error: error.message
        });
      }
    }
    
    // Print summary
    this.printSummary();
  }

  printSummary() {
    console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.blue}Test Summary${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
    
    const total = this.results.passed + this.results.failed + this.results.skipped;
    const passRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
    
    console.log(`${colors.green}🏁 Passed: ${this.results.passed}${colors.reset}`);
    console.log(`${colors.red}🔴 Failed: ${this.results.failed}${colors.reset}`);
    if (this.results.skipped > 0) {
      console.log(`${colors.yellow}🟡 Skipped: ${this.results.skipped}${colors.reset}`);
    }
    console.log(`🟢 Pass Rate: ${passRate}%`);
    
    if (this.results.failed > 0) {
      console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
      this.tests.filter(t => !t.passed).forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
      });
    }
    
    console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
    
    if (this.results.failed === 0) {
      console.log(`${colors.green}🏁 All tests passed! Notion Dashboard integration is working correctly.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}🟡 Some tests failed. Review the errors above.${colors.reset}`);
    }
    
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
  }
}

// Run tests if executed directly
if (require.main === module) {
  const tester = new NotionDashboardTest();
  tester.runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = NotionDashboardTest;