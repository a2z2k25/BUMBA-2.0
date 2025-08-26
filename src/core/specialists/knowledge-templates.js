/**
 * BUMBA Specialist Knowledge Templates
 * Reusable knowledge patterns for making specialists operational
 */

class SpecialistKnowledgeTemplates {
  constructor() {
    this.templates = {
      technical: this.getTechnicalTemplates(),
      experience: this.getExperienceTemplates(),
      strategic: this.getStrategicTemplates(),
      database: this.getDatabaseTemplates(),
      devops: this.getDevOpsTemplates(),
      languages: this.getLanguageTemplates()
    };
  }
  
  /**
   * Get knowledge template for a specific specialist
   */
  getTemplate(specialistType, category) {
    // Try to load enhanced expertise first
    const expertise = this.loadEnhancedExpertise(specialistType);
    if (expertise) return expertise;
    
    // Direct specialist mapping
    const directTemplates = {
      'javascript-specialist': this.getJavaScriptTemplate(),
      'typescript-specialist': this.getTypeScriptTemplate(),
      'python-specialist': this.getPythonSpecialistTemplate(),
      'java-specialist': this.getJavaSpecialistTemplate(),
      'c-specialist': this.getCppSpecialistTemplate(),
      'cpp-specialist': this.getCppSpecialistTemplate(),
      'csharp-specialist': this.getCSharpSpecialistTemplate(),
      'golang-specialist': this.getGoSpecialistTemplate(),
      'ruby-specialist': this.getRubySpecialistTemplate(),
      'php-specialist': this.getPHPSpecialistTemplate(),
      'swift-specialist': this.getSwiftSpecialistTemplate(),
      'kotlin-specialist': this.getKotlinSpecialistTemplate(),
      'rust-specialist': this.getRustSpecialistTemplate(),
      'elixir-specialist': this.getElixirSpecialistTemplate(),
      'postgresql-specialist': this.getPostgreSQLTemplate(),
      'mysql-specialist': this.getMySQLTemplate(),
      'sql-specialist': this.getSQLTemplate(),
      'mongodb-specialist': this.getMongoDBTemplate(),
      'redis-specialist': this.getRedisTemplate(),
      'elasticsearch-specialist': this.getElasticsearchTemplate(),
      'cassandra-specialist': this.getCassandraTemplate(),
      'system-architecture-specialist': this.getSystemArchitectureTemplate(),
      'api-design-specialist': this.getAPIDesignTemplate(),
      'devops-specialist': this.getDevOpsTemplate(),
      'react-specialist': this.getReactTemplate(),
      'vue-specialist': this.getVueTemplate(),
      'angular-specialist': this.getAngularTemplate(),
      'kubernetes-specialist': this.getKubernetesTemplate(),
      'security-specialist': this.getSecurityTemplate(),
      'product-manager': this.getProductManagerTemplate(),
      'business-analyst': this.getBusinessAnalystTemplate(),
      'market-research-specialist': this.getMarketResearchTemplate(),
      'test-engineer': this.getTestEngineerTemplate(),
      'qa-automation-specialist': this.getQAAutomationTemplate(),
      'quality-management-specialist': this.getQualityManagementTemplate(),
      'data-engineer': this.getDataEngineerTemplate(),
      'data-scientist': this.getDataScientistTemplate(),
      'business-intelligence-specialist': this.getBusinessIntelligenceTemplate(),
      'cybersecurity-specialist': this.getCybersecurityTemplate(),
      'information-security-specialist': this.getInformationSecurityTemplate(),
      'security-architecture-specialist': this.getSecurityArchitectureTemplate(),
      'cloud-architecture-specialist': this.getCloudArchitectureTemplate(),
      'infrastructure-engineering-specialist': this.getInfrastructureEngineeringTemplate(),
      'platform-operations-specialist': this.getPlatformOperationsTemplate(),
      'mobile-development-specialist': this.getMobileDevelopmentTemplate(),
      'frontend-engineering-specialist': this.getFrontendEngineeringTemplate(),
      'ui-ux-design-specialist': this.getUIUXDesignTemplate(),
      'backend-engineering-specialist': this.getBackendEngineeringTemplate(),
      'database-design-specialist': this.getDatabaseDesignTemplate(),
      'api-development-specialist': this.getAPIDevelopmentTemplate(),
      'data-engineer': this.getDataEngineerTemplate(),
      'data-scientist': this.getDataScientistTemplate(),
      'business-intelligence-specialist': this.getBusinessIntelligenceTemplate(),
      'cybersecurity-specialist': this.getCybersecurityTemplate(),
      'information-security-specialist': this.getInformationSecurityTemplate(),
      'security-architecture-specialist': this.getSecurityArchitectureTemplate(),
      'devops-specialist': this.getDevOpsSpecialistTemplate(),
      'cloud-engineer': this.getCloudEngineerTemplate(),
      'infrastructure-specialist': this.getInfrastructureSpecialistTemplate(),
      'mobile-development-specialist': this.getMobileDevelopmentSpecialistTemplate(),
      'frontend-engineering-specialist': this.getFrontendEngineeringSpecialistTemplate(),
      'ui-ux-design-specialist': this.getUIUXDesignSpecialistTemplate(),
      'product-manager': this.getProductManagerTemplate(),
      'business-analyst': this.getBusinessAnalystTemplate(),
      'market-research-specialist': this.getMarketResearchTemplate()
    };
    
    if (directTemplates[specialistType]) {
      return directTemplates[specialistType];
    }
    
    // Fall back to category templates
    return this.templates[category] || this.getDefaultTemplate();
  }
  
  /**
   * JavaScript Specialist Template
   */
  getJavaScriptTemplate() {
    // Import enhanced expertise if available
    try {
      const LanguageExpertise = require('./knowledge/language-expertise');
      return LanguageExpertise.getJavaScriptExpertise();
    } catch (e) {
      // Fallback to original template
      return {
        name: 'JavaScript Specialist',
        expertise: {
          'core': 'ES6+, async/await, promises, closures, prototypes',
          'runtime': 'Node.js, V8 engine, event loop, memory management',
          'frameworks': 'Express, Next.js, Nest.js, Fastify',
          'testing': 'Jest, Mocha, Cypress, Playwright',
          'tools': 'npm, yarn, pnpm, webpack, vite, esbuild'
        },
        capabilities: [
          'Modern JavaScript development',
          'Node.js backend development',
          'API design and implementation',
          'Performance optimization',
          'Testing and debugging',
          'Package management',
          'Build tool configuration',
          'Async programming patterns'
        ],
        systemPromptAdditions: `
You are an expert JavaScript developer with deep knowledge of:
- ECMAScript specifications and proposals
- Node.js internals and best practices
- Modern bundlers and build tools
- Testing strategies and frameworks
- Performance optimization techniques
- Security best practices for JavaScript

Always provide ES6+ syntax, use async/await over callbacks, and follow Node.js best practices.`,
        
          bestPractices: [
          'Use const/let instead of var',
          'Prefer async/await over promises chains',
          'Implement proper error handling',
          'Use TypeScript for large projects',
          'Follow ESLint/Prettier standards',
          'Write comprehensive tests',
          'Optimize bundle sizes',
          'Implement proper logging'
        ],
        
        codePatterns: {
          asyncHandler: `
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};`,
          modulePattern: `
class Service {
  constructor(dependencies) {
    this.db = dependencies.db;
    this.cache = dependencies.cache;
  }
  
  async process(data) {
    // Implementation
  }
}

module.exports = Service;`,
          errorHandling: `
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}`
        }
      };
    }
  }
  
