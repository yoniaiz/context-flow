/**
 * TargetProcessor interface and plugin types
 * Handles platform-specific output generation and target plugin system
 */

import { BuildMetadata, TemplateContext } from './build-engine.js';
import { BuildError } from '../errors/base.js';

/**
 * Target processing options
 */
export type TargetProcessingOptions = {
  /** Whether to validate the output */
  validate?: boolean;
  /** Whether to pretty-print the output */
  prettyPrint?: boolean;
  /** Custom formatting options */
  formatting?: Record<string, any>;
  /** Output file path (for file-specific processing) */
  outputPath?: string;
  /** Additional metadata to include */
  metadata?: Record<string, any>;
};

/**
 * Target processing result
 */
export type TargetProcessingResult = {
  /** Whether processing was successful */
  success: boolean;
  /** Processed output content */
  output: any;
  /** Output format/type */
  format: string;
  /** Processing duration in milliseconds */
  duration: number;
  /** Warnings during processing */
  warnings: string[];
  /** Errors that occurred */
  errors: BuildError[];
  /** Metadata about the processing */
  metadata: {
    targetName: string;
    configUsed: any;
    outputSize: number;
    processingSteps: string[];
  };
};

/**
 * Target configuration from TOML files
 */
export type TargetConfig = {
  /** Target-specific configuration options */
  [key: string]: any;
} & {
  /** Common target configuration */
  always_apply?: boolean;
  command?: string;
  format?: string;
  output_path?: string;
  enabled?: boolean;
};

/**
 * Target processor interface
 */
export interface TargetProcessor {
  /**
   * Get the target name
   */
  getName(): string;

  /**
   * Get supported target format
   */
  getFormat(): string;

  /**
   * Get target description
   */
  getDescription(): string;

  /**
   * Process content for this target
   */
  process(
    content: string, 
    config: TargetConfig, 
    context: TargetProcessingContext,
    options?: TargetProcessingOptions
  ): Promise<TargetProcessingResult>;

  /**
   * Validate target configuration
   */
  validateConfig(config: TargetConfig): TargetConfigValidationResult;

  /**
   * Get default configuration for this target
   */
  getDefaultConfig(): TargetConfig;

  /**
   * Get configuration schema for validation
   */
  getConfigSchema(): any;

  /**
   * Initialize the target processor
   */
  initialize?(config?: any): Promise<void>;

  /**
   * Cleanup resources
   */
  cleanup?(): Promise<void>;
}

/**
 * Context passed to target processors
 */
export type TargetProcessingContext = {
  /** Original content before processing */
  originalContent: string;
  /** Template context used during rendering */
  templateContext: TemplateContext;
  /** Build metadata */
  buildMetadata: BuildMetadata;
  /** Working directory */
  workingDirectory: string;
  /** Target-specific environment variables */
  environment: Record<string, string>;
};

/**
 * Target configuration validation result
 */
export type TargetConfigValidationResult = {
  /** Whether configuration is valid */
  valid: boolean;
  /** Validation errors */
  errors: TargetConfigError[];
  /** Validation warnings */
  warnings: string[];
  /** Normalized configuration */
  normalizedConfig?: TargetConfig;
};

/**
 * Target configuration error
 */
export type TargetConfigError = {
  /** Error message */
  message: string;
  /** Configuration key that caused the error */
  key?: string;
  /** Error type */
  type: 'missing_required' | 'invalid_type' | 'invalid_value' | 'unknown_option';
  /** Expected value or type */
  expected?: string;
  /** Actual value */
  actual?: any;
};

/**
 * Target plugin metadata
 */
export type TargetPluginMetadata = {
  /** Plugin name */
  name: string;
  /** Plugin version */
  version: string;
  /** Plugin description */
  description: string;
  /** Plugin author */
  author?: string;
  /** Supported target formats */
  formats: string[];
  /** Plugin dependencies */
  dependencies?: string[];
  /** Plugin configuration schema */
  configSchema?: any;
};

/**
 * Target plugin interface
 */
export interface TargetPlugin {
  /** Plugin metadata */
  metadata: TargetPluginMetadata;

  /**
   * Create a target processor instance
   */
  createProcessor(): TargetProcessor;

  /**
   * Initialize the plugin
   */
  initialize?(config?: any): Promise<void>;

  /**
   * Cleanup plugin resources
   */
  cleanup?(): Promise<void>;

  /**
   * Validate plugin compatibility
   */
  validateCompatibility?(version: string): boolean;
}

/**
 * Built-in target types
 */
export type BuiltInTargetType = 
  | 'cursor'      // Cursor IDE rules
  | 'vscode'      // VS Code settings
  | 'json'        // Generic JSON output
  | 'yaml'        // YAML format
  | 'markdown'    // Markdown documentation
  | 'xml'         // XML format
  | 'generic';    // Plain text output

/**
 * Target registry entry
 */
export type TargetRegistryEntry = {
  /** Target name */
  name: string;
  /** Target processor instance */
  processor: TargetProcessor;
  /** Plugin that provides this target (if any) */
  plugin?: TargetPlugin;
  /** Whether this is a built-in target */
  builtin: boolean;
  /** Registration timestamp */
  registeredAt: Date;
  /** Whether the target is enabled */
  enabled: boolean;
};

/**
 * Target processor registry interface
 */
export interface TargetProcessorRegistry {
  /**
   * Register a target processor
   */
  register(name: string, processor: TargetProcessor, plugin?: TargetPlugin): void;

  /**
   * Unregister a target processor
   */
  unregister(name: string): boolean;

  /**
   * Get a target processor by name
   */
  get(name: string): TargetProcessor | undefined;

  /**
   * Get all registered target processors
   */
  getAll(): TargetRegistryEntry[];

  /**
   * Get available target names
   */
  getTargetNames(): string[];

  /**
   * Check if a target is registered
   */
  has(name: string): boolean;

  /**
   * Enable or disable a target
   */
  setEnabled(name: string, enabled: boolean): void;

  /**
   * Clear all registered targets
   */
  clear(): void;

  /**
   * Load targets from plugins
   */
  loadPlugins(pluginDirectories: string[]): Promise<PluginLoadResult[]>;
}

/**
 * Plugin load result
 */
export type PluginLoadResult = {
  /** Plugin name */
  name: string;
  /** Whether loading was successful */
  success: boolean;
  /** Plugin file path */
  path: string;
  /** Targets provided by the plugin */
  targets: string[];
  /** Load errors (if any) */
  errors?: string[];
  /** Load warnings */
  warnings?: string[];
};

/**
 * Cursor IDE specific target configuration
 */
export type CursorTargetConfig = TargetConfig & {
  /** Rule name for Cursor */
  ruleName?: string;
  /** Whether rule always applies */
  always_apply?: boolean;
  /** Command trigger for the rule */
  command?: string;
  /** Description for the rule */
  description?: string;
  /** File globs the rule applies to */
  globs?: string[];
  /** Whether to include context automatically */
  includeContext?: boolean;
};

/**
 * VS Code specific target configuration
 */
export type VSCodeTargetConfig = TargetConfig & {
  /** Setting scope */
  scope?: 'user' | 'workspace' | 'folder';
  /** Settings category */
  category?: string;
  /** Whether to merge with existing settings */
  merge?: boolean;
};

/**
 * JSON target configuration
 */
export type JSONTargetConfig = TargetConfig & {
  /** JSON schema to validate against */
  schema?: any;
  /** Whether to pretty print */
  prettyPrint?: boolean;
  /** Indentation size */
  indent?: number;
  /** Whether to sort keys */
  sortKeys?: boolean;
};

/**
 * Markdown target configuration
 */
export type MarkdownTargetConfig = TargetConfig & {
  /** Document title */
  title?: string;
  /** Whether to include table of contents */
  toc?: boolean;
  /** Code highlighting theme */
  codeTheme?: string;
  /** Whether to include frontmatter */
  frontmatter?: boolean;
}; 