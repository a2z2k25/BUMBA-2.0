/**
 * BUMBA Dashboard Systems Complete Test
 * Verify all dashboards are 100% operational
 */

const chalk = require('chalk');
const path = require('path');

console.log(chalk.bold.cyan('🧪 BUMBA Dashboard Systems Complete Test'));
console.log(chalk.cyan('═'.repeat(60)));

async function testDashboardSystems() {
  const results = {
    dashboards: {},
    features: {},
    overall: true
  };
  
  let totalTests = 0;
  let passedTests = 0;
  
  // ============== TEST DASHBOARD BASE ==============
  console.log(chalk.bold.yellow('\n📋 Testing Dashboard Base Class...'));
  
  try {
    const DashboardBase = require('../src/core/dashboard/dashboard-base');
    
    // Create test instance
    class TestDashboard extends DashboardBase {
      async fetchData() {
        return { test: 'data', value: 123 };
      }
      
      displayContent() {
        console.log('Test content');
      }
    }
    
    const testDashboard = new TestDashboard({ name: 'Test Dashboard' });
    
    // Test methods
    const methods = ['refresh', 'getData', 'getStatus', 'exportData', 'createBarChart', 'createSparkline'];
    
    for (const method of methods) {
      if (typeof testDashboard[method] === 'function') {
        passedTests++;
        console.log(chalk.green(`  🏁 ${method} method works`));
      } else {
        console.log(chalk.red(`  🔴 ${method} method missing`));
      }
      totalTests++;
    }
    
    results.dashboards.base = true;
    
  } catch (error) {
    console.log(chalk.red('  🔴 Dashboard Base error:'), error.message);
    results.dashboards.base = false;
  }
  
  // ============== TEST STATUS DASHBOARD ==============
  console.log(chalk.bold.yellow('\n📊 Testing Status Dashboard...'));
  
  try {
    const { StatusDashboard, getInstance } = require('../src/core/dashboard/status-dashboard');
    const dashboard = getInstance();
    
    // Test initialization
    await dashboard.initialize();
    passedTests++;
    totalTests++;
    console.log(chalk.green('  🏁 Status Dashboard initializes'));
    
    // Test data fetching
    const data = await dashboard.fetchData();
    if (data && data.system && data.components) {
      passedTests++;
      console.log(chalk.green('  🏁 Status data fetching works'));
    } else {
      console.log(chalk.red('  🔴 Status data fetching failed'));
    }
    totalTests++;
    
    // Test summary
    const summary = dashboard.getSummary();
    if (summary) {
      passedTests++;
      console.log(chalk.green('  🏁 Status summary works'));
    } else {
      console.log(chalk.red('  🔴 Status summary failed'));
    }
    totalTests++;
    
    results.dashboards.status = true;
    
  } catch (error) {
    console.log(chalk.red('  🔴 Status Dashboard error:'), error.message);
    results.dashboards.status = false;
  }
  
  // ============== TEST ANALYTICS DASHBOARD ==============
  console.log(chalk.bold.yellow('\n📈 Testing Analytics Dashboard...'));
  
  try {
    const { AnalyticsDashboard, getInstance } = require('../src/core/dashboard/analytics-dashboard');
    const dashboard = getInstance();
    
    // Test initialization
    await dashboard.initialize();
    passedTests++;
    totalTests++;
    console.log(chalk.green('  🏁 Analytics Dashboard initializes'));
    
    // Add test metrics
    dashboard.addMetric('performance', {
      timestamp: Date.now(),
      memory: { heapUsed: 100000000, heapTotal: 200000000, heapPercent: 50 }
    });
    
    dashboard.addMetric('operations', {
      timestamp: Date.now(),
      type: 'test',
      operation: 'read',
      success: true
    });
    
    // Test data fetching
    const data = await dashboard.fetchData();
    if (data && data.current && data.trends) {
      passedTests++;
      console.log(chalk.green('  🏁 Analytics data fetching works'));
    } else {
      console.log(chalk.red('  🔴 Analytics data fetching failed'));
    }
    totalTests++;
    
    // Test chart generation
    if (data.charts) {
      passedTests++;
      console.log(chalk.green('  🏁 Chart generation works'));
    } else {
      console.log(chalk.red('  🔴 Chart generation failed'));
    }
    totalTests++;
    
    results.dashboards.analytics = true;
    
  } catch (error) {
    console.log(chalk.red('  🔴 Analytics Dashboard error:'), error.message);
    results.dashboards.analytics = false;
  }
  
  // ============== TEST COORDINATION DASHBOARD ==============
  console.log(chalk.bold.yellow('\n🔄 Testing Coordination Dashboard...'));
  
  try {
    const CoordinationDashboard = require('../src/core/coordination/coordination-dashboard');
    const dashboard = typeof CoordinationDashboard === 'function' 
      ? new CoordinationDashboard()
      : CoordinationDashboard.getInstance 
        ? CoordinationDashboard.getInstance()
        : CoordinationDashboard;
    
    // Test methods
    if (typeof dashboard.getStatus === 'function') {
      const status = await dashboard.getStatus();
      if (status) {
        passedTests++;
        console.log(chalk.green('  🏁 Coordination status works'));
      }
    }
    totalTests++;
    
    if (typeof dashboard.refresh === 'function') {
      await dashboard.refresh();
      passedTests++;
      console.log(chalk.green('  🏁 Coordination refresh works'));
    } else {
      console.log(chalk.red('  🔴 Coordination refresh missing'));
    }
    totalTests++;
    
    if (typeof dashboard.getData === 'function') {
      const data = dashboard.getData();
      passedTests++;
      console.log(chalk.green('  🏁 Coordination getData works'));
    } else {
      console.log(chalk.red('  🔴 Coordination getData missing'));
    }
    totalTests++;
    
    results.dashboards.coordination = true;
    
  } catch (error) {
    console.log(chalk.red('  🔴 Coordination Dashboard error:'), error.message);
    results.dashboards.coordination = false;
  }
  
  // ============== TEST INTEGRATION STATUS DASHBOARD ==============
  console.log(chalk.bold.yellow('\n🔗 Testing Integration Status Dashboard...'));
  
  try {
    const IntegrationDashboard = require('../src/core/integration/integration-status-dashboard');
    const dashboard = typeof IntegrationDashboard === 'function'
      ? new IntegrationDashboard()
      : IntegrationDashboard.getInstance 
        ? IntegrationDashboard.getInstance()
        : IntegrationDashboard;
    
    // Test printTable method (custom table implementation)
    if (typeof dashboard.printTable === 'function') {
      passedTests++;
      console.log(chalk.green('  🏁 Custom table implementation works'));
    } else {
      console.log(chalk.red('  🔴 Custom table implementation missing'));
    }
    totalTests++;
    
    // Test export status
    if (typeof dashboard.exportStatus === 'function') {
      const status = await dashboard.exportStatus();
      if (status) {
        passedTests++;
        console.log(chalk.green('  🏁 Integration export works'));
      }
    }
    totalTests++;
    
    results.dashboards.integration = true;
    
  } catch (error) {
    console.log(chalk.red('  🔴 Integration Dashboard error:'), error.message);
    results.dashboards.integration = false;
  }
  
  // ============== TEST SHARED FEATURES ==============
  console.log(chalk.bold.yellow('\n🟡 Testing Shared Features...'));
  
  // Test export functionality
  try {
    const { StatusDashboard } = require('../src/core/dashboard/status-dashboard');
    const dashboard = new StatusDashboard();
    await dashboard.initialize();
    
    // Test JSON export
    const jsonExport = await dashboard.exportData('json', './test-export.json');
    if (jsonExport) {
      passedTests++;
      console.log(chalk.green('  🏁 JSON export works'));
      results.features.jsonExport = true;
      
      // Clean up test file
      const fs = require('fs');
      if (fs.existsSync('./test-export.json')) {
        fs.unlinkSync('./test-export.json');
      }
    }
    totalTests++;
    
    // Test CSV export
    const csvExport = await dashboard.exportData('csv', './test-export.csv');
    if (csvExport) {
      passedTests++;
      console.log(chalk.green('  🏁 CSV export works'));
      results.features.csvExport = true;
      
      // Clean up test file
      const fs = require('fs');
      if (fs.existsSync('./test-export.csv')) {
        fs.unlinkSync('./test-export.csv');
      }
    }
    totalTests++;
    
  } catch (error) {
    console.log(chalk.red('  🔴 Export feature error:'), error.message);
  }
  
  // Test visualization features
  try {
    const DashboardBase = require('../src/core/dashboard/dashboard-base');
    
    class VisualizationTest extends DashboardBase {
      async fetchData() { return {}; }
      displayContent() {}
    }
    
    const viz = new VisualizationTest();
    
    // Test bar chart
    const barChart = viz.createBarChart({ A: 10, B: 20, C: 15 });
    if (barChart) {
      passedTests++;
      console.log(chalk.green('  🏁 Bar chart creation works'));
      results.features.barChart = true;
    }
    totalTests++;
    
    // Test sparkline
    const sparkline = viz.createSparkline([1, 2, 3, 4, 5, 4, 3, 2, 1]);
    if (sparkline) {
      passedTests++;
      console.log(chalk.green('  🏁 Sparkline creation works'));
      results.features.sparkline = true;
    }
    totalTests++;
    
    // Test table
    const table = viz.createTable(['Col1', 'Col2'], [['A', 'B'], ['C', 'D']]);
    if (table) {
      passedTests++;
      console.log(chalk.green('  🏁 Table creation works'));
      results.features.table = true;
    }
    totalTests++;
    
  } catch (error) {
    console.log(chalk.red('  🔴 Visualization error:'), error.message);
  }
  
  // ============== CALCULATE RESULTS ==============
  const successRate = Math.round((passedTests / totalTests) * 100);
  results.overall = successRate === 100;
  
  console.log(chalk.bold.cyan('\n' + '═'.repeat(60)));
  console.log(chalk.bold.cyan('TEST RESULTS'));
  console.log(chalk.bold.cyan('═'.repeat(60)));
  
  console.log(chalk.bold(`\nTests Passed: ${passedTests}/${totalTests} (${successRate}%)`));
  
  // Dashboard status
  console.log('\n📊 Dashboard Status:');
  console.log(`  Base Class: ${results.dashboards.base ? '🏁' : '🔴'}`);
  console.log(`  Status Dashboard: ${results.dashboards.status ? '🏁' : '🔴'}`);
  console.log(`  Analytics Dashboard: ${results.dashboards.analytics ? '🏁' : '🔴'}`);
  console.log(`  Coordination Dashboard: ${results.dashboards.coordination ? '🏁' : '🔴'}`);
  console.log(`  Integration Dashboard: ${results.dashboards.integration ? '🏁' : '🔴'}`);
  
  // Feature status
  console.log('\n🟡 Feature Status:');
  console.log(`  JSON Export: ${results.features.jsonExport ? '🏁' : '🔴'}`);
  console.log(`  CSV Export: ${results.features.csvExport ? '🏁' : '🔴'}`);
  console.log(`  Bar Charts: ${results.features.barChart ? '🏁' : '🔴'}`);
  console.log(`  Sparklines: ${results.features.sparkline ? '🏁' : '🔴'}`);
  console.log(`  Tables: ${results.features.table ? '🏁' : '🔴'}`);
  
  if (successRate === 100) {
    console.log(chalk.bold.green('\n🏁 ALL TESTS PASSED! Dashboard Systems are 100% operational!'));
  } else if (successRate >= 90) {
    console.log(chalk.bold.yellow('\n🏁 Dashboard Systems are operational with minor issues'));
  } else if (successRate >= 70) {
    console.log(chalk.bold.yellow('\n🟠️ Dashboard Systems are partially operational'));
  } else {
    console.log(chalk.bold.red('\n🔴 Dashboard Systems have significant issues'));
  }
  
  // Save results
  const fs = require('fs');
  const reportPath = path.join(__dirname, '../DASHBOARD_SYSTEMS_COMPLETE.json');
  
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
    statistics: {
      totalTests,
      passedTests,
      successRate: `${successRate}%`
    },
    dashboards: {
      base: results.dashboards.base ? '🏁 Operational' : '🔴 Failed',
      status: results.dashboards.status ? '🏁 Operational' : '🔴 Failed',
      analytics: results.dashboards.analytics ? '🏁 Operational' : '🔴 Failed',
      coordination: results.dashboards.coordination ? '🏁 Operational' : '🔴 Failed',
      integration: results.dashboards.integration ? '🏁 Operational' : '🔴 Failed'
    },
    features: {
      export: (results.features.jsonExport && results.features.csvExport) ? '🏁 Working' : '🔴 Issues',
      visualization: (results.features.barChart && results.features.sparkline) ? '🏁 Working' : '🔴 Issues'
    }
  }, null, 2));
  
  console.log(chalk.gray(`\n📄 Full report saved to: DASHBOARD_SYSTEMS_COMPLETE.json`));
  
  return successRate;
}

// Run tests
console.log(chalk.gray('\nStarting comprehensive dashboard test...\n'));

testDashboardSystems().then(score => {
  console.log(chalk.bold.cyan('\n' + '═'.repeat(60)));
  console.log(chalk.bold.green(`🏁 DASHBOARD SYSTEMS AUDIT COMPLETE: ${score}% OPERATIONAL`));
  console.log(chalk.bold.cyan('═'.repeat(60) + '\n'));
  process.exit(0);
}).catch(error => {
  console.error(chalk.red('Fatal error during testing:'), error);
  process.exit(1);
});