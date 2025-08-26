/**
 * BUMBA DynamoDB Specialist
 * Expert in Amazon DynamoDB design, optimization, and operations
 */

const UnifiedSpecialistBase = require('../../unified-specialist-base');

class DynamoDBSpecialist extends UnifiedSpecialistBase {
  constructor() {
    super({
      name: 'DynamoDB Specialist',
      expertise: ['DynamoDB', 'NoSQL Design', 'Single Table Design', 'Performance Optimization'],
      models: ['claude-3-opus-20240229', 'gpt-4'],
      temperature: 0.3,
      systemPrompt: `You are a DynamoDB expert specializing in:
        - Single table design patterns
        - Partition key and sort key optimization
        - GSI (Global Secondary Index) design
        - DynamoDB Streams and triggers
        - Cost optimization strategies
        - Performance tuning and scaling
        - Data modeling for NoSQL
        - AWS SDK best practices
        Always prioritize scalability, cost-effectiveness, and performance.`
    });

    this.capabilities = {
      design: true,
      optimization: true,
      streaming: true,
      indexing: true,
      scaling: true,
      monitoring: true,
      costOptimization: true,
      migration: true
    };
  }

  async designTable(context) {
    const analysis = await this.analyze(context);
    
    return {
      tableDesign: this.createTableDesign(analysis),
      accessPatterns: this.analyzeAccessPatterns(analysis),
      indexes: this.designIndexes(analysis),
      optimization: this.optimizePerformance(analysis)
    };
  }

