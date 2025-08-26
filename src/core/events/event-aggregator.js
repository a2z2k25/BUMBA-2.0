/**
 * Event Aggregator
 * Domain-driven event aggregation and correlation
 * Sprint 21-24 - Event System Fix
 */

const { EventBus } = require('./event-bus');
const { logger } = require('../logging/bumba-logger');
const { stateManager } = require('../state/global-state-manager');

class EventAggregator {
  constructor() {
    this.domains = new Map();
    this.correlations = new Map();
    this.sagas = new Map();
    this.eventStore = [];
    this.maxEventStoreSize = 10000;
    
    // Statistics
    this.stats = {
      domainsRegistered: 0,
      eventsAggregated: 0,
      correlationsDetected: 0,
      sagasCompleted: 0
    };
    
    // Register with state manager
    stateManager.register('eventAggregator', {
      stats: this.stats,
      domains: [],
      activeSagas: []
    });
  }
  
  /**
   * Register domain with its events
   */
  registerDomain(domain, events = []) {
    if (!this.domains.has(domain)) {
      const domainBus = new EventBus({
        maxListeners: 50,
        enableMetrics: true
      });
      
      this.domains.set(domain, {
        name: domain,
        bus: domainBus,
        events: new Set(events),
        subscribers: new Map(),
        aggregates: new Map()
      });
      
      this.stats.domainsRegistered++;
      logger.info(`Domain registered: ${domain}`);
    } else {
      // Add new events to existing domain
      const domainData = this.domains.get(domain);
      events.forEach(event => domainData.events.add(event));
    }
    
    this.updateState();
    return this.domains.get(domain).bus;
  }
  
  /**
   * Publish event to domain
   */
  publish(domain, event, data) {
    if (!this.domains.has(domain)) {
      logger.warn(`Domain not registered: ${domain}`);
      return false;
    }
    
    const domainData = this.domains.get(domain);
    
    // Check if event is registered for domain
    if (!domainData.events.has(event) && !domainData.events.has('*')) {
      logger.warn(`Event ${event} not registered for domain ${domain}`);
    }
    
    // Create event envelope
    const envelope = {
      id: this.generateEventId(),
      domain,
      event,
      data,
      timestamp: Date.now(),
      correlationId: data?.correlationId || this.generateCorrelationId(),
      metadata: {
        version: '1.0',
        source: 'event-aggregator'
      }
    };
    
    // Store event
    this.storeEvent(envelope);
    
    // Track correlation
    this.trackCorrelation(envelope);
    
    // Check sagas
    this.processSagas(envelope);
    
    // Emit to domain bus
    domainData.bus.emit(event, envelope);
    
    // Update aggregates
    this.updateAggregates(domain, event, envelope);
    
    this.stats.eventsAggregated++;
    this.updateState();
    
    return true;
  }
  
  /**
   * Subscribe to domain events
   */
  subscribe(domain, event, handler, options = {}) {
    if (!this.domains.has(domain)) {
      this.registerDomain(domain, [event]);
    }
    
    const domainData = this.domains.get(domain);
    
    // Add event to domain if not exists
    domainData.events.add(event);
    
    // Create subscription
    const subscription = {
      id: this.generateSubscriptionId(),
      domain,
      event,
      handler,
      options,
      createdAt: Date.now()
    };
    
    // Store subscription
    if (!domainData.subscribers.has(event)) {
      domainData.subscribers.set(event, new Set());
    }
    domainData.subscribers.get(event).add(subscription);
    
    // Subscribe to domain bus
    domainData.bus.on(event, handler, options);
    
    // Return unsubscribe function
    return () => {
      domainData.bus.off(event, handler);
      domainData.subscribers.get(event).delete(subscription);
    };
  }
  
  /**
   * Create aggregate for domain
   */
  createAggregate(domain, aggregateName, reducer, initialState = {}) {
    if (!this.domains.has(domain)) {
      this.registerDomain(domain);
    }
    
    const domainData = this.domains.get(domain);
    
    domainData.aggregates.set(aggregateName, {
      name: aggregateName,
      state: initialState,
      reducer,
      version: 0,
      lastUpdated: Date.now()
    });
    
    return {
      getState: () => domainData.aggregates.get(aggregateName).state,
      dispatch: (event, data) => this.publish(domain, event, data)
    };
  }
  
