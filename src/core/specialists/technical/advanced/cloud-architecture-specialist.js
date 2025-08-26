const UnifiedSpecialistBase = require('../../unified-specialist-base');
/**
 * BUMBA Cloud Architecture Specialist
 * Expert in cloud infrastructure, microservices, serverless, and distributed systems
 */

const SpecialistBase = require('../../specialist-base');

class CloudArchitectureSpecialist extends UnifiedSpecialistBase {
  constructor() {
    super({
      name: 'Cloud Architecture Specialist',
      expertise: ['Cloud Architecture', 'AWS', 'Azure', 'GCP', 'Microservices', 'Serverless', 'Kubernetes'],
      models: ['claude-3-opus-20240229', 'gpt-4'],
      temperature: 0.3,
      systemPrompt: `You are a cloud architecture expert specializing in:
        - Cloud-native application design and implementation
        - Multi-cloud and hybrid cloud strategies
        - Microservices architecture and orchestration
        - Serverless computing and Function-as-a-Service
        - Container orchestration with Kubernetes
        - Cloud security and compliance frameworks
        - Infrastructure as Code and DevOps practices
        - Performance optimization and cost management
        Always prioritize scalability, reliability, security, and cost-effectiveness.`
    });

    this.capabilities = {
      cloudStrategy: true,
      microservices: true,
      serverless: true,
      containers: true,
      infrastructure: true,
      security: true,
      monitoring: true,
      costOptimization: true
    };
  }

  async designCloudArchitecture(context) {
    const analysis = await this.analyze(context);
    
    return {
      architecture: this.createCloudArchitecture(analysis),
      infrastructure: this.designInfrastructure(analysis),
      security: this.implementSecurity(analysis),
      monitoring: this.setupMonitoring(analysis)
    };
  }

