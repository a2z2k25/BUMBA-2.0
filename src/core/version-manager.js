/**
 * BUMBA Version Management System
 * Unified version control across all framework components
 */

const fs = require('fs');
const { logger } = require('./logging/bumba-logger');

const path = require('path');

class BumbaVersionManager {
  constructor() {
    this.BUMBA_VERSION = {
      framework: '2.0.0',
      config: '2.0.0',
      api: '1.0.0',
      installer: '1.0.0'
    };

    this.frameworkRoot = path.resolve(__dirname, '../..');
  }

  /**
   * Get the current framework version
   */
  getFrameworkVersion() {
    return this.BUMBA_VERSION.framework;
  }

  /**
   * Get all version information
   */
  getAllVersions() {
    return { ...this.BUMBA_VERSION };
  }

  /**
   * Validate version consistency across all files
   */
  async validateVersionConsistency() {
    const issues = [];

    try {
      // Check package.json
      const packagePath = path.join(this.frameworkRoot, 'package.json');
      if (fs.existsSync(packagePath)) {
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

        if (packageData.version !== this.BUMBA_VERSION.framework) {
          issues.push({
            file: 'package.json',
            field: 'version',
            expected: this.BUMBA_VERSION.framework,
            actual: packageData.version
          });
        }

        if (packageData.config?.framework_version !== this.BUMBA_VERSION.framework) {
          issues.push({
            file: 'package.json',
            field: 'config.framework_version',
            expected: this.BUMBA_VERSION.framework,
            actual: packageData.config?.framework_version
          });
        }
      }

      // Check bumba.config.js
      const configPath = path.join(this.frameworkRoot, 'bumba.config.js');
      if (fs.existsSync(configPath)) {
        // Read config file as text to avoid require caching
        const configContent = fs.readFileSync(configPath, 'utf8');
        const versionMatch = configContent.match(/version:\s*['"]([^'"]+)['"]/);

        if (versionMatch && versionMatch[1] !== this.BUMBA_VERSION.config) {
          issues.push({
            file: 'bumba.config.js',
            field: 'framework.version',
            expected: this.BUMBA_VERSION.config,
            actual: versionMatch[1]
          });
        }
      }

    } catch (error) {
      issues.push({
        file: 'validation',
        field: 'error',
        expected: 'success',
        actual: error.message
      });
    }

    return {
      consistent: issues.length === 0,
      issues: issues,
      validated_at: new Date().toISOString()
    };
  }

  /**
   * Fix version inconsistencies
   */
  async fixVersionInconsistencies() {
    const fixes = [];

    try {
      // Fix package.json
      const packagePath = path.join(this.frameworkRoot, 'package.json');
      if (fs.existsSync(packagePath)) {
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

        let modified = false;
        if (packageData.version !== this.BUMBA_VERSION.framework) {
          packageData.version = this.BUMBA_VERSION.framework;
          modified = true;
          fixes.push('Updated package.json version');
        }

        if (!packageData.config) {
          packageData.config = {};
        }

        if (packageData.config.framework_version !== this.BUMBA_VERSION.framework) {
          packageData.config.framework_version = this.BUMBA_VERSION.framework;
          modified = true;
          fixes.push('Updated package.json config.framework_version');
        }

        if (modified) {
          fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2) + '\n');
        }
      }

      // Fix bumba.config.js
      const configPath = path.join(this.frameworkRoot, 'bumba.config.js');
      if (fs.existsSync(configPath)) {
        let configContent = fs.readFileSync(configPath, 'utf8');

        // Replace version in config file
        const versionRegex = /(version:\s*['"])([^'"]+)(['"])/;
        if (versionRegex.test(configContent)) {
          const newContent = configContent.replace(versionRegex, `$1${this.BUMBA_VERSION.config}$3`);
          if (newContent !== configContent) {
            fs.writeFileSync(configPath, newContent);
            fixes.push('Updated bumba.config.js framework.version');
          }
        }
      }

    } catch (error) {
      fixes.push(`Error fixing versions: ${error.message}`);
    }

    return {
      success: fixes.length > 0,
      fixes: fixes,
      fixed_at: new Date().toISOString()
    };
  }

  /**
   * Display version information
   */
  displayVersionInfo() {
    logger.info('🏁 BUMBA CLI Version Information:');
    logger.info(`   Framework: ${this.BUMBA_VERSION.framework}`);
    logger.info(`   Config: ${this.BUMBA_VERSION.config}`);
    logger.info(`   API: ${this.BUMBA_VERSION.api}`);
    logger.info(`   Installer: ${this.BUMBA_VERSION.installer}`);
  }

  /**
   * Version validation on startup
   */
  async startupValidation() {
    const validation = await this.validateVersionConsistency();

    if (!validation.consistent) {
      logger.warn('🟡  Version inconsistencies detected:', validation.issues.length);

      // Auto-fix if possible
      const fixes = await this.fixVersionInconsistencies();
      if (fixes.success) {
        logger.info('🏁 Version inconsistencies automatically fixed');
        return true;
      } else {
        logger.error('🔴 Could not fix version inconsistencies');
        return false;
      }
    }

    return true;
  }
}

module.exports = {
  VersionManager: BumbaVersionManager,  // Standard export name
  BumbaVersionManager  // Keep for backward compatibility
};
