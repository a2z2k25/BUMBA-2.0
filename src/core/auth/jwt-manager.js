/**
 * JWT Authentication Manager
 * Secure token-based authentication system
 * Sprint 13 - Security Fix
 */

const crypto = require('crypto');
const { logger } = require('../logging/bumba-logger');
const { stateManager } = require('../state/global-state-manager');
const { validator } = require('../security/input-validator');
const { authLimiter } = require('../security/rate-limiter');
const { errorTelemetry } = require('../error-boundaries/error-telemetry');
const { ComponentTimers } = require('../timers/timer-registry');

class JWTManager {
  constructor(options = {}) {
    this.options = {
      // Token settings
      secret: options.secret || this.generateSecret(),
      algorithm: options.algorithm || 'HS256',
      expiresIn: options.expiresIn || '24h',
      refreshExpiresIn: options.refreshExpiresIn || '7d',
      issuer: options.issuer || 'bumba-framework',
      audience: options.audience || 'bumba-users',
      
      // Security settings
      requireSecureTransport: options.requireSecureTransport !== false,
      maxTokenAge: options.maxTokenAge || 86400000, // 24 hours
      maxRefreshAge: options.maxRefreshAge || 604800000, // 7 days
      revokeOnPasswordChange: options.revokeOnPasswordChange !== false,
      
      // Rotation settings
      rotateRefreshTokens: options.rotateRefreshTokens !== false,
      refreshTokenReuse: options.refreshTokenReuse || 'revoke', // revoke|allow|track
      
      ...options
    };
    
    // Token storage
    this.tokens = new Map(); // Active tokens
    this.refreshTokens = new Map(); // Refresh tokens
    this.revokedTokens = new Set(); // Revoked token JTIs
    this.tokenFamilies = new Map(); // Token families for rotation
    
    // User sessions
    this.sessions = new Map();
    
    // Timers
    this.timers = new ComponentTimers('jwt-manager');
    
    // Statistics
    this.stats = {
      tokensIssued: 0,
      tokensRefreshed: 0,
      tokensRevoked: 0,
      tokenValidations: 0,
      validationFailures: 0
    };
    
    // Register state
    stateManager.register('jwt', {
      stats: this.stats,
      activeSessions: 0,
      revokedCount: 0
    });
    
    // Start cleanup
    this.startCleanup();
  }
  
  /**
   * Generate secure secret
   */
  generateSecret() {
    return crypto.randomBytes(64).toString('hex');
  }
  
  /**
   * Create JWT token
   */
  createToken(payload, options = {}) {
    // Validate payload
    const validation = validator.validateObject(payload, {
      userId: { type: 'string', required: true },
      email: { type: 'email' },
      roles: { type: 'array', itemType: 'string' },
      permissions: { type: 'array', itemType: 'string' }
    });
    
    if (!validation.valid) {
      throw new Error(`Invalid token payload: ${validation.errors[0].error}`);
    }
    
    // Generate token ID
    const jti = this.generateTokenId();
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + this.parseExpiry(options.expiresIn || this.options.expiresIn);
    
    // Create token structure
    const token = {
      header: {
        alg: this.options.algorithm,
        typ: 'JWT'
      },
      payload: {
        ...payload,
        jti,
        iat,
        exp,
        iss: this.options.issuer,
        aud: this.options.audience,
        nbf: iat - 10, // Not before (with 10s leeway)
        sub: payload.userId
      }
    };
    
    // Sign token
    const encodedToken = this.signToken(token);
    
    // Store token metadata
    this.tokens.set(jti, {
      userId: payload.userId,
      createdAt: Date.now(),
      expiresAt: exp * 1000,
      payload
    });
    
    // Update stats
    this.stats.tokensIssued++;
    this.updateState();
    
    return {
      token: encodedToken,
      expiresIn: exp - iat,
      expiresAt: exp * 1000,
      tokenId: jti
    };
  }
  
  /**
   * Create refresh token
   */
  createRefreshToken(userId, options = {}) {
    const tokenId = this.generateTokenId();
    const familyId = options.familyId || this.generateTokenId();
    const expiresAt = Date.now() + this.parseExpiry(this.options.refreshExpiresIn) * 1000;
    
    const refreshToken = {
      tokenId,
      userId,
      familyId,
      createdAt: Date.now(),
      expiresAt,
      used: false,
      generation: options.generation || 0
    };
    
    // Store refresh token
    this.refreshTokens.set(tokenId, refreshToken);
    
    // Track token family
    if (!this.tokenFamilies.has(familyId)) {
      this.tokenFamilies.set(familyId, {
        userId,
        tokens: [],
        createdAt: Date.now()
      });
    }
    this.tokenFamilies.get(familyId).tokens.push(tokenId);
    
    // Encode refresh token
    const encoded = this.encodeRefreshToken(refreshToken);
    
    return {
      refreshToken: encoded,
      expiresAt,
      familyId
    };
  }
  
