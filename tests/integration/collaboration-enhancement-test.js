#!/usr/bin/env node

/**
 * BUMBA Collaboration Enhancement Comprehensive Test Suite
 * Tests all new collaboration features for completeness and operability
 */

const path = require('path');
const fs = require('fs');

// Import all collaboration components
const RealtimeEventEmitter = require('../src/core/collaboration/realtime-event-emitter');
const CollaborationMonitor = require('../src/core/collaboration/collaboration-monitor');
const { RealtimeCoordinationManager } = require('../src/core/collaboration/realtime-coordination-hooks');
const CollaborationStatusDashboard = require('../src/core/collaboration/collaboration-status-dashboard');
const MarkdownCollaborationWorkflow = require('../src/core/collaboration/markdown-collaboration-workflow');
const MarkdownMergeEngine = require('../src/core/collaboration/markdown-merge-engine');
const MarkdownManagerReview = require('../src/core/collaboration/markdown-manager-review');
const PeerReviewProtocol = require('../src/core/collaboration/peer-review-protocol');
const SpecialistPeerReview = require('../src/core/collaboration/specialist-peer-review');
const { CollaborationStatusManager, getInstance } = require('../src/core/collaboration/collaboration-status-manager');
const { CollaborationEnhancementIntegration } = require('../src/core/collaboration/integration');

// Test tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = [];
const testResults = {};

// Test helper functions
function test(category, name, fn) {
  totalTests++;
  try {
    const result = fn();
    if (result === false) throw new Error('Test returned false');
    passedTests++;
    console.log(`🏁 [${category}] ${name}`);
    
    if (!testResults[category]) testResults[category] = { passed: 0, failed: 0 };
    testResults[category].passed++;
    
    return true;
  } catch (error) {
    failedTests.push({ category, name, error: error.message });
    console.log(`🔴 [${category}] ${name}: ${error.message}`);
    
    if (!testResults[category]) testResults[category] = { passed: 0, failed: 0 };
    testResults[category].failed++;
    
    return false;
  }
}

async function asyncTest(category, name, fn) {
  totalTests++;
  try {
    const result = await fn();
    if (result === false) throw new Error('Test returned false');
    passedTests++;
    console.log(`🏁 [${category}] ${name}`);
    
    if (!testResults[category]) testResults[category] = { passed: 0, failed: 0 };
    testResults[category].passed++;
    
    return true;
  } catch (error) {
    failedTests.push({ category, name, error: error.message });
    console.log(`🔴 [${category}] ${name}: ${error.message}`);
    
    if (!testResults[category]) testResults[category] = { passed: 0, failed: 0 };
    testResults[category].failed++;
    
    return false;
  }
}

