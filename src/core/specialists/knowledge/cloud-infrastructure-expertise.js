/**
 * BUMBA Cloud & Infrastructure Specialists Expertise
 * Enhanced knowledge for Cloud Architecture, Infrastructure Engineering, and Platform Operations specialists
 * Sprint 16 Implementation
 */

class CloudInfrastructureExpertise {
  /**
   * Cloud Architecture Expert Knowledge
   */
  static getCloudArchitectureExpertise() {
    return {
      name: 'Cloud Architecture Expert',
      expertise: {
        core: {
          architecture_design: 'Multi-cloud architecture, hybrid cloud, cloud-native design patterns',
          cloud_platforms: 'AWS, Azure, GCP architecture and services integration',
          scalability: 'Auto-scaling, load balancing, performance optimization, cost optimization',
          security: 'Cloud security architecture, IAM, network security, compliance',
          migration: 'Cloud migration strategies, modernization, lift-and-shift, re-architecting'
        },
        
        aws: {
          compute: 'EC2, Lambda, ECS, EKS, Fargate, Auto Scaling Groups',
          storage: 'S3, EBS, EFS, FSx, Storage Gateway, CloudFormation',
          networking: 'VPC, Route 53, CloudFront, API Gateway, Direct Connect',
          database: 'RDS, DynamoDB, Aurora, Redshift, ElastiCache, DocumentDB',
          security: 'IAM, KMS, Secrets Manager, WAF, Shield, GuardDuty'
        },
        
        azure: {
          compute: 'Virtual Machines, App Service, Functions, Container Instances, AKS',
          storage: 'Blob Storage, Disk Storage, File Storage, Data Lake Storage',
          networking: 'Virtual Network, Load Balancer, Application Gateway, CDN',
          database: 'SQL Database, Cosmos DB, PostgreSQL, MySQL, Synapse',
          security: 'Azure AD, Key Vault, Security Center, Sentinel, Application Gateway'
        },
        
        gcp: {
          compute: 'Compute Engine, Cloud Functions, Cloud Run, GKE, App Engine',
          storage: 'Cloud Storage, Persistent Disk, Filestore, Cloud SQL',
          networking: 'VPC, Cloud Load Balancing, Cloud CDN, Cloud NAT',
          database: 'Cloud SQL, Firestore, BigQuery, Spanner, Bigtable',
          security: 'Cloud IAM, Cloud KMS, Security Command Center, Cloud Armor'
        },
        
        patterns: {
          microservices: 'Service mesh, API management, container orchestration',
          serverless: 'Function-as-a-Service, event-driven architecture, serverless databases',
          data_architecture: 'Data lakes, data warehouses, real-time analytics, ETL pipelines',
          observability: 'Monitoring, logging, tracing, alerting, performance optimization'
        }
      },
      
      capabilities: [
        'Multi-cloud architecture design and strategy',
        'Cloud migration planning and execution',
        'Serverless and container architecture',
        'Cloud security and compliance frameworks',
        'Cost optimization and resource management',
        'High availability and disaster recovery',
        'Auto-scaling and performance optimization',
        'Cloud-native application architecture',
        'Hybrid and multi-cloud integration',
        'Infrastructure as Code (IaC) design',
        'Microservices and API architecture',
        'Data architecture and analytics platforms',
        'Cloud monitoring and observability',
        'DevOps and CI/CD pipeline architecture',
        'Cloud networking and security',
        'Enterprise cloud governance and policies'
      ],
      
      systemPromptAdditions: `
You are a Cloud Architecture expert specializing in:
- Multi-cloud and hybrid cloud architecture design
- AWS, Azure, and GCP platform expertise
- Cloud-native application patterns and microservices
- Cloud security, compliance, and governance
- Migration strategies and modernization
- Cost optimization and performance tuning
- Infrastructure as Code and automation

Always focus on scalable, secure, and cost-effective cloud solutions aligned with business objectives.`,

      bestPractices: [
        'Design for cloud-native principles and scalability',
        'Implement multi-cloud strategies for vendor diversity',
        'Use Infrastructure as Code for consistency and repeatability',
        'Design for high availability and disaster recovery',
        'Implement comprehensive security and compliance frameworks',
        'Optimize costs through rightsizing and automation',
        'Use managed services to reduce operational overhead',
        'Implement proper monitoring and observability',
        'Design for performance and auto-scaling',
        'Use microservices and API-first architecture',
        'Implement proper data architecture and governance',
        'Plan for cloud migration and modernization',
        'Use containers and serverless where appropriate',
        'Implement DevOps and CI/CD best practices',
        'Design for global distribution and edge computing'
      ],
      
      codePatterns: {
        terraformInfrastructure: `
# Multi-Cloud Infrastructure as Code

## AWS Infrastructure
\`\`\`hcl
# Terraform configuration for AWS
provider "aws" {
  region = var.aws_region
}

# VPC and networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "main-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count = 2
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.\${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "public-subnet-\${count.index + 1}"
    Type = "public"
  }
}

resource "aws_subnet" "private" {
  count = 2
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.\${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name = "private-subnet-\${count.index + 1}"
    Type = "private"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name = "main-igw"
  }
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = "main-cluster"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"
  
  vpc_config {
    subnet_ids              = concat(aws_subnet.public[*].id, aws_subnet.private[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = ["0.0.0.0/0"]
  }
  
  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }
  
  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
  
  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_cloudwatch_log_group.eks
  ]
}
\`\`\`

## Azure Infrastructure
\`\`\`hcl
# Terraform configuration for Azure
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "main" {
  name     = "rg-\${var.project}-\${var.environment}"
  location = var.azure_location
  
  tags = {
    Environment = var.environment
    Project     = var.project
  }
}

resource "azurerm_virtual_network" "main" {
  name                = "vnet-\${var.project}-\${var.environment}"
  address_space       = ["10.1.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  
  tags = azurerm_resource_group.main.tags
}

resource "azurerm_subnet" "aks" {
  name                 = "subnet-aks"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.1.1.0/24"]
}

resource "azurerm_kubernetes_cluster" "main" {
  name                = "aks-\${var.project}-\${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = "aks-\${var.project}-\${var.environment}"
  
  default_node_pool {
    name           = "default"
    node_count     = 3
    vm_size        = "Standard_D2_v2"
    vnet_subnet_id = azurerm_subnet.aks.id
    
    upgrade_settings {
      max_surge = "10%"
    }
  }
  
  identity {
    type = "SystemAssigned"
  }
  
  network_profile {
    network_plugin = "azure"
    network_policy = "azure"
  }
  
  tags = azurerm_resource_group.main.tags
}
\`\`\`

## GCP Infrastructure
\`\`\`hcl
# Terraform configuration for GCP
provider "google" {
  project = var.gcp_project
  region  = var.gcp_region
}

resource "google_container_cluster" "main" {
  name     = "main-cluster"
  location = var.gcp_region
  
  # Remove default node pool
  remove_default_node_pool = true
  initial_node_count       = 1
  
  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name
  
  # Enable Workload Identity
  workload_identity_config {
    workload_pool = "\${var.gcp_project}.svc.id.goog"
  }
  
  # Enable network policy
  network_policy {
    enabled = true
  }
  
  # Private cluster configuration
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }
  
  # IP allocation policy
  ip_allocation_policy {
    cluster_ipv4_cidr_block  = "10.2.0.0/16"
    services_ipv4_cidr_block = "10.3.0.0/16"
  }
}

resource "google_compute_network" "vpc" {
  name                    = "main-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "main-subnet"
  ip_cidr_range = "10.1.0.0/24"
  region        = var.gcp_region
  network       = google_compute_network.vpc.id
  
  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.2.0.0/16"
  }
  
  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.3.0.0/16"
  }
}
\`\`\``,

        cloudMigration: `
# Cloud Migration Strategy Framework

## Assessment and Planning Phase
\`\`\`python
# Cloud readiness assessment tool
import json
import pandas as pd
from datetime import datetime

class CloudReadinessAssessment:
    def __init__(self):
        self.assessment_criteria = {
            'application_factors': {
                'architecture': ['monolithic', 'microservices', 'soa'],
                'technology_stack': ['modern', 'legacy', 'mixed'],
                'dependencies': ['high', 'medium', 'low'],
                'state_management': ['stateless', 'stateful', 'mixed']
            },
            'data_factors': {
                'data_size': ['small', 'medium', 'large', 'very_large'],
                'data_sensitivity': ['public', 'internal', 'confidential', 'restricted'],
                'data_compliance': ['none', 'regional', 'industry', 'strict'],
                'data_latency': ['tolerant', 'moderate', 'sensitive', 'critical']
            },
            'infrastructure_factors': {
                'current_hosting': ['on_premises', 'colocation', 'hybrid', 'cloud'],
                'networking': ['simple', 'complex', 'very_complex'],
                'security_requirements': ['basic', 'moderate', 'high', 'critical'],
                'availability_requirements': ['standard', 'high', 'very_high']
            }
        }
    
    def assess_application(self, app_config):
        """Assess application readiness for cloud migration"""
        
        score = 0
        recommendations = []
        
        # Architecture assessment
        if app_config.get('architecture') == 'microservices':
            score += 20
            recommendations.append("Microservices architecture is ideal for cloud")
        elif app_config.get('architecture') == 'monolithic':
            score += 5
            recommendations.append("Consider refactoring to microservices")
        
        # Technology stack assessment
        if app_config.get('technology_stack') == 'modern':
            score += 15
        elif app_config.get('technology_stack') == 'legacy':
            score += 2
            recommendations.append("Modernize technology stack before migration")
        
        # Dependencies assessment
        if app_config.get('dependencies') == 'low':
            score += 15
        elif app_config.get('dependencies') == 'high':
            score += 3
            recommendations.append("Map and minimize dependencies")
        
        # Determine migration strategy
        if score >= 40:
            strategy = "Rehost (Lift and Shift) or Refactor"
        elif score >= 25:
            strategy = "Replatform with modifications"
        else:
            strategy = "Refactor or Rebuild recommended"
        
        return {
            'score': score,
            'strategy': strategy,
            'recommendations': recommendations,
            'assessment_date': datetime.now().isoformat()
        }
    
    def generate_migration_plan(self, applications):
        """Generate comprehensive migration plan"""
        
        migration_waves = {
            'wave_1': [],  # Low risk, high value
            'wave_2': [],  # Medium complexity
            'wave_3': [],  # High complexity, high risk
            'future': []   # Requires significant refactoring
        }
        
        for app in applications:
            assessment = self.assess_application(app)
            
            if assessment['score'] >= 40 and app.get('business_value') == 'high':
                migration_waves['wave_1'].append({
                    'name': app['name'],
                    'strategy': assessment['strategy'],
                    'timeline': '3-6 months'
                })
            elif assessment['score'] >= 25:
                migration_waves['wave_2'].append({
                    'name': app['name'],
                    'strategy': assessment['strategy'],
                    'timeline': '6-12 months'
                })
            elif assessment['score'] >= 15:
                migration_waves['wave_3'].append({
                    'name': app['name'],
                    'strategy': assessment['strategy'],
                    'timeline': '12-18 months'
                })
            else:
                migration_waves['future'].append({
                    'name': app['name'],
                    'strategy': 'Rebuild or Replace',
                    'timeline': '18+ months'
                })
        
        return migration_waves

# Example usage
assessor = CloudReadinessAssessment()

applications = [
    {
        'name': 'Customer Portal',
        'architecture': 'microservices',
        'technology_stack': 'modern',
        'dependencies': 'low',
        'business_value': 'high'
    },
    {
        'name': 'Legacy ERP System',
        'architecture': 'monolithic',
        'technology_stack': 'legacy',
        'dependencies': 'high',
        'business_value': 'critical'
    }
]

migration_plan = assessor.generate_migration_plan(applications)
\`\`\`

## Migration Execution Framework
\`\`\`yaml
# Migration pipeline configuration
migration_pipeline:
  phases:
    - name: "Discovery and Assessment"
      duration: "2-4 weeks"
      activities:
        - application_inventory
        - dependency_mapping
        - performance_baseline
        - security_assessment
        - cost_analysis
    
    - name: "Design and Planning"
      duration: "3-6 weeks"
      activities:
        - target_architecture_design
        - migration_strategy_definition
        - security_design
        - disaster_recovery_planning
        - testing_strategy
    
    - name: "Proof of Concept"
      duration: "2-4 weeks"
      activities:
        - pilot_application_selection
        - infrastructure_setup
        - application_migration_test
        - performance_validation
        - security_testing
    
    - name: "Migration Execution"
      duration: "varies by wave"
      activities:
        - infrastructure_provisioning
        - data_migration
        - application_deployment
        - testing_and_validation
        - cutover_execution
    
    - name: "Optimization"
      duration: "ongoing"
      activities:
        - performance_tuning
        - cost_optimization
        - security_hardening
        - monitoring_setup
        - documentation_update

  success_criteria:
    performance:
      - "Response time within 10% of baseline"
      - "Throughput maintained or improved"
      - "99.9% availability target"
    
    security:
      - "All security controls implemented"
      - "Compliance requirements met"
      - "Vulnerability scan clean"
    
    cost:
      - "Total cost of ownership reduction"
      - "Resource utilization > 70%"
      - "No unexpected charges"
\`\`\``,

        serverlessArchitecture: `
# Serverless Architecture Patterns

## Event-Driven Microservices
\`\`\`yaml
# AWS SAM template for serverless microservices
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues: [dev, staging, prod]

Globals:
  Function:
    Runtime: python3.9
    Timeout: 30
    MemorySize: 512
    Environment:
      Variables:
        ENVIRONMENT: !Ref Environment
        LOG_LEVEL: INFO

Resources:
  # API Gateway
  ApiGateway:
    Type: AWS::Serverless::Api
    Properties:
      StageName: !Ref Environment
      Cors:
        AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
        AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
        AllowOrigin: "'*'"
      Auth:
        DefaultAuthorizer: CognitoAuthorizer
        Authorizers:
          CognitoAuthorizer:
            UserPoolArn: !GetAtt UserPool.Arn

  # User Management Service
  UserFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/user_service/
      Handler: handler.lambda_handler
      Events:
        CreateUser:
          Type: Api
          Properties:
            RestApiId: !Ref ApiGateway
            Path: /users
            Method: POST
        GetUser:
          Type: Api
          Properties:
            RestApiId: !Ref ApiGateway
            Path: /users/{id}
            Method: GET
      Environment:
        Variables:
          USER_TABLE: !Ref UserTable
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref UserTable

  # Order Processing Service
  OrderFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/order_service/
      Handler: handler.lambda_handler
      Events:
        ProcessOrder:
          Type: Api
          Properties:
            RestApiId: !Ref ApiGateway
            Path: /orders
            Method: POST
        OrderStatus:
          Type: Api
          Properties:
            RestApiId: !Ref ApiGateway
            Path: /orders/{id}/status
            Method: GET
        OrderEvent:
          Type: SQS
          Properties:
            Queue: !GetAtt OrderQueue.Arn
            BatchSize: 10
      Environment:
        Variables:
          ORDER_TABLE: !Ref OrderTable
          PAYMENT_QUEUE: !Ref PaymentQueue
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref OrderTable
        - SQSSendMessagePolicy:
            QueueName: !GetAtt PaymentQueue.QueueName

  # Payment Processing Service
  PaymentFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/payment_service/
      Handler: handler.lambda_handler
      Events:
        ProcessPayment:
          Type: SQS
          Properties:
            Queue: !GetAtt PaymentQueue.Arn
            BatchSize: 5
      Environment:
        Variables:
          PAYMENT_TABLE: !Ref PaymentTable
          NOTIFICATION_TOPIC: !Ref NotificationTopic
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref PaymentTable
        - SNSPublishMessagePolicy:
            TopicName: !GetAtt NotificationTopic.TopicName

  # DynamoDB Tables
  UserTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub "users-\${Environment}"
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES

  OrderTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub "orders-\${Environment}"
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: orderId
          AttributeType: S
        - AttributeName: userId
          AttributeType: S
      KeySchema:
        - AttributeName: orderId
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: UserIndex
          KeySchema:
            - AttributeName: userId
              KeyType: HASH
          Projection:
            ProjectionType: ALL

  # SQS Queues
  OrderQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub "order-queue-\${Environment}"
      VisibilityTimeoutSeconds: 180
      MessageRetentionPeriod: 1209600  # 14 days
      DeadLetterQueue:
        TargetArn: !GetAtt OrderDLQ.Arn
        MaxReceiveCount: 3

  PaymentQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub "payment-queue-\${Environment}"
      VisibilityTimeoutSeconds: 180

  # SNS Topic for notifications
  NotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub "notifications-\${Environment}"
\`\`\`

## Serverless Data Processing Pipeline
\`\`\`python
# AWS Lambda function for data processing
import json
import boto3
import pandas as pd
from datetime import datetime
import os

# Initialize AWS services
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
stepfunctions = boto3.client('stepfunctions')

def lambda_handler(event, context):
    """
    Process incoming data files and trigger downstream workflows
    """
    
    try:
        # Parse S3 event
        for record in event['Records']:
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
            
            # Download and process file
            response = s3.get_object(Bucket=bucket, Key=key)
            content = response['Body'].read()
            
            # Determine file type and process accordingly
            if key.endswith('.csv'):
                processed_data = process_csv_file(content)
            elif key.endswith('.json'):
                processed_data = process_json_file(content)
            else:
                raise ValueError(f"Unsupported file type: {key}")
            
            # Store processed data
            store_processed_data(processed_data, key)
            
            # Trigger downstream workflow
            trigger_workflow(processed_data, key)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data processed successfully',
                'processed_files': len(event['Records'])
            })
        }
        
    except Exception as e:
        print(f"Error processing data: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }

def process_csv_file(content):
    """Process CSV file content"""
    
    # Read CSV into DataFrame
    df = pd.read_csv(pd.io.common.StringIO(content.decode('utf-8')))
    
    # Data validation
    if df.empty:
        raise ValueError("CSV file is empty")
    
    # Data cleansing
    df = df.dropna()  # Remove rows with missing values
    df = df.drop_duplicates()  # Remove duplicate rows
    
    # Data transformation
    if 'timestamp' in df.columns:
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['processing_date'] = datetime.now().isoformat()
    
    # Convert to records for storage
    return df.to_dict('records')

def process_json_file(content):
    """Process JSON file content"""
    
    data = json.loads(content.decode('utf-8'))
    
    # Validate JSON structure
    if not isinstance(data, (list, dict)):
        raise ValueError("Invalid JSON structure")
    
    # Normalize data structure
    if isinstance(data, dict):
        data = [data]
    
    # Add processing metadata
    for record in data:
        record['processing_date'] = datetime.now().isoformat()
        record['processed_by'] = 'serverless-pipeline'
    
    return data

def store_processed_data(data, original_key):
    """Store processed data in DynamoDB"""
    
    table_name = os.environ['PROCESSED_DATA_TABLE']
    table = dynamodb.Table(table_name)
    
    # Batch write to DynamoDB
    with table.batch_writer() as batch:
        for record in data:
            # Generate unique ID
            record['id'] = f"{original_key}-{hash(str(record))}"
            batch.put_item(Item=record)

def trigger_workflow(data, key):
    """Trigger Step Functions workflow for further processing"""
    
    state_machine_arn = os.environ['WORKFLOW_STATE_MACHINE_ARN']
    
    # Prepare workflow input
    workflow_input = {
        'source_file': key,
        'record_count': len(data),
        'processing_timestamp': datetime.now().isoformat(),
        'data_sample': data[:5] if len(data) > 5 else data
    }
    
    # Start workflow execution
    response = stepfunctions.start_execution(
        stateMachineArn=state_machine_arn,
        name=f"process-{key.replace('/', '-')}-{int(datetime.now().timestamp())}",
        input=json.dumps(workflow_input)
    )
    
    print(f"Started workflow execution: {response['executionArn']}")
\`\`\`

## Multi-Cloud Serverless Deployment
\`\`\`yaml
# Serverless Framework configuration for multi-cloud deployment
service: multi-cloud-serverless-app

frameworkVersion: '3'

plugins:
  - serverless-azure-functions
  - serverless-google-cloudfunctions

provider:
  name: aws
  runtime: python3.9
  stage: \${opt:stage, 'dev'}
  region: \${opt:region, 'us-east-1'}
  
  environment:
    STAGE: \${self:provider.stage}
    REGION: \${self:provider.region}
  
  iamRoleStatements:
    - Effect: Allow
      Action:
        - dynamodb:Query
        - dynamodb:Scan
        - dynamodb:GetItem
        - dynamodb:PutItem
        - dynamodb:UpdateItem
        - dynamodb:DeleteItem
      Resource:
        - "arn:aws:dynamodb:\${self:provider.region}:*:table/\${self:service}-\${self:provider.stage}-*"

functions:
  # AWS Lambda functions
  apiHandler:
    handler: src/handlers/api.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
    environment:
      TABLE_NAME: \${self:service}-\${self:provider.stage}-data

  dataProcessor:
    handler: src/handlers/processor.handler
    events:
      - s3:
          bucket: \${self:service}-\${self:provider.stage}-uploads
          event: s3:ObjectCreated:*
    timeout: 300

  # Azure Functions
  azureApiHandler:
    handler: src/handlers/azure_api.js
    events:
      - http: true
    
  # Google Cloud Functions
  gcpApiHandler:
    handler: gcpHandler
    events:
      - http: gcpHandler

resources:
  Resources:
    # DynamoDB Table
    DataTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: \${self:service}-\${self:provider.stage}-data
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: id
            AttributeType: S
        KeySchema:
          - AttributeName: id
            KeyType: HASH

    # S3 Bucket
    UploadsBucket:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: \${self:service}-\${self:provider.stage}-uploads
        VersioningConfiguration:
          Status: Enabled
        PublicAccessBlockConfiguration:
          BlockPublicAcls: true
          BlockPublicPolicy: true
          IgnorePublicAcls: true
          RestrictPublicBuckets: true

# Azure-specific configuration
azure:
  subscriptionId: \${env:AZURE_SUBSCRIPTION_ID}
  resourceGroup: \${self:service}-\${self:provider.stage}
  location: East US

# Google Cloud-specific configuration
gcp:
  project: \${env:GCP_PROJECT_ID}
  region: us-central1
\`\`\`
      }
    };
  }
  
  /**
   * Infrastructure Engineering Expert Knowledge
   */
  static getInfrastructureEngineeringExpertise() {
    return {
      name: 'Infrastructure Engineering Expert',
      expertise: {
        core: {
          infrastructure_design: 'Scalable infrastructure architecture, capacity planning, performance optimization',
          automation: 'Infrastructure as Code, CI/CD pipelines, configuration management, deployment automation',
          monitoring: 'System monitoring, alerting, observability, performance metrics, log management',
          reliability: 'High availability, disaster recovery, fault tolerance, SLA management',
          security: 'Infrastructure security, hardening, compliance, vulnerability management'
        },
        
        technologies: {
          containerization: 'Docker, Kubernetes, container orchestration, service mesh',
          infrastructure_code: 'Terraform, CloudFormation, Ansible, Puppet, Chef',
          ci_cd: 'Jenkins, GitLab CI, GitHub Actions, Azure DevOps, CircleCI',
          monitoring: 'Prometheus, Grafana, ELK Stack, Datadog, New Relic, Splunk',
          networking: 'Load balancers, CDN, VPN, DNS, firewalls, proxy servers'
        },
        
        platforms: {
          linux: 'Linux administration, shell scripting, system optimization, security hardening',
          windows: 'Windows Server, PowerShell, Active Directory, IIS management',
          virtualization: 'VMware, Hyper-V, KVM, virtual machine management',
          cloud_native: 'Microservices, serverless, event-driven architecture'
        },
        
        operations: {
          capacity_planning: 'Resource forecasting, performance analysis, scaling strategies',
          incident_management: 'Incident response, root cause analysis, post-mortem processes',
          change_management: 'Change control, deployment strategies, rollback procedures',
          documentation: 'Runbooks, architecture diagrams, operational procedures'
        }
      },
      
      capabilities: [
        'Infrastructure architecture design and implementation',
        'Infrastructure as Code (IaC) development',
        'Container orchestration with Kubernetes',
        'CI/CD pipeline design and automation',
        'System monitoring and observability',
        'High availability and disaster recovery planning',
        'Performance optimization and capacity planning',
        'Security hardening and compliance',
        'Incident response and troubleshooting',
        'Configuration management and automation',
        'Network design and implementation',
        'Database infrastructure and optimization',
        'Backup and recovery strategy',
        'Cost optimization and resource management',
        'Documentation and knowledge management',
        'Team mentoring and best practices'
      ],
      
      systemPromptAdditions: `
You are an Infrastructure Engineering expert specializing in:
- Scalable infrastructure design and architecture
- Infrastructure as Code and automation
- Container orchestration and cloud-native technologies
- CI/CD pipelines and DevOps practices
- System monitoring, reliability, and performance optimization
- Security, compliance, and operational excellence
- Incident management and troubleshooting

Always focus on automation, reliability, security, and operational efficiency.`,

      bestPractices: [
        'Implement Infrastructure as Code for all infrastructure changes',
        'Design for high availability and fault tolerance',
        'Automate everything that can be automated',
        'Implement comprehensive monitoring and alerting',
        'Use immutable infrastructure patterns',
        'Practice configuration management and version control',
        'Implement proper backup and disaster recovery procedures',
        'Security harden all systems and follow compliance requirements',
        'Document all processes and maintain runbooks',
        'Implement proper change management procedures',
        'Use container orchestration for scalable applications',
        'Monitor and optimize performance and costs',
        'Implement proper logging and audit trails',
        'Practice incident response and post-mortem procedures',
        'Continuously improve processes and automation'
      ],
      
      codePatterns: {
        kubernetesDeployment: `
# Kubernetes Production Deployment

## Application Deployment
\`\`\`yaml
# Namespace
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    environment: production

---
# ConfigMap for application configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
data:
  database_url: "postgresql://db-host:5432/myapp"
  redis_url: "redis://redis-host:6379"
  log_level: "info"
  max_connections: "100"

---
# Secret for sensitive data
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: production
type: Opaque
data:
  database_password: <base64-encoded-password>
  api_key: <base64-encoded-api-key>
  jwt_secret: <base64-encoded-jwt-secret>

---
# Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
  labels:
    app: web-app
    version: v1.0.0
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
        version: v1.0.0
    spec:
      containers:
      - name: web-app
        image: myregistry/web-app:v1.0.0
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: DATABASE_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: database_url
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database_password
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: redis_url
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
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        securityContext:
          runAsNonRoot: true
          runAsUser: 1000
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
        volumeMounts:
        - name: temp-storage
          mountPath: /tmp
      volumes:
      - name: temp-storage
        emptyDir: {}
      securityContext:
        fsGroup: 1000

---
# Service
apiVersion: v1
kind: Service
metadata:
  name: web-app-service
  namespace: production
  labels:
    app: web-app
spec:
  selector:
    app: web-app
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
  name: web-app-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
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
# Pod Disruption Budget
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-app-pdb
  namespace: production
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: web-app

---
# Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-app-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - api.myapp.com
    secretName: web-app-tls
  rules:
  - host: api.myapp.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-app-service
            port:
              number: 80
\`\`\`

## Network Policies for Security
\`\`\`yaml
# Network policies for microsegmentation
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: web-app-netpol
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: web-app
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
  - to: []
    ports:
    - protocol: TCP
      port: 443  # HTTPS only
    - protocol: TCP
      port: 53   # DNS
    - protocol: UDP
      port: 53   # DNS
\`\`\``,

        ansibleAutomation: `
# Ansible Infrastructure Automation

## Server Hardening Playbook
\`\`\`yaml
---
- name: Linux Server Hardening
  hosts: all
  become: yes
  vars:
    ssh_port: 22022
    allowed_users: ["admin", "deployer"]
    fail2ban_enabled: true
    firewall_enabled: true
    
  tasks:
    - name: Update system packages
      package:
        name: "*"
        state: latest
      when: ansible_os_family == "RedHat"
      
    - name: Update system packages (Debian/Ubuntu)
      apt:
        upgrade: dist
        update_cache: yes
      when: ansible_os_family == "Debian"
      
    - name: Install essential security packages
      package:
        name:
          - fail2ban
          - ufw
          - aide
          - rkhunter
          - chkrootkit
          - logwatch
        state: present
        
    - name: Configure SSH hardening
      lineinfile:
        path: /etc/ssh/sshd_config
        regexp: "{{ item.regexp }}"
        line: "{{ item.line }}"
        backup: yes
      loop:
        - { regexp: '^#?Port', line: 'Port {{ ssh_port }}' }
        - { regexp: '^#?PermitRootLogin', line: 'PermitRootLogin no' }
        - { regexp: '^#?PasswordAuthentication', line: 'PasswordAuthentication no' }
        - { regexp: '^#?PermitEmptyPasswords', line: 'PermitEmptyPasswords no' }
        - { regexp: '^#?X11Forwarding', line: 'X11Forwarding no' }
        - { regexp: '^#?MaxAuthTries', line: 'MaxAuthTries 3' }
        - { regexp: '^#?ClientAliveInterval', line: 'ClientAliveInterval 300' }
        - { regexp: '^#?ClientAliveCountMax', line: 'ClientAliveCountMax 2' }
      notify: restart ssh
      
    - name: Configure UFW firewall
      ufw:
        rule: "{{ item.rule }}"
        port: "{{ item.port }}"
        proto: "{{ item.proto }}"
      loop:
        - { rule: 'limit', port: '{{ ssh_port }}', proto: 'tcp' }
        - { rule: 'allow', port: '80', proto: 'tcp' }
        - { rule: 'allow', port: '443', proto: 'tcp' }
      when: firewall_enabled
      
    - name: Enable UFW
      ufw:
        state: enabled
        policy: deny
      when: firewall_enabled
      
    - name: Configure fail2ban
      template:
        src: jail.local.j2
        dest: /etc/fail2ban/jail.local
        backup: yes
      notify: restart fail2ban
      when: fail2ban_enabled
      
    - name: Set up automatic security updates
      template:
        src: 20auto-upgrades.j2
        dest: /etc/apt/apt.conf.d/20auto-upgrades
      when: ansible_os_family == "Debian"
      
    - name: Configure system audit
      lineinfile:
        path: /etc/audit/rules.d/audit.rules
        line: "{{ item }}"
        create: yes
      loop:
        - "-w /etc/passwd -p wa -k identity"
        - "-w /etc/group -p wa -k identity"
        - "-w /etc/shadow -p wa -k identity"
        - "-w /var/log/auth.log -p wa -k authentication"
        - "-w /var/log/secure -p wa -k authentication"
      notify: restart auditd
      
    - name: Disable unnecessary services
      systemd:
        name: "{{ item }}"
        enabled: no
        state: stopped
      loop:
        - cups
        - avahi-daemon
        - bluetooth
      ignore_errors: yes
      
    - name: Set up log rotation
      template:
        src: logrotate.conf.j2
        dest: /etc/logrotate.d/security-logs
        
  handlers:
    - name: restart ssh
      systemd:
        name: sshd
        state: restarted
        
    - name: restart fail2ban
      systemd:
        name: fail2ban
        state: restarted
        
    - name: restart auditd
      systemd:
        name: auditd
        state: restarted
\`\`\`

## Application Deployment Playbook
\`\`\`yaml
---
- name: Deploy Web Application
  hosts: web_servers
  become: yes
  vars:
    app_name: myapp
    app_version: "{{ version | default('latest') }}"
    app_user: webapp
    app_directory: /opt/{{ app_name }}
    service_port: 8080
    
  tasks:
    - name: Create application user
      user:
        name: "{{ app_user }}"
        system: yes
        shell: /bin/false
        home: "{{ app_directory }}"
        create_home: no
        
    - name: Create application directory
      file:
        path: "{{ app_directory }}"
        state: directory
        owner: "{{ app_user }}"
        group: "{{ app_user }}"
        mode: '0755'
        
    - name: Download application package
      get_url:
        url: "https://releases.mycompany.com/{{ app_name }}/{{ app_version }}/{{ app_name }}-{{ app_version }}.tar.gz"
        dest: "/tmp/{{ app_name }}-{{ app_version }}.tar.gz"
        mode: '0644'
        
    - name: Extract application
      unarchive:
        src: "/tmp/{{ app_name }}-{{ app_version }}.tar.gz"
        dest: "{{ app_directory }}"
        owner: "{{ app_user }}"
        group: "{{ app_user }}"
        remote_src: yes
        
    - name: Install application dependencies
      pip:
        requirements: "{{ app_directory }}/requirements.txt"
        virtualenv: "{{ app_directory }}/venv"
        virtualenv_command: python3 -m venv
      become_user: "{{ app_user }}"
      
    - name: Create application configuration
      template:
        src: app.conf.j2
        dest: "{{ app_directory }}/config/app.conf"
        owner: "{{ app_user }}"
        group: "{{ app_user }}"
        mode: '0640'
      notify: restart application
      
    - name: Create systemd service file
      template:
        src: app.service.j2
        dest: "/etc/systemd/system/{{ app_name }}.service"
        mode: '0644'
      notify:
        - reload systemd
        - restart application
        
    - name: Create nginx configuration
      template:
        src: nginx.conf.j2
        dest: "/etc/nginx/sites-available/{{ app_name }}"
        backup: yes
      notify: restart nginx
      
    - name: Enable nginx site
      file:
        src: "/etc/nginx/sites-available/{{ app_name }}"
        dest: "/etc/nginx/sites-enabled/{{ app_name }}"
        state: link
      notify: restart nginx
      
    - name: Start and enable application service
      systemd:
        name: "{{ app_name }}"
        state: started
        enabled: yes
        daemon_reload: yes
        
    - name: Configure log rotation for application
      template:
        src: app-logrotate.j2
        dest: "/etc/logrotate.d/{{ app_name }}"
        
    - name: Set up health check
      cron:
        name: "{{ app_name }} health check"
        minute: "*/5"
        job: "/usr/local/bin/health-check.sh {{ app_name }} {{ service_port }}"
        
  handlers:
    - name: reload systemd
      systemd:
        daemon_reload: yes
        
    - name: restart application
      systemd:
        name: "{{ app_name }}"
        state: restarted
        
    - name: restart nginx
      systemd:
        name: nginx
        state: restarted
\`\`\`

## Infrastructure Monitoring Setup
\`\`\`yaml
---
- name: Setup Monitoring Stack
  hosts: monitoring_servers
  become: yes
  vars:
    prometheus_version: "2.40.7"
    grafana_version: "9.3.2"
    node_exporter_version: "1.5.0"
    
  tasks:
    - name: Create monitoring user
      user:
        name: monitoring
        system: yes
        shell: /bin/false
        
    - name: Install Docker
      shell: curl -fsSL https://get.docker.com | sh
      
    - name: Install Docker Compose
      pip:
        name: docker-compose
        
    - name: Create monitoring directories
      file:
        path: "{{ item }}"
        state: directory
        owner: monitoring
        group: monitoring
        mode: '0755'
      loop:
        - /opt/monitoring
        - /opt/monitoring/prometheus
        - /opt/monitoring/grafana
        - /opt/monitoring/alertmanager
        
    - name: Create Prometheus configuration
      template:
        src: prometheus.yml.j2
        dest: /opt/monitoring/prometheus/prometheus.yml
        owner: monitoring
        group: monitoring
        mode: '0644'
        
    - name: Create Grafana configuration
      template:
        src: grafana.ini.j2
        dest: /opt/monitoring/grafana/grafana.ini
        owner: monitoring
        group: monitoring
        mode: '0644'
        
    - name: Create Docker Compose file
      template:
        src: docker-compose.monitoring.yml.j2
        dest: /opt/monitoring/docker-compose.yml
        owner: monitoring
        group: monitoring
        mode: '0644'
        
    - name: Start monitoring stack
      docker_compose:
        project_src: /opt/monitoring
        state: present
        
    - name: Create systemd service for monitoring
      template:
        src: monitoring.service.j2
        dest: /etc/systemd/system/monitoring.service
        mode: '0644'
      notify:
        - reload systemd
        - start monitoring
        
    - name: Enable monitoring service
      systemd:
        name: monitoring
        enabled: yes
        state: started
        
  handlers:
    - name: reload systemd
      systemd:
        daemon_reload: yes
        
    - name: start monitoring
      systemd:
        name: monitoring
        state: started
\`\`\`
      }
    };
  }
  
  /**
   * Platform Operations Expert Knowledge
   */
  static getPlatformOperationsExpertise() {
    return {
      name: 'Platform Operations Expert',
      expertise: {
        core: {
          platform_management: 'Platform strategy, service management, operational excellence, SLA management',
          incident_management: 'Incident response, root cause analysis, post-mortem, escalation procedures',
          monitoring_observability: 'System monitoring, alerting, metrics, logging, distributed tracing',
          automation: 'Operational automation, workflow orchestration, self-healing systems',
          capacity_planning: 'Resource planning, performance analysis, scaling strategies, cost optimization'
        },
        
        reliability: {
          sre_practices: 'Site Reliability Engineering, error budgets, SLI/SLO management',
          high_availability: 'HA design, failover mechanisms, disaster recovery, business continuity',
          performance: 'Performance monitoring, optimization, load testing, capacity management',
          chaos_engineering: 'Fault injection, resilience testing, failure scenario planning'
        },
        
        operations: {
          change_management: 'Change control, deployment strategies, rollback procedures',
          documentation: 'Runbooks, operational procedures, knowledge management',
          on_call: 'On-call procedures, escalation paths, incident communication',
          metrics_kpis: 'Operational metrics, KPIs, dashboards, reporting'
        },
        
        tools: {
          monitoring: 'Prometheus, Grafana, Datadog, New Relic, Splunk, ELK Stack',
          incident_management: 'PagerDuty, VictorOps, OpsGenie, ServiceNow',
          automation: 'Ansible, Terraform, Jenkins, GitOps, workflow engines',
          communication: 'Slack, Microsoft Teams, incident communication tools'
        }
      },
      
      capabilities: [
        'Platform strategy and operational excellence',
        'Incident management and response procedures',
        'SRE practices and reliability engineering',
        'Monitoring and observability implementation',
        'Capacity planning and performance optimization',
        'Change management and deployment strategies',
        'Automation and workflow orchestration',
        'Disaster recovery and business continuity',
        'On-call procedures and escalation management',
        'Root cause analysis and post-mortem processes',
        'SLA/SLO management and error budgets',
        'Cost optimization and resource management',
        'Documentation and knowledge management',
        'Team coordination and communication',
        'Chaos engineering and resilience testing',
        'Operational metrics and KPI development'
      ],
      
      systemPromptAdditions: `
You are a Platform Operations expert specializing in:
- Platform strategy, operational excellence, and service management
- Site Reliability Engineering (SRE) practices and methodologies
- Incident management, monitoring, and observability
- Automation, capacity planning, and performance optimization
- Change management, documentation, and operational procedures
- Team coordination, communication, and knowledge sharing

Always focus on reliability, automation, continuous improvement, and operational excellence.`,

      bestPractices: [
        'Implement comprehensive monitoring and alerting',
        'Practice Site Reliability Engineering (SRE) methodologies',
        'Automate repetitive operational tasks',
        'Maintain detailed runbooks and documentation',
        'Implement proper incident management procedures',
        'Use error budgets and SLI/SLO management',
        'Practice chaos engineering and resilience testing',
        'Implement proper change management procedures',
        'Maintain effective on-call and escalation procedures',
        'Conduct thorough post-mortem analyses',
        'Optimize costs and resource utilization',
        'Plan for capacity and performance requirements',
        'Implement proper disaster recovery procedures',
        'Foster a culture of continuous improvement',
        'Maintain effective team communication and collaboration'
      ],
      
      codePatterns: {
        sreMonitoring: `
# SRE Monitoring and Alerting Framework

## Prometheus Configuration
\`\`\`yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'production'
    region: 'us-east-1'

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # Application metrics
  - job_name: 'web-app'
    static_configs:
      - targets: ['web-app:8080']
    metrics_path: '/metrics'
    scrape_interval: 30s
    
  # Infrastructure metrics
  - job_name: 'node-exporter'
    static_configs:
      - targets: 
        - 'web-01:9100'
        - 'web-02:9100'
        - 'db-01:9100'
    
  # Kubernetes metrics
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
        
  # Database metrics
  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']
    
  # Load balancer metrics
  - job_name: 'nginx-exporter'
    static_configs:
      - targets: ['nginx-exporter:9113']
\`\`\`

## SRE Alert Rules
\`\`\`yaml
# rules/sre-alerts.yml
groups:
  - name: sre.rules
    interval: 30s
    rules:
      # SLI: Availability
      - record: sli:availability:ratio_rate5m
        expr: |
          (
            sum(rate(http_requests_total{job="web-app",code!~"5.."}[5m])) /
            sum(rate(http_requests_total{job="web-app"}[5m]))
          )
      
      # SLI: Latency
      - record: sli:latency:p99_5m
        expr: |
          histogram_quantile(0.99, 
            sum(rate(http_request_duration_seconds_bucket{job="web-app"}[5m])) by (le)
          )
      
      # SLI: Error Rate
      - record: sli:error_rate:ratio_rate5m
        expr: |
          (
            sum(rate(http_requests_total{job="web-app",code=~"5.."}[5m])) /
            sum(rate(http_requests_total{job="web-app"}[5m]))
          )

  - name: slo.alerts
    rules:
      # SLO: 99.9% availability over 30 days
      - alert: AvailabilitySLOBreach
        expr: |
          (
            1 - (
              sum(rate(http_requests_total{job="web-app",code!~"5.."}[30d])) /
              sum(rate(http_requests_total{job="web-app"}[30d]))
            )
          ) > 0.001
        for: 5m
        labels:
          severity: critical
          slo: availability
        annotations:
          summary: "Availability SLO breach detected"
          description: "Availability is {{ \$value | humanizePercentage }} over 30 days, exceeding error budget"
      
      # SLO: 99th percentile latency < 500ms
      - alert: LatencySLOBreach
        expr: |
          histogram_quantile(0.99, 
            sum(rate(http_request_duration_seconds_bucket{job="web-app"}[5m])) by (le)
          ) > 0.5
        for: 2m
        labels:
          severity: warning
          slo: latency
        annotations:
          summary: "Latency SLO breach detected"
          description: "99th percentile latency is {{ \$value }}s, exceeding 500ms threshold"
      
      # Critical Infrastructure Alerts
      - alert: HighErrorRate
        expr: |
          (
            sum(rate(http_requests_total{job="web-app",code=~"5.."}[5m])) /
            sum(rate(http_requests_total{job="web-app"}[5m]))
          ) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ \$value | humanizePercentage }} for 5 minutes"
      
      - alert: InstanceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Instance {{ \$labels.instance }} is down"
          description: "Instance {{ \$labels.instance }} has been down for more than 1 minute"
      
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is {{ \$value }}% on {{ \$labels.instance }}"
      
      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) > 0.90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is {{ \$value | humanizePercentage }} on {{ \$labels.instance }}"
      
      - alert: DiskSpaceLow
        expr: (1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) > 0.85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Low disk space detected"
          description: "Disk usage is {{ \$value | humanizePercentage }} on {{ \$labels.instance }}:{{ \$labels.mountpoint }}"
\`\`\`

## Error Budget and SLO Tracking
\`\`\`python
# SLO tracking and error budget calculation
import datetime
import pandas as pd
from prometheus_api_client import PrometheusConnect

class SLOTracker:
    def __init__(self, prometheus_url):
        self.prom = PrometheusConnect(url=prometheus_url)
        self.slos = {
            'availability': {
                'target': 0.999,  # 99.9%
                'window': '30d'
            },
            'latency': {
                'target': 0.5,    # 500ms
                'percentile': 0.99,
                'window': '7d'
            },
            'error_rate': {
                'target': 0.01,   # 1%
                'window': '7d'
            }
        }
    
    def calculate_availability_slo(self, window='30d'):
        """Calculate availability SLO and error budget"""
        
        # Query total requests
        total_requests_query = f'sum(increase(http_requests_total{{job="web-app"}}[{window}]))'
        total_requests = self.prom.custom_query(total_requests_query)[0]['value'][1]
        
        # Query successful requests (non-5xx)
        success_requests_query = f'sum(increase(http_requests_total{{job="web-app",code!~"5.."}}[{window}]))'
        success_requests = self.prom.custom_query(success_requests_query)[0]['value'][1]
        
        # Calculate availability
        availability = float(success_requests) / float(total_requests)
        
        # Calculate error budget
        target_availability = self.slos['availability']['target']
        error_budget_total = (1 - target_availability) * float(total_requests)
        error_budget_used = float(total_requests) - float(success_requests)
        error_budget_remaining = error_budget_total - error_budget_used
        error_budget_burn_rate = error_budget_used / error_budget_total if error_budget_total > 0 else 0
        
        return {
            'availability': availability,
            'target': target_availability,
            'slo_met': availability >= target_availability,
            'error_budget_total': error_budget_total,
            'error_budget_used': error_budget_used,
            'error_budget_remaining': error_budget_remaining,
            'error_budget_burn_rate': error_budget_burn_rate,
            'total_requests': float(total_requests)
        }
    
    def calculate_latency_slo(self, window='7d'):
        """Calculate latency SLO"""
        
        # Query 99th percentile latency
        latency_query = f'''
        histogram_quantile(0.99,
          sum(rate(http_request_duration_seconds_bucket{{job="web-app"}}[{window}])) by (le)
        )
        '''
        latency_p99 = float(self.prom.custom_query(latency_query)[0]['value'][1])
        
        target_latency = self.slos['latency']['target']
        
        return {
            'latency_p99': latency_p99,
            'target': target_latency,
            'slo_met': latency_p99 <= target_latency,
            'latency_ms': latency_p99 * 1000
        }
    
    def generate_slo_report(self):
        """Generate comprehensive SLO report"""
        
        availability_slo = self.calculate_availability_slo()
        latency_slo = self.calculate_latency_slo()
        
        report = {
            'timestamp': datetime.datetime.now().isoformat(),
            'availability': availability_slo,
            'latency': latency_slo,
            'overall_health': 'healthy' if (availability_slo['slo_met'] and latency_slo['slo_met']) else 'degraded'
        }
        
        return report
    
    def alert_on_error_budget_burn(self, threshold=0.8):
        """Alert when error budget burn rate exceeds threshold"""
        
        availability_slo = self.calculate_availability_slo()
        
        if availability_slo['error_budget_burn_rate'] > threshold:
            return {
                'alert': True,
                'message': f"Error budget burn rate ({availability_slo['error_budget_burn_rate']:.2%}) exceeds threshold ({threshold:.2%})",
                'burn_rate': availability_slo['error_budget_burn_rate'],
                'remaining_budget': availability_slo['error_budget_remaining']
            }
        
        return {'alert': False}

# Example usage
slo_tracker = SLOTracker('http://prometheus:9090')
report = slo_tracker.generate_slo_report()
alert = slo_tracker.alert_on_error_budget_burn()

print(f"Availability: {report['availability']['availability']:.4f}")
print(f"Error Budget Burn Rate: {report['availability']['error_budget_burn_rate']:.2%}")
print(f"Latency P99: {report['latency']['latency_ms']:.1f}ms")
\`\`\``,

        incidentManagement: `
# Incident Management Framework

## Incident Response Playbook
\`\`\`yaml
# incident-response.yml
incident_severity_levels:
  P0_Critical:
    description: "Complete service outage or critical security breach"
    response_time: "< 15 minutes"
    escalation: "Immediate C-level notification"
    communication: "Public status page + customer notifications"
    
  P1_High:
    description: "Major feature unavailable or significant performance degradation"
    response_time: "< 30 minutes"
    escalation: "Engineering management + on-call lead"
    communication: "Internal stakeholders + status page"
    
  P2_Medium:
    description: "Minor feature issues or moderate performance impact"
    response_time: "< 2 hours"
    escalation: "Team lead + subject matter expert"
    communication: "Internal team notifications"
    
  P3_Low:
    description: "Cosmetic issues or minimal performance impact"
    response_time: "< 1 business day"
    escalation: "Assigned team member"
    communication: "Internal tracking only"

incident_roles:
  incident_commander:
    responsibilities:
      - "Overall incident coordination and decision making"
      - "Communication with stakeholders and customers"
      - "Resource allocation and escalation decisions"
      - "Post-incident review coordination"
    
  technical_lead:
    responsibilities:
      - "Technical investigation and diagnosis"
      - "Coordinate technical response efforts"
      - "Implement technical solutions and workarounds"
      - "Validate incident resolution"
    
  communications_lead:
    responsibilities:
      - "Internal and external communications"
      - "Status page updates and customer notifications"
      - "Stakeholder briefings and executive updates"
      - "Documentation of incident timeline"

incident_workflow:
  detection:
    - "Automated monitoring alerts"
    - "Customer reports and support tickets"
    - "Internal team observations"
    - "Health check failures"
    
  response:
    - "Acknowledge alert and assess severity"
    - "Activate incident response team"
    - "Establish incident communication channels"
    - "Begin technical investigation"
    
  mitigation:
    - "Implement immediate workarounds"
    - "Apply temporary fixes to restore service"
    - "Monitor service recovery"
    - "Communicate status updates"
    
  resolution:
    - "Implement permanent fixes"
    - "Validate complete service restoration"
    - "Update monitoring and alerting"
    - "Close incident and begin post-mortem"
\`\`\`

## Automated Incident Response
\`\`\`python
# incident_response.py
import json
import logging
import datetime
from typing import Dict, List
from dataclasses import dataclass
from enum import Enum

class IncidentSeverity(Enum):
    P0_CRITICAL = "P0"
    P1_HIGH = "P1"
    P2_MEDIUM = "P2"
    P3_LOW = "P3"

class IncidentStatus(Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    MITIGATING = "mitigating"
    RESOLVED = "resolved"
    CLOSED = "closed"

@dataclass
class Incident:
    id: str
    title: str
    description: str
    severity: IncidentSeverity
    status: IncidentStatus
    created_at: datetime.datetime
    updated_at: datetime.datetime
    assigned_to: List[str]
    affected_services: List[str]
    timeline: List[Dict]

class IncidentManager:
    def __init__(self, alerting_service, communication_service, monitoring_service):
        self.alerting = alerting_service
        self.communication = communication_service
        self.monitoring = monitoring_service
        self.logger = logging.getLogger(__name__)
        
        # Response time SLAs (in minutes)
        self.response_slas = {
            IncidentSeverity.P0_CRITICAL: 15,
            IncidentSeverity.P1_HIGH: 30,
            IncidentSeverity.P2_MEDIUM: 120,
            IncidentSeverity.P3_LOW: 1440  # 24 hours
        }
    
    def create_incident(self, alert_data: Dict) -> Incident:
        """Create new incident from alert data"""
        
        # Determine severity based on alert
        severity = self._determine_severity(alert_data)
        
        # Generate incident ID
        incident_id = f"INC-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        # Create incident object
        incident = Incident(
            id=incident_id,
            title=alert_data.get('summary', 'Unknown incident'),
            description=alert_data.get('description', ''),
            severity=severity,
            status=IncidentStatus.OPEN,
            created_at=datetime.datetime.now(),
            updated_at=datetime.datetime.now(),
            assigned_to=[],
            affected_services=alert_data.get('affected_services', []),
            timeline=[]
        )
        
        # Log incident creation
        self.logger.info(f"Created incident {incident.id} with severity {incident.severity.value}")
        
        # Auto-assign based on severity and on-call rotation
        self._auto_assign_incident(incident)
        
        # Send initial notifications
        self._send_incident_notifications(incident)
        
        # Update status page if needed
        if severity in [IncidentSeverity.P0_CRITICAL, IncidentSeverity.P1_HIGH]:
            self._update_status_page(incident)
        
        return incident
    
    def _determine_severity(self, alert_data: Dict) -> IncidentSeverity:
        """Determine incident severity based on alert data"""
        
        alert_labels = alert_data.get('labels', {})
        
        # P0: Critical infrastructure or complete service outage
        if (alert_labels.get('alertname') in ['InstanceDown', 'ServiceUnavailable'] or
            alert_labels.get('severity') == 'critical'):
            return IncidentSeverity.P0_CRITICAL
        
        # P1: High error rates or significant performance degradation
        elif (alert_labels.get('alertname') in ['HighErrorRate', 'HighLatency'] or
              alert_labels.get('severity') == 'warning'):
            return IncidentSeverity.P1_HIGH
        
        # P2: Medium impact issues
        elif alert_labels.get('severity') == 'info':
            return IncidentSeverity.P2_MEDIUM
        
        # P3: Low impact or informational
        else:
            return IncidentSeverity.P3_LOW
    
    def _auto_assign_incident(self, incident: Incident):
        """Auto-assign incident based on severity and on-call schedule"""
        
        if incident.severity == IncidentSeverity.P0_CRITICAL:
            # Assign to incident commander and technical lead
            incident.assigned_to = [
                self._get_on_call_incident_commander(),
                self._get_on_call_technical_lead(),
                self._get_on_call_communications_lead()
            ]
        elif incident.severity == IncidentSeverity.P1_HIGH:
            # Assign to technical lead and subject matter expert
            incident.assigned_to = [
                self._get_on_call_technical_lead(),
                self._get_subject_matter_expert(incident.affected_services)
            ]
        else:
            # Assign to primary on-call engineer
            incident.assigned_to = [self._get_primary_on_call()]
        
        # Add timeline entry
        incident.timeline.append({
            'timestamp': datetime.datetime.now().isoformat(),
            'action': 'incident_assigned',
            'assignees': incident.assigned_to,
            'severity': incident.severity.value
        })
    
    def _send_incident_notifications(self, incident: Incident):
        """Send incident notifications based on severity"""
        
        notification_channels = []
        
        if incident.severity == IncidentSeverity.P0_CRITICAL:
            notification_channels = ['slack-critical', 'pagerduty', 'email-executives']
        elif incident.severity == IncidentSeverity.P1_HIGH:
            notification_channels = ['slack-incidents', 'pagerduty', 'email-engineering']
        elif incident.severity == IncidentSeverity.P2_MEDIUM:
            notification_channels = ['slack-incidents']
        else:
            notification_channels = ['slack-team']
        
        # Send notifications
        for channel in notification_channels:
            self.communication.send_notification(
                channel=channel,
                incident=incident,
                message=self._format_incident_message(incident)
            )
    
    def _format_incident_message(self, incident: Incident) -> str:
        """Format incident notification message"""
        
        message = f"""
🔴 **INCIDENT {incident.severity.value}**: {incident.title}
        
**Incident ID**: {incident.id}
**Severity**: {incident.severity.value}
**Status**: {incident.status.value}
**Affected Services**: {', '.join(incident.affected_services)}
**Assigned To**: {', '.join(incident.assigned_to)}
**Created**: {incident.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}

**Description**: {incident.description}

**Next Steps**:
- Incident team is investigating
- Updates will be provided every 30 minutes
- Check status page for customer communications
        """
        
        return message.strip()
    
    def update_incident_status(self, incident_id: str, new_status: IncidentStatus, update_message: str):
        """Update incident status and send notifications"""
        
        incident = self._get_incident(incident_id)
        old_status = incident.status
        
        incident.status = new_status
        incident.updated_at = datetime.datetime.now()
        
        # Add timeline entry
        incident.timeline.append({
            'timestamp': datetime.datetime.now().isoformat(),
            'action': 'status_update',
            'old_status': old_status.value,
            'new_status': new_status.value,
            'message': update_message
        })
        
        # Send update notifications
        self._send_status_update(incident, update_message)
        
        # Update status page
        if new_status == IncidentStatus.RESOLVED:
            self._update_status_page(incident, resolved=True)
    
    def generate_post_mortem_template(self, incident: Incident) -> Dict:
        """Generate post-mortem template for incident"""
        
        template = {
            'incident_summary': {
                'id': incident.id,
                'title': incident.title,
                'severity': incident.severity.value,
                'duration': self._calculate_incident_duration(incident),
                'affected_services': incident.affected_services,
                'customer_impact': 'TBD - Add customer impact assessment'
            },
            'timeline': incident.timeline,
            'root_cause_analysis': {
                'immediate_cause': 'TBD - What triggered the incident?',
                'root_cause': 'TBD - Why did the system allow this to happen?',
                'contributing_factors': ['TBD - Add contributing factors']
            },
            'response_analysis': {
                'detection_time': 'TBD - How long to detect?',
                'response_time': 'TBD - How long to respond?',
                'mitigation_time': 'TBD - How long to mitigate?',
                'communication_effectiveness': 'TBD - How was communication?'
            },
            'lessons_learned': {
                'what_went_well': ['TBD - Add positive aspects'],
                'what_went_poorly': ['TBD - Add areas for improvement'],
                'action_items': [
                    {
                        'description': 'TBD - Add action item',
                        'owner': 'TBD - Assign owner',
                        'due_date': 'TBD - Set due date',
                        'priority': 'high/medium/low'
                    }
                ]
            }
        }
        
        return template
    
    def _get_on_call_incident_commander(self) -> str:
        """Get current on-call incident commander"""
        # Implementation depends on on-call scheduling system
        return "incident-commander@company.com"
    
    def _get_on_call_technical_lead(self) -> str:
        """Get current on-call technical lead"""
        return "tech-lead@company.com"
    
    def _calculate_incident_duration(self, incident: Incident) -> str:
        """Calculate total incident duration"""
        if incident.status == IncidentStatus.RESOLVED:
            duration = incident.updated_at - incident.created_at
            return str(duration)
        return "Ongoing"

# Example usage
incident_manager = IncidentManager(
    alerting_service=AlertingService(),
    communication_service=CommunicationService(),
    monitoring_service=MonitoringService()
)

# Create incident from alert
alert_data = {
    'summary': 'High error rate detected on API service',
    'description': 'Error rate exceeding 5% for the past 10 minutes',
    'labels': {'severity': 'critical', 'alertname': 'HighErrorRate'},
    'affected_services': ['api-service', 'user-service']
}

incident = incident_manager.create_incident(alert_data)
\`\`\`

## Post-Mortem Analysis Framework
\`\`\`markdown
# Post-Mortem Template

## Incident Summary
- **Incident ID**: INC-20231215-143022
- **Title**: Database Connection Pool Exhaustion
- **Severity**: P1 (High)
- **Duration**: 2 hours 15 minutes
- **Affected Services**: User Service, Order Service, Payment Service
- **Customer Impact**: 15% of users experienced login failures

## Timeline of Events
| Time (UTC) | Event | Action Taken |
|------------|-------|--------------|
| 14:30 | Initial alert: High error rate on user service | On-call engineer acknowledged alert |
| 14:35 | Database connection timeouts identified | Started investigating database performance |
| 14:45 | Connection pool exhaustion confirmed | Incident escalated to P1, database team engaged |
| 15:00 | Temporary mitigation: Increased connection pool size | Service partially restored |
| 15:30 | Root cause identified: Slow query causing connection leaks | Applied query optimization |
| 16:45 | Full service restoration confirmed | Incident marked as resolved |

## Root Cause Analysis

### Immediate Cause
A slow-running database query introduced in the previous deployment was holding connections open longer than expected, leading to connection pool exhaustion.

### Root Cause
- **Primary**: Insufficient query performance testing in staging environment
- **Secondary**: No monitoring alerts for connection pool utilization
- **Tertiary**: Deployment process didn't include database performance regression testing

### Contributing Factors
1. Staging environment had significantly less data than production
2. Connection pool monitoring was not implemented
3. Query execution time monitoring was insufficient
4. No automated rollback triggers for performance degradation

## Response Analysis

### What Went Well
- 🏁 Initial detection was automatic via monitoring alerts
- 🏁 Team responded within SLA (< 30 minutes for P1)
- 🏁 Communication was clear and timely
- 🏁 Escalation procedures worked effectively
- 🏁 Temporary mitigation was implemented quickly

### What Went Poorly
- 🔴 Root cause identification took too long (1 hour 15 minutes)
- 🔴 No automated rollback when performance degraded
- 🔴 Insufficient monitoring of database connection pools
- 🔴 Staging environment didn't catch the performance issue

## Action Items

| Description | Owner | Due Date | Priority | Status |
|-------------|-------|----------|----------|---------|
| Implement connection pool monitoring and alerting | @db-team | 2023-12-22 | High | Open |
| Add query performance regression testing to CI/CD | @platform-team | 2023-12-29 | High | Open |
| Improve staging environment data volume | @devops-team | 2024-01-15 | Medium | Open |
| Create automated rollback triggers for performance | @sre-team | 2024-01-30 | Medium | Open |
| Document database performance troubleshooting runbook | @db-team | 2023-12-20 | Low | Open |

## Metrics and Impact

### Service Level Impact
- **Availability**: 98.7% (target: 99.9%)
- **Error Rate**: 15% peak (target: < 1%)
- **Response Time**: 5.2s average (target: < 500ms)

### Business Impact
- **Customer Complaints**: 127 support tickets
- **Revenue Impact**: Estimated $15,000 in lost transactions
- **User Sessions Affected**: ~50,000 sessions

### Error Budget Consumption
- **Monthly Error Budget**: 43.2 minutes
- **Budget Consumed**: 135 minutes (313% of monthly budget)
- **Remaining Budget**: -91.8 minutes (budget exceeded)

## Prevention Measures

### Short-term (1-2 weeks)
1. Add connection pool monitoring and alerting
2. Implement query execution time monitoring
3. Create emergency runbook for database performance issues

### Medium-term (1-3 months)
1. Enhance staging environment to better match production
2. Implement automated performance regression testing
3. Add automated rollback capabilities for performance degradation

### Long-term (3-6 months)
1. Implement comprehensive database performance monitoring
2. Create predictive alerting for resource exhaustion
3. Implement chaos engineering for database failure scenarios

## Lessons Learned

### Technical Lessons
- Connection pool monitoring is critical for database-dependent services
- Performance testing must include realistic data volumes
- Query performance can degrade significantly with data growth

### Process Lessons
- Earlier escalation to database experts could have reduced MTTR
- Need better correlation between deployment events and performance issues
- Automated rollback triggers would have minimized impact

### Communication Lessons
- Customer communication was delayed due to initial uncertainty
- Status page updates should be more frequent during active incidents
- Internal stakeholder communication was effective

## Follow-up Review
- **Review Date**: 2023-12-29
- **Review Owner**: @sre-team
- **Success Criteria**: All high-priority action items completed and tested
\`\`\`
      }
    };
  }
}

module.exports = CloudInfrastructureExpertise;