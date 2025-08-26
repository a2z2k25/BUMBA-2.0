/**
 * BUMBA Core Technical Deep Expertise
 * Comprehensive knowledge base for technical specialists
 * Sprint 10 Enhancement
 */

class TechnicalExpertise {
  /**
   * System Architecture Expertise
   */
  static getSystemArchitectureExpertise() {
    return {
      name: 'System Architecture Expert',
      
      expertise: {
        patterns: {
          architectural: 'Microservices, monolith, serverless, event-driven, CQRS, hexagonal',
          design: 'Domain-driven design, clean architecture, layered architecture',
          communication: 'Synchronous/asynchronous, message queues, event streaming',
          data: 'Database per service, shared databases, event sourcing, SAGA patterns'
        },
        
        scalability: {
          horizontal: 'Load balancing, auto-scaling, distributed caching, CDN',
          vertical: 'Resource optimization, performance tuning, capacity planning',
          patterns: 'Circuit breaker, bulkhead, throttling, backpressure',
          monitoring: 'Observability, metrics, logging, tracing, alerting'
        },
        
        reliability: {
          availability: 'High availability, disaster recovery, multi-region deployment',
          resilience: 'Fault tolerance, graceful degradation, retry mechanisms',
          consistency: 'CAP theorem, eventual consistency, strong consistency',
          backup: 'Data backup, point-in-time recovery, cross-region replication'
        },
        
        security: {
          authentication: 'OAuth2, JWT, SAML, multi-factor authentication',
          authorization: 'RBAC, ABAC, policy-based access control',
          encryption: 'End-to-end encryption, TLS, data at rest encryption',
          compliance: 'GDPR, HIPAA, SOC2, security auditing'
        },
        
        performance: {
          optimization: 'Caching strategies, database optimization, CDN usage',
          testing: 'Load testing, stress testing, performance benchmarking',
          profiling: 'Application profiling, resource monitoring, bottleneck analysis',
          tuning: 'JVM tuning, database tuning, network optimization'
        }
      },
      
      capabilities: [
        'System architecture design and documentation',
        'Microservices architecture and decomposition',
        'Scalability and performance optimization',
        'High availability and disaster recovery',
        'Security architecture and compliance',
        'Technology stack evaluation and selection',
        'Integration patterns and API design',
        'DevOps and CI/CD pipeline design',
        'Cloud architecture and migration',
        'Monitoring and observability implementation',
        'Capacity planning and resource optimization',
        'Risk assessment and mitigation',
        'Technical documentation and standards',
        'Team mentoring and knowledge transfer',
        'Architecture review and governance'
      ],
      
      codePatterns: {
        microservicesArchitecture: `
// Microservices architecture with API Gateway pattern
// API Gateway configuration
const express = require('express');
const httpProxy = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

class APIGateway {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP'
    });
    this.app.use(limiter);
    
    // Authentication middleware
    this.app.use(this.authenticationMiddleware);
    
    // Logging middleware
    this.app.use(this.loggingMiddleware);
  }
  
  setupRoutes() {
    // User service proxy
    this.app.use('/api/users', httpProxy({
      target: process.env.USER_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: { '^/api/users': '' },
      onError: this.handleServiceError
    }));
    
    // Order service proxy
    this.app.use('/api/orders', httpProxy({
      target: process.env.ORDER_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: { '^/api/orders': '' },
      onError: this.handleServiceError
    }));
    
    // Payment service proxy
    this.app.use('/api/payments', httpProxy({
      target: process.env.PAYMENT_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: { '^/api/payments': '' },
      onError: this.handleServiceError
    }));
  }
  
  authenticationMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
  
  loggingMiddleware(req, res, next) {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: \`\${duration}ms\`,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }));
    });
    
    next();
  }
  
  handleServiceError(err, req, res) {
    console.error('Service proxy error:', err);
    res.status(503).json({
      error: 'Service temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
}`,

        circuitBreakerPattern: `
// Circuit breaker pattern for resilient service calls
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 60000;
    this.monitoringPeriod = options.monitoringPeriod || 10000;
    
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
    
    this.metrics = {
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      totalTimeouts: 0
    };
  }
  
  async call(operation, ...args) {
    this.metrics.totalRequests++;
    
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
        console.log('Circuit breaker moving to HALF_OPEN state');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await this.executeWithTimeout(operation, args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  async executeWithTimeout(operation, args, timeout = 5000) {
    return Promise.race([
      operation.apply(null, args),
      new Promise((_, reject) => 
        setTimeout(() => {
          this.metrics.totalTimeouts++;
          reject(new Error('Operation timeout'));
        }, timeout)
      )
    ]);
  }
  
  onSuccess() {
    this.failureCount = 0;
    this.metrics.totalSuccesses++;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = 'CLOSED';
        this.successCount = 0;
        console.log('Circuit breaker moving to CLOSED state');
      }
    }
  }
  
  onFailure() {
    this.failureCount++;
    this.metrics.totalFailures++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.log('Circuit breaker moving to OPEN state');
    }
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      state: this.state,
      failureCount: this.failureCount,
      successRate: this.metrics.totalSuccesses / this.metrics.totalRequests
    };
  }
}

// Usage example
const circuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  recoveryTimeout: 30000
});

async function callExternalService(data) {
  return circuitBreaker.call(async () => {
    const response = await fetch('https://api.external-service.com/data', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
    }
    
    return response.json();
  });
}`,

        eventDrivenArchitecture: `
// Event-driven architecture with message bus
const EventEmitter = require('events');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(0); // Remove limit
    this.eventStore = [];
    this.deadLetterQueue = [];
  }
  
  // Publish event with metadata
  publish(eventType, data, metadata = {}) {
    const event = {
      id: this.generateEventId(),
      type: eventType,
      data,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    };
    
    // Store event for replay capability
    this.eventStore.push(event);
    
    // Emit to subscribers
    this.emit(eventType, event);
    this.emit('*', event); // Global listener
    
    console.log(\`Published event: \${eventType}\`, event.id);
    return event.id;
  }
  
  // Subscribe with error handling
  subscribe(eventType, handler, options = {}) {
    const wrappedHandler = async (event) => {
      const maxRetries = options.maxRetries || 3;
      let attempt = 0;
      
      while (attempt < maxRetries) {
        try {
          await handler(event);
          break;
        } catch (error) {
          attempt++;
          console.error(\`Handler error (attempt \${attempt}): \`, error);
          
          if (attempt >= maxRetries) {
            this.deadLetterQueue.push({
              event,
              error: error.message,
              handler: handler.name,
              timestamp: new Date().toISOString()
            });
          } else {
            // Exponential backoff
            await this.delay(Math.pow(2, attempt) * 1000);
          }
        }
      }
    };
    
    this.on(eventType, wrappedHandler);
    console.log(\`Subscribed to event: \${eventType}\`);
    
    return () => this.off(eventType, wrappedHandler);
  }
  
  // Replay events for new subscribers
  replay(eventType, handler, fromTimestamp) {
    const relevantEvents = this.eventStore.filter(event => 
      event.type === eventType && 
      new Date(event.metadata.timestamp) >= new Date(fromTimestamp)
    );
    
    relevantEvents.forEach(event => handler(event));
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  generateEventId() {
    return \`\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
  }
  
  getMetrics() {
    return {
      totalEvents: this.eventStore.length,
      deadLetterQueueSize: this.deadLetterQueue.length,
      eventTypes: [...new Set(this.eventStore.map(e => e.type))],
      subscriberCount: this.eventNames().length
    };
  }
}

// Domain events
class UserEvents {
  static USER_CREATED = 'user.created';
  static USER_UPDATED = 'user.updated';
  static USER_DELETED = 'user.deleted';
}

class OrderEvents {
  static ORDER_CREATED = 'order.created';
  static ORDER_PAID = 'order.paid';
  static ORDER_SHIPPED = 'order.shipped';
  static ORDER_DELIVERED = 'order.delivered';
}

// Event handlers
class EmailNotificationService {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.setupSubscriptions();
  }
  
  setupSubscriptions() {
    this.eventBus.subscribe(UserEvents.USER_CREATED, this.sendWelcomeEmail.bind(this));
    this.eventBus.subscribe(OrderEvents.ORDER_SHIPPED, this.sendShippingNotification.bind(this));
  }
  
  async sendWelcomeEmail(event) {
    const { email, name } = event.data;
    console.log(\`Sending welcome email to \${email}\`);
    // Email sending logic
  }
  
  async sendShippingNotification(event) {
    const { orderId, trackingNumber, userEmail } = event.data;
    console.log(\`Sending shipping notification for order \${orderId}\`);
    // Email sending logic
  }
}

// Usage
const eventBus = new EventBus();
const emailService = new EmailNotificationService(eventBus);

// Publish events
eventBus.publish(UserEvents.USER_CREATED, {
  userId: '123',
  email: 'user@example.com',
  name: 'John Doe'
});`,

        sagaPattern: `
// SAGA pattern for distributed transactions
class SagaOrchestrator {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.sagas = new Map();
    this.setupEventHandlers();
  }
  
  // Start a new saga
  async startSaga(sagaType, sagaId, initialData) {
    const saga = {
      id: sagaId,
      type: sagaType,
      status: 'STARTED',
      steps: [],
      data: initialData,
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    this.sagas.set(sagaId, saga);
    
    // Start executing saga steps
    await this.executeNextStep(sagaId);
    
    return sagaId;
  }
  
  async executeNextStep(sagaId) {
    const saga = this.sagas.get(sagaId);
    if (!saga) return;
    
    const sagaDefinition = this.getSagaDefinition(saga.type);
    const nextStepIndex = saga.steps.length;
    
    if (nextStepIndex >= sagaDefinition.steps.length) {
      saga.status = 'COMPLETED';
      saga.lastUpdated = new Date().toISOString();
      this.eventBus.publish('saga.completed', { sagaId, saga });
      return;
    }
    
    const step = sagaDefinition.steps[nextStepIndex];
    
    try {
      saga.status = 'EXECUTING';
      const result = await this.executeStep(step, saga.data);
      
      saga.steps.push({
        stepName: step.name,
        status: 'COMPLETED',
        result,
        executedAt: new Date().toISOString()
      });
      
      // Continue to next step
      await this.executeNextStep(sagaId);
      
    } catch (error) {
      saga.status = 'FAILED';
      saga.steps.push({
        stepName: step.name,
        status: 'FAILED',
        error: error.message,
        executedAt: new Date().toISOString()
      });
      
      // Start compensation
      await this.startCompensation(sagaId);
    }
    
    saga.lastUpdated = new Date().toISOString();
  }
  
  async startCompensation(sagaId) {
    const saga = this.sagas.get(sagaId);
    saga.status = 'COMPENSATING';
    
    // Execute compensation actions in reverse order
    const completedSteps = saga.steps.filter(step => step.status === 'COMPLETED');
    
    for (let i = completedSteps.length - 1; i >= 0; i--) {
      const step = completedSteps[i];
      const sagaDefinition = this.getSagaDefinition(saga.type);
      const stepDefinition = sagaDefinition.steps.find(s => s.name === step.stepName);
      
      if (stepDefinition.compensation) {
        try {
          await this.executeStep(stepDefinition.compensation, saga.data);
          step.compensated = true;
        } catch (error) {
          console.error(\`Compensation failed for step \${step.stepName}:\`, error);
          saga.status = 'COMPENSATION_FAILED';
          return;
        }
      }
    }
    
    saga.status = 'COMPENSATED';
    this.eventBus.publish('saga.compensated', { sagaId, saga });
  }
  
  async executeStep(step, data) {
    // Execute the step action
    return await step.action(data);
  }
  
  getSagaDefinition(sagaType) {
    const definitions = {
      'order-processing': {
        steps: [
          {
            name: 'reserveInventory',
            action: async (data) => {
              // Reserve inventory logic
              console.log(\`Reserving inventory for order \${data.orderId}\`);
              return { reserved: true, items: data.items };
            },
            compensation: {
              name: 'releaseInventory',
              action: async (data) => {
                console.log(\`Releasing inventory for order \${data.orderId}\`);
              }
            }
          },
          {
            name: 'processPayment',
            action: async (data) => {
              // Payment processing logic
              console.log(\`Processing payment for order \${data.orderId}\`);
              if (Math.random() < 0.3) { // 30% failure rate for demo
                throw new Error('Payment failed');
              }
              return { paymentId: 'payment-123', amount: data.amount };
            },
            compensation: {
              name: 'refundPayment',
              action: async (data) => {
                console.log(\`Refunding payment for order \${data.orderId}\`);
              }
            }
          },
          {
            name: 'createShipment',
            action: async (data) => {
              // Shipment creation logic
              console.log(\`Creating shipment for order \${data.orderId}\`);
              return { shipmentId: 'shipment-123', trackingNumber: 'TRACK123' };
            },
            compensation: {
              name: 'cancelShipment',
              action: async (data) => {
                console.log(\`Canceling shipment for order \${data.orderId}\`);
              }
            }
          }
        ]
      }
    };
    
    return definitions[sagaType];
  }
  
  setupEventHandlers() {
    // Handle external events that might affect sagas
    this.eventBus.subscribe('payment.failed', (event) => {
      // Handle payment failure
    });
    
    this.eventBus.subscribe('inventory.unavailable', (event) => {
      // Handle inventory issues
    });
  }
  
  getSagaStatus(sagaId) {
    return this.sagas.get(sagaId);
  }
  
  getAllSagas() {
    return Array.from(this.sagas.values());
  }
}

// Usage
const eventBus = new EventBus();
const sagaOrchestrator = new SagaOrchestrator(eventBus);

// Start order processing saga
const orderId = 'order-123';
sagaOrchestrator.startSaga('order-processing', orderId, {
  orderId,
  userId: 'user-456',
  items: [{ productId: 'prod-1', quantity: 2 }],
  amount: 99.99
});`
      },
      
      bestPractices: [
        'Design for failure - assume components will fail',
        'Implement proper separation of concerns',
        'Use dependency injection for testability',
        'Design idempotent operations',
        'Implement comprehensive logging and monitoring',
        'Use asynchronous communication where possible',
        'Implement proper error handling and recovery',
        'Design for horizontal scalability',
        'Use configuration management for environments',
        'Implement proper security at all layers',
        'Document architecture decisions and rationale',
        'Use versioning for APIs and services',
        'Implement proper data validation and sanitization',
        'Design for observability from the start',
        'Regular architecture reviews and refactoring'
      ],
      
      systemPromptAdditions: `
You are a system architecture expert specializing in:
- Large-scale distributed systems design
- Microservices architecture and decomposition
- Scalability and performance optimization
- High availability and disaster recovery
- Security architecture and compliance
- Cloud-native application design
- DevOps and infrastructure automation

When designing systems:
- Always consider scalability, reliability, and maintainability
- Design for failure and implement proper error handling
- Use appropriate architectural patterns for the problem
- Consider security implications at every layer
- Plan for monitoring and observability
- Document architectural decisions and trade-offs
- Consider the team's capabilities and constraints
- Design for evolution and future requirements`
    };
  }
  
