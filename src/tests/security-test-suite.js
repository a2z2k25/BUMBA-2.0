/**
 * Security Test Suite
 * Comprehensive security testing for all implemented features
 * Sprint 45-48 - Documentation & Testing
 */

const assert = require('assert');
const { safeExecutor } = require('../core/plugins/safe-plugin-executor');
const { xssPrevention } = require('../core/security/xss-prevention');
const { validator } = require('../core/security/input-validator');
const { rateLimiter } = require('../core/security/rate-limiter');
const { jwtManager } = require('../core/auth/jwt-manager');
const { sessionManager } = require('../core/auth/session-manager');
const { rbacManager } = require('../core/auth/rbac-manager');
const { query } = require('../core/database/query-builder');

class SecurityTestSuite {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0
    };
  }
  
  /**
   * Register test
   */
  test(name, fn) {
    this.tests.push({ name, fn });
  }
  
  /**
   * Run all tests
   */
  async runAll() {
    console.log('🔒 Running Security Test Suite...\n');
    
    for (const test of this.tests) {
      await this.runTest(test);
    }
    
    this.printResults();
  }
  
  /**
   * Run single test
   */
  async runTest(test) {
    try {
      await test.fn();
      this.results.passed++;
      console.log(`✅ ${test.name}`);
    } catch (error) {
      this.results.failed++;
      console.log(`❌ ${test.name}`);
      console.log(`   Error: ${error.message}`);
    }
  }
  
  /**
   * Print test results
   */
  printResults() {
    console.log('\n📊 Test Results:');
    console.log(`   Passed: ${this.results.passed}`);
    console.log(`   Failed: ${this.results.failed}`);
    console.log(`   Total: ${this.tests.length}`);
    console.log(`   Success Rate: ${(this.results.passed / this.tests.length * 100).toFixed(1)}%`);
  }
}

// Create test suite
const suite = new SecurityTestSuite();

// Test 1: Code Injection Prevention
suite.test('Code Injection Prevention', async () => {
  const maliciousCode = `
    process.exit(1);
    require('child_process').exec('rm -rf /');
  `;
  
  const result = await safeExecutor.execute(maliciousCode, {
    timeout: 1000,
    allowedModules: []
  });
  
  assert(result.error, 'Should prevent malicious code execution');
  assert(result.error.includes('not allowed') || result.error.includes('denied'));
});

// Test 2: XSS Prevention
suite.test('XSS Prevention', async () => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror="alert(1)">',
    'javascript:alert(1)',
    '<svg onload="alert(1)">',
    '<%script>alert(1)</%script>'
  ];
  
  for (const payload of xssPayloads) {
    const sanitized = xssPrevention.sanitizeHTML(payload);
    assert(!sanitized.includes('<script'), 'Should remove script tags');
    assert(!sanitized.includes('onerror'), 'Should remove event handlers');
    assert(!sanitized.includes('javascript:'), 'Should remove javascript protocol');
  }
});

// Test 3: SQL Injection Prevention
suite.test('SQL Injection Prevention', async () => {
  const maliciousInputs = [
    "'; DROP TABLE users; --",
    "1' OR '1'='1",
    "admin'--",
    "' UNION SELECT * FROM passwords --"
  ];
  
  for (const input of maliciousInputs) {
    const attacks = validator.detectAttacks(input);
    assert(attacks.includes('sql_injection'), `Should detect SQL injection in: ${input}`);
  }
  
  // Test query builder protection
  const qb = query('users')
    .select('*')
    .where('username', "admin' OR '1'='1");
  
  const { sql, params } = qb.build();
  assert(params.length > 0, 'Should use parameterized queries');
  assert(!sql.includes("'1'='1'"), 'Should not include injection in SQL');
});

// Test 4: Command Injection Prevention
suite.test('Command Injection Prevention', async () => {
  const commandInjections = [
    '; ls -la',
    '| cat /etc/passwd',
    '`rm -rf /`',
    '$(whoami)',
    '&& curl evil.com'
  ];
  
  for (const input of commandInjections) {
    const attacks = validator.detectAttacks(input);
    assert(attacks.includes('command_injection'), `Should detect command injection in: ${input}`);
  }
});

// Test 5: Path Traversal Prevention
suite.test('Path Traversal Prevention', async () => {
  const pathTraversals = [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32',
    'file:///../../../etc/passwd',
    '%2e%2e%2f%2e%2e%2f'
  ];
  
  for (const input of pathTraversals) {
    const attacks = validator.detectAttacks(input);
    assert(attacks.includes('path_traversal'), `Should detect path traversal in: ${input}`);
  }
});