  createCloudArchitecture(analysis) {
    return `# Cloud Architecture Design for ${analysis.projectName || 'Application'}

## Multi-Cloud Architecture Overview

### High-Level Architecture
\`\`\`
┌─────────────────────────────────────────────────────────┐
│                   Edge & CDN Layer                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ CloudFlare  │  │   AWS       │  │     Azure       │  │
│  │    CDN      │  │ CloudFront  │  │   Front Door    │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                  API Gateway Layer                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   AWS API   │  │   Azure     │  │   GCP API       │  │
│  │   Gateway   │  │   Gateway   │  │   Gateway       │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│               Microservices Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │    User     │  │   Product   │  │     Order       │  │
│  │  Service    │  │  Service    │  │   Service       │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                Data & Storage Layer                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Amazon    │  │   Azure     │  │   Google        │  │
│  │    RDS      │  │   Cosmos    │  │   Cloud SQL     │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
\`\`\`

## AWS Cloud Architecture

### Terraform Infrastructure as Code
\`\`\`hcl
# AWS Provider Configuration
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "terraform-state-bucket"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }
}

# VPC Configuration
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "\${var.project_name}-vpc"
  cidr = var.vpc_cidr
  
  azs             = var.availability_zones
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets
  
  enable_nat_gateway   = true
  enable_vpn_gateway   = false
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "\${var.project_name}-vpc"
  }
}

# EKS Cluster
module "eks" {
  source = "terraform-aws-modules/eks/aws"
  
  cluster_name    = "\${var.project_name}-eks"
  cluster_version = var.kubernetes_version
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  enable_irsa = true
  
  eks_managed_node_groups = {
    main = {
      desired_capacity = var.node_desired_capacity
      max_capacity     = var.node_max_capacity
      min_capacity     = var.node_min_capacity
      
      instance_types = var.node_instance_types
      capacity_type  = "SPOT"
      
      k8s_labels = {
        Environment = var.environment
        NodeGroup   = "main"
      }
      
      additional_tags = {
        ExtraTag = "EKS managed node group"
      }
    }
  }
  
  tags = {
    Environment = var.environment
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "\${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets
  
  enable_deletion_protection = false
  
  tags = {
    Name = "\${var.project_name}-alb"
  }
}

# RDS Database
resource "aws_db_instance" "main" {
  identifier = "\${var.project_name}-db"
  
  engine         = var.db_engine
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class
  
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_encrypted     = true
  
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = var.db_backup_retention_period
  backup_window          = var.db_backup_window
  maintenance_window     = var.db_maintenance_window
  
  skip_final_snapshot = false
  final_snapshot_identifier = "\${var.project_name}-db-final-snapshot"
  
  tags = {
    Name = "\${var.project_name}-database"
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "main" {
  name       = "\${var.project_name}-cache-subnet"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id         = "\${var.project_name}-redis"
  description                  = "Redis cluster for \${var.project_name}"
  
  node_type            = var.redis_node_type
  port                 = 6379
  parameter_group_name = "default.redis7"
  
  num_cache_clusters = var.redis_num_cache_clusters
  
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  tags = {
    Name = "\${var.project_name}-redis"
  }
}

# S3 Buckets
resource "aws_s3_bucket" "app_storage" {
  bucket = "\${var.project_name}-app-storage"
  
  tags = {
    Name        = "\${var.project_name}-app-storage"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id
  
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALB-\${aws_lb.main.name}"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  enabled = true
  
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "ALB-\${aws_lb.main.name}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }
  
  tags = {
    Name = "\${var.project_name}-cloudfront"
  }
}
\`\`\`

### Kubernetes Deployment Manifests
\`\`\`yaml
# Namespace
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    name: production
    
---
# Service Account with IRSA
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-service-account
  namespace: production
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT:role/pod-role

---
# ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
data:
  DATABASE_HOST: "database.internal"
  REDIS_HOST: "redis.internal"
  LOG_LEVEL: "info"
  
---
# Secret
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: production
type: Opaque
data:
  DATABASE_PASSWORD: <base64-encoded-password>
  JWT_SECRET: <base64-encoded-secret>
  
---
# Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: production
  labels:
    app: user-service
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: app-service-account
      containers:
      - name: user-service
        image: user-service:latest
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 8081
          name: metrics
        env:
        - name: PORT
          value: "8080"
        - name: DATABASE_HOST
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: DATABASE_HOST
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DATABASE_PASSWORD
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
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          runAsNonRoot: true
          runAsUser: 1000
          capabilities:
            drop:
            - ALL

---
# Service
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: production
  labels:
    app: user-service
spec:
  selector:
    app: user-service
  ports:
  - name: http
    port: 80
    targetPort: 8080
    protocol: TCP
  type: ClusterIP

---
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 3
  maxReplicas: 10
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

---
# Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/ssl-redirect: '443'
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:region:account:certificate/cert-id
spec:
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /users
        pathType: Prefix
        backend:
          service:
            name: user-service
            port:
              number: 80
  - host: admin.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: admin-service
            port:
              number: 80
\`\`\`

## Azure Cloud Architecture

### ARM Template for Azure Resources
\`\`\`json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "projectName": {
      "type": "string",
      "defaultValue": "cloudapp"
    },
    "environment": {
      "type": "string",
      "defaultValue": "production"
    },
    "location": {
      "type": "string",
      "defaultValue": "[resourceGroup().location]"
    }
  },
  "variables": {
    "vnetName": "[concat(parameters('projectName'), '-vnet')]",
    "subnetName": "[concat(parameters('projectName'), '-subnet')]",
    "aksClusterName": "[concat(parameters('projectName'), '-aks')]",
    "acrName": "[concat(parameters('projectName'), 'acr')]",
    "cosmosDbName": "[concat(parameters('projectName'), '-cosmos')]",
    "keyVaultName": "[concat(parameters('projectName'), '-kv')]"
  },
  "resources": [
    {
      "type": "Microsoft.Network/virtualNetworks",
      "apiVersion": "2021-02-01",
      "name": "[variables('vnetName')]",
      "location": "[parameters('location')]",
      "properties": {
        "addressSpace": {
          "addressPrefixes": ["10.0.0.0/8"]
        },
        "subnets": [
          {
            "name": "[variables('subnetName')]",
            "properties": {
              "addressPrefix": "10.240.0.0/16"
            }
          }
        ]
      }
    },
    {
      "type": "Microsoft.ContainerRegistry/registries",
      "apiVersion": "2021-06-01-preview",
      "name": "[variables('acrName')]",
      "location": "[parameters('location')]",
      "sku": {
        "name": "Standard"
      },
      "properties": {
        "adminUserEnabled": false
      }
    },
    {
      "type": "Microsoft.ContainerService/managedClusters",
      "apiVersion": "2021-05-01",
      "name": "[variables('aksClusterName')]",
      "location": "[parameters('location')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', variables('vnetName'))]"
      ],
      "identity": {
        "type": "SystemAssigned"
      },
      "properties": {
        "dnsPrefix": "[concat(parameters('projectName'), '-aks')]",
        "agentPoolProfiles": [
          {
            "name": "nodepool1",
            "count": 3,
            "vmSize": "Standard_DS2_v2",
            "osType": "Linux",
            "mode": "System",
            "vnetSubnetID": "[resourceId('Microsoft.Network/virtualNetworks/subnets', variables('vnetName'), variables('subnetName'))]"
          }
        ],
        "servicePrincipalProfile": {
          "clientId": "msi"
        },
        "networkProfile": {
          "networkPlugin": "azure",
          "serviceCidr": "10.0.0.0/16",
          "dnsServiceIP": "10.0.0.10",
          "dockerBridgeCidr": "172.17.0.1/16"
        },
        "addonProfiles": {
          "httpApplicationRouting": {
            "enabled": true
          },
          "azurepolicy": {
            "enabled": true
          }
        }
      }
    },
    {
      "type": "Microsoft.DocumentDB/databaseAccounts",
      "apiVersion": "2021-04-15",
      "name": "[variables('cosmosDbName')]",
      "location": "[parameters('location')]",
      "kind": "GlobalDocumentDB",
      "properties": {
        "consistencyPolicy": {
          "defaultConsistencyLevel": "Session"
        },
        "locations": [
          {
            "locationName": "[parameters('location')]",
            "failoverPriority": 0,
            "isZoneRedundant": false
          }
        ],
        "databaseAccountOfferType": "Standard",
        "enableAutomaticFailover": false,
        "enableMultipleWriteLocations": false,
        "capabilities": [
          {
            "name": "EnableServerless"
          }
        ]
      }
    },
    {
      "type": "Microsoft.KeyVault/vaults",
      "apiVersion": "2021-06-01-preview",
      "name": "[variables('keyVaultName')]",
      "location": "[parameters('location')]",
      "properties": {
        "sku": {
          "family": "A",
          "name": "standard"
        },
        "tenantId": "[subscription().tenantId]",
        "accessPolicies": [],
        "enabledForDeployment": false,
        "enabledForDiskEncryption": false,
        "enabledForTemplateDeployment": false,
        "enableSoftDelete": true,
        "softDeleteRetentionInDays": 90,
        "enableRbacAuthorization": true
      }
    }
  ],
  "outputs": {
    "aksClusterName": {
      "type": "string",
      "value": "[variables('aksClusterName')]"
    },
    "acrLoginServer": {
      "type": "string",
      "value": "[reference(resourceId('Microsoft.ContainerRegistry/registries', variables('acrName'))).loginServer]"
    }
  }
}
\`\`\`

## Serverless Architecture

### AWS Lambda with Serverless Framework
\`\`\`yaml
# serverless.yml
service: cloud-app-serverless

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs18.x
  stage: \${opt:stage, 'dev'}
  region: \${opt:region, 'us-west-2'}
  
  environment:
    STAGE: \${self:provider.stage}
    REGION: \${self:provider.region}
    DYNAMODB_TABLE: \${self:service}-\${self:provider.stage}
    
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - dynamodb:Query
            - dynamodb:Scan
            - dynamodb:GetItem
            - dynamodb:PutItem
            - dynamodb:UpdateItem
            - dynamodb:DeleteItem
          Resource: "arn:aws:dynamodb:\${aws:region}:\${aws:accountId}:table/\${self:provider.environment.DYNAMODB_TABLE}"

functions:
  createUser:
    handler: handlers/users.create
    events:
      - http:
          path: users
          method: post
          cors: true
          authorizer: auth
    environment:
      FUNCTION_NAME: createUser
      
  getUser:
    handler: handlers/users.get
    events:
      - http:
          path: users/{id}
          method: get
          cors: true
          authorizer: auth
    environment:
      FUNCTION_NAME: getUser
      
  listUsers:
    handler: handlers/users.list
    events:
      - http:
          path: users
          method: get
          cors: true
          authorizer: auth
    environment:
      FUNCTION_NAME: listUsers
      
  updateUser:
    handler: handlers/users.update
    events:
      - http:
          path: users/{id}
          method: put
          cors: true
          authorizer: auth
    environment:
      FUNCTION_NAME: updateUser
      
  deleteUser:
    handler: handlers/users.delete
    events:
      - http:
          path: users/{id}
          method: delete
          cors: true
          authorizer: auth
    environment:
      FUNCTION_NAME: deleteUser
      
  auth:
    handler: handlers/auth.authorize
    
  processQueue:
    handler: handlers/queue.process
    events:
      - sqs:
          arn:
            Fn::GetAtt:
              - ProcessingQueue
              - Arn
    environment:
      FUNCTION_NAME: processQueue

resources:
  Resources:
    UsersTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: \${self:provider.environment.DYNAMODB_TABLE}
        AttributeDefinitions:
          - AttributeName: id
            AttributeType: S
        KeySchema:
          - AttributeName: id
            KeyType: HASH
        BillingMode: PAY_PER_REQUEST
        
    ProcessingQueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: \${self:service}-\${self:provider.stage}-processing
        VisibilityTimeoutSeconds: 60
        
    ProcessingDeadLetterQueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: \${self:service}-\${self:provider.stage}-dlq
        
plugins:
  - serverless-webpack
  - serverless-offline
  - serverless-dynamodb-local

custom:
  webpack:
    webpackConfig: webpack.config.js
    includeModules: true
    
  dynamodb:
    stages:
      - dev
    start:
      port: 8000
      inMemory: true
      migrate: true
\`\`\`

### Lambda Function Implementation
\`\`\`javascript
// handlers/users.js
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE;

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
};

module.exports.create = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { name, email } = body;
    
    if (!name || !email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Name and email are required'
        }),
      };
    }
    
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    
    const user = {
      id,
      name,
      email,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    
    await dynamoDb.put({
      TableName: TABLE_NAME,
      Item: user,
    }).promise();
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(user),
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Could not create user'
      }),
    };
  }
};

module.exports.get = async (event) => {
  try {
    const { id } = event.pathParameters;
    
    const result = await dynamoDb.get({
      TableName: TABLE_NAME,
      Key: { id },
    }).promise();
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'User not found'
        }),
      };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    console.error('Error getting user:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Could not get user'
      }),
    };
  }
};

module.exports.list = async (event) => {
  try {
    const result = await dynamoDb.scan({
      TableName: TABLE_NAME,
    }).promise();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        users: result.Items,
        count: result.Count,
      }),
    };
  } catch (error) {
    console.error('Error listing users:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Could not list users'
      }),
    };
  }
};

module.exports.update = async (event) => {
  try {
    const { id } = event.pathParameters;
    const body = JSON.parse(event.body);
    const { name, email } = body;
    
    const updateExpression = [];
    const expressionAttributeValues = {};
    
    if (name) {
      updateExpression.push('name = :name');
      expressionAttributeValues[':name'] = name;
    }
    
    if (email) {
      updateExpression.push('email = :email');
      expressionAttributeValues[':email'] = email;
    }
    
    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    
    const result = await dynamoDb.update({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: \`SET \${updateExpression.join(', ')}\`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }).promise();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.Attributes),
    };
  } catch (error) {
    console.error('Error updating user:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Could not update user'
      }),
    };
  }
};

module.exports.delete = async (event) => {
  try {
    const { id } = event.pathParameters;
    
    await dynamoDb.delete({
      TableName: TABLE_NAME,
      Key: { id },
    }).promise();
    
    return {
      statusCode: 204,
      headers,
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Could not delete user'
      }),
    };
  }
};
\`\`\`

This comprehensive cloud architecture provides enterprise-grade patterns for building scalable, secure, and cost-effective cloud-native applications across multiple cloud providers.`;
  }

