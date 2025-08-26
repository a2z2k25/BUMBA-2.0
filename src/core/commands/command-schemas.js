/**
 * BUMBA Command Schema Definitions
 * Defines validation schemas for all commands
 */

const commandSchemas = {
  // Product Strategy Commands
  'prd': {
    description: 'Create comprehensive PRD',
    category: 'strategy',
    args: {
      minArgs: 0,
      maxArgs: 3,
      schema: [
        { name: 'title', type: 'string', required: false, pattern: '^[\\w\\s-]+$' },
        { name: 'scope', type: 'enum', values: ['mvp', 'full', 'iterative'], required: false },
        { name: 'format', type: 'enum', values: ['markdown', 'notion', 'pdf'], required: false }
      ]
    },
    options: {
      '--verbose': { type: 'boolean', description: 'Enable detailed output' },
      '--template': { type: 'string', description: 'Use specific template' },
      '--collaborate': { type: 'boolean', description: 'Enable multi-agent collaboration' }
    },
    requiredEnv: [],
    mcpServers: ['notion', 'memory'],
    permissionLevel: 1
  },

  'implement': {
    description: 'Smart development implementation',
    category: 'development',
    args: {
      minArgs: 1,
      maxArgs: 5,
      schema: [
        { name: 'feature', type: 'string', required: true, pattern: '^[\\w\\s-]+$' },
        { name: 'language', type: 'string', required: false },
        { name: 'framework', type: 'string', required: false },
        { name: 'testStrategy', type: 'enum', values: ['unit', 'integration', 'e2e', 'all'], required: false },
        { name: 'deployTarget', type: 'string', required: false }
      ]
    },
    options: {
      '--dry-run': { type: 'boolean', description: 'Preview changes without applying' },
      '--force': { type: 'boolean', description: 'Skip confirmation prompts' },
      '--test': { type: 'boolean', description: 'Run tests after implementation' },
      '--commit': { type: 'boolean', description: 'Auto-commit changes' }
    },
    requiredEnv: [],
    mcpServers: ['filesystem', 'github'],
    permissionLevel: 2
  },

  'analyze': {
    description: 'Multi-dimensional code analysis',
    category: 'development',
    args: {
      minArgs: 0,
      maxArgs: 3,
      schema: [
        { name: 'target', type: 'path', required: false, default: '.' },
        { name: 'depth', type: 'number', required: false, min: 1, max: 10, default: 3 },
        { name: 'focus', type: 'enum', values: ['security', 'performance', 'quality', 'all'], required: false }
      ]
    },
    options: {
      '--recursive': { type: 'boolean', description: 'Analyze recursively' },
      '--ignore': { type: 'string', description: 'Patterns to ignore' },
      '--output': { type: 'enum', values: ['console', 'file', 'notion'], description: 'Output format' }
    },
    requiredEnv: [],
    mcpServers: ['filesystem'],
    permissionLevel: 1
  },

  'test': {
    description: 'Intelligent testing with automatic agent routing',
    category: 'quality',
    args: {
      minArgs: 0,
      maxArgs: 4,
      schema: [
        { name: 'scope', type: 'enum', values: ['unit', 'integration', 'e2e', 'all'], required: false },
        { name: 'target', type: 'path', required: false },
        { name: 'coverage', type: 'boolean', required: false },
        { name: 'reporter', type: 'enum', values: ['spec', 'json', 'html', 'coverage'], required: false }
      ]
    },
    options: {
      '--watch': { type: 'boolean', description: 'Watch mode' },
      '--bail': { type: 'boolean', description: 'Stop on first failure' },
      '--parallel': { type: 'boolean', description: 'Run tests in parallel' },
      '--update-snapshots': { type: 'boolean', description: 'Update snapshots' }
    },
    requiredEnv: [],
    mcpServers: ['filesystem'],
    permissionLevel: 1,
    routing: 'intelligent'
  },

  'deploy': {
    description: 'Deploy application to target environment',
    category: 'deployment',
    args: {
      minArgs: 1,
      maxArgs: 3,
      schema: [
        { name: 'environment', type: 'enum', values: ['dev', 'staging', 'production'], required: true },
        { name: 'version', type: 'string', required: false, pattern: '^v?\\d+\\.\\d+\\.\\d+$' },
        { name: 'strategy', type: 'enum', values: ['rolling', 'blue-green', 'canary'], required: false }
      ]
    },
    options: {
      '--dry-run': { type: 'boolean', description: 'Simulate deployment' },
      '--force': { type: 'boolean', description: 'Force deployment' },
      '--rollback': { type: 'boolean', description: 'Rollback on failure' },
      '--notify': { type: 'boolean', description: 'Send notifications' }
    },
    requiredEnv: ['DEPLOY_KEY', 'DEPLOY_HOST'],
    mcpServers: ['docker-mcp', 'kubernetes'],
    permissionLevel: 3,
    requiredRoles: ['deployer', 'admin']
  },

  'secure': {
    description: 'Security validation and enforcement',
    category: 'security',
    args: {
      minArgs: 0,
      maxArgs: 2,
      schema: [
        { name: 'target', type: 'path', required: false },
        { name: 'level', type: 'enum', values: ['basic', 'standard', 'strict'], required: false }
      ]
    },
    options: {
      '--fix': { type: 'boolean', description: 'Auto-fix issues' },
      '--report': { type: 'enum', values: ['summary', 'detailed', 'json'], description: 'Report format' },
      '--fail-on': { type: 'enum', values: ['error', 'warning', 'info'], description: 'Failure threshold' }
    },
    requiredEnv: [],
    mcpServers: ['filesystem', 'semgrep'],
    permissionLevel: 2
  },

  'figma': {
    description: 'Figma Dev Mode integration',
    category: 'design',
    args: {
      minArgs: 1,
      maxArgs: 3,
      schema: [
        { name: 'action', type: 'enum', values: ['sync', 'export', 'generate', 'inspect'], required: true },
        { name: 'fileId', type: 'string', required: false, pattern: '^[A-Za-z0-9]+$' },
        { name: 'nodeId', type: 'string', required: false }
      ]
    },
    options: {
      '--format': { type: 'enum', values: ['svg', 'png', 'jpg', 'pdf'], description: 'Export format' },
      '--scale': { type: 'number', min: 0.5, max: 4, description: 'Export scale' },
      '--components': { type: 'boolean', description: 'Export as components' }
    },
    requiredEnv: ['FIGMA_TOKEN'],
    mcpServers: ['figma-dev-mode', 'figma-context'],
    permissionLevel: 1
  },

  'collaborate': {
    description: 'Multi-agent collaboration',
    category: 'collaboration',
    args: {
      minArgs: 1,
      maxArgs: 10,
      schema: [
        { name: 'task', type: 'string', required: true },
        { name: 'agents', type: 'array', required: false, itemType: 'string' }
      ]
    },
    options: {
      '--parallel': { type: 'boolean', description: 'Run agents in parallel' },
      '--consensus': { type: 'boolean', description: 'Require consensus' },
      '--timeout': { type: 'number', min: 60, max: 3600, description: 'Timeout in seconds' }
    },
    requiredEnv: [],
    mcpServers: ['memory'],
    permissionLevel: 2
  },

  'urgent': {
    description: 'Emergency priority routing',
    category: 'communication',
    args: {
      minArgs: 1,
      maxArgs: 5,
      schema: [
        { name: 'issue', type: 'string', required: true },
        { name: 'severity', type: 'enum', values: ['critical', 'high', 'medium'], required: false },
        { name: 'component', type: 'string', required: false }
      ]
    },
    options: {
      '--bypass-queue': { type: 'boolean', description: 'Bypass normal queue' },
      '--alert': { type: 'boolean', description: 'Send alerts' },
      '--escalate': { type: 'boolean', description: 'Auto-escalate if not resolved' }
    },
    requiredEnv: [],
    mcpServers: [],
    permissionLevel: 3,
    routing: 'priority_override'
  },

  // Add more command schemas as needed
};

