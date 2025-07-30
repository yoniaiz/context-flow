import { expect } from 'chai';
import { describe, it } from 'mocha';
import { ValidationError } from '../../../src/errors/validation.js';
import { ErrorSeverity, ErrorCategory } from '../../../src/errors/types.js';

describe('ValidationError', () => {
  describe('basic error creation', () => {
    it('should create a validation error with required fields', () => {
      const error = new ValidationError(
        'Test validation failed',
        'Testing validation logic',
        'Fix the validation issue'
      );

      expect(error).to.be.instanceOf(ValidationError);
      expect(error).to.be.instanceOf(Error);
      expect(error.name).to.equal('ValidationError');
      expect(error.message).to.equal('Test validation failed');
      expect(error.severity).to.equal(ErrorSeverity.ERROR);
      expect(error.category).to.equal(ErrorCategory.VALIDATION);
      expect(error.errorInfo.context).to.equal('Testing validation logic');
      expect(error.errorInfo.error).to.equal('Test validation failed');
      expect(error.errorInfo.mitigation).to.equal('Fix the validation issue');
    });

    it('should accept optional source location', () => {
      const sourceLocation = {
        filePath: '/test/file.toml',
        line: 10,
        column: 5
      };

      const error = new ValidationError(
        'Test error',
        'Test context',
        'Test mitigation',
        sourceLocation
      );

      expect(error.sourceLocation).to.deep.equal(sourceLocation);
    });

    it('should accept optional field and validation details', () => {
      const error = new ValidationError(
        'Test error',
        'Test context',
        'Test mitigation',
        undefined,
        {
          field: 'testField',
          rule: 'required',
          expected: 'string',
          actual: 'undefined',
          severity: ErrorSeverity.WARNING
        }
      );

      expect(error.field).to.equal('testField');
      expect(error.rule).to.equal('required');
      expect(error.expected).to.equal('string');
      expect(error.actual).to.equal('undefined');
      expect(error.severity).to.equal(ErrorSeverity.WARNING);
    });
  });

  describe('static factory methods', () => {
    describe('schema()', () => {
      it('should create a schema validation error', () => {
        const error = ValidationError.schema(
          'component.name',
          'string',
          123,
          '/test/component.toml',
          5
        );

        expect(error.message).to.equal("Schema validation failed for field 'component.name'");
        expect(error.field).to.equal('component.name');
        expect(error.rule).to.equal('schema');
        expect(error.expected).to.equal('string');
        expect(error.actual).to.equal('123');
        expect(error.sourceLocation?.filePath).to.equal('/test/component.toml');
        expect(error.sourceLocation?.line).to.equal(5);
      });

      it('should handle object values in schema errors', () => {
        const complexObject = { nested: { value: 'test' } };
        const error = ValidationError.schema(
          'props',
          'object with specific structure',
          complexObject,
          '/test/component.toml'
        );

        expect(error.actual).to.equal(JSON.stringify(complexObject));
      });
    });

    describe('missingField()', () => {
      it('should create a missing field error', () => {
        const error = ValidationError.missingField(
          'component.version',
          '/test/component.toml',
          8
        );

        expect(error.message).to.equal("Required field 'component.version' is missing");
        expect(error.field).to.equal('component.version');
        expect(error.rule).to.equal('required');
        expect(error.expected).to.equal('defined value');
        expect(error.actual).to.equal('undefined');
        expect(error.errorInfo.context).to.include('Parsing required fields');
        expect(error.errorInfo.mitigation).to.include('Add the required field');
      });
    });

    describe('invalidPath()', () => {
      it('should create an invalid path error', () => {
        const error = ValidationError.invalidPath(
          './non-existent.toml',
          'File does not exist',
          '/test/workflow.toml',
          12
        );

        expect(error.message).to.equal('Invalid file path: ./non-existent.toml');
        expect(error.field).to.equal('path');
        expect(error.rule).to.equal('file_exists');
        expect(error.expected).to.equal('valid file path');
        expect(error.actual).to.equal('./non-existent.toml');
        expect(error.errorInfo.mitigation).to.include('File does not exist');
      });
    });

    describe('tomlParse()', () => {
      it('should create a TOML parsing error', () => {
        const error = ValidationError.tomlParse(
          'Invalid TOML syntax at line 5',
          '/test/component.toml',
          5,
          12
        );

        expect(error.message).to.equal('TOML parsing failed: Invalid TOML syntax at line 5');
        expect(error.rule).to.equal('toml_syntax');
        expect(error.expected).to.equal('valid TOML syntax');
        expect(error.actual).to.equal('Invalid TOML syntax at line 5');
        expect(error.sourceLocation?.line).to.equal(5);
        expect(error.sourceLocation?.column).to.equal(12);
      });
    });

    describe('typeMismatch()', () => {
      it('should create a type mismatch error', () => {
        const error = ValidationError.typeMismatch(
          'component.version',
          'string',
          'number',
          '/test/component.toml',
          3
        );

        expect(error.message).to.equal("Type mismatch for field 'component.version': expected string, got number");
        expect(error.field).to.equal('component.version');
        expect(error.rule).to.equal('type_check');
        expect(error.expected).to.equal('string');
        expect(error.actual).to.equal('number');
      });
    });
  });

  describe('error methods', () => {
    it('should format error message properly', () => {
      const error = ValidationError.schema(
        'test.field',
        'string',
        123,
        '/test/file.toml',
        5
      );

      const formatted = error.getFormattedMessage();
      expect(formatted).to.include('[VALIDATION]');
      expect(formatted).to.include('Schema validation failed');
      expect(formatted).to.include('Location: /test/file.toml:5');
      expect(formatted).to.include('Context:');
      expect(formatted).to.include('Error:');
      expect(formatted).to.include('Mitigation:');
    });

    it('should convert to JSON correctly', () => {
      const error = ValidationError.missingField(
        'test.field',
        '/test/file.toml'
      );

      const json = error.toJSON();
      expect(json.name).to.equal('ValidationError');
      expect(json.message).to.include('Required field');
      expect(json.severity).to.equal('error');
      expect(json.category).to.equal('validation');
      expect(json.sourceLocation.filePath).to.equal('/test/file.toml');
      expect(json.data.field).to.equal('test.field');
      expect(json.timestamp).to.be.a('string');
    });

    it('should identify fatal errors correctly', () => {
      const errorError = ValidationError.schema('field', 'string', 123, '/test.toml');
      const warningError = new ValidationError(
        'Warning message',
        'Warning context',
        'Warning mitigation',
        undefined,
        { severity: ErrorSeverity.WARNING }
      );

      expect(errorError.isFatal()).to.be.true;
      expect(warningError.isFatal()).to.be.false;
    });

    it('should create error with additional context', () => {
      const originalError = ValidationError.schema('field', 'string', 123, '/test.toml');
      const contextError = originalError.withContext('additional context');

      // Check that withContext returns a different error instance
      expect(contextError).to.not.equal(originalError);
      expect(contextError.message).to.equal(originalError.message);
      expect(contextError).to.be.instanceOf(ValidationError);
      
      // The withContext method should create a new error (basic functionality test)
      expect(contextError.timestamp).to.not.equal(originalError.timestamp);
    });
  });
});