  createTableDesign(analysis) {
    return `// DynamoDB Single Table Design for ${analysis.projectName || 'Application'}

// Main Table Schema
{
  "TableName": "${analysis.tableName || 'AppTable'}",
  "BillingMode": "PAY_PER_REQUEST",  // or "PROVISIONED"
  "AttributeDefinitions": [
    {
      "AttributeName": "PK",
      "AttributeType": "S"
    },
    {
      "AttributeName": "SK",
      "AttributeType": "S"
    },
    {
      "AttributeName": "GSI1PK",
      "AttributeType": "S"
    },
    {
      "AttributeName": "GSI1SK",
      "AttributeType": "S"
    },
    {
      "AttributeName": "GSI2PK",
      "AttributeType": "S"
    },
    {
      "AttributeName": "GSI2SK",
      "AttributeType": "S"
    },
    {
      "AttributeName": "LSI1SK",
      "AttributeType": "S"
    }
  ],
  "KeySchema": [
    {
      "AttributeName": "PK",
      "KeyType": "HASH"
    },
    {
      "AttributeName": "SK",
      "KeyType": "RANGE"
    }
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "GSI1",
      "KeySchema": [
        {
          "AttributeName": "GSI1PK",
          "KeyType": "HASH"
        },
        {
          "AttributeName": "GSI1SK",
          "KeyType": "RANGE"
        }
      ],
      "Projection": {
        "ProjectionType": "ALL"
      }
    },
    {
      "IndexName": "GSI2",
      "KeySchema": [
        {
          "AttributeName": "GSI2PK",
          "KeyType": "HASH"
        },
        {
          "AttributeName": "GSI2SK",
          "KeyType": "RANGE"
        }
      ],
      "Projection": {
        "ProjectionType": "INCLUDE",
        "NonKeyAttributes": ["name", "email", "status"]
      }
    }
  ],
  "LocalSecondaryIndexes": [
    {
      "IndexName": "LSI1",
      "KeySchema": [
        {
          "AttributeName": "PK",
          "KeyType": "HASH"
        },
        {
          "AttributeName": "LSI1SK",
          "KeyType": "RANGE"
        }
      ],
      "Projection": {
        "ProjectionType": "KEYS_ONLY"
      }
    }
  ],
  "StreamSpecification": {
    "StreamEnabled": true,
    "StreamViewType": "NEW_AND_OLD_IMAGES"
  },
  "PointInTimeRecoverySpecification": {
    "PointInTimeRecoveryEnabled": true
  },
  "SSESpecification": {
    "Enabled": true,
    "SSEType": "KMS",
    "KMSMasterKeyId": "alias/aws/dynamodb"
  },
  "Tags": [
    {
      "Key": "Environment",
      "Value": "${analysis.environment || 'production'}"
    },
    {
      "Key": "Application",
      "Value": "${analysis.projectName || 'app'}"
    }
  ]
}

// Data Model Examples

// User Entity
{
  "PK": "USER#123",
  "SK": "USER#123",
  "GSI1PK": "USER#EMAIL#john@example.com",
  "GSI1SK": "USER#123",
  "GSI2PK": "USER#STATUS#ACTIVE",
  "GSI2SK": "USER#CREATED#2024-01-15T10:00:00Z",
  "EntityType": "User",
  "UserId": "123",
  "Email": "john@example.com",
  "Username": "johndoe",
  "FirstName": "John",
  "LastName": "Doe",
  "Status": "ACTIVE",
  "CreatedAt": "2024-01-15T10:00:00Z",
  "UpdatedAt": "2024-01-15T10:00:00Z",
  "Profile": {
    "Bio": "Software developer",
    "Location": "San Francisco",
    "Website": "https://johndoe.com"
  },
  "Preferences": {
    "Theme": "dark",
    "Language": "en",
    "Notifications": {
      "Email": true,
      "Push": false
    }
  }
}

// User Profile (Alternative approach)
{
  "PK": "USER#123",
  "SK": "PROFILE",
  "EntityType": "UserProfile",
  "UserId": "123",
  "Bio": "Software developer",
  "Location": "San Francisco",
  "Avatar": "https://example.com/avatar.jpg",
  "UpdatedAt": "2024-01-15T10:00:00Z"
}

// Product Entity
{
  "PK": "PRODUCT#456",
  "SK": "PRODUCT#456",
  "GSI1PK": "PRODUCT#CATEGORY#electronics",
  "GSI1SK": "PRODUCT#PRICE#299.99",
  "GSI2PK": "PRODUCT#STATUS#ACTIVE",
  "GSI2SK": "PRODUCT#CREATED#2024-01-10T14:30:00Z",
  "EntityType": "Product",
  "ProductId": "456",
  "SKU": "LAPTOP-001",
  "Name": "Gaming Laptop",
  "Description": "High-performance gaming laptop",
  "Category": "electronics",
  "Brand": "TechBrand",
  "Price": 299.99,
  "Currency": "USD",
  "Stock": 50,
  "Status": "ACTIVE",
  "Images": [
    "https://example.com/laptop1.jpg",
    "https://example.com/laptop2.jpg"
  ],
  "Attributes": {
    "RAM": "16GB",
    "Storage": "512GB SSD",
    "Screen": "15.6 inch"
  },
  "CreatedAt": "2024-01-10T14:30:00Z",
  "UpdatedAt": "2024-01-15T09:00:00Z"
}

// Order Entity
{
  "PK": "ORDER#789",
  "SK": "ORDER#789",
  "GSI1PK": "ORDER#USER#123",
  "GSI1SK": "ORDER#CREATED#2024-01-15T11:00:00Z",
  "GSI2PK": "ORDER#STATUS#PENDING",
  "GSI2SK": "ORDER#CREATED#2024-01-15T11:00:00Z",
  "EntityType": "Order",
  "OrderId": "789",
  "UserId": "123",
  "Status": "PENDING",
  "TotalAmount": 299.99,
  "Currency": "USD",
  "Items": [
    {
      "ProductId": "456",
      "SKU": "LAPTOP-001",
      "Name": "Gaming Laptop",
      "Quantity": 1,
      "UnitPrice": 299.99,
      "TotalPrice": 299.99
    }
  ],
  "ShippingAddress": {
    "Street": "123 Main St",
    "City": "San Francisco",
    "State": "CA",
    "ZipCode": "94105",
    "Country": "USA"
  },
  "CreatedAt": "2024-01-15T11:00:00Z",
  "UpdatedAt": "2024-01-15T11:00:00Z"
}

// Order Item (Alternative normalized approach)
{
  "PK": "ORDER#789",
  "SK": "ITEM#456",
  "EntityType": "OrderItem",
  "OrderId": "789",
  "ProductId": "456",
  "SKU": "LAPTOP-001",
  "Quantity": 1,
  "UnitPrice": 299.99,
  "TotalPrice": 299.99
}

// Review Entity
{
  "PK": "PRODUCT#456",
  "SK": "REVIEW#USER#123",
  "GSI1PK": "REVIEW#USER#123",
  "GSI1SK": "REVIEW#CREATED#2024-01-16T15:00:00Z",
  "GSI2PK": "REVIEW#RATING#5",
  "GSI2SK": "REVIEW#CREATED#2024-01-16T15:00:00Z",
  "EntityType": "Review",
  "ProductId": "456",
  "UserId": "123",
  "Rating": 5,
  "Title": "Excellent laptop!",
  "Content": "Great performance and build quality.",
  "Verified": true,
  "HelpfulCount": 15,
  "CreatedAt": "2024-01-16T15:00:00Z"
}

// Category Entity
{
  "PK": "CATEGORY#electronics",
  "SK": "CATEGORY#electronics",
  "GSI1PK": "CATEGORY#PARENT#ROOT",
  "GSI1SK": "CATEGORY#SORT#1",
  "EntityType": "Category",
  "CategoryId": "electronics",
  "Name": "Electronics",
  "Description": "Electronic devices and gadgets",
  "ParentCategory": "ROOT",
  "SortOrder": 1,
  "IsActive": true,
  "CreatedAt": "2024-01-01T00:00:00Z"
}

// Session Entity (TTL enabled)
{
  "PK": "SESSION#abc123",
  "SK": "SESSION#abc123",
  "EntityType": "Session",
  "SessionId": "abc123",
  "UserId": "123",
  "Data": {
    "cart": ["456", "789"],
    "preferences": {}
  },
  "CreatedAt": "2024-01-15T12:00:00Z",
  "TTL": 1642348800  // Unix timestamp for expiration
}`;
  }

