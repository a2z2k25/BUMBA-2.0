/**
 * BUMBA Chain Parser
 * Parses command chains into executable AST
 * Supports: >> (sequential), || (parallel), ?: (conditional), |> (pipe), & (background)
 */

class ChainParser {
  constructor() {
    // Operator precedence (higher = tighter binding)
    this.precedence = {
      '&': 1,    // Background (loosest)
      '>>': 2,   // Sequential
      '||': 3,   // Parallel
      '|>': 4,   // Pipe
      '?': 5,    // Conditional (tightest)
      ':': 5     // Conditional else
    };
    
    // Token patterns
    this.patterns = {
      command: /^\/bumba:[a-z\-]+/i,
      operator: /^(>>|\|\||&|\|>|\?|:)/,
      argument: /^[^\s>>|&?:]+/,
      whitespace: /^\s+/,
      groupStart: /^\(/,
      groupEnd: /^\)/
    };
  }
  
  /**
   * Parse a command chain string into AST
   */
  parse(input) {
    if (!input || typeof input !== 'string') {
      throw new Error('Invalid input: expected non-empty string');
    }
    
    // Tokenize input
    const tokens = this.tokenize(input);
    
    if (tokens.length === 0) {
      throw new Error('No valid tokens found');
    }
    
    // Build AST
    const ast = this.buildAST(tokens);
    
    // Validate AST
    this.validateAST(ast);
    
    return ast;
  }
  
  /**
   * Tokenize input string
   */
  tokenize(input) {
    const tokens = [];
    let remaining = input.trim();
    let position = 0;
    
    while (remaining.length > 0) {
      let matched = false;
      
      // Skip whitespace
      const whitespace = remaining.match(this.patterns.whitespace);
      if (whitespace) {
        position += whitespace[0].length;
        remaining = remaining.substring(whitespace[0].length);
        continue;
      }
      
      // Check for command
      const command = remaining.match(this.patterns.command);
      if (command) {
        tokens.push({
          type: 'command',
          value: command[0],
          position
        });
        position += command[0].length;
        remaining = remaining.substring(command[0].length);
        
        // Collect arguments until next operator or command
        while (remaining.length > 0) {
          // Skip whitespace
          const ws = remaining.match(this.patterns.whitespace);
          if (ws) {
            position += ws[0].length;
            remaining = remaining.substring(ws[0].length);
            continue;
          }
          
          // Check if next is operator or command
          if (remaining.match(this.patterns.operator) || 
              remaining.match(this.patterns.command) ||
              remaining.match(this.patterns.groupStart) ||
              remaining.match(this.patterns.groupEnd)) {
            break;
          }
          
          // Get argument
          const arg = remaining.match(this.patterns.argument);
          if (arg) {
            // Add argument to last command token
            const lastToken = tokens[tokens.length - 1];
            if (!lastToken.args) {
              lastToken.args = [];
            }
            lastToken.args.push(arg[0]);
            position += arg[0].length;
            remaining = remaining.substring(arg[0].length);
          } else {
            break;
          }
        }
        
        matched = true;
      }
      
      // Check for operator
      if (!matched) {
        const operator = remaining.match(this.patterns.operator);
        if (operator) {
          tokens.push({
            type: 'operator',
            value: operator[0],
            position
          });
          position += operator[0].length;
          remaining = remaining.substring(operator[0].length);
          matched = true;
        }
      }
      
      // Check for grouping
      if (!matched) {
        const groupStart = remaining.match(this.patterns.groupStart);
        if (groupStart) {
          tokens.push({
            type: 'group_start',
            value: '(',
            position
          });
          position++;
          remaining = remaining.substring(1);
          matched = true;
        }
        
        const groupEnd = remaining.match(this.patterns.groupEnd);
        if (groupEnd) {
          tokens.push({
            type: 'group_end',
            value: ')',
            position
          });
          position++;
          remaining = remaining.substring(1);
          matched = true;
        }
      }
      
      // If nothing matched, skip character
      if (!matched) {
        position++;
        remaining = remaining.substring(1);
      }
    }
    
    return tokens;
  }
  