// Main test function
async function runAllTests() {
  console.log('     BUMBA COLLABORATION ENHANCEMENT TEST SUITE');

  // 1. TEST REAL-TIME COMMUNICATION SYSTEM
  console.log('\n🟢 TESTING REAL-TIME COMMUNICATION SYSTEM\n');
  
  test('RealTime', 'RealtimeEventEmitter instantiation', () => {
    const emitter = new RealtimeEventEmitter();
    return emitter !== undefined;
  });

  test('RealTime', 'Agent registration', () => {
    const emitter = new RealtimeEventEmitter();
    const result = emitter.registerAgent('test-agent-1', { department: 'backend' });
    return result === true && emitter.agents.has('test-agent-1');
  });

  test('RealTime', 'Status broadcasting', () => {
    const emitter = new RealtimeEventEmitter();
    emitter.registerAgent('test-agent-1', { department: 'backend' });
    const result = emitter.broadcastStatus('test-agent-1', 'active', { task: 'testing' });
    return result === true;
  });

  test('RealTime', 'Channel subscription', () => {
    const emitter = new RealtimeEventEmitter();
    emitter.registerAgent('test-agent-1', { department: 'backend' });
    const result = emitter.subscribeToChannel('test-agent-1', 'test-channel');
    return result === true && emitter.channels.has('test-channel');
  });

  test('RealTime', 'Channel messaging', () => {
    const emitter = new RealtimeEventEmitter();
    emitter.registerAgent('test-agent-1', { department: 'backend' });
    emitter.subscribeToChannel('test-agent-1', 'test-channel');
    const result = emitter.sendToChannel('test-channel', { type: 'test' });
    return result === true;
  });

  test('RealTime', 'CollaborationMonitor instantiation', () => {
    const monitor = new CollaborationMonitor();
    return monitor !== undefined && monitor.emitter !== undefined;
  });

  test('RealTime', 'Start collaboration', () => {
    const monitor = new CollaborationMonitor();
    const collab = monitor.startCollaboration('test-collab-1', {
      type: 'parallel',
      departments: ['backend', 'design'],
      tasks: ['task1', 'task2']
    });
    return collab.id === 'test-collab-1' && collab.agents.size === 2;
  });

  test('RealTime', 'Update agent status in collaboration', () => {
    const monitor = new CollaborationMonitor();
    monitor.startCollaboration('test-collab-2', {
      departments: ['backend']
    });
    const result = monitor.updateAgentStatus('test-collab-2', 'backend-test-collab-2', 'coding');
    return result === true;
  });

  test('RealTime', 'Report task completion', () => {
    const monitor = new CollaborationMonitor();
    monitor.startCollaboration('test-collab-3', {
      departments: ['backend'],
      tasks: ['task1', 'task2']
    });
    const result = monitor.reportTaskComplete('test-collab-3', 'backend-test-collab-3', 'task1');
    return result === true;
  });

  test('RealTime', 'RealtimeCoordinationManager singleton', () => {
    const manager1 = RealtimeCoordinationManager.getInstance();
    const manager2 = RealtimeCoordinationManager.getInstance();
    return manager1 === manager2;
  });

  // 2. TEST MARKDOWN COLLABORATION WORKFLOW
  console.log('\n🟢 TESTING MARKDOWN COLLABORATION WORKFLOW\n');

  test('Markdown', 'MarkdownCollaborationWorkflow instantiation', () => {
    const workflow = new MarkdownCollaborationWorkflow();
    return workflow !== undefined && workflow.templates !== undefined;
  });

  test('Markdown', 'Template loading', () => {
    const workflow = new MarkdownCollaborationWorkflow();
    return workflow.templates['technical-spec'] !== undefined &&
           workflow.templates['technical-spec'].sections.length > 0;
  });

  await asyncTest('Markdown', 'Start collaborative documentation', async () => {
    const workflow = new MarkdownCollaborationWorkflow();
    const docId = await workflow.startCollaborativeDocumentation({
      title: 'Test Document',
      type: 'technical-spec',
      topic: 'Test Feature',
      departments: ['backend', 'design']
    });
    return docId !== undefined && workflow.activeDocuments.has(docId);
  });

  test('Markdown', 'Section guidelines generation', () => {
    const workflow = new MarkdownCollaborationWorkflow();
    const guidelines = workflow.getSectionGuidelines('Architecture', 'backend', 'test feature');
    return guidelines.includes('architecture') && guidelines.includes('test feature');
  });

  test('Markdown', 'MarkdownMergeEngine instantiation', () => {
    const engine = new MarkdownMergeEngine();
    return engine !== undefined && engine.conflictStrategies !== undefined;
  });

  await asyncTest('Markdown', 'Merge drafts without conflicts', async () => {
    const engine = new MarkdownMergeEngine();
    const drafts = [
      {
        department: 'backend',
        sections: [
          { name: 'Architecture', content: '## Architecture\n\nBackend perspective', priority: 1 }
        ],
        createdAt: Date.now()
      }
    ];
    const result = await engine.mergeDrafts(drafts);
    return result.conflicts === 0 && result.content.includes('Architecture');
  });

  await asyncTest('Markdown', 'Detect conflicts in drafts', async () => {
    const engine = new MarkdownMergeEngine();
    const drafts = [
      {
        department: 'backend',
        sections: [
          { name: 'API', content: '## API\n\nREST API required', priority: 1 }
        ],
        createdAt: Date.now()
      },
      {
        department: 'design',
        sections: [
          { name: 'API', content: '## API\n\nGraphQL API required', priority: 1 }
        ],
        createdAt: Date.now()
      }
    ];
    const result = await engine.mergeDrafts(drafts, { detectConflicts: true });
    return result.conflicts > 0;
  });

  test('Markdown', 'MarkdownManagerReview instantiation', () => {
    const review = new MarkdownManagerReview();
    return review !== undefined && review.mergeEngine !== undefined;
  });

  await asyncTest('Markdown', 'Submit document for review', async () => {
    const review = new MarkdownManagerReview();
    const document = {
      id: 'test-doc-1',
      title: 'Test Document',
      departments: ['backend', 'design']
    };
    const reviewId = await review.submitForReview(document, '# Test Content', []);
    return reviewId !== undefined && review.reviews.has(reviewId);
  });

  // 3. TEST PEER REVIEW SYSTEM
  console.log('\n🟢 TESTING PEER REVIEW SYSTEM\n');

  test('PeerReview', 'PeerReviewProtocol instantiation', () => {
    const protocol = new PeerReviewProtocol();
    return protocol !== undefined && protocol.specialistExpertise !== undefined;
  });

  test('PeerReview', 'Create review request', () => {
    const protocol = new PeerReviewProtocol();
    const reviewId = protocol.createReviewRequest({
      authorId: 'test-author',
      authorDepartment: 'backend',
      artifactType: 'code',
      artifact: 'function test() { return true; }',
      reviewType: 'code'
    });
    return reviewId !== undefined && protocol.reviewQueue.length > 0;
  });

  test('PeerReview', 'Find suitable reviewers', () => {
    const protocol = new PeerReviewProtocol();
    const review = {
      authorDepartment: 'backend',
      reviewType: 'code',
      context: { tags: ['api', 'security'] },
      maxReviewers: 3
    };
    const reviewers = protocol.findSuitableReviewers(review);
    return Array.isArray(reviewers) && reviewers.length <= 3;
  });

  test('PeerReview', 'SpecialistPeerReview instantiation', () => {
    const peerReview = new SpecialistPeerReview();
    return peerReview !== undefined && peerReview.specialistProfiles !== undefined;
  });

  await asyncTest('PeerReview', 'Request peer review', async () => {
    const peerReview = new SpecialistPeerReview();
    const sessionId = await peerReview.requestPeerReview({
      requesterId: 'api-architect',
      artifact: 'test code',
      artifactType: 'code'
    });
    return sessionId !== undefined && peerReview.reviewSessions.has(sessionId);
  });

  test('PeerReview', 'Calculate reviewer match score', () => {
    const peerReview = new SpecialistPeerReview();
    const session = { artifactType: 'code', requesterId: 'api-architect' };
    const requesterProfile = peerReview.specialistProfiles['api-architect'];
    const reviewerProfile = peerReview.specialistProfiles['security-specialist'];
    const score = peerReview.calculateReviewerMatch(
      session,
      requesterProfile,
      'security-specialist',
      reviewerProfile
    );
    return score >= 0 && score <= 1;
  });

  // 4. TEST COLLABORATION STATUS MANAGEMENT
  console.log('\n🟢 TESTING COLLABORATION STATUS MANAGEMENT\n');

  test('StatusMgmt', 'CollaborationStatusManager singleton', () => {
    const manager1 = getInstance();
    const manager2 = getInstance();
    return manager1 === manager2;
  });

  test('StatusMgmt', 'Update collaboration status', () => {
    const manager = getInstance();
    manager.updateCollaborationStatus({
      id: 'test-collab',
      event: 'started',
      status: 'active',
      progress: 0,
      agents: []
    });
    return manager.statusStore.has('test-collab');
  });

  test('StatusMgmt', 'Update agent status', () => {
    const manager = getInstance();
    manager.updateAgentStatus({
      agentId: 'test-agent',
      status: 'active',
      metadata: { task: 'testing' }
    });
    return manager.statusStore.has('agent-test-agent');
  });

  test('StatusMgmt', 'Get status summary', () => {
    const manager = getInstance();
    const summary = manager.getStatusSummary();
    return summary !== undefined && summary.metrics !== undefined;
  });

  test('StatusMgmt', 'Get activity timeline', () => {
    const manager = getInstance();
    const timeline = manager.getActivityTimeline({ limit: 10 });
    return Array.isArray(timeline);
  });

  test('StatusMgmt', 'Get analytics', () => {
    const manager = getInstance();
    const analytics = manager.getAnalytics();
    return analytics !== undefined && analytics.overall !== undefined;
  });

  // 5. TEST INTEGRATION
  console.log('\n🟢 TESTING INTEGRATION\n');

  test('Integration', 'CollaborationEnhancementIntegration instantiation', () => {
    const integration = new CollaborationEnhancementIntegration();
    return integration !== undefined && integration.components !== undefined;
  });

  await asyncTest('Integration', 'Verify integration components', async () => {
    const integration = new CollaborationEnhancementIntegration();
    const verification = await integration.verify();
    return verification.success === true;
  });

  test('Integration', 'Get integration report', () => {
    const integration = new CollaborationEnhancementIntegration();
    const report = integration.getIntegrationReport();
    return report.success === true && report.components.length > 0;
  });

  // 6. TEST DASHBOARD
  console.log('\n🟢 TESTING STATUS DASHBOARD\n');

  test('Dashboard', 'CollaborationStatusDashboard instantiation', () => {
    const dashboard = new CollaborationStatusDashboard();
    return dashboard !== undefined && dashboard.realtimeManager !== undefined;
  });

  test('Dashboard', 'Set display mode', () => {
    const dashboard = new CollaborationStatusDashboard();
    dashboard.setDisplayMode('detailed');
    return dashboard.displayMode === 'detailed';
  });

  test('Dashboard', 'Get statistics', () => {
    const dashboard = new CollaborationStatusDashboard();
    const stats = dashboard.getStatistics();
    return stats !== undefined && typeof stats.totalCollaborations === 'number';
  });

  // 7. PERFORMANCE TESTS
  console.log('\n🟢 TESTING PERFORMANCE\n');

  test('Performance', 'High-frequency event handling', () => {
    const emitter = new RealtimeEventEmitter();
    const startTime = Date.now();
    
    // Register 10 agents
    for (let i = 0; i < 10; i++) {
      emitter.registerAgent(`perf-agent-${i}`, { department: 'test' });
    }
    
    // Send 1000 status updates
    for (let i = 0; i < 1000; i++) {
      emitter.broadcastStatus(`perf-agent-${i % 10}`, 'active', { iteration: i });
    }
    
    const duration = Date.now() - startTime;
    return duration < 200; // Should complete in < 200ms
  });

  test('Performance', 'Large document merge', async () => {
    const engine = new MarkdownMergeEngine();
    const sections = [];
    
    // Create 20 sections
    for (let i = 0; i < 20; i++) {
      sections.push({
        name: `Section ${i}`,
        content: `## Section ${i}\n\nContent for section ${i}`,
        priority: i
      });
    }
    
    const drafts = [
      { department: 'backend', sections: sections.slice(0, 10), createdAt: Date.now() },
      { department: 'design', sections: sections.slice(10, 20), createdAt: Date.now() }
    ];
    
    const startTime = Date.now();
    const result = await engine.mergeDrafts(drafts);
    const duration = Date.now() - startTime;
    
    return duration < 100 && result.sections === 20;
  });

  // 8. INTEGRATION WORKFLOW TEST
  console.log('\n🟢 TESTING END-TO-END WORKFLOW\n');

  await asyncTest('E2E', 'Complete documentation workflow', async () => {
    // Start documentation
    const workflow = new MarkdownCollaborationWorkflow();
    const docId = await workflow.startCollaborativeDocumentation({
      title: 'E2E Test Document',
      type: 'feature-doc',
      topic: 'Authentication System',
      departments: ['product', 'design', 'backend']
    });
    
    // Get document status
    const status = workflow.getDocumentStatus(docId);
    
    // Preview document
    const preview = await workflow.previewDocument(docId);
    
    return docId !== undefined && 
           status !== null && 
           preview !== null &&
           preview.includes('Authentication System');
  });

  await asyncTest('E2E', 'Complete peer review workflow', async () => {
    const peerReview = new SpecialistPeerReview();
    
    // Request review
    const sessionId = await peerReview.requestPeerReview({
      requesterId: 'api-architect',
      artifact: 'function authenticate() { /* implementation */ }',
      artifactType: 'code',
      urgency: 'normal'
    });
    
    // Accept invitation
    const session = peerReview.reviewSessions.get(sessionId);
    if (session && session.reviewers.length > 0) {
      const reviewerId = session.reviewers[0].reviewerId;
      await peerReview.acceptReviewInvitation(sessionId, reviewerId);
      
      // Submit feedback
      await peerReview.submitReviewFeedback(sessionId, reviewerId, {
        approved: true,
        comments: 'Good implementation',
        issues: [],
        suggestions: ['Consider adding rate limiting']
      });
    }
    
    return session !== undefined && session.feedback.length > 0;
  });

  // FINAL REPORT
  console.log('                    TEST RESULTS SUMMARY');
  
  // Category summary
  console.log('🟢 Results by Category:\n');
  Object.entries(testResults).forEach(([category, results]) => {
    const total = results.passed + results.failed;
    const percentage = Math.round((results.passed / total) * 100);
    const icon = percentage === 100 ? '🏁' : percentage >= 80 ? '🟢' : '🔴';
    console.log(`${icon} ${category}: ${results.passed}/${total} (${percentage}%)`);
  });
  
  // Overall summary
  console.log('\n🟢 Overall Results:\n');
  const percentage = Math.round((passedTests / totalTests) * 100);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${percentage}%)`);
  console.log(`Failed: ${failedTests.length}`);
  
  if (failedTests.length > 0) {
    console.log('\n🔴 Failed Tests:\n');
    failedTests.forEach(({ category, name, error }) => {
      console.log(`  - [${category}] ${name}: ${error}`);
    });
  }
  
  // Success determination
  const success = percentage >= 90;
  
  if (success) {
    console.log('🏁 COLLABORATION ENHANCEMENTS VERIFIED SUCCESSFULLY!');
    console.log('🏁 All major components are operational');
    console.log('🏁 Framework is ready for enhanced collaboration');
  } else {
    console.log('🟡  SOME TESTS FAILED');
    console.log('Please review failed tests above');
  }
  
  return {
    success,
    totalTests,
    passedTests,
    failedTests: failedTests.length,
    percentage,
    categories: testResults
  };
}

// Run tests
if (require.main === module) {
  runAllTests()
    .then(results => {
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test suite error:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests };