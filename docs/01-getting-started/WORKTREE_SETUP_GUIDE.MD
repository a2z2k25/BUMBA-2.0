# BUMBA Worktree Collaboration Setup Guide

## 🟡 Overview

The BUMBA Worktree Collaboration system enables **true parallel agent coding** with physical workspace isolation using Git worktrees. This guide ensures new users can get the system operational quickly.

## 🏁 Prerequisites

### Required Software

1. **Node.js 18+**
   ```bash
   node --version  # Should show 18.0.0 or higher
   ```

2. **Git 2.5+** (for worktree support)
   ```bash
   git --version   # Should show 2.5.0 or higher
   ```

3. **Git Repository**
   ```bash
   # If not already in a Git repo:
   git init
   git add .
   git commit -m "Initial commit"
   ```

## 🟢 Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Verify Installation
The system should work immediately after installation. Test with:

```javascript
const { EnhancedGitCollaboration } = require('./src/core/collaboration/enhanced-git-collaboration');

// Initialize collaboration system
const collaboration = new EnhancedGitCollaboration({
  useWorktrees: true,
  maxConcurrentAgents: 5
});
```

## 🔧 Configuration (Optional)

The system works with **zero configuration**, but you can customize settings in `bumba.config.js`:

```javascript
module.exports = {
  // ... other config
  collaboration: {
    // Enable worktrees (default: true)
    useWorktrees: true,
    
    // Maximum concurrent agents (default: 10)
    maxConcurrentAgents: 5,
    
    // Worktrees directory (default: auto-detected)
    worktreesPath: './agent-workspaces',
    
    // Shared dependency cache (default: true)
    useSharedDependencies: true,
    
    // Automatic cleanup (default: true)
    autoCleanup: true,
    
    // Fallback to branches if worktrees fail (default: true)
    fallbackToBranches: true
  }
};
```

## 📖 Basic Usage

### Simple Example
```javascript
const { EnhancedGitCollaboration } = require('./src/core/collaboration/enhanced-git-collaboration');

async function example() {
  // Initialize system
  const collaboration = new EnhancedGitCollaboration({
    useWorktrees: true,
    maxConcurrentAgents: 3
  });
  
  // Wait for initialization
  if (collaboration.initializationPromise) {
    await collaboration.initializationPromise;
  }
  
  // Assign work to agents
  const agent1 = await collaboration.assignAgentWork(
    'backend-agent',
    'Implement user authentication',
    ['src/auth/auth.js', 'src/auth/middleware.js']
  );
  
  const agent2 = await collaboration.assignAgentWork(
    'frontend-agent',
    'Create login form',
    ['src/components/Login.jsx', 'src/styles/login.css']
  );
  
  console.log('Agent 1 workspace:', agent1.workspace);
  console.log('Agent 2 workspace:', agent2.workspace);
  
  // Execute commands in isolated workspaces
  await collaboration.executeAgentCommand('backend-agent', 'npm test');
  await collaboration.executeAgentCommand('frontend-agent', 'npm run build');
  
  // Commit work
  await collaboration.agentCommit('backend-agent', 'Add authentication system');
  await collaboration.agentCommit('frontend-agent', 'Add login form');
  
  // Merge work
  await collaboration.requestMerge('backend-agent');
  await collaboration.requestMerge('frontend-agent');
  
  // Cleanup
  await collaboration.emergencyCleanup();
}

example().catch(console.error);
```

### Parallel Agents Example
```javascript
async function parallelExample() {
  const collaboration = new EnhancedGitCollaboration({ useWorktrees: true });
  
  if (collaboration.initializationPromise) {
    await collaboration.initializationPromise;
  }
  
  // Assign multiple agents simultaneously
  const agents = ['agent-1', 'agent-2', 'agent-3', 'agent-4'];
  
  const assignments = await Promise.all(
    agents.map(agentId => 
      collaboration.assignAgentWork(
        agentId,
        `Work for ${agentId}`,
        [`src/${agentId}/index.js`]
      )
    )
  );
  
  console.log(`${assignments.length} agents working in parallel`);
  
  // All agents can work simultaneously without conflicts
  await Promise.all(
    agents.map(agentId =>
      collaboration.executeAgentCommand(agentId, 'echo "Working in parallel"')
    )
  );
  
  // Cleanup all agents
  await collaboration.emergencyCleanup();
}
```

