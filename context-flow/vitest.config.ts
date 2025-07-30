import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'node:fs': 'fs',
      // Handle node: imports for compatibility
      'node:path': 'path',
      'node:process': 'process',
      'node:url': 'url'
    }
  },
  test: {
    environment: 'node',
    exclude: ['test/commands/**/*.test.ts'],
    globals: true,
    include: ['test/unit/**/*.test.ts'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    testTimeout: 10_000
  }
}); 