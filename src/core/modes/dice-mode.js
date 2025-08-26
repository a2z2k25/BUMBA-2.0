/**
 * BUMBA DICE Mode 🟢
 * Random agent combinations for creative problem solving
 * "Roll the dice and see what happens!"
 */

const { EventEmitter } = require('events');

class DiceMode extends EventEmitter {
  constructor(bumbaInstance) {
    super();
    
    this.bumba = bumbaInstance;
    this.active = false;
    
    // DICE configuration
    this.config = {
      minAgents: 2, // Minimum agents per roll
      maxAgents: 7, // Maximum agents per roll
      allowDuplicates: false, // Can same agent appear twice?
      chaosLevel: 0.5, // 0-1: How wild should combinations be?
      rerollLimit: 3, // Max rerolls if user doesn't like combo
      luckyNumber: 7 // Rolling this many agents triggers special mode
    };
    
    // Track rolls and outcomes
    this.rollHistory = [];
    this.currentRoll = null;
    this.rollStats = {
      totalRolls: 0,
      successfulRolls: 0,
      rerolls: 0,
      luckyRolls: 0,
      bestCombo: null,
      worstCombo: null
    };
    
    // Special dice combinations with bonuses
    this.specialCombos = {
      'full_house': {
        pattern: ['strategic', 'strategic', 'strategic', 'experience', 'experience'],
        bonus: 'Perfect alignment - 2x consciousness boost'
      },
      'rainbow': {
        pattern: ['strategic', 'experience', 'technical', 'strategic', 'experience', 'technical'],
        bonus: 'Full spectrum coverage - Unlocks hidden insights'
      },
      'lucky_seven': {
        count: 7,
        bonus: '🟢 LUCKY ROLL! All agents work in perfect harmony'
      },
      'snake_eyes': {
        count: 2,
        bonus: 'Minimal team - Maximum focus'
      },
      'chaos_storm': {
        // All different departments, max agents
        checker: (agents) => agents.length >= 6 && new Set(agents.map(a => a.department)).size >= 3,
        bonus: '🟢️ CHAOS STORM! Unpredictable brilliance incoming'
      }
    };
  }

  /**
   * Activate DICE Mode
   */
  async activate(options = {}) {
    if (this.active) {
      return { success: true, message: '🟢 DICE mode already rolling!' };
    }

    this.config = { ...this.config, ...options };
    
    // Store original agent coordinator state
    this.originalCoordinator = this.bumba.agentCoordinator?.getState();
    
    // Enable DICE coordination
    if (this.bumba.agentCoordinator) {
      this.bumba.agentCoordinator.setMode('dice');
    }
    
    this.active = true;
    this.emit('activated', { 
      timestamp: Date.now(),
      message: '🟢 DICE Mode activated! Let chaos guide creativity!'
    });
    
    // Roll initial combination
    const initialRoll = await this.rollDice();
    
    return {
      success: true,
      message: '🟢 DICE Mode activated!',
      initialRoll,
      config: this.config
    };
  }

  /**
   * Deactivate DICE Mode
   */
  async deactivate() {
    if (!this.active) {
      return { success: false, message: 'DICE mode not active' };
    }

    // Restore original coordinator
    if (this.bumba.agentCoordinator && this.originalCoordinator) {
      this.bumba.agentCoordinator.setState(this.originalCoordinator);
    }
    
    this.active = false;
    this.currentRoll = null;
    
    this.emit('deactivated', { 
      timestamp: Date.now(),
      stats: this.rollStats
    });
    
    return {
      success: true,
      message: '🟢 DICE Mode deactivated',
      finalStats: this.rollStats
    };
  }