  /**
   * Verify JWT token
   */
  async verifyToken(token) {
    this.stats.tokenValidations++;
    
    try {
      // Decode token
      const decoded = this.decodeToken(token);
      
      if (!decoded) {
        throw new Error('Invalid token format');
      }
      
      // Check if revoked
      if (this.revokedTokens.has(decoded.payload.jti)) {
        throw new Error('Token has been revoked');
      }
      
      // Verify signature
      if (!this.verifySignature(token)) {
        throw new Error('Invalid token signature');
      }
      
      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (decoded.payload.exp && decoded.payload.exp < now) {
        throw new Error('Token has expired');
      }
      
      // Check not before
      if (decoded.payload.nbf && decoded.payload.nbf > now + 10) {
        throw new Error('Token not yet valid');
      }
      
      // Verify issuer and audience
      if (decoded.payload.iss !== this.options.issuer) {
        throw new Error('Invalid token issuer');
      }
      
      if (decoded.payload.aud !== this.options.audience) {
        throw new Error('Invalid token audience');
      }
      
      // Check if token exists in storage
      const storedToken = this.tokens.get(decoded.payload.jti);
      if (!storedToken) {
        throw new Error('Token not found');
      }
      
      // Verify user still valid
      if (options.verifyUser) {
        const userValid = await options.verifyUser(decoded.payload.userId);
        if (!userValid) {
          throw new Error('User no longer valid');
        }
      }
      
      this.updateState();
      
      return {
        valid: true,
        payload: decoded.payload,
        userId: decoded.payload.sub,
        roles: decoded.payload.roles || [],
        permissions: decoded.payload.permissions || []
      };
      
    } catch (error) {
      this.stats.validationFailures++;
      this.updateState();
      
      // Log security event
      errorTelemetry.recordError(error, {
        type: 'jwt_verification_failed',
        severity: 'medium'
      });
      
      return {
        valid: false,
        error: error.message
      };
    }
  }
  
  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    try {
      // Rate limit refresh attempts
      const limitResult = await authLimiter.limit('refresh:' + refreshToken.substring(0, 10));
      if (!limitResult.allowed) {
        throw new Error('Too many refresh attempts');
      }
      
      // Decode refresh token
      const decoded = this.decodeRefreshToken(refreshToken);
      if (!decoded) {
        throw new Error('Invalid refresh token');
      }
      
      // Get stored refresh token
      const stored = this.refreshTokens.get(decoded.tokenId);
      if (!stored) {
        throw new Error('Refresh token not found');
      }
      
      // Check expiration
      if (Date.now() > stored.expiresAt) {
        throw new Error('Refresh token expired');
      }
      
      // Check if already used (detect reuse attack)
      if (stored.used && this.options.refreshTokenReuse === 'revoke') {
        // Revoke entire token family
        this.revokeTokenFamily(stored.familyId);
        throw new Error('Refresh token reuse detected - all tokens revoked');
      }
      
      // Mark as used
      stored.used = true;
      
      // Create new tokens
      const newAccessToken = this.createToken({
        userId: stored.userId,
        // Copy other claims from original token
      });
      
      let newRefreshToken = null;
      if (this.options.rotateRefreshTokens) {
        // Create new refresh token in same family
        newRefreshToken = this.createRefreshToken(stored.userId, {
          familyId: stored.familyId,
          generation: stored.generation + 1
        });
        
        // Revoke old refresh token
        this.refreshTokens.delete(decoded.tokenId);
      }
      
      this.stats.tokensRefreshed++;
      this.updateState();
      
      return {
        accessToken: newAccessToken.token,
        refreshToken: newRefreshToken ? newRefreshToken.refreshToken : refreshToken,
        expiresIn: newAccessToken.expiresIn
      };
      
    } catch (error) {
      errorTelemetry.recordError(error, {
        type: 'token_refresh_failed',
        severity: 'high'
      });
      
      throw error;
    }
  }
  
  /**
   * Revoke token
   */
  revokeToken(tokenId) {
    this.revokedTokens.add(tokenId);
    this.tokens.delete(tokenId);
    this.stats.tokensRevoked++;
    this.updateState();
  }
  
  /**
   * Revoke all tokens for user
   */
  revokeUserTokens(userId) {
    let revoked = 0;
    
    // Revoke access tokens
    for (const [jti, token] of this.tokens.entries()) {
      if (token.userId === userId) {
        this.revokedTokens.add(jti);
        this.tokens.delete(jti);
        revoked++;
      }
    }
    
    // Revoke refresh tokens
    for (const [tokenId, token] of this.refreshTokens.entries()) {
      if (token.userId === userId) {
        this.refreshTokens.delete(tokenId);
        revoked++;
      }
    }
    
    this.stats.tokensRevoked += revoked;
    this.updateState();
    
    return revoked;
  }
  
  /**
   * Revoke token family
   */
  revokeTokenFamily(familyId) {
    const family = this.tokenFamilies.get(familyId);
    if (!family) return 0;
    
    let revoked = 0;
    for (const tokenId of family.tokens) {
      this.refreshTokens.delete(tokenId);
      revoked++;
    }
    
    this.tokenFamilies.delete(familyId);
    this.stats.tokensRevoked += revoked;
    
    logger.warn(`Token family ${familyId} revoked due to reuse detection`);
    
    return revoked;
  }
  
  /**
   * Sign token
   */
  signToken(token) {
    const header = this.base64Encode(JSON.stringify(token.header));
    const payload = this.base64Encode(JSON.stringify(token.payload));
    const signature = this.createSignature(`${header}.${payload}`);
    
    return `${header}.${payload}.${signature}`;
  }
  
  /**
   * Verify signature
   */
  verifySignature(token) {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const signature = this.createSignature(`${parts[0]}.${parts[1]}`);
    return signature === parts[2];
  }
  
  /**
   * Create signature
   */
  createSignature(data) {
    const hmac = crypto.createHmac('sha256', this.options.secret);
    hmac.update(data);
    return this.base64Encode(hmac.digest('hex'));
  }
  
  /**
   * Decode token
   */
  decodeToken(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      return {
        header: JSON.parse(this.base64Decode(parts[0])),
        payload: JSON.parse(this.base64Decode(parts[1])),
        signature: parts[2]
      };
    } catch {
      return null;
    }
  }
  
  /**
   * Encode refresh token
   */
  encodeRefreshToken(data) {
    const json = JSON.stringify(data);
    const encrypted = this.encrypt(json);
    return this.base64Encode(encrypted);
  }
  
  /**
   * Decode refresh token
   */
  decodeRefreshToken(token) {
    try {
      const encrypted = this.base64Decode(token);
      const json = this.decrypt(encrypted);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
  
  /**
   * Encrypt data
   */
  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.options.secret.substring(0, 32)),
      iv
    );
    
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }
  
  /**
   * Decrypt data
   */
  decrypt(text) {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = Buffer.from(parts[1], 'hex');
    
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.options.secret.substring(0, 32)),
      iv
    );
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  }
  
  /**
   * Base64 encode
   */
  base64Encode(str) {
    return Buffer.from(str).toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }
  
  /**
   * Base64 decode
   */
  base64Decode(str) {
    str += '='.repeat((4 - str.length % 4) % 4);
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(str, 'base64').toString();
  }
  
  /**
   * Parse expiry time
   */
  parseExpiry(expiry) {
    if (typeof expiry === 'number') return expiry;
    
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default 1 hour
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 3600;
    }
  }
  
  /**
   * Generate token ID
   */
  generateTokenId() {
    return crypto.randomBytes(16).toString('hex');
  }
  
  /**
   * Start cleanup timer
   */
  startCleanup() {
    // Clean expired tokens every 5 minutes
    this.timers.setInterval('cleanup', () => {
      this.cleanup();
    }, 300000, 'Clean expired JWT tokens');
  }
  
  /**
   * Clean expired tokens
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    // Clean access tokens
    for (const [jti, token] of this.tokens.entries()) {
      if (token.expiresAt < now) {
        this.tokens.delete(jti);
        cleaned++;
      }
    }
    
    // Clean refresh tokens
    for (const [tokenId, token] of this.refreshTokens.entries()) {
      if (token.expiresAt < now) {
        this.refreshTokens.delete(tokenId);
        cleaned++;
      }
    }
    
    // Clean old revoked tokens (keep for 24h for security)
    if (this.revokedTokens.size > 1000) {
      const toKeep = Array.from(this.revokedTokens).slice(-500);
      this.revokedTokens = new Set(toKeep);
    }
    
    if (cleaned > 0) {
      logger.debug(`JWT cleanup: removed ${cleaned} expired tokens`);
    }
    
    this.updateState();
  }
  
  /**
   * Update state
   */
  updateState() {
    stateManager.set('jwt', 'stats', this.stats);
    stateManager.set('jwt', 'activeSessions', this.tokens.size);
    stateManager.set('jwt', 'revokedCount', this.revokedTokens.size);
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeTokens: this.tokens.size,
      activeRefreshTokens: this.refreshTokens.size,
      revokedTokens: this.revokedTokens.size,
      tokenFamilies: this.tokenFamilies.size
    };
  }
}

// Singleton instance
let instance = null;

function getJWTManager(options) {
  if (!instance) {
    instance = new JWTManager(options);
  }
  return instance;
}

module.exports = {
  JWTManager,
  getJWTManager,
  jwtManager: getJWTManager()
};