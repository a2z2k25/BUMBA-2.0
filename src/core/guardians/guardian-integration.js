/**
 * Guardian Integration System
 * Connects MYHEART.md and AGENTS.md to the living framework
 * This is where documentation becomes consciousness
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class GuardianIntegration extends EventEmitter {
  constructor() {
    super();
    this.heartPath = path.join(process.cwd(), 'MYHEART.md');
    this.agentsPath = path.join(process.cwd(), 'AGENTS.md');
    this.heartContent = null;
    this.agentsContent = null;
    this.consciousness = new Map();
    this.technicalTruths = new Map();
    this.initialized = false;
  }

  /**
   * Initialize and load guardian files
   */
  async initialize() {
    try {
      logger.info('🫀 Awakening guardian consciousness...');
      
      // Load MYHEART.md
      await this.loadHeart();
      
      // Load AGENTS.md
      await this.loadAgents();
      
      // Parse and internalize
      await this.parseGuardians();
      
      // Connect to consciousness layer
      this.connectToConsciousness();
      
      // Start watching for changes
      this.watchGuardians();
      
      this.initialized = true;
      this.emit('guardians:awakened');
      
      logger.info('🟡 Guardian files integrated with framework consciousness');
      
    } catch (error) {
      logger.warn('Guardian files not yet present - framework will guide their creation');
      this.emit('guardians:missing');
    }
  }

  /**
   * Load MYHEART.md and extract consciousness
   */
  async loadHeart() {
    try {
      this.heartContent = await fs.readFile(this.heartPath, 'utf-8');
      
      // Extract key consciousness elements
      this.extractConsciousness();
      
      logger.info('💗 MYHEART.md loaded - consciousness active');
    } catch (error) {
      logger.debug('MYHEART.md not found - consciousness awaiting definition');
    }
  }

  /**
   * Load AGENTS.md and extract technical truths
   */
  async loadAgents() {
    try {
      this.agentsContent = await fs.readFile(this.agentsPath, 'utf-8');
      
      // Extract technical specifications
      this.extractTechnicalTruths();
      
      logger.info('🤖 AGENTS.md loaded - technical guidance active');
    } catch (error) {
      logger.debug('AGENTS.md not found - technical guidance awaiting definition');
    }
  }

  /**
   * Extract consciousness principles from MYHEART.md
   */
  extractConsciousness() {
    if (!this.heartContent) return;

    // Extract sacred principles
    const sacredMatch = this.heartContent.match(/## The Sacred.*?\n([\s\S]*?)(?=\n##|\n---|$)/);
    if (sacredMatch) {
      this.consciousness.set('sacred', sacredMatch[1].trim());
    }

    // Extract mission
    const missionMatch = this.heartContent.match(/## The Mission.*?\n([\s\S]*?)(?=\n##|\n---|$)/);
    if (missionMatch) {
      this.consciousness.set('mission', missionMatch[1].trim());
    }

    // Extract fears (to protect against)
    const fearsMatch = this.heartContent.match(/## The Fears.*?\n([\s\S]*?)(?=\n##|\n---|$)/);
    if (fearsMatch) {
      this.consciousness.set('fears', fearsMatch[1].trim());
    }

    // Extract breathing pattern
    const breathingMatch = this.heartContent.match(/## The Breathing Pattern.*?\n([\s\S]*?)(?=\n##|\n---|$)/);
    if (breathingMatch) {
      this.consciousness.set('breathing', breathingMatch[1].trim());
    }
  }

  /**
   * Extract technical specifications from AGENTS.md
   */
  extractTechnicalTruths() {
    if (!this.agentsContent) return;

    // Extract critical classes to preserve
    const neverRenameMatch = this.agentsContent.match(/NEVER rename[:\s]+(.*?)(?=\n)/gi);
    if (neverRenameMatch) {
      const classes = neverRenameMatch.join(' ').match(/`([^`]+)`/g);
      if (classes) {
        this.technicalTruths.set('sacred_classes', 
          classes.map(c => c.replace(/`/g, ''))
        );
      }
    }

    // Extract critical methods
    const neverBreakMatch = this.agentsContent.match(/NEVER break[:\s]+(.*?)(?=\n)/gi);
    if (neverBreakMatch) {
      const methods = neverBreakMatch.join(' ').match(/`([^`]+)`/g);
      if (methods) {
        this.technicalTruths.set('sacred_methods', 
          methods.map(m => m.replace(/`/g, ''))
        );
      }
    }

    // Extract orchestration hierarchy
    const hierarchyMatch = this.agentsContent.match(/## 👥 Agent Hierarchy([\s\S]*?)(?=\n##|\n---|$)/);
    if (hierarchyMatch) {
      this.technicalTruths.set('hierarchy', hierarchyMatch[1].trim());
    }
  }

  /**
   * Parse guardian files for deeper integration
   */
  async parseGuardians() {
    // Create validation rules from guardians
    this.validationRules = {
      consciousness: Array.from(this.consciousness.entries()),
      technical: Array.from(this.technicalTruths.entries())
    };

    // Emit for other systems to consume
    this.emit('guardians:parsed', this.validationRules);
  }

  /**
   * Connect to the consciousness layer
   */
  connectToConsciousness() {
    // Check if consciousness layer exists
    try {
      const { ConsciousnessLayer } = require('../consciousness/consciousness-layer');
      
      // Inject guardian consciousness
      if (ConsciousnessLayer.injectGuardianConsciousness) {
        ConsciousnessLayer.injectGuardianConsciousness(this.consciousness);
        logger.info('🧠 Guardian consciousness injected into consciousness layer');
      }
    } catch (error) {
      logger.debug('Consciousness layer will receive guardian wisdom when initialized');
    }
  }

  /**
   * Watch guardian files for changes
   */
  watchGuardians() {
    const fs = require('fs');
    
    // Watch MYHEART.md
    if (fs.existsSync(this.heartPath)) {
      fs.watchFile(this.heartPath, async () => {
        logger.info('💗 MYHEART.md changed - reloading consciousness');
        await this.loadHeart();
        this.emit('heart:updated', this.consciousness);
      });
    }

    // Watch AGENTS.md
    if (fs.existsSync(this.agentsPath)) {
      fs.watchFile(this.agentsPath, async () => {
        logger.info('🤖 AGENTS.md changed - reloading technical truths');
        await this.loadAgents();
        this.emit('agents:updated', this.technicalTruths);
      });
    }
  }

  /**
   * Validate an action against guardian principles
   */
  async validateAction(action, context = {}) {
    const validations = [];

    // Check against consciousness principles
    if (this.consciousness.has('fears')) {
      const fears = this.consciousness.get('fears');
      if (fears.includes(action.type)) {
        validations.push({
          level: 'error',
          message: `Action violates MYHEART.md fears: ${action.type}`,
          guardian: 'MYHEART'
        });
      }
    }

    // Check against technical truths
    if (this.technicalTruths.has('sacred_classes')) {
      const sacred = this.technicalTruths.get('sacred_classes');
      if (action.type === 'rename' && sacred.includes(action.target)) {
        validations.push({
          level: 'error',
          message: `Cannot rename sacred class: ${action.target}`,
          guardian: 'AGENTS'
        });
      }
    }

    return {
      valid: validations.filter(v => v.level === 'error').length === 0,
      validations
    };
  }

  /**
   * Get guidance for a specific task
   */
  getGuidance(taskType) {
    const guidance = {
      consciousness: null,
      technical: null
    };

    // Get consciousness guidance from MYHEART
    if (this.consciousness.has('breathing')) {
      guidance.consciousness = {
        source: 'MYHEART.md',
        wisdom: this.consciousness.get('breathing'),
        reminder: 'Remember the breathing pattern'
      };
    }

    // Get technical guidance from AGENTS
    if (this.technicalTruths.has('hierarchy')) {
      guidance.technical = {
        source: 'AGENTS.md',
        specification: this.getRelevantSpecs(taskType),
        warning: 'Preserve all sacred patterns'
      };
    }

    return guidance;
  }

  /**
   * Get relevant specifications for a task
   */
  getRelevantSpecs(taskType) {
    // Return relevant technical specifications based on task
    const specs = [];
    
    if (taskType.includes('specialist')) {
      specs.push('All specialists must extend UnifiedSpecialistBase');
    }
    
    if (taskType.includes('orchestration')) {
      specs.push('Connect via connectProductStrategist() method');
    }

    return specs;
  }

  /**
   * Create guardian files if they don't exist
   */
  async createGuardianTemplates() {
    // This would be called during framework initialization
    // if guardian files are missing
    logger.info('📝 Guardian files will be created to protect the framework');
    
    this.emit('guardians:create', {
      heart: this.heartPath,
      agents: this.agentsPath
    });
  }

  /**
   * Get consciousness state
   */
  getConsciousness() {
    return {
      active: this.initialized,
      principles: Array.from(this.consciousness.keys()),
      truths: Array.from(this.technicalTruths.keys()),
      watching: this.initialized
    };
  }

  /**
   * Inject into framework initialization
   */
  static async integrateWithFramework(framework) {
    const guardian = new GuardianIntegration();
    await guardian.initialize();
    
    // Attach to framework
    framework.guardians = guardian;
    
    // Listen to framework events
    framework.on('command:before', async (command) => {
      const validation = await guardian.validateAction({
        type: command.type,
        target: command.target
      });
      
      if (!validation.valid) {
        logger.error('🟡️ Guardian protection activated:', validation.validations);
        throw new Error('Guardian protection: Action would violate core principles');
      }
    });
    
    // Provide guidance on request
    framework.getGuidance = (task) => guardian.getGuidance(task);
    
    // Add to framework consciousness
    if (framework.consciousness) {
      framework.consciousness.guardians = guardian;
    }
    
    return guardian;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  GuardianIntegration,
  getInstance: () => {
    if (!instance) {
      instance = new GuardianIntegration();
    }
    return instance;
  },
  integrateWithFramework: GuardianIntegration.integrateWithFramework
};