  analyzeAccessPatterns(analysis) {
    return `// DynamoDB Access Patterns Analysis

// 1. User Management Patterns

// Get user by ID
{
  "operation": "GetItem",
  "keys": {
    "PK": "USER#123",
    "SK": "USER#123"
  }
}

// Get user by email (GSI1)
{
  "operation": "Query",
  "indexName": "GSI1",
  "keyCondition": "GSI1PK = :email",
  "expressionAttributeValues": {
    ":email": "USER#EMAIL#john@example.com"
  }
}

// List active users (GSI2)
{
  "operation": "Query",
  "indexName": "GSI2",
  "keyCondition": "GSI2PK = :status",
  "expressionAttributeValues": {
    ":status": "USER#STATUS#ACTIVE"
  }
}

// 2. Product Catalog Patterns

// Get product by ID
{
  "operation": "GetItem",
  "keys": {
    "PK": "PRODUCT#456",
    "SK": "PRODUCT#456"
  }
}

// List products by category (GSI1)
{
  "operation": "Query",
  "indexName": "GSI1",
  "keyCondition": "GSI1PK = :category",
  "expressionAttributeValues": {
    ":category": "PRODUCT#CATEGORY#electronics"
  }
}

// List products by price range (GSI1 with filter)
{
  "operation": "Query",
  "indexName": "GSI1",
  "keyCondition": "GSI1PK = :category AND GSI1SK BETWEEN :minPrice AND :maxPrice",
  "expressionAttributeValues": {
    ":category": "PRODUCT#CATEGORY#electronics",
    ":minPrice": "PRODUCT#PRICE#100.00",
    ":maxPrice": "PRODUCT#PRICE#500.00"
  }
}

// 3. Order Management Patterns

// Get order by ID
{
  "operation": "GetItem",
  "keys": {
    "PK": "ORDER#789",
    "SK": "ORDER#789"
  }
}

// Get user's orders (GSI1)
{
  "operation": "Query",
  "indexName": "GSI1",
  "keyCondition": "GSI1PK = :userOrders",
  "expressionAttributeValues": {
    ":userOrders": "ORDER#USER#123"
  }
}

// Get orders by status (GSI2)
{
  "operation": "Query",
  "indexName": "GSI2",
  "keyCondition": "GSI2PK = :status",
  "expressionAttributeValues": {
    ":status": "ORDER#STATUS#PENDING"
  }
}

// Get order with items (if using separate items)
{
  "operation": "Query",
  "keyCondition": "PK = :orderId",
  "expressionAttributeValues": {
    ":orderId": "ORDER#789"
  }
}

// 4. Review Patterns

// Get product reviews
{
  "operation": "Query",
  "keyCondition": "PK = :productId AND begins_with(SK, :reviewPrefix)",
  "expressionAttributeValues": {
    ":productId": "PRODUCT#456",
    ":reviewPrefix": "REVIEW#"
  }
}

// Get user's reviews (GSI1)
{
  "operation": "Query",
  "indexName": "GSI1",
  "keyCondition": "GSI1PK = :userReviews",
  "expressionAttributeValues": {
    ":userReviews": "REVIEW#USER#123"
  }
}

// Get reviews by rating (GSI2)
{
  "operation": "Query",
  "indexName": "GSI2",
  "keyCondition": "GSI2PK = :rating",
  "expressionAttributeValues": {
    ":rating": "REVIEW#RATING#5"
  }
}

// 5. Complex Query Patterns

// Hierarchical data (categories)
{
  "operation": "Query",
  "indexName": "GSI1",
  "keyCondition": "GSI1PK = :parent",
  "expressionAttributeValues": {
    ":parent": "CATEGORY#PARENT#electronics"
  }
}

// Time-based queries
{
  "operation": "Query",
  "indexName": "GSI2",
  "keyCondition": "GSI2PK = :type AND GSI2SK BETWEEN :startDate AND :endDate",
  "expressionAttributeValues": {
    ":type": "ORDER#STATUS#COMPLETED",
    ":startDate": "ORDER#CREATED#2024-01-01T00:00:00Z",
    ":endDate": "ORDER#CREATED#2024-01-31T23:59:59Z"
  }
}

// Sparse index patterns (only items with specific attributes)
{
  "operation": "Query",
  "indexName": "GSI1",
  "keyCondition": "GSI1PK = :featured",
  "expressionAttributeValues": {
    ":featured": "PRODUCT#FEATURED#TRUE"
  }
}

// Batch operations
{
  "operation": "BatchGetItem",
  "requestItems": {
    "AppTable": {
      "Keys": [
        {"PK": "USER#123", "SK": "USER#123"},
        {"PK": "PRODUCT#456", "SK": "PRODUCT#456"},
        {"PK": "ORDER#789", "SK": "ORDER#789"}
      ]
    }
  }
}

// Transactional operations
{
  "operation": "TransactWriteItems",
  "transactItems": [
    {
      "Put": {
        "TableName": "AppTable",
        "Item": {
          "PK": "ORDER#789",
          "SK": "ORDER#789",
          // ... order data
        },
        "ConditionExpression": "attribute_not_exists(PK)"
      }
    },
    {
      "Update": {
        "TableName": "AppTable",
        "Key": {
          "PK": "PRODUCT#456",
          "SK": "PRODUCT#456"
        },
        "UpdateExpression": "SET Stock = Stock - :quantity",
        "ConditionExpression": "Stock >= :quantity",
        "ExpressionAttributeValues": {
          ":quantity": 1
        }
      }
    }
  ]
}`;
  }

