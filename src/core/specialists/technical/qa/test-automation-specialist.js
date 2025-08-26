const UnifiedSpecialistBase = require('../../unified-specialist-base');
/**
 * BUMBA Test Automation Specialist
 * Expert in automated testing frameworks, CI/CD integration, and test strategy
 */

const SpecialistBase = require('../../specialist-base');

class TestAutomationSpecialist extends UnifiedSpecialistBase {
  constructor() {
    super({
      name: 'Test Automation Specialist',
      expertise: ['Test Automation', 'Selenium', 'Cypress', 'Jest', 'Playwright', 'CI/CD Testing'],
      models: ['claude-3-opus-20240229', 'gpt-4'],
      temperature: 0.3,
      systemPrompt: `You are a test automation expert specializing in:
        - End-to-end test automation frameworks
        - Unit and integration testing strategies
        - CI/CD pipeline testing integration
        - Cross-browser and cross-platform testing
        - Test data management and mocking
        - Performance and load testing automation
        - Test reporting and analytics
        - BDD/TDD methodologies
        Always prioritize test reliability, maintainability, and comprehensive coverage.`
    });

    this.capabilities = {
      automation: true,
      frameworks: true,
      integration: true,
      reporting: true,
      strategy: true,
      maintenance: true,
      performance: true,
      crossPlatform: true
    };
  }

  async designTestStrategy(context) {
    const analysis = await this.analyze(context);
    
    return {
      strategy: this.createTestStrategy(analysis),
      frameworks: this.selectFrameworks(analysis),
      implementation: this.implementTests(analysis),
      integration: this.setupCIPipeline(analysis)
    };
  }

  createTestStrategy(analysis) {
    return `# Test Automation Strategy for ${analysis.projectName || 'Application'}

## Testing Pyramid

### Unit Tests (70%)
**Scope**: Individual functions, components, modules
**Tools**: Jest, Vitest, Mocha, Jasmine
**Coverage**: Business logic, utilities, data transformations
**Execution**: Fast (< 1ms per test), run on every commit

### Integration Tests (20%)
**Scope**: Component interactions, API endpoints, database operations
**Tools**: Jest + Supertest, TestContainers, Cypress component testing
**Coverage**: Service integrations, data flow, external dependencies
**Execution**: Medium speed (< 1s per test), run on pull requests

### End-to-End Tests (10%)
**Scope**: Complete user workflows, critical business paths
**Tools**: Cypress, Playwright, Selenium WebDriver
**Coverage**: User journeys, cross-browser compatibility
**Execution**: Slower (10s+ per test), run on releases

## Test Strategy Matrix

| Test Type | Framework | Environment | Frequency | Coverage Target |
|-----------|-----------|-------------|-----------|----------------|
| Unit | Jest/Vitest | Local/CI | Every commit | 80%+ |
| Integration | Jest + Supertest | Docker/CI | Every PR | 70%+ |
| E2E | Cypress/Playwright | Staging | Every release | 60%+ |
| Visual | Percy/Chromatic | CI | Every PR | Critical UI |
| API | Postman/Newman | CI | Every deployment | All endpoints |
| Performance | K6/Artillery | Staging | Weekly | Key workflows |

## Test Environment Strategy

### Local Development
- Fast unit tests with watch mode
- Mocked external dependencies
- Test database with seed data
- Hot reload for test-driven development

### CI/CD Pipeline
- Parallel test execution
- Containerized test environments
- Artifact collection (screenshots, videos)
- Test result reporting and notifications

### Staging Environment
- Production-like data and infrastructure
- Full integration testing
- Performance benchmarking
- Security testing integration

## Test Data Management

### Static Test Data
- Fixtures for consistent test scenarios
- Factory functions for object creation
- JSON/YAML configuration files
- Version-controlled test datasets

### Dynamic Test Data
- Faker.js for random data generation
- Database seeding scripts
- API mocking with realistic responses
- Cleanup strategies for test isolation

## Quality Gates

### Commit Level
- All unit tests pass
- Code coverage > 80%
- Linting and formatting checks
- No critical security vulnerabilities

### Pull Request Level
- Integration tests pass
- Visual regression tests pass
- Performance benchmarks within limits
- Code review and approval required

### Release Level
- Full E2E test suite passes
- Load testing meets requirements
- Security scans complete
- Manual QA sign-off for critical features`;
  }

