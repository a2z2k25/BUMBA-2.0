const UnifiedSpecialistBase = require('../../unified-specialist-base');
/**
 * BUMBA API Testing Specialist
 * Expert in API testing, contract testing, and API automation
 */

const SpecialistBase = require('../../specialist-base');

class APITestingSpecialist extends UnifiedSpecialistBase {
  constructor() {
    super({
      name: 'API Testing Specialist',
      expertise: ['API Testing', 'REST', 'GraphQL', 'Contract Testing', 'Postman', 'Newman', 'Pact'],
      models: ['claude-3-opus-20240229', 'gpt-4'],
      temperature: 0.3,
      systemPrompt: `You are an API testing expert specializing in:
        - RESTful API testing and validation
        - GraphQL query and mutation testing
        - Contract testing with Pact and OpenAPI
        - API automation with Postman and Newman
        - Performance and load testing for APIs
        - API security testing and validation
        - Microservices testing strategies
        - API documentation and specification testing
        Always prioritize comprehensive coverage, data integrity, and realistic test scenarios.`
    });

    this.capabilities = {
      restTesting: true,
      graphqlTesting: true,
      contractTesting: true,
      automation: true,
      performance: true,
      security: true,
      documentation: true,
      microservices: true
    };
  }

  async designAPITestStrategy(context) {
    const analysis = await this.analyze(context);
    
    return {
      strategy: this.createTestStrategy(analysis),
      suites: this.designTestSuites(analysis),
      automation: this.implementAutomation(analysis),
      contracts: this.setupContractTesting(analysis)
    };
  }

  createTestStrategy(analysis) {
    return `# API Testing Strategy for ${analysis.projectName || 'Application'}

## API Testing Pyramid

### 1. Unit API Tests (50%)
**Scope**: Individual endpoint testing, input validation, business logic
**Tools**: Jest, Supertest, TestContainers
**Frequency**: Every commit
**Coverage**: All endpoints, error conditions, edge cases

### 2. Integration API Tests (30%)
**Scope**: Service-to-service communication, database integration
**Tools**: Postman/Newman, REST Assured, Pact
**Frequency**: Every build
**Coverage**: End-to-end workflows, data consistency

### 3. Contract Tests (15%)
**Scope**: API specification compliance, backward compatibility
**Tools**: Pact, OpenAPI validators, Dredd
**Frequency**: Every deployment
**Coverage**: Consumer-provider contracts, breaking changes

### 4. End-to-End API Tests (5%)
**Scope**: Complete business scenarios, cross-service workflows
**Tools**: Custom frameworks, Cucumber API
**Frequency**: Nightly, pre-production
**Coverage**: Critical user journeys, production scenarios

## API Test Types and Coverage

### Functional Testing
- **Request/Response Validation**: HTTP methods, status codes, headers
- **Data Validation**: Schema compliance, data types, required fields
- **Business Logic**: Complex calculations, workflow validation
- **Error Handling**: Error codes, error messages, graceful degradation

### Non-Functional Testing
- **Performance**: Response times, throughput, concurrency
- **Security**: Authentication, authorization, input sanitization
- **Reliability**: Error recovery, timeout handling, retry logic
- **Scalability**: Load handling, resource utilization

### API Documentation Testing
- **Specification Compliance**: OpenAPI/Swagger validation
- **Example Accuracy**: Request/response examples testing
- **Documentation Currency**: API changes vs. documentation sync

## Test Environment Strategy

### Local Development
- Mock external dependencies
- Docker containers for databases
- Fast feedback loops
- Isolated test data

### CI/CD Pipeline
- Containerized test environments
- Service virtualization
- Parallel test execution
- Artifact collection

### Staging Environment
- Production-like infrastructure
- Real external service integration
- Performance benchmarking
- Security testing

## API Testing Tools Matrix

| Test Type | Primary Tool | Secondary Tool | Automation Level |
|-----------|--------------|----------------|------------------|
| Unit API | Jest + Supertest | Mocha + Chai | 100% |
| Integration | Postman/Newman | REST Assured | 90% |
| Contract | Pact | OpenAPI Tools | 85% |
| Performance | Artillery | K6 | 75% |
| Security | OWASP ZAP | Burp Suite | 60% |
| Documentation | Dredd | Swagger Inspector | 80% |

## Quality Gates and Metrics

### Coverage Requirements
- **Endpoint Coverage**: 100% of public APIs
- **Status Code Coverage**: All documented status codes
- **Error Path Coverage**: 80% of error scenarios
- **Schema Coverage**: All request/response schemas

### Performance Benchmarks
- **Response Time**: 95th percentile < 500ms
- **Throughput**: > 1000 requests/second
- **Error Rate**: < 0.1% under normal load
- **Availability**: 99.9% uptime

### Quality Thresholds
- **Test Pass Rate**: > 95%
- **Flaky Test Rate**: < 2%
- **Test Execution Time**: < 10 minutes
- **Code Coverage**: > 80%`;
  }

