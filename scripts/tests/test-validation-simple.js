#!/usr/bin/env node

/**
 * Simple test for BUMBA Validation System components
 * Tests individual components without circular dependencies
 */

console.log('🧪 BUMBA Validation System - Simple Component Test');
console.log('==================================================\n');

let testCount = 0;
let passCount = 0;

function test(name, fn) {
  testCount++;
  try {
    fn();
    console.log(`🏁 ${name}`);
    passCount++;
  } catch (error) {
    console.log(`🔴 ${name}`);
    console.log(`   Error: ${error.message}`);
  }
}

// Test 1: Validation Protocol
test('Validation Protocol exists', () => {
  const fs = require('fs');
  const filePath = './src/core/validation/validation-protocol.js';
  if (!fs.existsSync(filePath)) {
    throw new Error('validation-protocol.js not found');
  }
  
  // Check file content
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('class ValidationResult')) {
    throw new Error('ValidationResult class not defined');
  }
  if (!content.includes('class RevisionRequest')) {
    throw new Error('RevisionRequest class not defined');
  }
});

// Test 2: Priority Queue
test('Claude Max Priority Queue exists', () => {
  const fs = require('fs');
  const filePath = './src/core/agents/claude-max-priority-queue.js';
  if (!fs.existsSync(filePath)) {
    throw new Error('claude-max-priority-queue.js not found');
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('class ClaudeMaxPriorityQueue')) {
    throw new Error('ClaudeMaxPriorityQueue class not defined');
  }
  if (!content.includes('VALIDATION: 5')) {
    throw new Error('VALIDATION priority not set to 5');
  }
});

// Test 3: Validation Metrics
test('Validation Metrics system exists', () => {
  const fs = require('fs');
  const filePath = './src/core/validation/validation-metrics.js';
  if (!fs.existsSync(filePath)) {
    throw new Error('validation-metrics.js not found');
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('class ValidationMetrics')) {
    throw new Error('ValidationMetrics class not defined');
  }
  if (!content.includes('recordValidation')) {
    throw new Error('recordValidation method not defined');
  }
});

// Test 4: Manager Validation Layer
test('Manager Validation Layer exists', () => {
  const fs = require('fs');
  const filePath = './src/core/departments/manager-validation-layer.js';
  if (!fs.existsSync(filePath)) {
    throw new Error('manager-validation-layer.js not found');
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('class ManagerValidationLayer')) {
    throw new Error('ManagerValidationLayer class not defined');
  }
  if (!content.includes('ensureClaudeMaxForValidation')) {
    throw new Error('Claude Max enforcement not implemented');
  }
});

// Test 5: Validated Backend Manager
test('Validated Backend Engineer Manager exists', () => {
  const fs = require('fs');
  const filePath = './src/core/departments/backend-engineer-manager-validated.js';
  if (!fs.existsSync(filePath)) {
    throw new Error('backend-engineer-manager-validated.js not found');
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('class ValidatedBackendEngineerManager')) {
    throw new Error('ValidatedBackendEngineerManager class not defined');
  }
  if (!content.includes('validateSpecialistWork')) {
    throw new Error('validateSpecialistWork method not defined');
  }
});

// Test 6: Validated Design Manager
test('Validated Design Engineer Manager exists', () => {
  const fs = require('fs');
  const filePath = './src/core/departments/design-engineer-manager-validated.js';
  if (!fs.existsSync(filePath)) {
    throw new Error('design-engineer-manager-validated.js not found');
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('class ValidatedDesignEngineerManager')) {
    throw new Error('ValidatedDesignEngineerManager class not defined');
  }
  if (!content.includes('validateDesignWork')) {
    throw new Error('Design validation methods not defined');
  }
});

// Test 7: Validated Product Manager
test('Validated Product Strategist Manager exists', () => {
  const fs = require('fs');
  const filePath = './src/core/departments/product-strategist-manager-validated.js';
  if (!fs.existsSync(filePath)) {
    throw new Error('product-strategist-manager-validated.js not found');
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('class ValidatedProductStrategistManager')) {
    throw new Error('ValidatedProductStrategistManager class not defined');
  }
  if (!content.includes('validateBusinessAspects')) {
    throw new Error('Business validation methods not defined');
  }
});

