import chalk from 'chalk';
import type { BuildError } from './base.js';
import { ErrorSeverity, ErrorCategory } from './types.js';

/**
 * Formatting utilities for Context Flow build errors with colored terminal output
 */
export class ErrorFormatter {
  /**
   * Format an error with colors and proper structure
   */
  static format(error: BuildError): string {
    const parts: string[] = [];
    
    // Header with severity and category
    parts.push(this.formatHeader(error));
    
    // Source location if available
    if (error.sourceLocation) {
      parts.push(this.formatSourceLocation(error));
    }
    
    // Error details
    parts.push(this.formatErrorDetails(error));
    
    // Additional data if available
    if (error.data && Object.keys(error.data).length > 0) {
      parts.push(this.formatAdditionalData(error));
    }
    
    return parts.join('\n\n');
  }

  /**
   * Format error header with severity and category
   */
  private static formatHeader(error: BuildError): string {
    const severityColor = this.getSeverityColor(error.severity);
    const categoryColor = this.getCategoryColor(error.category);
    
    const severityBadge = severityColor(`[${error.severity.toUpperCase()}]`);
    const categoryBadge = categoryColor(`[${error.category.toUpperCase()}]`);
    const message = chalk.white.bold(error.message);
    
    return `${severityBadge}${categoryBadge} ${message}`;
  }

  /**
   * Format source location information
   */
  private static formatSourceLocation(error: BuildError): string {
    const { filePath, line, column, context } = error.sourceLocation!;
    
    let location = chalk.cyan(filePath);
    if (line !== undefined) {
      location += chalk.yellow(`:${line}`);
      if (column !== undefined) {
        location += chalk.yellow(`:${column}`);
      }
    }
    
    if (context) {
      location += chalk.gray(` (${context})`);
    }
    
    return `${chalk.gray('Location:')} ${location}`;
  }

  /**
   * Format error details (context, error, mitigation)
   */
  private static formatErrorDetails(error: BuildError): string {
    const parts: string[] = [];
    
    // Context
    parts.push(`${chalk.blue.bold('Context:')} ${chalk.white(error.errorInfo.context)}`);
    
    // Error
    parts.push(`${chalk.red.bold('Error:')} ${chalk.white(error.errorInfo.error)}`);
    
    // Mitigation
    parts.push(`${chalk.green.bold('Mitigation:')} ${chalk.white(error.errorInfo.mitigation)}`);
    
    return parts.join('\n');
  }

  /**
   * Format additional error data
   */
  private static formatAdditionalData(error: BuildError): string {
    const relevantData = this.filterRelevantData(error.data!);
    
    if (Object.keys(relevantData).length === 0) {
      return '';
    }
    
    const parts: string[] = [chalk.gray.bold('Details:')];
    
    for (const [key, value] of Object.entries(relevantData)) {
      if (value !== undefined && value !== null) {
        const formattedValue = this.formatDataValue(value);
        parts.push(`  ${chalk.gray(`${key}:`)} ${formattedValue}`);
      }
    }
    
    return parts.join('\n');
  }

  /**
   * Filter out null/undefined data and format specific types
   */
  private static filterRelevantData(data: Record<string, any>): Record<string, any> {
    const filtered: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null && value !== '') {
        // Special handling for arrays
        if (Array.isArray(value) && value.length > 0) {
          filtered[key] = value;
        } else if (!Array.isArray(value)) {
          filtered[key] = value;
        }
      }
    }
    
    return filtered;
  }

  /**
   * Format data values with appropriate colors
   */
  private static formatDataValue(value: any): string {
    if (typeof value === 'string') {
      return chalk.white(`"${value}"`);
    } else if (typeof value === 'number') {
      return chalk.yellow(value.toString());
    } else if (typeof value === 'boolean') {
      return value ? chalk.green('true') : chalk.red('false');
    } else if (Array.isArray(value)) {
      return chalk.white(`[${value.map(v => typeof v === 'string' ? `"${v}"` : v).join(', ')}]`);
    } else if (typeof value === 'object') {
      return chalk.white(JSON.stringify(value, null, 2));
    } else {
      return chalk.white(String(value));
    }
  }

  /**
   * Get color function for error severity
   */
  private static getSeverityColor(severity: ErrorSeverity): (text: string) => string {
    switch (severity) {
      case ErrorSeverity.INFO:
        return chalk.blue;
      case ErrorSeverity.WARNING:
        return chalk.yellow;
      case ErrorSeverity.ERROR:
        return chalk.red;
      case ErrorSeverity.CRITICAL:
        return chalk.red.bold;
      default:
        return chalk.white;
    }
  }

  /**
   * Get color function for error category
   */
  private static getCategoryColor(category: ErrorCategory): (text: string) => string {
    switch (category) {
      case ErrorCategory.VALIDATION:
        return chalk.magenta;
      case ErrorCategory.DEPENDENCY:
        return chalk.cyan;
      case ErrorCategory.TEMPLATE:
        return chalk.green;
      case ErrorCategory.PROVIDER:
        return chalk.blue;
      case ErrorCategory.IO:
        return chalk.yellow;
      case ErrorCategory.CONFIG:
        return chalk.gray;
      default:
        return chalk.white;
    }
  }

  /**
   * Format multiple errors in a summary
   */
  static formatErrorSummary(errors: BuildError[]): string {
    if (errors.length === 0) {
      return chalk.green.bold('✓ No errors found');
    }
    
    const parts: string[] = [];
    
    // Summary header
    const errorCount = errors.filter(e => e.isFatal()).length;
    const warningCount = errors.filter(e => e.severity === ErrorSeverity.WARNING).length;
    
    if (errorCount > 0) {
      parts.push(chalk.red.bold(`✗ ${errorCount} error${errorCount > 1 ? 's' : ''} found`));
    }
    
    if (warningCount > 0) {
      parts.push(chalk.yellow.bold(`⚠ ${warningCount} warning${warningCount > 1 ? 's' : ''} found`));
    }
    
    // Individual errors
    parts.push(''); // Empty line
    parts.push(...errors.map((error, index) => {
      const separator = index > 0 ? '\n' + chalk.gray('─'.repeat(60)) + '\n' : '';
      return separator + this.format(error);
    }));
    
    return parts.join('\n');
  }

  /**
   * Format a simple error message for one-line display
   */
  static formatCompact(error: BuildError): string {
    const severityColor = this.getSeverityColor(error.severity);
    const severityBadge = severityColor(`[${error.severity.toUpperCase()}]`);
    
    let location = '';
    if (error.sourceLocation) {
      const { filePath, line } = error.sourceLocation;
      location = ` ${chalk.cyan(filePath)}${line ? chalk.yellow(`:${line}`) : ''}`;
    }
    
    return `${severityBadge} ${chalk.white(error.message)}${location}`;
  }

  /**
   * Create a visual separator for multiple errors
   */
  static createSeparator(char: string = '─', length: number = 60): string {
    return chalk.gray(char.repeat(length));
  }

  /**
   * Format timestamp for error display
   */
  static formatTimestamp(timestamp: Date): string {
    return chalk.gray(`[${timestamp.toISOString()}]`);
  }
}