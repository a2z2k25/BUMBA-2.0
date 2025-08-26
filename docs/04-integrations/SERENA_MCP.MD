# Serena MCP Integration

## Overview

Serena is a powerful semantic code analysis and editing toolkit that turns language models into sophisticated coding agents. It provides IDE-like capabilities for code navigation, understanding, and manipulation.

## Features

- **Semantic Code Search**: Find code based on meaning, not just text matches
- **Symbol Navigation**: Find definitions, references, and implementations
- **Code Editing**: Semantic-aware code modifications
- **Multi-Language Support**: Python, TypeScript/JavaScript, Go, Rust, Java, C#, and more
- **Shell Integration**: Execute commands within the coding context
- **Workspace Analysis**: Understand entire codebases at the symbol level

## Installation

```bash
# Install Serena MCP server
claude mcp add serena --server uvx:serena

# Note: Requires uv package manager
# Install uv if not already installed:
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## Usage in BUMBA

### Initialize Serena Integration

```javascript
const { serenaIntegration } = require('./core/integrations/serena-integration');

// Initialize the integration
await serenaIntegration.initialize();
```

### Semantic Code Search

```javascript
// Search for code semantically
const results = await serenaIntegration.semanticSearch('authentication logic', {
  language: 'javascript',
  limit: 10
});
```

### Find Symbol References

```javascript
// Find all references to a function
const references = await serenaIntegration.findReferences('validateUser', 
  '/src/auth.js', 
  { line: 42, column: 10 }
);
```

### Find Implementations

```javascript
// Find all implementations of an interface
const implementations = await serenaIntegration.findImplementations('IUserService', {
  language: 'typescript'
});
```

### Edit Code Semantically

```javascript
// Apply semantic-aware edits
await serenaIntegration.editCode('/src/user.js', [
  {
    range: { start: { line: 10, column: 0 }, end: { line: 10, column: 20 } },
    newText: 'async function getUser'
  }
]);
```

### Rename Symbol Across Codebase

```javascript
// Rename a symbol everywhere it's used
await serenaIntegration.renameSymbol(
  'oldFunctionName', 
  'newFunctionName',
  '/src/utils.js',
  { line: 5, column: 10 }
);
```

### Analyze Code Quality

```javascript
// Get code quality insights
const analysis = await serenaIntegration.analyzeCodeQuality('/src/complex-module.js');
console.log(analysis.issues); // Complexity warnings, etc.
```

## Fallback Behavior

When Serena MCP is not installed, the integration falls back to basic text search:

- Semantic search → Basic grep-like search
- Symbol navigation → Not available
- Code editing → Standard file editing
- Quality analysis → Basic static checks

## Language Server Support

Serena uses language servers for accurate semantic analysis:

- **Full Support**: Python, TypeScript, JavaScript, PHP, Go, Rust, C#, Java, Elixir, Clojure, C/C++
- **Partial Support**: Ruby, Kotlin, Dart

## Benefits for BUMBA Users

1. **Intelligent Code Understanding**: Navigate and understand codebases semantically
2. **Precise Refactoring**: Rename and modify code with confidence
3. **Enhanced Search**: Find code by meaning, not just text patterns
4. **Multi-Language**: Work seamlessly across different programming languages
5. **Agent Enhancement**: Turn BUMBA agents into powerful coding assistants

## Configuration

Serena works out of the box but can be configured through environment variables:

```bash
# Set workspace root (defaults to current directory)
export SERENA_WORKSPACE=/path/to/project

# Set language server preferences
export SERENA_PREFER_LSP=true
```

## Integration with BUMBA Agents

BUMBA agents can leverage Serena for enhanced code manipulation:

```javascript
// In a BUMBA specialist
async executeCodeRefactoring(oldName, newName) {
  // Use Serena for semantic renaming
  const result = await this.integrations.serena.renameSymbol(
    oldName,
    newName,
    this.currentFile,
    this.currentPosition
  );
  
  return {
    success: true,
    filesModified: result.filesModified,
    message: `Renamed ${oldName} to ${newName} across ${result.filesModified} files`
  };
}
```

## Troubleshooting

### Serena Not Available

If you see "Serena unavailable - using basic search fallback":

1. Install uv package manager: `curl -LsSf https://astral.sh/uv/install.sh | sh`
2. Install Serena MCP: `claude mcp add serena --server uvx:serena`
3. Restart Claude Code

### Language Server Issues

If semantic features aren't working for a specific language:

1. Check if the language is supported
2. Ensure the language server is installed
3. Check Serena logs for errors

## Best Practices

1. **Use Semantic Search First**: Before grep, try semantic search for better results
2. **Verify Before Renaming**: Check references before doing project-wide renames
3. **Leverage Navigation**: Use find-definitions and find-references for code exploration
4. **Combine with Other Tools**: Use with Pinecone for vector search and Context7 for docs