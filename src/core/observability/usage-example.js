/**
 * BUMBA Agent Observability System - Usage Examples
 * 
 * This file demonstrates how to integrate and use the observability system
 * in the BUMBA framework.
 */

const { 
  initializeObservability, 
  quickSetup, 
  utils, 
  decorators, 
  config 
} = require('./index');
const { logger } = require('../logging/bumba-logger');

/**
 * Example 1: Basic Setup and Initialization
 */
async function example1_BasicSetup() {
  console.log('🟢 Example 1: Basic Setup');
  
  try {
    // Initialize observability with default settings
    const system = await initializeObservability();
    
    console.log('🏁 Observability system initialized');
    console.log('🟢 Dashboard data:', system.getDashboard());
    
    return system;
  } catch (error) {
    console.error('🔴 Setup failed:', error.message);
  }
}

/**
 * Example 2: Quick Setup with Dashboard
 */
async function example2_QuickSetupWithDashboard() {
  console.log('🟢 Example 2: Quick Setup with Dashboard');
  
  try {
    // Quick setup with dashboard on port 3001
    const system = await quickSetup({
      ...config.development,
      dashboardPort: 3001
    });
    
    console.log('🏁 System ready with dashboard at http://localhost:3001');
    
    return system;
  } catch (error) {
    console.error('🔴 Quick setup failed:', error.message);
  }
}

/**
 * Example 3: Manual Instrumentation
 */
async function example3_ManualInstrumentation() {
  console.log('🟢 Example 3: Manual Instrumentation');
  
  const system = await initializeObservability();
  
  // Create an instrumented function
  const processUserData = utils.instrument('processUserData', async (userData) => {
    console.log('Processing user data:', userData.id);
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (userData.id === 'error-user') {
      throw new Error('Simulated processing error');
    }
    
    return {
      processed: true,
      userId: userData.id,
      timestamp: Date.now()
    };
  }, { agentId: 'data-processor' });
  
  // Use the instrumented function
  try {
    console.log('Processing normal user...');
    const result1 = await processUserData({ id: 'user-123', name: 'John' });
    console.log('🏁 Result:', result1);
    
    console.log('Processing error user...');
    const result2 = await processUserData({ id: 'error-user', name: 'Error' });
    console.log('🏁 Result:', result2);
  } catch (error) {
    console.log('🔴 Expected error caught:', error.message);
  }
  
  // Show dashboard after processing
  console.log('🟢 Dashboard after processing:');
  console.log(system.getDashboard());
}

/**
 * Example 4: Class Instrumentation with Decorators
 */
async function example4_ClassInstrumentation() {
  console.log('🟢 Example 4: Class Instrumentation');
  
  await initializeObservability();
  
  // Example agent class with observability decorators
  class DataAnalysisAgent {
    constructor(id, name) {
      this.id = id;
      this.name = name;
      this.confidence = 0.8;
    }
    
    // This method will be automatically traced
    async analyzeData(dataset) {
      console.log(`${this.name} analyzing dataset:`, dataset.name);
      
      // Simulate analysis time
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const insights = {
        patterns: Math.floor(Math.random() * 10) + 1,
        anomalies: Math.floor(Math.random() * 3),
        confidence: this.confidence,
        quality_score: Math.random() * 0.3 + 0.7 // 0.7-1.0
      };
      
      return insights;
    }
    
    // This method will track decisions
    async makeRecommendation(analysisResult) {
      console.log(`${this.name} making recommendation based on analysis`);
      
      const recommendation = {
        action: analysisResult.anomalies > 2 ? 'investigate' : 'proceed',
        priority: analysisResult.patterns > 5 ? 'high' : 'normal',
        confidence: this.confidence,
        quality_score: analysisResult.quality_score
      };
      
      return recommendation;
    }
  }
  
  // Create instrumented version of the class
  const InstrumentedAgent = utils.instrumentClass(DataAnalysisAgent, {
    agentId: 'data-analysis-agent'
  });
  
  // Use the instrumented agent
  const agent = new InstrumentedAgent('agent-001', 'Maya Chen');
  
  try {
    const analysisResult = await agent.analyzeData({ 
      name: 'user-behavior-2024', 
      size: 10000 
    });
    console.log('🏁 Analysis result:', analysisResult);
    
    const recommendation = await agent.makeRecommendation(analysisResult);
    console.log('🏁 Recommendation:', recommendation);
    
  } catch (error) {
    console.error('🔴 Analysis failed:', error.message);
  }
}

/**
 * Example 5: Manual Tracing with Complex Operations
 */
