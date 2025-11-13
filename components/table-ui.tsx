'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { ArrowDown, ArrowUp, Download, Eye, Grid, LayoutList, Rows4, Sparkles, TrendingUp } from 'lucide-react';
import { JsonViewPopup } from '@/components/json-view-popup';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type TableUIColumnType = 'string' | 'number' | 'date' | 'boolean' | 'auto';

export interface TableUIColumn {
  key: string;
  label: React.ReactNode;
  type?: TableUIColumnType;
  align?: 'left' | 'center' | 'right';
}

export type TableUIRow = Record<string, React.ReactNode>;

export interface TableUIProps {
  title?: string;
  description?: string | null;
  columns: TableUIColumn[];
  data: TableUIRow[];
  sourceTag?: string;
  accentColor?: 'amber' | 'violet' | 'emerald' | 'blue';
  initialDensity?: 'comfortable' | 'compact';
  enableJsonPreview?: boolean;
  jsonPreviewPayload?: unknown;
  extraActions?: React.ReactNode;
  footnote?: string;
}

interface NumericSummary {
  key: string;
  label: string;
  count: number;
  min: number | null;
  max: number | null;
  mean: number | null;
  sum: number | null;
}

const DENSITY_CLASSNAME = {
  comfortable: {
    head: 'py-3 px-4',
    cell: 'py-3.5 px-4 text-sm',
  },
  compact: {
    head: 'py-2 px-3 text-xs uppercase tracking-wide',
    cell: 'py-2.5 px-3 text-[13px]',
  },
} as const;

const ACCENT_THEME: Record<NonNullable<TableUIProps['accentColor']>, { border: string; glow: string; badge: string; header: string }> = {
  amber: {
    border: 'border-amber-200 dark:border-amber-500/50',
    glow: 'from-amber-200/60 via-amber-100/0 to-transparent',
    badge: 'bg-amber-500/85 text-amber-50',
    header: 'from-amber-100 via-amber-100/30 to-transparent dark:from-amber-500/20 dark:via-amber-500/5',
  },
  violet: {
    border: 'border-violet-200 dark:border-violet-500/50',
    glow: 'from-violet-200/60 via-violet-100/0 to-transparent',
    badge: 'bg-violet-500/90 text-violet-50',
    header: 'from-violet-100 via-violet-100/20 to-transparent dark:from-violet-500/15 dark:via-violet-500/5',
  },
  emerald: {
    border: 'border-emerald-200 dark:border-emerald-500/50',
    glow: 'from-emerald-200/60 via-emerald-100/0 to-transparent',
    badge: 'bg-emerald-500/90 text-emerald-50',
    header: 'from-emerald-100 via-emerald-100/20 to-transparent dark:from-emerald-500/15 dark:via-emerald-500/5',
  },
  blue: {
    border: 'border-sky-200 dark:border-sky-500/50',
    glow: 'from-sky-200/60 via-sky-100/0 to-transparent',
    badge: 'bg-sky-500/90 text-sky-50',
    header: 'from-sky-100 via-sky-100/20 to-transparent dark:from-sky-500/15 dark:via-sky-500/5',
  },
};

const detectNumeric = (value: React.ReactNode): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'string') {
    const normalized = value
      .replace(/[\s\u202F]/g, '')
      .replace(/[%\$€£¥₽₿]/g, '')
      .replace(/,/g, '.')
      .replace(/[^0-9.\-]/g, '');
    const parsed = Number(normalized);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
};

const extractText = (node: React.ReactNode): string => {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map((item) => extractText(item)).join(' ');
  }
  if (React.isValidElement(node)) {
    return extractText(node.props.children);
  }
  return '';
};

