import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { usePageTitle } from '@/components/layout/page-title-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatTile } from '@/components/stat-tile';
import { LoadingState, EmptyState, ErrorState } from '@/components/data-state';
import { useApplications } from '@/features/applications/hooks';
import { useInterviews } from '@/features/interviews/hooks';
import { useOffers } from '@/features/offers/hooks';
import { useCvVersions } from '@/features/cv-versions/hooks';
import { CHART_AXIS, CHART_GRID, chartColor, truncateLabel } from '@/lib/chart-colors';
import { applicationsPerWeek, avgDaysToResponse, isAppliedOrLater, rejectionsByReason } from '@/lib/utils/stats';
import { SOURCES } from '@/types';

const chartMargin = { top: 4, right: 8, left: -20, bottom: 0 };

export function StatisticsPage() {
  usePageTitle('Statistics');
  const { data: applications, isLoading, isError, refetch } = useApplications();
  const { data: interviews = [] } = useInterviews();
  const { data: offers = [] } = useOffers();
  const { data: cvVersions = [] } = useCvVersions();

  const apps = applications ?? [];
  const applied = useMemo(() => apps.filter(isAppliedOrLater), [apps]);

  const stats = useMemo(() => {
    const totalApplied = applied.length;
    const respondedStatuses = new Set(['Recruiter Screen', 'HR Interview', 'Technical Interview', 'Final Interview', 'Offer', 'Accepted', 'Rejected', 'Withdrawn']);
    const responded = applied.filter((a) => respondedStatuses.has(a.status));
    const appIdsWithInterview = new Set(interviews.map((i) => i.applicationId));
    const appIdsWithTechnical = new Set(interviews.filter((i) => i.type === 'Technical').map((i) => i.applicationId));
    const acceptedOffers = offers.filter((o) => o.decision === 'Accepted');

    const respondedDates = applied
      .filter((a) => a.dateApplied)
      .map((a) => new Date(a.dateApplied!));
    let avgPerWeek = 0;
    if (respondedDates.length > 0) {
      const min = Math.min(...respondedDates.map((d) => d.getTime()));
      const max = Math.max(...respondedDates.map((d) => d.getTime()));
      const weeks = Math.max(1, Math.round((max - min) / (7 * 24 * 3600 * 1000)) + 1);
      avgPerWeek = Math.round((respondedDates.length / weeks) * 10) / 10;
    }

    return {
      total: apps.length,
      responseRate: totalApplied ? Math.round((responded.length / totalApplied) * 100) : 0,
      interviewRate: totalApplied ? Math.round((appIdsWithInterview.size / totalApplied) * 100) : 0,
      technicalRate: totalApplied ? Math.round((appIdsWithTechnical.size / totalApplied) * 100) : 0,
      offerRate: totalApplied ? Math.round((offers.length / totalApplied) * 100) : 0,
      acceptanceRate: offers.length ? Math.round((acceptedOffers.length / offers.length) * 100) : 0,
      avgDaysToResponse: avgDaysToResponse(apps),
      avgPerWeek,
      responded: responded.length,
      interviewed: appIdsWithInterview.size,
      technical: appIdsWithTechnical.size,
      offered: offers.length,
      totalApplied,
    };
  }, [apps, applied, interviews, offers]);

  const perWeek = useMemo(() => applicationsPerWeek(apps, 10), [apps]);
  const rejections = useMemo(() => rejectionsByReason(apps), [apps]);

  const bySource = useMemo(() => {
    return SOURCES.map((source) => {
      const sourceApplied = applied.filter((a) => a.source === source);
      if (sourceApplied.length === 0) return null;
      const withInterview = sourceApplied.filter((a) => interviews.some((i) => i.applicationId === a.id));
      return { label: source as string, rate: Math.round((withInterview.length / sourceApplied.length) * 100) };
    }).filter((v): v is { label: string; rate: number } => v !== null);
  }, [applied, interviews]);

  const byCvVersion = useMemo(() => {
    return cvVersions
      .map((cv) => {
        const cvApplied = applied.filter((a) => a.cvVersion === cv.id);
        if (cvApplied.length === 0) return null;
        const withInterview = cvApplied.filter((a) => interviews.some((i) => i.applicationId === a.id));
        return { label: cv.version, rate: Math.round((withInterview.length / cvApplied.length) * 100) };
      })
      .filter((v): v is { label: string; rate: number } => v !== null);
  }, [cvVersions, applied, interviews]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load statistics." onRetry={() => refetch()} />;

  if (apps.length === 0) {
    return <EmptyState title="No data yet" description="Statistics will appear once you start tracking applications." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total Applications" value={stats.total} />
        <StatTile label="Response Rate" value={`${stats.responseRate}%`} />
        <StatTile label="Interview Rate" value={`${stats.interviewRate}%`} />
        <StatTile label="Technical Interview Rate" value={`${stats.technicalRate}%`} />
        <StatTile label="Offer Rate" value={`${stats.offerRate}%`} />
        <StatTile label="Acceptance Rate" value={`${stats.acceptanceRate}%`} />
        <StatTile label="Avg Days to Response" value={stats.avgDaysToResponse ?? '—'} />
        <StatTile label="Avg Applications / Week" value={stats.avgPerWeek || '—'} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Conversion funnel</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-stretch gap-2">
            <FunnelStep label="Applications" value={stats.totalApplied} />
            <FunnelStep label="Responses" value={stats.responded} />
            <FunnelStep label="Interviews" value={stats.interviewed} />
            <FunnelStep label="Technical" value={stats.technical} />
            <FunnelStep label="Offers" value={stats.offered} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Applications by week</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perWeek} margin={chartMargin}>
                <CartesianGrid stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="week" stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'var(--muted)' }} contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" name="Applications" fill={chartColor(0)} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Rejections by reason</CardTitle></CardHeader>
          <CardContent className="h-64">
            {rejections.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rejections logged yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rejections} layout="vertical" margin={chartMargin}>
                  <CartesianGrid stroke={CHART_GRID} horizontal={false} />
                  <XAxis type="number" stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis
                    dataKey="reason"
                    type="category"
                    stroke={CHART_AXIS}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={130}
                    tickFormatter={truncateLabel}
                  />
                  <Tooltip cursor={{ fill: 'var(--muted)' }} contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" name="Rejections" fill={chartColor(7)} radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Interview conversion by source</CardTitle></CardHeader>
          <CardContent className="h-64">
            {bySource.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not enough data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySource} layout="vertical" margin={chartMargin}>
                  <CartesianGrid stroke={CHART_GRID} horizontal={false} />
                  <XAxis type="number" unit="%" stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="label" type="category" stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} width={130} tickFormatter={truncateLabel} />
                  <Tooltip cursor={{ fill: 'var(--muted)' }} contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="rate" name="Interview rate" fill={chartColor(2)} radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Interview conversion by CV version</CardTitle></CardHeader>
          <CardContent className="h-64">
            {byCvVersion.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not enough data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCvVersion} layout="vertical" margin={chartMargin}>
                  <CartesianGrid stroke={CHART_GRID} horizontal={false} />
                  <XAxis type="number" unit="%" stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="label" type="category" stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} width={130} tickFormatter={truncateLabel} />
                  <Tooltip cursor={{ fill: 'var(--muted)' }} contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="rate" name="Interview rate" fill={chartColor(3)} radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FunnelStep({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex min-w-28 flex-1 flex-col items-center justify-center gap-1 rounded-lg border py-4">
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
