/**
 * BUMBA MongoDB Specialist
 * Expert in MongoDB database design, optimization, and operations
 */

const UnifiedSpecialistBase = require('../../unified-specialist-base');

class MongoDBSpecialist extends UnifiedSpecialistBase {
  constructor() {
    super({
      name: 'MongoDB Specialist',
      expertise: ['MongoDB', 'Document Design', 'Aggregation', 'Sharding', 'Replica Sets'],
      models: ['claude-3-opus-20240229', 'gpt-4'],
      temperature: 0.3,
      systemPrompt: `You are a MongoDB expert specializing in:
        - Document-oriented database design
        - MongoDB aggregation framework
        - Replica sets and sharding
        - Performance optimization and indexing
        - MongoDB Atlas and cloud deployment
        - Data modeling and schema design
        - Security and access control
        - Backup and recovery strategies
        Always prioritize scalability, performance, and data consistency.`
    });

    this.capabilities = {
      design: true,
      aggregation: true,
      sharding: true,
      replication: true,
      optimization: true,
      security: true,
      atlas: true,
      migration: true
    };
  }

  async designDatabase(context) {
    const analysis = await this.analyze(context);
    
    return {
      collections: this.designCollections(analysis),
      indexes: this.designIndexes(analysis),
      aggregations: this.createAggregations(analysis),
      sharding: this.designSharding(analysis)
    };
  }

  designCollections(analysis) {
    return `// MongoDB Collection Design for ${analysis.projectName || 'Application'}

// Users Collection
db.users.insertOne({
  _id: ObjectId(),
  email: "user@example.com",
  username: "johndoe",
  passwordHash: "hashed_password_here",
  profile: {
    firstName: "John",
    lastName: "Doe",
    avatar: "https://example.com/avatar.jpg",
    bio: "Software developer",
    location: {
      city: "San Francisco",
      country: "USA",
      coordinates: [-122.4194, 37.7749]
    }
  },
  preferences: {
    theme: "dark",
    language: "en",
    notifications: {
      email: true,
      push: false,
      sms: true
    }
  },
  roles: ["user", "premium"],
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLogin: new Date(),
  isActive: true,
  metadata: {
    signupSource: "website",
    referralCode: "REF123"
  }
});

// Products Collection
db.products.insertOne({
  _id: ObjectId(),
  name: "Premium Headphones",
  slug: "premium-headphones",
  description: "High-quality wireless headphones",
  category: {
    _id: ObjectId("category_id"),
    name: "Electronics",
    path: "electronics/audio/headphones"
  },
  price: {
    amount: 299.99,
    currency: "USD",
    originalPrice: 399.99,
    discount: {
      percentage: 25,
      validUntil: new Date("2024-12-31")
    }
  },
  inventory: {
    sku: "HDG-001",
    stock: 150,
    reserved: 5,
    available: 145,
    warehouse: "US-WEST-1"
  },
  attributes: {
    brand: "AudioTech",
    color: "Black",
    weight: "250g",
    batteryLife: "30 hours",
    connectivity: ["Bluetooth", "USB-C"],
    features: ["Noise Cancelling", "Fast Charging"]
  },
  images: [
    {
      url: "https://example.com/image1.jpg",
      alt: "Front view",
      isPrimary: true
    },
    {
      url: "https://example.com/image2.jpg", 
      alt: "Side view",
      isPrimary: false
    }
  ],
  seo: {
    title: "Premium Wireless Headphones - AudioTech",
    description: "Experience premium sound quality...",
    keywords: ["headphones", "wireless", "audio"]
  },
  ratings: {
    average: 4.5,
    count: 1247,
    distribution: {
      5: 800,
      4: 300,
      3: 100,
      2: 30,
      1: 17
    }
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true
});

// Orders Collection
db.orders.insertOne({
  _id: ObjectId(),
  orderNumber: "ORD-2024-001234",
  user: {
    _id: ObjectId("user_id"),
    email: "user@example.com",
    name: "John Doe"
  },
  status: "processing",
  statusHistory: [
    {
      status: "placed",
      timestamp: new Date("2024-01-15T10:00:00Z"),
      note: "Order placed successfully"
    },
    {
      status: "processing", 
      timestamp: new Date("2024-01-15T11:00:00Z"),
      note: "Payment confirmed, preparing shipment"
    }
  ],
  items: [
    {
      productId: ObjectId("product_id"),
      name: "Premium Headphones",
      sku: "HDG-001",
      quantity: 1,
      unitPrice: 299.99,
      totalPrice: 299.99,
      attributes: {
        color: "Black",
        warranty: "2 years"
      }
    }
  ],
  pricing: {
    subtotal: 299.99,
    tax: 24.00,
    shipping: 9.99,
    discount: 30.00,
    total: 303.98
  },
  shipping: {
    method: "standard",
    carrier: "FedEx",
    trackingNumber: "1234567890",
    estimatedDelivery: new Date("2024-01-20"),
    address: {
      name: "John Doe",
      street: "123 Main St",
      city: "San Francisco",
      state: "CA",
      postalCode: "94105",
      country: "USA"
    }
  },
  payment: {
    method: "credit_card",
    provider: "stripe",
    transactionId: "txn_1234567890",
    status: "paid",
    paidAt: new Date("2024-01-15T10:05:00Z")
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

// Reviews Collection
db.reviews.insertOne({
  _id: ObjectId(),
  productId: ObjectId("product_id"),
  userId: ObjectId("user_id"),
  orderId: ObjectId("order_id"),
  rating: 5,
  title: "Excellent sound quality!",
  content: "These headphones exceeded my expectations...",
  verified: true,
  helpful: {
    count: 15,
    voters: [ObjectId("user1"), ObjectId("user2")]
  },
  images: [
    "https://example.com/review-image1.jpg"
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  isVisible: true
});

// Categories Collection (Hierarchical)
db.categories.insertOne({
  _id: ObjectId(),
  name: "Headphones",
  slug: "headphones",
  description: "Audio headphones and earphones",
  parentId: ObjectId("electronics_category_id"),
  path: "electronics.audio.headphones",
  level: 2,
  children: [
    ObjectId("wireless_headphones_category"),
    ObjectId("wired_headphones_category")
  ],
  ancestors: [
    ObjectId("electronics_category_id"),
    ObjectId("audio_category_id")
  ],
  image: "https://example.com/category-headphones.jpg",
  seo: {
    title: "Headphones - Premium Audio Equipment",
    description: "Browse our collection of premium headphones"
  },
  sortOrder: 1,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});`;
  }

