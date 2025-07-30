/**
 * Type definitions for Context Flow error handling system
 */

/**
 * Represents a location in source code where an error occurred
 */
export interface SourceLocation {
  /** The file path where the error occurred */
  filePath: string;
  /** Line number (1-based) where the error occurred */
  line?: number;
  /** Column number (1-based) where the error occurred */
  column?: number;
  /** Optional context around the error location */
  context?: string;
}

/**
 * Structured error information following the "Context, Error, Mitigation" pattern
 */
export interface ErrorInfo {
  /** What the system was trying to do when the error occurred */
  context: string;
  /** The specific error that occurred */
  error: string;
  /** Suggested steps to resolve the error */
  mitigation: string;
}

/**
 * Error severity levels for different types of build errors
 */
export enum ErrorSeverity {
  /** Information only, doesn't prevent build */
  INFO = 'info',
  /** Warning that should be addressed but doesn't prevent build */
  WARNING = 'warning',
  /** Error that prevents successful build completion */
  ERROR = 'error',
  /** Critical error that stops the build process immediately */
  CRITICAL = 'critical'
}

/**
 * Error categories for grouping related errors
 */
export enum ErrorCategory {
  /** Validation and schema errors */
  VALIDATION = 'validation',
  /** Component dependency resolution errors */
  DEPENDENCY = 'dependency',
  /** Template processing and rendering errors */
  TEMPLATE = 'template',
  /** Provider execution errors */
  PROVIDER = 'provider',
  /** File system and I/O errors */
  IO = 'io',
  /** Configuration and setup errors */
  CONFIG = 'config'
}