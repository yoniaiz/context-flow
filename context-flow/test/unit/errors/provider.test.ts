import { describe, expect, it } from 'vitest';

import { ProviderError } from '../../../src/errors/provider.js';
import { ErrorCategory, ErrorSeverity } from '../../../src/errors/types.js';

describe('ProviderError', () => {
  describe('basic error creation', () => {
    it('should create a provider error with required fields', () => {
      const error = new ProviderError(
        'Provider execution failed',
        'Executing file provider',
        'Check file permissions'
      );

      expect(error).toBeInstanceOf(ProviderError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ProviderError');
      expect(error.message).toBe('Provider execution failed');
      expect(error.severity).toBe(ErrorSeverity.ERROR);
      expect(error.category).toBe(ErrorCategory.PROVIDER);
    });

    it('should accept optional provider details', () => {
      const providerArgs = { encoding: 'utf-8', file: 'test.txt' };
      const error = new ProviderError(
        'Test error',
        'Test context',
        'Test mitigation',
        { filePath: '/test/component.toml' },
        {
          exitCode: 1,
          provider: 'fileProvider',
          providerArgs,
          providerType: 'execution',
          stderr: 'Error message',
          stdout: 'Some output'
        }
      );

      expect(error.provider).toBe('fileProvider');
      expect(error.providerArgs).toEqual(providerArgs);
      expect(error.providerType).toBe('execution');
      expect(error.exitCode).toBe(1);
      expect(error.stdout).toBe('Some output');
      expect(error.stderr).toBe('Error message');
    });
  });

  describe('static factory methods', () => {
    describe('notFound()', () => {
      it('should create a provider not found error', () => {
        const availableProviders = ['file', 'git-diff', 'url'];
        const error = ProviderError.notFound(
          'unknownProvider',
          availableProviders,
          '/test/component.toml',
          8
        );

        expect(error.message).toBe("Provider 'unknownProvider' not found");
        expect(error.provider).toBe('unknownProvider');
        expect(error.providerType).toBe('not_found');
        expect(error.errorInfo.mitigation).toContain('file, git-diff, url');
        expect(error.sourceLocation?.line).toBe(8);
      });
    });

    describe('invalidArgs()', () => {
      it('should create an invalid arguments error', () => {
        const args = { encoding: 'invalid', file: '' };
        const error = ProviderError.invalidArgs(
          'fileProvider',
          args,
          'File path cannot be empty',
          '/test/component.toml',
          12
        );

        expect(error.message).toContain("Invalid arguments for provider 'fileProvider'");
        expect(error.message).toContain('File path cannot be empty');
        expect(error.provider).toBe('fileProvider');
        expect(error.providerArgs).toEqual(args);
        expect(error.providerType).toBe('invalid_args');
      });
    });

    describe('execution()', () => {
      it('should create an execution error with exit code', () => {
        const error = ProviderError.execution(
          'gitProvider',
          'Git command failed',
          '/test/component.toml',
          128,
          'stdout content',
          'stderr content',
          5
        );

        expect(error.message).toContain("Provider 'gitProvider' execution failed with exit code 128");
        expect(error.message).toContain('Git command failed');
        expect(error.provider).toBe('gitProvider');
        expect(error.providerType).toBe('execution');
        expect(error.exitCode).toBe(128);
        expect(error.stdout).toBe('stdout content');
        expect(error.stderr).toBe('stderr content');
      });

      it('should create an execution error without exit code', () => {
        const error = ProviderError.execution(
          'urlProvider',
          'Network timeout',
          '/test/component.toml'
        );

        expect(error.message).toBe("Provider 'urlProvider' execution failed: Network timeout");
        expect(error.exitCode).toBeUndefined();
      });
    });

    describe('fileAccess()', () => {
      it('should create a file access error', () => {
        const error = ProviderError.fileAccess(
          'fileProvider',
          '/test/component.toml',
          '/missing/file.txt',
          'File does not exist',
          10
        );

        expect(error.message).toContain("Provider 'fileProvider' cannot access file '/missing/file.txt'");
        expect(error.message).toContain('File does not exist');
        expect(error.provider).toBe('fileProvider');
        expect(error.providerType).toBe('permission');
        expect(error.providerArgs?.file).toBe('/missing/file.txt');
      });
    });

    describe('timeout()', () => {
      it('should create a timeout error', () => {
        const error = ProviderError.timeout(
          'urlProvider',
          5000,
          '/test/component.toml',
          7
        );

        expect(error.message).toBe("Provider 'urlProvider' timed out after 5000ms");
        expect(error.provider).toBe('urlProvider');
        expect(error.providerType).toBe('timeout');
        expect(error.errorInfo.mitigation).toContain('Increase the timeout');
      });
    });

    describe('gitError()', () => {
      it('should create a git-specific error', () => {
        const error = ProviderError.gitError(
          'gitDiffProvider',
          'not a git repository',
          '/test/component.toml',
          15
        );

        expect(error.message).toContain("Git provider 'gitDiffProvider' failed");
        expect(error.message).toContain('not a git repository');
        expect(error.provider).toBe('gitDiffProvider');
        expect(error.providerType).toBe('execution');
        expect(error.errorInfo.mitigation).toContain('Ensure you are in a git repository');
      });
    });

    describe('networkError()', () => {
      it('should create a network-specific error', () => {
        const error = ProviderError.networkError(
          'urlProvider',
          'https://example.com/api',
          'Connection refused',
          '/test/component.toml',
          20
        );

        expect(error.message).toContain("Network provider 'urlProvider' failed to fetch");
        expect(error.message).toContain('https://example.com/api');
        expect(error.message).toContain('Connection refused');
        expect(error.provider).toBe('urlProvider');
        expect(error.providerType).toBe('execution');
        expect(error.providerArgs?.url).toBe('https://example.com/api');
      });
    });
  });

  describe('utility methods', () => {
    describe('getFormattedOutput()', () => {
      it('should format output with stdout and stderr', () => {
        const error = ProviderError.execution(
          'testProvider',
          'Execution failed',
          '/test.toml',
          1,
          'Standard output content',
          'Error output content'
        );

        const formatted = error.getFormattedOutput();
        expect(formatted).toContain('STDOUT:');
        expect(formatted).toContain('Standard output content');
        expect(formatted).toContain('STDERR:');
        expect(formatted).toContain('Error output content');
        expect(formatted).toContain('Exit Code: 1');
      });

      it('should handle empty output', () => {
        const error = new ProviderError(
          'Test error',
          'Test context',
          'Test mitigation'
        );

        const formatted = error.getFormattedOutput();
        expect(formatted).toBe('No output available');
      });

      it('should handle whitespace-only output', () => {
        const error = ProviderError.execution(
          'testProvider',
          'Test error',
          '/test.toml',
          0,
          '   \n  ',
          '\t\n'
        );

        const formatted = error.getFormattedOutput();
        expect(formatted).toContain('Exit Code: 0');
        expect(formatted).not.toContain('STDOUT:');
        expect(formatted).not.toContain('STDERR:');
      });
    });

    describe('getFormattedArgs()', () => {
      it('should format provider arguments', () => {
        const args = {
          encoding: 'utf-8',
          file: '/test/file.txt',
          lines: 10
        };
        const error = new ProviderError(
          'Test error',
          'Test context',
          'Test mitigation',
          undefined,
          { providerArgs: args }
        );

        const formatted = error.getFormattedArgs();
        expect(formatted).toContain('file: "/test/file.txt"');
        expect(formatted).toContain('encoding: "utf-8"');
        expect(formatted).toContain('lines: 10');
      });

      it('should handle no arguments', () => {
        const error = new ProviderError(
          'Test error',
          'Test context',
          'Test mitigation'
        );

        const formatted = error.getFormattedArgs();
        expect(formatted).toBe('No arguments provided');
      });

      it('should handle complex argument types', () => {
        const args = {
          config: { nested: { value: true } },
          list: ['a', 'b', 'c']
        };
        const error = new ProviderError(
          'Test error',
          'Test context',
          'Test mitigation',
          undefined,
          { providerArgs: args }
        );

        const formatted = error.getFormattedArgs();
        expect(formatted).toContain('config:');
        expect(formatted).toContain('list:');
      });
    });
  });

  describe('error formatting', () => {
    it('should format provider error with details', () => {
      const error = ProviderError.execution(
        'testProvider',
        'Command failed',
        '/test/component.toml',
        1,
        'output',
        'error'
      );

      const formatted = error.getFormattedMessage();
      expect(formatted).toContain('[PROVIDER]');
      expect(formatted).toContain('Provider');
      expect(formatted).toContain('execution failed');
    });

    it('should include provider data in JSON output', () => {
      const args = { file: 'test.txt' };
      const error = ProviderError.invalidArgs(
        'fileProvider',
        args,
        'Invalid file path',
        '/test.toml'
      );

      const json = error.toJSON();
      expect(json.category).toBe('provider');
      expect(json.data.provider).toBe('fileProvider');
      expect(json.data.providerArgs).toEqual(args);
      expect(json.data.providerType).toBe('invalid_args');
    });
  });
});