import { expect } from 'chai';
import { describe, it } from 'mocha';
import { DependencyError } from '../../../src/errors/dependency.js';
import { ErrorSeverity, ErrorCategory } from '../../../src/errors/types.js';

describe('DependencyError', () => {
  describe('basic error creation', () => {
    it('should create a dependency error with required fields', () => {
      const error = new DependencyError(
        'Dependency resolution failed',
        'Resolving component dependencies',
        'Check dependency configuration'
      );

      expect(error).to.be.instanceOf(DependencyError);
      expect(error).to.be.instanceOf(Error);
      expect(error.name).to.equal('DependencyError');
      expect(error.message).to.equal('Dependency resolution failed');
      expect(error.severity).to.equal(ErrorSeverity.ERROR);
      expect(error.category).to.equal(ErrorCategory.DEPENDENCY);
    });

    it('should accept optional dependency details', () => {
      const dependencyChain = ['ComponentA', 'ComponentB', 'ComponentC'];
      const error = new DependencyError(
        'Test error',
        'Test context',
        'Test mitigation',
        { filePath: '/test/component.toml' },
        {
          component: 'ComponentA',
          dependency: 'ComponentB',
          dependencyChain,
          dependencyType: 'circular'
        }
      );

      expect(error.component).to.equal('ComponentA');
      expect(error.dependency).to.equal('ComponentB');
      expect(error.dependencyChain).to.deep.equal(dependencyChain);
      expect(error.dependencyType).to.equal('circular');
    });
  });

  describe('static factory methods', () => {
    describe('circular()', () => {
      it('should create a circular dependency error', () => {
        const chain = ['ComponentA', 'ComponentB', 'ComponentC', 'ComponentA'];
        const error = DependencyError.circular(
          chain,
          '/test/component.toml',
          15
        );

        expect(error.message).to.include('Circular dependency detected');
        expect(error.message).to.include('ComponentA -> ComponentB -> ComponentC -> ComponentA');
        expect(error.component).to.equal('ComponentA');
        expect(error.dependency).to.equal('ComponentA');
        expect(error.dependencyChain).to.deep.equal(chain);
        expect(error.dependencyType).to.equal('circular');
        expect(error.sourceLocation?.line).to.equal(15);
      });

      it('should suggest breaking the circular dependency', () => {
        const chain = ['A', 'B', 'A'];
        const error = DependencyError.circular(chain, '/test.toml');

        expect(error.errorInfo.mitigation).to.include('Break the circular dependency');
        expect(error.errorInfo.mitigation).to.include('A -> B -> A');
      });
    });

    describe('missing()', () => {
      it('should create a missing dependency error', () => {
        const error = DependencyError.missing(
          'ComponentA',
          'MissingComponent',
          '/test/component.toml',
          8
        );

        expect(error.message).to.include("Missing dependency 'MissingComponent'");
        expect(error.message).to.include("required by component 'ComponentA'");
        expect(error.component).to.equal('ComponentA');
        expect(error.dependency).to.equal('MissingComponent');
        expect(error.dependencyType).to.equal('missing');
      });
    });

    describe('invalid()', () => {
      it('should create an invalid dependency error', () => {
        const error = DependencyError.invalid(
          'ComponentA',
          'InvalidDep',
          'Path does not exist',
          '/test/component.toml',
          12
        );

        expect(error.message).to.include("Invalid dependency reference 'InvalidDep'");
        expect(error.message).to.include("in component 'ComponentA'");
        expect(error.message).to.include('Path does not exist');
        expect(error.component).to.equal('ComponentA');
        expect(error.dependency).to.equal('InvalidDep');
        expect(error.dependencyType).to.equal('invalid');
      });
    });

    describe('versionConflict()', () => {
      it('should create a version conflict error', () => {
        const error = DependencyError.versionConflict(
          'ComponentA',
          'ComponentB',
          '2.0.0',
          '1.5.0',
          '/test/component.toml',
          5
        );

        expect(error.message).to.include('Version conflict');
        expect(error.message).to.include("dependency 'ComponentB'");
        expect(error.message).to.include('requires 2.0.0');
        expect(error.message).to.include('but 1.5.0 is available');
        expect(error.dependencyType).to.equal('version');
      });
    });

    describe('resolutionFailed()', () => {
      it('should create a resolution failed error', () => {
        const error = DependencyError.resolutionFailed(
          'ComponentA',
          'Dependency graph is corrupted',
          '/test/component.toml',
          20
        );

        expect(error.message).to.include("Failed to resolve dependencies for component 'ComponentA'");
        expect(error.message).to.include('Dependency graph is corrupted');
        expect(error.component).to.equal('ComponentA');
        expect(error.dependencyType).to.equal('invalid');
      });
    });
  });

  describe('utility methods', () => {
    describe('getFormattedDependencyChain()', () => {
      it('should format dependency chain correctly', () => {
        const chain = ['A', 'B', 'C', 'D'];
        const error = DependencyError.circular(chain, '/test.toml');
        const formatted = error.getFormattedDependencyChain();

        expect(formatted).to.equal('A -> B -> C -> D');
      });

      it('should handle empty dependency chain', () => {
        const error = new DependencyError(
          'Test error',
          'Test context',
          'Test mitigation'
        );
        const formatted = error.getFormattedDependencyChain();

        expect(formatted).to.equal('No dependency chain available');
      });

      it('should handle single component chain', () => {
        const error = new DependencyError(
          'Test error',
          'Test context',
          'Test mitigation',
          undefined,
          { dependencyChain: ['SingleComponent'] }
        );
        const formatted = error.getFormattedDependencyChain();

        expect(formatted).to.equal('SingleComponent');
      });
    });
  });

  describe('error formatting', () => {
    it('should format error message with dependency details', () => {
      const error = DependencyError.circular(
        ['A', 'B', 'A'],
        '/test/component.toml',
        10
      );

      const formatted = error.getFormattedMessage();
      expect(formatted).to.include('[DEPENDENCY]');
      expect(formatted).to.include('Circular dependency detected');
      expect(formatted).to.include('Location: /test/component.toml:10');
      expect(formatted).to.include('Context:');
      expect(formatted).to.include('Error:');
      expect(formatted).to.include('Mitigation:');
    });

    it('should include dependency data in JSON output', () => {
      const error = DependencyError.missing(
        'ComponentA',
        'MissingDep',
        '/test.toml'
      );

      const json = error.toJSON();
      expect(json.category).to.equal('dependency');
      expect(json.data.component).to.equal('ComponentA');
      expect(json.data.dependency).to.equal('MissingDep');
      expect(json.data.dependencyType).to.equal('missing');
    });
  });
});