import { tool as createTool } from 'ai';
import { z } from 'zod';

export const MODERN_COLORS = [
  '#3B82F6',
  '#8B5CF6',
  '#F97316',
  '#10B981',
  '#EF4444',
  '#F59E0B',
  '#06B6D4',
  '#EC4899',
  '#6366F1',
  '#14B8A6',
];

export const createPieChartTool = createTool({
  description: 'Create a pie chart with automatic percentage calculation and modern distinct colors',
  inputSchema: z.object({
    data: z
      .array(
        z.object({
          label: z.string().min(1).describe('Category label'),
          value: z.preprocess((v) => (typeof v === 'string' ? Number(v) : v), z.number()).describe('Numeric value'),
        }),
      )
      .min(1)
      .describe('Array of data points with label and value'),
    title: z.string().min(1).describe('Title of the pie chart (e.g., the question being answered)'),
    description: z.string().nullable().describe('Optional description or context'),
    unit: z.string().nullable().describe('Unit of measurement (e.g., "votes", "responses")'),
  }),
  execute: async () => {
    return 'Success';
  },
});
