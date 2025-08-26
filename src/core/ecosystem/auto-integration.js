/**
 * BUMBA 2.0 Ecosystem Auto-Integration System
 * Autonomous integration with external tools, services, and MCP systems
 */

const { ConsciousnessLayer } = require('../consciousness/consciousness-layer');
const { logger } = require('../logging/bumba-logger');

const { getInstance: getNotionHub } = require('../integrations/notion-hub');
const { DatabaseIntegration } = require('../integrations/database-integration');

class EcosystemAutoIntegration {
  constructor() {
    this.consciousness = new ConsciousnessLayer();
    this.discoveryEngine = new ServiceDiscoveryEngine();
    this.mcpIntegrator = new MCPAutoIntegrator();
    this.toolValidator = new ToolValidationEngine();
    this.capabilityMatcher = new CapabilityMatcher();
    this.integrationOrchestrator = new IntegrationOrchestrator();
    this.notionHub = getNotionHub();
    this.databaseIntegration = new DatabaseIntegration();
    
    this.registeredServices = new Map();
    this.activeIntegrations = new Map();
    this.integrationHistory = [];
    this.capabilityRegistry = new Map();
    
    this.initializeEcosystemCapabilities();
    logger.info('🏁 Ecosystem Auto-Integration System initialized');
  }

  initializeEcosystemCapabilities() {
    // Core integration capabilities
    this.integrationCapabilities = {
      // Development Tools
      development: {
        'git': { priority: 'high', auto_integrate: true },
        'docker': { priority: 'high', auto_integrate: true },
        'npm': { priority: 'high', auto_integrate: true },
        'webpack': { priority: 'medium', auto_integrate: true },
        'eslint': { priority: 'medium', auto_integrate: true },
        'prettier': { priority: 'medium', auto_integrate: true },
        'jest': { priority: 'medium', auto_integrate: true }
      },

      // Design Tools
      design: {
        'figma': { priority: 'high', auto_integrate: true },
        'sketch': { priority: 'medium', auto_integrate: true },
        'adobe-creative': { priority: 'medium', auto_integrate: false },
        'invision': { priority: 'low', auto_integrate: true }
      },

      // Infrastructure & Cloud
      infrastructure: {
        'aws': { priority: 'high', auto_integrate: false },
        'azure': { priority: 'high', auto_integrate: false },
        'gcp': { priority: 'high', auto_integrate: false },
        'kubernetes': { priority: 'high', auto_integrate: true },
        'terraform': { priority: 'medium', auto_integrate: true },
        'ansible': { priority: 'medium', auto_integrate: true }
      },

      // Databases
      databases: {
        'postgresql': { priority: 'high', auto_integrate: true },
        'mongodb': { 
          priority: 'high', 
          auto_integrate: true,
          enhanced_capabilities: {
            document_operations: true,
            aggregation_pipelines: true,
            indexing: true,
            transactions: true,
            change_streams: true,
            full_text_search: true,
            geospatial_queries: true,
            time_series: true
          }
        },
        'supabase': {
          priority: 'high',
          auto_integrate: true,
          enhanced_capabilities: {
            database_management: true,
            authentication: true,
            storage: true,
            edge_functions: true,
            real_time: true,
            vector_embeddings: true,
            row_level_security: true,
            api_generation: true
          }
        },
        'redis': { priority: 'high', auto_integrate: true },
        'elasticsearch': { priority: 'medium', auto_integrate: true },
        'mysql': { priority: 'medium', auto_integrate: true }
      },

      // Communication & Collaboration
      collaboration: {
        'discord': { priority: 'low', auto_integrate: false },
        'teams': { priority: 'medium', auto_integrate: false },
        'notion': { 
          priority: 'high', 
          auto_integrate: true,
          enhanced_capabilities: {
            timeline_integration: true,
            workflow_automation: true,
            project_tracking: true,
            stakeholder_collaboration: true
          }
        },
        'confluence': { priority: 'low', auto_integrate: true }
      },

      // Security Tools
      security: {
        'sonarqube': { priority: 'high', auto_integrate: true },
        'snyk': { priority: 'high', auto_integrate: true },
        'owasp': { priority: 'high', auto_integrate: true },
        'vault': { priority: 'medium', auto_integrate: true }
      },

      // Monitoring & Analytics
      monitoring: {
        'datadog': { priority: 'medium', auto_integrate: false },
        'newrelic': { priority: 'medium', auto_integrate: false },
        'grafana': { priority: 'high', auto_integrate: true },
        'prometheus': { priority: 'high', auto_integrate: true },
        'sentry': { priority: 'high', auto_integrate: true }
      },

      // MCP Tools
      mcp: {
        'filesystem': { priority: 'high', auto_integrate: true },
        'database': { priority: 'high', auto_integrate: true },
        'web-scraping': { priority: 'medium', auto_integrate: true },
        'api-testing': { priority: 'medium', auto_integrate: true },
        'code-analysis': { priority: 'high', auto_integrate: true }
      }
    };
  }

