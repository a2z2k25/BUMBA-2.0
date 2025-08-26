/**
 * BUMBA Peer Review Protocol
 * Enables specialist-to-specialist code reviews across departments
 * Promotes knowledge sharing and quality improvement
 */

class PeerReviewProtocol {
  constructor() {
    this.reviewTypes = {
      'code': { minReviewers: 2, maxReviewers: 3, timeLimit: 3600000 },
      'architecture': { minReviewers: 3, maxReviewers: 5, timeLimit: 7200000 },
      'security': { minReviewers: 2, maxReviewers: 4, timeLimit: 5400000 },
      'performance': { minReviewers: 2, maxReviewers: 3, timeLimit: 3600000 },
      'design': { minReviewers: 2, maxReviewers: 4, timeLimit: 5400000 },
      'documentation': { minReviewers: 1, maxReviewers: 3, timeLimit: 1800000 }
    };
    
    this.specialistExpertise = this.initializeExpertiseMap();
    this.reviewQueue = [];
    this.activeReviews = new Map();
    this.completedReviews = new Map();
    this.reviewerLoad = new Map();
  }

  /**
   * Initialize specialist expertise mapping
   */
  initializeExpertiseMap() {
    return {
      // Backend specialists
      'api-architect': ['architecture', 'api', 'performance', 'security'],
      'database-specialist': ['database', 'performance', 'architecture'],
      'security-specialist': ['security', 'authentication', 'encryption'],
      'devops-specialist': ['deployment', 'infrastructure', 'monitoring'],
      'performance-specialist': ['performance', 'optimization', 'caching'],
      
      // Frontend specialists
      'react-specialist': ['react', 'components', 'state-management'],
      'ui-architect': ['architecture', 'components', 'patterns'],
      'css-specialist': ['styling', 'animations', 'responsive'],
      'accessibility-specialist': ['accessibility', 'usability', 'standards'],
      
      // Design specialists
      'ux-specialist': ['user-experience', 'usability', 'workflows'],
      'visual-designer': ['visual-design', 'branding', 'aesthetics'],
      'interaction-designer': ['interactions', 'animations', 'micro-interactions'],
      
      // Product specialists
      'product-analyst': ['requirements', 'metrics', 'analytics'],
      'business-analyst': ['business-logic', 'workflows', 'processes'],
      'technical-writer': ['documentation', 'api-docs', 'guides']
    };
  }

