/**
 * Unit tests for context preservation metrics
 * Phase 1 - Sprint 3
 */

const assert = require('assert');
const UnifiedSpecialistBase = require('../../src/core/specialists/unified-specialist-base');

describe('Context Metrics - Token Estimation', () => {
  let specialist;
  
  before(() => {
    specialist = new UnifiedSpecialistBase({
      id: 'test-specialist',
      name: 'Test Specialist'
    });
  });
  
  it('should estimate tokens for strings', () => {
    const text = 'Hello world'; // 11 chars
    const tokens = specialist.estimateTokens(text);
    assert.strictEqual(tokens, 3); // 11/4 = 2.75, rounds up to 3
  });
  
  it('should estimate tokens for objects', () => {
    const obj = { message: 'test', count: 42 };
    const tokens = specialist.estimateTokens(obj);
    assert(tokens > 0);
    assert(tokens < 50); // Should be reasonable for small object
  });
  
  it('should estimate tokens for arrays', () => {
    const arr = [1, 2, 3, 4, 5];
    const tokens = specialist.estimateTokens(arr);
    assert(tokens > 0);
    assert(tokens < 20); // Should be small for simple array
  });
  
  it('should handle null/undefined', () => {
    assert.strictEqual(specialist.estimateTokens(null), 0);
    assert.strictEqual(specialist.estimateTokens(undefined), 0);
  });
  
  it('should handle circular references', () => {
    const circular = { a: 1 };
    circular.self = circular; // Create circular reference
    const tokens = specialist.estimateTokens(circular);
    assert(tokens > 0); // Should return something, not crash
  });
  
  it('context metrics should be initialized', () => {
    assert(specialist.contextMetrics);
    assert.strictEqual(specialist.contextMetrics.enabled, true);
    assert.strictEqual(specialist.contextMetrics.tokensProcessed, 0);
    assert.strictEqual(specialist.contextMetrics.tokensReturned, 0);
  });
});

// Quick verification
if (require.main === module) {
  console.log('Running quick test...');
  const spec = new UnifiedSpecialistBase({ id: 'test' });
  console.log('String "Hello": ' + spec.estimateTokens('Hello') + ' tokens');
  console.log('Object {a:1,b:2}: ' + spec.estimateTokens({a:1,b:2}) + ' tokens');
  console.log('✅ Token estimation working!');
}