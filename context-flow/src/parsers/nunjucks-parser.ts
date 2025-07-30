import nunjucks from 'nunjucks';

import type { DependencyTreeResult } from "../builders/DependencyTree.js";

import { ValidationError } from "../errors/index.js";
import { ComponentDefinition, WorkflowDefinition } from "../types/schema-definitions.js";

export type NunjucksContext = {
  /** Current component/workflow metadata */
  metadata?: ComponentDefinition['component'] | WorkflowDefinition['workflow'];
  /** Parent context for inheritance */
  parent?: NunjucksContext;
  /** Props passed to the current component/workflow */
  props?: Record<string, unknown>;
};

export type ComponentRenderResult = {
  /** Rendered content */
  content: string;
  /** Components that were used during rendering */
  usedComponents: string[];
};

export type UseProxy = {
  [key: string]: (props: Record<string, unknown>) => string;
} & {
  getUsedComponents(): Set<string>;
};

export class NunjucksParser {
  private dependencyTree?: DependencyTreeResult;
  private env: nunjucks.Environment;

  constructor() {
    // Configure nunjucks environment with autoescape disabled
    this.env = new nunjucks.Environment(undefined, { autoescape: false });
  }

  /**
   * Render a component with its props
   */
  async renderComponent(
    component: ComponentDefinition,
    context: NunjucksContext = {}
  ): Promise<ComponentRenderResult> {
    if (!this.dependencyTree) {
      throw new Error('Dependency tree must be set before rendering');
    }

    // Validate props against component schema
    this.validateComponentProps(component, context.props || {});

    // Create the use proxy for nested component access
    const useProxy = this.createUseProxy(component, context);
    
    // Set up the template context
    const templateContext = {
      component: component.component,
      parent: context.parent,
      props: context.props || {},
      use: useProxy
    };

    try {
      const content = this.env.renderString(component.template.content, templateContext);
      
      return {
        content: content.trim(),
        usedComponents: [...useProxy.getUsedComponents()]
      };
    } catch (error) {
      // Re-throw ValidationErrors as-is to preserve specific error messages
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new ValidationError(
        `Failed to render component template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Template rendering component',
        'Check the component template syntax and prop usage',
        { filePath: 'component' }
      );
    }
  }

  /**
   * Render a workflow with its components
   */
  async renderWorkflow(
    workflow: WorkflowDefinition, 
    context: NunjucksContext = {}
  ): Promise<ComponentRenderResult> {
    if (!this.dependencyTree) {
      throw new Error('Dependency tree must be set before rendering');
    }

    // Create the use proxy for component access
    const useProxy = this.createUseProxy(workflow, context);
    
    // Set up the template context
    const templateContext = {
      parent: context.parent,
      props: context.props || {},
      use: useProxy,
      workflow: workflow.workflow
    };

    try {
      const content = this.env.renderString(workflow.template.content, templateContext);
      
      return {
        content: content.trim(),
        usedComponents: [...useProxy.getUsedComponents()]
      };
    } catch (error) {
      // Re-throw ValidationErrors as-is to preserve specific error messages
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new ValidationError(
        `Failed to render workflow template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Template rendering workflow',
        'Check the workflow template syntax and component usage',
        { filePath: 'workflow' }
      );
    }
  }

  /**
   * Set the dependency tree for component resolution
   */
  setDependencyTree(dependencyTree: DependencyTreeResult): void {
    this.dependencyTree = dependencyTree;
  }

