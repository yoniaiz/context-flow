/**
 * TemplateEngine interface and related types
 * Handles template compilation and rendering with provider instruction injection
 */

import type { TemplateContext, ProviderFunction, ComponentFunction } from './build-engine.js';

/**
 * Template compilation options
 */
export type TemplateCompileOptions = {
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
 * Template rendering result
 */
export type TemplateRenderResult = {
  /** Rendered content */
  content: string;
  /** Render duration in milliseconds */
  duration: number;
  /** Providers that were used for instruction generation */
  providersUsed: string[];
  /** Components that were used */
  componentsUsed: string[];
  /** Any warnings during rendering */
  warnings: string[];
};

/**
 * Template engine configuration
 */
export type TemplateEngineConfig = {
  /** Default compilation options */
  compileOptions: TemplateCompileOptions;
  /** Default rendering options */
  renderOptions: TemplateRenderOptions;
  /** Available providers for instruction generation */
  providers: Record<string, ProviderFunction>;
  /** Global context available to all templates */
  globals: Record<string, any>;
};

/**
 * Template engine interface for rendering component and workflow templates
 * Simplified for instruction injection - no caching needed
 */
export interface TemplateEngine {
  /**
   * Configure the template engine
   */
  configure(config: Partial<TemplateEngineConfig>): void;

  /**
   * Render a template string with context
   * No caching needed since instruction injection is fast and deterministic
   */
  render(source: string, context: TemplateContext, options?: TemplateCompileOptions & TemplateRenderOptions): TemplateRenderResult;

  /**
   * Register a provider function for instruction generation
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
   * Validate template syntax without compiling
   */
  validateSyntax(source: string): TemplateValidationResult;
}

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