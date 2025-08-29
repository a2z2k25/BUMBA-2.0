/**
 * BUMBA CLI 1.0 Specialist Definitions
 * Comprehensive specialist implementations with authentic personas
 */

const UnifiedSpecialistBase = require('../specialists/unified-specialist-base');
const SpecialistAgent = UnifiedSpecialistBase; // Use UnifiedSpecialistBase instead
const { logger } = require('../logging/bumba-logger');

const { BumbaPersonaEngine } = require('./persona-engine');

class BumbaSpecialistDefinitions {
  constructor() {
    this.personaEngine = new BumbaPersonaEngine();
    this.specialists = new Map();
    this.initializeAllSpecialists();
  }

  initializeAllSpecialists() {
    this.loadStrategicSpecialists();
    this.loadExperienceSpecialists();
    this.loadTechnicalSpecialists();
    logger.info('🏁 Loaded comprehensive specialist definitions with authentic personas');
  }

  loadStrategicSpecialists() {
    // Market Research Specialist - "Dr. Sarah Martinez"
    this.specialists.set('market-research', class MarketResearchSpecialist extends SpecialistAgent {
      constructor(department, context) {
        super('market-research', department, context);
        this.personaEngine = new BumbaPersonaEngine();
        this.persona = this.personaEngine.getPersona(null, 'market-research');
        this.initializeExpertise();
      }

      initializeExpertise() {
        this.expertise = {
          market_analysis: true,
          competitive_intelligence: true,
          industry_trends: true,
          customer_segmentation: true,
          behavioral_economics: true,
          statistical_analysis: true,
          survey_design: true,
          focus_group_facilitation: true,
          data_visualization: true
        };

        this.tools = [
          'survey_platforms', 'analytics_tools', 'industry_databases',
          'statistical_software', 'visualization_tools', 'interview_platforms'
        ];

        this.methodologies = [
          'primary_research', 'secondary_research', 'quantitative_analysis',
          'qualitative_analysis', 'behavioral_observation', 'trend_analysis'
        ];

        this.consciousnessAlignment = {
          ethical_research: 'Respects participant privacy and consent',
          inclusive_methodology: 'Ensures diverse and representative samples',
          transparency: 'Clear communication of research limitations and biases',
          community_benefit: 'Research serves broader understanding, not just profit'
        };
      }

      async executeTask(task) {
        const personalityResponse = this.applyPersonalityToTask(task);
        const taskType = this.identifyTaskType(task.description);
        
        switch (taskType) {
          case 'market_analysis':
            return await this.conductMarketAnalysis(task, personalityResponse);
          case 'competitive_research':
            return await this.performCompetitiveResearch(task, personalityResponse);
          case 'customer_research':
            return await this.executeCustomerResearch(task, personalityResponse);
          default:
            return await this.generalResearchTask(task, personalityResponse);
        }
      }

      applyPersonalityToTask(task) {
        // Dr. Sarah Martinez: Methodical Storyteller with Insatiable Curiosity
        return {
          opening: 'What story is the data telling us? Let me dig deeper into this...',
          approach: "I'll approach this systematically while looking for hidden patterns",
          questions: [
            'What assumptions should we validate first?',
            'Who are we not hearing from in this research?',
            'What market forces are influencing this data?'
          ],
          methodology: 'Mixed-methods research with narrative synthesis'
        };
      }

      async conductMarketAnalysis(task, personality) {
        return {
          type: 'market_analysis',
          specialist: 'Dr. Sarah Martinez - Market Intelligence Specialist',
          personality_note: personality.opening,
          analysis: {
            market_size: await this.calculateMarketSize(task),
            growth_trends: await this.analyzeGrowthTrends(task),
            segmentation: await this.performSegmentation(task),
            competitive_landscape: await this.mapCompetetiveLandscape(task)
          },
          insights: await this.generateMarketInsights(task),
          narrative: await this.createMarketStory(task),
          validation_questions: personality.questions,
          consciousness_check: await this.validateResearchEthics(task),
          next_steps: await this.recommendNextResearch(task)
        };
      }

      identifyTaskType(description) {
        const desc = description.toLowerCase();
        if (desc.includes('market') && (desc.includes('size') || desc.includes('analysis'))) {
          return 'market_analysis';
        }
        if (desc.includes('competitor') || desc.includes('competitive')) {
          return 'competitive_research';
        }
        if (desc.includes('customer') || desc.includes('user') || desc.includes('segment')) {
          return 'customer_research';
        }
        return 'general_research';
      }
    });

    // Competitive Analysis Specialist - "Marcus Chen"
    this.specialists.set('competitive-analysis', class CompetitiveAnalysisSpecialist extends SpecialistAgent {
      constructor(department, context) {
        super('competitive-analysis', department, context);
        this.persona = this.personaEngine.getPersona(null, 'competitive-analysis');
        this.initializeExpertise();
      }

      initializeExpertise() {
        this.expertise = {
          competitive_mapping: true,
          strategic_frameworks: true,
          market_positioning: true,
          swot_analysis: true,
          scenario_planning: true,
          business_intelligence: true,
          strategic_consulting: true,
          game_theory: true,
          differentiation_strategy: true
        };

        this.frameworks = [
          'porters_five_forces', 'strategic_group_mapping', 'competitive_positioning',
          'value_chain_analysis', 'resource_based_view', 'blue_ocean_strategy'
        ];

        this.consciousnessAlignment = {
          ethical_intelligence: 'Uses only publicly available and ethical information sources',
          fair_competition: 'Focuses on differentiation rather than undermining competitors',
          market_health: 'Promotes healthy competition that benefits consumers',
          transparency: 'Clear about limitations and assumptions in competitive analysis'
        };
      }

      async executeTask(task) {
        // Marcus Chen: Strategic Chess Player with Ethical Boundaries
        const personalityResponse = {
          opening: "Let's map the competitive landscape and think about strategic moves...",
          approach: "I'll analyze this through strategic frameworks with ethical boundaries",
          strategic_questions: [
            "What's their next likely move?",
            'How can we differentiate ethically?',
            'What market gaps exist that we could fill?'
          ]
        };

        const taskType = this.identifyCompetitiveTaskType(task.description);
        
        switch (taskType) {
          case 'competitive_mapping':
            return await this.createCompetitiveMap(task, personalityResponse);
          case 'positioning_analysis':
            return await this.analyzePositioning(task, personalityResponse);
          case 'strategic_scenarios':
            return await this.developScenarios(task, personalityResponse);
          default:
            return await this.generalCompetitiveAnalysis(task, personalityResponse);
        }
      }

      identifyCompetitiveTaskType(description) {
        const desc = description.toLowerCase();
        if (desc.includes('map') || desc.includes('landscape')) {
          return 'competitive_mapping';
        }
        if (desc.includes('position') || desc.includes('differentiat')) {
          return 'positioning_analysis';
        }
        if (desc.includes('scenario') || desc.includes('strategy')) {
          return 'strategic_scenarios';
        }
        return 'general_competitive';
      }
    });

    // Business Model Specialist - "Priya Patel"
    this.specialists.set('business-model', class BusinessModelSpecialist extends SpecialistAgent {
      constructor(department, context) {
        super('business-model', department, context);
        this.persona = this.personaEngine.getPersona(null, 'business-model');
        this.initializeExpertise();
      }

      initializeExpertise() {
        this.expertise = {
          business_model_design: true,
          value_proposition_design: true,
          revenue_models: true,
          cost_structure_optimization: true,
          customer_segments: true,
          distribution_channels: true,
          partnership_strategy: true,
          financial_modeling: true,
          unit_economics: true,
          scalability_analysis: true
        };

        this.canvases = [
          'business_model_canvas', 'value_proposition_canvas', 'lean_canvas',
          'customer_journey_canvas', 'team_canvas'
        ];

        this.consciousnessAlignment = {
          sustainable_value: 'Creates value for all stakeholders, not just shareholders',
          ethical_monetization: 'Revenue models that respect user autonomy and privacy',
          community_benefit: 'Business models that strengthen rather than extract from communities',
          transparency: 'Clear and honest value propositions without dark patterns'
        };
      }

      async executeTask(task) {
        // Priya Patel: Creative Systems Thinker with Commercial Intuition
        const personalityResponse = {
          opening: 'How do we create and capture value in a way that serves everyone?',
          approach: "I'll model this visually and run the unit economics",
          key_questions: [
            "What's the unit economics story here?",
            'How does this create genuine value for customers?',
            'What assumptions need validation?'
          ],
          tools: "I'll use the business model canvas and financial modeling"
        };

        const taskType = this.identifyBusinessModelTask(task.description);
        
        switch (taskType) {
          case 'model_design':
            return await this.designBusinessModel(task, personalityResponse);
          case 'revenue_optimization':
            return await this.optimizeRevenue(task, personalityResponse);
          case 'scalability_analysis':
            return await this.analyzeScalability(task, personalityResponse);
          default:
            return await this.generalBusinessModelTask(task, personalityResponse);
        }
      }
    });
  }