async function example5_ManualTracing() {
  console.log('🟢 Example 5: Manual Tracing');
  
  const system = await initializeObservability();
  const obs = system.observability;
  
  // Start a complex multi-step operation trace
  const trace = obs.startTrace('workflow-engine', 'user-onboarding', {
    user_id: 'user-456',
    flow_type: 'premium-signup'
  });
  
  console.log('Started trace:', trace.traceId);
  
  try {
    // Step 1: Validate user data
    const validationSpan = obs.startSpan(trace.traceId, 'validate-user-data', 'validator-agent');
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate work
    obs.finishSpan(validationSpan, 'success', { fields_validated: 5 });
    
    // Step 2: Check eligibility
    const eligibilitySpan = obs.startSpan(trace.traceId, 'check-eligibility', 'eligibility-agent');
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
    obs.finishSpan(eligibilitySpan, 'success', { eligible: true, tier: 'premium' });
    
    // Step 3: Create account
    const accountSpan = obs.startSpan(trace.traceId, 'create-account', 'account-agent');
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate work
    obs.finishSpan(accountSpan, 'success', { account_id: 'acc-789' });
    
    // Step 4: Send welcome email
    const emailSpan = obs.startSpan(trace.traceId, 'send-welcome-email', 'notification-agent');
    await new Promise(resolve => setTimeout(resolve, 75)); // Simulate work
    obs.finishSpan(emailSpan, 'success', { email_sent: true, template: 'premium-welcome' });
    
    // Finish the trace
    obs.finishTrace(trace.traceId, 'success', { 
      user_id: 'user-456',
      account_id: 'acc-789',
      onboarding_complete: true
    });
    
    console.log('🏁 User onboarding completed successfully');
    
  } catch (error) {
    obs.finishTrace(trace.traceId, 'error', { error: error.message });
    console.error('🔴 User onboarding failed:', error.message);
  }
  
  // Show trace visualization
  const visualization = obs.getTraceVisualization(trace.traceId);
  console.log('🟢 Trace visualization:', {
    traceId: visualization?.trace?.traceId,
    totalSpans: visualization?.spans?.length || 0,
    duration: visualization?.trace?.duration || 0
  });
}

/**
 * Example 6: Agent Collaboration Tracking
 */
async function example6_CollaborationTracking() {
  console.log('🟢 Example 6: Agent Collaboration Tracking');
  
  const system = await initializeObservability();
  const obs = system.observability;
  
  // Simulate a collaboration between agents
  const trace = obs.startTrace('maya-chen', 'strategic-planning', {
    project: 'new-feature-rollout',
    priority: 'high'
  });
  
  // Maya Chen starts strategic analysis
  const strategicSpan = obs.startSpan(trace.traceId, 'strategic-analysis', 'maya-chen');
  
  // Update Maya's profile
  obs.updateProfile('maya-chen', 'strategic_thinking', {
    project_type: 'feature-rollout',
    complexity: 0.8,
    user_focus: true
  });
  
  // Track Maya's decision
  const decisionId = obs.trackDecision('maya-chen', {
    type: 'feature-priority',
    decision: 'mobile-first-approach'
  }, {
    factors: ['user-research', 'market-trends', 'technical-feasibility'],
    alternatives: ['desktop-first', 'web-only', 'mobile-first'],
    confidence: 0.85,
    ethical_considerations: ['accessibility', 'privacy', 'inclusive-design']
  });
  
  await new Promise(resolve => setTimeout(resolve, 100));
  obs.finishSpan(strategicSpan, 'success', { approach: 'mobile-first' });
  
  // Hand off to Alex Rivera for design
  const designSpan = obs.startSpan(trace.traceId, 'design-planning', 'alex-rivera');
  
  obs.updateProfile('alex-rivera', 'design_collaboration', {
    handoff_from: 'maya-chen',
    design_approach: 'mobile-first',
    accessibility_focus: true
  });
  
  await new Promise(resolve => setTimeout(resolve, 120));
  obs.finishSpan(designSpan, 'success', { 
    design_system: 'updated',
    accessibility_score: 0.95 
  });
  
  // Hand off to Jordan Kim for technical implementation
  const techSpan = obs.startSpan(trace.traceId, 'technical-planning', 'jordan-kim');
  
  obs.updateProfile('jordan-kim', 'technical_implementation', {
    handoff_from: 'alex-rivera',
    security_review: true,
    performance_optimization: true
  });
  
  await new Promise(resolve => setTimeout(resolve, 150));
  obs.finishSpan(techSpan, 'success', { 
    architecture: 'microservices',
    security_score: 0.92,
    performance_target: 'sub-200ms'
  });
  
  // Update decision outcome
  obs.updateDecisionOutcome(decisionId, {
    implemented: true,
    quality_score: 0.9,
    user_impact: 'high',
    team_alignment: 'excellent'
  }, [
    'Mobile-first approach improved user engagement',
    'Cross-functional collaboration enhanced quality',
    'Security-by-design prevented vulnerabilities'
  ]);
  
  obs.finishTrace(trace.traceId, 'success', {
    collaboration_quality: 0.92,
    deliverable: 'feature-rollout-plan',
    team_satisfaction: 0.88
  });
  
  console.log('🏁 Strategic planning collaboration completed');
}

