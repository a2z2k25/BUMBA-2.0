/**
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
      
      logger.info(`💾 Memory saved: ~${totalSaved.toFixed(1)}MB`);
      
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
