// Macro function types
export type MacroFunction<T = unknown> = (config: T) => string;

export type MacroRegistry = {
  [key: string]: MacroFunction<unknown>;
};

// Code Patterns macro types
export type CodePattern = {
  bad?: string | string[];
  description: string;
  good: string | string[];
  name: string;
};

export type CodePatternsConfig = {
  patterns: CodePattern[];
};

// API Documentation macro types
export type ApiEndpointParam = {
  description?: string;
  name: string;
  required?: boolean;
  type: string;
};

export type ApiEndpointResponse = {
  description?: string;
  example?: Record<string, unknown> | unknown[];
  type: string;
};

export type ApiEndpoint = {
  description: string;
  method: string;
  params?: ApiEndpointParam[];
  path: string;
  response?: ApiEndpointResponse;
};

export type ApiDocsConfig = {
  description?: string;
  endpoints: ApiEndpoint[];
  title: string;
};

// Macro interface for registration
export interface MacroDefinition<T = unknown> {
  fn: MacroFunction<T>;
  name: string;
} 