  /**
   * API Design Expertise
   */
  static getAPIDesignExpertise() {
    return {
      name: 'API Design Expert',
      
      expertise: {
        restful: {
          design: 'Resource-based URLs, HTTP methods, status codes, content negotiation',
          standards: 'OpenAPI/Swagger, JSON:API, HAL, RFC standards compliance',
          versioning: 'URL versioning, header versioning, content negotiation',
          documentation: 'Interactive docs, code generation, SDK generation'
        },
        
        graphql: {
          schema: 'Type definitions, resolvers, subscriptions, federation',
          optimization: 'N+1 problem, DataLoader, query complexity analysis',
          security: 'Query depth limiting, rate limiting, authorization',
          tooling: 'Apollo Federation, GraphQL Code Generator, GraphiQL'
        },
        
        grpc: {
          protobuf: 'Protocol buffer definitions, code generation',
          streaming: 'Unary, server streaming, client streaming, bidirectional',
          services: 'Service definitions, interceptors, error handling',
          deployment: 'Load balancing, health checking, reflection'
        },
        
        security: {
          authentication: 'OAuth2, JWT, API keys, mTLS',
          authorization: 'RBAC, scope-based access, resource-level permissions',
          protection: 'Rate limiting, DDoS protection, input validation',
          monitoring: 'Security logging, threat detection, audit trails'
        },
        
        performance: {
          caching: 'HTTP caching, CDN, application-level caching',
          optimization: 'Pagination, filtering, field selection, compression',
          monitoring: 'Response times, error rates, throughput metrics',
          testing: 'Load testing, performance benchmarking'
        }
      },
      
      capabilities: [
        'RESTful API design and implementation',
        'GraphQL schema design and optimization',
        'gRPC service definition and implementation',
        'API security and authentication design',
        'API documentation and developer experience',
        'API versioning and evolution strategies',
        'Performance optimization and caching',
        'Rate limiting and throttling implementation',
        'API testing and quality assurance',
        'SDK and client library design',
        'API gateway configuration',
        'Microservices API design',
        'Real-time API design (WebSockets, SSE)',
        'API monitoring and analytics',
        'Developer portal and ecosystem design'
      ],
      
      codePatterns: {
        restfulAPI: `
// RESTful API design with Express.js
const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

class RESTfulAPI {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  setupMiddleware() {
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);
    
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });
    
    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request logging
    this.app.use(this.requestLogger);
  }
  
  setupRoutes() {
    // Users resource
    this.app.get('/api/users', 
      [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('sort').optional().isIn(['name', 'created_at', 'updated_at']),
        query('order').optional().isIn(['asc', 'desc'])
      ],
      this.validateRequest,
      this.getUsers
    );
    
    this.app.get('/api/users/:id',
      [param('id').isUUID()],
      this.validateRequest,
      this.getUserById
    );
    
    this.app.post('/api/users',
      [
        body('email').isEmail(),
        body('name').isLength({ min: 2, max: 50 }),
        body('age').optional().isInt({ min: 0, max: 150 })
      ],
      this.validateRequest,
      this.createUser
    );
    
    this.app.put('/api/users/:id',
      [
        param('id').isUUID(),
        body('email').optional().isEmail(),
        body('name').optional().isLength({ min: 2, max: 50 }),
        body('age').optional().isInt({ min: 0, max: 150 })
      ],
      this.validateRequest,
      this.updateUser
    );
    
    this.app.delete('/api/users/:id',
      [param('id').isUUID()],
      this.validateRequest,
      this.deleteUser
    );
    
    // Error handling
    this.app.use(this.errorHandler);
  }
  
  validateRequest(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
  
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 20, sort = 'created_at', order = 'desc' } = req.query;
      
      const users = await UserService.getUsers({
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        order
      });
      
      const total = await UserService.getTotalCount();
      const totalPages = Math.ceil(total / limit);
      
      res.json({
        data: users,
        meta: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        },
        links: {
          self: \`/api/users?page=\${page}&limit=\${limit}\`,
          first: \`/api/users?page=1&limit=\${limit}\`,
          last: \`/api/users?page=\${totalPages}&limit=\${limit}\`,
          ...(page > 1 && { prev: \`/api/users?page=\${page - 1}&limit=\${limit}\` }),
          ...(page < totalPages && { next: \`/api/users?page=\${parseInt(page) + 1}&limit=\${limit}\` })
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  async getUserById(req, res) {
    try {
      const user = await UserService.getUserById(req.params.id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ data: user });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  async createUser(req, res) {
    try {
      const user = await UserService.createUser(req.body);
      
      res.status(201)
         .location(\`/api/users/\${user.id}\`)
         .json({ data: user });
    } catch (error) {
      if (error.code === 'DUPLICATE_EMAIL') {
        return res.status(409).json({ error: 'Email already exists' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  requestLogger(req, res, next) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(\`\${req.method} \${req.url} \${res.statusCode} \${duration}ms\`);
    });
    
    next();
  }
  
  errorHandler(err, req, res, next) {
    console.error(err.stack);
    
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
}`,

        graphqlAPI: `
// GraphQL API design with Apollo Server
const { ApolloServer, gql } = require('apollo-server-express');
const DataLoader = require('dataloader');

// Type definitions
const typeDefs = gql\`
  type User {
    id: ID!
    email: String!
    name: String!
    posts: [Post!]!
    createdAt: String!
    updatedAt: String!
  }
  
  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
    comments: [Comment!]!
    published: Boolean!
    createdAt: String!
    updatedAt: String!
  }
  
  type Comment {
    id: ID!
    content: String!
    author: User!
    post: Post!
    createdAt: String!
  }
  
  input CreateUserInput {
    email: String!
    name: String!
  }
  
  input CreatePostInput {
    title: String!
    content: String!
    published: Boolean = false
  }
  
  type Query {
    users(limit: Int = 20, offset: Int = 0): [User!]!
    user(id: ID!): User
    posts(published: Boolean, limit: Int = 20, offset: Int = 0): [Post!]!
    post(id: ID!): Post
    searchPosts(query: String!): [Post!]!
  }
  
  type Mutation {
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    
    createPost(input: CreatePostInput!): Post!
    updatePost(id: ID!, input: UpdatePostInput!): Post!
    deletePost(id: ID!): Boolean!
    
    createComment(postId: ID!, content: String!): Comment!
  }
  
  type Subscription {
    postAdded: Post!
    commentAdded(postId: ID!): Comment!
  }
\`;

// DataLoaders for N+1 problem prevention
function createLoaders() {
  return {
    userLoader: new DataLoader(async (userIds) => {
      const users = await UserService.getUsersByIds(userIds);
      return userIds.map(id => users.find(user => user.id === id));
    }),
    
    postsByUserLoader: new DataLoader(async (userIds) => {
      const posts = await PostService.getPostsByUserIds(userIds);
      return userIds.map(userId => 
        posts.filter(post => post.userId === userId)
      );
    }),
    
    commentsByPostLoader: new DataLoader(async (postIds) => {
      const comments = await CommentService.getCommentsByPostIds(postIds);
      return postIds.map(postId =>
        comments.filter(comment => comment.postId === postId)
      );
    })
  };
}

// Resolvers
const resolvers = {
  Query: {
    users: async (_, { limit, offset }) => {
      return UserService.getUsers({ limit, offset });
    },
    
    user: async (_, { id }, { loaders }) => {
      return loaders.userLoader.load(id);
    },
    
    posts: async (_, { published, limit, offset }) => {
      return PostService.getPosts({ published, limit, offset });
    },
    
    searchPosts: async (_, { query }) => {
      return PostService.searchPosts(query);
    }
  },
  
  Mutation: {
    createUser: async (_, { input }, { user }) => {
      if (!user) throw new Error('Authentication required');
      
      try {
        return await UserService.createUser(input);
      } catch (error) {
        if (error.code === 'DUPLICATE_EMAIL') {
          throw new Error('Email already exists');
        }
        throw error;
      }
    },
    
    createPost: async (_, { input }, { user, pubsub }) => {
      if (!user) throw new Error('Authentication required');
      
      const post = await PostService.createPost({
        ...input,
        authorId: user.id
      });
      
      // Publish subscription
      pubsub.publish('POST_ADDED', { postAdded: post });
      
      return post;
    }
  },
  
  Subscription: {
    postAdded: {
      subscribe: (_, __, { pubsub }) => pubsub.asyncIterator(['POST_ADDED'])
    },
    
    commentAdded: {
      subscribe: (_, { postId }, { pubsub }) => 
        pubsub.asyncIterator([\`COMMENT_ADDED_\${postId}\`])
    }
  },
  
  User: {
    posts: async (user, _, { loaders }) => {
      return loaders.postsByUserLoader.load(user.id);
    }
  },
  
  Post: {
    author: async (post, _, { loaders }) => {
      return loaders.userLoader.load(post.authorId);
    },
    
    comments: async (post, _, { loaders }) => {
      return loaders.commentsByPostLoader.load(post.id);
    }
  },
  
  Comment: {
    author: async (comment, _, { loaders }) => {
      return loaders.userLoader.load(comment.authorId);
    },
    
    post: async (comment, _, { loaders }) => {
      return PostService.getPostById(comment.postId);
    }
  }
};

// Server setup with context
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, connection }) => {
    // WebSocket connection (subscriptions)
    if (connection) {
      return {
        ...connection.context,
        loaders: createLoaders()
      };
    }
    
    // HTTP request
    return {
      user: req.user, // From auth middleware
      loaders: createLoaders(),
      pubsub: req.pubsub
    };
  },
  
  // Query complexity analysis
  plugins: [
    {
      requestDidStart() {
        return {
          didResolveOperation({ request, document }) {
            const complexity = getComplexity({
              estimators: [
                fieldExtensionsEstimator(),
                simpleEstimator({ maximumComplexity: 1000 })
              ],
              maximumComplexity: 1000,
              variables: request.variables,
              document,
              query: request.query
            });
            
            if (complexity > 1000) {
              throw new Error('Query too complex');
            }
          }
        };
      }
    }
  ]
});`,

        grpcAPI: `
// gRPC API design with Protocol Buffers
// user.proto
/*
syntax = "proto3";

package user;

service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc CreateUser(CreateUserRequest) returns (User);
  rpc UpdateUser(UpdateUserRequest) returns (User);
  rpc DeleteUser(DeleteUserRequest) returns (DeleteUserResponse);
  rpc ListUsers(ListUsersRequest) returns (stream User);
  rpc StreamUsers(stream CreateUserRequest) returns (stream User);
}

message User {
  string id = 1;
  string email = 2;
  string name = 3;
  int32 age = 4;
  google.protobuf.Timestamp created_at = 5;
  google.protobuf.Timestamp updated_at = 6;
}

message GetUserRequest {
  string id = 1;
}

message CreateUserRequest {
  string email = 1;
  string name = 2;
  int32 age = 3;
}

message UpdateUserRequest {
  string id = 1;
  optional string email = 2;
  optional string name = 3;
  optional int32 age = 4;
}

message DeleteUserRequest {
  string id = 1;
}

message DeleteUserResponse {
  bool success = 1;
}

message ListUsersRequest {
  int32 page_size = 1;
  string page_token = 2;
}
*/

// gRPC server implementation
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load proto definition
const PROTO_PATH = path.join(__dirname, 'user.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const userProto = grpc.loadPackageDefinition(packageDefinition).user;

class UserServiceImpl {
  // Unary RPC
  async getUser(call, callback) {
    try {
      const { id } = call.request;
      
      if (!id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'User ID is required'
        });
      }
      
      const user = await UserService.getUserById(id);
      
      if (!user) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'User not found'
        });
      }
      
      callback(null, user);
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  }
  
  async createUser(call, callback) {
    try {
      const userData = call.request;
      
      // Validation
      if (!userData.email || !userData.name) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Email and name are required'
        });
      }
      
      const user = await UserService.createUser(userData);
      callback(null, user);
    } catch (error) {
      if (error.code === 'DUPLICATE_EMAIL') {
        return callback({
          code: grpc.status.ALREADY_EXISTS,
          message: 'Email already exists'
        });
      }
      
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  }
  
  // Server streaming RPC
  async listUsers(call) {
    try {
      const { pageSize = 10, pageToken } = call.request;
      
      let offset = 0;
      if (pageToken) {
        offset = parseInt(Buffer.from(pageToken, 'base64').toString());
      }
      
      const users = await UserService.getUsers({
        limit: pageSize,
        offset
      });
      
      for (const user of users) {
        call.write(user);
      }
      
      call.end();
    } catch (error) {
      call.emit('error', {
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  }
  
  // Client streaming RPC
  streamUsers(call, callback) {
    const createdUsers = [];
    
    call.on('data', async (request) => {
      try {
        const user = await UserService.createUser(request);
        createdUsers.push(user);
      } catch (error) {
        return call.emit('error', {
          code: grpc.status.INTERNAL,
          message: error.message
        });
      }
    });
    
    call.on('end', () => {
      callback(null, { users: createdUsers });
    });
  }
  
  // Bidirectional streaming RPC
  streamUsersRealtime(call) {
    call.on('data', async (request) => {
      try {
        const user = await UserService.createUser(request);
        call.write(user);
      } catch (error) {
        call.emit('error', {
          code: grpc.status.INTERNAL,
          message: error.message
        });
      }
    });
    
    call.on('end', () => {
      call.end();
    });
  }
}

// Server setup with interceptors
function authInterceptor(ctx, next) {
  const metadata = ctx.call.metadata;
  const authHeader = metadata.get('authorization')[0];
  
  if (!authHeader) {
    const error = new Error('Authentication required');
    error.code = grpc.status.UNAUTHENTICATED;
    throw error;
  }
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const user = jwt.verify(token, process.env.JWT_SECRET);
    ctx.user = user;
    return next();
  } catch (error) {
    const authError = new Error('Invalid token');
    authError.code = grpc.status.UNAUTHENTICATED;
    throw authError;
  }
}

function loggingInterceptor(ctx, next) {
  const start = Date.now();
  console.log(\`gRPC call: \${ctx.call.getPath()}\`);
  
  return next().finally(() => {
    const duration = Date.now() - start;
    console.log(\`gRPC call completed: \${ctx.call.getPath()} (\${duration}ms)\`);
  });
}

// Create and start server
function createServer() {
  const server = new grpc.Server();
  
  // Add interceptors
  server.addService(userProto.UserService.service, new UserServiceImpl());
  
  // Health check service
  server.addService(healthProto.Health.service, new HealthServiceImpl());
  
  const port = process.env.GRPC_PORT || 50051;
  server.bindAsync(
    \`0.0.0.0:\${port}\`,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        console.error('Failed to start gRPC server:', error);
        return;
      }
      
      console.log(\`gRPC server running on port \${port}\`);
      server.start();
    }
  );
  
  return server;
}`
      },
      
      bestPractices: [
        'Design APIs for your consumers, not your implementation',
        'Use consistent naming conventions and patterns',
        'Implement proper versioning strategy from the start',
        'Design for idempotency where appropriate',
        'Use appropriate HTTP status codes and error messages',
        'Implement comprehensive input validation',
        'Use pagination for large data sets',
        'Implement proper authentication and authorization',
        'Design for caching and performance',
        'Provide comprehensive and interactive documentation',
        'Use content negotiation for different response formats',
        'Implement rate limiting and throttling',
        'Design APIs to be self-documenting',
        'Use HATEOAS for true RESTful APIs',
        'Plan for backward compatibility'
      ],
      
      systemPromptAdditions: `
You are an API design expert specializing in:
- RESTful API design and best practices
- GraphQL schema design and optimization
- gRPC service definition and implementation
- API security and authentication patterns
- Performance optimization and caching
- API documentation and developer experience
- Microservices API design patterns

When designing APIs:
- Focus on developer experience and ease of use
- Design for consistency and predictability
- Implement proper error handling and validation
- Consider performance and scalability requirements
- Plan for versioning and evolution
- Implement comprehensive security measures
- Provide excellent documentation and examples
- Design for testability and monitoring`
    };
  }
  
