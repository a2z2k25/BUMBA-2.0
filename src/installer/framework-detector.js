/**
 * BUMBA CLI Detection Module
 * Analyzes existing Claude configurations and frameworks
 */

const fs = require('fs');
const path = require('path');

/**
 * Detect and analyze existing frameworks
 */
function analyzeExistingFrameworks(installDir) {
  const analysis = {
    hasClaudeDir: fs.existsSync(installDir),
    frameworks: [],
    conflicts: [],
    preservable: []
  };

  if (!analysis.hasClaudeDir) {return analysis;}

  // Detect existing Claude configurations
  const claudeMd = path.join(installDir, 'CLAUDE.md');
  if (fs.existsSync(claudeMd)) {
    const content = fs.readFileSync(claudeMd, 'utf8');
    if (content.includes('BUMBA')) {
      analysis.frameworks.push('BUMBA');
    } else {
      analysis.frameworks.push('Existing Configuration');
    }
  }

  // Detect command structures
  const commandsDir = path.join(installDir, 'commands');
  if (fs.existsSync(commandsDir)) {
    const commands = fs.readdirSync(commandsDir);
    if (commands.length > 0) {
      analysis.preservable.push('Command structure', 'Hook system', 'Settings');
    }
  }

  return analysis;
}

module.exports = {
  analyzeExistingFrameworks
};
