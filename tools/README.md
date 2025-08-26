# BUMBA Development Tools

This directory contains development tools and utilities for BUMBA framework development.

## Available Tools

### Code Generation
- `generate-specialist.js` - Generate new specialist definitions
- `generate-command.js` - Generate new command templates
- `generate-test.js` - Generate test file templates

### Analysis Tools
- `analyze-deps.js` - Dependency analysis and optimization
- `analyze-performance.js` - Performance profiling tools
- `analyze-security.js` - Security vulnerability scanning

### Migration Tools
- `migrate-config.js` - Configuration migration utilities
- `migrate-tests.js` - Test file migration tools
- `migrate-docs.js` - Documentation migration utilities

### Validation Tools
- `validate-architecture.js` - Architecture compliance checking
- `validate-naming.js` - Naming convention validation
- `validate-api.js` - API contract validation

## Usage

Tools are designed to be run during development:

```bash
# Generate new specialist
node tools/generate-specialist.js --name MySpecialist --type technical

# Analyze dependencies
node tools/analyze-deps.js --report

# Validate architecture
node tools/validate-architecture.js --strict
```

## Development

When adding new tools:
1. Follow existing naming conventions
2. Include proper CLI argument parsing
3. Add usage documentation
4. Provide examples