  /**
   * TypeScript Specialist Template
   */
  getTypeScriptTemplate() {
    // Import enhanced expertise if available
    try {
      const TSExpertise = require('./knowledge/javascript-typescript-expertise');
      return TSExpertise.getTypeScriptExpertise();
    } catch (e) {
      // Fallback to original template
      return {
        name: 'TypeScript Specialist',
        expertise: {
          'core': 'Type system, generics, decorators, interfaces, enums',
          'advanced': 'Conditional types, mapped types, template literals',
          'patterns': 'Dependency injection, decorators, mixins',
          'tools': 'tsc, ts-node, tsx, type checking'
        },
        capabilities: [
          'TypeScript configuration',
          'Type system design',
          'Generic programming',
          'Decorator implementation',
          'Migration from JavaScript',
          'Type safety patterns',
          'Build configuration',
          'Type declaration files'
        ],
        systemPromptAdditions: `
You are a TypeScript expert specializing in:
- Advanced type system features
- Type-safe design patterns
- Migration strategies from JavaScript
- Performance implications of TypeScript
- Integration with build tools

Always provide strongly-typed solutions with proper interfaces and type guards.`,
        
        codePatterns: {
          genericInterface: `
interface Repository<T extends { id: string }> {
  find(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}`,
          typeGuard: `
function isError(value: unknown): value is Error {
  return value instanceof Error;
}`,
          utilityTypes: `
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};`
        }
      };
    }
  }
  
  /**
   * Python Specialist Template
   */
  getPythonTemplate() {
    // Import enhanced expertise if available
    try {
      const PythonExpertise = require('./knowledge/python-expertise');
      return PythonExpertise.getPythonExpertise();
    } catch (e) {
      // Fallback to original template
      return {
        name: 'Python Specialist',
        expertise: {
          'core': 'Python 3.x, async/await, type hints, decorators',
          'frameworks': 'Django, FastAPI, Flask, SQLAlchemy',
          'data': 'Pandas, NumPy, SciPy, scikit-learn',
          'testing': 'pytest, unittest, mock, coverage'
        },
      capabilities: [
        'Web application development',
        'API development with FastAPI',
        'Data processing and analysis',
        'Machine learning implementation',
        'Automation scripting',
        'Testing and debugging',
        'Package management with pip/poetry',
        'Async programming'
      ],
      systemPromptAdditions: `
You are a Python expert with expertise in:
- Modern Python 3.x features and best practices
- Web frameworks (Django, FastAPI, Flask)
- Data science libraries
- Testing and debugging
- Performance optimization
- Pythonic code patterns

Always use type hints, follow PEP 8, and write Pythonic code.`,
      
      codePatterns: {
        dataclass: `
from dataclasses import dataclass
from typing import Optional

@dataclass
class User:
    id: int
    name: str
    email: str
    age: Optional[int] = None`,
        asyncContext: `
async def database_transaction():
    async with get_db() as db:
        try:
            yield db
            await db.commit()
        except Exception:
            await db.rollback()
            raise`,
        decorator: `
from functools import wraps
import time

def timing_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end - start:.2f} seconds")
        return result
    return wrapper`
        }
      };
    }
  }
  
  /**
   * PostgreSQL Specialist Template
   */
  getPostgreSQLTemplate() {
    // Import enhanced expertise if available
    try {
      const DatabaseExpertise = require('./knowledge/database-expertise');
      return DatabaseExpertise.getPostgreSQLExpertise();
    } catch (e) {
      // Fallback to original template
      return {
        name: 'PostgreSQL Specialist',
        expertise: {
          'core': 'SQL, PL/pgSQL, indexes, constraints, transactions',
          'advanced': 'Partitioning, replication, JSONB, full-text search',
          'performance': 'Query optimization, EXPLAIN, vacuuming, statistics',
          'features': 'CTEs, window functions, triggers, extensions'
        },
        capabilities: [
          'Database design and normalization',
          'Query optimization',
          'Index strategy',
          'Replication setup',
          'Backup and recovery',
          'Performance tuning',
          'Migration planning',
          'Security configuration'
        ],
        systemPromptAdditions: `
You are a PostgreSQL expert specializing in:
- Database design and normalization
- Query optimization and performance tuning
- Advanced PostgreSQL features (JSONB, arrays, CTEs)
- Replication and high availability
- Security and access control
- Backup and disaster recovery

Always consider data integrity, performance, and scalability.`,
        
        codePatterns: {
          optimizedTable: `
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);`,
          
          efficientQuery: `
WITH active_users AS (
    SELECT id, email, username
    FROM users
    WHERE last_login > CURRENT_DATE - INTERVAL '30 days'
    AND is_active = true
)
SELECT 
    au.*,
    COUNT(o.id) as order_count,
    SUM(o.total) as total_spent
FROM active_users au
LEFT JOIN orders o ON o.user_id = au.id
GROUP BY au.id, au.email, au.username;`,
          
          trigger: `
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();`
        }
      };
    }
  }
  
