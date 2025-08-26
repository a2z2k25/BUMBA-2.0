/**
 * BUMBA Specialist Validator
 * Comprehensive testing framework for validating specialist capabilities
 * Ensures all 78+ specialists are operational and performant
 */

const { logger } = require('../logging/bumba-logger');
const { audioFallbackSystem } = require('../audio-fallback-system');
const UnifiedSpecialistBase = require('./unified-specialist-base');

class SpecialistValidator {
  constructor() {
    this.testResults = new Map();
    this.benchmarks = new Map();
    this.qualityChecks = {
      responseTime: { threshold: 2000, unit: 'ms' },
      confidence: { threshold: 0.5, unit: 'score' },
      successRate: { threshold: 0.8, unit: 'ratio' },
      tokenUsage: { threshold: 4000, unit: 'tokens' }
    };
    
    this.testSuites = {
      basic: this.getBasicTestSuite(),
      capability: this.getCapabilityTestSuite(),
      performance: this.getPerformanceTestSuite(),
      integration: this.getIntegrationTestSuite()
    };
  }
  
  /**
   * Validate a single specialist
   */
  async validateSpecialist(specialist, options = {}) {
    const startTime = Date.now();
    const testId = `${specialist.type}_${Date.now()}`;
    
    logger.info(`🧪 Validating specialist: ${specialist.name}`);
    
    const results = {
      specialist: specialist.name,
      type: specialist.type,
      category: specialist.category,
      tests: {
        basic: await this.runBasicTests(specialist),
        capability: await this.runCapabilityTests(specialist),
        performance: await this.runPerformanceTests(specialist),
        quality: await this.runQualityChecks(specialist)
      },
      metrics: {},
      passed: false,
      issues: [],
      duration: 0
    };
    
    // Calculate overall pass/fail
    results.passed = this.evaluateResults(results);
    results.duration = Date.now() - startTime;
    
    // Store results
    this.testResults.set(testId, results);
    
    // Log summary
    this.logTestSummary(results);
    
    // Play audio for successful validation
    if (results.passed && options.playAudio !== false) {
      try {
        await audioFallbackSystem.playAchievementAudio('SPECIALIST_VALIDATED', {
          specialist: specialist.name,
          duration: results.duration
        });
      } catch (e) {
        // Audio is optional
      }
    }
    
    return results;
  }
  
  /**
   * Run basic operational tests
   */
  async runBasicTests(specialist) {
    const tests = [];
    
    // Test 1: Can process simple task
    tests.push(await this.testSimpleTask(specialist));
    
    // Test 2: Has required properties
    tests.push(this.testRequiredProperties(specialist));
    
    // Test 3: System prompt is valid
    tests.push(this.testSystemPrompt(specialist));
    
    // Test 4: Can handle errors gracefully
    tests.push(await this.testErrorHandling(specialist));
    
    return {
      total: tests.length,
      passed: tests.filter(t => t.passed).length,
      failed: tests.filter(t => !t.passed).length,
      details: tests
    };
  }
  
  /**
   * Run capability-specific tests
   */
  async runCapabilityTests(specialist) {
    const tests = [];
    const suite = this.testSuites.capability[specialist.category] || this.testSuites.capability.default;
    
    for (const test of suite) {
      const result = await this.executeCapabilityTest(specialist, test);
      tests.push(result);
    }
    
    return {
      total: tests.length,
      passed: tests.filter(t => t.passed).length,
      failed: tests.filter(t => !t.passed).length,
      details: tests
    };
  }
  
  /**
   * Run performance benchmarks
   */
  async runPerformanceTests(specialist) {
    const benchmarks = [];
    
    // Test response time
    benchmarks.push(await this.benchmarkResponseTime(specialist));
    
    // Test throughput
    benchmarks.push(await this.benchmarkThroughput(specialist));
    
    // Test memory usage
    benchmarks.push(this.benchmarkMemoryUsage(specialist));
    
    // Test token efficiency
    benchmarks.push(await this.benchmarkTokenUsage(specialist));
    
    return {
      total: benchmarks.length,
      passed: benchmarks.filter(b => b.passed).length,
      failed: benchmarks.filter(b => !b.passed).length,
      details: benchmarks
    };
  }
  
