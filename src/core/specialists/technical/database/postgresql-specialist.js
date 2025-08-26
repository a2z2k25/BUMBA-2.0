/**
 * BUMBA PostgreSQL Specialist
 * Expert in PostgreSQL database administration, optimization, and development
 */

const UnifiedSpecialistBase = require('../../unified-specialist-base');

class PostgreSQLSpecialist extends UnifiedSpecialistBase {
  constructor() {
    super({
      name: 'PostgreSQL Specialist',
      expertise: ['PostgreSQL', 'Database Design', 'Performance Tuning', 'High Availability'],
      models: ['claude-3-opus-20240229', 'gpt-4'],
      temperature: 0.3,
      systemPrompt: `You are a PostgreSQL expert specializing in:
        - Database design and normalization
        - Performance optimization and query tuning
        - High availability and replication
        - Backup and recovery strategies
        - Security and access control
        - Advanced PostgreSQL features (JSON, arrays, extensions)
        - Monitoring and maintenance
        - Migration and upgrades
        Always prioritize data integrity, performance, and security.`
    });

    this.capabilities = {
      design: true,
      optimization: true,
      administration: true,
      highAvailability: true,
      security: true,
      monitoring: true,
      migrations: true,
      extensions: true
    };
  }

  async designDatabase(context) {
    const analysis = await this.analyze(context);
    
    return {
      schema: this.generateSchema(analysis),
      indexes: this.suggestIndexes(analysis),
      constraints: this.defineConstraints(analysis),
      partitioning: this.designPartitioning(analysis)
    };
  }

  generateSchema(analysis) {
    return `-- PostgreSQL Database Schema for ${analysis.projectName || 'Application'}

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    category_id UUID REFERENCES categories(id),
    sku VARCHAR(100) UNIQUE NOT NULL,
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    attributes JSONB,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    parent_id UUID REFERENCES categories(id),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    shipping_address JSONB,
    billing_address JSONB,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    row_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`;
  }

  suggestIndexes(analysis) {
    return `-- PostgreSQL Indexes for Optimal Performance

-- Users table indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_username ON users(username);
CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at);
CREATE INDEX CONCURRENTLY idx_users_is_active ON users(is_active) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY idx_users_metadata_gin ON users USING GIN(metadata);

-- Products table indexes
CREATE INDEX CONCURRENTLY idx_products_category_id ON products(category_id);
CREATE INDEX CONCURRENTLY idx_products_sku ON products(sku);
CREATE INDEX CONCURRENTLY idx_products_price ON products(price);
CREATE INDEX CONCURRENTLY idx_products_stock ON products(stock_quantity) WHERE stock_quantity > 0;
CREATE INDEX CONCURRENTLY idx_products_name_trgm ON products USING GIN(name gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_products_tags_gin ON products USING GIN(tags);
CREATE INDEX CONCURRENTLY idx_products_attributes_gin ON products USING GIN(attributes);
CREATE INDEX CONCURRENTLY idx_products_active ON products(is_active) WHERE is_active = TRUE;

-- Categories table indexes
CREATE INDEX CONCURRENTLY idx_categories_parent_id ON categories(parent_id);
CREATE INDEX CONCURRENTLY idx_categories_slug ON categories(slug);
CREATE INDEX CONCURRENTLY idx_categories_sort_order ON categories(sort_order);

-- Orders table indexes
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders(user_id);
CREATE INDEX CONCURRENTLY idx_orders_status ON orders(status);
CREATE INDEX CONCURRENTLY idx_orders_created_at ON orders(created_at);
CREATE INDEX CONCURRENTLY idx_orders_payment_status ON orders(payment_status);
CREATE INDEX CONCURRENTLY idx_orders_user_created ON orders(user_id, created_at);

-- Order items table indexes
CREATE INDEX CONCURRENTLY idx_order_items_order_id ON order_items(order_id);
CREATE INDEX CONCURRENTLY idx_order_items_product_id ON order_items(product_id);

-- Audit log indexes
CREATE INDEX CONCURRENTLY idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX CONCURRENTLY idx_audit_log_row_id ON audit_log(row_id);
CREATE INDEX CONCURRENTLY idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX CONCURRENTLY idx_audit_log_user_id ON audit_log(user_id);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_products_category_active 
    ON products(category_id, is_active) WHERE is_active = TRUE;

CREATE INDEX CONCURRENTLY idx_orders_user_status_date 
    ON orders(user_id, status, created_at);

-- Partial indexes for better performance
CREATE INDEX CONCURRENTLY idx_orders_pending 
    ON orders(created_at) WHERE status = 'pending';

CREATE INDEX CONCURRENTLY idx_orders_completed 
    ON orders(created_at) WHERE status = 'completed';`;
  }

