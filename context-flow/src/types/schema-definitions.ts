/**
 * Schema-derived type definitions for TOML parsing
 * These types are inferred from Zod schemas to ensure consistency
 */

import type { z } from 'zod';
import { componentSchema } from '../schemas/component.js';
import { workflowSchema } from '../schemas/workflow.js';

// Infer TypeScript types from Zod schemas (single source of truth)
export type ComponentSchema = z.infer<typeof componentSchema>;
export type WorkflowSchema = z.infer<typeof workflowSchema>;

// Extract nested types from the schemas for convenience
export type ComponentMetadata = ComponentSchema['component'];
export type WorkflowMetadata = WorkflowSchema['workflow'];
export type PropDefinition = NonNullable<ComponentSchema['props']>[string];
export type TemplateDefinition = ComponentSchema['template'];

// Union type for parsed TOML content  
export type ParsedTomlContent = ComponentSchema | WorkflowSchema;

// Enhanced target configuration with better typing
export type TargetConfig = NonNullable<ComponentSchema['targets']>[string];

// Type guards for runtime type checking
export function isComponentSchema(parsed: ParsedTomlContent): parsed is ComponentSchema {
  return 'component' in parsed && parsed.component !== undefined;
}

export function isWorkflowSchema(parsed: ParsedTomlContent): parsed is WorkflowSchema {
  return 'workflow' in parsed && parsed.workflow !== undefined;
}

// Validation helper types
export type TomlValidationContext = {
  /** File path being validated */
  filePath: string;
  /** Base directory for resolving relative paths */
  baseDir: string;
  /** Whether to perform strict validation */
  strict?: boolean;
};

// Parser result types that integrate with our comprehensive type system
export type ParsedComponent = {
  /** Original schema data */
  schema: ComponentSchema;
  /** File path */
  filePath: string;
  /** Resolved absolute path */
  resolvedPath: string;
  /** Parse timestamp */
  parsedAt: Date;
  /** Content hash for caching */
  contentHash?: string;
};

export type ParsedWorkflow = {
  /** Original schema data */
  schema: WorkflowSchema;
  /** File path */
  filePath: string;
  /** Resolved absolute path */
  resolvedPath: string;
  /** Parse timestamp */
  parsedAt: Date;
  /** Content hash for caching */
  contentHash?: string;
};

export type ParsedTomlFile = ParsedComponent | ParsedWorkflow;

// Type guard for parsed files
export function isParsedComponent(parsed: ParsedTomlFile): parsed is ParsedComponent {
  return isComponentSchema(parsed.schema);
}

export function isParsedWorkflow(parsed: ParsedTomlFile): parsed is ParsedWorkflow {
  return isWorkflowSchema(parsed.schema);
}

// Type aliases for consistency with the rest of the codebase
export type ComponentDefinition = ComponentSchema;
export type WorkflowDefinition = WorkflowSchema;
export type ParsedToml = ParsedTomlContent;

// Re-export schemas for convenience
export { componentSchema, workflowSchema } from '../schemas/index.js';

// Utility types for working with component properties
export type ComponentProps = {
  [K in keyof NonNullable<ComponentSchema['props']>]: {
    definition: NonNullable<ComponentSchema['props']>[K];
    value?: unknown;
  };
};

export type ComponentUseSection = NonNullable<ComponentSchema['use']>;
export type WorkflowUseSection = NonNullable<WorkflowSchema['use']>;

// Target-specific type extraction
export type ComponentTargets = NonNullable<ComponentSchema['targets']>;
export type TargetName = keyof ComponentTargets;

// Enhanced validation types that work with our error system
export type SchemaValidationResult = {
  /** Whether validation passed */
  valid: boolean;
  /** Validated data (if successful) */
  data?: ParsedTomlContent;
  /** Validation errors */
  errors: Array<{
    path: string;
    message: string;
    value?: unknown;
  }>;
  /** File context */
  context: TomlValidationContext;
};

// Type utilities for template content analysis
export type TemplateAnalysis = {
  /** Variables referenced in template */
  variables: Set<string>;
  /** Provider calls found */
  providers: Set<string>;
  /** Component usage references */
  components: Set<string>;
  /** Estimated complexity score */
  complexity: number;
};

// Integration types with the comprehensive type system
export type TomlSchemaMetadata = {
  /** Schema version */
  version: string;
  /** Supported features */
  features: string[];
  /** Validation mode */
  mode: 'strict' | 'permissive';
  /** Last updated timestamp */
  updatedAt: Date;
}; 