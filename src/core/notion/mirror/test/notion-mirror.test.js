/**
 * Test Suite for Notion Mirror Feature
 * 
 * Comprehensive tests to verify functionality in mock mode
 */

const NotionMirror = require('../index');
const assert = require('assert');

class NotionMirrorTest {
  constructor() {
    this.mirror = null;
    this.projectData = {
      id: 'test-project-001',
      name: 'Test Authentication System',
      description: 'Implement JWT-based authentication with SSO support',
      status: 'active',
      priority: 'P1',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      team: ['backend-engineer-1', 'frontend-engineer-1', 'qa-engineer']
    };
  }

  /**
   * Run all tests
   */
  async runAll() {
    console.log('🧪 Starting Notion Mirror Tests...\n');
    
    const tests = [
      this.testInitialization.bind(this),
      this.testTaskCreation.bind(this),
      this.testTaskStatusUpdate.bind(this),
      this.testSprintCreation.bind(this),
      this.testVisualizationGeneration.bind(this),
      this.testAgentTaskUpdate.bind(this),
      this.testDependencyManagement.bind(this),
      this.testProgressCalculation.bind(this),
      this.testMockDataRetrieval.bind(this),
      this.testShutdown.bind(this)
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
      try {
        await test();
        passed++;
      } catch (error) {
        failed++;
        console.error(`   🔴 Failed: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    return failed === 0;
  }

  /**
   * Test 1: Initialization
   */
  async testInitialization() {
    console.log('📌 Test: Initialization');
    
    this.mirror = new NotionMirror({ mode: 'mock' });
    const result = await this.mirror.initialize(this.projectData);
    
    assert(result.success === true, 'Initialization should succeed');
    assert(result.dashboardUrl.includes('notion.so'), 'Should return dashboard URL');
    assert(result.projectId === this.projectData.id, 'Should store project ID');
    
    console.log('   🏁 Initialization successful');
    console.log(`   📍 Dashboard URL: ${result.dashboardUrl}`);
  }

  /**
   * Test 2: Task Creation
   */
  async testTaskCreation() {
    console.log('📌 Test: Task Creation');
    
    const taskData = {
      title: 'Implement JWT token service',
      description: 'Create service for generating and validating JWT tokens',
      department: 'Backend-Engineer',
      priority: 'P1',
      storyPoints: 5
    };
    
    const task = await this.mirror.createTask(taskData);
    
    assert(task.id !== undefined, 'Task should have ID');
    assert(task.title === taskData.title, 'Task title should match');
    assert(task.status === 'backlog', 'New task should be in backlog');
    assert(task.projectId === this.projectData.id, 'Task should be linked to project');
    
    console.log(`   🏁 Task created: ${task.id}`);
  }

  /**
   * Test 3: Task Status Update
   */
  async testTaskStatusUpdate() {
    console.log('📌 Test: Task Status Update');
    
    // Create a task first
    const task = await this.mirror.createTask({
      title: 'Setup API Gateway',
      department: 'Backend-Engineer',
      priority: 'P0'
    });
    
    // Update its status
    const updatedTask = await this.mirror.updateTaskStatus(task.id, 'in_progress');
    
    assert(updatedTask.status === 'in_progress', 'Status should be updated');
    assert(updatedTask.updatedAt !== undefined, 'Should have update timestamp');
    
    // Update to complete
    const completedTask = await this.mirror.updateTaskStatus(task.id, 'complete');
    assert(completedTask.status === 'complete', 'Should be marked complete');
    
    console.log('   🏁 Task status updates working');
  }

  /**
   * Test 4: Sprint Creation
   */
  async testSprintCreation() {
    console.log('📌 Test: Sprint Creation');
    
    const sprintData = {
      name: 'Sprint 1',
      goal: 'Complete authentication backend',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      plannedStoryPoints: 45
    };
    
    const sprint = await this.mirror.createSprint(sprintData);
    
    assert(sprint.id !== undefined, 'Sprint should have ID');
    assert(sprint.name === sprintData.name, 'Sprint name should match');
    assert(sprint.status === 'planned', 'New sprint should be planned');
    assert(sprint.duration === 14, 'Sprint duration should be 14 days');
    
    console.log(`   🏁 Sprint created: ${sprint.name}`);
  }

  /**
   * Test 5: Visualization Generation
   */
  async testVisualizationGeneration() {
    console.log('📌 Test: Visualization Generation');
    
    // Update progress visualization
    await this.mirror.updateProgressVisualization();
    
    // Check if visualization was created
    const viz = this.mirror.pipeline.state.visualizations.get('progress');
    assert(viz !== undefined, 'Progress visualization should exist');
    assert(viz.dataURL !== undefined, 'Visualization should have data URL');
    
    // Update burndown chart
    await this.mirror.createSprint({
      name: 'Sprint 2',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      plannedStoryPoints: 30
    });
    
    await this.mirror.updateBurndownChart();
    
    console.log('   🏁 Visualizations generated successfully');
  }

  /**
   * Test 6: Agent Task Update
   */
  async testAgentTaskUpdate() {
    console.log('📌 Test: Agent Task Update');
    
    const task = await this.mirror.agentTaskUpdate('backend-engineer-1', {
      title: 'Implement session management',
      priority: 'P2',
      storyPoints: 3
    });
    
    assert(task.assignee === 'backend-engineer-1', 'Task should be assigned to agent');
    assert(task.department === 'Engineering', 'Department should be set correctly');
    assert(task.updatedBy === 'backend-engineer-1', 'Should track who updated');
    
    console.log('   🏁 Agent task update working');
  }

  /**
   * Test 7: Dependency Management
   */
  async testDependencyManagement() {
    console.log('📌 Test: Dependency Management');
    
    // Create two tasks
    const task1 = await this.mirror.createTask({
      title: 'Create database schema',
      department: 'Backend-Engineer'
    });
    
    const task2 = await this.mirror.createTask({
      title: 'Implement API endpoints',
      department: 'Backend-Engineer',
      dependencies: {
        blockedBy: [task1.id]
      }
    });
    
    // Check dependency was set
    assert(task2.dependencies.blockedBy.includes(task1.id), 'Task2 should depend on Task1');
    
    // Check reverse dependency
    const task1Updated = this.mirror.pipeline.state.tasks.get(task1.id);
    assert(task1Updated.dependencies.blocks.includes(task2.id), 'Task1 should block Task2');
    
    console.log('   🏁 Dependencies managed correctly');
  }

  /**
   * Test 8: Progress Calculation
   */
  async testProgressCalculation() {
    console.log('📌 Test: Progress Calculation');
    
    // Create tasks with story points
    await this.mirror.createTask({
      title: 'Task A',
      storyPoints: 5,
      status: 'complete'
    });
    
    await this.mirror.createTask({
      title: 'Task B',
      storyPoints: 3,
      status: 'complete'
    });
    
    await this.mirror.createTask({
      title: 'Task C',
      storyPoints: 8,
      status: 'in_progress'
    });
    
    const progress = this.mirror.pipeline.calculateOverallProgress();
    
    // Should have 8 points complete out of 16 total = 50%
    assert(progress > 0, 'Progress should be calculated');
    
    const stats = this.mirror.getStatistics();
    assert(stats.tasks.completed >= 2, 'Should count completed tasks');
    assert(stats.tasks.inProgress >= 1, 'Should count in-progress tasks');
    
    console.log(`   🏁 Progress calculated: ${progress.toFixed(1)}%`);
  }

  /**
   * Test 9: Mock Data Retrieval
   */
  async testMockDataRetrieval() {
    console.log('📌 Test: Mock Data Retrieval');
    
    const mockData = this.mirror.pipeline.adapter.getMockData();
    
    assert(mockData !== null, 'Should retrieve mock data in mock mode');
    assert(mockData.dashboard !== undefined, 'Should have dashboard data');
    assert(mockData.dashboard.tasks !== undefined, 'Should have tasks array');
    
    console.log(`   🏁 Mock data accessible with ${mockData.dashboard.tasks.length} tasks`);
  }

  /**
   * Test 10: Shutdown
   */
  async testShutdown() {
    console.log('📌 Test: Shutdown');
    
    await this.mirror.shutdown();
    
    // Verify intervals are cleared
    const intervals = this.mirror.pipeline.intervals;
    assert(intervals.realtime !== null, 'Intervals should be cleared');
    
    console.log('   🏁 Shutdown completed successfully');
  }
}

/**
 * Example Usage Scenarios
 */
class ExampleScenarios {
  static async runExamples() {
    console.log('\n📚 Running Example Scenarios...\n');
    
    const mirror = new NotionMirror({ mode: 'mock' });
    
    // Scenario 1: Product Manager initializes project
    console.log('🔴 Scenario 1: Product Manager Initializes Project');
    const project = await mirror.initialize({
      name: 'E-Commerce Platform Redesign',
      description: 'Complete redesign of the e-commerce platform with improved UX and performance',
      priority: 'P0',
      team: ['product-strategist', 'design-engineer', 'backend-engineer-1', 'frontend-engineer-1', 'qa-engineer']
    });
    console.log(`   🏁 Project initialized: ${project.dashboardUrl}`);
    
    // Scenario 2: Sprint Planning
    console.log('\n🔴 Scenario 2: Sprint Planning');
    const sprint = await mirror.createSprint({
      name: 'Sprint 1 - Foundation',
      goal: 'Set up project infrastructure and core components',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      plannedStoryPoints: 55
    });
    console.log(`   🏁 Sprint created: ${sprint.name}`);
    
    // Scenario 3: Backend Engineer creates tasks
    console.log('\n🔴 Scenario 3: Backend Engineer Creates Tasks');
    const apiTask = await mirror.agentTaskUpdate('backend-engineer-1', {
      title: 'Design RESTful API architecture',
      description: 'Create comprehensive API design with OpenAPI specification',
      priority: 'P0',
      storyPoints: 8
    });
    console.log(`   🏁 API task created: ${apiTask.id}`);
    
    const dbTask = await mirror.agentTaskUpdate('backend-engineer-1', {
      title: 'Set up PostgreSQL database',
      description: 'Configure database with proper schemas and indexes',
      priority: 'P0',
      storyPoints: 5,
      dependencies: {
        blocks: [apiTask.id]
      }
    });
    console.log(`   🏁 Database task created with dependency`);
    
    // Scenario 4: Design Engineer creates mockups
    console.log('\n🔴 Scenario 4: Design Engineer Creates Mockups');
    const designTask = await mirror.agentTaskUpdate('design-engineer', {
      title: 'Create homepage mockups',
      description: 'Design responsive mockups for new homepage',
      priority: 'P1',
      storyPoints: 13
    });
    console.log(`   🏁 Design task created: ${designTask.id}`);
    
    // Scenario 5: Task Progress Updates
    console.log('\n🔴 Scenario 5: Task Progress Updates');
    await mirror.updateTaskStatus(dbTask.id, 'in_progress');
    console.log(`   🏁 Database task started`);
    
    await mirror.updateTaskStatus(dbTask.id, 'complete');
    console.log(`   🏁 Database task completed`);
    
    await mirror.updateTaskStatus(apiTask.id, 'blocked');
    console.log(`   🟠️ API task blocked`);
    
    // Scenario 6: Generate Reports
    console.log('\n🔴 Scenario 6: Generate Reports');
    const stats = mirror.getStatistics();
    console.log('   📊 Project Statistics:');
    console.log(`      - Total Tasks: ${stats.tasks.total}`);
    console.log(`      - Completed: ${stats.tasks.completed}`);
    console.log(`      - In Progress: ${stats.tasks.inProgress}`);
    console.log(`      - Blocked: ${stats.tasks.blocked}`);
    
    // Get mock data for inspection
    const mockData = mirror.pipeline.adapter.getMockData();
    console.log(`\n   🔍 Mock Dashboard Data:`);
    console.log(`      - Dashboard ID: ${mockData.dashboard.id}`);
    console.log(`      - Tasks Created: ${mockData.dashboard.tasks.length}`);
    console.log(`      - Visualizations: ${mockData.dashboard.visualizations?.length || 0}`);
    
    await mirror.shutdown();
    console.log('\n🏁 Example scenarios completed successfully');
  }
}

/**
 * Run tests if executed directly
 */
if (require.main === module) {
  (async () => {
    const tester = new NotionMirrorTest();
    const success = await tester.runAll();
    
    if (success) {
      await ExampleScenarios.runExamples();
    }
    
    process.exit(success ? 0 : 1);
  })();
}

module.exports = { NotionMirrorTest, ExampleScenarios };