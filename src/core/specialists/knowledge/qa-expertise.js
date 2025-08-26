/**
 * BUMBA Quality Assurance Specialists Expertise
 * Enhanced knowledge for all QA and Testing specialists
 * Sprint 13 & Sprint 25 Implementation
 * Covers: Test Engineer, QA Automation, Quality Management, Test Automation,
 *         QA Lead, Security Testing, UI Testing, Performance Testing, API Testing
 */

class QAExpertise {
  /**
   * Test Engineer Expert Knowledge
   */
  static getTestEngineerExpertise() {
    return {
      name: 'Test Engineer Expert',
      expertise: {
        core: {
          testing: 'Manual testing, exploratory testing, test case design',
          automation: 'Test automation frameworks, CI/CD integration',
          types: 'Unit, integration, system, acceptance, regression testing',
          methodologies: 'TDD, BDD, ATDD, risk-based testing',
          tools: 'Selenium, Cypress, Playwright, JUnit, TestNG, Jest'
        },
        
        strategy: {
          planning: 'Test strategy, test planning, risk assessment',
          design: 'Test case design techniques, boundary value analysis',
          execution: 'Test execution, defect management, reporting',
          maintenance: 'Test maintenance, regression suites, documentation'
        },
        
        automation: {
          frameworks: 'Page Object Model, Data-Driven, Keyword-Driven',
          tools: 'Selenium WebDriver, Cypress, Playwright, Appium',
          ci_cd: 'Jenkins, GitLab CI, GitHub Actions, Azure DevOps',
          reporting: 'Allure, ExtentReports, TestNG reports, custom dashboards'
        },
        
        performance: {
          load_testing: 'JMeter, LoadRunner, Artillery, K6',
          stress_testing: 'System limits, bottleneck identification',
          monitoring: 'APM tools, performance metrics, profiling',
          optimization: 'Performance tuning, scalability testing'
        },
        
        security: {
          vulnerability: 'OWASP testing, penetration testing, security scans',
          authentication: 'OAuth, JWT, session management testing',
          authorization: 'Role-based access, permission testing',
          data_protection: 'Encryption, PII handling, GDPR compliance'
        }
      },
      
      capabilities: [
        'Test strategy and planning development',
        'Manual and exploratory testing execution',
        'Test automation framework design',
        'CI/CD pipeline integration for testing',
        'Performance and load testing',
        'Security testing and vulnerability assessment',
        'API testing and service validation',
        'Mobile application testing',
        'Cross-browser and compatibility testing',
        'Database testing and validation',
        'Defect management and reporting',
        'Test data management and generation',
        'Risk-based testing approach',
        'Test environment setup and management',
        'Quality metrics and reporting',
        'Team mentoring and training'
      ],
      
      systemPromptAdditions: `
You are a Test Engineer expert specializing in:
- Comprehensive testing strategies and methodologies
- Test automation framework design and implementation
- Performance, security, and compatibility testing
- CI/CD integration and DevOps testing practices
- Quality assurance processes and best practices
- Defect management and quality metrics
- Risk-based testing and test optimization

Always focus on quality, coverage, and early defect detection while balancing manual and automated testing approaches.`,

      bestPractices: [
        'Design tests based on requirements and user stories',
        'Implement the testing pyramid (unit > integration > E2E)',
        'Use risk-based testing to prioritize critical functionality',
        'Automate repetitive and regression-prone test cases',
        'Maintain clear and concise test documentation',
        'Implement continuous testing in CI/CD pipelines',
        'Use data-driven testing for better coverage',
        'Perform early and frequent testing (shift-left)',
        'Collaborate closely with development teams',
        'Focus on user experience and business value',
        'Implement proper test data management',
        'Use appropriate tools for different testing types',
        'Maintain test environments that mirror production',
        'Track and analyze quality metrics',
        'Continuously improve testing processes'
      ],
      
      codePatterns: {
        pageObjectModel: `
// Page Object Model Pattern
class LoginPage {
  constructor(driver) {
    this.driver = driver;
    this.usernameField = By.id('username');
    this.passwordField = By.id('password');
    this.loginButton = By.id('login-btn');
    this.errorMessage = By.css('.error-message');
  }
  
  async enterCredentials(username, password) {
    await this.driver.findElement(this.usernameField).sendKeys(username);
    await this.driver.findElement(this.passwordField).sendKeys(password);
  }
  
  async clickLogin() {
    await this.driver.findElement(this.loginButton).click();
  }
  
  async getErrorMessage() {
    return await this.driver.findElement(this.errorMessage).getText();
  }
  
  async login(username, password) {
    await this.enterCredentials(username, password);
    await this.clickLogin();
  }
}

module.exports = LoginPage;`,

        cypressTest: `
// Cypress E2E Test
describe('User Authentication', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should login with valid credentials', () => {
    cy.get('[data-testid="username"]').type('testuser@example.com');
    cy.get('[data-testid="password"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="welcome-message"]').should('be.visible');
  });

  it('should show error for invalid credentials', () => {
    cy.get('[data-testid="username"]').type('invalid@example.com');
    cy.get('[data-testid="password"]').type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();
    
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Invalid credentials');
  });

  it('should validate form fields', () => {
    cy.get('[data-testid="login-button"]').click();
    
    cy.get('[data-testid="username-error"]')
      .should('contain', 'Username is required');
    cy.get('[data-testid="password-error"]')
      .should('contain', 'Password is required');
  });
});`,

        apiTesting: `
// API Testing with Jest and Supertest
const request = require('supertest');
const app = require('../app');

describe('User API', () => {
  let authToken;
  
  beforeAll(async () => {
    // Setup test data and authentication
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    authToken = response.body.token;
  });

  describe('GET /api/users', () => {
    it('should return user list with authentication', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', \`Bearer \${authToken}\`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/users')
        .expect(401);
    });
  });

  describe('POST /api/users', () => {
    it('should create new user with valid data', async () => {
      const newUser = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', \`Bearer \${authToken}\`)
        .send(newUser)
        .expect(201);

      expect(response.body).toMatchObject(newUser);
      expect(response.body).toHaveProperty('id');
    });

    it('should validate required fields', async () => {
      const invalidUser = {
        name: 'John Doe'
        // Missing email
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', \`Bearer \${authToken}\`)
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toContain('Email is required');
    });
  });
});`
      }
    };
  }
  
