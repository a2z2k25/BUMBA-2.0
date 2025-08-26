/**
 * BUMBA Failure Wrapper Utilities
 */

const { getInstance: getFailureManager } = require('./unified-failure-manager');

/**
 * Wrap an async function with failure handling
 */
function withFailureHandling(fn, context = {}) {
  const failureManager = getFailureManager();
  return failureManager.wrap(fn, context);
}

/**
 * Wrap a class method with failure handling
 */
function wrapMethod(target, methodName, context = {}) {
  const original = target[methodName];
  
  if (typeof original !== 'function') {
    throw new Error(`${methodName} is not a function`);
  }
  
  target[methodName] = withFailureHandling(original.bind(target), {
    ...context,
    method: methodName,
    class: target.constructor.name
  });
}

/**
 * Wrap all methods of a class
 */
function wrapClass(targetClass, context = {}) {
  const prototype = targetClass.prototype;
  const methodNames = Object.getOwnPropertyNames(prototype)
    .filter(name => {
      if (name === 'constructor') return false;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
      return typeof descriptor.value === 'function';
    });
  
  for (const methodName of methodNames) {
    wrapMethod(prototype, methodName, {
      ...context,
      class: targetClass.name
    });
  }
}

/**
 * Create a safe async function
 */
function createSafeAsync(fn, context = {}) {
  return async (...args) => {
    const failureManager = getFailureManager();
    
    try {
      return await fn(...args);
    } catch (error) {
      const result = await failureManager.handleFailure(error, {
        ...context,
        args: args.length
      });
      
      if (!result.recovered) {
        throw error;
      }
      
      // Retry once if recovered
      return await fn(...args);
    }
  };
}

module.exports = {
  withFailureHandling,
  wrapMethod,
  wrapClass,
  createSafeAsync
};