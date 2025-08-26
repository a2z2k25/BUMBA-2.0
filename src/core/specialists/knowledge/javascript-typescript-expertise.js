/**
 * BUMBA JavaScript & TypeScript Deep Expertise
 * Comprehensive knowledge base for JS/TS specialists
 * Sprint 6 Enhancement
 */

class JavaScriptTypeScriptExpertise {
  /**
   * Enhanced JavaScript Knowledge Template
   */
  static getJavaScriptExpertise() {
    return {
      name: 'JavaScript Expert',
      
      expertise: {
        core: {
          language: 'ECMAScript 2024, TC39 proposals, JavaScript engine internals',
          runtime: 'Node.js 20+, Deno, Bun, V8 optimization, event loop mechanics',
          async: 'Promises, async/await, generators, observables, async iterators',
          memory: 'Garbage collection, memory leaks, heap profiling, WeakMap/WeakSet',
          performance: 'Performance API, Web Workers, SharedArrayBuffer, WASM integration'
        },
        
        frameworks: {
          backend: ['Express.js', 'Fastify', 'Nest.js', 'Koa', 'Hapi', 'Meteor'],
          frontend: ['React', 'Vue', 'Angular', 'Svelte', 'Solid', 'Qwik'],
          fullstack: ['Next.js', 'Nuxt', 'Remix', 'SvelteKit', 'Astro'],
          mobile: ['React Native', 'Ionic', 'NativeScript', 'Expo'],
          desktop: ['Electron', 'Tauri', 'NodeGUI']
        },
        
        testing: {
          unit: ['Jest', 'Vitest', 'Mocha', 'Jasmine', 'AVA'],
          e2e: ['Playwright', 'Cypress', 'Puppeteer', 'WebDriver'],
          coverage: ['C8', 'NYC', 'Istanbul'],
          mocking: ['Sinon', 'MSW', 'Nock']
        },
        
        buildTools: {
          bundlers: ['Webpack', 'Vite', 'Rollup', 'Parcel', 'esbuild', 'SWC'],
          transpilers: ['Babel', 'SWC', 'esbuild'],
          taskRunners: ['npm scripts', 'Gulp', 'Grunt'],
          monorepo: ['Turborepo', 'Nx', 'Lerna', 'Rush', 'pnpm workspaces']
        },
        
        patterns: {
          design: ['Module', 'Singleton', 'Factory', 'Observer', 'Decorator', 'Proxy'],
          architectural: ['MVC', 'MVP', 'MVVM', 'Flux', 'Redux', 'MobX patterns'],
          functional: ['Pure functions', 'Immutability', 'Composition', 'Currying'],
          reactive: ['RxJS', 'Event streams', 'State machines', 'XState']
        }
      },
      
      capabilities: [
        'Modern JavaScript development (ES2024+)',
        'Node.js backend architecture',
        'Frontend framework expertise',
        'Performance optimization',
        'Memory management',
        'Async programming patterns',
        'Testing strategies',
        'Build tool configuration',
        'Package management',
        'Security best practices',
        'Code splitting & lazy loading',
        'Server-side rendering',
        'API design (REST/GraphQL)',
        'WebSocket implementation',
        'Microservices architecture'
      ],
      
      codePatterns: {
        asyncErrorHandler: `
// Async error handling wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Usage
app.get('/api/users', asyncHandler(async (req, res) => {
  const users = await User.findAll();
  res.json(users);
}));`,
        
        eventEmitterPattern: `
// Custom event emitter with TypedEvents
class TypedEventEmitter<T extends Record<string, any>> {
  private events = new Map<keyof T, Set<(data: any) => void>>();
  
  on<K extends keyof T>(event: K, handler: (data: T[K]) => void) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
    return () => this.off(event, handler);
  }
  
  emit<K extends keyof T>(event: K, data: T[K]) {
    this.events.get(event)?.forEach(handler => handler(data));
  }
  
  off<K extends keyof T>(event: K, handler: (data: T[K]) => void) {
    this.events.get(event)?.delete(handler);
  }
}`,
        
        dependencyInjection: `
// Dependency injection container
class DIContainer {
  private services = new Map();
  private singletons = new Map();
  
  register(name, factory, options = {}) {
    this.services.set(name, {
      factory,
      singleton: options.singleton || false
    });
  }
  
  resolve(name) {
    const service = this.services.get(name);
    if (!service) throw new Error(\`Service \${name} not found\`);
    
    if (service.singleton) {
      if (!this.singletons.has(name)) {
        this.singletons.set(name, service.factory(this));
      }
      return this.singletons.get(name);
    }
    
    return service.factory(this);
  }
}`,
        
        performanceOptimization: `
// Memoization with cache management
function memoize(fn, options = {}) {
  const cache = new Map();
  const maxSize = options.maxSize || 100;
  const ttl = options.ttl || Infinity;
  
  return function(...args) {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      const { value, timestamp } = cache.get(key);
      if (Date.now() - timestamp < ttl) {
        return value;
      }
      cache.delete(key);
    }
    
    const value = fn.apply(this, args);
    
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    cache.set(key, { value, timestamp: Date.now() });
    return value;
  };
}`,
        
        reactiveState: `
// Reactive state management
function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();
  
  return {
    getState: () => state,
    setState: (updater) => {
      state = typeof updater === 'function' ? updater(state) : updater;
      listeners.forEach(listener => listener(state));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}`
      },
      
      bestPractices: [
        'Use const/let instead of var for block scoping',
        'Prefer async/await over promise chains for readability',
        'Implement proper error boundaries and error handling',
        'Use TypeScript for large-scale applications',
        'Follow ESLint/Prettier for consistent code style',
        'Write comprehensive tests (aim for 80%+ coverage)',
        'Optimize bundle sizes with code splitting',
        'Implement proper logging and monitoring',
        'Use environment variables for configuration',
        'Validate input data at boundaries',
        'Implement rate limiting for APIs',
        'Use caching strategies appropriately',
        'Follow security best practices (OWASP)',
        'Document complex logic and APIs',
        'Use semantic versioning for packages'
      ],
      
      debuggingCapabilities: [
        'Chrome DevTools profiling',
        'Node.js debugging with --inspect',
        'Memory leak detection',
        'Performance profiling',
        'Network request analysis',
        'Source map debugging',
        'Remote debugging',
        'Conditional breakpoints',
        'Async stack traces',
        'Error tracking (Sentry integration)'
      ],
      
      systemPromptAdditions: `
You are an expert JavaScript developer with deep knowledge of:
- Modern ECMAScript features and TC39 proposals
- Node.js internals and V8 optimization techniques
- Frontend frameworks (React, Vue, Angular, Svelte)
- Backend frameworks (Express, Nest.js, Fastify)
- Testing strategies and tools (Jest, Playwright, Cypress)
- Build tools and bundlers (Webpack, Vite, esbuild)
- Performance optimization techniques
- Security best practices
- Microservices and serverless architectures

When writing JavaScript code:
- Always use modern ES2024+ syntax
- Implement proper error handling with try/catch or error boundaries
- Use async/await for asynchronous operations
- Follow functional programming principles where appropriate
- Optimize for performance and bundle size
- Include comprehensive error messages
- Write self-documenting code with clear variable names
- Consider edge cases and error scenarios
- Implement proper input validation
- Use appropriate data structures for the task`
    };
  }
  
