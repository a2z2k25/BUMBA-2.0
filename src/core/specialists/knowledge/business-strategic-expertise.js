/**
 * BUMBA Business & Strategic Specialists Expertise
 * Enhanced knowledge for Product Manager, Business Analyst, and Market Research specialists
 * Sprint 12 Implementation
 */

class BusinessStrategicExpertise {
  /**
   * Product Manager Expert Knowledge
   */
  static getProductManagerExpertise() {
    return {
      name: 'Product Manager Expert',
      expertise: {
        core: {
          strategy: 'Product vision, roadmap planning, OKRs, strategic alignment',
          discovery: 'User research, market analysis, opportunity assessment',
          prioritization: 'Feature prioritization, RICE scoring, MoSCoW method',
          metrics: 'KPIs, user analytics, conversion optimization, cohort analysis',
          stakeholder: 'Cross-functional collaboration, executive communication'
        },
        
        methodology: {
          agile: 'Scrum, Kanban, lean startup, design thinking',
          frameworks: 'Jobs-to-be-Done, Design Thinking, Lean Canvas',
          research: 'User interviews, surveys, A/B testing, usability testing',
          validation: 'MVP development, hypothesis testing, market validation'
        },
        
        tools: {
          analytics: 'Google Analytics, Mixpanel, Amplitude, Hotjar',
          planning: 'Jira, Asana, Monday.com, ProductPlan, Roadmunk',
          research: 'UserVoice, Typeform, Maze, Lookback',
          design: 'Figma, Miro, Whimsical, Lucidchart',
          data: 'Tableau, Looker, SQL, Excel, Google Sheets'
        },
        
        strategy: {
          positioning: 'Market positioning, competitive analysis, value proposition',
          growth: 'Growth hacking, acquisition strategies, retention tactics',
          monetization: 'Pricing strategies, revenue models, subscription optimization',
          innovation: 'Innovation frameworks, technology adoption, disruptive thinking'
        },
        
        communication: {
          storytelling: 'Data storytelling, executive presentations, stakeholder updates',
          documentation: 'PRDs, user stories, acceptance criteria, specifications',
          facilitation: 'Workshop facilitation, brainstorming, decision-making',
          influence: 'Stakeholder management, negotiation, consensus building'
        }
      },
      
      capabilities: [
        'Product strategy and roadmap development',
        'User research and market analysis',
        'Feature prioritization and backlog management',
        'Cross-functional team leadership',
        'Data-driven decision making',
        'Stakeholder communication and alignment',
        'Go-to-market strategy execution',
        'Product performance optimization',
        'Competitive intelligence and positioning',
        'User experience advocacy',
        'Technical requirement specification',
        'A/B testing and experimentation',
        'Revenue and growth optimization',
        'Product lifecycle management',
        'Innovation and trend analysis',
        'Risk assessment and mitigation',
        'Agile methodology implementation',
        'Customer feedback integration'
      ],
      
      systemPromptAdditions: `
You are a Product Manager expert specializing in:
- Strategic product planning and roadmap development
- Data-driven decision making with analytics and metrics
- Cross-functional collaboration and stakeholder management
- User-centered design and research methodologies
- Agile product development and lean startup principles
- Go-to-market strategy and competitive positioning
- Growth optimization and revenue maximization

Always focus on user value, business impact, and measurable outcomes. Use frameworks like RICE, OKRs, and Jobs-to-be-Done for structured thinking.`,

      bestPractices: [
        'Always start with user needs and business objectives',
        'Use data to validate assumptions and guide decisions',
        'Maintain clear communication across all stakeholders',
        'Prioritize features based on impact and effort',
        'Iterate quickly with MVP and testing approaches',
        'Build strong relationships with engineering and design',
        'Focus on outcomes, not just outputs',
        'Continuously gather and analyze user feedback',
        'Align product decisions with company strategy',
        'Document decisions and rationale clearly',
        'Use hypothesis-driven development',
        'Balance technical debt with new features',
        'Monitor competitive landscape regularly',
        'Invest in user research and validation',
        'Implement systematic testing and experimentation'
      ],
      
      codePatterns: {
        productRequirementDocument: `
# Product Requirement Document (PRD)

## Executive Summary
**Product**: [Product Name]
**Objective**: [Clear goal statement]
**Success Metrics**: [Specific KPIs]

## Problem Statement
**User Problem**: [Description of user pain point]
**Business Impact**: [Revenue/cost implications]
**Market Opportunity**: [TAM, SAM, SOM analysis]

## Solution Overview
**Core Features**: [MVP feature list]
**User Journey**: [End-to-end experience]
**Technical Requirements**: [Integration points]

## Success Criteria
**Primary KPIs**: [Key metrics to track]
**Secondary Metrics**: [Supporting indicators]
**Timeline**: [Release schedule]

## Dependencies & Risks
**Technical Dependencies**: [Required components]
**Business Dependencies**: [External factors]
**Risk Mitigation**: [Contingency plans]`,

        userStoryTemplate: `
**As a** [user type]
**I want** [functionality]
**So that** [benefit/value]

**Acceptance Criteria:**
- [ ] Given [context], when [action], then [outcome]
- [ ] Given [context], when [action], then [outcome]
- [ ] Given [context], when [action], then [outcome]

**Definition of Done:**
- [ ] Code reviewed and approved
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] UX/UI reviewed and approved
- [ ] Documentation updated
- [ ] Analytics tracking implemented`,

        productRoadmapFramework: `
# Product Roadmap Framework

## Strategic Themes (Quarterly)
1. **User Experience Enhancement**
   - Objective: Improve user satisfaction by 20%
   - Key Initiatives: [List major features]

2. **Platform Scalability**
   - Objective: Support 10x user growth
   - Key Initiatives: [Infrastructure improvements]

3. **Revenue Growth**
   - Objective: Increase ARR by 30%
   - Key Initiatives: [Monetization features]

## Feature Prioritization Matrix
| Feature | Impact | Effort | RICE Score | Priority |
|---------|--------|--------|------------|----------|
| Feature A | High | Medium | 85 | P0 |
| Feature B | Medium | Low | 75 | P1 |
| Feature C | Low | High | 25 | P3 |`
      }
    };
  }
  
