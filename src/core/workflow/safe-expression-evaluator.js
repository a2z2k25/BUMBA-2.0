/**
 * Safe Expression Evaluator
 * Replaces dangerous new Function() with safe expression parsing
 * Sprint 2 - Security Fix
 */

const { logger } = require('../logging/bumba-logger');

class SafeExpressionEvaluator {
  constructor() {
    // Define allowed operators and functions
    this.allowedOperators = new Set([
      '+', '-', '*', '/', '%', // Math
      '==', '!=', '===', '!==', '<', '>', '<=', '>=', // Comparison
      '&&', '||', '!', // Logical
      '?', ':', // Ternary
      '.', '[', ']' // Property access
    ]);
    
    this.allowedFunctions = new Set([
      'Math.abs', 'Math.floor', 'Math.ceil', 'Math.round',
      'Math.min', 'Math.max', 'Math.pow', 'Math.sqrt',
      'String', 'Number', 'Boolean',
      'parseInt', 'parseFloat',
      'Date.now', 'JSON.stringify', 'JSON.parse'
    ]);
  }

  /**
   * Safely evaluate an expression without eval/new Function
   * @param {string} expr - Expression to evaluate
   * @param {object} context - Variables available to the expression
   * @returns {any} - Result of the expression
   */
  evaluate(expr, context = {}) {
    try {
      // Basic validation
      if (!expr || typeof expr !== 'string') {
        throw new Error('Expression must be a non-empty string');
      }
      
      // Security checks
      this.validateExpression(expr);
      
      // Parse and evaluate
      return this.parseAndEvaluate(expr, context);
    } catch (error) {
      logger.error('Safe expression evaluation failed:', error.message);
      throw new Error(`Expression evaluation failed: ${error.message}`);
    }
  }

