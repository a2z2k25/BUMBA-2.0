/**
 * BUMBA MySQL Specialist
 * Expert in MySQL database administration, optimization, and development
 */

const UnifiedSpecialistBase = require('../../unified-specialist-base');

class MySQLSpecialist extends UnifiedSpecialistBase {
  constructor() {
    super({
      name: 'MySQL Specialist',
      expertise: ['MySQL', 'Database Design', 'Performance Tuning', 'Replication'],
      models: ['claude-3-opus-20240229', 'gpt-4'],
      temperature: 0.3,
      systemPrompt: `You are a MySQL expert specializing in:
        - MySQL database design and normalization
        - Query optimization and performance tuning
        - MySQL replication and high availability
        - Storage engines (InnoDB, MyISAM) optimization
        - Backup and recovery strategies
        - Security and access control
        - Monitoring and troubleshooting
        - MySQL 8.0 features and improvements
        Always prioritize data integrity, performance, and reliability.`
    });

    this.capabilities = {
      design: true,
      optimization: true,
      replication: true,
      administration: true,
      security: true,
      monitoring: true,
      backup: true,
      tuning: true
    };
  }

  async designDatabase(context) {
    const analysis = await this.analyze(context);
    
    return {
      schema: this.generateSchema(analysis),
      indexes: this.optimizeIndexes(analysis),
      configuration: this.optimizeConfiguration(analysis),
      replication: this.setupReplication(analysis)
    };
  }

