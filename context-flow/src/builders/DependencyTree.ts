import { TOMLParser } from "../parsers/toml-parser.js";
import type { ComponentDefinition, WorkflowDefinition } from "../types/schema-definitions.js";
import { resolve, dirname } from 'path';
import { DepGraph } from 'dependency-graph';
import { DependencyError } from "../errors/index.js";

export type DependencyNodeType = 'workflow' | 'component';

export type DependencyNodeData = {
  /** Absolute path to the file */
  path: string;
  /** Type of the node */
  type: DependencyNodeType;
  /** Parsed definition */
  definition: WorkflowDefinition | ComponentDefinition;
};

export type DependencyTreeResult = {
  /** The dependency graph instance */
  graph: DepGraph<DependencyNodeData>;
  /** Root node path */
  rootPath: string;
  /** All node paths in dependency order */
  dependencyOrder: string[];
  /** Total number of unique components/workflows */
  nodeCount: number;
};

export type DependencyTreeOptions = {
  /** Whether to enable caching across tree instances */
  enableGlobalCache?: boolean;
};

export class WorkflowDependencyTree {
  private tomlParser: TOMLParser;
  private entry: string;
  private options: DependencyTreeOptions;
  
  // Global cache shared across instances - caches parsed node data
  private static globalCache = new Map<string, DependencyNodeData>();
  
  // Instance-specific dependency graph
  private graph: DepGraph<DependencyNodeData>;

  constructor(tomlParser: TOMLParser, entry: string, options: DependencyTreeOptions = {}) {
    this.tomlParser = tomlParser;
    this.entry = resolve(entry);
    this.options = {
      enableGlobalCache: true,
      ...options
    };
    this.graph = new DepGraph({ circular: false });
  }

  /**
   * Build the complete dependency tree starting from the workflow entry
   */
  async resolve(): Promise<DependencyTreeResult> {
    try {
      // Parse the root workflow
      const workflowDefinition = await this.tomlParser.parseWorkflow(this.entry);
      
      // Add root workflow to graph
      const rootNodeData: DependencyNodeData = {
        path: this.entry,
        type: 'workflow',
        definition: workflowDefinition
      };
      
      this.graph.addNode(this.entry, rootNodeData);
      
      // Recursively resolve all component dependencies
      if (workflowDefinition.use) {
        await this.resolveComponentDependencies(workflowDefinition.use, this.entry);
      }
      
      // Get dependency order from the graph
      const dependencyOrder = this.graph.overallOrder();
      
      return {
        graph: this.graph,
        rootPath: this.entry,
        dependencyOrder,
        nodeCount: this.graph.size()
      };
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('Dependency Cycle Found')) {
        // Convert DepGraph cycle error to our DependencyError
        const match = error.message.match(/Dependency Cycle Found: (.+)/);
        const cyclePath = match ? match[1].split(' -> ') : ['unknown'];
        throw DependencyError.circular(cyclePath, this.entry);
      }
      throw error;
    }
  }
  
  /**
   * Recursively resolve component dependencies
   */
  private async resolveComponentDependencies(
    useSection: Record<string, string>,
    parentPath: string
  ): Promise<void> {
    const parentDir = dirname(parentPath);
    
    for (const [componentName, relativePath] of Object.entries(useSection)) {
      const componentPath = resolve(parentDir, relativePath);
      
      // Check cache first if enabled
      let nodeData: DependencyNodeData | undefined;
      if (this.options.enableGlobalCache) {
        nodeData = WorkflowDependencyTree.globalCache.get(componentPath);
      }
      
      if (!nodeData) {
        try {
          // Parse the component
          const componentDefinition = await this.tomlParser.parseComponent(componentPath);
          
          nodeData = {
            path: componentPath,
            type: 'component',
            definition: componentDefinition
          };
          
          // Cache if enabled
          if (this.options.enableGlobalCache) {
            WorkflowDependencyTree.globalCache.set(componentPath, nodeData);
          }
          
        } catch (error) {
          throw DependencyError.missing(
            parentPath,
            componentName,
            parentPath
          );
        }
      }
      
      // Add node to graph if not already present
      if (!this.graph.hasNode(componentPath)) {
        this.graph.addNode(componentPath, nodeData);
        
        // Recursively resolve component's dependencies
        const componentDef = nodeData.definition as ComponentDefinition;
        if (componentDef.use) {
          await this.resolveComponentDependencies(componentDef.use, componentPath);
        }
      }
      
      // Add dependency edge
      this.graph.addDependency(parentPath, componentPath);
    }
  }

  /**
   * Clear the global cache
   */
  static clearGlobalCache(): void {
    WorkflowDependencyTree.globalCache.clear();
  }

  /**
   * Get global cache statistics
   */
  static getGlobalCacheStats(): { size: number; paths: string[] } {
    return {
      size: WorkflowDependencyTree.globalCache.size,
      paths: Array.from(WorkflowDependencyTree.globalCache.keys())
    };
  }
}

