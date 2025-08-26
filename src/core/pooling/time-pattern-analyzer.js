/**
 * Time Pattern Analyzer for Intelligent Pooling
 * Analyzes and predicts specialist needs based on time patterns
 */

const { logger } = require('../logging/bumba-logger');

class TimePatternAnalyzer {
  constructor() {
    // Time-based usage history
    this.hourlyUsage = new Map(); // hour -> specialist -> count
    this.dailyUsage = new Map();  // dayOfWeek -> specialist -> count
    this.weeklyPatterns = new Map(); // week pattern hash -> specialists
    
    // Business patterns
    this.businessPatterns = {
      // Standard work patterns
      MORNING_PLANNING: {
        hours: [9, 10, 11],
        days: [1, 2, 3, 4, 5], // Mon-Fri
        specialists: [
          'product-strategist',
          'project-manager',
          'business-analyst',
          'tech-lead'
        ],
        confidence: 0.7
      },
      
      CORE_DEVELOPMENT: {
        hours: [10, 11, 12, 13, 14, 15],
        days: [1, 2, 3, 4, 5],
        specialists: [
          'backend-engineer',
          'frontend-developer',
          'database-specialist',
          'api-architect'
        ],
        confidence: 0.8
      },
      
      AFTERNOON_TESTING: {
        hours: [14, 15, 16, 17],
        days: [1, 2, 3, 4, 5],
        specialists: [
          'qa-engineer',
          'test-automation-specialist',
          'debugging-specialist'
        ],
        confidence: 0.6
      },
      
      END_OF_DAY_REVIEW: {
        hours: [16, 17, 18],
        days: [1, 2, 3, 4, 5],
        specialists: [
          'code-reviewer',
          'documentation-writer',
          'performance-optimizer'
        ],
        confidence: 0.5
      },
      
      FRIDAY_DEPLOYMENT: {
        hours: [10, 11, 12, 13, 14],
        days: [5], // Friday
        specialists: [
          'devops-engineer',
          'sre-specialist',
          'cloud-architect',
          'monitoring-specialist'
        ],
        confidence: 0.7
      },
      
      MONDAY_PLANNING: {
        hours: [9, 10, 11],
        days: [1], // Monday
        specialists: [
          'product-owner',
          'product-strategist',
          'business-analyst',
          'ux-researcher'
        ],
        confidence: 0.8
      },
      
      WEEKEND_MAINTENANCE: {
        hours: [10, 11, 12, 13, 14, 15],
        days: [0, 6], // Sat-Sun
        specialists: [
          'refactoring-specialist',
          'dependency-manager',
          'security-auditor',
          'performance-optimizer'
        ],
        confidence: 0.4
      },
      
      LATE_NIGHT_DEBUGGING: {
        hours: [20, 21, 22, 23],
        days: [1, 2, 3, 4, 5],
        specialists: [
          'debugging-specialist',
          'sre-specialist',
          'incident-responder'
        ],
        confidence: 0.3
      }
    };
    
    // Sprint patterns (2-week cycles)
    this.sprintPatterns = {
      SPRINT_START: {
        dayInSprint: [1, 2], // First 2 days
        specialists: [
          'product-owner',
          'business-analyst',
          'architect',
          'tech-lead'
        ]
      },
      SPRINT_MID: {
        dayInSprint: [3, 4, 5, 6, 7, 8], // Middle days
        specialists: [
          'backend-engineer',
          'frontend-developer',
          'database-specialist',
          'ui-designer'
        ]
      },
      SPRINT_END: {
        dayInSprint: [9, 10], // Last 2 days
        specialists: [
          'qa-engineer',
          'devops-engineer',
          'product-manager',
          'code-reviewer'
        ]
      }
    };
    
    // Seasonal patterns
    this.seasonalPatterns = {
      Q1_PLANNING: {
        months: [1, 2], // Jan-Feb
        boost: ['product-strategist', 'market-researcher', 'business-analyst']
      },
      Q4_RUSH: {
        months: [10, 11, 12], // Oct-Dec
        boost: ['devops-engineer', 'sre-specialist', 'performance-optimizer']
      },
      SUMMER_REDUCED: {
        months: [7, 8], // Jul-Aug
        reduce: 0.7 // Reduce all predictions by 30%
      }
    };
    
    // Time zone handling
    this.timezone = this.detectTimezone();
    this.businessHours = {
      start: 9,
      end: 18,
      timezone: this.timezone
    };
    
    // Learning data
    this.usageHistory = [];
    this.maxHistorySize = 1000;
    
    logger.debug(`Time pattern analyzer initialized (timezone: ${this.timezone})`);
  }
  
