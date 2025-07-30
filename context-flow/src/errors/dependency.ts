import { BuildError } from './base.js';
import type { SourceLocation, ErrorInfo, ErrorSeverity } from './types.js';
import { ErrorCategory, ErrorSeverity as ErrorSeverityEnum } from './types.js';

/**
 * Error thrown when component dependency resolution fails
 */
export class DependencyError extends BuildError {
  /** The component that has the dependency issue */
  public readonly component?: string;
  
  /** The dependency that caused the error */
  public readonly dependency?: string;
  
  /** The dependency chain leading to this error */
  public readonly dependencyChain?: string[];
  
  /** Type of dependency error */
  public readonly dependencyType?: 'circular' | 'missing' | 'version' | 'invalid';

  constructor(
    message: string,
    context: string,
    mitigation: string,
    sourceLocation?: SourceLocation,
    options?: {
      component?: string;
      dependency?: string;
      dependencyChain?: string[];
      dependencyType?: 'circular' | 'missing' | 'version' | 'invalid';
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
      ErrorCategory.DEPENDENCY,
      sourceLocation,
      {
        component: options?.component,
        dependency: options?.dependency,
        dependencyChain: options?.dependencyChain,
        dependencyType: options?.dependencyType
      }
    );

    this.component = options?.component;
    this.dependency = options?.dependency;
    this.dependencyChain = options?.dependencyChain;
    this.dependencyType = options?.dependencyType;
  }

  /**
   * Create a DependencyError for circular dependencies
   */
  static circular(
    dependencyChain: string[],
    filePath: string,
    line?: number
  ): DependencyError {
    const chainStr = dependencyChain.join(' -> ');
    const message = `Circular dependency detected: ${chainStr}`;
    const context = `Resolving component dependencies from ${filePath}`;
    const mitigation = `Break the circular dependency by removing one of the references in the chain: ${chainStr}`;
    
    return new DependencyError(
      message,
      context,
      mitigation,
      { filePath, line },
      {
        component: dependencyChain[0],
        dependency: dependencyChain[dependencyChain.length - 1],
        dependencyChain,
        dependencyType: 'circular'
      }
    );
  }

  /**
   * Create a DependencyError for missing dependencies
   */
  static missing(
    component: string,
    dependency: string,
    filePath: string,
    line?: number
  ): DependencyError {
    const message = `Missing dependency '${dependency}' required by component '${component}'`;
    const context = `Resolving dependencies for component '${component}' in ${filePath}`;
    const mitigation = `Ensure that component '${dependency}' exists and is accessible, or remove the reference from '${component}'`;
    
    return new DependencyError(
      message,
      context,
      mitigation,
      { filePath, line },
      {
        component,
        dependency,
        dependencyType: 'missing'
      }
    );
  }

  /**
   * Create a DependencyError for invalid dependency references
   */
  static invalid(
    component: string,
    dependency: string,
    reason: string,
    filePath: string,
    line?: number
  ): DependencyError {
    const message = `Invalid dependency reference '${dependency}' in component '${component}': ${reason}`;
    const context = `Validating dependency references in ${filePath}`;
    const mitigation = `Fix the dependency reference '${dependency}' in component '${component}'. ${reason}`;
    
    return new DependencyError(
      message,
      context,
      mitigation,
      { filePath, line },
      {
        component,
        dependency,
        dependencyType: 'invalid'
      }
    );
  }

  /**
   * Create a DependencyError for version conflicts
   */
  static versionConflict(
    component: string,
    dependency: string,
    requiredVersion: string,
    availableVersion: string,
    filePath: string,
    line?: number
  ): DependencyError {
    const message = `Version conflict for dependency '${dependency}': requires ${requiredVersion}, but ${availableVersion} is available`;
    const context = `Resolving version requirements for component '${component}' in ${filePath}`;
    const mitigation = `Update component '${component}' to use version ${availableVersion} of '${dependency}', or provide version ${requiredVersion}`;
    
    return new DependencyError(
      message,
      context,
      mitigation,
      { filePath, line },
      {
        component,
        dependency,
        dependencyType: 'version'
      }
    );
  }

  /**
   * Create a DependencyError for resolution failures
   */
  static resolutionFailed(
    component: string,
    reason: string,
    filePath: string,
    line?: number
  ): DependencyError {
    const message = `Failed to resolve dependencies for component '${component}': ${reason}`;
    const context = `Building dependency graph for ${filePath}`;
    const mitigation = `Check the dependency configuration for component '${component}' and ensure all referenced components are valid`;
    
    return new DependencyError(
      message,
      context,
      mitigation,
      { filePath, line },
      {
        component,
        dependencyType: 'invalid'
      }
    );
  }

  /**
   * Get a formatted dependency chain for display
   */
  getFormattedDependencyChain(): string {
    if (!this.dependencyChain || this.dependencyChain.length === 0) {
      return 'No dependency chain available';
    }
    
    return this.dependencyChain
      .map((dep, index) => {
        const isLast = index === this.dependencyChain!.length - 1;
        const arrow = isLast ? '' : ' -> ';
        return `${dep}${arrow}`;
      })
      .join('');
  }
}