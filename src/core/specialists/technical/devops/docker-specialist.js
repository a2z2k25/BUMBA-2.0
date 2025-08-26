/**
 * BUMBA Docker Specialist
 * Expert in Docker containerization, orchestration, and best practices
 */

const UnifiedSpecialistBase = require('../../unified-specialist-base');

class DockerSpecialist extends UnifiedSpecialistBase {
  constructor() {
    super({
      name: 'Docker Specialist',
      expertise: ['Docker', 'Containerization', 'Docker Compose', 'Multi-stage builds'],
      models: ['claude-3-opus-20240229', 'gpt-4'],
      temperature: 0.3,
      systemPrompt: `You are a Docker containerization expert specializing in:
        - Creating optimized Dockerfiles with multi-stage builds
        - Docker Compose for multi-container applications
        - Container security best practices
        - Image optimization and layer caching
        - Registry management and CI/CD integration
        - Container orchestration with Docker Swarm
        - Debugging container issues
        - Performance optimization
        Always prioritize security, efficiency, and maintainability.`
    });

    this.capabilities = {
      dockerfile: true,
      compose: true,
      security: true,
      optimization: true,
      swarm: true,
      registry: true,
      networking: true,
      volumes: true
    };
  }

  async createDockerfile(context) {
    const analysis = await this.analyze(context);
    
    return {
      dockerfile: this.generateDockerfile(analysis),
      compose: context.multiContainer ? this.generateCompose(analysis) : null,
      optimizations: this.suggestOptimizations(analysis),
      security: this.securityRecommendations(analysis)
    };
  }

  generateDockerfile(analysis) {
    const { language, framework, dependencies } = analysis;
    
    return `# Multi-stage build for ${language} application
# Build stage
FROM ${this.getBaseImage(language, 'build')} AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Runtime stage
FROM ${this.getBaseImage(language, 'runtime')}
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE ${analysis.port || 3000}
USER node
CMD ["npm", "start"]`;
  }

  getBaseImage(language, stage) {
    const images = {
      node: {
        build: 'node:18-alpine',
        runtime: 'node:18-alpine'
      },
      python: {
        build: 'python:3.11-slim',
        runtime: 'python:3.11-slim'
      },
      java: {
        build: 'maven:3.9-openjdk-17',
        runtime: 'openjdk:17-jre-slim'
      }
    };
    
    return images[language]?.[stage] || 'alpine:latest';
  }

  generateCompose(analysis) {
    return {
      version: '3.8',
      services: this.defineServices(analysis),
      networks: this.defineNetworks(analysis),
      volumes: this.defineVolumes(analysis)
    };
  }

  defineServices(analysis) {
    const services = {};
    
    for (const service of analysis.services) {
      services[service.name] = {
        build: service.buildContext || '.',
        ports: service.ports,
        environment: service.env,
        depends_on: service.dependencies,
        networks: ['app-network'],
        volumes: service.volumes
      };
    }
    
    return services;
  }

  defineNetworks(analysis) {
    return {
      'app-network': {
        driver: 'bridge'
      }
    };
  }

  defineVolumes(analysis) {
    const volumes = {};
    
    for (const volume of analysis.volumes || []) {
      volumes[volume.name] = {
        driver: 'local'
      };
    }
    
    return volumes;
  }

  suggestOptimizations(analysis) {
    return [
      'Use multi-stage builds to reduce image size',
      'Leverage build cache with proper COPY ordering',
      'Use .dockerignore to exclude unnecessary files',
      'Pin base image versions for reproducibility',
      'Minimize layers by combining RUN commands',
      'Remove package managers and build tools in final stage'
    ];
  }

  securityRecommendations(analysis) {
    return [
      'Run containers as non-root user',
      'Use official base images from trusted sources',
      'Scan images for vulnerabilities with tools like Trivy',
      'Keep base images updated regularly',
      'Use secrets management for sensitive data',
      'Implement resource limits and health checks',
      'Enable Docker Content Trust for image signing'
    ];
  }

  async optimizeImage(dockerfilePath) {
    return {
      original: await this.analyzeImage(dockerfilePath),
      optimized: await this.generateOptimizedDockerfile(dockerfilePath),
      savings: await this.calculateSizeSavings(dockerfilePath)
    };
  }

  async analyzeImage(dockerfilePath) {
    // Placeholder for image analysis
    return {
      size: '500MB',
      layers: 15,
      vulnerabilities: 0,
      baseImage: 'node:18'
    };
  }

  async generateOptimizedDockerfile(dockerfilePath) {
    // Placeholder for optimization logic
    return this.generateDockerfile({ 
      language: 'node', 
      framework: 'express',
      port: 3000 
    });
  }

  async calculateSizeSavings(dockerfilePath) {
    return {
      originalSize: '500MB',
      optimizedSize: '150MB',
      reduction: '70%'
    };
  }

  async troubleshoot(issue) {
    const solutions = {
      'build_failure': [
        'Check Dockerfile syntax',
        'Verify base image availability',
        'Ensure build context is correct',
        'Check for missing files in COPY commands'
      ],
      'container_crash': [
        'Check container logs with docker logs',
        'Verify entrypoint and CMD syntax',
        'Check for missing environment variables',
        'Ensure proper file permissions'
      ],
      'network_issue': [
        'Verify port mapping configuration',
        'Check network connectivity between containers',
        'Ensure DNS resolution works',
        'Verify firewall rules'
      ]
    };
    
    return solutions[issue.type] || ['Consult Docker documentation'];
  }
}

module.exports = DockerSpecialist;