# BUMBA Library Output

This directory contains built library files for the BUMBA framework.

## Contents

- `index.js` - Main library entry point
- `core/` - Core framework modules
- `types/` - TypeScript declaration files
- `utils/` - Utility functions

## Build Process

Library files are generated from source files in `src/` directory:

```bash
npm run build        # Production build
npm run build:dev    # Development build
npm run build:watch  # Watch mode for development
```

## Usage

Built libraries can be imported directly:

```javascript
const BUMBA = require('bumba/lib');
// or
import { BumbaFramework } from 'bumba/lib/core';
```

## Notes

- This directory is generated during build process
- Do not edit files directly - modify source in `src/`
- Files are optimized and minified for production use