const UnifiedSpecialistBase = require('../../unified-specialist-base');
/**
 * BUMBA UI Testing Specialist
 * Expert in UI automation, visual testing, and user experience validation
 */

const SpecialistBase = require('../../specialist-base');

class UITestingSpecialist extends UnifiedSpecialistBase {
  constructor() {
    super({
      name: 'UI Testing Specialist',
      expertise: ['UI Testing', 'Selenium', 'Cypress', 'Playwright', 'Visual Testing', 'Accessibility Testing'],
      models: ['claude-3-opus-20240229', 'gpt-4'],
      temperature: 0.3,
      systemPrompt: `You are a UI testing expert specializing in:
        - End-to-end UI automation with Cypress, Playwright, Selenium
        - Visual regression testing and screenshot comparison
        - Cross-browser and cross-device testing
        - Accessibility testing and WCAG compliance
        - User interaction simulation and validation
        - Mobile-responsive testing
        - Performance testing for web applications
        - Test maintenance and flaky test reduction
        Always prioritize user experience, accessibility, and comprehensive coverage.`
    });

    this.capabilities = {
      automation: true,
      visualTesting: true,
      crossBrowser: true,
      accessibility: true,
      mobile: true,
      performance: true,
      maintenance: true,
      reporting: true
    };
  }

  async designUITestStrategy(context) {
    const analysis = await this.analyze(context);
    
    return {
      strategy: this.createTestStrategy(analysis),
      frameworks: this.selectFrameworks(analysis),
      implementation: this.implementTests(analysis),
      maintenance: this.setupMaintenance(analysis)
    };
  }

  createTestStrategy(analysis) {
    return `# UI Testing Strategy for ${analysis.projectName || 'Application'}

## UI Testing Pyramid

### 1. Component Tests (40%)
**Scope**: Individual UI components in isolation
**Tools**: Cypress Component Testing, Jest + Testing Library
**Frequency**: Every commit
**Coverage**: Component behavior, props validation, state changes

### 2. Integration Tests (35%)
**Scope**: Component interactions, form workflows, navigation
**Tools**: Cypress, Playwright
**Frequency**: Every build
**Coverage**: User workflows, data flow, page interactions

### 3. End-to-End Tests (20%)
**Scope**: Complete user journeys across the application
**Tools**: Cypress, Playwright, WebDriver
**Frequency**: Nightly, pre-production
**Coverage**: Critical paths, complex scenarios

### 4. Visual Tests (5%)
**Scope**: UI appearance, layout, responsive design
**Tools**: Percy, Chromatic, Applitools
**Frequency**: Every deployment
**Coverage**: Visual regressions, design consistency

## UI Test Coverage Matrix

### Functional Testing
- **Navigation**: Menu interactions, routing, breadcrumbs
- **Forms**: Input validation, submission, error handling
- **Data Display**: Tables, lists, cards, pagination
- **User Interactions**: Clicks, hovers, keyboard navigation
- **Dynamic Content**: Loading states, real-time updates

### Cross-Browser Testing
| Browser | Desktop | Mobile | Priority |
|---------|---------|--------|----------|
| Chrome | 🏁 | 🏁 | High |
| Firefox | 🏁 | 🏁 | High |
| Safari | 🏁 | 🏁 | High |
| Edge | 🏁 | 🔴 | Medium |
| IE 11 | 🏁 | 🔴 | Low |

### Device Testing
- **Desktop**: 1920x1080, 1366x768, 1280x720
- **Tablet**: iPad, Android tablet (landscape/portrait)
- **Mobile**: iPhone, Android (various screen sizes)

### Accessibility Testing
- **WCAG 2.1 AA Compliance**: Color contrast, keyboard navigation
- **Screen Reader Support**: ARIA labels, semantic HTML
- **Focus Management**: Tab order, focus indicators
- **Alternative Text**: Images, icons, multimedia content

## Quality Gates and Metrics

### Test Execution Metrics
- **Pass Rate**: > 95% for critical paths
- **Execution Time**: < 30 minutes for full suite
- **Flaky Test Rate**: < 2%
- **Cross-Browser Success**: > 90% across target browsers

### Coverage Metrics
- **Page Coverage**: 100% of public pages
- **User Journey Coverage**: 90% of documented workflows
- **Component Coverage**: 80% of reusable components
- **Accessibility Coverage**: 100% of interactive elements

### Performance Thresholds
- **Page Load Time**: < 3 seconds
- **Time to Interactive**: < 5 seconds
- **Cumulative Layout Shift**: < 0.1
- **First Contentful Paint**: < 2 seconds`;
  }