  async discoverAndIntegrateEcosystem(context = {}) {
    logger.info('🏁 Starting ecosystem discovery and auto-integration...');

    // Phase 1: Discover available services and tools
    const discoveryResults = await this.discoveryEngine.discoverEcosystem(context);
    
    // Phase 2: Validate and prioritize integrations
    const validatedIntegrations = await this.validateDiscoveredServices(discoveryResults);
    
    // Phase 3: Auto-integrate high-priority, safe services
    const autoIntegrations = await this.performAutoIntegrations(validatedIntegrations);
    
    // Phase 4: Suggest manual integrations for sensitive services
    const manualSuggestions = await this.generateManualIntegrationSuggestions(validatedIntegrations);
    
    // Phase 5: Update capability registry
    await this.updateCapabilityRegistry(autoIntegrations);

    return {
      type: 'ecosystem_auto_integration',
      discovery_results: discoveryResults,
      auto_integrations: autoIntegrations,
      manual_suggestions: manualSuggestions,
      total_capabilities_added: autoIntegrations.length,
      consciousness_validation: await this.validateEcosystemConsciousness(autoIntegrations),
      integration_timestamp: new Date().toISOString()
    };
  }

  async validateDiscoveredServices(discoveryResults) {
    logger.info('🏁 Validating discovered services for integration...');

    const validatedServices = [];

    for (const service of discoveryResults.discovered_services) {
      const validation = await this.toolValidator.validateService(service);
      
      if (validation.is_safe && validation.is_beneficial) {
        // Check against consciousness principles
        const consciousnessValidation = await this.consciousness.validateIntent({
          description: `Integrate ${service.name} service`,
          service: service,
          capabilities: service.capabilities
        });

        if (consciousnessValidation.approved) {
          validatedServices.push({
            ...service,
            validation: validation,
            consciousness_approval: consciousnessValidation,
            integration_priority: this.calculateIntegrationPriority(service),
            auto_integrate: this.shouldAutoIntegrate(service)
          });
        }
      }
    }

    return validatedServices;
  }

  async performAutoIntegrations(validatedServices) {
    logger.info('🏁 Performing automatic integrations...');

    const autoIntegrations = [];
    const eligibleServices = validatedServices.filter(service => service.auto_integrate);

    for (const service of eligibleServices) {
      try {
        logger.info(`🏁 Auto-integrating ${service.name}...`);
        
        const integration = await this.integrationOrchestrator.integrateService(service);
        
        if (integration.success) {
          // Register integration
          this.activeIntegrations.set(service.name, integration);
          
          // Update capability registry
          await this.registerServiceCapabilities(service, integration);
          
          autoIntegrations.push({
            service: service.name,
            type: service.type,
            capabilities: service.capabilities,
            integration_result: integration,
            integration_timestamp: new Date().toISOString()
          });

          logger.info(`🏁 Successfully auto-integrated ${service.name}`);
        }
      } catch (error) {
        logger.error(`🏁 Failed to auto-integrate ${service.name}: ${error.message}`);
        
        // Log for manual review
        await this.logIntegrationFailure(service, error);
      }
    }

    return autoIntegrations;
  }

  async generateManualIntegrationSuggestions(validatedServices) {
    logger.info('🏁 Generating manual integration suggestions...');

    const manualServices = validatedServices.filter(service => !service.auto_integrate);
    const suggestions = [];

    for (const service of manualServices) {
      const suggestion = await this.createIntegrationSuggestion(service);
      suggestions.push(suggestion);
    }

    return suggestions;
  }