  /**
   * Create a peer review request
   */
  createReviewRequest(config) {
    const {
      authorId,
      authorDepartment,
      artifactType, // code, document, design, architecture
      artifact,
      reviewType,
      priority = 'normal',
      context = {}
    } = config;
    
    const reviewId = `peer-review-${Date.now()}`;
    const typeConfig = this.reviewTypes[reviewType] || this.reviewTypes.code;
    
    const review = {
      id: reviewId,
      authorId,
      authorDepartment,
      artifactType,
      artifact,
      reviewType,
      priority,
      context,
      status: 'pending',
      reviewers: [],
      feedback: [],
      createdAt: Date.now(),
      deadline: Date.now() + typeConfig.timeLimit,
      minReviewers: typeConfig.minReviewers,
      maxReviewers: typeConfig.maxReviewers
    };
    
    // Add to queue
    this.reviewQueue.push(review);
    this.reviewQueue.sort((a, b) => {
      const priorityOrder = { 'critical': 0, 'high': 1, 'normal': 2, 'low': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    return reviewId;
  }

  /**
   * Find suitable reviewers for a review
   */
  findSuitableReviewers(review) {
    const candidates = [];
    
    // Get review topics/tags
    const topics = this.extractTopics(review);
    
    // Find specialists with matching expertise
    Object.entries(this.specialistExpertise).forEach(([specialistId, expertise]) => {
      // Skip if same department (for cross-department reviews)
      if (this.isSameDepartment(specialistId, review.authorDepartment)) {
        return;
      }
      
      // Calculate expertise match score
      const matchScore = this.calculateExpertiseMatch(expertise, topics);
      
      // Check reviewer availability
      const load = this.reviewerLoad.get(specialistId) || 0;
      const availability = this.calculateAvailability(load);
      
      if (matchScore > 0) {
        candidates.push({
          specialistId,
          matchScore,
          availability,
          load,
          expertise,
          score: matchScore * availability
        });
      }
    });
    
    // Sort by score and return top candidates
    candidates.sort((a, b) => b.score - a.score);
    
    return candidates.slice(0, review.maxReviewers);
  }

  /**
   * Extract topics from review artifact
   */
  extractTopics(review) {
    const topics = new Set();
    
    // Add review type as topic
    topics.add(review.reviewType);
    
    // Extract from context
    if (review.context.tags) {
      review.context.tags.forEach(tag => topics.add(tag));
    }
    
    // Extract from artifact content (simplified)
    if (typeof review.artifact === 'string') {
      // Look for common keywords
      const keywords = [
        'api', 'database', 'security', 'performance',
        'react', 'component', 'styling', 'accessibility',
        'user-experience', 'design', 'documentation'
      ];
      
      keywords.forEach(keyword => {
        if (review.artifact.toLowerCase().includes(keyword)) {
          topics.add(keyword);
        }
      });
    }
    
    return Array.from(topics);
  }

  /**
   * Calculate expertise match score
   */
  calculateExpertiseMatch(expertise, topics) {
    let matches = 0;
    topics.forEach(topic => {
      if (expertise.some(exp => exp.includes(topic) || topic.includes(exp))) {
        matches++;
      }
    });
    
    return matches / Math.max(topics.length, 1);
  }

  /**
   * Calculate reviewer availability
   */
  calculateAvailability(currentLoad) {
    // Availability decreases with load
    const maxLoad = 5;
    return Math.max(0, 1 - (currentLoad / maxLoad));
  }

  /**
   * Check if specialist is from same department
   */
  isSameDepartment(specialistId, department) {
    const departmentMap = {
      'backend': ['api-architect', 'database-specialist', 'security-specialist', 'devops-specialist', 'performance-specialist'],
      'design': ['ux-specialist', 'visual-designer', 'interaction-designer', 'css-specialist', 'accessibility-specialist'],
      'product': ['product-analyst', 'business-analyst', 'technical-writer']
    };
    
    const specialistDept = Object.entries(departmentMap)
      .find(([dept, specialists]) => specialists.includes(specialistId))?.[0];
    
    return specialistDept === department;
  }

  /**
   * Assign reviewers to a review
   */
  assignReviewers(reviewId, reviewerIds) {
    const review = this.findReview(reviewId);
    if (!review) {return false;}
    
    review.reviewers = reviewerIds.map(id => ({
      specialistId: id,
      status: 'assigned',
      assignedAt: Date.now()
    }));
    
    // Update reviewer load
    reviewerIds.forEach(id => {
      const currentLoad = this.reviewerLoad.get(id) || 0;
      this.reviewerLoad.set(id, currentLoad + 1);
    });
    
    // Move to active reviews
    this.activeReviews.set(reviewId, review);
    this.reviewQueue = this.reviewQueue.filter(r => r.id !== reviewId);
    
    review.status = 'in-progress';
    
    return true;
  }

  /**
   * Submit review feedback
   */
  submitReviewFeedback(reviewId, reviewerId, feedback) {
    const review = this.activeReviews.get(reviewId);
    if (!review) {return false;}
    
    const reviewer = review.reviewers.find(r => r.specialistId === reviewerId);
    if (!reviewer) {return false;}
    
    // Update reviewer status
    reviewer.status = 'completed';
    reviewer.completedAt = Date.now();
    reviewer.duration = reviewer.completedAt - reviewer.assignedAt;
    
    // Add feedback
    review.feedback.push({
      reviewerId,
      timestamp: Date.now(),
      ...feedback
    });
    
    // Update reviewer load
    const currentLoad = this.reviewerLoad.get(reviewerId) || 1;
    this.reviewerLoad.set(reviewerId, Math.max(0, currentLoad - 1));
    
    // Check if review is complete
    this.checkReviewCompletion(review);
    
    return true;
  }

  /**
   * Check if review is complete
   */
  checkReviewCompletion(review) {
    const completedReviewers = review.reviewers.filter(r => r.status === 'completed');
    
    if (completedReviewers.length >= review.minReviewers) {
      review.status = 'completed';
      review.completedAt = Date.now();
      review.duration = review.completedAt - review.createdAt;
      
      // Move to completed reviews
      this.completedReviews.set(review.id, review);
      this.activeReviews.delete(review.id);
      
      // Calculate consensus
      review.consensus = this.calculateConsensus(review.feedback);
      
      return true;
    }
    
    return false;
  }

  /**
   * Calculate consensus from feedback
   */
  calculateConsensus(feedback) {
    if (feedback.length === 0) {return null;}
    
    // Aggregate approval status
    const approvals = feedback.filter(f => f.approved).length;
    const rejections = feedback.filter(f => !f.approved).length;
    
    // Aggregate severity of issues
    const issues = feedback.flatMap(f => f.issues || []);
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const majorIssues = issues.filter(i => i.severity === 'major').length;
    const minorIssues = issues.filter(i => i.severity === 'minor').length;
    
    // Calculate consensus score
    const approvalRate = approvals / feedback.length;
    const hasBlockingIssues = criticalIssues > 0;
    
    return {
      approved: approvalRate > 0.5 && !hasBlockingIssues,
      approvalRate,
      issues: {
        critical: criticalIssues,
        major: majorIssues,
        minor: minorIssues,
        total: issues.length
      },
      recommendations: this.extractRecommendations(feedback)
    };
  }

  /**
   * Extract common recommendations
   */
  extractRecommendations(feedback) {
    const allRecommendations = feedback.flatMap(f => f.recommendations || []);
    
    // Group by similarity
    const grouped = [];
    allRecommendations.forEach(rec => {
      const similar = grouped.find(g => 
        this.areSimilarRecommendations(g[0], rec)
      );
      
      if (similar) {
        similar.push(rec);
      } else {
        grouped.push([rec]);
      }
    });
    
    // Return most common recommendations
    return grouped
      .sort((a, b) => b.length - a.length)
      .slice(0, 5)
      .map(group => ({
        recommendation: group[0],
        frequency: group.length
      }));
  }

  /**
   * Check if two recommendations are similar
   */
  areSimilarRecommendations(rec1, rec2) {
    if (typeof rec1 !== 'string' || typeof rec2 !== 'string') {return false;}
    
    const words1 = rec1.toLowerCase().split(/\s+/);
    const words2 = rec2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(w => words2.includes(w));
    const similarity = commonWords.length / Math.max(words1.length, words2.length);
    
    return similarity > 0.6;
  }

  /**
   * Find a review by ID
   */
  findReview(reviewId) {
    return this.reviewQueue.find(r => r.id === reviewId) ||
           this.activeReviews.get(reviewId) ||
           this.completedReviews.get(reviewId);
  }

  /**
   * Get review statistics
   */
  getStatistics() {
    return {
      pending: this.reviewQueue.length,
      active: this.activeReviews.size,
      completed: this.completedReviews.size,
      averageCompletionTime: this.calculateAverageCompletionTime(),
      reviewerStats: this.getReviewerStatistics(),
      consensusRate: this.calculateConsensusRate()
    };
  }

  /**
   * Calculate average completion time
   */
  calculateAverageCompletionTime() {
    const completed = Array.from(this.completedReviews.values());
    if (completed.length === 0) {return 0;}
    
    const totalTime = completed.reduce((sum, r) => sum + r.duration, 0);
    return Math.round(totalTime / completed.length);
  }

  /**
   * Get reviewer statistics
   */
  getReviewerStatistics() {
    const stats = new Map();
    
    this.completedReviews.forEach(review => {
      review.reviewers.forEach(reviewer => {
        if (reviewer.status === 'completed') {
          const current = stats.get(reviewer.specialistId) || {
            reviews: 0,
            totalTime: 0,
            averageTime: 0
          };
          
          current.reviews++;
          current.totalTime += reviewer.duration;
          current.averageTime = Math.round(current.totalTime / current.reviews);
          
          stats.set(reviewer.specialistId, current);
        }
      });
    });
    
    return Object.fromEntries(stats);
  }

  /**
   * Calculate consensus rate
   */
  calculateConsensusRate() {
    const completed = Array.from(this.completedReviews.values());
    if (completed.length === 0) {return 0;}
    
    const withConsensus = completed.filter(r => r.consensus?.approved).length;
    return withConsensus / completed.length;
  }
}

module.exports = PeerReviewProtocol;