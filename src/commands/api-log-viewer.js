#!/usr/bin/env node

/**
 * BUMBA API Log Viewer
 * View and analyze API call logs to validate parallel execution
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class APILogViewer {
  constructor() {
    this.logDir = path.join(process.cwd(), 'bumba-logs');
  }

  /**
   * Display the current summary
   */
  viewSummary() {
    const summaryFile = path.join(this.logDir, 'api-calls-summary.txt');

    if (!fs.existsSync(summaryFile)) {
      console.log(chalk.yellow('🟡  No API call logs found yet.'));
      console.log(chalk.gray('Run some BUMBA commands to generate logs.'));
      return;
    }

    const summary = fs.readFileSync(summaryFile, 'utf-8');
    console.log(summary);
  }

  /**
   * List all available log files
   */
  listLogs() {
    if (!fs.existsSync(this.logDir)) {
      console.log(chalk.yellow('🟡  No logs directory found.'));
      return;
    }

    const files = fs.readdirSync(this.logDir)
      .filter(f => f.startsWith('api-calls-') && f.endsWith('.json'))
      .sort()
      .reverse();

    console.log(chalk.cyan('\n🟢 Available API Call Logs:\n'));

    if (files.length === 0) {
      console.log(chalk.gray('No log files found.'));
      return;
    }

    files.forEach((file, index) => {
      const filePath = path.join(this.logDir, file);
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024).toFixed(1);

      console.log(chalk.green(`${index + 1}. ${file}`));
      console.log(chalk.gray(`   Size: ${size} KB`));
      console.log(chalk.gray(`   Modified: ${stats.mtime.toLocaleString()}\n`));
    });
  }

  /**
   * Analyze a specific log file
   */
  analyzeLog(filename) {
    const filePath = filename.includes('/') ? filename : path.join(this.logDir, filename);

    if (!fs.existsSync(filePath)) {
      console.log(chalk.red(`🔴 Log file not found: ${filePath}`));
      return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const entries = this.parseLogFile(content);

    // Analyze the log
    const analysis = {
      totalEntries: entries.length,
      parallelGroups: entries.filter(e => e.type === 'PARALLEL_EXECUTION_START').length,
      apiCalls: entries.filter(e => e.type === 'API_CALL').length,
      sequentialCalls: entries.filter(e => e.type === 'SEQUENTIAL_EXECUTION').length,
      parallelCalls: entries.filter(e => e.type === 'API_CALL' && e.parallel).length
    };

    console.log(chalk.cyan('\n🟢 Log Analysis:\n'));
    console.log(chalk.white(`File: ${path.basename(filePath)}`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.green(`Total Entries: ${analysis.totalEntries}`));
    console.log(chalk.green(`Parallel Groups: ${analysis.parallelGroups}`));
    console.log(chalk.green(`API Calls: ${analysis.apiCalls}`));
    console.log(chalk.yellow(`  - Parallel: ${analysis.parallelCalls}`));
    console.log(chalk.yellow(`  - Sequential: ${analysis.sequentialCalls}`));

    // Show parallel execution details
    const parallelGroups = entries.filter(e => e.type === 'PARALLEL_EXECUTION_START');
    if (parallelGroups.length > 0) {
      console.log(chalk.cyan('\n🟢 Parallel Executions:\n'));
      parallelGroups.forEach((group, index) => {
        console.log(chalk.green(`${index + 1}. Execution ${group.executionId}`));
        console.log(chalk.gray(`   Time: ${group.timestamp}`));
        console.log(chalk.gray(`   Agents: ${group.taskCount}`));
        if (group.tasks) {
          group.tasks.forEach(t => {
            console.log(chalk.blue(`     - ${t.agent} (${t.model})`));
          });
        }

        // Find completion
        const completion = entries.find(e =>
          e.type === 'PARALLEL_EXECUTION_COMPLETE' &&
          e.executionId === group.executionId
        );

        if (completion) {
          console.log(chalk.gray(`   Duration: ${completion.totalDuration}ms`));
          console.log(chalk.gray(`   Success: ${completion.successCount}/${group.taskCount}`));
          if (completion.totalCost) {
            console.log(chalk.gray(`   Cost: $${completion.totalCost}`));
          }
        }
        console.log();
      });
    }
  }

  /**
   * Parse log file content
   */
  parseLogFile(content) {
    const entries = [];
    const lines = content.split('\n');
    let currentEntry = '';

    for (const line of lines) {
      if (line.trim().startsWith('{')) {
        currentEntry = line;
      } else if (currentEntry) {
        currentEntry += line;
      }

      if (line.trim().endsWith('},') || line.trim().endsWith('}')) {
        try {
          let json = currentEntry;
          if (json.endsWith(',')) {
            json = json.slice(0, -1);
          }
          const entry = JSON.parse(json);
          if (entry.type) {
            entries.push(entry);
          }
        } catch (e) {
          // Skip invalid entries
        }
        currentEntry = '';
      }
    }

    return entries;
  }

  /**
   * Watch logs in real-time
   */
  watchLogs() {
    console.log(chalk.cyan('🟢️  Watching for API calls...\n'));
    console.log(chalk.gray('Press Ctrl+C to stop watching.\n'));

    const summaryFile = path.join(this.logDir, 'api-calls-summary.txt');
    let lastSize = 0;

    if (fs.existsSync(summaryFile)) {
      lastSize = fs.statSync(summaryFile).size;
    }

    // Watch for changes
    const watcher = fs.watch(this.logDir, (eventType, filename) => {
      if (filename && filename.includes('api-calls')) {
        const filePath = path.join(this.logDir, filename);
        if (fs.existsSync(filePath)) {
          const currentSize = fs.statSync(filePath).size;
          if (currentSize > lastSize) {
            console.log(chalk.green(`🏁 New API call logged in ${filename}`));
            lastSize = currentSize;
          }
        }
      }
    });

    // Handle exit
    process.on('SIGINT', () => {
      watcher.close();
      console.log(chalk.yellow('\n\n🟢 Stopped watching logs.'));
      process.exit(0);
    });
  }
}

// CLI Interface
if (require.main === module) {
  const viewer = new APILogViewer();
  const args = process.argv.slice(2);
  const command = args[0];

  console.log(chalk.cyan.bold('\n🟢 BUMBA API Log Viewer\n'));

  switch (command) {
    case 'summary':
      viewer.viewSummary();
      break;

    case 'list':
      viewer.listLogs();
      break;

    case 'analyze':
      if (!args[1]) {
        console.log(chalk.red('Please provide a log file to analyze.'));
        console.log(chalk.gray('Usage: bumba-logs analyze <filename>'));
      } else {
        viewer.analyzeLog(args[1]);
      }
      break;

    case 'watch':
      viewer.watchLogs();
      break;

    default:
      console.log(chalk.yellow('Available commands:\n'));
      console.log(chalk.green('  bumba-logs summary') + chalk.gray('  - View current session summary'));
      console.log(chalk.green('  bumba-logs list') + chalk.gray('     - List all log files'));
      console.log(chalk.green('  bumba-logs analyze <file>') + chalk.gray(' - Analyze specific log'));
      console.log(chalk.green('  bumba-logs watch') + chalk.gray('    - Watch logs in real-time'));
      console.log();
  }
}

module.exports = APILogViewer;
