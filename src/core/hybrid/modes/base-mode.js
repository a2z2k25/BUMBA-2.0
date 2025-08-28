/**
 * BUMBA Base Mode Class
 * Abstract base for all execution modes
 */

const fs = require('fs').promises;
const path = require('path');

class BaseMode {
  constructor(options = {}) {
    this.environment = options.environment;
    this.config = options.config || {};
    this.initialized = false;
    this.tasksDir = path.join(process.cwd(), '.bumba', 'tasks');
    this.contextDir = path.join(process.cwd(), '.bumba', 'context');
  }

  /**
   * Initialize the mode
   */
  async initialize() {
    // Ensure BUMBA directories exist
    await this.ensureDirectories();
    this.initialized = true;
  }

  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    const dirs = [
      path.join(process.cwd(), '.bumba'),
      this.tasksDir,
      this.contextDir
    ];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory might already exist, that's fine
      }
    }
  }

  /**
   * Check if a command can be executed in this mode
   * @param {string} command Command name
   * @returns {boolean}
   */
  canExecute(command) {
    // Override in subclasses
    return false;
  }

  /**
   * Execute a command
   * @param {string} command Command name
   * @param {Array} args Command arguments
   * @returns {Promise}
   */
  async execute(command, ...args) {
    throw new Error(`Execute method must be implemented in ${this.constructor.name}`);
  }

  /**
   * Get mode information
   * @returns {Object}
   */
  getInfo() {
    return {
      name: this.constructor.name,
      initialized: this.initialized,
      environment: this.environment.mode
    };
  }

  /**
   * Generate unique task ID
   * @returns {string}
   */
  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Save task to filesystem
   * @param {Object} task Task object
   * @returns {Promise<string>} Task ID
   */
  async saveTask(task) {
    const taskId = task.id || this.generateTaskId();
    const taskFile = path.join(this.tasksDir, `${taskId}.json`);
    
    const taskData = {
      ...task,
      id: taskId,
      createdAt: Date.now(),
      mode: this.environment.mode
    };
    
    await fs.writeFile(taskFile, JSON.stringify(taskData, null, 2));
    return taskId;
  }

  /**
   * Load task from filesystem
   * @param {string} taskId Task ID
   * @returns {Promise<Object>} Task object
   */
  async loadTask(taskId) {
    const taskFile = path.join(this.tasksDir, `${taskId}.json`);
    
    try {
      const data = await fs.readFile(taskFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Task not found: ${taskId}`);
    }
  }

  /**
   * List all tasks
   * @returns {Promise<Array>} List of task summaries
   */
  async listTasks() {
    try {
      const files = await fs.readdir(this.tasksDir);
      const tasks = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const taskPath = path.join(this.tasksDir, file);
          const data = await fs.readFile(taskPath, 'utf8');
          const task = JSON.parse(data);
          tasks.push({
            id: task.id,
            type: task.type,
            description: task.description,
            createdAt: task.createdAt,
            status: task.status || 'pending'
          });
        }
      }
      
      return tasks.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      return [];
    }
  }

  /**
   * Save context information
   * @param {Object} context Context data
   * @returns {Promise<string>} Context ID
   */
  async saveContext(context) {
    const contextId = `context_${Date.now()}`;
    const contextFile = path.join(this.contextDir, `${contextId}.json`);
    
    await fs.writeFile(contextFile, JSON.stringify(context, null, 2));
    return contextId;
  }

  /**
   * Load context information
   * @param {string} contextId Context ID
   * @returns {Promise<Object>} Context data
   */
  async loadContext(contextId) {
    const contextFile = path.join(this.contextDir, `${contextId}.json`);
    
    try {
      const data = await fs.readFile(contextFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Context not found: ${contextId}`);
    }
  }

  /**
   * Clean up mode resources
   */
  async cleanup() {
    // Override in subclasses if needed
  }
}

module.exports = BaseMode;