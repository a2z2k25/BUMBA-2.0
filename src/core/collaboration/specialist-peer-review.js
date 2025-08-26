/**
 * BUMBA Specialist Peer Review System
 * Implements cross-specialist code review with expertise matching
 * Facilitates knowledge sharing between specialists
 */

const PeerReviewProtocol = require('./peer-review-protocol');
const { RealtimeCoordinationManager } = require('./realtime-coordination-hooks');

class SpecialistPeerReview {
  constructor() {
    this.protocol = new PeerReviewProtocol();
    this.realtimeManager = RealtimeCoordinationManager.getInstance();
    this.specialistProfiles = this.initializeSpecialistProfiles();
    this.reviewSessions = new Map();
    this.knowledgeExchange = new Map();
  }

  /**
   * Initialize specialist profiles with skills and preferences
   */
  initializeSpecialistProfiles() {
    return {
      // Backend Specialists
      'api-architect': {
        department: 'backend',
        skills: ['REST', 'GraphQL', 'microservices', 'API design'],
        reviewStrengths: ['architecture', 'scalability', 'best practices'],
        preferredReviewTypes: ['architecture', 'api', 'performance'],
        personality: 'thorough and systematic'
      },
      'database-specialist': {
        department: 'backend',
        skills: ['SQL', 'NoSQL', 'optimization', 'schema design'],
        reviewStrengths: ['query optimization', 'data modeling', 'performance'],
        preferredReviewTypes: ['database', 'performance', 'architecture'],
        personality: 'detail-oriented and analytical'
      },
      'security-specialist': {
        department: 'backend',
        skills: ['authentication', 'encryption', 'OWASP', 'penetration testing'],
        reviewStrengths: ['vulnerability detection', 'security patterns', 'compliance'],
        preferredReviewTypes: ['security', 'authentication', 'code'],
        personality: 'paranoid and meticulous'
      },
      
      // Frontend Specialists
      'react-specialist': {
        department: 'design',
        skills: ['React', 'hooks', 'state management', 'performance'],
        reviewStrengths: ['component design', 'React patterns', 'optimization'],
        preferredReviewTypes: ['code', 'components', 'performance'],
        personality: 'creative and efficient'
      },
      'ui-architect': {
        department: 'design',
        skills: ['component systems', 'design patterns', 'architecture'],
        reviewStrengths: ['scalability', 'reusability', 'consistency'],
        preferredReviewTypes: ['architecture', 'design', 'components'],
        personality: 'systematic and forward-thinking'
      },
      'accessibility-specialist': {
        department: 'design',
        skills: ['WCAG', 'ARIA', 'screen readers', 'keyboard navigation'],
        reviewStrengths: ['compliance', 'usability', 'inclusive design'],
        preferredReviewTypes: ['accessibility', 'usability', 'design'],
        personality: 'empathetic and thorough'
      },
      
      // Product Specialists
      'product-analyst': {
        department: 'product',
        skills: ['requirements', 'user stories', 'metrics', 'analytics'],
        reviewStrengths: ['business logic', 'user value', 'metrics'],
        preferredReviewTypes: ['requirements', 'documentation', 'metrics'],
        personality: 'strategic and user-focused'
      },
      'technical-writer': {
        department: 'product',
        skills: ['documentation', 'API docs', 'tutorials', 'clarity'],
        reviewStrengths: ['clarity', 'completeness', 'user guidance'],
        preferredReviewTypes: ['documentation', 'api-docs', 'guides'],
        personality: 'clear and pedagogical'
      }
    };
  }

  /**
   * Request peer review from specialists
   */
  async requestPeerReview(config) {
    const {
      requesterId,
      artifact,
      artifactType = 'code',
      urgency = 'normal',
      specificReviewers = null,
      crossDepartment = true
    } = config;
    
    const requesterProfile = this.specialistProfiles[requesterId];
    if (!requesterProfile) {
      throw new Error(`Unknown specialist: ${requesterId}`);
    }
    
    // Create review session
    const sessionId = `session-${Date.now()}`;
    const session = {
      id: sessionId,
      requesterId,
      requesterDepartment: requesterProfile.department,
      artifact,
      artifactType,
      urgency,
      crossDepartment,
      status: 'matching',
      createdAt: Date.now(),
      reviewers: [],
      feedback: []
    };
    
    this.reviewSessions.set(sessionId, session);
    
    // Find suitable reviewers
    const reviewers = specificReviewers || 
      await this.findOptimalReviewers(session, requesterProfile);
    
    // Send review invitations
    await this.sendReviewInvitations(session, reviewers);
    
    // Start review session
    await this.startReviewSession(session);
    
    return sessionId;
  }