  selectFrameworks(analysis) {
    return `# Test Framework Selection and Configuration

## Frontend Testing Stack

### Unit Testing - Jest + Testing Library
\`\`\`javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.js',
    '!src/reportWebVitals.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  transform: {
    '^.+\\\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  moduleNameMapping: {
    '\\\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};

// setupTests.js
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

configure({ testIdAttribute: 'data-testid' });

// Mock global objects
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
};

// Mock fetch
global.fetch = jest.fn();
\`\`\`

### Component Testing Example
\`\`\`javascript
// UserProfile.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import UserProfile from './UserProfile';

const MockUserProfile = ({ user }) => (
  <BrowserRouter>
    <UserProfile user={user} />
  </BrowserRouter>
);

describe('UserProfile Component', () => {
  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://example.com/avatar.jpg'
  };

  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders user information correctly', () => {
    render(<MockUserProfile user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByAltText('User avatar')).toHaveAttribute('src', mockUser.avatar);
  });

  test('handles edit profile interaction', async () => {
    const user = userEvent.setup();
    
    render(<MockUserProfile user={mockUser} />);
    
    const editButton = screen.getByRole('button', { name: /edit profile/i });
    await user.click(editButton);
    
    expect(screen.getByRole('form', { name: /edit profile/i })).toBeInTheDocument();
  });

  test('submits profile updates', async () => {
    const user = userEvent.setup();
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockUser, name: 'Jane Doe' })
    });
    
    render(<MockUserProfile user={mockUser} />);
    
    await user.click(screen.getByRole('button', { name: /edit profile/i }));
    
    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Jane Doe');
    
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/users/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...mockUser, name: 'Jane Doe' })
      });
    });
  });
});
\`\`\`

## Backend Testing Stack

### API Testing - Jest + Supertest
\`\`\`javascript
// api.test.js
const request = require('supertest');
const app = require('../app');
const db = require('../db');

describe('/api/users', () => {
  let authToken;
  
  beforeAll(async () => {
    await db.migrate.latest();
    await db.seed.run();
    
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password' });
    
    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await db.migrate.rollback();
    await db.destroy();
  });

  describe('GET /api/users', () => {
    test('returns list of users with authentication', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', \`Bearer \${authToken}\`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
    });

    test('returns 401 without authentication', async () => {
      await request(app)
        .get('/api/users')
        .expect(401);
    });
  });

  describe('POST /api/users', () => {
    test('creates new user with valid data', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'securePassword123',
        name: 'New User'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', \`Bearer \${authToken}\`)
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(userData.email);
      expect(response.body).not.toHaveProperty('password');
    });

    test('validates required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', \`Bearer \${authToken}\`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toContain('Email is required');
    });
  });
});
\`\`\`

## End-to-End Testing - Cypress

### Configuration
\`\`\`javascript
// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: true,
    screenshotOnRunFailure: true,
    experimentalStudio: true,
    env: {
      apiUrl: 'http://localhost:8000/api',
      testUser: {
        email: 'test@example.com',
        password: 'testPassword123'
      }
    }
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack'
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}'
  }
});

// cypress/support/commands.js
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid=email-input]').type(email);
    cy.get('[data-testid=password-input]').type(password);
    cy.get('[data-testid=login-button]').click();
    cy.url().should('not.include', '/login');
  });
});

Cypress.Commands.add('createUser', (userData) => {
  return cy.request({
    method: 'POST',
    url: \`\${Cypress.env('apiUrl')}/users\`,
    body: userData,
    headers: {
      'Authorization': \`Bearer \${window.localStorage.getItem('authToken')}\`
    }
  });
});
\`\`\`

### E2E Test Example
\`\`\`javascript
// cypress/e2e/user-management.cy.js
describe('User Management', () => {
  beforeEach(() => {
    cy.login(Cypress.env('testUser').email, Cypress.env('testUser').password);
  });

  it('should display user list', () => {
    cy.visit('/users');
    
    cy.get('[data-testid=user-list]').should('be.visible');
    cy.get('[data-testid=user-item]').should('have.length.at.least', 1);
    
    cy.get('[data-testid=user-item]').first().within(() => {
      cy.get('[data-testid=user-name]').should('not.be.empty');
      cy.get('[data-testid=user-email]').should('not.be.empty');
    });
  });

  it('should create new user', () => {
    cy.visit('/users');
    
    cy.get('[data-testid=add-user-button]').click();
    cy.url().should('include', '/users/new');
    
    const newUser = {
      name: 'Test User',
      email: \`test-\${Date.now()}@example.com\`,
      password: 'securePassword123'
    };
    
    cy.get('[data-testid=name-input]').type(newUser.name);
    cy.get('[data-testid=email-input]').type(newUser.email);
    cy.get('[data-testid=password-input]').type(newUser.password);
    
    cy.get('[data-testid=submit-button]').click();
    
    cy.url().should('include', '/users');
    cy.get('[data-testid=success-message]').should('contain', 'User created successfully');
    
    cy.get('[data-testid=user-list]').should('contain', newUser.name);
  });

  it('should handle form validation', () => {
    cy.visit('/users/new');
    
    cy.get('[data-testid=submit-button]').click();
    
    cy.get('[data-testid=name-error]').should('contain', 'Name is required');
    cy.get('[data-testid=email-error]').should('contain', 'Email is required');
  });
});
\`\`\`

## Visual Testing - Percy Integration
\`\`\`javascript
// cypress/e2e/visual-tests.cy.js
describe('Visual Regression Tests', () => {
  it('captures homepage screenshot', () => {
    cy.visit('/');
    cy.percySnapshot('Homepage');
  });

  it('captures user profile in different states', () => {
    cy.login(Cypress.env('testUser').email, Cypress.env('testUser').password);
    
    cy.visit('/profile');
    cy.percySnapshot('User Profile - Default State');
    
    cy.get('[data-testid=edit-button]').click();
    cy.percySnapshot('User Profile - Edit Mode');
  });
});
\`\`\``;
  }

