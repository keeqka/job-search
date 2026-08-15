import { differenceInCalendarDays, parseISO, isValid } from 'date-fns';
import type { Application } from '@/types';

function toDate(value?: string): Date | null {
  if (!value) return null;
  const date = parseISO(value);
  return isValid(date) ? date : null;
}

export function daysSince(value?: string): number | null {
  const date = toDate(value);
  if (!date) return null;
  return differenceInCalendarDays(new Date(), date);
}

export function daysSinceApplied(app: Application): number | null {
  return daysSince(app.dateApplied);
}

export function daysSinceLastActivity(app: Application): number | null {
  return daysSince(app.lastActivity);
}

/** status = Applied AND days since applied >= 7 */
export function isFollowUpNeeded(app: Application): boolean {
  if (app.status !== 'Applied') return false;
  const days = daysSinceApplied(app);
  return days !== null && days >= 7;
}

export function formatSalaryRange(app: Pick<Application, 'salaryMin' | 'salaryMax' | 'currency'>): string {
  const { salaryMin, salaryMax, currency } = app;
  if (!salaryMin && !salaryMax) return '—';
  const symbol = currencySymbol(currency);
  if (salaryMin && salaryMax) {
    if (salaryMin === salaryMax) return `${symbol}${formatNumber(salaryMin)}`;
    return `${symbol}${formatNumber(salaryMin)} – ${symbol}${formatNumber(salaryMax)}`;
  }
  return `${symbol}${formatNumber(salaryMin ?? salaryMax ?? 0)}`;
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function currencySymbol(currency?: string): string {
  switch (currency) {
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'KZT':
      return '₸';
    default:
      return '';
  }
}

export function formatDate(value?: string): string {
  const date = toDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateShort(value?: string): string {
  const date = toDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
}

export function todayIso(): string {
  return new Date().toISOString();
}

/** Local-timezone YYYY-MM-DD key, safe for comparing against stored date-only strings. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
