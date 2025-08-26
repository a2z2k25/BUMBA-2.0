/**
 * BUMBA AWS Specialist
 * Expert in Amazon Web Services cloud architecture and services
 */

const UnifiedSpecialistBase = require('../../unified-specialist-base');

class AWSSpecialist extends UnifiedSpecialistBase {
  constructor() {
    super({
      name: 'AWS Specialist',
      expertise: ['AWS', 'Cloud Architecture', 'Infrastructure as Code', 'Serverless'],
      models: ['claude-3-opus-20240229', 'gpt-4'],
      temperature: 0.3,
      systemPrompt: `You are an AWS cloud expert specializing in:
        - Well-Architected Framework design principles
        - Infrastructure as Code with CloudFormation/CDK/Terraform
        - Serverless architectures with Lambda, API Gateway, DynamoDB
        - Container orchestration with ECS/EKS
        - Cost optimization and security best practices
        - Auto-scaling and high availability patterns
        - CI/CD with AWS native services
        - Monitoring and observability with CloudWatch
        Always prioritize security, cost-efficiency, and scalability.`
    });

    this.capabilities = {
      architecture: true,
      iac: true,
      serverless: true,
      containers: true,
      security: true,
      monitoring: true,
      costOptimization: true,
      networking: true
    };
  }

  async designArchitecture(context) {
    const analysis = await this.analyze(context);
    
    return {
      architecture: this.generateArchitecture(analysis),
      infrastructure: this.generateInfrastructure(analysis),
      security: this.implementSecurity(analysis),
      monitoring: this.setupMonitoring(analysis),
      costOptimization: this.optimizeCosts(analysis)
    };
  }

  generateArchitecture(analysis) {
    const { type, scale, requirements } = analysis;
    
    const architectures = {
      web: this.designWebArchitecture(analysis),
      serverless: this.designServerlessArchitecture(analysis),
      microservices: this.designMicroservicesArchitecture(analysis),
      dataLake: this.designDataLakeArchitecture(analysis)
    };
    
    return architectures[type] || this.designWebArchitecture(analysis);
  }

  designWebArchitecture(analysis) {
    return {
      components: {
        frontend: {
          service: 'CloudFront + S3',
          purpose: 'Static content delivery',
          configuration: {
            s3: 'Static website hosting',
            cloudfront: 'Global CDN with caching'
          }
        },
        loadBalancer: {
          service: 'Application Load Balancer',
          purpose: 'Traffic distribution',
          configuration: {
            targetGroups: ['web-servers'],
            healthChecks: true,
            sslTermination: true
          }
        },
        compute: {
          service: 'EC2 Auto Scaling Group',
          purpose: 'Application servers',
          configuration: {
            instanceType: 't3.medium',
            minSize: 2,
            maxSize: 10,
            targetCapacity: 'CPU 70%'
          }
        },
        database: {
          service: 'RDS MySQL Multi-AZ',
          purpose: 'Primary database',
          configuration: {
            instanceClass: 'db.r5.large',
            multiAZ: true,
            backupRetention: 7
          }
        },
        cache: {
          service: 'ElastiCache Redis',
          purpose: 'Session and data caching',
          configuration: {
            nodeType: 'cache.r6g.large',
            numNodes: 2
          }
        }
      },
      networking: this.designNetworking(analysis),
      security: this.designSecurity(analysis)
    };
  }

  designServerlessArchitecture(analysis) {
    return {
      components: {
        api: {
          service: 'API Gateway',
          purpose: 'REST API endpoint',
          configuration: {
            type: 'REST',
            caching: true,
            throttling: '1000 req/sec'
          }
        },
        compute: {
          service: 'Lambda Functions',
          purpose: 'Business logic',
          configuration: {
            runtime: 'nodejs18.x',
            memory: 256,
            timeout: 30,
            reservedConcurrency: 100
          }
        },
        database: {
          service: 'DynamoDB',
          purpose: 'NoSQL data storage',
          configuration: {
            billingMode: 'PAY_PER_REQUEST',
            encryption: true,
            pointInTimeRecovery: true
          }
        },
        storage: {
          service: 'S3',
          purpose: 'File storage',
          configuration: {
            versioning: true,
            encryption: 'AES256',
            lifecyclePolicy: true
          }
        },
        messaging: {
          service: 'SQS + SNS',
          purpose: 'Async communication',
          configuration: {
            visibilityTimeout: 30,
            deadLetterQueue: true
          }
        }
      }
    };
  }

  designMicroservicesArchitecture(analysis) {
    return {
      orchestration: 'EKS (Kubernetes)',
      serviceDiscovery: 'AWS Cloud Map',
      loadBalancing: 'ALB with Target Groups',
      messaging: 'EventBridge + SQS',
      observability: 'X-Ray + CloudWatch Container Insights',
      cicd: 'CodePipeline + CodeBuild + ECR'
    };
  }

  designDataLakeArchitecture(analysis) {
    return {
      ingestion: 'Kinesis Data Streams + Firehose',
      storage: 'S3 with lifecycle policies',
      processing: 'EMR + Glue ETL Jobs',
      cataloging: 'AWS Glue Data Catalog',
      analytics: 'Athena + QuickSight',
      governance: 'Lake Formation'
    };
  }

