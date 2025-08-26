/**
 * BUMBA Generic Dashboard Data Source
 * Adapter for connecting any existing dashboard to unified system
 * 
 * Handles the remaining dashboard sources generically
 */

const { DataSourceInterface, MetricCollection, MetricTypes } = require('../dashboard-interfaces');
const { logger } = require('../../logging/bumba-logger');

/**
 * Generic dashboard data source adapter
 */
class GenericDashboardSource extends DataSourceInterface {
  constructor(name, dashboard, options = {}) {
    super(name, options.category || 'generic');
    this.dashboard = dashboard;
    this.options = {
      getMetrics: options.getMetrics || 'getMetrics',
      getStatus: options.getStatus || 'getStatus',
      getData: options.getData || 'getData',
      ...options
    };
  }
  
  /**
   * Connect to the data source
   */
  async connect() {
    try {
      if (!this.dashboard) {
        throw new Error(`${this.name} dashboard not provided`);
      }
      
      this.connected = true;
      this.lastUpdate = Date.now();
      
      logger.debug(`${this.name} dashboard source connected`);
      return true;
    } catch (error) {
      this.errorCount++;
      logger.error(`Failed to connect ${this.name} source:`, error);
      throw error;
    }
  }
  
  /**
   * Collect current metrics from dashboard
   */
  async collect() {
    try {
      if (!this.connected) {
        await this.connect();
      }
      
      // Try different method names to get data
      let data = null;
      
      // Try the configured method name
      if (typeof this.dashboard[this.options.getMetrics] === 'function') {
        data = await this.dashboard[this.options.getMetrics]();
      } else if (typeof this.dashboard[this.options.getStatus] === 'function') {
        data = await this.dashboard[this.options.getStatus]();
      } else if (typeof this.dashboard[this.options.getData] === 'function') {
        data = await this.dashboard[this.options.getData]();
      } else if (typeof this.dashboard.getMetrics === 'function') {
        data = await this.dashboard.getMetrics();
      } else if (typeof this.dashboard.getStatus === 'function') {
        data = await this.dashboard.getStatus();
      } else if (typeof this.dashboard.getData === 'function') {
        data = await this.dashboard.getData();
      } else {
        // Fallback to direct property access
        data = {
          stats: this.dashboard.stats || {},
          metrics: this.dashboard.metrics || {},
          status: this.dashboard.status || {},
          data: this.dashboard.data || {}
        };
      }
      
      this.lastUpdate = Date.now();
      
      return data || {};
    } catch (error) {
      this.errorCount++;
      logger.error(`Failed to collect ${this.name} metrics:`, error);
      // Return empty data instead of throwing
      return {};
    }
  }
  
  /**
   * Transform data to standard metric format
   */
  transform(data) {
    const collection = new MetricCollection(this.name);
    
    // Generic transformation - adapt any data structure
    this.transformObject(data, collection, '');
    
    // Add health status if not present
    if (!collection.metrics.has('healthy')) {
      collection.add('healthy', true, MetricTypes.STATUS, {
        description: `${this.name} health status`,
        severity: 'info'
      });
    }
    
    // Add connection status
    collection.add('connected', this.connected, MetricTypes.STATUS, {
      description: `${this.name} connection status`,
      severity: 'info'
    });
    
    return collection;
  }
  
  /**
   * Recursively transform object to metrics
   */
  transformObject(obj, collection, prefix = '') {
    if (!obj || typeof obj !== 'object') {
      return;
    }
    
    Object.entries(obj).forEach(([key, value]) => {
      const metricName = prefix ? `${prefix}.${key}` : key;
      
      // Skip undefined/null values
      if (value === undefined || value === null) {
        return;
      }
      
      // Handle different value types
      if (typeof value === 'number') {
        // Determine metric type based on name/value
        let type = MetricTypes.GAUGE;
        let unit = '';
        
        if (key.toLowerCase().includes('count') || key.toLowerCase().includes('total')) {
          type = MetricTypes.COUNTER;
          unit = 'items';
        } else if (key.toLowerCase().includes('rate')) {
          type = MetricTypes.RATE;
          unit = '/s';
        } else if (key.toLowerCase().includes('percent') || (value >= 0 && value <= 100)) {
          type = MetricTypes.PERCENTAGE;
          unit = '%';
        }
        
        collection.add(metricName, value, type, {
          unit,
          description: this.generateDescription(key),
          severity: 'info'
        });
      } else if (typeof value === 'boolean') {
        collection.add(metricName, value, MetricTypes.STATUS, {
          description: this.generateDescription(key),
          severity: 'info'
        });
      } else if (typeof value === 'string') {
        // Store as metadata
        collection.add(`${metricName}_info`, value, MetricTypes.GAUGE, {
          description: this.generateDescription(key),
          severity: 'info',
          metadata: { value }
        });
      } else if (Array.isArray(value)) {
        // Store array length and optionally the list
        collection.add(`${metricName}_count`, value.length, MetricTypes.GAUGE, {
          unit: 'items',
          description: `Count of ${key}`,
          severity: 'info'
        });
        
        if (value.length > 0 && value.length <= 10) {
          collection.add(metricName, value, MetricTypes.LIST, {
            description: this.generateDescription(key),
            severity: 'info'
          });
        }
      } else if (typeof value === 'object') {
        // Recurse for nested objects (but limit depth)
        if (prefix.split('.').length < 3) {
          this.transformObject(value, collection, metricName);
        } else {
          // Too deep, just count keys
          collection.add(`${metricName}_keys`, Object.keys(value).length, MetricTypes.GAUGE, {
            unit: 'keys',
            description: `Keys in ${key}`,
            severity: 'info'
          });
        }
      }
    });
  }
  
  /**
   * Generate human-readable description from key
   */
  generateDescription(key) {
    // Convert camelCase/snake_case to readable text
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase());
  }
}

module.exports = GenericDashboardSource;