  designIndexes(analysis) {
    return `// MongoDB Indexes for Optimal Performance

// Users Collection Indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "createdAt": -1 });
db.users.createIndex({ "isActive": 1 });
db.users.createIndex({ "roles": 1 });
db.users.createIndex({ "lastLogin": -1 });
db.users.createIndex({ "profile.location.coordinates": "2dsphere" });

// Text search index for user profiles
db.users.createIndex({
  "profile.firstName": "text",
  "profile.lastName": "text",
  "username": "text"
}, {
  name: "user_search_index",
  weights: {
    "username": 10,
    "profile.firstName": 5,
    "profile.lastName": 5
  }
});

// Products Collection Indexes
db.products.createIndex({ "slug": 1 }, { unique: true });
db.products.createIndex({ "inventory.sku": 1 }, { unique: true });
db.products.createIndex({ "category._id": 1 });
db.products.createIndex({ "price.amount": 1 });
db.products.createIndex({ "isActive": 1 });
db.products.createIndex({ "createdAt": -1 });
db.products.createIndex({ "ratings.average": -1 });
db.products.createIndex({ "inventory.available": 1 });

// Compound indexes for common queries
db.products.createIndex({ 
  "category._id": 1, 
  "isActive": 1, 
  "price.amount": 1 
});

db.products.createIndex({ 
  "isActive": 1, 
  "ratings.average": -1, 
  "createdAt": -1 
});

// Text search index for products
db.products.createIndex({
  "name": "text",
  "description": "text",
  "attributes.brand": "text",
  "seo.keywords": "text"
}, {
  name: "product_search_index",
  weights: {
    "name": 10,
    "attributes.brand": 8,
    "description": 5,
    "seo.keywords": 3
  }
});

// Orders Collection Indexes
db.orders.createIndex({ "user._id": 1 });
db.orders.createIndex({ "orderNumber": 1 }, { unique: true });
db.orders.createIndex({ "status": 1 });
db.orders.createIndex({ "createdAt": -1 });
db.orders.createIndex({ "payment.status": 1 });
db.orders.createIndex({ "shipping.trackingNumber": 1 });

// Compound indexes for order queries
db.orders.createIndex({ 
  "user._id": 1, 
  "status": 1, 
  "createdAt": -1 
});

db.orders.createIndex({ 
  "status": 1, 
  "createdAt": -1 
});

// TTL index for order status history
db.orders.createIndex({ 
  "statusHistory.timestamp": 1 
}, { 
  expireAfterSeconds: 31536000  // 1 year
});

// Reviews Collection Indexes
db.reviews.createIndex({ "productId": 1 });
db.reviews.createIndex({ "userId": 1 });
db.reviews.createIndex({ "orderId": 1 });
db.reviews.createIndex({ "rating": -1 });
db.reviews.createIndex({ "createdAt": -1 });
db.reviews.createIndex({ "verified": 1 });
db.reviews.createIndex({ "isVisible": 1 });

// Compound index for product reviews
db.reviews.createIndex({ 
  "productId": 1, 
  "isVisible": 1, 
  "rating": -1, 
  "createdAt": -1 
});

// Categories Collection Indexes
db.categories.createIndex({ "slug": 1 }, { unique: true });
db.categories.createIndex({ "parentId": 1 });
db.categories.createIndex({ "path": 1 });
db.categories.createIndex({ "level": 1 });
db.categories.createIndex({ "sortOrder": 1 });
db.categories.createIndex({ "isActive": 1 });

// Sparse indexes for optional fields
db.products.createIndex({ 
  "price.discount.validUntil": 1 
}, { 
  sparse: true 
});

// Partial indexes for better performance
db.products.createIndex({ 
  "inventory.available": 1 
}, { 
  partialFilterExpression: { "inventory.available": { $gt: 0 } }
});

db.orders.createIndex({ 
  "createdAt": -1 
}, { 
  partialFilterExpression: { "status": { $in: ["pending", "processing"] } }
});`;
  }

