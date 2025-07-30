import type { CodePatternsConfig, MacroDefinition, MacroFunction } from './types.js';

export const codePatternsMacro: MacroFunction<CodePatternsConfig> = (config) => {
  if (!config || !config.patterns) {
    return '<!-- Error: codePatterns requires patterns array -->';
  }

  return `# Code Patterns and Best Practices

${config.patterns.map(pattern => `
## ${pattern.name}

${pattern.description}

### ✅ Good
\`\`\`typescript
${Array.isArray(pattern.good) ? pattern.good.join('\n') : pattern.good}
\`\`\`
${pattern.bad ? `
### ❌ Avoid
\`\`\`typescript
${Array.isArray(pattern.bad) ? pattern.bad.join('\n') : pattern.bad}
\`\`\`` : ''}`).join('\n')}`;
};

export const codePatterns: MacroDefinition<CodePatternsConfig> = {
  fn: codePatternsMacro,
  name: 'codePatterns'
}; 