  generateInfrastructure(analysis) {
    return {
      cloudformation: this.generateCloudFormation(analysis),
      cdk: this.generateCDK(analysis),
      terraform: this.generateTerraform(analysis)
    };
  }

  generateCloudFormation(analysis) {
    return `AWSTemplateFormatVersion: '2010-09-09'
Description: '${analysis.projectName} Infrastructure'

Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues: [dev, staging, prod]
  
  InstanceType:
    Type: String
    Default: t3.medium
    AllowedValues: [t3.small, t3.medium, t3.large]

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '\${Environment}-vpc'

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [0, !GetAZs '']

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.4.0/24
      AvailabilityZone: !Select [1, !GetAZs '']

  LoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Type: application
      Scheme: internet-facing
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      MinSize: 2
      MaxSize: 10
      DesiredCapacity: 2
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber

Outputs:
  LoadBalancerDNS:
    Description: 'Load Balancer DNS Name'
    Value: !GetAtt LoadBalancer.DNSName
    Export:
      Name: !Sub '\${Environment}-lb-dns'`;
  }

  generateCDK(analysis) {
    return `// AWS CDK Stack
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';

export class ${analysis.projectName}Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24
        }
      ]
    });

    // Security Group
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSG', {
      vpc,
      allowAllOutbound: true
    });
    
    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP access'
    );

    // Auto Scaling Group
    const asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux(),
      minCapacity: 2,
      maxCapacity: 10,
      securityGroup: webSecurityGroup
    });

    // Load Balancer
    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true
    });

    const listener = lb.addListener('Listener', {
      port: 80,
      defaultTargetGroups: [
        new elbv2.ApplicationTargetGroup(this, 'TG', {
          port: 80,
          targets: [asg]
        })
      ]
    });
  }
}`;
  }

  generateTerraform(analysis) {
    return `# Terraform Configuration
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "\${var.environment}-vpc"
    Environment = var.environment
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "\${var.environment}-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.\${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "\${var.environment}-public-\${count.index + 1}"
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                = "\${var.environment}-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  min_size            = 2
  max_size            = 10
  desired_capacity    = 2
  health_check_type   = "ELB"

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "\${var.environment}-instance"
    propagate_at_launch = true
  }
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}`;
  }

  implementSecurity(analysis) {
    return {
      iam: this.generateIAMPolicies(analysis),
      secrets: this.setupSecretsManager(analysis),
      encryption: this.implementEncryption(analysis),
      monitoring: this.setupSecurityMonitoring(analysis)
    };
  }

  generateIAMPolicies(analysis) {
    return {
      principle: 'Least privilege access',
      policies: [
        {
          name: 'ApplicationRole',
          statement: {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject'],
            Resource: 'arn:aws:s3:::app-bucket/*'
          }
        },
        {
          name: 'DatabaseAccess',
          statement: {
            Effect: 'Allow',
            Action: ['rds:DescribeDBInstances'],
            Resource: '*',
            Condition: {
              StringEquals: {
                'aws:RequestedRegion': 'us-west-2'
              }
            }
          }
        }
      ]
    };
  }

  setupSecretsManager(analysis) {
    return {
      databaseCredentials: {
        service: 'AWS Secrets Manager',
        rotation: 'Automatic every 30 days',
        encryption: 'AWS KMS'
      },
      apiKeys: {
        service: 'AWS Systems Manager Parameter Store',
        type: 'SecureString',
        encryption: 'AWS KMS'
      }
    };
  }

  implementEncryption(analysis) {
    return {
      atRest: {
        s3: 'AES-256 or KMS',
        rds: 'AES-256 encryption',
        ebs: 'KMS encryption'
      },
      inTransit: {
        loadBalancer: 'SSL/TLS termination',
        internal: 'VPC private subnets',
        external: 'HTTPS only'
      }
    };
  }

  setupSecurityMonitoring(analysis) {
    return {
      cloudTrail: 'API call logging',
      guardDuty: 'Threat detection',
      securityHub: 'Security posture management',
      config: 'Resource compliance monitoring'
    };
  }

  optimizeCosts(analysis) {
    return {
      compute: [
        'Use Spot Instances for non-critical workloads',
        'Right-size instances based on utilization',
        'Implement auto-scaling policies',
        'Consider Reserved Instances for stable workloads'
      ],
      storage: [
        'Use S3 Intelligent Tiering',
        'Implement lifecycle policies',
        'Optimize EBS volume types',
        'Delete unused snapshots'
      ],
      monitoring: [
        'Set up billing alerts',
        'Use AWS Cost Explorer',
        'Implement resource tagging',
        'Regular cost optimization reviews'
      ]
    };
  }

  async troubleshoot(issue) {
    const solutions = {
      high_costs: [
        'Review Cost Explorer for top spending services',
        'Check for unused resources',
        'Optimize instance types and sizes',
        'Implement auto-scaling'
      ],
      performance_issues: [
        'Check CloudWatch metrics',
        'Review application logs',
        'Analyze network performance',
        'Consider caching strategies'
      ],
      security_alerts: [
        'Review GuardDuty findings',
        'Check Security Hub compliance',
        'Audit IAM permissions',
        'Review VPC Flow Logs'
      ]
    };
    
    return solutions[issue.type] || ['Review AWS Well-Architected Framework'];
  }
}

module.exports = AWSSpecialist;