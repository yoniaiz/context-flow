import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TOMLParser } from '../../src/parsers/toml-parser.js';
import { ValidationError } from '../../src/errors/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('TOMLParser', () => {
  let parser: TOMLParser;
  const fixturesDir = resolve(__dirname, '../fixtures');
  const componentPath = resolve(fixturesDir, 'simple.component.toml');
  const workflowPath = resolve(fixturesDir, 'simple.workflow.toml');

  beforeEach(() => {
    parser = new TOMLParser();
  });

  describe('parseComponent', () => {
    it('should parse a valid component file', async () => {
      const result = await parser.parseComponent(componentPath);

      expect(result).to.have.property('component');
      expect(result.component.name).to.equal('SimpleComponent');
      expect(result.component.description).to.equal('A simple test component');
      expect(result.component.version).to.equal('1.0.0');

      expect(result).to.have.property('props');
      expect(result.props).to.have.property('text');
      expect(result.props!.text.type).to.equal('string');
      expect(result.props!.text.required).to.be.true;

      expect(result).to.have.property('template');
      expect(result.template.content).to.include('{{ props.text }}');

      expect(result).to.have.property('targets');
      expect(result.targets).to.have.property('cursor');
    });

    it('should cache parsed components', async () => {
      const result1 = await parser.parseComponent(componentPath);
      const result2 = await parser.parseComponent(componentPath);

      expect(result1).to.equal(result2); // Should be the same object reference
      expect(parser.getCacheStats().components).to.equal(1);
    });

    it('should throw ValidationError for non-existent file', async () => {
      const nonExistentPath = resolve(fixturesDir, 'non-existent.component.toml');
      
      try {
        await parser.parseComponent(nonExistentPath);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        expect((error as ValidationError).message).to.include('Invalid file path');
        expect((error as ValidationError).field).to.equal('path');
        expect((error as ValidationError).sourceLocation?.filePath).to.include('non-existent.component.toml');
      }
    });
  });

  describe('parseWorkflow', () => {
    it('should parse a valid workflow file', async () => {
      const result = await parser.parseWorkflow(workflowPath);

      expect(result).to.have.property('workflow');
      expect(result.workflow.name).to.equal('SimpleWorkflow');
      expect(result.workflow.description).to.equal('A simple test workflow');

      expect(result).to.have.property('use');
      expect(result.use).to.have.property('SimpleComponent');
      expect(result.use!.SimpleComponent).to.equal('./simple.component.toml');

      expect(result).to.have.property('template');
      expect(result.template.content).to.include('use.SimpleComponent');
    });

    it('should cache parsed workflows', async () => {
      const result1 = await parser.parseWorkflow(workflowPath);
      const result2 = await parser.parseWorkflow(workflowPath);

      expect(result1).to.equal(result2); // Should be the same object reference
      expect(parser.getCacheStats().workflows).to.equal(1);
    });

    it('should throw ValidationError for non-existent file', async () => {
      const nonExistentPath = resolve(fixturesDir, 'non-existent.workflow.toml');
      
      try {
        await parser.parseWorkflow(nonExistentPath);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        expect((error as ValidationError).message).to.include('Invalid file path');
        expect((error as ValidationError).field).to.equal('path');
        expect((error as ValidationError).sourceLocation?.filePath).to.include('non-existent.workflow.toml');
      }
    });
  });

  describe('parseFile', () => {
    it('should auto-detect component files', async () => {
      const result = await parser.parseFile(componentPath);
      expect(result).to.have.property('component');
    });

    it('should auto-detect workflow files', async () => {
      const result = await parser.parseFile(workflowPath);
      expect(result).to.have.property('workflow');
    });

    it('should throw ValidationError for unknown file types', async () => {
      const unknownPath = resolve(fixturesDir, 'unknown.toml');
      
      try {
        await parser.parseFile(unknownPath);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        expect((error as ValidationError).message).to.include('Invalid file path');
        expect((error as ValidationError).errorInfo.mitigation).to.include('Unknown file type');
        expect((error as ValidationError).sourceLocation?.filePath).to.include('unknown.toml');
      }
    });
  });

  describe('cache management', () => {
    it('should clear cache properly', async () => {
      await parser.parseComponent(componentPath);
      await parser.parseWorkflow(workflowPath);

      expect(parser.getCacheStats().components).to.equal(1);
      expect(parser.getCacheStats().workflows).to.equal(1);

      parser.clearCache();

      expect(parser.getCacheStats().components).to.equal(0);
      expect(parser.getCacheStats().workflows).to.equal(0);
    });

    it('should provide accurate cache statistics', async () => {
      expect(parser.getCacheStats()).to.deep.equal({ components: 0, workflows: 0 });

      await parser.parseComponent(componentPath);
      expect(parser.getCacheStats()).to.deep.equal({ components: 1, workflows: 0 });

      await parser.parseWorkflow(workflowPath);
      expect(parser.getCacheStats()).to.deep.equal({ components: 1, workflows: 1 });
    });
  });

  describe('path validation', () => {
    it('should validate component paths in use section', async () => {
      // This test depends on the workflow file referencing a component that exists
      const result = await parser.parseWorkflow(workflowPath);
      expect(result.use).to.have.property('SimpleComponent');
    });
  });

  describe('error handling', () => {
    it('should throw ValidationError for invalid component path reference', async () => {
      // Create a temporary workflow with invalid component reference
      const invalidWorkflowPath = resolve(fixturesDir, '../temp-invalid.workflow.toml');
      const fs = await import('fs');
      
      const invalidContent = `
[workflow]
name = "InvalidWorkflow"
description = "Workflow with invalid component reference"

[use]
InvalidComponent = "./non-existent-component.component.toml"

[template]
content = "Test content"
`;
      
      fs.writeFileSync(invalidWorkflowPath, invalidContent);
      
      try {
        await parser.parseWorkflow(invalidWorkflowPath);
        expect.fail('Should have thrown a ValidationError');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        // The error could be either path validation or schema validation depending on which fails first
        expect((error as ValidationError).message).to.match(/Invalid file path|Schema validation failed/);
      } finally {
        // Clean up
        if (fs.existsSync(invalidWorkflowPath)) {
          fs.unlinkSync(invalidWorkflowPath);
        }
      }
    });

    it('should throw ValidationError for non-component file reference', async () => {
      // Create a temporary workflow with reference to non-.component.toml file
      const invalidWorkflowPath = resolve(fixturesDir, '../temp-wrong-type.workflow.toml');
      const wrongTypePath = resolve(fixturesDir, '../temp-wrong.toml');
      const fs = await import('fs');
      
      // Create a dummy file that's not a .component.toml
      fs.writeFileSync(wrongTypePath, '[test]\nname = "test"');
      
      const invalidContent = `
[workflow]
name = "WrongTypeWorkflow"
description = "Workflow with wrong file type reference"

[use]
WrongType = "./temp-wrong.toml"

[template]
content = "Test content"
`;
      
      fs.writeFileSync(invalidWorkflowPath, invalidContent);
      
      try {
        await parser.parseWorkflow(invalidWorkflowPath);
        expect.fail('Should have thrown a ValidationError');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        // The error message could be different depending on what validation fails first
        expect((error as ValidationError).message).to.match(/Invalid file path|Schema validation failed/);
      } finally {
        // Clean up
        if (fs.existsSync(invalidWorkflowPath)) {
          fs.unlinkSync(invalidWorkflowPath);
        }
        if (fs.existsSync(wrongTypePath)) {
          fs.unlinkSync(wrongTypePath);
        }
      }
    });
  });
});