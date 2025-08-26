/**
 * Jest configuration for integration tests
 * Run with: npm run test:integration
 */

module.exports = {
  // Extend base configuration
  ...require('./jest.config.js'),
  
  // Integration test specific settings
  displayName: 'Integration Tests',
  
  // Only run integration tests
  testMatch: [
    '**/tests/integration/**/*.test.js',
    '**/tests/integration/**/*.spec.js'
  ],
  
  // Longer timeout for integration tests
  testTimeout: 30000, // 30 seconds
  
  // Run tests serially for integration
  maxWorkers: 1,
  
  // Different coverage directory
  coverageDirectory: 'coverage-integration',
  
  // Integration tests might have lower coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Environment variables for integration tests
  testEnvironmentOptions: {
    NODE_ENV: 'integration-test'
  }
};