  selectFrameworks(analysis) {
    return `# UI Testing Framework Selection

## Cypress Configuration and Setup

### Cypress Configuration
\`\`\`javascript
// cypress.config.js
const { defineConfig } = require('cypress');
const { lighthouse, prepareAudit } = require('@cypress-audit/lighthouse');
const { pa11y } = require('@cypress-audit/pa11y');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    
    setupNodeEvents(on, config) {
      // Lighthouse audit integration
      on('before:browser:launch', (browser = {}, launchOptions) => {
        prepareAudit(launchOptions);
      });
      
      on('task', {
        lighthouse: lighthouse(),
        pa11y: pa11y(),
        
        // Custom tasks
        clearDatabase: require('./cypress/tasks/database').clear,
        seedDatabase: require('./cypress/tasks/database').seed,
        
        // File operations
        readFileMaybe: require('./cypress/tasks/files').readFileMaybe,
        deleteFile: require('./cypress/tasks/files').deleteFile
      });
      
      // Environment configuration
      if (config.env.environment === 'staging') {
        config.baseUrl = 'https://staging.example.com';
      }
      
      return config;
    },
    
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    
    env: {
      apiUrl: 'http://localhost:8000/api',
      testUser: {
        email: 'test@example.com',
        password: 'testPassword123'
      }
    }
  },
  
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack'
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js'
  }
});
\`\`\`

### Custom Commands and Utilities
\`\`\`javascript
// cypress/support/commands.js
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid=email-input]').type(email);
    cy.get('[data-testid=password-input]').type(password);
    cy.get('[data-testid=login-button]').click();
    
    // Wait for login to complete
    cy.url().should('not.include', '/login');
    cy.get('[data-testid=user-menu]').should('be.visible');
  });
});

Cypress.Commands.add('createUser', (userData) => {
  return cy.request({
    method: 'POST',
    url: \`\${Cypress.env('apiUrl')}/users\`,
    body: userData,
    headers: {
      'Authorization': \`Bearer \${window.localStorage.getItem('authToken')}\`
    }
  }).then((response) => {
    expect(response.status).to.eq(201);
    return response.body;
  });
});

Cypress.Commands.add('waitForPageLoad', () => {
  cy.window().its('document.readyState').should('equal', 'complete');
  cy.get('[data-testid=loading-spinner]').should('not.exist');
});

Cypress.Commands.add('checkAccessibility', (options = {}) => {
  cy.injectAxe();
  cy.checkA11y(options.context, options.rules, options.callback);
});

Cypress.Commands.add('mockGraphQL', (operationName, response) => {
  cy.intercept('POST', '/graphql', (req) => {
    if (req.body.operationName === operationName) {
      req.reply(response);
    }
  }).as(\`mock\${operationName}\`);
});

Cypress.Commands.add('dragAndDrop', (source, target) => {
  cy.get(source).trigger('mousedown', { button: 0 });
  cy.get(target).trigger('mousemove').trigger('mouseup');
});

Cypress.Commands.add('uploadFile', (selector, fileName, fileType = 'text/plain') => {
  cy.get(selector).selectFile({
    contents: Cypress.Buffer.from('file contents'),
    fileName: fileName,
    mimeType: fileType
  });
});

Cypress.Commands.add('compareSnapshot', (name, options = {}) => {
  const defaultOptions = {
    threshold: 0.2,
    thresholdType: 'percent'
  };
  
  cy.document().toMatchImageSnapshot({
    name,
    ...defaultOptions,
    ...options
  });
});
\`\`\`

## Playwright Configuration

### Playwright Test Configuration
\`\`\`javascript
// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }]
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000
  },

  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    
    // Mobile devices
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    },
    
    // Tablet
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] }
    }
  ],

  webServer: {
    command: 'npm run start:test',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
});
\`\`\`

### Playwright Page Object Model
\`\`\`javascript
// tests/e2e/pages/LoginPage.js
class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid=email-input]');
    this.passwordInput = page.locator('[data-testid=password-input]');
    this.loginButton = page.locator('[data-testid=login-button]');
    this.errorMessage = page.locator('[data-testid=error-message]');
    this.forgotPasswordLink = page.locator('[data-testid=forgot-password-link]');
  }

  async navigate() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async loginWithEnter(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.passwordInput.press('Enter');
  }

  async expectLoginError(message) {
    await this.errorMessage.waitFor({ state: 'visible' });
    await expect(this.errorMessage).toContainText(message);
  }

  async expectSuccessfulLogin() {
    await this.page.waitForURL('**/dashboard');
    await expect(this.page.locator('[data-testid=user-menu]')).toBeVisible();
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
    await this.page.waitForURL('**/forgot-password');
  }
}

module.exports = LoginPage;
\`\`\`

## Visual Testing Integration

### Percy Visual Testing
\`\`\`javascript
// cypress/e2e/visual-tests.cy.js
describe('Visual Regression Tests', () => {
  beforeEach(() => {
    cy.login(Cypress.env('testUser').email, Cypress.env('testUser').password);
  });

  it('should capture homepage screenshot', () => {
    cy.visit('/');
    cy.waitForPageLoad();
    cy.percySnapshot('Homepage - Authenticated User');
  });

  it('should capture responsive designs', () => {
    const viewports = [
      { width: 1280, height: 720 },
      { width: 768, height: 1024 },
      { width: 375, height: 667 }
    ];

    viewports.forEach(viewport => {
      cy.viewport(viewport.width, viewport.height);
      cy.visit('/products');
      cy.waitForPageLoad();
      cy.percySnapshot(\`Products Page - \${viewport.width}x\${viewport.height}\`);
    });
  });

  it('should capture component states', () => {
    cy.visit('/components');
    
    // Capture different button states
    cy.get('[data-testid=button-demo]').within(() => {
      cy.percySnapshot('Button States - Default');
      
      cy.get('[data-testid=primary-button]').hover();
      cy.percySnapshot('Button States - Hover');
      
      cy.get('[data-testid=primary-button]').focus();
      cy.percySnapshot('Button States - Focus');
    });
  });
});
\`\`\`

### Chromatic Storybook Integration
\`\`\`javascript
// .circleci/config.yml (Chromatic CI)
version: 2.1

jobs:
  visual-tests:
    docker:
      - image: cimg/node:18.17
    steps:
      - checkout
      - restore_cache:
          keys:
            - v1-dependencies-{{ checksum "package-lock.json" }}
      - run: npm ci
      - run:
          name: Run Chromatic
          command: |
            npx chromatic --project-token=\${CHROMATIC_PROJECT_TOKEN} \\
              --build-script-name=build-storybook \\
              --exit-zero-on-changes \\
              --auto-accept-changes=main

workflows:
  version: 2
  test-and-deploy:
    jobs:
      - visual-tests
\`\`\`

This framework selection provides:
- Comprehensive Cypress configuration for E2E and component testing
- Playwright setup for cross-browser testing
- Visual testing integration with Percy and Chromatic
- Page Object Model for maintainable test code
- Custom commands and utilities for common operations
- Cross-device and responsive testing capabilities`;
  }

