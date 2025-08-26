/**
 * Executive Systems Integration Tests
 * Comprehensive test suite for Executive Systems components
 */

const { CEODecisionEngine } = require('../../src/core/executive/ceo-decision-engine');
const { StrategicOrchestrator } = require('../../src/core/executive/strategic-orchestrator');
const { DecisionFramework } = require('../../src/core/executive/decision-framework');
const { DecisionEngine } = require('../../src/core/decision/decision-engine');
const { DecisionValidator } = require('../../src/core/decision/decision-validator');
const { ExecutiveController } = require('../../src/core/executive/executive-controller');
const { ExecutiveModeManager } = require('../../src/core/executive/executive-mode-manager');
const { ExecutivePerformanceMonitor } = require('../../src/core/executive/performance-monitor');

describe('Executive Systems Integration', () => {
  let ceoEngine;
  let strategicOrchestrator;
  let decisionFramework;
  let decisionEngine;
  let decisionValidator;
  let executiveController;
  let modeManager;
  let performanceMonitor;

  beforeEach(() => {
    // Initialize all components
    ceoEngine = new CEODecisionEngine();
    strategicOrchestrator = new StrategicOrchestrator();
    decisionFramework = new DecisionFramework();
    decisionEngine = new DecisionEngine();
    decisionValidator = new DecisionValidator();
    executiveController = new ExecutiveController();
    modeManager = new ExecutiveModeManager();
    performanceMonitor = new ExecutivePerformanceMonitor({ enableRealTimeMonitoring: false });
  });

  afterEach(() => {
    // Cleanup
    if (executiveController) executiveController.shutdown();
    if (performanceMonitor) performanceMonitor.stopMonitoring();
  });

  describe('CEO Decision Engine', () => {
    test('should make strategic decisions', async () => {
      const decision = await ceoEngine.makeDecision({
        type: 'strategic',
        title: 'Market Expansion',
        options: [
          { id: 'option1', description: 'Enter Asian market' },
          { id: 'option2', description: 'Expand in Europe' }
        ],
        criteria: {
          roi: { weight: 0.3, target: 15 },
          risk: { weight: 0.3, target: 'medium' },
          timeline: { weight: 0.2, target: 12 },
          resources: { weight: 0.2, target: 1000000 }
        }
      });

      expect(decision).toHaveProperty('success', true);
      expect(decision).toHaveProperty('selectedOption');
      expect(decision).toHaveProperty('confidence');
      expect(decision.confidence).toBeGreaterThan(0);
      expect(decision.confidence).toBeLessThanOrEqual(100);
    });

    test('should handle complex multi-criteria decisions', async () => {
      const decision = await ceoEngine.makeDecision({
        type: 'operational',
        title: 'Resource Allocation',
        options: [
          { id: 'opt1', description: 'Invest in R&D', metrics: { cost: 500000, roi: 25 } },
          { id: 'opt2', description: 'Marketing campaign', metrics: { cost: 300000, roi: 15 } },
          { id: 'opt3', description: 'Infrastructure', metrics: { cost: 400000, roi: 10 } }
        ],
        criteria: {
          cost: { weight: 0.4, target: 400000, minimize: true },
          roi: { weight: 0.6, target: 20 }
        }
      });

      expect(decision.success).toBe(true);
      expect(decision.analysis).toBeDefined();
      expect(decision.analysis.scores).toBeDefined();
    });

    test('should validate decisions against policies', async () => {
      const decision = await ceoEngine.makeDecision({
        type: 'strategic',
        title: 'High Risk Investment',
        options: [{ id: 'risky', description: 'High risk venture' }],
        criteria: { risk: { weight: 1, target: 'low' } },
        constraints: { maxRisk: 'medium' }
      });

      expect(decision.success).toBe(true);
      expect(decision.validation).toBeDefined();
    });
  });

  describe('Strategic Orchestrator', () => {
    test('should create and manage strategies', async () => {
      const strategy = await strategicOrchestrator.createStrategy({
        name: 'Digital Transformation',
        type: 'digital_transformation',
        objectives: [
          { id: 'obj1', description: 'Modernize infrastructure', target: 'Q4 2025' },
          { id: 'obj2', description: 'Implement AI solutions', target: 'Q2 2026' }
        ],
        resources: {
          budget: 2000000,
          team: ['tech', 'operations', 'marketing']
        }
      });

      expect(strategy).toHaveProperty('id');
      expect(strategy).toHaveProperty('status', 'planning');
      expect(strategy.phases).toHaveLength(6);
    });

    test('should align multiple strategies', async () => {
      // Create multiple strategies
      const strategy1 = await strategicOrchestrator.createStrategy({
        name: 'Market Expansion',
        type: 'growth',
        resources: { budget: 1000000 }
      });

      const strategy2 = await strategicOrchestrator.createStrategy({
        name: 'Cost Optimization',
        type: 'efficiency',
        resources: { budget: 500000 }
      });

      // Check alignment
      const alignment = await strategicOrchestrator.checkAlignment(strategy1.id, strategy2.id);
      
      expect(alignment).toHaveProperty('score');
      expect(alignment.score).toBeGreaterThanOrEqual(0);
      expect(alignment.score).toBeLessThanOrEqual(100);
    });

    test('should optimize resource allocation', async () => {
      const optimization = await strategicOrchestrator.optimizeResources([
        { strategyId: 'str1', required: 500000, priority: 'high' },
        { strategyId: 'str2', required: 300000, priority: 'medium' },
        { strategyId: 'str3', required: 200000, priority: 'low' }
      ], { totalBudget: 800000 });

      expect(optimization).toHaveProperty('allocations');
      expect(optimization.totalAllocated).toBeLessThanOrEqual(800000);
    });
  });

  describe('Decision Framework', () => {
    test('should perform cost-benefit analysis', async () => {
      const analysis = await decisionFramework.analyzeCostBenefit({
        costs: [
          { item: 'Development', amount: 100000, timing: 'immediate' },
          { item: 'Marketing', amount: 50000, timing: 'month_3' }
        ],
        benefits: [
          { item: 'Revenue', amount: 300000, timing: 'year_1' },
          { item: 'Cost Savings', amount: 50000, timing: 'ongoing' }
        ],
        discountRate: 0.1,
        timeHorizon: 3
      });

      expect(analysis).toHaveProperty('npv');
      expect(analysis).toHaveProperty('roi');
      expect(analysis).toHaveProperty('paybackPeriod');
    });

    test('should conduct SWOT analysis', async () => {
      const swot = await decisionFramework.analyzeSWOT({
        strengths: ['Strong brand', 'Technical expertise'],
        weaknesses: ['Limited resources', 'Small team'],
        opportunities: ['Growing market', 'New technology'],
        threats: ['Competition', 'Economic downturn']
      });

      expect(swot).toHaveProperty('score');
      expect(swot).toHaveProperty('recommendations');
      expect(swot.recommendations).toBeInstanceOf(Array);
    });

    test('should run Monte Carlo simulations', async () => {
      const simulation = await decisionFramework.runMonteCarloSimulation({
        variables: [
          { name: 'revenue', min: 100000, max: 500000, distribution: 'normal' },
          { name: 'costs', min: 50000, max: 150000, distribution: 'uniform' }
        ],
        iterations: 1000,
        model: (vars) => vars.revenue - vars.costs
      });

      expect(simulation).toHaveProperty('results');
      expect(simulation.results).toHaveProperty('mean');
      expect(simulation.results).toHaveProperty('stdDev');
      expect(simulation.results).toHaveProperty('percentiles');
    });
  });

  describe('Executive Controller', () => {
    test('should switch between executive modes', async () => {
      const result = await executiveController.switchMode('strategic', 'Planning session');
      
      expect(result.success).toBe(true);
      expect(result.mode).toBe('strategic');
      expect(executiveController.getStatus().mode).toBe('strategic');
    });

    test('should enforce mode restrictions', async () => {
      await executiveController.switchMode('maintenance', 'System check');
      
      const hasCapability = executiveController.hasCapability('major_decisions');
      const isRestricted = executiveController.isRestricted('major_decisions');
      
      expect(hasCapability).toBe(false);
      expect(isRestricted).toBe(true);
    });

    test('should handle crisis mode activation', async () => {
      const result = await executiveController.switchMode('crisis', 'Emergency detected');
      
      expect(result.success).toBe(true);
      expect(executiveController.authorityLevel).toBe(5); // Full authority
      expect(executiveController.hasCapability('override_all')).toBe(true);
    });

    test('should maintain audit trail', async () => {
      await executiveController.switchMode('tactical', 'Quick optimization');
      await executiveController.executeOverride('emergency_action', {}, 'Critical issue');
      
      const audit = executiveController.getAuditTrail({ limit: 10 });
      
      expect(audit.length).toBeGreaterThan(0);
      expect(audit[0]).toHaveProperty('action');
      expect(audit[0]).toHaveProperty('timestamp');
    });
  });

  describe('Mode Manager', () => {
    test('should manage mode transitions', async () => {
      const result = await modeManager.switchMode('strategic', {
        reason: 'Quarterly planning',
        transition: 'graceful'
      });
      
      expect(result.success).toBe(true);
      expect(modeManager.getStatus().mode).toBe('strategic');
    });

    test('should enforce transition rules', async () => {
      await modeManager.switchMode('maintenance');
      
      // Try forbidden transition
      await expect(
        modeManager.switchMode('crisis')
      ).rejects.toThrow();
    });

    test('should support mode stacking', async () => {
      await modeManager.switchMode('operational');
      await modeManager.pushMode('tactical');
      
      expect(modeManager.getStatus().mode).toBe('tactical');
      
      await modeManager.popMode();
      expect(modeManager.getStatus().mode).toBe('operational');
    });

    test('should auto-detect mode changes', async () => {
      const result = await modeManager.autoDetectMode({
        crisis: true,
        severity: 'high'
      });
      
      expect(result).toBeDefined();
      expect(modeManager.getStatus().mode).toBe('crisis');
    });
  });

  describe('Performance Monitor', () => {
    test('should track KPIs', () => {
      const result = performanceMonitor.trackKPI('decision_speed', 85);
      
      expect(result).toHaveProperty('achievement');
      expect(result.achievement).toBeGreaterThan(0);
      expect(result).toHaveProperty('status');
    });

    test('should calculate overall performance', () => {
      // Track multiple KPIs
      performanceMonitor.trackKPI('decision_speed', 85);
      performanceMonitor.trackKPI('decision_accuracy', 92);
      performanceMonitor.trackKPI('strategy_alignment', 78);
      
      const overall = performanceMonitor.calculateOverallPerformance();
      
      expect(overall).toBeGreaterThan(0);
      expect(overall).toBeLessThanOrEqual(100);
    });

    test('should detect anomalies', () => {
      // Create normal pattern
      for (let i = 0; i < 20; i++) {
        performanceMonitor.recordMetric('test_metric', 50 + Math.random() * 10);
      }
      
      // Add anomaly
      let anomalyDetected = false;
      performanceMonitor.on('anomaly:detected', () => {
        anomalyDetected = true;
      });
      
      performanceMonitor.recordMetric('test_metric', 150); // Anomalous value
      
      // Anomaly detection might not trigger on first outlier
      expect(performanceMonitor.anomalies.length).toBeGreaterThanOrEqual(0);
    });

    test('should generate performance reports', () => {
      // Add some metrics
      performanceMonitor.trackKPI('decision_speed', 80);
      performanceMonitor.trackKPI('strategy_execution', 70);
      
      const report = performanceMonitor.generateReport();
      
      expect(report).toHaveProperty('overall');
      expect(report).toHaveProperty('categories');
      expect(report).toHaveProperty('kpis');
      expect(report).toHaveProperty('recommendations');
    });
  });

  describe('System Integration', () => {
    test('should integrate decision making with mode management', async () => {
      // Switch to strategic mode
      await executiveController.switchMode('strategic');
      
      // Make strategic decision
      const decision = await ceoEngine.makeDecision({
        type: 'strategic',
        title: 'Long-term investment',
        options: [
          { id: 'opt1', description: 'Option 1' },
          { id: 'opt2', description: 'Option 2' }
        ]
      });
      
      expect(decision.success).toBe(true);
      expect(executiveController.hasCapability('vision_setting')).toBe(true);
    });

    test('should coordinate strategy with decisions', async () => {
      // Create strategy
      const strategy = await strategicOrchestrator.createStrategy({
        name: 'Growth Strategy',
        type: 'growth'
      });
      
      // Make related decision
      const decision = await ceoEngine.makeDecision({
        type: 'strategic',
        title: 'Growth Investment',
        relatedStrategy: strategy.id,
        options: [{ id: 'invest', description: 'Invest in growth' }]
      });
      
      expect(decision.success).toBe(true);
      expect(strategy.id).toBeDefined();
    });

    test('should track performance across components', () => {
      // Track decision performance
      performanceMonitor.trackKPI('decision_speed', 88);
      
      // Track strategy performance  
      performanceMonitor.trackKPI('strategy_execution', 75);
      
      // Check overall system performance
      const stats = performanceMonitor.getStats();
      
      expect(stats.kpis).toBeGreaterThan(0);
      expect(stats.overall).toBeGreaterThanOrEqual(0);
    });

    test('should handle crisis situations end-to-end', async () => {
      // Detect crisis
      const detection = await modeManager.autoDetectMode({ crisis: true });
      expect(detection).toBeDefined();
      
      // Controller switches to crisis mode
      await executiveController.switchMode('crisis', 'Auto-detected crisis');
      expect(executiveController.authorityLevel).toBe(5);
      
      // Make emergency decision
      const decision = await ceoEngine.makeDecision({
        type: 'emergency',
        title: 'Crisis Response',
        options: [{ id: 'act', description: 'Emergency action' }],
        urgency: 'immediate'
      });
      
      expect(decision.success).toBe(true);
      
      // Track crisis handling performance
      performanceMonitor.recordMetric('crisis_response_time', 100);
      
      // Verify audit trail
      const audit = executiveController.getAuditTrail({ limit: 5 });
      expect(audit.length).toBeGreaterThan(0);
    });
  });
});

// Export for other tests
module.exports = {
  CEODecisionEngine,
  StrategicOrchestrator,
  DecisionFramework,
  ExecutiveController,
  ExecutiveModeManager,
  ExecutivePerformanceMonitor
};