  designTestSuites(analysis) {
    return `# API Test Suite Implementation

## REST API Testing Framework

### Jest + Supertest Configuration
\`\`\`javascript
// api-tests/setup.js
const { app } = require('../src/app');
const { setupTestDatabase, teardownTestDatabase } = require('./helpers/database');
const { seedTestData } = require('./helpers/fixtures');

beforeAll(async () => {
  await setupTestDatabase();
  await seedTestData();
});

afterAll(async () => {
  await teardownTestDatabase();
});

module.exports = { app };
\`\`\`

### User Management API Tests
\`\`\`javascript
// api-tests/users.test.js
const request = require('supertest');
const { app } = require('./setup');
const { userFactory, createAuthToken } = require('./helpers/factories');

describe('Users API', () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    testUser = await userFactory.create();
    authToken = createAuthToken(testUser);
  });

  describe('GET /api/users', () => {
    test('should return list of users for authenticated admin', async () => {
      const adminUser = await userFactory.create({ role: 'admin' });
      const adminToken = createAuthToken(adminUser);

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', \`Bearer \${adminToken}\`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
      
      // Validate response schema
      expect(response.body.users[0]).toMatchObject({
        id: expect.any(String),
        email: expect.any(String),
        name: expect.any(String),
        role: expect.any(String),
        createdAt: expect.any(String)
      });
      
      // Ensure sensitive data is not exposed
      expect(response.body.users[0]).not.toHaveProperty('password');
      expect(response.body.users[0]).not.toHaveProperty('passwordHash');
    });

    test('should return 403 for non-admin users', async () => {
      await request(app)
        .get('/api/users')
        .set('Authorization', \`Bearer \${authToken}\`)
        .expect(403);
    });

    test('should return 401 for unauthenticated requests', async () => {
      await request(app)
        .get('/api/users')
        .expect(401);
    });

    test('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/users?page=1&limit=5')
        .set('Authorization', \`Bearer \${createAuthToken(await userFactory.create({ role: 'admin' }))}\`)
        .expect(200);

      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 5,
        total: expect.any(Number),
        totalPages: expect.any(Number)
      });
    });

    test('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/users?page=-1&limit=1000')
        .set('Authorization', \`Bearer \${createAuthToken(await userFactory.create({ role: 'admin' }))}\`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid pagination parameters');
    });
  });

  describe('POST /api/users', () => {
    const validUserData = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      name: 'New User',
      role: 'user'
    };

    test('should create new user with valid data', async () => {
      const adminToken = createAuthToken(await userFactory.create({ role: 'admin' }));

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', \`Bearer \${adminToken}\`)
        .send(validUserData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        email: validUserData.email,
        name: validUserData.name,
        role: validUserData.role,
        createdAt: expect.any(String)
      });

      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');

      // Verify user was actually created in database
      const createdUser = await userFactory.findById(response.body.id);
      expect(createdUser).toBeTruthy();
      expect(createdUser.email).toBe(validUserData.email);
    });

    test('should validate required fields', async () => {
      const adminToken = createAuthToken(await userFactory.create({ role: 'admin' }));

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', \`Bearer \${adminToken}\`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toContain('Email is required');
      expect(response.body.errors).toContain('Password is required');
      expect(response.body.errors).toContain('Name is required');
    });

    test('should validate email format', async () => {
      const adminToken = createAuthToken(await userFactory.create({ role: 'admin' }));

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', \`Bearer \${adminToken}\`)
        .send({ ...validUserData, email: 'invalid-email' })
        .expect(400);

      expect(response.body.errors).toContain('Invalid email format');
    });

    test('should enforce unique email constraint', async () => {
      const existingUser = await userFactory.create();
      const adminToken = createAuthToken(await userFactory.create({ role: 'admin' }));

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', \`Bearer \${adminToken}\`)
        .send({ ...validUserData, email: existingUser.email })
        .expect(409);

      expect(response.body.error).toContain('Email already exists');
    });

    test('should validate password strength', async () => {
      const adminToken = createAuthToken(await userFactory.create({ role: 'admin' }));

      const weakPasswords = ['123', 'password', 'abc123'];
      
      for (const weakPassword of weakPasswords) {
        const response = await request(app)
          .post('/api/users')
          .set('Authorization', \`Bearer \${adminToken}\`)
          .send({ ...validUserData, password: weakPassword })
          .expect(400);

        expect(response.body.errors).toContain('Password does not meet security requirements');
      }
    });
  });

  describe('GET /api/users/:id', () => {
    test('should return user details for valid ID', async () => {
      const response = await request(app)
        .get(\`/api/users/\${testUser.id}\`)
        .set('Authorization', \`Bearer \${authToken}\`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role
      });
    });

    test('should return 404 for non-existent user', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';
      
      await request(app)
        .get(\`/api/users/\${nonExistentId}\`)
        .set('Authorization', \`Bearer \${authToken}\`)
        .expect(404);
    });

    test('should return 400 for invalid user ID format', async () => {
      await request(app)
        .get('/api/users/invalid-id')
        .set('Authorization', \`Bearer \${authToken}\`)
        .expect(400);
    });
  });

  describe('PUT /api/users/:id', () => {
    test('should update user with valid data', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const response = await request(app)
        .put(\`/api/users/\${testUser.id}\`)
        .set('Authorization', \`Bearer \${authToken}\`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testUser.id,
        name: updateData.name,
        email: updateData.email,
        updatedAt: expect.any(String)
      });

      // Verify update in database
      const updatedUser = await userFactory.findById(testUser.id);
      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.email).toBe(updateData.email);
    });

    test('should prevent unauthorized user updates', async () => {
      const otherUser = await userFactory.create();
      const otherToken = createAuthToken(otherUser);

      await request(app)
        .put(\`/api/users/\${testUser.id}\`)
        .set('Authorization', \`Bearer \${otherToken}\`)
        .send({ name: 'Hacked Name' })
        .expect(403);
    });

    test('should allow admin to update any user', async () => {
      const adminToken = createAuthToken(await userFactory.create({ role: 'admin' }));

      const response = await request(app)
        .put(\`/api/users/\${testUser.id}\`)
        .set('Authorization', \`Bearer \${adminToken}\`)
        .send({ name: 'Admin Updated Name' })
        .expect(200);

      expect(response.body.name).toBe('Admin Updated Name');
    });
  });

  describe('DELETE /api/users/:id', () => {
    test('should delete user as admin', async () => {
      const userToDelete = await userFactory.create();
      const adminToken = createAuthToken(await userFactory.create({ role: 'admin' }));

      await request(app)
        .delete(\`/api/users/\${userToDelete.id}\`)
        .set('Authorization', \`Bearer \${adminToken}\`)
        .expect(204);

      // Verify user was deleted
      const deletedUser = await userFactory.findById(userToDelete.id);
      expect(deletedUser).toBeNull();
    });

    test('should prevent non-admin user deletion', async () => {
      const userToDelete = await userFactory.create();

      await request(app)
        .delete(\`/api/users/\${userToDelete.id}\`)
        .set('Authorization', \`Bearer \${authToken}\`)
        .expect(403);
    });

    test('should prevent self-deletion', async () => {
      const adminUser = await userFactory.create({ role: 'admin' });
      const adminToken = createAuthToken(adminUser);

      await request(app)
        .delete(\`/api/users/\${adminUser.id}\`)
        .set('Authorization', \`Bearer \${adminToken}\`)
        .expect(400);
    });
  });
});
\`\`\`

## GraphQL API Testing

### GraphQL Test Framework
\`\`\`javascript
// api-tests/graphql.test.js
const { graphqlHTTP } = require('express-graphql');
const request = require('supertest');
const { app } = require('./setup');

describe('GraphQL API', () => {
  describe('Users Query', () => {
    test('should fetch users with selected fields', async () => {
      const query = \`
        query GetUsers($limit: Int) {
          users(limit: $limit) {
            id
            name
            email
            createdAt
          }
        }
      \`;

      const response = await request(app)
        .post('/graphql')
        .send({
          query,
          variables: { limit: 10 }
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('users');
      expect(Array.isArray(response.body.data.users)).toBe(true);
      
      if (response.body.data.users.length > 0) {
        expect(response.body.data.users[0]).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          email: expect.any(String),
          createdAt: expect.any(String)
        });
      }
    });

    test('should handle invalid field selection', async () => {
      const query = \`
        query GetUsers {
          users {
            id
            nonExistentField
          }
        }
      \`;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('nonExistentField');
    });

    test('should enforce depth limiting', async () => {
      const deepQuery = \`
        query DeepQuery {
          users {
            posts {
              comments {
                user {
                  posts {
                    comments {
                      user {
                        id
                      }
                    }
                  }
                }
              }
            }
          }
        }
      \`;

      const response = await request(app)
        .post('/graphql')
        .send({ query: deepQuery })
        .expect(400);

      expect(response.body.errors[0].message).toContain('Query depth limit exceeded');
    });
  });

  describe('Mutations', () => {
    test('should create user via mutation', async () => {
      const mutation = \`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            name
            email
            createdAt
          }
        }
      \`;

      const variables = {
        input: {
          name: 'GraphQL User',
          email: 'graphql@example.com',
          password: 'SecurePass123!'
        }
      };

      const response = await request(app)
        .post('/graphql')
        .send({ query: mutation, variables })
        .expect(200);

      expect(response.body.data.createUser).toMatchObject({
        id: expect.any(String),
        name: variables.input.name,
        email: variables.input.email,
        createdAt: expect.any(String)
      });
    });

    test('should validate mutation input', async () => {
      const mutation = \`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      \`;

      const variables = {
        input: {
          name: '',
          email: 'invalid-email',
          password: '123'
        }
      };

      const response = await request(app)
        .post('/graphql')
        .send({ query: mutation, variables })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('validation');
    });
  });

  describe('Subscriptions', () => {
    test('should handle subscription connection', async () => {
      // This would require WebSocket testing setup
      // Using a simplified HTTP approach for demonstration
      
      const subscription = \`
        subscription UserUpdates {
          userUpdated {
            id
            name
            email
          }
        }
      \`;

      // Test subscription schema validation
      const response = await request(app)
        .post('/graphql')
        .send({ query: subscription })
        .expect(200);

      // Subscription should not execute over HTTP
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Subscriptions are only supported over WebSocket');
    });
  });

  describe('Error Handling', () => {
    test('should handle syntax errors gracefully', async () => {
      const invalidQuery = \`
        query {
          users {
            id
            name
          // Missing closing brace
        }
      \`;

      const response = await request(app)
        .post('/graphql')
        .send({ query: invalidQuery })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Syntax Error');
    });

    test('should handle runtime errors', async () => {
      const query = \`
        query GetUser($id: ID!) {
          user(id: $id) {
            id
            name
          }
        }
      \`;

      const response = await request(app)
        .post('/graphql')
        .send({
          query,
          variables: { id: 'non-existent-id' }
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('User not found');
    });
  });
});
\`\`\`

## API Performance Testing

### Load Testing with Artillery
\`\`\`yaml
# api-performance.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Load test"
    - duration: 60
      arrivalRate: 100
      name: "Stress test"
  processor: "./performance-helpers.js"

scenarios:
  - name: "API Authentication Flow"
    weight: 30
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "{{ $randomEmail() }}"
            password: "testPassword123"
          capture:
            - json: "$.token"
              as: "authToken"
      - get:
          url: "/api/user/profile"
          headers:
            Authorization: "Bearer {{ authToken }}"

  - name: "User CRUD Operations"
    weight: 40
    flow:
      - function: "generateUserData"
      - post:
          url: "/api/users"
          json:
            name: "{{ name }}"
            email: "{{ email }}"
            password: "{{ password }}"
          capture:
            - json: "$.id"
              as: "userId"
      - get:
          url: "/api/users/{{ userId }}"
      - put:
          url: "/api/users/{{ userId }}"
          json:
            name: "{{ updatedName }}"
      - delete:
          url: "/api/users/{{ userId }}"

  - name: "Search and Pagination"
    weight: 30
    flow:
      - get:
          url: "/api/users"
          qs:
            page: "{{ $randomInt(1, 10) }}"
            limit: "{{ $randomInt(5, 25) }}"
            search: "{{ $randomString() }}"
\`\`\`

This comprehensive API testing framework provides:
- Complete REST API test coverage
- GraphQL testing with query validation
- Performance testing with realistic scenarios
- Error handling and edge case testing
- Authentication and authorization testing
- Schema validation and contract testing`;
  }