  implementTests(analysis) {
    return `# Test Implementation Patterns

## Test Organization Structure
\`\`\`
tests/
├── unit/
│   ├── components/
│   ├── utils/
│   ├── services/
│   └── hooks/
├── integration/
│   ├── api/
│   ├── database/
│   └── services/
├── e2e/
│   ├── user-flows/
│   ├── admin-flows/
│   └── critical-paths/
├── fixtures/
│   ├── users.json
│   ├── products.json
│   └── orders.json
└── helpers/
    ├── test-utils.js
    ├── factories.js
    └── mocks.js
\`\`\`

## Test Utilities and Helpers

### Custom Render Function
\`\`\`javascript
// test-utils.js
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import { store } from '../src/store';
import { theme } from '../src/theme';

const AllProviders = ({ children }) => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

const customRender = (ui, options) =>
  render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
\`\`\`

### Factory Functions
\`\`\`javascript
// factories.js
import { faker } from '@faker-js/faker';

export const userFactory = (overrides = {}) => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  avatar: faker.image.avatar(),
  createdAt: faker.date.recent(),
  ...overrides
});

export const productFactory = (overrides = {}) => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: faker.commerce.productName(),
  description: faker.commerce.productDescription(),
  price: parseFloat(faker.commerce.price()),
  category: faker.commerce.department(),
  inStock: faker.datatype.boolean(),
  ...overrides
});

export const orderFactory = (overrides = {}) => ({
  id: faker.string.uuid(),
  userId: faker.number.int({ min: 1, max: 100 }),
  status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered']),
  total: parseFloat(faker.commerce.price()),
  items: [productFactory()],
  createdAt: faker.date.recent(),
  ...overrides
});
\`\`\`

### Mock Service Layer
\`\`\`javascript
// mocks/api.js
export const mockApiService = {
  users: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  products: {
    getAll: jest.fn(),
    getById: jest.fn(),
    search: jest.fn()
  },
  orders: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn()
  }
};

// Setup default mock implementations
mockApiService.users.getAll.mockResolvedValue([userFactory(), userFactory()]);
mockApiService.users.getById.mockImplementation((id) => 
  Promise.resolve(userFactory({ id }))
);
\`\`\`

## Advanced Testing Patterns

### Custom Hooks Testing
\`\`\`javascript
// useAuth.test.js
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth Hook', () => {
  test('should initialize with null user', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  test('should login user successfully', async () => {
    const { result } = renderHook(() => useAuth());
    
    const mockUser = userFactory();
    
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });
});
\`\`\`

### Error Boundary Testing
\`\`\`javascript
// ErrorBoundary.test.jsx
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  test('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  test('renders error UI when error occurs', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });
});
\`\`\`

### Async Component Testing
\`\`\`javascript
// UserList.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import UserList from './UserList';

const server = setupServer(
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.json([
      userFactory({ id: 1, name: 'John Doe' }),
      userFactory({ id: 2, name: 'Jane Smith' })
    ]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('UserList Component', () => {
  test('loads and displays users', async () => {
    render(<UserList />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  test('handles API error gracefully', async () => {
    server.use(
      rest.get('/api/users', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );
    
    render(<UserList />);
    
    await waitFor(() => {
      expect(screen.getByText(/error loading users/i)).toBeInTheDocument();
    });
  });
});
\`\`\`

## Performance Testing Integration
\`\`\`javascript
// performance.test.js
import { render } from '@testing-library/react';
import { performance } from 'perf_hooks';
import UserList from './UserList';

describe('Performance Tests', () => {
  test('UserList renders within performance budget', async () => {
    const start = performance.now();
    
    render(<UserList />);
    
    const end = performance.now();
    const renderTime = end - start;
    
    // Should render in less than 100ms
    expect(renderTime).toBeLessThan(100);
  });
});
\`\`\``;
  }

