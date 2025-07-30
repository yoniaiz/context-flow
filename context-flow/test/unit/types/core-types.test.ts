import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  isComponentDefinition,
  isWorkflowDefinition,
  isBuildSuccess,
  isBuildFailure,
  isProviderSuccess,
  isProviderFailure,
  isTargetSuccess,
  isTargetFailure,
  type ComponentDefinition,
  type WorkflowDefinition,
  type BuildResult,
  type ProviderExecutionResult,
  type TargetProcessingResult,
  type BuildOptions,
  type TemplateContext,
  type DependencyResolutionOptions,
  type TargetConfig,
  type ProviderMetadata
} from '../../../src/types/index.js';

describe('Core Type Definitions', () => {
  describe('Type Guards', () => {
    describe('isComponentDefinition', () => {
      it('should return true for component definitions', () => {
        const componentDef: ComponentDefinition = {
          component: {
            name: 'test-component',
            description: 'Test component',
            version: '1.0.0'
          },
          template: {
            content: 'Hello {{ name }}'
          }
        };

        expect(isComponentDefinition(componentDef)).to.be.true;
      });

      it('should return false for workflow definitions', () => {
        const workflowDef: WorkflowDefinition = {
          workflow: {
            name: 'test-workflow',
            description: 'Test workflow'
          },
          template: {
            content: 'Workflow content'
          }
        };

        expect(isComponentDefinition(workflowDef)).to.be.false;
      });
    });

    describe('isWorkflowDefinition', () => {
      it('should return true for workflow definitions', () => {
        const workflowDef: WorkflowDefinition = {
          workflow: {
            name: 'test-workflow',
            description: 'Test workflow'
          },
          template: {
            content: 'Workflow content'
          }
        };

        expect(isWorkflowDefinition(workflowDef)).to.be.true;
      });

      it('should return false for component definitions', () => {
        const componentDef: ComponentDefinition = {
          component: {
            name: 'test-component',
            description: 'Test component',
            version: '1.0.0'
          },
          template: {
            content: 'Hello {{ name }}'
          }
        };

        expect(isWorkflowDefinition(componentDef)).to.be.false;
      });
    });

    describe('isBuildSuccess', () => {
      it('should return true for successful build results', () => {
        const result: BuildResult = {
          success: true,
          content: 'Built content',
          metadata: {
            startTime: new Date(),
            endTime: new Date(),
            duration: 100,
            componentCount: 1,
            templateCount: 1,
            providerCount: 0,
            fromWatch: false
          },
          warnings: [],
          dependencies: []
        };

        expect(isBuildSuccess(result)).to.be.true;
      });

      it('should return false for failed build results', () => {
        const result: BuildResult = {
          success: false,
          content: '',
          metadata: {
            startTime: new Date(),
            componentCount: 0,
            templateCount: 0,
            providerCount: 0,
            fromWatch: false
          },
          warnings: [],
          errors: [],
          dependencies: []
        };

        expect(isBuildSuccess(result)).to.be.false;
      });
    });

    describe('isBuildFailure', () => {
      it('should return true for failed build results with errors', () => {
        const result: BuildResult = {
          success: false,
          content: '',
          metadata: {
            startTime: new Date(),
            componentCount: 0,
            templateCount: 0,
            providerCount: 0,
            fromWatch: false
          },
          warnings: [],
          errors: [],
          dependencies: []
        };

        expect(isBuildFailure(result)).to.be.true;
      });

      it('should return false for successful build results', () => {
        const result: BuildResult = {
          success: true,
          content: 'Built content',
          metadata: {
            startTime: new Date(),
            endTime: new Date(),
            duration: 100,
            componentCount: 1,
            templateCount: 1,
            providerCount: 0,
            fromWatch: false
          },
          warnings: [],
          dependencies: []
        };

        expect(isBuildFailure(result)).to.be.false;
      });
    });

    describe('isProviderSuccess', () => {
      it('should return true for successful provider results', () => {
        const result: ProviderExecutionResult = {
          success: true,
          output: 'Provider output',
          duration: 50,
          fromCache: false,
          warnings: [],
          errors: [],
          metadata: {
            providerName: 'test-provider',
            arguments: [],
            outputSize: 15
          }
        };

        expect(isProviderSuccess(result)).to.be.true;
      });

      it('should return false for failed provider results', () => {
        const result: ProviderExecutionResult = {
          success: false,
          output: '',
          duration: 10,
          fromCache: false,
          warnings: [],
          errors: [{
            message: 'Provider failed',
            provider: 'test-provider',
            type: 'execution'
          }],
          metadata: {
            providerName: 'test-provider',
            arguments: [],
            outputSize: 0
          }
        };

        expect(isProviderSuccess(result)).to.be.false;
      });
    });

    describe('isTargetSuccess', () => {
      it('should return true for successful target processing results', () => {
        const result: TargetProcessingResult = {
          success: true,
          output: { formatted: 'content' },
          format: 'json',
          duration: 25,
          warnings: [],
          errors: [],
          metadata: {
            targetName: 'json',
            configUsed: {},
            outputSize: 100,
            processingSteps: ['format', 'validate']
          }
        };

        expect(isTargetSuccess(result)).to.be.true;
      });

      it('should return false for failed target processing results', () => {
        const result: TargetProcessingResult = {
          success: false,
          output: null,
          format: 'json',
          duration: 5,
          warnings: [],
          errors: [],
          metadata: {
            targetName: 'json',
            configUsed: {},
            outputSize: 0,
            processingSteps: []
          }
        };

        expect(isTargetSuccess(result)).to.be.false;
      });
    });
  });

  describe('Type Structure Validation', () => {
    describe('BuildOptions', () => {
      it('should allow all optional properties', () => {
        const options: BuildOptions = {};
        expect(options).to.be.an('object');

        const fullOptions: BuildOptions = {
          workflowFile: 'workflow.toml',
          target: 'cursor',
          output: 'output.json',
          watch: true,
          verbose: true,
          cwd: '/project',
          cache: {
            enabled: true,
            maxSize: 100,
            ttl: 3600000
          }
        };
        expect(fullOptions).to.be.an('object');
      });
    });

    describe('TemplateContext', () => {
      it('should have required structure', () => {
        const context: TemplateContext = {
          component: {
            component: {
              name: 'test',
              description: 'test',
              version: '1.0.0'
            },
            template: {
              content: 'test'
            }
          },
          dependencies: {},
          props: {},
          global: {},
          providers: {},
          use: {}
        };

        expect(context).to.have.property('component');
        expect(context).to.have.property('dependencies');
        expect(context).to.have.property('props');
        expect(context).to.have.property('global');
        expect(context).to.have.property('providers');
        expect(context).to.have.property('use');
      });
    });

    describe('DependencyResolutionOptions', () => {
      it('should allow configuration of dependency resolution', () => {
        const options: DependencyResolutionOptions = {
          maxDepth: 10,
          baseDir: '/project',
          recursive: true,
          cache: true,
          strict: false
        };

        expect(options.maxDepth).to.equal(10);
        expect(options.baseDir).to.equal('/project');
        expect(options.recursive).to.be.true;
        expect(options.cache).to.be.true;
        expect(options.strict).to.be.false;
      });
    });

    describe('TargetConfig', () => {
      it('should allow target-specific configuration', () => {
        const config: TargetConfig = {
          always_apply: true,
          command: 'On Edit',
          format: 'json',
          output_path: './output.json',
          enabled: true,
          customProperty: 'custom value'
        };

        expect(config.always_apply).to.be.true;
        expect(config.command).to.equal('On Edit');
        expect(config.customProperty).to.equal('custom value');
      });
    });

    describe('ProviderMetadata', () => {
      it('should define provider information structure', () => {
        const metadata: ProviderMetadata = {
          name: 'file-provider',
          version: '1.0.0',
          description: 'Reads file content',
          author: 'Context Flow Team',
          arguments: [{
            name: 'path',
            type: 'string',
            required: true,
            description: 'File path to read'
          }],
          examples: ['@file("src/example.ts")'],
          tags: ['filesystem', 'io'],
          requiresNetwork: false,
          requiresFilesystem: true
        };

        expect(metadata.name).to.equal('file-provider');
        expect(metadata.arguments).to.have.length(1);
        expect(metadata.arguments[0].name).to.equal('path');
        expect(metadata.requiresFilesystem).to.be.true;
        expect(metadata.requiresNetwork).to.be.false;
      });
    });
  });

  describe('Interface Compatibility', () => {
    it('should allow implementing BuildEngine interface', () => {
      // Mock implementation to test interface structure
      const mockBuildEngine = {
        async build(): Promise<BuildResult> {
          return {
            success: true,
            content: 'mock content',
            metadata: {
              startTime: new Date(),
              endTime: new Date(),
              duration: 100,
              componentCount: 1,
              templateCount: 1,
              providerCount: 0,
              fromWatch: false
            },
            warnings: [],
            dependencies: []
          };
        },

        async *watch(): AsyncIterableIterator<BuildResult> {
          yield await this.build();
        },

        async validate(): Promise<any> {
          return { valid: true, errors: [], warnings: [] };
        },

        getConfig(): any {
          return {};
        },

        updateConfig(): void {},
        registerTarget(): void {},
        registerProvider(): void {},
        clearCache(): void {}
      };

      expect(mockBuildEngine).to.have.property('build');
      expect(mockBuildEngine).to.have.property('watch');
      expect(mockBuildEngine).to.have.property('validate');
    });

    it('should allow implementing TemplateEngine interface', () => {
      const mockTemplateEngine = {
        configure(): void {},
        
        async compile(): Promise<any> {
          return {
            id: 'mock',
            source: 'mock',
            render: async () => 'rendered',
            compiledAt: new Date(),
            metadata: {
              dependencies: [],
              providers: [],
              variables: []
            }
          };
        },

        async render(): Promise<any> {
          return {
            content: 'rendered',
            duration: 10,
            providersUsed: [],
            componentsUsed: [],
            warnings: []
          };
        },

        async renderString(): Promise<any> {
          return this.render();
        },

        registerProvider(): void {},
        registerComponent(): void {},
        registerGlobal(): void {},
        getCachedTemplate(): any { return undefined; },
        clearCache(): void {},
        
        getCacheStats(): any {
          return {
            size: 0,
            maxSize: 100,
            hits: 0,
            misses: 0,
            hitRate: 0,
            memoryUsage: 0
          };
        },

        async validateSyntax(): Promise<any> {
          return {
            valid: true,
            errors: [],
            warnings: [],
            dependencies: {
              variables: [],
              providers: [],
              components: []
            }
          };
        }
      };

      expect(mockTemplateEngine).to.have.property('compile');
      expect(mockTemplateEngine).to.have.property('render');
      expect(mockTemplateEngine).to.have.property('validateSyntax');
    });
  });

  describe('Error Type Validation', () => {
    it('should validate provider error structure', () => {
      const error = {
        message: 'File not found',
        code: 'ENOENT',
        provider: 'file',
        args: ['nonexistent.txt'],
        type: 'filesystem' as const
      };

      expect(error.message).to.be.a('string');
      expect(error.provider).to.be.a('string');
      expect(error.type).to.be.oneOf(['timeout', 'validation', 'execution', 'network', 'filesystem', 'permission']);
    });

    it('should validate target config error structure', () => {
      const error = {
        message: 'Invalid configuration',
        key: 'always_apply',
        type: 'invalid_type' as const,
        expected: 'boolean',
        actual: 'string'
      };

      expect(error.message).to.be.a('string');
      expect(error.type).to.be.oneOf(['missing_required', 'invalid_type', 'invalid_value', 'unknown_option']);
    });
  });
}); 