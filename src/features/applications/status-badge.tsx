import { cn } from '@/lib/utils';
import type { ApplicationStatus, Priority } from '@/types';

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  Wishlist: 'bg-muted text-muted-foreground',
  Applied: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  'Recruiter Screen': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
  'HR Interview': 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
  'Technical Interview': 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  'Final Interview': 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-400',
  Offer: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  Accepted: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  Withdrawn: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400',
  'No Response': 'bg-zinc-100 text-zinc-600 dark:bg-zinc-500/15 dark:text-zinc-400',
};

export function StatusBadge({ status, className }: { status: ApplicationStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium',
        STATUS_STYLES[status],
        className,
      )}
    >
      {status}
    </span>
  );
}

const PRIORITY_STYLES: Record<Priority, string> = {
  High: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  Low: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400',
};

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium',
        PRIORITY_STYLES[priority],
        className,
      )}
    >
      {priority}
    </span>
  );
}