  /**
   * Run quality checks
   */
  async runQualityChecks(specialist) {
    const checks = [];
    
    // Check response quality
    checks.push(await this.checkResponseQuality(specialist));
    
    // Check confidence scoring
    checks.push(await this.checkConfidenceScoring(specialist));
    
    // Check output formatting
    checks.push(await this.checkOutputFormatting(specialist));
    
    // Check knowledge consistency
    checks.push(await this.checkKnowledgeConsistency(specialist));
    
    return {
      total: checks.length,
      passed: checks.filter(c => c.passed).length,
      failed: checks.filter(c => !c.passed).length,
      details: checks
    };
  }
  
  /**
   * Test simple task processing
   */
  async testSimpleTask(specialist) {
    try {
      const task = `What are your main capabilities as a ${specialist.name}?`;
      const result = await specialist.processTask(task);
      
      return {
        name: 'Simple Task Processing',
        passed: result.success && result.result && result.result.content,
        message: result.success ? 'Task processed successfully' : 'Task processing failed',
        details: { confidence: result.confidence, duration: result.duration }
      };
    } catch (error) {
      return {
        name: 'Simple Task Processing',
        passed: false,
        message: `Error: ${error.message}`,
        details: { error: error.stack }
      };
    }
  }
  
  /**
   * Test required properties
   */
  testRequiredProperties(specialist) {
    const required = ['id', 'name', 'type', 'category', 'capabilities', 'expertise'];
    const missing = [];
    
    for (const prop of required) {
      if (!specialist[prop]) {
        missing.push(prop);
      }
    }
    
    return {
      name: 'Required Properties',
      passed: missing.length === 0,
      message: missing.length === 0 ? 'All properties present' : `Missing: ${missing.join(', ')}`,
      details: { required, missing }
    };
  }
  
  /**
   * Test system prompt validity
   */
  testSystemPrompt(specialist) {
    const prompt = specialist.systemPrompt;
    const isValid = prompt && 
                   prompt.length > 100 &&
                   prompt.includes(specialist.name) &&
                   prompt.includes('capabilities');
    
    return {
      name: 'System Prompt Validity',
      passed: isValid,
      message: isValid ? 'System prompt is valid' : 'System prompt is invalid or too short',
      details: { length: prompt?.length || 0 }
    };
  }
  
  /**
   * Test error handling
   */
  async testErrorHandling(specialist) {
    try {
      // Intentionally pass invalid input
      const result = await specialist.processTask(null);
      
      return {
        name: 'Error Handling',
        passed: !result.success && result.error,
        message: 'Error handled gracefully',
        details: { errorMessage: result.error }
      };
    } catch (error) {
      return {
        name: 'Error Handling',
        passed: false,
        message: 'Unhandled exception thrown',
        details: { error: error.message }
      };
    }
  }
  
  /**
   * Execute a capability test
   */
  async executeCapabilityTest(specialist, test) {
    try {
      const result = await specialist.processTask(test.task, test.context || {});
      const validation = test.validate ? test.validate(result) : result.success;
      
      return {
        name: test.name,
        passed: validation,
        message: validation ? 'Capability demonstrated' : 'Capability not demonstrated',
        details: { task: test.task, confidence: result.confidence }
      };
    } catch (error) {
      return {
        name: test.name,
        passed: false,
        message: `Error: ${error.message}`,
        details: { task: test.task, error: error.stack }
      };
    }
  }
  
  /**
   * Benchmark response time
   */
  async benchmarkResponseTime(specialist) {
    const iterations = 5;
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await specialist.processTask('Generate a simple hello world function');
      times.push(Date.now() - start);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const passed = avgTime < this.qualityChecks.responseTime.threshold;
    
    return {
      name: 'Response Time',
      passed,
      message: `Average: ${avgTime.toFixed(0)}ms`,
      details: { times, average: avgTime, threshold: this.qualityChecks.responseTime.threshold }
    };
  }
  
  /**
   * Benchmark throughput
   */
  async benchmarkThroughput(specialist) {
    const tasks = [
      'Task 1: Simple analysis',
      'Task 2: Code generation',
      'Task 3: Documentation'
    ];
    
    const start = Date.now();
    const results = await Promise.all(
      tasks.map(task => specialist.processTask(task))
    );
    const duration = Date.now() - start;
    
    const throughput = (tasks.length / duration) * 1000; // tasks per second
    const passed = throughput > 0.5; // At least 0.5 tasks per second
    
    return {
      name: 'Throughput',
      passed,
      message: `${throughput.toFixed(2)} tasks/second`,
      details: { tasks: tasks.length, duration, throughput }
    };
  }
  
