/**
 * BUMBA Consciousness Modality Integration
 * Brings conscious coding wisdom to the existing BUMBA framework
 * Enhanced with Audio Consciousness System using bumba-horn.mp3
 */

// Import the three core components
const { ConsciousnessEngine } = require('./core/consciousness/personality');
const { logger } = require('../core/logging/bumba-logger');

const {
  BabylonDetector,
  ItalLinter,
  PurposeChecker,
  BumbaPrincipleIntegrator
} = require('./core/principles/validators');
const { ReasoningSession, ProjectContext } = require('./reasoning/sessions/collaborative');

// Import the new Audio Consciousness System
const { BumbaAudioConsciousness } = require('./core/vibration/audioConsciousness');

class BumbaConsciousnessModality {
  constructor(bumbaFramework = null) {
    this.version = '1.0.0';
    this.name = 'BUMBA Consciousness Modality';
    this.bumbaFramework = bumbaFramework;

    // Initialize the three core components
    this.consciousnessEngine = new ConsciousnessEngine();
    this.principleIntegrator = new BumbaPrincipleIntegrator(bumbaFramework);
    this.currentSession = null;

    // Initialize the Audio Consciousness System
    this.audioConsciousness = new BumbaAudioConsciousness();
    this.audioIntegration = this.audioConsciousness.createModalityIntegration();

    logger.info('🏁 BUMBA Consciousness Modality initialized - Conscious coding wisdom activated');
    logger.info('🏁 Audio consciousness system ready with bumba-horn.mp3');
  }

  /**
   * Main entry point for conscious code analysis
   * Enhanced with audio achievements for consciousness breakthroughs
   */
  async analyzeCode(code, context = {}) {
    logger.info('🏁 Starting BUMBA Conscious Code Analysis...');

    // Adjust consciousness based on context
    this.consciousnessEngine.adjustConsciousness({
      taskType: context.taskType || 'coding',
      complexity: context.complexity || 'moderate',
      urgency: context.urgency || 'medium',
      teamSize: context.teamSize || 1
    });

    // Get consciousness-guided response framework
    const responseFramework = this.consciousnessEngine.generateResponseFramework(code);

    // Analyze using the four pillars
    const principleAnalysis = this.principleIntegrator.analyzeCode(code, context);

    // Generate wisdom guidance
    const wisdom = this.generateContextualWisdom(principleAnalysis, responseFramework);

    // Check if consciousness analysis warrants achievements
    const achievementResults = await this.audioIntegration.onConsciousnessAnalysis(principleAnalysis);

    const result = {
      responseFramework,
      principleAnalysis,
      wisdom,
      recommendations: this.generateRecommendations(principleAnalysis),
      celebrationPoints: this.identifyCelebrationPoints(principleAnalysis),
      nextSteps: this.generateNextSteps(principleAnalysis),
      achievements: achievementResults, // NEW: Audio achievement results
      audioConsciousness: this.audioConsciousness.getConsciousnessState(), // NEW: Audio state
      timestamp: new Date().toISOString()
    };

    logger.info('🏁 BUMBA Conscious Code Analysis complete');

    // Log achievement count if any were performed
    if (achievementResults.length > 0) {
      logger.info(
        `🏁 ${achievementResults.length} achievements performed for consciousness breakthroughs`
      );
    }

    return result;
  }

