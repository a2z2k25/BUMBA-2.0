# BUMBA Framework

```
    ██████╗ ██╗   ██╗███╗   ███╗██████╗  █████╗
    ██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔══██╗
    ██████╔╝██║   ██║██╔████╔██║██████╔╝███████║
    ██╔══██╗██║   ██║██║╚██╔╝██║██╔══██╗██╔══██║
    ██████╔╝╚██████╔╝██║ ╚═╝ ██║██████╔╝██║  ██║
    ╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚═════╝ ╚═╝  ╚═╝
```

**AI-powered multi-agent orchestration framework that transforms Claude into a synchronized development team.** Deploy specialized AI agents working in parallel to build complete features in minutes, not hours.

[![Version](https://img.shields.io/badge/version-2.0-green.svg)](https://github.com/bumba-ai/bumba)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)

## 🏁 Quick Start

```bash
# Install globally
npm install -g bumba-framework

# Or clone for development
git clone https://github.com/bumba-ai/bumba.git
cd bumba
npm install
npm start
```

**That's it.** Zero configuration required. BUMBA works out of the box.

## 🟡 What is BUMBA?

BUMBA orchestrates multiple AI agents to work as a cohesive development team. Each agent specializes in their domain—backend, frontend, testing, strategy—and works in parallel without conflicts.

### Key Features

- **🚀 True Parallel Execution** - Multiple agents working simultaneously in isolated environments
- **🎯 Department Specialization** - 26+ specialized agents across 3 departments
- **🔄 Automatic Coordination** - Smart routing and task distribution with zero overhead
- **📊 Real-time Visibility** - Color-coded output shows exactly what each agent is doing
- **🛡️ Production Ready** - Built-in validation, testing, and security protocols

## 🟢 How It Works

```bash
/bumba:implement "user authentication system"
```

Watch as BUMBA automatically:
1. **🟡 Strategic Planning** - Product strategist defines requirements
2. **🟢 Backend Development** - API endpoints and database schema created
3. **🔴 Frontend Design** - UI components and user flows built
4. **🟠 Quality Assurance** - Tests written and executed
5. **🏁 Integration** - Everything merged and deployed

All happening **simultaneously**, not sequentially.

## 📦 Core Capabilities

### Multi-Agent Orchestration
```javascript
// BUMBA automatically spawns the right specialists
const result = await bumba.implement("payment processing");

// Behind the scenes:
// - Security specialist reviews PCI compliance
// - Database specialist optimizes transaction tables  
// - API specialist creates payment endpoints
// - Frontend specialist builds checkout UI
// - Test specialist writes integration tests
```

### Department Structure

| Department | Manager | Specialists | Focus Area |
|------------|---------|------------|------------|
| 🟡 **Strategic** | Product-Strategist | 9 specialists | Planning, requirements, documentation |
| 🟢 **Technical** | Backend-Engineer | 9 specialists | APIs, databases, infrastructure |
| 🔴 **Experience** | Design-Engineer | 8 specialists | UI/UX, frontend, accessibility |

### Intelligent Model Assignment

BUMBA optimizes AI model usage based on task complexity:
- **Claude Max** for critical manager decisions
- **Free tier models** for specialized tasks
- **Automatic fallback** when limits reached
- **Smart caching** to reduce API calls

## 🛠️ Commands

| Command | Description |
|---------|-------------|
| `/bumba:menu` | Interactive command discovery |
| `/bumba:implement [feature]` | Build complete features |
| `/bumba:analyze [target]` | Comprehensive code analysis |
| `/bumba:test [scope]` | Multi-agent testing |
| `/bumba:secure` | Security validation |

## 📊 Performance Metrics

Based on production usage:
- **95% faster** feature development vs sequential approach
- **0.76MB** memory footprint (optimized from 15.7MB)
- **5ms** framework load time
- **96%** test coverage maintained automatically

## 🎨 Widget System

Create beautiful dashboards for Notion or terminal output:

```javascript
const { BumbaWidgets } = require('bumba/widgets');

// Generate real-time metrics dashboard
const dashboard = await widgets.generateDashboard({
  agents: getActiveAgents(),
  tasks: getCurrentTasks(),
  metrics: getPerformanceMetrics()
});

// Export for Notion embedding
await widgets.exportForNotion('./widgets');
```

Includes 7 widget types: RunChart, Sparkline, BarChart, Gauge, TextBox, AsciiBox, StatusGrid

## 🔧 Configuration (Optional)

While BUMBA works without configuration, you can customize behavior:

```javascript
// bumba.config.js
module.exports = {
  departments: {
    maxConcurrentAgents: 10,
    priorityMode: 'balanced'
  },
  validation: {
    requireTests: true,
    minCoverage: 80
  },
  branding: {
    colors: true,
    emojis: ['🟡', '🟢', '🔴', '🟠', '🏁']
  }
};
```

## 📚 Documentation

- [Getting Started](docs/01-getting-started/QUICK_START_GUIDE.MD) - First steps with BUMBA
- [Architecture Overview](docs/02-architecture/ARCHITECTURE.MD) - System design and patterns
- [Specialist Registry](docs/SPECIALIST_REGISTRY.md) - All 26 specialists detailed
- [Widget System](src/core/widgets/README.md) - Dashboard creation guide
- [API Reference](docs/03-api-reference/API_REFERENCE.MD) - Complete API documentation

## 🚀 Real World Example

```bash
$ /bumba:implement "e-commerce checkout with Stripe"

[STRATEGIC] 🟡 Defining checkout flow requirements...
[TECHNICAL] 🟢 Creating Stripe integration endpoints...
[EXPERIENCE] 🔴 Building payment form components...
[TECHNICAL] 🟢 Setting up webhook handlers...
[STRATEGIC] 🟡 Documenting PCI compliance...
[EXPERIENCE] 🔴 Adding loading states and errors...
[TECHNICAL] 🟠 Writing payment flow tests...

Progress: ████████████████████ 100%

🏁 Feature Complete:
   ✓ 12 API endpoints created
   ✓ 8 React components built
   ✓ 47 tests passing
   ✓ Full documentation generated
   ✓ Security review completed

Time: 4 minutes 23 seconds
```

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](docs/05-development/CONTRIBUTING.MD) for guidelines.

## 📄 License

MIT - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

Built with consciousness-driven development principles, emphasizing quality, efficiency, and developer happiness.

---

<p align="center">
  <b>Transform hours into minutes. Transform Claude into a team.</b><br>
  <code>npm install -g bumba-framework</code>
</p>

<p align="center">
  🟢 🟡 🟠 🔴 🏁
</p>