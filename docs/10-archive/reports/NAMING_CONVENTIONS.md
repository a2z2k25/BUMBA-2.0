# BUMBA CLI Naming Conventions

## Overview

This document defines the standardized naming conventions for the BUMBA CLI to ensure consistency, readability, and maintainability across the codebase.

## General Principles

1. **Clarity over brevity** - Names should clearly express intent
2. **Consistency** - Similar concepts should follow similar naming patterns
3. **Searchability** - Names should be unique and grep-friendly
4. **No abbreviations** - Use full words except for widely accepted abbreviations (e.g., API, URL)

## File Naming

### JavaScript Files
- **Use kebab-case**: `user-service.js`, `api-router.js`
- **Descriptive names**: `command-validator.js` not `validator.js`
- **Module type suffix**: 
  - Services: `*-service.js`
  - Utilities: `*-utils.js` or `*-helper.js`
  - Validators: `*-validator.js`
  - Managers: `*-manager.js`
  - Specialists: `*-specialist.js`

### Test Files
- **Mirror source structure**: `src/core/router.js` → `tests/unit/core/router.test.js`
- **Use `.test.js` suffix**: `command-handler.test.js`
- **Integration tests**: `*.integration.test.js`

### Configuration Files
- **Use dot prefix for tools**: `.eslintrc.json`, `.prettierrc`
- **JSON for configs**: `package.json`, `tsconfig.json`
- **Uppercase for docs**: `README.md`, `CHANGELOG.md`, `LICENSE`

## Code Naming Conventions

### Variables
```javascript
// Constants - UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 5000;
const API_BASE_URL = 'https://api.example.com';

// Regular variables - camelCase
let userCount = 0;
const activeUsers = [];
const isAuthenticated = false;

// Private variables - prefix with underscore
let _internalCache = new Map();

// Boolean variables - use is/has/can prefixes
const isLoading = true;
const hasPermission = false;
const canEdit = true;
```

### Functions
```javascript
// Regular functions - camelCase, verb-noun pattern
function validateInput(data) { }
function fetchUserData(userId) { }
function calculateTotal(items) { }

// Async functions - prefix with verbs indicating async nature
async function loadConfiguration() { }
async function fetchFromAPI(endpoint) { }
async function processQueue() { }

// Private functions - prefix with underscore
function _internalHelper() { }

// Event handlers - on + Event pattern
function onUserLogin(event) { }
function onDataReceived(data) { }
function onClick(event) { }

// Getters/Setters - get/set prefix
function getUserName() { }
function setUserName(name) { }
```

### Classes
```javascript
// Classes - PascalCase
class UserService { }
class CommandHandler { }
class DatabaseConnection { }

// Abstract/Base classes - prefix or suffix
class BaseSpecialist { }
class AbstractValidator { }

// Interfaces (TypeScript) - prefix with I
interface IUserService { }
interface IValidator { }

// Error classes - suffix with Error
class ValidationError extends Error { }
class NetworkError extends Error { }
```

### Methods
```javascript
class UserService {
  // Public methods - camelCase
  async createUser(data) { }
  updateProfile(userId, updates) { }
  
  // Private methods - prefix with underscore
  _validateUserData(data) { }
  _hashPassword(password) { }
  
  // Static methods - same as regular methods
  static getInstance() { }
  static validateEmail(email) { }
}
```

## Module Organization

### Exports
```javascript
// Named exports for utilities and multiple exports
export { validateUser, createUser, updateUser };

// Default export for main class/function
export default UserService;

// CommonJS pattern
module.exports = {
  UserService,
  userUtils,
  userConstants,
};
```

### Imports
```javascript
// Group imports by source
// 1. Node built-ins
const fs = require('fs');
const path = require('path');

// 2. External packages
const express = require('express');
const lodash = require('lodash');

// 3. Internal modules
const { logger } = require('./logging/logger');
const UserService = require('./services/user-service');
```

## Directory Structure

```
src/
├── core/                    # Core framework functionality
│   ├── routing/            # Routing logic
│   ├── security/           # Security modules
│   ├── monitoring/         # Performance monitoring
│   └── error-handling/     # Error management
├── specialists/            # Specialist implementations
│   ├── database/          # Database specialists
│   ├── frontend/          # Frontend specialists
│   └── backend/           # Backend specialists
├── utils/                  # Utility functions
├── config/                 # Configuration files
└── types/                  # TypeScript type definitions
```

## Specific Patterns

### Commands
- Format: `verb` or `verb-noun`
- Examples: `implement`, `analyze`, `secure-code`, `validate-input`

### Events
- Format: `noun-verb` or `noun-verb-noun`
- Examples: `user-created`, `data-updated`, `task-completed`

### Configuration Keys
- Format: `camelCase` for objects, `UPPER_SNAKE_CASE` for env vars
```javascript
// Configuration object
{
  maxRetries: 3,
  timeoutDuration: 5000,
  enableLogging: true
}

// Environment variables
process.env.NODE_ENV
process.env.API_KEY
process.env.DATABASE_URL
```

### Error Codes
- Format: `CATEGORY_SPECIFIC_ERROR`
- Examples: `AUTH_INVALID_TOKEN`, `DB_CONNECTION_FAILED`, `VALIDATION_REQUIRED_FIELD`

## TypeScript Specific

### Types and Interfaces
```typescript
// Types - PascalCase
type UserRole = 'admin' | 'user' | 'guest';
type CommandResult = { success: boolean; data?: any };

// Interfaces - PascalCase with I prefix
interface IUser {
  id: string;
  name: string;
  email: string;
}

// Enums - PascalCase with singular names
enum UserStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Pending = 'PENDING'
}

// Generic type parameters - single uppercase letter or descriptive
function identity<T>(value: T): T { }
function map<TInput, TOutput>(fn: (input: TInput) => TOutput) { }
```

## Comments and Documentation

### JSDoc Comments
```javascript
/**
 * Validates user input data
 * @param {Object} data - The user data to validate
 * @param {string} data.email - User's email address
 * @param {string} data.password - User's password
 * @returns {ValidationResult} The validation result
 * @throws {ValidationError} If validation fails
 */
function validateUserData(data) { }
```

### Inline Comments
```javascript
// Use single-line comments for brief explanations
const result = complexCalculation(); // Cache result for performance

/*
 * Use multi-line comments for longer explanations
 * that require multiple lines to properly describe
 * the logic or reasoning behind the code
 */
```

## Migration Checklist

When refactoring existing code to follow these conventions:

1. 🏁 Rename files to use kebab-case
2. 🏁 Update class names to PascalCase
3. 🏁 Ensure functions use camelCase with verb prefixes
4. 🏁 Convert constants to UPPER_SNAKE_CASE
5. 🏁 Prefix private methods/variables with underscore
6. 🏁 Group and order imports properly
7. 🏁 Add JSDoc comments to public APIs
8. 🏁 Update test files to follow naming patterns

## Examples of Correct Naming

### Before
```javascript
// Bad naming
const max = 10;
function gd(id) { }
class user_service { }
const UpdateData = () => { };
```

### After
```javascript
// Good naming
const MAX_RETRY_ATTEMPTS = 10;
function getUserData(userId) { }
class UserService { }
const updateUserData = () => { };
```

## Enforcement

These conventions are enforced through:
- ESLint rules
- Code review process
- Automated testing
- Documentation requirements

## Exceptions

Acceptable exceptions to these rules:
1. Third-party library requirements
2. Legacy code under gradual migration
3. Platform-specific conventions (e.g., React component naming)

Always document why an exception is made in a comment.