  generateSchema(analysis) {
    return `-- MySQL Database Schema for ${analysis.projectName || 'Application'}

-- Create database with proper character set
CREATE DATABASE ${analysis.databaseName || 'app_db'} 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE ${analysis.databaseName || 'app_db'};

-- Users table
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    profile_image_url TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    email_verified_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    user_role ENUM('user', 'admin', 'moderator') DEFAULT 'user',
    metadata JSON,
    
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_created_at (created_at),
    INDEX idx_last_login (last_login_at),
    INDEX idx_active_users (is_active, created_at),
    FULLTEXT idx_fulltext_search (first_name, last_name, bio)
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci
  COMMENT='User accounts and profiles';

-- Categories table (hierarchical)
CREATE TABLE categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    parent_id INT UNSIGNED NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_parent_id (parent_id),
    INDEX idx_slug (slug),
    INDEX idx_active_sort (is_active, sort_order),
    
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Product categories hierarchy';

-- Products table
CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    short_description VARCHAR(500),
    category_id INT UNSIGNED,
    brand VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    compare_price DECIMAL(10, 2),
    cost_price DECIMAL(10, 2),
    weight DECIMAL(8, 3),
    dimensions JSON,
    stock_quantity INT UNSIGNED DEFAULT 0,
    low_stock_threshold INT UNSIGNED DEFAULT 10,
    track_inventory BOOLEAN DEFAULT TRUE,
    status ENUM('active', 'draft', 'archived') DEFAULT 'draft',
    visibility ENUM('public', 'private', 'hidden') DEFAULT 'public',
    featured BOOLEAN DEFAULT FALSE,
    seo_title VARCHAR(255),
    seo_description VARCHAR(500),
    tags JSON,
    attributes JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_sku (sku),
    INDEX idx_slug (slug),
    INDEX idx_category (category_id),
    INDEX idx_brand (brand),
    INDEX idx_price (price),
    INDEX idx_status_visibility (status, visibility),
    INDEX idx_featured (featured),
    INDEX idx_stock (stock_quantity),
    INDEX idx_created_at (created_at),
    FULLTEXT idx_product_search (name, description, brand, tags),
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Product catalog';

-- Product images table
CREATE TABLE product_images (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    sort_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_product_id (product_id),
    INDEX idx_primary (product_id, is_primary),
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci;

-- Orders table
CREATE TABLE orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    user_id BIGINT UNSIGNED NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    shipping_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    
    billing_address JSON,
    shipping_address JSON,
    
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    
    notes TEXT,
    admin_notes TEXT,
    
    shipped_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_order_number (order_number),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at),
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_total_amount (total_amount),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Customer orders';

-- Order items table
CREATE TABLE order_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    product_data JSON, -- Snapshot of product at time of order
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id),
    INDEX idx_sku (product_sku),
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci;

-- Reviews table
CREATE TABLE reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED,
    rating TINYINT UNSIGNED NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count INT UNSIGNED DEFAULT 0,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_product_id (product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_order_id (order_id),
    INDEX idx_rating (rating),
    INDEX idx_status (status),
    INDEX idx_product_rating (product_id, rating),
    INDEX idx_created_at (created_at),
    FULLTEXT idx_review_search (title, content),
    
    UNIQUE KEY unique_user_product_order (user_id, product_id, order_id),
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci;

-- Shopping cart table
CREATE TABLE cart_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id),
    INDEX idx_added_at (added_at),
    
    UNIQUE KEY unique_user_product (user_id, product_id),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci;

-- Audit log table
CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(64) NOT NULL,
    operation ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    record_id BIGINT UNSIGNED NOT NULL,
    old_values JSON,
    new_values JSON,
    user_id BIGINT UNSIGNED,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_table_operation (table_name, operation),
    INDEX idx_record_id (record_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Audit trail for data changes';

-- Create triggers for audit logging
DELIMITER $$

CREATE TRIGGER users_audit_insert 
AFTER INSERT ON users 
FOR EACH ROW 
BEGIN
    INSERT INTO audit_logs (table_name, operation, record_id, new_values, user_id) 
    VALUES ('users', 'INSERT', NEW.id, JSON_OBJECT('email', NEW.email, 'username', NEW.username), NEW.id);
END$$

CREATE TRIGGER users_audit_update 
AFTER UPDATE ON users 
FOR EACH ROW 
BEGIN
    INSERT INTO audit_logs (table_name, operation, record_id, old_values, new_values, user_id) 
    VALUES ('users', 'UPDATE', NEW.id, 
            JSON_OBJECT('email', OLD.email, 'username', OLD.username),
            JSON_OBJECT('email', NEW.email, 'username', NEW.username), 
            NEW.id);
END$$

CREATE TRIGGER products_audit_update 
AFTER UPDATE ON products 
FOR EACH ROW 
BEGIN
    INSERT INTO audit_logs (table_name, operation, record_id, old_values, new_values) 
    VALUES ('products', 'UPDATE', NEW.id, 
            JSON_OBJECT('price', OLD.price, 'stock_quantity', OLD.stock_quantity),
            JSON_OBJECT('price', NEW.price, 'stock_quantity', NEW.stock_quantity));
END$$

DELIMITER ;

-- Create views for common queries
CREATE VIEW active_products AS
SELECT 
    p.id,
    p.sku,
    p.name,
    p.slug,
    p.price,
    p.stock_quantity,
    p.brand,
    c.name AS category_name,
    AVG(r.rating) AS avg_rating,
    COUNT(r.id) AS review_count
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN reviews r ON p.id = r.product_id AND r.status = 'approved'
WHERE p.status = 'active' AND p.visibility = 'public'
GROUP BY p.id, p.sku, p.name, p.slug, p.price, p.stock_quantity, p.brand, c.name;

CREATE VIEW user_order_summary AS
SELECT 
    u.id AS user_id,
    u.email,
    u.first_name,
    u.last_name,
    COUNT(o.id) AS total_orders,
    SUM(o.total_amount) AS total_spent,
    AVG(o.total_amount) AS avg_order_value,
    MAX(o.created_at) AS last_order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id AND o.status IN ('delivered', 'shipped')
GROUP BY u.id, u.email, u.first_name, u.last_name;`;
  }

