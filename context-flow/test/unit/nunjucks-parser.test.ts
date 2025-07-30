import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { WorkflowDependencyTree } from '../../src/builders/DependencyTree.js';
import { ValidationError } from '../../src/errors/validation.js';
import { NunjucksParser } from '../../src/parsers/nunjucks-parser.js';
import { TOMLParser } from '../../src/parsers/toml-parser.js';
import { WorkflowDefinition } from '../../src/types/schema-definitions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('NunjucksParser', () => {
  let nunjucksParser: NunjucksParser;
  let tomlParser: TOMLParser;
  const fixturesDir = resolve(__dirname, '../fixtures');
  const workflowPath = resolve(fixturesDir, 'simple.workflow.toml');

  beforeEach(() => {
    nunjucksParser = new NunjucksParser();
    tomlParser = new TOMLParser();
  });

  describe('renderWorkflow', () => {
    it('should render workflow with component prop passing', async () => {
      // Parse the workflow and build dependency tree
      const dependencyTree = new WorkflowDependencyTree(tomlParser, workflowPath);
      const treeResult = await dependencyTree.resolve();
      
      // Set up the parser with the dependency tree
      nunjucksParser.setDependencyTree(treeResult);

      // Get the workflow definition
      const workflowData = treeResult.graph.getNodeData(workflowPath);
      const workflow = workflowData.definition;

      // Render the workflow
      const result = await nunjucksParser.renderWorkflow(workflow as WorkflowDefinition);

      // Check that content was rendered
      expect(result.content).to.be.a('string');
      expect(result.content.length).to.be.greaterThan(0);
      
      // Should contain the expected text from the component
      expect(result.content).to.include('Hello World');
      expect(result.content).to.include('(IMPORTANT)'); // because priority is "high"
      
      // Should track used components
      expect(result.usedComponents).to.include('SimpleComponent');
    });

    it('should validate component props', async () => {
      // Create a test workflow that passes invalid props
      const invalidWorkflow = {
        template: {
          content: `{{ use.SimpleComponent({
            text: 123, 
            priority: "high"
          }) }}`
        },
        use: {
          SimpleComponent: './simple.component.toml'
        },
        workflow: {
          description: 'Test workflow with invalid props',
          name: 'TestWorkflow'
        }
      };

      // Build dependency tree for the simple component
      const dependencyTree = new WorkflowDependencyTree(tomlParser, workflowPath);
      const treeResult = await dependencyTree.resolve();
      nunjucksParser.setDependencyTree(treeResult);

      // Should throw validation error for wrong prop type
      try {
        await nunjucksParser.renderWorkflow(invalidWorkflow);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        expect((error as ValidationError).message).to.include('should be of type \'string\'');
      }
    });

    it('should handle missing required props', async () => {
      // Create a test workflow that omits required props
      const invalidWorkflow = {
        template: {
          content: `{{ use.SimpleComponent({
            priority: "high"
          }) }}`
        },
        use: {
          SimpleComponent: './simple.component.toml'
        },
        workflow: {
          description: 'Test workflow with missing props',
          name: 'TestWorkflow'
        }
      };

      // Build dependency tree
      const dependencyTree = new WorkflowDependencyTree(tomlParser, workflowPath);
      const treeResult = await dependencyTree.resolve();
      nunjucksParser.setDependencyTree(treeResult);

      // Should throw validation error for missing required prop
      try {
        await nunjucksParser.renderWorkflow(invalidWorkflow);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        expect((error as ValidationError).message).to.include('Required prop \'text\' is missing');
      }
    });

    it('should handle undefined components', async () => {
      // Create a test workflow that references non-existent component
      const invalidWorkflow = {
        template: {
          content: `{{ use.NonExistentComponent({
            text: "Hello"
          }) }}`
        },
        use: {
          SimpleComponent: './simple.component.toml'
        },
        workflow: {
          description: 'Test workflow with undefined component',
          name: 'TestWorkflow'
        }
      };

      // Build dependency tree
      const dependencyTree = new WorkflowDependencyTree(tomlParser, workflowPath);
      const treeResult = await dependencyTree.resolve();
      nunjucksParser.setDependencyTree(treeResult);

      // Should throw validation error for undefined component
      try {
        await nunjucksParser.renderWorkflow(invalidWorkflow);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        expect((error as ValidationError).message).to.include('Component \'NonExistentComponent\' is not defined');
      }
    });
  });

  describe('renderComponent', () => {
    it('should render component with props', async () => {
      // Parse a simple component
      const componentPath = resolve(fixturesDir, 'simple.component.toml');
      const component = await tomlParser.parseComponent(componentPath);

      // Create mock dependency tree
      const mockTree = {
        dependencyOrder: [componentPath],
        graph: { getNodeData: () => ({}) },
        nodeCount: 1,
        rootPath: componentPath
      };
      nunjucksParser.setDependencyTree(mockTree as any);

      // Render the component with props
      const result = await nunjucksParser.renderComponent(component, {
        props: {
          priority: 'high',
          text: 'Test Message'
        }
      });

      // Check rendered content
      expect(result.content).to.include('Test Message');
      expect(result.content).to.include('(IMPORTANT)'); // because priority is "high"
    });
  });
}); 