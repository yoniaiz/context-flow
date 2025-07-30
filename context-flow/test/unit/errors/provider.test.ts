import { expect } from 'chai';
import { describe, it } from 'mocha';
import { ProviderError } from '../../../src/errors/provider.js';
import { ErrorSeverity, ErrorCategory } from '../../../src/errors/types.js';

describe('ProviderError', () => {
  describe('basic error creation', () => {
    it('should create a provider error with required fields', () => {
      const error = new ProviderError(
        'Provider execution failed',
        'Executing file provider',
        'Check file permissions'
      );

      expect(error).to.be.instanceOf(ProviderError);
      expect(error).to.be.instanceOf(Error);
      expect(error.name).to.equal('ProviderError');
      expect(error.message).to.equal('Provider execution failed');
      expect(error.severity).to.equal(ErrorSeverity.ERROR);
      expect(error.category).to.equal(ErrorCategory.PROVIDER);
    });

    it('should accept optional provider details', () => {
      const providerArgs = { file: 'test.txt', encoding: 'utf-8' };
      const error = new ProviderError(
        'Test error',
        'Test context',
        'Test mitigation',
        { filePath: '/test/component.toml' },
        {
          provider: 'fileProvider',
          providerArgs,
          providerType: 'execution',
          exitCode: 1,
          stdout: 'Some output',
          stderr: 'Error message'
        }
      );

      expect(error.provider).to.equal('fileProvider');
      expect(error.providerArgs).to.deep.equal(providerArgs);
      expect(error.providerType).to.equal('execution');
      expect(error.exitCode).to.equal(1);
      expect(error.stdout).to.equal('Some output');
      expect(error.stderr).to.equal('Error message');
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

        expect(error.message).to.equal("Provider 'unknownProvider' not found");
        expect(error.provider).to.equal('unknownProvider');
        expect(error.providerType).to.equal('not_found');
        expect(error.errorInfo.mitigation).to.include('file, git-diff, url');
        expect(error.sourceLocation?.line).to.equal(8);
      });
    });

    describe('invalidArgs()', () => {
      it('should create an invalid arguments error', () => {
        const args = { file: '', encoding: 'invalid' };
        const error = ProviderError.invalidArgs(
          'fileProvider',
          args,
          'File path cannot be empty',
          '/test/component.toml',
          12
        );

        expect(error.message).to.include("Invalid arguments for provider 'fileProvider'");
        expect(error.message).to.include('File path cannot be empty');
        expect(error.provider).to.equal('fileProvider');
        expect(error.providerArgs).to.deep.equal(args);
        expect(error.providerType).to.equal('invalid_args');
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

        expect(error.message).to.include("Provider 'gitProvider' execution failed with exit code 128");
        expect(error.message).to.include('Git command failed');
        expect(error.provider).to.equal('gitProvider');
        expect(error.providerType).to.equal('execution');
        expect(error.exitCode).to.equal(128);
        expect(error.stdout).to.equal('stdout content');
        expect(error.stderr).to.equal('stderr content');
      });

      it('should create an execution error without exit code', () => {
        const error = ProviderError.execution(
          'urlProvider',
          'Network timeout',
          '/test/component.toml'
        );

        expect(error.message).to.equal("Provider 'urlProvider' execution failed: Network timeout");
        expect(error.exitCode).to.be.undefined;
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

        expect(error.message).to.include("Provider 'fileProvider' cannot access file '/missing/file.txt'");
        expect(error.message).to.include('File does not exist');
        expect(error.provider).to.equal('fileProvider');
        expect(error.providerType).to.equal('permission');
        expect(error.providerArgs?.file).to.equal('/missing/file.txt');
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

        expect(error.message).to.equal("Provider 'urlProvider' timed out after 5000ms");
        expect(error.provider).to.equal('urlProvider');
        expect(error.providerType).to.equal('timeout');
        expect(error.errorInfo.mitigation).to.include('Increase the timeout');
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

        expect(error.message).to.include("Git provider 'gitDiffProvider' failed");
        expect(error.message).to.include('not a git repository');
        expect(error.provider).to.equal('gitDiffProvider');
        expect(error.providerType).to.equal('execution');
        expect(error.errorInfo.mitigation).to.include('Ensure you are in a git repository');
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

        expect(error.message).to.include("Network provider 'urlProvider' failed to fetch");
        expect(error.message).to.include('https://example.com/api');
        expect(error.message).to.include('Connection refused');
        expect(error.provider).to.equal('urlProvider');
        expect(error.providerType).to.equal('execution');
        expect(error.providerArgs?.url).to.equal('https://example.com/api');
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
        expect(formatted).to.include('STDOUT:');
        expect(formatted).to.include('Standard output content');
        expect(formatted).to.include('STDERR:');
        expect(formatted).to.include('Error output content');
        expect(formatted).to.include('Exit Code: 1');
      });

      it('should handle empty output', () => {
        const error = new ProviderError(
          'Test error',
          'Test context',
          'Test mitigation'
        );

        const formatted = error.getFormattedOutput();
        expect(formatted).to.equal('No output available');
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
        expect(formatted).to.include('Exit Code: 0');
        expect(formatted).not.to.include('STDOUT:');
        expect(formatted).not.to.include('STDERR:');
      });
    });

    describe('getFormattedArgs()', () => {
      it('should format provider arguments', () => {
        const args = {
          file: '/test/file.txt',
          encoding: 'utf-8',
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
        expect(formatted).to.include('file: "/test/file.txt"');
        expect(formatted).to.include('encoding: "utf-8"');
        expect(formatted).to.include('lines: 10');
      });

      it('should handle no arguments', () => {
        const error = new ProviderError(
          'Test error',
          'Test context',
          'Test mitigation'
        );

        const formatted = error.getFormattedArgs();
        expect(formatted).to.equal('No arguments provided');
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
        expect(formatted).to.include('config:');
        expect(formatted).to.include('list:');
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
      expect(formatted).to.include('[PROVIDER]');
      expect(formatted).to.include('Provider');
      expect(formatted).to.include('execution failed');
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
      expect(json.category).to.equal('provider');
      expect(json.data.provider).to.equal('fileProvider');
      expect(json.data.providerArgs).to.deep.equal(args);
      expect(json.data.providerType).to.equal('invalid_args');
    });
  });
});