/**
 * BUMBA Enhanced Hooks Example
 * Demonstrates agent communication and hook chaining
 */

const { UnifiedHookSystem: EnhancedHookSystem, getHookSystem } = require('../core/unified-hook-system');
const HookContext = class HookContext { constructor(data) { Object.assign(this, data); } };
const { logger } = require('../core/logging/bumba-logger');

/**
 * Example: Multi-Agent Feature Development Workflow
 *
 * This example shows how three agents collaborate on a feature:
 * 1. Product-Strategist: Defines requirements
 * 2. Design-Engineer: Creates UI/UX
 * 3. Backend-Engineer: Implements functionality
 */

async function setupFeatureDevelopmentWorkflow() {
  const hookSystem = EnhancedHookSystem.getInstance();

  // 1. Register agent-specific hooks

  // Product Strategist hooks
  hookSystem.register('agent:product-strategist:analyze', async (context) => {
    logger.info('🟢 Product Strategist analyzing requirements...');

    const { feature, userStories } = context.data;

    // Analyze and enhance requirements
    const analysis = {
      feasibility: 'high',
      estimatedImpact: 'significant',
      requiredDepartments: ['design', 'backend'],
      priority: 'P1',
      requirements: [
        'User authentication required',
        'Real-time updates needed',
        'Mobile-responsive design'
      ]
    };

    context.set('requirementAnalysis', analysis);
    context.set('approved', true);

    return { success: true, analysis };
  }, {
    priority: 100,
    description: 'Product requirement analysis'
  });

  // Design Engineer hooks
  hookSystem.register('agent:design-engineer:create', async (context) => {
    logger.info('🟢 Design Engineer creating UI/UX...');

    const { feature, requirementAnalysis } = context.data;

    // Simulate design creation
    const design = {
      mockupUrl: '/designs/feature-mockup.fig',
      components: [
        'HeaderComponent',
        'FeatureMainView',
        'FeatureDetailModal'
      ],
      designSystem: 'BUMBA-DS-2.0',
      accessibility: {
        wcagLevel: 'AA',
        keyboardNavigable: true,
        screenReaderOptimized: true
      }
    };

    context.set('design', design);
    context.set('designApproved', true);

    // Notify backend engineer
    await hookSystem.notifyAgent('backend-engineer', 'design-ready', {
      feature,
      design
    });

    return { success: true, design };
  }, {
    priority: 90,
    description: 'UI/UX design creation',
    conditions: [
      data => data.approved === true,
      data => data.requirementAnalysis?.requiredDepartments?.includes('design')
    ]
  });

  // Backend Engineer hooks
  hookSystem.register('agent:backend-engineer:implement', async (context) => {
    logger.info('🟢 Backend Engineer implementing functionality...');

    const { feature, design, requirementAnalysis } = context.data;

    // Simulate backend implementation
    const implementation = {
      apis: [
        { endpoint: '/api/feature', method: 'GET' },
        { endpoint: '/api/feature', method: 'POST' },
        { endpoint: '/api/feature/:id', method: 'PUT' }
      ],
      database: {
        tables: ['feature_data', 'feature_config'],
        indexes: ['feature_data_user_idx']
      },
      services: ['FeatureService', 'FeatureValidator'],
      tests: {
        unit: 25,
        integration: 10,
        coverage: '92%'
      }
    };

    context.set('implementation', implementation);
    context.set('backendComplete', true);

    return { success: true, implementation };
  }, {
    priority: 80,
    description: 'Backend implementation',
    conditions: [
      data => data.designApproved === true
    ]
  });

  // 2. Register coordination hooks

  hookSystem.register('department:coordinate', async (context) => {
    logger.info('🟢 Coordinating departments...');

    const { departments, task } = context.data;

    // Create real-time collaboration session
    const session = {
      id: `collab-${Date.now()}`,
      departments,
      task,
      sharedContext: {},
      participants: []
    };

    // Add all department members
    for (const dept of departments) {
      session.participants.push(`${dept}-lead`);
    }

    context.set('collaborationSession', session);

    return { success: true, session };
  });

  // 3. Register quality and consciousness hooks

  hookSystem.register('quality-check', async (context) => {
    logger.info('🏁 Running quality checks...');

    const { design, implementation } = context.data;

    const qualityResults = {
      codeQuality: implementation?.tests?.coverage > '90%' ? 'excellent' : 'good',
      designQuality: design?.accessibility?.wcagLevel === 'AA' ? 'excellent' : 'good',
      overallScore: 0.95,
      issues: [],
      recommendations: [
        'Consider adding E2E tests',
        'Document API endpoints'
      ]
    };

    context.set('qualityResults', qualityResults);

    return { success: true, qualityResults };
  });

  hookSystem.register('consciousness-check', async (context) => {
    logger.info('🟢 Checking consciousness alignment...');

    const { feature } = context.data;

    const consciousnessScore = {
      ethicalAlignment: 1.0,
      communityBenefit: 0.9,
      sustainability: 0.95,
      accessibility: 1.0,
      overall: 0.96
    };

    context.set('consciousnessScore', consciousnessScore);

    return { success: true, consciousnessScore };
  });

  // 4. Create the feature development chain

  hookSystem.createChain('feature-development', [
    // Start with product analysis
    {
      type: 'agent:product-strategist:analyze'
    },

    // Coordinate departments
    {
      type: 'department:coordinate',
      transform: ctx => {
        ctx.set('departments', ctx.data.requirementAnalysis.requiredDepartments);
        return ctx;
      }
    },

    // Design phase
    {
      type: 'agent:design-engineer:create'
    },

    // Branch based on design complexity
    {
      type: 'chain:branch',
      transform: ctx => {
        const components = ctx.data.design?.components || [];
        ctx.set('condition', () => components.length > 5);
        ctx.set('trueBranch', 'complex-implementation');
        ctx.set('falseBranch', 'simple-implementation');
        return ctx;
      }
    },

    // Implementation phase
    {
      type: 'agent:backend-engineer:implement'
    },

    // Quality and consciousness checks in parallel
    {
      type: 'quality-check'
    },
    {
      type: 'consciousness-check'
    },

    // Final handoff back to product strategist
    {
      type: 'agent:handoff',
      transform: ctx => {
        ctx.set('fromAgent', 'Backend-Engineer');
        ctx.set('toAgent', 'Product-Strategist');
        ctx.set('task', 'review-and-approve');
        return ctx;
      }
    },

    // Completion
    {
      type: 'completion'
    }
  ]);

  // 5. Register monitoring hooks

  hookSystem.on('agent:handoff', ({ fromAgent, toAgent, task }) => {
    logger.info(`🟢 Handoff: ${fromAgent} → ${toAgent} (${task})`);
  });

  hookSystem.on('chain:link', ({ from, to }) => {
    logger.info(`🟢 Chain transition: ${from} → ${to}`);
  });

  return hookSystem;
}

