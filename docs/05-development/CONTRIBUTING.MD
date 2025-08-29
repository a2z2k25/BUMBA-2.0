# Contributing to BUMBA CLI

Thank you for your interest in contributing to BUMBA! We welcome contributions from the community.

## Code of Conduct

Be respectful, inclusive, and professional. We're building something amazing together.

## How to Contribute

### Reporting Issues

1. Check existing issues first
2. Use issue templates when available
3. Include reproduction steps
4. Provide system information

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write/update tests
5. Run quality checks
6. Commit with clear messages
7. Push and create PR

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/bumba.git
cd bumba

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Configure your API keys

# Run tests
npm test

# Run linter
npm run lint

# Start development
npm run dev
```

## Quality Standards

### Before Submitting

- [ ] Code passes all tests (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Documentation updated if needed
- [ ] Follows existing code style
- [ ] Includes tests for new features

### Code Style

- Use async/await over promises
- Prefer const over let
- Meaningful variable names
- Document complex logic
- Keep functions focused

### Commit Messages

Format: `type: description`

Types:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Test updates
- `chore:` Maintenance

Example: `feat: add parallel execution support`

## Testing

```bash
# Run all tests
npm test

# Run specific test
npm test -- --testNamePattern="department"

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## Documentation

- Update README for user-facing changes
- Add JSDoc comments for new functions
- Update CHANGELOG.md for notable changes
- Include examples for new features

## Development Guidelines

### Adding New Commands

1. Define in appropriate manager file
2. Add to command registry
3. Update REFERENCE.md
4. Write tests
5. Add examples

### Creating Specialists

1. Extend specialist base class
2. Define capabilities
3. Register with department
4. Add integration tests

### MCP Integration

1. Follow MCP protocol standards
2. Add to integration layer
3. Update configuration docs
4. Test with mock server

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Run full test suite
4. Create release PR
5. Tag release after merge

## Getting Help

- Check [documentation](docs/)
- Ask in [Discord](https://discord.gg/bumba)
- Review [existing PRs](https://github.com/bumba-ai/bumba/pulls)

## Recognition

Contributors are recognized in:
- CHANGELOG.md release notes
- GitHub contributors page
- Project documentation

Thank you for contributing to BUMBA! 🟢