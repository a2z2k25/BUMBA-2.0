/**
 * Role-Based Access Control (RBAC) System
 * Fine-grained permission management
 * Sprint 14 - Security Fix
 */

const { logger } = require('../logging/bumba-logger');
const { stateManager } = require('../state/global-state-manager');
const { errorTelemetry } = require('../error-boundaries/error-telemetry');
const EventEmitter = require('events');

class RBACManager extends EventEmitter {
  constructor() {
    super();
    
    // Role and permission storage
    this.roles = new Map();
    this.permissions = new Map();
    this.userRoles = new Map(); // userId -> Set of roles
    this.roleHierarchy = new Map(); // role -> parent roles
    
    // Resource-based permissions
    this.resources = new Map();
    this.resourcePermissions = new Map();
    
    // Statistics
    this.stats = {
      rolesCreated: 0,
      permissionsCreated: 0,
      accessChecks: 0,
      accessGranted: 0,
      accessDenied: 0
    };
    
    // Register state
    stateManager.register('rbac', {
      stats: this.stats,
      roleCount: 0,
      permissionCount: 0
    });
    
    // Initialize default roles and permissions
    this.initializeDefaults();
  }
  
  /**
   * Initialize default roles and permissions
   */
  initializeDefaults() {
    // Default permissions
    const defaultPermissions = [
      // User permissions
      'user:read',
      'user:write',
      'user:delete',
      
      // Admin permissions
      'admin:access',
      'admin:users',
      'admin:roles',
      'admin:system',
      
      // Resource permissions
      'resource:create',
      'resource:read',
      'resource:update',
      'resource:delete',
      
      // API permissions
      'api:read',
      'api:write',
      'api:admin',
      
      // System permissions
      'system:config',
      'system:logs',
      'system:monitor',
      'system:debug'
    ];
    
    defaultPermissions.forEach(perm => this.createPermission(perm));
    
    // Default roles
    this.createRole('guest', {
      permissions: ['user:read'],
      description: 'Guest user with read-only access'
    });
    
    this.createRole('user', {
      permissions: ['user:read', 'user:write', 'resource:read', 'resource:create'],
      description: 'Standard user with basic permissions'
    });
    
    this.createRole('moderator', {
      permissions: ['user:read', 'user:write', 'resource:read', 'resource:update', 'resource:delete'],
      inherits: ['user'],
      description: 'Moderator with content management permissions'
    });
    
    this.createRole('admin', {
      permissions: ['admin:access', 'admin:users', 'admin:roles'],
      inherits: ['moderator'],
      description: 'Administrator with user management permissions'
    });
    
    this.createRole('superadmin', {
      permissions: ['admin:system', 'system:config', 'system:logs', 'system:monitor', 'system:debug'],
      inherits: ['admin'],
      description: 'Super administrator with full system access'
    });
  }
  
  /**
   * Create a new role
   */
  createRole(name, options = {}) {
    if (this.roles.has(name)) {
      logger.warn(`Role ${name} already exists`);
      return false;
    }
    
    const role = {
      name,
      permissions: new Set(options.permissions || []),
      inherits: options.inherits || [],
      description: options.description || '',
      createdAt: Date.now(),
      metadata: options.metadata || {}
    };
    
    // Validate permissions exist
    for (const perm of role.permissions) {
      if (!this.permissions.has(perm)) {
        logger.warn(`Permission ${perm} does not exist, creating it`);
        this.createPermission(perm);
      }
    }
    
    // Validate inherited roles exist
    for (const inheritedRole of role.inherits) {
      if (!this.roles.has(inheritedRole)) {
        throw new Error(`Cannot inherit from non-existent role: ${inheritedRole}`);
      }
    }
    
    this.roles.set(name, role);
    
    // Update hierarchy
    if (role.inherits.length > 0) {
      this.roleHierarchy.set(name, role.inherits);
    }
    
    this.stats.rolesCreated++;
    this.updateState();
    
    this.emit('role-created', { name, role });
    
    return true;
  }
  
  /**
   * Create a new permission
   */
  createPermission(name, options = {}) {
    if (this.permissions.has(name)) {
      return false;
    }
    
    const permission = {
      name,
      description: options.description || '',
      resource: options.resource || null,
      action: options.action || null,
      conditions: options.conditions || [],
      createdAt: Date.now()
    };
    
    // Parse permission format (resource:action)
    if (name.includes(':')) {
      const [resource, action] = name.split(':');
      permission.resource = resource;
      permission.action = action;
    }
    
    this.permissions.set(name, permission);
    
    this.stats.permissionsCreated++;
    this.updateState();
    
    return true;
  }
  
