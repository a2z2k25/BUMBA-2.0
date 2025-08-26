/**
 * BUMBA Efficiency Benchmark
 * Lightweight test to measure operational efficiency
 */

// Mock logger
const mockLogger = {
  info: () => {},
  error: console.error,
  warn: console.warn,
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

const { BumbaPersonaEngine } = require('../core/persona/persona-engine');

// Performance measurement utilities
class EfficiencyBenchmark {
  constructor() {
    this.results = {
      initialization: {},
      specialistLookup: {},
      recommendationGeneration: {},
      memoryImpact: {},
      scalabilityMetrics: {}
    };
  }

  async measureInitialization() {
    console.log('\n1. INITIALIZATION PERFORMANCE');
    console.log('-----------------------------');
    
    // Measure persona engine initialization
    const start = process.hrtime.bigint();
    const engine = new BumbaPersonaEngine();
    const initTime = Number(process.hrtime.bigint() - start) / 1000000; // ms
    
    this.results.initialization = {
      personaEngineInit: initTime,
      specialistCount: engine.getAllSpecialists().length,
      categoriesLoaded: Object.keys(engine.getSpecialistsByCategory()).length
    };
    
    console.log(`🏁 Persona Engine Init: ${initTime.toFixed(2)}ms`);
    console.log(`🏁 Specialists Loaded: ${this.results.initialization.specialistCount}`);
    console.log(`🏁 Categories: ${this.results.initialization.categoriesLoaded}`);
    
    return engine;
  }

  async measureSpecialistLookup(engine) {
    console.log('\n2. SPECIALIST LOOKUP PERFORMANCE');
    console.log('--------------------------------');
    
    const lookupTests = [
      'javascript-specialist',
      'python-specialist', 
      'devops-engineer',
      'ml-engineer',
      'security-architect'
    ];
    
    const lookupTimes = [];
    
    // Warm up
    for (let i = 0; i < 10; i++) {
      engine.getPersona(null, 'javascript-specialist');
    }
    
    // Measure lookups
    for (const specialist of lookupTests) {
      const start = process.hrtime.bigint();
      for (let i = 0; i < 1000; i++) {
        engine.getPersona(null, specialist);
      }
      const totalTime = Number(process.hrtime.bigint() - start) / 1000000;
      const avgTime = totalTime / 1000;
      lookupTimes.push(avgTime);
      console.log(`🏁 ${specialist}: ${avgTime.toFixed(3)}ms per lookup`);
    }
    
    this.results.specialistLookup = {
      averageLookupTime: lookupTimes.reduce((a, b) => a + b) / lookupTimes.length,
      lookupTests: lookupTests.length,
      iterations: 1000
    };
  }

  async measureRecommendations(engine) {
    console.log('\n3. RECOMMENDATION GENERATION PERFORMANCE');
    console.log('----------------------------------------');
    
    const scenarios = [
      { manager: 'technical', task: { description: 'Build Python API with ML' }},
      { manager: 'experience', task: { description: 'Design mobile UI' }},
      { manager: 'strategic', task: { description: 'Create product roadmap' }},
      { manager: 'technical', task: { description: 'Setup Kubernetes DevOps pipeline' }},
      { manager: 'technical', task: { description: 'Implement blockchain smart contracts' }}
    ];
    
    const recommendationTimes = [];
    
    for (const scenario of scenarios) {
      const start = process.hrtime.bigint();
      for (let i = 0; i < 100; i++) {
        engine.getSpecialistSpawningRecommendations(scenario.manager, scenario.task);
      }
      const totalTime = Number(process.hrtime.bigint() - start) / 1000000;
      const avgTime = totalTime / 100;
      recommendationTimes.push(avgTime);
      
      const recs = engine.getSpecialistSpawningRecommendations(scenario.manager, scenario.task);
      console.log(`🏁 ${scenario.manager} - "${scenario.task.description.substring(0, 30)}..."`);
      console.log(`  Time: ${avgTime.toFixed(2)}ms | Recommendations: ${recs.length}`);
    }
    
    this.results.recommendationGeneration = {
      averageTime: recommendationTimes.reduce((a, b) => a + b) / recommendationTimes.length,
      scenarios: scenarios.length,
      iterations: 100
    };
  }

  measureMemoryImpact() {
    console.log('\n4. MEMORY IMPACT ANALYSIS');
    console.log('-------------------------');
    
    const usage = process.memoryUsage();
    this.results.memoryImpact = {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024)
    };
    
    console.log(`🏁 Heap Used: ${this.results.memoryImpact.heapUsed} MB`);
    console.log(`🏁 Heap Total: ${this.results.memoryImpact.heapTotal} MB`);
    console.log(`🏁 RSS: ${this.results.memoryImpact.rss} MB`);
  }

  calculateScalability() {
    console.log('\n5. SCALABILITY METRICS');
    console.log('----------------------');
    
    const specialistCount = this.results.initialization.specialistCount;
    const avgLookupTime = this.results.specialistLookup.averageLookupTime;
    const avgRecTime = this.results.recommendationGeneration.averageTime;
    
    // Calculate efficiency ratios
    const lookupEfficiency = 1 / avgLookupTime; // lookups per ms
    const recEfficiency = 1 / avgRecTime; // recommendations per ms
    
    // Estimate overhead per specialist
    const overheadPerSpecialist = (avgLookupTime * specialistCount) / 1000; // rough estimate
    
    this.results.scalabilityMetrics = {
      specialistCount,
      lookupEfficiency: lookupEfficiency.toFixed(2) + ' lookups/ms',
      recommendationEfficiency: recEfficiency.toFixed(2) + ' recs/ms',
      estimatedOverheadPerSpecialist: overheadPerSpecialist.toFixed(3) + 'ms',
      theoreticalMaxSpecialists: Math.floor(100 / overheadPerSpecialist) // assuming 100ms budget
    };
    
    console.log(`🏁 Specialists: ${specialistCount}`);
    console.log(`🏁 Lookup Efficiency: ${this.results.scalabilityMetrics.lookupEfficiency}`);
    console.log(`🏁 Recommendation Efficiency: ${this.results.scalabilityMetrics.recommendationEfficiency}`);
    console.log(`🏁 Overhead per Specialist: ${this.results.scalabilityMetrics.estimatedOverheadPerSpecialist}`);
    console.log(`🏁 Theoretical Max Specialists: ${this.results.scalabilityMetrics.theoreticalMaxSpecialists}`);
  }

  generateReport() {
    console.log('\n\n🟢 OPERATIONAL EFFICIENCY REPORT');
    console.log('==================================\n');
    
    // Performance Grade
    const initTime = this.results.initialization.personaEngineInit;
    const avgLookup = this.results.specialistLookup.averageLookupTime;
    const avgRec = this.results.recommendationGeneration.averageTime;
    
    let performanceGrade = 'A';
    let issues = [];
    
    if (initTime > 100) {
      performanceGrade = 'B';
      issues.push('Initialization time is high');
    }
    if (avgLookup > 0.1) {
      performanceGrade = 'C';
      issues.push('Specialist lookup is slow');
    }
    if (avgRec > 5) {
      performanceGrade = 'C';
      issues.push('Recommendation generation is slow');
    }
    if (this.results.memoryImpact.heapUsed > 100) {
      performanceGrade = performanceGrade === 'A' ? 'B' : performanceGrade;
      issues.push('High memory usage');
    }
    
    console.log(`OVERALL PERFORMANCE GRADE: ${performanceGrade}`);
    
    if (issues.length > 0) {
      console.log('\nIssues Detected:');
      issues.forEach(issue => console.log(`- ${issue}`));
    }
    
    console.log('\nKey Metrics Summary:');
    console.log('-------------------');
    console.log(`Initialization Time: ${initTime.toFixed(2)}ms`);
    console.log(`Average Lookup Time: ${avgLookup.toFixed(3)}ms`);
    console.log(`Average Recommendation Time: ${avgRec.toFixed(2)}ms`);
    console.log(`Memory Usage: ${this.results.memoryImpact.heapUsed} MB`);
    console.log(`Specialists Loaded: ${this.results.initialization.specialistCount}`);
    
    console.log('\nOperational Assessment:');
    console.log('----------------------');
    
    if (performanceGrade === 'A') {
      console.log('🏁 EXCELLENT - Framework is operating at peak efficiency');
      console.log('   → No performance bottlenecks detected');
      console.log('   → Specialist expansion has minimal impact');
    } else if (performanceGrade === 'B') {
      console.log('🏁 GOOD - Framework is operating efficiently');
      console.log('   → Minor optimization opportunities exist');
      console.log('   → Specialist expansion is well-managed');
    } else {
      console.log('🟡  NEEDS OPTIMIZATION - Performance issues detected');
      console.log('   → Consider implementing caching strategies');
      console.log('   → Review specialist initialization process');
    }
    
    console.log('\nRecommendations:');
    console.log('----------------');
    
    if (avgLookup > 0.05) {
      console.log('1. Implement specialist lookup caching');
    }
    if (avgRec > 3) {
      console.log('2. Optimize recommendation algorithm');
    }
    if (this.results.memoryImpact.heapUsed > 80) {
      console.log('3. Review memory usage patterns');
    }
    if (this.results.initialization.specialistCount > 40) {
      console.log('4. Consider lazy loading for specialists');
    }
    
    // Expansion Impact Analysis
    console.log('\nExpansion Impact Analysis:');
    console.log('-------------------------');
    const baseSpecialists = 9; // Original BUMBA specialists
    const newSpecialists = this.results.initialization.specialistCount - baseSpecialists;
    const expansionRatio = this.results.initialization.specialistCount / baseSpecialists;
    
    console.log(`Original Specialists: ${baseSpecialists}`);
    console.log(`New Specialists Added: ${newSpecialists}`);
    console.log(`Expansion Ratio: ${expansionRatio.toFixed(1)}x`);
    
    // Estimate performance impact
    const estimatedOriginalLookup = avgLookup / expansionRatio;
    const lookupImpact = ((avgLookup - estimatedOriginalLookup) / estimatedOriginalLookup * 100);
    
    console.log(`Estimated Lookup Impact: ${lookupImpact > 0 ? '+' : ''}${lookupImpact.toFixed(1)}%`);
    
    if (lookupImpact < 20) {
      console.log('🏁 Expansion impact is MINIMAL - excellent scalability');
    } else if (lookupImpact < 50) {
      console.log('🏁 Expansion impact is MODERATE - acceptable performance');
    } else {
      console.log('🟡  Expansion impact is HIGH - optimization needed');
    }
    
    return {
      grade: performanceGrade,
      results: this.results,
      issues
    };
  }
}

// Run benchmark
async function runBenchmark() {
  console.log('🏁 BUMBA EFFICIENCY BENCHMARK');
  console.log('=============================');
  console.log('Testing operational efficiency with expanded specialist team...\n');
  
  const benchmark = new EfficiencyBenchmark();
  
  try {
    // Run all measurements
    const engine = await benchmark.measureInitialization();
    await benchmark.measureSpecialistLookup(engine);
    await benchmark.measureRecommendations(engine);
    benchmark.measureMemoryImpact();
    benchmark.calculateScalability();
    
    // Generate report
    const report = benchmark.generateReport();
    
    console.log('\n🏁 Benchmark completed successfully!');
    
    return report;
  } catch (error) {
    console.error('🔴 Benchmark failed:', error);
    throw error;
  }
}

// Execute benchmark
runBenchmark().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});