/**
 * Migration Manager
 * Database schema versioning and migration system
 * Sprint 25-28 - Database Layer Fix
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { databaseManager } = require('./database-manager');
const { logger } = require('../logging/bumba-logger');
const { stateManager } = require('../state/global-state-manager');

class MigrationManager {
  constructor(options = {}) {
    this.options = {
      migrationsPath: options.migrationsPath || path.join(process.cwd(), 'migrations'),
      migrationsTable: options.migrationsTable || 'migrations',
      databaseType: options.databaseType || 'default',
      dryRun: options.dryRun || false,
      lockTimeout: options.lockTimeout || 30000
    };
    
    this.migrations = [];
    this.applied = new Set();
    this.pending = [];
    this.isLocked = false;
    
    this.stats = {
      migrationsRun: 0,
      migrationsRolledBack: 0,
      errors: 0
    };
    
    // Ensure migrations directory exists
    this.ensureMigrationsDirectory();
    
    // Register with state manager
    stateManager.register('migrations', {
      stats: this.stats,
      applied: [],
      pending: []
    });
  }
  
  /**
   * Ensure migrations directory exists
   */
  ensureMigrationsDirectory() {
    if (!fs.existsSync(this.options.migrationsPath)) {
      fs.mkdirSync(this.options.migrationsPath, { recursive: true });
    }
  }
  
  /**
   * Initialize migrations table
   */
  async initialize() {
    await databaseManager.execute(this.options.databaseType, async (connection) => {
      const sql = `
        CREATE TABLE IF NOT EXISTS ${this.options.migrationsTable} (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          hash VARCHAR(64) NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          execution_time INTEGER,
          batch INTEGER,
          rolled_back BOOLEAN DEFAULT FALSE
        )
      `;
      
      await connection.query(sql);
      logger.info('Migrations table initialized');
    });
    
    await this.loadAppliedMigrations();
  }
  
  /**
   * Load applied migrations from database
   */
  async loadAppliedMigrations() {
    const result = await databaseManager.execute(this.options.databaseType, async (connection) => {
      return await connection.query(
        `SELECT * FROM ${this.options.migrationsTable} WHERE rolled_back = FALSE ORDER BY batch, id`
      );
    });
    
    this.applied.clear();
    for (const row of result.rows || []) {
      this.applied.add(row.name);
    }
    
    logger.info(`Loaded ${this.applied.size} applied migrations`);
  }
  
  /**
   * Discover migration files
   */
  async discoverMigrations() {
    this.migrations = [];
    
    if (!fs.existsSync(this.options.migrationsPath)) {
      return;
    }
    
    const files = fs.readdirSync(this.options.migrationsPath);
    const migrationFiles = files
      .filter(f => f.endsWith('.js'))
      .sort();
    
    for (const file of migrationFiles) {
      const filepath = path.join(this.options.migrationsPath, file);
      const migration = require(filepath);
      
      // Validate migration structure
      if (!migration.up || !migration.down) {
        logger.warn(`Invalid migration file: ${file} (missing up/down methods)`);
        continue;
      }
      
      const content = fs.readFileSync(filepath, 'utf8');
      const hash = crypto.createHash('md5').update(content).digest('hex');
      
      this.migrations.push({
        name: file,
        path: filepath,
        migration,
        hash,
        applied: this.applied.has(file)
      });
    }
    
    // Identify pending migrations
    this.pending = this.migrations.filter(m => !m.applied);
    
    logger.info(`Discovered ${this.migrations.length} migrations (${this.pending.length} pending)`);
    this.updateState();
  }
  
  /**
   * Create new migration file
   */
  async create(name) {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const filename = `${timestamp}_${name}.js`;
    const filepath = path.join(this.options.migrationsPath, filename);
    
    const template = `/**
 * Migration: ${name}
 * Created: ${new Date().toISOString()}
 */

module.exports = {
  /**
   * Run migration
   */
  async up(connection) {
    // Add your migration code here
    await connection.query(\`
      -- Your SQL here
    \`);
  },
  
  /**
   * Rollback migration
   */
  async down(connection) {
    // Add your rollback code here
    await connection.query(\`
      -- Your rollback SQL here
    \`);
  },
  
  /**
   * Migration metadata
   */
  meta: {
    description: '${name}',
    breaking: false,
    dependencies: []
  }
};`;
    
    fs.writeFileSync(filepath, template);
    logger.info(`Created migration: ${filename}`);
    
    return filename;
  }
  
  /**
   * Run pending migrations
   */
  async migrate(options = {}) {
    const targetVersion = options.target;
    const batchSize = options.batch || Infinity;
    
    await this.acquireLock();
    
    try {
      await this.discoverMigrations();
      
      if (this.pending.length === 0) {
        logger.info('No pending migrations');
        return { migrated: 0 };
      }
      
      // Determine batch number
      const batch = await this.getNextBatch();
      
      let migrated = 0;
      const migrationsToRun = targetVersion 
        ? this.pending.filter(m => m.name <= targetVersion)
        : this.pending.slice(0, batchSize);
      
      for (const migration of migrationsToRun) {
        await this.runMigration(migration, batch);
        migrated++;
      }
      
      this.stats.migrationsRun += migrated;
      logger.info(`Migrated ${migrated} migrations`);
      
      return { migrated, batch };
      
    } finally {
      await this.releaseLock();
    }
  }
  
  /**
   * Run single migration
   */
  async runMigration(migration, batch) {
    logger.info(`Running migration: ${migration.name}`);
    
    const startTime = Date.now();
    
    if (this.options.dryRun) {
      logger.info(`[DRY RUN] Would run: ${migration.name}`);
      return;
    }
    
    await databaseManager.executeTransaction(this.options.databaseType, async (connection) => {
      // Run migration
      await migration.migration.up(connection);
      
      // Record migration
      await connection.query(
        `INSERT INTO ${this.options.migrationsTable} (name, hash, execution_time, batch) VALUES ($1, $2, $3, $4)`,
        [migration.name, migration.hash, Date.now() - startTime, batch]
      );
    });
    
    this.applied.add(migration.name);
    migration.applied = true;
    
    logger.info(`Migration completed: ${migration.name} (${Date.now() - startTime}ms)`);
  }
  
  /**
   * Rollback migrations
   */
  async rollback(options = {}) {
    const steps = options.steps || 1;
    const all = options.all || false;
    
    await this.acquireLock();
    
    try {
      // Get applied migrations
      const appliedMigrations = await this.getAppliedMigrations();
      
      if (appliedMigrations.length === 0) {
        logger.info('No migrations to rollback');
        return { rolledBack: 0 };
      }
      
      // Determine migrations to rollback
      let toRollback = [];
      
      if (all) {
        toRollback = appliedMigrations;
      } else {
        // Get last N batches
        const batches = [...new Set(appliedMigrations.map(m => m.batch))].sort((a, b) => b - a);
        const targetBatches = batches.slice(0, steps);
        
        toRollback = appliedMigrations.filter(m => targetBatches.includes(m.batch));
      }
      
      // Rollback in reverse order
      toRollback.reverse();
      
      let rolledBack = 0;
      
      for (const migrationData of toRollback) {
        await this.rollbackMigration(migrationData);
        rolledBack++;
      }
      
      this.stats.migrationsRolledBack += rolledBack;
      logger.info(`Rolled back ${rolledBack} migrations`);
      
      return { rolledBack };
      
    } finally {
      await this.releaseLock();
    }
  }
  
  /**
   * Rollback single migration
   */
  async rollbackMigration(migrationData) {
    logger.info(`Rolling back: ${migrationData.name}`);
    
    if (this.options.dryRun) {
      logger.info(`[DRY RUN] Would rollback: ${migrationData.name}`);
      return;
    }
    
    // Load migration file
    const filepath = path.join(this.options.migrationsPath, migrationData.name);
    const migration = require(filepath);
    
    await databaseManager.executeTransaction(this.options.databaseType, async (connection) => {
      // Run rollback
      await migration.down(connection);
      
      // Mark as rolled back
      await connection.query(
        `UPDATE ${this.options.migrationsTable} SET rolled_back = TRUE WHERE name = $1`,
        [migrationData.name]
      );
    });
    
    this.applied.delete(migrationData.name);
    
    logger.info(`Rollback completed: ${migrationData.name}`);
  }
  
  /**
   * Get applied migrations from database
   */
  async getAppliedMigrations() {
    const result = await databaseManager.execute(this.options.databaseType, async (connection) => {
      return await connection.query(
        `SELECT * FROM ${this.options.migrationsTable} WHERE rolled_back = FALSE ORDER BY batch DESC, id DESC`
      );
    });
    
    return result.rows || [];
  }
  
  /**
   * Get next batch number
   */
  async getNextBatch() {
    const result = await databaseManager.execute(this.options.databaseType, async (connection) => {
      return await connection.query(
        `SELECT MAX(batch) as max_batch FROM ${this.options.migrationsTable}`
      );
    });
    
    const maxBatch = result.rows[0]?.max_batch || 0;
    return maxBatch + 1;
  }
  
  /**
   * Acquire migration lock
   */
  async acquireLock() {
    const startTime = Date.now();
    
    while (this.isLocked) {
      if (Date.now() - startTime > this.options.lockTimeout) {
        throw new Error('Failed to acquire migration lock');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.isLocked = true;
  }
  
  /**
   * Release migration lock
   */
  async releaseLock() {
    this.isLocked = false;
  }
  
  /**
   * Reset migrations (dangerous!)
   */
  async reset() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot reset migrations in production');
    }
    
    await this.rollback({ all: true });
    
    // Drop migrations table
    await databaseManager.execute(this.options.databaseType, async (connection) => {
      await connection.query(`DROP TABLE IF EXISTS ${this.options.migrationsTable}`);
    });
    
    this.applied.clear();
    this.pending = [];
    
    logger.warn('Migrations reset complete');
  }
  
  /**
   * Get migration status
   */
  async status() {
    await this.discoverMigrations();
    
    return {
      total: this.migrations.length,
      applied: this.applied.size,
      pending: this.pending.length,
      migrations: this.migrations.map(m => ({
        name: m.name,
        applied: m.applied,
        hash: m.hash
      }))
    };
  }
  
  /**
   * Verify migration integrity
   */
  async verify() {
    const issues = [];
    
    // Check for hash mismatches
    const appliedMigrations = await this.getAppliedMigrations();
    
    for (const applied of appliedMigrations) {
      const filepath = path.join(this.options.migrationsPath, applied.name);
      
      if (!fs.existsSync(filepath)) {
        issues.push({
          type: 'missing_file',
          migration: applied.name,
          message: 'Migration file not found'
        });
        continue;
      }
      
      const content = fs.readFileSync(filepath, 'utf8');
      const currentHash = crypto.createHash('md5').update(content).digest('hex');
      
      if (currentHash !== applied.hash) {
        issues.push({
          type: 'hash_mismatch',
          migration: applied.name,
          message: 'Migration file has been modified after execution'
        });
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
  
  /**
   * Update state
   */
  updateState() {
    stateManager.set('migrations', 'stats', this.stats);
    stateManager.set('migrations', 'applied', Array.from(this.applied));
    stateManager.set('migrations', 'pending', this.pending.map(m => m.name));
  }
}

// Singleton instance
let instance = null;

function getMigrationManager(options) {
  if (!instance) {
    instance = new MigrationManager(options);
  }
  return instance;
}

module.exports = {
  MigrationManager,
  getMigrationManager,
  migrationManager: getMigrationManager()
};