  optimizeIndexes(analysis) {
    return `-- MySQL Index Optimization Strategies

-- Analyze existing indexes
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX,
    CARDINALITY,
    INDEX_TYPE
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = '${analysis.databaseName || 'app_db'}'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- Find unused indexes
SELECT 
    s.TABLE_SCHEMA,
    s.TABLE_NAME,
    s.INDEX_NAME,
    s.CARDINALITY
FROM INFORMATION_SCHEMA.STATISTICS s
LEFT JOIN INFORMATION_SCHEMA.INDEX_STATISTICS i 
    ON s.TABLE_SCHEMA = i.TABLE_SCHEMA 
    AND s.TABLE_NAME = i.TABLE_NAME 
    AND s.INDEX_NAME = i.INDEX_NAME
WHERE s.TABLE_SCHEMA = '${analysis.databaseName || 'app_db'}'
    AND i.INDEX_NAME IS NULL
    AND s.INDEX_NAME != 'PRIMARY';

-- Composite index examples for common query patterns

-- Orders by user and date range
CREATE INDEX idx_orders_user_date ON orders (user_id, created_at);

-- Products by category, status, and price
CREATE INDEX idx_products_category_status_price ON products (category_id, status, price);

-- Product search with filters
CREATE INDEX idx_products_search ON products (status, visibility, featured, price);

-- Order items for reporting
CREATE INDEX idx_order_items_product_date ON order_items (product_id, created_at);

-- Reviews for product pages
CREATE INDEX idx_reviews_product_status_rating ON reviews (product_id, status, rating);

-- Covering indexes (include all needed columns)
CREATE INDEX idx_products_list_covering ON products (
    category_id, status, visibility, 
    id, name, price, stock_quantity, featured
);

-- Functional indexes (MySQL 8.0)
CREATE INDEX idx_users_email_domain ON users ((SUBSTRING_INDEX(email, '@', -1)));

-- Prefix indexes for long text fields
CREATE INDEX idx_products_description_prefix ON products (description(50));

-- Index usage analysis queries
SELECT 
    object_schema,
    object_name,
    index_name,
    count_read,
    count_write,
    count_read / (count_read + count_write) * 100 AS read_pct
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE object_schema = '${analysis.databaseName || 'app_db'}'
    AND count_read > 0
ORDER BY count_read DESC;

-- Index size analysis
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    ROUND(stat_value * @@innodb_page_size / 1024 / 1024, 2) AS size_mb
FROM mysql.innodb_index_stats 
WHERE database_name = '${analysis.databaseName || 'app_db'}'
    AND stat_name = 'size'
ORDER BY stat_value DESC;

-- Identify duplicate indexes
SELECT 
    a.TABLE_NAME,
    a.INDEX_NAME AS index1,
    b.INDEX_NAME AS index2,
    GROUP_CONCAT(a.COLUMN_NAME ORDER BY a.SEQ_IN_INDEX) AS columns1,
    GROUP_CONCAT(b.COLUMN_NAME ORDER BY b.SEQ_IN_INDEX) AS columns2
FROM INFORMATION_SCHEMA.STATISTICS a
JOIN INFORMATION_SCHEMA.STATISTICS b ON (
    a.TABLE_SCHEMA = b.TABLE_SCHEMA
    AND a.TABLE_NAME = b.TABLE_NAME
    AND a.INDEX_NAME < b.INDEX_NAME
)
WHERE a.TABLE_SCHEMA = '${analysis.databaseName || 'app_db'}'
GROUP BY a.TABLE_NAME, a.INDEX_NAME, b.INDEX_NAME
HAVING columns1 = columns2;

-- Index maintenance commands
OPTIMIZE TABLE products;
ANALYZE TABLE products;
CHECK TABLE products;

-- Online DDL for index creation (MySQL 8.0)
ALTER TABLE products 
ADD INDEX idx_new_composite (brand, price, stock_quantity),
ALGORITHM=INPLACE, 
LOCK=NONE;`;
  }

