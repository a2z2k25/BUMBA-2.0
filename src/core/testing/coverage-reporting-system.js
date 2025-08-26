/**
 * BUMBA Coverage Reporting System
 * Comprehensive test coverage tracking and reporting
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CoverageReportingSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      coverageDir: config.coverageDir || 'coverage',
      reportFormats: config.reportFormats || ['html', 'json', 'lcov', 'text'],
      thresholds: config.thresholds || {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80
      },
      includePatterns: config.includePatterns || ['src/**/*.js'],
      excludePatterns: config.excludePatterns || [
        'node_modules/**',
        'tests/**',
        '**/*.test.js',
        '**/*.spec.js'
      ],
      watermarks: config.watermarks || {
        statements: [50, 80],
        branches: [50, 80],
        functions: [50, 80],
        lines: [50, 80]
      },
      ...config
    };
    
    this.coverage = {
      global: {},
      files: new Map(),
      summary: {},
      history: []
    };
    
    this.metrics = {
      statements: { total: 0, covered: 0, skipped: 0, percentage: 0 },
      branches: { total: 0, covered: 0, skipped: 0, percentage: 0 },
      functions: { total: 0, covered: 0, skipped: 0, percentage: 0 },
      lines: { total: 0, covered: 0, skipped: 0, percentage: 0 }
    };
  }
  
  /**
   * Collect coverage data
   */
  async collectCoverage(testCommand) {
    logger.info('Collecting coverage data');
    
    try {
      // Run tests with coverage
      const coverageData = await this.runWithCoverage(testCommand);
      
      // Process coverage data
      const processed = await this.processCoverageData(coverageData);
      
      // Calculate metrics
      this.calculateMetrics(processed);
      
      // Check thresholds
      const thresholdResults = this.checkThresholds();
      
      // Store in history
      this.addToHistory(processed);
      
      // Generate reports
      const reports = await this.generateReports();
      
      this.emit('coverage-collected', {
        metrics: this.metrics,
        thresholds: thresholdResults,
        reports
      });
      
      return {
        metrics: this.metrics,
        thresholds: thresholdResults,
        reports,
        passed: thresholdResults.passed
      };
      
    } catch (error) {
      logger.error('Failed to collect coverage:', error);
      throw error;
    }
  }
  
  /**
   * Run tests with coverage instrumentation
   */
  async runWithCoverage(testCommand) {
    // Mock implementation - would use nyc or c8 in production
    const mockCoverage = {
      total: {
        statements: { total: 1000, covered: 850, skipped: 50 },
        branches: { total: 500, covered: 420, skipped: 30 },
        functions: { total: 200, covered: 180, skipped: 10 },
        lines: { total: 1200, covered: 1020, skipped: 60 }
      },
      files: this.generateMockFileCoverage()
    };
    
    return mockCoverage;
  }
  
  /**
   * Generate mock file coverage data
   */
  generateMockFileCoverage() {
    const files = {};
    const sampleFiles = [
      'src/core/bumba-framework-2.js',
      'src/core/command-handler.js',
      'src/core/monitoring/health-monitor.js',
      'src/core/departments/backend-engineer-manager.js',
      'src/core/learning/optimization-engine.js',
      'src/core/testing/unit-test-framework.js'
    ];
    
    for (const file of sampleFiles) {
      files[file] = {
        path: file,
        statements: {
          total: Math.floor(Math.random() * 200) + 50,
          covered: 0,
          skipped: 0,
          details: []
        },
        branches: {
          total: Math.floor(Math.random() * 100) + 20,
          covered: 0,
          skipped: 0,
          details: []
        },
        functions: {
          total: Math.floor(Math.random() * 50) + 10,
          covered: 0,
          skipped: 0,
          details: []
        },
        lines: {
          total: Math.floor(Math.random() * 300) + 100,
          covered: 0,
          skipped: 0,
          details: this.generateLineDetails()
        }
      };
      
      // Set covered amounts
      const coverage = 0.6 + Math.random() * 0.35; // 60-95% coverage
      files[file].statements.covered = Math.floor(files[file].statements.total * coverage);
      files[file].branches.covered = Math.floor(files[file].branches.total * coverage);
      files[file].functions.covered = Math.floor(files[file].functions.total * coverage);
      files[file].lines.covered = Math.floor(files[file].lines.total * coverage);
    }
    
    return files;
  }
  
  /**
   * Generate line coverage details
   */
  generateLineDetails() {
    const details = {};
    const totalLines = Math.floor(Math.random() * 300) + 100;
    
    for (let i = 1; i <= totalLines; i++) {
      const rand = Math.random();
      if (rand < 0.8) {
        // Covered line
        details[i] = Math.floor(Math.random() * 10) + 1; // Hit count
      } else if (rand < 0.95) {
        // Uncovered line
        details[i] = 0;
      }
      // else: Not executable line (undefined)
    }
    
    return details;
  }
  
  /**
   * Process raw coverage data
   */
  async processCoverageData(rawData) {
    const processed = {
      summary: {},
      files: new Map(),
      timestamp: Date.now()
    };
    
    // Process global summary
    processed.summary = {
      statements: this.calculatePercentage(rawData.total.statements),
      branches: this.calculatePercentage(rawData.total.branches),
      functions: this.calculatePercentage(rawData.total.functions),
      lines: this.calculatePercentage(rawData.total.lines)
    };
    
    // Process file-level coverage
    for (const [filePath, fileData] of Object.entries(rawData.files)) {
      const fileCoverage = {
        path: filePath,
        statements: this.calculatePercentage(fileData.statements),
        branches: this.calculatePercentage(fileData.branches),
        functions: this.calculatePercentage(fileData.functions),
        lines: this.calculatePercentage(fileData.lines),
        uncoveredLines: this.findUncoveredLines(fileData.lines.details)
      };
      
      processed.files.set(filePath, fileCoverage);
    }
    
    this.coverage.global = processed.summary;
    this.coverage.files = processed.files;
    
    return processed;
  }
  
  /**
   * Calculate percentage
   */
  calculatePercentage(metric) {
    const percentage = metric.total > 0
      ? (metric.covered / metric.total * 100)
      : 0;
    
    return {
      ...metric,
      percentage: parseFloat(percentage.toFixed(2))
    };
  }
  
  /**
   * Find uncovered lines
   */
  findUncoveredLines(lineDetails) {
    const uncovered = [];
    
    for (const [line, hits] of Object.entries(lineDetails)) {
      if (hits === 0) {
        uncovered.push(parseInt(line));
      }
    }
    
    // Group consecutive lines into ranges
    const ranges = [];
    let start = null;
    let end = null;
    
    uncovered.sort((a, b) => a - b);
    
    for (const line of uncovered) {
      if (start === null) {
        start = line;
        end = line;
      } else if (line === end + 1) {
        end = line;
      } else {
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        start = line;
        end = line;
      }
    }
    
    if (start !== null) {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
    }
    
    return ranges;
  }
  
  /**
   * Calculate overall metrics
   */
  calculateMetrics(processed) {
    // Reset metrics
    this.metrics = {
      statements: { total: 0, covered: 0, skipped: 0, percentage: 0 },
      branches: { total: 0, covered: 0, skipped: 0, percentage: 0 },
      functions: { total: 0, covered: 0, skipped: 0, percentage: 0 },
      lines: { total: 0, covered: 0, skipped: 0, percentage: 0 }
    };
    
    // Aggregate from all files
    for (const [filePath, fileCoverage] of processed.files) {
      this.metrics.statements.total += fileCoverage.statements.total;
      this.metrics.statements.covered += fileCoverage.statements.covered;
      this.metrics.statements.skipped += fileCoverage.statements.skipped;
      
      this.metrics.branches.total += fileCoverage.branches.total;
      this.metrics.branches.covered += fileCoverage.branches.covered;
      this.metrics.branches.skipped += fileCoverage.branches.skipped;
      
      this.metrics.functions.total += fileCoverage.functions.total;
      this.metrics.functions.covered += fileCoverage.functions.covered;
      this.metrics.functions.skipped += fileCoverage.functions.skipped;
      
      this.metrics.lines.total += fileCoverage.lines.total;
      this.metrics.lines.covered += fileCoverage.lines.covered;
      this.metrics.lines.skipped += fileCoverage.lines.skipped;
    }
    
    // Calculate percentages
    this.metrics.statements.percentage = this.calculatePercentageValue(
      this.metrics.statements.covered,
      this.metrics.statements.total
    );
    
    this.metrics.branches.percentage = this.calculatePercentageValue(
      this.metrics.branches.covered,
      this.metrics.branches.total
    );
    
    this.metrics.functions.percentage = this.calculatePercentageValue(
      this.metrics.functions.covered,
      this.metrics.functions.total
    );
    
    this.metrics.lines.percentage = this.calculatePercentageValue(
      this.metrics.lines.covered,
      this.metrics.lines.total
    );
  }
  
  /**
   * Calculate percentage value
   */
  calculatePercentageValue(covered, total) {
    return total > 0 ? parseFloat((covered / total * 100).toFixed(2)) : 0;
  }
  
  /**
   * Check coverage thresholds
   */
  checkThresholds() {
    const results = {
      passed: true,
      failures: [],
      warnings: []
    };
    
    // Check each metric against threshold
    for (const [metric, threshold] of Object.entries(this.config.thresholds)) {
      const actual = this.metrics[metric].percentage;
      
      if (actual < threshold) {
        results.passed = false;
        results.failures.push({
          metric,
          actual,
          threshold,
          diff: threshold - actual
        });
      } else if (actual < threshold + 5) {
        // Within 5% of threshold - warning
        results.warnings.push({
          metric,
          actual,
          threshold,
          margin: actual - threshold
        });
      }
    }
    
    return results;
  }
  
  /**
   * Add coverage data to history
   */
  addToHistory(coverageData) {
    const historyEntry = {
      timestamp: coverageData.timestamp,
      metrics: { ...this.metrics },
      summary: coverageData.summary
    };
    
    this.coverage.history.push(historyEntry);
    
    // Keep only last 100 entries
    if (this.coverage.history.length > 100) {
      this.coverage.history.shift();
    }
  }
  
  /**
   * Generate coverage reports
   */
  async generateReports() {
    const reports = {};
    
    for (const format of this.config.reportFormats) {
      switch (format) {
        case 'html':
          reports.html = await this.generateHTMLReport();
          break;
        
        case 'json':
          reports.json = await this.generateJSONReport();
          break;
        
        case 'lcov':
          reports.lcov = await this.generateLCOVReport();
          break;
        
        case 'text':
          reports.text = await this.generateTextReport();
          break;
        
        case 'badge':
          reports.badge = await this.generateBadge();
          break;
      }
    }
    
    return reports;
  }
  
  /**
   * Generate HTML report
   */
  async generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>BUMBA Coverage Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }
    .summary { display: flex; justify-content: space-around; margin: 20px 0; }
    .metric { text-align: center; padding: 20px; background: #ecf0f1; border-radius: 5px; }
    .percentage { font-size: 36px; font-weight: bold; }
    .good { color: #27ae60; }
    .medium { color: #f39c12; }
    .bad { color: #e74c3c; }
    .files { margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #34495e; color: white; }
    .bar { height: 20px; background: #ecf0f1; border-radius: 3px; overflow: hidden; }
    .bar-fill { height: 100%; transition: width 0.3s; }
    .trend { margin-top: 30px; }
    .uncovered { background: #ffe6e6; }
  </style>
</head>
<body>
  <div class="header">
    <h1>BUMBA Test Coverage Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>
  
  <div class="summary">
    ${this.renderMetricCard('Statements', this.metrics.statements)}
    ${this.renderMetricCard('Branches', this.metrics.branches)}
    ${this.renderMetricCard('Functions', this.metrics.functions)}
    ${this.renderMetricCard('Lines', this.metrics.lines)}
  </div>
  
  <div class="files">
    <h2>File Coverage</h2>
    <table>
      <thead>
        <tr>
          <th>File</th>
          <th>Statements</th>
          <th>Branches</th>
          <th>Functions</th>
          <th>Lines</th>
          <th>Uncovered Lines</th>
        </tr>
      </thead>
      <tbody>
        ${Array.from(this.coverage.files.values()).map(file => `
          <tr class="${this.getFileClass(file)}">
            <td>${file.path}</td>
            <td>${this.renderBar(file.statements.percentage)}</td>
            <td>${this.renderBar(file.branches.percentage)}</td>
            <td>${this.renderBar(file.functions.percentage)}</td>
            <td>${this.renderBar(file.lines.percentage)}</td>
            <td>${file.uncoveredLines.join(', ') || 'None'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  
  ${this.coverage.history.length > 1 ? `
    <div class="trend">
      <h2>Coverage Trend</h2>
      ${this.renderTrend()}
    </div>
  ` : ''}
</body>
</html>
    `;
    
    const reportPath = path.join(this.config.coverageDir, 'index.html');
    fs.mkdirSync(this.config.coverageDir, { recursive: true });
    fs.writeFileSync(reportPath, html);
    
    return reportPath;
  }
  
  /**
   * Render metric card
   */
  renderMetricCard(name, metric) {
    const colorClass = this.getColorClass(metric.percentage);
    
    return `
      <div class="metric">
        <h3>${name}</h3>
        <div class="percentage ${colorClass}">${metric.percentage}%</div>
        <p>${metric.covered} / ${metric.total}</p>
      </div>
    `;
  }
  
  /**
   * Render coverage bar
   */
  renderBar(percentage) {
    const colorClass = this.getColorClass(percentage);
    
    return `
      <div class="bar">
        <div class="bar-fill ${colorClass}" style="width: ${percentage}%; background: ${this.getColor(percentage)};">
          <span style="padding-left: 5px; color: white;">${percentage}%</span>
        </div>
      </div>
    `;
  }
  
  /**
   * Render coverage trend
   */
  renderTrend() {
    const recent = this.coverage.history.slice(-10);
    const maxPercentage = 100;
    
    return `
      <svg width="100%" height="200" viewBox="0 0 800 200">
        ${['statements', 'branches', 'functions', 'lines'].map((metric, idx) => {
          const color = ['#3498db', '#9b59b6', '#e67e22', '#1abc9c'][idx];
          const points = recent.map((entry, i) => {
            const x = (i / (recent.length - 1)) * 780 + 10;
            const y = 190 - (entry.metrics[metric].percentage / maxPercentage) * 180;
            return `${x},${y}`;
          }).join(' ');
          
          return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="2"/>`;
        }).join('')}
      </svg>
      <div style="display: flex; justify-content: center; gap: 20px;">
        <span><span style="color: #3498db;">●</span> Statements</span>
        <span><span style="color: #9b59b6;">●</span> Branches</span>
        <span><span style="color: #e67e22;">●</span> Functions</span>
        <span><span style="color: #1abc9c;">●</span> Lines</span>
      </div>
    `;
  }
  
  /**
   * Generate JSON report
   */
  async generateJSONReport() {
    const report = {
      timestamp: Date.now(),
      metrics: this.metrics,
      files: Object.fromEntries(this.coverage.files),
      summary: this.coverage.global,
      thresholds: this.config.thresholds,
      history: this.coverage.history.slice(-10)
    };
    
    const reportPath = path.join(this.config.coverageDir, 'coverage.json');
    fs.mkdirSync(this.config.coverageDir, { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return reportPath;
  }
  
  /**
   * Generate LCOV report
   */
  async generateLCOVReport() {
    let lcov = '';
    
    for (const [filePath, fileCoverage] of this.coverage.files) {
      lcov += `SF:${filePath}\n`;
      
      // Function coverage
      lcov += `FNF:${fileCoverage.functions.total}\n`;
      lcov += `FNH:${fileCoverage.functions.covered}\n`;
      
      // Line coverage
      if (fileCoverage.lines.details) {
        for (const [line, hits] of Object.entries(fileCoverage.lines.details)) {
          lcov += `DA:${line},${hits}\n`;
        }
      }
      lcov += `LF:${fileCoverage.lines.total}\n`;
      lcov += `LH:${fileCoverage.lines.covered}\n`;
      
      // Branch coverage
      lcov += `BRF:${fileCoverage.branches.total}\n`;
      lcov += `BRH:${fileCoverage.branches.covered}\n`;
      
      lcov += 'end_of_record\n';
    }
    
    const reportPath = path.join(this.config.coverageDir, 'lcov.info');
    fs.mkdirSync(this.config.coverageDir, { recursive: true });
    fs.writeFileSync(reportPath, lcov);
    
    return reportPath;
  }
  
  /**
   * Generate text report
   */
  async generateTextReport() {
    const separator = '─'.repeat(80);
    let report = '';
    
    report += separator + '\n';
    report += 'BUMBA Test Coverage Report\n';
    report += separator + '\n\n';
    
    // Summary
    report += 'Summary:\n';
    report += `  Statements: ${this.metrics.statements.percentage}% (${this.metrics.statements.covered}/${this.metrics.statements.total})\n`;
    report += `  Branches:   ${this.metrics.branches.percentage}% (${this.metrics.branches.covered}/${this.metrics.branches.total})\n`;
    report += `  Functions:  ${this.metrics.functions.percentage}% (${this.metrics.functions.covered}/${this.metrics.functions.total})\n`;
    report += `  Lines:      ${this.metrics.lines.percentage}% (${this.metrics.lines.covered}/${this.metrics.lines.total})\n\n`;
    
    // File details
    report += 'File Coverage:\n';
    report += separator + '\n';
    
    const files = Array.from(this.coverage.files.values())
      .sort((a, b) => a.lines.percentage - b.lines.percentage);
    
    for (const file of files) {
      const indicator = this.getIndicator(file.lines.percentage);
      report += `${indicator} ${file.path}\n`;
      report += `    Statements: ${file.statements.percentage}% | `;
      report += `Branches: ${file.branches.percentage}% | `;
      report += `Functions: ${file.functions.percentage}% | `;
      report += `Lines: ${file.lines.percentage}%\n`;
      
      if (file.uncoveredLines.length > 0) {
        report += `    Uncovered lines: ${file.uncoveredLines.join(', ')}\n`;
      }
      report += '\n';
    }
    
    const reportPath = path.join(this.config.coverageDir, 'coverage.txt');
    fs.mkdirSync(this.config.coverageDir, { recursive: true });
    fs.writeFileSync(reportPath, report);
    
    // Also log to console
    console.log(report);
    
    return reportPath;
  }
  
  /**
   * Generate coverage badge
   */
  async generateBadge() {
    const percentage = this.metrics.lines.percentage;
    const color = this.getBadgeColor(percentage);
    
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="114" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="114" height="20" rx="3" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <path fill="#555" d="M0 0h63v20H0z"/>
    <path fill="${color}" d="M63 0h51v20H63z"/>
    <path fill="url(#b)" d="M0 0h114v20H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="31.5" y="15" fill="#010101" fill-opacity=".3">coverage</text>
    <text x="31.5" y="14">coverage</text>
    <text x="87.5" y="15" fill="#010101" fill-opacity=".3">${percentage}%</text>
    <text x="87.5" y="14">${percentage}%</text>
  </g>
</svg>
    `;
    
    const badgePath = path.join(this.config.coverageDir, 'badge.svg');
    fs.mkdirSync(this.config.coverageDir, { recursive: true });
    fs.writeFileSync(badgePath, svg);
    
    return badgePath;
  }
  
  /**
   * Get color class based on percentage
   */
  getColorClass(percentage) {
    if (percentage >= this.config.watermarks.lines[1]) return 'good';
    if (percentage >= this.config.watermarks.lines[0]) return 'medium';
    return 'bad';
  }
  
  /**
   * Get color based on percentage
   */
  getColor(percentage) {
    if (percentage >= this.config.watermarks.lines[1]) return '#27ae60';
    if (percentage >= this.config.watermarks.lines[0]) return '#f39c12';
    return '#e74c3c';
  }
  
  /**
   * Get badge color
   */
  getBadgeColor(percentage) {
    if (percentage >= 80) return '#4c1';
    if (percentage >= 60) return '#dfb317';
    return '#e05d44';
  }
  
  /**
   * Get indicator for text report
   */
  getIndicator(percentage) {
    if (percentage >= 80) return '🏁';
    if (percentage >= 60) return '🟠';
    return '🔴';
  }
  
  /**
   * Get file class for HTML
   */
  getFileClass(file) {
    const minPercentage = Math.min(
      file.statements.percentage,
      file.branches.percentage,
      file.functions.percentage,
      file.lines.percentage
    );
    
    if (minPercentage < 50) return 'uncovered';
    return '';
  }
  
  /**
   * Compare coverage with previous run
   */
  compareToPrevious() {
    if (this.coverage.history.length < 2) {
      return null;
    }
    
    const current = this.coverage.history[this.coverage.history.length - 1];
    const previous = this.coverage.history[this.coverage.history.length - 2];
    
    const comparison = {
      timestamp: Date.now(),
      changes: {}
    };
    
    for (const metric of ['statements', 'branches', 'functions', 'lines']) {
      const currentValue = current.metrics[metric].percentage;
      const previousValue = previous.metrics[metric].percentage;
      const diff = currentValue - previousValue;
      
      comparison.changes[metric] = {
        current: currentValue,
        previous: previousValue,
        diff: diff.toFixed(2),
        trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable'
      };
    }
    
    return comparison;
  }
  
  /**
   * Export coverage data
   */
  async exportCoverage(format, outputPath) {
    const data = {
      timestamp: Date.now(),
      metrics: this.metrics,
      files: Object.fromEntries(this.coverage.files),
      summary: this.coverage.global
    };
    
    switch (format) {
      case 'json':
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        break;
      
      case 'csv':
        const csv = this.convertToCSV(data);
        fs.writeFileSync(outputPath, csv);
        break;
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
    
    logger.info(`Coverage exported to ${outputPath}`);
  }
  
  /**
   * Convert coverage to CSV
   */
  convertToCSV(data) {
    let csv = 'File,Statements,Branches,Functions,Lines\n';
    
    for (const [path, coverage] of Object.entries(data.files)) {
      csv += `"${path}",`;
      csv += `${coverage.statements.percentage},`;
      csv += `${coverage.branches.percentage},`;
      csv += `${coverage.functions.percentage},`;
      csv += `${coverage.lines.percentage}\n`;
    }
    
    return csv;
  }
}

// Export singleton
module.exports = new CoverageReportingSystem();