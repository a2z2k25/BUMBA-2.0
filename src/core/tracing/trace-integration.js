/**
 * BUMBA Trace Integration
 * Adds tracing to critical system paths
 * 
 * SOLVES: Need to trace data through command router, managers, specialists
 * RESULT: Full visibility into task execution
 */

const { getTaskFlowRegistry } = require('./task-flow');
const { logger } = require('../logging/bumba-logger');

/**
 * Add tracing to command router
 */
function traceCommandRouter(router) {
  const originalExecute = router.execute;
  
  router.execute = async function(command, args) {
    const registry = getTaskFlowRegistry();
    const flow = registry.createFlow(`command:${command}`, { command, args });
    
    try {
      // Trace command parsing
      const parseStep = flow.startStep('CommandRouter', 'parse');
      const parsed = this.parseCommand(command);
      parseStep.end({ output: parsed });
      
      // Trace routing decision
      const routeStep = flow.startStep('CommandRouter', 'route');
      const handler = this.findHandler(parsed);
      routeStep.end({ output: handler ? handler.name : 'not found' });
      
      // Store flow in context
      if (args && typeof args === 'object') {
        args._taskFlow = flow;
      }
      
      // Execute with tracing
      const execStep = flow.startStep('CommandRouter', 'execute');
      const result = await originalExecute.call(this, command, args);
      execStep.end({ status: 'success', output: result });
      
      // Complete flow
      registry.completeFlow(flow.taskId);
      
      return result;
    } catch (error) {
      flow.addError('CommandRouter', error);
      registry.completeFlow(flow.taskId);
      throw error;
    }
  };
  
  logger.info('Command router tracing enabled');
}

/**
 * Add tracing to department managers
 */
function traceManager(manager) {
  const originalValidate = manager.validate;
  const originalAssign = manager.assignSpecialist;
  
  if (originalValidate) {
    manager.validate = async function(work, context) {
      const flow = context?._taskFlow || getTaskFlowRegistry().createFlow('validation');
      
      const step = flow.startStep(this.constructor.name, 'validate');
      try {
        const result = await originalValidate.call(this, work, context);
        step.end({ status: 'success', output: { valid: result.valid } });
        return result;
      } catch (error) {
        step.end({ status: 'error', error: error.message });
        throw error;
      }
    };
  }
  
  if (originalAssign) {
    manager.assignSpecialist = async function(task, context) {
      const flow = context?._taskFlow || getTaskFlowRegistry().createFlow('assignment');
      
      const step = flow.startStep(this.constructor.name, 'assignSpecialist');
      try {
        const specialist = await originalAssign.call(this, task, context);
        step.end({ 
          status: 'success', 
          output: specialist ? specialist.name : 'none assigned' 
        });
        return specialist;
      } catch (error) {
        step.end({ status: 'error', error: error.message });
        throw error;
      }
    };
  }
}

/**
 * Add tracing to specialists
 */
function traceSpecialist(specialist) {
  const originalProcess = specialist.process;
  const originalExecute = specialist.execute;
  
  if (originalProcess) {
    specialist.process = async function(input, context) {
      const flow = context?._taskFlow || getTaskFlowRegistry().createFlow('specialist-process');
      
      const step = flow.startStep(this.constructor.name, 'process');
      flow.setData('specialist', this.name);
      flow.setData('input', input);
      
      try {
        const result = await originalProcess.call(this, input, context);
        step.end({ status: 'success', output: result });
        return result;
      } catch (error) {
        step.end({ status: 'error', error: error.message });
        throw error;
      }
    };
  }
  
  if (originalExecute) {
    specialist.execute = async function(task, context) {
      const flow = context?._taskFlow || getTaskFlowRegistry().createFlow('specialist-execute');
      
      const step = flow.startStep(this.constructor.name, 'execute');
      try {
        const result = await originalExecute.call(this, task, context);
        step.end({ status: 'success', output: result });
        return result;
      } catch (error) {
        step.end({ status: 'error', error: error.message });
        throw error;
      }
    };
  }
}

