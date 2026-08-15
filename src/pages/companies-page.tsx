import { useMemo, useState } from 'react';
import { ExternalLink, MoreHorizontal, Pencil, Plus, Trash2, Building2, Star } from 'lucide-react';
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
import { CompanyFormDialog } from '@/features/companies/company-form-dialog';
import { CompanyDetailSheet } from '@/features/companies/company-detail-sheet';
import { useCompanies, useDeleteCompany, useBulkDeleteCompanies } from '@/features/companies/hooks';
import { useSelection } from '@/hooks/useSelection';
import { TruncateTooltip } from '@/components/truncate-tooltip';
import type { Company } from '@/types';

export function CompaniesPage() {
  usePageTitle('Companies');
  const { data: companies, isLoading, isError, refetch } = useCompanies();
  const deleteCompany = useDeleteCompany();
  const bulkDeleteCompanies = useBulkDeleteCompanies();
  const selection = useSelection();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Company | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [detail, setDetail] = useState<Company | undefined>();

  const filtered = useMemo(() => {
    if (!companies) return [];
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) =>
      [c.name, c.industry, c.location, c.techStack].filter(Boolean).some((v) => v!.toLowerCase().includes(q)),
    );
  }, [companies, search]);

  const filteredIds = useMemo(() => filtered.map((c) => c.id), [filtered]);

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(company: Company) {
    setEditing(company);
    setFormOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          New company
        </Button>
      </div>

      <BulkActionsBar
        count={selection.count}
        onClear={selection.clear}
        onDelete={() => setBulkDeleteOpen(true)}
        deleting={bulkDeleteCompanies.isPending}
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load companies." onRetry={() => refetch()} />}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={Building2}
          title={companies?.length ? 'No companies match your search' : 'No companies yet'}
          description={companies?.length ? undefined : 'Add the companies you are researching or applying to.'}
          action={!companies?.length ? <Button onClick={openCreate}>Add your first company</Button> : undefined}
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
                <TableHead>Industry</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((company) => (
                <TableRow
                  key={company.id}
                  className="cursor-pointer"
                  onClick={() => setDetail(company)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selection.selected.has(company.id)}
                      onCheckedChange={() => selection.toggle(company.id)}
                      aria-label={`Select ${company.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex max-w-56 items-center gap-1.5">
                      <TruncateTooltip className="hover:underline">{company.name}</TruncateTooltip>
                      {company.website && (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{company.industry ? <Badge variant="secondary">{company.industry}</Badge> : '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{company.companySize ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{company.location ?? '—'}</TableCell>
                  <TableCell>
                    {company.rating ? (
                      <span className="flex items-center gap-1">
                        <Star className="size-3.5 fill-current text-amber-500" />
                        {company.rating}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(company)}>
                          <Pencil className="size-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeletingId(company.id)}
                        >
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

      <CompanyFormDialog open={formOpen} onOpenChange={setFormOpen} company={editing} />

      <CompanyDetailSheet
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(undefined)}
        company={detail}
        onEdit={() => {
          if (detail) openEdit(detail);
          setDetail(undefined);
        }}
        onDelete={() => {
          if (detail) setDeletingId(detail.id);
        }}
      />

      <ConfirmDeleteDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete this company?"
        description="This won't delete related applications or contacts, but they will lose their company reference."
        onConfirm={() => {
          if (deletingId) deleteCompany.mutate(deletingId);
          setDeletingId(null);
          setDetail(undefined);
        }}
      />

      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selection.count} ${selection.count === 1 ? 'company' : 'companies'}?`}
        description="This won't delete related applications or contacts, but they will lose their company reference."
        onConfirm={() => {
          bulkDeleteCompanies.mutate([...selection.selected], { onSuccess: selection.clear });
          setBulkDeleteOpen(false);
        }}
      />
    </div>
  );
}
