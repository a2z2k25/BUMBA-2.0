/**
 * BUMBA File Generation Module
 * Generates framework files and configurations
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../core/logging/bumba-logger');

/**
 * Generate CLAUDE.md content
 */
function generateClaudeMd(version) {
  return `# BUMBA Claude Code Mastery Framework

## Mission Statement
Professional Claude Code enhancement framework combining intelligent orchestration with mandatory quality enforcement for production-ready development workflows.

## BUMBA Architecture
- **Intelligent Orchestration**: Smart wave coordination and parallel agent analysis
- **Quality Enforcement**: Pre/post execution gates, security scanning, cognitive safeguards
- **Designer Optimized**: Figma integration, visual tools, UI generation capabilities
- **Enterprise Ready**: Security validation, performance optimization, professional workflows

## Quick Start
\`\`\`bash
/bumba:menu          # Show all available commands
/bumba:implement     # Intelligent feature development
/bumba:analyze       # Comprehensive code analysis  
/bumba:design        # Designer-focused workflows
/bumba:help          # Contextual assistance
\`\`\`

## Designer Features
- **Figma Integration**: Direct workspace access and Dev Mode support
- **Visual Documentation**: Screenshot utilities and design asset management
- **UI Generation**: Intelligent component creation from designs
- **Design-to-Code**: Seamless handoff workflows

## Quality & Security
- **Pre-execution**: Security scanning and input validation
- **Post-execution**: Code quality verification and optimization
- **Continuous**: Real-time feedback and progress notifications
- **Memory**: Context preservation across sessions and projects

## Cognitive Framework
- **Intelligence**: Multi-step reasoning with orchestrated analysis
- **Memory**: Advanced context management and decision tracking
- **Safeguards**: Hallucination prevention and validation protocols
- **Evidence**: Documentation-backed recommendations and implementations

## Available Commands
Use \`/bumba:menu\` for interactive command discovery with descriptions and examples.

### Core Development
- \`/bumba:implement [feature]\` - Intelligent feature development
- \`/bumba:analyze [target]\` - Multi-dimensional code analysis
- \`/bumba:secure [scope]\` - Enhanced security validation
- \`/bumba:improve [target]\` - Quality-driven improvements

### Designer Workflows
- \`/bumba:design [workflow]\` - Designer-optimized workflows
- \`/bumba:figma [action]\` - Figma integration & Dev Mode
- \`/bumba:visual [task]\` - Visual documentation & assets
- \`/bumba:ui [component]\` - Intelligent UI generation

### System & Help
- \`/bumba:menu\` - Interactive command discovery
- \`/bumba:memory [action]\` - Advanced context management
- \`/bumba:help [command]\` - Contextual assistance
- \`/bumba:settings\` - Framework configuration

## Tool Integration

### Memory System
- **memory MCP**: Persistent context across sessions
- **Verification requirement**: Always verify before claiming
- **Context compression**: Smart handling of context limits
- **Session handoffs**: Complete state preservation

### Tool Awareness System
- **Automatic Discovery**: AI agents maintain awareness of all available tools
- **Contextual Suggestions**: Proactive tool recommendations based on task
- **Usage Tracking**: Learn from successful tool combinations
- **Persistent Knowledge**: Never forget about available capabilities

### Quality Gates
- **Pre-execution**: Security scanning + verification
- **Post-execution**: qlty integration + validation
- **Audio feedback**: Completion notifications
- **Rollback capability**: Safe failure recovery

### Designer Tools
- **Figma integration**: Direct workspace access + Dev Mode
- **Visual capture**: Screenshot utilities and documentation
- **UI generation**: Intelligent component creation
- **Asset optimization**: Professional design-to-code workflow

## Security Framework

### Input Validation (MANDATORY)
\`\`\`python
# Validate before processing
def process_user_data(data: dict) -> Result:
    if not isinstance(data.get('email'), str):
        return Error("Invalid email type")
    # ... comprehensive validation
\`\`\`

### AI-Specific Security
- **Prompt injection protection**: Input sanitization and validation
- **Model access controls**: Secure AI integration patterns
- **Data privacy**: AI processing compliance validation
- **Adversarial input handling**: Robust error recovery

## Forbidden Patterns

### LLM-Specific Mistakes
- **Never assume file contents** → Always Read first
- **Never assume APIs exist** → Verify with searches
- **Never contradict earlier decisions** → Check memory
- **Never skip verification** → Test every assertion
- **Never ignore context limits** → Compress proactively

### Code Quality Standards
- \`any\` → Specific types (prevents runtime errors)
- Missing return types → Always specify (API contracts)
- \`# type: ignore\` → Fix root cause (technical debt)
- String concatenation in SQL → Parameterized queries
- Global mutable state → Dependency injection

## Completion Checklist

### Pre-Implementation
- [ ] Recalled relevant memory entries
- [ ] Verified file contents with Read tool
- [ ] Confirmed APIs/imports exist
- [ ] Checked for conflicts with earlier work
- [ ] Documented uncertainties explicitly

### During Implementation
- [ ] Reading files before modifying
- [ ] Verifying imports before using
- [ ] Testing incrementally
- [ ] Storing progress in memory
- [ ] Validating each step works

### Post-Implementation
- [ ] Linters: 0 errors, 0 warnings (qlty validated)
- [ ] Tests: 100% passing, edge cases covered
- [ ] Security: Input validation, output sanitization, AI-specific checks
- [ ] Performance: No obvious bottlenecks
- [ ] Designer assets: Optimized and accessible
- [ ] Integration: Works with existing system
- [ ] Lessons learned: Stored in memory

## BUMBA Principles

### Non-negotiable
- **Verify before claiming** - Never assume
- **Store key decisions** - Memory is unreliable
- **Check for conflicts** - Consistency matters
- **Test incrementally** - Catch issues early
- **Agent parallelization** - Efficiency requirement
- **Research → Plan → Implement** - Systematic approach
- **Security validation** - Production requirement
- **Hook failures = immediate stop** - Quality gate

### Professional Standards
- **Healthy skepticism** - Question assumptions
- **Explicit uncertainty** - State when unsure
- **Verification habit** - Check everything
- **Memory externalization** - Store decisions
- **Context management** - Compress proactively
- **Consistency validation** - Check against earlier work

---
*BUMBA Framework v${version} - Intelligence • Quality • Security • Design*`;
}

