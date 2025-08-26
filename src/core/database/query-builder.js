/**
 * Query Builder
 * Safe SQL query construction with injection prevention
 * Sprint 25-28 - Database Layer Fix
 */

const { validator } = require('../security/input-validator');
const { logger } = require('../logging/bumba-logger');

class QueryBuilder {
  constructor(table = null) {
    this.table = table;
    this.type = null;
    this.fields = [];
    this.conditions = [];
    this.joins = [];
    this.groupBy = [];
    this.having = [];
    this.orderBy = [];
    this.limitValue = null;
    this.offsetValue = null;
    this.values = {};
    this.parameters = [];
    this.paramIndex = 0;
  }
  
  /**
   * SELECT query
   */
  select(...fields) {
    this.type = 'SELECT';
    this.fields = fields.length > 0 ? fields : ['*'];
    return this;
  }
  
  /**
   * INSERT query
   */
  insert(data) {
    this.type = 'INSERT';
    this.values = this.sanitizeData(data);
    return this;
  }
  
  /**
   * UPDATE query
   */
  update(data) {
    this.type = 'UPDATE';
    this.values = this.sanitizeData(data);
    return this;
  }
  
  /**
   * DELETE query
   */
  delete() {
    this.type = 'DELETE';
    return this;
  }
  
  /**
   * FROM clause
   */
  from(table) {
    this.table = this.sanitizeIdentifier(table);
    return this;
  }
  
  /**
   * WHERE clause
   */
  where(field, operator, value) {
    if (arguments.length === 2) {
      value = operator;
      operator = '=';
    }
    
    const sanitizedField = this.sanitizeIdentifier(field);
    const param = this.addParameter(value);
    
    this.conditions.push({
      type: 'AND',
      field: sanitizedField,
      operator: this.validateOperator(operator),
      param
    });
    
    return this;
  }
  
  /**
   * OR WHERE clause
   */
  orWhere(field, operator, value) {
    if (arguments.length === 2) {
      value = operator;
      operator = '=';
    }
    
    const sanitizedField = this.sanitizeIdentifier(field);
    const param = this.addParameter(value);
    
    this.conditions.push({
      type: 'OR',
      field: sanitizedField,
      operator: this.validateOperator(operator),
      param
    });
    
    return this;
  }
  
  /**
   * WHERE IN clause
   */
  whereIn(field, values) {
    if (!Array.isArray(values)) {
      throw new Error('whereIn requires array of values');
    }
    
    const sanitizedField = this.sanitizeIdentifier(field);
    const params = values.map(v => this.addParameter(v));
    
    this.conditions.push({
      type: 'AND',
      field: sanitizedField,
      operator: 'IN',
      params
    });
    
    return this;
  }
  
  /**
   * WHERE NULL clause
   */
  whereNull(field) {
    const sanitizedField = this.sanitizeIdentifier(field);
    
    this.conditions.push({
      type: 'AND',
      field: sanitizedField,
      operator: 'IS NULL'
    });
    
    return this;
  }
  
  /**
   * WHERE NOT NULL clause
   */
  whereNotNull(field) {
    const sanitizedField = this.sanitizeIdentifier(field);
    
    this.conditions.push({
      type: 'AND',
      field: sanitizedField,
      operator: 'IS NOT NULL'
    });
    
    return this;
  }
  
  /**
   * WHERE BETWEEN clause
   */
  whereBetween(field, min, max) {
    const sanitizedField = this.sanitizeIdentifier(field);
    const minParam = this.addParameter(min);
    const maxParam = this.addParameter(max);
    
    this.conditions.push({
      type: 'AND',
      field: sanitizedField,
      operator: 'BETWEEN',
      params: [minParam, maxParam]
    });
    
    return this;
  }
  
  /**
   * JOIN clause
   */
  join(table, field1, operator, field2) {
    if (arguments.length === 3) {
      field2 = operator;
      operator = '=';
    }
    
    this.joins.push({
      type: 'INNER',
      table: this.sanitizeIdentifier(table),
      field1: this.sanitizeIdentifier(field1),
      operator: this.validateOperator(operator),
      field2: this.sanitizeIdentifier(field2)
    });
    
    return this;
  }
  
