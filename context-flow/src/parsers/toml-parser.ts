import { parse } from 'smol-toml';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { componentSchema } from '../schemas/component.js';
import { workflowSchema } from '../schemas/workflow.js';
import type { ComponentDefinition, WorkflowDefinition } from '../types/basic.js';

/**
 * Simple TOML parser with basic Zod validation for Context Flow
 */
export class TOMLParser {
  private componentCache = new Map<string, ComponentDefinition>();
  private workflowCache = new Map<string, WorkflowDefinition>();

  /**
   * Validate that component paths in the 'use' section exist
   */
  private validateComponentPaths(useSection: Record<string, unknown> | undefined, baseDir: string): void {
    if (!useSection) return;

    for (const [componentName, relativePath] of Object.entries(useSection)) {
      if (typeof relativePath !== 'string') {
        throw new Error(`Component '${componentName}' path must be a string, got: ${typeof relativePath}`);
      }

      const fullPath = resolve(baseDir, relativePath);
      
      if (!existsSync(fullPath)) {
        throw new Error(`Component '${componentName}' references non-existent file: ${relativePath} (resolved to: ${fullPath})`);
      }

      if (!fullPath.endsWith('.component.toml')) {
        throw new Error(`Component '${componentName}' must reference a .component.toml file, got: ${relativePath}`);
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
        throw new Error(`Component file does not exist: ${filePath}`);
      }

      const content = readFileSync(resolvedPath, 'utf-8');
      const parsed = parse(content);
      
      // Validate with Zod schema
      const validated = componentSchema.parse(parsed);
      
      // Validate component paths
      const baseDir = dirname(resolvedPath);
      this.validateComponentPaths(validated.use, baseDir);
      
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
      throw new Error(`Failed to parse component file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        throw new Error(`Workflow file does not exist: ${filePath}`);
      }

      const content = readFileSync(resolvedPath, 'utf-8');
      const parsed = parse(content);
      
      // Validate with Zod schema
      const validated = workflowSchema.parse(parsed);
      
      // Validate component paths
      const baseDir = dirname(resolvedPath);
      this.validateComponentPaths(validated.use, baseDir);
      
      // Convert to our internal type
      const workflow: WorkflowDefinition = {
        workflow: validated.workflow,
        use: validated.use,
        template: validated.template,
      };

      this.workflowCache.set(resolvedPath, workflow);
      return workflow;
    } catch (error) {
      throw new Error(`Failed to parse workflow file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(`Unknown file type: ${filePath}. Expected .component.toml or .workflow.toml`);
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