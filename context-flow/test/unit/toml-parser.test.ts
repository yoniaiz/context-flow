import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';

import { ValidationError } from '../../src/errors/validation.js';
import { TOMLParser } from '../../src/parsers/toml-parser.js';

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

      expect(result).toHaveProperty('component');
      expect(result.component.name).toBe('SimpleComponent');
      expect(result.component.description).toBe('A simple test component');
      expect(result.component.version).toBe('1.0.0');

      expect(result).toHaveProperty('props');
      expect(result.props).toHaveProperty('text');
      expect(result.props!.text.type).toBe('string');
      expect(result.props!.text.required).toBe(true);

      expect(result).toHaveProperty('template');
      expect(result.template.content).toContain('{{ props.text }}');

      expect(result).toHaveProperty('targets');
      expect(result.targets).toHaveProperty('cursor');
    });

    it('should cache parsed components', async () => {
      const result1 = await parser.parseComponent(componentPath);
      const result2 = await parser.parseComponent(componentPath);

      expect(result1).toBe(result2); // Should be the same object reference
      expect(parser.getCacheStats().components).toBe(1);
    });

    it('should throw ValidationError for non-existent file', async () => {
      const nonExistentPath = resolve(fixturesDir, 'non-existent.component.toml');
      
      await expect(async () => {
        await parser.parseComponent(nonExistentPath);
      }).rejects.toThrow(ValidationError);
      
      try {
        await parser.parseComponent(nonExistentPath);
        expect.unreachable('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('Invalid file path');
        expect((error as ValidationError).field).toBe('path');
        expect((error as ValidationError).sourceLocation?.filePath).toContain('non-existent.component.toml');
      }
    });
  });

  describe('parseWorkflow', () => {
    it('should parse a valid workflow file', async () => {
      const result = await parser.parseWorkflow(workflowPath);

      expect(result).toHaveProperty('workflow');
      expect(result.workflow.name).toBe('SimpleWorkflow');
      expect(result.workflow.description).toBe('A simple test workflow');

      expect(result).toHaveProperty('use');
      expect(result.use).toHaveProperty('SimpleComponent');
      expect(result.use!.SimpleComponent).toBe('./simple.component.toml');

      expect(result).toHaveProperty('template');
      expect(result.template.content).toContain('use.SimpleComponent');
    });

    it('should cache parsed workflows', async () => {
      const result1 = await parser.parseWorkflow(workflowPath);
      const result2 = await parser.parseWorkflow(workflowPath);

      expect(result1).toBe(result2); // Should be the same object reference
      expect(parser.getCacheStats().workflows).toBe(1);
    });

    it('should throw ValidationError for non-existent file', async () => {
      const nonExistentPath = resolve(fixturesDir, 'non-existent.workflow.toml');
      
      await expect(async () => {
        await parser.parseWorkflow(nonExistentPath);
      }).rejects.toThrow(ValidationError);
      
      try {
        await parser.parseWorkflow(nonExistentPath);
        expect.unreachable('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('Invalid file path');
        expect((error as ValidationError).field).toBe('path');
        expect((error as ValidationError).sourceLocation?.filePath).toContain('non-existent.workflow.toml');
      }
    });
  });

  describe('parseFile', () => {
    it('should auto-detect component files', async () => {
      const result = await parser.parseFile(componentPath);
      expect(result).toHaveProperty('component');
    });

    it('should auto-detect workflow files', async () => {
      const result = await parser.parseFile(workflowPath);
      expect(result).toHaveProperty('workflow');
    });

    it('should throw ValidationError for unknown file types', async () => {
      const unknownPath = resolve(fixturesDir, 'unknown.toml');
      
      await expect(async () => {
        await parser.parseFile(unknownPath);
      }).rejects.toThrow(ValidationError);
      
      try {
        await parser.parseFile(unknownPath);
        expect.unreachable('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('Invalid file path');
        expect((error as ValidationError).errorInfo.mitigation).toContain('Unknown file type');
        expect((error as ValidationError).sourceLocation?.filePath).toContain('unknown.toml');
      }
    });
  });

  describe('cache management', () => {
    it('should clear cache properly', async () => {
      await parser.parseComponent(componentPath);
      await parser.parseWorkflow(workflowPath);

      expect(parser.getCacheStats().components).toBe(1);
      expect(parser.getCacheStats().workflows).toBe(1);

      parser.clearCache();

      expect(parser.getCacheStats().components).toBe(0);
      expect(parser.getCacheStats().workflows).toBe(0);
    });

    it('should provide accurate cache statistics', async () => {
      expect(parser.getCacheStats()).toEqual({ components: 0, workflows: 0 });

      await parser.parseComponent(componentPath);
      expect(parser.getCacheStats()).toEqual({ components: 1, workflows: 0 });

      await parser.parseWorkflow(workflowPath);
      expect(parser.getCacheStats()).toEqual({ components: 1, workflows: 1 });
    });
  });

  describe('path validation', () => {
    it('should validate component paths in use section', async () => {
      // This test depends on the workflow file referencing a component that exists
      const result = await parser.parseWorkflow(workflowPath);
      expect(result.use).toHaveProperty('SimpleComponent');
    });
  });

  describe('error handling', () => {
    it('should throw ValidationError for invalid component path reference', async () => {
      // Create a temporary workflow with invalid component reference
      const invalidWorkflowPath = resolve(fixturesDir, '../temp-invalid.workflow.toml');
      const fs = await import('node:fs');
      
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
        expect.unreachable('Should have thrown a ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        // The error could be either path validation or schema validation depending on which fails first
        expect((error as ValidationError).message).toMatch(/Invalid file path|Schema validation failed/);
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
      const fs = await import('node:fs');
      
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
        expect.unreachable('Should have thrown a ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        // The error message could be different depending on what validation fails first
        expect((error as ValidationError).message).toMatch(/Invalid file path|Schema validation failed/);
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