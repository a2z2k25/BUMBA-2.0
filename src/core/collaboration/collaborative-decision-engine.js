/**
 * BUMBA Collaborative Decision Engine
 * Advanced decision-making system with consciousness-driven consensus building
 */

const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');

class CollaborativeDecisionEngine extends EventEmitter {
  constructor() {
    super();
    this.activeDecisions = new Map();
    this.decisionHistory = new Map();
    this.votingStrategies = new Map();
    this.consensusAlgorithms = new Map();
    
    this.initializeDecisionStrategies();
  }

  initializeDecisionStrategies() {
    // Voting strategies
    this.votingStrategies.set('simple_majority', new SimpleMajorityStrategy());
    this.votingStrategies.set('qualified_majority', new QualifiedMajorityStrategy());
    this.votingStrategies.set('consensus', new ConsensusStrategy());
    this.votingStrategies.set('consciousness_weighted', new ConsciousnessWeightedStrategy());
    this.votingStrategies.set('expertise_weighted', new ExpertiseWeightedStrategy());

    // Consensus algorithms
    this.consensusAlgorithms.set('raft', new RaftConsensus());
    this.consensusAlgorithms.set('pbft', new PBFTConsensus());
    this.consensusAlgorithms.set('consciousness_driven', new ConsciousnessDrivenConsensus());
  }

  async initiate(config) {
    const decisionId = this.generateDecisionId();
    
    const decision = new CollaborativeDecision({
      id: decisionId,
      sessionId: config.sessionId,
      question: config.decision.question,
      context: config.decision.context,
      options: config.decision.options || ['approve', 'reject'],
      participants: config.participants,
      strategy: config.decision.strategy || 'consciousness_weighted',
      deadline: config.decision.deadline || Date.now() + 300000, // 5 minutes default
      consciousnessLayer: config.consciousnessLayer,
      ethicsMonitor: config.ethicsMonitor
    });

    this.activeDecisions.set(decisionId, decision);

    // Start the decision process
    await decision.initialize();

    this.emit('decision_initiated', {
      decisionId,
      sessionId: config.sessionId,
      question: config.decision.question,
      deadline: decision.deadline
    });

    logger.info(`🟢️ Decision process initiated: ${decisionId}`);

    return decision;
  }

  async recordVote(decisionId, agentId, vote) {
    const decision = this.activeDecisions.get(decisionId);
    if (!decision) {
      throw new Error(`Decision ${decisionId} not found`);
    }

    const voteResult = await decision.recordVote(agentId, vote);

    this.emit('vote_recorded', {
      decisionId,
      agentId,
      vote: voteResult,
      progress: decision.getProgress()
    });

    // Check if decision is complete
    if (decision.isComplete()) {
      await this.finalizeDecision(decisionId);
    }

    return voteResult;
  }

  async finalizeDecision(decisionId) {
    const decision = this.activeDecisions.get(decisionId);
    if (!decision) {
      return null;
    }

    const result = await decision.finalize();

    // Move to history
    this.decisionHistory.set(decisionId, decision);
    this.activeDecisions.delete(decisionId);

    this.emit('decision_finalized', {
      decisionId,
      result,
      sessionId: decision.sessionId
    });

    logger.info(`🟢️ Decision finalized: ${decisionId} - ${result.outcome}`);

    return result;
  }

  async extendDeadline(decisionId, newDeadline) {
    const decision = this.activeDecisions.get(decisionId);
    if (!decision) {
      throw new Error(`Decision ${decisionId} not found`);
    }

    await decision.extendDeadline(newDeadline);

    this.emit('deadline_extended', {
      decisionId,
      newDeadline
    });

    return true;
  }

  async cancelDecision(decisionId, reason) {
    const decision = this.activeDecisions.get(decisionId);
    if (!decision) {
      return false;
    }

    await decision.cancel(reason);

    // Move to history
    this.decisionHistory.set(decisionId, decision);
    this.activeDecisions.delete(decisionId);

    this.emit('decision_cancelled', {
      decisionId,
      reason
    });

    return true;
  }

