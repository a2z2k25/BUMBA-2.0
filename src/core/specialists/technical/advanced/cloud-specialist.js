const UnifiedSpecialistBase = require('../../unified-specialist-base');
/**
 * BUMBA Cloud Specialist
 * Expert in cloud architecture, DevOps, and multi-cloud strategies
 */

const SpecialistBase = require('../../specialist-base');

class CloudSpecialist extends UnifiedSpecialistBase {
  constructor() {
    super({
      name: 'Cloud Specialist',
      expertise: ['AWS', 'Azure', 'GCP', 'Cloud Architecture', 'Kubernetes', 'Terraform', 'DevOps', 'Microservices'],
      models: ['claude-3-opus-20240229', 'gpt-4'],
      temperature: 0.3,
      systemPrompt: `You are a cloud architecture expert specializing in:
        - Multi-cloud and hybrid cloud strategies
        - Infrastructure as Code (IaC) with Terraform, CloudFormation
        - Container orchestration with Kubernetes and Docker
        - Serverless architectures and functions
        - Cloud security, compliance, and governance
        - Cost optimization and resource management
        - CI/CD pipelines and DevOps automation
        - Monitoring, logging, and observability
        Always prioritize scalability, security, and cost-effectiveness.`
    });

    this.capabilities = {
      architecture: true,
      automation: true,
      security: true,
      monitoring: true,
      optimization: true,
      migration: true,
      compliance: true,
      multiCloud: true
    };
  }

  async designCloudArchitecture(context) {
    const analysis = await this.analyze(context);
    
    return {
      architecture: this.createCloudArchitecture(analysis),
      infrastructure: this.designInfrastructure(analysis),
      deployment: this.setupDeploymentPipeline(analysis),
      monitoring: this.implementMonitoring(analysis)
    };
  }

