/**
 * BUMBA Operational Efficiency Test
 * Tests the performance and efficiency of the enhanced framework
 */

// Mock logger to avoid initialization issues
const mockLogger = {
  info: (...args) => console.log('🏁', ...args),
  error: (...args) => console.error('🔴', ...args),
  warn: (...args) => console.warn('🟡', ...args),
  debug: () => {}
};

// Override require for logger
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id.includes('bumba-logger')) {
    return { logger: mockLogger };
  }
  return originalRequire.apply(this, arguments);
};

// Load modules
const { BumbaIntelligentRouter } = require('../core/intelligent-router');
const { BumbaPersonaEngine } = require('../core/persona/persona-engine');
const BackendEngineerManager = require('../core/departments/backend-engineer-manager');
const ProductStrategistManager = require('../core/departments/product-strategist-manager');
const DesignEngineerManager = require('../core/departments/design-engineer-manager');

// Performance tracking
class PerformanceTracker {
  constructor() {
    this.metrics = {
      taskProcessingTimes: [],
      specialistSpawnTimes: [],
      routingDecisionTimes: [],
      memoryUsage: [],
      departmentResponseTimes: {}
    };
  }

  startTimer() {
    return process.hrtime.bigint();
  }

  endTimer(start) {
    const end = process.hrtime.bigint();
    return Number(end - start) / 1000000; // Convert to milliseconds
  }

  recordMetric(category, value) {
    if (Array.isArray(this.metrics[category])) {
      this.metrics[category].push(value);
    }
  }