  optimizePerformance(analysis) {
    return {
      configuration: this.generateOptimalConfig(analysis),
      queries: this.optimizeQueries(analysis),
      maintenance: this.setupMaintenance(analysis)
    };
  }

  generateOptimalConfig(analysis) {
    return `-- PostgreSQL Performance Configuration

-- Memory settings (adjust based on available RAM)
shared_buffers = '${analysis.memoryGB * 0.25 || 1}GB'              -- 25% of RAM
effective_cache_size = '${analysis.memoryGB * 0.75 || 3}GB'        -- 75% of RAM
work_mem = '${Math.max(4, analysis.memoryGB * 0.01 * 1024)}MB'     -- Per query work memory
maintenance_work_mem = '${Math.max(64, analysis.memoryGB * 0.1 * 1024)}MB'  -- For maintenance ops

-- Connection settings
max_connections = ${analysis.maxConnections || 100}
shared_preload_libraries = 'pg_stat_statements'

-- WAL settings
wal_buffers = '16MB'
checkpoint_completion_target = 0.9
checkpoint_timeout = '10min'
max_wal_size = '2GB'
min_wal_size = '512MB'

-- Query planner settings
random_page_cost = 1.1                     -- For SSDs
effective_io_concurrency = 200             -- For SSDs
seq_page_cost = 1.0

-- Logging settings
log_min_duration_statement = 1000          -- Log queries > 1 second
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_statement = 'ddl'
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

-- Statistics settings
track_activities = on
track_counts = on
track_io_timing = on
track_functions = all
stats_temp_directory = '/tmp/pg_stat_tmp'

-- Autovacuum settings
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 20s
autovacuum_vacuum_threshold = 50
autovacuum_analyze_threshold = 50
autovacuum_vacuum_scale_factor = 0.1
autovacuum_analyze_scale_factor = 0.05

-- Background writer settings
bgwriter_delay = 200ms
bgwriter_lru_maxpages = 100
bgwriter_lru_multiplier = 2.0
bgwriter_flush_after = 512kB`;
  }

  setupHighAvailability(analysis) {
    return {
      streaming: this.setupStreamingReplication(analysis),
      failover: this.setupFailover(analysis),
      monitoring: this.setupHAMonitoring(analysis)
    };
  }