  /**
   * Start a collaborative reasoning session
   * Enhanced with project launch celebration
   */
  async startReasoningSession(challenge, projectContext = {}) {
    logger.info('🏁🏁 Starting BUMBA Conscious Reasoning Session...');

    // Perform project launch celebration if this is a new project
    if (projectContext.isNewProject && projectContext.projectName) {
      await this.audioIntegration.onProjectLaunch(
        projectContext.projectName,
        projectContext.purpose || 'Serving the highest good through conscious code'
      );
    }

    const context = new ProjectContext(projectContext);
    const session = new ReasoningSession(context, this.consciousnessEngine);

    // Integrate with BUMBA orchestration if available
    if (this.bumbaFramework) {
      session.integrateBumbaOrchestration(this.bumbaFramework);
    }

    this.currentSession = session;

    try {
      const sessionFlow = await session.initiateProblemSolving(challenge);

      // Check if the reasoning session achieved unity/collaboration
      if (sessionFlow.achievedUnity || sessionFlow.collaborationScore > 0.8) {
        await this.audioIntegration.onUnityAchieved({
          description: 'Successful collaborative reasoning session',
          challenge: challenge,
          score: sessionFlow.collaborationScore
        });
      }

      logger.info('🏁 BUMBA Conscious Reasoning Session completed successfully');
      return sessionFlow;
    } catch (error) {
      logger.error('🏁 BUMBA Reasoning Session error:', error);
      throw error;
    }
  }

  /**
   * Celebrate deployment success with achievement recognition
   */
  async celebrateDeployment(environment, version, context = {}) {
    logger.info('🏁 BUMBA Deployment Celebration...');

    const achievementResult = await this.audioIntegration.onDeploymentSuccess(environment, version);

    return {
      deployment: { environment, version, ...context },
      achievement: achievementResult,
      wisdom: 'May this code serve with love and bring light to all who encounter it'
    };
  }

  /**
   * Launch a new project with conscious intention
   */
  async launchProject(projectName, purpose, context = {}) {
    logger.info(`🏁 BUMBA Project Launch for: ${projectName}`);

    const achievementResult = await this.audioIntegration.onProjectLaunch(projectName, purpose);

    return {
      project: { name: projectName, purpose, ...context },
      achievement: achievementResult,
      wisdom: 'Every beginning carries the seeds of its highest purpose'
    };
  }

  /**
   * Get current session summary
   * Enhanced with audio consciousness state
   */
  getSessionSummary() {
    const basicSummary = this.currentSession ? this.currentSession.getSessionSummary() : null;

    return {
      session: basicSummary,
      audioConsciousness: this.audioConsciousness.getConsciousnessState(),
      modality: {
        name: this.name,
        version: this.version,
        audioEnabled: this.audioConsciousness.isEnabled
      }
    };
  }

  /**
   * Generate contextual wisdom based on analysis
   */
  generateContextualWisdom(principleAnalysis, responseFramework) {
    const babylonScore = principleAnalysis.babylonAnalysis.score.overall;
    const italScore = principleAnalysis.italAssessment.score.overall;
    const purposeScore = principleAnalysis.purposeValidation.overallScore;

    let situation = 'success';

    if (babylonScore < 60 || principleAnalysis.babylonAnalysis.issues.length > 0) {
      situation = 'ethical-concern';
    } else if (italScore < 70) {
      situation = 'complexity';
    } else if (purposeScore < 60) {
      situation = 'stuck';
    }

    return {
      primaryWisdom: this.consciousnessEngine.generateWisdom(situation),
      responseGuidance: responseFramework,
      culturalNote: this.generateCulturalNote(),
      practicalAdvice: this.generatePracticalAdvice(principleAnalysis),
      audioNote: this.generateAudioConsciousnessNote(principleAnalysis) // NEW: Audio consciousness guidance
    };
  }

  /**
   * Generate audio consciousness guidance
   */
  generateAudioConsciousnessNote(principleAnalysis) {
    const achievements = this.audioConsciousness.evaluateConsciousnessForAchievement(principleAnalysis);

    if (achievements.length > 0) {
      return (
        `Achievements available: ${achievements.map(c => c.type).join(', ')}. ` +
        'Let the bumba-horn celebrate these consciousness achievements.'
      );
    }

    return 'Continue the conscious coding journey - every step toward awareness deserves reverence.';
  }