  /**
   * LEFT JOIN clause
   */
  leftJoin(table, field1, operator, field2) {
    if (arguments.length === 3) {
      field2 = operator;
      operator = '=';
    }
    
    this.joins.push({
      type: 'LEFT',
      table: this.sanitizeIdentifier(table),
      field1: this.sanitizeIdentifier(field1),
      operator: this.validateOperator(operator),
      field2: this.sanitizeIdentifier(field2)
    });
    
    return this;
  }
  
  /**
   * GROUP BY clause
   */
  groupBy(...fields) {
    this.groupBy = fields.map(f => this.sanitizeIdentifier(f));
    return this;
  }
  
  /**
   * HAVING clause
   */
  having(field, operator, value) {
    if (arguments.length === 2) {
      value = operator;
      operator = '=';
    }
    
    const sanitizedField = this.sanitizeIdentifier(field);
    const param = this.addParameter(value);
    
    this.having.push({
      field: sanitizedField,
      operator: this.validateOperator(operator),
      param
    });
    
    return this;
  }
  
  /**
   * ORDER BY clause
   */
  orderBy(field, direction = 'ASC') {
    const sanitizedField = this.sanitizeIdentifier(field);
    const validDirection = direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    this.orderBy.push({
      field: sanitizedField,
      direction: validDirection
    });
    
    return this;
  }
  
  /**
   * LIMIT clause
   */
  limit(value) {
    this.limitValue = parseInt(value, 10);
    if (isNaN(this.limitValue) || this.limitValue < 0) {
      throw new Error('Invalid limit value');
    }
    return this;
  }
  
  /**
   * OFFSET clause
   */
  offset(value) {
    this.offsetValue = parseInt(value, 10);
    if (isNaN(this.offsetValue) || this.offsetValue < 0) {
      throw new Error('Invalid offset value');
    }
    return this;
  }
  
  /**
   * Build SQL query
   */
  build() {
    if (!this.type) {
      throw new Error('Query type not specified');
    }
    
    if (!this.table) {
      throw new Error('Table not specified');
    }
    
    let sql = '';
    
    switch (this.type) {
      case 'SELECT':
        sql = this.buildSelect();
        break;
      case 'INSERT':
        sql = this.buildInsert();
        break;
      case 'UPDATE':
        sql = this.buildUpdate();
        break;
      case 'DELETE':
        sql = this.buildDelete();
        break;
      default:
        throw new Error(`Unknown query type: ${this.type}`);
    }
    
    return {
      sql,
      params: this.parameters
    };
  }
  
  /**
   * Build SELECT query
   */
  buildSelect() {
    let sql = `SELECT ${this.fields.join(', ')} FROM ${this.table}`;
    
    // Add joins
    for (const join of this.joins) {
      sql += ` ${join.type} JOIN ${join.table} ON ${join.field1} ${join.operator} ${join.field2}`;
    }
    
    // Add where conditions
    if (this.conditions.length > 0) {
      sql += ' WHERE ' + this.buildConditions();
    }
    
    // Add group by
    if (this.groupBy.length > 0) {
      sql += ` GROUP BY ${this.groupBy.join(', ')}`;
    }
    
    // Add having
    if (this.having.length > 0) {
      sql += ' HAVING ' + this.having.map(h => 
        `${h.field} ${h.operator} ${h.param}`
      ).join(' AND ');
    }
    
    // Add order by
    if (this.orderBy.length > 0) {
      sql += ' ORDER BY ' + this.orderBy.map(o => 
        `${o.field} ${o.direction}`
      ).join(', ');
    }
    
    // Add limit
    if (this.limitValue !== null) {
      sql += ` LIMIT ${this.limitValue}`;
    }
    
    // Add offset
    if (this.offsetValue !== null) {
      sql += ` OFFSET ${this.offsetValue}`;
    }
    
    return sql;
  }
  
  /**
   * Build INSERT query
   */
  buildInsert() {
    const fields = Object.keys(this.values);
    const params = [];
    
    for (const field of fields) {
      params.push(this.addParameter(this.values[field]));
    }
    
    const sql = `INSERT INTO ${this.table} (${fields.join(', ')}) VALUES (${params.join(', ')})`;
    
    return sql;
  }
  
  /**
   * Build UPDATE query
   */
  buildUpdate() {
    const sets = [];
    
    for (const [field, value] of Object.entries(this.values)) {
      const param = this.addParameter(value);
      sets.push(`${field} = ${param}`);
    }
    
    let sql = `UPDATE ${this.table} SET ${sets.join(', ')}`;
    
    if (this.conditions.length > 0) {
      sql += ' WHERE ' + this.buildConditions();
    }
    
    return sql;
  }
  
