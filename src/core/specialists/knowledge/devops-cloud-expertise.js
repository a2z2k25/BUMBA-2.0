/**
 * BUMBA DevOps & Cloud Specialists Expertise
 * Enhanced knowledge for DevOps, Cloud Engineer, and Infrastructure specialists
 * Sprint 21 Implementation
 */

class DevOpsCloudExpertise {
  /**
   * DevOps Expert Knowledge
   */
  static getDevOpsExpertise() {
    return {
      name: 'DevOps Expert',
      expertise: {
        core: {
          ci_cd: 'Continuous integration, continuous deployment, automated pipelines',
          infrastructure_as_code: 'Terraform, CloudFormation, Ansible, configuration management',
          containerization: 'Docker, Kubernetes, container orchestration, microservices',
          monitoring: 'Observability, logging, metrics, alerting, distributed tracing',
          automation: 'Build automation, testing automation, deployment automation'
        },
        
        technologies: {
          ci_cd_tools: 'Jenkins, GitLab CI, GitHub Actions, Azure DevOps, CircleCI',
          iac_tools: 'Terraform, Pulumi, CloudFormation, ARM templates, Ansible',
          containers: 'Docker, Kubernetes, Helm, Docker Swarm, containerd',
          monitoring: 'Prometheus, Grafana, ELK Stack, Splunk, DataDog, New Relic',
          cloud: 'AWS, Azure, GCP, multi-cloud, hybrid cloud'
        },
        
        practices: {
          agile_devops: 'Agile methodologies, DevOps culture, continuous improvement',
          security: 'DevSecOps, security scanning, compliance automation',
          testing: 'Automated testing, unit tests, integration tests, performance tests',
          deployment: 'Blue-green deployment, canary releases, rolling deployments',
          collaboration: 'Cross-functional teams, communication, shared responsibility'
        },
        
        architecture: {
          microservices: 'Service architecture, API gateways, service mesh',
          scalability: 'Auto-scaling, load balancing, performance optimization',
          reliability: 'High availability, disaster recovery, fault tolerance',
          observability: 'Monitoring, logging, tracing, metrics collection'
        },
        
        automation: {
          pipeline: 'Build pipelines, deployment pipelines, test automation',
          infrastructure: 'Infrastructure provisioning, configuration management',
          monitoring: 'Automated alerting, self-healing systems, incident response',
          security: 'Security scanning, vulnerability management, compliance checks'
        }
      },
      
      capabilities: [
        'CI/CD pipeline design and implementation',
        'Infrastructure as Code development',
        'Container orchestration with Kubernetes',
        'Cloud platform automation and management',
        'Monitoring and observability setup',
        'DevSecOps security integration',
        'Automated testing and quality assurance',
        'Configuration management and compliance',
        'Performance optimization and scaling',
        'Incident response and troubleshooting',
        'Multi-cloud and hybrid cloud deployment',
        'GitOps and version control strategies',
        'Service mesh and microservices architecture',
        'Disaster recovery and backup automation',
        'Cost optimization and resource management',
        'Team collaboration and process improvement'
      ],
      
      systemPromptAdditions: `
You are a DevOps expert specializing in:
- Continuous integration and deployment pipeline automation
- Infrastructure as Code and configuration management
- Container orchestration and microservices deployment
- Cloud platform automation and multi-cloud strategies
- Monitoring, observability, and incident response
- DevSecOps and security automation practices
- Performance optimization and scalability engineering

Always focus on automation, reliability, and continuous improvement with emphasis on security and observability.`,

      bestPractices: [
        'Implement infrastructure as code for all environments',
        'Automate testing at every stage of the pipeline',
        'Use feature flags and gradual rollouts for deployments',
        'Monitor everything with comprehensive observability',
        'Implement security scanning in CI/CD pipelines',
        'Practice GitOps for configuration and deployment management',
        'Design for failure with circuit breakers and retries',
        'Maintain environment parity between dev, staging, and production',
        'Use immutable infrastructure and container images',
        'Implement proper secret management and rotation',
        'Set up automated backup and disaster recovery',
        'Monitor and optimize cloud costs continuously',
        'Document processes and maintain runbooks',
        'Foster collaboration between development and operations',
        'Implement chaos engineering for resilience testing'
      ],
      
      codePatterns: {
        terraformInfrastructure: `
# Terraform Infrastructure as Code
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "us-west-2"
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

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "\${var.project_name}-vpc"
  }
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name = "\${var.project_name}-private-\${count.index + 1}"
    Type = "private"
  }
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "\${var.project_name}-public-\${count.index + 1}"
    Type = "public"
  }
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = "\${var.project_name}-cluster"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = var.kubernetes_version
  
  vpc_config {
    subnet_ids              = concat(aws_subnet.private[*].id, aws_subnet.public[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = var.allowed_cidr_blocks
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
    aws_cloudwatch_log_group.eks_cluster,
  ]
  
  tags = {
    Name = "\${var.project_name}-eks-cluster"
  }
}

# Auto Scaling Node Group
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "\${var.project_name}-nodes"
  node_role_arn   = aws_iam_role.eks_node.arn
  subnet_ids      = aws_subnet.private[*].id
  instance_types  = var.node_instance_types
  
  scaling_config {
    desired_size = var.node_desired_size
    max_size     = var.node_max_size
    min_size     = var.node_min_size
  }
  
  update_config {
    max_unavailable_percentage = 25
  }
  
  # Launch template for advanced configuration
  launch_template {
    id      = aws_launch_template.eks_node.id
    version = aws_launch_template.eks_node.latest_version
  }
  
  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]
  
  tags = {
    Name = "\${var.project_name}-node-group"
  }
}`,

        kubernetesDeployment: `
# Kubernetes Deployment with Helm
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "app.fullname" . }}
  labels:
    {{- include "app.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "app.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
      labels:
        {{- include "app.selectorLabels" . | nindent 8 }}
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      serviceAccountName: {{ include "app.serviceAccountName" . }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
      - name: {{ .Chart.Name }}
        securityContext:
          {{- toYaml .Values.securityContext | nindent 12 }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - name: http
          containerPort: {{ .Values.service.targetPort }}
          protocol: TCP
        - name: metrics
          containerPort: 8080
          protocol: TCP
        livenessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: http
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        env:
        - name: NODE_ENV
          value: {{ .Values.environment }}
        - name: PORT
          value: "{{ .Values.service.targetPort }}"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: {{ include "app.fullname" . }}-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: {{ include "app.fullname" . }}-secrets
              key: redis-url
        envFrom:
        - configMapRef:
            name: {{ include "app.fullname" . }}-config
        resources:
          {{- toYaml .Values.resources | nindent 12 }}
        volumeMounts:
        - name: config-volume
          mountPath: /app/config
          readOnly: true
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: config-volume
        configMap:
          name: {{ include "app.fullname" . }}-config
      - name: logs
        emptyDir: {}
      {{- with .Values.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}

---
apiVersion: v1
kind: Service
metadata:
  name: {{ include "app.fullname" . }}
  labels:
    {{- include "app.labels" . | nindent 4 }}
spec:
  type: {{ .Values.service.type }}
  ports:
  - port: {{ .Values.service.port }}
    targetPort: http
    protocol: TCP
    name: http
  selector:
    {{- include "app.selectorLabels" . | nindent 4 }}

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "app.fullname" . }}
  labels:
    {{- include "app.labels" . | nindent 4 }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "app.fullname" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: {{ .Values.autoscaling.targetMemoryUtilizationPercentage }}`,

        githubActionsCICD: `
# GitHub Actions CI/CD Pipeline
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    name: Test and Quality Checks
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run unit tests
      run: npm run test:unit
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379
    
    - name: Generate test coverage
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info
        fail_ci_if_error: true
    
    - name: Run security scan
      run: npm audit --audit-level high
    
    - name: Run SAST scan
      uses: github/super-linter@v4
      env:
        DEFAULT_BRANCH: main
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        VALIDATE_ALL_CODEBASE: false

  build:
    name: Build and Push Image
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push'
    permissions:
      contents: read
      packages: write
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        platforms: linux/amd64,linux/arm64
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
        build-args: |
          BUILDTIME=${{ fromJSON(steps.meta.outputs.json).labels['org.opencontainers.image.created'] }}
          VERSION=${{ fromJSON(steps.meta.outputs.json).labels['org.opencontainers.image.version'] }}
          REVISION=${{ fromJSON(steps.meta.outputs.json).labels['org.opencontainers.image.revision'] }}

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup kubectl
      uses: azure/setup-kubectl@v3
      with:
        version: 'latest'
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2
    
    - name: Update kubeconfig
      run: aws eks update-kubeconfig --name staging-cluster --region us-west-2
    
    - name: Deploy with Helm
      run: |
        helm upgrade --install myapp ./helm/myapp \\
          --namespace staging \\
          --create-namespace \\
          --set image.tag=${{ github.sha }} \\
          --set environment=staging \\
          --values ./helm/myapp/values-staging.yaml \\
          --wait --timeout=10m
    
    - name: Run smoke tests
      run: |
        kubectl wait --for=condition=available --timeout=300s deployment/myapp -n staging
        npm run test:smoke -- --base-url=https://staging.myapp.com

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup kubectl
      uses: azure/setup-kubectl@v3
      with:
        version: 'latest'
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2
    
    - name: Update kubeconfig
      run: aws eks update-kubeconfig --name production-cluster --region us-west-2
    
    - name: Deploy with Helm (Blue-Green)
      run: |
        # Deploy to green environment
        helm upgrade --install myapp-green ./helm/myapp \\
          --namespace production \\
          --create-namespace \\
          --set image.tag=${{ github.sha }} \\
          --set environment=production \\
          --set deployment.name=myapp-green \\
          --values ./helm/myapp/values-production.yaml \\
          --wait --timeout=15m
        
        # Run production smoke tests
        kubectl wait --for=condition=available --timeout=300s deployment/myapp-green -n production
        npm run test:smoke -- --base-url=https://green.myapp.com
        
        # Switch traffic to green
        kubectl patch service myapp -n production -p '{"spec":{"selector":{"app":"myapp-green"}}}'
        
        # Cleanup old blue deployment after successful switch
        sleep 60
        helm uninstall myapp-blue -n production || true`
      }
    };
  }
  
