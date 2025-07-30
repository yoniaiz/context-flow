import { expect } from 'chai';
import { describe, it } from 'mocha';
import { ErrorFormatter } from '../../../src/errors/formatting.js';
import { ValidationError } from '../../../src/errors/validation.js';
import { DependencyError } from '../../../src/errors/dependency.js';
import { TemplateError } from '../../../src/errors/template.js';
import { ProviderError } from '../../../src/errors/provider.js';
import { ErrorSeverity } from '../../../src/errors/types.js';

// Helper function to strip ANSI color codes for testing
function stripColors(text: string): string {
  return text.replace(/\u001b\[[0-9;]*m/g, '');
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

      expect(formatted).to.include('[ERROR][VALIDATION]');
      expect(formatted).to.include('Schema validation failed');
      expect(formatted).to.include('Location: /test/component.toml:5');
      expect(formatted).to.include('Context:');
      expect(formatted).to.include('Error:');
      expect(formatted).to.include('Mitigation:');
      expect(formatted).to.include('Details:');
      expect(formatted).to.include('field: "component.name"');
      expect(formatted).to.include('expected: "string"');
    });

    it('should format error without source location', () => {
      const error = new ValidationError(
        'Test error',
        'Test context',
        'Test mitigation'
      );

      const formatted = stripColors(ErrorFormatter.format(error));

      expect(formatted).to.include('[ERROR][VALIDATION]');
      expect(formatted).to.include('Test error');
      expect(formatted).not.to.include('Location:');
      expect(formatted).to.include('Context: Test context');
    });

    it('should format error without additional data', () => {
      const error = new ValidationError(
        'Simple error',
        'Simple context',
        'Simple mitigation'
      );

      const formatted = stripColors(ErrorFormatter.format(error));

      expect(formatted).to.include('Simple error');
      expect(formatted).not.to.include('Details:');
    });

    it('should format source location with column', () => {
      const error = ValidationError.tomlParse(
        'Syntax error',
        '/test/file.toml',
        10,
        15
      );

      const formatted = stripColors(ErrorFormatter.format(error));

      expect(formatted).to.include('Location: /test/file.toml:10:15');
    });

    it('should format source location with context', () => {
      const sourceLocation = {
        filePath: '/test/file.toml',
        line: 5,
        context: 'template section'
      };

      const error = new ValidationError(
        'Test error',
        'Test context',
        'Test mitigation',
        sourceLocation
      );

      const formatted = stripColors(ErrorFormatter.format(error));

      expect(formatted).to.include('Location: /test/file.toml:5 (template section)');
    });
  });

  describe('formatErrorSummary()', () => {
    it('should format empty error list', () => {
      const formatted = stripColors(ErrorFormatter.formatErrorSummary([]));

      expect(formatted).to.equal('✓ No errors found');
    });

    it('should format single error', () => {
      const error = ValidationError.missingField('test', '/test.toml');
      const formatted = stripColors(ErrorFormatter.formatErrorSummary([error]));

      expect(formatted).to.include('✗ 1 error found');
      expect(formatted).to.include('Required field \'test\' is missing');
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

      expect(formatted).to.include('✗ 2 errors found');
      expect(formatted).to.include('⚠ 1 warning found');
      expect(formatted).to.include('─'.repeat(60)); // Separator between errors
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

      expect(formatted).to.include('⚠ 2 warnings found');
      expect(formatted).not.to.include('✗');
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

      expect(formatted).to.include('[ERROR]');
      expect(formatted).to.include('Schema validation failed');
      expect(formatted).to.include('/test/file.toml:10');
    });

    it('should format compact error without location', () => {
      const error = new ValidationError(
        'Simple error',
        'Context',
        'Mitigation'
      );

      const formatted = stripColors(ErrorFormatter.formatCompact(error));

      expect(formatted).to.include('[ERROR]');
      expect(formatted).to.include('Simple error');
      expect(formatted).not.to.include(':');
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

      expect(stripColors(ErrorFormatter.formatCompact(critical))).to.include('[CRITICAL]');
      expect(stripColors(ErrorFormatter.formatCompact(warning))).to.include('[WARNING]');
      expect(stripColors(ErrorFormatter.formatCompact(info))).to.include('[INFO]');
    });
  });

  describe('color coding', () => {
    it('should use different colors for different error categories', () => {
      const validationError = ValidationError.missingField('field', '/test.toml');
      const dependencyError = DependencyError.missing('A', 'B', '/test.toml');
      const templateError = TemplateError.syntax('Syntax error', 'template', '/test.toml');
      const providerError = ProviderError.notFound('unknown', ['file'], '/test.toml');

      // We can't easily test colors in unit tests, but we can verify the methods run without error
      expect(() => ErrorFormatter.format(validationError)).not.to.throw();
      expect(() => ErrorFormatter.format(dependencyError)).not.to.throw();
      expect(() => ErrorFormatter.format(templateError)).not.to.throw();
      expect(() => ErrorFormatter.format(providerError)).not.to.throw();
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
          field: 'testField',
          expected: 'string',
          actual: 123
        }
      );

      const formatted = stripColors(ErrorFormatter.format(error));

      expect(formatted).to.include('field: "testField"');
      expect(formatted).to.include('expected: "string"');
      expect(formatted).to.include('actual: 123');
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

      expect(formatted).to.include('dependencyChain: ["A", "B", "C"]');
    });

    it('should filter out null and undefined values', () => {
      const error = new ValidationError(
        'Test error',
        'Test context',
        'Test mitigation',
        undefined,
        {
          field: 'testField',
          expected: undefined,
          actual: undefined,
          rule: 'required'
        }
      );

      const formatted = stripColors(ErrorFormatter.format(error));

      expect(formatted).to.include('field: "testField"');
      expect(formatted).to.include('rule: "required"');
      expect(formatted).not.to.include('expected:');
      expect(formatted).not.to.include('actual:');
    });
  });

  describe('utility methods', () => {
    it('should create separator', () => {
      const separator = stripColors(ErrorFormatter.createSeparator());
      expect(separator).to.equal('─'.repeat(60));
    });

    it('should create custom separator', () => {
      const separator = stripColors(ErrorFormatter.createSeparator('=', 20));
      expect(separator).to.equal('='.repeat(20));
    });

    it('should format timestamp', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const formatted = stripColors(ErrorFormatter.formatTimestamp(date));
      expect(formatted).to.include('2023-01-01T12:00:00.000Z');
    });
  });
});