#!/usr/bin/env node

/**
 * Test script for BUMBA Validation System
 * Tests all components of the manager validation infrastructure
 */

const path = require('path');
const { performance } = require('perf_hooks');

// Add src to module paths
require('module').Module._nodeModulePaths = function(from) {
  const paths = require('module').Module._nodeModulePaths.call(this, from);
  paths.push(path.resolve(__dirname, 'src'));
  return paths;
};

console.log('🧪 BUMBA Validation System Test Suite');
console.log('=====================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function test(name, fn) {
  totalTests++;
  process.stdout.write(`Testing: ${name}... `);
  
  try {
    const start = performance.now();
    await fn();
    const duration = (performance.now() - start).toFixed(2);
    console.log(`🏁 PASSED (${duration}ms)`);
    passedTests++;
    return true;
  } catch (error) {
    console.log(`🔴 FAILED`);
    console.log(`  Error: ${error.message}`);
    failedTests++;
    return false;
  }
}

async function runTests() {
  // Test 1: Validation Protocol
  await test('Validation Protocol classes exist', async () => {
    const { ValidationProtocol, ValidationResult, RevisionRequest } = require('./src/core/validation/validation-protocol');
    
    if (!ValidationResult) throw new Error('ValidationResult class not found');
    if (!RevisionRequest) throw new Error('RevisionRequest class not found');
    
    // Create instances
    const result = new ValidationResult({
      approved: true,
      validatorId: 'test-manager',
      command: 'test-command'
    });
    
    if (!result.isPassed()) throw new Error('ValidationResult.isPassed() failed');
  });

  // Test 2: Priority Queue System
  await test('Claude Max Priority Queue functionality', async () => {
    const { getPriorityQueue, PriorityLevel } = require('./src/core/agents/claude-max-priority-queue');
    
    const queue = getPriorityQueue();
    if (!queue) throw new Error('Priority queue singleton not created');
    
    // Test priority levels
    if (PriorityLevel.VALIDATION !== 5) throw new Error('VALIDATION priority should be 5');
    if (PriorityLevel.SPECIALIST !== 1) throw new Error('SPECIALIST priority should be 1');
    
    // Test queue status
    const status = queue.getStatus();
    if (!status.hasOwnProperty('isAvailable')) throw new Error('Queue status missing isAvailable');
  });

  // Test 3: Validation Metrics
  await test('Validation Metrics tracking', async () => {
    const { getValidationMetrics } = require('./src/core/validation/validation-metrics');
    
    const metrics = getValidationMetrics();
    if (!metrics) throw new Error('Metrics singleton not created');
    
    // Reset and test
    metrics.reset();
    
    // Record a validation
    metrics.recordValidation({
      approved: true,
      validationTime: 250,
      checks: { syntax: { passed: true } },
      issues: []
    }, 'test-manager', 'test-specialist');
    
    const snapshot = metrics.getSnapshot();
    if (snapshot.global.totalValidations !== 1) throw new Error('Validation not recorded');
    if (snapshot.global.totalApproved !== 1) throw new Error('Approval not recorded');
  });

  // Test 4: Manager Validation Layer
  await test('Manager Validation Layer initialization', async () => {
    const ManagerValidationLayer = require('./src/core/departments/manager-validation-layer');
    
    const mockManager = { name: 'Test-Manager' };
    const layer = new ManagerValidationLayer(mockManager);
    
    if (!layer) throw new Error('Validation layer not created');
    if (!layer.validationChecks) throw new Error('Validation checks not initialized');
    if (Object.keys(layer.validationChecks).length < 10) {
      throw new Error('Expected at least 10 validation check types');
    }
  });

  // Test 5: Backend Manager Validation
  await test('Backend Engineer Manager with validation', async () => {
    const ValidatedBackendEngineerManager = require('./src/core/departments/backend-engineer-manager-validated');
    
    const manager = new ValidatedBackendEngineerManager();
    if (!manager) throw new Error('Backend manager not created');
    if (!manager.validationLayer) throw new Error('Validation layer not initialized');
    if (!manager.validationConfig.enabled) throw new Error('Validation not enabled');
  });

  // Test 6: Design Manager Validation
  await test('Design Engineer Manager with validation', async () => {
    const ValidatedDesignEngineerManager = require('./src/core/departments/design-engineer-manager-validated');
    
    const manager = new ValidatedDesignEngineerManager();
    if (!manager) throw new Error('Design manager not created');
    if (!manager.designValidators) throw new Error('Design validators not initialized');
    if (!manager.validationConfig.validateAccessibility) throw new Error('Accessibility validation not enabled');
  });

  // Test 7: Product Manager Validation
  await test('Product Strategist Manager with validation', async () => {
    const ValidatedProductStrategistManager = require('./src/core/departments/product-strategist-manager-validated');
    
    const manager = new ValidatedProductStrategistManager();
    if (!manager) throw new Error('Product manager not created');
    if (!manager.productValidationChecks) throw new Error('Product validation checks not initialized');
    if (!manager.productValidationChecks.consciousness_alignment) {
      throw new Error('Consciousness alignment check not enabled');
    }
  });

  // Test 8: Revision System
  await test('Revision-capable specialist classes', async () => {
    const {
      RevisionCapableSpecialist,
      RevisionCapableTechnicalSpecialist,
      RevisionCapableDesignSpecialist,
      RevisionCapableBusinessSpecialist
    } = require('./src/core/specialists/revision-capable-specialist');
    
    // Test base class
    const base = new RevisionCapableSpecialist();
    if (!base.canRevise()) throw new Error('Base specialist cannot revise');
    if (base.maxRevisionAttempts !== 3) throw new Error('Max revisions should be 3');
    
    // Test technical specialist
    const technical = new RevisionCapableTechnicalSpecialist();
    const feedback = [{ type: 'critical', message: 'Fix syntax errors' }];
    const analysis = technical.analyzeFeedback(feedback);
    if (analysis.criticalIssues.length !== 1) throw new Error('Critical issue not identified');
    
    // Test design specialist
    const design = new RevisionCapableDesignSpecialist();
    let work = { component: '<button>Click</button>' };
    work = design.improveAccessibility(work);
    if (!work.accessibility.ariaLabels) throw new Error('Accessibility not improved');
    
    // Test business specialist
    const business = new RevisionCapableBusinessSpecialist();
    work = {};
    work = business.addBusinessJustification(work);
    if (!work.business_value.roi_analysis) throw new Error('ROI analysis not added');
  });

  // Test 9: Priority Queue Preemption
  await test('Priority queue preemption logic', async () => {
    const { getPriorityQueue, PriorityLevel } = require('./src/core/agents/claude-max-priority-queue');
    const queue = getPriorityQueue();
    
    // Reset queue
    queue.emergencyReleaseAll();
    
    // Test that validation can preempt lower priority
    const entry = {
      priority: PriorityLevel.VALIDATION,
      requesterId: 'manager-validation'
    };
    
    const canPreempt = queue.canPreempt(entry);
    // Should be able to preempt when nothing is held
    if (canPreempt) throw new Error('Should not preempt when queue is empty');
  });

  // Test 10: Metrics Health Score
  await test('Validation metrics health calculation', async () => {
    const { getValidationMetrics } = require('./src/core/validation/validation-metrics');
    const metrics = getValidationMetrics();
    
    metrics.reset();
    
    // Add good validations
    for (let i = 0; i < 5; i++) {
      metrics.recordValidation({
        approved: true,
        validationTime: 200,
        checks: { all: { passed: true } },
        issues: []
      }, 'manager', 'specialist');
    }
    
    const health = metrics.getSnapshot().health;
    if (health.score < 80) throw new Error(`Health score too low: ${health.score}`);
    if (health.status !== 'healthy') throw new Error(`Health status should be healthy: ${health.status}`);
  });

  // Test 11: Validation Configuration
  await test('Manager validation configuration', async () => {
    const ValidatedBackendEngineerManager = require('./src/core/departments/backend-engineer-manager-validated');
    const manager = new ValidatedBackendEngineerManager();
    
    // Test configuration
    if (manager.validationConfig.maxRevisions !== 3) {
      throw new Error('Max revisions should be 3');
    }
    if (!manager.validationConfig.requireClaudeMax) {
      throw new Error('Claude Max should be required');
    }
    
    // Test enable/disable
    manager.setValidationEnabled(false);
    if (manager.validationConfig.enabled) {
      throw new Error('Validation should be disabled');
    }
    
    manager.setValidationEnabled(true);
    if (!manager.validationConfig.enabled) {
      throw new Error('Validation should be enabled');
    }
  });

  // Test 12: Department-specific validation checks
  await test('Department-specific validation features', async () => {
    const ValidatedDesignEngineerManager = require('./src/core/departments/design-engineer-manager-validated');
    const manager = new ValidatedDesignEngineerManager();
    
    // Test accessibility assessment
    const accessibilityCheck = await manager.assessAccessibility({
      component: '<div>Test</div>',
      styles: '.test { color: #333; }'
    });
    
    if (typeof accessibilityCheck.wcagCompliant !== 'boolean') {
      throw new Error('WCAG compliance check failed');
    }
    
    // Test color contrast
    const contrastCheck = await manager.assessColorContrast({
      styles: '.text { color: #767676; background: #ffffff; }'
    });
    
    if (!contrastCheck.hasOwnProperty('meetsWCAG_AA')) {
      throw new Error('Color contrast check missing WCAG AA');
    }
  });

  // Test 13: Business validation checks
  await test('Business-specific validation features', async () => {
    const ValidatedProductStrategistManager = require('./src/core/departments/product-strategist-manager-validated');
    const manager = new ValidatedProductStrategistManager();
    
    // Test business value assessment
    const businessValue = await manager.assessBusinessValue({
      roi_analysis: 'Expected 200% ROI',
      success_metrics: ['Growth', 'Retention']
    });
    
    if (typeof businessValue.score !== 'number') {
      throw new Error('Business value score not calculated');
    }
    
    // Test consciousness alignment (Maya Chen philosophy)
    const consciousness = await manager.assessConsciousnessAlignment({
      ethical_development: true,
      sustainable_practices: true
    });
    
    if (typeof consciousness.aligned !== 'boolean') {
      throw new Error('Consciousness alignment check failed');
    }
  });

  // Test 14: Revision workflow
  await test('Specialist revision workflow', async () => {
    const { RevisionCapableTechnicalSpecialist } = require('./src/core/specialists/revision-capable-specialist');
    const specialist = new RevisionCapableTechnicalSpecialist();
    
    const originalWork = {
      code: 'function test() { syntax error }',
      type: 'technical_solution'
    };
    
    const revisionRequest = {
      feedback: [
        { type: 'critical', message: 'Fix syntax errors' },
        { type: 'improvement', message: 'Add error handling' }
      ]
    };
    
    const revised = await specialist.revise(originalWork, revisionRequest, {});
    
    if (!revised.syntaxFixed) throw new Error('Syntax not marked as fixed');
    if (!revised.errorHandling) throw new Error('Error handling not added');
    if (!revised.revisionMetadata) throw new Error('Revision metadata not added');
  });

  // Test 15: Integration test - Full validation flow
  await test('Full validation flow integration', async () => {
    const ValidatedBackendEngineerManager = require('./src/core/departments/backend-engineer-manager-validated');
    const manager = new ValidatedBackendEngineerManager();
    
    // Check all components are connected
    if (!manager.validationLayer) throw new Error('Validation layer missing');
    if (!manager.priorityQueue) throw new Error('Priority queue missing');
    if (!manager.validationMetrics) throw new Error('Metrics missing');
    
    // Test confidence calculation
    const confidence = manager.calculateConfidence({
      checks: { syntax: { passed: true }, security: { passed: false } },
      issues: [{ severity: 'high' }]
    });
    
    if (confidence > 1 || confidence < 0) {
      throw new Error(`Invalid confidence score: ${confidence}`);
    }
  });

  console.log('\n=====================================');
  console.log('📊 Test Results Summary');
  console.log('=====================================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`🏁 Passed: ${passedTests}`);
  console.log(`🔴 Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log('\n🏁 All validation system tests PASSED!');
    console.log('The BUMBA Manager Validation System is working correctly.');
  } else {
    console.log('\n🟠 Some tests failed. Please review the errors above.');
  }
  
  return failedTests === 0;
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});