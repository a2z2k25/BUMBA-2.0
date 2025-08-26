#!/usr/bin/env node

/**
 * BUMBA Parallel Development Demo
 * Demonstrates 3+ AI agents working simultaneously in isolated Git worktrees
 * 
 * This demo showcases:
 * - Parallel workspace creation (< 30 seconds)
 * - Concurrent file modifications without conflicts
 * - Automatic dependency management
 * - Successful merge coordination
 * - Performance monitoring and cleanup
 */

const { logger } = require('../src/core/logging/bumba-logger');
const { EnhancedGitCollaboration } = require('../src/core/collaboration/enhanced-git-collaboration');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class ParallelDevelopmentDemo {
  constructor(config = {}) {
    this.config = {
      demoRepo: config.demoRepo || path.join(process.cwd(), 'demo-parallel-dev'),
      worktreesPath: config.worktreesPath || path.join(process.cwd(), 'demo-worktrees'),
      agents: config.agents || ['backend-engineer', 'frontend-developer', 'test-specialist'],
      maxDuration: config.maxDuration || 300000, // 5 minutes
      cleanupAfter: config.cleanupAfter !== false,
      ...config
    };
    
    this.collaboration = null;
    this.startTime = null;
    this.results = {
      phases: {},
      agents: {},
      metrics: {},
      success: false
    };
    
    this.isRunning = false;
  }

  /**
   * Run the complete parallel development demonstration
   */
  async runDemo() {
    this.startTime = Date.now();
    this.isRunning = true;
    
    try {
      logger.info('🟢 Starting BUMBA Parallel Development Demo');
      
      // Phase 1: Setup
      await this.setupDemoEnvironment();
      
      // Phase 2: Agent Assignment
      await this.assignParallelWork();
      
      // Phase 3: Concurrent Development
      await this.simulateConcurrentDevelopment();
      
      // Phase 4: Integration and Merge
      await this.integrateAndMerge();
      
      // Phase 5: Validation
      await this.validateResults();
      
      this.results.success = true;
      this.results.totalDuration = Date.now() - this.startTime;
      
      await this.generateDemoReport();
      
      logger.info('🏁 Parallel Development Demo completed successfully!');
      
    } catch (error) {
      logger.error('🔴 Demo failed:', error);
      this.results.error = error.message;
      throw error;
      
    } finally {
      if (this.config.cleanupAfter) {
        await this.cleanup();
      }
      this.isRunning = false;
    }
    
    return this.results;
  }

  /**
   * Phase 1: Setup demo environment with test repository
   */
  async setupDemoEnvironment() {
    const phaseStart = Date.now();
    logger.info('📁 Phase 1: Setting up demo environment');
    
    try {
      // Clean up any existing demo repo
      await this.safeRemove(this.config.demoRepo);
      await this.safeRemove(this.config.worktreesPath);
      
      // Create demo repository
      await this.createDemoRepository();
      
      // Initialize collaboration system
      this.collaboration = new EnhancedGitCollaboration({
        repository: this.config.demoRepo,
        useWorktrees: true,
        worktreesPath: this.config.worktreesPath,
        maxConcurrentAgents: this.config.agents.length + 2,
        fallbackToBranches: true,
        autoCleanup: false // Manual cleanup for demo control
      });
      
      // Wait for initialization
      if (this.collaboration.initializationPromise) {
        await this.collaboration.initializationPromise;
      }
      
      this.results.phases.setup = {
        duration: Date.now() - phaseStart,
        status: 'success'
      };
      
      logger.info(`🏁 Environment setup complete (${this.results.phases.setup.duration}ms)`);
      
    } catch (error) {
      this.results.phases.setup = {
        duration: Date.now() - phaseStart,
        status: 'failed',
        error: error.message
      };
      throw error;
    }
  }

  /**
   * Create a realistic demo repository with project structure
   */
  async createDemoRepository() {
    await fs.mkdir(this.config.demoRepo, { recursive: true });
    
    // Initialize Git repository
    await execAsync('git init', { cwd: this.config.demoRepo });
    await execAsync('git config user.name "BUMBA Demo"', { cwd: this.config.demoRepo });
    await execAsync('git config user.email "demo@bumba.ai"', { cwd: this.config.demoRepo });
    
    // Create realistic project structure
    const projectStructure = {
      'package.json': {
        name: 'bumba-demo-project',
        version: '1.0.0',
        description: 'BUMBA Parallel Development Demo Project',
        scripts: {
          start: 'node src/server.js',
          test: 'jest',
          build: 'webpack --mode production',
          dev: 'concurrently "npm run server" "npm run client"'
        },
        dependencies: {
          express: '^4.18.0',
          react: '^18.2.0',
          jest: '^29.0.0'
        },
        devDependencies: {
          webpack: '^5.74.0',
          concurrently: '^7.6.0'
        }
      },
      'README.md': `# BUMBA Demo Project

This is a demonstration project for BUMBA's parallel development capabilities.

## Features
- Backend API with Express.js
- Frontend with React
- Comprehensive test suite
- Automated build pipeline

## Development
- Backend Engineer: API endpoints and server logic
- Frontend Developer: UI components and user experience  
- Test Specialist: Test coverage and quality assurance
`,
      'src/server.js': `// Demo Express.js server
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'BUMBA Demo API' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

module.exports = app;
`,
      'src/components/App.jsx': `// Demo React component
import React from 'react';

function App() {
  return (
    <div className="App">
      <header>
        <h1>BUMBA Demo Application</h1>
        <p>Demonstrating parallel development with AI agents</p>
      </header>
    </div>
  );
}

export default App;
`,
      'tests/api.test.js': `// Demo API tests
const request = require('supertest');
const app = require('../src/server');

describe('API Tests', () => {
  test('GET / should return demo message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('BUMBA Demo API');
  });
});
`,
      '.gitignore': `node_modules/
dist/
.env
*.log
.DS_Store
`,
      'webpack.config.js': `// Demo webpack configuration
module.exports = {
  entry: './src/index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\\.jsx?$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  }
};
`
    };
    
    // Create all files
    for (const [filePath, content] of Object.entries(projectStructure)) {
      const fullPath = path.join(this.config.demoRepo, filePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      
      const fileContent = typeof content === 'object' 
        ? JSON.stringify(content, null, 2)
        : content;
      
      await fs.writeFile(fullPath, fileContent);
    }
    
    // Initial commit
    await execAsync('git add .', { cwd: this.config.demoRepo });
    await execAsync('git commit -m "Initial demo project setup"', { cwd: this.config.demoRepo });
    await execAsync('git branch -M main', { cwd: this.config.demoRepo });
    
    logger.info('📂 Demo repository structure created');
  }

  /**
   * Phase 2: Assign parallel work to multiple agents
   */
  async assignParallelWork() {
    const phaseStart = Date.now();
    logger.info('👥 Phase 2: Assigning parallel work to agents');
    
    try {
      const agentTasks = {
        'backend-engineer': {
          description: 'Implement REST API endpoints for user management',
          files: [
            'src/routes/users.js',
            'src/controllers/userController.js',
            'src/models/User.js',
            'src/middleware/auth.js'
          ]
        },
        'frontend-developer': {
          description: 'Create React components for user interface',
          files: [
            'src/components/UserDashboard.jsx',
            'src/components/UserProfile.jsx',
            'src/components/LoginForm.jsx',
            'src/styles/components.css'
          ]
        },
        'test-specialist': {
          description: 'Write comprehensive test suite for all features',
          files: [
            'tests/user.test.js',
            'tests/auth.test.js',
            'tests/components.test.js',
            'tests/integration.test.js'
          ]
        }
      };
      
      // Assign work to all agents in parallel
      const assignments = this.config.agents.map(async (agentId) => {
        const task = agentTasks[agentId] || {
          description: `Development tasks for ${agentId}`,
          files: [`src/${agentId}/index.js`]
        };
        
        const assignStart = Date.now();
        
        try {
          const result = await this.collaboration.assignAgentWork(
            agentId,
            task.description,
            task.files
          );
          
          const assignDuration = Date.now() - assignStart;
          
          this.results.agents[agentId] = {
            assignment: {
              status: 'success',
              mode: result.mode,
              workspace: result.workspace || null,
              branch: result.branch,
              duration: assignDuration
            },
            task: task
          };
          
          logger.info(`🏁 Agent ${agentId} assigned (${result.mode} mode, ${assignDuration}ms)`);
          
          return { agentId, success: true, result };
          
        } catch (error) {
          this.results.agents[agentId] = {
            assignment: {
              status: 'failed',
              error: error.message,
              duration: Date.now() - assignStart
            },
            task: task
          };
          
          logger.error(`🔴 Failed to assign agent ${agentId}:`, error);
          throw error;
        }
      });
      
      const assignmentResults = await Promise.all(assignments);
      
      this.results.phases.assignment = {
        duration: Date.now() - phaseStart,
        status: 'success',
        successful: assignmentResults.filter(r => r.success).length,
        total: this.config.agents.length
      };
      
      logger.info(`🏁 All agents assigned (${this.results.phases.assignment.duration}ms)`);
      
    } catch (error) {
      this.results.phases.assignment = {
        duration: Date.now() - phaseStart,
        status: 'failed',
        error: error.message
      };
      throw error;
    }
  }

  /**
   * Phase 3: Simulate concurrent development work
   */
  async simulateConcurrentDevelopment() {
    const phaseStart = Date.now();
    logger.info('🟢 Phase 3: Simulating concurrent development');
    
    try {
      const developmentTasks = this.config.agents.map(async (agentId) => {
        const agentResult = this.results.agents[agentId];
        if (!agentResult || agentResult.assignment.status !== 'success') {
          return;
        }
        
        const taskStart = Date.now();
        
        try {
          // Simulate development work for each agent
          await this.simulateAgentWork(agentId, agentResult.task);
          
          agentResult.development = {
            status: 'success',
            duration: Date.now() - taskStart
          };
          
          logger.info(`🏁 Agent ${agentId} completed development work`);
          
        } catch (error) {
          agentResult.development = {
            status: 'failed',
            error: error.message,
            duration: Date.now() - taskStart
          };
          
          logger.error(`🔴 Agent ${agentId} development failed:`, error);
          throw error;
        }
      });
      
      await Promise.all(developmentTasks);
      
      this.results.phases.development = {
        duration: Date.now() - phaseStart,
        status: 'success'
      };
      
      logger.info(`🏁 Concurrent development complete (${this.results.phases.development.duration}ms)`);
      
    } catch (error) {
      this.results.phases.development = {
        duration: Date.now() - phaseStart,
        status: 'failed',
        error: error.message
      };
      throw error;
    }
  }

  /**
   * Simulate development work for a specific agent
   */
  async simulateAgentWork(agentId, task) {
    const workspace = this.collaboration.getWorkspace ? 
      this.collaboration.getWorkspace(agentId) : null;
    
    // Generate realistic file content based on agent type
    const fileContents = this.generateFileContent(agentId, task.files);
    
    // Create files in agent's workspace
    for (const [fileName, content] of Object.entries(fileContents)) {
      if (workspace && workspace.path) {
        // Worktree mode - write to isolated workspace
        const filePath = path.join(workspace.path, fileName);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content);
      } else {
        // Branch mode - use collaboration system
        const filePath = path.join(this.config.demoRepo, fileName);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content);
      }
    }
    
    // Commit the work
    await this.collaboration.agentCommit(
      agentId,
      `Implement ${task.description}`,
      task.files
    );
    
    // Simulate some additional development work
    await this.sleep(1000 + Math.random() * 2000); // 1-3 seconds
    
    // Make another commit with improvements
    const improvementContent = this.generateImprovementContent(agentId);
    for (const [fileName, content] of Object.entries(improvementContent)) {
      const fullPath = workspace && workspace.path ? 
        path.join(workspace.path, fileName) :
        path.join(this.config.demoRepo, fileName);
      
      await fs.appendFile(fullPath, content);
    }
    
    await this.collaboration.agentCommit(
      agentId,
      `Enhance ${task.description} with improvements`,
      Object.keys(improvementContent)
    );
  }

  /**
   * Generate realistic file content based on agent type
   */
  generateFileContent(agentId, files) {
    const content = {};
    
    if (agentId === 'backend-engineer') {
      content['src/routes/users.js'] = `// User routes implementation
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/', auth, userController.getAllUsers);
router.get('/:id', auth, userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', auth, userController.updateUser);
router.delete('/:id', auth, userController.deleteUser);

module.exports = router;
`;
      
      content['src/controllers/userController.js'] = `// User controller implementation
const User = require('../models/User');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
`;
      
      content['src/models/User.js'] = `// User model definition
class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.role = data.role || 'user';
    this.createdAt = data.createdAt || new Date();
  }

  static async findAll() {
    // Implementation would use actual database
    return [];
  }

  static async findById(id) {
    // Implementation would use actual database
    return null;
  }

  static async create(data) {
    // Implementation would use actual database
    return new User({ ...data, id: Date.now() });
  }

  static async findByIdAndUpdate(id, data) {
    // Implementation would use actual database
    return null;
  }

  static async findByIdAndDelete(id) {
    // Implementation would use actual database
    return null;
  }
}

module.exports = User;
`;
      
      content['src/middleware/auth.js'] = `// Authentication middleware
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
}

module.exports = auth;
`;
    }
    
    if (agentId === 'frontend-developer') {
      content['src/components/UserDashboard.jsx'] = `// User Dashboard Component
import React, { useState, useEffect } from 'react';
import UserProfile from './UserProfile';
import './components.css';

function UserDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const userData = await response.json();
      setUsers(userData);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="user-dashboard">
      <h2>User Dashboard</h2>
      <div className="dashboard-content">
        <div className="user-list">
          <h3>Users</h3>
          {users.map(user => (
            <div
              key={user.id}
              className="user-item"
              onClick={() => setSelectedUser(user)}
            >
              <span className="user-name">{user.name}</span>
              <span className="user-email">{user.email}</span>
            </div>
          ))}
        </div>
        <div className="user-details">
          {selectedUser ? (
            <UserProfile user={selectedUser} />
          ) : (
            <div className="no-selection">Select a user to view details</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
`;
      
      content['src/components/UserProfile.jsx'] = `// User Profile Component
import React, { useState } from 'react';

function UserProfile({ user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);

  const handleSave = async () => {
    try {
      const response = await fetch(\`/api/users/\${user.id}\`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedUser),
      });
      
      if (response.ok) {
        setIsEditing(false);
        // Update parent component or refresh data
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
  };

  return (
    <div className="user-profile">
      <div className="profile-header">
        <h3>User Profile</h3>
        <button
          className="edit-button"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>
      
      <div className="profile-content">
        {isEditing ? (
          <div className="edit-form">
            <label>
              Name:
              <input
                type="text"
                value={editedUser.name}
                onChange={(e) => setEditedUser({...editedUser, name: e.target.value})}
              />
            </label>
            <label>
              Email:
              <input
                type="email"
                value={editedUser.email}
                onChange={(e) => setEditedUser({...editedUser, email: e.target.value})}
              />
            </label>
            <label>
              Role:
              <select
                value={editedUser.role}
                onChange={(e) => setEditedUser({...editedUser, role: e.target.value})}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <div className="form-actions">
              <button onClick={handleSave}>Save</button>
              <button onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="profile-display">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>Created:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfile;
`;
      
      content['src/components/LoginForm.jsx'] = `// Login Form Component
import React, { useState } from 'react';

function LoginForm({ onLogin }) {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        onLogin(data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-form">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        
        <label>
          Email:
          <input
            type="email"
            name="email"
            value={credentials.email}
            onChange={handleChange}
            required
          />
        </label>
        
        <label>
          Password:
          <input
            type="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            required
          />
        </label>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default LoginForm;
`;
      
      content['src/styles/components.css'] = `/* Component Styles */
.user-dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-content {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.user-list {
  flex: 1;
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
}

.user-item {
  padding: 10px;
  border: 1px solid #ddd;
  margin-bottom: 10px;
  cursor: pointer;
  background: white;
  border-radius: 4px;
  transition: background 0.2s;
}

.user-item:hover {
  background: #e9e9e9;
}

.user-details {
  flex: 2;
  background: white;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.user-profile {
  max-width: 500px;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.edit-form label {
  display: block;
  margin-bottom: 15px;
}

.edit-form input,
.edit-form select {
  width: 100%;
  padding: 8px;
  margin-top: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  margin-top: 20px;
}

.form-actions button {
  margin-right: 10px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.login-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.login-form label {
  display: block;
  margin-bottom: 15px;
}

.login-form input {
  width: 100%;
  padding: 10px;
  margin-top: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.no-selection {
  text-align: center;
  color: #666;
  padding: 40px;
}
`;
    }
    
    if (agentId === 'test-specialist') {
      content['tests/user.test.js'] = `// User model and controller tests
const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');

describe('User API', () => {
  beforeEach(() => {
    // Reset database or mocks before each test
  });

  describe('GET /api/users', () => {
    test('should return all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer valid-token');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should require authentication', async () => {
      const response = await request(app).get('/api/users');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/users', () => {
    test('should create a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(userData.name);
      expect(response.body.email).toBe(userData.email);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/users/:id', () => {
    test('should return specific user', async () => {
      const userId = 'test-user-id';
      
      const response = await request(app)
        .get(\`/api/users/\${userId}\`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', userId);
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/non-existent')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/users/:id', () => {
    test('should update user', async () => {
      const userId = 'test-user-id';
      const updateData = { name: 'Updated Name' };

      const response = await request(app)
        .put(\`/api/users/\${userId}\`)
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateData.name);
    });
  });

  describe('DELETE /api/users/:id', () => {
    test('should delete user', async () => {
      const userId = 'test-user-id';

      const response = await request(app)
        .delete(\`/api/users/\${userId}\`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(204);
    });
  });
});
`;
      
      content['tests/auth.test.js'] = `// Authentication middleware tests
const auth = require('../src/middleware/auth');
const jwt = require('jsonwebtoken');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      header: jest.fn()
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  test('should authenticate valid token', () => {
    const token = jwt.sign({ userId: 'test' }, 'demo-secret');
    req.header.mockReturnValue(\`Bearer \${token}\`);

    auth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
  });

  test('should reject missing token', () => {
    req.header.mockReturnValue(null);

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Access denied. No token provided.'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject invalid token', () => {
    req.header.mockReturnValue('Bearer invalid-token');

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid token.'
    });
    expect(next).not.toHaveBeenCalled();
  });
});
`;
      
      content['tests/components.test.js'] = `// React component tests
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserDashboard from '../src/components/UserDashboard';
import UserProfile from '../src/components/UserProfile';
import LoginForm from '../src/components/LoginForm';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('UserDashboard Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('should render loading state initially', () => {
    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve([])
    });

    render(<UserDashboard />);
    expect(screen.getByText('Loading users...')).toBeInTheDocument();
  });

  test('should display users after loading', async () => {
    const mockUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ];

    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockUsers)
    });

    render(<UserDashboard />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  test('should select user on click', async () => {
    const mockUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com' }
    ];

    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockUsers)
    });

    render(<UserDashboard />);

    await waitFor(() => {
      const userItem = screen.getByText('John Doe');
      fireEvent.click(userItem);
    });

    expect(screen.getByText('User Profile')).toBeInTheDocument();
  });
});

describe('UserProfile Component', () => {
  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    createdAt: '2023-01-01'
  };

  test('should display user information', () => {
    render(<UserProfile user={mockUser} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
  });

  test('should enter edit mode when edit button clicked', () => {
    render(<UserProfile user={mockUser} />);

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
  });
});

describe('LoginForm Component', () => {
  const mockOnLogin = jest.fn();

  beforeEach(() => {
    fetch.mockClear();
    mockOnLogin.mockClear();
  });

  test('should render login form', () => {
    render(<LoginForm onLogin={mockOnLogin} />);

    expect(screen.getByLabelText('Email:')).toBeInTheDocument();
    expect(screen.getByLabelText('Password:')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  test('should handle successful login', async () => {
    const mockResponse = {
      token: 'mock-token',
      user: { id: 1, name: 'John Doe' }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    render(<LoginForm onLogin={mockOnLogin} />);

    fireEvent.change(screen.getByLabelText('Email:'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password:'), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith(mockResponse.user);
    });
  });

  test('should display error on failed login', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid credentials' })
    });

    render(<LoginForm onLogin={mockOnLogin} />);

    fireEvent.change(screen.getByLabelText('Email:'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password:'), {
      target: { value: 'wrongpassword' }
    });
    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
`;
      
      content['tests/integration.test.js'] = `// Integration tests
const request = require('supertest');
const app = require('../src/server');

describe('Integration Tests', () => {
  describe('User Management Flow', () => {
    test('should complete full user lifecycle', async () => {
      // Create user
      const createResponse = await request(app)
        .post('/api/users')
        .send({
          name: 'Integration Test User',
          email: 'integration@example.com',
          role: 'user'
        });

      expect(createResponse.status).toBe(201);
      const userId = createResponse.body.id;

      // Get user
      const getResponse = await request(app)
        .get(\`/api/users/\${userId}\`)
        .set('Authorization', 'Bearer valid-token');

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.name).toBe('Integration Test User');

      // Update user
      const updateResponse = await request(app)
        .put(\`/api/users/\${userId}\`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'Updated Integration User'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.name).toBe('Updated Integration User');

      // Delete user
      const deleteResponse = await request(app)
        .delete(\`/api/users/\${userId}\`)
        .set('Authorization', 'Bearer valid-token');

      expect(deleteResponse.status).toBe(204);

      // Verify deletion
      const verifyResponse = await request(app)
        .get(\`/api/users/\${userId}\`)
        .set('Authorization', 'Bearer valid-token');

      expect(verifyResponse.status).toBe(404);
    });
  });

  describe('API Error Handling', () => {
    test('should handle malformed requests gracefully', async () => {
      const response = await request(app)
        .post('/api/users')
        .send('invalid-json');

      expect(response.status).toBe(400);
    });

    test('should handle missing routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('Performance Tests', () => {
    test('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/users')
          .send({
            name: \`Concurrent User \${i}\`,
            email: \`user\${i}@example.com\`
          })
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
    });
  });
});
`;
    }
    
    return content;
  }

  /**
   * Generate improvement content for additional commits
   */
  generateImprovementContent(agentId) {
    const improvements = {};
    
    if (agentId === 'backend-engineer') {
      improvements['src/middleware/validation.js'] = `
// Input validation middleware
const joi = require('joi');

const userSchema = joi.object({
  name: joi.string().min(2).max(50).required(),
  email: joi.string().email().required(),
  role: joi.string().valid('user', 'admin').default('user')
});

exports.validateUser = (req, res, next) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};
`;
    }
    
    if (agentId === 'frontend-developer') {
      improvements['src/hooks/useUsers.js'] = `
// Custom hook for user management
import { useState, useEffect } from 'react';

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const userData = await response.json();
      setUsers(userData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, error, refetch: fetchUsers };
}
`;
    }
    
    if (agentId === 'test-specialist') {
      improvements['tests/performance.test.js'] = `
// Performance and load tests
const request = require('supertest');
const app = require('../src/server');

describe('Performance Tests', () => {
  test('should respond within acceptable time limits', async () => {
    const start = Date.now();
    
    const response = await request(app).get('/');
    
    const duration = Date.now() - start;
    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(100); // Should respond within 100ms
  });

  test('should handle load without memory leaks', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Simulate load
    const requests = Array.from({ length: 100 }, () =>
      request(app).get('/')
    );
    
    await Promise.all(requests);
    
    // Force garbage collection if available
    if (global.gc) global.gc();
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});
`;
    }
    
    return improvements;
  }

  /**
   * Phase 4: Integrate and merge all agent work
   */
  async integrateAndMerge() {
    const phaseStart = Date.now();
    logger.info('🔀 Phase 4: Integrating and merging agent work');
    
    try {
      const mergeResults = [];
      
      // Merge agents one by one to avoid conflicts
      for (const agentId of this.config.agents) {
        const agentResult = this.results.agents[agentId];
        if (!agentResult || agentResult.assignment.status !== 'success') {
          continue;
        }
        
        const mergeStart = Date.now();
        
        try {
          const mergeResult = await this.collaboration.requestMerge(agentId);
          
          agentResult.merge = {
            status: 'success',
            result: mergeResult,
            duration: Date.now() - mergeStart
          };
          
          mergeResults.push({ agentId, success: true, result: mergeResult });
          
          logger.info(`🏁 Agent ${agentId} work merged successfully`);
          
        } catch (error) {
          agentResult.merge = {
            status: 'failed',
            error: error.message,
            duration: Date.now() - mergeStart
          };
          
          logger.error(`🔴 Failed to merge agent ${agentId} work:`, error);
          
          // Continue with other agents even if one fails
          mergeResults.push({ agentId, success: false, error: error.message });
        }
      }
      
      this.results.phases.integration = {
        duration: Date.now() - phaseStart,
        status: 'success',
        merged: mergeResults.filter(r => r.success).length,
        failed: mergeResults.filter(r => !r.success).length,
        results: mergeResults
      };
      
      logger.info(`🏁 Integration complete (${this.results.phases.integration.duration}ms)`);
      
    } catch (error) {
      this.results.phases.integration = {
        duration: Date.now() - phaseStart,
        status: 'failed',
        error: error.message
      };
      throw error;
    }
  }

  /**
   * Phase 5: Validate results and check success criteria
   */
  async validateResults() {
    const phaseStart = Date.now();
    logger.info('🏁 Phase 5: Validating results');
    
    try {
      const validation = {
        criteria: {
          setupTime: { threshold: 30000, actual: this.results.phases.setup.duration },
          parallelAgents: { threshold: 3, actual: this.config.agents.length },
          successfulAssignments: { threshold: 3, actual: 0 },
          successfulMerges: { threshold: 3, actual: 0 },
          zeroConflicts: { threshold: 0, actual: 0 }
        },
        passed: [],
        failed: []
      };
      
      // Count successful assignments and merges
      for (const agentResult of Object.values(this.results.agents)) {
        if (agentResult.assignment?.status === 'success') {
          validation.criteria.successfulAssignments.actual++;
        }
        if (agentResult.merge?.status === 'success') {
          validation.criteria.successfulMerges.actual++;
        }
      }
      
      // Get collaboration metrics for conflict count
      const collaborationStatus = this.collaboration.getStatus();
      if (collaborationStatus.enhancedMetrics) {
        validation.criteria.zeroConflicts.actual = 
          collaborationStatus.enhancedMetrics.conflictsResolved || 0;
      }
      
      // Check each criterion
      for (const [criterion, data] of Object.entries(validation.criteria)) {
        const passed = criterion === 'zeroConflicts' ? 
          data.actual <= data.threshold :
          data.actual >= data.threshold;
        
        if (passed) {
          validation.passed.push(criterion);
        } else {
          validation.failed.push(criterion);
        }
      }
      
      this.results.phases.validation = {
        duration: Date.now() - phaseStart,
        status: validation.failed.length === 0 ? 'success' : 'partial',
        validation
      };
      
      logger.info(`🏁 Validation complete: ${validation.passed.length}/${Object.keys(validation.criteria).length} criteria passed`);
      
    } catch (error) {
      this.results.phases.validation = {
        duration: Date.now() - phaseStart,
        status: 'failed',
        error: error.message
      };
      throw error;
    }
  }

  /**
   * Generate comprehensive demo report
   */
  async generateDemoReport() {
    const reportPath = path.join(process.cwd(), 'parallel-development-demo-report.json');
    
    const report = {
      demoInfo: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - this.startTime,
        configuration: this.config,
        success: this.results.success
      },
      phases: this.results.phases,
      agents: this.results.agents,
      collaboration: this.collaboration ? this.collaboration.getStatus() : null,
      summary: {
        totalAgents: this.config.agents.length,
        successfulAssignments: Object.values(this.results.agents)
          .filter(a => a.assignment?.status === 'success').length,
        successfulMerges: Object.values(this.results.agents)
          .filter(a => a.merge?.status === 'success').length,
        averageSetupTime: this.calculateAverageSetupTime(),
        criteriaValidation: this.results.phases.validation?.validation || {}
      }
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    logger.info('📊 Demo report generated:', reportPath);
    
    // Also log a summary to console
    this.logDemoSummary(report);
    
    return report;
  }

  /**
   * Calculate average setup time across all agents
   */
  calculateAverageSetupTime() {
    const setupTimes = Object.values(this.results.agents)
      .map(a => a.assignment?.duration)
      .filter(d => d !== undefined);
    
    return setupTimes.length > 0 ? 
      setupTimes.reduce((sum, time) => sum + time, 0) / setupTimes.length : 0;
  }

  /**
   * Log demo summary to console
   */
  logDemoSummary(report) {
    console.log('\n🏁 PARALLEL DEVELOPMENT DEMO RESULTS');
    console.log('=====================================');
    console.log(`📊 Overall Success: ${report.demoInfo.success ? '🏁 YES' : '🔴 NO'}`);
    console.log(`⏱️  Total Duration: ${(report.demoInfo.duration / 1000).toFixed(2)}s`);
    console.log(`👥 Agents: ${report.summary.totalAgents}`);
    console.log(`🏁 Successful Assignments: ${report.summary.successfulAssignments}/${report.summary.totalAgents}`);
    console.log(`🔀 Successful Merges: ${report.summary.successfulMerges}/${report.summary.totalAgents}`);
    console.log(`📈 Average Setup Time: ${(report.summary.averageSetupTime / 1000).toFixed(2)}s`);
    
    if (report.summary.criteriaValidation.passed) {
      console.log(`🟡 Criteria Passed: ${report.summary.criteriaValidation.passed.length}/${Object.keys(report.summary.criteriaValidation.criteria || {}).length}`);
    }
    
    console.log('\n📋 PHASE BREAKDOWN');
    console.log('==================');
    for (const [phase, data] of Object.entries(report.phases)) {
      const status = data.status === 'success' ? '🏁' : '🔴';
      const duration = (data.duration / 1000).toFixed(2);
      console.log(`${status} ${phase}: ${duration}s`);
    }
    
    console.log('\n👥 AGENT BREAKDOWN');
    console.log('==================');
    for (const [agentId, data] of Object.entries(report.agents)) {
      const assignStatus = data.assignment?.status === 'success' ? '🏁' : '🔴';
      const mergeStatus = data.merge?.status === 'success' ? '🏁' : data.merge?.status ? '🔴' : '⏸️';
      console.log(`${assignStatus}${mergeStatus} ${agentId}`);
      if (data.assignment?.mode) {
        console.log(`   Mode: ${data.assignment.mode}`);
      }
      if (data.assignment?.duration) {
        console.log(`   Setup: ${(data.assignment.duration / 1000).toFixed(2)}s`);
      }
    }
    
    console.log('\n');
  }

  /**
   * Clean up demo environment
   */
  async cleanup() {
    logger.info('🧹 Cleaning up demo environment');
    
    try {
      if (this.collaboration) {
        await this.collaboration.emergencyCleanup();
      }
      
      await this.safeRemove(this.config.demoRepo);
      await this.safeRemove(this.config.worktreesPath);
      
      logger.info('🏁 Demo cleanup complete');
      
    } catch (error) {
      logger.warn('🟠️ Cleanup warning:', error.message);
      // Don't throw - cleanup should be best effort
    }
  }

  /**
   * Safely remove directory
   */
  async safeRemove(dirPath) {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors - directory might not exist
    }
  }

  /**
   * Sleep utility for simulating work
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI interface
if (require.main === module) {
  const demo = new ParallelDevelopmentDemo();
  
  demo.runDemo()
    .then(results => {
      console.log('\n🏁 Demo completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n🔴 Demo failed:', error.message);
      process.exit(1);
    });
}

module.exports = { ParallelDevelopmentDemo };