  /**
   * QA Automation Expert Knowledge
   */
  static getQAAutomationExpertise() {
    return {
      name: 'QA Automation Expert',
      expertise: {
        core: {
          frameworks: 'Selenium, Cypress, Playwright, WebDriverIO, Appium',
          languages: 'Java, Python, JavaScript, C#, TypeScript',
          patterns: 'Page Object Model, Factory Pattern, Builder Pattern',
          architecture: 'Modular design, maintainable test suites, scalability'
        },
        
        web_automation: {
          selenium: 'WebDriver, Grid, headless browsers, cross-browser testing',
          cypress: 'Modern E2E testing, real-time reloads, debugging',
          playwright: 'Multi-browser, mobile testing, network interception',
          tools: 'TestNG, JUnit, pytest, Mocha, Jest'
        },
        
        mobile_automation: {
          appium: 'iOS and Android automation, native and hybrid apps',
          tools: 'XCUITest, Espresso, Detox, Maestro',
          cloud: 'BrowserStack, Sauce Labs, Firebase Test Lab',
          devices: 'Real device testing, emulators, simulators'
        },
        
        api_automation: {
          rest: 'RESTful API testing, HTTP methods, status codes',
          graphql: 'GraphQL query testing, schema validation',
          tools: 'Postman, Newman, REST Assured, Axios',
          validation: 'Response validation, schema testing, contract testing'
        },
        
        ci_cd: {
          integration: 'Jenkins, GitLab CI, GitHub Actions, Azure DevOps',
          parallel: 'Parallel execution, test distribution, reporting',
          environments: 'Multi-environment testing, configuration management',
          monitoring: 'Test health monitoring, failure analysis, metrics'
        }
      },
      
      capabilities: [
        'Web automation framework development',
        'Mobile automation for iOS and Android',
        'API testing and validation automation',
        'Cross-browser and compatibility testing',
        'Performance test automation',
        'Visual regression testing',
        'Database testing automation',
        'Test data management automation',
        'CI/CD pipeline integration',
        'Parallel test execution setup',
        'Test reporting and analytics',
        'Framework maintenance and optimization',
        'Cloud testing platform integration',
        'Security testing automation',
        'Load testing automation',
        'Test environment automation'
      ],
      
      systemPromptAdditions: `
You are a QA Automation expert specializing in:
- Test automation framework design and architecture
- Multi-platform automation (web, mobile, API)
- CI/CD integration and DevOps practices
- Performance and scalability of test suites
- Modern testing tools and technologies
- Test data management and environment setup
- Quality metrics and reporting automation

Always focus on maintainable, scalable, and reliable automation solutions with proper design patterns and best practices.`,

      bestPractices: [
        'Design maintainable and reusable automation frameworks',
        'Use appropriate design patterns (Page Object, Factory)',
        'Implement proper wait strategies and synchronization',
        'Create data-driven and parameterized tests',
        'Use version control and code review for test code',
        'Implement parallel execution for faster feedback',
        'Create comprehensive test reporting and analytics',
        'Use proper exception handling and logging',
        'Maintain test environment isolation and cleanup',
        'Implement continuous integration for test execution',
        'Use cloud platforms for cross-browser testing',
        'Create modular and independent test cases',
        'Implement proper test data management',
        'Use appropriate assertions and validations',
        'Regularly maintain and update test suites'
      ],
      
      codePatterns: {
        testngSuite: `
// TestNG Suite Configuration
<?xml version="1.0" encoding="UTF-8"?>
<suite name="E2E Test Suite" parallel="tests" thread-count="3">
  
  <parameter name="browser" value="chrome" />
  <parameter name="environment" value="staging" />
  
  <test name="Smoke Tests">
    <parameter name="suite" value="smoke" />
    <classes>
      <class name="tests.LoginTest" />
      <class name="tests.NavigationTest" />
      <class name="tests.SearchTest" />
    </classes>
  </test>
  
  <test name="Regression Tests">
    <parameter name="suite" value="regression" />
    <classes>
      <class name="tests.UserManagementTest" />
      <class name="tests.OrderProcessingTest" />
      <class name="tests.PaymentTest" />
    </classes>
  </test>
  
</suite>`,

        playwrightConfig: `
// Playwright Configuration
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['allure-playwright']
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    }
  ]
});`,

        dataProviders: `
// TestNG Data Provider Pattern
@DataProvider(name = "loginData")
public Object[][] getLoginData() {
    return new Object[][] {
        {"valid@example.com", "password123", true},
        {"invalid@example.com", "wrongpassword", false},
        {"", "password123", false},
        {"valid@example.com", "", false},
        {"invalid-email", "password123", false}
    };
}

@Test(dataProvider = "loginData")
public void testLogin(String email, String password, boolean shouldSucceed) {
    LoginPage loginPage = new LoginPage(driver);
    loginPage.login(email, password);
    
    if (shouldSucceed) {
        Assert.assertTrue(loginPage.isLoginSuccessful());
    } else {
        Assert.assertTrue(loginPage.hasErrorMessage());
    }
}`
      }
    };
  }
  
