/**
 * BUMBA Jenkins Specialist
 * Expert in Jenkins CI/CD pipelines, automation, and best practices
 */

const UnifiedSpecialistBase = require('../../unified-specialist-base');

class JenkinsSpecialist extends UnifiedSpecialistBase {
  constructor() {
    super({
      name: 'Jenkins Specialist',
      expertise: ['Jenkins', 'CI/CD', 'Pipeline as Code', 'Groovy', 'Automation'],
      models: ['claude-3-opus-20240229', 'gpt-4'],
      temperature: 0.3,
      systemPrompt: `You are a Jenkins CI/CD expert specializing in:
        - Declarative and Scripted Pipeline development
        - Jenkins Configuration as Code
        - Plugin management and optimization
        - Distributed builds with agents
        - Security and access control
        - Integration with SCM, Docker, Kubernetes
        - Performance optimization and scaling
        - Blue Ocean and modern UI features
        Always prioritize reliability, security, and maintainability.`
    });

    this.capabilities = {
      pipeline: true,
      groovy: true,
      plugins: true,
      agents: true,
      security: true,
      integration: true,
      monitoring: true,
      optimization: true
    };
  }

  async createPipeline(context) {
    const analysis = await this.analyze(context);
    
    return {
      jenkinsfile: this.generateJenkinsfile(analysis),
      sharedLibrary: context.useSharedLibrary ? this.generateSharedLibrary(analysis) : null,
      configuration: this.generateConfiguration(analysis),
      plugins: this.recommendPlugins(analysis)
    };
  }

  generateJenkinsfile(analysis) {
    const { projectType, stages, tools } = analysis;
    
    return `pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        DOCKER_REGISTRY = 'registry.example.com'
        APP_NAME = '${analysis.appName || 'app'}'
    }
    
    tools {
        ${this.generateTools(tools)}
    }
    
    options {
        timestamps()
        timeout(time: 1, unit: 'HOURS')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }
    
    stages {
        ${this.generateStages(stages)}
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline succeeded!'
            ${this.generateNotifications('success', analysis)}
        }
        failure {
            echo 'Pipeline failed!'
            ${this.generateNotifications('failure', analysis)}
        }
    }
}`;
  }

  generateTools(tools) {
    const toolsConfig = [];
    
    if (tools.includes('node')) {
      toolsConfig.push("nodejs 'NodeJS-18'");
    }
    if (tools.includes('maven')) {
      toolsConfig.push("maven 'Maven-3.9'");
    }
    if (tools.includes('gradle')) {
      toolsConfig.push("gradle 'Gradle-7'");
    }
    
    return toolsConfig.join('\n        ');
  }

  generateStages(stages) {
    const stageDefinitions = {
      checkout: `stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT = sh(returnStdout: true, script: 'git rev-parse HEAD').trim()
                    env.GIT_BRANCH = sh(returnStdout: true, script: 'git rev-parse --abbrev-ref HEAD').trim()
                }
            }
        }`,
      
      build: `stage('Build') {
            steps {
                sh 'npm ci'
                sh 'npm run build'
            }
        }`,
      
      test: `stage('Test') {
            steps {
                sh 'npm test'
                junit 'test-results/**/*.xml'
                publishHTML([
                    reportDir: 'coverage',
                    reportFiles: 'index.html',
                    reportName: 'Coverage Report'
                ])
            }
        }`,
      
      security: `stage('Security Scan') {
            steps {
                sh 'npm audit'
                dependencyCheck additionalArguments: '--scan .', odcInstallation: 'dependency-check'
            }
        }`,
      
      docker: `stage('Docker Build') {
            steps {
                script {
                    docker.build("\${DOCKER_REGISTRY}/\${APP_NAME}:\${GIT_COMMIT}")
                }
            }
        }`,
      
      deploy: `stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                script {
                    docker.withRegistry('https://\${DOCKER_REGISTRY}', 'docker-credentials') {
                        docker.image("\${DOCKER_REGISTRY}/\${APP_NAME}:\${GIT_COMMIT}").push()
                        docker.image("\${DOCKER_REGISTRY}/\${APP_NAME}:\${GIT_COMMIT}").push('latest')
                    }
                }
            }
        }`
    };
    
    return stages.map(stage => stageDefinitions[stage] || '').filter(Boolean).join('\n\n        ');
  }

