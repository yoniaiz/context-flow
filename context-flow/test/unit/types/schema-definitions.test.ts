import { describe, expect, it } from 'vitest';

import {
  type ComponentSchema,
  componentSchema,
  isComponentSchema,
  isWorkflowSchema,
  type ParsedTomlContent,
  type WorkflowSchema,
  workflowSchema
} from '../../../src/types/schema-definitions.js';

// Helper functions moved outside test blocks
function testUnion(content: ParsedTomlContent) {
  if (isComponentSchema(content)) {
    return 'component';
  }

 if (isWorkflowSchema(content)) {
    return 'workflow';
  }

  return 'unknown';
}

function handleContent(content: ParsedTomlContent) {
  if (isComponentSchema(content)) {
    // TypeScript should know this is a ComponentSchema
    return content.component.name;
  }

 if (isWorkflowSchema(content)) {
    // TypeScript should know this is a WorkflowSchema
    return content.workflow.name;
  }

  return 'unknown';
}

describe('Schema Definitions', () => {
  describe('Type Inference from Zod Schemas', () => {
    it('should correctly infer ComponentSchema from Zod schema', () => {
      const component: ComponentSchema = {
        component: {
          description: 'Test component',
          name: 'test-component',
          version: '1.0.0'
        },
        template: {
          content: 'Hello {{ name }}'
        }
      };

      expect(component.component.name).toBe('test-component');
      expect(component.template.content).toBe('Hello {{ name }}');
    });

    it('should correctly infer WorkflowSchema from Zod schema', () => {
      const workflow: WorkflowSchema = {
        template: {
          content: 'Workflow content'
        },
        workflow: {
          description: 'Test workflow',
          name: 'test-workflow'
        }
      };

      expect(workflow.workflow.name).toBe('test-workflow');
      expect(workflow.template.content).toBe('Workflow content');
    });

    it('should validate against actual Zod schemas', () => {
      const validComponent = {
        component: {
          description: 'test',
          name: 'test',
          version: '1.0.0'
        },
        template: {
          content: 'test content'
        }
      };

      const result = componentSchema.safeParse(validComponent);
      expect(result.success).toBe(true);
    });
  });

  describe('Type Guards', () => {
    const componentData: ComponentSchema = {
      component: {
        description: 'Test component',
        name: 'test-component',
        version: '1.0.0'
      },
      template: {
        content: 'Test content'
      }
    };

    const workflowData: WorkflowSchema = {
      template: {
        content: 'Test content'
      },
      workflow: {
        description: 'Test workflow',
        name: 'test-workflow'
      }
    };

    describe('isComponentSchema', () => {
      it('should correctly identify component schemas', () => {
        expect(isComponentSchema(componentData)).toBe(true);
        expect(isComponentSchema(workflowData)).toBe(false);
        expect(isComponentSchema({} as ComponentSchema)).toBe(false);
        expect(isComponentSchema(null)).toBe(false);
        expect(isComponentSchema()).toBe(false);
      });
    });

    describe('isWorkflowSchema', () => {
      it('should correctly identify workflow schemas', () => {
        expect(isWorkflowSchema(workflowData)).toBe(true);
        expect(isWorkflowSchema(componentData)).toBe(false);
        expect(isWorkflowSchema({} as WorkflowSchema)).toBe(false);
        expect(isWorkflowSchema(null)).toBe(false);
        expect(isWorkflowSchema()).toBe(false);
      });
    });
  });

  describe('ParsedTomlContent union type', () => {
    const componentData: ComponentSchema = {
      component: {
        description: 'Test component',
        name: 'test-component',
        version: '1.0.0'
      },
      template: {
        content: 'Test content'
      }
    };

    const workflowData: WorkflowSchema = {
      template: {
        content: 'Test content'
      },
      workflow: {
        description: 'Test workflow',
        name: 'test-workflow'
      }
    };

    it('should accept all valid schema types', () => {
      expect(testUnion(componentData)).toBe('component');
      expect(testUnion(workflowData)).toBe('workflow');
    });

    it('should provide type narrowing in conditional blocks', () => {
      expect(handleContent(componentData)).toBe('test-component');
      expect(handleContent(workflowData)).toBe('test-workflow');
    });
  });

  describe('Schema Validation Edge Cases', () => {
    it('should handle component schema with optional fields', () => {
      const minimalComponent = {
        component: {
          description: 'Minimal component',
          name: 'minimal',
          version: '1.0.0'
        },
        template: {
          content: 'Minimal content'
        }
      };

      const result = componentSchema.safeParse(minimalComponent);
      expect(result.success).toBe(true);
    });

    it('should handle workflow schema with optional fields', () => {
      const minimalWorkflow = {
        template: {
          content: 'Minimal content'
        },
        workflow: {
          description: 'Minimal workflow',
          name: 'minimal'
        }
      };

      const result = workflowSchema.safeParse(minimalWorkflow);
      expect(result.success).toBe(true);
    });

    it('should reject invalid component schemas', () => {
      const invalidComponent = {
        component: {
          // Missing required fields
          name: 'invalid'
        },
        template: {
          content: 'Content'
        }
      };

      const result = componentSchema.safeParse(invalidComponent);
      expect(result.success).toBe(false);
    });

    it('should reject invalid workflow schemas', () => {
      const invalidWorkflow = {
        template: {
          content: 'Content'
        },
        workflow: {
          // Missing required fields
          name: 'invalid'
        }
      };

      const result = workflowSchema.safeParse(invalidWorkflow);
      expect(result.success).toBe(false);
    });
  });
}); 