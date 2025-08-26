/**
 * String Interning System
 * Reduces memory usage by deduplicating common strings
 */

class StringIntern {
  constructor() {
    this.pool = new Map();
    this.stats = {
      saved: 0,
      lookups: 0,
      hits: 0
    };
  }

  /**
   * Intern a string - returns the canonical instance
   */
  intern(str) {
    if (typeof str !== 'string' || str.length < 3) {
      return str; // Don't intern very short strings
    }

    this.stats.lookups++;
    
    if (this.pool.has(str)) {
      this.stats.hits++;
      this.stats.saved += str.length;
      return this.pool.get(str);
    }
    
    this.pool.set(str, str);
    return str;
  }

  /**
   * Batch intern an object's string properties
   */
  internObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = this.intern(obj[key]);
      } else if (typeof obj[key] === 'object') {
        this.internObject(obj[key]);
      }
    }
    
    return obj;
  }

  /**
   * Get memory savings statistics
   */
  getStats() {
    return {
      poolSize: this.pool.size,
      memorySaved: `${(this.stats.saved / 1024).toFixed(2)}KB`,
      hitRate: `${((this.stats.hits / this.stats.lookups) * 100).toFixed(1)}%`,
      ...this.stats
    };
  }

  /**
   * Clear the pool (for testing)
   */
  clear() {
    this.pool.clear();
    this.stats = { saved: 0, lookups: 0, hits: 0 };
  }
}

// Global singleton instance
const globalIntern = new StringIntern();

// Common strings that appear frequently in the codebase
const COMMON_STRINGS = [
  'error', 'warning', 'info', 'debug', 'trace',
  'high', 'medium', 'low', 'critical',
  'technical', 'strategic', 'experience',
  'specialist', 'department', 'framework',
  'success', 'failure', 'pending', 'completed',
  'initialize', 'execute', 'process', 'handle',
  '../logging/bumba-logger',
  'events', 'string', 'object', 'function', 'number'
];

// Pre-populate with common strings
COMMON_STRINGS.forEach(str => globalIntern.intern(str));

module.exports = {
  StringIntern,
  globalIntern,
  intern: (str) => globalIntern.intern(str),
  internObject: (obj) => globalIntern.internObject(obj),
  getStats: () => globalIntern.getStats()
};