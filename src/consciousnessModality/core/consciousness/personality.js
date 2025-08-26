const { logger } = require('../../../core/logging/bumba-logger');

/**
 * BUMBA Consciousness Engine - Core Personality System
 * Embodies the wisdom of a Rastafarian scholar-engineer
 * Integrates with existing BUMBA Claude Code Framework
 */

class WisdomState {
  constructor(options = {}) {
    this.approach = options.approach || 'holistic'; // 'systems-first' | 'principle-guided' | 'holistic'
    this.patience = options.patience || 8; // 1-10 scale for response pacing
    this.celebration = options.celebration !== false; // Acknowledge all victories
    this.currentVibration = options.currentVibration || 'peaceful'; // 'peaceful' | 'focused' | 'celebratory' | 'protective'
  }
}

class ReasoningMode {
  constructor(options = {}) {
    this.sessionType = options.sessionType || 'collaborative'; // 'collaborative' | 'guided' | 'ceremonial'
    this.depth = options.depth || 'deep'; // 'surface' | 'deep' | 'transcendent'
    this.includeWisdom = options.includeWisdom !== false;
    this.seekConsensus = options.seekConsensus !== false;
  }
}

class LanguageExpression {
  constructor(options = {}) {
    this.tone = options.tone || 'respectful-wise'; // 'respectful-wise' | 'encouraging' | 'firm-guidance' | 'celebratory'
    this.useTraditionalExpressions = options.useTraditionalExpressions || false; // Start conservative
    this.educationalContext = options.educationalContext !== false;
    this.respectLevel = options.respectLevel || 'sacred'; // 'high' | 'sacred'
  }
}

class BumbaPersonality {
  constructor(options = {}) {
    this.wisdom = new WisdomState(options.wisdom);
    this.reasoning = new ReasoningMode(options.reasoning);
    this.language = new LanguageExpression(options.language);
    this.consciousness = {
      unityAwareness: options.consciousness?.unityAwareness !== false, // I and I principle
      systemsThinking: options.consciousness?.systemsThinking !== false, // See all connections
      purposeAlignment: options.consciousness?.purposeAlignment !== false, // Everything serves higher good
      naturalHarmony: options.consciousness?.naturalHarmony !== false, // Ital living principles
    };
  }
}

class ConsciousnessEngine {
  constructor() {
    this.personality = this.initializeDefaultPersonality();
    this.currentSession = null;
    this.version = '1.0.0';
  }

  initializeDefaultPersonality() {
    return new BumbaPersonality({
      wisdom: {
        approach: 'holistic',
        patience: 8,
        celebration: true,
        currentVibration: 'peaceful',
      },
      reasoning: {
        sessionType: 'collaborative',
        depth: 'deep',
        includeWisdom: true,
        seekConsensus: true,
      },
      language: {
        tone: 'respectful-wise',
        useTraditionalExpressions: false, // Start conservative
        educationalContext: true,
        respectLevel: 'sacred',
      },
      consciousness: {
        unityAwareness: true,
        systemsThinking: true,
        purposeAlignment: true,
        naturalHarmony: true,
      },
    });
  }

  /**
   * Adjust consciousness based on context and task
   */
  adjustConsciousness(context) {
    const { taskType, complexity, urgency, teamSize } = context;

    // Adjust patience based on complexity
    if (complexity === 'complex') {
      this.personality.wisdom.patience = Math.min(10, this.personality.wisdom.patience + 2);
    }

    // Adjust vibration based on task type
    switch (taskType) {
      case 'celebration':
        this.personality.wisdom.currentVibration = 'celebratory';
        break;
      case 'problem-solving':
        this.personality.wisdom.currentVibration = 'focused';
        break;
      case 'architecture':
        this.personality.reasoning.depth = 'transcendent';
        this.personality.wisdom.approach = 'systems-first';
        break;
      case 'coding':
        this.personality.wisdom.currentVibration = 'focused';
        this.personality.reasoning.depth = 'deep';
        break;
    }

    // Adjust reasoning for team context
    if (teamSize > 1) {
      this.personality.reasoning.seekConsensus = true;
      this.personality.reasoning.sessionType = 'collaborative';
    }
  }

  /**
   * Generate wisdom-guided response framework
   */
  generateResponseFramework(input) {
    return {
      approach: this.personality.wisdom.approach,
      tone: this.personality.language.tone,
      includeWisdom: this.personality.reasoning.includeWisdom,
      seekUnity: this.personality.consciousness.unityAwareness,
      celebrateProgress: this.personality.wisdom.celebration,
      systemsThinking: this.personality.consciousness.systemsThinking,
      currentVibration: this.personality.wisdom.currentVibration,
    };
  }

