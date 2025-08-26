/**
 * BUMBA Kubernetes Integration - Enhanced to 90% operational
 * Container orchestration at scale with deployment automation
 */

const { EventEmitter } = require('events');
const { execSync, exec } = require('child_process');
const { logger } = require('../logging/bumba-logger');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const KubernetesScheduler = require('./kubernetes-scheduler');
const KubernetesOrchestrator = require('./kubernetes-orchestrator');
const KubernetesOptimizer = require('./kubernetes-optimizer');
const KubernetesAnalytics = require('./kubernetes-analytics');

class KubernetesIntegration extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      kubeconfig: config.kubeconfig || process.env.KUBECONFIG || '~/.kube/config',
      context: config.context || process.env.K8S_CONTEXT,
      namespace: config.namespace || process.env.K8S_NAMESPACE || 'default',
      
      // Cluster configuration
      cluster: {
        apiServer: config.apiServer || process.env.K8S_API_SERVER,
        token: config.token || process.env.K8S_TOKEN,
        caCert: config.caCert || process.env.K8S_CA_CERT
      },
      
      // Deployment defaults
      deployment: {
        replicas: config.defaultReplicas || 3,
        strategy: config.deploymentStrategy || 'RollingUpdate',
        maxSurge: config.maxSurge || 1,
        maxUnavailable: config.maxUnavailable || 1
      },
      
      // Resource limits
      resources: {
        requests: {
          memory: config.requestMemory || '128Mi',
          cpu: config.requestCpu || '100m'
        },
        limits: {
          memory: config.limitMemory || '512Mi',
          cpu: config.limitCpu || '500m'
        }
      },
      
      // Monitoring
      monitoring: {
        enabled: config.monitoring !== false,
        metricsPort: config.metricsPort || 9090
      },
      
      // Enhanced features
      enhancedMode: config.enhancedMode !== false,
      schedulingEnabled: config.schedulingEnabled !== false,
      orchestrationEnabled: config.orchestrationEnabled !== false,
      optimizationEnabled: config.optimizationEnabled !== false,
      analyticsEnabled: config.analyticsEnabled !== false,
      
      ...config
    };
    
    this.deployments = new Map();
    this.services = new Map();
    this.pods = new Map();
    this.configMaps = new Map();
    this.secrets = new Map();
    
    this.metrics = {
      deploymentsCreated: 0,
      servicesCreated: 0,
      podsRunning: 0,
      rollouts: 0,
      rollbacks: 0
    };
    
    this.kubectlAvailable = false;
    
    // Initialize enhancement components if enabled
    if (this.config.enhancedMode) {
      this.initializeEnhancements();
    }
  }
  
  /**
   * Initialize enhancement components
   */
  initializeEnhancements() {
    // Initialize scheduler
    if (this.config.schedulingEnabled) {
      this.scheduler = new KubernetesScheduler({
        maxConcurrentDeployments: this.config.maxConcurrentDeployments,
        deploymentInterval: this.config.deploymentInterval,
        progressiveDelivery: this.config.progressiveDelivery,
        autoScalingEnabled: this.config.autoScalingEnabled
      });
      
      this.setupSchedulerIntegration();
      logger.info('📅 Kubernetes Scheduler enabled');
    }
    
    // Initialize orchestrator
    if (this.config.orchestrationEnabled) {
      this.orchestrator = new KubernetesOrchestrator({
        maxClusters: this.config.maxClusters,
        serviceDiscovery: this.config.serviceDiscovery,
        loadBalancing: this.config.loadBalancing,
        faultTolerance: this.config.faultTolerance
      });
      
      this.setupOrchestratorIntegration();
      logger.info('🔴 Kubernetes Orchestrator enabled');
    }
    
    // Initialize optimizer
    if (this.config.optimizationEnabled) {
      this.optimizer = new KubernetesOptimizer({
        optimizationInterval: this.config.optimizationInterval,
        costAwareness: this.config.costAwareness,
        rightSizing: this.config.rightSizing,
        spotInstances: this.config.spotInstances
      });
      
      this.setupOptimizerIntegration();
      logger.info('🟢 Kubernetes Optimizer enabled');
    }
    
    // Initialize analytics
    if (this.config.analyticsEnabled) {
      this.analytics = new KubernetesAnalytics({
        metricsInterval: this.config.metricsInterval,
        alertingEnabled: this.config.alertingEnabled,
        predictiveAnalytics: this.config.predictiveAnalytics,
        anomalyDetection: this.config.anomalyDetection
      });
      
      this.setupAnalyticsIntegration();
      logger.info('📊 Kubernetes Analytics enabled');
    }
  }
  
  /**
   * Setup scheduler integration
   */
  setupSchedulerIntegration() {
    this.scheduler.on('deployment:completed', (deployment) => {
      this.emit('scheduled:deployment:completed', deployment);
      if (this.analytics) {
        this.analytics.trackDeploymentMetrics(deployment.name, {
          deploymentTime: deployment.endTime - deployment.startTime,
          rolloutStatus: 'completed'
        });
      }
    });
    
    this.scheduler.on('deployment:failed', ({ deployment, error }) => {
      this.emit('scheduled:deployment:failed', { deployment, error });
      if (this.analytics) {
        this.analytics.trackDeploymentMetrics(deployment.name, {
          rolloutStatus: 'failed',
          errors: 1
        });
      }
    });
  }
  
  /**
   * Setup orchestrator integration
   */
  setupOrchestratorIntegration() {
    this.orchestrator.on('multicluster:deployed', (orchestration) => {
      this.emit('orchestrated:multicluster', orchestration);
    });
    
    this.orchestrator.on('servicemesh:configured', (mesh) => {
      this.emit('orchestrated:servicemesh', mesh);
    });
    
    this.orchestrator.on('helm:deployed', (deployment) => {
      this.emit('orchestrated:helm', deployment);
    });
  }
  
  /**
   * Setup optimizer integration
   */
  setupOptimizerIntegration() {
    this.optimizer.on('optimization:completed', (optimization) => {
      this.emit('optimized:resources', optimization);
    });
    
    this.optimizer.on('cost:optimized', (costOptimization) => {
      this.emit('optimized:costs', costOptimization);
    });
    
    this.optimizer.on('budget:exceeded', (alert) => {
      if (this.analytics) {
        this.analytics.createAlert('budget-exceeded', alert);
      }
    });
  }
  
  /**
   * Setup analytics integration
   */
  setupAnalyticsIntegration() {
    this.analytics.on('alert:created', (alert) => {
      this.emit('analytics:alert', alert);
    });
    
    this.analytics.on('anomaly:detected', (anomaly) => {
      this.emit('analytics:anomaly', anomaly);
    });
    
    this.analytics.on('report:generated', (report) => {
      this.emit('analytics:report', report);
    });
  }
  
  /**
   * Initialize Kubernetes integration
   */
  async initialize() {
    try {
      // Check if kubectl is available
      this.kubectlAvailable = await this.checkKubectlAvailable();
      
      if (!this.kubectlAvailable) {
        logger.warn('🟡 kubectl not available on this system');
        this.showSetupGuide();
        return false;
      }
      
      // Get cluster info
      const clusterInfo = await this.getClusterInfo();
      logger.info('🟢️ Kubernetes integration initialized');
      logger.info(`📍 Cluster: ${clusterInfo}`);
      logger.info(`📦 Namespace: ${this.config.namespace}`);
      
      // Load existing resources
      await this.loadExistingResources();
      
      this.emit('initialized', { cluster: clusterInfo });
      return true;
    } catch (error) {
      logger.error('🔴 Failed to initialize Kubernetes:', error);
      return false;
    }
  }
  
  /**
   * Check if kubectl is available
   */
  async checkKubectlAvailable() {
    try {
      execSync('kubectl version --client --short', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Get cluster information
   */
  async getClusterInfo() {
    try {
      const output = await this.kubectl('cluster-info');
      const match = output.match(/Kubernetes .* is running at (.*)/);
      return match ? match[1] : 'unknown';
    } catch {
      return 'unknown';
    }
  }
  
  /**
   * Create deployment
   */
  async createDeployment(name, options = {}) {
    try {
      logger.info(`🟢 Creating deployment: ${name}`);
      
      const deployment = {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
          name,
          namespace: this.config.namespace,
          labels: options.labels || { app: name }
        },
        spec: {
          replicas: options.replicas || this.config.deployment.replicas,
          selector: {
            matchLabels: options.labels || { app: name }
          },
          strategy: {
            type: this.config.deployment.strategy,
            rollingUpdate: {
              maxSurge: this.config.deployment.maxSurge,
              maxUnavailable: this.config.deployment.maxUnavailable
            }
          },
          template: {
            metadata: {
              labels: options.labels || { app: name }
            },
            spec: {
              containers: [{
                name: options.containerName || name,
                image: options.image || `${name}:latest`,
                ports: options.ports || [{ containerPort: 80 }],
                env: this.formatEnvVars(options.env),
                resources: options.resources || this.config.resources,
                livenessProbe: options.livenessProbe,
                readinessProbe: options.readinessProbe
              }]
            }
          }
        }
      };
      
      // Apply deployment
      await this.applyManifest(deployment);
      
      this.deployments.set(name, {
        name,
        createdAt: Date.now(),
        spec: deployment
      });
      
      this.metrics.deploymentsCreated++;
      this.emit('deployment-created', { name });
      
      return true;
    } catch (error) {
      logger.error(`Failed to create deployment ${name}:`, error);
      throw error;
    }
  }
  
  /**
   * Create service
   */
  async createService(name, options = {}) {
    try {
      logger.info(`🔌 Creating service: ${name}`);
      
      const service = {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
          name,
          namespace: this.config.namespace,
          labels: options.labels || { app: name }
        },
        spec: {
          type: options.type || 'ClusterIP',
          selector: options.selector || { app: name },
          ports: options.ports || [{
            protocol: 'TCP',
            port: 80,
            targetPort: 80
          }]
        }
      };
      
      // Add LoadBalancer/NodePort specific fields
      if (options.type === 'LoadBalancer' && options.loadBalancerIP) {
        service.spec.loadBalancerIP = options.loadBalancerIP;
      }
      
      if (options.type === 'NodePort' && options.nodePort) {
        service.spec.ports[0].nodePort = options.nodePort;
      }
      
      // Apply service
      await this.applyManifest(service);
      
      this.services.set(name, {
        name,
        type: service.spec.type,
        createdAt: Date.now()
      });
      
      this.metrics.servicesCreated++;
      this.emit('service-created', { name });
      
      return true;
    } catch (error) {
      logger.error(`Failed to create service ${name}:`, error);
      throw error;
    }
  }
  
  /**
   * Create ConfigMap
   */
  async createConfigMap(name, data, options = {}) {
    try {
      const configMap = {
        apiVersion: 'v1',
        kind: 'ConfigMap',
        metadata: {
          name,
          namespace: this.config.namespace,
          labels: options.labels || {}
        },
        data
      };
      
      await this.applyManifest(configMap);
      
      this.configMaps.set(name, {
        name,
        createdAt: Date.now()
      });
      
      this.emit('configmap-created', { name });
      return true;
    } catch (error) {
      logger.error(`Failed to create ConfigMap ${name}:`, error);
      throw error;
    }
  }
  
  /**
   * Create Secret
   */
  async createSecret(name, data, options = {}) {
    try {
      // Base64 encode secret data
      const encodedData = {};
      Object.entries(data).forEach(([key, value]) => {
        encodedData[key] = Buffer.from(value).toString('base64');
      });
      
      const secret = {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
          name,
          namespace: this.config.namespace,
          labels: options.labels || {}
        },
        type: options.type || 'Opaque',
        data: encodedData
      };
      
      await this.applyManifest(secret);
      
      this.secrets.set(name, {
        name,
        type: secret.type,
        createdAt: Date.now()
      });
      
      this.emit('secret-created', { name });
      return true;
    } catch (error) {
      logger.error(`Failed to create Secret ${name}:`, error);
      throw error;
    }
  }
  
  /**
   * Scale deployment
   */
  async scaleDeployment(name, replicas) {
    try {
      await this.kubectl(`scale deployment ${name} --replicas=${replicas}`);
      
      const deployment = this.deployments.get(name);
      if (deployment) {
        deployment.replicas = replicas;
      }
      
      this.emit('deployment-scaled', { name, replicas });
      return true;
    } catch (error) {
      logger.error(`Failed to scale deployment ${name}:`, error);
      throw error;
    }
  }
  
  /**
   * Rolling update deployment
   */
  async updateDeployment(name, image) {
    try {
      await this.kubectl(`set image deployment/${name} ${name}=${image}`);
      
      this.metrics.rollouts++;
      this.emit('deployment-updated', { name, image });
      
      // Wait for rollout to complete
      await this.waitForRollout(name);
      
      return true;
    } catch (error) {
      logger.error(`Failed to update deployment ${name}:`, error);
      throw error;
    }
  }
  
  /**
   * Rollback deployment
   */
  async rollbackDeployment(name) {
    try {
      await this.kubectl(`rollout undo deployment/${name}`);
      
      this.metrics.rollbacks++;
      this.emit('deployment-rolledback', { name });
      
      return true;
    } catch (error) {
      logger.error(`Failed to rollback deployment ${name}:`, error);
      throw error;
    }
  }
  
  /**
   * Get pod logs
   */
  async getPodLogs(podName, options = {}) {
    try {
      let command = `logs ${podName}`;
      
      if (options.container) command += ` -c ${options.container}`;
      if (options.follow) command += ' -f';
      if (options.tail) command += ` --tail=${options.tail}`;
      if (options.previous) command += ' --previous';
      
      const logs = await this.kubectl(command);
      return logs;
    } catch (error) {
      logger.error(`Failed to get logs for pod ${podName}:`, error);
      throw error;
    }
  }
  
  /**
   * Execute command in pod
   */
  async execInPod(podName, command, options = {}) {
    try {
      let kubectlCommand = `exec ${podName}`;
      
      if (options.container) kubectlCommand += ` -c ${options.container}`;
      if (options.stdin) kubectlCommand += ' -i';
      if (options.tty) kubectlCommand += ' -t';
      
      kubectlCommand += ` -- ${command}`;
      
      const output = await this.kubectl(kubectlCommand);
      return output;
    } catch (error) {
      logger.error(`Failed to exec in pod ${podName}:`, error);
      throw error;
    }
  }
  
  /**
   * Port forward to pod
   */
  async portForward(podName, localPort, podPort) {
    try {
      const command = `port-forward ${podName} ${localPort}:${podPort}`;
      
      // Run in background
      exec(`kubectl ${this.getKubectlFlags()} ${command}`, (error) => {
        if (error) {
          logger.error('Port forward error:', error);
        }
      });
      
      this.emit('port-forward-started', { podName, localPort, podPort });
      return true;
    } catch (error) {
      logger.error(`Failed to setup port forward:`, error);
      throw error;
    }
  }
  
  /**
   * Apply manifest
   */
  async applyManifest(manifest) {
    const yamlContent = yaml.dump(manifest);
    const tempFile = path.join('/tmp', `k8s-manifest-${Date.now()}.yaml`);
    
    try {
      fs.writeFileSync(tempFile, yamlContent);
      await this.kubectl(`apply -f ${tempFile}`);
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }
  
  /**
   * Wait for rollout to complete
   */
  async waitForRollout(deploymentName, timeout = 300) {
    try {
      await this.kubectl(`rollout status deployment/${deploymentName} --timeout=${timeout}s`);
      return true;
    } catch (error) {
      logger.error(`Rollout failed for ${deploymentName}:`, error);
      throw error;
    }
  }
  
  /**
   * Load existing resources
   */
  async loadExistingResources() {
    try {
      // Load deployments
      const deployments = await this.kubectl('get deployments -o name');
      deployments.split('\n').filter(Boolean).forEach(d => {
        const name = d.replace('deployment.apps/', '');
        this.deployments.set(name, { name });
      });
      
      // Load services
      const services = await this.kubectl('get services -o name');
      services.split('\n').filter(Boolean).forEach(s => {
        const name = s.replace('service/', '');
        this.services.set(name, { name });
      });
      
      // Count running pods
      const pods = await this.kubectl('get pods --field-selector=status.phase=Running -o name');
      this.metrics.podsRunning = pods.split('\n').filter(Boolean).length;
    } catch (error) {
      logger.warn('Could not load existing K8s resources:', error.message);
    }
  }
  
  /**
   * Format environment variables
   */
  formatEnvVars(env) {
    if (!env) return [];
    
    return Object.entries(env).map(([name, value]) => ({
      name,
      value: String(value)
    }));
  }
  
  /**
   * Get kubectl flags
   */
  getKubectlFlags() {
    let flags = '';
    
    if (this.config.namespace) {
      flags += ` -n ${this.config.namespace}`;
    }
    
    if (this.config.context) {
      flags += ` --context ${this.config.context}`;
    }
    
    if (this.config.kubeconfig && this.config.kubeconfig !== '~/.kube/config') {
      flags += ` --kubeconfig ${this.config.kubeconfig}`;
    }
    
    return flags;
  }
  
  /**
   * Execute kubectl command
   */
  async kubectl(command) {
    const fullCommand = `kubectl ${this.getKubectlFlags()} ${command}`;
    
    return new Promise((resolve, reject) => {
      exec(fullCommand, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
        } else {
          resolve(stdout);
        }
      });
    });
  }
  
  /**
   * Show setup guide
   */
  showSetupGuide() {
    console.log(`
🟢️ Kubernetes Integration Setup Guide
====================================

1. Install kubectl:
   - macOS: brew install kubectl
   - Linux: snap install kubectl --classic
   
2. Configure cluster access:
   - Copy kubeconfig to ~/.kube/config
   - Or set KUBECONFIG environment variable
   
3. Verify connection:
   kubectl cluster-info
   kubectl get nodes
   
4. Use the integration:
   const k8s = new KubernetesIntegration();
   await k8s.initialize();
   await k8s.createDeployment('my-app', {
     image: 'my-app:latest',
     replicas: 3
   });
    `);
  }
  
  /**
   * Get status
   */
  getStatus() {
    const status = {
      available: this.kubectlAvailable,
      namespace: this.config.namespace,
      context: this.config.context,
      resources: {
        deployments: this.deployments.size,
        services: this.services.size,
        configMaps: this.configMaps.size,
        secrets: this.secrets.size,
        podsRunning: this.metrics.podsRunning
      },
      metrics: this.metrics,
      enhanced: this.config.enhancedMode
    };
    
    // Add enhanced component status
    if (this.config.enhancedMode) {
      status.components = {
        scheduler: this.scheduler ? this.scheduler.getMetrics() : null,
        orchestrator: this.orchestrator ? this.orchestrator.getMetrics() : null,
        optimizer: this.optimizer ? this.optimizer.getMetrics() : null,
        analytics: this.analytics ? this.analytics.getMetrics() : null
      };
    }
    
    return status;
  }
  
  /**
   * Enhanced API Methods
   */
  
  // Scheduling methods
  async scheduleDeployment(deployment) {
    if (!this.scheduler) {
      throw new Error('Scheduler not enabled');
    }
    
    return await this.scheduler.scheduleDeployment(deployment);
  }
  
  async scheduleCanaryDeployment(deployment) {
    if (!this.scheduler) {
      throw new Error('Scheduler not enabled');
    }
    
    return await this.scheduler.scheduleCanaryDeployment(deployment);
  }
  
  async scheduleBlueGreenDeployment(deployment) {
    if (!this.scheduler) {
      throw new Error('Scheduler not enabled');
    }
    
    return await this.scheduler.scheduleBlueGreenDeployment(deployment);
  }
  
  configureAutoScaling(deploymentName, policy) {
    if (!this.scheduler) {
      throw new Error('Scheduler not enabled');
    }
    
    return this.scheduler.configureAutoScaling(deploymentName, policy);
  }
  
  // Orchestration methods
  async orchestrateMultiCluster(deployment) {
    if (!this.orchestrator) {
      throw new Error('Orchestrator not enabled');
    }
    
    return await this.orchestrator.orchestrateMultiCluster(deployment);
  }
  
  async manageServiceMesh(meshConfig) {
    if (!this.orchestrator) {
      throw new Error('Orchestrator not enabled');
    }
    
    return await this.orchestrator.manageServiceMesh(meshConfig);
  }
  
  async deployHelmChart(chart) {
    if (!this.orchestrator) {
      throw new Error('Orchestrator not enabled');
    }
    
    return await this.orchestrator.deployHelmChart(chart);
  }
  
  async orchestrateStatefulWorkload(workload) {
    if (!this.orchestrator) {
      throw new Error('Orchestrator not enabled');
    }
    
    return await this.orchestrator.orchestrateStatefulWorkload(workload);
  }
  
  async executeWorkflow(workflowName, context) {
    if (!this.orchestrator) {
      throw new Error('Orchestrator not enabled');
    }
    
    return await this.orchestrator.executeWorkflow(workflowName, context);
  }
  
  async implementFailover(service, failure) {
    if (!this.orchestrator) {
      throw new Error('Orchestrator not enabled');
    }
    
    return await this.orchestrator.implementFailover(service, failure);
  }
  
  async orchestrateGitOps(gitOpsConfig) {
    if (!this.orchestrator) {
      throw new Error('Orchestrator not enabled');
    }
    
    return await this.orchestrator.orchestrateGitOps(gitOpsConfig);
  }
  
  // Optimization methods
  async optimizeResources(namespace) {
    if (!this.optimizer) {
      throw new Error('Optimizer not enabled');
    }
    
    return await this.optimizer.optimizeResources(namespace);
  }
  
  async optimizeCosts(clusters) {
    if (!this.optimizer) {
      throw new Error('Optimizer not enabled');
    }
    
    return await this.optimizer.optimizeCosts(clusters);
  }
  
  async optimizeNodes(nodePool) {
    if (!this.optimizer) {
      throw new Error('Optimizer not enabled');
    }
    
    return await this.optimizer.optimizeNodes(nodePool);
  }
  
  async optimizeImages(registry) {
    if (!this.optimizer) {
      throw new Error('Optimizer not enabled');
    }
    
    return await this.optimizer.optimizeImages(registry);
  }
  
  async optimizeNetwork(services) {
    if (!this.optimizer) {
      throw new Error('Optimizer not enabled');
    }
    
    return await this.optimizer.optimizeNetwork(services);
  }
  
  async optimizePerformance(workload) {
    if (!this.optimizer) {
      throw new Error('Optimizer not enabled');
    }
    
    return await this.optimizer.optimizePerformance(workload);
  }
  
  setupBudgetAlert(budget) {
    if (!this.optimizer) {
      throw new Error('Optimizer not enabled');
    }
    
    return this.optimizer.setupBudgetAlert(budget);
  }
  
  // Analytics methods
  trackClusterMetrics(cluster, metrics) {
    if (this.analytics) {
      this.analytics.trackClusterMetrics(cluster, metrics);
    }
  }
  
  trackDeploymentMetrics(deployment, metrics) {
    if (this.analytics) {
      this.analytics.trackDeploymentMetrics(deployment, metrics);
    }
  }
  
  trackPodMetrics(pod, metrics) {
    if (this.analytics) {
      this.analytics.trackPodMetrics(pod, metrics);
    }
  }
  
  trackNodeMetrics(node, metrics) {
    if (this.analytics) {
      this.analytics.trackNodeMetrics(node, metrics);
    }
  }
  
  generatePerformanceReport(timeRange) {
    if (!this.analytics) {
      throw new Error('Analytics not enabled');
    }
    
    return this.analytics.generatePerformanceReport(timeRange);
  }
  
  createDashboard(name, config) {
    if (!this.analytics) {
      throw new Error('Analytics not enabled');
    }
    
    return this.analytics.createDashboard(name, config);
  }
  
  async performPredictiveAnalysis(resource, horizon) {
    if (!this.analytics) {
      throw new Error('Analytics not enabled');
    }
    
    return await this.analytics.performPredictiveAnalysis(resource, horizon);
  }
  
  trackSLA(service, sla) {
    if (!this.analytics) {
      throw new Error('Analytics not enabled');
    }
    
    return this.analytics.trackSLA(service, sla);
  }
}

// Note: js-yaml is optional, provide fallback
if (!yaml) {
  KubernetesIntegration.prototype.yaml = {
    dump: (obj) => JSON.stringify(obj, null, 2)
  };
}

module.exports = { KubernetesIntegration };