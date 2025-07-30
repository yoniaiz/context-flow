/**
 * BuildEngine interface and related types
 * Central orchestrator for the Context Flow build process
 */

import type { ComponentSchema, WorkflowSchema } from './schema-definitions.js';
import { BuildError } from '../errors/base.js';

/**
 * Core build options that control how the build process executes
 */
export type BuildOptions = {
  /** Path to the workflow file to build */
  workflowFile?: string;
  /** Target platform/tool to generate output for */
  target?: string;
  /** Output file path (if not specified, writes to stdout) */
  output?: string;
  /** Enable watch mode for file changes */
  watch?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Working directory for relative path resolution */
  cwd?: string;
  /** Cache configuration */
  cache?: {
    enabled: boolean;
    maxSize?: number;
    ttl?: number;
  };
};

/**
 * Metadata about the build process
 */
export type BuildMetadata = {
  /** Start time of the build */
  startTime: Date;
  /** End time of the build */
  endTime?: Date;
  /** Total build duration in milliseconds */
  duration?: number;
  /** Number of components resolved */
  componentCount: number;
  /** Number of templates rendered */
  templateCount: number;
  /** Number of providers executed */
  providerCount: number;
  /** Cache hit/miss statistics */
  cacheStats?: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  /** Target used for the build */
  target?: string;
  /** Whether this was a watched build */
  fromWatch: boolean;
};

/**
 * Result of a build operation
 */
export type BuildResult = {
  /** Whether the build was successful */
  success: boolean;
  /** Final rendered content */
  content: string;
  /** Target-specific formatted output (if target specified) */
  targetOutput?: any;
  /** Build metadata and statistics */
  metadata: BuildMetadata;
  /** Any warnings generated during build */
  warnings: string[];
  /** Errors that occurred (if success is false) */
  errors?: BuildError[];
  /** Dependencies that were resolved */
  dependencies: ResolvedDependency[];
};

/**
 * Represents a resolved component dependency
 */
export type ResolvedDependency = {
  /** Alias used in the parent template */
  alias: string;
  /** File path of the component */
  path: string;
  /** Parsed component definition */
  definition: ComponentSchema;
  /** Resolved dependencies of this component */
  dependencies: ResolvedDependency[];
  /** Depth in the dependency tree */
  depth: number;
};

/**
 * Context passed to templates during rendering
 */
export type TemplateContext = {
  /** Current component being rendered */
  component: ComponentSchema;
  /** Resolved dependencies available to this template */
  dependencies: Record<string, ResolvedDependency>;
  /** Props passed to this component */
  props: Record<string, any>;
  /** Global context available to all templates */
  global: Record<string, any>;
  /** Functions for calling providers */
  providers: Record<string, ProviderFunction>;
  /** Functions for using other components */
  use: Record<string, ComponentFunction>;
};

/**
 * Function signature for provider calls in templates
 * Providers generate instruction strings for AI tools, not execute content
 */
export type ProviderFunction = (...args: any[]) => string;

/**
 * Function signature for component usage in templates
 */
export type ComponentFunction = (props?: Record<string, any>) => string;

/**
 * Configuration for the build engine
 */
export type BuildEngineConfig = {
  /** Maximum depth for dependency resolution to prevent infinite loops */
  maxDependencyDepth: number;
  /** Timeout for provider execution in milliseconds */
  providerTimeout: number;
  /** Whether to enable caching */
  enableCache: boolean;
  /** Cache configuration */
  cache: {
    maxSize: number;
    ttl: number;
  };
  /** Available target processors */
  targets: Record<string, TargetProcessor>;
  /** Available providers */
  providers: Record<string, Provider>;
};

/**
 * Main BuildEngine interface
 * Central orchestrator that coordinates all build processes
 */
export interface BuildEngine {
  /**
   * Execute a complete build process
   */
  build(options: BuildOptions): Promise<BuildResult>;

  /**
   * Start watch mode for continuous building
   */
  watch(options: BuildOptions): AsyncIterableIterator<BuildResult>;

  /**
   * Validate a workflow without building
   */
  validate(workflowPath: string): Promise<ValidationResult>;

  /**
   * Get the current configuration
   */
  getConfig(): BuildEngineConfig;

  /**
   * Update the configuration
   */
  updateConfig(config: Partial<BuildEngineConfig>): void;

  /**
   * Register a new target processor
   */
  registerTarget(name: string, processor: TargetProcessor): void;

  /**
   * Register a new provider
   */
  registerProvider(name: string, provider: Provider): void;

  /**
   * Clear all caches
   */
  clearCache(): void;
}

/**
 * Result of validation operation
 */
export type ValidationResult = {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors */
  errors: BuildError[];
  /** Validation warnings */
  warnings: string[];
  /** Resolved dependency tree (if valid) */
  dependencies?: ResolvedDependency[];
};

// Forward declarations for interfaces defined in other files
export interface TargetProcessor {
  process(content: string, config: any): Promise<any>;
}

export interface Provider {
  generateInstruction(args: any[], context: TemplateContext): string;
} 