  /**
   * Cloud Engineer Expert Knowledge
   */
  static getCloudEngineerExpertise() {
    return {
      name: 'Cloud Engineer Expert',
      expertise: {
        core: {
          cloud_platforms: 'AWS, Azure, GCP, multi-cloud, hybrid cloud architectures',
          cloud_services: 'Compute, storage, networking, databases, serverless, containers',
          cloud_security: 'IAM, encryption, compliance, security groups, network security',
          cost_optimization: 'Resource optimization, cost monitoring, reserved instances, spot instances',
          migration: 'Cloud migration strategies, lift-and-shift, re-architecture, modernization'
        },
        
        aws: {
          compute: 'EC2, Lambda, Fargate, Batch, Elastic Beanstalk',
          storage: 'S3, EBS, EFS, FSx, Storage Gateway',
          networking: 'VPC, CloudFront, Route 53, Direct Connect, VPN',
          databases: 'RDS, DynamoDB, Redshift, ElastiCache, DocumentDB',
          security: 'IAM, KMS, Secrets Manager, GuardDuty, Security Hub'
        },
        
        azure: {
          compute: 'Virtual Machines, Functions, Container Instances, App Service',
          storage: 'Blob Storage, File Storage, Disk Storage, Archive Storage',
          networking: 'Virtual Network, Application Gateway, Traffic Manager, ExpressRoute',
          databases: 'SQL Database, Cosmos DB, PostgreSQL, MySQL',
          security: 'Active Directory, Key Vault, Security Center, Sentinel'
        },
        
        gcp: {
          compute: 'Compute Engine, Cloud Functions, Cloud Run, App Engine',
          storage: 'Cloud Storage, Persistent Disk, Filestore, Archive Storage',
          networking: 'VPC, Cloud CDN, Cloud DNS, Interconnect, VPN',
          databases: 'Cloud SQL, Firestore, BigQuery, Memorystore',
          security: 'IAM, Cloud KMS, Security Command Center, Cloud Armor'
        },
        
        architecture: {
          patterns: 'Well-architected frameworks, microservices, serverless, event-driven',
          scalability: 'Auto-scaling, load balancing, CDN, caching strategies',
          availability: 'Multi-region, disaster recovery, backup strategies, failover',
          performance: 'Performance optimization, monitoring, observability'
        }
      },
      
      capabilities: [
        'Multi-cloud architecture design and implementation',
        'Cloud migration planning and execution',
        'Cloud security and compliance management',
        'Cost optimization and resource management',
        'Serverless and container-based solutions',
        'Cloud networking and connectivity',
        'Database migration and management',
        'Disaster recovery and backup strategies',
        'Performance optimization and monitoring',
        'Infrastructure automation and provisioning',
        'Cloud governance and policy management',
        'Hybrid cloud and edge computing',
        'Cloud-native application development',
        'DevOps integration and CI/CD pipelines',
        'Compliance and regulatory requirements',
        'Cloud vendor management and evaluation'
      ],
      
      systemPromptAdditions: `
You are a Cloud Engineer expert specializing in:
- Multi-cloud architecture design and implementation across AWS, Azure, and GCP
- Cloud migration strategies and modernization approaches
- Cloud security, compliance, and governance frameworks
- Cost optimization and resource management best practices
- Serverless, container, and cloud-native technologies
- Infrastructure automation and cloud operations
- Performance optimization and disaster recovery

Always focus on scalability, security, cost-effectiveness, and operational excellence in cloud solutions.`,

      bestPractices: [
        'Follow cloud well-architected framework principles',
        'Implement least privilege access and zero trust security',
        'Use infrastructure as code for all cloud resources',
        'Monitor and optimize costs continuously',
        'Design for failure and implement disaster recovery',
        'Use managed services to reduce operational overhead',
        'Implement comprehensive monitoring and alerting',
        'Automate security scanning and compliance checks',
        'Use multi-region deployments for high availability',
        'Implement proper backup and retention policies',
        'Tag all resources for cost allocation and management',
        'Use cloud-native services for better integration',
        'Implement proper network segmentation and security',
        'Plan for scalability and performance from the start',
        'Document architecture and maintain runbooks'
      ],
      
      codePatterns: {
        awsCloudFormation: `
# AWS CloudFormation Template
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-tier web application infrastructure'

Parameters:
  Environment:
    Type: String
    Default: 'dev'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment name'
  
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'

Mappings:
  EnvironmentConfig:
    dev:
      InstanceType: 't3.micro'
      MinSize: 1
      MaxSize: 2
    staging:
      InstanceType: 't3.small'
      MinSize: 2
      MaxSize: 4
    prod:
      InstanceType: 't3.medium'
      MinSize: 3
      MaxSize: 10

Resources:
  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '\${Environment}-vpc'
        - Key: Environment
          Value: !Ref Environment

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '\${Environment}-public-subnet-1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '\${Environment}-public-subnet-2'

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [2, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '\${Environment}-private-subnet-1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [3, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '\${Environment}-private-subnet-2'

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '\${Environment}-alb'
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '\${Environment}-alb'

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '\${Environment}-asg'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !FindInMap [EnvironmentConfig, !Ref Environment, MinSize]
      MaxSize: !FindInMap [EnvironmentConfig, !Ref Environment, MaxSize]
      DesiredCapacity: !FindInMap [EnvironmentConfig, !Ref Environment, MinSize]
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '\${Environment}-asg-instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true

  # RDS Database
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      DBSubnetGroupName: !Sub '\${Environment}-db-subnet-group'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '\${Environment}-db-subnet-group'

  Database:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '\${Environment}-database'
      DBInstanceClass: 'db.t3.micro'
      Engine: 'postgres'
      EngineVersion: '15.4'
      AllocatedStorage: 20
      StorageType: 'gp2'
      StorageEncrypted: true
      DBName: 'appdb'
      MasterUsername: 'dbadmin'
      MasterUserPassword: !Ref DatabasePassword
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: !If [IsProd, true, false]
      Tags:
        - Key: Name
          Value: !Sub '\${Environment}-database'

Conditions:
  IsProd: !Equals [!Ref Environment, 'prod']

Outputs:
  LoadBalancerDNS:
    Description: 'DNS name of the load balancer'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '\${Environment}-alb-dns'
  
  DatabaseEndpoint:
    Description: 'RDS database endpoint'
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub '\${Environment}-db-endpoint'`
      }
    };
  }
  