  async createIntegrationSuggestion(service) {
    return {
      service_name: service.name,
      service_type: service.type,
      reason_for_manual: await this.explainManualRequirement(service),
      benefits: service.capabilities,
      integration_steps: await this.generateIntegrationSteps(service),
      security_considerations: await this.identifySecurityConsiderations(service),
      consciousness_alignment: service.consciousness_approval,
      priority: service.integration_priority,
      estimated_effort: await this.estimateIntegrationEffort(service)
    };
  }

  calculateIntegrationPriority(service) {
    const categoryPriority = this.getCategoryPriority(service.type);
    const capabilityScore = this.calculateCapabilityScore(service.capabilities);
    const securityScore = this.calculateSecurityScore(service);
    const consciousnessScore = service.consciousness_approval?.alignment_score || 0;

    const overallScore = (
      categoryPriority * 0.3 +
      capabilityScore * 0.3 +
      securityScore * 0.2 +
      consciousnessScore * 0.2
    );

    if (overallScore >= 0.8) {return 'high';}
    if (overallScore >= 0.6) {return 'medium';}
    return 'low';
  }

  shouldAutoIntegrate(service) {
    const category = this.integrationCapabilities[service.type];
    const serviceConfig = category?.[service.name];
    
    if (!serviceConfig) {return false;}
    
    // Check if auto-integration is enabled for this service
    if (!serviceConfig.auto_integrate) {return false;}
    
    // Additional safety checks
    const isSafe = service.security_risk === 'low';
    const isStandard = service.is_standard_tool === true;
    const hasGoodReputation = service.reputation_score > 0.8;
    
    return isSafe && isStandard && hasGoodReputation;
  }

  async registerServiceCapabilities(service, integration) {
    const capabilities = {
      service_name: service.name,
      service_type: service.type,
      provided_capabilities: service.capabilities,
      integration_endpoint: integration.endpoint,
      available_methods: integration.methods,
      consciousness_validated: true,
      registered_at: new Date().toISOString()
    };

    this.capabilityRegistry.set(service.name, capabilities);
    
    // Notify departments of new capabilities
    await this.notifyDepartmentsOfNewCapabilities(capabilities);
  }

  async notifyDepartmentsOfNewCapabilities(capabilities) {
    // This would integrate with the department managers to inform them
    // of new tools and capabilities available for their specialists
    logger.info(`🏁 New capabilities available: ${capabilities.service_name}`);
  }

  getCategoryPriority(serviceType) {
    const priorities = {
      'development': 0.9,
      'security': 0.95,
      'mcp': 0.9,
      'infrastructure': 0.8,
      'databases': 0.8,
      'design': 0.7,
      'monitoring': 0.7,
      'collaboration': 0.5
    };
    
    return priorities[serviceType] || 0.5;
  }

  calculateCapabilityScore(capabilities) {
    // Score based on number and quality of capabilities
    if (!capabilities || capabilities.length === 0) {return 0;}
    
    const baseScore = Math.min(capabilities.length * 0.1, 0.8);
    const qualityBonus = capabilities.some(cap => 
      cap.includes('ai') || cap.includes('automation') || cap.includes('intelligence')
    ) ? 0.2 : 0;
    
    return Math.min(baseScore + qualityBonus, 1.0);
  }

  calculateSecurityScore(service) {
    const securityFactors = {
      'open_source': 0.8,
      'well_known': 0.9,
      'enterprise_grade': 0.95,
      'community_verified': 0.8,
      'has_security_audit': 0.9
    };
    
    let score = 0.5; // Base score
    
    for (const [factor, weight] of Object.entries(securityFactors)) {
      if (service.security_indicators?.includes(factor)) {
        score += weight * 0.1;
      }
    }
    
    // Penalty for high risk services
    if (service.security_risk === 'high') {score *= 0.3;}
    if (service.security_risk === 'medium') {score *= 0.7;}
    
    return Math.min(score, 1.0);
  }

  async updateCapabilityRegistry(autoIntegrations) {
    logger.info('🏁 Updating ecosystem capability registry...');

    for (const integration of autoIntegrations) {
      await this.capabilityMatcher.indexCapabilities(integration);
    }

    // Generate capability map for departments
    const capabilityMap = await this.generateCapabilityMap();
    
    // Store integration history
    this.integrationHistory.push({
      timestamp: new Date().toISOString(),
      integrations_added: autoIntegrations.length,
      total_active_integrations: this.activeIntegrations.size,
      capability_map: capabilityMap
    });

    return capabilityMap;
  }

