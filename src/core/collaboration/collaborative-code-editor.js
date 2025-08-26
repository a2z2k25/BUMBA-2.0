/**
 * BUMBA Collaborative Code Editor
 * Real-time code editing with CRDT conflict resolution and agent attribution
 */

const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');

class CollaborativeCodeEditor extends EventEmitter {
  constructor() {
    super();
    this.activeDocuments = new Map();
    this.editHistory = new Map();
    this.cursorsManager = new CursorsManager();
    this.selectionManager = new SelectionManager();
    this.syntaxHighlighter = new CollaborativeSyntaxHighlighter();
    this.codeIntelligence = new CollaborativeCodeIntelligence();
  }

  async createDocument(sessionId, documentConfig) {
    const documentId = this.generateDocumentId();
    
    const document = new CollaborativeDocument({
      id: documentId,
      sessionId,
      ...documentConfig,
      cursorsManager: this.cursorsManager,
      selectionManager: this.selectionManager,
      syntaxHighlighter: this.syntaxHighlighter,
      codeIntelligence: this.codeIntelligence
    });

    await document.initialize();
    
    this.activeDocuments.set(documentId, document);
    this.editHistory.set(documentId, []);

    logger.info(`🟢 Created collaborative document: ${documentId}`);
    
    this.emit('document_created', { documentId, sessionId });
    
    return document;
  }

  async createPairSession(config) {
    const pairSessionId = this.generatePairSessionId();
    
    const pairSession = new CollaborativePairSession({
      id: pairSessionId,
      sessionId: config.sessionId,
      config: config.config,
      sharedState: config.sharedState,
      crdtResolver: config.crdtResolver,
      editor: this
    });

    await pairSession.initialize();

    this.emit('pair_session_created', { pairSessionId });
    
    return pairSession;
  }

  async applyEdit(documentId, agentId, edit) {
    const document = this.activeDocuments.get(documentId);
    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    const editOperation = await document.applyEdit(agentId, edit);
    
    // Record in edit history
    this.recordEdit(documentId, editOperation);

    this.emit('edit_applied', {
      documentId,
      agentId,
      edit: editOperation
    });

    return editOperation;
  }

  async updateCursor(documentId, agentId, cursorPosition) {
    const document = this.activeDocuments.get(documentId);
    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    await document.updateCursor(agentId, cursorPosition);

    this.emit('cursor_updated', {
      documentId,
      agentId,
      position: cursorPosition
    });
  }

  async updateSelection(documentId, agentId, selection) {
    const document = this.activeDocuments.get(documentId);
    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    await document.updateSelection(agentId, selection);

    this.emit('selection_updated', {
      documentId,
      agentId,
      selection
    });
  }

  recordEdit(documentId, editOperation) {
    if (!this.editHistory.has(documentId)) {
      this.editHistory.set(documentId, []);
    }

    this.editHistory.get(documentId).push({
      ...editOperation,
      recordedAt: Date.now()
    });

    // Keep only last 1000 edits per document
    const history = this.editHistory.get(documentId);
    if (history.length > 1000) {
      history.shift();
    }
  }

  getDocument(documentId) {
    return this.activeDocuments.get(documentId);
  }

  getEditHistory(documentId) {
    return this.editHistory.get(documentId) || [];
  }

