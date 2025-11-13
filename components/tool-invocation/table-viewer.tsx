'use client';

import React, { useMemo } from 'react';
import { TableUI, TableUIColumn, TableUIRow } from '@/components/table-ui';

export interface TableViewerColumn {
  key: string;
  label: string;
  type?: 'string' | 'number' | 'date' | 'boolean';
}

export interface TableViewerProps {
  title: string;
  description?: string | null;
  columns: TableViewerColumn[];
  data: Array<Record<string, unknown>>;
}

export function TableViewer({ title, description, columns, data }: TableViewerProps) {
  const tableColumns: TableUIColumn[] = useMemo(
    () =>
      columns.map((column) => ({
        key: column.key,
        label: column.label,
        type: column.type ?? 'auto',
        align: column.type === 'number' ? 'right' : 'left',
      })),
    [columns],
  );

  const tableData: TableUIRow[] = useMemo(() => {
    return data.map((row) => {
      const result: TableUIRow = {};
      tableColumns.forEach((column) => {
        result[column.key] = row[column.key];
      });
      return result;
    });
  }, [data, tableColumns]);

  return (
    <TableUI
      title={title}
      description={description ?? undefined}
      columns={tableColumns}
      data={tableData}
      enableJsonPreview
      jsonPreviewPayload={{ title, description, columns, data }}
      sourceTag="create_table"
      accentColor="amber"
    />
  );
}