  /**
   * Create a proxy object for component access in templates
   */
  private createUseProxy(
    parent: ComponentDefinition | WorkflowDefinition, 
    context: NunjucksContext
  ): UseProxy {
    const usedComponents = new Set<string>();
    
    const proxy: UseProxy = new Proxy({} as UseProxy, {
      get: (target, componentName: string | symbol) => {
        if (componentName === 'getUsedComponents') {
          return () => usedComponents;
        }
        
        if (typeof componentName !== 'string') {
          return;
        }
        
        // Return a function that handles component rendering
        return (props: Record<string, unknown> = {}) => {
          usedComponents.add(componentName);
          
          // Find component definition from parent's use section
          const useSection = parent.use;
          if (!useSection || !useSection[componentName]) {
            throw new ValidationError(
              `Component '${componentName}' is not defined in the use section`,
              'Template component lookup',
              `Add '${componentName}' to the use section of the parent template`,
              { filePath: 'template' }
            );
          }

          // Find component in dependency tree
          const componentPath = this.findComponentInTree(componentName, parent);
          if (!componentPath) {
            throw new ValidationError(
              `Component '${componentName}' not found in dependency tree`,
              'Template component resolution',
              `Ensure the component '${componentName}' exists and is properly loaded`,
              { filePath: 'template' }
            );
          }

          const componentData = this.dependencyTree!.graph.getNodeData(componentPath);
          if (componentData.type !== 'component') {
            throw new ValidationError(
              `'${componentName}' is not a component`,
              'Template component type check',
              `Ensure '${componentName}' references a component, not a workflow`,
              { filePath: 'template' }
            );
          }

          const componentDef = componentData.definition as ComponentDefinition;

          // Validate props against component schema
          this.validateComponentProps(componentDef, props);

          // Create child context
          const childContext: NunjucksContext = {
            metadata: componentDef.component,
            parent: context,
            props
          };

          // Render the component synchronously (we'll handle async later)
          try {
            const result = this.renderComponentSync(componentDef, childContext);
            return result.content;
          } catch (error) {
            // Re-throw ValidationErrors as-is to preserve the specific error messages
            if (error instanceof ValidationError) {
              throw error;
            }

            throw new ValidationError(
              `Failed to render component '${componentName}': ${error instanceof Error ? error.message : 'Unknown error'}`,
              'Template component rendering',
              `Check the component '${componentName}' template and props`,
              { filePath: 'template' }
            );
          }
        };
      }
    });

    return proxy;
  }

  /**
   * Find component path in dependency tree based on component name and parent
   */
  private findComponentInTree(componentName: string, parent: ComponentDefinition | WorkflowDefinition): null | string {
    if (!this.dependencyTree || !parent.use) {
      return null;
    }

    // In a real implementation, we'd resolve the relative path properly
    // For now, we'll search through all nodes to find matching component
    for (const nodePath of this.dependencyTree.dependencyOrder) {
      const nodeData = this.dependencyTree.graph.getNodeData(nodePath);
      if (nodeData.type === 'component') {
        const componentDef = nodeData.definition as ComponentDefinition;
        if (componentDef.component.name === componentName) {
          return nodePath;
        }
      }
    }

    return null;
  }

  /**
   * Synchronous version of component rendering for use in templates
   */
  private renderComponentSync(
    component: ComponentDefinition,
    context: NunjucksContext
  ): ComponentRenderResult {
    // Validate props
    this.validateComponentProps(component, context.props || {});

    // For now, we'll do simple rendering without nested components
    // to avoid recursion issues in the proxy
    const templateContext = {
      component: component.component,
      parent: context.parent,
      props: context.props || {}
    };

    try {
      const content = this.env.renderString(component.template.content, templateContext);
      
      return {
        content: content.trim(),
        usedComponents: []
      };
    } catch (error) {
      throw new ValidationError(
        `Failed to render component template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Synchronous component rendering',
        'Check the component template syntax',
        { filePath: 'component' }
      );
    }
  }

  /**
   * Validate props against component schema
   */
  private validateComponentProps(component: ComponentDefinition, props: Record<string, unknown>): void {
    if (!component.props) {
      return; // No props defined, nothing to validate
    }

    // Check required props
    for (const [propName, propDef] of Object.entries(component.props)) {
      if (propDef.required && !(propName in props)) {
        throw new ValidationError(
          `Required prop '${propName}' is missing`,
          'Component prop validation',
          `Provide the required prop '${propName}' when using component '${component.component.name}'`,
          { filePath: component.component.name },
          {
            actual: 'undefined',
            expected: propDef.type,
            field: propName
          }
        );
      }

      // Basic type validation
      if (propName in props) {
        const value = props[propName];
        const expectedType = propDef.type;
        
        if (!this.validatePropType(value, expectedType)) {
          throw new ValidationError(
            `Prop '${propName}' should be of type '${expectedType}' but got '${typeof value}'`,
            'Component prop type validation',
            `Ensure prop '${propName}' is of type '${expectedType}'`,
            { filePath: component.component.name },
            {
              actual: typeof value,
              expected: expectedType,
              field: propName
            }
          );
        }
      }
    }
  }

  /**
   * Basic type validation for props
   */
  private validatePropType(value: unknown, expectedType: string): boolean {
    switch (expectedType) {
      case 'array': {
        return Array.isArray(value);
      }

      case 'boolean': {
        return typeof value === 'boolean';
      }

      case 'number': {
        return typeof value === 'number';
      }

      case 'string': {
        return typeof value === 'string';
      }

      default: {
        return true;
      } // Unknown type, allow it
    }
  }
}