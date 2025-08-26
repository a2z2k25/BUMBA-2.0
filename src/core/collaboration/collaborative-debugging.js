/**
 * BUMBA Collaborative Debugging System
 * Advanced debugging and pair programming capabilities with consciousness integration
 */

const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');

class CollaborativeDebuggingSystem extends EventEmitter {
  constructor() {
    super();
    this.activeSessions = new Map();
    this.debuggingTools = new Map();
    this.pairProgrammingSessions = new Map();
    this.breakpointManager = new BreakpointManager();
    this.codeInspector = new CollaborativeCodeInspector();
    this.debugConsole = new SharedDebugConsole();
    
    this.initializeDebuggingTools();
  }

  initializeDebuggingTools() {
    this.debuggingTools.set('breakpoint_manager', this.breakpointManager);
    this.debuggingTools.set('code_inspector', this.codeInspector);
    this.debuggingTools.set('debug_console', this.debugConsole);
    this.debuggingTools.set('variable_watcher', new VariableWatcher());
    this.debuggingTools.set('call_stack_tracker', new CallStackTracker());
    this.debuggingTools.set('performance_profiler', new PerformanceProfiler());
  }

  async createSession(config) {
    const sessionId = this.generateSessionId();
    
    const debugSession = new CollaborativeDebugSession({
      id: sessionId,
      collaborationSessionId: config.sessionId,
      participants: config.participants,
      config: config.config,
      sharedState: config.sharedState,
      debuggingTools: this.debuggingTools
    });

    await debugSession.initialize();
    
    this.activeSessions.set(sessionId, debugSession);

    logger.info(`🟢 Created collaborative debug session: ${sessionId}`);
    
    this.emit('debug_session_created', { sessionId, debugSession });
    
    return debugSession;
  }

  async createPairSession(config) {
    const sessionId = this.generateSessionId();
    
    const pairSession = new PairProgrammingSession({
      id: sessionId,
      collaborationSessionId: config.sessionId,
      config: config.config,
      sharedState: config.sharedState,
      crdtResolver: config.crdtResolver,
      participants: config.config.participants
    });

    await pairSession.initialize();
    
    this.pairProgrammingSessions.set(sessionId, pairSession);

    logger.info(`🟢 Created pair programming session: ${sessionId}`);
    
    this.emit('pair_session_created', { sessionId, pairSession });
    
    return pairSession;
  }

  async joinDebugSession(sessionId, agentId, role = 'observer') {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Debug session ${sessionId} not found`);
    }

    await session.addParticipant(agentId, role);
    
    this.emit('debug_participant_joined', { sessionId, agentId, role });
    
    return session.getParticipantView(agentId);
  }

  async setBreakpoint(sessionId, agentId, breakpoint) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Debug session ${sessionId} not found`);
    }

    const result = await session.setBreakpoint(agentId, breakpoint);
    
    this.emit('breakpoint_set', { sessionId, agentId, breakpoint });
    
    return result;
  }

  async stepDebug(sessionId, agentId, stepType) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Debug session ${sessionId} not found`);
    }

    const result = await session.step(agentId, stepType);
    
    this.emit('debug_step', { sessionId, agentId, stepType, result });
    
    return result;
  }

  async inspectVariable(sessionId, agentId, variablePath) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Debug session ${sessionId} not found`);
    }

    const result = await session.inspectVariable(agentId, variablePath);
    
    this.emit('variable_inspected', { sessionId, agentId, variablePath, result });
    
    return result;
  }

  async shareDebugState(sessionId, fromAgentId, toAgentId = null) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Debug session ${sessionId} not found`);
    }

    const result = await session.shareState(fromAgentId, toAgentId);
    
    this.emit('debug_state_shared', { sessionId, fromAgentId, toAgentId });
    
    return result;
  }

  generateSessionId() {
    return `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

class CollaborativeDebugSession extends EventEmitter {
  constructor(config) {
    super();
    this.id = config.id;
    this.collaborationSessionId = config.collaborationSessionId;
    this.participants = new Map();
    this.config = config.config;
    this.sharedState = config.sharedState;
    this.debuggingTools = config.debuggingTools;
    
    this.debugState = {
      currentFile: null,
      currentLine: null,
      executionState: 'stopped',
      breakpoints: new Map(),
      watchedVariables: new Map(),
      callStack: [],
      sharedCursor: null
    };
    
    this.permissions = new Map();
    this.activityLog = [];
  }