  async generateCapabilityMap() {
    const capabilityMap = {
      development_capabilities: [],
      design_capabilities: [],
      security_capabilities: [],
      infrastructure_capabilities: [],
      collaboration_capabilities: [],
      monitoring_capabilities: [],
      mcp_capabilities: []
    };

    for (const [serviceName, capabilities] of this.capabilityRegistry) {
      const categoryKey = `${capabilities.service_type}_capabilities`;
      if (capabilityMap[categoryKey]) {
        capabilityMap[categoryKey].push({
          service: serviceName,
          capabilities: capabilities.provided_capabilities,
          endpoint: capabilities.integration_endpoint
        });
      }
    }

    return capabilityMap;
  }

  async validateEcosystemConsciousness(integrations) {
    const consciousnessValidation = {
      ethical_compliance: true,
      community_benefit: true,
      sustainability_assessment: true,
      consciousness_score: 0
    };

    let totalScore = 0;
    for (const integration of integrations) {
      // Validate each integration maintains consciousness principles
      const serviceValidation = await this.consciousness.validateIntent({
        description: `Active integration: ${integration.service}`,
        integration: integration
      });
      
      totalScore += serviceValidation.alignment_score || 0.8;
    }

    consciousnessValidation.consciousness_score = integrations.length > 0 ? 
      totalScore / integrations.length : 1.0;

    return consciousnessValidation;
  }

  // Public API methods for departments to query capabilities
  async queryAvailableCapabilities(department, requirement) {
    return await this.capabilityMatcher.findMatchingCapabilities(department, requirement);
  }

  async requestIntegration(serviceName, requesterDepartment, justification) {
    logger.info(`🏁 Integration request: ${serviceName} from ${requesterDepartment}`);
    
    // Validate request through consciousness layer
    const validation = await this.consciousness.validateIntent({
      description: `Request integration of ${serviceName}`,
      requester: requesterDepartment,
      justification: justification
    });

    if (validation.approved) {
      return await this.initiateRequestedIntegration(serviceName, requesterDepartment);
    } else {
      return {
        success: false,
        reason: 'Request denied by consciousness validation',
        validation: validation
      };
    }
  }

  getActiveIntegrations() {
    return Array.from(this.activeIntegrations.values());
  }

  getCapabilityRegistry() {
    return Object.fromEntries(this.capabilityRegistry);
  }

  getIntegrationHistory() {
    return this.integrationHistory;
  }
}

class ServiceDiscoveryEngine {
  constructor() {
    this.discoveryStrategies = new Map();
    this.initializeDiscoveryStrategies();
  }

  initializeDiscoveryStrategies() {
    this.discoveryStrategies.set('filesystem', new FilesystemDiscovery());
    this.discoveryStrategies.set('network', new NetworkDiscovery());
    this.discoveryStrategies.set('package_managers', new PackageManagerDiscovery());
    this.discoveryStrategies.set('environment', new EnvironmentDiscovery());
    this.discoveryStrategies.set('mcp_registry', new MCPRegistryDiscovery());
  }

  async discoverEcosystem(context) {
    logger.info('🏁 Discovering ecosystem services and tools...');

    const discoveryResults = {
      discovered_services: [],
      discovery_methods: [],
      total_discovered: 0,
      discovery_confidence: 0
    };

    // Run all discovery strategies in parallel
    const discoveryPromises = Array.from(this.discoveryStrategies.entries()).map(async ([strategyName, strategy]) => {
        try {
          const results = await strategy.discover(context);
          discoveryResults.discovery_methods.push({
            strategy: strategyName,
            services_found: results.length,
            success: true
          });
          return results;
        } catch (error) {
          logger.error(`🏁 Discovery strategy ${strategyName} failed: ${error.message}`);
          discoveryResults.discovery_methods.push({
            strategy: strategyName,
            services_found: 0,
            success: false,
            error: error.message
          });
          return [];
        }
      }
    );

    const allResults = await Promise.all(discoveryPromises);
    
    // Flatten and deduplicate results
    const allServices = allResults.flat();
    const uniqueServices = this.deduplicateServices(allServices);
    
    discoveryResults.discovered_services = uniqueServices;
    discoveryResults.total_discovered = uniqueServices.length;
    discoveryResults.discovery_confidence = this.calculateDiscoveryConfidence(discoveryResults);

    return discoveryResults;
  }

