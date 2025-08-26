/**
 * BUMBA Performance Testing Specialist
 * Expert in load testing, stress testing, and performance optimization
 */

const UnifiedSpecialistBase = require('../../unified-specialist-base');

class PerformanceTestingSpecialist extends UnifiedSpecialistBase {
  constructor() {
    super({
      name: 'Performance Testing Specialist',
      expertise: ['Load Testing', 'Stress Testing', 'K6', 'Artillery', 'JMeter', 'Performance Monitoring'],
      models: ['claude-3-opus-20240229', 'gpt-4'],
      temperature: 0.3,
      systemPrompt: `You are a performance testing expert specializing in:
        - Load and stress testing strategies
        - Performance test automation with K6, Artillery, JMeter
        - Web vitals and user experience metrics
        - Database and API performance testing
        - Capacity planning and scalability testing
        - Performance monitoring and alerting
        - Bottleneck identification and optimization
        - Cloud-based performance testing
        Always prioritize realistic test scenarios, accurate metrics, and actionable insights.`
    });

    this.capabilities = {
      loadTesting: true,
      stressTesting: true,
      monitoring: true,
      optimization: true,
      scalability: true,
      webVitals: true,
      automation: true,
      reporting: true
    };
  }

  async designPerformanceStrategy(context) {
    const analysis = await this.analyze(context);
    
    return {
      strategy: this.createTestStrategy(analysis),
      scenarios: this.designTestScenarios(analysis),
      implementation: this.implementTests(analysis),
      monitoring: this.setupMonitoring(analysis)
    };
  }

  createTestStrategy(analysis) {
    return `# Performance Testing Strategy for ${analysis.projectName || 'Application'}

## Performance Testing Objectives

### Key Performance Indicators (KPIs)
- **Response Time**: 95th percentile < 2 seconds
- **Throughput**: Handle ${analysis.expectedUsers || 1000} concurrent users
- **Availability**: 99.9% uptime under normal load
- **Resource Utilization**: CPU < 70%, Memory < 80%
- **Error Rate**: < 0.1% under normal conditions

### Testing Types and Scope

#### 1. Load Testing
**Purpose**: Verify system performance under expected user load
**Scope**: Normal business hours traffic simulation
**Duration**: 30-60 minutes sustained load
**Success Criteria**: All KPIs met under expected load

#### 2. Stress Testing  
**Purpose**: Determine system breaking point and recovery behavior
**Scope**: Gradual load increase until failure
**Duration**: Variable, until system fails
**Success Criteria**: Graceful degradation and recovery

#### 3. Volume Testing
**Purpose**: Test system with large amounts of data
**Scope**: Database operations, file uploads, data processing
**Duration**: 2-4 hours with large datasets
**Success Criteria**: Performance maintained with volume

#### 4. Spike Testing
**Purpose**: Test system response to sudden load increases
**Scope**: Traffic spikes during promotions, events
**Duration**: Short bursts with rapid increases
**Success Criteria**: System handles spikes without crashing

#### 5. Endurance Testing
**Purpose**: Verify system stability over extended periods
**Scope**: Memory leaks, resource cleanup, long-running processes
**Duration**: 8-24 hours continuous load
**Success Criteria**: No performance degradation over time

## Testing Environment Strategy

### Production-Like Environment
- Infrastructure matching production capacity
- Realistic data volumes and variety
- Network latency and bandwidth simulation
- Third-party service dependencies

### Test Data Management
- Anonymized production data subsets
- Synthetic data generation for scale
- Test data lifecycle management
- Data consistency across test runs

## Performance Budget Definition

### Web Application Metrics
| Metric | Target | Threshold |
|--------|--------|-----------|
| First Contentful Paint | < 1.5s | < 2.5s |
| Largest Contentful Paint | < 2.5s | < 4.0s |
| Time to Interactive | < 3.5s | < 5.0s |
| Cumulative Layout Shift | < 0.1 | < 0.25 |
| First Input Delay | < 100ms | < 300ms |

### API Performance Metrics
| Endpoint Type | Response Time | Throughput |
|---------------|---------------|------------|
| Authentication | < 500ms | 100 RPS |
| Read Operations | < 1s | 500 RPS |
| Write Operations | < 2s | 100 RPS |
| Search/Query | < 3s | 50 RPS |
| File Upload | < 10s | 10 RPS |

### Database Performance Metrics
| Operation | Target | Threshold |
|-----------|--------|-----------|
| Simple SELECT | < 50ms | < 100ms |
| Complex JOIN | < 200ms | < 500ms |
| INSERT/UPDATE | < 100ms | < 300ms |
| Bulk Operations | < 5s | < 10s |

## Risk Assessment and Mitigation

### High-Risk Areas
1. **Database Bottlenecks**
   - Connection pool exhaustion
   - Slow query performance
   - Lock contention

2. **Memory Management**
   - Memory leaks in long-running processes
   - Garbage collection overhead
   - Cache management

3. **External Dependencies**
   - Third-party API rate limits
   - Network timeouts and failures
   - Service degradation cascade

### Mitigation Strategies
- Circuit breaker patterns
- Connection pooling optimization
- Caching strategies
- Graceful degradation
- Auto-scaling policies`;
  }

