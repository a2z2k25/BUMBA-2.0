/**
 * BUMBA Framework TypeScript Definitions
 * Optional TypeScript support for better IDE experience
 * 
 * NOTE: This is a declaration file only (.d.ts) - no actual TypeScript code
 * The framework remains pure JavaScript with optional type hints
 */

declare module 'bumba-claude' {
  // Core Framework
  export interface BumbaConfig {
    mode?: 'full' | 'lite';
    config?: FrameworkConfig;
    skipInit?: boolean;
  }

  export interface FrameworkConfig {
    framework?: {
      version?: string;
      mode?: string;
    };
    performance?: {
      maxMemoryMB?: number;
      maxAgents?: number;
    };
    security?: {
      validateCommands?: boolean;
      sanitizeInputs?: boolean;
    };
    departments?: {
      strategic?: DepartmentConfig;
      technical?: DepartmentConfig;
      experience?: DepartmentConfig;
    };
  }

  export interface DepartmentConfig {
    enabled?: boolean;
    maxSpecialists?: number;
  }

  export interface CommandResult {
    success: boolean;
    result: any;
    agent: string;
    duration: number;
    metadata: {
      tokens: number;
      memory: number;
      quality: QualityMetrics;
    };
  }

  export interface QualityMetrics {
    score: number;
    issues: string[];
    suggestions: string[];
  }

  export interface Context {
    user: string;
    project?: string;
    role?: string;
    permissions?: string[];
    skipPermissionCheck?: boolean;
  }

  export interface RoutingDecision {
    agent: string;
    confidence: number;
    reasoning: string;
    specialists: string[];
    alternativeAgents: string[];
  }

  export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    lastCheck: number | null;
    checks: Record<string, HealthCheck>;
    summary: {
      total: number;
      healthy: number;
      unhealthy: number;
      percentage: number;
    };
  }

  export interface HealthCheck {
    healthy: boolean;
    details: any;
    error?: string;
  }

  export interface ValidationResult {
    valid: boolean;
    error?: string;
    sanitized?: {
      command: string;
      args: string[];
    };
    permissions?: string[];
  }

  export interface Agent {
    id: string;
    type: string;
    status: 'active' | 'idle' | 'terminated';
    created: number;
    config: any;
    execute(task: any): Promise<any>;
    destroy(): void;
  }

  // Main Framework Class
  export class BumbaFramework2 {
    constructor(config?: BumbaConfig);
    processCommand(command: string, args: string[], context: Context): Promise<CommandResult>;
    getHealth(): HealthStatus;
    getPerformanceMetrics(): any;
    shutdown(): Promise<void>;
  }

  // Routing System
  export class UnifiedRoutingSystem {
    static getInstance(): UnifiedRoutingSystem;
    route(command: string, args: string[], context: Context): Promise<RoutingDecision>;
    registerDepartment(name: string, department: DepartmentManager): void;
    executeRouting(task: any, routing: RoutingDecision): Promise<any>;
    getStatistics(): any;
  }

  export class BumbaIntelligentRouter extends UnifiedRoutingSystem {}

  // Department Managers
  export abstract class DepartmentManager {
    canHandle(task: any, confidence: number): Promise<boolean>;
    execute(task: any, routing: RoutingDecision): Promise<any>;
    getCapabilities(): string[];
    spawnSpecialist(type: string, config?: any): Promise<Agent>;
  }

  export class ProductStrategistManager extends DepartmentManager {}
  export class DesignEngineerManager extends DepartmentManager {}
  export class BackendEngineerManager extends DepartmentManager {}

  // Security
  export class CommandValidator {
    validateCommand(command: string, args: string[], context: Context): Promise<ValidationResult>;
    validateCommandSync(command: string, args: string[]): ValidationResult;
    validateFilePath(path: string): boolean;
  }

  export class SecureExecutor {
    execute(command: string, args: string[], options?: any): Promise<any>;
    executeFile(filePath: string, args: string[], options?: any): Promise<any>;
    sanitizeEnvironment(env: Record<string, string>): Record<string, string>;
  }

  // Health Monitoring
  export class HealthCheckSystem {
    static getInstance(): HealthCheckSystem;
    registerCheck(name: string, checkFunction: () => Promise<HealthCheck>): void;
    runHealthChecks(): Promise<any>;
    getHealth(): HealthStatus;
    getHealthEndpoint(): (req: any, res: any) => Promise<void>;
    getLivenessEndpoint(): (req: any, res: any) => void;
    getReadinessEndpoint(): (req: any, res: any) => Promise<void>;
  }

  // Configuration
  export class ConfigurationManager {
    static getInstance(): ConfigurationManager;
    get(path: string, defaultValue?: any): any;
    set(path: string, value: any): void;
    validate(): { valid: boolean; errors: string[] };
    saveConfiguration(): void;
    mergeConfig(config: any): void;
    reset(): void;
    export(): string;
    import(json: string): { success: boolean; error?: string };
  }

  // Error Handling
  export class BumbaError extends Error {
    constructor(code: string, message: string, options?: {
      recoverable?: boolean;
      retryable?: boolean;
      fallback?: string;
    });
    code: string;
    recoverable: boolean;
    retryable: boolean;
    fallback?: string;
  }

  export class BumbaErrorBoundary {
    static wrap<T>(
      operation: () => Promise<T>,
      fallback: () => Promise<T>,
      options?: { context?: string }
    ): Promise<T>;
  }

  // Agent System
  export class SimplifiedAgentSystem {
    createAgent(type: string, config?: any): Promise<Agent>;
    getAgent(id: string): Agent | undefined;
    destroyAgent(id: string): boolean;
    executeWithBestAgent(task: any, preferredType?: string): Promise<any>;
    getStats(): any;
  }

  // Resource Management
  export class ResourceManager {
    static getInstance(): ResourceManager;
    allocate(type: string, amount: number): Promise<{ success: boolean; id?: string }>;
    release(allocationId: string): void;
    getUsage(): any;
  }
}

// Department-specific exports
declare module 'bumba-claude/departments' {
  export { ProductStrategistManager, DesignEngineerManager, BackendEngineerManager } from 'bumba-claude';
}

declare module 'bumba-claude/security' {
  export { CommandValidator, SecureExecutor } from 'bumba-claude';
}

declare module 'bumba-claude/monitoring' {
  export { HealthCheckSystem } from 'bumba-claude';
}

declare module 'bumba-claude/config' {
  export { ConfigurationManager } from 'bumba-claude';
}

declare module 'bumba-claude/errors' {
  export { BumbaError, BumbaErrorBoundary } from 'bumba-claude';
}

declare module 'bumba-claude/agents' {
  export { SimplifiedAgentSystem } from 'bumba-claude';
}

declare module 'bumba-claude/core' {
  export { UnifiedRoutingSystem, BumbaIntelligentRouter, ResourceManager } from 'bumba-claude';
}