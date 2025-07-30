import { z } from 'zod';

/**
 * Zod schema for component TOML files with recursive reference support
 */

const componentMetadataSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  version: z.string().min(1),
});

const propDefinitionSchema = z.object({
  type: z.enum(['string', 'number', 'boolean', 'array']),
  description: z.string().min(1),
  required: z.boolean(),
  default: z.any().optional(),
});

const templateSchema = z.object({
  content: z.string().min(1),
});

// Basic path validation - actual file existence is checked in the parser
const componentPathSchema = z.string()
  .min(1)
  .refine((path) => path.endsWith('.component.toml'));

// Simple schema without z.lazy() to avoid type issues for now
export const componentSchema = z.object({
  component: componentMetadataSchema,
  props: z.record(z.string(), propDefinitionSchema).optional(),
  use: z.record(z.string(), componentPathSchema).optional(),
  template: templateSchema,
  targets: z.record(z.string(), z.record(z.string(), z.any())).optional(),
});

export type ComponentSchema = z.infer<typeof componentSchema>;