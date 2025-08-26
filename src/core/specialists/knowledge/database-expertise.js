/**
 * BUMBA Database Deep Expertise
 * Comprehensive knowledge base for SQL database specialists
 * Sprint 8 Enhancement
 */

class DatabaseExpertise {
  /**
   * PostgreSQL Expertise
   */
  static getPostgreSQLExpertise() {
    return {
      name: 'PostgreSQL Expert',
      
      expertise: {
        core: {
          version: 'PostgreSQL 16+, ACID compliance, MVCC, transaction isolation',
          dataTypes: 'JSONB, arrays, ranges, enums, custom types, domains',
          extensions: 'PostGIS, pg_stat_statements, pg_trgm, uuid-ossp, TimescaleDB',
          replication: 'Streaming, logical replication, hot standby, point-in-time recovery',
          partitioning: 'Range, list, hash partitioning, partition pruning'
        },
        
        performance: {
          indexing: 'B-tree, Hash, GiST, GIN, SP-GiST, BRIN indexes',
          optimization: 'Query planner, EXPLAIN ANALYZE, statistics, cost estimation',
          vacuum: 'VACUUM, ANALYZE, autovacuum tuning, bloat management',
          connections: 'Connection pooling, prepared statements, work_mem tuning',
          monitoring: 'pg_stat_*, log analysis, slow query identification'
        },
        
        advanced: {
          functions: 'PL/pgSQL, SQL functions, triggers, stored procedures',
          window: 'Window functions, CTEs, recursive queries, lateral joins',
          json: 'JSONB operations, path expressions, indexing JSON data',
          fulltext: 'Full-text search, tsvector, tsquery, ranking',
          concurrency: 'Lock management, deadlock detection, transaction conflicts'
        },
        
        administration: {
          backup: 'pg_dump, pg_basebackup, continuous archiving, PITR',
          security: 'Role-based access, row-level security, SSL, authentication',
          maintenance: 'VACUUM, REINDEX, table reorganization, statistics update',
          monitoring: 'Performance monitoring, log analysis, alerting',
          upgrade: 'Major version upgrades, pg_upgrade, compatibility'
        },
        
        scaling: {
          readReplicas: 'Hot standby, streaming replication, read scaling',
          sharding: 'Horizontal partitioning, Citus extension, distributed queries',
          clustering: 'Patroni, Pacemaker, automatic failover',
          loadBalancing: 'pgpool-II, HAProxy, connection distribution'
        }
      },
      
      capabilities: [
        'Database design and normalization',
        'Query optimization and performance tuning',
        'Index strategy and implementation',
        'Replication and high availability setup',
        'Backup and disaster recovery',
        'Security configuration and hardening',
        'Monitoring and alerting setup',
        'Migration planning and execution',
        'Partitioning and sharding strategies',
        'JSON/JSONB data modeling',
        'Full-text search implementation',
        'Custom function development',
        'Performance troubleshooting',
        'Capacity planning',
        'Upgrade and maintenance'
      ],
      
      codePatterns: {
        optimizedSchema: `
-- Optimized table design with proper indexing
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ
);

-- Optimized indexing strategy
CREATE INDEX CONCURRENTLY idx_users_email_active 
    ON users(email) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_users_created_at_desc 
    ON users(created_at DESC);
CREATE INDEX CONCURRENTLY idx_users_profile_gin 
    ON users USING GIN (profile);
CREATE INDEX CONCURRENTLY idx_users_last_login 
    ON users(last_login) WHERE last_login IS NOT NULL;

-- Automatic timestamp updating
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
        
        complexQuery: `
-- Complex query with CTEs, window functions, and JSON operations
WITH user_activity AS (
    SELECT 
        u.id,
        u.username,
        u.profile->>'department' as department,
        COUNT(a.id) as total_actions,
        AVG(a.duration) as avg_duration,
        ROW_NUMBER() OVER (
            PARTITION BY u.profile->>'department' 
            ORDER BY COUNT(a.id) DESC
        ) as dept_rank
    FROM users u
    LEFT JOIN activities a ON u.id = a.user_id
    WHERE u.created_at >= CURRENT_DATE - INTERVAL '30 days'
    AND u.is_active = true
    GROUP BY u.id, u.username, u.profile->>'department'
),
department_stats AS (
    SELECT 
        department,
        COUNT(*) as user_count,
        SUM(total_actions) as dept_total_actions,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_actions) as median_actions
    FROM user_activity
    WHERE department IS NOT NULL
    GROUP BY department
)
SELECT 
    ua.username,
    ua.department,
    ua.total_actions,
    ua.avg_duration,
    ua.dept_rank,
    ds.dept_total_actions,
    ds.median_actions,
    CASE 
        WHEN ua.total_actions > ds.median_actions THEN 'Above Average'
        WHEN ua.total_actions = ds.median_actions THEN 'Average'
        ELSE 'Below Average'
    END as performance_category
FROM user_activity ua
JOIN department_stats ds ON ua.department = ds.department
WHERE ua.dept_rank <= 10
ORDER BY ua.department, ua.dept_rank;`,
        
        partitioning: `
-- Range partitioning for time-series data
CREATE TABLE measurements (
    id BIGSERIAL,
    sensor_id INTEGER NOT NULL,
    measured_at TIMESTAMPTZ NOT NULL,
    value NUMERIC(10,2) NOT NULL,
    metadata JSONB DEFAULT '{}'
) PARTITION BY RANGE (measured_at);

-- Create monthly partitions
CREATE TABLE measurements_2024_01 PARTITION OF measurements
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE measurements_2024_02 PARTITION OF measurements
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Partition-wise indexes
CREATE INDEX idx_measurements_2024_01_sensor_time 
    ON measurements_2024_01(sensor_id, measured_at);
CREATE INDEX idx_measurements_2024_01_value 
    ON measurements_2024_01(value) WHERE value > 100;

-- Automatic partition creation function
CREATE OR REPLACE FUNCTION create_monthly_partition(table_name text, start_date date)
RETURNS void AS $$
DECLARE
    partition_name text;
    end_date date;
BEGIN
    partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
    end_date := start_date + interval '1 month';
    
    EXECUTE format('CREATE TABLE %I PARTITION OF %I 
                    FOR VALUES FROM (%L) TO (%L)',
                   partition_name, table_name, start_date, end_date);
    
    EXECUTE format('CREATE INDEX idx_%s_sensor_time 
                    ON %I(sensor_id, measured_at)',
                   partition_name, partition_name);
END;
$$ LANGUAGE plpgsql;`,
        
        jsonOperations: `
-- Advanced JSONB operations and indexing
-- Sample user profile structure
INSERT INTO users (email, username, profile) VALUES 
('john@example.com', 'john_doe', '{
    "personal": {
        "firstName": "John",
        "lastName": "Doe",
        "age": 30
    },
    "preferences": {
        "theme": "dark",
        "notifications": ["email", "sms"],
        "language": "en"
    },
    "settings": {
        "privacy": "public",
        "twoFactorEnabled": true
    }
}');

-- Efficient JSONB queries
-- Find users by nested properties
SELECT username, profile->'personal'->>'firstName' as first_name
FROM users 
WHERE profile->'personal'->>'age'::int > 25
AND profile->'settings'->>'twoFactorEnabled' = 'true';

-- Update nested JSON properties
UPDATE users 
SET profile = jsonb_set(
    profile, 
    '{preferences,theme}', 
    '"light"'
) 
WHERE username = 'john_doe';

-- Add elements to JSON arrays
UPDATE users 
SET profile = jsonb_set(
    profile,
    '{preferences,notifications}',
    (profile->'preferences'->'notifications') || '["push"]'::jsonb
)
WHERE profile->'preferences' ? 'notifications';

-- Create expression index for JSON queries
CREATE INDEX idx_users_profile_age 
    ON users((profile->'personal'->>'age')::int);
CREATE INDEX idx_users_profile_notifications 
    ON users USING GIN ((profile->'preferences'->'notifications'));`,
        
        performanceTuning: `
-- Performance analysis and optimization
-- Identify slow queries
SELECT 
    calls,
    total_exec_time,
    mean_exec_time,
    stddev_exec_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent,
    query
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Analyze table statistics
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation,
    most_common_vals,
    most_common_freqs
FROM pg_stats 
WHERE tablename = 'users' 
ORDER BY n_distinct DESC;

-- Check index usage
SELECT 
    indexrelname as index_name,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    relname as table_name
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- Vacuum and analyze recommendations
SELECT 
    schemaname,
    tablename,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_live_tup,
    n_dead_tup,
    ROUND(n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0) * 100, 2) as dead_ratio
FROM pg_stat_user_tables 
WHERE n_dead_tup > 1000
ORDER BY dead_ratio DESC;`
      },
      
      bestPractices: [
        'Use appropriate data types and avoid VARCHAR without limits',
        'Design normalized schemas but denormalize when needed for performance',
        'Create indexes strategically based on query patterns',
        'Use EXPLAIN ANALYZE to understand query execution plans',
        'Implement proper constraints and foreign keys',
        'Use transactions appropriately with correct isolation levels',
        'Regular VACUUM and ANALYZE for table maintenance',
        'Monitor and tune PostgreSQL configuration parameters',
        'Implement connection pooling for high-traffic applications',
        'Use prepared statements to prevent SQL injection',
        'Partition large tables for better performance',
        'Implement proper backup and recovery strategies',
        'Use JSONB for semi-structured data instead of JSON',
        'Monitor slow queries and optimize regularly',
        'Keep PostgreSQL version updated for security and performance'
      ],
      
      systemPromptAdditions: `
You are a PostgreSQL expert specializing in:
- Database design and normalization techniques
- Query optimization and performance tuning
- Advanced PostgreSQL features (JSONB, arrays, CTEs, window functions)
- Replication and high availability setup
- Security configuration and best practices
- Backup and disaster recovery strategies
- Monitoring and maintenance procedures

When working with PostgreSQL:
- Always consider data integrity and ACID compliance
- Use appropriate indexes based on query patterns
- Implement proper error handling and transactions
- Consider performance implications of schema design
- Use PostgreSQL-specific features when beneficial
- Monitor query performance with EXPLAIN ANALYZE
- Implement proper security measures
- Plan for scalability and high availability`
    };
  }
  
  /**
   * MySQL Expertise
   */
  static getMySQLExpertise() {
    return {
      name: 'MySQL Expert',
      
      expertise: {
        core: {
          version: 'MySQL 8.0+, InnoDB engine, ACID compliance, MVCC',
          dataTypes: 'JSON, spatial types, generated columns, invisible columns',
          features: 'Window functions, CTEs, roles, document store',
          replication: 'Master-slave, master-master, Group Replication, binlog',
          clustering: 'MySQL Cluster (NDB), Galera Cluster, ProxySQL'
        },
        
        storage: {
          engines: 'InnoDB, MyISAM, Memory, Archive, Federated',
          innodb: 'Buffer pool, redo logs, doublewrite buffer, adaptive hash',
          compression: 'Row compression, page compression, transparent compression',
          encryption: 'Data-at-rest encryption, binlog encryption, keyring'
        },
        
        performance: {
          indexing: 'B-tree, Hash, R-tree, Full-text indexes, invisible indexes',
          optimization: 'Query cache, optimizer hints, cost model, histograms',
          profiling: 'Performance Schema, slow query log, EXPLAIN FORMAT=JSON',
          tuning: 'Configuration variables, buffer sizing, connection management'
        },
        
        scaling: {
          replication: 'Read replicas, multi-source replication, delayed replication',
          sharding: 'Horizontal partitioning, MySQL Router, database sharding',
          clustering: 'MySQL Cluster, automatic failover, load balancing',
          proxy: 'ProxySQL, MySQL Router, connection multiplexing'
        }
      },
      
      capabilities: [
        'MySQL database design and optimization',
        'InnoDB engine tuning and configuration',
        'Replication setup and management',
        'Performance monitoring and tuning',
        'Backup and recovery strategies',
        'Security configuration',
        'Clustering and high availability',
        'Query optimization',
        'Schema migration',
        'Monitoring and alerting'
      ],
      
      codePatterns: {
        optimizedTable: `
-- MySQL 8.0 optimized table with modern features
CREATE TABLE orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    order_number VARCHAR(20) GENERATED ALWAYS AS (
        CONCAT('ORD-', LPAD(id, 10, '0'))
    ) STORED UNIQUE,
    order_data JSON NOT NULL,
    total_amount DECIMAL(10,2) AS (
        JSON_UNQUOTE(JSON_EXTRACT(order_data, '$.total'))
    ) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_total_amount (total_amount),
    INDEX idx_order_data_status (
        (CAST(JSON_UNQUOTE(JSON_EXTRACT(order_data, '$.status')) AS CHAR(20)))
    ),
    
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci
  ROW_FORMAT=DYNAMIC;`,
        
        partitioning: `
-- Range partitioning by date
CREATE TABLE sales (
    id BIGINT UNSIGNED AUTO_INCREMENT,
    sale_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    customer_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    
    PRIMARY KEY (id, sale_date),
    INDEX idx_customer_date (customer_id, sale_date),
    INDEX idx_product_amount (product_id, amount)
) ENGINE=InnoDB
PARTITION BY RANGE (YEAR(sale_date)) (
    PARTITION p2022 VALUES LESS THAN (2023),
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Hash partitioning for even distribution
CREATE TABLE user_sessions (
    session_id VARCHAR(128) NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data JSON,
    
    PRIMARY KEY (session_id, user_id),
    INDEX idx_user_created (user_id, created_at)
) ENGINE=InnoDB
PARTITION BY HASH(user_id) PARTITIONS 8;`,
        
        jsonOperations: `
-- MySQL JSON operations and indexing
-- Create table with JSON column
CREATE TABLE products (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    attributes JSON NOT NULL,
    price DECIMAL(10,2) AS (
        CAST(JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.price')) AS DECIMAL(10,2))
    ) STORED,
    
    INDEX idx_price (price),
    INDEX idx_category (
        (CAST(JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.category')) AS CHAR(50)))
    )
);

-- JSON operations
INSERT INTO products (name, attributes) VALUES 
('Laptop', JSON_OBJECT(
    'category', 'Electronics',
    'price', 999.99,
    'specs', JSON_OBJECT(
        'cpu', 'Intel i7',
        'ram', '16GB',
        'storage', '512GB SSD'
    ),
    'tags', JSON_ARRAY('laptop', 'computer', 'portable')
));

-- Query JSON data
SELECT 
    name,
    JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.category')) as category,
    price,
    JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.specs.cpu')) as cpu
FROM products 
WHERE JSON_EXTRACT(attributes, '$.category') = 'Electronics'
AND price BETWEEN 500 AND 1500;

-- Update JSON data
UPDATE products 
SET attributes = JSON_SET(
    attributes, 
    '$.specs.ram', '32GB',
    '$.tags', JSON_ARRAY_APPEND(attributes->'$.tags', '$', 'high-performance')
)
WHERE id = 1;`,
        
        replicationSetup: `
-- MySQL Replication Configuration
-- Master configuration (my.cnf)
/*
[mysqld]
server-id = 1
log-bin = mysql-bin
binlog-format = ROW
gtid-mode = ON
enforce-gtid-consistency = ON
log-slave-updates = ON
binlog-do-db = production_db
*/

-- Create replication user
CREATE USER 'repl_user'@'%' IDENTIFIED BY 'strong_password';
GRANT REPLICATION SLAVE ON *.* TO 'repl_user'@'%';
FLUSH PRIVILEGES;

-- Check master status
SHOW MASTER STATUS;

-- Slave configuration
/*
[mysqld]
server-id = 2
read-only = 1
log-bin = mysql-bin
binlog-format = ROW
gtid-mode = ON
enforce-gtid-consistency = ON
log-slave-updates = ON
*/

-- Setup slave
CHANGE MASTER TO
    MASTER_HOST = 'master_server_ip',
    MASTER_USER = 'repl_user',
    MASTER_PASSWORD = 'strong_password',
    MASTER_AUTO_POSITION = 1;

START SLAVE;
SHOW SLAVE STATUS\G`
      },
      
      bestPractices: [
        'Use InnoDB engine for ACID compliance and row-level locking',
        'Enable slow query log and monitor query performance',
        'Use appropriate column types and avoid oversized columns',
        'Implement proper indexing strategy based on query patterns',
        'Use prepared statements to prevent SQL injection',
        'Configure InnoDB buffer pool appropriately (70-80% of RAM)',
        'Regular backup using mysqldump or MySQL Enterprise Backup',
        'Monitor replication lag in master-slave setups',
        'Use connection pooling for high-traffic applications',
        'Keep MySQL updated for security and performance improvements',
        'Use JSON data type for semi-structured data in MySQL 8.0+',
        'Implement proper error handling and transaction management',
        'Monitor and optimize configuration variables',
        'Use partitioning for very large tables',
        'Implement proper security measures and user privileges'
      ],
      
      systemPromptAdditions: `
You are a MySQL expert specializing in:
- MySQL 8.0+ features and capabilities
- InnoDB storage engine optimization
- Database design and performance tuning
- Replication and high availability
- JSON operations and generated columns
- Security configuration and best practices
- Backup and recovery strategies

When working with MySQL:
- Always use InnoDB engine for transactional integrity
- Consider MySQL 8.0+ specific features like JSON functions
- Implement proper indexing strategies
- Use appropriate data types and constraints
- Monitor query performance with EXPLAIN
- Configure replication for high availability
- Implement proper security measures
- Plan for backup and disaster recovery`
    };
  }
  
  /**
   * General SQL Expertise
   */
  static getSQLExpertise() {
    return {
      name: 'SQL Expert',
      
      expertise: {
        core: {
          standards: 'SQL:2023, ANSI SQL, database portability',
          ddl: 'CREATE, ALTER, DROP statements, constraints, indexes',
          dml: 'SELECT, INSERT, UPDATE, DELETE, MERGE statements',
          tcl: 'COMMIT, ROLLBACK, SAVEPOINT, transaction management',
          dcl: 'GRANT, REVOKE, user management, security'
        },
        
        advanced: {
          joins: 'INNER, LEFT, RIGHT, FULL OUTER, CROSS, self joins',
          subqueries: 'Correlated, non-correlated, EXISTS, IN, scalar subqueries',
          cte: 'Common Table Expressions, recursive CTEs, multiple CTEs',
          window: 'ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD, aggregates',
          pivoting: 'PIVOT, UNPIVOT, CASE WHEN for data transformation'
        },
        
        optimization: {
          indexing: 'Index selection, composite indexes, covering indexes',
          statistics: 'Query plan analysis, cardinality estimation',
          execution: 'Query execution plans, cost-based optimization',
          tuning: 'Query rewriting, hint usage, performance patterns'
        },
        
        design: {
          normalization: '1NF, 2NF, 3NF, BCNF, denormalization strategies',
          modeling: 'Entity-relationship modeling, dimensional modeling',
          constraints: 'Primary keys, foreign keys, check constraints, unique',
          patterns: 'Star schema, snowflake schema, data vault'
        }
      },
      
      capabilities: [
        'SQL query writing and optimization',
        'Database schema design',
        'Performance tuning and analysis',
        'Data modeling and normalization',
        'Complex query development',
        'Index design and optimization',
        'Transaction management',
        'Data migration and ETL',
        'Report and analytics queries',
        'Database security implementation'
      ],
      
      codePatterns: {
        complexAnalytics: `
-- Advanced analytics with window functions and CTEs
WITH monthly_sales AS (
    SELECT 
        DATE_TRUNC('month', order_date) as month,
        product_category,
        SUM(amount) as monthly_total,
        COUNT(*) as order_count,
        AVG(amount) as avg_order_value
    FROM orders o
    JOIN products p ON o.product_id = p.id
    WHERE order_date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', order_date), product_category
),
category_trends AS (
    SELECT 
        month,
        product_category,
        monthly_total,
        LAG(monthly_total) OVER (
            PARTITION BY product_category 
            ORDER BY month
        ) as prev_month_total,
        SUM(monthly_total) OVER (
            PARTITION BY product_category 
            ORDER BY month 
            ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
        ) as rolling_3_month_total,
        ROW_NUMBER() OVER (
            PARTITION BY month 
            ORDER BY monthly_total DESC
        ) as category_rank
    FROM monthly_sales
)
SELECT 
    month,
    product_category,
    monthly_total,
    ROUND(
        (monthly_total - prev_month_total) * 100.0 / prev_month_total, 
        2
    ) as month_over_month_growth,
    rolling_3_month_total / 3 as avg_3_month_sales,
    category_rank
FROM category_trends
WHERE month >= CURRENT_DATE - INTERVAL '6 months'
ORDER BY month DESC, category_rank;`,
        
        dataQualityChecks: `
-- Comprehensive data quality validation
-- Missing value analysis
SELECT 
    'users' as table_name,
    'email' as column_name,
    COUNT(*) as total_rows,
    COUNT(email) as non_null_count,
    COUNT(*) - COUNT(email) as null_count,
    ROUND((COUNT(*) - COUNT(email)) * 100.0 / COUNT(*), 2) as null_percentage
FROM users
UNION ALL
SELECT 
    'users', 'phone',
    COUNT(*), COUNT(phone), COUNT(*) - COUNT(phone),
    ROUND((COUNT(*) - COUNT(phone)) * 100.0 / COUNT(*), 2)
FROM users;

-- Duplicate detection
SELECT 
    email,
    COUNT(*) as duplicate_count
FROM users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Data consistency checks
SELECT 
    'Invalid Email Format' as issue_type,
    COUNT(*) as issue_count
FROM users 
WHERE email IS NOT NULL 
AND email NOT LIKE '%@%.%'
UNION ALL
SELECT 
    'Future Birth Date',
    COUNT(*)
FROM users 
WHERE birth_date > CURRENT_DATE
UNION ALL
SELECT 
    'Negative Order Amount',
    COUNT(*)
FROM orders 
WHERE amount < 0;`,
        
        performanceOptimization: `
-- Query optimization techniques
-- Before: Inefficient query
/*
SELECT u.username, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2023-01-01'
GROUP BY u.id, u.username
HAVING COUNT(o.id) > 5
ORDER BY order_count DESC;
*/

-- After: Optimized query with proper indexing
-- Index suggestions:
-- CREATE INDEX idx_users_created_at ON users(created_at);
-- CREATE INDEX idx_orders_user_id ON orders(user_id);

WITH active_users AS (
    SELECT id, username
    FROM users 
    WHERE created_at > '2023-01-01'
),
user_order_counts AS (
    SELECT 
        u.username,
        COUNT(o.id) as order_count
    FROM active_users u
    LEFT JOIN orders o ON u.id = o.user_id
    GROUP BY u.id, u.username
    HAVING COUNT(o.id) > 5
)
SELECT username, order_count
FROM user_order_counts
ORDER BY order_count DESC;

-- Efficient pagination
-- Instead of OFFSET/LIMIT for large datasets
SELECT *
FROM products
WHERE id > :last_seen_id
ORDER BY id
LIMIT 20;

-- Efficient EXISTS instead of IN for large subqueries
SELECT DISTINCT u.username
FROM users u
WHERE EXISTS (
    SELECT 1 
    FROM orders o 
    WHERE o.user_id = u.id 
    AND o.created_at > CURRENT_DATE - INTERVAL '30 days'
);`
      },
      
      bestPractices: [
        'Write readable SQL with proper formatting and comments',
        'Use meaningful table and column aliases',
        'Prefer EXISTS over IN for subqueries when possible',
        'Use appropriate JOIN types and avoid Cartesian products',
        'Implement proper WHERE clause filtering early',
        'Use LIMIT/TOP for large result sets',
        'Index foreign keys and frequently queried columns',
        'Avoid SELECT * in production queries',
        'Use parameterized queries to prevent SQL injection',
        'Consider query execution plans before deployment',
        'Use transactions appropriately for data consistency',
        'Implement proper error handling',
        'Regular ANALYZE/UPDATE STATISTICS for optimal plans',
        'Use appropriate data types and constraints',
        'Document complex queries and business logic'
      ],
      
      systemPromptAdditions: `
You are a SQL expert specializing in:
- Advanced SQL query writing and optimization
- Database design and normalization
- Performance tuning and execution plan analysis
- Cross-platform SQL development
- Data analysis and reporting queries
- Database security and best practices

When writing SQL:
- Always consider performance implications
- Use proper indexing strategies
- Write readable and maintainable code
- Implement appropriate constraints and validations
- Consider data integrity and consistency
- Use standard SQL when possible for portability
- Optimize for the specific database engine
- Include proper error handling and validation`
    };
  }
}

module.exports = DatabaseExpertise;