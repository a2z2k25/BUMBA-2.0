# BUMBA Framework API Documentation

## Overview

This directory contains the API documentation for the BUMBA Claude Code Framework.

## Documentation Formats

- **HTML Documentation**: Open `docs/api/index.html` in your browser for interactive documentation
- **Markdown Documentation**: Individual markdown files for key modules

## Key Modules

- [Unified Routing System](unified-routing-system.md)
- [Command Handler](command-handler.md)
- [Security](security.md)
- [Performance](performance.md)
- [Installer](installer.md)

## Core Systems

### Routing System
The unified routing system handles intelligent task routing to appropriate specialists.
- See: [unified-routing-system.md](unified-routing-system.md)

### Command Handler
Processes and validates user commands with security checks.
- See: [command-handler.md](command-handler.md)

### Security
Comprehensive security validation and command sanitization.
- See: [security.md](security.md)

### Performance Monitoring
Real-time performance tracking and benchmarking.
- See: [performance.md](performance.md)

### Installation System
Modular installer for setting up the BUMBA framework.
- See: [installer.md](installer.md)

## Quick Links

- [TypeScript Definitions](../../src/types/)
- [Test Documentation](../../tests/)
- [Examples](../../examples/)

## Generating Documentation

To regenerate this documentation:

```bash
npm run docs
```

Or manually:

```bash
node scripts/generate-docs.js
```
