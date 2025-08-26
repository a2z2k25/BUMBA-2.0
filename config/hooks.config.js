/**
 * BUMBA Hooks Configuration Module
 */

module.exports = {
  load(customHooks = {}) {
    return {
      // Pre-execution hooks
      pre: {
        'command:validate': {
          enabled: true,
          priority: 100,
          handler: 'validateCommand',
          description: 'Validate command before execution'
        },
        'security:check': {
          enabled: true,
          priority: 90,
          handler: 'securityCheck',
          description: 'Security validation'
        },
        'resource:check': {
          enabled: true,
          priority: 80,
          handler: 'checkResources',
          description: 'Check resource availability'
        },
        'auth:verify': {
          enabled: true,
          priority: 70,
          handler: 'verifyAuth',
          description: 'Verify authentication'
        },
        ...customHooks.pre
      },
      
      // Post-execution hooks
      post: {
        'result:validate': {
          enabled: true,
          priority: 100,
          handler: 'validateResult',
          description: 'Validate execution result'
        },
        'quality:check': {
          enabled: true,
          priority: 90,
          handler: 'qualityCheck',
          description: 'Check result quality'
        },
        'metrics:collect': {
          enabled: true,
          priority: 80,
          handler: 'collectMetrics',
          description: 'Collect performance metrics'
        },
        'cache:update': {
          enabled: true,
          priority: 70,
          handler: 'updateCache',
          description: 'Update cache with results'
        },
        'notify:complete': {
          enabled: false,
          priority: 60,
          handler: 'notifyCompletion',
          description: 'Send completion notification'
        },
        ...customHooks.post
      },
      
      // Error hooks
      error: {
        'error:log': {
          enabled: true,
          priority: 100,
          handler: 'logError',
          description: 'Log error details'
        },
        'error:recover': {
          enabled: true,
          priority: 90,
          handler: 'attemptRecovery',
          description: 'Attempt error recovery'
        },
        'error:notify': {
          enabled: false,
          priority: 80,
          handler: 'notifyError',
          description: 'Send error notification'
        },
        ...customHooks.error
      },
      
      // Department-specific hooks
      department: {
        'product:beforeAnalysis': {
          enabled: true,
          department: 'product-strategist',
          handler: 'beforeProductAnalysis'
        },
        'design:beforeRender': {
          enabled: true,
          department: 'design-engineer',
          handler: 'beforeDesignRender'
        },
        'backend:beforeDeploy': {
          enabled: true,
          department: 'backend-engineer',
          handler: 'beforeBackendDeploy'
        },
        ...customHooks.department
      },
      
      // Integration hooks
      integration: {
        'notion:beforeSync': {
          enabled: true,
          integration: 'notion',
          handler: 'beforeNotionSync'
        },
        'github:beforePush': {
          enabled: true,
          integration: 'github',
          handler: 'beforeGithubPush'
        },
        'database:beforeQuery': {
          enabled: true,
          integration: 'database',
          handler: 'beforeDatabaseQuery'
        },
        ...customHooks.integration
      },
      
      // System hooks
      system: {
        'startup:before': {
          enabled: true,
          priority: 100,
          handler: 'beforeStartup'
        },
        'startup:after': {
          enabled: true,
          priority: 100,
          handler: 'afterStartup'
        },
        'shutdown:before': {
          enabled: true,
          priority: 100,
          handler: 'beforeShutdown'
        },
        'shutdown:after': {
          enabled: true,
          priority: 100,
          handler: 'afterShutdown'
        },
        ...customHooks.system
      },
      
      // Hook settings
      settings: {
        enablePreHooks: customHooks.settings?.enablePreHooks !== false,
        enablePostHooks: customHooks.settings?.enablePostHooks !== false,
        enableErrorHooks: customHooks.settings?.enableErrorHooks !== false,
        stopOnHookFailure: customHooks.settings?.stopOnHookFailure !== false,
        hookTimeout: customHooks.settings?.hookTimeout || 5000,
        maxHookRetries: customHooks.settings?.maxHookRetries || 2
      }
    };
  }
};