  /**
   * Benchmark memory usage
   */
  benchmarkMemoryUsage(specialist) {
    const used = process.memoryUsage();
    const heapUsed = Math.round(used.heapUsed / 1024 / 1024);
    const passed = heapUsed < 500; // Less than 500MB
    
    return {
      name: 'Memory Usage',
      passed,
      message: `Heap: ${heapUsed}MB`,
      details: { heapUsed, heapTotal: Math.round(used.heapTotal / 1024 / 1024) }
    };
  }
  
  /**
   * Benchmark token usage
   */
  async benchmarkTokenUsage(specialist) {
    const task = 'Generate a comprehensive guide for building a REST API';
    const result = await specialist.processTask(task);
    
    const tokens = result.result?.tokens || 0;
    const passed = tokens < this.qualityChecks.tokenUsage.threshold;
    
    return {
      name: 'Token Usage',
      passed,
      message: `${tokens} tokens used`,
      details: { tokens, threshold: this.qualityChecks.tokenUsage.threshold }
    };
  }
  
  /**
   * Check response quality
   */
  async checkResponseQuality(specialist) {
    const task = `Explain the main purpose of ${specialist.name} in one paragraph`;
    const result = await specialist.processTask(task);
    
    const hasContent = result.result?.content?.length > 50;
    const isRelevant = result.result?.content?.toLowerCase().includes(specialist.type.toLowerCase());
    const passed = hasContent && isRelevant;
    
    return {
      name: 'Response Quality',
      passed,
      message: passed ? 'Response is relevant and substantial' : 'Response quality issues',
      details: { contentLength: result.result?.content?.length || 0 }
    };
  }
  
  /**
   * Check confidence scoring
   */
  async checkConfidenceScoring(specialist) {
    const goodTask = `A task perfectly suited for ${specialist.name}`;
    const badTask = 'A task completely unrelated to anything';
    
    const goodResult = await specialist.processTask(goodTask);
    const badResult = await specialist.processTask(badTask);
    
    const passed = goodResult.confidence > badResult.confidence;
    
    return {
      name: 'Confidence Scoring',
      passed,
      message: passed ? 'Confidence scoring works correctly' : 'Confidence scoring issues',
      details: { 
        goodTaskConfidence: goodResult.confidence,
        badTaskConfidence: badResult.confidence
      }
    };
  }
  
  /**
   * Check output formatting
   */
  async checkOutputFormatting(specialist) {
    const task = 'Generate a code example with proper formatting';
    const result = await specialist.processTask(task);
    
    const hasStructure = result.result?.structured !== undefined;
    const hasFormat = result.result?.format !== undefined;
    const passed = hasStructure && hasFormat;
    
    return {
      name: 'Output Formatting',
      passed,
      message: passed ? 'Output properly formatted' : 'Output formatting issues',
      details: { hasStructure, hasFormat }
    };
  }
  
  /**
   * Check knowledge consistency
   */
  async checkKnowledgeConsistency(specialist) {
    const task = 'List your top 3 areas of expertise';
    const result1 = await specialist.processTask(task);
    const result2 = await specialist.processTask(task);
    
    // Check if responses are reasonably consistent
    const content1 = result1.result?.content || '';
    const content2 = result2.result?.content || '';
    
    // Simple consistency check - both should mention similar things
    const similarity = this.calculateSimilarity(content1, content2);
    const passed = similarity > 0.5;
    
    return {
      name: 'Knowledge Consistency',
      passed,
      message: passed ? 'Consistent knowledge base' : 'Inconsistent responses',
      details: { similarity }
    };
  }
  
  /**
   * Calculate simple text similarity
   */
  calculateSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
  
  /**
   * Evaluate overall test results
   */
  evaluateResults(results) {
    const allTests = [
      results.tests.basic,
      results.tests.capability,
      results.tests.performance,
      results.tests.quality
    ];
    
    let totalTests = 0;
    let passedTests = 0;
    
    for (const suite of allTests) {
      totalTests += suite.total;
      passedTests += suite.passed;
    }
    
    const passRate = passedTests / totalTests;
    results.metrics.passRate = passRate;
    results.metrics.totalTests = totalTests;
    results.metrics.passedTests = passedTests;
    
    // Identify specific issues
    if (passRate < 1) {
      for (const [suiteName, suite] of Object.entries(results.tests)) {
        if (suite.failed > 0) {
          for (const test of suite.details) {
            if (!test.passed) {
              results.issues.push({
                suite: suiteName,
                test: test.name,
                message: test.message
              });
            }
          }
        }
      }
    }
    
    return passRate >= this.qualityChecks.successRate.threshold;
  }
  
