import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Pencil, Trash2, ExternalLink, Mail, Phone, Send } from 'lucide-react';
import { usePageTitle } from '@/components/layout/page-title-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LoadingState, EmptyState, ErrorState } from '@/components/data-state';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { StatusBadge, PriorityBadge } from '@/features/applications/status-badge';
import {
  formatDate,
  formatDateShort,
  formatSalaryRange,
  daysSinceApplied,
  daysSinceLastActivity,
} from '@/lib/utils/computed';
import { useApplications, useDeleteApplication } from '@/features/applications/hooks';
import { useCompanies } from '@/features/companies/hooks';
import { useContacts } from '@/features/contacts/hooks';
import { useInterviews } from '@/features/interviews/hooks';
import { useTasks } from '@/features/tasks/hooks';
import { useCvVersions } from '@/features/cv-versions/hooks';
import { ApplicationFormDialog } from '@/features/applications/application-form-dialog';
import { CompanyDetailSheet } from '@/features/companies/company-detail-sheet';
import { CompanyFormDialog } from '@/features/companies/company-form-dialog';
import { useEnumLabel } from '@/i18n/enum-labels';

export function ApplicationDetailPage() {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: applications, isLoading, isError, refetch } = useApplications();
  const { data: companies = [] } = useCompanies();
  const { data: contacts = [] } = useContacts();
  const { data: interviews = [] } = useInterviews();
  const { data: tasks = [] } = useTasks();
  const { data: cvVersions = [] } = useCvVersions();
  const deleteApplication = useDeleteApplication();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [companyDetailOpen, setCompanyDetailOpen] = useState(false);
  const [companyEditOpen, setCompanyEditOpen] = useState(false);

  const application = applications?.find((a) => a.id === id);
  const company = application ? companies.find((c) => c.id === application.companyId) : undefined;
  const recruiter = application?.recruiterId ? contacts.find((c) => c.id === application.recruiterId) : undefined;
  const cvVersion = application?.cvVersion ? cvVersions.find((cv) => cv.id === application.cvVersion) : undefined;
  const appInterviews = useMemo(
    () => interviews.filter((i) => i.applicationId === id).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')),
    [interviews, id],
  );
  const appTasks = useMemo(() => tasks.filter((t) => t.applicationId === id), [tasks, id]);

  usePageTitle(application ? `${application.position} — ${company?.name ?? ''}` : t('applicationDetail.defaultTitle'));

  const timeline = useMemo(() => {
    if (!application) return [];
    const events: { date: string; label: string }[] = [];
    if (application.dateFound) events.push({ date: application.dateFound, label: t('applicationDetail.foundEvent') });
    if (application.dateApplied) events.push({ date: application.dateApplied, label: t('applicationDetail.submittedEvent') });
    for (const i of appInterviews) {
      const type = enumLabel('interviewType', i.type);
      const label = i.result !== 'Scheduled'
        ? t('applicationDetail.interviewEventWithResult', { type, result: enumLabel('interviewResult', i.result) })
        : t('applicationDetail.interviewEvent', { type });
      if (i.date) events.push({ date: i.date, label });
    }
    if (application.nextActionDate) {
      events.push({ date: application.nextActionDate, label: application.nextAction || t('applicationDetail.nextActionFallback') });
    }
    return events
      .filter((e) => e.date)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [application, appInterviews, t, enumLabel]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={t('applicationDetail.failedToLoad')} onRetry={() => refetch()} />;

  if (!application) {
    return (
      <EmptyState
        title={t('applicationDetail.notFoundTitle')}
        description={t('applicationDetail.notFoundDescription')}
        action={<Button onClick={() => navigate('/applications')}>{t('applicationDetail.backToApplications')}</Button>}
      />
    );
  }

  const daysApplied = daysSinceApplied(application);
  const daysActivity = daysSinceLastActivity(application);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{application.position}</h2>
              <StatusBadge status={application.status} />
              <PriorityBadge priority={application.priority} />
            </div>
            {company ? (
              <button
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                onClick={() => setCompanyDetailOpen(true)}
              >
                {company.name}
              </button>
            ) : (
              <p className="text-sm text-muted-foreground">{t('common.unknownCompany')}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> {t('common.edit')}
          </Button>
          <Button variant="outline" className="text-destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" /> {t('common.delete')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">{t('applicationDetail.overview')}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Field label={t('applications.sourceLabel')} value={enumLabel('source', application.source)} />
              <Field label={t('applicationDetail.employment')} value={enumLabel('employmentType', application.employmentType)} />
              <Field label={t('applicationForm.workType')} value={enumLabel('workType', application.workType)} />
              <Field label={t('applicationForm.location')} value={application.location} />
              <Field label={t('applicationForm.dateFound')} value={formatDate(application.dateFound)} />
              <Field label={t('applicationForm.dateApplied')} value={formatDate(application.dateApplied)} />
              <Field label={t('applicationDetail.daysSinceApplied')} value={daysApplied != null ? String(daysApplied) : '—'} />
              <Field label={t('applicationDetail.daysSinceActivity')} value={daysActivity != null ? String(daysActivity) : '—'} />
              <Field label={t('applicationForm.nextAction')} value={application.nextAction} />
              <Field label={t('applicationForm.nextActionDate')} value={formatDate(application.nextActionDate)} />
              <Field label={t('applicationForm.cvVersion')} value={cvVersion?.version} />
              {application.status === 'Rejected' && (
                <Field label={t('applicationForm.rejectionReason')} value={application.rejectionReason} />
              )}
            </CardContent>
            {(application.vacancyUrl || application.applicationUrl) && (
              <CardContent className="flex gap-4 pt-0 text-sm">
                {application.vacancyUrl && (
                  <a href={application.vacancyUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                    <ExternalLink className="size-3.5" /> {t('applicationDetail.vacancy')}
                  </a>
                )}
                {application.applicationUrl && (
                  <a href={application.applicationUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                    <ExternalLink className="size-3.5" /> {t('applicationDetail.applicationPage')}
                  </a>
                )}
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">{t('applicationDetail.jobDescription')}</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="whitespace-pre-wrap text-muted-foreground">{application.jobDescription || t('applicationDetail.noDescription')}</div>
              {application.coverLetter && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-1 font-medium">{t('applicationForm.coverLetter')}</p>
                    <p className="whitespace-pre-wrap text-muted-foreground">{application.coverLetter}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">{t('applicationDetail.timeline')}</CardTitle></CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('applicationDetail.noEvents')}</p>
              ) : (
                <ol className="space-y-3">
                  {timeline.map((event, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="w-14 shrink-0 text-muted-foreground">{formatDateShort(event.date)}</span>
                      <span>{event.label}</span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">{t('nav.interviews')}</CardTitle></CardHeader>
            <CardContent>
              {appInterviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('applicationDetail.noInterviews')}</p>
              ) : (
                <ul className="space-y-2">
                  {appInterviews.map((i) => (
                    <li key={i.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                      <span>{enumLabel('interviewType', i.type)}</span>
                      <span className="text-muted-foreground">{formatDate(i.date)}</span>
                      <span className="text-muted-foreground">{enumLabel('interviewResult', i.result)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">{t('common.notes')}</CardTitle></CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{application.notes || t('applicationDetail.noNotes')}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">{t('common.company')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {company ? (
                <div>
                  <p className="text-xs text-muted-foreground">{t('applicationDetail.name')}</p>
                  <button
                    className="text-primary hover:underline"
                    onClick={() => setCompanyDetailOpen(true)}
                  >
                    {company.name}
                  </button>
                </div>
              ) : (
                <Field label={t('applicationDetail.name')} value={undefined} />
              )}
              <Field label={t('applicationDetail.industry')} value={enumLabel('industry', company?.industry)} />
              <Field label={t('applicationDetail.size')} value={enumLabel('companySize', company?.companySize)} />
              <Field label={t('applicationForm.location')} value={company?.location} />
              {company?.website && (
                <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                  <ExternalLink className="size-3.5" /> {t('common.website')}
                </a>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">{t('applicationDetail.contact')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {recruiter ? (
                <>
                  <Field label={t('applicationDetail.name')} value={recruiter.name} />
                  <Field label={t('applicationDetail.role')} value={enumLabel('contactRole', recruiter.role)} />
                  {recruiter.email && (
                    <a href={`mailto:${recruiter.email}`} className="flex items-center gap-1 text-primary hover:underline">
                      <Mail className="size-3.5" /> {recruiter.email}
                    </a>
                  )}
                  {recruiter.telegram && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Send className="size-3.5" /> {recruiter.telegram}
                    </span>
                  )}
                  {recruiter.phone && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="size-3.5" /> {recruiter.phone}
                    </span>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">{t('applicationDetail.noContact')}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">{t('common.salary')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-lg font-semibold">{formatSalaryRange(application)}</p>
              <Field label={t('applicationForm.currency')} value={enumLabel('currency', application.currency)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">{t('nav.tasks')}</CardTitle></CardHeader>
            <CardContent>
              {appTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('applicationDetail.noTasks')}</p>
              ) : (
                <ul className="space-y-2">
                  {appTasks.map((task) => (
                    <li key={task.id} className="flex items-center justify-between text-sm">
                      <span>{enumLabel('taskType', task.type)}</span>
                      <span className="text-muted-foreground">{enumLabel('taskStatus', task.status)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ApplicationFormDialog open={editOpen} onOpenChange={setEditOpen} application={application} />

      <CompanyDetailSheet
        open={companyDetailOpen}
        onOpenChange={setCompanyDetailOpen}
        company={company}
        onEdit={() => {
          setCompanyDetailOpen(false);
          setCompanyEditOpen(true);
        }}
      />

      <CompanyFormDialog open={companyEditOpen} onOpenChange={setCompanyEditOpen} company={company} />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('applications.deleteTitle')}
        description={t('applicationDetail.deleteDescription')}
        onConfirm={() => {
          deleteApplication.mutate(application.id);
          navigate(-1);
        }}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p>{value || '—'}</p>
    </div>
  );
}