  /**
   * Infrastructure Specialist Expert Knowledge
   */
  static getInfrastructureExpertise() {
    return {
      name: 'Infrastructure Specialist Expert',
      expertise: {
        core: {
          infrastructure_design: 'System architecture, capacity planning, scalability design',
          automation: 'Infrastructure automation, configuration management, provisioning',
          monitoring: 'Infrastructure monitoring, performance tuning, alerting systems',
          security: 'Infrastructure security, hardening, compliance, access control',
          networking: 'Network design, routing, firewalls, load balancing, CDN'
        },
        
        technologies: {
          virtualization: 'VMware, Hyper-V, KVM, containerization, orchestration',
          automation: 'Ansible, Puppet, Chef, SaltStack, configuration management',
          monitoring: 'Nagios, Zabbix, Prometheus, Grafana, SNMP, log aggregation',
          networking: 'Cisco, Juniper, F5, HAProxy, NGINX, DNS, DHCP',
          storage: 'SAN, NAS, distributed storage, backup systems, disaster recovery'
        },
        
        practices: {
          iac: 'Infrastructure as Code, version control, testing, validation',
          automation: 'Automated provisioning, configuration drift prevention',
          monitoring: 'Proactive monitoring, alerting, incident response',
          security: 'Security hardening, vulnerability management, compliance',
          documentation: 'Architecture documentation, runbooks, procedures'
        },
        
        platforms: {
          on_premise: 'Physical servers, data centers, hardware management',
          cloud: 'AWS, Azure, GCP, hybrid cloud, multi-cloud',
          hybrid: 'Hybrid infrastructure, cloud connectivity, migration',
          edge: 'Edge computing, IoT infrastructure, distributed systems'
        },
        
        operations: {
          capacity: 'Capacity planning, performance optimization, resource management',
          availability: 'High availability, disaster recovery, business continuity',
          maintenance: 'Preventive maintenance, patching, updates, lifecycle management',
          incident: 'Incident response, troubleshooting, root cause analysis'
        }
      },
      
      capabilities: [
        'Enterprise infrastructure architecture design',
        'Infrastructure automation and configuration management',
        'Performance monitoring and optimization',
        'Disaster recovery and business continuity planning',
        'Network design and security implementation',
        'Capacity planning and resource optimization',
        'Infrastructure security and compliance',
        'Hybrid cloud and multi-cloud infrastructure',
        'Storage architecture and data management',
        'Infrastructure migration and modernization',
        'Incident response and troubleshooting',
        'Cost optimization and resource management',
        'Backup and recovery systems',
        'Infrastructure documentation and procedures',
        'Team training and knowledge transfer',
        'Vendor management and procurement'
      ],
      
      systemPromptAdditions: `
You are an Infrastructure Specialist expert specializing in:
- Enterprise infrastructure architecture and design
- Infrastructure automation and configuration management
- Performance monitoring, optimization, and capacity planning
- Disaster recovery and business continuity solutions
- Network architecture and security implementation
- Hybrid cloud and multi-cloud infrastructure management
- Infrastructure operations and incident response

Always focus on reliability, scalability, security, and operational efficiency in infrastructure solutions.`,

      bestPractices: [
        'Design for high availability and disaster recovery',
        'Implement infrastructure as code for all environments',
        'Use configuration management for consistency',
        'Monitor all infrastructure components proactively',
        'Implement proper backup and recovery procedures',
        'Follow security best practices and compliance requirements',
        'Document all infrastructure and procedures',
        'Plan for capacity and performance requirements',
        'Implement proper change management processes',
        'Use automation to reduce manual errors',
        'Maintain inventory and asset management',
        'Implement proper access controls and security',
        'Plan for scalability and growth',
        'Test disaster recovery procedures regularly',
        'Keep systems updated and patched'
      ],
      
      codePatterns: {
        ansiblePlaybook: `
# Ansible Playbook for Infrastructure Configuration
---
- name: Configure Web Servers
  hosts: webservers
  become: yes
  vars:
    nginx_user: nginx
    nginx_worker_processes: auto
    nginx_worker_connections: 1024
    app_port: 3000
    ssl_cert_path: /etc/ssl/certs/server.crt
    ssl_key_path: /etc/ssl/private/server.key
  
  tasks:
    - name: Update system packages
      package:
        name: "*"
        state: latest
      when: ansible_os_family == "RedHat"
    
    - name: Install required packages
      package:
        name:
          - nginx
          - firewalld
          - rsyslog
          - chrony
        state: present
    
    - name: Configure firewall
      firewalld:
        service: "{{ item }}"
        permanent: true
        state: enabled
        immediate: true
      loop:
        - http
        - https
        - ssh
    
    - name: Create nginx configuration
      template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
        backup: yes
        owner: root
        group: root
        mode: '0644'
      notify: restart nginx
    
    - name: Create SSL directory
      file:
        path: /etc/ssl/private
        state: directory
        owner: root
        group: root
        mode: '0700'
    
    - name: Copy SSL certificates
      copy:
        src: "{{ item.src }}"
        dest: "{{ item.dest }}"
        owner: root
        group: root
        mode: "{{ item.mode }}"
      loop:
        - { src: "server.crt", dest: "{{ ssl_cert_path }}", mode: "0644" }
        - { src: "server.key", dest: "{{ ssl_key_path }}", mode: "0600" }
      notify: restart nginx
    
    - name: Configure rsyslog for application logs
      template:
        src: app-logs.conf.j2
        dest: /etc/rsyslog.d/49-app-logs.conf
        owner: root
        group: root
        mode: '0644'
      notify: restart rsyslog
    
    - name: Configure log rotation
      template:
        src: app-logrotate.j2
        dest: /etc/logrotate.d/app
        owner: root
        group: root
        mode: '0644'
    
    - name: Start and enable services
      systemd:
        name: "{{ item }}"
        state: started
        enabled: yes
      loop:
        - nginx
        - firewalld
        - rsyslog
        - chronyd
    
    - name: Configure system limits
      pam_limits:
        domain: "{{ nginx_user }}"
        limit_type: "{{ item.type }}"
        limit_item: "{{ item.item }}"
        value: "{{ item.value }}"
      loop:
        - { type: "soft", item: "nofile", value: "65536" }
        - { type: "hard", item: "nofile", value: "65536" }
        - { type: "soft", item: "nproc", value: "4096" }
        - { type: "hard", item: "nproc", value: "4096" }
    
    - name: Configure kernel parameters
      sysctl:
        name: "{{ item.name }}"
        value: "{{ item.value }}"
        state: present
        reload: yes
      loop:
        - { name: "net.core.somaxconn", value: "65536" }
        - { name: "net.core.netdev_max_backlog", value: "5000" }
        - { name: "net.ipv4.tcp_max_syn_backlog", value: "8192" }
        - { name: "net.ipv4.tcp_slow_start_after_idle", value: "0" }
    
    - name: Setup monitoring agent
      include_tasks: monitoring.yml
      when: monitoring_enabled | default(false)
    
    - name: Verify nginx configuration
      command: nginx -t
      register: nginx_syntax
      failed_when: nginx_syntax.rc != 0
      changed_when: false

  handlers:
    - name: restart nginx
      systemd:
        name: nginx
        state: restarted
    
    - name: restart rsyslog
      systemd:
        name: rsyslog
        state: restarted

- name: Configure Database Servers
  hosts: dbservers
  become: yes
  vars:
    postgres_version: 15
    postgres_data_dir: /var/lib/pgsql/15/data
    postgres_port: 5432
    max_connections: 200
    shared_buffers: "256MB"
    effective_cache_size: "1GB"
  
  tasks:
    - name: Install PostgreSQL
      package:
        name:
          - postgresql15-server
          - postgresql15-contrib
          - python3-psycopg2
        state: present
    
    - name: Initialize PostgreSQL database
      command: /usr/pgsql-15/bin/postgresql-15-setup initdb
      args:
        creates: "{{ postgres_data_dir }}/PG_VERSION"
      become_user: postgres
    
    - name: Configure PostgreSQL
      template:
        src: postgresql.conf.j2
        dest: "{{ postgres_data_dir }}/postgresql.conf"
        owner: postgres
        group: postgres
        mode: '0600'
      notify: restart postgresql
    
    - name: Configure PostgreSQL authentication
      template:
        src: pg_hba.conf.j2
        dest: "{{ postgres_data_dir }}/pg_hba.conf"
        owner: postgres
        group: postgres
        mode: '0600'
      notify: restart postgresql
    
    - name: Start and enable PostgreSQL
      systemd:
        name: postgresql-15
        state: started
        enabled: yes
    
    - name: Configure database backup
      cron:
        name: "PostgreSQL backup"
        minute: "0"
        hour: "2"
        job: "/usr/local/bin/backup-postgres.sh"
        user: postgres

  handlers:
    - name: restart postgresql
      systemd:
        name: postgresql-15
        state: restarted`
      }
    };
  }
}

module.exports = DevOpsCloudExpertise;