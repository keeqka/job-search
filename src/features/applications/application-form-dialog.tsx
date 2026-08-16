import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/submit-button';
import { FieldError } from '@/components/field-error';
import { TruncateTooltip } from '@/components/truncate-tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  APPLICATION_STATUSES,
  CURRENCIES,
  EMPLOYMENT_TYPES,
  PRIORITIES,
  SOURCES,
  WORK_TYPES,
  type Application,
} from '@/types';
import { useCompanies } from '@/features/companies/hooks';
import { CompanyFormDialog } from '@/features/companies/company-form-dialog';
import { useContacts } from '@/features/contacts/hooks';
import { contactLabel } from '@/features/contacts/contact-label';
import { useCvVersions } from '@/features/cv-versions/hooks';
import { useCreateApplication, useUpdateApplication } from '@/features/applications/hooks';
import { useEnumLabel } from '@/i18n/enum-labels';
import { toDateKey } from '@/lib/utils/computed';

interface FormValues {
  companyId: string;
  position: string;
  status: string;
  source: string;
  priority: string;
  vacancyUrl: string;
  applicationUrl: string;
  dateFound: string;
  dateApplied: string;
  nextAction: string;
  nextActionDate: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  employmentType: string;
  workType: string;
  location: string;
  recruiterId: string;
  cvVersion: string;
  jobDescription: string;
  coverLetter: string;
  notes: string;
  rejectionReason: string;
}

const EMPTY: FormValues = {
  companyId: '',
  position: '',
  status: 'Wishlist',
  source: '',
  priority: 'Medium',
  vacancyUrl: '',
  applicationUrl: '',
  dateFound: '',
  dateApplied: '',
  nextAction: '',
  nextActionDate: '',
  salaryMin: '',
  salaryMax: '',
  currency: '',
  employmentType: '',
  workType: '',
  location: '',
  recruiterId: '',
  cvVersion: '',
  jobDescription: '',
  coverLetter: '',
  notes: '',
  rejectionReason: '',
};

function toFormValues(app?: Application): FormValues {
  if (!app) {
    const today = toDateKey(new Date());
    return { ...EMPTY, dateFound: today, dateApplied: today, nextActionDate: today };
  }
  return {
    companyId: app.companyId ?? '',
    position: app.position ?? '',
    status: app.status ?? 'Wishlist',
    source: app.source ?? '',
    priority: app.priority ?? 'Medium',
    vacancyUrl: app.vacancyUrl ?? '',
    applicationUrl: app.applicationUrl ?? '',
    dateFound: app.dateFound?.slice(0, 10) ?? '',
    dateApplied: app.dateApplied?.slice(0, 10) ?? '',
    nextAction: app.nextAction ?? '',
    nextActionDate: app.nextActionDate?.slice(0, 10) ?? '',
    salaryMin: app.salaryMin != null ? String(app.salaryMin) : '',
    salaryMax: app.salaryMax != null ? String(app.salaryMax) : '',
    currency: app.currency ?? '',
    employmentType: app.employmentType ?? '',
    workType: app.workType ?? '',
    location: app.location ?? '',
    recruiterId: app.recruiterId ?? '',
    cvVersion: app.cvVersion ?? '',
    jobDescription: app.jobDescription ?? '',
    coverLetter: app.coverLetter ?? '',
    notes: app.notes ?? '',
    rejectionReason: app.rejectionReason ?? '',
  };
}

