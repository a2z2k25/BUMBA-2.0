/**
 * BUMBA Notion Score Persistence
 * Tracks and persists agent Notion documentation scores
 */

const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../logging/bumba-logger');

class NotionScorePersistence {
  constructor() {
    this.scoreFile = path.join(process.cwd(), '.bumba-notion-scores.json');
    this.scores = new Map();
    this.milestones = new Map();
    this.loadScores();
  }
  
  async loadScores() {
    try {
      const data = await fs.readFile(this.scoreFile, 'utf8');
      const parsed = JSON.parse(data);
      
      // Load scores
      if (parsed.scores) {
        Object.entries(parsed.scores).forEach(([agent, score]) => {
          this.scores.set(agent, score);
        });
      }
      
      // Load milestones
      if (parsed.milestones) {
        Object.entries(parsed.milestones).forEach(([agent, achievements]) => {
          this.milestones.set(agent, new Set(achievements));
        });
      }
      
      logger.info(`🟢 Loaded Notion scores for ${this.scores.size} agents`);
    } catch (error) {
      // File doesn't exist yet, start fresh
      logger.debug('No existing score file, starting fresh');
    }
  }
  
  async saveScores() {
    try {
      const data = {
        scores: Object.fromEntries(this.scores),
        milestones: Object.fromEntries(
          Array.from(this.milestones.entries()).map(([agent, achievements]) => [
            agent,
            Array.from(achievements)
          ])
        ),
        lastUpdated: new Date().toISOString()
      };
      
      await fs.writeFile(this.scoreFile, JSON.stringify(data, null, 2));
    } catch (error) {
      logger.error('Failed to save scores:', error);
    }
  }
  
  incrementScore(agentId, points) {
    const current = this.scores.get(agentId) || 0;
    const newScore = current + points;
    this.scores.set(agentId, newScore);
    
    // Check milestones
    this.checkMilestone(agentId, newScore, current);
    
    // Auto-save
    this.saveScores();
    
    return newScore;
  }
  
  checkMilestone(agentId, newScore, oldScore) {
    const achievements = this.milestones.get(agentId) || new Set();
    
    const milestoneThresholds = [
      { score: 50, name: 'documenter', message: '🟢 Documenter - Great start!' },
      { score: 100, name: 'champion', message: '🏁 Notion Champion!' },
      { score: 200, name: 'master', message: '🏁 Documentation Master!' },
      { score: 500, name: 'legend', message: '🟢 Documentation Legend!' }
    ];
    
    for (const milestone of milestoneThresholds) {
      if (newScore >= milestone.score && oldScore < milestone.score) {
        if (!achievements.has(milestone.name)) {
          achievements.add(milestone.name);
          this.milestones.set(agentId, achievements);
          
          // Emit milestone event
          this.emit('milestone:achieved', {
            agentId,
            milestone: milestone.name,
            message: milestone.message,
            score: newScore
          });
        }
      }
    }
  }
  
  getScore(agentId) {
    return this.scores.get(agentId) || 0;
  }
  
  getLeaderboard() {
    const entries = Array.from(this.scores.entries());
    entries.sort((a, b) => b[1] - a[1]);
    
    return entries.map(([agent, score], index) => ({
      rank: index + 1,
      agent,
      score,
      achievements: Array.from(this.milestones.get(agent) || [])
    }));
  }
  
  getAgentStats(agentId) {
    return {
      score: this.getScore(agentId),
      achievements: Array.from(this.milestones.get(agentId) || []),
      rank: this.getAgentRank(agentId)
    };
  }
  
  getAgentRank(agentId) {
    const leaderboard = this.getLeaderboard();
    const entry = leaderboard.find(e => e.agent === agentId);
    return entry ? entry.rank : null;
  }
  
  resetScore(agentId) {
    this.scores.delete(agentId);
    this.milestones.delete(agentId);
    this.saveScores();
  }
  
  resetAllScores() {
    this.scores.clear();
    this.milestones.clear();
    this.saveScores();
  }
}

// Make it an EventEmitter for milestone events
const { EventEmitter } = require('events');
Object.setPrototypeOf(NotionScorePersistence.prototype, EventEmitter.prototype);

// Singleton
let instance = null;

module.exports = {
  NotionScorePersistence,
  getInstance: () => {
    if (!instance) {
      instance = new NotionScorePersistence();
    }
    return instance;
  }
};