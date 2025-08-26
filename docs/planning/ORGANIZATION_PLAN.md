# BUMBA Repository Organization Plan

## Current Issues
1. **Root Clutter**: 20+ files in root directory
2. **Test Files Mixed**: Test files scattered in root and various locations
3. **Scripts Overflow**: Many one-off scripts in /scripts
4. **Documentation Scattered**: Reports and guides in multiple locations
5. **Temporary Files**: Various test and temporary files in root

## Proposed Structure

```
bumba/
├── README.md                    (keep)
├── LICENSE                      (keep)
├── package.json                 (keep)
├── package-lock.json           (keep)
├── .gitignore                   (keep)
├── bumba.config.js             (keep - main config)
│
├── src/                        (existing - application code)
├── tests/                      (existing - all tests)
├── docs/                       (existing - documentation)
├── config/                     (existing - configuration files)
├── scripts/                    (existing - utility scripts)
│
├── archives/                   (NEW - consolidate all archived content)
│   ├── backups/               (move from root)
│   ├── reports/               (historical reports)
│   └── legacy/                (old implementations)
│
├── examples/                   (NEW - demo and example files)
│   ├── demo.js               (move from root)
│   ├── test-*.js             (move test files from root)
│   └── demos/                (move from demo/)
│
├── temp/                      (NEW - temporary and generated files)
│   ├── logs/                 (move from root)
│   ├── profiles/             (move from root)
│   ├── test-results/         (test output files)
│   └── .gitignore            (ignore all temp files)
│
└── tools/                     (existing - development tools)
```

## Files to Move

### From Root to /examples/
- demo.js
- test-chameleon-live.js  
- test-context-preservation.js

### From Root to /archives/
- backups/ (entire directory)
- specialist-report.json
- verified-specialists.json
- test-results.json

### From Root to /temp/
- logs/ (entire directory)
- profiles/ (entire directory)
- bumba-logs/ (entire directory)

### From Root to /config/
- jest.config.js
- eslint.config.mjs

### Keep in Root (Essential Files)
- README.md
- LICENSE
- package.json
- package-lock.json
- bumba.config.js
- install.js
- installer.js
- CHANGELOG.md
- .gitignore

### Documentation Consolidation
Move various scattered docs to appropriate subdirectories in /docs/:
- Root level *.md files (except README, LICENSE, CHANGELOG) → /docs/
- Organize /docs/ subdirectories by topic

## Implementation Steps

### Phase 1: Create New Directories
```bash
mkdir -p archives/backups archives/reports archives/legacy
mkdir -p examples/demos
mkdir -p temp/logs temp/profiles temp/test-results
```

### Phase 2: Move Non-Breaking Files
Move files that are not imported by other code:
- Test files
- Log files
- Documentation
- Archives

### Phase 3: Move and Update Imports
For files that are imported:
1. Move file to new location
2. Update all imports
3. Test to ensure functionality

### Phase 4: Update Configuration
- Update paths in package.json scripts
- Update jest.config.js paths
- Update any hardcoded paths in configs

### Phase 5: Create Directory READMEs
Add README.md to each major directory explaining:
- Purpose of the directory
- What belongs there
- What doesn't belong there

## Benefits

1. **Cleaner Root**: Only essential files in root
2. **Better Organization**: Clear separation of concerns
3. **Easier Navigation**: Logical grouping of related files
4. **Git-Friendly**: Less clutter in git status
5. **Professional Structure**: Industry-standard layout

## Rollback Plan

If anything breaks:
1. All moves will be done with git mv
2. Can easily revert with git
3. No files will be deleted, only moved
4. Original structure preserved in git history

## Next Steps

1. Review and approve this plan
2. Create backup/snapshot
3. Execute Phase 1-2 (non-breaking moves)
4. Test thoroughly
5. Execute Phase 3-5 (breaking changes with fixes)
6. Final testing and verification