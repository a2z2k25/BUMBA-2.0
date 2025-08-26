/**
 * BUMBA Cultural Vibes Enhancement
 * Adds Toronto/Jamaican slang to ~15% of agent responses
 * Keeps it subtle and contextual, never forced
 */

class CulturalVibesEnhancer {
  constructor() {
    // 10% chance of cultural enhancement (reduced for better balance)
    this.enhancementProbability = 0.10;
    
    // Contextual word mappings for natural integration
    this.contextualSlang = {
      // Greetings and acknowledgments
      greetings: ['whagwan', 'bless', 'seen', 'zeen'],
      
      // Positive affirmations
      positive: ['blessed', 'irie', 'criss', 'wicked', 'upful'],
      
      // Progress and movement
      progress: ['forward', 'levels', 'trodding', 'reach'],
      
      // Understanding and agreement
      understanding: ['seen', 'zeen', 'overstand', 'ahlie'],
      
      // Completion and status
      completion: ['dun', 'bless'],
      
      // Observation and analysis
      observation: ['pree', 'skeen'],
      
      // Team and collaboration
      team: ['mandem', 'battri', 'massive'],
      
      // Quality and excellence
      quality: ['dime', 'criss', 'wicked', 'fiyah'],
      
      // Intensity and emphasis
      emphasis: ['bare', 'still', 'styll', 'wallahi'],
      
      // Issues and problems
      problems: ['dutty', 'facety', 'wasteman'],
      
      // Energy and atmosphere
      energy: ['vibes', 'riddim', 'livity'],
      
      // Connection and communication
      connection: ['link', 'forward'],
      
      // Small/minor things
      minor: ['likkle', 'ting'],
      
      // Serious matters
      serious: ['dread', 'rass', 'bloodclaat', 'bombaclat'],
      
      // System and authority
      system: ['babylon'],
      
      // Location and space
      location: ['ends', 'yard', 'zion', 'gully'],
      
      // Spiritual and consciousness
      spiritual: ['jah', 'herb', 'natty'],
      
      // Actions
      actions: ['gwan', 'nyam', 'flex', 'ramping', 'tallup', 'nize', 'gweh'],
      
      // People descriptors
      people: ['badman', 'gyaldem', 'sweeterman', 'gallis', 'cyattie', 'pickney'],
      
      // States and conditions
      states: ['marved', 'cheesed'],
      
      // Music and culture
      music: ['selector', 'riddim', 'clash', 'bubbler', 'chalice'],
      
      // Mystical
      mystical: ['duppy']
    };
    
    // Response enhancement patterns
    this.enhancementPatterns = {
      // Opening enhancements
      opening: {
        'I will': ['Forward, I will', 'Seen, I will', 'Blessed, I will'],
        'Let me': ['Ahlie, let me', 'Still, let me'],
        'I\'ll': ['I\'ll link up and', 'Forward, I\'ll'],
        'Starting': ['Forward now, starting', 'Bless, starting'],
        'Working on': ['Trodding on', 'Forward with']
      },
      
      // Closing enhancements
      closing: {
        'completed': ['dun', 'blessed and complete', 'reached'],
        'finished': ['dun', 'bless'],
        'done': ['dun and dusted', 'blessed'],
        'ready': ['criss and ready', 'forward and ready'],
        'successful': ['wicked successful', 'blessed successful']
      },
      
      // Emphasis replacements
      emphasis: {
        'very': ['bare', 'mad'],
        'really': ['styll', 'proper'],
        'many': ['bare', 'nuff'],
        'actually': ['styll'],
        'understood': ['seen', 'zeen'],
        'understand': ['overstand'],
        'small': ['likkle'],
        'thing': ['ting'],
        'things': ['tings'],
        'good': ['blessed', 'irie', 'criss'],
        'great': ['wicked', 'blessed'],
        'excellent': ['dime', 'wicked'],
        'amazing': ['wicked', 'mad'],
        'perfect': ['dime', 'criss'],
        'serious': ['dread'],
        'intense': ['bloodclaat', 'mad'],
        'angry': ['cheesed', 'vex'],
        'hungry': ['marved'],
        'arrive': ['reach'],
        'observe': ['pree'],
        'count': ['tallup'],
        'connect': ['link'],
        'progress': ['forward'],
        'rhythm': ['riddim'],
        'energy': ['vibes'],
        'home': ['yard'],
        'neighborhood': ['ends'],
        'crowd': ['massive'],
        'team': ['mandem'],
        'friend': ['battri', 'bredrin'],
        'happening': ['gwan'],
        'walking': ['trodding']
      }
    };
    
    // Track usage to avoid overuse
    this.recentUsage = [];
    this.maxRecentUsage = 10;
  }
  
