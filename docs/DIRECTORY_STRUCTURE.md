# BUMBA Framework Directory Structure
Generated: 2025-08-25

## Professional Directory Organization

```
bumba/
├── .config/                    # Local configuration files
├── config/                     # Framework configuration
│   ├── jest/                   # Jest testing configurations
│   └── modular-config.js       # Modular configuration system
│
├── docs/                       # All documentation
│   ├── 01-getting-started/     # Setup and installation guides
│   ├── 02-architecture/        # Architecture documentation
│   ├── 03-api-reference/       # API documentation
│   ├── 04-integrations/        # Integration guides
│   ├── 05-development/         # Development guides
│   ├── 06-deployment/          # Deployment documentation
│   ├── 07-system-guides/       # System operation guides
│   ├── 08-reference/           # Reference materials
│   ├── 09-troubleshooting/     # Troubleshooting guides
│   ├── 10-archive/             # Archived documentation
│   ├── audit-reports/          # System audit reports
│   ├── development-reports/    # Development progress reports
│   └── planning/               # Planning documents
│       ├── sprints/            # Sprint planning documents
│       └── prd/                # Product requirement documents
│
├── scripts/                    # Utility and automation scripts
│   ├── maintenance/            # System maintenance scripts
│   ├── migration/              # Migration utilities
│   ├── tests/                  # Test-related scripts
│   └── validation/             # Validation and verification scripts
│
├── src/                        # Source code
│   ├── commands/               # Command implementations
│   ├── config/                 # Configuration modules
│   ├── consciousnessModality/  # Consciousness framework
│   ├── core/                   # Core framework modules
│   │   ├── agents/             # Agent implementations
│   │   ├── alerting/           # Alert and monitoring systems
│   │   ├── analytics/          # Analytics modules
│   │   ├── collaboration/      # Collaboration features
│   │   ├── commands/           # Command routing and handling
│   │   ├── communication/      # Inter-agent communication
│   │   ├── configuration/      # Configuration management
│   │   ├── consciousness/      # Consciousness system
│   │   ├── coordination/       # Agent coordination
│   │   ├── dashboard/          # Dashboard components
│   │   ├── decision/           # Decision engine
│   │   ├── departments/        # Department managers
│   │   ├── development-mode/   # Development mode features
│   │   ├── error-handling/     # Error management
│   │   ├── executive/          # Executive mode
│   │   ├── guardians/          # Guardian systems
│   │   ├── hooks/              # Hook systems
│   │   ├── initialization/     # Initialization modules
│   │   ├── integration/        # Integration systems
│   │   ├── integrations/       # External integrations
│   │   ├── intelligence/       # Intelligence systems
│   │   ├── interactive-mode/   # Interactive mode
│   │   ├── knowledge/          # Knowledge management
│   │   ├── learning/           # Learning systems
│   │   ├── lite-mode/          # Lite mode implementation
│   │   ├── mcp/                # MCP integration
│   │   ├── memory/             # Memory systems
│   │   ├── monitoring/         # Monitoring systems
│   │   ├── notion/             # Notion integration
│   │   ├── optimization/       # Optimization modules
│   │   ├── orchestration/      # Orchestration systems
│   │   ├── performance/        # Performance optimization
│   │   ├── pooling/            # Agent pooling
│   │   ├── pooling-v2/         # Enhanced pooling system
│   │   ├── production-mode/    # Production mode
│   │   ├── quality/            # Quality assurance
│   │   ├── recovery/           # Recovery systems
│   │   ├── resilience/         # Resilience features
│   │   ├── resource-management/# Resource management
│   │   ├── routing/            # Routing systems
│   │   ├── selection/          # Selection algorithms
│   │   ├── spawning/           # Agent spawning
│   │   ├── specialists/        # Specialist implementations
│   │   ├── standard-mode/      # Standard mode
│   │   ├── status/             # Status systems
│   │   ├── teams/              # Team management
│   │   ├── testing/            # Testing frameworks
│   │   ├── themes/             # UI themes
│   │   ├── validation/         # Validation systems
│   │   ├── whispers/           # Whisper system
│   │   ├── widgets/            # Widget system
│   │   └── workflow/           # Workflow management
│   ├── installer/              # Installation modules
│   └── unification/            # Unification systems
│
├── tests/                      # Test suites
│   ├── __mocks__/              # Mock implementations
│   ├── e2e/                    # End-to-end tests
│   ├── fixtures/               # Test fixtures
│   ├── helpers/                # Test helpers
│   ├── integration/            # Integration tests
│   ├── manual/                 # Manual test scripts
│   ├── performance/            # Performance tests
│   ├── pooling/                # Pooling system tests
│   ├── reports/                # Test reports
│   ├── unification/            # Unification tests
│   ├── unit/                   # Unit tests
│   └── verification/           # Verification tests
│
├── .env.example                # Environment variables example
├── .gitignore                  # Git ignore file
├── bumba.config.js             # BUMBA configuration
├── CHANGELOG.md                # Version changelog
├── install.js                  # Installation script
├── installer.js                # Installer module
├── jest.config.js              # Jest configuration
├── LICENSE                     # License file
├── package.json                # NPM package file
├── package-lock.json           # NPM lock file
└── README.md                   # Project documentation
```

## Organization Standards

### 1. Documentation (`/docs`)
- Numbered directories for sequential learning path
- Separate audit-reports for system analysis
- Planning directory for project management documents
- Archive for deprecated documentation

### 2. Scripts (`/scripts`)
- `maintenance/` - Scripts for fixing and updating code
- `validation/` - Scripts for verifying system state
- `migration/` - Scripts for migrating between versions
- `tests/` - Test-related utilities

### 3. Source Code (`/src`)
- `core/` - All core framework functionality
- `commands/` - Command implementations
- `config/` - Configuration modules
- Clear separation of concerns by directory

### 4. Tests (`/tests`)
- Organized by test type (unit, integration, e2e)
- `fixtures/` for test data
- `manual/` for manual testing scripts
- `reports/` for test analysis

## Best Practices Implemented

1. **Clear Separation**: Code, tests, docs, and scripts are clearly separated
2. **Logical Grouping**: Related files are grouped together
3. **No Root Clutter**: Minimal files in root directory
4. **Professional Structure**: Follows industry standards
5. **Scalability**: Structure supports growth
6. **Discoverability**: Easy to find files by function

## Files Organized

### Moved to Proper Locations:
- ✅ 8 audit reports → `docs/audit-reports/`
- ✅ 5 sprint documents → `docs/planning/sprints/`
- ✅ 2 PRD documents → `docs/planning/prd/`
- ✅ 4 development reports → `docs/development-reports/`
- ✅ Test scripts → `tests/manual/`
- ✅ Validation scripts → `scripts/validation/`
- ✅ Maintenance scripts → `scripts/maintenance/`

### Cleaned Up:
- ✅ Removed all `.backup`, `.tmp`, `.version-backup` files
- ✅ Organized root directory (reduced from ~30 to 19 files)
- ✅ Created proper subdirectory structure

## System Status: ✅ FULLY OPERATIONAL

All reorganization was done carefully to maintain functionality. The framework continues to work perfectly after reorganization.