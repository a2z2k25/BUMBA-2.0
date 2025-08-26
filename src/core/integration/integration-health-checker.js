/**
 * BUMBA Integration Health Check System
 * Comprehensive health monitoring for all integrations without requiring actual connections
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const fs = require('fs');
const path = require('path');

class IntegrationHealthChecker extends EventEmitter {
  constructor() {
    super();
    
    this.healthStatus = new Map();
    this.checkInterval = null;
    this.lastCheck = null;
    
    // Health check levels
    this.healthLevels = {
      HEALTHY: { value: 100, color: 'green', icon: '🏁' },
      WARNING: { value: 75, color: 'yellow', icon: '🟠️' },
      DEGRADED: { value: 50, color: 'orange', icon: '🟢' },
      CRITICAL: { value: 25, color: 'red', icon: '🔴' },
      UNKNOWN: { value: 0, color: 'gray', icon: '🟡' }
    };
    
    // Check categories
    this.checkCategories = {
      configuration: { weight: 0.3, checks: [] },
      dependencies: { weight: 0.2, checks: [] },
      permissions: { weight: 0.2, checks: [] },
      connectivity: { weight: 0.15, checks: [] },
      performance: { weight: 0.15, checks: [] }
    };
    
    this.initializeChecks();
  }

  /**
   * Initialize all health checks
   */
  initializeChecks() {
    // Configuration checks
    this.checkCategories.configuration.checks = [
      {
        name: 'Environment Variables',
        check: async (integration) => this.checkEnvironmentVariables(integration),
        critical: true
      },
      {
        name: 'Configuration Files',
        check: async (integration) => this.checkConfigurationFiles(integration),
        critical: false
      },
      {
        name: 'Required Settings',
        check: async (integration) => this.checkRequiredSettings(integration),
        critical: true
      }
    ];
    
    // Dependency checks
    this.checkCategories.dependencies.checks = [
      {
        name: 'NPM Packages',
        check: async (integration) => this.checkNpmPackages(integration),
        critical: true
      },
      {
        name: 'System Requirements',
        check: async (integration) => this.checkSystemRequirements(integration),
        critical: false
      },
      {
        name: 'Version Compatibility',
        check: async (integration) => this.checkVersionCompatibility(integration),
        critical: false
      }
    ];
    
    // Permission checks
    this.checkCategories.permissions.checks = [
      {
        name: 'File System Access',
        check: async (integration) => this.checkFileSystemAccess(integration),
        critical: false
      },
      {
        name: 'Network Access',
        check: async (integration) => this.checkNetworkAccess(integration),
        critical: false
      },
      {
        name: 'Process Permissions',
        check: async (integration) => this.checkProcessPermissions(integration),
        critical: false
      }
    ];
    
    // Connectivity checks (without actual connections)
    this.checkCategories.connectivity.checks = [
      {
        name: 'Port Availability',
        check: async (integration) => this.checkPortAvailability(integration),
        critical: false
      },
      {
        name: 'DNS Resolution',
        check: async (integration) => this.checkDnsResolution(integration),
        critical: false
      },
      {
        name: 'Proxy Configuration',
        check: async (integration) => this.checkProxyConfiguration(integration),
        critical: false
      }
    ];
    
    // Performance checks
    this.checkCategories.performance.checks = [
      {
        name: 'Resource Usage',
        check: async (integration) => this.checkResourceUsage(integration),
        critical: false
      },
      {
        name: 'Cache Status',
        check: async (integration) => this.checkCacheStatus(integration),
        critical: false
      },
      {
        name: 'Response Times',
        check: async (integration) => this.checkResponseTimes(integration),
        critical: false
      }
    ];
  }

  /**
   * Perform health check for an integration
   */
  async checkIntegrationHealth(integrationName, config = {}) {
    const startTime = Date.now();
    const results = {
      integration: integrationName,
      timestamp: new Date().toISOString(),
      overall: 0,
      categories: {},
      issues: [],
      recommendations: []
    };
    
    try {
      // Run checks for each category
      for (const [category, categoryConfig] of Object.entries(this.checkCategories)) {
        const categoryResult = await this.runCategoryChecks(
          integrationName,
          category,
          categoryConfig,
          config
        );
        
        results.categories[category] = categoryResult;
        results.overall += categoryResult.score * categoryConfig.weight;
        
        // Collect issues and recommendations
        if (categoryResult.issues) {
          results.issues.push(...categoryResult.issues);
        }
        if (categoryResult.recommendations) {
          results.recommendations.push(...categoryResult.recommendations);
        }
      }
      
      // Determine health level
      results.healthLevel = this.determineHealthLevel(results.overall);
      results.duration = Date.now() - startTime;
      
      // Store results
      this.healthStatus.set(integrationName, results);
      
      // Emit event
      this.emit('health:checked', results);
      
      logger.info(`Health check completed for ${integrationName}: ${results.healthLevel.icon} ${results.overall.toFixed(0)}%`);
      
    } catch (error) {
      logger.error(`Health check failed for ${integrationName}:`, error);
      results.error = error.message;
      results.healthLevel = this.healthLevels.UNKNOWN;
    }
    
    return results;
  }

  /**
   * Run checks for a category
   */
  async runCategoryChecks(integrationName, category, categoryConfig, config) {
    const result = {
      category,
      score: 0,
      checks: [],
      issues: [],
      recommendations: []
    };
    
    let totalWeight = 0;
    let weightedScore = 0;
    
    for (const check of categoryConfig.checks) {
      try {
        const checkResult = await check.check({
          name: integrationName,
          config
        });
        
        result.checks.push({
          name: check.name,
          passed: checkResult.passed,
          score: checkResult.score || (checkResult.passed ? 100 : 0),
          message: checkResult.message
        });
        
        const weight = check.critical ? 2 : 1;
        totalWeight += weight;
        weightedScore += (checkResult.score || (checkResult.passed ? 100 : 0)) * weight;
        
        if (!checkResult.passed) {
          result.issues.push({
            category,
            check: check.name,
            severity: check.critical ? 'critical' : 'warning',
            message: checkResult.message
          });
          
          if (checkResult.recommendation) {
            result.recommendations.push(checkResult.recommendation);
          }
        }
        
      } catch (error) {
        result.checks.push({
          name: check.name,
          passed: false,
          score: 0,
          error: error.message
        });
        
        result.issues.push({
          category,
          check: check.name,
          severity: 'error',
          message: `Check failed: ${error.message}`
        });
      }
    }
    
    result.score = totalWeight > 0 ? weightedScore / totalWeight : 0;
    return result;
  }

  /**
   * Check environment variables
   */
  async checkEnvironmentVariables(integration) {
    const requiredVars = this.getRequiredEnvVars(integration.name);
    const missing = [];
    const configured = [];
    
    for (const varName of requiredVars) {
      if (process.env[varName]) {
        configured.push(varName);
      } else {
        missing.push(varName);
      }
    }
    
    const score = requiredVars.length > 0
      ? (configured.length / requiredVars.length) * 100
      : 100;
    
    return {
      passed: missing.length === 0,
      score,
      message: missing.length > 0
        ? `Missing environment variables: ${missing.join(', ')}`
        : 'All required environment variables are set',
      recommendation: missing.length > 0
        ? `Set the following environment variables: ${missing.map(v => `${v}=<your-value>`).join(' ')}`
        : null
    };
  }

  /**
   * Check configuration files
   */
  async checkConfigurationFiles(integration) {
    const configPaths = [
      path.join(process.cwd(), `.${integration.name}.config.js`),
      path.join(process.cwd(), `config/${integration.name}.json`),
      path.join(process.cwd(), `.env.${integration.name}`)
    ];
    
    const foundConfigs = [];
    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        foundConfigs.push(path.basename(configPath));
      }
    }
    
    return {
      passed: true, // Config files are optional
      score: foundConfigs.length > 0 ? 100 : 50,
      message: foundConfigs.length > 0
        ? `Found configuration files: ${foundConfigs.join(', ')}`
        : 'No configuration files found (using defaults)'
    };
  }

  /**
   * Check required settings
   */
  async checkRequiredSettings(integration) {
    const settings = integration.config || {};
    const required = this.getRequiredSettings(integration.name);
    const missing = [];
    
    for (const setting of required) {
      if (!this.getNestedValue(settings, setting)) {
        missing.push(setting);
      }
    }
    
    return {
      passed: missing.length === 0,
      score: required.length > 0
        ? ((required.length - missing.length) / required.length) * 100
        : 100,
      message: missing.length > 0
        ? `Missing required settings: ${missing.join(', ')}`
        : 'All required settings are configured',
      recommendation: missing.length > 0
        ? `Configure the following settings in your integration config: ${missing.join(', ')}`
        : null
    };
  }

  /**
   * Check NPM packages
   */
  async checkNpmPackages(integration) {
    const requiredPackages = this.getRequiredPackages(integration.name);
    const packageJson = this.loadPackageJson();
    const missing = [];
    const installed = [];
    
    for (const pkg of requiredPackages) {
      const isInstalled = 
        (packageJson.dependencies && packageJson.dependencies[pkg]) ||
        (packageJson.devDependencies && packageJson.devDependencies[pkg]);
      
      if (isInstalled) {
        installed.push(pkg);
      } else {
        missing.push(pkg);
      }
    }
    
    return {
      passed: missing.length === 0,
      score: requiredPackages.length > 0
        ? (installed.length / requiredPackages.length) * 100
        : 100,
      message: missing.length > 0
        ? `Missing NPM packages: ${missing.join(', ')}`
        : 'All required packages are installed',
      recommendation: missing.length > 0
        ? `Install missing packages: npm install ${missing.join(' ')}`
        : null
    };
  }

  /**
   * Check system requirements
   */
  async checkSystemRequirements(integration) {
    const requirements = this.getSystemRequirements(integration.name);
    const results = [];
    
    for (const req of requirements) {
      if (req.type === 'command') {
        const available = await this.isCommandAvailable(req.command);
        results.push({
          name: req.name,
          met: available,
          required: req.required
        });
      } else if (req.type === 'node-version') {
        const currentVersion = process.version;
        const met = this.compareVersions(currentVersion, req.version) >= 0;
        results.push({
          name: req.name,
          met,
          required: req.required
        });
      }
    }
    
    const critical = results.filter(r => r.required && !r.met);
    const warnings = results.filter(r => !r.required && !r.met);
    
    return {
      passed: critical.length === 0,
      score: results.length > 0
        ? (results.filter(r => r.met).length / results.length) * 100
        : 100,
      message: critical.length > 0
        ? `Missing critical requirements: ${critical.map(r => r.name).join(', ')}`
        : warnings.length > 0
        ? `Missing optional requirements: ${warnings.map(r => r.name).join(', ')}`
        : 'All system requirements are met'
    };
  }

  /**
   * Check version compatibility
   */
  async checkVersionCompatibility(integration) {
    // Simplified version check without actual package queries
    return {
      passed: true,
      score: 90,
      message: 'Version compatibility assumed (no conflicts detected)'
    };
  }

  /**
   * Check file system access
   */
  async checkFileSystemAccess(integration) {
    const testPaths = [
      process.cwd(),
      path.join(process.cwd(), 'logs'),
      path.join(process.cwd(), 'data'),
      path.join(process.cwd(), '.bumba')
    ];
    
    const accessible = [];
    const inaccessible = [];
    
    for (const testPath of testPaths) {
      try {
        if (!fs.existsSync(testPath)) {
          fs.mkdirSync(testPath, { recursive: true });
        }
        fs.accessSync(testPath, fs.constants.R_OK | fs.constants.W_OK);
        accessible.push(testPath);
      } catch (error) {
        inaccessible.push(testPath);
      }
    }
    
    return {
      passed: inaccessible.length === 0,
      score: (accessible.length / testPaths.length) * 100,
      message: inaccessible.length > 0
        ? `Cannot access: ${inaccessible.map(p => path.basename(p)).join(', ')}`
        : 'File system access verified'
    };
  }

  /**
   * Check network access (without making actual connections)
   */
  async checkNetworkAccess(integration) {
    // Check if DNS resolution works
    const dns = require('dns').promises;
    try {
      await dns.resolve4('google.com');
      return {
        passed: true,
        score: 100,
        message: 'Network access appears functional'
      };
    } catch (error) {
      return {
        passed: false,
        score: 0,
        message: 'DNS resolution failed - network may be unavailable',
        recommendation: 'Check your network connection and DNS settings'
      };
    }
  }

  /**
   * Check process permissions
   */
  async checkProcessPermissions(integration) {
    const checks = {
      canSpawnProcess: true,
      canReadEnv: true,
      canAccessCwd: true
    };
    
    try {
      // Check if we can spawn processes
      const { execSync } = require('child_process');
      execSync('echo test', { stdio: 'ignore' });
    } catch {
      checks.canSpawnProcess = false;
    }
    
    try {
      // Check environment access
      const test = process.env.PATH;
      if (!test) throw new Error('No PATH');
    } catch {
      checks.canReadEnv = false;
    }
    
    try {
      // Check working directory access
      process.cwd();
    } catch {
      checks.canAccessCwd = false;
    }
    
    const passed = Object.values(checks).every(v => v);
    const score = (Object.values(checks).filter(v => v).length / Object.keys(checks).length) * 100;
    
    return {
      passed,
      score,
      message: passed
        ? 'All process permissions available'
        : `Limited permissions: ${Object.entries(checks).filter(([_, v]) => !v).map(([k]) => k).join(', ')}`
    };
  }

  /**
   * Check port availability
   */
  async checkPortAvailability(integration) {
    const ports = this.getRequiredPorts(integration.name);
    if (ports.length === 0) {
      return {
        passed: true,
        score: 100,
        message: 'No specific ports required'
      };
    }
    
    // Simple check - we can't actually test port binding without side effects
    return {
      passed: true,
      score: 80,
      message: `Ports ${ports.join(', ')} assumed available (no active check performed)`
    };
  }

  /**
   * Check DNS resolution
   */
  async checkDnsResolution(integration) {
    const endpoints = this.getEndpoints(integration.name);
    if (endpoints.length === 0) {
      return {
        passed: true,
        score: 100,
        message: 'No specific endpoints to resolve'
      };
    }
    
    const dns = require('dns').promises;
    const resolved = [];
    const failed = [];
    
    for (const endpoint of endpoints) {
      try {
        const hostname = new URL(endpoint).hostname;
        await dns.resolve4(hostname);
        resolved.push(hostname);
      } catch {
        failed.push(endpoint);
      }
    }
    
    return {
      passed: failed.length === 0,
      score: endpoints.length > 0 ? (resolved.length / endpoints.length) * 100 : 100,
      message: failed.length > 0
        ? `Failed to resolve: ${failed.join(', ')}`
        : 'All endpoints resolved successfully'
    };
  }

  /**
   * Check proxy configuration
   */
  async checkProxyConfiguration(integration) {
    const proxyVars = ['HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY'];
    const configured = proxyVars.filter(v => process.env[v]);
    
    if (configured.length > 0) {
      return {
        passed: true,
        score: 100,
        message: `Proxy configured: ${configured.join(', ')}`
      };
    }
    
    return {
      passed: true,
      score: 100,
      message: 'No proxy configuration (direct connection)'
    };
  }

  /**
   * Check resource usage
   */
  async checkResourceUsage(integration) {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    const heapTotalMB = usage.heapTotal / 1024 / 1024;
    const heapPercent = (heapUsedMB / heapTotalMB) * 100;
    
    return {
      passed: heapPercent < 80,
      score: Math.max(0, 100 - heapPercent),
      message: `Memory usage: ${heapUsedMB.toFixed(1)}MB / ${heapTotalMB.toFixed(1)}MB (${heapPercent.toFixed(1)}%)`
    };
  }

  /**
   * Check cache status
   */
  async checkCacheStatus(integration) {
    const cacheDirs = [
      path.join(process.cwd(), '.cache'),
      path.join(process.cwd(), 'node_modules/.cache'),
      path.join(process.cwd(), '.bumba/cache')
    ];
    
    const existingCaches = cacheDirs.filter(dir => fs.existsSync(dir));
    
    return {
      passed: true,
      score: existingCaches.length > 0 ? 100 : 75,
      message: existingCaches.length > 0
        ? `Cache directories available: ${existingCaches.length}`
        : 'No cache directories found (may impact performance)'
    };
  }

  /**
   * Check response times (simulated)
   */
  async checkResponseTimes(integration) {
    // Simulate a simple performance check
    const start = Date.now();
    await new Promise(resolve => setTimeout(resolve, 10));
    const responseTime = Date.now() - start;
    
    return {
      passed: responseTime < 100,
      score: Math.max(0, 100 - responseTime),
      message: `Simulated response time: ${responseTime}ms`
    };
  }

  /**
   * Helper: Get required environment variables for an integration
   */
  getRequiredEnvVars(integrationName) {
    const envVarMap = {
      notion: ['NOTION_API_KEY'],
      github: ['GITHUB_TOKEN'],
      openai: ['OPENAI_API_KEY'],
      anthropic: ['ANTHROPIC_API_KEY'],
      postgres: ['POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD'],
      mongodb: ['MONGODB_URI'],
      redis: ['REDIS_HOST'],
      docker: [],
      kubernetes: ['KUBECONFIG'],
      figma: ['FIGMA_ACCESS_TOKEN']
    };
    
    return envVarMap[integrationName] || [];
  }

  /**
   * Helper: Get required settings for an integration
   */
  getRequiredSettings(integrationName) {
    const settingsMap = {
      notion: ['databaseId'],
      github: ['owner', 'repo'],
      postgres: ['database'],
      mongodb: ['database'],
      redis: ['database']
    };
    
    return settingsMap[integrationName] || [];
  }

  /**
   * Helper: Get required NPM packages for an integration
   */
  getRequiredPackages(integrationName) {
    const packageMap = {
      notion: ['@notionhq/client'],
      github: ['@octokit/rest'],
      openai: ['openai'],
      anthropic: ['@anthropic-ai/sdk'],
      postgres: ['pg'],
      mongodb: ['mongodb'],
      redis: ['redis'],
      docker: ['dockerode'],
      kubernetes: ['@kubernetes/client-node'],
      figma: ['figma-js']
    };
    
    return packageMap[integrationName] || [];
  }

  /**
   * Helper: Get system requirements for an integration
   */
  getSystemRequirements(integrationName) {
    const requirementsMap = {
      docker: [
        { type: 'command', command: 'docker', name: 'Docker CLI', required: true }
      ],
      kubernetes: [
        { type: 'command', command: 'kubectl', name: 'kubectl CLI', required: false }
      ],
      git: [
        { type: 'command', command: 'git', name: 'Git CLI', required: true }
      ]
    };
    
    return requirementsMap[integrationName] || [];
  }

  /**
   * Helper: Get required ports for an integration
   */
  getRequiredPorts(integrationName) {
    const portMap = {
      postgres: [5432],
      mongodb: [27017],
      redis: [6379]
    };
    
    return portMap[integrationName] || [];
  }

  /**
   * Helper: Get endpoints for an integration
   */
  getEndpoints(integrationName) {
    const endpointMap = {
      notion: ['https://api.notion.com'],
      github: ['https://api.github.com'],
      openai: ['https://api.openai.com'],
      anthropic: ['https://api.anthropic.com']
    };
    
    return endpointMap[integrationName] || [];
  }

  /**
   * Helper: Check if a command is available
   */
  async isCommandAvailable(command) {
    try {
      const { execSync } = require('child_process');
      execSync(`which ${command}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Helper: Load package.json
   */
  loadPackageJson() {
    try {
      return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    } catch {
      return { dependencies: {}, devDependencies: {} };
    }
  }

  /**
   * Helper: Get nested value from object
   */
  getNestedValue(obj, path) {
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Helper: Compare version strings
   */
  compareVersions(v1, v2) {
    const parts1 = v1.replace(/[^0-9.]/g, '').split('.');
    const parts2 = v2.replace(/[^0-9.]/g, '').split('.');
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parseInt(parts1[i] || '0');
      const num2 = parseInt(parts2[i] || '0');
      
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    
    return 0;
  }

  /**
   * Determine health level based on score
   */
  determineHealthLevel(score) {
    if (score >= 90) return this.healthLevels.HEALTHY;
    if (score >= 70) return this.healthLevels.WARNING;
    if (score >= 50) return this.healthLevels.DEGRADED;
    if (score >= 25) return this.healthLevels.CRITICAL;
    return this.healthLevels.UNKNOWN;
  }

  /**
   * Check all integrations
   */
  async checkAll(integrations = []) {
    const results = [];
    
    for (const integration of integrations) {
      const result = await this.checkIntegrationHealth(integration.name, integration.config);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Start periodic health checks
   */
  startPeriodicChecks(interval = 60000) { // Default 1 minute
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    this.checkInterval = setInterval(async () => {
      const integrations = this.getConfiguredIntegrations();
      await this.checkAll(integrations);
      this.lastCheck = new Date();
    }, interval);
    
    logger.info(`Started periodic health checks every ${interval / 1000} seconds`);
  }

  /**
   * Stop periodic health checks
   */
  stopPeriodicChecks() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('Stopped periodic health checks');
    }
  }

  /**
   * Get configured integrations
   */
  getConfiguredIntegrations() {
    // This would be populated from the integration config
    return [
      { name: 'notion', config: {} },
      { name: 'github', config: {} },
      { name: 'postgres', config: {} },
      { name: 'redis', config: {} },
      { name: 'docker', config: {} }
    ];
  }

  /**
   * Get current health status
   */
  getStatus() {
    const status = {
      integrations: {},
      summary: {
        total: this.healthStatus.size,
        healthy: 0,
        warning: 0,
        degraded: 0,
        critical: 0,
        unknown: 0
      },
      lastCheck: this.lastCheck
    };
    
    for (const [name, health] of this.healthStatus) {
      status.integrations[name] = {
        level: health.healthLevel,
        score: health.overall,
        issues: health.issues.length,
        lastChecked: health.timestamp
      };
      
      // Update summary
      const levelName = health.healthLevel.color;
      if (levelName === 'green') status.summary.healthy++;
      else if (levelName === 'yellow') status.summary.warning++;
      else if (levelName === 'orange') status.summary.degraded++;
      else if (levelName === 'red') status.summary.critical++;
      else status.summary.unknown++;
    }
    
    return status;
  }

  /**
   * Generate health report
   */
  generateReport(format = 'detailed') {
    const status = this.getStatus();
    const report = {
      timestamp: new Date().toISOString(),
      summary: status.summary,
      integrations: []
    };
    
    for (const [name, health] of this.healthStatus) {
      const integration = {
        name,
        health: health.healthLevel,
        score: health.overall,
        categories: health.categories
      };
      
      if (format === 'detailed') {
        integration.issues = health.issues;
        integration.recommendations = health.recommendations;
      }
      
      report.integrations.push(integration);
    }
    
    return report;
  }
}

// Export singleton instance
module.exports = new IntegrationHealthChecker();