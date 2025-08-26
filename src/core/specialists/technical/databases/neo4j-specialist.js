const UnifiedSpecialistBase = require('../../unified-specialist-base');
const { logger } = require('../../logging/bumba-logger');

/**
 * Neo4j Specialist
 * Expertise: Neo4j, Graph Databases, Cypher Query Language
 */
class Neo4jSpecialist extends UnifiedSpecialistBase {
  constructor(department, context = {}) {
    super({
      id: 'neo4j-specialist',
      name: 'Neo4j Specialist',
      type: 'neo4j-specialist',
      category: 'technical',
      department: department,
      expertise: {
        'neo4j': true,
        'graph_databases': true,
        'cypher': true,
        'graph_algorithms': true
      },
      capabilities: [
        'Neo4j',
        'Graph Databases',
        'Cypher Query Language',
        'Graph Algorithms',
        'Graph Data Modeling'
      ],
      ...context
    });
    this.displayName = 'Neo4j Specialist';
  }
}

module.exports = Neo4jSpecialist;