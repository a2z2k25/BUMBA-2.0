# BUMBA CLI User Guide

## Getting Started

### Installation

```bash
npm install -g bumba-cli
```

### First Run

```bash
bumba help
```

## Core Commands

### Product Management

#### Create PRD (Product Requirements Document)
```bash
bumba prd "Social Media Dashboard"
```
Creates a comprehensive PRD with:
- Executive summary
- User stories
- Technical requirements
- Success metrics
- Timeline

#### Generate Requirements
```bash
bumba requirements "Payment System"
```

#### Create Roadmap
```bash
bumba roadmap "Q1 2024"
```

### Design Commands

#### Design System
```bash
bumba design "E-commerce Platform"
```
Generates:
- UI/UX specifications
- Component library
- Design tokens
- Style guide

#### Create Wireframes
```bash
bumba wireframe "Landing Page"
```

#### UI Components
```bash
bumba ui "Navigation Bar"
```

### Development Commands

#### Implementation
```bash
bumba implement "User Authentication"
```
Creates:
- Code structure
- Implementation plan
- Test cases
- Documentation

#### API Development
```bash
bumba api "REST API for Products"
```
Generates:
- API specification
- Endpoint definitions
- Request/response schemas
- Authentication details

#### Database Design
```bash
bumba database "User Management Schema"
```

### Analysis Commands

#### Code Analysis
```bash
bumba analyze ./src
```

#### Performance Audit
```bash
bumba audit performance
```

#### Security Review
```bash
bumba security-review ./api
```

## Execution Modes

### 1. Full Mode (Default)
Complete execution with all features:
```bash
bumba implement feature
# or explicitly
bumba implement feature --mode full
```

### 2. Lite Mode
Fast, lightweight execution:
```bash
bumba analyze code --mode lite
```
- Uses cached data when available
- Minimal specialist activation
- Reduced processing time

### 3. Turbo Mode
Maximum speed with parallel processing:
```bash
bumba build api --mode turbo
```
- Parallel specialist execution
- Aggressive caching
- Optimized for speed

### 4. Eco Mode
Resource-conscious execution:
```bash
bumba test suite --mode eco
```
- Minimal memory usage
- Reduced concurrent operations
- Ideal for limited resources

### 5. DICE Mode
Development, Innovation, Creativity, Excellence:
```bash
bumba design system --mode DICE
```
- Enhanced creativity features
- Innovation-focused analysis
- Excellence in output quality

### 6. Executive Mode
High-level strategic execution:
```bash
bumba roadmap product --mode executive
```
- Strategic focus
- Executive summaries
- Business-oriented output

## Command Chaining

### Sequential Execution (&&)
Execute commands in sequence (stops on failure):
```bash
bumba analyze && bumba implement && bumba test
```

### Conditional Execution (||)
Execute next command only if previous fails:
```bash
bumba test || bumba debug
```

### Piped Execution (|)
Pass output from one command to next:
```bash
bumba analyze | bumba report
```

### Transform Execution (->)
Transform data through commands:
```bash
bumba extract-data -> bumba transform -> bumba visualize
```

## Working with Files

### Specify Input Files
```bash
bumba analyze --input ./src/app.js
```

### Specify Output Directory
```bash
bumba prd "Feature" --output ./custom-output
```

### Batch Processing
```bash
bumba analyze --files "./src/**/*.js"
```

## Team Collaboration

### Enable Multi-Department Collaboration
```bash
bumba design-api "Payment API" --collaborate
```
Activates specialists from multiple departments for comprehensive output.

### Department-Specific Execution
```bash
bumba implement --department backend
bumba design --department frontend
```

## Configuration

### Set Default Mode
```bash
bumba config set mode turbo
```

### Configure Output Directory
```bash
bumba config set output ./my-output
```

### View Current Configuration
```bash
bumba config list
```

## Monitoring and Metrics

### View Performance Metrics
```bash
bumba metrics
```
Shows:
- Command execution times
- Resource usage
- Cache statistics
- Error rates