  designIndexes(analysis) {
    return `// DynamoDB Index Design Strategies

// Global Secondary Index (GSI) Design Principles

// GSI1: User and Entity Lookups
// Purpose: Find entities by alternate keys (email, username, etc.)
{
  "IndexName": "GSI1",
  "KeySchema": [
    {"AttributeName": "GSI1PK", "KeyType": "HASH"},
    {"AttributeName": "GSI1SK", "KeyType": "RANGE"}
  ],
  "Projection": {"ProjectionType": "ALL"},
  "ProvisionedThroughput": {
    "ReadCapacityUnits": 5,
    "WriteCapacityUnits": 5
  }
}

// GSI1 Usage Examples:
// - User by email: GSI1PK = "USER#EMAIL#john@example.com"
// - Product by category: GSI1PK = "PRODUCT#CATEGORY#electronics"
// - Orders by user: GSI1PK = "ORDER#USER#123"

// GSI2: Status and Time-based Queries
// Purpose: Filter and sort by status, dates, rankings
{
  "IndexName": "GSI2",
  "KeySchema": [
    {"AttributeName": "GSI2PK", "KeyType": "HASH"},
    {"AttributeName": "GSI2SK", "KeyType": "RANGE"}
  ],
  "Projection": {
    "ProjectionType": "INCLUDE",
    "NonKeyAttributes": ["EntityType", "Status", "CreatedAt", "UpdatedAt"]
  }
}

// GSI2 Usage Examples:
// - Active users: GSI2PK = "USER#STATUS#ACTIVE"
// - Recent orders: GSI2PK = "ORDER#STATUS#PENDING", GSI2SK = "ORDER#CREATED#..."
// - Top-rated products: GSI2PK = "PRODUCT#FEATURED", GSI2SK = "PRODUCT#RATING#..."

// Local Secondary Index (LSI) Design
// Purpose: Alternative sort orders within same partition
{
  "IndexName": "LSI1",
  "KeySchema": [
    {"AttributeName": "PK", "KeyType": "HASH"},
    {"AttributeName": "LSI1SK", "KeyType": "RANGE"}
  ],
  "Projection": {"ProjectionType": "KEYS_ONLY"}
}

// LSI1 Usage Examples:
// - User orders sorted by amount: PK = "USER#123", LSI1SK = "ORDER#AMOUNT#..."
// - Product reviews sorted by rating: PK = "PRODUCT#456", LSI1SK = "REVIEW#RATING#..."

// Sparse Index Pattern
// Only items with specific attributes appear in the index
// Example: Featured products GSI
{
  "GSI1PK": "PRODUCT#FEATURED#TRUE",  // Only set for featured products
  "GSI1SK": "PRODUCT#PRIORITY#001"
}

// Inverted Index Pattern
// Reverse relationship lookups
{
  "PK": "PRODUCT#456",
  "SK": "CATEGORY#electronics",
  "GSI1PK": "CATEGORY#electronics",  // Inverted for category->products lookup
  "GSI1SK": "PRODUCT#456"
}

// Overloaded GSI Pattern
// Multiple entity types in same GSI
// GSI1PK patterns:
// - "USER#EMAIL#john@example.com"
// - "PRODUCT#SKU#LAPTOP-001"
// - "ORDER#NUMBER#ORD-123"

// Index Projection Strategies

// KEYS_ONLY: Minimal storage, requires additional read for full item
{
  "Projection": {"ProjectionType": "KEYS_ONLY"}
}

// INCLUDE: Specific attributes for common query patterns
{
  "Projection": {
    "ProjectionType": "INCLUDE",
    "NonKeyAttributes": ["Name", "Price", "Status", "CreatedAt"]
  }
}

// ALL: Full item projection for read-heavy workloads
{
  "Projection": {"ProjectionType": "ALL"}
}

// Hot Partition Avoidance
// Distribute write traffic across partitions

// Time-based partition key spreading
{
  "PK": "ANALYTICS#2024-01-15#SHARD#3",  // Include shard suffix
  "SK": "EVENT#USER#123#TIMESTAMP#..."
}

// Hash-based distribution
{
  "PK": "SESSION#" + hash(sessionId) % 100,  // Distribute across 100 partitions
  "SK": "SESSION#" + sessionId
}

// Write sharding for high-traffic entities
{
  "PK": "PRODUCT#456#SHARD#" + (timestamp % 10),
  "SK": "VIEW#" + timestamp,
  "EntityType": "ProductView",
  "UserId": "123",
  "Timestamp": "2024-01-15T12:00:00Z"
}

// Index Monitoring and Optimization

// CloudWatch Metrics to Monitor:
// - ConsumedReadCapacityUnits
// - ConsumedWriteCapacityUnits
// - ReadThrottledRequests
// - WriteThrottledRequests
// - SuccessfulRequestLatency

// Cost Optimization Strategies:
// 1. Use sparse indexes to reduce item count
// 2. Choose appropriate projection type
// 3. Consider LSI vs GSI trade-offs
// 4. Monitor unused indexes
// 5. Use on-demand billing for unpredictable workloads

// Index Design Anti-patterns to Avoid:
// 1. Creating indexes for every possible query
// 2. Using ALL projection when INCLUDE would suffice
// 3. Not considering hot partition issues
// 4. Ignoring eventual consistency implications
// 5. Over-indexing low-cardinality attributes

// Advanced Index Patterns

// Adjacency List Pattern for hierarchical data
{
  "PK": "CATEGORY#electronics",
  "SK": "CATEGORY#electronics",
  "EntityType": "Category"
}
{
  "PK": "CATEGORY#electronics",
  "SK": "SUBCATEGORY#laptops",
  "EntityType": "CategoryRelation"
}

// Time Series Data with GSI
{
  "PK": "SENSOR#temp-001",
  "SK": "READING#2024-01-15T12:00:00Z",
  "GSI1PK": "READINGS#2024-01-15",  // Daily rollup
  "GSI1SK": "SENSOR#temp-001#2024-01-15T12:00:00Z"
}

// Leaderboard Pattern
{
  "PK": "GAME#chess",
  "SK": "PLAYER#score-9999-user123",  // Padded score for sorting
  "GSI1PK": "LEADERBOARD#DAILY#2024-01-15",
  "GSI1SK": "SCORE#9999#USER#123"
}`;
  }