  /**
   * Assign role to user
   */
  assignRole(userId, roleName) {
    if (!this.roles.has(roleName)) {
      throw new Error(`Role ${roleName} does not exist`);
    }
    
    if (!this.userRoles.has(userId)) {
      this.userRoles.set(userId, new Set());
    }
    
    this.userRoles.get(userId).add(roleName);
    
    this.emit('role-assigned', { userId, roleName });
    
    logger.debug(`Role ${roleName} assigned to user ${userId}`);
    
    return true;
  }
  
  /**
   * Remove role from user
   */
  removeRole(userId, roleName) {
    const userRoles = this.userRoles.get(userId);
    
    if (!userRoles || !userRoles.has(roleName)) {
      return false;
    }
    
    userRoles.delete(roleName);
    
    if (userRoles.size === 0) {
      this.userRoles.delete(userId);
    }
    
    this.emit('role-removed', { userId, roleName });
    
    return true;
  }
  
  /**
   * Check if user has permission
   */
  hasPermission(userId, permission, context = {}) {
    this.stats.accessChecks++;
    
    // Get user's effective permissions
    const userPermissions = this.getUserPermissions(userId);
    
    // Check direct permission
    if (userPermissions.has(permission)) {
      this.stats.accessGranted++;
      this.updateState();
      return true;
    }
    
    // Check wildcard permissions
    if (this.checkWildcardPermission(userPermissions, permission)) {
      this.stats.accessGranted++;
      this.updateState();
      return true;
    }
    
    // Check resource-based permissions
    if (context.resource && this.checkResourcePermission(userId, permission, context.resource)) {
      this.stats.accessGranted++;
      this.updateState();
      return true;
    }
    
    // Check conditional permissions
    if (this.checkConditionalPermission(userId, permission, context)) {
      this.stats.accessGranted++;
      this.updateState();
      return true;
    }
    
    // Access denied
    this.stats.accessDenied++;
    this.updateState();
    
    // Log security event
    errorTelemetry.recordError(new Error('Access denied'), {
      type: 'access_control',
      severity: 'low',
      userId,
      permission,
      context
    });
    
    return false;
  }
  