// Test 6: Rate Limiting
suite.test('Rate Limiting', async () => {
  const key = 'test-user-' + Date.now();
  const limiter = rateLimiter.create('test', {
    maxRequests: 5,
    windowMs: 1000
  });
  
  // Make requests up to limit
  for (let i = 0; i < 5; i++) {
    const result = await limiter.limit(key);
    assert(result.allowed, `Request ${i+1} should be allowed`);
  }
  
  // Next request should be blocked
  const blocked = await limiter.limit(key);
  assert(!blocked.allowed, 'Should block after limit exceeded');
  assert(blocked.retryAfter > 0, 'Should provide retry time');
});

// Test 7: JWT Security
suite.test('JWT Token Security', async () => {
  const userId = 'test-user-' + Date.now();
  
  // Generate tokens
  const tokens = await jwtManager.generateTokens(userId, {
    roles: ['user'],
    permissions: ['read']
  });
  
  assert(tokens.accessToken, 'Should generate access token');
  assert(tokens.refreshToken, 'Should generate refresh token');
  assert(tokens.accessToken !== tokens.refreshToken, 'Tokens should be different');
  
  // Verify access token
  const verified = await jwtManager.verifyToken(tokens.accessToken);
  assert(verified.valid, 'Should verify valid token');
  assert.strictEqual(verified.userId, userId, 'Should contain correct userId');
  
  // Test token expiry
  const expiredToken = await jwtManager.generateTokens(userId, {}, { expiresIn: '1ms' });
  await new Promise(resolve => setTimeout(resolve, 10));
  
  const expiredVerify = await jwtManager.verifyToken(expiredToken.accessToken);
  assert(!expiredVerify.valid, 'Should reject expired token');
  
  // Test refresh token rotation
  const newTokens = await jwtManager.refreshTokens(tokens.refreshToken);
  assert(newTokens.accessToken, 'Should generate new access token');
  assert(newTokens.refreshToken !== tokens.refreshToken, 'Should rotate refresh token');
  
  // Old refresh token should be invalid
  const oldRefresh = await jwtManager.refreshTokens(tokens.refreshToken);
  assert(!oldRefresh, 'Should invalidate old refresh token');
});

// Test 8: Session Security
suite.test('Session Management Security', async () => {
  const userId = 'test-user-' + Date.now();
  const ipAddress = '127.0.0.1';
  const userAgent = 'Test Browser';
  
  // Create session
  const session = await sessionManager.createSession(userId, {
    ipAddress,
    userAgent
  });
  
  assert(session.sessionId, 'Should create session ID');
  assert(session.sessionId.length >= 32, 'Session ID should be long enough');
  
  // Validate session
  const valid = await sessionManager.validateSession(session.sessionId, {
    checkIp: true,
    ipAddress,
    checkUserAgent: true,
    userAgent
  });
  
  assert(valid.valid, 'Should validate correct session');
  
  // Test IP mismatch detection
  const invalidIp = await sessionManager.validateSession(session.sessionId, {
    checkIp: true,
    ipAddress: '192.168.1.1'
  });
  
  assert(!invalidIp.valid, 'Should detect IP mismatch');
  
  // Test session destruction
  await sessionManager.destroySession(session.sessionId);
  
  const destroyed = await sessionManager.validateSession(session.sessionId);
  assert(!destroyed.valid, 'Should invalidate destroyed session');
});

// Test 9: RBAC Security
suite.test('Role-Based Access Control', async () => {
  const userId = 'test-user-' + Date.now();
  
  // Create roles
  rbacManager.createRole('admin', {
    permissions: ['read', 'write', 'delete'],
    inherits: []
  });
  
  rbacManager.createRole('editor', {
    permissions: ['read', 'write'],
    inherits: []
  });
  
  rbacManager.createRole('viewer', {
    permissions: ['read'],
    inherits: []
  });
  
  // Assign roles
  rbacManager.assignRole(userId, 'editor');
  
  // Check permissions
  assert(rbacManager.hasPermission(userId, 'read'), 'Editor should have read permission');
  assert(rbacManager.hasPermission(userId, 'write'), 'Editor should have write permission');
  assert(!rbacManager.hasPermission(userId, 'delete'), 'Editor should not have delete permission');
  
  // Test role hierarchy
  rbacManager.createRole('superadmin', {
    permissions: ['manage'],
    inherits: ['admin']
  });
  
  rbacManager.assignRole(userId, 'superadmin');
  assert(rbacManager.hasPermission(userId, 'delete'), 'Superadmin should inherit admin permissions');
  assert(rbacManager.hasPermission(userId, 'manage'), 'Superadmin should have manage permission');
});

