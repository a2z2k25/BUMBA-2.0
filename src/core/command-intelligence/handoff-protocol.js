/**
 * BUMBA Handoff Protocol
 * Manages data handoff between departments
 */

const { logger } = require('../logging/bumba-logger');

class HandoffProtocol {
  constructor() {
    this.handoffs = new Map();
    this.handoffQueue = [];
  }

  /**
   * Create handoff package between departments
   */
  createHandoff(fromDept, toDept, data) {
    const handoffId = `handoff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const handoffPackage = {
      id: handoffId,
      from: fromDept,
      to: toDept,
      timestamp: new Date().toISOString(),
      status: 'pending',
      data: this.packageData(data),
      metadata: {
        version: '1.0',
        protocol: 'bumba-handoff',
        priority: this.determinePriority(data)
      }
    };
    
    this.handoffs.set(handoffId, handoffPackage);
    this.handoffQueue.push(handoffPackage);
    
    logger.info(`📦 Created handoff ${handoffId}: ${fromDept} → ${toDept}`);
    
    return handoffPackage;
  }

  /**
   * Package data for handoff
   */
  packageData(data) {
    return {
      // Core deliverables
      deliverables: data.deliverables || {},
      
      // Requirements from product
      requirements: data.requirements || null,
      userStories: data.userStories || null,
      acceptanceCriteria: data.acceptanceCriteria || null,
      
      // Design artifacts
      designs: data.designs || null,
      wireframes: data.wireframes || null,
      components: data.components || null,
      styleGuide: data.styleGuide || null,
      
      // Technical specifications
      apiSpec: data.apiSpec || null,
      dataModel: data.dataModel || null,
      architecture: data.architecture || null,
      infrastructure: data.infrastructure || null,
      
      // Testing artifacts
      testPlan: data.testPlan || null,
      testCases: data.testCases || null,
      validationResults: data.validationResults || null,
      
      // Context and metadata
      context: data.context || {},
      insights: data.insights || [],
      recommendations: data.recommendations || [],
      concerns: data.concerns || []
    };
  }

  /**
   * Receive handoff at department
   */
  receiveHandoff(handoffId, receivingDept) {
    const handoff = this.handoffs.get(handoffId);
    
    if (!handoff) {
      throw new Error(`Handoff ${handoffId} not found`);
    }
    
    if (handoff.to !== receivingDept) {
      throw new Error(`Handoff ${handoffId} is for ${handoff.to}, not ${receivingDept}`);
    }
    
    // Update status
    handoff.status = 'received';
    handoff.receivedAt = new Date().toISOString();
    
    logger.info(`✅ Department ${receivingDept} received handoff ${handoffId}`);
    
    // Extract relevant data for department
    return this.extractRelevantData(handoff.data, receivingDept);
  }

  /**
   * Extract data relevant to receiving department
   */
  extractRelevantData(data, department) {
    const relevantData = {
      context: data.context,
      insights: data.insights,
      recommendations: data.recommendations,
      concerns: data.concerns
    };
    
    switch(department) {
      case 'design':
        // Design needs requirements and user stories
        relevantData.requirements = data.requirements;
        relevantData.userStories = data.userStories;
        relevantData.acceptanceCriteria = data.acceptanceCriteria;
        break;
        
      case 'backend':
        // Backend needs requirements and design specs
        relevantData.requirements = data.requirements;
        relevantData.acceptanceCriteria = data.acceptanceCriteria;
        relevantData.apiSpec = data.apiSpec;
        relevantData.dataModel = data.dataModel;
        break;
        
      case 'testing':
        // Testing needs everything for validation
        Object.assign(relevantData, data);
        break;
        
      default:
        // Give all data by default
        Object.assign(relevantData, data);
    }
    
    return relevantData;
  }

  /**
   * Complete handoff
   */
  completeHandoff(handoffId, results) {
    const handoff = this.handoffs.get(handoffId);
    
    if (!handoff) {
      throw new Error(`Handoff ${handoffId} not found`);
    }
    
    handoff.status = 'completed';
    handoff.completedAt = new Date().toISOString();
    handoff.results = results;
    
    // Remove from queue
    const queueIndex = this.handoffQueue.findIndex(h => h.id === handoffId);
    if (queueIndex !== -1) {
      this.handoffQueue.splice(queueIndex, 1);
    }
    
    logger.info(`✔️ Handoff ${handoffId} completed`);
    
    return handoff;
  }

  /**
   * Get pending handoffs for department
   */
  getPendingHandoffs(department) {
    return this.handoffQueue.filter(h => 
      h.to === department && h.status === 'pending'
    );
  }

  /**
   * Determine handoff priority
   */
  determinePriority(data) {
    // Critical if has security concerns
    if (data.concerns && data.concerns.some(c => 
      c.toLowerCase().includes('security') || 
      c.toLowerCase().includes('critical')
    )) {
      return 'critical';
    }
    
    // High if has many requirements
    if (data.requirements && data.requirements.length > 5) {
      return 'high';
    }
    
    return 'normal';
  }

  /**
   * Create chain of handoffs for workflow
   */
  createHandoffChain(departments, initialData) {
    const chain = [];
    
    for (let i = 0; i < departments.length - 1; i++) {
      const fromDept = departments[i];
      const toDept = departments[i + 1];
      
      const handoff = this.createHandoff(fromDept, toDept, initialData);
      chain.push(handoff);
      
      // Update initial data for next handoff
      initialData = {
        ...initialData,
        previousHandoff: handoff.id
      };
    }
    
    return {
      chainId: `chain_${Date.now()}`,
      handoffs: chain,
      departments,
      totalHandoffs: chain.length
    };
  }

  /**
   * Get handoff metrics
   */
  getMetrics() {
    const metrics = {
      total: this.handoffs.size,
      pending: 0,
      received: 0,
      completed: 0,
      averageTime: 0
    };
    
    let totalTime = 0;
    let completedCount = 0;
    
    this.handoffs.forEach(handoff => {
      metrics[handoff.status]++;
      
      if (handoff.status === 'completed' && handoff.completedAt) {
        const duration = new Date(handoff.completedAt) - new Date(handoff.timestamp);
        totalTime += duration;
        completedCount++;
      }
    });
    
    if (completedCount > 0) {
      metrics.averageTime = Math.round(totalTime / completedCount / 1000); // in seconds
    }
    
    return metrics;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  HandoffProtocol,
  getInstance: () => {
    if (!instance) {
      instance = new HandoffProtocol();
    }
    return instance;
  }
};