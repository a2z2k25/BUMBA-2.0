/**
 * BUMBA Agent Identity System
 * Ensures every component that can modify files has a unique identity
 */

const crypto = require('crypto');
const { logger } = require('../logging/bumba-logger');

class AgentIdentitySystem {
  constructor() {
    this.agents = new Map(); // agentId -> metadata
    this.componentToAgent = new WeakMap(); // component -> agentId
    this.activeAgents = new Set();
    
    // Federation Support
    this.federation = this.initializeFederation();
    this.federatedAgents = new Map(); // federated agentId -> federation info
    this.trustRelationships = new Map(); // federation -> trust level
    
    // Advanced Authentication
    this.authentication = this.initializeAuthentication();
    this.sessions = new Map(); // sessionId -> session data
    this.permissions = new Map(); // agentId -> permissions
    
    // Enhanced Security
    this.securityPolicies = this.initializeSecurityPolicies();
    this.auditLog = [];
  }
  
  /**
   * Generate unique agent ID
   */
  generateAgentId(type, name) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `${type}-${name}-${timestamp}-${random}`;
  }
  
  /**
   * Register an agent/component
   */
  registerAgent(component, metadata = {}) {
    // Check if already registered
    if (this.componentToAgent.has(component)) {
      return this.componentToAgent.get(component);
    }
    
    // Generate ID based on component type
    const type = metadata.type || component.constructor.name || 'unknown';
    const name = metadata.name || component.name || 'anonymous';
    const agentId = this.generateAgentId(type, name);
    
    // Store metadata
    const agentData = {
      id: agentId,
      type: type,
      name: name,
      component: component.constructor.name,
      registeredAt: Date.now(),
      capabilities: metadata.capabilities || [],
      department: metadata.department || null,
      priority: metadata.priority || 0,
      status: 'active',
      ...metadata
    };
    
    this.agents.set(agentId, agentData);
    this.componentToAgent.set(component, agentId);
    this.activeAgents.add(agentId);
    
    logger.info(`🆔 Agent registered: ${agentId} (${type}:${name})`);
    
    return agentId;
  }
  
  /**
   * Get agent ID for a component
   */
  getAgentId(component) {
    if (this.componentToAgent.has(component)) {
      return this.componentToAgent.get(component);
    }
    
    // Auto-register if not registered
    return this.registerAgent(component);
  }
  
  /**
   * Get agent metadata
   */
  getAgentMetadata(agentId) {
    return this.agents.get(agentId);
  }
  
  /**
   * Update agent status
   */
  updateAgentStatus(agentId, status) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      agent.lastUpdate = Date.now();
      
      if (status === 'inactive') {
        this.activeAgents.delete(agentId);
      } else {
        this.activeAgents.add(agentId);
      }
      
      logger.info(`🟢 Agent ${agentId} status: ${status}`);
    }
  }
  
  /**
   * Check if agent is active
   */
  isActive(agentId) {
    return this.activeAgents.has(agentId);
  }
  
  /**
   * Get all active agents
   */
  getActiveAgents() {
    return Array.from(this.activeAgents).map(id => ({
      id,
      ...this.agents.get(id)
    }));
  }
  
  /**
   * Get agents by department
   */
  getAgentsByDepartment(department) {
    const departmentAgents = [];
    
    for (const [id, agent] of this.agents) {
      if (agent.department === department) {
        departmentAgents.push({ id, ...agent });
      }
    }
    
    return departmentAgents;
  }
  
  /**
   * Get agents by capability
   */
  getAgentsByCapability(capability) {
    const capableAgents = [];
    
    for (const [id, agent] of this.agents) {
      if (agent.capabilities && agent.capabilities.includes(capability)) {
        capableAgents.push({ id, ...agent });
      }
    }
    
    return capableAgents;
  }
  
  /**
   * Deregister an agent
   */
  deregisterAgent(agentId) {
    const agent = this.agents.get(agentId);
    
    if (agent) {
      this.agents.delete(agentId);
      this.activeAgents.delete(agentId);
      logger.info(`🟢️ Agent deregistered: ${agentId}`);
      return true;
    }
    
    return false;
  }
  
  /**
   * Get system statistics
   */
  getStats() {
    const departmentStats = {};
    const typeStats = {};
    
    for (const agent of this.agents.values()) {
      // Department stats
      const dept = agent.department || 'unassigned';
      departmentStats[dept] = (departmentStats[dept] || 0) + 1;
      
      // Type stats
      const type = agent.type || 'unknown';
      typeStats[type] = (typeStats[type] || 0) + 1;
    }
    
    return {
      totalAgents: this.agents.size,
      activeAgents: this.activeAgents.size,
      inactiveAgents: this.agents.size - this.activeAgents.size,
      byDepartment: departmentStats,
      byType: typeStats
    };
  }
  
  /**
   * Clean up inactive agents
   */
  cleanup(maxInactiveTime = 3600000) { // 1 hour default
    const now = Date.now();
    const toRemove = [];
    
    for (const [id, agent] of this.agents) {
      if (agent.status === 'inactive') {
        const inactiveTime = now - (agent.lastUpdate || agent.registeredAt);
        
        if (inactiveTime > maxInactiveTime) {
          toRemove.push(id);
        }
      }
    }
    
    for (const id of toRemove) {
      this.deregisterAgent(id);
    }
    
    logger.info(`🟢 Cleaned up ${toRemove.length} inactive agents`);
    
    return toRemove.length;
  }
  
  // ========== FEDERATION SUPPORT ==========
  
  initializeFederation() {
    const hasBlockchain = this.detectBlockchainAPIs();
    const hasIPFS = this.detectIPFSAPIs();
    
    return {
      enabled: false,
      type: hasBlockchain ? 'blockchain' : hasIPFS ? 'ipfs' : 'peer-to-peer',
      federations: new Map(),
      peers: new Set(),
      consensus: {
        algorithm: 'pbft', // Practical Byzantine Fault Tolerance
        quorum: 0.66,
        timeout: 5000
      },
      discovery: {
        method: hasIPFS ? 'dht' : 'broadcast',
        interval: 30000,
        maxPeers: 100
      },
      synchronization: {
        strategy: 'eventual',
        conflictResolution: 'last-write-wins',
        syncInterval: 10000
      },
      confidence: hasBlockchain ? 0.95 : hasIPFS ? 0.85 : 0.75
    };
  }
  
  detectBlockchainAPIs() {
    try {
      require.resolve('web3');
      return { available: true, type: 'ethereum' };
    } catch (e) {
      try {
        require.resolve('hyperledger-fabric');
        return { available: true, type: 'hyperledger' };
      } catch (e2) {
        return { available: false, fallback: 'merkle-tree' };
      }
    }
  }
  
  detectIPFSAPIs() {
    try {
      require.resolve('ipfs');
      return { available: true, type: 'ipfs' };
    } catch (e) {
      try {
        require.resolve('orbit-db');
        return { available: true, type: 'orbit-db' };
      } catch (e2) {
        return { available: false, fallback: 'p2p-simple' };
      }
    }
  }
  
  /**
   * Join a federation
   */
  async joinFederation(federationId, credentials = {}) {
    const federation = {
      id: federationId,
      joinedAt: Date.now(),
      role: credentials.role || 'member',
      permissions: credentials.permissions || ['read'],
      trustLevel: 0.5,
      peers: new Set(),
      sharedAgents: new Set()
    };
    
    // Authenticate with federation
    const authResult = await this.authenticateWithFederation(federationId, credentials);
    
    if (authResult.success) {
      federation.token = authResult.token;
      federation.trustLevel = authResult.trustLevel || 0.5;
      
      this.federation.federations.set(federationId, federation);
      this.trustRelationships.set(federationId, federation.trustLevel);
      
      // Start federation sync
      this.startFederationSync(federationId);
      
      logger.info(`🟢 Joined federation: ${federationId}`);
      return { success: true, federation };
    }
    
    return { success: false, error: authResult.error };
  }
  
  /**
   * Authenticate with federation
   */
  async authenticateWithFederation(federationId, credentials) {
    // Simulate federation authentication
    // In production, this would connect to actual federation network
    
    if (this.federation.type === 'blockchain') {
      return this.blockchainAuth(federationId, credentials);
    } else if (this.federation.type === 'ipfs') {
      return this.ipfsAuth(federationId, credentials);
    } else {
      return this.p2pAuth(federationId, credentials);
    }
  }
  
  async blockchainAuth(federationId, credentials) {
    // Simplified blockchain authentication
    const token = crypto.randomBytes(32).toString('hex');
    return {
      success: true,
      token,
      trustLevel: 0.9,
      method: 'blockchain'
    };
  }
  
  async ipfsAuth(federationId, credentials) {
    // Simplified IPFS authentication
    const token = crypto.randomBytes(32).toString('hex');
    return {
      success: true,
      token,
      trustLevel: 0.8,
      method: 'ipfs'
    };
  }
  
  async p2pAuth(federationId, credentials) {
    // Simplified P2P authentication
    const token = crypto.randomBytes(32).toString('hex');
    return {
      success: true,
      token,
      trustLevel: 0.7,
      method: 'p2p'
    };
  }
  
  /**
   * Share agent with federation
   */
  async shareAgentWithFederation(agentId, federationId) {
    const federation = this.federation.federations.get(federationId);
    const agent = this.agents.get(agentId);
    
    if (!federation || !agent) {
      return { success: false, error: 'Federation or agent not found' };
    }
    
    // Check permissions
    if (!federation.permissions.includes('write')) {
      return { success: false, error: 'Insufficient permissions' };
    }
    
    // Create federated agent record
    const federatedAgent = {
      ...agent,
      federationId,
      sharedAt: Date.now(),
      syncStatus: 'pending'
    };
    
    this.federatedAgents.set(agentId, federatedAgent);
    federation.sharedAgents.add(agentId);
    
    // Broadcast to federation
    await this.broadcastToFederation(federationId, {
      type: 'agent_shared',
      agent: federatedAgent
    });
    
    return { success: true, federatedAgent };
  }
  
  /**
   * Start federation synchronization
   */
  startFederationSync(federationId) {
    const syncInterval = this.federation.synchronization.syncInterval;
    
    const syncTimer = setInterval(async () => {
      await this.syncWithFederation(federationId);
    }, syncInterval);
    
    // Store timer for cleanup
    const federation = this.federation.federations.get(federationId);
    if (federation) {
      federation.syncTimer = syncTimer;
    }
  }
  
  /**
   * Sync with federation
   */
  async syncWithFederation(federationId) {
    const federation = this.federation.federations.get(federationId);
    if (!federation) return;
    
    // Get updates from federation
    const updates = await this.getFederationUpdates(federationId);
    
    // Apply updates
    for (const update of updates) {
      await this.applyFederationUpdate(update);
    }
    
    // Send local updates
    const localUpdates = this.getLocalUpdatesForFederation(federationId);
    await this.sendFederationUpdates(federationId, localUpdates);
  }
  
  async getFederationUpdates(federationId) {
    // Simulate getting updates from federation
    return [];
  }
  
  async applyFederationUpdate(update) {
    // Apply update from federation
    if (update.type === 'agent_update') {
      const agent = this.agents.get(update.agentId);
      if (agent) {
        Object.assign(agent, update.changes);
      }
    }
  }
  
  getLocalUpdatesForFederation(federationId) {
    const federation = this.federation.federations.get(federationId);
    if (!federation) return [];
    
    const updates = [];
    
    for (const agentId of federation.sharedAgents) {
      const agent = this.agents.get(agentId);
      if (agent && agent.lastUpdate > federation.lastSync) {
        updates.push({
          type: 'agent_update',
          agentId,
          changes: agent
        });
      }
    }
    
    return updates;
  }
  
  async sendFederationUpdates(federationId, updates) {
    // Send updates to federation
    await this.broadcastToFederation(federationId, {
      type: 'sync_updates',
      updates
    });
  }
  
  async broadcastToFederation(federationId, message) {
    // Broadcast message to federation peers
    const federation = this.federation.federations.get(federationId);
    if (!federation) return;
    
    // In production, this would use actual network protocols
    logger.info(`📡 Broadcasting to federation ${federationId}:`, message.type);
  }
  
  // ========== ADVANCED AUTHENTICATION ==========
  
  initializeAuthentication() {
    const hasJWT = this.detectJWTAPIs();
    const hasOAuth = this.detectOAuthAPIs();
    const hasSAML = this.detectSAMLAPIs();
    
    return {
      enabled: true,
      methods: {
        jwt: hasJWT,
        oauth: hasOAuth,
        saml: hasSAML,
        apiKey: true,
        certificate: this.detectCertificateSupport()
      },
      policies: {
        passwordStrength: 'strong',
        mfa: false,
        sessionTimeout: 3600000, // 1 hour
        maxSessions: 5,
        rateLimit: {
          attempts: 5,
          window: 300000 // 5 minutes
        }
      },
      encryption: {
        algorithm: 'aes-256-gcm',
        keyDerivation: 'pbkdf2',
        iterations: 100000
      },
      rbac: {
        enabled: true,
        roles: this.initializeRoles(),
        permissions: this.initializePermissions()
      }
    };
  }
  
  detectJWTAPIs() {
    try {
      require.resolve('jsonwebtoken');
      return { available: true, package: 'jsonwebtoken' };
    } catch (e) {
      return { available: false, fallback: 'simple-token' };
    }
  }
  
  detectOAuthAPIs() {
    try {
      require.resolve('passport-oauth2');
      return { available: true, package: 'passport-oauth2' };
    } catch (e) {
      return { available: false, fallback: 'basic-auth' };
    }
  }
  
  detectSAMLAPIs() {
    try {
      require.resolve('passport-saml');
      return { available: true, package: 'passport-saml' };
    } catch (e) {
      return { available: false, fallback: 'basic-auth' };
    }
  }
  
  detectCertificateSupport() {
    try {
      const tls = require('tls');
      return { available: true, module: 'tls' };
    } catch (e) {
      return { available: false, fallback: 'api-key' };
    }
  }
  
  initializeRoles() {
    return {
      admin: {
        level: 100,
        permissions: ['*'],
        description: 'Full system access'
      },
      manager: {
        level: 75,
        permissions: ['read', 'write', 'execute', 'delegate'],
        description: 'Department management'
      },
      specialist: {
        level: 50,
        permissions: ['read', 'write', 'execute'],
        description: 'Task execution'
      },
      observer: {
        level: 25,
        permissions: ['read'],
        description: 'Read-only access'
      },
      guest: {
        level: 10,
        permissions: ['read:public'],
        description: 'Limited public access'
      }
    };
  }
  
  initializePermissions() {
    return {
      'read': 'View agent data',
      'write': 'Modify agent data',
      'execute': 'Run agent tasks',
      'delete': 'Remove agents',
      'delegate': 'Assign tasks to other agents',
      'admin': 'System administration',
      'audit': 'View audit logs',
      'federate': 'Manage federation connections'
    };
  }
  
  /**
   * Authenticate an agent
   */
  async authenticateAgent(credentials) {
    const { method = 'apiKey', ...authData } = credentials;
    
    // Apply rate limiting
    if (!this.checkRateLimit(authData.identifier)) {
      return { success: false, error: 'Rate limit exceeded' };
    }
    
    let authResult;
    
    switch (method) {
      case 'jwt':
        authResult = await this.authenticateJWT(authData);
        break;
      case 'oauth':
        authResult = await this.authenticateOAuth(authData);
        break;
      case 'certificate':
        authResult = await this.authenticateCertificate(authData);
        break;
      case 'apiKey':
      default:
        authResult = await this.authenticateAPIKey(authData);
    }
    
    if (authResult.success) {
      // Create session
      const session = await this.createSession(authResult.agentId, authResult);
      
      // Audit log
      this.auditLog.push({
        type: 'authentication',
        agentId: authResult.agentId,
        method,
        timestamp: Date.now(),
        success: true
      });
      
      return { success: true, session };
    }
    
    // Audit failed attempt
    this.auditLog.push({
      type: 'authentication',
      identifier: authData.identifier,
      method,
      timestamp: Date.now(),
      success: false,
      error: authResult.error
    });
    
    return authResult;
  }
  
  async authenticateJWT(authData) {
    if (this.authentication.methods.jwt.available) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authData.token, process.env.JWT_SECRET || 'default-secret');
        
        return {
          success: true,
          agentId: decoded.agentId,
          role: decoded.role,
          permissions: decoded.permissions
        };
      } catch (e) {
        return { success: false, error: 'Invalid JWT token' };
      }
    }
    
    // Fallback to simple token
    return this.authenticateSimpleToken(authData);
  }
  
  async authenticateOAuth(authData) {
    // Simplified OAuth authentication
    // In production, this would use actual OAuth flow
    
    if (authData.accessToken) {
      // Verify access token
      const agentId = this.verifyAccessToken(authData.accessToken);
      
      if (agentId) {
        return {
          success: true,
          agentId,
          role: 'specialist',
          permissions: ['read', 'write', 'execute']
        };
      }
    }
    
    return { success: false, error: 'Invalid OAuth token' };
  }
  
  async authenticateCertificate(authData) {
    if (this.authentication.methods.certificate.available) {
      // Verify client certificate
      // Simplified for demonstration
      
      if (authData.certificate && authData.certificate.subject) {
        return {
          success: true,
          agentId: authData.certificate.subject.CN,
          role: 'specialist',
          permissions: ['read', 'write', 'execute']
        };
      }
    }
    
    return { success: false, error: 'Invalid certificate' };
  }
  
  async authenticateAPIKey(authData) {
    // Simple API key authentication
    const validKeys = new Map([
      ['admin-key-123', { agentId: 'admin-001', role: 'admin' }],
      ['manager-key-456', { agentId: 'manager-001', role: 'manager' }],
      ['specialist-key-789', { agentId: 'specialist-001', role: 'specialist' }]
    ]);
    
    const keyData = validKeys.get(authData.apiKey);
    
    if (keyData) {
      const role = this.authentication.rbac.roles[keyData.role];
      
      return {
        success: true,
        agentId: keyData.agentId,
        role: keyData.role,
        permissions: role.permissions
      };
    }
    
    return { success: false, error: 'Invalid API key' };
  }
  
  async authenticateSimpleToken(authData) {
    // Fallback simple token authentication
    const token = authData.token;
    
    if (token && token.length >= 32) {
      // Verify token format
      const agentId = this.extractAgentIdFromToken(token);
      
      if (agentId) {
        return {
          success: true,
          agentId,
          role: 'specialist',
          permissions: ['read', 'write']
        };
      }
    }
    
    return { success: false, error: 'Invalid token' };
  }
  
  extractAgentIdFromToken(token) {
    // Extract agent ID from token
    // Simplified implementation
    const parts = token.split('-');
    if (parts.length >= 4) {
      return `${parts[0]}-${parts[1]}`;
    }
    return null;
  }
  
  verifyAccessToken(accessToken) {
    // Verify OAuth access token
    // Simplified implementation
    if (accessToken && accessToken.startsWith('access_')) {
      return 'oauth-agent-001';
    }
    return null;
  }
  
  checkRateLimit(identifier) {
    // Implement rate limiting
    // Simplified for demonstration
    return true;
  }
  
  /**
   * Create authentication session
   */
  async createSession(agentId, authData) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    
    const session = {
      id: sessionId,
      agentId,
      role: authData.role,
      permissions: authData.permissions,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.authentication.policies.sessionTimeout,
      lastActivity: Date.now()
    };
    
    this.sessions.set(sessionId, session);
    
    // Store permissions
    this.permissions.set(agentId, authData.permissions);
    
    return session;
  }
  
  /**
   * Validate session
   */
  validateSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return { valid: false, error: 'Session not found' };
    }
    
    if (session.expiresAt < Date.now()) {
      this.sessions.delete(sessionId);
      return { valid: false, error: 'Session expired' };
    }
    
    // Update last activity
    session.lastActivity = Date.now();
    
    return { valid: true, session };
  }
  
  /**
   * Check agent permission
   */
  checkPermission(agentId, permission) {
    const agentPermissions = this.permissions.get(agentId);
    
    if (!agentPermissions) {
      return false;
    }
    
    // Check for wildcard permission
    if (agentPermissions.includes('*')) {
      return true;
    }
    
    // Check specific permission
    return agentPermissions.includes(permission);
  }
  
  /**
   * Revoke session
   */
  revokeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      this.sessions.delete(sessionId);
      
      // Audit log
      this.auditLog.push({
        type: 'session_revoked',
        sessionId,
        agentId: session.agentId,
        timestamp: Date.now()
      });
      
      return true;
    }
    
    return false;
  }
  
  // ========== SECURITY POLICIES ==========
  
  initializeSecurityPolicies() {
    return {
      encryption: {
        enabled: true,
        algorithm: 'aes-256-gcm',
        keyRotation: 86400000 // 24 hours
      },
      integrity: {
        checksums: true,
        signatures: true,
        verification: 'strict'
      },
      isolation: {
        sandboxing: true,
        resourceLimits: true,
        networkSegmentation: true
      },
      monitoring: {
        anomalyDetection: true,
        behaviorAnalysis: true,
        threatIntelligence: true
      },
      compliance: {
        gdpr: true,
        ccpa: true,
        hipaa: false,
        pci: false
      }
    };
  }
  
  /**
   * Encrypt sensitive data
   */
  encryptData(data) {
    if (!this.securityPolicies.encryption.enabled) {
      return data;
    }
    
    const cipher = crypto.createCipher(
      this.securityPolicies.encryption.algorithm,
      this.getEncryptionKey()
    );
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return encrypted;
  }
  
  /**
   * Decrypt sensitive data
   */
  decryptData(encryptedData) {
    if (!this.securityPolicies.encryption.enabled) {
      return encryptedData;
    }
    
    const decipher = crypto.createDecipher(
      this.securityPolicies.encryption.algorithm,
      this.getEncryptionKey()
    );
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
  
  getEncryptionKey() {
    // In production, this would use proper key management
    return process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
  }
  
  /**
   * Get audit log
   */
  getAuditLog(filters = {}) {
    let logs = [...this.auditLog];
    
    if (filters.type) {
      logs = logs.filter(log => log.type === filters.type);
    }
    
    if (filters.agentId) {
      logs = logs.filter(log => log.agentId === filters.agentId);
    }
    
    if (filters.startTime) {
      logs = logs.filter(log => log.timestamp >= filters.startTime);
    }
    
    if (filters.endTime) {
      logs = logs.filter(log => log.timestamp <= filters.endTime);
    }
    
    return logs;
  }
  
  /**
   * Export identity data
   */
  exportIdentityData() {
    return {
      agents: Array.from(this.agents.entries()),
      federations: Array.from(this.federation.federations.entries()),
      sessions: Array.from(this.sessions.entries()),
      permissions: Array.from(this.permissions.entries()),
      trustRelationships: Array.from(this.trustRelationships.entries()),
      auditLog: this.auditLog
    };
  }
  
  /**
   * Import identity data
   */
  importIdentityData(data) {
    if (data.agents) {
      this.agents = new Map(data.agents);
    }
    
    if (data.federations) {
      this.federation.federations = new Map(data.federations);
    }
    
    if (data.sessions) {
      this.sessions = new Map(data.sessions);
    }
    
    if (data.permissions) {
      this.permissions = new Map(data.permissions);
    }
    
    if (data.trustRelationships) {
      this.trustRelationships = new Map(data.trustRelationships);
    }
    
    if (data.auditLog) {
      this.auditLog = data.auditLog;
    }
    
    logger.info('🏁 Identity data imported successfully');
  }
}

/**
 * Mixin to add agent identity to any class
 */
const AgentIdentityMixin = {
  initializeAgentIdentity(type, name) {
    const identitySystem = getInstance();
    this.agentId = identitySystem.registerAgent(this, {
      type: type || this.constructor.name,
      name: name || this.name,
      department: this.department,
      capabilities: this.capabilities
    });
    
    return this.agentId;
  },
  
  getAgentId() {
    if (!this.agentId) {
      this.initializeAgentIdentity();
    }
    return this.agentId;
  },
  
  updateAgentStatus(status) {
    const identitySystem = getInstance();
    identitySystem.updateAgentStatus(this.agentId, status);
  }
};

// Singleton
let instance = null;

const getInstance = () => {
  if (!instance) {
    instance = new AgentIdentitySystem();
  }
  return instance;
};

module.exports = {
  AgentIdentitySystem,
  AgentIdentityMixin,
  getInstance
};