  /**
   * Enhanced TypeScript Knowledge Template
   */
  static getTypeScriptExpertise() {
    return {
      name: 'TypeScript Expert',
      
      expertise: {
        core: {
          typeSystem: 'Structural typing, type inference, type guards, narrowing',
          advanced: 'Conditional types, mapped types, template literals, recursive types',
          generics: 'Generic constraints, variance, higher-kinded types patterns',
          decorators: 'Metadata reflection, class/method/property decorators',
          compiler: 'tsconfig optimization, strict mode, project references'
        },
        
        patterns: {
          utility: 'Partial, Required, Readonly, Pick, Omit, Record patterns',
          branded: 'Branded types, nominal typing, opaque types',
          guards: 'Type predicates, assertion functions, discriminated unions',
          builders: 'Fluent APIs, builder patterns with type inference',
          functional: 'Function overloading, this types, contextual typing'
        },
        
        frameworks: {
          node: ['Express + types', 'Fastify + types', 'Nest.js (native TS)'],
          frontend: ['React + TS', 'Vue 3 + TS', 'Angular (native TS)', 'Svelte + TS'],
          fullstack: ['Next.js + TS', 'Nuxt 3 + TS', 'Remix + TS'],
          orm: ['TypeORM', 'Prisma', 'MikroORM', 'Drizzle'],
          validation: ['Zod', 'Yup', 'io-ts', 'Joi']
        },
        
        tooling: {
          linting: ['ESLint + TS', 'typescript-eslint', 'tslint migration'],
          testing: ['Jest + TS', 'Vitest', 'ts-jest configuration'],
          bundling: ['Webpack + ts-loader', 'Vite', 'esbuild', 'SWC'],
          docs: ['TypeDoc', 'API Extractor', 'TSDoc comments']
        }
      },
      
      capabilities: [
        'TypeScript configuration and setup',
        'Advanced type system usage',
        'Generic programming',
        'Decorator implementation',
        'Type-safe API design',
        'Migration from JavaScript',
        'Type declaration files (.d.ts)',
        'Module resolution strategies',
        'Monorepo TypeScript setup',
        'Type-safe ORM usage',
        'Runtime type validation',
        'Build optimization',
        'Type-safe testing',
        'API contract enforcement',
        'Code generation from types'
      ],
      
      codePatterns: {
        utilityTypes: `
// Advanced utility types
type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

type DeepReadonly<T> = T extends object ? {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
} : T;

type Paths<T, D extends number = 10> = [D] extends [never] ? never : 
  T extends object ? {
    [K in keyof T]-?: K extends string | number ?
      \`\${K}\` | (Paths<T[K], Prev[D]> extends string ? \`\${K}.\${Paths<T[K], Prev[D]>}\` : never)
      : never
  }[keyof T] : "";

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];`,
        
        brandedTypes: `
// Branded types for type safety
type Brand<K, T> = K & { __brand: T };

type UserId = Brand<string, 'UserId'>;
type PostId = Brand<string, 'PostId'>;

function getUserById(id: UserId) { /* ... */ }
function getPostById(id: PostId) { /* ... */ }

// Create branded values
const userId = 'user123' as UserId;
const postId = 'post456' as PostId;

// Type error: Argument of type 'PostId' is not assignable to parameter of type 'UserId'
// getUserById(postId);`,
        
        builderPattern: `
// Type-safe builder pattern
class QueryBuilder<T = {}> {
  private query: T;
  
  constructor(query: T = {} as T) {
    this.query = query;
  }
  
  select<K extends string>(fields: K[]): QueryBuilder<T & { select: K[] }> {
    return new QueryBuilder({ ...this.query, select: fields });
  }
  
  where<W>(conditions: W): QueryBuilder<T & { where: W }> {
    return new QueryBuilder({ ...this.query, where: conditions });
  }
  
  orderBy<O extends string>(field: O, direction: 'asc' | 'desc' = 'asc'): 
    QueryBuilder<T & { orderBy: { field: O; direction: 'asc' | 'desc' } }> {
    return new QueryBuilder({ ...this.query, orderBy: { field, direction } });
  }
  
  build(): T {
    return this.query;
  }
}`,
        
        discriminatedUnions: `
// Discriminated unions for state management
type LoadingState = { status: 'loading' };
type ErrorState = { status: 'error'; error: Error };
type SuccessState<T> = { status: 'success'; data: T };

type AsyncState<T> = LoadingState | ErrorState | SuccessState<T>;

function handleState<T>(state: AsyncState<T>) {
  switch (state.status) {
    case 'loading':
      return 'Loading...';
    case 'error':
      return \`Error: \${state.error.message}\`;
    case 'success':
      return \`Success: \${JSON.stringify(state.data)}\`;
  }
}`,
        
        typeGuards: `
// Advanced type guards
function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

function isArrayOf<T>(
  value: unknown,
  itemGuard: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(itemGuard);
}`
      },
      
      bestPractices: [
        'Enable strict mode in tsconfig.json',
        'Use unknown instead of any when type is truly unknown',
        'Prefer interfaces over type aliases for object shapes',
        'Use const assertions for literal types',
        'Implement proper type guards instead of type assertions',
        'Use generics for reusable components',
        'Avoid excessive type assertions (as)',
        'Document complex types with TSDoc comments',
        'Use discriminated unions for state management',
        'Prefer readonly arrays and properties',
        'Use template literal types for string patterns',
        'Implement branded types for domain modeling',
        'Use conditional types for type-level programming',
        'Keep types close to their usage',
        'Export types separately from implementations'
      ],
      
      systemPromptAdditions: `
You are a TypeScript expert specializing in:
- Advanced type system features (conditional types, mapped types, recursive types)
- Type-safe design patterns and architectures
- Migration strategies from JavaScript to TypeScript
- Performance implications of TypeScript features
- Integration with modern build tools and frameworks
- Type-level programming and meta-programming

When writing TypeScript code:
- Always use strict mode configuration
- Prefer type inference over explicit annotations where appropriate
- Use discriminated unions for exhaustive pattern matching
- Implement proper type guards and assertion functions
- Leverage utility types and generic constraints
- Write self-documenting types with clear names
- Use branded types for domain modeling
- Implement builder patterns with type inference
- Consider compilation performance with complex types
- Document complex types with examples`
    };
  }
  