  designTestScenarios(analysis) {
    return `# Performance Test Scenarios

## K6 Load Testing Implementation

### Base Configuration
\`\`\`javascript
// k6-config.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');
export const responseTime = new Trend('response_time');
export const requestCount = new Counter('requests');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 200 },   // Ramp up to 200
    { duration: '5m', target: 200 },   // Stay at 200
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],   // 95% of requests under 2s
    http_req_failed: ['rate<0.01'],      // Error rate under 1%
    errors: ['rate<0.01'],
    response_time: ['p(95)<2000'],
  },
};

export function setup() {
  // Setup test data
  const response = http.post('\${__ENV.API_URL}/auth/login', {
    email: '\${__ENV.TEST_USER_EMAIL}',
    password: '\${__ENV.TEST_USER_PASSWORD}',
  });
  
  return { token: response.json('token') };
}
\`\`\`

### Scenario 1: User Authentication Flow
\`\`\`javascript
// scenarios/auth-flow.js
import { authenticateUser, validateSession } from '../utils/auth.js';

export function authFlow() {
  const credentials = {
    email: \`user\${Math.floor(Math.random() * 1000)}@example.com\`,
    password: 'testPassword123'
  };
  
  // Register new user
  let response = http.post('\${__ENV.API_URL}/auth/register', credentials);
  check(response, {
    'registration successful': (r) => r.status === 201,
    'registration response time OK': (r) => r.timings.duration < 1000,
  });
  
  if (response.status !== 201) {
    errorRate.add(1);
    return;
  }
  
  sleep(1);
  
  // Login user
  response = http.post('\${__ENV.API_URL}/auth/login', credentials);
  check(response, {
    'login successful': (r) => r.status === 200,
    'login response time OK': (r) => r.timings.duration < 500,
    'token received': (r) => r.json('token') !== null,
  });
  
  if (response.status !== 200) {
    errorRate.add(1);
    return;
  }
  
  const token = response.json('token');
  responseTime.add(response.timings.duration);
  requestCount.add(1);
  
  sleep(2);
  
  // Validate session
  const headers = { Authorization: \`Bearer \${token}\` };
  response = http.get('\${__ENV.API_URL}/auth/me', { headers });
  check(response, {
    'session valid': (r) => r.status === 200,
    'user data returned': (r) => r.json('email') === credentials.email,
  });
  
  responseTime.add(response.timings.duration);
  requestCount.add(1);
}
\`\`\`

### Scenario 2: E-commerce User Journey
\`\`\`javascript
// scenarios/ecommerce-journey.js
export function ecommerceJourney(data) {
  const token = data.token;
  const headers = { Authorization: \`Bearer \${token}\` };
  
  // Browse products
  let response = http.get('\${__ENV.API_URL}/products?page=1&limit=20');
  check(response, {
    'products loaded': (r) => r.status === 200,
    'products response time OK': (r) => r.timings.duration < 1000,
    'products count valid': (r) => r.json('data').length > 0,
  });
  
  if (response.status !== 200) {
    errorRate.add(1);
    return;
  }
  
  const products = response.json('data');
  const randomProduct = products[Math.floor(Math.random() * products.length)];
  
  sleep(2);
  
  // View product details
  response = http.get(\`\${__ENV.API_URL}/products/\${randomProduct.id}\`);
  check(response, {
    'product details loaded': (r) => r.status === 200,
    'product details response time OK': (r) => r.timings.duration < 500,
  });
  
  sleep(3);
  
  // Add to cart
  response = http.post('\${__ENV.API_URL}/cart/items', JSON.stringify({
    productId: randomProduct.id,
    quantity: Math.floor(Math.random() * 3) + 1,
  }), { headers: { ...headers, 'Content-Type': 'application/json' }});
  
  check(response, {
    'item added to cart': (r) => r.status === 201,
    'add to cart response time OK': (r) => r.timings.duration < 800,
  });
  
  sleep(1);
  
  // View cart
  response = http.get('\${__ENV.API_URL}/cart', { headers });
  check(response, {
    'cart loaded': (r) => r.status === 200,
    'cart has items': (r) => r.json('items').length > 0,
  });
  
  // Simulate checkout process
  if (Math.random() > 0.7) { // 30% conversion rate
    response = http.post('\${__ENV.API_URL}/orders', JSON.stringify({
      paymentMethod: 'credit_card',
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345'
      }
    }), { headers: { ...headers, 'Content-Type': 'application/json' }});
    
    check(response, {
      'order created': (r) => r.status === 201,
      'order response time OK': (r) => r.timings.duration < 2000,
    });
  }
  
  responseTime.add(response.timings.duration);
  requestCount.add(1);
}
\`\`\`

### Scenario 3: API Stress Testing
\`\`\`javascript
// scenarios/api-stress.js
export const options = {
  stages: [
    { duration: '5m', target: 100 },
    { duration: '10m', target: 200 },
    { duration: '5m', target: 300 },
    { duration: '10m', target: 400 },
    { duration: '5m', target: 500 },
    { duration: '10m', target: 500 },
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.05'],
  },
};

export function stressTest(data) {
  const endpoints = [
    '/api/users',
    '/api/products',
    '/api/orders',
    '/api/analytics/dashboard',
    '/api/search'
  ];
  
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const headers = { Authorization: \`Bearer \${data.token}\` };
  
  const response = http.get(\`\${__ENV.API_URL}\${endpoint}\`, { headers });
  
  check(response, {
    'status is 200 or 429': (r) => [200, 429].includes(r.status),
    'response time acceptable': (r) => r.timings.duration < 10000,
  });
  
  if (response.status >= 400 && response.status !== 429) {
    errorRate.add(1);
  }
  
  responseTime.add(response.timings.duration);
  sleep(Math.random() * 2);
}
\`\`\`

## Artillery Load Testing Configuration

### Artillery Configuration
\`\`\`yaml
# artillery-config.yml
config:
  target: '\${API_URL}'
  phases:
    - duration: 300
      arrivalRate: 10
      name: "Warm up"
    - duration: 600
      arrivalRate: 50
      name: "Load test"
    - duration: 300
      arrivalRate: 100
      name: "Stress test"
  processor: "./test-functions.js"
  variables:
    userCount: 1000

scenarios:
  - name: "User Registration and Login"
    weight: 30
    flow:
      - post:
          url: "/auth/register"
          json:
            email: "user{{ \$randomInt(1, 1000) }}@example.com"
            password: "testPassword123"
            name: "Test User {{ \$randomInt(1, 1000) }}"
          capture:
            - json: "$.token"
              as: "authToken"
      - think: 2
      - post:
          url: "/auth/login"
          json:
            email: "{{ email }}"
            password: "testPassword123"

  - name: "Product Browsing"
    weight: 50
    flow:
      - get:
          url: "/products"
          qs:
            page: "{{ \$randomInt(1, 10) }}"
            limit: 20
      - think: 3
      - get:
          url: "/products/{{ \$randomInt(1, 100) }}"
      - think: 5

  - name: "Search and Filter"
    weight: 20
    flow:
      - get:
          url: "/search"
          qs:
            q: "{{ \$randomString() }}"
            category: "electronics"
      - think: 2
      - get:
          url: "/products"
          qs:
            category: "electronics"
            priceMin: 10
            priceMax: 500
\`\`\`

## Database Performance Testing

### Database Load Testing Script
\`\`\`javascript
// db-performance.js
import { Pool } from 'pg';
import { performance } from 'perf_hooks';

class DatabasePerformanceTest {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async runSelectTest(concurrency = 10, duration = 60000) {
    const results = [];
    const startTime = performance.now();
    const promises = [];

    for (let i = 0; i < concurrency; i++) {
      promises.push(this.selectWorker(startTime + duration));
    }

    await Promise.all(promises);
    return this.calculateMetrics(results);
  }

  async selectWorker(endTime) {
    while (performance.now() < endTime) {
      const start = performance.now();
      
      try {
        const userId = Math.floor(Math.random() * 1000) + 1;
        const result = await this.pool.query(
          'SELECT * FROM users WHERE id = \$1',
          [userId]
        );
        
        const duration = performance.now() - start;
        this.recordResult('SELECT', duration, true);
        
      } catch (error) {
        const duration = performance.now() - start;
        this.recordResult('SELECT', duration, false);
        console.error('Query error:', error.message);
      }
      
      await this.sleep(Math.random() * 100);
    }
  }

  async runInsertTest(concurrency = 5, insertCount = 1000) {
    const promises = [];
    
    for (let i = 0; i < concurrency; i++) {
      promises.push(this.insertWorker(insertCount / concurrency));
    }
    
    await Promise.all(promises);
  }

  async insertWorker(count) {
    for (let i = 0; i < count; i++) {
      const start = performance.now();
      
      try {
        await this.pool.query(
          'INSERT INTO test_data (name, email, created_at) VALUES (\$1, \$2, \$3)',
          [\`Test User \${i}\`, \`test\${i}@example.com\`, new Date()]
        );
        
        const duration = performance.now() - start;
        this.recordResult('INSERT', duration, true);
        
      } catch (error) {
        const duration = performance.now() - start;
        this.recordResult('INSERT', duration, false);
      }
    }
  }

  recordResult(operation, duration, success) {
    // Implementation for recording metrics
    console.log(\`\${operation}: \${duration.toFixed(2)}ms - \${success ? 'SUCCESS' : 'FAILURE'}\`);
  }
}
\`\`\``;
  }

