/**
 * BUMBA RBAC (Role-Based Access Control) System
 * Secure permission management for the framework
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');

class RBACSystem extends EventEmitter {
  constructor() {
    super();
    
    // Define roles with their permissions
    this.roles = new Map([
      ['admin', { 
        permissions: ['*'],
        description: 'Full system access'
      }],
      ['developer', { 
        permissions: ['read', 'write', 'execute', 'debug'],
        description: 'Standard developer access'
      }],
      ['contributor', {
        permissions: ['read', 'write', 'test'],
        description: 'Contributor access for pull requests'
      }],
      ['viewer', { 
        permissions: ['read'],
        description: 'Read-only access'
      }],
      ['bot', {
        permissions: ['read', 'execute', 'report'],
        description: 'Automated system access'
      }]
    ]);
    
    // User to role mapping
    this.users = new Map();
    
    // Resource-specific permissions
    this.resourcePermissions = new Map();
    
    // Permission cache for performance
    this.permissionCache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
  }

  /**
   * Check if a user has permission to perform an action
   */
  async checkPermission(user, resource, action) {
    if (!user || !resource || !action) {
      return false;
    }
    
    // Check cache first
    const cacheKey = `${user}:${resource}:${action}`;
    const cached = this.permissionCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.allowed;
    }
    
    // Get user's role
    const userRole = this.users.get(user);
    if (!userRole) {
      this.cachePermission(cacheKey, false);
      return false;
    }
    
    // Get role permissions
    const role = this.roles.get(userRole);
    if (!role) {
      this.cachePermission(cacheKey, false);
      return false;
    }
    
    // Check for wildcard permission
    if (role.permissions.includes('*')) {
      this.cachePermission(cacheKey, true);
      return true;
    }
    
    // Check specific permission
    const hasPermission = role.permissions.includes(action);
    
    // Check resource-specific permissions
    const resourcePerms = this.resourcePermissions.get(resource);
    if (resourcePerms) {
      const userResourcePerms = resourcePerms.get(user);
      if (userResourcePerms && userResourcePerms.includes(action)) {
        this.cachePermission(cacheKey, true);
        return true;
      }
    }
    
    this.cachePermission(cacheKey, hasPermission);
    return hasPermission;
  }

  /**
   * Cache permission result
   */
  cachePermission(key, allowed) {
    this.permissionCache.set(key, {
      allowed,
      expires: Date.now() + this.cacheTimeout
    });
  }

  /**
   * Assign a role to a user
   */
  assignRole(user, role) {
    if (!this.roles.has(role)) {
      throw new Error(`Unknown role: ${role}`);
    }
    
    const previousRole = this.users.get(user);
    this.users.set(user, role);
    
    // Clear permission cache for this user
    this.clearUserCache(user);
    
    this.emit('role-assigned', {
      user,
      role,
      previousRole,
      timestamp: Date.now()
    });
    
    return true;
  }

  /**
   * Remove a user's role
   */
  removeUserRole(user) {
    const role = this.users.get(user);
    if (role) {
      this.users.delete(user);
      this.clearUserCache(user);
      
      this.emit('role-removed', {
        user,
        role,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Grant specific permission on a resource
   */
  grantResourcePermission(user, resource, permissions) {
    if (!Array.isArray(permissions)) {
      permissions = [permissions];
    }
    
    if (!this.resourcePermissions.has(resource)) {
      this.resourcePermissions.set(resource, new Map());
    }
    
    const resourcePerms = this.resourcePermissions.get(resource);
    const currentPerms = resourcePerms.get(user) || [];
    const newPerms = [...new Set([...currentPerms, ...permissions])];
    
    resourcePerms.set(user, newPerms);
    this.clearUserCache(user);
    
    this.emit('resource-permission-granted', {
      user,
      resource,
      permissions: newPerms,
      timestamp: Date.now()
    });
  }

  /**
   * Revoke specific permission on a resource
   */
  revokeResourcePermission(user, resource, permissions) {
    const resourcePerms = this.resourcePermissions.get(resource);
    if (!resourcePerms) {return;}
    
    const userPerms = resourcePerms.get(user);
    if (!userPerms) {return;}
    
    if (!Array.isArray(permissions)) {
      permissions = [permissions];
    }
    
    const newPerms = userPerms.filter(perm => !permissions.includes(perm));
    
    if (newPerms.length === 0) {
      resourcePerms.delete(user);
    } else {
      resourcePerms.set(user, newPerms);
    }
    
    this.clearUserCache(user);
    
    this.emit('resource-permission-revoked', {
      user,
      resource,
      revokedPermissions: permissions,
      timestamp: Date.now()
    });
  }

  /**
   * Create a new role
   */
  createRole(name, permissions, description) {
    if (this.roles.has(name)) {
      throw new Error(`Role already exists: ${name}`);
    }
    
    this.roles.set(name, {
      permissions: Array.isArray(permissions) ? permissions : [permissions],
      description
    });
    
    this.emit('role-created', {
      name,
      permissions,
      description,
      timestamp: Date.now()
    });
  }

  /**
   * Get user's effective permissions
   */
  getUserPermissions(user) {
    const role = this.users.get(user);
    if (!role) {return [];}
    
    const roleData = this.roles.get(role);
    if (!roleData) {return [];}
    
    const permissions = new Set(roleData.permissions);
    
    // Add resource-specific permissions
    for (const [resource, resourcePerms] of this.resourcePermissions) {
      const userPerms = resourcePerms.get(user);
      if (userPerms) {
        userPerms.forEach(perm => permissions.add(`${resource}:${perm}`));
      }
    }
    
    return Array.from(permissions);
  }

  /**
   * Clear permission cache for a user
   */
  clearUserCache(user) {
    for (const key of this.permissionCache.keys()) {
      if (key.startsWith(`${user}:`)) {
        this.permissionCache.delete(key);
      }
    }
  }

  /**
   * Clear entire permission cache
   */
  clearCache() {
    this.permissionCache.clear();
  }

  /**
   * Get all users with a specific role
   */
  getUsersByRole(role) {
    const users = [];
    for (const [user, userRole] of this.users) {
      if (userRole === role) {
        users.push(user);
      }
    }
    return users;
  }

  /**
   * Export RBAC configuration
   */
  exportConfiguration() {
    return {
      roles: Object.fromEntries(this.roles),
      users: Object.fromEntries(this.users),
      resourcePermissions: Object.fromEntries(
        Array.from(this.resourcePermissions.entries()).map(([resource, perms]) => [
          resource,
          Object.fromEntries(perms)
        ])
      )
    };
  }

  /**
   * Import RBAC configuration
   */
  importConfiguration(config) {
    if (config.roles) {
      this.roles = new Map(Object.entries(config.roles));
    }
    if (config.users) {
      this.users = new Map(Object.entries(config.users));
    }
    if (config.resourcePermissions) {
      this.resourcePermissions = new Map(
        Object.entries(config.resourcePermissions).map(([resource, perms]) => [
          resource,
          new Map(Object.entries(perms))
        ])
      );
    }
    this.clearCache();
  }

  /**
   * Generate API key with specific permissions
   */
  generateAPIKey(permissions, expiresIn = 86400000) { // 24 hours default
    const key = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + expiresIn;
    
    // Store API key as a special user
    const apiUser = `api_${key.substring(0, 8)}`;
    this.users.set(apiUser, 'bot');
    
    // Grant specific permissions if not using bot defaults
    if (permissions && permissions.length > 0) {
      this.grantResourcePermission(apiUser, '*', permissions);
    }
    
    return {
      key,
      user: apiUser,
      expires,
      permissions: permissions || this.roles.get('bot').permissions
    };
  }

  /**
   * Validate API key
   */
  validateAPIKey(key) {
    const apiUser = `api_${key.substring(0, 8)}`;
    return this.users.has(apiUser);
  }

  /**
   * Grant permission to a role or user
   */
  grantPermission(target, permission, isRole = false) {
    if (isRole) {
      // Grant to role
      const role = this.roles.get(target);
      if (!role) {
        throw new Error(`Role not found: ${target}`);
      }
      
      if (!role.permissions.includes(permission)) {
        role.permissions.push(permission);
        this.clearCache();
        
        this.emit('permission-granted', {
          type: 'role',
          target,
          permission,
          timestamp: Date.now()
        });
      }
    } else {
      // Grant to user via resource permissions
      this.grantResourcePermission(target, '*', permission);
    }
    
    return true;
  }

  /**
   * Revoke permission from a role or user
   */
  revokePermission(target, permission, isRole = false) {
    if (isRole) {
      // Revoke from role
      const role = this.roles.get(target);
      if (!role) {
        throw new Error(`Role not found: ${target}`);
      }
      
      const index = role.permissions.indexOf(permission);
      if (index > -1) {
        role.permissions.splice(index, 1);
        this.clearCache();
        
        this.emit('permission-revoked', {
          type: 'role',
          target,
          permission,
          timestamp: Date.now()
        });
      }
    } else {
      // Revoke from user
      this.revokeResourcePermission(target, '*', permission);
    }
    
    return true;
  }

  /**
   * Get all roles assigned to a user
   */
  getUserRoles(user) {
    const directRole = this.users.get(user);
    const roles = [];
    
    if (directRole) {
      roles.push({
        name: directRole,
        type: 'direct',
        permissions: this.roles.get(directRole).permissions
      });
    }
    
    // Check for any resource-specific roles
    for (const [resource, perms] of this.resourcePermissions) {
      const userPerms = perms.get(user);
      if (userPerms && userPerms.length > 0) {
        roles.push({
          name: `resource_${resource}`,
          type: 'resource',
          permissions: userPerms,
          resource
        });
      }
    }
    
    return roles;
  }

  /**
   * Enforce a security policy
   */
  async enforcePolicy(policy, context = {}) {
    const { user, resource, action, conditions = {} } = context;
    
    // Policy types
    switch (policy) {
      case 'mfa_required':
        if (!conditions.mfaVerified) {
          return {
            allowed: false,
            reason: 'Multi-factor authentication required',
            policy
          };
        }
        break;
      
      case 'time_based':
        const now = new Date();
        const hour = now.getHours();
        if (conditions.allowedHours && !conditions.allowedHours.includes(hour)) {
          return {
            allowed: false,
            reason: `Access not allowed at this time (${hour}:00)`,
            policy
          };
        }
        break;
      
      case 'ip_whitelist':
        if (conditions.allowedIPs && !conditions.allowedIPs.includes(context.ip)) {
          return {
            allowed: false,
            reason: 'IP address not whitelisted',
            policy
          };
        }
        break;
      
      case 'rate_limit':
        // Check rate limit
        const rateLimitKey = `${user}:${resource}:${action}`;
        const attempts = this.rateLimitAttempts?.get(rateLimitKey) || 0;
        
        if (attempts >= (conditions.maxAttempts || 100)) {
          return {
            allowed: false,
            reason: 'Rate limit exceeded',
            policy,
            attempts
          };
        }
        
        // Increment attempts
        if (!this.rateLimitAttempts) {
          this.rateLimitAttempts = new Map();
        }
        this.rateLimitAttempts.set(rateLimitKey, attempts + 1);
        
        // Reset after window
        setTimeout(() => {
          this.rateLimitAttempts.delete(rateLimitKey);
        }, conditions.windowMs || 60000);
        break;
      
      case 'data_classification':
        if (conditions.classification === 'confidential' && !this.hasConfidentialAccess(user)) {
          return {
            allowed: false,
            reason: 'Insufficient clearance for confidential data',
            policy
          };
        }
        break;
      
      default:
        // Check basic permission
        const hasPermission = await this.checkPermission(user, resource, action);
        if (!hasPermission) {
          return {
            allowed: false,
            reason: 'Permission denied',
            policy: 'default'
          };
        }
    }
    
    // Policy passed
    return {
      allowed: true,
      policy,
      user,
      resource,
      action,
      timestamp: Date.now()
    };
  }

  /**
   * Check if user has confidential data access
   */
  hasConfidentialAccess(user) {
    const role = this.users.get(user);
    return role === 'admin' || role === 'developer';
  }
}

// Singleton instance
let instance = null;

module.exports = {
  RBACSystem,
  
  // Get singleton instance
  getInstance() {
    if (!instance) {
      instance = new RBACSystem();
    }
    return instance;
  }
};