import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
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
        Search applications...
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 text-[10px] font-medium sm:inline">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search by company, position, status, source, recruiter, notes..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Applications">
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
                      {app.position} — {company?.name ?? 'Unknown company'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {app.status} · {app.source}
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