  getAverageTime(category) {
    const times = this.metrics[category];
    if (!times || times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  recordMemoryUsage() {
    const usage = process.memoryUsage();
    this.metrics.memoryUsage.push({
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024)
    });
  }

  generateReport() {
    const avgTaskTime = this.getAverageTime('taskProcessingTimes');
    const avgSpawnTime = this.getAverageTime('specialistSpawnTimes');
    const avgRoutingTime = this.getAverageTime('routingDecisionTimes');
    
    const memoryStats = this.metrics.memoryUsage;
    const avgMemory = memoryStats.length > 0 ? 
      memoryStats.reduce((acc, m) => acc + m.heapUsed, 0) / memoryStats.length : 0;

    return {
      performance: {
        avgTaskProcessingTime: avgTaskTime.toFixed(2) + ' ms',
        avgSpecialistSpawnTime: avgSpawnTime.toFixed(2) + ' ms',
        avgRoutingDecisionTime: avgRoutingTime.toFixed(2) + ' ms',
        totalTasksProcessed: this.metrics.taskProcessingTimes.length
      },
      memory: {
        averageHeapUsed: avgMemory.toFixed(2) + ' MB',
        peakHeapUsed: Math.max(...memoryStats.map(m => m.heapUsed)) + ' MB',
        samples: memoryStats.length
      },
      efficiency: {
        tasksPerSecond: avgTaskTime > 0 ? (1000 / avgTaskTime).toFixed(2) : 'N/A',
        routingOverhead: ((avgRoutingTime / avgTaskTime) * 100).toFixed(2) + '%',
        spawnOverhead: ((avgSpawnTime / avgTaskTime) * 100).toFixed(2) + '%'
      }
    };
  }
}

// Test scenarios
const testScenarios = [
  // Simple tasks (should be fast)
  {
    id: 'simple-1',
    description: 'Fix a typo in documentation',
    expectedComplexity: 'low',
    expectedSpecialists: 0
  },
  {
    id: 'simple-2',
    description: 'Update package version',
    expectedComplexity: 'low',
    expectedSpecialists: 0
  },
  
  // Medium complexity tasks
  {
    id: 'medium-1',
    description: 'Build a REST API with Node.js and implement authentication',
    expectedComplexity: 'medium',
    expectedSpecialists: 2
  },
  {
    id: 'medium-2',
    description: 'Design a user-friendly dashboard with responsive layout',
    expectedComplexity: 'medium',
    expectedSpecialists: 2
  },
  {
    id: 'medium-3',
    description: 'Create market analysis and competitive pricing strategy',
    expectedComplexity: 'medium',
    expectedSpecialists: 2
  },
  
  // Complex tasks (multiple specialists)
  {
    id: 'complex-1',
    description: 'Implement machine learning pipeline with Python, deploy to Kubernetes, and create API',
    expectedComplexity: 'high',
    expectedSpecialists: 4
  },
  {
    id: 'complex-2',
    description: 'Build accessible mobile app with React Native, cloud backend, and real-time features',
    expectedComplexity: 'high',
    expectedSpecialists: 4
  },
  {
    id: 'complex-3',
    description: 'Design blockchain smart contract system with security audit and technical documentation',
    expectedComplexity: 'high',
    expectedSpecialists: 3
  },
  
  // Cross-department tasks
  {
    id: 'cross-1',
    description: 'Create AI-powered product with business model, technical documentation, and go-to-market strategy',
    expectedComplexity: 'very-high',
    expectedSpecialists: 5
  },
  {
    id: 'cross-2',
    description: 'Build enterprise platform with microservices, DevOps pipeline, and project management',
    expectedComplexity: 'very-high',
    expectedSpecialists: 5
  }
];

async function runOperationalTest() {
  console.log('🏁 BUMBA Operational Efficiency Test');
  console.log('=====================================\n');
  
  const tracker = new PerformanceTracker();
  const router = new BumbaIntelligentRouter();
  const personaEngine = new BumbaPersonaEngine();
  
  // Initialize departments
  const departments = {
    technical: new BackendEngineerManager(),
    strategic: new ProductStrategistManager(),
    experience: new DesignEngineerManager()
  };
  
  console.log('Test Configuration:');
  console.log('- Total Specialists Available:', personaEngine.getAllSpecialists().length);
  console.log('- Test Scenarios:', testScenarios.length);
  console.log('- Departments:', Object.keys(departments).length);
  console.log('\nStarting efficiency tests...\n');
  
  // Warm-up phase
  console.log('Warming up framework...');
  for (let i = 0; i < 3; i++) {
    await router.analyzeTask('warm-up task', [], {});
  }
  tracker.recordMemoryUsage();
  
  // Test each scenario
  for (const scenario of testScenarios) {
    console.log(`\n🟢 Testing: ${scenario.id}`);
    console.log(`   Task: "${scenario.description}"`);
    
    // Measure routing decision time
    const routingStart = tracker.startTimer();
    const analysis = await router.analyzeTask(scenario.description, [], {});
    const routingTime = tracker.endTimer(routingStart);
    tracker.recordMetric('routingDecisionTimes', routingTime);
    
    console.log(`   🏁 Routing Decision: ${routingTime.toFixed(2)}ms`);
    console.log(`   🏁 Complexity: ${(analysis.complexity * 100).toFixed(0)}%`);
    console.log(`   🏁 Departments: ${analysis.departments.join(', ')}`);
    
    // Measure task processing time
    const taskStart = tracker.startTimer();
    
    // Simulate department processing
    const departmentTimes = {};
    for (const dept of analysis.departments) {
      const deptStart = tracker.startTimer();
      const manager = departments[dept];
      
      // Get specialist needs
      const specialists = await manager.analyzeSpecialistNeeds({ description: scenario.description });
      console.log(`   🏁 ${dept} specialists: ${specialists.length > 0 ? specialists.join(', ') : 'none'}`);
      
      // Simulate specialist spawning
      if (specialists.length > 0) {
        const spawnStart = tracker.startTimer();
        // Simulate spawn time (would actually create specialists in production)
        await new Promise(resolve => setTimeout(resolve, 10 * specialists.length));
        const spawnTime = tracker.endTimer(spawnStart);
        tracker.recordMetric('specialistSpawnTimes', spawnTime);
      }
      
      const deptTime = tracker.endTimer(deptStart);
      departmentTimes[dept] = deptTime;
    }
    
    const taskTime = tracker.endTimer(taskStart);
    tracker.recordMetric('taskProcessingTimes', taskTime);
    
    console.log(`   🏁 Total Processing: ${taskTime.toFixed(2)}ms`);
    
    // Record memory usage periodically
    if (testScenarios.indexOf(scenario) % 3 === 0) {
      tracker.recordMemoryUsage();
    }
  }
  
  // Final memory recording
  tracker.recordMemoryUsage();
  
  // Generate and display report
  console.log('\n\n🟢 OPERATIONAL EFFICIENCY REPORT');
  console.log('==================================\n');
  
  const report = tracker.generateReport();
  
  console.log('Performance Metrics:');
  console.log('-------------------');
  console.log(`Average Task Processing Time: ${report.performance.avgTaskProcessingTime}`);
  console.log(`Average Specialist Spawn Time: ${report.performance.avgSpecialistSpawnTime}`);
  console.log(`Average Routing Decision Time: ${report.performance.avgRoutingDecisionTime}`);
  console.log(`Total Tasks Processed: ${report.performance.totalTasksProcessed}`);
  
  console.log('\nMemory Usage:');
  console.log('-------------');
  console.log(`Average Heap Used: ${report.memory.averageHeapUsed}`);
  console.log(`Peak Heap Used: ${report.memory.peakHeapUsed}`);
  
  console.log('\nEfficiency Analysis:');
  console.log('-------------------');
  console.log(`Tasks Per Second: ${report.efficiency.tasksPerSecond}`);
  console.log(`Routing Overhead: ${report.efficiency.routingOverhead}`);
  console.log(`Spawn Overhead: ${report.efficiency.spawnOverhead}`);
  
  // Bottleneck Analysis
  console.log('\nBottleneck Analysis:');
  console.log('-------------------');
  
  const avgTaskTime = parseFloat(report.performance.avgTaskProcessingTime);
  const avgRoutingTime = parseFloat(report.performance.avgRoutingDecisionTime);
  const avgSpawnTime = parseFloat(report.performance.avgSpecialistSpawnTime);
  
  if (avgTaskTime > 100) {
    console.log('🟡  Task processing time is HIGH (>100ms)');
    if (avgSpawnTime > avgTaskTime * 0.3) {
      console.log('   → Specialist spawning is a significant bottleneck');
    }
    if (avgRoutingTime > avgTaskTime * 0.2) {
      console.log('   → Routing decisions are taking too long');
    }
  } else if (avgTaskTime > 50) {
    console.log('🏁 Task processing time is MODERATE (50-100ms)');
  } else {
    console.log('🏁 Task processing time is EXCELLENT (<50ms)');
  }
  
  // Scalability Assessment
  console.log('\nScalability Assessment:');
  console.log('----------------------');
  
  const specialistCount = personaEngine.getAllSpecialists().length;
  const routingOverhead = parseFloat(report.efficiency.routingOverhead);
  
  if (routingOverhead > 20) {
    console.log('🟡  High routing overhead indicates potential scalability issues');
  } else if (routingOverhead > 10) {
    console.log('🏁 Moderate routing overhead - acceptable for current scale');
  } else {
    console.log('🏁 Low routing overhead - framework scales well');
  }
  
  console.log(`\nWith ${specialistCount} specialists:`);
  if (avgTaskTime < 100 && routingOverhead < 20) {
    console.log('🏁 Framework is operating EFFICIENTLY');
    console.log('   → No significant performance degradation from expansion');
  } else {
    console.log('🟡  Framework shows signs of performance impact');
    console.log('   → Consider optimization strategies');
  }
  
  // Recommendations
  console.log('\nRecommendations:');
  console.log('----------------');
  
  if (avgSpawnTime > 20) {
    console.log('1. Implement specialist pooling to reduce spawn time');
  }
  if (routingOverhead > 15) {
    console.log('2. Optimize routing algorithm with caching');
  }
  if (report.memory.peakHeapUsed > 200) {
    console.log('3. Implement specialist lifecycle management');
  }
  
  console.log('\n🏁 Operational efficiency test completed!');
  
  return report;
}

// Run the test
runOperationalTest().catch(error => {
  console.error('🔴 Test failed:', error);
  process.exit(1);
});