/**
 * ProviderExecutor interface and related types
 * Handles execution of providers within templates (@file, @git-diff, @url, etc.)
 */

import { TemplateContext } from './build-engine.js';
import { BuildError } from '../errors/base.js';

/**
 * Provider execution options
 */
export type ProviderExecutionOptions = {
  /** Timeout for provider execution in milliseconds */
  timeout?: number;
  /** Whether to cache provider results */
  cache?: boolean;
  /** Cache TTL in milliseconds */
  cacheTtl?: number;
  /** Working directory for relative path resolution */
  workingDirectory?: string;
  /** Environment variables for provider execution */
  environment?: Record<string, string>;
  /** Whether to validate provider arguments */
  validateArgs?: boolean;
  /** Maximum output size in bytes */
  maxOutputSize?: number;
};

/**
 * Provider execution result
 */
export type ProviderExecutionResult = {
  /** Whether execution was successful */
  success: boolean;
  /** Provider output content */
  output: string;
  /** Execution duration in milliseconds */
  duration: number;
  /** Whether result was from cache */
  fromCache: boolean;
  /** Warnings during execution */
  warnings: string[];
  /** Errors that occurred */
  errors: ProviderError[];
  /** Execution metadata */
  metadata: {
    providerName: string;
    arguments: any[];
    outputSize: number;
    cacheKey?: string;
  };
};

/**
 * Provider error information
 */
export type ProviderError = {
  /** Error message */
  message: string;
  /** Error code */
  code?: string;
  /** Provider that caused the error */
  provider: string;
  /** Arguments that caused the error */
  args?: any[];
  /** Underlying error */
  cause?: Error;
  /** Error type */
  type: 'timeout' | 'validation' | 'execution' | 'network' | 'filesystem' | 'permission';
};

/**
 * Provider argument schema
 */
export type ProviderArgumentSchema = {
  /** Argument name */
  name: string;
  /** Argument type */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  /** Whether argument is required */
  required: boolean;
  /** Argument description */
  description: string;
  /** Default value */
  default?: any;
  /** Validation rules */
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: any[];
  };
};

/**
 * Provider metadata
 */
export type ProviderMetadata = {
  /** Provider name */
  name: string;
  /** Provider version */
  version: string;
  /** Provider description */
  description: string;
  /** Provider author */
  author?: string;
  /** Argument schema */
  arguments: ProviderArgumentSchema[];
  /** Examples of usage */
  examples?: string[];
  /** Provider categories/tags */
  tags?: string[];
  /** Whether provider requires network access */
  requiresNetwork?: boolean;
  /** Whether provider requires filesystem access */
  requiresFilesystem?: boolean;
};

/**
 * Provider interface
 */
export interface Provider {
  /** Provider metadata */
  metadata: ProviderMetadata;

  /**
   * Execute the provider with given arguments
   */
  execute(args: any[], context: TemplateContext, options?: ProviderExecutionOptions): Promise<string>;

  /**
   * Validate provider arguments
   */
  validateArgs(args: any[]): ProviderValidationResult;

  /**
   * Initialize the provider
   */
  initialize?(config?: any): Promise<void>;

  /**
   * Cleanup provider resources
   */
  cleanup?(): Promise<void>;

  /**
   * Get cache key for given arguments
   */
  getCacheKey?(args: any[], context: TemplateContext): string;
}

/**
 * Provider validation result
 */
export type ProviderValidationResult = {
  /** Whether arguments are valid */
  valid: boolean;
  /** Validation errors */
  errors: ProviderValidationError[];
  /** Validation warnings */
  warnings: string[];
  /** Normalized arguments */
  normalizedArgs?: any[];
};

/**
 * Provider validation error
 */
export type ProviderValidationError = {
  /** Error message */
  message: string;
  /** Argument index that caused the error */
  argIndex?: number;
  /** Argument name that caused the error */
  argName?: string;
  /** Error type */
  type: 'missing_required' | 'invalid_type' | 'invalid_value' | 'too_many_args' | 'too_few_args';
  /** Expected value or type */
  expected?: string;
  /** Actual value */
  actual?: any;
};

/**
 * Built-in provider types
 */
export type BuiltInProviderType = 
  | 'file'        // Read file content
  | 'folder'      // List folder contents
  | 'git-diff'    // Get git differences
  | 'url'         // Fetch URL content
  | 'env'         // Get environment variables
  | 'shell'       // Execute shell commands
  | 'json'        // Parse/query JSON
  | 'yaml'        // Parse/query YAML
  | 'regex'       // Regular expression operations
  | 'date'        // Date/time operations
  | 'uuid';       // Generate UUIDs