  /**
   * Find optimal reviewers for the artifact
   */
  async findOptimalReviewers(session, requesterProfile) {
    const candidates = [];
    
    Object.entries(this.specialistProfiles).forEach(([specialistId, profile]) => {
      // Skip self-review
      if (specialistId === session.requesterId) {return;}
      
      // Apply cross-department filter if needed
      if (session.crossDepartment && profile.department === requesterProfile.department) {
        return;
      }
      
      // Calculate match score
      const score = this.calculateReviewerMatch(
        session,
        requesterProfile,
        specialistId,
        profile
      );
      
      if (score > 0) {
        candidates.push({
          specialistId,
          profile,
          score,
          reason: this.getMatchReason(session, profile)
        });
      }
    });
    
    // Sort by score and select top reviewers
    candidates.sort((a, b) => b.score - a.score);
    
    // Select 2-3 reviewers based on urgency
    const reviewerCount = session.urgency === 'critical' ? 3 : 2;
    return candidates.slice(0, reviewerCount);
  }

  /**
   * Calculate reviewer match score
   */
  calculateReviewerMatch(session, requesterProfile, reviewerId, reviewerProfile) {
    let score = 0;
    
    // Check if artifact type matches reviewer preferences
    if (reviewerProfile.preferredReviewTypes.includes(session.artifactType)) {
      score += 0.4;
    }
    
    // Check for complementary skills
    const complementarySkills = this.findComplementarySkills(
      requesterProfile.skills,
      reviewerProfile.skills
    );
    score += complementarySkills.length * 0.1;
    
    // Bonus for cross-department review
    if (requesterProfile.department !== reviewerProfile.department) {
      score += 0.2;
    }
    
    // Check reviewer availability (simulated)
    const availability = Math.random(); // In production, check actual availability
    score *= availability;
    
    return Math.min(score, 1);
  }

  /**
   * Find complementary skills between specialists
   */
  findComplementarySkills(skills1, skills2) {
    const complementary = [];
    
    // Skills that benefit from cross-review
    const complementaryPairs = [
      ['REST', 'GraphQL'],
      ['React', 'performance'],
      ['security', 'API design'],
      ['documentation', 'API design'],
      ['accessibility', 'React'],
      ['requirements', 'architecture']
    ];
    
    complementaryPairs.forEach(([skill1, skill2]) => {
      if ((skills1.includes(skill1) && skills2.includes(skill2)) ||
          (skills1.includes(skill2) && skills2.includes(skill1))) {
        complementary.push(`${skill1}-${skill2}`);
      }
    });
    
    return complementary;
  }

  /**
   * Get match reason for review pairing
   */
  getMatchReason(session, reviewerProfile) {
    const reasons = [];
    
    if (reviewerProfile.preferredReviewTypes.includes(session.artifactType)) {
      reasons.push(`expertise in ${session.artifactType}`);
    }
    
    if (reviewerProfile.department !== session.requesterDepartment) {
      reasons.push('cross-department perspective');
    }
    
    return reasons.join(', ') || 'general review expertise';
  }

  /**
   * Send review invitations
   */
  async sendReviewInvitations(session, reviewers) {
    const invitations = reviewers.map(reviewer => ({
      sessionId: session.id,
      reviewerId: reviewer.specialistId,
      requesterId: session.requesterId,
      artifactType: session.artifactType,
      urgency: session.urgency,
      reason: reviewer.reason,
      status: 'pending'
    }));
    
    session.reviewers = invitations;
    
    // Broadcast invitations via real-time system
    invitations.forEach(invitation => {
      this.realtimeManager.monitor.emitter.emit('review:invitation', invitation);
    });
    
    return invitations;
  }

