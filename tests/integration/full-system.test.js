/**
 * BUMBA Full System Integration Test
 * Tests the complete command flow from input to output
 */

const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs').promises;

// Core components
const { getInstance: getRouter } = require('../../src/core/command-intelligence/command-router');
const { getInstance: getSelector } = require('../../src/core/command-intelligence/specialist-selector');
const { getInstance: getGenerator } = require('../../src/core/command-intelligence/intelligent-output-generator');
const { getInstance: getCacheManager } = require('../../src/core/command-intelligence/cache-manager');
const { getInstance: getPerformanceMonitor } = require('../../src/core/command-intelligence/performance-monitor');
const { getInstance: getErrorManager } = require('../../src/core/error-handling/unified-error-manager');

describe('BUMBA Full System Integration', () => {
  let router, selector, generator, cache, monitor, errorManager;
  
  before(() => {
    // Initialize all components
    router = getRouter();
    selector = getSelector();
    generator = getGenerator();
    cache = getCacheManager();
    monitor = getPerformanceMonitor();
    errorManager = getErrorManager();
  });
  
  beforeEach(() => {
    // Clear state before each test
    cache.clear();
    monitor.reset();
  });
  
  describe('Command Routing Integration', () => {
    it('should route PRD command to Product department', async () => {
      const result = await router.route('prd', ['Test Feature'], {});
      
      expect(result).to.exist;
      expect(result.success).to.be.true;
      expect(result.department).to.equal('product');
      expect(result.specialists).to.include('product-manager');
    });
    
    it('should route API command to Backend department', async () => {
      const result = await router.route('api', ['User API'], {});
      
      expect(result).to.exist;
      expect(result.success).to.be.true;
      expect(result.department).to.equal('backend');
      expect(result.specialists).to.include('api-specialist');
    });
    
    it('should route design command to Design department', async () => {
      const result = await router.route('design', ['Dashboard'], {});
      
      expect(result).to.exist;
      expect(result.success).to.be.true;
      expect(result.department).to.equal('design');
      expect(result.specialists).to.include('ui-designer');
    });
  });
  
  describe('Execution Modes Integration', () => {
    it('should execute in lite mode with caching', async () => {
      // First execution
      const result1 = await router.route('analyze', ['test.js'], { mode: 'lite' });
      expect(result1.success).to.be.true;
      
      // Second execution should hit cache
      const result2 = await router.route('analyze', ['test.js'], { mode: 'lite' });
      expect(result2.success).to.be.true;
      
      const stats = cache.getStats();
      expect(stats.hits).to.be.greaterThan(0);
    });
    
    it('should execute in turbo mode with parallelization', async () => {
      const startTime = Date.now();
      const result = await router.route('build', ['api'], { mode: 'turbo' });
      const duration = Date.now() - startTime;
      
      expect(result.success).to.be.true;
      expect(result.parallel).to.be.true;
      // Turbo mode should be faster
      expect(duration).to.be.lessThan(5000);
    });
    
    it('should execute in eco mode with resource limits', async () => {
      const result = await router.route('implement', ['feature'], { mode: 'eco' });
      
      expect(result.success).to.be.true;
      expect(result.context.limitSpecialists).to.be.lessThanOrEqual(2);
    });
  });
  
  describe('Multi-Agent Collaboration', () => {
    it('should coordinate between departments for design-api command', async () => {
      const result = await router.route('design-api', ['Payment API'], {
        collaboration: true
      });
      
      expect(result.success).to.be.true;
      expect(result.departments).to.include.members(['design', 'backend']);
      expect(result.specialists).to.include.members(['ui-designer', 'api-specialist']);
    });
    
    it('should share context between collaborating agents', async () => {
      const result = await router.route('full-stack', ['Feature'], {
        collaboration: true
      });
      
      expect(result.success).to.be.true;
      expect(result.sharedContext).to.exist;
      expect(result.sharedContext.frontend).to.exist;
      expect(result.sharedContext.backend).to.exist;
    });
  });
  
  describe('Command Chaining Integration', () => {
    it('should execute sequential chain with &&', async () => {
      const chain = 'analyze && optimize && implement';
      const executor = require('../../src/core/command-intelligence/command-chain-executor').getInstance();
      
      const result = await executor.executeChain(chain, { file: 'test.js' }, {});
      
      expect(result.success).to.be.true;
      expect(result.executedCommands).to.have.lengthOf(3);
      expect(result.executedCommands).to.deep.equal(['analyze', 'optimize', 'implement']);
    });
    
    it('should handle conditional chain with ||', async () => {
      const chain = 'test || debug';
      const executor = require('../../src/core/command-intelligence/command-chain-executor').getInstance();
      
      // Mock test to fail
      sinon.stub(router, 'route').withArgs('test').resolves({ success: false });
      
      const result = await executor.executeChain(chain, {}, {});
      
      expect(result.executedCommands).to.include('debug');
      
      router.route.restore();
    });
    
    it('should pipe data through chain with |', async () => {
      const chain = 'extract | transform | load';
      const executor = require('../../src/core/command-intelligence/command-chain-executor').getInstance();
      
      const result = await executor.executeChain(chain, { source: 'data.csv' }, {});
      
      expect(result.success).to.be.true;
      expect(result.pipelineData).to.exist;
    });
  });
  
  describe('Performance Optimization Integration', () => {
    it('should cache command results', async () => {
      const command = 'analyze';
      const args = ['cached-file.js'];
      
      // First execution
      await router.route(command, args, {});
      
      // Second execution should be cached
      const startTime = Date.now();
      await router.route(command, args, {});
      const duration = Date.now() - startTime;
      
      expect(duration).to.be.lessThan(10); // Cache hit should be very fast
      
      const stats = cache.getStats();
      expect(stats.hitRate).to.not.equal('0%');
    });
    
    it('should monitor performance metrics', async () => {
      await router.route('implement', ['feature'], {});
      
      const stats = monitor.getStats();
      expect(stats.totalProcessed).to.be.greaterThan(0);
      expect(stats.averageTime).to.exist;
    });
    
    it('should optimize resources under pressure', async () => {
      const optimizer = require('../../src/core/command-intelligence/resource-optimizer').getInstance();
      
      // Simulate high memory pressure
      const optimization = await optimizer.optimizeForCommand('heavy-task', [], {});
      
      expect(optimization.applied).to.be.an('array');
      if (optimization.applied.length > 0) {
        expect(optimization.context).to.have.property('mode');
      }
    });
  });
  
  describe('Error Handling Integration', () => {
    it('should handle and recover from errors', async () => {
      // Simulate an error
      const error = new Error('Test error');
      error.code = 'TEST_ERROR';
      
      const result = await errorManager.handleError(error, {
        command: 'test',
        canRetry: true
      });
      
      expect(result).to.exist;
      expect(result.classification).to.exist;
      expect(result.recovery).to.exist;
    });
    
    it('should not create excessive dump files', async () => {
      // Trigger multiple errors
      for (let i = 0; i < 20; i++) {
        await errorManager.handleError(new Error(`Error ${i}`), {});
      }
      
      // Check dump directory
      const dumpDir = path.join(process.cwd(), '.bumba-errors');
      try {
        const files = await fs.readdir(dumpDir);
        expect(files.length).to.be.lessThanOrEqual(10); // Max 10 dump files
      } catch (err) {
        // Directory might not exist if no dumps were created
        expect(err.code).to.equal('ENOENT');
      }
    });
  });
  
  describe('Specialist Selection Integration', () => {
    it('should select appropriate specialists for command', async () => {
      const specialists = await selector.selectSpecialists('api', ['REST API'], {});
      
      expect(specialists).to.be.an('array');
      expect(specialists).to.not.be.empty;
      expect(specialists.some(s => s.id === 'api-specialist')).to.be.true;
    });
    
    it('should limit specialists in eco mode', async () => {
      const specialists = await selector.selectSpecialists('implement', ['feature'], {
        mode: 'eco',
        limitSpecialists: 2
      });
      
      expect(specialists).to.have.lengthOf.at.most(2);
    });
    
    it('should prioritize specialists based on context', async () => {
      const specialists = await selector.selectSpecialists('database', ['schema'], {
        urgent: true
      });
      
      expect(specialists[0].priority).to.be.greaterThanOrEqual(7);
    });
  });
  
  describe('Output Generation Integration', () => {
    it('should generate appropriate output format', async () => {
      const analysis = {
        requirements: ['req1', 'req2'],
        implementation: { steps: ['step1', 'step2'] }
      };
      
      const output = await generator.generateOutput('prd', ['feature'], analysis, {});
      
      expect(output).to.exist;
      expect(output.content).to.include('# Product Requirements Document');
      expect(output.file).to.include('/output/prd/');
    });
    
    it('should save output to correct location', async () => {
      const content = '# Test Output';
      const result = await generator.saveOutput(content, 'prd', 'test-output.md');
      
      expect(result.path).to.include('/output/prd/');
      expect(result.success).to.be.true;
    });
  });
  
  describe('Load Balancing Integration', () => {
    it('should balance load across specialists', async () => {
      const balancer = require('../../src/core/command-intelligence/load-balancer').getInstance();
      
      // Create multiple requests
      const requests = Array(5).fill().map((_, i) => ({
        command: 'analyze',
        args: [`file${i}.js`],
        priority: 5
      }));
      
      const results = await Promise.all(
        requests.map(req => balancer.balance(req, {}))
      );
      
      expect(results).to.have.lengthOf(5);
      results.forEach(r => expect(r.success).to.be.true);
      
      const stats = balancer.getStats();
      expect(stats.requests.balanced).to.equal(5);
    });
  });
  
  describe('Memory Management Integration', () => {
    it('should manage memory efficiently', async () => {
      const memory = require('../../src/core/command-intelligence/memory-manager').getInstance();
      
      // Create object pool
      memory.createObjectPool('TestObject', 
        () => ({ data: null }),
        (obj) => { obj.data = null; }
      );
      
      // Allocate and deallocate
      const obj1 = memory.allocate('TestObject');
      const obj2 = memory.allocate('TestObject');
      
      expect(obj1).to.exist;
      expect(obj2).to.exist;
      expect(obj1).to.not.equal(obj2);
      
      memory.deallocate('TestObject', obj1);
      
      const stats = memory.getStats();
      expect(stats.operations.allocations).to.equal(2);
      expect(stats.operations.deallocations).to.equal(1);
    });
  });
  
  describe('Full Command Flow', () => {
    it('should execute complete PRD generation flow', async function() {
      this.timeout(10000);
      
      const result = await router.route('prd', ['E-commerce Platform'], {
        mode: 'full'
      });
      
      expect(result).to.deep.include({
        success: true,
        department: 'product'
      });
      expect(result.specialists).to.include('product-manager');
      expect(result.file).to.exist;
      expect(result.content).to.include('Requirements');
    });
    
    it('should execute complete API development flow', async function() {
      this.timeout(10000);
      
      const result = await router.route('api', ['User Management API'], {
        mode: 'turbo'
      });
      
      expect(result).to.deep.include({
        success: true,
        department: 'backend'
      });
      expect(result.specialists).to.include('api-specialist');
      expect(result.file).to.exist;
    });
  });
});

// Run tests
if (require.main === module) {
  const Mocha = require('mocha');
  const mocha = new Mocha();
  
  mocha.addFile(__filename);
  mocha.run(failures => {
    process.exit(failures ? 1 : 0);
  });
}