import { BuildError } from './base.js';
import type { SourceLocation, ErrorInfo, ErrorSeverity } from './types.js';
import { ErrorCategory, ErrorSeverity as ErrorSeverityEnum } from './types.js';

/**
 * Error thrown when template processing or rendering fails
 */
export class TemplateError extends BuildError {
  /** The template name or identifier */
  public readonly template?: string;
  
  /** The template engine being used */
  public readonly engine?: string;
  
  /** The template content that caused the error */
  public readonly templateContent?: string;
  
  /** Type of template error */
  public readonly templateType?: 'syntax' | 'compile' | 'render' | 'filter' | 'variable';
  
  /** Variables available during template processing */
  public readonly availableVariables?: string[];

  constructor(
    message: string,
    context: string,
    mitigation: string,
    sourceLocation?: SourceLocation,
    options?: {
      template?: string;
      engine?: string;
      templateContent?: string;
      templateType?: 'syntax' | 'compile' | 'render' | 'filter' | 'variable';
      availableVariables?: string[];
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
      ErrorCategory.TEMPLATE,
      sourceLocation,
      {
        template: options?.template,
        engine: options?.engine,
        templateContent: options?.templateContent,
        templateType: options?.templateType,
        availableVariables: options?.availableVariables
      }
    );

    this.template = options?.template;
    this.engine = options?.engine;
    this.templateContent = options?.templateContent;
    this.templateType = options?.templateType;
    this.availableVariables = options?.availableVariables;
  }

  /**
   * Create a TemplateError for syntax errors
   */
  static syntax(
    syntaxError: string,
    template: string,
    filePath: string,
    line?: number,
    column?: number
  ): TemplateError {
    const message = `Template syntax error: ${syntaxError}`;
    const context = `Parsing template '${template}' in ${filePath}`;
    const mitigation = `Fix the template syntax error in '${template}': ${syntaxError}`;
    
    return new TemplateError(
      message,
      context,
      mitigation,
      { filePath, line, column },
      {
        template,
        engine: 'nunjucks',
        templateType: 'syntax'
      }
    );
  }

  /**
   * Create a TemplateError for compilation failures
   */
  static compilation(
    compilationError: string,
    template: string,
    filePath: string,
    line?: number
  ): TemplateError {
    const message = `Template compilation failed: ${compilationError}`;
    const context = `Compiling template '${template}' from ${filePath}`;
    const mitigation = `Fix the template compilation error in '${template}': ${compilationError}`;
    
    return new TemplateError(
      message,
      context,
      mitigation,
      { filePath, line },
      {
        template,
        engine: 'nunjucks',
        templateType: 'compile'
      }
    );
  }

  /**
   * Create a TemplateError for rendering failures
   */
  static rendering(
    renderError: string,
    template: string,
    filePath: string,
    availableVariables?: string[],
    line?: number
  ): TemplateError {
    const message = `Template rendering failed: ${renderError}`;
    const context = `Rendering template '${template}' from ${filePath}`;
    const mitigation = `Check template variables and context in '${template}'. ${availableVariables ? `Available variables: ${availableVariables.join(', ')}` : ''}`;
    
    return new TemplateError(
      message,
      context,
      mitigation,
      { filePath, line },
      {
        template,
        engine: 'nunjucks',
        templateType: 'render',
        availableVariables
      }
    );
  }

  /**
   * Create a TemplateError for undefined variables
   */
  static undefinedVariable(
    variable: string,
    template: string,
    filePath: string,
    availableVariables: string[] = [],
    line?: number
  ): TemplateError {
    const message = `Undefined variable '${variable}' in template`;
    const context = `Processing template '${template}' in ${filePath}`;
    const mitigation = `Define the variable '${variable}' or check for typos. Available variables: ${availableVariables.join(', ') || 'none'}`;
    
    return new TemplateError(
      message,
      context,
      mitigation,
      { filePath, line },
      {
        template,
        engine: 'nunjucks',
        templateType: 'variable',
        availableVariables
      }
    );
  }

  /**
   * Create a TemplateError for missing or invalid filters
   */
  static invalidFilter(
    filter: string,
    template: string,
    filePath: string,
    line?: number
  ): TemplateError {
    const message = `Invalid or missing filter '${filter}'`;
    const context = `Processing template filters in '${template}' from ${filePath}`;
    const mitigation = `Check that the filter '${filter}' is available and correctly spelled in template '${template}'`;
    
    return new TemplateError(
      message,
      context,
      mitigation,
      { filePath, line },
      {
        template,
        engine: 'nunjucks',
        templateType: 'filter'
      }
    );
  }

  /**
   * Create a TemplateError for provider execution failures
   */
  static providerExecution(
    provider: string,
    providerError: string,
    template: string,
    filePath: string,
    line?: number
  ): TemplateError {
    const message = `Provider '${provider}' execution failed: ${providerError}`;
    const context = `Executing provider '${provider}' in template '${template}' from ${filePath}`;
    const mitigation = `Check the provider '${provider}' configuration and arguments. Error: ${providerError}`;
    
    return new TemplateError(
      message,
      context,
      mitigation,
      { filePath, line },
      {
        template,
        engine: 'nunjucks',
        templateType: 'filter'
      }
    );
  }

  /**
   * Create a TemplateError for template not found
   */
  static notFound(
    template: string,
    searchPaths: string[],
    filePath: string
  ): TemplateError {
    const message = `Template '${template}' not found`;
    const context = `Loading template '${template}' referenced in ${filePath}`;
    const mitigation = `Ensure template '${template}' exists in one of the search paths: ${searchPaths.join(', ')}`;
    
    return new TemplateError(
      message,
      context,
      mitigation,
      { filePath },
      {
        template,
        engine: 'nunjucks',
        templateType: 'compile'
      }
    );
  }

  /**
   * Get truncated template content for display (max 100 characters)
   */
  getTruncatedTemplateContent(): string {
    if (!this.templateContent) {
      return 'No template content available';
    }
    
    const maxLength = 100;
    if (this.templateContent.length <= maxLength) {
      return this.templateContent;
    }
    
    return this.templateContent.substring(0, maxLength) + '...';
  }
}