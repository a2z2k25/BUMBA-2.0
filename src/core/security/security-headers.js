/**
 * BUMBA Security Headers Middleware
 * Implements security best practices for HTTP headers
 */

const crypto = require('crypto');

/**
 * Generate a nonce for Content Security Policy
 */
function generateNonce() {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Default security headers configuration
 */
const defaultConfig = {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Consider removing unsafe-inline in production
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      sandbox: ['allow-forms', 'allow-scripts', 'allow-same-origin'],
      reportUri: '/api/csp-report',
      upgradeInsecureRequests: []
    }
  },
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // Other security headers
  noSniff: true,
  frameGuard: 'DENY',
  xssFilter: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    camera: 'none',
    microphone: 'none',
    geolocation: 'none',
    payment: 'none',
    usb: 'none',
    magnetometer: 'none',
    gyroscope: 'none',
    accelerometer: 'none'
  }
};

/**
 * Configure security headers for Express/Connect app
 */
function configureSecurityHeaders(app, options = {}) {
  const config = { ...defaultConfig, ...options };
  
  // If helmet is available, use it
  try {
    const helmet = require('helmet');
    
    app.use(helmet({
      contentSecurityPolicy: config.contentSecurityPolicy,
      hsts: config.hsts,
      noSniff: config.noSniff,
      frameguard: { action: config.frameGuard.toLowerCase() },
      xssFilter: config.xssFilter,
      referrerPolicy: { policy: config.referrerPolicy }
    }));
    
    // Add Permissions-Policy header (not in helmet)
    app.use((req, res, next) => {
      const permissions = Object.entries(config.permissionsPolicy)
        .map(([feature, value]) => `${feature}=(${value})`)
        .join(', ');
      res.setHeader('Permissions-Policy', permissions);
      next();
    });
    
  } catch (error) {
    // Helmet not available, implement manually
    app.use(securityHeadersMiddleware(config));
  }
  
  // CSP nonce middleware (if needed)
  if (config.enableNonce) {
    app.use((req, res, next) => {
      res.locals.nonce = generateNonce();
      next();
    });
  }
}

/**
 * Manual security headers middleware (when helmet is not available)
 */
function securityHeadersMiddleware(config = {}) {
  const mergedConfig = { ...defaultConfig, ...config };
  
  return function(req, res, next) {
    // Content Security Policy
    if (mergedConfig.contentSecurityPolicy) {
      const cspDirectives = Object.entries(mergedConfig.contentSecurityPolicy.directives)
        .map(([directive, values]) => {
          const directiveName = directive.replace(/([A-Z])/g, '-$1').toLowerCase();
          if (values.length === 0) {return directiveName;}
          return `${directiveName} ${values.join(' ')}`;
        })
        .join('; ');
      
      res.setHeader('Content-Security-Policy', cspDirectives);
    }
    
    // HTTP Strict Transport Security
    if (mergedConfig.hsts) {
      let hstsValue = `max-age=${mergedConfig.hsts.maxAge}`;
      if (mergedConfig.hsts.includeSubDomains) {
        hstsValue += '; includeSubDomains';
      }
      if (mergedConfig.hsts.preload) {
        hstsValue += '; preload';
      }
      res.setHeader('Strict-Transport-Security', hstsValue);
    }
    
    // X-Content-Type-Options
    if (mergedConfig.noSniff) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
    
    // X-Frame-Options
    if (mergedConfig.frameGuard) {
      res.setHeader('X-Frame-Options', mergedConfig.frameGuard);
    }
    
    // X-XSS-Protection
    if (mergedConfig.xssFilter) {
      res.setHeader('X-XSS-Protection', '1; mode=block');
    }
    
    // Referrer-Policy
    if (mergedConfig.referrerPolicy) {
      res.setHeader('Referrer-Policy', mergedConfig.referrerPolicy);
    }
    
    // Permissions-Policy
    if (mergedConfig.permissionsPolicy) {
      const permissions = Object.entries(mergedConfig.permissionsPolicy)
        .map(([feature, value]) => `${feature}=(${value})`)
        .join(', ');
      res.setHeader('Permissions-Policy', permissions);
    }
    
    // Remove potentially dangerous headers
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    
    next();
  };
}