  createCloudArchitecture(analysis) {
    return `# Cloud Architecture Design for ${analysis.projectName || 'Application'}

## Architecture Overview

### High-Level Design
\`\`\`
                    ┌─────────────────┐
                    │   Load Balancer │
                    │   (ALB/NLB)     │
                    └─────────┬───────┘
                              │
                    ┌─────────▼───────┐
                    │   API Gateway   │
                    │   (Rate Limiting)│
                    └─────────┬───────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
        ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
        │   Web     │  │   API     │  │  Worker   │
        │ Services  │  │ Services  │  │ Services  │
        │(ECS/EKS)  │  │(ECS/EKS)  │  │(ECS/EKS)  │
        └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
              │               │               │
        ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
        │   Cache   │  │ Database  │  │   Queue   │
        │  (Redis)  │  │(RDS/DDB)  │  │   (SQS)   │
        └───────────┘  └───────────┘  └───────────┘
\`\`\`

## Multi-Cloud Strategy

### Primary Cloud (AWS)
**Use Cases**: Production workloads, primary data storage, core services
**Services**:
- **Compute**: EC2, ECS, EKS, Lambda
- **Storage**: S3, EBS, EFS
- **Database**: RDS, DynamoDB, ElastiCache
- **Networking**: VPC, CloudFront, Route 53
- **Security**: IAM, WAF, Shield, GuardDuty

### Secondary Cloud (Azure)
**Use Cases**: Disaster recovery, development environments, specific Azure services
**Services**:
- **Compute**: Azure VMs, Container Instances, Functions
- **Storage**: Blob Storage, Azure Files
- **Database**: Azure SQL, Cosmos DB
- **Networking**: Virtual Network, CDN, Traffic Manager
- **Security**: Active Directory, Key Vault

### Hybrid Integration
**Use Cases**: On-premises integration, legacy system connectivity
**Components**:
- **Connectivity**: AWS Direct Connect, Azure ExpressRoute
- **Identity**: Federation with on-premises AD
- **Data Sync**: AWS DataSync, Azure File Sync
- **Monitoring**: Unified monitoring across environments

## Microservices Architecture

### Service Decomposition
\`\`\`javascript
// services/user-service/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── services/
│   └── utils/
├── tests/
├── Dockerfile
├── k8s/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── configmap.yaml
└── package.json

// API Gateway Configuration
const apiGatewayConfig = {
  routes: [
    {
      path: '/api/users/*',
      target: 'user-service:3001',
      auth: 'jwt',
      rateLimit: { rpm: 1000 }
    },
    {
      path: '/api/orders/*',
      target: 'order-service:3002',
      auth: 'jwt',
      rateLimit: { rpm: 500 }
    }
  ],
  middleware: [
    'cors',
    'compression',
    'logging',
    'errorHandling'
  ]
};
\`\`\`

### Service Communication
\`\`\`javascript
// Event-driven communication
const eventBus = {
  async publishEvent(eventType, payload) {
    await sns.publish({
      TopicArn: process.env.EVENT_TOPIC_ARN,
      Message: JSON.stringify({
        eventType,
        payload,
        timestamp: new Date().toISOString(),
        source: process.env.SERVICE_NAME
      })
    }).promise();
  },

  async subscribeToEvents(eventTypes, handler) {
    const subscription = await sqs.receiveMessage({
      QueueUrl: process.env.EVENT_QUEUE_URL,
      MessageAttributeNames: ['eventType']
    }).promise();

    if (subscription.Messages) {
      for (const message of subscription.Messages) {
        const event = JSON.parse(message.Body);
        if (eventTypes.includes(event.eventType)) {
          await handler(event);
          await this.acknowledgeMessage(message.ReceiptHandle);
        }
      }
    }
  }
};
\`\`\`

## Serverless Components

### Lambda Functions
\`\`\`javascript
// Image processing function
const sharp = require('sharp');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
  try {
    const { bucket, key } = event.Records[0].s3;
    
    // Download original image
    const originalImage = await s3.getObject({
      Bucket: bucket.name,
      Key: key
    }).promise();
    
    // Process image (resize, optimize)
    const processedImage = await sharp(originalImage.Body)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    
    // Upload processed image
    await s3.putObject({
      Bucket: 'processed-images-bucket',
      Key: \`processed/\${key}\`,
      Body: processedImage,
      ContentType: 'image/jpeg'
    }).promise();
    
    return { statusCode: 200, body: 'Image processed successfully' };
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};
\`\`\`

### API Gateway + Lambda Integration
\`\`\`yaml
# serverless.yml
service: api-service

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    DATABASE_URL: \${env:DATABASE_URL}
    REDIS_URL: \${env:REDIS_URL}

functions:
  getUserProfile:
    handler: handlers/users.getProfile
    events:
      - http:
          path: /users/{id}
          method: get
          cors: true
          authorizer: auth
  
  updateUserProfile:
    handler: handlers/users.updateProfile
    events:
      - http:
          path: /users/{id}
          method: put
          cors: true
          authorizer: auth

  processImageUpload:
    handler: handlers/images.process
    events:
      - s3:
          bucket: user-uploads
          event: s3:ObjectCreated:*
          rules:
            - suffix: .jpg
            - suffix: .png
\`\`\`

## Container Orchestration

### Kubernetes Deployment
\`\`\`yaml
# user-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  labels:
    app: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: your-registry/user-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: user-service
spec:
  selector:
    app: user-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: user-service-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    secretName: api-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /api/users
        pathType: Prefix
        backend:
          service:
            name: user-service
            port:
              number: 80
\`\`\`

### Helm Chart Structure
\`\`\`
charts/user-service/
├── Chart.yaml
├── values.yaml
├── values-prod.yaml
├── values-staging.yaml
└── templates/
    ├── deployment.yaml
    ├── service.yaml
    ├── ingress.yaml
    ├── configmap.yaml
    ├── secret.yaml
    └── hpa.yaml
\`\`\`

## Security Framework

### IAM and Access Control
\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT:role/EKSNodeInstanceRole"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::app-bucket/*",
      "Condition": {
        "StringEquals": {
          "s3:ExistingObjectTag/Environment": "production"
        }
      }
    }
  ]
}
\`\`\`

### Network Security
\`\`\`yaml
# Network Policies
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: user-service-policy
spec:
  podSelector:
    matchLabels:
      app: user-service
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api-gateway
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: 5432
\`\`\`

### Secrets Management
\`\`\`javascript
// AWS Secrets Manager integration
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

class SecretManager {
  static async getSecret(secretName) {
    try {
      const result = await secretsManager.getSecretValue({
        SecretId: secretName
      }).promise();
      
      return JSON.parse(result.SecretString);
    } catch (error) {
      console.error('Error retrieving secret:', error);
      throw error;
    }
  }

  static async rotateSecret(secretName, newValue) {
    await secretsManager.putSecretValue({
      SecretId: secretName,
      SecretString: JSON.stringify(newValue)
    }).promise();
  }
}

// Usage in application
const dbCredentials = await SecretManager.getSecret('prod/database/credentials');
\`\`\`

## Cost Optimization

### Resource Tagging Strategy
\`\`\`javascript
const resourceTags = {
  Environment: 'production',
  Project: 'user-management',
  Team: 'backend',
  CostCenter: 'engineering',
  Owner: 'john.doe@company.com',
  AutoShutdown: 'enabled'
};

// Auto-scaling configuration
const autoScalingConfig = {
  minCapacity: 2,
  maxCapacity: 20,
  targetCPUUtilization: 70,
  scaleUpCooldown: 300,
  scaleDownCooldown: 300
};
\`\`\`

### Spot Instance Strategy
\`\`\`yaml
# EKS Node Group with Spot Instances
apiVersion: v1
kind: ConfigMap
metadata:
  name: spot-instance-config
data:
  nodegroup.yaml: |
    apiVersion: eksctl.io/v1alpha5
    kind: ClusterConfig
    nodeGroups:
    - name: spot-workers
      instanceTypes: ["m5.large", "m5.xlarge", "m4.large"]
      spot: true
      minSize: 1
      maxSize: 10
      desiredCapacity: 3
      taints:
        spot: "true:NoSchedule"
      tags:
        Environment: production
        NodeType: spot
\`\`\`

This cloud architecture provides:
- Scalable, resilient multi-cloud design
- Comprehensive security and compliance
- Cost-optimized resource utilization
- Modern DevOps and automation practices
- Production-ready monitoring and observability`;
  }

