import { startOfWeek, format, parseISO, isValid, differenceInCalendarDays, subWeeks, isWithinInterval, endOfWeek } from 'date-fns';
import {
  APPLICATION_STATUSES,
  PIPELINE_STATUSES,
  SOURCES,
  TERMINAL_STATUSES,
  type Application,
} from '@/types';

function toDate(value?: string): Date | null {
  if (!value) return null;
  const d = parseISO(value);
  return isValid(d) ? d : null;
}

export function isActiveApplication(app: Application): boolean {
  return !TERMINAL_STATUSES.includes(app.status) && app.status !== 'Accepted' && app.status !== 'Wishlist';
}

export function isAppliedOrLater(app: Application): boolean {
  return app.status !== 'Wishlist';
}

export function countByStatus(apps: Application[]): { status: string; count: number }[] {
  const counts = new Map<string, number>(APPLICATION_STATUSES.map((s) => [s, 0]));
  for (const app of apps) counts.set(app.status, (counts.get(app.status) ?? 0) + 1);
  return APPLICATION_STATUSES.map((status) => ({ status, count: counts.get(status) ?? 0 }));
}

export function countBySource(apps: Application[]): { source: string; count: number }[] {
  const counts = new Map<string, number>(SOURCES.map((s) => [s, 0]));
  for (const app of apps) counts.set(app.source, (counts.get(app.source) ?? 0) + 1);
  return SOURCES.map((source) => ({ source, count: counts.get(source) ?? 0 })).filter((s) => s.count > 0);
}

export function pipelineCounts(apps: Application[]): { status: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const status of [...PIPELINE_STATUSES, 'Rejected']) counts.set(status, 0);
  for (const app of apps) {
    if (counts.has(app.status)) counts.set(app.status, (counts.get(app.status) ?? 0) + 1);
  }
  return [...PIPELINE_STATUSES, 'Rejected'].map((status) => ({ status, count: counts.get(status) ?? 0 }));
}

export function applicationsPerWeek(apps: Application[], weeks = 10): { week: string; count: number }[] {
  const now = new Date();
  const buckets: { start: Date; end: Date; week: string; count: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const end = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    buckets.push({ start, end, week: format(start, 'd MMM'), count: 0 });
  }
  for (const app of apps) {
    const date = toDate(app.dateApplied);
    if (!date) continue;
    const bucket = buckets.find((b) => isWithinInterval(date, { start: b.start, end: b.end }));
    if (bucket) bucket.count += 1;
  }
  return buckets.map(({ week, count }) => ({ week, count }));
}

export function isThisWeek(value?: string): boolean {
  const date = toDate(value);
  if (!date) return false;
  const now = new Date();
  return isWithinInterval(date, {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  });
}

export function salaryMidpoints(apps: Application[]): number[] {
  return apps
    .map((a) => {
      if (a.salaryMin && a.salaryMax) return (a.salaryMin + a.salaryMax) / 2;
      return a.salaryMin ?? a.salaryMax ?? null;
    })
    .filter((v): v is number => v != null && v > 0);
}

export function salaryHistogram(values: number[], bucketCount = 6): { label: string; count: number }[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ label: Math.round(min).toLocaleString(), count: values.length }];
  const size = (max - min) / bucketCount;
  const buckets = Array.from({ length: bucketCount }, (_, i) => ({
    from: min + i * size,
    to: min + (i + 1) * size,
    count: 0,
  }));
  for (const v of values) {
    const idx = Math.min(bucketCount - 1, Math.floor((v - min) / size));
    buckets[idx].count += 1;
  }
  return buckets.map((b) => ({
    label: `${Math.round(b.from / 1000)}k–${Math.round(b.to / 1000)}k`,
    count: b.count,
  }));
}

export function avgDaysToResponse(apps: Application[]): number | null {
  const days: number[] = [];
  for (const app of apps) {
    const applied = toDate(app.dateApplied);
    if (!applied) continue;
    if (app.status === 'Applied' || app.status === 'Wishlist') continue;
    const activity = toDate(app.lastActivity);
    if (!activity) continue;
    const diff = differenceInCalendarDays(activity, applied);
    if (diff >= 0) days.push(diff);
  }
  if (days.length === 0) return null;
  return Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10;
}

export function rejectionsByReason(apps: Application[], notSpecifiedLabel = 'Not specified'): { reason: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const app of apps) {
    if (app.status !== 'Rejected') continue;
    const reason = app.rejectionReason?.trim() || notSpecifiedLabel;
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }
  return [...counts.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
}
