import { describe, expect, it } from 'vitest';

import { DependencyError } from '../../../src/errors/dependency.js';
import { ErrorFormatter } from '../../../src/errors/formatting.js';
import { ProviderError } from '../../../src/errors/provider.js';
import { TemplateError } from '../../../src/errors/template.js';
import { ErrorSeverity } from '../../../src/errors/types.js';
import { ValidationError } from '../../../src/errors/validation.js';

// Helper function to strip ANSI color codes for testing
function stripColors(text: string): string {
  return text.replaceAll(/\u001B\[[0-9;]*m/g, '');
}

describe('ErrorFormatter', () => {
  describe('format()', () => {
    it('should format a validation error with all sections', () => {
      const error = ValidationError.schema(
        'component.name',
        'string',
        123,
        '/test/component.toml',
        5
      );

      const formatted = stripColors(ErrorFormatter.format(error));

      expect(formatted).toContain('[ERROR][VALIDATION]');
      expect(formatted).toContain('Schema validation failed');
      expect(formatted).toContain('Location: /test/component.toml:5');
      expect(formatted).toContain('Context:');
      expect(formatted).toContain('Error:');
      expect(formatted).toContain('Mitigation:');
      expect(formatted).toContain('Details:');
      expect(formatted).toContain('field: "component.name"');
      expect(formatted).toContain('expected: "string"');
    });

    it('should format error without source location', () => {
      const error = new ValidationError(
        'Test error',
        'Test context',
        'Test mitigation'
      );

      const formatted = stripColors(ErrorFormatter.format(error));

      expect(formatted).toContain('[ERROR][VALIDATION]');
      expect(formatted).toContain('Test error');
      expect(formatted).not.toContain('Location:');
      expect(formatted).toContain('Context: Test context');
    });

    it('should format error without additional data', () => {
      const error = new ValidationError(
        'Simple error',
        'Simple context',
        'Simple mitigation'
      );

      const formatted = stripColors(ErrorFormatter.format(error));

      expect(formatted).toContain('Simple error');
      expect(formatted).not.toContain('Details:');
    });

    it('should format source location with column', () => {
      const error = ValidationError.tomlParse(
        'Syntax error',
        '/test/file.toml',
        10,
        15
      );

      const formatted = stripColors(ErrorFormatter.format(error));

      expect(formatted).toContain('Location: /test/file.toml:10:15');
    });

    it('should format source location with context', () => {
      const sourceLocation = {
        context: 'template section',
        filePath: '/test/file.toml',
        line: 5
      };

      const error = new ValidationError(
        'Test error',
        'Test context',
        'Test mitigation',
        sourceLocation
      );

      const formatted = stripColors(ErrorFormatter.format(error));

      expect(formatted).toContain('Location: /test/file.toml:5 (template section)');
    });
  });

  describe('formatErrorSummary()', () => {
    it('should format empty error list', () => {
      const formatted = stripColors(ErrorFormatter.formatErrorSummary([]));

      expect(formatted).toBe('✓ No errors found');
    });

    it('should format single error', () => {
      const error = ValidationError.missingField('test', '/test.toml');
      const formatted = stripColors(ErrorFormatter.formatErrorSummary([error]));

      expect(formatted).toContain('✗ 1 error found');
      expect(formatted).toContain('Required field \'test\' is missing');
    });

    it('should format multiple errors with warnings', () => {
      const error1 = ValidationError.missingField('field1', '/test.toml');
      const error2 = ValidationError.missingField('field2', '/test.toml');
      const warning = new ValidationError(
        'Warning message',
        'Warning context',
        'Warning mitigation',
        undefined,
        { severity: ErrorSeverity.WARNING }
      );

      const formatted = stripColors(ErrorFormatter.formatErrorSummary([error1, error2, warning]));

      expect(formatted).toContain('✗ 2 errors found');
      expect(formatted).toContain('⚠ 1 warning found');
      expect(formatted).toContain('─'.repeat(60)); // Separator between errors
    });

    it('should format only warnings', () => {
      const warning1 = new ValidationError(
        'Warning 1',
        'Context 1',
        'Mitigation 1',
        undefined,
        { severity: ErrorSeverity.WARNING }
      );
      const warning2 = new ValidationError(
        'Warning 2',
        'Context 2',
        'Mitigation 2',
        undefined,
        { severity: ErrorSeverity.WARNING }
      );

      const formatted = stripColors(ErrorFormatter.formatErrorSummary([warning1, warning2]));

      expect(formatted).toContain('⚠ 2 warnings found');
      expect(formatted).not.toContain('✗');
    });
  });

  describe('formatCompact()', () => {
    it('should format compact error with location', () => {
      const error = ValidationError.schema(
        'test.field',
        'string',
        123,
        '/test/file.toml',
        10
      );

      const formatted = stripColors(ErrorFormatter.formatCompact(error));

      expect(formatted).toContain('[ERROR]');
      expect(formatted).toContain('Schema validation failed');
      expect(formatted).toContain('/test/file.toml:10');
    });

    it('should format compact error without location', () => {
      const error = new ValidationError(
        'Simple error',
        'Context',
        'Mitigation'
      );

      const formatted = stripColors(ErrorFormatter.formatCompact(error));

      expect(formatted).toContain('[ERROR]');
      expect(formatted).toContain('Simple error');
      expect(formatted).not.toContain(':');
    });

    it('should format different error severities', () => {
      const critical = new ValidationError(
        'Critical error',
        'Context',
        'Mitigation',
        undefined,
        { severity: ErrorSeverity.CRITICAL }
      );
      const warning = new ValidationError(
        'Warning message',
        'Context',
        'Mitigation',
        undefined,
        { severity: ErrorSeverity.WARNING }
      );
      const info = new ValidationError(
        'Info message',
        'Context',
        'Mitigation',
        undefined,
        { severity: ErrorSeverity.INFO }
      );

      expect(stripColors(ErrorFormatter.formatCompact(critical))).toContain('[CRITICAL]');
      expect(stripColors(ErrorFormatter.formatCompact(warning))).toContain('[WARNING]');
      expect(stripColors(ErrorFormatter.formatCompact(info))).toContain('[INFO]');
    });
  });

  describe('color coding', () => {
    it('should use different colors for different error categories', () => {
      const validationError = ValidationError.missingField('field', '/test.toml');
      const dependencyError = DependencyError.missing('A', 'B', '/test.toml');
      const templateError = TemplateError.syntax('Syntax error', 'template', '/test.toml');
      const providerError = ProviderError.notFound('unknown', ['file'], '/test.toml');

      // We can't easily test colors in unit tests, but we can verify the methods run without error
      expect(() => ErrorFormatter.format(validationError)).not.toThrow();
      expect(() => ErrorFormatter.format(dependencyError)).not.toThrow();
      expect(() => ErrorFormatter.format(templateError)).not.toThrow();
      expect(() => ErrorFormatter.format(providerError)).not.toThrow();
    });
  });

  describe('data formatting', () => {
    it('should format different data types correctly', () => {
      const error = new ValidationError(
        'Test error',
        'Test context',
        'Test mitigation',
        undefined,
        {
          actual: 123,
          expected: 'string',
          field: 'testField'
        }
      );

      const formatted = stripColors(ErrorFormatter.format(error));

      expect(formatted).toContain('field: "testField"');
      expect(formatted).toContain('expected: "string"');
      expect(formatted).toContain('actual: 123');
    });

    it('should handle arrays in data', () => {
      const error = new DependencyError(
        'Test error',
        'Test context',
        'Test mitigation',
        undefined,
        {
          dependencyChain: ['A', 'B', 'C']
        }
      );

      const formatted = stripColors(ErrorFormatter.format(error));

      expect(formatted).toContain('dependencyChain: ["A", "B", "C"]');
    });

    it('should filter out null and undefined values', () => {
      const error = new ValidationError(
        'Test error',
        'Test context',
        'Test mitigation',
        undefined,
        {
          actual: undefined,
          expected: undefined,
          field: 'testField',
          rule: 'required'
        }
      );

      const formatted = stripColors(ErrorFormatter.format(error));

      expect(formatted).toContain('field: "testField"');
      expect(formatted).toContain('rule: "required"');
      expect(formatted).not.toContain('expected:');
      expect(formatted).not.toContain('actual:');
    });
  });

  describe('utility methods', () => {
    it('should create separator', () => {
      const separator = stripColors(ErrorFormatter.createSeparator());
      expect(separator).toBe('─'.repeat(60));
    });

    it('should create custom separator', () => {
      const separator = stripColors(ErrorFormatter.createSeparator('=', 20));
      expect(separator).toBe('='.repeat(20));
    });

    it('should format timestamp', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const formatted = stripColors(ErrorFormatter.formatTimestamp(date));
      expect(formatted).toContain('2023-01-01T12:00:00.000Z');
    });
  });
});