  setupStreamingReplication(analysis) {
    return `-- PostgreSQL Streaming Replication Setup

-- Primary server configuration (postgresql.conf)
wal_level = replica
max_wal_senders = 10
max_replication_slots = 10
synchronous_commit = on
synchronous_standby_names = 'standby1,standby2'

-- Archive settings
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/archive/%f && cp %p /var/lib/postgresql/archive/%f'
archive_timeout = 300

-- Hot standby settings
hot_standby = on
max_standby_archive_delay = 30s
max_standby_streaming_delay = 30s

-- pg_hba.conf entries for replication
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    replication     replicator      192.168.1.0/24          md5

-- Create replication user
CREATE USER replicator REPLICATION LOGIN PASSWORD 'secure_password';

-- Standby server setup script
#!/bin/bash

# Stop PostgreSQL on standby
systemctl stop postgresql

# Remove old data directory
rm -rf /var/lib/postgresql/13/main/*

# Take base backup from primary
pg_basebackup -h primary_server_ip -D /var/lib/postgresql/13/main -U replicator -P -W -R

# Set ownership
chown -R postgres:postgres /var/lib/postgresql/13/main

-- recovery.conf (for standby)
standby_mode = 'on'
primary_conninfo = 'host=primary_server_ip port=5432 user=replicator password=secure_password'
trigger_file = '/tmp/postgresql.trigger'

-- Monitoring replication lag
SELECT 
    client_addr,
    application_name,
    state,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), sent_lsn)) as sent_lag,
    pg_size_pretty(pg_wal_lsn_diff(sent_lsn, write_lsn)) as write_lag,
    pg_size_pretty(pg_wal_lsn_diff(write_lsn, flush_lsn)) as flush_lag,
    pg_size_pretty(pg_wal_lsn_diff(flush_lsn, replay_lsn)) as replay_lag
FROM pg_stat_replication;`;
  }

  setupBackupStrategy(analysis) {
    return `-- PostgreSQL Backup and Recovery Strategy

-- Full backup script
#!/bin/bash
# full_backup.sh

BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="${analysis.databaseName || 'mydb'}"

# Create backup directory
mkdir -p $BACKUP_DIR/$DATE

# Full database backup
pg_dump -h localhost -U postgres -Fc $DB_NAME > $BACKUP_DIR/$DATE/full_backup.dump

# Schema-only backup
pg_dump -h localhost -U postgres -s $DB_NAME > $BACKUP_DIR/$DATE/schema_backup.sql

# Globals backup (users, roles, etc.)
pg_dumpall -h localhost -U postgres --globals-only > $BACKUP_DIR/$DATE/globals_backup.sql

# WAL archive backup
tar -czf $BACKUP_DIR/$DATE/wal_archive.tar.gz /var/lib/postgresql/archive/

# Compress backup
tar -czf $BACKUP_DIR/full_backup_$DATE.tar.gz $BACKUP_DIR/$DATE/

# Remove uncompressed backup
rm -rf $BACKUP_DIR/$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "full_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: full_backup_$DATE.tar.gz"

-- Continuous archiving setup
# postgresql.conf
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/archive/%f && cp %p /var/lib/postgresql/archive/%f'
archive_timeout = 300

-- Point-in-time recovery script
#!/bin/bash
# pitr_restore.sh

BACKUP_FILE="$1"
RECOVERY_TARGET_TIME="$2"
DATA_DIR="/var/lib/postgresql/13/main"

# Stop PostgreSQL
systemctl stop postgresql

# Remove current data
rm -rf $DATA_DIR/*

# Restore from backup
pg_restore -d postgres $BACKUP_FILE

# Create recovery.conf
cat > $DATA_DIR/recovery.conf << EOF
restore_command = 'cp /var/lib/postgresql/archive/%f %p'
recovery_target_time = '$RECOVERY_TARGET_TIME'
recovery_target_action = 'promote'
EOF

# Start PostgreSQL
systemctl start postgresql

echo "Point-in-time recovery completed to $RECOVERY_TARGET_TIME"

-- Incremental backup with pg_probackup
# Initialize backup catalog
pg_probackup init -B /var/backups/pg_probackup

# Add instance
pg_probackup add-instance -B /var/backups/pg_probackup -D /var/lib/postgresql/13/main --instance=main

# Full backup
pg_probackup backup -B /var/backups/pg_probackup --instance=main -b FULL

# Incremental backup
pg_probackup backup -B /var/backups/pg_probackup --instance=main -b DELTA

-- Automated backup with retention
0 2 * * 0 /usr/local/bin/full_backup.sh                    # Weekly full backup
0 2 * * 1-6 /usr/local/bin/incremental_backup.sh          # Daily incremental backup
0 */6 * * * /usr/local/bin/wal_archive_backup.sh          # WAL archive every 6 hours`;
  }