  /**
   * Check if user has role
   */
  hasRole(userId, roleName) {
    const userRoles = this.userRoles.get(userId);
    
    if (!userRoles) return false;
    
    // Check direct role
    if (userRoles.has(roleName)) return true;
    
    // Check inherited roles
    for (const userRole of userRoles) {
      if (this.inheritsRole(userRole, roleName)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(userId, roleNames) {
    return roleNames.some(role => this.hasRole(userId, role));
  }
  
  /**
   * Check if user has all of the specified roles
   */
  hasAllRoles(userId, roleNames) {
    return roleNames.every(role => this.hasRole(userId, role));
  }
  
  /**
   * Get user's effective permissions
   */
  getUserPermissions(userId) {
    const permissions = new Set();
    const userRoles = this.userRoles.get(userId);
    
    if (!userRoles) return permissions;
    
    // Collect permissions from all roles (including inherited)
    for (const roleName of userRoles) {
      this.collectRolePermissions(roleName, permissions);
    }
    
    return permissions;
  }
  
  /**
   * Collect all permissions for a role (including inherited)
   */
  collectRolePermissions(roleName, permissions = new Set()) {
    const role = this.roles.get(roleName);
    
    if (!role) return permissions;
    
    // Add direct permissions
    for (const perm of role.permissions) {
      permissions.add(perm);
    }
    
    // Add inherited permissions
    for (const inheritedRole of role.inherits) {
      this.collectRolePermissions(inheritedRole, permissions);
    }
    
    return permissions;
  }
  
  /**
   * Check if role inherits from another role
   */
  inheritsRole(childRole, parentRole) {
    const role = this.roles.get(childRole);
    
    if (!role) return false;
    
    // Check direct inheritance
    if (role.inherits.includes(parentRole)) return true;
    
    // Check recursive inheritance
    for (const inherited of role.inherits) {
      if (this.inheritsRole(inherited, parentRole)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check wildcard permission
   */
  checkWildcardPermission(userPermissions, requiredPermission) {
    // Check for wildcard permissions (e.g., admin:* matches admin:users)
    for (const userPerm of userPermissions) {
      if (userPerm.endsWith(':*')) {
        const prefix = userPerm.slice(0, -1); // Remove *
        if (requiredPermission.startsWith(prefix)) {
          return true;
        }
      }
      
      // Check for superadmin wildcard
      if (userPerm === '*' || userPerm === 'admin:*') {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check resource-based permission
   */
  checkResourcePermission(userId, permission, resource) {
    // Check if user owns the resource
    if (resource.ownerId === userId) {
      // Owner typically has full permissions
      return true;
    }
    
    // Check specific resource permissions
    const resourcePerms = this.resourcePermissions.get(resource.id);
    if (resourcePerms) {
      const userPerms = resourcePerms.get(userId);
      if (userPerms && userPerms.has(permission)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check conditional permission
   */
  checkConditionalPermission(userId, permission, context) {
    const perm = this.permissions.get(permission);
    
    if (!perm || !perm.conditions || perm.conditions.length === 0) {
      return false;
    }
    
    // Evaluate conditions
    for (const condition of perm.conditions) {
      if (!this.evaluateCondition(condition, userId, context)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Evaluate a permission condition
   */
  evaluateCondition(condition, userId, context) {
    switch (condition.type) {
      case 'time':
        // Check time-based conditions
        const now = new Date();
        if (condition.startTime && now < new Date(condition.startTime)) return false;
        if (condition.endTime && now > new Date(condition.endTime)) return false;
        return true;
      
      case 'ip':
        // Check IP-based conditions
        if (!context.ipAddress) return false;
        return condition.allowedIPs.includes(context.ipAddress);
      
      case 'custom':
        // Custom condition function
        if (typeof condition.evaluate === 'function') {
          return condition.evaluate(userId, context);
        }
        return false;
      
      default:
        return false;
    }
  }
  
  /**
   * Grant permission to resource
   */
  grantResourcePermission(resourceId, userId, permissions) {
    if (!this.resourcePermissions.has(resourceId)) {
      this.resourcePermissions.set(resourceId, new Map());
    }
    
    const resourcePerms = this.resourcePermissions.get(resourceId);
    
    if (!resourcePerms.has(userId)) {
      resourcePerms.set(userId, new Set());
    }
    
    const userPerms = resourcePerms.get(userId);
    
    if (Array.isArray(permissions)) {
      permissions.forEach(p => userPerms.add(p));
    } else {
      userPerms.add(permissions);
    }
    
    this.emit('resource-permission-granted', {
      resourceId,
      userId,
      permissions
    });
    
    return true;
  }
  
  /**
   * Revoke permission from resource
   */
  revokeResourcePermission(resourceId, userId, permissions) {
    const resourcePerms = this.resourcePermissions.get(resourceId);
    
    if (!resourcePerms || !resourcePerms.has(userId)) {
      return false;
    }
    
    const userPerms = resourcePerms.get(userId);
    
    if (Array.isArray(permissions)) {
      permissions.forEach(p => userPerms.delete(p));
    } else {
      userPerms.delete(permissions);
    }
    
    if (userPerms.size === 0) {
      resourcePerms.delete(userId);
    }
    
    if (resourcePerms.size === 0) {
      this.resourcePermissions.delete(resourceId);
    }
    
    return true;
  }
  
  /**
   * Get user roles
   */
  getUserRoles(userId) {
    const userRoles = this.userRoles.get(userId);
    return userRoles ? Array.from(userRoles) : [];
  }
  
  /**
   * Get role details
   */
  getRole(roleName) {
    const role = this.roles.get(roleName);
    
    if (!role) return null;
    
    return {
      name: role.name,
      permissions: Array.from(role.permissions),
      inherits: role.inherits,
      description: role.description,
      effectivePermissions: Array.from(this.collectRolePermissions(roleName))
    };
  }
  
  /**
   * List all roles
   */
  getAllRoles() {
    const roles = [];
    
    for (const [name, role] of this.roles) {
      roles.push({
        name,
        permissions: Array.from(role.permissions),
        inherits: role.inherits,
        description: role.description
      });
    }
    
    return roles;
  }
  
  /**
   * List all permissions
   */
  getAllPermissions() {
    const permissions = [];
    
    for (const [name, perm] of this.permissions) {
      permissions.push({
        name,
        description: perm.description,
        resource: perm.resource,
        action: perm.action
      });
    }
    
    return permissions;
  }
  
  /**
   * Update state
   */
  updateState() {
    stateManager.set('rbac', 'stats', this.stats);
    stateManager.set('rbac', 'roleCount', this.roles.size);
    stateManager.set('rbac', 'permissionCount', this.permissions.size);
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalRoles: this.roles.size,
      totalPermissions: this.permissions.size,
      totalUsers: this.userRoles.size,
      totalResourcePermissions: this.resourcePermissions.size,
      accessGrantRate: this.stats.accessChecks > 0 
        ? (this.stats.accessGranted / this.stats.accessChecks * 100).toFixed(2) + '%'
        : '0%'
    };
  }
  
  /**
   * Reset all roles and permissions (dangerous!)
   */
  reset() {
    this.roles.clear();
    this.permissions.clear();
    this.userRoles.clear();
    this.roleHierarchy.clear();
    this.resources.clear();
    this.resourcePermissions.clear();
    
    this.stats = {
      rolesCreated: 0,
      permissionsCreated: 0,
      accessChecks: 0,
      accessGranted: 0,
      accessDenied: 0
    };
    
    this.updateState();
    this.initializeDefaults();
  }
}

// Singleton instance
let instance = null;

function getRBACManager() {
  if (!instance) {
    instance = new RBACManager();
  }
  return instance;
}

module.exports = {
  RBACManager,
  getRBACManager,
  rbacManager: getRBACManager()
};