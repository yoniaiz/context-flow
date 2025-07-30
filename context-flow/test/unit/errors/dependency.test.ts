import { describe, expect, it } from 'vitest';

import { DependencyError } from '../../../src/errors/dependency.js';
import { ErrorCategory, ErrorSeverity } from '../../../src/errors/types.js';

describe('DependencyError', () => {
  describe('basic error creation', () => {
    it('should create a dependency error with required fields', () => {
      const error = new DependencyError(
        'Dependency resolution failed',
        'Resolving component dependencies',
        'Check dependency configuration'
      );

      expect(error).toBeInstanceOf(DependencyError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('DependencyError');
      expect(error.message).toBe('Dependency resolution failed');
      expect(error.severity).toBe(ErrorSeverity.ERROR);
      expect(error.category).toBe(ErrorCategory.DEPENDENCY);
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

      expect(error.component).toBe('ComponentA');
      expect(error.dependency).toBe('ComponentB');
      expect(error.dependencyChain).toEqual(dependencyChain);
      expect(error.dependencyType).toBe('circular');
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

        expect(error.message).toContain('Circular dependency detected');
        expect(error.message).toContain('ComponentA -> ComponentB -> ComponentC -> ComponentA');
        expect(error.component).toBe('ComponentA');
        expect(error.dependency).toBe('ComponentA');
        expect(error.dependencyChain).toEqual(chain);
        expect(error.dependencyType).toBe('circular');
        expect(error.sourceLocation?.line).toBe(15);
      });

      it('should suggest breaking the circular dependency', () => {
        const chain = ['A', 'B', 'A'];
        const error = DependencyError.circular(chain, '/test.toml');

        expect(error.errorInfo.mitigation).toContain('Break the circular dependency');
        expect(error.errorInfo.mitigation).toContain('A -> B -> A');
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

        expect(error.message).toContain("Missing dependency 'MissingComponent'");
        expect(error.message).toContain("required by component 'ComponentA'");
        expect(error.component).toBe('ComponentA');
        expect(error.dependency).toBe('MissingComponent');
        expect(error.dependencyType).toBe('missing');
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

        expect(error.message).toContain("Invalid dependency reference 'InvalidDep'");
        expect(error.message).toContain("in component 'ComponentA'");
        expect(error.message).toContain('Path does not exist');
        expect(error.component).toBe('ComponentA');
        expect(error.dependency).toBe('InvalidDep');
        expect(error.dependencyType).toBe('invalid');
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

        expect(error.message).toContain('Version conflict');
        expect(error.message).toContain("dependency 'ComponentB'");
        expect(error.message).toContain('requires 2.0.0');
        expect(error.message).toContain('but 1.5.0 is available');
        expect(error.dependencyType).toBe('version');
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

        expect(error.message).toContain("Failed to resolve dependencies for component 'ComponentA'");
        expect(error.message).toContain('Dependency graph is corrupted');
        expect(error.component).toBe('ComponentA');
        expect(error.dependencyType).toBe('invalid');
      });
    });
  });

  describe('utility methods', () => {
    describe('getFormattedDependencyChain()', () => {
      it('should format dependency chain correctly', () => {
        const chain = ['A', 'B', 'C', 'D'];
        const error = DependencyError.circular(chain, '/test.toml');
        const formatted = error.getFormattedDependencyChain();

        expect(formatted).toBe('A -> B -> C -> D');
      });

      it('should handle empty dependency chain', () => {
        const error = new DependencyError(
          'Test error',
          'Test context',
          'Test mitigation'
        );
        const formatted = error.getFormattedDependencyChain();

        expect(formatted).toBe('No dependency chain available');
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

        expect(formatted).toBe('SingleComponent');
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
      expect(formatted).toContain('[DEPENDENCY]');
      expect(formatted).toContain('Circular dependency detected');
      expect(formatted).toContain('Location: /test/component.toml:10');
      expect(formatted).toContain('Context:');
      expect(formatted).toContain('Error:');
      expect(formatted).toContain('Mitigation:');
    });

    it('should include dependency data in JSON output', () => {
      const error = DependencyError.missing(
        'ComponentA',
        'MissingDep',
        '/test.toml'
      );

      const json = error.toJSON();
      expect(json.category).toBe('dependency');
      expect(json.data.component).toBe('ComponentA');
      expect(json.data.dependency).toBe('MissingDep');
      expect(json.data.dependencyType).toBe('missing');
    });
  });
});