### Check System Health
```bash
bumba health
```
Displays:
- System status
- Available resources
- Active specialists
- Queue status

### View Command History
```bash
bumba history
```

## Troubleshooting

### Enable Debug Mode
```bash
DEBUG=bumba:* bumba implement feature
```

### Clear Cache
```bash
bumba cache clear
```

### Reset Configuration
```bash
bumba config reset
```

### Check Version
```bash
bumba --version
```

## Advanced Features

### Custom Templates
Create custom templates for repeated tasks:
```bash
bumba template create "API Controller"
bumba template use "API Controller" --name UserController
```

### Aliases
Create shortcuts for common commands:
```bash
bumba alias create "quick-api" "api --mode turbo --output ./apis"
bumba quick-api "Products"
```

### Scheduled Execution
Schedule commands for later execution:
```bash
bumba schedule "analyze ./src" --at "2:00 AM"
bumba schedule "report generate" --every "Monday 9:00 AM"
```

## Best Practices

### 1. Choose the Right Mode
- **Full**: Comprehensive tasks requiring detailed output
- **Lite**: Quick iterations and prototyping
- **Turbo**: Time-sensitive operations
- **Eco**: Resource-limited environments
- **DICE**: Creative and innovative projects
- **Executive**: Strategic planning and reporting

### 2. Use Command Chaining
Chain related commands for efficient workflows:
```bash
bumba analyze && bumba optimize && bumba implement
```

### 3. Enable Caching
For repeated operations, caching significantly improves performance:
```bash
bumba analyze --cache
```

### 4. Monitor Performance
Regularly check metrics to optimize usage:
```bash
bumba metrics --last 7d
```

### 5. Organize Output
Use meaningful output directories:
```bash
bumba prd "Feature X" --output ./prds/2024-q1/
```

## Common Workflows

### 1. Complete Feature Development
```bash
# Generate PRD
bumba prd "New Feature"

# Design the interface
bumba design "New Feature UI"

# Implement the feature
bumba implement "New Feature" --mode turbo

# Generate tests
bumba test generate "New Feature"

# Create documentation
bumba docs "New Feature"
```

### 2. API Development Workflow
```bash
# Design API specification
bumba api design "User API"

# Implement endpoints
bumba api implement "User API"

# Generate tests
bumba api test "User API"

# Create documentation
bumba api docs "User API"
```

### 3. Analysis and Optimization
```bash
# Analyze codebase
bumba analyze ./src --deep

# Generate optimization report
bumba optimize suggest

# Apply optimizations
bumba optimize apply --safe

# Verify improvements
bumba metrics compare --before --after
```

## Keyboard Shortcuts

When in interactive mode:
- `Ctrl+C`: Cancel current command
- `Ctrl+D`: Exit BUMBA
- `Tab`: Auto-complete commands
- `↑/↓`: Navigate command history

## Getting Help

### Command-specific help
```bash
bumba help implement
bumba prd --help
```

### Online Documentation
Visit: https://bumba-cli.docs.com

### Community Support
- Discord: https://discord.gg/bumba
- GitHub: https://github.com/bumba/cli
- Email: support@bumba-cli.com

## Tips and Tricks

1. **Use tab completion** for faster command entry
2. **Create aliases** for frequently used command combinations
3. **Export metrics** for tracking progress over time
4. **Use lite mode** for rapid prototyping
5. **Enable notifications** for long-running commands
6. **Set up templates** for consistent output formats
7. **Use the `--dry-run` flag** to preview command execution

## Update and Maintenance

### Update BUMBA CLI
```bash
npm update -g bumba-cli
```

### Check for Updates
```bash
bumba update check
```

### View Changelog
```bash
bumba changelog
```

## Security

### API Key Management
```bash
bumba config set-key OPENAI_API_KEY "your-key"
```

### Secure Mode
Run commands with enhanced security:
```bash
bumba --secure implement "Sensitive Feature"
```

### Audit Log
View security audit log:
```bash
bumba audit log
```