  designInfrastructure(analysis) {
    return `# Infrastructure as Code Implementation

## Terraform Configuration

### Main Infrastructure
\`\`\`hcl
# main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.16"
    }
  }
  
  backend "s3" {
    bucket         = "terraform-state-bucket"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "terraform"
    }
  }
}

# VPC Module
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "\${var.project_name}-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["\${var.aws_region}a", "\${var.aws_region}b", "\${var.aws_region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = true
  enable_dns_hostnames = true
  enable_dns_support = true
  
  tags = {
    "kubernetes.io/cluster/\${var.cluster_name}" = "shared"
  }
  
  public_subnet_tags = {
    "kubernetes.io/cluster/\${var.cluster_name}" = "shared"
    "kubernetes.io/role/elb"                      = "1"
  }
  
  private_subnet_tags = {
    "kubernetes.io/cluster/\${var.cluster_name}" = "shared"
    "kubernetes.io/role/internal-elb"             = "1"
  }
}

# EKS Cluster
module "eks" {
  source = "terraform-aws-modules/eks/aws"
  
  cluster_name    = var.cluster_name
  cluster_version = "1.27"
  
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets
  control_plane_subnet_ids = module.vpc.private_subnets
  
  # Cluster access
  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true
  cluster_endpoint_public_access_cidrs = ["0.0.0.0/0"]
  
  # OIDC Identity provider
  cluster_identity_providers = {
    sts = {
      client_id = "sts.amazonaws.com"
    }
  }
  
  # Managed node groups
  eks_managed_node_groups = {
    general = {
      desired_size = 3
      max_size     = 10
      min_size     = 1
      
      instance_types = ["m5.large"]
      capacity_type  = "ON_DEMAND"
      
      k8s_labels = {
        Environment = var.environment
        NodeGroup   = "general"
      }
      
      update_config = {
        max_unavailable_percentage = 25
      }
    }
    
    spot = {
      desired_size = 2
      max_size     = 8
      min_size     = 0
      
      instance_types = ["m5.large", "m5.xlarge", "m4.large"]
      capacity_type  = "SPOT"
      
      k8s_labels = {
        Environment = var.environment
        NodeGroup   = "spot"
      }
      
      taints = {
        spot = {
          key    = "spot"
          value  = "true"
          effect = "NO_SCHEDULE"
        }
      }
    }
  }
  
  # aws-auth configmap
  manage_aws_auth_configmap = true
  aws_auth_roles = [
    {
      rolearn  = "arn:aws:iam::\${data.aws_caller_identity.current.account_id}:role/EKSAdminRole"
      username = "admin"
      groups   = ["system:masters"]
    }
  ]
}

# RDS Database
resource "aws_db_subnet_group" "main" {
  name       = "\${var.project_name}-db-subnet-group"
  subnet_ids = module.vpc.private_subnets
  
  tags = {
    Name = "\${var.project_name} DB subnet group"
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "\${var.project_name}-rds-"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [module.eks.cluster_security_group_id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "main" {
  identifier = "\${var.project_name}-db"
  
  engine         = "postgres"
  engine_version = "15.3"
  instance_class = var.db_instance_class
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  
  db_name  = var.database_name
  username = var.database_username
  password = var.database_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = var.environment != "production"
  deletion_protection = var.environment == "production"
  
  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn        = aws_iam_role.rds_monitoring.arn
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "main" {
  name       = "\${var.project_name}-cache-subnet"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_security_group" "redis" {
  name_prefix = "\${var.project_name}-redis-"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [module.eks.cluster_security_group_id]
  }
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "\${var.project_name}-redis"
  description                = "Redis cluster for \${var.project_name}"
  
  node_type                  = "cache.t3.micro"
  port                       = 6379
  parameter_group_name       = "default.redis7"
  
  num_cache_clusters         = 2
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  subnet_group_name = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                = var.redis_auth_token
  
  snapshot_retention_limit = 5
  snapshot_window         = "03:00-05:00"
}
\`\`\`

### Variables Configuration
\`\`\`hcl
# variables.tf
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "database_name" {
  description = "Database name"
  type        = string
}

variable "database_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "database_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "redis_auth_token" {
  description = "Redis AUTH token"
  type        = string
  sensitive   = true
}
\`\`\`

### Environment-Specific Configuration
\`\`\`hcl
# environments/production.tfvars
environment = "production"
project_name = "myapp"
cluster_name = "myapp-prod-cluster"

# Instance sizing for production
db_instance_class = "db.r5.large"

# Database configuration
database_name = "myapp_prod"
database_username = "app_user"
# database_password set via TF_VAR_database_password

# Redis configuration  
# redis_auth_token set via TF_VAR_redis_auth_token
\`\`\`

## CloudFormation Templates

### API Gateway + Lambda Stack
\`\`\`yaml
# api-gateway-stack.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: 'API Gateway and Lambda functions stack'

Parameters:
  Environment:
    Type: String
    AllowedValues: [dev, staging, production]
    Default: dev
  
  DatabaseUrl:
    Type: String
    NoEcho: true
    Description: Database connection string

Globals:
  Function:
    Runtime: nodejs18.x
    Timeout: 30
    MemorySize: 256
    Environment:
      Variables:
        NODE_ENV: !Ref Environment
        DATABASE_URL: !Ref DatabaseUrl

Resources:
  # API Gateway
  ApiGateway:
    Type: AWS::Serverless::Api
    Properties:
      StageName: !Ref Environment
      Cors:
        AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
        AllowHeaders: "'Content-Type,Authorization'"
        AllowOrigin: "'*'"
      Auth:
        DefaultAuthorizer: CognitoAuthorizer
        Authorizers:
          CognitoAuthorizer:
            UserPoolArn: !GetAtt UserPool.Arn
      RequestValidators:
        RequestValidator:
          ValidateRequestParameters: true
          ValidateRequestBody: true

  # Lambda Functions
  GetUsersFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/handlers/users/
      Handler: getUsers.handler
      Events:
        GetUsers:
          Type: Api
          Properties:
            RestApiId: !Ref ApiGateway
            Path: /users
            Method: get
            Auth:
              Authorizer: CognitoAuthorizer

  CreateUserFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/handlers/users/
      Handler: createUser.handler
      Events:
        CreateUser:
          Type: Api
          Properties:
            RestApiId: !Ref ApiGateway
            Path: /users
            Method: post
            Auth:
              Authorizer: CognitoAuthorizer
            RequestValidators: [RequestValidator]

  # Cognito User Pool
  UserPool:
    Type: AWS::Cognito::UserPool
    Properties:
      UserPoolName: !Sub '\${AWS::StackName}-user-pool'
      Policies:
        PasswordPolicy:
          MinimumLength: 8
          RequireUppercase: true
          RequireLowercase: true
          RequireNumbers: true
          RequireSymbols: false
      Schema:
        - Name: email
          AttributeDataType: String
          Required: true
          Mutable: true

  UserPoolClient:
    Type: AWS::Cognito::UserPoolClient
    Properties:
      UserPoolId: !Ref UserPool
      ClientName: !Sub '\${AWS::StackName}-client'
      GenerateSecret: false
      ExplicitAuthFlows:
        - ADMIN_NO_SRP_AUTH
        - USER_PASSWORD_AUTH

Outputs:
  ApiUrl:
    Description: 'API Gateway endpoint URL'
    Value: !Sub 'https://\${ApiGateway}.execute-api.\${AWS::Region}.amazonaws.com/\${Environment}'
    Export:
      Name: !Sub '\${AWS::StackName}-ApiUrl'

  UserPoolId:
    Description: 'Cognito User Pool ID'
    Value: !Ref UserPool
    Export:
      Name: !Sub '\${AWS::StackName}-UserPoolId'
\`\`\`

## Infrastructure Monitoring

### CloudWatch Dashboards
\`\`\`json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/EKS", "cluster_node_count", "ClusterName", "myapp-cluster"],
          ["AWS/EKS", "cluster_failed_request_count", "ClusterName", "myapp-cluster"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "EKS Cluster Metrics"
      }
    },
    {
      "type": "metric", 
      "properties": {
        "metrics": [
          ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "myapp-db"],
          ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", "myapp-db"],
          ["AWS/RDS", "ReadLatency", "DBInstanceIdentifier", "myapp-db"],
          ["AWS/RDS", "WriteLatency", "DBInstanceIdentifier", "myapp-db"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "RDS Performance"
      }
    }
  ]
}
\`\`\`

### Infrastructure Alerts
\`\`\`hcl
# cloudwatch-alarms.tf
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "\${var.project_name}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EKS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors eks cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = var.cluster_name
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "\${var.project_name}-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
}

resource "aws_sns_topic" "alerts" {
  name = "\${var.project_name}-alerts"
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}
\`\`\`

This infrastructure provides:
- Scalable, secure cloud architecture
- Infrastructure as Code best practices
- Comprehensive monitoring and alerting
- Multi-environment support
- Cost optimization strategies`;
  }

