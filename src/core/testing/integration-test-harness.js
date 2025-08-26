/**
 * BUMBA Integration Test Harness
 * Comprehensive integration testing framework
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const http = require('http');
const net = require('net');

class IntegrationTestHarness extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:3000',
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      parallel: config.parallel || false,
      cleanup: config.cleanup !== false,
      ...config
    };
    
    this.services = new Map();
    this.databases = new Map();
    this.queues = new Map();
    this.fixtures = new Map();
    this.scenarios = new Map();
    this.results = [];
  }
  
  /**
   * Setup test environment
   */
  async setup() {
    logger.info('Setting up integration test environment');
    
    // Start required services
    await this.startServices();
    
    // Setup databases
    await this.setupDatabases();
    
    // Setup message queues
    await this.setupQueues();
    
    // Load fixtures
    await this.loadFixtures();
    
    this.emit('setup-complete');
  }
  
  /**
   * Start mock services
   */
  async startServices() {
    // Start mock API server
    const apiServer = await this.createMockServer('api', 3001, (req, res) => {
      const responses = this.services.get('api').responses;
      const key = `${req.method} ${req.url}`;
      
      if (responses.has(key)) {
        const response = responses.get(key);
        res.statusCode = response.status || 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(response.data));
      } else {
        res.statusCode = 404;
        res.end('Not found');
      }
    });
    
    // Start mock auth server
    const authServer = await this.createMockServer('auth', 3002, (req, res) => {
      if (req.url === '/authenticate') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ token: 'mock-token', expires: Date.now() + 3600000 }));
      } else {
        res.statusCode = 401;
        res.end('Unauthorized');
      }
    });
    
    // Start mock database server
    const dbServer = await this.createMockServer('database', 3003, (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ connected: true, version: '1.0.0' }));
    });
    
    this.services.set('api', { server: apiServer, responses: new Map() });
    this.services.set('auth', { server: authServer });
    this.services.set('database', { server: dbServer });
  }
  
  /**
   * Create mock server
   */
  createMockServer(name, port, handler) {
    return new Promise((resolve, reject) => {
      const server = http.createServer(handler);
      
      server.listen(port, () => {
        logger.info(`Mock ${name} server started on port ${port}`);
        resolve(server);
      });
      
      server.on('error', reject);
    });
  }
  
  /**
   * Setup test databases
   */
  async setupDatabases() {
    // Setup in-memory database
    const memoryDb = {
      name: 'test-db',
      type: 'memory',
      collections: new Map(),
      
      insert: function(collection, data) {
        if (!this.collections.has(collection)) {
          this.collections.set(collection, []);
        }
        const id = Date.now() + Math.random();
        const doc = { id, ...data, _created: Date.now() };
        this.collections.get(collection).push(doc);
        return doc;
      },
      
      find: function(collection, query = {}) {
        if (!this.collections.has(collection)) return [];
        
        return this.collections.get(collection).filter(doc => {
          for (const [key, value] of Object.entries(query)) {
            if (doc[key] !== value) return false;
          }
          return true;
        });
      },
      
      update: function(collection, query, update) {
        const docs = this.find(collection, query);
        docs.forEach(doc => {
          Object.assign(doc, update, { _updated: Date.now() });
        });
        return docs.length;
      },
      
      delete: function(collection, query) {
        if (!this.collections.has(collection)) return 0;
        
        const initial = this.collections.get(collection).length;
        const filtered = this.collections.get(collection).filter(doc => {
          for (const [key, value] of Object.entries(query)) {
            if (doc[key] === value) return false;
          }
          return true;
        });
        
        this.collections.set(collection, filtered);
        return initial - filtered.length;
      },
      
      clear: function() {
        this.collections.clear();
      }
    };
    
    this.databases.set('memory', memoryDb);
    
    // Setup mock Redis
    const mockRedis = {
      data: new Map(),
      
      get: function(key) {
        return this.data.get(key);
      },
      
      set: function(key, value, ttl) {
        this.data.set(key, value);
        if (ttl) {
          setTimeout(() => this.data.delete(key), ttl * 1000);
        }
      },
      
      delete: function(key) {
        return this.data.delete(key);
      },
      
      clear: function() {
        this.data.clear();
      }
    };
    
    this.databases.set('redis', mockRedis);
  }
  
  /**
   * Setup message queues
   */
  async setupQueues() {
    // Setup in-memory queue
    const memoryQueue = {
      queues: new Map(),
      
      send: function(queue, message) {
        if (!this.queues.has(queue)) {
          this.queues.set(queue, []);
        }
        this.queues.get(queue).push({
          id: Date.now() + Math.random(),
          message,
          timestamp: Date.now()
        });
      },
      
      receive: function(queue) {
        if (!this.queues.has(queue)) return null;
        return this.queues.get(queue).shift();
      },
      
      peek: function(queue) {
        if (!this.queues.has(queue)) return null;
        return this.queues.get(queue)[0];
      },
      
      size: function(queue) {
        if (!this.queues.has(queue)) return 0;
        return this.queues.get(queue).length;
      },
      
      clear: function(queue) {
        if (queue) {
          this.queues.delete(queue);
        } else {
          this.queues.clear();
        }
      }
    };
    
    this.queues.set('memory', memoryQueue);
  }
  
  /**
   * Load test fixtures
   */
  async loadFixtures() {
    // User fixtures
    this.fixtures.set('users', [
      { id: 1, name: 'Alice', email: 'alice@test.com', role: 'admin' },
      { id: 2, name: 'Bob', email: 'bob@test.com', role: 'user' },
      { id: 3, name: 'Charlie', email: 'charlie@test.com', role: 'user' }
    ]);
    
    // Product fixtures
    this.fixtures.set('products', [
      { id: 1, name: 'Product A', price: 99.99, stock: 100 },
      { id: 2, name: 'Product B', price: 149.99, stock: 50 },
      { id: 3, name: 'Product C', price: 199.99, stock: 25 }
    ]);
    
    // Order fixtures
    this.fixtures.set('orders', [
      { id: 1, userId: 1, productId: 1, quantity: 2, status: 'completed' },
      { id: 2, userId: 2, productId: 2, quantity: 1, status: 'pending' }
    ]);
  }
  
  /**
   * Create integration test scenario
   */
  createScenario(name, config = {}) {
    const scenario = {
      name,
      steps: [],
      setup: config.setup || (() => {}),
      teardown: config.teardown || (() => {}),
      timeout: config.timeout || this.config.timeout,
      retries: config.retries || this.config.retries
    };
    
    this.scenarios.set(name, scenario);
    
    return {
      given: (description, fn) => this.addStep(scenario, 'given', description, fn),
      when: (description, fn) => this.addStep(scenario, 'when', description, fn),
      then: (description, fn) => this.addStep(scenario, 'then', description, fn),
      and: (description, fn) => this.addStep(scenario, 'and', description, fn)
    };
  }
  
  /**
   * Add step to scenario
   */
  addStep(scenario, type, description, fn) {
    scenario.steps.push({ type, description, fn });
    return this;
  }
  
  /**
   * Run integration scenario
   */
  async runScenario(name) {
    const scenario = this.scenarios.get(name);
    if (!scenario) {
      throw new Error(`Scenario "${name}" not found`);
    }
    
    logger.info(`Running integration scenario: ${name}`);
    const result = {
      name,
      steps: [],
      status: 'running',
      startTime: Date.now(),
      endTime: null,
      duration: 0,
      error: null
    };
    
    try {
      // Setup
      await scenario.setup();
      
      // Run steps
      for (const step of scenario.steps) {
        const stepResult = {
          type: step.type,
          description: step.description,
          status: 'running',
          startTime: Date.now()
        };
        
        try {
          await Promise.race([
            step.fn(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Step timeout')), scenario.timeout)
            )
          ]);
          
          stepResult.status = 'passed';
          stepResult.duration = Date.now() - stepResult.startTime;
          
        } catch (error) {
          stepResult.status = 'failed';
          stepResult.error = error;
          stepResult.duration = Date.now() - stepResult.startTime;
          throw error;
        }
        
        result.steps.push(stepResult);
      }
      
      result.status = 'passed';
      
    } catch (error) {
      result.status = 'failed';
      result.error = error;
      
    } finally {
      // Teardown
      await scenario.teardown();
      
      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime;
    }
    
    this.results.push(result);
    this.emit('scenario-complete', result);
    
    return result;
  }
  
  /**
   * Test API integration
   */
  async testAPI(endpoint, options = {}) {
    const url = `${this.config.baseUrl}${endpoint}`;
    const method = options.method || 'GET';
    const headers = options.headers || {};
    const body = options.body;
    
    return new Promise((resolve, reject) => {
      const req = http.request(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }, (res) => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: parsed
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data
            });
          }
        });
      });
      
      req.on('error', reject);
      
      if (body) {
        req.write(JSON.stringify(body));
      }
      
      req.end();
    });
  }
  
  /**
   * Test database integration
   */
  async testDatabase(operation, collection, data) {
    const db = this.databases.get('memory');
    
    switch (operation) {
      case 'insert':
        return db.insert(collection, data);
      
      case 'find':
        return db.find(collection, data);
      
      case 'update':
        return db.update(collection, data.query, data.update);
      
      case 'delete':
        return db.delete(collection, data);
      
      default:
        throw new Error(`Unknown database operation: ${operation}`);
    }
  }
  
  /**
   * Test queue integration
   */
  async testQueue(operation, queueName, message) {
    const queue = this.queues.get('memory');
    
    switch (operation) {
      case 'send':
        return queue.send(queueName, message);
      
      case 'receive':
        return queue.receive(queueName);
      
      case 'peek':
        return queue.peek(queueName);
      
      case 'size':
        return queue.size(queueName);
      
      default:
        throw new Error(`Unknown queue operation: ${operation}`);
    }
  }
  
  /**
   * Test service connectivity
   */
  async testConnectivity(service, port) {
    return new Promise((resolve) => {
      const client = net.createConnection(port, 'localhost', () => {
        client.end();
        resolve({ connected: true, service, port });
      });
      
      client.on('error', () => {
        resolve({ connected: false, service, port });
      });
      
      setTimeout(() => {
        client.destroy();
        resolve({ connected: false, service, port, reason: 'timeout' });
      }, 5000);
    });
  }
  
  /**
   * Mock API response
   */
  mockAPIResponse(method, path, response) {
    const api = this.services.get('api');
    if (api) {
      api.responses.set(`${method} ${path}`, response);
    }
  }
  
  /**
   * Wait for condition
   */
  async waitFor(condition, timeout = 5000, interval = 100) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error('Timeout waiting for condition');
  }
  
  /**
   * Cleanup test environment
   */
  async cleanup() {
    logger.info('Cleaning up integration test environment');
    
    // Stop services
    for (const [name, service] of this.services) {
      if (service.server) {
        service.server.close();
      }
    }
    
    // Clear databases
    for (const [name, db] of this.databases) {
      if (db.clear) {
        db.clear();
      }
    }
    
    // Clear queues
    for (const [name, queue] of this.queues) {
      if (queue.clear) {
        queue.clear();
      }
    }
    
    // Clear fixtures
    this.fixtures.clear();
    
    // Clear scenarios
    this.scenarios.clear();
    
    this.emit('cleanup-complete');
  }
  
  /**
   * Generate integration test report
   */
  generateReport() {
    const report = {
      timestamp: Date.now(),
      scenarios: this.results.length,
      passed: this.results.filter(r => r.status === 'passed').length,
      failed: this.results.filter(r => r.status === 'failed').length,
      duration: this.results.reduce((sum, r) => sum + r.duration, 0),
      results: this.results,
      services: Array.from(this.services.keys()),
      databases: Array.from(this.databases.keys()),
      queues: Array.from(this.queues.keys())
    };
    
    report.passRate = report.scenarios > 0
      ? (report.passed / report.scenarios * 100).toFixed(2) + '%'
      : '0%';
    
    return report;
  }
}

// Export singleton
module.exports = new IntegrationTestHarness();