  /**
   * Start review session
   */
  async startReviewSession(session) {
    session.status = 'in-progress';
    session.startTime = Date.now();
    
    // Create collaboration channel for the review
    const channelName = `review-${session.id}`;
    
    // Register participants
    this.realtimeManager.monitor.emitter.registerAgent(
      session.requesterId,
      { role: 'requester', session: session.id }
    );
    
    session.reviewers.forEach(reviewer => {
      this.realtimeManager.monitor.emitter.registerAgent(
        reviewer.reviewerId,
        { role: 'reviewer', session: session.id }
      );
      
      // Subscribe to review channel
      this.realtimeManager.monitor.emitter.subscribeToChannel(
        reviewer.reviewerId,
        channelName
      );
    });
    
    // Subscribe requester to channel
    this.realtimeManager.monitor.emitter.subscribeToChannel(
      session.requesterId,
      channelName
    );
    
    // Send initial artifact to channel
    this.realtimeManager.monitor.emitter.sendToChannel(channelName, {
      type: 'artifact:shared',
      artifact: session.artifact,
      artifactType: session.artifactType,
      requesterId: session.requesterId
    });
    
    return session;
  }

  /**
   * Accept review invitation
   */
  async acceptReviewInvitation(sessionId, reviewerId) {
    const session = this.reviewSessions.get(sessionId);
    if (!session) {return false;}
    
    const reviewer = session.reviewers.find(r => r.reviewerId === reviewerId);
    if (!reviewer) {return false;}
    
    reviewer.status = 'accepted';
    reviewer.acceptedAt = Date.now();
    
    // Notify channel
    const channelName = `review-${sessionId}`;
    this.realtimeManager.monitor.emitter.sendToChannel(channelName, {
      type: 'reviewer:joined',
      reviewerId,
      timestamp: Date.now()
    });
    
    return true;
  }

  /**
   * Submit review feedback
   */
  async submitReviewFeedback(sessionId, reviewerId, feedback) {
    const session = this.reviewSessions.get(sessionId);
    if (!session) {return false;}
    
    const reviewer = session.reviewers.find(r => r.reviewerId === reviewerId);
    if (!reviewer || reviewer.status !== 'accepted') {return false;}
    
    const reviewerProfile = this.specialistProfiles[reviewerId];
    
    const reviewFeedback = {
      reviewerId,
      department: reviewerProfile.department,
      timestamp: Date.now(),
      ...feedback,
      strengths: this.identifyStrengths(feedback),
      improvements: this.identifyImprovements(feedback),
      knowledgeShared: this.extractKnowledgeShared(feedback)
    };
    
    session.feedback.push(reviewFeedback);
    reviewer.status = 'completed';
    reviewer.completedAt = Date.now();
    
    // Store knowledge exchange
    this.recordKnowledgeExchange(session, reviewFeedback);
    
    // Broadcast feedback
    const channelName = `review-${sessionId}`;
    this.realtimeManager.monitor.emitter.sendToChannel(channelName, {
      type: 'feedback:submitted',
      reviewerId,
      summary: {
        approved: feedback.approved,
        issueCount: feedback.issues?.length || 0,
        suggestionCount: feedback.suggestions?.length || 0
      }
    });
    
    // Check if session is complete
    await this.checkSessionCompletion(session);
    
    return true;
  }

  /**
   * Identify strengths in feedback
   */
  identifyStrengths(feedback) {
    const strengths = [];
    
    if (feedback.comments) {
      // Look for positive indicators
      const positiveKeywords = ['good', 'excellent', 'well', 'great', 'solid', 'clean'];
      positiveKeywords.forEach(keyword => {
        if (feedback.comments.toLowerCase().includes(keyword)) {
          strengths.push('positive implementation noted');
        }
      });
    }
    
    if (feedback.approved) {
      strengths.push('meets quality standards');
    }
    
    return strengths;
  }

  /**
   * Identify improvements in feedback
   */
  identifyImprovements(feedback) {
    const improvements = [];
    
    if (feedback.issues) {
      feedback.issues.forEach(issue => {
        improvements.push({
          type: issue.type || 'general',
          severity: issue.severity || 'minor',
          description: issue.description
        });
      });
    }
    
    if (feedback.suggestions) {
      feedback.suggestions.forEach(suggestion => {
        improvements.push({
          type: 'suggestion',
          severity: 'info',
          description: suggestion
        });
      });
    }
    
    return improvements;
  }