/**
 * Generate settings.json content
 */
function generateSettings(version) {
  return {
    framework: 'bumba',
    version: version,
    permissions: {
      allow: [
        'Bash',
        'Read',
        'Edit',
        'Write',
        'MultiEdit',
        'WebFetch',
        'WebSearch',
        'Grep',
        'Glob',
        'LS',
        'TodoRead',
        'TodoWrite',
        'Task'
      ]
    },
    model: 'sonnet',
    orchestration: {
      wave_enabled: true,
      complexity_threshold: 0.7,
      parallel_agents: 4,
      quality_gates: true,
      designer_mode: true,
      cognitive_safeguards: true
    },
    hooks: {
      Start: [
        {
          matcher: '',
            {
              type: 'command',
              command: '~/.claude/hooks/context-bridge.sh sync'
            },
            {
              type: 'command',
              command: '~/.claude/hooks/mcp-optimization-engine.sh analyze'
            }
          ]
        }
      ],
      PreToolUse: [
        {
          matcher: 'Write|Edit|MultiEdit|Bash',
          hooks: [
            {
              type: 'command',
              command: '~/.claude/hooks/bumba-pre-execution.sh'
            },
            {
              type: 'command',
              command: '~/.claude/hooks/predictive-quality-gate.sh'
            }
          ]
        },
        {
          matcher: '.*',
          hooks: [
            {
              type: 'command',
              command: '~/.claude/hooks/intelligent-command-router.sh'
            }
          ]
        }
      ],
      PostToolUse: [
        {
          matcher: 'Write|Edit|MultiEdit',
          hooks: [
            {
              type: 'command',
              command: '~/.claude/hooks/bumba-post-execution.sh'
            },
            {
              type: 'command',
              command: '~/.claude/hooks/workflow-learning-engine.sh'
            }
          ]
        },
        {
          matcher: 'figma.*|design.*|visual.*',
          hooks: [
            {
              type: 'command',
              command: '~/.claude/hooks/design-workflow-analyzer.sh'
            }
          ]
        }
      ],
      Stop: [
        {
          matcher: '',
          hooks: [
            {
              type: 'command',
              command: '~/.claude/hooks/bumba-completion.sh'
            },
            {
              type: 'command',
              command: '~/.claude/hooks/project-context-synthesis.sh'
            },
            {
              type: 'command',
              command: '~/.claude/hooks/workflow-learning-engine.sh suggest'
            }
          ]
        }
      ]
    }
  };
}

/**
 * Generate framework files
 */
async function generateFrameworkFiles(installDir, version) {
  const spinner = require('ora')('Generating BUMBA Framework Files...').start();

  // Ensure directories exist
  const dirs = [
    installDir,
    path.join(installDir, 'commands'),
    path.join(installDir, 'hooks'),
    path.join(installDir, 'system'),
    path.join(installDir, 'assets', 'audio')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Write files
  fs.writeFileSync(path.join(installDir, 'CLAUDE.md'), generateClaudeMd(version));
  fs.writeFileSync(path.join(installDir, 'settings.json'), JSON.stringify(generateSettings(version), null, 2));

  // Copy audio assets
  const audioSource = path.join(__dirname, '..', '..', 'assets', 'audio', 'bumba-horn.mp3');
  const audioTarget = path.join(installDir, 'assets', 'audio', 'bumba-horn.mp3');

  if (fs.existsSync(audioSource)) {
    fs.copyFileSync(audioSource, audioTarget);
    logger.info('🏁 BUMBA audio assets copied');
  } else {
    logger.info('🟡  Audio asset not found - audio will use fallback sounds');
  }

  spinner.stop();
  logger.info('🏁 BUMBA framework files generated');

  return true;
}

module.exports = {
  generateFrameworkFiles,
  generateClaudeMd,
  generateSettings
};