  /**
   * Detect timezone
   */
  detectTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  }
  
  /**
   * Track specialist usage with timestamp
   */
  trackUsage(specialist, timestamp = Date.now()) {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    const weekOfYear = this.getWeekOfYear(date);
    
    // Update hourly usage
    if (!this.hourlyUsage.has(hour)) {
      this.hourlyUsage.set(hour, new Map());
    }
    const hourMap = this.hourlyUsage.get(hour);
    hourMap.set(specialist, (hourMap.get(specialist) || 0) + 1);
    
    // Update daily usage
    if (!this.dailyUsage.has(dayOfWeek)) {
      this.dailyUsage.set(dayOfWeek, new Map());
    }
    const dayMap = this.dailyUsage.get(dayOfWeek);
    dayMap.set(specialist, (dayMap.get(specialist) || 0) + 1);
    
    // Update weekly patterns
    const weekKey = `${weekOfYear}-${dayOfWeek}`;
    if (!this.weeklyPatterns.has(weekKey)) {
      this.weeklyPatterns.set(weekKey, new Map());
    }
    const weekMap = this.weeklyPatterns.get(weekKey);
    weekMap.set(specialist, (weekMap.get(specialist) || 0) + 1);
    
    // Add to history
    this.usageHistory.push({
      specialist,
      timestamp,
      hour,
      dayOfWeek,
      weekOfYear
    });
    
    // Trim history if too large
    if (this.usageHistory.length > this.maxHistorySize) {
      this.usageHistory.shift();
    }
  }
  
  /**
   * Get time-based predictions
   */
  getTimeBasedPredictions(timestamp = Date.now()) {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    const month = date.getMonth() + 1;
    
    const predictions = new Map();
    
    // 1. Business pattern predictions
    const businessPreds = this.getBusinessPatternPredictions(hour, dayOfWeek);
    for (const pred of businessPreds) {
      predictions.set(pred.specialist, pred.confidence);
    }
    
    // 2. Historical usage predictions
    const historicalPreds = this.getHistoricalPredictions(hour, dayOfWeek);
    for (const pred of historicalPreds) {
      const existing = predictions.get(pred.specialist) || 0;
      predictions.set(pred.specialist, Math.max(existing, pred.confidence));
    }
    
    // 3. Sprint pattern predictions
    const sprintPreds = this.getSprintPredictions(date);
    for (const pred of sprintPreds) {
      const existing = predictions.get(pred.specialist) || 0;
      predictions.set(pred.specialist, Math.max(existing, pred.confidence));
    }
    
    // 4. Seasonal adjustments
    const seasonalFactor = this.getSeasonalFactor(month);
    
    // Convert to array and apply seasonal factor
    const result = Array.from(predictions.entries())
      .map(([specialist, confidence]) => ({
        specialist,
        confidence: confidence * seasonalFactor,
        source: 'time-pattern'
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
    
    return result;
  }
  
  /**
   * Get business pattern predictions
   */
  getBusinessPatternPredictions(hour, dayOfWeek) {
    const predictions = [];
    
    for (const [patternName, pattern] of Object.entries(this.businessPatterns)) {
      if (pattern.hours.includes(hour) && pattern.days.includes(dayOfWeek)) {
        for (const specialist of pattern.specialists) {
          predictions.push({
            specialist,
            confidence: pattern.confidence,
            pattern: patternName
          });
        }
      }
    }
    
    return predictions;
  }
  
  /**
   * Get historical usage predictions
   */
  getHistoricalPredictions(hour, dayOfWeek) {
    const predictions = [];
    
    // Hour-based predictions
    const hourMap = this.hourlyUsage.get(hour);
    if (hourMap) {
      const total = Array.from(hourMap.values()).reduce((sum, count) => sum + count, 0);
      
      for (const [specialist, count] of hourMap) {
        const confidence = count / total * 0.6; // Scale down to 0.6 max
        predictions.push({
          specialist,
          confidence,
          source: 'hourly-history'
        });
      }
    }
    
    // Day-based predictions
    const dayMap = this.dailyUsage.get(dayOfWeek);
    if (dayMap) {
      const total = Array.from(dayMap.values()).reduce((sum, count) => sum + count, 0);
      
      for (const [specialist, count] of dayMap) {
        const confidence = count / total * 0.4; // Scale down to 0.4 max
        predictions.push({
          specialist,
          confidence,
          source: 'daily-history'
        });
      }
    }
    
    return predictions;
  }
  
  /**
   * Get sprint-based predictions
   */
  getSprintPredictions(date) {
    const predictions = [];
    
    // Assume 2-week sprints starting on Monday
    const dayInSprint = this.getDayInSprint(date);
    
    for (const [patternName, pattern] of Object.entries(this.sprintPatterns)) {
      if (pattern.dayInSprint.includes(dayInSprint)) {
        for (const specialist of pattern.specialists) {
          predictions.push({
            specialist,
            confidence: 0.5,
            pattern: patternName
          });
        }
      }
    }
    
    return predictions;
  }
  
  /**
   * Get seasonal adjustment factor
   */
  getSeasonalFactor(month) {
    for (const [patternName, pattern] of Object.entries(this.seasonalPatterns)) {
      if (pattern.months && pattern.months.includes(month)) {
        if (pattern.reduce) {
          return pattern.reduce;
        }
        return 1.2; // Boost by 20% for rush periods
      }
    }
    return 1.0; // No adjustment
  }
  
  /**
   * Get day in sprint (1-10 for 2-week sprints)
   */
  getDayInSprint(date) {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const daysSinceStart = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
    const sprintDay = (daysSinceStart % 14) + 1;
    return Math.min(sprintDay, 10); // Cap at 10 days
  }
  
  /**
   * Get week of year
   */
  getWeekOfYear(date) {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
    return Math.floor(days / 7) + 1;
  }
  
  /**
   * Check if within business hours
   */
  isBusinessHours(timestamp = Date.now()) {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    
    // Weekend check
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }
    
    // Hour check
    return hour >= this.businessHours.start && hour < this.businessHours.end;
  }
  
  /**
   * Get urgency level based on time
   */
  getUrgencyLevel(timestamp = Date.now()) {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    
    // High urgency scenarios
    if (dayOfWeek === 5 && hour >= 14) { // Friday afternoon
      return 'high';
    }
    
    if (hour >= 20 || hour < 6) { // Late night/early morning
      return 'critical';
    }
    
    // Normal business hours
    if (this.isBusinessHours(timestamp)) {
      return 'normal';
    }
    
    // Off-hours but not critical
    return 'low';
  }
  
  /**
   * Get time pattern insights
   */
  getTimePatternInsights() {
    // Most active hours
    const hourlyActivity = Array.from(this.hourlyUsage.entries())
      .map(([hour, specialists]) => ({
        hour,
        totalUsage: Array.from(specialists.values()).reduce((sum, c) => sum + c, 0),
        topSpecialists: Array.from(specialists.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([s, c]) => ({ specialist: s, count: c }))
      }))
      .sort((a, b) => b.totalUsage - a.totalUsage);
    
    // Most active days
    const dailyActivity = Array.from(this.dailyUsage.entries())
      .map(([day, specialists]) => ({
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day],
        totalUsage: Array.from(specialists.values()).reduce((sum, c) => sum + c, 0),
        topSpecialists: Array.from(specialists.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([s, c]) => ({ specialist: s, count: c }))
      }))
      .sort((a, b) => b.totalUsage - a.totalUsage);
    
    // Pattern matches
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();
    const activePatterns = Object.entries(this.businessPatterns)
      .filter(([_, pattern]) => 
        pattern.hours.includes(currentHour) && 
        pattern.days.includes(currentDay)
      )
      .map(([name]) => name);
    
    return {
      hourlyActivity,
      dailyActivity,
      activePatterns,
      currentUrgency: this.getUrgencyLevel(),
      isBusinessHours: this.isBusinessHours(),
      timezone: this.timezone
    };
  }
  
  /**
   * Export state for persistence
   */
  export() {
    return {
      hourlyUsage: Array.from(this.hourlyUsage.entries()).map(([hour, specialists]) => ({
        hour,
        specialists: Array.from(specialists.entries())
      })),
      dailyUsage: Array.from(this.dailyUsage.entries()).map(([day, specialists]) => ({
        day,
        specialists: Array.from(specialists.entries())
      })),
      weeklyPatterns: Array.from(this.weeklyPatterns.entries()).map(([week, specialists]) => ({
        week,
        specialists: Array.from(specialists.entries())
      })),
      usageHistory: this.usageHistory.slice(-100) // Keep last 100 for export
    };
  }
  
  /**
   * Import state
   */
  import(state) {
    if (state.hourlyUsage) {
      this.hourlyUsage = new Map();
      for (const item of state.hourlyUsage) {
        this.hourlyUsage.set(item.hour, new Map(item.specialists));
      }
    }
    
    if (state.dailyUsage) {
      this.dailyUsage = new Map();
      for (const item of state.dailyUsage) {
        this.dailyUsage.set(item.day, new Map(item.specialists));
      }
    }
    
    if (state.weeklyPatterns) {
      this.weeklyPatterns = new Map();
      for (const item of state.weeklyPatterns) {
        this.weeklyPatterns.set(item.week, new Map(item.specialists));
      }
    }
    
    if (state.usageHistory) {
      this.usageHistory = state.usageHistory;
    }
    
    logger.debug('Time pattern analyzer state imported');
  }
  
  /**
   * Analyze patterns from usage scores
   */
  analyzePatterns(scores) {
    const patterns = {
      trending: [],
      declining: [],
      stable: [],
      periodic: []
    };
    
    // Group scores by pattern type
    for (const score of scores) {
      const trend = this.analyzeTrend(score);
      
      if (trend === 'increasing') {
        patterns.trending.push(score);
      } else if (trend === 'decreasing') {
        patterns.declining.push(score);
      } else if (this.isPeriodic(score)) {
        patterns.periodic.push(score);
      } else {
        patterns.stable.push(score);
      }
    }
    
    return patterns;
  }
  
  /**
   * Analyze trend for a score
   */
  analyzeTrend(score) {
    // Simple trend analysis based on score value
    if (score.score > 0.7) {
      return 'increasing';
    } else if (score.score < 0.3) {
      return 'decreasing';
    }
    return 'stable';
  }
  
  /**
   * Check if usage is periodic
   */
  isPeriodic(score) {
    // Check if specialist appears in business patterns
    for (const pattern of Object.values(this.businessPatterns)) {
      if (pattern.specialists.includes(score.specialist)) {
        return true;
      }
    }
    return false;
  }
}

module.exports = { TimePatternAnalyzer };