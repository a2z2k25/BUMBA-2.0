#!/usr/bin/env node

/**
 * Security Test Runner
 * Tests all security implementations
 */

console.log('🔒 Testing BUMBA Security Implementations\n');

const tests = [];
let passed = 0;
let failed = 0;

// Test helper
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`✅ ${name}`);
  } catch (error) {
    failed++;
    console.log(`❌ ${name}: ${error.message}`);
  }
}

// Test 1: Input Validator
test('Input Validator', () => {
  const { validator } = require('./src/core/security/input-validator');
  
  // Test SQL injection detection
  const sqlInjection = "'; DROP TABLE users; --";
  const attacks = validator.detectAttacks(sqlInjection);
  if (!attacks.includes('sql_injection')) {
    throw new Error('Failed to detect SQL injection');
  }
  
  // Test XSS detection
  const xss = '<script>alert(1)</script>';
  const xssAttacks = validator.detectAttacks(xss);
  if (!xssAttacks.includes('xss')) {
    throw new Error('Failed to detect XSS');
  }
  
  // Test sanitization
  const dirty = '<script>alert(1)</script>Hello';
  const clean = validator.sanitizeHTML(dirty);
  if (clean.includes('<script>')) {
    throw new Error('Failed to sanitize HTML');
  }
});

// Test 2: Rate Limiter
test('Rate Limiter', async () => {
  const { rateLimiter } = require('./src/core/security/rate-limiter');
  
  // Create test limiter
  const testLimiter = rateLimiter.create('test', {
    maxRequests: 3,
    windowMs: 1000
  });
  
  const key = 'test-user-' + Date.now();
  
  // Make requests up to limit
  for (let i = 0; i < 3; i++) {
    const result = await testLimiter.limit(key);
    if (!result.allowed) {
      throw new Error(`Request ${i+1} should be allowed`);
    }
  }
  
  // Next should be blocked
  const blocked = await testLimiter.limit(key);
  if (blocked.allowed) {
    throw new Error('Should block after limit');
  }
});

// Test 3: JWT Manager
test('JWT Manager', async () => {
  const { jwtManager } = require('./src/core/auth/jwt-manager');
  
  const userId = 'test-' + Date.now();
  
  // Generate tokens
  const tokens = await jwtManager.generateTokens(userId);
  if (!tokens.accessToken || !tokens.refreshToken) {
    throw new Error('Failed to generate tokens');
  }
  
  // Verify token
  const verified = await jwtManager.verifyToken(tokens.accessToken);
  if (!verified.valid || verified.userId !== userId) {
    throw new Error('Failed to verify token');
  }
});

// Test 4: Session Manager
test('Session Manager', async () => {
  const { sessionManager } = require('./src/core/auth/session-manager');
  
  const userId = 'test-' + Date.now();
  
  // Create session
  const session = await sessionManager.createSession(userId, {
    ipAddress: '127.0.0.1',
    userAgent: 'Test'
  });
  
  if (!session.sessionId || session.sessionId.length < 32) {
    throw new Error('Invalid session ID');
  }
  
  // Validate session
  const valid = await sessionManager.validateSession(session.sessionId);
  if (!valid.valid) {
    throw new Error('Failed to validate session');
  }
});

// Test 5: RBAC Manager
test('RBAC Manager', () => {
  const { rbacManager } = require('./src/core/auth/rbac-manager');
  
  const userId = 'test-' + Date.now();
  
  // Create and assign role
  rbacManager.createRole('test-role', {
    permissions: ['read', 'write']
  });
  
  rbacManager.assignRole(userId, 'test-role');
  
  // Check permissions
  if (!rbacManager.hasPermission(userId, 'read')) {
    throw new Error('Should have read permission');
  }
  
  if (rbacManager.hasPermission(userId, 'delete')) {
    throw new Error('Should not have delete permission');
  }
});

// Test 6: Secure Communication
test('Secure Communication', () => {
  const { secureCommunication } = require('./src/core/security/secure-communication');
  
  // Test CORS validation
  secureCommunication.options.corsOrigins = ['https://example.com'];
  
  if (!secureCommunication.isOriginAllowed('https://example.com')) {
    throw new Error('Should allow configured origin');
  }
  
  if (secureCommunication.isOriginAllowed('https://evil.com')) {
    throw new Error('Should block unknown origin');
  }
});

// Test 7: Global State Manager
test('Global State Manager', () => {
  const { stateManager } = require('./src/core/state/global-state-manager');
  
  // Register namespace
  stateManager.register('test', { value: 0 });
  
  // Set value
  stateManager.set('test', 'value', 42);
  
  // Get value
  const value = stateManager.get('test', 'value');
  if (value !== 42) {
    throw new Error('State not properly managed');
  }
});

