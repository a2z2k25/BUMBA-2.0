# BUMBA Build and Maintenance Scripts

This directory contains build, deployment, and maintenance scripts for the BUMBA framework.

## Available Scripts

### Build Scripts
- `build.js` - Production build process
- `dev-build.js` - Development build with watch mode
- `clean.js` - Clean build artifacts

### Development Scripts  
- `generate-docs.js` - Generate API documentation
- `check-naming-conventions.js` - Validate naming standards
- `validate-config.js` - Configuration validation

### Maintenance Scripts
- `cleanup.js` - Repository cleanup utilities
- `migrate.js` - Database/config migration scripts
- `health-check.js` - System health validation

## Usage

Scripts can be run directly with Node.js or via npm scripts:

```bash
# Via npm (recommended)
npm run build
npm run docs
npm run check:naming

# Direct execution
node scripts/build.js
node scripts/generate-docs.js
```

## Development

When adding new scripts:
1. Use the existing script patterns
2. Add proper error handling
3. Include usage documentation
4. Update package.json scripts if needed