  createAggregations(analysis) {
    return `// MongoDB Aggregation Pipelines

// 1. Product Sales Analytics
db.orders.aggregate([
  {
    $match: {
      "status": "completed",
      "createdAt": {
        $gte: new Date("2024-01-01"),
        $lt: new Date("2024-02-01")
      }
    }
  },
  {
    $unwind: "$items"
  },
  {
    $group: {
      _id: "$items.productId",
      productName: { $first: "$items.name" },
      totalQuantity: { $sum: "$items.quantity" },
      totalRevenue: { $sum: "$items.totalPrice" },
      averagePrice: { $avg: "$items.unitPrice" },
      orderCount: { $sum: 1 }
    }
  },
  {
    $sort: { totalRevenue: -1 }
  },
  {
    $limit: 10
  },
  {
    $lookup: {
      from: "products",
      localField: "_id",
      foreignField: "_id",
      as: "productDetails"
    }
  },
  {
    $addFields: {
      category: { $arrayElemAt: ["$productDetails.category.name", 0] }
    }
  },
  {
    $project: {
      productName: 1,
      category: 1,
      totalQuantity: 1,
      totalRevenue: { $round: ["$totalRevenue", 2] },
      averagePrice: { $round: ["$averagePrice", 2] },
      orderCount: 1
    }
  }
]);

// 2. Customer Lifetime Value
db.orders.aggregate([
  {
    $match: {
      "status": "completed"
    }
  },
  {
    $group: {
      _id: "$user._id",
      customerEmail: { $first: "$user.email" },
      customerName: { $first: "$user.name" },
      totalOrders: { $sum: 1 },
      totalSpent: { $sum: "$pricing.total" },
      firstOrder: { $min: "$createdAt" },
      lastOrder: { $max: "$createdAt" },
      averageOrderValue: { $avg: "$pricing.total" }
    }
  },
  {
    $addFields: {
      customerLifespanDays: {
        $divide: [
          { $subtract: ["$lastOrder", "$firstOrder"] },
          24 * 60 * 60 * 1000
        ]
      }
    }
  },
  {
    $addFields: {
      orderFrequency: {
        $cond: {
          if: { $gt: ["$customerLifespanDays", 0] },
          then: { $divide: ["$totalOrders", "$customerLifespanDays"] },
          else: 0
        }
      }
    }
  },
  {
    $sort: { totalSpent: -1 }
  },
  {
    $project: {
      customerEmail: 1,
      customerName: 1,
      totalOrders: 1,
      totalSpent: { $round: ["$totalSpent", 2] },
      averageOrderValue: { $round: ["$averageOrderValue", 2] },
      customerLifespanDays: { $round: ["$customerLifespanDays", 0] },
      orderFrequency: { $round: ["$orderFrequency", 4] }
    }
  }
]);

// 3. Product Performance with Reviews
db.products.aggregate([
  {
    $lookup: {
      from: "reviews",
      localField: "_id",
      foreignField: "productId",
      as: "reviews"
    }
  },
  {
    $lookup: {
      from: "orders",
      let: { productId: "$_id" },
      pipeline: [
        { $unwind: "$items" },
        { $match: { $expr: { $eq: ["$items.productId", "$$productId"] } } },
        { $group: { _id: null, totalSold: { $sum: "$items.quantity" } } }
      ],
      as: "salesData"
    }
  },
  {
    $addFields: {
      reviewCount: { $size: "$reviews" },
      averageRating: {
        $cond: {
          if: { $gt: [{ $size: "$reviews" }, 0] },
          then: { $avg: "$reviews.rating" },
          else: 0
        }
      },
      totalSold: {
        $ifNull: [{ $arrayElemAt: ["$salesData.totalSold", 0] }, 0]
      }
    }
  },
  {
    $addFields: {
      conversionRate: {
        $cond: {
          if: { $gt: ["$totalSold", 0] },
          then: { $divide: ["$reviewCount", "$totalSold"] },
          else: 0
        }
      }
    }
  },
  {
    $project: {
      name: 1,
      "category.name": 1,
      "price.amount": 1,
      reviewCount: 1,
      averageRating: { $round: ["$averageRating", 2] },
      totalSold: 1,
      conversionRate: { $round: ["$conversionRate", 4] },
      "inventory.available": 1
    }
  },
  {
    $sort: { totalSold: -1 }
  }
]);

// 4. Monthly Revenue Trend
db.orders.aggregate([
  {
    $match: {
      "status": "completed",
      "createdAt": {
        $gte: new Date("2024-01-01")
      }
    }
  },
  {
    $group: {
      _id: {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" }
      },
      totalRevenue: { $sum: "$pricing.total" },
      totalOrders: { $sum: 1 },
      uniqueCustomers: { $addToSet: "$user._id" }
    }
  },
  {
    $addFields: {
      uniqueCustomerCount: { $size: "$uniqueCustomers" },
      averageOrderValue: { $divide: ["$totalRevenue", "$totalOrders"] }
    }
  },
  {
    $sort: { "_id.year": 1, "_id.month": 1 }
  },
  {
    $project: {
      month: {
        $concat: [
          { $toString: "$_id.year" },
          "-",
          {
            $cond: {
              if: { $lt: ["$_id.month", 10] },
              then: { $concat: ["0", { $toString: "$_id.month" }] },
              else: { $toString: "$_id.month" }
            }
          }
        ]
      },
      totalRevenue: { $round: ["$totalRevenue", 2] },
      totalOrders: 1,
      uniqueCustomerCount: 1,
      averageOrderValue: { $round: ["$averageOrderValue", 2] }
    }
  }
]);

// 5. Inventory Alerts
db.products.aggregate([
  {
    $match: {
      "isActive": true,
      $or: [
        { "inventory.available": { $lt: 10 } },
        { "inventory.available": { $lte: 0 } }
      ]
    }
  },
  {
    $addFields: {
      alertLevel: {
        $cond: {
          if: { $lte: ["$inventory.available", 0] },
          then: "critical",
          else: {
            $cond: {
              if: { $lt: ["$inventory.available", 5] },
              then: "high",
              else: "medium"
            }
          }
        }
      }
    }
  },
  {
    $project: {
      name: 1,
      "inventory.sku": 1,
      "inventory.available": 1,
      "inventory.reserved": 1,
      "category.name": 1,
      alertLevel: 1
    }
  },
  {
    $sort: { "inventory.available": 1 }
  }
]);`;
  }

