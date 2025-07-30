import type { SourceLocation, ErrorInfo, ErrorSeverity, ErrorCategory } from './types.js';

/**
 * Abstract base class for all Context Flow build errors
 * Implements the "Context, Error, Mitigation" pattern for structured error reporting
 */
export abstract class BuildError extends Error {
  /** The severity level of this error */
  public readonly severity: ErrorSeverity;
  
  /** The category this error belongs to */
  public readonly category: ErrorCategory;
  
  /** Location in source code where the error occurred */
  public readonly sourceLocation?: SourceLocation;
  
  /** Structured error information */
  public readonly errorInfo: ErrorInfo;
  
  /** Additional data related to the error */
  public readonly data?: Record<string, any>;
  
  /** Timestamp when the error was created */
  public readonly timestamp: Date;

  constructor(
    message: string,
    errorInfo: ErrorInfo,
    severity: ErrorSeverity,
    category: ErrorCategory,
    sourceLocation?: SourceLocation,
    data?: Record<string, any>
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.severity = severity;
    this.category = category;
    this.sourceLocation = sourceLocation;
    this.errorInfo = errorInfo;
    this.data = data;
    this.timestamp = new Date();
    
    // Maintain proper stack trace in Node.js
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get a formatted error message with context, error, and mitigation
   */
  getFormattedMessage(): string {
    const parts: string[] = [];
    
    parts.push(`[${this.category.toUpperCase()}] ${this.message}`);
    
    if (this.sourceLocation) {
      parts.push(`Location: ${this.formatSourceLocation()}`);
    }
    
    parts.push(`Context: ${this.errorInfo.context}`);
    parts.push(`Error: ${this.errorInfo.error}`);
    parts.push(`Mitigation: ${this.errorInfo.mitigation}`);
    
    return parts.join('\n');
  }

  /**
   * Format source location for display
   */
  private formatSourceLocation(): string {
    const { filePath, line, column, context } = this.sourceLocation!;
    let location = filePath;
    
    if (line !== undefined) {
      location += `:${line}`;
      if (column !== undefined) {
        location += `:${column}`;
      }
    }
    
    if (context) {
      location += ` (${context})`;
    }
    
    return location;
  }

  /**
   * Convert error to a plain object for serialization
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      severity: this.severity,
      category: this.category,
      sourceLocation: this.sourceLocation,
      errorInfo: this.errorInfo,
      data: this.data,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    };
  }

  /**
   * Check if this error should prevent build continuation
   */
  isFatal(): boolean {
    return this.severity === 'error' || this.severity === 'critical';
  }

  /**
   * Create a child error with additional context
   */
  withContext(additionalContext: string): BuildError {
    const newErrorInfo: ErrorInfo = {
      ...this.errorInfo,
      context: `${this.errorInfo.context} -> ${additionalContext}`
    };
    
    // Create a new instance of the same error type
    const ErrorClass = this.constructor as new (
      message: string,
      errorInfo: ErrorInfo,
      severity: ErrorSeverity,
      category: ErrorCategory,
      sourceLocation?: SourceLocation,
      data?: Record<string, any>
    ) => BuildError;
    
    return new ErrorClass(
      this.message,
      newErrorInfo,
      this.severity,
      this.category,
      this.sourceLocation,
      this.data
    );
  }
}