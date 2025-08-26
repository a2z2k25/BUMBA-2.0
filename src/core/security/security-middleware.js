/**
 * Security Middleware Integration
 * Combines all security layers into usable middleware
 * Sprint 15-16 - Security Fix
 */

const { secureCommunication } = require('./secure-communication');
const { validator } = require('./input-validator');
const { rateLimiterManager } = require('./rate-limiter');
const { jwtManager } = require('../auth/jwt-manager');
const { sessionManager } = require('../auth/session-manager');
const { rbacManager } = require('../auth/rbac-manager');
const { errorBoundaryManager } = require('../error-boundaries/error-boundary');
const { errorTelemetry } = require('../error-boundaries/error-telemetry');
const { logger } = require('../logging/bumba-logger');

class SecurityMiddleware {
  constructor(options = {}) {
    this.options = {
      enableAuth: options.enableAuth !== false,
      enableRateLimit: options.enableRateLimit !== false,
      enableValidation: options.enableValidation !== false,
      enableCSP: options.enableCSP !== false,
      enableCORS: options.enableCORS !== false,
      enableHTTPS: options.enableHTTPS !== false,
      enableEncryption: options.enableEncryption || false,
      enableSigning: options.enableSigning || false,
      ...options
    };
    
    // Initialize secure communication with options
    this.secureComm = secureCommunication;
    
    // Configure based on environment
    this.configure();
  }
  
  /**
   * Configure security based on environment
   */
  configure() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // Enforce stricter settings in production
      this.options.enableHTTPS = true;
      this.options.enableCSP = true;
      
