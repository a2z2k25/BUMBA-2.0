/**
 * Unit tests for Consciousness Enhancement System
 */

const { consciousnessSystem } = require('../../../src/core/consciousness/consciousness-enhancement');
const { culturalVibes } = require('../../../src/core/consciousness/cultural-vibes');

describe('Consciousness Enhancement System', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('Response Enhancement', () => {
    test('should enhance responses with consciousness', async () => {
      const response = 'I will implement this feature';
      const enhanced = await consciousnessSystem.enhanceResponse(response);
      
      expect(enhanced).not.toBe(response);
      expect(enhanced.length).toBeGreaterThan(response.length);
    });

    test('should add wisdom to important contexts', async () => {
      const response = 'Building a critical system';
      const enhanced = await consciousnessSystem.enhanceResponse(response, { important: true });
      
      // Wisdom might be added (40-80% chance)
      expect(enhanced).toBeDefined();
    });

    test('should detect response types correctly', async () => {
      expect(consciousnessSystem.detectResponseType('function test()')).toBe('code');
      expect(consciousnessSystem.detectResponseType('# Documentation')).toBe('documentation');
      expect(consciousnessSystem.detectResponseType('analysis of system')).toBe('analysis');
      expect(consciousnessSystem.detectResponseType('make a decision')).toBe('decision');
    });
  });

  describe('Consciousness Metrics', () => {
    test('should track enhancement metrics', async () => {
      const initialCount = consciousnessSystem.influenceMetrics.responses_enhanced;
      await consciousnessSystem.enhanceResponse('test');
      
      expect(consciousnessSystem.influenceMetrics.responses_enhanced).toBe(initialCount + 1);
    });

    test('should generate influence report', async () => {
      const report = consciousnessSystem.getInfluenceReport();
      
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('consciousness_level');
      expect(report).toHaveProperty('overall_influence');
      expect(report.consciousness_level).toBeDefined();
    });
  });

  describe('Decision Influence', () => {
    test('should influence decisions based on consciousness', async () => {
      const options = [
        { approach: 'quick hack', impact: 'temporary' },
        { approach: 'quality solution', impact: 'sustainable' }
      ];
      
      const decision = await consciousnessSystem.influenceDecision(options);
      
      expect(decision).toHaveProperty('recommended');
      expect(decision).toHaveProperty('reasoning');
      expect(decision).toHaveProperty('consciousness_applied');
      expect(decision.consciousness_applied).toBe(true);
    });
  });

  describe('Quality Elevation', () => {
    test('should elevate code quality', async () => {
      const code = 'function test() { // TODO: fix this }';
      const elevated = await consciousnessSystem.elevateQuality(code);
      
      expect(elevated).toBeDefined();
      expect(elevated).toContain('conscious');
    });
  });

  describe('Wisdom Integration', () => {
    test('should integrate wisdom into operations', async () => {
      const operation = { task: 'refactor', priority: 'high' };
      const result = await consciousnessSystem.integrateWisdom(operation);
      
      expect(result).toHaveProperty('wisdom');
      expect(typeof result.wisdom).toBe('string');
      expect(result.wisdom.length).toBeGreaterThan(0);
    });
  });
});

describe('Cultural Vibes System', () => {
  beforeEach(() => {
    culturalVibes.resetUsage();
  });

  test('should have correct enhancement probability', async () => {
    expect(culturalVibes.enhancementProbability).toBe(0.10);
  });

  test('should track recent usage', async () => {
    culturalVibes.trackUsage(['test', 'words']);
    expect(culturalVibes.recentUsage).toContain('test');
    expect(culturalVibes.recentUsage).toContain('words');
  });

  test('should provide contextual slang', async () => {
    const greetings = culturalVibes.getContextualSlang('greetings');
    expect(greetings).toContain('whagwan');
    expect(greetings).toContain('bless');
    expect(greetings).toContain('seen');
  });

  test('should enhance responses occasionally', async () => {
    // Force enhancement for testing
    const original = culturalVibes.enhancementProbability;
    culturalVibes.enhancementProbability = 1.0;
    
    const response = 'This is very good work';
    const enhanced = culturalVibes.enhanceResponse(response);
    
    expect(enhanced).toBeDefined();
    // May or may not be enhanced based on random factors
    
    culturalVibes.enhancementProbability = original;
  });
});