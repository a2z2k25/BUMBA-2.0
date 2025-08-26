/**
 * Unit tests for Sage Decision Engine
 */

const { sageDecisionEngine } = require('../../../src/core/consciousness/sage-decision-engine');

describe('Sage Decision Engine', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('Decision Making', () => {
    test('should make decisions based on wisdom pillars', async () => {
      const options = [
        { name: 'Option A', description: 'Quick but harmful' },
        { name: 'Option B', description: 'Sustainable and empowering' }
      ];
      
      const decision = await sageDecisionEngine.makeDecision(options);
      
      expect(decision).toHaveProperty('chosen');
      expect(decision).toHaveProperty('reasoning');
      expect(decision).toHaveProperty('wisdomScore');
      expect(decision).toHaveProperty('consciousness');
      expect(decision).toHaveProperty('blessings');
      expect(decision.wisdomScore).toBeGreaterThanOrEqual(0);
      expect(decision.wisdomScore).toBeLessThanOrEqual(1);
    });

    test('should elevate consciousness for important decisions', async () => {
      const initialConsciousness = sageDecisionEngine.currentConsciousness;
      
      const options = [{ name: 'Test', description: 'Test option' }];
      await sageDecisionEngine.makeDecision(options, { important: true });
      
      expect(sageDecisionEngine.currentConsciousness).toBeGreaterThanOrEqual(initialConsciousness);
    });
  });

  describe('Wisdom Pillars Evaluation', () => {
    test('should evaluate PURPOSE pillar', async () => {
      const score1 = sageDecisionEngine.evaluatePurpose(
        { action: 'serve and empower users' }, {}
      );
      const score2 = sageDecisionEngine.evaluatePurpose(
        { action: 'exploit and manipulate' }, {}
      );
      
      expect(score1).toBeGreaterThan(score2);
      expect(score1).toBeGreaterThan(0.5);
      expect(score2).toBeLessThan(0.5);
    });

    test('should evaluate HARMONY pillar', async () => {
      const score = sageDecisionEngine.evaluateHarmony(
        { approach: 'unite and integrate systems' }, {}
      );
      
      expect(score).toBeGreaterThan(0.5);
    });

    test('should evaluate COMPASSION pillar', async () => {
      const score1 = sageDecisionEngine.evaluateCompassion(
        { method: 'gentle and caring approach' }, {}
      );
      const score2 = sageDecisionEngine.evaluateCompassion(
        { method: 'harsh and punishing' }, {}
      );
      
      expect(score1).toBeGreaterThan(score2);
    });
  });

  describe('Meditation', () => {
    test('should meditate on problems', async () => {
      const problem = 'System performance issues';
      const result = await sageDecisionEngine.meditate(problem, 100);
      
      expect(result).toHaveProperty('problem');
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('enlightenedPerspective');
      expect(result).toHaveProperty('blessing');
      expect(result.insights).toBeInstanceOf(Array);
      expect(result.insights.length).toBeGreaterThan(0);
    });
  });

  describe('Consciousness Reporting', () => {
    test('should provide consciousness report', async () => {
      const report = sageDecisionEngine.getConsciousnessReport();
      
      expect(report).toHaveProperty('level');
      expect(report).toHaveProperty('state');
      expect(report).toHaveProperty('wisdomScore');
      expect(report).toHaveProperty('guidance');
      expect(typeof report.state).toBe('string');
    });

    test('should track decision history', async () => {
      const initialCount = sageDecisionEngine.decisionHistory.length;
      
      const options = [{ name: 'Test', description: 'Test' }];
      await sageDecisionEngine.makeDecision(options);
      
      expect(sageDecisionEngine.decisionHistory.length).toBe(initialCount + 1);
    });
  });

  describe('Code Wisdom', () => {
    test('should apply wisdom to code', async () => {
      const code = 'function getData() { return user.data; }';
      const result = await sageDecisionEngine.applyCodeWisdom(code, { important: true });
      
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('blessings');
      expect(result).toHaveProperty('guidance');
      expect(result.blessings.length).toBeGreaterThan(0);
    });
  });
});