  generateDocumentId() {
    return `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generatePairSessionId() {
    return `pair-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

class CollaborativeDocument extends EventEmitter {
  constructor(config) {
    super();
    this.id = config.id;
    this.sessionId = config.sessionId;
    this.fileName = config.fileName || 'untitled.js';
    this.language = config.language || 'javascript';
    this.content = config.content || '';
    this.cursorsManager = config.cursorsManager;
    this.selectionManager = config.selectionManager;
    this.syntaxHighlighter = config.syntaxHighlighter;
    this.codeIntelligence = config.codeIntelligence;
    
    this.participants = new Map();
    this.operationHistory = [];
    this.lastSaved = Date.now();
    this.isDirty = false;
    
    this.versionVector = new Map();
    this.operationBuffer = [];
  }

  async initialize() {
    // Initialize syntax highlighting
    await this.syntaxHighlighter.initializeForLanguage(this.language);
    
    // Initialize code intelligence
    await this.codeIntelligence.initializeForDocument(this);

    logger.info(`🟢 Collaborative document ${this.id} initialized`);
  }

  async addParticipant(agentId, permissions = {}) {
    const participant = {
      agentId,
      permissions: {
        canEdit: true,
        canView: true,
        canComment: true,
        ...permissions
      },
      joinedAt: Date.now(),
      cursor: null,
      selection: null,
      lastActivity: Date.now()
    };

    this.participants.set(agentId, participant);
    this.versionVector.set(agentId, 0);

    this.emit('participant_added', {
      documentId: this.id,
      agentId,
      participant
    });

    return participant;
  }

  async applyEdit(agentId, edit) {
    const participant = this.participants.get(agentId);
    if (!participant || !participant.permissions.canEdit) {
      throw new Error('Agent does not have edit permissions');
    }

    // Create operation with version vector
    const operation = {
      id: this.generateOperationId(),
      agentId,
      type: edit.type,
      position: edit.position,
      content: edit.content,
      length: edit.length || 0,
      timestamp: Date.now(),
      versionVector: new Map(this.versionVector)
    };

    // Increment version for this agent
    this.versionVector.set(agentId, (this.versionVector.get(agentId) || 0) + 1);

    // Apply transformation if needed
    const transformedOperation = await this.transformOperation(operation);

    // Apply to document content
    this.applyOperationToContent(transformedOperation);

    // Record operation
    this.operationHistory.push(transformedOperation);
    this.isDirty = true;

    // Update participant activity
    participant.lastActivity = Date.now();

    // Trigger syntax highlighting update
    await this.updateSyntaxHighlighting(transformedOperation);

    // Trigger code intelligence update
    await this.updateCodeIntelligence(transformedOperation);

    this.emit('operation_applied', {
      documentId: this.id,
      operation: transformedOperation
    });

    return transformedOperation;
  }

  async transformOperation(operation) {
    // Apply Operational Transformation to resolve conflicts
    const concurrentOps = this.getConcurrentOperations(operation);
    
    let transformedOp = { ...operation };
    
    for (const concurrentOp of concurrentOps) {
      transformedOp = this.operationalTransform(transformedOp, concurrentOp);
    }

    return transformedOp;
  }

  operationalTransform(op1, op2) {
    // Simplified OT implementation
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position <= op2.position) {
        return op1; // No transformation needed
      } else {
        return {
          ...op1,
          position: op1.position + op2.content.length
        };
      }
    }
    
    if (op1.type === 'delete' && op2.type === 'insert') {
      if (op1.position <= op2.position) {
        return op1;
      } else {
        return {
          ...op1,
          position: op1.position + op2.content.length
        };
      }
    }
    
    if (op1.type === 'insert' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        return op1;
      } else {
        return {
          ...op1,
          position: Math.max(op2.position, op1.position - op2.length)
        };
      }
    }
    
