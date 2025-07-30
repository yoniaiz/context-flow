import { describe, expect, it } from 'vitest';

import { ErrorCategory, ErrorSeverity } from '../../../src/errors/types.js';
import { ValidationError } from '../../../src/errors/validation.js';

describe('ValidationError', () => {
  describe('basic error creation', () => {
    it('should create a validation error with required fields', () => {
      const error = new ValidationError(
        'Test validation failed',
        'Testing validation logic',
        'Fix the validation issue'
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Test validation failed');
      expect(error.severity).toBe(ErrorSeverity.ERROR);
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.errorInfo.context).toBe('Testing validation logic');
      expect(error.errorInfo.error).toBe('Test validation failed');
      expect(error.errorInfo.mitigation).toBe('Fix the validation issue');
    });

    it('should accept optional source location', () => {
      const sourceLocation = {
        column: 5,
        filePath: '/test/file.toml',
        line: 10
      };

      const error = new ValidationError(
        'Test error',
        'Test context',
        'Test mitigation',
        sourceLocation
      );

      expect(error.sourceLocation).toEqual(sourceLocation);
    });

    it('should accept optional field and validation details', () => {
      const validationOptions = {
        actual: 123,
        expected: 'string',
        field: 'testField',
        rule: 'type_check'
      };

      const error = new ValidationError(
        'Test error',
        'Test context',
        'Test mitigation',
        undefined,
        validationOptions
      );

      expect(error.field).toBe('testField');
      expect(error.expected).toBe('string');
      expect(error.actual).toBe(123);
      expect(error.rule).toBe('type_check');
    });
  });

  describe('error formatting', () => {
    it('should format error without source location', () => {
      const error = new ValidationError(
        'Field validation failed',
        'Validating component schema',
        'Check field types'
      );

      const formatted = error.getFormattedMessage();
      expect(formatted).toContain('Field validation failed');
      expect(formatted).toContain('Context: Validating component schema');
      expect(formatted).toContain('Mitigation: Check field types');
    });

    it('should format error with source location', () => {
      const sourceLocation = {
        column: 8,
        filePath: '/test/component.toml',
        line: 15
      };

      const error = new ValidationError(
        'Invalid property',
        'Parsing component file',
        'Fix the property value',
        sourceLocation
      );

      const formatted = error.getFormattedMessage();
      expect(formatted).toContain('Invalid property');
      expect(formatted).toContain('/test/component.toml:15:8');
      expect(formatted).toContain('Context: Parsing component file');
      expect(formatted).toContain('Mitigation: Fix the property value');
    });

    it('should format error with validation details', () => {
      const validationOptions = {
        actual: 123,
        expected: 'string',
        field: 'version',
        rule: 'type_check'
      };

      const error = new ValidationError(
        'Type mismatch',
        'Schema validation',
        'Correct the type',
        undefined,
        validationOptions
      );

      const formatted = error.getFormattedMessage();
      expect(formatted).toContain('Type mismatch');
      expect(formatted).toContain('Context: Schema validation');
      expect(formatted).toContain('Mitigation: Correct the type');
    });

    it('should format complete error with all details', () => {
      const sourceLocation = {
        column: 12,
        filePath: '/test/workflow.toml',
        line: 20
      };

      const validationOptions = {
        actual: 'undefined',
        expected: 'string',
        field: 'name',
        rule: 'required'
      };

      const error = new ValidationError(
        'Required field missing',
        'Workflow schema validation',
        'Add the missing field',
        sourceLocation,
        validationOptions
      );

      const formatted = error.getFormattedMessage();
      expect(formatted).toContain('Required field missing');
      expect(formatted).toContain('/test/workflow.toml:20:12');
      expect(formatted).toContain('Context: Workflow schema validation');
      expect(formatted).toContain('Mitigation: Add the missing field');
    });
  });

  describe('static factory methods', () => {
    it('should create schema validation error', () => {
      const error = ValidationError.schema(
        'component.name',
        'string',
        123,
        '/test/file.toml',
        5
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('Schema validation failed');
      expect(error.field).toBe('component.name');
      expect(error.expected).toBe('string');
      expect(error.actual).toBe('123');
      expect(error.rule).toBe('schema');
      expect(error.sourceLocation?.filePath).toBe('/test/file.toml');
      expect(error.sourceLocation?.line).toBe(5);
    });

    it('should create missing field error', () => {
      const error = ValidationError.missingField(
        'required_field',
        '/missing/file.toml',
        10
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('Required field \'required_field\' is missing');
      expect(error.field).toBe('required_field');
      expect(error.rule).toBe('required');
      expect(error.sourceLocation?.filePath).toBe('/missing/file.toml');
      expect(error.sourceLocation?.line).toBe(10);
    });

    it('should create path validation error', () => {
      const error = ValidationError.invalidPath(
        '/invalid/path.toml',
        'Invalid file extension',
        '/test/workflow.toml',
        8
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('Invalid file path');
      expect(error.field).toBe('path');
      expect(error.rule).toBe('file_exists');
      expect(error.sourceLocation?.filePath).toBe('/test/workflow.toml');
      expect(error.sourceLocation?.line).toBe(8);
      expect(error.errorInfo.mitigation).toContain('Invalid file extension');
    });

    it('should create TOML parse error', () => {
      const error = ValidationError.tomlParse(
        'Unexpected token }',
        '/test/file.toml',
        12,
        15
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('TOML parsing failed');
      expect(error.rule).toBe('toml_syntax');
      expect(error.sourceLocation?.line).toBe(12);
      expect(error.sourceLocation?.column).toBe(15);
    });

    it('should create type mismatch error', () => {
      const error = ValidationError.typeMismatch(
        'component.version',
        'string',
        'number',
        '/test/component.toml',
        3
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('Type mismatch');
      expect(error.field).toBe('component.version');
      expect(error.expected).toBe('string');
      expect(error.actual).toBe('number');
      expect(error.rule).toBe('type_check');
    });
  });

  describe('error inheritance', () => {
    it('should maintain Error prototype chain', () => {
      const error = new ValidationError(
        'Test error',
        'Test context',
        'Test mitigation'
      );

      expect(error instanceof Error).toBe(true);
      expect(error instanceof ValidationError).toBe(true);
      expect(error.name).toBe('ValidationError');
      expect(error.stack).toBeDefined();
    });

    it('should be catchable as Error', () => {
      const throwValidationError = () => {
        throw new ValidationError(
          'Test error',
          'Test context',
          'Test mitigation'
        );
      };

      expect(throwValidationError).toThrow(Error);
      expect(throwValidationError).toThrow(ValidationError);
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      const error = new ValidationError('', '', '');

      expect(error.message).toBe('');
      expect(error.errorInfo.context).toBe('');
      expect(error.errorInfo.mitigation).toBe('');
    });

    it('should handle undefined optional parameters', () => {
      const error = new ValidationError(
        'Test error',
        'Test context',
        'Test mitigation',
        undefined,
        undefined
      );

      expect(error.sourceLocation).toBeUndefined();
      expect(error.field).toBeUndefined();
      expect(error.rule).toBeUndefined();
    });

    it('should handle partial source location', () => {
      const sourceLocation = {
        filePath: '/test/file.toml'
        // line and column missing
      };

      const error = new ValidationError(
        'Test error',
        'Test context',
        'Test mitigation',
        sourceLocation as any
      );

      const formatted = error.getFormattedMessage();
      expect(formatted).toContain('/test/file.toml');
    });
  });
});