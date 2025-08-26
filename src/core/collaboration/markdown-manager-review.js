/**
 * BUMBA Markdown Manager Review Workflow
 * Enables department managers to review, validate, and approve collaborative documents
 */

const MarkdownMergeEngine = require('./markdown-merge-engine');
const { RealtimeCoordinationManager } = require('./realtime-coordination-hooks');

class MarkdownManagerReview {
  constructor() {
    this.mergeEngine = new MarkdownMergeEngine();
    this.realtimeManager = RealtimeCoordinationManager.getInstance();
    this.reviews = new Map();
    this.approvals = new Map();
  }

  /**
   * Submit document for manager review
   */
  async submitForReview(document, mergedContent, conflicts) {
    const reviewId = `review-${Date.now()}`;
    
    const review = {
      id: reviewId,
      documentId: document.id,
      title: document.title,
      content: mergedContent,
      conflicts,
      departments: document.departments,
      status: 'pending',
      reviews: new Map(),
      feedback: [],
      startTime: Date.now()
    };
    
    this.reviews.set(reviewId, review);
    
    // Notify managers for review
    await this.notifyManagers(review);
    
    // Start review tracking
    this.trackReviewProgress(review);
    
    return reviewId;
  }

  /**
   * Notify department managers for review
   */
  async notifyManagers(review) {
    const notifications = review.departments.map(dept => ({
      department: dept,
      managerId: `${dept}-manager`,
      reviewId: review.id,
      documentTitle: review.title,
      conflictCount: review.conflicts.length,
      sections: this.getManagerSections(review.content, dept)
    }));
    
    notifications.forEach(notification => {
      this.realtimeManager.monitor.emitter.emit('review:requested', notification);
      
      // Initialize review entry
      review.reviews.set(notification.department, {
        managerId: notification.managerId,
        status: 'pending',
        startTime: Date.now()
      });
    });
    
    return notifications;
  }

  /**
   * Get sections relevant to a specific manager
   */
  getManagerSections(content, department) {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = null;
    
    lines.forEach(line => {
      if (line.startsWith('##')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.replace(/^#+\s*/, ''),
          content: [],
          hasDepartmentContent: false
        };
      } else if (currentSection) {
        currentSection.content.push(line);
        if (line.toLowerCase().includes(department)) {
          currentSection.hasDepartmentContent = true;
        }
      }
    });
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    // Return sections that mention the department or are relevant
    return sections.filter(s => 
      s.hasDepartmentContent || this.isRelevantToManager(s.title, department)
    );
  }

  /**
   * Check if section is relevant to manager
   */
  isRelevantToManager(sectionTitle, department) {
    const relevance = {
      'product': ['overview', 'requirements', 'goals', 'metrics', 'timeline'],
      'design': ['ui', 'ux', 'design', 'component', 'user experience', 'accessibility'],
      'backend': ['api', 'architecture', 'technical', 'security', 'deployment', 'implementation']
    };
    
    const keywords = relevance[department] || [];
    const titleLower = sectionTitle.toLowerCase();
    
    return keywords.some(keyword => titleLower.includes(keyword));
  }

  /**
   * Submit manager review
   */
  async submitReview(reviewId, managerId, decision) {
    const review = this.reviews.get(reviewId);
    if (!review) {return false;}
    
    const department = managerId.replace('-manager', '');
    const managerReview = review.reviews.get(department);
    
    if (!managerReview) {return false;}
    
    // Update review
    managerReview.status = decision.approved ? 'approved' : 'rejected';
    managerReview.decision = decision;
    managerReview.completedTime = Date.now();
    managerReview.duration = managerReview.completedTime - managerReview.startTime;
    
    // Add feedback
    if (decision.feedback) {
      review.feedback.push({
        department,
        managerId,
        feedback: decision.feedback,
        suggestions: decision.suggestions || [],
        requiredChanges: decision.requiredChanges || [],
        timestamp: Date.now()
      });
    }
    
    // Broadcast review update
    this.realtimeManager.monitor.emitter.emit('review:submitted', {
      reviewId,
      department,
      approved: decision.approved,
      hasChangesRequired: decision.requiredChanges?.length > 0
    });
    
    // Check if all reviews complete
    await this.checkReviewCompletion(review);
    
    return true;
  }