  optimizeConfiguration(analysis) {
    return `# MySQL Configuration Optimization (my.cnf)

[mysql]
default-character-set = utf8mb4

[mysqld]
# Basic settings
user = mysql
port = 3306
basedir = /usr
datadir = /var/lib/mysql
tmpdir = /tmp
socket = /var/lib/mysql/mysql.sock
pid-file = /var/run/mysqld/mysqld.pid

# Character set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
init_connect = 'SET NAMES utf8mb4'

# Memory settings (adjust based on available RAM)
innodb_buffer_pool_size = ${analysis.memoryGB ? analysis.memoryGB * 0.7 + 'G' : '4G'}    # 70% of RAM
innodb_buffer_pool_instances = ${Math.max(1, Math.floor((analysis.memoryGB || 8) * 0.7 / 1))}    # 1 instance per GB
innodb_log_buffer_size = 64M
key_buffer_size = 256M
sort_buffer_size = 2M
read_buffer_size = 1M
read_rnd_buffer_size = 4M
join_buffer_size = 2M
tmp_table_size = 256M
max_heap_table_size = 256M

# Connection settings
max_connections = ${analysis.maxConnections || 200}
max_connect_errors = 100000
connect_timeout = 60
wait_timeout = 28800
interactive_timeout = 28800
net_read_timeout = 30
net_write_timeout = 60

# InnoDB settings
innodb_file_per_table = 1
innodb_flush_method = O_DIRECT
innodb_flush_log_at_trx_commit = 1
innodb_log_file_size = 1G
innodb_log_files_in_group = 2
innodb_max_dirty_pages_pct = 75
innodb_lock_wait_timeout = 50
innodb_io_capacity = 200
innodb_io_capacity_max = 2000
innodb_read_io_threads = 4
innodb_write_io_threads = 4
innodb_thread_concurrency = 0
innodb_purge_threads = 4
innodb_page_cleaners = 4

# Query cache (disabled in MySQL 8.0)
# query_cache_type = 1
# query_cache_size = 256M
# query_cache_limit = 2M

# Slow query log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
log_queries_not_using_indexes = 1
min_examined_row_limit = 1000

# Binary logging
log_bin = /var/log/mysql/mysql-bin.log
binlog_format = ROW
binlog_expire_logs_seconds = 604800  # 7 days
max_binlog_size = 1G
sync_binlog = 1

# Replication settings
server_id = 1
gtid_mode = ON
enforce_gtid_consistency = ON
log_slave_updates = ON
relay_log = /var/log/mysql/relay-bin.log
relay_log_recovery = ON

# Error logging
log_error = /var/log/mysql/error.log
log_error_verbosity = 2

# General query log (disable in production)
# general_log = 1
# general_log_file = /var/log/mysql/general.log

# Security settings
local_infile = 0
skip_show_database
symbolic_links = 0

# Performance Schema
performance_schema = ON
performance_schema_max_table_instances = 400
performance_schema_max_table_handles = 4000

# Table settings
table_open_cache = 4000
table_definition_cache = 2000
open_files_limit = 65535

# Thread settings
thread_cache_size = 50
thread_stack = 262144

# Other optimizations
bulk_insert_buffer_size = 64M
myisam_sort_buffer_size = 128M
myisam_max_sort_file_size = 10G
myisam_repair_threads = 1

# MySQL 8.0 specific settings
default_authentication_plugin = mysql_native_password
caching_sha2_password_auto_generate_rsa_keys = ON
mysqlx_port = 33060
mysqlx_socket = /var/lib/mysql/mysqlx.sock

# Optimizer settings
optimizer_switch = 'index_merge=on,index_merge_union=on,index_merge_sort_union=on,index_merge_intersection=on,engine_condition_pushdown=on,index_condition_pushdown=on,mrr=on,mrr_cost_based=on,block_nested_loop=on,batched_key_access=off,materialization=on,semijoin=on,loosescan=on,firstmatch=on,duplicateweedout=on,subquery_materialization_cost_based=on,use_index_extensions=on,condition_fanout_filter=on,derived_merge=on,use_invisible_indexes=off,skip_scan=on,hash_join=on'

[mysqldump]
quick
quote-names
max_allowed_packet = 1G

[mysql]
no-auto-rehash

[myisamchk]
key_buffer_size = 512M
sort_buffer_size = 512M
read_buffer = 8M
write_buffer = 8M

[mysqlhotcopy]
interactive-timeout

# Performance optimization script
# /usr/local/bin/mysql_optimize.sh
#!/bin/bash

# Variables
DB_NAME="${analysis.databaseName || 'app_db'}"
MYSQL_USER="root"
MYSQL_PASS="your_password"

# Optimize tables
echo "Optimizing tables..."
mysql -u\$MYSQL_USER -p\$MYSQL_PASS -e "
SELECT CONCAT('OPTIMIZE TABLE ', table_schema, '.', table_name, ';') 
FROM information_schema.tables 
WHERE table_schema = '\$DB_NAME' AND engine = 'InnoDB';" | 
grep -v CONCAT | mysql -u\$MYSQL_USER -p\$MYSQL_PASS

# Update table statistics
echo "Updating table statistics..."
mysql -u\$MYSQL_USER -p\$MYSQL_PASS -e "
SELECT CONCAT('ANALYZE TABLE ', table_schema, '.', table_name, ';') 
FROM information_schema.tables 
WHERE table_schema = '\$DB_NAME';" | 
grep -v CONCAT | mysql -u\$MYSQL_USER -p\$MYSQL_PASS

echo "Optimization complete!"`;
  }