## 🟢️ Advanced Configuration

### Custom Workspace Templates
```javascript
const collaboration = new EnhancedGitCollaboration({
  useWorktrees: true,
  workspaceTemplate: 'backend', // or 'frontend', 'fullstack'
  workspaceTemplates: {
    backend: {
      envVars: ['NODE_ENV=development', 'API_PORT=3001'],
      scripts: ['npm ci', 'npm run setup:backend'],
      ports: { start: 3001, end: 3100 }
    },
    frontend: {
      envVars: ['NODE_ENV=development', 'REACT_APP_ENV=dev'],
      scripts: ['npm ci', 'npm run setup:frontend'],
      ports: { start: 3101, end: 3200 }
    }
  }
});
```

### Performance Optimization
```javascript
const collaboration = new EnhancedGitCollaboration({
  useWorktrees: true,
  useSharedDependencies: true, // Faster npm installs
  conflictResolution: {
    strategy: 'prefer-agent-changes',
    autoResolve: true
  },
  metrics: {
    enabled: true,
    alertThresholds: {
      setupTime: 30000, // 30 seconds
      conflictRate: 0.1  // 10%
    }
  }
});
```

## 🔍 Troubleshooting

### Common Issues

1. **Git Version Too Old**
   ```bash
   # Update Git to 2.5+
   # macOS: brew upgrade git
   # Ubuntu: sudo apt update && sudo apt upgrade git
   ```

2. **Permission Issues**
   ```bash
   # Ensure proper Git configuration
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

3. **Node.js Too Old**
   ```bash
   # Install Node.js 18+ from nodejs.org
   # Or use nvm: nvm install 18 && nvm use 18
   ```

4. **Git Index Lock**
   ```bash
   # If you see "index.lock" errors:
   rm -f .git/index.lock
   ```

### Verification Script
```javascript
// test-setup.js
const { EnhancedGitCollaboration } = require('./src/core/collaboration/enhanced-git-collaboration');

async function testSetup() {
  try {
    const collaboration = new EnhancedGitCollaboration({ useWorktrees: true });
    
    if (collaboration.initializationPromise) {
      await collaboration.initializationPromise;
    }
    
    const test = await collaboration.assignAgentWork(
      'test-agent',
      'Setup verification',
      ['test.txt']
    );
    
    console.log('🏁 Setup successful!');
    console.log('Mode:', test.mode);
    console.log('Workspace:', test.workspace);
    
    await collaboration.cleanupAgent('test-agent');
    
  } catch (error) {
    console.error('🔴 Setup failed:', error.message);
  }
}

testSetup();
```

## 📊 System Monitoring

### Health Check
```javascript
const health = collaboration.getStatus();
console.log('Worktrees enabled:', health.worktreesEnabled);
console.log('Active agents:', health.worktreeMetrics.activeWorkspaces);
console.log('System metrics:', health.enhancedMetrics);
```

### Performance Metrics
```javascript
const metrics = collaboration.worktreeEnhancement.getMetrics();
console.log('Workspaces created:', metrics.workspacesCreated);
console.log('Average setup time:', metrics.avgSetupTime + 'ms');
console.log('Active workspaces:', metrics.activeWorkspaces);
```

## 🏁 Success Criteria

Your system is working correctly if you can:

🏁 **Create 3+ agents simultaneously** without conflicts  
🏁 **Workspace creation under 30 seconds** (usually <1 second)  
🏁 **Zero file collisions** between agents  
🏁 **Successful merges** without manual intervention  
🏁 **Automatic cleanup** of orphaned workspaces  

## 🆘 Support

If you encounter issues:

1. **Check Prerequisites**: Ensure Node.js 18+ and Git 2.5+ are installed
2. **Run Verification**: Use the test script above to verify setup
3. **Check Logs**: The system provides detailed logging for debugging
4. **File Issues**: Report problems at the project repository

## 🔄 Updates

The worktree collaboration system is automatically included with BUMBA installations. No additional setup steps are required for new features or updates.

---

**System Status**: 🏁 **READY FOR PRODUCTION USE**  
**Zero-Configuration**: 🏁 **Works out of the box**  
**Parallel Agents**: 🏁 **10+ agents supported**  
**Physical Isolation**: 🏁 **True workspace separation**