  /**
   * Build DELETE query
   */
  buildDelete() {
    let sql = `DELETE FROM ${this.table}`;
    
    if (this.conditions.length > 0) {
      sql += ' WHERE ' + this.buildConditions();
    }
    
    return sql;
  }
  
  /**
   * Build WHERE conditions
   */
  buildConditions() {
    const parts = [];
    
    for (let i = 0; i < this.conditions.length; i++) {
      const cond = this.conditions[i];
      let part = '';
      
      if (i > 0) {
        part += ` ${cond.type} `;
      }
      
      if (cond.operator === 'IN') {
        part += `${cond.field} IN (${cond.params.join(', ')})`;
      } else if (cond.operator === 'BETWEEN') {
        part += `${cond.field} BETWEEN ${cond.params[0]} AND ${cond.params[1]}`;
      } else if (cond.operator === 'IS NULL' || cond.operator === 'IS NOT NULL') {
        part += `${cond.field} ${cond.operator}`;
      } else {
        part += `${cond.field} ${cond.operator} ${cond.param}`;
      }
      
      parts.push(part);
    }
    
    return parts.join('');
  }
  
  /**
   * Add parameter
   */
  addParameter(value) {
    this.parameters.push(value);
    this.paramIndex++;
    return `$${this.paramIndex}`;
  }
  
  /**
   * Sanitize identifier (table/column name)
   */
  sanitizeIdentifier(identifier) {
    // Remove any non-alphanumeric characters except underscore
    const cleaned = identifier.replace(/[^a-zA-Z0-9_]/g, '');
    
    // Check for SQL injection patterns
    const attacks = validator.detectAttacks(identifier);
    if (attacks.length > 0) {
      throw new Error(`Potential SQL injection in identifier: ${identifier}`);
    }
    
    return cleaned;
  }
  
  /**
   * Sanitize data values
   */
  sanitizeData(data) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(data)) {
      const sanitizedKey = this.sanitizeIdentifier(key);
      sanitized[sanitizedKey] = value;
    }
    
    return sanitized;
  }
  
  /**
   * Validate operator
   */
  validateOperator(operator) {
    const validOperators = ['=', '!=', '<>', '<', '>', '<=', '>=', 'LIKE', 'NOT LIKE'];
    const upperOp = operator.toUpperCase();
    
    if (!validOperators.includes(upperOp)) {
      throw new Error(`Invalid operator: ${operator}`);
    }
    
    return upperOp;
  }
  
  /**
   * Clone builder
   */
  clone() {
    const cloned = new QueryBuilder(this.table);
    
    cloned.type = this.type;
    cloned.fields = [...this.fields];
    cloned.conditions = [...this.conditions];
    cloned.joins = [...this.joins];
    cloned.groupBy = [...this.groupBy];
    cloned.having = [...this.having];
    cloned.orderBy = [...this.orderBy];
    cloned.limitValue = this.limitValue;
    cloned.offsetValue = this.offsetValue;
    cloned.values = { ...this.values };
    cloned.parameters = [...this.parameters];
    cloned.paramIndex = this.paramIndex;
    
    return cloned;
  }
  
  /**
   * Reset builder
   */
  reset() {
    this.type = null;
    this.fields = [];
    this.conditions = [];
    this.joins = [];
    this.groupBy = [];
    this.having = [];
    this.orderBy = [];
    this.limitValue = null;
    this.offsetValue = null;
    this.values = {};
    this.parameters = [];
    this.paramIndex = 0;
    
    return this;
  }
  
  /**
   * Get SQL string (for debugging)
   */
  toSQL() {
    const { sql, params } = this.build();
    
    // Replace parameters with values for debugging
    let debugSql = sql;
    for (let i = 0; i < params.length; i++) {
      const param = `$${i + 1}`;
      const value = typeof params[i] === 'string' ? `'${params[i]}'` : params[i];
      debugSql = debugSql.replace(param, value);
    }
    
    return debugSql;
  }
}

// Helper function to create new query builder
function query(table = null) {
  return new QueryBuilder(table);
}

module.exports = {
  QueryBuilder,
  query
};