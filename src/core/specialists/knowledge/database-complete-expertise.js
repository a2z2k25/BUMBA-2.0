/**
 * BUMBA Complete Database Specialists Expertise
 * Sprint 28: Comprehensive database expertise for all database specialists
 * Covers: PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch, Cassandra, Neo4j, DynamoDB
 */

const databaseCompleteExpertise = {
  getOracleExpertise() {
    return {
      core: {
        version: 'Oracle 21c, RAC, Exadata, Autonomous Database',
        features: 'PL/SQL, partitioning, compression, encryption',
        tools: 'SQL*Plus, SQL Developer, Enterprise Manager, Data Pump',
        optimization: 'CBO, hints, statistics, SQL tuning advisor'
      },
      capabilities: [
        'Design Oracle database schemas',
        'Implement RAC clusters',
        'Develop PL/SQL stored procedures',
        'Configure Data Guard',
        'Implement partitioning strategies',
        'Tune Oracle performance',
        'Manage tablespaces and storage',
        'Implement backup and recovery',
        'Configure Oracle security',
        'Develop Oracle APEX applications',
        'Implement Oracle GoldenGate',
        'Manage Oracle Cloud databases',
        'Configure ASM storage',
        'Implement Oracle Streams',
        'Develop Oracle Forms applications'
      ],
      bestPractices: [
        'Use bind variables to prevent SQL injection',
        'Implement proper indexing strategies',
        'Use partitioning for large tables',
        'Configure automatic memory management',
        'Implement proper backup strategies',
        'Use AWR reports for performance tuning',
        'Implement row-level security',
        'Use materialized views for performance',
        'Configure proper redo log sizing',
        'Implement flashback features',
        'Use resource manager for workload management',
        'Implement proper archiving strategies',
        'Use parallel processing appropriately',
        'Configure proper statistics gathering',
        'Implement proper error handling in PL/SQL'
      ],
      codePatterns: {
        plsqlPackage: `
CREATE OR REPLACE PACKAGE order_management AS
    -- Types
    TYPE order_record IS RECORD (
        order_id NUMBER,
        customer_id NUMBER,
        order_date DATE,
        total_amount NUMBER(10,2)
    );
    
    TYPE order_table IS TABLE OF order_record;
    
    -- Procedures
    PROCEDURE create_order(
        p_customer_id IN NUMBER,
        p_items IN SYS.ODCINUMBERLIST,
        p_order_id OUT NUMBER
    );
    
    PROCEDURE update_order_status(
        p_order_id IN NUMBER,
        p_status IN VARCHAR2
    );
    
    -- Functions
    FUNCTION get_order_total(p_order_id NUMBER) RETURN NUMBER;
    FUNCTION get_customer_orders(p_customer_id NUMBER) RETURN order_table PIPELINED;
    
    -- Exceptions
    invalid_order EXCEPTION;
    PRAGMA EXCEPTION_INIT(invalid_order, -20001);
END order_management;
/

CREATE OR REPLACE PACKAGE BODY order_management AS
    
    PROCEDURE create_order(
        p_customer_id IN NUMBER,
        p_items IN SYS.ODCINUMBERLIST,
        p_order_id OUT NUMBER
    ) IS
        v_total NUMBER := 0;
        v_price NUMBER;
    BEGIN
        -- Generate order ID
        SELECT orders_seq.NEXTVAL INTO p_order_id FROM dual;
        
        -- Start transaction
        SAVEPOINT before_order;
        
        -- Insert order header
        INSERT INTO orders (order_id, customer_id, order_date, status)
        VALUES (p_order_id, p_customer_id, SYSDATE, 'PENDING');
        
        -- Process items
        FOR i IN 1..p_items.COUNT LOOP
            SELECT price INTO v_price 
            FROM products 
            WHERE product_id = p_items(i);
            
            INSERT INTO order_items (order_id, product_id, price)
            VALUES (p_order_id, p_items(i), v_price);
            
            v_total := v_total + v_price;
        END LOOP;
        
        -- Update total
        UPDATE orders 
        SET total_amount = v_total 
        WHERE order_id = p_order_id;
        
        COMMIT;
        
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            ROLLBACK TO before_order;
            RAISE_APPLICATION_ERROR(-20002, 'Product not found');
        WHEN OTHERS THEN
            ROLLBACK TO before_order;
            RAISE;
    END create_order;
    
    FUNCTION get_customer_orders(p_customer_id NUMBER) 
    RETURN order_table PIPELINED IS
        CURSOR c_orders IS
            SELECT order_id, customer_id, order_date, total_amount
            FROM orders
            WHERE customer_id = p_customer_id
            ORDER BY order_date DESC;
    BEGIN
        FOR rec IN c_orders LOOP
            PIPE ROW(rec);
        END LOOP;
        RETURN;
    END get_customer_orders;
    
END order_management;
/`,
        performanceTuning: `
-- Analyze execution plan
EXPLAIN PLAN FOR
SELECT /*+ PARALLEL(o,4) USE_HASH(o c) */
    o.order_id,
    c.customer_name,
    SUM(oi.quantity * oi.price) as total
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN order_items oi ON o.order_id = oi.order_id
WHERE o.order_date >= ADD_MONTHS(SYSDATE, -3)
GROUP BY o.order_id, c.customer_name
HAVING SUM(oi.quantity * oi.price) > 1000;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Create function-based index
CREATE INDEX idx_upper_name ON customers(UPPER(customer_name));

-- Gather statistics
BEGIN
    DBMS_STATS.GATHER_TABLE_STATS(
        ownname => 'SALES',
        tabname => 'ORDERS',
        estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE,
        method_opt => 'FOR ALL COLUMNS SIZE AUTO',
        cascade => TRUE
    );
END;
/`
      }
    };
  },

  getSQLServerExpertise() {
    return {
      core: {
        version: 'SQL Server 2022, Azure SQL Database, SQL MI',
        features: 'T-SQL, CLR, columnstore, in-memory OLTP',
        tools: 'SSMS, Azure Data Studio, SSIS, SSRS, SSAS',
        optimization: 'Query Store, execution plans, statistics, indexes'
      },
      capabilities: [
        'Design SQL Server databases',
        'Develop T-SQL stored procedures',
        'Implement Always On availability groups',
        'Configure replication',
        'Build SSIS packages',
        'Create SSRS reports',
        'Develop SSAS cubes',
        'Implement columnstore indexes',
        'Configure in-memory OLTP',
        'Manage Azure SQL databases',
        'Implement row-level security',
        'Configure database mirroring',
        'Develop CLR assemblies',
        'Implement CDC and CT',
        'Build Power BI integrations'
      ],
      bestPractices: [
        'Use stored procedures for complex logic',
        'Implement proper indexing strategies',
        'Use Query Store for performance monitoring',
        'Configure proper recovery models',
        'Implement database maintenance plans',
        'Use partition switching for large data loads',
        'Configure tempdb properly',
        'Use indexed views for complex queries',
        'Implement proper error handling with TRY/CATCH',
        'Use table-valued parameters',
        'Configure max degree of parallelism',
        'Implement proper security with schemas',
        'Use temporal tables for auditing',
        'Configure proper fill factor for indexes',
        'Use compression for large tables'
      ]
    };
  },

  getDynamoDBExpertise() {
    return {
      core: {
        concepts: 'Partition keys, sort keys, GSI, LSI, streams',
        consistency: 'Eventually consistent, strongly consistent reads',
        capacity: 'Provisioned, on-demand, auto-scaling',
        features: 'Global tables, transactions, TTL, encryption'
      },
      capabilities: [
        'Design DynamoDB table schemas',
        'Implement single-table design',
        'Create global secondary indexes',
        'Configure DynamoDB streams',
        'Implement transactions',
        'Set up global tables',
        'Configure auto-scaling',
        'Implement TTL for data expiration',
        'Use PartiQL for queries',
        'Implement optimistic locking',
        'Configure point-in-time recovery',
        'Build event-driven architectures',
        'Implement batch operations',
        'Configure DAX caching',
        'Monitor with CloudWatch'
      ],
      bestPractices: [
        'Design for uniform data access patterns',
        'Use composite keys effectively',
        'Avoid hot partitions',
        'Implement proper error handling with exponential backoff',
        'Use batch operations for efficiency',
        'Design GSIs carefully',
        'Monitor consumed capacity',
        'Use conditional writes',
        'Implement proper pagination',
        'Cache frequently accessed data',
        'Use DynamoDB streams for event processing',
        'Implement proper data modeling',
        'Use transactions sparingly',
        'Configure alarms for throttling',
        'Archive old data to S3'
      ],
      codePatterns: {
        singleTableDesign: `
// Single Table Design Pattern
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

class SingleTableDesign {
    constructor(tableName) {
        this.tableName = tableName;
    }
    
    // Create user with orders
    async createUser(user) {
        const timestamp = Date.now();
        const items = [
            {
                PutRequest: {
                    Item: {
                        PK: \`USER#\${user.id}\`,
                        SK: \`USER#\${user.id}\`,
                        Type: 'User',
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        createdAt: timestamp,
                        GSI1PK: \`USER\`,
                        GSI1SK: \`CREATED#\${timestamp}\`
                    }
                }
            }
        ];
        
        // Add user's initial order if exists
        if (user.initialOrder) {
            items.push({
                PutRequest: {
                    Item: {
                        PK: \`USER#\${user.id}\`,
                        SK: \`ORDER#\${user.initialOrder.id}\`,
                        Type: 'Order',
                        orderId: user.initialOrder.id,
                        amount: user.initialOrder.amount,
                        status: 'pending',
                        createdAt: timestamp,
                        GSI1PK: \`ORDER#\${user.initialOrder.status}\`,
                        GSI1SK: \`CREATED#\${timestamp}\`
                    }
                }
            });
        }
        
        const params = {
            RequestItems: {
                [this.tableName]: items
            }
        };
        
        return await dynamodb.batchWrite(params).promise();
    }
    
    // Query user with all related items
    async getUserWithOrders(userId) {
        const params = {
            TableName: this.tableName,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': \`USER#\${userId}\`
            }
        };
        
        const result = await dynamodb.query(params).promise();
        
        const user = result.Items.find(item => item.Type === 'User');
        const orders = result.Items.filter(item => item.Type === 'Order');
        
        return {
            user,
            orders
        };
    }
    
    // Transaction example
    async transferCredits(fromUserId, toUserId, amount) {
        const params = {
            TransactItems: [
                {
                    Update: {
                        TableName: this.tableName,
                        Key: {
                            PK: \`USER#\${fromUserId}\`,
                            SK: \`USER#\${fromUserId}\`
                        },
                        UpdateExpression: 'SET credits = credits - :amount',
                        ConditionExpression: 'credits >= :amount',
                        ExpressionAttributeValues: {
                            ':amount': amount
                        }
                    }
                },
                {
                    Update: {
                        TableName: this.tableName,
                        Key: {
                            PK: \`USER#\${toUserId}\`,
                            SK: \`USER#\${toUserId}\`
                        },
                        UpdateExpression: 'SET credits = credits + :amount',
                        ExpressionAttributeValues: {
                            ':amount': amount
                        }
                    }
                }
            ]
        };
        
        return await dynamodb.transactWrite(params).promise();
    }
}`
      }
    };
  },

  getNeo4jExpertise() {
    return {
      core: {
        concepts: 'Nodes, relationships, properties, labels',
        query: 'Cypher query language, pattern matching',
        algorithms: 'PageRank, community detection, pathfinding',
        features: 'ACID transactions, clustering, full-text search'
      },
      capabilities: [
        'Design graph data models',
        'Write Cypher queries',
        'Implement graph algorithms',
        'Build recommendation engines',
        'Create knowledge graphs',
        'Implement fraud detection',
        'Build social network analysis',
        'Configure Neo4j clusters',
        'Implement full-text search',
        'Use APOC procedures',
        'Build GraphQL APIs',
        'Implement access control',
        'Configure backup strategies',
        'Use graph data science library',
        'Build real-time graph analytics'
      ],
      bestPractices: [
        'Model domains as graphs naturally',
        'Use appropriate relationship types',
        'Create indexes on frequently queried properties',
        'Use parameters in Cypher queries',
        'Batch large write operations',
        'Profile queries with EXPLAIN and PROFILE',
        'Use APOC for complex operations',
        'Implement proper constraints',
        'Avoid Cartesian products in queries',
        'Use WITH for query optimization',
        'Configure memory settings properly',
        'Implement proper transaction management',
        'Use composite indexes when needed',
        'Monitor query performance',
        'Design for query patterns'
      ],
      codePatterns: {
        cypherQueries: `
// Create social network
CREATE (alice:Person {name: 'Alice', age: 30})
CREATE (bob:Person {name: 'Bob', age: 25})
CREATE (charlie:Person {name: 'Charlie', age: 35})
CREATE (alice)-[:FRIENDS_WITH {since: 2020}]->(bob)
CREATE (bob)-[:FRIENDS_WITH {since: 2019}]->(charlie)
CREATE (alice)-[:WORKS_AT]->(company:Company {name: 'TechCorp'})
CREATE (bob)-[:WORKS_AT]->(company)

// Find mutual friends
MATCH (person1:Person {name: 'Alice'})
MATCH (person2:Person {name: 'Charlie'})
MATCH (person1)-[:FRIENDS_WITH]-(mutualFriend)-[:FRIENDS_WITH]-(person2)
RETURN mutualFriend.name AS mutual_friend

// Recommendation query
MATCH (user:Person {id: $userId})-[:PURCHASED]->(product)<-[:PURCHASED]-(other)
MATCH (other)-[:PURCHASED]->(recommendation)
WHERE NOT (user)-[:PURCHASED]->(recommendation)
RETURN recommendation, COUNT(*) AS score
ORDER BY score DESC
LIMIT 10

// Shortest path
MATCH path = shortestPath(
    (start:Person {name: 'Alice'})-[*]-(end:Person {name: 'David'})
)
RETURN path, length(path) AS distance

// Community detection
CALL gds.louvain.stream('social-network')
YIELD nodeId, communityId
RETURN gds.util.asNode(nodeId).name AS name, communityId
ORDER BY communityId, name`
      }
    };
  },

  getInfluxDBExpertise() {
    return {
      core: {
        concepts: 'Time series, measurements, tags, fields',
        query: 'InfluxQL, Flux query language',
        features: 'Retention policies, continuous queries, Kapacitor',
        versions: 'InfluxDB 2.x, InfluxDB Cloud'
      },
      capabilities: [
        'Design time series schemas',
        'Write Flux queries',
        'Configure retention policies',
        'Build dashboards',
        'Implement alerting',
        'Configure telegraf collectors',
        'Build IoT data pipelines',
        'Implement downsampling',
        'Create continuous queries',
        'Configure Kapacitor tasks',
        'Build real-time analytics',
        'Implement data aggregation',
        'Configure cardinality management',
        'Build monitoring systems',
        'Integrate with Grafana'
      ]
    };
  }
};

module.exports = databaseCompleteExpertise;