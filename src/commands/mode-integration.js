/**
 * BUMBA Mode Command Integration
 * Integrates mode switching into the command system
 */

const ModeManager = require('../core/modes/mode-manager');

/**
 * Mode command handler
 */
async function handleModeCommand(_args, _context) {
  const { bumba } = context;

  // Initialize mode manager if not exists
  if (!bumba.modeManager) {
    bumba.modeManager = new ModeManager(bumba);
  }

  const [subcommand, ...params] = args;

  switch (subcommand) {
    case undefined:
    case 'status':
      // Show current mode status
      return bumba.modeManager.getStatus();

    case 'list':
      // List all available modes
      return {
        modes: bumba.modeManager.getAvailableModes(),
        current: bumba.modeManager.getCurrentMode()
      };

    case 'lite':
    case 'full':
    case 'turbo':
    case 'eco':
      // Switch to specified mode
      const options = parseOptions(params);
      return await bumba.modeManager.switchMode(subcommand, options);

    case 'recommend':
      // Recommend mode for task
      const task = params.join(' ');
      const recommended = bumba.modeManager.recommendMode({ description: task });
      return {
        task,
        recommended,
        reason: getRecommendationReason(recommended, task)
      };

    case 'auto':
      // Enable/disable auto mode switching
      const enabled = params[0] !== 'off';
      bumba.config.autoMode = enabled;
      return {
        autoMode: enabled,
        message: `Auto mode switching ${enabled ? 'enabled' : 'disabled'}`
      };

    case 'benchmark':
      // Benchmark different modes
      return await benchmarkModes(bumba);

    default:
      return {
        error: `Unknown mode command: ${subcommand}`,
        available: ['status', 'list', 'lite', 'full', 'turbo', 'eco', 'recommend', 'auto', 'benchmark']
      };
  }
}

/**
 * Parse command options
 */
function parseOptions(_params) {
  const options = {};

  for (const param of params) {
    if (param.startsWith('--')) {
      const [key, value] = param.slice(2).split('=');
      options[key] = value === undefined ? true : value;
    }
  }

  return options;
}

/**
 * Get recommendation reason
 */
function getRecommendationReason(mode, task) {
  const reasons = {
    lite: 'Task appears to be simple or a prototype',
    turbo: 'Task requires high performance or speed',
    eco: 'Task mentions resource constraints',
    full: 'Task requires full capabilities'
  };

  return reasons[mode] || 'Based on task complexity';
}

/**
 * Benchmark different modes
 */
async function benchmarkModes(bumba) {
  const results = {};
  const testTask = { description: 'benchmark test task' };

  for (const mode of ['lite', 'turbo', 'eco', 'full']) {
    // Switch mode
    await bumba.modeManager.switchMode(mode);

    // Measure performance
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    // Simulate task execution
    await new Promise(resolve => setTimeout(resolve, 100));

    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;

    results[mode] = {
      duration: endTime - startTime,
      memoryDelta: endMemory - startMemory,
      agentCount: bumba.agents?.size || 0
    };
  }

  // Restore original mode
  await bumba.modeManager.switchMode('full');

  return {
    benchmark: 'complete',
    results,
    fastest: Object.entries(results).sort((a, b) => a[1].duration - b[1].duration)[0][0],
    mostEfficient: Object.entries(results).sort((a, b) => a[1].memoryDelta - b[1].memoryDelta)[0][0]
  };
}

/**
 * Mode shortcuts for quick access
 */
const modeShortcuts = {
  '/lite': () => handleModeCommand(['lite'], { bumba: global.bumba }),
  '/turbo': () => handleModeCommand(['turbo'], { bumba: global.bumba }),
  '/eco': () => handleModeCommand(['eco'], { bumba: global.bumba }),
  '/full': () => handleModeCommand(['full'], { bumba: global.bumba }),
  '/dice': () => handleModeCommand(['dice'], { bumba: global.bumba })
};

/**
 * DICE mode specific commands
 */
async function handleDiceCommand(_args, _context) {
  const { bumba } = context;

  // Ensure mode manager exists
  if (!bumba.modeManager) {
    bumba.modeManager = new ModeManager(bumba);
  }

  // Check if in DICE mode
  if (bumba.modeManager.getCurrentMode() !== 'dice') {
    return {
      error: 'Not in DICE mode',
      suggestion: 'Use /bumba:mode dice first'
    };
  }

  const diceMode = bumba.modeManager.diceMode;
  const [subcommand, ...params] = args;

  switch (subcommand) {
    case 'roll':
      return await diceMode.rollDice();

    case 'reroll':
      return await diceMode.reroll(params[0]);

    case 'execute': {
      const 
task = { description: params.join(' ') };
      return await diceMode.executeWithDice(task);

    case 'chaos': {
      const 
level = parseFloat(params[0]);
      if (isNaN(level)) {
        return { error: 'Invalid chaos level. Use 0-1' };
      }
      diceMode.setChaosLevel(level);
      return {
        success: true,
        chaosLevel: level,
        description: diceMode._getChaosDescription(level)
      };

    case 'stats':
      return diceMode.getStats();

    default:
      return {
        error: `Unknown DICE command: ${subcommand}`,
        available: ['roll', 'reroll', 'execute', 'chaos', 'stats']
      };
  }
}

module.exports = {
  handleModeCommand,
  handleDiceCommand,
  modeShortcuts,

  // Export for command registration
  commands: [
    {
      name: 'mode',
      description: 'Switch between BUMBA operational modes',
      aliases: ['modes', 'm'],
      handler: handleModeCommand,
      help: '/bumba:mode [lite|full|turbo|eco|dice|status|list|recommend]'
    },
    {
      name: 'dice',
      description: 'DICE mode commands - roll random agent combinations',
      aliases: ['roll', 'd'],
      handler: handleDiceCommand,
      help: '/bumba:dice [roll|reroll|execute|chaos|stats]'
    }
  ]
};
