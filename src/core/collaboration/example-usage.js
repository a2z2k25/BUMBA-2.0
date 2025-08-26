/**
 * BUMBA Real-Time Collaboration System - Usage Example
 * Demonstrates key features of the collaboration system
 */

const {
  initializeCollaboration,
  createCollaborativeSession,
  getCollaborationSystem
} = require('./index');

async function demonstrateCollaborationSystem() {
  console.log('🟢 Starting BUMBA Collaboration System Demo...\n');

  try {
    // 1. Initialize the collaboration system
    console.log('1. Initializing collaboration system...');
    const collaborationSystem = await initializeCollaboration({
      websocket: {
        port: 8080,
        maxConnections: 100
      },
      ethics: {
        monitoring: true,
        interventionLevel: 'medium'
      },
      recording: {
        enabled: true,
        compression: true
      }
    });

    console.log('🏁 Collaboration system initialized\n');

    // 2. Create a collaborative session
    console.log('2. Creating collaborative session...');
    const session = await createCollaborativeSession({
      purpose: 'Implement user authentication system',
      objectives: [
        'Design authentication API',
        'Implement secure password handling',
        'Add session management',
        'Create user registration flow'
      ],
      participants: [
        {
          id: 'backend-specialist',
          name: 'Backend Specialist',
          type: 'specialist',
          capabilities: ['node.js', 'express', 'security', 'database']
        },
        {
          id: 'frontend-specialist',
          name: 'Frontend Specialist',
          type: 'specialist',
          capabilities: ['react', 'typescript', 'ui/ux', 'forms']
        },
        {
          id: 'security-specialist',
          name: 'Security Specialist',
          type: 'specialist',
          capabilities: ['security', 'authentication', 'encryption', 'audit']
        }
      ],
      maxParticipants: 5,
      ethicsLevel: 'high'
    });

    console.log(`🏁 Session created: ${session.id}\n`);

    // 3. Simulate agents joining the session
    console.log('3. Agents joining the session...');
    
    for (const participant of session.getParticipants()) {
      console.log(`🟢 ${participant.name} joined the session`);
      
      // Update presence
      await collaborationSystem.updateAgentPresence(session.id, participant.id, {
        status: 'active',
        activity: 'joined',
        location: {
          workspace: 'main',
          file: null,
          line: null
        }
      });
    }

    console.log('🏁 All agents joined successfully\n');

    // 4. Demonstrate collaborative code editing
    console.log('4. Starting collaborative code editing...');
    
    // Backend specialist starts coding
    await collaborationSystem.handleLiveCodeEdit(session.id, {
      type: 'insert',
      position: 0,
      content: `// Authentication API Implementation
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthenticationAPI {
  constructor(database, jwtSecret) {
    this.db = database;
    this.jwtSecret = jwtSecret;
  }

  async register(userData) {
    // TODO: Implement user registration
  }
}

module.exports = AuthenticationAPI;`,
      agent: 'backend-specialist',
      description: 'Initial authentication API structure'
    });

    console.log('🟢 Backend specialist added initial code structure');

    // Security specialist adds validation
    await collaborationSystem.handleLiveCodeEdit(session.id, {
      type: 'insert',
      position: 350,
      content: `
    // Validate user input
    if (!userData.email || !userData.password) {
      throw new Error('Email and password are required');
    }
    
    if (!this.isValidEmail(userData.email)) {
      throw new Error('Invalid email format');
    }
    
    if (!this.isSecurePassword(userData.password)) {
      throw new Error('Password does not meet security requirements');
    }`,
      agent: 'security-specialist',
      description: 'Added input validation for security'
    });

    console.log('🟢 Security specialist added validation logic');

    // Frontend specialist suggests UI considerations
    await session.recordContribution('frontend-specialist', 'discussions', {
      message: 'We should consider the user experience for password requirements. I suggest showing real-time validation feedback.',
      type: 'suggestion',
      relevantCode: 'isSecurePassword method'
    });

    console.log('🟢 Frontend specialist provided UX feedback\n');

    // 5. Demonstrate collaborative decision making
    console.log('5. Starting collaborative decision process...');
    
    const decision = await collaborationSystem.initiateCollaborativeDecision(session.id, {
      question: 'Which authentication strategy should we implement?',
      context: 'User authentication system design - considering security, usability, and maintenance',
      options: ['JWT with refresh tokens', 'Session-based auth', 'OAuth integration', 'Hybrid approach'],
      strategy: 'consciousness_weighted',
      deadline: Date.now() + 120000 // 2 minutes
    });

    console.log(`🟢️ Decision process initiated: ${decision.id}`);

    // Agents vote with reasoning
    await collaborationSystem.decisionEngine.recordVote(decision.id, 'backend-specialist', {
      option: 'JWT with refresh tokens',
      reasoning: 'JWT tokens are stateless and scale well. Refresh tokens provide security by limiting token lifetime.',
      confidence: 0.85
    });

    console.log('🏁 Backend specialist voted: JWT with refresh tokens');

    await collaborationSystem.decisionEngine.recordVote(decision.id, 'security-specialist', {
      option: 'Hybrid approach',
      reasoning: 'Combine JWT for API access with secure session management for sensitive operations. Best of both worlds for security.',
      confidence: 0.9
    });

    console.log('🏁 Security specialist voted: Hybrid approach');

    await collaborationSystem.decisionEngine.recordVote(decision.id, 'frontend-specialist', {
      option: 'JWT with refresh tokens',
      reasoning: 'Simpler frontend implementation and better user experience with automatic token refresh.',
      confidence: 0.75
    });

    console.log('🏁 Frontend specialist voted: JWT with refresh tokens');

    // Wait a moment for decision processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('🟢 Decision process completed\n');

    // 6. Demonstrate pair programming
    console.log('6. Starting pair programming session...');
    
    const pairSession = await collaborationSystem.initiatePairProgramming(session.id, {
      participants: [
        { id: 'backend-specialist', role: 'driver' },
        { id: 'security-specialist', role: 'navigator' }
      ],
      fileName: 'authentication.js',
      language: 'javascript',
      initialContent: '// Pair programming session: JWT implementation\n'
    });

    console.log(`🟢 Pair programming session started: ${pairSession.id}`);
    console.log('🟢 Backend specialist is driving, Security specialist is navigating');

    // Simulate some pair programming activity
    await pairSession.recordKeystroke('backend-specialist', {
      type: 'type',
      content: 'async generateJWT(user) {'
    });

    await pairSession.provideFeedback('security-specialist', {
      message: 'Consider adding user role information to the JWT payload for authorization.',
      type: 'suggestion'
    });

    console.log('🟢 Security specialist provided feedback during pair programming');

    // Switch roles
    await pairSession.switchRoles();
    console.log('🟢 Roles switched: Security specialist is now driving\n');

    // 7. Demonstrate collaborative debugging
    console.log('7. Starting collaborative debugging session...');
    
    const debugSession = await collaborationSystem.startCollaborativeDebugging(session.id, {
      file: 'authentication.js',
      language: 'javascript',
      breakpoints: [
        { line: 15, condition: 'user.email === null' },
        { line: 25, condition: 'token === undefined' }
      ]
    });

    console.log(`🟢 Debug session created: ${debugSession.id}`);

    // Add participants to debug session
    await debugSession.addParticipant('backend-specialist', 'driver');
    await debugSession.addParticipant('security-specialist', 'observer');

    console.log('🟢 Agents joined debug session');

    // Set additional breakpoint
    await debugSession.setBreakpoint('backend-specialist', {
      file: 'authentication.js',
      line: 30,
      condition: 'userData.password.length < 8',
      type: 'conditional'
    });

    console.log('🟢 Breakpoint set for password validation');

    // Inspect variables
    const variable = await debugSession.inspectVariable('backend-specialist', 'userData.email');
    console.log(`🟢 Variable inspection: userData.email = ${JSON.stringify(variable)}\n`);

    // 8. Show session metrics and analytics
    console.log('8. Session metrics and analytics...');
    
    const metrics = collaborationSystem.getCollaborationMetrics(session.id);
    console.log('🟢 Collaboration Metrics:');
    console.log(`   - Active participants: ${metrics.session.activeParticipants}`);
    console.log(`   - Operations count: ${metrics.session.operationsCount}`);
    console.log(`   - Collaboration score: ${(metrics.session.collaborationScore * 100).toFixed(1)}%`);
    console.log(`   - Consensus reached: ${metrics.decisions.consensusReached}`);
    console.log(`   - Ethics compliance: ${(metrics.ethics.interventionSuccess * 100).toFixed(1)}%`);
    console.log(`   - Consciousness alignment: ${(metrics.consciousness.overall_consciousness_rating * 100).toFixed(1)}%\n`);

    // 9. Demonstrate session recording
    console.log('9. Session recording and playback...');
    
    const recording = await collaborationSystem.getSessionPlayback(session.id);
    console.log(`🟢 Session recorded: ${recording.events?.length || 0} events captured`);

    // Generate analytics report
    const analytics = await collaborationSystem.generateAnalytics(session.id);
    console.log('🟢 Analytics generated:');
    console.log(`   - Session duration: ${Math.round(analytics.basicAnalytics?.duration / 1000 / 60)} minutes`);
    console.log(`   - Events per minute: ${analytics.basicAnalytics?.eventsPerMinute}`);
    console.log(`   - Most active agent: ${analytics.basicAnalytics?.mostActiveAgent}`);
    console.log(`   - Collaboration score: ${(analytics.basicAnalytics?.collaborationScore * 100).toFixed(1)}%\n`);

    // 10. Clean shutdown
    console.log('10. Ending collaboration session...');
    
    await session.gracefulShutdown();
    console.log('🏁 Session ended gracefully');

    console.log('\n🏁 BUMBA Collaboration System Demo completed successfully!');
    console.log('\nKey features demonstrated:');
    console.log('🏁 Real-time collaborative code editing with CRDT conflict resolution');
    console.log('🏁 Consciousness-driven decision making with weighted voting');
    console.log('🏁 Pair programming with role switching and metrics');
    console.log('🏁 Collaborative debugging with shared breakpoints');
    console.log('🏁 Ethics monitoring and intervention');
    console.log('🏁 Session recording and analytics');
    console.log('🏁 Presence awareness and activity tracking');
    console.log('🏁 Integration with BUMBA consciousness principles');

  } catch (error) {
    console.error('🔴 Demo failed:', error.message);
    console.error(error.stack);
  }
}