  setupDeploymentPipeline(analysis) {
    return `# CI/CD Deployment Pipeline

## GitHub Actions Workflow

### Complete CI/CD Pipeline
\`\`\`yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  AWS_REGION: us-east-1
  EKS_CLUSTER_NAME: myapp-cluster
  ECR_REGISTRY: 123456789012.dkr.ecr.us-east-1.amazonaws.com

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: |
        npm run test:unit
        npm run test:integration
        npm run test:e2e
    
    - name: Run security scan
      run: npm audit --audit-level=high
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    
    outputs:
      image-tag: \${{ steps.meta.outputs.tags }}
      image-digest: \${{ steps.build.outputs.digest }}
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: \${{ env.AWS_REGION }}
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: \${{ env.ECR_REGISTRY }}/myapp
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix=\${{ github.ref_name }}-
    
    - name: Build and push Docker image
      id: build
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: \${{ steps.meta.outputs.tags }}
        labels: \${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: \${{ env.AWS_REGION }}
    
    - name: Setup kubectl
      uses: azure/setup-kubectl@v3
      with:
        version: 'v1.27.0'
    
    - name: Update kubeconfig
      run: |
        aws eks update-kubeconfig --region \${{ env.AWS_REGION }} --name \${{ env.EKS_CLUSTER_NAME }}
    
    - name: Deploy to staging
      run: |
        helm upgrade --install myapp-staging ./helm/myapp \\
          --namespace staging \\
          --create-namespace \\
          --set image.repository=\${{ env.ECR_REGISTRY }}/myapp \\
          --set image.tag=\${{ github.sha }} \\
          --set environment=staging \\
          --values ./helm/myapp/values-staging.yaml \\
          --wait --timeout=10m
    
    - name: Run smoke tests
      run: |
        kubectl wait --namespace staging \\
          --for=condition=ready pod \\
          --selector=app=myapp \\
          --timeout=300s
        
        # Run smoke tests against staging
        npm run test:smoke -- --baseUrl=https://staging-api.myapp.com

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: \${{ env.AWS_REGION }}
    
    - name: Setup kubectl
      uses: azure/setup-kubectl@v3
      with:
        version: 'v1.27.0'
    
    - name: Update kubeconfig
      run: |
        aws eks update-kubeconfig --region \${{ env.AWS_REGION }} --name \${{ env.EKS_CLUSTER_NAME }}
    
    - name: Deploy to production (Blue-Green)
      run: |
        # Deploy to green environment
        helm upgrade --install myapp-green ./helm/myapp \\
          --namespace production \\
          --set image.repository=\${{ env.ECR_REGISTRY }}/myapp \\
          --set image.tag=\${{ github.sha }} \\
          --set environment=production \\
          --set deployment.name=myapp-green \\
          --values ./helm/myapp/values-production.yaml \\
          --wait --timeout=15m
        
        # Run health checks
        kubectl wait --namespace production \\
          --for=condition=ready pod \\
          --selector=app=myapp,version=green \\
          --timeout=600s
        
        # Run production smoke tests
        npm run test:smoke -- --baseUrl=https://green-api.myapp.com
        
        # Switch traffic to green (this would update ingress/service)
        kubectl patch service myapp-service -n production \\
          -p '{"spec":{"selector":{"version":"green"}}}'
        
        # Wait and monitor
        sleep 300
        
        # If all good, remove blue deployment
        helm uninstall myapp-blue --namespace production || true

  security-scan:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: \${{ needs.build.outputs.image-tag }}
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'
\`\`\`

## GitLab CI/CD Pipeline

### .gitlab-ci.yml Configuration
\`\`\`yaml
stages:
  - test
  - build
  - deploy-staging
  - deploy-production

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"
  AWS_DEFAULT_REGION: us-east-1
  EKS_CLUSTER_NAME: myapp-cluster

.aws_config: &aws_config
  - aws configure set aws_access_key_id \$AWS_ACCESS_KEY_ID
  - aws configure set aws_secret_access_key \$AWS_SECRET_ACCESS_KEY
  - aws configure set default.region \$AWS_DEFAULT_REGION

test:
  stage: test
  image: node:18-alpine
  cache:
    key: \$CI_COMMIT_REF_SLUG
    paths:
      - node_modules/
  before_script:
    - npm ci
  script:
    - npm run lint
    - npm run test:unit -- --coverage
    - npm run test:integration
    - npm run test:e2e
  coverage: '/Statements\\s*:\\s*(\\d+\\.?\\d*)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    expire_in: 1 week

build:
  stage: build
  image: docker:20.10.16
  services:
    - docker:20.10.16-dind
  before_script:
    - *aws_config
    - aws ecr get-login-password --region \$AWS_DEFAULT_REGION | docker login --username AWS --password-stdin \$ECR_REGISTRY
  script:
    - docker build -t \$ECR_REGISTRY/myapp:\$CI_COMMIT_SHA .
    - docker push \$ECR_REGISTRY/myapp:\$CI_COMMIT_SHA
  only:
    - main
    - develop

.deploy_template: &deploy_template
  image: alpine/helm:3.12.0
  before_script:
    - apk add --no-cache aws-cli kubectl
    - *aws_config
    - aws eks update-kubeconfig --region \$AWS_DEFAULT_REGION --name \$EKS_CLUSTER_NAME

deploy_staging:
  <<: *deploy_template
  stage: deploy-staging
  environment:
    name: staging
    url: https://staging-api.myapp.com
  script:
    - |
      helm upgrade --install myapp-staging ./helm/myapp \\
        --namespace staging \\
        --create-namespace \\
        --set image.repository=\$ECR_REGISTRY/myapp \\
        --set image.tag=\$CI_COMMIT_SHA \\
        --set environment=staging \\
        --values ./helm/myapp/values-staging.yaml \\
        --wait --timeout=10m
  only:
    - develop

deploy_production:
  <<: *deploy_template
  stage: deploy-production
  environment:
    name: production
    url: https://api.myapp.com
  when: manual
  script:
    - |
      helm upgrade --install myapp-production ./helm/myapp \\
        --namespace production \\
        --create-namespace \\
        --set image.repository=\$ECR_REGISTRY/myapp \\
        --set image.tag=\$CI_COMMIT_SHA \\
        --set environment=production \\
        --values ./helm/myapp/values-production.yaml \\
        --wait --timeout=15m
  only:
    - main
\`\`\`

## ArgoCD GitOps Deployment

### Application Configuration
\`\`\`yaml
# argocd/applications/myapp-staging.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp-staging
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://github.com/company/myapp-k8s-config
    targetRevision: staging
    path: overlays/staging
  destination:
    server: https://kubernetes.default.svc
    namespace: myapp-staging
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  revisionHistoryLimit: 10

---
# argocd/applications/myapp-production.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp-production
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/company/myapp-k8s-config
    targetRevision: main
    path: overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: myapp-production
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  revisionHistoryLimit: 10
\`\`\`

### Kustomize Overlays
\`\`\`yaml
# overlays/staging/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - ../../base

patchesStrategicMerge:
  - deployment-patch.yaml
  - ingress-patch.yaml

images:
  - name: myapp
    newTag: staging-latest

configMapGenerator:
  - name: app-config
    literals:
      - NODE_ENV=staging
      - API_URL=https://staging-api.myapp.com
      - LOG_LEVEL=debug

replicas:
  - name: myapp-deployment
    count: 2

---
# overlays/staging/deployment-patch.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-deployment
spec:
  template:
    spec:
      containers:
      - name: myapp
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
        env:
        - name: ENVIRONMENT
          value: "staging"
\`\`\`

## Deployment Scripts

### Automated Deployment Script
\`\`\`bash
#!/bin/bash
# deploy.sh

set -euo pipefail

# Configuration
ENVIRONMENT=\${1:-staging}
IMAGE_TAG=\${2:-latest}
AWS_REGION=\${AWS_REGION:-us-east-1}
EKS_CLUSTER_NAME=\${EKS_CLUSTER_NAME:-myapp-cluster}

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

log() {
    echo -e "\${GREEN}[INFO]\${NC} \$1"
}

warn() {
    echo -e "\${YELLOW}[WARN]\${NC} \$1"
}

error() {
    echo -e "\${RED}[ERROR]\${NC} \$1"
    exit 1
}

# Validate environment
if [[ ! "\$ENVIRONMENT" =~ ^(staging|production)\$ ]]; then
    error "Environment must be 'staging' or 'production'"
fi

# Check required tools
command -v aws >/dev/null 2>&1 || error "AWS CLI is required"
command -v kubectl >/dev/null 2>&1 || error "kubectl is required" 
command -v helm >/dev/null 2>&1 || error "Helm is required"

# Configure kubectl
log "Configuring kubectl for EKS cluster..."
aws eks update-kubeconfig --region "\$AWS_REGION" --name "\$EKS_CLUSTER_NAME"

# Verify cluster connectivity
log "Verifying cluster connectivity..."
kubectl cluster-info || error "Failed to connect to cluster"

# Check if namespace exists
NAMESPACE="myapp-\$ENVIRONMENT"
if ! kubectl get namespace "\$NAMESPACE" >/dev/null 2>&1; then
    log "Creating namespace \$NAMESPACE..."
    kubectl create namespace "\$NAMESPACE"
fi

# Deploy with Helm
log "Deploying to \$ENVIRONMENT environment..."
helm upgrade --install "myapp-\$ENVIRONMENT" ./helm/myapp \\
    --namespace "\$NAMESPACE" \\
    --set image.tag="\$IMAGE_TAG" \\
    --set environment="\$ENVIRONMENT" \\
    --values "./helm/myapp/values-\$ENVIRONMENT.yaml" \\
    --wait --timeout=10m

# Verify deployment
log "Verifying deployment..."
kubectl rollout status deployment/myapp-deployment -n "\$NAMESPACE" --timeout=600s

# Run health checks
log "Running health checks..."
HEALTH_CHECK_URL="https://\$ENVIRONMENT-api.myapp.com/health"
for i in {1..30}; do
    if curl -sf "\$HEALTH_CHECK_URL" >/dev/null; then
        log "Health check passed!"
        break
    fi
    if [ \$i -eq 30 ]; then
        error "Health check failed after 30 attempts"
    fi
    sleep 10
done

log "Deployment to \$ENVIRONMENT completed successfully!"

# Show deployment info
kubectl get pods -n "\$NAMESPACE" -l app=myapp
kubectl get service -n "\$NAMESPACE" myapp-service
\`\`\`

### Rollback Script
\`\`\`bash
#!/bin/bash
# rollback.sh

set -euo pipefail

ENVIRONMENT=\${1:-staging}
REVISION=\${2:-}

if [[ -z "\$REVISION" ]]; then
    echo "Available revisions:"
    helm history "myapp-\$ENVIRONMENT" -n "myapp-\$ENVIRONMENT"
    echo "Usage: \$0 <environment> <revision>"
    exit 1
fi

echo "Rolling back myapp-\$ENVIRONMENT to revision \$REVISION..."
helm rollback "myapp-\$ENVIRONMENT" "\$REVISION" -n "myapp-\$ENVIRONMENT"

echo "Waiting for rollback to complete..."
kubectl rollout status deployment/myapp-deployment -n "myapp-\$ENVIRONMENT" --timeout=600s

echo "Rollback completed successfully!"
\`\`\`

This deployment pipeline provides:
- Automated testing and security scanning
- Multi-environment deployment strategies
- Blue-green and canary deployment options
- GitOps integration with ArgoCD
- Comprehensive monitoring and rollback capabilities`;
  }