  implementTests(analysis) {
    return `# Performance Test Implementation

## Frontend Performance Testing

### Lighthouse CI Configuration
\`\`\`json
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/products',
        'http://localhost:3000/checkout'
      ],
      startServerCommand: 'npm run start',
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'time-to-interactive': ['warn', { maxNumericValue: 5000 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
\`\`\`

### Web Vitals Monitoring
\`\`\`javascript
// web-vitals-monitor.js
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

class WebVitalsMonitor {
  constructor() {
    this.metrics = {};
    this.initializeMonitoring();
  }

  initializeMonitoring() {
    getCLS(this.handleMetric.bind(this));
    getFID(this.handleMetric.bind(this));
    getFCP(this.handleMetric.bind(this));
    getLCP(this.handleMetric.bind(this));
    getTTFB(this.handleMetric.bind(this));
  }

  handleMetric(metric) {
    this.metrics[metric.name] = metric;
    
    // Send to analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.value),
        event_label: metric.id,
        non_interaction: true,
      });
    }
    
    // Check thresholds
    this.checkThresholds(metric);
  }

  checkThresholds(metric) {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[metric.name];
    if (threshold) {
      let rating = 'good';
      if (metric.value > threshold.poor) {
        rating = 'poor';
      } else if (metric.value > threshold.good) {
        rating = 'needs-improvement';
      }

      console.log(\`\${metric.name}: \${metric.value} (\${rating})\`);
      
      if (rating === 'poor') {
        this.reportPerformanceIssue(metric);
      }
    }
  }

  reportPerformanceIssue(metric) {
    // Send alert to monitoring service
    fetch('/api/performance/alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    });
  }

  getMetrics() {
    return this.metrics;
  }
}

// Initialize monitoring
const monitor = new WebVitalsMonitor();
window.webVitalsMonitor = monitor;
\`\`\`

## Backend Performance Testing

### Node.js Performance Profiling
\`\`\`javascript
// performance-profiler.js
const v8Profiler = require('v8-profiler-next');
const fs = require('fs').promises;

class PerformanceProfiler {
  constructor() {
    this.profiles = new Map();
  }

  startCPUProfile(name) {
    v8Profiler.startProfiling(name, true);
    console.log(\`Started CPU profiling: \${name}\`);
  }

  async stopCPUProfile(name) {
    const profile = v8Profiler.stopProfiling(name);
    const profileData = JSON.stringify(profile);
    
    await fs.writeFile(\`./profiles/\${name}-\${Date.now()}.cpuprofile\`, profileData);
    console.log(\`Saved CPU profile: \${name}\`);
    
    profile.delete();
  }

  takeHeapSnapshot(name) {
    const snapshot = v8Profiler.takeSnapshot(name);
    snapshot.export()
      .pipe(fs.createWriteStream(\`./profiles/\${name}-\${Date.now()}.heapsnapshot\`))
      .on('finish', () => {
        console.log(\`Saved heap snapshot: \${name}\`);
        snapshot.delete();
      });
  }

  async measureExecutionTime(fn, name) {
    const start = process.hrtime.bigint();
    const result = await fn();
    const end = process.hrtime.bigint();
    
    const executionTime = Number(end - start) / 1000000; // Convert to milliseconds
    console.log(\`\${name} execution time: \${executionTime.toFixed(2)}ms\`);
    
    return { result, executionTime };
  }

  monitorMemoryUsage(interval = 5000) {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      console.log('Memory Usage:', {
        rss: \`\${Math.round(memUsage.rss / 1024 / 1024)}MB\`,
        heapTotal: \`\${Math.round(memUsage.heapTotal / 1024 / 1024)}MB\`,
        heapUsed: \`\${Math.round(memUsage.heapUsed / 1024 / 1024)}MB\`,
        external: \`\${Math.round(memUsage.external / 1024 / 1024)}MB\`
      });
    }, interval);
  }
}

module.exports = PerformanceProfiler;
\`\`\`

### API Response Time Monitoring
\`\`\`javascript
// api-performance-middleware.js
const responseTime = require('response-time');
const prometheus = require('prom-client');

// Prometheus metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_milliseconds',
  help: 'Duration of HTTP requests in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 500, 1000, 5000]
});

const httpRequestsTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

function performanceMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route ? req.route.path : req.path;
    
    // Record metrics
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(\`Slow request: \${req.method} \${route} - \${duration}ms\`);
    }
    
    // Set response time header
    res.set('X-Response-Time', \`\${duration}ms\`);
  });
  
  next();
}

module.exports = performanceMiddleware;
\`\`\`

## Load Testing Automation

### CI/CD Performance Testing
\`\`\`yaml
# .github/workflows/performance.yml
name: Performance Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * 1'  # Weekly performance tests

jobs:
  performance-tests:
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
    
    - name: Build application
      run: npm run build
    
    - name: Start application
      run: npm run start:prod &
      env:
        NODE_ENV: production
    
    - name: Wait for application
      run: npx wait-on http://localhost:3000
    
    - name: Install K6
      run: |
        curl https://github.com/grafana/k6/releases/download/v0.45.0/k6-v0.45.0-linux-amd64.tar.gz -L | tar xvz --strip-components 1
        sudo cp k6 /usr/local/bin/
    
    - name: Run K6 load tests
      run: k6 run tests/performance/load-test.js
      env:
        API_URL: http://localhost:3000
        TEST_USER_EMAIL: test@example.com
        TEST_USER_PASSWORD: testPassword123
    
    - name: Run Lighthouse CI
      run: npx lhci autorun
      env:
        LHCI_GITHUB_APP_TOKEN: \${{ secrets.LHCI_GITHUB_APP_TOKEN }}
    
    - name: Generate performance report
      run: npm run performance:report
    
    - name: Upload performance artifacts
      uses: actions/upload-artifact@v3
      with:
        name: performance-report
        path: performance-report.html
\`\`\`

This comprehensive performance testing framework provides:
- Multi-level performance testing (load, stress, volume, spike, endurance)
- Frontend and backend performance monitoring
- Automated performance testing in CI/CD
- Real-time metrics collection and alerting
- Performance budgets and thresholds
- Detailed reporting and analysis`;
  }

