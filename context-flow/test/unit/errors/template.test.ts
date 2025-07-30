import { expect } from 'chai';
import { describe, it } from 'mocha';
import { TemplateError } from '../../../src/errors/template.js';
import { ErrorSeverity, ErrorCategory } from '../../../src/errors/types.js';

describe('TemplateError', () => {
  describe('basic error creation', () => {
    it('should create a template error with required fields', () => {
      const error = new TemplateError(
        'Template rendering failed',
        'Processing template content',
        'Check template syntax'
      );

      expect(error).to.be.instanceOf(TemplateError);
      expect(error).to.be.instanceOf(Error);
      expect(error.name).to.equal('TemplateError');
      expect(error.message).to.equal('Template rendering failed');
      expect(error.severity).to.equal(ErrorSeverity.ERROR);
      expect(error.category).to.equal(ErrorCategory.TEMPLATE);
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
          template: 'MainTemplate',
          engine: 'nunjucks',
          templateContent,
          templateType: 'render',
          availableVariables: availableVars
        }
      );

      expect(error.template).to.equal('MainTemplate');
      expect(error.engine).to.equal('nunjucks');
      expect(error.templateContent).to.equal(templateContent);
      expect(error.templateType).to.equal('render');
      expect(error.availableVariables).to.deep.equal(availableVars);
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

        expect(error.message).to.equal('Template syntax error: Unexpected token }');
        expect(error.template).to.equal('MainTemplate');
        expect(error.engine).to.equal('nunjucks');
        expect(error.templateType).to.equal('syntax');
        expect(error.sourceLocation?.line).to.equal(12);
        expect(error.sourceLocation?.column).to.equal(8);
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

        expect(error.message).to.equal('Template compilation failed: Invalid filter "unknown"');
        expect(error.template).to.equal('HeaderTemplate');
        expect(error.templateType).to.equal('compile');
        expect(error.errorInfo.mitigation).to.include('Fix the template compilation error');
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

        expect(error.message).to.equal('Template rendering failed: Variable "data" is undefined');
        expect(error.template).to.equal('ContentTemplate');
        expect(error.templateType).to.equal('render');
        expect(error.availableVariables).to.deep.equal(availableVars);
        expect(error.errorInfo.mitigation).to.include('Available variables: props, components');
      });

      it('should handle rendering error without available variables', () => {
        const error = TemplateError.rendering(
          'Rendering failed',
          'TestTemplate',
          '/test.toml'
        );

        expect(error.availableVariables).to.be.undefined;
        expect(error.errorInfo.mitigation).not.to.include('Available variables:');
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

        expect(error.message).to.equal("Undefined variable 'unknownVar' in template");
        expect(error.templateType).to.equal('variable');
        expect(error.availableVariables).to.deep.equal(availableVars);
        expect(error.errorInfo.mitigation).to.include('Available variables: props, data');
      });

      it('should handle no available variables', () => {
        const error = TemplateError.undefinedVariable(
          'missingVar',
          'TestTemplate',
          '/test.toml',
          []
        );

        expect(error.errorInfo.mitigation).to.include('Available variables: none');
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

        expect(error.message).to.equal("Invalid or missing filter 'nonexistentFilter'");
        expect(error.templateType).to.equal('filter');
        expect(error.errorInfo.context).to.include('Processing template filters');
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

        expect(error.message).to.include("Provider 'fileProvider' execution failed");
        expect(error.message).to.include('File not found: missing.txt');
        expect(error.templateType).to.equal('filter');
        expect(error.errorInfo.mitigation).to.include('Check the provider');
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

        expect(error.message).to.equal("Template 'MissingTemplate' not found");
        expect(error.template).to.equal('MissingTemplate');
        expect(error.templateType).to.equal('compile');
        expect(error.errorInfo.mitigation).to.include('/templates, /components/templates');
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

        expect(error.getTruncatedTemplateContent()).to.equal(shortContent);
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
        expect(truncated).to.have.length(103); // 100 + '...'
        expect(truncated).to.match(/\.\.\.$/); // Should end with '...'
      });

      it('should handle missing template content', () => {
        const error = new TemplateError(
          'Test error',
          'Test context',
          'Test mitigation'
        );

        expect(error.getTruncatedTemplateContent()).to.equal('No template content available');
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
      expect(formatted).to.include('[TEMPLATE]');
      expect(formatted).to.include('Undefined variable');
      expect(formatted).to.include('Location: /test/component.toml:5');
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
      expect(json.category).to.equal('template');
      expect(json.data.template).to.equal('TestTemplate');
      expect(json.data.templateType).to.equal('render');
      expect(json.data.availableVariables).to.deep.equal(availableVars);
    });
  });
});