/**
 * Execute the feature development workflow
 */
async function executeFeatureDevelopment() {
  const hookSystem = await setupFeatureDevelopmentWorkflow();

  // Create initial context
  const context = new HookContext({
    feature: 'Real-time Collaboration',
    userStories: [
      'As a user, I want to collaborate in real-time',
      'As a user, I want to see who is currently editing',
      'As a user, I want automatic conflict resolution'
    ],
    requestedBy: 'CEO',
    deadline: '2024-02-01'
  });

  logger.info('🟢 Starting feature development workflow...\n');

  try {
    // Execute the chain
    const result = await hookSystem.executeChain('feature-development', context);

    logger.info('\n🟢 Workflow Results:');
    logger.info('Success:', result.success);
    logger.info('Final Context:', JSON.stringify(result.context.data, null, 2));

    // Get metrics
    const stats = hookSystem.getStats();
    logger.info('\n🟢 Hook Metrics:');
    Object.entries(stats.metrics).forEach(([hook, metrics]) => {
      logger.info(`${hook}:`);
      logger.info(`  - Executions: ${metrics.executions}`);
      logger.info(`  - Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);
      logger.info(`  - Avg Duration: ${metrics.avgDuration.toFixed(0)}ms`);
    });

  } catch (error) {
    logger.error('Workflow failed:', error);
  }
}

/**
 * Example: Dynamic hook registration based on environment
 */
async function setupEnvironmentHooks() {
  const hookSystem = EnhancedHookSystem.getInstance();

  if (process.env.NODE_ENV === 'production') {
    // Production-only hooks
    hookSystem.register('production-safety', async (context) => {
      // Extra safety checks for production
      const safety = await validateProductionSafety(context.data);

      if (!safety.safe) {
        throw new Error(`Production safety check failed: ${safety.reason}`);
      }

      return { success: true };
    }, {
      priority: 200,
      description: 'Production safety validation'
    });
  }

  if (process.env.ENABLE_METRICS === 'true') {
    // Metrics collection hooks
    hookSystem.register('metrics-collection', async (context) => {
      await collectMetrics(context.data);
      return { success: true };
    }, {
      priority: 10,
      parallel: true,
      cache: false
    });
  }
}

/**
 * Example: Agent communication patterns
 */
async function demonstrateAgentCommunication() {
  const hookSystem = EnhancedHookSystem.getInstance();

  // 1. Direct agent messaging
  await hookSystem.notifyAgent('Design-Engineer', 'task-available', {
    task: 'Create login screen mockup',
    priority: 'high',
    deadline: '2024-01-15'
  });

  // 2. Broadcast to department
  await hookSystem.broadcastToAgents('sprint-planning', {
    sprint: 'Sprint 42',
    startDate: '2024-01-15',
    goals: ['Complete authentication', 'Launch beta']
  }, { department: 'engineering' });

  // 3. Request-response pattern
  hookSystem.register('agent:backend-engineer:estimate', async (context) => {
    const { task } = context.data;

    // Estimate task
    const estimate = {
      hours: calculateEstimate(task),
      confidence: 0.8,
      dependencies: ['Database setup', 'API design']
    };

    return { success: true, estimate };
  });

  // Make request
  const response = await hookSystem.execute('agent:backend-engineer:estimate', {
    task: 'Implement user authentication'
  });

  logger.info('Task estimate:', response.results[0].estimate);
}

// Helper functions (mock implementations)
async function validateProductionSafety(data) {
  return { safe: true };
}

async function collectMetrics(data) {
  // Collect and send metrics
}

function calculateEstimate(task) {
  // Simple estimation logic
  return task.includes('authentication') ? 16 : 8;
}

// Main execution
if (require.main === module) {
  (async () => {
    try {
      // Run the feature development example
      await executeFeatureDevelopment();

      // Demonstrate other patterns
      await demonstrateAgentCommunication();

    } catch (error) {
      logger.error('Example failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  setupFeatureDevelopmentWorkflow,
  executeFeatureDevelopment,
  setupEnvironmentHooks,
  demonstrateAgentCommunication
};