  /**
   * Roll the dice for a new agent combination
   */
  async rollDice(options = {}) {
    if (!this.active && !options.preview) {
      throw new Error('DICE mode not active. Activate first or use preview option.');
    }
    
    // Determine number of agents (roll 2d6 for fun)
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    let agentCount = Math.min(
      Math.max(die1 + die2 - 5, this.config.minAgents), 
      this.config.maxAgents
    );
    
    // Override with specific count if provided
    if (options.count) {
      agentCount = options.count;
    }
    
    // Get all available agents
    const allAgents = Array.from(this.bumba.agents.entries()).map(([id, agent]) => ({
      id,
      ...agent,
      department: this._getDepartment(id)
    }));
    
    // Apply chaos filter
    const eligibleAgents = this._applyChaosFilter(allAgents);
    
    // Roll for agents
    const rolledAgents = this._selectRandomAgents(eligibleAgents, agentCount);
    
    // Check for special combinations
    const specialCombo = this._checkSpecialCombo(rolledAgents);
    
    // Create roll result
    const roll = {
      id: this._generateRollId(),
      timestamp: Date.now(),
      dice: [die1, die2],
      count: agentCount,
      agents: rolledAgents,
      specialCombo,
      chaosLevel: this.config.chaosLevel,
      score: this._calculateRollScore(rolledAgents, specialCombo)
    };
    
    // Update stats
    if (!options.preview) {
      this.currentRoll = roll;
      this.rollHistory.push(roll);
      this.rollStats.totalRolls++;
      
      if (specialCombo) {
        if (specialCombo.name === 'lucky_seven') {
          this.rollStats.luckyRolls++;
        }
      }
      
      this.emit('dice-rolled', roll);
    }
    
    return this._formatRollResult(roll);
  }

  /**
   * Reroll if user doesn't like current combination
   */
  async reroll(reason = 'user_request') {
    if (!this.active) {
      throw new Error('DICE mode not active');
    }
    
    if (!this.currentRoll) {
      return await this.rollDice();
    }
    
    // Check reroll limit
    const rerollCount = this.rollHistory.filter(r => 
      r.timestamp > this.currentRoll.timestamp - 300000 // 5 min window
    ).length;
    
    if (rerollCount >= this.config.rerollLimit) {
      return {
        success: false,
        message: `🟢 Reroll limit reached (${this.config.rerollLimit}). Stick with your fate!`,
        currentRoll: this._formatRollResult(this.currentRoll)
      };
    }
    
    this.rollStats.rerolls++;
    
    // Increase chaos for rerolls
    const newRoll = await this.rollDice({
      chaosBoost: 0.1 * rerollCount
    });
    
    return {
      success: true,
      message: '🟢 Dice rerolled!',
      previousRoll: this.currentRoll.agents.map(a => a.name),
      newRoll,
      rerollsRemaining: this.config.rerollLimit - rerollCount - 1
    };
  }

  /**
   * Execute task with current dice roll
   */
  async executeWithDice(task, options = {}) {
    if (!this.active || !this.currentRoll) {
      throw new Error('No active dice roll. Roll first!');
    }
    
    const startTime = Date.now();
    
    // Special combo effects
    let modifiedTask = { ...task };
    if (this.currentRoll.specialCombo) {
      modifiedTask = this._applyComboEffects(modifiedTask, this.currentRoll.specialCombo);
    }
    
    // Execute with rolled agents
    const results = [];
    const errors = [];
    
    for (const agent of this.currentRoll.agents) {
      try {
        const result = await this._executeWithAgent(agent, modifiedTask);
        results.push({
          agent: agent.name,
          success: true,
          output: result
        });
      } catch (error) {
        errors.push({
          agent: agent.name,
          error: error.message
        });
      }
    }
    
    // Calculate success
    const successRate = results.length / this.currentRoll.agents.length;
    const success = successRate > 0.5;
    
    // Update roll stats
    if (success) {
      this.rollStats.successfulRolls++;
    }
    
    // Update best/worst combos
    this._updateComboStats(this.currentRoll, successRate);
    
    const duration = Date.now() - startTime;
    
    return {
      success,
      roll: this.currentRoll.id,
      agents: this.currentRoll.agents.map(a => a.name),
      results,
      errors,
      successRate,
      duration,
      specialCombo: this.currentRoll.specialCombo,
      message: this._generateOutcomeMessage(successRate, this.currentRoll.specialCombo)
    };
  }

