# BUMBA Deployment Guide

## Production Deployment

### Prerequisites

- Node.js 18+ 
- 512MB RAM minimum (9MB typical usage)
- No external dependencies required

### Basic Deployment

```bash
# 1. Install dependencies
npm ci --production

# 2. Set environment
export NODE_ENV=production
export BUMBA_OFFLINE=true
export LOG_LEVEL=ERROR

# 3. Start
npm start
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --production

# Copy framework
COPY . .

# Set environment
ENV NODE_ENV=production
ENV BUMBA_FAST_START=true
ENV BUMBA_OFFLINE=true
ENV LOG_LEVEL=ERROR

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('./src/index')" || exit 1

# Start
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t bumba:latest .
docker run -d --name bumba -p 3000:3000 bumba:latest
```

### Kubernetes Deployment

```yaml
# bumba-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bumba
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
      containers:
      - name: bumba
        image: bumba:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: BUMBA_OFFLINE
          value: "true"
        - name: LOG_LEVEL
          value: "ERROR"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
```

### PM2 Deployment

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'bumba',
    script: './src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      BUMBA_OFFLINE: 'true',
      BUMBA_FAST_START: 'true',
      LOG_LEVEL: 'ERROR'
    },
    max_memory_restart: '500M',
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_file: './logs/combined.log'
  }]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Serverless Deployment

```javascript
// serverless.yml
service: bumba-framework

provider:
  name: aws
  runtime: nodejs18.x
  memorySize: 256
  timeout: 30
  environment:
    NODE_ENV: production
    BUMBA_OFFLINE: true
    BUMBA_FAST_START: true
    LOG_LEVEL: ERROR

functions:
  api:
    handler: handler.main
    events:
      - http:
          path: /{proxy+}
          method: ANY

// handler.js
const bumba = require('bumba-framework');

exports.main = async (event) => {
  const result = await bumba.execute(event.body);
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
};
```

## Configuration

### Environment Variables

| Variable | Production Value | Description |
|----------|-----------------|-------------|
| `NODE_ENV` | production | Enable production optimizations |
| `BUMBA_OFFLINE` | true | Privacy-first, no external calls |
| `BUMBA_FAST_START` | true | 19ms startup |
| `LOG_LEVEL` | ERROR | Minimal logging |
| `MAX_POOL_SIZE` | 20 | Increase for high load |
| `MEMORY_THRESHOLD` | 200 | MB before cleanup |

### Security

```bash
# Use secrets management
export OPENAI_API_KEY=$(vault kv get -field=key secret/openai)
export ANTHROPIC_API_KEY=$(vault kv get -field=key secret/anthropic)

# Run as non-root user
useradd -m bumba
su - bumba
```

### Monitoring

```javascript
// Health endpoint
app.get('/health', async (req, res) => {
  const health = await bumba.runHealthCheck();
  res.json({
    status: health.all ? 'healthy' : 'degraded',
    checks: health
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  const metrics = {
    memory: process.memoryUsage(),
    cache: bumba.getCacheStats(),
    pool: bumba.getPoolStats()
  };
  res.json(metrics);
});
```

### Scaling

#### Horizontal Scaling
- Stateless design allows unlimited instances
- No shared state between instances
- Load balance with any method

#### Vertical Scaling
- Increase `MAX_POOL_SIZE` for more specialists
- Adjust `MEMORY_THRESHOLD` for larger deployments
- Framework efficiently uses available resources

### Performance Tuning

```bash
# For high throughput
export MAX_POOL_SIZE=50
export MEMORY_THRESHOLD=500
export CACHE_TTL=600000  # 10 minutes

# For low latency
export BUMBA_FAST_START=true
export MAX_POOL_SIZE=10
export CACHE_TTL=300000  # 5 minutes

# For minimal resources
export MAX_POOL_SIZE=5
export MEMORY_THRESHOLD=50
export LOG_LEVEL=SILENT
```

## Troubleshooting Production

### High Memory Usage
```bash
# Check memory stats
node -e "console.log(require('bumba-framework').getMemoryStats())"

# Force cleanup
node -e "require('bumba-framework').forceCleanup()"
```

### Slow Response Times
```bash
# Check cache performance
node -e "console.log(require('bumba-framework').getCacheStats())"

# Warm up cache
node -e "require('bumba-framework').warmCache()"
```

### Connection Issues
```bash
# Verify offline mode
export BUMBA_OFFLINE=true

# Test without external deps
node test-performance.js
```

## Rollback Procedures

```bash
# Keep previous version
cp -r /app/bumba /app/bumba.backup

# Deploy new version
# ...

# If issues, rollback
mv /app/bumba /app/bumba.failed
mv /app/bumba.backup /app/bumba
pm2 restart bumba
```

## Support

- 📧 Production support: enterprise@bumba.ai
- 📚 Documentation: https://docs.bumba.ai
- 💬 Discord: https://discord.gg/bumba

---

**Deploy with confidence. BUMBA is production-tested and ready.** 🚀