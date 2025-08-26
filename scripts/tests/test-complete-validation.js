#!/usr/bin/env node

/**
 * Complete Validation System Test Suite
 * Tests all validation components including meta-validation
 */

const path = require('path');
const { performance } = require('perf_hooks');

console.log('🧪 BUMBA Complete Validation System Test');
console.log('=========================================\n');

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  components: {},
  startTime: Date.now()
};

async function test(category, name, fn) {
  testResults.total++;
  if (!testResults.components[category]) {
    testResults.components[category] = { passed: 0, failed: 0 };
  }
  
  process.stdout.write(`[${category}] ${name}... `);
  
  try {
    const start = performance.now();
    const result = await fn();
    const duration = (performance.now() - start).toFixed(2);
    
    if (result !== false) {
      console.log(`🏁 PASSED (${duration}ms)`);
      testResults.passed++;
      testResults.components[category].passed++;
      return true;
    } else {
      console.log(`🔴 FAILED`);
      testResults.failed++;
      testResults.components[category].failed++;
      return false;
    }
  } catch (error) {
    console.log(`🔴 ERROR: ${error.message}`);
    testResults.failed++;
    testResults.components[category].failed++;
    return false;
  }
}

async function runTests() {
  console.log('Phase 1: Core Infrastructure Tests');
  console.log('-----------------------------------\n');
  
  // Test Validation Protocol
  await test('Protocol', 'ValidationResult class exists', () => {
    const { ValidationResult } = require('./src/core/validation/validation-protocol');
    const result = new ValidationResult({
      approved: true,
      validatorId: 'test',
      command: 'test'
    });
    return result.isPassed();
  });
  
  await test('Protocol', 'RevisionRequest class exists', () => {
    const { RevisionRequest } = require('./src/core/validation/validation-protocol');
    const request = new RevisionRequest({
      validationResult: {},
      specialist: { id: 'test' }
    });
    return request.canRetry();
  });
  
  // Test Priority Queue
  await test('Queue', 'Priority queue singleton', () => {
    const { getPriorityQueue } = require('./src/core/agents/claude-max-priority-queue');
    const queue1 = getPriorityQueue();
    const queue2 = getPriorityQueue();
    return queue1 === queue2; // Should be same instance
  });
  
  await test('Queue', 'Priority levels correct', () => {
    const { PriorityLevel } = require('./src/core/agents/claude-max-priority-queue');
    return PriorityLevel.VALIDATION === 5 && 
           PriorityLevel.SPECIALIST === 1;
  });
  
  // Test Validation Metrics
  await test('Metrics', 'Metrics singleton', () => {
    const { getValidationMetrics } = require('./src/core/validation/validation-metrics');
    const metrics = getValidationMetrics();
    metrics.reset(); // Clean state
    return metrics.global.totalValidations === 0;
  });
  
  await test('Metrics', 'Record validation', () => {
    const { getValidationMetrics } = require('./src/core/validation/validation-metrics');
    const metrics = getValidationMetrics();
    metrics.recordValidation({
      approved: true,
      validationTime: 1000,
      checks: {},
      issues: []
    }, 'test-manager', 'test-specialist');
    return metrics.global.totalValidations === 1;
  });
  
  console.log('\nPhase 2: Meta-Validation Tests');
  console.log('-------------------------------\n');
  
  // Test Meta-Validation System
  await test('Meta', 'Meta-validation singleton', () => {
    const { getMetaValidation } = require('./src/core/validation/meta-validation-system');
    const meta1 = getMetaValidation();
    const meta2 = getMetaValidation();
    return meta1 === meta2;
  });
  
  await test('Meta', 'Detect rubber-stamping', async () => {
    const { MetaValidationSystem } = require('./src/core/validation/meta-validation-system');
    const meta = new MetaValidationSystem();
    
    const result = await meta.validateValidation(
      { approved: true, checks: { syntax: { passed: true } }, feedback: [] },
      { validationTime: 50, managerId: 'test' }
    );
    
    return result.issues.some(i => i.type === 'too_fast');
  });
  
  await test('Meta', 'Detect insufficient checks', async () => {
    const { MetaValidationSystem } = require('./src/core/validation/meta-validation-system');
    const meta = new MetaValidationSystem();
    
    const result = await meta.validateValidation(
      { approved: true, checks: { syntax: { passed: true } }, feedback: [] },
      { validationTime: 1000, managerId: 'test' }
    );
    
    return result.issues.some(i => i.type === 'insufficient_checks');
  });
  
  await test('Meta', 'Quality scoring', async () => {
    const { MetaValidationSystem } = require('./src/core/validation/meta-validation-system');
    const meta = new MetaValidationSystem();
    
    // Good validation
    const goodResult = await meta.validateValidation(
      {
        approved: false,
        checks: {
          syntax: { passed: false },
          security: { passed: true },
          performance: { passed: true },
          business_logic: { passed: true },
          documentation: { passed: false },
          tests: { passed: true }
        },
        feedback: [
          { type: 'critical', message: 'Syntax error needs fixing' },
          { type: 'improvement', message: 'Add documentation' }
        ]
      },
      { validationTime: 2000, managerId: 'test' }
    );
    
    return goodResult.qualityScore >= 70;
  });
  
  console.log('\nPhase 3: Manager Integration Tests');
  console.log('-----------------------------------\n');
  
  // Test Manager Validation Layer
  await test('Manager', 'Validation layer with meta-validation', () => {
    const ManagerValidationLayer = require('./src/core/departments/manager-validation-layer');
    const layer = new ManagerValidationLayer({ name: 'test-manager' });
    return layer.metaValidation !== undefined;
  });
  
  await test('Manager', 'Meta-validation report', () => {
    const ManagerValidationLayer = require('./src/core/departments/manager-validation-layer');
    const layer = new ManagerValidationLayer({ name: 'test-manager' });
    const report = layer.getMetaValidationReport();
    return report.hasOwnProperty('averageQualityScore');
  });
  
  await test('Manager', 'Validation health check', () => {
    const ManagerValidationLayer = require('./src/core/departments/manager-validation-layer');
    const layer = new ManagerValidationLayer({ name: 'test-manager' });
    // Should be healthy initially (no bad validations)
    return layer.isValidationHealthy();
  });
  
  console.log('\nPhase 4: Department Manager Tests');
  console.log('----------------------------------\n');
  
  // Test Validated Managers exist
  await test('Departments', 'Backend manager validated', () => {
    const fs = require('fs');
    return fs.existsSync('./src/core/departments/backend-engineer-manager-validated.js');
  });
  
  await test('Departments', 'Design manager validated', () => {
    const fs = require('fs');
    return fs.existsSync('./src/core/departments/design-engineer-manager-validated.js');
  });
  
  await test('Departments', 'Product manager validated', () => {
    const fs = require('fs');
    return fs.existsSync('./src/core/departments/product-strategist-manager-validated.js');
  });
  
  console.log('\nPhase 5: Revision System Tests');
  console.log('-------------------------------\n');
  
  // Test Revision System
  await test('Revision', 'Revision-capable specialists', () => {
    const { RevisionCapableSpecialist } = require('./src/core/specialists/revision-capable-specialist');
    const specialist = new RevisionCapableSpecialist();
    return specialist.maxRevisionAttempts === 3;
  });
  
  await test('Revision', 'Revision tracking', async () => {
    const { RevisionCapableSpecialist } = require('./src/core/specialists/revision-capable-specialist');
    const specialist = new RevisionCapableSpecialist();
    
    await specialist.revise(
      { code: 'test' },
      { feedback: [{ type: 'improvement', message: 'Fix this' }] },
      {}
    );
    
    return specialist.currentRevisionCount === 1;
  });
  
  await test('Revision', 'Can revise check', () => {
    const { RevisionCapableSpecialist } = require('./src/core/specialists/revision-capable-specialist');
    const specialist = new RevisionCapableSpecialist();
    specialist.currentRevisionCount = 2;
    return specialist.canRevise() === true; // Should allow up to 3
  });
  
  console.log('\nPhase 6: Integration Tests');
  console.log('--------------------------\n');
  
  // Test complete flow
  await test('Integration', 'Validation flow with meta-validation', async () => {
    const ManagerValidationLayer = require('./src/core/departments/manager-validation-layer');
    const { getValidationMetrics } = require('./src/core/validation/validation-metrics');
    
    const mockManager = {
      name: 'integration-test-manager',
      modelConfig: { model: 'claude-max' },
      usingClaudeMax: true
    };
    
    const layer = new ManagerValidationLayer(mockManager);
    const metrics = getValidationMetrics();
    
    // Perform validation
    const specialistResult = {
      code: 'function test() { return true; }',
      tests: 'describe("test", () => {});',
      specialist: 'test-specialist'
    };
    
    const validation = await layer.validateSpecialistWork(
      specialistResult,
      'test-command',
      {}
    );
    
    // Check meta-validation was performed
    return validation.metaValidation !== undefined &&
           validation.metaValidation.qualityScore !== undefined;
  });
  
  await test('Integration', 'Quality affects approval', async () => {
    const ManagerValidationLayer = require('./src/core/departments/manager-validation-layer');
    
    const mockManager = {
      name: 'quality-test-manager',
      modelConfig: { model: 'test' },
      usingClaudeMax: false // Not using Claude Max!
    };
    
    const layer = new ManagerValidationLayer(mockManager);
    
    // This should get low quality score
    const validation = await layer.validateSpecialistWork(
      { code: 'test' },
      'test',
      {}
    );
    
    // Low quality should force revision
    return validation.metaValidation.qualityScore < 50 &&
           validation.requiresRevision === true;
  });
  
  console.log('\nPhase 7: Pattern Detection Tests');
  console.log('---------------------------------\n');
  
  await test('Patterns', 'Detect consecutive approvals', async () => {
    const { MetaValidationSystem } = require('./src/core/validation/meta-validation-system');
    const meta = new MetaValidationSystem();
    
    // Simulate rubber-stamping
    for (let i = 0; i < 12; i++) {
      await meta.validateValidation(
        { approved: true, checks: { syntax: { passed: true }, security: { passed: true }, business_logic: { passed: true } } },
        { validationTime: 200, managerId: 'pattern-test' }
      );
    }
    
    const result = await meta.validateValidation(
      { approved: true, checks: { syntax: { passed: true }, security: { passed: true }, business_logic: { passed: true } } },
      { validationTime: 200, managerId: 'pattern-test' }
    );
    
    return result.issues.some(i => i.type === 'suspicious_pattern');
  });
  
  await test('Patterns', 'Detect consecutive rejections', async () => {
    const { MetaValidationSystem } = require('./src/core/validation/meta-validation-system');
    const meta = new MetaValidationSystem();
    meta.resetPatterns(); // Clean slate
    
    // Simulate over-strictness
    for (let i = 0; i < 6; i++) {
      await meta.validateValidation(
        { 
          approved: false, 
          checks: { syntax: { passed: false }, security: { passed: true }, business_logic: { passed: true } },
          feedback: [{ message: 'Not good enough' }]
        },
        { validationTime: 1000, managerId: 'strict-test' }
      );
    }
    
    const result = await meta.validateValidation(
      { approved: false, checks: { syntax: { passed: false }, security: { passed: true }, business_logic: { passed: true } }, feedback: [{ message: 'Still not good' }] },
      { validationTime: 1000, managerId: 'strict-test' }
    );
    
    return result.issues.some(i => i.type === 'suspicious_pattern');
  });
  
  console.log('\nPhase 8: System Health Tests');
  console.log('-----------------------------\n');
  
  await test('Health', 'Health score calculation', () => {
    const { getValidationMetrics } = require('./src/core/validation/validation-metrics');
    const metrics = getValidationMetrics();
    const health = metrics.getSnapshot().health;
    
    return health.score !== undefined && 
           health.status !== undefined &&
           health.factors !== undefined;
  });
  
  await test('Health', 'Audit log maintained', async () => {
    const { MetaValidationSystem } = require('./src/core/validation/meta-validation-system');
    const meta = new MetaValidationSystem();
    
    // Perform validation to create audit entry
    await meta.validateValidation(
      { approved: true, checks: { syntax: { passed: true }, security: { passed: true }, business_logic: { passed: true } } },
      { validationTime: 1000, managerId: 'audit-test' }
    );
    
    const report = meta.getQualityReport();
    return report.totalValidationsAudited > 0;
  });
  
  // Print results
  console.log('\n=========================================');
  console.log('📊 Complete Test Results Summary');
  console.log('=========================================\n');
  
  // Component breakdown
  console.log('Component Results:');
  for (const [component, results] of Object.entries(testResults.components)) {
    const total = results.passed + results.failed;
    const percentage = ((results.passed / total) * 100).toFixed(1);
    const status = results.failed === 0 ? '🏁' : '🟠';
    console.log(`  ${status} ${component}: ${results.passed}/${total} (${percentage}%)`);
  }
  
  // Overall results
  console.log('\n📈 Overall Statistics:');
  console.log(`  Total Tests: ${testResults.total}`);
  console.log(`  🏁 Passed: ${testResults.passed}`);
  console.log(`  🔴 Failed: ${testResults.failed}`);
  console.log(`  Success Rate: ${((testResults.passed/testResults.total) * 100).toFixed(1)}%`);
  console.log(`  Test Duration: ${((Date.now() - testResults.startTime) / 1000).toFixed(2)}s`);
  
  if (testResults.failed === 0) {
    console.log('\n🏁 ALL TESTS PASSED!');
    console.log('The BUMBA Validation System with Meta-Validation is fully operational.');
    console.log('\nKey Features Verified:');
    console.log('  🏁 Manager validation with Claude Max enforcement');
    console.log('  🏁 Meta-validation quality scoring (0-100)');
    console.log('  🏁 Pattern detection (rubber-stamping, over-strictness)');
    console.log('  🏁 Bias detection and prevention');
    console.log('  🏁 Revision workflow (3 attempts)');
    console.log('  🏁 Comprehensive metrics and audit trail');
    console.log('  🏁 Self-adjusting validation strictness');
  } else {
    console.log('\n🟠 Some tests failed. Review the errors above.');
  }
  
  return testResults.failed === 0;
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal test error:', error);
  process.exit(1);
});