  optimizePerformance(analysis) {
    return `// DynamoDB Performance Optimization

// 1. Read Performance Optimization

// Batch reads for multiple items
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function batchGetItems(keys) {
  const params = {
    RequestItems: {
      '${analysis.tableName || 'AppTable'}': {
        Keys: keys
      }
    }
  };
  
  const result = await dynamodb.batchGet(params).promise();
  return result.Responses['${analysis.tableName || 'AppTable'}'];
}

// Parallel queries for better throughput
async function getMultipleQueries(queries) {
  const promises = queries.map(query => dynamodb.query(query).promise());
  const results = await Promise.all(promises);
  return results.map(result => result.Items);
}

// Efficient pagination with LastEvaluatedKey
async function getAllItems(queryParams) {
  const items = [];
  let lastKey = null;
  
  do {
    const params = {
      ...queryParams,
      ExclusiveStartKey: lastKey
    };
    
    const result = await dynamodb.query(params).promise();
    items.push(...result.Items);
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);
  
  return items;
}

// 2. Write Performance Optimization

// Batch writes for multiple items
async function batchWriteItems(items) {
  const chunks = [];
  for (let i = 0; i < items.length; i += 25) {
    chunks.push(items.slice(i, i + 25));
  }
  
  const promises = chunks.map(chunk => {
    const params = {
      RequestItems: {
        '${analysis.tableName || 'AppTable'}': chunk.map(item => ({
          PutRequest: { Item: item }
        }))
      }
    };
    return dynamodb.batchWrite(params).promise();
  });
  
  await Promise.all(promises);
}

// Conditional writes to prevent race conditions
async function conditionalUpdate(key, updates, conditions) {
  const params = {
    TableName: '${analysis.tableName || 'AppTable'}',
    Key: key,
    UpdateExpression: 'SET ' + Object.keys(updates).map(k => \`#\${k} = :\${k}\`).join(', '),
    ConditionExpression: conditions,
    ExpressionAttributeNames: Object.keys(updates).reduce((acc, k) => {
      acc[\`#\${k}\`] = k;
      return acc;
    }, {}),
    ExpressionAttributeValues: Object.keys(updates).reduce((acc, k) => {
      acc[\`:\${k}\`] = updates[k];
      return acc;
    }, {}),
    ReturnValues: 'ALL_NEW'
  };
  
  try {
    return await dynamodb.update(params).promise();
  } catch (error) {
    if (error.code === 'ConditionalCheckFailedException') {
      throw new Error('Condition check failed');
    }
    throw error;
  }
}

// 3. Capacity Management

// Auto-scaling configuration
{
  "TableName": "${analysis.tableName || 'AppTable'}",
  "BillingMode": "PROVISIONED",
  "ProvisionedThroughput": {
    "ReadCapacityUnits": 100,
    "WriteCapacityUnits": 100
  },
  "GlobalSecondaryIndexes": [{
    "IndexName": "GSI1",
    "ProvisionedThroughput": {
      "ReadCapacityUnits": 50,
      "WriteCapacityUnits": 50
    }
  }]
}

// Application-level auto-scaling
const autoScaling = new AWS.ApplicationAutoScaling();

const scaleUpParams = {
  PolicyName: 'DynamoDB-table-scaling-policy',
  PolicyType: 'TargetTrackingScaling',
  ResourceId: 'table/${analysis.tableName || 'AppTable'}',
  ScalableDimension: 'dynamodb:table:ReadCapacityUnits',
  ServiceNamespace: 'dynamodb',
  TargetTrackingScalingPolicyConfiguration: {
    TargetValue: 70.0,
    PredefinedMetricSpecification: {
      PredefinedMetricType: 'DynamoDBReadCapacityUtilization'
    }
  }
};

// 4. Connection Pool Optimization

const dynamodbClient = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-1',
  maxRetries: 3,
  retryDelayOptions: {
    customBackoff: function(retryCount) {
      return Math.pow(2, retryCount) * 100; // Exponential backoff
    }
  },
  httpOptions: {
    connectTimeout: 1000,
    timeout: 5000,
    agent: new require('https').Agent({
      keepAlive: true,
      maxSockets: 50
    })
  }
});

// 5. Error Handling and Retries

async function withRetry(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (error.code === 'ProvisionedThroughputExceededException' && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 100 + Math.random() * 100;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

// 6. Query Optimization Patterns

// Use projection expressions to fetch only needed attributes
async function getProductSummary(productId) {
  const params = {
    TableName: '${analysis.tableName || 'AppTable'}',
    Key: { PK: \`PRODUCT#\${productId}\`, SK: \`PRODUCT#\${productId}\` },
    ProjectionExpression: 'ProductId, #name, Price, Stock, #status',
    ExpressionAttributeNames: {
      '#name': 'Name',
      '#status': 'Status'
    }
  };
  
  const result = await dynamodb.get(params).promise();
  return result.Item;
}

// Use filter expressions efficiently (after Query/Scan)
async function getActiveProductsInCategory(category, minPrice) {
  const params = {
    TableName: '${analysis.tableName || 'AppTable'}',
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :category',
    FilterExpression: 'Price >= :minPrice AND #status = :status',
    ExpressionAttributeValues: {
      ':category': \`PRODUCT#CATEGORY#\${category}\`,
      ':minPrice': minPrice,
      ':status': 'ACTIVE'
    },
    ExpressionAttributeNames: {
      '#status': 'Status'
    }
  };
  
  const result = await dynamodb.query(params).promise();
  return result.Items;
}

// 7. Cost Optimization

// Use TTL for automatic data expiration
{
  "PK": "SESSION#abc123",
  "SK": "SESSION#abc123",
  "TTL": Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  "SessionData": {...}
}

// Compress large items
const zlib = require('zlib');

function compressItem(item) {
  if (JSON.stringify(item).length > 1000) {
    item.CompressedData = zlib.gzipSync(JSON.stringify(item.LargeData)).toString('base64');
    delete item.LargeData;
    item.IsCompressed = true;
  }
  return item;
}

function decompressItem(item) {
  if (item.IsCompressed) {
    const decompressed = zlib.gunzipSync(Buffer.from(item.CompressedData, 'base64'));
    item.LargeData = JSON.parse(decompressed.toString());
    delete item.CompressedData;
    delete item.IsCompressed;
  }
  return item;
}

// 8. Monitoring and Alerting

// CloudWatch custom metrics
const cloudwatch = new AWS.CloudWatch();

async function publishCustomMetric(metricName, value, unit = 'Count') {
  const params = {
    Namespace: 'DynamoDB/Application',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date()
    }]
  };
  
  await cloudwatch.putMetricData(params).promise();
}

// Usage tracking
async function trackOperation(operation, duration, success) {
  await publishCustomMetric(\`\${operation}Duration\`, duration, 'Milliseconds');
  await publishCustomMetric(\`\${operation}Success\`, success ? 1 : 0, 'Count');
}

// 9. Local Development Optimization

// DynamoDB Local configuration
const localConfig = {
  region: 'localhost',
  endpoint: 'http://localhost:8000',
  accessKeyId: 'local',
  secretAccessKey: 'local'
};

const isLocal = process.env.NODE_ENV === 'development';
const dynamodbLocal = isLocal ? new AWS.DynamoDB.DocumentClient(localConfig) : dynamodb;

// 10. Testing Optimization

// Mock DynamoDB for unit tests
const mockDynamoDB = {
  get: jest.fn(),
  put: jest.fn(),
  query: jest.fn(),
  scan: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  batchGet: jest.fn(),
  batchWrite: jest.fn()
};

// Integration test helper
async function setupTestData() {
  const testItems = [
    { PK: 'TEST#USER#1', SK: 'USER#1', Name: 'Test User' },
    { PK: 'TEST#PRODUCT#1', SK: 'PRODUCT#1', Name: 'Test Product' }
  ];
  
  await batchWriteItems(testItems);
}

async function cleanupTestData() {
  // Delete test items
  const deleteRequests = testItems.map(item => ({
    DeleteRequest: { Key: { PK: item.PK, SK: item.SK } }
  }));
  
  await dynamodb.batchWrite({
    RequestItems: {
      '${analysis.tableName || 'AppTable'}': deleteRequests
    }
  }).promise();
}`;
  }