  designSharding(analysis) {
    return `// MongoDB Sharding Configuration

// 1. Enable Sharding on Database
sh.enableSharding("${analysis.databaseName || 'ecommerce'}");

// 2. Shard Key Selection and Configuration

// Users Collection - Shard by user ID (good distribution)
sh.shardCollection("${analysis.databaseName || 'ecommerce'}.users", { "_id": 1 });

// Products Collection - Shard by category and ID for range queries
sh.shardCollection("${analysis.databaseName || 'ecommerce'}.products", { 
  "category._id": 1, 
  "_id": 1 
});

// Orders Collection - Shard by user ID (co-locate user data)
sh.shardCollection("${analysis.databaseName || 'ecommerce'}.orders", { 
  "user._id": 1, 
  "createdAt": 1 
});

// Reviews Collection - Shard by product ID
sh.shardCollection("${analysis.databaseName || 'ecommerce'}.reviews", { 
  "productId": 1 
});

// 3. Shard Configuration Script
// config_sharding.js

// Connect to config servers
var configDB = db.getSiblingDB('config');

// Add shard servers
sh.addShard("rs0/shard0-replica1:27017,shard0-replica2:27017,shard0-replica3:27017");
sh.addShard("rs1/shard1-replica1:27017,shard1-replica2:27017,shard1-replica3:27017");
sh.addShard("rs2/shard2-replica1:27017,shard2-replica2:27017,shard2-replica3:27017");

// Configure chunk size (default is 64MB, adjust based on needs)
use config;
db.settings.updateOne(
  { _id: "chunksize" },
  { $set: { value: 32 } },  // 32MB chunks
  { upsert: true }
);

// 4. Pre-split chunks for better initial distribution
// For orders collection (time-based)
for (var year = 2024; year <= 2026; year++) {
  for (var month = 1; month <= 12; month++) {
    var date = new Date(year, month - 1, 1);
    sh.splitAt("${analysis.databaseName || 'ecommerce'}.orders", {
      "user._id": ObjectId(),
      "createdAt": date
    });
  }
}

// 5. Zone Configuration for Geographic Distribution
sh.addShardToZone("rs0", "US-EAST");
sh.addShardToZone("rs1", "US-WEST");
sh.addShardToZone("rs2", "EUROPE");

// Configure zones for users based on location
sh.updateZoneKeyRange(
  "${analysis.databaseName || 'ecommerce'}.users",
  { "_id": MinKey },
  { "_id": ObjectId("500000000000000000000000") },
  "US-EAST"
);

sh.updateZoneKeyRange(
  "${analysis.databaseName || 'ecommerce'}.users",
  { "_id": ObjectId("500000000000000000000000") },
  { "_id": ObjectId("a00000000000000000000000") },
  "US-WEST"
);

sh.updateZoneKeyRange(
  "${analysis.databaseName || 'ecommerce'}.users",
  { "_id": ObjectId("a00000000000000000000000") },
  { "_id": MaxKey },
  "EUROPE"
);

// 6. Monitoring Sharding Status
// Check shard status
sh.status();

// Check chunk distribution
db.runCommand({ "listCollections": 1 }).cursor.firstBatch.forEach(
  function(collection) {
    if (db.getSiblingDB('config').collections.findOne({
      "_id": "${analysis.databaseName || 'ecommerce'}." + collection.name
    })) {
      print("\\n=== " + collection.name + " ===");
      sh.getShardDistribution(collection.name);
    }
  }
);

// 7. Balancer Configuration
// Enable/disable balancer
sh.enableBalancing("${analysis.databaseName || 'ecommerce'}.orders");
sh.disableBalancing("${analysis.databaseName || 'ecommerce'}.products");

// Set balancer window (off-peak hours)
use config;
db.settings.updateOne(
  { _id: "balancer" },
  { 
    $set: { 
      activeWindow: { 
        start: "02:00", 
        stop: "06:00" 
      } 
    } 
  },
  { upsert: true }
);

// 8. Query Routing Examples
// Targeted query (uses shard key)
db.orders.find({ "user._id": ObjectId("user_id_here") });

// Broadcast query (hits all shards)
db.orders.find({ "status": "pending" });

// Optimized compound query
db.orders.find({ 
  "user._id": ObjectId("user_id_here"),
  "createdAt": { $gte: new Date("2024-01-01") }
});

// 9. Shard Maintenance Commands
// Move chunk manually
sh.moveChunk(
  "${analysis.databaseName || 'ecommerce'}.orders",
  { "user._id": ObjectId("user_id"), "createdAt": new Date() },
  "rs1"
);

// Split chunk at specific point
sh.splitAt(
  "${analysis.databaseName || 'ecommerce'}.orders",
  { "user._id": ObjectId("split_point_user_id") }
);`;
  }

