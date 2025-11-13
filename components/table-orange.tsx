'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface OrangeTableColumn {
  key: string;
  label: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface OrangeTableProps {
  title?: string;
  description?: string | null;
  columns: OrangeTableColumn[];
  data: Array<Record<string, React.ReactNode>>;
  footnote?: string | null;
}

export function OrangeTable({
  title,
  description,
  columns,
  data,
  footnote,
}: OrangeTableProps) {
  const hasData = data.length > 0 && columns.length > 0;

  return (
    <Card className="overflow-hidden border-2 border-orange-200 dark:border-orange-500/50 shadow-lg">
      <div className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 text-white">
        <CardHeader className="space-y-2">
          {title ? <CardTitle className="text-lg font-semibold tracking-tight">{title}</CardTitle> : null}
          {description ? <p className="text-sm opacity-90 leading-relaxed">{description}</p> : null}
        </CardHeader>
      </div>
      <CardContent className="bg-white dark:bg-neutral-950 p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-orange-50 dark:bg-orange-900/40">
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      'text-orange-600 dark:text-orange-200 font-semibold uppercase text-xs tracking-wide py-3 px-4 border-b border-b-orange-200/70 dark:border-b-orange-500/40',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                    )}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {hasData ? (
                data.map((row, rowIndex) => (
                  <TableRow
                    key={`row-${rowIndex}`}
                    className="border-b border-b-orange-100/70 dark:border-b-orange-500/20 hover:bg-orange-50/60 dark:hover:bg-orange-900/20"
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn(
                          'py-3 px-4 text-sm text-neutral-700 dark:text-neutral-200 whitespace-pre-wrap align-middle',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right',
                        )}
                      >
                        {row[column.key] ?? ''}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-6 text-center text-neutral-500">
                    Aucun contenu disponible.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {footnote ? (
          <p className="px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400 border-t border-t-orange-100 dark:border-t-orange-900/40 bg-orange-50/60 dark:bg-orange-950/40">
            {footnote}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