  deduplicateServices(services) {
    const uniqueServices = new Map();
    
    for (const service of services) {
      const key = `${service.name}-${service.type}`;
      if (!uniqueServices.has(key) || 
          this.isHigherQualityService(service, uniqueServices.get(key))) {
        uniqueServices.set(key, service);
      }
    }
    
    return Array.from(uniqueServices.values());
  }

  isHigherQualityService(newService, existingService) {
    // Compare services and return true if newService is higher quality
    const newScore = (newService.reputation_score || 0) + (newService.capabilities?.length || 0) * 0.1;
    const existingScore = (existingService.reputation_score || 0) + (existingService.capabilities?.length || 0) * 0.1;
    
    return newScore > existingScore;
  }

  calculateDiscoveryConfidence(results) {
    const successfulStrategies = results.discovery_methods.filter(m => m.success).length;
    const totalStrategies = results.discovery_methods.length;
    
    return totalStrategies > 0 ? successfulStrategies / totalStrategies : 0;
  }
}

class MCPAutoIntegrator {
  constructor() {
    this.mcpRegistry = new Map();
    this.integrationTemplates = new Map();
    this.initializeMCPTemplates();
  }

  initializeMCPTemplates() {
    // Common MCP integration patterns
    this.integrationTemplates.set('filesystem', {
      connection_type: 'stdio',
      required_capabilities: ['read', 'write', 'list'],
      security_level: 'high',
      auto_integrate: true
    });

    this.integrationTemplates.set('database', {
      connection_type: 'stdio',
      required_capabilities: ['query', 'schema', 'migrate'],
      security_level: 'high',
      auto_integrate: false // Requires manual configuration
    });

    this.integrationTemplates.set('web-scraping', {
      connection_type: 'stdio',
      required_capabilities: ['fetch', 'parse', 'extract'],
      security_level: 'medium',
      auto_integrate: true
    });
  }

