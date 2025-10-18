'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ChartAreaAdmin } from '@/components/orcish/chart-area-admin';
import { BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ['admin-metrics', '24h'],
    queryFn: async () => {
      const r = await fetch('/api/admin/metrics?period=24h');
      if (!r.ok) throw new Error('failed');
      return r.json();
    },
    refetchInterval: 10000,
  });
  const kpis = data?.kpis || {};
  const series = (data?.graphs?.timeSeries || []).map((d: any) => ({ date: d.date, user: d.user, assistant: d.assistant }));
  const stacked = data?.graphs?.stacked || [];
  const topCountries = data?.graphs?.topCountries || [];
  const donut = data?.graphs?.donut || { success: 0, reformulation: 0, error: 0 };
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <Card><CardHeader><CardTitle>Recherches</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{kpis.searches ?? 0}</CardContent></Card>
      <Card><CardHeader><CardTitle>En ligne</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{kpis.onlineUsers ?? 0}</CardContent></Card>
      <Card><CardHeader><CardTitle>Taux succès</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{Math.round(((kpis.successRate || 0) * 100))}%</CardContent></Card>
      <Card><CardHeader><CardTitle>Latence p95</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{Math.round((data?.graphs?.latency?.p95 || 0) * 100) / 100}s</CardContent></Card>
      <Card><CardHeader><CardTitle>Lookout 24h</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{kpis.lookoutExecutions ?? 0}</CardContent></Card>
      <Card><CardHeader><CardTitle>Erreurs 24h</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{kpis.errors24h ?? 0}</CardContent></Card>

      <div className="col-span-1 md:col-span-3 lg:col-span-6">
        {/* Orcish interactive chart wired to /api/admin/metrics */}
        <ChartAreaAdmin />
      </div>

      <div className="col-span-1 md:col-span-3">
        <Card>
          <CardHeader><CardTitle>Sources</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={{ count: { label: 'Count', color: 'hsl(var(--primary))' } }}>
              <BarChart data={stacked}>
                <XAxis dataKey="source" hide />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="col-span-1 md:col-span-3">
        <Card>
          <CardHeader><CardTitle>Pays (Top)</CardTitle></CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              {topCountries.map((c: any) => (
                <li key={c.country} className="flex justify-between"><span>{c.country}</span><span>{c.count}</span></li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="col-span-1 md:col-span-3">
        <Card>
          <CardHeader><CardTitle>Issues (API + Lookout)</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={{ success: { label: 'Succès', color: '#16a34a' }, reformulation: { label: 'Reformulation', color: '#f59e0b' }, error: { label: 'Erreur', color: '#dc2626' } }}>
              <PieChart>
                <Pie data={[{ name: 'success', value: donut.success }, { name: 'reformulation', value: donut.reformulation }, { name: 'error', value: donut.error }]} dataKey="value" nameKey="name" outerRadius={60} label>
                  <Cell key="success" fill="var(--color-success)" />
                  <Cell key="reformulation" fill="var(--color-reformulation)" />
                  <Cell key="error" fill="var(--color-error)" />
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}