/**
 * BUMBA Comprehensive Unit Test Framework
 * Advanced testing utilities and helpers
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class UnitTestFramework extends EventEmitter {
  constructor() {
    super();
    
    this.testSuites = new Map();
    this.mockRegistry = new Map();
    this.spies = new Map();
    this.fixtures = new Map();
    this.assertions = 0;
    this.customMatchers = new Map();
  }
  
  /**
   * Create a test suite with advanced features
   */
  createTestSuite(name, config = {}) {
    const suite = {
      name,
      tests: [],
      beforeAll: [],
      afterAll: [],
      beforeEach: [],
      afterEach: [],
      config: {
        timeout: config.timeout || 5000,
        retries: config.retries || 0,
        parallel: config.parallel || false,
        ...config
      },
      stats: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      }
    };
    
    this.testSuites.set(name, suite);
    
    return {
      describe: (description, fn) => this.describe(suite, description, fn),
      it: (description, fn) => this.it(suite, description, fn),
      test: (description, fn) => this.it(suite, description, fn),
      beforeAll: (fn) => suite.beforeAll.push(fn),
      afterAll: (fn) => suite.afterAll.push(fn),
      beforeEach: (fn) => suite.beforeEach.push(fn),
      afterEach: (fn) => suite.afterEach.push(fn),
      skip: (description) => this.skip(suite, description),
      only: (description, fn) => this.only(suite, description, fn)
    };
  }
  
  /**
   * Enhanced describe block
   */
  describe(suite, description, fn) {
    const context = {
      description,
      tests: [],
      beforeEach: [...suite.beforeEach],
      afterEach: [...suite.afterEach]
    };
    
    // Execute function to collect tests
    fn();
    
    suite.tests.push(context);
    return context;
  }
  
  /**
   * Enhanced test case
   */
  it(suite, description, fn) {
    const test = {
      description,
      fn,
      timeout: suite.config.timeout,
      retries: suite.config.retries,
      status: 'pending',
      error: null,
      duration: 0
    };
    
    suite.tests.push(test);
    suite.stats.total++;
    
    return test;
  }
  
  /**
   * Skip test
   */
  skip(suite, description) {
    const test = {
      description,
      status: 'skipped'
    };
    
    suite.tests.push(test);
    suite.stats.skipped++;
    
    return test;
  }
  
  /**
   * Run only this test
   */
  only(suite, description, fn) {
    const test = this.it(suite, description, fn);
    test.only = true;
    return test;
  }
  
  /**
   * Create advanced mock object
   */
  createMock(name, implementation = {}) {
    const mock = {
      name,
      calls: [],
      implementations: new Map(),
      returnValues: new Map(),
      errors: new Map(),
      ...implementation
    };
    
    const handler = {
      get: (target, prop) => {
        if (prop in target) {
          return target[prop];
        }
        
        // Create mock function
        return (...args) => {
          const call = {
            method: prop,
            args,
            timestamp: Date.now(),
            stack: new Error().stack
          };
          
          mock.calls.push(call);
          
          // Check for errors to throw
          if (mock.errors.has(prop)) {
            throw mock.errors.get(prop);
          }
          
          // Check for custom implementation
          if (mock.implementations.has(prop)) {
            return mock.implementations.get(prop)(...args);
          }
          
          // Return configured value
          if (mock.returnValues.has(prop)) {
            return mock.returnValues.get(prop);
          }
          
          // Default return
          return undefined;
        };
      }
    };
    
    const proxy = new Proxy(mock, handler);
    
    // Add helper methods
    proxy.mockImplementation = (method, fn) => {
      mock.implementations.set(method, fn);
      return proxy;
    };
    
    proxy.mockReturnValue = (method, value) => {
      mock.returnValues.set(method, value);
      return proxy;
    };
    
    proxy.mockError = (method, error) => {
      mock.errors.set(method, error);
      return proxy;
    };
    
    proxy.wasCalled = (method) => {
      return mock.calls.some(call => call.method === method);
    };
    
    proxy.wasCalledWith = (method, ...args) => {
      return mock.calls.some(call => 
        call.method === method && 
        JSON.stringify(call.args) === JSON.stringify(args)
      );
    };
    
    proxy.getCallCount = (method) => {
      return mock.calls.filter(call => call.method === method).length;
    };
    
    proxy.reset = () => {
      mock.calls = [];
      mock.implementations.clear();
      mock.returnValues.clear();
      mock.errors.clear();
    };
    
    this.mockRegistry.set(name, proxy);
    return proxy;
  }
  
  /**
   * Create spy for existing object
   */
  createSpy(object, method) {
    const original = object[method];
    const spy = {
      calls: [],
      original,
      object,
      method
    };
    
    object[method] = (...args) => {
      const call = {
        args,
        timestamp: Date.now(),
        result: null,
        error: null
      };
      
      try {
        call.result = original.apply(object, args);
        return call.result;
      } catch (error) {
        call.error = error;
        throw error;
      } finally {
        spy.calls.push(call);
      }
    };
    
    // Add spy methods
    object[method].restore = () => {
      object[method] = original;
    };
    
    object[method].wasCalled = () => spy.calls.length > 0;
    
    object[method].wasCalledWith = (...args) => {
      return spy.calls.some(call => 
        JSON.stringify(call.args) === JSON.stringify(args)
      );
    };
    
    object[method].getCallCount = () => spy.calls.length;
    
    object[method].getCall = (index) => spy.calls[index];
    
    const spyKey = `${object.constructor.name}.${method}`;
    this.spies.set(spyKey, spy);
    
    return object[method];
  }
  
  /**
   * Create test fixture
   */
  createFixture(name, data) {
    const fixture = {
      name,
      data: typeof data === 'function' ? data() : data,
      created: Date.now()
    };
    
    this.fixtures.set(name, fixture);
    
    return {
      get: () => JSON.parse(JSON.stringify(fixture.data)),
      update: (newData) => {
        fixture.data = typeof newData === 'function' ? newData() : newData;
      },
      reset: () => {
        fixture.data = typeof data === 'function' ? data() : data;
      }
    };
  }
  
  /**
   * Enhanced assertion library
   */
  expect(actual) {
    this.assertions++;
    
    return {
      // Basic matchers
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${actual} to be ${expected}`);
        }
      },
      
      toEqual: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
        }
      },
      
      toBeNull: () => {
        if (actual !== null) {
          throw new Error(`Expected ${actual} to be null`);
        }
      },
      
      toBeUndefined: () => {
        if (actual !== undefined) {
          throw new Error(`Expected ${actual} to be undefined`);
        }
      },
      
      toBeDefined: () => {
        if (actual === undefined) {
          throw new Error('Expected value to be defined');
        }
      },
      
      toBeTruthy: () => {
        if (!actual) {
          throw new Error(`Expected ${actual} to be truthy`);
        }
      },
      
      toBeFalsy: () => {
        if (actual) {
          throw new Error(`Expected ${actual} to be falsy`);
        }
      },
      
      // Number matchers
      toBeGreaterThan: (expected) => {
        if (actual <= expected) {
          throw new Error(`Expected ${actual} to be greater than ${expected}`);
        }
      },
      
      toBeGreaterThanOrEqual: (expected) => {
        if (actual < expected) {
          throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
        }
      },
      
      toBeLessThan: (expected) => {
        if (actual >= expected) {
          throw new Error(`Expected ${actual} to be less than ${expected}`);
        }
      },
      
      toBeLessThanOrEqual: (expected) => {
        if (actual > expected) {
          throw new Error(`Expected ${actual} to be less than or equal to ${expected}`);
        }
      },
      
      toBeCloseTo: (expected, precision = 2) => {
        const diff = Math.abs(actual - expected);
        const maxDiff = Math.pow(10, -precision) / 2;
        if (diff > maxDiff) {
          throw new Error(`Expected ${actual} to be close to ${expected}`);
        }
      },
      
      // String matchers
      toContain: (substring) => {
        if (!actual.includes(substring)) {
          throw new Error(`Expected "${actual}" to contain "${substring}"`);
        }
      },
      
      toMatch: (pattern) => {
        const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
        if (!regex.test(actual)) {
          throw new Error(`Expected "${actual}" to match ${pattern}`);
        }
      },
      
      // Array matchers
      toHaveLength: (length) => {
        if (actual.length !== length) {
          throw new Error(`Expected length ${actual.length} to be ${length}`);
        }
      },
      
      toContainEqual: (item) => {
        const found = actual.some(el => JSON.stringify(el) === JSON.stringify(item));
        if (!found) {
          throw new Error(`Expected array to contain ${JSON.stringify(item)}`);
        }
      },
      
      // Object matchers
      toHaveProperty: (property, value) => {
        if (!(property in actual)) {
          throw new Error(`Expected object to have property "${property}"`);
        }
        if (value !== undefined && actual[property] !== value) {
          throw new Error(`Expected property "${property}" to be ${value}, got ${actual[property]}`);
        }
      },
      
      toMatchObject: (expected) => {
        for (const key in expected) {
          if (!(key in actual)) {
            throw new Error(`Expected object to have property "${key}"`);
          }
          if (JSON.stringify(actual[key]) !== JSON.stringify(expected[key])) {
            throw new Error(`Property "${key}" does not match`);
          }
        }
      },
      
      // Function matchers
      toThrow: (error) => {
        try {
          actual();
          throw new Error('Expected function to throw');
        } catch (e) {
          if (error && !e.message.includes(error)) {
            throw new Error(`Expected error to contain "${error}", got "${e.message}"`);
          }
        }
      },
      
      toThrowError: (ErrorType) => {
        try {
          actual();
          throw new Error('Expected function to throw');
        } catch (e) {
          if (!(e instanceof ErrorType)) {
            throw new Error(`Expected error to be instance of ${ErrorType.name}`);
          }
        }
      },
      
      // Async matchers
      toResolve: async () => {
        try {
          await actual;
        } catch (e) {
          throw new Error(`Expected promise to resolve, but rejected with ${e}`);
        }
      },
      
      toReject: async () => {
        try {
          await actual;
          throw new Error('Expected promise to reject');
        } catch (e) {
          // Expected to reject
        }
      },
      
      // Custom matchers
      toSatisfy: (predicate) => {
        if (!predicate(actual)) {
          throw new Error('Expected value to satisfy predicate');
        }
      },
      
      // Negation
      not: {
        toBe: (expected) => {
          if (actual === expected) {
            throw new Error(`Expected ${actual} not to be ${expected}`);
          }
        },
        toEqual: (expected) => {
          if (JSON.stringify(actual) === JSON.stringify(expected)) {
            throw new Error(`Expected ${actual} not to equal ${expected}`);
          }
        },
        toContain: (item) => {
          if (actual.includes(item)) {
            throw new Error(`Expected not to contain ${item}`);
          }
        }
      }
    };
  }
  
  /**
   * Add custom matcher
   */
  addMatcher(name, matcher) {
    this.customMatchers.set(name, matcher);
  }
  
  /**
   * Create test data generator
   */
  createGenerator(type, options = {}) {
    const generators = {
      string: () => {
        const length = options.length || 10;
        const chars = options.chars || 'abcdefghijklmnopqrstuvwxyz';
        let result = '';
        for (let i = 0; i < length; i++) {
          result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
      },
      
      number: () => {
        const min = options.min || 0;
        const max = options.max || 100;
        return Math.random() * (max - min) + min;
      },
      
      boolean: () => Math.random() > 0.5,
      
      array: () => {
        const length = options.length || 5;
        const itemType = options.itemType || 'number';
        return Array.from({ length }, () => this.createGenerator(itemType)());
      },
      
      object: () => {
        const keys = options.keys || ['id', 'name', 'value'];
        const obj = {};
        for (const key of keys) {
          obj[key] = this.createGenerator('string')();
        }
        return obj;
      },
      
      date: () => {
        const start = options.start || new Date(2020, 0, 1);
        const end = options.end || new Date();
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
      },
      
      email: () => {
        return `${this.createGenerator('string', { length: 8 })()}@example.com`;
      },
      
      uuid: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
    };
    
    return generators[type] || generators.string;
  }
  
  /**
   * Property-based testing
   */
  property(description, predicate, options = {}) {
    const iterations = options.iterations || 100;
    const generators = options.generators || [];
    
    for (let i = 0; i < iterations; i++) {
      const inputs = generators.map(gen => gen());
      
      try {
        const result = predicate(...inputs);
        if (!result) {
          throw new Error(`Property failed for inputs: ${JSON.stringify(inputs)}`);
        }
      } catch (error) {
        logger.error(`Property test failed: ${description}`, error);
        throw error;
      }
    }
    
    return true;
  }
  
  /**
   * Snapshot testing
   */
  toMatchSnapshot(actual, name) {
    const snapshotPath = `__snapshots__/${name}.snap`;
    const fs = require('fs');
    const path = require('path');
    
    const snapshotDir = path.dirname(snapshotPath);
    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true });
    }
    
    if (fs.existsSync(snapshotPath)) {
      const expected = fs.readFileSync(snapshotPath, 'utf8');
      if (JSON.stringify(actual, null, 2) !== expected) {
        throw new Error(`Snapshot does not match for ${name}`);
      }
    } else {
      // Create snapshot
      fs.writeFileSync(snapshotPath, JSON.stringify(actual, null, 2));
      logger.info(`Snapshot created for ${name}`);
    }
    
    return true;
  }
  
  /**
   * Performance testing
   */
  benchmark(name, fn, options = {}) {
    const iterations = options.iterations || 1000;
    const warmup = options.warmup || 100;
    
    // Warmup
    for (let i = 0; i < warmup; i++) {
      fn();
    }
    
    // Measure
    const times = [];
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      fn();
      const end = process.hrtime.bigint();
      times.push(Number(end - start) / 1000000); // Convert to ms
    }
    
    // Calculate statistics
    times.sort((a, b) => a - b);
    const stats = {
      min: times[0],
      max: times[times.length - 1],
      mean: times.reduce((a, b) => a + b, 0) / times.length,
      median: times[Math.floor(times.length / 2)],
      p95: times[Math.floor(times.length * 0.95)],
      p99: times[Math.floor(times.length * 0.99)]
    };
    
    logger.info(`Benchmark ${name}: mean=${stats.mean.toFixed(3)}ms, p95=${stats.p95.toFixed(3)}ms`);
    
    return stats;
  }
  
  /**
   * Test coverage tracking
   */
  trackCoverage(fn, context = {}) {
    const coverage = {
      lines: new Set(),
      branches: new Set(),
      functions: new Set()
    };
    
    // Instrument function
    const instrumented = new Proxy(fn, {
      apply: (target, thisArg, args) => {
        coverage.functions.add(fn.name || 'anonymous');
        return target.apply(thisArg, args);
      }
    });
    
    // Execute and track
    instrumented(context);
    
    return coverage;
  }
  
  /**
   * Run test suite
   */
  async runSuite(suiteName) {
    const suite = this.testSuites.get(suiteName);
    if (!suite) {
      throw new Error(`Test suite "${suiteName}" not found`);
    }
    
    logger.info(`Running test suite: ${suiteName}`);
    const startTime = Date.now();
    
    // Run beforeAll hooks
    for (const hook of suite.beforeAll) {
      await hook();
    }
    
    // Run tests
    const results = [];
    for (const test of suite.tests) {
      // Skip if only tests exist and this isn't one
      if (suite.tests.some(t => t.only) && !test.only) {
        test.status = 'skipped';
        suite.stats.skipped++;
        continue;
      }
      
      // Run beforeEach hooks
      for (const hook of suite.beforeEach) {
        await hook();
      }
      
      // Run test with retries
      let retries = test.retries || 0;
      let passed = false;
      let lastError = null;
      
      while (retries >= 0 && !passed) {
        try {
          const testStart = Date.now();
          
          // Run test with timeout
          await Promise.race([
            test.fn(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Test timeout')), test.timeout)
            )
          ]);
          
          test.duration = Date.now() - testStart;
          test.status = 'passed';
          passed = true;
          suite.stats.passed++;
          
        } catch (error) {
          lastError = error;
          retries--;
          
          if (retries < 0) {
            test.status = 'failed';
            test.error = error;
            suite.stats.failed++;
          }
        }
      }
      
      // Run afterEach hooks
      for (const hook of suite.afterEach) {
        await hook();
      }
      
      results.push({
        description: test.description,
        status: test.status,
        duration: test.duration,
        error: test.error
      });
    }
    
    // Run afterAll hooks
    for (const hook of suite.afterAll) {
      await hook();
    }
    
    suite.stats.duration = Date.now() - startTime;
    
    // Clean up
    this.cleanupMocks();
    this.cleanupSpies();
    
    return {
      suite: suiteName,
      stats: suite.stats,
      results
    };
  }
  
  /**
   * Clean up mocks
   */
  cleanupMocks() {
    for (const mock of this.mockRegistry.values()) {
      mock.reset();
    }
  }
  
  /**
   * Clean up spies
   */
  cleanupSpies() {
    for (const spy of this.spies.values()) {
      spy.object[spy.method] = spy.original;
    }
    this.spies.clear();
  }
  
  /**
   * Generate test report
   */
  generateReport() {
    const report = {
      timestamp: Date.now(),
      suites: [],
      totals: {
        suites: this.testSuites.size,
        tests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        assertions: this.assertions
      }
    };
    
    for (const [name, suite] of this.testSuites) {
      report.suites.push({
        name,
        stats: suite.stats
      });
      
      report.totals.tests += suite.stats.total;
      report.totals.passed += suite.stats.passed;
      report.totals.failed += suite.stats.failed;
      report.totals.skipped += suite.stats.skipped;
      report.totals.duration += suite.stats.duration;
    }
    
    report.totals.passRate = report.totals.tests > 0 
      ? (report.totals.passed / report.totals.tests * 100).toFixed(2) + '%'
      : '0%';
    
    return report;
  }
}

// Export singleton
module.exports = new UnitTestFramework();