  /**
   * Update aggregates based on events
   */
  updateAggregates(domain, event, envelope) {
    const domainData = this.domains.get(domain);
    
    for (const [name, aggregate] of domainData.aggregates) {
      try {
        const newState = aggregate.reducer(aggregate.state, {
          type: event,
          payload: envelope.data,
          meta: envelope
        });
        
        if (newState !== aggregate.state) {
          aggregate.state = newState;
          aggregate.version++;
          aggregate.lastUpdated = Date.now();
          
          // Emit aggregate update event
          domainData.bus.emit(`aggregate:${name}:updated`, {
            aggregate: name,
            state: newState,
            version: aggregate.version
          });
        }
      } catch (error) {
        logger.error(`Error updating aggregate ${name}:`, error);
      }
    }
  }
  
  /**
   * Register saga (long-running transaction)
   */
  registerSaga(name, steps, options = {}) {
    this.sagas.set(name, {
      name,
      steps,
      options,
      instances: new Map()
    });
    
    return {
      start: (initialData) => this.startSaga(name, initialData),
      status: (instanceId) => this.getSagaStatus(name, instanceId)
    };
  }
  
  /**
   * Start saga instance
   */
  startSaga(name, initialData) {
    if (!this.sagas.has(name)) {
      throw new Error(`Saga not registered: ${name}`);
    }
    
    const saga = this.sagas.get(name);
    const instanceId = this.generateSagaId();
    
    const instance = {
      id: instanceId,
      name,
      currentStep: 0,
      state: 'running',
      data: initialData,
      startedAt: Date.now(),
      completedSteps: [],
      compensations: []
    };
    
    saga.instances.set(instanceId, instance);
    
    // Execute first step
    this.executeNextSagaStep(name, instanceId);
    
    return instanceId;
  }
  
  /**
   * Execute next saga step
   */
  async executeNextSagaStep(sagaName, instanceId) {
    const saga = this.sagas.get(sagaName);
    const instance = saga.instances.get(instanceId);
    
    if (!instance || instance.state !== 'running') {
      return;
    }
    
    if (instance.currentStep >= saga.steps.length) {
      // Saga completed
      instance.state = 'completed';
      instance.completedAt = Date.now();
      this.stats.sagasCompleted++;
      
      // Emit completion event
      this.publish('saga', 'completed', {
        saga: sagaName,
        instanceId,
        duration: instance.completedAt - instance.startedAt
      });
      
      return;
    }
    
    const step = saga.steps[instance.currentStep];
    
    try {
      // Execute step
      const result = await step.execute(instance.data);
      
      // Store compensation if provided
      if (step.compensate) {
        instance.compensations.push({
          step: instance.currentStep,
          compensate: step.compensate,
          data: result
        });
      }
      
      // Update instance data
      instance.data = { ...instance.data, ...result };
      instance.completedSteps.push({
        step: instance.currentStep,
        completedAt: Date.now(),
        result
      });
      
      // Move to next step
      instance.currentStep++;
      
      // Execute next step
      setImmediate(() => this.executeNextSagaStep(sagaName, instanceId));
      
    } catch (error) {
      logger.error(`Saga ${sagaName} step ${instance.currentStep} failed:`, error);
      
      // Start compensation
      instance.state = 'compensating';
      await this.compensateSaga(sagaName, instanceId);
    }
  }
  
  /**
   * Compensate saga on failure
   */
  async compensateSaga(sagaName, instanceId) {
    const saga = this.sagas.get(sagaName);
    const instance = saga.instances.get(instanceId);
    
    // Execute compensations in reverse order
    for (let i = instance.compensations.length - 1; i >= 0; i--) {
      const compensation = instance.compensations[i];
      
      try {
        await compensation.compensate(compensation.data);
        logger.info(`Compensated step ${compensation.step} for saga ${sagaName}`);
      } catch (error) {
        logger.error(`Failed to compensate step ${compensation.step}:`, error);
      }
    }
    
    instance.state = 'compensated';
    instance.completedAt = Date.now();
  }
  
  /**
   * Process sagas based on event
   */
  processSagas(envelope) {
    // Check if any saga is waiting for this event
    for (const [sagaName, saga] of this.sagas) {
      for (const [instanceId, instance] of saga.instances) {
        if (instance.state === 'waiting' && 
            instance.waitingFor === `${envelope.domain}:${envelope.event}`) {
          
          // Resume saga
          instance.state = 'running';
          instance.data = { ...instance.data, ...envelope.data };
          this.executeNextSagaStep(sagaName, instanceId);
        }
      }
    }
  }
  
