import { z } from 'zod';

/**
 * Zod schema for workflow TOML files
 */

const workflowMetadataSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
});

const templateSchema = z.object({
  content: z.string().min(1),
});

// Component path validation - must end with .component.toml
const componentPathSchema = z.string()
  .min(1)
  .refine((path) => path.endsWith('.component.toml'));

const useSchema = z.record(z.string(), componentPathSchema).optional();

export const workflowSchema = z.object({
  workflow: workflowMetadataSchema,
  use: useSchema,
  template: templateSchema,
});

export type WorkflowSchema = z.infer<typeof workflowSchema>;