  designInfrastructure(analysis) {
    return `# Infrastructure Design and Implementation

## Multi-Region Infrastructure Setup

### Global Load Balancer Configuration
\`\`\`yaml
# Global Traffic Manager (Azure Traffic Manager)
apiVersion: v1
kind: ConfigMap
metadata:
  name: global-traffic-manager
data:
  config.yml: |
    trafficManager:
      profiles:
        - name: global-app
          routingMethod: Performance
          endpoints:
            - name: us-west
              target: us-west.cloudapp.azure.com
              priority: 1
              weight: 100
            - name: eu-west
              target: eu-west.cloudapp.azure.com
              priority: 2
              weight: 100
            - name: ap-southeast
              target: ap-southeast.cloudapp.azure.com
              priority: 3
              weight: 100
          monitoring:
            protocol: HTTPS
            port: 443
            path: /health
            intervalInSeconds: 30
            timeoutInSeconds: 10
            toleratedNumberOfFailures: 3
\`\`\`

### Infrastructure Monitoring Stack
\`\`\`yaml
# Prometheus Configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    rule_files:
      - "/etc/prometheus/rules/*.yml"
    
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
          - target_label: __address__
            replacement: kubernetes.default.svc:443
          - source_labels: [__meta_kubernetes_node_name]
            regex: (.+)
            target_label: __metrics_path__
            replacement: /api/v1/nodes/\${1}/proxy/metrics
      
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
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: \$1:\$2
            target_label: __address__
          - action: labelmap
            regex: __meta_kubernetes_pod_label_(.+)
          - source_labels: [__meta_kubernetes_namespace]
            action: replace
            target_label: kubernetes_namespace
          - source_labels: [__meta_kubernetes_pod_name]
            action: replace
            target_label: kubernetes_pod_name

---
# Grafana Dashboard ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboards
  namespace: monitoring
data:
  kubernetes-cluster.json: |
    {
      "dashboard": {
        "id": null,
        "title": "Kubernetes Cluster Monitoring",
        "uid": "kubernetes-cluster",
        "version": 1,
        "panels": [
          {
            "id": 1,
            "title": "CPU Usage",
            "type": "graph",
            "targets": [
              {
                "expr": "100 - (avg by (instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
                "legendFormat": "{{instance}}"
              }
            ],
            "yAxes": [
              {
                "label": "Percent",
                "max": 100,
                "min": 0
              }
            ]
          },
          {
            "id": 2,
            "title": "Memory Usage",
            "type": "graph",
            "targets": [
              {
                "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
                "legendFormat": "{{instance}}"
              }
            ]
          },
          {
            "id": 3,
            "title": "Pod CPU Usage",
            "type": "graph",
            "targets": [
              {
                "expr": "sum(rate(container_cpu_usage_seconds_total{container!=\"POD\",container!=\"\"}[5m])) by (pod, namespace)",
                "legendFormat": "{{namespace}}/{{pod}}"
              }
            ]
          }
        ]
      }
    }
\`\`\`

### Disaster Recovery Configuration
\`\`\`yaml
# Velero Backup Configuration
apiVersion: velero.io/v1
kind: BackupStorageLocation
metadata:
  name: aws-backup-location
  namespace: velero
spec:
  provider: aws
  objectStorage:
    bucket: kubernetes-backups
    prefix: cluster-backups
  config:
    region: us-west-2
    
---
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: daily-backup
  namespace: velero
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  template:
    includedNamespaces:
    - production
    - staging
    excludedResources:
    - events
    - logs
    ttl: 720h  # 30 days
    
---
# Database Backup CronJob
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: production
spec:
  schedule: "0 1 * * *"  # Daily at 1 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: postgres-backup
            image: postgres:13
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
            command:
            - /bin/bash
            - -c
            - |
              DATE=$(date +%Y%m%d_%H%M%S)
              pg_dump -h postgres-service -U postgres -d app_db > /backup/backup_\$DATE.sql
              aws s3 cp /backup/backup_\$DATE.sql s3://database-backups/postgres/
              find /backup -name "*.sql" -mtime +7 -delete
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
\`\`\`

## Service Mesh Implementation

### Istio Service Mesh Configuration
\`\`\`yaml
# Istio Gateway
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: app-gateway
  namespace: production
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 443
      name: https
      protocol: HTTPS
    tls:
      mode: SIMPLE
      credentialName: app-tls-secret
    hosts:
    - api.example.com
    - admin.example.com
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - api.example.com
    - admin.example.com
    redirect:
      httpsRedirect: true

---
# Virtual Service
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: app-virtualservice
  namespace: production
spec:
  hosts:
  - api.example.com
  gateways:
  - app-gateway
  http:
  - match:
    - uri:
        prefix: /users
    route:
    - destination:
        host: user-service
        port:
          number: 80
      weight: 90
    - destination:
        host: user-service-canary
        port:
          number: 80
      weight: 10
    fault:
      delay:
        percentage:
          value: 0.1
        fixedDelay: 5s
    retries:
      attempts: 3
      perTryTimeout: 2s
  - match:
    - uri:
        prefix: /products
    route:
    - destination:
        host: product-service
        port:
          number: 80
    timeout: 30s

---
# Destination Rule
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: user-service-destination
  namespace: production
spec:
  host: user-service
  trafficPolicy:
    loadBalancer:
      simple: LEAST_CONN
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        maxRequestsPerConnection: 10
    circuitBreaker:
      consecutiveErrors: 3
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
    outlierDetection:
      consecutiveErrors: 3
      interval: 30s
      baseEjectionTime: 30s
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2

---
# Service Entry for External Services
apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: external-api
  namespace: production
spec:
  hosts:
  - external-api.example.com
  ports:
  - number: 443
    name: https
    protocol: HTTPS
  location: MESH_EXTERNAL
  resolution: DNS

---
# Authorization Policy
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: user-service-policy
  namespace: production
spec:
  selector:
    matchLabels:
      app: user-service
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/production/sa/api-gateway"]
  - to:
    - operation:
        methods: ["GET", "POST"]
    when:
    - key: request.headers[authorization]
      values: ["Bearer *"]

---
# Peer Authentication
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT
\`\`\`

### Network Policies
\`\`\`yaml
# Default Deny All Network Policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress

---
# Allow Ingress from Istio Gateway
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-istio-ingress
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: user-service
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: istio-system
    ports:
    - protocol: TCP
      port: 8080

---
# Allow Database Access
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-database-access
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: user-service
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to: []  # Allow DNS
    ports:
    - protocol: UDP
      port: 53

---
# Allow Redis Access
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-redis-access
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: user-service
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
\`\`\`

## Cost Optimization Strategies

### Resource Optimization Scripts
\`\`\`bash
#!/bin/bash
# cost-optimization.sh

echo "🔍 Starting cost optimization analysis..."

# Check for unattached EBS volumes
echo "Checking for unattached EBS volumes..."
aws ec2 describe-volumes --filters Name=status,Values=available --query 'Volumes[*].[VolumeId,Size,CreateTime]' --output table

# Check for unused Elastic IPs
echo "Checking for unused Elastic IPs..."
aws ec2 describe-addresses --query 'Addresses[?AssociationId==null].[PublicIp,AllocationId]' --output table

# Check for old snapshots
echo "Checking for old snapshots (older than 30 days)..."
CUTOFF_DATE=$(date -d '30 days ago' '+%Y-%m-%d')
aws ec2 describe-snapshots --owner-ids self --query "Snapshots[?StartTime<'$CUTOFF_DATE'].[SnapshotId,StartTime,VolumeSize]" --output table

# Check for unused Load Balancers
echo "Checking for load balancers with no targets..."
aws elbv2 describe-load-balancers --query 'LoadBalancers[*].[LoadBalancerName,LoadBalancerArn]' --output text | while read name arn; do
  target_groups=$(aws elbv2 describe-target-groups --load-balancer-arn $arn --query 'TargetGroups[*].TargetGroupArn' --output text)
  if [ -z "$target_groups" ]; then
    echo "Unused load balancer: $name"
  fi
done

# Check RDS instances utilization
echo "Checking RDS instances with low CPU utilization..."
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceClass,Engine]' --output text | while read id class engine; do
  cpu_avg=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/RDS \
    --metric-name CPUUtilization \
    --dimensions Name=DBInstanceIdentifier,Value=$id \
    --start-time $(date -d '7 days ago' --iso-8601) \
    --end-time $(date --iso-8601) \
    --period 86400 \
    --statistics Average \
    --query 'Datapoints[*].Average' \
    --output text | awk '{sum+=$1; count++} END {if(count>0) print sum/count; else print 0}')
  
  if (( $(echo "$cpu_avg < 20" | bc -l) )); then
    echo "Low CPU utilization RDS instance: $id (avg: $cpu_avg%)"
  fi
done

# Generate cost optimization report
echo "📊 Generating cost optimization recommendations..."
cat > cost-optimization-report.md << EOF
# Cost Optimization Report

## Recommendations

### Compute Optimization
- [ ] Review and resize over-provisioned instances
- [ ] Implement auto-scaling policies
- [ ] Use Spot instances for non-critical workloads
- [ ] Consider Reserved Instances for steady workloads

### Storage Optimization
- [ ] Delete unattached EBS volumes
- [ ] Implement lifecycle policies for S3
- [ ] Use appropriate storage classes (IA, Glacier)
- [ ] Clean up old snapshots

### Network Optimization
- [ ] Release unused Elastic IPs
- [ ] Remove unused load balancers
- [ ] Optimize data transfer costs
- [ ] Use CloudFront for static content

### Database Optimization
- [ ] Right-size database instances
- [ ] Use read replicas efficiently
- [ ] Implement automated backup cleanup
- [ ] Consider Aurora Serverless for variable workloads

### Monitoring and Alerts
- [ ] Set up cost alerts and budgets
- [ ] Implement resource tagging strategy
- [ ] Regular cost review meetings
- [ ] Use AWS Cost Explorer and Trusted Advisor
EOF

echo "🏁 Cost optimization analysis completed. Check cost-optimization-report.md for recommendations."
\`\`\`

### Kubernetes Resource Optimization
\`\`\`yaml
# Vertical Pod Autoscaler
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: user-service-vpa
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: user-service
      maxAllowed:
        cpu: 1
        memory: 2Gi
      minAllowed:
        cpu: 100m
        memory: 128Mi

---
# Pod Disruption Budget
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: user-service-pdb
  namespace: production
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: user-service

---
# Resource Quotas
apiVersion: v1
kind: ResourceQuota
metadata:
  name: production-quota
  namespace: production
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
    persistentvolumeclaims: "10"
    pods: "50"
    services: "20"

---
# Limit Ranges
apiVersion: v1
kind: LimitRange
metadata:
  name: production-limits
  namespace: production
spec:
  limits:
  - default:
      cpu: 500m
      memory: 512Mi
    defaultRequest:
      cpu: 100m
      memory: 128Mi
    type: Container
  - max:
      cpu: 2
      memory: 4Gi
    min:
      cpu: 50m
      memory: 64Mi
    type: Container
\`\`\`

This comprehensive infrastructure design provides enterprise-grade patterns for building resilient, scalable, and cost-effective cloud infrastructure.`;
  }