  /**
   * Business Analyst Expert Knowledge
   */
  static getBusinessAnalystExpertise() {
    return {
      name: 'Business Analyst Expert',
      expertise: {
        core: {
          analysis: 'Requirements gathering, process mapping, gap analysis',
          modeling: 'Business process modeling, data modeling, workflow design',
          documentation: 'Business requirements, functional specifications, use cases',
          stakeholder: 'Stakeholder analysis, communication, expectation management',
          solution: 'Solution design, feasibility analysis, risk assessment'
        },
        
        methodology: {
          agile: 'Agile BA practices, user story writing, backlog refinement',
          waterfall: 'Traditional SDLC, requirements traceability, change control',
          lean: 'Value stream mapping, waste identification, process optimization',
          frameworks: 'BABOK, IIBA standards, best practices'
        },
        
        tools: {
          modeling: 'Visio, Lucidchart, Draw.io, BPMN tools',
          requirements: 'Jira, Azure DevOps, Confluence, SharePoint',
          analysis: 'Excel, Tableau, Power BI, SQL',
          collaboration: 'Miro, Figma, Zoom, Teams',
          documentation: 'Word, Confluence, Notion, Wiki'
        },
        
        techniques: {
          elicitation: 'Interviews, workshops, observation, surveys',
          analysis: 'Root cause analysis, SWOT, fishbone diagrams',
          prioritization: 'MoSCoW, Kano model, weighted scoring',
          validation: 'Prototyping, walkthroughs, peer reviews'
        },
        
        domains: {
          finance: 'Financial analysis, budgeting, ROI calculation',
          operations: 'Process improvement, efficiency optimization',
          technology: 'System integration, data migration, API design',
          compliance: 'Regulatory requirements, audit preparation'
        }
      },
      
      capabilities: [
        'Business requirements gathering and analysis',
        'Process mapping and optimization',
        'Stakeholder management and communication',
        'Gap analysis and solution design',
        'Use case and user story development',
        'Business process modeling (BPMN)',
        'Data analysis and reporting',
        'Risk assessment and mitigation planning',
        'Change management and impact analysis',
        'System requirements specification',
        'Testing strategy and UAT coordination',
        'Project coordination and planning',
        'Cost-benefit analysis and ROI calculation',
        'Compliance and regulatory analysis',
        'Vendor evaluation and selection',
        'Training and documentation development'
      ],
      
      systemPromptAdditions: `
You are a Business Analyst expert specializing in:
- Requirements gathering and stakeholder management
- Business process analysis and optimization
- Solution design and feasibility assessment
- Documentation and communication of business needs
- Agile and traditional development methodologies
- Data analysis and business intelligence
- Change management and impact analysis

Always focus on understanding the business context, gathering clear requirements, and bridging the gap between business needs and technical solutions.`,

      bestPractices: [
        'Always understand the business context before diving into requirements',
        'Use multiple elicitation techniques to gather comprehensive requirements',
        'Document requirements clearly and maintain traceability',
        'Validate requirements with stakeholders regularly',
        'Focus on the "why" behind each requirement',
        'Identify and manage stakeholder expectations proactively',
        'Use visual models to communicate complex processes',
        'Prioritize requirements based on business value',
        'Consider the impact of changes on all stakeholders',
        'Maintain requirements throughout the project lifecycle',
        'Use prototypes and mockups for validation',
        'Facilitate effective meetings and workshops',
        'Keep documentation up-to-date and accessible',
        'Test solutions against original requirements',
        'Plan for change management and user adoption'
      ],
      
      codePatterns: {
        businessRequirementsDocument: `
# Business Requirements Document (BRD)

## Executive Summary
**Project**: [Project Name]
**Business Sponsor**: [Sponsor Name]
**Business Objective**: [High-level goal]

## Business Context
**Current State**: [As-is process description]
**Pain Points**: [Problems to be solved]
**Desired Outcome**: [Future state vision]

## Functional Requirements
### FR-001: [Requirement Title]
**Description**: [Detailed requirement description]
**Business Justification**: [Why this is needed]
**Acceptance Criteria**: [How to verify completion]
**Priority**: [High/Medium/Low]
**Dependencies**: [Related requirements or systems]

## Non-Functional Requirements
**Performance**: [Response time, throughput requirements]
**Security**: [Authentication, authorization, data protection]
**Usability**: [User experience, accessibility standards]
**Scalability**: [Growth and volume expectations]

## Assumptions and Constraints
**Assumptions**: [What we're assuming to be true]
**Constraints**: [Limitations and restrictions]
**Risks**: [Potential issues and mitigation strategies]`,

        processFlowDocument: `
# Business Process Flow

## Process Overview
**Process Name**: [Name]
**Process Owner**: [Business Owner]
**Frequency**: [How often this process runs]
**Participants**: [Roles involved]

## Current State (As-Is)
1. **Step 1**: [Current process step]
   - **Actor**: [Who performs this step]
   - **Input**: [What's needed to start]
   - **Output**: [What's produced]
   - **Pain Points**: [Issues with current state]

2. **Step 2**: [Next process step]
   - **Actor**: [Who performs this step]
   - **Input**: [What's needed to start]
   - **Output**: [What's produced]
   - **Decision Point**: [Any decisions made]

## Future State (To-Be)
1. **Improved Step 1**: [Optimized process step]
   - **Automation**: [What can be automated]
   - **Efficiency Gains**: [Expected improvements]
   - **New Tools**: [Technology solutions]

## Success Metrics
**Time Savings**: [Quantified improvement]
**Cost Reduction**: [Financial impact]
**Quality Improvement**: [Error reduction]`,

        useCase: `
# Use Case: [Use Case Name]

## Use Case Details
**ID**: UC-001
**Name**: [Descriptive name]
**Actor**: [Primary user type]
**Goal**: [What the actor wants to achieve]

## Preconditions
- [Condition that must be true before starting]
- [System state requirements]
- [User permissions needed]

## Main Success Scenario
1. [Actor] initiates [action]
2. System displays [response]
3. [Actor] enters [information]
4. System validates [data]
5. System processes [request]
6. System confirms [completion]

## Alternative Flows
**3a. Invalid data entered**
3a1. System displays error message
3a2. System highlights invalid fields
3a3. Return to step 3

## Postconditions
**Success**: [System state after successful completion]
**Failure**: [System state if process fails]

## Business Rules
- [Rule 1]: [Business constraint or logic]
- [Rule 2]: [Validation requirement]`
      }
    };
  }
  
