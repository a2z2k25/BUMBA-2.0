#!/usr/bin/env node

/**
 * BUMBA Migration Script: Convert to Lazy-Loaded Department Managers
 * This script updates the framework to use memory-optimized department managers
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../src/core/logging/bumba-logger');

class LazyDepartmentMigration {
  constructor() {
    this.stats = {
      filesUpdated: 0,
      memorySaved: 0,
      errors: []
    };
  }

  /**
   * Main migration process
   */
  async migrate() {
    logger.info('🚀 Starting lazy department manager migration...');
    
    try {
      // Step 1: Backup current department managers
      await this.backupCurrentManagers();
      
      // Step 2: Update import references
      await this.updateImports();
      
      // Step 3: Update initialization code
      await this.updateInitialization();
      
      // Step 4: Test the migration
      await this.testMigration();
      
      // Step 5: Report results
      this.reportResults();
      
    } catch (error) {
      logger.error('Migration failed:', error);
      await this.rollback();
      process.exit(1);
    }
  }

  /**
   * Backup current department managers
   */
  async backupCurrentManagers() {
    logger.info('📦 Backing up current department managers...');
    
    const managersToBackup = [
      'backend-engineer-manager.js',
      'design-engineer-manager.js',
      'product-strategist-manager.js'
    ];
    
    const backupDir = path.join(__dirname, '../backups/department-managers');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    for (const manager of managersToBackup) {
      const source = path.join(__dirname, '../src/core/departments', manager);
      if (fs.existsSync(source)) {
        const dest = path.join(backupDir, `${manager}.backup-${Date.now()}`);
        fs.copyFileSync(source, dest);
        logger.debug(`Backed up: ${manager}`);
      }
    }
  }

  /**
   * Update import references throughout the codebase
   */
  async updateImports() {
    logger.info('🔄 Updating import references...');
    
    const replacements = [
      {
        old: "require('./backend-engineer-manager')",
        new: "require('./backend-engineer-manager-lazy')"
      },
      {
        old: "require('./design-engineer-manager')",
        new: "require('./design-engineer-manager-lazy')"
      },
      {
        old: "require('./product-strategist-manager')",
        new: "require('./product-strategist-manager-lazy')"
      },
      {
        old: "from './backend-engineer-manager'",
        new: "from './backend-engineer-manager-lazy'"
      },
      {
        old: "from './design-engineer-manager'",
        new: "from './design-engineer-manager-lazy'"
      },
      {
        old: "from './product-strategist-manager'",
        new: "from './product-strategist-manager-lazy'"
      }
    ];
    
    // Files to update
    const filesToUpdate = [
      '../src/core/departments/department-manager.js',
      '../src/core/commands/specialist-factory.js',
      '../src/core/commands/command-router-with-managers.js',
      '../src/core/orchestration/orchestration-hooks.js',
      '../src/core/pooling-v2/bumba-integration-bridge.js'
    ];
    
    for (const file of filesToUpdate) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf-8');
        let modified = false;
        
        for (const replacement of replacements) {
          if (content.includes(replacement.old)) {
            content = content.replace(new RegExp(replacement.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.new);
            modified = true;
          }
        }
        
        if (modified) {
          fs.writeFileSync(filePath, content);
          this.stats.filesUpdated++;
          logger.debug(`Updated imports in: ${path.basename(filePath)}`);
        }
      }
    }
  }

  /**
   * Update initialization code
   */
  async updateInitialization() {
    logger.info('🔧 Updating initialization code...');
    
    // Create new initialization helper
    const initHelper = `/**
 * BUMBA Lazy Department Manager Initialization Helper
 */

const { logger } = require('../logging/bumba-logger');

class LazyDepartmentInitializer {
  static async initializeDepartments() {
    const departments = [];
    
    try {
      // Initialize Backend Engineering
      const BackendManager = require('./backend-engineer-manager-lazy');
      const backend = new BackendManager();
      await backend.warmupCache(); // Preload common specialists
      departments.push(backend);
      
      // Initialize Design Engineering  
      const DesignManager = require('./design-engineer-manager-lazy');
      const design = new DesignManager();
      await design.warmupCache();
      departments.push(design);
      
      // Initialize Product Strategy
      const ProductManager = require('./product-strategist-manager-lazy');
      const product = new ProductManager();
      await product.warmupCache();
      departments.push(product);
      
      logger.info('✅ All department managers initialized with lazy loading');
      
      // Report memory savings
      const memoryStats = departments.map(d => d.getMemoryStats());
      const totalSaved = memoryStats.reduce((acc, stat) => {
        const registered = stat.specialists.registered;
        const loaded = stat.specialists.loaded;
        return acc + ((registered - loaded) * 0.5); // Estimate 0.5MB per unloaded specialist
      }, 0);
      
      logger.info(\`💾 Memory saved: ~\${totalSaved.toFixed(1)}MB\`);
      
      return departments;
      
    } catch (error) {
      logger.error('Failed to initialize departments:', error);
      throw error;
    }
  }
  
  static async cleanupDepartments(departments) {
    logger.info('🧹 Cleaning up department managers...');
    
    for (const dept of departments) {
      await dept.destroy();
    }
    
    logger.info('✅ Department cleanup complete');
  }
}

module.exports = LazyDepartmentInitializer;
`;
    
    const initPath = path.join(__dirname, '../src/core/departments/lazy-department-initializer.js');
    fs.writeFileSync(initPath, initHelper);
    this.stats.filesUpdated++;
    logger.debug('Created lazy department initializer');
  }

  /**
   * Test the migration
   */
  async testMigration() {
    logger.info('🧪 Testing lazy department managers...');
    
    try {
      // Test loading each manager
      const managers = [
        require('../src/core/departments/backend-engineer-manager-lazy'),
        require('../src/core/departments/design-engineer-manager-lazy'),
        require('../src/core/departments/product-strategist-manager-lazy')
      ];
      
      for (const ManagerClass of managers) {
        const instance = new ManagerClass();
        
        // Test basic functionality
        const specialists = instance.listAvailableSpecialists();
        logger.debug(`${instance.departmentName}: ${specialists.length} specialists registered`);
        
        // Test lazy loading
        const testSpecialist = specialists[0];
        if (testSpecialist) {
          await instance.getSpecialist(testSpecialist.name);
          logger.debug(`Successfully lazy-loaded: ${testSpecialist.name}`);
        }
        
        // Get memory stats
        const stats = instance.getMemoryStats();
        this.stats.memorySaved += (stats.specialists.registered - stats.specialists.loaded) * 0.5; // Estimate
        
        // Clean up
        await instance.destroy();
      }
      
      logger.info('✅ All tests passed');
      
    } catch (error) {
      logger.error('Test failed:', error);
      this.stats.errors.push(error.message);
      throw error;
    }
  }

  /**
   * Rollback changes if migration fails
   */
  async rollback() {
    logger.warn('⚠️ Rolling back migration...');
    
    const backupDir = path.join(__dirname, '../backups/department-managers');
    const managers = ['backend-engineer-manager.js', 'design-engineer-manager.js', 'product-strategist-manager.js'];
    
    for (const manager of managers) {
      const backups = fs.readdirSync(backupDir).filter(f => f.startsWith(manager));
      if (backups.length > 0) {
        const latestBackup = backups.sort().pop();
        const source = path.join(backupDir, latestBackup);
        const dest = path.join(__dirname, '../src/core/departments', manager);
        fs.copyFileSync(source, dest);
        logger.debug(`Restored: ${manager}`);
      }
    }
    
    logger.info('✅ Rollback complete');
  }

  /**
   * Report migration results
   */
  reportResults() {
    console.log('\n' + '='.repeat(60));
    console.log('LAZY DEPARTMENT MIGRATION RESULTS');
    console.log('='.repeat(60));
    console.log(`Files Updated: ${this.stats.filesUpdated}`);
    console.log(`Estimated Memory Saved: ~${this.stats.memorySaved.toFixed(1)}MB`);
    console.log(`Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\nErrors encountered:');
      this.stats.errors.forEach(err => console.log(`  - ${err}`));
    }
    
    console.log('\nNext Steps:');
    console.log('1. Test your application thoroughly');
    console.log('2. Monitor memory usage with: npm run memory:monitor');
    console.log('3. If issues occur, run: npm run migrate:rollback');
    console.log('='.repeat(60) + '\n');
  }
}

// Run migration
if (require.main === module) {
  const migration = new LazyDepartmentMigration();
  migration.migrate().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = LazyDepartmentMigration;