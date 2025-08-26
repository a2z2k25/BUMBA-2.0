/**
 * BUMBA Workflow Systems Test Suite
 * Comprehensive tests for all workflow components
 */

const { WorkflowEngine } = require('../../../src/core/workflow/workflow-engine');
const { PipelineManager } = require('../../../src/core/workflow/pipeline-manager');
const { TaskAutomation } = require('../../../src/core/workflow/task-automation');
const { SpecialistIntegration } = require('../../../src/core/workflow/specialist-integration');
const UnifiedSpecialistBase = require('../../../src/core/specialists/unified-specialist-base');

describe('Workflow Systems Test Suite', () => {
  
  describe('WorkflowEngine', () => {
    let engine;
    
    beforeEach(() => {
      engine = new WorkflowEngine();
    });
    
    afterEach(() => {
      engine.destroy();
    });
    
    test('should create workflow', async () => {
      const workflow = await engine.createWorkflow({
        name: 'Test Workflow',
        steps: [
          { type: 'task', name: 'Step 1' },
          { type: 'task', name: 'Step 2' }
        ]
      });
      
      expect(workflow).toBeDefined();
      expect(workflow.name).toBe('Test Workflow');
      expect(workflow.steps).toHaveLength(2);
    });
    
    test('should execute sequential workflow', async () => {
      const workflow = await engine.createWorkflow({
        name: 'Sequential Test',
        steps: [
          { type: 'transform', name: 'Add 1', transformation: (data) => data + 1 },
          { type: 'transform', name: 'Multiply 2', transformation: (data) => data * 2 }
        ]
      });
      
      const result = await engine.executeWorkflow(workflow.id, { value: 5 });
      
      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
    });
    
    test('should execute parallel workflow', async () => {
      const workflow = await engine.createWorkflow({
        name: 'Parallel Test',
        config: { parallel: true },
        steps: [
          { type: 'wait', name: 'Wait 100ms', duration: 100 },
          { type: 'wait', name: 'Wait 100ms', duration: 100 }
        ]
      });
      
      const startTime = Date.now();
      const result = await engine.executeWorkflow(workflow.id);
      const duration = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(200); // Should run in parallel
    });
    
    test('should handle conditional branching', async () => {
      const workflow = await engine.createWorkflow({
        name: 'Conditional Test',
        steps: [
          {
            type: 'condition',
            name: 'Check Value',
            expression: '$value > 5',
            ifTrue: 'stop',
            ifFalse: 'continue'
          }
        ]
      });
      
      const result = await engine.executeWorkflow(workflow.id, { value: 10 });
      
      expect(result.success).toBe(true);
      expect(result.results['Check Value'].action).toBe('stop');
    });
    
    test('should handle workflow errors', async () => {
      const workflow = await engine.createWorkflow({
        name: 'Error Test',
        steps: [
          {
            type: 'transform',
            name: 'Error Step',
            transformation: () => { throw new Error('Test error'); }
          }
        ],
        config: { errorHandling: 'stop' }
      });
      
      await expect(engine.executeWorkflow(workflow.id))
        .rejects.toThrow('Test error');
    });
    
    test('should support workflow templates', () => {
      const templates = engine.templates;
      
      expect(templates.size).toBeGreaterThan(0);
      expect(templates.has('simple-task')).toBe(true);
      expect(templates.has('parallel-tasks')).toBe(true);
    });
  });
  
  describe('PipelineManager', () => {
    let pipelineManager;
    
    beforeEach(() => {
      pipelineManager = new PipelineManager();
    });
    
    afterEach(() => {
      pipelineManager.destroy();
    });
    
    test('should create pipeline', async () => {
      const pipeline = await pipelineManager.createPipeline({
        name: 'Test Pipeline',
        stages: [
          { type: 'transform', name: 'Parse' },
          { type: 'filter', name: 'Validate' },
          { type: 'transform', name: 'Format' }
        ]
      });
      
      expect(pipeline).toBeDefined();
      expect(pipeline.name).toBe('Test Pipeline');
      expect(pipeline.stages).toHaveLength(3);
    });
    
    test('should execute pipeline', async () => {
      const pipeline = await pipelineManager.createPipeline({
        name: 'Data Pipeline',
        stages: [
          {
            type: 'map',
            name: 'Double Values',
            mapSpec: (item) => item * 2
          },
          {
            type: 'filter',
            name: 'Filter > 5',
            condition: { field: 'value', operator: '>', value: 5 }
          }
        ]
      });
      
      const input = [1, 2, 3, 4, 5];
      const result = await pipelineManager.executePipeline(pipeline.id, input);
      
      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
    });
    
    test('should handle parallel stages', async () => {
      const pipeline = await pipelineManager.createPipeline({
        name: 'Parallel Pipeline',
        config: { parallel: true },
        stages: [
          { type: 'transform', name: 'Stage A' },
          { type: 'transform', name: 'Stage B' },
          { type: 'transform', name: 'Stage C' }
        ]
      });
      
      const result = await pipelineManager.executePipeline(pipeline.id, {});
      
      expect(result.success).toBe(true);
    });
    
    test('should support caching', async () => {
      const pipeline = await pipelineManager.createPipeline({
        name: 'Cache Pipeline',
        stages: [
          {
            type: 'cache',
            name: 'Cache Result',
            key: 'test-cache',
            ttl: 1000
          }
        ]
      });
      
      const input = { data: 'test' };
      
      // First execution
      await pipelineManager.executePipeline(pipeline.id, input);
      
      // Second execution should use cache
      const startTime = Date.now();
      await pipelineManager.executePipeline(pipeline.id, input);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(10); // Should be instant from cache
    });
    
    test('should validate data', async () => {
      const pipeline = await pipelineManager.createPipeline({
        name: 'Validation Pipeline',
        stages: [
          {
            type: 'filter',
            name: 'Validate',
            validate: 'required',
            condition: { fields: ['name', 'email'] }
          }
        ]
      });
      
      const validInput = { name: 'Test', email: 'test@example.com' };
      const result = await pipelineManager.executePipeline(pipeline.id, validInput);
      
      expect(result.success).toBe(true);
    });
  });
  
  describe('TaskAutomation', () => {
    let automation;
    
    beforeEach(() => {
      automation = new TaskAutomation();
    });
    
    afterEach(() => {
      automation.destroy();
    });
    
    test('should create automated task', async () => {
      const task = await automation.createTask({
        name: 'Automated Task',
        action: { type: 'function', function: () => 'result' },
        automation: {
          enabled: true,
          triggers: [{ type: 'event', event: 'test' }]
        }
      });
      
      expect(task).toBeDefined();
      expect(task.name).toBe('Automated Task');
      expect(task.automation.enabled).toBe(true);
    });
    
    test('should execute task', async () => {
      const task = await automation.createTask({
        name: 'Execute Test',
        action: {
          type: 'function',
          function: (params) => ({ result: params.value * 2 })
        }
      });
      
      const result = await automation.executeTask(task.id, { value: 5 });
      
      expect(result.success).toBe(true);
      expect(result.result.result).toBe(10);
    });
    
    test('should handle task conditions', async () => {
      const task = await automation.createTask({
        name: 'Conditional Task',
        action: { type: 'function', function: () => 'executed' },
        automation: {
          conditions: [
            { type: 'expression', expression: 'value > 5' }
          ]
        }
      });
      
      // Should skip
      const result1 = await automation.executeTask(task.id, { value: 3 });
      expect(result1.skipped).toBe(true);
      
      // Should execute
      const result2 = await automation.executeTask(task.id, { value: 10 });
      expect(result2.success).toBe(true);
    });
    
    test('should handle composite tasks', async () => {
      const task1 = await automation.createTask({
        name: 'Subtask 1',
        action: { type: 'function', function: () => ({ step: 1 }) }
      });
      
      const task2 = await automation.createTask({
        name: 'Subtask 2',
        action: { type: 'function', function: () => ({ step: 2 }) }
      });
      
      const composite = await automation.createTask({
        name: 'Composite Task',
        action: {
          type: 'composite',
          tasks: [task1.id, task2.id]
        }
      });
      
      const result = await automation.executeTask(composite.id);
      
      expect(result.success).toBe(true);
      expect(result.result.composite).toBe(true);
      expect(result.result.results).toHaveLength(2);
    });
    
    test('should queue tasks when at capacity', async () => {
      automation.config.maxConcurrentTasks = 1;
      
      const task = await automation.createTask({
        name: 'Queue Test',
        action: {
          type: 'function',
          function: () => new Promise(resolve => setTimeout(() => resolve('done'), 100))
        }
      });
      
      // Start first task
      const promise1 = automation.executeTask(task.id);
      
      // Second should be queued
      const result2 = await automation.executeTask(task.id);
      
      expect(result2.queued).toBe(true);
      expect(result2.position).toBe(1);
      
      await promise1; // Wait for first to complete
    });
  });
  
  describe('SpecialistIntegration', () => {
    let integration;
    
    beforeEach(() => {
      integration = new SpecialistIntegration();
    });
    
    afterEach(() => {
      integration.destroy();
    });
    
    test('should register specialist', async () => {
      const specialist = new UnifiedSpecialistBase({
        name: 'Test Specialist',
        type: 'test',
        skills: ['testing', 'validation']
      });
      
      await integration.registerSpecialist(specialist);
      
      expect(integration.specialists.has(specialist.id)).toBe(true);
      expect(integration.metrics.specialistsRegistered).toBe(1);
    });
    
    test('should assign task to specialist', async () => {
      const specialist = new UnifiedSpecialistBase({
        name: 'Worker',
        type: 'worker',
        skills: ['processing']
      });
      
      await integration.registerSpecialist(specialist);
      
      const task = {
        id: 'test-task',
        type: 'process',
        requiredSkills: ['processing']
      };
      
      const result = await integration.assignTask(task);
      
      expect(result).toBeDefined();
      expect(result.specialist).toBe(specialist.id);
      expect(integration.metrics.tasksCompleted).toBe(1);
    });
    
    test('should form team for collaborative task', async () => {
      const specialist1 = new UnifiedSpecialistBase({
        name: 'Frontend',
        skills: ['ui', 'react']
      });
      
      const specialist2 = new UnifiedSpecialistBase({
        name: 'Backend',
        skills: ['api', 'database']
      });
      
      await integration.registerSpecialist(specialist1);
      await integration.registerSpecialist(specialist2);
      
      const task = {
        id: 'complex-task',
        requiredSkills: ['ui', 'api'],
        requiresCollaboration: true
      };
      
      const result = await integration.assignTask(task);
      
      expect(result.collaborative).toBe(true);
      expect(integration.metrics.collaborations).toBe(1);
    });
    
    test('should track specialist performance', async () => {
      const specialist = new UnifiedSpecialistBase({
        name: 'Performer',
        skills: ['work']
      });
      
      await integration.registerSpecialist(specialist);
      
      const task = { id: 'perf-task', requiredSkills: ['work'] };
      await integration.assignTask(task);
      
      const performance = integration.performance.get(specialist.id);
      
      expect(performance.tasksCompleted).toBe(1);
      expect(performance.successRate).toBeGreaterThan(0);
      expect(performance.lastActive).toBeDefined();
    });
    
    test('should balance workload', async () => {
      const specialist1 = new UnifiedSpecialistBase({
        name: 'Worker 1',
        skills: ['work']
      });
      
      const specialist2 = new UnifiedSpecialistBase({
        name: 'Worker 2',
        skills: ['work']
      });
      
      await integration.registerSpecialist(specialist1);
      await integration.registerSpecialist(specialist2);
      
      // Assign multiple tasks
      const tasks = [
        { id: 'task-1', requiredSkills: ['work'] },
        { id: 'task-2', requiredSkills: ['work'] }
      ];
      
      for (const task of tasks) {
        await integration.assignTask(task);
      }
      
      // Check workload distribution
      const workload1 = integration.workload.get(specialist1.id);
      const workload2 = integration.workload.get(specialist2.id);
      
      expect(workload1.current + workload2.current).toBeLessThanOrEqual(2);
    });
  });
  
  describe('Integration Tests', () => {
    let workflowEngine;
    let pipelineManager;
    let taskAutomation;
    let specialistIntegration;
    
    beforeEach(() => {
      workflowEngine = new WorkflowEngine();
      pipelineManager = new PipelineManager();
      taskAutomation = new TaskAutomation();
      specialistIntegration = new SpecialistIntegration();
    });
    
    afterEach(() => {
      workflowEngine.destroy();
      pipelineManager.destroy();
      taskAutomation.destroy();
      specialistIntegration.destroy();
    });
    
    test('should integrate workflow with specialists', async () => {
      // Register specialist
      const specialist = new UnifiedSpecialistBase({
        name: 'Workflow Specialist',
        type: 'processor',
        skills: ['processing']
      });
      
      await specialistIntegration.registerSpecialist(specialist);
      
      // Create workflow with specialist step
      const workflow = await workflowEngine.createWorkflow({
        name: 'Specialist Workflow',
        steps: [
          {
            type: 'task',
            name: 'Process with Specialist',
            specialist: 'processor',
            task: { type: 'process', data: 'test' }
          }
        ]
      });
      
      const result = await workflowEngine.executeWorkflow(workflow.id);
      
      expect(result.success).toBe(true);
    });
    
    test('should integrate pipeline with automation', async () => {
      // Create pipeline
      const pipeline = await pipelineManager.createPipeline({
        name: 'Auto Pipeline',
        stages: [
          { type: 'transform', name: 'Process' }
        ]
      });
      
      // Create automated task
      const task = await taskAutomation.createTask({
        name: 'Pipeline Task',
        action: {
          type: 'pipeline',
          pipelineId: pipeline.id,
          input: { data: 'test' }
        }
      });
      
      const result = await taskAutomation.executeTask(task.id);
      
      expect(result.success).toBe(true);
    });
  });
});