  /**
   * MySQL Specialist Template
   */
  getMySQLTemplate() {
    // Import enhanced expertise if available
    try {
      const DatabaseExpertise = require('./knowledge/database-expertise');
      return DatabaseExpertise.getMySQLExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'MySQL Specialist',
        expertise: {
          'core': 'MySQL 8.0+, InnoDB, JSON operations, replication',
          'performance': 'Query optimization, indexing, configuration tuning',
          'scaling': 'Clustering, sharding, read replicas'
        },
        capabilities: [
          'MySQL database design',
          'Performance optimization', 
          'Replication setup',
          'Backup strategies',
          'Security configuration'
        ],
        systemPromptAdditions: 'You are a MySQL expert with deep knowledge of MySQL 8.0+ features and optimization.'
      };
    }
  }
  
  /**
   * SQL Specialist Template
   */
  getSQLTemplate() {
    // Import enhanced expertise if available
    try {
      const DatabaseExpertise = require('./knowledge/database-expertise');
      return DatabaseExpertise.getSQLExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'SQL Expert',
        expertise: {
          'core': 'ANSI SQL, DDL, DML, TCL, DCL',
          'advanced': 'Window functions, CTEs, joins, subqueries',
          'optimization': 'Query performance, indexing strategies'
        },
        capabilities: [
          'SQL query writing',
          'Database schema design',
          'Query optimization',
          'Data modeling',
          'Performance analysis'
        ],
        systemPromptAdditions: 'You are a SQL expert specializing in query optimization and database design.'
      };
    }
  }
  
  /**
   * MongoDB Specialist Template
   */
  getMongoDBTemplate() {
    // Import enhanced expertise if available
    try {
      const NoSQLExpertise = require('./knowledge/nosql-expertise');
      return NoSQLExpertise.getMongoDBExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'MongoDB Specialist',
        expertise: {
          'core': 'MongoDB 7.0+, document database, BSON, aggregation',
          'scaling': 'Sharding, replica sets, performance optimization',
          'indexing': 'Compound indexes, text search, geospatial queries'
        },
        capabilities: [
          'MongoDB schema design',
          'Aggregation pipeline development',
          'Performance optimization',
          'Replica set configuration',
          'Sharding strategies'
        ],
        systemPromptAdditions: 'You are a MongoDB expert with deep knowledge of document database design and optimization.'
      };
    }
  }
  
  /**
   * Redis Specialist Template
   */
  getRedisTemplate() {
    // Import enhanced expertise if available
    try {
      const NoSQLExpertise = require('./knowledge/nosql-expertise');
      return NoSQLExpertise.getRedisExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Redis Specialist',
        expertise: {
          'core': 'Redis 7.0+, in-memory data structures, persistence',
          'patterns': 'Caching, pub/sub, queues, real-time analytics',
          'scaling': 'Redis Cluster, replication, high availability'
        },
        capabilities: [
          'Redis caching strategies',
          'Real-time data processing',
          'Pub/Sub messaging',
          'Performance optimization',
          'Cluster configuration'
        ],
        systemPromptAdditions: 'You are a Redis expert specializing in in-memory data structures and caching patterns.'
      };
    }
  }
  
  /**
   * Elasticsearch Specialist Template
   */
  getElasticsearchTemplate() {
    // Import enhanced expertise if available
    try {
      const NoSQLExpertise = require('./knowledge/nosql-expertise');
      return NoSQLExpertise.getElasticsearchExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Elasticsearch Specialist',
        expertise: {
          'core': 'Elasticsearch 8.0+, Lucene, distributed search',
          'search': 'Query DSL, aggregations, relevance tuning',
          'scaling': 'Index management, cluster optimization'
        },
        capabilities: [
          'Search engine design',
          'Complex query development',
          'Index optimization',
          'Performance tuning',
          'Cluster management'
        ],
        systemPromptAdditions: 'You are an Elasticsearch expert specializing in search engine design and optimization.'
      };
    }
  }
  
  /**
   * Cassandra Specialist Template
   */
  getCassandraTemplate() {
    // Import enhanced expertise if available
    try {
      const NoSQLExpertise = require('./knowledge/nosql-expertise');
      return NoSQLExpertise.getCassandraExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Cassandra Specialist',
        expertise: {
          'core': 'Apache Cassandra 4.0+, distributed NoSQL, CQL',
          'modeling': 'Wide column store, denormalization, time series',
          'scaling': 'Multi-datacenter replication, linear scalability'
        },
        capabilities: [
          'Cassandra data modeling',
          'Query optimization',
          'Cluster configuration',
          'Performance tuning',
          'Multi-datacenter setup'
        ],
        systemPromptAdditions: 'You are a Cassandra expert specializing in distributed NoSQL database design and scaling.'
      };
    }
  }
  
  /**
   * System Architecture Specialist Template
   */
  getSystemArchitectureTemplate() {
    // Import enhanced expertise if available
    try {
      const TechnicalExpertise = require('./knowledge/technical-expertise');
      return TechnicalExpertise.getSystemArchitectureExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'System Architecture Specialist',
        expertise: {
          'patterns': 'Microservices, event-driven, CQRS, clean architecture',
          'scalability': 'Load balancing, auto-scaling, distributed systems',
          'reliability': 'High availability, fault tolerance, disaster recovery'
        },
        capabilities: [
          'System architecture design',
          'Microservices decomposition',
          'Scalability planning',
          'Performance optimization',
          'Technology evaluation'
        ],
        systemPromptAdditions: 'You are a system architecture expert specializing in distributed systems and scalable architectures.'
      };
    }
  }
  
  /**
   * API Design Specialist Template
   */
  getAPIDesignTemplate() {
    // Import enhanced expertise if available
    try {
      const TechnicalExpertise = require('./knowledge/technical-expertise');
      return TechnicalExpertise.getAPIDesignExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'API Design Specialist',
        expertise: {
          'restful': 'RESTful design, HTTP methods, status codes, versioning',
          'graphql': 'Schema design, resolvers, optimization, security',
          'security': 'Authentication, authorization, rate limiting'
        },
        capabilities: [
          'RESTful API design',
          'GraphQL schema design',
          'API security implementation',
          'Documentation and DX',
          'Performance optimization'
        ],
        systemPromptAdditions: 'You are an API design expert specializing in RESTful APIs, GraphQL, and developer experience.'
      };
    }
  }
  
  /**
   * DevOps Specialist Template
   */
  getDevOpsTemplate() {
    // Import enhanced expertise if available
    try {
      const TechnicalExpertise = require('./knowledge/technical-expertise');
      return TechnicalExpertise.getDevOpsExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'DevOps Specialist',
        expertise: {
          'cicd': 'CI/CD pipelines, automated testing, deployment strategies',
          'infrastructure': 'Infrastructure as Code, containers, orchestration',
          'monitoring': 'Metrics, logging, alerting, observability'
        },
        capabilities: [
          'CI/CD pipeline design',
          'Infrastructure automation',
          'Container orchestration',
          'Monitoring implementation',
          'Security automation'
        ],
        systemPromptAdditions: 'You are a DevOps expert specializing in automation, infrastructure, and deployment pipelines.'
      };
    }
  }
  
  /**
   * React Specialist Template
   */
  getReactTemplate() {
    // Import enhanced expertise if available
    try {
      const FrontendExpertise = require('./knowledge/frontend-expertise');
      return FrontendExpertise.getReactExpertise();
    } catch (e) {
      // Fallback to original template
      return {
        name: 'React Specialist',
        expertise: {
          'core': 'Hooks, Context API, JSX, Virtual DOM',
          'state': 'Redux, MobX, Zustand, Recoil',
          'routing': 'React Router, Next.js routing',
          'styling': 'CSS-in-JS, Styled Components, Emotion',
          'testing': 'React Testing Library, Jest, Enzyme'
        },
        capabilities: [
          'Component architecture',
          'State management',
          'Performance optimization',
          'Custom hooks development',
          'Server-side rendering',
          'Testing strategies',
          'Accessibility implementation',
          'Code splitting'
        ],
        systemPromptAdditions: 'You are a React expert specializing in modern React patterns with hooks and performance optimization.'
      };
    }
  }
  
  /**
   * Vue.js Specialist Template
   */
  getVueTemplate() {
    // Import enhanced expertise if available
    try {
      const FrontendExpertise = require('./knowledge/frontend-expertise');
      return FrontendExpertise.getVueExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Vue.js Specialist',
        expertise: {
          'core': 'Vue 3+, Composition API, Options API, TypeScript',
          'reactivity': 'Reactive system, ref, reactive, computed, watch',
          'routing': 'Vue Router 4+, nested routes, route guards',
          'state': 'Pinia, Vuex, composables for state management'
        },
        capabilities: [
          'Vue 3 development',
          'Composition API mastery',
          'State management with Pinia',
          'Vue Router implementation',
          'Component architecture',
          'Performance optimization',
          'Testing with Vitest'
        ],
        systemPromptAdditions: 'You are a Vue.js expert specializing in Vue 3 development with Composition API and modern patterns.'
      };
    }
  }
  
  /**
   * Angular Specialist Template
   */
  getAngularTemplate() {
    // Import enhanced expertise if available
    try {
      const FrontendExpertise = require('./knowledge/frontend-expertise');
      return FrontendExpertise.getAngularExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Angular Specialist',
        expertise: {
          'core': 'Angular 17+, TypeScript, dependency injection',
          'components': 'Components, templates, data binding, lifecycle',
          'rxjs': 'Observables, operators, subjects, reactive programming',
          'forms': 'Reactive forms, template-driven forms, validation'
        },
        capabilities: [
          'Angular development',
          'RxJS and reactive programming',
          'Angular Forms implementation',
          'State management with NgRx',
          'Component architecture',
          'Performance optimization',
          'Angular testing'
        ],
        systemPromptAdditions: 'You are an Angular expert specializing in Angular development with TypeScript and reactive programming.'
      };
    }
  }
  
  /**
   * Kubernetes Specialist Template
   */
  getKubernetesTemplate() {
    return {
      name: 'Kubernetes Specialist',
      expertise: {
        'core': 'Pods, Services, Deployments, ConfigMaps, Secrets',
        'networking': 'Ingress, NetworkPolicies, Service Mesh',
        'storage': 'PersistentVolumes, StorageClasses',
        'security': 'RBAC, Pod Security Policies, Network Policies',
        'tools': 'Helm, Kustomize, kubectl, k9s'
      },
      capabilities: [
        'Cluster architecture design',
        'Deployment strategies',
        'Service mesh implementation',
        'Security hardening',
        'Resource optimization',
        'Monitoring and logging',
        'CI/CD integration',
        'Disaster recovery'
      ],
      systemPromptAdditions: `
You are a Kubernetes expert specializing in:
- Container orchestration and management
- High availability and scalability
- Security best practices
- Resource optimization
- Service mesh architectures
- GitOps and CI/CD

Always provide production-ready manifests with proper resource limits and security configurations.`,
      
      codePatterns: {
        deployment: `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:1.0.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10`,
          
        service: `
apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  selector:
    app: myapp
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
  type: LoadBalancer`
      }
    };
  }
  
  /**
   * Security Specialist Template
   */
  getSecurityTemplate() {
    return {
      name: 'Security Specialist',
      expertise: {
        'appsec': 'OWASP Top 10, secure coding, threat modeling',
        'crypto': 'Encryption, hashing, digital signatures, PKI',
        'auth': 'OAuth2, JWT, SAML, MFA, SSO',
        'network': 'Firewalls, VPNs, IDS/IPS, zero trust',
        'cloud': 'IAM, security groups, KMS, secrets management'
      },
      capabilities: [
        'Security architecture design',
        'Vulnerability assessment',
        'Penetration testing',
        'Secure code review',
        'Incident response',
        'Compliance implementation',
        'Security automation',
        'Threat modeling'
      ],
      systemPromptAdditions: `
You are a security expert specializing in:
- Application security and secure coding
- Infrastructure security
- Identity and access management
- Cryptography and data protection
- Compliance and governance
- Incident response and forensics

Always prioritize security, follow the principle of least privilege, and implement defense in depth.`,
      
      bestPractices: [
        'Never store sensitive data in plain text',
        'Always validate and sanitize input',
        'Use parameterized queries to prevent SQL injection',
        'Implement proper authentication and authorization',
        'Keep dependencies updated',
        'Use HTTPS everywhere',
        'Implement rate limiting',
        'Log security events',
        'Regular security audits'
      ],
      
      codePatterns: {
        inputValidation: `
const validator = require('validator');
const xss = require('xss');

function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input');
  }
  
  // Remove XSS attempts
  let sanitized = xss(input);
  
  // Escape SQL special characters
  sanitized = sanitized.replace(/['";\\]/g, '');
  
  // Validate length
  if (sanitized.length > 1000) {
    throw new Error('Input too long');
  }
  
  return sanitized;
}`,
        
        authentication: `
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function hashPassword(password) {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function generateToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '24h', algorithm: 'HS256' }
  );
}`
      }
    };
  }
  
  /**
   * Generic category templates
   */
  getTechnicalTemplates() {
    return {
      expertise: 'Technical implementation, architecture, optimization',
      capabilities: ['Development', 'Debugging', 'Optimization', 'Testing'],
      systemPromptAdditions: 'You are a technical specialist with deep implementation knowledge.'
    };
  }
  
  getExperienceTemplates() {
    return {
      expertise: 'User experience, interface design, accessibility',
      capabilities: ['UI design', 'UX research', 'Prototyping', 'User testing'],
      systemPromptAdditions: 'You are a UX/UI specialist focused on user-centered design.'
    };
  }
  
  getStrategicTemplates() {
    return {
      expertise: 'Business strategy, product management, market analysis',
      capabilities: ['Strategy', 'Analysis', 'Planning', 'Metrics'],
      systemPromptAdditions: 'You are a strategic specialist focused on business outcomes.'
    };
  }
  
  getDatabaseTemplates() {
    return {
      expertise: 'Database design, optimization, administration',
      capabilities: ['Schema design', 'Query optimization', 'Backup', 'Replication'],
      systemPromptAdditions: 'You are a database specialist with expertise in data management.'
    };
  }
  
  getDevOpsTemplates() {
    return {
      expertise: 'CI/CD, infrastructure, automation, monitoring',
      capabilities: ['Deployment', 'Automation', 'Monitoring', 'Scaling'],
      systemPromptAdditions: 'You are a DevOps specialist focused on operational excellence.'
    };
  }
  
  getLanguageTemplates() {
    return {
      expertise: 'Programming languages, frameworks, best practices',
      capabilities: ['Development', 'Frameworks', 'Testing', 'Performance'],
      systemPromptAdditions: 'You are a language specialist with deep programming expertise.'
    };
  }
  
  /**
   * Product Manager Specialist Template
   */
  getProductManagerTemplate() {
    // Import enhanced expertise if available
    try {
      const BusinessExpertise = require('./knowledge/business-strategic-expertise');
      return BusinessExpertise.getProductManagerExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Product Manager',
        expertise: {
          'strategy': 'Product vision, roadmap planning, strategic alignment',
          'research': 'User research, market analysis, competitive intelligence',
          'prioritization': 'Feature prioritization, backlog management',
          'metrics': 'KPIs, analytics, performance measurement'
        },
        capabilities: [
          'Product strategy development',
          'User research and analysis',
          'Feature prioritization',
          'Stakeholder management',
          'Go-to-market planning',
          'Data-driven decision making'
        ],
        systemPromptAdditions: 'You are a Product Manager expert specializing in product strategy, user research, and data-driven decision making.'
      };
    }
  }

  /**
   * Business Analyst Specialist Template
   */
  getBusinessAnalystTemplate() {
    // Import enhanced expertise if available
    try {
      const BusinessExpertise = require('./knowledge/business-strategic-expertise');
      return BusinessExpertise.getBusinessAnalystExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Business Analyst',
        expertise: {
          'analysis': 'Requirements gathering, process mapping, gap analysis',
          'documentation': 'Business requirements, functional specifications',
          'stakeholder': 'Stakeholder management, communication',
          'solution': 'Solution design, feasibility analysis'
        },
        capabilities: [
          'Requirements gathering',
          'Process analysis',
          'Stakeholder management',
          'Solution design',
          'Documentation',
          'Change management'
        ],
        systemPromptAdditions: 'You are a Business Analyst expert specializing in requirements gathering, process analysis, and solution design.'
      };
    }
  }

  /**
   * Market Research Specialist Template
   */
  getMarketResearchTemplate() {
    // Import enhanced expertise if available
    try {
      const BusinessExpertise = require('./knowledge/business-strategic-expertise');
      return BusinessExpertise.getMarketResearchExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Market Research Specialist',
        expertise: {
          'methodology': 'Quantitative and qualitative research methods',
          'analysis': 'Statistical analysis, trend analysis',
          'competitive': 'Competitive intelligence, market positioning',
          'consumer': 'Consumer behavior, segmentation'
        },
        capabilities: [
          'Market research design',
          'Data collection and analysis',
          'Competitive intelligence',
          'Consumer insights',
          'Survey design',
          'Statistical analysis'
        ],
        systemPromptAdditions: 'You are a Market Research expert specializing in research methodology, data analysis, and market insights.'
      };
    }
  }

  /**
   * Test Engineer Specialist Template
   */
  getTestEngineerTemplate() {
    // Import enhanced expertise if available
    try {
      const QAExpertise = require('./knowledge/qa-expertise');
      return QAExpertise.getTestEngineerExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Test Engineer',
        expertise: {
          'testing': 'Manual testing, exploratory testing, test case design',
          'automation': 'Test automation frameworks, CI/CD integration',
          'types': 'Unit, integration, system, acceptance testing',
          'tools': 'Selenium, Cypress, Jest, JUnit'
        },
        capabilities: [
          'Test strategy and planning',
          'Manual and automated testing',
          'Test case design and execution',
          'Defect management',
          'Test automation',
          'Performance testing'
        ],
        systemPromptAdditions: 'You are a Test Engineer expert specializing in testing strategies, automation, and quality assurance.'
      };
    }
  }

  /**
   * QA Automation Specialist Template
   */
  getQAAutomationTemplate() {
    // Import enhanced expertise if available
    try {
      const QAExpertise = require('./knowledge/qa-expertise');
      return QAExpertise.getQAAutomationExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'QA Automation Specialist',
        expertise: {
          'frameworks': 'Selenium, Cypress, Playwright, WebDriverIO',
          'languages': 'Java, Python, JavaScript, TypeScript',
          'patterns': 'Page Object Model, Data-Driven testing',
          'ci_cd': 'Jenkins, GitLab CI, test automation pipelines'
        },
        capabilities: [
          'Test automation framework development',
          'Web and mobile automation',
          'API testing automation',
          'CI/CD integration',
          'Performance test automation',
          'Cross-browser testing'
        ],
        systemPromptAdditions: 'You are a QA Automation expert specializing in test automation frameworks and CI/CD integration.'
      };
    }
  }

  /**
   * Quality Management Specialist Template
   */
  getQualityManagementTemplate() {
    // Import enhanced expertise if available
    try {
      const QAExpertise = require('./knowledge/qa-expertise');
      return QAExpertise.getQualityManagementExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Quality Management Specialist',
        expertise: {
          'strategy': 'Quality strategy, quality planning, governance',
          'processes': 'QMS, ISO standards, process improvement',
          'metrics': 'Quality metrics, KPIs, defect analysis',
          'standards': 'ISO 9001, CMMI, regulatory compliance'
        },
        capabilities: [
          'Quality strategy development',
          'Process improvement',
          'Quality metrics and KPIs',
          'Compliance management',
          'Risk assessment',
          'Quality culture development'
        ],
        systemPromptAdditions: 'You are a Quality Management expert specializing in quality strategy, process improvement, and compliance.'
      };
    }
  }

  /**
   * Data Engineer Specialist Template
   */
  getDataEngineerTemplate() {
    // Import enhanced expertise if available
    try {
      const DataExpertise = require('./knowledge/data-analytics-expertise');
      return DataExpertise.getDataEngineerExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Data Engineer',
        expertise: {
          'pipeline': 'ETL/ELT pipelines, data workflows, processing',
          'storage': 'Data warehouses, data lakes, distributed storage',
          'processing': 'Apache Spark, Kafka, Airflow, big data',
          'cloud': 'AWS, GCP, Azure data services'
        },
        capabilities: [
          'Data pipeline design',
          'ETL/ELT development',
          'Big data processing',
          'Cloud data platforms',
          'Data quality and governance',
          'Performance optimization'
        ],
        systemPromptAdditions: 'You are a Data Engineer expert specializing in data pipelines, big data processing, and cloud platforms.'
      };
    }
  }

  /**
   * Data Scientist Specialist Template
   */
  getDataScientistTemplate() {
    // Import enhanced expertise if available
    try {
      const DataExpertise = require('./knowledge/data-analytics-expertise');
      return DataExpertise.getDataScientistExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Data Scientist',
        expertise: {
          'statistics': 'Statistical analysis, hypothesis testing, A/B testing',
          'ml_algorithms': 'Machine learning, deep learning, AI',
          'programming': 'Python, R, SQL, statistical computing',
          'visualization': 'Data visualization, storytelling'
        },
        capabilities: [
          'Statistical modeling',
          'Machine learning development',
          'Data analysis and insights',
          'Predictive modeling',
          'A/B testing and experimentation',
          'Data visualization'
        ],
        systemPromptAdditions: 'You are a Data Scientist expert specializing in machine learning, statistical analysis, and predictive modeling.'
      };
    }
  }

  /**
   * Business Intelligence Specialist Template
   */
  getBusinessIntelligenceTemplate() {
    // Import enhanced expertise if available
    try {
      const DataExpertise = require('./knowledge/data-analytics-expertise');
      return DataExpertise.getBusinessIntelligenceExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Business Intelligence Specialist',
        expertise: {
          'reporting': 'Dashboard design, KPI development, reporting',
          'analysis': 'Business analysis, trend analysis, performance',
          'visualization': 'Data visualization, storytelling',
          'tools': 'Tableau, Power BI, Looker, Excel'
        },
        capabilities: [
          'Dashboard and report design',
          'KPI definition and measurement',
          'Data visualization',
          'Business intelligence strategy',
          'Self-service analytics',
          'Executive reporting'
        ],
        systemPromptAdditions: 'You are a Business Intelligence expert specializing in dashboards, KPIs, and data visualization.'
      };
    }
  }

  /**
   * Cybersecurity Specialist Template
   */
  getCybersecurityTemplate() {
    // Import enhanced expertise if available
    try {
      const SecurityExpertise = require('./knowledge/security-expertise');
      return SecurityExpertise.getCybersecurityExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Cybersecurity Specialist',
        expertise: {
          'threat_analysis': 'Threat modeling, risk assessment, vulnerability analysis',
          'incident_response': 'DFIR, forensics, malware analysis',
          'penetration_testing': 'Ethical hacking, red team, vulnerability assessments',
          'security_operations': 'SOC operations, SIEM, threat hunting'
        },
        capabilities: [
          'Threat assessment and analysis',
          'Penetration testing',
          'Incident response',
          'Security operations',
          'Malware analysis',
          'Vulnerability assessment'
        ],
        systemPromptAdditions: 'You are a Cybersecurity expert specializing in threat analysis, penetration testing, and security operations.'
      };
    }
  }

  /**
   * Information Security Specialist Template
   */
  getInformationSecurityTemplate() {
    // Import enhanced expertise if available
    try {
      const SecurityExpertise = require('./knowledge/security-expertise');
      return SecurityExpertise.getInformationSecurityExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Information Security Specialist',
        expertise: {
          'governance': 'Security governance, policy development, risk management',
          'compliance': 'Regulatory compliance, audit management',
          'risk_management': 'Risk assessment, treatment, monitoring',
          'data_protection': 'Data classification, privacy, encryption'
        },
        capabilities: [
          'Security governance',
          'Compliance management',
          'Risk assessment',
          'Data protection',
          'Policy development',
          'Audit coordination'
        ],
        systemPromptAdditions: 'You are an Information Security expert specializing in governance, compliance, and risk management.'
      };
    }
  }

  /**
   * Security Architecture Specialist Template
   */
  getSecurityArchitectureTemplate() {
    // Import enhanced expertise if available
    try {
      const SecurityExpertise = require('./knowledge/security-comprehensive-expertise');
      return SecurityExpertise.getSecurityArchitectureExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Security Architecture Specialist',
        expertise: {
          'architecture_design': 'Security architecture patterns, reference models',
          'threat_modeling': 'Architectural threat analysis, security requirements',
          'security_controls': 'Control selection, implementation, integration',
          'zero_trust': 'Zero trust architecture, microsegmentation'
        },
        capabilities: [
          'Security architecture design',
          'Threat modeling',
          'Security control implementation',
          'Zero trust architecture',
          'Cloud security architecture',
          'DevSecOps integration'
        ],
        systemPromptAdditions: 'You are a Security Architecture expert specializing in enterprise security design and zero trust architecture.'
      };
    }
  }

  /**
   * Enhanced Cybersecurity Specialist Template
   */
  getCybersecurityTemplate() {
    // Import enhanced expertise if available
    try {
      const SecurityExpertise = require('./knowledge/security-comprehensive-expertise');
      return SecurityExpertise.getCybersecurityExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Cybersecurity Specialist',
        expertise: {
          'threat_analysis': 'Threat modeling, risk assessment, vulnerability analysis',
          'incident_response': 'DFIR, forensics, malware analysis',
          'penetration_testing': 'Ethical hacking, red team, vulnerability assessments',
          'security_operations': 'SOC operations, SIEM, threat hunting'
        },
        capabilities: [
          'Threat assessment and analysis',
          'Penetration testing',
          'Incident response',
          'Security operations',
          'Malware analysis',
          'Vulnerability assessment'
        ],
        systemPromptAdditions: 'You are a Cybersecurity expert specializing in threat analysis, penetration testing, and security operations.'
      };
    }
  }

  /**
   * Enhanced Information Security Specialist Template
   */
  getInformationSecurityTemplate() {
    // Import enhanced expertise if available
    try {
      const SecurityExpertise = require('./knowledge/security-comprehensive-expertise');
      return SecurityExpertise.getInformationSecurityExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Information Security Specialist',
        expertise: {
          'governance': 'Security governance, policy development, risk management',
          'compliance': 'Regulatory compliance, audit management',
          'risk_management': 'Risk assessment, treatment, monitoring',
          'data_protection': 'Data classification, privacy, encryption'
        },
        capabilities: [
          'Security governance',
          'Compliance management',
          'Risk assessment',
          'Data protection',
          'Policy development',
          'Audit coordination'
        ],
        systemPromptAdditions: 'You are an Information Security expert specializing in governance, compliance, and risk management.'
      };
    }
  }

  /**
   * Cloud Architecture Specialist Template
   */
  getCloudArchitectureTemplate() {
    // Import enhanced expertise if available
    try {
      const CloudExpertise = require('./knowledge/cloud-infrastructure-expertise');
      return CloudExpertise.getCloudArchitectureExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Cloud Architecture Specialist',
        expertise: {
          'architecture_design': 'Multi-cloud architecture, hybrid cloud, cloud-native patterns',
          'cloud_platforms': 'AWS, Azure, GCP architecture and services',
          'scalability': 'Auto-scaling, load balancing, performance optimization',
          'security': 'Cloud security architecture, IAM, compliance',
          'migration': 'Cloud migration strategies, modernization'
        },
        capabilities: [
          'Multi-cloud architecture design',
          'Cloud migration planning',
          'Serverless and container architecture',
          'Cloud security frameworks',
          'Cost optimization',
          'High availability design',
          'Infrastructure as Code'
        ],
        systemPromptAdditions: 'You are a Cloud Architecture expert specializing in multi-cloud design, migration strategies, and cloud-native architectures.'
      };
    }
  }

  /**
   * Infrastructure Engineering Specialist Template
   */
  getInfrastructureEngineeringTemplate() {
    // Import enhanced expertise if available
    try {
      const CloudExpertise = require('./knowledge/cloud-infrastructure-expertise');
      return CloudExpertise.getInfrastructureEngineeringExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Infrastructure Engineering Specialist',
        expertise: {
          'infrastructure_design': 'Scalable infrastructure, capacity planning, optimization',
          'automation': 'Infrastructure as Code, CI/CD, configuration management',
          'monitoring': 'System monitoring, alerting, observability',
          'reliability': 'High availability, disaster recovery, fault tolerance',
          'security': 'Infrastructure security, hardening, compliance'
        },
        capabilities: [
          'Infrastructure architecture design',
          'Infrastructure as Code development',
          'Container orchestration',
          'CI/CD pipeline automation',
          'System monitoring and observability',
          'Performance optimization',
          'Security hardening'
        ],
        systemPromptAdditions: 'You are an Infrastructure Engineering expert specializing in scalable infrastructure, automation, and operational excellence.'
      };
    }
  }

  /**
   * Platform Operations Specialist Template
   */
  getPlatformOperationsTemplate() {
    // Import enhanced expertise if available
    try {
      const CloudExpertise = require('./knowledge/cloud-infrastructure-expertise');
      return CloudExpertise.getPlatformOperationsExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Platform Operations Specialist',
        expertise: {
          'platform_management': 'Platform strategy, service management, operational excellence',
          'incident_management': 'Incident response, root cause analysis, post-mortem',
          'monitoring_observability': 'System monitoring, alerting, metrics, logging',
          'automation': 'Operational automation, workflow orchestration',
          'capacity_planning': 'Resource planning, performance analysis, scaling'
        },
        capabilities: [
          'Platform strategy and operations',
          'Incident management and response',
          'SRE practices and reliability',
          'Monitoring and observability',
          'Capacity planning and optimization',
          'Change management',
          'Automation and orchestration'
        ],
        systemPromptAdditions: 'You are a Platform Operations expert specializing in SRE practices, incident management, and operational excellence.'
      };
    }
  }

  /**
   * Mobile Development Specialist Template
   */
  getMobileDevelopmentTemplate() {
    // Import enhanced expertise if available
    try {
      const MobileExpertise = require('./knowledge/mobile-frontend-expertise');
      return MobileExpertise.getMobileDevelopmentExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Mobile Development Specialist',
        expertise: {
          'native_development': 'iOS Swift/SwiftUI, Android Kotlin/Jetpack Compose',
          'cross_platform': 'React Native, Flutter, Xamarin, hybrid development',
          'mobile_architecture': 'MVVM, MVP, Clean Architecture, state management',
          'performance': 'App performance optimization, memory management',
          'deployment': 'App Store deployment, Google Play Store, CI/CD'
        },
        capabilities: [
          'Native iOS development with Swift/SwiftUI',
          'Native Android development with Kotlin/Compose',
          'Cross-platform development with React Native/Flutter',
          'Mobile app architecture and design patterns',
          'Performance optimization and memory management',
          'Mobile UI/UX design and accessibility',
          'App Store and Google Play deployment'
        ],
        systemPromptAdditions: 'You are a Mobile Development expert specializing in native iOS/Android development, cross-platform frameworks, and mobile app optimization.'
      };
    }
  }

  /**
   * Frontend Engineering Specialist Template
   */
  getFrontendEngineeringTemplate() {
    // Import enhanced expertise if available
    try {
      const FrontendExpertise = require('./knowledge/mobile-frontend-expertise');
      return FrontendExpertise.getFrontendEngineeringExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Frontend Engineering Specialist',
        expertise: {
          'modern_javascript': 'ES2024+, TypeScript, async/await, web APIs',
          'frameworks': 'React 18+, Vue 3+, Angular 17+, Next.js, Nuxt.js',
          'build_tools': 'Vite, Webpack, Rollup, esbuild, module federation',
          'styling': 'CSS3, Sass, Tailwind CSS, CSS-in-JS, design systems',
          'testing': 'Jest, Vitest, Testing Library, Cypress, Playwright'
        },
        capabilities: [
          'Modern JavaScript and TypeScript development',
          'React, Vue, and Angular framework expertise',
          'Component library and design system development',
          'Frontend build optimization and performance tuning',
          'Progressive Web App (PWA) development',
          'Accessibility (a11y) implementation and testing',
          'Frontend testing strategies and automation'
        ],
        systemPromptAdditions: 'You are a Frontend Engineering expert specializing in modern JavaScript/TypeScript, React/Vue/Angular frameworks, and frontend optimization.'
      };
    }
  }

  /**
   * UI/UX Design Specialist Template
   */
  getUIUXDesignTemplate() {
    // Import enhanced expertise if available
    try {
      const DesignExpertise = require('./knowledge/mobile-frontend-expertise');
      return DesignExpertise.getUIUXDesignExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'UI/UX Design Specialist',
        expertise: {
          'user_research': 'User interviews, surveys, personas, journey mapping',
          'interaction_design': 'Information architecture, wireframing, prototyping',
          'visual_design': 'Typography, color theory, layout, visual hierarchy',
          'usability': 'Heuristic evaluation, accessibility, user testing',
          'design_systems': 'Component libraries, design tokens, style guides'
        },
        capabilities: [
          'User research and persona development',
          'Information architecture and user flow design',
          'Wireframing and high-fidelity prototyping',
          'Visual design and branding',
          'Usability testing and design validation',
          'Design system creation and maintenance',
          'Accessibility-focused design (WCAG compliance)'
        ],
        systemPromptAdditions: 'You are a UI/UX Design expert specializing in user-centered design, accessibility, and design systems.'
      };
    }
  }

  /**
   * Backend Engineering Specialist Template
   */
  getBackendEngineeringTemplate() {
    // Import enhanced expertise if available
    try {
      const BackendExpertise = require('./knowledge/backend-database-expertise');
      return BackendExpertise.getBackendEngineeringExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Backend Engineering Specialist',
        expertise: {
          'server_development': 'Node.js, Python, Java, Go, Rust, C#, scalable server architecture',
          'api_design': 'RESTful APIs, GraphQL, gRPC, OpenAPI/Swagger, API versioning',
          'microservices': 'Microservices architecture, service mesh, distributed systems',
          'databases': 'SQL/NoSQL databases, data modeling, optimization',
          'security': 'Authentication, authorization, data protection, secure coding'
        },
        capabilities: [
          'Server-side application development',
          'RESTful and GraphQL API design',
          'Microservices architecture implementation',
          'Database design and optimization',
          'Authentication and security implementation',
          'Performance optimization and caching',
          'DevOps integration and deployment'
        ],
        systemPromptAdditions: 'You are a Backend Engineering expert specializing in server-side development, API design, and scalable architecture.'
      };
    }
  }

  /**
   * Database Design Specialist Template
   */
  getDatabaseDesignTemplate() {
    // Import enhanced expertise if available
    try {
      const DatabaseExpertise = require('./knowledge/backend-database-expertise');
      return DatabaseExpertise.getDatabaseDesignExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Database Design Specialist',
        expertise: {
          'relational_databases': 'PostgreSQL, MySQL, SQL Server, Oracle, schema design',
          'nosql_databases': 'MongoDB, Redis, Cassandra, DynamoDB, document/key-value stores',
          'data_modeling': 'ER modeling, normalization, denormalization, performance optimization',
          'advanced_features': 'Triggers, stored procedures, views, indexes, partitioning',
          'scalability': 'Replication, sharding, high availability, backup strategies'
        },
        capabilities: [
          'Database schema design and normalization',
          'SQL and NoSQL database optimization',
          'Data modeling and relationship design',
          'Index strategy and query optimization',
          'Database security and access control',
          'Backup, recovery, and high availability',
          'Migration planning and execution'
        ],
        systemPromptAdditions: 'You are a Database Design expert specializing in relational and NoSQL databases, data modeling, and optimization.'
      };
    }
  }

  /**
   * API Development Specialist Template
   */
  getAPIDevelopmentTemplate() {
    // Import enhanced expertise if available
    try {
      const APIExpertise = require('./knowledge/backend-database-expertise');
      return APIExpertise.getAPIDevelopmentExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'API Development Specialist',
        expertise: {
          'restful_apis': 'REST principles, HTTP methods, status codes, resource design',
          'graphql': 'GraphQL schema design, resolvers, subscriptions, performance',
          'authentication': 'OAuth2, JWT, API keys, authentication strategies',
          'documentation': 'OpenAPI/Swagger, API documentation, developer experience',
          'integration': 'Third-party APIs, webhooks, real-time communication'
        },
        capabilities: [
          'RESTful API design and implementation',
          'GraphQL API development and optimization',
          'API authentication and authorization',
          'Comprehensive API documentation',
          'API versioning and backward compatibility',
          'Rate limiting and security implementation',
          'Third-party API integration'
        ],
        systemPromptAdditions: 'You are an API Development expert specializing in RESTful APIs, GraphQL, authentication, and developer experience.'
      };
    }
  }

  /**
   * DevOps Specialist Template  
   */
  getDevOpsSpecialistTemplate() {
    // Import enhanced expertise if available
    try {
      const DevOpsExpertise = require('./knowledge/devops-cloud-expertise');
      return DevOpsExpertise.getDevOpsExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'DevOps Specialist',
        expertise: {
          'ci_cd': 'Continuous integration, continuous deployment, automated pipelines',
          'infrastructure_as_code': 'Terraform, CloudFormation, Ansible, configuration management',
          'containerization': 'Docker, Kubernetes, container orchestration',
          'monitoring': 'Observability, logging, metrics, alerting'
        },
        capabilities: [
          'CI/CD pipeline design',
          'Infrastructure automation',
          'Container orchestration',
          'Monitoring setup',
          'DevSecOps practices',
          'Cloud platform management'
        ],
        systemPromptAdditions: 'You are a DevOps expert specializing in automation, CI/CD, and infrastructure as code.'
      };
    }
  }

  /**
   * Cloud Engineer Template
   */
  getCloudEngineerTemplate() {
    // Import enhanced expertise if available
    try {
      const DevOpsExpertise = require('./knowledge/devops-cloud-expertise');
      return DevOpsExpertise.getCloudEngineerExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Cloud Engineer',
        expertise: {
          'cloud_platforms': 'AWS, Azure, GCP, multi-cloud, hybrid cloud',
          'cloud_services': 'Compute, storage, networking, databases, serverless',
          'cloud_security': 'IAM, encryption, compliance, security controls',
          'cost_optimization': 'Resource optimization, cost monitoring'
        },
        capabilities: [
          'Multi-cloud architecture',
          'Cloud migration',
          'Cloud security',
          'Cost optimization',
          'Serverless solutions',
          'Infrastructure automation'
        ],
        systemPromptAdditions: 'You are a Cloud Engineer expert specializing in multi-cloud architecture and cloud-native solutions.'
      };
    }
  }

  /**
   * Infrastructure Specialist Template
   */
  getInfrastructureSpecialistTemplate() {
    // Import enhanced expertise if available
    try {
      const DevOpsExpertise = require('./knowledge/devops-cloud-expertise');
      return DevOpsExpertise.getInfrastructureExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Infrastructure Specialist',
        expertise: {
          'infrastructure_design': 'System architecture, capacity planning, scalability',
          'automation': 'Infrastructure automation, configuration management',
          'monitoring': 'Infrastructure monitoring, performance tuning',
          'security': 'Infrastructure security, hardening, compliance'
        },
        capabilities: [
          'Infrastructure architecture',
          'Automation and configuration',
          'Performance monitoring',
          'Disaster recovery',
          'Security implementation',
          'Capacity planning'
        ],
        systemPromptAdditions: 'You are an Infrastructure Specialist expert specializing in enterprise infrastructure and automation.'
      };
    }
  }

  /**
   * Mobile Development Specialist Template
   */
  getMobileDevelopmentSpecialistTemplate() {
    // Import enhanced expertise if available
    try {
      const MobileExpertise = require('./knowledge/mobile-frontend-expertise');
      return MobileExpertise.getMobileDevelopmentExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Mobile Development Specialist',
        expertise: {
          'native_ios': 'Swift, SwiftUI, UIKit, Xcode, iOS SDK',
          'native_android': 'Kotlin, Jetpack Compose, Android SDK',
          'cross_platform': 'React Native, Flutter, Expo',
          'mobile_architecture': 'MVVM, MVP, Clean Architecture'
        },
        capabilities: [
          'Native iOS development',
          'Native Android development',
          'Cross-platform development',
          'Mobile UI/UX',
          'App store deployment',
          'Mobile testing'
        ],
        systemPromptAdditions: 'You are a Mobile Development expert specializing in native and cross-platform mobile applications.'
      };
    }
  }

  /**
   * Frontend Engineering Specialist Template
   */
  getFrontendEngineeringSpecialistTemplate() {
    // Import enhanced expertise if available
    try {
      const FrontendExpertise = require('./knowledge/mobile-frontend-expertise');
      return FrontendExpertise.getFrontendEngineeringExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'Frontend Engineering Specialist',
        expertise: {
          'web_fundamentals': 'HTML5, CSS3, JavaScript ES6+, TypeScript',
          'frameworks': 'React, Vue, Angular, Svelte',
          'state_management': 'Redux, MobX, Vuex, Pinia',
          'styling': 'CSS-in-JS, Tailwind CSS, Sass'
        },
        capabilities: [
          'Modern frontend development',
          'SPA architecture',
          'State management',
          'Performance optimization',
          'Responsive design',
          'Frontend testing'
        ],
        systemPromptAdditions: 'You are a Frontend Engineering expert specializing in modern web applications.'
      };
    }
  }

  /**
   * UI/UX Design Specialist Template
   */
  getUIUXDesignSpecialistTemplate() {
    // Import enhanced expertise if available
    try {
      const UIUXExpertise = require('./knowledge/mobile-frontend-expertise');
      return UIUXExpertise.getUIUXDesignExpertise();
    } catch (e) {
      // Fallback to basic template
      return {
        name: 'UI/UX Design Specialist',
        expertise: {
          'design_principles': 'Visual hierarchy, typography, color theory',
          'user_research': 'User interviews, personas, journey mapping',
          'prototyping': 'Figma, Sketch, Adobe XD',
          'design_systems': 'Component libraries, design tokens'
        },
        capabilities: [
          'User experience design',
          'Visual design',
          'Prototyping',
          'User research',
          'Design systems',
          'Usability testing'
        ],
        systemPromptAdditions: 'You are a UI/UX Design expert specializing in user-centered design.'
      };
    }
  }

  // Language Specialist Templates - Sprint 24
  getPythonSpecialistTemplate() {
    try {
      const LanguageExpertise = require('./knowledge/language-expertise');
      return LanguageExpertise.getPythonExpertise();
    } catch (e) {
      return this.getDefaultTemplate();
    }
  }

  getJavaSpecialistTemplate() {
    try {
      const LanguageExpertise = require('./knowledge/language-expertise');
      return LanguageExpertise.getJavaExpertise();
    } catch (e) {
      return this.getDefaultTemplate();
    }
  }

  getCppSpecialistTemplate() {
    try {
      const LanguageExpertise = require('./knowledge/language-expertise');
      return LanguageExpertise.getCppExpertise();
    } catch (e) {
      return this.getDefaultTemplate();
    }
  }

  getCSharpSpecialistTemplate() {
    try {
      const LanguageExpertise = require('./knowledge/language-expertise');
      return LanguageExpertise.getCSharpExpertise();
    } catch (e) {
      return this.getDefaultTemplate();
    }
  }

  getGoSpecialistTemplate() {
    try {
      const LanguageExpertise = require('./knowledge/language-expertise');
      return LanguageExpertise.getGoExpertise();
    } catch (e) {
      return this.getDefaultTemplate();
    }
  }

  getRubySpecialistTemplate() {
    try {
      const LanguageExpertise = require('./knowledge/language-expertise');
      return LanguageExpertise.getRubyExpertise();
    } catch (e) {
      return this.getDefaultTemplate();
    }
  }

  getPHPSpecialistTemplate() {
    try {
      const LanguageExpertise = require('./knowledge/language-expertise');
      const otherLangs = LanguageExpertise.getOtherLanguagesExpertise();
      return otherLangs.php;
    } catch (e) {
      return this.getDefaultTemplate();
    }
  }

  getSwiftSpecialistTemplate() {
    try {
      const LanguageExpertise = require('./knowledge/language-expertise');
      const otherLangs = LanguageExpertise.getOtherLanguagesExpertise();
      return otherLangs.swift;
    } catch (e) {
      return this.getDefaultTemplate();
    }
  }

  getKotlinSpecialistTemplate() {
    try {
      const LanguageExpertise = require('./knowledge/language-expertise');
      const otherLangs = LanguageExpertise.getOtherLanguagesExpertise();
      return otherLangs.kotlin;
    } catch (e) {
      return this.getDefaultTemplate();
    }
  }

  getRustSpecialistTemplate() {
    try {
      const LanguageExpertise = require('./knowledge/language-expertise');
      const otherLangs = LanguageExpertise.getOtherLanguagesExpertise();
      return otherLangs.rust;
    } catch (e) {
      return this.getDefaultTemplate();
    }
  }

  getElixirSpecialistTemplate() {
    try {
      const LanguageExpertise = require('./knowledge/language-expertise');
      const otherLangs = LanguageExpertise.getOtherLanguagesExpertise();
      return otherLangs.elixir;
    } catch (e) {
      return this.getDefaultTemplate();
    }
  }

  loadEnhancedExpertise(specialistType) {
    try {
      // Map specialist types to expertise modules
      const expertiseMap = {
        // Language specialists
        'python-specialist': () => require('./knowledge/language-expertise').getPythonExpertise(),
        'javascript-specialist': () => require('./knowledge/language-expertise').getJavaScriptExpertise(),
        'java-specialist': () => require('./knowledge/language-expertise').getJavaExpertise(),
        'cpp-specialist': () => require('./knowledge/language-expertise').getCppExpertise(),
        'csharp-specialist': () => require('./knowledge/language-expertise').getCSharpExpertise(),
        'golang-specialist': () => require('./knowledge/language-expertise').getGoExpertise(),
        'ruby-specialist': () => require('./knowledge/language-expertise').getRubyExpertise(),
        
        // Documentation specialists
        'technical-writer': () => require('./knowledge/documentation-expertise').getTechnicalWriterExpertise(),
        'api-documentation-specialist': () => require('./knowledge/documentation-expertise').getAPIDocumentationExpertise(),
        'developer-docs-specialist': () => require('./knowledge/documentation-expertise').getDeveloperDocsExpertise(),
        
        // Advanced technical
        'blockchain-specialist': () => require('./knowledge/advanced-technical-expertise').getBlockchainExpertise(),
        'game-developer': () => require('./knowledge/advanced-technical-expertise').getGameDevelopmentExpertise(),
        'ai-ml-specialist': () => require('./knowledge/advanced-technical-expertise').getAIMLExpertise(),
        'quantum-computing-specialist': () => require('./knowledge/advanced-technical-expertise').getQuantumComputingExpertise(),
        
        // Database specialists
        'oracle-specialist': () => require('./knowledge/database-complete-expertise').getOracleExpertise(),
        'sql-server-specialist': () => require('./knowledge/database-complete-expertise').getSQLServerExpertise(),
        'dynamodb-specialist': () => require('./knowledge/database-complete-expertise').getDynamoDBExpertise(),
        'neo4j-specialist': () => require('./knowledge/database-complete-expertise').getNeo4jExpertise(),
        'influxdb-specialist': () => require('./knowledge/database-complete-expertise').getInfluxDBExpertise(),
        
        // Specialized technical
        'iot-specialist': () => require('./knowledge/specialized-technical-expertise').getIoTExpertise(),
        'embedded-systems-specialist': () => require('./knowledge/specialized-technical-expertise').getEmbeddedSystemsExpertise(),
        'ar-vr-specialist': () => require('./knowledge/specialized-technical-expertise').getARVRExpertise(),
        'robotics-specialist': () => require('./knowledge/specialized-technical-expertise').getRoboticsExpertise(),
        'bioinformatics-specialist': () => require('./knowledge/specialized-technical-expertise').getBioinformaticsExpertise(),
        
        // Strategic specialists
        'product-owner': () => require('./knowledge/strategic-complete-expertise').getProductOwnerExpertise(),
        'marketing-specialist': () => require('./knowledge/strategic-complete-expertise').getMarketingExpertise(),
        'sales-specialist': () => require('./knowledge/strategic-complete-expertise').getSalesExpertise(),
        'finance-specialist': () => require('./knowledge/strategic-complete-expertise').getFinanceExpertise(),
        'legal-compliance-specialist': () => require('./knowledge/strategic-complete-expertise').getLegalComplianceExpertise(),
        'hr-specialist': () => require('./knowledge/strategic-complete-expertise').getHRExpertise()
      };
      
      if (expertiseMap[specialistType]) {
        return expertiseMap[specialistType]();
      }
    } catch (error) {
      // Silently fall back to default templates
      console.log(`Enhanced expertise not found for ${specialistType}, using defaults`);
    }
    return null;
  }

  getDefaultTemplate() {
    return {
      expertise: 'General software development',
      capabilities: ['Analysis', 'Implementation', 'Testing', 'Documentation'],
      systemPromptAdditions: 'You are a software development specialist.'
    };
  }
}

// Create singleton instance
const knowledgeTemplates = new SpecialistKnowledgeTemplates();

// Export with standard pattern
module.exports = {
  SpecialistKnowledgeTemplates,  // Class
  knowledgeTemplates,  // Singleton instance
  getTemplate: (type) => knowledgeTemplates.getTemplate(type),  // Direct method access
  templates: knowledgeTemplates.templates  // Direct templates access
};