  /**
   * Track event correlation
   */
  trackCorrelation(envelope) {
    const { correlationId } = envelope;
    
    if (!this.correlations.has(correlationId)) {
      this.correlations.set(correlationId, {
        id: correlationId,
        events: [],
        startTime: Date.now(),
        domains: new Set()
      });
    }
    
    const correlation = this.correlations.get(correlationId);
    correlation.events.push(envelope);
    correlation.domains.add(envelope.domain);
    
    if (correlation.events.length > 1) {
      this.stats.correlationsDetected++;
    }
    
    // Clean old correlations
    if (this.correlations.size > 1000) {
      const oldestTime = Date.now() - 3600000; // 1 hour
      for (const [id, corr] of this.correlations) {
        if (corr.startTime < oldestTime) {
          this.correlations.delete(id);
        }
      }
    }
  }
  
  /**
   * Get correlation chain
   */
  getCorrelationChain(correlationId) {
    if (!this.correlations.has(correlationId)) {
      return null;
    }
    
    const correlation = this.correlations.get(correlationId);
    
    return {
      id: correlationId,
      events: correlation.events.map(e => ({
        domain: e.domain,
        event: e.event,
        timestamp: e.timestamp
      })),
      duration: Date.now() - correlation.startTime,
      domains: Array.from(correlation.domains)
    };
  }
  
  /**
   * Store event for replay
   */
  storeEvent(envelope) {
    this.eventStore.push(envelope);
    
    // Limit store size
    if (this.eventStore.length > this.maxEventStoreSize) {
      this.eventStore.shift();
    }
  }
  
  /**
   * Replay events
   */
  async replayEvents(filter = {}) {
    const events = this.eventStore.filter(e => {
      if (filter.domain && e.domain !== filter.domain) return false;
      if (filter.event && e.event !== filter.event) return false;
      if (filter.after && e.timestamp < filter.after) return false;
      if (filter.before && e.timestamp > filter.before) return false;
      return true;
    });
    
    for (const envelope of events) {
      const domainData = this.domains.get(envelope.domain);
      if (domainData) {
        domainData.bus.emit(envelope.event, envelope);
      }
    }
    
    return events.length;
  }
  
  /**
   * Generate IDs
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateCorrelationId() {
    return `cor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateSubscriptionId() {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateSagaId() {
    return `saga_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get saga status
   */
  getSagaStatus(sagaName, instanceId) {
    if (!this.sagas.has(sagaName)) {
      return null;
    }
    
    const saga = this.sagas.get(sagaName);
    const instance = saga.instances.get(instanceId);
    
    if (!instance) {
      return null;
    }
    
    return {
      id: instanceId,
      name: sagaName,
      state: instance.state,
      currentStep: instance.currentStep,
      totalSteps: saga.steps.length,
      progress: (instance.currentStep / saga.steps.length) * 100,
      startedAt: instance.startedAt,
      duration: Date.now() - instance.startedAt,
      completedSteps: instance.completedSteps.length
    };
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      domains: this.domains.size,
      correlations: this.correlations.size,
      activeSagas: Array.from(this.sagas.values())
        .reduce((count, saga) => count + saga.instances.size, 0),
      eventStoreSize: this.eventStore.length
    };
  }
  
  /**
   * Update state
   */
  updateState() {
    stateManager.set('eventAggregator', 'stats', this.stats);
    stateManager.set('eventAggregator', 'domains', Array.from(this.domains.keys()));
    
    const activeSagas = [];
    for (const [name, saga] of this.sagas) {
      for (const [id, instance] of saga.instances) {
        if (instance.state === 'running') {
          activeSagas.push({ name, id, progress: instance.currentStep });
        }
      }
    }
    stateManager.set('eventAggregator', 'activeSagas', activeSagas);
  }
}

// Singleton instance
let instance = null;

function getEventAggregator() {
  if (!instance) {
    instance = new EventAggregator();
  }
  return instance;
}

module.exports = {
  EventAggregator,
  getEventAggregator,
  eventAggregator: getEventAggregator()
};