  implementSecurity(analysis) {
    return `# Cloud Security Implementation Framework

## Zero Trust Security Architecture

### Identity and Access Management
\`\`\`yaml
# RBAC Configuration
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: developer-role
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps", "secrets"]
  verbs: ["get", "list", "create", "update", "patch", "delete"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "create", "update", "patch", "delete"]
- apiGroups: ["networking.k8s.io"]
  resources: ["ingresses"]
  verbs: ["get", "list", "create", "update", "patch", "delete"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: developer-binding
subjects:
- kind: User
  name: developer@example.com
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: developer-role
  apiGroup: rbac.authorization.k8s.io

---
# Service Account for Applications
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-service-account
  namespace: production
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT:role/EKSServiceRole

---
# Pod Security Policy (Deprecated, use Pod Security Standards)
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: restricted-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
\`\`\`

### Pod Security Standards
\`\`\`yaml
# Namespace with Pod Security Standards
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted

---
# Secure Deployment Example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secure-app
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: secure-app
  template:
    metadata:
      labels:
        app: secure-app
    spec:
      serviceAccountName: app-service-account
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 3000
        fsGroup: 2000
        seccompProfile:
          type: RuntimeDefault
      containers:
      - name: app
        image: secure-app:latest
        ports:
        - containerPort: 8080
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          runAsNonRoot: true
          runAsUser: 1000
          capabilities:
            drop:
            - ALL
            add:
            - NET_BIND_SERVICE
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: cache
          mountPath: /app/cache
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: tmp
        emptyDir: {}
      - name: cache
        emptyDir: {}
\`\`\`

### Secrets Management
\`\`\`yaml
# External Secrets Operator Configuration
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: production
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-west-2
      auth:
        serviceAccountRef:
          name: external-secrets-sa

---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
  namespace: production
spec:
  refreshInterval: 15s
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: app-secrets
    creationPolicy: Owner
  data:
  - secretKey: database-password
    remoteRef:
      key: prod/database
      property: password
  - secretKey: api-key
    remoteRef:
      key: prod/api
      property: key

---
# Sealed Secrets (Alternative approach)
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: app-sealed-secret
  namespace: production
spec:
  encryptedData:
    database-password: AgBy3i4OJSWK+PiTySYZZA9rO43cGDEQAx...
    api-key: AgAh/7mGk3lSDQVs7dqF7a+qZpGnv5...
  template:
    metadata:
      name: app-secret
      namespace: production
    type: Opaque
\`\`\`

### Network Security
\`\`\`yaml
# Istio Security Policies
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: deny-all
  namespace: production
spec:
  {}  # Deny all by default

---
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-frontend
  namespace: production
spec:
  selector:
    matchLabels:
      app: user-service
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/production/sa/frontend-sa"]
  - to:
    - operation:
        methods: ["GET", "POST"]
        paths: ["/api/users/*"]
  - when:
    - key: request.headers[authorization]
      values: ["Bearer *"]

---
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT

---
# Calico Global Network Policy
apiVersion: projectcalico.org/v3
kind: GlobalNetworkPolicy
metadata:
  name: deny-all-non-system-traffic
spec:
  selector: projectcalico.org/namespace != "kube-system"
  types:
  - Ingress
  - Egress
  egress:
  # Allow DNS
  - action: Allow
    protocol: UDP
    destination:
      ports: [53]
  # Allow NTP
  - action: Allow
    protocol: UDP
    destination:
      ports: [123]

---
# Allow specific service communication
apiVersion: projectcalico.org/v3
kind: NetworkPolicy
metadata:
  name: user-service-policy
  namespace: production
spec:
  selector: app == "user-service"
  types:
  - Ingress
  - Egress
  ingress:
  - action: Allow
    source:
      selector: app == "api-gateway"
    destination:
      ports: [8080]
  egress:
  - action: Allow
    destination:
      selector: app == "database"
      ports: [5432]
  - action: Allow
    destination:
      selector: app == "redis"
      ports: [6379]
\`\`\`

## Security Scanning and Compliance

### Container Security Scanning
\`\`\`yaml
# Trivy Security Scan Job
apiVersion: batch/v1
kind: Job
metadata:
  name: security-scan
  namespace: security
spec:
  template:
    spec:
      containers:
      - name: trivy-scanner
        image: aquasec/trivy:latest
        command:
        - /bin/sh
        - -c
        - |
          trivy image --exit-code 1 --severity HIGH,CRITICAL user-service:latest
          trivy fs --exit-code 1 --severity HIGH,CRITICAL /workspace
        volumeMounts:
        - name: workspace
          mountPath: /workspace
      volumes:
      - name: workspace
        persistentVolumeClaim:
          claimName: workspace-pvc
      restartPolicy: Never

---
# Falco Security Monitoring
apiVersion: v1
kind: ConfigMap
metadata:
  name: falco-config
  namespace: falco-system
data:
  falco.yaml: |
    rules_file:
      - /etc/falco/falco_rules.yaml
      - /etc/falco/falco_rules.local.yaml
      - /etc/falco/k8s_audit_rules.yaml
    
    time_format_iso_8601: true
    json_output: true
    json_include_output_property: true
    
    grpc:
      enabled: true
      bind_address: "0.0.0.0:5060"
      
    grpc_output:
      enabled: true
      
    http_output:
      enabled: true
      url: "http://falcosidekick:2801"
    
    priority: DEBUG
    
    outputs:
      rate: 1
      max_burst: 1000
    
    syscall_event_drops:
      actions:
        - log
        - alert
      rate: 0.03333
      max_burst: 10
  
  falco_rules.local.yaml: |
    - rule: Detect shell in container
      desc: Detect shell execution in container
      condition: >
        spawned_process and container and
        (proc.name in (shell_binaries) or
         proc.name in (shell_mgmt_binaries))
      output: >
        Shell spawned in container
        (user=%user.name container=%container.name
         image=%container.image.repository:%container.image.tag
         shell=%proc.name parent=%proc.pname cmdline=%proc.cmdline)
      priority: WARNING
      tags: [container, shell, mitre_execution]
      
    - rule: Detect crypto mining
      desc: Detect cryptocurrency mining
      condition: >
        spawned_process and
        (proc.name in (crypto_miners) or
         proc.cmdline contains "stratum+tcp" or
         proc.cmdline contains "xmr-stak")
      output: >
        Crypto mining detected
        (user=%user.name command=%proc.cmdline
         container=%container.name image=%container.image.repository)
      priority: CRITICAL
      tags: [process, cryptocurrency]

---
# OPA Gatekeeper Policies
apiVersion: templates.gatekeeper.sh/v1beta1
kind: ConstraintTemplate
metadata:
  name: k8srequiredsecuritycontext
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredSecurityContext
      validation:
        openAPIV3Schema:
          type: object
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredsecuritycontext
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.securityContext.runAsNonRoot
          msg := "Container must run as non-root user"
        }
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.securityContext.readOnlyRootFilesystem
          msg := "Container must have read-only root filesystem"
        }

---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredSecurityContext
metadata:
  name: must-have-security-context
spec:
  match:
    kinds:
      - apiGroups: ["apps"]
        kinds: ["Deployment"]
    namespaces: ["production", "staging"]
\`\`\`

### Compliance and Auditing
\`\`\`bash
#!/bin/bash
# compliance-check.sh

echo "🔒 Starting security compliance check..."

# CIS Kubernetes Benchmark
echo "Running CIS Kubernetes Benchmark..."
kube-bench run --targets master,node --json > cis-benchmark-results.json

# Check for Pod Security Standards compliance
echo "Checking Pod Security Standards compliance..."
kubectl get namespaces -o json | jq -r '.items[] | select(.metadata.labels["pod-security.kubernetes.io/enforce"] != "restricted") | .metadata.name' > non-compliant-namespaces.txt

# Check for privileged containers
echo "Checking for privileged containers..."
kubectl get pods --all-namespaces -o json | jq -r '.items[] | select(.spec.containers[]?.securityContext.privileged == true) | "\(.metadata.namespace)/\(.metadata.name)"' > privileged-pods.txt

# Check for containers running as root
echo "Checking for containers running as root..."
kubectl get pods --all-namespaces -o json | jq -r '.items[] | select(.spec.containers[]?.securityContext.runAsUser == 0 or (.spec.containers[]?.securityContext.runAsUser == null and .spec.securityContext.runAsUser == null)) | "\(.metadata.namespace)/\(.metadata.name)"' > root-containers.txt

# Check for missing network policies
echo "Checking for namespaces without network policies..."
for ns in $(kubectl get namespaces -o name | cut -d/ -f2); do
  if [ "$ns" != "kube-system" ] && [ "$ns" != "kube-public" ]; then
    policies=$(kubectl get networkpolicies -n $ns --no-headers 2>/dev/null | wc -l)
    if [ $policies -eq 0 ]; then
      echo $ns >> namespaces-without-netpol.txt
    fi
  fi
done

# Check for secrets in environment variables
echo "Checking for potential secrets in environment variables..."
kubectl get pods --all-namespaces -o json | jq -r '.items[] | select(.spec.containers[]?.env[]?.name | test("PASSWORD|SECRET|TOKEN|KEY"; "i")) | "\(.metadata.namespace)/\(.metadata.name): \(.spec.containers[].env[] | select(.name | test("PASSWORD|SECRET|TOKEN|KEY"; "i")) | .name)"' > potential-secret-env-vars.txt

# Check image pull policies
echo "Checking image pull policies..."
kubectl get pods --all-namespaces -o json | jq -r '.items[] | select(.spec.containers[]?.imagePullPolicy != "Always") | "\(.metadata.namespace)/\(.metadata.name)"' > non-always-pull-policy.txt

# Generate compliance report
echo "📊 Generating compliance report..."
cat > security-compliance-report.md << EOF
# Security Compliance Report

## Summary
- CIS Kubernetes Benchmark: $(if [ -s cis-benchmark-results.json ]; then echo "Completed"; else echo "Failed"; fi)
- Non-compliant namespaces: $(if [ -f non-compliant-namespaces.txt ]; then wc -l < non-compliant-namespaces.txt; else echo "0"; fi)
- Privileged pods: $(if [ -f privileged-pods.txt ]; then wc -l < privileged-pods.txt; else echo "0"; fi)
- Root containers: $(if [ -f root-containers.txt ]; then wc -l < root-containers.txt; else echo "0"; fi)
- Namespaces without network policies: $(if [ -f namespaces-without-netpol.txt ]; then wc -l < namespaces-without-netpol.txt; else echo "0"; fi)

## Recommendations
### High Priority
- [ ] Implement Pod Security Standards in all namespaces
- [ ] Remove privileged containers
- [ ] Ensure all containers run as non-root
- [ ] Implement network policies for all namespaces

### Medium Priority
- [ ] Review and secure environment variables
- [ ] Implement image pull policy as "Always"
- [ ] Regular security scanning with Trivy
- [ ] Implement admission controllers (OPA Gatekeeper)

### Low Priority
- [ ] Enhanced monitoring with Falco
- [ ] Regular penetration testing
- [ ] Security training for development teams
- [ ] Incident response procedures
EOF

echo "🏁 Security compliance check completed. Review security-compliance-report.md for findings."
\`\`\`

### Secrets Rotation Automation
\`\`\`python
#!/usr/bin/env python3
# secrets-rotation.py

import boto3
import json
import base64
import string
import secrets
from datetime import datetime, timedelta
from kubernetes import client, config

class SecretsRotator:
    def __init__(self):
        self.secrets_client = boto3.client('secretsmanager')
        self.rds_client = boto3.client('rds')
        config.load_incluster_config()
        self.k8s_client = client.CoreV1Api()
    
    def generate_password(self, length=32):
        """Generate a secure random password"""
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(alphabet) for i in range(length))
        return password
    
    def rotate_database_password(self, secret_name, db_instance_id):
        """Rotate database password"""
        try:
            # Generate new password
            new_password = self.generate_password()
            
            # Get current secret
            response = self.secrets_client.get_secret_value(SecretName=secret_name)
            current_secret = json.loads(response['SecretString'])
            
            # Update database password
            self.rds_client.modify_db_instance(
                DBInstanceIdentifier=db_instance_id,
                MasterUserPassword=new_password,
                ApplyImmediately=True
            )
            
            # Update secret in AWS Secrets Manager
            current_secret['password'] = new_password
            self.secrets_client.update_secret(
                SecretId=secret_name,
                SecretString=json.dumps(current_secret)
            )
            
            # Update Kubernetes secret
            self.update_k8s_secret('production', 'app-secrets', {
                'database-password': base64.b64encode(new_password.encode()).decode()
            })
            
            print(f"Successfully rotated password for {db_instance_id}")
            
        except Exception as e:
            print(f"Error rotating database password: {str(e)}")
            raise
    
    def rotate_api_keys(self, secret_name, service_name):
        """Rotate API keys"""
        try:
            # Generate new API key
            new_api_key = secrets.token_urlsafe(32)
            
            # Update secret in AWS Secrets Manager
            self.secrets_client.update_secret(
                SecretId=secret_name,
                SecretString=json.dumps({
                    'api_key': new_api_key,
                    'rotated_at': datetime.utcnow().isoformat()
                })
            )
            
            # Update Kubernetes secret
            self.update_k8s_secret('production', 'app-secrets', {
                f'{service_name}-api-key': base64.b64encode(new_api_key.encode()).decode()
            })
            
            print(f"Successfully rotated API key for {service_name}")
            
        except Exception as e:
            print(f"Error rotating API key: {str(e)}")
            raise
    
    def update_k8s_secret(self, namespace, secret_name, data):
        """Update Kubernetes secret"""
        try:
            # Get current secret
            current_secret = self.k8s_client.read_namespaced_secret(
                name=secret_name,
                namespace=namespace
            )
            
            # Update data
            if current_secret.data is None:
                current_secret.data = {}
            current_secret.data.update(data)
            
            # Apply update
            self.k8s_client.patch_namespaced_secret(
                name=secret_name,
                namespace=namespace,
                body=current_secret
            )
            
            print(f"Updated Kubernetes secret {secret_name} in namespace {namespace}")
            
        except Exception as e:
            print(f"Error updating Kubernetes secret: {str(e)}")
            raise
    
    def check_secret_age(self, secret_name, max_age_days=90):
        """Check if secret needs rotation based on age"""
        try:
            response = self.secrets_client.describe_secret(SecretId=secret_name)
            last_changed = response.get('LastChangedDate')
            
            if last_changed:
                age = datetime.now(last_changed.tzinfo) - last_changed
                return age.days > max_age_days
            
            return True  # Rotate if no last changed date
            
        except Exception as e:
            print(f"Error checking secret age: {str(e)}")
            return True
    
    def run_rotation_schedule(self):
        """Run scheduled rotation for all managed secrets"""
        secrets_to_rotate = [
            {
                'secret_name': 'prod/database/master',
                'db_instance_id': 'prod-postgres',
                'type': 'database'
            },
            {
                'secret_name': 'prod/api/external-service',
                'service_name': 'external-service',
                'type': 'api_key'
            }
        ]
        
        for secret_config in secrets_to_rotate:
            secret_name = secret_config['secret_name']
            
            if self.check_secret_age(secret_name):
                print(f"Rotating secret: {secret_name}")
                
                if secret_config['type'] == 'database':
                    self.rotate_database_password(
                        secret_name,
                        secret_config['db_instance_id']
                    )
                elif secret_config['type'] == 'api_key':
                    self.rotate_api_keys(
                        secret_name,
                        secret_config['service_name']
                    )
            else:
                print(f"Secret {secret_name} does not need rotation yet")

if __name__ == "__main__":
    rotator = SecretsRotator()
    rotator.run_rotation_schedule()
\`\`\`

This comprehensive security implementation provides enterprise-grade protection for cloud-native applications with automated compliance checking, secrets management, and continuous security monitoring.`;
  }

