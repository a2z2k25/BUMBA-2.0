/**
 * BUMBA Specialist Awareness Mixin
 * Provides awareness capabilities for department managers
 */

const registry = require('../specialists/specialist-registry');
const { activator } = require('../specialists/specialist-activator');
const { logger } = require('../logging/bumba-logger');

class SpecialistAwarenessMixin {
  /**
   * Get all available specialists for this department
   */
  getAvailableSpecialists() {
    const specialists = [];
    
    // Get from internal specialist map
    if (this.specialists && this.specialists instanceof Map) {
      this.specialists.forEach((value, key) => {
        specialists.push(key);
      });
    }
    
    // Also check registry for category matches
    if (this.category) {
      const categorySpecs = registry.getSpecialistsByCategory(this.category);
      categorySpecs.forEach(spec => {
        if (!specialists.includes(spec.type)) {
          specialists.push(spec.type);
        }
      });
    }
    
    return specialists;
  }
  
  /**
   * Get detailed context about a specialist
   */
  getSpecialistContext(specialistType) {
    try {
      // Try to get from registry first
      const registryInfo = registry.getSpecialist(specialistType);
      
      // Try to get capabilities
      const capabilities = registry.getSpecialistCapabilities(specialistType);
      
      // Try to activate to get full context
      let activated = null;
      try {
        activated = activator.activateSpecialist(specialistType);
      } catch (e) {
        // Silent fail - specialist might not be fully configured
      }
      
      return {
        type: specialistType,
        name: registryInfo?.name || specialistType,
        category: registryInfo?.category,
        subcategory: registryInfo?.subcategory,
        keywords: registryInfo?.keywords || [],
        expertise: registryInfo?.expertise || activated?.expertise || {},
        capabilities: capabilities || activated?.capabilities || [],
        bestPractices: activated?.bestPractices || [],
        codePatterns: activated?.codePatterns || {},
        available: true
      };
    } catch (error) {
      logger.debug(`Could not get context for ${specialistType}: ${error.message}`);
      return {
        type: specialistType,
        available: false,
        error: error.message
      };
    }
  }
  
  /**
   * Find specialists suitable for a task
   */
  findSpecialistsForTask(taskDescription) {
    const suitable = [];
    
    // Use registry's task finder
    const registryMatches = registry.findSpecialistsForTask(taskDescription);
    registryMatches.forEach(spec => suitable.push(spec));
    
    // Also check internal specialists
    if (this.specialists) {
      const taskWords = taskDescription.toLowerCase().split(' ');
      this.specialists.forEach((value, key) => {
        const context = this.getSpecialistContext(key);
        if (context && context.keywords) {
          const matches = context.keywords.some(keyword => 
            taskWords.includes(keyword.toLowerCase())
          );
          if (matches && !suitable.find(s => s.type === key)) {
            suitable.push({ type: key, ...context });
          }
        }
      });
    }
    
    return suitable;
  }
  
  /**
   * Activate a specialist with context
   */
  async activateSpecialist(specialistType) {
    try {
      // Log activation for awareness tracking
      logger.info(`${this.name || 'Manager'} activating specialist: ${specialistType}`);
      
      // Get context first
      const context = this.getSpecialistContext(specialistType);
      
      // Activate specialist
      const specialist = await activator.activateSpecialist(specialistType);
      
      // Enhance with department context
      if (specialist && this.departmentContext) {
        specialist.departmentContext = this.departmentContext;
      }
      
      // Track activation
      if (!this.activationHistory) {
        this.activationHistory = [];
      }
      this.activationHistory.push({
        type: specialistType,
        timestamp: Date.now(),
        success: true
      });
      
      return specialist;
    } catch (error) {
      logger.error(`Failed to activate ${specialistType}: ${error.message}`);
      
      // Track failure
      if (!this.activationHistory) {
        this.activationHistory = [];
      }
      this.activationHistory.push({
        type: specialistType,
        timestamp: Date.now(),
        success: false,
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Get specialist recommendations for a task
   */
  getSpecialistRecommendations(task, limit = 5) {
    const recommendations = [];
    
    // Get task matches
    const matches = this.findSpecialistsForTask(task);
    
    // Score and rank matches
    matches.forEach(match => {
      let score = 0;
      
      // Score based on category match
      if (match.category === this.category) score += 3;
      
      // Score based on keyword matches
      const taskWords = task.toLowerCase().split(' ');
      if (match.keywords) {
        match.keywords.forEach(keyword => {
          if (taskWords.includes(keyword.toLowerCase())) score += 1;
        });
      }
      
      // Score based on capabilities
      if (match.capabilities && match.capabilities.length > 0) {
        score += Math.min(match.capabilities.length / 5, 2);
      }
      
      recommendations.push({
        ...match,
        score,
        confidence: Math.min(score / 10, 1.0)
      });
    });
    
    // Sort by score and return top matches
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  /**
   * Get specialist workload and availability
   */
  getSpecialistAvailability() {
    const availability = {};
    
    const specialists = this.getAvailableSpecialists();
    specialists.forEach(spec => {
      // Check activation history
      const recentActivations = (this.activationHistory || [])
        .filter(a => a.type === spec && a.timestamp > Date.now() - 3600000); // Last hour
      
      availability[spec] = {
        type: spec,
        available: true,
        recentActivations: recentActivations.length,
        lastActivation: recentActivations[0]?.timestamp || null,
        estimatedLoad: recentActivations.length > 5 ? 'high' : 
                      recentActivations.length > 2 ? 'medium' : 'low'
      };
    });
    
    return availability;
  }
  
  /**
   * Create specialist collaboration team
   */
  async createCollaborationTeam(specialists) {
    const team = {
      specialists: [],
      capabilities: new Set(),
      expertise: {},
      created: Date.now()
    };
    
    for (const specType of specialists) {
      try {
        const specialist = await this.activateSpecialist(specType);
        team.specialists.push(specialist);
        
        // Aggregate capabilities
        if (specialist.capabilities) {
          specialist.capabilities.forEach(cap => team.capabilities.add(cap));
        }
        
        // Merge expertise
        if (specialist.expertise) {
          Object.assign(team.expertise, specialist.expertise);
        }
      } catch (error) {
        logger.warn(`Could not add ${specType} to team: ${error.message}`);
      }
    }
    
    team.capabilities = Array.from(team.capabilities);
    return team;
  }
}

module.exports = SpecialistAwarenessMixin;