  setupSecurity(analysis) {
    return `-- PostgreSQL Security Configuration

-- pg_hba.conf security settings
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
hostssl all             all             0.0.0.0/0               md5

-- SSL configuration (postgresql.conf)
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
ssl_ca_file = 'ca.crt'
ssl_crl_file = 'server.crl'
ssl_prefer_server_ciphers = on
ssl_ciphers = 'HIGH:MEDIUM:+3DES:!aNULL'

-- Password security
password_encryption = scram-sha-256
shared_preload_libraries = 'passwordcheck'

-- Connection security
listen_addresses = 'localhost,192.168.1.100'  # Specific IPs only
port = 5432
max_connections = 100

-- Create application roles
CREATE ROLE app_read;
CREATE ROLE app_write;
CREATE ROLE app_admin;

-- Grant read permissions
GRANT CONNECT ON DATABASE mydb TO app_read;
GRANT USAGE ON SCHEMA public TO app_read;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_read;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO app_read;

-- Grant write permissions
GRANT app_read TO app_write;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_write;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT INSERT, UPDATE, DELETE ON TABLES TO app_write;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_write;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_write;

-- Grant admin permissions
GRANT app_write TO app_admin;
GRANT CREATE ON SCHEMA public TO app_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_admin;

-- Create application users
CREATE USER app_reader WITH PASSWORD 'secure_read_password';
GRANT app_read TO app_reader;

CREATE USER app_worker WITH PASSWORD 'secure_write_password';
GRANT app_write TO app_worker;

CREATE USER app_administrator WITH PASSWORD 'secure_admin_password';
GRANT app_admin TO app_administrator;

-- Row-level security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can only see their own orders
CREATE POLICY user_orders_policy ON orders
    FOR ALL TO app_read, app_write
    USING (user_id = current_setting('app.current_user_id')::uuid);

-- Admins can see all orders
CREATE POLICY admin_orders_policy ON orders
    FOR ALL TO app_admin
    USING (true);

-- Column-level security
REVOKE ALL ON users FROM app_read;
GRANT SELECT (id, email, username, first_name, last_name, created_at, is_active) ON users TO app_read;

-- Audit triggers
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, operation, row_id, old_values, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, OLD.id, row_to_json(OLD), 
                current_setting('app.current_user_id', true)::uuid);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, operation, row_id, old_values, new_values, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(OLD), row_to_json(NEW),
                current_setting('app.current_user_id', true)::uuid);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, operation, row_id, new_values, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(NEW),
                current_setting('app.current_user_id', true)::uuid);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_orders AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();`;
  }

  async troubleshoot(issue) {
    const solutions = {
      slow_queries: [
        'Analyze query execution plans with EXPLAIN ANALYZE',
        'Check for missing indexes on frequently queried columns',
        'Update table statistics with ANALYZE',
        'Consider query rewriting or optimization',
        'Review work_mem and shared_buffers settings'
      ],
      connection_issues: [
        'Check max_connections setting',
        'Verify pg_hba.conf configuration',
        'Check network connectivity and firewall rules',
        'Review connection pooling configuration',
        'Monitor active connections with pg_stat_activity'
      ],
      replication_lag: [
        'Check network bandwidth between primary and standby',
        'Monitor WAL generation rate',
        'Verify standby server resources',
        'Check for long-running transactions',
        'Consider increasing wal_sender_timeout'
      ],
      lock_contention: [
        'Identify blocking queries with pg_locks view',
        'Review transaction isolation levels',
        'Optimize application logic to reduce lock duration',
        'Consider using advisory locks for application-level coordination',
        'Monitor deadlocks and implement retry logic'
      ]
    };
    
    return solutions[issue.type] || ['Review PostgreSQL logs and documentation'];
  }
}

module.exports = PostgreSQLSpecialist;