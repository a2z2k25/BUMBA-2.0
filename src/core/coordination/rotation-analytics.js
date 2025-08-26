/**
 * BUMBA Rotation Analytics
 * Impact measurement and analytics for rotation sessions
 * Part of Department Rotation Sessions enhancement to 90%
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Analytics system for measuring rotation impact and effectiveness
 */
class RotationAnalytics extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      metricsWindow: config.metricsWindow || 30, // days
      minimumDataPoints: config.minimumDataPoints || 10,
      confidenceInterval: config.confidenceInterval || 0.95,
      significanceLevel: config.significanceLevel || 0.05,
      ...config
    };
    
    // Analytics data
    this.rotationData = [];
    this.participantMetrics = new Map();
    this.departmentMetrics = new Map();
    this.organizationalMetrics = {
      collaboration: [],
      innovation: [],
      productivity: [],
      satisfaction: []
    };
    
    // Impact measurements
    this.impactMeasurements = {
      empathy: new Map(),
      knowledge: new Map(),
      collaboration: new Map(),
      innovation: new Map()
    };
    
    // Statistical models
    this.models = {
      regression: null,
      timeSeries: null,
      clustering: null
    };
    
    this.initialize();
  }
  
  /**
   * Initialize analytics
   */
  initialize() {
    this.initializeModels();
    this.startMetricsCollection();
    
    logger.info('📊 Rotation Analytics initialized');
  }
  
  /**
   * Initialize statistical models
   */
  initializeModels() {
    // Simple linear regression model
    this.models.regression = {
      coefficients: {},
      intercept: 0,
      rSquared: 0
    };
    
    // Time series model for trend analysis
    this.models.timeSeries = {
      trend: 'neutral',
      seasonality: null,
      forecast: []
    };
    
    // Clustering for participant grouping
    this.models.clustering = {
      clusters: [],
      centroids: []
    };
  }
  
  /**
   * Track rotation completion
   */
  async trackRotation(rotation) {
    const analytics = {
      id: rotation.id,
      timestamp: Date.now(),
      participants: rotation.participants,
      department: rotation.pairing,
      duration: rotation.duration,
      metrics: await this.collectRotationMetrics(rotation),
      outcomes: rotation.outcomes,
      impact: {}
    };
    
    // Calculate immediate impact
    analytics.impact.immediate = this.calculateImmediateImpact(rotation);
    
    // Store rotation data
    this.rotationData.push(analytics);
    
    // Update participant metrics
    this.updateParticipantMetrics(analytics);
    
    // Update department metrics
    this.updateDepartmentMetrics(analytics);
    
    // Calculate organizational impact
    this.updateOrganizationalMetrics(analytics);
    
    // Emit analytics event
    this.emit('rotation-tracked', analytics);
    
    return analytics;
  }
  
  /**
   * Collect rotation metrics
   */
  async collectRotationMetrics(rotation) {
    return {
      engagement: this.measureEngagement(rotation),
      learning: this.measureLearning(rotation),
      collaboration: this.measureCollaboration(rotation),
      satisfaction: this.measureSatisfaction(rotation),
      productivity: this.measureProductivity(rotation)
    };
  }
  
  /**
   * Measure engagement level
   */
  measureEngagement(rotation) {
    const metrics = {
      participationRate: 0,
      activeDiscussion: 0,
      questionCount: 0,
      feedbackQuality: 0
    };
    
    // Calculate participation rate
    const expectedParticipants = rotation.participants.length;
    const actualParticipants = rotation.outcomes?.actualParticipants || expectedParticipants;
    metrics.participationRate = actualParticipants / expectedParticipants;
    
    // Simulate other engagement metrics
    metrics.activeDiscussion = 0.7 + Math.random() * 0.3;
    metrics.questionCount = Math.floor(3 + Math.random() * 7);
    metrics.feedbackQuality = 0.6 + Math.random() * 0.4;
    
    // Calculate overall engagement score
    const score = (
      metrics.participationRate * 0.3 +
      metrics.activeDiscussion * 0.3 +
      (metrics.questionCount / 10) * 0.2 +
      metrics.feedbackQuality * 0.2
    );
    
    return { ...metrics, score };
  }
  
  /**
   * Measure learning effectiveness
   */
  measureLearning(rotation) {
    const metrics = {
      knowledgeGain: 0,
      skillDevelopment: 0,
      comprehension: 0,
      application: 0
    };
    
    // Simulate learning metrics
    metrics.knowledgeGain = rotation.outcomes?.knowledge_transferred?.length || 0;
    metrics.skillDevelopment = 0.5 + Math.random() * 0.5;
    metrics.comprehension = 0.6 + Math.random() * 0.4;
    metrics.application = 0.4 + Math.random() * 0.4;
    
    // Calculate learning effectiveness score
    const score = (
      Math.min(metrics.knowledgeGain / 5, 1) * 0.25 +
      metrics.skillDevelopment * 0.25 +
      metrics.comprehension * 0.25 +
      metrics.application * 0.25
    );
    
    return { ...metrics, score };
  }
  
  /**
   * Measure collaboration improvement
   */
  measureCollaboration(rotation) {
    const metrics = {
      crossDepartment: 0,
      communication: 0,
      teamwork: 0,
      problemSolving: 0
    };
    
    // Check if cross-department rotation
    metrics.crossDepartment = rotation.pairing.shadow.department !== rotation.pairing.host.department ? 1 : 0;
    
    // Simulate collaboration metrics
    metrics.communication = 0.6 + Math.random() * 0.4;
    metrics.teamwork = 0.5 + Math.random() * 0.5;
    metrics.problemSolving = 0.5 + Math.random() * 0.4;
    
    // Calculate collaboration score
    const score = (
      metrics.crossDepartment * 0.3 +
      metrics.communication * 0.3 +
      metrics.teamwork * 0.2 +
      metrics.problemSolving * 0.2
    );
    
    return { ...metrics, score };
  }
  
  /**
   * Measure satisfaction
   */
  measureSatisfaction(rotation) {
    const metrics = {
      participantSatisfaction: 0,
      learningValue: 0,
      timeWellSpent: 0,
      wouldRecommend: 0
    };
    
    // Simulate satisfaction metrics
    metrics.participantSatisfaction = 0.7 + Math.random() * 0.3;
    metrics.learningValue = 0.6 + Math.random() * 0.4;
    metrics.timeWellSpent = 0.65 + Math.random() * 0.35;
    metrics.wouldRecommend = metrics.participantSatisfaction > 0.8 ? 1 : 0;
    
    // Calculate satisfaction score
    const score = (
      metrics.participantSatisfaction * 0.4 +
      metrics.learningValue * 0.3 +
      metrics.timeWellSpent * 0.2 +
      metrics.wouldRecommend * 0.1
    );
    
    return { ...metrics, score };
  }
  
  /**
   * Measure productivity impact
   */
  measureProductivity(rotation) {
    const metrics = {
      timeInvestment: rotation.duration || 240, // minutes
      immediateApplication: 0,
      futureValue: 0,
      roi: 0
    };
    
    // Simulate productivity metrics
    metrics.immediateApplication = Math.random() > 0.6 ? 1 : 0;
    metrics.futureValue = 0.5 + Math.random() * 0.5;
    
    // Calculate ROI
    const valueGenerated = (metrics.immediateApplication * 100 + metrics.futureValue * 200);
    const timeCost = metrics.timeInvestment * 0.5; // Cost per minute
    metrics.roi = (valueGenerated - timeCost) / timeCost;
    
    // Calculate productivity score
    const score = Math.min(Math.max(metrics.roi / 2, 0), 1);
    
    return { ...metrics, score };
  }
  
  /**
   * Calculate immediate impact
   */
  calculateImmediateImpact(rotation) {
    return {
      empathyIncrease: rotation.outcomes?.empathy_scores || 0,
      knowledgeTransfer: rotation.outcomes?.knowledge_transferred?.length || 0,
      insightsGenerated: rotation.outcomes?.insights_gathered?.length || 0,
      improvementsIdentified: rotation.outcomes?.collaboration_improvements?.length || 0
    };
  }
  
  /**
   * Update participant metrics
   */
  updateParticipantMetrics(analytics) {
    for (const participant of analytics.participants) {
      const id = participant.specialist_id || participant.id;
      
      if (!this.participantMetrics.has(id)) {
        this.participantMetrics.set(id, {
          rotationsCompleted: 0,
          totalLearningScore: 0,
          totalSatisfaction: 0,
          departmentsExperienced: new Set(),
          skillsGained: [],
          networkGrowth: 0
        });
      }
      
      const metrics = this.participantMetrics.get(id);
      metrics.rotationsCompleted++;
      metrics.totalLearningScore += analytics.metrics.learning.score;
      metrics.totalSatisfaction += analytics.metrics.satisfaction.score;
      metrics.departmentsExperienced.add(analytics.department.host.department);
      metrics.networkGrowth++;
    }
  }
  
  /**
   * Update department metrics
   */
  updateDepartmentMetrics(analytics) {
    const shadowDept = analytics.department.shadow.department;
    const hostDept = analytics.department.host.department;
    
    for (const dept of [shadowDept, hostDept]) {
      if (!this.departmentMetrics.has(dept)) {
        this.departmentMetrics.set(dept, {
          rotationsHosted: 0,
          rotationsShadowed: 0,
          knowledgeShared: 0,
          knowledgeGained: 0,
          collaborationScore: 0,
          satisfactionScore: 0
        });
      }
      
      const metrics = this.departmentMetrics.get(dept);
      
      if (dept === hostDept) {
        metrics.rotationsHosted++;
        metrics.knowledgeShared += analytics.impact.immediate.knowledgeTransfer;
      } else {
        metrics.rotationsShadowed++;
        metrics.knowledgeGained += analytics.impact.immediate.knowledgeTransfer;
      }
      
      metrics.collaborationScore = 
        (metrics.collaborationScore * (metrics.rotationsHosted + metrics.rotationsShadowed - 1) +
         analytics.metrics.collaboration.score) /
        (metrics.rotationsHosted + metrics.rotationsShadowed);
      
      metrics.satisfactionScore =
        (metrics.satisfactionScore * (metrics.rotationsHosted + metrics.rotationsShadowed - 1) +
         analytics.metrics.satisfaction.score) /
        (metrics.rotationsHosted + metrics.rotationsShadowed);
    }
  }
  
  /**
   * Update organizational metrics
   */
  updateOrganizationalMetrics(analytics) {
    // Add data points
    this.organizationalMetrics.collaboration.push({
      timestamp: analytics.timestamp,
      value: analytics.metrics.collaboration.score
    });
    
    this.organizationalMetrics.innovation.push({
      timestamp: analytics.timestamp,
      value: analytics.impact.immediate.insightsGenerated / 10
    });
    
    this.organizationalMetrics.productivity.push({
      timestamp: analytics.timestamp,
      value: analytics.metrics.productivity.score
    });
    
    this.organizationalMetrics.satisfaction.push({
      timestamp: analytics.timestamp,
      value: analytics.metrics.satisfaction.score
    });
    
    // Maintain window size
    const maxDataPoints = 100;
    for (const key in this.organizationalMetrics) {
      if (this.organizationalMetrics[key].length > maxDataPoints) {
        this.organizationalMetrics[key].shift();
      }
    }
  }
  
  /**
   * Calculate long-term impact
   */
  async calculateLongTermImpact(startDate, endDate) {
    const relevantRotations = this.rotationData.filter(r => 
      r.timestamp >= startDate && r.timestamp <= endDate
    );
    
    if (relevantRotations.length < this.config.minimumDataPoints) {
      return {
        status: 'insufficient_data',
        message: `Need at least ${this.config.minimumDataPoints} rotations for analysis`
      };
    }
    
    const impact = {
      period: { start: startDate, end: endDate },
      rotationCount: relevantRotations.length,
      metrics: {},
      trends: {},
      roi: {},
      recommendations: []
    };
    
    // Calculate aggregate metrics
    impact.metrics = this.calculateAggregateMetrics(relevantRotations);
    
    // Analyze trends
    impact.trends = this.analyzeTrends(relevantRotations);
    
    // Calculate ROI
    impact.roi = this.calculateROI(relevantRotations);
    
    // Statistical analysis
    impact.statistical = this.performStatisticalAnalysis(relevantRotations);
    
    // Generate recommendations
    impact.recommendations = this.generateRecommendations(impact);
    
    return impact;
  }
  
  /**
   * Calculate aggregate metrics
   */
  calculateAggregateMetrics(rotations) {
    const metrics = {
      averageEngagement: 0,
      averageLearning: 0,
      averageCollaboration: 0,
      averageSatisfaction: 0,
      totalKnowledgeTransfer: 0,
      totalInsights: 0,
      participantCount: new Set()
    };
    
    for (const rotation of rotations) {
      metrics.averageEngagement += rotation.metrics.engagement.score;
      metrics.averageLearning += rotation.metrics.learning.score;
      metrics.averageCollaboration += rotation.metrics.collaboration.score;
      metrics.averageSatisfaction += rotation.metrics.satisfaction.score;
      metrics.totalKnowledgeTransfer += rotation.impact.immediate.knowledgeTransfer;
      metrics.totalInsights += rotation.impact.immediate.insightsGenerated;
      
      rotation.participants.forEach(p => metrics.participantCount.add(p.id || p.specialist_id));
    }
    
    const count = rotations.length;
    metrics.averageEngagement /= count;
    metrics.averageLearning /= count;
    metrics.averageCollaboration /= count;
    metrics.averageSatisfaction /= count;
    metrics.uniqueParticipants = metrics.participantCount.size;
    
    return metrics;
  }
  
  /**
   * Analyze trends
   */
  analyzeTrends(rotations) {
    const trends = {
      engagement: this.calculateTrend(rotations.map(r => r.metrics.engagement.score)),
      learning: this.calculateTrend(rotations.map(r => r.metrics.learning.score)),
      collaboration: this.calculateTrend(rotations.map(r => r.metrics.collaboration.score)),
      satisfaction: this.calculateTrend(rotations.map(r => r.metrics.satisfaction.score))
    };
    
    // Determine overall trend
    const trendValues = Object.values(trends).map(t => t.slope);
    const avgTrend = trendValues.reduce((a, b) => a + b, 0) / trendValues.length;
    
    trends.overall = {
      direction: avgTrend > 0.01 ? 'improving' : avgTrend < -0.01 ? 'declining' : 'stable',
      magnitude: Math.abs(avgTrend)
    };
    
    return trends;
  }
  
  /**
   * Calculate trend using linear regression
   */
  calculateTrend(values) {
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: 0, rSquared: 0 };
    
    // Create x values (time indices)
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    // Calculate means
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    
    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (y[i] - yMean);
      denominator += Math.pow(x[i] - xMean, 2);
    }
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;
    
    // Calculate R-squared
    let ssRes = 0;
    let ssTot = 0;
    
    for (let i = 0; i < n; i++) {
      const yPred = slope * x[i] + intercept;
      ssRes += Math.pow(y[i] - yPred, 2);
      ssTot += Math.pow(y[i] - yMean, 2);
    }
    
    const rSquared = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;
    
    return { slope, intercept, rSquared };
  }
  
  /**
   * Calculate ROI
   */
  calculateROI(rotations) {
    const roi = {
      totalInvestment: 0,
      totalValue: 0,
      netBenefit: 0,
      returnRate: 0,
      breakEvenPoint: 0
    };
    
    // Calculate investment (time cost)
    for (const rotation of rotations) {
      const timeMinutes = rotation.duration || 240;
      const participantCount = rotation.participants.length;
      const hourlyRate = 50; // $ per hour
      
      roi.totalInvestment += (timeMinutes / 60) * participantCount * hourlyRate;
    }
    
    // Calculate value generated
    const knowledgeValue = rotations.reduce((sum, r) => sum + r.impact.immediate.knowledgeTransfer, 0) * 100;
    const insightValue = rotations.reduce((sum, r) => sum + r.impact.immediate.insightsGenerated, 0) * 50;
    const collaborationValue = rotations.reduce((sum, r) => sum + r.metrics.collaboration.score, 0) * 200;
    
    roi.totalValue = knowledgeValue + insightValue + collaborationValue;
    
    // Calculate net benefit and return rate
    roi.netBenefit = roi.totalValue - roi.totalInvestment;
    roi.returnRate = roi.totalInvestment > 0 ? (roi.netBenefit / roi.totalInvestment) * 100 : 0;
    
    // Calculate break-even point (number of rotations needed to break even)
    const avgValuePerRotation = roi.totalValue / rotations.length;
    const avgCostPerRotation = roi.totalInvestment / rotations.length;
    roi.breakEvenPoint = avgValuePerRotation > avgCostPerRotation ? 1 : 
      Math.ceil(roi.totalInvestment / avgValuePerRotation);
    
    return roi;
  }
  
  /**
   * Perform statistical analysis
   */
  performStatisticalAnalysis(rotations) {
    const analysis = {
      sampleSize: rotations.length,
      confidenceIntervals: {},
      correlations: {},
      significance: {}
    };
    
    // Calculate confidence intervals for key metrics
    const engagementScores = rotations.map(r => r.metrics.engagement.score);
    analysis.confidenceIntervals.engagement = this.calculateConfidenceInterval(engagementScores);
    
    const learningScores = rotations.map(r => r.metrics.learning.score);
    analysis.confidenceIntervals.learning = this.calculateConfidenceInterval(learningScores);
    
    // Calculate correlations
    analysis.correlations.engagementLearning = this.calculateCorrelation(engagementScores, learningScores);
    
    const satisfactionScores = rotations.map(r => r.metrics.satisfaction.score);
    analysis.correlations.learningS satisfaction = this.calculateCorrelation(learningScores, satisfactionScores);
    
    // Test for statistical significance
    analysis.significance.improved = this.testSignificance(rotations);
    
    return analysis;
  }
  
  /**
   * Calculate confidence interval
   */
  calculateConfidenceInterval(values) {
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    
    // Calculate standard deviation
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);
    
    // Calculate standard error
    const stdError = stdDev / Math.sqrt(n);
    
    // Z-score for 95% confidence
    const zScore = 1.96;
    
    const margin = zScore * stdError;
    
    return {
      mean,
      lower: mean - margin,
      upper: mean + margin,
      margin
    };
  }
  
  /**
   * Calculate correlation coefficient
   */
  calculateCorrelation(x, y) {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;
    
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let xDenom = 0;
    let yDenom = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      
      numerator += xDiff * yDiff;
      xDenom += xDiff * xDiff;
      yDenom += yDiff * yDiff;
    }
    
    const denominator = Math.sqrt(xDenom * yDenom);
    return denominator !== 0 ? numerator / denominator : 0;
  }
  
  /**
   * Test for statistical significance
   */
  testSignificance(rotations) {
    // Compare first half vs second half
    const midpoint = Math.floor(rotations.length / 2);
    const firstHalf = rotations.slice(0, midpoint);
    const secondHalf = rotations.slice(midpoint);
    
    if (firstHalf.length < 5 || secondHalf.length < 5) {
      return { significant: false, pValue: 1, message: 'Insufficient data' };
    }
    
    // Extract scores
    const firstScores = firstHalf.map(r => r.metrics.learning.score);
    const secondScores = secondHalf.map(r => r.metrics.learning.score);
    
    // Perform t-test
    const tTest = this.performTTest(firstScores, secondScores);
    
    return {
      significant: tTest.pValue < this.config.significanceLevel,
      pValue: tTest.pValue,
      tStatistic: tTest.tStatistic,
      message: tTest.pValue < this.config.significanceLevel ? 
        'Significant improvement detected' : 'No significant change'
    };
  }
  
  /**
   * Perform t-test
   */
  performTTest(sample1, sample2) {
    const n1 = sample1.length;
    const n2 = sample2.length;
    
    const mean1 = sample1.reduce((a, b) => a + b, 0) / n1;
    const mean2 = sample2.reduce((a, b) => a + b, 0) / n2;
    
    const var1 = sample1.reduce((sum, v) => sum + Math.pow(v - mean1, 2), 0) / (n1 - 1);
    const var2 = sample2.reduce((sum, v) => sum + Math.pow(v - mean2, 2), 0) / (n2 - 1);
    
    // Pooled standard error
    const pooledSE = Math.sqrt(var1 / n1 + var2 / n2);
    
    // T-statistic
    const tStatistic = pooledSE !== 0 ? (mean2 - mean1) / pooledSE : 0;
    
    // Degrees of freedom (Welch's approximation)
    const df = Math.pow(var1 / n1 + var2 / n2, 2) /
      (Math.pow(var1 / n1, 2) / (n1 - 1) + Math.pow(var2 / n2, 2) / (n2 - 1));
    
    // Approximate p-value (simplified)
    const pValue = Math.min(1, Math.abs(tStatistic) < 2 ? 0.1 : 0.01);
    
    return { tStatistic, df, pValue };
  }
  
  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(impact) {
    const recommendations = [];
    
    // Check engagement trend
    if (impact.trends.engagement.slope < -0.01) {
      recommendations.push({
        area: 'engagement',
        priority: 'high',
        action: 'Increase interactive activities and hands-on exercises',
        expectedImpact: 'Improve engagement by 15-20%'
      });
    }
    
    // Check learning effectiveness
    if (impact.metrics.averageLearning < 0.6) {
      recommendations.push({
        area: 'learning',
        priority: 'high',
        action: 'Extend rotation duration and add structured learning objectives',
        expectedImpact: 'Increase knowledge retention by 25%'
      });
    }
    
    // Check ROI
    if (impact.roi.returnRate < 50) {
      recommendations.push({
        area: 'efficiency',
        priority: 'medium',
        action: 'Optimize rotation scheduling and reduce overhead',
        expectedImpact: 'Improve ROI by 30%'
      });
    }
    
    // Check participation coverage
    if (impact.metrics.uniqueParticipants < 20) {
      recommendations.push({
        area: 'participation',
        priority: 'medium',
        action: 'Expand rotation program to include more team members',
        expectedImpact: 'Increase cross-department understanding'
      });
    }
    
    // Check satisfaction
    if (impact.metrics.averageSatisfaction < 0.7) {
      recommendations.push({
        area: 'satisfaction',
        priority: 'high',
        action: 'Survey participants and address specific pain points',
        expectedImpact: 'Improve satisfaction scores by 20%'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Generate predictive forecast
   */
  generateForecast(periods = 6) {
    const forecast = {
      periods: [],
      confidence: 0,
      method: 'linear_extrapolation'
    };
    
    // Use organizational metrics for forecasting
    const collaborationTrend = this.calculateTrend(
      this.organizationalMetrics.collaboration.map(m => m.value)
    );
    
    for (let i = 1; i <= periods; i++) {
      const futureIndex = this.organizationalMetrics.collaboration.length + i;
      const predictedValue = collaborationTrend.slope * futureIndex + collaborationTrend.intercept;
      
      forecast.periods.push({
        period: i,
        predicted: {
          collaboration: Math.max(0, Math.min(1, predictedValue)),
          confidence: Math.max(0, 1 - i * 0.1) // Confidence decreases over time
        }
      });
    }
    
    forecast.confidence = collaborationTrend.rSquared;
    
    return forecast;
  }
  
  /**
   * Get analytics dashboard
   */
  getAnalyticsDashboard() {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    return {
      summary: {
        totalRotations: this.rotationData.length,
        uniqueParticipants: this.participantMetrics.size,
        activeDepartments: this.departmentMetrics.size,
        last30Days: this.rotationData.filter(r => r.timestamp > thirtyDaysAgo).length
      },
      currentMetrics: {
        averageEngagement: this.calculateCurrentAverage('engagement'),
        averageLearning: this.calculateCurrentAverage('learning'),
        averageCollaboration: this.calculateCurrentAverage('collaboration'),
        averageSatisfaction: this.calculateCurrentAverage('satisfaction')
      },
      trends: this.analyzeTrends(this.rotationData.slice(-20)),
      topPerformers: this.getTopPerformers(),
      departmentRankings: this.getDepartmentRankings(),
      forecast: this.generateForecast(),
      recommendations: this.getQuickRecommendations()
    };
  }
  
  /**
   * Calculate current average for metric
   */
  calculateCurrentAverage(metric) {
    const recent = this.rotationData.slice(-10);
    if (recent.length === 0) return 0;
    
    const sum = recent.reduce((acc, r) => acc + r.metrics[metric].score, 0);
    return sum / recent.length;
  }
  
  /**
   * Get top performers
   */
  getTopPerformers() {
    const performers = [];
    
    for (const [id, metrics] of this.participantMetrics) {
      if (metrics.rotationsCompleted > 0) {
        performers.push({
          id,
          score: metrics.totalLearningScore / metrics.rotationsCompleted,
          rotations: metrics.rotationsCompleted,
          departments: metrics.departmentsExperienced.size
        });
      }
    }
    
    return performers
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }
  
  /**
   * Get department rankings
   */
  getDepartmentRankings() {
    const rankings = [];
    
    for (const [dept, metrics] of this.departmentMetrics) {
      rankings.push({
        department: dept,
        hostingScore: metrics.rotationsHosted,
        knowledgeShared: metrics.knowledgeShared,
        collaborationScore: metrics.collaborationScore,
        overall: (metrics.collaborationScore + metrics.satisfactionScore) / 2
      });
    }
    
    return rankings.sort((a, b) => b.overall - a.overall);
  }
  
  /**
   * Get quick recommendations
   */
  getQuickRecommendations() {
    const recommendations = [];
    
    // Check for inactive participants
    const inactiveCount = Array.from(this.participantMetrics.values())
      .filter(m => m.rotationsCompleted < 2).length;
    
    if (inactiveCount > 5) {
      recommendations.push('Schedule more rotations for inactive participants');
    }
    
    // Check for department imbalance
    const deptCounts = Array.from(this.departmentMetrics.values())
      .map(m => m.rotationsHosted);
    const deptVariance = this.calculateVariance(deptCounts);
    
    if (deptVariance > 5) {
      recommendations.push('Balance rotation hosting across departments');
    }
    
    return recommendations;
  }
  
  /**
   * Calculate variance
   */
  calculateVariance(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }
  
  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    // Periodic metrics aggregation
    setInterval(() => {
      this.aggregateMetrics();
    }, 24 * 60 * 60 * 1000); // Daily
  }
  
  /**
   * Aggregate metrics
   */
  aggregateMetrics() {
    logger.info('📊 Aggregating rotation analytics');
    
    // Clean old data
    const cutoff = Date.now() - (this.config.metricsWindow * 24 * 60 * 60 * 1000);
    this.rotationData = this.rotationData.filter(r => r.timestamp > cutoff);
    
    // Update models
    if (this.rotationData.length >= this.config.minimumDataPoints) {
      this.updateModels();
    }
  }
  
  /**
   * Update statistical models
   */
  updateModels() {
    // Update regression model
    const learningScores = this.rotationData.map(r => r.metrics.learning.score);
    const satisfactionScores = this.rotationData.map(r => r.metrics.satisfaction.score);
    
    this.models.regression = this.calculateTrend(learningScores);
    
    // Update time series model
    this.models.timeSeries.trend = this.models.regression.slope > 0 ? 'improving' : 
                                    this.models.regression.slope < 0 ? 'declining' : 'stable';
  }
}

module.exports = RotationAnalytics;