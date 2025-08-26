/**
 * BUMBA CI/CD Specialist
 * Expert in continuous integration and deployment across multiple platforms
 */

const UnifiedSpecialistBase = require('../../unified-specialist-base');

class CICDSpecialist extends UnifiedSpecialistBase {
  constructor() {
    super({
      name: 'CI/CD Specialist',
      expertise: ['GitHub Actions', 'GitLab CI', 'CircleCI', 'Azure DevOps', 'Travis CI'],
      models: ['claude-3-opus-20240229', 'gpt-4'],
      temperature: 0.3,
      systemPrompt: `You are a CI/CD expert specializing in:
        - Multi-platform CI/CD pipeline design
        - GitHub Actions workflows and reusable actions
        - GitLab CI/CD with complex pipelines
        - CircleCI orbs and configuration
        - Azure DevOps pipelines
        - Build optimization and caching strategies
        - Deployment strategies (blue-green, canary, rolling)
        - Secret management and security
        Always prioritize speed, reliability, and security.`
    });

    this.capabilities = {
      githubActions: true,
      gitlabCI: true,
      circleCI: true,
      azureDevOps: true,
      travisCI: true,
      deployment: true,
      monitoring: true,
      optimization: true
    };
  }

  async createCICDPipeline(context) {
    const analysis = await this.analyze(context);
    const platform = context.platform || 'github';
    
    return {
      pipeline: this.generatePipeline(platform, analysis),
      deploymentStrategy: this.selectDeploymentStrategy(analysis),
      monitoring: this.setupMonitoring(analysis),
      optimization: this.optimizationSuggestions(analysis)
    };
  }

  generatePipeline(platform, analysis) {
    const generators = {
      github: () => this.generateGitHubActions(analysis),
      gitlab: () => this.generateGitLabCI(analysis),
      circle: () => this.generateCircleCI(analysis),
      azure: () => this.generateAzureDevOps(analysis)
    };
    
    return generators[platform]?.() || this.generateGitHubActions(analysis);
  }

  generateGitHubActions(analysis) {
    const { projectType, language, tests, deployment } = analysis;
    
    return {
      '.github/workflows/ci.yml': `name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16, 18, 20]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: |
        npm run test:unit
        npm run test:integration
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
    
  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Run security scan
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
    
    - name: SAST Scan
      uses: github/super-linter@v5
      env:
        DEFAULT_BRANCH: main
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
  
  build:
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: \${{ env.REGISTRY }}
        username: \${{ github.actor }}
        password: \${{ secrets.GITHUB_TOKEN }}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: |
          \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:latest
          \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: \${{ steps.deploy.outputs.url }}
    
    steps:
    - name: Deploy to Kubernetes
      run: |
        echo "Deploying to production..."
        # kubectl apply -f k8s/
    
    - name: Smoke tests
      run: |
        echo "Running smoke tests..."
        # npm run test:smoke`,
      
      '.github/workflows/release.yml': this.generateReleaseWorkflow(analysis)
    };
  }

  generateReleaseWorkflow(analysis) {
    return `name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Create Release
      uses: softprops/action-gh-release@v1
      with:
        generate_release_notes: true
        draft: false
        prerelease: false`;
  }

  generateGitLabCI(analysis) {
    return `.gitlab-ci.yml: |
stages:
  - build
  - test
  - security
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: ""

before_script:
  - docker info

build:
  stage: build
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

test:unit:
  stage: test
  script:
    - npm ci
    - npm run test:unit
  coverage: '/Lines\\s*:\\s*(\\d+\\.?\\d*)%/'

test:integration:
  stage: test
  script:
    - npm ci
    - npm run test:integration

security:sast:
  stage: security
  script:
    - npm audit
    - trivy fs .

deploy:production:
  stage: deploy
  script:
    - kubectl set image deployment/app app=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  environment:
    name: production
    url: https://app.example.com
  only:
    - main`;
  }

  generateCircleCI(analysis) {
    return `.circleci/config.yml: |
version: 2.1

orbs:
  node: circleci/node@5.0
  docker: circleci/docker@2.0

jobs:
  test:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - node/install-packages
      - run:
          name: Run tests
          command: npm test
      - store_test_results:
          path: test-results
      - store_artifacts:
          path: coverage

  build:
    executor: docker/docker
    steps:
      - setup_remote_docker
      - checkout
      - docker/check
      - docker/build:
          image: app
      - docker/push:
          image: app

workflows:
  main:
    jobs:
      - test
      - build:
          requires:
            - test
          filters:
            branches:
              only: main`;
  }