export class ComponentDependencyTree {
  private tomlParser: TOMLParser;
  private entry: string;
  private options: DependencyTreeOptions;
  
  // Global cache shared across instances - caches parsed node data
  private static globalCache = new Map<string, DependencyNodeData>();
  
  // Instance-specific dependency graph
  private graph: DepGraph<DependencyNodeData>;

  constructor(tomlParser: TOMLParser, entry: string, options: DependencyTreeOptions = {}) {
    this.tomlParser = tomlParser;
    this.entry = resolve(entry);
    this.options = {
      enableGlobalCache: true,
      ...options
    };
    this.graph = new DepGraph({ circular: false });
  }

  /**
   * Build the complete dependency tree starting from the component entry
   */
  async resolve(): Promise<DependencyTreeResult> {
    try {
      // Parse the root component
      const componentDefinition = await this.tomlParser.parseComponent(this.entry);
      
      // Add root component to graph
      const rootNodeData: DependencyNodeData = {
        path: this.entry,
        type: 'component',
        definition: componentDefinition
      };
      
      this.graph.addNode(this.entry, rootNodeData);
      
      // Recursively resolve all component dependencies
      if (componentDefinition.use) {
        await this.resolveComponentDependencies(componentDefinition.use, this.entry);
      }
      
      // Get dependency order from the graph
      const dependencyOrder = this.graph.overallOrder();
      
      return {
        graph: this.graph,
        rootPath: this.entry,
        dependencyOrder,
        nodeCount: this.graph.size()
      };
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('Dependency Cycle Found')) {
        // Convert DepGraph cycle error to our DependencyError
        const match = error.message.match(/Dependency Cycle Found: (.+)/);
        const cyclePath = match ? match[1].split(' -> ') : ['unknown'];
        throw DependencyError.circular(cyclePath, this.entry);
      }
      throw error;
    }
  }
  
  /**
   * Recursively resolve component dependencies
   */
  private async resolveComponentDependencies(
    useSection: Record<string, string>,
    parentPath: string
  ): Promise<void> {
    const parentDir = dirname(parentPath);
    
    for (const [componentName, relativePath] of Object.entries(useSection)) {
      const componentPath = resolve(parentDir, relativePath);
      
      // Check cache first if enabled
      let nodeData: DependencyNodeData | undefined;
      if (this.options.enableGlobalCache) {
        nodeData = ComponentDependencyTree.globalCache.get(componentPath);
      }
      
      if (!nodeData) {
        try {
          // Parse the component
          const componentDefinition = await this.tomlParser.parseComponent(componentPath);
          
          nodeData = {
            path: componentPath,
            type: 'component',
            definition: componentDefinition
          };
          
          // Cache if enabled
          if (this.options.enableGlobalCache) {
            ComponentDependencyTree.globalCache.set(componentPath, nodeData);
          }
          
        } catch (error) {
          throw DependencyError.missing(
            parentPath,
            componentName,
            parentPath
          );
        }
      }
      
      // Add node to graph if not already present
      if (!this.graph.hasNode(componentPath)) {
        this.graph.addNode(componentPath, nodeData);
        
        // Recursively resolve component's dependencies
        const componentDef = nodeData.definition as ComponentDefinition;
        if (componentDef.use) {
          await this.resolveComponentDependencies(componentDef.use, componentPath);
        }
      }
      
      // Add dependency edge
      this.graph.addDependency(parentPath, componentPath);
    }
  }

  /**
   * Clear the global cache
   */
  static clearGlobalCache(): void {
    ComponentDependencyTree.globalCache.clear();
  }

  /**
   * Get global cache statistics
   */
  static getGlobalCacheStats(): { size: number; paths: string[] } {
    return {
      size: ComponentDependencyTree.globalCache.size,
      paths: Array.from(ComponentDependencyTree.globalCache.keys())
    };
  }
}