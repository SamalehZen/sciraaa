import { z } from 'zod';

export type ColumnType = 'string' | 'number' | 'date' | 'bool';

export interface Column {
  name: string;
  type: ColumnType;
  unit?: string | null;
  description?: string | null;
}

export interface Table {
  id: string;
  name: string;
  columns: Column[];
  rows: Array<Record<string, string | number | boolean | null>>;
}

export interface StatSummary {
  count: number;
  mean: number | null;
  median: number | null;
  std: number | null;
  min: number | null;
  max: number | null;
  naCount: number;
}

export type ChartType = 'bar' | 'line' | 'pie';

export interface ChartArtifact {
  id: string;
  type: ChartType;
  url: string;
  title?: string;
  tableId?: string;
}

export interface Report {
  htmlUrl?: string;
  htmlInline?: string;
}

export const ColumnSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'date', 'bool']),
  unit: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const TableSchema = z.object({
  id: z.string(),
  name: z.string(),
  columns: z.array(ColumnSchema).min(1),
  rows: z
    .array(
      z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]))
    )
    .optional()
    .default([]),
});

export const StatSummarySchema = z.object({
  count: z.number(),
  mean: z.number().nullable(),
  median: z.number().nullable(),
  std: z.number().nullable(),
  min: z.number().nullable(),
  max: z.number().nullable(),
  naCount: z.number(),
});

export const ChartArtifactSchema = z.object({
  id: z.string(),
  type: z.enum(['bar', 'line', 'pie']),
  url: z.string().url(),
  title: z.string().optional(),
  tableId: z.string().optional(),
});

export const ReportSchema = z.object({
  htmlUrl: z.string().url().optional(),
  htmlInline: z.string().optional(),
});

export type ColumnZ = z.infer<typeof ColumnSchema>;
export type TableZ = z.infer<typeof TableSchema>;
export type StatSummaryZ = z.infer<typeof StatSummarySchema>;
export type ChartArtifactZ = z.infer<typeof ChartArtifactSchema>;
export type ReportZ = z.infer<typeof ReportSchema>;
