/**
 * BUMBA Specialist Maturity System
 * Tracks which specialists are production-ready vs experimental
 * 
 * SOLVES: Users don't know which specialists actually work
 * RESULT: Clear maturity indicators for all specialists
 */

const { logger } = require('../logging/bumba-logger');

// Maturity levels for specialists
const MATURITY = {
  EXPERIMENTAL: {
    level: 0,
    name: 'Experimental',
    icon: '🧪',
    description: 'Early stage, may not work',
    color: 'gray'
  },
  ALPHA: {
    level: 1,
    name: 'Alpha',
    icon: '🔬',
    description: 'Basic functionality, rough edges',
    color: 'yellow'
  },
  BETA: {
    level: 2,
    name: 'Beta',
    icon: '🔧',
    description: 'Works well, being refined',
    color: 'blue'
  },
  STABLE: {
    level: 3,
    name: 'Stable',
    icon: '✅',
    description: 'Production ready',
    color: 'green'
  },
  VERIFIED: {
    level: 4,
    name: 'Verified',
    icon: '🏆',
    description: 'Battle-tested in production',
    color: 'gold'
  }
};

/**
 * Specialist Maturity Database
 * Manually curated based on actual testing
 */
const SPECIALIST_MATURITY = {
  // VERIFIED - Battle-tested specialists
  'javascript-specialist': {
    maturity: MATURITY.VERIFIED,
    lastVerified: '2025-01-20',
    notes: 'Extensively tested, handles all JS/Node patterns',
    capabilities: {
      claimed: ['es6+', 'async/await', 'node.js'],
      verified: ['es6+', 'async/await', 'node.js']
    }
  },
  'typescript-specialist': {
    maturity: MATURITY.VERIFIED,
    lastVerified: '2025-01-20',
    notes: 'Excellent type checking and interface design',
    capabilities: {
      claimed: ['types', 'interfaces', 'generics'],
      verified: ['types', 'interfaces', 'generics']
    }
  },
  'python-specialist': {
    maturity: MATURITY.VERIFIED,
    lastVerified: '2025-01-20',
    notes: 'Comprehensive Python 3 support',
    capabilities: {
      claimed: ['python3', 'async', 'data science'],
      verified: ['python3', 'async']
    }
  },
  
  // STABLE - Production ready
  'react-specialist': {
    maturity: MATURITY.STABLE,
    lastVerified: '2025-01-15',
    notes: 'Solid React/hooks support',
    capabilities: {
      claimed: ['components', 'hooks', 'state'],
      verified: ['components', 'hooks']
    }
  },
  'database-admin': {
    maturity: MATURITY.STABLE,
    lastVerified: '2025-01-15',
    notes: 'Good SQL and schema design',
    capabilities: {
      claimed: ['sql', 'optimization', 'design'],
      verified: ['sql', 'design']
    }
  },
  'api-architect': {
    maturity: MATURITY.STABLE,
    lastVerified: '2025-01-15',
    notes: 'RESTful API design patterns',
    capabilities: {
      claimed: ['rest', 'graphql', 'openapi'],
      verified: ['rest', 'openapi']
    }
  },
  
  // BETA - Works but needs refinement
  'devops-engineer': {
    maturity: MATURITY.BETA,
    lastVerified: '2025-01-10',
    notes: 'CI/CD and Docker support',
    capabilities: {
      claimed: ['docker', 'ci/cd', 'kubernetes'],
      verified: ['docker', 'ci/cd']
    }
  },
  'security-auditor': {
    maturity: MATURITY.BETA,
    lastVerified: '2025-01-10',
    notes: 'Basic security scanning',
    capabilities: {
      claimed: ['owasp', 'scanning', 'auditing'],
      verified: ['scanning']
    }
  },
  'performance-engineer': {
    maturity: MATURITY.BETA,
    lastVerified: '2025-01-10',
    notes: 'Performance analysis tools',
    capabilities: {
      claimed: ['profiling', 'optimization', 'metrics'],
      verified: ['profiling']
    }
  },
  
  // ALPHA - Basic functionality
  'ml-engineer': {
    maturity: MATURITY.ALPHA,
    lastVerified: '2025-01-05',
    notes: 'Basic ML patterns',
    capabilities: {
      claimed: ['tensorflow', 'pytorch', 'scikit'],
      verified: []
    }
  },
  'blockchain-specialist': {
    maturity: MATURITY.ALPHA,
    lastVerified: '2025-01-05',
    notes: 'Smart contract basics',
    capabilities: {
      claimed: ['ethereum', 'solidity', 'web3'],
      verified: []
    }
  },
  
  // EXPERIMENTAL - Not ready for production
  'game-developer': {
    maturity: MATURITY.EXPERIMENTAL,
    lastVerified: null,
    notes: 'Placeholder implementation',
    capabilities: {
      claimed: ['unity', 'unreal', 'physics'],
      verified: []
    }
  },
  'unity-developer': {
    maturity: MATURITY.EXPERIMENTAL,
    lastVerified: null,
    notes: 'Needs API keys and Unity knowledge',
    capabilities: {
      claimed: ['unity', 'c#', '3d'],
      verified: []
    }
  }
};