  implementAutomation(analysis) {
    return `# API Test Automation

## Postman Collection Automation

### Collection Structure
\`\`\`json
{
  "info": {
    "name": "${analysis.projectName || 'API'} Test Collection",
    "description": "Comprehensive API test suite",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "{{$randomInt}}",
      "type": "string"
    },
    {
      "key": "authToken",
      "value": "",
      "type": "string"
    }
  ],
  "event": [
    {
      "listen": "prerequest",
      "script": {
        "exec": [
          "// Global setup script",
          "pm.globals.set('timestamp', new Date().toISOString());"
        ]
      }
    },
    {
      "listen": "test",
      "script": {
        "exec": [
          "// Global test script",
          "pm.test('Response time is acceptable', function () {",
          "    pm.expect(pm.response.responseTime).to.be.below(2000);",
          "});",
          "",
          "pm.test('Response has correct headers', function () {",
          "    pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json');",
          "});"
        ]
      }
    }
  ],
  "item": []
}
\`\`\`

### Authentication Test Setup
\`\`\`javascript
// Pre-request Script for Authentication
const loginRequest = {
  url: pm.environment.get('baseUrl') + '/api/auth/login',
  method: 'POST',
  header: {
    'Content-Type': 'application/json'
  },
  body: {
    mode: 'raw',
    raw: JSON.stringify({
      email: pm.environment.get('testUserEmail'),
      password: pm.environment.get('testUserPassword')
    })
  }
};

pm.sendRequest(loginRequest, function (err, response) {
  if (err) {
    console.log('Authentication failed:', err);
    return;
  }
  
  const responseJson = response.json();
  if (responseJson.token) {
    pm.environment.set('authToken', responseJson.token);
    pm.environment.set('userId', responseJson.user.id);
  }
});
\`\`\`

### Comprehensive Test Scripts
\`\`\`javascript
// User Creation Test
pm.test('Should create user successfully', function () {
  pm.response.to.have.status(201);
  
  const responseJson = pm.response.json();
  
  pm.test('Response has user ID', function () {
    pm.expect(responseJson).to.have.property('id');
    pm.expect(responseJson.id).to.be.a('string');
  });
  
  pm.test('Response has correct email', function () {
    pm.expect(responseJson.email).to.eql(pm.iterationData.get('email'));
  });
  
  pm.test('Password is not exposed', function () {
    pm.expect(responseJson).to.not.have.property('password');
    pm.expect(responseJson).to.not.have.property('passwordHash');
  });
  
  // Store user ID for subsequent tests
  pm.environment.set('createdUserId', responseJson.id);
});

// Schema Validation Test
pm.test('Response schema is valid', function () {
  const schema = {
    type: 'object',
    required: ['id', 'email', 'name', 'role', 'createdAt'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      name: { type: 'string', minLength: 1 },
      role: { type: 'string', enum: ['user', 'admin', 'moderator'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    },
    additionalProperties: false
  };
  
  pm.response.to.have.jsonSchema(schema);
});

// Error Handling Test
pm.test('Should handle validation errors', function () {
  if (pm.response.code === 400) {
    const responseJson = pm.response.json();
    
    pm.test('Error response has correct structure', function () {
      pm.expect(responseJson).to.have.property('error');
      pm.expect(responseJson).to.have.property('errors');
      pm.expect(responseJson.errors).to.be.an('array');
    });
    
    pm.test('Error messages are descriptive', function () {
      responseJson.errors.forEach(error => {
        pm.expect(error).to.be.a('string');
        pm.expect(error.length).to.be.above(10);
      });
    });
  }
});

// Rate Limiting Test
pm.test('Should handle rate limiting', function () {
  if (pm.response.code === 429) {
    pm.test('Rate limit headers are present', function () {
      pm.expect(pm.response.headers.get('X-RateLimit-Limit')).to.exist;
      pm.expect(pm.response.headers.get('X-RateLimit-Remaining')).to.exist;
      pm.expect(pm.response.headers.get('X-RateLimit-Reset')).to.exist;
    });
    
    pm.test('Retry-After header is present', function () {
      pm.expect(pm.response.headers.get('Retry-After')).to.exist;
    });
  }
});
\`\`\`

## Newman CI/CD Integration

### GitHub Actions Workflow
\`\`\`yaml
# .github/workflows/api-tests.yml
name: API Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  api-tests:
    runs-on: ubuntu-latest
    
    services:
      api:
        image: \${{ github.repository }}:latest
        ports:
          - 3000:3000
        env:
          NODE_ENV: test
          DATABASE_URL: postgres://test:test@postgres:5432/testdb
          JWT_SECRET: test-secret
        options: >-
          --health-cmd "curl -f http://localhost:3000/health"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18
        cache: 'npm'
    
    - name: Install Newman
      run: npm install -g newman newman-reporter-htmlextra
    
    - name: Wait for API to be ready
      run: |
        timeout 60 bash -c 'until curl -f http://localhost:3000/health; do sleep 2; done'
    
    - name: Run Postman Collection
      run: |
        newman run api-tests/postman-collection.json \\
          --environment api-tests/environments/test.json \\
          --reporters cli,htmlextra \\
          --reporter-htmlextra-export newman-report.html \\
          --reporter-htmlextra-darkTheme \\
          --timeout-request 30000 \\
          --delay-request 100 \\
          --ignore-redirects
    
    - name: Run Performance Tests
      run: |
        newman run api-tests/performance-collection.json \\
          --environment api-tests/environments/test.json \\
          --iteration-count 100 \\
          --reporters cli,json \\
          --reporter-json-export performance-results.json
    
    - name: Analyze Performance Results
      run: |
        node scripts/analyze-performance.js performance-results.json
    
    - name: Upload Test Reports
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: api-test-reports
        path: |
          newman-report.html
          performance-results.json
    
    - name: Comment PR with Results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          const results = JSON.parse(fs.readFileSync('performance-results.json', 'utf8'));
          
          const avgResponseTime = results.run.timings.responseAverage;
          const totalRequests = results.run.stats.requests.total;
          const failedRequests = results.run.stats.requests.failed;
          
          const comment = \`
          ## API Test Results 📊
          
          - **Total Requests**: \${totalRequests}
          - **Failed Requests**: \${failedRequests}
          - **Success Rate**: \${((totalRequests - failedRequests) / totalRequests * 100).toFixed(2)}%
          - **Average Response Time**: \${avgResponseTime}ms
          
          \${failedRequests > 0 ? '🟠️ Some tests failed. Please check the detailed report.' : '🏁 All tests passed!'}
          \`;
          
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: comment
          });
\`\`\`

### Custom Test Runner
\`\`\`javascript
// scripts/api-test-runner.js
const newman = require('newman');
const path = require('path');
const fs = require('fs').promises;

class APITestRunner {
  constructor(config) {
    this.config = config;
    this.results = {
      functional: null,
      performance: null,
      security: null
    };
  }

  async runAllTests() {
    console.log('Starting comprehensive API test suite...');
    
    try {
      // Run functional tests
      this.results.functional = await this.runFunctionalTests();
      
      // Run performance tests
      this.results.performance = await this.runPerformanceTests();
      
      // Run security tests
      this.results.security = await this.runSecurityTests();
      
      // Generate combined report
      await this.generateReport();
      
      return this.results;
    } catch (error) {
      console.error('Test execution failed:', error);
      throw error;
    }
  }

  async runFunctionalTests() {
    return new Promise((resolve, reject) => {
      newman.run({
        collection: path.join(__dirname, '../api-tests/functional-collection.json'),
        environment: path.join(__dirname, '../api-tests/environments/test.json'),
        reporters: ['cli', 'json'],
        reporter: {
          json: {
            export: path.join(__dirname, '../results/functional-results.json')
          }
        }
      }, (err, summary) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            totalTests: summary.run.stats.tests.total,
            passedTests: summary.run.stats.tests.total - summary.run.stats.tests.failed,
            failedTests: summary.run.stats.tests.failed,
            avgResponseTime: summary.run.timings.responseAverage,
            totalTime: summary.run.timings.total
          });
        }
      });
    });
  }

  async runPerformanceTests() {
    return new Promise((resolve, reject) => {
      newman.run({
        collection: path.join(__dirname, '../api-tests/performance-collection.json'),
        environment: path.join(__dirname, '../api-tests/environments/test.json'),
        iterationCount: 100,
        delayRequest: 50,
        reporters: ['json'],
        reporter: {
          json: {
            export: path.join(__dirname, '../results/performance-results.json')
          }
        }
      }, (err, summary) => {
        if (err) {
          reject(err);
        } else {
          const responseTimes = summary.run.executions.map(e => e.response.responseTime);
          
          resolve({
            totalRequests: summary.run.stats.requests.total,
            avgResponseTime: summary.run.timings.responseAverage,
            minResponseTime: Math.min(...responseTimes),
            maxResponseTime: Math.max(...responseTimes),
            p95ResponseTime: this.calculatePercentile(responseTimes, 95),
            p99ResponseTime: this.calculatePercentile(responseTimes, 99),
            throughput: summary.run.stats.requests.total / (summary.run.timings.total / 1000)
          });
        }
      });
    });
  }

  async runSecurityTests() {
    // Security tests would include authentication, authorization, input validation
    return new Promise((resolve, reject) => {
      newman.run({
        collection: path.join(__dirname, '../api-tests/security-collection.json'),
        environment: path.join(__dirname, '../api-tests/environments/test.json'),
        reporters: ['json'],
        reporter: {
          json: {
            export: path.join(__dirname, '../results/security-results.json')
          }
        }
      }, (err, summary) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            totalSecurityTests: summary.run.stats.tests.total,
            passedSecurityTests: summary.run.stats.tests.total - summary.run.stats.tests.failed,
            securityVulnerabilities: summary.run.stats.tests.failed
          });
        }
      });
    });
  }

  calculatePercentile(values, percentile) {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
      results: this.results,
      summary: {
        totalTests: this.results.functional.totalTests + this.results.security.totalSecurityTests,
        totalPassed: this.results.functional.passedTests + this.results.security.passedSecurityTests,
        overallSuccessRate: ((this.results.functional.passedTests + this.results.security.passedSecurityTests) / 
                           (this.results.functional.totalTests + this.results.security.totalSecurityTests) * 100).toFixed(2)
      }
    };

    await fs.writeFile(
      path.join(__dirname, '../results/api-test-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('API Test Report Generated:', report.summary);
  }
}

module.exports = APITestRunner;
\`\`\`

This API automation framework provides:
- Comprehensive Postman collection management
- Newman CI/CD integration
- Performance testing automation
- Security test automation
- Custom test orchestration
- Detailed reporting and analytics`;
  }

