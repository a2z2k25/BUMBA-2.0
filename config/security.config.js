/**
 * BUMBA Security Configuration Module
 */

module.exports = {
  load(customSecurity = {}) {
    return {
      // Authentication
      authentication: {
        enabled: customSecurity.authentication?.enabled || false,
        provider: customSecurity.authentication?.provider || 'jwt',
        jwt: {
          secret: process.env.JWT_SECRET || 'bumba-default-secret-change-me',
          expiresIn: customSecurity.authentication?.jwt?.expiresIn || '24h',
          algorithm: customSecurity.authentication?.jwt?.algorithm || 'HS256'
        },
        oauth: {
          providers: customSecurity.authentication?.oauth?.providers || [],
          callbackUrl: customSecurity.authentication?.oauth?.callbackUrl
        }
      },
      
      // Authorization
      authorization: {
        enabled: customSecurity.authorization?.enabled || false,
        type: customSecurity.authorization?.type || 'rbac', // rbac, abac, custom
        roles: {
          admin: {
            permissions: ['*'],
            priority: 1
          },
          user: {
            permissions: ['read', 'write', 'execute'],
            priority: 2
          },
          guest: {
            permissions: ['read'],
            priority: 3
          },
          ...customSecurity.authorization?.roles
        },
        defaultRole: customSecurity.authorization?.defaultRole || 'guest'
      },
      
      // Input validation
      validation: {
        enabled: customSecurity.validation?.enabled !== false,
        rules: {
          commands: {
            maxLength: 1000,
            pattern: /^[a-zA-Z0-9\s\-_:]+$/,
            blacklist: ['eval', 'exec', 'require', 'import'],
            sanitize: true
          },
          inputs: {
            maxLength: 10000,
            stripHtml: true,
            escapeSpecial: true
          },
          files: {
            maxSize: 10 * 1024 * 1024, // 10MB
            allowedTypes: ['.js', '.json', '.md', '.txt'],
            scanForMalware: false
          },
          ...customSecurity.validation?.rules
        }
      },
      
      // Rate limiting
      rateLimit: {
        enabled: customSecurity.rateLimit?.enabled || false,
        global: {
          windowMs: customSecurity.rateLimit?.global?.windowMs || 60000, // 1 min
          max: customSecurity.rateLimit?.global?.max || 100
        },
        perCommand: {
          windowMs: customSecurity.rateLimit?.perCommand?.windowMs || 60000,
          max: customSecurity.rateLimit?.perCommand?.max || 10
        },
        perUser: {
          windowMs: customSecurity.rateLimit?.perUser?.windowMs || 60000,
          max: customSecurity.rateLimit?.perUser?.max || 50
        }
      },
      
      // Encryption
      encryption: {
        algorithm: customSecurity.encryption?.algorithm || 'aes-256-gcm',
        key: process.env.ENCRYPTION_KEY || Buffer.from('bumba-default-key-32-bytes-long!').toString('base64'),
        iv: customSecurity.encryption?.iv || 16,
        saltRounds: customSecurity.encryption?.saltRounds || 10
      },
      
      // Audit logging
      audit: {
        enabled: customSecurity.audit?.enabled || false,
        logLevel: customSecurity.audit?.logLevel || 'info',
        events: {
          authentication: true,
          authorization: true,
          commands: true,
          errors: true,
          dataAccess: true,
          configChanges: true,
          ...customSecurity.audit?.events
        },
        storage: {
          type: customSecurity.audit?.storage?.type || 'file',
          path: customSecurity.audit?.storage?.path || './logs/audit',
          rotation: customSecurity.audit?.storage?.rotation || 'daily',
          retention: customSecurity.audit?.storage?.retention || 30 // days
        }
      },
      
      // Security headers
      headers: {
        enabled: customSecurity.headers?.enabled || false,
        csp: customSecurity.headers?.csp || "default-src 'self'",
        hsts: customSecurity.headers?.hsts || 'max-age=31536000; includeSubDomains',
        xFrameOptions: customSecurity.headers?.xFrameOptions || 'DENY',
        xContentType: customSecurity.headers?.xContentType || 'nosniff',
        referrerPolicy: customSecurity.headers?.referrerPolicy || 'strict-origin-when-cross-origin'
      },
      
      // Sandbox
      sandbox: {
        enabled: customSecurity.sandbox?.enabled || false,
        restrictions: {
          network: customSecurity.sandbox?.restrictions?.network || false,
          filesystem: customSecurity.sandbox?.restrictions?.filesystem || 'readonly',
          processes: customSecurity.sandbox?.restrictions?.processes || false
        },
        timeout: customSecurity.sandbox?.timeout || 30000,
        memory: customSecurity.sandbox?.memory || 256 * 1024 * 1024 // 256MB
      },
      
      // Blocked patterns
      blocked: {
        commands: customSecurity.blocked?.commands || [
          'rm -rf',
          'format c:',
          'del /f',
          'eval',
          'exec'
        ],
        paths: customSecurity.blocked?.paths || [
          '/etc',
          '/sys',
          '/proc',
          'C:\\Windows',
          'C:\\System'
        ],
        patterns: customSecurity.blocked?.patterns || [
          /\$\{.*\}/g, // Template injection
          /<script.*?>/gi, // XSS
          /';.*--/g // SQL injection
        ]
      },
      
      // CORS
      cors: {
        enabled: customSecurity.cors?.enabled || false,
        origin: customSecurity.cors?.origin || '*',
        methods: customSecurity.cors?.methods || ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: customSecurity.cors?.credentials || false,
        maxAge: customSecurity.cors?.maxAge || 86400
      }
    };
  }
};