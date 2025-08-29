# Changelog

All notable changes to BUMBA CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2025-08-29

### Added
- Intelligent Command System with context-aware routing
- Multi-agent collaboration between departments
- 6 execution modes (Full, Lite, Turbo, Eco, DICE, Executive)
- Command chaining with &&, ||, |, and -> operators
- Advanced caching system with LRU and TTL
- Load balancing across specialist pools
- Performance monitoring and metrics
- Resource optimization and memory management
- Query optimization with indexing
- Comprehensive error handling and recovery
- System orchestrator for central coordination
- API documentation
- User guide
- Developer documentation
- Integration test suite
- System validation scripts

### Changed
- All 60+ commands now use intelligent routing
- Commands route to appropriate departments automatically
- Specialists selected based on context and requirements
- Output generation is now context-aware
- Improved PRD generation with specialist analysis
- Enhanced API specification generation
- Better design document creation

### Fixed
- Emergency dump files flooding issue (6,959 files)
- Commands not executing implementations
- Specialist activation failures
- Memory leaks in long-running processes
- Cache invalidation issues
- Path issues in bin scripts

### Performance
- Command routing: < 10ms
- Specialist selection: < 50ms
- Output generation: < 500ms
- Memory usage optimized to < 512MB
- Cache hit rate > 70%

## [1.2.0] - 2025-08-26

### Added
- Enhanced specialist definitions
- Improved department structures
- Basic command routing

### Changed
- Updated command handler
- Improved error messages

### Fixed
- Minor bugs in command execution
- Path resolution issues

## [1.1.0] - 2025-08-20

### Added
- Initial specialist system
- Department managers
- Basic command structure

### Changed
- Reorganized project structure
- Updated documentation

## [1.0.0] - 2025-08-15

### Added
- Initial release
- 60+ slash commands
- Basic BUMBA framework
- Command handler system
- Integration hooks
- Basic documentation

---

[1.3.0]: https://github.com/bumba/cli/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/bumba/cli/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/bumba/cli/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/bumba/cli/releases/tag/v1.0.0