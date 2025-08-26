/**
 * BUMBA Architecture Design - Resource Allocation System
 * Manages resource allocation, monitoring, and optimization
 */

const { EventEmitter } = require('events');

class ResourceAllocator extends EventEmitter {
  constructor() {
    super();
    this.resources = new Map();
    this.allocations = new Map();
    this.limits = {
      memory: 512 * 1024 * 1024, // 512MB
      cpu: 0.8, // 80%
      tasks: 100,
      connections: 1000
    };
    this.usage = {
      memory: 0,
      cpu: 0,
      tasks: 0,
      connections: 0
    };
  }

  async requestResources(type, amount, reason) {
    // Validate input
    if (!type || !amount || amount <= 0) {
      return { allocated: false, reason: 'Invalid resource request' };
    }

    // Check if resource type exists
    if (!this.limits.hasOwnProperty(type)) {
      return { allocated: false, reason: `Unknown resource type: ${type}` };
    }

    // Check availability
    if (this.canAllocate(type, amount)) {
      const allocationId = this.generateAllocationId();
      this.allocate(type, amount, reason, allocationId);

      this.emit('resource-allocated', {
        id: allocationId,
        type,
        amount,
        reason,
        timestamp: Date.now()
      });

      return {
        allocated: true,
        id: allocationId,
        expires: Date.now() + 3600000 // 1 hour default
      };
    }

    this.emit('resource-denied', {
      type,
      amount,
      reason: 'Insufficient resources',
      available: this.getAvailable(type)
    });

    return {
      allocated: false,
      reason: 'Insufficient resources',
      available: this.getAvailable(type),
      requested: amount
    };
  }

  canAllocate(type, amount) {
    const current = this.usage[type] || 0;
    const limit = this.limits[type];
    return current + amount <= limit;
  }

  allocate(type, amount, reason, allocationId) {
    // Update usage
    this.usage[type] = (this.usage[type] || 0) + amount;

    // Store allocation details
    const allocation = {
      id: allocationId,
      type,
      amount,
      reason,
      timestamp: Date.now(),
      released: false
    };

    this.allocations.set(allocationId, allocation);

    // Set up auto-release after 1 hour
    setTimeout(() => {
      if (!allocation.released) {
        this.release(allocationId);
      }
    }, 3600000);
  }

  release(allocationId) {
    const allocation = this.allocations.get(allocationId);
    if (!allocation || allocation.released) {
      return false;
    }

    // Mark as released
    allocation.released = true;
    allocation.releasedAt = Date.now();

    // Update usage
    this.usage[allocation.type] -= allocation.amount;

    this.emit('resource-released', {
      id: allocationId,
      type: allocation.type,
      amount: allocation.amount,
      duration: Date.now() - allocation.timestamp
    });

    return true;
  }

  getAvailable(type) {
    if (!this.limits.hasOwnProperty(type)) {
      return 0;
    }
    return this.limits[type] - (this.usage[type] || 0);
  }

  getUsage() {
    const usage = {};
    for (const type in this.limits) {
      usage[type] = {
        used: this.usage[type] || 0,
        limit: this.limits[type],
        percentage: ((this.usage[type] || 0) / this.limits[type]) * 100
      };
    }
    return usage;
  }

  getAllocations() {
    const active = [];
    for (const [id, allocation] of this.allocations) {
      if (!allocation.released) {
        active.push({
          id: allocation.id,
          type: allocation.type,
          amount: allocation.amount,
          reason: allocation.reason,
          age: Date.now() - allocation.timestamp
        });
      }
    }
    return active;
  }

  setLimit(type, limit) {
    if (limit <= 0) {
      throw new Error('Limit must be positive');
    }
    this.limits[type] = limit;
    this.emit('limit-changed', { type, limit });
  }

  generateAllocationId() {
    return `alloc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Monitoring methods
  getMetrics() {
    return {
      usage: this.getUsage(),
      activeAllocations: this.getAllocations().length,
      totalAllocations: this.allocations.size,
      limits: { ...this.limits }
    };
  }

  // Cleanup old allocations
  cleanup() {
    const oneHourAgo = Date.now() - 3600000;
    for (const [id, allocation] of this.allocations) {
      if (allocation.released && allocation.releasedAt < oneHourAgo) {
        this.allocations.delete(id);
      }
    }
  }
}

// Singleton instance
let instance = null;

module.exports = {
  ResourceAllocator,

  // Get singleton instance
  getInstance() {
    if (!instance) {
      instance = new ResourceAllocator();
    }
    return instance;
  }
};
