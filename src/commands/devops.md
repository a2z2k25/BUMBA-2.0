# DevOps Operations Command

Execute comprehensive DevOps operations using Docker, Oracle, and DigitalOcean MCP servers.

## Usage
```
/bumba:devops [operation] [parameters]
```

## Available Operations

### Container Management (Docker)
- `deploy-container` - Deploy containerized applications
- `manage-compose` - Manage Docker Compose stacks
- `container-logs` - Retrieve container logs
- `health-check` - Check container health status

### Database Operations (Oracle)
- `migrate-database` - Run database migrations
- `backup-database` - Perform database backup
- `optimize-queries` - Analyze and optimize SQL queries
- `schema-management` - Manage database schemas

### Cloud Deployment (DigitalOcean)
- `deploy-app` - Deploy application to DigitalOcean
- `scale-app` - Scale application instances
- `monitor-app` - Set up application monitoring
- `manage-infrastructure` - Manage cloud infrastructure

### Orchestrated Workflows
- `full-stack-deploy` - Complete application deployment pipeline
- `ci-cd-pipeline` - Execute CI/CD workflow
- `disaster-recovery` - Implement disaster recovery procedures
- `performance-optimization` - Optimize infrastructure performance

## Examples

### Deploy a containerized application
```
/bumba:devops deploy-container --app myapp --environment production
```

### Run database migration
```
/bumba:devops migrate-database --schema APP_SCHEMA --version 2.0.0
```

### Deploy to DigitalOcean
```
/bumba:devops deploy-app --repo github.com/user/repo --region nyc3
```

### Execute full stack deployment
```
/bumba:devops full-stack-deploy --project ecommerce --environment staging
```

## Workflow Automation

The DevOps command automatically orchestrates multiple MCP servers to achieve complex operations:

1. **Container Deployment Pipeline**
   - Build Docker images
   - Run automated tests
   - Push to registry
   - Deploy to production

2. **Database Migration Workflow**
   - Backup current schema
   - Validate migration scripts
   - Execute migrations
   - Verify data integrity

3. **Cloud Deployment Process**
   - Create cloud resources
   - Configure application
   - Deploy from GitHub
   - Set up monitoring

## Monitoring & Alerts

Automatic monitoring setup includes:
- Container resource usage
- Database performance metrics
- Application health checks
- Deployment status tracking
- Alert configuration for anomalies

## Security & Compliance

All DevOps operations include:
- Security scanning of containers
- Database access control
- Encrypted secrets management
- Compliance validation
- Audit logging

## Integration with CI/CD

Seamlessly integrates with:
- GitHub Actions
- GitLab CI
- Jenkins
- ArgoCD
- CircleCI

## Best Practices

The command enforces DevOps best practices:
- Infrastructure as Code
- GitOps workflows
- Blue-green deployments
- Automated rollbacks
- Comprehensive logging