/**
 * BUMBA Test Coverage Analyzer
 * Analyzes test coverage and identifies gaps
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class TestCoverageAnalyzer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      rootDir: config.rootDir || process.cwd(),
      srcDir: config.srcDir || 'src',
      testDir: config.testDir || 'tests',
      testPatterns: config.testPatterns || ['*.test.js', '*.spec.js'],
      excludePatterns: config.excludePatterns || ['node_modules', 'dist', 'build'],
      ...config
    };
    
    this.coverage = {
      files: new Map(),
      directories: new Map(),
      summary: {
        totalFiles: 0,
        testedFiles: 0,
        untested: [],
        coverage: 0
      }
    };
  }
  
  /**
   * Analyze test coverage for the entire project
   */
  async analyze() {
    logger.info('Starting test coverage analysis');
    
    // Find all source files
    const sourceFiles = await this.findSourceFiles();
    
    // Find all test files
    const testFiles = await this.findTestFiles();
    
    // Map tests to source files
    const mapping = await this.mapTestsToSource(sourceFiles, testFiles);
    
    // Calculate coverage metrics
    const metrics = this.calculateMetrics(sourceFiles, mapping);
    
    // Identify gaps
    const gaps = this.identifyGaps(sourceFiles, mapping);
    
    // Generate report
    const report = this.generateReport(metrics, gaps);
    
    this.emit('analysis-complete', report);
    
    return report;
  }
  
  /**
   * Find all source files
   */
  async findSourceFiles() {
    const files = [];
    const srcPath = path.join(this.config.rootDir, this.config.srcDir);
    
    const walk = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!this.isExcluded(item)) {
            walk(fullPath);
          }
        } else if (item.endsWith('.js') && !this.isTestFile(item)) {
          files.push({
            path: fullPath,
            name: item,
            relativePath: path.relative(this.config.rootDir, fullPath),
            directory: path.dirname(path.relative(this.config.rootDir, fullPath))
          });
        }
      }
    };
    
    if (fs.existsSync(srcPath)) {
      walk(srcPath);
    }
    
    return files;
  }
  
  /**
   * Find all test files
   */
  async findTestFiles() {
    const files = [];
    
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!this.isExcluded(item)) {
            walk(fullPath);
          }
        } else if (this.isTestFile(item)) {
          files.push({
            path: fullPath,
            name: item,
            relativePath: path.relative(this.config.rootDir, fullPath),
            directory: path.dirname(path.relative(this.config.rootDir, fullPath))
          });
        }
      }
    };
    
    // Search in multiple locations
    walk(path.join(this.config.rootDir, this.config.testDir));
    walk(path.join(this.config.rootDir, this.config.srcDir));
    walk(this.config.rootDir);
    
    return files;
  }
  
  /**
   * Map test files to source files
   */
  async mapTestsToSource(sourceFiles, testFiles) {
    const mapping = new Map();
    
    for (const source of sourceFiles) {
      const baseName = path.basename(source.name, '.js');
      const possibleTests = [
        `${baseName}.test.js`,
        `${baseName}.spec.js`,
        `test-${baseName}.js`,
        `${baseName}-test.js`,
        `${baseName}-spec.js`
      ];
      
      const tests = testFiles.filter(test => {
        // Check if test name matches
        if (possibleTests.includes(test.name)) {
          return true;
        }
        
        // Check if test is in similar directory structure
        const testDir = test.directory.replace(/^tests?\//, '');
        const sourceDir = source.directory.replace(/^src\//, '');
        
        return testDir === sourceDir && test.name.includes(baseName);
      });
      
      mapping.set(source.relativePath, tests);
    }
    
    return mapping;
  }
  
  /**
   * Calculate coverage metrics
   */
  calculateMetrics(sourceFiles, mapping) {
    const metrics = {
      total: sourceFiles.length,
      tested: 0,
      untested: 0,
      partial: 0,
      byDirectory: new Map(),
      byType: new Map()
    };
    
    for (const source of sourceFiles) {
      const tests = mapping.get(source.relativePath) || [];
      
      if (tests.length > 0) {
        metrics.tested++;
      } else {
        metrics.untested++;
      }
      
      // By directory
      const dir = source.directory;
      if (!metrics.byDirectory.has(dir)) {
        metrics.byDirectory.set(dir, {
          total: 0,
          tested: 0,
          coverage: 0
        });
      }
      
      const dirMetrics = metrics.byDirectory.get(dir);
      dirMetrics.total++;
      if (tests.length > 0) dirMetrics.tested++;
      dirMetrics.coverage = (dirMetrics.tested / dirMetrics.total) * 100;
      
      // By type
      const type = this.getFileType(source.name);
      if (!metrics.byType.has(type)) {
        metrics.byType.set(type, {
          total: 0,
          tested: 0,
          coverage: 0
        });
      }
      
      const typeMetrics = metrics.byType.get(type);
      typeMetrics.total++;
      if (tests.length > 0) typeMetrics.tested++;
      typeMetrics.coverage = (typeMetrics.tested / typeMetrics.total) * 100;
    }
    
    metrics.coverage = metrics.total > 0 ? (metrics.tested / metrics.total) * 100 : 0;
    
    return metrics;
  }
  
  /**
   * Identify coverage gaps
   */
  identifyGaps(sourceFiles, mapping) {
    const gaps = {
      untested: [],
      critical: [],
      lowPriority: [],
      byDirectory: new Map()
    };
    
    for (const source of sourceFiles) {
      const tests = mapping.get(source.relativePath) || [];
      
      if (tests.length === 0) {
        const priority = this.calculatePriority(source);
        
        const gap = {
          file: source.relativePath,
          name: source.name,
          directory: source.directory,
          priority,
          reason: this.getGapReason(source)
        };
        
        gaps.untested.push(gap);
        
        if (priority === 'critical') {
          gaps.critical.push(gap);
        } else if (priority === 'low') {
          gaps.lowPriority.push(gap);
        }
        
        // Group by directory
        if (!gaps.byDirectory.has(source.directory)) {
          gaps.byDirectory.set(source.directory, []);
        }
        gaps.byDirectory.get(source.directory).push(gap);
      }
    }
    
    return gaps;
  }
  
  /**
   * Calculate priority for testing a file
   */
  calculatePriority(source) {
    const criticalPatterns = [
      'auth', 'security', 'payment', 'database', 'api',
      'core', 'critical', 'manager', 'service', 'controller'
    ];
    
    const lowPriorityPatterns = [
      'util', 'helper', 'mock', 'demo', 'example', 'test'
    ];
    
    const fileName = source.name.toLowerCase();
    const filePath = source.relativePath.toLowerCase();
    
    // Check critical patterns
    for (const pattern of criticalPatterns) {
      if (fileName.includes(pattern) || filePath.includes(pattern)) {
        return 'critical';
      }
    }
    
    // Check low priority patterns
    for (const pattern of lowPriorityPatterns) {
      if (fileName.includes(pattern) || filePath.includes(pattern)) {
        return 'low';
      }
    }
    
    // Check if in core directories
    if (filePath.includes('core/')) {
      return 'high';
    }
    
    return 'medium';
  }
  
  /**
   * Get reason for gap
   */
  getGapReason(source) {
    const fileName = source.name.toLowerCase();
    
    if (fileName.includes('service')) {
      return 'Service layer needs unit tests';
    }
    if (fileName.includes('controller')) {
      return 'Controller needs integration tests';
    }
    if (fileName.includes('model')) {
      return 'Model needs validation tests';
    }
    if (fileName.includes('api')) {
      return 'API endpoint needs tests';
    }
    if (fileName.includes('manager')) {
      return 'Manager needs behavioral tests';
    }
    
    return 'Missing test coverage';
  }
  
  /**
   * Get file type
   */
  getFileType(fileName) {
    if (fileName.includes('service')) return 'service';
    if (fileName.includes('controller')) return 'controller';
    if (fileName.includes('model')) return 'model';
    if (fileName.includes('manager')) return 'manager';
    if (fileName.includes('engine')) return 'engine';
    if (fileName.includes('util')) return 'utility';
    if (fileName.includes('helper')) return 'helper';
    if (fileName.includes('config')) return 'config';
    return 'other';
  }
  
  /**
   * Generate coverage report
   */
  generateReport(metrics, gaps) {
    const report = {
      timestamp: Date.now(),
      summary: {
        totalFiles: metrics.total,
        testedFiles: metrics.tested,
        untestedFiles: metrics.untested,
        coverage: metrics.coverage.toFixed(2) + '%',
        grade: this.calculateGrade(metrics.coverage)
      },
      metrics,
      gaps,
      recommendations: this.generateRecommendations(metrics, gaps),
      priorities: this.generatePriorities(gaps)
    };
    
    return report;
  }
  
  /**
   * Calculate grade based on coverage
   */
  calculateGrade(coverage) {
    if (coverage >= 95) return 'A+';
    if (coverage >= 90) return 'A';
    if (coverage >= 85) return 'B+';
    if (coverage >= 80) return 'B';
    if (coverage >= 75) return 'B-';
    if (coverage >= 70) return 'C+';
    if (coverage >= 65) return 'C';
    if (coverage >= 60) return 'C-';
    if (coverage >= 55) return 'D+';
    if (coverage >= 50) return 'D';
    return 'F';
  }
  
  /**
   * Generate recommendations
   */
  generateRecommendations(metrics, gaps) {
    const recommendations = [];
    
    if (metrics.coverage < 80) {
      recommendations.push({
        priority: 'high',
        action: 'Increase overall test coverage to at least 80%',
        impact: 'Improved code quality and reliability'
      });
    }
    
    if (gaps.critical.length > 0) {
      recommendations.push({
        priority: 'critical',
        action: `Add tests for ${gaps.critical.length} critical files`,
        impact: 'Reduced risk in core functionality',
        files: gaps.critical.slice(0, 5).map(g => g.file)
      });
    }
    
    // Check directory coverage
    for (const [dir, dirMetrics] of metrics.byDirectory) {
      if (dirMetrics.coverage < 50 && dirMetrics.total > 5) {
        recommendations.push({
          priority: 'medium',
          action: `Improve test coverage in ${dir} (currently ${dirMetrics.coverage.toFixed(1)}%)`,
          impact: 'Better coverage for module'
        });
      }
    }
    
    // Check type coverage
    for (const [type, typeMetrics] of metrics.byType) {
      if (typeMetrics.coverage < 60 && typeMetrics.total > 3) {
        recommendations.push({
          priority: 'medium',
          action: `Add tests for ${type} files (${typeMetrics.tested}/${typeMetrics.total} tested)`,
          impact: `Improved ${type} reliability`
        });
      }
    }
    
    return recommendations;
  }
  
  /**
   * Generate testing priorities
   */
  generatePriorities(gaps) {
    return {
      immediate: gaps.critical.slice(0, 10),
      thisWeek: gaps.untested
        .filter(g => g.priority === 'high')
        .slice(0, 20),
      thisMonth: gaps.untested
        .filter(g => g.priority === 'medium')
        .slice(0, 30),
      backlog: gaps.lowPriority
    };
  }
  
  /**
   * Check if file is excluded
   */
  isExcluded(name) {
    return this.config.excludePatterns.some(pattern => name.includes(pattern));
  }
  
  /**
   * Check if file is a test file
   */
  isTestFile(name) {
    return name.includes('.test.') || name.includes('.spec.') || 
           name.includes('test-') || name.includes('-test');
  }
  
  /**
   * Export report to file
   */
  async exportReport(report, outputPath) {
    const content = JSON.stringify(report, null, 2);
    fs.writeFileSync(outputPath, content);
    logger.info(`Coverage report exported to ${outputPath}`);
  }
  
  /**
   * Generate HTML report
   */
  generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Coverage Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { background: #f0f0f0; padding: 20px; border-radius: 5px; }
    .coverage { font-size: 48px; font-weight: bold; color: ${this.getCoverageColor(report.summary.coverage)}; }
    .grade { font-size: 36px; margin-left: 20px; }
    .recommendations { margin-top: 20px; }
    .recommendation { padding: 10px; margin: 5px 0; background: #fff; border-left: 4px solid #007bff; }
    .critical { border-left-color: #dc3545; }
    .high { border-left-color: #ffc107; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>BUMBA Test Coverage Report</h1>
  
  <div class="summary">
    <div class="coverage">${report.summary.coverage}</div>
    <span class="grade">Grade: ${report.summary.grade}</span>
    <p>${report.summary.testedFiles} of ${report.summary.totalFiles} files tested</p>
  </div>
  
  <div class="recommendations">
    <h2>Recommendations</h2>
    ${report.recommendations.map(rec => `
      <div class="recommendation ${rec.priority}">
        <strong>${rec.priority.toUpperCase()}:</strong> ${rec.action}
        <br><small>${rec.impact}</small>
      </div>
    `).join('')}
  </div>
  
  <h2>Coverage by Directory</h2>
  <table>
    <tr><th>Directory</th><th>Files</th><th>Tested</th><th>Coverage</th></tr>
    ${Array.from(report.metrics.byDirectory).map(([dir, metrics]) => `
      <tr>
        <td>${dir}</td>
        <td>${metrics.total}</td>
        <td>${metrics.tested}</td>
        <td>${metrics.coverage.toFixed(1)}%</td>
      </tr>
    `).join('')}
  </table>
  
  <h2>Critical Gaps</h2>
  <ul>
    ${report.gaps.critical.slice(0, 10).map(gap => `
      <li>${gap.file} - ${gap.reason}</li>
    `).join('')}
  </ul>
</body>
</html>
    `;
    
    return html;
  }
  
  getCoverageColor(coverage) {
    const value = parseFloat(coverage);
    if (value >= 80) return '#28a745';
    if (value >= 60) return '#ffc107';
    return '#dc3545';
  }
}

// Export singleton
module.exports = new TestCoverageAnalyzer();