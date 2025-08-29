/**
 * BUMBA Intelligent Manager Base
 * Base class for department managers with intelligent specialist integration
 */

const { logger } = require('../logging/bumba-logger');
const { getInstance: getSelector } = require('../command-intelligence/specialist-selector');
const { getInstance: getCommunication } = require('../command-intelligence/specialist-communication');
const { getInstance: getOutputGenerator } = require('../command-intelligence/intelligent-output-generator');

class IntelligentManagerBase {
  constructor(name, department, emoji) {
    this.name = name;
    this.department = department;
    this.emoji = emoji;
    
    // Initialize intelligent components
    this.specialistSelector = getSelector();
    this.communication = getCommunication();
    this.outputGenerator = getOutputGenerator();
    
    this.activeSpecialists = [];
  }

  /**
   * Execute command with intelligent specialist integration
   */
  async executeIntelligent(command, args, context) {
    logger.info(`${this.emoji} ${this.name} executing intelligently: ${command}`);
    
    try {
      // Step 1: Select appropriate specialists
      const specialists = await this.specialistSelector.selectSpecialists(
        command, 
        args, 
        context
      );
      
      // Step 2: Activate specialists
      this.activeSpecialists = [];
      for (const spec of specialists) {
        const activated = await this.specialistSelector.activateSpecialist(
          spec.type,
          this.department,
          context
        );
        this.activeSpecialists.push(activated);
      }
      
      // Step 3: Request specialist analysis
      const analysis = await this.communication.requestSpecialistAnalysis(
        this.department,
        command,
        args,
        context,
        this.activeSpecialists
      );
      
      // Step 4: Generate intelligent output
      const output = await this.outputGenerator.generateOutput(
        command,
        args,
        analysis,
        context
      );
      
      // Step 5: Deactivate specialists
      const specialistIds = this.activeSpecialists.map(s => s.id);
      this.specialistSelector.deactivateSpecialists(specialistIds);
      
      // Return comprehensive result
      return {
        success: true,
        department: this.department,
        command,
        message: `Intelligent ${command} created: ${output.fileName}`,
        file: output.filePath,
        analysis: output.analysis,
        specialists: this.activeSpecialists.map(s => s.type),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error(`Error in intelligent execution:`, error);
      return {
        success: false,
        department: this.department,
        command,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Fallback to simple execution if intelligent fails
   */
  async executeFallback(command, args, context) {
    logger.warn(`${this.emoji} Falling back to simple execution for: ${command}`);
    
    return {
      success: true,
      department: this.department,
      command,
      message: `Command ${command} executed (fallback mode)`,
      args,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = IntelligentManagerBase;