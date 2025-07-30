import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';

import { 
  ComponentDependencyTree, 
  type DependencyTreeOptions,
  type DependencyTreeResult,
  WorkflowDependencyTree
} from '../../../src/builders/DependencyTree.js';
import { DependencyError } from '../../../src/errors/index.js';
import { TOMLParser } from '../../../src/parsers/toml-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('DependencyTree', () => {
  let parser: TOMLParser;
  let fixturesDir: string;

  beforeEach(() => {
    parser = new TOMLParser();
    fixturesDir = resolve(__dirname, '../../fixtures/dependency-tree');
    
    // Clear caches before each test
    WorkflowDependencyTree.clearGlobalCache();
    ComponentDependencyTree.clearGlobalCache();
    parser.clearCache();
  });

  describe('WorkflowDependencyTree', () => {
    describe('constructor', () => {
      it('should create instance with default options', () => {
        const entry = join(fixturesDir, 'simple-workflow.workflow.toml');
        const tree = new WorkflowDependencyTree(parser, entry);
        
        expect(tree).toBeInstanceOf(WorkflowDependencyTree);
      });

      it('should accept custom options', () => {
        const entry = join(fixturesDir, 'simple-workflow.workflow.toml');
        const options: DependencyTreeOptions = {
          enableGlobalCache: false
        };
        const tree = new WorkflowDependencyTree(parser, entry, options);
        
        expect(tree).toBeInstanceOf(WorkflowDependencyTree);
      });

      it('should resolve relative paths to absolute paths', () => {
        const relativePath = 'test/fixtures/dependency-tree/simple-workflow.workflow.toml';
        const tree = new WorkflowDependencyTree(parser, relativePath);
        
        expect(tree).toBeInstanceOf(WorkflowDependencyTree);
      });
    });

    describe('resolve()', () => {
      it('should resolve simple workflow with two components', async () => {
        const entry = join(fixturesDir, 'simple-workflow.workflow.toml');
        const tree = new WorkflowDependencyTree(parser, entry);
        
        const result: DependencyTreeResult = await tree.resolve();
        
        expect(result.rootPath).toBe(resolve(entry));
        expect(result.nodeCount).toBe(3); // workflow + 2 components
        expect(result.graph.size()).toBe(3);
        expect(result.dependencyOrder).toHaveLength(3);
        
        // Root should be first in dependency order (no dependencies)
        expect(result.dependencyOrder[0]).toContain('instruction.component.toml');
        expect(result.dependencyOrder[2]).toContain('simple-workflow.workflow.toml');
      });

      it('should handle nested component dependencies', async () => {
        const entry = join(fixturesDir, 'simple-workflow.workflow.toml');
        const tree = new WorkflowDependencyTree(parser, entry);
        
        const result: DependencyTreeResult = await tree.resolve();
        
        // Should have workflow -> checklist -> instruction dependency chain
        
        // Instruction should come first (no dependencies)
        // Checklist should come second (depends on instruction)  
        // Workflow should come last (depends on both)
        const order = result.dependencyOrder;
        const instructionIndex = order.findIndex(p => p.includes('instruction.component.toml'));
        const checklistIndex = order.findIndex(p => p.includes('checklist.component.toml'));
        const workflowIndex = order.findIndex(p => p.includes('simple-workflow.workflow.toml'));
        
        expect(instructionIndex).toBeLessThan(checklistIndex);
        expect(checklistIndex).toBeLessThan(workflowIndex);
      });

      it('should detect circular dependencies and throw error', async () => {
        const entry = join(fixturesDir, 'circular-workflow.workflow.toml');
        const tree = new WorkflowDependencyTree(parser, entry);
        
        await expect(async () => {
          await tree.resolve();
        }).rejects.toThrow(DependencyError);
        
        try {
          await tree.resolve();
          expect.unreachable('Should have thrown a DependencyError');
        } catch (error) {
          expect(error).toBeInstanceOf(DependencyError);
        }
      });

      it('should cache parsed results when enabled', async () => {
        const entry = join(fixturesDir, 'simple-workflow.workflow.toml');
        const tree1 = new WorkflowDependencyTree(parser, entry, { enableGlobalCache: true });
        const tree2 = new WorkflowDependencyTree(parser, entry, { enableGlobalCache: true });
        
        await tree1.resolve();
        const cacheBefore = WorkflowDependencyTree.getGlobalCacheStats();
        
        await tree2.resolve();
        const cacheAfter = WorkflowDependencyTree.getGlobalCacheStats();
        
        expect(cacheBefore.size).toBeGreaterThan(0);
        expect(cacheAfter.size).toBe(cacheBefore.size);
      });

      it('should not use cache when disabled', async () => {
        const entry = join(fixturesDir, 'simple-workflow.workflow.toml');
        const tree = new WorkflowDependencyTree(parser, entry, { enableGlobalCache: false });
        
        await tree.resolve();
        const cacheStats = WorkflowDependencyTree.getGlobalCacheStats();
        
        expect(cacheStats.size).toBe(0);
      });

      it('should throw error for non-existent workflow file', async () => {
        const entry = join(fixturesDir, 'non-existent.workflow.toml');
        const tree = new WorkflowDependencyTree(parser, entry);
        
        await expect(async () => {
          await tree.resolve();
        }).rejects.toThrow();
        
        try {
          await tree.resolve();
          expect.unreachable('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      it('should throw error for invalid workflow file', async () => {
        // TODO: Create an invalid workflow fixture
        const entry = join(fixturesDir, 'invalid-workflow.workflow.toml');
        const tree = new WorkflowDependencyTree(parser, entry);
        
        await expect(async () => {
          await tree.resolve();
        }).rejects.toThrow();
        
        try {
          await tree.resolve();
          expect.unreachable('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });
    });

    describe('static methods', () => {
      it('should clear global cache', () => {
        WorkflowDependencyTree.clearGlobalCache();
        const stats = WorkflowDependencyTree.getGlobalCacheStats();
        
        expect(stats.size).toBe(0);
        expect(stats.paths).toHaveLength(0);
      });

      it('should return cache statistics', async () => {
        const entry = join(fixturesDir, 'simple-workflow.workflow.toml');
        const tree = new WorkflowDependencyTree(parser, entry);
        
        await tree.resolve();
        const stats = WorkflowDependencyTree.getGlobalCacheStats();
        
        expect(stats.size).toBeGreaterThan(0);
        expect(stats.paths).toEqual(expect.any(Array));
        expect(stats.paths.length).toBe(stats.size);
      });
    });
  });

  describe('ComponentDependencyTree', () => {
    describe('constructor', () => {
      it('should create instance with default options', () => {
        const entry = join(fixturesDir, 'components/instruction.component.toml');
        const tree = new ComponentDependencyTree(parser, entry);
        
        expect(tree).toBeInstanceOf(ComponentDependencyTree);
      });

      it('should accept custom options', () => {
        const entry = join(fixturesDir, 'components/instruction.component.toml');
        const options: DependencyTreeOptions = {
          enableGlobalCache: false
        };
        const tree = new ComponentDependencyTree(parser, entry, options);
        
        expect(tree).toBeInstanceOf(ComponentDependencyTree);
      });
    });

    describe('resolve()', () => {
      it('should resolve component with no dependencies', async () => {
        const entry = join(fixturesDir, 'components/instruction.component.toml');
        const tree = new ComponentDependencyTree(parser, entry);
        
        const result: DependencyTreeResult = await tree.resolve();
        
        expect(result.rootPath).toBe(resolve(entry));
        expect(result.nodeCount).toBe(1);
        expect(result.dependencyOrder).toHaveLength(1);
        expect(result.dependencyOrder[0]).toContain('instruction.component.toml');
      });

      it('should resolve component with dependencies', async () => {
        const entry = join(fixturesDir, 'components/checklist.component.toml');
        const tree = new ComponentDependencyTree(parser, entry);
        
        const result: DependencyTreeResult = await tree.resolve();
        
        expect(result.nodeCount).toBe(2); // checklist + instruction
        expect(result.dependencyOrder).toHaveLength(2);
        
        // Instruction should come before checklist
        const instructionIndex = result.dependencyOrder.findIndex(p => p.includes('instruction.component.toml'));
        const checklistIndex = result.dependencyOrder.findIndex(p => p.includes('checklist.component.toml'));
        expect(instructionIndex).toBeLessThan(checklistIndex);
      });

      it('should detect circular dependencies in components', async () => {
        const entry = join(fixturesDir, 'circular-a.component.toml');
        const tree = new ComponentDependencyTree(parser, entry);
        
        await expect(async () => {
          await tree.resolve();
        }).rejects.toThrow(DependencyError);
        
        try {
          await tree.resolve();
          expect.unreachable('Should have thrown a DependencyError');
        } catch (error) {
          expect(error).toBeInstanceOf(DependencyError);
        }
      });
    });

    describe('static methods', () => {
      it('should clear global cache independently from workflow cache', () => {
        ComponentDependencyTree.clearGlobalCache();
        const stats = ComponentDependencyTree.getGlobalCacheStats();
        
        expect(stats.size).toBe(0);
        expect(stats.paths).toHaveLength(0);
      });
    });
  });

  describe('Integration tests', () => {
    it('should handle the same component used in different trees', async () => {
      const workflowEntry = join(fixturesDir, 'simple-workflow.workflow.toml');
      const componentEntry = join(fixturesDir, 'components/checklist.component.toml');
      
      const workflowTree = new WorkflowDependencyTree(parser, workflowEntry);
      const componentTree = new ComponentDependencyTree(parser, componentEntry);
      
      const workflowResult = await workflowTree.resolve();
      const componentResult = await componentTree.resolve();
      
      // Both should have instruction component in their trees
      expect(workflowResult.dependencyOrder.some(p => p.includes('instruction.component.toml'))).toBe(true);
      expect(componentResult.dependencyOrder.some(p => p.includes('instruction.component.toml'))).toBe(true);
      
      // Cache should contain shared components
      const cacheStats = WorkflowDependencyTree.getGlobalCacheStats();
      expect(cacheStats.size).toBeGreaterThan(0);
    });

    it('should handle different caching strategies', async () => {
      const entry = join(fixturesDir, 'simple-workflow.workflow.toml');
      
      // First build with cache enabled
      const tree1 = new WorkflowDependencyTree(parser, entry, { enableGlobalCache: true });
      await tree1.resolve();
      
      const cacheAfterFirst = WorkflowDependencyTree.getGlobalCacheStats();
      
      // Second build with cache disabled
      const tree2 = new WorkflowDependencyTree(parser, entry, { enableGlobalCache: false });
      await tree2.resolve();
      
      const cacheAfterSecond = WorkflowDependencyTree.getGlobalCacheStats();
      
      // Cache should remain unchanged after second build
      expect(cacheAfterSecond.size).toBe(cacheAfterFirst.size);
    });
  });
}); 