/**
 * Circular Dependency Detector Tool
 * Analyzes codebase for circular dependencies and provides fixes
 * Sprint 17-20 - Architecture Fix
 */

const path = require('path');
const fs = require('fs');
const { dependencyManager } = require('./dependency-manager');
const { logger } = require('../logging/bumba-logger');

class CircularDependencyDetector {
  constructor() {
    this.detected = new Map();
    this.fixes = [];
    this.analyzed = new Set();
  }
  
  /**
   * Scan entire codebase for circular dependencies
   */
  async scanCodebase(rootPath = process.cwd()) {
    logger.info('Starting circular dependency scan...');
    
    const srcPath = path.join(rootPath, 'src');
    const results = await dependencyManager.analyzeCodebase(srcPath);
    
    // Get all circular dependencies
    const circularDeps = Array.from(dependencyManager.circularDeps);
    
    for (const chain of circularDeps) {
      await this.analyzeChain(chain);
    }
    
    return {
      total: circularDeps.length,
      detected: this.detected.size,
      fixes: this.fixes.length,
      chains: circularDeps,
      recommendations: this.generateRecommendations()
    };
  }
  
  /**
   * Analyze a circular dependency chain
   */
  async analyzeChain(chain) {
    const modules = chain.split(' -> ');
    
    for (let i = 0; i < modules.length - 1; i++) {
      const moduleA = modules[i];
      const moduleB = modules[i + 1];
      
      if (!this.detected.has(`${moduleA}->${moduleB}`)) {
        const analysis = await this.analyzeDependency(moduleA, moduleB);
        this.detected.set(`${moduleA}->${moduleB}`, analysis);
        
        if (analysis.canAutoFix) {
          this.fixes.push(analysis.fix);
        }
      }
    }
  }
  
  /**
   * Analyze specific dependency relationship
   */
  async analyzeDependency(moduleA, moduleB) {
    const contentA = fs.readFileSync(moduleA, 'utf8');
    const contentB = fs.readFileSync(moduleB, 'utf8');
    
    // Find how B depends on A
    const bDepsOnA = this.findDependency(contentB, moduleA);
    // Find how A depends on B
    const aDepsOnB = this.findDependency(contentA, moduleB);
    
    const analysis = {
      moduleA,
      moduleB,
      aDepsOnB,
      bDepsOnA,
      severity: this.calculateSeverity(aDepsOnB, bDepsOnA),
      canAutoFix: false,
      fix: null
    };
    
    // Determine fix strategy
    if (this.canUseLazyLoading(aDepsOnB, bDepsOnA)) {
      analysis.canAutoFix = true;
      analysis.fix = this.createLazyLoadingFix(moduleA, moduleB, aDepsOnB);
    } else if (this.canExtractInterface(aDepsOnB, bDepsOnA)) {
      analysis.fix = this.createInterfaceExtractionFix(moduleA, moduleB);
    } else if (this.canInvertDependency(aDepsOnB, bDepsOnA)) {
      analysis.fix = this.createDependencyInversionFix(moduleA, moduleB);
    }
    
    return analysis;
  }
  
  /**
   * Find dependency details
   */
  findDependency(content, targetModule) {
    const relativePath = path.relative(path.dirname(targetModule), targetModule);
    
    // Check for require
    const requirePattern = new RegExp(`require\\(['"]([^'"]*${path.basename(targetModule, '.js')}[^'"]*)['"]\\)`, 'g');
    const requireMatches = content.match(requirePattern) || [];
    
    // Check for import
    const importPattern = new RegExp(`import\\s+.*\\s+from\\s+['"]([^'"]*${path.basename(targetModule, '.js')}[^'"]*)['"]`, 'g');
    const importMatches = content.match(importPattern) || [];
    
    // Check what's being imported
    const usagePattern = new RegExp(`(\\w+)\\s*=\\s*require\\(['"][^'"]*${path.basename(targetModule, '.js')}[^'"]*['"]\\)`, 'g');
    const usages = [];
    let match;
    while ((match = usagePattern.exec(content)) !== null) {
      usages.push(match[1]);
    }
    
    return {
      exists: requireMatches.length > 0 || importMatches.length > 0,
      type: importMatches.length > 0 ? 'import' : 'require',
      count: requireMatches.length + importMatches.length,
      usages,
      atTopLevel: this.isDependencyAtTopLevel(content, targetModule)
    };
  }
  