/**
 * Specialist Maturity Manager
 */
class SpecialistMaturityManager {
  constructor() {
    this.maturityData = SPECIALIST_MATURITY;
    this.defaultMaturity = MATURITY.EXPERIMENTAL;
  }
  
  /**
   * Get maturity info for a specialist
   */
  getMaturity(specialistId) {
    const data = this.maturityData[specialistId];
    if (!data) {
      return {
        maturity: this.defaultMaturity,
        lastVerified: null,
        notes: 'Not yet evaluated',
        capabilities: {
          claimed: [],
          verified: []
        }
      };
    }
    return data;
  }
  
  /**
   * Check if specialist is production ready
   */
  isProductionReady(specialistId) {
    const data = this.getMaturity(specialistId);
    return data.maturity.level >= MATURITY.STABLE.level;
  }
  
  /**
   * Get all verified specialists
   */
  getVerifiedSpecialists() {
    return Object.entries(this.maturityData)
      .filter(([id, data]) => data.maturity.level >= MATURITY.STABLE.level)
      .map(([id, data]) => ({
        id,
        name: id.replace('-specialist', '').replace(/-/g, ' '),
        ...data
      }));
  }
  
  /**
   * Get specialists by maturity level
   */
  getByMaturityLevel(level) {
    return Object.entries(this.maturityData)
      .filter(([id, data]) => data.maturity.level === level)
      .map(([id, data]) => ({
        id,
        name: id.replace('-specialist', '').replace(/-/g, ' '),
        ...data
      }));
  }
  
  /**
   * Generate maturity report
   */
  generateReport() {
    const stats = {
      total: Object.keys(this.maturityData).length,
      verified: 0,
      stable: 0,
      beta: 0,
      alpha: 0,
      experimental: 0
    };
    
    Object.values(this.maturityData).forEach(data => {
      switch(data.maturity.level) {
        case 4: stats.verified++; break;
        case 3: stats.stable++; break;
        case 2: stats.beta++; break;
        case 1: stats.alpha++; break;
        case 0: stats.experimental++; break;
      }
    });
    
    return stats;
  }
  
  /**
   * Display maturity status
   */
  displayStatus(specialistId) {
    const data = this.getMaturity(specialistId);
    const m = data.maturity;
    
    return `${m.icon} ${m.name} - ${m.description}`;
  }
  
  /**
   * Format for CLI display
   */
  formatForCLI() {
    const verified = this.getVerifiedSpecialists();
    const beta = this.getByMaturityLevel(MATURITY.BETA.level);
    const alpha = this.getByMaturityLevel(MATURITY.ALPHA.level);
    
    let output = '';
    
    if (verified.length > 0) {
      output += '\n🏆 PRODUCTION READY:\n';
      verified.forEach(spec => {
        output += `  ${spec.maturity.icon} ${spec.name} - ${spec.notes}\n`;
      });
    }
    
    if (beta.length > 0) {
      output += '\n🔧 BETA (Use with caution):\n';
      beta.forEach(spec => {
        output += `  ${spec.maturity.icon} ${spec.name} - ${spec.notes}\n`;
      });
    }
    
    if (alpha.length > 0) {
      output += '\n🔬 ALPHA (Experimental):\n';
      alpha.forEach(spec => {
        output += `  ${spec.maturity.icon} ${spec.name} - ${spec.notes}\n`;
      });
    }
    
    const stats = this.generateReport();
    output += '\n📊 SUMMARY:\n';
    output += `  Total: ${stats.total} specialists\n`;
    output += `  Production Ready: ${stats.verified + stats.stable} (${Math.round((stats.verified + stats.stable) / stats.total * 100)}%)\n`;
    output += `  In Development: ${stats.beta + stats.alpha} (${Math.round((stats.beta + stats.alpha) / stats.total * 100)}%)\n`;
    
    return output;
  }
  
  /**
   * Export verified specialists manifest
   */
  exportVerifiedManifest() {
    const manifest = {
      version: '2.0',
      generated: new Date().toISOString(),
      specialists: this.getVerifiedSpecialists(),
      stats: this.generateReport()
    };
    
    return manifest;
  }
}

// Singleton instance
let instance = null;

function getMaturityManager() {
  if (!instance) {
    instance = new SpecialistMaturityManager();
  }
  return instance;
}

module.exports = {
  MATURITY,
  SpecialistMaturityManager,
  getMaturityManager,
  SPECIALIST_MATURITY
};