  implementTests(analysis) {
    return `# UI Test Implementation

## E2E User Journey Tests

### User Registration and Login Flow
\`\`\`javascript
// cypress/e2e/auth-flow.cy.js
describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.task('clearDatabase');
    cy.visit('/');
  });

  describe('User Registration', () => {
    it('should allow new user registration', () => {
      const newUser = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecurePass123!'
      };

      cy.visit('/register');
      
      // Fill registration form
      cy.get('[data-testid=name-input]').type(newUser.name);
      cy.get('[data-testid=email-input]').type(newUser.email);
      cy.get('[data-testid=password-input]').type(newUser.password);
      cy.get('[data-testid=confirm-password-input]').type(newUser.password);
      cy.get('[data-testid=terms-checkbox]').check();
      
      // Submit form
      cy.get('[data-testid=register-button]').click();
      
      // Verify successful registration
      cy.url().should('include', '/welcome');
      cy.get('[data-testid=welcome-message]').should('contain', newUser.name);
      
      // Verify email verification prompt
      cy.get('[data-testid=email-verification-notice]')
        .should('contain', 'Please check your email');
    });

    it('should validate registration form fields', () => {
      cy.visit('/register');
      
      // Try to submit empty form
      cy.get('[data-testid=register-button]').click();
      
      // Check validation messages
      cy.get('[data-testid=name-error]').should('contain', 'Name is required');
      cy.get('[data-testid=email-error]').should('contain', 'Email is required');
      cy.get('[data-testid=password-error]').should('contain', 'Password is required');
      
      // Test invalid email format
      cy.get('[data-testid=email-input]').type('invalid-email');
      cy.get('[data-testid=register-button]').click();
      cy.get('[data-testid=email-error]').should('contain', 'Invalid email format');
      
      // Test weak password
      cy.get('[data-testid=email-input]').clear().type('valid@example.com');
      cy.get('[data-testid=password-input]').type('123');
      cy.get('[data-testid=register-button]').click();
      cy.get('[data-testid=password-error]')
        .should('contain', 'Password must be at least 8 characters');
      
      // Test password confirmation mismatch
      cy.get('[data-testid=password-input]').clear().type('ValidPass123!');
      cy.get('[data-testid=confirm-password-input]').type('DifferentPass123!');
      cy.get('[data-testid=register-button]').click();
      cy.get('[data-testid=confirm-password-error]')
        .should('contain', 'Passwords do not match');
    });

    it('should handle duplicate email registration', () => {
      // Create user via API first
      cy.createUser({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'ExistingPass123!'
      });

      cy.visit('/register');
      
      cy.get('[data-testid=name-input]').type('New User');
      cy.get('[data-testid=email-input]').type('existing@example.com');
      cy.get('[data-testid=password-input]').type('NewPass123!');
      cy.get('[data-testid=confirm-password-input]').type('NewPass123!');
      cy.get('[data-testid=terms-checkbox]').check();
      
      cy.get('[data-testid=register-button]').click();
      
      cy.get('[data-testid=email-error]')
        .should('contain', 'Email is already registered');
    });
  });

  describe('User Login', () => {
    beforeEach(() => {
      // Create test user
      cy.createUser({
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPass123!'
      });
    });

    it('should allow user login with valid credentials', () => {
      cy.visit('/login');
      
      cy.get('[data-testid=email-input]').type('test@example.com');
      cy.get('[data-testid=password-input]').type('TestPass123!');
      cy.get('[data-testid=login-button]').click();
      
      // Verify successful login
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid=user-menu]').should('be.visible');
      cy.get('[data-testid=user-name]').should('contain', 'Test User');
    });

    it('should show error for invalid credentials', () => {
      cy.visit('/login');
      
      cy.get('[data-testid=email-input]').type('test@example.com');
      cy.get('[data-testid=password-input]').type('WrongPassword');
      cy.get('[data-testid=login-button]').click();
      
      cy.get('[data-testid=login-error]')
        .should('contain', 'Invalid email or password');
      cy.url().should('include', '/login');
    });

    it('should support remember me functionality', () => {
      cy.visit('/login');
      
      cy.get('[data-testid=email-input]').type('test@example.com');
      cy.get('[data-testid=password-input]').type('TestPass123!');
      cy.get('[data-testid=remember-me-checkbox]').check();
      cy.get('[data-testid=login-button]').click();
      
      // Verify login
      cy.url().should('include', '/dashboard');
      
      // Clear session storage but keep local storage
      cy.clearAllSessionStorage();
      cy.reload();
      
      // Should still be logged in due to remember me
      cy.get('[data-testid=user-menu]').should('be.visible');
    });

    it('should handle account lockout after failed attempts', () => {
      cy.visit('/login');
      
      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid=email-input]').clear().type('test@example.com');
        cy.get('[data-testid=password-input]').clear().type('WrongPassword');
        cy.get('[data-testid=login-button]').click();
        
        if (i < 4) {
          cy.get('[data-testid=login-error]')
            .should('contain', 'Invalid email or password');
        }
      }
      
      // Should show lockout message
      cy.get('[data-testid=login-error]')
        .should('contain', 'Account temporarily locked');
      
      // Login button should be disabled
      cy.get('[data-testid=login-button]').should('be.disabled');
    });
  });

  describe('Password Reset', () => {
    beforeEach(() => {
      cy.createUser({
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPass123!'
      });
    });

    it('should send password reset email', () => {
      cy.visit('/login');
      cy.get('[data-testid=forgot-password-link]').click();
      
      cy.url().should('include', '/forgot-password');
      
      cy.get('[data-testid=email-input]').type('test@example.com');
      cy.get('[data-testid=send-reset-button]').click();
      
      cy.get('[data-testid=success-message]')
        .should('contain', 'Password reset email sent');
    });

    it('should handle invalid email for password reset', () => {
      cy.visit('/forgot-password');
      
      cy.get('[data-testid=email-input]').type('nonexistent@example.com');
      cy.get('[data-testid=send-reset-button]').click();
      
      cy.get('[data-testid=error-message]')
        .should('contain', 'Email not found');
    });
  });
});
\`\`\`

### E-commerce Shopping Flow
\`\`\`javascript
// cypress/e2e/shopping-flow.cy.js
describe('Shopping Flow', () => {
  beforeEach(() => {
    cy.task('seedDatabase');
    cy.login('customer@example.com', 'CustomerPass123!');
  });

  it('should complete full shopping journey', () => {
    // Browse products
    cy.visit('/products');
    cy.waitForPageLoad();
    
    // Verify products are displayed
    cy.get('[data-testid=product-grid]').should('be.visible');
    cy.get('[data-testid=product-card]').should('have.length.at.least', 1);
    
    // Filter products
    cy.get('[data-testid=category-filter]').select('Electronics');
    cy.get('[data-testid=apply-filters]').click();
    
    // Search for specific product
    cy.get('[data-testid=search-input]').type('laptop');
    cy.get('[data-testid=search-button]').click();
    
    // Select product
    cy.get('[data-testid=product-card]').first().click();
    
    // Verify product details page
    cy.url().should('include', '/products/');
    cy.get('[data-testid=product-title]').should('be.visible');
    cy.get('[data-testid=product-price]').should('be.visible');
    cy.get('[data-testid=product-description]').should('be.visible');
    
    // Add to cart
    cy.get('[data-testid=quantity-input]').clear().type('2');
    cy.get('[data-testid=add-to-cart-button]').click();
    
    // Verify cart update
    cy.get('[data-testid=cart-notification]')
      .should('contain', 'Added to cart');
    cy.get('[data-testid=cart-count]').should('contain', '2');
    
    // View cart
    cy.get('[data-testid=cart-icon]').click();
    
    // Verify cart contents
    cy.get('[data-testid=cart-items]').should('be.visible');
    cy.get('[data-testid=cart-item]').should('have.length', 1);
    cy.get('[data-testid=cart-item-quantity]').should('contain', '2');
    
    // Update quantity in cart
    cy.get('[data-testid=increase-quantity]').click();
    cy.get('[data-testid=cart-item-quantity]').should('contain', '3');
    
    // Proceed to checkout
    cy.get('[data-testid=checkout-button]').click();
    
    // Fill shipping information
    cy.get('[data-testid=shipping-form]').within(() => {
      cy.get('[data-testid=first-name]').type('John');
      cy.get('[data-testid=last-name]').type('Doe');
      cy.get('[data-testid=address]').type('123 Main St');
      cy.get('[data-testid=city]').type('Anytown');
      cy.get('[data-testid=state]').select('CA');
      cy.get('[data-testid=zip-code]').type('12345');
    });
    
    cy.get('[data-testid=continue-to-payment]').click();
    
    // Fill payment information
    cy.get('[data-testid=payment-form]').within(() => {
      cy.get('[data-testid=card-number]').type('4111111111111111');
      cy.get('[data-testid=expiry-date]').type('12/25');
      cy.get('[data-testid=cvv]').type('123');
      cy.get('[data-testid=cardholder-name]').type('John Doe');
    });
    
    // Review order
    cy.get('[data-testid=review-order]').click();
    
    // Verify order summary
    cy.get('[data-testid=order-summary]').should('be.visible');
    cy.get('[data-testid=order-total]').should('be.visible');
    
    // Place order
    cy.get('[data-testid=place-order-button]').click();
    
    // Verify order confirmation
    cy.url().should('include', '/order-confirmation');
    cy.get('[data-testid=order-number]').should('be.visible');
    cy.get('[data-testid=confirmation-message]')
      .should('contain', 'Order placed successfully');
  });

  it('should handle empty cart checkout attempt', () => {
    cy.visit('/cart');
    
    cy.get('[data-testid=empty-cart-message]')
      .should('contain', 'Your cart is empty');
    cy.get('[data-testid=checkout-button]').should('be.disabled');
    
    cy.get('[data-testid=continue-shopping]').click();
    cy.url().should('include', '/products');
  });

  it('should save items for later', () => {
    // Add item to cart first
    cy.visit('/products');
    cy.get('[data-testid=product-card]').first().click();
    cy.get('[data-testid=add-to-cart-button]').click();
    
    cy.visit('/cart');
    
    // Save for later
    cy.get('[data-testid=save-for-later]').click();
    
    // Verify item moved to saved items
    cy.get('[data-testid=cart-items]').should('not.exist');
    cy.get('[data-testid=saved-items]').should('be.visible');
    cy.get('[data-testid=saved-item]').should('have.length', 1);
    
    // Move back to cart
    cy.get('[data-testid=move-to-cart]').click();
    cy.get('[data-testid=cart-items]').should('be.visible');
  });
});
\`\`\`

## Form Testing and Validation

### Complex Form Testing
\`\`\`javascript
// cypress/e2e/form-testing.cy.js
describe('Form Testing', () => {
  beforeEach(() => {
    cy.login('admin@example.com', 'AdminPass123!');
  });

  describe('User Profile Form', () => {
    beforeEach(() => {
      cy.visit('/profile/edit');
    });

    it('should update user profile successfully', () => {
      const updatedProfile = {
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'This is an updated bio with more information.',
        phone: '+1 (555) 123-4567',
        website: 'https://updated-website.com'
      };

      // Update form fields
      cy.get('[data-testid=first-name-input]')
        .clear()
        .type(updatedProfile.firstName);
      
      cy.get('[data-testid=last-name-input]')
        .clear()
        .type(updatedProfile.lastName);
      
      cy.get('[data-testid=bio-textarea]')
        .clear()
        .type(updatedProfile.bio);
      
      cy.get('[data-testid=phone-input]')
        .clear()
        .type(updatedProfile.phone);
      
      cy.get('[data-testid=website-input]')
        .clear()
        .type(updatedProfile.website);
      
      // Upload profile picture
      cy.get('[data-testid=profile-picture-upload]')
        .selectFile('cypress/fixtures/profile-picture.jpg');
      
      // Save changes
      cy.get('[data-testid=save-profile-button]').click();
      
      // Verify success message
      cy.get('[data-testid=success-message]')
        .should('contain', 'Profile updated successfully');
      
      // Verify changes were saved
      cy.reload();
      cy.get('[data-testid=first-name-input]')
        .should('have.value', updatedProfile.firstName);
      cy.get('[data-testid=bio-textarea]')
        .should('have.value', updatedProfile.bio);
    });

    it('should validate required fields', () => {
      // Clear required fields
      cy.get('[data-testid=first-name-input]').clear();
      cy.get('[data-testid=last-name-input]').clear();
      
      // Try to save
      cy.get('[data-testid=save-profile-button]').click();
      
      // Check validation messages
      cy.get('[data-testid=first-name-error]')
        .should('contain', 'First name is required');
      cy.get('[data-testid=last-name-error]')
        .should('contain', 'Last name is required');
    });

    it('should validate field formats', () => {
      // Test invalid phone format
      cy.get('[data-testid=phone-input]').clear().type('invalid-phone');
      cy.get('[data-testid=save-profile-button]').click();
      cy.get('[data-testid=phone-error]')
        .should('contain', 'Invalid phone number format');
      
      // Test invalid website URL
      cy.get('[data-testid=website-input]').clear().type('not-a-url');
      cy.get('[data-testid=save-profile-button]').click();
      cy.get('[data-testid=website-error]')
        .should('contain', 'Invalid website URL');
      
      // Test bio character limit
      const longBio = 'a'.repeat(501);
      cy.get('[data-testid=bio-textarea]').clear().type(longBio);
      cy.get('[data-testid=bio-error]')
        .should('contain', 'Bio must be 500 characters or less');
      cy.get('[data-testid=bio-counter]').should('contain', '501/500');
    });

    it('should handle file upload validation', () => {
      // Test invalid file type
      cy.get('[data-testid=profile-picture-upload]')
        .selectFile('cypress/fixtures/document.pdf');
      
      cy.get('[data-testid=file-error]')
        .should('contain', 'Only image files are allowed');
      
      // Test file size limit
      cy.get('[data-testid=profile-picture-upload]')
        .selectFile('cypress/fixtures/large-image.jpg');
      
      cy.get('[data-testid=file-error]')
        .should('contain', 'File size must be less than 5MB');
    });

    it('should support keyboard navigation', () => {
      cy.get('[data-testid=first-name-input]').focus();
      
      // Tab through form fields
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'last-name-input');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'bio-textarea');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'phone-input');
      
      // Submit with Enter key
      cy.get('[data-testid=first-name-input]').type('Test{enter}');
      // Should not submit form (Enter in text input shouldn't submit)
      cy.url().should('include', '/profile/edit');
    });
  });

  describe('Dynamic Form Fields', () => {
    it('should handle conditional field visibility', () => {
      cy.visit('/forms/conditional');
      
      // Initially hidden field
      cy.get('[data-testid=conditional-field]').should('not.exist');
      
      // Trigger condition
      cy.get('[data-testid=trigger-checkbox]').check();
      
      // Field should appear
      cy.get('[data-testid=conditional-field]').should('be.visible');
      
      // Uncheck should hide field
      cy.get('[data-testid=trigger-checkbox]').uncheck();
      cy.get('[data-testid=conditional-field]').should('not.exist');
    });

    it('should handle dynamic field addition/removal', () => {
      cy.visit('/forms/dynamic');
      
      // Initially one field
      cy.get('[data-testid=dynamic-field]').should('have.length', 1);
      
      // Add field
      cy.get('[data-testid=add-field-button]').click();
      cy.get('[data-testid=dynamic-field]').should('have.length', 2);
      
      // Remove field
      cy.get('[data-testid=remove-field-button]').first().click();
      cy.get('[data-testid=dynamic-field]').should('have.length', 1);
    });
  });
});
\`\`\`

This comprehensive UI test implementation provides:
- Complete user journey testing (authentication, shopping)
- Detailed form validation and interaction testing
- Error handling and edge case coverage
- Keyboard navigation and accessibility testing
- File upload and dynamic content testing
- Cross-browser compatibility verification`;
  }