/**
 * Schema validator class
 */
class CommandSchemaValidator {
  constructor() {
    this.schemas = commandSchemas;
  }

  /**
   * Validate command against its schema
   */
  validateAgainstSchema(command, args = [], options = {}) {
    const schema = this.schemas[command];
    if (!schema) {
      return {
        valid: false,
        errors: [`No schema defined for command: ${command}`]
      };
    }

    const errors = [];
    const warnings = [];

    // Validate arguments
    if (schema.args) {
      const argErrors = this.validateArguments(args, schema.args);
      errors.push(...argErrors);
    }

    // Validate options
    if (schema.options && options) {
      const optionErrors = this.validateOptions(options, schema.options);
      errors.push(...optionErrors);
    }

    // Check environment requirements
    if (schema.requiredEnv) {
      for (const envVar of schema.requiredEnv) {
        if (!process.env[envVar]) {
          warnings.push(`Required environment variable not set: ${envVar}`);
        }
      }
    }

    // Check MCP server requirements
    if (schema.mcpServers && schema.mcpServers.length > 0) {
      warnings.push(`Command requires MCP servers: ${schema.mcpServers.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      schema
    };
  }

  /**
   * Validate arguments against schema
   */
  validateArguments(args, argSchema) {
    const errors = [];

    // Check argument count
    if (args.length < argSchema.minArgs) {
      errors.push(`Too few arguments. Minimum required: ${argSchema.minArgs}`);
    }

    if (args.length > argSchema.maxArgs) {
      errors.push(`Too many arguments. Maximum allowed: ${argSchema.maxArgs}`);
    }

    // Validate each argument against schema
    if (argSchema.schema) {
      for (let i = 0; i < Math.min(args.length, argSchema.schema.length); i++) {
        const argDef = argSchema.schema[i];
        const argValue = args[i];

        // Check required
        if (argDef.required && (argValue === undefined || argValue === null || argValue === '')) {
          errors.push(`Argument '${argDef.name}' is required`);
          continue;
        }

        // Skip if not provided and not required
        if (!argValue && !argDef.required) {
          continue;
        }

        // Type validation
        const typeError = this.validateType(argValue, argDef.type, argDef);
        if (typeError) {
          errors.push(`Argument '${argDef.name}': ${typeError}`);
        }

        // Pattern validation
        if (argDef.pattern && typeof argValue === 'string') {
          const pattern = new RegExp(argDef.pattern);
          if (!pattern.test(argValue)) {
            errors.push(`Argument '${argDef.name}' does not match required pattern: ${argDef.pattern}`);
          }
        }

        // Enum validation
        if (argDef.type === 'enum' && argDef.values) {
          if (!argDef.values.includes(argValue)) {
            errors.push(`Argument '${argDef.name}' must be one of: ${argDef.values.join(', ')}`);
          }
        }

        // Range validation for numbers
        if (argDef.type === 'number') {
          const num = Number(argValue);
          if (argDef.min !== undefined && num < argDef.min) {
            errors.push(`Argument '${argDef.name}' must be at least ${argDef.min}`);
          }
          if (argDef.max !== undefined && num > argDef.max) {
            errors.push(`Argument '${argDef.name}' must be at most ${argDef.max}`);
          }
        }
      }
    }

    return errors;
  }

  /**
   * Validate options against schema
   */
  validateOptions(options, optionSchema) {
    const errors = [];

    for (const [optName, optValue] of Object.entries(options)) {
      const optDef = optionSchema[optName];
      
      if (!optDef) {
        errors.push(`Unknown option: ${optName}`);
        continue;
      }

      // Type validation
      const typeError = this.validateType(optValue, optDef.type, optDef);
      if (typeError) {
        errors.push(`Option '${optName}': ${typeError}`);
      }

      // Enum validation
      if (optDef.type === 'enum' && optDef.values) {
        if (!optDef.values.includes(optValue)) {
          errors.push(`Option '${optName}' must be one of: ${optDef.values.join(', ')}`);
        }
      }

      // Range validation for numbers
      if (optDef.type === 'number') {
        const num = Number(optValue);
        if (optDef.min !== undefined && num < optDef.min) {
          errors.push(`Option '${optName}' must be at least ${optDef.min}`);
        }
        if (optDef.max !== undefined && num > optDef.max) {
          errors.push(`Option '${optName}' must be at most ${optDef.max}`);
        }
      }
    }

    return errors;
  }

  /**
   * Validate value type
   */
  validateType(value, type, definition) {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return 'must be a string';
        }
        break;

      case 'number':
        if (isNaN(Number(value))) {
          return 'must be a number';
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          return 'must be a boolean';
        }
        break;

      case 'path':
        if (typeof value !== 'string') {
          return 'must be a valid path';
        }
        // Additional path validation could go here
        break;

      case 'array':
        if (!Array.isArray(value)) {
          try {
            // Try to parse as JSON array
            const parsed = JSON.parse(value);
            if (!Array.isArray(parsed)) {
              return 'must be an array';
            }
          } catch {
            return 'must be a valid array';
          }
        }
        break;

      case 'enum':
        // Handled separately
        break;

      default:
        // Unknown type, skip validation
        break;
    }

    return null;
  }

  /**
   * Get schema for a command
   */
  getSchema(command) {
    return this.schemas[command];
  }

  /**
   * Get all schemas
   */
  getAllSchemas() {
    return this.schemas;
  }

  /**
   * Add or update a schema
   */
  addSchema(command, schema) {
    this.schemas[command] = schema;
  }

  /**
   * Generate help text from schema
   */
  generateHelp(command) {
    const schema = this.schemas[command];
    if (!schema) {
      return `No help available for command: ${command}`;
    }

    let help = `# ${command}\n\n`;
    help += `${schema.description}\n\n`;
    help += `Category: ${schema.category}\n\n`;

    if (schema.args && schema.args.schema) {
      help += '## Arguments\n\n';
      for (const arg of schema.args.schema) {
        help += `- **${arg.name}** (${arg.type}${arg.required ? ', required' : ', optional'}): `;
        if (arg.type === 'enum' && arg.values) {
          help += `One of: ${arg.values.join(', ')}`;
        }
        help += '\n';
      }
      help += '\n';
    }

    if (schema.options) {
      help += '## Options\n\n';
      for (const [name, opt] of Object.entries(schema.options)) {
        help += `- **${name}** (${opt.type}): ${opt.description}\n`;
      }
      help += '\n';
    }

    if (schema.requiredEnv && schema.requiredEnv.length > 0) {
      help += '## Required Environment Variables\n\n';
      for (const env of schema.requiredEnv) {
        help += `- ${env}\n`;
      }
      help += '\n';
    }

    if (schema.mcpServers && schema.mcpServers.length > 0) {
      help += '## Required MCP Servers\n\n';
      for (const server of schema.mcpServers) {
        help += `- ${server}\n`;
      }
    }

    return help;
  }
}

module.exports = {
  commandSchemas,
  CommandSchemaValidator
};