  setupMonitoring(analysis) {
    return `# Performance Monitoring and Alerting

## Real-time Performance Dashboard

### Grafana Dashboard Configuration
\`\`\`json
{
  "dashboard": {
    "title": "Application Performance Dashboard",
    "panels": [
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_milliseconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_milliseconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ],
        "yAxes": [
          {
            "unit": "ms",
            "max": 5000
          }
        ],
        "alert": {
          "conditions": [
            {
              "query": {
                "queryType": "",
                "refId": "A"
              },
              "reducer": {
                "type": "last",
                "params": []
              },
              "evaluator": {
                "params": [2000],
                "type": "gt"
              }
            }
          ],
          "executionErrorState": "alerting",
          "for": "5m",
          "frequency": "10s",
          "handler": 1,
          "name": "High Response Time Alert",
          "noDataState": "no_data",
          "notifications": []
        }
      },
      {
        "title": "Throughput (RPS)",
        "type": "singlestat",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[1m]))",
            "legendFormat": "Requests per second"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status_code=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100",
            "legendFormat": "Error rate %"
          }
        ],
        "thresholds": "1,5",
        "colorBackground": true
      }
    ]
  }
}
\`\`\`

### Application Performance Monitoring
\`\`\`javascript
// apm-monitor.js
const apm = require('elastic-apm-node');

class APMMonitor {
  constructor() {
    this.apm = apm.start({
      serviceName: '${analysis.projectName || 'app'}',
      secretToken: process.env.ELASTIC_APM_SECRET_TOKEN,
      serverUrl: process.env.ELASTIC_APM_SERVER_URL,
      environment: process.env.NODE_ENV,
      captureBody: 'errors',
      captureHeaders: true,
      logLevel: 'info'
    });
  }

  trackTransaction(name, type, callback) {
    const transaction = this.apm.startTransaction(name, type);
    
    return new Promise((resolve, reject) => {
      try {
        const result = callback();
        if (result instanceof Promise) {
          result
            .then(resolve)
            .catch(reject)
            .finally(() => transaction.end());
        } else {
          transaction.end();
          resolve(result);
        }
      } catch (error) {
        transaction.end();
        reject(error);
      }
    });
  }

  trackSpan(name, type, callback) {
    const span = this.apm.startSpan(name, type);
    
    try {
      const result = callback();
      if (result instanceof Promise) {
        return result.finally(() => span.end());
      } else {
        span.end();
        return result;
      }
    } catch (error) {
      span.end();
      throw error;
    }
  }

  captureError(error, metadata = {}) {
    this.apm.captureError(error, metadata);
  }

  setCustomMetrics(metrics) {
    Object.entries(metrics).forEach(([key, value]) => {
      this.apm.setCustomContext(key, value);
    });
  }
}

module.exports = APMMonitor;
\`\`\`

## Performance Alerting System

### Alert Configuration
\`\`\`javascript
// alert-manager.js
const nodemailer = require('nodemailer');
const slack = require('@slack/web-api');

class AlertManager {
  constructor() {
    this.thresholds = {
      responseTime: {
        warning: 1000,
        critical: 2000
      },
      errorRate: {
        warning: 0.01,
        critical: 0.05
      },
      throughput: {
        warning: 100,
        critical: 50
      }
    };
    
    this.alertCooldown = new Map();
  }

  async checkMetrics(metrics) {
    const alerts = [];
    
    // Check response time
    if (metrics.responseTime > this.thresholds.responseTime.critical) {
      alerts.push({
        type: 'critical',
        metric: 'responseTime',
        value: metrics.responseTime,
        threshold: this.thresholds.responseTime.critical,
        message: \`Critical: Response time \${metrics.responseTime}ms exceeds \${this.thresholds.responseTime.critical}ms\`
      });
    } else if (metrics.responseTime > this.thresholds.responseTime.warning) {
      alerts.push({
        type: 'warning',
        metric: 'responseTime',
        value: metrics.responseTime,
        threshold: this.thresholds.responseTime.warning,
        message: \`Warning: Response time \${metrics.responseTime}ms exceeds \${this.thresholds.responseTime.warning}ms\`
      });
    }
    
    // Check error rate
    if (metrics.errorRate > this.thresholds.errorRate.critical) {
      alerts.push({
        type: 'critical',
        metric: 'errorRate',
        value: metrics.errorRate,
        threshold: this.thresholds.errorRate.critical,
        message: \`Critical: Error rate \${(metrics.errorRate * 100).toFixed(2)}% exceeds \${(this.thresholds.errorRate.critical * 100)}%\`
      });
    }
    
    // Send alerts
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }
  }

  async sendAlert(alert) {
    const alertKey = \`\${alert.metric}-\${alert.type}\`;
    const now = Date.now();
    const lastAlert = this.alertCooldown.get(alertKey);
    
    // Implement cooldown to prevent spam
    if (lastAlert && (now - lastAlert) < 300000) { // 5 minutes
      return;
    }
    
    this.alertCooldown.set(alertKey, now);
    
    // Send to Slack
    await this.sendSlackAlert(alert);
    
    // Send email for critical alerts
    if (alert.type === 'critical') {
      await this.sendEmailAlert(alert);
    }
  }

  async sendSlackAlert(alert) {
    const slackClient = new slack.WebClient(process.env.SLACK_BOT_TOKEN);
    
    const color = alert.type === 'critical' ? 'danger' : 'warning';
    const emoji = alert.type === 'critical' ? '🔴' : '🟠️';
    
    await slackClient.chat.postMessage({
      channel: process.env.SLACK_CHANNEL,
      attachments: [{
        color,
        title: \`\${emoji} Performance Alert\`,
        text: alert.message,
        fields: [
          {
            title: 'Metric',
            value: alert.metric,
            short: true
          },
          {
            title: 'Current Value',
            value: alert.value.toString(),
            short: true
          },
          {
            title: 'Threshold',
            value: alert.threshold.toString(),
            short: true
          },
          {
            title: 'Timestamp',
            value: new Date().toISOString(),
            short: true
          }
        ]
      }]
    });
  }

  async sendEmailAlert(alert) {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    await transporter.sendMail({
      from: process.env.ALERT_FROM_EMAIL,
      to: process.env.ALERT_TO_EMAIL,
      subject: \`🔴 Critical Performance Alert - \${alert.metric}\`,
      html: \`
        <h2>Critical Performance Alert</h2>
        <p><strong>Metric:</strong> \${alert.metric}</p>
        <p><strong>Current Value:</strong> \${alert.value}</p>
        <p><strong>Threshold:</strong> \${alert.threshold}</p>
        <p><strong>Message:</strong> \${alert.message}</p>
        <p><strong>Timestamp:</strong> \${new Date().toISOString()}</p>
        <p>Please investigate immediately.</p>
      \`
    });
  }
}

module.exports = AlertManager;
\`\`\`

## Performance Regression Detection

### Automated Performance Comparison
\`\`\`javascript
// performance-regression.js
class PerformanceRegressionDetector {
  constructor() {
    this.baselineMetrics = null;
    this.regressionThreshold = 0.1; // 10% regression threshold
  }

  async loadBaseline(version) {
    // Load baseline metrics from storage
    const baseline = await this.fetchMetrics(version);
    this.baselineMetrics = baseline;
  }

  async detectRegression(currentMetrics) {
    if (!this.baselineMetrics) {
      throw new Error('Baseline metrics not loaded');
    }

    const regressions = [];

    const metrics = ['responseTime', 'throughput', 'errorRate'];
    
    for (const metric of metrics) {
      const baseline = this.baselineMetrics[metric];
      const current = currentMetrics[metric];
      
      let regression = 0;
      if (metric === 'errorRate') {
        regression = (current - baseline) / baseline;
      } else if (metric === 'responseTime') {
        regression = (current - baseline) / baseline;
      } else if (metric === 'throughput') {
        regression = (baseline - current) / baseline; // Lower is worse for throughput
      }

      if (regression > this.regressionThreshold) {
        regressions.push({
          metric,
          baseline,
          current,
          regression: (regression * 100).toFixed(2),
          severity: regression > 0.25 ? 'high' : 'medium'
        });
      }
    }

    return regressions;
  }

  async generateRegressionReport(regressions) {
    if (regressions.length === 0) {
      return 'No performance regressions detected.';
    }

    let report = 'Performance Regression Report\\n';
    report += '================================\\n\\n';

    for (const regression of regressions) {
      report += \`Metric: \${regression.metric}\\n\`;
      report += \`Baseline: \${regression.baseline}\\n\`;
      report += \`Current: \${regression.current}\\n\`;
      report += \`Regression: \${regression.regression}%\\n\`;
      report += \`Severity: \${regression.severity}\\n\\n\`;
    }

    return report;
  }
}

module.exports = PerformanceRegressionDetector;
\`\`\`

This monitoring system provides:
- Real-time performance dashboards
- Automated alerting for threshold breaches
- Performance regression detection
- Comprehensive metrics collection
- Integration with popular monitoring tools
- Customizable alert thresholds and cooldowns`;
  }

  async troubleshoot(issue) {
    const solutions = {
      high_response_times: [
        'Analyze slow query logs and optimize database queries',
        'Check for memory leaks and garbage collection issues',
        'Review application code for blocking operations',
        'Optimize caching strategies and hit ratios',
        'Scale infrastructure resources (CPU, memory, network)'
      ],
      low_throughput: [
        'Check for connection pool exhaustion',
        'Review load balancer configuration and health checks',
        'Optimize application code for concurrency',
        'Verify network bandwidth and latency',
        'Scale out application instances'
      ],
      high_error_rates: [
        'Review application logs for error patterns',
        'Check database connection limits and timeouts',
        'Verify external service dependencies',
        'Review rate limiting and circuit breaker configurations',
        'Check for resource exhaustion (memory, disk, CPU)'
      ],
      performance_regression: [
        'Compare current deployment with baseline metrics',
        'Review recent code changes and deployments',
        'Check for configuration changes in infrastructure',
        'Verify third-party service performance',
        'Rollback to previous version if necessary'
      ]
    };
    
    return solutions[issue.type] || ['Review performance metrics and system logs'];
  }
}

module.exports = PerformanceTestingSpecialist;