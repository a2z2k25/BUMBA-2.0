/**
 * BUMBA WebSocket Manager
 * Real-time communication infrastructure for collaborative sessions
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const http = require('http');
const { logger } = require('../logging/bumba-logger');

class WebSocketManager extends EventEmitter {
  constructor() {
    super();
    this.server = null;
    this.httpServer = null;
    this.clients = new Map(); // Map of client ID to WebSocket connection
    this.sessions = new Map(); // Map of session ID to Set of client IDs
    this.clientMetadata = new Map(); // Map of client ID to metadata
    this.messageQueue = new Map(); // Message queue for offline clients
    this.heartbeatInterval = null;
    this.config = null;
    
    this.initializeMessageHandlers();
  }

  initialize(config) {
    this.config = {
      port: 8080,
      path: '/bumba-collaboration',
      heartbeatInterval: 30000,
      maxConnections: 1000,
      messageQueueSize: 100,
      ...config
    };

    return this.setupWebSocketServer();
  }

  async setupWebSocketServer() {
    try {
      // Create HTTP server
      this.httpServer = http.createServer();
      
      // Create WebSocket server
      this.server = new WebSocket.Server({
        server: this.httpServer,
        path: this.config.path,
        maxPayload: 16 * 1024 * 1024, // 16MB max payload
        perMessageDeflate: {
          zlibDeflateOptions: {
            threshold: 1024
          }
        }
      });

      this.setupWebSocketHandlers();
      this.startHeartbeat();

      // Start HTTP server
      await new Promise((resolve, reject) => {
        this.httpServer.listen(this.config.port, (err) => {
          if (err) {
            reject(err);
          } else {
            logger.info(`🟢 WebSocket server listening on port ${this.config.port}`);
            resolve();
          }
        });
      });

      return true;
    } catch (error) {
      logger.error('Failed to setup WebSocket server:', error);
      throw error;
    }
  }

  setupWebSocketHandlers() {
    this.server.on('connection', this.handleConnection.bind(this));
    
    this.server.on('error', (error) => {
      logger.error('WebSocket server error:', error);
      this.emit('server_error', error);
    });

    this.server.on('close', () => {
      logger.info('🟢 WebSocket server closed');
      this.emit('server_closed');
    });
  }

  handleConnection(ws, request) {
    const clientId = this.generateClientId();
    const clientInfo = this.extractClientInfo(request);
    
    // Store client connection
    this.clients.set(clientId, ws);
    this.clientMetadata.set(clientId, {
      ...clientInfo,
      connectedAt: Date.now(),
      lastSeen: Date.now(),
      isAlive: true
    });

    logger.info(`🟢 Client connected: ${clientId} (${clientInfo.userAgent})`);

    // Setup client handlers
    this.setupClientHandlers(ws, clientId);

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'welcome',
      clientId,
      timestamp: Date.now()
    });

    this.emit('client_connected', { clientId, clientInfo });
  }

  setupClientHandlers(ws, clientId) {
    ws.on('message', (data) => {
      this.handleMessage(clientId, data);
    });

    ws.on('close', (code, reason) => {
      this.handleDisconnection(clientId, code, reason);
    });

    ws.on('error', (error) => {
      logger.error(`WebSocket error for client ${clientId}:`, error);
      this.handleClientError(clientId, error);
    });

    ws.on('pong', () => {
      const metadata = this.clientMetadata.get(clientId);
      if (metadata) {
        metadata.isAlive = true;
        metadata.lastSeen = Date.now();
      }
    });
  }

  handleMessage(clientId, data) {
    try {
      const message = JSON.parse(data.toString());
      
      // Update last seen
      const metadata = this.clientMetadata.get(clientId);
      if (metadata) {
        metadata.lastSeen = Date.now();
      }

      // Validate message structure
      if (!this.validateMessage(message)) {
        this.sendError(clientId, 'Invalid message format');
        return;
      }

      // Handle different message types
      this.routeMessage(clientId, message);

    } catch (error) {
      logger.error(`Error parsing message from client ${clientId}:`, error);
      this.sendError(clientId, 'Invalid JSON format');
    }
  }

  routeMessage(clientId, message) {
    const metadata = this.clientMetadata.get(clientId);
    
    switch (message.type) {
      case 'authenticate':
        this.handleAuthentication(clientId, message);
        break;
        
      case 'join_session':
        this.handleJoinSession(clientId, message);
        break;
        
      case 'leave_session':
        this.handleLeaveSession(clientId, message);
        break;
        
      case 'session_message':
        this.handleSessionMessage(clientId, message);
        break;
        
      case 'heartbeat':
        this.handleHeartbeat(clientId, message);
        break;
        
      default:
        // Emit as collaboration event for the main system to handle
        this.emit('collaboration_event', {
          ...message,
          clientId,
          metadata
        });
    }
  }

  handleAuthentication(clientId, message) {
    const { agentInfo } = message;
    
    if (!agentInfo || !agentInfo.id) {
      this.sendError(clientId, 'Invalid agent information');
      return;
    }

    // Update client metadata with agent info
    const metadata = this.clientMetadata.get(clientId);
    if (metadata) {
      metadata.agentId = agentInfo.id;
      metadata.agentInfo = agentInfo;
      metadata.authenticated = true;
    }

    this.sendToClient(clientId, {
      type: 'authenticated',
      success: true,
      clientId,
      timestamp: Date.now()
    });

    this.emit('agent_connected', this.clients.get(clientId), agentInfo);

    logger.info(`🟢 Client ${clientId} authenticated as agent ${agentInfo.id}`);
  }

  handleJoinSession(clientId, message) {
    const { sessionId } = message;
    const metadata = this.clientMetadata.get(clientId);
    
    if (!metadata || !metadata.authenticated) {
      this.sendError(clientId, 'Authentication required');
      return;
    }

    if (!sessionId) {
      this.sendError(clientId, 'Session ID required');
      return;
    }

    // Add client to session
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, new Set());
    }
    
    this.sessions.get(sessionId).add(clientId);
    metadata.currentSession = sessionId;

    this.sendToClient(clientId, {
      type: 'session_joined',
      sessionId,
      timestamp: Date.now()
    });

    // Notify session members
    this.broadcastToSession(sessionId, {
      type: 'member_joined',
      agentId: metadata.agentId,
      sessionId,
      timestamp: Date.now()
    }, clientId);

    logger.info(`🟢 Client ${clientId} joined session ${sessionId}`);
  }

  handleLeaveSession(clientId, message) {
    const { sessionId } = message;
    const metadata = this.clientMetadata.get(clientId);
    
    if (!metadata) {return;}

    this.removeClientFromSession(clientId, sessionId);

    this.sendToClient(clientId, {
      type: 'session_left',
      sessionId,
      timestamp: Date.now()
    });
  }

  handleSessionMessage(clientId, message) {
    const { sessionId, content } = message;
    const metadata = this.clientMetadata.get(clientId);
    
    if (!metadata || !metadata.authenticated) {
      this.sendError(clientId, 'Authentication required');
      return;
    }

    if (!sessionId || metadata.currentSession !== sessionId) {
      this.sendError(clientId, 'Not a member of this session');
      return;
    }

    // Broadcast message to session members
    this.broadcastToSession(sessionId, {
      type: 'session_message',
      sessionId,
      agentId: metadata.agentId,
      content,
      timestamp: Date.now()
    });
  }

  handleHeartbeat(clientId, message) {
    const metadata = this.clientMetadata.get(clientId);
    if (metadata) {
      metadata.lastSeen = Date.now();
      metadata.isAlive = true;
    }

    this.sendToClient(clientId, {
      type: 'heartbeat_ack',
      timestamp: Date.now()
    });
  }

  handleDisconnection(clientId, code, reason) {
    const metadata = this.clientMetadata.get(clientId);
    
    logger.info(`🟢 Client ${clientId} disconnected (code: ${code}, reason: ${reason})`);

    // Remove from all sessions
    for (const [sessionId, sessionClients] of this.sessions) {
      if (sessionClients.has(clientId)) {
        this.removeClientFromSession(clientId, sessionId);
      }
    }

    // Clean up client data
    this.clients.delete(clientId);
    this.clientMetadata.delete(clientId);

    if (metadata && metadata.agentId) {
      this.emit('agent_disconnected', metadata.agentId);
    }
  }

  handleClientError(clientId, error) {
    logger.error(`WebSocket error for client ${clientId}:`, error);
    
    // Attempt to send error notification
    try {
      this.sendError(clientId, 'Connection error occurred');
    } catch (e) {
      // Client might be disconnected
    }
  }

  removeClientFromSession(clientId, sessionId) {
    const sessionClients = this.sessions.get(sessionId);
    if (sessionClients && sessionClients.has(clientId)) {
      sessionClients.delete(clientId);
      
      const metadata = this.clientMetadata.get(clientId);
      if (metadata) {
        metadata.currentSession = null;
      }

      // Notify remaining session members
      this.broadcastToSession(sessionId, {
        type: 'member_left',
        agentId: metadata?.agentId,
        sessionId,
        timestamp: Date.now()
      });

      // Clean up empty sessions
      if (sessionClients.size === 0) {
        this.sessions.delete(sessionId);
      }
    }
  }

  sendToClient(clientId, message) {
    const ws = this.clients.get(clientId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      // Queue message for offline client
      this.queueMessage(clientId, message);
      return false;
    }

    try {
      ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error(`Error sending message to client ${clientId}:`, error);
      return false;
    }
  }

  broadcastToSession(sessionId, message, excludeClient = null) {
    const sessionClients = this.sessions.get(sessionId);
    if (!sessionClients) {return 0;}

    let sentCount = 0;
    
    for (const clientId of sessionClients) {
      if (clientId !== excludeClient) {
        if (this.sendToClient(clientId, message)) {
          sentCount++;
        }
      }
    }

    return sentCount;
  }

  broadcastToAll(message, excludeClient = null) {
    let sentCount = 0;
    
    for (const clientId of this.clients.keys()) {
      if (clientId !== excludeClient) {
        if (this.sendToClient(clientId, message)) {
          sentCount++;
        }
      }
    }

    return sentCount;
  }

  sendError(clientId, errorMessage) {
    this.sendToClient(clientId, {
      type: 'error',
      error: errorMessage,
      timestamp: Date.now()
    });
  }

  queueMessage(clientId, message) {
    if (!this.messageQueue.has(clientId)) {
      this.messageQueue.set(clientId, []);
    }

    const queue = this.messageQueue.get(clientId);
    queue.push({
      ...message,
      queuedAt: Date.now()
    });

    // Limit queue size
    if (queue.length > this.config.messageQueueSize) {
      queue.shift(); // Remove oldest message
    }
  }

  deliverQueuedMessages(clientId) {
    const queue = this.messageQueue.get(clientId);
    if (!queue || queue.length === 0) {return;}

    for (const message of queue) {
      this.sendToClient(clientId, message);
    }

    this.messageQueue.delete(clientId);
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.performHeartbeatCheck();
    }, this.config.heartbeatInterval);
  }

  performHeartbeatCheck() {
    const now = Date.now();
    const deadClients = [];

    for (const [clientId, metadata] of this.clientMetadata) {
      const ws = this.clients.get(clientId);
      
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        deadClients.push(clientId);
        continue;
      }

      // Check if client is responsive
      if (now - metadata.lastSeen > this.config.heartbeatInterval * 2) {
        metadata.isAlive = false;
        deadClients.push(clientId);
      } else {
        // Send ping
        try {
          ws.ping();
        } catch (error) {
          deadClients.push(clientId);
        }
      }
    }

    // Clean up dead clients
    for (const clientId of deadClients) {
      this.handleDisconnection(clientId, 1006, 'Heartbeat timeout');
    }
  }

  validateMessage(message) {
    return (
      message &&
      typeof message === 'object' &&
      typeof message.type === 'string' &&
      message.type.length > 0
    );
  }

  extractClientInfo(request) {
    return {
      ip: request.socket.remoteAddress,
      userAgent: request.headers['user-agent'] || 'Unknown',
      origin: request.headers.origin || 'Unknown',
      url: request.url
    };
  }

  generateClientId() {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  initializeMessageHandlers() {
    // Set up default message handlers
    this.messageHandlers = new Map();
    
    // Built-in handlers
    this.messageHandlers.set('ping', (clientId, message) => {
      this.sendToClient(clientId, { type: 'pong', timestamp: Date.now() });
    });
  }

  getSessionClients(sessionId) {
    const sessionClients = this.sessions.get(sessionId);
    if (!sessionClients) {return [];}

    return Array.from(sessionClients).map(clientId => ({
      clientId,
      metadata: this.clientMetadata.get(clientId)
    }));
  }

  getConnectionStats() {
    const totalConnections = this.clients.size;
    const authenticatedConnections = Array.from(this.clientMetadata.values())
      .filter(m => m.authenticated).length;
    const activeSessions = this.sessions.size;
    const totalQueuedMessages = Array.from(this.messageQueue.values())
      .reduce((sum, queue) => sum + queue.length, 0);

    return {
      totalConnections,
      authenticatedConnections,
      activeSessions,
      totalQueuedMessages,
      serverUptime: Date.now() - (this.serverStartTime || Date.now())
    };
  }

  async shutdown() {
    logger.info('🟢 Shutting down WebSocket server...');

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close all client connections
    for (const [clientId, ws] of this.clients) {
      try {
        ws.close(1001, 'Server shutdown');
      } catch (error) {
        logger.error(`Error closing client ${clientId}:`, error);
      }
    }

    // Close server
    if (this.server) {
      this.server.close();
    }

    if (this.httpServer) {
      await new Promise((resolve) => {
        this.httpServer.close(resolve);
      });
    }

    logger.info('🟢 WebSocket server shutdown complete');
  }
}

module.exports = {
  WebSocketManager
};