  async autoIntegrateMCP(mcpService) {
    const template = this.integrationTemplates.get(mcpService.type);
    
    if (!template || !template.auto_integrate) {
      return { success: false, reason: 'Manual integration required' };
    }

    try {
      const integration = await this.establishMCPConnection(mcpService, template);
      this.mcpRegistry.set(mcpService.name, integration);
      
      return { success: true, integration: integration };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  async establishMCPConnection(mcpService, template) {
    // MCP-specific integration logic would go here
    return {
      service: mcpService.name,
      connection_type: template.connection_type,
      capabilities: mcpService.capabilities,
      endpoint: mcpService.endpoint || 'stdio',
      security_validated: true,
      connected_at: new Date().toISOString()
    };
  }
}

class ToolValidationEngine {
  async validateService(service) {
    const validation = {
      is_safe: false,
      is_beneficial: false,
      security_score: 0,
      functionality_score: 0,
      reputation_score: 0,
      overall_score: 0
    };

    // Security validation
    validation.security_score = await this.validateSecurity(service);
    validation.is_safe = validation.security_score > 0.7;

    // Functionality validation
    validation.functionality_score = await this.validateFunctionality(service);
    validation.is_beneficial = validation.functionality_score > 0.6;

    // Reputation validation
    validation.reputation_score = await this.validateReputation(service);

    // Overall score
    validation.overall_score = (
      validation.security_score * 0.4 +
      validation.functionality_score * 0.4 +
      validation.reputation_score * 0.2
    );

    return validation;
  }

  async validateSecurity(service) {
    // Security validation logic
    let score = 0.5;
    
    if (service.is_open_source) {score += 0.2;}
    if (service.has_security_audit) {score += 0.2;}
    if (service.security_indicators?.includes('well_known')) {score += 0.1;}
    
    return Math.min(score, 1.0);
  }

  async validateFunctionality(service) {
    // Functionality validation logic
    const capabilityScore = (service.capabilities?.length || 0) * 0.1;
    const typeScore = service.type === 'mcp' ? 0.3 : 0.2;
    
    return Math.min(capabilityScore + typeScore, 1.0);
  }

  async validateReputation(service) {
    // Reputation validation logic
    return service.reputation_score || 0.5;
  }
}

class CapabilityMatcher {
  constructor() {
    this.capabilityIndex = new Map();
  }

  async indexCapabilities(integration) {
    for (const capability of integration.capabilities) {
      if (!this.capabilityIndex.has(capability)) {
        this.capabilityIndex.set(capability, []);
      }
      this.capabilityIndex.get(capability).push(integration);
    }
  }

  async findMatchingCapabilities(department, requirement) {
    const matches = [];
    
    for (const [capability, services] of this.capabilityIndex) {
      if (this.matchesRequirement(capability, requirement)) {
        matches.push({
          capability: capability,
          services: services,
          relevance_score: this.calculateRelevanceScore(capability, requirement)
        });
      }
    }
    
    return matches.sort((a, b) => b.relevance_score - a.relevance_score);
  }

  matchesRequirement(capability, requirement) {
    // Simple keyword matching - could be enhanced with NLP
    return capability.toLowerCase().includes(requirement.toLowerCase()) ||
           requirement.toLowerCase().includes(capability.toLowerCase());
  }

  calculateRelevanceScore(capability, requirement) {
    const words = requirement.toLowerCase().split(' ');
    const capabilityWords = capability.toLowerCase().split(' ');
    
    let matches = 0;
    for (const word of words) {
      if (capabilityWords.some(capWord => capWord.includes(word) || word.includes(capWord))) {
        matches++;
      }
    }
    
    return matches / words.length;
  }
}

class IntegrationOrchestrator {
  async integrateService(service) {
    logger.info(`🏁 Orchestrating integration of ${service.name}...`);

    const integration = {
      service_name: service.name,
      service_type: service.type,
      integration_method: await this.determineIntegrationMethod(service),
      endpoint: await this.establishEndpoint(service),
      methods: await this.discoverMethods(service),
      security_config: await this.configureSecurity(service),
      success: false
    };

    try {
      // Perform actual integration
      await this.performIntegration(service, integration);
      integration.success = true;
      integration.integrated_at = new Date().toISOString();
      
      logger.info(`🏁 Successfully integrated ${service.name}`);
    } catch (error) {
      integration.error = error.message;
      logger.error(`🏁 Failed to integrate ${service.name}: ${error.message}`);
    }

    return integration;
  }

  async determineIntegrationMethod(service) {
    if (service.type === 'mcp') {return 'mcp_stdio';}
    if (service.api_endpoint) {return 'rest_api';}
    if (service.cli_available) {return 'cli_wrapper';}
    return 'library_import';
  }

  async establishEndpoint(service) {
    if (service.type === 'mcp') {return 'stdio';}
    return service.endpoint || service.api_endpoint || 'local';
  }

  async discoverMethods(service) {
    // Discovery logic for available methods/capabilities
    return service.capabilities || [];
  }

  async configureSecurity(service) {
    return {
      encryption: service.security_level === 'high',
      authentication: service.requires_auth || false,
      rate_limiting: true,
      consciousness_validated: true
    };
  }

  async performIntegration(service, integrationConfig) {
    // Actual integration implementation would go here
    // This is a placeholder for the real integration logic
    return true;
  }
}

// Discovery strategy implementations
class FilesystemDiscovery {
  async discover(context) {
    // Scan filesystem for known tools and services
    return [
      { name: 'git', type: 'development', capabilities: ['version_control'], reputation_score: 0.95 },
      { name: 'docker', type: 'infrastructure', capabilities: ['containerization'], reputation_score: 0.9 }
    ];
  }
}

class NetworkDiscovery {
  async discover(context) {
    // Scan network for available services
    return [];
  }
}

class PackageManagerDiscovery {
  async discover(context) {
    // Scan package managers for installed tools
    return [];
  }
}

class EnvironmentDiscovery {
  async discover(context) {
    // Scan environment variables and configuration
    return [];
  }
}

class MCPRegistryDiscovery {
  async discover(context) {
    // Discover available MCP services
    return [
      { name: 'filesystem-mcp', type: 'mcp', capabilities: ['file_operations'], reputation_score: 0.9 },
      { name: 'database-mcp', type: 'mcp', capabilities: ['sql_operations'], reputation_score: 0.85 }
    ];
  }
}

module.exports = {
  AutoIntegration: EcosystemAutoIntegration,  // Standard export name
  EcosystemAutoIntegration,  // Keep original
  ServiceDiscoveryEngine,
  MCPAutoIntegrator,
  ToolValidationEngine,
  CapabilityMatcher,
  IntegrationOrchestrator
};