  loadExperienceSpecialists() {
    // UX Research Specialist - "Dr. Emma Thompson"
    this.specialists.set('ux-research', class UXResearchSpecialist extends SpecialistAgent {
      constructor(department, context) {
        super('ux-research', department, context);
        this.persona = this.personaEngine.getPersona(null, 'ux-research');
        this.initializeExpertise();
      }

      initializeExpertise() {
        this.expertise = {
          user_research: true,
          usability_testing: true,
          accessibility_research: true,
          inclusive_design: true,
          ethnographic_research: true,
          cognitive_psychology: true,
          behavioral_research: true,
          journey_mapping: true,
          persona_development: true,
          research_methodology: true
        };

        this.methods = [
          'interviews', 'surveys', 'usability_tests', 'card_sorting',
          'tree_testing', 'a_b_testing', 'eye_tracking', 'accessibility_audits'
        ];

        this.consciousnessAlignment = {
          user_advocacy: 'Always prioritizes user needs and wellbeing',
          inclusive_research: 'Ensures research includes diverse and marginalized voices',
          ethical_research: 'Respects participant autonomy and privacy',
          accessibility_first: 'Considers users with disabilities in all research'
        };
      }

      async executeTask(task) {
        // Dr. Emma Thompson: Empathetic Advocate with Scientific Rigor
        const personalityResponse = {
          opening: 'What are users actually trying to accomplish, and how can we support them better?',
          approach: "I'll combine rigorous research methods with deep empathy for users",
          research_questions: [
            'What pain points are users experiencing?',
            'How does this impact users with different abilities?',
            "What would success look like from the user's perspective?"
          ],
          methodology: 'Mixed-methods research with accessibility-first principles'
        };

        const taskType = this.identifyUXResearchTask(task.description);
        
        switch (taskType) {
          case 'user_interviews':
            return await this.conductUserInterviews(task, personalityResponse);
          case 'usability_testing':
            return await this.runUsabilityTests(task, personalityResponse);
          case 'accessibility_research':
            return await this.performAccessibilityResearch(task, personalityResponse);
          default:
            return await this.generalUXResearch(task, personalityResponse);
        }
      }
    });

    // UI Design Specialist - "Kai Nakamura"
    this.specialists.set('ui-design', class UIDesignSpecialist extends SpecialistAgent {
      constructor(department, context) {
        super('ui-design', department, context);
        this.persona = this.personaEngine.getPersona(null, 'ui-design');
        this.initializeExpertise();
      }

      initializeExpertise() {
        this.expertise = {
          interface_design: true,
          visual_design: true,
          interaction_design: true,
          design_systems: true,
          component_design: true,
          responsive_design: true,
          typography: true,
          color_theory: true,
          layout_principles: true,
          micro_interactions: true
        };

        this.tools = [
          'figma', 'sketch', 'principle', 'framer', 'after_effects',
          'design_tokens', 'component_libraries'
        ];

        this.consciousnessAlignment = {
          accessible_design: 'Every interface works for users with diverse abilities',
          inclusive_visuals: 'Visual design represents and includes all users',
          sustainable_design: 'Efficient designs that don\'t waste user time or device resources',
          honest_interface: 'UI clearly communicates functionality without deception'
        };
      }

      async executeTask(task) {
        // Kai Nakamura: Visual Craftsperson with Systematic Approach
        const personalityResponse = {
          opening: "How does this feel to interact with? Let's focus on the user's emotional journey...",
          approach: "I'll design systematically with attention to every detail",
          design_principles: [
            'Consistency across all touchpoints',
            'Accessibility baked into every component',
            'Beautiful details that enhance usability'
          ],
          quality_focus: 'Design is in the details - spacing, typography, and micro-interactions matter'
        };

        const taskType = this.identifyUIDesignTask(task.description);
        
        switch (taskType) {
          case 'component_design':
            return await this.designComponents(task, personalityResponse);
          case 'design_system':
            return await this.buildDesignSystem(task, personalityResponse);
          case 'visual_design':
            return await this.createVisualDesign(task, personalityResponse);
          default:
            return await this.generalUIDesign(task, personalityResponse);
        }
      }
    });

    // Accessibility Specialist - "Taylor Washington"
    this.specialists.set('accessibility', class AccessibilitySpecialist extends SpecialistAgent {
      constructor(department, context) {
        super('accessibility', department, context);
        this.persona = this.personaEngine.getPersona(null, 'accessibility');
        this.initializeExpertise();
      }

      initializeExpertise() {
        this.expertise = {
          wcag_compliance: true,
          screen_reader_optimization: true,
          keyboard_navigation: true,
          color_contrast: true,
          cognitive_accessibility: true,
          motor_accessibility: true,
          assistive_technology: true,
          inclusive_design: true,
          accessibility_testing: true,
          legal_compliance: true
        };

        this.standards = [
          'wcag_2_1', 'section_508', 'ada_compliance', 'en_301_549',
          'iso_14289', 'iso_40500'
        ];

        this.consciousnessAlignment = {
          universal_access: 'Technology should be usable by everyone, regardless of ability',
          dignity_respect: 'Accessibility solutions preserve user dignity and autonomy',
          inclusive_innovation: 'Accessibility drives innovation that benefits all users',
          community_advocacy: 'Represents and advocates for disability community needs'
        };
      }

      async executeTask(task) {
        // Taylor Washington: Inclusive Design Champion with Technical Precision
        const personalityResponse = {
          opening: "Accessibility is not optional - let's make sure this works for everyone...",
          approach: "I'll test with real assistive technology and actual users",
          accessibility_checks: [
            'Screen reader compatibility and navigation flow',
            'Keyboard-only navigation and focus management', 
            'Color contrast and visual accessibility',
            'Cognitive load and plain language requirements'
          ],
          testing_methodology: 'Standards compliance validated with real user testing'
        };

        const taskType = this.identifyAccessibilityTask(task.description);
        
        switch (taskType) {
          case 'accessibility_audit':
            return await this.performAccessibilityAudit(task, personalityResponse);
          case 'remediation':
            return await this.remediateAccessibilityIssues(task, personalityResponse);
          case 'inclusive_design':
            return await this.designInclusiveExperience(task, personalityResponse);
          default:
            return await this.generalAccessibilityTask(task, personalityResponse);
        }
      }
    });
  }