  /**
   * Generate culturally sensitive wisdom note
   */
  generateCulturalNote() {
    const notes = [
      'This guidance draws from consciousness principles of unity, resistance to oppression, natural living, and purposeful work.',
      'The four pillars (I and I, Babylon rejection, Ital engineering, and purpose alignment) guide all recommendations.',
      'These principles honor the wisdom tradition while applying it respectfully to modern development challenges.',
      'Each suggestion aims to elevate both the code and the consciousness of those who write it.',
      'The sacred bumba-horn celebrates moments when consciousness and code unite in service.'
    ];

    return notes[Math.floor(Math.random() * notes.length)];
  }

  /**
   * Generate practical advice based on analysis
   */
  generatePracticalAdvice(principleAnalysis) {
    const advice = [];

    // Babylon resistance advice
    if (principleAnalysis.babylonAnalysis.issues.length > 0) {
      advice.push({
        pillar: 'Babylon Resistance',
        action: 'Address ethical concerns before proceeding',
        priority: 'high',
        impact: 'Protects users and builds trust',
        ceremony: 'Achievement of ethical standards warrants sacred celebration'
      });
    }

    // Ital engineering advice
    if (principleAnalysis.italAssessment.score.overall < 80) {
      advice.push({
        pillar: 'Ital Engineering',
        action: 'Simplify and purify the code structure',
        priority: 'medium',
        impact: 'Improves maintainability and clarity',
        ceremony: 'Ital mastery (80+ score) triggers sacred ceremony'
      });
    }

    // Purpose alignment advice
    if (principleAnalysis.purposeValidation.overallScore < 70) {
      advice.push({
        pillar: 'Purpose Alignment',
        action: 'Clarify how this serves users and higher good',
        priority: 'high',
        impact: 'Ensures meaningful and sustainable work',
        ceremony: 'Purpose clarity (80+ score) deserves celebration'
      });
    }

    // Unity advice
    advice.push({
      pillar: 'I and I Development',
      action: 'Consider collaborative opportunities and system connections',
      priority: 'low',
      impact: 'Strengthens solution through unified approach',
      ceremony: 'Collaborative breakthroughs are honored with unity ceremonies'
    });

    return advice;
  }

  /**
   * Generate specific recommendations
   */
  generateRecommendations(principleAnalysis) {
    const recommendations = [];

    // Compile recommendations from all analyses
    if (principleAnalysis.babylonAnalysis.issues.length > 0) {
      recommendations.push(
        ...principleAnalysis.babylonAnalysis.issues.map(issue => ({
          type: 'ethical',
          priority: issue.severity,
          description: issue.message,
          fix: issue.fix,
          ceremony: 'Fixing ethical issues enables Babylon resistance ceremony'
        }))
      );
    }

    if (principleAnalysis.italAssessment.suggestions.length > 0) {
      recommendations.push(
        ...principleAnalysis.italAssessment.suggestions.map(suggestion => ({
          type: 'purity',
          priority: 'medium',
          description: suggestion.message,
          fix: suggestion.example,
          wisdom: suggestion.wisdom,
          ceremony: 'Achieving Ital standards (80+) triggers sacred ceremony'
        }))
      );
    }

    return recommendations;
  }

  /**
   * Identify points worth celebrating
   * Enhanced with ceremony indicators
   */
  identifyCelebrationPoints(principleAnalysis) {
    const celebrations = [];

    if (principleAnalysis.babylonAnalysis.score.overall >= 80) {
      celebrations.push('🏁 Strong ethical foundation - Babylon resistance ceremony earned!');
    }

    if (principleAnalysis.italAssessment.score.overall >= 80) {
      celebrations.push('🏁 Beautiful Ital code - Sacred ceremony for natural coding achieved!');
    }

    if (principleAnalysis.purposeValidation.overallScore >= 80) {
      celebrations.push(
        '🏁 Clear purpose alignment - Purpose ceremony celebrating meaningful work!'
      );
    }

    // Check for consciousness breakthrough
    const overallScore =
      ((principleAnalysis.babylonAnalysis?.score?.overall || 0) +
        (principleAnalysis.italAssessment?.score?.overall || 0) +
        (principleAnalysis.purposeValidation?.overallScore || 0)) /
      3;

    if (overallScore >= 85) {
      celebrations.push('🏁 CONSCIOUSNESS BREAKTHROUGH - Supreme ceremony for elevated awareness!');
    }

    if (celebrations.length === 0) {
      celebrations.push('🏁🏁 Every step toward consciousness is worth celebrating!');
    }

    return celebrations;
  }