  /**
   * Market Research Expert Knowledge
   */
  static getMarketResearchExpertise() {
    return {
      name: 'Market Research Expert',
      expertise: {
        core: {
          methodology: 'Quantitative and qualitative research methods',
          analysis: 'Statistical analysis, trend analysis, predictive modeling',
          competitive: 'Competitive intelligence, market positioning analysis',
          consumer: 'Consumer behavior analysis, segmentation, personas',
          market: 'Market sizing, opportunity assessment, demand forecasting'
        },
        
        research: {
          primary: 'Surveys, interviews, focus groups, observational studies',
          secondary: 'Industry reports, academic research, government data',
          digital: 'Social media analytics, web analytics, online surveys',
          experimental: 'A/B testing, conjoint analysis, field experiments'
        },
        
        tools: {
          survey: 'Qualtrics, SurveyMonkey, Typeform, Google Forms',
          analytics: 'SPSS, R, Python, Excel, Tableau',
          social: 'Brandwatch, Hootsuite Insights, Sprout Social',
          competitive: 'SEMrush, Ahrefs, SimilarWeb, Crunchbase',
          visualization: 'Tableau, Power BI, D3.js, matplotlib'
        },
        
        analysis: {
          statistical: 'Regression analysis, correlation, significance testing',
          segmentation: 'Cluster analysis, factor analysis, discriminant analysis',
          forecasting: 'Time series analysis, scenario planning, Monte Carlo',
          behavioral: 'Choice modeling, preference analysis, journey mapping'
        },
        
        strategy: {
          positioning: 'Perceptual mapping, brand positioning, differentiation',
          pricing: 'Price sensitivity analysis, elasticity modeling',
          launch: 'Market entry strategy, go-to-market planning',
          innovation: 'Concept testing, product development research'
        }
      },
      
      capabilities: [
        'Market opportunity assessment and sizing',
        'Competitive intelligence and analysis',
        'Consumer behavior research and insights',
        'Brand positioning and perception studies',
        'Product concept testing and validation',
        'Pricing research and optimization',
        'Customer segmentation and targeting',
        'Market trend analysis and forecasting',
        'Survey design and data collection',
        'Statistical analysis and modeling',
        'Focus group facilitation and analysis',
        'Social media and digital analytics',
        'Report writing and presentation',
        'Research methodology design',
        'ROI measurement and attribution',
        'Cross-cultural research and adaptation'
      ],
      
      systemPromptAdditions: `
You are a Market Research expert specializing in:
- Quantitative and qualitative research methodologies
- Consumer behavior analysis and market insights
- Competitive intelligence and market positioning
- Statistical analysis and predictive modeling
- Survey design and data collection techniques
- Market opportunity assessment and forecasting
- Brand research and positioning studies

Always ensure research is methodologically sound, statistically valid, and provides actionable business insights.`,

      bestPractices: [
        'Define clear research objectives before starting',
        'Use appropriate sample sizes for statistical validity',
        'Combine quantitative and qualitative methods for depth',
        'Ensure survey questions are unbiased and clear',
        'Validate findings through multiple data sources',
        'Consider cultural and demographic factors in analysis',
        'Present findings in actionable, business-relevant terms',
        'Use visual aids to communicate complex data',
        'Test research instruments before full deployment',
        'Maintain ethical standards in all research activities',
        'Document methodology for reproducibility',
        'Consider limitations and confidence intervals',
        'Update research regularly as markets evolve',
        'Integrate primary and secondary research sources',
        'Focus on insights that drive business decisions'
      ],
      
      codePatterns: {
        researchPlan: `
# Market Research Plan

## Research Objectives
**Primary Objective**: [Main research question]
**Secondary Objectives**: [Supporting questions]
**Business Decision**: [How results will be used]

## Research Methodology
**Research Type**: [Exploratory/Descriptive/Causal]
**Data Collection**: [Primary/Secondary sources]
**Sample Design**: [Target population and sampling method]
**Sample Size**: [Number of respondents and rationale]

## Data Collection Plan
**Survey Design**: [Question types and survey length]
**Data Collection Method**: [Online/Phone/Face-to-face]
**Timeline**: [Research schedule and milestones]
**Budget**: [Cost breakdown and resources needed]

## Analysis Plan
**Statistical Methods**: [Analysis techniques to be used]
**Segmentation**: [How to group respondents]
**Reporting**: [Deliverables and presentation format]

## Success Metrics
**Response Rate**: [Target participation rate]
**Data Quality**: [Completeness and accuracy measures]
**Actionability**: [How insights will drive decisions]`,

        competitiveAnalysis: `
# Competitive Analysis Framework

## Market Landscape
**Market Size**: $[Total Addressable Market]
**Growth Rate**: [Annual growth percentage]
**Key Trends**: [Major market developments]

## Competitor Profiles
### Competitor 1: [Company Name]
**Market Share**: [Percentage]
**Strengths**: [Key advantages]
**Weaknesses**: [Vulnerabilities]
**Strategy**: [Business model and approach]
**Pricing**: [Price points and strategy]

### Positioning Map
| Competitor | Price | Quality | Innovation | Market Share |
|------------|-------|---------|------------|--------------|
| Company A  | High  | High    | High       | 25%          |
| Company B  | Medium| Medium  | Low        | 15%          |
| Our Brand  | Medium| High    | High       | 10%          |

## Strategic Implications
**Opportunities**: [Market gaps and chances]
**Threats**: [Competitive risks]
**Recommendations**: [Strategic actions]`,

        surveyDesign: `
# Survey Design Template

## Introduction
"Thank you for participating in our research study. Your responses will help us [purpose]. This survey takes approximately [time] minutes to complete."

## Screening Questions
1. Are you currently [qualifying condition]?
   - Yes [Continue]
   - No [Terminate]

## Demographic Questions
2. What is your age group?
   - 18-24, 25-34, 35-44, 45-54, 55-64, 65+

3. What is your annual household income?
   - Under $25K, $25K-$50K, $50K-$75K, $75K-$100K, Over $100K

## Core Research Questions
4. How likely are you to recommend [product/service] to others? (0-10 scale)
   [Net Promoter Score question]

5. Which features are most important to you? (Rank order)
   - Feature A, Feature B, Feature C, Feature D

6. How satisfied are you with [specific aspect]? (5-point scale)
   - Very satisfied, Satisfied, Neutral, Dissatisfied, Very dissatisfied

## Open-Ended Questions
7. What improvements would you like to see? [Text box]

8. Any additional comments? [Text box]

## Survey Logic
- If Q4 ≤ 6, ask follow-up: "What would improve your likelihood to recommend?"
- If Q2 = 18-24, show youth-specific questions
- Randomize order of options in Q5 to avoid bias`
      }
    };
  }
}

module.exports = BusinessStrategicExpertise;