  implementMonitoring(analysis) {
    return `# Comprehensive Cloud Monitoring and Observability

## Prometheus + Grafana Stack

### Prometheus Configuration
\`\`\`yaml
# prometheus-config.yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert-rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'kubernetes-apiservers'
    kubernetes_sd_configs:
    - role: endpoints
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    relabel_configs:
    - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
      action: keep
      regex: default;kubernetes;https

  - job_name: 'kubernetes-nodes'
    kubernetes_sd_configs:
    - role: node
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    relabel_configs:
    - action: labelmap
      regex: __meta_kubernetes_node_label_(.+)

  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
    - role: pod
    relabel_configs:
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
      action: keep
      regex: true
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
      action: replace
      target_label: __metrics_path__
      regex: (.+)
    - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
      action: replace
      regex: ([^:]+)(?::\\d+)?;(\\d+)
      replacement: \$1:\$2
      target_label: __address__

  - job_name: 'application-metrics'
    static_configs:
    - targets: ['myapp-service:3000']
    metrics_path: /metrics
    scrape_interval: 30s
\`\`\`

### Alert Rules
\`\`\`yaml
# alert-rules.yml
groups:
- name: kubernetes-alerts
  rules:
  - alert: KubernetesPodCrashLooping
    expr: rate(kube_pod_container_status_restarts_total[5m]) > 0
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "Pod \{\{ \$labels.pod \}\} is crash looping"
      description: "Pod \{\{ \$labels.pod \}\} in namespace \{\{ \$labels.namespace \}\} is restarting frequently"

  - alert: KubernetesNodeNotReady
    expr: kube_node_status_condition{condition="Ready",status="true"} == 0
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Kubernetes node \{\{ \$labels.node \}\} is not ready"

- name: application-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "High error rate detected"
      description: "Error rate is \{\{ \$value \}\} errors per second"

  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High response time detected"
      description: "95th percentile response time is \{\{ \$value \}\} seconds"

  - alert: DatabaseConnectionHigh
    expr: mysql_global_status_threads_connected / mysql_global_variables_max_connections > 0.8
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "Database connection usage is high"
      description: "Database connection usage is at \{\{ \$value \}\}%"
\`\`\`

### Grafana Dashboards
\`\`\`json
{
  "dashboard": {
    "id": null,
    "title": "Application Performance Dashboard",
    "tags": ["kubernetes", "application"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (method, status)",
            "legendFormat": "\{\{method\}\} - \{\{status\}\}"
          }
        ],
        "yAxes": [
          {
            "label": "Requests/sec",
            "min": 0
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "50th percentile"
          }
        ],
        "yAxes": [
          {
            "label": "Seconds",
            "min": 0
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      },
      {
        "id": 3,
        "title": "Pod Resource Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(container_cpu_usage_seconds_total{pod=~\"myapp-.*\"}[5m])) by (pod)",
            "legendFormat": "CPU - \{\{pod\}\}"
          },
          {
            "expr": "sum(container_memory_usage_bytes{pod=~\"myapp-.*\"}) by (pod) / 1024 / 1024",
            "legendFormat": "Memory - \{\{pod\}\}"
          }
        ],
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": 8}
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
\`\`\`

## Application Metrics

### Node.js Metrics Collection
\`\`\`javascript
// metrics.js
const promClient = require('prom-client');
const express = require('express');
const responseTime = require('response-time');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({
  register,
  prefix: 'nodejs_',
});

// Custom metrics
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register]
});

const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register]
});

// Middleware to collect metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
  });
  
  next();
};

// Database query wrapper with metrics
const executeQuery = async (query, type = 'select') => {
  const start = Date.now();
  
  try {
    const result = await database.query(query);
    const duration = (Date.now() - start) / 1000;
    
    databaseQueryDuration
      .labels(type)
      .observe(duration);
    
    return result;
  } catch (error) {
    const duration = (Date.now() - start) / 1000;
    
    databaseQueryDuration
      .labels(\`\${type}_error\`)
      .observe(duration);
    
    throw error;
  }
};

// Business metrics
const userRegistrations = new promClient.Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
  labelNames: ['source'],
  registers: [register]
});

const ordersProcessed = new promClient.Counter({
  name: 'orders_processed_total',
  help: 'Total number of orders processed',
  labelNames: ['status'],
  registers: [register]
});

const revenueTotal = new promClient.Counter({
  name: 'revenue_total',
  help: 'Total revenue generated',
  labelNames: ['currency'],
  registers: [register]
});

// Metrics endpoint
const metricsEndpoint = (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
};

module.exports = {
  register,
  metricsMiddleware,
  metricsEndpoint,
  executeQuery,
  userRegistrations,
  ordersProcessed,
  revenueTotal,
  activeConnections
};
\`\`\`

### Application Integration
\`\`\`javascript
// app.js
const express = require('express');
const { 
  metricsMiddleware, 
  metricsEndpoint, 
  userRegistrations,
  ordersProcessed,
  activeConnections 
} = require('./metrics');

const app = express();

// Apply metrics middleware
app.use(metricsMiddleware);

// Metrics endpoint for Prometheus
app.get('/metrics', metricsEndpoint);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
});

// Business logic with metrics
app.post('/api/users/register', async (req, res) => {
  try {
    const user = await createUser(req.body);
    
    // Record registration metric
    userRegistrations.labels(req.body.source || 'direct').inc();
    
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const order = await processOrder(req.body);
    
    // Record order metric
    ordersProcessed.labels('completed').inc();
    
    res.status(201).json(order);
  } catch (error) {
    ordersProcessed.labels('failed').inc();
    res.status(400).json({ error: error.message });
  }
});

// Track connections
let connections = 0;

app.use((req, res, next) => {
  connections++;
  activeConnections.set(connections);
  
  res.on('close', () => {
    connections--;
    activeConnections.set(connections);
  });
  
  next();
});

module.exports = app;
\`\`\`

## AWS CloudWatch Integration

### CloudWatch Custom Metrics
\`\`\`javascript
// cloudwatch-metrics.js
const AWS = require('aws-sdk');
const cloudWatch = new AWS.CloudWatch({ region: 'us-east-1' });

class CloudWatchMetrics {
  constructor(namespace = 'MyApp') {
    this.namespace = namespace;
  }

  async putMetric(metricName, value, unit = 'Count', dimensions = []) {
    const params = {
      Namespace: this.namespace,
      MetricData: [
        {
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Timestamp: new Date(),
          Dimensions: dimensions
        }
      ]
    };

    try {
      await cloudWatch.putMetricData(params).promise();
    } catch (error) {
      console.error('Failed to put metric:', error);
    }
  }

  async putBusinessMetrics(metrics) {
    const metricData = Object.entries(metrics).map(([name, data]) => ({
      MetricName: name,
      Value: data.value,
      Unit: data.unit || 'Count',
      Timestamp: new Date(),
      Dimensions: data.dimensions || []
    }));

    const params = {
      Namespace: this.namespace,
      MetricData: metricData
    };

    try {
      await cloudWatch.putMetricData(params).promise();
    } catch (error) {
      console.error('Failed to put business metrics:', error);
    }
  }
}

// Usage example
const metrics = new CloudWatchMetrics('MyApp/Production');

// Track user activity
await metrics.putMetric('UserLogins', 1, 'Count', [
  { Name: 'UserType', Value: 'premium' },
  { Name: 'Region', Value: 'us-east-1' }
]);

// Track business KPIs
await metrics.putBusinessMetrics({
  'DailyActiveUsers': {
    value: 1250,
    unit: 'Count',
    dimensions: [{ Name: 'Environment', Value: 'production' }]
  },
  'AverageOrderValue': {
    value: 87.50,
    unit: 'None',
    dimensions: [{ Name: 'Currency', Value: 'USD' }]
  }
});

module.exports = CloudWatchMetrics;
\`\`\`

## Distributed Tracing

### OpenTelemetry Integration
\`\`\`javascript
// tracing.js
const { NodeSDK } = require('@opentelemetry/auto-instrumentations-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-node');

// Initialize tracing
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'myapp',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development'
  }),
  spanProcessor: new BatchSpanProcessor(
    new JaegerExporter({
      endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces'
    })
  ),
  instrumentations: [getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-fs': {
      enabled: false // Disable file system instrumentation
    }
  })]
});

sdk.start();

// Custom spans
const { trace } = require('@opentelemetry/api');

const tracer = trace.getTracer('myapp', '1.0.0');

async function processOrder(orderData) {
  const span = tracer.startSpan('process_order');
  
  try {
    span.setAttributes({
      'order.id': orderData.id,
      'order.amount': orderData.amount,
      'customer.id': orderData.customerId
    });

    // Validate order
    const validationSpan = tracer.startSpan('validate_order', { parent: span });
    await validateOrder(orderData);
    validationSpan.end();

    // Process payment
    const paymentSpan = tracer.startSpan('process_payment', { parent: span });
    await processPayment(orderData);
    paymentSpan.end();

    // Update inventory
    const inventorySpan = tracer.startSpan('update_inventory', { parent: span });
    await updateInventory(orderData);
    inventorySpan.end();

    span.setStatus({ code: 1 }); // OK
    return { success: true, orderId: orderData.id };
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: 2, message: error.message }); // ERROR
    throw error;
  } finally {
    span.end();
  }
}

module.exports = { tracer, processOrder };
\`\`\`

## Log Aggregation

### Structured Logging with Winston
\`\`\`javascript
// logger.js
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'myapp',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),

    // File output
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    }),

    // Elasticsearch (if configured)
    ...(process.env.ELASTICSEARCH_URL ? [
      new ElasticsearchTransport({
        clientOpts: {
          node: process.env.ELASTICSEARCH_URL,
          auth: {
            username: process.env.ELASTICSEARCH_USERNAME,
            password: process.env.ELASTICSEARCH_PASSWORD
          }
        },
        index: 'myapp-logs'
      })
    ] : [])
  ]
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
};

module.exports = { logger, requestLogger };
\`\`\`

This monitoring system provides:
- Comprehensive metrics collection and visualization
- Distributed tracing for complex requests
- Centralized logging with structured data
- Real-time alerting and notifications
- Performance monitoring and optimization insights`;
  }

  async troubleshoot(issue) {
    const solutions = {
      high_costs: [
        'Implement auto-scaling to reduce over-provisioning',
        'Use spot instances for non-critical workloads',
        'Review and optimize storage classes and retention policies',
        'Implement proper resource tagging for cost allocation',
        'Use reserved instances for predictable workloads'
      ],
      performance_issues: [
        'Implement horizontal pod autoscaling',
        'Optimize database queries and add proper indexing',
        'Add caching layers (Redis, CDN)',
        'Review and optimize container resource limits',
        'Implement load balancing and traffic distribution'
      ],
      security_vulnerabilities: [
        'Update container images and dependencies regularly',
        'Implement network policies and service mesh',
        'Use secrets management for sensitive data',
        'Enable security scanning in CI/CD pipeline',
        'Implement proper RBAC and least privilege access'
      ],
      deployment_failures: [
        'Check resource quotas and limits',
        'Review health check configurations',
        'Verify configuration and environment variables',
        'Check network connectivity and DNS resolution',
        'Review deployment logs and events'
      ]
    };
    
    return solutions[issue.type] || ['Review cloud architecture and best practices documentation'];
  }
}

module.exports = CloudSpecialist;