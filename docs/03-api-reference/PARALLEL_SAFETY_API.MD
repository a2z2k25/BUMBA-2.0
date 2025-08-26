# 🟢 BUMBA Parallel Safety API Reference

## Overview

The BUMBA Parallel Safety API provides comprehensive coordination and safety mechanisms for parallel agent execution. This API ensures data integrity, prevents conflicts, and enables safe concurrent operations across all framework components.

## Table of Contents

- [File Locking System API](#file-locking-system-api)
- [Territory Management API](#territory-management-api)
- [Safe File Operations API](#safe-file-operations-api)
- [Agent Identity System API](#agent-identity-system-api)
- [Coordination Dashboard API](#coordination-dashboard-api)
- [Integration Patterns](#integration-patterns)
- [Error Handling](#error-handling)
- [Performance Considerations](#performance-considerations)

---

## File Locking System API

### `getInstance()`

Gets the singleton File Locking System instance.

```javascript
const { getInstance: getFileLocking } = require('./src/core/coordination/file-locking-system');
const fileLocking = getFileLocking();
```

### `acquireLock(filepath, agentId, options?)`

Acquires an exclusive lock on a file.

**Parameters:**
- `filepath` (string): Normalized file path to lock
- `agentId` (string): Unique identifier of the requesting agent
- `options` (object, optional):
  - `wait` (boolean): Whether to wait for lock if unavailable (default: true)
  - `timeout` (number): Maximum wait time in milliseconds (default: 30000)
  - `priority` (number): Lock priority (1-10, higher = more priority) (default: 5)

**Returns:** `Promise<string|null>`
- Success: Lock token (string)
- Failure: null

**Example:**
```javascript
const lockToken = await fileLocking.acquireLock('src/api.js', agentId, {
  timeout: 10000,
  priority: 8
});

if (lockToken) {
  // File is locked - safe to modify
  console.log('Lock acquired:', lockToken);
} else {
  // Could not acquire lock
  console.log('Lock acquisition failed');
}
```

### `releaseLock(filepath, lockToken)`

Releases a previously acquired lock.

**Parameters:**
- `filepath` (string): File path to unlock
- `lockToken` (string): Token received from acquireLock

**Returns:** `Promise<boolean>`
- Success: true
- Failure: false

**Example:**
```javascript
const released = await fileLocking.releaseLock('src/api.js', lockToken);
if (released) {
  console.log('Lock released successfully');
}
```

### `waitForLock(filepath, agentId, timeout?, priority?)`

Waits for a lock to become available with queue management.

**Parameters:**
- `filepath` (string): File path to lock
- `agentId` (string): Requesting agent identifier
- `timeout` (number): Maximum wait time (default: 30000ms)
- `priority` (number): Queue priority (default: 5)

**Returns:** `Promise<string|null>`

**Example:**
```javascript
const lockToken = await fileLocking.waitForLock('src/shared.js', agentId, 5000, 7);
```

### `getActiveLocks()`

Gets list of all currently active locks.

**Returns:** `Array<LockInfo>`

```typescript
interface LockInfo {
  filepath: string;
  agentId: string;
  token: string;
  acquired: Date;
  priority: number;
  expiresAt: Date;
}
```

**Example:**
```javascript
const activeLocks = fileLocking.getActiveLocks();
console.log(`${activeLocks.length} files currently locked`);
```

### `getStats()`

Gets comprehensive locking statistics.

**Returns:** `LockingStats`

```typescript
interface LockingStats {
  locksAcquired: number;
  locksReleased: number;
  conflicts: number;
  timeouts: number;
  waitingAgents: number;
  averageLockDuration: number;
}
```

**Example:**
```javascript
const stats = fileLocking.getStats();
console.log(`Conflict rate: ${(stats.conflicts/stats.locksAcquired*100).toFixed(2)}%`);
```

---

## Territory Management API

### `getInstance()`

Gets the singleton Territory Management instance.

```javascript
const { getInstance: getTerritoryManager } = require('./src/core/coordination/territory-manager');
const territoryManager = getTerritoryManager();
```

### `allocateTerritory(agentId, task, options?)`

Allocates exclusive territory for an agent to work on specific files.

**Parameters:**
- `agentId` (string): Unique identifier of the requesting agent
- `task` (object): Task definition containing files to allocate
  - `title` (string): Human-readable task title
  - `files` (Array<string>): List of file paths to include in territory
- `options` (object, optional):
  - `type` (string): Territory type - 'EXCLUSIVE', 'SHARED', 'MONITORED' (default: 'EXCLUSIVE')
  - `timeout` (number): Allocation timeout in milliseconds (default: 60000)

**Returns:** `Promise<TerritoryResult>`

```typescript
interface TerritoryResult {
  success: boolean;
  territoryId?: string;
  conflicts?: Array<string>;
  message?: string;
}
```

**Example:**
```javascript
const territory = await territoryManager.allocateTerritory(agentId, {
  title: 'Authentication System',
  files: ['src/auth.js', 'src/login.js', 'tests/auth.test.js']
}, {
  type: 'EXCLUSIVE'
});

if (territory.success) {
  console.log(`Territory allocated: ${territory.territoryId}`);
} else {
  console.log(`Conflicts detected: ${territory.conflicts.join(', ')}`);
}
```

### `releaseTerritory(agentId)`

Releases all territories currently allocated to an agent.

**Parameters:**
- `agentId` (string): Agent identifier

**Returns:** `Promise<boolean>`

**Example:**
```javascript
const released = await territoryManager.releaseTerritory(agentId);
if (released) {
  console.log('Territory released successfully');
}
```

### `canAccess(agentId, filepath, accessType)`

Checks if an agent can access a specific file.

**Parameters:**
- `agentId` (string): Agent identifier
- `filepath` (string): File path to check
- `accessType` (string): 'read' or 'write'

**Returns:** `boolean`

**Example:**
```javascript
const canWrite = territoryManager.canAccess(agentId, 'src/api.js', 'write');
if (!canWrite) {
  console.log('Agent does not have write access to this file');
}
```

### `getTerritoryMap()`

Gets comprehensive territory allocation information.

**Returns:** `TerritoryMap`

```typescript
interface TerritoryMap {
  territories: Array<TerritoryInfo>;
  fileOwnership: Map<string, string>;
  statistics: {
    totalTerritories: number;
    totalFiles: number;
    exclusiveFiles: number;
    sharedFiles: number;
  };
}
```

**Example:**
```javascript
const territoryMap = territoryManager.getTerritoryMap();
console.log(`${territoryMap.statistics.totalTerritories} active territories`);
```

---

## Safe File Operations API

### `getInstance()`

Gets the singleton Safe File Operations instance.

```javascript
const { getInstance: getSafeFileOps } = require('./src/core/coordination/safe-file-operations');
const safeFileOps = getSafeFileOps();
```

### `safeWrite(filepath, content, agentId, options?)`

Performs atomic, safe file write with backup and verification.

**Parameters:**
- `filepath` (string): Target file path
- `content` (string): Content to write
- `agentId` (string): Agent performing the operation
- `options` (object, optional):
  - `atomic` (boolean): Ensure atomic operation (default: true)
  - `backup` (boolean): Create backup before write (default: true)
  - `verify` (boolean): Verify content after write (default: true)
  - `encoding` (string): File encoding (default: 'utf8')

**Returns:** `Promise<SafeOperationResult>`

```typescript
interface SafeOperationResult {
  success: boolean;
  filepath: string;
  backupPath?: string;
  bytesWritten?: number;
  error?: string;
  checksum?: string;
}
```

**Example:**
```javascript
const result = await safeFileOps.safeWrite(
  './src/config.js',
  configContent,
  agentId,
  {
    atomic: true,
    backup: true,
    verify: true
  }
);

if (result.success) {
  console.log(`File written: ${result.bytesWritten} bytes`);
  console.log(`Backup created: ${result.backupPath}`);
} else {
  console.error(`Write failed: ${result.error}`);
}
```

### `safeRead(filepath, agentId, options?)`

Performs territory-aware safe file read with access logging.

**Parameters:**
- `filepath` (string): File path to read
- `agentId` (string): Agent performing the operation
- `options` (object, optional):
  - `encoding` (string): File encoding (default: 'utf8')
  - `logAccess` (boolean): Log access attempt (default: true)

**Returns:** `Promise<SafeReadResult>`

```typescript
interface SafeReadResult {
  success: boolean;
  content?: string;
  filepath: string;
  size?: number;
  error?: string;
}
```

**Example:**
```javascript
const result = await safeFileOps.safeRead('./src/config.js', agentId);
if (result.success) {
  console.log(`Read ${result.size} bytes from ${result.filepath}`);
}
```

### `safeDelete(filepath, agentId, options?)`

Performs coordinated file deletion with backup.

**Parameters:**
- `filepath` (string): File to delete
- `agentId` (string): Agent performing deletion
- `options` (object, optional):
  - `backup` (boolean): Create backup before deletion (default: true)
  - `force` (boolean): Force deletion even with conflicts (default: false)

**Returns:** `Promise<SafeOperationResult>`

**Example:**
```javascript
const result = await safeFileOps.safeDelete('./temp/cache.json', agentId, {
  backup: true
});
```

### `safeMove(sourcePath, targetPath, agentId, options?)`

Performs coordinated file move operation.

**Parameters:**
- `sourcePath` (string): Source file path
- `targetPath` (string): Target file path
- `agentId` (string): Agent performing the move
- `options` (object, optional):
  - `overwrite` (boolean): Allow overwriting target (default: false)
  - `backup` (boolean): Create backup if overwriting (default: true)

**Returns:** `Promise<SafeOperationResult>`

**Example:**
```javascript
const result = await safeFileOps.safeMove(
  './src/old-api.js',
  './src/api.js',
  agentId,
  { overwrite: false }
);
```

### `beginTransaction(agentId, description?)`

Begins a multi-file transaction for atomic operations.

**Parameters:**
- `agentId` (string): Agent starting the transaction
- `description` (string, optional): Transaction description

**Returns:** `Promise<string>` - Transaction ID

**Example:**
```javascript
const transactionId = await safeFileOps.beginTransaction(agentId, 'Update API');

try {
  await safeFileOps.safeWrite('./src/api.js', apiContent, agentId, { transactionId });
  await safeFileOps.safeWrite('./tests/api.test.js', testContent, agentId, { transactionId });
  
  await safeFileOps.commitTransaction(transactionId);
} catch (error) {
  await safeFileOps.rollbackTransaction(transactionId);
}
```

### `getStats()`

Gets safe operations statistics.

**Returns:** `SafeOpsStats`

```typescript
interface SafeOpsStats {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  activeTransactions: number;
  backupsCreated: number;
  rolledBackOperations: number;
}
```

---

## Agent Identity System API

### `getInstance()`

Gets the singleton Agent Identity System instance.

```javascript
const { getInstance: getAgentIdentity } = require('./src/core/coordination/agent-identity');
const agentIdentity = getAgentIdentity();
```

### `registerAgent(component, metadata?)`

Registers a new agent with unique identity and metadata.

**Parameters:**
- `component` (object): The component instance to register
- `metadata` (object, optional):
  - `type` (string): Agent type (default: component.constructor.name)
  - `name` (string): Agent name (default: component.name)
  - `department` (string): Department assignment
  - `capabilities` (Array<string>): Agent capabilities
  - `priority` (number): Agent priority (1-10)
  - `temporary` (boolean): Is this a temporary agent? (default: false)

**Returns:** `string` - Unique agent ID

**Example:**
```javascript
const agentId = agentIdentity.registerAgent(myAgent, {
  type: 'BackendEngineer',
  name: 'ApiSpecialist',
  department: 'technical',
  capabilities: ['api-development', 'security', 'database-design'],
  priority: 8
});

console.log(`Agent registered: ${agentId}`);
```

### `updateAgentStatus(agentId, status)`

Updates an agent's operational status.

**Parameters:**
- `agentId` (string): Agent identifier
- `status` (string): New status - 'active', 'busy', 'idle', 'error', 'inactive'

**Returns:** `void`

**Example:**
```javascript
agentIdentity.updateAgentStatus(agentId, 'busy');
```

### `getAgentMetadata(agentId)`

Gets complete metadata for an agent.

**Parameters:**
- `agentId` (string): Agent identifier

**Returns:** `AgentMetadata|null`

```typescript
interface AgentMetadata {
  id: string;
  type: string;
  name: string;
  component: string;
  registeredAt: number;
  capabilities: Array<string>;
  department: string|null;
  priority: number;
  status: string;
  lastUpdate?: number;
}
```

**Example:**
```javascript
const metadata = agentIdentity.getAgentMetadata(agentId);
if (metadata) {
  console.log(`Agent: ${metadata.type}:${metadata.name} (${metadata.status})`);
}
```

### `getActiveAgents()`

Gets list of all currently active agents.

**Returns:** `Array<AgentInfo>`

**Example:**
```javascript
const activeAgents = agentIdentity.getActiveAgents();
console.log(`${activeAgents.length} agents currently active`);

activeAgents.forEach(agent => {
  console.log(`- ${agent.type}: ${agent.name} (${agent.department})`);
});
```

### `getAgentsByDepartment(department)`

Gets agents filtered by department.

**Parameters:**
- `department` (string): Department name

**Returns:** `Array<AgentInfo>`

**Example:**
```javascript
const techAgents = agentIdentity.getAgentsByDepartment('technical');
console.log(`${techAgents.length} technical agents`);
```

### `getAgentsByCapability(capability)`

Gets agents filtered by capability.

**Parameters:**
- `capability` (string): Required capability

**Returns:** `Array<AgentInfo>`

**Example:**
```javascript
const apiAgents = agentIdentity.getAgentsByCapability('api-development');
```

### `deregisterAgent(agentId)`

Removes an agent from the system.

**Parameters:**
- `agentId` (string): Agent to deregister

**Returns:** `boolean`

**Example:**
```javascript
const removed = agentIdentity.deregisterAgent(agentId);
if (removed) {
  console.log('Agent deregistered successfully');
}
```

### `getStats()`

Gets comprehensive identity system statistics.

**Returns:** `IdentityStats`

```typescript
interface IdentityStats {
  totalAgents: number;
  activeAgents: number;
  inactiveAgents: number;
  byDepartment: Record<string, number>;
  byType: Record<string, number>;
}
```

---

## Coordination Dashboard API

### `getInstance()`

Gets the singleton Coordination Dashboard instance.

```javascript
const { getInstance: getDashboard } = require('./src/core/coordination/coordination-dashboard');
const dashboard = getDashboard();
```

### `getStatus()`

Gets comprehensive real-time status of all coordination systems.

**Returns:** `Promise<CoordinationStatus>`

```typescript
interface CoordinationStatus {
  timestamp: string;
  agents: AgentStatus;
  locks: LockStatus;
  territories: TerritoryStatus;
  conflicts: ConflictStatus;
  performance: PerformanceMetrics;
}
```

**Example:**
```javascript
const status = await dashboard.getStatus();
console.log(`Active agents: ${status.agents.active}`);
console.log(`Active locks: ${status.locks.activeLocks}`);
console.log(`Conflict rate: ${status.conflicts.conflictRate}`);
```

### `getSafetyReport()`

Generates comprehensive safety assessment.

**Returns:** `Promise<SafetyReport>`

```typescript
interface SafetyReport {
  safe: boolean;
  issues: Array<string>;
  recommendations: Array<string>;
  score: number; // 0-100
  timestamp: string;
}
```

**Example:**
```javascript
const report = await dashboard.getSafetyReport();

if (!report.safe) {
  console.warn('Safety issues detected:');
  report.issues.forEach(issue => console.log(`- ${issue}`));
  
  console.log('Recommendations:');
  report.recommendations.forEach(rec => console.log(`- ${rec}`));
} else {
  console.log(`System is safe (score: ${report.score}/100)`);
}
```

### `display()`

Displays formatted dashboard in console.

**Returns:** `Promise<void>`

**Example:**
```javascript
await dashboard.display();
```

**Sample Output:**
```
============================================================
🟢️  BUMBA COORDINATION DASHBOARD
============================================================

🟢 AGENTS
  Active: 5/8
  By Department:
    technical: 3
    design: 1
    strategic: 1

🟢 FILE LOCKS
  Active Locks: 12
  Total Operations: 1,247
  Conflicts: 3
  Waiting: 0

🟢️  TERRITORIES
  Active: 5
  Files Owned: 23
  Exclusive: 18
  Shared: 5

🟡  CONFLICTS
  Total: 3
  Current: 0
  Rate: 0.24%

🟢 PERFORMANCE
  Parallel Agents: 5
  Utilization: 78.5%
  Avg Lock Time: 1.2s
```

### `startAutoRefresh(intervalMs?)`

Starts automatic dashboard refresh.

**Parameters:**
- `intervalMs` (number): Refresh interval in milliseconds (default: 5000)

**Example:**
```javascript
dashboard.startAutoRefresh(3000); // Refresh every 3 seconds
```

### `stopAutoRefresh()`

Stops automatic dashboard refresh.

**Example:**
```javascript
dashboard.stopAutoRefresh();
```

---

## Integration Patterns

### Framework Integration

All BUMBA components automatically integrate with the parallel safety systems:

```javascript
// In BumbaFramework2 constructor
class BumbaFramework2 {
  constructor() {
    // Initialize coordination systems
    this.fileLocking = getFileLocking();
    this.territoryManager = getTerritoryManager();
    this.safeFileOps = getSafeFileOps();
    this.agentIdentity = getAgentIdentity();
    this.coordinationDashboard = getDashboard();
    
    // Connect to all departments
    for (const [name, dept] of this.departments) {
      dept.safeFileOps = this.safeFileOps;
      dept.territoryManager = this.territoryManager;
      dept.fileLocking = this.fileLocking;
      dept.agentId = `${name}-manager-${Date.now()}`;
    }
  }
}
```

### Department Integration Pattern

```javascript
class DepartmentManager {
  async executeSprintWithTracking(sprint) {
    // 1. Allocate territory for sprint files
    const territory = await this.territoryManager.allocateTerritory(
      this.agentId,
      {
        title: sprint.title,
        files: sprint.deliverables || []
      }
    );
    
    if (!territory.success) {
      return { status: 'blocked', conflicts: territory.conflicts };
    }
    
    try {
      // 2. Execute sprint with safety guarantees
      const result = await this.executeSprint(sprint);
      
      // 3. Use safe file operations for all outputs
      for (const file of result.deliverables || []) {
        await this.safeFileOps.safeWrite(
          file.path,
          file.content,
          this.agentId
        );
      }
      
      return result;
    } finally {
      // 4. Always release territory
      await this.territoryManager.releaseTerritory(this.agentId);
    }
  }
}
```

### Command Handler Integration

```javascript
async handleCommand(command, args, context) {
  // Create unique agent context for command
  const commandAgentId = this.agentIdentity.generateAgentId('Command', command);
  context.agentId = commandAgentId;
  
  // Register temporary agent for tracking
  this.agentIdentity.registerAgent({ command }, {
    type: 'CommandExecution',
    name: command,
    temporary: true
  });
  
  try {
    return await this.executeCommandSafely(command, args, context);
  } finally {
    // Cleanup temporary agent
    this.agentIdentity.deregisterAgent(commandAgentId);
  }
}
```

---

## Error Handling

### Common Error Types

```typescript
class ParallelSafetyError extends Error {
  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'ParallelSafetyError';
    this.code = code;
    this.details = details;
  }
}

// Error codes:
// 'LOCK_TIMEOUT' - Lock acquisition timed out
// 'TERRITORY_CONFLICT' - Territory allocation conflict
// 'ACCESS_DENIED' - Agent lacks required access
// 'FILE_CORRUPTION' - File integrity check failed
// 'AGENT_NOT_FOUND' - Agent ID not registered
// 'OPERATION_FAILED' - Generic operation failure
```

### Error Handling Patterns

```javascript
// Lock acquisition with error handling
try {
  const lockToken = await fileLocking.acquireLock('file.js', agentId, {
    timeout: 10000
  });
  
  if (!lockToken) {
    throw new ParallelSafetyError(
      'Could not acquire file lock',
      'LOCK_TIMEOUT',
      { filepath: 'file.js', agentId }
    );
  }
  
  // Perform file operations
} catch (error) {
  if (error.code === 'LOCK_TIMEOUT') {
    // Handle timeout - maybe retry or delegate
    console.log('Lock timeout - retrying with lower priority');
    return await retryWithLowerPriority();
  }
  throw error;
}

// Territory allocation with graceful degradation
try {
  const territory = await territoryManager.allocateTerritory(agentId, task);
  
  if (!territory.success) {
    // Handle conflicts gracefully
    console.log(`Conflicts: ${territory.conflicts.join(', ')}`);
    return await handleConflicts(territory.conflicts);
  }
} catch (error) {
  console.error('Territory allocation failed:', error);
  // Fall back to single-file operations
  return await fallbackToSingleFileMode();
}

// Safe file operations with rollback
const transactionId = await safeFileOps.beginTransaction(agentId);

try {
  await safeFileOps.safeWrite('file1.js', content1, agentId, { transactionId });
  await safeFileOps.safeWrite('file2.js', content2, agentId, { transactionId });
  
  await safeFileOps.commitTransaction(transactionId);
} catch (error) {
  await safeFileOps.rollbackTransaction(transactionId);
  console.error('Transaction failed and rolled back:', error);
}
```

---

## Performance Considerations

### Benchmarks

**File Locking Performance**:
- Lock acquisition: 0.1-0.3ms average
- Lock release: 0.05-0.15ms average  
- Throughput: 1000+ locks/second
- Memory: <1MB per 1000 active locks

**Territory Management Performance**:
- Allocation: 1-3ms average
- Conflict detection: <1ms
- Memory: <500KB per territory

**Safe File Operations Performance**:
- Safe write (with backup): 2-8ms
- Safe read: 0.5-2ms
- Verification overhead: <1ms

### Optimization Tips

1. **Minimize Lock Duration**:
   ```javascript
   // 🏁 Good - minimal lock time
   const lock = await fileLocking.acquireLock(file, agentId);
   const content = generateContent(); // Do work before lock
   await safeFileOps.safeWrite(file, content, agentId);
   await fileLocking.releaseLock(file, lock);
   
   // 🔴 Bad - long lock duration
   const lock = await fileLocking.acquireLock(file, agentId);
   const content = await longRunningOperation(); // Work during lock
   await safeFileOps.safeWrite(file, content, agentId);
   await fileLocking.releaseLock(file, lock);
   ```

2. **Request Minimal Territories**:
   ```javascript
   // 🏁 Good - specific files only
   await territoryManager.allocateTerritory(agentId, {
     files: ['src/auth.js', 'tests/auth.test.js']
   });
   
   // 🔴 Bad - overly broad territory
   await territoryManager.allocateTerritory(agentId, {
     files: ['src/**/*'] // Too broad!
   });
   ```

3. **Use Transactions for Related Operations**:
   ```javascript
   // 🏁 Good - atomic multi-file operation
   const txId = await safeFileOps.beginTransaction(agentId);
   await safeFileOps.safeWrite('api.js', apiCode, agentId, { transactionId: txId });
   await safeFileOps.safeWrite('api.test.js', testCode, agentId, { transactionId: txId });
   await safeFileOps.commitTransaction(txId);
   ```

4. **Monitor Performance Regularly**:
   ```javascript
   // Check system performance
   const dashboard = getDashboard();
   const status = await dashboard.getStatus();
   
   if (parseFloat(status.conflicts.conflictRate) > 10) {
     console.warn('High conflict rate detected - review workload distribution');
   }
   ```

### Monitoring and Alerting

Set up monitoring for key metrics:

```javascript
// Monitor coordination system health
setInterval(async () => {
  const dashboard = getDashboard();
  const safety = await dashboard.getSafetyReport();
  
  if (!safety.safe) {
    // Alert on safety issues
    console.error('ALERT: Safety issues detected', safety.issues);
    
    // Optionally trigger notifications
    await notificationSystem.alert({
      level: 'error',
      message: 'Parallel safety issues detected',
      details: safety.issues
    });
  }
}, 30000); // Check every 30 seconds
```

---

This comprehensive API reference provides all the tools needed to build safe, parallel agent systems with BUMBA. The APIs are designed to be both powerful and easy to use, with comprehensive error handling and performance optimization built in.