// Test 10: Input Sanitization
suite.test('Input Sanitization', async () => {
  const dirtyInput = {
    name: '<script>alert(1)</script>John',
    email: 'john@example.com<img src=x>',
    bio: 'Hello\x00World\x08',
    website: 'javascript:alert(1)',
    age: '25; DROP TABLE users;'
  };
  
  const clean = validator.sanitizeObject(dirtyInput);
  
  assert(!clean.name.includes('<script'), 'Should remove script tags from name');
  assert(!clean.email.includes('<img'), 'Should remove HTML from email');
  assert(!clean.bio.includes('\x00'), 'Should remove null bytes');
  assert(!clean.website.includes('javascript:'), 'Should remove javascript protocol');
  assert(clean.age === '25 DROP TABLE users', 'Should sanitize SQL from number field');
});

// Test 11: Memory Safety
suite.test('Memory Safety', async () => {
  // Test safe plugin executor memory limits
  const memoryBomb = `
    const arr = [];
    while(true) {
      arr.push(new Array(1000000).fill('x'));
    }
  `;
  
  const result = await safeExecutor.execute(memoryBomb, {
    timeout: 1000,
    memory: 50 * 1024 * 1024 // 50MB limit
  });
  
  assert(result.error, 'Should prevent memory exhaustion');
});

// Test 12: Timing Attack Prevention
suite.test('Timing Attack Prevention', async () => {
  const secret = 'secret123';
  const attempts = [];
  
  // Try different incorrect values
  for (let i = 0; i < 10; i++) {
    const start = Date.now();
    validator.constantTimeCompare('wrong' + i, secret);
    const duration = Date.now() - start;
    attempts.push(duration);
  }
  
  // Check that timing is consistent (within 2ms variance)
  const avgTime = attempts.reduce((a, b) => a + b, 0) / attempts.length;
  const variance = attempts.every(time => Math.abs(time - avgTime) < 2);
  
  assert(variance, 'Should have consistent timing to prevent timing attacks');
});

// Test 13: HTTPS/HSTS Enforcement
suite.test('HTTPS and HSTS Headers', async () => {
  const { secureCommunication } = require('../core/security/secure-communication');
  
  const mockReq = {
    headers: {},
    protocol: 'http',
    get: (header) => header === 'x-forwarded-proto' ? 'http' : undefined
  };
  
  const mockRes = {
    headers: {},
    setHeader: function(name, value) {
      this.headers[name] = value;
    },
    redirect: function(code, url) {
      this.redirected = { code, url };
    }
  };
  
  // Test HTTPS redirect
  const redirected = secureCommunication.enforceHTTPS(mockReq, mockRes);
  assert(redirected, 'Should redirect HTTP to HTTPS');
  assert(mockRes.redirected.code === 301, 'Should use permanent redirect');
  
  // Test HSTS header
  secureCommunication.setHSTSHeader(mockRes);
  assert(mockRes.headers['Strict-Transport-Security'], 'Should set HSTS header');
  assert(mockRes.headers['Strict-Transport-Security'].includes('max-age='), 'Should include max-age');
});

// Test 14: CORS Security
suite.test('CORS Origin Validation', async () => {
  const { secureCommunication } = require('../core/security/secure-communication');
  
  secureCommunication.options.corsOrigins = ['https://trusted.com', 'https://*.example.com'];
  
  // Test allowed origin
  assert(secureCommunication.isOriginAllowed('https://trusted.com'), 'Should allow exact match');
  assert(secureCommunication.isOriginAllowed('https://sub.example.com'), 'Should allow wildcard match');
  
  // Test blocked origin
  assert(!secureCommunication.isOriginAllowed('https://evil.com'), 'Should block unknown origin');
  assert(!secureCommunication.isOriginAllowed('http://trusted.com'), 'Should block HTTP version');
});

// Test 15: CSP Implementation
suite.test('Content Security Policy', async () => {
  const { secureCommunication } = require('../core/security/secure-communication');
  
  const mockReq = {};
  const mockRes = {
    headers: {},
    setHeader: function(name, value) {
      this.headers[name] = value;
    }
  };
  
  secureCommunication.setCSPHeader(mockReq, mockRes);
  
  const csp = mockRes.headers['Content-Security-Policy'];
  assert(csp, 'Should set CSP header');
  assert(csp.includes("default-src 'self'"), 'Should have default-src directive');
  assert(csp.includes('script-src'), 'Should have script-src directive');
  assert(mockReq.cspNonce, 'Should generate CSP nonce');
});

// Run all tests
if (require.main === module) {
  suite.runAll().catch(console.error);
}

module.exports = {
  SecurityTestSuite,
  suite
};