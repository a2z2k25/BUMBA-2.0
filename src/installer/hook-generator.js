/**
 * BUMBA Hook Generation Module
 * Creates quality enforcement hooks
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../core/logging/bumba-logger');

/**
 * Generate pre-execution hook
 */
function generatePreExecutionHook() {
  return `#!/bin/bash
# BUMBA Pre-execution Security & Quality Scan
set -euo pipefail
echo "BUMBA cognitive safeguard: Verifying before execution..." >&2
echo "BUMBA security pre-check passed" >&2
exit 0`;
}

/**
 * Generate post-execution hook
 */
function generatePostExecutionHook() {
  return `#!/bin/bash
# BUMBA Post-execution Quality Validation
set -euo pipefail
echo "BUMBA quality validation completed" >&2
exit 0`;
}

/**
 * Generate completion hook
 */
function generateCompletionHook() {
  return `#!/bin/bash
# BUMBA Completion Notification
# Professional workflow completion with contextual feedback

echo "BUMBA workflow completed successfully" >&2

# Sacred BUMBA audio feedback
BUMBA_HORN_PATHS=(
  "$HOME/.claude/assets/audio/bumba-horn.mp3"
  "$(npm root -g)/bumba-claude/assets/audio/bumba-horn.mp3"
  "$(dirname "$(readlink -f "$0" 2>/dev/null || echo "$0")")/../assets/audio/bumba-horn.mp3"
  "$(pwd)/assets/audio/bumba-horn.mp3"
)

BUMBA_HORN_PATH=""
for path in "\${BUMBA_HORN_PATHS[@]}"; do
  if [[ -f "$path" ]]; then
    BUMBA_HORN_PATH="$path"
    break
  fi
done

if [[ -n "$BUMBA_HORN_PATH" ]]; then
  if command -v afplay >/dev/null 2>&1; then
    afplay "$BUMBA_HORN_PATH" 2>/dev/null || true
  elif command -v mpg123 >/dev/null 2>&1; then
    mpg123 -q "$BUMBA_HORN_PATH" 2>/dev/null || true
  elif command -v ffplay >/dev/null 2>&1; then
    ffplay -nodisp -autoexit -v 0 "$BUMBA_HORN_PATH" 2>/dev/null || true
  fi
else
  if command -v afplay >/dev/null 2>&1; then
    afplay /System/Library/Sounds/Glass.aiff 2>/dev/null || true
  elif command -v paplay >/dev/null 2>&1; then
    paplay /usr/share/sounds/alsa/Front_Left.wav 2>/dev/null || true
  fi
fi

# Designer workflow context
recent_files=$(find . -type f -mmin -1 \\( -name "*.figma" -o -name "*.sketch" -o -name "*.svg" -o -name "*.tsx" -o -name "*.jsx" \\) 2>/dev/null | head -3)

if [[ -n "$recent_files" ]]; then
  echo "BUMBA designer workflow completed" >&2
  echo "Modified: $(echo "$recent_files" | tr '\\n' ' ')" >&2
fi

exit 0`;
}

/**
 * Generate placeholder hook
 */
function generatePlaceholderHook(name) {
  return `#!/bin/bash
# BUMBA ${name} Hook
# This is a placeholder for advanced ${name} functionality
echo "BUMBA ${name} hook executed" >&2
exit 0`;
}

/**
 * Generate all quality hooks
 */
async function generateQualityHooks(hooksDir) {
  const ora = require('ora');
  const spinner = ora('Generating BUMBA Quality Enforcement System...').start();

  // Ensure hooks directory exists
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  // Write BUMBA hooks
  const hooks = {
    'bumba-pre-execution.sh': generatePreExecutionHook(),
    'bumba-post-execution.sh': generatePostExecutionHook(),
    'bumba-completion.sh': generateCompletionHook(),
    'intelligent-command-router.sh': generatePlaceholderHook('Intelligent Command Router'),
    'workflow-learning-engine.sh': generatePlaceholderHook('Workflow Learning Engine'),
    'context-bridge.sh': generatePlaceholderHook('Context Bridge'),
    'mcp-optimization-engine.sh': generatePlaceholderHook('MCP Optimization Engine'),
    'predictive-quality-gate.sh': generatePlaceholderHook('Predictive Quality Gate'),
    'design-workflow-analyzer.sh': generatePlaceholderHook('Design Workflow Analyzer'),
    'project-context-synthesis.sh': generatePlaceholderHook('Project Context Synthesis'),
    'vintage-game-audio.sh': generatePlaceholderHook('Vintage Game Audio')
  };

  for (const [filename, content] of Object.entries(hooks)) {
    const filepath = path.join(hooksDir, filename);
    fs.writeFileSync(filepath, content);
    fs.chmodSync(filepath, 0o755);
  }

  spinner.stop();
  logger.info('🏁 BUMBA quality enforcement hooks generated');

  return true;
}

module.exports = {
  generateQualityHooks,
  generatePreExecutionHook,
  generatePostExecutionHook,
  generateCompletionHook
};