export function ApplicationFormDialog({
  open,
  onOpenChange,
  application,
  defaultCompanyId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application?: Application;
  defaultCompanyId?: string;
  onSaved?: (application: Application) => void;
}) {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  const isEdit = !!application;
  const [values, setValues] = useState<FormValues>(() => toFormValues(application));
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [companyCreateOpen, setCompanyCreateOpen] = useState(false);
  const { data: companies = [] } = useCompanies();
  const { data: contacts = [] } = useContacts();
  const { data: cvVersions = [] } = useCvVersions();
  const createApplication = useCreateApplication();
  const updateApplication = useUpdateApplication();
  const pending = createApplication.isPending || updateApplication.isPending;

  useEffect(() => {
    if (open) {
      setValues(
        application ? toFormValues(application) : { ...toFormValues(undefined), companyId: defaultCompanyId ?? '' },
      );
      setErrors({});
    }
  }, [open, application, defaultCompanyId]);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K] | null) {
    setValues((v) => ({ ...v, [key]: value ?? '' }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  const recruiterOptions = values.companyId
    ? contacts.filter((c) => c.companyId === values.companyId)
    : contacts;

  const companyNameById = new Map(companies.map((c) => [c.id, c.name]));

  // Base UI's <Select.Value> renders the raw value unless `items` maps it to a label.
  const companyItems = Object.fromEntries(
    companies.map((c) => [c.id, <TruncateTooltip key={c.id}>{c.name}</TruncateTooltip>]),
  );
  const recruiterItems = Object.fromEntries(
    recruiterOptions.map((c) => [c.id, <TruncateTooltip key={c.id}>{contactLabel(c, companyNameById)}</TruncateTooltip>]),
  );
  const cvVersionItems = Object.fromEntries(
    cvVersions.map((cv) => [cv.id, <TruncateTooltip key={cv.id}>{cv.version}</TruncateTooltip>]),
  );

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof FormValues, string>> = {};
    if (!values.companyId) nextErrors.companyId = t('applicationForm.companyRequiredError');
    if (!values.position.trim()) nextErrors.position = t('applicationForm.positionRequiredError');
    if (!values.source) nextErrors.source = t('applicationForm.sourceRequiredError');
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload: Partial<Application> = {
      companyId: values.companyId,
      position: values.position.trim(),
      status: values.status as Application['status'],
      source: values.source as Application['source'],
      priority: values.priority as Application['priority'],
      vacancyUrl: values.vacancyUrl.trim() || undefined,
      applicationUrl: values.applicationUrl.trim() || undefined,
      dateFound: values.dateFound || undefined,
      dateApplied: values.dateApplied || undefined,
      nextAction: values.nextAction.trim() || undefined,
      nextActionDate: values.nextActionDate || undefined,
      salaryMin: values.salaryMin ? Number(values.salaryMin) : undefined,
      salaryMax: values.salaryMax ? Number(values.salaryMax) : undefined,
      currency: (values.currency || undefined) as Application['currency'],
      employmentType: (values.employmentType || undefined) as Application['employmentType'],
      workType: (values.workType || undefined) as Application['workType'],
      location: values.location.trim() || undefined,
      recruiterId: values.recruiterId || undefined,
      cvVersion: values.cvVersion || undefined,
      jobDescription: values.jobDescription.trim() || undefined,
      coverLetter: values.coverLetter.trim() || undefined,
      notes: values.notes.trim() || undefined,
      rejectionReason: values.rejectionReason.trim() || undefined,
    };

    const saved = isEdit
      ? await updateApplication.mutateAsync({ id: application.id, data: payload })
      : await createApplication.mutateAsync(payload);

    onOpenChange(false);
    onSaved?.(saved);
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? t('applicationForm.editTitle') : t('applicationForm.newTitle')}</DialogTitle>
            <DialogDescription>
              {isEdit ? t('applicationForm.editDescription') : t('applicationForm.newDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <section className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t('applicationForm.companyLabel')}</Label>
                  <div className="flex gap-1.5">
                    <Select
                      items={companyItems}
                      value={values.companyId}
                      onValueChange={(v) => set('companyId', v)}
                    >
                      <SelectTrigger className="flex-1" aria-invalid={!!errors.companyId}><SelectValue placeholder={t('applicationForm.selectCompany')} /></SelectTrigger>
                      <SelectContent>
                        {companies.length === 0 && (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">{t('applicationForm.noCompaniesYet')}</div>
                        )}
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <TruncateTooltip>{c.name}</TruncateTooltip>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title={t('applicationForm.createCompany')}
                      onClick={() => setCompanyCreateOpen(true)}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <FieldError message={errors.companyId} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="position">{t('applicationForm.positionLabel')}</Label>
                  <Input
                    id="position"
                    value={values.position}
                    onChange={(e) => set('position', e.target.value)}
                    aria-invalid={!!errors.position}
                    autoFocus
                  />
                  <FieldError message={errors.position} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>{t('applicationForm.statusLabel')}</Label>
                  <Select value={values.status} onValueChange={(v) => set('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {APPLICATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{enumLabel('applicationStatus', s)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>{t('applicationForm.sourceLabel')}</Label>
                  <Select value={values.source} onValueChange={(v) => set('source', v)}>
                    <SelectTrigger aria-invalid={!!errors.source}><SelectValue placeholder={t('applicationForm.selectSource')} /></SelectTrigger>
                    <SelectContent>
                      {SOURCES.map((s) => <SelectItem key={s} value={s}>{enumLabel('source', s)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.source} />
                </div>
                <div className="grid gap-2">
                  <Label>{t('applications.priorityLabel')}</Label>
                  <Select value={values.priority} onValueChange={(v) => set('priority', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{enumLabel('priority', p)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {values.status === 'Rejected' && (
                <div className="grid gap-2">
                  <Label htmlFor="rejectionReason">{t('applicationForm.rejectionReason')}</Label>
                  <Input id="rejectionReason" value={values.rejectionReason} onChange={(e) => set('rejectionReason', e.target.value)} />
                </div>
              )}
            </section>

            <section className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vacancyUrl">{t('applicationForm.vacancyUrl')}</Label>
                <Input id="vacancyUrl" value={values.vacancyUrl} onChange={(e) => set('vacancyUrl', e.target.value)} placeholder="https://..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="applicationUrl">{t('applicationForm.applicationUrl')}</Label>
                <Input id="applicationUrl" value={values.applicationUrl} onChange={(e) => set('applicationUrl', e.target.value)} placeholder="https://..." />
              </div>
            </section>

            <section className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dateFound">{t('applicationForm.dateFound')}</Label>
                <Input id="dateFound" type="date" value={values.dateFound} onChange={(e) => set('dateFound', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dateApplied">{t('applicationForm.dateApplied')}</Label>
                <Input id="dateApplied" type="date" value={values.dateApplied} onChange={(e) => set('dateApplied', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nextAction">{t('applicationForm.nextAction')}</Label>
                <Input id="nextAction" value={values.nextAction} onChange={(e) => set('nextAction', e.target.value)} placeholder={t('applicationForm.nextActionPlaceholder')} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nextActionDate">{t('applicationForm.nextActionDate')}</Label>
                <Input id="nextActionDate" type="date" value={values.nextActionDate} onChange={(e) => set('nextActionDate', e.target.value)} />
              </div>
            </section>

            <section className="grid grid-cols-4 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="salaryMin">{t('applicationForm.salaryMin')}</Label>
                <Input id="salaryMin" type="number" value={values.salaryMin} onChange={(e) => set('salaryMin', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="salaryMax">{t('applicationForm.salaryMax')}</Label>
                <Input id="salaryMax" type="number" value={values.salaryMax} onChange={(e) => set('salaryMax', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t('applicationForm.currency')}</Label>
                <Select value={values.currency} onValueChange={(v) => set('currency', v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{enumLabel('currency', c)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t('applicationForm.workType')}</Label>
                <Select value={values.workType} onValueChange={(v) => set('workType', v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {WORK_TYPES.map((w) => <SelectItem key={w} value={w}>{enumLabel('workType', w)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t('applicationForm.employmentType')}</Label>
                <Select value={values.employmentType} onValueChange={(v) => set('employmentType', v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((et) => <SelectItem key={et} value={et}>{enumLabel('employmentType', et)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">{t('applicationForm.location')}</Label>
                <Input id="location" value={values.location} onChange={(e) => set('location', e.target.value)} />
              </div>
            </section>

            <section className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t('applicationForm.recruiterContact')}</Label>
                <Select items={recruiterItems} value={values.recruiterId} onValueChange={(v) => set('recruiterId', v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {recruiterOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <TruncateTooltip>{contactLabel(c, companyNameById)}</TruncateTooltip>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t('applicationForm.cvVersion')}</Label>
                <Select items={cvVersionItems} value={values.cvVersion} onValueChange={(v) => set('cvVersion', v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {cvVersions.map((cv) => (
                      <SelectItem key={cv.id} value={cv.id}>
                        <TruncateTooltip>{cv.version}</TruncateTooltip>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="jobDescription">{t('applicationForm.jobDescription')}</Label>
                <Textarea id="jobDescription" rows={3} value={values.jobDescription} onChange={(e) => set('jobDescription', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="coverLetter">{t('applicationForm.coverLetter')}</Label>
                <Textarea id="coverLetter" rows={3} value={values.coverLetter} onChange={(e) => set('coverLetter', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">{t('common.notes')}</Label>
                <Textarea id="notes" rows={3} value={values.notes} onChange={(e) => set('notes', e.target.value)} />
              </div>
            </section>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <SubmitButton pending={pending}>
              {isEdit ? t('common.saveChanges') : t('applicationForm.createApplication')}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

      <CompanyFormDialog
        open={companyCreateOpen}
        onOpenChange={setCompanyCreateOpen}
        onSaved={(company) => set('companyId', company.id)}
      />
    </>
  );
}
