/**
 * BUMBA Markdown Merge Engine
 * Intelligent merging of multi-agent markdown contributions
 * Detects and resolves conflicts, maintains consistency
 */

const crypto = require('crypto');

class MarkdownMergeEngine {
  constructor() {
    this.conflictStrategies = {
      'combine': this.combineStrategy,
      'priority': this.priorityStrategy,
      'consensus': this.consensusStrategy,
      'manual': this.manualStrategy
    };
    this.defaultStrategy = 'combine';
    this.conflictMarkers = {
      start: '<<<<<<< CONFLICT',
      separator: '=======',
      end: '>>>>>>> END'
    };
  }

  /**
   * Merge multiple markdown drafts intelligently
   */
  async mergeDrafts(drafts, options = {}) {
    const {
      strategy = this.defaultStrategy,
      detectConflicts = true,
      preserveMetadata = true,
      validateStructure = true
    } = options;

    // Prepare sections for merging
    const sectionMap = this.organizeSections(drafts);
    
    // Detect conflicts if enabled
    const conflicts = detectConflicts ? this.detectConflicts(sectionMap) : [];
    
    // Apply merge strategy
    const mergedSections = await this.applyMergeStrategy(
      sectionMap,
      conflicts,
      strategy
    );
    
    // Validate structure if enabled
    if (validateStructure) {
      this.validateMarkdownStructure(mergedSections);
    }
    
    // Build final document
    const document = this.buildDocument(mergedSections, {
      preserveMetadata,
      conflicts: conflicts.length
    });
    
    return {
      content: document,
      conflicts: conflicts.length,
      conflictDetails: conflicts,
      sections: mergedSections.length,
      strategy: strategy
    };
  }

  /**
   * Organize sections from multiple drafts
   */
  organizeSections(drafts) {
    const sectionMap = new Map();
    
    drafts.forEach(draft => {
      draft.sections.forEach(section => {
        const key = this.normalizeKey(section.name);
        
        if (!sectionMap.has(key)) {
          sectionMap.set(key, {
            name: section.name,
            contents: [],
            priority: section.priority || 999
          });
        }
        
        sectionMap.get(key).contents.push({
          content: section.content,
          department: draft.department,
          timestamp: draft.createdAt
        });
      });
    });
    
    return sectionMap;
  }

  /**
   * Detect conflicts between sections
   */
  detectConflicts(sectionMap) {
    const conflicts = [];
    
    sectionMap.forEach((section, key) => {
      if (section.contents.length > 1) {
        // Check for semantic conflicts
        const conflict = this.analyzeSemanticConflict(section.contents);
        if (conflict) {
          conflicts.push({
            section: section.name,
            type: conflict.type,
            severity: conflict.severity,
            departments: section.contents.map(c => c.department),
            description: conflict.description
          });
        }
      }
    });
    
    return conflicts;
  }

  /**
   * Analyze semantic conflicts in content
   */
  analyzeSemanticConflict(contents) {
    // Extract key facts from each content
    const facts = contents.map(c => this.extractFacts(c.content));
    
    // Check for contradictions
    const contradictions = this.findContradictions(facts);
    if (contradictions.length > 0) {
      return {
        type: 'contradiction',
        severity: 'high',
        description: `Contradictory information: ${contradictions.join(', ')}`
      };
    }
    
    // Check for significant differences
    const similarity = this.calculateSimilarity(contents);
    if (similarity < 0.3) {
      return {
        type: 'divergent',
        severity: 'medium',
        description: 'Significantly different content approaches'
      };
    }
    
    // Check for overlapping information
    if (similarity > 0.8) {
      return {
        type: 'duplicate',
        severity: 'low',
        description: 'Highly similar content (possible duplication)'
      };
    }
    
    return null;
  }

