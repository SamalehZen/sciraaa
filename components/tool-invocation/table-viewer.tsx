'use client';

import React, { useMemo } from 'react';
import { OrangeTable, OrangeTableColumn } from '@/components/table-orange';

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
  const tableColumns: OrangeTableColumn[] = useMemo(
    () =>
      columns.map((column) => ({
        key: column.key,
        label: column.label,
        align: column.type === 'number' ? 'right' : 'left',
      })),
    [columns],
  );

  const tableData = useMemo(() => {
    return data.map((row) => {
      const mapped: Record<string, React.ReactNode> = {};
      tableColumns.forEach((column) => {
        mapped[column.key] = row[column.key] as React.ReactNode;
      });
      return mapped;
    });
  }, [data, tableColumns]);

  return (
    <OrangeTable
      title={title}
      description={description ?? undefined}
      columns={tableColumns}
      data={tableData}
      footnote={`Table générée automatiquement (${tableData.length} lignes)`}
    />
  );
}
