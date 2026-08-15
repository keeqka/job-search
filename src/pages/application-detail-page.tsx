import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

export function ApplicationDetailPage() {
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

  usePageTitle(application ? `${application.position} — ${company?.name ?? ''}` : 'Application');

  const timeline = useMemo(() => {
    if (!application) return [];
    const events: { date: string; label: string }[] = [];
    if (application.dateFound) events.push({ date: application.dateFound, label: 'Application found' });
    if (application.dateApplied) events.push({ date: application.dateApplied, label: 'Application submitted' });
    for (const i of appInterviews) {
      if (i.date) events.push({ date: i.date, label: `${i.type} interview${i.result !== 'Scheduled' ? ` — ${i.result}` : ''}` });
    }
    if (application.nextActionDate) {
      events.push({ date: application.nextActionDate, label: application.nextAction || 'Next action' });
    }
    return events
      .filter((e) => e.date)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [application, appInterviews]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load this application." onRetry={() => refetch()} />;

  if (!application) {
    return (
      <EmptyState
        title="Application not found"
        description="It may have been deleted."
        action={<Button onClick={() => navigate('/applications')}>Back to applications</Button>}
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
              <p className="text-sm text-muted-foreground">Unknown company</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> Edit
          </Button>
          <Button variant="outline" className="text-destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Overview</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Field label="Source" value={application.source} />
              <Field label="Employment" value={application.employmentType} />
              <Field label="Work type" value={application.workType} />
              <Field label="Location" value={application.location} />
              <Field label="Date found" value={formatDate(application.dateFound)} />
              <Field label="Date applied" value={formatDate(application.dateApplied)} />
              <Field label="Days since applied" value={daysApplied != null ? String(daysApplied) : '—'} />
              <Field label="Days since activity" value={daysActivity != null ? String(daysActivity) : '—'} />
              <Field label="Next action" value={application.nextAction} />
              <Field label="Next action date" value={formatDate(application.nextActionDate)} />
              <Field label="CV version" value={cvVersion?.version} />
              {application.status === 'Rejected' && (
                <Field label="Rejection reason" value={application.rejectionReason} />
              )}
            </CardContent>
            {(application.vacancyUrl || application.applicationUrl) && (
              <CardContent className="flex gap-4 pt-0 text-sm">
                {application.vacancyUrl && (
                  <a href={application.vacancyUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                    <ExternalLink className="size-3.5" /> Vacancy
                  </a>
                )}
                {application.applicationUrl && (
                  <a href={application.applicationUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                    <ExternalLink className="size-3.5" /> Application page
                  </a>
                )}
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Job Description</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="whitespace-pre-wrap text-muted-foreground">{application.jobDescription || 'No description added.'}</div>
              {application.coverLetter && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-1 font-medium">Cover letter</p>
                    <p className="whitespace-pre-wrap text-muted-foreground">{application.coverLetter}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">No dated events yet.</p>
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
            <CardHeader><CardTitle className="text-base">Interviews</CardTitle></CardHeader>
            <CardContent>
              {appInterviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No interviews recorded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {appInterviews.map((i) => (
                    <li key={i.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                      <span>{i.type}</span>
                      <span className="text-muted-foreground">{formatDate(i.date)}</span>
                      <span className="text-muted-foreground">{i.result}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{application.notes || 'No notes yet.'}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Company</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {company ? (
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <button
                    className="text-primary hover:underline"
                    onClick={() => setCompanyDetailOpen(true)}
                  >
                    {company.name}
                  </button>
                </div>
              ) : (
                <Field label="Name" value={undefined} />
              )}
              <Field label="Industry" value={company?.industry} />
              <Field label="Size" value={company?.companySize} />
              <Field label="Location" value={company?.location} />
              {company?.website && (
                <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                  <ExternalLink className="size-3.5" /> Website
                </a>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {recruiter ? (
                <>
                  <Field label="Name" value={recruiter.name} />
                  <Field label="Role" value={recruiter.role} />
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
                <p className="text-muted-foreground">No contact linked.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Salary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-lg font-semibold">{formatSalaryRange(application)}</p>
              <Field label="Currency" value={application.currency} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Tasks</CardTitle></CardHeader>
            <CardContent>
              {appTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks linked.</p>
              ) : (
                <ul className="space-y-2">
                  {appTasks.map((t) => (
                    <li key={t.id} className="flex items-center justify-between text-sm">
                      <span>{t.type}</span>
                      <span className="text-muted-foreground">{t.status}</span>
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
        title="Delete this application?"
        description="This will permanently remove it from your tracker."
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
