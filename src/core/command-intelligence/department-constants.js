/**
 * BUMBA Department Constants
 * Central definition of all departments and their managers
 */

const DEPARTMENTS = {
  PRODUCT: {
    id: 'product',
    name: 'Product Strategy',
    managerClass: 'ProductStrategistManager',
    managerPath: '../departments/product-strategist-manager',
    emoji: '🟡',
    description: 'Product strategy, requirements, and business analysis'
  },
  DESIGN: {
    id: 'design',
    name: 'Design Engineering',
    managerClass: 'DesignEngineerManager',
    managerPath: '../departments/design-engineer-manager-simple',
    emoji: '🔴',
    description: 'UI/UX design, visual design, and frontend engineering'
  },
  BACKEND: {
    id: 'backend',
    name: 'Backend Engineering',
    managerClass: 'BackendEngineerManager',
    managerPath: '../departments/backend-engineer-manager-simple',
    emoji: '🟢',
    description: 'APIs, databases, infrastructure, and backend systems'
  },
  COLLABORATION: {
    id: 'collaboration',
    name: 'Multi-Agent Collaboration',
    managerClass: 'CollaborationManager',
    managerPath: '../collaboration/collaboration-manager',
    emoji: '🤝',
    description: 'Cross-department coordination and team collaboration'
  },
  CONSCIOUSNESS: {
    id: 'consciousness',
    name: 'Consciousness Framework',
    managerClass: 'ConsciousnessManager',
    managerPath: '../consciousness/consciousness-manager',
    emoji: '✨',
    description: 'Wisdom-based reasoning and conscious development'
  },
  MONITORING: {
    id: 'monitoring',
    name: 'System Monitoring',
    managerClass: 'MonitoringManager',
    managerPath: '../monitoring/monitoring-manager',
    emoji: '📊',
    description: 'System health, performance, and metrics'
  },
  SYSTEM: {
    id: 'system',
    name: 'System Management',
    managerClass: 'SystemManager',
    managerPath: '../system/system-manager',
    emoji: '⚙️',
    description: 'System configuration and management'
  },
  LITE: {
    id: 'lite',
    name: 'Lite Mode',
    managerClass: 'LiteModeManager',
    managerPath: '../lite-mode/lite-mode-manager',
    emoji: '⚡',
    description: 'Lightweight, fast execution mode'
  },
  TESTING: {
    id: 'testing',
    name: 'Testing & QA',
    managerClass: 'TestingManager',
    managerPath: '../testing/testing-manager',
    emoji: '🧪',
    description: 'Testing, validation, and quality assurance'
  },
  QA: {
    id: 'qa',
    name: 'Quality Assurance',
    managerClass: 'QAManager',
    managerPath: '../qa/qa-manager',
    emoji: '🟠',
    description: 'Quality assurance, testing, security, and performance validation'
  }
};

// Manager singleton instances cache
const managerInstances = new Map();

/**
 * Get department configuration by ID
 */
function getDepartment(departmentId) {
  return Object.values(DEPARTMENTS).find(dept => dept.id === departmentId);
}

/**
 * Get all department IDs
 */
function getDepartmentIds() {
  return Object.values(DEPARTMENTS).map(dept => dept.id);
}

/**
 * Get department manager instance (singleton)
 */
async function getDepartmentManager(departmentId) {
  // Check cache first
  if (managerInstances.has(departmentId)) {
    return managerInstances.get(departmentId);
  }

  const dept = getDepartment(departmentId);
  if (!dept) {
    throw new Error(`Unknown department: ${departmentId}`);
  }

  try {
    // Dynamically import manager
    const ManagerClass = require(dept.managerPath);
    const instance = new ManagerClass();
    
    // Cache for future use
    managerInstances.set(departmentId, instance);
    
    return instance;
  } catch (error) {
    console.warn(`Could not load manager for ${departmentId}, using fallback`);
    // Return a fallback manager that logs the command
    return {
      execute: async (command, args, context) => {
        console.log(`${dept.emoji} ${dept.name} would handle:`, command, args);
        return {
          success: true,
          department: departmentId,
          message: `Command routed to ${dept.name}`,
          placeholder: true
        };
      }
    };
  }
}

/**
 * Get departments for collaboration
 */
function getCollaborationDepartments(command) {
  if (command === 'implement-strategy') return ['product'];
  if (command === 'implement-design') return ['design'];
  if (command === 'implement-technical') return ['backend'];
  if (command.includes('implement')) return ['product', 'design', 'backend'];
  return ['product', 'backend'];
}

module.exports = {
  DEPARTMENTS,
  getDepartment,
  getDepartmentIds,
  getDepartmentManager,
  getCollaborationDepartments
};