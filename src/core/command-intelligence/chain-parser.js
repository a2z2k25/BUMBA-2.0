/**
 * BUMBA Chain Parser
 * Parses and validates command chains
 */

const { logger } = require('../logging/bumba-logger');

class ChainParser {
  constructor() {
    // Chain operators
    this.chainOperators = {
      '&&': 'sequential',  // Run next if previous succeeds
      '||': 'fallback',    // Run next if previous fails
      '|': 'pipe',         // Pipe output to next command
      ';': 'parallel',     // Run in parallel
      '->': 'transform',   // Transform output before next
      '=>': 'depends'      // Explicit dependency
    };
    
    this.maxChainLength = 10; // Maximum commands in a chain
  }

  /**
   * Parse command chain from input
   */
  parseChain(input) {
    logger.info(`🔗 Parsing command chain: ${input}`);
    
    // Validate input
    if (!input || typeof input !== 'string') {
      throw new Error('Invalid chain input');
    }
    
    // Split by operators while preserving them
    const segments = this.splitByOperators(input);
    
    // Build chain structure
    const chain = this.buildChainStructure(segments);
    
    // Validate chain
    this.validateChain(chain);
    
    logger.info(`✅ Parsed chain with ${chain.commands.length} commands`);
    
    return chain;
  }

  /**
   * Split input by chain operators
   */
  splitByOperators(input) {
    const segments = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < input.length) {
      const char = input[i];
      const next = input[i + 1];
      const twoChar = char + (next || '');
      
      // Handle quotes
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
        current += char;
        i++;
        continue;
      }
      
      // Skip operators inside quotes
      if (inQuotes) {
        current += char;
        i++;
        continue;
      }
      
      // Check for two-character operators
      if (this.chainOperators[twoChar]) {
        if (current.trim()) {
          segments.push({
            type: 'command',
            value: current.trim()
          });
        }
        segments.push({
          type: 'operator',
          value: twoChar,
          operation: this.chainOperators[twoChar]
        });
        current = '';
        i += 2;
        continue;
      }
      
      // Check for single-character operators
      if (this.chainOperators[char]) {
        if (current.trim()) {
          segments.push({
            type: 'command',
            value: current.trim()
          });
        }
        segments.push({
          type: 'operator',
          value: char,
          operation: this.chainOperators[char]
        });
        current = '';
        i++;
        continue;
      }
      