  async initialize() {
    // Initialize shared debug state
    await this.sharedState.applyOperation(this.collaborationSessionId, {
      type: 'set',
      key: `debug_session_${this.id}`,
      value: {
        id: this.id,
        state: this.debugState,
        participants: [],
        createdAt: Date.now()
      },
      agent: 'system',
      timestamp: Date.now()
    });

    logger.info(`🟢 Debug session ${this.id} initialized`);
  }

  async addParticipant(agentId, role) {
    const participant = {
      agentId,
      role, // 'driver', 'navigator', 'observer'
      joinedAt: Date.now(),
      permissions: this.getPermissionsForRole(role),
      isActive: true,
      currentFocus: null
    };

    this.participants.set(agentId, participant);
    this.permissions.set(agentId, participant.permissions);

    // Update shared state
    await this.updateParticipantsList();

    this.emit('participant_added', { agentId, role });
    
    return participant;
  }

  getPermissionsForRole(role) {
    const permissions = {
      driver: {
        canSetBreakpoints: true,
        canStep: true,
        canModifyCode: true,
        canControlExecution: true,
        canWatchVariables: true
      },
      navigator: {
        canSetBreakpoints: true,
        canStep: false,
        canModifyCode: false,
        canControlExecution: false,
        canWatchVariables: true
      },
      observer: {
        canSetBreakpoints: false,
        canStep: false,
        canModifyCode: false,
        canControlExecution: false,
        canWatchVariables: true
      }
    };

    return permissions[role] || permissions.observer;
  }

  async setBreakpoint(agentId, breakpoint) {
    const permissions = this.permissions.get(agentId);
    if (!permissions?.canSetBreakpoints) {
      throw new Error('Insufficient permissions to set breakpoints');
    }

    const breakpointId = this.generateBreakpointId();
    const breakpointData = {
      id: breakpointId,
      ...breakpoint,
      setBy: agentId,
      setAt: Date.now(),
      isActive: true
    };

    this.debugState.breakpoints.set(breakpointId, breakpointData);

    // Update shared state
    await this.updateDebugState();

    // Notify other participants
    this.notifyParticipants('breakpoint_set', {
      breakpoint: breakpointData,
      setBy: agentId
    });

    this.logActivity(agentId, 'set_breakpoint', {
      file: breakpoint.file,
      line: breakpoint.line
    });

    return breakpointData;
  }

  async removeBreakpoint(agentId, breakpointId) {
    const permissions = this.permissions.get(agentId);
    const breakpoint = this.debugState.breakpoints.get(breakpointId);

    if (!permissions?.canSetBreakpoints || 
        (breakpoint?.setBy !== agentId && !this.isDriver(agentId))) {
      throw new Error('Insufficient permissions to remove breakpoint');
    }

    this.debugState.breakpoints.delete(breakpointId);

    await this.updateDebugState();

    this.notifyParticipants('breakpoint_removed', {
      breakpointId,
      removedBy: agentId
    });

    this.logActivity(agentId, 'remove_breakpoint', { breakpointId });

    return true;
  }

  async step(agentId, stepType) {
    const permissions = this.permissions.get(agentId);
    if (!permissions?.canStep && !permissions?.canControlExecution) {
      throw new Error('Insufficient permissions to control execution');
    }

    // Simulate debug stepping
    const stepResult = await this.executeDebugStep(stepType);
    
    this.debugState.currentLine = stepResult.newLine;
    this.debugState.currentFile = stepResult.newFile;
    this.debugState.callStack = stepResult.callStack;

    await this.updateDebugState();

    this.notifyParticipants('debug_step', {
      stepType,
      result: stepResult,
      executedBy: agentId
    });

    this.logActivity(agentId, 'debug_step', { stepType, line: stepResult.newLine });

    return stepResult;
  }

  async executeDebugStep(stepType) {
    // Simulate stepping through code
    const steps = {
      'step_over': { newLine: this.debugState.currentLine + 1, type: 'step_over' },
      'step_into': { newLine: this.debugState.currentLine + 1, type: 'step_into' },
      'step_out': { newLine: this.debugState.currentLine - 1, type: 'step_out' },
      'continue': { newLine: null, type: 'continue' }
    };

    const result = steps[stepType] || steps.step_over;
    
    return {
      ...result,
      newFile: this.debugState.currentFile,
      callStack: this.simulateCallStack(),
      variables: this.simulateVariableState(),
      timestamp: Date.now()
    };
  }