  /**
   * Extract knowledge shared in review
   */
  extractKnowledgeShared(feedback) {
    const knowledge = [];
    
    // Extract patterns mentioned
    if (feedback.patterns) {
      knowledge.push(...feedback.patterns.map(p => ({
        type: 'pattern',
        content: p
      })));
    }
    
    // Extract best practices
    if (feedback.bestPractices) {
      knowledge.push(...feedback.bestPractices.map(bp => ({
        type: 'best-practice',
        content: bp
      })));
    }
    
    // Extract learning points
    if (feedback.learnings) {
      knowledge.push(...feedback.learnings.map(l => ({
        type: 'learning',
        content: l
      })));
    }
    
    return knowledge;
  }

  /**
   * Record knowledge exchange between specialists
   */
  recordKnowledgeExchange(session, feedback) {
    const exchange = {
      sessionId: session.id,
      from: feedback.reviewerId,
      to: session.requesterId,
      knowledge: feedback.knowledgeShared,
      timestamp: Date.now()
    };
    
    if (!this.knowledgeExchange.has(session.requesterId)) {
      this.knowledgeExchange.set(session.requesterId, []);
    }
    
    this.knowledgeExchange.get(session.requesterId).push(exchange);
    
    // Also track for the reviewer (they learn from reviewing)
    if (!this.knowledgeExchange.has(feedback.reviewerId)) {
      this.knowledgeExchange.set(feedback.reviewerId, []);
    }
    
    this.knowledgeExchange.get(feedback.reviewerId).push({
      ...exchange,
      from: session.requesterId,
      to: feedback.reviewerId,
      type: 'review-learning'
    });
  }

  /**
   * Check if review session is complete
   */
  async checkSessionCompletion(session) {
    const completedReviews = session.reviewers.filter(
      r => r.status === 'completed'
    ).length;
    
    const minRequired = session.urgency === 'critical' ? 2 : 1;
    
    if (completedReviews >= minRequired) {
      session.status = 'completed';
      session.completedAt = Date.now();
      session.duration = session.completedAt - session.startTime;
      
      // Calculate consensus
      session.consensus = this.calculateSessionConsensus(session.feedback);
      
      // Notify completion
      const channelName = `review-${session.id}`;
      this.realtimeManager.monitor.emitter.sendToChannel(channelName, {
        type: 'session:completed',
        consensus: session.consensus,
        duration: session.duration
      });
      
      return true;
    }
    
    return false;
  }

  /**
   * Calculate session consensus
   */
  calculateSessionConsensus(feedback) {
    if (feedback.length === 0) {return null;}
    
    const approvals = feedback.filter(f => f.approved).length;
    const totalIssues = feedback.reduce((sum, f) => 
      sum + (f.improvements?.length || 0), 0
    );
    const knowledgeShared = feedback.reduce((sum, f) => 
      sum + (f.knowledgeShared?.length || 0), 0
    );
    
    return {
      approved: approvals === feedback.length,
      approvalRate: approvals / feedback.length,
      totalIssues,
      knowledgeShared,
      departments: [...new Set(feedback.map(f => f.department))]
    };
  }

  /**
   * Get specialist's review history
   */
  getSpecialistReviewHistory(specialistId) {
    const history = {
      asRequester: [],
      asReviewer: []
    };
    
    this.reviewSessions.forEach(session => {
      if (session.requesterId === specialistId) {
        history.asRequester.push({
          sessionId: session.id,
          artifactType: session.artifactType,
          status: session.status,
          consensus: session.consensus
        });
      }
      
      const asReviewer = session.reviewers.find(r => r.reviewerId === specialistId);
      if (asReviewer) {
        history.asReviewer.push({
          sessionId: session.id,
          status: asReviewer.status,
          requesterId: session.requesterId
        });
      }
    });
    
    return history;
  }

  /**
   * Get knowledge exchange report
   */
  getKnowledgeExchangeReport() {
    const report = {
      totalExchanges: 0,
      byDepartment: {},
      topPatterns: [],
      topLearnings: []
    };
    
    this.knowledgeExchange.forEach((exchanges, specialistId) => {
      report.totalExchanges += exchanges.length;
      
      const profile = this.specialistProfiles[specialistId];
      if (profile) {
        if (!report.byDepartment[profile.department]) {
          report.byDepartment[profile.department] = 0;
        }
        report.byDepartment[profile.department] += exchanges.length;
      }
    });
    
    return report;
  }
}

module.exports = SpecialistPeerReview;