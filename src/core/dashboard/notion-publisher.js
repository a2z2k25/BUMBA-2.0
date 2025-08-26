/**
 * BUMBA Dashboard Notion Publisher
 * Handles publishing unified dashboard metrics to Notion
 * 
 * NO CREDENTIALS INCLUDED - Adopters must provide their own
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class NotionPublisher extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: process.env.NOTION_ENABLED === 'true',
      apiKey: process.env.NOTION_API_KEY,
      databaseId: process.env.NOTION_DATABASE_ID,
      workspaceId: process.env.NOTION_WORKSPACE_ID,
      autoPublish: process.env.NOTION_AUTO_PUBLISH !== 'false',
      publishInterval: parseInt(process.env.NOTION_PUBLISH_INTERVAL || '3600000'), // 1 hour default
      chartEmbedding: process.env.NOTION_CHART_EMBEDDING !== 'false',
      batchSize: parseInt(process.env.NOTION_BATCH_SIZE || '10'),
      ...config
    };
    
    this.state = {
      initialized: false,
      publishing: false,
      lastPublish: null,
      publishCount: 0,
      failureCount: 0,
      queuedMetrics: []
    };
    
    this.bridge = null;
    this.publishInterval = null;
    
    // Validate configuration
    this.validateConfig();
  }
  
  /**
   * Validate configuration without requiring credentials
   */
  validateConfig() {
    if (this.config.enabled) {
      if (!this.config.apiKey) {
        logger.warn('📝 Notion enabled but NOTION_API_KEY not set');
        logger.warn('   Add your Notion API key to .env file');
        logger.warn('   See: docs/NOTION_MCP_SETUP_FOR_ADOPTERS.md');
        this.config.enabled = false;
        return false;
      }
      
      if (!this.config.databaseId) {
        logger.warn('📝 Notion enabled but NOTION_DATABASE_ID not set');
        logger.warn('   Create a Notion database and add its ID to .env');
        this.config.enabled = false;
        return false;
      }
      
      logger.info('✅ Notion configuration validated');
      return true;
    }
    
    logger.info('ℹ️  Notion publishing disabled (set NOTION_ENABLED=true to enable)');
    return false;
  }
  
  /**
   * Initialize Notion connection
   */
  async initialize() {
    if (!this.config.enabled) {
      logger.debug('Notion publisher not enabled');
      return false;
    }
    
    try {
      // Get or create bridge
      const { NotionMCPBridge } = require('../mcp/notion-mcp-bridge');
      this.bridge = new NotionMCPBridge();
      
      // Wait for bridge to be ready
      await new Promise((resolve) => {
        this.bridge.once('ready', (status) => {
          logger.info(`📝 Notion publisher ready in ${status.mode} mode`);
          resolve();
        });
      });
      
      this.state.initialized = true;
      
      // Start auto-publishing if enabled
      if (this.config.autoPublish) {
        this.startAutoPublish();
      }
      
      this.emit('initialized');
      return true;
      
    } catch (error) {
      logger.error('Failed to initialize Notion publisher:', error);
      logger.info('💡 Tip: Check your Notion credentials in .env file');
      this.state.initialized = false;
      return false;
    }
  }
  
  /**
   * Publish metrics to Notion
   */
  async publish(metrics) {
    if (!this.state.initialized) {
      logger.debug('Notion publisher not initialized, queueing metrics');
      this.queueMetrics(metrics);
      return false;
    }
    
    if (this.state.publishing) {
      logger.debug('Already publishing, queueing metrics');
      this.queueMetrics(metrics);
      return false;
    }
    
    this.state.publishing = true;
    
    try {
      // Transform metrics for Notion
      const notionData = this.transformMetrics(metrics);
      
      // Publish in batches
      const results = await this.publishBatches(notionData);
      
      this.state.lastPublish = Date.now();
      this.state.publishCount++;
      
      logger.info(`📝 Published ${results.success} metrics to Notion`);
      
      this.emit('published', {
        metrics: results.success,
        timestamp: this.state.lastPublish
      });
      
      // Process queued metrics if any
      if (this.state.queuedMetrics.length > 0) {
        const queued = this.state.queuedMetrics.shift();
        setImmediate(() => this.publish(queued));
      }
      
      return true;
      
    } catch (error) {
      this.state.failureCount++;
      logger.error('Failed to publish to Notion:', error);
      
      // Provide helpful error messages
      if (error.message.includes('401')) {
        logger.error('❌ Invalid Notion API key. Check NOTION_API_KEY in .env');
      } else if (error.message.includes('404')) {
        logger.error('❌ Notion database not found. Check NOTION_DATABASE_ID in .env');
      }
      
      this.emit('error', error);
      return false;
      
    } finally {
      this.state.publishing = false;
    }
  }
  
  /**
   * Transform dashboard metrics to Notion format
   */
  transformMetrics(metrics) {
    const notionData = [];
    const timestamp = new Date().toISOString();
    
    // Helper to flatten nested metrics
    const flattenMetrics = (obj, prefix = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const metricName = prefix ? `${prefix}.${key}` : key;
        
        if (value && typeof value === 'object') {
          if (value.value !== undefined) {
            // It's a metric object
            notionData.push({
              name: metricName,
              value: value.value,
              type: value.type || 'gauge',
              unit: value.unit || '',
              description: value.description || '',
              category: prefix || 'general',
              severity: value.severity || 'info',
              timestamp
            });
          } else if (!Array.isArray(value)) {
            // Nested object, recurse
            flattenMetrics(value, metricName);
          }
        }
      });
    };
    
    // Process all metric categories
    flattenMetrics(metrics);
    
    return notionData;
  }
  
  /**
   * Publish metrics in batches
   */
  async publishBatches(notionData) {
    const results = { success: 0, failed: 0 };
    
    // Process in batches
    for (let i = 0; i < notionData.length; i += this.config.batchSize) {
      const batch = notionData.slice(i, i + this.config.batchSize);
      
      try {
        await this.publishBatch(batch);
        results.success += batch.length;
      } catch (error) {
        results.failed += batch.length;
        logger.error(`Failed to publish batch ${i / this.config.batchSize + 1}:`, error);
      }
    }
    
    return results;
  }
  
  /**
   * Publish a single batch of metrics
   */
  async publishBatch(batch) {
    if (!this.bridge) {
      throw new Error('Notion bridge not initialized');
    }
    
    // Create Notion pages for each metric
    const promises = batch.map(metric => 
      this.bridge.updateDashboard({
        parent: { database_id: this.config.databaseId },
        properties: {
          Name: { title: [{ text: { content: metric.name } }] },
          Value: { number: metric.value },
          Category: { select: { name: metric.category } },
          Type: { select: { name: metric.type } },
          Unit: { rich_text: [{ text: { content: metric.unit } }] },
          Description: { rich_text: [{ text: { content: metric.description } }] },
          Severity: { select: { name: metric.severity } },
          Timestamp: { date: { start: metric.timestamp } }
        }
      })
    );
    
    return Promise.all(promises);
  }
  
  /**
   * Queue metrics for later publishing
   */
  queueMetrics(metrics) {
    this.state.queuedMetrics.push(metrics);
    
    // Limit queue size
    if (this.state.queuedMetrics.length > 10) {
      this.state.queuedMetrics.shift();
      logger.warn('Notion publish queue full, dropping oldest metrics');
    }
  }
  
  /**
   * Start auto-publishing
   */
  startAutoPublish() {
    if (this.publishInterval) {
      return;
    }
    
    const intervalMinutes = Math.round(this.config.publishInterval / 60000);
    logger.info(`📝 Auto-publishing to Notion every ${intervalMinutes} minute${intervalMinutes !== 1 ? 's' : ''} (manual update: /bumba:notion:sync)`);
    
    this.publishInterval = setInterval(async () => {
      try {
        // Get latest metrics from dashboard
        const { getUnifiedDashboard } = require('./unified-dashboard-manager');
        const dashboard = getUnifiedDashboard();
        const metrics = dashboard.getMetrics();
        
        await this.publish(metrics);
      } catch (error) {
        logger.error('Auto-publish failed:', error);
      }
    }, this.config.publishInterval);
  }
  
  /**
   * Stop auto-publishing
   */
  stopAutoPublish() {
    if (this.publishInterval) {
      clearInterval(this.publishInterval);
      this.publishInterval = null;
      logger.info('📝 Auto-publishing stopped');
    }
  }
  
  /**
   * Get publisher status
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      initialized: this.state.initialized,
      mode: this.bridge ? this.bridge.getStatus().mode : 'disabled',
      publishing: this.state.publishing,
      autoPublish: !!this.publishInterval,
      lastPublish: this.state.lastPublish,
      publishCount: this.state.publishCount,
      failureCount: this.state.failureCount,
      queuedMetrics: this.state.queuedMetrics.length
    };
  }
  
  /**
   * Test connection without publishing
   */
  async testConnection() {
    if (!this.config.enabled) {
      return { success: false, message: 'Notion not enabled' };
    }
    
    if (!this.state.initialized) {
      await this.initialize();
    }
    
    try {
      // Try to fetch database info
      const result = await this.bridge.executeNotionOperation('getDatabaseInfo', {
        database_id: this.config.databaseId
      });
      
      return {
        success: true,
        message: 'Connection successful',
        mode: this.bridge.getStatus().mode,
        database: result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        mode: this.bridge ? this.bridge.getStatus().mode : 'unknown'
      };
    }
  }
  
  /**
   * Manually trigger a sync to Notion
   */
  async manualSync() {
    if (!this.config.enabled) {
      logger.warn('📝 Notion publishing is not enabled');
      return { success: false, message: 'Notion not enabled' };
    }
    
    if (!this.state.initialized) {
      logger.info('📝 Initializing Notion publisher for manual sync...');
      await this.initialize();
    }
    
    try {
      logger.info('📝 Starting manual sync to Notion...');
      
      // Get latest metrics from dashboard
      const { getUnifiedDashboard } = require('./unified-dashboard-manager');
      const dashboard = getUnifiedDashboard();
      const metrics = dashboard.getMetrics();
      
      const result = await this.publish(metrics);
      
      if (result) {
        const message = `Manual sync completed successfully at ${new Date().toLocaleTimeString()}`;
        logger.info(`✅ ${message}`);
        return { success: true, message };
      } else {
        return { success: false, message: 'Manual sync failed - check logs for details' };
      }
    } catch (error) {
      logger.error('Manual sync failed:', error);
      return { success: false, message: error.message };
    }
  }
  
  /**
   * Shutdown publisher
   */
  shutdown() {
    this.stopAutoPublish();
    this.state.queuedMetrics = [];
    this.emit('shutdown');
  }
}

// Singleton instance
let instance = null;

function getNotionPublisher(config) {
  if (!instance) {
    instance = new NotionPublisher(config);
  }
  return instance;
}

module.exports = {
  NotionPublisher,
  getNotionPublisher
};