  setupMonitoring(analysis) {
    return `# Comprehensive Cloud Monitoring and Observability

## Observability Stack Architecture

### Prometheus and Grafana Stack
\`\`\`yaml
# Prometheus Configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-server-conf
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
      external_labels:
        cluster: 'production'
        region: 'us-west-2'
    
    rule_files:
      - "/etc/prometheus/rules/*.yml"
    
    alerting:
      alertmanagers:
        - static_configs:
            - targets:
              - alertmanager:9093
          path_prefix: /
          scheme: http
    
    scrape_configs:
      # Kubernetes API Server
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
      
      # Kubernetes Nodes
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
          - target_label: __address__
            replacement: kubernetes.default.svc:443
          - source_labels: [__meta_kubernetes_node_name]
            regex: (.+)
            target_label: __metrics_path__
            replacement: /api/v1/nodes/\${1}/proxy/metrics
      
      # Kubernetes Pods
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
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: \$1:\$2
            target_label: __address__
          - action: labelmap
            regex: __meta_kubernetes_pod_label_(.+)
          - source_labels: [__meta_kubernetes_namespace]
            action: replace
            target_label: kubernetes_namespace
          - source_labels: [__meta_kubernetes_pod_name]
            action: replace
            target_label: kubernetes_pod_name
      
      # Application Metrics
      - job_name: 'user-service'
        kubernetes_sd_configs:
          - role: endpoints
            namespaces:
              names:
                - production
        relabel_configs:
          - source_labels: [__meta_kubernetes_service_label_app]
            action: keep
            regex: user-service
          - source_labels: [__meta_kubernetes_endpoint_port_name]
            action: keep
            regex: metrics
      
      # Infrastructure Metrics
      - job_name: 'node-exporter'
        kubernetes_sd_configs:
          - role: endpoints
        relabel_configs:
          - source_labels: [__meta_kubernetes_endpoints_name]
            action: keep
            regex: node-exporter
      
      # AWS CloudWatch Metrics
      - job_name: 'cloudwatch-exporter'
        static_configs:
          - targets: ['cloudwatch-exporter:9106']
        scrape_interval: 60s
      
      # Database Metrics
      - job_name: 'postgres-exporter'
        static_configs:
          - targets: ['postgres-exporter:9187']
      
      - job_name: 'redis-exporter'
        static_configs:
          - targets: ['redis-exporter:9121']

---
# AlertManager Configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: monitoring
data:
  alertmanager.yml: |
    global:
      smtp_smarthost: 'localhost:587'
      smtp_from: 'alerts@example.com'
    
    route:
      group_by: ['alertname', 'cluster', 'service']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 1h
      receiver: 'web.hook'
      routes:
        - match:
            severity: critical
          receiver: 'critical-alerts'
          group_wait: 10s
          repeat_interval: 5m
        - match:
            severity: warning
          receiver: 'warning-alerts'
          repeat_interval: 30m
    
    receivers:
      - name: 'web.hook'
        webhook_configs:
          - url: 'http://alertmanager-webhook:8080/webhook'
      
      - name: 'critical-alerts'
        slack_configs:
          - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
            channel: '#alerts-critical'
            title: 'Critical Alert: {{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
            text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
        pagerduty_configs:
          - service_key: 'YOUR_PAGERDUTY_SERVICE_KEY'
            description: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
      
      - name: 'warning-alerts'
        slack_configs:
          - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
            channel: '#alerts-warning'
            title: 'Warning: {{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
            text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
    
    inhibit_rules:
      - source_match:
          severity: 'critical'
        target_match:
          severity: 'warning'
        equal: ['alertname', 'cluster', 'service']

---
# Prometheus Rules
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-rules
  namespace: monitoring
data:
  kubernetes.yml: |
    groups:
      - name: kubernetes
        rules:
          - alert: KubernetesPodCrashLooping
            expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "Pod {{ \$labels.namespace }}/{{ \$labels.pod }} is crash looping"
              description: "Pod {{ \$labels.namespace }}/{{ \$labels.pod }} has been restarting {{ \$value }} times in the last 15 minutes"
          
          - alert: KubernetesPodNotReady
            expr: kube_pod_status_ready{condition="false"} == 1
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "Pod {{ \$labels.namespace }}/{{ \$labels.pod }} is not ready"
              description: "Pod {{ \$labels.namespace }}/{{ \$labels.pod }} has been in a non-ready state for more than 5 minutes"
          
          - alert: KubernetesNodeNotReady
            expr: kube_node_status_ready{condition="false"} == 1
            for: 5m
            labels:
              severity: critical
            annotations:
              summary: "Node {{ \$labels.node }} is not ready"
              description: "Node {{ \$labels.node }} has been in a not-ready state for more than 5 minutes"
          
          - alert: KubernetesHighMemoryUsage
            expr: (kube_node_status_allocatable_memory_bytes - kube_node_status_capacity_memory_bytes) / kube_node_status_allocatable_memory_bytes * 100 > 90
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "Node {{ \$labels.node }} has high memory usage"
              description: "Node {{ \$labels.node }} memory usage is above 90%"
  
  application.yml: |
    groups:
      - name: application
        rules:
          - alert: HighErrorRate
            expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.1
            for: 5m
            labels:
              severity: critical
            annotations:
              summary: "High error rate for {{ \$labels.service }}"
              description: "Error rate is {{ \$value | humanizePercentage }} for service {{ \$labels.service }}"
          
          - alert: HighLatency
            expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "High latency for {{ \$labels.service }}"
              description: "95th percentile latency is {{ \$value }}s for service {{ \$labels.service }}"
          
          - alert: DatabaseConnectionPoolHigh
            expr: db_connection_pool_used / db_connection_pool_max > 0.8
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "Database connection pool usage high"
              description: "Database connection pool usage is {{ \$value | humanizePercentage }} for {{ \$labels.database }}"
\`\`\`

### Grafana Dashboards
\`\`\`json
{
  "dashboard": {
    "id": null,
    "title": "Kubernetes Cluster Overview",
    "uid": "kubernetes-overview",
    "version": 1,
    "schemaVersion": 30,
    "panels": [
      {
        "id": 1,
        "title": "Cluster CPU Usage",
        "type": "stat",
        "targets": [
          {
            "expr": "100 - (avg(irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU Usage %"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 70},
                {"color": "red", "value": 90}
              ]
            },
            "unit": "percent"
          }
        },
        "gridPos": {"h": 6, "w": 6, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Cluster Memory Usage",
        "type": "stat",
        "targets": [
          {
            "expr": "100 * (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes))",
            "legendFormat": "Memory Usage %"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 70},
                {"color": "red", "value": 90}
              ]
            },
            "unit": "percent"
          }
        },
        "gridPos": {"h": 6, "w": 6, "x": 6, "y": 0}
      },
      {
        "id": 3,
        "title": "Pod Status",
        "type": "piechart",
        "targets": [
          {
            "expr": "count by (phase) (kube_pod_status_phase)",
            "legendFormat": "{{phase}}"
          }
        ],
        "gridPos": {"h": 6, "w": 6, "x": 12, "y": 0}
      },
      {
        "id": 4,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (service)",
            "legendFormat": "{{service}}"
          }
        ],
        "yAxes": [
          {
            "label": "Requests/sec"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 6}
      },
      {
        "id": 5,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))",
            "legendFormat": "95th percentile - {{service}}"
          },
          {
            "expr": "histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))",
            "legendFormat": "50th percentile - {{service}}"
          }
        ],
        "yAxes": [
          {
            "label": "Seconds"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 6}
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

## Distributed Tracing with Jaeger

### Jaeger Configuration
\`\`\`yaml
# Jaeger All-in-One Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jaeger
  namespace: observability
spec:
  replicas: 1
  selector:
    matchLabels:
      app: jaeger
  template:
    metadata:
      labels:
        app: jaeger
    spec:
      containers:
      - name: jaeger
        image: jaegertracing/all-in-one:latest
        ports:
        - containerPort: 16686
          name: ui
        - containerPort: 14268
          name: collector
        - containerPort: 6831
          name: agent-udp
        - containerPort: 6832
          name: agent-binary
        env:
        - name: COLLECTOR_ZIPKIN_HTTP_PORT
          value: "9411"
        - name: SPAN_STORAGE_TYPE
          value: "elasticsearch"
        - name: ES_SERVER_URLS
          value: "http://elasticsearch:9200"

---
# OpenTelemetry Collector
apiVersion: v1
kind: ConfigMap
metadata:
  name: otel-collector-config
  namespace: observability
data:
  config.yaml: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318
      jaeger:
        protocols:
          grpc:
            endpoint: 0.0.0.0:14250
          thrift_binary:
            endpoint: 0.0.0.0:6832
          thrift_compact:
            endpoint: 0.0.0.0:6831
          thrift_http:
            endpoint: 0.0.0.0:14268
    
    processors:
      batch:
        timeout: 1s
        send_batch_size: 1024
      memory_limiter:
        limit_mib: 512
      resource:
        attributes:
          - key: environment
            value: production
            action: upsert
    
    exporters:
      jaeger:
        endpoint: jaeger:14250
        tls:
          insecure: true
      prometheus:
        endpoint: "0.0.0.0:8889"
      logging:
        loglevel: debug
    
    service:
      pipelines:
        traces:
          receivers: [otlp, jaeger]
          processors: [memory_limiter, batch, resource]
          exporters: [jaeger, logging]
        metrics:
          receivers: [otlp]
          processors: [memory_limiter, batch, resource]
          exporters: [prometheus, logging]

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: otel-collector
  namespace: observability
spec:
  replicas: 1
  selector:
    matchLabels:
      app: otel-collector
  template:
    metadata:
      labels:
        app: otel-collector
    spec:
      containers:
      - name: otel-collector
        image: otel/opentelemetry-collector-contrib:latest
        args:
        - --config=/conf/config.yaml
        ports:
        - containerPort: 4317
          name: otlp-grpc
        - containerPort: 4318
          name: otlp-http
        - containerPort: 8889
          name: prometheus
        volumeMounts:
        - name: config
          mountPath: /conf
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
      volumes:
      - name: config
        configMap:
          name: otel-collector-config
\`\`\`

### Application Instrumentation Example
\`\`\`javascript
// Node.js OpenTelemetry Instrumentation
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-otlp-http');

// Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'user-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.SERVICE_VERSION || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  }),
  traceExporter: new OTLPTraceExporter({
    url: 'http://otel-collector:4318/v1/traces',
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: 'http://otel-collector:4318/v1/metrics',
    }),
    exportIntervalMillis: 1000,
  }),
  instrumentations: [getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-http': {
      ignoreIncomingRequestHook: (req) => {
        return req.url?.includes('/health') || req.url?.includes('/metrics');
      }
    }
  })]
});

sdk.start();

// Custom instrumentation example
const opentelemetry = require('@opentelemetry/api');
const tracer = opentelemetry.trace.getTracer('user-service');
const meter = opentelemetry.metrics.getMeter('user-service');

// Custom metrics
const httpRequestCounter = meter.createCounter('http_requests_total', {
  description: 'Total number of HTTP requests'
});

const httpRequestDuration = meter.createHistogram('http_request_duration_seconds', {
  description: 'HTTP request duration in seconds'
});

// Express middleware for custom metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    httpRequestCounter.add(1, {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode.toString()
    });
    
    httpRequestDuration.record(duration, {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode.toString()
    });
  });
  
  next();
};

// Custom span example
const getUserWithTracing = async (userId) => {
  const span = tracer.startSpan('get_user');
  
  try {
    span.setAttributes({
      'user.id': userId,
      'operation.name': 'get_user'
    });
    
    // Database operation
    const dbSpan = tracer.startSpan('db.query', { parent: span });
    try {
      const user = await db.users.findById(userId);
      dbSpan.setAttributes({
        'db.operation': 'findById',
        'db.table': 'users'
      });
      return user;
    } finally {
      dbSpan.end();
    }
  } catch (error) {
    span.recordException(error);
    span.setStatus({
      code: opentelemetry.SpanStatusCode.ERROR,
      message: error.message
    });
    throw error;
  } finally {
    span.end();
  }
};

module.exports = { metricsMiddleware, getUserWithTracing };
\`\`\`

## Log Aggregation with ELK Stack

### Elasticsearch and Kibana Configuration
\`\`\`yaml
# Elasticsearch StatefulSet
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: elasticsearch
  namespace: logging
spec:
  serviceName: elasticsearch
  replicas: 3
  selector:
    matchLabels:
      app: elasticsearch
  template:
    metadata:
      labels:
        app: elasticsearch
    spec:
      containers:
      - name: elasticsearch
        image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
        ports:
        - containerPort: 9200
          name: http
        - containerPort: 9300
          name: transport
        env:
        - name: cluster.name
          value: "kubernetes-logs"
        - name: node.name
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: discovery.seed_hosts
          value: "elasticsearch-0.elasticsearch,elasticsearch-1.elasticsearch,elasticsearch-2.elasticsearch"
        - name: cluster.initial_master_nodes
          value: "elasticsearch-0,elasticsearch-1,elasticsearch-2"
        - name: ES_JAVA_OPTS
          value: "-Xms1g -Xmx1g"
        - name: xpack.security.enabled
          value: "false"
        volumeMounts:
        - name: data
          mountPath: /usr/share/elasticsearch/data
        resources:
          requests:
            memory: "2Gi"
            cpu: "500m"
          limits:
            memory: "4Gi"
            cpu: "1"
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 50Gi

---
# Logstash Configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: logstash-config
  namespace: logging
data:
  logstash.yml: |
    http.host: "0.0.0.0"
    path.config: /usr/share/logstash/pipeline
  pipelines.yml: |
    - pipeline.id: kubernetes
      path.config: "/usr/share/logstash/pipeline/kubernetes.conf"
  kubernetes.conf: |
    input {
      beats {
        port => 5044
      }
    }
    
    filter {
      if [kubernetes] {
        if [kubernetes][container][name] == "user-service" {
          json {
            source => "message"
          }
          
          date {
            match => [ "timestamp", "ISO8601" ]
          }
          
          if [level] {
            mutate {
              add_field => { "log_level" => "%{level}" }
            }
          }
        }
        
        # Parse nginx logs
        if [kubernetes][container][name] == "nginx" {
          grok {
            match => { "message" => "%{COMBINEDAPACHELOG}" }
          }
          
          date {
            match => [ "timestamp", "dd/MMM/yyyy:HH:mm:ss Z" ]
          }
          
          mutate {
            convert => { "response" => "integer" }
            convert => { "bytes" => "integer" }
          }
        }
      }
      
      # Add custom fields
      mutate {
        add_field => { "[@metadata][index]" => "logstash-%{+YYYY.MM.dd}" }
      }
    }
    
    output {
      elasticsearch {
        hosts => ["elasticsearch:9200"]
        index => "%{[@metadata][index]}"
      }
      
      stdout {
        codec => rubydebug
      }
    }

---
# Filebeat DaemonSet
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: filebeat
  namespace: logging
spec:
  selector:
    matchLabels:
      app: filebeat
  template:
    metadata:
      labels:
        app: filebeat
    spec:
      serviceAccountName: filebeat
      containers:
      - name: filebeat
        image: docker.elastic.co/beats/filebeat:8.8.0
        args: [
          "-c", "/etc/filebeat.yml",
          "-e"
        ]
        securityContext:
          runAsUser: 0
        volumeMounts:
        - name: config
          mountPath: /etc/filebeat.yml
          subPath: filebeat.yml
        - name: data
          mountPath: /usr/share/filebeat/data
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
        - name: varlog
          mountPath: /var/log
          readOnly: true
        env:
        - name: NODE_NAME
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName
      volumes:
      - name: config
        configMap:
          name: filebeat-config
      - name: data
        hostPath:
          path: /var/lib/filebeat-data
          type: DirectoryOrCreate
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
      - name: varlog
        hostPath:
          path: /var/log

---
# Filebeat ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: filebeat-config
  namespace: logging
data:
  filebeat.yml: |
    filebeat.inputs:
    - type: container
      paths:
        - /var/log/containers/*.log
      processors:
        - add_kubernetes_metadata:
            host: \${NODE_NAME}
            matchers:
            - logs_path:
                logs_path: "/var/log/containers/"
    
    output.logstash:
      hosts: ["logstash:5044"]
    
    processors:
      - add_host_metadata:
          when.not.contains.tags: forwarded
    
    logging.level: info
    logging.to_files: true
    logging.files:
      path: /var/log/filebeat
      name: filebeat
      keepfiles: 7
      permissions: 0644
\`\`\`

This comprehensive monitoring and observability setup provides full visibility into cloud infrastructure and applications with metrics, traces, and logs all integrated into a unified observability platform.`;
  }

