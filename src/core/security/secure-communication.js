/**
 * Secure Communication Layer
 * HTTPS enforcement, CORS, CSP, and request security
 * Sprint 15-16 - Security Fix
 */

const crypto = require('crypto');
const { logger } = require('../logging/bumba-logger');
const { stateManager } = require('../state/global-state-manager');
const { validator } = require('./input-validator');
const { errorTelemetry } = require('../error-boundaries/error-telemetry');

class SecureCommunication {
  constructor(options = {}) {
    this.options = {
      // HTTPS Settings
      forceHTTPS: options.forceHTTPS !== false,
      hstsMaxAge: options.hstsMaxAge || 31536000, // 1 year
      hstsIncludeSubdomains: options.hstsIncludeSubdomains !== false,
      hstsPreload: options.hstsPreload || false,
      
      // CORS Settings
      corsOrigins: options.corsOrigins || ['https://localhost:3000'],
      corsMethods: options.corsMethods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      corsHeaders: options.corsHeaders || ['Content-Type', 'Authorization'],
      corsCredentials: options.corsCredentials !== false,
      corsMaxAge: options.corsMaxAge || 86400, // 24 hours
      
      // CSP Settings
      cspDirectives: options.cspDirectives || {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'strict-dynamic'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'"],
        'connect-src': ["'self'"],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'upgrade-insecure-requests': []
      },
      
      // Security Headers
      frameOptions: options.frameOptions || 'DENY',
      contentTypeOptions: options.contentTypeOptions !== false,
      xssProtection: options.xssProtection !== false,
      referrerPolicy: options.referrerPolicy || 'strict-origin-when-cross-origin',
      
      // Request Signing
      enableRequestSigning: options.enableRequestSigning || false,
      signatureHeader: options.signatureHeader || 'X-Signature',
      signatureAlgorithm: options.signatureAlgorithm || 'sha256',
      signatureSecret: options.signatureSecret || crypto.randomBytes(32).toString('hex'),
      
      // API Encryption
      enableEncryption: options.enableEncryption || false,
      encryptionAlgorithm: options.encryptionAlgorithm || 'aes-256-gcm',
      encryptionKey: options.encryptionKey || crypto.randomBytes(32),
      
      ...options
    };
    
    // Statistics
    this.stats = {
      httpsRedirects: 0,
      corsRequests: 0,
      corsBlocked: 0,
      cspViolations: 0,
      signedRequests: 0,
      encryptedRequests: 0
    };
    
    // Nonce cache for CSP
    this.nonceCache = new Set();
    
    // Register state
    stateManager.register('secureCommunication', {
      stats: this.stats,
      corsOrigins: this.options.corsOrigins,
      cspEnabled: true
    });
  }
  
  /**
   * Apply security headers to response
   */
  applySecurityHeaders(req, res, next) {
    // HTTPS enforcement
    if (this.options.forceHTTPS) {
      this.enforceHTTPS(req, res);
    }
    
    // HSTS
    this.setHSTS(res);
    
    // CORS
    this.handleCORS(req, res);
    
    // CSP
    this.setCSP(req, res);
    
    // Additional security headers
    this.setSecurityHeaders(res);
    
    if (next) next();
  }
  