  /**
   * Log test summary
   */
  logTestSummary(results) {
    const emoji = results.passed ? '🏁' : '🔴';
    const status = results.passed ? 'PASSED' : 'FAILED';
    
    logger.info(`${emoji} ${results.specialist} Validation ${status}`);
    logger.info(`   Pass Rate: ${(results.metrics.passRate * 100).toFixed(1)}%`);
    logger.info(`   Tests: ${results.metrics.passedTests}/${results.metrics.totalTests}`);
    logger.info(`   Duration: ${results.duration}ms`);
    
    if (results.issues.length > 0) {
      logger.warn(`   Issues found:`);
      for (const issue of results.issues.slice(0, 3)) {
        logger.warn(`   - ${issue.suite}/${issue.test}: ${issue.message}`);
      }
    }
  }
  
  /**
   * Get test suite definitions
   */
  getBasicTestSuite() {
    return [
      {
        name: 'Identity Check',
        test: (specialist) => specialist.name && specialist.type
      },
      {
        name: 'Capability Check',
        test: (specialist) => specialist.capabilities.length > 0
      },
      {
        name: 'Expertise Check',
        test: (specialist) => Object.keys(specialist.expertise).length > 0
      }
    ];
  }
  
  getCapabilityTestSuite() {
    return {
      technical: [
        {
          name: 'Code Generation',
          task: 'Generate a simple function that adds two numbers',
          validate: (result) => result.success && result.result.content.includes('function')
        },
        {
          name: 'Code Review',
          task: 'Review this code: function add(a,b) { return a+b }',
          validate: (result) => result.success
        },
        {
          name: 'Debugging',
          task: 'Find the bug: function divide(a,b) { return a/b } // Sometimes returns Infinity',
          validate: (result) => result.success && result.result.content.toLowerCase().includes('zero')
        }
      ],
      experience: [
        {
          name: 'UI Design',
          task: 'Suggest improvements for a login form',
          validate: (result) => result.success
        },
        {
          name: 'UX Analysis',
          task: 'What makes a good user experience?',
          validate: (result) => result.success && result.result.content.length > 100
        }
      ],
      strategic: [
        {
          name: 'Business Analysis',
          task: 'What are key metrics for a SaaS business?',
          validate: (result) => result.success && result.result.content.includes('MRR')
        },
        {
          name: 'Strategy',
          task: 'How to increase user retention?',
          validate: (result) => result.success
        }
      ],
      default: [
        {
          name: 'General Task',
          task: 'Explain your primary expertise',
          validate: (result) => result.success
        }
      ]
    };
  }
  
  getPerformanceTestSuite() {
    return {
      simple: 'Hello, what can you do?',
      moderate: 'Generate a REST API endpoint',
      complex: 'Design a microservices architecture for an e-commerce platform'
    };
  }
  
  getIntegrationTestSuite() {
    return {
      withContext: {
        task: 'Improve this code',
        context: { code: 'function test() { return true; }' }
      },
      withRequirements: {
        task: 'Build a feature',
        context: { requirements: 'User authentication with JWT' }
      }
    };
  }
  
  /**
   * Batch validate multiple specialists
   */
  async validateSpecialists(specialists, options = {}) {
    const results = {
      total: specialists.length,
      passed: 0,
      failed: 0,
      specialists: []
    };
    
    for (const specialist of specialists) {
      const validation = await this.validateSpecialist(specialist, options);
      results.specialists.push(validation);
      
      if (validation.passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    }
    
    return results;
  }
  
  /**
   * Generate validation report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalValidations: this.testResults.size,
      results: Array.from(this.testResults.values()),
      summary: {
        passed: 0,
        failed: 0,
        averagePassRate: 0,
        averageDuration: 0
      }
    };
    
    for (const result of report.results) {
      if (result.passed) report.summary.passed++;
      else report.summary.failed++;
      
      report.summary.averagePassRate += result.metrics.passRate;
      report.summary.averageDuration += result.duration;
    }
    
    if (report.results.length > 0) {
      report.summary.averagePassRate /= report.results.length;
      report.summary.averageDuration /= report.results.length;
    }
    
    return report;
  }
  
  /**
   * Clear test results
   */
  clearResults() {
    this.testResults.clear();
    this.benchmarks.clear();
  }
}

// Export singleton
module.exports = new SpecialistValidator();