  setupReplicaSet(analysis) {
    return `// MongoDB Replica Set Configuration

// 1. Replica Set Initialization
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1.example.com:27017", priority: 2 },
    { _id: 1, host: "mongo2.example.com:27017", priority: 1 },
    { _id: 2, host: "mongo3.example.com:27017", priority: 1 },
    { _id: 3, host: "mongo4.example.com:27017", arbiterOnly: true }
  ]
});

// 2. Add Secondary with Different Priority
rs.add({ _id: 4, host: "mongo5.example.com:27017", priority: 0, hidden: true });

// 3. Read Preference Configuration
// Primary (default) - all reads from primary
db.collection.find().readPref("primary");

// Secondary - reads from secondary
db.collection.find().readPref("secondary");

// Primary Preferred - primary if available, else secondary
db.collection.find().readPref("primaryPreferred");

// Secondary Preferred - secondary if available, else primary
db.collection.find().readPref("secondaryPreferred");

// Nearest - lowest latency member
db.collection.find().readPref("nearest");

// 4. Write Concern Configuration
// Majority write concern (recommended for consistency)
db.orders.insertOne(
  { /* document */ },
  { writeConcern: { w: "majority", j: true, wtimeout: 5000 } }
);

// Custom write concern for critical operations
db.runCommand({
  setDefaultRWConcern: 1,
  defaultWriteConcern: {
    w: "majority",
    j: true,
    wtimeout: 5000
  },
  defaultReadConcern: {
    level: "majority"
  }
});

// 5. Oplog Configuration
// Check oplog status
rs.printReplicationInfo();

// Resize oplog (MongoDB 4.4+)
db.runCommand({ replSetResizeOplog: 1, size: 16000 }); // 16GB

// 6. Monitoring Replica Set Health
// Check replica set status
rs.status();

// Check replication lag
rs.printSecondaryReplicationInfo();

// Monitor oplog window
db.runCommand({ replSetGetStatus: 1 }).optimes;

// 7. Maintenance Operations
// Step down primary (for maintenance)
rs.stepDown(60); // Step down for 60 seconds

// Force replica set reconfiguration
rs.reconfig(config, { force: true });

// 8. Backup from Secondary
#!/bin/bash
# backup_secondary.sh

MONGO_HOST="mongo2.example.com:27017"
BACKUP_DIR="/backups/$(date +%Y%m%d_%H%M%S)"
DB_NAME="${analysis.databaseName || 'ecommerce'}"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup from secondary with read preference
mongodump \\
  --host $MONGO_HOST \\
  --readPreference secondary \\
  --db $DB_NAME \\
  --out $BACKUP_DIR

# Compress backup
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR

echo "Backup completed: $BACKUP_DIR.tar.gz"

// 9. Automatic Failover Testing
// Simulate primary failure
use admin;
db.runCommand({ shutdown: 1 });

// Check new primary election
rs.status().members.forEach(function(member) {
  if (member.stateStr === "PRIMARY") {
    print("New primary: " + member.name);
  }
});

// 10. Connection String for Applications
// Standard connection
mongodb://mongo1.example.com:27017,mongo2.example.com:27017,mongo3.example.com:27017/ecommerce?replicaSet=rs0

// With read preference
mongodb://mongo1.example.com:27017,mongo2.example.com:27017,mongo3.example.com:27017/ecommerce?replicaSet=rs0&readPreference=secondaryPreferred

// With write concern
mongodb://mongo1.example.com:27017,mongo2.example.com:27017,mongo3.example.com:27017/ecommerce?replicaSet=rs0&w=majority&wtimeoutMS=5000`;
  }

  async troubleshoot(issue) {
    const solutions = {
      slow_queries: [
        'Check query execution plans with explain()',
        'Review and optimize indexes',
        'Use MongoDB Profiler to identify slow operations',
        'Consider aggregation pipeline optimization',
        'Check for proper shard key usage'
      ],
      high_memory_usage: [
        'Monitor working set size vs available RAM',
        'Review index usage and remove unused indexes',
        'Implement proper data archiving strategy',
        'Check for memory leaks in aggregation pipelines',
        'Consider sharding to distribute data'
      ],
      replication_lag: [
        'Check network connectivity between replica set members',
        'Monitor oplog size and window',
        'Review write operations frequency',
        'Check secondary member resources',
        'Consider read preference optimization'
      ],
      connection_issues: [
        'Verify MongoDB service status',
        'Check network connectivity and firewall rules',
        'Review connection pool settings',
        'Monitor connection limits',
        'Validate authentication credentials'
      ]
    };
    
    return solutions[issue.type] || ['Review MongoDB logs and documentation'];
  }
}

module.exports = MongoDBSpecialist;