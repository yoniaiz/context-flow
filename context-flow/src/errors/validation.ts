import { BuildError } from './base.js';
import type { SourceLocation, ErrorInfo, ErrorSeverity } from './types.js';
import { ErrorCategory, ErrorSeverity as ErrorSeverityEnum } from './types.js';

/**
 * Error thrown when validation fails for TOML files, schemas, or configurations
 */
export class ValidationError extends BuildError {
  /** The field or property that failed validation */
  public readonly field?: string;
  
  /** The validation rule that was violated */
  public readonly rule?: string;
  
  /** The expected value or format */
  public readonly expected?: string;
  
  /** The actual value that caused the validation failure */
  public readonly actual?: any;

  constructor(
    message: string,
    context: string,
    mitigation: string,
    sourceLocation?: SourceLocation,
    options?: {
      field?: string;
      rule?: string;
      expected?: string;
      actual?: any;
      severity?: ErrorSeverity;
    }
  ) {
    const errorInfo: ErrorInfo = {
      context,
      error: message,
      mitigation
    };

    super(
      message,
      errorInfo,
      options?.severity || ErrorSeverityEnum.ERROR,
      ErrorCategory.VALIDATION,
      sourceLocation,
      {
        field: options?.field,
        rule: options?.rule,
        expected: options?.expected,
        actual: options?.actual
      }
    );

    this.field = options?.field;
    this.rule = options?.rule;
    this.expected = options?.expected;
    this.actual = options?.actual;
  }

  /**
   * Create a ValidationError for schema validation failures
   */
  static schema(
    field: string,
    expected: string,
    actual: any,
    filePath: string,
    line?: number
  ): ValidationError {
    const message = `Schema validation failed for field '${field}'`;
    const context = `Validating TOML schema for ${filePath}`;
    const mitigation = `Check the field '${field}' in ${filePath} and ensure it matches the expected format: ${expected}`;
    
    return new ValidationError(
      message,
      context,
      mitigation,
      { filePath, line },
      {
        field,
        rule: 'schema',
        expected,
        actual: typeof actual === 'object' ? JSON.stringify(actual) : String(actual)
      }
    );
  }

  /**
   * Create a ValidationError for missing required fields
   */
  static missingField(
    field: string,
    filePath: string,
    line?: number
  ): ValidationError {
    const message = `Required field '${field}' is missing`;
    const context = `Parsing required fields in ${filePath}`;
    const mitigation = `Add the required field '${field}' to ${filePath}`;
    
    return new ValidationError(
      message,
      context,
      mitigation,
      { filePath, line },
      {
        field,
        rule: 'required',
        expected: 'defined value',
        actual: 'undefined'
      }
    );
  }

  /**
   * Create a ValidationError for invalid file paths
   */
  static invalidPath(
    path: string,
    reason: string,
    filePath: string,
    line?: number
  ): ValidationError {
    const message = `Invalid file path: ${path}`;
    const context = `Validating file path references in ${filePath}`;
    const mitigation = `Check that the path '${path}' exists and is accessible. ${reason}`;
    
    return new ValidationError(
      message,
      context,
      mitigation,
      { filePath, line },
      {
        field: 'path',
        rule: 'file_exists',
        expected: 'valid file path',
        actual: path
      }
    );
  }

  /**
   * Create a ValidationError for TOML parsing failures
   */
  static tomlParse(
    parseError: string,
    filePath: string,
    line?: number,
    column?: number
  ): ValidationError {
    const message = `TOML parsing failed: ${parseError}`;
    const context = `Parsing TOML file ${filePath}`;
    const mitigation = `Fix the TOML syntax error in ${filePath}${line ? ` at line ${line}` : ''}`;
    
    return new ValidationError(
      message,
      context,
      mitigation,
      { filePath, line, column },
      {
        rule: 'toml_syntax',
        expected: 'valid TOML syntax',
        actual: parseError
      }
    );
  }

  /**
   * Create a ValidationError for type mismatches
   */
  static typeMismatch(
    field: string,
    expectedType: string,
    actualType: string,
    filePath: string,
    line?: number
  ): ValidationError {
    const message = `Type mismatch for field '${field}': expected ${expectedType}, got ${actualType}`;
    const context = `Type checking field '${field}' in ${filePath}`;
    const mitigation = `Change the type of field '${field}' in ${filePath} to ${expectedType}`;
    
    return new ValidationError(
      message,
      context,
      mitigation,
      { filePath, line },
      {
        field,
        rule: 'type_check',
        expected: expectedType,
        actual: actualType
      }
    );
  }
}