    if (op1.type === 'delete' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        return op1;
      } else {
        return {
          ...op1,
          position: Math.max(op2.position, op1.position - op2.length)
        };
      }
    }

    return op1;
  }

  getConcurrentOperations(operation) {
    // Find operations that are concurrent with the given operation
    return this.operationHistory.filter(op => 
      this.areConcurrent(operation, op)
    );
  }

  areConcurrent(op1, op2) {
    // Operations are concurrent if neither causally precedes the other
    const op1Vector = op1.versionVector;
    const op2Vector = op2.versionVector;
    
    let op1Precedes = true;
    let op2Precedes = true;
    
    for (const [agentId, version] of op1Vector) {
      if ((op2Vector.get(agentId) || 0) < version) {
        op2Precedes = false;
      }
    }
    
    for (const [agentId, version] of op2Vector) {
      if ((op1Vector.get(agentId) || 0) < version) {
        op1Precedes = false;
      }
    }
    
    return !op1Precedes && !op2Precedes;
  }

  applyOperationToContent(operation) {
    switch (operation.type) {
      case 'insert':
        this.content = 
          this.content.slice(0, operation.position) +
          operation.content +
          this.content.slice(operation.position);
        break;
        
      case 'delete':
        this.content = 
          this.content.slice(0, operation.position) +
          this.content.slice(operation.position + operation.length);
        break;
        
      case 'replace':
        this.content = 
          this.content.slice(0, operation.position) +
          operation.content +
          this.content.slice(operation.position + operation.length);
        break;
    }
  }

  async updateCursor(agentId, cursorPosition) {
    const participant = this.participants.get(agentId);
    if (!participant) {
      throw new Error('Agent is not a participant');
    }

    participant.cursor = {
      line: cursorPosition.line,
      column: cursorPosition.column,
      updatedAt: Date.now()
    };

    await this.cursorsManager.updateCursor(this.id, agentId, participant.cursor);

    this.emit('cursor_moved', {
      documentId: this.id,
      agentId,
      cursor: participant.cursor
    });
  }

  async updateSelection(agentId, selection) {
    const participant = this.participants.get(agentId);
    if (!participant) {
      throw new Error('Agent is not a participant');
    }

    participant.selection = {
      start: selection.start,
      end: selection.end,
      updatedAt: Date.now()
    };

    await this.selectionManager.updateSelection(this.id, agentId, participant.selection);

    this.emit('selection_changed', {
      documentId: this.id,
      agentId,
      selection: participant.selection
    });
  }

  async updateSyntaxHighlighting(operation) {
    const highlightingUpdate = await this.syntaxHighlighter.updateForOperation(
      this.content,
      operation
    );

    if (highlightingUpdate) {
      this.emit('syntax_highlighting_updated', {
        documentId: this.id,
        update: highlightingUpdate
      });
    }
  }

  async updateCodeIntelligence(operation) {
    const intelligenceUpdate = await this.codeIntelligence.analyzeOperation(
      this.content,
      operation
    );

    if (intelligenceUpdate.suggestions.length > 0) {
      this.emit('code_suggestions', {
        documentId: this.id,
        suggestions: intelligenceUpdate.suggestions,
        operation
      });
    }
  }

  getState() {
    return {
      id: this.id,
      sessionId: this.sessionId,
      fileName: this.fileName,
      language: this.language,
      content: this.content,
      participants: Array.from(this.participants.values()),
      cursors: this.cursorsManager.getCursors(this.id),
      selections: this.selectionManager.getSelections(this.id),
      lastSaved: this.lastSaved,
      isDirty: this.isDirty
    };
  }

  generateOperationId() {
    return `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

class CollaborativePairSession extends EventEmitter {
  constructor(config) {
    super();
    this.id = config.id;
    this.sessionId = config.sessionId;
    this.config = config.config;
    this.sharedState = config.sharedState;
    this.crdtResolver = config.crdtResolver;
    this.editor = config.editor;
    
    this.participants = config.config.participants || [];
    this.currentDriver = null;
    this.currentNavigator = null;
    this.document = null;
    
    this.sessionMetrics = {
      driverSwitches: 0,
      collaborationScore: 0,
      startTime: Date.now()
    };
  }

  async initialize() {
    // Create a shared document for pair programming
    this.document = await this.editor.createDocument(this.sessionId, {
      fileName: this.config.fileName || 'pair-session.js',
      language: this.config.language || 'javascript',
      content: this.config.initialContent || ''
    });

    // Set up initial roles
    if (this.participants.length >= 2) {
      this.currentDriver = this.participants[0].id;
      this.currentNavigator = this.participants[1].id;
    }

    // Add participants to document
    for (const participant of this.participants) {
      await this.document.addParticipant(participant.id, {
        canEdit: participant.id === this.currentDriver,
        canView: true,
        canComment: true
      });
    }

    logger.info(`🟢 Pair programming session ${this.id} initialized`);
  }

  async switchRoles() {
    if (!this.currentDriver || !this.currentNavigator) {
      throw new Error('Need both driver and navigator to switch roles');
    }

    const newDriver = this.currentNavigator;
    const newNavigator = this.currentDriver;

    // Update permissions
    const driverParticipant = this.document.participants.get(this.currentDriver);
    const navigatorParticipant = this.document.participants.get(this.currentNavigator);

    if (driverParticipant) {
      driverParticipant.permissions.canEdit = false;
    }
    
    if (navigatorParticipant) {
      navigatorParticipant.permissions.canEdit = true;
    }

    this.currentDriver = newDriver;
    this.currentNavigator = newNavigator;
    this.sessionMetrics.driverSwitches++;

    this.emit('roles_switched', {
      sessionId: this.id,
      newDriver,
      newNavigator
    });

    logger.info(`🟢 Roles switched: ${newDriver} is now driving`);

    return { newDriver, newNavigator };
  }

  getSessionState() {
    return {
      id: this.id,
      sessionId: this.sessionId,
      currentDriver: this.currentDriver,
      currentNavigator: this.currentNavigator,
      document: this.document ? this.document.getState() : null,
      metrics: this.sessionMetrics,
      participants: this.participants
    };
  }
}

class CursorsManager {
  constructor() {
    this.cursors = new Map(); // documentId -> Map(agentId -> cursor)
  }

  async updateCursor(documentId, agentId, cursor) {
    if (!this.cursors.has(documentId)) {
      this.cursors.set(documentId, new Map());
    }

    this.cursors.get(documentId).set(agentId, cursor);
  }

  getCursors(documentId) {
    return this.cursors.get(documentId) || new Map();
  }

  getAgentCursor(documentId, agentId) {
    return this.cursors.get(documentId)?.get(agentId);
  }
}

class SelectionManager {
  constructor() {
    this.selections = new Map(); // documentId -> Map(agentId -> selection)
  }

  async updateSelection(documentId, agentId, selection) {
    if (!this.selections.has(documentId)) {
      this.selections.set(documentId, new Map());
    }

    this.selections.get(documentId).set(agentId, selection);
  }

  getSelections(documentId) {
    return this.selections.get(documentId) || new Map();
  }

  getAgentSelection(documentId, agentId) {
    return this.selections.get(documentId)?.get(agentId);
  }
}

class CollaborativeSyntaxHighlighter {
  async initializeForLanguage(language) {
    // Initialize syntax highlighting for the given language
    this.language = language;
    this.tokens = new Map();
  }

  async updateForOperation(content, operation) {
    // Update syntax highlighting based on the operation
    return {
      affectedLines: this.getAffectedLines(operation),
      tokens: this.tokenizeContent(content),
      language: this.language
    };
  }

  getAffectedLines(operation) {
    // Calculate which lines are affected by the operation
    const startLine = this.getLineFromPosition(operation.position);
    const endLine = operation.type === 'insert' 
      ? startLine + (operation.content.split('\n').length - 1)
      : startLine;
    
    return { start: startLine, end: endLine };
  }

  tokenizeContent(content) {
    // Simple tokenization (would use a real syntax highlighter in production)
    return {
      keywords: this.extractKeywords(content),
      strings: this.extractStrings(content),
      comments: this.extractComments(content)
    };
  }

  getLineFromPosition(position) {
    // Convert character position to line number
    return 1; // Simplified implementation
  }

  extractKeywords(content) { return []; }
  extractStrings(content) { return []; }
  extractComments(content) { return []; }
}

class CollaborativeCodeIntelligence {
  async initializeForDocument(document) {
    this.document = document;
    this.suggestions = [];
  }

  async analyzeOperation(content, operation) {
    const suggestions = [];

    // Generate code suggestions based on the operation
    if (operation.type === 'insert') {
      suggestions.push(...await this.generateInsertSuggestions(content, operation));
    }

    return {
      suggestions,
      diagnostics: await this.generateDiagnostics(content),
      completions: await this.generateCompletions(content, operation)
    };
  }

  async generateInsertSuggestions(content, operation) {
    // Generate suggestions for inserted text
    const suggestions = [];
    
    if (operation.content.includes('function')) {
      suggestions.push({
        type: 'suggestion',
        message: 'Consider adding JSDoc documentation',
        position: operation.position,
        agentId: 'code_intelligence'
      });
    }

    return suggestions;
  }

  async generateDiagnostics(content) {
    // Generate code diagnostics
    return [];
  }

  async generateCompletions(content, operation) {
    // Generate auto-completions
    return [];
  }
}

module.exports = {
  CollaborativeCodeEditor,
  CollaborativeDocument,
  CollaborativePairSession,
  CursorsManager,
  SelectionManager,
  CollaborativeSyntaxHighlighter,
  CollaborativeCodeIntelligence
};