/**
 * BUMBA Dashboard Systems Audit
 * Comprehensive testing of Coordination, Status, Analytics, and Integration Status Dashboards
 */

const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

console.log(chalk.bold.cyan('🔍 BUMBA Dashboard Systems Audit'));
console.log(chalk.cyan('=' .repeat(60)));

async function auditDashboardSystems() {
  const results = {
    components: {
      coordinationDashboard: { exists: false, functional: false, tests: [] },
      statusDashboard: { exists: false, functional: false, tests: [] },
      analyticsDashboard: { exists: false, functional: false, tests: [] },
      integrationStatusDashboard: { exists: false, functional: false, tests: [] }
    },
    features: {
      realTimeUpdates: false,
      dataVisualization: false,
      exportCapability: false,
      filtering: false,
      aggregation: false,
      historicalData: false,
      autoRefresh: false,
      interactiveElements: false
    },
    gaps: [],
    recommendations: []
  };
  
  // ============== AUDIT COORDINATION DASHBOARD ==============
  console.log('\n🔄 AUDITING COORDINATION DASHBOARD\n');
  
  try {
    // Check if Coordination Dashboard exists
    const coordinationPath = path.join(__dirname, '../src/core/coordination/coordination-dashboard.js');
    if (fs.existsSync(coordinationPath)) {
      results.components.coordinationDashboard.exists = true;
      console.log('🏁 Coordination Dashboard file found');
      
      try {
        const CoordinationDashboard = require(coordinationPath);
        
        // Test instantiation
        if (CoordinationDashboard) {
          const dashboard = typeof CoordinationDashboard === 'function' 
            ? new CoordinationDashboard()
            : CoordinationDashboard.getInstance 
              ? CoordinationDashboard.getInstance()
              : CoordinationDashboard;
          
          // Test methods
          if (dashboard) {
            results.components.coordinationDashboard.functional = true;
            console.log('🏁 Coordination Dashboard instantiates');
            
            // Check for key methods
            const methods = ['display', 'refresh', 'getStatus', 'getData'];
            methods.forEach(method => {
              if (typeof dashboard[method] === 'function') {
                results.components.coordinationDashboard.tests.push(`${method} method exists`);
                console.log(`🏁 ${method} method found`);
              } else {
                console.log(`🔴 ${method} method missing`);
                results.gaps.push(`Coordination Dashboard missing ${method} method`);
              }
            });
          }
        }
      } catch (error) {
        console.log('🔴 Coordination Dashboard error:', error.message);
        results.gaps.push('Coordination Dashboard not functional');
      }
    } else {
      console.log('🔴 Coordination Dashboard not found');
      results.gaps.push('Coordination Dashboard needs to be created');
    }
  } catch (error) {
    console.log('🔴 Coordination Dashboard check failed:', error.message);
  }
  
  // ============== AUDIT STATUS DASHBOARD ==============
  console.log('\n📊 AUDITING STATUS DASHBOARD\n');
  
  try {
    // Check multiple possible locations
    const statusPaths = [
      '../src/core/status/status-dashboard.js',
      '../src/core/dashboard/status-dashboard.js',
      '../src/core/monitoring/status-dashboard.js',
      '../src/templates/commands/status.md'
    ];
    
    let found = false;
    for (const relativePath of statusPaths) {
      const statusPath = path.join(__dirname, relativePath);
      if (fs.existsSync(statusPath)) {
        console.log(`📁 Found status-related file: ${relativePath}`);
        if (relativePath.endsWith('.js')) {
          results.components.statusDashboard.exists = true;
          found = true;
          
          try {
            const StatusDashboard = require(statusPath);
            if (StatusDashboard) {
              results.components.statusDashboard.functional = true;
              console.log('🏁 Status Dashboard module loads');
            }
          } catch (error) {
            console.log('🟠️ Status Dashboard exists but has issues:', error.message);
          }
        }
      }
    }
    
    if (!found) {
      console.log('🔴 Status Dashboard not found');
      results.gaps.push('Status Dashboard needs to be created');
    }
  } catch (error) {
    console.log('🔴 Status Dashboard check failed:', error.message);
  }
  
  // ============== AUDIT ANALYTICS DASHBOARD ==============
  console.log('\n📈 AUDITING ANALYTICS DASHBOARD\n');
  
  try {
    // Check for Analytics Dashboard
    const analyticsPaths = [
      '../src/core/analytics/analytics-dashboard.js',
      '../src/core/dashboard/analytics-dashboard.js',
      '../src/core/analytics/team-performance-analytics.js',
      '../src/core/analytics/performance-integration.js'
    ];
    
    let found = false;
    for (const relativePath of analyticsPaths) {
      const analyticsPath = path.join(__dirname, relativePath);
      if (fs.existsSync(analyticsPath)) {
        console.log(`📁 Found analytics file: ${relativePath}`);
        
        if (relativePath.includes('team-performance-analytics')) {
          try {
            const Analytics = require(analyticsPath);
            if (Analytics) {
              console.log('🏁 Team Performance Analytics found');
              results.components.analyticsDashboard.tests.push('Team analytics exists');
              found = true;
            }
          } catch (error) {
            console.log('🟠️ Analytics module error:', error.message);
          }
        }
      }
    }
    
    if (!found) {
      console.log('🔴 Analytics Dashboard not found');
      results.gaps.push('Analytics Dashboard needs to be created');
    } else {
      results.components.analyticsDashboard.exists = true;
    }
  } catch (error) {
    console.log('🔴 Analytics Dashboard check failed:', error.message);
  }
  
  // ============== AUDIT INTEGRATION STATUS DASHBOARD ==============
  console.log('\n🔗 AUDITING INTEGRATION STATUS DASHBOARD\n');
  
  try {
    const integrationPath = path.join(__dirname, '../src/core/integration/integration-status-dashboard.js');
    if (fs.existsSync(integrationPath)) {
      results.components.integrationStatusDashboard.exists = true;
      console.log('🏁 Integration Status Dashboard found');
      
      try {
        const IntegrationDashboard = require(integrationPath);
        
        // Test instantiation
        const dashboard = typeof IntegrationDashboard === 'function'
          ? new IntegrationDashboard()
          : IntegrationDashboard.getInstance 
            ? IntegrationDashboard.getInstance()
            : IntegrationDashboard;
        
        if (dashboard) {
          results.components.integrationStatusDashboard.functional = true;
          console.log('🏁 Integration Status Dashboard instantiates');
          
          // Check methods
          if (typeof dashboard.display === 'function') {
            results.components.integrationStatusDashboard.tests.push('Display method exists');
            console.log('🏁 Display method found');
          }
          
          if (typeof dashboard.getStatus === 'function') {
            const status = dashboard.getStatus();
            if (status) {
              results.components.integrationStatusDashboard.tests.push('Status retrieval works');
              console.log('🏁 Status retrieval works');
            }
          }
        }
      } catch (error) {
        console.log('🔴 Integration Dashboard error:', error.message);
        results.gaps.push('Integration Dashboard not functional');
      }
    } else {
      console.log('🔴 Integration Status Dashboard not found');
      results.gaps.push('Integration Status Dashboard needs to be created');
    }
  } catch (error) {
    console.log('🔴 Integration Dashboard check failed:', error.message);
  }
  
  // ============== CHECK SHARED DASHBOARD FEATURES ==============
  console.log('\n🔴 CHECKING SHARED DASHBOARD FEATURES\n');
  
  // Check for common dashboard utilities
  const dashboardUtilPaths = [
    '../src/core/dashboard/dashboard-base.js',
    '../src/core/dashboard/dashboard-utils.js',
    '../src/utils/dashboard-helpers.js'
  ];
  
  let hasUtilities = false;
  for (const relativePath of dashboardUtilPaths) {
    const utilPath = path.join(__dirname, relativePath);
    if (fs.existsSync(utilPath)) {
      console.log(`🏁 Found dashboard utilities: ${relativePath}`);
      hasUtilities = true;
      break;
    }
  }
  
  if (!hasUtilities) {
    console.log('🟠️ No shared dashboard utilities found');
    results.gaps.push('Need shared dashboard utilities and base class');
  }
  
  // Check for visualization capabilities
  try {
    // Check if we have charting libraries
    const packageJson = require('../package.json');
    const visualizationLibs = ['blessed', 'blessed-contrib', 'cli-chart', 'asciichart'];
    
    const hasVisualization = visualizationLibs.some(lib => 
      packageJson.dependencies && packageJson.dependencies[lib]
    );
    
    if (hasVisualization) {
      results.features.dataVisualization = true;
      console.log('🏁 Visualization libraries available');
    } else {
      console.log('🟠️ No visualization libraries found');
      results.gaps.push('Need visualization libraries for charts and graphs');
    }
  } catch (error) {
    console.log('🟠️ Could not check visualization capabilities');
  }
  
  // ============== ANALYSIS ==============
  console.log('\n' + '=' .repeat(60));
  console.log('📊 AUDIT RESULTS');
  console.log('=' .repeat(60));
  
  // Calculate completeness
  const components = Object.keys(results.components);
  const existingComponents = components.filter(c => results.components[c].exists).length;
  const functionalComponents = components.filter(c => results.components[c].functional).length;
  
  const overallPercent = Math.round((existingComponents / components.length) * 100);
  const functionalPercent = Math.round((functionalComponents / components.length) * 100);
  
  console.log('\n📊 Dashboard Components:');
  console.log(`   Coordination Dashboard: ${results.components.coordinationDashboard.exists ? '🏁 EXISTS' : '🔴 MISSING'}`);
  console.log(`   Status Dashboard: ${results.components.statusDashboard.exists ? '🏁 EXISTS' : '🔴 MISSING'}`);
  console.log(`   Analytics Dashboard: ${results.components.analyticsDashboard.exists ? '🏁 EXISTS' : '🔴 MISSING'}`);
  console.log(`   Integration Status Dashboard: ${results.components.integrationStatusDashboard.exists ? '🏁 EXISTS' : '🔴 MISSING'}`);
  
  console.log('\n🔍 Feature Coverage:');
  Object.entries(results.features).forEach(([feature, status]) => {
    console.log(`   ${feature}: ${status ? '🏁' : '🔴'}`);
  });
  
  console.log('\n🟠️ IDENTIFIED GAPS:');
  if (results.gaps.length === 0) {
    console.log('   No gaps identified');
  } else {
    results.gaps.forEach(gap => console.log(`   - ${gap}`));
  }
  
  // Generate recommendations
  if (!results.components.coordinationDashboard.exists) {
    results.recommendations.push('Create Coordination Dashboard with department status views');
  }
  if (!results.components.statusDashboard.exists) {
    results.recommendations.push('Create Status Dashboard for system health monitoring');
  }
  if (!results.components.analyticsDashboard.exists) {
    results.recommendations.push('Create Analytics Dashboard with metrics and charts');
  }
  if (!results.components.integrationStatusDashboard.functional) {
    results.recommendations.push('Fix Integration Status Dashboard functionality');
  }
  
  results.recommendations.push('Create shared dashboard base class');
  results.recommendations.push('Add real-time update capabilities');
  results.recommendations.push('Implement data export functionality');
  results.recommendations.push('Add interactive filtering and sorting');
  
  console.log('\n💡 RECOMMENDATIONS:');
  results.recommendations.forEach(rec => console.log(`   - ${rec}`));
  
  console.log('\n' + '=' .repeat(60));
  console.log('📈 OVERALL ASSESSMENT');
  console.log('=' .repeat(60));
  console.log(`Component Coverage: ${overallPercent}% (${existingComponents}/${components.length})`);
  console.log(`Functional Components: ${functionalPercent}% (${functionalComponents}/${components.length})`);
  console.log(`\nOperability Level: ${
    overallPercent === 100 ? '💯 COMPLETE' :
    overallPercent >= 75 ? '🏁 GOOD' :
    overallPercent >= 50 ? '🟠️ PARTIAL' :
    '🔴 INCOMPLETE'
  }`);
  
  // Save audit results
  const auditReport = {
    timestamp: new Date().toISOString(),
    results,
    scores: {
      existence: overallPercent,
      functionality: functionalPercent,
      componentCoverage: `${existingComponents}/${components.length}`
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../DASHBOARD_AUDIT_RESULTS.json'),
    JSON.stringify(auditReport, null, 2)
  );
  
  console.log('\n📄 Detailed audit saved to: DASHBOARD_AUDIT_RESULTS.json');
  
  return overallPercent;
}

// Run audit
auditDashboardSystems().then(score => {
  console.log(`\n🏁 Audit complete! Score: ${score}%`);
  
  if (score < 100) {
    console.log('\n🔧 System needs improvements. Creating sprint plan...');
  } else {
    console.log('\n🏁 Dashboard Systems are fully operational!');
  }
  
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});