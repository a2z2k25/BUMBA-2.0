const { logger } = require('../core/logging/bumba-logger');

/**
 * BUMBA 2.0 Capability Absorption System
 * Absorbs external framework capabilities while maintaining BUMBA identity
 */

class CapabilityAbsorber {
  constructor() {
    this.rebrandingMap = new Map();
    this.capabilityMappings = new Map();
    this.identityTransformer = new IdentityTransformer();
    this.initializeRebranding();
  }

  initializeRebranding() {
    // Map external framework concepts to BUMBA terminology
    this.rebrandingMap.set('swarm', 'specialist-team');
    this.rebrandingMap.set('agents', 'specialists');
    this.rebrandingMap.set('queen', 'executive-mode');
    this.rebrandingMap.set('hive', 'organization');
    this.rebrandingMap.set('neural-network', 'intelligence-system');
    this.rebrandingMap.set('sparc', 'structured-workflow');
    this.rebrandingMap.set('workflow', 'ceremony');
    this.rebrandingMap.set('coordination', 'orchestration');

    // Department-specific capability mappings
    this.mapDepartmentCapabilities();
  }

  mapDepartmentCapabilities() {
    // Strategic Department Capabilities
    this.capabilityMappings.set('strategic', {
      'market-research': 'MarketResearchSpecialist',
      'competitive-analysis': 'CompetitiveAnalysisSpecialist',
      'business-modeling': 'BusinessModelSpecialist',
      'stakeholder-management': 'StakeholderCommunicationSpecialist',
      'roi-analysis': 'ROIAnalysisSpecialist',
      'requirements-engineering': 'RequirementsEngineeringSpecialist',
      'product-strategy': 'ProductStrategySpecialist'
    });

    // Experience Department Capabilities
    this.capabilityMappings.set('experience', {
      'ux-research': 'UXResearchSpecialist',
      'ui-design': 'UIDesignSpecialist',
      'accessibility': 'AccessibilitySpecialist',
      'performance-optimization': 'PerformanceOptimizationSpecialist',
      'design-systems': 'DesignSystemSpecialist',
      'frontend-architecture': 'FrontendArchitectureSpecialist',
      'user-testing': 'UserTestingSpecialist',
      'interaction-design': 'InteractionDesignSpecialist'
    });

    // Technical Department Capabilities
    this.capabilityMappings.set('technical', {
      'database-design': 'DatabaseSpecialist',
      'api-architecture': 'APIArchitectureSpecialist',
      'security-engineering': 'SecuritySpecialist',
      'devops-automation': 'DevOpsSpecialist',
      'performance-engineering': 'PerformanceEngineeringSpecialist',
      'infrastructure-design': 'InfrastructureSpecialist',
      'microservices': 'MicroservicesSpecialist',
      'cloud-architecture': 'CloudArchitectureSpecialist'
    });
  }

  async absorbExternalCapabilities(externalFramework) {
    logger.info('🏁 Absorbing external capabilities into BUMBA framework...');

    const capabilities = await this.extractCapabilities(externalFramework);
    const rebrandedCapabilities = await this.rebrandCapabilities(capabilities);
    const departmentMappings = await this.mapToDepartments(rebrandedCapabilities);

    return await this.integrateToBumba(departmentMappings);
  }

  async extractCapabilities(externalFramework) {
    // Extract agent definitions, commands, and tools
    const capabilities = {
      agents: await this.extractAgentDefinitions(externalFramework),
      commands: await this.extractCommandStructures(externalFramework),
      tools: await this.extractToolIntegrations(externalFramework),
      intelligence: await this.extractIntelligenceCapabilities(externalFramework),
      workflows: await this.extractWorkflowPatterns(externalFramework)
    };

    return capabilities;
  }

  async rebrandCapabilities(capabilities) {
    logger.info('🏁 Rebranding capabilities to BUMBA terminology...');

    return {
      specialists: await this.transformAgentsToSpecialists(capabilities.agents),
      ceremonies: await this.transformCommandsToCeremonies(capabilities.commands),
      tools: await this.rebrandTools(capabilities.tools),
      intelligence: await this.rebrandIntelligence(capabilities.intelligence),
      workflows: await this.transformWorkflows(capabilities.workflows)
    };
  }

  async transformAgentsToSpecialists(agents) {
    const specialists = {};

    for (const [agentName, agentDef] of Object.entries(agents)) {
      const department = this.determineDepartment(agentDef);
      const specialistName = this.generateSpecialistName(agentName);

      specialists[specialistName] = {
        department: department,
        capabilities: agentDef.capabilities,
        tools: agentDef.tools,
        consciousness: this.applyConsciousnessLayer(agentDef),
        qualityGates: this.generateQualityGates(department, agentDef)
      };
    }

    return specialists;
  }

