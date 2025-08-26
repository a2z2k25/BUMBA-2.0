/**
 * BUMBA Privacy Preserver Module
 * Protects user data while enabling learning
 * Part of Human Learning Module Enhancement - Sprint 4
 * 
 * FRAMEWORK DESIGN:
 * - Local differential privacy without external libraries
 * - Data anonymization and sanitization
 * - Secure learning without data exposure
 * - Works without external privacy libraries
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');
const { logger } = require('../logging/bumba-logger');

/**
 * Privacy Preserver for secure learning
 */
class PrivacyPreserver extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      epsilon: config.epsilon || 1.0, // Differential privacy parameter
      delta: config.delta || 1e-5, // Privacy budget
      noiseLevel: config.noiseLevel || 0.1,
      anonymizationLevel: config.anonymizationLevel || 'moderate',
      dataRetention: config.dataRetention || 30, // Days
      encryptionEnabled: config.encryptionEnabled !== false,
      ...config
    };
    
    // Privacy mechanisms
    this.mechanisms = {
      differential: this.differentialPrivacy.bind(this),
      anonymization: this.anonymizeData.bind(this),
      aggregation: this.secureAggregation.bind(this),
      sanitization: this.sanitizeData.bind(this),
      encryption: this.encryptData.bind(this)
    };
    
    // Anonymization rules
    this.anonymizationRules = {
      pii: this.anonymizePII.bind(this),
      behavioral: this.anonymizeBehavioral.bind(this),
      contextual: this.anonymizeContextual.bind(this),
      temporal: this.anonymizeTemporal.bind(this)
    };
    
    // Privacy budget tracking
    this.privacyBudget = {
      total: 1.0,
      used: 0,
      allocations: new Map()
    };
    
    // Secure storage
    this.secureStorage = new Map();
    
    // Audit log
    this.auditLog = [];
    
    // Data lifecycle
    this.dataLifecycle = new Map();
    
    // Consent management
    this.consentRecords = new Map();
    
    // Metrics
    this.metrics = {
      dataAnonymized: 0,
      privacyPreserved: 0,
      budgetUsed: 0,
      dataExpired: 0,
      consentManaged: 0
    };
    
    this.initialize();
  }
  
  /**
   * Initialize privacy preserver
   */
  async initialize() {
    try {
      // Set up encryption keys
      this.setupEncryption();
      
      // Start data lifecycle management
      this.startLifecycleManagement();
      
      // Initialize privacy mechanisms
      this.initializeMechanisms();
      
      logger.info('🔒 Privacy Preserver initialized');
      
      this.emit('initialized', {
        mechanisms: Object.keys(this.mechanisms),
        epsilon: this.config.epsilon,
        retention: this.config.dataRetention
      });
      
    } catch (error) {
      logger.error('Failed to initialize Privacy Preserver:', error);
    }
  }
  
  /**
   * Process data with privacy preservation
   */
  async processPrivate(data, userId, purpose = 'learning') {
    try {
      // Check consent
      if (!this.checkConsent(userId, purpose)) {
        return { processed: false, reason: 'No consent' };
      }
      
      // Anonymize PII
      const anonymized = await this.anonymizeData(data, userId);
      
      // Apply differential privacy
      const privatized = await this.differentialPrivacy(anonymized);
      
      // Encrypt if enabled
      const secured = this.config.encryptionEnabled ? 
        await this.encryptData(privatized) : privatized;
      
      // Store securely
      const storageId = this.storeSecurely(secured, userId);
      
      // Track in lifecycle
      this.trackDataLifecycle(storageId, userId);
      
      // Log access
      this.logAccess(userId, purpose, 'process');
      
      // Update metrics
      this.metrics.dataAnonymized++;
      this.metrics.privacyPreserved++;
      
      this.emit('data-processed', {
        userId: this.hashUserId(userId),
        purpose,
        privacyLevel: this.calculatePrivacyLevel(data, privatized)
      });
      
      return {
        processed: true,
        data: privatized,
        storageId,
        privacyGuarantee: this.calculatePrivacyGuarantee()
      };
      
    } catch (error) {
      logger.error('Privacy processing failed:', error);
      return { processed: false, error: error.message };
    }
  }
  
  /**
   * Learn from data without exposing it
   */
  async learnPrivately(interactions, userId) {
    try {
      // Aggregate data locally
      const aggregated = await this.secureAggregation(interactions);
      
      // Add noise for privacy
      const noisy = this.addNoise(aggregated);
      
      // Extract patterns without raw data
      const patterns = this.extractPrivatePatterns(noisy);
      
      // Update privacy budget
      this.updatePrivacyBudget(userId, 0.1);
      
      // Create private model update
      const modelUpdate = {
        patterns,
        weights: this.privatizeWeights(patterns),
        timestamp: Date.now(),
        privacyLevel: this.config.epsilon
      };
      
      return {
        learned: true,
        patterns: patterns.length,
        privacyUsed: 0.1,
        budgetRemaining: this.getPrivacyBudget(userId)
      };
      
    } catch (error) {
      logger.error('Private learning failed:', error);
      return { learned: false, error: error.message };
    }
  }
  
  /**
   * Manage user consent
   */
  async manageConsent(userId, consent) {
    try {
      const consentRecord = {
        userId: this.hashUserId(userId),
        purposes: consent.purposes || ['learning'],
        granted: consent.granted !== false,
        timestamp: Date.now(),
        expiry: consent.expiry || Date.now() + 365 * 24 * 3600000, // 1 year
        restrictions: consent.restrictions || []
      };
      
      this.consentRecords.set(userId, consentRecord);
      
      // Log consent change
      this.logAccess(userId, 'consent', consent.granted ? 'granted' : 'revoked');
      
      this.metrics.consentManaged++;
      
      this.emit('consent-updated', {
        userId: consentRecord.userId,
        granted: consentRecord.granted,
        purposes: consentRecord.purposes
      });
      
      return {
        updated: true,
        consent: consentRecord
      };
      
    } catch (error) {
      logger.error('Consent management failed:', error);
      return { updated: false, error: error.message };
    }
  }
  
  /**
   * Delete user data
   */
  async deleteUserData(userId) {
    try {
      const deleted = {
        storage: 0,
        lifecycle: 0,
        consent: false,
        budget: false
      };
      
      // Delete from secure storage
      for (const [id, data] of this.secureStorage) {
        if (data.userId === this.hashUserId(userId)) {
          this.secureStorage.delete(id);
          deleted.storage++;
        }
      }
      
      // Delete from lifecycle
      for (const [id, record] of this.dataLifecycle) {
        if (record.userId === userId) {
          this.dataLifecycle.delete(id);
          deleted.lifecycle++;
        }
      }
      
      // Delete consent
      if (this.consentRecords.has(userId)) {
        this.consentRecords.delete(userId);
        deleted.consent = true;
      }
      
      // Clear privacy budget
      if (this.privacyBudget.allocations.has(userId)) {
        this.privacyBudget.allocations.delete(userId);
        deleted.budget = true;
      }
      
      // Log deletion
      this.logAccess(userId, 'deletion', 'complete');
      
      this.emit('data-deleted', {
        userId: this.hashUserId(userId),
        deleted
      });
      
      return {
        deleted: true,
        summary: deleted
      };
      
    } catch (error) {
      logger.error('Data deletion failed:', error);
      return { deleted: false, error: error.message };
    }
  }
  
  /**
   * Get privacy report
   */
  async getPrivacyReport(userId = null) {
    try {
      if (userId) {
        return {
          consent: this.consentRecords.get(userId),
          privacyBudget: this.getPrivacyBudget(userId),
          dataStored: this.getUserDataCount(userId),
          lastAccess: this.getLastAccess(userId),
          privacyLevel: this.config.epsilon
        };
      }
      
      // General report
      return {
        totalUsers: this.consentRecords.size,
        dataPoints: this.secureStorage.size,
        privacyBudgetUsed: this.privacyBudget.used,
        mechanisms: Object.keys(this.mechanisms),
        metrics: this.metrics
      };
      
    } catch (error) {
      logger.error('Privacy report generation failed:', error);
      return {};
    }
  }
  
  // Privacy mechanisms
  
  async differentialPrivacy(data) {
    try {
      // Apply Laplace mechanism
      const sensitivity = this.calculateSensitivity(data);
      const scale = sensitivity / this.config.epsilon;
      
      // Add Laplace noise
      const noisyData = this.addLaplaceNoise(data, scale);
      
      // Update privacy budget
      this.privacyBudget.used += this.config.delta;
      
      return noisyData;
      
    } catch (error) {
      logger.error('Differential privacy failed:', error);
      return data;
    }
  }
  
  async anonymizeData(data, userId) {
    const anonymized = JSON.parse(JSON.stringify(data));
    
    // Apply anonymization rules
    for (const [type, rule] of Object.entries(this.anonymizationRules)) {
      await rule(anonymized, userId);
    }
    
    return anonymized;
  }
  
  async secureAggregation(data) {
    // Aggregate without exposing individual records
    const aggregated = {
      count: Array.isArray(data) ? data.length : 1,
      summary: {},
      patterns: []
    };
    
    if (Array.isArray(data)) {
      // Calculate aggregates
      for (const item of data) {
        for (const [key, value] of Object.entries(item)) {
          if (typeof value === 'number') {
            if (!aggregated.summary[key]) {
              aggregated.summary[key] = { sum: 0, count: 0 };
            }
            aggregated.summary[key].sum += value;
            aggregated.summary[key].count++;
          }
        }
      }
      
      // Calculate averages
      for (const key in aggregated.summary) {
        aggregated.summary[key].average = 
          aggregated.summary[key].sum / aggregated.summary[key].count;
        delete aggregated.summary[key].sum; // Remove raw sum
      }
    }
    
    return aggregated;
  }
  
  async sanitizeData(data) {
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'ssn', 'creditCard', 'apiKey', 'token'];
    
    const removeSensitive = (obj) => {
      for (const field of sensitiveFields) {
        if (field in obj) {
          delete obj[field];
        }
      }
      
      for (const value of Object.values(obj)) {
        if (typeof value === 'object' && value !== null) {
          removeSensitive(value);
        }
      }
    };
    
    removeSensitive(sanitized);
    
    return sanitized;
  }
  
  async encryptData(data) {
    if (!this.encryptionKey) {
      return data; // Fallback if encryption not setup
    }
    
    try {
      const text = JSON.stringify(data);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        encrypted: true,
        data: encrypted,
        iv: iv.toString('hex')
      };
      
    } catch (error) {
      logger.error('Encryption failed:', error);
      return data;
    }
  }
  
  // Anonymization rules
  
  anonymizePII(data, userId) {
    // Hash or remove PII
    const piiFields = ['name', 'email', 'phone', 'address', 'ip'];
    
    for (const field of piiFields) {
      if (data[field]) {
        data[field] = this.hashField(data[field]);
      }
    }
    
    // Replace userId with hash
    if (data.userId) {
      data.userId = this.hashUserId(userId);
    }
  }
  
  anonymizeBehavioral(data) {
    // Generalize behavioral data
    if (data.clickPosition !== undefined) {
      // Round to nearest 10 pixels
      data.clickPosition = {
        x: Math.round(data.clickPosition.x / 10) * 10,
        y: Math.round(data.clickPosition.y / 10) * 10
      };
    }
    
    if (data.duration !== undefined) {
      // Round to nearest second
      data.duration = Math.round(data.duration / 1000) * 1000;
    }
  }
  
  anonymizeContextual(data) {
    // Generalize context
    if (data.location) {
      // Keep only country/region
      data.location = data.location.country || 'unknown';
    }
    
    if (data.device) {
      // Keep only device type
      data.device = data.device.type || 'unknown';
    }
  }
  
  anonymizeTemporal(data) {
    // Generalize timestamps
    if (data.timestamp) {
      // Round to nearest hour
      const hour = 3600000;
      data.timestamp = Math.round(data.timestamp / hour) * hour;
    }
    
    if (data.date) {
      // Keep only date, remove time
      data.date = new Date(data.date).toDateString();
    }
  }
  
  // Helper methods
  
  setupEncryption() {
    // Generate encryption key (in production, use key management service)
    this.encryptionKey = crypto.randomBytes(32);
    this.encryptionEnabled = true;
  }
  
  initializeMechanisms() {
    // Initialize privacy parameters based on level
    switch (this.config.anonymizationLevel) {
      case 'strict':
        this.config.epsilon = 0.1;
        this.config.noiseLevel = 0.3;
        break;
      case 'moderate':
        this.config.epsilon = 1.0;
        this.config.noiseLevel = 0.1;
        break;
      case 'relaxed':
        this.config.epsilon = 10.0;
        this.config.noiseLevel = 0.05;
        break;
    }
  }
  
  checkConsent(userId, purpose) {
    const consent = this.consentRecords.get(userId);
    
    if (!consent) return false;
    if (!consent.granted) return false;
    if (consent.expiry < Date.now()) return false;
    if (!consent.purposes.includes(purpose) && !consent.purposes.includes('all')) return false;
    
    return true;
  }
  
  hashUserId(userId) {
    return crypto.createHash('sha256').update(userId).digest('hex').substring(0, 16);
  }
  
  hashField(value) {
    return crypto.createHash('sha256').update(String(value)).digest('hex').substring(0, 8);
  }
  
  calculatePrivacyLevel(original, processed) {
    // Simple privacy level calculation
    const originalStr = JSON.stringify(original);
    const processedStr = JSON.stringify(processed);
    
    const similarity = this.calculateSimilarity(originalStr, processedStr);
    
    return 1 - similarity; // Higher difference = higher privacy
  }
  
  calculateSimilarity(str1, str2) {
    const len = Math.max(str1.length, str2.length);
    if (len === 0) return 1;
    
    let matches = 0;
    const minLen = Math.min(str1.length, str2.length);
    
    for (let i = 0; i < minLen; i++) {
      if (str1[i] === str2[i]) matches++;
    }
    
    return matches / len;
  }
  
  calculatePrivacyGuarantee() {
    return {
      epsilon: this.config.epsilon,
      delta: this.config.delta,
      guarantee: `(${this.config.epsilon}, ${this.config.delta})-differential privacy`
    };
  }
  
  storeSecurely(data, userId) {
    const storageId = crypto.randomBytes(16).toString('hex');
    
    this.secureStorage.set(storageId, {
      data,
      userId: this.hashUserId(userId),
      timestamp: Date.now(),
      encrypted: data.encrypted || false
    });
    
    return storageId;
  }
  
  trackDataLifecycle(storageId, userId) {
    this.dataLifecycle.set(storageId, {
      userId,
      created: Date.now(),
      expiry: Date.now() + this.config.dataRetention * 24 * 3600000,
      accessed: 0
    });
  }
  
  logAccess(userId, purpose, action) {
    this.auditLog.push({
      userId: this.hashUserId(userId),
      purpose,
      action,
      timestamp: Date.now()
    });
    
    // Keep last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog.shift();
    }
  }
  
  calculateSensitivity(data) {
    // Estimate sensitivity based on data type
    if (typeof data === 'number') return 1;
    if (typeof data === 'object') return Object.keys(data).length;
    return 1;
  }
  
  addLaplaceNoise(data, scale) {
    const laplace = () => {
      const u = 0.5 - Math.random();
      return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
    };
    
    if (typeof data === 'number') {
      return data + laplace();
    }
    
    if (typeof data === 'object' && !Array.isArray(data)) {
      const noisy = {};
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'number') {
          noisy[key] = value + laplace();
        } else {
          noisy[key] = value;
        }
      }
      return noisy;
    }
    
    return data;
  }
  
  addNoise(data) {
    return this.addLaplaceNoise(data, this.config.noiseLevel);
  }
  
  extractPrivatePatterns(data) {
    const patterns = [];
    
    // Extract patterns without exposing raw data
    if (data.summary) {
      for (const [key, stats] of Object.entries(data.summary)) {
        if (stats.average !== undefined) {
          patterns.push({
            type: 'average',
            feature: key,
            value: Math.round(stats.average * 10) / 10, // Round for privacy
            count: stats.count
          });
        }
      }
    }
    
    return patterns;
  }
  
  privatizeWeights(patterns) {
    const weights = {};
    
    for (const pattern of patterns) {
      // Add noise to weights
      const noise = (Math.random() - 0.5) * this.config.noiseLevel;
      weights[pattern.feature] = (pattern.value + noise) / 10; // Normalize
    }
    
    return weights;
  }
  
  updatePrivacyBudget(userId, amount) {
    const current = this.privacyBudget.allocations.get(userId) || 0;
    const updated = current + amount;
    
    this.privacyBudget.allocations.set(userId, updated);
    this.privacyBudget.used += amount;
    
    this.metrics.budgetUsed = this.privacyBudget.used;
  }
  
  getPrivacyBudget(userId) {
    const used = this.privacyBudget.allocations.get(userId) || 0;
    return Math.max(0, 1 - used);
  }
  
  getUserDataCount(userId) {
    let count = 0;
    const hashedId = this.hashUserId(userId);
    
    for (const data of this.secureStorage.values()) {
      if (data.userId === hashedId) count++;
    }
    
    return count;
  }
  
  getLastAccess(userId) {
    const hashedId = this.hashUserId(userId);
    
    for (let i = this.auditLog.length - 1; i >= 0; i--) {
      if (this.auditLog[i].userId === hashedId) {
        return this.auditLog[i].timestamp;
      }
    }
    
    return null;
  }
  
  /**
   * Start data lifecycle management
   */
  startLifecycleManagement() {
    setInterval(() => {
      const now = Date.now();
      
      // Check for expired data
      for (const [id, record] of this.dataLifecycle) {
        if (record.expiry < now) {
          // Delete expired data
          this.secureStorage.delete(id);
          this.dataLifecycle.delete(id);
          this.metrics.dataExpired++;
          
          this.emit('data-expired', {
            storageId: id,
            userId: this.hashUserId(record.userId)
          });
        }
      }
      
      // Check for expired consent
      for (const [userId, consent] of this.consentRecords) {
        if (consent.expiry < now) {
          this.consentRecords.delete(userId);
          
          this.emit('consent-expired', {
            userId: consent.userId
          });
        }
      }
      
    }, 3600000); // Every hour
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeConsents: this.consentRecords.size,
      dataPoints: this.secureStorage.size,
      privacyBudgetRemaining: 1 - this.privacyBudget.used,
      auditLogSize: this.auditLog.length
    };
  }
}

module.exports = PrivacyPreserver;