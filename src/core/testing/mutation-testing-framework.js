/**
 * BUMBA Mutation Testing Framework
 * Tests the quality of tests by introducing controlled mutations
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;

class MutationTestingFramework extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      mutators: config.mutators || [
        'conditionalBoundary',
        'arithmeticOperator', 
        'logicalOperator',
        'booleanLiteral',
        'returnValue',
        'stringLiteral',
        'arrayMethod',
        'objectMethod'
      ],
      timeout: config.timeout || 5000,
      concurrency: config.concurrency || 4,
      bail: config.bail || false,
      excludePatterns: config.excludePatterns || ['node_modules', 'test', 'spec'],
      ...config
    };
    
    this.mutants = [];
    this.results = [];
    this.statistics = {
      total: 0,
      killed: 0,
      survived: 0,
      timeout: 0,
      error: 0,
      skipped: 0
    };
  }
  
  /**
   * Run mutation testing on a file
   */
  async testFile(filePath, testCommand) {
    logger.info(`Starting mutation testing for ${filePath}`);
    
    // Read source file
    const source = fs.readFileSync(filePath, 'utf8');
    
    // Generate mutations
    const mutations = await this.generateMutations(source, filePath);
    
    logger.info(`Generated ${mutations.length} mutations`);
    
    // Test each mutation
    const results = [];
    for (const mutation of mutations) {
      const result = await this.testMutation(mutation, filePath, testCommand);
      results.push(result);
      
      // Update statistics
      this.updateStatistics(result);
      
      // Bail if configured
      if (this.config.bail && result.status === 'survived') {
        logger.warn('Mutation survived! Bailing out...');
        break;
      }
      
      this.emit('mutation-tested', result);
    }
    
    // Generate report
    const report = this.generateReport(results);
    
    this.emit('file-complete', { file: filePath, report });
    
    return report;
  }
  
  /**
   * Generate mutations for source code
   */
  async generateMutations(source, filePath) {
    const mutations = [];
    
    try {
      // Parse source code
      const ast = parse(source, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });
      
      // Apply each mutator
      for (const mutatorName of this.config.mutators) {
        const mutator = this.getMutator(mutatorName);
        if (mutator) {
          const mutatorMutations = mutator(ast, source);
          mutations.push(...mutatorMutations);
        }
      }
      
    } catch (error) {
      logger.error(`Failed to parse ${filePath}:`, error);
    }
    
    return mutations;
  }
  
  /**
   * Get mutator by name
   */
  getMutator(name) {
    const mutators = {
      // Conditional boundary mutations
      conditionalBoundary: (ast, source) => {
        const mutations = [];
        
        traverse(ast, {
          BinaryExpression(path) {
            const operators = {
              '<': ['<=', '>='],
              '<=': ['<', '>'],
              '>': ['>=', '<='],
              '>=': ['>', '<'],
              '==': ['!='],
              '===': ['!=='],
              '!=': ['=='],
              '!==': ['===']
            };
            
            const replacements = operators[path.node.operator];
            if (replacements) {
              for (const replacement of replacements) {
                mutations.push({
                  id: `conditional-${mutations.length}`,
                  type: 'conditionalBoundary',
                  location: path.node.loc,
                  original: path.node.operator,
                  mutated: replacement,
                  description: `Changed ${path.node.operator} to ${replacement}`,
                  apply: (code) => {
                    const mutatedNode = { ...path.node, operator: replacement };
                    return this.applyMutation(code, path.node.loc, generate(mutatedNode).code);
                  }
                });
              }
            }
          }
        });
        
        return mutations;
      },
      
      // Arithmetic operator mutations
      arithmeticOperator: (ast, source) => {
        const mutations = [];
        
        traverse(ast, {
          BinaryExpression(path) {
            const operators = {
              '+': ['-', '*', '/'],
              '-': ['+', '*', '/'],
              '*': ['+', '-', '/'],
              '/': ['+', '-', '*'],
              '%': ['+', '-', '*', '/']
            };
            
            const replacements = operators[path.node.operator];
            if (replacements) {
              for (const replacement of replacements) {
                mutations.push({
                  id: `arithmetic-${mutations.length}`,
                  type: 'arithmeticOperator',
                  location: path.node.loc,
                  original: path.node.operator,
                  mutated: replacement,
                  description: `Changed ${path.node.operator} to ${replacement}`,
                  apply: (code) => {
                    const mutatedNode = { ...path.node, operator: replacement };
                    return this.applyMutation(code, path.node.loc, generate(mutatedNode).code);
                  }
                });
              }
            }
          }
        });
        
        return mutations;
      },
      
      // Logical operator mutations
      logicalOperator: (ast, source) => {
        const mutations = [];
        
        traverse(ast, {
          LogicalExpression(path) {
            const operators = {
              '&&': ['||'],
              '||': ['&&']
            };
            
            const replacements = operators[path.node.operator];
            if (replacements) {
              for (const replacement of replacements) {
                mutations.push({
                  id: `logical-${mutations.length}`,
                  type: 'logicalOperator',
                  location: path.node.loc,
                  original: path.node.operator,
                  mutated: replacement,
                  description: `Changed ${path.node.operator} to ${replacement}`,
                  apply: (code) => {
                    const mutatedNode = { ...path.node, operator: replacement };
                    return this.applyMutation(code, path.node.loc, generate(mutatedNode).code);
                  }
                });
              }
            }
          }
        });
        
        return mutations;
      },
      
      // Boolean literal mutations
      booleanLiteral: (ast, source) => {
        const mutations = [];
        
        traverse(ast, {
          BooleanLiteral(path) {
            const opposite = !path.node.value;
            mutations.push({
              id: `boolean-${mutations.length}`,
              type: 'booleanLiteral',
              location: path.node.loc,
              original: path.node.value,
              mutated: opposite,
              description: `Changed ${path.node.value} to ${opposite}`,
              apply: (code) => {
                return this.applyMutation(code, path.node.loc, String(opposite));
              }
            });
          }
        });
        
        return mutations;
      },
      
      // Return value mutations
      returnValue: (ast, source) => {
        const mutations = [];
        
        traverse(ast, {
          ReturnStatement(path) {
            if (path.node.argument) {
              mutations.push({
                id: `return-${mutations.length}`,
                type: 'returnValue',
                location: path.node.loc,
                original: 'return value',
                mutated: 'return undefined',
                description: 'Removed return value',
                apply: (code) => {
                  return this.applyMutation(code, path.node.loc, 'return undefined');
                }
              });
              
              // For boolean returns
              if (path.node.argument.type === 'BooleanLiteral') {
                const opposite = !path.node.argument.value;
                mutations.push({
                  id: `return-bool-${mutations.length}`,
                  type: 'returnValue',
                  location: path.node.loc,
                  original: `return ${path.node.argument.value}`,
                  mutated: `return ${opposite}`,
                  description: `Changed return ${path.node.argument.value} to ${opposite}`,
                  apply: (code) => {
                    return this.applyMutation(code, path.node.loc, `return ${opposite}`);
                  }
                });
              }
            }
          }
        });
        
        return mutations;
      },
      
      // String literal mutations
      stringLiteral: (ast, source) => {
        const mutations = [];
        
        traverse(ast, {
          StringLiteral(path) {
            if (path.node.value.length > 0) {
              mutations.push({
                id: `string-${mutations.length}`,
                type: 'stringLiteral',
                location: path.node.loc,
                original: path.node.value,
                mutated: '',
                description: `Emptied string "${path.node.value}"`,
                apply: (code) => {
                  return this.applyMutation(code, path.node.loc, '""');
                }
              });
            }
          }
        });
        
        return mutations;
      },
      
      // Array method mutations
      arrayMethod: (ast, source) => {
        const mutations = [];
        
        traverse(ast, {
          CallExpression(path) {
            if (path.node.callee.type === 'MemberExpression' &&
                path.node.callee.property.type === 'Identifier') {
              
              const methodReplacements = {
                'filter': ['map', 'forEach'],
                'map': ['filter', 'forEach'],
                'forEach': ['map', 'filter'],
                'find': ['filter', 'findIndex'],
                'findIndex': ['find', 'indexOf'],
                'some': ['every'],
                'every': ['some'],
                'includes': ['indexOf'],
                'push': ['pop'],
                'pop': ['push'],
                'shift': ['unshift'],
                'unshift': ['shift']
              };
              
              const method = path.node.callee.property.name;
              const replacements = methodReplacements[method];
              
              if (replacements) {
                for (const replacement of replacements) {
                  mutations.push({
                    id: `array-method-${mutations.length}`,
                    type: 'arrayMethod',
                    location: path.node.loc,
                    original: method,
                    mutated: replacement,
                    description: `Changed .${method}() to .${replacement}()`,
                    apply: (code) => {
                      const start = path.node.callee.property.loc.start;
                      const end = path.node.callee.property.loc.end;
                      return this.replaceInCode(code, start, end, replacement);
                    }
                  });
                }
              }
            }
          }
        });
        
        return mutations;
      },
      
      // Object method mutations
      objectMethod: (ast, source) => {
        const mutations = [];
        
        traverse(ast, {
          CallExpression(path) {
            if (path.node.callee.type === 'MemberExpression' &&
                path.node.callee.object.type === 'Identifier' &&
                path.node.callee.object.name === 'Object') {
              
              const methodReplacements = {
                'keys': ['values', 'entries'],
                'values': ['keys', 'entries'],
                'entries': ['keys', 'values'],
                'assign': ['freeze'],
                'freeze': ['seal'],
                'seal': ['freeze']
              };
              
              const method = path.node.callee.property.name;
              const replacements = methodReplacements[method];
              
              if (replacements) {
                for (const replacement of replacements) {
                  mutations.push({
                    id: `object-method-${mutations.length}`,
                    type: 'objectMethod',
                    location: path.node.loc,
                    original: `Object.${method}`,
                    mutated: `Object.${replacement}`,
                    description: `Changed Object.${method} to Object.${replacement}`,
                    apply: (code) => {
                      const start = path.node.callee.property.loc.start;
                      const end = path.node.callee.property.loc.end;
                      return this.replaceInCode(code, start, end, replacement);
                    }
                  });
                }
              }
            }
          }
        });
        
        return mutations;
      }
    };
    
    return mutators[name];
  }
  
  /**
   * Apply mutation to code
   */
  applyMutation(code, location, replacement) {
    const lines = code.split('\n');
    const startLine = location.start.line - 1;
    const endLine = location.end.line - 1;
    const startCol = location.start.column;
    const endCol = location.end.column;
    
    if (startLine === endLine) {
      // Single line mutation
      const line = lines[startLine];
      lines[startLine] = line.substring(0, startCol) + replacement + line.substring(endCol);
    } else {
      // Multi-line mutation
      const firstLine = lines[startLine].substring(0, startCol) + replacement;
      const lastLine = lines[endLine].substring(endCol);
      lines.splice(startLine, endLine - startLine + 1, firstLine + lastLine);
    }
    
    return lines.join('\n');
  }
  
  /**
   * Replace in code by position
   */
  replaceInCode(code, start, end, replacement) {
    const lines = code.split('\n');
    const startLine = start.line - 1;
    const endLine = end.line - 1;
    const startCol = start.column;
    const endCol = end.column;
    
    if (startLine === endLine) {
      const line = lines[startLine];
      lines[startLine] = line.substring(0, startCol) + replacement + line.substring(endCol);
    } else {
      const firstLine = lines[startLine].substring(0, startCol) + replacement;
      const lastLine = lines[endLine].substring(endCol);
      lines.splice(startLine, endLine - startLine + 1, firstLine + lastLine);
    }
    
    return lines.join('\n');
  }
  
  /**
   * Test a single mutation
   */
  async testMutation(mutation, filePath, testCommand) {
    const startTime = Date.now();
    
    // Read original file
    const originalCode = fs.readFileSync(filePath, 'utf8');
    
    let result = {
      id: mutation.id,
      type: mutation.type,
      description: mutation.description,
      location: mutation.location,
      status: 'pending',
      duration: 0,
      error: null
    };
    
    try {
      // Apply mutation
      const mutatedCode = mutation.apply(originalCode);
      
      // Write mutated code
      fs.writeFileSync(filePath, mutatedCode);
      
      // Run tests
      const testResult = await this.runTests(testCommand);
      
      // Determine mutation status
      if (testResult.passed) {
        // Tests passed with mutation - mutation survived!
        result.status = 'survived';
        logger.warn(`Mutation survived: ${mutation.description}`);
      } else {
        // Tests failed - mutation was killed
        result.status = 'killed';
        logger.info(`Mutation killed: ${mutation.description}`);
      }
      
    } catch (error) {
      result.status = 'error';
      result.error = error.message;
      logger.error(`Mutation error: ${error.message}`);
      
    } finally {
      // Restore original code
      fs.writeFileSync(filePath, originalCode);
      
      result.duration = Date.now() - startTime;
    }
    
    return result;
  }
  
  /**
   * Run tests with timeout
   */
  async runTests(testCommand) {
    return new Promise((resolve) => {
      const { spawn } = require('child_process');
      const parts = testCommand.split(' ');
      const command = parts[0];
      const args = parts.slice(1);
      
      const process = spawn(command, args, {
        stdio: 'pipe',
        shell: true
      });
      
      let output = '';
      let error = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      const timeout = setTimeout(() => {
        process.kill();
        resolve({ passed: false, timeout: true });
      }, this.config.timeout);
      
      process.on('close', (code) => {
        clearTimeout(timeout);
        resolve({
          passed: code === 0,
          exitCode: code,
          output,
          error
        });
      });
      
      process.on('error', (err) => {
        clearTimeout(timeout);
        resolve({
          passed: false,
          error: err.message
        });
      });
    });
  }
  
  /**
   * Update statistics
   */
  updateStatistics(result) {
    this.statistics.total++;
    
    switch (result.status) {
      case 'killed':
        this.statistics.killed++;
        break;
      case 'survived':
        this.statistics.survived++;
        break;
      case 'timeout':
        this.statistics.timeout++;
        break;
      case 'error':
        this.statistics.error++;
        break;
      case 'skipped':
        this.statistics.skipped++;
        break;
    }
  }
  
  /**
   * Generate mutation testing report
   */
  generateReport(results) {
    const report = {
      timestamp: Date.now(),
      mutations: results.length,
      killed: results.filter(r => r.status === 'killed').length,
      survived: results.filter(r => r.status === 'survived').length,
      timeout: results.filter(r => r.status === 'timeout').length,
      error: results.filter(r => r.status === 'error').length,
      mutationScore: 0,
      results: results
    };
    
    // Calculate mutation score
    const tested = report.killed + report.survived;
    if (tested > 0) {
      report.mutationScore = (report.killed / tested * 100).toFixed(2);
    }
    
    // Group by mutation type
    report.byType = {};
    for (const result of results) {
      if (!report.byType[result.type]) {
        report.byType[result.type] = {
          total: 0,
          killed: 0,
          survived: 0,
          score: 0
        };
      }
      
      const typeStats = report.byType[result.type];
      typeStats.total++;
      if (result.status === 'killed') typeStats.killed++;
      if (result.status === 'survived') typeStats.survived++;
      
      const typeTested = typeStats.killed + typeStats.survived;
      if (typeTested > 0) {
        typeStats.score = (typeStats.killed / typeTested * 100).toFixed(2);
      }
    }
    
    // Find survived mutations (these indicate weak tests)
    report.survivedMutations = results
      .filter(r => r.status === 'survived')
      .map(r => ({
        type: r.type,
        description: r.description,
        location: r.location
      }));
    
    return report;
  }
  
  /**
   * Run mutation testing on multiple files
   */
  async testFiles(files, testCommand) {
    const reports = [];
    
    for (const file of files) {
      if (!this.shouldSkipFile(file)) {
        const report = await this.testFile(file, testCommand);
        reports.push({ file, report });
      }
    }
    
    return this.generateSummaryReport(reports);
  }
  
  /**
   * Check if file should be skipped
   */
  shouldSkipFile(file) {
    return this.config.excludePatterns.some(pattern => 
      file.includes(pattern)
    );
  }
  
  /**
   * Generate summary report for multiple files
   */
  generateSummaryReport(fileReports) {
    const summary = {
      timestamp: Date.now(),
      files: fileReports.length,
      totalMutations: 0,
      totalKilled: 0,
      totalSurvived: 0,
      overallScore: 0,
      fileReports: fileReports,
      weakestFiles: [],
      strongestFiles: []
    };
    
    // Aggregate statistics
    for (const { file, report } of fileReports) {
      summary.totalMutations += report.mutations;
      summary.totalKilled += report.killed;
      summary.totalSurvived += report.survived;
    }
    
    // Calculate overall score
    const totalTested = summary.totalKilled + summary.totalSurvived;
    if (totalTested > 0) {
      summary.overallScore = (summary.totalKilled / totalTested * 100).toFixed(2);
    }
    
    // Sort files by mutation score
    const sortedFiles = fileReports
      .map(({ file, report }) => ({
        file,
        score: parseFloat(report.mutationScore)
      }))
      .sort((a, b) => a.score - b.score);
    
    // Identify weakest and strongest files
    summary.weakestFiles = sortedFiles.slice(0, 5);
    summary.strongestFiles = sortedFiles.slice(-5).reverse();
    
    return summary;
  }
  
  /**
   * Generate HTML report
   */
  generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Mutation Testing Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { background: #333; color: white; padding: 20px; border-radius: 5px; }
    .score { font-size: 48px; font-weight: bold; }
    .good { color: #28a745; }
    .medium { color: #ffc107; }
    .bad { color: #dc3545; }
    .stats { display: flex; justify-content: space-around; margin: 20px 0; }
    .stat { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 5px; }
    .mutations { margin-top: 30px; }
    .mutation { padding: 10px; margin: 10px 0; border-left: 4px solid #ccc; }
    .killed { border-left-color: #28a745; }
    .survived { border-left-color: #dc3545; background: #fff3cd; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Mutation Testing Report</h1>
    <div class="score ${this.getScoreClass(report.mutationScore)}">${report.mutationScore}%</div>
    <p>Mutation Score</p>
  </div>
  
  <div class="stats">
    <div class="stat">
      <h3>${report.mutations}</h3>
      <p>Total Mutations</p>
    </div>
    <div class="stat">
      <h3 class="good">${report.killed}</h3>
      <p>Killed</p>
    </div>
    <div class="stat">
      <h3 class="bad">${report.survived}</h3>
      <p>Survived</p>
    </div>
  </div>
  
  <h2>Mutation Types</h2>
  <table>
    <tr><th>Type</th><th>Total</th><th>Killed</th><th>Survived</th><th>Score</th></tr>
    ${Object.entries(report.byType).map(([type, stats]) => `
      <tr>
        <td>${type}</td>
        <td>${stats.total}</td>
        <td>${stats.killed}</td>
        <td>${stats.survived}</td>
        <td class="${this.getScoreClass(stats.score)}">${stats.score}%</td>
      </tr>
    `).join('')}
  </table>
  
  ${report.survivedMutations.length > 0 ? `
    <h2>Survived Mutations (Test Gaps)</h2>
    <div class="mutations">
      ${report.survivedMutations.map(m => `
        <div class="mutation survived">
          <strong>${m.type}:</strong> ${m.description}
          <br><small>Line ${m.location.start.line}</small>
        </div>
      `).join('')}
    </div>
  ` : ''}
</body>
</html>
    `;
    
    return html;
  }
  
  getScoreClass(score) {
    const value = parseFloat(score);
    if (value >= 80) return 'good';
    if (value >= 60) return 'medium';
    return 'bad';
  }
}

// Export singleton
module.exports = new MutationTestingFramework();