/**
 * Example 7: Performance Analysis and Bottleneck Detection
 */
async function example7_PerformanceAnalysis() {
  console.log('🟢 Example 7: Performance Analysis');
  
  const system = await initializeObservability();
  
  // Generate some load to create metrics
  const operations = ['data-processing', 'user-validation', 'report-generation'];
  const agents = ['maya-chen', 'alex-rivera', 'jordan-kim'];
  
  console.log('Generating sample load...');
  
  for (let i = 0; i < 50; i++) {
    const agent = agents[i % agents.length];
    const operation = operations[i % operations.length];
    
    // Simulate varying performance
    const duration = Math.random() * 1000 + 100; // 100-1100ms
    const hasError = Math.random() < 0.05; // 5% error rate
    
    if (hasError) {
      system.recordMetrics(agent, operation, {
        duration,
        error: new Error('Simulated error')
      });
    } else {
      system.recordMetrics(agent, operation, {
        duration,
        success: true
      });
    }
    
    // Update profiles
    system.updateProfile(agent, operation, {
      duration,
      success: !hasError,
      iteration: i
    });
  }
  
  // Analyze performance
  console.log('Analyzing performance...');
  const analysis = system.analyzePerformance();
  
  console.log('🟢 Performance Analysis Results:');
  console.log(`- Bottlenecks detected: ${analysis.bottlenecks.length}`);
  console.log(`- Anomalies detected: ${analysis.anomalies.length}`);
  
  if (analysis.bottlenecks.length > 0) {
    console.log('🔴 Bottlenecks:');
    analysis.bottlenecks.forEach(bottleneck => {
      console.log(`  - ${bottleneck.type}: ${bottleneck.agentId}.${bottleneck.operation} (${bottleneck.severity})`);
    });
  }
  
  if (analysis.anomalies.length > 0) {
    console.log('🟡 Anomalies:');
    analysis.anomalies.forEach(anomaly => {
      console.log(`  - ${anomaly.type}: ${anomaly.message}`);
    });
  }
  
  // Show current dashboard
  console.log('\n🟢 Current Dashboard:');
  console.log(system.getDashboard());
}

/**
 * Example 8: Export and Data Analysis
 */
async function example8_DataExport() {
  console.log('🟢 Example 8: Data Export');
  
  const system = await initializeObservability();
  
  // Generate some activity first
  await example3_ManualInstrumentation();
  await example5_ManualTracing();
  
  // Export all data
  console.log('Exporting observability data...');
  const exportedData = await system.exportData({
    format: 'json',
    timeRange: {
      start: Date.now() - 60 * 60 * 1000, // Last hour
      end: Date.now()
    }
  });
  
  console.log('🟢 Exported data summary:');
  console.log(`- Traces: ${exportedData.traces.length}`);
  console.log(`- Spans: ${exportedData.spans.length}`);
  console.log(`- Profiles: ${Object.keys(exportedData.profiles).length}`);
  console.log(`- Decisions: ${exportedData.decisions.length}`);
  console.log(`- Anomalies: ${exportedData.anomalies.length}`);
  console.log(`- Bottlenecks: ${exportedData.bottlenecks.length}`);
  
  // Health check
  const health = system.healthCheck();
  console.log('\n🟢 System Health:');
  console.log(`- Observability initialized: ${health.observability_initialized}`);
  console.log(`- Dashboard available: ${health.dashboard_available}`);
  console.log(`- Hooks registered: ${health.hooks_registered}`);
  console.log(`- System health: ${(health.system_health * 100).toFixed(1)}%`);
  
  return exportedData;
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('🟢 Starting BUMBA Observability System Examples\n');
  
  try {
    await example1_BasicSetup();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await example2_QuickSetupWithDashboard();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await example3_ManualInstrumentation();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await example4_ClassInstrumentation();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await example5_ManualTracing();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await example6_CollaborationTracking();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await example7_PerformanceAnalysis();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await example8_DataExport();
    console.log('\n' + '='.repeat(60) + '\n');
    
    console.log('🏁 All examples completed successfully!');
    
  } catch (error) {
    console.error('🔴 Example execution failed:', error);
  }
}

// Export examples for individual use
module.exports = {
  example1_BasicSetup,
  example2_QuickSetupWithDashboard,
  example3_ManualInstrumentation,
  example4_ClassInstrumentation,
  example5_ManualTracing,
  example6_CollaborationTracking,
  example7_PerformanceAnalysis,
  example8_DataExport,
  runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}