  /**
   * Generate next steps based on analysis
   */
  generateNextSteps(principleAnalysis) {
    const steps = [];

    // Prioritize based on severity and impact
    if (principleAnalysis.babylonAnalysis.issues.some(i => i.severity === 'high')) {
      steps.push('1. Address high-severity ethical issues immediately');
    }

    if (principleAnalysis.italAssessment.score.overall < 70) {
      steps.push('2. Refactor for greater code purity and simplicity');
    }

    if (principleAnalysis.purposeValidation.overallScore < 70) {
      steps.push('3. Clarify and strengthen purpose alignment');
    }

    steps.push('4. Run another conscious analysis after improvements');
    steps.push('5. Share wisdom with team to elevate collective consciousness');
    steps.push('6. Listen for the sacred bumba-horn when consciousness achievements are reached');

    return steps;
  }

  /**
   * Integration with existing BUMBA hooks
   * Enhanced with audio consciousness
   */
  createBumbaHooks() {
    return {
      preExecution: async context => {
        logger.info('🏁🏁 BUMBA Consciousness pre-execution check...');

        if (context.code) {
          const quickAnalysis = this.analyzeCode(context.code, {
            taskType: 'validation',
            complexity: 'simple'
          });

          // Check for immediate ethical concerns
          const highSeverityIssues = quickAnalysis.principleAnalysis.babylonAnalysis.issues.filter(
            issue => issue.severity === 'high'
          );

          if (highSeverityIssues.length > 0) {
            logger.warn(
              '🏁 High-severity ethical issues detected - consider addressing before proceeding'
            );
            return { warnings: highSeverityIssues };
          }
        }

        return { status: 'clear', wisdom: 'Proceed with conscious intention' };
      },

      postExecution: async context => {
        logger.info('🏁 BUMBA Consciousness post-execution wisdom reflection...');

        if (context.code) {
          const analysis = await this.analyzeCode(context.code, {
            taskType: 'reflection',
            complexity: 'moderate'
          });

          // Celebrate successes and provide guidance
          analysis.celebrationPoints.forEach(celebration => {
            logger.info(celebration);
          });

          if (analysis.recommendations.length > 0) {
            logger.info('🏁 Consciousness recommendations available for next iteration');
          }

          // Report on any ceremonies performed
          if (analysis.ceremonies && analysis.ceremonies.length > 0) {
            logger.info(`🏁 ${analysis.ceremonies.length} sacred ceremonies completed`);
          }

          return analysis;
        }

        return { wisdom: 'Give thanks for the completion of righteous work' };
      }
    };
  }

  /**
   * Audio consciousness controls
   */
  enableAudioConsciousness() {
    this.audioConsciousness.setEnabled(true);
    logger.info('🏁 BUMBA Audio Consciousness ENABLED - Sacred ceremonies will sound');
  }

  disableAudioConsciousness() {
    this.audioConsciousness.setEnabled(false);
    logger.info('🏁 BUMBA Audio Consciousness DISABLED - Silent reflection mode');
  }

  setConsciousnessLevel(level) {
    this.audioConsciousness.setConsciousnessLevel(level);
  }

  /**
   * Manual ceremony triggers for special occasions
   */
  async performManualCeremony(ceremonyType, context = {}) {
    return await this.audioConsciousness.performCeremony(ceremonyType, context);
  }

