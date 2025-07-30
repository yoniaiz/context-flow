import { BuildError } from './base.js';
import type { SourceLocation, ErrorInfo, ErrorSeverity } from './types.js';
import { ErrorCategory, ErrorSeverity as ErrorSeverityEnum } from './types.js';

/**
 * Error thrown when provider execution fails
 */
export class ProviderError extends BuildError {
  /** The provider name that failed */
  public readonly provider?: string;
  
  /** The provider arguments that were passed */
  public readonly providerArgs?: Record<string, any>;
  
  /** Type of provider error */
  public readonly providerType?: 'execution' | 'not_found' | 'invalid_args' | 'timeout' | 'permission';
  
  /** The exit code or error code from the provider */
  public readonly exitCode?: number;
  
  /** Standard output from the provider (if any) */
  public readonly stdout?: string;
  
  /** Standard error output from the provider (if any) */
  public readonly stderr?: string;

  constructor(
    message: string,
    context: string,
    mitigation: string,
    sourceLocation?: SourceLocation,
    options?: {
      provider?: string;
      providerArgs?: Record<string, any>;
      providerType?: 'execution' | 'not_found' | 'invalid_args' | 'timeout' | 'permission';
      exitCode?: number;
      stdout?: string;
      stderr?: string;
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
      ErrorCategory.PROVIDER,
      sourceLocation,
      {
        provider: options?.provider,
        providerArgs: options?.providerArgs,
        providerType: options?.providerType,
        exitCode: options?.exitCode,
        stdout: options?.stdout,
        stderr: options?.stderr
      }
    );

    this.provider = options?.provider;
    this.providerArgs = options?.providerArgs;
    this.providerType = options?.providerType;
    this.exitCode = options?.exitCode;
    this.stdout = options?.stdout;
    this.stderr = options?.stderr;
  }

  /**
   * Create a ProviderError for provider not found
   */
  static notFound(
    provider: string,
    availableProviders: string[],
    filePath: string,
    line?: number
  ): ProviderError {
    const message = `Provider '${provider}' not found`;
    const context = `Looking up provider '${provider}' in ${filePath}`;
    const mitigation = `Use one of the available providers: ${availableProviders.join(', ')} or install provider '${provider}'`;
    
    return new ProviderError(
      message,
      context,
      mitigation,
      { filePath, line },
      {
        provider,
        providerType: 'not_found'
      }
    );
  }

  /**
   * Create a ProviderError for invalid arguments
   */
  static invalidArgs(
    provider: string,
    args: Record<string, any>,
    reason: string,
    filePath: string,
    line?: number
  ): ProviderError {
    const message = `Invalid arguments for provider '${provider}': ${reason}`;
    const context = `Validating arguments for provider '${provider}' in ${filePath}`;
    const mitigation = `Check the arguments passed to provider '${provider}'. ${reason}`;
    
    return new ProviderError(
      message,
      context,
      mitigation,
      { filePath, line },
      {
        provider,
        providerArgs: args,
        providerType: 'invalid_args'
      }
    );
  }

  /**
   * Create a ProviderError for execution failures
   */
  static execution(
    provider: string,
    error: string,
    filePath: string,
    exitCode?: number,
    stdout?: string,
    stderr?: string,
    line?: number
  ): ProviderError {
    const message = `Provider '${provider}' execution failed${exitCode ? ` with exit code ${exitCode}` : ''}: ${error}`;
    const context = `Executing provider '${provider}' from ${filePath}`;
    const mitigation = `Check the provider '${provider}' configuration and ensure it has the necessary permissions and dependencies`;
    
    return new ProviderError(
      message,
      context,
      mitigation,
      { filePath, line },
      {
        provider,
        providerType: 'execution',
        exitCode,
        stdout,
        stderr
      }
    );
  }

  /**
   * Create a ProviderError for file-related failures
   */
  static fileAccess(
    provider: string,
    filePath: string,
    targetFile: string,
    reason: string,
    line?: number
  ): ProviderError {
    const message = `Provider '${provider}' cannot access file '${targetFile}': ${reason}`;
    const context = `Provider '${provider}' attempting to access file from ${filePath}`;
    const mitigation = `Ensure file '${targetFile}' exists and is readable, or check the file path for typos`;
    
    return new ProviderError(
      message,
      context,
      mitigation,
      { filePath, line },
      {
        provider,
        providerType: 'permission',
        providerArgs: { file: targetFile }
      }
    );
  }

  /**
   * Create a ProviderError for timeout failures
   */
  static timeout(
    provider: string,
    timeoutMs: number,
    filePath: string,
    line?: number
  ): ProviderError {
    const message = `Provider '${provider}' timed out after ${timeoutMs}ms`;
    const context = `Executing provider '${provider}' from ${filePath}`;
    const mitigation = `Increase the timeout for provider '${provider}' or check if the provider is hanging`;
    
    return new ProviderError(
      message,
      context,
      mitigation,
      { filePath, line },
      {
        provider,
        providerType: 'timeout'
      }
    );
  }

  /**
   * Create a ProviderError for git-related failures
   */
  static gitError(
    provider: string,
    gitError: string,
    filePath: string,
    line?: number
  ): ProviderError {
    const message = `Git provider '${provider}' failed: ${gitError}`;
    const context = `Executing git provider '${provider}' from ${filePath}`;
    const mitigation = `Ensure you are in a git repository and have the necessary permissions. Git error: ${gitError}`;
    
    return new ProviderError(
      message,
      context,
      mitigation,
      { filePath, line },
      {
        provider,
        providerType: 'execution'
      }
    );
  }

  /**
   * Create a ProviderError for network-related failures
   */
  static networkError(
    provider: string,
    url: string,
    networkError: string,
    filePath: string,
    line?: number
  ): ProviderError {
    const message = `Network provider '${provider}' failed to fetch '${url}': ${networkError}`;
    const context = `Fetching remote content with provider '${provider}' from ${filePath}`;
    const mitigation = `Check network connectivity and ensure URL '${url}' is accessible`;
    
    return new ProviderError(
      message,
      context,
      mitigation,
      { filePath, line },
      {
        provider,
        providerType: 'execution',
        providerArgs: { url }
      }
    );
  }

  /**
   * Get formatted provider output for debugging
   */
  getFormattedOutput(): string {
    const parts: string[] = [];
    
    if (this.stdout && this.stdout.trim()) {
      parts.push(`STDOUT:\n${this.stdout.trim()}`);
    }
    
    if (this.stderr && this.stderr.trim()) {
      parts.push(`STDERR:\n${this.stderr.trim()}`);
    }
    
    if (this.exitCode !== undefined) {
      parts.push(`Exit Code: ${this.exitCode}`);
    }
    
    return parts.length > 0 ? parts.join('\n\n') : 'No output available';
  }

  /**
   * Get formatted provider arguments for debugging
   */
  getFormattedArgs(): string {
    if (!this.providerArgs) {
      return 'No arguments provided';
    }
    
    return Object.entries(this.providerArgs)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ');
  }
}