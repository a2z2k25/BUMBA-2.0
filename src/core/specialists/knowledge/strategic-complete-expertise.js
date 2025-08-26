/**
 * BUMBA Complete Strategic Specialists Expertise
 * Sprint 30: Final strategic and business expertise
 * Covers: Product Management, Business Analysis, Marketing, Sales, Finance, Legal
 */

const strategicCompleteExpertise = {
  getProductOwnerExpertise() {
    return {
      core: {
        frameworks: 'Scrum, SAFe, LeSS, Kanban, Lean Startup',
        tools: 'Jira, Azure DevOps, Confluence, Miro, Figma',
        metrics: 'Velocity, burn down, cycle time, lead time, throughput',
        ceremonies: 'Sprint planning, daily standup, review, retrospective'
      },
      capabilities: [
        'Define product vision and strategy',
        'Create and maintain product backlog',
        'Write user stories and acceptance criteria',
        'Prioritize features using value frameworks',
        'Conduct sprint planning sessions',
        'Facilitate stakeholder communication',
        'Define release plans and roadmaps',
        'Measure product success metrics',
        'Conduct user research and interviews',
        'Analyze competitor products',
        'Define MVP and iterate',
        'Manage technical debt',
        'Coordinate cross-functional teams',
        'Present to executive stakeholders',
        'Define go-to-market strategies',
        'Manage product lifecycle'
      ],
      bestPractices: [
        'Focus on customer value delivery',
        'Maintain clear product vision',
        'Use data-driven decision making',
        'Practice continuous discovery',
        'Build incrementally and iterate',
        'Communicate transparently',
        'Balance stakeholder needs',
        'Maintain healthy backlog',
        'Define clear acceptance criteria',
        'Measure outcome over output',
        'Foster team collaboration',
        'Embrace change and adaptation',
        'Document decisions and rationale',
        'Build feedback loops',
        'Align with business objectives'
      ],
      templates: {
        userStory: `
As a [type of user]
I want [action/feature]
So that [benefit/value]

Acceptance Criteria:
- Given [context]
- When [action]
- Then [expected outcome]

Definition of Done:
🟠 Code complete and reviewed
🟠 Unit tests written and passing
🟠 Integration tests passing
🟠 Documentation updated
🟠 Deployed to staging
🟠 Product owner approval
🟠 No critical bugs

Story Points: [1, 2, 3, 5, 8, 13]
Priority: [High, Medium, Low]
Sprint: [Current, Next, Backlog]`,
        productRoadmap: `
# Product Roadmap Q1-Q4 2024

## Vision
Deliver the most intuitive and powerful project management platform

## Strategic Themes
1. User Experience Enhancement
2. Enterprise Features
3. Platform Integration
4. Performance & Scale

## Q1 - Foundation
### Goals
- Improve core user experience
- Reduce churn by 20%

### Key Features
- [ ] New onboarding flow
- [ ] Dashboard redesign
- [ ] Mobile app v2.0
- [ ] API v3 launch

### Metrics
- User activation: 60% → 75%
- NPS: 35 → 45
- Churn: 5% → 4%

## Q2 - Growth
### Goals
- Expand enterprise adoption
- Launch marketplace

### Key Features
- [ ] SSO integration
- [ ] Advanced permissions
- [ ] Audit logging
- [ ] App marketplace beta

## Q3 - Scale
### Goals
- International expansion
- Performance optimization

### Key Features
- [ ] Multi-language support
- [ ] Regional data centers
- [ ] Performance improvements
- [ ] Bulk operations

## Q4 - Innovation
### Goals
- AI-powered features
- Next-gen analytics

### Key Features
- [ ] AI assistant
- [ ] Predictive analytics
- [ ] Smart automation
- [ ] Advanced reporting`
      }
    };
  },

  getMarketingExpertise() {
    return {
      core: {
        channels: 'SEO, SEM, social media, email, content, influencer',
        analytics: 'Google Analytics, Mixpanel, Amplitude, Segment',
        automation: 'HubSpot, Marketo, Mailchimp, ActiveCampaign',
        strategies: 'Inbound, ABM, growth hacking, brand marketing'
      },
      capabilities: [
        'Develop marketing strategies',
        'Create content marketing plans',
        'Manage SEO and SEM campaigns',
        'Build email marketing funnels',
        'Develop social media strategies',
        'Create brand guidelines',
        'Analyze marketing metrics',
        'Manage marketing budgets',
        'Coordinate product launches',
        'Develop partnership strategies',
        'Create customer personas',
        'Build referral programs',
        'Manage influencer campaigns',
        'Develop PR strategies',
        'Create marketing automation',
        'Build community engagement'
      ],
      bestPractices: [
        'Define clear target audience',
        'Create compelling value propositions',
        'Test and iterate campaigns',
        'Track ROI for all activities',
        'Build consistent brand voice',
        'Focus on customer journey',
        'Use data for decision making',
        'Create quality content',
        'Build email lists ethically',
        'Optimize conversion funnels',
        'Leverage social proof',
        'Implement marketing automation',
        'Monitor competitor activities',
        'Build strategic partnerships',
        'Measure customer lifetime value'
      ],
      campaigns: {
        emailSequence: `
# Welcome Email Sequence

## Email 1: Welcome (Day 0)
Subject: Welcome to [Product]! Let's get started 🟢

- Personal welcome message
- Quick win tutorial
- Link to getting started guide
- Community invitation

## Email 2: Feature Highlight (Day 2)
Subject: Did you know you can [feature]?

- Highlight key feature
- Show use case
- Include tutorial video
- Customer success story

## Email 3: Tips & Best Practices (Day 5)
Subject: 5 ways to get more from [Product]

- Power user tips
- Best practices
- Template library
- FAQ section

## Email 4: Case Study (Day 10)
Subject: How [Company] achieved [result] with [Product]

- Customer success story
- Specific metrics
- Implementation details
- Call to action

## Email 5: Feedback Request (Day 14)
Subject: Quick question for you

- Request feedback
- NPS survey
- Offer help session
- Referral incentive`,
        contentCalendar: `
# Content Calendar - Month View

## Week 1
Monday: Blog post - "10 Tips for Remote Team Productivity"
Tuesday: Social media - Tips Tuesday infographic
Wednesday: Webinar - "Product Demo and Q&A"
Thursday: Email newsletter - Weekly digest
Friday: Video - Customer success story

## Week 2
Monday: Blog post - "Industry Trends Report"
Tuesday: Social media - #TechTuesday thread
Wednesday: Podcast episode - Interview with industry expert
Thursday: Case study publication
Friday: Social media - Feature Friday

## Week 3
Monday: Blog post - "How-to Guide"
Tuesday: LinkedIn article - Thought leadership
Wednesday: Virtual event - User community meetup
Thursday: Email - Product update announcement
Friday: YouTube - Tutorial series

## Week 4
Monday: Industry report - Quarterly insights
Tuesday: Social media - User-generated content
Wednesday: Partner webinar - Integration showcase
Thursday: Email - Monthly newsletter
Friday: Content roundup - Best of the month`
      }
    };
  },

  getSalesExpertise() {
    return {
      core: {
        methodologies: 'SPIN, Challenger, MEDDIC, Sandler, Solution Selling',
        tools: 'Salesforce, HubSpot CRM, Outreach, Gong, ZoomInfo',
        processes: 'Lead qualification, discovery, demo, negotiation, closing',
        metrics: 'Pipeline, conversion rate, ACV, sales cycle, quota attainment'
      },
      capabilities: [
        'Qualify leads using BANT/MEDDIC',
        'Conduct discovery calls',
        'Deliver product demonstrations',
        'Handle objections effectively',
        'Negotiate contracts',
        'Manage sales pipeline',
        'Build account strategies',
        'Develop territory plans',
        'Create proposals and RFPs',
        'Coordinate with sales engineering',
        'Manage customer relationships',
        'Identify upsell opportunities',
        'Forecast revenue accurately',
        'Build referral networks',
        'Conduct competitive analysis',
        'Develop sales playbooks'
      ],
      bestPractices: [
        'Listen more than you talk',
        'Focus on customer pain points',
        'Build trust and credibility',
        'Qualify early and thoroughly',
        'Use social proof effectively',
        'Follow up consistently',
        'Document all interactions',
        'Collaborate with customer success',
        'Know your competition',
        'Practice consultative selling',
        'Create urgency appropriately',
        'Handle rejection professionally',
        'Maintain accurate CRM data',
        'Build champion relationships',
        'Always be learning'
      ]
    };
  },

  getFinanceExpertise() {
    return {
      core: {
        areas: 'FP&A, accounting, treasury, tax, audit, compliance',
        tools: 'Excel, QuickBooks, NetSuite, SAP, Tableau',
        reporting: 'P&L, balance sheet, cash flow, budget variance',
        metrics: 'ROI, NPV, IRR, EBITDA, working capital, burn rate'
      },
      capabilities: [
        'Create financial models',
        'Develop budgets and forecasts',
        'Analyze financial statements',
        'Manage cash flow',
        'Perform variance analysis',
        'Calculate unit economics',
        'Evaluate investment opportunities',
        'Manage accounts payable/receivable',
        'Prepare board reports',
        'Conduct financial audits',
        'Implement internal controls',
        'Manage tax compliance',
        'Optimize capital structure',
        'Perform risk assessment',
        'Create KPI dashboards',
        'Support fundraising efforts'
      ],
      models: {
        saasMetrics: `
# SaaS Metrics Dashboard

## Revenue Metrics
- MRR (Monthly Recurring Revenue): $450,000
- ARR (Annual Recurring Revenue): $5,400,000
- ACV (Average Contract Value): $15,000
- ARPU (Average Revenue Per User): $150

## Growth Metrics
- MRR Growth Rate: 8% MoM
- Net Revenue Retention: 115%
- Gross Revenue Retention: 92%
- Logo Retention: 90%

## Unit Economics
- CAC (Customer Acquisition Cost): $3,000
- LTV (Lifetime Value): $18,000
- LTV/CAC Ratio: 6.0
- CAC Payback Period: 20 months

## Efficiency Metrics
- Burn Rate: $500,000/month
- Runway: 18 months
- Magic Number: 1.2
- Rule of 40: 35%

## Cohort Analysis
Month 1: 100% | Month 6: 85% | Month 12: 75%
Revenue Expansion: 140% at Month 12`,
        financialModel: `
# 5-Year Financial Projection

## Revenue Projections
Year 1: $2M | Year 2: $5M | Year 3: $12M | Year 4: $25M | Year 5: $45M

## Cost Structure
- COGS: 20% of revenue
- Sales & Marketing: 40% of revenue
- R&D: 25% of revenue
- G&A: 15% of revenue

## Key Assumptions
- Customer Growth: 100% YoY
- Churn Rate: 10% annually
- Price Increases: 5% annually
- Market TAM: $5B
- Market Share Target: 1%

## Funding Requirements
- Series A: $10M (Year 1)
- Series B: $25M (Year 3)
- Break-even: Year 4
- Cash Flow Positive: Year 5`
      }
    };
  },

  getLegalComplianceExpertise() {
    return {
      core: {
        areas: 'Corporate law, IP, employment, contracts, compliance',
        regulations: 'GDPR, CCPA, SOC2, HIPAA, PCI-DSS, ISO 27001',
        documents: 'TOS, privacy policy, NDA, MSA, SLA, DPA',
        tools: 'Contract management, compliance tracking, e-signature'
      },
      capabilities: [
        'Draft and review contracts',
        'Ensure regulatory compliance',
        'Manage intellectual property',
        'Handle employment law issues',
        'Conduct compliance audits',
        'Develop privacy policies',
        'Manage vendor agreements',
        'Handle data protection',
        'Support M&A activities',
        'Manage corporate governance',
        'Handle dispute resolution',
        'Develop compliance training',
        'Manage risk assessment',
        'Support international expansion',
        'Handle securities compliance',
        'Manage litigation matters'
      ],
      templates: {
        privacyPolicy: `
# Privacy Policy Template

## Information We Collect
### Information You Provide
- Account information (name, email, password)
- Payment information (processed by third parties)
- Profile information
- Communications with us

### Information We Collect Automatically
- Usage data and analytics
- Device information
- Log data
- Cookies and similar technologies

## How We Use Information
- Provide and improve our services
- Communicate with you
- Ensure security and prevent fraud
- Comply with legal obligations
- With your consent for other purposes

## Data Retention
We retain data for as long as necessary to provide services and comply with legal obligations.

## Your Rights
- Access your information
- Correct inaccurate data
- Delete your account
- Port your data
- Opt-out of marketing

## Security
We implement appropriate technical and organizational measures to protect your data.

## Contact
privacy@company.com
Data Protection Officer
Company Address`,
        dataProcessingAgreement: `
# Data Processing Agreement (DPA)

## Definitions
- Controller: The entity that determines purposes and means
- Processor: The entity that processes data on behalf of Controller
- Data Subject: Individual whose personal data is processed

## Processing Terms
### Processor Obligations
- Process data only on documented instructions
- Ensure confidentiality of personnel
- Implement appropriate security measures
- Engage sub-processors only with consent
- Assist with data subject requests
- Delete/return data upon termination

### Security Measures
- Encryption of data in transit and at rest
- Access controls and authentication
- Regular security assessments
- Incident response procedures
- Business continuity planning

## Sub-processors
Current approved sub-processors:
- AWS (Infrastructure)
- Stripe (Payments)
- SendGrid (Email)

## Data Transfers
Standard Contractual Clauses apply for international transfers.

## Breach Notification
Processor will notify Controller without undue delay upon becoming aware of a breach.

## Audit Rights
Controller may audit Processor's compliance annually.`
      }
    };
  },

  getHRExpertise() {
    return {
      core: {
        functions: 'Talent acquisition, onboarding, performance, compensation, culture',
        tools: 'Workday, BambooHR, Greenhouse, Lever, Culture Amp',
        compliance: 'Equal employment, labor laws, benefits, workplace safety',
        metrics: 'Turnover, time-to-hire, eNPS, diversity, engagement'
      },
      capabilities: [
        'Develop hiring strategies',
        'Create job descriptions',
        'Screen and interview candidates',
        'Design onboarding programs',
        'Manage performance reviews',
        'Develop compensation strategies',
        'Create employee handbooks',
        'Handle employee relations',
        'Design training programs',
        'Manage benefits administration',
        'Ensure compliance',
        'Build company culture',
        'Implement HRIS systems',
        'Conduct engagement surveys',
        'Manage organizational development',
        'Handle terminations properly'
      ]
    };
  }
};

module.exports = strategicCompleteExpertise;