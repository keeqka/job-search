import { useMemo, useState } from 'react';
import { CalendarCheck, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '@/components/layout/page-title-context';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { LoadingState, ErrorState, EmptyState } from '@/components/data-state';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { formatDate, toDateKey } from '@/lib/utils/computed';
import { useInterviews, useDeleteInterview } from '@/features/interviews/hooks';
import { useApplications } from '@/features/applications/hooks';
import { useCompanies } from '@/features/companies/hooks';
import { InterviewFormDialog } from '@/features/interviews/interview-form-dialog';
import { InterviewDetailSheet } from '@/features/interviews/interview-detail-sheet';
import { TruncateTooltip } from '@/components/truncate-tooltip';
import { useEnumLabel } from '@/i18n/enum-labels';
import type { Interview } from '@/types';

export function InterviewsPage() {
  const { t } = useTranslation();
  usePageTitle(t('nav.interviews'));
  const { data: interviews, isLoading, isError, refetch } = useInterviews();
  const { data: applications = [] } = useApplications();
  const { data: companies = [] } = useCompanies();
  const deleteInterview = useDeleteInterview();

  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Interview | undefined>();
  const [detail, setDetail] = useState<Interview | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const applicationById = useMemo(() => new Map(applications.map((a) => [a.id, a])), [applications]);
  const companyById = useMemo(() => new Map(companies.map((c) => [c.id, c])), [companies]);

  function titleFor(interview: Interview) {
    const app = applicationById.get(interview.applicationId);
    const company = app ? companyById.get(app.companyId) : undefined;
    return app ? `${app.position} — ${company?.name ?? t('common.unknown')}` : t('interviews.unknownApplication');
  }

  const sorted = useMemo(
    () => [...(interviews ?? [])].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')),
    [interviews],
  );

  const today = toDateKey(new Date());
  const upcoming = sorted.filter((i) => (i.date ?? '') >= today);
  const past = [...sorted.filter((i) => (i.date ?? '') < today)].reverse();

  const interviewDates = useMemo(
    () => new Set((interviews ?? []).filter((i) => i.date).map((i) => i.date!.slice(0, 10))),
    [interviews],
  );

  const selectedDayInterviews = useMemo(() => {
    if (!selectedDate) return [];
    const iso = toDateKey(selectedDate);
    return sorted.filter((i) => i.date?.slice(0, 10) === iso);
  }, [selectedDate, sorted]);

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }
  function openEdit(interview: Interview) {
    setDetail(undefined);
    setEditing(interview);
    setFormOpen(true);
  }

  const isEmpty = !interviews?.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'calendar')}>
          <TabsList>
            <TabsTrigger value="list">{t('interviews.list')}</TabsTrigger>
            <TabsTrigger value="calendar">{t('interviews.calendar')}</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> {t('interviews.new')}
        </Button>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message={t('interviews.failedToLoad')} onRetry={() => refetch()} />}

      {!isLoading && !isError && isEmpty && (
        <EmptyState
          icon={CalendarCheck}
          title={t('interviews.noInterviewsYet')}
          description={t('interviews.emptyDescription')}
          action={<Button onClick={openCreate}>{t('interviews.addFirst')}</Button>}
        />
      )}

      {!isLoading && !isError && !isEmpty && view === 'list' && (
        <div className="animate-in fade-in-0 duration-300 space-y-6">
          <InterviewGroup title={t('interviews.upcoming')} items={upcoming} titleFor={titleFor} onOpen={setDetail} />
          <InterviewGroup title={t('interviews.past')} items={past} titleFor={titleFor} onOpen={setDetail} />
        </div>
      )}

      {!isLoading && !isError && !isEmpty && view === 'calendar' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
          <Card className="w-fit">
            <CardContent className="p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{ hasInterview: (d) => interviewDates.has(toDateKey(d)) }}
                modifiersClassNames={{ hasInterview: 'font-semibold underline decoration-2 underline-offset-4' }}
              />
            </CardContent>
          </Card>
          <div className="space-y-2">
            {!selectedDate && <p className="text-sm text-muted-foreground">{t('interviews.selectDay')}</p>}
            {selectedDate && selectedDayInterviews.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('interviews.noneOnThisDay')}</p>
            )}
            {selectedDayInterviews.map((i) => (
              <InterviewRow key={i.id} interview={i} title={titleFor(i)} onClick={() => setDetail(i)} />
            ))}
          </div>
        </div>
      )}

      <InterviewFormDialog open={formOpen} onOpenChange={setFormOpen} interview={editing} />

      <InterviewDetailSheet
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(undefined)}
        interview={detail}
        title={detail ? titleFor(detail) : ''}
        onEdit={() => detail && openEdit(detail)}
        onDelete={() => detail && setDeletingId(detail.id)}
      />

      <ConfirmDeleteDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title={t('interviews.deleteTitle')}
        onConfirm={() => {
          if (deletingId) deleteInterview.mutate(deletingId);
          setDeletingId(null);
          setDetail(undefined);
        }}
      />
    </div>
  );
}

function InterviewGroup({
  title,
  items,
  titleFor,
  onOpen,
}: {
  title: string;
  items: Interview[];
  titleFor: (i: Interview) => string;
  onOpen: (i: Interview) => void;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">{title} ({items.length})</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('interviews.nothingHere')}</p>
      ) : (
        <div className="space-y-2">
          {items.map((i) => (
            <InterviewRow key={i.id} interview={i} title={titleFor(i)} onClick={() => onOpen(i)} />
          ))}
        </div>
      )}
    </div>
  );
}

function InterviewRow({ interview, title, onClick }: { interview: Interview; title: string; onClick: () => void }) {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm hover:bg-muted/50"
    >
      <div className="min-w-0 flex-1">
        <TruncateTooltip className="font-medium">{title}</TruncateTooltip>
        <p className="text-muted-foreground">{t('interviews.typeInterview', { type: enumLabel('interviewType', interview.type) })}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-muted-foreground">{formatDate(interview.date)}</span>
        <StatusResultBadge result={interview.result} />
      </div>
    </button>
  );
}

function StatusResultBadge({ result }: { result: Interview['result'] }) {
  const enumLabel = useEnumLabel();
  const map: Record<Interview['result'], string> = {
    Scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    Passed: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    Failed: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    Waiting: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    Cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400',
  };
  return <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${map[result]}`}>{enumLabel('interviewResult', result)}</span>;
}