  /**
   * Get statistics about DICE mode usage
   */
  getStats() {
    const avgAgentsPerRoll = this.rollHistory.length > 0
      ? this.rollHistory.reduce((sum, r) => sum + r.count, 0) / this.rollHistory.length
      : 0;
    
    const successRate = this.rollStats.totalRolls > 0
      ? this.rollStats.successfulRolls / this.rollStats.totalRolls
      : 0;
    
    return {
      ...this.rollStats,
      avgAgentsPerRoll,
      successRate,
      currentRoll: this.currentRoll ? this._formatRollResult(this.currentRoll) : null,
      recentRolls: this.rollHistory.slice(-5).map(r => this._formatRollResult(r)),
      specialCombosHit: this.rollHistory.filter(r => r.specialCombo).length,
      chaosLevel: this.config.chaosLevel
    };
  }

  /**
   * Adjust chaos level
   */
  setChaosLevel(level) {
    this.config.chaosLevel = Math.max(0, Math.min(1, level));
    this.emit('chaos-adjusted', { 
      level: this.config.chaosLevel,
      description: this._getChaosDescription(this.config.chaosLevel)
    });
  }

  /**
   * Helper methods
   */
  
  _getDepartment(agentId) {
    const departmentMap = {
      strategic: ['product-strategist', 'market-researcher', 'business-model-strategist'],
      experience: ['ui-designer', 'ux-researcher', 'design-system-architect'],
      technical: ['backend-engineer', 'api-architect', 'database-architect']
    };
    
    for (const [dept, agents] of Object.entries(departmentMap)) {
      if (agents.some(a => agentId.includes(a))) {
        return dept;
      }
    }
    return 'unknown';
  }

  _applyChaosFilter(agents) {
    if (this.config.chaosLevel === 0) {
      // No chaos - only compatible agents
      return agents.filter(a => !a.experimental && !a.deprecated);
    }
    
    if (this.config.chaosLevel === 1) {
      // Maximum chaos - all agents eligible
      return agents;
    }
    
    // Partial chaos - random filtering
    return agents.filter(() => Math.random() > (1 - this.config.chaosLevel));
  }

  _selectRandomAgents(agents, count) {
    const selected = [];
    const available = [...agents];
    
    for (let i = 0; i < count && available.length > 0; i++) {
      const index = Math.floor(Math.random() * available.length);
      const agent = available[index];
      selected.push(agent);
      
      if (!this.config.allowDuplicates) {
        available.splice(index, 1);
      }
    }
    
    return selected;
  }

  _checkSpecialCombo(agents) {
    // Check lucky seven
    if (agents.length === 7) {
      return {
        name: 'lucky_seven',
        ...this.specialCombos.lucky_seven
      };
    }
    
    // Check snake eyes
    if (agents.length === 2) {
      return {
        name: 'snake_eyes',
        ...this.specialCombos.snake_eyes
      };
    }
    
    // Check chaos storm
    if (this.specialCombos.chaos_storm.checker(agents)) {
      return {
        name: 'chaos_storm',
        ...this.specialCombos.chaos_storm
      };
    }
    
    // Check department patterns
    const deptCounts = agents.reduce((acc, agent) => {
      acc[agent.department] = (acc[agent.department] || 0) + 1;
      return acc;
    }, {});
    
    // Check for rainbow (2 of each department)
    if (Object.keys(deptCounts).length === 3 && 
        Object.values(deptCounts).every(c => c === 2)) {
      return {
        name: 'rainbow',
        ...this.specialCombos.rainbow
      };
    }
    
    return null;
  }

  _calculateRollScore(agents, specialCombo) {
    let score = agents.length * 10;
    
    // Department diversity bonus
    const departments = new Set(agents.map(a => a.department));
    score += departments.size * 20;
    
    // Special combo bonus
    if (specialCombo) {
      score += 50;
    }
    
    // Chaos bonus
    score += Math.floor(this.config.chaosLevel * 30);
    
    return score;
  }