  getDecision(decisionId) {
    return this.activeDecisions.get(decisionId) || this.decisionHistory.get(decisionId);
  }

  getActiveDecisions(sessionId = null) {
    const decisions = Array.from(this.activeDecisions.values());
    
    if (sessionId) {
      return decisions.filter(d => d.sessionId === sessionId);
    }
    
    return decisions;
  }

  getMetrics(sessionId = null) {
    const activeDecisions = this.getActiveDecisions(sessionId);
    const historicalDecisions = Array.from(this.decisionHistory.values())
      .filter(d => !sessionId || d.sessionId === sessionId);

    return {
      active: activeDecisions.length,
      completed: historicalDecisions.length,
      averageTime: this.calculateAverageDecisionTime(historicalDecisions),
      consensusRate: this.calculateConsensusRate(historicalDecisions),
      participationRate: this.calculateParticipationRate(historicalDecisions),
      ethicsComplianceRate: this.calculateEthicsComplianceRate(historicalDecisions)
    };
  }

  calculateAverageDecisionTime(decisions) {
    if (decisions.length === 0) {return 0;}
    
    const totalTime = decisions.reduce((sum, decision) => {
      return sum + (decision.finalizedAt - decision.createdAt);
    }, 0);
    
    return totalTime / decisions.length;
  }

  calculateConsensusRate(decisions) {
    if (decisions.length === 0) {return 0;}
    
    const consensusDecisions = decisions.filter(d => 
      d.result && d.result.consensusLevel > 0.8
    ).length;
    
    return consensusDecisions / decisions.length;
  }

  calculateParticipationRate(decisions) {
    if (decisions.length === 0) {return 0;}
    
    let totalParticipation = 0;
    let totalPossible = 0;
    
    for (const decision of decisions) {
      totalParticipation += decision.votes.size;
      totalPossible += decision.participants.length;
    }
    
    return totalPossible > 0 ? totalParticipation / totalPossible : 0;
  }

  calculateEthicsComplianceRate(decisions) {
    if (decisions.length === 0) {return 1;}
    
    const ethicsCompliantDecisions = decisions.filter(d => 
      d.ethicsValidation && d.ethicsValidation.compliant
    ).length;
    
    return ethicsCompliantDecisions / decisions.length;
  }