// Enhanced demo showing specific collaboration scenarios
async function demonstrateAdvancedScenarios() {
  console.log('\n🟢 Advanced Collaboration Scenarios Demo...\n');

  const collaborationSystem = await initializeCollaboration();

  // Scenario 1: Code Review Session
  console.log('Scenario 1: Collaborative Code Review');
  const reviewSession = await createCollaborativeSession({
    purpose: 'Code review for authentication module',
    objectives: ['Review security implementation', 'Check code quality', 'Validate test coverage'],
    participants: [
      { id: 'author', name: 'Code Author', type: 'developer' },
      { id: 'reviewer-1', name: 'Senior Developer', type: 'reviewer' },
      { id: 'security-expert', name: 'Security Expert', type: 'security' }
    ]
  });

  // Simulate code review discussion
  await reviewSession.recordContribution('reviewer-1', 'discussions', {
    message: 'The password hashing implementation looks secure, but consider using a higher cost factor for bcrypt.',
    type: 'suggestion',
    line: 45,
    severity: 'medium'
  });

  await reviewSession.recordContribution('security-expert', 'discussions', {
    message: 'Agreed. Also, we should add rate limiting to prevent brute force attacks.',
    type: 'security_concern',
    priority: 'high'
  });

  console.log('🏁 Code review session with expert feedback\n');

  // Scenario 2: Emergency Bug Fix
  console.log('Scenario 2: Emergency Bug Fix Collaboration');
  const emergencySession = await createCollaborativeSession({
    purpose: 'Critical security vulnerability fix',
    objectives: ['Identify root cause', 'Implement fix', 'Verify solution', 'Deploy safely'],
    participants: [
      { id: 'oncall-dev', name: 'On-call Developer', type: 'developer' },
      { id: 'security-lead', name: 'Security Lead', type: 'security' },
      { id: 'devops-engineer', name: 'DevOps Engineer', type: 'devops' }
    ],
    priority: 'critical',
    ethicsLevel: 'high'
  });

  // Fast-track decision making
  const urgentDecision = await collaborationSystem.initiateCollaborativeDecision(emergencySession.id, {
    question: 'Should we hotfix in production or deploy to staging first?',
    options: ['Hotfix directly', 'Stage then deploy', 'Rollback and fix'],
    strategy: 'qualified_majority',
    deadline: Date.now() + 60000 // 1 minute for urgent decision
  });

  console.log('🔴 Emergency decision process initiated with 1-minute deadline\n');

  // Scenario 3: Learning Session
  console.log('Scenario 3: Knowledge Transfer Session');
  const learningSession = await createCollaborativeSession({
    purpose: 'Knowledge transfer: Advanced authentication patterns',
    objectives: ['Share OAuth implementation knowledge', 'Demonstrate testing patterns', 'Document best practices'],
    participants: [
      { id: 'senior-dev', name: 'Senior Developer', type: 'mentor' },
      { id: 'junior-dev-1', name: 'Junior Developer 1', type: 'learner' },
      { id: 'junior-dev-2', name: 'Junior Developer 2', type: 'learner' }
    ],
    sessionType: 'knowledge_transfer'
  });

  // Mentor shares knowledge
  await learningSession.recordContribution('senior-dev', 'discussions', {
    message: 'Let me walk you through the OAuth flow step by step, and we\'ll implement it together.',
    type: 'teaching',
    topic: 'oauth_implementation'
  });

  console.log('🟢‍🟢 Knowledge transfer session with mentoring\n');

  console.log('🟢 Advanced scenarios demonstration completed!');
}

// Run the demonstrations
if (require.main === module) {
  (async () => {
    await demonstrateCollaborationSystem();
    await demonstrateAdvancedScenarios();
    
    console.log('\n🏁 All demonstrations completed successfully!');
    process.exit(0);
  })().catch(error => {
    console.error('Demo failed:', error);
    process.exit(1);
  });
}

module.exports = {
  demonstrateCollaborationSystem,
  demonstrateAdvancedScenarios
};