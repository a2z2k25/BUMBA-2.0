# BUMBA CLI Test Suite

This directory contains all test files for the BUMBA framework, organized by test type and scope.

## Test Structure

### 🟢 `/unit/`
Unit tests for individual components:
- `core/` - Core framework components
- `departments/` - Department manager tests  
- `coordination/` - Parallel safety system tests

### 🟢 `/integration/` (26 tests)
Integration tests for multi-component workflows:
- Department coordination tests
- Agent orchestration validation
- Cross-system integration verification

### 🟢 `/performance/` (4 tests)
Performance and load testing:
- Parallel execution benchmarks
- Resource usage analysis
- Scalability testing

### 🟢 `/manual/` (11 tests)
Manual testing scripts and verification tools:
- System operability validation
- Feature completeness checks
- Development verification scripts

## Running Tests

### All Tests
```bash
npm test              # Run unit tests
npm run test:integration  # Run integration tests
npm run test:all      # Run complete test suite
```

### Specific Categories
```bash
# Unit tests
npm run test:unit

# Integration tests  
npm run test:integration

# Performance tests
npm run test:performance

# Manual validation
node tests/manual/test-[specific-test].js
```

## Test Coverage

Target coverage: 80% for production readiness
Current status: Tests organized, implementation in progress

## Adding Tests

When adding new tests:
1. Place unit tests in appropriate `/unit/` subdirectory
2. Integration tests go in `/integration/`
3. Performance tests in `/performance/`
4. Manual verification scripts in `/manual/`

Follow existing naming conventions: `[component-name].test.js`

---

*Organized during Sprint 1B: Test File Organization*
*Total test files: 68*