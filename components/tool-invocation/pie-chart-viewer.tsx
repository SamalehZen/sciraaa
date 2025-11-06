"use client";

import { useMemo } from 'react';
import { Label, Pie, PieChart as RechartsPieChart } from 'recharts';

import { JsonViewPopup } from '@/components/json-view-popup';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

import { sanitizeCssVariableName } from './shared.tool-invocation';

export interface PieChartViewerProps {
  title: string;
  data: Array<{ label: string; value: number }>;
  description?: string | null;
  unit?: string | null;
  prefix?: string;
  jsonView?: boolean;
}

const palette = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

function formatLargeNumber(value: number) {
  if (!Number.isFinite(value)) return '0';
  const suffixes = ['', 'k', 'M', 'B', 'T'];
  let temp = Math.abs(value);
  let index = 0;
  while (temp >= 1000 && index < suffixes.length - 1) {
    temp /= 1000;
    index += 1;
  }
  const formatted = `${value < 0 ? '-' : ''}${temp.toFixed(temp < 10 ? 1 : 0)}${suffixes[index]}`;
  return formatted;
}

export function PieChartViewer({ title, data, description, unit, prefix = 'Pie Chart · ', jsonView = true }: PieChartViewerProps) {
  const trimmedTitle = title.trim();
  const sanitizedData = Array.isArray(data) ? data : [];
  const hasTitle = trimmedTitle.length > 0;
  const hasData = sanitizedData.length > 0;

  const total = useMemo(() => sanitizedData.reduce((sum, item) => sum + item.value, 0), [sanitizedData]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    if (unit) {
      config.value = { label: unit };
    }
    sanitizedData.forEach((item, index) => {
      const key = sanitizeCssVariableName(item.label);
      config[key] = {
        label: item.label,
        color: palette[index % palette.length],
      };
    });
    return config;
  }, [sanitizedData, unit]);

  const chartData = useMemo(() => {
    return sanitizedData.map((item) => ({
      name: item.label,
      label: item.label,
      value: item.value,
      fill: `var(--color-${sanitizeCssVariableName(item.label)})`,
    }));
  }, [sanitizedData]);

  if (!hasTitle || !hasData) {
    const errorText = !hasTitle ? 'Missing title for pie chart' : 'No data provided for pie chart';
    return (
      <Card className="bg-card">
        <CardHeader className="items-center pb-0 gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            {prefix}
            {trimmedTitle || 'Pie Chart'}
            <Badge variant="secondary" className="uppercase text-[10px] tracking-wide">Pie</Badge>
            {jsonView ? <JsonViewPopup data={{ title, data, description, unit }} /> : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="w-full">
          <div className="text-sm text-muted-foreground text-center">{errorText}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card">
      <CardHeader className="items-center pb-0 gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {prefix}
          {trimmedTitle}
          <Badge variant="secondary" className="uppercase text-[10px] tracking-wide">Pie</Badge>
          {jsonView ? <JsonViewPopup data={{ title: trimmedTitle, data: sanitizedData, description, unit }} /> : null}
        </CardTitle>
        {description ? <CardDescription className="text-center">{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="w-full">
        <ChartContainer config={chartConfig} className="mx-auto max-w-[420px]">
          <RechartsPieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={4}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan className="fill-foreground text-3xl font-bold" x={viewBox.cx} y={viewBox.cy}>
                          {formatLargeNumber(total)}
                        </tspan>
                        {unit ? (
                          <tspan className="fill-muted-foreground text-sm" x={viewBox.cx} y={(viewBox.cy || 0) + 22}>
                            {unit}
                          </tspan>
                        ) : null}
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
          </RechartsPieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