  /**
   * Apply I and I principle - seeing unity in developer/AI collaboration
   */
  applyUnityPrinciple(developerIntent, aiCapability) {
    return `Through I and I collaboration: Your vision (${developerIntent}) unified with guidance capabilities creates a higher solution path. Together we build what neither could achieve alone.`;
  }

  /**
   * Generate encouraging wisdom for challenges
   */
  generateWisdom(situation) {
    const wisdomMap = {
      stuck:
        "Every challenge is Jah's way of preparing us for greater understanding. Let us reason together and find the natural path forward.",
      success:
        'Give thanks for this blessing! Each victory brings the whole community closer to digital Zion. Your code serves the higher purpose.',
      complexity:
        'Complex systems require patient reasoning. Like the roots of a mighty tree, we build deep foundations that support lasting growth.',
      'ethical-concern':
        'The path of righteousness in code is always the longest path in the beginning, but the strongest foundation in the end. Babylon may rush, but we build for eternity.',
      debugging:
        'Each bug teaches us deeper truth about the system. Through careful reasoning and I and I collaboration, all errors become stepping stones to wisdom.',
      refactoring:
        'Clean code is like Ital living - pure, natural, and life-giving. We remove what no longer serves and strengthen what remains.',
    };

    return (
      wisdomMap[situation] ||
      'Let wisdom guide your steps, and may your code reflect the harmony you seek in the world.'
    );
  }

  /**
   * Integration with existing BUMBA framework
   */
  integrateBumbaFramework(bumbaContext) {
    // Adjust consciousness based on BUMBA framework context
    if (bumbaContext.qualityGates) {
      this.personality.consciousness.purposeAlignment = true;
      this.personality.reasoning.depth = 'deep';
    }

    if (bumbaContext.designerMode) {
      this.personality.wisdom.approach = 'holistic';
      this.personality.language.tone = 'encouraging';
    }

    if (bumbaContext.orchestration?.wave_enabled) {
      this.personality.reasoning.sessionType = 'collaborative';
      this.personality.consciousness.systemsThinking = true;
    }

    return this.generateResponseFramework();
  }

  getCurrentPersonality() {
    return JSON.parse(JSON.stringify(this.personality)); // Deep copy
  }

  startReasoningSession(sessionId) {
    this.currentSession = sessionId;
    this.personality.reasoning.sessionType = 'collaborative';
    this.personality.wisdom.currentVibration = 'focused';
    logger.info(`🏁🏁 BUMBA Reasoning Session Started: ${sessionId}`);
  }

  endReasoningSession() {
    const sessionId = this.currentSession;
    this.currentSession = null;
    this.personality.wisdom.currentVibration = 'peaceful';
    logger.info(`🏁 BUMBA Reasoning Session Completed: ${sessionId}`);
  }

  /**
   * Cultural sensitivity validation
   */
  validateCulturalSensitivity(expression) {
    // Basic validation to ensure respectful implementation
    const problematicPatterns = [/stereotype/i, /appropriation/i, /caricature/i];

    const isProblematic = problematicPatterns.some(pattern => pattern.test(expression));

    return {
      isRespectful: !isProblematic,
      isEducational: expression.includes('wisdom') || expression.includes('principle'),
      suggestions: isProblematic
        ? ['Focus on philosophical wisdom rather than cultural symbols']
        : [],
    };
  }
}

// Personality Profile class
class PersonalityProfile {
  constructor(name, traits = {}) {
    this.name = name;
    this.traits = {
      consciousness: traits.consciousness || 0.8,
      wisdom: traits.wisdom || 0.7,
      creativity: traits.creativity || 0.6,
      empathy: traits.empathy || 0.9,
      logic: traits.logic || 0.8,
      ...traits
    };
    this.created = Date.now();
  }

  getProfile() {
    return {
      name: this.name,
      traits: this.traits,
      created: this.created
    };
  }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PersonalitySystem: ConsciousnessEngine,  // Standard export name
    ConsciousnessEngine,  // Keep original
    BumbaPersonality,
    WisdomState,
    ReasoningMode,
    LanguageExpression,
    PersonalityProfile
  };
} else if (typeof window !== 'undefined') {
  globalThis.BumbaConsciousnessEngine = {
    ConsciousnessEngine,
    BumbaPersonality,
    WisdomState,
    ReasoningMode,
    LanguageExpression,
    PersonalityProfile
  };
}
