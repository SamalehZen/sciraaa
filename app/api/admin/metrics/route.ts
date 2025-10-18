export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { getOnlineUsers } from '@/lib/realtime/pusher-server';
import { countUserSearches, getActivityHeatmap, getLatencyDistribution, getLookoutStats, getMessageTimeSeries, getStackedBySource, getTopCountries, getIssuesDonut } from '@/lib/db/admin-queries';

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const url = new URL(req.url);
  const period = (url.searchParams.get('period') as '24h' | '7d' | '30d') || '24h';
  const searches = await countUserSearches(period);
  const onlineUsers = (await getOnlineUsers()).length;
  const latency = await getLatencyDistribution(period);
  const lookoutStats = await getLookoutStats(period);
  const timeSeries = await getMessageTimeSeries(period);
  const heatmap = await getActivityHeatmap(period);
  const stacked = await getStackedBySource(period);
  const topCountries = await getTopCountries(period);
  const donutIssues = await getIssuesDonut(period);
  const donut = {
    success: (donutIssues.success || 0) + lookoutStats.success,
    error: (donutIssues.error || 0) + lookoutStats.error,
    reformulation: donutIssues.reformulation || 0,
  };
  return NextResponse.json({
    kpis: {
      searches,
      onlineUsers,
      successRate: lookoutStats.successRate,
      latencyP95: latency.p95,
      lookoutExecutions: lookoutStats.total,
      errors24h: lookoutStats.error,
    },
    graphs: {
      timeSeries,
      stacked,
      heatmap,
      topCountries,
      donut,
      latency,
    },
  });
}