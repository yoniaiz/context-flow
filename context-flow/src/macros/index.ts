export { apiDocs, apiDocsMacro } from './api-docs.js';

// Export individual macros
export { codePatterns, codePatternsMacro } from './code-patterns.js';
// Export types
export * from './types.js';

import type { MacroDefinition, MacroRegistry } from './types.js';

import { apiDocs } from './api-docs.js';
// Import all macro definitions
import { codePatterns } from './code-patterns.js';

// Built-in macros registry
export const builtInMacros: MacroDefinition[] = [
  codePatterns as MacroDefinition,
  apiDocs as MacroDefinition
];

/**
 * Create a macro registry from macro definitions
 */
export function createMacroRegistry(macros: MacroDefinition[]): MacroRegistry {
  const registry: MacroRegistry = {};
  
  for (const macro of macros) {
    registry[macro.name] = macro.fn;
  }
  
  return registry;
}

/**
 * Get the default built-in macro registry
 */
export function getBuiltInMacroRegistry(): MacroRegistry {
  return createMacroRegistry(builtInMacros);
} 