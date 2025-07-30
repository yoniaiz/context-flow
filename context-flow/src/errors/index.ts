/**
 * Context Flow Error Handling System
 * 
 * This module provides a comprehensive error handling framework for Context Flow
 * following the "Context, Error, Mitigation" pattern for structured error reporting.
 */

// Import classes for internal use
import { BuildError } from './base.js';
import type { SourceLocation, ErrorInfo } from './types.js';
import { ErrorSeverity, ErrorCategory } from './types.js';
import { ErrorFormatter } from './formatting.js';

// Re-export all classes and types
export { BuildError } from './base.js';
export type { SourceLocation, ErrorInfo } from './types.js';
export { ErrorSeverity, ErrorCategory } from './types.js';

// Specific error classes
export { ValidationError } from './validation.js';
export { DependencyError } from './dependency.js';
export { TemplateError } from './template.js';
export { ProviderError } from './provider.js';

// Error formatting utilities
export { ErrorFormatter } from './formatting.js';

/**
 * Utility function to check if an error is a BuildError
 */
export function isBuildError(error: any): error is BuildError {
  return error && error instanceof BuildError;
}

/**
 * Utility function to format any error using our error formatter
 */
export function formatError(error: Error | BuildError): string {
  if (isBuildError(error)) {
    return ErrorFormatter.format(error);
  }
  
  // For regular errors, create a simple formatted message
  return `${error.name}: ${error.message}${error.stack ? '\n' + error.stack : ''}`;
}

/**
 * Utility function to create a BuildError from a generic Error
 */
export function createBuildError(
  error: Error,
  category: ErrorCategory,
  context: string,
  mitigation: string,
  sourceLocation?: SourceLocation
): BuildError {
  return new (class extends BuildError {})(
    error.message,
    {
      context,
      error: error.message,
      mitigation
    },
    ErrorSeverity.ERROR,
    category,
    sourceLocation
  );
}