// Test 8: Timer Registry
test('Timer Registry', () => {
  const { ComponentTimers } = require('./src/core/timers/timer-registry');
  
  const timers = new ComponentTimers('test');
  
  // Set timeout
  const id = timers.setTimeout('test-timer', () => {}, 1000);
  if (!id) {
    throw new Error('Failed to create timer');
  }
  
  // Clear timer
  timers.clearTimeout('test-timer');
  
  // Check no leaks
  const active = timers.getActiveTimers();
  if (active.timeouts > 0) {
    throw new Error('Timer not properly cleared');
  }
});

// Test 9: Error Boundary
test('Error Boundary', async () => {
  const { errorBoundaryManager } = require('./src/core/error-boundaries/error-boundary');
  
  const boundary = errorBoundaryManager.create('test', {
    fallback: () => 'fallback'
  });
  
  // Test error catching
  const result = await boundary.execute(() => {
    throw new Error('Test error');
  });
  
  if (result !== 'fallback') {
    throw new Error('Error boundary did not use fallback');
  }
});

// Test 10: Cache Manager
test('Cache Manager', async () => {
  const { cacheManager } = require('./src/core/cache/cache-manager');
  
  const key = 'test-' + Date.now();
  const value = { data: 'test' };
  
  // Set cache
  await cacheManager.set(key, value, { ttl: 5000 });
  
  // Get cache
  const cached = await cacheManager.get(key);
  if (!cached || cached.data !== 'test') {
    throw new Error('Cache not working');
  }
  
  // Delete cache
  await cacheManager.delete(key);
  const deleted = await cacheManager.get(key);
  if (deleted) {
    throw new Error('Cache not properly deleted');
  }
});

// Test 11: Event Bus
test('Event Bus', async () => {
  const { eventBus } = require('./src/core/events/event-bus');
  
  let received = false;
  
  // Subscribe to event
  eventBus.on('test-event', (data) => {
    received = data === 'test-data';
  });
  
  // Emit event
  eventBus.emit('test-event', 'test-data');
  
  // Wait a bit for async
  await new Promise(resolve => setTimeout(resolve, 10));
  
  if (!received) {
    throw new Error('Event not received');
  }
  
  // Cleanup
  eventBus.removeAllListeners('test-event');
});

// Test 12: Database Query Builder
test('Query Builder', () => {
  const { query } = require('./src/core/database/query-builder');
  
  // Test safe query building
  const qb = query('users')
    .select('id', 'name')
    .where('email', 'test@example.com')
    .where('status', 'active')
    .limit(10);
  
  const { sql, params } = qb.build();
  
  // Should use parameters
  if (params.length === 0) {
    throw new Error('Not using parameterized queries');
  }
  
  // Should not include raw values
  if (sql.includes('test@example.com')) {
    throw new Error('SQL contains raw values');
  }
});

// Test 13: Dependency Manager
test('Dependency Manager', () => {
  const { dependencyManager } = require('./src/core/dependencies/dependency-manager');
  
  // Test circular detection (would need actual files)
  // Just test that it initializes
  if (!dependencyManager) {
    throw new Error('Dependency manager not initialized');
  }
});

// Test 14: Performance Profiler
test('Performance Profiler', async () => {
  const { performanceProfiler } = require('./src/core/performance/performance-profiler');
  
  // Profile a function
  const { result, profile } = await performanceProfiler.profile(async () => {
    await new Promise(resolve => setTimeout(resolve, 10));
    return 'done';
  }, 'test-function');
  
  if (result !== 'done') {
    throw new Error('Profiler did not return result');
  }
  
  if (!profile || !profile.duration) {
    throw new Error('Profiler did not generate profile');
  }
});

// Test 15: Metrics Collector
test('Metrics Collector', () => {
  const { metrics } = require('./src/core/monitoring/metrics-collector');
  
  // Record metrics
  metrics.increment('test.counter', 1);
  metrics.gauge('test.gauge', 42);
  metrics.histogram('test.histogram', 100);
  
  // Get snapshot
  const snapshot = metrics.getSnapshot();
  if (!snapshot || !snapshot.timestamp) {
    throw new Error('Metrics not collected');
  }
});

// Run all tests and show results
Promise.resolve().then(async () => {
  console.log('\n📊 Test Results:');
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${passed + failed}`);
  console.log(`   Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);
  
  if (failed > 0) {
    process.exit(1);
  }
});
