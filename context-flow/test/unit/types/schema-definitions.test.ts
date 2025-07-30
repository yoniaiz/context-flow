import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  type ComponentSchema,
  type WorkflowSchema,
  type ParsedTomlContent,
  type ParsedComponent,
  type ParsedWorkflow,
  isComponentSchema,
  isWorkflowSchema,
  isParsedComponent,
  isParsedWorkflow,
  componentSchema,
  workflowSchema
} from '../../../src/types/schema-definitions.js';

describe('Schema Definitions', () => {
  describe('Type Inference from Zod Schemas', () => {
    it('should correctly infer ComponentSchema from Zod schema', () => {
      const component: ComponentSchema = {
        component: {
          name: 'test-component',
          description: 'Test component',
          version: '1.0.0'
        },
        template: {
          content: 'Hello {{ name }}'
        }
      };

      expect(component.component.name).to.equal('test-component');
      expect(component.template.content).to.equal('Hello {{ name }}');
    });

    it('should correctly infer WorkflowSchema from Zod schema', () => {
      const workflow: WorkflowSchema = {
        workflow: {
          name: 'test-workflow',
          description: 'Test workflow'
        },
        template: {
          content: 'Workflow content'
        }
      };

      expect(workflow.workflow.name).to.equal('test-workflow');
      expect(workflow.template.content).to.equal('Workflow content');
    });

    it('should validate against actual Zod schemas', () => {
      const validComponent = {
        component: {
          name: 'test',
          description: 'test',
          version: '1.0.0'
        },
        template: {
          content: 'test content'
        }
      };

      const result = componentSchema.safeParse(validComponent);
      expect(result.success).to.be.true;
    });
  });

  describe('Type Guards', () => {
    const componentData: ComponentSchema = {
      component: {
        name: 'test-component',
        description: 'Test component',
        version: '1.0.0'
      },
      template: {
        content: 'Hello {{ name }}'
      }
    };

    const workflowData: WorkflowSchema = {
      workflow: {
        name: 'test-workflow',
        description: 'Test workflow'
      },
      template: {
        content: 'Workflow content'
      }
    };

    describe('isComponentSchema', () => {
      it('should return true for component schemas', () => {
        expect(isComponentSchema(componentData)).to.be.true;
      });

      it('should return false for workflow schemas', () => {
        expect(isComponentSchema(workflowData)).to.be.false;
      });
    });

    describe('isWorkflowSchema', () => {
      it('should return true for workflow schemas', () => {
        expect(isWorkflowSchema(workflowData)).to.be.true;
      });

      it('should return false for component schemas', () => {
        expect(isWorkflowSchema(componentData)).to.be.false;
      });
    });

    describe('isParsedComponent', () => {
      it('should return true for parsed component objects', () => {
        const parsed: ParsedComponent = {
          schema: componentData,
          filePath: 'test.component.toml',
          resolvedPath: '/full/path/test.component.toml',
          parsedAt: new Date()
        };

        expect(isParsedComponent(parsed)).to.be.true;
      });

      it('should return false for parsed workflow objects', () => {
        const parsed: ParsedWorkflow = {
          schema: workflowData,
          filePath: 'test.workflow.toml',
          resolvedPath: '/full/path/test.workflow.toml',
          parsedAt: new Date()
        };

        expect(isParsedComponent(parsed)).to.be.false;
      });
    });
  });

  describe('Enhanced Type Definitions', () => {
    it('should support optional props in ComponentSchema', () => {
      const componentWithProps: ComponentSchema = {
        component: {
          name: 'test-component',
          description: 'Test component with props',
          version: '1.0.0'
        },
        props: {
          title: {
            type: 'string',
            description: 'Title prop',
            required: true
          },
          count: {
            type: 'number',
            description: 'Count prop',
            required: false,
            default: 0
          }
        },
        template: {
          content: 'Title: {{ title }}, Count: {{ count }}'
        }
      };

      expect(componentWithProps.props?.title.type).to.equal('string');
      expect(componentWithProps.props?.count.default).to.equal(0);
    });

    it('should support use sections with component references', () => {
      const componentWithUse: ComponentSchema = {
        component: {
          name: 'parent-component',
          description: 'Component that uses others',
          version: '1.0.0'
        },
        use: {
          childComponent: 'components/child.component.toml',
          anotherChild: 'components/another.component.toml'
        },
        template: {
          content: 'Using: {{ use.childComponent() }}'
        }
      };

      expect(componentWithUse.use?.childComponent).to.equal('components/child.component.toml');
    });

    it('should support target configurations', () => {
      const componentWithTargets: ComponentSchema = {
        component: {
          name: 'targeted-component',
          description: 'Component with target configs',
          version: '1.0.0'
        },
        template: {
          content: 'Targeted content'
        },
        targets: {
          cursor: {
            always_apply: true,
            command: 'On Edit'
          },
          vscode: {
            scope: 'workspace',
            enabled: true
          }
        }
      };

      expect(componentWithTargets.targets?.cursor.always_apply).to.be.true;
      expect(componentWithTargets.targets?.vscode.scope).to.equal('workspace');
    });
  });

  describe('ParsedTomlFile Types', () => {
    it('should correctly type ParsedComponent objects', () => {
      const parsed: ParsedComponent = {
        schema: {
          component: {
            name: 'test',
            description: 'test',
            version: '1.0.0'
          },
          template: {
            content: 'test'
          }
        },
        filePath: 'test.component.toml',
        resolvedPath: '/absolute/path/test.component.toml',
        parsedAt: new Date(),
        contentHash: 'abc123'
      };

      expect(parsed.schema.component.name).to.equal('test');
      expect(parsed.filePath).to.equal('test.component.toml');
      expect(parsed.contentHash).to.equal('abc123');
    });

    it('should correctly type ParsedWorkflow objects', () => {
      const parsed: ParsedWorkflow = {
        schema: {
          workflow: {
            name: 'test-workflow',
            description: 'test workflow'
          },
          template: {
            content: 'workflow content'
          }
        },
        filePath: 'test.workflow.toml',
        resolvedPath: '/absolute/path/test.workflow.toml',
        parsedAt: new Date()
      };

      expect(parsed.schema.workflow.name).to.equal('test-workflow');
      expect(parsed.filePath).to.equal('test.workflow.toml');
    });
  });

  describe('Union Types', () => {
    it('should handle ParsedTomlContent union correctly', () => {
      const componentContent: ParsedTomlContent = {
        component: {
          name: 'test',
          description: 'test',
          version: '1.0.0'
        },
        template: {
          content: 'test'
        }
      };

      const workflowContent: ParsedTomlContent = {
        workflow: {
          name: 'test',
          description: 'test'
        },
        template: {
          content: 'test'
        }
      };

      expect(isComponentSchema(componentContent)).to.be.true;
      expect(isWorkflowSchema(workflowContent)).to.be.true;
    });
  });

  describe('Schema Re-exports', () => {
    it('should properly export componentSchema', () => {
      expect(componentSchema).to.be.an('object');
      expect(componentSchema.parse).to.be.a('function');
    });

    it('should properly export workflowSchema', () => {
      expect(workflowSchema).to.be.an('object');
      expect(workflowSchema.parse).to.be.a('function');
    });
  });
}); 