  /**
   * Extract facts from markdown content
   */
  extractFacts(content) {
    const facts = [];
    
    // Extract bullet points
    const bullets = content.match(/^[\s]*[-*]\s+(.+)$/gm) || [];
    facts.push(...bullets.map(b => b.replace(/^[\s]*[-*]\s+/, '')));
    
    // Extract headings
    const headings = content.match(/^#{1,6}\s+(.+)$/gm) || [];
    facts.push(...headings.map(h => h.replace(/^#{1,6}\s+/, '')));
    
    // Extract key numbers/metrics
    const numbers = content.match(/\d+%|\d+\s+\w+/g) || [];
    facts.push(...numbers);
    
    return facts;
  }

  /**
   * Find contradictions between fact sets
   */
  findContradictions(factSets) {
    const contradictions = [];
    
    // Simple contradiction detection (would be more sophisticated in production)
    factSets.forEach((facts1, i) => {
      factSets.forEach((facts2, j) => {
        if (i >= j) {return;}
        
        facts1.forEach(fact1 => {
          facts2.forEach(fact2 => {
            if (this.areContradictory(fact1, fact2)) {
              contradictions.push(`"${fact1}" vs "${fact2}"`);
            }
          });
        });
      });
    });
    
    return contradictions;
  }

  /**
   * Check if two facts are contradictory
   */
  areContradictory(fact1, fact2) {
    // Check for opposite numbers
    const num1 = fact1.match(/(\d+)/);
    const num2 = fact2.match(/(\d+)/);
    if (num1 && num2 && num1[0] !== num2[0]) {
      const context1 = fact1.replace(/\d+/, '').trim();
      const context2 = fact2.replace(/\d+/, '').trim();
      if (context1 === context2) {return true;}
    }
    
    // Check for opposite statements
    const opposites = [
      ['required', 'optional'],
      ['synchronous', 'asynchronous'],
      ['public', 'private'],
      ['mutable', 'immutable']
    ];
    
    for (const [word1, word2] of opposites) {
      if ((fact1.includes(word1) && fact2.includes(word2)) ||
          (fact1.includes(word2) && fact2.includes(word1))) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Calculate content similarity
   */
  calculateSimilarity(contents) {
    if (contents.length < 2) {return 1;}
    
    // Simple word-based similarity
    const wordSets = contents.map(c => {
      const words = c.content.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3);
      return new Set(words);
    });
    
    // Calculate Jaccard similarity
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < wordSets.length; i++) {
      for (let j = i + 1; j < wordSets.length; j++) {
        const intersection = new Set([...wordSets[i]].filter(x => wordSets[j].has(x)));
        const union = new Set([...wordSets[i], ...wordSets[j]]);
        totalSimilarity += intersection.size / union.size;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  /**
   * Apply merge strategy to sections
   */
  async applyMergeStrategy(sectionMap, conflicts, strategy) {
    const strategyFn = this.conflictStrategies[strategy];
    if (!strategyFn) {
      throw new Error(`Unknown merge strategy: ${strategy}`);
    }
    
    const mergedSections = [];
    
    for (const [key, section] of sectionMap) {
      const hasConflict = conflicts.some(c => 
        this.normalizeKey(c.section) === key
      );
      
      const mergedContent = await strategyFn.call(
        this,
        section,
        hasConflict
      );
      
      mergedSections.push({
        name: section.name,
        content: mergedContent,
        priority: section.priority,
        hasConflict
      });
    }
    
    // Sort by priority
    mergedSections.sort((a, b) => a.priority - b.priority);
    
    return mergedSections;
  }

  /**
   * Combine strategy - merges all content
   */
  async combineStrategy(section, hasConflict) {
    if (section.contents.length === 1) {
      return section.contents[0].content;
    }
    
    const combined = [`## ${section.name}\n`];
    
    if (hasConflict) {
      combined.push('> 🟡 **Note**: Multiple perspectives provided below\n\n');
    }
    
    section.contents.forEach((content, index) => {
      if (section.contents.length > 1) {
        combined.push(`### ${content.department} Perspective\n\n`);
      }
      combined.push(content.content);
      if (index < section.contents.length - 1) {
        combined.push('\n\n');
      }
    });
    
    return combined.join('');
  }

  /**
   * Priority strategy - uses highest priority content
   */
  async priorityStrategy(section, hasConflict) {
    // Priority order: product > backend > design
    const priorityOrder = ['product', 'backend', 'design'];
    
    const sorted = section.contents.sort((a, b) => {
      const aPriority = priorityOrder.indexOf(a.department);
      const bPriority = priorityOrder.indexOf(b.department);
      return aPriority - bPriority;
    });
    
    return sorted[0].content;
  }

  /**
   * Consensus strategy - finds common ground
   */
  async consensusStrategy(section, hasConflict) {
    if (section.contents.length === 1) {
      return section.contents[0].content;
    }
    
    // Extract common facts from all contents
    const allFacts = section.contents.map(c => this.extractFacts(c.content));
    const commonFacts = this.findCommonFacts(allFacts);
    
    // Build consensus content
    const consensus = [`## ${section.name}\n\n`];
    consensus.push('*Consensus from all departments:*\n\n');
    
    if (commonFacts.length > 0) {
      commonFacts.forEach(fact => {
        consensus.push(`- ${fact}\n`);
      });
    } else {
      // Fall back to combine strategy if no consensus
      return this.combineStrategy(section, hasConflict);
    }
    
    return consensus.join('');
  }

  /**
   * Manual strategy - marks conflicts for manual resolution
   */
  async manualStrategy(section, hasConflict) {
    if (!hasConflict || section.contents.length === 1) {
      return section.contents[0].content;
    }
    
    const marked = [`## ${section.name}\n\n`];
    marked.push(`${this.conflictMarkers.start}\n`);
    
    section.contents.forEach((content, index) => {
      marked.push(`Option ${index + 1} (${content.department}):\n`);
      marked.push(content.content);
      if (index < section.contents.length - 1) {
        marked.push(`\n${this.conflictMarkers.separator}\n`);
      }
    });
    
    marked.push(`\n${this.conflictMarkers.end}\n`);
    
    return marked.join('');
  }

  /**
   * Find common facts across all fact sets
   */
  findCommonFacts(factSets) {
    if (factSets.length === 0) {return [];}
    
    // Find facts that appear in all sets (fuzzy matching)
    const commonFacts = [];
    const firstSet = factSets[0];
    
    firstSet.forEach(fact => {
      const appearsInAll = factSets.every(set => 
        set.some(f => this.fuzzyMatch(fact, f))
      );
      if (appearsInAll) {
        commonFacts.push(fact);
      }
    });
    
    return commonFacts;
  }

  /**
   * Fuzzy string matching
   */
  fuzzyMatch(str1, str2, threshold = 0.8) {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(w => words2.includes(w));
    const similarity = commonWords.length / Math.max(words1.length, words2.length);
    
    return similarity >= threshold;
  }

  /**
   * Validate markdown structure
   */
  validateMarkdownStructure(sections) {
    sections.forEach(section => {
      // Check for proper heading structure
      const headings = section.content.match(/^#{1,6}\s+/gm) || [];
      if (headings.length === 0 && section.content.length > 100) {
        console.warn(`Warning: Section "${section.name}" lacks proper headings`);
      }
      
      // Check for unmatched code blocks
      const codeBlocks = section.content.match(/```/g) || [];
      if (codeBlocks.length % 2 !== 0) {
        console.warn(`Warning: Section "${section.name}" has unmatched code blocks`);
      }
    });
  }

  /**
   * Build final document
   */
  buildDocument(sections, metadata) {
    const parts = [];
    
    // Add metadata header if requested
    if (metadata.preserveMetadata) {
      parts.push('---');
      parts.push(`generated: ${new Date().toISOString()}`);
      parts.push(`sections: ${sections.length}`);
      parts.push(`conflicts: ${metadata.conflicts}`);
      parts.push('---\n');
    }
    
    // Add sections
    sections.forEach(section => {
      parts.push(section.content);
      parts.push('\n');
    });
    
    return parts.join('\n');
  }

  /**
   * Normalize section key for comparison
   */
  normalizeKey(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /**
   * Generate diff between two markdown contents
   */
  generateDiff(content1, content2) {
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');
    const diff = [];
    
    let i = 0, j = 0;
    while (i < lines1.length || j < lines2.length) {
      if (i >= lines1.length) {
        diff.push(`+ ${lines2[j]}`);
        j++;
      } else if (j >= lines2.length) {
        diff.push(`- ${lines1[i]}`);
        i++;
      } else if (lines1[i] === lines2[j]) {
        diff.push(`  ${lines1[i]}`);
        i++;
        j++;
      } else {
        diff.push(`- ${lines1[i]}`);
        diff.push(`+ ${lines2[j]}`);
        i++;
        j++;
      }
    }
    
    return diff.join('\n');
  }
}

module.exports = MarkdownMergeEngine;