/**
 * Add tracing to hook system
 */
function traceHooks(hookSystem) {
  const originalExecute = hookSystem.executeHook;
  
  if (originalExecute) {
    hookSystem.executeHook = async function(hookName, data) {
      const flow = data?._taskFlow || getTaskFlowRegistry().createFlow(`hook:${hookName}`);
      
      const step = flow.startStep('HookSystem', hookName);
      try {
        const result = await originalExecute.call(this, hookName, data);
        step.end({ status: 'success', output: result });
        return result;
      } catch (error) {
        step.end({ status: 'error', error: error.message });
        throw error;
      }
    };
  }
}

/**
 * Add tracing to API calls
 */
function traceAPI(apiClient) {
  const originalRequest = apiClient.request || apiClient.call;
  
  if (originalRequest) {
    const methodName = apiClient.request ? 'request' : 'call';
    apiClient[methodName] = async function(endpoint, data) {
      const flow = data?._taskFlow || getTaskFlowRegistry().createFlow(`api:${endpoint}`);
      
      const step = flow.startStep('API', endpoint);
      flow.setData('endpoint', endpoint);
      flow.setData('requestSize', JSON.stringify(data).length);
      
      try {
        const result = await originalRequest.call(this, endpoint, data);
        flow.setData('responseSize', JSON.stringify(result).length);
        step.end({ status: 'success', output: { size: JSON.stringify(result).length } });
        return result;
      } catch (error) {
        step.end({ status: 'error', error: error.message });
        throw error;
      }
    };
  }
}

/**
 * Enable tracing for all critical paths
 */
function enableTracing(components = {}) {
  const { 
    commandRouter, 
    managers = [], 
    specialists = [], 
    hookSystem,
    apiClient 
  } = components;
  
  let tracedCount = 0;
  
  if (commandRouter) {
    traceCommandRouter(commandRouter);
    tracedCount++;
  }
  
  managers.forEach(manager => {
    traceManager(manager);
    tracedCount++;
  });
  
  specialists.forEach(specialist => {
    traceSpecialist(specialist);
    tracedCount++;
  });
  
  if (hookSystem) {
    traceHooks(hookSystem);
    tracedCount++;
  }
  
  if (apiClient) {
    traceAPI(apiClient);
    tracedCount++;
  }
  
  logger.info(`Tracing enabled for ${tracedCount} components`);
  
  return tracedCount;
}

/**
 * Create traced wrapper for any async function
 */
function createTracedFunction(fn, component, action) {
  return async function(...args) {
    const registry = getTaskFlowRegistry();
    const flow = registry.createFlow(`${component}:${action}`);
    const step = flow.startStep(component, action);
    
    try {
      const result = await fn.apply(this, args);
      step.end({ status: 'success' });
      registry.completeFlow(flow.taskId);
      return result;
    } catch (error) {
      step.end({ status: 'error', error: error.message });
      flow.addError(component, error);
      registry.completeFlow(flow.taskId);
      throw error;
    }
  };
}

/**
 * Middleware for Express-like frameworks
 */
function tracingMiddleware(req, res, next) {
  const registry = getTaskFlowRegistry();
  const flow = registry.createFlow(`http:${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query
  });
  
  req.taskFlow = flow;
  
  // Trace request
  flow.addStep('HTTP', 'request', {
    input: {
      method: req.method,
      path: req.path,
      headers: req.headers
    }
  });
  
  // Override res.json to trace response
  const originalJson = res.json;
  res.json = function(data) {
    flow.addStep('HTTP', 'response', {
      output: { statusCode: res.statusCode, size: JSON.stringify(data).length }
    });
    registry.completeFlow(flow.taskId);
    return originalJson.call(this, data);
  };
  
  next();
}

module.exports = {
  traceCommandRouter,
  traceManager,
  traceSpecialist,
  traceHooks,
  traceAPI,
  enableTracing,
  createTracedFunction,
  tracingMiddleware
};