  setupMaintenance(analysis) {
    return `# UI Test Maintenance and Optimization

## Test Stability and Flaky Test Reduction

### Robust Element Selection Strategy
\`\`\`javascript
// cypress/support/selectors.js
class Selectors {
  // Prioritized selector strategy
  static getElement(testId, fallbacks = []) {
    // 1st priority: data-testid
    if (testId) {
      return cy.get(\`[data-testid="\${testId}"]\`);
    }
    
    // Fallback chain
    for (const selector of fallbacks) {
      try {
        return cy.get(selector);
      } catch (error) {
        continue;
      }
    }
    
    throw new Error('Element not found with any selector');
  }
  
  // Smart waiting for elements
  static waitForElement(selector, options = {}) {
    const defaultOptions = {
      timeout: 10000,
      visible: true,
      ...options
    };
    
    return cy.get(selector, defaultOptions).should('be.visible');
  }
  
  // Retry-able actions
  static clickWithRetry(selector, maxRetries = 3) {
    let attempts = 0;
    
    const attemptClick = () => {
      attempts++;
      return cy.get(selector).then((\$el) => {
        if (\$el.is(':visible') && !$el.is(':disabled')) {
          \$el.click();
        } else if (attempts < maxRetries) {
          cy.wait(1000);
          attemptClick();
        } else {
          throw new Error(\`Element not clickable after \${maxRetries} attempts\`);
        }
      });
    };
    
    return attemptClick();
  }
}

module.exports = Selectors;
\`\`\`

### Wait Strategies and Timing
\`\`\`javascript
// cypress/support/wait-strategies.js
class WaitStrategies {
  // Wait for API calls to complete
  static waitForApiCalls(aliases = [], timeout = 30000) {
    if (aliases.length === 0) {
      return cy.wait('@**', { timeout });
    }
    
    return cy.wait(aliases.map(alias => \`@\${alias}\`), { timeout });
  }
  
  // Wait for page to be interactive
  static waitForPageReady() {
    return cy.window().then((win) => {
      return new Cypress.Promise((resolve) => {
        const checkReady = () => {
          if (win.document.readyState === 'complete' && 
              !win.document.querySelector('[data-testid="loading-spinner"]')) {
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });
    });
  }
  
  // Wait for animations to complete
  static waitForAnimations() {
    return cy.get('body').should((\$body) => {
      const hasActiveAnimations = \$body.find('*').toArray().some(el => {
        const style = window.getComputedStyle(el);
        return style.animationName !== 'none' || 
               style.transitionProperty !== 'none';
      });
      expect(hasActiveAnimations).to.be.false;
    });
  }
  
  // Smart wait for dynamic content
  static waitForContent(selector, expectedContent) {
    return cy.get(selector).should('contain.text', expectedContent);
  }
  
  // Wait for network idle
  static waitForNetworkIdle(duration = 2000) {
    let lastRequestTime = Date.now();
    
    cy.intercept('**', (req) => {
      lastRequestTime = Date.now();
      req.continue();
    }).as('allRequests');
    
    return cy.window().then(() => {
      return new Cypress.Promise((resolve) => {
        const checkIdle = () => {
          if (Date.now() - lastRequestTime > duration) {
            resolve();
          } else {
            setTimeout(checkIdle, 100);
          }
        };
        checkIdle();
      });
    });
  }
}

module.exports = WaitStrategies;
\`\`\`

### Test Data Management
\`\`\`javascript
// cypress/support/test-data-manager.js
class TestDataManager {
  constructor() {
    this.createdResources = [];
  }
  
  // Create test user with cleanup tracking
  createUser(userData) {
    return cy.request({
      method: 'POST',
      url: '/api/users',
      body: userData
    }).then((response) => {
      const user = response.body;
      this.createdResources.push({
        type: 'user',
        id: user.id,
        cleanup: () => this.deleteUser(user.id)
      });
      return user;
    });
  }
  
  // Create test data with relationships
  createOrderWithItems(userId, itemCount = 2) {
    // Create products first
    const productPromises = Array.from({ length: itemCount }, () => 
      this.createProduct()
    );
    
    return Promise.all(productPromises).then((products) => {
      const orderData = {
        userId,
        items: products.map(product => ({
          productId: product.id,
          quantity: Math.floor(Math.random() * 3) + 1
        }))
      };
      
      return cy.request({
        method: 'POST',
        url: '/api/orders',
        body: orderData
      }).then((response) => {
        const order = response.body;
        this.createdResources.push({
          type: 'order',
          id: order.id,
          cleanup: () => this.deleteOrder(order.id)
        });
        return order;
      });
    });
  }
  
  // Cleanup all created resources
  cleanupAll() {
    const cleanupPromises = this.createdResources.map(resource => 
      resource.cleanup()
    );
    
    this.createdResources = [];
    return Promise.all(cleanupPromises);
  }
  
  // Generate realistic test data
  generateUserData(overrides = {}) {
    const faker = require('@faker-js/faker');
    
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: 'TestPass123!',
      phone: faker.phone.number(),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode()
      },
      ...overrides
    };
  }
}

// Usage in tests
beforeEach(() => {
  cy.testDataManager = new TestDataManager();
});

afterEach(() => {
  cy.testDataManager.cleanupAll();
});
\`\`\`

## Performance Optimization

### Test Execution Optimization
\`\`\`javascript
// cypress/support/performance-optimization.js
class PerformanceOptimization {
  // Lazy loading for heavy operations
  static lazyLoad(operation, condition) {
    return cy.then(() => {
      if (condition()) {
        return operation();
      }
      return cy.wrap(null);
    });
  }
  
  // Parallel test execution helper
  static runInParallel(operations) {
    const promises = operations.map(op => 
      new Promise((resolve, reject) => {
        op().then(resolve).catch(reject);
      })
    );
    
    return Promise.all(promises);
  }
  
  // Resource monitoring
  static monitorPerformance(testName) {
    cy.window().then((win) => {
      if (win.performance) {
        const metrics = {
          navigation: win.performance.getEntriesByType('navigation')[0],
          resources: win.performance.getEntriesByType('resource'),
          memory: win.performance.memory
        };
        
        cy.task('logPerformanceMetrics', {
          testName,
          metrics,
          timestamp: Date.now()
        });
      }
    });
  }
  
  // Smart screenshot capture
  static captureScreenshotOnFailure() {
    Cypress.on('fail', (error) => {
      const testName = Cypress.currentTest.title
        .replace(/[^a-z0-9]/gi, '-')
        .toLowerCase();
      
      cy.screenshot(\`failure-\${testName}-\${Date.now()}\`, {
        capture: 'viewport',
        overwrite: false
      });
      
      throw error;
    });
  }
}
\`\`\`

### Cross-Browser Test Optimization
\`\`\`javascript
// cypress/support/cross-browser.js
class CrossBrowserSupport {
  // Browser-specific handling
  static handleBrowserDifferences() {
    cy.window().then((win) => {
      const isFirefox = win.navigator.userAgent.includes('Firefox');
      const isSafari = win.navigator.userAgent.includes('Safari') && 
                      !win.navigator.userAgent.includes('Chrome');
      
      if (isFirefox) {
        // Firefox-specific configurations
        cy.get('body').invoke('attr', 'data-browser', 'firefox');
      } else if (isSafari) {
        // Safari-specific configurations
        cy.get('body').invoke('attr', 'data-browser', 'safari');
      }
    });
  }
  
  // Viewport management for responsive testing
  static testAcrossViewports(viewports, testCallback) {
    viewports.forEach(viewport => {
      describe(\`Testing on \${viewport.name}\`, () => {
        beforeEach(() => {
          cy.viewport(viewport.width, viewport.height);
        });
        
        testCallback(viewport);
      });
    });
  }
  
  // Feature detection
  static checkFeatureSupport(feature) {
    return cy.window().then((win) => {
      switch (feature) {
        case 'webgl':
          return !!win.WebGLRenderingContext;
        case 'webworkers':
          return typeof win.Worker !== 'undefined';
        case 'localstorage':
          return typeof win.localStorage !== 'undefined';
        default:
          return false;
      }
    });
  }
}
\`\`\`

### Test Reporting and Analytics
\`\`\`javascript
// cypress/plugins/test-analytics.js
class TestAnalytics {
  constructor() {
    this.testResults = [];
    this.performanceMetrics = [];
  }
  
  // Track test execution metrics
  trackTestResult(result) {
    this.testResults.push({
      title: result.title,
      state: result.state,
      duration: result.duration,
      browser: result.browser,
      timestamp: Date.now(),
      retries: result.currentRetry
    });
  }
  
  // Analyze flaky tests
  analyzeFlakiness() {
    const flakyTests = this.testResults
      .reduce((acc, result) => {
        const key = result.title;
        if (!acc[key]) {
          acc[key] = { passes: 0, failures: 0, total: 0 };
        }
        
        acc[key].total++;
        if (result.state === 'passed') {
          acc[key].passes++;
        } else {
          acc[key].failures++;
        }
        
        return acc;
      }, {});
    
    return Object.entries(flakyTests)
      .filter(([_, stats]) => stats.failures > 0 && stats.passes > 0)
      .map(([testTitle, stats]) => ({
        testTitle,
        flakinessRate: (stats.failures / stats.total * 100).toFixed(2),
        ...stats
      }))
      .sort((a, b) => parseFloat(b.flakinessRate) - parseFloat(a.flakinessRate));
  }
  
  // Generate test report
  generateReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.state === 'passed').length;
    const failedTests = this.testResults.filter(r => r.state === 'failed').length;
    const flakyTests = this.analyzeFlakiness();
    
    return {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        passRate: ((passedTests / totalTests) * 100).toFixed(2)
      },
      flakiness: flakyTests,
      performanceMetrics: this.calculatePerformanceStats(),
      recommendations: this.generateRecommendations(flakyTests)
    };
  }
  
  generateRecommendations(flakyTests) {
    const recommendations = [];
    
    if (flakyTests.length > 0) {
      recommendations.push('Review and stabilize flaky tests');
      recommendations.push('Implement better wait strategies');
      recommendations.push('Use more reliable selectors');
    }
    
    const avgDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0) / this.testResults.length;
    if (avgDuration > 30000) {
      recommendations.push('Optimize test execution time');
      recommendations.push('Consider parallelization');
    }
    
    return recommendations;
  }
}

module.exports = TestAnalytics;
\`\`\`

This comprehensive maintenance framework provides:
- Robust element selection and interaction strategies
- Smart waiting mechanisms to reduce flakiness
- Comprehensive test data management with cleanup
- Performance optimization techniques
- Cross-browser testing support
- Test analytics and flakiness detection
- Automated reporting and recommendations`;
  }

  async troubleshoot(issue) {
    const solutions = {
      flaky_tests: [
        'Implement explicit waits instead of fixed delays',
        'Use data-testid attributes for reliable element selection',
        'Wait for network requests to complete before assertions',
        'Check for race conditions in asynchronous operations',
        'Implement retry mechanisms for intermittent failures'
      ],
      slow_execution: [
        'Optimize test setup and teardown procedures',
        'Use test parallelization where possible',
        'Implement smart test selection and skipping',
        'Optimize network request mocking',
        'Review and reduce unnecessary waiting times'
      ],
      cross_browser_issues: [
        'Implement browser-specific handling for different behaviors',
        'Use CSS selectors that work across all browsers',
        'Check for JavaScript feature compatibility',
        'Test timing differences between browser engines',
        'Validate responsive design across different viewports'
      ],
      accessibility_failures: [
        'Run automated accessibility scans with axe-core',
        'Test keyboard navigation paths thoroughly',
        'Verify ARIA labels and semantic HTML usage',
        'Check color contrast ratios meet WCAG standards',
        'Test with actual screen readers when possible'
      ]
    };
    
    return solutions[issue.type] || ['Review test logs and browser console for errors'];
  }
}

module.exports = UITestingSpecialist;