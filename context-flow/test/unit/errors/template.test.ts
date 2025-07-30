import { describe, expect, it } from 'vitest';

import { TemplateError } from '../../../src/errors/template.js';
import { ErrorCategory, ErrorSeverity } from '../../../src/errors/types.js';

describe('TemplateError', () => {
  describe('basic error creation', () => {
    it('should create a template error with required fields', () => {
      const error = new TemplateError(
        'Template rendering failed',
        'Processing template content',
        'Check template syntax'
      );

      expect(error).toBeInstanceOf(TemplateError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('TemplateError');
      expect(error.message).toBe('Template rendering failed');
      expect(error.severity).toBe(ErrorSeverity.ERROR);
      expect(error.category).toBe(ErrorCategory.TEMPLATE);
    });

    it('should accept optional template details', () => {
      const availableVars = ['props', 'components', 'data'];
      const templateContent = '{{ props.name }} - {{ components.header }}';
      const error = new TemplateError(
        'Test error',
        'Test context',
        'Test mitigation',
        { filePath: '/test/template.toml' },
        {
          availableVariables: availableVars,
          engine: 'nunjucks',
          template: 'MainTemplate',
          templateContent,
          templateType: 'render'
        }
      );

      expect(error.template).toBe('MainTemplate');
      expect(error.engine).toBe('nunjucks');
      expect(error.templateContent).toBe(templateContent);
      expect(error.templateType).toBe('render');
      expect(error.availableVariables).toEqual(availableVars);
    });
  });

  describe('static factory methods', () => {
    describe('syntax()', () => {
      it('should create a template syntax error', () => {
        const error = TemplateError.syntax(
          'Unexpected token }',
          'MainTemplate',
          '/test/component.toml',
          12,
          8
        );

        expect(error.message).toBe('Template syntax error: Unexpected token }');
        expect(error.template).toBe('MainTemplate');
        expect(error.engine).toBe('nunjucks');
        expect(error.templateType).toBe('syntax');
        expect(error.sourceLocation?.line).toBe(12);
        expect(error.sourceLocation?.column).toBe(8);
      });
    });

    describe('compilation()', () => {
      it('should create a template compilation error', () => {
        const error = TemplateError.compilation(
          'Invalid filter "unknown"',
          'HeaderTemplate',
          '/test/component.toml',
          5
        );

        expect(error.message).toBe('Template compilation failed: Invalid filter "unknown"');
        expect(error.template).toBe('HeaderTemplate');
        expect(error.templateType).toBe('compile');
        expect(error.errorInfo.mitigation).toContain('Fix the template compilation error');
      });
    });

    describe('rendering()', () => {
      it('should create a template rendering error', () => {
        const availableVars = ['props', 'components'];
        const error = TemplateError.rendering(
          'Variable "data" is undefined',
          'ContentTemplate',
          '/test/component.toml',
          availableVars,
          8
        );

        expect(error.message).toBe('Template rendering failed: Variable "data" is undefined');
        expect(error.template).toBe('ContentTemplate');
        expect(error.templateType).toBe('render');
        expect(error.availableVariables).toEqual(availableVars);
        expect(error.errorInfo.mitigation).toContain('Available variables: props, components');
      });

      it('should handle rendering error without available variables', () => {
        const error = TemplateError.rendering(
          'Rendering failed',
          'TestTemplate',
          '/test.toml'
        );

        expect(error.availableVariables).toBeUndefined();
        expect(error.errorInfo.mitigation).not.toContain('Available variables:');
      });
    });

    describe('undefinedVariable()', () => {
      it('should create an undefined variable error', () => {
        const availableVars = ['props', 'data'];
        const error = TemplateError.undefinedVariable(
          'unknownVar',
          'TestTemplate',
          '/test/component.toml',
          availableVars,
          10
        );

        expect(error.message).toBe("Undefined variable 'unknownVar' in template");
        expect(error.templateType).toBe('variable');
        expect(error.availableVariables).toEqual(availableVars);
        expect(error.errorInfo.mitigation).toContain('Available variables: props, data');
      });

      it('should handle no available variables', () => {
        const error = TemplateError.undefinedVariable(
          'missingVar',
          'TestTemplate',
          '/test.toml',
          []
        );

        expect(error.errorInfo.mitigation).toContain('Available variables: none');
      });
    });

    describe('invalidFilter()', () => {
      it('should create an invalid filter error', () => {
        const error = TemplateError.invalidFilter(
          'nonexistentFilter',
          'TestTemplate',
          '/test/component.toml',
          15
        );

        expect(error.message).toBe("Invalid or missing filter 'nonexistentFilter'");
        expect(error.templateType).toBe('filter');
        expect(error.errorInfo.context).toContain('Processing template filters');
      });
    });

    describe('providerExecution()', () => {
      it('should create a provider execution error', () => {
        const error = TemplateError.providerExecution(
          'fileProvider',
          'File not found: missing.txt',
          'TestTemplate',
          '/test/component.toml',
          7
        );

        expect(error.message).toContain("Provider 'fileProvider' execution failed");
        expect(error.message).toContain('File not found: missing.txt');
        expect(error.templateType).toBe('filter');
        expect(error.errorInfo.mitigation).toContain('Check the provider');
      });
    });

    describe('notFound()', () => {
      it('should create a template not found error', () => {
        const searchPaths = ['/templates', '/components/templates'];
        const error = TemplateError.notFound(
          'MissingTemplate',
          searchPaths,
          '/test/component.toml'
        );

        expect(error.message).toBe("Template 'MissingTemplate' not found");
        expect(error.template).toBe('MissingTemplate');
        expect(error.templateType).toBe('compile');
        expect(error.errorInfo.mitigation).toContain('/templates, /components/templates');
      });
    });
  });

  describe('utility methods', () => {
    describe('getTruncatedTemplateContent()', () => {
      it('should return full content if short', () => {
        const shortContent = '{{ props.name }}';
        const error = new TemplateError(
          'Test error',
          'Test context',
          'Test mitigation',
          undefined,
          { templateContent: shortContent }
        );

        expect(error.getTruncatedTemplateContent()).toBe(shortContent);
      });

      it('should truncate long content', () => {
        const longContent = 'a'.repeat(150);
        const error = new TemplateError(
          'Test error',
          'Test context',
          'Test mitigation',
          undefined,
          { templateContent: longContent }
        );

        const truncated = error.getTruncatedTemplateContent();
        expect(truncated).toHaveLength(103); // 100 + '...'
        expect(truncated).toMatch(/\.\.\.$/); // Should end with '...'
      });

      it('should handle missing template content', () => {
        const error = new TemplateError(
          'Test error',
          'Test context',
          'Test mitigation'
        );

        expect(error.getTruncatedTemplateContent()).toBe('No template content available');
      });
    });
  });

  describe('error formatting', () => {
    it('should format template error with details', () => {
      const error = TemplateError.undefinedVariable(
        'missingVar',
        'TestTemplate',
        '/test/component.toml',
        ['props', 'data'],
        5
      );

      const formatted = error.getFormattedMessage();
      expect(formatted).toContain('[TEMPLATE]');
      expect(formatted).toContain('Undefined variable');
      expect(formatted).toContain('Location: /test/component.toml:5');
    });

    it('should include template data in JSON output', () => {
      const availableVars = ['props', 'components'];
      const error = TemplateError.rendering(
        'Rendering failed',
        'TestTemplate',
        '/test.toml',
        availableVars
      );

      const json = error.toJSON();
      expect(json.category).toBe('template');
      expect(json.data.template).toBe('TestTemplate');
      expect(json.data.templateType).toBe('render');
      expect(json.data.availableVariables).toEqual(availableVars);
    });
  });
});