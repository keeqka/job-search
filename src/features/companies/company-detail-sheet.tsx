import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Link2, Pencil, Star, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/features/applications/status-badge';
import { formatSalaryRange } from '@/lib/utils/computed';
import { useApplications } from '@/features/applications/hooks';
import { useContacts } from '@/features/contacts/hooks';
import { useEnumLabel } from '@/i18n/enum-labels';
import type { Company } from '@/types';

export function CompanyDetailSheet({
  open,
  onOpenChange,
  company,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  const { data: applications = [] } = useApplications();
  const { data: contacts = [] } = useContacts();

  const companyApplications = useMemo(
    () => applications.filter((a) => a.companyId === company?.id),
    [applications, company],
  );
  const companyContacts = useMemo(
    () => contacts.filter((c) => c.companyId === company?.id),
    [contacts, company],
  );

  if (!company) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{company.name}</SheetTitle>
          <SheetDescription>
            {[company.industry && enumLabel('industry', company.industry), company.location, company.companySize && enumLabel('companySize', company.companySize)]
              .filter(Boolean)
              .join(' · ') || t('companyDetail.noDetailsYet')}
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
            {company.website && (
              <Button size="sm" variant="outline" render={<a href={company.website} target="_blank" rel="noreferrer" />}>
                <ExternalLink className="size-4" /> {t('common.website')}
              </Button>
            )}
            {company.linkedin && (
              <Button size="sm" variant="outline" render={<a href={company.linkedin} target="_blank" rel="noreferrer" />}>
                <Link2 className="size-4" /> {t('common.linkedin')}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label={t('applicationDetail.industry')} value={enumLabel('industry', company.industry)} />
            <Field label={t('companyDetail.companySize')} value={enumLabel('companySize', company.companySize)} />
            <Field label={t('applicationForm.location')} value={company.location} />
            <div>
              <p className="text-xs text-muted-foreground">{t('companyDetail.rating')}</p>
              {company.rating ? (
                <span className="flex items-center gap-1">
                  <Star className="size-3.5 fill-current text-amber-500" />
                  {company.rating}
                </span>
              ) : (
                <p>—</p>
              )}
            </div>
          </div>

          {company.techStack && (
            <div>
              <p className="mb-1 text-sm font-medium">{t('companyDetail.techStack')}</p>
              <div className="flex flex-wrap gap-1.5">
                {company.techStack.split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            </div>
          )}

          {company.notes && (
            <div>
              <p className="mb-1 text-sm font-medium">{t('common.notes')}</p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{company.notes}</p>
            </div>
          )}

          <Separator />

          <div>
            <p className="mb-2 text-sm font-medium">{t('companyDetail.applicationsCount', { count: companyApplications.length })}</p>
            {companyApplications.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('companyDetail.noApplicationsLinked')}</p>
            ) : (
              <ul className="space-y-2">
                {companyApplications.map((a) => (
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
            <p className="mb-2 text-sm font-medium">{t('companyDetail.contactsCount', { count: companyContacts.length })}</p>
            {companyContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('companyDetail.noContactsLinked')}</p>
            ) : (
              <ul className="space-y-2">
                {companyContacts.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                    <span>{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.role ? enumLabel('contactRole', c.role) : '—'}</span>
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