  /**
   * Quality Management Expert Knowledge
   */
  static getQualityManagementExpertise() {
    return {
      name: 'Quality Management Expert',
      expertise: {
        core: {
          strategy: 'Quality strategy, quality planning, quality governance',
          processes: 'QMS, ISO standards, process improvement, auditing',
          metrics: 'Quality metrics, KPIs, defect analysis, trend analysis',
          culture: 'Quality culture, training, continuous improvement'
        },
        
        methodologies: {
          lean: 'Lean principles, waste elimination, value stream mapping',
          six_sigma: 'DMAIC, statistical analysis, process optimization',
          agile: 'Agile quality practices, Definition of Done, acceptance criteria',
          tqm: 'Total Quality Management, customer focus, employee involvement'
        },
        
        standards: {
          iso: 'ISO 9001, ISO 27001, quality management systems',
          cmmi: 'CMMI levels, process maturity, capability assessment',
          regulatory: 'FDA, SOX, GDPR, industry-specific compliance',
          frameworks: 'ITIL, COBIT, risk management frameworks'
        },
        
        tools: {
          quality: 'Quality management systems, audit tools, compliance tracking',
          analysis: 'Statistical analysis, SPC, quality control charts',
          improvement: 'Root cause analysis, FMEA, 5 Whys, fishbone diagrams',
          reporting: 'Quality dashboards, executive reporting, trend analysis'
        },
        
        risk: {
          management: 'Risk identification, assessment, mitigation, monitoring',
          compliance: 'Regulatory compliance, audit preparation, documentation',
          business: 'Business continuity, disaster recovery, quality assurance',
          operational: 'Operational risk, process risk, technology risk'
        }
      },
      
      capabilities: [
        'Quality strategy development and implementation',
        'Quality management system design and maintenance',
        'Process improvement and optimization',
        'Quality metrics and KPI development',
        'Audit planning and execution',
        'Compliance management and monitoring',
        'Risk assessment and mitigation',
        'Quality culture development',
        'Training program design and delivery',
        'Vendor quality management',
        'Customer satisfaction measurement',
        'Continuous improvement facilitation',
        'Quality cost analysis',
        'Change management for quality initiatives',
        'Executive quality reporting',
        'Industry standards implementation'
      ],
      
      systemPromptAdditions: `
You are a Quality Management expert specializing in:
- Quality strategy and governance frameworks
- Process improvement and optimization methodologies
- Quality metrics, KPIs, and performance measurement
- Compliance management and regulatory standards
- Risk management and mitigation strategies
- Quality culture development and training
- Continuous improvement and change management

Always focus on customer value, process excellence, and sustainable quality improvements aligned with business objectives.`,

      bestPractices: [
        'Align quality strategy with business objectives',
        'Implement data-driven quality decision making',
        'Foster a culture of continuous improvement',
        'Use risk-based approach to quality management',
        'Engage stakeholders in quality initiatives',
        'Implement preventive rather than detective controls',
        'Maintain customer focus in all quality activities',
        'Use appropriate quality tools and methodologies',
        'Ensure compliance with relevant standards and regulations',
        'Provide regular training and quality awareness',
        'Implement effective quality measurement systems',
        'Use statistical methods for quality control',
        'Maintain proper documentation and records',
        'Conduct regular quality reviews and audits',
        'Continuously monitor and improve quality processes'
      ],
      
      codePatterns: {
        qualityPlan: `
# Quality Management Plan

## Quality Objectives
**Overall Goal**: Achieve 99.5% customer satisfaction with <2% defect rate
**Specific Objectives**:
- Reduce critical defects by 50% within 6 months
- Improve process efficiency by 25%
- Achieve ISO 9001 certification within 12 months

## Quality Organization
**Quality Manager**: [Name and responsibilities]
**Quality Team**: [Team structure and roles]
**Quality Champions**: [Representatives from each department]

## Quality Processes
### Process 1: Requirements Management
**Owner**: Business Analyst Team
**Metrics**: Requirements completeness, change rate, traceability
**Controls**: Review checkpoints, approval gates, change control

### Process 2: Design and Development
**Owner**: Development Team
**Metrics**: Design review coverage, code quality, architecture compliance
**Controls**: Design reviews, code reviews, architecture validation

### Process 3: Testing and Validation
**Owner**: QA Team
**Metrics**: Test coverage, defect density, escape rate
**Controls**: Test planning, execution tracking, defect management

## Quality Metrics and KPIs
**Customer Satisfaction**: Monthly NPS survey, target >8
**Defect Metrics**: Defect density, escape rate, resolution time
**Process Metrics**: Cycle time, throughput, rework rate
**Compliance Metrics**: Audit findings, corrective actions, training completion`,

        processImprovement: `
# Process Improvement Framework

## Current State Analysis
**Process**: [Process name and scope]
**Pain Points**: [Identified issues and inefficiencies]
**Metrics**: [Baseline measurements and performance data]

## Root Cause Analysis
**Method**: 5 Whys / Fishbone Diagram / FMEA
**Primary Causes**: [Root causes identified]
**Contributing Factors**: [Secondary factors]

## Improvement Opportunities
### Opportunity 1: [Description]
**Impact**: [Expected improvement]
**Effort**: [Implementation complexity]
**Timeline**: [Expected duration]
**Risk**: [Implementation risks]

### Opportunity 2: [Description]
**Impact**: [Expected improvement]
**Effort**: [Implementation complexity]
**Timeline**: [Expected duration]
**Risk**: [Implementation risks]

## Implementation Plan
**Phase 1**: [Quick wins and immediate improvements]
**Phase 2**: [Medium-term enhancements]
**Phase 3**: [Long-term strategic improvements]

## Success Metrics
**Process KPIs**: [Key performance indicators]
**Quality Metrics**: [Quality measurements]
**Business Impact**: [Business value delivered]
**Timeline**: [Measurement frequency and targets]`,

        riskAssessment: `
# Risk Assessment Matrix

## Risk Identification
### Risk 1: [Risk description]
**Category**: Operational / Technical / Compliance / Business
**Impact**: High / Medium / Low
**Probability**: High / Medium / Low
**Risk Score**: [Impact × Probability]

### Risk 2: [Risk description]
**Category**: Operational / Technical / Compliance / Business
**Impact**: High / Medium / Low
**Probability**: High / Medium / Low
**Risk Score**: [Impact × Probability]

## Risk Mitigation Strategies
### High Priority Risks (Score 6-9)
**Risk**: [Description]
**Mitigation**: [Preventive actions]
**Contingency**: [Response if risk occurs]
**Owner**: [Responsible person]
**Timeline**: [Implementation schedule]

### Medium Priority Risks (Score 3-4)
**Risk**: [Description]
**Monitoring**: [Early warning indicators]
**Response**: [Planned actions if risk escalates]

## Risk Monitoring
**Review Frequency**: [Monthly/Quarterly assessment schedule]
**KPIs**: [Risk indicators and thresholds]
**Reporting**: [Escalation and communication plan]
**Updates**: [Risk register maintenance process]`
      }
    };
  }
}

module.exports = QAExpertise;