  /**
   * Determine if this response should be culturally enhanced
   */
  shouldEnhance(context = {}) {
    // Don't enhance if recently used too much
    if (this.recentUsage.length >= 3) {
      return false;
    }
    
    // Don't enhance formal or critical contexts
    if (context.formal || context.critical || context.error) {
      return false;
    }
    
    // Random probability check
    return Math.random() < this.enhancementProbability;
  }
  
  /**
   * Enhance a response with cultural vibes
   */
  enhanceResponse(response, context = {}) {
    if (!this.shouldEnhance(context)) {
      return response;
    }
    
    let enhanced = response;
    const enhancements = [];
    
    // Try opening enhancement
    if (Math.random() < 0.3) {
      enhanced = this.addOpeningVibes(enhanced);
      enhancements.push('opening');
    }
    
    // Try word replacements (but not too many)
    if (Math.random() < 0.5) {
      const result = this.replaceWithSlang(enhanced);
      if (result.changed) {
        enhanced = result.text;
        enhancements.push(...result.words);
      }
    }
    
    // Try closing enhancement
    if (Math.random() < 0.2 && !enhancements.includes('opening')) {
      enhanced = this.addClosingVibes(enhanced);
      enhancements.push('closing');
    }
    
    // Track usage if we made changes
    if (enhancements.length > 0) {
      this.trackUsage(enhancements);
    }
    
    return enhanced;
  }
  
  /**
   * Add opening vibes to response
   */
  addOpeningVibes(response) {
    const openings = ['Seen,', 'Bless,', 'Forward,', 'Ahlie,', 'Still,'];
    
    // Only add if doesn't already start with enhancement
    const hasOpening = openings.some(o => response.startsWith(o));
    if (hasOpening) return response;
    
    // Pick random opening
    const opening = openings[Math.floor(Math.random() * openings.length)];
    
    // Add opening naturally
    if (response.match(/^(I will|I'll|Let me|Starting|Working on)/i)) {
      return `${opening} ${response.charAt(0).toLowerCase()}${response.slice(1)}`;
    }
    
    return response;
  }
  
  /**
   * Add closing vibes to response
   */
  addClosingVibes(response) {
    // Simple closing additions
    const closings = [' Bless.', ' Seen.', ' Forward.', ' Zeen.'];
    
    // Only add if ends with period and doesn't have one already
    if (response.endsWith('.') && !closings.some(c => response.endsWith(c))) {
      // Small chance to add closing
      if (Math.random() < 0.3) {
        const closing = closings[Math.floor(Math.random() * closings.length)];
        return response.slice(0, -1) + closing;
      }
    }
    
    return response;
  }
  
  /**
   * Replace words with slang equivalents
   */
  replaceWithSlang(text) {
    let modified = text;
    const wordsUsed = [];
    let changesMade = 0;
    const maxChanges = 2; // Limit changes per response
    
    // Go through emphasis replacements
    for (const [original, replacements] of Object.entries(this.enhancementPatterns.emphasis)) {
      if (changesMade >= maxChanges) break;
      
      const regex = new RegExp(`\\b${original}\\b`, 'gi');
      if (regex.test(modified)) {
        // Pick a random replacement
        const replacement = replacements[Math.floor(Math.random() * replacements.length)];
        
        // Don't use the same word twice recently
        if (!this.recentUsage.includes(replacement)) {
          modified = modified.replace(regex, replacement);
          wordsUsed.push(replacement);
          changesMade++;
        }
      }
    }
    
    return {
      text: modified,
      changed: changesMade > 0,
      words: wordsUsed
    };
  }
  
  /**
   * Track recent usage to avoid repetition
   */
  trackUsage(words) {
    this.recentUsage.push(...words);
    
    // Keep only recent usage
    if (this.recentUsage.length > this.maxRecentUsage) {
      this.recentUsage = this.recentUsage.slice(-this.maxRecentUsage);
    }
  }
  
  /**
   * Get contextual slang for specific situations
   */
  getContextualSlang(category) {
    return this.contextualSlang[category] || [];
  }
  
  /**
   * Reset usage tracking
   */
  resetUsage() {
    this.recentUsage = [];
  }
}

// Vibe type enum
const VibeType = {
  SUPPORTIVE: 'supportive',
  CREATIVE: 'creative',
  COLLABORATIVE: 'collaborative',
  CELEBRATORY: 'celebratory',
  FOCUSED: 'focused',
  ENERGETIC: 'energetic'
};

// Export singleton instance
const culturalVibes = new CulturalVibesEnhancer();

module.exports = {
  CulturalVibesEnhancer,
  CulturalVibesIntegration: CulturalVibesEnhancer, // Alias for expected export
  culturalVibes,
  VibeType
};