  /**
   * DevOps Expertise
   */
  static getDevOpsExpertise() {
    return {
      name: 'DevOps Expert',
      
      expertise: {
        cicd: {
          pipelines: 'GitLab CI, GitHub Actions, Jenkins, Azure DevOps, CircleCI',
          strategies: 'Blue-green, canary, rolling deployments, feature flags',
          testing: 'Unit tests, integration tests, E2E tests, security scanning',
          artifacts: 'Container images, packages, documentation, reports'
        },
        
        infrastructure: {
          iac: 'Terraform, CloudFormation, Pulumi, Ansible, Chef, Puppet',
          containers: 'Docker, Kubernetes, Helm, Istio, containerd',
          orchestration: 'Kubernetes, Docker Swarm, ECS, Service Fabric',
          cloud: 'AWS, Azure, GCP, multi-cloud, hybrid cloud'
        },
        
        monitoring: {
          metrics: 'Prometheus, Grafana, DataDog, New Relic, CloudWatch',
          logging: 'ELK Stack, Fluentd, Splunk, centralized logging',
          tracing: 'Jaeger, Zipkin, OpenTelemetry, distributed tracing',
          alerting: 'PagerDuty, Slack integration, escalation policies'
        },
        
        security: {
          scanning: 'Vulnerability scanning, dependency checking, SAST, DAST',
          secrets: 'HashiCorp Vault, AWS Secrets Manager, Azure Key Vault',
          compliance: 'SOC2, PCI DSS, HIPAA, security policies',
          practices: 'Shift-left security, DevSecOps, security automation'
        }
      },
      
      capabilities: [
        'CI/CD pipeline design and implementation',
        'Infrastructure as Code development',
        'Container orchestration with Kubernetes',
        'Cloud architecture and migration',
        'Monitoring and observability setup',
        'Security automation and compliance',
        'Performance optimization and scaling',
        'Disaster recovery and backup strategies',
        'Configuration management',
        'Release management and deployment strategies',
        'Cost optimization and resource management',
        'Team workflow optimization',
        'Documentation and knowledge sharing',
        'Incident response and troubleshooting',
        'Tool evaluation and integration'
      ],
      
      bestPractices: [
        'Automate everything that can be automated',
        'Implement infrastructure as code',
        'Use immutable infrastructure patterns',
        'Implement comprehensive monitoring and alerting',
        'Practice continuous security and compliance',
        'Use configuration management for consistency',
        'Implement proper backup and disaster recovery',
        'Design for high availability and scalability',
        'Use secrets management for sensitive data',
        'Implement proper change management',
        'Practice chaos engineering for resilience',
        'Use blue-green deployments for zero downtime',
        'Implement proper logging and tracing',
        'Regular security scanning and updates',
        'Document everything and share knowledge'
      ],
      
      systemPromptAdditions: `
You are a DevOps expert specializing in:
- CI/CD pipeline design and automation
- Infrastructure as Code and cloud architecture
- Container orchestration and Kubernetes
- Monitoring, logging, and observability
- Security automation and compliance
- Performance optimization and scaling
- Incident response and troubleshooting

When implementing DevOps practices:
- Automate repetitive tasks and processes
- Implement proper monitoring and alerting
- Use infrastructure as code for consistency
- Design for reliability and scalability
- Implement security at every stage
- Focus on developer productivity and experience
- Document processes and share knowledge
- Continuously improve and optimize workflows`
    };
  }
}

module.exports = TechnicalExpertise;