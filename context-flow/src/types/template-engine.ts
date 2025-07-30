/**
 * TemplateEngine interface and related types
 * Handles template compilation, rendering, and caching
 */

import type { TemplateContext, ProviderFunction, ComponentFunction } from './build-engine.js';

/**
 * Template compilation options
 */
export type TemplateCompileOptions = {
  /** Whether to enable caching of compiled templates */
  cache?: boolean;
  /** Template name for debugging and error reporting */
  name?: string;
  /** Whether to trim whitespace */
  trimBlocks?: boolean;
  /** Whether to strip leading whitespace */
  lstripBlocks?: boolean;
  /** Custom delimiters for template syntax */
  delimiters?: {
    blockStart?: string;
    blockEnd?: string;
    variableStart?: string;
    variableEnd?: string;
    commentStart?: string;
    commentEnd?: string;
  };
};

/**
 * Template rendering options
 */
export type TemplateRenderOptions = {
  /** Whether to throw on undefined variables */
  throwOnUndefined?: boolean;
  /** Whether to enable auto-escaping */
  autoEscape?: boolean;
  /** Timeout for template rendering in milliseconds */
  timeout?: number;
};

/**
 * Compiled template representation
 */
export type CompiledTemplate = {
  /** Unique identifier for the template */
  id: string;
  /** Original template content */
  source: string;
  /** Compiled template function */
  render: (context: TemplateContext, options?: TemplateRenderOptions) => Promise<string>;
  /** Compilation timestamp */
  compiledAt: Date;
  /** Template metadata */
  metadata: {
    name?: string;
    dependencies: string[];
    providers: string[];
    variables: string[];
  };
};

/**
 * Template rendering result
 */
export type TemplateRenderResult = {
  /** Rendered content */
  content: string;
  /** Render duration in milliseconds */
  duration: number;
  /** Providers that were executed */
  providersUsed: string[];
  /** Components that were used */
  componentsUsed: string[];
  /** Any warnings during rendering */
  warnings: string[];
};

/**
 * Template cache configuration
 */
export type TemplateCacheConfig = {
  /** Maximum number of templates to cache */
  maxSize: number;
  /** Time to live for cached templates in milliseconds */
  ttl: number;
  /** Whether to enable cache */
  enabled: boolean;
};

/**
 * Template engine configuration
 */
export type TemplateEngineConfig = {
  /** Default compilation options */
  compileOptions: TemplateCompileOptions;
  /** Default rendering options */
  renderOptions: TemplateRenderOptions;
  /** Cache configuration */
  cache: TemplateCacheConfig;
  /** Available providers */
  providers: Record<string, ProviderFunction>;
  /** Global context available to all templates */
  globals: Record<string, any>;
};

/**
 * Template engine interface for rendering component and workflow templates
 */
export interface TemplateEngine {
  /**
   * Configure the template engine
   */
  configure(config: Partial<TemplateEngineConfig>): void;

  /**
   * Compile a template from source
   */
  compile(source: string, options?: TemplateCompileOptions): Promise<CompiledTemplate>;

  /**
   * Render a compiled template
   */
  render(template: CompiledTemplate, context: TemplateContext, options?: TemplateRenderOptions): Promise<TemplateRenderResult>;

  /**
   * Compile and render a template in one step
   */
  renderString(source: string, context: TemplateContext, options?: TemplateCompileOptions & TemplateRenderOptions): Promise<TemplateRenderResult>;

  /**
   * Register a provider function
   */
  registerProvider(name: string, provider: ProviderFunction): void;

  /**
   * Register a component function
   */
  registerComponent(name: string, component: ComponentFunction): void;

  /**
   * Register a global variable or function
   */
  registerGlobal(name: string, value: any): void;

  /**
   * Get template from cache
   */
  getCachedTemplate(id: string): CompiledTemplate | undefined;

  /**
   * Clear template cache
   */
  clearCache(): void;

  /**
   * Get cache statistics
   */
  getCacheStats(): TemplateCacheStats;

  /**
   * Validate template syntax without compiling
   */
  validateSyntax(source: string): Promise<TemplateValidationResult>;
}

/**
 * Template cache statistics
 */
export type TemplateCacheStats = {
  /** Total number of templates in cache */
  size: number;
  /** Maximum cache size */
  maxSize: number;
  /** Cache hit count */
  hits: number;
  /** Cache miss count */
  misses: number;
  /** Cache hit rate as percentage */
  hitRate: number;
  /** Total memory usage estimate */
  memoryUsage: number;
};

/**
 * Template validation result
 */
export type TemplateValidationResult = {
  /** Whether the template is valid */
  valid: boolean;
  /** Syntax errors found */
  errors: TemplateError[];
  /** Warnings about template usage */
  warnings: string[];
  /** Detected dependencies (variables, functions, etc.) */
  dependencies: {
    variables: string[];
    providers: string[];
    components: string[];
  };
};

/**
 * Template-specific error type
 */
export type TemplateError = {
  /** Error message */
  message: string;
  /** Line number where error occurred */
  line?: number;
  /** Column number where error occurred */
  column?: number;
  /** Template name or identifier */
  template?: string;
  /** Error type */
  type: 'syntax' | 'runtime' | 'compilation';
  /** Stack trace if available */
  stack?: string;
};

/**
 * Filter function signature for custom template filters
 */
export type TemplateFilter = (value: any, ...args: any[]) => any;

/**
 * Test function signature for custom template tests
 */
export type TemplateTest = (value: any, ...args: any[]) => boolean;

/**
 * Extension interface for template engine plugins
 */
export interface TemplateEngineExtension {
  /** Extension name */
  name: string;
  /** Extension version */
  version: string;
  /** Register filters */
  filters?: Record<string, TemplateFilter>;
  /** Register tests */
  tests?: Record<string, TemplateTest>;
  /** Register globals */
  globals?: Record<string, any>;
  /** Initialize the extension */
  init?(engine: TemplateEngine): void;
} 