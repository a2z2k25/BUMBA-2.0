const UnifiedSpecialistBase = require('../../unified-specialist-base');
const { logger } = require('../../logging/bumba-logger');

/**
 * Cassandra Specialist
 * Expertise: Apache Cassandra, NoSQL, Distributed Databases
 */
class CassandraSpecialist extends UnifiedSpecialistBase {
  constructor(department, context = {}) {
    super({
      id: 'cassandra-specialist',
      name: 'Cassandra Specialist',
      type: 'cassandra-specialist',
      category: 'technical',
      department: department,
      expertise: {
        'cassandra': true,
        'nosql': true,
        'distributed_databases': true,
        'cql': true
      },
      capabilities: [
        'Apache Cassandra',
        'NoSQL',
        'Distributed Databases',
        'CQL',
        'Data Replication'
      ],
      ...context
    });
    this.displayName = 'Cassandra Specialist';
  }
}

module.exports = CassandraSpecialist;