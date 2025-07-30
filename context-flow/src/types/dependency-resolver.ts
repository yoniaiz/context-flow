/**
 * DependencyResolver interface and related types
 * Handles component dependency resolution, cycle detection, and topological sorting
 */

import type { ComponentSchema, WorkflowSchema } from './schema-definitions.js';
import { ResolvedDependency } from './build-engine.js';
import { BuildError } from '../errors/base.js';

/**
 * Dependency resolution options
 */
export type DependencyResolutionOptions = {
  /** Maximum depth to resolve dependencies (prevents infinite loops) */
  maxDepth?: number;
  /** Base directory for resolving relative paths */
  baseDir?: string;
  /** Whether to resolve dependencies recursively */
  recursive?: boolean;
  /** Whether to enable caching of resolved dependencies */
  cache?: boolean;
  /** Whether to perform strict validation */
  strict?: boolean;
};

/**
 * Dependency resolution result
 */
export type DependencyResolutionResult = {
  /** Whether resolution was successful */
  success: boolean;
  /** Resolved dependency tree */
  dependencies: ResolvedDependency[];
  /** Topologically sorted execution order */
  executionOrder: string[];
  /** Resolution metadata */
  metadata: DependencyResolutionMetadata;
  /** Warnings during resolution */
  warnings: string[];
  /** Errors that occurred */
  errors: BuildError[];
};

/**
 * Metadata about dependency resolution
 */
export type DependencyResolutionMetadata = {
  /** Total number of dependencies resolved */
  totalDependencies: number;
  /** Maximum depth reached */
  maxDepthReached: number;
  /** Time taken to resolve dependencies */
  resolutionTime: number;
  /** Number of cache hits */
  cacheHits: number;
  /** Number of cache misses */
  cacheMisses: number;
  /** Detected cycles (if any) */
  cycles: DependencyCycle[];
};

/**
 * Represents a dependency cycle
 */
export type DependencyCycle = {
  /** Components involved in the cycle */
  components: string[];
  /** Depth at which cycle was detected */
  depth: number;
  /** Description of the cycle */
  description: string;
};

/**
 * Dependency graph node
 */
export type DependencyNode = {
  /** Component file path */
  path: string;
  /** Alias used to reference this component */
  alias: string;
  /** Parsed component definition */
  definition: ComponentSchema;
  /** Direct dependencies of this node */
  dependencies: DependencyNode[];
  /** Components that depend on this node */
  dependents: DependencyNode[];
  /** Depth in the dependency tree */
  depth: number;
  /** Whether this node has been visited during traversal */
  visited: boolean;
  /** Temporary mark for cycle detection */
  visiting: boolean;
};

/**
 * Dependency graph representation
 */
export type DependencyGraph = {
  /** Root nodes (entry points) */
  roots: DependencyNode[];
  /** All nodes in the graph */
  nodes: Map<string, DependencyNode>;
  /** Adjacency list representation */
  adjacencyList: Map<string, string[]>;
  /** Reverse adjacency list (dependents) */
  reverseAdjacencyList: Map<string, string[]>;
  /** Detected cycles */
  cycles: DependencyCycle[];
};

/**
 * Cache entry for resolved dependencies
 */
export type DependencyCacheEntry = {
  /** Resolved dependencies */
  dependencies: ResolvedDependency[];
  /** Timestamp when cached */
  timestamp: Date;
  /** File modification times for cache invalidation */
  fileMtimes: Map<string, Date>;
  /** Hash of the component content */
  contentHash: string;
};

/**
 * Dependency resolver configuration
 */
export type DependencyResolverConfig = {
  /** Default resolution options */
  defaultOptions: DependencyResolutionOptions;
  /** Cache configuration */
  cache: {
    enabled: boolean;
    maxSize: number;
    ttl: number;
  };
  /** File system access configuration */
  fileSystem: {
    /** Whether to follow symbolic links */
    followSymlinks: boolean;
    /** File extensions to consider for components */
    componentExtensions: string[];
    /** Maximum file size to process */
    maxFileSize: number;
  };
};