  setupReplication(analysis) {
    return `-- MySQL Master-Slave Replication Setup

-- Master Server Configuration (my.cnf)
[mysqld]
# Unique server ID
server_id = 1

# Binary logging
log_bin = /var/log/mysql/mysql-bin.log
binlog_format = ROW
binlog_expire_logs_seconds = 604800
max_binlog_size = 1G
sync_binlog = 1

# GTID for easier failover
gtid_mode = ON
enforce_gtid_consistency = ON

# Master info
log_slave_updates = ON
binlog_do_db = ${analysis.databaseName || 'app_db'}

-- Slave Server Configuration (my.cnf)
[mysqld]
# Unique server ID  
server_id = 2

# Relay log
relay_log = /var/log/mysql/relay-bin.log
relay_log_recovery = ON

# GTID
gtid_mode = ON
enforce_gtid_consistency = ON
log_slave_updates = ON

# Read-only (optional)
read_only = 1
super_read_only = 1

-- Master Setup Commands
-- 1. Create replication user
CREATE USER 'replicator'@'slave_ip_address' IDENTIFIED BY 'strong_password';
GRANT REPLICATION SLAVE ON *.* TO 'replicator'@'slave_ip_address';
FLUSH PRIVILEGES;

-- 2. Check master status
SHOW MASTER STATUS;

-- 3. Take backup for slave initialization
mysqldump -u root -p --single-transaction --routines --triggers \\
  --master-data=2 --databases ${analysis.databaseName || 'app_db'} > master_backup.sql

-- Slave Setup Commands
-- 1. Restore backup
mysql -u root -p < master_backup.sql

-- 2. Configure slave connection
CHANGE MASTER TO
    MASTER_HOST = 'master_ip_address',
    MASTER_USER = 'replicator',
    MASTER_PASSWORD = 'strong_password',
    MASTER_AUTO_POSITION = 1;

-- 3. Start slave
START SLAVE;

-- 4. Check slave status
SHOW SLAVE STATUS\\G

-- Master-Master Replication Setup
-- Server 1 Configuration
[mysqld]
server_id = 1
auto_increment_increment = 2
auto_increment_offset = 1
log_bin = mysql-bin
binlog_format = ROW

-- Server 2 Configuration
[mysqld]
server_id = 2
auto_increment_increment = 2
auto_increment_offset = 2
log_bin = mysql-bin
binlog_format = ROW

-- Monitoring Replication
-- Check replication lag
SELECT 
    CASE 
        WHEN lag < 60 THEN CONCAT(lag, ' seconds')
        WHEN lag < 3600 THEN CONCAT(ROUND(lag/60, 1), ' minutes')
        ELSE CONCAT(ROUND(lag/3600, 1), ' hours')
    END AS replication_lag
FROM (
    SELECT TIMESTAMPDIFF(SECOND, 
        STR_TO_DATE(SUBSTRING_INDEX(SUBSTRING_INDEX(executed_gtid_set, ':', -1), '-', 1), '%Y%m%d'),
        NOW()) AS lag
    FROM performance_schema.replication_connection_status
) t;

-- Replication health check script
#!/bin/bash
# replication_check.sh

MYSQL_USER="root"
MYSQL_PASS="password"
SLAVE_HOST="slave_server"

# Check slave status
SLAVE_STATUS=\$(mysql -h \$SLAVE_HOST -u \$MYSQL_USER -p\$MYSQL_PASS -e "SHOW SLAVE STATUS\\G" 2>/dev/null)

if [ \$? -ne 0 ]; then
    echo "ERROR: Cannot connect to slave server"
    exit 1
fi

# Extract key metrics
IO_RUNNING=\$(echo "\$SLAVE_STATUS" | grep "Slave_IO_Running:" | awk '{print \$2}')
SQL_RUNNING=\$(echo "\$SLAVE_STATUS" | grep "Slave_SQL_Running:" | awk '{print \$2}')
SECONDS_BEHIND=\$(echo "\$SLAVE_STATUS" | grep "Seconds_Behind_Master:" | awk '{print \$2}')

echo "Replication Status:"
echo "IO Thread: \$IO_RUNNING"
echo "SQL Thread: \$SQL_RUNNING"
echo "Seconds Behind Master: \$SECONDS_BEHIND"

if [ "\$IO_RUNNING" != "Yes" ] || [ "\$SQL_RUNNING" != "Yes" ]; then
    echo "ERROR: Replication is not running properly"
    exit 1
fi

if [ "\$SECONDS_BEHIND" != "NULL" ] && [ \$SECONDS_BEHIND -gt 300 ]; then
    echo "WARNING: Replication lag is high (\$SECONDS_BEHIND seconds)"
fi

echo "Replication is healthy"

-- Failover procedures
-- Promote slave to master
STOP SLAVE;
RESET SLAVE ALL;
SET GLOBAL read_only = 0;
SET GLOBAL super_read_only = 0;

-- Point applications to new master
-- Update connection strings

-- Setup new slave (old master)
CHANGE MASTER TO
    MASTER_HOST = 'new_master_ip',
    MASTER_USER = 'replicator',
    MASTER_PASSWORD = 'strong_password',
    MASTER_AUTO_POSITION = 1;

START SLAVE;

-- MySQL Group Replication (MySQL 8.0)
-- Node 1 Configuration
[mysqld]
server_id = 1
gtid_mode = ON
enforce_gtid_consistency = ON
binlog_checksum = NONE
log_bin = binlog
log_slave_updates = ON
binlog_format = ROW

plugin_load_add = 'group_replication.so'
group_replication_group_name = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
group_replication_start_on_boot = off
group_replication_local_address = "node1:33061"
group_replication_group_seeds = "node1:33061,node2:33061,node3:33061"
group_replication_bootstrap_group = off

-- Initialize Group Replication
INSTALL PLUGIN group_replication SONAME 'group_replication.so';
SET GLOBAL group_replication_bootstrap_group=ON;
START GROUP_REPLICATION;
SET GLOBAL group_replication_bootstrap_group=OFF;

-- Check Group Replication status
SELECT * FROM performance_schema.replication_group_members;`;
  }