/**
 * Provider registry entry
 */
export type ProviderRegistryEntry = {
  /** Provider name */
  name: string;
  /** Provider instance */
  provider: Provider;
  /** Whether this is a built-in provider */
  builtin: boolean;
  /** Registration timestamp */
  registeredAt: Date;
  /** Whether the provider is enabled */
  enabled: boolean;
  /** Usage statistics */
  stats: {
    executionCount: number;
    totalDuration: number;
    errorCount: number;
    cacheHits: number;
  };
};

/**
 * Provider executor interface
 */
export interface ProviderExecutor {
  /**
   * Register a provider
   */
  register(name: string, provider: Provider): void;

  /**
   * Unregister a provider
   */
  unregister(name: string): boolean;

  /**
   * Execute a provider by name
   */
  execute(
    providerName: string, 
    args: any[], 
    context: TemplateContext, 
    options?: ProviderExecutionOptions
  ): Promise<ProviderExecutionResult>;

  /**
   * Get provider by name
   */
  getProvider(name: string): Provider | undefined;

  /**
   * Get all registered providers
   */
  getProviders(): ProviderRegistryEntry[];

  /**
   * Get available provider names
   */
  getProviderNames(): string[];

  /**
   * Check if a provider is registered
   */
  hasProvider(name: string): boolean;

  /**
   * Enable or disable a provider
   */
  setProviderEnabled(name: string, enabled: boolean): void;

  /**
   * Clear provider cache
   */
  clearCache(providerName?: string): void;

  /**
   * Get provider execution statistics
   */
  getStats(providerName?: string): ProviderStats;

  /**
   * Configure global provider execution options
   */
  configure(options: Partial<ProviderExecutorConfig>): void;
}

/**
 * Provider executor configuration
 */
export type ProviderExecutorConfig = {
  /** Default execution options */
  defaultOptions: ProviderExecutionOptions;
  /** Cache configuration */
  cache: {
    enabled: boolean;
    maxSize: number;
    defaultTtl: number;
  };
  /** Security configuration */
  security: {
    /** Allowed provider types */
    allowedProviders: string[];
    /** Whether to allow network providers */
    allowNetwork: boolean;
    /** Whether to allow filesystem providers */
    allowFilesystem: boolean;
    /** Whether to allow shell providers */
    allowShell: boolean;
    /** Maximum execution time per provider */
    maxExecutionTime: number;
    /** Maximum output size per provider */
    maxOutputSize: number;
  };
};

/**
 * Provider execution statistics
 */
export type ProviderStats = {
  /** Total number of executions */
  totalExecutions: number;
  /** Total execution time */
  totalDuration: number;
  /** Average execution time */
  averageDuration: number;
  /** Number of errors */
  errorCount: number;
  /** Error rate as percentage */
  errorRate: number;
  /** Number of cache hits */
  cacheHits: number;
  /** Cache hit rate as percentage */
  cacheHitRate: number;
  /** Memory usage estimate */
  memoryUsage: number;
  /** Per-provider statistics */
  providers: Record<string, {
    executions: number;
    duration: number;
    errors: number;
    cacheHits: number;
  }>;
};

/**
 * File provider specific types
 */
export type FileProviderArgs = {
  /** File path to read */
  path: string;
  /** Encoding (default: utf8) */
  encoding?: string;
  /** Line range to read (start:end) */
  lines?: string;
  /** Whether to include line numbers */
  lineNumbers?: boolean;
};

/**
 * URL provider specific types
 */
export type URLProviderArgs = {
  /** URL to fetch */
  url: string;
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  body?: any;
  /** Timeout in milliseconds */
  timeout?: number;
};

/**
 * Git diff provider specific types
 */
export type GitDiffProviderArgs = {
  /** Base commit/branch */
  base?: string;
  /** Target commit/branch */
  target?: string;
  /** Specific file paths */
  paths?: string[];
  /** Whether to include only staged changes */
  staged?: boolean;
  /** Context lines around changes */
  context?: number;
};

/**
 * Shell provider specific types
 */
export type ShellProviderArgs = {
  /** Command to execute */
  command: string;
  /** Working directory */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Whether to capture stderr */
  captureStderr?: boolean;
};

/**
 * Provider cache entry
 */
export type ProviderCacheEntry = {
  /** Cached result */
  result: string;
  /** Cache timestamp */
  timestamp: Date;
  /** Cache key */
  key: string;
  /** TTL in milliseconds */
  ttl: number;
  /** Provider name */
  provider: string;
  /** Arguments hash */
  argsHash: string;
}; 