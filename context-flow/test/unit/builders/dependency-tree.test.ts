import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TOMLParser } from '../../../src/parsers/toml-parser.js';
import { 
  WorkflowDependencyTree, 
  ComponentDependencyTree,
  type DependencyTreeResult,
  type DependencyTreeOptions
} from '../../../src/builders/DependencyTree.js';
import { DependencyError } from '../../../src/errors/index.js';

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
        
        expect(tree).to.be.instanceOf(WorkflowDependencyTree);
      });

      it('should accept custom options', () => {
        const entry = join(fixturesDir, 'simple-workflow.workflow.toml');
        const options: DependencyTreeOptions = {
          enableGlobalCache: false
        };
        const tree = new WorkflowDependencyTree(parser, entry, options);
        
        expect(tree).to.be.instanceOf(WorkflowDependencyTree);
      });

      it('should resolve relative paths to absolute paths', () => {
        const relativePath = 'test/fixtures/dependency-tree/simple-workflow.workflow.toml';
        const tree = new WorkflowDependencyTree(parser, relativePath);
        
        expect(tree).to.be.instanceOf(WorkflowDependencyTree);
      });
    });

    describe('resolve()', () => {
      it('should resolve simple workflow with two components', async () => {
        const entry = join(fixturesDir, 'simple-workflow.workflow.toml');
        const tree = new WorkflowDependencyTree(parser, entry);
        
        const result: DependencyTreeResult = await tree.resolve();
        
        expect(result.rootPath).to.equal(resolve(entry));
        expect(result.nodeCount).to.equal(3); // workflow + 2 components
        expect(result.graph.size()).to.equal(3);
        expect(result.dependencyOrder).to.have.length(3);
        
        // Root should be first in dependency order (no dependencies)
        expect(result.dependencyOrder[0]).to.include('instruction.component.toml');
        expect(result.dependencyOrder[2]).to.include('simple-workflow.workflow.toml');
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
        
        expect(instructionIndex).to.be.lessThan(checklistIndex);
        expect(checklistIndex).to.be.lessThan(workflowIndex);
      });

      it('should detect circular dependencies and throw error', async () => {
        const entry = join(fixturesDir, 'circular-workflow.workflow.toml');
        const tree = new WorkflowDependencyTree(parser, entry);
        
        try {
          await tree.resolve();
          expect.fail('Should have thrown a DependencyError');
        } catch (error) {
          expect(error).to.be.instanceOf(DependencyError);
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
        
        expect(cacheBefore.size).to.be.greaterThan(0);
        expect(cacheAfter.size).to.equal(cacheBefore.size);
      });

      it('should not use cache when disabled', async () => {
        const entry = join(fixturesDir, 'simple-workflow.workflow.toml');
        const tree = new WorkflowDependencyTree(parser, entry, { enableGlobalCache: false });
        
        await tree.resolve();
        const cacheStats = WorkflowDependencyTree.getGlobalCacheStats();
        
        expect(cacheStats.size).to.equal(0);
      });

      it('should throw error for non-existent workflow file', async () => {
        const entry = join(fixturesDir, 'non-existent.workflow.toml');
        const tree = new WorkflowDependencyTree(parser, entry);
        
        try {
          await tree.resolve();
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
        }
      });

      it('should throw error for invalid workflow file', async () => {
        // TODO: Create an invalid workflow fixture
        const entry = join(fixturesDir, 'invalid-workflow.workflow.toml');
        const tree = new WorkflowDependencyTree(parser, entry);
        
        try {
          await tree.resolve();
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
        }
      });
    });

    describe('static methods', () => {
      it('should clear global cache', () => {
        WorkflowDependencyTree.clearGlobalCache();
        const stats = WorkflowDependencyTree.getGlobalCacheStats();
        
        expect(stats.size).to.equal(0);
        expect(stats.paths).to.have.length(0);
      });

      it('should return cache statistics', async () => {
        const entry = join(fixturesDir, 'simple-workflow.workflow.toml');
        const tree = new WorkflowDependencyTree(parser, entry);
        
        await tree.resolve();
        const stats = WorkflowDependencyTree.getGlobalCacheStats();
        
        expect(stats.size).to.be.greaterThan(0);
        expect(stats.paths).to.be.an('array');
        expect(stats.paths.length).to.equal(stats.size);
      });
    });
  });

  describe('ComponentDependencyTree', () => {
    describe('constructor', () => {
      it('should create instance with default options', () => {
        const entry = join(fixturesDir, 'components/instruction.component.toml');
        const tree = new ComponentDependencyTree(parser, entry);
        
        expect(tree).to.be.instanceOf(ComponentDependencyTree);
      });

      it('should accept custom options', () => {
        const entry = join(fixturesDir, 'components/instruction.component.toml');
        const options: DependencyTreeOptions = {
          enableGlobalCache: false
        };
        const tree = new ComponentDependencyTree(parser, entry, options);
        
        expect(tree).to.be.instanceOf(ComponentDependencyTree);
      });
    });

    describe('resolve()', () => {
      it('should resolve component with no dependencies', async () => {
        const entry = join(fixturesDir, 'components/instruction.component.toml');
        const tree = new ComponentDependencyTree(parser, entry);
        
        const result: DependencyTreeResult = await tree.resolve();
        
        expect(result.rootPath).to.equal(resolve(entry));
        expect(result.nodeCount).to.equal(1);
        expect(result.dependencyOrder).to.have.length(1);
        expect(result.dependencyOrder[0]).to.include('instruction.component.toml');
      });

      it('should resolve component with dependencies', async () => {
        const entry = join(fixturesDir, 'components/checklist.component.toml');
        const tree = new ComponentDependencyTree(parser, entry);
        
        const result: DependencyTreeResult = await tree.resolve();
        
        expect(result.nodeCount).to.equal(2); // checklist + instruction
        expect(result.dependencyOrder).to.have.length(2);
        
        // Instruction should come before checklist
        const instructionIndex = result.dependencyOrder.findIndex(p => p.includes('instruction.component.toml'));
        const checklistIndex = result.dependencyOrder.findIndex(p => p.includes('checklist.component.toml'));
        expect(instructionIndex).to.be.lessThan(checklistIndex);
      });

      it('should detect circular dependencies in components', async () => {
        const entry = join(fixturesDir, 'circular-a.component.toml');
        const tree = new ComponentDependencyTree(parser, entry);
        
        try {
          await tree.resolve();
          expect.fail('Should have thrown a DependencyError');
        } catch (error) {
          expect(error).to.be.instanceOf(DependencyError);
        }
      });


    });

    describe('static methods', () => {
      it('should clear global cache independently from workflow cache', () => {
        ComponentDependencyTree.clearGlobalCache();
        const stats = ComponentDependencyTree.getGlobalCacheStats();
        
        expect(stats.size).to.equal(0);
        expect(stats.paths).to.have.length(0);
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
      expect(workflowResult.dependencyOrder.some(p => p.includes('instruction.component.toml'))).to.be.true;
      expect(componentResult.dependencyOrder.some(p => p.includes('instruction.component.toml'))).to.be.true;
      
      // Cache should contain shared components
      const cacheStats = WorkflowDependencyTree.getGlobalCacheStats();
      expect(cacheStats.size).to.be.greaterThan(0);
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
      expect(cacheAfterSecond.size).to.equal(cacheAfterFirst.size);
    });
  });
}); 