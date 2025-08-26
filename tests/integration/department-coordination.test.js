/**
 * Department Coordination Integration Tests
 * Tests inter-department communication and collaboration
 */

const { ProductStrategistManager } = require('../../src/core/departments/product-strategist-manager');
const { DesignEngineerManager } = require('../../src/core/departments/design-engineer-manager');
const { BackendEngineerManager } = require('../../src/core/departments/backend-engineer-manager');
const { UnifiedRoutingSystem } = require('../../src/core/unified-routing-system');
const EventEmitter = require('events');

// Mock dependencies
jest.mock('../../src/core/logging/bumba-logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

jest.mock('fs');
jest.mock('child_process');

describe('Department Coordination Integration', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  let productManager, designManager, backendManager;
  let router;
  let coordinationBus;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create coordination event bus
    coordinationBus = new EventEmitter();
    
    // Initialize departments
    productManager = new ProductStrategistManager();
    designManager = new DesignEngineerManager();
    backendManager = new BackendEngineerManager();
    
    // Initialize router
    router = UnifiedRoutingSystem.getInstance();
    router.registerDepartment('strategic', productManager);
    router.registerDepartment('experience', designManager);
    router.registerDepartment('technical', backendManager);
    
    // Wire up coordination
    [productManager, designManager, backendManager].forEach(dept => {
      dept.coordinationBus = coordinationBus;
    });
  });
  
  describe('Requirements to Design Handoff', () => {
    test('should transfer requirements context to design department', async () => {
      const requirements = {
        feature: 'user dashboard',
        userStories: [
          'As a user, I want to see my activity summary',
          'As a user, I want to customize my dashboard layout'
        ],
        constraints: ['mobile-responsive', 'accessible']
      };
      
      // Product creates requirements
      const strategyTask = {
        type: 'requirements',
        payload: requirements
      };
      
      const strategyResult = await productManager.execute(strategyTask, {
        agent: 'product-strategist',
        confidence: 0.95
      });
      
      expect(strategyResult.success).toBe(true);
      
      // Design receives requirements
      let designContext;
      coordinationBus.on('handoff:requirements-to-design', (context) => {
        designContext = context;
      });
      
      // Trigger handoff
      coordinationBus.emit('handoff:requirements-to-design', {
        requirements: strategyResult.result,
        metadata: { priority: 'high' }
      });
      
      expect(designContext).toBeDefined();
      expect(designContext.requirements).toEqual(strategyResult.result);
    });
    
    test('should validate requirements completeness before handoff', async () => {
      const incompleteRequirements = {
        feature: 'incomplete feature'
        // Missing user stories and acceptance criteria
      };
      
      const task = {
        type: 'requirements',
        payload: incompleteRequirements
      };
      
      const result = await productManager.execute(task, {
        agent: 'product-strategist',
        confidence: 0.9
      });
      
      // Should identify missing elements
      expect(result.success).toBe(true);
      expect(result.result.validation).toBeDefined();
      expect(result.result.validation.complete).toBe(false);
      expect(result.result.validation.missing).toContain('userStories');
    });
  });
  
  describe('Design to Backend Handoff', () => {
    test('should transfer design specs to backend implementation', async () => {
      const designSpecs = {
        components: ['UserCard', 'ActivityChart', 'SettingsPanel'],
        apiRequirements: [
          { endpoint: '/api/user/activity', method: 'GET' },
          { endpoint: '/api/user/preferences', method: 'GET/PUT' }
        ],
        performanceTargets: {
          initialLoad: '<2s',
          interactionLatency: '<100ms'
        }
      };
      
      // Design creates specifications
      const designTask = {
        type: 'design',
        payload: designSpecs
      };
      
      const designResult = await designManager.execute(designTask, {
        agent: 'design-engineer',
        confidence: 0.92
      });
      
      expect(designResult.success).toBe(true);
      
      // Backend receives specifications
      let backendContext;
      coordinationBus.on('handoff:design-to-backend', (context) => {
        backendContext = context;
      });
      
      coordinationBus.emit('handoff:design-to-backend', {
        designSpecs: designResult.result,
        apiRequirements: designSpecs.apiRequirements
      });
      
      expect(backendContext).toBeDefined();
      expect(backendContext.apiRequirements).toHaveLength(2);
    });
  });
  
  describe('Cross-Department Validation', () => {
    test('should validate technical feasibility with backend before design approval', async () => {
      const proposedDesign = {
        feature: 'real-time collaboration',
        requirements: {
          latency: '<50ms',
          concurrentUsers: 10000,
          dataSync: 'real-time'
        }
      };
      
      // Design proposes feature
      coordinationBus.emit('validation:technical-feasibility', proposedDesign);
      
      // Backend validates
      const feasibilityCheck = await backendManager.validateFeasibility(proposedDesign);
      
      expect(feasibilityCheck).toBeDefined();
      expect(feasibilityCheck.feasible).toBeDefined();
      expect(feasibilityCheck.recommendations).toBeDefined();
      
      if (!feasibilityCheck.feasible) {
        expect(feasibilityCheck.alternatives).toBeDefined();
      }
    });
    
    test('should validate business impact before technical implementation', async () => {
      const technicalProposal = {
        architecture: 'microservices',
        estimatedCost: 50000,
        timelineWeeks: 12,
        requiredResources: ['2 backend devs', '1 DevOps', '1 DBA']
      };
      
      // Backend proposes architecture
      coordinationBus.emit('validation:business-impact', technicalProposal);
      
      // Product validates business case
      const businessValidation = await productManager.validateBusinessCase(technicalProposal);
      
      expect(businessValidation).toBeDefined();
      expect(businessValidation.approved).toBeDefined();
      expect(businessValidation.roi).toBeDefined();
    });
  });
  
  describe('Three-Way Coordination', () => {
    test('should coordinate all departments for complex feature', async () => {
      const complexFeature = {
        name: 'AI-powered analytics dashboard',
        scope: 'enterprise'
      };
      
      const coordinationResults = {
        product: null,
        design: null,
        backend: null
      };
      
      // Set up listeners
      coordinationBus.on('coordination:product-complete', (result) => {
        coordinationResults.product = result;
      });
      
      coordinationBus.on('coordination:design-complete', (result) => {
        coordinationResults.design = result;
      });
      
      coordinationBus.on('coordination:backend-complete', (result) => {
        coordinationResults.backend = result;
      });
      
      // Initiate three-way coordination
      coordinationBus.emit('coordination:initiate', complexFeature);
      
      // Simulate department responses
      await productManager.handleCoordination(complexFeature);
      await designManager.handleCoordination(complexFeature);
      await backendManager.handleCoordination(complexFeature);
      
      // All departments should have responded
      expect(coordinationResults.product).toBeDefined();
      expect(coordinationResults.design).toBeDefined();
      expect(coordinationResults.backend).toBeDefined();
      
      // Verify coordination success
      const allSuccessful = Object.values(coordinationResults)
        .every(result => result && result.success);
      expect(allSuccessful).toBe(true);
    });
  });
  
  describe('Conflict Resolution', () => {
    test('should resolve conflicts between departments', async () => {
      const conflict = {
        type: 'resource-constraint',
        departments: ['design', 'backend'],
        issue: 'Competing for same developer resources',
        proposals: {
          design: { timeline: '2 weeks', priority: 'high' },
          backend: { timeline: '3 weeks', priority: 'critical' }
        }
      };
      
      // Emit conflict
      coordinationBus.emit('conflict:detected', conflict);
      
      // Product manager acts as arbiter
      const resolution = await productManager.resolveConflict(conflict);
      
      expect(resolution).toBeDefined();
      expect(resolution.decision).toBeDefined();
      expect(resolution.rationale).toBeDefined();
      expect(resolution.adjustedTimelines).toBeDefined();
    });
  });
  
  describe('Knowledge Sharing', () => {
    test('should share learnings across departments', async () => {
      const learning = {
        department: 'backend',
        type: 'performance-optimization',
        discovery: 'Caching strategy reduced latency by 60%',
        applicability: ['all-departments']
      };
      
      const departmentLearnings = {
        product: [],
        design: [],
        backend: []
      };
      
      // Set up learning collectors
      coordinationBus.on('learning:shared', (data) => {
        departmentLearnings.product.push(data);
        departmentLearnings.design.push(data);
        departmentLearnings.backend.push(data);
      });
      
      // Share learning
      coordinationBus.emit('learning:shared', learning);
      
      // All departments should receive the learning
      expect(departmentLearnings.product).toHaveLength(1);
      expect(departmentLearnings.design).toHaveLength(1);
      expect(departmentLearnings.backend).toHaveLength(1);
    });
  });
  
  describe('Quality Gates', () => {
    test('should enforce quality gates at department boundaries', async () => {
      const handoff = {
        from: 'design',
        to: 'backend',
        artifact: {
          type: 'design-system',
          components: 50,
          documentation: 'incomplete'
        }
      };
      
      // Check quality gate
      const qualityCheck = await router.validateHandoff(handoff);
      
      expect(qualityCheck.passed).toBe(false);
      expect(qualityCheck.issues).toContain('documentation');
      expect(qualityCheck.requirements).toBeDefined();
    });
  });
  
  describe('Performance Monitoring', () => {
    test('should track coordination performance metrics', async () => {
      const metrics = {
        handoffTimes: [],
        validationTimes: [],
        conflictResolutionTimes: []
      };
      
      // Monitor handoff performance
      coordinationBus.on('metrics:handoff', (data) => {
        metrics.handoffTimes.push(data.duration);
      });
      
      // Simulate multiple handoffs
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        coordinationBus.emit('handoff:requirements-to-design', { id: i });
        const duration = Date.now() - start;
        coordinationBus.emit('metrics:handoff', { duration });
      }
      
      // Analyze metrics
      expect(metrics.handoffTimes).toHaveLength(5);
      const avgHandoffTime = metrics.handoffTimes.reduce((a, b) => a + b) / 5;
      expect(avgHandoffTime).toBeLessThan(100); // Should be fast
    });
  });
});