  _formatRollResult(roll) {
    const agentList = roll.agents.map(a => `${this._getAgentEmoji(a.department)} ${a.name}`);
    
    return {
      roll: `${roll.dice[0]}+${roll.dice[1]} = ${roll.count} agents`,
      agents: agentList,
      departments: this._getDepartmentBreakdown(roll.agents),
      specialCombo: roll.specialCombo ? {
        name: roll.specialCombo.name,
        bonus: roll.specialCombo.bonus
      } : null,
      score: roll.score,
      visualization: this._visualizeDiceRoll(roll)
    };
  }

  _getAgentEmoji(department) {
    const emojis = {
      strategic: '🟢',
      experience: '🟢',
      technical: '🟢',
      unknown: '🟢'
    };
    return emojis[department] || '🟢';
  }

  _getDepartmentBreakdown(agents) {
    const breakdown = agents.reduce((acc, agent) => {
      acc[agent.department] = (acc[agent.department] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(breakdown)
      .map(([dept, count]) => `${dept}: ${count}`)
      .join(', ');
  }

  _visualizeDiceRoll(roll) {
    const dice1 = ['🟢', '🟢', '🟢', '🟢', '🟢', '🟢'][roll.dice[0] - 1];
    const dice2 = ['🟢', '🟢', '🟢', '🟢', '🟢', '🟢'][roll.dice[1] - 1];
    
    return `${dice1} ${dice2}`;
  }

  _applyComboEffects(task, combo) {
    const effects = {
      'lucky_seven': {
        ...task,
        consciousness_multiplier: 2,
        harmony_mode: true
      },
      'chaos_storm': {
        ...task,
        experimental_features: true,
        constraint_removal: true
      },
      'rainbow': {
        ...task,
        cross_department_insights: true,
        holistic_approach: true
      }
    };
    
    return effects[combo.name] || task;
  }

  _executeWithAgent(agent, task) {
    // Simulate agent execution with DICE randomness
    return new Promise((resolve) => {
      setTimeout(() => {
        const diceRoll = Math.random();
        if (diceRoll < 0.1) {
          // Critical fail
          throw new Error(`${agent.name} rolled a 1! Critical failure!`);
        } else if (diceRoll > 0.9) {
          // Critical success
          resolve({
            output: `🟢 CRITICAL SUCCESS! ${agent.name} exceeded all expectations!`,
            bonus: true
          });
        } else {
          // Normal execution
          resolve({
            output: `${agent.name} completed task with DICE guidance`,
            success: true
          });
        }
      }, Math.random() * 1000 + 500);
    });
  }

  _updateComboStats(roll, successRate) {
    const comboKey = roll.agents.map(a => a.id).sort().join('-');
    
    if (!this.rollStats.bestCombo || successRate > this.rollStats.bestCombo.successRate) {
      this.rollStats.bestCombo = {
        agents: roll.agents.map(a => a.name),
        successRate,
        roll: roll.id
      };
    }
    
    if (!this.rollStats.worstCombo || successRate < this.rollStats.worstCombo.successRate) {
      this.rollStats.worstCombo = {
        agents: roll.agents.map(a => a.name),
        successRate,
        roll: roll.id
      };
    }
  }

  _generateOutcomeMessage(successRate, specialCombo) {
    if (specialCombo) {
      return `🟢 ${specialCombo.bonus} Result: ${Math.round(successRate * 100)}% success!`;
    }
    
    if (successRate === 1) {
      return '🟢 PERFECT ROLL! All agents succeeded!';
    } else if (successRate > 0.8) {
      return '🟢 Great roll! High success rate achieved.';
    } else if (successRate > 0.5) {
      return '🟢 Decent roll. More successes than failures.';
    } else if (successRate > 0) {
      return '🟢 Tough roll. Some successes despite challenges.';
    } else {
      return '🟢 Snake eyes! Complete failure. Try rerolling?';
    }
  }

  _getChaosDescription(level) {
    if (level === 0) {return 'Order - Predictable combinations';}
    if (level < 0.3) {return 'Mild - Mostly sensible with surprises';}
    if (level < 0.7) {return 'Wild - Anything can happen';}
    if (level < 1) {return 'Chaotic - Embrace the madness';}
    return 'MAXIMUM CHAOS - 🟢️ Hold onto your hat!';
  }

  _generateRollId() {
    return `dice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = DiceMode;