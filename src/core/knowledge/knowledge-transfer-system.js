/**
 * BUMBA Knowledge Transfer System
 * Manages knowledge flow between models, sessions, and agents
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { getInstance: getConfig } = require('../config/bumba-config');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class KnowledgeTransferSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Load configuration with environment overrides
    const bumbaConfig = getConfig();
    
    this.config = {
      knowledgeDir: config.knowledgeDir || 
                   process.env.BUMBA_KNOWLEDGE_DIR || 
                   path.join(os.homedir(), '.bumba', 'knowledge'),
      maxKnowledgeAge: config.maxKnowledgeAge || 
                      parseInt(process.env.BUMBA_KNOWLEDGE_MAX_AGE) || 
                      30 * 24 * 60 * 60 * 1000, // 30 days
      compressionThreshold: config.compressionThreshold || 
                           parseInt(process.env.BUMBA_KNOWLEDGE_COMPRESSION) || 
                           1000, // Compress after 1000 entries
      transferStrategies: config.transferStrategies || ['direct', 'summarized', 'indexed'],
      autoSave: config.autoSave !== false,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000
    };
    
    // Knowledge stores
    this.stores = {
      decisions: new Map(), // Architectural decisions
      patterns: new Map(), // Successful patterns
      corrections: new Map(), // Claude's corrections
      improvements: new Map(), // Claude's improvements
      failures: new Map(), // What didn't work
      context: new Map() // Project-specific context
    };
    
    // Knowledge index for fast retrieval
    this.knowledgeIndex = {
      byTag: new Map(),
      byModel: new Map(),
      byTimestamp: new Map(),
      byImportance: new Map()
    };
    
    // Transfer metrics
    this.metrics = {
      transfersCompleted: 0,
      knowledgeReused: 0,
      compressionsSaved: 0,
      retrievalHits: 0,
      retrievalMisses: 0
    };
    
    this.initialize();
  }
  
  /**
   * Initialize knowledge system
   */
  async initialize() {
    try {
      // Ensure knowledge directory exists
      await fs.mkdir(this.config.knowledgeDir, { recursive: true });
      
      // Load existing knowledge
      await this.loadPersistedKnowledge();
      
      logger.info('🏁 Knowledge Transfer System initialized');
      return true;
    } catch (error) {
      logger.error('🔴 Failed to initialize Knowledge Transfer System:', error);
      return false;
    }
  }
  
  /**
   * Transfer knowledge from ancillary models to Claude
   * This is how Claude learns from Gemini/GPT outputs
   */
  async transferToSupervisor(ancillaryResults, task) {
    logger.info('🟢 Transferring knowledge to supervisor');
    
    const knowledgePackage = {
      task: task.description || task,
      timestamp: Date.now(),
      sources: [],
      patterns: [],
      concerns: [],
      context: await this.gatherRelevantContext(task)
    };
    
    // Extract knowledge from each ancillary result
    for (const result of ancillaryResults) {
      if (!result.success) {continue;}
      
      const extraction = this.extractKnowledge(result);
      
      knowledgePackage.sources.push({
        model: result.model || result.agent,
        content: result.result || result.content,
        extracted: extraction,
        confidence: result.confidence || 0.5
      });
      
      // Identify patterns
      if (extraction.patterns.length > 0) {
        knowledgePackage.patterns.push(...extraction.patterns);
      }
      
      // Identify concerns for Claude to address
      if (extraction.concerns.length > 0) {
        knowledgePackage.concerns.push(...extraction.concerns);
      }
    }
    
    // Add historical knowledge
    knowledgePackage.history = await this.getRelevantHistory(task);
    
    // Add previous Claude decisions
    knowledgePackage.previousDecisions = await this.getPreviousDecisions(task);
    
    this.metrics.transfersCompleted++;
    
    return knowledgePackage;
  }
  
  /**
   * Transfer knowledge from Claude back to the system
   * This is how Claude's improvements are learned
   */
  async transferFromSupervisor(claudeReview, originalTask, ancillaryResults) {
    logger.info('🟢 Receiving knowledge from supervisor');
    
    const knowledge = {
      id: `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      task: originalTask,
      
      // What Claude learned
      improvements: claudeReview.improvements || [],
      corrections: claudeReview.corrections || [],
      decision: claudeReview.decision,
      confidence: claudeReview.confidence,
      
      // Why Claude made these decisions
      reasoning: claudeReview.explanation || claudeReview.reasoning,
      
      // What worked and what didn't
      approved: claudeReview.approved,
      rejectedApproaches: [],
      preferredPatterns: [],
      
      // Meta information
      supervisionStrategy: claudeReview.strategy,
      ancillaryModels: ancillaryResults.map(r => r.model || r.agent)
    };
    
    // Store corrections for future reference
    if (claudeReview.corrections && claudeReview.corrections.length > 0) {
      await this.storeCorrections(knowledge);
    }
    
    // Store successful patterns
    if (claudeReview.approved && claudeReview.improvedVersion) {
      await this.storeSuccessfulPattern(knowledge);
    }
    
    // Store failures to avoid
    if (!claudeReview.approved) {
      await this.storeFailure(knowledge);
    }
    
    // Update decision history
    await this.storeDecision(knowledge);
    
    // Persist to disk
    await this.persistKnowledge(knowledge);
    
    return knowledge;
  }
  
  /**
   * Extract knowledge from ancillary model output
   */
  extractKnowledge(result) {
    const content = result.result || result.content || '';
    
    const extraction = {
      patterns: [],
      concerns: [],
      keywords: [],
      entities: [],
      decisions: []
    };
    
    // Extract code patterns
    const codePatterns = content.match(/```[\s\S]*?```/g) || [];
    extraction.patterns.push(...codePatterns.map(p => ({
      type: 'code',
      content: p,
      source: result.model || result.agent
    })));
    
    // Extract potential security concerns
    const securityKeywords = ['password', 'token', 'key', 'auth', 'security', 'vulnerability'];
    const hasSecurity = securityKeywords.some(kw => 
      content.toLowerCase().includes(kw)
    );
    
    if (hasSecurity) {
      extraction.concerns.push({
        type: 'security',
        reason: 'Contains security-related content',
        requiresReview: true
      });
    }
    
    // Extract architectural decisions
    const decisionPhrases = [
      /should use ([^.]+)/gi,
      /recommend ([^.]+)/gi,
      /best practice is ([^.]+)/gi,
      /approach: ([^.]+)/gi
    ];
    
    decisionPhrases.forEach(pattern => {
      const matches = content.match(pattern) || [];
      extraction.decisions.push(...matches);
    });
    
    // Extract key entities (technologies, frameworks, etc.)
    const techPatterns = [
      /\b(React|Vue|Angular|Node|Python|Docker|Kubernetes|AWS|Azure|GCP)\b/gi,
      /\b(PostgreSQL|MongoDB|Redis|MySQL|DynamoDB)\b/gi,
      /\b(JWT|OAuth|SAML|API|REST|GraphQL|WebSocket)\b/gi
    ];
    
    techPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      extraction.entities.push(...matches);
    });
    
    return extraction;
  }
  
  /**
   * Gather relevant context for the task
   */
  async gatherRelevantContext(task) {
    const context = {
      projectContext: {},
      relevantDecisions: [],
      applicablePatterns: [],
      relatedCorrections: []
    };
    
    // Search for related decisions
    for (const [key, decision] of this.stores.decisions) {
      if (this.isRelated(task, decision.task)) {
        context.relevantDecisions.push(decision);
      }
    }
    
    // Search for applicable patterns
    for (const [key, pattern] of this.stores.patterns) {
      if (this.isApplicable(task, pattern)) {
        context.applicablePatterns.push(pattern);
        this.metrics.knowledgeReused++;
      }
    }
    
    // Search for related corrections
    for (const [key, correction] of this.stores.corrections) {
      if (this.isRelated(task, correction.task)) {
        context.relatedCorrections.push(correction);
      }
    }
    
    // Load project-specific context
    try {
      const claudeMdPath = path.join(process.cwd(), 'CLAUDE.md');
      const claudeMd = await fs.readFile(claudeMdPath, 'utf-8');
      context.projectContext = this.parseClaudeMd(claudeMd);
    } catch (error) {
      // No CLAUDE.md file
    }
    
    return context;
  }
  
  /**
   * Get relevant history for the task
   */
  async getRelevantHistory(task) {
    const history = [];
    const taskKeywords = this.extractKeywords(task);
    
    // Search through all stores
    for (const [storeName, store] of Object.entries(this.stores)) {
      for (const [key, entry] of store) {
        if (this.calculateRelevance(taskKeywords, entry) > 0.5) {
          history.push({
            type: storeName,
            entry: entry,
            relevance: this.calculateRelevance(taskKeywords, entry)
          });
        }
      }
    }
    
    // Sort by relevance and recency
    history.sort((a, b) => {
      const relevanceDiff = b.relevance - a.relevance;
      if (Math.abs(relevanceDiff) > 0.1) {return relevanceDiff;}
      return b.entry.timestamp - a.entry.timestamp;
    });
    
    // Return top 10 most relevant
    return history.slice(0, 10);
  }
  
  /**
   * Get previous Claude decisions on similar tasks
   */
  async getPreviousDecisions(task) {
    const decisions = [];
    
    for (const [key, decision] of this.stores.decisions) {
      if (decision.supervisor === 'claude' && this.isRelated(task, decision.task)) {
        decisions.push(decision);
      }
    }
    
    return decisions;
  }
  
  /**
   * Store corrections made by Claude
   */
  async storeCorrections(knowledge) {
    const correctionKey = `correction_${knowledge.id}`;
    
    this.stores.corrections.set(correctionKey, {
      ...knowledge,
      type: 'correction',
      tags: this.extractKeywords(knowledge.task)
    });
    
    // Index for fast retrieval
    this.indexKnowledge(correctionKey, knowledge);
  }
  
  /**
   * Store successful patterns
   */
  async storeSuccessfulPattern(knowledge) {
    const patternKey = `pattern_${knowledge.id}`;
    
    this.stores.patterns.set(patternKey, {
      ...knowledge,
      type: 'successful_pattern',
      useCount: 1,
      lastUsed: Date.now(),
      tags: this.extractKeywords(knowledge.task)
    });
    
    this.indexKnowledge(patternKey, knowledge);
  }
  
  /**
   * Store failures to avoid
   */
  async storeFailure(knowledge) {
    const failureKey = `failure_${knowledge.id}`;
    
    this.stores.failures.set(failureKey, {
      ...knowledge,
      type: 'failure',
      reason: knowledge.reasoning,
      tags: this.extractKeywords(knowledge.task)
    });
    
    this.indexKnowledge(failureKey, knowledge);
  }
  
  /**
   * Store decision for history
   */
  async storeDecision(knowledge) {
    const decisionKey = `decision_${knowledge.id}`;
    
    this.stores.decisions.set(decisionKey, {
      ...knowledge,
      type: 'decision',
      supervisor: 'claude',
      tags: this.extractKeywords(knowledge.task)
    });
    
    this.indexKnowledge(decisionKey, knowledge);
  }
  
  /**
   * Index knowledge for fast retrieval
   */
  indexKnowledge(key, knowledge) {
    // Index by tags
    const tags = knowledge.tags || this.extractKeywords(knowledge.task);
    tags.forEach(tag => {
      if (!this.knowledgeIndex.byTag.has(tag)) {
        this.knowledgeIndex.byTag.set(tag, new Set());
      }
      this.knowledgeIndex.byTag.get(tag).add(key);
    });
    
    // Index by model
    const models = knowledge.ancillaryModels || [];
    models.forEach(model => {
      if (!this.knowledgeIndex.byModel.has(model)) {
        this.knowledgeIndex.byModel.set(model, new Set());
      }
      this.knowledgeIndex.byModel.get(model).add(key);
    });
    
    // Index by timestamp
    const dateKey = new Date(knowledge.timestamp).toISOString().split('T')[0];
    if (!this.knowledgeIndex.byTimestamp.has(dateKey)) {
      this.knowledgeIndex.byTimestamp.set(dateKey, new Set());
    }
    this.knowledgeIndex.byTimestamp.get(dateKey).add(key);
    
    // Index by importance
    const importance = knowledge.confidence || 0.5;
    const importanceKey = importance >= 0.8 ? 'high' : importance >= 0.5 ? 'medium' : 'low';
    if (!this.knowledgeIndex.byImportance.has(importanceKey)) {
      this.knowledgeIndex.byImportance.set(importanceKey, new Set());
    }
    this.knowledgeIndex.byImportance.get(importanceKey).add(key);
  }
  
  /**
   * Persist knowledge to disk
   */
  async persistKnowledge(knowledge) {
    try {
      const filename = `${knowledge.id}.json`;
      const filepath = path.join(this.config.knowledgeDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(knowledge, null, 2));
      
      logger.info(`🟢 Knowledge persisted: ${filename}`);
    } catch (error) {
      logger.error('Failed to persist knowledge:', error);
    }
  }
  
  /**
   * Load persisted knowledge from disk
   */
  async loadPersistedKnowledge() {
    try {
      const files = await fs.readdir(this.config.knowledgeDir);
      const knowledgeFiles = files.filter(f => f.endsWith('.json'));
      
      for (const file of knowledgeFiles) {
        try {
          const filepath = path.join(this.config.knowledgeDir, file);
          const content = await fs.readFile(filepath, 'utf-8');
          const knowledge = JSON.parse(content);
          
          // Restore to appropriate store
          if (knowledge.type === 'correction') {
            this.stores.corrections.set(knowledge.id, knowledge);
          } else if (knowledge.type === 'successful_pattern') {
            this.stores.patterns.set(knowledge.id, knowledge);
          } else if (knowledge.type === 'failure') {
            this.stores.failures.set(knowledge.id, knowledge);
          } else if (knowledge.type === 'decision') {
            this.stores.decisions.set(knowledge.id, knowledge);
          }
          
          // Re-index
          this.indexKnowledge(knowledge.id, knowledge);
        } catch (error) {
          logger.warn(`Failed to load knowledge file ${file}:`, error);
        }
      }
      
      logger.info(`🟢 Loaded ${knowledgeFiles.length} knowledge entries`);
    } catch (error) {
      logger.warn('No persisted knowledge found');
    }
  }
  
  /**
   * Compress old knowledge to save space
   */
  async compressOldKnowledge() {
    const now = Date.now();
    const compressionCandidates = [];
    
    for (const [storeName, store] of Object.entries(this.stores)) {
      for (const [key, entry] of store) {
        if (now - entry.timestamp > this.config.maxKnowledgeAge) {
          compressionCandidates.push({ storeName, key, entry });
        }
      }
    }
    
    if (compressionCandidates.length === 0) {return;}
    
    // Create compressed summary
    const summary = {
      id: `compressed_${Date.now()}`,
      timestamp: now,
      type: 'compressed_knowledge',
      originalCount: compressionCandidates.length,
      patterns: [],
      decisions: [],
      corrections: []
    };
    
    // Aggregate knowledge
    compressionCandidates.forEach(({ storeName, key, entry }) => {
      if (storeName === 'patterns') {
        summary.patterns.push({
          task: entry.task,
          pattern: entry.improvedVersion || entry.content
        });
      } else if (storeName === 'decisions') {
        summary.decisions.push({
          task: entry.task,
          decision: entry.decision
        });
      } else if (storeName === 'corrections') {
        summary.corrections.push({
          task: entry.task,
          correction: entry.corrections
        });
      }
      
      // Remove from store
      this.stores[storeName].delete(key);
    });
    
    // Store compressed summary
    await this.persistKnowledge(summary);
    
    this.metrics.compressionsSaved++;
    logger.info(`🟢️ Compressed ${compressionCandidates.length} old knowledge entries`);
  }
  
  /**
   * Helper: Check if task is related
   */
  isRelated(task1, task2) {
    const keywords1 = this.extractKeywords(task1);
    const keywords2 = this.extractKeywords(task2);
    
    const intersection = keywords1.filter(k => keywords2.includes(k));
    return intersection.length / Math.min(keywords1.length, keywords2.length) > 0.3;
  }
  
  /**
   * Helper: Check if pattern is applicable
   */
  isApplicable(task, pattern) {
    const taskKeywords = this.extractKeywords(task);
    const patternKeywords = pattern.tags || [];
    
    const relevance = this.calculateRelevance(taskKeywords, pattern);
    return relevance > 0.5;
  }
  
  /**
   * Helper: Calculate relevance score
   */
  calculateRelevance(keywords, entry) {
    const entryKeywords = entry.tags || this.extractKeywords(entry.task || '');
    const intersection = keywords.filter(k => entryKeywords.includes(k));
    
    if (keywords.length === 0 || entryKeywords.length === 0) {return 0;}
    
    return intersection.length / Math.max(keywords.length, entryKeywords.length);
  }
  
  /**
   * Helper: Extract keywords from text with error handling
   */
  extractKeywords(text) {
    try {
      if (!text || typeof text !== 'string') {
        return [];
      }
      
      const stopWords = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but'];
      
      return text
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2)
        .filter(word => !stopWords.includes(word))
        .slice(0, 10);
        
    } catch (error) {
      logger.warn('Failed to extract keywords:', error);
      return [];
    }
  }
  
  /**
   * Helper: Parse CLAUDE.md file
   */
  parseClaudeMd(content) {
    const sections = {};
    const lines = content.split('\n');
    let currentSection = 'general';
    
    lines.forEach(line => {
      if (line.startsWith('##')) {
        currentSection = line.replace(/^#+\s*/, '').toLowerCase();
        sections[currentSection] = [];
      } else if (line.trim()) {
        if (!sections[currentSection]) {sections[currentSection] = [];}
        sections[currentSection].push(line.trim());
      }
    });
    
    return sections;
  }
  
  /**
   * Get knowledge transfer metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      totalKnowledgeEntries: Object.values(this.stores).reduce((sum, store) => sum + store.size, 0),
      knowledgeByType: {
        decisions: this.stores.decisions.size,
        patterns: this.stores.patterns.size,
        corrections: this.stores.corrections.size,
        failures: this.stores.failures.size
      },
      hitRate: this.metrics.retrievalHits / (this.metrics.retrievalHits + this.metrics.retrievalMisses) || 0
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  KnowledgeTransferSystem,
  getInstance: (config) => {
    if (!instance) {
      instance = new KnowledgeTransferSystem(config);
    }
    return instance;
  }
};