  generateAzureDevOps(analysis) {
    return `azure-pipelines.yml: |
trigger:
  branches:
    include:
    - main
    - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  buildConfiguration: 'Release'
  dockerRegistry: 'myregistry.azurecr.io'

stages:
- stage: Build
  jobs:
  - job: BuildJob
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '18.x'
    
    - script: |
        npm ci
        npm run build
      displayName: 'Build application'
    
    - task: Docker@2
      inputs:
        containerRegistry: 'dockerRegistryConnection'
        repository: 'myapp'
        command: 'buildAndPush'
        Dockerfile: '**/Dockerfile'

- stage: Test
  jobs:
  - job: TestJob
    steps:
    - script: npm test
      displayName: 'Run tests'
    
    - task: PublishTestResults@2
      inputs:
        testResultsFormat: 'JUnit'
        testResultsFiles: '**/test-results.xml'

- stage: Deploy
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - deployment: DeployJob
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: KubernetesManifest@0
            inputs:
              action: 'deploy'
              manifests: 'k8s/*.yaml'`;
  }

  selectDeploymentStrategy(analysis) {
    const strategies = {
      blueGreen: {
        description: 'Zero-downtime deployment with instant rollback',
        suitable: analysis.requiresZeroDowntime,
        implementation: this.implementBlueGreen()
      },
      canary: {
        description: 'Gradual rollout to subset of users',
        suitable: analysis.requiresGradualRollout,
        implementation: this.implementCanary()
      },
      rolling: {
        description: 'Sequential update of instances',
        suitable: analysis.standardDeployment,
        implementation: this.implementRolling()
      }
    };
    
    return strategies;
  }

  implementBlueGreen() {
    return {
      setup: 'Maintain two identical production environments',
      process: [
        'Deploy to inactive (green) environment',
        'Run smoke tests on green',
        'Switch router/load balancer to green',
        'Monitor for issues',
        'Keep blue as instant rollback'
      ]
    };
  }

  implementCanary() {
    return {
      setup: 'Configure traffic splitting in load balancer',
      process: [
        'Deploy new version to canary instances',
        'Route 5% traffic to canary',
        'Monitor metrics and errors',
        'Gradually increase traffic (10%, 25%, 50%, 100%)',
        'Rollback if metrics degrade'
      ]
    };
  }

  implementRolling() {
    return {
      setup: 'Configure orchestrator for rolling updates',
      kubernetes: `spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2
      maxUnavailable: 1`
    };
  }

  setupMonitoring(analysis) {
    return {
      metrics: [
        'Build duration',
        'Test coverage',
        'Deployment frequency',
        'Lead time for changes',
        'Mean time to recovery',
        'Change failure rate'
      ],
      tools: {
        prometheus: 'Metrics collection',
        grafana: 'Visualization dashboards',
        datadog: 'APM and logging',
        sentry: 'Error tracking'
      }
    };
  }

  optimizationSuggestions(analysis) {
    return {
      caching: [
        'Cache dependencies between builds',
        'Use Docker layer caching',
        'Implement distributed caching for large projects'
      ],
      parallelization: [
        'Run tests in parallel',
        'Split large test suites',
        'Use matrix builds for multiple environments'
      ],
      efficiency: [
        'Fail fast on critical errors',
        'Skip unchanged modules',
        'Use incremental builds',
        'Optimize Docker image sizes'
      ]
    };
  }

  async troubleshoot(issue) {
    const solutions = {
      slow_builds: [
        'Analyze build logs for bottlenecks',
        'Implement better caching strategies',
        'Parallelize independent tasks',
        'Use more powerful build agents'
      ],
      flaky_tests: [
        'Identify and quarantine flaky tests',
        'Add retry logic for network-dependent tests',
        'Improve test isolation',
        'Use test containers for dependencies'
      ],
      deployment_failures: [
        'Check deployment logs',
        'Verify credentials and permissions',
        'Test deployment scripts locally',
        'Implement better rollback mechanisms'
      ]
    };
    
    return solutions[issue.type] || ['Review CI/CD best practices'];
  }
}

module.exports = CICDSpecialist;