/**
 * BUMBA Lite Mode - Sprint 2: Lightweight Specialist Implementation
 * 
 * Ultra-lightweight specialists with minimal memory footprint
 * Total target: <30KB for all specialists combined
 */

/**
 * Base class for all Lite specialists
 * Minimal overhead, maximum efficiency
 */
class LiteSpecialist {
  constructor(type, capabilities) {
    this.type = type;
    this.capabilities = capabilities;
    this.cache = new Map(); // Simple cache, max 10 entries
    this.metrics = { calls: 0, avgTime: 0 };
  }

  async execute(task, context = {}) {
    const start = Date.now();
    this.metrics.calls++;
    
    // Check cache first
    const cacheKey = `${task.type || 'general'}_${task.prompt?.substring(0, 50)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // Execute based on capability
    const result = await this.process(task, context);
    
    // Update metrics
    const duration = Date.now() - start;
    this.metrics.avgTime = (this.metrics.avgTime * (this.metrics.calls - 1) + duration) / this.metrics.calls;
    
    // Cache result (limit size)
    if (this.cache.size >= 10) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(cacheKey, result);
    
    return result;
  }
  
  async process(task, context) {
    // Override in subclasses
    throw new Error('process() must be implemented by specialist');
  }
  
  hasCapability(capability) {
    return this.capabilities.includes(capability);
  }
  
  getMemoryUsage() {
    // Approximate memory usage in KB
    return this.cache.size * 2 + 4; // Base overhead + cache
  }
}

/**
 * Lite Designer - UI/UX capabilities
 * Replaces: ui-designer, ux-researcher, css-specialist
 */
class LiteDesigner extends LiteSpecialist {
  constructor() {
    super('designer', ['ui-design', 'components', 'layouts', 'responsive', 'css', 'accessibility']);
  }
  
  async process(task, context) {
    const { prompt, type = 'component' } = task;
    
    switch (type) {
      case 'component':
        return this.generateComponent(prompt);
      case 'layout':
        return this.generateLayout(prompt);
      case 'style':
        return this.generateStyles(prompt);
      default:
        return this.generateDesign(prompt);
    }
  }
  
  generateComponent(prompt) {
    return {
      success: true,
      type: 'component',
      output: `
// ${prompt} Component
import React from 'react';
import './styles.css';

const Component = ({ children, ...props }) => {
  return (
    <div className="component" {...props}>
      {children}
    </div>
  );
};

export default Component;`,
      styles: `
.component {
  padding: 1rem;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}`
    };
  }
  
  generateLayout(prompt) {
    return {
      success: true,
      type: 'layout',
      output: `
<div class="container">
  <header class="header">Header</header>
  <nav class="sidebar">Navigation</nav>
  <main class="content">Main Content</main>
  <footer class="footer">Footer</footer>
</div>`,
      styles: `
.container {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar content"
    "footer footer";
  grid-template-columns: 200px 1fr;
  min-height: 100vh;
}`
    };
  }
  
  generateStyles(prompt) {
    return {
      success: true,
      type: 'styles',
      output: `
/* Modern CSS for ${prompt} */
:root {
  --primary: #007bff;
  --secondary: #6c757d;
  --spacing: 1rem;
}

.element {
  padding: var(--spacing);
  color: var(--primary);
  transition: all 0.3s ease;
}

@media (max-width: 768px) {
  .element {
    padding: calc(var(--spacing) / 2);
  }
}`
    };
  }
  
  generateDesign(prompt) {
    return {
      success: true,
      type: 'design',
      output: `Design system for "${prompt}" created`,
      components: ['Button', 'Card', 'Form', 'Modal'],
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
        success: '#28a745'
      }
    };
  }
}

/**
 * Lite Engineer - Backend/API capabilities
 * Replaces: backend-engineer, api-developer, database-specialist
 */
class LiteEngineer extends LiteSpecialist {
  constructor() {
    super('engineer', ['api', 'database', 'logic', 'integration', 'auth', 'validation']);
  }
  
  async process(task, context) {
    const { prompt, type = 'api' } = task;
    
    switch (type) {
      case 'api':
        return this.generateAPI(prompt);
      case 'database':
        return this.generateDatabase(prompt);
      case 'logic':
        return this.generateBusinessLogic(prompt);
      default:
        return this.generateBackend(prompt);
    }
  }
  
  generateAPI(prompt) {
    return {
      success: true,
      type: 'api',
      output: `
// Express API for ${prompt}
const express = require('express');
const router = express.Router();

// GET endpoint
router.get('/', async (req, res) => {
  try {
    const data = await fetchData();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST endpoint
router.post('/', async (req, res) => {
  try {
    const result = await createItem(req.body);
    res.status(201).json({ success: true, result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;`
    };
  }
  
  generateDatabase(prompt) {
    return {
      success: true,
      type: 'database',
      output: `
// Database schema for ${prompt}
const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  data: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

Schema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Model', Schema);`
    };
  }
  
  generateBusinessLogic(prompt) {
    return {
      success: true,
      type: 'logic',
      output: `
// Business logic for ${prompt}
class Service {
  async process(input) {
    // Validate input
    if (!this.validate(input)) {
      throw new Error('Invalid input');
    }
    
    // Process data
    const processed = await this.transform(input);
    
    // Apply business rules
    const result = this.applyRules(processed);
    
    return result;
  }
  
  validate(input) {
    return input && typeof input === 'object';
  }
  
  async transform(input) {
    return { ...input, processed: true };
  }
  
  applyRules(data) {
    return { ...data, timestamp: Date.now() };
  }
}

module.exports = Service;`
    };
  }
  
  generateBackend(prompt) {
    return {
      success: true,
      type: 'backend',
      output: `Complete backend for "${prompt}"`,
      files: {
        'server.js': '// Express server',
        'routes/api.js': '// API routes',
        'models/index.js': '// Database models',
        'services/index.js': '// Business logic'
      }
    };
  }
}

/**
 * Lite Strategist - Planning/Architecture capabilities
 * Replaces: product-manager, business-analyst, architect
 */
class LiteStrategist extends LiteSpecialist {
  constructor() {
    super('strategist', ['planning', 'requirements', 'architecture', 'decisions', 'roadmap']);
  }
  
  async process(task, context) {
    const { prompt, type = 'plan' } = task;
    
    switch (type) {
      case 'requirements':
        return this.generateRequirements(prompt);
      case 'architecture':
        return this.generateArchitecture(prompt);
      default:
        return this.generatePlan(prompt);
    }
  }
  
  generateRequirements(prompt) {
    return {
      success: true,
      type: 'requirements',
      output: {
        functional: [
          `User can ${prompt}`,
          'System validates input',
          'Data is persisted',
          'User receives feedback'
        ],
        nonFunctional: [
          'Response time < 200ms',
          '99.9% uptime',
          'Supports 1000 concurrent users',
          'WCAG 2.1 compliant'
        ],
        constraints: [
          'Must use existing infrastructure',
          'Budget: $10,000',
          'Timeline: 4 weeks'
        ]
      }
    };
  }
  
  generateArchitecture(prompt) {
    return {
      success: true,
      type: 'architecture',
      output: {
        layers: {
          presentation: 'React/Vue frontend',
          application: 'Node.js/Express API',
          data: 'MongoDB/PostgreSQL',
          infrastructure: 'AWS/Docker'
        },
        patterns: [
          'MVC architecture',
          'RESTful API design',
          'Repository pattern',
          'Dependency injection'
        ],
        scalability: 'Horizontal scaling with load balancer'
      }
    };
  }
  
  generatePlan(prompt) {
    return {
      success: true,
      type: 'plan',
      output: {
        phases: [
          { phase: 1, task: 'Requirements gathering', duration: '1 week' },
          { phase: 2, task: 'Design & Architecture', duration: '1 week' },
          { phase: 3, task: 'Implementation', duration: '2 weeks' },
          { phase: 4, task: 'Testing & Deployment', duration: '1 week' }
        ],
        milestones: [
          'Requirements approved',
          'Design complete',
          'MVP ready',
          'Production deployment'
        ],
        risks: [
          'Scope creep',
          'Technical complexity',
          'Resource availability'
        ]
      }
    };
  }
}

/**
 * Lite Frontend - React/Vue capabilities
 * Replaces: react-specialist, vue-specialist, angular-specialist
 */
class LiteFrontend extends LiteSpecialist {
  constructor() {
    super('frontend', ['react', 'vue', 'components', 'state-management', 'routing', 'hooks']);
  }
  
  async process(task, context) {
    const { prompt, framework = 'react' } = task;
    
    if (framework === 'vue') {
      return this.generateVue(prompt);
    }
    return this.generateReact(prompt);
  }
  
  generateReact(prompt) {
    return {
      success: true,
      type: 'react',
      output: `
// React component for ${prompt}
import React, { useState, useEffect } from 'react';

const ${this.toPascalCase(prompt)} = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="container">
      <h1>${prompt}</h1>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
};

export default ${this.toPascalCase(prompt)};`
    };
  }
  
  generateVue(prompt) {
    return {
      success: true,
      type: 'vue',
      output: `
<!-- Vue component for ${prompt} -->
<template>
  <div class="container">
    <h1>{{ title }}</h1>
    <div v-if="loading">Loading...</div>
    <pre v-else>{{ data }}</pre>
  </div>
</template>

<script>
export default {
  name: '${this.toPascalCase(prompt)}',
  data() {
    return {
      title: '${prompt}',
      data: null,
      loading: true
    };
  },
  async mounted() {
    await this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        const response = await fetch('/api/data');
        this.data = await response.json();
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>`
    };
  }
  
  toPascalCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
      word.toUpperCase()).replace(/\s+/g, '');
  }
}

/**
 * Lite Tester - Testing/QA capabilities
 * Replaces: test-engineer, qa-specialist, error-detective
 */
class LiteTester extends LiteSpecialist {
  constructor() {
    super('tester', ['unit-tests', 'integration', 'validation', 'debugging', 'coverage']);
  }
  
  async process(task, context) {
    const { prompt, type = 'unit' } = task;
    
    switch (type) {
      case 'integration':
        return this.generateIntegrationTests(prompt);
      case 'e2e':
        return this.generateE2ETests(prompt);
      default:
        return this.generateUnitTests(prompt);
    }
  }
  
  generateUnitTests(prompt) {
    return {
      success: true,
      type: 'unit-tests',
      output: `
// Unit tests for ${prompt}
describe('${prompt}', () => {
  let instance;
  
  beforeEach(() => {
    instance = new ${this.toPascalCase(prompt)}();
  });
  
  test('should initialize correctly', () => {
    expect(instance).toBeDefined();
  });
  
  test('should handle valid input', () => {
    const result = instance.process({ valid: true });
    expect(result.success).toBe(true);
  });
  
  test('should reject invalid input', () => {
    expect(() => {
      instance.process({ valid: false });
    }).toThrow('Invalid input');
  });
  
  test('should return expected output', () => {
    const result = instance.process({ data: 'test' });
    expect(result).toHaveProperty('data');
    expect(result.data).toBe('test');
  });
});`
    };
  }
  
  generateIntegrationTests(prompt) {
    return {
      success: true,
      type: 'integration-tests',
      output: `
// Integration tests for ${prompt}
describe('${prompt} Integration', () => {
  test('API endpoint responds correctly', async () => {
    const response = await request(app)
      .get('/api/${prompt.toLowerCase()}')
      .expect(200);
    
    expect(response.body).toHaveProperty('success', true);
  });
  
  test('Database operations work', async () => {
    const item = await Model.create({ name: 'test' });
    expect(item.id).toBeDefined();
    
    const found = await Model.findById(item.id);
    expect(found.name).toBe('test');
  });
});`
    };
  }
  
  generateE2ETests(prompt) {
    return {
      success: true,
      type: 'e2e-tests',
      output: `
// E2E tests for ${prompt}
describe('${prompt} E2E', () => {
  test('Complete user flow', async () => {
    await page.goto('http://localhost:3000');
    await page.click('[data-testid="start"]');
    await page.type('input[name="data"]', 'test input');
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('[data-testid="result"]');
    const result = await page.$eval('[data-testid="result"]', el => el.textContent);
    expect(result).toContain('Success');
  });
});`
    };
  }
  
  toPascalCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
      word.toUpperCase()).replace(/\s+/g, '');
  }
}

/**
 * Lite Specialist Factory
 * Creates and manages lite specialists
 */
class LiteSpecialistFactory {
  constructor() {
    this.specialists = new Map();
    this.initializeSpecialists();
  }
  
  initializeSpecialists() {
    this.specialists.set('designer', new LiteDesigner());
    this.specialists.set('engineer', new LiteEngineer());
    this.specialists.set('strategist', new LiteStrategist());
    this.specialists.set('frontend', new LiteFrontend());
    this.specialists.set('tester', new LiteTester());
  }
  
  get(type) {
    return this.specialists.get(type);
  }
  
  getAll() {
    return Array.from(this.specialists.values());
  }
  
  getMemoryUsage() {
    let total = 0;
    this.specialists.forEach(specialist => {
      total += specialist.getMemoryUsage();
    });
    return total;
  }
  
  getMetrics() {
    const metrics = {};
    this.specialists.forEach((specialist, type) => {
      metrics[type] = specialist.metrics;
    });
    return metrics;
  }
}

// Export classes
module.exports = {
  LiteSpecialist,
  LiteDesigner,
  LiteEngineer,
  LiteStrategist,
  LiteFrontend,
  LiteTester,
  LiteSpecialistFactory
};