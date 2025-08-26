/**
 * Event Replay System
 * Time travel debugging and event replay capabilities
 * Sprint 21-24 - Event System Fix
 */

const { EventStore } = require('./event-sourcing');
const { eventBus } = require('./event-bus');
const { logger } = require('../logging/bumba-logger');
const fs = require('fs');
const path = require('path');

class EventReplaySystem {
  constructor() {
    this.eventStore = new EventStore({
      enablePersistence: true,
      maxEventsInMemory: 50000
    });
    
    this.replayState = {
      isReplaying: false,
      currentPosition: 0,
      speed: 1,
      filters: {}
    };
    
    this.recordings = new Map();
    this.currentRecording = null;
    
    this.stats = {
      eventsRecorded: 0,
      eventsReplayed: 0,
      recordingsCreated: 0
    };
  }
  
  /**
   * Start recording events
   */
  startRecording(name = `recording_${Date.now()}`) {
    if (this.currentRecording) {
      this.stopRecording();
    }
    
    const recording = {
      id: name,
      events: [],
      startTime: Date.now(),
      metadata: {}
    };
    
    this.currentRecording = recording;
    this.recordings.set(name, recording);
    
    // Subscribe to all events
    this.recordingHandler = (event, ...args) => {
      this.recordEvent(event, args);
    };
    
    eventBus.on('*', this.recordingHandler);
    
    this.stats.recordingsCreated++;
    logger.info(`Started recording: ${name}`);
    
    return name;
  }
  
  /**
   * Stop recording
   */
  stopRecording() {
    if (!this.currentRecording) return null;
    
    eventBus.off('*', this.recordingHandler);
    
    this.currentRecording.endTime = Date.now();
    this.currentRecording.duration = this.currentRecording.endTime - this.currentRecording.startTime;
    
    const recordingId = this.currentRecording.id;
    this.currentRecording = null;
    
    logger.info(`Stopped recording: ${recordingId} (${this.recordings.get(recordingId).events.length} events)`);
    
    return recordingId;
  }
  
  /**
   * Record single event
   */
  recordEvent(event, args) {
    if (!this.currentRecording) return;
    
    const recordedEvent = {
      event,
      args,
      timestamp: Date.now(),
      relativeTime: Date.now() - this.currentRecording.startTime,
      stackTrace: new Error().stack
    };
    
    this.currentRecording.events.push(recordedEvent);
    this.stats.eventsRecorded++;
    
    // Also store in event store
    this.eventStore.appendEvent({
      aggregateId: 'recording',
      type: event,
      data: args,
      metadata: {
        recordingId: this.currentRecording.id
      }
    });
  }
  