const formatNumber = (value: number | null, options?: Intl.NumberFormatOptions) => {
  if (value === null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('fr-FR', options ?? { maximumFractionDigits: 2 }).format(value);
};

const exportToCsv = (columns: TableUIColumn[], rows: TableUIRow[], filename: string) => {
  const visibleKeys = columns.map((column) => column.key);
  const header = columns.map((column) => extractText(column.label)).join(',');
  const content = rows
    .map((row) =>
      visibleKeys
        .map((key) => {
          const value = extractText(row[key]);
          const escaped = value.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(','),
    )
    .join('\n');
  const csv = `${header}\n${content}`;
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const exportToExcel = async (columns: TableUIColumn[], rows: TableUIRow[], filename: string) => {
  const XLSX = await import('xlsx');
  const header = columns.map((column) => extractText(column.label));
  const visibleKeys = columns.map((column) => column.key);
  const sheetData = [
    header,
    ...rows.map((row) => visibleKeys.map((key) => extractText(row[key]))),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Table');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export function TableUI({
  title = 'Tableau structuré',
  description,
  columns,
  data,
  sourceTag,
  accentColor = 'amber',
  initialDensity = 'comfortable',
  enableJsonPreview,
  jsonPreviewPayload,
  extraActions,
  footnote,
}: TableUIProps) {
  const [searchValue, setSearchValue] = useState('');
  const [density, setDensity] = useState<'comfortable' | 'compact'>(initialDensity);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(columns.map((column) => column.key)));
  const [sortState, setSortState] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const normalizedColumns = useMemo<TableUIColumn[]>(() => {
    return columns.map((column) => ({
      ...column,
      type: column.type ?? 'auto',
      align: column.align ?? (column.type === 'number' ? 'right' : 'left'),
    }));
  }, [columns]);

  const processedRows = useMemo(() => {
    const filtered = data.filter((row) => {
      if (!searchValue.trim()) return true;
      const needle = searchValue.trim().toLowerCase();
      return normalizedColumns.some((column) => extractText(row[column.key]).toLowerCase().includes(needle));
    });

    if (!sortState) {
      return filtered;
    }

    const columnDefinition = normalizedColumns.find((column) => column.key === sortState.key);
    if (!columnDefinition) {
      return filtered;
    }

    const { key, direction } = sortState;
    const factor = direction === 'asc' ? 1 : -1;
    const type = columnDefinition.type;

    const sorted = [...filtered].sort((leftRow, rightRow) => {
      const leftValue = leftRow[key];
      const rightValue = rightRow[key];

      if (type === 'number' || detectNumeric(leftValue) !== null || detectNumeric(rightValue) !== null) {
        const a = detectNumeric(leftValue) ?? 0;
        const b = detectNumeric(rightValue) ?? 0;
        return (a - b) * factor;
      }

      if (type === 'date') {
        const a = Date.parse(extractText(leftValue));
        const b = Date.parse(extractText(rightValue));
        return (a - b) * factor;
      }

      const aText = extractText(leftValue).toLowerCase();
      const bText = extractText(rightValue).toLowerCase();
      return aText.localeCompare(bText) * factor;
    });

    return sorted;
  }, [data, normalizedColumns, searchValue, sortState]);

  const numericSummaries = useMemo(() => {
    const summaries: NumericSummary[] = [];

    normalizedColumns.forEach((column) => {
      const values = processedRows
        .map((row) => detectNumeric(row[column.key]))
        .filter((value): value is number => value !== null && Number.isFinite(value));

      if (values.length === 0) return;

      const sum = values.reduce((acc, value) => acc + value, 0);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const mean = values.length > 0 ? sum / values.length : null;

      summaries.push({
        key: column.key,
        label: extractText(column.label) || column.key,
        count: values.length,
        min: Number.isFinite(min) ? min : null,
        max: Number.isFinite(max) ? max : null,
        mean: mean !== null && Number.isFinite(mean) ? mean : null,
        sum,
      });
    });

    return summaries.slice(0, 3);
  }, [normalizedColumns, processedRows]);

  const toggleColumnVisibility = useCallback((key: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) {
          next.delete(key);
        }
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleSort = (columnKey: string) => {
    setSortState((prev) => {
      if (!prev || prev.key !== columnKey) {
        return { key: columnKey, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key: columnKey, direction: 'desc' };
      }
      return null;
    });
  };

  const accent = ACCENT_THEME[accentColor];
  const visibleColumnsArray = normalizedColumns.filter((column) => visibleColumns.has(column.key));

  const hasData = data.length > 0;

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-2 shadow-[0_25px_60px_-30px_rgba(251,191,36,0.55)] backdrop-blur-sm dark:shadow-[0_25px_60px_-30px_rgba(245,158,11,0.45)]',
        accent.border,
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-48 blur-2xl opacity-70',
          accent.glow,
        )}
      />

      <CardHeader className="relative z-10 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500 dark:text-amber-300" />
              <Badge variant="outline" className={cn('uppercase text-[10px] tracking-[0.2em] border-none', accent.badge)}>
                Tableau premium
              </Badge>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </CardTitle>
            {description ? <CardDescription className="max-w-2xl leading-relaxed text-muted-foreground">{description}</CardDescription> : null}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/60 px-2 py-1">
                <Rows4 className="h-3 w-3" /> {processedRows.length} lignes • {visibleColumnsArray.length} colonnes visibles
              </span>
              {sourceTag ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/60 px-2 py-1">
                  <TrendingUp className="h-3 w-3" /> {sourceTag}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {enableJsonPreview && jsonPreviewPayload ? (
              <JsonViewPopup data={jsonPreviewPayload} />
            ) : null}
            {extraActions}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="h-4 w-4" /> Colonnes
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
                {normalizedColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.key}
                    checked={visibleColumns.has(column.key)}
                    onCheckedChange={() => toggleColumnVisibility(column.key)}
                  >
                    {extractText(column.label)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="inline-flex items-center overflow-hidden rounded-full border border-border bg-background/80 backdrop-blur">
              <Button
                size="sm"
                variant={density === 'comfortable' ? 'default' : 'ghost'}
                className={cn('gap-1 rounded-none font-medium', density === 'comfortable' ? '' : 'text-muted-foreground')}
                onClick={() => setDensity('comfortable')}
              >
                <Grid className="h-4 w-4" /> Confort
              </Button>
              <Button
                size="sm"
                variant={density === 'compact' ? 'default' : 'ghost'}
                className={cn('gap-1 rounded-none font-medium', density === 'compact' ? '' : 'text-muted-foreground')}
                onClick={() => setDensity('compact')}
              >
                <LayoutList className="h-4 w-4" /> Compact
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Rechercher dans le tableau…"
            className="w-full max-w-md bg-background/80 backdrop-blur"
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => exportToCsv(visibleColumnsArray, processedRows, extractText(title) || 'tableau')}
              disabled={!hasData}
            >
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => exportToExcel(visibleColumnsArray, processedRows, extractText(title) || 'tableau')}
              disabled={!hasData}
            >
              <Download className="h-4 w-4" /> Excel
            </Button>
          </div>
        </div>

        {numericSummaries.length > 0 ? (
          <div className="flex flex-wrap gap-3 pt-2">
            {numericSummaries.map((summary) => (
              <div
                key={summary.key}
                className="flex flex-col gap-1 rounded-xl border border-border/60 bg-background/60 p-3 sm:p-4 shadow-sm"
              >
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{summary.label}</span>
                <div className="flex flex-wrap items-baseline gap-4 text-sm">
                  <span className="font-semibold text-foreground">
                    Somme {formatNumber(summary.sum)}
                  </span>
                  <span className="text-muted-foreground">Moyenne {formatNumber(summary.mean)}</span>
                  <span className="text-muted-foreground">Min {formatNumber(summary.min)}</span>
                  <span className="text-muted-foreground">Max {formatNumber(summary.max)}</span>
                  <span className="text-muted-foreground">{summary.count} valeurs</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="overflow-hidden rounded-2xl border border-border/70 shadow-inner">
          <Table>
            <TableHeader className={cn('sticky top-0 z-10 backdrop-blur-sm', accent.header)}>
              <TableRow className="border-border/60">
                <TableHead className={cn(DENSITY_CLASSNAME[density].head, 'w-12 text-center text-muted-foreground/70 text-xs uppercase tracking-wide')}>
                  #
                </TableHead>
                {visibleColumnsArray.map((column) => {
                  const isSorted = sortState?.key === column.key;
                  const direction = sortState?.direction ?? 'asc';
                  return (
                    <TableHead
                      key={column.key}
                      className={cn(
                        DENSITY_CLASSNAME[density].head,
                        column.align === 'right' && 'text-right',
                        column.align === 'center' && 'text-center',
                        'whitespace-nowrap text-sm font-semibold text-foreground',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort(column.key)}
                        className="inline-flex items-center gap-2"
                      >
                        <span>{column.label}</span>
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background/80">
                          {isSorted ? (
                            direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUp className="h-3 w-3 opacity-30" />
                          )}
                        </span>
                      </button>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumnsArray.length + 1} className="py-16 text-center text-muted-foreground">
                    Aucun résultat ne correspond à votre recherche.
                  </TableCell>
                </TableRow>
              ) : (
                processedRows.map((row, rowIndex) => (
                  <TableRow
                    key={`row-${rowIndex}`}
                    className="border-border/50 transition-colors hover:bg-accent/30"
                  >
                    <TableCell className={cn(DENSITY_CLASSNAME[density].cell, 'text-center text-xs text-muted-foreground/80 font-mono')}>
                      {rowIndex + 1}
                    </TableCell>
                    {visibleColumnsArray.map((column) => {
                      const raw = row[column.key];
                      const isBooleanType = column.type === 'boolean';
                      const numericValue = detectNumeric(raw);

                      if (isBooleanType) {
                        return (
                          <TableCell key={column.key} className={cn(DENSITY_CLASSNAME[density].cell, 'text-center')}>
                            <Checkbox checked={Boolean(raw)} disabled className="pointer-events-none" />
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell
                          key={column.key}
                          className={cn(
                            DENSITY_CLASSNAME[density].cell,
                            column.align === 'right' && 'text-right',
                            column.align === 'center' && 'text-center',
                            'whitespace-pre-wrap text-sm leading-relaxed',
                            numericValue !== null && 'font-mono text-[13px]',
                          )}
                        >
                          {raw as React.ReactNode}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {footnote ? (
          <p className="mt-4 text-xs text-muted-foreground/80">{footnote}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
