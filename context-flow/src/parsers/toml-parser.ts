import { parse } from 'smol-toml';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { componentSchema } from '../schemas/component.js';
import { workflowSchema } from '../schemas/workflow.js';
import type { ComponentDefinition, WorkflowDefinition } from '../types/basic.js';
import { ValidationError } from '../errors/index.js';

/**
 * Simple TOML parser with basic Zod validation for Context Flow
 */
export class TOMLParser {
  private componentCache = new Map<string, ComponentDefinition>();
  private workflowCache = new Map<string, WorkflowDefinition>();

  /**
   * Validate that component paths in the 'use' section exist
   */
  private validateComponentPaths(useSection: Record<string, unknown> | undefined, baseDir: string, sourceFile: string): void {
    if (!useSection) return;

    for (const [componentName, relativePath] of Object.entries(useSection)) {
      if (typeof relativePath !== 'string') {
        throw ValidationError.typeMismatch(
          `use.${componentName}`,
          'string',
          typeof relativePath,
          sourceFile
        );
      }

      const fullPath = resolve(baseDir, relativePath);
      
      if (!existsSync(fullPath)) {
        throw ValidationError.invalidPath(
          relativePath,
          `File does not exist at resolved path: ${fullPath}`,
          sourceFile
        );
      }

      if (!fullPath.endsWith('.component.toml')) {
        throw ValidationError.invalidPath(
          relativePath,
          'Component references must point to .component.toml files',
          sourceFile
        );
      }
    }
  }

  /**
   * Parse a component TOML file
   */
  async parseComponent(filePath: string): Promise<ComponentDefinition> {
    const resolvedPath = resolve(filePath);
    
    if (this.componentCache.has(resolvedPath)) {
      return this.componentCache.get(resolvedPath)!;
    }

    try {
      if (!existsSync(resolvedPath)) {
        throw ValidationError.invalidPath(
          filePath,
          'Component file does not exist',
          filePath
        );
      }

      const content = readFileSync(resolvedPath, 'utf-8');
      let parsed: any;
      
      try {
        parsed = parse(content);
      } catch (parseError) {
        throw ValidationError.tomlParse(
          parseError instanceof Error ? parseError.message : 'Unknown TOML parsing error',
          resolvedPath
        );
      }
      
      // Validate with Zod schema
      let validated: any;
      try {
        validated = componentSchema.parse(parsed);
      } catch (zodError: any) {
        // Extract first validation error from Zod
        const firstError = zodError.errors?.[0];
        if (firstError) {
          throw ValidationError.schema(
            firstError.path?.join('.') || 'unknown',
            firstError.message,
            firstError.received,
            resolvedPath
          );
        }
        throw ValidationError.schema(
          'unknown',
          zodError.message || 'Schema validation failed',
          'unknown',
          resolvedPath
        );
      }
      
      // Validate component paths
      const baseDir = dirname(resolvedPath);
      this.validateComponentPaths(validated.use, baseDir, resolvedPath);
      
      // Convert to our internal type
      const component: ComponentDefinition = {
        component: validated.component,
        props: validated.props,
        use: validated.use,
        template: validated.template,
        targets: validated.targets,
      };

      this.componentCache.set(resolvedPath, component);
      return component;
    } catch (error) {
      // Re-throw ValidationErrors as-is, wrap other errors
      if (error instanceof ValidationError) {
        throw error;
      }
      throw ValidationError.schema(
        'unknown',
        `Failed to parse component file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'unknown',
        resolvedPath
      );
    }
  }

  /**
   * Parse a workflow TOML file
   */
  async parseWorkflow(filePath: string): Promise<WorkflowDefinition> {
    const resolvedPath = resolve(filePath);
    
    if (this.workflowCache.has(resolvedPath)) {
      return this.workflowCache.get(resolvedPath)!;
    }

    try {
      if (!existsSync(resolvedPath)) {
        throw ValidationError.invalidPath(
          filePath,
          'Workflow file does not exist',
          filePath
        );
      }

      const content = readFileSync(resolvedPath, 'utf-8');
      let parsed: any;
      
      try {
        parsed = parse(content);
      } catch (parseError) {
        throw ValidationError.tomlParse(
          parseError instanceof Error ? parseError.message : 'Unknown TOML parsing error',
          resolvedPath
        );
      }
      
      // Validate with Zod schema
      let validated: any;
      try {
        validated = workflowSchema.parse(parsed);
      } catch (zodError: any) {
        // Extract first validation error from Zod
        const firstError = zodError.errors?.[0];
        if (firstError) {
          throw ValidationError.schema(
            firstError.path?.join('.') || 'unknown',
            firstError.message,
            firstError.received,
            resolvedPath
          );
        }
        throw ValidationError.schema(
          'unknown',
          zodError.message || 'Schema validation failed',
          'unknown',
          resolvedPath
        );
      }
      
      // Validate component paths
      const baseDir = dirname(resolvedPath);
      this.validateComponentPaths(validated.use, baseDir, resolvedPath);
      
      // Convert to our internal type
      const workflow: WorkflowDefinition = {
        workflow: validated.workflow,
        use: validated.use,
        template: validated.template,
      };

      this.workflowCache.set(resolvedPath, workflow);
      return workflow;
    } catch (error) {
      // Re-throw ValidationErrors as-is, wrap other errors
      if (error instanceof ValidationError) {
        throw error;
      }
      throw ValidationError.schema(
        'unknown',
        `Failed to parse workflow file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'unknown',
        resolvedPath
      );
    }
  }

  /**
   * Determine file type and parse accordingly
   */
  async parseFile(filePath: string): Promise<ComponentDefinition | WorkflowDefinition> {
    if (filePath.endsWith('.component.toml')) {
      return this.parseComponent(filePath);
    } else if (filePath.endsWith('.workflow.toml')) {
      return this.parseWorkflow(filePath);
    } else {
      throw ValidationError.invalidPath(
        filePath,
        'Unknown file type. Expected .component.toml or .workflow.toml',
        filePath
      );
    }
  }

  /**
   * Clear the parser cache
   */
  clearCache(): void {
    this.componentCache.clear();
    this.workflowCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { components: number; workflows: number } {
    return {
      components: this.componentCache.size,
      workflows: this.workflowCache.size,
    };
  }
}