  async troubleshoot(issue) {
    const solutions = {
      scalability_issues: [
        'Implement horizontal pod autoscaling and cluster autoscaling',
        'Use load balancers and implement proper caching strategies',
        'Optimize database queries and implement read replicas',
        'Consider microservices architecture for better scaling',
        'Implement CDN for static content distribution'
      ],
      high_costs: [
        'Implement resource quotas and limits for cost control',
        'Use spot instances and reserved instances where appropriate',
        'Optimize storage usage with lifecycle policies',
        'Regular cost analysis and unused resource cleanup',
        'Implement auto-scaling to match demand with resources'
      ],
      security_concerns: [
        'Implement zero-trust security model with proper RBAC',
        'Use secrets management and rotate credentials regularly',
        'Enable audit logging and continuous security monitoring',
        'Implement network policies and service mesh security',
        'Regular security scans and compliance checks'
      ],
      monitoring_gaps: [
        'Implement comprehensive observability with metrics, traces, and logs',
        'Set up proper alerting with escalation procedures',
        'Use distributed tracing for complex request flows',
        'Implement custom business metrics and SLI/SLO monitoring',
        'Regular monitoring review and dashboard optimization'
      ],
      deployment_issues: [
        'Implement proper CI/CD pipelines with quality gates',
        'Use infrastructure as code for consistent deployments',
        'Implement blue-green or canary deployment strategies',
        'Set up proper testing environments and procedures',
        'Implement rollback procedures and disaster recovery'
      ]
    };
    
    return solutions[issue.type] || ['Review cloud architecture best practices and documentation'];
  }
}

module.exports = CloudArchitectureSpecialist;