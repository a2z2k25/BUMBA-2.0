/**
 * BUMBA 2.0 Validation Flow Integration Tests
 * Tests the complete validation workflow across all department managers
 */

const ValidatedBackendEngineerManager = require('../../src/core/departments/backend-engineer-manager-validated');
const ValidatedDesignEngineerManager = require('../../src/core/departments/design-engineer-manager-validated');
const ValidatedProductStrategistManager = require('../../src/core/departments/product-strategist-manager-validated');
const { getPriorityQueue } = require('../../src/core/agents/claude-max-priority-queue');
const { getValidationMetrics } = require('../../src/core/validation/validation-metrics');

describe('BUMBA Validation Flow', () => {
  let backendManager;
  let designManager;
  let productManager;
  let priorityQueue;
  let metrics;

  beforeEach(() => {
    // Reset singletons
    jest.clearAllMocks();
    
    // Initialize managers
    backendManager = new ValidatedBackendEngineerManager();
    designManager = new ValidatedDesignEngineerManager();
    productManager = new ValidatedProductStrategistManager();
    
    // Get singletons
    priorityQueue = getPriorityQueue();
    metrics = getValidationMetrics();
    
    // Reset metrics
    metrics.reset();
  });

  describe('Backend Engineer Manager Validation', () => {
    it('should validate technical work with Claude Max', async () => {
      const command = 'implement-api';
      const args = ['user authentication'];
      const context = { testing: true };
      
      // Mock specialist work
      const mockSpecialistWork = {
        type: 'technical_solution',
        code: 'const auth = () => { /* implementation */ }',
        tests: 'describe("auth", () => { /* tests */ })',
        documentation: '# Authentication API',
        specialist: 'backend-engineer'
      };
      
      // Spy on validation
      const validateSpy = jest.spyOn(backendManager, 'validateSpecialistWork');
      
      // Mock super.executeTask to return specialist work
      jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(backendManager)), 'executeTask')
        .mockResolvedValue(mockSpecialistWork);
      
      // Execute task
      const result = await backendManager.executeTask(command, args, context);
      
      // Verify validation was called
      expect(validateSpy).toHaveBeenCalled();
      
      // Check result structure
      expect(result).toHaveProperty('validation');
      expect(result.validation).toHaveProperty('status');
      expect(result.validation).toHaveProperty('validatedBy', 'Backend-Engineer');
    });

    it('should handle validation failure and request revision', async () => {
      const command = 'implement-api';
      const args = ['broken code'];
      const context = { testing: true };
      
      // Mock specialist work with issues
      const mockSpecialistWork = {
        type: 'technical_solution',
        code: 'const broken = () => { syntax error }', // Invalid code
        specialist: 'backend-engineer'
      };
      
      // Mock validation to fail
      jest.spyOn(backendManager.validationLayer, 'validateSpecialistWork')
        .mockResolvedValue({
          approved: false,
          requiresRevision: true,
          checks: {
            syntax: { passed: false, message: 'Syntax error detected' }
          },
          issues: [{
            type: 'syntax',
            severity: 'critical',
            message: 'Invalid JavaScript syntax'
          }],
          feedback: [{
            type: 'critical',
            message: 'Fix syntax errors'
          }]
        });
      
      // Mock revision
      const revisionSpy = jest.spyOn(backendManager, 'handleRevisionCycle');
      
      // Execute should trigger revision
      await backendManager.executeTask(command, args, context);
      
      expect(revisionSpy).toHaveBeenCalled();
    });
  });

  describe('Design Engineer Manager Validation', () => {
    it('should validate design work with UX checks', async () => {
      const command = 'design-component';
      const args = ['button'];
      const context = { testing: true };
      
      // Mock specialist work
      const mockSpecialistWork = {
        type: 'design_solution',
        component: '<Button onClick={handleClick}>Click me</Button>',
        styles: '.button { background: #007bff; color: white; }',
        specialist: 'ui-designer'
      };
      
      // Mock super.executeTask
      jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(designManager)), 'executeTask')
        .mockResolvedValue(mockSpecialistWork);
      
      // Spy on design validation
      const designValidateSpy = jest.spyOn(designManager, 'validateDesignAspects');
      
      // Execute task
      const result = await designManager.executeTask(command, args, context);
      
      // Verify design validation was called
      expect(designValidateSpy).toHaveBeenCalled();
      
      // Check for design-specific validation
      expect(result.validation).toBeDefined();
      if (result.validation.designChecks) {
        expect(result.validation.designChecks).toHaveProperty('accessibility');
        expect(result.validation.designChecks).toHaveProperty('colorContrast');
      }
    });

    it('should check accessibility compliance', async () => {
      const mockResult = {
        component: '<div>No accessible labels</div>',
        styles: '.text { color: #f0f0f0; background: #ffffff; }' // Poor contrast
      };
      
      const accessibilityCheck = await designManager.assessAccessibility(mockResult);
      
      expect(accessibilityCheck.wcagCompliant).toBe(false);
      expect(accessibilityCheck.issues).toContain('Missing semantic HTML');
      expect(accessibilityCheck.issues).toContain('No ARIA labels');
    });
  });

  describe('Product Strategist Manager Validation', () => {
    it('should validate business value and user focus', async () => {
      const command = 'create-prd';
      const args = ['new feature'];
      const context = { testing: true };
      
      // Mock specialist work
      const mockSpecialistWork = {
        type: 'prd',
        title: 'New Feature PRD',
        business_value: {
          roi_analysis: 'Expected 200% ROI',
          success_metrics: ['User adoption', 'Revenue increase']
        },
        user_stories: ['As a user, I want...'],
        specialist: 'product-manager'
      };
      
      // Mock super.executeTask
      jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(productManager)), 'executeTask')
        .mockResolvedValue(mockSpecialistWork);
      
      // Spy on business validation
      const businessValidateSpy = jest.spyOn(productManager, 'validateBusinessAspects');
      
      // Execute task
      const result = await productManager.executeTask(command, args, context);
      
      // Verify business validation was called
      expect(businessValidateSpy).toHaveBeenCalled();
      
      // Check for business metrics
      if (result.validation.businessChecks) {
        expect(result.validation.businessChecks).toHaveProperty('businessValue');
        expect(result.validation.businessChecks).toHaveProperty('userFocus');
      }
    });

    it('should enforce consciousness alignment (Maya Chen philosophy)', async () => {
      const mockResult = {
        type: 'strategy',
        // Missing consciousness elements
      };
      
      const consciousnessCheck = await productManager.assessConsciousnessAlignment(mockResult);
      
      expect(consciousnessCheck.aligned).toBe(false);
      expect(consciousnessCheck.violations).toContain('Missing ethical considerations');
      expect(consciousnessCheck.violations).toContain('No meaningful user outcomes');
    });
  });

  describe('Priority Queue System', () => {
    it('should prioritize validation requests over normal operations', async () => {
      // Add normal request
      const normalRequest = priorityQueue.requestAccess(
        'specialist-1',
        'specialist',
        1, // SPECIALIST priority
        {}
      );
      
      // Add validation request (should preempt)
      const validationRequest = priorityQueue.requestAccess(
        'manager-1',
        'manager-validation',
        5, // VALIDATION priority
        {}
      );
      
      // Validation should be granted first
      const validationResult = await validationRequest;
      expect(validationResult.granted).toBe(true);
      
      // Release validation
      priorityQueue.releaseAccess(validationResult.lockId);
      
      // Now normal request should proceed
      const normalResult = await normalRequest;
      expect(normalResult.granted).toBe(true);
    });

    it('should track queue metrics', () => {
      const metrics = priorityQueue.getMetrics();
      
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('grantedRequests');
      expect(metrics).toHaveProperty('preemptions');
      expect(metrics).toHaveProperty('averageWaitTime');
    });
  });

  describe('Validation Metrics', () => {
    it('should track validation performance', () => {
      // Record some validations
      metrics.recordValidation(
        {
          approved: true,
          validationTime: 500,
          checks: { syntax: { passed: true } },
          issues: []
        },
        'Backend-Engineer',
        'api-specialist'
      );
      
      metrics.recordValidation(
        {
          approved: false,
          validationTime: 300,
          checks: { syntax: { passed: false } },
          issues: [{ type: 'syntax', severity: 'high' }]
        },
        'Backend-Engineer',
        'database-specialist'
      );
      
      const snapshot = metrics.getSnapshot();
      
      expect(snapshot.global.totalValidations).toBe(2);
      expect(snapshot.global.totalApproved).toBe(1);
      expect(snapshot.global.totalRejected).toBe(1);
      expect(snapshot.global.approvalRate).toBe('50.0%');
    });

    it('should identify poor performing specialists', () => {
      // Record multiple failures for a specialist
      for (let i = 0; i < 5; i++) {
        metrics.recordValidation(
          {
            approved: false,
            checks: {},
            issues: [{ type: 'quality', severity: 'high' }]
          },
          'Backend-Engineer',
          'poor-specialist'
        );
      }
      
      const snapshot = metrics.getSnapshot();
      const worstSpecialists = snapshot.worstPerformingSpecialists;
      
      expect(worstSpecialists).toHaveLength(1);
      expect(worstSpecialists[0].id).toBe('poor-specialist');
      expect(worstSpecialists[0].approvalRate).toBe('0.0%');
    });

    it('should calculate health score', () => {
      // Record good performance
      for (let i = 0; i < 10; i++) {
        metrics.recordValidation(
          {
            approved: true,
            validationTime: 200,
            checks: { all: { passed: true } },
            issues: []
          },
          'Backend-Engineer',
          'specialist'
        );
      }
      
      const snapshot = metrics.getSnapshot();
      const health = snapshot.health;
      
      expect(health.score).toBeGreaterThanOrEqual(80);
      expect(health.status).toBe('healthy');
      expect(health.factors.approvalRate).toBe('🏁');
    });
  });

  describe('Revision Workflow', () => {
    it('should allow up to 3 revision attempts', async () => {
      let revisionCount = 0;
      
      // Mock validation to fail 2 times, then pass
      jest.spyOn(backendManager.validationLayer, 'validateSpecialistWork')
        .mockImplementation(() => {
          revisionCount++;
          return Promise.resolve({
            approved: revisionCount > 2,
            requiresRevision: revisionCount <= 2,
            checks: {},
            issues: revisionCount <= 2 ? [{ type: 'test', severity: 'medium' }] : [],
            feedback: revisionCount <= 2 ? [{ type: 'improvement', message: 'Try again' }] : [],
            isPassed: () => revisionCount > 2
          });
        });
      
      // Mock revision request
      jest.spyOn(backendManager.validationLayer, 'requestRevision')
        .mockResolvedValue({
          canRetry: () => true,
          attemptNumber: revisionCount,
          feedback: []
        });
      
      // Mock specialist revision
      jest.spyOn(backendManager, 'executeSpecialistRevision')
        .mockResolvedValue({
          type: 'revised_solution',
          specialist: 'backend-engineer'
        });
      
      const result = await backendManager.handleRevisionCycle(
        { specialist: 'backend-engineer' },
        { isPassed: () => false, feedback: [] },
        'test',
        [],
        {},
        'task-123'
      );
      
      expect(result.validation.status).toBe('approved_after_revision');
      expect(result.validation.revisionAttempts).toBe(2);
    });

    it('should reject after max revision attempts', async () => {
      // Mock validation to always fail
      jest.spyOn(backendManager.validationLayer, 'validateSpecialistWork')
        .mockResolvedValue({
          approved: false,
          requiresRevision: true,
          checks: {},
          issues: [{ type: 'unfixable', severity: 'critical' }],
          feedback: [{ type: 'critical', message: 'Cannot fix' }],
          isPassed: () => false
        });
      
      // Mock revision request
      let attemptCount = 0;
      jest.spyOn(backendManager.validationLayer, 'requestRevision')
        .mockImplementation(() => {
          attemptCount++;
          return Promise.resolve({
            canRetry: () => attemptCount <= 3,
            attemptNumber: attemptCount,
            feedback: []
          });
        });
      
      // Mock specialist revision
      jest.spyOn(backendManager, 'executeSpecialistRevision')
        .mockResolvedValue({
          type: 'revised_solution',
          specialist: 'backend-engineer'
        });
      
      const result = await backendManager.handleRevisionCycle(
        { specialist: 'backend-engineer' },
        { isPassed: () => false, feedback: [] },
        'test',
        [],
        {},
        'task-123'
      );
      
      expect(result.validation.status).toBe('rejected_final');
      expect(result.validation.revisionAttempts).toBe(3);
    });
  });
});

// Mock logger to reduce noise in tests
jest.mock('../../src/core/logging/bumba-logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));