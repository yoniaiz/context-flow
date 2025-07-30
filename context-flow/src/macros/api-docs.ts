import type { ApiDocsConfig, MacroDefinition, MacroFunction } from './types.js';

export const apiDocsMacro: MacroFunction<ApiDocsConfig> = (config) => {
  if (!config || !config.endpoints) {
    return '<!-- Error: apiDocs requires endpoints array -->';
  }

  return `# ${config.title}

${config.description ? `${config.description}\n` : ''}
## Endpoints

${config.endpoints.map(endpoint => `
### ${endpoint.method.toUpperCase()} ${endpoint.path}

${endpoint.description}

${endpoint.params && endpoint.params.length > 0 ? `
#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
${endpoint.params.map(param => 
  `| ${param.name} | \`${param.type}\` | ${param.required ? '✅' : '❌'} | ${param.description || ''} |`
).join('\n')}
` : ''}

${endpoint.response ? `
#### Response

**Type:** \`${endpoint.response.type}\`
${endpoint.response.description ? `\n**Description:** ${endpoint.response.description}` : ''}
${endpoint.response.example ? `\n\n**Example:**
\`\`\`json
${JSON.stringify(endpoint.response.example, null, 2)}
\`\`\`` : ''}
` : ''}`).join('\n')}`;
};

export const apiDocs: MacroDefinition<ApiDocsConfig> = {
  fn: apiDocsMacro,
  name: 'apiDocs'
}; 