  /**
   * Build AST from tokens
   */
  buildAST(tokens) {
    let index = 0;
    
    const parseExpression = (minPrecedence = 0) => {
      let left = parsePrimary();
      
      while (index < tokens.length) {
        const token = tokens[index];
        
        if (token.type !== 'operator') {
          break;
        }
        
        const precedence = this.precedence[token.value] || 0;
        if (precedence < minPrecedence) {
          break;
        }
        
        const operator = token.value;
        index++; // Consume operator
        
        // Handle special operators
        if (operator === '?') {
          // Conditional: left ? true_branch : false_branch
          const trueBranch = parseExpression(precedence + 1);
          
          // Expect ':'
          if (index >= tokens.length || tokens[index].value !== ':') {
            throw new Error(`Expected ':' after '?' at position ${index}`);
          }
          index++; // Consume ':'
          
          const falseBranch = parseExpression(precedence + 1);
          
          left = {
            type: 'conditional',
            condition: left,
            trueBranch,
            falseBranch
          };
        } else {
          // Binary operators
          const right = parseExpression(precedence + 1);
          
          if (operator === '>>') {
            left = {
              type: 'sequential',
              nodes: flattenSequential(left, right)
            };
          } else if (operator === '||') {
            left = {
              type: 'parallel',
              nodes: flattenParallel(left, right)
            };
          } else if (operator === '|>') {
            left = {
              type: 'pipe',
              from: left,
              to: right
            };
          } else if (operator === '&') {
            left = {
              type: 'background',
              background: left,
              foreground: right
            };
          }
        }
      }
      
      return left;
    };
    
    const parsePrimary = () => {
      if (index >= tokens.length) {
        throw new Error('Unexpected end of input');
      }
      
      const token = tokens[index];
      
      if (token.type === 'group_start') {
        index++; // Consume '('
        const expr = parseExpression(0);
        
        if (index >= tokens.length || tokens[index].type !== 'group_end') {
          throw new Error(`Expected ')' at position ${index}`);
        }
        index++; // Consume ')'
        
        return expr;
      }
      
      if (token.type === 'command') {
        index++;
        return {
          type: 'command',
          name: token.value,
          args: token.args || []
        };
      }
      
      throw new Error(`Unexpected token: ${token.value} at position ${token.position}`);
    };
    
    // Helper to flatten sequential nodes
    const flattenSequential = (left, right) => {
      const nodes = [];
      
      if (left.type === 'sequential') {
        nodes.push(...left.nodes);
      } else {
        nodes.push(left);
      }
      
      if (right.type === 'sequential') {
        nodes.push(...right.nodes);
      } else {
        nodes.push(right);
      }
      
      return nodes;
    };
    
    // Helper to flatten parallel nodes
    const flattenParallel = (left, right) => {
      const nodes = [];
      
      if (left.type === 'parallel') {
        nodes.push(...left.nodes);
      } else {
        nodes.push(left);
      }
      
      if (right.type === 'parallel') {
        nodes.push(...right.nodes);
      } else {
        nodes.push(right);
      }
      
      return nodes;
    };
    
    const ast = parseExpression(0);
    
    if (index < tokens.length) {
      throw new Error(`Unexpected tokens after position ${index}`);
    }
    
    return {
      type: 'chain',
      root: ast
    };
  }
  
  /**
   * Validate AST structure
   */
  validateAST(ast) {
    const validate = (node) => {
      if (!node || !node.type) {
        throw new Error('Invalid AST node: missing type');
      }
      
      switch (node.type) {
        case 'chain':
          if (!node.root) {
            throw new Error('Chain node missing root');
          }
          validate(node.root);
          break;
          
        case 'command':
          if (!node.name) {
            throw new Error('Command node missing name');
          }
          break;
          
        case 'sequential':
        case 'parallel':
          if (!node.nodes || !Array.isArray(node.nodes) || node.nodes.length < 2) {
            throw new Error(`${node.type} node must have at least 2 child nodes`);
          }
          node.nodes.forEach(validate);
          break;
          
        case 'conditional':
          if (!node.condition || !node.trueBranch || !node.falseBranch) {
            throw new Error('Conditional node missing required branches');
          }
          validate(node.condition);
          validate(node.trueBranch);
          validate(node.falseBranch);
          break;
          
        case 'pipe':
          if (!node.from || !node.to) {
            throw new Error('Pipe node missing from/to');
          }
          validate(node.from);
          validate(node.to);
          break;
          
        case 'background':
          if (!node.background || !node.foreground) {
            throw new Error('Background node missing required parts');
          }
          validate(node.background);
          validate(node.foreground);
          break;
          
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }
    };
    
    validate(ast);
  }
  
  /**
   * Convert AST to readable string (for debugging)
   */
  toString(ast) {
    const nodeToString = (node, indent = 0) => {
      const prefix = '  '.repeat(indent);
      
      switch (node.type) {
        case 'chain':
          return nodeToString(node.root, indent);
          
        case 'command':
          const args = node.args.length > 0 ? ` ${node.args.join(' ')}` : '';
          return `${prefix}${node.name}${args}`;
          
        case 'sequential':
          return node.nodes.map(n => nodeToString(n, indent)).join(' >> ');
          
        case 'parallel':
          return node.nodes.map(n => nodeToString(n, indent)).join(' || ');
          
        case 'conditional':
          return `(${nodeToString(node.condition, 0)} ? ${nodeToString(node.trueBranch, 0)} : ${nodeToString(node.falseBranch, 0)})`;
          
        case 'pipe':
          return `${nodeToString(node.from, indent)} |> ${nodeToString(node.to, indent)}`;
          
        case 'background':
          return `${nodeToString(node.background, indent)} & ${nodeToString(node.foreground, indent)}`;
          
        default:
          return `${prefix}[${node.type}]`;
      }
    };
    
    return nodeToString(ast);
  }
}

module.exports = ChainParser;