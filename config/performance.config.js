/**
 * BUMBA Performance Configuration Module
 */

module.exports = {
  load(customPerformance = {}) {
    return {
      // Resource limits
      limits: {
        memory: {
          max: customPerformance.limits?.memory?.max || 512 * 1024 * 1024, // 512MB
          warning: customPerformance.limits?.memory?.warning || 400 * 1024 * 1024, // 400MB
          check: customPerformance.limits?.memory?.check !== false
        },
        cpu: {
          max: customPerformance.limits?.cpu?.max || 80, // 80%
          warning: customPerformance.limits?.cpu?.warning || 60, // 60%
          check: customPerformance.limits?.cpu?.check !== false
        },
        concurrent: {
          maxTasks: customPerformance.limits?.concurrent?.maxTasks || 10,
          maxDepartments: customPerformance.limits?.concurrent?.maxDepartments || 3,
          maxSpecialists: customPerformance.limits?.concurrent?.maxSpecialists || 5
        },
        timeout: {
          command: customPerformance.limits?.timeout?.command || 30000, // 30s
          task: customPerformance.limits?.timeout?.task || 60000, // 60s
          api: customPerformance.limits?.timeout?.api || 10000, // 10s
          initialization: customPerformance.limits?.timeout?.initialization || 30000 // 30s
        }
      },
      
      // Caching
      cache: {
        enabled: customPerformance.cache?.enabled !== false,
        strategy: customPerformance.cache?.strategy || 'lru', // lru, lfu, ttl
        maxSize: customPerformance.cache?.maxSize || 100 * 1024 * 1024, // 100MB
        maxItems: customPerformance.cache?.maxItems || 1000,
        ttl: customPerformance.cache?.ttl || 3600000, // 1 hour
        categories: {
          commands: {
            enabled: true,
            ttl: 1800000, // 30 min
            maxItems: 100
          },
          specialists: {
            enabled: true,
            ttl: 3600000, // 1 hour
            maxItems: 50
          },
          integrations: {
            enabled: true,
            ttl: 7200000, // 2 hours
            maxItems: 30
          },
          ...customPerformance.cache?.categories
        }
      },
      
      // Optimization
      optimization: {
        lazy: {
          specialists: customPerformance.optimization?.lazy?.specialists !== false,
          integrations: customPerformance.optimization?.lazy?.integrations !== false,
          departments: customPerformance.optimization?.lazy?.departments || false
        },
        pooling: {
          enabled: customPerformance.optimization?.pooling?.enabled !== false,
          minSize: customPerformance.optimization?.pooling?.minSize || 2,
          maxSize: customPerformance.optimization?.pooling?.maxSize || 10,
          idleTimeout: customPerformance.optimization?.pooling?.idleTimeout || 60000
        },
        batching: {
          enabled: customPerformance.optimization?.batching?.enabled || false,
          size: customPerformance.optimization?.batching?.size || 10,
          timeout: customPerformance.optimization?.batching?.timeout || 100
        }
      },
      
      // Monitoring
      monitoring: {
        enabled: customPerformance.monitoring?.enabled !== false,
        interval: customPerformance.monitoring?.interval || 60000, // 1 min
        metrics: {
          memory: true,
          cpu: true,
          response_time: true,
          throughput: true,
          error_rate: true,
          cache_hit_rate: true,
          ...customPerformance.monitoring?.metrics
        },
        alerts: {
          enabled: customPerformance.monitoring?.alerts?.enabled || false,
          thresholds: {
            memory: 90, // %
            cpu: 90, // %
            error_rate: 5, // %
            response_time: 5000, // ms
            ...customPerformance.monitoring?.alerts?.thresholds
          }
        }
      },
      
      // Profiling
      profiling: {
        enabled: customPerformance.profiling?.enabled || false,
        cpu: customPerformance.profiling?.cpu || false,
        memory: customPerformance.profiling?.memory || false,
        async: customPerformance.profiling?.async || false,
        outputDir: customPerformance.profiling?.outputDir || './profiles'
      },
      
      // Startup optimization
      startup: {
        parallel: customPerformance.startup?.parallel || false,
        defer: {
          optional: customPerformance.startup?.defer?.optional !== false,
          monitoring: customPerformance.startup?.defer?.monitoring !== false,
          integrations: customPerformance.startup?.defer?.integrations || false
        },
        preload: {
          commands: customPerformance.startup?.preload?.commands || false,
          specialists: customPerformance.startup?.preload?.specialists || false
        }
      },
      
      // Garbage collection
      gc: {
        aggressive: customPerformance.gc?.aggressive || false,
        interval: customPerformance.gc?.interval || 300000, // 5 min
        onMemoryPressure: customPerformance.gc?.onMemoryPressure !== false
      }
    };
  }
};