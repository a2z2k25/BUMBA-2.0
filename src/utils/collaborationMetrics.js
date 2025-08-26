/**
 * BUMBA Collaboration Quality Metrics
 *
 * Tracks and analyzes multi-agent team performance to optimize
 * cross-functional collaboration and identify workflow bottlenecks.
 */

const fs = require('fs');
const { logger } = require('../core/logging/bumba-logger');

const path = require('path');

class BumbaCollaborationMetrics {
  constructor() {
    this.teamDir = path.join(process.env.HOME, '.claude', 'team');
    this.metricsFile = path.join(this.teamDir, 'metrics.json');
    this.thresholds = {
      handoffTimeMinutes: 15, // Alert if handoffs take > 15 minutes
      checkpointFrequency: 5, // Minimum checkpoints per session
      qualityScore: 85, // Minimum quality score percentage
      collaborationRatio: 0.6 // Minimum ratio of collaborative vs solo work
    };
  }

  /**
   * Calculate comprehensive collaboration metrics
   */
  calculateMetrics() {
    try {
      const collaborationData = this._loadCollaborationData();
      const agentHistory = this._loadAgentHistory();

      const metrics = {
        timestamp: new Date().toISOString(),
        teamEfficiency: this._calculateTeamEfficiency(collaborationData, agentHistory),
        qualityMetrics: this._calculateQualityMetrics(collaborationData),
        handoffAnalysis: this._analyzeHandoffs(collaborationData),
        agentPerformance: this._analyzeAgentPerformance(collaborationData, agentHistory),
        collaborationHealth: this._assessCollaborationHealth(collaborationData),
        recommendations: []
      };

      // Generate actionable recommendations
      metrics.recommendations = this._generateRecommendations(metrics);

      // Store metrics for historical analysis
      this._storeMetrics(metrics);

      return metrics;
    } catch (error) {
      return {
        error: 'Unable to calculate metrics',
        details: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate team efficiency metrics
   */
  _calculateTeamEfficiency(collaborationData, agentHistory) {
    const sessions = agentHistory.sessions || [];
    const handoffs = collaborationData.pendingHandoffs || [];
    const completedHandoffs = collaborationData.completedHandoffs || [];

    // Calculate average handoff time
    const handoffTimes = completedHandoffs
      .filter(h => h.acceptedAt && h.createdAt)
      .map(h => {
        const created = new Date(h.createdAt);
        const accepted = new Date(h.acceptedAt);
        return (accepted - created) / (1000 * 60); // minutes
      });

    const avgHandoffTime =
      handoffTimes.length > 0 ? handoffTimes.reduce((a, b) => a + b, 0) / handoffTimes.length : 0;

    // Calculate session productivity
    const productiveSessions = sessions.filter(
      s => s.type === 'checkpoint' || s.type === 'handoff_completed'
    ).length;

    const totalSessions = sessions.length;
    const productivityRatio = totalSessions > 0 ? productiveSessions / totalSessions : 0;

    return {
      averageHandoffTimeMinutes: Math.round(avgHandoffTime * 100) / 100,
      pendingHandoffs: handoffs.length,
      completedHandoffs: completedHandoffs.length,
      productivityRatio: Math.round(productivityRatio * 100) / 100,
      handoffEfficiencyScore: this._calculateHandoffEfficiency(avgHandoffTime, handoffs.length),
      totalTeamSessions: totalSessions
    };
  }

  /**
   * Calculate quality-related metrics
   */
  _calculateQualityMetrics(collaborationData) {
    const checkpoints = collaborationData.qualityCheckpoints || [];

    // Group checkpoints by type
    const checkpointTypes = {};
    checkpoints.forEach(cp => {
      if (!checkpointTypes[cp.type]) {
        checkpointTypes[cp.type] = [];
      }
      checkpointTypes[cp.type].push(cp);
    });

    // Calculate quality scores by analyzing checkpoint results
    const qualityScores = checkpoints.map(cp => {
      if (cp.results.includes('passed') || cp.results.includes('success')) {return 100;}
      if (cp.results.includes('warning') || cp.results.includes('minor')) {return 75;}
      if (cp.results.includes('error') || cp.results.includes('failed')) {return 25;}
      return 50; // neutral/unknown
    });

    const avgQualityScore =
      qualityScores.length > 0
        ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
        : 0;

    return {
      totalCheckpoints: checkpoints.length,
      checkpointTypes: Object.keys(checkpointTypes).map(type => ({
        type,
        count: checkpointTypes[type].length,
        latestResult: checkpointTypes[type].slice(-1)[0]?.results || 'none'
      })),
      averageQualityScore: Math.round(avgQualityScore),
      qualityTrend: this._calculateQualityTrend(checkpoints),
      criticalIssues: checkpoints.filter(
        cp => cp.results.includes('error') || cp.results.includes('critical')
      ).length
    };
  }

  /**
   * Analyze handoff patterns and bottlenecks
   */
  _analyzeHandoffs(collaborationData) {
    const handoffs = [
      ...(collaborationData.pendingHandoffs || []),
      ...(collaborationData.completedHandoffs || [])
    ];

    // Analyze handoff patterns
    const handoffPatterns = {};
    handoffs.forEach(h => {
      const pattern = `${h.from} → ${h.to}`;
      handoffPatterns[pattern] = (handoffPatterns[pattern] || 0) + 1;
    });

    // Identify bottlenecks
    const agentLoad = {};
    handoffs.forEach(h => {
      agentLoad[h.to] = (agentLoad[h.to] || 0) + 1;
    });

    const bottlenecks = Object.entries(agentLoad)
      .filter(([agent, load]) => load > 3)
      .map(([agent, load]) => ({ agent, pendingHandoffs: load }));

    return {
      totalHandoffs: handoffs.length,
      commonPatterns: Object.entries(handoffPatterns)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([pattern, count]) => ({ pattern, count })),
      bottlenecks,
      handoffsByPriority: this._groupHandoffsByPriority(handoffs)
    };
  }

  /**
   * Analyze individual agent performance
   */
  _analyzeAgentPerformance(collaborationData, agentHistory) {
    const agents = ['Product-Strategist', 'Design-Engineer', 'Backend-Engineer'];
    const checkpoints = collaborationData.qualityCheckpoints || [];
    const sessions = agentHistory.sessions || [];

    return agents.map(agent => {
      const agentCheckpoints = checkpoints.filter(cp => cp.agent === agent);
      const agentSessions = sessions.filter(s => s.agent === agent);
      const agentHandoffs = (collaborationData.completedHandoffs || []).filter(
        h => h.from === agent || h.to === agent
      );

      // Calculate agent-specific quality score
      const agentQualityScores = agentCheckpoints.map(cp => {
        if (cp.results.includes('passed') || cp.results.includes('success')) {return 100;}
        if (cp.results.includes('warning')) {return 75;}
        if (cp.results.includes('error')) {return 25;}
        return 50;
      });

      const avgQualityScore =
        agentQualityScores.length > 0
          ? agentQualityScores.reduce((a, b) => a + b, 0) / agentQualityScores.length
          : 0;

      return {
        agent,
        checkpointsCreated: agentCheckpoints.length,
        sessionsParticipated: agentSessions.length,
        handoffsInvolved: agentHandoffs.length,
        qualityScore: Math.round(avgQualityScore),
        lastActive: agentSessions.length > 0 ? agentSessions.slice(-1)[0].timestamp : null,
        specialization: this._identifyAgentSpecialization(agent, agentCheckpoints)
      };
    });
  }

  /**
   * Assess overall collaboration health
   */
  _assessCollaborationHealth(collaborationData) {
    const handoffs = collaborationData.pendingHandoffs || [];
    const checkpoints = collaborationData.qualityCheckpoints || [];
    const decisions = collaborationData.teamDecisions || [];

    // Calculate health indicators
    const pendingHandoffScore =
      handoffs.length <= 2 ? 100 : Math.max(0, 100 - handoffs.length * 20);
    const checkpointFrequencyScore =
      checkpoints.length >= this.thresholds.checkpointFrequency
        ? 100
        : (checkpoints.length / this.thresholds.checkpointFrequency) * 100;
    const decisionMakingScore = decisions.length > 0 ? 100 : 50;

    const overallScore = Math.round(
      (pendingHandoffScore + checkpointFrequencyScore + decisionMakingScore) / 3
    );

    return {
      overallScore,
      healthIndicators: {
        pendingHandoffScore: Math.round(pendingHandoffScore),
        checkpointFrequencyScore: Math.round(checkpointFrequencyScore),
        decisionMakingScore
      },
      status: this._determineHealthStatus(overallScore),
      lastHealthCheck: new Date().toISOString()
    };
  }

  /**
   * Generate actionable recommendations
   */
  _generateRecommendations(metrics) {
    const recommendations = [];

    // Team efficiency recommendations
    if (metrics.teamEfficiency.averageHandoffTimeMinutes > this.thresholds.handoffTimeMinutes) {
      recommendations.push({
        type: 'efficiency',
        priority: 'high',
        issue: 'Slow handoffs detected',
        suggestion: 'Consider using /bumba:team handoffs to identify and resolve bottlenecks',
        metric: `Average handoff time: ${metrics.teamEfficiency.averageHandoffTimeMinutes} minutes`
      });
    }

    // Quality recommendations
    if (metrics.qualityMetrics.averageQualityScore < this.thresholds.qualityScore) {
      recommendations.push({
        type: 'quality',
        priority: 'high',
        issue: 'Low quality scores detected',
        suggestion: 'Increase checkpoint frequency and focus on quality validation',
        metric: `Quality score: ${metrics.qualityMetrics.averageQualityScore}%`
      });
    }

    // Collaboration recommendations
    if (metrics.teamEfficiency.pendingHandoffs > 3) {
      recommendations.push({
        type: 'collaboration',
        priority: 'medium',
        issue: 'High number of pending handoffs',
        suggestion: 'Agents should accept pending handoffs to maintain team flow',
        metric: `${metrics.teamEfficiency.pendingHandoffs} pending handoffs`
      });
    }

    // Agent-specific recommendations
    const inactiveAgents = metrics.agentPerformance.filter(
      agent => !agent.lastActive || new Date() - new Date(agent.lastActive) > 24 * 60 * 60 * 1000
    );

    if (inactiveAgents.length > 0) {
      recommendations.push({
        type: 'team-balance',
        priority: 'medium',
        issue: 'Inactive agents detected',
        suggestion: 'Use /bumba:implement-agents to ensure all agents are engaged',
        metric: `Inactive: ${inactiveAgents.map(a => a.agent).join(', ')}`
      });
    }

    return recommendations;
  }

  /**
   * Helper methods
   */
  _loadCollaborationData() {
    const collaborationFile = path.join(this.teamDir, 'collaboration.json');
    if (fs.existsSync(collaborationFile)) {
      return JSON.parse(fs.readFileSync(collaborationFile, 'utf8'));
    }
    return {};
  }

  _loadAgentHistory() {
    const historyFile = path.join(this.teamDir, 'agent-history.json');
    if (fs.existsSync(historyFile)) {
      return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    }
    return { sessions: [] };
  }

  _calculateHandoffEfficiency(avgTime, pendingCount) {
    const timeScore =
      avgTime <= this.thresholds.handoffTimeMinutes
        ? 100
        : Math.max(0, 100 - (avgTime - this.thresholds.handoffTimeMinutes) * 5);
    const pendingScore = pendingCount <= 2 ? 100 : Math.max(0, 100 - pendingCount * 20);
    return Math.round((timeScore + pendingScore) / 2);
  }

  _calculateQualityTrend(checkpoints) {
    if (checkpoints.length < 2) {return 'insufficient-data';}

    const recent = checkpoints.slice(-5);
    const older = checkpoints.slice(-10, -5);

    const recentAvg = this._averageQualityScore(recent);
    const olderAvg = this._averageQualityScore(older);

    if (recentAvg > olderAvg + 10) {return 'improving';}
    if (recentAvg < olderAvg - 10) {return 'declining';}
    return 'stable';
  }

  _averageQualityScore(checkpoints) {
    if (checkpoints.length === 0) {return 0;}
    const scores = checkpoints.map(cp => {
      if (cp.results.includes('passed')) {return 100;}
      if (cp.results.includes('warning')) {return 75;}
      if (cp.results.includes('error')) {return 25;}
      return 50;
    });
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  _groupHandoffsByPriority(handoffs) {
    const priorities = { high: 0, normal: 0, low: 0 };
    handoffs.forEach(h => {
      priorities[h.priority || 'normal']++;
    });
    return priorities;
  }

  _identifyAgentSpecialization(agent, checkpoints) {
    const checkpointTypes = checkpoints.map(cp => cp.type);
    const specializations = {
      'Product-Strategist': ['requirements_complete', 'prd_validated', 'stakeholder_approval'],
      'Design-Engineer': ['ui_design_complete', 'ux_validation', 'figma_integration'],
      'Backend-Engineer': ['code_review', 'architecture_validation', 'deployment_ready']
    };

    const expectedTypes = specializations[agent] || [];
    const matchingTypes = checkpointTypes.filter(type =>
      expectedTypes.some(expected => type.includes(expected.split('_')[0]))
    );

    return matchingTypes.length >= checkpointTypes.length * 0.6 ? 'specialized' : 'generalist';
  }

  _determineHealthStatus(score) {
    if (score >= 90) {return 'excellent';}
    if (score >= 75) {return 'good';}
    if (score >= 60) {return 'fair';}
    return 'needs-attention';
  }

  _storeMetrics(metrics) {
    try {
      if (!fs.existsSync(this.teamDir)) {
        fs.mkdirSync(this.teamDir, { recursive: true });
      }

      // Load existing metrics
      let allMetrics = [];
      if (fs.existsSync(this.metricsFile)) {
        allMetrics = JSON.parse(fs.readFileSync(this.metricsFile, 'utf8'));
      }

      // Add new metrics and keep last 50 entries
      allMetrics.push(metrics);
      allMetrics = allMetrics.slice(-50);

      fs.writeFileSync(this.metricsFile, JSON.stringify(allMetrics, null, 2));
    } catch (error) {
      logger.error('Failed to store metrics:', error.message);
    }
  }
}

module.exports = BumbaCollaborationMetrics;