  setupCIPipeline(analysis) {
    return `# CI/CD Pipeline Integration

## GitHub Actions Workflow
\`\`\`yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit -- --coverage --watchAll=false
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
  
  integration-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js 18
      uses: actions/setup-node@v3
      with:
        node-version: 18
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Wait for services
      run: |
        npm run wait-for-services
    
    - name: Run database migrations
      run: npm run db:migrate
      env:
        DATABASE_URL: postgres://postgres:postgres@localhost:5432/testdb
    
    - name: Seed test data
      run: npm run db:seed
      env:
        DATABASE_URL: postgres://postgres:postgres@localhost:5432/testdb
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgres://postgres:postgres@localhost:5432/testdb
        REDIS_URL: redis://localhost:6379
  
  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js 18
      uses: actions/setup-node@v3
      with:
        node-version: 18
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Start application
      run: npm run start:test &
      env:
        NODE_ENV: test
    
    - name: Wait for application
      run: npx wait-on http://localhost:3000
    
    - name: Run Cypress tests
      uses: cypress-io/github-action@v5
      with:
        start: npm run start:test
        wait-on: 'http://localhost:3000'
        browser: chrome
        record: true
        parallel: true
      env:
        CYPRESS_RECORD_KEY: \${{ secrets.CYPRESS_RECORD_KEY }}
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
    
    - name: Upload test artifacts
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: cypress-screenshots
        path: cypress/screenshots
  
  visual-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
      with:
        fetch-depth: 0
    
    - name: Use Node.js 18
      uses: actions/setup-node@v3
      with:
        node-version: 18
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build Storybook
      run: npm run build-storybook
    
    - name: Run Chromatic
      uses: chromaui/action@v1
      with:
        token: \${{ secrets.GITHUB_TOKEN }}
        projectToken: \${{ secrets.CHROMATIC_PROJECT_TOKEN }}
        buildScriptName: build-storybook
\`\`\`

## Package.json Test Scripts
\`\`\`json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "cypress run",
    "test:e2e:open": "cypress open",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:performance": "lighthouse-ci autorun",
    "test:visual": "chromatic --exit-zero-on-changes",
    "wait-for-services": "wait-on tcp:5432 && wait-on tcp:6379"
  }
}
\`\`\`

## Docker Test Environment
\`\`\`dockerfile
# Dockerfile.test
FROM node:18-alpine

WORKDIR /app

# Install dependencies for Cypress
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
RUN npm ci --only=production

COPY . .

CMD ["npm", "run", "test:ci"]
\`\`\`

## Test Reporting and Analytics

### Custom Jest Reporter
\`\`\`javascript
// test-reporter.js
class CustomTestReporter {
  onRunComplete(contexts, results) {
    const { numTotalTests, numPassedTests, numFailedTests, testResults } = results;
    
    const report = {
      summary: {
        total: numTotalTests,
        passed: numPassedTests,
        failed: numFailedTests,
        coverage: results.coverageMap ? this.calculateCoverage(results.coverageMap) : null
      },
      suites: testResults.map(result => ({
        name: result.testFilePath,
        tests: result.testResults.map(test => ({
          name: test.fullName,
          status: test.status,
          duration: test.duration
        }))
      }))
    };
    
    // Send to analytics service
    this.sendToAnalytics(report);
  }
  
  calculateCoverage(coverageMap) {
    const summary = coverageMap.getCoverageSummary();
    return {
      lines: summary.lines.pct,
      functions: summary.functions.pct,
      branches: summary.branches.pct,
      statements: summary.statements.pct
    };
  }
  
  sendToAnalytics(report) {
    // Implementation for sending test metrics
    console.log('Test Report:', JSON.stringify(report, null, 2));
  }
}

module.exports = CustomTestReporter;
\`\`\`

## Monitoring and Alerts
\`\`\`javascript
// test-monitor.js
const axios = require('axios');

class TestMonitor {
  async checkTestHealth() {
    const metrics = {
      unitTestCoverage: await this.getCodeCoverage(),
      e2eTestSuccess: await this.getE2EResults(),
      buildTime: await this.getBuildMetrics()
    };
    
    // Alert if coverage drops below threshold
    if (metrics.unitTestCoverage < 80) {
      await this.sendAlert('Code coverage below 80%');
    }
    
    // Alert if E2E tests are failing
    if (metrics.e2eTestSuccess < 95) {
      await this.sendAlert('E2E test success rate below 95%');
    }
    
    return metrics;
  }
  
  async sendAlert(message) {
    await axios.post(process.env.SLACK_WEBHOOK_URL, {
      text: \`🔴 Test Alert: \${message}\`
    });
  }
}
\`\`\`

This comprehensive test automation framework provides:
- Multi-layer testing strategy
- Robust CI/CD integration
- Parallel test execution
- Visual regression testing
- Performance monitoring
- Detailed reporting and analytics
- Automated quality gates`;
  }

  async troubleshoot(issue) {
    const solutions = {
      flaky_tests: [
        'Implement proper test isolation and cleanup',
        'Use deterministic test data and timestamps',
        'Add explicit waits for async operations',
        'Mock external dependencies consistently',
        'Review test execution order dependencies'
      ],
      slow_tests: [
        'Parallelize test execution where possible',
        'Optimize database operations and queries',
        'Use test doubles for expensive operations',
        'Implement proper test data management',
        'Profile tests to identify bottlenecks'
      ],
      ci_failures: [
        'Check environment-specific configurations',
        'Verify service dependencies and health checks',
        'Review test artifacts and screenshots',
        'Ensure proper test isolation between runs',
        'Validate CI pipeline resource allocation'
      ],
      coverage_issues: [
        'Identify untested code paths',
        'Add tests for edge cases and error conditions',
        'Review excluded files and directories',
        'Implement integration tests for complex workflows',
        'Set up coverage reporting and tracking'
      ]
    };
    
    return solutions[issue.type] || ['Review test logs and framework documentation'];
  }
}

module.exports = TestAutomationSpecialist;