  async troubleshoot(issue) {
    const solutions = {
      throttling: [
        'Check CloudWatch metrics for consumed vs provisioned capacity',
        'Implement exponential backoff with jitter for retries',
        'Distribute write traffic across partitions using shard keys',
        'Consider switching to on-demand billing mode',
        'Review hot partition patterns and redistribute data'
      ],
      high_latency: [
        'Use consistent reads only when necessary',
        'Optimize query patterns to avoid scans',
        'Implement connection pooling and reuse',
        'Use projection expressions to fetch only needed data',
        'Consider using DAX for caching frequently accessed data'
      ],
      high_costs: [
        'Review provisioned vs on-demand pricing models',
        'Optimize index projections (KEYS_ONLY vs INCLUDE vs ALL)',
        'Implement TTL for temporary data',
        'Remove unused GSIs',
        'Compress large items before storage'
      ],
      query_limitations: [
        'Redesign table with appropriate partition and sort keys',
        'Create GSIs for alternate access patterns',
        'Use filter expressions for additional filtering after query',
        'Consider scan operations for ad-hoc analytics (with limits)',
        'Implement application-level caching for complex queries'
      ]
    };
    
    return solutions[issue.type] || ['Review DynamoDB best practices and CloudWatch metrics'];
  }
}

module.exports = DynamoDBSpecialist;