// Test 8: Revision System
test('Revision-capable specialists exist', () => {
  const fs = require('fs');
  const filePath = './src/core/specialists/revision-capable-specialist.js';
  if (!fs.existsSync(filePath)) {
    throw new Error('revision-capable-specialist.js not found');
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('class RevisionCapableSpecialist')) {
    throw new Error('RevisionCapableSpecialist class not defined');
  }
  if (!content.includes('maxRevisionAttempts = 3')) {
    throw new Error('Max revision attempts not set to 3');
  }
});

// Test 9: Design-specific validation
test('Design validation includes accessibility', () => {
  const fs = require('fs');
  const filePath = './src/core/departments/design-engineer-manager-validated.js';
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('validateAccessibility')) {
    throw new Error('Accessibility validation not implemented');
  }
  if (!content.includes('WCAG')) {
    throw new Error('WCAG compliance not checked');
  }
  if (!content.includes('colorContrast')) {
    throw new Error('Color contrast validation not implemented');
  }
});

// Test 10: Product-specific validation
test('Product validation includes business checks', () => {
  const fs = require('fs');
  const filePath = './src/core/departments/product-strategist-manager-validated.js';
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('assessBusinessValue')) {
    throw new Error('Business value assessment not implemented');
  }
  if (!content.includes('assessUserFocus')) {
    throw new Error('User focus assessment not implemented');
  }
  if (!content.includes('assessConsciousnessAlignment')) {
    throw new Error('Consciousness alignment not implemented');
  }
  if (!content.includes('Maya Chen')) {
    throw new Error('Maya Chen perspective not included');
  }
});

// Test 11: Priority levels
test('Priority queue has correct levels', () => {
  const fs = require('fs');
  const filePath = './src/core/agents/claude-max-priority-queue.js';
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('VALIDATION: 5')) {
    throw new Error('VALIDATION priority not 5');
  }
  if (!content.includes('EXECUTIVE: 4')) {
    throw new Error('EXECUTIVE priority not 4');
  }
  if (!content.includes('SPECIALIST: 1')) {
    throw new Error('SPECIALIST priority not 1');
  }
});

// Test 12: Metrics tracking
test('Metrics tracks key performance indicators', () => {
  const fs = require('fs');
  const filePath = './src/core/validation/validation-metrics.js';
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('totalValidations')) {
    throw new Error('Total validations not tracked');
  }
  if (!content.includes('approvalRate')) {
    throw new Error('Approval rate not calculated');
  }
  if (!content.includes('trustScore')) {
    throw new Error('Specialist trust score not tracked');
  }
  if (!content.includes('getHealthScore')) {
    throw new Error('Health score not calculated');
  }
});

// Test 13: Revision workflow
test('Revision workflow supports 3 attempts', () => {
  const fs = require('fs');
  const filePath = './src/core/departments/backend-engineer-manager-validated.js';
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('handleRevisionCycle')) {
    throw new Error('Revision cycle handler not implemented');
  }
  if (!content.includes('maxRevisions: 3')) {
    throw new Error('Max revisions not set to 3');
  }
});

// Test 14: Integration test file
test('Integration test file exists', () => {
  const fs = require('fs');
  const filePath = './tests/integration/validation-flow.test.js';
  if (!fs.existsSync(filePath)) {
    throw new Error('validation-flow.test.js not found');
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('BUMBA Validation Flow')) {
    throw new Error('Test suite not properly named');
  }
});

// Test 15: Summary documentation
test('Validation system documentation exists', () => {
  const fs = require('fs');
  const filePath = './VALIDATION_SYSTEM_SUMMARY.md';
  if (!fs.existsSync(filePath)) {
    throw new Error('VALIDATION_SYSTEM_SUMMARY.md not found');
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('Manager Validation System')) {
    throw new Error('Documentation incomplete');
  }
});

// Results
console.log('\n==================================================');
console.log('📊 Test Results');
console.log('==================================================');
console.log(`Total Tests: ${testCount}`);
console.log(`🏁 Passed: ${passCount}`);
console.log(`🔴 Failed: ${testCount - passCount}`);
console.log(`Success Rate: ${((passCount/testCount) * 100).toFixed(1)}%`);

if (passCount === testCount) {
  console.log('\n🏁 All validation system component tests PASSED!');
  console.log('All files exist and contain expected functionality.');
} else {
  console.log('\n🟠 Some component tests failed.');
}

process.exit(passCount === testCount ? 0 : 1);