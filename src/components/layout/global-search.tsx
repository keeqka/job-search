import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { useApplications } from '@/features/applications/hooks';
import { useCompanies } from '@/features/companies/hooks';
import { useContacts } from '@/features/contacts/hooks';
import { useEnumLabel } from '@/i18n/enum-labels';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  const { data: applications = [] } = useApplications();
  const { data: companies = [] } = useCompanies();
  const { data: contacts = [] } = useContacts();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const companyById = useMemo(() => new Map(companies.map((c) => [c.id, c])), [companies]);
  const contactById = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);

  return (
    <>
      <Button
        variant="outline"
        className="w-56 justify-start text-muted-foreground sm:w-72"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        {t('search.trigger')}
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 text-[10px] font-medium sm:inline">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t('search.placeholder')} />
        <CommandList>
          <CommandEmpty>{t('search.noResults')}</CommandEmpty>
          <CommandGroup heading={t('nav.applications')}>
            {applications.map((app) => {
              const company = companyById.get(app.companyId);
              const recruiter = app.recruiterId ? contactById.get(app.recruiterId) : undefined;
              const searchValue = [
                company?.name,
                app.position,
                app.status,
                app.source,
                recruiter?.name,
                app.notes,
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <CommandItem
                  key={app.id}
                  value={searchValue}
                  onSelect={() => {
                    setOpen(false);
                    navigate(`/applications/${app.id}`);
                  }}
                >
                  <div className="flex flex-col">
                    <span>
                      {app.position} — {company?.name ?? t('common.unknownCompany')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {enumLabel('applicationStatus', app.status)} · {enumLabel('source', app.source)}
                      {recruiter ? ` · ${recruiter.name}` : ''}
                    </span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