  /**
   * Validate expression for security
   */
  validateExpression(expr) {
    // Block dangerous patterns
    const dangerousPatterns = [
      /eval\s*\(/,
      /new\s+Function/,
      /require\s*\(/,
      /import\s+/,
      /process\./,
      /global\./,
      /window\./,
      /document\./,
      /__proto__/,
      /constructor/,
      /prototype/
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(expr)) {
        throw new Error(`Dangerous pattern detected: ${pattern}`);
      }
    }
    
    // Check for function calls (basic check)
    const functionCalls = expr.match(/(\w+(?:\.\w+)*)\s*\(/g);
    if (functionCalls) {
      for (const call of functionCalls) {
        const funcName = call.replace(/\s*\($/, '');
        if (!this.allowedFunctions.has(funcName)) {
          throw new Error(`Function '${funcName}' is not allowed`);
        }
      }
    }
  }

  /**
   * Parse and evaluate expression safely
   */
  parseAndEvaluate(expr, context) {
    // Replace context variables in expression
    let processedExpr = expr;
    
    // Sort keys by length (longest first) to avoid partial replacements
    const contextKeys = Object.keys(context).sort((a, b) => b.length - a.length);
    
    // Create a mapping for safe variable names
    const varMap = new Map();
    contextKeys.forEach((key, index) => {
      const safeVar = `__var_${index}__`;
      varMap.set(safeVar, context[key]);
      // Replace variable references with safe names
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      processedExpr = processedExpr.replace(regex, safeVar);
    });
    
    // Evaluate using safe methods
    return this.evaluateSimpleExpression(processedExpr, varMap);
  }

  /**
   * Evaluate simple expressions without eval
   */
  evaluateSimpleExpression(expr, varMap) {
    // Handle simple literals
    if (/^-?\d+(\.\d+)?$/.test(expr)) {
      return parseFloat(expr);
    }
    
    if (/^["'].*["']$/.test(expr)) {
      return expr.slice(1, -1);
    }
    
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (expr === 'null') return null;
    if (expr === 'undefined') return undefined;
    
    // Handle variable references
    if (varMap.has(expr)) {
      return varMap.get(expr);
    }
    
    // Handle property access (simplified)
    if (expr.includes('.')) {
      const parts = expr.split('.');
      let result = varMap.get(parts[0]);
      
      if (result === undefined) {
        // Check for allowed global functions
        if (parts[0] === 'Math' && this.allowedFunctions.has(expr)) {
          return this.executeSafeFunction(expr, varMap);
        }
        return undefined;
      }
      
      for (let i = 1; i < parts.length; i++) {
        if (result == null) return undefined;
        result = result[parts[i]];
      }
      return result;
    }
    
    // Handle array access
    if (expr.includes('[') && expr.includes(']')) {
      return this.evaluateArrayAccess(expr, varMap);
    }
    
    // Handle operators
    if (this.containsOperator(expr)) {
      return this.evaluateWithOperators(expr, varMap);
    }
    
    // If we can't evaluate it safely, return undefined
    logger.warn(`Could not safely evaluate expression: ${expr}`);
    return undefined;
  }

  /**
   * Check if expression contains operators
   */
  containsOperator(expr) {
    const operatorPattern = /[\+\-\*\/\%\=\!\<\>\&\|\?\:]/;
    return operatorPattern.test(expr);
  }

  /**
   * Evaluate expressions with operators (simplified)
   */
  evaluateWithOperators(expr, varMap) {
    // This is a simplified implementation
    // In production, use a proper expression parser like jsep
    
    // Handle comparison operators
    const comparisonMatch = expr.match(/^(.+?)\s*(===?|!==?|<=?|>=?)\s*(.+)$/);
    if (comparisonMatch) {
      const left = this.evaluateSimpleExpression(comparisonMatch[1].trim(), varMap);
      const right = this.evaluateSimpleExpression(comparisonMatch[3].trim(), varMap);
      const op = comparisonMatch[2];
      
      switch (op) {
        case '==': return left == right;
        case '!=': return left != right;
        case '===': return left === right;
        case '!==': return left !== right;
        case '<': return left < right;
        case '>': return left > right;
        case '<=': return left <= right;
        case '>=': return left >= right;
      }
    }
    
    // Handle arithmetic operators
    const mathMatch = expr.match(/^(.+?)\s*([\+\-\*\/\%])\s*(.+)$/);
    if (mathMatch) {
      const left = this.evaluateSimpleExpression(mathMatch[1].trim(), varMap);
      const right = this.evaluateSimpleExpression(mathMatch[3].trim(), varMap);
      const op = mathMatch[2];
      
      switch (op) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return left / right;
        case '%': return left % right;
      }
    }
    
    // Handle logical operators
    const logicalMatch = expr.match(/^(.+?)\s*(\&\&|\|\|)\s*(.+)$/);
    if (logicalMatch) {
      const left = this.evaluateSimpleExpression(logicalMatch[1].trim(), varMap);
      const right = this.evaluateSimpleExpression(logicalMatch[3].trim(), varMap);
      const op = logicalMatch[2];
      
      switch (op) {
        case '&&': return left && right;
        case '||': return left || right;
      }
    }
    
    // Handle negation
    if (expr.startsWith('!')) {
      const inner = this.evaluateSimpleExpression(expr.substring(1).trim(), varMap);
      return !inner;
    }
    
    return undefined;
  }

  /**
   * Evaluate array access expressions
   */
  evaluateArrayAccess(expr, varMap) {
    const match = expr.match(/^(.+?)\[(.+?)\]$/);
    if (match) {
      const obj = this.evaluateSimpleExpression(match[1].trim(), varMap);
      const index = this.evaluateSimpleExpression(match[2].trim(), varMap);
      
      if (obj != null && index != null) {
        return obj[index];
      }
    }
    return undefined;
  }

  /**
   * Execute safe functions
   */
  executeSafeFunction(funcName, varMap) {
    // Only allow whitelisted functions
    if (!this.allowedFunctions.has(funcName)) {
      throw new Error(`Function ${funcName} is not allowed`);
    }
    
    // Execute safe Math functions
    if (funcName.startsWith('Math.')) {
      const method = funcName.substring(5);
      return Math[method];
    }
    
    // Execute other safe globals
    switch (funcName) {
      case 'Date.now': return Date.now();
      case 'String': return String;
      case 'Number': return Number;
      case 'Boolean': return Boolean;
      case 'parseInt': return parseInt;
      case 'parseFloat': return parseFloat;
      default: return undefined;
    }
  }

  /**
   * Transform data using safe expression
   */
  transform(data, transformation) {
    if (typeof transformation === 'function') {
      // If it's already a function, execute with timeout
      return this.executeSafeFunction(transformation, data);
    }
    
    if (typeof transformation === 'string') {
      // Evaluate as safe expression
      return this.evaluate(transformation, { data });
    }
    
    // If it's an object, assume it's a configuration
    if (typeof transformation === 'object' && transformation !== null) {
      return this.applyTransformationConfig(data, transformation);
    }
    
    return data;
  }

  /**
   * Apply transformation configuration
   */
  applyTransformationConfig(data, config) {
    let result = data;
    
    if (config.map && Array.isArray(data)) {
      result = data.map(item => this.evaluate(config.map, { item }));
    }
    
    if (config.filter && Array.isArray(result)) {
      result = result.filter(item => this.evaluate(config.filter, { item }));
    }
    
    if (config.reduce && Array.isArray(result)) {
      const initial = config.initial !== undefined ? config.initial : null;
      result = result.reduce((acc, item) => 
        this.evaluate(config.reduce, { acc, item }), initial);
    }
    
    if (config.transform) {
      result = this.evaluate(config.transform, { data: result });
    }
    
    return result;
  }

  /**
   * Execute safe function with timeout
   */
  executeSafeFunction(fn, data) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Function execution timeout'));
      }, 5000);
      
      try {
        const result = fn(data);
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }
}

// Export singleton instance
module.exports = new SafeExpressionEvaluator();