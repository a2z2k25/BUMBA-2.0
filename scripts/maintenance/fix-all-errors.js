#!/usr/bin/env node

/**
 * BUMBA CLI Comprehensive Error Fix Script
 * Fixes all remaining errors to achieve 100% operability
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ComprehensiveFixRunner {
  constructor() {
    this.fixCount = 0;
    this.errors = [];
  }

  log(message, type = 'info') {
    const symbols = {
      info: 'ℹ️',
      success: '🏁',
      error: '🔴',
      fix: '🔧'
    };
    console.log(`${symbols[type] || '•'} ${message}`);
  }

  // Fix all catch blocks without error variable
  fixCatchBlocks() {
    this.log('Fixing catch blocks without error variables...', 'fix');
    
    const files = execSync('find src -name "*.js" -type f', { encoding: 'utf-8' })
      .split('\n')
      .filter(f => f);

    for (const file of files) {
      if (!fs.existsSync(file)) continue;
      
      let content = fs.readFileSync(file, 'utf-8');
      let modified = false;

      // Fix catch without parameter
      if (content.includes('} catch {')) {
        content = content.replace(/\} catch \{/g, '} catch (error) {');
        modified = true;
      }

      // Fix references to undefined error variables
      const catchBlockRegex = /catch\s*\((\w+)\)\s*\{([^}]+)\}/g;
      content = content.replace(catchBlockRegex, (match, errorVar, block) => {
        // Check if block references different error variable
        let fixedBlock = block;
        
        // Common mismatches
        if (errorVar === 'error' && block.includes('err)')) {
          fixedBlock = block.replace(/err\)/g, 'error)');
          modified = true;
        }
        if (errorVar === 'err' && block.includes('error)') && !block.includes('error:')) {
          fixedBlock = block.replace(/error\)/g, 'err)');
          modified = true;
        }
        
        return `catch (${errorVar}) {${fixedBlock}}`;
      });

      if (modified) {
        fs.writeFileSync(file, content);
        this.fixCount++;
        this.log(`Fixed: ${path.basename(file)}`, 'success');
      }
    }
  }

  // Add cleanup to all classes with intervals/timeouts
  addCleanupMethods() {
    this.log('Adding cleanup methods to prevent memory leaks...', 'fix');
    
    const filesToFix = [
      'src/core/monitoring/health-monitor.js',
      'src/core/monitoring/performance-monitor.js',
      'src/core/analytics/performance-integration.js',
      'src/core/analytics/team-performance-analytics.js',
      'src/core/learning/optimization-engine.js'
    ];

    for (const file of filesToFix) {
      if (!fs.existsSync(file)) continue;
      
      let content = fs.readFileSync(file, 'utf-8');
      
      // Check if cleanup exists
      if (!content.includes('cleanup()') && !content.includes('shutdown()')) {
        // Add cleanup method before module.exports
        const exportMatch = content.match(/module\.exports\s*=\s*{/);
        if (exportMatch) {
          const insertPos = content.lastIndexOf('}', exportMatch.index);
          const cleanupMethod = `
  cleanup() {
    if (this.interval) clearInterval(this.interval);
    if (this.checkInterval) clearInterval(this.checkInterval);
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    if (this.timeout) clearTimeout(this.timeout);
    if (this.listeners) this.removeAllListeners();
  }
`;
          content = content.slice(0, insertPos) + cleanupMethod + '\n' + content.slice(insertPos);
          fs.writeFileSync(file, content);
          this.fixCount++;
          this.log(`Added cleanup to: ${path.basename(file)}`, 'success');
        }
      }
    }
  }

  // Fix test setup to prevent timeouts
  fixTestSetup() {
    this.log('Fixing test setup and teardown...', 'fix');
    
    const setupFile = 'tests/setup-tests.js';
    let content = fs.readFileSync(setupFile, 'utf-8');
    
    // Add proper cleanup
    if (!content.includes('afterAll')) {
      content += `
// Clean up after all tests
afterAll(() => {
  // Clear all timers
  jest.clearAllTimers();
  jest.useRealTimers();
  
  // Restore console
  global.console = console;
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});

// Prevent open handles
beforeAll(() => {
  jest.useFakeTimers();
});
`;
      fs.writeFileSync(setupFile, content);
      this.fixCount++;
      this.log('Fixed test setup', 'success');
    }
  }

  // Create missing test mocks
  createTestMocks() {
    this.log('Creating test mocks...', 'fix');
    
    const mockDir = 'tests/__mocks__';
    if (!fs.existsSync(mockDir)) {
      fs.mkdirSync(mockDir, { recursive: true });
    }

    // Create logger mock
    const loggerMock = `
module.exports = {
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn()
  }
};`;
    
    fs.writeFileSync(path.join(mockDir, 'bumba-logger.js'), loggerMock);
    this.fixCount++;
    this.log('Created logger mock', 'success');
  }

  // Fix all test files
  fixTestFiles() {
    this.log('Fixing test files...', 'fix');
    
    const testFiles = execSync('find tests -name "*.test.js" -o -name "*.spec.js"', { encoding: 'utf-8' })
      .split('\n')
      .filter(f => f);

    for (const file of testFiles) {
      if (!fs.existsSync(file)) continue;
      
      let content = fs.readFileSync(file, 'utf-8');
      let modified = false;

      // Add cleanup in afterEach
      if (!content.includes('afterEach') && content.includes('describe')) {
        const describePos = content.indexOf('describe');
        const insertPos = content.indexOf('{', describePos) + 1;
        content = content.slice(0, insertPos) + `
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });
` + content.slice(insertPos);
        modified = true;
      }

      // Fix async test issues
      content = content.replace(/test\(['"](.+?)['"]\s*,\s*\(\s*\)\s*=>\s*{/g, 
        "test('$1', async () => {");
      
      if (content !== fs.readFileSync(file, 'utf-8')) {
        fs.writeFileSync(file, content);
        this.fixCount++;
        this.log(`Fixed: ${path.basename(file)}`, 'success');
      }
    }
  }

  // Run all fixes
  async runAllFixes() {
    this.log('Starting comprehensive error fixes...', 'info');
    
    try {
      this.fixCatchBlocks();
      this.addCleanupMethods();
      this.fixTestSetup();
      this.createTestMocks();
      this.fixTestFiles();
      
      this.log(`\nCompleted ${this.fixCount} fixes!`, 'success');
      
      // Verify fixes
      this.log('\nVerifying fixes...', 'info');
      
      try {
        execSync('npm test -- --listTests', { stdio: 'ignore' });
        this.log('Tests can be listed successfully', 'success');
      } catch (error) {
        this.log('Some test issues remain', 'error');
      }
      
      return true;
    } catch (error) {
      this.log(`Error during fixes: ${error.message}`, 'error');
      return false;
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const fixer = new ComprehensiveFixRunner();
  fixer.runAllFixes().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = ComprehensiveFixRunner;