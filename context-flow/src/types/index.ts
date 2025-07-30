/**
 * Core Type Definitions - Central Export File
 * Exports all interfaces and types for the Context Flow build system
 */

// Build Engine types
export type {
  BuildOptions,
  BuildResult,
  BuildMetadata,
  ResolvedDependency,
  TemplateContext,
  ProviderFunction,
  ComponentFunction,
  BuildEngineConfig,
  ValidationResult
} from './build-engine.js';

export type { BuildEngine, TargetProcessor, Provider } from './build-engine.js';

// Template Engine types
export type {
  TemplateCompileOptions,
  TemplateRenderOptions,
  CompiledTemplate,
  TemplateRenderResult,
  TemplateCacheConfig,
  TemplateEngineConfig,
  TemplateCacheStats,
  TemplateValidationResult,
  TemplateError,
  TemplateFilter,
  TemplateTest
} from './template-engine.js';

export type { TemplateEngine, TemplateEngineExtension } from './template-engine.js';

// Dependency Resolver types
export type {
  DependencyResolutionOptions,
  DependencyResolutionResult,
  DependencyResolutionMetadata,
  DependencyCycle,
  DependencyNode,
  DependencyGraph,
  DependencyCacheEntry,
  DependencyResolverConfig,
  ResolvedComponent,
  DependencyValidationResult,
  DependencyValidationError,
  DependencyCacheStats
} from './dependency-resolver.js';

export type { DependencyResolver, DependencyVisitor } from './dependency-resolver.js';

// Target Processor types
export type {
  TargetProcessingOptions,
  TargetProcessingResult,
  TargetProcessingContext,
  TargetConfigValidationResult,
  TargetConfigError,
  TargetPluginMetadata,
  BuiltInTargetType,
  TargetRegistryEntry,
  PluginLoadResult,
  CursorTargetConfig,
  VSCodeTargetConfig,
  JSONTargetConfig,
  MarkdownTargetConfig
} from './target-processor.js';

export type { TargetProcessor as ITargetProcessor, TargetPlugin, TargetProcessorRegistry } from './target-processor.js';

// Provider Executor types
export type {
  ProviderExecutionOptions,
  ProviderExecutionResult,
  ProviderError,
  ProviderArgumentSchema,
  ProviderMetadata,
  ProviderValidationResult,
  ProviderValidationError,
  BuiltInProviderType,
  ProviderRegistryEntry,
  ProviderExecutorConfig,
  ProviderStats,
  FileProviderArgs,
  URLProviderArgs,
  GitDiffProviderArgs,
  ShellProviderArgs,
  ProviderCacheEntry
} from './provider-executor.js';

export type { Provider as IProvider, ProviderExecutor } from './provider-executor.js';

// Re-export schema-derived types for TOML parsing
export type {
  ComponentSchema,
  WorkflowSchema,
  ComponentMetadata,
  WorkflowMetadata,
  PropDefinition,
  TemplateDefinition,
  TargetConfig,
  ParsedTomlContent,
  ParsedComponent,
  ParsedWorkflow,
  ParsedTomlFile,
  TomlValidationContext,
  SchemaValidationResult,
  TemplateAnalysis,
  TomlSchemaMetadata,
  ComponentProps,
  ComponentUseSection,
  WorkflowUseSection,
  ComponentTargets,
  TargetName,
  // Type aliases for consistency
  ComponentDefinition,
  WorkflowDefinition,
  ParsedToml
} from './schema-definitions.js';

export {
  isComponentSchema,
  isWorkflowSchema,
  isParsedComponent,
  isParsedWorkflow,
  componentSchema,
  workflowSchema
} from './schema-definitions.js';

// Import types needed for type guards
import type { 
  ComponentDefinition, 
  WorkflowDefinition, 
  ParsedToml,
  ComponentSchema,
  WorkflowSchema 
} from './schema-definitions.js';
import type { BuildResult } from './build-engine.js';
import type { ProviderExecutionResult } from './provider-executor.js';
import type { TargetProcessingResult } from './target-processor.js';

// Type utility for discriminating between component and workflow definitions
export function isComponentDefinition(def: ParsedToml): def is ComponentDefinition {
  return 'component' in def;
}

export function isWorkflowDefinition(def: ParsedToml): def is WorkflowDefinition {
  return 'workflow' in def;
}

// Common type guards for build results
export function isBuildSuccess(result: BuildResult): result is BuildResult & { success: true } {
  return result.success === true;
}

export function isBuildFailure(result: BuildResult): result is BuildResult & { success: false; errors: NonNullable<BuildResult['errors']> } {
  return result.success === false && result.errors !== undefined;
}

// Type guards for provider results
export function isProviderSuccess(result: ProviderExecutionResult): result is ProviderExecutionResult & { success: true } {
  return result.success === true;
}

export function isProviderFailure(result: ProviderExecutionResult): result is ProviderExecutionResult & { success: false } {
  return result.success === false;
}

// Type guards for target processing
export function isTargetSuccess(result: TargetProcessingResult): result is TargetProcessingResult & { success: true } {
  return result.success === true;
}

export function isTargetFailure(result: TargetProcessingResult): result is TargetProcessingResult & { success: false } {
  return result.success === false;
} 