  generateDecisionId() {
    return `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

class CollaborativeDecision extends EventEmitter {
  constructor(config) {
    super();
    this.id = config.id;
    this.sessionId = config.sessionId;
    this.question = config.question;
    this.context = config.context;
    this.options = config.options;
    this.participants = config.participants;
    this.strategy = config.strategy;
    this.deadline = config.deadline;
    this.consciousnessLayer = config.consciousnessLayer;
    this.ethicsMonitor = config.ethicsMonitor;
    
    this.votes = new Map();
    this.discussions = [];
    this.status = 'pending';
    this.createdAt = Date.now();
    this.finalizedAt = null;
    this.result = null;
    this.ethicsValidation = null;
  }

  async initialize() {
    // Validate decision with consciousness principles
    if (this.consciousnessLayer) {
      this.ethicsValidation = await this.consciousnessLayer.validateIntent({
        description: `collaborative decision: ${this.question}`,
        context: this.context,
        participants: this.participants
      });
    }

    // Initialize voting strategy
    this.votingStrategy = this.getVotingStrategy();
    
    this.status = 'active';
    
    this.emit('decision_initialized', {
      id: this.id,
      question: this.question,
      options: this.options,
      deadline: this.deadline
    });
  }

  async recordVote(agentId, voteData) {
    if (this.status !== 'active') {
      throw new Error(`Decision ${this.id} is not active`);
    }

    if (Date.now() > this.deadline) {
      throw new Error(`Decision ${this.id} deadline has passed`);
    }

    if (!this.participants.some(p => p.id === agentId)) {
      throw new Error(`Agent ${agentId} is not authorized to vote on decision ${this.id}`);
    }

    // Validate vote with ethics
    if (this.ethicsMonitor) {
      await this.ethicsMonitor.validateVote(agentId, voteData, this);
    }

    const vote = {
      agentId,
      option: voteData.option,
      reasoning: voteData.reasoning || '',
      confidence: voteData.confidence || 1.0,
      timestamp: Date.now(),
      metadata: voteData.metadata || {}
    };

    // Apply consciousness weighting if applicable
    if (this.strategy === 'consciousness_weighted' && this.consciousnessLayer) {
      vote.consciousnessWeight = await this.calculateConsciousnessWeight(agentId, vote);
    }

    this.votes.set(agentId, vote);

    this.emit('vote_recorded', {
      decisionId: this.id,
      vote
    });

    return vote;
  }

  async addDiscussion(agentId, message) {
    if (!this.participants.some(p => p.id === agentId)) {
      throw new Error(`Agent ${agentId} is not authorized to participate in decision ${this.id}`);
    }

    const discussion = {
      agentId,
      message,
      timestamp: Date.now()
    };

    this.discussions.push(discussion);

    this.emit('discussion_added', {
      decisionId: this.id,
      discussion
    });

    return discussion;
  }

  async extendDeadline(newDeadline) {
    if (newDeadline <= Date.now()) {
      throw new Error('New deadline must be in the future');
    }

    this.deadline = newDeadline;

    this.emit('deadline_extended', {
      decisionId: this.id,
      newDeadline
    });
  }

  async cancel(reason) {
    this.status = 'cancelled';
    this.result = {
      outcome: 'cancelled',
      reason,
      cancelledAt: Date.now()
    };

    this.emit('decision_cancelled', {
      decisionId: this.id,
      reason
    });
  }

  isComplete() {
    if (this.status !== 'active') {
      return false;
    }

    // Check if all participants have voted
    const allVoted = this.participants.every(p => this.votes.has(p.id));
    
    // Check if deadline has passed
    const deadlinePassed = Date.now() > this.deadline;
    
    // Check if strategy-specific completion criteria are met
    const strategyCriteriaMet = this.votingStrategy.isComplete(this.votes, this.participants);

    return allVoted || deadlinePassed || strategyCriteriaMet;
  }

  async finalize() {
    if (this.status === 'finalized') {
      return this.result;
    }

    this.status = 'finalizing';

    // Calculate result using voting strategy
    this.result = await this.votingStrategy.calculateResult(this.votes, this.participants, this);

    // Add consciousness validation to result
    if (this.consciousnessLayer && this.result.outcome !== 'no_decision') {
      this.result.consciousnessValidation = await this.consciousnessLayer.validateResult(
        this.result,
        { question: this.question, context: this.context }
      );
    }

    this.status = 'finalized';
    this.finalizedAt = Date.now();

    this.emit('decision_finalized', {
      decisionId: this.id,
      result: this.result
    });

    return this.result;
  }

  getProgress() {
    const totalParticipants = this.participants.length;
    const votedCount = this.votes.size;
    const timeRemaining = Math.max(0, this.deadline - Date.now());
    
    return {
      votedCount,
      totalParticipants,
      participationRate: votedCount / totalParticipants,
      timeRemaining,
      timeRemainingPercent: timeRemaining / (this.deadline - this.createdAt),
      status: this.status
    };
  }

  getVotingStrategy() {
    // Factory method to get appropriate voting strategy
    switch (this.strategy) {
      case 'simple_majority':
        return new SimpleMajorityStrategy();
      case 'qualified_majority':
        return new QualifiedMajorityStrategy();
      case 'consensus':
        return new ConsensusStrategy();
      case 'consciousness_weighted':
        return new ConsciousnessWeightedStrategy();
      case 'expertise_weighted':
        return new ExpertiseWeightedStrategy();
      default:
        return new SimpleMajorityStrategy();
    }
  }

  async calculateConsciousnessWeight(agentId, vote) {
    // Calculate weight based on consciousness alignment
    const agent = this.participants.find(p => p.id === agentId);
    if (!agent) {return 1.0;}

    let weight = 1.0;

    // Factor in agent's consciousness history
    if (agent.consciousnessScore) {
      weight *= agent.consciousnessScore;
    }

    // Factor in vote reasoning quality
    if (vote.reasoning) {
      const reasoningScore = await this.evaluateReasoningQuality(vote.reasoning);
      weight *= reasoningScore;
    }

    // Factor in confidence
    weight *= vote.confidence;

    return Math.max(0.1, Math.min(2.0, weight)); // Clamp between 0.1 and 2.0
  }

  async evaluateReasoningQuality(reasoning) {
    // Simple reasoning quality evaluation
    let score = 0.5;
    
    if (reasoning.length > 50) {score += 0.1;}
    if (reasoning.includes('because')) {score += 0.1;}
    if (reasoning.includes('benefit')) {score += 0.1;}
    if (reasoning.includes('risk')) {score += 0.1;}
    if (reasoning.includes('users') || reasoning.includes('community')) {score += 0.2;}

    return Math.min(1.0, score);
  }
}

// Voting Strategies
class SimpleMajorityStrategy {
  isComplete(votes, participants) {
    return votes.size > participants.length / 2;
  }

  async calculateResult(votes, participants, decision) {
    const voteCounts = new Map();
    
    for (const vote of votes.values()) {
      voteCounts.set(vote.option, (voteCounts.get(vote.option) || 0) + 1);
    }

    let winningOption = null;
    let maxVotes = 0;
    
    for (const [option, count] of voteCounts) {
      if (count > maxVotes) {
        maxVotes = count;
        winningOption = option;
      }
    }

    const totalVotes = votes.size;
    const threshold = Math.floor(totalVotes / 2) + 1;

    return {
      outcome: maxVotes >= threshold ? winningOption : 'no_decision',
      voteCounts: Object.fromEntries(voteCounts),
      totalVotes,
      threshold,
      consensusLevel: maxVotes / totalVotes,
      strategy: 'simple_majority'
    };
  }
}

class QualifiedMajorityStrategy {
  constructor(threshold = 0.67) {
    this.threshold = threshold;
  }

  isComplete(votes, participants) {
    return votes.size >= participants.length * this.threshold;
  }

  async calculateResult(votes, participants, decision) {
    const voteCounts = new Map();
    
    for (const vote of votes.values()) {
      voteCounts.set(vote.option, (voteCounts.get(vote.option) || 0) + 1);
    }

    let winningOption = null;
    let maxVotes = 0;
    
    for (const [option, count] of voteCounts) {
      if (count > maxVotes) {
        maxVotes = count;
        winningOption = option;
      }
    }

    const totalVotes = votes.size;
    const requiredVotes = Math.ceil(totalVotes * this.threshold);

    return {
      outcome: maxVotes >= requiredVotes ? winningOption : 'no_decision',
      voteCounts: Object.fromEntries(voteCounts),
      totalVotes,
      threshold: requiredVotes,
      consensusLevel: maxVotes / totalVotes,
      strategy: 'qualified_majority'
    };
  }
}

class ConsensusStrategy {
  isComplete(votes, participants) {
    if (votes.size < participants.length) {return false;}
    
    const options = new Set();
    for (const vote of votes.values()) {
      options.add(vote.option);
    }
    
    return options.size === 1;
  }

  async calculateResult(votes, participants, decision) {
    const voteCounts = new Map();
    
    for (const vote of votes.values()) {
      voteCounts.set(vote.option, (voteCounts.get(vote.option) || 0) + 1);
    }

    const totalVotes = votes.size;
    const unanimousOption = voteCounts.size === 1 ? Array.from(voteCounts.keys())[0] : null;

    return {
      outcome: unanimousOption || 'no_consensus',
      voteCounts: Object.fromEntries(voteCounts),
      totalVotes,
      consensusLevel: unanimousOption ? 1.0 : Math.max(...voteCounts.values()) / totalVotes,
      strategy: 'consensus'
    };
  }
}

class ConsciousnessWeightedStrategy {
  isComplete(votes, participants) {
    return votes.size >= Math.ceil(participants.length * 0.6);
  }

  async calculateResult(votes, participants, decision) {
    const weightedCounts = new Map();
    let totalWeight = 0;
    
    for (const vote of votes.values()) {
      const weight = vote.consciousnessWeight || 1.0;
      weightedCounts.set(vote.option, (weightedCounts.get(vote.option) || 0) + weight);
      totalWeight += weight;
    }

    let winningOption = null;
    let maxWeight = 0;
    
    for (const [option, weight] of weightedCounts) {
      if (weight > maxWeight) {
        maxWeight = weight;
        winningOption = option;
      }
    }

    const threshold = totalWeight * 0.5;

    return {
      outcome: maxWeight > threshold ? winningOption : 'no_decision',
      weightedCounts: Object.fromEntries(weightedCounts),
      totalWeight,
      threshold,
      consensusLevel: maxWeight / totalWeight,
      strategy: 'consciousness_weighted'
    };
  }
}

class ExpertiseWeightedStrategy {
  isComplete(votes, participants) {
    return votes.size >= Math.ceil(participants.length * 0.6);
  }

  async calculateResult(votes, participants, decision) {
    const weightedCounts = new Map();
    let totalWeight = 0;
    
    for (const vote of votes.values()) {
      const agent = participants.find(p => p.id === vote.agentId);
      const weight = this.calculateExpertiseWeight(agent, decision);
      
      weightedCounts.set(vote.option, (weightedCounts.get(vote.option) || 0) + weight);
      totalWeight += weight;
    }

    let winningOption = null;
    let maxWeight = 0;
    
    for (const [option, weight] of weightedCounts) {
      if (weight > maxWeight) {
        maxWeight = weight;
        winningOption = option;
      }
    }

    const threshold = totalWeight * 0.5;

    return {
      outcome: maxWeight > threshold ? winningOption : 'no_decision',
      weightedCounts: Object.fromEntries(weightedCounts),
      totalWeight,
      threshold,
      consensusLevel: maxWeight / totalWeight,
      strategy: 'expertise_weighted'
    };
  }

  calculateExpertiseWeight(agent, decision) {
    let weight = 1.0;
    
    // Factor in relevant capabilities
    if (agent.capabilities) {
      const relevantCapabilities = this.getRelevantCapabilities(decision.context);
      const agentRelevantCaps = agent.capabilities.filter(cap => 
        relevantCapabilities.includes(cap)
      );
      weight += agentRelevantCaps.length * 0.2;
    }

    // Factor in agent type
    if (agent.type === 'specialist') {
      weight += 0.3;
    }

    return Math.min(2.0, weight);
  }

  getRelevantCapabilities(context) {
    // Extract relevant capabilities from decision context
    const capabilities = [];
    
    if (context.includes('technical')) {capabilities.push('technical');}
    if (context.includes('design')) {capabilities.push('design');}
    if (context.includes('strategy')) {capabilities.push('strategy');}
    if (context.includes('security')) {capabilities.push('security');}
    
    return capabilities;
  }
}

module.exports = {
  CollaborativeDecisionEngine,
  CollaborativeDecision,
  SimpleMajorityStrategy,
  QualifiedMajorityStrategy,
  ConsensusStrategy,
  ConsciousnessWeightedStrategy,
  ExpertiseWeightedStrategy
};