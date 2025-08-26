module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/../tests', '<rootDir>/../src'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/**/index.js',
    '!src/examples/**',
    '!src/templates/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/.git/'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/../tests/setup-tests.js'],
  clearMocks: true,
  restoreMocks: true,
  maxWorkers: 1, // Sequential execution to avoid race conditions
  verbose: true,
  testTimeout: 60000, // Increase to 60 seconds for complex tests
  slowTestThreshold: 5000, // Warn about tests taking > 5 seconds
  bail: false, // Continue running tests after first failure
  detectOpenHandles: true, // Detect handles keeping Jest from exiting
  forceExit: true, // Force exit after tests complete
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './.babelrc' }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(module-that-needs-transformation)/)'
  ]
};