      // Configure secure communication
      this.secureComm.options.forceHTTPS = true;
      this.secureComm.options.hstsMaxAge = 31536000; // 1 year
      this.secureComm.options.hstsIncludeSubdomains = true;
    }
  }
  
  /**
   * Create complete security middleware stack
   */
  createMiddlewareStack() {
    const middlewares = [];
    
    // 1. Security headers (always first)
    middlewares.push(this.securityHeaders());
    
    // 2. HTTPS enforcement
    if (this.options.enableHTTPS) {
      middlewares.push(this.httpsEnforcement());
    }
    
    // 3. CORS handling
    if (this.options.enableCORS) {
      middlewares.push(this.corsHandler());
    }
    
    // 4. Rate limiting
    if (this.options.enableRateLimit) {
      middlewares.push(this.rateLimiting());
    }
    
    // 5. Authentication
    if (this.options.enableAuth) {
      middlewares.push(this.authentication());
    }
    
    // 6. Input validation
    if (this.options.enableValidation) {
      middlewares.push(this.inputValidation());
    }
    
    // 7. Request signing verification
    if (this.options.enableSigning) {
      middlewares.push(this.signatureVerification());
    }
    
    // 8. Encryption/Decryption
    if (this.options.enableEncryption) {
      middlewares.push(this.encryption());
    }
    
    // 9. Error boundary wrapper
    middlewares.push(this.errorBoundary());
    
    return middlewares;
  }
  
  /**
   * Security headers middleware
   */
  securityHeaders() {
    return (req, res, next) => {
      // Apply all security headers
      this.secureComm.applySecurityHeaders(req, res, next);
    };
  }
  
  /**
   * HTTPS enforcement middleware
   */
  httpsEnforcement() {
    return (req, res, next) => {
      if (this.secureComm.enforceHTTPS(req, res)) {
        // Request was redirected to HTTPS
        return;
      }
      next();
    };
  }
  
  /**
   * CORS handler middleware
   */
  corsHandler() {
    return (req, res, next) => {
      if (this.secureComm.handleCORS(req, res)) {
        // Preflight request handled
        return;
      }
      next();
    };
  }
  
  /**
   * Rate limiting middleware
   */
  rateLimiting() {
    return async (req, res, next) => {
      // Determine rate limiter based on endpoint
      let limiterName = 'api';
      
      if (req.path.startsWith('/auth')) {
        limiterName = 'auth';
      } else if (req.path.startsWith('/upload')) {
        limiterName = 'upload';
      } else if (req.path.startsWith('/command')) {
        limiterName = 'command';
      }
      
      const key = req.ip || req.connection.remoteAddress;
      const result = await rateLimiterManager.limit(limiterName, key);
      
      if (!result.allowed) {
        res.status(429).json({
          error: result.message,
          retryAfter: result.retryAfter
        });
        return;
      }
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': result.limit || 100,
        'X-RateLimit-Remaining': result.remaining || 0,
        'X-RateLimit-Reset': new Date(result.resetTime || Date.now()).toISOString()
      });
      
      next();
    };
  }
  
  /**
   * Authentication middleware
   */
  authentication() {
    return async (req, res, next) => {
      // Skip auth for public endpoints
      if (this.isPublicEndpoint(req.path)) {
        return next();
      }
      
      try {
        // Check for JWT token
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          const result = await jwtManager.verifyToken(token);
          
          if (!result.valid) {
            return res.status(401).json({ error: 'Invalid token' });
          }
          
          req.user = result;
        }
        
        // Check for session
        const sessionId = sessionManager.parseSessionCookie(req.headers.cookie);
        if (sessionId) {
          const session = await sessionManager.validateSession(sessionId, {
            checkIp: true,
            ipAddress: req.ip,
            checkUserAgent: true,
            userAgent: req.headers['user-agent']
          });
          
          if (session.valid) {
            req.session = session.session;
            if (!req.user) {
              req.user = { userId: session.session.userId };
            }
          }
        }
        
        // Require authentication
        if (!req.user) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        
        next();
      } catch (error) {
        logger.error('Authentication error:', error);
        res.status(401).json({ error: 'Authentication failed' });
      }
    };
  }
  
  /**
   * Input validation middleware
   */
  inputValidation() {
    return (req, res, next) => {
      // Validate all input sources
      const sources = ['body', 'query', 'params'];
      
      for (const source of sources) {
        if (req[source]) {
          // Check for injection attacks
          const checkInput = (input) => {
            if (typeof input === 'string') {
              const attacks = validator.detectAttacks(input);
              if (attacks.length > 0) {
                throw new Error(`Security threat detected: ${attacks.join(', ')}`);
              }
            } else if (typeof input === 'object' && input !== null) {
              Object.values(input).forEach(checkInput);
            }
          };
          
          try {
            checkInput(req[source]);
            
            // Sanitize input
            if (source === 'body' && req[source]) {
              req[source] = validator.sanitizeObject(req[source]);
            }
          } catch (error) {
            errorTelemetry.recordError(error, {
              type: 'input_validation',
              severity: 'high',
              source,
              path: req.path
            });
            
            return res.status(400).json({ error: error.message });
          }
        }
      }
      
      next();
    };
  }
  
  /**
   * Signature verification middleware
   */
  signatureVerification() {
    return (req, res, next) => {
      const result = this.secureComm.verifySignature(req);
      
      if (!result.valid) {
        return res.status(401).json({ error: result.error });
      }
      
      next();
    };
  }
  
  /**
   * Encryption/Decryption middleware
   */
  encryption() {
    return (req, res, next) => {
      // Decrypt request body if encrypted
      if (req.body && req.body.encrypted) {
        try {
          req.body = this.secureComm.decryptData(req.body);
        } catch (error) {
          return res.status(400).json({ error: 'Decryption failed' });
        }
      }
      
      // Override res.json to encrypt responses
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        if (this.options.enableEncryption) {
          data = this.secureComm.encryptData(data);
        }
        return originalJson(data);
      };
      
      next();
    };
  }
  
  /**
   * Error boundary middleware
   */
  errorBoundary() {
    return async (req, res, next) => {
      const boundary = errorBoundaryManager.create(`request-${req.path}`, {
        fallback: (error) => {
          logger.error('Request error:', error);
          return {
            error: 'An error occurred processing your request',
            requestId: req.id
          };
        }
      });
      
      try {
        await boundary.execute(async () => {
          next();
        });
      } catch (error) {
        const fallbackResponse = await boundary.executeFallback({ req, res });
        res.status(500).json(fallbackResponse);
      }
    };
  }
  
  /**
   * Create authorization middleware for specific permission
   */
  requirePermission(permission) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const hasPermission = rbacManager.hasPermission(
        req.user.userId,
        permission,
        {
          ipAddress: req.ip,
          resource: req.params.id ? { id: req.params.id } : null
        }
      );
      
      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      next();
    };
  }
  
  /**
   * Create role requirement middleware
   */
  requireRole(role) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (!rbacManager.hasRole(req.user.userId, role)) {
        return res.status(403).json({ error: `Role required: ${role}` });
      }
      
      next();
    };
  }
  
  /**
   * Check if endpoint is public
   */
  isPublicEndpoint(path) {
    const publicEndpoints = [
      '/health',
      '/status',
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/public'
    ];
    
    return publicEndpoints.some(endpoint => path.startsWith(endpoint));
  }
  
  /**
   * CSP violation report handler
   */
  handleCSPReport() {
    return (req, res) => {
      if (req.body && req.body['csp-report']) {
        this.secureComm.handleCSPViolation(req.body['csp-report']);
      }
      res.status(204).end();
    };
  }
  
  /**
   * Get security statistics
   */
  getStats() {
    return {
      communication: this.secureComm.getStats(),
      rateLimit: rateLimiterManager.getAllStats(),
      jwt: jwtManager.getStats(),
      sessions: sessionManager.getStats(),
      rbac: rbacManager.getStats(),
      validation: validator.getStats(),
      telemetry: errorTelemetry.getReport()
    };
  }
}

// Create singleton instance
let instance = null;

function getSecurityMiddleware(options) {
  if (!instance) {
    instance = new SecurityMiddleware(options);
  }
  return instance;
}

// Export convenience methods
module.exports = {
  SecurityMiddleware,
  getSecurityMiddleware,
  securityMiddleware: getSecurityMiddleware(),
  
  // Quick middleware creators
  createSecurityStack: (options) => {
    const middleware = getSecurityMiddleware(options);
    return middleware.createMiddlewareStack();
  },
  
  requireAuth: () => {
    const middleware = getSecurityMiddleware();
    return middleware.authentication();
  },
  
  requirePermission: (permission) => {
    const middleware = getSecurityMiddleware();
    return middleware.requirePermission(permission);
  },
  
  requireRole: (role) => {
    const middleware = getSecurityMiddleware();
    return middleware.requireRole(role);
  }
};