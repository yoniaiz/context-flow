/**
 * Basic type definitions for Context Flow TOML parsing
 * These are minimal types that will be expanded in Task 3
 */

export interface ComponentMetadata {
  name: string;
  description: string;
  version: string;
}

export interface WorkflowMetadata {
  name: string;
  description: string;
}

export interface PropDefinition {
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  required: boolean;
  default?: any;
}

export interface TemplateDefinition {
  content: string;
}

export interface TargetConfig {
  [key: string]: any;
}

export interface ComponentDefinition {
  component: ComponentMetadata;
  props?: Record<string, PropDefinition>;
  use?: Record<string, string>;
  template: TemplateDefinition;
  targets?: Record<string, TargetConfig>;
}

export interface WorkflowDefinition {
  workflow: WorkflowMetadata;
  use?: Record<string, string>;
  template: TemplateDefinition;
}

export type ParsedToml = ComponentDefinition | WorkflowDefinition;