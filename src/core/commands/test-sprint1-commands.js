#!/usr/bin/env node

/**
 * Sprint 1 Test: Three Foundational Commands
 * Tests /bumba:api (Backend), /bumba:design (Frontend), /bumba:prd (Product)
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(text) {
  console.log('\n' + '='.repeat(80));
  console.log(colorize(`🟢 ${text}`, 'bright'));
  console.log('='.repeat(80));
}

function printSection(text) {
  console.log('\n' + colorize(`▶ ${text}`, 'cyan'));
  console.log('-'.repeat(60));
}

async function testSprint1Commands() {
  printHeader('SPRINT 1: Testing Three Foundational Commands');
  
  try {
    // Initialize the command execution bridge
    const { getInstance } = require('./command-execution-bridge');
    const commandBridge = getInstance();
    
    // Allow time for pooling system to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const testCommands = [
      {
        name: 'api',
        args: ['Create a REST API for user authentication'],
        department: 'Backend',
        expectedSpecialists: ['api-architect', 'backend-developer']
      },
      {
        name: 'design',
        args: ['Design a modern dashboard interface'],
        department: 'Frontend',
        expectedSpecialists: ['ui-designer', 'ux-specialist', 'frontend-developer']
      },
      {
        name: 'prd',
        args: ['Create PRD for a task management system'],
        department: 'Product',
        expectedSpecialists: ['product-owner', 'business-analyst', 'market-researcher']
      }
    ];
    
    let successCount = 0;
    const results = [];
    
    for (const test of testCommands) {
      printSection(`Testing /bumba:${test.name} (${test.department})`);
      
      console.log(`📝 Input: "${test.args.join(' ')}"`);
      console.log(`🟡 Expected specialists: ${test.expectedSpecialists.join(', ')}`);
      
      try {
        const result = await commandBridge.executeCommand(test.name, test.args, {
          testMode: true
        });
        
        if (result.success) {
          console.log(colorize('🏁 Command executed successfully', 'green'));
          console.log(`   Department: ${result.department}`);
          console.log(`   Specialists used: ${result.specialists.join(', ')}`);
          console.log(`   Response time: ${result.metrics.responseTime}ms`);
          console.log(`   Warm hits: ${result.metrics.warmHits}, Cold starts: ${result.metrics.coldStarts}`);
          
          // Verify specialists match
          const specialistsMatch = test.expectedSpecialists.every(
            s => result.specialists.includes(s)
          );
          
          if (specialistsMatch) {
            console.log(colorize('🏁 Correct specialists selected', 'green'));
            successCount++;
          } else {
            console.log(colorize('🟠️ Specialist mismatch', 'yellow'));
          }
          
        } else {
          console.log(colorize(`🔴 Command failed: ${result.error}`, 'red'));
        }
        
        results.push(result);
        
      } catch (error) {
        console.log(colorize(`🔴 Test error: ${error.message}`, 'red'));
        results.push({ success: false, error: error.message });
      }
    }
    
    // Test metrics
    printSection('Pooling System Metrics');
    
    const metrics = commandBridge.getMetrics();
    console.log(`📊 Total commands executed: ${metrics.totalCommands}`);
    console.log(`🟢 Warm hits: ${metrics.warmHits}`);
    console.log(`🔵 Cold starts: ${metrics.coldStarts}`);
    console.log(`📈 Warm hit rate: ${(metrics.warmHitRate * 100).toFixed(1)}%`);
    console.log(`⏱️ Average response time: ${metrics.averageResponseTime.toFixed(0)}ms`);
    
    // Test command chaining (simulating real workflow)
    printSection('Testing Command Workflow');
    
    console.log('Simulating real project workflow:');
    console.log('1. PRD → 2. Design → 3. API Implementation');
    
    // Execute commands in sequence to test warming
    const workflowCommands = ['prd', 'design', 'api'];
    
    for (let i = 0; i < workflowCommands.length; i++) {
      const cmd = workflowCommands[i];
      console.log(`\n${i + 1}. Executing ${cmd}...`);
      
      const result = await commandBridge.executeCommand(cmd, ['Workflow test'], {});
      
      if (result.success) {
        console.log(`   🏁 ${cmd} completed`);
        console.log(`   Warm/Cold: ${result.metrics.warmHits}/${result.metrics.coldStarts}`);
      }
    }
    
    // Final metrics after workflow
    printSection('Final Metrics After Workflow');
    
    const finalMetrics = commandBridge.getMetrics();
    console.log(`📊 Total commands: ${finalMetrics.totalCommands}`);
    console.log(`📈 Final warm hit rate: ${colorize((finalMetrics.warmHitRate * 100).toFixed(1) + '%', 'green')}`);
    console.log(`⏱️ Average response time: ${finalMetrics.averageResponseTime.toFixed(0)}ms`);
    
    // Summary
    printHeader('SPRINT 1 TEST RESULTS');
    
    console.log(`\n🟡 Commands tested: ${testCommands.length}`);
    console.log(`🏁 Successful: ${successCount}/${testCommands.length}`);
    
    if (successCount === testCommands.length) {
      console.log(colorize('\n🏁 ALL TESTS PASSED!', 'green'));
      console.log(colorize('Sprint 1 foundational commands are working!', 'bright'));
    } else {
      console.log(colorize(`\n🟠️ ${testCommands.length - successCount} tests need attention`, 'yellow'));
    }
    
    // Recommendations
    console.log('\n💡 Next Steps:');
    console.log('1. Enhance department managers to properly coordinate specialists');
    console.log('2. Connect actual specialist classes (not mocks)');
    console.log('3. Implement proper prompt distribution to specialists');
    console.log('4. Add more commands in Sprint 2');
    
  } catch (error) {
    console.error(colorize(`\n🔴 Test suite error: ${error.message}`, 'red'));
    console.error(error.stack);
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

// Run tests
if (require.main === module) {
  testSprint1Commands().catch(console.error);
}

module.exports = { testSprint1Commands };