  /**
   * Track review progress
   */
  trackReviewProgress(review) {
    const checkInterval = setInterval(() => {
      const progress = this.calculateReviewProgress(review);
      
      this.realtimeManager.monitor.emitter.emit('review:progress', {
        reviewId: review.id,
        progress,
        pending: this.getPendingReviews(review),
        completed: this.getCompletedReviews(review)
      });
      
      if (progress === 100) {
        clearInterval(checkInterval);
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Calculate review progress
   */
  calculateReviewProgress(review) {
    const total = review.departments.length;
    const completed = Array.from(review.reviews.values())
      .filter(r => r.status !== 'pending').length;
    
    return Math.round((completed / total) * 100);
  }

  /**
   * Get pending reviews
   */
  getPendingReviews(review) {
    return Array.from(review.reviews.entries())
      .filter(([dept, r]) => r.status === 'pending')
      .map(([dept]) => dept);
  }

  /**
   * Get completed reviews
   */
  getCompletedReviews(review) {
    return Array.from(review.reviews.entries())
      .filter(([dept, r]) => r.status !== 'pending')
      .map(([dept, r]) => ({
        department: dept,
        status: r.status,
        duration: r.duration
      }));
  }

  /**
   * Check if all reviews are complete
   */
  async checkReviewCompletion(review) {
    const allComplete = Array.from(review.reviews.values())
      .every(r => r.status !== 'pending');
    
    if (allComplete) {
      review.status = 'complete';
      review.completedTime = Date.now();
      review.totalDuration = review.completedTime - review.startTime;
      
      // Determine final approval
      const allApproved = Array.from(review.reviews.values())
        .every(r => r.status === 'approved');
      
      review.finalDecision = allApproved ? 'approved' : 'requires-changes';
      
      // Process final decision
      await this.processFinalDecision(review);
    }
  }

  /**
   * Process final review decision
   */
  async processFinalDecision(review) {
    if (review.finalDecision === 'approved') {
      // Document approved
      this.approvals.set(review.documentId, {
        reviewId: review.id,
        approvedAt: Date.now(),
        approvers: Array.from(review.reviews.entries())
          .filter(([dept, r]) => r.status === 'approved')
          .map(([dept]) => dept)
      });
      
      this.realtimeManager.monitor.emitter.emit('document:approved', {
        documentId: review.documentId,
        reviewId: review.id,
        title: review.title
      });
      
      // Finalize document
      return await this.finalizeDocument(review);
      
    } else {
      // Changes required
      const changes = this.consolidateRequiredChanges(review);
      
      this.realtimeManager.monitor.emitter.emit('document:changes-required', {
        documentId: review.documentId,
        reviewId: review.id,
        changes
      });
      
      return await this.requestRevisions(review, changes);
    }
  }

  /**
   * Consolidate required changes from all managers
   */
  consolidateRequiredChanges(review) {
    const changes = [];
    
    review.feedback.forEach(feedback => {
      if (feedback.requiredChanges && feedback.requiredChanges.length > 0) {
        changes.push({
          department: feedback.department,
          changes: feedback.requiredChanges,
          suggestions: feedback.suggestions
        });
      }
    });
    
    return changes;
  }

  /**
   * Request document revisions
   */
  async requestRevisions(review, changes) {
    return {
      status: 'revisions-needed',
      documentId: review.documentId,
      reviewId: review.id,
      changes,
      feedback: review.feedback,
      nextSteps: 'Revise document based on feedback and resubmit for review'
    };
  }

  /**
   * Finalize approved document
   */
  async finalizeDocument(review) {
    const finalDocument = {
      id: review.documentId,
      title: review.title,
      content: review.content,
      status: 'finalized',
      approvedBy: Array.from(review.reviews.keys()),
      approvalDate: Date.now(),
      reviewDuration: review.totalDuration,
      metadata: {
        reviewId: review.id,
        conflicts: review.conflicts,
        feedbackCount: review.feedback.length
      }
    };
    
    // Add approval stamp to content
    const stampedContent = this.addApprovalStamp(
      review.content,
      finalDocument.approvedBy,
      finalDocument.approvalDate
    );
    
    finalDocument.content = stampedContent;
    
    return finalDocument;
  }

  /**
   * Add approval stamp to document
   */
  addApprovalStamp(content, approvers, date) {
    const stamp = [
      '\n---\n',
      '## Document Approval\n',
      '**Status**: 🏁 Approved\n',
      `**Date**: ${new Date(date).toISOString()}\n`,
      `**Approved by**: ${approvers.join(', ')}\n`,
      '\n*This document has been reviewed and approved by all department managers.*\n'
    ].join('');
    
    return content + stamp;
  }

  /**
   * Get review status
   */
  getReviewStatus(reviewId) {
    const review = this.reviews.get(reviewId);
    if (!review) {return null;}
    
    return {
      id: review.id,
      documentId: review.documentId,
      title: review.title,
      status: review.status,
      progress: this.calculateReviewProgress(review),
      departments: Array.from(review.reviews.entries()).map(([dept, r]) => ({
        department: dept,
        duration: r.duration || (Date.now() - r.startTime)
      })),
      feedbackCount: review.feedback.length,
      finalDecision: review.finalDecision || 'pending'
    };
  }

  /**
   * Get all pending reviews
   */
  getAllPendingReviews() {
    return Array.from(this.reviews.values())
      .filter(r => r.status === 'pending')
      .map(r => ({
        id: r.id,
        documentId: r.documentId,
        title: r.title,
        progress: this.calculateReviewProgress(r),
        waitingFor: this.getPendingReviews(r)
      }));
  }
}

module.exports = MarkdownManagerReview;