  /**
   * Check if dependency is at top level
   */
  isDependencyAtTopLevel(content, targetModule) {
    const lines = content.split('\n');
    const targetName = path.basename(targetModule, '.js');
    
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      if (lines[i].includes(targetName)) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Calculate severity of circular dependency
   */
  calculateSeverity(aDepsOnB, bDepsOnA) {
    if (aDepsOnB.atTopLevel && bDepsOnA.atTopLevel) {
      return 'critical'; // Both have top-level dependencies
    }
    if (aDepsOnB.count > 3 || bDepsOnA.count > 3) {
      return 'high'; // Many cross-references
    }
    if (!aDepsOnB.atTopLevel || !bDepsOnA.atTopLevel) {
      return 'low'; // Can be lazy loaded
    }
    return 'medium';
  }
  
  /**
   * Check if lazy loading can fix the issue
   */
  canUseLazyLoading(aDepsOnB, bDepsOnA) {
    // If one dependency is not at top level, we can lazy load it
    return !aDepsOnB.atTopLevel || !bDepsOnA.atTopLevel;
  }
  
  /**
   * Create lazy loading fix
   */
  createLazyLoadingFix(moduleA, moduleB, dependency) {
    const moduleName = path.basename(moduleB, '.js');
    
    return {
      type: 'lazy-loading',
      module: moduleA,
      target: moduleB,
      code: `
// Lazy load to prevent circular dependency
let _${moduleName} = null;
const get${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} = () => {
  if (!_${moduleName}) {
    _${moduleName} = require('${moduleB}');
  }
  return _${moduleName};
};`,
      instructions: `Replace direct require/import of ${moduleB} with lazy loading function`
    };
  }
  
  /**
   * Check if interface extraction can help
   */
  canExtractInterface(aDepsOnB, bDepsOnA) {
    // If both only use specific functions/classes, we can extract interface
    return aDepsOnB.usages.length > 0 && bDepsOnA.usages.length > 0;
  }
  
  /**
   * Create interface extraction fix
   */
  createInterfaceExtractionFix(moduleA, moduleB) {
    const interfacePath = path.join(
      path.dirname(moduleA),
      `${path.basename(moduleA, '.js')}-interface.js`
    );
    
    return {
      type: 'interface-extraction',
      module: moduleA,
      target: moduleB,
      newFile: interfacePath,
      instructions: `Extract shared interfaces/types to ${interfacePath} and have both modules depend on it`
    };
  }
  
  /**
   * Check if dependency inversion is possible
   */
  canInvertDependency(aDepsOnB, bDepsOnA) {
    // If one has significantly fewer dependencies, invert
    return Math.abs(aDepsOnB.count - bDepsOnA.count) > 2;
  }
  
  /**
   * Create dependency inversion fix
   */
  createDependencyInversionFix(moduleA, moduleB) {
    return {
      type: 'dependency-inversion',
      module: moduleA,
      target: moduleB,
      instructions: 'Use dependency injection or event system to invert the dependency'
    };
  }
  
  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Count severity levels
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    for (const analysis of this.detected.values()) {
      severityCounts[analysis.severity]++;
    }
    
    if (severityCounts.critical > 0) {
      recommendations.push({
        priority: 'critical',
        message: `Found ${severityCounts.critical} critical circular dependencies that need immediate attention`,
        action: 'Review and refactor module architecture'
      });
    }
    
    if (severityCounts.high > 2) {
      recommendations.push({
        priority: 'high',
        message: 'Multiple high-severity circular dependencies detected',
        action: 'Consider extracting shared interfaces or using event system'
      });
    }
    
    if (this.fixes.length > 0) {
      recommendations.push({
        priority: 'medium',
        message: `${this.fixes.length} dependencies can be automatically fixed with lazy loading`,
        action: 'Run auto-fix command to apply lazy loading patches'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Apply automatic fixes
   */
  async applyFixes(dryRun = true) {
    const results = [];
    
    for (const fix of this.fixes) {
      if (fix.type === 'lazy-loading') {
        if (!dryRun) {
          await this.applyLazyLoadingFix(fix);
        }
        results.push({
          module: fix.module,
          type: fix.type,
          applied: !dryRun
        });
      }
    }
    
    return results;
  }
  
  /**
   * Apply lazy loading fix to file
   */
  async applyLazyLoadingFix(fix) {
    const content = fs.readFileSync(fix.module, 'utf8');
    const targetName = path.basename(fix.target, '.js');
    
    // Replace require statement
    const requirePattern = new RegExp(
      `(const|let|var)\\s+(\\w+)\\s*=\\s*require\\(['"][^'"]*${targetName}[^'"]*['"]\\)`,
      'g'
    );
    
    let newContent = content.replace(requirePattern, fix.code);
    
    // Update usages
    const usagePattern = new RegExp(`\\b${targetName}\\b`, 'g');
    newContent = newContent.replace(usagePattern, 
      `get${targetName.charAt(0).toUpperCase() + targetName.slice(1)}()`
    );
    
    fs.writeFileSync(fix.module, newContent);
    logger.info(`Applied lazy loading fix to ${fix.module}`);
  }
  
  /**
   * Generate detailed report
   */
  generateReport() {
    const report = {
      summary: {
        totalCircularDependencies: this.detected.size,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        autoFixable: this.fixes.length
      },
      details: [],
      recommendations: this.generateRecommendations()
    };
    
    for (const [key, analysis] of this.detected) {
      report.summary[`${analysis.severity}Count`]++;
      
      report.details.push({
        chain: key,
        severity: analysis.severity,
        moduleA: path.relative(process.cwd(), analysis.moduleA),
        moduleB: path.relative(process.cwd(), analysis.moduleB),
        canAutoFix: analysis.canAutoFix,
        fix: analysis.fix ? {
          type: analysis.fix.type,
          instructions: analysis.fix.instructions
        } : null
      });
    }
    
    return report;
  }
}

// CLI Interface
if (require.main === module) {
  const detector = new CircularDependencyDetector();
  
  const command = process.argv[2];
  
  async function run() {
    switch (command) {
      case 'scan':
        const results = await detector.scanCodebase();
        console.log('\n=== Circular Dependency Scan Results ===\n');
        console.log(`Total circular dependencies found: ${results.total}`);
        console.log(`Auto-fixable: ${results.fixes}`);
        console.log('\nRecommendations:');
        results.recommendations.forEach(rec => {
          console.log(`  [${rec.priority.toUpperCase()}] ${rec.message}`);
          console.log(`    Action: ${rec.action}`);
        });
        break;
        
      case 'fix':
        const dryRun = process.argv[3] !== '--apply';
        await detector.scanCodebase();
        const fixed = await detector.applyFixes(dryRun);
        console.log(`\n${dryRun ? '[DRY RUN] Would fix' : 'Fixed'} ${fixed.length} circular dependencies`);
        fixed.forEach(f => {
          console.log(`  - ${f.module} (${f.type})`);
        });
        break;
        
      case 'report':
        await detector.scanCodebase();
        const report = detector.generateReport();
        fs.writeFileSync('circular-dependencies-report.json', JSON.stringify(report, null, 2));
        console.log('Report saved to circular-dependencies-report.json');
        break;
        
      default:
        console.log('Usage: node circular-dependency-detector.js [scan|fix|report]');
        console.log('  scan   - Scan for circular dependencies');
        console.log('  fix    - Apply automatic fixes (add --apply to actually modify files)');
        console.log('  report - Generate detailed JSON report');
    }
  }
  
  run().catch(console.error);
}

module.exports = {
  CircularDependencyDetector,
  detector: new CircularDependencyDetector()
};