  async troubleshoot(issue) {
    const solutions = {
      slow_queries: [
        'Use EXPLAIN to analyze query execution plans',
        'Check for missing indexes using SHOW INDEXES',
        'Enable slow query log and analyze with mysqldumpslow',
        'Review MySQL configuration parameters',
        'Consider query rewriting and optimization',
        'Check for full table scans in performance_schema'
      ],
      high_cpu_usage: [
        'Check for long-running queries in SHOW PROCESSLIST',
        'Analyze slow query log for problematic queries',
        'Review innodb_buffer_pool_size setting',
        'Check for unnecessary table scans',
        'Monitor connection count and thread cache'
      ],
      replication_lag: [
        'Check network connectivity between master and slave',
        'Monitor binlog size and retention',
        'Review slave configuration parameters',
        'Check for long-running transactions on master',
        'Ensure slave hardware is adequate'
      ],
      connection_issues: [
        'Check max_connections setting',
        'Review connection timeout parameters',
        'Monitor connection pool configuration',
        'Check for DNS resolution issues',
        'Verify firewall and network connectivity'
      ],
      deadlocks: [
        'Enable innodb_print_all_deadlocks',
        'Review transaction isolation levels',
        'Optimize query order and locking',
        'Implement deadlock retry logic in application',
        'Monitor INFORMATION_SCHEMA.INNODB_TRX table'
      ]
    };
    
    return solutions[issue.type] || ['Review MySQL error logs and performance metrics'];
  }
}

module.exports = MySQLSpecialist;