  /**
   * Enforce HTTPS
   */
  enforceHTTPS(req, res) {
    if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
      this.stats.httpsRedirects++;
      this.updateState();
      
      const httpsUrl = `https://${req.headers.host}${req.url}`;
      res.redirect(301, httpsUrl);
      return true;
    }
    return false;
  }
  
  /**
   * Set HSTS header
   */
  setHSTS(res) {
    if (!this.options.forceHTTPS) return;
    
    let hstsHeader = `max-age=${this.options.hstsMaxAge}`;
    
    if (this.options.hstsIncludeSubdomains) {
      hstsHeader += '; includeSubDomains';
    }
    
    if (this.options.hstsPreload) {
      hstsHeader += '; preload';
    }
    
    res.setHeader('Strict-Transport-Security', hstsHeader);
  }
  
  /**
   * Handle CORS
   */
  handleCORS(req, res) {
    const origin = req.headers.origin;
    
    if (!origin) return;
    
    this.stats.corsRequests++;
    
    // Check if origin is allowed
    const isAllowed = this.isOriginAllowed(origin);
    
    if (!isAllowed) {
      this.stats.corsBlocked++;
      this.updateState();
      
      // Log security event
      errorTelemetry.recordError(new Error('CORS blocked'), {
        type: 'cors_violation',
        severity: 'medium',
        origin,
        url: req.url
      });
      
      return;
    }
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', this.options.corsMethods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', this.options.corsHeaders.join(', '));
    res.setHeader('Access-Control-Max-Age', this.options.corsMaxAge);
    
    if (this.options.corsCredentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return true;
    }
    
    this.updateState();
    return false;
  }
  
  /**
   * Check if origin is allowed
   */
  isOriginAllowed(origin) {
    // Allow all origins with wildcard
    if (this.options.corsOrigins.includes('*')) {
      return true;
    }
    
    // Check exact match
    if (this.options.corsOrigins.includes(origin)) {
      return true;
    }
    
    // Check wildcard subdomains
    for (const allowed of this.options.corsOrigins) {
      if (allowed.startsWith('*.')) {
        const domain = allowed.substring(2);
        if (origin.endsWith(domain)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Set Content Security Policy
   */
  setCSP(req, res) {
    const directives = [];
    
    // Generate nonce for this request
    const nonce = this.generateNonce();
    req.cspNonce = nonce;
    
    for (const [directive, values] of Object.entries(this.options.cspDirectives)) {
      let directiveStr = directive;
      
      if (values.length > 0) {
        // Add nonce to script-src and style-src
        if ((directive === 'script-src' || directive === 'style-src') && nonce) {
          values.push(`'nonce-${nonce}'`);
        }
        
        directiveStr += ' ' + values.join(' ');
      }
      
      directives.push(directiveStr);
    }
    
    // Add report-uri if configured
    if (this.options.cspReportUri) {
      directives.push(`report-uri ${this.options.cspReportUri}`);
    }
    
    const cspHeader = directives.join('; ');
    
    // Use Report-Only mode if configured
    if (this.options.cspReportOnly) {
      res.setHeader('Content-Security-Policy-Report-Only', cspHeader);
    } else {
      res.setHeader('Content-Security-Policy', cspHeader);
    }
  }
  
  /**
   * Generate CSP nonce
   */
  generateNonce() {
    const nonce = crypto.randomBytes(16).toString('base64');
    this.nonceCache.add(nonce);
    
    // Clean old nonces after 5 minutes
    setTimeout(() => {
      this.nonceCache.delete(nonce);
    }, 300000);
    
    return nonce;
  }
  
  /**
   * Set additional security headers
   */
  setSecurityHeaders(res) {
    // X-Frame-Options
    if (this.options.frameOptions) {
      res.setHeader('X-Frame-Options', this.options.frameOptions);
    }
    
    // X-Content-Type-Options
    if (this.options.contentTypeOptions) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
    
    // X-XSS-Protection (legacy but still useful)
    if (this.options.xssProtection) {
      res.setHeader('X-XSS-Protection', '1; mode=block');
    }
    
    // Referrer-Policy
    if (this.options.referrerPolicy) {
      res.setHeader('Referrer-Policy', this.options.referrerPolicy);
    }
    
    // Permissions-Policy (formerly Feature-Policy)
    if (this.options.permissionsPolicy) {
      res.setHeader('Permissions-Policy', this.options.permissionsPolicy);
    }
  }
  
  /**
   * Sign request
   */
  signRequest(method, url, body = '', timestamp = Date.now()) {
    const payload = `${method.toUpperCase()}:${url}:${timestamp}:${body}`;
    
    const hmac = crypto.createHmac(this.options.signatureAlgorithm, this.options.signatureSecret);
    hmac.update(payload);
    const signature = hmac.digest('hex');
    
    this.stats.signedRequests++;
    this.updateState();
    
    return {
      signature,
      timestamp,
      header: `${timestamp}:${signature}`
    };
  }
  
  /**
   * Verify request signature
   */
  verifySignature(req) {
    if (!this.options.enableRequestSigning) {
      return { valid: true };
    }
    
    const signatureHeader = req.headers[this.options.signatureHeader.toLowerCase()];
    
    if (!signatureHeader) {
      return { valid: false, error: 'Missing signature header' };
    }
    
    const [timestamp, signature] = signatureHeader.split(':');
    
    // Check timestamp (prevent replay attacks)
    const now = Date.now();
    const requestTime = parseInt(timestamp);
    
    if (isNaN(requestTime) || Math.abs(now - requestTime) > 300000) { // 5 minute window
      return { valid: false, error: 'Invalid or expired timestamp' };
    }
    
    // Reconstruct signature
    const body = JSON.stringify(req.body || '');
    const expectedSig = this.signRequest(req.method, req.url, body, requestTime);
    
    // Compare signatures
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig.signature))) {
      errorTelemetry.recordError(new Error('Invalid request signature'), {
        type: 'signature_verification_failed',
        severity: 'high',
        url: req.url
      });
      
      return { valid: false, error: 'Invalid signature' };
    }
    
    return { valid: true };
  }
  
  /**
   * Encrypt data
   */
  encryptData(data) {
    if (!this.options.enableEncryption) {
      return data;
    }
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.options.encryptionAlgorithm,
      this.options.encryptionKey,
      iv
    );
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    this.stats.encryptedRequests++;
    this.updateState();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
  
  /**
   * Decrypt data
   */
  decryptData(encryptedData) {
    if (!this.options.enableEncryption) {
      return encryptedData;
    }
    
    try {
      const decipher = crypto.createDecipheriv(
        this.options.encryptionAlgorithm,
        this.options.encryptionKey,
        Buffer.from(encryptedData.iv, 'hex')
      );
      
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      errorTelemetry.recordError(error, {
        type: 'decryption_failed',
        severity: 'high'
      });
      
      throw new Error('Decryption failed');
    }
  }
  
  /**
   * Handle CSP violation report
   */
  handleCSPViolation(report) {
    this.stats.cspViolations++;
    this.updateState();
    
    // Log violation
    logger.warn('CSP Violation:', {
      documentUri: report['document-uri'],
      violatedDirective: report['violated-directive'],
      blockedUri: report['blocked-uri'],
      sourceFile: report['source-file'],
      lineNumber: report['line-number']
    });
    
    // Record in telemetry
    errorTelemetry.recordError(new Error('CSP Violation'), {
      type: 'csp_violation',
      severity: 'medium',
      report
    });
  }
  
  /**
   * Create secure API middleware
   */
  createSecureMiddleware() {
    return (req, res, next) => {
      // Apply security headers
      this.applySecurityHeaders(req, res);
      
      // Verify request signature if enabled
      if (this.options.enableRequestSigning) {
        const signatureResult = this.verifySignature(req);
        
        if (!signatureResult.valid) {
          return res.status(401).json({ error: signatureResult.error });
        }
      }
      
      // Decrypt request body if encrypted
      if (this.options.enableEncryption && req.body && req.body.encrypted) {
        try {
          req.body = this.decryptData(req.body);
        } catch (error) {
          return res.status(400).json({ error: 'Decryption failed' });
        }
      }
      
      // Add response encryption if enabled
      if (this.options.enableEncryption) {
        const originalJson = res.json.bind(res);
        res.json = (data) => {
          const encrypted = this.encryptData(data);
          return originalJson(encrypted);
        };
      }
      
      next();
    };
  }
  
  /**
   * Update state
   */
  updateState() {
    stateManager.set('secureCommunication', 'stats', this.stats);
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      nonceCount: this.nonceCache.size
    };
  }
}

// Singleton instance
let instance = null;

function getSecureCommunication(options) {
  if (!instance) {
    instance = new SecureCommunication(options);
  }
  return instance;
}

module.exports = {
  SecureCommunication,
  getSecureCommunication,
  secureCommunication: getSecureCommunication()
};