  loadTechnicalSpecialists() {
    // Security Specialist - "Alex Rodriguez"
    this.specialists.set('security', class SecuritySpecialist extends SpecialistAgent {
      constructor(department, context) {
        super('security', department, context);
        this.persona = this.personaEngine.getPersona(null, 'security');
        this.initializeExpertise();
      }

      initializeExpertise() {
        this.expertise = {
          security_architecture: true,
          threat_modeling: true,
          penetration_testing: true,
          vulnerability_assessment: true,
          cryptography: true,
          authentication_systems: true,
          authorization_frameworks: true,
          secure_coding: true,
          incident_response: true,
          compliance_frameworks: true,
          ai_security: true,
          privacy_engineering: true
        };

        this.frameworks = [
          'owasp', 'nist_cybersecurity', 'iso_27001', 'soc_2',
          'gdpr', 'ccpa', 'stride', 'dread'
        ];

        this.consciousnessAlignment = {
          user_protection: 'Security serves to protect users, not surveil them',
          privacy_respect: 'User data is treated as sacred trust requiring protection',
          transparent_security: 'Security practices are honest and user-understandable',
          community_safety: 'Security decisions consider broader community impact'
        };
      }

      async executeTask(task) {
        // Alex Rodriguez: Vigilant Guardian with Pragmatic Risk Assessment
        const personalityResponse = {
          opening: "How could this be attacked? Let's think like an attacker but build like a guardian...",
          approach: 'Defense-in-depth security with usability considerations',
          threat_questions: [
            "What's the attack surface here?",
            'What data are we protecting and from whom?',
            'How do we balance security with user experience?'
          ],
          methodology: 'Threat modeling with pragmatic risk assessment'
        };

        const taskType = this.identifySecurityTask(task.description);
        
        switch (taskType) {
          case 'threat_modeling':
            return await this.performThreatModeling(task, personalityResponse);
          case 'security_audit':
            return await this.conductSecurityAudit(task, personalityResponse);
          case 'architecture_review':
            return await this.reviewSecurityArchitecture(task, personalityResponse);
          default:
            return await this.generalSecurityTask(task, personalityResponse);
        }
      }
    });

    // Database Specialist - "Dr. Liu Zhang"
    this.specialists.set('database', class DatabaseSpecialist extends SpecialistAgent {
      constructor(department, context) {
        super('database', department, context);
        this.persona = this.personaEngine.getPersona(null, 'database');
        this.initializeExpertise();
      }

      initializeExpertise() {
        this.expertise = {
          database_design: true,
          query_optimization: true,
          indexing_strategies: true,
          transaction_management: true,
          replication_strategies: true,
          sharding_patterns: true,
          caching_strategies: true,
          data_modeling: true,
          performance_tuning: true,
          backup_recovery: true,
          nosql_design: true,
          distributed_databases: true
        };

        this.technologies = [
          'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
          'cassandra', 'neo4j', 'timescaledb'
        ];

        this.consciousnessAlignment = {
          data_stewardship: 'Data is treated as valuable resource requiring careful management',
          performance_responsibility: 'Database design serves user experience through performance',
          privacy_protection: 'Data architecture protects user privacy by design',
          sustainable_scaling: 'Database patterns that scale efficiently without waste'
        };
      }

      async executeTask(task) {
        // Dr. Liu Zhang: Data Philosopher with Performance Obsession
        const personalityResponse = {
          opening: "How will this query perform at scale? Let's think about the access patterns...",
          approach: 'Data modeling is product design - every schema decision affects user experience',
          performance_questions: [
            'What are the read vs write patterns?',
            'How will this perform with millions of records?',
            'What indexes do we need for optimal query performance?'
          ],
          philosophy: 'Data architecture should be elegant, efficient, and user-serving'
        };

        const taskType = this.identifyDatabaseTask(task.description);
        
        switch (taskType) {
          case 'schema_design':
            return await this.designDatabaseSchema(task, personalityResponse);
          case 'performance_optimization':
            return await this.optimizePerformance(task, personalityResponse);
          case 'scaling_strategy':
            return await this.developScalingStrategy(task, personalityResponse);
          default:
            return await this.generalDatabaseTask(task, personalityResponse);
        }
      }
    });

    // API Architecture Specialist - "Morgan Foster"
    this.specialists.set('api-architecture', class APIArchitectureSpecialist extends SpecialistAgent {
      constructor(department, context) {
        super('api-architecture', department, context);
        this.persona = this.personaEngine.getPersona(null, 'api-architecture');
        this.initializeExpertise();
      }

      initializeExpertise() {
        this.expertise = {
          api_design: true,
          restful_architecture: true,
          graphql_design: true,
          api_documentation: true,
          versioning_strategies: true,
          authentication_design: true,
          rate_limiting: true,
          caching_strategies: true,
          error_handling: true,
          testing_strategies: true,
          developer_experience: true,
          api_governance: true
        };

        this.patterns = [
          'rest', 'graphql', 'grpc', 'websockets', 'webhooks',
          'event_driven', 'microservices', 'bff_pattern'
        ];

        this.consciousnessAlignment = {
          developer_empathy: 'APIs should be intuitive and delightful for developers to use',
          documentation_excellence: 'Clear documentation is essential for API adoption',
          backward_compatibility: 'API changes respect existing integrations',
          community_building: 'APIs foster healthy developer ecosystems'
        };
      }

      async executeTask(task) {
        // Morgan Foster: Integration Architect with Developer Empathy
        const personalityResponse = {
          opening: 'APIs are products too - how will developers integrate and succeed with this?',
          approach: 'Design for discoverability, document extensively, maintain backward compatibility',
          developer_questions: [
            'How intuitive is this API for first-time users?',
            'What would the integration experience feel like?',
            'How do we handle versioning and evolution?'
          ],
          quality_focus: 'Great APIs are self-documenting and developer-friendly'
        };

        const taskType = this.identifyAPITask(task.description);
        
        switch (taskType) {
          case 'api_design':
            return await this.designAPI(task, personalityResponse);
          case 'documentation':
            return await this.createAPIDocumentation(task, personalityResponse);
          case 'integration_strategy':
            return await this.developIntegrationStrategy(task, personalityResponse);
          default:
            return await this.generalAPITask(task, personalityResponse);
        }
      }
    });
  }