  async inspectVariable(agentId, variablePath) {
    const permissions = this.permissions.get(agentId);
    if (!permissions?.canWatchVariables) {
      throw new Error('Insufficient permissions to inspect variables');
    }

    const variableValue = await this.getVariableValue(variablePath);
    
    // Add to watched variables if not already watched
    if (!this.debugState.watchedVariables.has(variablePath)) {
      this.debugState.watchedVariables.set(variablePath, {
        path: variablePath,
        addedBy: agentId,
        addedAt: Date.now()
      });
    }

    await this.updateDebugState();

    this.notifyParticipants('variable_inspected', {
      variablePath,
      value: variableValue,
      inspectedBy: agentId
    });

    this.logActivity(agentId, 'inspect_variable', { variablePath });

    return variableValue;
  }

  async getVariableValue(variablePath) {
    // Simulate variable inspection
    const mockVariables = {
      'user.name': { type: 'string', value: 'John Doe' },
      'user.age': { type: 'number', value: 30 },
      'items': { type: 'array', value: ['item1', 'item2'], length: 2 },
      'config': { type: 'object', value: { debug: true, port: 8080 } }
    };

    return mockVariables[variablePath] || { type: 'undefined', value: undefined };
  }

  async shareState(fromAgentId, toAgentId = null) {
    const fromParticipant = this.participants.get(fromAgentId);
    if (!fromParticipant) {
      throw new Error('Source participant not found');
    }

    const stateSnapshot = {
      currentFile: this.debugState.currentFile,
      currentLine: this.debugState.currentLine,
      breakpoints: Array.from(this.debugState.breakpoints.values()),
      watchedVariables: Array.from(this.debugState.watchedVariables.keys()),
      callStack: this.debugState.callStack,
      sharedBy: fromAgentId,
      sharedAt: Date.now()
    };

    if (toAgentId) {
      // Share with specific participant
      this.notifyParticipant(toAgentId, 'debug_state_shared', stateSnapshot);
    } else {
      // Share with all participants
      this.notifyParticipants('debug_state_shared', stateSnapshot);
    }

    this.logActivity(fromAgentId, 'share_state', { toAgentId });

    return stateSnapshot;
  }

  async synchronizeCursor(agentId, cursorPosition) {
    this.debugState.sharedCursor = {
      agentId,
      position: cursorPosition,
      timestamp: Date.now()
    };

    await this.updateDebugState();

    this.notifyParticipants('cursor_moved', {
      agentId,
      position: cursorPosition
    }, agentId);
  }

  getParticipantView(agentId) {
    const participant = this.participants.get(agentId);
    if (!participant) {
      return null;
    }

    return {
      sessionId: this.id,
      role: participant.role,
      permissions: participant.permissions,
      debugState: this.debugState,
      participants: Array.from(this.participants.values()),
      activityLog: this.activityLog.slice(-50) // Last 50 activities
    };
  }

  simulateCallStack() {
    return [
      { function: 'main', file: 'app.js', line: 45 },
      { function: 'processUser', file: 'user.js', line: 23 },
      { function: 'validateInput', file: 'validation.js', line: 12 }
    ];
  }

  simulateVariableState() {
    return {
      local: {
        'username': { type: 'string', value: 'test_user' },
        'isValid': { type: 'boolean', value: true }
      },
      global: {
        'app': { type: 'object', value: { name: 'BUMBA', version: '1.0.0' } }
      }
    };
  }

  async updateDebugState() {
    await this.sharedState.applyOperation(this.collaborationSessionId, {
      type: 'update',
      key: `debug_session_${this.id}`,
      updates: { state: this.debugState },
      agent: 'system',
      timestamp: Date.now()
    });
  }

  async updateParticipantsList() {
    await this.sharedState.applyOperation(this.collaborationSessionId, {
      type: 'update',
      key: `debug_session_${this.id}`,
      updates: { participants: Array.from(this.participants.values()) },
      agent: 'system',
      timestamp: Date.now()
    });
  }

  notifyParticipants(eventType, data, excludeAgent = null) {
    for (const agentId of this.participants.keys()) {
      if (agentId !== excludeAgent) {
        this.notifyParticipant(agentId, eventType, data);
      }
    }
  }

  notifyParticipant(agentId, eventType, data) {
    this.emit('participant_notification', {
      agentId,
      event: eventType,
      data,
      sessionId: this.id
    });
  }

  logActivity(agentId, action, details) {
    const activity = {
      agentId,
      action,
      details,
      timestamp: Date.now()
    };

    this.activityLog.push(activity);

    // Keep only last 100 activities
    if (this.activityLog.length > 100) {
      this.activityLog.shift();
    }
  }

  isDriver(agentId) {
    const participant = this.participants.get(agentId);
    return participant?.role === 'driver';
  }