      current += char;
      i++;
    }
    
    // Add final segment
    if (current.trim()) {
      segments.push({
        type: 'command',
        value: current.trim()
      });
    }
    
    return segments;
  }

  /**
   * Build chain structure from segments
   */
  buildChainStructure(segments) {
    const chain = {
      commands: [],
      operations: [],
      dependencies: new Map(),
      parallel: [],
      sequential: []
    };
    
    let currentCommand = null;
    let previousCommand = null;
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      if (segment.type === 'command') {
        // Parse individual command
        const command = this.parseCommand(segment.value);
        command.index = chain.commands.length;
        
        chain.commands.push(command);
        previousCommand = currentCommand;
        currentCommand = command;
        
      } else if (segment.type === 'operator') {
        // Handle operator relationship
        if (previousCommand && currentCommand) {
          const operation = {
            type: segment.operation,
            from: previousCommand.index,
            to: currentCommand ? currentCommand.index : null,
            operator: segment.value
          };
          
          chain.operations.push(operation);
          
          // Build dependency graph
          this.addDependency(chain, previousCommand, currentCommand, segment.operation);
        }
      }
    }
    
    // Identify parallel and sequential groups
    this.identifyExecutionGroups(chain);
    
    return chain;
  }

  /**
   * Parse individual command
   */
  parseCommand(commandStr) {
    const parts = commandStr.trim().split(/\s+/);
    
    return {
      command: parts[0],
      args: parts.slice(1),
      raw: commandStr,
      dependencies: [],
      outputs: null
    };
  }

  /**
   * Add dependency between commands
   */
  addDependency(chain, from, to, operation) {
    if (!chain.dependencies.has(to.index)) {
      chain.dependencies.set(to.index, []);
    }
    
    const dependency = {
      from: from.index,
      type: operation
    };
    
    chain.dependencies.get(to.index).push(dependency);
    to.dependencies.push(from.index);
    
    // Special handling for different operations
    switch(operation) {
      case 'pipe':
        // Output of 'from' becomes input of 'to'
        to.pipeFrom = from.index;
        break;
        
      case 'sequential':
        // 'to' runs only if 'from' succeeds
        to.requiresSuccess = from.index;
        break;
        
      case 'fallback':
        // 'to' runs only if 'from' fails
        to.requiresFailure = from.index;
        break;
        
      case 'parallel':
        // Can run at same time
        if (!chain.parallel.includes(from.index)) {
          chain.parallel.push(from.index);
        }
        if (!chain.parallel.includes(to.index)) {
          chain.parallel.push(to.index);
        }
        break;
    }
  }

  /**
   * Identify execution groups
   */
  identifyExecutionGroups(chain) {
    // Commands that can run in parallel (no dependencies or parallel operator)
    chain.parallel = chain.commands
      .filter((cmd, index) => {
        const deps = chain.dependencies.get(index);
        return !deps || deps.some(d => d.type === 'parallel');
      })
      .map(cmd => cmd.index);
    
    // Commands that must run sequentially
    chain.sequential = chain.commands
      .filter((cmd, index) => {
        const deps = chain.dependencies.get(index);
        return deps && deps.some(d => 
          d.type === 'sequential' || 
          d.type === 'pipe' || 
          d.type === 'transform'
        );
      })
      .map(cmd => cmd.index);
  }

  /**
   * Validate chain structure
   */
  validateChain(chain) {
    // Check chain length
    if (chain.commands.length > this.maxChainLength) {
      throw new Error(`Chain too long: ${chain.commands.length} commands (max: ${this.maxChainLength})`);
    }
    
    // Check for circular dependencies
    if (this.hasCircularDependency(chain)) {
      throw new Error('Circular dependency detected in chain');
    }
    
    // Validate each command
    for (const command of chain.commands) {
      if (!command.command) {
        throw new Error('Invalid command in chain');
      }
    }
    
    return true;
  }

  /**
   * Check for circular dependencies
   */
  hasCircularDependency(chain) {
    const visited = new Set();
    const recursionStack = new Set();
    
    const hasCycle = (index) => {
      visited.add(index);
      recursionStack.add(index);
      
      const deps = chain.dependencies.get(index) || [];
      
      for (const dep of deps) {
        if (!visited.has(dep.from)) {
          if (hasCycle(dep.from)) return true;
        } else if (recursionStack.has(dep.from)) {
          return true;
        }
      }
      
      recursionStack.delete(index);
      return false;
    };
    
    for (let i = 0; i < chain.commands.length; i++) {
      if (!visited.has(i)) {
        if (hasCycle(i)) return true;
      }
    }
    
    return false;
  }

  /**
   * Get execution order for chain
   */
  getExecutionOrder(chain) {
    const order = [];
    const executed = new Set();
    
    // Topological sort considering dependencies
    const canExecute = (index) => {
      const deps = chain.dependencies.get(index) || [];
      return deps.every(dep => executed.has(dep.from));
    };
    
    while (executed.size < chain.commands.length) {
      let progress = false;
      
      for (let i = 0; i < chain.commands.length; i++) {
        if (!executed.has(i) && canExecute(i)) {
          order.push(i);
          executed.add(i);
          progress = true;
        }
      }
      
      if (!progress) {
        // No progress - might have unresolvable dependencies
        logger.warn('⚠️ Could not resolve all dependencies');
        break;
      }
    }
    
    return order;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  ChainParser,
  getInstance: () => {
    if (!instance) {
      instance = new ChainParser();
    }
    return instance;
  }
};