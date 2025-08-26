/**
 * BUMBA Context Analyzer
 * Deep context understanding for human learning
 * Part of Human Learning Module Enhancement - Sprint 1
 * 
 * FRAMEWORK DESIGN:
 * - Works independently or with NLP libraries
 * - API connection points for sentiment analysis services
 * - Built-in heuristic analysis as fallback
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

// Check for NLP library availability (users can connect their preferred NLP)
let nlp = null;
try {
  nlp = require('natural'); // Users can install 'natural' for enhanced NLP
  logger.info('📝 NLP library connected for enhanced context analysis');
} catch (error) {
  logger.info('🔍 Using built-in context analysis algorithms');
}

/**
 * Context Analyzer for deep understanding of user interactions
 */
class ContextAnalyzer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxContextDepth: config.maxContextDepth || 10,
      contextWindow: config.contextWindow || 5000, // milliseconds
      sentimentThreshold: config.sentimentThreshold || 0.3,
      frustrationDecay: config.frustrationDecay || 0.9,
      engagementBoost: config.engagementBoost || 1.1,
      minConfidence: config.minConfidence || 0.5,
      ...config
    };
    
    // Context storage
    this.contextHistory = [];
    this.currentContext = null;
    this.sessionContext = new Map();
    
    // Analysis results cache
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute
    
    // Behavioral indicators
    this.behavioralIndicators = {
      frustration: 0,
      engagement: 1,
      expertise: 0.5,
      mood: 0,
      fatigue: 0
    };
    
    // Metrics
    this.metrics = {
      contextsAnalyzed: 0,
      avgProcessingTime: 0,
      cacheHitRate: 0,
      accuracyScore: 0.75
    };
    
    this.initialize();
  }
  
  /**
   * Initialize the context analyzer
   */
  async initialize() {
    try {
      // Initialize NLP components if available
      if (nlp) {
        this.tokenizer = new nlp.WordTokenizer();
        this.sentiment = new nlp.SentimentAnalyzer('English', 
          nlp.PorterStemmer, 'afinn');
        this.tfidf = new nlp.TfIdf();
      }
      
      // Initialize pattern matchers
      this.initializePatterns();
      
      logger.info('🟡 Context Analyzer initialized');
      
      this.emit('initialized', {
        nlpAvailable: !!nlp,
        patterns: Object.keys(this.patterns).length
      });
      
    } catch (error) {
      logger.error('Failed to initialize Context Analyzer:', error);
    }
  }
  
  /**
   * Analyze interaction context
   */
  async analyzeContext(interaction) {
    const startTime = Date.now();
    
    try {
      // Check cache
      const cacheKey = this.getCacheKey(interaction);
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          this.metrics.cacheHitRate++;
          return cached.analysis;
        }
      }
      
      // Perform analysis
      const analysis = {
        id: `context-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        
        // Temporal context
        temporal: this.analyzeTemporalContext(interaction),
        
        // Semantic context
        semantic: await this.analyzeSemanticContext(interaction),
        
        // Behavioral context
        behavioral: this.analyzeBehavioralContext(interaction),
        
        // Task context
        task: this.analyzeTaskContext(interaction),
        
        // Environmental context
        environmental: this.analyzeEnvironmentalContext(interaction),
        
        // Social context
        social: this.analyzeSocialContext(interaction),
        
        // Emotional context
        emotional: await this.analyzeEmotionalContext(interaction),
        
        // Cognitive load
        cognitive: this.analyzeCognitiveLoad(interaction),
        
        // Intent detection
        intent: await this.detectIntent(interaction),
        
        // Context embeddings
        embeddings: this.generateContextEmbeddings(interaction),
        
        // Overall assessment
        summary: null
      };
      
      // Generate summary
      analysis.summary = this.generateContextSummary(analysis);
      
      // Update behavioral indicators
      this.updateBehavioralIndicators(analysis);
      
      // Store in history
      this.contextHistory.push(analysis);
      if (this.contextHistory.length > this.config.maxContextDepth) {
        this.contextHistory.shift();
      }
      
      // Cache result
      this.cache.set(cacheKey, {
        analysis,
        timestamp: Date.now()
      });
      
      // Update metrics
      this.metrics.contextsAnalyzed++;
      const processingTime = Date.now() - startTime;
      this.metrics.avgProcessingTime = 
        (this.metrics.avgProcessingTime * (this.metrics.contextsAnalyzed - 1) + 
         processingTime) / this.metrics.contextsAnalyzed;
      
      this.emit('context-analyzed', analysis);
      
      logger.info(`📍 Context analyzed: ${analysis.summary.type} (${analysis.summary.confidence.toFixed(2)} confidence)`);
      
      return analysis;
      
    } catch (error) {
      logger.error('Failed to analyze context:', error);
      return this.getDefaultContext();
    }
  }
  
  /**
   * Analyze temporal context
   */
  analyzeTemporalContext(interaction) {
    const now = new Date();
    const timestamp = interaction.timestamp || now;
    
    return {
      timeOfDay: timestamp.getHours(),
      dayOfWeek: timestamp.getDay(),
      isWeekend: timestamp.getDay() === 0 || timestamp.getDay() === 6,
      isBusinessHours: timestamp.getHours() >= 9 && timestamp.getHours() < 17,
      sessionDuration: interaction.sessionDuration || 0,
      timeSinceLastInteraction: this.getTimeSinceLastInteraction(),
      interactionFrequency: this.calculateInteractionFrequency(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      isDaytime: timestamp.getHours() >= 6 && timestamp.getHours() < 18,
      season: this.getSeason(timestamp)
    };
  }
  
  /**
   * Analyze semantic context
   */
  async analyzeSemanticContext(interaction) {
    const content = interaction.content || '';
    
    if (nlp && this.tokenizer) {
      // NLP-based analysis
      const tokens = this.tokenizer.tokenize(content);
      const stems = tokens.map(token => nlp.PorterStemmer.stem(token));
      
      // TF-IDF analysis
      this.tfidf.addDocument(content);
      const keywords = [];
      this.tfidf.listTerms(0).forEach(item => {
        if (item.tfidf > 0.1) {
          keywords.push({ term: item.term, score: item.tfidf });
        }
      });
      
      return {
        tokens,
        stems,
        keywords,
        topics: this.extractTopics(content),
        entities: this.extractEntities(content),
        complexity: this.calculateTextComplexity(content),
        language: this.detectLanguage(content),
        domain: this.detectDomain(content)
      };
      
    } else {
      // Heuristic analysis
      return {
        tokens: content.split(/\s+/),
        keywords: this.extractKeywordsHeuristic(content),
        topics: this.extractTopics(content),
        entities: this.extractEntities(content),
        complexity: this.calculateTextComplexity(content),
        language: 'en',
        domain: this.detectDomain(content)
      };
    }
  }
  
  /**
   * Analyze behavioral context
   */
  analyzeBehavioralContext(interaction) {
    return {
      frustrationLevel: this.behavioralIndicators.frustration,
      engagementLevel: this.behavioralIndicators.engagement,
      expertiseLevel: this.behavioralIndicators.expertise,
      moodScore: this.behavioralIndicators.mood,
      fatigueLevel: this.behavioralIndicators.fatigue,
      
      patterns: {
        isRepeatingAction: this.detectRepeatingAction(interaction),
        isExploring: this.detectExploration(interaction),
        isStuck: this.detectStuckState(interaction),
        isLearning: this.detectLearningBehavior(interaction),
        isOptimizing: this.detectOptimizationBehavior(interaction)
      },
      
      velocity: {
        actionSpeed: this.calculateActionSpeed(),
        decisionSpeed: this.calculateDecisionSpeed(),
        learningRate: this.calculateLearningRate()
      }
    };
  }
  
  /**
   * Analyze task context
   */
  analyzeTaskContext(interaction) {
    const task = interaction.task || {};
    
    return {
      type: this.classifyTaskType(task),
      complexity: this.assessTaskComplexity(task),
      progress: task.progress || 0,
      dependencies: task.dependencies || [],
      priority: task.priority || 'medium',
      deadline: task.deadline || null,
      
      stage: this.detectTaskStage(task),
      blockers: this.identifyBlockers(task),
      requirements: this.extractRequirements(task),
      
      history: {
        similar: this.findSimilarTasks(task),
        success: this.getTaskSuccessRate(task.type),
        avgDuration: this.getAvgTaskDuration(task.type)
      }
    };
  }
  
  /**
   * Analyze environmental context
   */
  analyzeEnvironmentalContext(interaction) {
    return {
      platform: interaction.platform || 'unknown',
      device: interaction.device || 'desktop',
      os: interaction.os || process.platform,
      browser: interaction.browser || 'node',
      screenSize: interaction.screenSize || null,
      
      project: {
        path: interaction.projectPath || process.cwd(),
        type: this.detectProjectType(interaction.projectPath),
        language: this.detectProjectLanguage(interaction.projectPath),
        framework: this.detectFramework(interaction.projectPath),
        size: this.estimateProjectSize(interaction.projectPath)
      },
      
      tools: {
        available: interaction.availableTools || [],
        preferred: this.getPreferredTools(),
        recent: this.getRecentTools()
      }
    };
  }
  
  /**
   * Analyze social context
   */
  analyzeSocialContext(interaction) {
    return {
      collaboration: {
        isCollaborative: interaction.isCollaborative || false,
        teamSize: interaction.teamSize || 1,
        role: interaction.userRole || 'individual',
        communicationStyle: this.detectCommunicationStyle(interaction)
      },
      
      preferences: {
        formality: this.detectFormalityLevel(interaction),
        verbosity: this.detectVerbosityPreference(interaction),
        interactionStyle: this.detectInteractionStyle(interaction)
      }
    };
  }
  
  /**
   * Analyze emotional context
   */
  async analyzeEmotionalContext(interaction) {
    const content = interaction.content || '';
    
    let sentiment = 0;
    let emotions = {};
    
    if (nlp && this.sentiment) {
      // NLP-based sentiment analysis
      const tokens = this.tokenizer.tokenize(content);
      sentiment = this.sentiment.getSentiment(tokens);
      
    } else {
      // Heuristic sentiment analysis
      sentiment = this.analyzeSentimentHeuristic(content);
    }
    
    // Detect specific emotions
    emotions = {
      happiness: this.detectEmotion(content, 'happiness'),
      frustration: this.detectEmotion(content, 'frustration'),
      confusion: this.detectEmotion(content, 'confusion'),
      excitement: this.detectEmotion(content, 'excitement'),
      anxiety: this.detectEmotion(content, 'anxiety'),
      satisfaction: this.detectEmotion(content, 'satisfaction')
    };
    
    return {
      sentiment,
      emotions,
      mood: this.calculateMood(sentiment, emotions),
      stress: this.detectStressLevel(interaction),
      motivation: this.detectMotivationLevel(interaction)
    };
  }
  
  /**
   * Analyze cognitive load
   */
  analyzeCognitiveLoad(interaction) {
    const factors = {
      taskComplexity: interaction.taskComplexity || 0.5,
      informationDensity: this.calculateInfoDensity(interaction),
      decisionPoints: this.countDecisionPoints(interaction),
      multitasking: this.detectMultitasking(interaction),
      timePreassure: interaction.timePressure || 0
    };
    
    // Calculate overall cognitive load
    const load = Object.values(factors).reduce((sum, val) => sum + val, 0) / 
                 Object.keys(factors).length;
    
    return {
      overall: load,
      factors,
      recommendation: this.getCognitiveLoadRecommendation(load),
      optimal: load >= 0.3 && load <= 0.7
    };
  }
  
  /**
   * Detect user intent
   */
  async detectIntent(interaction) {
    const content = interaction.content || '';
    const context = this.currentContext;
    
    // Intent patterns
    const intents = {
      'create': /\b(create|make|build|generate|new|add)\b/i,
      'modify': /\b(change|modify|update|edit|alter|revise)\b/i,
      'debug': /\b(debug|fix|error|bug|issue|problem)\b/i,
      'explore': /\b(explore|search|find|look|discover)\b/i,
      'learn': /\b(learn|understand|explain|how|why|what)\b/i,
      'optimize': /\b(optimize|improve|enhance|speed|performance)\b/i,
      'test': /\b(test|verify|check|validate|ensure)\b/i,
      'document': /\b(document|comment|describe|explain)\b/i,
      'refactor': /\b(refactor|clean|organize|restructure)\b/i,
      'collaborate': /\b(share|collaborate|team|together)\b/i
    };
    
    const detected = [];
    for (const [intent, pattern] of Object.entries(intents)) {
      if (pattern.test(content)) {
        detected.push({
          type: intent,
          confidence: this.calculateIntentConfidence(content, pattern)
        });
      }
    }
    
    // Sort by confidence
    detected.sort((a, b) => b.confidence - a.confidence);
    
    return {
      primary: detected[0] || { type: 'unknown', confidence: 0 },
      secondary: detected[1] || null,
      all: detected,
      confidence: detected[0] ? detected[0].confidence : 0
    };
  }
  
  /**
   * Generate context embeddings
   */
  generateContextEmbeddings(interaction) {
    // Create multi-dimensional context representation
    const dimensions = 32;
    const embeddings = new Array(dimensions).fill(0);
    
    // Encode various context aspects
    const aspects = [
      this.behavioralIndicators.frustration,
      this.behavioralIndicators.engagement,
      this.behavioralIndicators.expertise,
      interaction.sessionDuration / 3600000, // Normalize to hours
      new Date().getHours() / 24,
      this.metrics.contextsAnalyzed / 100
    ];
    
    // Hash aspects into embedding space
    aspects.forEach((value, index) => {
      for (let i = 0; i < dimensions; i++) {
        embeddings[i] += value * Math.sin((index + 1) * (i + 1));
      }
    });
    
    // Normalize
    const magnitude = Math.sqrt(embeddings.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      embeddings.forEach((val, i) => embeddings[i] = val / magnitude);
    }
    
    return embeddings;
  }
  
  /**
   * Generate context summary
   */
  generateContextSummary(analysis) {
    // Determine primary context type
    let type = 'general';
    let confidence = 0.5;
    let description = '';
    
    // Check behavioral patterns
    if (analysis.behavioral.patterns.isStuck) {
      type = 'stuck';
      confidence = 0.8;
      description = 'User appears to be stuck or blocked';
    } else if (analysis.behavioral.patterns.isLearning) {
      type = 'learning';
      confidence = 0.7;
      description = 'User is in learning/exploration mode';
    } else if (analysis.behavioral.patterns.isOptimizing) {
      type = 'optimizing';
      confidence = 0.75;
      description = 'User is optimizing or improving existing work';
    }
    
    // Check emotional state
    if (analysis.emotional.sentiment < -0.3) {
      type = 'frustrated';
      confidence = Math.abs(analysis.emotional.sentiment);
      description = 'User shows signs of frustration';
    } else if (analysis.emotional.sentiment > 0.5) {
      type = 'satisfied';
      confidence = analysis.emotional.sentiment;
      description = 'User appears satisfied and engaged';
    }
    
    // Check cognitive load
    if (analysis.cognitive.overall > 0.8) {
      type = 'overwhelmed';
      confidence = analysis.cognitive.overall;
      description = 'High cognitive load detected';
    }
    
    return {
      type,
      confidence,
      description,
      recommendations: this.getContextRecommendations(type),
      adaptations: this.getContextAdaptations(type)
    };
  }
  
  // Helper methods
  
  initializePatterns() {
    this.patterns = {
      frustration: [
        /\b(stuck|confused|lost|help|don't understand)\b/i,
        /\b(not work|broken|failed|error)\b/i,
        /\b(why|how come|supposed to)\b/i
      ],
      satisfaction: [
        /\b(great|awesome|perfect|excellent|good job)\b/i,
        /\b(works|success|done|complete)\b/i,
        /\b(thanks|thank you|appreciated)\b/i
      ],
      learning: [
        /\b(how|why|what|explain|understand)\b/i,
        /\b(learn|tutorial|guide|example)\b/i,
        /\b(show me|teach me|help me understand)\b/i
      ]
    };
  }
  
  getCacheKey(interaction) {
    const content = interaction.content || '';
    return `${content.substring(0, 50)}-${interaction.timestamp || Date.now()}`;
  }
  
  getTimeSinceLastInteraction() {
    if (this.contextHistory.length === 0) return Infinity;
    const last = this.contextHistory[this.contextHistory.length - 1];
    return Date.now() - last.timestamp.getTime();
  }
  
  calculateInteractionFrequency() {
    if (this.contextHistory.length < 2) return 0;
    
    const windowSize = Math.min(this.contextHistory.length, 10);
    const recent = this.contextHistory.slice(-windowSize);
    const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp;
    
    return windowSize / (timeSpan / 1000); // Interactions per second
  }
  
  getSeason(date) {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }
  
  extractKeywordsHeuristic(content) {
    const words = content.toLowerCase().split(/\s+/);
    const frequency = {};
    
    words.forEach(word => {
      if (word.length > 3) { // Skip short words
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });
    
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([term, count]) => ({ term, score: count / words.length }));
  }
  
  extractTopics(content) {
    const topics = [];
    const topicPatterns = {
      'coding': /\b(code|function|variable|class|method)\b/i,
      'testing': /\b(test|spec|assertion|mock|coverage)\b/i,
      'debugging': /\b(debug|error|bug|fix|issue)\b/i,
      'documentation': /\b(document|comment|readme|docs)\b/i,
      'performance': /\b(performance|optimize|speed|efficient)\b/i,
      'security': /\b(security|auth|encrypt|vulnerability)\b/i
    };
    
    for (const [topic, pattern] of Object.entries(topicPatterns)) {
      if (pattern.test(content)) {
        topics.push(topic);
      }
    }
    
    return topics;
  }
  
  extractEntities(content) {
    // Simple entity extraction
    const entities = [];
    
    // File paths
    const filePaths = content.match(/[\w\-./]+\.\w+/g) || [];
    filePaths.forEach(path => entities.push({ type: 'file', value: path }));
    
    // URLs
    const urls = content.match(/https?:\/\/[^\s]+/g) || [];
    urls.forEach(url => entities.push({ type: 'url', value: url }));
    
    // Code identifiers (camelCase, snake_case)
    const identifiers = content.match(/\b[a-z]+[A-Z]\w+\b|\b\w+_\w+\b/g) || [];
    identifiers.forEach(id => entities.push({ type: 'identifier', value: id }));
    
    return entities;
  }
  
  calculateTextComplexity(content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    const words = content.split(/\s+/).filter(w => w);
    const avgWordsPerSentence = words.length / (sentences.length || 1);
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / (words.length || 1);
    
    // Flesch Reading Ease approximation
    const complexity = 1 - (206.835 - 1.015 * avgWordsPerSentence - 84.6 * (avgWordLength / 4.7)) / 100;
    
    return Math.max(0, Math.min(1, complexity));
  }
  
  detectLanguage(content) {
    // Simple language detection based on common words
    const langPatterns = {
      'en': /\b(the|is|are|was|were|have|has|do|does)\b/i,
      'es': /\b(el|la|los|las|es|son|está|están)\b/i,
      'fr': /\b(le|la|les|est|sont|avoir|être)\b/i,
      'de': /\b(der|die|das|ist|sind|haben|werden)\b/i
    };
    
    for (const [lang, pattern] of Object.entries(langPatterns)) {
      if (pattern.test(content)) return lang;
    }
    
    return 'en'; // Default
  }
  
  detectDomain(content) {
    const domains = {
      'web': /\b(html|css|javascript|react|vue|angular)\b/i,
      'backend': /\b(api|database|server|endpoint|sql)\b/i,
      'mobile': /\b(ios|android|swift|kotlin|flutter)\b/i,
      'data': /\b(data|analysis|machine learning|ai|statistics)\b/i,
      'devops': /\b(docker|kubernetes|ci|cd|deploy)\b/i
    };
    
    for (const [domain, pattern] of Object.entries(domains)) {
      if (pattern.test(content)) return domain;
    }
    
    return 'general';
  }
  
  detectRepeatingAction(interaction) {
    // Check if user is repeating similar actions
    if (this.contextHistory.length < 3) return false;
    
    const recent = this.contextHistory.slice(-3);
    const similarity = recent.filter(ctx => 
      ctx.intent && ctx.intent.primary.type === recent[0].intent.primary.type
    ).length;
    
    return similarity >= 3;
  }
  
  detectExploration(interaction) {
    // Check for exploratory behavior
    const exploratoryWords = /\b(what|how|where|explore|find|search|look)\b/i;
    return exploratoryWords.test(interaction.content || '');
  }
  
  detectStuckState(interaction) {
    // Detect if user is stuck
    return this.behavioralIndicators.frustration > 0.6 && 
           this.detectRepeatingAction(interaction);
  }
  
  detectLearningBehavior(interaction) {
    const learningWords = /\b(learn|understand|explain|tutorial|guide|example)\b/i;
    return learningWords.test(interaction.content || '');
  }
  
  detectOptimizationBehavior(interaction) {
    const optimizationWords = /\b(optimize|improve|faster|better|refactor|clean)\b/i;
    return optimizationWords.test(interaction.content || '');
  }
  
  calculateActionSpeed() {
    if (this.contextHistory.length < 2) return 0;
    
    const recent = this.contextHistory.slice(-5);
    const timeDiffs = [];
    
    for (let i = 1; i < recent.length; i++) {
      const diff = recent[i].timestamp - recent[i - 1].timestamp;
      timeDiffs.push(diff);
    }
    
    const avgTime = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
    return 1 / (avgTime / 1000); // Actions per second
  }
  
  calculateDecisionSpeed() {
    // Placeholder - would track decision points and timing
    return Math.random() * 0.5 + 0.25;
  }
  
  calculateLearningRate() {
    // Track improvement over time
    const improvement = this.behavioralIndicators.expertise - 0.5;
    return Math.max(0, Math.min(1, improvement + 0.5));
  }
  
  classifyTaskType(task) {
    if (!task.description) return 'unknown';
    
    const description = task.description.toLowerCase();
    
    if (description.includes('create') || description.includes('new')) return 'creation';
    if (description.includes('fix') || description.includes('bug')) return 'bugfix';
    if (description.includes('test')) return 'testing';
    if (description.includes('document')) return 'documentation';
    if (description.includes('refactor')) return 'refactoring';
    if (description.includes('optimize')) return 'optimization';
    
    return 'general';
  }
  
  assessTaskComplexity(task) {
    let complexity = 0.5; // Base complexity
    
    // Factors that increase complexity
    if (task.dependencies && task.dependencies.length > 3) complexity += 0.2;
    if (task.estimatedTime && task.estimatedTime > 3600) complexity += 0.1;
    if (task.requiresResearch) complexity += 0.15;
    if (task.involveMultipleSystems) complexity += 0.15;
    
    return Math.min(1, complexity);
  }
  
  detectTaskStage(task) {
    if (!task.progress) return 'not-started';
    if (task.progress < 0.2) return 'planning';
    if (task.progress < 0.5) return 'early-development';
    if (task.progress < 0.8) return 'implementation';
    if (task.progress < 1) return 'testing';
    return 'completed';
  }
  
  identifyBlockers(task) {
    const blockers = [];
    
    if (task.waitingFor) blockers.push({ type: 'dependency', item: task.waitingFor });
    if (task.missingInfo) blockers.push({ type: 'information', item: task.missingInfo });
    if (task.technicalIssue) blockers.push({ type: 'technical', item: task.technicalIssue });
    
    return blockers;
  }
  
  extractRequirements(task) {
    // Extract requirements from task description
    return {
      functional: [],
      technical: [],
      quality: []
    };
  }
  
  findSimilarTasks(task) {
    // Would search task history for similar tasks
    return [];
  }
  
  getTaskSuccessRate(taskType) {
    // Would calculate historical success rate
    return 0.75 + Math.random() * 0.2;
  }
  
  getAvgTaskDuration(taskType) {
    // Would calculate average duration from history
    return 1800 + Math.random() * 3600; // 30-90 minutes
  }
  
  detectProjectType(projectPath) {
    if (!projectPath) return 'unknown';
    
    // Would check for framework files
    return 'node';
  }
  
  detectProjectLanguage(projectPath) {
    // Would analyze file extensions
    return 'javascript';
  }
  
  detectFramework(projectPath) {
    // Would check package.json or other indicators
    return 'express';
  }
  
  estimateProjectSize(projectPath) {
    // Would count files and lines
    return 'medium';
  }
  
  getPreferredTools() {
    // Would track tool usage patterns
    return ['vscode', 'git', 'npm'];
  }
  
  getRecentTools() {
    // Would track recent tool usage
    return ['git', 'npm'];
  }
  
  detectCommunicationStyle(interaction) {
    const content = interaction.content || '';
    
    if (content.length < 20) return 'concise';
    if (content.length > 200) return 'detailed';
    return 'balanced';
  }
  
  detectFormalityLevel(interaction) {
    const content = interaction.content || '';
    const formalWords = /\b(please|thank you|would you|could you|kindly)\b/i;
    const informalWords = /\b(hey|yeah|gonna|wanna|stuff)\b/i;
    
    if (formalWords.test(content)) return 'formal';
    if (informalWords.test(content)) return 'informal';
    return 'neutral';
  }
  
  detectVerbosityPreference(interaction) {
    // Based on user's questions and responses
    return 'balanced';
  }
  
  detectInteractionStyle(interaction) {
    if (interaction.isCommand) return 'command';
    if (interaction.isQuestion) return 'inquisitive';
    if (interaction.isStatement) return 'declarative';
    return 'mixed';
  }
  
  analyzeSentimentHeuristic(content) {
    let score = 0;
    
    const positive = /\b(good|great|excellent|happy|love|awesome|perfect)\b/gi;
    const negative = /\b(bad|terrible|hate|wrong|error|fail|broken)\b/gi;
    
    const posMatches = content.match(positive) || [];
    const negMatches = content.match(negative) || [];
    
    score = (posMatches.length - negMatches.length) / 
            Math.max(1, posMatches.length + negMatches.length);
    
    return score;
  }
  
  detectEmotion(content, emotion) {
    const patterns = {
      happiness: /\b(happy|joy|excited|great|wonderful|awesome)\b/i,
      frustration: /\b(frustrated|annoyed|irritated|stuck|confused)\b/i,
      confusion: /\b(confused|lost|unclear|don't understand|what)\b/i,
      excitement: /\b(excited|amazing|wow|incredible|fantastic)\b/i,
      anxiety: /\b(worried|anxious|nervous|concerned|afraid)\b/i,
      satisfaction: /\b(satisfied|good|complete|done|finished)\b/i
    };
    
    const pattern = patterns[emotion];
    if (!pattern) return 0;
    
    const matches = content.match(pattern) || [];
    return Math.min(1, matches.length * 0.3);
  }
  
  calculateMood(sentiment, emotions) {
    // Weighted combination of sentiment and emotions
    let mood = sentiment * 0.4;
    
    mood += emotions.happiness * 0.2;
    mood += emotions.satisfaction * 0.1;
    mood += emotions.excitement * 0.1;
    mood -= emotions.frustration * 0.15;
    mood -= emotions.anxiety * 0.05;
    
    return Math.max(-1, Math.min(1, mood));
  }
  
  detectStressLevel(interaction) {
    const factors = {
      timePressure: interaction.timePressure || 0,
      frustration: this.behavioralIndicators.frustration,
      cognitiveLoad: interaction.cognitiveLoad || 0.5,
      errorRate: interaction.errorRate || 0
    };
    
    return Object.values(factors).reduce((sum, val) => sum + val, 0) / 
           Object.keys(factors).length;
  }
  
  detectMotivationLevel(interaction) {
    return Math.max(0, 
      this.behavioralIndicators.engagement * 0.5 + 
      (1 - this.behavioralIndicators.frustration) * 0.3 +
      (1 - this.behavioralIndicators.fatigue) * 0.2
    );
  }
  
  calculateInfoDensity(interaction) {
    const content = interaction.content || '';
    const words = content.split(/\s+/).length;
    const uniqueWords = new Set(content.toLowerCase().split(/\s+/)).size;
    
    return uniqueWords / Math.max(1, words);
  }
  
  countDecisionPoints(interaction) {
    const content = interaction.content || '';
    const decisionWords = /\b(choose|decide|select|option|either|or)\b/gi;
    const matches = content.match(decisionWords) || [];
    
    return matches.length;
  }
  
  detectMultitasking(interaction) {
    // Check if multiple tasks are mentioned
    const taskIndicators = /\b(also|meanwhile|additionally|and then|while)\b/i;
    return taskIndicators.test(interaction.content || '');
  }
  
  getCognitiveLoadRecommendation(load) {
    if (load < 0.3) return 'Can handle more complex tasks';
    if (load > 0.7) return 'Consider simplifying or breaking down tasks';
    return 'Optimal cognitive load';
  }
  
  calculateIntentConfidence(content, pattern) {
    const matches = content.match(pattern) || [];
    return Math.min(1, 0.3 + matches.length * 0.2);
  }
  
  updateBehavioralIndicators(analysis) {
    // Update frustration
    this.behavioralIndicators.frustration *= this.config.frustrationDecay;
    if (analysis.emotional.emotions.frustration > 0.5) {
      this.behavioralIndicators.frustration = Math.min(1, 
        this.behavioralIndicators.frustration + 0.1
      );
    }
    
    // Update engagement
    if (analysis.behavioral.velocity.actionSpeed > 0.5) {
      this.behavioralIndicators.engagement = Math.min(1,
        this.behavioralIndicators.engagement * this.config.engagementBoost
      );
    }
    
    // Update expertise
    if (analysis.task.complexity > 0.7 && analysis.emotional.sentiment > 0) {
      this.behavioralIndicators.expertise = Math.min(1,
        this.behavioralIndicators.expertise + 0.05
      );
    }
    
    // Update mood
    this.behavioralIndicators.mood = analysis.emotional.mood;
    
    // Update fatigue
    const sessionDuration = analysis.temporal.sessionDuration / 3600000; // Hours
    this.behavioralIndicators.fatigue = Math.min(1, sessionDuration / 4);
  }
  
  getContextRecommendations(contextType) {
    const recommendations = {
      'stuck': ['Provide examples', 'Break down the problem', 'Suggest alternatives'],
      'learning': ['Provide explanations', 'Show examples', 'Link to resources'],
      'optimizing': ['Show metrics', 'Suggest improvements', 'Provide benchmarks'],
      'frustrated': ['Simplify responses', 'Provide clear steps', 'Offer assistance'],
      'satisfied': ['Maintain current approach', 'Offer advanced features'],
      'overwhelmed': ['Break into smaller steps', 'Focus on essentials', 'Reduce information'],
      'general': ['Balanced approach', 'Monitor for changes']
    };
    
    return recommendations[contextType] || recommendations['general'];
  }
  
  getContextAdaptations(contextType) {
    const adaptations = {
      'stuck': { verbosity: 'high', examples: true, pace: 'slow' },
      'learning': { verbosity: 'medium', examples: true, explanations: true },
      'optimizing': { verbosity: 'low', metrics: true, technical: true },
      'frustrated': { verbosity: 'low', clarity: 'high', encouragement: true },
      'satisfied': { verbosity: 'medium', pace: 'normal' },
      'overwhelmed': { verbosity: 'minimal', pace: 'slow', chunks: 'small' },
      'general': { verbosity: 'medium', pace: 'normal' }
    };
    
    return adaptations[contextType] || adaptations['general'];
  }
  
  getDefaultContext() {
    return {
      id: `context-default-${Date.now()}`,
      timestamp: new Date(),
      temporal: {},
      semantic: {},
      behavioral: this.behavioralIndicators,
      task: {},
      environmental: {},
      social: {},
      emotional: { sentiment: 0, emotions: {} },
      cognitive: { overall: 0.5 },
      intent: { primary: { type: 'unknown', confidence: 0 } },
      embeddings: new Array(32).fill(0),
      summary: {
        type: 'unknown',
        confidence: 0,
        description: 'Unable to analyze context',
        recommendations: [],
        adaptations: {}
      }
    };
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      historyDepth: this.contextHistory.length,
      behavioralIndicators: { ...this.behavioralIndicators }
    };
  }
  
  /**
   * Reset behavioral indicators
   */
  resetIndicators() {
    this.behavioralIndicators = {
      frustration: 0,
      engagement: 1,
      expertise: 0.5,
      mood: 0,
      fatigue: 0
    };
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('Context cache cleared');
  }
}

module.exports = ContextAnalyzer;