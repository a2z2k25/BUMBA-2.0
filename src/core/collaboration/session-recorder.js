/**
 * BUMBA Session Recorder
 * Comprehensive recording and playback system for collaborative sessions
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../logging/bumba-logger');

class SessionRecorder extends EventEmitter {
  constructor() {
    super();
    this.activeRecordings = new Map();
    this.recordingStorage = new Map();
    this.compressionEngine = new CompressionEngine();
    this.analytics = new SessionAnalytics();
    
    this.config = {
      storageDir: process.env.BUMBA_RECORDING_DIR || './recordings',
      maxRecordingSize: 100 * 1024 * 1024, // 100MB
      compressionEnabled: true,
      retentionDays: 30,
      eventFilters: ['heartbeat', 'ping', 'pong'] // Events to exclude from recordings
    };

    this.initializeStorage();
  }

  async initializeStorage() {
    try {
      await fs.mkdir(this.config.storageDir, { recursive: true });
      logger.info(`🟢 Session recorder initialized with storage: ${this.config.storageDir}`);
    } catch (error) {
      logger.error('Failed to initialize recording storage:', error);
    }
  }

  async startRecording(sessionId, session) {
    if (this.activeRecordings.has(sessionId)) {
      logger.warn(`Recording already active for session ${sessionId}`);
      return false;
    }

    const recording = new SessionRecording({
      sessionId,
      session,
      config: this.config,
      compressionEngine: this.compressionEngine,
      analytics: this.analytics
    });

    await recording.initialize();
    
    this.activeRecordings.set(sessionId, recording);
    
    // Subscribe to session events
    this.subscribeToSessionEvents(sessionId, session, recording);

    logger.info(`🟢 Started recording session ${sessionId}`);
    
    this.emit('recording_started', { sessionId });
    
    return recording;
  }

  async stopRecording(sessionId) {
    const recording = this.activeRecordings.get(sessionId);
    if (!recording) {
      return false;
    }

    await recording.finalize();
    
    // Store the recording
    this.recordingStorage.set(sessionId, recording);
    this.activeRecordings.delete(sessionId);

    // Save to disk
    await this.saveRecording(sessionId, recording);

    logger.info(`🟢 Stopped recording session ${sessionId}`);
    
    this.emit('recording_stopped', { sessionId });
    
    return true;
  }

  async recordEvent(sessionId, event) {
    const recording = this.activeRecordings.get(sessionId);
    if (!recording) {
      return false;
    }

    // Filter out excluded events
    if (this.config.eventFilters.includes(event.type)) {
      return false;
    }

    await recording.recordEvent(event);
    return true;
  }

  async getRecording(sessionId) {
    // Check active recordings first
    if (this.activeRecordings.has(sessionId)) {
      return this.activeRecordings.get(sessionId).getSnapshot();
    }

    // Check memory storage
    if (this.recordingStorage.has(sessionId)) {
      return this.recordingStorage.get(sessionId);
    }

    // Load from disk
    return await this.loadRecording(sessionId);
  }

  async finalizeRecording(sessionId) {
    return await this.stopRecording(sessionId);
  }

  async playbackSession(sessionId, options = {}) {
    const recording = await this.getRecording(sessionId);
    if (!recording) {
      throw new Error(`Recording not found for session ${sessionId}`);
    }

    const playback = new SessionPlayback({
      recording,
      options: {
        speed: 1.0,
        startTime: 0,
        endTime: null,
        eventTypes: null,
        agentFilter: null,
        ...options
      }
    });

    return playback;
  }

  async generateAnalytics(sessionId) {
    const recording = await this.getRecording(sessionId);
    if (!recording) {
      throw new Error(`Recording not found for session ${sessionId}`);
    }

    return await this.analytics.generateReport(recording);
  }

  async filterEvents(recording, filter) {
    if (!recording) {
      throw new Error('Recording is required');
    }

    const filteredEvents = [];
    
    for (const event of recording.events) {
      if (this.matchesFilter(event, filter)) {
        filteredEvents.push(event);
      }
    }

    return {
      ...recording,
      events: filteredEvents,
      filtered: true,
      filterCriteria: filter
    };
  }

  matchesFilter(event, filter) {
    if (filter.eventTypes && !filter.eventTypes.includes(event.type)) {
      return false;
    }

    if (filter.agentId && event.agentId !== filter.agentId) {
      return false;
    }

    if (filter.timeRange) {
      const eventTime = event.timestamp;
      if (eventTime < filter.timeRange.start || eventTime > filter.timeRange.end) {
        return false;
      }
    }

    if (filter.keyword) {
      const eventData = JSON.stringify(event).toLowerCase();
      if (!eventData.includes(filter.keyword.toLowerCase())) {
        return false;
      }
    }

    return true;
  }

  subscribeToSessionEvents(sessionId, session, recording) {
    // Subscribe to all session events
    const eventTypes = [
      'participant_added',
      'participant_removed',
      'contribution_recorded',
      'ethics_pause',
      'ethics_resolution',
      'session_ended'
    ];

    for (const eventType of eventTypes) {
      session.on(eventType, (eventData) => {
        recording.recordEvent({
          type: eventType,
          data: eventData,
          timestamp: Date.now(),
          source: 'session'
        });
      });
    }
  }

  async saveRecording(sessionId, recording) {
    try {
      const fileName = `recording-${sessionId}-${Date.now()}.json`;
      const filePath = path.join(this.config.storageDir, fileName);
      
      let data = recording.toJSON();
      
      if (this.config.compressionEnabled) {
        data = await this.compressionEngine.compress(data);
      }
      
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      
      recording.filePath = filePath;
      
      logger.info(`🟢 Saved recording to ${filePath}`);
    } catch (error) {
      logger.error(`Failed to save recording for session ${sessionId}:`, error);
    }
  }

  async loadRecording(sessionId) {
    try {
      const files = await fs.readdir(this.config.storageDir);
      const recordingFile = files.find(file => file.includes(sessionId));
      
      if (!recordingFile) {
        return null;
      }

      const filePath = path.join(this.config.storageDir, recordingFile);
      const data = await fs.readFile(filePath, 'utf8');
      let recordingData = JSON.parse(data);
      
      if (this.config.compressionEnabled && recordingData.compressed) {
        recordingData = await this.compressionEngine.decompress(recordingData);
      }
      
      return SessionRecording.fromJSON(recordingData);
    } catch (error) {
      logger.error(`Failed to load recording for session ${sessionId}:`, error);
      return null;
    }
  }

  async cleanupOldRecordings() {
    try {
      const files = await fs.readdir(this.config.storageDir);
      const cutoffDate = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
      
      for (const file of files) {
        const filePath = path.join(this.config.storageDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < cutoffDate) {
          await fs.unlink(filePath);
          logger.info(`🟢 Cleaned up old recording: ${file}`);
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup old recordings:', error);
    }
  }

  getRecordingsList() {
    return {
      active: Array.from(this.activeRecordings.keys()),
      stored: Array.from(this.recordingStorage.keys())
    };
  }

  getRecordingStats() {
    const activeCount = this.activeRecordings.size;
    const storedCount = this.recordingStorage.size;
    
    let totalEvents = 0;
    let totalSize = 0;
    
    for (const recording of this.activeRecordings.values()) {
      totalEvents += recording.events.length;
      totalSize += recording.getSize();
    }
    
    for (const recording of this.recordingStorage.values()) {
      totalEvents += recording.events.length;
      totalSize += recording.getSize();
    }

    return {
      activeRecordings: activeCount,
      storedRecordings: storedCount,
      totalEvents,
      totalSize,
      storageDir: this.config.storageDir
    };
  }
}

class SessionRecording {
  constructor(config) {
    this.sessionId = config.sessionId;
    this.session = config.session;
    this.config = config.config;
    this.compressionEngine = config.compressionEngine;
    this.analytics = config.analytics;
    
    this.events = [];
    this.metadata = {};
    this.startTime = Date.now();
    this.endTime = null;
    this.status = 'initializing';
    this.size = 0;
    this.filePath = null;
  }

  async initialize() {
    this.metadata = {
      sessionId: this.sessionId,
      purpose: this.session.purpose,
      objectives: this.session.objectives,
      participants: this.session.getParticipants(),
      startTime: this.startTime,
      recorderVersion: '1.0.0'
    };
    
    this.status = 'recording';
    
    await this.recordEvent({
      type: 'recording_started',
      data: this.metadata,
      timestamp: this.startTime,
      source: 'recorder'
    });
  }

  async recordEvent(event) {
    if (this.status !== 'recording') {
      return false;
    }

    const recordedEvent = {
      id: this.generateEventId(),
      ...event,
      recordedAt: Date.now()
    };

    this.events.push(recordedEvent);
    this.size += JSON.stringify(recordedEvent).length;

    // Check size limits
    if (this.size > this.config.maxRecordingSize) {
      await this.handleSizeLimit();
    }

    return true;
  }

  async finalize() {
    this.endTime = Date.now();
    this.status = 'finalized';
    
    await this.recordEvent({
      type: 'recording_ended',
      data: {
        endTime: this.endTime,
        totalEvents: this.events.length,
        duration: this.endTime - this.startTime
      },
      timestamp: this.endTime,
      source: 'recorder'
    });

    // Generate analytics
    this.analytics.processRecording(this);
  }

  async handleSizeLimit() {
    logger.warn(`Recording ${this.sessionId} approaching size limit, compressing...`);
    
    if (this.config.compressionEnabled) {
      await this.compress();
    } else {
      // Archive older events
      await this.archiveOldEvents();
    }
  }

  async compress() {
    const compressed = await this.compressionEngine.compressEvents(this.events);
    this.events = compressed;
    this.size = JSON.stringify(compressed).length;
  }

  async archiveOldEvents() {
    // Keep only the most recent 1000 events
    if (this.events.length > 1000) {
      const archived = this.events.slice(0, this.events.length - 1000);
      this.events = this.events.slice(-1000);
      
      // Save archived events separately
      await this.saveArchivedEvents(archived);
    }
  }

  async saveArchivedEvents(events) {
    // Implementation would save archived events to separate files
    logger.info(`Archived ${events.length} events for session ${this.sessionId}`);
  }

  getSnapshot() {
    return {
      sessionId: this.sessionId,
      metadata: this.metadata,
      events: [...this.events],
      startTime: this.startTime,
      endTime: this.endTime,
      status: this.status,
      size: this.size
    };
  }

  getSize() {
    return this.size;
  }

  toJSON() {
    return {
      sessionId: this.sessionId,
      metadata: this.metadata,
      events: this.events,
      startTime: this.startTime,
      endTime: this.endTime,
      status: this.status,
      size: this.size,
      exportedAt: Date.now()
    };
  }

  static fromJSON(data) {
    const recording = new SessionRecording({
      sessionId: data.sessionId,
      session: null,
      config: {},
      compressionEngine: null,
      analytics: null
    });

    recording.metadata = data.metadata;
    recording.events = data.events;
    recording.startTime = data.startTime;
    recording.endTime = data.endTime;
    recording.status = data.status;
    recording.size = data.size;

    return recording;
  }

  generateEventId() {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

class SessionPlayback extends EventEmitter {
  constructor(config) {
    super();
    this.recording = config.recording;
    this.options = config.options;
    this.currentIndex = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.playbackTimer = null;
    this.startTime = null;
  }

  start() {
    if (this.isPlaying) {
      return false;
    }

    this.isPlaying = true;
    this.isPaused = false;
    this.startTime = Date.now();
    
    this.scheduleNextEvent();
    
    this.emit('playback_started', {
      recording: this.recording.sessionId,
      totalEvents: this.recording.events.length
    });

    return true;
  }

  pause() {
    if (!this.isPlaying || this.isPaused) {
      return false;
    }

    this.isPaused = true;
    
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }

    this.emit('playback_paused', {
      currentIndex: this.currentIndex
    });

    return true;
  }

  resume() {
    if (!this.isPlaying || !this.isPaused) {
      return false;
    }

    this.isPaused = false;
    this.scheduleNextEvent();
    
    this.emit('playback_resumed', {
      currentIndex: this.currentIndex
    });

    return true;
  }

  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentIndex = 0;
    
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }

    this.emit('playback_stopped');

    return true;
  }

  seek(index) {
    if (index < 0 || index >= this.recording.events.length) {
      return false;
    }

    this.currentIndex = index;
    
    if (this.isPlaying && !this.isPaused) {
      this.scheduleNextEvent();
    }

    this.emit('playback_seek', {
      index: this.currentIndex
    });

    return true;
  }

  scheduleNextEvent() {
    if (!this.isPlaying || this.isPaused || this.currentIndex >= this.recording.events.length) {
      if (this.currentIndex >= this.recording.events.length) {
        this.handlePlaybackComplete();
      }
      return;
    }

    const currentEvent = this.recording.events[this.currentIndex];
    const nextEvent = this.recording.events[this.currentIndex + 1];

    // Emit current event
    this.emit('playback_event', {
      event: currentEvent,
      index: this.currentIndex,
      progress: this.currentIndex / this.recording.events.length
    });

    this.currentIndex++;

    // Schedule next event
    if (nextEvent) {
      const delay = this.calculateDelay(currentEvent, nextEvent);
      this.playbackTimer = setTimeout(() => {
        this.scheduleNextEvent();
      }, delay);
    } else {
      this.handlePlaybackComplete();
    }
  }

  calculateDelay(currentEvent, nextEvent) {
    const originalDelay = nextEvent.timestamp - currentEvent.timestamp;
    return Math.max(1, originalDelay / this.options.speed);
  }

  handlePlaybackComplete() {
    this.isPlaying = false;
    this.emit('playback_complete', {
      totalEvents: this.recording.events.length
    });
  }

  getProgress() {
    return {
      currentIndex: this.currentIndex,
      totalEvents: this.recording.events.length,
      progress: this.currentIndex / this.recording.events.length,
      isPlaying: this.isPlaying,
      isPaused: this.isPaused
    };
  }
}

class CompressionEngine {
  async compress(data) {
    // Simple compression simulation
    return {
      compressed: true,
      data: JSON.stringify(data),
      originalSize: JSON.stringify(data).length,
      compressedSize: Math.floor(JSON.stringify(data).length * 0.7) // 30% compression
    };
  }

  async decompress(compressedData) {
    if (!compressedData.compressed) {
      return compressedData;
    }

    return JSON.parse(compressedData.data);
  }

  async compressEvents(events) {
    // Event-specific compression
    return events.map(event => ({
      ...event,
      compressed: true
    }));
  }
}

class SessionAnalytics {
  processRecording(recording) {
    // Process recording for analytics
    recording.analytics = this.generateBasicAnalytics(recording);
  }

  generateBasicAnalytics(recording) {
    const events = recording.events;
    const duration = recording.endTime - recording.startTime;
    
    const eventTypes = new Map();
    const agentActivity = new Map();
    
    for (const event of events) {
      // Count event types
      eventTypes.set(event.type, (eventTypes.get(event.type) || 0) + 1);
      
      // Track agent activity
      if (event.agentId) {
        agentActivity.set(event.agentId, (agentActivity.get(event.agentId) || 0) + 1);
      }
    }

    return {
      duration,
      totalEvents: events.length,
      eventsPerMinute: (events.length / (duration / 60000)).toFixed(2),
      eventTypes: Object.fromEntries(eventTypes),
      agentActivity: Object.fromEntries(agentActivity),
      mostActiveAgent: this.getMostActiveAgent(agentActivity),
      collaborationScore: this.calculateCollaborationScore(recording)
    };
  }

  async generateReport(recording) {
    return {
      sessionId: recording.sessionId,
      basicAnalytics: recording.analytics || this.generateBasicAnalytics(recording),
      timeline: this.generateTimeline(recording.events),
      collaborationPatterns: this.analyzeCollaborationPatterns(recording.events),
      keyMoments: this.identifyKeyMoments(recording.events)
    };
  }

  generateTimeline(events) {
    // Create timeline of major events
    return events
      .filter(event => ['participant_added', 'decision_initiated', 'code_edit', 'ethics_pause'].includes(event.type))
      .map(event => ({
        timestamp: event.timestamp,
        type: event.type,
        description: this.getEventDescription(event)
      }));
  }

  analyzeCollaborationPatterns(events) {
    // Analyze patterns in collaboration
    const patterns = {
      peakActivityPeriods: [],
      collaborationClusters: [],
      conflictResolutions: []
    };

    // Implementation would analyze event patterns
    return patterns;
  }

  identifyKeyMoments(events) {
    // Identify significant moments in the session
    return events
      .filter(event => event.type === 'ethics_pause' || event.type === 'decision_finalized')
      .map(event => ({
        timestamp: event.timestamp,
        type: event.type,
        significance: this.calculateSignificance(event)
      }));
  }

  getMostActiveAgent(agentActivity) {
    let mostActive = null;
    let maxActivity = 0;
    
    for (const [agentId, activity] of agentActivity) {
      if (activity > maxActivity) {
        maxActivity = activity;
        mostActive = agentId;
      }
    }

    return mostActive;
  }

  calculateCollaborationScore(recording) {
    // Simple collaboration score calculation
    const events = recording.events;
    const uniqueAgents = new Set(events.map(e => e.agentId).filter(Boolean));
    
    const collaborativeEvents = events.filter(e => 
      ['decision_initiated', 'code_edit', 'discussion_added'].includes(e.type)
    );

    return Math.min(1.0, (collaborativeEvents.length / events.length) * uniqueAgents.size);
  }

  getEventDescription(event) {
    const descriptions = {
      'participant_added': 'New participant joined',
      'decision_initiated': 'Decision process started',
      'code_edit': 'Code modification made',
      'ethics_pause': 'Session paused for ethics review'
    };

    return descriptions[event.type] || event.type;
  }

  calculateSignificance(event) {
    const significanceScores = {
      'ethics_pause': 0.9,
      'decision_finalized': 0.8,
      'conflict_resolved': 0.7
    };

    return significanceScores[event.type] || 0.5;
  }
}

module.exports = {
  SessionRecorder,
  SessionRecording,
  SessionPlayback,
  CompressionEngine,
  SessionAnalytics
};