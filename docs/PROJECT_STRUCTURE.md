# BUMBA CLI 1.0 - Project Structure

## Directory Organization

```
BUMBA CLI 1.0/
├── .bumba/                    # BUMBA internal configuration
├── .bumba-backups/            # Automatic backups
├── .bumba-errors/             # Error logs and dumps (limited to 10 most recent)
├── .git/                      # Git version control
│
├── bin/                       # Executable scripts
│   ├── bumba                  # Main CLI executable
│   ├── bumba-mode            # Mode switcher utility
│   └── bumba-slash           # Slash command runner
│
├── config/                    # Configuration files
│   ├── jest.config.js        # Jest testing configuration
│   ├── eslint.config.mjs     # ESLint configuration
│   └── ...                   # Other config files
│
├── docs/                      # Documentation
│   ├── sprints/              # Sprint planning documents
│   │   ├── SPRINT_PLAN_10MIN_OPERATIONAL_COMMANDS.md
│   │   └── SPRINT_COMPLETION_STATUS.md
│   ├── PROJECT_STRUCTURE.md  # This file
│   ├── CHANGELOG.md          # Version history
│   ├── README.md             # Main documentation
│   └── ...                   # Other documentation
│
├── examples/                  # Example code and demos
│   └── demo.js               # Demo application
│
├── output/                    # Generated output files (git-ignored)
│   ├── prd/                  # Product Requirements Documents
│   ├── api/                  # API specifications
│   ├── design/               # Design documents
│   ├── database/             # Database schemas
│   └── test-results/         # Test execution results
│
├── scripts/                   # Utility scripts
│   ├── post-install.js       # Post-installation script
│   └── utilities/            # Other utility scripts
│
├── src/                       # Source code
│   ├── core/                 # Core framework
│   │   ├── command-intelligence/  # Intelligent command routing
│   │   │   ├── command-router.js
│   │   │   ├── specialist-selector.js
│   │   │   ├── department-coordinator.js
│   │   │   └── ...
│   │   ├── departments/      # Department managers
│   │   │   ├── product-strategist-manager.js
│   │   │   ├── design-engineer-manager-simple.js
│   │   │   └── backend-engineer-manager-simple.js
│   │   ├── error-handling/   # Error management
│   │   ├── logging/          # Logging system
│   │   └── ...               # Other core modules
│   ├── index.js              # Main entry point
│   └── ...                   # Other source files
│
├── temp/                      # Temporary files (git-ignored)
│   └── test-*.js             # Test scripts
│
├── tests/                     # Test suites
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── fixtures/             # Test fixtures
│
├── node_modules/             # Dependencies (git-ignored)
├── package.json              # Package configuration
├── package-lock.json         # Dependency lock file
├── bumba.config.js           # BUMBA configuration
├── README.md                 # Project README
└── .gitignore               # Git ignore rules
```

## Key Directories

### `/src/core/command-intelligence/`
Contains the intelligent command routing system with specialist selection, department coordination, and smart output generation.

### `/src/core/departments/`
Department manager implementations that handle specific command types with their specialized knowledge.

### `/output/`
All generated files are organized here by type. This directory should be git-ignored to keep the repository clean.

### `/docs/`
Comprehensive documentation including sprint plans, API docs, and guides.

### `/bin/`
Executable scripts that users run directly from the command line.

## Best Practices

1. **Generated Files**: All command outputs go to `/output/` subdirectories
2. **Documentation**: Keep all docs in `/docs/` with logical subdirectories
3. **Test Files**: Temporary test files go in `/temp/`
4. **Configuration**: All config files in `/config/` or root (for npm requirements)
5. **Scripts**: Utility scripts in `/scripts/`, executables in `/bin/`
6. **Source Code**: Maintain clear module boundaries in `/src/`
7. **Error Logs**: Limited to 10 most recent in `.bumba-errors/`

## Git Ignore Patterns

The following should be in `.gitignore`:
- `/output/` - Generated files
- `/temp/` - Temporary files
- `/node_modules/` - Dependencies
- `/.bumba-errors/` - Error dumps
- `.DS_Store` - macOS files
- `*.log` - Log files

## Maintenance

- Regularly clean `/temp/` directory
- Monitor `/output/` size
- Archive old sprint docs to `/docs/archive/`
- Keep root directory minimal