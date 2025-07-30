/**
 * ProviderExecutor interface and related types
 * Handles instruction generation for providers within templates (@file, @git-diff, @url, etc.)
 */

import { TemplateContext } from './build-engine.js';
import { BuildError } from '../errors/base.js';

/**
 * Provider execution options
 */
export type ProviderExecutionOptions = {
  /** Working directory for relative path resolution */
  workingDirectory?: string;
  /** Environment variables for instruction context */
  environment?: Record<string, string>;
  /** Whether to validate provider arguments */
  validateArgs?: boolean;
};

/**
 * Provider execution result
 */
export type ProviderExecutionResult = {
  /** Whether instruction generation was successful */
  success: boolean;
  /** Generated instruction string */
  instruction: string;
  /** Warnings during instruction generation */
  warnings: string[];
  /** Errors that occurred */
  errors: ProviderError[];
  /** Execution metadata */
  metadata: {
    providerName: string;
    arguments: any[];
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
  type: 'validation' | 'instruction_generation';
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
  /** What type of instructions this provider generates */
  instructionType: 'file_read' | 'command_execution' | 'network_request' | 'data_query';
};

/**
 * Provider interface for instruction generation
 */
export interface Provider {
  /** Provider metadata */
  metadata: ProviderMetadata;

  /**
   * Generate instruction string for the AI tool
   */
  generateInstruction(args: any[], context: TemplateContext, options?: ProviderExecutionOptions): string;

  /**
   * Validate provider arguments
   */
  validateArgs(args: any[]): ProviderValidationResult;

  /**
   * Initialize the provider
   */
  initialize?(config?: any): void;
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
 * Built-in provider types for instruction generation
 */
export type BuiltInProviderType = 
  | 'file'        // Generate file read instructions
  | 'folder'      // Generate folder listing instructions
  | 'git-diff'    // Generate git diff instructions
  | 'url'         // Generate URL fetch instructions
  | 'env'         // Generate environment variable access instructions
  | 'shell'       // Generate shell command execution instructions
  | 'json'        // Generate JSON parsing/query instructions
  | 'yaml'        // Generate YAML parsing/query instructions
  | 'regex'       // Generate regex operation instructions
  | 'date'        // Generate date/time operation instructions
  | 'uuid';       // Generate UUID generation instructions

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
    instructionCount: number;
    errorCount: number;
  };
};

/**
 * Provider executor interface for instruction generation
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
   * Generate instruction using a provider
   */
  execute(
    providerName: string, 
    args: any[], 
    context: TemplateContext, 
    options?: ProviderExecutionOptions
  ): ProviderExecutionResult;

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
  /** Security configuration */
  security: {
    /** Allowed provider types */
    allowedProviders: string[];
    /** Whether to allow network instruction providers */
    allowNetwork: boolean;
    /** Whether to allow filesystem instruction providers */
    allowFilesystem: boolean;
    /** Whether to allow shell instruction providers */
    allowShell: boolean;
  };
};

/**
 * Provider execution statistics
 */
export type ProviderStats = {
  /** Total number of instruction generations */
  totalInstructions: number;
  /** Number of errors */
  errorCount: number;
  /** Error rate as percentage */
  errorRate: number;
  /** Per-provider statistics */
  providers: Record<string, {
    instructions: number;
    errors: number;
  }>;
};

/**
 * File provider specific types for instruction generation
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
 * URL provider specific types for instruction generation
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
 * Git diff provider specific types for instruction generation
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
 * Shell provider specific types for instruction generation
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