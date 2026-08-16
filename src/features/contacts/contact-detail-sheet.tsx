import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Mail, Pencil, Phone, Send, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/features/applications/status-badge';
import { formatDate, formatSalaryRange } from '@/lib/utils/computed';
import { useApplications } from '@/features/applications/hooks';
import { useInterviews } from '@/features/interviews/hooks';
import { useCompanies } from '@/features/companies/hooks';
import { useEnumLabel } from '@/i18n/enum-labels';
import type { Contact } from '@/types';

export function ContactDetailSheet({
  open,
  onOpenChange,
  contact,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  const { data: applications = [] } = useApplications();
  const { data: interviews = [] } = useInterviews();
  const { data: companies = [] } = useCompanies();

  const company = useMemo(
    () => (contact?.companyId ? companies.find((c) => c.id === contact.companyId) : undefined),
    [companies, contact],
  );
  const contactApplications = useMemo(
    () => applications.filter((a) => a.recruiterId === contact?.id),
    [applications, contact],
  );
  const applicationById = useMemo(() => new Map(applications.map((a) => [a.id, a])), [applications]);
  const contactInterviews = useMemo(
    () => interviews.filter((i) => i.interviewerId === contact?.id).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')),
    [interviews, contact],
  );

  if (!contact) return null;

  const telegramHref = contact.telegram
    ? `https://t.me/${contact.telegram.replace(/^@/, '')}`
    : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{contact.name}</SheetTitle>
          <SheetDescription>
            {[contact.role && enumLabel('contactRole', contact.role), company?.name]
              .filter(Boolean)
              .join(' · ') || t('contactDetail.noDetailsYet')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {onEdit && (
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Pencil className="size-4" /> {t('common.edit')}
              </Button>
            )}
            {onDelete && (
              <Button size="sm" variant="outline" className="text-destructive" onClick={onDelete}>
                <Trash2 className="size-4" /> {t('common.delete')}
              </Button>
            )}
            {contact.email && (
              <Button size="sm" variant="outline" render={<a href={`mailto:${contact.email}`} />}>
                <Mail className="size-4" /> {t('contactForm.email')}
              </Button>
            )}
            {telegramHref && (
              <Button size="sm" variant="outline" render={<a href={telegramHref} target="_blank" rel="noreferrer" />}>
                <Send className="size-4" /> {t('contactForm.telegram')}
              </Button>
            )}
            {contact.phone && (
              <Button size="sm" variant="outline" render={<a href={`tel:${contact.phone}`} />}>
                <Phone className="size-4" /> {t('contactForm.phone')}
              </Button>
            )}
            {contact.linkedin && (
              <Button size="sm" variant="outline" render={<a href={contact.linkedin} target="_blank" rel="noreferrer" />}>
                <ExternalLink className="size-4" /> {t('common.linkedin')}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <Field label={t('applicationDetail.role')} value={contact.role ? enumLabel('contactRole', contact.role) : undefined} />
            <Field label={t('common.company')} value={company?.name} />
            <Field label={t('contactForm.email')} value={contact.email} />
            <Field label={t('contactForm.phone')} value={contact.phone} />
            <Field label={t('contactForm.firstContact')} value={formatDate(contact.firstContact)} />
            <Field label={t('contactForm.lastContact')} value={formatDate(contact.lastContact)} />
            <Field label={t('contactForm.nextContact')} value={formatDate(contact.nextContact)} />
          </div>

          {contact.notes && (
            <div>
              <p className="mb-1 text-sm font-medium">{t('common.notes')}</p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{contact.notes}</p>
            </div>
          )}

          <Separator />

          <div>
            <p className="mb-2 text-sm font-medium">{t('contactDetail.applicationsCount', { count: contactApplications.length })}</p>
            {contactApplications.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('contactDetail.noApplicationsLinked')}</p>
            ) : (
              <ul className="space-y-2">
                {contactApplications.map((a) => (
                  <li key={a.id}>
                    <button
                      onClick={() => {
                        onOpenChange(false);
                        navigate(`/applications/${a.id}`);
                      }}
                      className="flex w-full items-center justify-between rounded-md border p-2 text-left text-sm hover:bg-muted/50"
                    >
                      <span>
                        <span className="font-medium">{a.position}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{formatSalaryRange(a)}</span>
                      </span>
                      <StatusBadge status={a.status} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">{t('contactDetail.interviewsCount', { count: contactInterviews.length })}</p>
            {contactInterviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('contactDetail.noInterviewsLinked')}</p>
            ) : (
              <ul className="space-y-2">
                {contactInterviews.map((i) => (
                  <li key={i.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                    <span>
                      <span className="font-medium">{enumLabel('interviewType', i.type)}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {applicationById.get(i.applicationId)?.position ?? t('common.unknown')}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(i.date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
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