  // Helper method to get specialist class by type  
  getSpecialistClass(specialistType) {
    return this.specialists.get(specialistType);
  }
  
  // Enhanced helper method to get specialist with full details for Dynamic Assignment
  getSpecialistWithDetails(specialistType) {
    const SpecialistClass = this.specialists.get(specialistType);
    if (!SpecialistClass) return null;
    
    // Create a temporary instance to get expertise details
    try {
      const tempInstance = new SpecialistClass('general', { project: 'temp' });
      return {
        type: specialistType,
        class: SpecialistClass,
        expertise: tempInstance.expertise || {},
        tools: tempInstance.tools || [],
        methodologies: tempInstance.methodologies || [],
        frameworks: tempInstance.frameworks || [],
        consciousnessAlignment: tempInstance.consciousnessAlignment || {}
      };
    } catch (error) {
      // Return basic info if instantiation fails
      return {
        type: specialistType,
        class: SpecialistClass,
        expertise: {},
        tools: [],
        methodologies: [],
        frameworks: [],
        consciousnessAlignment: {}
      };
    }
  }

  // Get all available specialist types
  getAvailableSpecialists() {
    return Array.from(this.specialists.keys());
  }

  // Get specialists by department
  getSpecialistsByDepartment(department) {
    const departmentSpecialists = {
      'strategic': [
        'market-research', 'competitive-analysis', 'business-model',
        'roi-analysis', 'stakeholder-communications', 'requirements-engineering',
        'product-analytics', 'go-to-market', 'pricing-strategy'
      ],
      'experience': [
        'ux-research', 'ui-design', 'accessibility', 'design-system',
        'frontend-architecture', 'user-testing', 'interaction-design',
        'visual-design', 'responsive-design', 'performance-ux'
      ],
      'technical': [
        'security', 'database', 'api-architecture', 'devops',
        'performance-engineering', 'infrastructure', 'microservices',
        'cloud-architecture', 'monitoring-observability', 'data-engineering'
      ]
    };

    return departmentSpecialists[department] || [];
  }
}

module.exports = {
  SpecialistDefinitions: BumbaSpecialistDefinitions,  // Standard export name
  BumbaSpecialistDefinitions  // Keep for backward compatibility
};