  setupContractTesting(analysis) {
    return `# API Contract Testing

## Pact Consumer-Provider Testing

### Consumer Test (Frontend/Client)
\`\`\`javascript
// tests/pact/user-api-consumer.test.js
const { Pact } = require('@pact-foundation/pact');
const { like, eachLike, term } = require('@pact-foundation/pact').Matchers;
const UserAPIClient = require('../../src/api/user-client');

describe('User API Consumer', () => {
  const provider = new Pact({
    consumer: 'Frontend App',
    provider: 'User API',
    port: 1234,
    log: path.resolve(process.cwd(), 'logs', 'pact.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    logLevel: 'INFO'
  });

  const userClient = new UserAPIClient('http://localhost:1234');

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  describe('GET /api/users', () => {
    beforeEach(() => {
      const expectedResponse = {
        users: eachLike({
          id: like('123e4567-e89b-12d3-a456-426614174000'),
          name: like('John Doe'),
          email: term({
            matcher: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}$',
            generate: 'john.doe@example.com'
          }),
          role: term({
            matcher: '^(user|admin|moderator)$',
            generate: 'user'
          }),
          createdAt: term({
            matcher: '^\\\\d{4}-\\\\d{2}-\\\\d{2}T\\\\d{2}:\\\\d{2}:\\\\d{2}\\\\.\\\\d{3}Z$',
            generate: '2024-01-15T10:30:00.000Z'
          })
        }),
        pagination: like({
          page: like(1),
          limit: like(20),
          total: like(100),
          totalPages: like(5)
        })
      };

      return provider
        .given('users exist')
        .uponReceiving('a request for users')
        .withRequest({
          method: 'GET',
          path: '/api/users',
          query: {
            page: '1',
            limit: '20'
          },
          headers: {
            'Authorization': term({
              matcher: '^Bearer [A-Za-z0-9\\\\-\\\\._~\\\\+\\\\/]+=*$',
              generate: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
            }),
            'Accept': 'application/json'
          }
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: expectedResponse
        });
    });

    test('should return list of users', async () => {
      const response = await userClient.getUsers({
        page: 1,
        limit: 20,
        authToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      });

      expect(response.users).toHaveLength(1);
      expect(response.users[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        email: expect.any(String),
        role: expect.stringMatching(/^(user|admin|moderator)$/),
        createdAt: expect.any(String)
      });
      expect(response.pagination).toMatchObject({
        page: expect.any(Number),
        limit: expect.any(Number),
        total: expect.any(Number),
        totalPages: expect.any(Number)
      });
    });
  });

  describe('POST /api/users', () => {
    beforeEach(() => {
      const userCreateRequest = {
        name: like('Jane Smith'),
        email: term({
          matcher: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}$',
          generate: 'jane.smith@example.com'
        }),
        password: like('SecurePass123!'),
        role: term({
          matcher: '^(user|admin|moderator)$',
          generate: 'user'
        })
      };

      const expectedResponse = {
        id: like('456e7890-e12b-34d5-a678-901234567890'),
        name: like('Jane Smith'),
        email: like('jane.smith@example.com'),
        role: like('user'),
        createdAt: term({
          matcher: '^\\\\d{4}-\\\\d{2}-\\\\d{2}T\\\\d{2}:\\\\d{2}:\\\\d{2}\\\\.\\\\d{3}Z$',
          generate: '2024-01-15T10:30:00.000Z'
        }),
        updatedAt: term({
          matcher: '^\\\\d{4}-\\\\d{2}-\\\\d{2}T\\\\d{2}:\\\\d{2}:\\\\d{2}\\\\.\\\\d{3}Z$',
          generate: '2024-01-15T10:30:00.000Z'
        })
      };

      return provider
        .given('user creation is allowed')
        .uponReceiving('a request to create a user')
        .withRequest({
          method: 'POST',
          path: '/api/users',
          headers: {
            'Authorization': term({
              matcher: '^Bearer [A-Za-z0-9\\\\-\\\\._~\\\\+\\\\/]+=*$',
              generate: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
            }),
            'Content-Type': 'application/json'
          },
          body: userCreateRequest
        })
        .willRespondWith({
          status: 201,
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: expectedResponse
        });
    });

    test('should create a new user', async () => {
      const userData = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: 'SecurePass123!',
        role: 'user'
      };

      const response = await userClient.createUser(userData, 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');

      expect(response).toMatchObject({
        id: expect.any(String),
        name: userData.name,
        email: userData.email,
        role: userData.role,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
      expect(response).not.toHaveProperty('password');
    });
  });

  describe('Error Scenarios', () => {
    beforeEach(() => {
      return provider
        .given('user creation fails due to validation')
        .uponReceiving('a request to create user with invalid data')
        .withRequest({
          method: 'POST',
          path: '/api/users',
          headers: {
            'Authorization': term({
              matcher: '^Bearer [A-Za-z0-9\\\\-\\\\._~\\\\+\\\\/]+=*$',
              generate: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
            }),
            'Content-Type': 'application/json'
          },
          body: {
            name: '',
            email: 'invalid-email',
            password: '123'
          }
        })
        .willRespondWith({
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: {
            error: like('Validation failed'),
            errors: eachLike('Name is required'),
            timestamp: term({
              matcher: '^\\\\d{4}-\\\\d{2}-\\\\d{2}T\\\\d{2}:\\\\d{2}:\\\\d{2}\\\\.\\\\d{3}Z$',
              generate: '2024-01-15T10:30:00.000Z'
            })
          }
        });
    });

    test('should handle validation errors', async () => {
      const invalidUserData = {
        name: '',
        email: 'invalid-email',
        password: '123'
      };

      await expect(
        userClient.createUser(invalidUserData, 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
      ).rejects.toMatchObject({
        status: 400,
        data: {
          error: expect.any(String),
          errors: expect.arrayContaining([expect.any(String)]),
          timestamp: expect.any(String)
        }
      });
    });
  });
});
\`\`\`

### Provider Test (Backend/API)
\`\`\`javascript
// tests/pact/user-api-provider.test.js
const { Verifier } = require('@pact-foundation/pact');
const path = require('path');
const { app } = require('../../src/app');
const { setupTestDatabase, teardownTestDatabase } = require('../helpers/database');
const { userFactory } = require('../helpers/factories');

describe('User API Provider', () => {
  let server;
  const port = 3001;

  beforeAll(async () => {
    await setupTestDatabase();
    server = app.listen(port);
  });

  afterAll(async () => {
    server.close();
    await teardownTestDatabase();
  });

  test('should validate the expectations of Frontend App', async () => {
    const opts = {
      provider: 'User API',
      providerBaseUrl: \`http://localhost:\${port}\`,
      pactUrls: [
        path.resolve(process.cwd(), 'pacts', 'frontend_app-user_api.json')
      ],
      publishVerificationResult: process.env.CI === 'true',
      providerVersion: process.env.GIT_COMMIT || '1.0.0',
      stateHandlers: {
        'users exist': async () => {
          // Set up test data for this state
          await userFactory.create({
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: 'user'
          });
          
          // Create additional users for pagination testing
          for (let i = 0; i < 10; i++) {
            await userFactory.create();
          }
        },
        'user creation is allowed': async () => {
          // Ensure database is in state where user creation is allowed
          // This might involve setting up permissions, clearing conflicting data, etc.
          return true;
        },
        'user creation fails due to validation': async () => {
          // Set up any necessary state for validation failure testing
          return true;
        }
      },
      requestFilter: (req, res, next) => {
        // Add authentication token for testing
        if (req.headers.authorization) {
          req.user = { id: 'test-user-id', role: 'admin' };
        }
        next();
      }
    };

    return new Verifier(opts).verifyProvider();
  });
});
\`\`\`

## OpenAPI Contract Testing

### OpenAPI Specification Validation
\`\`\`javascript
// tests/contract/openapi-validation.test.js
const OpenAPIValidator = require('express-openapi-validator');
const swaggerParser = require('@apidevtools/swagger-parser');
const request = require('supertest');
const { app } = require('../../src/app');

describe('OpenAPI Contract Validation', () => {
  let spec;

  beforeAll(async () => {
    // Load and validate OpenAPI specification
    spec = await swaggerParser.validate('./docs/api-spec.yml');
    
    // Add OpenAPI validation middleware to app
    app.use(OpenAPIValidator.middleware({
      apiSpec: './docs/api-spec.yml',
      validateRequests: true,
      validateResponses: true
    }));
  });

  describe('Request Validation', () => {
    test('should validate request body against schema', async () => {
      const invalidUser = {
        name: 123, // Should be string
        email: 'not-an-email',
        role: 'invalid-role'
      };

      const response = await request(app)
        .post('/api/users')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: expect.stringContaining('name'),
            message: expect.stringContaining('type')
          })
        ])
      );
    });

    test('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({
          page: 'not-a-number',
          limit: -5,
          sort: 'invalid-field'
        })
        .expect(400);

      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: expect.stringContaining('page')
          })
        ])
      );
    });

    test('should validate path parameters', async () => {
      const response = await request(app)
        .get('/api/users/invalid-uuid')
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('Response Validation', () => {
    test('should validate response schema compliance', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      // Response validation is handled by the middleware
      // If response doesn't match schema, middleware will throw error
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('pagination');
    });

    test('should validate error response format', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({}) // Empty body to trigger validation error
        .expect(400);

      // Verify error response matches OpenAPI error schema
      expect(response.body).toMatchObject({
        error: expect.any(String),
        errors: expect.any(Array),
        timestamp: expect.any(String)
      });
    });
  });

  describe('Security Schema Validation', () => {
    test('should require authentication for protected endpoints', async () => {
      await request(app)
        .post('/api/users')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'SecurePass123!'
        })
        .expect(401);
    });

    test('should validate JWT token format', async () => {
      await request(app)
        .post('/api/users')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'SecurePass123!'
        })
        .expect(401);
    });
  });

  describe('Content Type Validation', () => {
    test('should require correct content type for POST requests', async () => {
      await request(app)
        .post('/api/users')
        .set('Content-Type', 'text/plain')
        .send('invalid content')
        .expect(415);
    });

    test('should handle unsupported accept headers', async () => {
      await request(app)
        .get('/api/users')
        .set('Accept', 'application/xml')
        .expect(406);
    });
  });
});
\`\`\`

### Contract Testing CI/CD Integration
\`\`\`yaml
# .github/workflows/contract-tests.yml
name: Contract Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  consumer-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run Consumer Pact Tests
      run: npm run test:pact:consumer
    
    - name: Publish Pacts to Broker
      if: github.ref == 'refs/heads/main'
      run: |
        npx pact-broker publish pacts \\
          --consumer-app-version \${{ github.sha }} \\
          --broker-base-url \${{ secrets.PACT_BROKER_URL }} \\
          --broker-username \${{ secrets.PACT_BROKER_USERNAME }} \\
          --broker-password \${{ secrets.PACT_BROKER_PASSWORD }}

  provider-tests:
    runs-on: ubuntu-latest
    needs: consumer-tests
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Start API
      run: npm start &
      env:
        NODE_ENV: test
    
    - name: Wait for API
      run: npx wait-on http://localhost:3000/health
    
    - name: Run Provider Pact Tests
      run: npm run test:pact:provider
      env:
        PACT_BROKER_URL: \${{ secrets.PACT_BROKER_URL }}
        PACT_BROKER_USERNAME: \${{ secrets.PACT_BROKER_USERNAME }}
        PACT_BROKER_PASSWORD: \${{ secrets.PACT_BROKER_PASSWORD }}

  can-i-deploy:
    runs-on: ubuntu-latest
    needs: [consumer-tests, provider-tests]
    steps:
    - name: Check if safe to deploy
      run: |
        npx pact-broker can-i-deploy \\
          --pacticipant "User API" \\
          --version \${{ github.sha }} \\
          --to production \\
          --broker-base-url \${{ secrets.PACT_BROKER_URL }} \\
          --broker-username \${{ secrets.PACT_BROKER_USERNAME }} \\
          --broker-password \${{ secrets.PACT_BROKER_PASSWORD }}
\`\`\`

This contract testing framework provides:
- Consumer-driven contract testing with Pact
- OpenAPI specification validation
- Automated contract verification in CI/CD
- Breaking change detection
- Safe deployment verification
- Contract evolution management`;
  }

  async troubleshoot(issue) {
    const solutions = {
      api_test_failures: [
        'Check API endpoint availability and response formats',
        'Verify authentication tokens and permissions',
        'Review request/response schema validation',
        'Check test data setup and cleanup procedures',
        'Validate environment configuration and dependencies'
      ],
      contract_test_failures: [
        'Review consumer expectations vs provider implementation',
        'Check for breaking changes in API contracts',
        'Verify state setup in provider verification',
        'Update contract specifications for new requirements',
        'Coordinate contract changes between teams'
      ],
      performance_issues: [
        'Analyze response time distribution and outliers',
        'Check database query performance and indexing',
        'Review API caching strategies and hit rates',
        'Monitor concurrent request handling',
        'Optimize serialization and data transfer'
      ],
      authentication_problems: [
        'Verify JWT token generation and validation',
        'Check token expiration and refresh mechanisms',
        'Review OAuth flow implementation',
        'Validate API key management and rotation',
        'Test role-based access control rules'
      ]
    };
    
    return solutions[issue.type] || ['Review API documentation and test logs'];
  }
}

module.exports = APITestingSpecialist;