  /**
   * Get debugging expertise for JS/TS
   */
  static getDebuggingExpertise() {
    return {
      tools: [
        'Chrome DevTools',
        'VS Code Debugger',
        'Node.js Inspector',
        'React DevTools',
        'Vue DevTools',
        'Redux DevTools',
        'Lighthouse',
        'WebPageTest'
      ],
      
      techniques: {
        performance: [
          'CPU profiling',
          'Memory profiling',
          'Network waterfall analysis',
          'Bundle size analysis',
          'Runtime performance metrics',
          'Long task detection'
        ],
        
        memory: [
          'Heap snapshots',
          'Allocation timeline',
          'Memory leak detection',
          'Retained object analysis',
          'Garbage collection tracking'
        ],
        
        async: [
          'Async stack traces',
          'Promise rejection tracking',
          'Event loop monitoring',
          'Async hooks debugging',
          'Race condition detection'
        ],
        
        production: [
          'Source map debugging',
          'Remote debugging',
          'Error tracking (Sentry)',
          'Log aggregation',
          'APM integration',
          'Real user monitoring'
        ]
      },
      
      commonIssues: {
        memoryLeaks: [
          'Event listener cleanup',
          'Timer cleanup',
          'Closure references',
          'DOM detached nodes',
          'Global variable pollution'
        ],
        
        performance: [
          'Unnecessary re-renders',
          'Large bundle sizes',
          'Blocking main thread',
          'Inefficient algorithms',
          'N+1 query problems'
        ],
        
        async: [
          'Unhandled promise rejections',
          'Race conditions',
          'Callback hell',
          'Async error handling',
          'Event loop blocking'
        ]
      }
    };
  }
}

module.exports = JavaScriptTypeScriptExpertise;