  generateBreakpointId() {
    return `bp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

class PairProgrammingSession extends EventEmitter {
  constructor(config) {
    super();
    this.id = config.id;
    this.collaborationSessionId = config.collaborationSessionId;
    this.config = config.config;
    this.sharedState = config.sharedState;
    this.crdtResolver = config.crdtResolver;
    this.participants = config.participants;
    
    this.roles = new Map(); // agent -> role mapping
    this.currentDriver = null;
    this.sessionMetrics = {
      driverSwitches: 0,
      totalKeystrokes: 0,
      linesAdded: 0,
      linesDeleted: 0,
      startTime: Date.now()
    };
    
    this.initializeRoles();
  }

  async initialize() {
    // Set up initial pair programming state
    await this.sharedState.applyOperation(this.collaborationSessionId, {
      type: 'set',
      key: `pair_session_${this.id}`,
      value: {
        id: this.id,
        currentDriver: this.currentDriver,
        roles: Object.fromEntries(this.roles),
        metrics: this.sessionMetrics,
        createdAt: Date.now()
      },
      agent: 'system',
      timestamp: Date.now()
    });

    this.emit('pair_session_initialized', {
      sessionId: this.id,
      currentDriver: this.currentDriver
    });
  }

  initializeRoles() {
    if (this.participants.length >= 2) {
      this.roles.set(this.participants[0].id, 'driver');
      this.roles.set(this.participants[1].id, 'navigator');
      this.currentDriver = this.participants[0].id;
      
      // Additional participants become observers
      for (let i = 2; i < this.participants.length; i++) {
        this.roles.set(this.participants[i].id, 'observer');
      }
    }
  }

  async switchRoles() {
    if (this.participants.length < 2) {
      throw new Error('Need at least 2 participants to switch roles');
    }

    const driverAgentId = this.currentDriver;
    const navigatorAgentId = Array.from(this.roles.entries())
      .find(([agentId, role]) => role === 'navigator')?.[0];

    if (!navigatorAgentId) {
      throw new Error('No navigator found to switch with');
    }

    // Switch roles
    this.roles.set(driverAgentId, 'navigator');
    this.roles.set(navigatorAgentId, 'driver');
    this.currentDriver = navigatorAgentId;

    // Update metrics
    this.sessionMetrics.driverSwitches++;

    // Update shared state
    await this.updateSessionState();

    this.emit('roles_switched', {
      sessionId: this.id,
      newDriver: navigatorAgentId,
      newNavigator: driverAgentId
    });

    logger.info(`🟢 Roles switched in pair session ${this.id}: ${navigatorAgentId} is now driving`);

    return {
      newDriver: navigatorAgentId,
      newNavigator: driverAgentId
    };
  }

  async recordKeystroke(agentId, keystroke) {
    if (this.roles.get(agentId) !== 'driver') {
      // Only driver can make keystrokes in traditional pair programming
      this.emit('keystroke_blocked', {
        agentId,
        reason: 'Not the current driver'
      });
      return false;
    }

    this.sessionMetrics.totalKeystrokes++;

    // Process the keystroke through CRDT
    const operation = {
      type: 'keystroke',
      agentId,
      keystroke,
      timestamp: Date.now(),
      sessionId: this.id
    };

    const resolvedOperation = await this.crdtResolver.resolveOperation(
      this.collaborationSessionId,
      operation,
      await this.sharedState.states.get(this.collaborationSessionId)?.getCurrentState()
    );

    this.emit('keystroke_recorded', {
      sessionId: this.id,
      operation: resolvedOperation
    });

    return resolvedOperation;
  }

  async addCodeLine(agentId, line, lineNumber) {
    if (this.roles.get(agentId) !== 'driver') {
      return false;
    }

    this.sessionMetrics.linesAdded++;

    const operation = {
      type: 'add_line',
      agentId,
      line,
      lineNumber,
      timestamp: Date.now()
    };

    await this.updateSessionState();

    this.emit('line_added', {
      sessionId: this.id,
      operation
    });

    return true;
  }

  async deleteCodeLine(agentId, lineNumber) {
    if (this.roles.get(agentId) !== 'driver') {
      return false;
    }

    this.sessionMetrics.linesDeleted++;

    const operation = {
      type: 'delete_line',
      agentId,
      lineNumber,
      timestamp: Date.now()
    };

    await this.updateSessionState();

    this.emit('line_deleted', {
      sessionId: this.id,
      operation
    });

    return true;
  }

  async provideFeedback(agentId, feedback) {
    // Any participant can provide feedback
    const feedbackEvent = {
      agentId,
      role: this.roles.get(agentId),
      feedback,
      timestamp: Date.now()
    };

    this.emit('feedback_provided', {
      sessionId: this.id,
      feedback: feedbackEvent
    });

    return feedbackEvent;
  }

  async pauseSession(agentId, reason) {
    this.emit('session_paused', {
      sessionId: this.id,
      pausedBy: agentId,
      reason,
      timestamp: Date.now()
    });
  }

  async resumeSession(agentId) {
    this.emit('session_resumed', {
      sessionId: this.id,
      resumedBy: agentId,
      timestamp: Date.now()
    });
  }

  getSessionMetrics() {
    return {
      ...this.sessionMetrics,
      duration: Date.now() - this.sessionMetrics.startTime,
      currentDriver: this.currentDriver,
      roles: Object.fromEntries(this.roles)
    };
  }

  async updateSessionState() {
    await this.sharedState.applyOperation(this.collaborationSessionId, {
      type: 'update',
      key: `pair_session_${this.id}`,
      updates: {
        currentDriver: this.currentDriver,
        roles: Object.fromEntries(this.roles),
        metrics: this.sessionMetrics
      },
      agent: 'system',
      timestamp: Date.now()
    });
  }
}

class BreakpointManager {
  constructor() {
    this.breakpoints = new Map();
    this.globalBreakpoints = new Map();
  }

  async setBreakpoint(sessionId, breakpoint) {
    if (!this.breakpoints.has(sessionId)) {
      this.breakpoints.set(sessionId, new Map());
    }

    const breakpointId = this.generateBreakpointId();
    const sessionBreakpoints = this.breakpoints.get(sessionId);
    
    sessionBreakpoints.set(breakpointId, {
      ...breakpoint,
      id: breakpointId,
      sessionId,
      createdAt: Date.now()
    });

    return breakpointId;
  }

  generateBreakpointId() {
    return `bp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

class CollaborativeCodeInspector {
  async inspectCode(file, line, context) {
    return {
      file,
      line,
      context,
      syntaxTree: this.generateSyntaxTree(context),
      suggestions: this.generateSuggestions(context),
      complexity: this.calculateComplexity(context)
    };
  }

  generateSyntaxTree(code) {
    return { type: 'mock_ast', nodes: [] };
  }

  generateSuggestions(code) {
    return ['Consider adding error handling', 'Variable naming could be improved'];
  }

  calculateComplexity(code) {
    return { cyclomatic: 3, cognitive: 5 };
  }
}

class SharedDebugConsole extends EventEmitter {
  constructor() {
    super();
    this.outputs = [];
    this.inputs = [];
  }

  async executeCommand(sessionId, agentId, command) {
    const execution = {
      sessionId,
      agentId,
      command,
      timestamp: Date.now(),
      output: this.simulateCommandExecution(command)
    };

    this.outputs.push(execution);

    this.emit('command_executed', execution);

    return execution;
  }

  simulateCommandExecution(command) {
    const mockOutputs = {
      'ls': 'file1.js file2.js package.json',
      'pwd': '/home/user/project',
      'node --version': 'v18.17.0'
    };

    return mockOutputs[command] || `Command executed: ${command}`;
  }
}

class VariableWatcher {
  constructor() {
    this.watchedVariables = new Map();
  }

  async watchVariable(sessionId, variablePath) {
    if (!this.watchedVariables.has(sessionId)) {
      this.watchedVariables.set(sessionId, new Set());
    }

    this.watchedVariables.get(sessionId).add(variablePath);
    return true;
  }
}

class CallStackTracker {
  getCurrentCallStack() {
    return [
      { function: 'main', file: 'app.js', line: 15 },
      { function: 'processData', file: 'data.js', line: 42 }
    ];
  }
}

class PerformanceProfiler {
  startProfiling(sessionId) {
    return {
      sessionId,
      startTime: Date.now(),
      profileId: `profile-${Date.now()}`
    };
  }

  stopProfiling(profileId) {
    return {
      profileId,
      duration: Math.random() * 1000,
      memoryUsage: Math.random() * 100,
      cpuUsage: Math.random() * 50
    };
  }
}

module.exports = {
  CollaborativeDebuggingSystem,
  CollaborativeDebugSession,
  PairProgrammingSession,
  BreakpointManager,
  CollaborativeCodeInspector,
  SharedDebugConsole,
  VariableWatcher,
  CallStackTracker,
  PerformanceProfiler
};