#!/usr/bin/env node

/**
 * Test Meta-Validation System
 * Tests the validation of the validation process itself
 */

console.log('🔍 Testing Meta-Validation System');
console.log('==================================\n');

const { MetaValidationSystem } = require('./src/core/validation/meta-validation-system');

async function runTests() {
  const metaValidator = new MetaValidationSystem();
  let testsPassed = 0;
  let totalTests = 0;
  
  // Test 1: Detect too-fast validation (rubber-stamping)
  console.log('Test 1: Detecting rubber-stamp validation...');
  totalTests++;
  {
    const fastValidation = {
      approved: true,
      checks: {
        syntax: { passed: true },
        security: { passed: true }
      },
      feedback: []
    };
    
    const context = {
      validationTime: 50, // Too fast!
      managerId: 'test-manager',
      command: 'test'
    };
    
    const result = await metaValidator.validateValidation(fastValidation, context);
    
    if (result.issues.some(i => i.type === 'too_fast')) {
      console.log('  🏁 Correctly detected too-fast validation');
      testsPassed++;
    } else {
      console.log('  🔴 Failed to detect rubber-stamping');
    }
    
    console.log(`  Quality Score: ${result.qualityScore}/100`);
  }
  
  // Test 2: Detect insufficient checks
  console.log('\nTest 2: Detecting insufficient validation checks...');
  totalTests++;
  {
    const weakValidation = {
      approved: true,
      checks: {
        syntax: { passed: true }
        // Missing many required checks!
      },
      feedback: []
    };
    
    const context = {
      validationTime: 500,
      managerId: 'test-manager',
      command: 'test'
    };
    
    const result = await metaValidator.validateValidation(weakValidation, context);
    
    if (result.issues.some(i => i.type === 'insufficient_checks')) {
      console.log('  🏁 Correctly detected insufficient checks');
      testsPassed++;
    } else {
      console.log('  🔴 Failed to detect missing checks');
    }
    
    console.log(`  Quality Score: ${result.qualityScore}/100`);
  }
  
  // Test 3: Detect missing feedback on rejection
  console.log('\nTest 3: Detecting rejection without feedback...');
  totalTests++;
  {
    const rejectionNoFeedback = {
      approved: false,
      checks: {
        syntax: { passed: false },
        security: { passed: true }
      },
      feedback: [] // No feedback provided!
    };
    
    const context = {
      validationTime: 1000,
      managerId: 'test-manager',
      command: 'test'
    };
    
    const result = await metaValidator.validateValidation(rejectionNoFeedback, context);
    
    if (result.issues.some(i => i.type === 'insufficient_feedback')) {
      console.log('  🏁 Correctly detected missing feedback');
      testsPassed++;
    } else {
      console.log('  🔴 Failed to detect missing feedback');
    }
    
    console.log(`  Quality Score: ${result.qualityScore}/100`);
  }
  
  // Test 4: Good validation should pass
  console.log('\nTest 4: Testing proper validation...');
  totalTests++;
  {
    const goodValidation = {
      approved: false,
      checks: {
        syntax: { passed: false, message: 'Syntax error on line 5' },
        security: { passed: true, message: 'No security issues' },
        performance: { passed: true, message: 'Performance acceptable' },
        business_logic: { passed: true, message: 'Logic correct' },
        documentation: { passed: false, message: 'Missing documentation' },
        error_handling: { passed: true, message: 'Error handling present' }
      },
      feedback: [
        { type: 'critical', message: 'Fix syntax error on line 5: missing semicolon' },
        { type: 'improvement', message: 'Add JSDoc comments for public methods' }
      ]
    };
    
    const context = {
      validationTime: 2500,
      managerId: 'test-manager',
      specialistId: 'test-specialist',
      command: 'implement-feature'
    };
    
    const result = await metaValidator.validateValidation(goodValidation, context);
    
    if (result.qualityScore >= 70) {
      console.log('  🏁 Good validation scored well');
      testsPassed++;
    } else {
      console.log('  🔴 Good validation scored too low');
    }
    
    console.log(`  Quality Score: ${result.qualityScore}/100`);
    console.log(`  Recommendation: ${result.recommendation}`);
  }
  
  // Test 5: Detect consecutive approvals pattern
  console.log('\nTest 5: Detecting rubber-stamp patterns...');
  totalTests++;
  {
    // Simulate 15 consecutive approvals
    for (let i = 0; i < 15; i++) {
      const approval = {
        approved: true,
        checks: {
          syntax: { passed: true },
          security: { passed: true },
          business_logic: { passed: true }
        },
        feedback: []
      };
      
      const context = {
        validationTime: 200,
        managerId: 'test-manager',
        command: `test-${i}`
      };
      
      await metaValidator.validateValidation(approval, context);
    }
    
    // The next validation should detect the pattern
    const result = await metaValidator.validateValidation(
      {
        approved: true,
        checks: { syntax: { passed: true }, security: { passed: true }, business_logic: { passed: true } },
        feedback: []
      },
      { validationTime: 200, managerId: 'test-manager', command: 'test-final' }
    );
    
    if (result.issues.some(i => i.type === 'suspicious_pattern')) {
      console.log('  🏁 Correctly detected rubber-stamping pattern');
      testsPassed++;
    } else {
      console.log('  🔴 Failed to detect pattern');
    }
  }
  
  // Test 6: Quality report generation
  console.log('\nTest 6: Testing quality report generation...');
  totalTests++;
  {
    const report = metaValidator.getQualityReport();
    
    if (report.averageQualityScore && report.totalValidationsAudited > 0) {
      console.log('  🏁 Quality report generated successfully');
      console.log(`  Average Quality: ${report.averageQualityScore}/100`);
      console.log(`  Total Audited: ${report.totalValidationsAudited}`);
      console.log(`  Recommendation: ${report.recommendation}`);
      
      if (report.commonIssues.length > 0) {
        console.log('  Common Issues:');
        report.commonIssues.forEach(issue => {
          console.log(`    - ${issue.type}: ${issue.count} occurrences`);
        });
      }
      
      testsPassed++;
    } else {
      console.log('  🔴 Quality report incomplete');
    }
  }
  
  // Summary
  console.log('\n==================================');
  console.log('Meta-Validation Test Results');
  console.log('==================================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${totalTests - testsPassed}`);
  console.log(`Success Rate: ${((testsPassed/totalTests) * 100).toFixed(1)}%`);
  
  if (testsPassed === totalTests) {
    console.log('\n🏁 All meta-validation tests PASSED!');
    console.log('The validation layer can now validate itself.');
  }
}

// Run tests
runTests().catch(console.error);