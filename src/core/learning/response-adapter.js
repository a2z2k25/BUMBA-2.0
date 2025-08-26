/**
 * BUMBA Response Adapter
 * Dynamic response generation based on user profile and emotional state
 * Part of Human Learning Module Enhancement - Sprint 3
 * 
 * FRAMEWORK DESIGN:
 * - Context-aware response adaptation
 * - Style and tone modulation
 * - Content transformation
 * - Works without external NLG APIs
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Response Adapter for dynamic response generation
 */
class ResponseAdapter extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      adaptationLevel: config.adaptationLevel || 0.7,
      styleVariations: config.styleVariations || 5,
      toneRange: config.toneRange || 10,
      maxLength: config.maxLength || 2000,
      minLength: config.minLength || 50,
      contextMemory: config.contextMemory || 10,
      ...config
    };
    
    // Response styles
    this.styles = {
      technical: {
        vocabulary: 'specialized',
        structure: 'systematic',
        examples: 'code-heavy',
        formatting: 'structured'
      },
      conversational: {
        vocabulary: 'everyday',
        structure: 'flowing',
        examples: 'relatable',
        formatting: 'natural'
      },
      educational: {
        vocabulary: 'clear',
        structure: 'step-by-step',
        examples: 'illustrative',
        formatting: 'organized'
      },
      professional: {
        vocabulary: 'formal',
        structure: 'organized',
        examples: 'business-oriented',
        formatting: 'polished'
      },
      creative: {
        vocabulary: 'expressive',
        structure: 'dynamic',
        examples: 'imaginative',
        formatting: 'flexible'
      }
    };
    
    // Response tones
    this.tones = {
      friendly: { warmth: 0.8, formality: 0.3, energy: 0.6 },
      professional: { warmth: 0.4, formality: 0.8, energy: 0.5 },
      enthusiastic: { warmth: 0.7, formality: 0.3, energy: 0.9 },
      calm: { warmth: 0.6, formality: 0.5, energy: 0.3 },
      authoritative: { warmth: 0.3, formality: 0.7, energy: 0.6 },
      empathetic: { warmth: 0.9, formality: 0.4, energy: 0.5 },
      humorous: { warmth: 0.7, formality: 0.2, energy: 0.7 },
      serious: { warmth: 0.3, formality: 0.8, energy: 0.4 },
      supportive: { warmth: 0.8, formality: 0.5, energy: 0.5 },
      neutral: { warmth: 0.5, formality: 0.5, energy: 0.5 }
    };
    
    // Transformation templates
    this.templates = {
      greeting: {
        formal: ["Good {timeOfDay}. How may I assist you today?"],
        casual: ["Hey there! What can I help you with?"],
        enthusiastic: ["Hello! I'm excited to help you today!"]
      },
      acknowledgment: {
        formal: ["I understand your {concern}. Let me address that."],
        casual: ["Got it! Let me help with that."],
        empathetic: ["I hear you. That {emotion} is completely understandable."]
      },
      explanation: {
        technical: ["The {concept} operates by {mechanism}, utilizing {technology}."],
        simple: ["Think of {concept} like {analogy}. It {simple_explanation}."],
        educational: ["Let's break down {concept}: First, {step1}. Then, {step2}."]
      },
      conclusion: {
        formal: ["I trust this addresses your inquiry. Please let me know if you need further clarification."],
        casual: ["Hope that helps! Let me know if you need anything else."],
        supportive: ["You've got this! Feel free to ask if you need more help."]
      }
    };
    
    // Context buffer
    this.contextBuffer = [];
    
    // Adaptation history
    this.adaptationHistory = [];
    
    // Response cache
    this.responseCache = new Map();
    
    // Metrics
    this.metrics = {
      responsesAdapted: 0,
      averageAdaptationTime: 0,
      cacheHitRate: 0,
      userSatisfaction: 0,
      adaptationDepth: 0
    };
    
    this.initialize();
  }
  
  /**
   * Initialize response adapter
   */
  async initialize() {
    try {
      // Start optimization loop
      this.startOptimizationLoop();
      
      logger.info('💬 Response Adapter initialized');
      
      this.emit('initialized', {
        styles: Object.keys(this.styles),
        tones: Object.keys(this.tones),
        adaptationLevel: this.config.adaptationLevel
      });
      
    } catch (error) {
      logger.error('Failed to initialize Response Adapter:', error);
    }
  }
  
  /**
   * Adapt response based on user profile and context
   */
  async adaptResponse(content, profile, context = {}) {
    const startTime = Date.now();
    
    try {
      // Check cache
      const cacheKey = this.generateCacheKey(content, profile, context);
      if (this.responseCache.has(cacheKey)) {
        this.metrics.cacheHitRate++;
        return this.responseCache.get(cacheKey);
      }
      
      // Determine style and tone
      const style = this.determineStyle(profile, context);
      const tone = this.determineTone(profile, context);
      
      // Apply transformations
      let adapted = content;
      
      // 1. Length adaptation
      adapted = this.adaptLength(adapted, profile, context);
      
      // 2. Vocabulary adaptation
      adapted = this.adaptVocabulary(adapted, style, profile);
      
      // 3. Structure adaptation
      adapted = this.adaptStructure(adapted, style, context);
      
      // 4. Tone modulation
      adapted = this.modulateTone(adapted, tone, context);
      
      // 5. Personalization touches
      adapted = this.addPersonalization(adapted, profile, context);
      
      // 6. Emotional adaptation
      if (context.emotionalState) {
        adapted = this.adaptToEmotion(adapted, context.emotionalState);
      }
      
      // Create adapted response
      const adaptedResponse = {
        content: adapted,
        style: style.name,
        tone: tone.name,
        metadata: {
          originalLength: content.length,
          adaptedLength: adapted.length,
          adaptationTime: Date.now() - startTime,
          transformations: this.getAppliedTransformations(content, adapted)
        }
      };
      
      // Cache result
      this.responseCache.set(cacheKey, adaptedResponse);
      
      // Track adaptation
      this.trackAdaptation(adaptedResponse);
      
      // Update metrics
      this.updateMetrics(adaptedResponse);
      
      this.emit('response-adapted', adaptedResponse);
      
      return adaptedResponse;
      
    } catch (error) {
      logger.error('Response adaptation failed:', error);
      return { content, style: 'neutral', tone: 'neutral' };
    }
  }
  
  /**
   * Generate contextual response
   */
  async generateResponse(intent, profile, context = {}) {
    try {
      // Select template based on intent
      const template = this.selectTemplate(intent, profile, context);
      
      // Fill template with context
      const filled = this.fillTemplate(template, context);
      
      // Adapt the generated response
      const adapted = await this.adaptResponse(filled, profile, context);
      
      return adapted;
      
    } catch (error) {
      logger.error('Response generation failed:', error);
      return this.getFallbackResponse(intent);
    }
  }
  
  /**
   * Transform response style
   */
  async transformStyle(content, fromStyle, toStyle) {
    try {
      const transformations = this.getStyleTransformations(fromStyle, toStyle);
      
      let transformed = content;
      
      for (const transformation of transformations) {
        transformed = this.applyTransformation(transformed, transformation);
      }
      
      return transformed;
      
    } catch (error) {
      logger.error('Style transformation failed:', error);
      return content;
    }
  }
  
  // Style and tone determination
  
  determineStyle(profile, context) {
    // Use profile preferences
    if (profile.dimensions) {
      const technical = profile.dimensions.technical?.current || 0.5;
      const creative = profile.dimensions.creative?.current || 0.5;
      const formal = profile.dimensions.formal?.current || 0.5;
      
      if (technical > 0.7) return { name: 'technical', ...this.styles.technical };
      if (creative > 0.7) return { name: 'creative', ...this.styles.creative };
      if (formal > 0.7) return { name: 'professional', ...this.styles.professional };
    }
    
    // Context-based selection
    if (context.domain === 'education') {
      return { name: 'educational', ...this.styles.educational };
    }
    
    if (context.taskType === 'coding') {
      return { name: 'technical', ...this.styles.technical };
    }
    
    // Default
    return { name: 'conversational', ...this.styles.conversational };
  }
  
  determineTone(profile, context) {
    // Emotional state takes priority
    if (context.emotionalState) {
      const { valence, arousal } = context.emotionalState;
      
      if (valence < -0.5) return { name: 'empathetic', ...this.tones.empathetic };
      if (arousal > 0.7) return { name: 'calm', ...this.tones.calm };
      if (valence > 0.5 && arousal > 0.5) return { name: 'enthusiastic', ...this.tones.enthusiastic };
    }
    
    // Profile-based
    if (profile.dimensions) {
      const formal = profile.dimensions.formal?.current || 0.5;
      const collaborative = profile.dimensions.collaborative?.current || 0.5;
      
      if (formal > 0.7) return { name: 'professional', ...this.tones.professional };
      if (collaborative > 0.7) return { name: 'friendly', ...this.tones.friendly };
    }
    
    // Context-based
    if (context.isError) return { name: 'supportive', ...this.tones.supportive };
    if (context.isSuccess) return { name: 'enthusiastic', ...this.tones.enthusiastic };
    
    // Default
    return { name: 'neutral', ...this.tones.neutral };
  }
  
  // Adaptation methods
  
  adaptLength(content, profile, context) {
    const verbose = profile.dimensions?.verbose?.current || 0.5;
    const targetRatio = 0.5 + verbose; // 0.5 to 1.5x original length
    
    const targetLength = Math.round(content.length * targetRatio);
    
    if (targetLength < content.length) {
      // Shorten
      return this.condense(content, targetLength);
    } else if (targetLength > content.length * 1.2) {
      // Expand
      return this.expand(content, targetLength);
    }
    
    return content;
  }
  
  adaptVocabulary(content, style, profile) {
    const technical = profile.dimensions?.technical?.current || 0.5;
    
    if (style.vocabulary === 'specialized' && technical > 0.7) {
      // Keep technical terms
      return content;
    } else if (style.vocabulary === 'everyday' || technical < 0.3) {
      // Simplify technical terms
      return this.simplifyVocabulary(content);
    }
    
    return content;
  }
  
  adaptStructure(content, style, context) {
    if (style.structure === 'step-by-step') {
      return this.structureAsSteps(content);
    } else if (style.structure === 'systematic') {
      return this.structureSystematically(content);
    }
    
    return content;
  }
  
  modulateTone(content, tone, context) {
    // Add tone markers
    const markers = this.getToneMarkers(tone);
    
    // Apply markers strategically
    let modulated = content;
    
    if (markers.opening) {
      modulated = markers.opening + ' ' + modulated;
    }
    
    if (markers.closing && !context.incomplete) {
      modulated = modulated + ' ' + markers.closing;
    }
    
    return modulated;
  }
  
  addPersonalization(content, profile, context) {
    const personalizations = [];
    
    // Add user name if available
    if (context.userName) {
      content = content.replace(/\byou\b/i, context.userName);
    }
    
    // Add context-specific references
    if (context.projectName) {
      personalizations.push(`for your ${context.projectName} project`);
    }
    
    // Add preference acknowledgments
    if (profile.cluster) {
      const clusterPersonalization = this.getClusterPersonalization(profile.cluster);
      if (clusterPersonalization) {
        personalizations.push(clusterPersonalization);
      }
    }
    
    // Integrate personalizations naturally
    if (personalizations.length > 0) {
      // Add at appropriate points in content
      // This is simplified - real implementation would be more sophisticated
      const personalization = personalizations[0];
      if (!content.includes(personalization)) {
        content = content.replace(/\.$/, ` ${personalization}.`);
      }
    }
    
    return content;
  }
  
  adaptToEmotion(content, emotionalState) {
    const { valence, arousal } = emotionalState;
    
    // Add emotional acknowledgment
    if (valence < -0.5) {
      // Negative emotion - add support
      const support = this.getSupportivePhrase();
      content = support + ' ' + content;
    } else if (valence > 0.5) {
      // Positive emotion - match energy
      const enthusiasm = this.getEnthusiasticPhrase();
      content = content.replace(/\.$/, `! ${enthusiasm}`);
    }
    
    // Adjust pacing for arousal
    if (arousal > 0.7) {
      // High arousal - add calming structure
      content = this.addCalmingStructure(content);
    }
    
    return content;
  }
  
  // Helper methods
  
  condense(content, targetLength) {
    // Simple condensing - real implementation would be more sophisticated
    const sentences = content.split(/[.!?]+/);
    const ratio = targetLength / content.length;
    const targetSentences = Math.max(1, Math.round(sentences.length * ratio));
    
    // Keep most important sentences
    const condensed = sentences.slice(0, targetSentences).join('. ');
    return condensed + (condensed.endsWith('.') ? '' : '.');
  }
  
  expand(content, targetLength) {
    // Add elaboration
    const elaborations = [
      "Let me provide more detail.",
      "To elaborate further,",
      "Additionally,",
      "It's also worth noting that"
    ];
    
    const elaboration = elaborations[Math.floor(Math.random() * elaborations.length)];
    
    // Add examples if technical
    if (content.includes('function') || content.includes('code')) {
      return content + ` ${elaboration} here's an example of how this works in practice.`;
    }
    
    return content + ` ${elaboration} this approach has proven effective in similar situations.`;
  }
  
  simplifyVocabulary(content) {
    const replacements = {
      'utilize': 'use',
      'implement': 'create',
      'initialize': 'start',
      'terminate': 'end',
      'parameter': 'setting',
      'algorithm': 'process',
      'optimize': 'improve',
      'configuration': 'setup'
    };
    
    let simplified = content;
    for (const [complex, simple] of Object.entries(replacements)) {
      simplified = simplified.replace(new RegExp(`\\b${complex}\\b`, 'gi'), simple);
    }
    
    return simplified;
  }
  
  structureAsSteps(content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    
    if (sentences.length <= 1) return content;
    
    const structured = sentences.map((sentence, index) => {
      return `${index + 1}. ${sentence.trim()}`;
    }).join('\n');
    
    return structured;
  }
  
  structureSystematically(content) {
    // Add section markers
    const sections = [
      "Overview:",
      "Details:",
      "Implementation:",
      "Conclusion:"
    ];
    
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    const sectionSize = Math.ceil(sentences.length / sections.length);
    
    let structured = '';
    let sectionIndex = 0;
    
    sentences.forEach((sentence, index) => {
      if (index % sectionSize === 0 && sectionIndex < sections.length) {
        structured += `\n${sections[sectionIndex]}\n`;
        sectionIndex++;
      }
      structured += sentence.trim() + '. ';
    });
    
    return structured.trim();
  }
  
  getToneMarkers(tone) {
    const markers = {
      friendly: {
        opening: "Hey!",
        closing: "Hope this helps!"
      },
      professional: {
        opening: "",
        closing: "Please let me know if you need further assistance."
      },
      enthusiastic: {
        opening: "Awesome!",
        closing: "This is going to be great!"
      },
      empathetic: {
        opening: "I understand.",
        closing: "I'm here if you need anything."
      },
      supportive: {
        opening: "No worries!",
        closing: "You've got this!"
      }
    };
    
    return markers[tone.name] || { opening: "", closing: "" };
  }
  
  getClusterPersonalization(cluster) {
    const personalizations = {
      developer: "optimized for your coding workflow",
      designer: "with visual clarity in mind",
      manager: "structured for decision-making",
      learner: "with detailed explanations"
    };
    
    return personalizations[cluster];
  }
  
  getSupportivePhrase() {
    const phrases = [
      "I understand this can be challenging.",
      "Let's work through this together.",
      "Don't worry, we'll figure this out.",
      "I'm here to help."
    ];
    
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
  
  getEnthusiasticPhrase() {
    const phrases = [
      "Great work!",
      "Excellent progress!",
      "You're doing amazing!",
      "Keep it up!"
    ];
    
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
  
  addCalmingStructure(content) {
    // Break into smaller chunks
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    
    if (sentences.length <= 2) return content;
    
    // Add breathing room
    const structured = sentences.map(s => s.trim() + '.').join('\n\n');
    
    return "Let's take this step by step:\n\n" + structured;
  }
  
  selectTemplate(intent, profile, context) {
    const templates = this.templates[intent];
    
    if (!templates) {
      return "I'll help you with that.";
    }
    
    const formality = profile.dimensions?.formal?.current || 0.5;
    
    if (formality > 0.7 && templates.formal) {
      return templates.formal[0];
    } else if (formality < 0.3 && templates.casual) {
      return templates.casual[0];
    }
    
    // Return first available template
    const style = Object.keys(templates)[0];
    return templates[style][0];
  }
  
  fillTemplate(template, context) {
    let filled = template;
    
    // Simple template filling
    const replacements = {
      '{timeOfDay}': this.getTimeOfDay(),
      '{concern}': context.concern || 'request',
      '{emotion}': context.emotion || 'feeling',
      '{concept}': context.concept || 'concept',
      '{mechanism}': 'processing the data',
      '{technology}': 'advanced algorithms',
      '{analogy}': 'a helpful assistant',
      '{simple_explanation}': 'helps you get things done',
      '{step1}': 'we analyze the input',
      '{step2}': 'we generate the output'
    };
    
    for (const [placeholder, value] of Object.entries(replacements)) {
      filled = filled.replace(placeholder, value);
    }
    
    return filled;
  }
  
  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }
  
  getFallbackResponse(intent) {
    const fallbacks = {
      greeting: "Hello! How can I help you?",
      acknowledgment: "I understand. Let me help with that.",
      explanation: "Let me explain how this works.",
      conclusion: "I hope this helps!"
    };
    
    return {
      content: fallbacks[intent] || "I'll assist you with that.",
      style: 'neutral',
      tone: 'neutral'
    };
  }
  
  generateCacheKey(content, profile, context) {
    const key = `${content.substring(0, 50)}_${profile.id || 'default'}_${context.intent || 'general'}`;
    return key;
  }
  
  getAppliedTransformations(original, adapted) {
    const transformations = [];
    
    if (adapted.length !== original.length) {
      transformations.push('length');
    }
    
    if (adapted.includes('\n') && !original.includes('\n')) {
      transformations.push('structure');
    }
    
    if (adapted !== original) {
      transformations.push('vocabulary');
    }
    
    return transformations;
  }
  
  getStyleTransformations(fromStyle, toStyle) {
    // Define transformations between styles
    const transformations = [];
    
    if (fromStyle === 'technical' && toStyle === 'conversational') {
      transformations.push('simplify-vocabulary');
      transformations.push('add-relatability');
      transformations.push('reduce-jargon');
    } else if (fromStyle === 'conversational' && toStyle === 'professional') {
      transformations.push('formalize-language');
      transformations.push('add-structure');
      transformations.push('remove-colloquialisms');
    }
    
    return transformations;
  }
  
  applyTransformation(content, transformation) {
    switch (transformation) {
      case 'simplify-vocabulary':
        return this.simplifyVocabulary(content);
      case 'add-relatability':
        return content + " This is similar to everyday experiences you might have.";
      case 'reduce-jargon':
        return this.simplifyVocabulary(content);
      case 'formalize-language':
        return content.replace(/don't/g, 'do not').replace(/can't/g, 'cannot');
      case 'add-structure':
        return this.structureSystematically(content);
      case 'remove-colloquialisms':
        return content.replace(/yeah/gi, 'yes').replace(/gonna/gi, 'going to');
      default:
        return content;
    }
  }
  
  trackAdaptation(adaptedResponse) {
    this.adaptationHistory.push({
      timestamp: Date.now(),
      style: adaptedResponse.style,
      tone: adaptedResponse.tone,
      transformations: adaptedResponse.metadata.transformations
    });
    
    // Keep last 100
    if (this.adaptationHistory.length > 100) {
      this.adaptationHistory.shift();
    }
  }
  
  updateMetrics(adaptedResponse) {
    this.metrics.responsesAdapted++;
    
    // Update average adaptation time
    const currentAvg = this.metrics.averageAdaptationTime;
    const newTime = adaptedResponse.metadata.adaptationTime;
    this.metrics.averageAdaptationTime = 
      (currentAvg * (this.metrics.responsesAdapted - 1) + newTime) / 
      this.metrics.responsesAdapted;
    
    // Calculate adaptation depth
    this.metrics.adaptationDepth = adaptedResponse.metadata.transformations.length;
  }
  
  /**
   * Start optimization loop
   */
  startOptimizationLoop() {
    setInterval(() => {
      // Clean old cache entries
      const maxAge = 3600000; // 1 hour
      const now = Date.now();
      
      for (const [key, value] of this.responseCache) {
        if (now - value.metadata.timestamp > maxAge) {
          this.responseCache.delete(key);
        }
      }
      
      // Limit cache size
      if (this.responseCache.size > 500) {
        const entries = Array.from(this.responseCache.entries());
        entries.sort((a, b) => a[1].metadata.timestamp - b[1].metadata.timestamp);
        
        // Remove oldest
        for (let i = 0; i < 100; i++) {
          this.responseCache.delete(entries[i][0]);
        }
      }
    }, 300000); // Every 5 minutes
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.responseCache.size,
      historySize: this.adaptationHistory.length,
      styles: Object.keys(this.styles),
      tones: Object.keys(this.tones)
    };
  }
}

module.exports = ResponseAdapter;