  determineDepartment(agentDef) {
    // Analyze agent definition to determine which BUMBA department it belongs to
    const keywords = agentDef.description.toLowerCase();

    if (keywords.includes('business') || keywords.includes('strategy') ||
        keywords.includes('market') || keywords.includes('product')) {
      return 'strategic';
    }

    if (keywords.includes('design') || keywords.includes('ui') ||
        keywords.includes('ux') || keywords.includes('frontend')) {
      return 'experience';
    }

    if (keywords.includes('backend') || keywords.includes('database') ||
        keywords.includes('infrastructure') || keywords.includes('security')) {
      return 'technical';
    }

    // Default to technical if unclear
    return 'technical';
  }

  generateSpecialistName(originalName) {
    // Transform external agent names to BUMBA specialist naming convention
    const cleanName = originalName
      .replace(/agent/gi, '')
      .replace(/ai/gi, '')
      .replace(/assistant/gi, '')
      .trim();

    return cleanName.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('') + 'Specialist';
  }

  applyConsciousnessLayer(agentDef) {
    // Apply BUMBA consciousness principles to absorbed capabilities
    return {
      ethicalConstraints: this.generateEthicalConstraints(agentDef),
      sustainabilityPrinciples: this.applySustainabilityPrinciples(agentDef),
      communityFocus: this.addCommunityFocus(agentDef),
      qualityStandards: this.enforceQualityStandards(agentDef)
    };
  }

  async rebrandTools(tools) {
    const rebrandedTools = {};

    for (const [toolName, toolDef] of Object.entries(tools)) {
      const bumbaName = this.rebrandingMap.get(toolName) || toolName;
      rebrandedTools[bumbaName] = {
        ...toolDef,
        description: this.rebrandDescription(toolDef.description),
        usage: this.rebrandUsage(toolDef.usage)
      };
    }

    return rebrandedTools;
  }

  rebrandDescription(description) {
    let rebranded = description;

    // Replace external framework terminology with BUMBA terminology
    for (const [external, bumba] of this.rebrandingMap.entries()) {
      rebranded = rebranded.replace(new RegExp(external, 'gi'), bumba);
    }

    // Add BUMBA consciousness context
    rebranded += ' (Enhanced with BUMBA consciousness-driven principles)';

    return rebranded;
  }

  async generateMCPIntegration(tools) {
    // Convert external tool definitions to BUMBA MCP server format
    const mcpServers = {};

    for (const [toolName, toolDef] of Object.entries(tools)) {
      mcpServers[toolName] = {
        package: toolDef.package || `bumba-${toolName}-mcp`,
        description: this.rebrandDescription(toolDef.description),
        category: this.determineMCPCategory(toolDef),
        department: this.determineDepartment(toolDef),
        consciousness_aligned: true,
        quality_gates: true
      };
    }

    return mcpServers;
  }

  async integrateToBumba(departmentMappings) {
    logger.info('🏁 Integrating absorbed capabilities into BUMBA framework...');

    const integration = {
      strategic: await this.integrateStrategicCapabilities(departmentMappings.strategic),
      experience: await this.integrateExperienceCapabilities(departmentMappings.experience),
      technical: await this.integrateTechnicalCapabilities(departmentMappings.technical),
      intelligence: await this.integrateIntelligenceSystem(departmentMappings.intelligence),
      executiveMode: await this.integrateExecutiveCapabilities(departmentMappings.executive)
    };

    return integration;
  }

  async validateIntegration(integration) {
    // Ensure all absorbed capabilities maintain BUMBA identity and principles
    const validation = {
      identityPreservation: await this.validateIdentityPreservation(integration),
      consciousnessAlignment: await this.validateConsciousnessAlignment(integration),
      qualityStandards: await this.validateQualityStandards(integration),
      commandCompatibility: await this.validateCommandCompatibility(integration)
    };

    return validation;
  }
}

class IdentityTransformer {
  constructor() {
    this.bumbaTerminology = {
      framework_name: 'BUMBA',
      philosophy: 'Consciousness-Driven Development',
      agents: 'Department Managers and Specialists',
      coordination: 'Sacred Orchestration',
      quality: 'Sacred Practice',
      ceremonies: 'bumba-horn.mp3 Celebrations'
    };
  }

  transformIdentity(content) {
    // Remove all references to external frameworks
    let transformed = content;

    // Replace external framework references
    const externalReferences = [
      'claude-flow', 'flow', 'sparc', 'swarm', 'hive', 'queen'
    ];

    externalReferences.forEach(ref => {
      transformed = transformed.replace(new RegExp(ref, 'gi'), '');
    });

    // Add BUMBA identity markers
    transformed = `🏁 ${transformed}`;

    return transformed;
  }
}

module.exports = {
  CapabilityAbsorber,
  IdentityTransformer
};
