import { useMemo, useState } from 'react';
import { MoreHorizontal, Pencil, Plus, Trash2, Users, Mail, Send } from 'lucide-react';
import { usePageTitle } from '@/components/layout/page-title-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState, ErrorState, EmptyState } from '@/components/data-state';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { BulkActionsBar } from '@/components/bulk-actions-bar';
import { ContactFormDialog } from '@/features/contacts/contact-form-dialog';
import { useContacts, useDeleteContact, useBulkDeleteContacts } from '@/features/contacts/hooks';
import { useCompanies } from '@/features/companies/hooks';
import { useSelection } from '@/hooks/useSelection';
import { TruncateTooltip } from '@/components/truncate-tooltip';
import type { Contact } from '@/types';

export function ContactsPage() {
  usePageTitle('Contacts');
  const { data: contacts, isLoading, isError, refetch } = useContacts();
  const { data: companies = [] } = useCompanies();
  const deleteContact = useDeleteContact();
  const bulkDeleteContacts = useBulkDeleteContacts();
  const selection = useSelection();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const companyNameById = useMemo(() => new Map(companies.map((c) => [c.id, c.name])), [companies]);

  const filtered = useMemo(() => {
    if (!contacts) return [];
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      [c.name, c.role, c.email, companyNameById.get(c.companyId ?? '')].filter(Boolean).some((v) => v!.toLowerCase().includes(q)),
    );
  }, [contacts, search, companyNameById]);

  const filteredIds = useMemo(() => filtered.map((c) => c.id), [filtered]);

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }
  function openEdit(contact: Contact) {
    setEditing(contact);
    setFormOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Button onClick={openCreate}>
          <Plus className="size-4" /> New contact
        </Button>
      </div>

      <BulkActionsBar
        count={selection.count}
        onClear={selection.clear}
        onDelete={() => setBulkDeleteOpen(true)}
        deleting={bulkDeleteContacts.isPending}
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load contacts." onRetry={() => refetch()} />}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={Users}
          title={contacts?.length ? 'No contacts match your search' : 'No contacts yet'}
          description={contacts?.length ? undefined : 'Add recruiters and hiring managers you are in touch with.'}
          action={!contacts?.length ? <Button onClick={openCreate}>Add your first contact</Button> : undefined}
        />
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="animate-in fade-in-0 duration-300 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selection.isAllSelected(filteredIds)}
                    onCheckedChange={() => selection.toggleAll(filteredIds)}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Checkbox
                      checked={selection.selected.has(contact.id)}
                      onCheckedChange={() => selection.toggle(contact.id)}
                      aria-label={`Select ${contact.name}`}
                    />
                  </TableCell>
                  <TableCell className="max-w-48 font-medium">
                    <TruncateTooltip>{contact.name}</TruncateTooltip>
                  </TableCell>
                  <TableCell>{contact.role ? <Badge variant="secondary">{contact.role}</Badge> : '—'}</TableCell>
                  <TableCell className="max-w-48 text-muted-foreground">
                    <TruncateTooltip>{contact.companyId ? companyNameById.get(contact.companyId) ?? '—' : '—'}</TruncateTooltip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-foreground">
                          <Mail className="size-3.5" />
                        </a>
                      )}
                      {contact.telegram && (
                        <span className="flex items-center gap-1">
                          <Send className="size-3.5" /> {contact.telegram}
                        </span>
                      )}
                      {!contact.email && !contact.telegram && '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(contact)}>
                          <Pencil className="size-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeletingId(contact.id)}>
                          <Trash2 className="size-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ContactFormDialog open={formOpen} onOpenChange={setFormOpen} contact={editing} />

      <ConfirmDeleteDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete this contact?"
        onConfirm={() => {
          if (deletingId) deleteContact.mutate(deletingId);
          setDeletingId(null);
        }}
      />

      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selection.count} ${selection.count === 1 ? 'contact' : 'contacts'}?`}
        onConfirm={() => {
          bulkDeleteContacts.mutate([...selection.selected], { onSuccess: selection.clear });
          setBulkDeleteOpen(false);
        }}
      />
    </div>
  );
}