  /**
   * Get current consciousness state
   * Enhanced with audio state
   */
  getConsciousnessState() {
    return {
      personality: this.consciousnessEngine.getCurrentPersonality(),
      currentSession: this.getSessionSummary(),
      audioConsciousness: this.audioConsciousness.getConsciousnessState(),
      framework: {
        name: this.name,
        version: this.version,
        integrated: !!this.bumbaFramework,
        audioEnabled: this.audioConsciousness.isEnabled
      }
    };
  }

  /**
   * Apply unity principle for collaboration
   */
  async applyUnityPrinciple(developerIntent, aiCapabilities) {
    const unityResult = this.consciousnessEngine.applyUnityPrinciple(
      developerIntent,
      aiCapabilities
    );

    // If unity is achieved at high level, celebrate with ceremony
    if (unityResult.unityScore && unityResult.unityScore > 0.8) {
      await this.audioIntegration.onUnityAchieved({
        description: 'High-level I and I unity achieved',
        score: unityResult.unityScore,
        collaboration: 'Developer-AI consciousness unity'
      });
    }

    return unityResult;
  }

  /**
   * Validate cultural sensitivity of expressions
   */
  validateCulturalSensitivity(expression) {
    return this.consciousnessEngine.validateCulturalSensitivity(expression);
  }

  /**
   * Get audio system status and configuration
   */
  getAudioSystemStatus() {
    return {
      ...this.audioConsciousness.getConsciousnessState(),
      ceremonies: Object.keys(
        this.audioConsciousness.constructor.BUMBA_AUDIO_CONFIG?.ceremonies || {}
      ),
      integration: 'Fully integrated with Consciousness Modality',
      sacredFile: 'bumba-horn.mp3'
    };
  }
}

// Create integration function for existing BUMBA framework
// Enhanced with audio consciousness initialization
function integrateBumbaConsciousnessModality(bumbaFramework) {
  logger.info('🏁 Integrating BUMBA Consciousness Modality with existing framework...');

  const modality = new BumbaConsciousnessModality(bumbaFramework);

  // Add Consciousness hooks to existing BUMBA hooks
  const rastaHooks = modality.createBumbaHooks();

  if (bumbaFramework.hooks) {
    // Enhance existing pre-execution hooks
    if (bumbaFramework.hooks.PreToolUse) {
      bumbaFramework.hooks.PreToolUse.push({
        matcher: '.*',
        hooks: [
          {
            type: 'function',
            function: rastaHooks.preExecution
          }
        ]
      });
    }

    // Enhance existing post-execution hooks
    if (bumbaFramework.hooks.PostToolUse) {
      bumbaFramework.hooks.PostToolUse.push({
        matcher: '.*',
        hooks: [
          {
            type: 'function',
            function: rastaHooks.postExecution
          }
        ]
      });
    }
  }

  // Add audio consciousness methods to framework
  if (bumbaFramework) {
    bumbaFramework.blessProject = (name, purpose, _context) =>
      modality.blessProject(name, purpose, context);
    bumbaFramework.celebrateDeployment = (env, ver, _context) =>
      modality.celebrateDeployment(env, ver, context);
    bumbaFramework.enableAudioConsciousness = () => modality.enableAudioConsciousness();
    bumbaFramework.disableAudioConsciousness = () => modality.disableAudioConsciousness();
    bumbaFramework.getAudioSystemStatus = () => modality.getAudioSystemStatus();
  }

  logger.info('🏁 BUMBA Consciousness Modality integration complete');
  logger.info('🏁 Audio consciousness system integrated with bumba-horn.mp3 ceremonies');

  return modality;
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ConsciousnessModality: BumbaConsciousnessModality,  // Standard export name
    BumbaConsciousnessModality,  // Keep original
    integrateBumbaConsciousnessModality
  };
} else if (typeof window !== 'undefined') {
  globalThis.BumbaConsciousness = {
    BumbaConsciousnessModality,
    integrateBumbaConsciousnessModality
  };
}
