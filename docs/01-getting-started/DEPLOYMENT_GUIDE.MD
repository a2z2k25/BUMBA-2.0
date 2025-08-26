# 🟢 BUMBA Production Deployment Guide

## Overview

This guide covers deploying BUMBA with parallel safety systems in production environments. It includes configuration, monitoring, performance optimization, and operational best practices.

## Table of Contents

- [System Requirements](#system-requirements)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Installation & Configuration](#installation--configuration)
- [Parallel Safety Configuration](#parallel-safety-configuration)
- [Monitoring & Alerting](#monitoring--alerting)
- [Performance Tuning](#performance-tuning)
- [Security Considerations](#security-considerations)
- [Operational Procedures](#operational-procedures)
- [Troubleshooting](#troubleshooting)
- [Scaling & High Availability](#scaling--high-availability)

---

## System Requirements

### Hardware Requirements

**Minimum Requirements**:
- **CPU**: 2 cores, 2.0GHz
- **Memory**: 4GB RAM
- **Storage**: 10GB available disk space
- **Network**: 100Mbps connection

**Recommended for Production**:
- **CPU**: 8+ cores, 3.0GHz+ 
- **Memory**: 16GB+ RAM
- **Storage**: 100GB+ SSD with high IOPS
- **Network**: 1Gbps+ connection with low latency

**Enterprise/High-Load Requirements**:
- **CPU**: 16+ cores, 3.5GHz+
- **Memory**: 32GB+ RAM
- **Storage**: NVMe SSD with 10K+ IOPS
- **Network**: 10Gbps+ with redundancy

### Software Requirements

**Operating System**:
- Linux (Ubuntu 20.04+ LTS, RHEL 8+, CentOS 8+)
- macOS 12+ (development only)
- Windows 10+ with WSL2 (development only)

**Node.js**:
- **Version**: Node.js 16.x or higher
- **Recommended**: Node.js 18.x LTS or 20.x LTS
- **Package Manager**: npm 8+ or yarn 3+

**Database (Optional)**:
- MongoDB 4.4+ (for persistent memory)
- PostgreSQL 13+ (for analytics)

**Additional Dependencies**:
- Git 2.30+
- Docker 20.10+ (for containerized deployment)
- Kubernetes 1.23+ (for orchestration)

---

## Pre-Deployment Checklist

### 🏁 Infrastructure Preparation

- [ ] Provision servers meeting hardware requirements
- [ ] Configure network security groups/firewalls
- [ ] Set up monitoring infrastructure (Prometheus, Grafana)
- [ ] Prepare backup storage and procedures
- [ ] Configure log aggregation (ELK, Splunk, etc.)
- [ ] Set up SSL certificates for secure communication

### 🏁 Dependencies & Services

- [ ] Install and configure Node.js with correct version
- [ ] Set up database instances if using persistent storage
- [ ] Configure reverse proxy (nginx, HAProxy)
- [ ] Set up Redis for distributed coordination (optional)
- [ ] Prepare CI/CD pipeline for deployment automation
- [ ] Configure service discovery if using microservices

### 🏁 Security & Access

- [ ] Create dedicated service accounts
- [ ] Configure API key management and rotation
- [ ] Set up VPN access for administrators  
- [ ] Configure audit logging and retention
- [ ] Implement secrets management (HashiCorp Vault, AWS Secrets Manager)
- [ ] Set up network isolation and segmentation

### 🏁 Operational Readiness

- [ ] Define SLA requirements and monitoring thresholds
- [ ] Create runbooks for common operations
- [ ] Set up alerting and escalation procedures
- [ ] Train operations team on BUMBA-specific procedures
- [ ] Prepare disaster recovery and backup procedures
- [ ] Define capacity planning and scaling triggers

---

## Installation & Configuration

### Standard Installation

```bash
# 1. Create dedicated user for BUMBA
sudo useradd -m -s /bin/bash bumba-service
sudo su - bumba-service

# 2. Install Node.js (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install BUMBA globally
npm install -g bumba

# 4. Verify installation
bumba --version
node --version

# 5. Initialize BUMBA configuration
bumba init --production
```

### Docker Installation

```dockerfile
# Dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install BUMBA
RUN npm install -g bumba

# Create non-root user
RUN addgroup -g 1001 -S bumba && \
    adduser -S bumba -u 1001

# Copy configuration
COPY bumba.config.js package*.json ./
COPY src/ ./src/

# Set permissions
RUN chown -R bumba:bumba /app
USER bumba

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('./src/core/monitoring/health-check').checkHealth().then(() => process.exit(0)).catch(() => process.exit(1))"

EXPOSE 3000
CMD ["bumba", "serve", "--production"]
```

```bash
# Build and deploy
docker build -t bumba:latest .
docker run -d \
  --name bumba-production \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY} \
  -v /var/log/bumba:/app/logs \
  -v /var/lib/bumba:/app/data \
  bumba:latest
```

### Kubernetes Deployment

```yaml
# bumba-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bumba-production
  namespace: bumba
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bumba
  template:
    metadata:
      labels:
        app: bumba
    spec:
      serviceAccountName: bumba-service
      containers:
      - name: bumba
        image: bumba:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: bumba-secrets
              key: anthropic-api-key
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 10
        volumeMounts:
        - name: config-volume
          mountPath: /app/bumba.config.js
          subPath: bumba.config.js
        - name: logs-volume
          mountPath: /app/logs
      volumes:
      - name: config-volume
        configMap:
          name: bumba-config
      - name: logs-volume
        persistentVolumeClaim:
          claimName: bumba-logs-pvc
```

---

## Parallel Safety Configuration

### Production Configuration File

Create `bumba.config.js` with production-optimized parallel safety settings:

```javascript
module.exports = {
  // Environment
  environment: 'production',
  logLevel: 'info',
  
  // Parallel execution settings
  parallel: {
    enabled: true,
    maxConcurrentAgents: 20,
    maxParallelOperations: 50,
    agentSpawnTimeout: 30000,
    enableResourcePooling: true
  },
  
  // File locking system configuration
  fileLocking: {
    enabled: true,
    defaultTimeout: 30000,        // 30 seconds
    maxTimeout: 300000,           // 5 minutes
    cleanupInterval: 60000,       // 1 minute
    maxActiveLocks: 10000,
    enablePriorityQueue: true,
    lockRetryDelay: 1000,
    maxRetries: 3
  },
  
  // Territory management configuration
  territoryManagement: {
    enabled: true,
    defaultTimeout: 60000,        // 1 minute
    maxTerritories: 1000,
    enableHierarchical: true,
    conflictResolutionStrategy: 'priority', // 'priority' | 'fifo' | 'manual'
    territoryCleanupInterval: 300000 // 5 minutes
  },
  
  // Safe file operations configuration
  safeFileOps: {
    enabled: true,
    enableBackups: true,
    backupRetentionHours: 72,     // Keep backups for 72 hours
    enableVerification: true,
    enableTransactions: true,
    maxTransactionSize: 100,      // Max files per transaction
    compressionEnabled: true,
    checksumAlgorithm: 'sha256'
  },
  
  // Agent identity system configuration
  agentIdentity: {
    enabled: true,
    maxAgents: 10000,
    cleanupInactiveAgents: true,
    inactiveTimeout: 3600000,     // 1 hour
    enableCapabilityTracking: true,
    enablePerformanceMetrics: true
  },
  
  // Coordination dashboard configuration  
  dashboard: {
    enabled: true,
    refreshInterval: 5000,        // 5 seconds
    enableAutoRefresh: false,     // Manual refresh in production
    enableWebInterface: true,
    webPort: 3001,
    enableMetricsExport: true,
    metricsEndpoint: '/metrics'
  },
  
  // Performance and resource management
  performance: {
    enableResourceMonitoring: true,
    memoryThreshold: 0.85,        // 85% memory usage alert
    cpuThreshold: 0.80,           // 80% CPU usage alert
    enableGarbageCollection: true,
    gcInterval: 300000,           // 5 minutes
    enablePerformanceAnalytics: true
  },
  
  // Security configuration
  security: {
    enableAuditLogging: true,
    auditLogLevel: 'info',
    enableAccessControl: true,
    enableRateLimiting: true,
    rateLimitRequests: 1000,      // Per hour per agent
    enableEncryption: true,
    encryptionKey: process.env.BUMBA_ENCRYPTION_KEY
  },
  
  // Monitoring and alerting
  monitoring: {
    enabled: true,
    metricsRetentionDays: 30,
    enablePrometheusMetrics: true,
    enableHealthChecks: true,
    healthCheckInterval: 30000,   // 30 seconds
    alertingThresholds: {
      conflictRate: 0.05,         // 5% conflict rate
      lockWaitTime: 10000,        // 10 second lock waits
      territoryAllocationFailures: 0.01, // 1% allocation failures
      memoryUsage: 0.85,          // 85% memory usage
      responseTime: 5000          // 5 second response time
    }
  }
};
```

### Environment Variables

```bash
# Production environment variables
export NODE_ENV=production
export BUMBA_CONFIG_PATH=/etc/bumba/bumba.config.js
export BUMBA_LOG_LEVEL=info
export BUMBA_DATA_DIR=/var/lib/bumba
export BUMBA_LOGS_DIR=/var/log/bumba

# API Keys (use secrets management in production)
export ANTHROPIC_API_KEY=your-claude-key
export OPENAI_API_KEY=your-openai-key
export GOOGLE_API_KEY=your-gemini-key

# Database connections (if using persistent storage)
export MONGODB_URL=mongodb://username:password@mongo-cluster:27017/bumba
export POSTGRES_URL=postgresql://username:password@postgres:5432/bumba_analytics

# Security
export BUMBA_ENCRYPTION_KEY=your-256-bit-encryption-key
export BUMBA_JWT_SECRET=your-jwt-secret
export BUMBA_AUDIT_LOG_RETENTION_DAYS=90

# Monitoring
export PROMETHEUS_ENDPOINT=http://prometheus:9090
export GRAFANA_ENDPOINT=http://grafana:3000
export ALERT_MANAGER_ENDPOINT=http://alertmanager:9093
```

---

## Monitoring & Alerting

### Prometheus Metrics

BUMBA exports comprehensive metrics for Prometheus monitoring:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'bumba'
    static_configs:
      - targets: ['bumba:3001']
    scrape_interval: 15s
    metrics_path: '/metrics'
```

**Key Metrics to Monitor**:

```prometheus
# File locking metrics
bumba_file_locks_active
bumba_file_locks_acquired_total
bumba_file_locks_conflicts_total
bumba_file_lock_wait_time_seconds

# Territory management metrics  
bumba_territories_active
bumba_territory_conflicts_total
bumba_territory_allocation_duration_seconds

# Agent metrics
bumba_agents_active
bumba_agents_spawned_total
bumba_agent_execution_duration_seconds

# Performance metrics
bumba_memory_usage_bytes
bumba_cpu_usage_percentage
bumba_parallel_operations_active
bumba_response_time_seconds
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "BUMBA Parallel Safety Monitoring",
    "panels": [
      {
        "title": "Active Agents",
        "type": "stat",
        "targets": [
          {
            "expr": "bumba_agents_active",
            "legendFormat": "Active Agents"
          }
        ]
      },
      {
        "title": "File Lock Conflicts",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(bumba_file_locks_conflicts_total[5m])",
            "legendFormat": "Conflict Rate"
          }
        ]
      },
      {
        "title": "Territory Utilization",
        "type": "heatmap",
        "targets": [
          {
            "expr": "bumba_territories_active",
            "legendFormat": "Active Territories"
          }
        ]
      },
      {
        "title": "System Performance",
        "type": "graph", 
        "targets": [
          {
            "expr": "bumba_memory_usage_bytes",
            "legendFormat": "Memory Usage"
          },
          {
            "expr": "bumba_cpu_usage_percentage", 
            "legendFormat": "CPU Usage"
          }
        ]
      }
    ]
  }
}
```

### Alerting Rules

```yaml
# alerting_rules.yml
groups:
  - name: bumba_safety_alerts
    rules:
      - alert: HighConflictRate
        expr: rate(bumba_file_locks_conflicts_total[5m]) > 0.05
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High file lock conflict rate detected"
          description: "File lock conflict rate is {{ $value }} which is above 5%"

      - alert: TerritoryAllocationFailures
        expr: rate(bumba_territory_allocation_failures_total[5m]) > 0.01
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "High territory allocation failure rate"
          description: "Territory allocation failures at {{ $value }} which is above 1%"

      - alert: MemoryUsageHigh
        expr: bumba_memory_usage_bytes / bumba_memory_limit_bytes > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is {{ $value | humanizePercentage }} of limit"

      - alert: AgentResponseTimeSlow
        expr: histogram_quantile(0.95, rate(bumba_agent_execution_duration_seconds_bucket[5m])) > 10
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "Slow agent response times"
          description: "95th percentile response time is {{ $value }}s"

      - alert: ParallelSafetySystemDown
        expr: up{job="bumba"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "BUMBA parallel safety system is down"
          description: "BUMBA instance {{ $labels.instance }} is not responding"
```

### Health Check Endpoint

BUMBA provides comprehensive health check endpoints:

```javascript
// Health check implementation
app.get('/health', async (req, res) => {
  try {
    const health = await healthChecker.getSystemHealth();
    
    const response = {
      status: health.overall,
      timestamp: new Date().toISOString(),
      version: process.env.BUMBA_VERSION,
      components: {
        fileLocking: health.components.fileLocking,
        territoryManager: health.components.territoryManager,
        agentIdentity: health.components.agentIdentity,
        safeFileOps: health.components.safeFileOps,
        dashboard: health.components.dashboard
      },
      metrics: {
        activeAgents: health.metrics.activeAgents,
        activeLocks: health.metrics.activeLocks,
        memoryUsage: health.metrics.memoryUsage,
        cpuUsage: health.metrics.cpuUsage
      }
    };
    
    const statusCode = health.overall === 'healthy' ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

---

## Performance Tuning

### Memory Optimization

```javascript
// bumba.config.js - Memory optimization settings
module.exports = {
  performance: {
    // Node.js memory settings
    nodeOptions: [
      '--max-old-space-size=8192',  // 8GB heap for large deployments
      '--gc-interval=100',          // Garbage collection interval
      '--optimize-for-size'         // Optimize for memory usage
    ],
    
    // BUMBA-specific memory settings
    maxCachedAgents: 1000,
    maxCachedFiles: 10000,
    enableMemoryCompression: true,
    memoryCacheRetention: 3600000,  // 1 hour
    
    // File operation optimization
    fileBufferSize: 64 * 1024,      // 64KB buffer size
    enableFileStreamming: true,
    maxConcurrentFileOps: 100
  }
};
```

### CPU Optimization

```javascript
// CPU optimization settings
module.exports = {
  performance: {
    // Worker threads for CPU-intensive operations
    enableWorkerThreads: true,
    maxWorkerThreads: require('os').cpus().length,
    
    // Agent execution optimization
    agentExecutionStrategy: 'round-robin', // 'round-robin' | 'least-busy' | 'random'
    enableAgentPooling: true,
    agentPoolSize: 50,
    agentIdleTimeout: 300000,       // 5 minutes
    
    // File system optimization
    enableFileSystemCache: true,
    fileSystemCacheSize: '512MB',
    enableAsyncFileOps: true
  }
};
```

### Database Optimization (If Using Persistent Storage)

```javascript
// Database optimization for persistent memory
module.exports = {
  database: {
    mongodb: {
      connectionPoolSize: 20,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      enableCompression: true,
      compressors: ['zstd', 'zlib'],
      
      // Index optimization
      indexes: [
        { agentId: 1, timestamp: -1 },
        { status: 1, createdAt: -1 },
        { 'metadata.department': 1 }
      ]
    },
    
    // Connection pooling
    pool: {
      min: 5,
      max: 20,
      acquire: 30000,
      idle: 10000
    }
  }
};
```

### Network Optimization

```javascript
// Network and API optimization
module.exports = {
  network: {
    // HTTP/API settings
    keepAliveTimeout: 65000,
    headersTimeout: 66000,
    maxConnections: 1000,
    
    // API rate limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000,     // 15 minutes
      max: 1000,                    // limit each IP to 1000 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false
    },
    
    // Compression
    compression: {
      level: 6,                     // Balance between speed and compression
      threshold: 1024               // Only compress responses > 1KB
    }
  }
};
```

---

## Security Considerations

### Access Control & Authentication

```javascript
// Security configuration
module.exports = {
  security: {
    // Authentication
    authentication: {
      enabled: true,
      provider: 'jwt',              // 'jwt' | 'oauth' | 'ldap'
      tokenExpiration: '24h',
      refreshTokenExpiration: '7d',
      requireStrongPasswords: true
    },
    
    // Authorization
    authorization: {
      enabled: true,
      enableRBAC: true,
      defaultRole: 'viewer',
      roles: {
        admin: ['*'],
        operator: ['read', 'execute', 'monitor'],
        developer: ['read', 'execute'],
        viewer: ['read']
      }
    },
    
    // API Security
    apiSecurity: {
      enableCORS: true,
      allowedOrigins: ['https://your-domain.com'],
      enableCSRF: true,
      enableInputValidation: true,
      maxRequestSize: '10MB',
      enableSQLInjectionPrevention: true
    }
  }
};
```

### Encryption & Data Protection

```javascript
// Encryption settings
module.exports = {
  encryption: {
    // Data at rest
    enableDataEncryption: true,
    encryptionAlgorithm: 'aes-256-gcm',
    keyRotationInterval: 2592000000, // 30 days
    
    // Data in transit
    enableTLSTermination: true,
    minTLSVersion: '1.2',
    tlsCipherSuites: [
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES128-SHA256'
    ],
    
    // Secrets management
    secretsProvider: 'vault',        // 'vault' | 'k8s-secrets' | 'aws-secrets'
    vaultEndpoint: process.env.VAULT_ENDPOINT,
    enableSecretsRotation: true
  }
};
```

### Audit Logging

```javascript
// Comprehensive audit logging
module.exports = {
  auditLogging: {
    enabled: true,
    logLevel: 'info',
    destinations: ['file', 'siem', 'database'],
    
    // Log categories
    categories: {
      authentication: true,
      authorization: true,
      agentOperations: true,
      fileOperations: true,
      territoryAllocations: true,
      safetyViolations: true,
      configurationChanges: true,
      systemEvents: true
    },
    
    // Log retention
    retentionPeriod: '90d',
    compressionEnabled: true,
    enableLogRotation: true,
    maxLogSize: '100MB'
  }
};
```

---

## Operational Procedures

### Deployment Process

1. **Pre-deployment Validation**:
   ```bash
   # Validate configuration
   bumba config validate --config bumba.config.js
   
   # Run safety system tests
   npm run test:parallel-safety
   
   # Validate API keys and external dependencies
   bumba validate --check-apis --check-dependencies
   ```

2. **Zero-downtime Deployment**:
   ```bash
   # Rolling deployment script
   #!/bin/bash
   
   # Update configuration
   kubectl apply -f bumba-config.yaml
   
   # Rolling update with readiness checks
   kubectl set image deployment/bumba-production bumba=bumba:$NEW_VERSION
   kubectl rollout status deployment/bumba-production --timeout=300s
   
   # Verify deployment
   kubectl exec deployment/bumba-production -- bumba health --detailed
   
   # Run post-deployment tests
   kubectl exec deployment/bumba-production -- npm run test:integration
   ```

3. **Post-deployment Verification**:
   ```bash
   # Verify parallel safety systems
   curl -s http://bumba:3001/health | jq '.components'
   
   # Check metrics endpoint
   curl -s http://bumba:3001/metrics | grep bumba_
   
   # Validate coordination dashboard
   curl -s http://bumba:3001/dashboard/status | jq '.safe'
   ```

### Backup & Recovery

```bash
#!/bin/bash
# BUMBA backup script

BACKUP_DIR="/var/backups/bumba/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup configuration
cp -r /etc/bumba/ "$BACKUP_DIR/config/"

# Backup data (if using persistent storage)
if [ -d "/var/lib/bumba" ]; then
    tar -czf "$BACKUP_DIR/data.tar.gz" /var/lib/bumba/
fi

# Backup logs (recent)
find /var/log/bumba -name "*.log" -mtime -7 -exec cp {} "$BACKUP_DIR/logs/" \;

# Create backup manifest
cat > "$BACKUP_DIR/manifest.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "version": "$(bumba --version)",
  "components": [
    "configuration",
    "persistent_data",
    "recent_logs"
  ],
  "size_bytes": $(du -sb "$BACKUP_DIR" | cut -f1)
}
EOF

echo "Backup completed: $BACKUP_DIR"
```

### Monitoring & Maintenance

```bash
#!/bin/bash
# Daily maintenance script

# Check system health
echo "Checking BUMBA health..."
health_status=$(curl -s http://localhost:3001/health | jq -r '.status')

if [ "$health_status" != "healthy" ]; then
    echo "ALERT: BUMBA health check failed"
    curl -s http://localhost:3001/health | jq '.components' | \
        while read component; do
            echo "Component status: $component"
        done
fi

# Check coordination safety
echo "Checking parallel safety systems..."
safety_report=$(curl -s http://localhost:3001/dashboard/safety | jq -r '.safe')

if [ "$safety_report" != "true" ]; then
    echo "ALERT: Safety violations detected"
    curl -s http://localhost:3001/dashboard/safety | jq '.issues[]'
fi

# Cleanup old logs and backups
find /var/log/bumba -name "*.log" -mtime +30 -delete
find /var/backups/bumba -type d -mtime +90 -exec rm -rf {} +

# Performance optimization
echo "Running performance optimization..."
curl -X POST http://localhost:3001/admin/optimize

echo "Maintenance completed: $(date)"
```

---

## Troubleshooting

### Common Issues

**High File Lock Contention**:
```bash
# Diagnosis
curl -s http://localhost:3001/metrics | grep bumba_file_locks_conflicts_total

# Check active locks
curl -s http://localhost:3001/dashboard/status | jq '.locks'

# Solutions
# 1. Reduce agent overlap in file access patterns
# 2. Increase lock timeout values
# 3. Implement file access coordination at application level
```

**Territory Allocation Failures**:
```bash
# Diagnosis
curl -s http://localhost:3001/dashboard/status | jq '.territories'

# Check conflict patterns
curl -s http://localhost:3001/admin/territory-analysis

# Solutions
# 1. Review agent task distribution
# 2. Implement territory sharing for read-only operations
# 3. Use hierarchical territories for related tasks
```

**Memory Leaks**:
```bash
# Monitor memory usage
curl -s http://localhost:3001/metrics | grep bumba_memory_usage_bytes

# Get memory analysis
curl -s http://localhost:3001/admin/memory-analysis

# Force garbage collection
curl -X POST http://localhost:3001/admin/gc

# Solutions
# 1. Enable memory compression
# 2. Reduce agent pool size
# 3. Implement more aggressive cleanup policies
```

**Performance Degradation**:
```bash
# Check performance metrics
curl -s http://localhost:3001/metrics | grep bumba_response_time_seconds

# Get performance analysis
curl -s http://localhost:3001/admin/performance-analysis

# Solutions
# 1. Scale horizontally by adding more instances
# 2. Optimize database queries and indexing
# 3. Enable caching for frequently accessed data
```

### Debug Commands

```bash
# Comprehensive system diagnosis
bumba diagnose --detailed --output-format json > diagnosis.json

# Parallel safety system status
bumba parallel-safety status --verbose

# Agent activity analysis
bumba agents list --active --with-performance

# File system analysis
bumba filesystem analyze --check-conflicts --check-performance

# Configuration validation
bumba config validate --strict --check-security

# Performance profiling
bumba profile --duration 60s --include-parallel-ops
```

---

## Scaling & High Availability

### Horizontal Scaling

```yaml
# Kubernetes horizontal pod autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: bumba-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: bumba-production
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: bumba_parallel_operations_active
      target:
        type: AverageValue
        averageValue: "50"
```

### Load Balancing

```nginx
# nginx.conf - Load balancer configuration
upstream bumba_backend {
    least_conn;
    server bumba-1:3000 max_fails=3 fail_timeout=30s;
    server bumba-2:3000 max_fails=3 fail_timeout=30s;
    server bumba-3:3000 max_fails=3 fail_timeout=30s;
    
    # Health check
    health_check interval=10s fails=3 passes=2;
}

server {
    listen 80;
    server_name bumba.production.com;
    
    location / {
        proxy_pass http://bumba_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Health check
        location /health {
            access_log off;
            proxy_pass http://bumba_backend/health;
        }
    }
}
```

### High Availability Architecture

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │    (nginx)      │
                    └─────────┬───────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
    ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
    │   BUMBA-1   │    │   BUMBA-2   │    │   BUMBA-3   │
    │ (Primary)   │    │ (Secondary) │    │ (Secondary) │
    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
           │                  │                  │
           └──────────────────┼──────────────────┘
                              │
                    ┌─────────▼───────────┐
                    │  Shared Storage     │
                    │  (Redis Cluster)    │
                    │  - File Locks       │
                    │  - Territory Info   │
                    │  - Agent Registry   │
                    └─────────────────────┘
```

### Disaster Recovery

```bash
#!/bin/bash
# Disaster recovery script

echo "Initiating BUMBA disaster recovery..."

# 1. Stop all BUMBA instances
kubectl scale deployment bumba-production --replicas=0

# 2. Restore from backup
LATEST_BACKUP=$(find /var/backups/bumba -type d -name "????????_??????" | sort -r | head -n1)
echo "Restoring from: $LATEST_BACKUP"

# Restore configuration
cp -r "$LATEST_BACKUP/config/"* /etc/bumba/

# Restore data
if [ -f "$LATEST_BACKUP/data.tar.gz" ]; then
    tar -xzf "$LATEST_BACKUP/data.tar.gz" -C /
fi

# 3. Validate configuration
bumba config validate --config /etc/bumba/bumba.config.js

# 4. Start single instance for validation
kubectl scale deployment bumba-production --replicas=1
kubectl wait --for=condition=available --timeout=300s deployment/bumba-production

# 5. Run system validation
kubectl exec deployment/bumba-production -- bumba parallel-safety validate

# 6. Scale to full capacity
kubectl scale deployment bumba-production --replicas=3
kubectl wait --for=condition=available --timeout=300s deployment/bumba-production

# 7. Verify full system health
kubectl exec deployment/bumba-production -- curl -s localhost:3001/health

echo "Disaster recovery completed: $(date)"
```

---

This comprehensive deployment guide ensures that BUMBA's parallel safety systems are properly configured, monitored, and maintained in production environments. Following these guidelines will result in a robust, scalable, and secure deployment capable of handling enterprise workloads while maintaining the safety and integrity guarantees that make parallel agent execution possible.