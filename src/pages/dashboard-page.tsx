import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Button } from '@/components/ui/button';
import { SeedDataButton } from '@/components/seed-data-button';
import { StatusBadge } from '@/features/applications/status-badge';
import { useApplications } from '@/features/applications/hooks';
import { useInterviews } from '@/features/interviews/hooks';
import { useOffers } from '@/features/offers/hooks';
import type { ApplicationStatus } from '@/types';
import { CHART_AXIS, CHART_GRID, chartColor } from '@/lib/chart-colors';
import {
  applicationsPerWeek,
  countBySource,
  isActiveApplication,
  isAppliedOrLater,
  isThisWeek,
  pipelineCounts,
} from '@/lib/utils/stats';

const chartMargin = { top: 4, right: 8, left: -20, bottom: 0 };

export function DashboardPage() {
  usePageTitle('Dashboard');
  const navigate = useNavigate();
  const { data: applications, isLoading, isError, refetch } = useApplications();
  const { data: interviews = [] } = useInterviews();
  const { data: offers = [] } = useOffers();

  const apps = applications ?? [];

  const kpis = useMemo(() => {
    const totalApplied = apps.filter(isAppliedOrLater).length;
    const appsWithInterview = new Set(interviews.map((i) => i.applicationId)).size;
    const technicalInterviews = interviews.filter((i) => i.type === 'Technical').length;
    const acceptedOffers = offers.filter((o) => o.decision === 'Accepted').length;
    return {
      total: apps.length,
      thisWeek: apps.filter((a) => isThisWeek(a.dateApplied)).length,
      active: apps.filter(isActiveApplication).length,
      interviews: interviews.length,
      technicalInterviews,
      offers: offers.length,
      acceptedOffers,
      interviewConversion: totalApplied ? Math.round((appsWithInterview / totalApplied) * 100) : 0,
      offerConversion: totalApplied ? Math.round((offers.length / totalApplied) * 100) : 0,
    };
  }, [apps, interviews, offers]);

  const pipeline = useMemo(() => pipelineCounts(apps), [apps]);
  const perWeek = useMemo(() => applicationsPerWeek(apps, 8), [apps]);
  const bySource = useMemo(() => countBySource(apps), [apps]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load dashboard data." onRetry={() => refetch()} />;

  if (apps.length === 0) {
    return (
      <EmptyState
        title="No applications yet"
        description="Start tracking your job search — add your first application to see stats here."
        action={
          <div className="flex gap-2">
            <Button onClick={() => navigate('/applications', { state: { openCreate: true } })}>
              Add your first application
            </Button>
            <SeedDataButton />
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Total Applications" value={kpis.total} />
        <StatTile label="This Week" value={kpis.thisWeek} />
        <StatTile label="Active" value={kpis.active} />
        <StatTile label="Interviews" value={kpis.interviews} hint={`${kpis.technicalInterviews} technical`} />
        <StatTile label="Offers" value={kpis.offers} hint={`${kpis.acceptedOffers} accepted`} />
        <StatTile label="Interview Conversion" value={`${kpis.interviewConversion}%`} />
        <StatTile label="Offer Conversion" value={`${kpis.offerConversion}%`} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Pipeline</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {pipeline.map(({ status, count }) => (
              <div key={status} className="flex min-w-24 flex-col items-start gap-1">
                <StatusBadge status={status as ApplicationStatus} />
                <span className="text-xl font-semibold tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Applications per week</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perWeek} margin={chartMargin}>
                <CartesianGrid stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="week" stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'var(--muted)' }}
                  contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="count" name="Applications" fill={chartColor(0)} radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Applications by source</CardTitle></CardHeader>
          <CardContent className="h-64">
            {bySource.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySource} layout="vertical" margin={chartMargin}>
                  <CartesianGrid stroke={CHART_GRID} horizontal={false} />
                  <XAxis type="number" stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis dataKey="source" type="category" stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} width={130} />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="count" name="Applications" fill={chartColor(1)} radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