/**
 * DependencyResolver interface for resolving component dependencies
 */
export interface DependencyResolver {
  /**
   * Configure the dependency resolver
   */
  configure(config: Partial<DependencyResolverConfig>): void;

  /**
   * Resolve dependencies for a workflow
   */
  resolveWorkflow(workflow: WorkflowSchema, options?: DependencyResolutionOptions): Promise<DependencyResolutionResult>;

  /**
   * Resolve dependencies for a component
   */
  resolveComponent(component: ComponentSchema, componentPath: string, options?: DependencyResolutionOptions): Promise<DependencyResolutionResult>;

  /**
   * Build dependency graph from entry point
   */
  buildGraph(entryPoint: string, options?: DependencyResolutionOptions): Promise<DependencyGraph>;

  /**
   * Detect cycles in dependency graph
   */
  detectCycles(graph: DependencyGraph): DependencyCycle[];

  /**
   * Perform topological sort on dependency graph
   */
  topologicalSort(graph: DependencyGraph): string[];

  /**
   * Validate dependency graph
   */
  validateGraph(graph: DependencyGraph): DependencyValidationResult;

  /**
   * Get cached dependencies
   */
  getCachedDependencies(key: string): DependencyCacheEntry | undefined;

  /**
   * Cache resolved dependencies
   */
  cacheDependencies(key: string, entry: DependencyCacheEntry): void;

  /**
   * Clear dependency cache
   */
  clearCache(): void;

  /**
   * Get cache statistics
   */
  getCacheStats(): DependencyCacheStats;

  /**
   * Resolve a single component file
   */
  resolveComponentFile(path: string, baseDir?: string): Promise<ResolvedComponent>;
}

/**
 * Resolved component information
 */
export type ResolvedComponent = {
  /** Component file path */
  path: string;
  /** Parsed component definition */
  definition: ComponentSchema;
  /** File modification time */
  mtime: Date;
  /** Content hash for cache invalidation */
  contentHash: string;
  /** File size in bytes */
  size: number;
};

/**
 * Dependency validation result
 */
export type DependencyValidationResult = {
  /** Whether the graph is valid */
  valid: boolean;
  /** Validation errors */
  errors: DependencyValidationError[];
  /** Validation warnings */
  warnings: string[];
  /** Graph statistics */
  stats: {
    nodeCount: number;
    edgeCount: number;
    maxDepth: number;
    cycleCount: number;
  };
};

/**
 * Dependency validation error
 */
export type DependencyValidationError = {
  /** Error type */
  type: 'missing_component' | 'circular_dependency' | 'invalid_path' | 'max_depth_exceeded' | 'invalid_component';
  /** Error message */
  message: string;
  /** Component path where error occurred */
  componentPath?: string;
  /** Dependency alias that caused the error */
  dependencyAlias?: string;
  /** Additional context */
  context?: Record<string, any>;
};

/**
 * Dependency cache statistics
 */
export type DependencyCacheStats = {
  /** Total entries in cache */
  size: number;
  /** Maximum cache size */
  maxSize: number;
  /** Cache hit count */
  hits: number;
  /** Cache miss count */
  misses: number;
  /** Cache hit rate */
  hitRate: number;
  /** Total memory usage estimate */
  memoryUsage: number;
  /** Cache eviction count */
  evictions: number;
};

/**
 * Dependency traversal visitor interface
 */
export interface DependencyVisitor {
  /**
   * Called when entering a node during traversal
   */
  enterNode?(node: DependencyNode, depth: number): void;

  /**
   * Called when exiting a node during traversal
   */
  exitNode?(node: DependencyNode, depth: number): void;

  /**
   * Called when a cycle is detected
   */
  onCycle?(cycle: DependencyCycle): void;

  /**
   * Called when maximum depth is reached
   */
  onMaxDepth?(node: DependencyNode, depth: number): void;
} 