  generateNotifications(status, analysis) {
    const notifications = [];
    
    if (analysis.notifications?.includes('slack')) {
      notifications.push(`slackSend channel: '#ci-cd', color: '${status === 'success' ? 'good' : 'danger'}', message: "Build \${currentBuild.fullDisplayName} ${status}"`);
    }
    
    if (analysis.notifications?.includes('email')) {
      notifications.push(`emailext subject: "Build \${currentBuild.fullDisplayName} ${status}", body: "Check console output at \${BUILD_URL}", to: '\${DEFAULT_RECIPIENTS}'`);
    }
    
    return notifications.join('\n            ');
  }

  generateSharedLibrary(analysis) {
    return {
      structure: {
        'vars/': ['buildPipeline.groovy', 'deployPipeline.groovy'],
        'src/': ['org/company/Pipeline.groovy'],
        'resources/': ['config/settings.yml']
      },
      example: `// vars/buildPipeline.groovy
def call(Map config = [:]) {
    pipeline {
        agent any
        stages {
            stage('Build') {
                steps {
                    echo "Building \${config.appName}"
                    sh config.buildCommand ?: 'npm run build'
                }
            }
        }
    }
}`
    };
  }

  generateConfiguration(analysis) {
    return {
      'jenkins.yaml': this.generateJenkinsYaml(analysis),
      'plugins.txt': this.generatePluginsList(analysis),
      'Dockerfile': this.generateJenkinsDockerfile(analysis)
    };
  }

  generateJenkinsYaml(analysis) {
    return `jenkins:
  systemMessage: "Jenkins CI/CD Server"
  numExecutors: 2
  mode: NORMAL
  
  securityRealm:
    local:
      allowsSignup: false
      
  authorizationStrategy:
    globalMatrix:
      permissions:
        - "Overall/Read:anonymous"
        - "Overall/Administer:admin"
        
  clouds:
    - kubernetes:
        name: "kubernetes"
        serverUrl: "https://kubernetes.default"
        
credentials:
  system:
    domainCredentials:
      - credentials:
          - string:
              id: "slack-token"
              secret: "\${SLACK_TOKEN}"
              description: "Slack integration token"`;
  }

  generatePluginsList(analysis) {
    const plugins = [
      'workflow-aggregator',
      'git',
      'github',
      'docker-workflow',
      'kubernetes',
      'slack',
      'email-ext',
      'junit',
      'htmlpublisher',
      'dependency-check-jenkins-plugin'
    ];
    
    return plugins.join('\n');
  }

  generateJenkinsDockerfile(analysis) {
    return `FROM jenkins/jenkins:lts
USER root
RUN apt-get update && apt-get install -y \\
    docker.io \\
    python3-pip \\
    && rm -rf /var/lib/apt/lists/*
USER jenkins
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli -f /usr/share/jenkins/ref/plugins.txt`;
  }

  recommendPlugins(analysis) {
    const recommendations = {
      essential: [
        'Pipeline',
        'Git',
        'Credentials',
        'Workspace Cleanup'
      ],
      testing: [
        'JUnit',
        'HTML Publisher',
        'Test Results Analyzer'
      ],
      security: [
        'OWASP Dependency Check',
        'Warnings Next Generation'
      ],
      deployment: [
        'Docker Pipeline',
        'Kubernetes CLI',
        'SSH Agent'
      ],
      monitoring: [
        'Prometheus',
        'Build Monitor View'
      ]
    };
    
    return recommendations;
  }

  async optimizePipeline(jenkinsfilePath) {
    return {
      parallelization: this.suggestParallelization(),
      caching: this.suggestCaching(),
      agents: this.suggestAgentOptimization()
    };
  }

  suggestParallelization() {
    return {
      pattern: `parallel {
    stage('Unit Tests') {
        steps { sh 'npm run test:unit' }
    }
    stage('Integration Tests') {
        steps { sh 'npm run test:integration' }
    }
    stage('Lint') {
        steps { sh 'npm run lint' }
    }
}`,
      benefits: 'Reduce pipeline duration by running independent tasks in parallel'
    };
  }

  suggestCaching() {
    return {
      nodeModules: 'Use Jenkins workspace caching for node_modules',
      docker: 'Leverage Docker layer caching for faster builds',
      maven: 'Configure Maven local repository caching'
    };
  }

  suggestAgentOptimization() {
    return {
      labels: 'Use agent labels to run stages on appropriate nodes',
      docker: 'Use Docker agents for consistent build environments',
      kubernetes: 'Leverage Kubernetes pods for scalable agents'
    };
  }
}

module.exports = JenkinsSpecialist;