  /**
   * Replay recording
   */
  async replayRecording(recordingId, options = {}) {
    const recording = this.recordings.get(recordingId);
    if (!recording) {
      throw new Error(`Recording not found: ${recordingId}`);
    }
    
    this.replayState = {
      isReplaying: true,
      currentPosition: 0,
      speed: options.speed || 1,
      filters: options.filters || {},
      paused: false
    };
    
    logger.info(`Starting replay of ${recordingId} (${recording.events.length} events)`);
    
    // Create replay context
    const context = {
      originalTiming: options.preserveTiming !== false,
      eventFilter: options.eventFilter || (() => true),
      beforeEvent: options.beforeEvent || (() => {}),
      afterEvent: options.afterEvent || (() => {})
    };
    
    // Replay events
    for (let i = 0; i < recording.events.length; i++) {
      if (!this.replayState.isReplaying) break;
      
      while (this.replayState.paused) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const event = recording.events[i];
      this.replayState.currentPosition = i;
      
      // Apply filters
      if (!context.eventFilter(event)) continue;
      
      // Wait for timing if preserving
      if (context.originalTiming && i > 0) {
        const prevEvent = recording.events[i - 1];
        const delay = (event.relativeTime - prevEvent.relativeTime) / this.replayState.speed;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Before event hook
      await context.beforeEvent(event);
      
      // Replay event
      eventBus.emit(event.event, ...event.args);
      this.stats.eventsReplayed++;
      
      // After event hook
      await context.afterEvent(event);
    }
    
    this.replayState.isReplaying = false;
    logger.info(`Replay complete: ${recordingId}`);
  }
  
  /**
   * Pause replay
   */
  pauseReplay() {
    this.replayState.paused = true;
  }
  
  /**
   * Resume replay
   */
  resumeReplay() {
    this.replayState.paused = false;
  }
  
  /**
   * Stop replay
   */
  stopReplay() {
    this.replayState.isReplaying = false;
  }
  
  /**
   * Change replay speed
   */
  setReplaySpeed(speed) {
    this.replayState.speed = speed;
  }
  
  /**
   * Save recording to file
   */
  saveRecording(recordingId, filepath) {
    const recording = this.recordings.get(recordingId);
    if (!recording) {
      throw new Error(`Recording not found: ${recordingId}`);
    }
    
    const data = JSON.stringify(recording, null, 2);
    fs.writeFileSync(filepath, data);
    
    logger.info(`Recording saved to: ${filepath}`);
  }
  
  /**
   * Load recording from file
   */
  loadRecording(filepath) {
    const data = fs.readFileSync(filepath, 'utf8');
    const recording = JSON.parse(data);
    
    this.recordings.set(recording.id, recording);
    
    logger.info(`Recording loaded: ${recording.id}`);
    return recording.id;
  }
  
  /**
   * Export recording as test case
   */
  exportAsTestCase(recordingId, testName) {
    const recording = this.recordings.get(recordingId);
    if (!recording) {
      throw new Error(`Recording not found: ${recordingId}`);
    }
    
    const testCode = `
// Auto-generated test from recording: ${recordingId}
describe('${testName}', () => {
  let eventBus;
  
  beforeEach(() => {
    eventBus = new EventBus();
  });
  
  it('should replay recorded events', async () => {
    const events = ${JSON.stringify(recording.events, null, 2)};
    
    for (const event of events) {
      eventBus.emit(event.event, ...event.args);
      
      // Add your assertions here
      expect(eventBus.listenerCount(event.event)).toBeGreaterThan(0);
    }
  });
});`;
    
    return testCode;
  }
  
  /**
   * Time travel to specific point
   */
  async timeTravel(timestamp) {
    // Find all events before timestamp
    const events = await this.eventStore.replay({
      to: timestamp
    }, async (event) => {
      // Rebuild state from events
      eventBus.emit('timeTravel:event', event);
    });
    
    logger.info(`Time traveled to ${new Date(timestamp).toISOString()} (${events} events)`);
    return events;
  }
  
  /**
   * Create checkpoint
   */
  async createCheckpoint(name) {
    const checkpoint = {
      name,
      timestamp: Date.now(),
      eventCount: this.eventStore.events.length,
      state: await this.captureCurrentState()
    };
    
    await this.eventStore.takeSnapshot('checkpoint', checkpoint.eventCount);
    
    logger.info(`Checkpoint created: ${name}`);
    return checkpoint;
  }
  
  /**
   * Restore from checkpoint
   */
  async restoreCheckpoint(name) {
    const checkpoint = await this.eventStore.getState('checkpoint');
    
    if (!checkpoint || checkpoint.name !== name) {
      throw new Error(`Checkpoint not found: ${name}`);
    }
    
    // Clear current state
    eventBus.removeAllListeners();
    
    // Replay events up to checkpoint
    await this.timeTravel(checkpoint.timestamp);
    
    logger.info(`Restored from checkpoint: ${name}`);
  }
  
  /**
   * Capture current state
   */
  async captureCurrentState() {
    return {
      eventBusMetrics: eventBus.getMetrics(),
      eventStoreStats: this.eventStore.getStats(),
      listeners: eventBus.eventNames()
    };
  }
  
  /**
   * Generate replay report
   */
  generateReplayReport(recordingId) {
    const recording = this.recordings.get(recordingId);
    if (!recording) {
      throw new Error(`Recording not found: ${recordingId}`);
    }
    
    const eventCounts = {};
    const timings = [];
    
    for (let i = 0; i < recording.events.length; i++) {
      const event = recording.events[i];
      
      // Count events
      eventCounts[event.event] = (eventCounts[event.event] || 0) + 1;
      
      // Calculate timings
      if (i > 0) {
        const prevEvent = recording.events[i - 1];
        timings.push(event.relativeTime - prevEvent.relativeTime);
      }
    }
    
    const avgTiming = timings.length > 0 
      ? timings.reduce((a, b) => a + b, 0) / timings.length 
      : 0;
    
    return {
      recordingId,
      duration: recording.duration,
      eventCount: recording.events.length,
      eventTypes: Object.keys(eventCounts).length,
      eventCounts,
      averageTimeBetweenEvents: avgTiming,
      maxTimeBetweenEvents: Math.max(...timings),
      minTimeBetweenEvents: Math.min(...timings)
    };
  }
  
  /**
   * Debug event at position
   */
  async debugEventAt(recordingId, position) {
    const recording = this.recordings.get(recordingId);
    if (!recording || !recording.events[position]) {
      throw new Error(`Event not found at position ${position}`);
    }
    
    const event = recording.events[position];
    
    return {
      position,
      event: event.event,
      args: event.args,
      timestamp: new Date(event.timestamp).toISOString(),
      relativeTime: `${event.relativeTime}ms`,
      stackTrace: event.stackTrace,
      previousEvent: position > 0 ? recording.events[position - 1].event : null,
      nextEvent: position < recording.events.length - 1 ? recording.events[position + 1].event : null
    };
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      recordings: this.recordings.size,
      isRecording: this.currentRecording !== null,
      isReplaying: this.replayState.isReplaying,
      currentRecordingEvents: this.currentRecording ? this.currentRecording.events.length : 0
    };
  }
}

// Singleton instance
let instance = null;

function getEventReplaySystem() {
  if (!instance) {
    instance = new EventReplaySystem();
  }
  return instance;
}

module.exports = {
  EventReplaySystem,
  getEventReplaySystem,
  eventReplay: getEventReplaySystem()
};