/**
 * CSP Report handler
 */
function cspReportHandler(logger) {
  return function(req, res) {
    if (req.body && req.body['csp-report']) {
      const report = req.body['csp-report'];
      
      // Log CSP violation
      if (logger) {
        logger.warn('CSP Violation:', {
          documentUri: report['document-uri'],
          violatedDirective: report['violated-directive'],
          blockedUri: report['blocked-uri'],
          lineNumber: report['line-number'],
          columnNumber: report['column-number'],
          sourceFile: report['source-file']
        });
      } else {
        console.warn('CSP Violation:', report);
      }
    }
    
    res.status(204).end();
  };
}

/**
 * Security headers for API responses
 */
function apiSecurityHeaders() {
  return function(req, res, next) {
    // Prevent caching of sensitive data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Additional API security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    next();
  };
}

/**
 * CORS configuration with security in mind
 */
function secureCors(options = {}) {
  const defaults = {
    origin: false, // No CORS by default
    credentials: false,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: [],
    maxAge: 86400 // 24 hours
  };
  
  const config = { ...defaults, ...options };
  
  return function(req, res, next) {
    const origin = req.headers.origin;
    
    // Check if origin is allowed
    if (config.origin) {
      let isAllowed = false;
      
      if (typeof config.origin === 'function') {
        isAllowed = config.origin(origin);
      } else if (config.origin === true) {
        isAllowed = true;
      } else if (typeof config.origin === 'string') {
        isAllowed = origin === config.origin;
      } else if (Array.isArray(config.origin)) {
        isAllowed = config.origin.includes(origin);
      }
      
      if (isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
        
        if (config.credentials) {
          res.setHeader('Access-Control-Allow-Credentials', 'true');
        }
        
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Methods', config.methods.join(', '));
          res.setHeader('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
          res.setHeader('Access-Control-Max-Age', config.maxAge);
          
          if (config.exposedHeaders.length > 0) {
            res.setHeader('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
          }
          
          return res.status(204).end();
        }
      }
    }
    
    next();
  };
}

/**
 * Create security report endpoint
 */
function createSecurityReportEndpoint(app, path = '/api/security-report') {
  app.post(path, express.json({ type: 'application/csp-report' }), (req, res) => {
    const report = req.body;
    
    // Validate report
    if (!report || typeof report !== 'object') {
      return res.status(400).json({ error: 'Invalid report' });
    }
    
    // Process different types of security reports
    if (report['csp-report']) {
      // CSP violation
      handleCSPReport(report['csp-report']);
    } else if (report.type === 'hpkp-report') {
      // HPKP violation
      handleHPKPReport(report);
    } else if (report.type === 'ct-report') {
      // Certificate Transparency report
      handleCTReport(report);
    }
    
    res.status(204).end();
  });
}

// Create a SecurityHeaders class to follow standard pattern
class SecurityHeaders {
  constructor() {
    this.defaultConfig = defaultConfig;
    this.generateNonce = generateNonce;
  }
  
  configureSecurityHeaders = configureSecurityHeaders;
  securityHeadersMiddleware = securityHeadersMiddleware;
  cspReportHandler = cspReportHandler;
  apiSecurityHeaders = apiSecurityHeaders;
  secureCors = secureCors;
  createSecurityReportEndpoint = createSecurityReportEndpoint;
}

module.exports = {
  SecurityHeaders,  // Standard class export
  configureSecurityHeaders,
  securityHeadersMiddleware,
  cspReportHandler,
  apiSecurityHeaders,
  secureCors,
  createSecurityReportEndpoint,
  generateNonce,
  defaultConfig
};